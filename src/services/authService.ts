import { supabase } from '../lib/supabase'
import { User } from '../lib/supabase'

export interface AuthTokens {
  accessToken: string
  refreshToken: string
  expiresAt: number
}

export interface LoginCredentials {
  email: string
  password: string
}

export interface RegisterData {
  email: string
  password: string
  name: string
  role?: User['role']
  department?: string
}

export interface AuthResponse {
  user: User | null
  tokens: AuthTokens | null
  error: string | null
}

export interface Permission {
  resource: string
  actions: string[]
}

export const ROLE_PERMISSIONS: Record<User['role'], Permission[]> = {
  admin: [
    { resource: 'simulations', actions: ['create', 'read', 'update', 'delete', 'execute'] },
    { resource: 'templates', actions: ['create', 'read', 'update', 'delete', 'publish'] },
    { resource: 'analytics', actions: ['create', 'read', 'update', 'delete', 'export'] },
    { resource: 'users', actions: ['create', 'read', 'update', 'delete', 'manage'] },
    { resource: 'system', actions: ['configure', 'monitor', 'maintain'] },
  ],
  simulation_admin: [
    { resource: 'simulations', actions: ['create', 'read', 'update', 'delete', 'execute'] },
    { resource: 'templates', actions: ['create', 'read', 'update', 'delete', 'publish'] },
    { resource: 'analytics', actions: ['create', 'read', 'update', 'export'] },
    { resource: 'users', actions: ['read', 'update'] },
    { resource: 'system', actions: ['monitor'] },
  ],
  simulation_analyst: [
    { resource: 'simulations', actions: ['create', 'read', 'update', 'execute'] },
    { resource: 'templates', actions: ['read', 'use', 'rate'] },
    { resource: 'analytics', actions: ['create', 'read', 'export'] },
    { resource: 'users', actions: ['read'] },
  ],
  simulation_viewer: [
    { resource: 'simulations', actions: ['read'] },
    { resource: 'templates', actions: ['read'] },
    { resource: 'analytics', actions: ['read'] },
  ],
  security_operator: [
    { resource: 'simulations', actions: ['read'] },
    { resource: 'templates', actions: ['read'] },
    { resource: 'analytics', actions: ['read'] },
  ],
  technical_viewer: [
    { resource: 'simulations', actions: ['read'] },
    { resource: 'templates', actions: ['read'] },
    { resource: 'analytics', actions: ['read'] },
  ],
  guest: [
    { resource: 'simulations', actions: ['read'] },
    { resource: 'templates', actions: ['read'] },
  ],
}

class AuthService {
  private tokens: AuthTokens | null = null
  private refreshTimer: NodeJS.Timeout | null = null

  constructor() {
    this.loadTokensFromStorage()
    this.setupAutoRefresh()
  }

  async login(credentials: LoginCredentials): Promise<AuthResponse> {
    const withTimeout = async <T>(p: Promise<T>, ms: number, label: string): Promise<T> => {
      return new Promise<T>((resolve, reject) => {
        const t = setTimeout(() => reject(new Error(`${label} timeout after ${ms}ms`)), ms)
        p.then((v) => { clearTimeout(t); resolve(v) }).catch((e) => { clearTimeout(t); reject(e) })
      })
    }
    const t0 = Date.now()
    const envOk = Boolean((import.meta as any).env?.VITE_SUPABASE_URL && (import.meta as any).env?.VITE_SUPABASE_ANON_KEY)
    if (!envOk) {
      return { user: null, tokens: null, error: 'Environment misconfigured: missing API key.' }
    }
    if (circuitOpen()) {
      return { user: null, tokens: null, error: 'Authentication temporarily blocked due to repeated timeouts. Please check network and try again shortly.' }
    }
    try {
      const signInRes = await withTimeout(
        supabase.auth.signInWithPassword({ email: credentials.email, password: credentials.password }),
        10000,
        'Auth'
      )
      const { data, error } = signInRes as any
      if (error && /timeout/i.test(String(error?.message))) {
        const retryRes = await withTimeout(
          supabase.auth.signInWithPassword({ email: credentials.email, password: credentials.password }),
          5000,
          'AuthRetry'
        )
        const { data: rData, error: rErr } = retryRes as any
        if (rErr) throw rErr
        if (!rData?.user || !rData?.session) throw new Error('Authentication failed: no session returned (retry)')
        Object.assign(data, rData)
      }
      if (error && /apikey|api key|unauthor/i.test(String(error?.message))) {
        throw new Error('Environment misconfigured: API key missing or invalid')
      }
      if (!data.user || !data.session) throw new Error('Authentication failed: no session returned')

      let userProfile: User | null = null
      try {
        const userFetchRes = await withTimeout(
          supabase.from('users').select('*').eq('id', data.user.id).single(),
          8000,
          'ProfileFetch'
        )
        const { data: userData } = userFetchRes as any
        if (userData) userProfile = userData as User
      } catch (profileErr) {
        console.error('Profile fetch error:', profileErr)
      }

      if (!userProfile) {
        const fallback: User = {
          id: data.user.id,
          email: data.user.email || credentials.email,
          name: (data.user.user_metadata as any)?.full_name || (data.user.user_metadata as any)?.name || credentials.email,
          role: 'technical_viewer',
          is_active: true,
          last_login: new Date().toISOString(),
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        }
        try {
          await withTimeout(
            supabase.from('users').upsert({
              id: fallback.id,
              email: fallback.email,
              name: fallback.name,
              role: fallback.role,
              is_active: true,
              last_login: fallback.last_login,
              created_at: fallback.created_at,
              updated_at: fallback.updated_at,
            }, { onConflict: 'id' }),
            8000,
            'ProfileUpsert'
          )
          userProfile = fallback
        } catch (upErr) {
          console.error('Profile upsert error:', upErr)
          // proceed with minimal user derived from auth
          userProfile = fallback
        }
      } else {
        try {
          await supabase.from('users').update({ last_login: new Date().toISOString(), updated_at: new Date().toISOString() }).eq('id', userProfile.id)
        } catch { }
      }

      const tokens: AuthTokens = {
        accessToken: data.session.access_token,
        refreshToken: data.session.refresh_token,
        expiresAt: Date.now() + (data.session.expires_in * 1000),
      }
      this.saveTokens(tokens)
      this.setupAutoRefresh()
      console.info('Login completed in', Date.now() - t0, 'ms')

      return { user: userProfile, tokens, error: null }
    } catch (error) {
      const msg = error instanceof Error ? error.message : 'Login failed'
      console.error('Login error:', msg)
      if (/timeout/i.test(msg)) recordAuthFail()
      const normalized = /timeout/i.test(msg)
        ? 'Authentication timeout. Please check your network or try again.'
        : (/401|unauthor/i.test(msg)
          ? 'Invalid credentials or unauthorized.'
          : (/Environment misconfigured/i.test(msg) ? 'Environment misconfigured: missing API key.' : msg))
      return { user: null, tokens: null, error: normalized }
    }
  }

  async register(userData: RegisterData): Promise<AuthResponse> {
    try {
      const { data, error } = await supabase.auth.signUp({
        email: userData.email,
        password: userData.password,
        options: {
          data: {
            full_name: userData.name,
          },
        },
      })

      if (error) throw error

      if (data.user) {
        // Create user profile
        const { error: profileError } = await supabase
          .from('users')
          .insert({
            id: data.user.id,
            email: userData.email,
            name: userData.name,
            role: userData.role || 'simulation_viewer',
            department: userData.department,
            is_active: true,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          })

        if (profileError) throw profileError

        const tokens: AuthTokens = {
          accessToken: data.session?.access_token || '',
          refreshToken: data.session?.refresh_token || '',
          expiresAt: Date.now() + ((data.session?.expires_in || 3600) * 1000),
        }

        const user: User = {
          id: data.user.id,
          email: userData.email,
          name: userData.name,
          role: userData.role || 'simulation_viewer',
          department: userData.department,
          is_active: true,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        }

        this.saveTokens(tokens)
        this.setupAutoRefresh()

        return {
          user,
          tokens,
          error: null,
        }
      }

      return {
        user: null,
        tokens: null,
        error: 'Registration failed',
      }
    } catch (error) {
      return {
        user: null,
        tokens: null,
        error: error instanceof Error ? error.message : 'Registration failed',
      }
    }
  }

  async logout(): Promise<void> {
    try {
      await supabase.auth.signOut()
      this.clearTokens()
      this.clearRefreshTimer()
    } catch (error) {
      console.error('Logout error:', error)
    }
  }

  async refreshTokens(): Promise<AuthTokens | null> {
    try {
      if (!this.tokens?.refreshToken) return null

      const { data, error } = await supabase.auth.refreshSession({
        refresh_token: this.tokens.refreshToken,
      })

      if (error) throw error

      if (data.session) {
        const newTokens: AuthTokens = {
          accessToken: data.session.access_token,
          refreshToken: data.session.refresh_token,
          expiresAt: Date.now() + (data.session.expires_in * 1000),
        }

        this.saveTokens(newTokens)
        this.setupAutoRefresh()
        return newTokens
      }

      return null
    } catch (error) {
      console.error('Token refresh error:', error)
      this.clearTokens()
      return null
    }
  }

  async getCurrentUser(): Promise<User | null> {
    try {
      const { data: { user } } = await supabase.auth.getUser()

      if (user) {
        const provider = Array.isArray((user as any).identities) && (user as any).identities.length > 0
          ? (user as any).identities[0]?.provider || null
          : ((user as any).app_metadata?.provider || null)
        const providerEmail = (user as any).email || (user as any).user_metadata?.email || null
        const providerId = (user as any).user_metadata?.sub || (user as any).id || null

        const { data: userData } = await supabase
          .from('users')
          .select('*')
          .eq('id', user.id)
          .single()

        if (userData) {
          await supabase
            .from('users')
            .update({
              last_login: new Date().toISOString(),
              updated_at: new Date().toISOString(),
              provider: provider ?? userData.provider,
              provider_id: providerId ?? userData.provider_id,
              provider_email: providerEmail ?? userData.provider_email,
            })
            .eq('id', user.id)

          // Log login success event
          await supabase.from('login_events').insert({
            user_id: user.id,
            event_type: 'login_success',
            provider: provider || 'password',
            status: 'ok',
          })

          return userData as User
        }

        const fallback: User = {
          id: user.id,
          email: user.email || '',
          name: (user.user_metadata as any)?.full_name || (user.user_metadata as any)?.name || '',
          role: 'technical_viewer',
          is_active: true,
          last_login: new Date().toISOString(),
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        }

        await supabase
          .from('users')
          .upsert({
            id: fallback.id,
            email: fallback.email,
            name: fallback.name,
            role: fallback.role,
            is_active: true,
            last_login: fallback.last_login,
            created_at: fallback.created_at,
            updated_at: fallback.updated_at,
            provider: provider,
            provider_id: providerId,
            provider_email: providerEmail,
          }, { onConflict: 'id' })

        // Log login success on first creation
        await supabase.from('login_events').insert({
          user_id: user.id,
          event_type: 'login_success',
          provider: provider || 'password',
          status: 'created',
        })

        return fallback
      }

      return null
    } catch (error) {
      console.error('Get current user error:', error)
      // Log error event
      try {
        const { data: { user } } = await supabase.auth.getUser()
        if (user) {
          await supabase.from('login_events').insert({
            user_id: user.id,
            event_type: 'login_error',
            provider: (user as any)?.app_metadata?.provider || null,
            status: 'error',
            error_message: (error as any)?.message || String(error)
          })
        }
      } catch { /* ignore */ }
      return null
    }
  }

  hasPermission(user: User, resource: string, action: string): boolean {
    const permissions = ROLE_PERMISSIONS[user.role]
    if (!permissions) return false

    const resourcePermissions = permissions.find(p => p.resource === resource)
    if (!resourcePermissions) return false

    return resourcePermissions.actions.includes(action)
  }

  hasRole(user: User, requiredRole: User['role']): boolean {
    const roleHierarchy: User['role'][] = ['guest', 'technical_viewer', 'simulation_viewer', 'security_operator', 'simulation_analyst', 'simulation_admin', 'admin']
    const userRoleIndex = roleHierarchy.indexOf(user.role)
    const requiredRoleIndex = roleHierarchy.indexOf(requiredRole)

    return userRoleIndex >= requiredRoleIndex
  }

  isTokenExpired(): boolean {
    if (!this.tokens) return true
    return Date.now() >= this.tokens.expiresAt
  }

  getTokens(): AuthTokens | null {
    return this.tokens
  }

  private saveTokens(tokens: AuthTokens): void {
    this.tokens = tokens
    localStorage.setItem('auth_tokens', JSON.stringify(tokens))
  }

  private loadTokensFromStorage(): void {
    try {
      const stored = localStorage.getItem('auth_tokens')
      if (stored) {
        this.tokens = JSON.parse(stored)
      }
    } catch (error) {
      console.error('Error loading tokens from storage:', error)
      this.clearTokens()
    }
  }

  private clearTokens(): void {
    this.tokens = null
    localStorage.removeItem('auth_tokens')
  }

  private setupAutoRefresh(): void {
    this.clearRefreshTimer()

    if (this.tokens && !this.isTokenExpired()) {
      // Refresh 5 minutes before expiration
      const refreshTime = this.tokens.expiresAt - Date.now() - (5 * 60 * 1000)

      if (refreshTime > 0) {
        this.refreshTimer = setTimeout(() => {
          this.refreshTokens()
        }, refreshTime)
      }
    }
  }

  private clearRefreshTimer(): void {
    if (this.refreshTimer) {
      clearTimeout(this.refreshTimer)
      this.refreshTimer = null
    }
  }
}

export const authService = new AuthService()
export default authService
let authFailCount = 0
let authFirstFailAt = 0
const AUTH_FAIL_WINDOW_MS = 60000
const AUTH_FAIL_THRESHOLD = 3

function recordAuthFail() {
  const now = Date.now()
  if (!authFirstFailAt || now - authFirstFailAt > AUTH_FAIL_WINDOW_MS) {
    authFirstFailAt = now
    authFailCount = 1
  } else {
    authFailCount += 1
  }
}

function circuitOpen() {
  const now = Date.now()
  return authFailCount >= AUTH_FAIL_THRESHOLD && (now - authFirstFailAt) <= AUTH_FAIL_WINDOW_MS
}
