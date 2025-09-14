-- Create the partner_commissions_view that was missing
-- This view is needed for the Partners page to work

-- First, make sure the partners table exists
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

-- Enable RLS
ALTER TABLE public.partners ENABLE ROW LEVEL SECURITY;

-- Create RLS policy
CREATE POLICY "Anyone can view partners" ON public.partners 
FOR SELECT USING (true);

-- Grant permissions
GRANT ALL ON public.partners TO authenticated;
GRANT SELECT ON public.partners TO anon;
GRANT USAGE, SELECT ON SEQUENCE partners_id_seq TO authenticated;

-- Create the partner_commissions_view
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
GRANT SELECT ON public.partner_commissions_view TO authenticated;
GRANT SELECT ON public.partner_commissions_view TO anon;

-- Insert sample data
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
) VALUES 
('Hacienda Bay', 'hacienda-bay', 'Palm Hills Developments', 'Sidi Abdel Rahman', 28116843, 'https://s3.eu-central-1.amazonaws.com/prod.images.cooingestate.com/admin/property_image/image/70192/WhatsApp_Image_2022-08-31_at_12.52.19_PM__4_.jpeg', '+20 10 1111 1111', 'Ahmed Hassan', 6.0, 5.5, 5.5, 4.0, 4.5, 4.8, 5.2, 4.6, 5.8),
('D-Bay', 'd-bay', 'Tatweer Misr', 'Al Dabaa', 43989000, 'https://s3.eu-central-1.amazonaws.com/prod.images.cooingestate.com/admin/property_image/image/382034/d-bay.png', '+20 10 2222 2222', 'Mohamed Ali', 5.5, 5.0, 5.0, 3.8, 4.0, 4.3, 4.7, 4.1, 5.3),
('La Vista Ras El Hekma', 'la-vista-ras-el-hekma', 'La Vista Developments', 'Ras El Hekma', 18800000, 'https://s3.eu-central-1.amazonaws.com/prod.images.cooingestate.com/admin/property_image/image/116917/11111111.png', '+20 10 3333 3333', 'Sara Ahmed', 5.0, 4.55, 4.5, 3.2, 3.5, 3.8, 4.2, 3.6, 4.8)
ON CONFLICT (compound_name) DO NOTHING;

-- Test the view
SELECT 'Partner commissions view created successfully!' as status;
SELECT compound_name, active_partners_count, highest_commission_rate FROM public.partner_commissions_view;
