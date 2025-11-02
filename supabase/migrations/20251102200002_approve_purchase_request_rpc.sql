-- ============================================
-- RPC FUNCTION TO APPROVE PURCHASE REQUEST AND ASSIGN LEADS
-- ============================================
-- This function assigns leads to the user when a purchase request is approved
-- ============================================

CREATE OR REPLACE FUNCTION approve_purchase_request_and_assign_leads(
  p_request_id uuid,
  p_admin_id uuid,
  p_admin_notes text DEFAULT NULL
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_request record;
  v_project record;
  v_lead_ids uuid[];
  v_assigned_count integer;
  v_total_amount numeric;
BEGIN
  -- Get the purchase request
  SELECT pr.* INTO v_request
  FROM purchase_requests pr
  WHERE pr.id = p_request_id
    AND pr.status = 'pending';
  
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Purchase request not found or already processed';
  END IF;

  -- Get project details
  SELECT p.* INTO v_project
  FROM projects p
  WHERE p.id = v_request.project_id;
  
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Project not found';
  END IF;

  -- Check available leads
  IF v_project.available_leads < v_request.quantity THEN
    RAISE EXCEPTION 'Not enough leads available. Available: %, Requested: %', 
      v_project.available_leads, v_request.quantity;
  END IF;

  -- Calculate total amount
  v_total_amount := COALESCE(v_project.price_per_lead, 0) * v_request.quantity;

  -- Get available leads for this project
  SELECT ARRAY_AGG(id) INTO v_lead_ids
  FROM leads
  WHERE project_id = v_request.project_id
    AND is_sold = false
    AND buyer_user_id IS NULL
  LIMIT v_request.quantity;

  IF v_lead_ids IS NULL OR array_length(v_lead_ids, 1) < v_request.quantity THEN
    RAISE EXCEPTION 'Not enough available leads to fulfill request. Found: %, Requested: %', 
      COALESCE(array_length(v_lead_ids, 1), 0), v_request.quantity;
  END IF;

  -- Update leads - assign to buyer
  UPDATE leads
  SET 
    buyer_user_id = v_request.user_id,
    owner_id = v_request.user_id,
    assigned_to_id = v_request.user_id,
    is_sold = true,
    sold_at = NOW(),
    assigned_at = NOW(),
    updated_at = NOW()
  WHERE id = ANY(v_lead_ids);

  GET DIAGNOSTICS v_assigned_count = ROW_COUNT;

  -- Decrement available leads count
  UPDATE projects
  SET available_leads = available_leads - v_assigned_count
  WHERE id = v_request.project_id;

  -- Update purchase request status
  UPDATE purchase_requests
  SET 
    status = 'approved',
    approved_by = p_admin_id,
    approved_at = NOW(),
    admin_notes = p_admin_notes,
    updated_at = NOW()
  WHERE id = p_request_id;

  -- Log wallet transaction if payment was via Instapay or Card (already paid)
  IF v_request.payment_method IN ('Instapay', 'Card') THEN
    INSERT INTO wallet_transactions (
      user_id,
      type,
      amount,
      description,
      status,
      reference_id
    ) VALUES (
      v_request.user_id,
      'payment',
      -v_total_amount,
      'Lead purchase: ' || v_request.quantity || ' leads from ' || v_project.name,
      'completed',
      p_request_id::text
    );
  END IF;

  -- Return result
  RETURN jsonb_build_object(
    'success', true,
    'request_id', p_request_id,
    'leads_assigned', v_assigned_count,
    'total_amount', v_total_amount,
    'project_name', v_project.name
  );
END;
$$;

-- Grant execute permission to authenticated users (admins will use it)
GRANT EXECUTE ON FUNCTION approve_purchase_request_and_assign_leads TO authenticated;

COMMENT ON FUNCTION approve_purchase_request_and_assign_leads IS 
'Approves a purchase request and assigns the requested quantity of leads to the buyer';

