-- SIMPLE EMAIL CONFIRMATION FIX
-- Run this in Supabase SQL Editor

-- 1) Auto-confirm all existing users who haven't been confirmed
UPDATE auth.users 
SET email_confirmed_at = NOW(),
    confirmed_at = NOW()
WHERE email_confirmed_at IS NULL 
  AND confirmed_at IS NULL
  AND email IS NOT NULL;

-- 2) Check if your account exists and confirm it specifically
SELECT 
    id,
    email,
    email_confirmed_at,
    confirmed_at,
    created_at
FROM auth.users 
WHERE email = 'themartining@gmail.com' OR email ILIKE '%martin%'
ORDER BY created_at DESC;

-- 3) Manually confirm your account if it exists
UPDATE auth.users 
SET email_confirmed_at = NOW(),
    confirmed_at = NOW()
WHERE email = 'themartining@gmail.com' OR email ILIKE '%martin%';

-- 4) Verify confirmation status
SELECT 
    email,
    CASE 
        WHEN email_confirmed_at IS NOT NULL THEN 'Confirmed'
        ELSE 'Not Confirmed'
    END as status,
    created_at
FROM auth.users 
ORDER BY created_at DESC 
LIMIT 5;
