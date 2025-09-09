-- COMPLETE LEAD WORKFLOW SETUP
-- This ensures: Admin Upload → Shop Display → Purchase → CRM Assignment
-- Run this in Supabase SQL Editor

-- 1) Ensure projects table exists and is populated
CREATE TABLE IF NOT EXISTS public.projects (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  developer text NOT NULL,
  region text NOT NULL,
  available_leads integer DEFAULT 0,
  price_per_lead numeric(10,2) NOT NULL DEFAULT 25.00,
  description text,
  created_at timestamptz DEFAULT NOW(),
  updated_at timestamptz DEFAULT NOW()
);

-- 2) Ensure leads table has all required columns
CREATE TABLE IF NOT EXISTS public.leads (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id uuid NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  buyer_user_id uuid REFERENCES public.profiles(id), -- NULL = available for purchase
  assigned_to_id uuid REFERENCES public.profiles(id),
  client_name text NOT NULL,
  client_phone text NOT NULL,
  client_phone2 text,
  client_phone3 text,
  client_email text,
  client_job_title text,
  platform public.platform_type NOT NULL DEFAULT 'Other',
  stage public.lead_stage DEFAULT 'New Lead',
  feedback text,
  source text,
  batch_id uuid,
  upload_user_id uuid REFERENCES public.profiles(id),
  is_sold boolean DEFAULT false,
  sold_at timestamptz,
  cpl_price numeric(10,2),
  created_at timestamptz DEFAULT NOW(),
  updated_at timestamptz DEFAULT NOW()
);

-- 3) Create required enums if they don't exist
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'platform_type') THEN
    CREATE TYPE public.platform_type AS ENUM ('Facebook', 'Google', 'TikTok', 'Other');
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'lead_stage') THEN
    CREATE TYPE public.lead_stage AS ENUM ('New Lead', 'Potential', 'Hot Case', 'Meeting Done', 'No Answer', 'Call Back', 'Whatsapp', 'Wrong Number', 'Non Potential');
  END IF;
END$$;

-- 4) Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_leads_project_id ON public.leads(project_id);
CREATE INDEX IF NOT EXISTS idx_leads_buyer_user_id ON public.leads(buyer_user_id);
CREATE INDEX IF NOT EXISTS idx_leads_available ON public.leads(project_id) WHERE buyer_user_id IS NULL;
CREATE INDEX IF NOT EXISTS idx_projects_available_leads ON public.projects(available_leads);

-- 5) Enable RLS and set policies
ALTER TABLE public.projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.leads ENABLE ROW LEVEL SECURITY;

-- Projects policies (all authenticated users can read)
DROP POLICY IF EXISTS "projects_select_all" ON public.projects;
CREATE POLICY "projects_select_all" ON public.projects 
FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS "projects_update_admin" ON public.projects;
CREATE POLICY "projects_update_admin" ON public.projects 
FOR UPDATE TO authenticated USING (
  EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role IN ('admin', 'support'))
);

-- Leads policies
DROP POLICY IF EXISTS "leads_select_own" ON public.leads;
CREATE POLICY "leads_select_own" ON public.leads 
FOR SELECT TO authenticated USING (
  buyer_user_id = auth.uid() OR 
  assigned_to_id = auth.uid() OR
  EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role IN ('admin', 'support'))
);

DROP POLICY IF EXISTS "leads_insert_admin" ON public.leads;
CREATE POLICY "leads_insert_admin" ON public.leads 
FOR INSERT TO authenticated WITH CHECK (
  EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role IN ('admin', 'support'))
);

DROP POLICY IF EXISTS "leads_update_admin" ON public.leads;
CREATE POLICY "leads_update_admin" ON public.leads 
FOR UPDATE TO authenticated USING (
  buyer_user_id = auth.uid() OR
  EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role IN ('admin', 'support'))
);

-- 6) Grant permissions
GRANT ALL ON public.projects TO authenticated;
GRANT ALL ON public.leads TO authenticated;

-- 7) Create/update RPC function for lead assignment
CREATE OR REPLACE FUNCTION public.assign_leads_to_user(
  user_id uuid,
  project_id uuid,
  quantity integer
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  assigned_count integer := 0;
  lead_ids uuid[];
BEGIN
  -- Get available leads for assignment (FIFO with locking)
  WITH leads_to_assign AS (
    SELECT id 
    FROM public.leads 
    WHERE project_id = assign_leads_to_user.project_id
      AND buyer_user_id IS NULL
    ORDER BY created_at ASC
    LIMIT assign_leads_to_user.quantity
    FOR UPDATE SKIP LOCKED
  )
  SELECT ARRAY(SELECT id FROM leads_to_assign) INTO lead_ids;
  
  -- Assign leads to user
  UPDATE public.leads 
  SET buyer_user_id = assign_leads_to_user.user_id,
      updated_at = NOW()
  WHERE id = ANY(lead_ids);
  
  GET DIAGNOSTICS assigned_count = ROW_COUNT;
  
  -- Update project available leads count
  UPDATE public.projects 
  SET available_leads = available_leads - assigned_count,
      updated_at = NOW()
  WHERE id = assign_leads_to_user.project_id;
  
  RETURN jsonb_build_object(
    'success', true,
    'assigned_count', assigned_count,
    'lead_ids', lead_ids
  );
END;
$$;

-- 8) Extract and populate projects from salemate-inventory
DELETE FROM public.projects; -- Clear existing

-- Insert projects from compound data
INSERT INTO public.projects (name, developer, region, available_leads, price_per_lead, description)
WITH compound_extraction AS (
  SELECT 
    -- Extract compound name from Python dict format
    CASE 
      WHEN compound::text LIKE '%''name'': ''%''%' THEN
        TRIM(SPLIT_PART(SPLIT_PART(compound::text, '''name'': ''', 2), '''', 1))
      WHEN compound::text LIKE '%"name": "%"%' THEN
        TRIM(SPLIT_PART(SPLIT_PART(compound::text, '"name": "', 2), '"', 1))
      ELSE 'Unknown Compound'
    END as compound_name,
    
    -- Extract developer name
    CASE 
      WHEN developer::text LIKE '%''name'': ''%''%' THEN
        TRIM(SPLIT_PART(SPLIT_PART(developer::text, '''name'': ''', 2), '''', 1))
      WHEN developer::text LIKE '%"name": "%"%' THEN
        TRIM(SPLIT_PART(SPLIT_PART(developer::text, '"name": "', 2), '"', 1))
      ELSE 'Unknown Developer'
    END as developer_name,
    
    -- Extract area/region name
    CASE 
      WHEN area::text LIKE '%''name'': ''%''%' THEN
        TRIM(SPLIT_PART(SPLIT_PART(area::text, '''name'': ''', 2), '''', 1))
      WHEN area::text LIKE '%"name": "%"%' THEN
        TRIM(SPLIT_PART(SPLIT_PART(area::text, '"name": "', 2), '"', 1))
      ELSE 'Unknown Area'
    END as area_name,
    
    COUNT(*) as property_count,
    AVG(price_in_egp) as avg_price
    
  FROM public."salemate-inventory"
  WHERE compound IS NOT NULL 
    AND compound::text != 'null'
    AND compound::text != ''
  GROUP BY compound::text, developer::text, area::text
)

SELECT 
  compound_name as name,
  developer_name as developer,
  area_name as region,
  0 as available_leads, -- Will be updated when leads are uploaded
  CASE 
    WHEN avg_price > 50000000 THEN 35.00 + (RANDOM() * 15)::numeric(10,2)
    WHEN avg_price > 20000000 THEN 25.00 + (RANDOM() * 10)::numeric(10,2)
    WHEN avg_price > 10000000 THEN 20.00 + (RANDOM() * 8)::numeric(10,2)
    ELSE 15.00 + (RANDOM() * 10)::numeric(10,2)
  END as price_per_lead,
  'Real estate project in ' || area_name || ' by ' || developer_name || '. Based on ' || property_count || ' properties.' as description
FROM compound_extraction
WHERE compound_name != 'Unknown Compound'
  AND compound_name != ''
  AND developer_name != 'Unknown Developer'
  AND area_name != 'Unknown Area'
ORDER BY compound_name
LIMIT 50; -- Limit to 50 projects

-- 9) Create function to update project lead counts
CREATE OR REPLACE FUNCTION public.update_project_lead_counts()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  UPDATE public.projects 
  SET available_leads = (
    SELECT COUNT(*) 
    FROM public.leads 
    WHERE project_id = projects.id 
      AND buyer_user_id IS NULL
  ),
  updated_at = NOW();
END;
$$;

-- 10) Verification
SELECT 'Complete lead workflow setup finished!' as status;
SELECT COUNT(*) as total_projects FROM public.projects;
SELECT COUNT(*) as total_leads FROM public.leads;

-- Show created projects
SELECT 
  name,
  developer,
  region,
  available_leads,
  price_per_lead
FROM public.projects 
ORDER BY name 
LIMIT 10;
