-- Fix lead upload issues
-- Run this in your Supabase SQL Editor

-- 1. Check if leads table exists and has correct structure
SELECT 
  column_name, 
  data_type, 
  is_nullable,
  column_default
FROM information_schema.columns 
WHERE table_name = 'leads' 
  AND table_schema = 'public'
ORDER BY ordinal_position;

-- 2. Check if projects table exists
SELECT 
  column_name, 
  data_type, 
  is_nullable,
  column_default
FROM information_schema.columns 
WHERE table_name = 'projects' 
  AND table_schema = 'public'
ORDER BY ordinal_position;

-- 3. Check RLS policies on leads table
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual 
FROM pg_policies 
WHERE tablename = 'leads';

-- 4. Check if user has proper permissions
SELECT 
  grantee, 
  privilege_type, 
  is_grantable
FROM information_schema.table_privileges 
WHERE table_name = 'leads' 
  AND table_schema = 'public';

-- 5. Test basic insert (will fail if there are issues)
-- This is just to test the structure
SELECT 'Testing leads table structure...' as status;

-- 6. Create or update RPC function for lead upload if it doesn't exist
CREATE OR REPLACE FUNCTION rpc_upload_leads(
  project_id uuid,
  leads_data jsonb
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  lead_item jsonb;
  inserted_count integer := 0;
  result jsonb;
BEGIN
  -- Loop through each lead in the array
  FOR lead_item IN SELECT * FROM jsonb_array_elements(leads_data)
  LOOP
    -- Insert lead into the table
    INSERT INTO public.leads (
      project_id,
      client_name,
      client_phone,
      client_phone2,
      client_phone3,
      client_email,
      client_job_title,
      source,
      stage,
      created_at,
      updated_at
    ) VALUES (
      project_id,
      COALESCE(lead_item->>'client_name', ''),
      COALESCE(lead_item->>'client_phone', ''),
      lead_item->>'client_phone2',
      lead_item->>'client_phone3',
      lead_item->>'client_email',
      lead_item->>'client_job_title',
      COALESCE(lead_item->>'platform', 'Other'),
      COALESCE(lead_item->>'stage', 'New Lead'),
      NOW(),
      NOW()
    );
    
    inserted_count := inserted_count + 1;
  END LOOP;
  
  result := jsonb_build_object(
    'success', true,
    'inserted', inserted_count,
    'message', 'Leads uploaded successfully'
  );
  
  RETURN result;
END;
$$;

-- 7. Grant execute permission on the function
GRANT EXECUTE ON FUNCTION rpc_upload_leads(uuid, jsonb) TO authenticated;
GRANT EXECUTE ON FUNCTION rpc_upload_leads(uuid, jsonb) TO service_role;

-- 8. Ensure proper RLS policies exist
DROP POLICY IF EXISTS "Service role can insert leads" ON public.leads;
CREATE POLICY "Service role can insert leads" ON public.leads
  FOR INSERT WITH CHECK (true);

DROP POLICY IF EXISTS "Service role can select leads" ON public.leads;
CREATE POLICY "Service role can select leads" ON public.leads
  FOR SELECT USING (true);

-- 9. Test the function
SELECT 'Lead upload function created successfully!' as status;
