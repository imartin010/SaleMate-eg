-- ============================================
-- PHASE 2: CREATE COMPATIBILITY VIEWS AND CLEANUP
-- Create views for backward compatibility and drop old tables
-- ============================================

BEGIN;

-- ============================================
-- Step 1: Create compatibility views
-- ============================================

-- Commerce view
CREATE OR REPLACE VIEW public.commerce AS
SELECT
  t.id,
  t.transaction_category AS commerce_type,
  t.profile_id,
  t.project_id,
  t.lead_id,
  t.quantity,
  t.amount,
  t.currency,
  t.payment_method,
  t.payment_operation_id,
  t.status,
  t.receipt_url,
  t.receipt_file_name,
  t.approved_by,
  t.approved_at,
  t.notes,
  t.admin_notes,
  t.rejected_reason,
  t.batch_id,
  t.commission_rate,
  t.partner_id,
  t.metadata,
  t.created_at,
  t.updated_at
FROM public.transactions t
WHERE t.transaction_type = 'commerce';

COMMENT ON VIEW public.commerce IS 'Compatibility view - backed by transactions table';

-- Payments view
CREATE OR REPLACE VIEW public.payments AS
SELECT
  t.id,
  t.profile_id,
  t.wallet_id,
  t.transaction_category AS operation_type,
  t.ledger_entry_type AS entry_type,
  t.status,
  t.amount,
  t.currency,
  t.balance_after,
  t.provider,
  t.provider_transaction_id,
  t.description,
  t.reference_type,
  t.reference_id,
  t.receipt_url,
  t.receipt_file_name,
  t.validated_by,
  t.validated_at,
  t.admin_notes,
  t.rejected_reason,
  t.metadata,
  t.requested_at,
  t.processed_at,
  t.created_at,
  t.updated_at
FROM public.transactions t
WHERE t.transaction_type IN ('payment', 'topup');

COMMENT ON VIEW public.payments IS 'Compatibility view - backed by transactions table';

-- Wallet ledger entries view
CREATE OR REPLACE VIEW public.wallet_ledger_entries AS
SELECT
  t.id,
  t.profile_id,
  t.ledger_entry_type AS entry_type,
  t.amount,
  t.currency,
  t.running_balance AS balance_after,
  t.description,
  t.reference_type,
  t.reference_id,
  t.metadata,
  t.created_at,
  t.updated_at
FROM public.transactions t
WHERE t.ledger_entry_type IS NOT NULL;

COMMENT ON VIEW public.wallet_ledger_entries IS 'Compatibility view - backed by transactions table';

-- ============================================
-- Step 2: Create triggers for view compatibility
-- ============================================

-- Commerce view trigger
CREATE OR REPLACE FUNCTION public.sync_commerce_to_transactions()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    INSERT INTO public.transactions (
      transaction_type,
      transaction_category,
      profile_id,
      project_id,
      lead_id,
      amount,
      currency,
      quantity,
      commerce_type,
      payment_method,
      payment_operation_id,
      status,
      receipt_url,
      receipt_file_name,
      approved_by,
      approved_at,
      notes,
      admin_notes,
      rejected_reason,
      batch_id,
      commission_rate,
      partner_id,
      metadata,
      created_at,
      updated_at
    ) VALUES (
      'commerce',
      NEW.commerce_type,
      NEW.profile_id,
      NEW.project_id,
      NEW.lead_id,
      COALESCE(NEW.amount, 0),
      COALESCE(NEW.currency, 'EGP'),
      NEW.quantity,
      NEW.commerce_type,
      NEW.payment_method,
      NEW.payment_operation_id,
      COALESCE(NEW.status, 'pending'),
      NEW.receipt_url,
      NEW.receipt_file_name,
      NEW.approved_by,
      NEW.approved_at,
      NEW.notes,
      NEW.admin_notes,
      NEW.rejected_reason,
      NEW.batch_id,
      NEW.commission_rate,
      NEW.partner_id,
      COALESCE(NEW.metadata, '{}'::jsonb),
      COALESCE(NEW.created_at, now()),
      COALESCE(NEW.updated_at, now())
    ) RETURNING id INTO NEW.id;
    RETURN NEW;
  ELSIF TG_OP = 'UPDATE' THEN
    UPDATE public.transactions SET
      status = NEW.status,
      approved_by = NEW.approved_by,
      approved_at = NEW.approved_at,
      admin_notes = NEW.admin_notes,
      rejected_reason = NEW.rejected_reason,
      updated_at = now()
    WHERE id = NEW.id AND transaction_type = 'commerce';
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    DELETE FROM public.transactions WHERE id = OLD.id AND transaction_type = 'commerce';
    RETURN OLD;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_commerce_sync
INSTEAD OF INSERT OR UPDATE OR DELETE ON public.commerce
FOR EACH ROW EXECUTE FUNCTION public.sync_commerce_to_transactions();

-- Payments view trigger
CREATE OR REPLACE FUNCTION public.sync_payments_to_transactions()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    INSERT INTO public.transactions (
      transaction_type,
      transaction_category,
      profile_id,
      amount,
      currency,
      payment_method,
      provider,
      provider_transaction_id,
      wallet_id,
      ledger_entry_type,
      balance_after,
      status,
      receipt_url,
      receipt_file_name,
      validated_by,
      validated_at,
      description,
      admin_notes,
      rejected_reason,
      reference_type,
      reference_id,
      metadata,
      requested_at,
      processed_at,
      created_at,
      updated_at
    ) VALUES (
      CASE WHEN NEW.operation_type IN ('deposit', 'topup_request') THEN 'topup' ELSE 'payment' END,
      NEW.operation_type,
      NEW.profile_id,
      NEW.amount,
      COALESCE(NEW.currency, 'EGP'),
      NEW.payment_method,
      NEW.provider,
      NEW.provider_transaction_id,
      NEW.wallet_id,
      NEW.entry_type,
      NEW.balance_after,
      COALESCE(NEW.status, 'pending'),
      NEW.receipt_url,
      NEW.receipt_file_name,
      NEW.validated_by,
      NEW.validated_at,
      NEW.description,
      NEW.admin_notes,
      NEW.rejected_reason,
      NEW.reference_type,
      NEW.reference_id,
      COALESCE(NEW.metadata, '{}'::jsonb),
      NEW.requested_at,
      NEW.processed_at,
      COALESCE(NEW.created_at, now()),
      COALESCE(NEW.updated_at, now())
    ) RETURNING id INTO NEW.id;
    RETURN NEW;
  ELSIF TG_OP = 'UPDATE' THEN
    UPDATE public.transactions SET
      status = NEW.status,
      validated_by = NEW.validated_by,
      validated_at = NEW.validated_at,
      updated_at = now()
    WHERE id = NEW.id AND transaction_type IN ('payment', 'topup');
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    DELETE FROM public.transactions WHERE id = OLD.id AND transaction_type IN ('payment', 'topup');
    RETURN OLD;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_payments_sync
INSTEAD OF INSERT OR UPDATE OR DELETE ON public.payments
FOR EACH ROW EXECUTE FUNCTION public.sync_payments_to_transactions();

-- Wallet ledger view trigger
CREATE OR REPLACE FUNCTION public.sync_wallet_ledger_to_transactions()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    PERFORM public.add_to_wallet(
      NEW.profile_id,
      NEW.amount,
      NEW.description,
      NEW.reference_type,
      NEW.reference_id
    ) WHERE NEW.entry_type = 'credit';
    
    PERFORM public.deduct_from_wallet(
      NEW.profile_id,
      NEW.amount,
      NEW.description,
      NEW.reference_type,
      NEW.reference_id
    ) WHERE NEW.entry_type = 'debit';
    
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    DELETE FROM public.transactions WHERE id = OLD.id AND ledger_entry_type IS NOT NULL;
    RETURN OLD;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_wallet_ledger_sync
INSTEAD OF INSERT OR DELETE ON public.wallet_ledger_entries
FOR EACH ROW EXECUTE FUNCTION public.sync_wallet_ledger_to_transactions();

-- ============================================
-- Step 3: Drop old tables
-- ============================================

DO $$
BEGIN
  -- Drop commerce table if it's a BASE TABLE
  IF EXISTS (
    SELECT 1 FROM information_schema.tables 
    WHERE table_schema = 'public' AND table_name = 'commerce'
    AND table_type = 'BASE TABLE'
  ) THEN
    DROP TABLE public.commerce CASCADE;
    RAISE NOTICE '✅ Dropped commerce table';
  END IF;
  
  -- Drop payments table if it's a BASE TABLE
  IF EXISTS (
    SELECT 1 FROM information_schema.tables 
    WHERE table_schema = 'public' AND table_name = 'payments'
    AND table_type = 'BASE TABLE'
  ) THEN
    DROP TABLE public.payments CASCADE;
    RAISE NOTICE '✅ Dropped payments table';
  END IF;
  
  -- Drop wallet_ledger_entries table if it's a BASE TABLE
  IF EXISTS (
    SELECT 1 FROM information_schema.tables 
    WHERE table_schema = 'public' AND table_name = 'wallet_ledger_entries'
    AND table_type = 'BASE TABLE'
  ) THEN
    DROP TABLE public.wallet_ledger_entries CASCADE;
    RAISE NOTICE '✅ Dropped wallet_ledger_entries table';
  END IF;
END $$;

COMMIT;

-- ============================================
-- Verification
-- ============================================

DO $$
DECLARE
  v_table_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO v_table_count 
  FROM information_schema.tables 
  WHERE table_schema = 'public' AND table_type = 'BASE TABLE';
  
  RAISE NOTICE '========================================';
  RAISE NOTICE '✅ Phase 2 COMPLETE: Transactions consolidation';
  RAISE NOTICE '========================================';
  RAISE NOTICE 'Consolidated: commerce + payments + wallet_ledger → transactions';
  RAISE NOTICE 'Views created: 3 (commerce, payments, wallet_ledger_entries)';
  RAISE NOTICE 'Wallet functions: 4 available';
  RAISE NOTICE 'Current table count: %', v_table_count;
  RAISE NOTICE '';
  RAISE NOTICE 'IMPORTANT: Verify all wallet balances are correct!';
  RAISE NOTICE 'Run: SELECT profile_id, public.get_wallet_balance(profile_id) FROM profiles;';
  RAISE NOTICE '';
  RAISE NOTICE 'Next: Run Phase 3 migrations for content consolidation';
  RAISE NOTICE '========================================';
END $$;

