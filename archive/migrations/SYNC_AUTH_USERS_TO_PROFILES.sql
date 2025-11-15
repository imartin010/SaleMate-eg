-- ============================================
-- SYNC AUTH USERS TO PROFILES TABLE
-- ============================================
-- Run this script in Supabase SQL Editor to sync
-- all existing users from auth.users to profiles table
-- ============================================

-- STEP 1: Sync existing auth users to profiles
-- ============================================

INSERT INTO public.profiles (
    id,
    name,
    email,
    phone,
    role,
    wallet_balance,
    phone_verified_at,
    created_at,
    updated_at
)
SELECT
    au.id,
    COALESCE(au.raw_user_meta_data->>'name', split_part(au.email, '@', 1)) as name,
    au.email,
    COALESCE(au.raw_user_meta_data->>'phone', au.phone, '') as phone,
    COALESCE(au.raw_user_meta_data->>'role', 'user') as role,
    0 as wallet_balance,
    CASE
        WHEN au.raw_user_meta_data->>'phone_verified' = 'true' THEN now()
        ELSE NULL
    END as phone_verified_at,
    au.created_at,
    now() as updated_at
FROM auth.users au
WHERE NOT EXISTS (
    SELECT 1 FROM public.profiles p WHERE p.id = au.id
)
ON CONFLICT (id) DO NOTHING;

-- STEP 2: Update existing profiles with latest auth data
-- ============================================

UPDATE public.profiles
SET
    name = COALESCE(au.raw_user_meta_data->>'name', split_part(au.email, '@', 1)),
    email = au.email,
    phone = COALESCE(au.raw_user_meta_data->>'phone', au.phone, ''),
    phone_verified_at = CASE
        WHEN au.raw_user_meta_data->>'phone_verified' = 'true' THEN
            CASE WHEN public.profiles.phone_verified_at IS NULL THEN now() ELSE public.profiles.phone_verified_at END
        ELSE public.profiles.phone_verified_at
    END,
    updated_at = now()
FROM auth.users au
WHERE public.profiles.id = au.id;

-- STEP 3: Ensure admin user has correct role
-- ============================================

UPDATE public.profiles
SET
    role = 'admin',
    updated_at = now()
WHERE email = 'themartining@gmail.com' AND role != 'admin';

-- STEP 4: Verification queries
-- ============================================

-- Count of synced profiles
SELECT
    '✅ Synced auth users to profiles' as status,
    COUNT(*) as total_profiles_created_or_updated
FROM public.profiles;

-- Show admin user status
SELECT
    'Admin user verification:' as info,
    id,
    name,
    email,
    role,
    wallet_balance,
    phone_verified_at,
    created_at
FROM public.profiles
WHERE email = 'themartining@gmail.com';

-- Show total counts
SELECT
    (SELECT COUNT(*) FROM auth.users) as total_auth_users,
    (SELECT COUNT(*) FROM public.profiles) as total_profiles,
    (SELECT COUNT(*) FROM auth.users WHERE id NOT IN (SELECT id FROM public.profiles)) as missing_profiles;

-- Success message
SELECT '🎉 Auth users successfully synced to profiles table!' as completion_status;
