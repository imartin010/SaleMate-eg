-- ============================================
-- FIX TOTAL_AMOUNT/TOTAL_PRICE COLUMN MISMATCH
-- ============================================
-- The code uses 'total_amount' but database might have 'total_price'
-- This migration ensures 'total_amount' exists and renames if needed

DO $$ 
BEGIN
    -- Check if total_price exists and needs to be renamed
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'purchase_requests' 
        AND column_name = 'total_price'
    ) AND NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'purchase_requests' 
        AND column_name = 'total_amount'
    ) THEN
        -- Rename total_price to total_amount
        ALTER TABLE public.purchase_requests 
        RENAME COLUMN total_price TO total_amount;
        
        RAISE NOTICE '✅ Renamed total_price to total_amount';
    END IF;
    
    -- If total_amount doesn't exist at all, create it
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'purchase_requests' 
        AND column_name = 'total_amount'
    ) THEN
        ALTER TABLE public.purchase_requests 
        ADD COLUMN total_amount numeric(10, 2);
        
        -- Add check constraint
        ALTER TABLE public.purchase_requests
        ADD CONSTRAINT purchase_requests_total_amount_check 
        CHECK (total_amount > 0);
        
        -- Try to copy data from total_price if it exists
        IF EXISTS (
            SELECT 1 FROM information_schema.columns 
            WHERE table_schema = 'public' 
            AND table_name = 'purchase_requests' 
            AND column_name = 'total_price'
        ) THEN
            UPDATE public.purchase_requests 
            SET total_amount = total_price 
            WHERE total_amount IS NULL;
            
            -- Drop old column
            ALTER TABLE public.purchase_requests 
            DROP COLUMN IF EXISTS total_price;
        END IF;
        
        -- Make NOT NULL if all rows have values
        IF NOT EXISTS (
            SELECT 1 FROM public.purchase_requests WHERE total_amount IS NULL
        ) THEN
            ALTER TABLE public.purchase_requests 
            ALTER COLUMN total_amount SET NOT NULL;
        END IF;
        
        RAISE NOTICE '✅ Created total_amount column';
    ELSE
        -- Ensure total_amount is NOT NULL if table is empty or all rows have values
        IF (SELECT COUNT(*) FROM public.purchase_requests) = 0 OR
           NOT EXISTS (SELECT 1 FROM public.purchase_requests WHERE total_amount IS NULL)
        THEN
            -- Remove NOT NULL constraint temporarily if needed
            ALTER TABLE public.purchase_requests 
            ALTER COLUMN total_amount DROP NOT NULL;
            
            -- Try to set default for any NULL values
            UPDATE public.purchase_requests 
            SET total_amount = 0 
            WHERE total_amount IS NULL;
            
            -- Now make it NOT NULL
            ALTER TABLE public.purchase_requests 
            ALTER COLUMN total_amount SET NOT NULL;
            
            RAISE NOTICE '✅ Made total_amount NOT NULL';
        END IF;
    END IF;
    
    -- Drop total_price if it still exists (shouldn't after rename, but just in case)
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'purchase_requests' 
        AND column_name = 'total_price'
    ) AND EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'purchase_requests' 
        AND column_name = 'total_amount'
    ) THEN
        -- Both exist, drop total_price
        ALTER TABLE public.purchase_requests 
        DROP COLUMN total_price;
        
        RAISE NOTICE '✅ Dropped duplicate total_price column';
    END IF;
END $$;

-- Verify column exists with correct name
DO $$
DECLARE
    col_exists boolean;
BEGIN
    SELECT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'purchase_requests' 
        AND column_name = 'total_amount'
    ) INTO col_exists;
    
    IF col_exists THEN
        RAISE NOTICE '✅ total_amount column verified successfully!';
    ELSE
        RAISE EXCEPTION '❌ total_amount column not found after migration';
    END IF;
END $$;

