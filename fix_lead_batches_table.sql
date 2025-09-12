-- FIX LEAD_BATCHES TABLE AND RLS POLICIES
-- This fixes the "new row violates row-level security policy" error
-- Run this in Supabase SQL Editor

-- 1) Create lead_batches table if it doesn't exist
CREATE TABLE IF NOT EXISTS public.lead_batches (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id uuid NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  batch_name text NOT NULL,
  cpl_price numeric(10,2),
  upload_user_id uuid NOT NULL REFERENCES public.profiles(id),
  status text DEFAULT 'pending',
  total_leads integer DEFAULT 0,
  successful_leads integer DEFAULT 0,
  failed_leads integer DEFAULT 0,
  created_at timestamptz DEFAULT NOW(),
  updated_at timestamptz DEFAULT NOW()
);

-- 2) Create update trigger for updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

DROP TRIGGER IF EXISTS update_lead_batches_updated_at ON public.lead_batches;
CREATE TRIGGER update_lead_batches_updated_at 
    BEFORE UPDATE ON public.lead_batches 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- 3) Enable RLS on lead_batches table
ALTER TABLE public.lead_batches ENABLE ROW LEVEL SECURITY;

-- 4) Drop existing policies if they exist
DROP POLICY IF EXISTS "lead_batches_select_policy" ON public.lead_batches;
DROP POLICY IF EXISTS "lead_batches_insert_policy" ON public.lead_batches;
DROP POLICY IF EXISTS "lead_batches_update_policy" ON public.lead_batches;
DROP POLICY IF EXISTS "lead_batches_delete_policy" ON public.lead_batches;

-- 5) Create RLS policies for lead_batches table
-- Allow authenticated users to read all batches
CREATE POLICY "lead_batches_select_policy" ON public.lead_batches
FOR SELECT TO authenticated USING (true);

-- Allow authenticated users to insert their own batches
CREATE POLICY "lead_batches_insert_policy" ON public.lead_batches
FOR INSERT TO authenticated WITH CHECK (
  auth.uid() = upload_user_id
);

-- Allow users to update their own batches
CREATE POLICY "lead_batches_update_policy" ON public.lead_batches
FOR UPDATE TO authenticated USING (
  auth.uid() = upload_user_id
) WITH CHECK (
  auth.uid() = upload_user_id
);

-- Allow users to delete their own batches
CREATE POLICY "lead_batches_delete_policy" ON public.lead_batches
FOR DELETE TO authenticated USING (
  auth.uid() = upload_user_id
);

-- 6) Grant necessary permissions
GRANT ALL ON public.lead_batches TO authenticated;
GRANT SELECT ON public.lead_batches TO anon;

-- 7) Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_lead_batches_project_id ON public.lead_batches(project_id);
CREATE INDEX IF NOT EXISTS idx_lead_batches_upload_user_id ON public.lead_batches(upload_user_id);
CREATE INDEX IF NOT EXISTS idx_lead_batches_status ON public.lead_batches(status);
CREATE INDEX IF NOT EXISTS idx_lead_batches_created_at ON public.lead_batches(created_at);

-- 8) Verify the table exists and has correct structure
SELECT 'lead_batches table created successfully!' as status;

-- 9) Show table structure
SELECT 
  column_name,
  data_type,
  is_nullable,
  column_default
FROM information_schema.columns 
WHERE table_name = 'lead_batches' 
  AND table_schema = 'public'
ORDER BY ordinal_position;

-- 10) Also ensure leads table has proper RLS policies for bulk upload
ALTER TABLE public.leads ENABLE ROW LEVEL SECURITY;

-- Drop existing leads policies that might be too restrictive
DROP POLICY IF EXISTS "leads_select_own" ON public.leads;
DROP POLICY IF EXISTS "leads_insert_admin" ON public.leads;
DROP POLICY IF EXISTS "leads_update_admin" ON public.leads;
DROP POLICY IF EXISTS "leads_read_mine" ON public.leads;
DROP POLICY IF EXISTS "leads_admin_all" ON public.leads;

-- Create comprehensive leads policies
-- Allow users to see their own purchased leads + admins see all
CREATE POLICY "leads_select_policy" ON public.leads
FOR SELECT TO authenticated USING (
  buyer_user_id = auth.uid() OR 
  assigned_to_id = auth.uid() OR
  EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role IN ('admin', 'support'))
);

-- Allow admins and managers to insert leads (for bulk upload)
CREATE POLICY "leads_insert_policy" ON public.leads
FOR INSERT TO authenticated WITH CHECK (
  EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role IN ('admin', 'support', 'manager'))
);

-- Allow users to update their own leads + admins update all
CREATE POLICY "leads_update_policy" ON public.leads
FOR UPDATE TO authenticated USING (
  buyer_user_id = auth.uid() OR
  EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role IN ('admin', 'support'))
) WITH CHECK (
  buyer_user_id = auth.uid() OR
  EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role IN ('admin', 'support'))
);

-- Allow admins to delete leads
CREATE POLICY "leads_delete_policy" ON public.leads
FOR DELETE TO authenticated USING (
  EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role IN ('admin', 'support'))
);

-- Grant permissions on leads table
GRANT ALL ON public.leads TO authenticated;
GRANT SELECT ON public.leads TO anon;

-- 11) Show RLS policies for both tables
SELECT 'RLS policies created successfully!' as status;

SELECT 
  tablename,
  policyname,
  cmd,
  permissive
FROM pg_policies 
WHERE tablename IN ('lead_batches', 'leads')
ORDER BY tablename, policyname;
