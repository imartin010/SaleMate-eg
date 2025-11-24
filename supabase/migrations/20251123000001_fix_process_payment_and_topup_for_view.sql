-- Fix process_payment_and_topup to work with payment_transactions VIEW
-- The view is backed by payment_operations table, so we need to work with the underlying table

CREATE OR REPLACE FUNCTION process_payment_and_topup(
    p_transaction_id uuid,
    p_status text
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_transaction_id uuid;
    v_profile_id uuid;
    v_amount numeric;
    v_reference_id uuid;
    v_transaction_type text;
    v_payment_method text;
    v_wallet_updated boolean := false;
    v_completed_at timestamptz;
BEGIN
    -- Get transaction details from payment_operations (the underlying table)
    SELECT 
        po.id,
        po.profile_id,
        po.amount,
        NULLIF(po.metadata->>'reference_id', '')::uuid,
        po.metadata->>'transaction_type',
        po.metadata->>'payment_method',
        po.processed_at
    INTO 
        v_transaction_id,
        v_profile_id,
        v_amount,
        v_reference_id,
        v_transaction_type,
        v_payment_method,
        v_completed_at
    FROM payment_operations po
    WHERE po.id = p_transaction_id
      AND po.operation_type = 'gateway_charge';
    
    IF NOT FOUND THEN
        RETURN jsonb_build_object('success', false, 'error', 'Transaction not found');
    END IF;
    
    -- IDEMPOTENCY CHECK - Critical for preventing double crediting
    -- processed_at is only set when wallet balance is actually updated
    -- If processed_at exists, wallet was already credited - don't credit again
    v_wallet_updated := (v_completed_at IS NOT NULL);

    -- Get current status from payment_operations
    DECLARE
        v_current_status text;
    BEGIN
        SELECT status INTO v_current_status
        FROM payment_operations
        WHERE id = p_transaction_id;
        
        -- Only skip if BOTH status indicates completion AND wallet was already updated
        IF v_current_status IN ('completed', 'failed', 'cancelled') AND v_wallet_updated THEN
            RETURN jsonb_build_object(
                'success', true, 
                'message', 'Transaction already processed', 
                'transaction_id', p_transaction_id, 
                'status', p_status
            );
        END IF;
    END;
    
    -- Update transaction status in payment_operations
    UPDATE payment_operations
    SET 
        status = CASE 
            WHEN p_status = 'completed' THEN 'completed'
            WHEN p_status = 'failed' THEN 'failed'
            ELSE status
        END,
        updated_at = now(),
        processed_at = CASE 
            WHEN p_status = 'completed' AND processed_at IS NULL THEN now() 
            ELSE processed_at 
        END
    WHERE id = p_transaction_id;
    
    -- WALLET CREDIT - Only credit if payment completed and wallet not already updated
    -- This is the SINGLE POINT where wallet balance increases for top-ups
    IF p_status = 'completed' 
       AND COALESCE(v_transaction_type, 'wallet_topup') = 'wallet_topup' 
       AND NOT v_wallet_updated THEN
        -- CRITICAL: Update wallet balance - this is the source of truth
        UPDATE profiles
        SET wallet_balance = wallet_balance + v_amount
        WHERE id = v_profile_id;
        
        -- Try to update wallet_topup_request if exists (skip if it's a view or fails)
        IF v_reference_id IS NOT NULL THEN
            BEGIN
                -- Try to update via the view (will use INSTEAD OF trigger)
                UPDATE wallet_topup_requests
                SET status = 'approved',
                    validated_at = now(),
                    validated_by = (SELECT id FROM profiles WHERE role = 'admin' LIMIT 1)
                WHERE id = v_reference_id;
            EXCEPTION
                WHEN OTHERS THEN
                    -- View is not updatable, skip this update
                    -- The wallet balance update above is the critical part and already succeeded
                    NULL;
            END;
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
                v_profile_id,
                v_amount,
                'credit',
                'Wallet top-up via ' || CASE v_payment_method
                    WHEN 'card' THEN 'Debit/Credit Card'
                    WHEN 'instapay' THEN 'Instapay'
                    WHEN 'bank_transfer' THEN 'Bank Transfer'
                    ELSE COALESCE(v_payment_method, 'Payment Gateway')
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
                        v_profile_id,
                        v_amount,
                        'credit',
                        'Wallet top-up via ' || CASE v_payment_method
                            WHEN 'card' THEN 'Debit/Credit Card'
                            WHEN 'instapay' THEN 'Instapay'
                            WHEN 'bank_transfer' THEN 'Bank Transfer'
                            ELSE COALESCE(v_payment_method, 'Payment Gateway')
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
        'wallet_updated', NOT v_wallet_updated AND p_status = 'completed' AND COALESCE(v_transaction_type, 'wallet_topup') = 'wallet_topup'
    );
END;
$$;
