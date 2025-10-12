-- Fix Purchase Request Approval to Assign Real Leads
-- This updates the approve_purchase_request function to assign existing unassigned leads
-- instead of creating mock leads

CREATE OR REPLACE FUNCTION public.approve_purchase_request(request_id UUID)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_request RECORD;
  v_project RECORD;
  lead_quantity INTEGER;
  v_available_unassigned_leads INTEGER;
  v_lead_ids UUID[] := ARRAY[]::UUID[];
  v_assigned_count INTEGER := 0;
BEGIN
  -- Get purchase request details
  SELECT * INTO v_request
  FROM public.purchase_requests
  WHERE id = request_id AND status = 'pending'
  FOR UPDATE;

  IF NOT FOUND THEN
    RETURN json_build_object(
      'success', false,
      'error', 'Purchase request not found or already processed'
    );
  END IF;

  lead_quantity := v_request.quantity;

  -- Get project details
  SELECT * INTO v_project
  FROM public.projects
  WHERE id = v_request.project_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RETURN json_build_object(
      'success', false,
      'error', 'Project not found'
    );
  END IF;

  -- Check if project has enough available leads
  IF v_project.available_leads < lead_quantity THEN
    RETURN json_build_object(
      'success', false,
      'error', format('Not enough leads available. Available: %s, Requested: %s', 
                      v_project.available_leads, lead_quantity)
    );
  END IF;

  -- Count available unassigned leads for this project
  SELECT COUNT(*) INTO v_available_unassigned_leads
  FROM public.leads
  WHERE project_id = v_request.project_id
    AND (buyer_user_id IS NULL OR buyer_user_id = '00000000-0000-0000-0000-000000000000'::UUID)
    AND stage = 'New Lead';

  IF v_available_unassigned_leads < lead_quantity THEN
    RETURN json_build_object(
      'success', false,
      'error', format('Not enough unassigned leads in this project. Available: %s, Requested: %s. Please add more leads to this project first.', 
                      v_available_unassigned_leads, lead_quantity)
    );
  END IF;

  -- Assign existing unassigned leads to the buyer
  UPDATE public.leads
  SET 
    buyer_user_id = v_request.user_id,
    updated_at = NOW(),
    stage = 'New Lead',
    source = COALESCE(source, 'Purchase')
  WHERE id IN (
    SELECT id
    FROM public.leads
    WHERE project_id = v_request.project_id
      AND (buyer_user_id IS NULL OR buyer_user_id = '00000000-0000-0000-0000-000000000000'::UUID)
      AND stage = 'New Lead'
    ORDER BY created_at ASC
    LIMIT lead_quantity
    FOR UPDATE SKIP LOCKED
  )
  RETURNING id INTO v_lead_ids;

  -- Get the actual count of assigned leads
  GET DIAGNOSTICS v_assigned_count = ROW_COUNT;

  IF v_assigned_count < lead_quantity THEN
    -- Rollback if we couldn't assign enough leads
    RAISE EXCEPTION 'Failed to assign all requested leads. Only % leads were assigned.', v_assigned_count;
  END IF;

  -- Update project's available leads count
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
    'message', format('%s real leads assigned successfully', v_assigned_count),
    'leads_assigned', v_assigned_count,
    'buyer_user_id', v_request.user_id,
    'project_name', v_project.name
  );

EXCEPTION
  WHEN OTHERS THEN
    RETURN json_build_object(
      'success', false,
      'error', SQLERRM
    );
END;
$$;

-- Grant execute permission
GRANT EXECUTE ON FUNCTION public.approve_purchase_request(UUID) TO authenticated;

-- Add helpful comment
COMMENT ON FUNCTION public.approve_purchase_request(UUID) IS 
'Assigns existing unassigned leads from a project to a buyer upon purchase request approval. 
Validates lead availability and updates project inventory.';

SELECT 'Purchase approval function updated to assign real leads!' as status;

