-- Migration: Remove restrictive device_type check constraint
-- The network_devices table has a CHECK constraint on device_type that limits the allowed values.
-- This migration drops that constraint to allow for flexible device types (like 'server', 'sensor', 'other')
-- which are present in the device_categories table/seeds but blocked by this constraint.
ALTER TABLE network_devices DROP CONSTRAINT IF EXISTS network_devices_device_type_check;