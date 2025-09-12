-- Fix Database Views and Tables for SaleMate App
-- Run this in Supabase SQL Editor to fix all page loading issues

-- 1. Create lead_availability view (for Shop page)
CREATE OR REPLACE VIEW public.lead_availability AS
SELECT
  p.id AS project_id,
  p.name,
  p.developer,
  p.region,
  p.description,
  COUNT(l.*) FILTER (WHERE l.buyer_user_id IS NULL) AS available_leads,
  COALESCE(p.price_per_lead, 25.00) as current_cpl,
  p.price_per_lead,
  p.created_at,
  p.updated_at
FROM public.projects p
LEFT JOIN public.leads l ON l.project_id = p.id
GROUP BY p.id, p.name, p.developer, p.region, p.description, p.price_per_lead, p.created_at, p.updated_at
ORDER BY available_leads DESC;

-- Grant permissions to the view
GRANT SELECT ON public.lead_availability TO authenticated, anon;

-- 2. Ensure partners table exists (for Partners page)
CREATE TABLE IF NOT EXISTS public.partners (
  id SERIAL PRIMARY KEY,
  compound_name TEXT NOT NULL,
  compound_id TEXT,
  developer TEXT,
  area TEXT,
  starting_price NUMERIC,
  image_url TEXT,
  phone_number TEXT,
  developer_sales_name TEXT,
  
  -- Commission rates for each partner
  salemate_commission NUMERIC(4,2),
  address_investments_commission NUMERIC(4,2),
  bold_routes_commission NUMERIC(4,2),
  nawy_partners_commission NUMERIC(4,2),
  coldwell_banker_commission NUMERIC(4,2),
  connect_homes_commission NUMERIC(4,2),
  view_investments_commission NUMERIC(4,2),
  y_network_commission NUMERIC(4,2),
  byit_commission NUMERIC(4,2),
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  UNIQUE(compound_name)
);

-- Enable RLS and set permissions for partners table
ALTER TABLE public.partners ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Anyone can view partners" ON public.partners;
CREATE POLICY "Anyone can view partners" ON public.partners FOR SELECT USING (true);
GRANT ALL ON public.partners TO authenticated;
GRANT SELECT ON public.partners TO anon;
GRANT USAGE, SELECT ON SEQUENCE partners_id_seq TO authenticated;

-- 3. Create partner_commissions_view (for Partners page)
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

-- Grant permissions to the view
GRANT SELECT ON public.partner_commissions_view TO authenticated, anon;

-- 4. Insert sample data if partners table is empty
INSERT INTO public.partners (
    compound_name, 
    compound_id,
    developer, 
    area, 
    starting_price, 
    image_url,
    phone_number,
    developer_sales_name,
    salemate_commission,
    address_investments_commission,
    bold_routes_commission,
    nawy_partners_commission,
    coldwell_banker_commission,
    connect_homes_commission,
    view_investments_commission,
    y_network_commission,
    byit_commission
) 
SELECT 
    'Hacienda Bay', 
    'hacienda-bay', 
    'Palm Hills Developments', 
    'Sidi Abdel Rahman', 
    28116843, 
    'https://example.com/hacienda.jpg', 
    '+20 10 1111 1111', 
    'Ahmed Hassan', 
    6.0, 5.5, 5.5, 4.0, 4.5, 4.8, 5.2, 4.6, 5.8
WHERE NOT EXISTS (SELECT 1 FROM public.partners WHERE compound_name = 'Hacienda Bay');

INSERT INTO public.partners (
    compound_name, 
    compound_id,
    developer, 
    area, 
    starting_price, 
    image_url,
    phone_number,
    developer_sales_name,
    salemate_commission,
    address_investments_commission,
    bold_routes_commission,
    nawy_partners_commission,
    coldwell_banker_commission,
    connect_homes_commission,
    view_investments_commission,
    y_network_commission,
    byit_commission
) 
SELECT 
    'Marassi', 
    'marassi', 
    'Emaar Misr', 
    'Sidi Abdel Rahman', 
    45000000, 
    'https://example.com/marassi.jpg', 
    '+20 10 2222 2222', 
    'Fatima Ali', 
    5.8, 5.2, 5.0, 3.8, 4.2, 4.5, 4.8, 4.3, 5.5
WHERE NOT EXISTS (SELECT 1 FROM public.partners WHERE compound_name = 'Marassi');

INSERT INTO public.partners (
    compound_name, 
    compound_id,
    developer, 
    area, 
    starting_price, 
    image_url,
    phone_number,
    developer_sales_name,
    salemate_commission,
    address_investments_commission,
    bold_routes_commission,
    nawy_partners_commission,
    coldwell_banker_commission,
    connect_homes_commission,
    view_investments_commission,
    y_network_commission,
    byit_commission
) 
SELECT 
    'New Capital', 
    'new-capital', 
    'Capital Group Properties', 
    'New Administrative Capital', 
    35000000, 
    'https://example.com/newcapital.jpg', 
    '+20 10 3333 3333', 
    'Omar Mahmoud', 
    5.5, 4.8, 4.5, 3.5, 3.8, 4.2, 4.5, 4.0, 5.2
WHERE NOT EXISTS (SELECT 1 FROM public.partners WHERE compound_name = 'New Capital');

-- 5. Ensure projects table has sample data (for Shop page)
INSERT INTO public.projects (
    id,
    name,
    developer,
    region,
    available_leads,
    price_per_lead,
    description
) 
SELECT 
    'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
    'New Cairo Heights',
    'Mountain View',
    'New Cairo',
    150,
    125.00,
    'Premium residential project in New Cairo with modern amenities'
WHERE NOT EXISTS (SELECT 1 FROM public.projects WHERE id = 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa');

INSERT INTO public.projects (
    id,
    name,
    developer,
    region,
    available_leads,
    price_per_lead,
    description
) 
SELECT 
    'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb',
    'Marina Bay',
    'Emaar Misr',
    'North Coast',
    200,
    150.00,
    'Luxury beachfront development on the North Coast'
WHERE NOT EXISTS (SELECT 1 FROM public.projects WHERE id = 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb');

INSERT INTO public.projects (
    id,
    name,
    developer,
    region,
    available_leads,
    price_per_lead,
    description
) 
SELECT 
    'cccccccc-cccc-cccc-cccc-cccccccccccc',
    'Future City',
    'Sodic',
    'New Administrative Capital',
    100,
    175.00,
    'Smart city development with integrated technology'
WHERE NOT EXISTS (SELECT 1 FROM public.projects WHERE id = 'cccccccc-cccc-cccc-cccc-cccccccccccc');

-- 6. Ensure deals table exists (for Deals page)
CREATE TABLE IF NOT EXISTS public.deals (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES public.profiles(id),
  deal_type text NOT NULL CHECK (deal_type IN ('EOI', 'Reservation', 'Contract')),
  project_name text NOT NULL,
  developer_name text NOT NULL,
  client_name text NOT NULL,
  unit_code text NOT NULL,
  developer_sales_name text NOT NULL,
  developer_sales_phone text NOT NULL,
  deal_value numeric(12,2) NOT NULL,
  downpayment_percentage numeric(5,2) NOT NULL,
  payment_plan_years integer NOT NULL,
  attachments text[] DEFAULT '{}',
  status text DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  created_at timestamptz DEFAULT NOW(),
  updated_at timestamptz DEFAULT NOW()
);

-- Enable RLS for deals table
ALTER TABLE public.deals ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users can only see their own deals" ON public.deals;
CREATE POLICY "Users can only see their own deals" ON public.deals 
FOR ALL USING (auth.uid() = user_id);

-- Grant permissions
GRANT ALL ON public.deals TO authenticated;

-- Verification queries
SELECT 'Database setup completed!' as status;
SELECT COUNT(*) as total_projects FROM public.projects;
SELECT COUNT(*) as total_partners FROM public.partners;
SELECT COUNT(*) as available_leads FROM public.lead_availability;
SELECT 'partner_commissions_view' as view_name, COUNT(*) as records FROM public.partner_commissions_view;
