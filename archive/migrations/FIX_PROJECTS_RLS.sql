-- ============================================
-- FIX PROJECTS TABLE RLS POLICIES
-- ============================================
-- Run this in Supabase SQL Editor
-- This allows admins to read from the projects table
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

SELECT '✅ Projects RLS policies added!' as status;

