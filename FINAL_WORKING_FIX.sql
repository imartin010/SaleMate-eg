-- ═══════════════════════════════════════════════════════════════════
-- ⚡ FINAL WORKING FIX - Assign Real Leads to Buyer
-- ═══════════════════════════════════════════════════════════════════
-- When admin approves purchase request:
-- 1. Get the buyer's UUID (user_id from purchase request)
-- 2. Get the project_id
-- 3. Get the quantity requested
-- 4. Find leads WHERE project_id matches AND buyer_user_id IS NULL
-- 5. UPDATE those leads SET buyer_user_id = buyer's UUID
-- ═══════════════════════════════════════════════════════════════════

-- STEP 1: Drop old function
DROP FUNCTION IF EXISTS public.approve_purchase_request(UUID) CASCADE;

-- STEP 2: Create the correct function with proper variable names
CREATE OR REPLACE FUNCTION public.approve_purchase_request(request_id UUID)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_buyer_id UUID;           -- The buyer's UUID
  v_project_id UUID;         -- The project UUID
  v_quantity INTEGER;        -- Amount requested
  v_available_count INTEGER; -- Available leads with NULL buyer_user_id
  v_assigned_count INTEGER;  -- How many were actually assigned
BEGIN
  -- STEP 1: Get buyer UUID, project UUID, and quantity from purchase request
  SELECT user_id, project_id, quantity
  INTO v_buyer_id, v_project_id, v_quantity
  FROM public.purchase_requests
  WHERE id = request_id AND status = 'pending'
  FOR UPDATE;

  -- Check if request exists
  IF NOT FOUND THEN
    RETURN json_build_object(
      'success', false, 
      'error', 'Purchase request not found or already processed'
    );
  END IF;

  -- STEP 2: Count available leads in this project with NULL buyer_user_id
  SELECT COUNT(*)
  INTO v_available_count
  FROM public.leads
  WHERE project_id = v_project_id
    AND buyer_user_id IS NULL;

  -- Check if enough leads available
  IF v_available_count < v_quantity THEN
    RETURN json_build_object(
      'success', false,
      'error', format('Not enough available leads. Found: %s, Need: %s', v_available_count, v_quantity)
    );
  END IF;

  -- STEP 3: ⭐ ASSIGN REAL LEADS ⭐
  -- Find leads WHERE:
  --   - project_id = v_project_id
  --   - buyer_user_id IS NULL (not assigned to anyone yet)
  -- UPDATE them SET buyer_user_id = v_buyer_id
  -- LIMIT to v_quantity
  WITH leads_to_assign AS (
    SELECT id
    FROM public.leads
    WHERE project_id = v_project_id
      AND buyer_user_id IS NULL
    ORDER BY created_at ASC  -- Oldest leads first
    LIMIT v_quantity
    FOR UPDATE SKIP LOCKED
  )
  UPDATE public.leads
  SET 
    buyer_user_id = v_buyer_id,
    updated_at = NOW()
  FROM leads_to_assign
  WHERE leads.id = leads_to_assign.id;

  -- Get count of how many were assigned
  GET DIAGNOSTICS v_assigned_count = ROW_COUNT;

  -- Verify all requested leads were assigned
  IF v_assigned_count < v_quantity THEN
    RAISE EXCEPTION 'Failed to assign all leads. Assigned: %, Requested: %', v_assigned_count, v_quantity;
  END IF;

  -- STEP 4: Update project's available_leads counter
  UPDATE public.projects
  SET available_leads = available_leads - v_quantity
  WHERE id = v_project_id;

  -- STEP 5: Mark purchase request as approved
  UPDATE public.purchase_requests
  SET 
    status = 'approved',
    approved_by = auth.uid(),
    approved_at = NOW(),
    updated_at = NOW()
  WHERE id = request_id;

  -- STEP 6: Return success
  RETURN json_build_object(
    'success', true,
    'message', format('Successfully assigned %s real leads to buyer', v_assigned_count),
    'leads_assigned', v_assigned_count,
    'buyer_id', v_buyer_id,
    'project_id', v_project_id
  );

EXCEPTION
  WHEN OTHERS THEN
    RETURN json_build_object(
      'success', false, 
      'error', SQLERRM
    );
END;
$$;

-- STEP 3: Grant permissions
GRANT EXECUTE ON FUNCTION public.approve_purchase_request(UUID) TO authenticated;

-- STEP 4: Done!
SELECT '✅ Function created successfully! Now assigns REAL leads with NULL buyer_user_id to the buyer.' as status;

