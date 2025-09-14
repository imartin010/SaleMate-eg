-- COMPLETE DATABASE RESTORATION SCRIPT
-- This script restores the entire SaleMate database from current files and chat history
-- Run this in Supabase SQL Editor: https://supabase.com/dashboard/project/wkxbhvckmgrmdkdkhnqo/sql

-- ============================================================================
-- STEP 1: CREATE ENUMS
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

-- ============================================================================
-- STEP 2: DROP EXISTING TABLES (CASCADE TO HANDLE DEPENDENCIES)
-- ============================================================================

-- Drop views first
DROP VIEW IF EXISTS public.partner_commissions_view CASCADE;
DROP VIEW IF EXISTS public.lead_availability CASCADE;

-- Drop tables in reverse dependency order
DROP TABLE IF EXISTS public.lead_purchase_requests CASCADE;
DROP TABLE IF EXISTS public.leads CASCADE;
DROP TABLE IF EXISTS public.lead_batches CASCADE;
DROP TABLE IF EXISTS public.projects CASCADE;
DROP TABLE IF EXISTS public.partners CASCADE;
DROP TABLE IF EXISTS public.profiles CASCADE;
DROP TABLE IF EXISTS public."salemate-inventory" CASCADE;
DROP TABLE IF EXISTS public.brdata_properties CASCADE;

-- ============================================================================
-- STEP 3: CREATE PROFILES TABLE (AUTH SYSTEM)
-- ============================================================================

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

-- ============================================================================
-- STEP 4: CREATE PROJECTS TABLE
-- ============================================================================

CREATE TABLE public.projects (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  developer text NOT NULL,
  region text NOT NULL,
  description text,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- ============================================================================
-- STEP 5: CREATE LEAD BATCHES TABLE
-- ============================================================================

CREATE TABLE public.lead_batches (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id uuid NOT NULL REFERENCES public.projects(id),
  batch_name text NOT NULL,
  cpl numeric(10,2) NOT NULL,
  created_by uuid REFERENCES public.profiles(id),
  created_at timestamptz NOT NULL DEFAULT now()
);

-- ============================================================================
-- STEP 6: CREATE LEADS TABLE
-- ============================================================================

CREATE TABLE public.leads (
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

-- ============================================================================
-- STEP 7: CREATE LEAD PURCHASE REQUESTS TABLE
-- ============================================================================

CREATE TABLE public.lead_purchase_requests (
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

-- ============================================================================
-- STEP 8: CREATE PARTNERS TABLE
-- ============================================================================

CREATE TABLE public.partners (
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

-- ============================================================================
-- STEP 9: CREATE INVENTORY TABLE
-- ============================================================================

CREATE TABLE public."salemate-inventory" (
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

-- ============================================================================
-- STEP 10: CREATE INDEXES
-- ============================================================================

-- Leads indexes
CREATE INDEX idx_leads_project_unassigned ON public.leads(project_id) WHERE buyer_user_id IS NULL;
CREATE INDEX idx_leads_buyer ON public.leads(buyer_user_id);
CREATE INDEX idx_leads_project_id ON public.leads(project_id);

-- Purchase requests indexes
CREATE INDEX idx_purchase_requests_status ON public.lead_purchase_requests(status);
CREATE INDEX idx_purchase_requests_buyer ON public.lead_purchase_requests(buyer_user_id);

-- Inventory indexes
CREATE INDEX IF NOT EXISTS idx_salemate_inventory_compound ON public."salemate-inventory" USING gin (compound);
CREATE INDEX IF NOT EXISTS idx_salemate_inventory_area ON public."salemate-inventory" USING gin (area);
CREATE INDEX IF NOT EXISTS idx_salemate_inventory_developer ON public."salemate-inventory" USING gin (developer);
CREATE INDEX IF NOT EXISTS idx_salemate_inventory_property_type ON public."salemate-inventory" USING gin (property_type);
CREATE INDEX IF NOT EXISTS idx_salemate_inventory_price ON public."salemate-inventory" (price_in_egp);
CREATE INDEX IF NOT EXISTS idx_salemate_inventory_bedrooms ON public."salemate-inventory" (number_of_bedrooms);
CREATE INDEX IF NOT EXISTS idx_salemate_inventory_unit_area ON public."salemate-inventory" (unit_area);

-- ============================================================================
-- STEP 11: CREATE VIEWS
-- ============================================================================

-- Lead availability view
CREATE OR REPLACE VIEW public.lead_availability AS
SELECT
  p.id AS project_id,
  p.name,
  p.developer,
  p.region,
  p.description,
  COUNT(l.*) FILTER (WHERE l.buyer_user_id IS NULL) AS available_leads,
  COALESCE(MAX(b.cpl), 25.00) as current_cpl
FROM public.projects p
LEFT JOIN public.leads l ON l.project_id = p.id
LEFT JOIN public.lead_batches b ON b.project_id = p.id
GROUP BY p.id, p.name, p.developer, p.region, p.description;

-- Partner commissions view
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

-- ============================================================================
-- STEP 12: ENABLE ROW LEVEL SECURITY
-- ============================================================================

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.lead_batches ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.leads ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.lead_purchase_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.partners ENABLE ROW LEVEL SECURITY;
ALTER TABLE public."salemate-inventory" ENABLE ROW LEVEL SECURITY;

-- ============================================================================
-- STEP 13: CREATE RLS POLICIES
-- ============================================================================

-- Profiles policies
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

-- Projects policies
CREATE POLICY projects_read ON public.projects
FOR SELECT USING (auth.role() IS NOT NULL);

CREATE POLICY projects_admin_all ON public.projects
FOR ALL USING (
  EXISTS(SELECT 1 FROM public.profiles me WHERE me.id=auth.uid() AND me.role IN ('admin','support'))
);

-- Leads policies
CREATE POLICY leads_read_mine ON public.leads
FOR SELECT USING (buyer_user_id = auth.uid());

CREATE POLICY leads_admin_all ON public.leads
FOR ALL USING (
  EXISTS(SELECT 1 FROM public.profiles me WHERE me.id=auth.uid() AND me.role IN ('admin','support'))
);

-- Lead batches policies
CREATE POLICY batches_admin_all ON public.lead_batches
FOR ALL USING (
  EXISTS(SELECT 1 FROM public.profiles me WHERE me.id=auth.uid() AND me.role IN ('admin','support'))
);

-- Purchase requests policies
CREATE POLICY pr_read_own ON public.lead_purchase_requests
FOR SELECT USING (
  buyer_user_id = auth.uid()
  OR EXISTS(SELECT 1 FROM public.profiles me WHERE me.id=auth.uid() AND me.role IN ('admin','support'))
);

CREATE POLICY pr_insert_own ON public.lead_purchase_requests
FOR INSERT WITH CHECK (buyer_user_id = auth.uid());

CREATE POLICY pr_update_admin ON public.lead_purchase_requests
FOR UPDATE USING (
  EXISTS(SELECT 1 FROM public.profiles me WHERE me.id=auth.uid() AND me.role IN ('admin','support'))
);

-- Partners policies
CREATE POLICY "Anyone can view partners" ON public.partners 
FOR SELECT USING (true);

-- Inventory policies
CREATE POLICY "Authenticated users can view inventory" ON public."salemate-inventory"
FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Admins can manage inventory" ON public."salemate-inventory"
FOR ALL USING (
  EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid()
    AND role IN ('admin', 'support', 'manager')
  )
);

-- ============================================================================
-- STEP 14: GRANT PERMISSIONS
-- ============================================================================

GRANT ALL ON public.profiles TO authenticated;
GRANT ALL ON public.projects TO authenticated;
GRANT ALL ON public.lead_batches TO authenticated;
GRANT ALL ON public.leads TO authenticated;
GRANT ALL ON public.lead_purchase_requests TO authenticated;
GRANT ALL ON public.partners TO authenticated;
GRANT ALL ON public."salemate-inventory" TO authenticated;
GRANT SELECT ON public.lead_availability TO authenticated;
GRANT SELECT ON public.partner_commissions_view TO authenticated;
GRANT SELECT ON public.partner_commissions_view TO anon;
GRANT SELECT ON public.partners TO anon;
GRANT USAGE, SELECT ON SEQUENCE partners_id_seq TO authenticated;

-- ============================================================================
-- STEP 15: CREATE FUNCTIONS
-- ============================================================================

-- Profile creation trigger
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  INSERT INTO public.profiles (id, email, name, role)
  VALUES (
    NEW.id, 
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'name', SPLIT_PART(NEW.email, '@', 1), 'User'),
    CASE 
        WHEN NEW.email ILIKE '%admin%' THEN 'admin'::user_role
        WHEN NEW.email ILIKE '%support%' THEN 'support'::user_role
        WHEN NEW.email ILIKE '%manager%' THEN 'manager'::user_role
        ELSE 'user'::user_role
    END
  )
  ON CONFLICT (id) DO UPDATE SET
    email = EXCLUDED.email,
    name = COALESCE(EXCLUDED.name, public.profiles.name, 'User'),
    updated_at = now();
  RETURN NEW;
END;
$$;

-- Team hierarchy function
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

-- Calculate order total
CREATE OR REPLACE FUNCTION public.rpc_calculate_order_total(p_project uuid, p_qty int)
RETURNS numeric
LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE v_cpl numeric(10,2);
BEGIN
  SELECT b.cpl INTO v_cpl
  FROM public.lead_batches b
  WHERE b.project_id = p_project
  ORDER BY b.created_at DESC
  LIMIT 1;
  IF v_cpl IS NULL THEN
    RAISE EXCEPTION 'No CPL configured for project %', p_project;
  END IF;
  RETURN v_cpl * p_qty;
END $$;

-- Start order function
CREATE OR REPLACE FUNCTION public.rpc_start_order(
  p_project uuid,
  p_qty int,
  p_payment public.payment_method,
  p_receipt_url text,
  p_receipt_name text DEFAULT NULL
) RETURNS uuid
LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
  v_total numeric;
  v_cpl numeric;
  v_req uuid;
BEGIN
  IF p_qty < 50 THEN RAISE EXCEPTION 'Minimum 50 leads per order'; END IF;

  SELECT rpc_calculate_order_total(p_project, p_qty) INTO v_total;
  SELECT b.cpl INTO v_cpl
  FROM public.lead_batches b
  WHERE b.project_id = p_project
  ORDER BY b.created_at DESC
  LIMIT 1;

  INSERT INTO public.lead_purchase_requests (
    buyer_user_id, project_id, number_of_leads, cpl_price, total_price,
    payment_method, receipt_file_url, receipt_file_name, status
  ) VALUES (
    auth.uid(), p_project, p_qty, v_cpl, v_total,
    p_payment, p_receipt_url, p_receipt_name, 'pending'
  ) RETURNING id INTO v_req;
  RETURN v_req;
END $$;

-- Approve order function
CREATE OR REPLACE FUNCTION public.rpc_approve_request(p_request uuid, p_admin_notes text DEFAULT NULL)
RETURNS TABLE(leads_assigned int) LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
  v_req record;
  v_count int := 0;
BEGIN
  -- only admin/support
  IF NOT EXISTS (SELECT 1 FROM public.profiles me WHERE me.id=auth.uid() AND me.role IN ('admin','support')) THEN
    RAISE EXCEPTION 'Not authorized';
  END IF;

  SELECT * INTO v_req FROM public.lead_purchase_requests WHERE id=p_request FOR UPDATE;
  IF v_req.status <> 'pending' THEN
    RAISE EXCEPTION 'Request is not pending';
  END IF;

  -- lock and assign exactly N available leads, oldest first
  WITH c AS (
    SELECT id FROM public.leads
    WHERE project_id = v_req.project_id AND buyer_user_id IS NULL
    ORDER BY created_at ASC
    LIMIT v_req.number_of_leads
    FOR UPDATE SKIP LOCKED
  )
  UPDATE public.leads l
  SET buyer_user_id = v_req.buyer_user_id, updated_at = now()
  FROM c WHERE l.id = c.id;
  
  GET DIAGNOSTICS v_count = ROW_COUNT;

  UPDATE public.lead_purchase_requests
  SET status='approved', admin_notes=p_admin_notes, approved_at=now()
  WHERE id=v_req.id;

  RETURN QUERY SELECT v_count;
END $$;

-- Reject request function
CREATE OR REPLACE FUNCTION public.rpc_reject_request(p_request uuid, p_admin_notes text DEFAULT NULL)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM public.profiles me WHERE me.id=auth.uid() AND me.role IN ('admin','support')) THEN
    RAISE EXCEPTION 'Not authorized';
  END IF;
  UPDATE public.lead_purchase_requests
  SET status='rejected', admin_notes=p_admin_notes, rejected_at=now()
  WHERE id=p_request AND status='pending';
END $$;

-- ============================================================================
-- STEP 16: CREATE TRIGGERS
-- ============================================================================

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
AFTER INSERT ON auth.users
FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();

-- ============================================================================
-- STEP 17: INSERT SAMPLE DATA
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
('cccccccc-cccc-cccc-cccc-cccccccccccc', 'Madinaty Heights', 'Talaat Moustafa Group', 'Madinaty', 'Exclusive residential project with luxury amenities'),
('dddddddd-dddd-dddd-dddd-dddddddddddd', 'Cairo Festival City', 'Al-Futtaim Group', 'New Cairo', 'Mixed-use development with residential and commercial'),
('eeeeeeee-eeee-eeee-eeee-eeeeeeeeeeee', 'Sheikh Zayed Gardens', 'SODIC', 'Sheikh Zayed', 'Premium residential project with modern architecture');

-- Create sample lead batch
INSERT INTO public.lead_batches (id, project_id, batch_name, cpl, created_by) VALUES
('11111111-1111-1111-1111-111111111111', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'Sample Batch 1', 25.00, '11111111-1111-1111-1111-111111111111');

-- Insert sample leads
INSERT INTO public.leads (project_id, batch_id, client_name, client_phone, client_email, stage) VALUES
('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', '11111111-1111-1111-1111-111111111111', 'Ahmed Mohamed', '+201234567890', 'ahmed@example.com', 'New Lead'),
('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', '11111111-1111-1111-1111-111111111111', 'Sara Hassan', '+201234567891', 'sara@example.com', 'New Lead'),
('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', '11111111-1111-1111-1111-111111111111', 'Mohamed Ali', '+201234567892', 'mohamed@example.com', 'New Lead'),
('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', '11111111-1111-1111-1111-111111111111', 'Fatima Omar', '+201234567893', 'fatima@example.com', 'New Lead'),
('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', '11111111-1111-1111-1111-111111111111', 'Khaled Ahmed', '+201234567894', 'khaled@example.com', 'New Lead');

-- Add more leads to reach 100+ for testing
INSERT INTO public.leads (project_id, batch_id, client_name, client_phone, client_email, stage)
SELECT 
  'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
  '11111111-1111-1111-1111-111111111111',
  'Client ' || generate_series(6, 100),
  '+2012345678' || LPAD(generate_series(6, 100)::text, 2, '0'),
  'client' || generate_series(6, 100) || '@example.com',
  'New Lead'::lead_stage
FROM generate_series(6, 100);

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
('La Vista Ras El Hekma', 'la-vista-ras-el-hekma', 'La Vista Developments', 'Ras El Hekma', 18800000, 'https://s3.eu-central-1.amazonaws.com/prod.images.cooingestate.com/admin/property_image/image/116917/11111111.png', '+20 10 3333 3333', 'Sara Ahmed', 5.0, 4.55, 4.5, 3.2, 3.5, 3.8, 4.2, 3.6, 4.8),
('El Masyaf', 'el-masyaf', 'M Squared', 'Ras El Hekma', 159083778, 'https://s3.eu-central-1.amazonaws.com/prod.images.cooingestate.com/admin/property_image/image/360451/MasyafWhatsApp_Image_2024-12-22_at_4.22.16_PM.jpeg', '+20 10 4444 4444', 'Khaled Omar', 6.0, 5.5, 5.5, 4.0, 4.5, 4.8, 5.2, 4.6, 5.8),
('Telal North Coast', 'telal-north-coast', 'Roya Developments', 'Sidi Abdel Rahman', 70463256, 'https://s3.eu-central-1.amazonaws.com/prod.images.cooingestate.com/admin/property_image/image/126036/pzC8qJJ2Ue5NP93pU1BmadHtIWn5Ay.jpg', '+20 10 5555 5555', 'Nour Hassan', 6.0, 5.5, 5.5, 4.0, 4.5, 4.8, 5.2, 4.6, 5.8),
('Marsa Baghush', 'marsa-baghush', 'Shehab Mazhar', 'Sidi Heneish', 35720400, 'https://s3.eu-central-1.amazonaws.com/prod.images.cooingestate.com/admin/property_image/image/333829/Marsa_Baghushmarsa_baghushmarsa_bagh.png', '+20 10 6666 6666', 'Amr Farouk', 5.5, 5.0, 5.0, 3.8, 4.0, 4.3, 4.7, 4.1, 5.3),
('Lagoona - La Vista Ras El Hekma', 'lagoona-la-vista-ras-el-hekma', 'La Vista Developments', 'Ras El Hekma', 13580000, 'https://s3.eu-central-1.amazonaws.com/prod.images.cooingestate.com/admin/property_image/image/53516/in.PNG', '+20 10 7777 7777', 'Yasmin Adel', 5.0, 4.55, 4.5, 3.2, 3.5, 3.8, 4.2, 3.6, 4.8);

-- ============================================================================
-- STEP 18: VERIFICATION
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
SELECT 'partners', COUNT(*) FROM public.partners
UNION ALL
SELECT 'salemate-inventory', COUNT(*) FROM public."salemate-inventory";

-- Show lead availability
SELECT * FROM public.lead_availability ORDER BY available_leads DESC;

-- Show partner commissions view
SELECT compound_name, active_partners_count, highest_commission_rate FROM public.partner_commissions_view;

-- Show profiles by role
SELECT role, COUNT(*) as count FROM public.profiles GROUP BY role ORDER BY count DESC;
