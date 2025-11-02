-- ============================================
-- FIX PROFILES RLS - ENSURE USERS CAN READ THEIR OWN PROFILE
-- ============================================
-- Issue: Users cannot read their own profile due to RLS policies
-- Solution: Add explicit policy for users to read their own profile
-- ============================================

-- Drop conflicting policies
DROP POLICY IF EXISTS "Users can view their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Admins can view all profiles" ON public.profiles;

-- Users can ALWAYS view their own profile (highest priority)
CREATE POLICY "Users can view their own profile"
    ON public.profiles
    FOR SELECT
    USING (auth.uid() = id);

-- Admins can view all profiles (includes their own)
CREATE POLICY "Admins and privileged roles can view all profiles"
    ON public.profiles
    FOR SELECT
    USING (
        auth.uid() = id  -- Can always see own profile
        OR public.is_user_role(auth.uid(), ARRAY['admin', 'support', 'manager'])
    );

-- ============================================
-- VERIFICATION
-- ============================================

-- List all SELECT policies on profiles
SELECT 
    schemaname,
    tablename,
    policyname,
    permissive,
    roles,
    cmd
FROM pg_policies 
WHERE tablename = 'profiles'
AND cmd = 'SELECT'
ORDER BY policyname;

-- ============================================
-- SUCCESS MESSAGE
-- ============================================

SELECT '✅ Profiles RLS fixed - users can now read their own profile!' as status;

