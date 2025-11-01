-- ============================================
-- MANAGER HIERARCHY RPC FUNCTIONS
-- ============================================
-- This migration creates RPC functions for:
-- 1. Getting user tree (manager -> users)
-- 2. Checking if user can see another user
-- 3. Lead purchase permissions
-- ============================================

-- STEP 1: Get all users in a manager's tree (recursive)
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
        WHERE ut.depth < 10 -- Prevent infinite recursion
    )
    SELECT * FROM user_tree
    ORDER BY depth, user_name;
END;
$$;

-- STEP 2: Get all user IDs in a manager's tree (for filtering)
-- ============================================

CREATE OR REPLACE FUNCTION public.get_team_user_ids(root_user_id uuid)
RETURNS uuid[]
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    user_ids uuid[];
BEGIN
    -- Get all user IDs in the tree
    SELECT ARRAY_AGG(user_id)
    INTO user_ids
    FROM public.get_user_tree(root_user_id);
    
    RETURN COALESCE(user_ids, ARRAY[]::uuid[]);
END;
$$;

-- STEP 3: Check if user can view another user's data
-- ============================================

CREATE OR REPLACE FUNCTION public.can_user_view(
    viewer_id uuid,
    target_id uuid
)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
STABLE
SET search_path = public
AS $$
DECLARE
    viewer_role text;
    team_ids uuid[];
BEGIN
    -- Get viewer's role
    SELECT role INTO viewer_role
    FROM public.profiles
    WHERE id = viewer_id;
    
    -- Admins and support can see everyone
    IF viewer_role IN ('admin', 'support') THEN
        RETURN true;
    END IF;
    
    -- Users can see themselves
    IF viewer_id = target_id THEN
        RETURN true;
    END IF;
    
    -- Managers can see their team
    IF viewer_role = 'manager' THEN
        team_ids := public.get_team_user_ids(viewer_id);
        RETURN target_id = ANY(team_ids);
    END IF;
    
    -- Regular users can only see themselves
    RETURN false;
END;
$$;

-- STEP 4: Check if user can purchase leads for another user
-- ============================================

CREATE OR REPLACE FUNCTION public.can_purchase_for(
    purchaser_id uuid,
    target_id uuid
)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
STABLE
SET search_path = public
AS $$
DECLARE
    purchaser_role text;
    team_ids uuid[];
BEGIN
    -- Get purchaser's role
    SELECT role INTO purchaser_role
    FROM public.profiles
    WHERE id = purchaser_id;
    
    -- Admins can purchase for anyone
    IF purchaser_role = 'admin' THEN
        RETURN true;
    END IF;
    
    -- Users can purchase for themselves
    IF purchaser_id = target_id THEN
        RETURN true;
    END IF;
    
    -- Managers can purchase for their team
    IF purchaser_role = 'manager' THEN
        team_ids := public.get_team_user_ids(purchaser_id);
        RETURN target_id = ANY(team_ids);
    END IF;
    
    -- Support cannot purchase
    -- Regular users can only purchase for themselves
    RETURN false;
END;
$$;

-- STEP 5: Get user's accessible leads (respecting hierarchy)
-- ============================================

CREATE OR REPLACE FUNCTION public.get_accessible_leads(for_user_id uuid)
RETURNS TABLE (
    lead_id uuid,
    client_name text,
    client_phone text,
    project_id uuid,
    buyer_user_id uuid,
    assigned_to_id uuid,
    stage text,
    created_at timestamptz
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    user_role text;
    team_ids uuid[];
BEGIN
    -- Get user's role
    SELECT role INTO user_role
    FROM public.profiles
    WHERE id = for_user_id;
    
    -- Admins and support see all leads
    IF user_role IN ('admin', 'support') THEN
        RETURN QUERY
        SELECT 
            l.id as lead_id,
            l.client_name,
            l.client_phone,
            l.project_id,
            l.buyer_user_id,
            l.assigned_to_id,
            l.stage,
            l.created_at
        FROM public.leads l
        ORDER BY l.created_at DESC;
        RETURN;
    END IF;
    
    -- Managers see their team's leads
    IF user_role = 'manager' THEN
        team_ids := public.get_team_user_ids(for_user_id);
        
        RETURN QUERY
        SELECT 
            l.id as lead_id,
            l.client_name,
            l.client_phone,
            l.project_id,
            l.buyer_user_id,
            l.assigned_to_id,
            l.stage,
            l.created_at
        FROM public.leads l
        WHERE l.buyer_user_id = ANY(team_ids)
           OR l.assigned_to_id = ANY(team_ids)
        ORDER BY l.created_at DESC;
        RETURN;
    END IF;
    
    -- Regular users see only their own leads
    RETURN QUERY
    SELECT 
        l.id as lead_id,
        l.client_name,
        l.client_phone,
        l.project_id,
        l.buyer_user_id,
        l.assigned_to_id,
        l.stage,
        l.created_at
    FROM public.leads l
    WHERE l.buyer_user_id = for_user_id
       OR l.assigned_to_id = for_user_id
    ORDER BY l.created_at DESC;
END;
$$;

-- ============================================
-- GRANT PERMISSIONS
-- ============================================

-- Grant execute permissions to authenticated users
GRANT EXECUTE ON FUNCTION public.get_user_tree(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_team_user_ids(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.can_user_view(uuid, uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.can_purchase_for(uuid, uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_accessible_leads(uuid) TO authenticated;

-- ============================================
-- VERIFICATION
-- ============================================

-- Test the functions exist
SELECT 
    routine_name,
    routine_type
FROM information_schema.routines
WHERE routine_schema = 'public'
AND routine_name IN (
    'get_user_tree',
    'get_team_user_ids',
    'can_user_view',
    'can_purchase_for',
    'get_accessible_leads'
)
ORDER BY routine_name;

-- ============================================
-- SUCCESS MESSAGE
-- ============================================

SELECT '✅ Manager hierarchy RPC functions created!' as status;

