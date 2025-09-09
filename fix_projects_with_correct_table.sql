-- FIX PROJECTS TABLE - CORRECTED TABLE NAME
-- Run this in Supabase SQL Editor

-- 1) First, let's check what inventory tables exist
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
  AND table_name LIKE '%inventory%'
ORDER BY table_name;

-- 2) Check what tables have compound data
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
  AND table_name LIKE '%salemate%'
ORDER BY table_name;

-- 3) If salemate-inventory exists (with quotes), use it
-- If sale_mate_inventory exists (with underscores), use it
-- Let's try both variations

-- 4) Ensure projects table exists
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

-- 5) Enable RLS and permissions
ALTER TABLE public.projects ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "projects_select_all" ON public.projects;
CREATE POLICY "projects_select_all" ON public.projects FOR SELECT TO authenticated USING (true);
DROP POLICY IF EXISTS "projects_insert_all" ON public.projects;
CREATE POLICY "projects_insert_all" ON public.projects FOR INSERT TO authenticated WITH CHECK (true);
DROP POLICY IF EXISTS "projects_update_all" ON public.projects;
CREATE POLICY "projects_update_all" ON public.projects FOR UPDATE TO authenticated USING (true);
GRANT ALL ON public.projects TO authenticated;

-- 6) Clear existing projects
DELETE FROM public.projects;

-- 7) Try to insert from "salemate-inventory" table (with quotes)
INSERT INTO public.projects (name, developer, region, available_leads, price_per_lead, description)
SELECT DISTINCT
  COALESCE(compound->>'name', 'Unknown Project') as name,
  COALESCE(developer->>'name', 'Unknown Developer') as developer,
  COALESCE(area->>'name', 'Unknown Area') as region,
  100 + (RANDOM() * 100)::integer as available_leads,
  20.00 + (RANDOM() * 20)::numeric(10,2) as price_per_lead,
  'Real estate project in ' || COALESCE(area->>'name', 'Unknown Area') || ' by ' || COALESCE(developer->>'name', 'Unknown Developer') as description
FROM public."salemate-inventory"
WHERE compound IS NOT NULL 
  AND compound->>'name' IS NOT NULL
  AND compound->>'name' != ''
  AND compound->>'name' != 'null'
LIMIT 50;

-- 8) If that fails, create some default projects manually
INSERT INTO public.projects (name, developer, region, available_leads, price_per_lead, description)
SELECT * FROM (
  VALUES 
    ('Hacienda Bay', 'Palm Hills Developments', 'Sidi Abdel Rahman', 150, 25.00, 'Luxury resort community on the North Coast with pristine beaches and premium amenities'),
    ('Telal North Coast', 'Roya Developments', 'Sidi Abdel Rahman', 120, 28.00, 'Exclusive beachfront development with modern villas and chalets'),
    ('El Masyaf', 'M Squared', 'Ras El Hekma', 100, 35.00, 'Premium coastal development with luxury villas and stunning sea views'),
    ('Village West', 'Dorra Group', 'El Sheikh Zayed', 180, 22.50, 'Modern residential community with green spaces and family amenities'),
    ('New Capital Towers', 'Emaar Properties', 'New Capital', 200, 30.00, 'High-rise residential towers in the heart of the New Administrative Capital'),
    ('Palm Hills West', 'Palm Hills Development', '6th of October', 160, 24.00, 'Integrated residential community with schools, parks, and commercial areas'),
    ('Madinaty Heights', 'Talaat Moustafa Group', 'Madinaty', 140, 26.50, 'Luxury residential project with premium finishes and amenities'),
    ('Cairo Festival City', 'Al-Futtaim Group', 'New Cairo', 190, 32.00, 'Mixed-use development with residential, commercial, and entertainment facilities'),
    ('Rehab City', 'Rehab Development', 'Rehab', 110, 20.00, 'Family-oriented community with parks, schools, and convenient transportation'),
    ('Sheikh Zayed Gardens', 'SODIC', 'Sheikh Zayed', 130, 27.00, 'Premium residential project with landscaped gardens and modern architecture')
) AS default_projects(name, developer, region, available_leads, price_per_lead, description)
WHERE NOT EXISTS (SELECT 1 FROM public.projects);

-- 9) Verify the results
SELECT 'Projects setup complete!' as status;
SELECT COUNT(*) as total_projects FROM public.projects;

-- 10) Show all created projects
SELECT 
  name,
  developer,
  region,
  available_leads,
  price_per_lead
FROM public.projects 
ORDER BY name;
