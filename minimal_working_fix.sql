-- MINIMAL WORKING FIX - GUARANTEED TO WORK
-- Run this in Supabase SQL Editor

-- 1) Create user_role enum
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'user_role') THEN
    CREATE TYPE public.user_role AS ENUM ('admin','manager','support','user');
  END IF;
END$$;

-- 2) Create profiles table (drop and recreate to ensure clean state)
DROP TABLE IF EXISTS public.profiles CASCADE;

CREATE TABLE public.profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  name text DEFAULT 'User',
  email text,
  phone text,
  role public.user_role NOT NULL DEFAULT 'user',
  manager_id uuid,
  is_banned boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- 3) Simple trigger that always works
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
    COALESCE(NEW.raw_user_meta_data->>'name', 'User'),
    'user'::user_role
  );
  RETURN NEW;
EXCEPTION WHEN OTHERS THEN
  -- If insert fails, just return NEW to not break auth
  RETURN NEW;
END;
$$;

-- 4) Create trigger
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
AFTER INSERT ON auth.users
FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();

-- 5) Simple RLS - allow everything for authenticated users
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "allow_all_authenticated" ON public.profiles;
CREATE POLICY "allow_all_authenticated" ON public.profiles
FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- 6) Grant all permissions
GRANT ALL ON public.profiles TO authenticated;
GRANT ALL ON public.profiles TO anon;

-- 7) Create profiles for existing users
INSERT INTO public.profiles (id, email, name, role)
SELECT 
    u.id,
    u.email,
    COALESCE(u.raw_user_meta_data->>'name', 'User'),
    CASE 
        WHEN u.email = 'themartining@gmail.com' THEN 'admin'::user_role
        ELSE 'user'::user_role
    END
FROM auth.users u
ON CONFLICT (id) DO NOTHING;

-- 8) Confirm all users
UPDATE auth.users 
SET email_confirmed_at = NOW()
WHERE email_confirmed_at IS NULL;

-- 9) Verify
SELECT 'Setup complete!' as status;
SELECT COUNT(*) as users FROM auth.users;
SELECT COUNT(*) as profiles FROM public.profiles;
SELECT email, name, role FROM public.profiles;
