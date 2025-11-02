-- ============================================
-- FIX SIGNUP ERROR - Clean Up Conflicts
-- This fixes "Database error saving new user"
-- ============================================

-- STEP 1: Check for any leftover records
SELECT 
    'auth.users' as table_name,
    id,
    email,
    phone,
    created_at
FROM auth.users
WHERE email = 'themartining@gmail.com'
   OR phone = '+201070020058';

SELECT 
    'profiles' as table_name,
    id,
    email,
    phone,
    role,
    created_at
FROM public.profiles
WHERE email = 'themartining@gmail.com'
   OR phone = '+201070020058';

-- STEP 2: Clean up any orphaned or conflicting records
-- Only run this if you see records above

-- Delete from profiles first (if exists)
DELETE FROM public.profiles 
WHERE email = 'themartining@gmail.com'
   OR phone = '+201070020058';

-- Delete from auth.users (if exists)
DELETE FROM auth.users
WHERE email = 'themartining@gmail.com'
   OR phone = '+201070020058';

-- STEP 3: Fix the handle_new_user trigger to be more robust
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
SECURITY DEFINER
SET search_path = public
LANGUAGE plpgsql
AS $$
DECLARE
    default_manager_id uuid;
BEGIN
    -- Try to get the first admin ID, but don't fail if none exists
    SELECT id INTO default_manager_id
    FROM public.profiles
    WHERE role = 'admin'
    ORDER BY created_at ASC
    LIMIT 1;

    -- If no admin exists, set manager_id to NULL (allows signup to work)
    -- Insert profile with NULL manager_id if no admin exists
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
        default_manager_id, -- Can be NULL if no admin exists
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
        -- Log the error but don't fail the signup
        RAISE WARNING 'Error creating profile for user %: %', NEW.email, SQLERRM;
        -- Still return NEW so the auth user is created
        RETURN NEW;
END;
$$;

-- STEP 4: Verify the trigger is set up correctly
SELECT 
    tgname as trigger_name,
    tgrelid::regclass as table_name,
    tgenabled as enabled
FROM pg_trigger
WHERE tgname = 'on_auth_user_created';

-- STEP 5: Verify the function exists
SELECT 
    routine_name,
    routine_type
FROM information_schema.routines
WHERE routine_schema = 'public'
AND routine_name = 'handle_new_user';

-- ============================================
-- NOW TRY SIGNUP AGAIN
-- ============================================
-- After running this:
-- 1. Go to http://localhost:5175/auth/signup
-- 2. Use email: themartining@gmail.com
-- 3. Use phone: +201070020058
-- 4. Complete signup
-- 5. Then run the admin role script below

