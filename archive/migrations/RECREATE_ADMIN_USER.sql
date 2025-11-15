-- ============================================
-- RECREATE ADMIN USER - Complete Setup
-- This creates both the auth user and profile with matching IDs
-- ============================================

-- IMPORTANT: This requires service_role key or running as database admin
-- If you can't run this directly, use Option 2 (create via Supabase Auth API)

-- ============================================
-- OPTION 1: Direct Database Creation (Service Role Required)
-- ============================================

DO $$
DECLARE
    admin_email text := 'themartining@gmail.com';
    admin_password text := 'YourSecurePassword123!'; -- CHANGE THIS!
    admin_name text := 'Martin';
    new_user_id uuid;
BEGIN
    -- Step 1: Create auth user
    -- NOTE: This requires service_role or admin privileges
    -- If this fails, use Option 2 instead
    
    INSERT INTO auth.users (
        id,
        instance_id,
        email,
        encrypted_password,
        email_confirmed_at,
        created_at,
        updated_at,
        raw_app_meta_data,
        raw_user_meta_data,
        is_super_admin,
        role
    ) VALUES (
        gen_random_uuid(), -- This will be the user ID
        '00000000-0000-0000-0000-000000000000',
        admin_email,
        crypt(admin_password, gen_salt('bf')), -- Encrypt password
        now(), -- Email confirmed
        now(),
        now(),
        '{"provider":"email","providers":["email"]}'::jsonb,
        jsonb_build_object('name', admin_name, 'email', admin_email),
        false,
        'authenticated'
    )
    RETURNING id INTO new_user_id;

    RAISE NOTICE 'Created auth user with ID: %', new_user_id;

    -- Step 2: Create profile with matching ID
    INSERT INTO public.profiles (
        id,
        email,
        name,
        role,
        wallet_balance,
        created_at,
        updated_at
    ) VALUES (
        new_user_id, -- Use the same ID from auth.users
        admin_email,
        admin_name,
        'admin', -- Admin role
        0,
        now(),
        now()
    );

    RAISE NOTICE 'Created profile with ID: %', new_user_id;
    RAISE NOTICE 'SUCCESS: Admin user created!';
    RAISE NOTICE 'User ID: %', new_user_id;
    RAISE NOTICE 'Email: %', admin_email;
    RAISE NOTICE 'Role: admin';
    
EXCEPTION
    WHEN OTHERS THEN
        RAISE NOTICE 'ERROR: % - %', SQLSTATE, SQLERRM;
        RAISE NOTICE 'If you got permission error, use Option 2 instead';
END $$;

-- ============================================
-- OPTION 2: Via Supabase Auth API (RECOMMENDED)
-- ============================================
-- This is the proper way - use the Supabase Auth API
-- You can do this via:
-- 1. Supabase Dashboard → Authentication → Add User
-- 2. Or use the signup endpoint in your app
-- 3. Then run the profile creation script below

-- ============================================
-- OPTION 3: Profile Creation Only
-- (Run this AFTER creating auth user via Supabase Dashboard)
-- ============================================

-- After creating the auth user via Supabase Dashboard:
-- 1. Go to Authentication → Users → Add User
-- 2. Enter email: themartining@gmail.com
-- 3. Set password
-- 4. Auto-confirm email
-- 5. Then run this script:

DO $$
DECLARE
    auth_user_id uuid;
    admin_email text := 'themartining@gmail.com';
    admin_name text := 'Martin';
BEGIN
    -- Get the auth user ID
    SELECT id INTO auth_user_id
    FROM auth.users
    WHERE email = admin_email
    LIMIT 1;

    IF auth_user_id IS NULL THEN
        RAISE EXCEPTION 'Auth user not found. Please create user first via Supabase Dashboard → Authentication → Add User';
    END IF;

    RAISE NOTICE 'Found auth user ID: %', auth_user_id;

    -- Create profile with matching ID
    INSERT INTO public.profiles (
        id,
        email,
        name,
        role,
        wallet_balance,
        created_at,
        updated_at
    ) VALUES (
        auth_user_id,
        admin_email,
        admin_name,
        'admin',
        0,
        now(),
        now()
    )
    ON CONFLICT (id) DO UPDATE
    SET 
        email = admin_email,
        role = 'admin',
        name = admin_name,
        updated_at = now();

    RAISE NOTICE 'SUCCESS: Profile created with admin role!';
    RAISE NOTICE 'User ID: %', auth_user_id;
    RAISE NOTICE 'Email: %', admin_email;
    RAISE NOTICE 'Role: admin';
END $$;

-- ============================================
-- VERIFICATION
-- ============================================

SELECT 
    au.id as auth_user_id,
    au.email as auth_email,
    au.email_confirmed_at,
    au.created_at as auth_created_at,
    p.id as profile_id,
    p.email as profile_email,
    p.name,
    p.role,
    CASE 
        WHEN au.id = p.id THEN '✅ IDs MATCH - Perfect!'
        ELSE '❌ IDs DO NOT MATCH - This will fail'
    END as status
FROM auth.users au
LEFT JOIN public.profiles p ON p.id = au.id
WHERE au.email = 'themartining@gmail.com';

-- ============================================
-- EXPECTED RESULT:
-- - auth_user_id = profile_id (must match!)
-- - role = 'admin'
-- - status = '✅ IDs MATCH - Perfect!'
-- ============================================

