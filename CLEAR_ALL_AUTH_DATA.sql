-- Clear All Authentication and Profile Data
-- This will completely reset the authentication system

-- Step 1: Clear all profiles
DELETE FROM profiles;

-- Step 2: Clear all auth sessions (this will log out all users)
DELETE FROM auth.sessions;

-- Step 3: Clear all auth users (this will delete all user accounts)
DELETE FROM auth.users;

-- Step 4: Clear any other related data
DELETE FROM leads;
DELETE FROM deals;
DELETE FROM orders;
DELETE FROM projects;
DELETE FROM partners;
DELETE FROM support_cases;
DELETE FROM comments;
DELETE FROM posts;
DELETE FROM recent_activity;

-- Step 5: Reset sequences if they exist
DO $$
DECLARE
    seq_name text;
BEGIN
    FOR seq_name IN 
        SELECT sequence_name 
        FROM information_schema.sequences 
        WHERE sequence_schema = 'public'
    LOOP
        EXECUTE 'ALTER SEQUENCE ' || seq_name || ' RESTART WITH 1';
    END LOOP;
END $$;

-- Step 6: Verify everything is cleared
SELECT 'Profiles count:' as table_name, COUNT(*) as count FROM profiles
UNION ALL
SELECT 'Auth users count:', COUNT(*) FROM auth.users
UNION ALL
SELECT 'Auth sessions count:', COUNT(*) FROM auth.sessions
UNION ALL
SELECT 'Leads count:', COUNT(*) FROM leads
UNION ALL
SELECT 'Deals count:', COUNT(*) FROM deals;

-- Step 7: Create a fresh admin user (optional)
-- Uncomment the lines below if you want to create a new admin user
/*
INSERT INTO auth.users (
    id,
    email,
    encrypted_password,
    email_confirmed_at,
    created_at,
    updated_at,
    raw_user_meta_data
) VALUES (
    gen_random_uuid(),
    'admin@example.com',
    crypt('password123', gen_salt('bf')),
    NOW(),
    NOW(),
    NOW(),
    '{"name": "Admin User", "role": "admin"}'::jsonb
);

-- Create corresponding profile
INSERT INTO profiles (id, name, email, role, created_at, updated_at)
SELECT 
    id,
    raw_user_meta_data->>'name',
    email,
    COALESCE(raw_user_meta_data->>'role', 'admin'),
    created_at,
    updated_at
FROM auth.users 
WHERE email = 'admin@example.com';
*/
