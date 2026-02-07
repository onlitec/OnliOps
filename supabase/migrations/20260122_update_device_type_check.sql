-- Migration: Update device_type check constraint to include new types
-- This migration updates the existing constraint to allow for 'server', 'pc', 'intercom' and others.

-- Drop existing constraint if it exists
ALTER TABLE network_devices DROP CONSTRAINT IF EXISTS network_devices_device_type_check;

-- Add updated constraint with all allowed types
ALTER TABLE network_devices ADD CONSTRAINT network_devices_device_type_check 
CHECK (device_type IN (
  'camera', 'nvr', 'dvr', 'switch', 'router', 'firewall', 
  'access_point', 'reader', 'controller', 'converter', 
  'patch_panel', 'server', 'pc', 'ap_wifi', 'intercom', 
  'elevator_recorder', 'other'
));
