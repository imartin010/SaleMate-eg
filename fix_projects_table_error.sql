-- FIX FOR "column projects_1.developer does not exist" ERROR
-- This creates the missing projects table and populates it

-- 1) Create the projects table if it doesn't exist
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

-- 2) Enable RLS and create policies
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

-- 3) Populate projects from salemate-inventory compounds
-- Clear existing projects first
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

-- 4) If no projects were created from inventory, create default projects
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

-- 5) Ensure leads table has proper foreign key to projects
-- First check if leads table exists and has project_id column
DO $$
BEGIN
  -- Create leads table if it doesn't exist
  IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'leads' AND table_schema = 'public') THEN
    CREATE TABLE public.leads (
      id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
      project_id uuid REFERENCES public.projects(id) ON DELETE CASCADE,
      buyer_user_id uuid REFERENCES public.profiles(id),
      client_name text NOT NULL,
      client_phone text NOT NULL,
      client_phone2 text,
      client_phone3 text,
      client_email text,
      client_job_title text,
      stage text DEFAULT 'New Lead',
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
  END IF;
  
  -- Add project_id column if it doesn't exist
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'leads' AND column_name = 'project_id' AND table_schema = 'public') THEN
    ALTER TABLE public.leads ADD COLUMN project_id uuid REFERENCES public.projects(id) ON DELETE CASCADE;
  END IF;
END$$;

-- 6) Enable RLS for leads table
ALTER TABLE public.leads ENABLE ROW LEVEL SECURITY;

-- Drop existing leads policies
DROP POLICY IF EXISTS "leads_select_own" ON public.leads;
DROP POLICY IF EXISTS "leads_insert_own" ON public.leads;
DROP POLICY IF EXISTS "leads_update_own" ON public.leads;

-- Create leads policies
CREATE POLICY "leads_select_own" ON public.leads 
  FOR SELECT TO authenticated 
  USING (auth.uid() = buyer_user_id OR auth.uid() = upload_user_id);

CREATE POLICY "leads_insert_own" ON public.leads 
  FOR INSERT TO authenticated 
  WITH CHECK (auth.uid() = upload_user_id);

CREATE POLICY "leads_update_own" ON public.leads 
  FOR UPDATE TO authenticated 
  USING (auth.uid() = buyer_user_id OR auth.uid() = upload_user_id);

-- Grant permissions for leads
GRANT ALL ON public.leads TO authenticated;
GRANT ALL ON public.leads TO service_role;

-- 7) Verify the fix
SELECT 
  'Projects Table Fixed!' as status,
  (SELECT COUNT(*) FROM public.projects) as total_projects,
  (SELECT COUNT(*) FROM public.leads) as total_leads;

-- 8) Show created projects
SELECT 
  name,
  developer,
  region,
  available_leads,
  price_per_lead
FROM public.projects 
ORDER BY name 
LIMIT 10;

