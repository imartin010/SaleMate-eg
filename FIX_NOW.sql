-- QUICK FIX: Run this in Supabase SQL Editor
-- This will fix the missing team member and show you the result

-- Step 1: Find accepted invitations that need fixing
SELECT 
    '=== ACCEPTED INVITATIONS ===' as step,
    ti.id,
    ti.invitee_email,
    ti.status,
    ti.manager_id,
    p.id as user_id,
    p.name as user_name,
    p.manager_id as current_manager_id
FROM team_invitations ti
LEFT JOIN profiles p ON p.email = ti.invitee_email
WHERE ti.manager_id = '530745fe-2836-4195-b8ca-00ea2dd0c578'
AND ti.status = 'accepted';

-- Step 2: Fix any users that have accepted but manager_id is NULL
UPDATE profiles 
SET manager_id = '530745fe-2836-4195-b8ca-00ea2dd0c578',
    updated_at = NOW()
WHERE email IN (
    SELECT ti.invitee_email
    FROM team_invitations ti
    WHERE ti.manager_id = '530745fe-2836-4195-b8ca-00ea2dd0c578'
    AND ti.status = 'accepted'
    AND ti.invitee_email NOT IN (
        SELECT email FROM profiles WHERE manager_id = '530745fe-2836-4195-b8ca-00ea2dd0c578'
    )
);

-- Step 3: Verify the fix worked
SELECT 
    '=== YOUR TEAM MEMBERS ===' as result,
    id,
    name,
    email,
    role,
    manager_id,
    created_at
FROM profiles
WHERE manager_id = '530745fe-2836-4195-b8ca-00ea2dd0c578'
ORDER BY created_at DESC;

-- Step 4: Show the count
SELECT 
    '=== TEAM COUNT ===' as summary,
    COUNT(*) as team_member_count
FROM profiles
WHERE manager_id = '530745fe-2836-4195-b8ca-00ea2dd0c578';

