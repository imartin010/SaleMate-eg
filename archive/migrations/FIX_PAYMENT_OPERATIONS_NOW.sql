-- COMPLETE FIX for payment_operations NULL ID error
-- Run this in Supabase SQL Editor

-- Step 1: Drop and recreate the function with comprehensive NULL handling
DROP FUNCTION IF EXISTS public.sync_wallet_topup_requests_to_payment_operations() CASCADE;

CREATE OR REPLACE FUNCTION public.sync_wallet_topup_requests_to_payment_operations()
RETURNS trigger AS $$
DECLARE
  v_metadata jsonb;
  v_id uuid;
  v_currency text;
  v_gateway text;
  v_payment_method text;
BEGIN
  -- Generate ID if not provided (CRITICAL FIX)
  v_id := COALESCE(NEW.id, gen_random_uuid());
  
  -- Handle NULL values for required fields
  v_currency := COALESCE(NEW.currency, 'EGP');
  v_gateway := COALESCE(NEW.gateway, 'test');
  v_payment_method := COALESCE(NEW.payment_method, 'Card');
  
  -- Build metadata with NULL-safe handling
  v_metadata := jsonb_build_object(
    'payment_method', v_payment_method,
    'receipt_file_url', NEW.receipt_file_url,
    'receipt_file_name', NEW.receipt_file_name,
    'validated_by', NEW.validated_by,
    'validated_at', NEW.validated_at,
    'admin_notes', NEW.admin_notes,
    'rejected_reason', NEW.rejected_reason,
    'payment_transaction_id', NEW.payment_transaction_id
  );

  -- Insert into payment_operations with all NULL values handled
  INSERT INTO public.payment_operations (
    id, 
    profile_id, 
    wallet_id, 
    operation_type, 
    provider, 
    provider_transaction_id, 
    status, 
    amount, 
    currency, 
    metadata, 
    requested_at, 
    processed_at, 
    created_at, 
    updated_at
  )
  VALUES (
    v_id,  -- Always has a value now
    NEW.user_id,
    NULL,
    'topup_request',
    v_gateway,
    NEW.gateway_transaction_id,
    CASE
      WHEN NEW.status ILIKE 'pending' THEN 'pending'
      WHEN NEW.status ILIKE 'processing' THEN 'processing'
      WHEN NEW.status ILIKE 'approved' THEN 'completed'
      WHEN NEW.status ILIKE 'rejected' THEN 'failed'
      WHEN NEW.status ILIKE 'cancel%' THEN 'cancelled'
      ELSE COALESCE(NEW.status, 'pending')
    END,
    NEW.amount,
    v_currency,
    v_metadata,
    COALESCE(NEW.created_at, now()),
    NEW.updated_at,
    COALESCE(NEW.created_at, now()),
    COALESCE(NEW.updated_at, NEW.created_at, now())
  )
  ON CONFLICT (id) DO UPDATE
    SET profile_id = EXCLUDED.profile_id,
        wallet_id = EXCLUDED.wallet_id,
        operation_type = EXCLUDED.operation_type,
        provider = EXCLUDED.provider,
        provider_transaction_id = EXCLUDED.provider_transaction_id,
        status = EXCLUDED.status,
        amount = EXCLUDED.amount,
        currency = EXCLUDED.currency,
        metadata = EXCLUDED.metadata,
        requested_at = EXCLUDED.requested_at,
        processed_at = EXCLUDED.processed_at,
        created_at = EXCLUDED.created_at,
        updated_at = EXCLUDED.updated_at;

  -- Set the ID in NEW so it's returned to the caller
  NEW.id := v_id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Step 2: Ensure the INSTEAD OF trigger exists
DROP TRIGGER IF EXISTS trg_wallet_topup_requests_view_upsert ON public.wallet_topup_requests;
CREATE TRIGGER trg_wallet_topup_requests_view_upsert
INSTEAD OF INSERT OR UPDATE ON public.wallet_topup_requests
FOR EACH ROW EXECUTE FUNCTION public.sync_wallet_topup_requests_to_payment_operations();

-- Step 3: Verify the function was created
SELECT 
    'Function created successfully!' AS status,
    p.proname AS function_name
FROM pg_proc p
JOIN pg_namespace n ON p.pronamespace = n.oid
WHERE n.nspname = 'public' 
  AND p.proname = 'sync_wallet_topup_requests_to_payment_operations';

-- Step 4: Verify the trigger exists
SELECT 
    'Trigger created successfully!' AS status,
    tgname AS trigger_name,
    tgrelid::regclass AS table_name
FROM pg_trigger
WHERE tgname = 'trg_wallet_topup_requests_view_upsert';

