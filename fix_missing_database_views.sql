-- Fix Missing Database Views and Tables
-- Run this in Supabase SQL Editor to fix all the missing database components

-- 1. Create lead_availability view (needed for Shop page)
CREATE OR REPLACE VIEW public.lead_availability AS
SELECT
  p.id AS project_id,
  p.name,
  p.developer,
  p.region,
  p.description,
  COUNT(l.*) FILTER (WHERE l.buyer_user_id IS NULL) AS available_leads,
  COALESCE(p.price_per_lead, 125.00) as current_cpl,
  p.created_at,
  p.updated_at
FROM public.projects p
LEFT JOIN public.leads l ON l.project_id = p.id
GROUP BY p.id, p.name, p.developer, p.region, p.description, p.price_per_lead, p.created_at, p.updated_at
ORDER BY available_leads DESC;

-- 2. Create partner_commissions_view (needed for Partners page)
CREATE OR REPLACE VIEW public.partner_commissions_view AS
SELECT 
    p.*,
    (
        CASE WHEN p.salemate_commission IS NOT NULL THEN 1 ELSE 0 END +
        CASE WHEN p.address_investments_commission IS NOT NULL THEN 1 ELSE 0 END +
        CASE WHEN p.bold_routes_commission IS NOT NULL THEN 1 ELSE 0 END +
        CASE WHEN p.nawy_partners_commission IS NOT NULL THEN 1 ELSE 0 END +
        CASE WHEN p.coldwell_banker_commission IS NOT NULL THEN 1 ELSE 0 END +
        CASE WHEN p.connect_homes_commission IS NOT NULL THEN 1 ELSE 0 END +
        CASE WHEN p.view_investments_commission IS NOT NULL THEN 1 ELSE 0 END +
        CASE WHEN p.y_network_commission IS NOT NULL THEN 1 ELSE 0 END +
        CASE WHEN p.byit_commission IS NOT NULL THEN 1 ELSE 0 END
    ) as active_partners_count,
    
    GREATEST(
        COALESCE(p.salemate_commission, 0),
        COALESCE(p.address_investments_commission, 0),
        COALESCE(p.bold_routes_commission, 0),
        COALESCE(p.nawy_partners_commission, 0),
        COALESCE(p.coldwell_banker_commission, 0),
        COALESCE(p.connect_homes_commission, 0),
        COALESCE(p.view_investments_commission, 0),
        COALESCE(p.y_network_commission, 0),
        COALESCE(p.byit_commission, 0)
    ) as highest_commission_rate
FROM public.partners p;

-- 3. Ensure projects table exists with sample data
INSERT INTO public.projects (id, name, developer, region, description, available_leads, price_per_lead) 
VALUES 
  ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'New Cairo Compound', 'Palm Hills', 'New Cairo', 'Luxury residential compound', 150, 125.00),
  ('bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', 'North Coast Resort', 'Emaar', 'North Coast', 'Beachfront resort community', 200, 150.00),
  ('cccccccc-cccc-cccc-cccc-cccccccccccc', 'Sheikh Zayed Villas', 'Sodic', 'Sheikh Zayed', 'Premium villa community', 100, 175.00)
ON CONFLICT (id) DO NOTHING;

-- 4. Ensure partners table exists with sample data
INSERT INTO public.partners (
  compound_name, developer, area, starting_price,
  salemate_commission, address_investments_commission, bold_routes_commission, 
  nawy_partners_commission, coldwell_banker_commission
) VALUES 
  ('New Cairo Compound', 'Palm Hills', 'New Cairo', 5000000, 6.0, 5.5, 5.5, 4.0, 4.5),
  ('North Coast Resort', 'Emaar', 'North Coast', 8000000, 6.5, 6.0, 6.0, 4.5, 5.0),
  ('Sheikh Zayed Villas', 'Sodic', 'Sheikh Zayed', 12000000, 7.0, 6.5, 6.5, 5.0, 5.5)
ON CONFLICT (compound_name) DO NOTHING;

-- 5. Create some sample leads for testing
INSERT INTO public.leads (
  project_id, client_name, client_phone, client_email, stage, platform
) VALUES 
  ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'Ahmed Hassan', '+201234567890', 'ahmed@example.com', 'New Lead', 'Facebook'),
  ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'Fatima Al-Rashid', '+201987654321', 'fatima@example.com', 'Potential', 'Google'),
  ('bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', 'Omar Mahmoud', '+201555123456', 'omar@example.com', 'Hot Case', 'TikTok'),
  ('cccccccc-cccc-cccc-cccc-cccccccccccc', 'Layla Ahmed', '+201666789012', 'layla@example.com', 'New Lead', 'Facebook')
ON CONFLICT DO NOTHING;

-- 6. Grant permissions to views
GRANT SELECT ON public.lead_availability TO authenticated, anon;
GRANT SELECT ON public.partner_commissions_view TO authenticated, anon;

-- 7. Refresh any materialized views if they exist
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_matviews WHERE matviewname = 'lead_analytics_mv') THEN
    REFRESH MATERIALIZED VIEW public.lead_analytics_mv;
  END IF;
END$$;

-- Verification queries
SELECT 'Database setup completed!' as status;
SELECT COUNT(*) as projects_count FROM public.projects;
SELECT COUNT(*) as leads_count FROM public.leads;
SELECT COUNT(*) as partners_count FROM public.partners;
SELECT COUNT(*) as available_leads FROM public.lead_availability;
SELECT COUNT(*) as partner_commissions FROM public.partner_commissions_view;
