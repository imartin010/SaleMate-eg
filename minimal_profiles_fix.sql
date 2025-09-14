-- MINIMAL PROFILES TABLE CREATION
-- This will create the profiles table that's missing

-- First, create the user_role enum if it doesn't exist
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname='user_role') THEN
    CREATE TYPE public.user_role AS ENUM ('admin','manager','support','user');
  END IF;
END $$;

-- Drop and recreate profiles table
DROP TABLE IF EXISTS public.profiles CASCADE;

CREATE TABLE public.profiles (
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

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_profiles_manager ON public.profiles(manager_id);
CREATE INDEX IF NOT EXISTS idx_profiles_role ON public.profiles(role);
CREATE INDEX IF NOT EXISTS idx_profiles_email ON public.profiles(email);

-- Enable RLS
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Create basic RLS policy (simplified)
CREATE POLICY profiles_read_all ON public.profiles FOR SELECT USING (true);
CREATE POLICY profiles_insert_self ON public.profiles FOR INSERT WITH CHECK (auth.uid() = id);
CREATE POLICY profiles_update_self ON public.profiles FOR UPDATE USING (auth.uid() = id);

-- Grant permissions
GRANT ALL ON public.profiles TO authenticated;

-- Insert a test admin user
INSERT INTO public.profiles (id, email, name, role, created_at, updated_at)
VALUES 
    ('11111111-1111-1111-1111-111111111111', 'admin@salemate.com', 'Admin User', 'admin'::user_role, NOW(), NOW()),
    ('33333333-3333-3333-3333-333333333333', 'themartining@gmail.com', 'Mohamed Abdelraheem', 'admin'::user_role, NOW(), NOW())
ON CONFLICT (id) DO UPDATE SET
    role = EXCLUDED.role,
    updated_at = NOW();

-- Test that the table exists
SELECT 'Profiles table created successfully!' as status;
SELECT COUNT(*) as profile_count FROM public.profiles;
SELECT id, email, name, role FROM public.profiles;
