-- Insert sample users
INSERT INTO users (email, name, role, is_active) VALUES
('admin@onliops.com', 'Administrador Principal', 'admin', true),
('security@onliops.com', 'Operador de Segurança', 'security_operator', true),
('tech@onliops.com', 'Visualizador Técnico', 'technical_viewer', true);

-- Insert sample network devices
INSERT INTO network_devices (vlan_id, device_type, model, manufacturer, ip_address, mac_address, hostname, location, status) VALUES
-- VLAN 10 - Management
(10, 'switch', 'Cisco Catalyst 2960', 'Cisco', '10.10.10.10', '00:1a:2b:3c:4d:5e', 'SW-MGMT-01', 'Central - Rack Principal', 'active'),
(10, 'router', 'MikroTik RB750Gr3', 'MikroTik', '10.10.10.1', '00:1b:2c:3d:4e:5f', 'RT-MGMT-01', 'Central - Rack Principal', 'active'),

-- VLAN 20 - Data
(20, 'switch', 'Cisco Catalyst 3750', 'Cisco', '10.10.20.10', '00:2a:3b:4c:5d:6e', 'SW-DATA-01', 'Andar 1 - Rack Secundário', 'active'),
(20, 'access_point', 'Ubiquiti UniFi AP', 'Ubiquiti', '10.10.20.20', '00:2b:3c:4d:5e:6f', 'AP-DATA-01', 'Andar 1 - Corredor', 'active'),

-- VLAN 40 - CFTV
(40, 'camera', 'Hikvision DS-2CD1323G2-LIU', 'Hikvision', '10.10.40.11', '00:4a:5b:6c:7d:8e', 'CAM-ENTRANCE-01', 'Entrada Principal', 'active'),
(40, 'camera', 'Hikvision DS-2CD1323G2-LIU', 'Hikvision', '10.10.40.12', '00:4b:5c:6d:7e:8f', 'CAM-GARAGE-01', 'Garagem', 'active'),
(40, 'camera', 'Hikvision DS-2CD1323G2-LIU', 'Hikvision', '10.10.40.13', '00:4c:5d:6e:7f:9g', 'CAM-ELEVATOR-01', 'Elevador', 'active'),
(40, 'nvr', 'Hikvision DS-7608NXI-I2', 'Hikvision', '10.10.40.10', '00:4d:5e:6f:7g:8h', 'NVR-01', 'Central - Sala de Segurança', 'active'),

-- VLAN 50 - Access Control
(50, 'reader', 'HID ProxPro', 'HID Global', '10.10.50.11', '00:5a:6b:7c:8d:9e', 'READER-ENTRANCE-01', 'Entrada Principal', 'active'),
(50, 'reader', 'HID ProxPro', 'HID Global', '10.10.50.12', '00:5b:6c:7d:8e:9f', 'READER-GARAGE-01', 'Garagem', 'active'),
(50, 'controller', 'HID VertX V2000', 'HID Global', '10.10.50.10', '00:5c:6d:7e:8f:9g', 'CTRL-ACCESS-01', 'Central - Sala de Segurança', 'active'),

-- VLAN 60 - IoT
(60, 'converter', 'Moxa NPort 5110', 'Moxa', '10.10.60.11', '00:6a:7b:8c:9d:ae', 'CONV-IOT-01', 'Subsolo - Sala de Máquinas', 'active'),
(60, 'converter', 'Moxa NPort 5110', 'Moxa', '10.10.60.12', '00:6b:7c:8d:9e:af', 'CONV-IOT-02', 'Cobertura - Central de Ar', 'active');

-- Insert sample alerts
INSERT INTO alerts (device_id, alert_type, severity, title, description, is_resolved) VALUES
((SELECT id FROM network_devices WHERE hostname = 'CAM-ENTRANCE-01'), 'connectivity', 'warning', 'Câmera com Sinal Fraco', 'A câmera da entrada principal está com sinal de rede fraco', false),
((SELECT id FROM network_devices WHERE hostname = 'SW-DATA-01'), 'performance', 'info', 'Alta Utilização de CPU', 'Switch com 85% de utilização de CPU nas últimas 2 horas', true),
((SELECT id FROM network_devices WHERE hostname = 'READER-GARAGE-01'), 'hardware', 'critical', 'Leitor com Falha de Hardware', 'Leitor do estacionamento não está respondendo aos comandos', false);

-- Insert sample device metrics
INSERT INTO device_metrics (device_id, cpu_usage, memory_usage, network_in, network_out, active_connections) VALUES
((SELECT id FROM network_devices WHERE hostname = 'SW-MGMT-01'), 45.2, 67.8, 1024000, 2048000, 25),
((SELECT id FROM network_devices WHERE hostname = 'RT-MGMT-01'), 23.5, 45.2, 2048000, 4096000, 50),
((SELECT id FROM network_devices WHERE hostname = 'NVR-01'), 78.9, 82.3, 8192000, 1024000, 15),
((SELECT id FROM network_devices WHERE hostname = 'CTRL-ACCESS-01'), 12.3, 34.5, 512000, 256000, 8);

-- Insert sample network statistics
INSERT INTO network_statistics (total_devices, active_devices, total_vlans, total_alerts, critical_alerts, network_in, network_out) VALUES
(12, 11, 7, 3, 1, 12288000, 7372800);