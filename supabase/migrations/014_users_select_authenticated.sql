-- Allow authenticated users to select users for validation in dev/test
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS users_select_self ON public.users;
CREATE POLICY users_select_authenticated ON public.users
  FOR SELECT TO authenticated
  USING (true);
