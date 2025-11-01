-- COMPREHENSIVE CHECK AND FIX
-- Run this in Supabase SQL Editor

-- ============================================
-- STEP 1: Find your current user info
-- ============================================
SELECT 
  '=== YOUR ACCOUNT ===' as section,
  id,
  name,
  email,
  role,
  manager_id
FROM profiles 
WHERE email = 'themartining@gmail.com';

-- ============================================
-- STEP 2: Check who should be in your team
-- ============================================
SELECT 
  '=== ACCEPTED INVITATIONS ===' as section,
  ti.id as invitation_id,
  ti.invitee_email,
  ti.status,
  ti.manager_id,
  p.id as user_id,
  p.name as user_name,
  p.manager_id as current_manager_id,
  CASE 
    WHEN p.manager_id = ti.manager_id THEN '✅ CORRECT'
    WHEN p.manager_id IS NULL THEN '❌ NOT SET'
    ELSE '❌ WRONG MANAGER'
  END as status_check
FROM team_invitations ti
LEFT JOIN profiles p ON p.email = ti.invitee_email
WHERE ti.manager_id = (SELECT id FROM profiles WHERE email = 'themartining@gmail.com')
  AND ti.status = 'accepted'
ORDER BY ti.created_at DESC;

-- ============================================
-- STEP 3: Check all pending invitations
-- ============================================
SELECT 
  '=== PENDING INVITATIONS ===' as section,
  ti.id,
  ti.invitee_email,
  ti.status,
  ti.created_at,
  p.id as user_exists,
  p.name
FROM team_invitations ti
LEFT JOIN profiles p ON p.email = ti.invitee_email
WHERE ti.manager_id = (SELECT id FROM profiles WHERE email = 'themartining@gmail.com')
  AND ti.status = 'pending'
ORDER BY ti.created_at DESC;

-- ============================================
-- STEP 4: FIX - Update manager_id for accepted invitations
-- ============================================
UPDATE profiles 
SET 
  manager_id = ti.manager_id,
  updated_at = NOW()
FROM team_invitations ti
WHERE profiles.email = ti.invitee_email
  AND ti.manager_id = (SELECT id FROM profiles WHERE email = 'themartining@gmail.com')
  AND ti.status = 'accepted'
  AND (profiles.manager_id IS NULL OR profiles.manager_id != ti.manager_id);

-- ============================================
-- STEP 5: VERIFY THE FIX - Show your team members
-- ============================================
SELECT 
  '=== YOUR TEAM MEMBERS (AFTER FIX) ===' as section,
  p.id,
  p.name,
  p.email,
  p.role,
  p.manager_id,
  p.created_at
FROM profiles p
WHERE p.manager_id = (SELECT id FROM profiles WHERE email = 'themartining@gmail.com')
ORDER BY p.created_at DESC;

-- ============================================
-- STEP 6: Show summary
-- ============================================
SELECT 
  '=== SUMMARY ===' as section,
  COUNT(*) as total_team_members
FROM profiles p
WHERE p.manager_id = (SELECT id FROM profiles WHERE email = 'themartining@gmail.com');

