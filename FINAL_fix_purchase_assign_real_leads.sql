-- ⭐ FINAL FIX: Assign Real Existing Leads (Not Mock Leads)
-- This REPLACES the approve_purchase_request function
-- Run this NOW in Supabase SQL Editor

-- Step 1: Drop old function
DROP FUNCTION IF EXISTS public.approve_purchase_request(UUID);

-- Step 2: Create new function that assigns REAL existing leads
CREATE OR REPLACE FUNCTION public.approve_purchase_request(request_id UUID)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_request RECORD;
  v_project RECORD;
  v_user_profile RECORD;
  lead_quantity INTEGER;
  v_available_unassigned_leads INTEGER;
  v_assigned_leads UUID[];
  v_assigned_count INTEGER := 0;
BEGIN
  -- Get purchase request details with lock
  SELECT * INTO v_request
  FROM public.purchase_requests
  WHERE id = request_id AND status = 'pending'
  FOR UPDATE;

  -- Validate request exists
  IF NOT FOUND THEN
    RETURN json_build_object(
      'success', false,
      'error', 'Purchase request not found or already processed'
    );
  END IF;

  lead_quantity := v_request.quantity;

  -- Get project details with lock
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

  -- Get user profile (for logging)
  SELECT name, email INTO v_user_profile
  FROM public.profiles
  WHERE id = v_request.user_id;

  -- CRITICAL: Check available unassigned leads in database
  SELECT COUNT(*) INTO v_available_unassigned_leads
  FROM public.leads
  WHERE project_id = v_request.project_id
    AND (buyer_user_id IS NULL OR buyer_user_id = '00000000-0000-0000-0000-000000000000'::UUID)
    AND stage = 'New Lead';

  -- Log current state
  RAISE NOTICE 'Purchase Request: % leads for project "%"', lead_quantity, v_project.name;
  RAISE NOTICE 'Available unassigned leads in DB: %', v_available_unassigned_leads;
  RAISE NOTICE 'Project counter says: %', v_project.available_leads;

  -- Validate enough unassigned leads exist
  IF v_available_unassigned_leads < lead_quantity THEN
    RETURN json_build_object(
      'success', false,
      'error', format(
        'Not enough unassigned leads in project "%s". Available: %s, Requested: %s. Please upload more leads to this project first.',
        v_project.name,
        v_available_unassigned_leads,
        lead_quantity
      )
    );
  END IF;

  -- ⭐ ASSIGN REAL EXISTING LEADS (NOT CREATE NEW ONES)
  -- This updates existing leads to assign them to the buyer
  WITH selected_leads AS (
    SELECT id
    FROM public.leads
    WHERE project_id = v_request.project_id
      AND (buyer_user_id IS NULL OR buyer_user_id = '00000000-0000-0000-0000-000000000000'::UUID)
      AND stage = 'New Lead'
    ORDER BY created_at ASC  -- Oldest leads first (FIFO)
    LIMIT lead_quantity
    FOR UPDATE SKIP LOCKED
  )
  UPDATE public.leads
  SET 
    buyer_user_id = v_request.user_id,
    updated_at = NOW(),
    stage = 'New Lead',
    source = COALESCE(source, 'Purchase')  -- Keep original source if exists
  FROM selected_leads
  WHERE leads.id = selected_leads.id
  RETURNING leads.id INTO v_assigned_leads;

  -- Count how many were actually assigned
  GET DIAGNOSTICS v_assigned_count = ROW_COUNT;

  RAISE NOTICE 'Successfully assigned % real leads to user %', v_assigned_count, v_user_profile.name;

  -- Validate all requested leads were assigned
  IF v_assigned_count < lead_quantity THEN
    RAISE EXCEPTION 'Failed to assign all requested leads. Only % of % leads were assigned. Transaction rolled back.',
      v_assigned_count, lead_quantity;
  END IF;

  -- Update project's available leads counter
  UPDATE public.projects
  SET 
    available_leads = available_leads - lead_quantity,
    updated_at = NOW()
  WHERE id = v_request.project_id;

  -- Mark purchase request as approved
  UPDATE public.purchase_requests
  SET 
    status = 'approved',
    approved_by = auth.uid(),
    approved_at = NOW(),
    updated_at = NOW()
  WHERE id = request_id;

  -- Return detailed success response
  RETURN json_build_object(
    'success', true,
    'message', format('%s existing real leads assigned to %s', v_assigned_count, v_user_profile.name),
    'details', json_build_object(
      'leads_assigned', v_assigned_count,
      'buyer_name', v_user_profile.name,
      'buyer_email', v_user_profile.email,
      'project_name', v_project.name,
      'remaining_available', v_project.available_leads - lead_quantity
    )
  );

EXCEPTION
  WHEN OTHERS THEN
    -- Log error and return
    RAISE WARNING 'Error in approve_purchase_request: %', SQLERRM;
    RETURN json_build_object(
      'success', false,
      'error', SQLERRM
    );
END;
$$;

-- Grant permissions
GRANT EXECUTE ON FUNCTION public.approve_purchase_request(UUID) TO authenticated;

-- Add comment
COMMENT ON FUNCTION public.approve_purchase_request(UUID) IS 
'Assigns existing unassigned leads from project inventory to buyer.
Does NOT create new leads - only assigns real uploaded leads.
Validates availability before assignment.';

-- Test query: Check if projects have unassigned leads
DO $$
DECLARE
  v_result RECORD;
BEGIN
  RAISE NOTICE '========================================';
  RAISE NOTICE 'Checking Projects with Unassigned Leads';
  RAISE NOTICE '========================================';
  
  FOR v_result IN
    SELECT 
      p.name,
      p.available_leads as counter,
      COUNT(l.id) as unassigned_in_db
    FROM public.projects p
    LEFT JOIN public.leads l ON (
      l.project_id = p.id 
      AND (l.buyer_user_id IS NULL OR l.buyer_user_id = '00000000-0000-0000-0000-000000000000'::UUID)
      AND l.stage = 'New Lead'
    )
    GROUP BY p.id, p.name, p.available_leads
    HAVING COUNT(l.id) > 0
    ORDER BY p.name
  LOOP
    RAISE NOTICE 'Project: % | Counter: % | Unassigned: %', 
      v_result.name, 
      v_result.counter, 
      v_result.unassigned_in_db;
  END LOOP;
END $$;

SELECT '✅ Function updated! Now assigns REAL existing leads (not mock).' as status;

