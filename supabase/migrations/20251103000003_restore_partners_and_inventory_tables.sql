-- ============================================
-- RESTORE PARTNERS AND INVENTORY TABLES
-- ============================================
-- These tables are needed for /app/partners and /app/inventory pages
-- ============================================

-- STEP 1: Recreate project_partner_commissions table
-- ============================================

CREATE TABLE IF NOT EXISTS public.project_partner_commissions (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    project_id uuid NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
    partner_id uuid NOT NULL REFERENCES public.partners(id) ON DELETE CASCADE,
    commission_rate numeric(5,2) NOT NULL CHECK (commission_rate >= 0 AND commission_rate <= 100),
    is_active boolean NOT NULL DEFAULT true,
    created_at timestamptz NOT NULL DEFAULT now(),
    updated_at timestamptz NOT NULL DEFAULT now(),
    UNIQUE(project_id, partner_id)
);

CREATE INDEX IF NOT EXISTS idx_project_partner_commissions_project_id ON public.project_partner_commissions(project_id);
CREATE INDEX IF NOT EXISTS idx_project_partner_commissions_partner_id ON public.project_partner_commissions(partner_id);
CREATE INDEX IF NOT EXISTS idx_project_partner_commissions_is_active ON public.project_partner_commissions(is_active);

-- Enable RLS
ALTER TABLE public.project_partner_commissions ENABLE ROW LEVEL SECURITY;

-- RLS Policies for project_partner_commissions
DROP POLICY IF EXISTS "Anyone can view project partner commissions" ON public.project_partner_commissions;
CREATE POLICY "Anyone can view project partner commissions"
    ON public.project_partner_commissions
    FOR SELECT
    USING (true);

DROP POLICY IF EXISTS "Only admins can manage project partner commissions" ON public.project_partner_commissions;
CREATE POLICY "Only admins can manage project partner commissions"
    ON public.project_partner_commissions
    FOR ALL
    USING (
        EXISTS (
            SELECT 1 FROM public.profiles
            WHERE profiles.id = auth.uid()
            AND profiles.role = 'admin'
        )
    );

-- STEP 2: Recreate salemate-inventory table
-- ============================================

CREATE TABLE IF NOT EXISTS public."salemate-inventory" (
    id bigserial PRIMARY KEY,
    unit_id text,
    unit_number text,
    building_number text,
    compound text,
    developer text,
    area text,
    property_type text,
    number_of_bedrooms integer,
    number_of_bathrooms integer,
    unit_area numeric(10,2),
    price_in_egp numeric(15,2),
    price_per_meter numeric(10,2),
    currency text DEFAULT 'EGP',
    finishing text,
    sale_type text,
    is_launch boolean DEFAULT false,
    ready_by text,
    floor_number integer,
    garden_area numeric(10,2),
    roof_area numeric(10,2),
    phase text,
    payment_plans text,
    offers text,
    image text,
    original_unit_id text,
    last_inventory_update timestamptz,
    created_at timestamptz NOT NULL DEFAULT now(),
    updated_at timestamptz NOT NULL DEFAULT now()
);

-- Create indexes for common queries
CREATE INDEX IF NOT EXISTS idx_salemate_inventory_compound ON public."salemate-inventory"(compound);
CREATE INDEX IF NOT EXISTS idx_salemate_inventory_developer ON public."salemate-inventory"(developer);
CREATE INDEX IF NOT EXISTS idx_salemate_inventory_area ON public."salemate-inventory"(area);
CREATE INDEX IF NOT EXISTS idx_salemate_inventory_property_type ON public."salemate-inventory"(property_type);
CREATE INDEX IF NOT EXISTS idx_salemate_inventory_price ON public."salemate-inventory"(price_in_egp);
CREATE INDEX IF NOT EXISTS idx_salemate_inventory_unit_id ON public."salemate-inventory"(unit_id);

-- Enable RLS
ALTER TABLE public."salemate-inventory" ENABLE ROW LEVEL SECURITY;

-- RLS Policies for salemate-inventory
DROP POLICY IF EXISTS "Anyone can view inventory" ON public."salemate-inventory";
CREATE POLICY "Anyone can view inventory"
    ON public."salemate-inventory"
    FOR SELECT
    USING (true);

DROP POLICY IF EXISTS "Only admins can manage inventory" ON public."salemate-inventory";
CREATE POLICY "Only admins can manage inventory"
    ON public."salemate-inventory"
    FOR ALL
    USING (
        EXISTS (
            SELECT 1 FROM public.profiles
            WHERE profiles.id = auth.uid()
            AND profiles.role = 'admin'
        )
    );

-- Log success
DO $$
BEGIN
  RAISE NOTICE '✅ Restored tables: project_partner_commissions, salemate-inventory';
END $$;

