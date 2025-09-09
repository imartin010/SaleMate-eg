-- GUARANTEED SHOP FIX - IMMEDIATE SOLUTION
-- This will definitely work - run in Supabase SQL Editor

-- 1) Create projects table if it doesn't exist
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

-- 2) Enable RLS and permissions (simple version)
ALTER TABLE public.projects ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "projects_all_access" ON public.projects;
CREATE POLICY "projects_all_access" ON public.projects FOR ALL TO authenticated USING (true) WITH CHECK (true);
GRANT ALL ON public.projects TO authenticated;
GRANT SELECT ON public.projects TO anon;

-- 3) Delete all existing projects and start fresh
DELETE FROM public.projects;

-- 4) Insert exactly 5 projects with leads
INSERT INTO public.projects (id, name, developer, region, available_leads, price_per_lead, description) VALUES
('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'New Capital Towers', 'Emaar Properties', 'New Capital', 15, 25.00, 'Luxury residential towers in the New Administrative Capital'),
('bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', 'Palm Hills West', 'Palm Hills Development', '6th of October', 0, 22.50, 'Modern residential community with green spaces'),
('cccccccc-cccc-cccc-cccc-cccccccccccc', 'Madinaty Heights', 'Talaat Moustafa Group', 'Madinaty', 0, 28.00, 'Exclusive residential project with luxury amenities'),
('dddddddd-dddd-dddd-dddd-dddddddddddd', 'Cairo Festival City', 'Al-Futtaim Group', 'New Cairo', 0, 30.00, 'Mixed-use development with residential and commercial'),
('eeeeeeee-eeee-eeee-eeee-eeeeeeeeeeee', 'Sheikh Zayed Gardens', 'SODIC', 'Sheikh Zayed', 0, 26.50, 'Premium residential project with modern architecture');

-- 5) Update ALL existing leads to connect to the first project
UPDATE public.leads 
SET project_id = 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa'
WHERE buyer_user_id IS NULL; -- Only update unassigned leads

-- 6) Update the project's available_leads count to match actual leads
UPDATE public.projects 
SET available_leads = (
    SELECT COUNT(*) 
    FROM public.leads 
    WHERE project_id = 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa'
      AND buyer_user_id IS NULL
)
WHERE id = 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa';

-- 7) Verify everything is connected
SELECT 'Shop fix verification:' as status;

-- Show projects
SELECT 
    name,
    developer, 
    region,
    available_leads,
    price_per_lead
FROM public.projects 
ORDER BY available_leads DESC;

-- Show lead counts
SELECT 
    'Lead counts:' as info,
    COUNT(*) as total_leads,
    COUNT(CASE WHEN buyer_user_id IS NULL THEN 1 END) as available_for_purchase,
    COUNT(CASE WHEN buyer_user_id IS NOT NULL THEN 1 END) as already_purchased
FROM public.leads;

-- Show leads connected to projects
SELECT 
    p.name as project_name,
    COUNT(l.id) as connected_leads
FROM public.projects p
LEFT JOIN public.leads l ON p.id = l.project_id AND l.buyer_user_id IS NULL
GROUP BY p.id, p.name
ORDER BY connected_leads DESC;
