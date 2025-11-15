-- ============================================
-- FIX ADMIN PROFILE - Link to actual auth user
-- Run this in Supabase SQL Editor NOW
-- ============================================

-- STEP 1: Find the actual auth user ID
SELECT 
    id as auth_user_id,
    email as auth_email,
    created_at as auth_created_at
FROM auth.users
WHERE email = 'themartining@gmail.com';

-- Copy the auth_user_id from above, then run Step 2

-- STEP 2: Ensure profile exists with auth user ID and admin role
DO $$
DECLARE
    auth_user_id uuid;
    admin_email text := 'themartining@gmail.com';
BEGIN
    -- Get the actual auth user ID
    SELECT id INTO auth_user_id
    FROM auth.users
    WHERE email = admin_email
    LIMIT 1;

    IF auth_user_id IS NULL THEN
        RAISE EXCEPTION 'Auth user not found with email: %', admin_email;
    END IF;

    RAISE NOTICE 'Found auth user ID: %', auth_user_id;

    -- Upsert profile with auth user ID
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
        'Martin',
        'admin',
        0,
        now(),
        now()
    )
    ON CONFLICT (id) DO UPDATE
    SET 
        email = admin_email,
        role = 'admin',
        name = COALESCE(EXCLUDED.name, profiles.name, 'Martin'),
        updated_at = now();

    RAISE NOTICE 'SUCCESS: Profile created/updated with auth user ID: %', auth_user_id;
END $$;

-- STEP 3: Verify the fix
SELECT 
    au.id as auth_user_id,
    au.email as auth_email,
    p.id as profile_id,
    p.email as profile_email,
    p.role,
    p.name,
    CASE 
        WHEN au.id = p.id THEN '✅ IDs MATCH - This will work!'
        ELSE '❌ IDs DO NOT MATCH - Profile will not load'
    END as status
FROM auth.users au
LEFT JOIN public.profiles p ON p.id = au.id
WHERE au.email = 'themartining@gmail.com';

-- ============================================
-- EXPECTED RESULT:
-- auth_user_id = profile_id (should match!)
-- role = 'admin'
-- status = '✅ IDs MATCH - This will work!'
-- ============================================

