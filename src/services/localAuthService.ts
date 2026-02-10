import { User } from '../lib/supabase'

// Super admin padrão - sempre funciona como fallback
const SUPER_ADMIN = {
  id: '00000000-0000-0000-0000-000000000000',
  email: 'onliopsadmin',
  password: 'OnliOps@2025!',
  name: 'OnliOps Admin',
  role: 'admin' as const,
}

export class LocalAuthService {
  private currentUser: User | null = null

  async login(emailOrUsername: string, password: string): Promise<{ user: User | null; error: string | null }> {
    // Simular delay de rede
    await new Promise(resolve => setTimeout(resolve, 300))

    // 1. Verificar se é o super admin
    if (
      (emailOrUsername === SUPER_ADMIN.email || emailOrUsername === 'onliopsadmin') && 
      password === SUPER_ADMIN.password
    ) {
      const user: User = {
        id: SUPER_ADMIN.id,
        email: 'onliopsadmin@onliops.local',
        name: SUPER_ADMIN.name,
        role: SUPER_ADMIN.role,
        is_active: true,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      }

      this.currentUser = user
      localStorage.setItem('local_auth_user', JSON.stringify(user))
      console.log('[Auth] Super admin login successful')
      return { user, error: null }
    }

    // 2. Tentar autenticar via API (consulta ao banco de dados)
    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ emailOrUsername, password })
      })

      const data = await response.json()

      if (!response.ok) {
        return { user: null, error: data.error || 'Email ou senha inválidos' }
      }

      const user: User = {
        id: data.user.id,
        email: data.user.email,
        name: data.user.name,
        role: data.user.role || 'viewer',
        is_active: true,
        created_at: data.user.created_at,
        updated_at: data.user.updated_at || data.user.created_at,
      }

      this.currentUser = user
      localStorage.setItem('local_auth_user', JSON.stringify(user))
      console.log('[Auth] Database login successful for:', user.email)
      return { user, error: null }

    } catch (error) {
      console.error('[Auth] API login failed, trying fallback:', error)
      
      // 3. Fallback para usuários locais legados
      const legacyUsers: Record<string, { id: string; email: string; password: string; name: string; role: 'admin' | 'technical_viewer' }> = {
        'teste@onliops.local': {
          id: '00000000-0000-0000-0000-000000000001',
          email: 'teste@onliops.local',
          password: 'teste123',
          name: 'Usuário Teste',
          role: 'technical_viewer',
        },
        'admin@onliops.local': {
          id: '00000000-0000-0000-0000-000000000002',
          email: 'admin@onliops.local',
          password: 'admin123',
          name: 'Administrador',
          role: 'admin',
        },
      }

      const userCredentials = legacyUsers[emailOrUsername]
      if (userCredentials && userCredentials.password === password) {
        const user: User = {
          id: userCredentials.id,
          email: userCredentials.email,
          name: userCredentials.name,
          role: userCredentials.role,
          is_active: true,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        }

        this.currentUser = user
        localStorage.setItem('local_auth_user', JSON.stringify(user))
        return { user, error: null }
      }

      return { user: null, error: 'Email ou senha inválidos' }
    }
  }

  async logout(): Promise<void> {
    this.currentUser = null
    localStorage.removeItem('local_auth_user')
  }

  async getCurrentUser(): Promise<User | null> {
    if (this.currentUser) {
      return this.currentUser
    }

    const stored = localStorage.getItem('local_auth_user')
    if (stored) {
      try {
        this.currentUser = JSON.parse(stored)
        return this.currentUser
      } catch {
        localStorage.removeItem('local_auth_user')
      }
    }

    return null
  }

  isAuthenticated(): boolean {
    return this.currentUser !== null || !!localStorage.getItem('local_auth_user')
  }
}

export const localAuthService = new LocalAuthService()
