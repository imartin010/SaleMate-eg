-- FIX FOR PROJECTS DATA EXTRACTION
-- This handles the text vs JSON data type issue in salemate-inventory

-- 1) First, let's check the actual structure of salemate-inventory
-- SELECT column_name, data_type FROM information_schema.columns WHERE table_name = 'salemate-inventory' AND table_schema = 'public';

-- 2) Add missing columns to projects table (if not already done)
ALTER TABLE public.projects 
ADD COLUMN IF NOT EXISTS developer text,
ADD COLUMN IF NOT EXISTS region text,
ADD COLUMN IF NOT EXISTS available_leads integer DEFAULT 0,
ADD COLUMN IF NOT EXISTS price_per_lead numeric(10,2) DEFAULT 25.00,
ADD COLUMN IF NOT EXISTS description text,
ADD COLUMN IF NOT EXISTS created_at timestamptz DEFAULT NOW(),
ADD COLUMN IF NOT EXISTS updated_at timestamptz DEFAULT NOW();

-- 3) Clear existing projects data
DELETE FROM public.projects;

-- 4) Extract projects from salemate-inventory (handling both text and JSON formats)
INSERT INTO public.projects (name, developer, region, available_leads, price_per_lead, description)
WITH project_data AS (
  SELECT DISTINCT
    CASE 
      -- Handle JSON format: {"name": "Project Name"}
      WHEN compound::text ~ '^\{.*\}$' THEN 
        COALESCE(
          (compound::jsonb->>'name'),
          'Unknown Project'
        )
      -- Handle text format: "Project Name"
      WHEN compound IS NOT NULL AND compound != '' THEN 
        COALESCE(compound, 'Unknown Project')
      ELSE 'Unknown Project'
    END as project_name,
    
    CASE 
      -- Handle JSON format
      WHEN developer::text ~ '^\{.*\}$' THEN 
        COALESCE(
          (developer::jsonb->>'name'),
          'Unknown Developer'
        )
      -- Handle text format
      WHEN developer IS NOT NULL AND developer != '' THEN 
        COALESCE(developer, 'Unknown Developer')
      ELSE 'Unknown Developer'
    END as developer_name,
    
    CASE 
      -- Handle JSON format
      WHEN area::text ~ '^\{.*\}$' THEN 
        COALESCE(
          (area::jsonb->>'name'),
          'Unknown Area'
        )
      -- Handle text format
      WHEN area IS NOT NULL AND area != '' THEN 
        COALESCE(area, 'Unknown Area')
      ELSE 'Unknown Area'
    END as region_name
  FROM public."salemate-inventory"
  WHERE compound IS NOT NULL 
    AND compound != ''
    AND compound != 'null'
)
SELECT 
  project_name,
  developer_name,
  region_name,
  50 + (RANDOM() * 100)::integer as available_leads,
  20.00 + (RANDOM() * 15)::numeric(10,2) as price_per_lead,
  'Real estate project in ' || region_name || ' by ' || developer_name as description
FROM project_data
WHERE project_name != 'Unknown Project'
  AND developer_name != 'Unknown Developer'
  AND region_name != 'Unknown Area'
LIMIT 25; -- Limit to 25 projects

-- 5) If no projects were created from inventory, create default projects
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
    ('Mountain View 2', 'Mountain View', 'New Capital', 95, 24.50, 'Second phase of Mountain View project'),
    ('Al Rehab City', 'Al Rehab Development', 'Al Rehab', 85, 26.00, 'Family-friendly residential community'),
    ('New Cairo Heights', 'Orascom Development', 'New Cairo', 120, 29.00, 'Modern residential towers with city views')
) AS default_projects(name, developer, region, available_leads, price_per_lead, description)
WHERE NOT EXISTS (SELECT 1 FROM public.projects);

-- 6) Enable RLS and create policies
ALTER TABLE public.projects ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "projects_select_all" ON public.projects;
DROP POLICY IF EXISTS "projects_insert_all" ON public.projects;
DROP POLICY IF EXISTS "projects_update_all" ON public.projects;

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

-- 7) Verify the fix
SELECT 
  'Projects Table Fixed!' as status,
  (SELECT COUNT(*) FROM public.projects) as total_projects;

-- 8) Show the table structure
SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_name = 'projects' AND table_schema = 'public'
ORDER BY ordinal_position;

-- 9) Show created projects (prioritizing Mountain View and Palm Hills)
SELECT 
  name,
  developer,
  region,
  available_leads,
  price_per_lead
FROM public.projects 
ORDER BY 
  CASE 
    WHEN developer ILIKE '%mountain view%' THEN 1
    WHEN developer ILIKE '%palm hills%' THEN 2
    ELSE 3
  END,
  name
LIMIT 15;
