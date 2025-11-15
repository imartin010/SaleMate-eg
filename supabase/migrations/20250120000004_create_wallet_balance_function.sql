-- ============================================
-- DATABASE CONSOLIDATION MIGRATION
-- Phase 4: Create Helper Functions
-- ============================================

BEGIN;

-- ============================================
-- WALLET BALANCE FUNCTION
-- Computes current wallet balance from payments table
-- ============================================

CREATE OR REPLACE FUNCTION public.get_wallet_balance(p_profile_id uuid)
RETURNS numeric(14,2) 
LANGUAGE sql 
STABLE 
SECURITY DEFINER
AS $$
    SELECT COALESCE(
        (
            -- Deposits, refunds, adjustments
            SELECT SUM(amount)
            FROM public.payments
            WHERE profile_id = p_profile_id
            AND status = 'completed'
            AND entry_type IN ('deposit', 'refund', 'adjustment')
        ) - 
        (
            -- Withdrawals, payments
            SELECT COALESCE(SUM(amount), 0)
            FROM public.payments
            WHERE profile_id = p_profile_id
            AND status = 'completed'
            AND entry_type IN ('withdrawal', 'payment')
        ),
        0
    );
$$;

COMMENT ON FUNCTION public.get_wallet_balance IS 'Computes current wallet balance from payments table';

-- ============================================
-- VIEW: profile_wallets_consolidated
-- Provides compatibility view for wallet balance
-- ============================================

CREATE OR REPLACE VIEW public.profile_wallets_consolidated AS
SELECT 
    p.id AS profile_id,
    public.get_wallet_balance(p.id) AS balance,
    'EGP'::text AS currency,
    now() AS created_at,
    now() AS updated_at
FROM public.profiles p;

COMMENT ON VIEW public.profile_wallets_consolidated IS 'Compatibility view for wallet balance - computed from payments table';

-- ============================================
-- VIEW: wallet_entries_consolidated
-- Provides compatibility view for wallet entries
-- ============================================

CREATE OR REPLACE VIEW public.wallet_entries_consolidated AS
SELECT 
    id,
    profile_id AS wallet_id, -- Denormalized for compatibility
    profile_id AS user_id, -- For compatibility
    entry_type AS type,
    amount,
    description,
    reference_id,
    status,
    created_at,
    updated_at,
    metadata
FROM public.payments
WHERE entry_type IS NOT NULL;

COMMENT ON VIEW public.wallet_entries_consolidated IS 'Compatibility view for wallet entries - from payments table';

COMMIT;

-- Log completion
DO $$
BEGIN
  RAISE NOTICE '✅ Helper functions and views created!';
END $$;

