-- WORKING FIX FOR EMAIL CONFIRMATION AND PROFILES
-- Run this in Supabase SQL Editor

-- 1) Auto-confirm all existing users (only update email_confirmed_at)
UPDATE auth.users 
SET email_confirmed_at = COALESCE(email_confirmed_at, NOW())
WHERE email IS NOT NULL 
  AND email_confirmed_at IS NULL;

-- 2) Create profiles for all existing users immediately
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

-- 3) Create the trigger for future signups
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
    'user'::user_role
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
AFTER INSERT ON auth.users
FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();

-- 4) Basic RLS policies
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "profiles_all_access" ON public.profiles;
CREATE POLICY "profiles_all_access" ON public.profiles
    FOR ALL USING (auth.uid() = id);

GRANT ALL ON public.profiles TO authenticated;

-- 5) Verify everything works
SELECT 'Auth system setup complete!' as status;
SELECT COUNT(*) as total_users FROM auth.users;
SELECT COUNT(*) as total_profiles FROM public.profiles;

-- 6) Show your profile specifically
SELECT 
    email, 
    name, 
    role,
    created_at
FROM public.profiles 
WHERE email = 'themartining@gmail.com' OR email ILIKE '%martin%';

-- 7) Show all profiles created
SELECT 
    email,
    name, 
    role
FROM public.profiles 
ORDER BY created_at DESC;
