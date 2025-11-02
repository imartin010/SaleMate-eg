-- ============================================
-- ADD TOTAL_AMOUNT COLUMN TO PURCHASE_REQUESTS
-- ============================================
-- This migration adds the total_amount column if it doesn't exist

-- Add total_amount column if it doesn't exist
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'purchase_requests' 
        AND column_name = 'total_amount'
    ) THEN
        ALTER TABLE public.purchase_requests 
        ADD COLUMN total_amount numeric(10, 2);
        
        -- Add check constraint for positive amount
        ALTER TABLE public.purchase_requests
        ADD CONSTRAINT purchase_requests_total_amount_check 
        CHECK (total_amount > 0);
        
        -- Make it NOT NULL if there are no existing rows, otherwise make it nullable first
        -- We'll calculate from quantity * price_per_lead if needed
        IF (SELECT COUNT(*) FROM public.purchase_requests) = 0 THEN
            ALTER TABLE public.purchase_requests 
            ALTER COLUMN total_amount SET NOT NULL;
        END IF;
    END IF;
END $$;

-- If column exists but is nullable, try to backfill from projects table
-- This calculates total_amount = quantity * price_per_lead
UPDATE public.purchase_requests pr
SET total_amount = (
    SELECT p.price_per_lead * pr.quantity
    FROM public.projects p
    WHERE p.id = pr.project_id
)
WHERE pr.total_amount IS NULL
AND EXISTS (
    SELECT 1 FROM public.projects p 
    WHERE p.id = pr.project_id 
    AND p.price_per_lead IS NOT NULL
);

-- Now make it NOT NULL if we successfully backfilled or if table was empty
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM public.purchase_requests WHERE total_amount IS NULL
    ) THEN
        -- All rows have total_amount, make it NOT NULL
        ALTER TABLE public.purchase_requests 
        ALTER COLUMN total_amount SET NOT NULL;
    ELSE
        -- Some rows might still be NULL, keep it nullable but add default
        ALTER TABLE public.purchase_requests 
        ALTER COLUMN total_amount SET DEFAULT 0;
    END IF;
END $$;

-- Verify column exists
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
        RAISE NOTICE '✅ total_amount column added successfully!';
    ELSE
        RAISE EXCEPTION '❌ Failed to add total_amount column';
    END IF;
END $$;

