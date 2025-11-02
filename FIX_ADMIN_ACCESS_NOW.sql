-- ============================================
-- QUICK FIX: Admin Access for themartining@gmail.com
-- Run this in Supabase SQL Editor NOW
-- ============================================

-- STEP 1: Find your current user ID
SELECT 
    id as user_id,
    email,
    created_at
FROM auth.users
WHERE email = 'themartining@gmail.com';

-- Copy the user_id from above, then continue...

-- STEP 2: Check if profile exists
SELECT 
    id,
    email,
    role,
    name
FROM public.profiles
WHERE email = 'themartining@gmail.com';

-- STEP 3: Update existing profile to admin role
-- This safely updates the profile if it already exists
DO $$
DECLARE
    existing_profile_id uuid;
    actual_user_id uuid;
BEGIN
    -- Check if profile with this email already exists
    SELECT id INTO existing_profile_id
    FROM public.profiles
    WHERE email = 'themartining@gmail.com'
    LIMIT 1;

    IF existing_profile_id IS NOT NULL THEN
        -- Profile exists, just update role to admin
        UPDATE public.profiles
        SET 
            role = 'admin',
            updated_at = now()
        WHERE id = existing_profile_id;
        
        RAISE NOTICE 'SUCCESS: Updated existing profile (ID: %) to admin role', existing_profile_id;
    ELSE
        -- No profile exists, create one with auth user ID
        SELECT id INTO actual_user_id
        FROM auth.users
        WHERE email = 'themartining@gmail.com';

        IF actual_user_id IS NOT NULL THEN
            -- Create new profile
            INSERT INTO public.profiles (
                id,
                email,
                name,
                role,
                wallet_balance,
                created_at,
                updated_at
            ) VALUES (
                actual_user_id,
                'themartining@gmail.com',
                'Martin',
                'admin',
                0,
                now(),
                now()
            );
            
            RAISE NOTICE 'SUCCESS: Created new profile with admin role for user ID: %', actual_user_id;
        ELSE
            RAISE EXCEPTION 'ERROR: User not found in auth.users with email: themartining@gmail.com. Please sign up first.';
        END IF;
    END IF;
END $$;

-- STEP 4: Verify the fix
SELECT 
    p.id,
    p.email,
    p.name,
    p.role,
    p.wallet_balance,
    p.created_at,
    au.email as auth_email,
    au.confirmed_at
FROM public.profiles p
LEFT JOIN auth.users au ON au.id = p.id
WHERE p.email = 'themartining@gmail.com';

-- ============================================
-- EXPECTED RESULT:
-- You should see:
-- - role: admin (THIS IS CRITICAL!)
-- - email: themartining@gmail.com
-- - auth_email: themartining@gmail.com
-- - confirmed_at: (should have a timestamp)
-- ============================================

-- STEP 5: Check RLS policies are working
SELECT 
    schemaname,
    tablename,
    policyname
FROM pg_policies
WHERE tablename = 'profiles'
AND cmd = 'SELECT';

-- ============================================
-- AFTER RUNNING THIS:
-- 1. Logout from the app
-- 2. Login again with themartining@gmail.com
-- 3. Go to: http://localhost:5175/app/admin
-- 4. You should now have access! ✅
-- ============================================


