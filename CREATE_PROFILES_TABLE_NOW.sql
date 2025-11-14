-- ============================================
-- URGENT: CREATE PROFILES TABLE
-- ============================================
-- Run this IMMEDIATELY in Supabase SQL Editor
-- This will create the missing profiles table
-- ============================================

-- Check if profiles table exists, create if not
DO $$ 
BEGIN
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

        RAISE NOTICE '✅ Created profiles table';
    ELSE
        RAISE NOTICE 'ℹ️  Profiles table exists, adding missing columns...';
        
        -- Add missing columns
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'profiles' AND column_name = 'wallet_balance') THEN
            ALTER TABLE public.profiles ADD COLUMN wallet_balance numeric(10, 2) DEFAULT 0 NOT NULL;
        END IF;
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'profiles' AND column_name = 'phone_verified_at') THEN
            ALTER TABLE public.profiles ADD COLUMN phone_verified_at timestamptz;
        END IF;
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'profiles' AND column_name = 'last_login_at') THEN
            ALTER TABLE public.profiles ADD COLUMN last_login_at timestamptz;
        END IF;
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'profiles' AND column_name = 'remember_token') THEN
            ALTER TABLE public.profiles ADD COLUMN remember_token text;
        END IF;
    END IF;
END $$;

-- Enable RLS
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Create helper function
CREATE OR REPLACE FUNCTION public.is_user_role(user_id uuid, allowed_roles text[])
RETURNS boolean
SECURITY DEFINER
SET search_path = public
LANGUAGE plpgsql
STABLE
AS $$
DECLARE
    user_role text;
BEGIN
    SELECT role INTO user_role FROM public.profiles WHERE id = user_id;
    RETURN user_role = ANY(allowed_roles);
END;
$$;

-- Create RLS policies
DROP POLICY IF EXISTS "Users can view their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can update their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Allow profile creation during signup" ON public.profiles;
DROP POLICY IF EXISTS "Admins can view all profiles" ON public.profiles;
DROP POLICY IF EXISTS "Admins can update all profiles" ON public.profiles;

CREATE POLICY "Users can view their own profile" ON public.profiles FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Admins can view all profiles" ON public.profiles FOR SELECT USING (auth.uid() = id OR public.is_user_role(auth.uid(), ARRAY['admin', 'support', 'manager']));
CREATE POLICY "Users can update their own profile" ON public.profiles FOR UPDATE USING (auth.uid() = id);
CREATE POLICY "Admins can update all profiles" ON public.profiles FOR UPDATE USING (auth.uid() = id OR public.is_user_role(auth.uid(), ARRAY['admin', 'support']));
CREATE POLICY "Allow profile creation during signup" ON public.profiles FOR INSERT WITH CHECK (true);

-- Create trigger for auto-profile creation
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

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created AFTER INSERT ON auth.users FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Create updated_at trigger
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$ BEGIN NEW.updated_at = now(); RETURN NEW; END; $$ LANGUAGE plpgsql;
DROP TRIGGER IF EXISTS update_profiles_updated_at ON public.profiles;
CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON public.profiles FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Create wallet balance function
CREATE OR REPLACE FUNCTION get_user_wallet_balance(p_user_id uuid)
RETURNS numeric
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE v_balance numeric;
BEGIN
    SELECT COALESCE(wallet_balance, 0) INTO v_balance FROM public.profiles WHERE id = p_user_id;
    RETURN COALESCE(v_balance, 0);
END;
$$;

GRANT EXECUTE ON FUNCTION get_user_wallet_balance TO authenticated;

-- Verify
SELECT '✅ Profiles table created successfully!' as status;


