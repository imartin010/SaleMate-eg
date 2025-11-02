-- ============================================
-- LINK ADMIN PROFILE TO ACTUAL AUTH USER
-- This fixes the mismatch between auth.user.id and profile.id
-- ============================================

-- STEP 1: Find the actual auth user ID for themartining@gmail.com
DO $$
DECLARE
    auth_user_id uuid;
    profile_uuid uuid;
    admin_email text := 'themartining@gmail.com';
BEGIN
    -- Get the actual auth user ID
    SELECT id INTO auth_user_id
    FROM auth.users
    WHERE email = admin_email
    LIMIT 1;

    -- Get the profile UUID that has admin role
    SELECT id INTO profile_uuid
    FROM public.profiles
    WHERE email = admin_email
       OR role = 'admin'
    ORDER BY created_at DESC
    LIMIT 1;

    IF auth_user_id IS NULL THEN
        RAISE EXCEPTION 'Auth user not found with email: %', admin_email;
    END IF;

    RAISE NOTICE 'Auth user ID: %', auth_user_id;
    RAISE NOTICE 'Profile UUID: %', profile_uuid;

    -- If profile exists but with different ID
    IF profile_uuid IS NOT NULL AND profile_uuid != auth_user_id THEN
        -- We have two options:
        -- Option 1: Update the existing profile's ID to match auth user (requires DELETE and INSERT)
        -- Option 2: Create a new profile with auth user ID and copy data
        
        -- OPTION 2 (Safer): Create profile with auth user ID, keeping existing data
        INSERT INTO public.profiles (
            id,
            email,
            name,
            role,
            phone,
            wallet_balance,
            manager_id,
            is_banned,
            created_at,
            updated_at
        )
        SELECT 
            auth_user_id,
            p.email,
            p.name,
            'admin', -- Force admin role
            p.phone,
            COALESCE(p.wallet_balance, 0),
            p.manager_id,
            COALESCE(p.is_banned, false),
            COALESCE(p.created_at, now()),
            now()
        FROM public.profiles p
        WHERE p.id = profile_uuid
        ON CONFLICT (id) DO UPDATE
        SET 
            email = EXCLUDED.email,
            role = 'admin', -- Ensure admin role
            name = COALESCE(EXCLUDED.name, profiles.name),
            updated_at = now();

        RAISE NOTICE 'Created/Updated profile with auth user ID: %', auth_user_id;
    ELSIF profile_uuid IS NULL THEN
        -- No profile exists, create one
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
        );

        RAISE NOTICE 'Created new profile with auth user ID: %', auth_user_id;
    ELSE
        -- Profile already has correct ID, just ensure role is admin
        UPDATE public.profiles
        SET 
            role = 'admin',
            updated_at = now()
        WHERE id = auth_user_id;

        RAISE NOTICE 'Updated existing profile to admin role';
    END IF;
END $$;

-- STEP 2: Verify the fix
SELECT 
    au.id as auth_user_id,
    au.email as auth_email,
    p.id as profile_id,
    p.email as profile_email,
    p.role,
    p.name,
    CASE 
        WHEN au.id = p.id THEN '✅ IDs match'
        ELSE '❌ IDs do not match'
    END as status
FROM auth.users au
LEFT JOIN public.profiles p ON p.email = au.email OR p.id = au.id
WHERE au.email = 'themartining@gmail.com';

-- ============================================
-- EXPECTED RESULT:
-- auth_user_id and profile_id should be the same
-- role should be 'admin'
-- status should be '✅ IDs match'
-- ============================================

