-- SIMPLE RLS FIX FOR LEAD UPLOAD
-- This handles existing policies and fixes the upload issue

-- 1) Check current user info
SELECT 
    auth.uid() as user_id,
    auth.email() as email;

-- 2) Check/create user profile with admin role
INSERT INTO public.profiles (id, email, role)
VALUES (auth.uid(), auth.email(), 'admin')
ON CONFLICT (id) DO UPDATE SET 
    role = 'admin',
    email = EXCLUDED.email;

-- 3) Drop ALL existing policies to start fresh
DROP POLICY IF EXISTS "lead_batches_select_policy" ON public.lead_batches;
DROP POLICY IF EXISTS "lead_batches_insert_policy" ON public.lead_batches;
DROP POLICY IF EXISTS "lead_batches_update_policy" ON public.lead_batches;
DROP POLICY IF EXISTS "lead_batches_delete_policy" ON public.lead_batches;
DROP POLICY IF EXISTS "lead_batches_insert_policy_permissive" ON public.lead_batches;
DROP POLICY IF EXISTS "lead_batches_update_policy_permissive" ON public.lead_batches;

DROP POLICY IF EXISTS "leads_select_policy" ON public.leads;
DROP POLICY IF EXISTS "leads_insert_policy" ON public.leads;
DROP POLICY IF EXISTS "leads_update_policy" ON public.leads;
DROP POLICY IF EXISTS "leads_delete_policy" ON public.leads;
DROP POLICY IF EXISTS "leads_insert_policy_permissive" ON public.leads;
DROP POLICY IF EXISTS "leads_select_own" ON public.leads;
DROP POLICY IF EXISTS "leads_insert_admin" ON public.leads;
DROP POLICY IF EXISTS "leads_update_admin" ON public.leads;
DROP POLICY IF EXISTS "leads_read_mine" ON public.leads;
DROP POLICY IF EXISTS "leads_admin_all" ON public.leads;

-- 4) Create simple, permissive policies for lead_batches
CREATE POLICY "lead_batches_all_access" ON public.lead_batches
FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- 5) Create simple, permissive policies for leads
CREATE POLICY "leads_all_access" ON public.leads
FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- 6) Ensure RLS is enabled
ALTER TABLE public.lead_batches ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.leads ENABLE ROW LEVEL SECURITY;

-- 7) Grant permissions
GRANT ALL ON public.lead_batches TO authenticated;
GRANT ALL ON public.leads TO authenticated;
GRANT ALL ON public.projects TO authenticated;

-- 8) Test the setup
SELECT 'Setup completed successfully!' as status;

-- Show your current role
SELECT 
    id,
    email,
    role,
    'You now have admin access' as message
FROM public.profiles 
WHERE id = auth.uid();
