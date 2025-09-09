-- POPULATE PROJECTS TABLE FROM COMPOUND NAMES
-- This will create projects from unique compounds in the inventory data
-- Run this in Supabase SQL Editor

-- 1) First, ensure projects table exists with proper structure
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
TRUNCATE public.projects;

-- 4) Insert projects from unique compounds in inventory
INSERT INTO public.projects (name, developer, region, available_leads, price_per_lead, description)
WITH compound_data AS (
  SELECT 
    -- Extract compound name from JSONB
    COALESCE(compound->>'name', 'Unknown Compound') as compound_name,
    
    -- Extract developer name from JSONB
    COALESCE(developer->>'name', 'Unknown Developer') as developer_name,
    
    -- Extract area name from JSONB
    COALESCE(area->>'name', 'Unknown Area') as area_name,
    
    -- Calculate average price and count properties
    AVG(price_in_egp) as avg_price,
    COUNT(*) as property_count,
    
    -- Get a sample image
    (ARRAY_AGG(image ORDER BY id))[1] as sample_image
    
  FROM public.sale_mate_inventory
  WHERE compound IS NOT NULL 
    AND compound->>'name' IS NOT NULL
    AND compound->>'name' != ''
  GROUP BY compound->>'name', developer->>'name', area->>'name'
),

project_data AS (
  SELECT 
    compound_name as name,
    developer_name as developer,
    area_name as region,
    
    -- Generate realistic lead counts based on property count
    CASE 
      WHEN property_count > 200 THEN 150 + (RANDOM() * 100)::integer
      WHEN property_count > 100 THEN 100 + (RANDOM() * 80)::integer
      WHEN property_count > 50 THEN 50 + (RANDOM() * 60)::integer
      ELSE 30 + (RANDOM() * 40)::integer
    END as available_leads,
    
    -- Calculate CPL based on average property price
    CASE 
      WHEN avg_price > 50000000 THEN 35.00 + (RANDOM() * 15)::numeric(10,2)  -- Luxury: 35-50 EGP
      WHEN avg_price > 20000000 THEN 25.00 + (RANDOM() * 10)::numeric(10,2)  -- Premium: 25-35 EGP
      WHEN avg_price > 10000000 THEN 20.00 + (RANDOM() * 8)::numeric(10,2)   -- Mid-range: 20-28 EGP
      ELSE 15.00 + (RANDOM() * 10)::numeric(10,2)                            -- Affordable: 15-25 EGP
    END as price_per_lead,
    
    -- Create description
    CASE 
      WHEN property_count > 200 THEN 'Large development project with ' || property_count || ' properties in ' || area_name || '. Premium location with excellent investment potential.'
      WHEN property_count > 100 THEN 'Major residential project featuring ' || property_count || ' units in ' || area_name || '. Great opportunity for real estate professionals.'
      WHEN property_count > 50 THEN 'Established development with ' || property_count || ' properties in ' || area_name || '. Proven track record and steady demand.'
      ELSE 'Boutique development offering ' || property_count || ' exclusive properties in ' || area_name || '. Perfect for targeted marketing.'
    END as description,
    
    property_count
    
  FROM compound_data
  WHERE compound_name != 'Unknown Compound'
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
FROM project_data
WHERE name IS NOT NULL 
  AND name != ''
ORDER BY name;

-- 5) Verify the results
SELECT 'Projects created successfully!' as status;
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
