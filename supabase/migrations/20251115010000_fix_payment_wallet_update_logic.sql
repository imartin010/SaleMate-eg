-- Fix process_payment_and_topup to allow wallet update even if status is already completed
-- The issue: If transaction status is already 'completed' (e.g., from webhook), 
-- the function was returning early and wallet balance was never updated.
-- 
-- Fix: Check if wallet was already updated by checking completed_at timestamp.
-- Only skip processing if status is completed AND completed_at is already set.

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
    v_wallet_updated boolean := false;
BEGIN
    -- Get transaction details
    SELECT * INTO v_transaction
    FROM payment_transactions
    WHERE id = p_transaction_id;
    
    IF NOT FOUND THEN
        RETURN jsonb_build_object('success', false, 'error', 'Transaction not found');
    END IF;
    
    -- Check if wallet was already updated by checking completed_at
    -- If completed_at is NULL, wallet hasn't been updated yet
    v_wallet_updated := (v_transaction.completed_at IS NOT NULL);
    
    -- Only prevent processing if status is already completed AND wallet was already updated
    IF v_transaction.status IN ('completed', 'failed', 'cancelled') AND v_wallet_updated THEN
        RETURN jsonb_build_object('success', true, 'message', 'Transaction already processed', 'transaction_id', p_transaction_id, 'status', p_status);
    END IF;
    
    -- Update transaction status
    UPDATE payment_transactions
    SET 
        status = p_status,
        updated_at = now(),
        completed_at = CASE WHEN p_status = 'completed' AND completed_at IS NULL THEN now() ELSE completed_at END
    WHERE id = p_transaction_id;
    
    -- If completed and is wallet topup, update wallet (only if not already updated)
    IF p_status = 'completed' AND v_transaction.transaction_type = 'wallet_topup' AND NOT v_wallet_updated THEN
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
        'status', p_status,
        'wallet_updated', NOT v_wallet_updated AND p_status = 'completed' AND v_transaction.transaction_type = 'wallet_topup'
    );
END;
$$;

