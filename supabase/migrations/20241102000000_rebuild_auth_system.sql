-- ============================================
-- AUTHENTICATION SYSTEM REBUILD
-- ============================================
-- This migration rebuilds the authentication system with:
-- 1. Phone OTP verification
-- 2. Manager hierarchy
-- 3. Remember me functionality
-- 4. Enhanced role-based access
-- ============================================

-- STEP 1: Update profiles table with new auth fields
-- ============================================

-- Add phone_verified_at column
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'profiles' 
        AND column_name = 'phone_verified_at'
    ) THEN
        ALTER TABLE public.profiles 
        ADD COLUMN phone_verified_at timestamptz;
    END IF;
END $$;

-- Add last_login_at column
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'profiles' 
        AND column_name = 'last_login_at'
    ) THEN
        ALTER TABLE public.profiles 
        ADD COLUMN last_login_at timestamptz;
    END IF;
END $$;

-- Add remember_token column
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'profiles' 
        AND column_name = 'remember_token'
    ) THEN
        ALTER TABLE public.profiles 
        ADD COLUMN remember_token text;
    END IF;
END $$;

-- Ensure manager_id column exists
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'profiles' 
        AND column_name = 'manager_id'
    ) THEN
        ALTER TABLE public.profiles 
        ADD COLUMN manager_id uuid REFERENCES public.profiles(id) ON DELETE SET NULL;
        
        CREATE INDEX IF NOT EXISTS idx_profiles_manager_id ON public.profiles(manager_id);
    END IF;
END $$;

-- STEP 2: Create OTP verifications table
-- ============================================

CREATE TABLE IF NOT EXISTS public.otp_verifications (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    phone text NOT NULL,
    code_hash text NOT NULL,
    attempts integer NOT NULL DEFAULT 0,
    verified boolean NOT NULL DEFAULT false,
    purpose text NOT NULL DEFAULT 'signup', -- 'signup', '2fa', 'reset'
    expires_at timestamptz NOT NULL,
    created_at timestamptz NOT NULL DEFAULT now(),
    updated_at timestamptz NOT NULL DEFAULT now()
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_otp_phone ON public.otp_verifications(phone);
CREATE INDEX IF NOT EXISTS idx_otp_expires_at ON public.otp_verifications(expires_at);
CREATE INDEX IF NOT EXISTS idx_otp_verified ON public.otp_verifications(verified);

-- Enable RLS
ALTER TABLE public.otp_verifications ENABLE ROW LEVEL SECURITY;

-- Policy: Only allow backend (service role) to manage OTPs
CREATE POLICY "Service role can manage OTPs"
    ON public.otp_verifications
    FOR ALL
    TO service_role
    USING (true)
    WITH CHECK (true);

-- STEP 3: Auto-cleanup function for expired OTPs
-- ============================================

CREATE OR REPLACE FUNCTION public.cleanup_expired_otps()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    DELETE FROM public.otp_verifications
    WHERE expires_at < now() - interval '1 hour';
END;
$$;

-- STEP 4: Get first admin user ID helper function
-- ============================================

CREATE OR REPLACE FUNCTION public.get_first_admin_id()
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
STABLE
AS $$
DECLARE
    admin_id uuid;
BEGIN
    SELECT id INTO admin_id
    FROM public.profiles
    WHERE role = 'admin'
    ORDER BY created_at ASC
    LIMIT 1;
    
    RETURN admin_id;
END;
$$;

-- STEP 5: Update handle_new_user trigger to auto-assign manager
-- ============================================

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
SECURITY DEFINER
SET search_path = public
LANGUAGE plpgsql
AS $$
DECLARE
    admin_id uuid;
BEGIN
    -- Get the first admin user ID
    admin_id := public.get_first_admin_id();
    
    -- Insert profile with auto-assigned admin as manager if no manager specified
    INSERT INTO public.profiles (id, name, email, phone, role, manager_id)
    VALUES (
        NEW.id,
        COALESCE(NEW.raw_user_meta_data->>'name', split_part(NEW.email, '@', 1)),
        NEW.email,
        COALESCE(NEW.raw_user_meta_data->>'phone', NEW.phone, ''),
        COALESCE(NEW.raw_user_meta_data->>'role', 'user'),
        COALESCE((NEW.raw_user_meta_data->>'manager_id')::uuid, admin_id)
    )
    ON CONFLICT (id) DO UPDATE
    SET 
        name = COALESCE(EXCLUDED.name, profiles.name),
        email = COALESCE(EXCLUDED.email, profiles.email),
        phone = COALESCE(EXCLUDED.phone, profiles.phone),
        manager_id = COALESCE(EXCLUDED.manager_id, profiles.manager_id);
    
    RETURN NEW;
END;
$$;

-- Recreate trigger
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_new_user();

-- STEP 6: Update existing users without managers to have admin as manager
-- ============================================

DO $$
DECLARE
    admin_id uuid;
BEGIN
    -- Get first admin
    admin_id := public.get_first_admin_id();
    
    -- Update users without managers (excluding admins themselves)
    IF admin_id IS NOT NULL THEN
        UPDATE public.profiles
        SET manager_id = admin_id
        WHERE manager_id IS NULL 
        AND role != 'admin'
        AND id != admin_id;
    END IF;
END $$;

-- STEP 7: Create function to hash OTP codes
-- ============================================

CREATE OR REPLACE FUNCTION public.hash_otp(code text)
RETURNS text
LANGUAGE plpgsql
IMMUTABLE
AS $$
BEGIN
    RETURN encode(digest(code, 'sha256'), 'hex');
END;
$$;

-- ============================================
-- VERIFICATION
-- ============================================

-- Check tables exist
SELECT 
    'profiles' as table_name,
    EXISTS(SELECT 1 FROM information_schema.tables WHERE table_name = 'profiles') as exists
UNION ALL
SELECT 
    'otp_verifications' as table_name,
    EXISTS(SELECT 1 FROM information_schema.tables WHERE table_name = 'otp_verifications') as exists;

-- Check new columns in profiles
SELECT 
    column_name,
    data_type
FROM information_schema.columns
WHERE table_schema = 'public'
AND table_name = 'profiles'
AND column_name IN ('phone_verified_at', 'last_login_at', 'remember_token', 'manager_id')
ORDER BY column_name;

-- ============================================
-- SUCCESS MESSAGE
-- ============================================

SELECT '✅ Authentication system rebuild complete!' as status;

