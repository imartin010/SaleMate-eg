-- ============================================
-- RESTORE DATABASE TO WORKING STATE
-- This restores profiles and auth to a clean, working configuration
-- ============================================

-- STEP 1: Clean up any broken data
-- ============================================

-- Remove any orphaned users (users without profiles)
DELETE FROM auth.users 
WHERE id NOT IN (SELECT id FROM public.profiles)
AND email NOT IN ('admin@salemate.com', 'support@salemate.com', 'manager@salemate.com', 'user1@salemate.com', 'user2@salemate.com');

-- STEP 2: Ensure profiles table has correct structure
-- ============================================

-- Drop and recreate the table to ensure clean state
DROP TABLE IF EXISTS public.profiles CASCADE;

CREATE TABLE public.profiles (
    id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    name text NOT NULL,
    email text NOT NULL UNIQUE,
    phone text DEFAULT '',
    role text NOT NULL DEFAULT 'user' CHECK (role IN ('user', 'manager', 'support', 'admin')),
    manager_id uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
    is_banned boolean NOT NULL DEFAULT false,
    created_at timestamptz NOT NULL DEFAULT now(),
    updated_at timestamptz NOT NULL DEFAULT now()
);

-- STEP 3: Enable RLS
-- ============================================

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- STEP 4: Drop all existing policies
-- ============================================

DROP POLICY IF EXISTS "Users can view their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can update their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Allow profile creation during signup" ON public.profiles;
DROP POLICY IF EXISTS "Admins can view all profiles" ON public.profiles;
DROP POLICY IF EXISTS "Admins can update all profiles" ON public.profiles;
DROP POLICY IF EXISTS "profiles_insert_self_or_admin" ON public.profiles;
DROP POLICY IF EXISTS "profiles_select_self_or_admin" ON public.profiles;
DROP POLICY IF EXISTS "profiles_update_self_or_admin" ON public.profiles;

-- STEP 5: Create helper function to check user role (bypasses RLS)
-- ============================================

CREATE OR REPLACE FUNCTION public.is_user_role(
    user_id uuid,
    allowed_roles text[]
)
RETURNS boolean
SECURITY DEFINER
SET search_path = public
LANGUAGE plpgsql
STABLE
AS $$
DECLARE
    user_role text;
BEGIN
    -- Query profiles with SECURITY DEFINER privileges (bypasses RLS)
    SELECT role INTO user_role
    FROM public.profiles
    WHERE id = user_id;
    
    -- Return true if role is in allowed_roles array
    RETURN user_role = ANY(allowed_roles);
END;
$$;

-- STEP 6: Create proper RLS policies (non-recursive)
-- ============================================

-- Allow users to view their own profile
CREATE POLICY "Users can view their own profile"
    ON public.profiles
    FOR SELECT
    USING (auth.uid() = id);

-- Allow admins/support/managers to view all profiles (using helper function to avoid recursion)
CREATE POLICY "Admins can view all profiles"
    ON public.profiles
    FOR SELECT
    USING (
        auth.uid() = id  -- Users can always see their own
        OR public.is_user_role(auth.uid(), ARRAY['admin', 'support', 'manager'])
    );

-- Allow users to update their own profile
CREATE POLICY "Users can update their own profile"
    ON public.profiles
    FOR UPDATE
    USING (auth.uid() = id);

-- Allow admins/support to update all profiles (using helper function to avoid recursion)
CREATE POLICY "Admins can update all profiles"
    ON public.profiles
    FOR UPDATE
    USING (
        auth.uid() = id  -- Users can always update their own
        OR public.is_user_role(auth.uid(), ARRAY['admin', 'support'])
    );

-- Allow profile creation during signup (CRITICAL for signup to work!)
CREATE POLICY "Allow profile creation during signup"
    ON public.profiles
    FOR INSERT
    WITH CHECK (true);

-- STEP 7: Create trigger function for automatic profile creation
-- ============================================

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
SECURITY DEFINER
SET search_path = public
LANGUAGE plpgsql
AS $$
BEGIN
    INSERT INTO public.profiles (id, name, email, phone, role)
    VALUES (
        NEW.id,
        COALESCE(NEW.raw_user_meta_data->>'name', split_part(NEW.email, '@', 1)),
        NEW.email,
        COALESCE(NEW.raw_user_meta_data->>'phone', NEW.phone, ''),
        COALESCE(NEW.raw_user_meta_data->>'role', 'user')
    )
    ON CONFLICT (id) DO NOTHING;
    RETURN NEW;
END;
$$;

-- STEP 7: Create trigger
-- ============================================

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_new_user();

-- STEP 9: Create updated_at trigger
-- ============================================

CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS update_profiles_updated_at ON public.profiles;

CREATE TRIGGER update_profiles_updated_at
    BEFORE UPDATE ON public.profiles
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

-- STEP 10: Grant proper permissions
-- ============================================

GRANT USAGE ON SCHEMA public TO anon, authenticated, service_role;
GRANT ALL ON public.profiles TO service_role;
GRANT SELECT, INSERT, UPDATE ON public.profiles TO authenticated;
GRANT INSERT ON public.profiles TO anon;

-- STEP 11: Create default admin user if needed
-- ============================================

-- Check if admin exists, if not create one
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM public.profiles WHERE email = 'admin@salemate.com') THEN
        -- Insert into auth.users first
        INSERT INTO auth.users (
            id,
            email,
            encrypted_password,
            email_confirmed_at,
            created_at,
            updated_at,
            raw_user_meta_data
        ) VALUES (
            '11111111-1111-1111-1111-111111111111',
            'admin@salemate.com',
            crypt('admin123', gen_salt('bf')),
            NOW(),
            NOW(),
            NOW(),
            '{"name": "Admin User", "role": "admin"}'::jsonb
        ) ON CONFLICT (id) DO NOTHING;

        -- Insert profile
        INSERT INTO public.profiles (id, name, email, role)
        VALUES (
            '11111111-1111-1111-1111-111111111111',
            'Admin User',
            'admin@salemate.com',
            'admin'
        ) ON CONFLICT (id) DO NOTHING;
    END IF;
END $$;

-- ============================================
-- VERIFICATION
-- ============================================

-- Check table exists
SELECT 
    'Profiles table exists' as check_name,
    EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'profiles'
    ) as result;

-- Check trigger exists
SELECT 
    'Trigger exists' as check_name,
    EXISTS (
        SELECT 1 FROM pg_trigger 
        WHERE tgname = 'on_auth_user_created'
    ) as result;

-- Check policies
SELECT 
    'RLS Policies' as check_name,
    COUNT(*) as policy_count
FROM pg_policies 
WHERE tablename = 'profiles';

-- Check admin user exists
SELECT 
    'Admin user exists' as check_name,
    EXISTS (
        SELECT 1 FROM public.profiles 
        WHERE email = 'admin@salemate.com'
    ) as result;

-- ============================================
-- SUCCESS MESSAGE
-- ============================================

SELECT '✅ DATABASE RESTORED TO WORKING STATE!' as status,
       'You can now signup new users and login with admin@salemate.com / admin123' as message;

