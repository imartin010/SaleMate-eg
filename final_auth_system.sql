-- FINAL AUTHENTICATION SYSTEM SQL - CORRECTED
-- Run this in Supabase SQL Editor

-- 1) ENUM for roles (if not exists)
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'user_role') THEN
    CREATE TYPE public.user_role AS ENUM ('admin','manager','support','user');
  END IF;
END$$;

-- 2) Drop existing profiles table to recreate it properly
DROP TABLE IF EXISTS public.profiles CASCADE;

-- 3) Create profiles table with correct constraints
CREATE TABLE public.profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  name text, -- Allow null names
  email text,
  phone text,
  role public.user_role NOT NULL DEFAULT 'user',
  manager_id uuid REFERENCES public.profiles(id),
  is_banned boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- 4) Create indexes
CREATE INDEX IF NOT EXISTS idx_profiles_manager ON public.profiles(manager_id);
CREATE INDEX IF NOT EXISTS idx_profiles_role ON public.profiles(role);
CREATE INDEX IF NOT EXISTS idx_profiles_email ON public.profiles(email);

-- 5) Trigger to auto-create profile on auth.users insert
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
    name = COALESCE(EXCLUDED.name, public.profiles.name, 'User'),
    updated_at = now();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
AFTER INSERT ON auth.users
FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();

-- 6) Helper RPC: ensure_profile (for race conditions / backfill-on-demand)
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

-- 7) Backfill procedure with proper null handling
CREATE OR REPLACE FUNCTION public.backfill_profiles()
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  cnt int := 0;
BEGIN
  INSERT INTO public.profiles (id, email, name, role)
  SELECT 
    u.id, 
    u.email, 
    COALESCE(u.raw_user_meta_data->>'name', SPLIT_PART(u.email, '@', 1), 'User') as name,
    CASE 
        WHEN u.email ILIKE '%admin%' THEN 'admin'::user_role
        WHEN u.email ILIKE '%support%' THEN 'support'::user_role
        WHEN u.email ILIKE '%manager%' THEN 'manager'::user_role
        ELSE 'user'::user_role
    END as role
  FROM auth.users u
  LEFT JOIN public.profiles p ON p.id = u.id
  WHERE p.id IS NULL;
  GET DIAGNOSTICS cnt = ROW_COUNT;
  RETURN cnt;
END;
$$;

-- 8) Team hierarchy RPC (for manager functionality)
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

-- 9) RLS Policies
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Drop all existing policies
DROP POLICY IF EXISTS profiles_read_access ON public.profiles;
DROP POLICY IF EXISTS profiles_update_self ON public.profiles;
DROP POLICY IF EXISTS profiles_insert_self ON public.profiles;
DROP POLICY IF EXISTS "Users can read own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can view their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can insert their own profile" ON public.profiles;

-- Read: self; managers can read their tree; admin/support read all
CREATE POLICY profiles_read_access
ON public.profiles FOR SELECT
USING (
  auth.uid() = id
  OR EXISTS (SELECT 1 FROM public.profiles me WHERE me.id = auth.uid() AND me.role IN ('admin','support'))
  OR id IN (SELECT user_id FROM public.rpc_team_user_ids(auth.uid()))
);

-- Update: self only (admins/support can do via service key or SQL)
CREATE POLICY profiles_update_self
ON public.profiles FOR UPDATE
USING (auth.uid() = id);

-- Insert: allow profile creation
CREATE POLICY profiles_insert_self
ON public.profiles FOR INSERT
WITH CHECK (auth.uid() = id);

-- 10) Grant permissions
GRANT SELECT, INSERT, UPDATE ON public.profiles TO authenticated;
GRANT USAGE ON SCHEMA public TO authenticated;

-- 11) Execute one-time backfill for existing users
SELECT public.backfill_profiles() as profiles_created;

-- 12) Update your specific account to admin role
UPDATE public.profiles 
SET role = 'admin'::user_role, updated_at = NOW()
WHERE email = 'themartining@gmail.com' OR email ILIKE '%martin%';

-- 13) Verify setup
SELECT 'Auth system setup complete!' as status;
SELECT COUNT(*) as total_profiles FROM public.profiles;
SELECT role, COUNT(*) as count FROM public.profiles GROUP BY role ORDER BY count DESC;

-- 14) Show all profiles for verification
SELECT 
    id,
    email,
    name,
    role,
    created_at,
    updated_at
FROM public.profiles 
ORDER BY created_at DESC
LIMIT 10;
