-- ============================================
-- QUICK CREATE ADMIN PROFILE
-- Run this AFTER creating auth user via Supabase Dashboard
-- ============================================

-- This script:
-- 1. Finds the auth user by email
-- 2. Creates profile with matching ID
-- 3. Sets role to 'admin'

DO $$
DECLARE
    auth_user_id uuid;
BEGIN
    SELECT id INTO auth_user_id
    FROM auth.users
    WHERE email = 'themartining@gmail.com'
    LIMIT 1;

    IF auth_user_id IS NULL THEN
        RAISE EXCEPTION 'Auth user not found. Create user first via Dashboard → Authentication → Add User';
    END IF;

    INSERT INTO public.profiles (id, email, name, role, wallet_balance, created_at, updated_at)
    VALUES (auth_user_id, 'themartining@gmail.com', 'Martin', 'admin', 0, now(), now())
    ON CONFLICT (id) DO UPDATE
    SET email = 'themartining@gmail.com', role = 'admin', updated_at = now();

    RAISE NOTICE '✅ Admin profile created! ID: %', auth_user_id;
END $$;

-- Verify
SELECT au.id, p.id, p.role, 
       CASE WHEN au.id = p.id THEN '✅ MATCH' ELSE '❌ MISMATCH' END
FROM auth.users au
LEFT JOIN public.profiles p ON p.id = au.id
WHERE au.email = 'themartining@gmail.com';

