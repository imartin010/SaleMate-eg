-- Fix the shop projects function completely
-- Drop and recreate to ensure clean state

DROP FUNCTION IF EXISTS rpc_get_shop_projects();

CREATE OR REPLACE FUNCTION rpc_get_shop_projects()
RETURNS SETOF projects AS $$
BEGIN
    RETURN QUERY
    SELECT * FROM projects 
    WHERE available_leads > 0
    ORDER BY available_leads DESC, name ASC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
