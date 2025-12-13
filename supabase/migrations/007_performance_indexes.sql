-- Strategic performance indexes on existing tables
-- Users
CREATE INDEX IF NOT EXISTS idx_users_email ON public.users(email);
CREATE INDEX IF NOT EXISTS idx_users_updated_at ON public.users(updated_at);

-- Login events
CREATE INDEX IF NOT EXISTS idx_login_events_created_at ON public.login_events(created_at);
CREATE INDEX IF NOT EXISTS idx_login_events_provider ON public.login_events(provider);

-- Device metrics (frequent series by device/timestamp)
CREATE INDEX IF NOT EXISTS idx_device_metrics_device_ts ON public.device_metrics(device_id, timestamp);

-- Network devices (filter by vlan/status)
CREATE INDEX IF NOT EXISTS idx_network_devices_vlan_status ON public.network_devices(vlan_id, status);

-- Alerts (severity/time)
CREATE INDEX IF NOT EXISTS idx_alerts_severity_created ON public.alerts(severity, created_at);

-- Device connections (graph lookups)
CREATE INDEX IF NOT EXISTS idx_device_connections_from ON public.device_connections(from_device_id);
CREATE INDEX IF NOT EXISTS idx_device_connections_to ON public.device_connections(to_device_id);

-- Device history (audit lookups)
CREATE INDEX IF NOT EXISTS idx_device_history_device ON public.device_history(device_id);
CREATE INDEX IF NOT EXISTS idx_device_history_user ON public.device_history(user_id);
CREATE INDEX IF NOT EXISTS idx_device_history_created ON public.device_history(created_at);
