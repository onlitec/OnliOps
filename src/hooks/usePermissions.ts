import { useState, useEffect } from 'react'
import { useAppSelector } from '../store/hooks'
import { api } from '../services/api'

interface Permissions {
    [resource: string]: string[]
}

export function usePermissions() {
    const { currentProject } = useAppSelector(state => state.project)
    const [permissions, setPermissions] = useState<Permissions>({})
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        loadPermissions()
    }, [currentProject])

    const loadPermissions = async () => {
        setLoading(true)
        try {
            // Get current user ID from storage/session
            const userId = localStorage.getItem('userId')
            if (!userId) {
                setPermissions({})
                return
            }

            const userPerms = await api.getUserPermissions(userId)
            
            // Aggregate permissions from all roles
            const aggregated: Permissions = {}
            userPerms.forEach(perm => {
                const rolePerms = perm.permissions || {}
                Object.entries(rolePerms).forEach(([resource, actions]) => {
                    if (!aggregated[resource]) {
                        aggregated[resource] = []
                    }
                    (actions as string[]).forEach(action => {
                        if (!aggregated[resource].includes(action)) {
                            aggregated[resource].push(action)
                        }
                    })
                })
            })
            
            setPermissions(aggregated)
        } catch (error) {
            console.error('Error loading permissions:', error)
            setPermissions({})
        } finally {
            setLoading(false)
        }
    }

    const can = (resource: string, action: string): boolean => {
        return permissions[resource]?.includes(action) || false
    }

    const canAny = (resource: string): boolean => {
        return permissions[resource]?.length > 0 || false
    }

    return { can, canAny, loading, permissions }
}
