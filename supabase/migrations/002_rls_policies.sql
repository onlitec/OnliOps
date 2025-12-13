-- Enable RLS on all tables
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE network_devices ENABLE ROW LEVEL SECURITY;
ALTER TABLE device_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE alerts ENABLE ROW LEVEL SECURITY;

-- Users policies
-- Users can only see their own profile (except admins)
CREATE POLICY "Users can view own profile" ON users
    FOR SELECT USING (
        auth.uid() = id OR 
        EXISTS (
            SELECT 1 FROM users 
            WHERE id = auth.uid() AND role = 'admin'
        )
    );

-- Only admins can update users
CREATE POLICY "Only admins can update users" ON users
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM users 
            WHERE id = auth.uid() AND role = 'admin'
        )
    );

-- Network Devices policies
-- All authenticated users can view devices
CREATE POLICY "Authenticated users can view devices" ON network_devices
    FOR SELECT TO authenticated
    USING (true);

-- Only admins and security operators can update devices
CREATE POLICY "Authorized users can update devices" ON network_devices
    FOR UPDATE TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM users 
            WHERE id = auth.uid() AND role IN ('admin', 'security_operator')
        )
    );

-- Only admins can insert/delete devices
CREATE POLICY "Only admins can modify device structure" ON network_devices
    FOR ALL TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM users 
            WHERE id = auth.uid() AND role = 'admin'
        )
    );

-- Device History policies
-- All authenticated users can view device history
CREATE POLICY "Authenticated users can view device history" ON device_history
    FOR SELECT TO authenticated
    USING (true);

-- Only admins can modify device history
CREATE POLICY "Only admins can modify device history" ON device_history
    FOR ALL TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM users 
            WHERE id = auth.uid() AND role = 'admin'
        )
    );

-- Alerts policies
-- All authenticated users can view alerts
CREATE POLICY "Authenticated users can view alerts" ON alerts
    FOR SELECT TO authenticated
    USING (true);

-- Only admins can modify alerts
CREATE POLICY "Only admins can modify alerts" ON alerts
    FOR ALL TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM users 
            WHERE id = auth.uid() AND role = 'admin'
        )
    );

-- Grant permissions
-- Grant basic read access to anon role for public data
GRANT SELECT ON vlans TO anon;
GRANT SELECT ON network_devices TO anon;

-- Grant full access to authenticated role
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO authenticated;
GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO authenticated;

-- Grant usage on schema
GRANT USAGE ON SCHEMA public TO anon, authenticated;