-- STEP-BY-STEP DATABASE RESTORATION
-- Run this in Supabase SQL Editor to restore the database step by step

-- ============================================================================
-- STEP 1: CREATE ENUMS FIRST
-- ============================================================================

DO $$ BEGIN
  -- User roles
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname='user_role') THEN
    CREATE TYPE public.user_role AS ENUM ('admin','manager','support','user');
  END IF;
  
  -- Payment methods
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname='payment_method') THEN
    CREATE TYPE public.payment_method AS ENUM ('Instapay','VodafoneCash','BankTransfer');
  END IF;
  
  -- Order status
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname='order_status') THEN
    CREATE TYPE public.order_status AS ENUM ('pending','approved','rejected');
  END IF;
  
  -- Lead stages
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname='lead_stage') THEN
    CREATE TYPE public.lead_stage AS ENUM ('New Lead','Potential','Hot Case','Meeting Done','No Answer','Call Back','Whatsapp','Wrong Number','Non Potential');
  END IF;
  
  -- Platform types
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname='platform_type') THEN
    CREATE TYPE public.platform_type AS ENUM ('Facebook','Google','TikTok','Other');
  END IF;
END $$;

SELECT 'Step 1: Enums created successfully' as status;

-- ============================================================================
-- STEP 2: CREATE PROFILES TABLE (CORE DEPENDENCY)
-- ============================================================================

-- Drop if exists
DROP TABLE IF EXISTS public.profiles CASCADE;

-- Create profiles table
CREATE TABLE public.profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  name text, -- Allow null names
  email text,
  phone text,
  role public.user_role NOT NULL DEFAULT 'user',
  manager_id uuid REFERENCES public.profiles(id),
  is_banned boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Create indexes for profiles
CREATE INDEX IF NOT EXISTS idx_profiles_manager ON public.profiles(manager_id);
CREATE INDEX IF NOT EXISTS idx_profiles_role ON public.profiles(role);
CREATE INDEX IF NOT EXISTS idx_profiles_email ON public.profiles(email);

-- Enable RLS
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for profiles
CREATE POLICY profiles_read_access
ON public.profiles FOR SELECT
USING (
  auth.uid() = id
  OR EXISTS (SELECT 1 FROM public.profiles me WHERE me.id = auth.uid() AND me.role IN ('admin','support'))
  OR id IN (SELECT user_id FROM public.rpc_team_user_ids(auth.uid()))
);

CREATE POLICY profiles_update_self
ON public.profiles FOR UPDATE
USING (auth.uid() = id);

CREATE POLICY profiles_insert_self
ON public.profiles FOR INSERT
WITH CHECK (auth.uid() = id);

-- Grant permissions
GRANT ALL ON public.profiles TO authenticated;

SELECT 'Step 2: Profiles table created successfully' as status;

-- ============================================================================
-- STEP 3: CREATE OTHER CORE TABLES
-- ============================================================================

-- Create projects table
CREATE TABLE IF NOT EXISTS public.projects (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  developer text NOT NULL,
  region text NOT NULL,
  description text,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Create lead batches table
CREATE TABLE IF NOT EXISTS public.lead_batches (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id uuid NOT NULL REFERENCES public.projects(id),
  batch_name text NOT NULL,
  cpl numeric(10,2) NOT NULL,
  created_by uuid REFERENCES public.profiles(id),
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Create leads table
CREATE TABLE IF NOT EXISTS public.leads (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id uuid NOT NULL REFERENCES public.projects(id),
  batch_id uuid NOT NULL REFERENCES public.lead_batches(id),
  buyer_user_id uuid REFERENCES public.profiles(id), -- null until purchased
  client_name text NOT NULL,
  client_phone text NOT NULL,
  client_phone2 text,
  client_phone3 text,
  client_email text,
  client_job_title text,
  stage public.lead_stage NOT NULL DEFAULT 'New Lead',
  source text,
  feedback text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Create lead purchase requests table
CREATE TABLE IF NOT EXISTS public.lead_purchase_requests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  buyer_user_id uuid NOT NULL REFERENCES public.profiles(id),
  project_id uuid NOT NULL REFERENCES public.projects(id),
  number_of_leads int NOT NULL CHECK (number_of_leads >= 50),
  cpl_price numeric(10,2) NOT NULL,
  total_price numeric(12,2) NOT NULL,
  payment_method public.payment_method NOT NULL,
  receipt_file_url text NOT NULL,
  receipt_file_name text,
  status public.order_status NOT NULL DEFAULT 'pending',
  admin_notes text,
  approved_at timestamptz,
  rejected_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Create partners table
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

SELECT 'Step 3: Core tables created successfully' as status;

-- ============================================================================
-- STEP 4: CREATE FUNCTIONS
-- ============================================================================

-- Create rpc_team_user_ids function
CREATE OR REPLACE FUNCTION public.rpc_team_user_ids(root_user_id uuid)
RETURNS TABLE(user_id uuid)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  WITH RECURSIVE team_tree AS (
    -- Base case: the root user
    SELECT id FROM public.profiles WHERE id = root_user_id
    UNION ALL
    -- Recursive case: users managed by someone in the tree
    SELECT p.id 
    FROM public.profiles p
    INNER JOIN team_tree tt ON p.manager_id = tt.id
  )
  SELECT tt.id FROM team_tree tt;
END;
$$;

-- Grant execute permission
GRANT EXECUTE ON FUNCTION public.rpc_team_user_ids(uuid) TO authenticated;

SELECT 'Step 4: Functions created successfully' as status;

-- ============================================================================
-- STEP 5: CREATE VIEWS
-- ============================================================================

-- Create partner commissions view
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

-- Grant permissions to views
GRANT SELECT ON public.partner_commissions_view TO authenticated;
GRANT SELECT ON public.partner_commissions_view TO anon;

SELECT 'Step 5: Views created successfully' as status;

-- ============================================================================
-- STEP 6: INSERT SAMPLE DATA
-- ============================================================================

-- Insert default admin profiles
INSERT INTO public.profiles (id, email, name, role, created_at, updated_at)
VALUES 
    ('11111111-1111-1111-1111-111111111111', 'admin@salemate.com', 'Admin User', 'admin'::user_role, NOW(), NOW()),
    ('22222222-2222-2222-2222-222222222222', 'support@salemate.com', 'Support Team', 'support'::user_role, NOW(), NOW()),
    ('33333333-3333-3333-3333-333333333333', 'themartining@gmail.com', 'Mohamed Abdelraheem', 'admin'::user_role, NOW(), NOW())
ON CONFLICT (id) DO UPDATE SET
    role = EXCLUDED.role,
    updated_at = NOW();

-- Insert sample projects
INSERT INTO public.projects (id, name, developer, region, description) VALUES
('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'New Capital Towers', 'Emaar Properties', 'New Capital', 'Luxury residential towers in the New Administrative Capital'),
('bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', 'Palm Hills West', 'Palm Hills Development', '6th of October', 'Modern residential community with green spaces'),
('cccccccc-cccc-cccc-cccc-cccccccccccc', 'Madinaty Heights', 'Talaat Moustafa Group', 'Madinaty', 'Exclusive residential project with luxury amenities')
ON CONFLICT (id) DO NOTHING;

-- Insert sample partners
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

SELECT 'Step 6: Sample data inserted successfully' as status;

-- ============================================================================
-- STEP 7: VERIFICATION
-- ============================================================================

SELECT 'Database restoration completed successfully!' as status;

-- Show table counts
SELECT 
  'profiles' as table_name, COUNT(*) as count FROM public.profiles
UNION ALL
SELECT 'projects', COUNT(*) FROM public.projects
UNION ALL
SELECT 'leads', COUNT(*) FROM public.leads
UNION ALL
SELECT 'lead_batches', COUNT(*) FROM public.lead_batches
UNION ALL
SELECT 'lead_purchase_requests', COUNT(*) FROM public.lead_purchase_requests
UNION ALL
SELECT 'partners', COUNT(*) FROM public.partners;

-- Show partner commissions view
SELECT compound_name, active_partners_count, highest_commission_rate FROM public.partner_commissions_view;

-- Show profiles by role
SELECT role, COUNT(*) as count FROM public.profiles GROUP BY role ORDER BY count DESC;
