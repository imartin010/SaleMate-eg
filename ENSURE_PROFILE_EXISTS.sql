-- First, let's check if the user exists in auth.users
-- (This would need to be run in the Supabase dashboard)

-- Then, ensure the profile exists for the user
INSERT INTO profiles (id, name, email, phone, role, manager_id, is_banned, created_at, updated_at)
VALUES (
    '3c8fd8d0-d0df-4134-be8f-67a77...', -- Replace with actual user ID
    'mohamed abdelraheem',
    'themartining@gmail.com',
    '+201070020058',
    'admin',
    NULL,
    false,
    NOW(),
    NOW()
)
ON CONFLICT (id) 
DO UPDATE SET 
    role = 'admin',
    updated_at = NOW(),
    name = EXCLUDED.name,
    email = EXCLUDED.email,
    phone = EXCLUDED.phone;

-- Verify the profile
SELECT 
    id,
    name,
    email,
    phone,
    role,
    created_at,
    updated_at
FROM profiles 
WHERE email = 'themartining@gmail.com';
