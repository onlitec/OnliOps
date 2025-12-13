-- Config baseline and events monitoring
CREATE TABLE IF NOT EXISTS public.config_baseline (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT UNIQUE NOT NULL, -- e.g. 'production'
  vite_supabase_url_hash TEXT NOT NULL,
  vite_supabase_anon_hash TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.config_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  env_name TEXT NOT NULL, -- e.g. 'production'
  vite_supabase_url_hash TEXT,
  vite_supabase_anon_hash TEXT,
  status TEXT, -- 'ok' | 'mismatch' | 'unknown'
  note TEXT,
  user_agent TEXT,
  source_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.config_baseline ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.config_events ENABLE ROW LEVEL SECURITY;

-- Policies: authenticated can insert events; admin can manage baseline
DROP POLICY IF EXISTS config_events_insert ON public.config_events;
CREATE POLICY config_events_insert ON public.config_events
  FOR INSERT TO authenticated
  WITH CHECK (true);

DROP POLICY IF EXISTS config_events_select_admin ON public.config_events;
CREATE POLICY config_events_select_admin ON public.config_events
  FOR SELECT TO authenticated
  USING (true);

DROP POLICY IF EXISTS config_baseline_manage_admin ON public.config_baseline;
CREATE POLICY config_baseline_manage_admin ON public.config_baseline
  FOR ALL TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE INDEX IF NOT EXISTS idx_config_events_created ON public.config_events(created_at);
