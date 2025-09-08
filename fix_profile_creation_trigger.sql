-- Fix profile creation trigger for signup
-- This ensures profiles are created automatically when users sign up

-- Create or replace the trigger function
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
    COALESCE(NEW.raw_user_meta_data->>'name', SPLIT_PART(NEW.email, '@', 1)),
    CASE 
        WHEN NEW.email ILIKE '%admin%' THEN 'admin'::user_role
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
        WHEN EXCLUDED.email ILIKE '%admin%' THEN 'admin'::user_role
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
    RETURN NEW;
END;
$$;

-- Drop and recreate the trigger to ensure it's active
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Fix RLS policies to allow profile creation
DROP POLICY IF EXISTS "Users can insert their own profile" ON public.profiles;
CREATE POLICY "Users can insert their own profile" ON public.profiles
  FOR INSERT WITH CHECK (auth.uid() = id);

DROP POLICY IF EXISTS "Users can view their own profile" ON public.profiles;
CREATE POLICY "Users can view their own profile" ON public.profiles
  FOR SELECT USING (auth.uid() = id OR EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE id = auth.uid() 
    AND role IN ('admin', 'support')
  ));

DROP POLICY IF EXISTS "Users can update their own profile" ON public.profiles;
CREATE POLICY "Users can update their own profile" ON public.profiles
  FOR UPDATE USING (auth.uid() = id);

-- Enable RLS
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Grant necessary permissions
GRANT SELECT, INSERT, UPDATE ON public.profiles TO authenticated;
GRANT USAGE ON SCHEMA public TO authenticated;

-- Test the trigger by checking existing users without profiles
INSERT INTO public.profiles (id, email, name, role, created_at, updated_at)
SELECT 
    u.id,
    u.email,
    COALESCE(u.raw_user_meta_data->>'name', SPLIT_PART(u.email, '@', 1)) as name,
    CASE 
        WHEN u.email ILIKE '%admin%' THEN 'admin'::user_role
        WHEN u.email ILIKE '%support%' THEN 'support'::user_role
        WHEN u.email ILIKE '%manager%' THEN 'manager'::user_role
        ELSE 'user'::user_role
    END as role,
    u.created_at,
    NOW() as updated_at
FROM auth.users u
WHERE NOT EXISTS (
    SELECT 1 FROM public.profiles p WHERE p.id = u.id
)
ON CONFLICT (id) DO UPDATE SET
    email = EXCLUDED.email,
    name = COALESCE(EXCLUDED.name, profiles.name),
    updated_at = NOW();

-- Verify profiles were created
SELECT 
    'Profile creation verification:' as status,
    COUNT(*) as profile_count
FROM public.profiles;

-- Show all profiles
SELECT id, email, name, role, created_at 
FROM public.profiles 
ORDER BY created_at DESC;
