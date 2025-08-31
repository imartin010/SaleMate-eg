-- Update new user role to admin
-- This will change the role from 'user' to 'admin'

-- First, let's check the current state
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

-- Update the user's role to admin
UPDATE profiles 
SET 
  role = 'admin',
  updated_at = NOW()
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

-- Show all profiles to confirm
SELECT 
  id,
  name,
  email,
  role,
  created_at
FROM profiles 
ORDER BY created_at DESC;
