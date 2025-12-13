-- Sample data for testing the Inventory module
-- This script adds example devices to demonstrate the inventory functionality

-- First, ensure we have a VLAN (if not already exists)
INSERT INTO public.vlans (vlan_id, name, subnet, gateway, description)
VALUES (100, 'CFTV', '192.168.100.0/24', '192.168.100.1', 'VLAN para dispositivos de CFTV')
ON CONFLICT (vlan_id) DO NOTHING;

-- Add sample NVRs
INSERT INTO public.network_devices (
  vlan_id, device_type, serial_number, ip_address, mac_address, hostname, model, manufacturer,
  firmware_version, location, status, install_date, admin_username, notes
) VALUES
(
  100, 'nvr', 'NVR-001-2024', '192.168.100.10', '00:11:22:33:44:01',
  'NVR-PRINCIPAL', 'DS-7732NI-I4', 'Hikvision', 'V4.1.71',
  'Sala de Segurança - Rack Principal', 'active', '2024-01-15',
  'admin', 'NVR principal com 32 canais'
),
(
  100, 'nvr', 'NVR-002-2024', '192.168.100.11', '00:11:22:33:44:02',
  'NVR-SECUNDARIO', 'DS-7716NI-I4', 'Hikvision', 'V4.1.71',
  'Sala de Segurança - Rack Secundário', 'active', '2024-01-15',
  'admin', 'NVR secundário com 16 canais'
)
ON CONFLICT (ip_address) DO NOTHING;

-- Get NVR IDs for camera connections
DO $$
DECLARE
  nvr_principal_id UUID;
  nvr_secundario_id UUID;
BEGIN
  SELECT id INTO nvr_principal_id FROM public.network_devices WHERE hostname = 'NVR-PRINCIPAL' LIMIT 1;
  SELECT id INTO nvr_secundario_id FROM public.network_devices WHERE hostname = 'NVR-SECUNDARIO' LIMIT 1;

  -- Add sample cameras
  INSERT INTO public.network_devices (
    vlan_id, device_type, serial_number, ip_address, mac_address, hostname, model, manufacturer,
    firmware_version, location, status, install_date, connected_nvr_id, patch_panel, patch_panel_port,
    switch_port, admin_username, notes
  ) VALUES
  (
    100, 'camera', 'CAM-ENT-001', '192.168.100.101', '00:11:22:33:55:01',
    'CAM-ENTRADA-PRINCIPAL', 'DS-2CD2385G1', 'Hikvision', 'V5.7.3',
    'Torre A - Entrada Principal', 'active', '2024-01-20', nvr_principal_id,
    'PP-01', '12', 'GE1/0/12', 'admin', 'Câmera 8MP com IR 30m'
  ),
  (
    100, 'camera', 'CAM-EST-001', '192.168.100.102', '00:11:22:33:55:02',
    'CAM-ESTACIONAMENTO-01', 'DS-2CD2385G1', 'Hikvision', 'V5.7.3',
    'Estacionamento - Entrada', 'active', '2024-01-20', nvr_principal_id,
    'PP-01', '13', 'GE1/0/13', 'admin', 'Câmera com leitura de placas'
  ),
  (
    100, 'camera', 'CAM-HAL-001', '192.168.100.103', '00:11:22:33:55:03',
    'CAM-HALL-3ANDAR', 'DS-2CD2385G1', 'Hikvision', 'V5.7.3',
    'Torre A - 3º Andar - Hall dos Elevadores', 'active', '2024-01-21', nvr_principal_id,
    'PP-02', '05', 'GE1/0/24', 'admin', 'Câmera dome interna'
  ),
  (
    100, 'camera', 'CAM-PER-001', '192.168.100.104', '00:11:22:33:55:04',
    'CAM-PERIMETRO-NORTE', 'DS-2CD2T85G1', 'Hikvision', 'V5.7.3',
    'Perímetro Norte - Muro', 'active', '2024-01-22', nvr_secundario_id,
    'PP-03', '08', 'GE2/0/08', 'admin', 'Câmera bullet externa com IR 80m'
  ),
  (
    100, 'camera', 'CAM-REC-001', '192.168.100.105', '00:11:22:33:55:05',
    'CAM-RECEPCAO', 'DS-2CD2385G1', 'Hikvision', 'V5.7.3',
    'Torre B - Recepção', 'active', '2024-01-23', nvr_secundario_id,
    'PP-03', '09', 'GE2/0/09', 'admin', 'Câmera com áudio bidirecional'
  )
  ON CONFLICT (ip_address) DO NOTHING;
END $$;

-- Add sample switches
INSERT INTO public.network_devices (
  vlan_id, device_type, serial_number, ip_address, mac_address, hostname, model, manufacturer,
  firmware_version, location, status, install_date, admin_username, notes
) VALUES
(
  100, 'switch', 'SW-001-2024', '192.168.100.20', '00:11:22:33:66:01',
  'SW-RACK-PRINCIPAL', 'S2700-26TP-EI', 'Huawei', 'V200R011C10SPC600',
  'Sala de Segurança - Rack Principal', 'active', '2024-01-10',
  'admin', 'Switch principal 24 portas PoE+'
),
(
  100, 'switch', 'SW-002-2024', '192.168.100.21', '00:11:22:33:66:02',
  'SW-TORRE-A', 'S2700-26TP-EI', 'Huawei', 'V200R011C10SPC600',
  'Torre A - 1º Andar - Sala Técnica', 'active', '2024-01-10',
  'admin', 'Switch Torre A com PoE'
)
ON CONFLICT (ip_address) DO NOTHING;

-- Add sample patch panels
INSERT INTO public.network_devices (
  vlan_id, device_type, serial_number, ip_address, mac_address, hostname, model, manufacturer,
  location, status, install_date, notes
) VALUES
(
  100, 'patch_panel', 'PP-001-2024', '0.0.0.0', NULL,
  'PP-RACK-PRINCIPAL-01', 'PP-24P-CAT6', 'Furukawa',
  'Sala de Segurança - Rack Principal - U10', 'active', '2024-01-05',
  'Patch Panel 24 portas Cat6 - Câmeras Torre A'
),
(
  100, 'patch_panel', 'PP-002-2024', '0.0.0.0', NULL,
  'PP-RACK-PRINCIPAL-02', 'PP-24P-CAT6', 'Furukawa',
  'Sala de Segurança - Rack Principal - U12', 'active', '2024-01-05',
  'Patch Panel 24 portas Cat6 - Câmeras Torre B'
)
ON CONFLICT (ip_address) DO NOTHING;

-- Add sample access controller
INSERT INTO public.network_devices (
  vlan_id, device_type, serial_number, ip_address, mac_address, hostname, model, manufacturer,
  firmware_version, location, status, install_date, admin_username, notes
) VALUES
(
  100, 'controller', 'CTRL-001-2024', '192.168.100.30', '00:11:22:33:77:01',
  'CTRL-ACESSO-PRINCIPAL', 'AC-2204', 'Intelbras', 'V2.3.1',
  'Sala de Segurança - Rack Principal', 'active', '2024-02-01',
  'admin', 'Controladora de acesso 4 portas'
)
ON CONFLICT (ip_address) DO NOTHING;

-- Add maintenance logs for some devices
DO $$
DECLARE
  cam_entrada_id UUID;
  nvr_principal_id UUID;
BEGIN
  SELECT id INTO cam_entrada_id FROM public.network_devices WHERE hostname = 'CAM-ENTRADA-PRINCIPAL' LIMIT 1;
  SELECT id INTO nvr_principal_id FROM public.network_devices WHERE hostname = 'NVR-PRINCIPAL' LIMIT 1;

  IF cam_entrada_id IS NOT NULL THEN
    INSERT INTO public.maintenance_logs (device_id, technician_name, description, service_date)
    VALUES
    (cam_entrada_id, 'João Silva', 'Limpeza de lente e ajuste de foco', '2024-06-15'),
    (cam_entrada_id, 'Maria Santos', 'Atualização de firmware para V5.7.3', '2024-03-10');
  END IF;

  IF nvr_principal_id IS NOT NULL THEN
    INSERT INTO public.maintenance_logs (device_id, technician_name, description, service_date)
    VALUES
    (nvr_principal_id, 'Carlos Oliveira', 'Expansão de HD - Adicionado 4TB', '2024-05-20'),
    (nvr_principal_id, 'João Silva', 'Manutenção preventiva e limpeza', '2024-07-01');
  END IF;
END $$;

-- Update last_maintenance_date for devices with maintenance logs
UPDATE public.network_devices nd
SET last_maintenance_date = (
  SELECT MAX(service_date)
  FROM public.maintenance_logs ml
  WHERE ml.device_id = nd.id
)
WHERE EXISTS (
  SELECT 1 FROM public.maintenance_logs ml WHERE ml.device_id = nd.id
);
