-- Fix profile creation for signup
-- This will ensure profiles are created when users sign up

-- First, let's check if the trigger function exists and recreate it
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
    COALESCE((NEW.raw_user_meta_data->>'role')::text, 'user'),
    NEW.raw_user_meta_data->>'phone',
    NOW(),
    NOW()
  )
  ON CONFLICT (id) DO UPDATE SET
    email = EXCLUDED.email,
    name = COALESCE(EXCLUDED.name, profiles.name),
    phone = COALESCE(EXCLUDED.phone, profiles.phone),
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

-- Ensure the profiles table has the right structure
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS phone text,
ADD COLUMN IF NOT EXISTS created_at timestamptz DEFAULT now(),
ADD COLUMN IF NOT EXISTS updated_at timestamptz DEFAULT now();

-- Update RLS policies to allow profile creation
DROP POLICY IF EXISTS "Users can insert their own profile" ON public.profiles;
CREATE POLICY "Users can insert their own profile" ON public.profiles
  FOR INSERT WITH CHECK (auth.uid() = id);

DROP POLICY IF EXISTS "Users can view their own profile" ON public.profiles;
CREATE POLICY "Users can view their own profile" ON public.profiles
  FOR SELECT USING (auth.uid() = id);

DROP POLICY IF EXISTS "Users can update their own profile" ON public.profiles;
CREATE POLICY "Users can update their own profile" ON public.profiles
  FOR UPDATE USING (auth.uid() = id);

-- Enable RLS on profiles table
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Grant necessary permissions
GRANT USAGE ON SCHEMA public TO anon, authenticated;
GRANT ALL ON public.profiles TO authenticated;
GRANT SELECT ON public.profiles TO anon;

-- Test the trigger function
SELECT 'Profile creation trigger setup complete' as status;