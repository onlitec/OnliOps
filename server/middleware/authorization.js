// Authorization Middleware for OnliOps Platform
const { Pool } = require('pg')

const pool = new Pool({
    host: '127.0.0.1',
    port: 5432,
    database: 'calabasas_local',
    user: 'calabasas_admin',
    password: 'Calabasas@2025!'
})

// Check if user has permission for a resource and action
const checkPermission = (resource, action) => {
    return async (req, res, next) => {
        try {
            const userId = req.session?.userId
            if (!userId) {
                return res.status(401).json({ error: 'Não autenticado' })
            }

            const projectId = req.projectId || req.query.project_id || req.body.project_id

            // Get user permissions
            const { rows } = await pool.query(`
                SELECT r.permissions, up.client_id, up.project_id
                FROM user_permissions up
                JOIN roles r ON up.role_id = r.id
                WHERE up.user_id = $1
                AND (
                    up.client_id IS NULL -- Platform admin
                    OR up.project_id = $2 -- Direct project access
                    OR (up.client_id = (SELECT client_id FROM projects WHERE id = $2) AND up.project_id IS NULL) -- Client access
                )
            `, [userId, projectId])

            if (rows.length === 0) {
                return res.status(403).json({ error: 'Acesso negado' })
            }

            // Check if any role has the required permission
            const hasPermission = rows.some(row => {
                const permissions = row.permissions
                return permissions[resource] && permissions[resource].includes(action)
            })

            if (!hasPermission) {
                return res.status(403).json({ error: `Sem permissão para ${action} em ${resource}` })
            }

            next()
        } catch (error) {
            console.error('Authorization error:', error)
            res.status(500).json({ error: error.message })
        }
    }
}

module.exports = { checkPermission, pool }
