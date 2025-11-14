-- Fix: Generate UUID for wallet_topup_requests when ID is not provided
-- This fixes the error: "null value in column "id" of relation "payment_operations" violates not-null constraint"

-- Update the sync function to generate ID if not provided
CREATE OR REPLACE FUNCTION public.sync_wallet_topup_requests_to_payment_operations()
RETURNS trigger AS $$
DECLARE
  v_metadata jsonb;
  v_id uuid;
BEGIN
  -- Generate ID if not provided
  v_id := COALESCE(NEW.id, gen_random_uuid());
  
  v_metadata := jsonb_build_object(
    'payment_method', NEW.payment_method,
    'receipt_file_url', NEW.receipt_file_url,
    'receipt_file_name', NEW.receipt_file_name,
    'validated_by', NEW.validated_by,
    'validated_at', NEW.validated_at,
    'admin_notes', NEW.admin_notes,
    'rejected_reason', NEW.rejected_reason,
    'payment_transaction_id', NEW.payment_transaction_id
  );

  INSERT INTO public.payment_operations (id, profile_id, wallet_id, operation_type, provider, provider_transaction_id, status, amount, currency, metadata, requested_at, processed_at, created_at, updated_at)
  VALUES (
    v_id,
    NEW.user_id,
    NULL,
    'topup_request',
    NEW.gateway,
    NEW.gateway_transaction_id,
    CASE
      WHEN NEW.status ILIKE 'pending' THEN 'pending'
      WHEN NEW.status ILIKE 'processing' THEN 'processing'
      WHEN NEW.status ILIKE 'approved' THEN 'completed'
      WHEN NEW.status ILIKE 'rejected' THEN 'failed'
      WHEN NEW.status ILIKE 'cancel%' THEN 'cancelled'
      ELSE 'pending'
    END,
    NEW.amount,
    'EGP',
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

