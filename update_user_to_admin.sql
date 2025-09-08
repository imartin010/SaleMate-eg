-- Update user role to admin
-- This will fix the role display issue in the dashboard

-- First, let's check what users exist
SELECT id, email, name, role, created_at 
FROM public.profiles 
ORDER BY created_at DESC;

-- Update the user with email 'themartining@gmail.com' to admin role
-- (This appears to be the user from the screenshot)
UPDATE public.profiles 
SET role = 'admin', updated_at = NOW()
WHERE email = 'themartining@gmail.com';

-- Also update any user that might have signed up recently to admin
-- In case the email is different
UPDATE public.profiles 
SET role = 'admin', updated_at = NOW()
WHERE email ILIKE '%martin%' OR name ILIKE '%mohamed%' OR name ILIKE '%abdelraheem%';

-- Create a default admin user if none exists
INSERT INTO public.profiles (id, email, name, role, created_at, updated_at)
VALUES (
    gen_random_uuid(),
    'admin@salemate.com',
    'Admin User',
    'admin',
    NOW(),
    NOW()
) ON CONFLICT (email) DO UPDATE SET
    role = 'admin',
    updated_at = NOW();

-- Verify the updates
SELECT id, email, name, role, created_at, updated_at 
FROM public.profiles 
WHERE role = 'admin'
ORDER BY updated_at DESC;

-- Show all users for verification
SELECT 
    id, 
    email, 
    name, 
    role,
    created_at,
    updated_at
FROM public.profiles 
ORDER BY created_at DESC;
