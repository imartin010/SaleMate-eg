-- Fix the rpc_get_shop_projects function
-- Remove the problematic GROUP BY and simplify the function

CREATE OR REPLACE FUNCTION rpc_get_shop_projects()
RETURNS JSON AS $$
DECLARE
    projects_data JSON;
BEGIN
    SELECT json_agg(
        json_build_object(
            'id', id,
            'name', name,
            'developer', developer,
            'region', region,
            'available_leads', available_leads,
            'price_per_lead', price_per_lead,
            'description', description,
            'created_at', created_at
        )
    ) INTO projects_data
    FROM projects 
    WHERE available_leads > 0
    ORDER BY available_leads DESC, name ASC;

    RETURN COALESCE(projects_data, '[]'::json);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
