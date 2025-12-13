-- Add is_test_account flag to users
DO $$ BEGIN
  ALTER TABLE public.users ADD COLUMN IF NOT EXISTS is_test_account BOOLEAN DEFAULT FALSE;
EXCEPTION WHEN duplicate_column THEN NULL; END $$;

CREATE INDEX IF NOT EXISTS idx_users_is_test ON public.users(is_test_account);
