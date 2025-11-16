-- WALLET DEDUCTION FUNCTION - Secure balance reduction for purchases
-- This replaces the old function that used user_wallets table
-- Now works with profiles.wallet_balance as the single source of truth

CREATE OR REPLACE FUNCTION deduct_from_wallet(
  p_user_id UUID,
  p_amount NUMERIC,
  p_description TEXT DEFAULT 'Lead purchase'
)
RETURNS JSONB AS $$
DECLARE
  v_current_balance NUMERIC;
  v_new_balance NUMERIC;
BEGIN
  -- CRITICAL: Lock the profile row to prevent race conditions
  -- FOR UPDATE ensures no other transaction can modify this balance simultaneously
  SELECT wallet_balance INTO v_current_balance
  FROM profiles
  WHERE id = p_user_id
  FOR UPDATE; -- Prevent concurrent balance modifications

  -- Check if profile exists
  IF v_current_balance IS NULL THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'User profile not found'
    );
  END IF;

  -- VALIDATE: Check sufficient balance before deduction
  IF v_current_balance < p_amount THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', format('Insufficient funds. Balance: %s EGP, Required: %s EGP', v_current_balance, p_amount)
    );
  END IF;

  -- Calculate new balance
  v_new_balance := v_current_balance - p_amount;

  -- CRITICAL: Deduct from wallet balance - this is the single point of balance reduction
  UPDATE profiles
  SET wallet_balance = v_new_balance,
      updated_at = NOW()
  WHERE id = p_user_id;

  -- Log transaction in wallet_transactions if table exists
  BEGIN
    INSERT INTO wallet_transactions (
      user_id,
      amount,
      transaction_type,
      description,
      status,
      created_at,
      updated_at
    ) VALUES (
      p_user_id,
      -p_amount,
      'debit',
      p_description,
      'completed',
      NOW(),
      NOW()
    );
  EXCEPTION
    WHEN undefined_table THEN
      -- Table doesn't exist, skip logging
      NULL;
    WHEN undefined_column THEN
      -- Table exists but structure is different, skip logging
      NULL;
    WHEN OTHERS THEN
      -- Other error, skip logging but don't fail the transaction
      NULL;
  END;

  -- Return success with new balance
  RETURN jsonb_build_object(
    'success', true,
    'new_balance', v_new_balance,
    'deducted_amount', p_amount,
    'description', p_description
  );

EXCEPTION
  WHEN OTHERS THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'Wallet deduction failed: ' || SQLERRM
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant permissions
GRANT EXECUTE ON FUNCTION deduct_from_wallet(UUID, NUMERIC, TEXT) TO authenticated;

-- Set search path for security
ALTER FUNCTION deduct_from_wallet(UUID, NUMERIC, TEXT) SET search_path = public;
