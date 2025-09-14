-- ============================================================================
-- SALEMATE SEED DATA
-- Run this after the main migration to populate with sample data
-- ============================================================================

-- Insert sample developers
INSERT INTO public.developers (name) VALUES 
('The Address Investments'), 
('Bold Routes'), 
('Nawy'), 
('Coldwell Banker'),
('Emaar Properties'),
('Palm Hills Development'),
('Talaat Moustafa Group'),
('Al-Futtaim Group'),
('SODIC')
ON CONFLICT (name) DO NOTHING;

-- Insert sample partners
INSERT INTO public.partners (name, description, logo_url, website) VALUES 
('The Address Investments', 'Premium real estate investment company', 'https://example.com/logos/address-investments.png', 'https://address-investments.com'),
('Bold Routes', 'Innovative property solutions', 'https://example.com/logos/bold-routes.png', 'https://boldroutes.com'),
('Nawy', 'Digital real estate platform', 'https://example.com/logos/nawy.png', 'https://nawy.com'),
('Coldwell Banker', 'Global real estate brand', 'https://example.com/logos/coldwell-banker.png', 'https://coldwellbanker.com'),
('Connect Homes', 'Modern living solutions', 'https://example.com/logos/connect-homes.png', 'https://connecthomes.com'),
('View Investments', 'Strategic property investments', 'https://example.com/logos/view-investments.png', 'https://viewinvestments.com'),
('Y Network', 'Real estate networking platform', 'https://example.com/logos/y-network.png', 'https://ynetwork.com'),
('BYIT', 'Build Your Investment Today', 'https://example.com/logos/byit.png', 'https://byit.com')
ON CONFLICT (name) DO NOTHING;

-- Create sample project with developer relationship
INSERT INTO public.projects (developer_id, name, region, description)
SELECT d.id, 'Aliva', 'New Cairo', 'Flagship community with modern amenities'
FROM public.developers d WHERE d.name='The Address Investments'
ON CONFLICT DO NOTHING;

-- Create another sample project
INSERT INTO public.projects (developer_id, name, region, description)
SELECT d.id, 'Palm Hills West', '6th of October', 'Modern residential community with green spaces'
FROM public.developers d WHERE d.name='Palm Hills Development'
ON CONFLICT DO NOTHING;

-- Create lead batch for Aliva project
INSERT INTO public.lead_batches (project_id, batch_name, cpl, created_by)
SELECT p.id, 'Aliva Batch 1', 25.00, (SELECT id FROM public.profiles WHERE role='admin' LIMIT 1)
FROM public.projects p WHERE p.name='Aliva'
ON CONFLICT DO NOTHING;

-- Create lead batch for Palm Hills West project
INSERT INTO public.lead_batches (project_id, batch_name, cpl, created_by)
SELECT p.id, 'Palm Hills Batch 1', 30.00, (SELECT id FROM public.profiles WHERE role='admin' LIMIT 1)
FROM public.projects p WHERE p.name='Palm Hills West'
ON CONFLICT DO NOTHING;

-- Insert sample leads for Aliva project
INSERT INTO public.leads (project_id, batch_id, client_name, client_phone, client_email, stage)
SELECT 
  p.id,
  b.id,
  'Client ' || generate_series(1, 100),
  '+2012345678' || LPAD(generate_series(1, 100)::text, 2, '0'),
  'client' || generate_series(1, 100) || '@example.com',
  'New Lead'
FROM public.projects p, public.lead_batches b
WHERE p.name='Aliva' AND b.project_id=p.id
ON CONFLICT DO NOTHING;

-- Insert sample leads for Palm Hills West project
INSERT INTO public.leads (project_id, batch_id, client_name, client_phone, client_email, stage)
SELECT 
  p.id,
  b.id,
  'Client ' || generate_series(101, 200),
  '+2012345678' || LPAD(generate_series(101, 200)::text, 2, '0'),
  'client' || generate_series(101, 200) || '@example.com',
  'New Lead'
FROM public.projects p, public.lead_batches b
WHERE p.name='Palm Hills West' AND b.project_id=p.id
ON CONFLICT DO NOTHING;

-- Set up partner commissions for projects
INSERT INTO public.project_partner_commissions (project_id, partner_id, commission_rate)
SELECT p.id, pt.id, 5.5
FROM public.projects p, public.partners pt
WHERE p.name='Aliva' AND pt.name='The Address Investments'
ON CONFLICT DO NOTHING;

INSERT INTO public.project_partner_commissions (project_id, partner_id, commission_rate)
SELECT p.id, pt.id, 5.0
FROM public.projects p, public.partners pt
WHERE p.name='Aliva' AND pt.name='Bold Routes'
ON CONFLICT DO NOTHING;

INSERT INTO public.project_partner_commissions (project_id, partner_id, commission_rate)
SELECT p.id, pt.id, 4.5
FROM public.projects p, public.partners pt
WHERE p.name='Palm Hills West' AND pt.name='Nawy'
ON CONFLICT DO NOTHING;

-- Verification queries
SELECT 'Seed data inserted successfully!' as status;

-- Show counts
SELECT 
  'developers' as table_name, COUNT(*) as count FROM public.developers
UNION ALL
SELECT 'partners', COUNT(*) FROM public.partners
UNION ALL
SELECT 'projects', COUNT(*) FROM public.projects
UNION ALL
SELECT 'lead_batches', COUNT(*) FROM public.lead_batches
UNION ALL
SELECT 'leads', COUNT(*) FROM public.leads
UNION ALL
SELECT 'project_partner_commissions', COUNT(*) FROM public.project_partner_commissions;

-- Show lead availability
SELECT * FROM public.lead_availability ORDER BY available_leads DESC;

