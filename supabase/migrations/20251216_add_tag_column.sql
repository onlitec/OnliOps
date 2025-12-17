-- ============================================
-- Migration: Add TAG column to network_devices
-- Date: 2025-12-16
-- ============================================
-- Add TAG column for device identification/labeling
ALTER TABLE network_devices
ADD COLUMN IF NOT EXISTS tag VARCHAR(50);
-- Create index for fast tag searches
CREATE INDEX IF NOT EXISTS idx_network_devices_tag ON network_devices(tag);
-- Comment
COMMENT ON COLUMN network_devices.tag IS 'Device identification tag (e.g., CAM-001, SW-RACK-01)';