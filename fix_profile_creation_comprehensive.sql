-- COMPREHENSIVE FIX FOR PROFILE CREATION
-- This script ensures profiles are created for all users (existing and new)

-- 1) First, create profiles for all existing users who don't have them
INSERT INTO public.profiles (id, email, name, role, phone, created_at, updated_at)
SELECT 
    u.id,
    u.email,
    COALESCE(u.raw_user_meta_data->>'name', SPLIT_PART(u.email, '@', 1), 'User') as name,
    CASE 
        WHEN u.email = 'themartining@gmail.com' OR u.email ILIKE '%admin%' THEN 'admin'::user_role
        WHEN u.email ILIKE '%support%' THEN 'support'::user_role
        WHEN u.email ILIKE '%manager%' THEN 'manager'::user_role
        ELSE 'user'::user_role
    END as role,
    u.raw_user_meta_data->>'phone' as phone,
    COALESCE(u.created_at, NOW()) as created_at,
    NOW() as updated_at
FROM auth.users u
WHERE NOT EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = u.id)
ON CONFLICT (id) DO UPDATE SET
    email = EXCLUDED.email,
    name = COALESCE(EXCLUDED.name, public.profiles.name),
    phone = COALESCE(EXCLUDED.phone, public.profiles.phone),
    updated_at = NOW();

-- 2) Create or replace the trigger function with comprehensive error handling
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger 
LANGUAGE plpgsql 
SECURITY DEFINER 
AS $$
BEGIN
  -- Log the attempt
  RAISE NOTICE 'Creating profile for user % with email %', NEW.id, NEW.email;
  
  -- Insert a new profile for the user
  INSERT INTO public.profiles (id, email, name, role, phone, created_at, updated_at)
  VALUES (
    NEW.id, 
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'name', SPLIT_PART(NEW.email, '@', 1), 'User'),
    CASE 
        WHEN NEW.email = 'themartining@gmail.com' OR NEW.email ILIKE '%admin%' THEN 'admin'::user_role
        WHEN NEW.email ILIKE '%support%' THEN 'support'::user_role
        WHEN NEW.email ILIKE '%manager%' THEN 'manager'::user_role
        ELSE 'user'::user_role
    END,
    NEW.raw_user_meta_data->>'phone',
    NOW(),
    NOW()
  )
  ON CONFLICT (id) DO UPDATE SET
    email = EXCLUDED.email,
    name = COALESCE(EXCLUDED.name, profiles.name),
    phone = COALESCE(EXCLUDED.phone, profiles.phone),
    role = CASE 
        WHEN EXCLUDED.email = 'themartining@gmail.com' OR EXCLUDED.email ILIKE '%admin%' THEN 'admin'::user_role
        WHEN EXCLUDED.email ILIKE '%support%' THEN 'support'::user_role
        WHEN EXCLUDED.email ILIKE '%manager%' THEN 'manager'::user_role
        ELSE profiles.role
    END,
    updated_at = NOW();
    
  RAISE NOTICE 'Profile created successfully for user %', NEW.id;
  RETURN NEW;
EXCEPTION
  WHEN others THEN
    RAISE WARNING 'Failed to create profile for user %: %', NEW.id, SQLERRM;
    -- Still return NEW to not break the auth flow
    RETURN NEW;
END;
$$;

-- 3) Drop and recreate the trigger to ensure it's active
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- 4) Ensure the profiles table has all necessary columns
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS phone text,
ADD COLUMN IF NOT EXISTS created_at timestamptz DEFAULT now(),
ADD COLUMN IF NOT EXISTS updated_at timestamptz DEFAULT now();

-- 5) Fix RLS policies to allow profile creation and access
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Drop existing policies
DROP POLICY IF EXISTS "Users can insert their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can view their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can update their own profile" ON public.profiles;
DROP POLICY IF EXISTS "profiles_all_access" ON public.profiles;
DROP POLICY IF EXISTS "profiles_insert_self" ON public.profiles;

-- Create comprehensive policies
CREATE POLICY "Users can insert their own profile" ON public.profiles
  FOR INSERT WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can view their own profile" ON public.profiles
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update their own profile" ON public.profiles
  FOR UPDATE USING (auth.uid() = id);

-- Allow admins to see all profiles
CREATE POLICY "Admins can view all profiles" ON public.profiles
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- Allow admins to update all profiles
CREATE POLICY "Admins can update all profiles" ON public.profiles
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- 6) Create a helper function to manually ensure profiles exist
CREATE OR REPLACE FUNCTION public.ensure_profile(
  p_uid uuid DEFAULT NULL,
  p_name text DEFAULT NULL,
  p_email text DEFAULT NULL,
  p_phone text DEFAULT NULL,
  p_role public.user_role DEFAULT 'user'
)
RETURNS public.profiles
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  out_row public.profiles;
  user_id uuid;
BEGIN
  -- Use provided uid or current user
  user_id := COALESCE(p_uid, auth.uid());
  
  -- Get user data from auth.users if not provided
  IF p_email IS NULL OR p_name IS NULL THEN
    SELECT 
      email,
      COALESCE(raw_user_meta_data->>'name', SPLIT_PART(email, '@', 1), 'User')
    INTO p_email, p_name
    FROM auth.users 
    WHERE id = user_id;
  END IF;
  
  -- Insert or update profile
  INSERT INTO public.profiles (id, email, name, role, phone, created_at, updated_at)
  VALUES (
    user_id,
    p_email,
    p_name,
    CASE 
        WHEN p_email = 'themartining@gmail.com' OR p_email ILIKE '%admin%' THEN 'admin'::user_role
        WHEN p_email ILIKE '%support%' THEN 'support'::user_role
        WHEN p_email ILIKE '%manager%' THEN 'manager'::user_role
        ELSE p_role
    END,
    p_phone,
    NOW(),
    NOW()
  )
  ON CONFLICT (id) DO UPDATE SET
    email = EXCLUDED.email,
    name = COALESCE(EXCLUDED.name, profiles.name),
    phone = COALESCE(EXCLUDED.phone, profiles.phone),
    role = CASE 
        WHEN EXCLUDED.email = 'themartining@gmail.com' OR EXCLUDED.email ILIKE '%admin%' THEN 'admin'::user_role
        WHEN EXCLUDED.email ILIKE '%support%' THEN 'support'::user_role
        WHEN EXCLUDED.email ILIKE '%manager%' THEN 'manager'::user_role
        ELSE profiles.role
    END,
    updated_at = NOW();
    
  -- Return the profile
  SELECT * INTO out_row FROM public.profiles WHERE id = user_id;
  RETURN out_row;
END;
$$;

-- 7) Grant necessary permissions
GRANT ALL ON public.profiles TO authenticated;
GRANT ALL ON public.profiles TO anon;
GRANT EXECUTE ON FUNCTION public.ensure_profile TO authenticated;
GRANT EXECUTE ON FUNCTION public.ensure_profile TO anon;

-- 8) Verify the setup
SELECT 
  'Profile Creation Fix Applied!' as status,
  (SELECT COUNT(*) FROM auth.users) as total_users,
  (SELECT COUNT(*) FROM public.profiles) as total_profiles,
  (SELECT COUNT(*) FROM auth.users u LEFT JOIN public.profiles p ON u.id = p.id WHERE p.id IS NULL) as users_without_profiles;

