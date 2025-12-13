import React from 'react'
import { Navigate, useLocation } from 'react-router-dom'
import { useSelector } from 'react-redux'
import { selectIsAuthenticated, hasRole, selectUser, selectAuthLoading } from '../../store/slices/authSlice'
import { User } from '../../lib/supabase'
import { Box, CircularProgress } from '@mui/material'

interface ProtectedRouteProps {
  children: React.ReactNode
  requiredRole?: User['role']
  requiredPermission?: {
    resource: string
    action: string
  }
  fallbackPath?: string
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({
  children,
  requiredRole,
  requiredPermission,
  fallbackPath = '/login',
}) => {
  const location = useLocation()
  const isAuthenticated = useSelector(selectIsAuthenticated)
  const loading = useSelector(selectAuthLoading)
  const user = useSelector(selectUser)

  // Wait for auth check to complete before redirecting
  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
        <CircularProgress />
      </Box>
    )
  }

  if (!isAuthenticated) {
    return <Navigate to={fallbackPath} state={{ from: location }} replace />
  }

  if (requiredRole && !hasRole({ auth: { user } } as any, requiredRole)) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <svg className="mx-auto h-12 w-12 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
          <h3 className="mt-2 text-sm font-medium text-gray-900">Access Denied</h3>
          <p className="mt-1 text-sm text-gray-500">
            You don't have the required role ({requiredRole}) to access this page.
          </p>
          <div className="mt-6">
            <a
              href="/dashboard"
              className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              Go to Dashboard
            </a>
          </div>
        </div>
      </div>
    )
  }

  if (requiredPermission && user) {
    const { resource, action } = requiredPermission
    const hasPermission = user.role === 'admin' ||
      user.role === 'simulation_admin' ||
      (user.role === 'simulation_analyst' &&
        ((resource === 'simulations' && ['read', 'create', 'update', 'execute'].includes(action)) ||
          (resource === 'templates' && ['read', 'use', 'rate'].includes(action)) ||
          (resource === 'analytics' && ['read', 'create', 'export'].includes(action)))) ||
      (user.role === 'simulation_viewer' &&
        resource !== 'users' &&
        resource !== 'system' &&
        action === 'read')

    if (!hasPermission) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50">
          <div className="text-center">
            <svg className="mx-auto h-12 w-12 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
            <h3 className="mt-2 text-sm font-medium text-gray-900">Permission Denied</h3>
            <p className="mt-1 text-sm text-gray-500">
              You don't have permission to {action} {resource}.
            </p>
            <div className="mt-6">
              <a
                href="/dashboard"
                className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                Go to Dashboard
              </a>
            </div>
          </div>
        </div>
      )
    }
  }

  return <>{children}</>
}

export default ProtectedRoute