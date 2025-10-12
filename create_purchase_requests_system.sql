-- Create Purchase Requests System
-- This allows users to submit purchase requests with receipts
-- Admins can then approve/reject and assign leads

-- Step 1: Create purchase_requests table
CREATE TABLE IF NOT EXISTS public.purchase_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  quantity INTEGER NOT NULL CHECK (quantity > 0),
  total_price NUMERIC(10, 2) NOT NULL CHECK (total_price > 0),
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  receipt_url TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  approved_by UUID REFERENCES auth.users(id),
  approved_at TIMESTAMPTZ
);

-- Step 2: Create indexes
CREATE INDEX IF NOT EXISTS idx_purchase_requests_user_id ON public.purchase_requests(user_id);
CREATE INDEX IF NOT EXISTS idx_purchase_requests_project_id ON public.purchase_requests(project_id);
CREATE INDEX IF NOT EXISTS idx_purchase_requests_status ON public.purchase_requests(status);
CREATE INDEX IF NOT EXISTS idx_purchase_requests_created_at ON public.purchase_requests(created_at DESC);

-- Step 3: Enable RLS
ALTER TABLE public.purchase_requests ENABLE ROW LEVEL SECURITY;

-- Step 4: RLS Policies

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

-- Step 5: Create RPC function to approve purchase and assign leads
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

  -- Get project details
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

  -- Create leads for the buyer
  FOR i IN 1..lead_quantity LOOP
    INSERT INTO public.leads (
      buyer_user_id,
      project_id,
      client_name,
      client_phone,
      client_email,
      source,
      stage,
      batch_id
    ) VALUES (
      v_request.user_id,
      v_request.project_id,
      'Lead ' || i,
      '+20 100 XXX XXXX',
      'lead' || i || '@example.com',
      'Purchase',
      'New Lead',
      gen_random_uuid()
    )
    RETURNING id INTO v_lead_id;
    
    v_lead_ids := array_append(v_lead_ids, v_lead_id);
  END LOOP;

  -- Update project available leads
  UPDATE public.projects
  SET available_leads = available_leads - lead_quantity
  WHERE id = v_request.project_id;

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

-- Step 6: Create updated_at trigger
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

