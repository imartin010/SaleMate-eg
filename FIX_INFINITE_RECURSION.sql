-- Fix Infinite Recursion in RLS Policies
-- This addresses the "infinite recursion detected in policy" error

-- Step 1: Drop ALL existing policies on profiles to start fresh
DROP POLICY IF EXISTS "Users can insert their own profile" ON profiles;
DROP POLICY IF EXISTS "Users can update their own profile" ON profiles;
DROP POLICY IF EXISTS "Users can view their own profile" ON profiles;
DROP POLICY IF EXISTS "Admins can view all profiles" ON profiles;
DROP POLICY IF EXISTS "Support and Admin can view all profiles" ON profiles;

-- Step 2: Temporarily disable RLS on profiles to break the recursion
ALTER TABLE profiles DISABLE ROW LEVEL SECURITY;

-- Step 3: Create a simple, non-recursive policy for basic access
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- Step 4: Create a simple policy that allows authenticated users to manage their own profile
CREATE POLICY "Basic profile access" ON profiles
  FOR ALL USING (auth.uid() = id);

-- Step 5: Allow the trigger function to work without RLS interference
-- The SECURITY DEFINER function should already bypass RLS, but let's make sure

-- Step 6: Test if we can insert a profile manually
DO $$
DECLARE
  test_user_id UUID := gen_random_uuid();
BEGIN
  INSERT INTO public.profiles (id, name, email, role, phone, created_at, updated_at)
  VALUES (
    test_user_id,
    'Test User',
    'test@example.com',
    'user',
    '+1234567890',
    NOW(),
    NOW()
  );
  
  RAISE NOTICE '✅ Test profile created successfully with ID: %', test_user_id;
  
  -- Clean up
  DELETE FROM public.profiles WHERE id = test_user_id;
  RAISE NOTICE '✅ Test profile cleaned up successfully';
  
EXCEPTION
  WHEN others THEN
    RAISE NOTICE '❌ Test profile creation failed: %', SQLERRM;
END $$;

-- Step 7: Verify the current policies
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

-- Step 8: Check if RLS is enabled
SELECT 
  schemaname,
  tablename,
  rowsecurity
FROM pg_tables 
WHERE tablename = 'profiles';

