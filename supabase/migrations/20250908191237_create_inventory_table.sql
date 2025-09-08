-- Create the sale_mate_inventory table for real estate property inventory
-- This table stores all property listings with detailed information

-- Note: Using sale_mate_inventory (with underscores) instead of "salemate-inventory" (with hyphens and quotes)
-- for better compatibility and to avoid quoting issues

CREATE TABLE IF NOT EXISTS public.sale_mate_inventory (
  id INTEGER PRIMARY KEY,
  unit_id TEXT,
  original_unit_id TEXT,
  sale_type TEXT,
  unit_number TEXT,
  unit_area NUMERIC,
  number_of_bedrooms INTEGER,
  number_of_bathrooms INTEGER,
  ready_by DATE,
  finishing TEXT,
  garden_area NUMERIC,
  roof_area NUMERIC,
  floor_number NUMERIC,
  building_number TEXT,
  price_per_meter NUMERIC,
  price_in_egp NUMERIC,
  last_inventory_update DATE,
  currency TEXT DEFAULT 'EGP',
  payment_plans TEXT,
  image TEXT,
  offers TEXT,
  is_launch BOOLEAN DEFAULT false,
  compound JSONB,
  area JSONB,
  developer JSONB,
  phase JSONB,
  property_type JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_sale_mate_inventory_compound ON public.sale_mate_inventory USING gin (compound);
CREATE INDEX IF NOT EXISTS idx_sale_mate_inventory_area ON public.sale_mate_inventory USING gin (area);
CREATE INDEX IF NOT EXISTS idx_sale_mate_inventory_developer ON public.sale_mate_inventory USING gin (developer);
CREATE INDEX IF NOT EXISTS idx_sale_mate_inventory_property_type ON public.sale_mate_inventory USING gin (property_type);
CREATE INDEX IF NOT EXISTS idx_sale_mate_inventory_price ON public.sale_mate_inventory (price_in_egp);
CREATE INDEX IF NOT EXISTS idx_sale_mate_inventory_bedrooms ON public.sale_mate_inventory (number_of_bedrooms);
CREATE INDEX IF NOT EXISTS idx_sale_mate_inventory_unit_area ON public.sale_mate_inventory (unit_area);
CREATE INDEX IF NOT EXISTS idx_sale_mate_inventory_unit_id ON public.sale_mate_inventory (unit_id);
CREATE INDEX IF NOT EXISTS idx_sale_mate_inventory_sale_type ON public.sale_mate_inventory (sale_type);

-- Set up Row Level Security (RLS)
ALTER TABLE public.sale_mate_inventory ENABLE ROW LEVEL SECURITY;

-- Allow authenticated users to read all inventory
CREATE POLICY "Authenticated users can view inventory" ON public.sale_mate_inventory
    FOR SELECT USING (auth.role() = 'authenticated');

-- Allow admins and support to manage inventory
CREATE POLICY "Admins can manage inventory" ON public.sale_mate_inventory
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM public.profiles 
            WHERE id = auth.uid() 
            AND role IN ('admin', 'support', 'manager')
        )
    );

-- Grant permissions
GRANT ALL ON public.sale_mate_inventory TO authenticated;
GRANT SELECT ON public.sale_mate_inventory TO anon;

-- Create trigger for updated_at timestamp
CREATE TRIGGER update_sale_mate_inventory_updated_at 
    BEFORE UPDATE ON public.sale_mate_inventory 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Add comment for documentation
COMMENT ON TABLE public.sale_mate_inventory IS 'Real estate property inventory with detailed property information including pricing, location, and specifications';
