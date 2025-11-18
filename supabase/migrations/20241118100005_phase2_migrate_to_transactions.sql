-- ============================================
-- PHASE 2: MIGRATE DATA TO TRANSACTIONS TABLE
-- Migrate: commerce + payments + wallet_ledger_entries → transactions
-- ============================================

BEGIN;

-- ============================================
-- Step 1: Migrate commerce table
-- ============================================

INSERT INTO public.transactions (
  id,
  transaction_type,
  transaction_category,
  profile_id,
  project_id,
  lead_id,
  amount,
  currency,
  quantity,
  commerce_type,
  commission_rate,
  partner_id,
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
  reference_type,
  reference_id,
  metadata,
  created_at,
  updated_at
)
SELECT 
  c.id,
  'commerce' AS transaction_type,
  c.commerce_type AS transaction_category,
  c.profile_id,
  c.project_id,
  c.lead_id,
  COALESCE(c.amount, 0) AS amount,
  COALESCE(c.currency, 'EGP') AS currency,
  c.quantity,
  c.commerce_type,
  c.commission_rate,
  c.partner_id,
  c.payment_method,
  c.payment_operation_id,
  c.status,
  c.receipt_url,
  c.receipt_file_name,
  c.approved_by,
  c.approved_at,
  c.notes,
  c.admin_notes,
  c.rejected_reason,
  c.batch_id,
  'commerce' AS reference_type,
  c.id AS reference_id,
  jsonb_build_object('source', 'commerce') || COALESCE(c.metadata, '{}'::jsonb) AS metadata,
  c.created_at,
  c.updated_at
FROM public.commerce c
ON CONFLICT (id) DO NOTHING;

-- ============================================
-- Step 2: Migrate payments table
-- ============================================

INSERT INTO public.transactions (
  id,
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
  notes,
  admin_notes,
  rejected_reason,
  reference_type,
  reference_id,
  metadata,
  requested_at,
  processed_at,
  created_at,
  updated_at
)
SELECT 
  p.id,
  CASE 
    WHEN p.operation_type IN ('deposit', 'topup_request') THEN 'topup'
    WHEN p.operation_type = 'gateway_charge' THEN 'payment'
    ELSE 'payment'
  END AS transaction_type,
  p.operation_type AS transaction_category,
  p.profile_id,
  p.amount,
  COALESCE(p.currency, 'EGP') AS currency,
  p.payment_method,
  p.provider,
  p.provider_transaction_id,
  p.wallet_id,
  p.entry_type AS ledger_entry_type,
  p.balance_after,
  p.status,
  p.receipt_url,
  p.receipt_file_name,
  p.validated_by,
  p.validated_at,
  p.description,
  p.admin_notes AS notes,
  p.admin_notes,
  p.rejected_reason,
  p.reference_type,
  p.reference_id,
  jsonb_build_object('source', 'payments') || COALESCE(p.metadata, '{}'::jsonb) AS metadata,
  p.requested_at,
  p.processed_at,
  p.created_at,
  p.updated_at
FROM public.payments p
ON CONFLICT (id) DO NOTHING;

-- ============================================
-- Step 3: Migrate wallet_ledger_entries (if exists)
-- ============================================

DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.tables 
    WHERE table_schema = 'public' AND table_name = 'wallet_ledger_entries'
    AND table_type = 'BASE TABLE'
  ) THEN
    INSERT INTO public.transactions (
      id,
      transaction_type,
      transaction_category,
      profile_id,
      amount,
      currency,
      ledger_entry_type,
      balance_after,
      running_balance,
      status,
      description,
      reference_type,
      reference_id,
      metadata,
      created_at,
      updated_at
    )
    SELECT 
      wle.id,
      'wallet' AS transaction_type,
      wle.entry_type AS transaction_category,
      wle.profile_id,
      wle.amount,
      COALESCE(wle.currency, 'EGP') AS currency,
      wle.entry_type AS ledger_entry_type,
      wle.balance_after,
      wle.balance_after AS running_balance,
      'completed' AS status,
      wle.description,
      wle.reference_type,
      wle.reference_id,
      jsonb_build_object('source', 'wallet_ledger_entries') || COALESCE(wle.metadata, '{}'::jsonb) AS metadata,
      wle.created_at,
      wle.updated_at
    FROM public.wallet_ledger_entries wle
    ON CONFLICT (id) DO NOTHING;
    
    RAISE NOTICE '✅ Migrated wallet_ledger_entries table';
  ELSE
    RAISE NOTICE 'ℹ️ wallet_ledger_entries table does not exist or is already a view';
  END IF;
END $$;

-- ============================================
-- Step 4: Recalculate wallet balances
-- ============================================

SELECT public.recalculate_wallet_balances();

-- ============================================
-- Step 5: Get migration statistics
-- ============================================

DO $$
DECLARE
  v_total_transactions INTEGER;
  v_commerce INTEGER;
  v_payments INTEGER;
  v_wallet INTEGER;
BEGIN
  SELECT COUNT(*) INTO v_total_transactions FROM public.transactions;
  SELECT COUNT(*) INTO v_commerce FROM public.transactions WHERE metadata->>'source' = 'commerce';
  SELECT COUNT(*) INTO v_payments FROM public.transactions WHERE metadata->>'source' = 'payments';
  SELECT COUNT(*) INTO v_wallet FROM public.transactions WHERE metadata->>'source' = 'wallet_ledger_entries';
  
  RAISE NOTICE '========================================';
  RAISE NOTICE '✅ Phase 2 Step 2: Data migration complete';
  RAISE NOTICE '========================================';
  RAISE NOTICE 'Total transactions: %', v_total_transactions;
  RAISE NOTICE '  - From commerce: %', v_commerce;
  RAISE NOTICE '  - From payments: %', v_payments;
  RAISE NOTICE '  - From wallet_ledger: %', v_wallet;
  RAISE NOTICE '';
  RAISE NOTICE 'Wallet balances recalculated';
  RAISE NOTICE '';
  RAISE NOTICE 'Next step: Run migration 20241118100006 to create views';
  RAISE NOTICE '========================================';
END $$;

COMMIT;

