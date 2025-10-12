-- ═══════════════════════════════════════════════════════════════════
-- ⚡ SIMPLE CORRECT FIX - Assign Real Leads to Buyer
-- ═══════════════════════════════════════════════════════════════════
-- This does EXACTLY what you described:
-- 1. Get buyer_id from purchase request
-- 2. Get project_id from purchase request
-- 3. Get quantity (amount requested)
-- 4. Find leads WHERE project_id = project_id AND buyer_user_id IS NULL
-- 5. UPDATE those leads SET buyer_user_id = buyer_id (LIMIT quantity)
-- ═══════════════════════════════════════════════════════════════════

-- STEP 1: Drop old function
DROP FUNCTION IF EXISTS public.approve_purchase_request(UUID) CASCADE;

-- STEP 2: Create the correct function
CREATE OR REPLACE FUNCTION public.approve_purchase_request(request_id UUID)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  buyer_id UUID;
  project_id UUID;
  quantity INTEGER;
  available_count INTEGER;
  assigned_count INTEGER;
BEGIN
  -- Get buyer_id, project_id, and quantity from purchase request
  SELECT user_id, project_id, quantity
  INTO buyer_id, project_id, quantity
  FROM public.purchase_requests
  WHERE id = request_id AND status = 'pending'
  FOR UPDATE;

  -- Check if request exists
  IF NOT FOUND THEN
    RETURN json_build_object('success', false, 'error', 'Purchase request not found or already processed');
  END IF;

  -- Count available leads for this project with NULL buyer_user_id
  SELECT COUNT(*)
  INTO available_count
  FROM public.leads
  WHERE project_id = project_id
    AND buyer_user_id IS NULL;

  -- Check if enough leads available
  IF available_count < quantity THEN
    RETURN json_build_object(
      'success', false,
      'error', format('Not enough available leads. Found: %s, Need: %s', available_count, quantity)
    );
  END IF;

  -- ⭐ ASSIGN REAL LEADS: Update leads table, set buyer_user_id = buyer_id
  -- Only for leads that match:
  -- - same project_id
  -- - buyer_user_id IS NULL (not assigned to anyone)
  -- - limit to requested quantity
  WITH leads_to_assign AS (
    SELECT id
    FROM public.leads
    WHERE project_id = project_id
      AND buyer_user_id IS NULL
    ORDER BY created_at ASC
    LIMIT quantity
    FOR UPDATE SKIP LOCKED
  )
  UPDATE public.leads
  SET 
    buyer_user_id = buyer_id,
    updated_at = NOW()
  FROM leads_to_assign
  WHERE leads.id = leads_to_assign.id;

  -- Get count of assigned leads
  GET DIAGNOSTICS assigned_count = ROW_COUNT;

  -- Verify all were assigned
  IF assigned_count < quantity THEN
    RAISE EXCEPTION 'Failed to assign all leads. Assigned: %, Requested: %', assigned_count, quantity;
  END IF;

  -- Update project's available_leads counter
  UPDATE public.projects
  SET available_leads = available_leads - quantity
  WHERE id = project_id;

  -- Mark purchase request as approved
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
    'message', format('Successfully assigned %s real leads to buyer', assigned_count),
    'leads_assigned', assigned_count,
    'buyer_id', buyer_id,
    'project_id', project_id
  );

EXCEPTION
  WHEN OTHERS THEN
    RETURN json_build_object('success', false, 'error', SQLERRM);
END;
$$;

-- STEP 3: Grant permissions
GRANT EXECUTE ON FUNCTION public.approve_purchase_request(UUID) TO authenticated;

-- STEP 4: Done!
SELECT '✅ Function created! Now assigns real leads with NULL buyer_user_id to the buyer.' as status;

