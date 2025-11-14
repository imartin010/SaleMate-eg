-- ============================================
-- FIX USER ROLE TO ADMIN
-- ============================================
-- Updates the user's role to 'admin' in the profiles table
-- Run this in Supabase SQL Editor
-- ============================================

-- Update user role to admin (replace email with your email)
UPDATE public.profiles
SET 
    role = 'admin',
    updated_at = now()
WHERE email = 'themartining@gmail.com';

-- Verify the update
SELECT id, name, email, role, wallet_balance
FROM public.profiles
WHERE email = 'themartining@gmail.com';

-- Success message
SELECT '✅ User role updated to admin!' as status;


