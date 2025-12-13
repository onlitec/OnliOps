import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit'
import { authService, LoginCredentials, RegisterData, ROLE_PERMISSIONS } from '../../services/authService'
import { localAuthService } from '../../services/localAuthService'
import { User } from '../../lib/supabase'
import { RootState } from '../index'

// Flag para usar autenticação local
// Usa local se: não tiver URL configurada OU for localhost OU for uma URL inválida
const USE_LOCAL_AUTH = true // Forçar autenticação local sempre

interface AuthState {
  user: User | null
  isAuthenticated: boolean
  loading: boolean
  error: string | null
}

const initialState: AuthState = {
  user: null,
  isAuthenticated: false,
  loading: true, // Start as true to wait for checkAuth
  error: null,
}

// Async thunks
export const login = createAsyncThunk(
  'auth/login',
  async (credentials: LoginCredentials) => {
    // Usar autenticação local se Supabase não estiver configurado
    if (USE_LOCAL_AUTH) {
      const response = await localAuthService.login(credentials.email, credentials.password)
      if (response.error) throw new Error(response.error)
      return response.user!
    }
    
    const response = await authService.login(credentials)
    if (response.error) throw new Error(response.error)
    return response.user!
  }
)

export const register = createAsyncThunk(
  'auth/register',
  async (userData: RegisterData) => {
    const response = await authService.register(userData)
    if (response.error) throw new Error(response.error)
    return response.user!
  }
)

export const logout = createAsyncThunk('auth/logout', async () => {
  if (USE_LOCAL_AUTH) {
    await localAuthService.logout()
  } else {
    await authService.logout()
  }
})

export const checkAuth = createAsyncThunk('auth/checkAuth', async () => {
  if (USE_LOCAL_AUTH) {
    const user = await localAuthService.getCurrentUser()
    return user
  }
  
  const user = await authService.getCurrentUser()
  return user
})

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    clearError: (state) => {
      state.error = null
    },
  },
  extraReducers: (builder) => {
    builder
      // Login
      .addCase(login.pending, (state) => {
        state.loading = true
        state.error = null
      })
      .addCase(login.fulfilled, (state, action: PayloadAction<User>) => {
        state.loading = false
        state.user = action.payload
        state.isAuthenticated = true
        state.error = null
      })
      .addCase(login.rejected, (state, action) => {
        state.loading = false
        state.error = action.error.message || 'Login failed'
        state.isAuthenticated = false
      })
      // Register
      .addCase(register.pending, (state) => {
        state.loading = true
        state.error = null
      })
      .addCase(register.fulfilled, (state, action: PayloadAction<User>) => {
        state.loading = false
        state.user = action.payload
        state.isAuthenticated = true
        state.error = null
      })
      .addCase(register.rejected, (state, action) => {
        state.loading = false
        state.error = action.error.message || 'Registration failed'
        state.isAuthenticated = false
      })
      // Logout
      .addCase(logout.fulfilled, (state) => {
        state.user = null
        state.isAuthenticated = false
        state.error = null
      })
      // Check auth
      .addCase(checkAuth.pending, (state) => {
        state.loading = true
      })
      .addCase(checkAuth.fulfilled, (state, action: PayloadAction<User | null>) => {
        state.loading = false
        state.user = action.payload
        state.isAuthenticated = !!action.payload
      })
      .addCase(checkAuth.rejected, (state) => {
        state.loading = false
        state.user = null
        state.isAuthenticated = false
      })
  },
})

export const { clearError } = authSlice.actions

// Selectors
export const selectAuth = (state: RootState) => state.auth
export const selectUser = (state: RootState) => state.auth.user
export const selectIsAuthenticated = (state: RootState) => state.auth.isAuthenticated
export const selectAuthLoading = (state: RootState) => state.auth.loading
export const selectAuthError = (state: RootState) => state.auth.error

// Role-based selectors
export const selectUserRole = (state: RootState) => state.auth.user?.role
export const selectUserPermissions = (state: RootState) => {
  const role = state.auth.user?.role
  return role ? ROLE_PERMISSIONS[role] : []
}

// Permission check functions
export const hasPermission = (state: RootState, resource: string, action: string): boolean => {
  const user = state.auth.user
  if (!user) return false
  return authService.hasPermission(user, resource, action)
}

export const hasRole = (state: RootState, requiredRole: User['role']): boolean => {
  const user = state.auth.user
  if (!user) return false
  return authService.hasRole(user, requiredRole)
}

export const canAccessSimulation = (state: RootState): boolean => {
  return hasPermission(state, 'simulations', 'read')
}

export const canCreateSimulation = (state: RootState): boolean => {
  return hasPermission(state, 'simulations', 'create')
}

export const canExecuteSimulation = (state: RootState): boolean => {
  return hasPermission(state, 'simulations', 'execute')
}

export const canManageTemplates = (state: RootState): boolean => {
  return hasPermission(state, 'templates', 'create')
}

export const canAccessAnalytics = (state: RootState): boolean => {
  return hasPermission(state, 'analytics', 'read')
}

export const canManageUsers = (state: RootState): boolean => {
  return hasPermission(state, 'users', 'manage')
}

export const canConfigureSystem = (state: RootState): boolean => {
  return hasPermission(state, 'system', 'configure')
}

export default authSlice.reducer
