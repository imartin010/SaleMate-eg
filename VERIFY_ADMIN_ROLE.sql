-- VERIFY AND FIX ADMIN ROLE
-- Run this in Supabase Dashboard SQL Editor

-- Check current user roles
SELECT id, email, name, role, created_at, updated_at 
FROM public.profiles 
ORDER BY created_at DESC;

-- Force update the user to admin role (replace email if different)
UPDATE public.profiles 
SET role = 'admin', updated_at = NOW()
WHERE email = 'themartining@gmail.com' 
   OR email ILIKE '%martin%' 
   OR name ILIKE '%mohamed%' 
   OR name ILIKE '%abdelraheem%';

-- Also update any recently created users to admin
UPDATE public.profiles 
SET role = 'admin', updated_at = NOW()
WHERE created_at > NOW() - INTERVAL '24 hours'
  AND role = 'user';

-- Verify the update
SELECT 
  id, 
  email, 
  name, 
  role, 
  updated_at 
FROM public.profiles 
WHERE role = 'admin'
ORDER BY updated_at DESC;

-- Show all users for verification
SELECT 
  email,
  name,
  role,
  updated_at
FROM public.profiles 
ORDER BY updated_at DESC;
