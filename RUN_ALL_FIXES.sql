-- ============================================
-- COMPLETE FIX FOR PURCHASE REQUESTS PAGE
-- ============================================
-- Run this entire file in Supabase SQL Editor
-- This fixes both the projects RLS policies and admin_notes column
-- ============================================

-- ============================================
-- FIX 1: ADD RLS POLICIES FOR PROJECTS TABLE
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
-- FIX 2: ADD MISSING COLUMNS TO PURCHASE_REQUESTS
-- ============================================

DO $$ 
BEGIN
    -- Add admin_notes column if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'purchase_requests' 
        AND column_name = 'admin_notes'
    ) THEN
        ALTER TABLE public.purchase_requests 
        ADD COLUMN admin_notes text;
        
        RAISE NOTICE '✅ Added admin_notes column to purchase_requests';
    END IF;

    -- Add approved_by column if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'purchase_requests' 
        AND column_name = 'approved_by'
    ) THEN
        ALTER TABLE public.purchase_requests 
        ADD COLUMN approved_by uuid REFERENCES public.profiles(id) ON DELETE SET NULL;
        
        RAISE NOTICE '✅ Added approved_by column to purchase_requests';
    END IF;

    -- Add approved_at column if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'purchase_requests' 
        AND column_name = 'approved_at'
    ) THEN
        ALTER TABLE public.purchase_requests 
        ADD COLUMN approved_at timestamptz;
        
        RAISE NOTICE '✅ Added approved_at column to purchase_requests';
    END IF;

    -- Add rejected_at column if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'purchase_requests' 
        AND column_name = 'rejected_at'
    ) THEN
        ALTER TABLE public.purchase_requests 
        ADD COLUMN rejected_at timestamptz;
        
        RAISE NOTICE '✅ Added rejected_at column to purchase_requests';
    END IF;

    -- Add rejected_reason column if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'purchase_requests' 
        AND column_name = 'rejected_reason'
    ) THEN
        ALTER TABLE public.purchase_requests 
        ADD COLUMN rejected_reason text;
        
        RAISE NOTICE '✅ Added rejected_reason column to purchase_requests';
    END IF;
END $$;

-- ============================================
-- VERIFICATION
-- ============================================

-- Verify projects policies
SELECT 
    schemaname,
    tablename,
    policyname,
    cmd
FROM pg_policies 
WHERE tablename = 'projects'
ORDER BY policyname;

-- Verify all purchase_requests columns
SELECT 
    column_name,
    data_type,
    is_nullable
FROM information_schema.columns
WHERE table_schema = 'public'
AND table_name = 'purchase_requests'
AND column_name IN ('admin_notes', 'approved_by', 'approved_at', 'rejected_at', 'rejected_reason')
ORDER BY column_name;

-- ============================================
-- SUCCESS MESSAGE
-- ============================================

SELECT '✅ All fixes applied successfully!' as status;

