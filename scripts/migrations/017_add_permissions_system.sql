-- Migration: Add Permissions System
-- File: 017_add_permissions_system.sql
-- Enable UUID extension if not exists
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
-- Create roles table
CREATE TABLE IF NOT EXISTS roles (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(50) UNIQUE NOT NULL,
    description TEXT,
    permissions JSONB NOT NULL,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);
-- Create user_permissions table
CREATE TABLE IF NOT EXISTS user_permissions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    role_id UUID REFERENCES roles(id) ON DELETE CASCADE,
    client_id UUID REFERENCES clients(id) ON DELETE CASCADE,
    project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),
    UNIQUE(user_id, role_id, client_id, project_id)
);
-- Create indexes
CREATE INDEX IF NOT EXISTS idx_user_permissions_user ON user_permissions(user_id);
CREATE INDEX IF NOT EXISTS idx_user_permissions_client ON user_permissions(client_id);
CREATE INDEX IF NOT EXISTS idx_user_permissions_project ON user_permissions(project_id);
-- Insert default roles
INSERT INTO roles (name, description, permissions)
VALUES (
        'platform_admin',
        'Administrador da Plataforma',
        '{
    "clients": ["read", "write", "delete"],
    "projects": ["read", "write", "delete"],
    "users": ["read", "write", "delete"],
    "devices": ["read", "write", "delete"],
    "vlans": ["read", "write", "delete"],
    "topology": ["read", "write", "delete"],
    "settings": ["read", "write"],
    "integrations": ["read", "write"],
    "tickets": ["read", "write", "delete"]
}'::jsonb
    ),
    (
        'client_admin',
        'Administrador do Cliente',
        '{
    "projects": ["read", "write", "delete"],
    "users": ["read", "write"],
    "devices": ["read", "write", "delete"],
    "vlans": ["read", "write", "delete"],
    "topology": ["read", "write", "delete"],
    "settings": ["read", "write"],
    "tickets": ["read", "write"]
}'::jsonb
    ),
    (
        'project_manager',
        'Gerente do Projeto',
        '{
    "devices": ["read", "write", "delete"],
    "vlans": ["read", "write", "delete"],
    "topology": ["read", "write", "delete"],
    "settings": ["read", "write"],
    "tickets": ["read", "write"]
}'::jsonb
    ),
    (
        'project_viewer',
        'Visualizador do Projeto',
        '{
    "devices": ["read"],
    "vlans": ["read"],
    "topology": ["read"],
    "settings": ["read"],
    "tickets": ["read"]
}'::jsonb
    ) ON CONFLICT (name) DO NOTHING;
-- Assign admin user as platform_admin
DO $$
DECLARE admin_user_id UUID;
platform_admin_role_id UUID;
BEGIN
SELECT id INTO admin_user_id
FROM users
WHERE email = 'admin@onliops.local'
LIMIT 1;
SELECT id INTO platform_admin_role_id
FROM roles
WHERE name = 'platform_admin'
LIMIT 1;
IF admin_user_id IS NOT NULL
AND platform_admin_role_id IS NOT NULL THEN
INSERT INTO user_permissions (user_id, role_id, client_id, project_id)
VALUES (
        admin_user_id,
        platform_admin_role_id,
        NULL,
        NULL
    ) ON CONFLICT DO NOTHING;
END IF;
END $$;