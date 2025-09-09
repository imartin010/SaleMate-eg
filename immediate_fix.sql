-- IMMEDIATE FIX FOR LOCALHOST AND PROFILES
-- Run this in Supabase SQL Editor right now

-- 1) First, let's see what auth users exist
SELECT 
    id,
    email,
    email_confirmed_at,
    created_at
FROM auth.users 
ORDER BY created_at DESC;

-- 2) Auto-confirm all existing users (so they can log in)
UPDATE auth.users 
SET email_confirmed_at = COALESCE(email_confirmed_at, NOW()),
    confirmed_at = COALESCE(confirmed_at, NOW())
WHERE email IS NOT NULL;

-- 3) Create the profiles table if it doesn't exist
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

-- 4) Create profiles for all existing users immediately
INSERT INTO public.profiles (id, email, name, role)
SELECT 
    u.id,
    u.email,
    COALESCE(u.raw_user_meta_data->>'name', SPLIT_PART(u.email, '@', 1), 'User') as name,
    CASE 
        WHEN u.email ILIKE '%admin%' OR u.email = 'themartining@gmail.com' THEN 'admin'::user_role
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

-- 5) Create the trigger for future signups
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

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
AFTER INSERT ON auth.users
FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();

-- 6) Set up basic RLS
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "profiles_select" ON public.profiles;
CREATE POLICY "profiles_select" ON public.profiles
    FOR SELECT USING (auth.uid() = id);

DROP POLICY IF EXISTS "profiles_insert" ON public.profiles;
CREATE POLICY "profiles_insert" ON public.profiles
    FOR INSERT WITH CHECK (auth.uid() = id);

DROP POLICY IF EXISTS "profiles_update" ON public.profiles;
CREATE POLICY "profiles_update" ON public.profiles
    FOR UPDATE USING (auth.uid() = id);

-- 7) Grant permissions
GRANT ALL ON public.profiles TO authenticated;

-- 8) Verification
SELECT 'Setup complete!' as status;
SELECT COUNT(*) as total_users FROM auth.users;
SELECT COUNT(*) as total_profiles FROM public.profiles;
SELECT email, name, role FROM public.profiles ORDER BY created_at DESC;
