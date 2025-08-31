-- Check user role for the specific email
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

-- Check all profiles to see the structure
SELECT 
    id,
    name,
    email,
    role,
    created_at
FROM profiles 
ORDER BY created_at DESC
LIMIT 10;
