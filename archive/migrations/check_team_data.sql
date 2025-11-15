-- Diagnostic Query: Check Team Data
-- Run this in your Supabase SQL Editor to diagnose the issue

-- 1. Check your current profile
SELECT 
  id, 
  name, 
  email, 
  role, 
  manager_id,
  created_at
FROM profiles 
WHERE email = 'themartining@gmail.com'; -- Replace with your email

-- 2. Check all profiles that have YOU as their manager
SELECT 
  id,
  name,
  email,
  role,
  manager_id,
  created_at
FROM profiles 
WHERE manager_id = (
  SELECT id FROM profiles WHERE email = 'themartining@gmail.com' -- Replace with your email
);

-- 3. Check all team invitations you sent
SELECT 
  ti.id,
  ti.invitee_email,
  ti.status,
  ti.created_at,
  ti.expires_at,
  p.name as invitee_name,
  p.role as invitee_role
FROM team_invitations ti
LEFT JOIN profiles p ON p.email = ti.invitee_email
WHERE ti.manager_id = (
  SELECT id FROM profiles WHERE email = 'themartining@gmail.com' -- Replace with your email
)
ORDER BY ti.created_at DESC;

-- 4. Check all team invitations (to see if any got orphaned)
SELECT 
  ti.id,
  ti.invitee_email,
  ti.status,
  m.email as manager_email,
  m.role as manager_role,
  p.email as invitee_profile_email,
  p.manager_id as invitee_manager_id
FROM team_invitations ti
LEFT JOIN profiles m ON m.id = ti.manager_id
LEFT JOIN profiles p ON p.email = ti.invitee_email
WHERE ti.status = 'accepted'
ORDER BY ti.created_at DESC
LIMIT 10;

-- 5. Check for any profiles without a manager (orphaned)
SELECT 
  id,
  name,
  email,
  role,
  manager_id,
  created_at
FROM profiles
WHERE manager_id IS NULL
AND role = 'user'
ORDER BY created_at DESC
LIMIT 10;

