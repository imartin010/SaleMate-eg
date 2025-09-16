-- Simple lead request view that works with any projects table structure
-- First, let's create a basic view without the problematic columns

CREATE OR REPLACE VIEW lead_request_details AS
SELECT 
    lr.id,
    lr.user_id,
    lr.project_id,
    p.name as project_name,
    'Unknown' as developer,  -- Will be updated once we know the correct column
    'Unknown' as region,     -- Will be updated once we know the correct column
    lr.requested_quantity,
    lr.price_per_lead,
    lr.total_amount,
    lr.status,
    lr.payment_status,
    lr.user_notes,
    lr.admin_notes,
    lr.created_at,
    lr.updated_at,
    lr.approved_at,
    lr.fulfilled_at,
    au.email,
    COALESCE(au.raw_user_meta_data->>'first_name', '') as first_name,
    COALESCE(au.raw_user_meta_data->>'last_name', '') as last_name
FROM lead_requests lr
JOIN projects p ON lr.project_id = p.id
LEFT JOIN auth.users au ON lr.user_id = au.id;
