-- Fix user role for the specific email
UPDATE profiles 
SET role = 'admin', updated_at = NOW()
WHERE email = 'themartining@gmail.com';

-- Verify the update
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

-- Also check if there are multiple profiles for the same email
SELECT 
    id,
    name,
    email,
    role,
    created_at
FROM profiles 
WHERE email = 'themartining@gmail.com'
ORDER BY created_at DESC;
