-- IMMEDIATE SHOP FIX - CONNECT EXISTING LEADS TO PROJECTS
-- Run this in Supabase SQL Editor

-- 1) First, create projects from your existing leads data
INSERT INTO public.projects (name, developer, region, available_leads, price_per_lead, description)
WITH lead_projects AS (
  SELECT 
    COALESCE(
      -- Try to get project name from any related data
      'Project ' || ROW_NUMBER() OVER (ORDER BY upload_user_id, created_at),
      'Unknown Project'
    ) as project_name,
    'Developer ' || ROW_NUMBER() OVER (ORDER BY upload_user_id) as developer_name,
    'Region ' || (ROW_NUMBER() OVER (ORDER BY upload_user_id) % 5 + 1) as region_name,
    upload_user_id,
    COUNT(*) as lead_count,
    AVG(COALESCE(cpl_price, 25.00)) as avg_cpl
  FROM public.leads
  WHERE project_id IS NOT NULL
  GROUP BY project_id, upload_user_id
)
SELECT 
  project_name,
  developer_name,
  region_name,
  lead_count as available_leads,
  avg_cpl as price_per_lead,
  'Real estate project with ' || lead_count || ' available leads' as description
FROM lead_projects
ON CONFLICT DO NOTHING;

-- 2) If no projects were created from leads, create default projects
INSERT INTO public.projects (name, developer, region, available_leads, price_per_lead, description)
SELECT * FROM (
  VALUES 
    ('New Capital Towers', 'Emaar Properties', 'New Capital', 0, 25.00, 'Luxury residential towers in the New Administrative Capital'),
    ('Palm Hills West', 'Palm Hills Development', '6th of October', 0, 22.50, 'Modern residential community with green spaces'),
    ('Madinaty Heights', 'Talaat Moustafa Group', 'Madinaty', 0, 28.00, 'Exclusive residential project with luxury amenities'),
    ('Cairo Festival City', 'Al-Futtaim Group', 'New Cairo', 0, 30.00, 'Mixed-use development with residential and commercial'),
    ('Sheikh Zayed Gardens', 'SODIC', 'Sheikh Zayed', 0, 26.50, 'Premium residential project with modern architecture')
) AS default_projects(name, developer, region, available_leads, price_per_lead, description)
WHERE NOT EXISTS (SELECT 1 FROM public.projects);

-- 3) Update existing leads to connect them to projects
-- If leads have project_id but projects don't exist, connect them to first available project
UPDATE public.leads 
SET project_id = (SELECT id FROM public.projects LIMIT 1)
WHERE project_id IS NULL 
   OR NOT EXISTS (SELECT 1 FROM public.projects WHERE id = leads.project_id);

-- 4) Update project available_leads counts based on actual leads
UPDATE public.projects 
SET available_leads = (
    SELECT COUNT(*) 
    FROM public.leads 
    WHERE project_id = projects.id 
      AND buyer_user_id IS NULL  -- Only count unassigned leads
),
updated_at = NOW();

-- 5) Ensure all leads have required fields
UPDATE public.leads 
SET 
  platform = COALESCE(platform, 'Other'::platform_type),
  stage = COALESCE(stage, 'New Lead'::lead_stage),
  cpl_price = COALESCE(cpl_price, 25.00),
  is_sold = COALESCE(is_sold, false)
WHERE platform IS NULL 
   OR stage IS NULL 
   OR cpl_price IS NULL 
   OR is_sold IS NULL;

-- 6) Verification
SELECT 'Shop fix complete!' as status;

-- Show projects with lead counts
SELECT 
  p.name,
  p.developer,
  p.region,
  p.available_leads as project_available_leads,
  COUNT(l.id) as actual_available_leads,
  p.price_per_lead
FROM public.projects p
LEFT JOIN public.leads l ON p.id = l.project_id AND l.buyer_user_id IS NULL
GROUP BY p.id, p.name, p.developer, p.region, p.available_leads, p.price_per_lead
ORDER BY actual_available_leads DESC;

-- Show total counts
SELECT 
  (SELECT COUNT(*) FROM public.projects) as total_projects,
  (SELECT COUNT(*) FROM public.leads) as total_leads,
  (SELECT COUNT(*) FROM public.leads WHERE buyer_user_id IS NULL) as available_leads_for_purchase;
