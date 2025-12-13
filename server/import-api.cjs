const express = require('express')
const { Pool } = require('pg')
const cors = require('cors')

// AI Integration
const aiRoutes = require('./routes/ai.cjs')

const app = express()
app.use(cors())
app.use(express.json({ limit: '50mb' }))

const pool = new Pool({
    host: '127.0.0.1',
    port: 5432,
    database: 'calabasas_local',
    user: 'calabasas_admin',
    password: 'Calabasas@2025!'
})

// === MULTI-TENANCY MIDDLEWARE ===
const DEFAULT_PROJECT_ID = 'f6192f8f-1581-4d3f-86fc-fc7c4d86cf15'; // Default Project

app.use(async (req, res, next) => {
    // Skip for global endpoints
    if (req.path.startsWith('/api/clients') || req.path === '/api/health') {
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
        res.status(500).json({ error: error.message });
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

// Get projects summary for dashboard
app.get('/api/platform/projects/summary', async (req, res) => {
    try {
        const { rows } = await pool.query(`
            SELECT 
                p.id, p.name, p.status,
                c.id as client_id, c.name as client_name,
                COUNT(DISTINCT d.id) as device_count,
                COUNT(DISTINCT a.id) FILTER (WHERE a.status = 'active') as alert_count,
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

    // Buscar VLAN padrão se não fornecida
    let vlanId = device.vlan_id
    if (!vlanId) {
        try {
            const vlanResult = await pool.query('SELECT vlan_id FROM vlans WHERE project_id = $1 ORDER BY vlan_id ASC LIMIT 1', [req.projectId])
            if (vlanResult.rows.length > 0) {
                vlanId = vlanResult.rows[0].vlan_id
            } else {
                vlanId = 1 // Fallback
            }
        } catch (e) {
            vlanId = 1
        }
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
            console.log(`Using VLAN ID: ${defaultVlanId}`)
        } else {
            console.error('No VLANs found in database!')
            return res.status(500).json({ error: 'No VLANs configured in database' })
        }
    } catch (error) {
        console.error('Error fetching VLAN:', error)
        return res.status(500).json({ error: 'Database error fetching VLAN' })
    }

    for (const device of devices) {
        try {
            await pool.query(`
                INSERT INTO network_devices (
                    serial_number, ip_address, mac_address, model, manufacturer,
                    device_type, firmware_version, hostname, status, vlan_id, notes, project_id
                ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
                ON CONFLICT (ip_address) DO UPDATE SET
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
                device.device_type,
                device.firmware_version || null,
                device.hostname || null,
                device.status || 'active',
                defaultVlanId,
                device.status || 'active',
                defaultVlanId,
                `Importado/Atualizado via SADP em ${new Date().toLocaleString('pt-BR')}`,
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

// Health check
app.get('/api/health', (req, res) => {
    res.json({ status: 'ok' })
})

// === AI INTEGRATION ===
// Share database pool with AI routes
app.locals.pool = pool

// Mount AI routes
app.use('/api/ai', aiRoutes)

const PORT = 3001
app.listen(PORT, () => {
    console.log(`Import API server running on http://localhost:${PORT}`)
    console.log(`AI endpoints available at http://localhost:${PORT}/api/ai`)
})
