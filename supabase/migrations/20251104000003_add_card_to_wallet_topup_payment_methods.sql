-- ============================================
-- ADD 'CARD' TO WALLET_TOPUP_REQUESTS PAYMENT METHODS
-- ============================================
-- Updates the payment_method CHECK constraint to include 'Card'
-- for credit/debit card payments via payment gateway
-- ============================================

-- Drop existing constraint if it exists
DO $$ 
DECLARE
    v_constraint_name text;
BEGIN
    -- Find the constraint name (qualify column reference to avoid ambiguity)
    SELECT tc.constraint_name INTO v_constraint_name
    FROM information_schema.table_constraints tc
    WHERE tc.constraint_schema = 'public' 
    AND tc.table_name = 'wallet_topup_requests' 
    AND tc.constraint_type = 'CHECK'
    AND tc.constraint_name LIKE '%payment_method%'
    LIMIT 1;
    
    IF v_constraint_name IS NOT NULL THEN
        EXECUTE format('ALTER TABLE public.wallet_topup_requests DROP CONSTRAINT IF EXISTS %I', v_constraint_name);
        RAISE NOTICE '✅ Dropped existing payment_method constraint: %', v_constraint_name;
    END IF;
END $$;

-- Add new constraint that includes 'Card'
ALTER TABLE public.wallet_topup_requests
ADD CONSTRAINT wallet_topup_requests_payment_method_check 
CHECK (payment_method IN ('Instapay', 'VodafoneCash', 'BankTransfer', 'Card'));

-- Verify the constraint
DO $$
BEGIN
    RAISE NOTICE '✅ Updated payment_method constraint to include Card';
    RAISE NOTICE '   Allowed values: Instapay, VodafoneCash, BankTransfer, Card';
END $$;

