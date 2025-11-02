-- ============================================
-- LEAD ASSIGNMENT RPC FOR MANAGER TEAM
-- ============================================

CREATE OR REPLACE FUNCTION assign_leads_to_team_member(
  p_lead_ids UUID[],
  p_manager_id UUID,
  p_assignee_id UUID
) 
RETURNS JSONB AS $$
DECLARE
  v_updated_count INT;
  v_assignee_profile RECORD;
BEGIN
  -- Verify assignee exists and is under manager's tree
  SELECT id, name, manager_id INTO v_assignee_profile
  FROM public.profiles 
  WHERE id = p_assignee_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Assignee not found';
  END IF;

  IF v_assignee_profile.manager_id != p_manager_id THEN
    RAISE EXCEPTION 'Assignee must be in manager team. Assignee manager_id: %, Expected: %', 
      v_assignee_profile.manager_id, p_manager_id;
  END IF;

  -- Update leads (only those owned by the manager)
  UPDATE public.leads 
  SET 
    assigned_to_id = p_assignee_id, 
    assigned_at = NOW(),
    updated_at = NOW()
  WHERE id = ANY(p_lead_ids)
    AND (buyer_user_id = p_manager_id OR owner_id = p_manager_id);

  GET DIAGNOSTICS v_updated_count = ROW_COUNT;

  -- Return result
  RETURN jsonb_build_object(
    'success', true,
    'updated_count', v_updated_count,
    'assignee_name', v_assignee_profile.name
  );
  
EXCEPTION
  WHEN OTHERS THEN
    RAISE EXCEPTION 'Lead assignment failed: %', SQLERRM;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permission
GRANT EXECUTE ON FUNCTION assign_leads_to_team_member(UUID[], UUID, UUID) TO authenticated;

-- ============================================
-- UNASSIGN LEADS (Return to manager)
-- ============================================

CREATE OR REPLACE FUNCTION unassign_leads(
  p_lead_ids UUID[],
  p_manager_id UUID
) 
RETURNS JSONB AS $$
DECLARE
  v_updated_count INT;
BEGIN
  -- Update leads to remove assignment
  UPDATE public.leads 
  SET 
    assigned_to_id = NULL, 
    assigned_at = NULL,
    updated_at = NOW()
  WHERE id = ANY(p_lead_ids)
    AND (buyer_user_id = p_manager_id OR owner_id = p_manager_id);

  GET DIAGNOSTICS v_updated_count = ROW_COUNT;

  RETURN jsonb_build_object(
    'success', true,
    'updated_count', v_updated_count
  );
  
EXCEPTION
  WHEN OTHERS THEN
    RAISE EXCEPTION 'Lead unassignment failed: %', SQLERRM;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

GRANT EXECUTE ON FUNCTION unassign_leads(UUID[], UUID) TO authenticated;

