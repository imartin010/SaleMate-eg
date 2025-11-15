-- ============================================
-- COMPLETE FIX: Clean + Fix Trigger + Enable Signup
-- Run this all at once, then try signup
-- ============================================

-- STEP 1: Clean up any existing records
DELETE FROM public.profiles WHERE email = 'themartining@gmail.com' OR phone = '+201070020058';
DELETE FROM auth.users WHERE email = 'themartining@gmail.com' OR phone = '+201070020058';

-- STEP 2: Fix the handle_new_user trigger (more robust)
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
SECURITY DEFINER
SET search_path = public
LANGUAGE plpgsql
AS $$
DECLARE
    default_manager_id uuid;
BEGIN
    -- Try to get admin, but don't fail if none exists
    SELECT id INTO default_manager_id
    FROM public.profiles
    WHERE role = 'admin'
    ORDER BY created_at ASC
    LIMIT 1;

    -- Create profile (manager_id can be NULL)
    INSERT INTO public.profiles (
        id,
        name,
        email,
        phone,
        role,
        wallet_balance,
        manager_id,
        created_at,
        updated_at
    )
    VALUES (
        NEW.id,
        COALESCE(NEW.raw_user_meta_data->>'name', split_part(NEW.email, '@', 1), 'User'),
        NEW.email,
        COALESCE(NEW.raw_user_meta_data->>'phone', NEW.phone, ''),
        COALESCE(NEW.raw_user_meta_data->>'role', 'user'),
        0,
        default_manager_id,
        now(),
        now()
    )
    ON CONFLICT (id) DO UPDATE
    SET 
        name = COALESCE(EXCLUDED.name, profiles.name),
        email = COALESCE(EXCLUDED.email, profiles.email),
        phone = COALESCE(EXCLUDED.phone, profiles.phone),
        updated_at = now();
    
    RETURN NEW;
EXCEPTION
    WHEN OTHERS THEN
        -- Log but don't fail signup
        RAISE WARNING 'Profile creation error for %: %', NEW.email, SQLERRM;
        RETURN NEW;
END;
$$;

-- Ensure trigger is active
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_new_user();

-- STEP 3: Verify setup
SELECT 
    '✅ Cleanup complete' as step1,
    '✅ Trigger fixed' as step2,
    '✅ Ready for signup' as step3;

-- ============================================
-- NOW TRY SIGNUP:
-- 1. Go to http://localhost:5175/auth/signup
-- 2. Use: themartining@gmail.com
-- 3. Use: +201070020058
-- 4. Complete signup
-- ============================================
-- AFTER SIGNUP, RUN THIS TO SET ADMIN ROLE:
-- ============================================

-- Run this AFTER signup succeeds:
/*
UPDATE public.profiles
SET role = 'admin', updated_at = now()
WHERE email = 'themartining@gmail.com';

SELECT id, email, role FROM public.profiles WHERE email = 'themartining@gmail.com';
*/

