-- Update user roles to ensure admin access
-- This fixes the role display issue where users show as 'user' instead of 'admin'

-- Update any user with email containing 'martin' or 'admin' to admin role
UPDATE public.profiles 
SET role = 'admin', updated_at = NOW()
WHERE email ILIKE '%martin%' 
   OR email ILIKE '%admin%' 
   OR name ILIKE '%mohamed%' 
   OR name ILIKE '%abdelraheem%'
   OR email = 'themartining@gmail.com';

-- Create default admin users if they don't exist
INSERT INTO public.profiles (id, email, name, role, created_at, updated_at)
VALUES 
    ('11111111-1111-1111-1111-111111111111', 'admin@salemate.com', 'Admin User', 'admin', NOW(), NOW()),
    ('22222222-2222-2222-2222-222222222222', 'support@salemate.com', 'Support Team', 'support', NOW(), NOW())
ON CONFLICT (id) DO UPDATE SET
    role = EXCLUDED.role,
    updated_at = NOW();

-- Also ensure any existing auth users get proper profiles
INSERT INTO public.profiles (id, email, name, role, created_at, updated_at)
SELECT 
    u.id,
    u.email,
    COALESCE(u.raw_user_meta_data->>'name', SPLIT_PART(u.email, '@', 1)) as name,
    CASE 
        WHEN u.email ILIKE '%admin%' OR u.email ILIKE '%martin%' THEN 'admin'
        WHEN u.email ILIKE '%support%' THEN 'support'
        ELSE 'user'
    END as role,
    u.created_at,
    NOW() as updated_at
FROM auth.users u
WHERE NOT EXISTS (
    SELECT 1 FROM public.profiles p WHERE p.id = u.id
)
ON CONFLICT (id) DO UPDATE SET
    email = EXCLUDED.email,
    name = COALESCE(EXCLUDED.name, profiles.name),
    role = CASE 
        WHEN EXCLUDED.email ILIKE '%admin%' OR EXCLUDED.email ILIKE '%martin%' THEN 'admin'
        WHEN EXCLUDED.email ILIKE '%support%' THEN 'support'
        ELSE profiles.role
    END,
    updated_at = NOW();
