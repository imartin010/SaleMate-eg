-- ============================================
-- PHASE 2: CREATE TRANSACTIONS TABLE
-- Consolidate: commerce + payments + wallet_ledger_entries → transactions
-- ============================================
-- This creates a unified transactions table for all financial operations

BEGIN;

-- ============================================
-- Step 1: Create the unified transactions table
-- ============================================

CREATE TABLE IF NOT EXISTS public.transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Transaction classification
  transaction_type TEXT NOT NULL CHECK (transaction_type IN (
    'commerce',    -- Purchase, request, allocation
    'payment',     -- Gateway payment operation
    'wallet',      -- Wallet ledger entry
    'refund',      -- Refund operation
    'adjustment',  -- Manual balance adjustment
    'topup',       -- Wallet topup request
    'commission'   -- Partner commission
  )),
  
  transaction_category TEXT, -- Subcategory: 'purchase', 'request', 'allocation', 'gateway_charge', etc.
  
  -- Core references
  profile_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  project_id UUID REFERENCES public.projects(id) ON DELETE SET NULL,
  lead_id UUID REFERENCES public.leads(id) ON DELETE SET NULL,
  
  -- Financial data
  amount NUMERIC(14,2) NOT NULL,
  currency TEXT NOT NULL DEFAULT 'EGP',
  quantity INTEGER CHECK (quantity > 0),
  
  -- Commerce-specific fields
  commerce_type TEXT CHECK (commerce_type IN ('purchase', 'request', 'allocation', 'refund', 'topup', 'commission')),
  commission_rate NUMERIC(5,2),
  partner_id UUID, -- Will reference entities table
  
  -- Payment-specific fields
  payment_method TEXT CHECK (payment_method IN ('wallet', 'Instapay', 'Card', 'VodafoneCash', 'BankTransfer', 'kashier')),
  provider TEXT, -- 'kashier', 'instapay', etc.
  provider_transaction_id TEXT,
  gateway_payment_intent_id TEXT,
  payment_operation_id UUID, -- Self-reference for linking commerce to payments
  
  -- Wallet-specific fields
  ledger_entry_type TEXT CHECK (ledger_entry_type IN ('debit', 'credit')),
  wallet_id UUID, -- Denormalized wallet reference
  balance_before NUMERIC(14,2),
  balance_after NUMERIC(14,2),
  running_balance NUMERIC(14,2),
  transaction_sequence BIGSERIAL,
  
  -- Status tracking
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN (
    'pending', 'processing', 'completed', 'failed', 
    'cancelled', 'approved', 'rejected', 'fulfilled', 'confirmed'
  )),
  
  -- Receipts and documentation
  receipt_url TEXT,
  receipt_file_name TEXT,
  
  -- Approvals and validation
  approved_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  approved_at TIMESTAMPTZ,
  validated_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  validated_at TIMESTAMPTZ,
  
  -- Notes and descriptions
  description TEXT,
  notes TEXT,
  admin_notes TEXT,
  rejected_reason TEXT,
  
  -- Batch tracking
  batch_id UUID, -- For lead batches
  
  -- References
  reference_type TEXT, -- 'commerce', 'payment', 'topup', etc.
  reference_id UUID, -- Reference to other entity
  parent_transaction_id UUID REFERENCES public.transactions(id) ON DELETE SET NULL,
  
  -- Flexible data storage
  metadata JSONB DEFAULT '{}',
  
  -- Timestamps
  requested_at TIMESTAMPTZ,
  processed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

COMMENT ON TABLE public.transactions IS 'Unified transaction system - commerce, payments, and wallet operations';

-- ============================================
-- Step 2: Create indexes for performance
-- ============================================

-- Primary access patterns
CREATE INDEX idx_transactions_type_created ON public.transactions(transaction_type, created_at DESC);
CREATE INDEX idx_transactions_profile_status ON public.transactions(profile_id, status, created_at DESC);
CREATE INDEX idx_transactions_profile_created ON public.transactions(profile_id, created_at DESC);
CREATE INDEX idx_transactions_project ON public.transactions(project_id, created_at DESC);

-- Wallet operations
CREATE INDEX idx_transactions_wallet ON public.transactions(profile_id, transaction_sequence) 
  WHERE ledger_entry_type IS NOT NULL;
CREATE INDEX idx_transactions_wallet_balance ON public.transactions(profile_id, created_at DESC) 
  WHERE ledger_entry_type IS NOT NULL;

-- Payment operations
CREATE INDEX idx_transactions_provider ON public.transactions(provider, provider_transaction_id) 
  WHERE provider IS NOT NULL;
CREATE INDEX idx_transactions_gateway_intent ON public.transactions(gateway_payment_intent_id) 
  WHERE gateway_payment_intent_id IS NOT NULL;

-- Commerce operations
CREATE INDEX idx_transactions_commerce ON public.transactions(commerce_type, status, created_at DESC) 
  WHERE commerce_type IS NOT NULL;
CREATE INDEX idx_transactions_project_commerce ON public.transactions(project_id, commerce_type) 
  WHERE project_id IS NOT NULL;

-- References
CREATE INDEX idx_transactions_reference ON public.transactions(reference_type, reference_id);
CREATE INDEX idx_transactions_parent ON public.transactions(parent_transaction_id) 
  WHERE parent_transaction_id IS NOT NULL;
CREATE INDEX idx_transactions_batch ON public.transactions(batch_id) 
  WHERE batch_id IS NOT NULL;

-- Status tracking
CREATE INDEX idx_transactions_pending ON public.transactions(profile_id, status, created_at DESC) 
  WHERE status = 'pending';
CREATE INDEX idx_transactions_approved_by ON public.transactions(approved_by, approved_at DESC) 
  WHERE approved_by IS NOT NULL;

-- JSONB index
CREATE INDEX idx_transactions_metadata ON public.transactions USING GIN(metadata);

-- ============================================
-- Step 3: Enable RLS
-- ============================================

ALTER TABLE public.transactions ENABLE ROW LEVEL SECURITY;

-- Policy: Users can view their own transactions
CREATE POLICY "Users can view their own transactions"
  ON public.transactions
  FOR SELECT
  USING (profile_id = auth.uid());

-- Policy: Users can create their own transactions
CREATE POLICY "Users can create their own transactions"
  ON public.transactions
  FOR INSERT
  WITH CHECK (profile_id = auth.uid());

-- Policy: Users can update their pending transactions
CREATE POLICY "Users can update their pending transactions"
  ON public.transactions
  FOR UPDATE
  USING (profile_id = auth.uid() AND status = 'pending');

-- Policy: Admins can manage all transactions
CREATE POLICY "Admins can manage all transactions"
  ON public.transactions
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid() AND profiles.role IN ('admin', 'support')
    )
  );

-- ============================================
-- Step 4: Create updated_at trigger
-- ============================================

DROP TRIGGER IF EXISTS update_transactions_updated_at ON public.transactions;
CREATE TRIGGER update_transactions_updated_at
  BEFORE UPDATE ON public.transactions
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- ============================================
-- Step 5: Create wallet balance functions
-- ============================================

-- Function to calculate wallet balance for a profile
CREATE OR REPLACE FUNCTION public.get_wallet_balance(p_profile_id UUID)
RETURNS NUMERIC(14,2) AS $$
DECLARE
  v_balance NUMERIC(14,2);
BEGIN
  SELECT COALESCE(MAX(running_balance), 0)
  INTO v_balance
  FROM public.transactions
  WHERE profile_id = p_profile_id
    AND ledger_entry_type IS NOT NULL
  ORDER BY transaction_sequence DESC
  LIMIT 1;
  
  RETURN v_balance;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION public.get_wallet_balance IS 'Get current wallet balance for a profile';

-- Function to recalculate wallet balances
CREATE OR REPLACE FUNCTION public.recalculate_wallet_balances(p_profile_id UUID DEFAULT NULL)
RETURNS VOID AS $$
DECLARE
  v_profile_id UUID;
BEGIN
  FOR v_profile_id IN 
    SELECT DISTINCT profile_id 
    FROM public.transactions 
    WHERE ledger_entry_type IS NOT NULL
      AND (p_profile_id IS NULL OR profile_id = p_profile_id)
    ORDER BY profile_id
  LOOP
    UPDATE public.transactions t
    SET running_balance = (
      SELECT SUM(
        CASE 
          WHEN ledger_entry_type = 'credit' THEN amount
          WHEN ledger_entry_type = 'debit' THEN -amount
          ELSE 0
        END
      )
      FROM public.transactions t2
      WHERE t2.profile_id = t.profile_id
        AND t2.ledger_entry_type IS NOT NULL
        AND t2.transaction_sequence <= t.transaction_sequence
    )
    WHERE t.profile_id = v_profile_id
      AND t.ledger_entry_type IS NOT NULL;
  END LOOP;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION public.recalculate_wallet_balances IS 'Recalculate running balances for wallet transactions';

-- Function to add to wallet
CREATE OR REPLACE FUNCTION public.add_to_wallet(
  p_profile_id UUID,
  p_amount NUMERIC(14,2),
  p_description TEXT DEFAULT 'Wallet credit',
  p_reference_type TEXT DEFAULT NULL,
  p_reference_id UUID DEFAULT NULL
)
RETURNS UUID AS $$
DECLARE
  v_transaction_id UUID;
  v_current_balance NUMERIC(14,2);
BEGIN
  v_current_balance := public.get_wallet_balance(p_profile_id);
  
  INSERT INTO public.transactions (
    transaction_type,
    transaction_category,
    profile_id,
    amount,
    currency,
    ledger_entry_type,
    balance_before,
    balance_after,
    running_balance,
    status,
    description,
    reference_type,
    reference_id,
    processed_at,
    created_at,
    updated_at
  ) VALUES (
    'wallet',
    'credit',
    p_profile_id,
    p_amount,
    'EGP',
    'credit',
    v_current_balance,
    v_current_balance + p_amount,
    v_current_balance + p_amount,
    'completed',
    p_description,
    p_reference_type,
    p_reference_id,
    now(),
    now(),
    now()
  ) RETURNING id INTO v_transaction_id;
  
  RETURN v_transaction_id;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION public.add_to_wallet IS 'Add funds to user wallet';

-- Function to deduct from wallet
CREATE OR REPLACE FUNCTION public.deduct_from_wallet(
  p_profile_id UUID,
  p_amount NUMERIC(14,2),
  p_description TEXT DEFAULT 'Wallet debit',
  p_reference_type TEXT DEFAULT NULL,
  p_reference_id UUID DEFAULT NULL
)
RETURNS UUID AS $$
DECLARE
  v_transaction_id UUID;
  v_current_balance NUMERIC(14,2);
BEGIN
  v_current_balance := public.get_wallet_balance(p_profile_id);
  
  IF v_current_balance < p_amount THEN
    RAISE EXCEPTION 'Insufficient wallet balance. Current: %, Required: %', v_current_balance, p_amount;
  END IF;
  
  INSERT INTO public.transactions (
    transaction_type,
    transaction_category,
    profile_id,
    amount,
    currency,
    ledger_entry_type,
    balance_before,
    balance_after,
    running_balance,
    status,
    description,
    reference_type,
    reference_id,
    processed_at,
    created_at,
    updated_at
  ) VALUES (
    'wallet',
    'debit',
    p_profile_id,
    p_amount,
    'EGP',
    'debit',
    v_current_balance,
    v_current_balance - p_amount,
    v_current_balance - p_amount,
    'completed',
    p_description,
    p_reference_type,
    p_reference_id,
    now(),
    now(),
    now()
  ) RETURNING id INTO v_transaction_id;
  
  RETURN v_transaction_id;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION public.deduct_from_wallet IS 'Deduct funds from user wallet';

COMMIT;

-- ============================================
-- Verification
-- ============================================

DO $$
BEGIN
  RAISE NOTICE '========================================';
  RAISE NOTICE '✅ Phase 2 Step 1: Transactions table created';
  RAISE NOTICE '========================================';
  RAISE NOTICE 'Table: transactions';
  RAISE NOTICE 'Indexes: 16 created';
  RAISE NOTICE 'RLS: Enabled with 4 policies';
  RAISE NOTICE 'Functions: 4 created (wallet operations)';
  RAISE NOTICE '';
  RAISE NOTICE 'Next step: Run migration 20241118100005 to migrate data';
  RAISE NOTICE '========================================';
END $$;

