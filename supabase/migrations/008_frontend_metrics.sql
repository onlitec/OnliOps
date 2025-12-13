-- Frontend performance metrics table for continuous monitoring
CREATE TABLE IF NOT EXISTS public.frontend_metrics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID,
  metric_name TEXT NOT NULL, -- CLS, LCP, FID, TTFB, INP
  value DOUBLE PRECISION NOT NULL,
  navigation_type TEXT,
  url TEXT,
  device_info JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.frontend_metrics ENABLE ROW LEVEL SECURITY;

-- Policies: authenticated can insert; admin can read
DROP POLICY IF EXISTS frontend_metrics_insert ON public.frontend_metrics;
CREATE POLICY frontend_metrics_insert ON public.frontend_metrics
  FOR INSERT TO authenticated
  WITH CHECK (true);

DROP POLICY IF EXISTS frontend_metrics_select_admin ON public.frontend_metrics;
CREATE POLICY frontend_metrics_select_admin ON public.frontend_metrics
  FOR SELECT TO authenticated
  USING (
    EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role IN ('admin','simulation_admin'))
  );

-- Indexes
CREATE INDEX IF NOT EXISTS idx_frontend_metrics_created ON public.frontend_metrics(created_at);
CREATE INDEX IF NOT EXISTS idx_frontend_metrics_metric ON public.frontend_metrics(metric_name);
