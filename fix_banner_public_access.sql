-- Fix Banner Access for Non-Logged-In Users
-- This allows anyone (including non-authenticated users) to view live banners

-- Drop existing read policy if it exists
DROP POLICY IF EXISTS "Anyone can view live banners" ON public.dashboard_banners;

-- Create policy that allows anyone to view live banners
-- This works for both authenticated and non-authenticated users
CREATE POLICY "Anyone can view live banners"
    ON public.dashboard_banners FOR SELECT
    USING (status = 'live');

-- Note: This policy allows:
-- - Non-authenticated users (auth.uid() is NULL) to view live banners
-- - Authenticated users to view live banners
-- - Only admins can INSERT/UPDATE/DELETE (via the existing admin policy)

