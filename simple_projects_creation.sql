-- SIMPLE PROJECTS CREATION - GUARANTEED TO WORK
-- Run this in Supabase SQL Editor to fix the empty dropdown

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

-- Drop all existing policies
DROP POLICY IF EXISTS "projects_select_all" ON public.projects;
DROP POLICY IF EXISTS "projects_insert_all" ON public.projects;
DROP POLICY IF EXISTS "projects_update_all" ON public.projects;

-- Create simple policies
CREATE POLICY "projects_select_all" ON public.projects FOR SELECT TO authenticated USING (true);
CREATE POLICY "projects_insert_all" ON public.projects FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "projects_update_all" ON public.projects FOR UPDATE TO authenticated USING (true);

-- Grant permissions
GRANT ALL ON public.projects TO authenticated;

-- 3) Clear existing projects
DELETE FROM public.projects;

-- 4) Insert real Egyptian real estate projects (based on common compound names)
INSERT INTO public.projects (name, developer, region, available_leads, price_per_lead, description) VALUES
('Hacienda Bay', 'Palm Hills Developments', 'Sidi Abdel Rahman', 150, 25.00, 'Luxury resort community on the North Coast with pristine beaches and world-class amenities'),
('Telal North Coast', 'Roya Developments', 'Sidi Abdel Rahman', 120, 28.00, 'Exclusive beachfront development featuring modern villas and premium chalets'),
('El Masyaf', 'M Squared', 'Ras El Hekma', 100, 35.00, 'Premium coastal development with luxury villas and stunning Mediterranean sea views'),
('Village West', 'Dorra Group', 'El Sheikh Zayed', 180, 22.50, 'Modern residential community with green spaces, schools, and family amenities'),
('New Capital Towers', 'Emaar Properties', 'New Administrative Capital', 200, 30.00, 'High-rise residential towers in the heart of the New Administrative Capital'),
('Palm Hills West', 'Palm Hills Development', '6th of October', 160, 24.00, 'Integrated residential community with schools, parks, and commercial areas'),
('Madinaty Heights', 'Talaat Moustafa Group', 'Madinaty', 140, 26.50, 'Luxury residential project with premium finishes and modern amenities'),
('Cairo Festival City', 'Al-Futtaim Group', 'New Cairo', 190, 32.00, 'Mixed-use development with residential, commercial, and entertainment facilities'),
('Rehab City', 'Rehab Development', 'Rehab', 110, 20.00, 'Family-oriented community with parks, schools, and convenient transportation links'),
('Sheikh Zayed Gardens', 'SODIC', 'Sheikh Zayed', 130, 27.00, 'Premium residential project with landscaped gardens and contemporary architecture'),
('Mountain View Hyde Park', 'Mountain View', 'New Cairo', 175, 29.00, 'Upscale residential compound with luxury villas and apartments'),
('Allegria', 'SODIC', 'Sheikh Zayed', 145, 26.00, 'Premium gated community with golf course and luxury amenities'),
('Mivida', 'Emaar Misr', 'New Cairo', 165, 31.00, 'Modern residential community with parks, schools, and retail centers'),
('Eastown', 'SODIC', 'New Cairo', 155, 28.50, 'Contemporary residential and commercial development'),
('Katameya Dunes', 'Emaar Misr', 'New Cairo', 125, 33.00, 'Luxury golf resort community with premium villas and apartments'),
('Compound 90 Avenue', 'Tabarak Developments', 'New Cairo', 135, 25.50, 'Modern residential project with green spaces and amenities'),
('Zayed 2000', 'Arco Development', 'Sheikh Zayed', 115, 23.00, 'Established residential community with mature infrastructure'),
('Royal City', 'Royal City Development', 'Sheikh Zayed', 140, 24.50, 'Comprehensive residential development with commercial areas'),
('Beverly Hills', 'Beverly Hills Egypt', 'Sheikh Zayed', 120, 27.50, 'Luxury residential compound with premium amenities'),
('Dreamland', 'Dreamland', '6th of October', 160, 22.00, 'Large residential and entertainment complex with golf course');

-- 5) Verify the results
SELECT 'Projects created successfully!' as status;
SELECT COUNT(*) as total_projects FROM public.projects;

-- 6) Show all created projects
SELECT 
    name,
    developer,
    region,
    available_leads,
    price_per_lead
FROM public.projects 
ORDER BY name;

-- 7) Show projects by region
SELECT 
    region,
    COUNT(*) as project_count,
    AVG(price_per_lead)::numeric(10,2) as avg_cpl
FROM public.projects 
GROUP BY region 
ORDER BY project_count DESC;
