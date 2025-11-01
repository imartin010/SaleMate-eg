-- ============================================
-- AUTO-CREATE PROFILES FOR ALL USERS
-- ============================================
-- This migration ensures that:
-- 1. A trigger automatically creates profiles for new users
-- 2. Existing users without profiles get profiles created
-- ============================================

-- STEP 1: Ensure trigger function exists for automatic profile creation
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

-- STEP 2: Create trigger if it doesn't exist
-- ============================================

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_new_user();

-- STEP 3: Create profiles for existing users that don't have profiles
-- ============================================

-- Insert profiles for all auth.users that don't have a profile yet
INSERT INTO public.profiles (id, name, email, phone, role)
SELECT 
    u.id,
    COALESCE(
        u.raw_user_meta_data->>'name',
        split_part(u.email, '@', 1),
        'User'
    ) as name,
    u.email,
    COALESCE(
        u.raw_user_meta_data->>'phone',
        u.phone,
        ''
    ) as phone,
    COALESCE(
        u.raw_user_meta_data->>'role',
        'user'
    )::text as role
FROM auth.users u
WHERE NOT EXISTS (
    SELECT 1 FROM public.profiles p WHERE p.id = u.id
)
ON CONFLICT (id) DO NOTHING;

-- STEP 4: Verify the setup
-- ============================================

-- Check trigger exists
DO $$
DECLARE
    trigger_exists boolean;
    profiles_count integer;
    users_count integer;
    missing_profiles integer;
BEGIN
    -- Check if trigger exists
    SELECT EXISTS (
        SELECT 1 FROM pg_trigger 
        WHERE tgname = 'on_auth_user_created'
        AND tgrelid = 'auth.users'::regclass
    ) INTO trigger_exists;
    
    -- Count profiles
    SELECT COUNT(*) INTO profiles_count FROM public.profiles;
    
    -- Count auth users
    SELECT COUNT(*) INTO users_count FROM auth.users;
    
    -- Count missing profiles
    SELECT COUNT(*) INTO missing_profiles
    FROM auth.users u
    WHERE NOT EXISTS (
        SELECT 1 FROM public.profiles p WHERE p.id = u.id
    );
    
    -- Display results
    RAISE NOTICE '✅ Trigger exists: %', trigger_exists;
    RAISE NOTICE '✅ Total auth users: %', users_count;
    RAISE NOTICE '✅ Total profiles: %', profiles_count;
    RAISE NOTICE '✅ Missing profiles: %', missing_profiles;
    
    IF trigger_exists AND missing_profiles = 0 THEN
        RAISE NOTICE '✅ SUCCESS: All users have profiles and trigger is active!';
    ELSIF NOT trigger_exists THEN
        RAISE WARNING '⚠️  WARNING: Trigger not found!';
    ELSIF missing_profiles > 0 THEN
        RAISE WARNING '⚠️  WARNING: % users still missing profiles!', missing_profiles;
    END IF;
END $$;

-- ============================================
-- SUCCESS MESSAGE
-- ============================================

SELECT 
    '✅ Automatic profile creation configured!' as status,
    'Trigger will create profiles for all new users automatically.' as message,
    (SELECT COUNT(*) FROM public.profiles) as total_profiles,
    (SELECT COUNT(*) FROM auth.users) as total_users;

