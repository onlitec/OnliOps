import { User } from '../lib/supabase'

// Credenciais hardcoded para desenvolvimento local
const LOCAL_USERS = {
  'teste@calabasas.local': {
    id: '00000000-0000-0000-0000-000000000001',
    email: 'teste@calabasas.local',
    password: 'teste123',
    name: 'Usuário Teste',
    role: 'technical_viewer' as const,
  },
  'admin@calabasas.local': {
    id: '00000000-0000-0000-0000-000000000002',
    email: 'admin@calabasas.local',
    password: 'admin123',
    name: 'Administrador',
    role: 'admin' as const,
  },
}

export class LocalAuthService {
  private currentUser: User | null = null

  async login(email: string, password: string): Promise<{ user: User | null; error: string | null }> {
    // Simular delay de rede
    await new Promise(resolve => setTimeout(resolve, 500))

    const userCredentials = LOCAL_USERS[email as keyof typeof LOCAL_USERS]

    if (!userCredentials || userCredentials.password !== password) {
      return { user: null, error: 'Email ou senha inválidos' }
    }

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
