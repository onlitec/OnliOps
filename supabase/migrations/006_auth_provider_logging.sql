-- Add provider columns to users and create login_events for monitoring
DO $$ BEGIN
  ALTER TABLE public.users ADD COLUMN IF NOT EXISTS provider TEXT;
  ALTER TABLE public.users ADD COLUMN IF NOT EXISTS provider_id TEXT;
  ALTER TABLE public.users ADD COLUMN IF NOT EXISTS provider_email TEXT;
EXCEPTION WHEN duplicate_column THEN NULL; END $$;

CREATE TABLE IF NOT EXISTS public.login_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID,
  event_type TEXT NOT NULL, -- 'oauth_start','oauth_callback','login_success','login_error'
  provider TEXT,
  status TEXT,
  error_message TEXT,
  ip_address TEXT,
  user_agent TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.login_events ENABLE ROW LEVEL SECURITY;

-- Policies: authenticated users can insert their own events; admin can read all
DROP POLICY IF EXISTS login_events_insert_self ON public.login_events;
CREATE POLICY login_events_insert_self ON public.login_events
  FOR INSERT TO authenticated
  WITH CHECK (true);

DROP POLICY IF EXISTS login_events_select_admin ON public.login_events;
CREATE POLICY login_events_select_admin ON public.login_events
  FOR SELECT TO authenticated
  USING (
    EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role IN ('admin','simulation_admin'))
  );

-- Indexes
CREATE INDEX IF NOT EXISTS idx_login_events_user_id ON public.login_events(user_id);
CREATE INDEX IF NOT EXISTS idx_login_events_created_at ON public.login_events(created_at);
