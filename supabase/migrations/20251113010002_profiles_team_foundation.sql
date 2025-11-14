BEGIN;

-- -----------------------------------------------------------------------------
-- Profiles & Team Foundation (Phase 2)
-- Introduces normalized wallet/ledger/payment tables and explicit team hierarchy
-- while leaving legacy tables untouched.
-- -----------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS public.profile_wallets (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    profile_id uuid UNIQUE NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    currency text NOT NULL DEFAULT 'EGP',
    balance numeric(14,2) NOT NULL DEFAULT 0,
    limits jsonb NOT NULL DEFAULT '{}',
    created_at timestamptz NOT NULL DEFAULT now(),
    updated_at timestamptz NOT NULL DEFAULT now()
);

COMMENT ON TABLE public.profile_wallets IS 'One wallet per profile; replaces user_wallets as the canonical balance source.';

CREATE INDEX IF NOT EXISTS idx_profile_wallets_profile_id
    ON public.profile_wallets (profile_id);

CREATE TABLE IF NOT EXISTS public.wallet_entries (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    wallet_id uuid NOT NULL REFERENCES public.profile_wallets(id) ON DELETE CASCADE,
    profile_id uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
    entry_type text NOT NULL CHECK (entry_type IN ('deposit','withdrawal','payment','refund','adjustment')),
    status text NOT NULL CHECK (status IN ('pending','completed','failed','cancelled')) DEFAULT 'completed',
    amount numeric(14,2) NOT NULL,
    description text,
    reference_type text,
    reference_id uuid,
    metadata jsonb NOT NULL DEFAULT '{}',
    created_at timestamptz NOT NULL DEFAULT now(),
    updated_at timestamptz NOT NULL DEFAULT now()
);

COMMENT ON TABLE public.wallet_entries IS 'Ledger entries for profile wallets; replaces wallet_transactions.';

CREATE INDEX IF NOT EXISTS idx_wallet_entries_wallet_created_at
    ON public.wallet_entries (wallet_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_wallet_entries_reference
    ON public.wallet_entries (reference_type, reference_id);

CREATE TABLE IF NOT EXISTS public.payment_operations (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    profile_id uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
    wallet_id uuid REFERENCES public.profile_wallets(id) ON DELETE SET NULL,
    operation_type text NOT NULL CHECK (operation_type IN ('gateway_charge','topup_request','payout')),
    provider text,
    provider_transaction_id text,
    status text NOT NULL CHECK (status IN ('pending','processing','completed','failed','cancelled')),
    amount numeric(14,2) NOT NULL,
    currency text NOT NULL DEFAULT 'EGP',
    metadata jsonb NOT NULL DEFAULT '{}',
    requested_at timestamptz NOT NULL DEFAULT now(),
    processed_at timestamptz,
    created_at timestamptz NOT NULL DEFAULT now(),
    updated_at timestamptz NOT NULL DEFAULT now()
);

COMMENT ON TABLE public.payment_operations IS 'Normalized payment log combining payment_transactions and wallet_topup_requests.';

CREATE INDEX IF NOT EXISTS idx_payment_operations_profile_status
    ON public.payment_operations (profile_id, status);

CREATE INDEX IF NOT EXISTS idx_payment_operations_provider_txn
    ON public.payment_operations (provider, provider_transaction_id);

-- -----------------------------------------------------------------------------
-- Teams & Membership
-- -----------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS public.teams (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    name text NOT NULL,
    team_type text NOT NULL CHECK (team_type IN ('sales','support','partnership','admin')) DEFAULT 'sales',
    owner_profile_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    created_at timestamptz NOT NULL DEFAULT now(),
    updated_at timestamptz NOT NULL DEFAULT now()
);

COMMENT ON TABLE public.teams IS 'Explicit team grouping for managers, agents, and support staff.';

CREATE INDEX IF NOT EXISTS idx_teams_owner
    ON public.teams (owner_profile_id);

CREATE TABLE IF NOT EXISTS public.team_members (
    team_id uuid NOT NULL REFERENCES public.teams(id) ON DELETE CASCADE,
    profile_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    role text NOT NULL CHECK (role IN ('manager','lead','agent','support')),
    status text NOT NULL CHECK (status IN ('active','inactive','invited')) DEFAULT 'active',
    joined_at timestamptz DEFAULT now(),
    left_at timestamptz,
    PRIMARY KEY (team_id, profile_id)
);

COMMENT ON TABLE public.team_members IS 'Membership assignments per team replacing profiles.manager_id hierarchy.';

CREATE INDEX IF NOT EXISTS idx_team_members_profile
    ON public.team_members (profile_id);

ALTER TABLE public.team_invitations
    ADD COLUMN IF NOT EXISTS team_id uuid REFERENCES public.teams(id) ON DELETE SET NULL,
    ADD COLUMN IF NOT EXISTS role text,
    ADD COLUMN IF NOT EXISTS invited_profile_id uuid REFERENCES public.profiles(id) ON DELETE SET NULL;

-- -----------------------------------------------------------------------------
-- Data Backfill (wallets)
-- -----------------------------------------------------------------------------

-- Populate profile_wallets from user_wallets when profiles exist.
INSERT INTO public.profile_wallets (id, profile_id, currency, balance, limits, created_at, updated_at)
SELECT uw.id,
       uw.user_id,
       uw.currency,
       COALESCE(uw.balance, 0),
       '{}'::jsonb,
       COALESCE(uw.created_at, now()),
       COALESCE(uw.updated_at, now())
FROM public.user_wallets uw
JOIN public.profiles p ON p.id = uw.user_id
ON CONFLICT (id) DO NOTHING;

-- Populate wallet_entries from wallet_transactions.
INSERT INTO public.wallet_entries (id, wallet_id, profile_id, entry_type, status, amount, description, reference_type, reference_id, metadata, created_at, updated_at)
SELECT wt.id,
       wt.wallet_id,
       wt.user_id,
       LOWER(wt.type) AS entry_type,
       CASE
           WHEN wt.status ILIKE 'pending' THEN 'pending'
           WHEN wt.status ILIKE 'failed' THEN 'failed'
           WHEN wt.status ILIKE 'cancel%' THEN 'cancelled'
           ELSE 'completed'
       END,
       wt.amount,
       wt.description,
       'legacy_wallet_transaction'::text,
       wt.reference_id,
       jsonb_build_object(
           'source', 'wallet_transactions',
           'legacy_status', wt.status
       ),
       COALESCE(wt.created_at, now()),
       COALESCE(wt.updated_at, wt.created_at, now())
FROM public.wallet_transactions wt
JOIN public.profile_wallets pw ON pw.id = wt.wallet_id
ON CONFLICT (id) DO NOTHING;

-- Payment transactions -> payment_operations
INSERT INTO public.payment_operations (id, profile_id, wallet_id, operation_type, provider, provider_transaction_id, status, amount, currency, metadata, requested_at, processed_at, created_at, updated_at)
SELECT pt.id,
       pt.user_id,
       pw.id,
       'gateway_charge' AS operation_type,
       pt.gateway,
       COALESCE(pt.gateway_transaction_id, pt.gateway_payment_intent_id),
       CASE
           WHEN pt.status ILIKE 'pending' THEN 'pending'
           WHEN pt.status ILIKE 'processing' THEN 'processing'
           WHEN pt.status ILIKE 'failed' THEN 'failed'
           WHEN pt.status ILIKE 'cancel%' THEN 'cancelled'
           ELSE 'completed'
       END,
       pt.amount,
       pt.currency,
       jsonb_build_object(
           'transaction_type', pt.transaction_type,
           'gateway_payment_intent_id', pt.gateway_payment_intent_id,
           'reference_id', pt.reference_id,
           'metadata', pt.metadata,
           'error_message', pt.error_message,
           'test_mode', pt.test_mode
       ),
       COALESCE(pt.created_at, now()),
       pt.completed_at,
       COALESCE(pt.created_at, now()),
       COALESCE(pt.updated_at, pt.created_at, now())
FROM public.payment_transactions pt
LEFT JOIN public.profile_wallets pw ON pw.profile_id = pt.user_id
ON CONFLICT (id) DO NOTHING;

-- Wallet topup requests -> payment_operations (as topup_request)
INSERT INTO public.payment_operations (id, profile_id, wallet_id, operation_type, provider, provider_transaction_id, status, amount, currency, metadata, requested_at, processed_at, created_at, updated_at)
SELECT wtr.id,
       wtr.user_id,
       pw.id,
       'topup_request' AS operation_type,
       wtr.gateway,
       wtr.gateway_transaction_id,
       CASE
           WHEN wtr.status ILIKE 'pending' THEN 'pending'
           WHEN wtr.status ILIKE 'processing' THEN 'processing'
           WHEN wtr.status ILIKE 'approved' THEN 'completed'
           WHEN wtr.status ILIKE 'rejected' THEN 'failed'
           WHEN wtr.status ILIKE 'cancel%' THEN 'cancelled'
           ELSE 'pending'
       END,
       wtr.amount,
       'EGP',
       jsonb_build_object(
           'payment_method', wtr.payment_method,
           'receipt_file_url', wtr.receipt_file_url,
           'receipt_file_name', wtr.receipt_file_name,
           'validated_by', wtr.validated_by,
           'validated_at', wtr.validated_at,
           'admin_notes', wtr.admin_notes,
           'rejected_reason', wtr.rejected_reason,
           'payment_transaction_id', wtr.payment_transaction_id
       ),
       COALESCE(wtr.created_at, now()),
       wtr.updated_at,
       COALESCE(wtr.created_at, now()),
       COALESCE(wtr.updated_at, wtr.created_at, now())
FROM public.wallet_topup_requests wtr
LEFT JOIN public.profile_wallets pw ON pw.profile_id = wtr.user_id
ON CONFLICT (id) DO NOTHING;

-- -----------------------------------------------------------------------------
-- Team backfill from profiles.manager_id
-- -----------------------------------------------------------------------------

WITH distinct_managers AS (
    SELECT DISTINCT p.manager_id AS owner_profile_id
    FROM public.profiles p
    WHERE p.manager_id IS NOT NULL
      AND EXISTS (SELECT 1 FROM public.profiles mgr WHERE mgr.id = p.manager_id)
)
INSERT INTO public.teams (id, name, team_type, owner_profile_id)
SELECT gen_random_uuid(),
       CONCAT('Team led by ', COALESCE(mgr.name, dm.owner_profile_id::text)),
       'sales',
       dm.owner_profile_id
FROM distinct_managers dm
JOIN public.profiles mgr ON mgr.id = dm.owner_profile_id
LEFT JOIN public.teams t ON t.owner_profile_id = dm.owner_profile_id
WHERE t.owner_profile_id IS NULL;

-- Ensure managers are members of their own team.
INSERT INTO public.team_members (team_id, profile_id, role, status, joined_at)
SELECT t.id,
       t.owner_profile_id,
       'manager',
       'active',
       now()
FROM public.teams t
ON CONFLICT DO NOTHING;

-- Add existing reports as agents in their manager-owned team.
INSERT INTO public.team_members (team_id, profile_id, role, status, joined_at)
SELECT t.id,
       p.id,
       'agent',
       'active',
       now()
FROM public.profiles p
JOIN public.teams t ON t.owner_profile_id = p.manager_id
LEFT JOIN public.team_members tm ON tm.team_id = t.id AND tm.profile_id = p.id
WHERE p.manager_id IS NOT NULL
  AND tm.profile_id IS NULL;

-- -----------------------------------------------------------------------------
-- Compatibility Views
-- -----------------------------------------------------------------------------

CREATE OR REPLACE VIEW public.user_wallets_consolidated AS
SELECT pw.id,
       pw.profile_id AS user_id,
       pw.balance,
       pw.currency,
       pw.created_at,
       pw.updated_at
FROM public.profile_wallets pw;

CREATE OR REPLACE VIEW public.wallet_transactions_consolidated AS
SELECT we.id,
       we.wallet_id,
       we.profile_id AS user_id,
       we.entry_type AS type,
       we.amount,
       we.description,
       we.reference_id,
       we.status,
       we.created_at,
       we.updated_at,
       we.metadata
FROM public.wallet_entries we;

CREATE OR REPLACE VIEW public.payment_transactions_consolidated AS
SELECT po.id,
       po.profile_id AS user_id,
       po.amount,
       po.currency,
       po.operation_type,
       po.provider,
       po.provider_transaction_id,
       po.status,
       po.metadata,
       po.requested_at AS created_at,
       po.processed_at AS completed_at,
       po.updated_at
FROM public.payment_operations po;

CREATE OR REPLACE VIEW public.team_hierarchy_consolidated AS
SELECT tm.team_id,
       tm.profile_id,
       tm.role,
       tm.status,
       tm.joined_at,
       tm.left_at,
       t.owner_profile_id,
       t.name AS team_name,
       t.team_type
FROM public.team_members tm
JOIN public.teams t ON t.id = tm.team_id;

-- -----------------------------------------------------------------------------
-- Align lead_commerce foreign key to new payment_operations table when possible
-- -----------------------------------------------------------------------------

DO $$
BEGIN
    IF EXISTS (
        SELECT 1
        FROM information_schema.table_constraints
        WHERE table_schema = 'public'
          AND table_name = 'lead_commerce'
          AND constraint_type = 'FOREIGN KEY'
          AND constraint_name = 'lead_commerce_payment_operation_id_fkey'
    ) THEN
        -- already aligned
        NULL;
    ELSIF EXISTS (
        SELECT 1 FROM information_schema.table_constraints
        WHERE table_schema = 'public'
          AND table_name = 'lead_commerce'
          AND constraint_name = 'lead_commerce_payment_operation_id_fkey'
    ) THEN
        NULL;
    ELSE
        -- drop legacy FK to payment_transactions if present and re-point to payment_operations
        BEGIN
            ALTER TABLE public.lead_commerce
                DROP CONSTRAINT IF EXISTS lead_commerce_payment_operation_id_fkey;
        EXCEPTION WHEN undefined_object THEN
            NULL;
        END;
        ALTER TABLE public.lead_commerce
            ADD CONSTRAINT lead_commerce_payment_operation_id_fkey
            FOREIGN KEY (payment_operation_id) REFERENCES public.payment_operations(id) ON DELETE SET NULL;
    END IF;
END $$;

COMMIT;
