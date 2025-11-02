-- ============================================
-- FIX TOTAL_AMOUNT/TOTAL_PRICE COLUMN MISMATCH
-- ============================================
-- This fixes the column name mismatch between code (total_amount) and database (total_price)

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
        
        -- Try to copy data from total_price if it exists
        IF EXISTS (
            SELECT 1 FROM information_schema.columns 
            WHERE table_schema = 'public' 
            AND table_name = 'purchase_requests' 
            AND column_name = 'total_price'
        ) THEN
            UPDATE public.purchase_requests 
            SET total_amount = total_price 
            WHERE total_amount IS NULL AND total_price IS NOT NULL;
            
            -- Drop old column after copying
            ALTER TABLE public.purchase_requests 
            DROP COLUMN IF EXISTS total_price;
        END IF;
        
        -- Add check constraint
        IF NOT EXISTS (
            SELECT 1 FROM information_schema.table_constraints 
            WHERE constraint_name = 'purchase_requests_total_amount_check'
        ) THEN
            ALTER TABLE public.purchase_requests
            ADD CONSTRAINT purchase_requests_total_amount_check 
            CHECK (total_amount IS NULL OR total_amount > 0);
        END IF;
        
        RAISE NOTICE '✅ Created total_amount column';
    END IF;
    
    -- Ensure total_amount is NOT NULL (if table is empty or all rows have values)
    IF (SELECT COUNT(*) FROM public.purchase_requests) = 0 THEN
        -- Table is empty, make it NOT NULL
        ALTER TABLE public.purchase_requests 
        ALTER COLUMN total_amount SET NOT NULL;
        RAISE NOTICE '✅ Made total_amount NOT NULL (empty table)';
    ELSIF NOT EXISTS (SELECT 1 FROM public.purchase_requests WHERE total_amount IS NULL) THEN
        -- All rows have values, make it NOT NULL
        BEGIN
            ALTER TABLE public.purchase_requests 
            ALTER COLUMN total_amount DROP NOT NULL;
        EXCEPTION WHEN OTHERS THEN
            -- Constraint doesn't exist, that's fine
            NULL;
        END;
        
        -- Set default for any potential NULL values
        UPDATE public.purchase_requests 
        SET total_amount = 0 
        WHERE total_amount IS NULL;
        
        -- Now make it NOT NULL
        ALTER TABLE public.purchase_requests 
        ALTER COLUMN total_amount SET NOT NULL;
        
        RAISE NOTICE '✅ Made total_amount NOT NULL';
    ELSE
        -- Some rows have NULL, set defaults first
        UPDATE public.purchase_requests 
        SET total_amount = 0 
        WHERE total_amount IS NULL;
        
        -- Remove NOT NULL constraint if it exists
        BEGIN
            ALTER TABLE public.purchase_requests 
            ALTER COLUMN total_amount DROP NOT NULL;
        EXCEPTION WHEN OTHERS THEN
            -- Constraint doesn't exist, that's fine
            NULL;
        END;
        
        -- Make it NOT NULL now
        ALTER TABLE public.purchase_requests 
        ALTER COLUMN total_amount SET NOT NULL;
        
        RAISE NOTICE '✅ Set defaults and made total_amount NOT NULL';
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

