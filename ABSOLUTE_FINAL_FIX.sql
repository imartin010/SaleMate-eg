-- ═══════════════════════════════════════════════════════════════════
-- ⚡ ABSOLUTE FINAL FIX - COPY ALL AND RUN IN SUPABASE NOW
-- ═══════════════════════════════════════════════════════════════════
-- This completely replaces the approve_purchase_request function
-- to ASSIGN real existing leads instead of creating mock leads
-- ═══════════════════════════════════════════════════════════════════

-- ████████████████████████████████████████████████████████████████████
-- STEP 1: DELETE OLD BROKEN FUNCTION
-- ████████████████████████████████████████████████████████████████████

DROP FUNCTION IF EXISTS public.approve_purchase_request(UUID) CASCADE;

RAISE NOTICE '✅ Old function deleted';

-- ████████████████████████████████████████████████████████████████████
-- STEP 2: CREATE NEW CORRECT FUNCTION
-- ████████████████████████████████████████████████████████████████████

CREATE FUNCTION public.approve_purchase_request(request_id UUID)
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
  -- ═══════════════════════════════════════════════════════════════
  -- VALIDATE REQUEST
  -- ═══════════════════════════════════════════════════════════════
  
  SELECT * INTO v_request
  FROM public.purchase_requests
  WHERE id = request_id AND status = 'pending'
  FOR UPDATE;

  IF NOT FOUND THEN
    RETURN json_build_object('success', false, 'error', 'Request not found or already processed');
  END IF;

  v_quantity := v_request.quantity;

  -- ═══════════════════════════════════════════════════════════════
  -- VALIDATE PROJECT
  -- ═══════════════════════════════════════════════════════════════
  
  SELECT * INTO v_project
  FROM public.projects
  WHERE id = v_request.project_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RETURN json_build_object('success', false, 'error', 'Project not found');
  END IF;

  -- ═══════════════════════════════════════════════════════════════
  -- COUNT UNASSIGNED LEADS
  -- ═══════════════════════════════════════════════════════════════
  
  SELECT COUNT(*) INTO v_unassigned_count
  FROM public.leads
  WHERE project_id = v_request.project_id
    AND buyer_user_id IS NULL
    AND stage = 'New Lead';

  RAISE NOTICE '🔍 Project "%" has % unassigned leads. Need: %', 
    v_project.name, v_unassigned_count, v_quantity;

  IF v_unassigned_count < v_quantity THEN
    RETURN json_build_object(
      'success', false, 
      'error', format('Not enough leads! Available: %s, Requested: %s', v_unassigned_count, v_quantity)
    );
  END IF;

  -- ═══════════════════════════════════════════════════════════════
  -- ⭐⭐⭐ ASSIGN REAL EXISTING LEADS (NOT CREATE NEW) ⭐⭐⭐
  -- ═══════════════════════════════════════════════════════════════
  
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

  RAISE NOTICE '✅ Assigned % REAL leads to buyer', v_assigned_count;

  IF v_assigned_count < v_quantity THEN
    RAISE EXCEPTION 'Only assigned % of % leads', v_assigned_count, v_quantity;
  END IF;

  -- ═══════════════════════════════════════════════════════════════
  -- UPDATE PROJECT COUNTER
  -- ═══════════════════════════════════════════════════════════════
  
  UPDATE public.projects
  SET available_leads = available_leads - v_quantity
  WHERE id = v_request.project_id;

  -- ═══════════════════════════════════════════════════════════════
  -- MARK REQUEST AS APPROVED
  -- ═══════════════════════════════════════════════════════════════
  
  UPDATE public.purchase_requests
  SET 
    status = 'approved',
    approved_by = auth.uid(),
    approved_at = NOW(),
    updated_at = NOW()
  WHERE id = request_id;

  -- ═══════════════════════════════════════════════════════════════
  -- RETURN SUCCESS
  -- ═══════════════════════════════════════════════════════════════
  
  RETURN json_build_object(
    'success', true,
    'message', format('%s real leads assigned successfully', v_assigned_count),
    'leads_assigned', v_assigned_count
  );

EXCEPTION
  WHEN OTHERS THEN
    RAISE WARNING '❌ Error: %', SQLERRM;
    RETURN json_build_object('success', false, 'error', SQLERRM);
END;
$$;

-- ████████████████████████████████████████████████████████████████████
-- STEP 3: GRANT PERMISSIONS
-- ████████████████████████████████████████████████████████████████████

GRANT EXECUTE ON FUNCTION public.approve_purchase_request(UUID) TO authenticated;

-- ████████████████████████████████████████████████████████████████████
-- STEP 4: VERIFY IT WORKED
-- ████████████████████████████████████████████████████████████████████

DO $$
DECLARE
  v_func_def TEXT;
BEGIN
  SELECT pg_get_functiondef(oid) INTO v_func_def
  FROM pg_proc
  WHERE proname = 'approve_purchase_request';

  IF v_func_def LIKE '%UPDATE public.leads%' THEN
    RAISE NOTICE '✅✅✅ SUCCESS! Function now ASSIGNS real leads (UPDATE)';
  ELSIF v_func_def LIKE '%INSERT INTO public.leads%' THEN
    RAISE WARNING '❌❌❌ FAILED! Function still CREATES mock leads (INSERT)';
  ELSE
    RAISE NOTICE '⚠️ Function exists but couldn''t verify';
  END IF;
END $$;

-- ████████████████████████████████████████████████████████████████████
-- DONE! YOU SHOULD SEE: "✅✅✅ SUCCESS! Function now ASSIGNS real leads"
-- ████████████████████████████████████████████████████████████████████

SELECT '
╔═══════════════════════════════════════════════════════════════╗
║  ✅ FUNCTION UPDATED SUCCESSFULLY!                            ║
║                                                               ║
║  From now on, when admin approves a purchase:                ║
║  ❌ Will NOT create mock leads                                ║
║  ✅ Will ASSIGN real existing leads from project             ║
║                                                               ║
║  Next: Clean up existing mock leads (see cleanup script)     ║
╚═══════════════════════════════════════════════════════════════╝
' as result;

