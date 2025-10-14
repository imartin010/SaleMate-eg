-- ═══════════════════════════════════════════════════════════════════
-- ⚡ WORKING FIX - Copy ALL and paste in Supabase SQL Editor
-- ═══════════════════════════════════════════════════════════════════
-- This replaces approve_purchase_request to ASSIGN real leads
-- instead of creating mock leads
-- ═══════════════════════════════════════════════════════════════════

-- STEP 1: Delete old function
DROP FUNCTION IF EXISTS public.approve_purchase_request(UUID) CASCADE;

-- STEP 2: Create new function that assigns real existing leads
CREATE OR REPLACE FUNCTION public.approve_purchase_request(request_id UUID)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_request RECORD;
  v_project RECORD;
  v_quantity INTEGER;
  v_unassigned_count INTEGER;
  v_assigned_count INTEGER;
BEGIN
  -- Get purchase request
  SELECT * INTO v_request
  FROM public.purchase_requests
  WHERE id = request_id AND status = 'pending'
  FOR UPDATE;

  IF NOT FOUND THEN
    RETURN json_build_object('success', false, 'error', 'Request not found or already processed');
  END IF;

  v_quantity := v_request.quantity;

  -- Get project
  SELECT * INTO v_project
  FROM public.projects
  WHERE id = v_request.project_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RETURN json_build_object('success', false, 'error', 'Project not found');
  END IF;

  -- Count unassigned leads
  SELECT COUNT(*) INTO v_unassigned_count
  FROM public.leads
  WHERE project_id = v_request.project_id
    AND buyer_user_id IS NULL
    AND stage = 'New Lead';

  IF v_unassigned_count < v_quantity THEN
    RETURN json_build_object(
      'success', false, 
      'error', format('Not enough leads! Available: %s, Requested: %s', v_unassigned_count, v_quantity)
    );
  END IF;

  -- ⭐⭐⭐ ASSIGN REAL EXISTING LEADS (NOT CREATE NEW) ⭐⭐⭐
  WITH selected_leads AS (
    SELECT id
    FROM public.leads
    WHERE project_id = v_request.project_id
      AND buyer_user_id IS NULL
      AND stage = 'New Lead'
    ORDER BY created_at ASC
    LIMIT v_quantity
    FOR UPDATE SKIP LOCKED
  )
  UPDATE public.leads l
  SET 
    buyer_user_id = v_request.user_id,
    updated_at = NOW(),
    stage = 'New Lead'
  FROM selected_leads s
  WHERE l.id = s.id;

  GET DIAGNOSTICS v_assigned_count = ROW_COUNT;

  IF v_assigned_count < v_quantity THEN
    RAISE EXCEPTION 'Only assigned % of % leads', v_assigned_count, v_quantity;
  END IF;

  -- Update project counter
  UPDATE public.projects
  SET available_leads = available_leads - v_quantity
  WHERE id = v_request.project_id;

  -- Mark request as approved
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
    'leads_assigned', v_assigned_count
  );

EXCEPTION
  WHEN OTHERS THEN
    RETURN json_build_object('success', false, 'error', SQLERRM);
END;
$$;

-- STEP 3: Grant permissions
GRANT EXECUTE ON FUNCTION public.approve_purchase_request(UUID) TO authenticated;

-- STEP 4: Add comment
COMMENT ON FUNCTION public.approve_purchase_request(UUID) IS 
'Assigns existing unassigned leads from project to buyer. Does NOT create mock leads.';

-- Done!
SELECT '✅ Function updated! From now on: Will ASSIGN real leads, NOT create mock leads.' as status;

