-- ============================================
-- ENHANCE AGENT TREE MANAGEMENT
-- ============================================
-- This migration enhances the agent hierarchy system with:
-- 1. Fixed lead assignment (includes manager themselves, full tree)
-- 2. Manager assignment with automatic tree movement
-- 3. Manager chain function (unlimited depth)
-- 4. Team tree stats function
-- 5. Bulk manager assignment/removal functions
-- ============================================

-- STEP 1: Update get_user_tree to remove depth limit (unlimited depth)
-- ============================================

CREATE OR REPLACE FUNCTION public.get_user_tree(root_user_id uuid)
RETURNS TABLE (
    user_id uuid,
    user_name text,
    user_email text,
    user_phone text,
    user_role text,
    manager_id uuid,
    depth integer
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    RETURN QUERY
    WITH RECURSIVE user_tree AS (
        -- Base case: the root user
        SELECT 
            p.id as user_id,
            p.name as user_name,
            p.email as user_email,
            p.phone as user_phone,
            p.role as user_role,
            p.manager_id,
            0 as depth
        FROM public.profiles p
        WHERE p.id = root_user_id
        
        UNION ALL
        
        -- Recursive case: users managed by users in the tree
        SELECT 
            p.id as user_id,
            p.name as user_name,
            p.email as user_email,
            p.phone as user_phone,
            p.role as user_role,
            p.manager_id,
            ut.depth + 1 as depth
        FROM public.profiles p
        INNER JOIN user_tree ut ON p.manager_id = ut.user_id
        WHERE ut.depth < 1000 -- Prevent infinite recursion (very high limit for practical unlimited)
    )
    SELECT * FROM user_tree
    ORDER BY depth, user_name;
END;
$$;

-- STEP 2: Fix assign_leads_to_team_member to use full tree and include manager
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
  v_team_ids UUID[];
BEGIN
  -- Get all user IDs in manager's tree (recursive, includes manager themselves)
  SELECT public.get_team_user_ids(p_manager_id) INTO v_team_ids;
  
  -- Verify assignee exists
  SELECT id, name INTO v_assignee_profile
  FROM public.profiles 
  WHERE id = p_assignee_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Assignee not found';
  END IF;

  -- Check if assignee is in the manager's tree (including manager themselves)
  IF p_assignee_id != p_manager_id AND NOT (p_assignee_id = ANY(v_team_ids)) THEN
    RAISE EXCEPTION 'Assignee must be in manager team tree';
  END IF;

  -- Update leads (only those owned by the manager or in their tree)
  UPDATE public.leads 
  SET 
    assigned_to_id = p_assignee_id, 
    assigned_at = NOW(),
    updated_at = NOW()
  WHERE id = ANY(p_lead_ids)
    AND (
      buyer_user_id = p_manager_id 
      OR owner_id = p_manager_id
      OR buyer_user_id = ANY(v_team_ids)
      OR owner_id = ANY(v_team_ids)
    );

  GET DIAGNOSTICS v_updated_count = ROW_COUNT;

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

-- STEP 3: Create assign_manager function with tree movement
-- ============================================

CREATE OR REPLACE FUNCTION assign_manager(
  p_user_id UUID,
  p_manager_id UUID,
  p_assigner_id UUID
)
RETURNS JSONB AS $$
DECLARE
  v_user_role TEXT;
  v_assigner_role TEXT;
  v_cycle_check BOOLEAN;
  v_user_is_manager BOOLEAN;
  v_tree_moved_count INT := 0;
BEGIN
  -- Get roles
  SELECT role INTO v_user_role FROM public.profiles WHERE id = p_user_id;
  SELECT role INTO v_assigner_role FROM public.profiles WHERE id = p_assigner_id;
  
  -- Only admins can assign managers
  IF v_assigner_role NOT IN ('admin', 'support') THEN
    RAISE EXCEPTION 'Only admins and support can assign managers';
  END IF;
  
  -- Prevent self-assignment
  IF p_user_id = p_manager_id THEN
    RAISE EXCEPTION 'User cannot be their own manager';
  END IF;
  
  -- Prevent cycles: check if manager would be in user's tree
  SELECT p_manager_id = ANY(public.get_team_user_ids(p_user_id)) INTO v_cycle_check;
  
  IF v_cycle_check THEN
    RAISE EXCEPTION 'Cannot create circular hierarchy: manager is already in user tree';
  END IF;
  
  -- Check if user is a manager (has direct reports)
  SELECT EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE manager_id = p_user_id
  ) INTO v_user_is_manager;
  
  -- Update manager_id for the user only
  -- The user's direct reports remain under them (their manager_id stays as p_user_id)
  UPDATE public.profiles
  SET manager_id = p_manager_id,
      updated_at = NOW()
  WHERE id = p_user_id;
  
  -- Note: When assigning a manager to another manager:
  -- - The manager's direct reports stay under them (manager_id = p_user_id remains)
  -- - Only the manager themselves gets a new manager (manager_id = p_manager_id)
  -- - This creates a hierarchy: Users -> Manager A -> Manager B
  
  -- Count how many users remain under this manager (for info)
  IF v_user_is_manager THEN
    SELECT COUNT(*) INTO v_tree_moved_count
    FROM public.profiles
    WHERE manager_id = p_user_id;
  END IF;
  
  RETURN jsonb_build_object(
    'success', true,
    'message', 'Manager assigned successfully',
    'tree_preserved', v_user_is_manager,
    'direct_reports_count', v_tree_moved_count
  );
  
EXCEPTION
  WHEN OTHERS THEN
    RAISE EXCEPTION 'Manager assignment failed: %', SQLERRM;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

GRANT EXECUTE ON FUNCTION assign_manager(UUID, UUID, UUID) TO authenticated;

-- STEP 4: Create get_manager_chain function (unlimited depth)
-- ============================================

CREATE OR REPLACE FUNCTION get_manager_chain(p_user_id UUID)
RETURNS TABLE (
  user_id UUID,
  user_name TEXT,
  user_email TEXT,
  user_role TEXT,
  level INTEGER
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  WITH RECURSIVE manager_chain AS (
    -- Base case: start with the user
    SELECT 
      p.id as user_id,
      p.name as user_name,
      p.email as user_email,
      p.role as user_role,
      p.manager_id,
      0 as level
    FROM public.profiles p
    WHERE p.id = p_user_id
    
    UNION ALL
    
    -- Recursive case: get the manager of the current user in chain
    SELECT 
      p.id as user_id,
      p.name as user_name,
      p.email as user_email,
      p.role as user_role,
      p.manager_id,
      mc.level + 1 as level
    FROM public.profiles p
    INNER JOIN manager_chain mc ON p.id = mc.manager_id
    WHERE mc.manager_id IS NOT NULL
      AND mc.level < 1000 -- Prevent infinite recursion (very high limit)
  )
  SELECT 
    user_id,
    user_name,
    user_email,
    user_role,
    level
  FROM manager_chain
  ORDER BY level;
END;
$$;

GRANT EXECUTE ON FUNCTION get_manager_chain(UUID) TO authenticated;

-- STEP 5: Create get_team_tree_stats function
-- ============================================

CREATE OR REPLACE FUNCTION get_team_tree_stats(p_manager_id UUID)
RETURNS JSONB AS $$
DECLARE
  v_tree_ids UUID[];
  v_total_users INT;
  v_direct_reports INT;
  v_owned_leads INT;
  v_assigned_leads INT;
  v_max_depth INT;
BEGIN
  -- Get all user IDs in the tree (including manager)
  SELECT public.get_team_user_ids(p_manager_id) INTO v_tree_ids;
  
  -- Count total users in tree
  SELECT COUNT(*) INTO v_total_users
  FROM unnest(v_tree_ids) AS user_id;
  
  -- Count direct reports
  SELECT COUNT(*) INTO v_direct_reports
  FROM public.profiles
  WHERE manager_id = p_manager_id;
  
  -- Count leads owned by tree
  SELECT COUNT(*) INTO v_owned_leads
  FROM public.leads
  WHERE buyer_user_id = ANY(v_tree_ids)
     OR owner_id = ANY(v_tree_ids);
  
  -- Count leads assigned to tree
  SELECT COUNT(*) INTO v_assigned_leads
  FROM public.leads
  WHERE assigned_to_id = ANY(v_tree_ids);
  
  -- Get max depth
  SELECT COALESCE(MAX(depth), 0) INTO v_max_depth
  FROM public.get_user_tree(p_manager_id);
  
  RETURN jsonb_build_object(
    'total_users', v_total_users,
    'direct_reports', v_direct_reports,
    'owned_leads', v_owned_leads,
    'assigned_leads', v_assigned_leads,
    'max_depth', v_max_depth
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

GRANT EXECUTE ON FUNCTION get_team_tree_stats(UUID) TO authenticated;

-- STEP 6: Create bulk_assign_manager function
-- ============================================

CREATE OR REPLACE FUNCTION bulk_assign_manager(
  p_user_ids UUID[],
  p_manager_id UUID,
  p_assigner_id UUID
)
RETURNS JSONB AS $$
DECLARE
  v_assigner_role TEXT;
  v_user_id UUID;
  v_result JSONB;
  v_success_count INT := 0;
  v_fail_count INT := 0;
  v_errors TEXT[] := ARRAY[]::TEXT[];
BEGIN
  -- Get assigner role
  SELECT role INTO v_assigner_role FROM public.profiles WHERE id = p_assigner_id;
  
  -- Only admins can perform bulk operations
  IF v_assigner_role NOT IN ('admin', 'support') THEN
    RAISE EXCEPTION 'Only admins and support can perform bulk manager assignments';
  END IF;
  
  -- Process each user
  FOREACH v_user_id IN ARRAY p_user_ids
  LOOP
    BEGIN
      -- Call assign_manager for each user
      SELECT assign_manager(v_user_id, p_manager_id, p_assigner_id) INTO v_result;
      
      IF (v_result->>'success')::boolean THEN
        v_success_count := v_success_count + 1;
      ELSE
        v_fail_count := v_fail_count + 1;
        v_errors := array_append(v_errors, format('User %s: %s', v_user_id, v_result->>'message'));
      END IF;
    EXCEPTION
      WHEN OTHERS THEN
        v_fail_count := v_fail_count + 1;
        v_errors := array_append(v_errors, format('User %s: %s', v_user_id, SQLERRM));
    END;
  END LOOP;
  
  RETURN jsonb_build_object(
    'success', true,
    'total', array_length(p_user_ids, 1),
    'success_count', v_success_count,
    'fail_count', v_fail_count,
    'errors', v_errors
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

GRANT EXECUTE ON FUNCTION bulk_assign_manager(UUID[], UUID, UUID) TO authenticated;

-- STEP 7: Create bulk_remove_manager function
-- ============================================

CREATE OR REPLACE FUNCTION bulk_remove_manager(
  p_user_ids UUID[],
  p_assigner_id UUID
)
RETURNS JSONB AS $$
DECLARE
  v_assigner_role TEXT;
  v_user_id UUID;
  v_user_is_manager BOOLEAN;
  v_updated_count INT;
BEGIN
  -- Get assigner role
  SELECT role INTO v_assigner_role FROM public.profiles WHERE id = p_assigner_id;
  
  -- Only admins can perform bulk operations
  IF v_assigner_role NOT IN ('admin', 'support') THEN
    RAISE EXCEPTION 'Only admins and support can perform bulk manager removal';
  END IF;
  
  -- Remove manager from all specified users
  UPDATE public.profiles
  SET manager_id = NULL,
      updated_at = NOW()
  WHERE id = ANY(p_user_ids);
  
  GET DIAGNOSTICS v_updated_count = ROW_COUNT;
  
  -- Note: If any of these users are managers, their trees become orphaned
  -- This is intentional - admin should reassign the tree manually if needed
  
  RETURN jsonb_build_object(
    'success', true,
    'updated_count', v_updated_count,
    'message', format('Manager removed from %s user(s)', v_updated_count)
  );
  
EXCEPTION
  WHEN OTHERS THEN
    RAISE EXCEPTION 'Bulk manager removal failed: %', SQLERRM;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

GRANT EXECUTE ON FUNCTION bulk_remove_manager(UUID[], UUID) TO authenticated;

-- STEP 8: Verification
-- ============================================

SELECT '✅ Agent tree management functions created successfully!' as status;

