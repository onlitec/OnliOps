-- Enable RLS and define policies for operational tables

-- VLANs
ALTER TABLE public.vlans ENABLE ROW LEVEL SECURITY;
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'vlans' AND policyname = 'vlans_select_authenticated'
  ) THEN
    CREATE POLICY vlans_select_authenticated ON public.vlans FOR SELECT TO authenticated USING (true);
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'vlans' AND policyname = 'vlans_admin_upsert'
  ) THEN
    CREATE POLICY vlans_admin_upsert ON public.vlans FOR ALL TO authenticated USING (
      EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'admin')
    ) WITH CHECK (
      EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'admin')
    );
  END IF;
END $$;

-- Network devices
ALTER TABLE public.network_devices ENABLE ROW LEVEL SECURITY;
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'network_devices' AND policyname = 'devices_select_authenticated'
  ) THEN
    CREATE POLICY devices_select_authenticated ON public.network_devices FOR SELECT TO authenticated USING (true);
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'network_devices' AND policyname = 'devices_upsert_operator'
  ) THEN
    CREATE POLICY devices_upsert_operator ON public.network_devices FOR INSERT TO authenticated WITH CHECK (
      EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role IN ('admin','security_operator'))
    );
    CREATE POLICY devices_update_operator ON public.network_devices FOR UPDATE TO authenticated USING (
      EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role IN ('admin','security_operator'))
    ) WITH CHECK (
      EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role IN ('admin','security_operator'))
    );
    CREATE POLICY devices_delete_admin ON public.network_devices FOR DELETE TO authenticated USING (
      EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'admin')
    );
  END IF;
END $$;

-- Device metrics
ALTER TABLE public.device_metrics ENABLE ROW LEVEL SECURITY;
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'device_metrics' AND policyname = 'metrics_select_authenticated'
  ) THEN
    CREATE POLICY metrics_select_authenticated ON public.device_metrics FOR SELECT TO authenticated USING (true);
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'device_metrics' AND policyname = 'metrics_insert_operator'
  ) THEN
    CREATE POLICY metrics_insert_operator ON public.device_metrics FOR INSERT TO authenticated WITH CHECK (
      EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role IN ('admin','security_operator'))
    );
  END IF;
END $$;

-- Device connections
ALTER TABLE public.device_connections ENABLE ROW LEVEL SECURITY;
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'device_connections' AND policyname = 'connections_select_authenticated'
  ) THEN
    CREATE POLICY connections_select_authenticated ON public.device_connections FOR SELECT TO authenticated USING (true);
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'device_connections' AND policyname = 'connections_upsert_operator'
  ) THEN
    CREATE POLICY connections_upsert_operator ON public.device_connections FOR INSERT TO authenticated WITH CHECK (
      EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role IN ('admin','security_operator'))
    );
    CREATE POLICY connections_update_operator ON public.device_connections FOR UPDATE TO authenticated USING (
      EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role IN ('admin','security_operator'))
    ) WITH CHECK (
      EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role IN ('admin','security_operator'))
    );
    CREATE POLICY connections_delete_admin ON public.device_connections FOR DELETE TO authenticated USING (
      EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'admin')
    );
  END IF;
END $$;

-- Device history
ALTER TABLE public.device_history ENABLE ROW LEVEL SECURITY;
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'device_history' AND policyname = 'history_select_authenticated'
  ) THEN
    CREATE POLICY history_select_authenticated ON public.device_history FOR SELECT TO authenticated USING (true);
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'device_history' AND policyname = 'history_insert_authenticated'
  ) THEN
    CREATE POLICY history_insert_authenticated ON public.device_history FOR INSERT TO authenticated WITH CHECK (
      (user_id = auth.uid()) OR EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role IN ('admin','security_operator'))
    );
  END IF;
END $$;

-- Alerts
ALTER TABLE public.alerts ENABLE ROW LEVEL SECURITY;
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'alerts' AND policyname = 'alerts_select_authenticated'
  ) THEN
    CREATE POLICY alerts_select_authenticated ON public.alerts FOR SELECT TO authenticated USING (true);
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'alerts' AND policyname = 'alerts_upsert_operator'
  ) THEN
    CREATE POLICY alerts_upsert_operator ON public.alerts FOR INSERT TO authenticated WITH CHECK (
      EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role IN ('admin','security_operator'))
    );
    CREATE POLICY alerts_update_operator ON public.alerts FOR UPDATE TO authenticated USING (
      EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role IN ('admin','security_operator'))
    ) WITH CHECK (
      EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role IN ('admin','security_operator'))
    );
    CREATE POLICY alerts_delete_admin ON public.alerts FOR DELETE TO authenticated USING (
      EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'admin')
    );
  END IF;
END $$;

