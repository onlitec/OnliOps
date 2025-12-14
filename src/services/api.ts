import { NetworkDevice } from '../lib/supabase'

const API_BASE = '/api'

const getHeaders = (contentType = 'application/json') => {
    const headers: Record<string, string> = {
        'Content-Type': contentType
    }
    const projectId = localStorage.getItem('currentProjectId')
    if (projectId) {
        headers['X-Project-ID'] = projectId
    }
    return headers
}

const getAuthHeaders = () => {
    const headers: Record<string, string> = {}
    const projectId = localStorage.getItem('currentProjectId')
    if (projectId) {
        headers['X-Project-ID'] = projectId
    }
    return headers
}

export const api = {
    // === Multi-Tenancy ===
    getClients: async (): Promise<any[]> => {
        const response = await fetch(`${API_BASE}/clients`)
        if (!response.ok) throw new Error('Failed to fetch clients')
        return response.json()
    },

    createClient: async (data: any): Promise<any> => {
        const response = await fetch(`${API_BASE}/clients`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data)
        })
        if (!response.ok) throw new Error('Failed to create client')
        return response.json()
    },

    getClientProjects: async (clientId: string): Promise<any[]> => {
        const response = await fetch(`${API_BASE}/clients/${clientId}/projects`)
        if (!response.ok) throw new Error('Failed to fetch client projects')
        return response.json()
    },

    createProject: async (data: any): Promise<any> => {
        const response = await fetch(`${API_BASE}/projects`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data)
        })
        if (!response.ok) throw new Error('Failed to create project')
        return response.json()
    },

    getProject: async (id: string): Promise<any> => {
        const response = await fetch(`${API_BASE}/projects/${id}`)
        if (!response.ok) throw new Error('Failed to fetch project')
        return response.json()
    },

    updateProject: async (id: string, data: { name?: string; description?: string; status?: string }): Promise<any> => {
        const response = await fetch(`${API_BASE}/projects/${id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data)
        })
        if (!response.ok) throw new Error('Failed to update project')
        return response.json()
    },

    deleteProject: async (id: string): Promise<{ success: boolean; message: string; deleted: any }> => {
        const response = await fetch(`${API_BASE}/projects/${id}`, {
            method: 'DELETE'
        })
        if (!response.ok) {
            const error = await response.json()
            throw new Error(error.error || 'Failed to delete project')
        }
        return response.json()
    },

    // === Platform Metrics ===
    getPlatformMetrics: async (): Promise<any> => {
        const response = await fetch(`${API_BASE}/platform/metrics`)
        if (!response.ok) throw new Error('Failed to fetch platform metrics')
        return response.json()
    },

    getProjectsSummary: async (): Promise<any[]> => {
        const response = await fetch(`${API_BASE}/platform/projects/summary`)
        if (!response.ok) throw new Error('Failed to fetch projects summary')
        return response.json()
    },

    // === Roles & Permissions ===
    getRoles: async (): Promise<any[]> => {
        const response = await fetch(`${API_BASE}/roles`)
        if (!response.ok) throw new Error('Failed to fetch roles')
        return response.json()
    },

    getUserPermissions: async (userId: string): Promise<any[]> => {
        const response = await fetch(`${API_BASE}/users/${userId}/permissions`)
        if (!response.ok) throw new Error('Failed to fetch user permissions')
        return response.json()
    },

    addUserPermission: async (userId: string, data: any): Promise<any> => {
        const response = await fetch(`${API_BASE}/users/${userId}/permissions`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data)
        })
        if (!response.ok) throw new Error('Failed to add user permission')
        return response.json()
    },

    deleteUserPermission: async (userId: string, permissionId: string): Promise<void> => {
        const response = await fetch(`${API_BASE}/users/${userId}/permissions/${permissionId}`, {
            method: 'DELETE'
        })
        if (!response.ok) throw new Error('Failed to delete user permission')
    },

    // List VLANs
    getVlans: async (): Promise<any[]> => {
        const response = await fetch(`${API_BASE}/vlans`, { headers: getAuthHeaders() })
        if (!response.ok) throw new Error('Failed to fetch VLANs')
        return response.json()
    },

    createVlan: async (vlan: any): Promise<any> => {
        const response = await fetch(`${API_BASE}/vlans`, {
            method: 'POST',
            headers: getHeaders(),
            body: JSON.stringify(vlan)
        })
        if (!response.ok) throw new Error('Failed to create VLAN')
        return response.json()
    },

    updateVlan: async (id: number, vlan: any): Promise<any> => {
        const response = await fetch(`${API_BASE}/vlans/${id}`, {
            method: 'PUT',
            headers: getHeaders(),
            body: JSON.stringify(vlan)
        })
        if (!response.ok) throw new Error('Failed to update VLAN')
        return response.json()
    },

    deleteVlan: async (id: number): Promise<void> => {
        const response = await fetch(`${API_BASE}/vlans/${id}`, {
            method: 'DELETE',
            headers: getAuthHeaders()
        })
        if (!response.ok) throw new Error('Failed to delete VLAN')
    },

    // Categories (Global/Shared usually, but can be scoped if needed. For now Global)
    getCategories: async (): Promise<any[]> => {
        const response = await fetch(`${API_BASE}/categories`) // Categories are global in this design
        if (!response.ok) throw new Error('Failed to fetch categories')
        return response.json()
    },

    createCategory: async (category: any): Promise<any> => {
        const response = await fetch(`${API_BASE}/categories`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(category)
        })
        if (!response.ok) throw new Error('Failed to create category')
        return response.json()
    },

    updateCategory: async (slug: string, category: any): Promise<any> => {
        const response = await fetch(`${API_BASE}/categories/${slug}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(category)
        })
        if (!response.ok) throw new Error('Failed to update category')
        return response.json()
    },

    deleteCategory: async (slug: string): Promise<void> => {
        const response = await fetch(`${API_BASE}/categories/${slug}`, {
            method: 'DELETE'
        })
        if (!response.ok) throw new Error('Failed to delete category')
    },

    // List devices
    getDevices: async (): Promise<NetworkDevice[]> => {
        const response = await fetch(`${API_BASE}/network_devices`, { headers: getAuthHeaders() })
        if (!response.ok) throw new Error('Failed to fetch devices')
        return response.json()
    },

    // Create device
    createDevice: async (device: Partial<NetworkDevice>): Promise<NetworkDevice> => {
        const response = await fetch(`${API_BASE}/network_devices`, {
            method: 'POST',
            headers: getHeaders(),
            body: JSON.stringify(device)
        })
        if (!response.ok) throw new Error('Failed to create device')
        return response.json()
    },

    // Update device
    updateDevice: async (id: string, device: Partial<NetworkDevice>): Promise<NetworkDevice> => {
        const response = await fetch(`${API_BASE}/network_devices/${id}`, {
            method: 'PUT',
            headers: getHeaders(),
            body: JSON.stringify(device)
        })
        if (!response.ok) throw new Error('Failed to update device')
        return response.json()
    },

    // Delete device
    deleteDevice: async (id: string): Promise<void> => {
        const response = await fetch(`${API_BASE}/network_devices/${id}`, {
            method: 'DELETE',
            headers: getAuthHeaders()
        })
        if (!response.ok) throw new Error('Failed to delete device')
    },

    // Topology
    getConnections: async (): Promise<any[]> => {
        const response = await fetch(`${API_BASE}/topology/connections`, { headers: getAuthHeaders() })
        if (!response.ok) throw new Error('Failed to fetch connections')
        return response.json()
    },

    createConnection: async (connection: any): Promise<any> => {
        const response = await fetch(`${API_BASE}/topology/connections`, {
            method: 'POST',
            headers: getHeaders(),
            body: JSON.stringify(connection)
        })
        if (!response.ok) throw new Error('Failed to create connection')
        return response.json()
    },

    deleteConnection: async (id: number): Promise<void> => {
        const response = await fetch(`${API_BASE}/topology/connections/${id}`, {
            method: 'DELETE',
            headers: getAuthHeaders()
        })
        if (!response.ok) throw new Error('Failed to delete connection')
    },

    // Users (Global)
    getUsers: async (): Promise<any[]> => {
        const response = await fetch(`${API_BASE}/users`)
        if (!response.ok) throw new Error('Failed to fetch users')
        return response.json()
    },

    updateUser: async (id: string, data: any): Promise<any> => {
        const response = await fetch(`${API_BASE}/users/${id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data)
        })
        if (!response.ok) throw new Error('Failed to update user')
        return response.json()
    },

    deleteUser: async (id: string): Promise<void> => {
        const response = await fetch(`${API_BASE}/users/${id}`, {
            method: 'DELETE'
        })
        if (!response.ok) throw new Error('Failed to delete user')
    },

    // === User Profile ===
    getProfile: async (userId: string): Promise<any> => {
        const response = await fetch(`${API_BASE}/profile/${userId}`)
        if (!response.ok) throw new Error('Failed to fetch profile')
        return response.json()
    },

    updateProfile: async (userId: string, data: { name?: string; email?: string; phone?: string; avatar_url?: string }): Promise<any> => {
        const response = await fetch(`${API_BASE}/profile/${userId}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data)
        })
        if (!response.ok) {
            const error = await response.json()
            throw new Error(error.error || 'Failed to update profile')
        }
        return response.json()
    },

    changePassword: async (userId: string, currentPassword: string, newPassword: string): Promise<any> => {
        const response = await fetch(`${API_BASE}/profile/${userId}/password`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ currentPassword, newPassword })
        })
        if (!response.ok) {
            const error = await response.json()
            throw new Error(error.error || 'Failed to change password')
        }
        return response.json()
    },

    // Settings (Global)
    getSettings: async (): Promise<any> => {
        const response = await fetch(`${API_BASE}/settings`)
        if (!response.ok) throw new Error('Failed to fetch settings')
        return response.json()
    },

    getSetting: async (key: string): Promise<any> => {
        const response = await fetch(`${API_BASE}/settings/${key}`)
        if (!response.ok) throw new Error('Failed to fetch setting')
        return response.json()
    },

    updateSetting: async (key: string, value: any): Promise<any> => {
        const response = await fetch(`${API_BASE}/settings/${key}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ value })
        })
        if (!response.ok) throw new Error('Failed to update setting')
        return response.json()
    },

    // Logs (Scoped by Project)
    getAuditLogs: async (limit = 100, offset = 0): Promise<any[]> => {
        const response = await fetch(`${API_BASE}/logs/audit?limit=${limit}&offset=${offset}`, { headers: getAuthHeaders() })
        if (!response.ok) throw new Error('Failed to fetch audit logs')
        return response.json()
    },

    getLoginLogs: async (limit = 100, offset = 0): Promise<any[]> => {
        const response = await fetch(`${API_BASE}/logs/login?limit=${limit}&offset=${offset}`) // Login logs are typically global
        if (!response.ok) throw new Error('Failed to fetch login logs')
        return response.json()
    },

    createAuditLog: async (log: any): Promise<any> => {
        const response = await fetch(`${API_BASE}/logs/audit`, {
            method: 'POST',
            headers: getHeaders(),
            body: JSON.stringify(log)
        })
        if (!response.ok) throw new Error('Failed to create audit log')
        return response.json()
    }
}
