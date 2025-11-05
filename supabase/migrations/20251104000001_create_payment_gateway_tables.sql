-- Payment Gateway System - Test Mode
-- Creates tables for payment transactions and gateway integration

-- Payment Transactions Table
CREATE TABLE IF NOT EXISTS public.payment_transactions (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    amount numeric(10, 2) NOT NULL CHECK (amount > 0),
    currency text NOT NULL DEFAULT 'EGP',
    payment_method text NOT NULL CHECK (payment_method IN ('card', 'instapay', 'bank_transfer')),
    gateway text NOT NULL CHECK (gateway IN ('stripe', 'paymob', 'kashier', 'test')),
    gateway_transaction_id text,
    gateway_payment_intent_id text,
    status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'completed', 'failed', 'cancelled', 'refunded')),
    transaction_type text NOT NULL CHECK (transaction_type IN ('wallet_topup', 'lead_purchase', 'subscription')),
    reference_id uuid, -- References wallet_topup_requests or purchase_requests
    metadata jsonb,
    error_message text,
    test_mode boolean NOT NULL DEFAULT true,
    created_at timestamptz NOT NULL DEFAULT now(),
    updated_at timestamptz NOT NULL DEFAULT now(),
    completed_at timestamptz
);

-- Indexes for payment_transactions
CREATE INDEX IF NOT EXISTS idx_payment_transactions_user_id ON public.payment_transactions(user_id);
CREATE INDEX IF NOT EXISTS idx_payment_transactions_status ON public.payment_transactions(status);
CREATE INDEX IF NOT EXISTS idx_payment_transactions_gateway_transaction_id ON public.payment_transactions(gateway_transaction_id);
CREATE INDEX IF NOT EXISTS idx_payment_transactions_reference_id ON public.payment_transactions(reference_id);
CREATE INDEX IF NOT EXISTS idx_payment_transactions_created_at ON public.payment_transactions(created_at DESC);

-- Enable RLS
ALTER TABLE public.payment_transactions ENABLE ROW LEVEL SECURITY;

-- RLS Policies
DROP POLICY IF EXISTS "Users can view their own payment transactions" ON public.payment_transactions;
CREATE POLICY "Users can view their own payment transactions"
    ON public.payment_transactions
    FOR SELECT
    USING (user_id = auth.uid() OR EXISTS (
        SELECT 1 FROM public.profiles 
        WHERE id = auth.uid() AND role IN ('admin', 'support')
    ));

DROP POLICY IF EXISTS "Users can create their own payment transactions" ON public.payment_transactions;
CREATE POLICY "Users can create their own payment transactions"
    ON public.payment_transactions
    FOR INSERT
    WITH CHECK (user_id = auth.uid());

DROP POLICY IF EXISTS "Admins can update payment transactions" ON public.payment_transactions;
CREATE POLICY "Admins can update payment transactions"
    ON public.payment_transactions
    FOR UPDATE
    USING (EXISTS (
        SELECT 1 FROM public.profiles 
        WHERE id = auth.uid() AND role IN ('admin', 'support')
    ));

-- Update wallet_topup_requests to support gateway payments
ALTER TABLE public.wallet_topup_requests 
ADD COLUMN IF NOT EXISTS payment_transaction_id uuid REFERENCES public.payment_transactions(id) ON DELETE SET NULL,
ADD COLUMN IF NOT EXISTS gateway text CHECK (gateway IN ('stripe', 'paymob', 'kashier', 'manual', 'test')),
ADD COLUMN IF NOT EXISTS gateway_transaction_id text;

CREATE INDEX IF NOT EXISTS idx_wallet_topup_requests_payment_transaction_id ON public.wallet_topup_requests(payment_transaction_id);

-- Make receipt_file_url nullable for card payments (gateway payments don't require receipts)
DO $$ 
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'wallet_topup_requests' 
        AND column_name = 'receipt_file_url'
        AND is_nullable = 'NO'
    ) THEN
        ALTER TABLE public.wallet_topup_requests 
        ALTER COLUMN receipt_file_url DROP NOT NULL;
    END IF;
END $$;

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_payment_transactions_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger for updated_at
DROP TRIGGER IF EXISTS update_payment_transactions_updated_at ON public.payment_transactions;
CREATE TRIGGER update_payment_transactions_updated_at
    BEFORE UPDATE ON public.payment_transactions
    FOR EACH ROW
    EXECUTE FUNCTION update_payment_transactions_updated_at();

-- RPC Function: Process payment and update wallet
CREATE OR REPLACE FUNCTION process_payment_and_topup(
    p_transaction_id uuid,
    p_status text
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_transaction payment_transactions%ROWTYPE;
    v_user_id uuid;
    v_amount numeric;
    v_reference_id uuid;
BEGIN
    -- Get transaction details
    SELECT * INTO v_transaction
    FROM payment_transactions
    WHERE id = p_transaction_id;
    
    IF NOT FOUND THEN
        RETURN jsonb_build_object('success', false, 'error', 'Transaction not found');
    END IF;
    
    -- Check if already processed
    IF v_transaction.status IN ('completed', 'failed', 'cancelled') THEN
        RETURN jsonb_build_object('success', false, 'error', 'Transaction already processed');
    END IF;
    
    -- Update transaction status
    UPDATE payment_transactions
    SET 
        status = p_status,
        updated_at = now(),
        completed_at = CASE WHEN p_status = 'completed' THEN now() ELSE NULL END
    WHERE id = p_transaction_id;
    
    -- If completed and is wallet topup, update wallet
    IF p_status = 'completed' AND v_transaction.transaction_type = 'wallet_topup' THEN
        -- Update wallet balance
        UPDATE profiles
        SET wallet_balance = wallet_balance + v_transaction.amount
        WHERE id = v_transaction.user_id;
        
        -- Update wallet_topup_request if exists
        IF v_transaction.reference_id IS NOT NULL THEN
            UPDATE wallet_topup_requests
            SET status = 'approved',
                validated_at = now(),
                validated_by = (SELECT id FROM profiles WHERE role = 'admin' LIMIT 1)
            WHERE id = v_transaction.reference_id;
        END IF;
        
        -- Create wallet transaction record (if table exists and has compatible structure)
        BEGIN
            -- Try to insert with transaction_type column
            -- Format payment method for display
            INSERT INTO wallet_transactions (
                user_id,
                amount,
                transaction_type,
                description,
                reference_id,
                created_at
            ) VALUES (
                v_transaction.user_id,
                v_transaction.amount,
                'credit',
                'Wallet top-up via ' || CASE v_transaction.payment_method
                    WHEN 'card' THEN 'Debit/Credit Card'
                    WHEN 'instapay' THEN 'Instapay'
                    WHEN 'bank_transfer' THEN 'Bank Transfer'
                    ELSE v_transaction.payment_method
                END,
                p_transaction_id::text,
                now()
            );
        EXCEPTION
            WHEN undefined_table THEN
                -- Table doesn't exist, skip logging
                NULL;
            WHEN undefined_column THEN
                -- Table exists but column structure is different, try alternative structure
                BEGIN
                    INSERT INTO wallet_transactions (
                        user_id,
                        amount,
                        type,
                        description,
                        status,
                        created_at
                    ) VALUES (
                        v_transaction.user_id,
                        v_transaction.amount,
                        'credit',
                        'Wallet top-up via ' || CASE v_transaction.payment_method
                            WHEN 'card' THEN 'Debit/Credit Card'
                            WHEN 'instapay' THEN 'Instapay'
                            WHEN 'bank_transfer' THEN 'Bank Transfer'
                            ELSE v_transaction.payment_method
                        END,
                        'completed',
                        now()
                    );
                EXCEPTION
                    WHEN OTHERS THEN
                        -- If both structures fail, just skip logging
                        NULL;
                END;
            WHEN OTHERS THEN
                -- Any other error, skip logging
                NULL;
        END;
    END IF;
    
    RETURN jsonb_build_object(
        'success', true,
        'transaction_id', p_transaction_id,
        'status', p_status
    );
END;
$$;

-- Grant permissions
GRANT SELECT, INSERT, UPDATE ON public.payment_transactions TO authenticated;
GRANT EXECUTE ON FUNCTION process_payment_and_topup TO authenticated;

