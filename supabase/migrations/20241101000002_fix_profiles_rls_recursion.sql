-- ============================================
-- FIX INFINITE RECURSION IN PROFILES RLS POLICIES
-- ============================================
-- Problem: Policies were querying profiles table within profiles RLS policies
-- Solution: Use SECURITY DEFINER function to bypass RLS when checking roles
-- ============================================

-- STEP 1: Create helper function to check user role (bypasses RLS)
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

-- STEP 2: Drop problematic recursive policies
-- ============================================

DROP POLICY IF EXISTS "Admins can view all profiles" ON public.profiles;
DROP POLICY IF EXISTS "Admins can update all profiles" ON public.profiles;
DROP POLICY IF EXISTS "Users can view their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can update their own profile" ON public.profiles;

-- STEP 3: Create non-recursive policies
-- ============================================

-- Users can view their own profile
CREATE POLICY "Users can view their own profile"
    ON public.profiles
    FOR SELECT
    USING (auth.uid() = id);

-- Allow admins/support/managers to view all profiles (using helper function)
CREATE POLICY "Admins can view all profiles"
    ON public.profiles
    FOR SELECT
    USING (
        auth.uid() = id  -- Users can always see their own
        OR public.is_user_role(auth.uid(), ARRAY['admin', 'support', 'manager'])
    );

-- Users can update their own profile
CREATE POLICY "Users can update their own profile"
    ON public.profiles
    FOR UPDATE
    USING (auth.uid() = id);

-- Allow admins/support to update all profiles (using helper function)
CREATE POLICY "Admins can update all profiles"
    ON public.profiles
    FOR UPDATE
    USING (
        auth.uid() = id  -- Users can always update their own
        OR public.is_user_role(auth.uid(), ARRAY['admin', 'support'])
    );

-- STEP 4: Ensure INSERT policy exists (for signup)
-- ============================================

DROP POLICY IF EXISTS "Allow profile creation during signup" ON public.profiles;

CREATE POLICY "Allow profile creation during signup"
    ON public.profiles
    FOR INSERT
    WITH CHECK (true);

-- ============================================
-- VERIFICATION
-- ============================================

-- Check that policies exist
SELECT 
    schemaname,
    tablename,
    policyname,
    permissive,
    roles,
    cmd,
    qual,
    with_check
FROM pg_policies 
WHERE tablename = 'profiles'
ORDER BY policyname;

-- ============================================
-- SUCCESS MESSAGE
-- ============================================

SELECT '✅ Profiles RLS policies fixed - no more infinite recursion!' as status;

