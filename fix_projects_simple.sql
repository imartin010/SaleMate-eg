-- SIMPLE PROJECTS FIX - AVOID JSON PARSING ISSUES
-- This creates projects without trying to parse potentially malformed JSON

-- 1) Add missing columns to projects table
ALTER TABLE public.projects 
ADD COLUMN IF NOT EXISTS developer text,
ADD COLUMN IF NOT EXISTS region text,
ADD COLUMN IF NOT EXISTS available_leads integer DEFAULT 0,
ADD COLUMN IF NOT EXISTS price_per_lead numeric(10,2) DEFAULT 25.00,
ADD COLUMN IF NOT EXISTS description text,
ADD COLUMN IF NOT EXISTS created_at timestamptz DEFAULT NOW(),
ADD COLUMN IF NOT EXISTS updated_at timestamptz DEFAULT NOW();

-- 2) Clear existing projects data
DELETE FROM public.projects;

-- 3) Create default projects first (to ensure we have some data)
INSERT INTO public.projects (name, developer, region, available_leads, price_per_lead, description)
VALUES 
  ('Mountain View 1', 'Mountain View', 'New Capital', 150, 25.00, 'Luxury residential towers in the New Administrative Capital'),
  ('Mountain View 2', 'Mountain View', 'New Capital', 95, 24.50, 'Second phase of Mountain View project'),
  ('Palm Hills West', 'Palm Hills', '6th of October', 120, 22.50, 'Modern residential community with green spaces'),
  ('Palm Hills Phase 2', 'Palm Hills', '6th of October', 75, 23.00, 'Second phase of Palm Hills development'),
  ('Madinaty Heights', 'Talaat Moustafa Group', 'Madinaty', 80, 28.00, 'Exclusive residential project with luxury amenities'),
  ('Cairo Festival City', 'Al-Futtaim Group', 'New Cairo', 200, 30.00, 'Mixed-use development with residential and commercial'),
  ('Sheikh Zayed Gardens', 'SODIC', 'Sheikh Zayed', 90, 26.50, 'Premium residential project with modern architecture'),
  ('New Capital Towers', 'Emaar Properties', 'New Capital', 110, 27.00, 'High-rise residential towers with city views'),
  ('Al Rehab City', 'Al Rehab Development', 'Al Rehab', 85, 26.00, 'Family-friendly residential community'),
  ('New Cairo Heights', 'Orascom Development', 'New Cairo', 120, 29.00, 'Modern residential towers with city views'),
  ('Westown Residences', 'SODIC', 'Sheikh Zayed', 65, 24.00, 'Contemporary residential project'),
  ('Golf City', 'Talaat Moustafa Group', '6th of October', 140, 27.50, 'Golf course residential community'),
  ('Waterway', 'SODIC', 'New Cairo', 100, 28.50, 'Waterfront residential project'),
  ('Stone Park', 'Palm Hills Development', '6th of October', 85, 23.50, 'Stone-themed residential community'),
  ('Al Rabwa', 'Orascom Development', 'New Cairo', 75, 26.50, 'Green residential project');

-- 4) Enable RLS and create policies
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

-- 5) Ensure leads table exists and has project_id column
CREATE TABLE IF NOT EXISTS public.leads (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id uuid REFERENCES public.projects(id) ON DELETE SET NULL,
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

-- Add project_id column if it doesn't exist
ALTER TABLE public.leads ADD COLUMN IF NOT EXISTS project_id uuid REFERENCES public.projects(id) ON DELETE SET NULL;

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
  'Projects Table Created Successfully!' as status,
  (SELECT COUNT(*) FROM public.projects) as total_projects,
  (SELECT COUNT(*) FROM public.leads) as total_leads;

-- 8) Show created projects (prioritizing Mountain View and Palm Hills)
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
  name;
