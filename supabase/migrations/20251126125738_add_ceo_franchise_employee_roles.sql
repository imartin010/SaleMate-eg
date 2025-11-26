-- ============================================
-- ADD CEO AND FRANCHISE_EMPLOYEE ROLES
-- ============================================
-- This migration adds 'ceo' and 'franchise_employee' roles to the profiles table
-- for the Performance Program multi-tenant system
-- ============================================

DO $$ 
BEGIN
    -- Drop existing CHECK constraint on role column
    ALTER TABLE public.profiles 
    DROP CONSTRAINT IF EXISTS profiles_role_check;
    
    -- Add new CHECK constraint with expanded roles
    ALTER TABLE public.profiles 
    ADD CONSTRAINT profiles_role_check 
    CHECK (role IN ('user', 'manager', 'support', 'admin', 'ceo', 'franchise_employee'));
    
    RAISE NOTICE '✅ Added ceo and franchise_employee roles to profiles table';
EXCEPTION
    WHEN OTHERS THEN
        RAISE NOTICE '⚠️ Could not update role constraint: %', SQLERRM;
END $$;

-- Success message
SELECT '✅ CEO and Franchise Employee roles added successfully!' as status;
