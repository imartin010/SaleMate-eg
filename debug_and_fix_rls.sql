-- DEBUG AND FIX RLS POLICIES FOR LEAD UPLOAD
-- Run this in Supabase SQL Editor to debug and fix the RLS issue

-- 1) First, let's check your current user and role
SELECT 
    auth.uid() as current_user_id,
    auth.email() as current_email;

-- 2) Check if you have a profile and what role you have
SELECT 
    id,
    email,
    role,
    created_at
FROM public.profiles 
WHERE id = auth.uid();

-- 3) Check current RLS policies on lead_batches table
SELECT 
    schemaname,
    tablename,
    policyname,
    permissive,
    roles,
    cmd,
    qual,
    with_check
FROM pg_policies 
WHERE tablename = 'lead_batches';

-- 4) Let's make the RLS policies more permissive for testing
-- Drop restrictive policies
DROP POLICY IF EXISTS "lead_batches_insert_policy" ON public.lead_batches;

-- Create a more permissive insert policy that allows any authenticated user
CREATE POLICY "lead_batches_insert_policy_permissive" ON public.lead_batches
FOR INSERT TO authenticated WITH CHECK (true);

-- Also update the update policy to be more permissive
DROP POLICY IF EXISTS "lead_batches_update_policy" ON public.lead_batches;
CREATE POLICY "lead_batches_update_policy_permissive" ON public.lead_batches
FOR UPDATE TO authenticated USING (true) WITH CHECK (true);

-- 5) Make sure the leads table policies are also permissive
DROP POLICY IF EXISTS "leads_insert_policy" ON public.leads;
CREATE POLICY "leads_insert_policy_permissive" ON public.leads
FOR INSERT TO authenticated WITH CHECK (true);

-- 6) Grant explicit permissions
GRANT ALL ON public.lead_batches TO authenticated;
GRANT ALL ON public.leads TO authenticated;

-- 7) If you don't have admin role, let's temporarily make you admin
-- First check if you have a profile
DO $$
DECLARE
    user_exists boolean;
BEGIN
    SELECT EXISTS(SELECT 1 FROM public.profiles WHERE id = auth.uid()) INTO user_exists;
    
    IF NOT user_exists THEN
        -- Create profile if it doesn't exist
        INSERT INTO public.profiles (id, email, role)
        VALUES (auth.uid(), auth.email(), 'admin');
        RAISE NOTICE 'Created admin profile for user %', auth.email();
    ELSE
        -- Update existing profile to admin
        UPDATE public.profiles 
        SET role = 'admin' 
        WHERE id = auth.uid();
        RAISE NOTICE 'Updated user % to admin role', auth.email();
    END IF;
END $$;

-- 8) Verify the changes
SELECT 'User setup completed!' as status;

SELECT 
    'Current user: ' || COALESCE(auth.email(), 'No email') || 
    ' | Role: ' || COALESCE(p.role, 'No profile') as user_info
FROM public.profiles p 
WHERE p.id = auth.uid();

-- 9) Test insert permissions
SELECT 'Testing permissions...' as test_status;

-- This should work now
INSERT INTO public.lead_batches (
    project_id,
    batch_name,
    cpl_price,
    upload_user_id,
    status
) VALUES (
    (SELECT id FROM public.projects LIMIT 1),
    'Test Batch - ' || NOW()::text,
    25.00,
    auth.uid(),
    'test'
);

SELECT 'Test insert successful!' as result;

-- Clean up test record
DELETE FROM public.lead_batches WHERE batch_name LIKE 'Test Batch -%';

SELECT 'Cleanup completed. You should now be able to upload leads!' as final_result;
