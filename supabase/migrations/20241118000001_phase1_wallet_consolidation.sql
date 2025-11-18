-- ============================================
-- PHASE 1: WALLET/PAYMENT CONSOLIDATION
-- Merge wallet_ledger_entries → payments
-- ============================================
-- This migration consolidates wallet ledger entries into the payments table
-- to create a single source of truth for all financial transactions

BEGIN;

-- ============================================
-- Step 1: Enhance payments table with ledger columns
-- ============================================

ALTER TABLE public.payments 
  ADD COLUMN IF NOT EXISTS ledger_entry_type TEXT CHECK (ledger_entry_type IN ('debit', 'credit')),
  ADD COLUMN IF NOT EXISTS running_balance NUMERIC(14,2),
  ADD COLUMN IF NOT EXISTS transaction_sequence BIGSERIAL;

COMMENT ON COLUMN public.payments.ledger_entry_type IS 'Type of ledger entry: debit (decreases balance) or credit (increases balance)';
COMMENT ON COLUMN public.payments.running_balance IS 'Running balance after this transaction (calculated)';
COMMENT ON COLUMN public.payments.transaction_sequence IS 'Sequential order of transactions for balance calculation';

-- ============================================
-- Step 2: Create index for transaction ordering
-- ============================================

CREATE INDEX IF NOT EXISTS idx_payments_profile_sequence 
  ON public.payments(profile_id, transaction_sequence ASC);

CREATE INDEX IF NOT EXISTS idx_payments_ledger_type 
  ON public.payments(ledger_entry_type) WHERE ledger_entry_type IS NOT NULL;

-- ============================================
-- Step 3: Migrate wallet_ledger_entries data to payments
-- ============================================

-- Only run if wallet_ledger_entries table exists
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.tables 
    WHERE table_schema = 'public' 
    AND table_name = 'wallet_ledger_entries'
  ) THEN
    
    -- Migrate data
    INSERT INTO public.payments (
      id,
      profile_id,
      operation_type,
      status,
      amount,
      currency,
      balance_after,
      ledger_entry_type,
      running_balance,
      description,
      reference_type,
      reference_id,
      metadata,
      created_at,
      updated_at,
      processed_at
    )
    SELECT 
      wle.id,
      wle.profile_id,
      CASE 
        WHEN wle.entry_type = 'credit' THEN 'deposit'
        WHEN wle.entry_type = 'debit' THEN 'withdrawal'
        ELSE 'adjustment'
      END AS operation_type,
      'completed' AS status,
      wle.amount,
      COALESCE(wle.currency, 'EGP') AS currency,
      wle.balance_after,
      wle.entry_type AS ledger_entry_type,
      wle.balance_after AS running_balance,
      wle.description,
      wle.reference_type,
      wle.reference_id,
      COALESCE(wle.metadata, '{}'::jsonb) AS metadata,
      wle.created_at,
      wle.updated_at,
      wle.created_at AS processed_at
    FROM public.wallet_ledger_entries wle
    ON CONFLICT (id) DO UPDATE SET
      ledger_entry_type = EXCLUDED.ledger_entry_type,
      running_balance = EXCLUDED.running_balance,
      updated_at = now();

    RAISE NOTICE '✅ Migrated wallet_ledger_entries to payments table';
  ELSE
    RAISE NOTICE 'ℹ️ wallet_ledger_entries table does not exist, skipping migration';
  END IF;
END $$;

-- ============================================
-- Step 4: Create compatibility view for backward compatibility
-- ============================================

CREATE OR REPLACE VIEW public.wallet_ledger_entries AS
SELECT
  p.id,
  p.profile_id,
  p.ledger_entry_type AS entry_type,
  p.amount,
  p.currency,
  p.running_balance AS balance_after,
  p.description,
  p.reference_type,
  p.reference_id,
  p.metadata,
  p.created_at,
  p.updated_at
FROM public.payments p
WHERE p.ledger_entry_type IS NOT NULL;

COMMENT ON VIEW public.wallet_ledger_entries IS 'Compatibility view - backed by payments table';

-- ============================================
-- Step 5: Create trigger for view compatibility
-- ============================================

CREATE OR REPLACE FUNCTION public.sync_wallet_ledger_to_payments()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    INSERT INTO public.payments (
      profile_id,
      operation_type,
      ledger_entry_type,
      status,
      amount,
      currency,
      running_balance,
      description,
      reference_type,
      reference_id,
      metadata,
      created_at,
      updated_at,
      processed_at
    ) VALUES (
      NEW.profile_id,
      CASE 
        WHEN NEW.entry_type = 'credit' THEN 'deposit'
        WHEN NEW.entry_type = 'debit' THEN 'withdrawal'
        ELSE 'adjustment'
      END,
      NEW.entry_type,
      'completed',
      NEW.amount,
      COALESCE(NEW.currency, 'EGP'),
      NEW.balance_after,
      NEW.description,
      NEW.reference_type,
      NEW.reference_id,
      COALESCE(NEW.metadata, '{}'::jsonb),
      COALESCE(NEW.created_at, now()),
      COALESCE(NEW.updated_at, now()),
      now()
    );
    RETURN NEW;
  ELSIF TG_OP = 'UPDATE' THEN
    UPDATE public.payments SET
      profile_id = NEW.profile_id,
      ledger_entry_type = NEW.entry_type,
      amount = NEW.amount,
      currency = COALESCE(NEW.currency, 'EGP'),
      running_balance = NEW.balance_after,
      description = NEW.description,
      reference_type = NEW.reference_type,
      reference_id = NEW.reference_id,
      metadata = COALESCE(NEW.metadata, '{}'::jsonb),
      updated_at = now()
    WHERE id = NEW.id;
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    DELETE FROM public.payments WHERE id = OLD.id AND ledger_entry_type IS NOT NULL;
    RETURN OLD;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_wallet_ledger_entries_sync
INSTEAD OF INSERT OR UPDATE OR DELETE ON public.wallet_ledger_entries
FOR EACH ROW EXECUTE FUNCTION public.sync_wallet_ledger_to_payments();

-- ============================================
-- Step 6: Drop original wallet_ledger_entries table if exists
-- ============================================

DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.tables 
    WHERE table_schema = 'public' 
    AND table_name = 'wallet_ledger_entries'
    AND table_type = 'BASE TABLE'
  ) THEN
    DROP TABLE public.wallet_ledger_entries CASCADE;
    RAISE NOTICE '✅ Dropped wallet_ledger_entries table';
  END IF;
END $$;

-- ============================================
-- Step 7: Create function to calculate running balance
-- ============================================

CREATE OR REPLACE FUNCTION public.recalculate_wallet_balances(p_profile_id UUID DEFAULT NULL)
RETURNS VOID AS $$
DECLARE
  v_profile_id UUID;
  v_running_balance NUMERIC(14,2);
BEGIN
  -- If profile_id provided, recalculate only for that profile
  -- Otherwise, recalculate for all profiles
  FOR v_profile_id IN 
    SELECT DISTINCT profile_id 
    FROM public.payments 
    WHERE ledger_entry_type IS NOT NULL
      AND (p_profile_id IS NULL OR profile_id = p_profile_id)
    ORDER BY profile_id
  LOOP
    v_running_balance := 0;
    
    -- Update running balances in transaction sequence order
    UPDATE public.payments p
    SET running_balance = (
      SELECT SUM(
        CASE 
          WHEN ledger_entry_type = 'credit' THEN amount
          WHEN ledger_entry_type = 'debit' THEN -amount
          ELSE 0
        END
      )
      FROM public.payments p2
      WHERE p2.profile_id = p.profile_id
        AND p2.ledger_entry_type IS NOT NULL
        AND p2.transaction_sequence <= p.transaction_sequence
    )
    WHERE p.profile_id = v_profile_id
      AND p.ledger_entry_type IS NOT NULL;
  END LOOP;
  
  RAISE NOTICE '✅ Recalculated wallet balances';
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION public.recalculate_wallet_balances IS 'Recalculates running balances for all wallet transactions';

-- ============================================
-- Step 8: Recalculate all balances
-- ============================================

SELECT public.recalculate_wallet_balances();

-- ============================================
-- Step 9: Update RLS policies if needed
-- ============================================

-- Ensure payments table RLS policies cover ledger entries
-- (assuming existing RLS policies already cover payments table)

COMMIT;

-- ============================================
-- Verification queries (run after migration)
-- ============================================

-- Verify data migration
-- SELECT COUNT(*) as total_payments FROM public.payments;
-- SELECT COUNT(*) as ledger_entries FROM public.payments WHERE ledger_entry_type IS NOT NULL;
-- SELECT profile_id, COUNT(*) as transaction_count, MAX(running_balance) as final_balance 
-- FROM public.payments WHERE ledger_entry_type IS NOT NULL GROUP BY profile_id;

DO $$
BEGIN
  RAISE NOTICE '========================================';
  RAISE NOTICE '✅ Phase 1: Wallet Consolidation COMPLETE';
  RAISE NOTICE '========================================';
  RAISE NOTICE 'Next steps:';
  RAISE NOTICE '1. Verify data migration';
  RAISE NOTICE '2. Update application code to use payments table';
  RAISE NOTICE '3. Test wallet operations thoroughly';
  RAISE NOTICE '4. Monitor for 1 week before proceeding to Phase 2';
  RAISE NOTICE '========================================';
END $$;

