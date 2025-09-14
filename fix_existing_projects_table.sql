-- FIX EXISTING PROJECTS TABLE SCHEMA
-- This adds missing columns to the existing projects table

-- 1) First, check what columns exist in the current projects table
-- SELECT column_name, data_type FROM information_schema.columns WHERE table_name = 'projects' AND table_schema = 'public';

-- 2) Add missing columns to the existing projects table
ALTER TABLE public.projects 
ADD COLUMN IF NOT EXISTS developer text,
ADD COLUMN IF NOT EXISTS region text,
ADD COLUMN IF NOT EXISTS available_leads integer DEFAULT 0,
ADD COLUMN IF NOT EXISTS price_per_lead numeric(10,2) DEFAULT 25.00,
ADD COLUMN IF NOT EXISTS description text,
ADD COLUMN IF NOT EXISTS created_at timestamptz DEFAULT NOW(),
ADD COLUMN IF NOT EXISTS updated_at timestamptz DEFAULT NOW();

-- 3) Update existing rows with default values if they're NULL
UPDATE public.projects 
SET 
    developer = COALESCE(developer, 'Unknown Developer'),
    region = COALESCE(region, 'Unknown Region'),
    available_leads = COALESCE(available_leads, 0),
    price_per_lead = COALESCE(price_per_lead, 25.00),
    description = COALESCE(description, 'Real estate project'),
    created_at = COALESCE(created_at, NOW()),
    updated_at = NOW()
WHERE developer IS NULL 
   OR region IS NULL 
   OR available_leads IS NULL 
   OR price_per_lead IS NULL 
   OR description IS NULL;

-- 4) Enable RLS and create policies (if not already enabled)
ALTER TABLE public.projects ENABLE ROW LEVEL SECURITY;

-- Drop existing policies
DROP POLICY IF EXISTS "projects_select_all" ON public.projects;
DROP POLICY IF EXISTS "projects_insert_all" ON public.projects;
DROP POLICY IF EXISTS "projects_update_all" ON public.projects;

-- Create new policies
CREATE POLICY "projects_select_all" ON public.projects 
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "projects_insert_all" ON public.projects 
  FOR INSERT TO authenticated WITH CHECK (true);

CREATE POLICY "projects_update_all" ON public.projects 
  FOR UPDATE TO authenticated USING (true);

-- Grant permissions
GRANT ALL ON public.projects TO authenticated;
GRANT ALL ON public.projects TO service_role;
GRANT ALL ON public.projects TO anon;

-- 5) Now populate the table with data from inventory
-- Clear existing data first
DELETE FROM public.projects;

-- Insert projects extracted from inventory data
INSERT INTO public.projects (name, developer, region, available_leads, price_per_lead, description)
WITH compound_data AS (
  SELECT DISTINCT
    COALESCE(compound->>'name', 'Unknown Project') as project_name,
    COALESCE(developer->>'name', 'Unknown Developer') as developer_name,
    COALESCE(area->>'name', 'Unknown Area') as region_name
  FROM public."salemate-inventory"
  WHERE compound IS NOT NULL 
    AND compound->>'name' IS NOT NULL
    AND compound->>'name' != ''
    AND compound->>'name' != 'null'
    AND compound->>'name' != '{}'
)
SELECT 
  project_name,
  developer_name,
  region_name,
  50 + (RANDOM() * 100)::integer as available_leads,
  20.00 + (RANDOM() * 15)::numeric(10,2) as price_per_lead,
  'Real estate project in ' || region_name || ' by ' || developer_name as description
FROM compound_data
WHERE project_name != 'Unknown Project'
  AND developer_name != 'Unknown Developer'
  AND region_name != 'Unknown Area'
LIMIT 20; -- Limit to 20 projects for now

-- 6) If no projects were created from inventory, create default projects
INSERT INTO public.projects (name, developer, region, available_leads, price_per_lead, description)
SELECT * FROM (
  VALUES 
    ('Mountain View 1', 'Mountain View', 'New Capital', 150, 25.00, 'Luxury residential towers in the New Administrative Capital'),
    ('Palm Hills West', 'Palm Hills', '6th of October', 120, 22.50, 'Modern residential community with green spaces'),
    ('Madinaty Heights', 'Talaat Moustafa Group', 'Madinaty', 80, 28.00, 'Exclusive residential project with luxury amenities'),
    ('Cairo Festival City', 'Al-Futtaim Group', 'New Cairo', 200, 30.00, 'Mixed-use development with residential and commercial'),
    ('Sheikh Zayed Gardens', 'SODIC', 'Sheikh Zayed', 90, 26.50, 'Premium residential project with modern architecture'),
    ('New Capital Towers', 'Emaar Properties', 'New Capital', 110, 27.00, 'High-rise residential towers with city views'),
    ('Palm Hills Phase 2', 'Palm Hills', '6th of October', 75, 23.00, 'Second phase of Palm Hills development'),
    ('Mountain View 2', 'Mountain View', 'New Capital', 95, 24.50, 'Second phase of Mountain View project')
) AS default_projects(name, developer, region, available_leads, price_per_lead, description)
WHERE NOT EXISTS (SELECT 1 FROM public.projects);

-- 7) Verify the fix
SELECT 
  'Projects Table Schema Fixed!' as status,
  (SELECT COUNT(*) FROM public.projects) as total_projects;

-- 8) Show the table structure
SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_name = 'projects' AND table_schema = 'public'
ORDER BY ordinal_position;

-- 9) Show created projects
SELECT 
  name,
  developer,
  region,
  available_leads,
  price_per_lead
FROM public.projects 
ORDER BY name 
LIMIT 10;
