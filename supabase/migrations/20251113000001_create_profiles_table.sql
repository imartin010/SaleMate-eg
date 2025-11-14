-- ============================================
-- CREATE PROFILES TABLE
-- ============================================
-- This migration creates the profiles table if it doesn't exist
-- Includes all required columns: wallet_balance, phone_verified_at, etc.
-- ============================================

-- STEP 1: Check if profiles table exists, create if not
-- ============================================

DO $$ 
BEGIN
    -- Check if table exists
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'profiles'
    ) THEN
        -- Create the profiles table
        CREATE TABLE public.profiles (
            id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
            name text NOT NULL,
            email text NOT NULL UNIQUE,
            phone text DEFAULT '',
            role text NOT NULL DEFAULT 'user' CHECK (role IN ('user', 'manager', 'support', 'admin')),
            manager_id uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
            is_banned boolean NOT NULL DEFAULT false,
            wallet_balance numeric(10, 2) DEFAULT 0 NOT NULL,
            phone_verified_at timestamptz,
            last_login_at timestamptz,
            remember_token text,
            created_at timestamptz NOT NULL DEFAULT now(),
            updated_at timestamptz NOT NULL DEFAULT now()
        );

        -- Create indexes
        CREATE INDEX IF NOT EXISTS idx_profiles_email ON public.profiles(email);
        CREATE INDEX IF NOT EXISTS idx_profiles_manager_id ON public.profiles(manager_id);
        CREATE INDEX IF NOT EXISTS idx_profiles_role ON public.profiles(role);

        RAISE NOTICE '✅ Created profiles table with all required columns';
    ELSE
        RAISE NOTICE 'ℹ️  Profiles table already exists, adding missing columns...';
        
        -- Add wallet_balance if missing
        IF NOT EXISTS (
            SELECT 1 FROM information_schema.columns 
            WHERE table_schema = 'public' 
            AND table_name = 'profiles' 
            AND column_name = 'wallet_balance'
        ) THEN
            ALTER TABLE public.profiles
            ADD COLUMN wallet_balance numeric(10, 2) DEFAULT 0 NOT NULL;
            RAISE NOTICE '✅ Added wallet_balance column';
        END IF;

        -- Add phone_verified_at if missing
        IF NOT EXISTS (
            SELECT 1 FROM information_schema.columns 
            WHERE table_schema = 'public' 
            AND table_name = 'profiles' 
            AND column_name = 'phone_verified_at'
        ) THEN
            ALTER TABLE public.profiles
            ADD COLUMN phone_verified_at timestamptz;
            RAISE NOTICE '✅ Added phone_verified_at column';
        END IF;

        -- Add last_login_at if missing
        IF NOT EXISTS (
            SELECT 1 FROM information_schema.columns 
            WHERE table_schema = 'public' 
            AND table_name = 'profiles' 
            AND column_name = 'last_login_at'
        ) THEN
            ALTER TABLE public.profiles
            ADD COLUMN last_login_at timestamptz;
            RAISE NOTICE '✅ Added last_login_at column';
        END IF;

        -- Add remember_token if missing
        IF NOT EXISTS (
            SELECT 1 FROM information_schema.columns 
            WHERE table_schema = 'public' 
            AND table_name = 'profiles' 
            AND column_name = 'remember_token'
        ) THEN
            ALTER TABLE public.profiles
            ADD COLUMN remember_token text;
            RAISE NOTICE '✅ Added remember_token column';
        END IF;

        -- Ensure wallet_balance has default and is not null
        BEGIN
            ALTER TABLE public.profiles
            ALTER COLUMN wallet_balance SET DEFAULT 0;
            
            UPDATE public.profiles
            SET wallet_balance = 0
            WHERE wallet_balance IS NULL;
            
            ALTER TABLE public.profiles
            ALTER COLUMN wallet_balance SET NOT NULL;
        EXCEPTION
            WHEN OTHERS THEN
                RAISE NOTICE '⚠️  Could not update wallet_balance constraints: %', SQLERRM;
        END;
    END IF;
END $$;

-- STEP 2: Enable RLS
-- ============================================

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- STEP 3: Create helper function to check user role (bypasses RLS)
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

-- STEP 4: Create RLS policies
-- ============================================

-- Drop existing policies to avoid conflicts
DROP POLICY IF EXISTS "Users can view their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can update their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Allow profile creation during signup" ON public.profiles;
DROP POLICY IF EXISTS "Admins can view all profiles" ON public.profiles;
DROP POLICY IF EXISTS "Admins can update all profiles" ON public.profiles;
DROP POLICY IF EXISTS "Admins and privileged roles can view all profiles" ON public.profiles;

-- Allow users to view their own profile
CREATE POLICY "Users can view their own profile"
    ON public.profiles
    FOR SELECT
    USING (auth.uid() = id);

-- Allow admins/support/managers to view all profiles
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

-- Allow admins/support to update all profiles
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

-- STEP 5: Create trigger function for automatic profile creation
-- ============================================

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
SECURITY DEFINER
SET search_path = public
LANGUAGE plpgsql
AS $$
BEGIN
    INSERT INTO public.profiles (id, name, email, phone, role, wallet_balance)
    VALUES (
        NEW.id,
        COALESCE(NEW.raw_user_meta_data->>'name', split_part(NEW.email, '@', 1)),
        NEW.email,
        COALESCE(NEW.raw_user_meta_data->>'phone', NEW.phone, ''),
        COALESCE(NEW.raw_user_meta_data->>'role', 'user'),
        0
    )
    ON CONFLICT (id) DO NOTHING;
    RETURN NEW;
END;
$$;

-- Create trigger for new user creation
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_new_user();

-- STEP 6: Create updated_at trigger
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

-- STEP 7: Create wallet balance RPC function
-- ============================================

CREATE OR REPLACE FUNCTION get_user_wallet_balance(p_user_id uuid)
RETURNS numeric
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_balance numeric;
BEGIN
    SELECT COALESCE(wallet_balance, 0) INTO v_balance
    FROM public.profiles
    WHERE id = p_user_id;
    
    RETURN COALESCE(v_balance, 0);
END;
$$;

-- Grant execute permission
GRANT EXECUTE ON FUNCTION get_user_wallet_balance TO authenticated;

-- STEP 8: Verify table creation
-- ============================================

DO $$
DECLARE
    table_exists boolean;
    column_count integer;
BEGIN
    SELECT EXISTS (
        SELECT 1 FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'profiles'
    ) INTO table_exists;
    
    IF table_exists THEN
        SELECT COUNT(*) INTO column_count
        FROM information_schema.columns
        WHERE table_schema = 'public'
        AND table_name = 'profiles';
        
        RAISE NOTICE '✅ Profiles table verified: % columns', column_count;
    ELSE
        RAISE WARNING '❌ Profiles table was not created!';
    END IF;
END $$;

-- Success message
SELECT '✅ Profiles table created/updated successfully!' as status;


