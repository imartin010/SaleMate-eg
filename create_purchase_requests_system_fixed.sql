-- Create Purchase Requests System (FIXED)
-- Run this in Supabase SQL Editor

-- Step 1: Drop existing table if it exists (to start fresh)
DROP TABLE IF EXISTS public.purchase_requests CASCADE;

-- Step 2: Create purchase_requests table
CREATE TABLE public.purchase_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  project_id UUID NOT NULL,
  quantity INTEGER NOT NULL CHECK (quantity > 0),
  total_price NUMERIC(10, 2) NOT NULL CHECK (total_price > 0),
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  receipt_url TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  approved_by UUID REFERENCES auth.users(id),
  approved_at TIMESTAMPTZ
);

-- Step 3: Add foreign key constraint for project_id (if projects table exists)
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'projects') THEN
    ALTER TABLE public.purchase_requests 
    ADD CONSTRAINT fk_purchase_requests_project 
    FOREIGN KEY (project_id) REFERENCES public.projects(id) ON DELETE CASCADE;
  END IF;
END $$;

-- Step 4: Create indexes
CREATE INDEX idx_purchase_requests_user_id ON public.purchase_requests(user_id);
CREATE INDEX idx_purchase_requests_project_id ON public.purchase_requests(project_id);
CREATE INDEX idx_purchase_requests_status ON public.purchase_requests(status);
CREATE INDEX idx_purchase_requests_created_at ON public.purchase_requests(created_at DESC);

-- Step 5: Enable RLS
ALTER TABLE public.purchase_requests ENABLE ROW LEVEL SECURITY;

-- Step 6: Drop existing policies if they exist
DROP POLICY IF EXISTS "Users can view own purchase requests" ON public.purchase_requests;
DROP POLICY IF EXISTS "Users can create purchase requests" ON public.purchase_requests;
DROP POLICY IF EXISTS "Admins can view all purchase requests" ON public.purchase_requests;
DROP POLICY IF EXISTS "Admins can update purchase requests" ON public.purchase_requests;

-- Step 7: RLS Policies

-- Users can view their own purchase requests
CREATE POLICY "Users can view own purchase requests"
ON public.purchase_requests
FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

-- Users can create purchase requests
CREATE POLICY "Users can create purchase requests"
ON public.purchase_requests
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

-- Admins can view all purchase requests
CREATE POLICY "Admins can view all purchase requests"
ON public.purchase_requests
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid()
    AND role = 'admin'
  )
);

-- Admins can update purchase requests
CREATE POLICY "Admins can update purchase requests"
ON public.purchase_requests
FOR UPDATE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid()
    AND role = 'admin'
  )
);

-- Step 8: Create RPC function to approve purchase and assign leads
DROP FUNCTION IF EXISTS approve_purchase_request(UUID, INTEGER);

CREATE OR REPLACE FUNCTION approve_purchase_request(
  request_id UUID,
  lead_quantity INTEGER
)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_request RECORD;
  v_project RECORD;
  v_user_id UUID;
  v_lead_ids UUID[];
  v_lead_id UUID;
  i INTEGER;
BEGIN
  -- Check if user is admin
  SELECT id INTO v_user_id FROM public.profiles
  WHERE id = auth.uid() AND role = 'admin';
  
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'Only admins can approve purchase requests';
  END IF;

  -- Get purchase request details
  SELECT * INTO v_request
  FROM public.purchase_requests
  WHERE id = request_id;

  IF v_request IS NULL THEN
    RAISE EXCEPTION 'Purchase request not found';
  END IF;

  IF v_request.status != 'pending' THEN
    RAISE EXCEPTION 'Purchase request has already been processed';
  END IF;

  -- Get project details (if projects table exists)
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'projects') THEN
    SELECT * INTO v_project
    FROM public.projects
    WHERE id = v_request.project_id;

    IF v_project IS NULL THEN
      RAISE EXCEPTION 'Project not found';
    END IF;

    -- Check if enough leads available
    IF v_project.available_leads < lead_quantity THEN
      RAISE EXCEPTION 'Not enough leads available. Available: %, Requested: %', 
        v_project.available_leads, lead_quantity;
    END IF;

    -- Update project available leads
    UPDATE public.projects
    SET available_leads = available_leads - lead_quantity
    WHERE id = v_request.project_id;
  END IF;

  -- Create leads for the buyer (if leads table exists)
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'leads') THEN
    FOR i IN 1..lead_quantity LOOP
      INSERT INTO public.leads (
        buyer_user_id,
        project_id,
        client_name,
        client_phone,
        client_email,
        source,
        stage
      ) VALUES (
        v_request.user_id,
        v_request.project_id,
        'Lead ' || i || ' (Purchased)',
        '+20 100 XXX XXXX',
        'lead' || i || '@purchased.com',
        'Purchase',
        'New Lead'
      )
      RETURNING id INTO v_lead_id;
      
      v_lead_ids := array_append(v_lead_ids, v_lead_id);
    END LOOP;
  END IF;

  -- Update purchase request status
  UPDATE public.purchase_requests
  SET 
    status = 'approved',
    approved_by = auth.uid(),
    approved_at = NOW(),
    updated_at = NOW()
  WHERE id = request_id;

  -- Return success
  RETURN json_build_object(
    'success', true,
    'message', 'Purchase approved and leads assigned',
    'leads_created', lead_quantity,
    'lead_ids', v_lead_ids
  );
END;
$$;

-- Step 9: Create updated_at trigger
DROP TRIGGER IF EXISTS trigger_purchase_requests_updated_at ON public.purchase_requests;
DROP FUNCTION IF EXISTS update_purchase_requests_updated_at();

CREATE OR REPLACE FUNCTION update_purchase_requests_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_purchase_requests_updated_at
  BEFORE UPDATE ON public.purchase_requests
  FOR EACH ROW
  EXECUTE FUNCTION update_purchase_requests_updated_at();

SELECT 'Purchase requests system created successfully!' as status;

