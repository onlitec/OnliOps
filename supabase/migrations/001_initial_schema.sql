-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create users table
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email VARCHAR(255) UNIQUE NOT NULL,
    name VARCHAR(100) NOT NULL,
    role VARCHAR(20) NOT NULL CHECK (role IN ('admin', 'security_operator', 'technical_viewer', 'guest')),
    is_active BOOLEAN DEFAULT true,
    last_login TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for users
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_role ON users(role);
CREATE INDEX idx_users_active ON users(is_active);

-- Create VLANs table
CREATE TABLE vlans (
    vlan_id INTEGER PRIMARY KEY,
    name VARCHAR(50) NOT NULL,
    subnet VARCHAR(18) NOT NULL,
    gateway VARCHAR(15) NOT NULL,
    description TEXT,
    firewall_rules JSONB DEFAULT '[]',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Insert default VLANs
INSERT INTO vlans (vlan_id, name, subnet, gateway, description) VALUES
(10, 'Management', '10.10.10.0/24', '10.10.10.1', 'Gerenciamento de infraestrutura'),
(20, 'Data', '10.10.20.0/24', '10.10.20.1', 'Rede corporativa'),
(30, 'Voice', '10.10.30.0/24', '10.10.30.1', 'Telefonia IP'),
(40, 'CFTV', '10.10.40.0/24', '10.10.40.1', 'Sistema de CFTV'),
(50, 'Access Control', '10.10.50.0/24', '10.10.50.1', 'Controle de acesso'),
(60, 'IoT', '10.10.60.0/24', '10.10.60.1', 'Dispositivos IoT'),
(100, 'Guest', '10.10.100.0/24', '10.10.100.1', 'WiFi visitantes');

-- Create network_devices table
CREATE TABLE network_devices (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    vlan_id INTEGER NOT NULL REFERENCES vlans(vlan_id),
    managed_by UUID REFERENCES users(id),
    device_type VARCHAR(50) NOT NULL CHECK (device_type IN ('camera', 'nvr', 'switch', 'router', 'firewall', 'access_point', 'reader', 'controller', 'converter')),
    model VARCHAR(100) NOT NULL,
    manufacturer VARCHAR(50) NOT NULL,
    ip_address INET UNIQUE NOT NULL,
    mac_address MACADDR,
    hostname VARCHAR(100),
    location VARCHAR(200),
    status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'maintenance', 'error')),
    configuration JSONB DEFAULT '{}',
    last_seen TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for network_devices
CREATE INDEX idx_network_devices_vlan ON network_devices(vlan_id);
CREATE INDEX idx_network_devices_ip ON network_devices(ip_address);
CREATE INDEX idx_network_devices_status ON network_devices(status);
CREATE INDEX idx_network_devices_type ON network_devices(device_type);
CREATE INDEX idx_network_devices_location ON network_devices(location);

-- Create device_metrics table
CREATE TABLE device_metrics (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    device_id UUID NOT NULL REFERENCES network_devices(id) ON DELETE CASCADE,
    timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    cpu_usage DECIMAL(5,2) DEFAULT 0,
    memory_usage DECIMAL(5,2) DEFAULT 0,
    network_in BIGINT DEFAULT 0,
    network_out BIGINT DEFAULT 0,
    active_connections INTEGER DEFAULT 0,
    custom_metrics JSONB DEFAULT '{}'
);

-- Create indexes for device_metrics
CREATE INDEX idx_device_metrics_device ON device_metrics(device_id);
CREATE INDEX idx_device_metrics_timestamp ON device_metrics(timestamp DESC);
CREATE INDEX idx_device_metrics_recent ON device_metrics(device_id, timestamp DESC);

-- Create device_connections table
CREATE TABLE device_connections (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    from_device_id UUID NOT NULL REFERENCES network_devices(id) ON DELETE CASCADE,
    to_device_id UUID NOT NULL REFERENCES network_devices(id) ON DELETE CASCADE,
    connection_type VARCHAR(50) NOT NULL,
    port_from VARCHAR(50),
    port_to VARCHAR(50),
    bandwidth INTEGER,
    status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'error')),
    established_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for device_connections
CREATE INDEX idx_device_connections_from ON device_connections(from_device_id);
CREATE INDEX idx_device_connections_to ON device_connections(to_device_id);
CREATE INDEX idx_device_connections_status ON device_connections(status);

-- Create device_history table
CREATE TABLE device_history (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    device_id UUID NOT NULL REFERENCES network_devices(id) ON DELETE CASCADE,
    user_id UUID REFERENCES users(id),
    action_type VARCHAR(50) NOT NULL,
    old_values JSONB DEFAULT '{}',
    new_values JSONB DEFAULT '{}',
    notes TEXT,
    ip_address INET,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for device_history
CREATE INDEX idx_device_history_device ON device_history(device_id);
CREATE INDEX idx_device_history_user ON device_history(user_id);
CREATE INDEX idx_device_history_created ON device_history(created_at DESC);
CREATE INDEX idx_device_history_action ON device_history(action_type);

-- Create alerts table
CREATE TABLE alerts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
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

-- Create indexes for alerts
CREATE INDEX idx_alerts_device ON alerts(device_id);
CREATE INDEX idx_alerts_severity ON alerts(severity);
CREATE INDEX idx_alerts_resolved ON alerts(is_resolved);
CREATE INDEX idx_alerts_created ON alerts(created_at DESC);

-- Create network_statistics table
CREATE TABLE network_statistics (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    total_devices INTEGER DEFAULT 0,
    active_devices INTEGER DEFAULT 0,
    total_vlans INTEGER DEFAULT 0,
    total_alerts INTEGER DEFAULT 0,
    critical_alerts INTEGER DEFAULT 0,
    network_in BIGINT DEFAULT 0,
    network_out BIGINT DEFAULT 0,
    timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create index for network_statistics
CREATE INDEX idx_network_statistics_timestamp ON network_statistics(timestamp DESC);