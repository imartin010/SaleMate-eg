-- Fix missing functions that caused the error
-- Run this in Supabase SQL Editor

-- Create the missing rpc_team_user_ids function
CREATE OR REPLACE FUNCTION public.rpc_team_user_ids(root_user_id uuid)
RETURNS TABLE(user_id uuid)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  WITH RECURSIVE team_tree AS (
    -- Base case: the root user
    SELECT id FROM public.profiles WHERE id = root_user_id
    UNION ALL
    -- Recursive case: users managed by someone in the tree
    SELECT p.id 
    FROM public.profiles p
    INNER JOIN team_tree tt ON p.manager_id = tt.id
  )
  SELECT tt.id FROM team_tree tt;
END;
$$;

-- Grant execute permission
GRANT EXECUTE ON FUNCTION public.rpc_team_user_ids(uuid) TO authenticated;

-- Test the function
SELECT 'Function created successfully' as status;

-- Test the verification queries that were failing
SELECT 
  'profiles' as table_name, COUNT(*) as count FROM public.profiles
UNION ALL
SELECT 'projects', COUNT(*) FROM public.projects
UNION ALL
SELECT 'leads', COUNT(*) FROM public.leads
UNION ALL
SELECT 'lead_batches', COUNT(*) FROM public.lead_batches
UNION ALL
SELECT 'lead_purchase_requests', COUNT(*) FROM public.lead_purchase_requests
UNION ALL
SELECT 'partners', COUNT(*) FROM public.partners
UNION ALL
SELECT 'salemate-inventory', COUNT(*) FROM public."salemate-inventory";

-- Show lead availability
SELECT * FROM public.lead_availability ORDER BY available_leads DESC;

-- Show partner commissions view
SELECT compound_name, active_partners_count, highest_commission_rate FROM public.partner_commissions_view;

-- Show profiles by role
SELECT role, COUNT(*) as count FROM public.profiles GROUP BY role ORDER BY count DESC;
