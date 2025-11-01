-- QUICK FIX: Update the manager_id for the user who accepted the invitation
-- This fixes the issue where team members disappear after role changes

-- Step 1: Find and fix the team member
UPDATE profiles 
SET 
  manager_id = '530745fe-2836-4195-b8ca-00ea2dd0c578',
  updated_at = NOW()
WHERE email IN (
  SELECT ti.invitee_email 
  FROM team_invitations ti 
  WHERE ti.manager_id = '530745fe-2836-4195-b8ca-00ea2dd0c578' 
    AND ti.status = 'accepted'
);

-- Step 2: Verify the fix
SELECT 
  p.id,
  p.name,
  p.email,
  p.role,
  p.manager_id,
  'FIXED ✅' as status
FROM profiles p
WHERE p.manager_id = '530745fe-2836-4195-b8ca-00ea2dd0c578';

-- Step 3: Also show the invitations for reference
SELECT 
  ti.id,
  ti.invitee_email,
  ti.status,
  ti.created_at,
  'INVITATION' as type
FROM team_invitations ti
WHERE ti.manager_id = '530745fe-2836-4195-b8ca-00ea2dd0c578'
ORDER BY ti.created_at DESC;

