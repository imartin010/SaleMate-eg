-- COMPLETE WORKING AUTH FIX - FINAL VERSION
-- Run this entire script in Supabase SQL Editor

-- 1) Create user_role enum if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'user_role') THEN
    CREATE TYPE public.user_role AS ENUM ('admin','manager','support','user');
  END IF;
END$$;

-- 2) Auto-confirm all existing users (only email_confirmed_at, not confirmed_at)
UPDATE auth.users 
SET email_confirmed_at = COALESCE(email_confirmed_at, NOW())
WHERE email IS NOT NULL 
  AND email_confirmed_at IS NULL;

-- 3) Create profiles table if it doesn't exist
CREATE TABLE IF NOT EXISTS public.profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  name text,
  email text,
  phone text,
  role public.user_role NOT NULL DEFAULT 'user',
  manager_id uuid REFERENCES public.profiles(id),
  is_banned boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- 4) Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_profiles_manager ON public.profiles(manager_id);
CREATE INDEX IF NOT EXISTS idx_profiles_role ON public.profiles(role);
CREATE INDEX IF NOT EXISTS idx_profiles_email ON public.profiles(email);

-- 5) Create profiles for ALL existing users immediately
INSERT INTO public.profiles (id, email, name, role)
SELECT 
    u.id,
    u.email,
    COALESCE(u.raw_user_meta_data->>'name', SPLIT_PART(u.email, '@', 1), 'User') as name,
    CASE 
        WHEN u.email = 'themartining@gmail.com' OR u.email ILIKE '%admin%' THEN 'admin'::user_role
        WHEN u.email ILIKE '%support%' THEN 'support'::user_role
        WHEN u.email ILIKE '%manager%' THEN 'manager'::user_role
        ELSE 'user'::user_role
    END as role
FROM auth.users u
WHERE NOT EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = u.id)
ON CONFLICT (id) DO UPDATE SET
    email = EXCLUDED.email,
    name = COALESCE(EXCLUDED.name, public.profiles.name),
    role = EXCLUDED.role,
    updated_at = NOW();

-- 6) Create trigger function for automatic profile creation on future signups
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  INSERT INTO public.profiles (id, email, name, role)
  VALUES (
    NEW.id, 
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'name', SPLIT_PART(NEW.email, '@', 1), 'User'),
    CASE 
        WHEN NEW.email ILIKE '%admin%' THEN 'admin'::user_role
        WHEN NEW.email ILIKE '%support%' THEN 'support'::user_role
        WHEN NEW.email ILIKE '%manager%' THEN 'manager'::user_role
        ELSE 'user'::user_role
    END
  )
  ON CONFLICT (id) DO UPDATE SET
    email = EXCLUDED.email,
    name = COALESCE(EXCLUDED.name, public.profiles.name),
    updated_at = now();
  RETURN NEW;
END;
$$;

-- 7) Create the trigger
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
AFTER INSERT ON auth.users
FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();

-- 8) Helper RPC function for ensuring profiles exist
CREATE OR REPLACE FUNCTION public.ensure_profile(
  p_uid uuid,
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
BEGIN
  INSERT INTO public.profiles (id, name, email, phone, role)
  VALUES (
    p_uid, 
    COALESCE(p_name, 'User'), 
    COALESCE(p_email, ''), 
    p_phone, 
    COALESCE(p_role, 'user')
  )
  ON CONFLICT (id) DO UPDATE
    SET name = COALESCE(EXCLUDED.name, public.profiles.name, 'User'),
        email = COALESCE(EXCLUDED.email, public.profiles.email),
        phone = COALESCE(EXCLUDED.phone, public.profiles.phone),
        updated_at = now()
  RETURNING * INTO out_row;
  RETURN out_row;
END;
$$;

-- 9) Team hierarchy function for managers
CREATE OR REPLACE FUNCTION public.rpc_team_user_ids(root_user_id uuid)
RETURNS TABLE(user_id uuid)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  WITH RECURSIVE team_tree AS (
    -- Base case: the root user
    SELECT id FROM public.profiles WHERE id = root_user_id
    UNION ALL
    -- Recursive case: users managed by someone in the tree
    SELECT p.id 
    FROM public.profiles p
    INNER JOIN team_tree tt ON p.manager_id = tt.id
  )
  SELECT tt.id FROM team_tree tt;
END;
$$;

-- 10) Set up Row Level Security
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Drop all existing policies to start fresh
DROP POLICY IF EXISTS profiles_read_access ON public.profiles;
DROP POLICY IF EXISTS profiles_update_self ON public.profiles;
DROP POLICY IF EXISTS profiles_insert_self ON public.profiles;
DROP POLICY IF EXISTS "profiles_all_access" ON public.profiles;
DROP POLICY IF EXISTS "Users can read own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can view their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can insert their own profile" ON public.profiles;

-- Create comprehensive policies
-- Read: self + admins/support can read all + managers can read their tree
CREATE POLICY "profiles_select_policy" ON public.profiles
FOR SELECT USING (
  auth.uid() = id
  OR EXISTS (SELECT 1 FROM public.profiles me WHERE me.id = auth.uid() AND me.role IN ('admin','support'))
  OR id IN (SELECT user_id FROM public.rpc_team_user_ids(auth.uid()))
);

-- Update: self only
CREATE POLICY "profiles_update_policy" ON public.profiles
FOR UPDATE USING (auth.uid() = id);

-- Insert: self only (for profile creation)
CREATE POLICY "profiles_insert_policy" ON public.profiles
FOR INSERT WITH CHECK (auth.uid() = id);

-- 11) Grant necessary permissions
GRANT SELECT, INSERT, UPDATE ON public.profiles TO authenticated;
GRANT USAGE ON SCHEMA public TO authenticated;

-- 12) Verification and results
SELECT 'Auth system setup complete!' as status;

SELECT 
    'User confirmation status:' as info,
    COUNT(*) as total_users,
    COUNT(CASE WHEN email_confirmed_at IS NOT NULL THEN 1 END) as confirmed_users
FROM auth.users;

SELECT 
    'Profile creation status:' as info,
    COUNT(*) as total_profiles
FROM public.profiles;

SELECT 
    'Role distribution:' as info,
    role,
    COUNT(*) as count
FROM public.profiles 
GROUP BY role 
ORDER BY count DESC;

-- 13) Show your specific profile
SELECT 
    'Your profile:' as info,
    email, 
    name, 
    role,
    created_at
FROM public.profiles 
WHERE email = 'themartining@gmail.com' OR email ILIKE '%martin%';

-- 14) Show all recent profiles
SELECT 
    email,
    name, 
    role,
    created_at
FROM public.profiles 
ORDER BY created_at DESC
LIMIT 10;
