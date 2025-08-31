-- Migration to add role management functionality
-- This allows changing user roles from user to admin

-- Function to update user role (admin only)
CREATE OR REPLACE FUNCTION update_user_role(
    target_user_id UUID,
    new_role TEXT
)
RETURNS JSONB AS $$
DECLARE
    current_user_role TEXT;
    result JSONB;
BEGIN
    -- Get the current user's role
    SELECT role INTO current_user_role
    FROM profiles 
    WHERE id = auth.uid();
    
    -- Only admins can change roles
    IF current_user_role != 'admin' THEN
        RETURN jsonb_build_object(
            'success', false,
            'error', 'Only administrators can change user roles'
        );
    END IF;
    
    -- Validate the new role
    IF new_role NOT IN ('user', 'manager', 'support', 'admin') THEN
        RETURN jsonb_build_object(
            'success', false,
            'error', 'Invalid role. Must be one of: user, manager, support, admin'
        );
    END IF;
    
    -- Update the user's role
    UPDATE profiles 
    SET role = new_role::user_role, 
        updated_at = NOW()
    WHERE id = target_user_id;
    
    -- Check if the update was successful
    IF FOUND THEN
        RETURN jsonb_build_object(
            'success', true,
            'message', 'User role updated successfully',
            'user_id', target_user_id,
            'new_role', new_role
        );
    ELSE
        RETURN jsonb_build_object(
            'success', false,
            'error', 'User not found'
        );
    END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to make a user admin (for initial setup)
CREATE OR REPLACE FUNCTION make_user_admin(
    user_email TEXT
)
RETURNS JSONB AS $$
DECLARE
    target_user_id UUID;
    result JSONB;
BEGIN
    -- Find the user by email
    SELECT id INTO target_user_id
    FROM profiles 
    WHERE email = user_email;
    
    IF target_user_id IS NULL THEN
        RETURN jsonb_build_object(
            'success', false,
            'error', 'User not found with email: ' || user_email
        );
    END IF;
    
    -- Update the user's role to admin
    UPDATE profiles 
    SET role = 'admin', 
        updated_at = NOW()
    WHERE id = target_user_id;
    
    RETURN jsonb_build_object(
        'success', true,
        'message', 'User promoted to admin successfully',
        'user_id', target_user_id,
        'email', user_email,
        'new_role', 'admin'
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permissions
GRANT EXECUTE ON FUNCTION update_user_role(UUID, TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION make_user_admin(TEXT) TO authenticated;

-- Example usage (commented out):
-- SELECT make_user_admin('your-email@example.com');
