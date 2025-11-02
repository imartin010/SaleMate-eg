-- ============================================
-- ADD RLS POLICIES FOR PROJECTS TABLE
-- ============================================
-- Issue: Projects table has RLS enabled but no policies, blocking all queries
-- Solution: Add policies to allow admins and users to read projects
-- ============================================

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Users can view all projects" ON public.projects;
DROP POLICY IF EXISTS "Admins can manage all projects" ON public.projects;

-- Users can view all projects (projects are public for the shop)
CREATE POLICY "Users can view all projects"
    ON public.projects
    FOR SELECT
    USING (true);  -- Projects are public, anyone can view them

-- Admins and support can manage projects (INSERT, UPDATE, DELETE)
CREATE POLICY "Admins can manage all projects"
    ON public.projects
    FOR ALL
    USING (
        EXISTS (
            SELECT 1 FROM public.profiles 
            WHERE id = auth.uid() 
            AND role IN ('admin', 'support')
        )
    )
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.profiles 
            WHERE id = auth.uid() 
            AND role IN ('admin', 'support')
        )
    );

-- ============================================
-- VERIFICATION
-- ============================================

-- List all policies on projects
SELECT 
    schemaname,
    tablename,
    policyname,
    permissive,
    roles,
    cmd
FROM pg_policies 
WHERE tablename = 'projects'
ORDER BY policyname;

-- ============================================
-- SUCCESS MESSAGE
-- ============================================

SELECT '✅ Projects RLS policies added - users can now read projects!' as status;

