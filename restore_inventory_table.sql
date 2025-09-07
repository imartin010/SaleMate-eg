-- URGENT: Restore the salemate-inventory table that was accidentally deleted
-- Based on the structure found in the codebase

-- Create the salemate-inventory table
CREATE TABLE IF NOT EXISTS public."salemate-inventory" (
  id integer PRIMARY KEY,
  unit_id text,
  original_unit_id text,
  sale_type text,
  unit_number text,
  unit_area numeric,
  number_of_bedrooms integer,
  number_of_bathrooms integer,
  ready_by date,
  finishing text,
  garden_area numeric,
  roof_area numeric,
  floor_number numeric,
  building_number text,
  price_per_meter numeric,
  price_in_egp numeric,
  last_inventory_update date,
  currency text DEFAULT 'EGP',
  payment_plans text,
  image text,
  offers text,
  is_launch boolean DEFAULT false,
  compound jsonb,
  area jsonb,
  developer jsonb,
  phase jsonb,
  property_type jsonb,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_salemate_inventory_compound ON public."salemate-inventory" USING gin (compound);
CREATE INDEX IF NOT EXISTS idx_salemate_inventory_area ON public."salemate-inventory" USING gin (area);
CREATE INDEX IF NOT EXISTS idx_salemate_inventory_developer ON public."salemate-inventory" USING gin (developer);
CREATE INDEX IF NOT EXISTS idx_salemate_inventory_property_type ON public."salemate-inventory" USING gin (property_type);
CREATE INDEX IF NOT EXISTS idx_salemate_inventory_price ON public."salemate-inventory" (price_in_egp);
CREATE INDEX IF NOT EXISTS idx_salemate_inventory_bedrooms ON public."salemate-inventory" (number_of_bedrooms);
CREATE INDEX IF NOT EXISTS idx_salemate_inventory_unit_area ON public."salemate-inventory" (unit_area);

-- Set up RLS (Row Level Security) - allow all operations for authenticated users
ALTER TABLE public."salemate-inventory" ENABLE ROW LEVEL SECURITY;

-- Allow authenticated users to read all inventory
CREATE POLICY "Authenticated users can view inventory" ON public."salemate-inventory"
    FOR SELECT USING (auth.role() = 'authenticated');

-- Allow admins to manage inventory
CREATE POLICY "Admins can manage inventory" ON public."salemate-inventory"
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM public.profiles 
            WHERE id = auth.uid() 
            AND role IN ('admin', 'manager')
        )
    );

-- Grant permissions
GRANT ALL ON public."salemate-inventory" TO authenticated;
GRANT SELECT ON public."salemate-inventory" TO anon;

-- Add a trigger for updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_salemate_inventory_updated_at 
    BEFORE UPDATE ON public."salemate-inventory" 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Success message
SELECT 'salemate-inventory table restored successfully' as status;


