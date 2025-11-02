-- ============================================
-- ADD ADMIN_NOTES COLUMN TO PURCHASE_REQUESTS
-- ============================================
-- This migration adds the admin_notes column if it doesn't exist
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
    ELSE
        RAISE NOTICE '✅ admin_notes column already exists';
    END IF;
END $$;

-- Verify the column exists
SELECT 
    column_name,
    data_type,
    is_nullable
FROM information_schema.columns
WHERE table_schema = 'public'
AND table_name = 'purchase_requests'
AND column_name = 'admin_notes';

SELECT '✅ admin_notes column fix complete!' as status;

