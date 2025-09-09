-- FIX EMAIL CONFIRMATION ISSUES
-- Run this in Supabase SQL Editor

-- 1) Check current auth settings
SELECT name, value FROM auth.config;

-- 2) Disable email confirmation for development (optional)
-- This allows users to sign in immediately without email verification
UPDATE auth.config 
SET value = 'false' 
WHERE name = 'enable_signup';

-- Reset to allow signup but skip confirmation
INSERT INTO auth.config (name, value) 
VALUES ('enable_signup', 'true')
ON CONFLICT (name) DO UPDATE SET value = 'true';

-- 3) Auto-confirm existing users who signed up but haven't confirmed
UPDATE auth.users 
SET email_confirmed_at = NOW(),
    confirmed_at = NOW()
WHERE email_confirmed_at IS NULL 
  AND confirmed_at IS NULL
  AND email IS NOT NULL;

-- 4) Check if your account exists and confirm it
SELECT 
    id,
    email,
    email_confirmed_at,
    confirmed_at,
    created_at
FROM auth.users 
WHERE email = 'themartining@gmail.com' OR email ILIKE '%martin%'
ORDER BY created_at DESC;

-- 5) If your account exists but isn't confirmed, confirm it manually
UPDATE auth.users 
SET email_confirmed_at = NOW(),
    confirmed_at = NOW()
WHERE email = 'themartining@gmail.com' OR email ILIKE '%martin%';

-- 6) Verify all users are confirmed
SELECT 
    'User confirmation status:' as info,
    COUNT(*) as total_users,
    COUNT(email_confirmed_at) as confirmed_users
FROM auth.users;

-- 7) Show recent signups
SELECT 
    email,
    email_confirmed_at,
    confirmed_at,
    created_at
FROM auth.users 
ORDER BY created_at DESC 
LIMIT 5;
