-- Fetch ALL compounds from salemate-inventory table and populate partners table
-- This will extract every unique compound and create partner commission data

-- Create the partners table if it doesn't exist
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

-- Enable RLS and permissions
ALTER TABLE public.partners ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Anyone can view partners" ON public.partners;
CREATE POLICY "Anyone can view partners" ON public.partners FOR SELECT USING (true);
GRANT ALL ON public.partners TO authenticated;
GRANT SELECT ON public.partners TO anon;
GRANT USAGE, SELECT ON SEQUENCE partners_id_seq TO authenticated;

-- Clear existing data
TRUNCATE public.partners RESTART IDENTITY;

-- Insert ALL unique compounds from salemate-inventory
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
WITH compound_data AS (
  SELECT 
    -- Extract compound name from JSON
    CASE 
      WHEN compound LIKE '{"id": %, "name": "%"}' THEN 
        SPLIT_PART(SPLIT_PART(compound, '"name": "', 2), '"', 1)
      WHEN compound LIKE '{''id'': %, ''name'': ''%''}' THEN
        SPLIT_PART(SPLIT_PART(compound, '''name'': ''', 2), '''', 1)
      ELSE 'Unknown Compound'
    END as compound_name,
    
    -- Extract developer name from JSON  
    CASE 
      WHEN developer LIKE '{"id": %, "name": "%"}' THEN 
        SPLIT_PART(SPLIT_PART(developer, '"name": "', 2), '"', 1)
      WHEN developer LIKE '{''id'': %, ''name'': ''%''}' THEN
        SPLIT_PART(SPLIT_PART(developer, '''name'': ''', 2), '''', 1)
      ELSE 'Unknown Developer'
    END as developer_name,
    
    -- Extract area name from JSON
    CASE 
      WHEN area LIKE '{"id": %, "name": "%"}' THEN 
        SPLIT_PART(SPLIT_PART(area, '"name": "', 2), '"', 1)
      WHEN area LIKE '{''id'': %, ''name'': ''%''}' THEN
        SPLIT_PART(SPLIT_PART(area, '''name'': ''', 2), '''', 1)
      ELSE 'Unknown Area'
    END as area_name,
    
    price_in_egp,
    image,
    ROW_NUMBER() OVER (ORDER BY compound) as row_num
    
  FROM public."salemate-inventory"
  WHERE compound IS NOT NULL 
    AND compound != '' 
    AND compound != 'null'
),

unique_compounds AS (
  SELECT 
    compound_name,
    LOWER(REPLACE(compound_name, ' ', '-')) as compound_id,
    developer_name,
    area_name,
    MIN(price_in_egp) as starting_price,
    (ARRAY_AGG(image ORDER BY row_num))[1] as image_url,
    ROW_NUMBER() OVER (ORDER BY compound_name) as rn
  FROM compound_data
  WHERE compound_name != 'Unknown Compound'
  GROUP BY compound_name, developer_name, area_name
)

SELECT 
    compound_name,
    compound_id,
    developer_name as developer,
    area_name as area,
    starting_price,
    image_url,
    -- Generate unique phone numbers
    '+20 10 ' || LPAD(rn::text, 4, '0') || ' ' || LPAD((rn * 11)::text, 4, '0') as phone_number,
    -- Rotate through sales person names
    CASE 
        WHEN rn % 8 = 1 THEN 'Ahmed Hassan'
        WHEN rn % 8 = 2 THEN 'Mohamed Ali'
        WHEN rn % 8 = 3 THEN 'Sara Ahmed'
        WHEN rn % 8 = 4 THEN 'Khaled Omar'
        WHEN rn % 8 = 5 THEN 'Nour Hassan'
        WHEN rn % 8 = 6 THEN 'Amr Farouk'
        WHEN rn % 8 = 7 THEN 'Yasmin Adel'
        ELSE 'Omar Mahmoud'
    END as developer_sales_name,
    
    -- Commission rates based on price tiers
    CASE 
        WHEN starting_price > 80000000 THEN 6.0
        WHEN starting_price > 50000000 THEN 5.5  
        WHEN starting_price > 30000000 THEN 5.2
        ELSE 5.0
    END as salemate_commission,
    
    CASE 
        WHEN starting_price > 80000000 THEN 5.5
        WHEN starting_price > 50000000 THEN 5.0
        WHEN starting_price > 30000000 THEN 4.8
        ELSE 4.55
    END as address_investments_commission,
    
    CASE 
        WHEN starting_price > 80000000 THEN 5.5
        WHEN starting_price > 50000000 THEN 5.0
        WHEN starting_price > 30000000 THEN 4.7
        ELSE 4.5
    END as bold_routes_commission,
    
    CASE 
        WHEN starting_price > 80000000 THEN 4.0
        WHEN starting_price > 50000000 THEN 3.8
        WHEN starting_price > 30000000 THEN 3.5
        ELSE 3.2
    END as nawy_partners_commission,
    
    CASE 
        WHEN starting_price > 80000000 THEN 4.5
        WHEN starting_price > 50000000 THEN 4.0
        WHEN starting_price > 30000000 THEN 3.8
        ELSE 3.5
    END as coldwell_banker_commission,
    
    CASE 
        WHEN starting_price > 80000000 THEN 4.8
        WHEN starting_price > 50000000 THEN 4.3
        WHEN starting_price > 30000000 THEN 4.0
        ELSE 3.8
    END as connect_homes_commission,
    
    CASE 
        WHEN starting_price > 80000000 THEN 5.2
        WHEN starting_price > 50000000 THEN 4.7
        WHEN starting_price > 30000000 THEN 4.4
        ELSE 4.2
    END as view_investments_commission,
    
    CASE 
        WHEN starting_price > 80000000 THEN 4.6
        WHEN starting_price > 50000000 THEN 4.1
        WHEN starting_price > 30000000 THEN 3.8
        ELSE 3.6
    END as y_network_commission,
    
    CASE 
        WHEN starting_price > 80000000 THEN 5.8
        WHEN starting_price > 50000000 THEN 5.3
        WHEN starting_price > 30000000 THEN 5.0
        ELSE 4.8
    END as byit_commission

FROM unique_compounds
ORDER BY compound_name;

-- Create the view
CREATE OR REPLACE VIEW partner_commissions_view AS
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

GRANT SELECT ON partner_commissions_view TO authenticated, anon;

-- Show results
SELECT 'All compounds fetched and populated successfully' as status;
SELECT COUNT(*) as total_compounds_created FROM public.partners;




