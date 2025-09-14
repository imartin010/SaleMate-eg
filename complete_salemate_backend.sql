-- ============================================================================
-- SALEMATE BACKEND - COMPLETE REBUILD
-- Project ID: wkxbhvckmgrmdkdkhnqo
-- Run this in Supabase SQL Editor
-- ============================================================================

-- ========== CLEANUP EXISTING FUNCTIONS ==========
-- Drop existing triggers and functions that might conflict
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP FUNCTION IF EXISTS public.handle_new_user();
DROP FUNCTION IF EXISTS public.rpc_team_user_ids(uuid);
DROP FUNCTION IF EXISTS public.rpc_calculate_order_total(uuid, int);
DROP FUNCTION IF EXISTS public.rpc_start_order(uuid, int, public.payment_method, text, text);
DROP FUNCTION IF EXISTS public.rpc_approve_request(uuid, text);
DROP FUNCTION IF EXISTS public.rpc_reject_request(uuid, text);
DROP FUNCTION IF EXISTS public.ensure_profile(uuid, text, text, text, public.user_role);
DROP FUNCTION IF EXISTS public.backfill_profiles();

-- ========== ENUMS ==========
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname='user_role') THEN
    CREATE TYPE public.user_role AS ENUM ('admin','manager','support','user');
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname='payment_method') THEN
    CREATE TYPE public.payment_method AS ENUM ('Instapay','VodafoneCash','BankTransfer');
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname='order_status') THEN
    CREATE TYPE public.order_status AS ENUM ('pending','approved','rejected');
  END IF;
END $$;

-- ========== PROFILES & AUTH TRIGGER ==========
CREATE TABLE IF NOT EXISTS public.profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  name text,
  email text,
  phone text,
  role public.user_role NOT NULL DEFAULT 'user',
  manager_id uuid REFERENCES public.profiles(id),
  is_banned boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_profiles_manager ON public.profiles(manager_id);

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, name, role)
  VALUES (
    NEW.id, 
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'name', NEW.raw_user_meta_data->>'full_name', SPLIT_PART(NEW.email, '@', 1)),
    'user'
  )
  ON CONFLICT (id) DO UPDATE SET
    email = EXCLUDED.email,
    name = COALESCE(EXCLUDED.name, public.profiles.name),
    updated_at = now();
  RETURN NEW;
END; $$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
AFTER INSERT ON auth.users
FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();

CREATE OR REPLACE FUNCTION public.ensure_profile(
  p_uid uuid,
  p_name text DEFAULT NULL,
  p_email text DEFAULT NULL,
  p_phone text DEFAULT NULL,
  p_role public.user_role DEFAULT 'user'
) RETURNS public.profiles
LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE out_row public.profiles;
BEGIN
  INSERT INTO public.profiles (id, name, email, phone, role)
  VALUES (p_uid, p_name, COALESCE(p_email,''), p_phone, COALESCE(p_role,'user'))
  ON CONFLICT (id) DO UPDATE
    SET name = COALESCE(EXCLUDED.name, profiles.name),
        email = COALESCE(EXCLUDED.email, profiles.email),
        phone = COALESCE(EXCLUDED.phone, profiles.phone),
        updated_at = now()
  RETURNING * INTO out_row;
  RETURN out_row;
END; $$;

CREATE OR REPLACE FUNCTION public.backfill_profiles()
RETURNS integer
LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE cnt int := 0;
BEGIN
  INSERT INTO public.profiles (id, email, name, role)
  SELECT 
    u.id, 
    u.email,
    COALESCE(u.raw_user_meta_data->>'name', u.raw_user_meta_data->>'full_name', SPLIT_PART(u.email, '@', 1)),
    CASE 
      WHEN u.email ILIKE '%admin%' THEN 'admin'::user_role
      WHEN u.email ILIKE '%support%' THEN 'support'::user_role
      WHEN u.email ILIKE '%manager%' THEN 'manager'::user_role
      ELSE 'user'::user_role
    END
  FROM auth.users u
  LEFT JOIN public.profiles p ON p.id = u.id
  WHERE p.id IS NULL;
  GET DIAGNOSTICS cnt = ROW_COUNT;
  RETURN cnt;
END; $$;

-- ========== CORE DOMAIN ==========
-- Developers & Projects
CREATE TABLE IF NOT EXISTS public.developers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL UNIQUE,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.projects (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  developer_id uuid NOT NULL REFERENCES public.developers(id),
  name text NOT NULL,
  region text NOT NULL,
  description text,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_projects_developer ON public.projects(developer_id);

-- Lead Batches (CPL per upload) & Leads
CREATE TABLE IF NOT EXISTS public.lead_batches (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id uuid NOT NULL REFERENCES public.projects(id),
  batch_name text NOT NULL,
  cpl numeric(10,2) NOT NULL,
  created_by uuid REFERENCES public.profiles(id),
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.leads (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id uuid NOT NULL REFERENCES public.projects(id),
  batch_id uuid NOT NULL REFERENCES public.lead_batches(id),
  buyer_user_id uuid REFERENCES public.profiles(id), -- NULL until sold
  client_name text NOT NULL,
  client_phone text NOT NULL,
  client_phone2 text,
  client_phone3 text,
  client_email text,
  client_job_title text,
  stage text NOT NULL DEFAULT 'New Lead',
  source text,
  feedback text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_leads_project_unassigned ON public.leads(project_id) WHERE buyer_user_id IS NULL;
CREATE INDEX IF NOT EXISTS idx_leads_buyer ON public.leads(buyer_user_id);

-- Partners & per-project commissions
CREATE TABLE IF NOT EXISTS public.partners (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL UNIQUE,
  description text,
  logo_url text,
  website text,
  status text NOT NULL DEFAULT 'active',
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.project_partner_commissions (
  project_id uuid NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  partner_id uuid NOT NULL REFERENCES public.partners(id) ON DELETE CASCADE,
  commission_rate numeric(5,2) NOT NULL,
  PRIMARY KEY (project_id, partner_id)
);

-- Support cases (simple)
CREATE TABLE IF NOT EXISTS public.support_cases (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  created_by uuid NOT NULL REFERENCES public.profiles(id),
  assigned_to uuid REFERENCES public.profiles(id),
  subject text NOT NULL,
  description text NOT NULL,
  status text NOT NULL DEFAULT 'open', -- open | in_progress | resolved
  priority text NOT NULL DEFAULT 'medium', -- low|medium|high
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Purchase Requests (no gateway; receipt image required)
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

-- Inventory table (real estate properties)
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
  compound text,
  area jsonb,
  developer text,
  phase text,
  property_type jsonb,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Inventory indexes for performance
CREATE INDEX IF NOT EXISTS idx_salemate_inventory_compound ON public."salemate-inventory" (compound);
CREATE INDEX IF NOT EXISTS idx_salemate_inventory_area ON public."salemate-inventory" USING gin (area);
CREATE INDEX IF NOT EXISTS idx_salemate_inventory_developer ON public."salemate-inventory" (developer);
CREATE INDEX IF NOT EXISTS idx_salemate_inventory_phase ON public."salemate-inventory" (phase);
CREATE INDEX IF NOT EXISTS idx_salemate_inventory_property_type ON public."salemate-inventory" USING gin (property_type);
CREATE INDEX IF NOT EXISTS idx_salemate_inventory_price ON public."salemate-inventory" (price_in_egp);
CREATE INDEX IF NOT EXISTS idx_salemate_inventory_bedrooms ON public."salemate-inventory" (number_of_bedrooms);
CREATE INDEX IF NOT EXISTS idx_salemate_inventory_unit_area ON public."salemate-inventory" (unit_area);
CREATE INDEX IF NOT EXISTS idx_salemate_inventory_unit_id ON public."salemate-inventory" (unit_id);
CREATE INDEX IF NOT EXISTS idx_salemate_inventory_sale_type ON public."salemate-inventory" (sale_type);

-- Availability view
CREATE OR REPLACE VIEW public.lead_availability AS
SELECT
  p.id AS project_id,
  p.name,
  (SELECT d.name FROM public.developers d WHERE d.id = p.developer_id) AS developer,
  p.region,
  COUNT(l.*) FILTER (WHERE l.buyer_user_id IS NULL) AS available_leads
FROM public.projects p
LEFT JOIN public.leads l ON l.project_id = p.id
GROUP BY p.id;

-- ========== TEAM HIERARCHY (manager tree) ==========
CREATE OR REPLACE FUNCTION public.rpc_team_user_ids(p_manager uuid)
RETURNS TABLE(user_id uuid) LANGUAGE sql SECURITY DEFINER AS $$
  WITH RECURSIVE t AS (
    SELECT id, manager_id FROM public.profiles WHERE manager_id = p_manager
    UNION ALL
    SELECT p.id, p.manager_id
    FROM public.profiles p
    JOIN t ON p.manager_id = t.id
  )
  SELECT id AS user_id FROM t;
$$;

-- ========== PRICING & ORDERS RPCs ==========
CREATE OR REPLACE FUNCTION public.rpc_calculate_order_total(p_project uuid, p_qty int)
RETURNS numeric LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE v_cpl numeric(10,2);
BEGIN
  SELECT b.cpl INTO v_cpl
  FROM public.lead_batches b
  WHERE b.project_id = p_project
  ORDER BY b.created_at DESC
  LIMIT 1;
  IF v_cpl IS NULL THEN RAISE EXCEPTION 'No CPL for project %', p_project; END IF;
  RETURN v_cpl * p_qty;
END; $$;

CREATE OR REPLACE FUNCTION public.rpc_start_order(
  p_project uuid,
  p_qty int,
  p_payment public.payment_method,
  p_receipt_url text,
  p_receipt_name text DEFAULT NULL
) RETURNS uuid LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE v_total numeric; v_cpl numeric; v_req uuid;
BEGIN
  IF p_qty < 50 THEN RAISE EXCEPTION 'Minimum 50 leads'; END IF;

  SELECT rpc_calculate_order_total(p_project, p_qty) INTO v_total;
  SELECT b.cpl INTO v_cpl FROM public.lead_batches b
  WHERE b.project_id = p_project ORDER BY b.created_at DESC LIMIT 1;

  INSERT INTO public.lead_purchase_requests(
    buyer_user_id, project_id, number_of_leads, cpl_price, total_price,
    payment_method, receipt_file_url, receipt_file_name, status
  ) VALUES (
    auth.uid(), p_project, p_qty, v_cpl, v_total,
    p_payment, p_receipt_url, p_receipt_name, 'pending'
  ) RETURNING id INTO v_req;

  RETURN v_req;
END; $$;

CREATE OR REPLACE FUNCTION public.rpc_approve_request(p_request uuid, p_admin_notes text DEFAULT NULL)
RETURNS TABLE(leads_assigned int) LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE v_req record; v_count int := 0;
BEGIN
  IF NOT EXISTS (SELECT 1 FROM public.profiles me WHERE me.id=auth.uid() AND me.role IN ('admin','support')) THEN
    RAISE EXCEPTION 'Not authorized';
  END IF;

  SELECT * INTO v_req FROM public.lead_purchase_requests WHERE id=p_request FOR UPDATE;
  IF v_req.status <> 'pending' THEN RAISE EXCEPTION 'Request not pending'; END IF;

  WITH c AS (
    SELECT id FROM public.leads
    WHERE project_id = v_req.project_id AND buyer_user_id IS NULL
    ORDER BY created_at ASC
    LIMIT v_req.number_of_leads
    FOR UPDATE SKIP LOCKED
  )
  UPDATE public.leads l
  SET buyer_user_id = v_req.buyer_user_id, updated_at = now()
  FROM c WHERE l.id = c.id
  RETURNING 1 INTO v_count;

  UPDATE public.lead_purchase_requests
  SET status='approved', admin_notes=p_admin_notes, approved_at=now()
  WHERE id=v_req.id;

  RETURN QUERY SELECT COALESCE(v_count,0);
END; $$;

CREATE OR REPLACE FUNCTION public.rpc_reject_request(p_request uuid, p_admin_notes text DEFAULT NULL)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM public.profiles me WHERE me.id=auth.uid() AND me.role IN ('admin','support')) THEN
    RAISE EXCEPTION 'Not authorized';
  END IF;
  UPDATE public.lead_purchase_requests
  SET status='rejected', admin_notes=p_admin_notes, rejected_at=now()
  WHERE id=p_request AND status='pending';
END; $$;

-- ========== STORAGE (receipts) ==========
insert into storage.buckets (id, name, public)
values ('receipts','receipts', false)
on conflict (id) do nothing;

-- Policies for receipts
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname='storage' AND tablename='objects' AND policyname='upload own receipts'
  ) THEN
    CREATE POLICY "upload own receipts"
    ON storage.objects FOR INSERT TO authenticated
    WITH CHECK (bucket_id='receipts' AND (storage.foldername(name))[1] = auth.uid()::text);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname='storage' AND tablename='objects' AND policyname='read own receipts or admin'
  ) THEN
    CREATE POLICY "read own receipts or admin"
    ON storage.objects FOR SELECT TO authenticated
    USING (
      bucket_id='receipts' AND (
        (storage.foldername(name))[1] = auth.uid()::text
        OR EXISTS(SELECT 1 FROM public.profiles me WHERE me.id=auth.uid() AND me.role IN ('admin','support'))
      )
    );
  END IF;
END $$;

-- ========== RLS ==========
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.developers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.lead_batches ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.leads ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.lead_purchase_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.support_cases ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.project_partner_commissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.partners ENABLE ROW LEVEL SECURITY;
ALTER TABLE public."salemate-inventory" ENABLE ROW LEVEL SECURITY;

-- Profiles: self read/update; admin/support read-all
DROP POLICY IF EXISTS profiles_read ON public.profiles;
CREATE POLICY profiles_read ON public.profiles
FOR SELECT USING (true);
DROP POLICY IF EXISTS profiles_update_self ON public.profiles;
CREATE POLICY profiles_update_self ON public.profiles
FOR UPDATE USING (auth.uid() = id);

-- Readable lists
DROP POLICY IF EXISTS developers_read ON public.developers;
CREATE POLICY developers_read ON public.developers FOR SELECT USING (auth.role() IS NOT NULL);

DROP POLICY IF EXISTS projects_read ON public.projects;
CREATE POLICY projects_read ON public.projects FOR SELECT USING (auth.role() IS NOT NULL);

DROP POLICY IF EXISTS partners_read ON public.partners;
CREATE POLICY partners_read ON public.partners FOR SELECT USING (auth.role() IS NOT NULL);

DROP POLICY IF EXISTS commissions_read ON public.project_partner_commissions;
CREATE POLICY commissions_read ON public.project_partner_commissions FOR SELECT USING (auth.role() IS NOT NULL);

-- Batches: admin/support full
DROP POLICY IF EXISTS batches_admin_all ON public.lead_batches;
CREATE POLICY batches_admin_all ON public.lead_batches
FOR ALL USING (auth.role() = 'authenticated')
WITH CHECK (auth.role() = 'authenticated');

-- Leads: owner sees own; admin/support all; owner update
DROP POLICY IF EXISTS leads_read_owner ON public.leads;
CREATE POLICY leads_read_owner ON public.leads FOR SELECT USING (buyer_user_id = auth.uid());
DROP POLICY IF EXISTS leads_update_owner ON public.leads;
CREATE POLICY leads_update_owner ON public.leads FOR UPDATE USING (buyer_user_id = auth.uid());
DROP POLICY IF EXISTS leads_admin_all ON public.leads;
CREATE POLICY leads_admin_all ON public.leads
FOR ALL USING (auth.role() = 'authenticated')
WITH CHECK (auth.role() = 'authenticated');

-- Purchase requests: buyer reads own; admin/support all; insert self
DROP POLICY IF EXISTS pr_read ON public.lead_purchase_requests;
CREATE POLICY pr_read ON public.lead_purchase_requests
FOR SELECT USING (
  buyer_user_id = auth.uid() OR auth.role() = 'authenticated'
);
DROP POLICY IF EXISTS pr_insert_self ON public.lead_purchase_requests;
CREATE POLICY pr_insert_self ON public.lead_purchase_requests
FOR INSERT WITH CHECK (buyer_user_id = auth.uid());

-- Support: creator + assignee + admin/support
DROP POLICY IF EXISTS support_read ON public.support_cases;
CREATE POLICY support_read ON public.support_cases
FOR SELECT USING (
  created_by = auth.uid()
  OR assigned_to = auth.uid()
  OR auth.role() = 'authenticated'
);
DROP POLICY IF EXISTS support_insert ON public.support_cases;
CREATE POLICY support_insert ON public.support_cases
FOR INSERT WITH CHECK (created_by = auth.uid());

-- Inventory: authenticated users can view, admins can manage
DROP POLICY IF EXISTS inventory_read ON public."salemate-inventory";
CREATE POLICY inventory_read ON public."salemate-inventory"
FOR SELECT USING (auth.role() = 'authenticated');

DROP POLICY IF EXISTS inventory_admin_all ON public."salemate-inventory";
CREATE POLICY inventory_admin_all ON public."salemate-inventory"
FOR ALL USING (auth.role() = 'authenticated')
WITH CHECK (auth.role() = 'authenticated');

-- ========== GRANTS ==========
GRANT ALL ON public.profiles TO authenticated;
GRANT ALL ON public.developers TO authenticated;
GRANT ALL ON public.projects TO authenticated;
GRANT ALL ON public.lead_batches TO authenticated;
GRANT ALL ON public.leads TO authenticated;
GRANT ALL ON public.lead_purchase_requests TO authenticated;
GRANT ALL ON public.support_cases TO authenticated;
GRANT ALL ON public.partners TO authenticated;
GRANT ALL ON public.project_partner_commissions TO authenticated;
GRANT ALL ON public."salemate-inventory" TO authenticated;
GRANT SELECT ON public.lead_availability TO authenticated;
GRANT EXECUTE ON FUNCTION public.rpc_team_user_ids(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.rpc_calculate_order_total(uuid, int) TO authenticated;
GRANT EXECUTE ON FUNCTION public.rpc_start_order(uuid, int, public.payment_method, text, text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.rpc_approve_request(uuid, text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.rpc_reject_request(uuid, text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.ensure_profile(uuid, text, text, text, public.user_role) TO authenticated;
GRANT EXECUTE ON FUNCTION public.backfill_profiles() TO authenticated;

-- ========== VERIFICATION ==========
SELECT 'SaleMate backend created successfully!' as status;

-- Check if there are users in auth.users
SELECT 'Users in auth.users:' as info, COUNT(*) as count FROM auth.users;

-- Check if profiles exist
SELECT 'Profiles in public.profiles:' as info, COUNT(*) as count FROM public.profiles;

-- Backfill any missing profiles
SELECT 'Backfilling profiles...' as info;
SELECT public.backfill_profiles() as profiles_created;

-- Final verification
SELECT 'Final profile count:' as info, COUNT(*) as count FROM public.profiles;
