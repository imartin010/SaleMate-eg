-- ============================================
-- ADD PAYMENT_METHOD COLUMN TO PURCHASE_REQUESTS
-- ============================================
-- This migration adds the payment_method column if it doesn't exist

-- Add payment_method column if it doesn't exist
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'purchase_requests' 
        AND column_name = 'payment_method'
    ) THEN
        ALTER TABLE public.purchase_requests 
        ADD COLUMN payment_method text NOT NULL DEFAULT 'Instapay';
        
        -- Add check constraint
        ALTER TABLE public.purchase_requests
        ADD CONSTRAINT purchase_requests_payment_method_check 
        CHECK (payment_method IN ('Instapay', 'Card', 'Wallet'));
    END IF;
END $$;

-- Update existing rows to have a default payment_method if NULL
UPDATE public.purchase_requests 
SET payment_method = 'Instapay' 
WHERE payment_method IS NULL;

-- Add other missing columns if needed
DO $$ 
BEGIN
    -- Add receipt_file_name if missing
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'purchase_requests' 
        AND column_name = 'receipt_file_name'
    ) THEN
        ALTER TABLE public.purchase_requests 
        ADD COLUMN receipt_file_name text;
    END IF;

    -- Ensure receipt_url exists (might be named differently)
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'purchase_requests' 
        AND column_name = 'receipt_url'
    ) THEN
        -- Check if it's named differently
        IF EXISTS (
            SELECT 1 FROM information_schema.columns 
            WHERE table_schema = 'public' 
            AND table_name = 'purchase_requests' 
            AND column_name = 'receipt_file_url'
        ) THEN
            -- Rename receipt_file_url to receipt_url
            ALTER TABLE public.purchase_requests 
            RENAME COLUMN receipt_file_url TO receipt_url;
        ELSE
            -- Add receipt_url column
            ALTER TABLE public.purchase_requests 
            ADD COLUMN receipt_url text;
        END IF;
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
        AND column_name = 'payment_method'
    ) INTO col_exists;
    
    IF col_exists THEN
        RAISE NOTICE '✅ payment_method column added successfully!';
    ELSE
        RAISE EXCEPTION '❌ Failed to add payment_method column';
    END IF;
END $$;

