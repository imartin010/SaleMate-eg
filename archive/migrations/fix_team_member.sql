-- FIX: Manually assign team member to manager
-- This fixes the issue where accepted invitation didn't set manager_id

-- Step 1: Find the invitation and the user who accepted it
SELECT 
    ti.id as invitation_id,
    ti.invitee_email,
    ti.status,
    ti.manager_id,
    m.email as manager_email,
    m.name as manager_name,
    p.id as invitee_user_id,
    p.email as invitee_user_email,
    p.name as invitee_user_name,
    p.manager_id as current_manager_id
FROM team_invitations ti
JOIN profiles m ON m.id = ti.manager_id
LEFT JOIN profiles p ON p.email = ti.invitee_email
WHERE ti.status = 'accepted'
AND m.email = 'themartining@gmail.com'  -- Replace with your email
ORDER BY ti.created_at DESC;

-- Step 2: Fix the manager_id for the accepted user
-- IMPORTANT: Run Step 1 first to get the correct IDs, then uncomment and run this:

/*
UPDATE profiles 
SET manager_id = '530745fe-2836-4195-b8ca-00ea2dd0c578'  -- Your user ID from debug output
WHERE email = 'INVITED_USER_EMAIL';  -- Replace with the invited user's email
*/

-- Step 3: Verify the fix
SELECT 
    id,
    name,
    email,
    role,
    manager_id
FROM profiles
WHERE manager_id = '530745fe-2836-4195-b8ca-00ea2dd0c578'  -- Your user ID
ORDER BY created_at DESC;

