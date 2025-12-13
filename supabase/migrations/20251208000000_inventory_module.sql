-- Migration: Inventory Module for OnliOps
-- Adds inventory-specific fields to network_devices and creates maintenance_logs table

-- Extend network_devices table with inventory fields
ALTER TABLE public.network_devices
ADD COLUMN IF NOT EXISTS serial_number VARCHAR(100) UNIQUE,
ADD COLUMN IF NOT EXISTS firmware_version VARCHAR(50),
ADD COLUMN IF NOT EXISTS admin_username VARCHAR(100),
ADD COLUMN IF NOT EXISTS admin_password_enc TEXT,
ADD COLUMN IF NOT EXISTS photo_url TEXT,
ADD COLUMN IF NOT EXISTS install_date DATE,
ADD COLUMN IF NOT EXISTS last_maintenance_date DATE,
ADD COLUMN IF NOT EXISTS notes TEXT,
ADD COLUMN IF NOT EXISTS patch_panel VARCHAR(100),
ADD COLUMN IF NOT EXISTS patch_panel_port VARCHAR(50),
ADD COLUMN IF NOT EXISTS switch_port VARCHAR(50),
ADD COLUMN IF NOT EXISTS connected_nvr_id UUID REFERENCES public.network_devices(id),
ADD COLUMN IF NOT EXISTS custom_fields JSONB DEFAULT '{}';

-- Create indexes for new fields
CREATE INDEX IF NOT EXISTS idx_network_devices_serial ON public.network_devices(serial_number);
CREATE INDEX IF NOT EXISTS idx_network_devices_nvr ON public.network_devices(connected_nvr_id);
CREATE INDEX IF NOT EXISTS idx_network_devices_manufacturer ON public.network_devices(manufacturer);

-- Create maintenance_logs table
CREATE TABLE IF NOT EXISTS public.maintenance_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  device_id UUID NOT NULL REFERENCES public.network_devices(id) ON DELETE CASCADE,
  technician_name VARCHAR(100) NOT NULL,
  description TEXT NOT NULL,
  service_date DATE NOT NULL,
  attachments_url TEXT[],
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes for maintenance_logs
CREATE INDEX IF NOT EXISTS idx_maintenance_logs_device ON public.maintenance_logs(device_id);
CREATE INDEX IF NOT EXISTS idx_maintenance_logs_date ON public.maintenance_logs(service_date DESC);

-- Grant permissions
GRANT ALL PRIVILEGES ON public.maintenance_logs TO authenticated;
GRANT SELECT ON public.maintenance_logs TO anon;

-- Add RLS policies for maintenance_logs
ALTER TABLE public.maintenance_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY maintenance_logs_select ON public.maintenance_logs
  FOR SELECT TO authenticated
  USING (true);

CREATE POLICY maintenance_logs_insert ON public.maintenance_logs
  FOR INSERT TO authenticated
  WITH CHECK (true);

CREATE POLICY maintenance_logs_update ON public.maintenance_logs
  FOR UPDATE TO authenticated
  USING (true);

CREATE POLICY maintenance_logs_delete ON public.maintenance_logs
  FOR DELETE TO authenticated
  USING (true);
