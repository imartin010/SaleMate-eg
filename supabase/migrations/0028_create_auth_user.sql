-- Create auth user that matches the frontend login
-- This creates a user account for testing the complete auth flow

-- Create a user in auth.users table first
DO $$
DECLARE
    user_id UUID := 'aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee';
    user_email TEXT := 'admin@sm.com';
    user_password TEXT := 'admin123';
BEGIN
    -- Insert into auth.users
    INSERT INTO auth.users (
        id,
        email,
        encrypted_password,
        email_confirmed_at,
        created_at,
        updated_at,
        raw_user_meta_data,
        role,
        aud
    ) VALUES (
        user_id,
        user_email,
        crypt(user_password, gen_salt('bf')),
        NOW(),
        NOW(),
        NOW(),
        '{"name": "Ahmed Hassan"}',
        'authenticated',
        'authenticated'
    ) ON CONFLICT (email) DO UPDATE SET
        encrypted_password = crypt(user_password, gen_salt('bf')),
        updated_at = NOW();

    -- Insert into profiles
    INSERT INTO profiles (id, name, email, role, manager_id, is_banned, created_at, updated_at) 
    VALUES (user_id, 'Ahmed Hassan', user_email, 'admin', NULL, false, NOW(), NOW())
    ON CONFLICT (id) DO UPDATE SET
        name = 'Ahmed Hassan',
        role = 'admin',
        updated_at = NOW();

EXCEPTION
    WHEN OTHERS THEN
        RAISE NOTICE 'Error creating user: %', SQLERRM;
END $$;
