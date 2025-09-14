-- FIX FOR INFINITE RECURSION IN PROFILES RLS POLICIES
-- This error occurs when RLS policies reference the same table they're protecting

-- 1) First, disable RLS temporarily to fix the policies
ALTER TABLE public.profiles DISABLE ROW LEVEL SECURITY;

-- 2) Drop all existing policies that might cause recursion
DROP POLICY IF EXISTS "Users can view their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can insert their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can update their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Admins can view all profiles" ON public.profiles;
DROP POLICY IF EXISTS "Admins can update all profiles" ON public.profiles;
DROP POLICY IF EXISTS "profiles_all_access" ON public.profiles;
DROP POLICY IF EXISTS "profiles_insert_self" ON public.profiles;
DROP POLICY IF EXISTS "Users can insert their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can view their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can update their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Admins can view all profiles" ON public.profiles;
DROP POLICY IF EXISTS "Admins can update all profiles" ON public.profiles;

-- 3) Create simple, non-recursive policies
-- Enable RLS again
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Policy for authenticated users to view their own profile
CREATE POLICY "authenticated_users_own_profile_select" ON public.profiles
  FOR SELECT 
  TO authenticated 
  USING (auth.uid() = id);

-- Policy for authenticated users to insert their own profile
CREATE POLICY "authenticated_users_own_profile_insert" ON public.profiles
  FOR INSERT 
  TO authenticated 
  WITH CHECK (auth.uid() = id);

-- Policy for authenticated users to update their own profile
CREATE POLICY "authenticated_users_own_profile_update" ON public.profiles
  FOR UPDATE 
  TO authenticated 
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- Policy for service role to have full access (for triggers and admin operations)
CREATE POLICY "service_role_full_access" ON public.profiles
  FOR ALL 
  TO service_role 
  USING (true)
  WITH CHECK (true);

-- 4) Grant necessary permissions
GRANT ALL ON public.profiles TO authenticated;
GRANT ALL ON public.profiles TO service_role;
GRANT ALL ON public.profiles TO anon;

-- 5) Ensure the admin user has the correct role
UPDATE public.profiles 
SET 
    role = 'admin'::user_role,
    updated_at = NOW()
WHERE email = 'themartining@gmail.com'
   OR id = (SELECT id FROM auth.users WHERE email = 'themartining@gmail.com');

-- If no profile exists, create one
INSERT INTO public.profiles (id, email, name, role, created_at, updated_at)
SELECT 
    u.id,
    u.email,
    COALESCE(u.raw_user_meta_data->>'name', SPLIT_PART(u.email, '@', 1), 'Admin') as name,
    'admin'::user_role,
    NOW(),
    NOW()
FROM auth.users u
WHERE u.email = 'themartining@gmail.com'
  AND NOT EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = u.id)
ON CONFLICT (id) DO UPDATE SET
    role = 'admin'::user_role,
    updated_at = NOW();

-- 6) Verify the fix
SELECT 
    'RLS Fix Applied!' as status,
    (SELECT COUNT(*) FROM auth.users) as total_users,
    (SELECT COUNT(*) FROM public.profiles) as total_profiles,
    (SELECT COUNT(*) FROM public.profiles WHERE email = 'themartining@gmail.com' AND role = 'admin') as admin_profiles;

-- 7) Test query to verify profiles can be accessed
SELECT 
    u.email,
    p.role,
    p.name,
    CASE 
        WHEN p.id IS NULL THEN '❌ No Profile'
        ELSE '✅ Profile Exists'
    END as profile_status
FROM auth.users u
LEFT JOIN public.profiles p ON u.id = p.id
WHERE u.email = 'themartining@gmail.com';

