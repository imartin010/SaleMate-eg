-- Quick fix for projects loading issue
-- Run this in Supabase SQL Editor

-- 1. Check if projects table exists and has data
SELECT 
  'Projects table check' as status,
  COUNT(*) as project_count
FROM public.projects;

-- 2. If no projects exist, create some sample ones
INSERT INTO public.projects (name, region, available_leads, price_per_lead, description)
SELECT * FROM (VALUES
  ('New Capital Towers', 'New Capital', 150, 125.00, 'Premium residential towers in New Capital'),
  ('Palm Hills West', '6th October', 200, 110.00, 'Luxury villas in Palm Hills West'),
  ('Madinaty Heights', 'Madinaty', 120, 130.00, 'Modern apartments in Madinaty'),
  ('Cairo Festival City', 'New Cairo', 180, 115.00, 'Mixed-use development in New Cairo'),
  ('Rehab City', 'Rehab', 90, 140.00, 'Family-friendly community in Rehab'),
  ('Sheikh Zayed Gardens', 'Sheikh Zayed', 110, 120.00, 'Garden-style apartments in Sheikh Zayed')
) AS sample_projects(name, region, available_leads, price_per_lead, description)
WHERE NOT EXISTS (SELECT 1 FROM public.projects LIMIT 1);

-- 3. Verify projects were created
SELECT 
  'Projects after insert' as status,
  COUNT(*) as project_count,
  string_agg(name, ', ') as project_names
FROM public.projects;

-- 4. Test a simple query
SELECT id, name, region, available_leads, price_per_lead 
FROM public.projects 
ORDER BY name 
LIMIT 5;

SELECT 'Projects setup complete!' as final_status;
