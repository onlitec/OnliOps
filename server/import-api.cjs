// Load environment variables from .env file
require('dotenv').config({ path: require('path').join(__dirname, '..', '.env') })

const express = require('express')
const { Pool } = require('pg')
const cors = require('cors')
const multer = require('multer')
const path = require('path')
const fs = require('fs')
const bcrypt = require('bcrypt')

// Security: bcrypt salt rounds for password hashing
const BCRYPT_SALT_ROUNDS = 10

// AI Integration
const aiRoutes = require('./routes/ai.cjs')

// Database initialization
const { initializeDatabase } = require('./utils/db-init.cjs')

// Crypto and Telegram modules
const { encrypt, decrypt, isEncrypted } = require('./utils/crypto.cjs')
const telegram = require('./utils/telegram.cjs')

const app = express()
app.use(cors())
app.use(express.json({ limit: '50mb' }))

// Serve static branding files at /api/branding/files/:filename
const brandingPath = path.join(__dirname, 'uploads', 'branding')
// Ensure branding directory exists
if (!fs.existsSync(brandingPath)) {
    fs.mkdirSync(brandingPath, { recursive: true })
    console.log(`[Branding] Created directory: ${brandingPath}`)
} else {
    console.log(`[Branding] Directory exists: ${brandingPath}`)
    // List existing files
    const files = fs.readdirSync(brandingPath)
    console.log(`[Branding] Files found: ${files.length > 0 ? files.join(', ') : 'none'}`)
}
app.use('/api/branding/files', express.static(brandingPath, {
    maxAge: '1d',
    setHeaders: (res, filePath) => {
        console.log(`[Branding] Serving file: ${filePath}`)
    }
}))


// Database connection - credentials MUST be provided via environment variables
const requiredEnvVars = ['PGHOST', 'PGDATABASE', 'PGUSER', 'PGPASSWORD']
const missingVars = requiredEnvVars.filter(v => !process.env[v])

if (missingVars.length > 0 && process.env.NODE_ENV === 'production') {
    console.error(`FATAL: Missing required environment variables: ${missingVars.join(', ')}`)
    console.error('Please configure your .env file with database credentials.')
    process.exit(1)
}

const pool = new Pool({
    host: process.env.PGHOST || '127.0.0.1',
    port: parseInt(process.env.PGPORT) || 5432,
    database: process.env.PGDATABASE || 'onliops',
    user: process.env.PGUSER || 'onliops',
    password: process.env.PGPASSWORD
})

// Initialize database on startup
initializeDatabase(pool).then(success => {
    if (success) {
        console.log('[DB] Database ready for connections');
    } else {
        console.error('[DB] Database initialization failed - some features may not work');
    }
})

// === AUTHENTICATION ENDPOINTS ===

// Login - supports email OR username
app.post('/api/auth/login', async (req, res) => {
    const { emailOrUsername, password } = req.body

    if (!emailOrUsername || !password) {
        return res.status(400).json({ error: 'Email/usuário e senha são obrigatórios' })
    }

    try {
        // Search by email OR name (case-insensitive)
        const { rows } = await pool.query(`
            SELECT id, email, name, password_hash, role, created_at, updated_at 
            FROM users 
            WHERE LOWER(email) = LOWER($1) OR LOWER(name) = LOWER($1)
            LIMIT 1
        `, [emailOrUsername])

        if (rows.length === 0) {
            console.log(`[Auth] User not found: ${emailOrUsername}`)
            return res.status(401).json({ error: 'Email ou senha inválidos' })
        }

        const user = rows[0]

        // Verify password using bcrypt
        // Supports both: bcrypt hashed passwords AND legacy plain text (for migration)
        let isPasswordValid = false

        if (user.password_hash && user.password_hash.startsWith('$2')) {
            // Password is bcrypt hashed
            isPasswordValid = await bcrypt.compare(password, user.password_hash)
        } else {
            // Legacy: plain text password (will be migrated on next password change)
            isPasswordValid = user.password_hash === password
            if (isPasswordValid) {
                // Auto-migrate: hash the password for future logins
                const hashedPassword = await bcrypt.hash(password, BCRYPT_SALT_ROUNDS)
                await pool.query('UPDATE users SET password_hash = $1 WHERE id = $2', [hashedPassword, user.id])
                console.log(`[Auth] Auto-migrated password to bcrypt for user: ${user.email}`)
            }
        }

        if (!isPasswordValid) {
            console.log(`[Auth] Invalid password for user: ${emailOrUsername}`)
            return res.status(401).json({ error: 'Email ou senha inválidos' })
        }

        // Update last_login
        await pool.query('UPDATE users SET last_login = NOW() WHERE id = $1', [user.id])

        console.log(`[Auth] Login successful for: ${user.email}`)

        res.json({
            success: true,
            user: {
                id: user.id,
                email: user.email,
                name: user.name,
                role: user.role || 'viewer',
                created_at: user.created_at,
                updated_at: user.updated_at
            }
        })
    } catch (error) {
        console.error('[Auth] Login error:', error)
        res.status(500).json({ error: 'Erro interno do servidor' })
    }
})

// Register new user
app.post('/api/auth/register', async (req, res) => {
    const { email, password, name } = req.body

    if (!email || !password || !name) {
        return res.status(400).json({ error: 'Email, senha e nome são obrigatórios' })
    }

    try {
        // Check if user already exists
        const existing = await pool.query('SELECT id FROM users WHERE LOWER(email) = LOWER($1)', [email])
        if (existing.rows.length > 0) {
            return res.status(400).json({ error: 'Este email já está cadastrado' })
        }

        // Hash password before storing
        const hashedPassword = await bcrypt.hash(password, BCRYPT_SALT_ROUNDS)

        // Create user with hashed password
        const { rows } = await pool.query(`
            INSERT INTO users (email, password_hash, name, role) 
            VALUES ($1, $2, $3, 'viewer') 
            RETURNING id, email, name, role, created_at
        `, [email, hashedPassword, name])

        console.log(`[Auth] New user registered: ${email}`)

        res.status(201).json({
            success: true,
            user: rows[0]
        })
    } catch (error) {
        console.error('[Auth] Registration error:', error)
        res.status(500).json({ error: 'Erro ao criar usuário' })
    }
})

// === MULTI-TENANCY MIDDLEWARE ===
const DEFAULT_PROJECT_ID = 'f6192f8f-1581-4d3f-86fc-fc7c4d86cf15'; // Default Project

app.use(async (req, res, next) => {
    // Skip for global endpoints
    if (req.path.startsWith('/api/clients') || req.path === '/api/health' || req.path.startsWith('/api/auth')) {
        return next();
    }

    const projectId = req.headers['x-project-id'] || req.query.project_id || DEFAULT_PROJECT_ID;

    // Validate UUID format (basic check)
    if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(projectId)) {
        return res.status(400).json({ error: 'Invalid Project ID format' });
    }

    req.projectId = projectId;
    next();
});

// === CLIENTS & PROJECTS ENDPOINTS ===


// List Clients
app.get('/api/clients', async (req, res) => {
    try {
        const { rows } = await pool.query('SELECT * FROM clients ORDER BY name');
        res.json(rows);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Create Client
app.post('/api/clients', async (req, res) => {
    const { name, logo_url } = req.body;
    try {
        const { rows } = await pool.query(
            'INSERT INTO clients (name, logo_url) VALUES ($1, $2) RETURNING *',
            [name, logo_url]
        );
        res.status(201).json(rows[0]);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// List Projects for a Client
app.get('/api/clients/:clientId/projects', async (req, res) => {
    const { clientId } = req.params;
    try {
        const { rows } = await pool.query('SELECT * FROM projects WHERE client_id = $1 ORDER BY name', [clientId]);
        res.json(rows);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Create Project
app.post('/api/projects', async (req, res) => {
    const { client_id, name, description } = req.body;
    try {
        const { rows } = await pool.query(
            'INSERT INTO projects (client_id, name, description) VALUES ($1, $2, $3) RETURNING *',
            [client_id, name, description]
        );
        res.status(201).json(rows[0]);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Get Single Project
app.get('/api/projects/:id', async (req, res) => {
    try {
        const { rows } = await pool.query('SELECT * FROM projects WHERE id = $1', [req.params.id]);
        if (rows.length === 0) return res.status(404).json({ error: 'Project not found' });
        res.json(rows[0]);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Update Project
app.put('/api/projects/:id', async (req, res) => {
    const { id } = req.params;
    const { name, description, status } = req.body;
    try {
        const { rows } = await pool.query(
            'UPDATE projects SET name = $1, description = $2, status = $3, updated_at = NOW() WHERE id = $4 RETURNING *',
            [name, description, status || 'active', id]
        );
        if (rows.length === 0) return res.status(404).json({ error: 'Project not found' });
        res.json(rows[0]);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Delete Project (with cascade delete of related data)
app.delete('/api/projects/:id', async (req, res) => {
    const { id } = req.params;
    const client = await pool.connect();

    try {
        await client.query('BEGIN');

        // Get project info first
        const project = await client.query('SELECT * FROM projects WHERE id = $1', [id]);
        if (project.rows.length === 0) {
            await client.query('ROLLBACK');
            return res.status(404).json({ error: 'Project not found' });
        }

        // Count related entities
        const counts = {};
        const deviceCount = await client.query('SELECT COUNT(*) FROM network_devices WHERE project_id = $1', [id]);
        counts.devices = parseInt(deviceCount.rows[0].count);

        const vlanCount = await client.query('SELECT COUNT(*) FROM vlans WHERE project_id = $1', [id]);
        counts.vlans = parseInt(vlanCount.rows[0].count);

        const connectionCount = await client.query('SELECT COUNT(*) FROM device_connections WHERE project_id = $1', [id]);
        counts.connections = parseInt(connectionCount.rows[0].count);

        // Delete related data in order (respecting foreign keys)
        // All tables that have project_id foreign key
        await client.query('DELETE FROM simulations WHERE project_id = $1', [id]);
        await client.query('DELETE FROM alerts WHERE project_id = $1', [id]);
        await client.query('DELETE FROM device_connections WHERE project_id = $1', [id]);
        await client.query('DELETE FROM network_devices WHERE project_id = $1', [id]);
        await client.query('DELETE FROM vlans WHERE project_id = $1', [id]);
        await client.query('DELETE FROM user_permissions WHERE project_id = $1', [id]);

        // Finally delete the project
        await client.query('DELETE FROM projects WHERE id = $1', [id]);

        await client.query('COMMIT');

        res.json({
            success: true,
            message: 'Projeto excluído com sucesso',
            deleted: {
                project: project.rows[0].name,
                ...counts
            }
        });
    } catch (error) {
        await client.query('ROLLBACK');
        console.error('Error deleting project:', error);
        res.status(500).json({ error: error.message });
    } finally {
        client.release();
    }
});

// === PLATFORM METRICS ENDPOINTS ===

// Get platform-wide metrics
app.get('/api/platform/metrics', async (req, res) => {
    try {
        const [clients, projects, devices, alerts] = await Promise.all([
            pool.query('SELECT COUNT(*) FROM clients'),
            pool.query('SELECT COUNT(*) FROM projects'),
            pool.query('SELECT COUNT(*) FROM network_devices'),
            pool.query('SELECT COUNT(*) FROM alerts WHERE is_resolved = $1', [false])
        ]);

        res.json({
            totalClients: parseInt(clients.rows[0].count),
            totalProjects: parseInt(projects.rows[0].count),
            totalDevices: parseInt(devices.rows[0].count),
            activeAlerts: parseInt(alerts.rows[0].count),
            uptime: "99.8%",
            lastUpdate: new Date().toISOString()
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Get projects summary for dashboard
app.get('/api/platform/projects/summary', async (req, res) => {
    try {
        const { rows } = await pool.query(`
            SELECT 
                p.id, p.name, p.status,
                c.id as client_id, c.name as client_name,
                COUNT(DISTINCT d.id) as device_count,
                COUNT(DISTINCT a.id) FILTER (WHERE a.is_resolved = false) as alert_count,
                MAX(d.updated_at) as last_activity
            FROM projects p
            LEFT JOIN clients c ON p.client_id = c.id
            LEFT JOIN network_devices d ON p.id = d.project_id
            LEFT JOIN alerts a ON p.id = a.project_id
            GROUP BY p.id, c.id
            ORDER BY p.name
        `);

        res.json(rows.map(r => ({
            id: r.id,
            name: r.name,
            client: { id: r.client_id, name: r.client_name },
            status: r.status,
            metrics: {
                devices: parseInt(r.device_count) || 0,
                alerts: parseInt(r.alert_count) || 0,
                lastActivity: r.last_activity
            }
        })));
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// === ROLES & PERMISSIONS ENDPOINTS ===

// List all roles
app.get('/api/roles', async (req, res) => {
    try {
        const { rows } = await pool.query('SELECT * FROM roles ORDER BY name');
        res.json(rows);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Get user permissions
app.get('/api/users/:userId/permissions', async (req, res) => {
    const { userId } = req.params;
    try {
        // Validate UUID format
        const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
        if (!uuidRegex.test(userId)) {
            return res.json([]); // Return empty array for invalid UUID
        }

        const { rows } = await pool.query(`
            SELECT 
                up.id, up.user_id, up.role_id, up.client_id, up.project_id,
                r.name as role_name, r.permissions,
                c.name as client_name,
                p.name as project_name
            FROM user_permissions up
            JOIN roles r ON up.role_id = r.id
            LEFT JOIN clients c ON up.client_id = c.id
            LEFT JOIN projects p ON up.project_id = p.id
            WHERE up.user_id = $1
        `, [userId]);
        res.json(rows);
    } catch (error) {
        console.error('Error fetching user permissions:', error.message);
        // Return empty array instead of error to prevent frontend crash
        res.json([]);
    }
});

// Add permission to user
app.post('/api/users/:userId/permissions', async (req, res) => {
    const { userId } = req.params;
    const { roleId, clientId, projectId } = req.body;
    try {
        const { rows } = await pool.query(
            `INSERT INTO user_permissions (user_id, role_id, client_id, project_id) 
             VALUES ($1, $2, $3, $4) 
             ON CONFLICT (user_id, role_id, client_id, project_id) DO NOTHING
             RETURNING *`,
            [userId, roleId, clientId || null, projectId || null]
        );
        res.status(201).json(rows[0]);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Delete user permission
app.delete('/api/users/:userId/permissions/:permissionId', async (req, res) => {
    const { userId, permissionId } = req.params;
    try {
        await pool.query('DELETE FROM user_permissions WHERE id = $1 AND user_id = $2', [permissionId, userId]);
        res.status(204).send();
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// === PLATFORM METRICS ENDPOINTS ===

// Get platform-wide metrics
app.get('/api/platform/metrics', async (req, res) => {
    try {
        const [clients, projects, devices, alerts] = await Promise.all([
            pool.query('SELECT COUNT(*) FROM clients'),
            pool.query('SELECT COUNT(*) FROM projects'),
            pool.query('SELECT COUNT(*) FROM network_devices'),
            pool.query('SELECT COUNT(*) FROM alerts WHERE status = $1', ['active'])
        ]);

        res.json({
            totalClients: parseInt(clients.rows[0].count),
            totalProjects: parseInt(projects.rows[0].count),
            totalDevices: parseInt(devices.rows[0].count),
            activeAlerts: parseInt(alerts.rows[0].count),
            uptime: "99.8%", // TODO: Calculate real uptime
            lastUpdate: new Date().toISOString()
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Endpoint para listar VLANs
app.get('/api/vlans', async (req, res) => {
    try {
        const { rows } = await pool.query('SELECT * FROM vlans WHERE project_id = $1 ORDER BY vlan_id', [req.projectId])
        res.json(rows)
    } catch (error) {
        console.error('Error fetching VLANs:', error)
        res.status(500).json({ error: error.message })
    }
})

// === CATEGORIES ENDPOINTS ===

// Listar categorias
app.get('/api/categories', async (req, res) => {
    try {
        const { rows } = await pool.query('SELECT * FROM device_categories ORDER BY name')
        res.json(rows)
    } catch (error) {
        console.error('Error fetching categories:', error)
        res.status(500).json({ error: error.message })
    }
})

// Criar categoria
app.post('/api/categories', async (req, res) => {
    const { slug, name, icon } = req.body
    try {
        const { rows } = await pool.query(
            'INSERT INTO device_categories (slug, name, icon) VALUES ($1, $2, $3) RETURNING *',
            [slug, name, icon]
        )
        res.status(201).json(rows[0])
    } catch (error) {
        console.error('Error creating category:', error)
        res.status(500).json({ error: error.message })
    }
})

// Atualizar categoria
app.put('/api/categories/:slug', async (req, res) => {
    const { slug } = req.params
    const { name, icon } = req.body
    try {
        const { rows } = await pool.query(
            'UPDATE device_categories SET name = $1, icon = $2 WHERE slug = $3 RETURNING *',
            [name, icon, slug]
        )
        if (rows.length === 0) return res.status(404).json({ error: 'Category not found' })
        res.json(rows[0])
    } catch (error) {
        console.error('Error updating category:', error)
        res.status(500).json({ error: error.message })
    }
})

// Deletar categoria
app.delete('/api/categories/:slug', async (req, res) => {
    const { slug } = req.params
    try {
        await pool.query('DELETE FROM device_categories WHERE slug = $1', [slug])
        res.status(204).send()
    } catch (error) {
        console.error('Error deleting category:', error)
        res.status(500).json({ error: error.message })
    }
})

// Endpoint para criar VLAN
app.post('/api/vlans', async (req, res) => {
    const { vlan_id, name, description } = req.body
    try {
        const { rows } = await pool.query(
            'INSERT INTO vlans (vlan_id, name, description, project_id) VALUES ($1, $2, $3, $4) RETURNING *',
            [vlan_id, name, description, req.projectId]
        )
        res.status(201).json(rows[0])
    } catch (error) {
        console.error('Error creating VLAN:', error)
        res.status(500).json({ error: error.message })
    }
})

// Endpoint para atualizar VLAN
app.put('/api/vlans/:id', async (req, res) => {
    const { id } = req.params // Note: passing vlan_id as param
    const { name, description } = req.body
    try {
        const { rows } = await pool.query(
            'UPDATE vlans SET name = $1, description = $2, updated_at = NOW() WHERE vlan_id = $3 AND project_id = $4 RETURNING *',
            [name, description, id, req.projectId]
        )
        if (rows.length === 0) return res.status(404).json({ error: 'VLAN not found' })
        res.json(rows[0])
    } catch (error) {
        console.error('Error updating VLAN:', error)
        res.status(500).json({ error: error.message })
    }
})

// Endpoint para deletar VLAN
app.delete('/api/vlans/:id', async (req, res) => {
    const { id } = req.params
    try {
        await pool.query('DELETE FROM vlans WHERE vlan_id = $1 AND project_id = $2', [id, req.projectId])
        res.status(204).send()
    } catch (error) {
        console.error('Error deleting VLAN:', error)
        res.status(500).json({ error: error.message })
    }
})

// Endpoint para listar dispositivos
app.get('/api/network_devices', async (req, res) => {
    try {
        const { rows } = await pool.query('SELECT * FROM network_devices WHERE project_id = $1 ORDER BY created_at DESC', [req.projectId])
        res.json(rows)
    } catch (error) {
        console.error('Error fetching devices:', error)
        res.status(500).json({ error: error.message })
    }
})

// Endpoint para criar um dispositivo
app.post('/api/network_devices', async (req, res) => {
    const device = req.body
    console.log('[API] Creating device:', device.hostname || device.model, 'with vlan_id:', device.vlan_id)

    // Buscar VLAN padrão se não fornecida, ou validar a fornecida
    let vlanId = device.vlan_id
    try {
        if (!vlanId) {
            const vlanResult = await pool.query('SELECT vlan_id FROM vlans WHERE project_id = $1 ORDER BY vlan_id ASC LIMIT 1', [req.projectId])
            vlanId = vlanResult.rows.length > 0 ? vlanResult.rows[0].vlan_id : null
        } else {
            const vlanCheck = await pool.query('SELECT vlan_id FROM vlans WHERE vlan_id = $1 AND project_id = $2', [vlanId, req.projectId])
            if (vlanCheck.rows.length === 0) {
                console.warn(`[API] VLAN ${vlanId} not found for project ${req.projectId}, resetting to null`)
                vlanId = null
            }
        }
    } catch (e) {
        console.error('[API] VLAN validation error:', e)
        vlanId = null
    }

    try {
        const { rows } = await pool.query(`
            INSERT INTO network_devices (
                serial_number, ip_address, mac_address, model, manufacturer,
                device_type, firmware_version, hostname, status, vlan_id, 
                location, notes, last_seen, project_id
            ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14)
            RETURNING *
        `, [
            device.serial_number,
            device.ip_address,
            device.mac_address || null,
            device.model,
            device.manufacturer,
            device.device_type,
            device.firmware_version || null,
            device.hostname || null,
            device.status || 'active',
            vlanId,
            device.location || null,
            device.notes || null,
            device.last_seen || new Date().toISOString(),
            req.projectId
        ])
        res.status(201).json(rows[0])
    } catch (error) {
        console.error('Error creating device:', error)
        res.status(500).json({ error: error.message })
    }
})

// Endpoint para atualizar um dispositivo
app.put('/api/network_devices/:id', async (req, res) => {
    const { id } = req.params
    const device = req.body

    try {
        const { rows } = await pool.query(`
            UPDATE network_devices SET
                serial_number = $1,
                ip_address = $2,
                mac_address = $3,
                model = $4,
                manufacturer = $5,
                device_type = $6,
                firmware_version = $7,
                hostname = $8,
                status = $9,
                location = $10,
                notes = $11,
                updated_at = NOW()
            WHERE id = $12 AND project_id = $13
            RETURNING *
        `, [
            device.serial_number,
            device.ip_address,
            device.mac_address || null,
            device.model,
            device.manufacturer,
            device.device_type,
            device.firmware_version || null,
            device.hostname || null,
            device.status || 'active',
            device.location || null,
            device.notes || null,
            id,
            req.projectId
        ])

        if (rows.length === 0) {
            return res.status(404).json({ error: 'Device not found' })
        }

        res.json(rows[0])
    } catch (error) {
        console.error('Error updating device:', error)
        res.status(500).json({ error: error.message })
    }
})

// Endpoint para deletar um dispositivo
app.delete('/api/network_devices/:id', async (req, res) => {
    const { id } = req.params

    try {
        await pool.query('DELETE FROM network_devices WHERE id = $1 AND project_id = $2', [id, req.projectId])
        res.status(204).send()
    } catch (error) {
        console.error('Error deleting device:', error)
        res.status(500).json({ error: error.message })
    }
})

// Endpoint para importar dispositivos
app.post('/api/devices/import', async (req, res) => {
    const devices = req.body.devices

    if (!Array.isArray(devices)) {
        return res.status(400).json({ error: 'Devices must be an array' })
    }

    const results = {
        success: 0,
        failed: 0,
        errors: []
    }

    // Buscar VLAN padrão
    let defaultVlanId = null
    try {
        const vlanResult = await pool.query('SELECT vlan_id FROM vlans WHERE project_id = $1 ORDER BY vlan_id ASC LIMIT 1', [req.projectId])
        if (vlanResult.rows.length > 0) {
            defaultVlanId = vlanResult.rows[0].vlan_id
        }
        console.log('[Import] Default VLAN for project:', req.projectId, 'is:', defaultVlanId)
    } catch (error) {
        console.error('[Import] Error fetching VLAN:', error)
        defaultVlanId = null
    }

    for (const device of devices) {
        try {
            // Allowed device types to satisfy DB Check Constraint
            const ALLOWED_DEVICE_TYPES = [
                'camera', 'nvr', 'dvr', 'switch', 'router', 'firewall',
                'access_point', 'reader', 'controller', 'converter',
                'patch_panel', 'server', 'pc', 'ap_wifi', 'intercom',
                'elevator_recorder', 'other'
            ];

            // Map device_type
            let deviceType = (device.device_type || 'converter').toLowerCase();

            // Simple mapping for common variations
            if (deviceType === 'cameras') deviceType = 'camera';
            else if (deviceType === 'switches') deviceType = 'switch';
            else if (deviceType === 'routers') deviceType = 'router';
            else if (deviceType === 'dvr') deviceType = 'nvr';
            else if (deviceType === 'nvrs') deviceType = 'nvr';
            else if (deviceType === 'ap_wifi' || deviceType === 'access points') deviceType = 'access_point';
            else if (deviceType === 'server') deviceType = 'server';
            else if (deviceType === 'sensor') deviceType = 'converter';
            else if (deviceType === 'other') deviceType = 'other';

            // Final validation - fallback to converter if still invalid
            if (!ALLOWED_DEVICE_TYPES.includes(deviceType)) {
                // Try removing last 's' as simple plural fix
                if (ALLOWED_DEVICE_TYPES.includes(deviceType.slice(0, -1))) {
                    deviceType = deviceType.slice(0, -1);
                } else {
                    console.warn(`Invalid device_type '${deviceType}' for ${device.serial_number}, falling back to converter`);
                    deviceType = 'converter';
                }
            }

            await pool.query(`
                INSERT INTO network_devices (
                    serial_number, ip_address, mac_address, model, manufacturer,
                    device_type, firmware_version, hostname, status, vlan_id, notes, project_id
                ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
                ON CONFLICT (ip_address, project_id) DO UPDATE SET
                    serial_number = EXCLUDED.serial_number,
                    mac_address = EXCLUDED.mac_address,
                    model = EXCLUDED.model,
                    manufacturer = EXCLUDED.manufacturer,
                    device_type = EXCLUDED.device_type,
                    firmware_version = EXCLUDED.firmware_version,
                    hostname = EXCLUDED.hostname,
                    status = EXCLUDED.status,
                    notes = EXCLUDED.notes,
                    updated_at = NOW()
            `, [
                device.serial_number,
                device.ip_address,
                device.mac_address || null,
                device.model,
                device.manufacturer,
                deviceType,
                device.firmware_version || null,
                device.hostname || null,
                device.status || 'active',
                defaultVlanId,
                `Importado via SADP em ${new Date().toLocaleString('pt-BR')}. Gateway: ${device.gateway || 'N/A'}, Máscara: ${device.subnet_mask || 'N/A'}, HTTP: ${device.http_port || 'N/A'}`,
                req.projectId
            ])

            results.success++
        } catch (error) {
            results.failed++
            results.errors.push(`${device.serial_number}: ${error.message}`)
            console.error(`Error importing device ${device.serial_number}:`, error)
        }
    }

    res.json(results)
})

// Endpoint para listar conexões de topologia
app.get('/api/topology/connections', async (req, res) => {
    try {
        const { rows } = await pool.query('SELECT * FROM device_connections WHERE project_id = $1', [req.projectId])
        res.json(rows)
    } catch (error) {
        console.error('Error fetching connections:', error)
        res.status(500).json({ error: error.message })
    }
})

// Endpoint para criar conexão
app.post('/api/topology/connections', async (req, res) => {
    const { from_device_id, to_device_id, connection_type, port_from, port_to, status } = req.body
    try {
        const { rows } = await pool.query(
            `INSERT INTO device_connections (from_device_id, to_device_id, connection_type, port_from, port_to, status, project_id) 
             VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *`,
            [from_device_id, to_device_id, connection_type || 'ethernet', port_from, port_to, status || 'active', req.projectId]
        )
        res.status(201).json(rows[0])
    } catch (error) {
        console.error('Error creating connection:', error)
        res.status(500).json({ error: error.message })
    }
})

// Endpoint para deletar conexão
app.delete('/api/topology/connections/:id', async (req, res) => {
    const { id } = req.params
    try {
        await pool.query('DELETE FROM device_connections WHERE id = $1 AND project_id = $2', [id, req.projectId])
        res.status(204).send()
    } catch (error) {
        console.error('Error deleting connection:', error)
        res.status(500).json({ error: error.message })
    }
})

// === USER MANAGEMENT ENDPOINTS ===

// List all users (Admin only in production - simplified for now)
app.get('/api/users', async (req, res) => {
    try {
        const { rows } = await pool.query(`
            SELECT id, email, name as full_name, role, created_at, last_login 
            FROM users 
            ORDER BY created_at DESC
        `)
        res.json(rows)
    } catch (error) {
        console.error('Error fetching users:', error)
        res.status(500).json({ error: error.message })
    }
})

// Update user role/status
app.put('/api/users/:id', async (req, res) => {
    const { id } = req.params
    const { role, full_name } = req.body
    try {
        const { rows } = await pool.query(
            'UPDATE users SET role = $1, name = $2, updated_at = NOW() WHERE id = $3 RETURNING id, email, name as full_name, role',
            [role, full_name, id]
        )
        if (rows.length === 0) return res.status(404).json({ error: 'User not found' })
        res.json(rows[0])
    } catch (error) {
        console.error('Error updating user:', error)
        res.status(500).json({ error: error.message })
    }
})

// Delete/Deactivate user
app.delete('/api/users/:id', async (req, res) => {
    const { id } = req.params
    try {
        await pool.query('DELETE FROM users WHERE id = $1', [id])
        res.status(204).send()
    } catch (error) {
        console.error('Error deleting user:', error)
        res.status(500).json({ error: error.message })
    }
})

// === USER PROFILE ENDPOINTS ===

// Get user profile
app.get('/api/profile/:userId', async (req, res) => {
    const { userId } = req.params
    try {
        const { rows } = await pool.query(
            `SELECT id, email, name, phone, avatar_url, role, created_at, last_login 
             FROM users WHERE id = $1`,
            [userId]
        )
        if (rows.length === 0) return res.status(404).json({ error: 'User not found' })
        res.json(rows[0])
    } catch (error) {
        console.error('Error fetching profile:', error)
        res.status(500).json({ error: error.message })
    }
})

// Update user profile (name, email, phone)
app.put('/api/profile/:userId', async (req, res) => {
    const { userId } = req.params
    const { name, email, phone, avatar_url } = req.body
    try {
        const { rows } = await pool.query(
            `UPDATE users SET 
                name = COALESCE($1, name), 
                email = COALESCE($2, email), 
                phone = $3, 
                avatar_url = $4,
                updated_at = NOW()
             WHERE id = $5 
             RETURNING id, email, name, phone, avatar_url, role`,
            [name, email, phone, avatar_url, userId]
        )
        if (rows.length === 0) return res.status(404).json({ error: 'User not found' })
        res.json(rows[0])
    } catch (error) {
        console.error('Error updating profile:', error)
        if (error.code === '23505') {
            return res.status(400).json({ error: 'Este email já está em uso' })
        }
        res.status(500).json({ error: error.message })
    }
})

// Change password
app.put('/api/profile/:userId/password', async (req, res) => {
    const { userId } = req.params
    const { currentPassword, newPassword } = req.body

    try {
        // For local auth, we use a simple comparison
        // In production, use bcrypt
        const { rows } = await pool.query(
            'SELECT password_hash FROM users WHERE id = $1',
            [userId]
        )

        if (rows.length === 0) {
            return res.status(404).json({ error: 'Usuário não encontrado' })
        }

        const user = rows[0]

        // If password_hash is null, allow setting new password
        // Otherwise, verify current password
        if (user.password_hash && user.password_hash !== currentPassword) {
            // Simple comparison for now - in production use bcrypt.compare
            return res.status(400).json({ error: 'Senha atual incorreta' })
        }

        // Update password
        await pool.query(
            'UPDATE users SET password_hash = $1, updated_at = NOW() WHERE id = $2',
            [newPassword, userId]
        )

        res.json({ message: 'Senha alterada com sucesso' })
    } catch (error) {
        console.error('Error changing password:', error)
        res.status(500).json({ error: error.message })
    }
})

// === TELEGRAM ENDPOINTS ===

// Start Telegram link process
app.post('/api/telegram/start-link', async (req, res) => {
    const { userId } = req.body

    if (!userId) {
        return res.status(400).json({ error: 'userId is required' })
    }

    try {
        // Generate verification code
        const code = telegram.generateVerificationCode()
        telegram.storeVerificationCode(userId, code)

        console.log(`[Telegram] Verification code generated for user ${userId}: ${code}`)

        res.json({
            verificationCode: code,
            expiresIn: 600 // 10 minutes
        })
    } catch (error) {
        console.error('Error starting Telegram link:', error)
        res.status(500).json({ error: error.message })
    }
})

// Verify Telegram code and save chat_id
app.post('/api/telegram/verify', async (req, res) => {
    const { userId, code, chatId } = req.body

    if (!userId || !code || !chatId) {
        return res.status(400).json({ error: 'userId, code, and chatId are required' })
    }

    try {
        // Verify the code
        const isValid = telegram.verifyCode(userId, code)

        if (!isValid) {
            return res.status(400).json({ error: 'Código inválido ou expirado' })
        }

        // Save chat_id to user
        await pool.query(
            'UPDATE users SET telegram_chat_id = $1, telegram_verified = true, updated_at = NOW() WHERE id = $2',
            [chatId, userId]
        )

        // Send confirmation message
        await telegram.sendMessage(chatId, '✅ <b>Conta vinculada com sucesso!</b>\n\nAgora você receberá senhas de dispositivos diretamente aqui.')

        console.log(`[Telegram] User ${userId} linked to chat ${chatId}`)

        res.json({ success: true, message: 'Telegram vinculado com sucesso' })
    } catch (error) {
        console.error('Error verifying Telegram:', error)
        res.status(500).json({ error: error.message })
    }
})

// Manually link Telegram (for testing/admin)
app.put('/api/telegram/link/:userId', async (req, res) => {
    const { userId } = req.params
    const { chatId } = req.body

    if (!chatId) {
        return res.status(400).json({ error: 'chatId is required' })
    }

    try {
        await pool.query(
            'UPDATE users SET telegram_chat_id = $1, telegram_verified = true, updated_at = NOW() WHERE id = $2',
            [chatId, userId]
        )

        res.json({ success: true })
    } catch (error) {
        console.error('Error linking Telegram:', error)
        res.status(500).json({ error: error.message })
    }
})

// Unlink Telegram
app.delete('/api/telegram/unlink/:userId', async (req, res) => {
    const { userId } = req.params

    try {
        await pool.query(
            'UPDATE users SET telegram_chat_id = NULL, telegram_verified = false, updated_at = NOW() WHERE id = $1',
            [userId]
        )

        res.json({ success: true, message: 'Telegram desvinculado' })
    } catch (error) {
        console.error('Error unlinking Telegram:', error)
        res.status(500).json({ error: error.message })
    }
})

// Get Telegram status for user
app.get('/api/telegram/status/:userId', async (req, res) => {
    const { userId } = req.params

    try {
        const { rows } = await pool.query(
            'SELECT telegram_chat_id, telegram_verified FROM users WHERE id = $1',
            [userId]
        )

        if (rows.length === 0) {
            return res.status(404).json({ error: 'User not found' })
        }

        res.json({
            linked: !!rows[0].telegram_chat_id,
            verified: rows[0].telegram_verified || false
        })
    } catch (error) {
        console.error('Error getting Telegram status:', error)
        res.status(500).json({ error: error.message })
    }
})

// === DEVICE CREDENTIALS ENDPOINTS ===

// Save device credentials (encrypted)
app.put('/api/devices/:id/credentials', async (req, res) => {
    const { id } = req.params
    const { admin_username, admin_password } = req.body

    try {
        // Encrypt password if provided
        let encryptedPassword = null
        if (admin_password) {
            encryptedPassword = encrypt(admin_password)
        }

        await pool.query(
            `UPDATE network_devices 
             SET admin_username = $1, admin_password_enc = $2, updated_at = NOW() 
             WHERE id = $3`,
            [admin_username, encryptedPassword, id]
        )

        console.log(`[Credentials] Saved credentials for device ${id}`)

        res.json({ success: true, message: 'Credenciais salvas com sucesso' })
    } catch (error) {
        console.error('Error saving credentials:', error)
        res.status(500).json({ error: error.message })
    }
})

// Request device password (send via Telegram)
app.post('/api/devices/:id/request-password', async (req, res) => {
    const { id } = req.params
    const { userId } = req.body
    const ipAddress = req.ip || req.connection.remoteAddress
    const userAgent = req.headers['user-agent']

    if (!userId) {
        return res.status(400).json({ error: 'userId is required' })
    }

    try {
        // Get user info and check Telegram
        const { rows: userRows } = await pool.query(
            'SELECT id, name, telegram_chat_id, telegram_verified FROM users WHERE id = $1',
            [userId]
        )

        if (userRows.length === 0) {
            return res.status(404).json({ error: 'Usuário não encontrado' })
        }

        const user = userRows[0]

        if (!user.telegram_chat_id || !user.telegram_verified) {
            return res.status(400).json({ error: 'Telegram não vinculado. Configure seu Telegram no perfil.' })
        }

        // Get device info
        const { rows: deviceRows } = await pool.query(
            'SELECT id, model, ip_address, admin_username, admin_password_enc FROM network_devices WHERE id = $1',
            [id]
        )

        if (deviceRows.length === 0) {
            return res.status(404).json({ error: 'Dispositivo não encontrado' })
        }

        const device = deviceRows[0]

        if (!device.admin_password_enc) {
            return res.status(400).json({ error: 'Este dispositivo não possui senha cadastrada' })
        }

        // Decrypt password
        const password = decrypt(device.admin_password_enc)

        // Format and send message
        const message = telegram.formatPasswordMessage(
            device.model,
            device.ip_address,
            device.admin_username || 'admin',
            password,
            user.name
        )

        const sent = await telegram.sendMessage(user.telegram_chat_id, message)

        if (!sent) {
            return res.status(500).json({ error: 'Falha ao enviar mensagem via Telegram' })
        }

        // Log the request for audit
        await pool.query(
            `INSERT INTO password_request_logs (user_id, device_id, ip_address, user_agent, status)
             VALUES ($1, $2, $3, $4, 'sent')`,
            [userId, id, ipAddress, userAgent]
        )

        console.log(`[Credentials] Password sent to ${user.name} for device ${device.model}`)

        res.json({
            success: true,
            message: 'Senha enviada para seu Telegram'
        })
    } catch (error) {
        console.error('Error requesting password:', error)
        res.status(500).json({ error: error.message })
    }
})

// Get password request logs (admin only)
app.get('/api/password-requests', async (req, res) => {
    try {
        const { rows } = await pool.query(`
            SELECT 
                prl.id,
                prl.requested_at,
                prl.ip_address,
                prl.status,
                u.name as user_name,
                u.email as user_email,
                nd.model as device_model,
                nd.ip_address as device_ip
            FROM password_request_logs prl
            LEFT JOIN users u ON prl.user_id = u.id
            LEFT JOIN network_devices nd ON prl.device_id = nd.id
            ORDER BY prl.requested_at DESC
            LIMIT 100
        `)

        res.json(rows)
    } catch (error) {
        console.error('Error fetching password requests:', error)
        res.status(500).json({ error: error.message })
    }
})

// === SETTINGS ENDPOINTS ===

// Get all settings
app.get('/api/settings', async (req, res) => {
    try {
        const { rows } = await pool.query('SELECT * FROM system_settings')
        const settings = {}
        rows.forEach(row => {
            settings[row.key] = row.value
        })
        res.json(settings)
    } catch (error) {
        console.error('Error fetching settings:', error)
        res.status(500).json({ error: error.message })
    }
})

// Get specific setting
app.get('/api/settings/:key', async (req, res) => {
    const { key } = req.params
    try {
        const { rows } = await pool.query('SELECT value FROM system_settings WHERE key = $1', [key])
        if (rows.length === 0) return res.status(404).json({ error: 'Setting not found' })
        res.json(rows[0].value)
    } catch (error) {
        console.error('Error fetching setting:', error)
        res.status(500).json({ error: error.message })
    }
})

// Update setting
app.put('/api/settings/:key', async (req, res) => {
    const { key } = req.params
    const { value } = req.body
    try {
        const { rows } = await pool.query(
            'UPDATE system_settings SET value = $1, updated_at = NOW() WHERE key = $2 RETURNING *',
            [JSON.stringify(value), key]
        )
        if (rows.length === 0) {
            // Insert if doesn't exist
            const { rows: newRows } = await pool.query(
                'INSERT INTO system_settings (key, value) VALUES ($1, $2) RETURNING *',
                [key, JSON.stringify(value)]
            )
            return res.json(newRows[0])
        }
        res.json(rows[0])
    } catch (error) {
        console.error('Error updating setting:', error)
        res.status(500).json({ error: error.message })
    }
})

// === AUDIT LOGS ENDPOINTS ===

// Get audit logs
app.get('/api/logs/audit', async (req, res) => {
    const { limit = 100, offset = 0 } = req.query
    try {
        const { rows } = await pool.query(`
            SELECT a.*, u.email as user_email, u.name as user_name
            FROM audit_logs a
            LEFT JOIN users u ON a.user_id = u.id
            WHERE a.project_id = $3
            ORDER BY a.created_at DESC
            LIMIT $1 OFFSET $2
        `, [limit, offset, req.projectId])
        res.json(rows)
    } catch (error) {
        console.error('Error fetching audit logs:', error)
        res.status(500).json({ error: error.message })
    }
})

// Create audit log entry
app.post('/api/logs/audit', async (req, res) => {
    const { user_id, action, entity_type, entity_id, details, ip_address } = req.body
    try {
        const { rows } = await pool.query(
            'INSERT INTO audit_logs (user_id, action, entity_type, entity_id, details, ip_address, project_id) VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *',
            [user_id, action, entity_type, entity_id, JSON.stringify(details || {}), ip_address, req.projectId]
        )
        res.status(201).json(rows[0])
    } catch (error) {
        console.error('Error creating audit log:', error)
        res.status(500).json({ error: error.message })
    }
})

// Get login events
app.get('/api/logs/login', async (req, res) => {
    const { limit = 100, offset = 0 } = req.query
    try {
        const { rows } = await pool.query(`
            SELECT l.*, u.email, u.name as full_name
            FROM login_events l
            LEFT JOIN users u ON l.user_id = u.id
            ORDER BY l.created_at DESC
            LIMIT $1 OFFSET $2
        `, [limit, offset])
        res.json(rows)
    } catch (error) {
        console.error('Error fetching login events:', error)
        res.status(500).json({ error: error.message })
    }
})

// === BRANDING UPLOAD ENDPOINTS ===

// Configure multer for branding uploads
const brandingStorage = multer.diskStorage({
    destination: (req, file, cb) => {
        const uploadPath = path.join(__dirname, 'uploads', 'branding')
        // Ensure directory exists
        if (!fs.existsSync(uploadPath)) {
            fs.mkdirSync(uploadPath, { recursive: true })
        }
        cb(null, uploadPath)
    },
    filename: (req, file, cb) => {
        const type = req.params.type // 'logo' or 'favicon'
        const ext = path.extname(file.originalname).toLowerCase()
        const filename = `${type}${ext}`
        cb(null, filename)
    }
})

const brandingUpload = multer({
    storage: brandingStorage,
    limits: {
        fileSize: 5 * 1024 * 1024 // 5MB max
    },
    fileFilter: (req, file, cb) => {
        const allowedTypes = ['image/png', 'image/jpeg', 'image/svg+xml', 'image/webp', 'image/x-icon', 'image/vnd.microsoft.icon']
        if (allowedTypes.includes(file.mimetype)) {
            cb(null, true)
        } else {
            cb(new Error('Tipo de arquivo não permitido. Use PNG, JPG, SVG, WebP ou ICO.'), false)
        }
    }
})

// Upload logo or favicon
app.post('/api/branding/:type', brandingUpload.single('file'), async (req, res) => {
    const { type } = req.params

    if (!['logo', 'favicon'].includes(type)) {
        return res.status(400).json({ error: 'Tipo inválido. Use "logo" ou "favicon".' })
    }

    if (!req.file) {
        return res.status(400).json({ error: 'Nenhum arquivo enviado.' })
    }

    try {
        const filename = req.file.filename
        const url = `/api/branding/files/${filename}`

        // Save to settings
        const settingKey = type === 'logo' ? 'branding_logo' : 'branding_favicon'
        const value = JSON.stringify({ url, filename, updatedAt: new Date().toISOString() })

        const { rows } = await pool.query(
            'UPDATE system_settings SET value = $1, updated_at = NOW() WHERE key = $2 RETURNING *',
            [value, settingKey]
        )

        if (rows.length === 0) {
            await pool.query(
                'INSERT INTO system_settings (key, value) VALUES ($1, $2)',
                [settingKey, value]
            )
        }

        console.log(`[Branding] ${type} uploaded: ${filename}`)

        res.json({
            success: true,
            url,
            filename,
            message: `${type === 'logo' ? 'Logo' : 'Favicon'} atualizado com sucesso!`
        })
    } catch (error) {
        console.error(`Error uploading ${type}:`, error)
        res.status(500).json({ error: error.message })
    }
})

// Get branding info
app.get('/api/branding/info', async (req, res) => {
    try {
        const { rows } = await pool.query(
            "SELECT key, value FROM system_settings WHERE key IN ('branding_logo', 'branding_favicon')"
        )

        const branding = {
            logo: null,
            favicon: null
        }

        rows.forEach(row => {
            try {
                const data = typeof row.value === 'string' ? JSON.parse(row.value) : row.value
                if (row.key === 'branding_logo') {
                    branding.logo = data
                } else if (row.key === 'branding_favicon') {
                    branding.favicon = data
                }
            } catch (e) {
                // Invalid JSON, skip
            }
        })

        res.json(branding)
    } catch (error) {
        console.error('Error fetching branding:', error)
        res.status(500).json({ error: error.message })
    }
})

// Debug endpoint - list branding files on disk
app.get('/api/branding/debug', async (req, res) => {
    try {
        const brandingDir = path.join(__dirname, 'uploads', 'branding')
        let files = []
        let dirExists = false

        if (fs.existsSync(brandingDir)) {
            dirExists = true
            files = fs.readdirSync(brandingDir).map(f => ({
                name: f,
                path: path.join(brandingDir, f),
                size: fs.statSync(path.join(brandingDir, f)).size
            }))
        }

        // Get settings from DB
        const { rows } = await pool.query(
            "SELECT key, value FROM system_settings WHERE key IN ('branding_logo', 'branding_favicon')"
        )

        res.json({
            brandingDir,
            dirExists,
            filesOnDisk: files,
            settingsInDb: rows,
            __dirname
        })
    } catch (error) {
        res.status(500).json({ error: error.message })
    }
})

// Delete branding (reset to default)
app.delete('/api/branding/:type', async (req, res) => {
    const { type } = req.params

    if (!['logo', 'favicon'].includes(type)) {
        return res.status(400).json({ error: 'Tipo inválido.' })
    }

    try {
        const settingKey = type === 'logo' ? 'branding_logo' : 'branding_favicon'

        // Get current file to delete
        const { rows } = await pool.query(
            'SELECT value FROM system_settings WHERE key = $1',
            [settingKey]
        )

        if (rows.length > 0 && rows[0].value) {
            try {
                const data = typeof rows[0].value === 'string' ? JSON.parse(rows[0].value) : rows[0].value
                if (data.filename) {
                    const filePath = path.join(__dirname, 'uploads', 'branding', data.filename)
                    if (fs.existsSync(filePath)) {
                        fs.unlinkSync(filePath)
                    }
                }
            } catch (e) {
                // Ignore parse errors
            }
        }

        // Remove setting
        await pool.query('DELETE FROM system_settings WHERE key = $1', [settingKey])

        console.log(`[Branding] ${type} reset to default`)

        res.json({
            success: true,
            message: `${type === 'logo' ? 'Logo' : 'Favicon'} resetado para o padrão.`
        })
    } catch (error) {
        console.error(`Error deleting ${type}:`, error)
        res.status(500).json({ error: error.message })
    }
})

// Health check
app.get('/api/health', (req, res) => {
    res.json({ status: 'ok' })
})

// === AI INTEGRATION ===
// Share database pool with AI routes
app.locals.pool = pool

// Mount AI routes
app.use('/api/ai', aiRoutes)

// Mount Prompts routes
const promptsRoutes = require('./routes/prompts.cjs')
app.use('/api/prompts', promptsRoutes)

// Mount AI Streaming routes (SSE)
const aiStreamRoutes = require('./routes/ai-stream.cjs')
app.use('/api/ai/stream', aiStreamRoutes)

const PORT = 3001
app.listen(PORT, () => {
    console.log(`Import API server running on http://localhost:${PORT}`)
    console.log(`AI endpoints available at http://localhost:${PORT}/api/ai`)
    console.log(`AI Streaming available at http://localhost:${PORT}/api/ai/stream`)
    console.log(`Prompts API available at http://localhost:${PORT}/api/prompts`)
})


