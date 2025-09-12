-- POPULATE PROJECTS TABLE FROM SALEMATE-INVENTORY COMPOUND NAMES
-- This extracts compound names and sets available_leads and price_per_lead (CPL) to 0
-- Based on user request: extract name from compound column like {'id': 6, 'name': 'Hacienda Bay'}
-- Run this in Supabase SQL Editor at: https://supabase.com/dashboard/project/wkxbhvckmgrmdkdkhnqo/editor/37490?schema=public

-- 1) Ensure projects table exists with proper structure
CREATE TABLE IF NOT EXISTS public.projects (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  developer text NOT NULL,
  region text NOT NULL,
  available_leads integer DEFAULT 0,
  price_per_lead numeric(10,2) NOT NULL DEFAULT 0.00,
  description text,
  created_at timestamptz DEFAULT NOW(),
  updated_at timestamptz DEFAULT NOW()
);

-- 2) Enable RLS and set permissions
ALTER TABLE public.projects ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "projects_select_policy" ON public.projects;
CREATE POLICY "projects_select_policy" ON public.projects
FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS "projects_insert_policy" ON public.projects;
CREATE POLICY "projects_insert_policy" ON public.projects
FOR INSERT TO authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "projects_update_policy" ON public.projects;
CREATE POLICY "projects_update_policy" ON public.projects
FOR UPDATE TO authenticated USING (true);

GRANT ALL ON public.projects TO authenticated;

-- 3) Clear existing projects (if any)
DELETE FROM public.projects;

-- 4) Insert projects from salemate-inventory compound column
-- Handle both JSON formats: {"id": X, "name": "Name"} and {'id': X, 'name': 'Name'}
INSERT INTO public.projects (name, developer, region, available_leads, price_per_lead, description)
WITH compound_extraction AS (
  SELECT 
    -- Extract compound name from various JSON/dict formats
    CASE 
      -- Handle Python dict string format with single quotes: {'id': X, 'name': 'Name'}
      WHEN compound::text LIKE '%''name'': ''%''%' THEN
        TRIM(SPLIT_PART(SPLIT_PART(compound::text, '''name'': ''', 2), '''', 1))
      -- Handle JSON string format with double quotes: {"id": X, "name": "Name"}
      WHEN compound::text LIKE '%"name": "%"%' THEN
        TRIM(SPLIT_PART(SPLIT_PART(compound::text, '"name": "', 2), '"', 1))
      ELSE
        'Unknown Compound'
    END as compound_name,
    
    -- Extract developer name from various JSON/dict formats
    CASE 
      WHEN developer::text LIKE '%''name'': ''%''%' THEN
        TRIM(SPLIT_PART(SPLIT_PART(developer::text, '''name'': ''', 2), '''', 1))
      WHEN developer::text LIKE '%"name": "%"%' THEN
        TRIM(SPLIT_PART(SPLIT_PART(developer::text, '"name": "', 2), '"', 1))
      ELSE
        'Unknown Developer'
    END as developer_name,
    
    -- Extract area/region name from various JSON/dict formats
    CASE 
      WHEN area::text LIKE '%''name'': ''%''%' THEN
        TRIM(SPLIT_PART(SPLIT_PART(area::text, '''name'': ''', 2), '''', 1))
      WHEN area::text LIKE '%"name": "%"%' THEN
        TRIM(SPLIT_PART(SPLIT_PART(area::text, '"name": "', 2), '"', 1))
      ELSE
        'Unknown Area'
    END as area_name,
    
    COUNT(*) as property_count
    
  FROM public."salemate-inventory"
  WHERE compound IS NOT NULL 
    AND compound::text != 'null'
    AND compound::text != ''
    AND compound::text != '{}'
  GROUP BY 
    compound::text, 
    developer::text, 
    area::text
),

unique_projects AS (
  SELECT 
    compound_name as name,
    developer_name as developer,
    area_name as region,
    0 as available_leads,  -- Set to 0 as requested
    0.00 as price_per_lead, -- Set CPL to 0 as requested
    'Project with ' || property_count || ' properties in ' || area_name || ' by ' || developer_name || '.' as description
    
  FROM compound_extraction
  WHERE compound_name != 'Unknown Compound'
    AND compound_name != ''
    AND compound_name IS NOT NULL
    AND developer_name != 'Unknown Developer'
    AND area_name != 'Unknown Area'
)

SELECT 
  name,
  developer,
  region,
  available_leads,
  price_per_lead,
  description
FROM unique_projects
WHERE name IS NOT NULL 
  AND name != ''
ORDER BY name;

-- 5) Verify the results
SELECT 'Projects populated with zero leads and CPL!' as status;
SELECT COUNT(*) as total_projects FROM public.projects;

-- 6) Show sample of created projects
SELECT 
  name,
  developer,
  region,
  available_leads,
  price_per_lead
FROM public.projects 
ORDER BY name
LIMIT 10;

-- 7) Show projects by region
SELECT 
  region,
  COUNT(*) as project_count,
  SUM(available_leads) as total_leads,
  AVG(price_per_lead)::numeric(10,2) as avg_cpl
FROM public.projects 
GROUP BY region 
ORDER BY project_count DESC;

-- 8) Final verification - all should show 0 leads and 0 CPL
SELECT 
  'All projects have zero leads and CPL as requested' as verification,
  COUNT(*) as total_projects,
  SUM(available_leads) as total_leads_should_be_zero,
  AVG(price_per_lead) as avg_cpl_should_be_zero
FROM public.projects;
