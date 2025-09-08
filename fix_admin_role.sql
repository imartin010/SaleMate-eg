-- QUICK FIX: Update user role to admin
-- Run this in Supabase Dashboard SQL Editor

-- Check current users
SELECT id, email, name, role FROM public.profiles;

-- Update the current user to admin role
-- Replace 'themartining@gmail.com' with the actual email if different
UPDATE public.profiles 
SET role = 'admin', updated_at = NOW()
WHERE email = 'themartining@gmail.com'
   OR email ILIKE '%martin%'
   OR name ILIKE '%mohamed%'
   OR name ILIKE '%abdelraheem%';

-- If no user found, create an admin user
INSERT INTO public.profiles (id, email, name, role, created_at, updated_at)
SELECT 
    u.id,
    u.email,
    COALESCE(u.raw_user_meta_data->>'name', 'Admin User') as name,
    'admin' as role,
    u.created_at,
    NOW() as updated_at
FROM auth.users u
WHERE u.email = 'themartining@gmail.com'
ON CONFLICT (id) DO UPDATE SET
    role = 'admin',
    updated_at = NOW();

-- Verify the change
SELECT id, email, name, role, updated_at FROM public.profiles WHERE role = 'admin';
