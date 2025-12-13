-- Create core tables
CREATE TABLE IF NOT EXISTS public.users (
  id UUID PRIMARY KEY,
  email VARCHAR(255) UNIQUE NOT NULL,
  name VARCHAR(100),
  role VARCHAR(20) NOT NULL CHECK (role IN ('admin','security_operator','technical_viewer','guest')),
  is_active BOOLEAN DEFAULT TRUE,
  last_login TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_users_email ON public.users(email);
CREATE INDEX IF NOT EXISTS idx_users_role ON public.users(role);
CREATE INDEX IF NOT EXISTS idx_users_active ON public.users(is_active);

CREATE TABLE IF NOT EXISTS public.vlans (
  vlan_id INTEGER PRIMARY KEY,
  name VARCHAR(50) NOT NULL,
  subnet VARCHAR(18) NOT NULL,
  gateway VARCHAR(15) NOT NULL,
  description TEXT,
  firewall_rules JSONB DEFAULT '[]',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.network_devices (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  vlan_id INTEGER NOT NULL REFERENCES public.vlans(vlan_id),
  managed_by UUID REFERENCES public.users(id),
  device_type VARCHAR(50) NOT NULL CHECK (device_type IN ('camera','nvr','switch','router','firewall','access_point','reader','controller','converter')),
  model VARCHAR(100) NOT NULL,
  manufacturer VARCHAR(50) NOT NULL,
  ip_address INET UNIQUE NOT NULL,
  mac_address MACADDR,
  hostname VARCHAR(100),
  location VARCHAR(200),
  status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active','inactive','maintenance','error')),
  configuration JSONB DEFAULT '{}',
  last_seen TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_network_devices_vlan ON public.network_devices(vlan_id);
CREATE INDEX IF NOT EXISTS idx_network_devices_ip ON public.network_devices(ip_address);
CREATE INDEX IF NOT EXISTS idx_network_devices_status ON public.network_devices(status);
CREATE INDEX IF NOT EXISTS idx_network_devices_type ON public.network_devices(device_type);
CREATE INDEX IF NOT EXISTS idx_network_devices_location ON public.network_devices(location);

CREATE TABLE IF NOT EXISTS public.device_metrics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  device_id UUID NOT NULL REFERENCES public.network_devices(id) ON DELETE CASCADE,
  timestamp TIMESTAMPTZ DEFAULT NOW(),
  cpu_usage DECIMAL(5,2) DEFAULT 0,
  memory_usage DECIMAL(5,2) DEFAULT 0,
  network_in BIGINT DEFAULT 0,
  network_out BIGINT DEFAULT 0,
  active_connections INTEGER DEFAULT 0,
  custom_metrics JSONB DEFAULT '{}'
);

CREATE INDEX IF NOT EXISTS idx_device_metrics_device ON public.device_metrics(device_id);
CREATE INDEX IF NOT EXISTS idx_device_metrics_timestamp ON public.device_metrics(timestamp DESC);

CREATE TABLE IF NOT EXISTS public.device_connections (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  from_device_id UUID NOT NULL REFERENCES public.network_devices(id) ON DELETE CASCADE,
  to_device_id UUID NOT NULL REFERENCES public.network_devices(id) ON DELETE CASCADE,
  connection_type VARCHAR(50),
  port_from VARCHAR(50),
  port_to VARCHAR(50),
  bandwidth INTEGER,
  status VARCHAR(20) DEFAULT 'active',
  established_at TIMESTAMPTZ
);

CREATE TABLE IF NOT EXISTS public.device_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  device_id UUID NOT NULL REFERENCES public.network_devices(id) ON DELETE CASCADE,
  user_id UUID REFERENCES public.users(id),
  action_type VARCHAR(50) NOT NULL,
  old_values JSONB DEFAULT '{}',
  new_values JSONB DEFAULT '{}',
  notes TEXT,
  ip_address INET,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_device_history_device ON public.device_history(device_id);
CREATE INDEX IF NOT EXISTS idx_device_history_user ON public.device_history(user_id);
CREATE INDEX IF NOT EXISTS idx_device_history_created ON public.device_history(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_device_history_action ON public.device_history(action_type);

CREATE TABLE IF NOT EXISTS public.alerts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  device_id UUID REFERENCES public.network_devices(id) ON DELETE CASCADE,
  alert_type VARCHAR(50) NOT NULL,
  severity VARCHAR(20) NOT NULL CHECK (severity IN ('info','warning','critical')),
  title VARCHAR(200) NOT NULL,
  description TEXT,
  metadata JSONB DEFAULT '{}',
  is_resolved BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  resolved_at TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_alerts_device ON public.alerts(device_id);
CREATE INDEX IF NOT EXISTS idx_alerts_severity ON public.alerts(severity);
CREATE INDEX IF NOT EXISTS idx_alerts_resolved ON public.alerts(is_resolved);
CREATE INDEX IF NOT EXISTS idx_alerts_created ON public.alerts(created_at DESC);

CREATE TABLE IF NOT EXISTS public.network_statistics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  total_devices INTEGER DEFAULT 0,
  active_devices INTEGER DEFAULT 0,
  total_vlans INTEGER DEFAULT 0,
  total_alerts INTEGER DEFAULT 0,
  critical_alerts INTEGER DEFAULT 0,
  network_in BIGINT DEFAULT 0,
  network_out BIGINT DEFAULT 0,
  timestamp TIMESTAMPTZ DEFAULT NOW()
);

-- RLS policies
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'users' AND policyname = 'users_view_own'
  ) THEN
    CREATE POLICY users_view_own ON public.users FOR SELECT TO authenticated
    USING (auth.uid() = id OR EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'admin'));
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'users' AND policyname = 'users_admin_update'
  ) THEN
    CREATE POLICY users_admin_update ON public.users FOR UPDATE TO authenticated
    USING (EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'admin'));
  END IF;
END $$;

-- Grants
GRANT USAGE ON SCHEMA public TO anon, authenticated;
GRANT SELECT ON public.vlans TO anon;
GRANT SELECT ON public.network_devices TO anon;
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO authenticated;
GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO authenticated;

