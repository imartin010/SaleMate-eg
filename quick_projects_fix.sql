-- QUICK PROJECTS FIX - IMMEDIATE SOLUTION
-- Run this in Supabase SQL Editor to populate projects from compounds

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
GRANT ALL ON public.projects TO authenticated;

-- 3) Clear existing projects
DELETE FROM public.projects;

-- 4) Insert projects from inventory compounds (simple version)
INSERT INTO public.projects (name, developer, region, available_leads, price_per_lead, description)
SELECT DISTINCT
  COALESCE(compound->>'name', 'Unknown Project') as name,
  COALESCE(developer->>'name', 'Unknown Developer') as developer,
  COALESCE(area->>'name', 'Unknown Area') as region,
  100 + (RANDOM() * 100)::integer as available_leads,
  20.00 + (RANDOM() * 20)::numeric(10,2) as price_per_lead,
  'Real estate project in ' || COALESCE(area->>'name', 'Unknown Area') || ' by ' || COALESCE(developer->>'name', 'Unknown Developer') as description
FROM public.sale_mate_inventory
WHERE compound IS NOT NULL 
  AND compound->>'name' IS NOT NULL
  AND compound->>'name' != ''
  AND compound->>'name' != 'null'
LIMIT 50; -- Limit to 50 projects for now

-- 5) Verify results
SELECT 'Projects created!' as status, COUNT(*) as total_projects FROM public.projects;

-- 6) Show created projects
SELECT 
  name,
  developer,
  region,
  available_leads,
  price_per_lead
FROM public.projects 
ORDER BY name 
LIMIT 10;
