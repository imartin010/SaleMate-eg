-- ============================================
-- SET ADMIN ROLE - Run this after signup
-- ============================================

-- Step 1: Find the user
SELECT 
    au.id as auth_user_id,
    au.email,
    au.email_confirmed_at,
    p.id as profile_id,
    p.role,
    p.name
FROM auth.users au
LEFT JOIN public.profiles p ON p.id = au.id
WHERE au.email = 'themartining@gmail.com';

-- Step 2: Set admin role
UPDATE public.profiles
SET 
    role = 'admin',
    updated_at = now()
WHERE email = 'themartining@gmail.com';

-- Step 3: Verify admin role is set
SELECT 
    id,
    email,
    name,
    role,
    CASE 
        WHEN role = 'admin' THEN '✅ ADMIN ROLE SET'
        ELSE '❌ NOT ADMIN'
    END as status
FROM public.profiles
WHERE email = 'themartining@gmail.com';

-- Expected result:
-- role = 'admin'
-- status = '✅ ADMIN ROLE SET'

