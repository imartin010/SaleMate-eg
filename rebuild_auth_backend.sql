-- REBUILD AUTHENTICATION SYSTEM - BACKEND
-- Run this in Supabase SQL Editor

-- 1) ENUM for roles (if not exists)
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'user_role') THEN
    CREATE TYPE public.user_role AS ENUM ('admin','manager','support','user');
  END IF;
END$$;

-- 2) profiles table
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

CREATE INDEX IF NOT EXISTS idx_profiles_manager ON public.profiles(manager_id);

-- 3) Trigger to auto-create profile on auth.users insert
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  INSERT INTO public.profiles (id, email, role)
  VALUES (NEW.id, NEW.email, 'user')
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
AFTER INSERT ON auth.users
FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();

-- 4) Helper RPC: ensure_profile (for race conditions / backfill-on-demand)
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
  VALUES (p_uid, p_name, COALESCE(p_email, ''), p_phone, COALESCE(p_role, 'user'))
  ON CONFLICT (id) DO UPDATE
    SET name = COALESCE(EXCLUDED.name, public.profiles.name),
        email = COALESCE(EXCLUDED.email, public.profiles.email),
        phone = COALESCE(EXCLUDED.phone, public.profiles.phone),
        updated_at = now()
  RETURNING * INTO out_row;
  RETURN out_row;
END;
$$;

-- 5) Backfill procedure + one-shot execution
CREATE OR REPLACE FUNCTION public.backfill_profiles()
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  cnt int := 0;
BEGIN
  INSERT INTO public.profiles (id, email, role)
  SELECT u.id, u.email, 'user'
  FROM auth.users u
  LEFT JOIN public.profiles p ON p.id = u.id
  WHERE p.id IS NULL;
  GET DIAGNOSTICS cnt = ROW_COUNT;
  RETURN cnt;
END;
$$;

-- 6) Team hierarchy RPC (if not exists)
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

-- 7) RLS Policies
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Read: self; managers can read their tree; admin/support read all
DROP POLICY IF EXISTS profiles_read_access ON public.profiles;
CREATE POLICY profiles_read_access
ON public.profiles FOR SELECT
USING (
  auth.uid() = id
  OR EXISTS (SELECT 1 FROM public.profiles me WHERE me.id = auth.uid() AND me.role IN ('admin','support'))
  OR id IN (SELECT user_id FROM public.rpc_team_user_ids(auth.uid()))
);

-- Update: self only (admins/support can do via service key or SQL)
DROP POLICY IF EXISTS profiles_update_self ON public.profiles;
CREATE POLICY profiles_update_self
ON public.profiles FOR UPDATE
USING (auth.uid() = id);

-- Insert: allow profile creation
DROP POLICY IF EXISTS profiles_insert_self ON public.profiles;
CREATE POLICY profiles_insert_self
ON public.profiles FOR INSERT
WITH CHECK (auth.uid() = id);

-- Grant permissions
GRANT SELECT, INSERT, UPDATE ON public.profiles TO authenticated;
GRANT USAGE ON SCHEMA public TO authenticated;

-- 8) One-time backfill execution
SELECT public.backfill_profiles() as profiles_created;

-- 9) Verify setup
SELECT 'Auth system setup complete' as status;
SELECT COUNT(*) as total_profiles FROM public.profiles;
SELECT role, COUNT(*) as count FROM public.profiles GROUP BY role;
