-- Debug Profile Creation Issue
-- Run this in Supabase SQL Editor to see what's happening

-- Check if the profiles table exists and has the right structure
SELECT 
  table_name,
  column_name,
  data_type,
  is_nullable
FROM information_schema.columns 
WHERE table_name = 'profiles' 
ORDER BY ordinal_position;

-- Check if the trigger exists
SELECT 
  trigger_name,
  event_manipulation,
  action_statement,
  action_timing
FROM information_schema.triggers 
WHERE event_object_table = 'users';

-- Check if the function exists
SELECT 
  routine_name,
  routine_type,
  data_type
FROM information_schema.routines 
WHERE routine_name = 'handle_new_user';

-- Check RLS policies on profiles table
SELECT 
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual,
  with_check
FROM pg_policies 
WHERE tablename = 'profiles';

-- Check if we can insert into profiles manually (this will help identify permission issues)
-- First, let's see what the current user context is
SELECT 
  current_user,
  session_user,
  current_setting('role'),
  current_setting('request.jwt.claims');

-- Try to manually create a test profile (this will show us the exact error)
-- Comment out the line below if you want to test it
-- INSERT INTO profiles (id, name, email, role, created_at, updated_at) 
-- VALUES (gen_random_uuid(), 'Test User', 'test@example.com', 'user', NOW(), NOW());
