-- ============================================
-- WALLET DEDUCTION RPC FOR LEAD PURCHASES
-- ============================================

CREATE OR REPLACE FUNCTION deduct_from_wallet(
  p_user_id UUID,
  p_amount NUMERIC,
  p_description TEXT DEFAULT 'Lead purchase'
) 
RETURNS JSONB AS $$
DECLARE
  v_wallet_id UUID;
  v_current_balance NUMERIC;
  v_transaction_id UUID;
BEGIN
  -- Get wallet and current balance
  SELECT id, balance INTO v_wallet_id, v_current_balance
  FROM public.user_wallets 
  WHERE user_id = p_user_id
  FOR UPDATE; -- Lock the row to prevent race conditions

  -- Check if wallet exists
  IF v_wallet_id IS NULL THEN
    RAISE EXCEPTION 'Wallet not found for user';
  END IF;

  -- Check sufficient balance
  IF v_current_balance < p_amount THEN
    RAISE EXCEPTION 'Insufficient funds. Balance: % EGP, Required: % EGP', v_current_balance, p_amount;
  END IF;

  -- Deduct from wallet
  UPDATE public.user_wallets 
  SET balance = balance - p_amount,
      updated_at = NOW()
  WHERE id = v_wallet_id;

  -- Log transaction
  INSERT INTO public.wallet_transactions (
    wallet_id, 
    user_id, 
    type, 
    amount, 
    description, 
    status,
    created_at,
    updated_at
  )
  VALUES (
    v_wallet_id, 
    p_user_id, 
    'payment', 
    -p_amount, 
    p_description, 
    'completed',
    NOW(),
    NOW()
  )
  RETURNING id INTO v_transaction_id;

  -- Return success with new balance and transaction ID
  RETURN jsonb_build_object(
    'success', true,
    'new_balance', v_current_balance - p_amount,
    'transaction_id', v_transaction_id
  );
  
EXCEPTION
  WHEN OTHERS THEN
    RAISE EXCEPTION 'Wallet deduction failed: %', SQLERRM;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permission
GRANT EXECUTE ON FUNCTION deduct_from_wallet(UUID, NUMERIC, TEXT) TO authenticated;

