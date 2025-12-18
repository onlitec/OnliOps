/**
 * Database Initialization Module
 * Automatically creates tables if they don't exist
 */

const SCHEMA_SQL = `
-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Tabela de Clientes
CREATE TABLE IF NOT EXISTS clients (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    logo_url TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabela de Projetos
CREATE TABLE IF NOT EXISTS projects (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    client_id UUID REFERENCES clients(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    status VARCHAR(50) DEFAULT 'active',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabela de Roles
CREATE TABLE IF NOT EXISTS roles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(100) NOT NULL UNIQUE,
    description TEXT,
    permissions JSONB DEFAULT '[]',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabela de Users
CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email VARCHAR(255) UNIQUE NOT NULL,
    name VARCHAR(100) NOT NULL,
    phone VARCHAR(20),
    password_hash VARCHAR(255),
    avatar_url TEXT,
    role VARCHAR(20) DEFAULT 'guest' CHECK (role IN ('admin', 'security_operator', 'technical_viewer', 'guest')),
    is_active BOOLEAN DEFAULT true,
    is_test BOOLEAN DEFAULT false,
    last_login TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabela de User Permissions
CREATE TABLE IF NOT EXISTS user_permissions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    role_id UUID REFERENCES roles(id) ON DELETE CASCADE,
    client_id UUID REFERENCES clients(id) ON DELETE CASCADE,
    project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabela de VLANs
CREATE TABLE IF NOT EXISTS vlans (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
    vlan_id INTEGER NOT NULL,
    name VARCHAR(50) NOT NULL,
    subnet VARCHAR(18),
    gateway VARCHAR(15),
    description TEXT,
    firewall_rules JSONB DEFAULT '[]',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabela de Device Categories
CREATE TABLE IF NOT EXISTS device_categories (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    slug VARCHAR(50) UNIQUE NOT NULL,
    name VARCHAR(100) NOT NULL,
    icon VARCHAR(50),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabela de Network Devices
CREATE TABLE IF NOT EXISTS network_devices (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
    vlan_id UUID REFERENCES vlans(id) ON DELETE SET NULL,
    category_id UUID REFERENCES device_categories(id) ON DELETE SET NULL,
    managed_by UUID REFERENCES users(id) ON DELETE SET NULL,
    device_type VARCHAR(50) NOT NULL,
    model VARCHAR(100),
    manufacturer VARCHAR(50),
    ip_address INET,
    mac_address MACADDR,
    hostname VARCHAR(100),
    serial_number VARCHAR(100),
    firmware_version VARCHAR(50),
    tag VARCHAR(50),
    location VARCHAR(200),
    notes TEXT,
    status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'maintenance', 'error')),
    configuration JSONB DEFAULT '{}',
    last_seen TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabela de Device Connections
CREATE TABLE IF NOT EXISTS device_connections (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
    from_device_id UUID REFERENCES network_devices(id) ON DELETE CASCADE,
    to_device_id UUID REFERENCES network_devices(id) ON DELETE CASCADE,
    connection_type VARCHAR(50),
    port_from VARCHAR(50),
    port_to VARCHAR(50),
    bandwidth INTEGER,
    status VARCHAR(20) DEFAULT 'active',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabela de Alerts
CREATE TABLE IF NOT EXISTS alerts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
    device_id UUID REFERENCES network_devices(id) ON DELETE CASCADE,
    alert_type VARCHAR(50) NOT NULL,
    severity VARCHAR(20) NOT NULL CHECK (severity IN ('info', 'warning', 'critical')),
    title VARCHAR(200) NOT NULL,
    description TEXT,
    metadata JSONB DEFAULT '{}',
    is_resolved BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    resolved_at TIMESTAMP WITH TIME ZONE
);

-- Tabela de Simulations
CREATE TABLE IF NOT EXISTS simulations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    config JSONB DEFAULT '{}',
    status VARCHAR(50) DEFAULT 'draft',
    created_by UUID REFERENCES users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabela de Audit Logs
CREATE TABLE IF NOT EXISTS audit_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id),
    action VARCHAR(100) NOT NULL,
    resource_type VARCHAR(100),
    resource_id UUID,
    old_values JSONB,
    new_values JSONB,
    ip_address INET,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabela de Login Events
CREATE TABLE IF NOT EXISTS login_events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id),
    email VARCHAR(255),
    provider VARCHAR(50),
    success BOOLEAN DEFAULT true,
    ip_address INET,
    user_agent TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabela de System Settings
CREATE TABLE IF NOT EXISTS system_settings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    key VARCHAR(100) UNIQUE NOT NULL,
    value JSONB,
    description TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Índices
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);
CREATE INDEX IF NOT EXISTS idx_projects_client ON projects(client_id);
CREATE INDEX IF NOT EXISTS idx_vlans_project ON vlans(project_id);
CREATE INDEX IF NOT EXISTS idx_devices_project ON network_devices(project_id);
CREATE INDEX IF NOT EXISTS idx_devices_vlan ON network_devices(vlan_id);
CREATE INDEX IF NOT EXISTS idx_alerts_project ON alerts(project_id);
CREATE INDEX IF NOT EXISTS idx_alerts_device ON alerts(device_id);
CREATE INDEX IF NOT EXISTS idx_audit_user ON audit_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_audit_created ON audit_logs(created_at DESC);
`;

const SEED_SQL = `
-- Roles padrão
INSERT INTO roles (name, description, permissions) VALUES
('admin', 'Administrador do Sistema', '["*"]'),
('manager', 'Gerente de Projetos', '["projects:*", "devices:*", "users:read"]'),
('operator', 'Operador', '["devices:read", "devices:update", "alerts:*"]'),
('viewer', 'Visualizador', '["projects:read", "devices:read", "alerts:read"]')
ON CONFLICT (name) DO NOTHING;

-- Categorias de dispositivos padrão
INSERT INTO device_categories (slug, name, icon) VALUES
('camera', 'Câmera', 'camera'),
('nvr', 'NVR/DVR', 'storage'),
('switch', 'Switch', 'lan'),
('router', 'Router', 'router'),
('firewall', 'Firewall', 'security'),
('access_point', 'Access Point', 'wifi'),
('reader', 'Leitor de Acesso', 'badge'),
('controller', 'Controlador', 'memory'),
('converter', 'Conversor', 'settings_input_component'),
('sensor', 'Sensor', 'sensors'),
('server', 'Servidor', 'dns'),
('other', 'Outro', 'devices_other')
ON CONFLICT (slug) DO NOTHING;

-- Usuário admin de exemplo
INSERT INTO users (email, name, role, is_active) VALUES
('admin@onliops.com', 'Administrador', 'admin', true)
ON CONFLICT (email) DO NOTHING;

-- Settings padrão
INSERT INTO system_settings (key, value, description) VALUES
('app_name', '"OnliOps"', 'Nome da aplicação'),
('theme', '"dark"', 'Tema padrão'),
('notifications_enabled', 'true', 'Notificações habilitadas')
ON CONFLICT (key) DO NOTHING;
`;

// Migrations to add new columns to existing tables
async function runMigrations(pool) {
    const migrations = [
        // Add phone column to users
        {
            name: 'add_phone_to_users',
            sql: `ALTER TABLE users ADD COLUMN IF NOT EXISTS phone VARCHAR(20);`
        },
        // Add password_hash column to users
        {
            name: 'add_password_hash_to_users',
            sql: `ALTER TABLE users ADD COLUMN IF NOT EXISTS password_hash VARCHAR(255);`
        },
        // Add avatar_url column to users
        {
            name: 'add_avatar_url_to_users',
            sql: `ALTER TABLE users ADD COLUMN IF NOT EXISTS avatar_url TEXT;`
        },
        // Add telegram_chat_id column to users
        {
            name: 'add_telegram_chat_id_to_users',
            sql: `ALTER TABLE users ADD COLUMN IF NOT EXISTS telegram_chat_id VARCHAR(50);`
        },
        // Add telegram_verified column to users
        {
            name: 'add_telegram_verified_to_users',
            sql: `ALTER TABLE users ADD COLUMN IF NOT EXISTS telegram_verified BOOLEAN DEFAULT false;`
        },
        // Create password_request_logs table
        {
            name: 'create_password_request_logs',
            sql: `CREATE TABLE IF NOT EXISTS password_request_logs (
                id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                user_id UUID REFERENCES users(id) ON DELETE CASCADE,
                device_id UUID REFERENCES network_devices(id) ON DELETE CASCADE,
                requested_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
                ip_address VARCHAR(45),
                user_agent TEXT,
                status VARCHAR(20) DEFAULT 'sent'
            );`
        },
        // Create index on password_request_logs
        {
            name: 'create_idx_password_request_logs_user',
            sql: `CREATE INDEX IF NOT EXISTS idx_password_request_logs_user ON password_request_logs(user_id);`
        },
        {
            name: 'create_idx_password_request_logs_device',
            sql: `CREATE INDEX IF NOT EXISTS idx_password_request_logs_device ON password_request_logs(device_id);`
        },
        // Add serial_number column to network_devices
        {
            name: 'add_serial_number_to_network_devices',
            sql: `ALTER TABLE network_devices ADD COLUMN IF NOT EXISTS serial_number VARCHAR(100);`
        },
        // Add firmware_version column to network_devices
        {
            name: 'add_firmware_version_to_network_devices',
            sql: `ALTER TABLE network_devices ADD COLUMN IF NOT EXISTS firmware_version VARCHAR(50);`
        },
        // Add location column to network_devices
        {
            name: 'add_location_to_network_devices',
            sql: `ALTER TABLE network_devices ADD COLUMN IF NOT EXISTS location VARCHAR(200);`
        },
        // Add notes column to network_devices
        {
            name: 'add_notes_to_network_devices',
            sql: `ALTER TABLE network_devices ADD COLUMN IF NOT EXISTS notes TEXT;`
        },
        // Add unique constraint on ip_address + project_id for UPSERT
        {
            name: 'add_unique_ip_project_to_network_devices',
            sql: `CREATE UNIQUE INDEX IF NOT EXISTS idx_network_devices_ip_project ON network_devices(ip_address, project_id);`
        },
        // Add tag column to network_devices
        {
            name: 'add_tag_to_network_devices',
            sql: `ALTER TABLE network_devices ADD COLUMN IF NOT EXISTS tag VARCHAR(50);`
        },
        // Add index for tag column
        {
            name: 'add_idx_network_devices_tag',
            sql: `CREATE INDEX IF NOT EXISTS idx_network_devices_tag ON network_devices(tag);`
        },
        // Add category_id column to network_devices
        {
            name: 'add_category_id_to_network_devices',
            sql: `ALTER TABLE network_devices ADD COLUMN IF NOT EXISTS category_id UUID REFERENCES device_categories(id) ON DELETE SET NULL;`
        },
        // Allow NULL in vlan_id column (for devices without VLAN assignment)
        {
            name: 'allow_null_vlan_id',
            sql: `ALTER TABLE network_devices ALTER COLUMN vlan_id DROP NOT NULL;`
        }
    ];

    for (const migration of migrations) {
        try {
            await pool.query(migration.sql);
            console.log(`[DB] Migration '${migration.name}' applied successfully`);
        } catch (error) {
            // Ignore errors for already existing columns
            if (!error.message.includes('already exists')) {
                console.error(`[DB] Migration '${migration.name}' failed:`, error.message);
            }
        }
    }
}

async function initializeDatabase(pool) {
    console.log('[DB] Checking database schema...');

    try {
        // Check if tables exist
        const { rows } = await pool.query(`
            SELECT COUNT(*) as count 
            FROM information_schema.tables 
            WHERE table_schema = 'public' 
            AND table_name = 'clients'
        `);

        const tablesExist = parseInt(rows[0].count) > 0;

        if (!tablesExist) {
            console.log('[DB] Tables not found. Creating schema...');
            await pool.query(SCHEMA_SQL);
            console.log('[DB] Schema created successfully!');

            console.log('[DB] Inserting seed data...');
            await pool.query(SEED_SQL);
            console.log('[DB] Seed data inserted successfully!');
        } else {
            console.log('[DB] Tables already exist. Ensuring all tables are up to date...');
            // Run schema anyway with IF NOT EXISTS - won't affect existing tables
            await pool.query(SCHEMA_SQL);
            console.log('[DB] Schema verified.');

            // Run migrations to add new columns to existing tables
            console.log('[DB] Running migrations for new columns...');
            await runMigrations(pool);
        }

        // Verify table count
        const { rows: tableCount } = await pool.query(`
            SELECT COUNT(*) as count 
            FROM information_schema.tables 
            WHERE table_schema = 'public'
        `);
        console.log(`[DB] Total tables in database: ${tableCount[0].count}`);

        return true;
    } catch (error) {
        console.error('[DB] Error initializing database:', error.message);
        return false;
    }
}

module.exports = { initializeDatabase };
