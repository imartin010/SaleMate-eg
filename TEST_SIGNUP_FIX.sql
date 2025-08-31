-- Test the Signup Fix
-- Run this after applying ROOT_CAUSE_FIX.sql to verify everything works

-- Test 1: Check if the function exists and is working
SELECT 
  routine_name,
  routine_type,
  data_type,
  security_type
FROM information_schema.routines 
WHERE routine_name = 'handle_new_user';

-- Test 2: Check if the trigger is active
SELECT 
  trigger_name,
  event_manipulation,
  action_statement,
  action_timing
FROM information_schema.triggers 
WHERE event_object_table = 'users' AND trigger_name = 'on_auth_user_created';

-- Test 3: Check RLS policies on profiles
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

-- Test 4: Check if we can manually insert a test profile (simulating the trigger)
-- This will help verify the function works without auth.uid() restrictions
DO $$
DECLARE
  test_user_id UUID := gen_random_uuid();
  test_email TEXT := 'test@example.com';
  test_name TEXT := 'Test User';
  test_role TEXT := 'user';
  test_phone TEXT := '+1234567890';
BEGIN
  -- Try to insert a profile manually (this simulates what the trigger should do)
  INSERT INTO public.profiles (id, name, email, role, phone, created_at, updated_at)
  VALUES (
    test_user_id,
    test_name,
    test_email,
    test_role::user_role,
    test_phone,
    NOW(),
    NOW()
  );
  
  RAISE NOTICE '✅ Test profile created successfully with ID: %', test_user_id;
  
  -- Clean up the test profile
  DELETE FROM public.profiles WHERE id = test_user_id;
  RAISE NOTICE '✅ Test profile cleaned up successfully';
  
EXCEPTION
  WHEN others THEN
    RAISE NOTICE '❌ Test profile creation failed: %', SQLERRM;
END $$;

-- Test 5: Check the current user context (this helps debug auth issues)
SELECT 
  current_user,
  session_user,
  current_setting('role'),
  current_setting('request.jwt.claims') as jwt_claims;

-- Test 6: Verify the phone column exists
SELECT 
  column_name,
  data_type,
  is_nullable,
  column_default
FROM information_schema.columns 
WHERE table_name = 'profiles' AND column_name = 'phone';
