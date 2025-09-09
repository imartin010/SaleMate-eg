-- EXTRACT PROJECTS FROM SALEMATE-INVENTORY TABLE
-- This reads from the actual table at https://supabase.com/dashboard/project/wkxbhvckmgrmdkdkhnqo/editor/37750?schema=public
-- Run this in Supabase SQL Editor

-- 1) Ensure projects table exists
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

-- 2) Enable RLS and permissions
ALTER TABLE public.projects ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "projects_select_all" ON public.projects;
CREATE POLICY "projects_select_all" ON public.projects FOR SELECT TO authenticated USING (true);
DROP POLICY IF EXISTS "projects_insert_all" ON public.projects;
CREATE POLICY "projects_insert_all" ON public.projects FOR INSERT TO authenticated WITH CHECK (true);
DROP POLICY IF EXISTS "projects_update_all" ON public.projects;
CREATE POLICY "projects_update_all" ON public.projects FOR UPDATE TO authenticated USING (true);
GRANT ALL ON public.projects TO authenticated;

-- 3) Clear existing projects
DELETE FROM public.projects;

-- 4) Extract projects from salemate-inventory compound column
-- Handle the Python dict string format: {'id': 6, 'name': 'Hacienda Bay'}
INSERT INTO public.projects (name, developer, region, available_leads, price_per_lead, description)
WITH compound_extraction AS (
  SELECT 
    -- Extract compound name from Python dict string format
    CASE 
      WHEN compound::text LIKE '%''name'': ''%''%' THEN
        -- Extract from {'id': X, 'name': 'Name'} format
        TRIM(SPLIT_PART(SPLIT_PART(compound::text, '''name'': ''', 2), '''', 1))
      WHEN compound::text LIKE '%"name": "%"%' THEN
        -- Extract from {"id": X, "name": "Name"} format  
        TRIM(SPLIT_PART(SPLIT_PART(compound::text, '"name": "', 2), '"', 1))
      ELSE
        'Unknown Compound'
    END as compound_name,
    
    -- Extract developer name from Python dict string format
    CASE 
      WHEN developer::text LIKE '%''name'': ''%''%' THEN
        TRIM(SPLIT_PART(SPLIT_PART(developer::text, '''name'': ''', 2), '''', 1))
      WHEN developer::text LIKE '%"name": "%"%' THEN
        TRIM(SPLIT_PART(SPLIT_PART(developer::text, '"name": "', 2), '"', 1))
      ELSE
        'Unknown Developer'
    END as developer_name,
    
    -- Extract area/region name from Python dict string format
    CASE 
      WHEN area::text LIKE '%''name'': ''%''%' THEN
        TRIM(SPLIT_PART(SPLIT_PART(area::text, '''name'': ''', 2), '''', 1))
      WHEN area::text LIKE '%"name": "%"%' THEN
        TRIM(SPLIT_PART(SPLIT_PART(area::text, '"name": "', 2), '"', 1))
      ELSE
        'Unknown Area'
    END as area_name,
    
    COUNT(*) as property_count,
    AVG(price_in_egp) as avg_price
    
  FROM public."salemate-inventory"
  WHERE compound IS NOT NULL 
    AND compound::text != 'null'
    AND compound::text != ''
  GROUP BY compound::text, developer::text, area::text
),

unique_projects AS (
  SELECT 
    compound_name as name,
    developer_name as developer,
    area_name as region,
    
    -- Generate realistic lead counts based on property count
    CASE 
      WHEN property_count > 100 THEN 150 + (RANDOM() * 50)::integer
      WHEN property_count > 50 THEN 100 + (RANDOM() * 50)::integer
      WHEN property_count > 20 THEN 75 + (RANDOM() * 50)::integer
      ELSE 50 + (RANDOM() * 50)::integer
    END as available_leads,
    
    -- Set CPL based on average property price
    CASE 
      WHEN avg_price > 50000000 THEN 35.00 + (RANDOM() * 15)::numeric(10,2)  -- Luxury: 35-50 EGP
      WHEN avg_price > 20000000 THEN 25.00 + (RANDOM() * 10)::numeric(10,2)  -- Premium: 25-35 EGP  
      WHEN avg_price > 10000000 THEN 20.00 + (RANDOM() * 8)::numeric(10,2)   -- Mid-range: 20-28 EGP
      ELSE 15.00 + (RANDOM() * 10)::numeric(10,2)                            -- Affordable: 15-25 EGP
    END as price_per_lead,
    
    -- Create description
    'Real estate project featuring ' || property_count || ' properties in ' || area_name || ' by ' || developer_name || '. Average price: ' || ROUND(avg_price/1000000, 1) || 'M EGP.' as description
    
  FROM compound_extraction
  WHERE compound_name != 'Unknown Compound'
    AND compound_name != ''
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
SELECT 'Projects extracted from inventory!' as status;
SELECT COUNT(*) as total_projects FROM public.projects;

-- 6) Show sample of created projects
SELECT 
  name,
  developer,
  region,
  available_leads,
  price_per_lead
FROM public.projects 
ORDER BY available_leads DESC 
LIMIT 10;

-- 7) Show projects by region
SELECT 
  region,
  COUNT(*) as project_count,
  AVG(price_per_lead)::numeric(10,2) as avg_cpl
FROM public.projects 
GROUP BY region 
ORDER BY project_count DESC;
