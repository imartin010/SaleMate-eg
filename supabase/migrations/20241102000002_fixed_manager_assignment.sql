-- ============================================
-- FIXED MANAGER ASSIGNMENT
-- ============================================
-- Assign all users without a manager to specific UUID:
-- 11111111-1111-1111-1111-111111111111
-- ============================================

-- Update handle_new_user trigger to use fixed UUID
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
SECURITY DEFINER
SET search_path = public
LANGUAGE plpgsql
AS $$
DECLARE
    default_manager_id uuid := '11111111-1111-1111-1111-111111111111';
BEGIN
    -- Insert profile with fixed manager UUID if no manager specified
    INSERT INTO public.profiles (id, name, email, phone, role, manager_id)
    VALUES (
        NEW.id,
        COALESCE(NEW.raw_user_meta_data->>'name', split_part(NEW.email, '@', 1)),
        NEW.email,
        COALESCE(NEW.raw_user_meta_data->>'phone', NEW.phone, ''),
        COALESCE(NEW.raw_user_meta_data->>'role', 'user'),
        COALESCE((NEW.raw_user_meta_data->>'manager_id')::uuid, default_manager_id)
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

-- Update existing users without managers to use fixed UUID
UPDATE public.profiles
SET manager_id = '11111111-1111-1111-1111-111111111111'
WHERE manager_id IS NULL 
AND role != 'admin'
AND id != '11111111-1111-1111-1111-111111111111';

-- ============================================
-- VERIFICATION
-- ============================================

-- Check the function exists
SELECT 
    routine_name,
    routine_type
FROM information_schema.routines
WHERE routine_schema = 'public'
AND routine_name = 'handle_new_user';

-- Check how many users have the fixed manager
SELECT 
    COUNT(*) as users_with_fixed_manager
FROM public.profiles
WHERE manager_id = '11111111-1111-1111-1111-111111111111';

-- ============================================
-- SUCCESS MESSAGE
-- ============================================

SELECT '✅ Fixed manager assignment to UUID 11111111-1111-1111-1111-111111111111' as status;

