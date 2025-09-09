-- PRODUCTION LEAD WORKFLOW SCHEMA - COMPLETE REBUILD
-- Run this in Supabase SQL Editor for project wkxbhvckmgrmdkdkhnqo

-- ENUMS
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname='payment_method') THEN
    CREATE TYPE public.payment_method AS ENUM ('Instapay','VodafoneCash','BankTransfer');
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname='order_status') THEN
    CREATE TYPE public.order_status AS ENUM ('pending','approved','rejected');
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname='lead_stage') THEN
    CREATE TYPE public.lead_stage AS ENUM ('New Lead','Potential','Hot Case','Meeting Done','No Answer','Call Back','Whatsapp','Wrong Number','Non Potential');
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname='platform_type') THEN
    CREATE TYPE public.platform_type AS ENUM ('Facebook','Google','TikTok','Other');
  END IF;
END $$;

-- Drop existing tables to rebuild clean
DROP TABLE IF EXISTS public.lead_purchase_requests CASCADE;
DROP TABLE IF EXISTS public.leads CASCADE;
DROP TABLE IF EXISTS public.lead_batches CASCADE;
DROP TABLE IF EXISTS public.projects CASCADE;

-- PROJECTS
CREATE TABLE public.projects (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  developer text NOT NULL,
  region text NOT NULL,
  description text,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- LEAD BATCHES (stores CPL per upload)
CREATE TABLE public.lead_batches (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id uuid NOT NULL REFERENCES public.projects(id),
  batch_name text NOT NULL,
  cpl numeric(10,2) NOT NULL,
  created_by uuid REFERENCES public.profiles(id),
  created_at timestamptz NOT NULL DEFAULT now()
);

-- LEADS (initially unassigned)
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

-- PURCHASE REQUEST (buyer submits qty + receipt; admin approves)
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

-- INDEXES
CREATE INDEX idx_leads_project_unassigned ON public.leads(project_id) WHERE buyer_user_id IS NULL;
CREATE INDEX idx_leads_buyer ON public.leads(buyer_user_id);
CREATE INDEX idx_purchase_requests_status ON public.lead_purchase_requests(status);
CREATE INDEX idx_purchase_requests_buyer ON public.lead_purchase_requests(buyer_user_id);

-- VIEW: project availability
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

-- STORAGE BUCKET for receipts
INSERT INTO storage.buckets (id, name, public) 
VALUES ('receipts','receipts', false)
ON CONFLICT (id) DO NOTHING;

-- RLS POLICIES
ALTER TABLE public.leads ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.lead_purchase_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.lead_batches ENABLE ROW LEVEL SECURITY;

-- Projects: readable to all authenticated
DROP POLICY IF EXISTS projects_read ON public.projects;
CREATE POLICY projects_read ON public.projects
FOR SELECT USING (auth.role() IS NOT NULL);

DROP POLICY IF EXISTS projects_admin_all ON public.projects;
CREATE POLICY projects_admin_all ON public.projects
FOR ALL USING (
  EXISTS(SELECT 1 FROM public.profiles me WHERE me.id=auth.uid() AND me.role IN ('admin','support'))
);

-- Leads: users see only their purchased leads
DROP POLICY IF EXISTS leads_read_mine ON public.leads;
CREATE POLICY leads_read_mine ON public.leads
FOR SELECT USING (buyer_user_id = auth.uid());

-- Admin/Support full access to leads
DROP POLICY IF EXISTS leads_admin_all ON public.leads;
CREATE POLICY leads_admin_all ON public.leads
FOR ALL USING (
  EXISTS(SELECT 1 FROM public.profiles me WHERE me.id=auth.uid() AND me.role IN ('admin','support'))
);

-- Lead batches: admin/support only
DROP POLICY IF EXISTS batches_admin_all ON public.lead_batches;
CREATE POLICY batches_admin_all ON public.lead_batches
FOR ALL USING (
  EXISTS(SELECT 1 FROM public.profiles me WHERE me.id=auth.uid() AND me.role IN ('admin','support'))
);

-- Purchase requests: buyer reads own; admin/support all
DROP POLICY IF EXISTS pr_read_own ON public.lead_purchase_requests;
CREATE POLICY pr_read_own ON public.lead_purchase_requests
FOR SELECT USING (
  buyer_user_id = auth.uid()
  OR EXISTS(SELECT 1 FROM public.profiles me WHERE me.id=auth.uid() AND me.role IN ('admin','support'))
);

DROP POLICY IF EXISTS pr_insert_own ON public.lead_purchase_requests;
CREATE POLICY pr_insert_own ON public.lead_purchase_requests
FOR INSERT WITH CHECK (buyer_user_id = auth.uid());

DROP POLICY IF EXISTS pr_update_admin ON public.lead_purchase_requests;
CREATE POLICY pr_update_admin ON public.lead_purchase_requests
FOR UPDATE USING (
  EXISTS(SELECT 1 FROM public.profiles me WHERE me.id=auth.uid() AND me.role IN ('admin','support'))
);

-- Storage policies for receipts
CREATE POLICY "upload own receipts" ON storage.objects
FOR INSERT TO authenticated
WITH CHECK (
  bucket_id = 'receipts' AND (storage.foldername(name))[1] = auth.uid()::text
);

CREATE POLICY "read own receipts or admin" ON storage.objects
FOR SELECT TO authenticated
USING (
  bucket_id = 'receipts' AND (
    (storage.foldername(name))[1] = auth.uid()::text
    OR EXISTS(SELECT 1 FROM public.profiles me WHERE me.id=auth.uid() AND me.role IN ('admin','support'))
  )
);

-- GRANT PERMISSIONS
GRANT ALL ON public.projects TO authenticated;
GRANT ALL ON public.lead_batches TO authenticated;
GRANT ALL ON public.leads TO authenticated;
GRANT ALL ON public.lead_purchase_requests TO authenticated;
GRANT SELECT ON public.lead_availability TO authenticated;

-- RPC FUNCTIONS

-- Calculate price from latest batch CPL
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

-- Start order (create purchase request in 'pending')
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

-- Approve order: atomically assign N unowned leads to buyer
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

-- Reject request
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

-- POPULATE SAMPLE DATA FOR TESTING

-- Insert sample projects
INSERT INTO public.projects (id, name, developer, region, description) VALUES
('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'New Capital Towers', 'Emaar Properties', 'New Capital', 'Luxury residential towers in the New Administrative Capital'),
('bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', 'Palm Hills West', 'Palm Hills Development', '6th of October', 'Modern residential community with green spaces'),
('cccccccc-cccc-cccc-cccc-cccccccccccc', 'Madinaty Heights', 'Talaat Moustafa Group', 'Madinaty', 'Exclusive residential project with luxury amenities'),
('dddddddd-dddd-dddd-dddd-dddddddddddd', 'Cairo Festival City', 'Al-Futtaim Group', 'New Cairo', 'Mixed-use development with residential and commercial'),
('eeeeeeee-eeee-eeee-eeee-eeeeeeeeeeee', 'Sheikh Zayed Gardens', 'SODIC', 'Sheikh Zayed', 'Premium residential project with modern architecture');

-- Create sample lead batch
INSERT INTO public.lead_batches (id, project_id, batch_name, cpl, created_by) VALUES
('11111111-1111-1111-1111-111111111111', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'Sample Batch 1', 25.00, (SELECT id FROM public.profiles WHERE role = 'admin' LIMIT 1));

-- Insert sample leads
INSERT INTO public.leads (project_id, batch_id, client_name, client_phone, client_email, stage) VALUES
('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', '11111111-1111-1111-1111-111111111111', 'Ahmed Mohamed', '+201234567890', 'ahmed@example.com', 'New Lead'),
('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', '11111111-1111-1111-1111-111111111111', 'Sara Hassan', '+201234567891', 'sara@example.com', 'New Lead'),
('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', '11111111-1111-1111-1111-111111111111', 'Mohamed Ali', '+201234567892', 'mohamed@example.com', 'New Lead'),
('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', '11111111-1111-1111-1111-111111111111', 'Fatima Omar', '+201234567893', 'fatima@example.com', 'New Lead'),
('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', '11111111-1111-1111-1111-111111111111', 'Khaled Ahmed', '+201234567894', 'khaled@example.com', 'New Lead'),
('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', '11111111-1111-1111-1111-111111111111', 'Nour Ibrahim', '+201234567895', 'nour@example.com', 'New Lead'),
('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', '11111111-1111-1111-1111-111111111111', 'Omar Mahmoud', '+201234567896', 'omar@example.com', 'New Lead'),
('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', '11111111-1111-1111-1111-111111111111', 'Mona Saeed', '+201234567897', 'mona@example.com', 'New Lead'),
('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', '11111111-1111-1111-1111-111111111111', 'Youssef Nabil', '+201234567898', 'youssef@example.com', 'New Lead'),
('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', '11111111-1111-1111-1111-111111111111', 'Rania Farouk', '+201234567899', 'rania@example.com', 'New Lead');

-- Add more leads to reach 100+ for testing
INSERT INTO public.leads (project_id, batch_id, client_name, client_phone, client_email, stage)
SELECT 
  'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
  '11111111-1111-1111-1111-111111111111',
  'Client ' || generate_series(11, 100),
  '+2012345678' || LPAD(generate_series(11, 100)::text, 2, '0'),
  'client' || generate_series(11, 100) || '@example.com',
  'New Lead'::lead_stage
FROM generate_series(11, 100);

-- VERIFICATION
SELECT 'Production lead workflow schema created!' as status;

-- Show projects with availability
SELECT 
  p.name,
  p.developer,
  p.region,
  COUNT(l.id) FILTER (WHERE l.buyer_user_id IS NULL) as available_leads,
  b.cpl as current_cpl
FROM public.projects p
LEFT JOIN public.leads l ON p.id = l.project_id
LEFT JOIN public.lead_batches b ON p.id = b.project_id
GROUP BY p.id, p.name, p.developer, p.region, b.cpl
ORDER BY available_leads DESC;

-- Show lead availability view
SELECT * FROM public.lead_availability ORDER BY available_leads DESC;

-- Show totals
SELECT 
  (SELECT COUNT(*) FROM public.projects) as total_projects,
  (SELECT COUNT(*) FROM public.leads) as total_leads,
  (SELECT COUNT(*) FROM public.leads WHERE buyer_user_id IS NULL) as available_for_purchase,
  (SELECT COUNT(*) FROM public.lead_batches) as total_batches;
