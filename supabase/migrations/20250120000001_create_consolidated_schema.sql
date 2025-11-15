-- ============================================
-- DATABASE CONSOLIDATION MIGRATION
-- Phase 1: Create New Consolidated Tables
-- ============================================
-- This migration creates the new 12-table consolidated schema
-- Data migration will happen in a subsequent migration

BEGIN;

-- ============================================
-- 1. ACTIVITIES TABLE
-- Consolidates: case_feedback, case_actions, case_faces, lead_events, 
--               lead_tasks, lead_transfers, lead_labels, lead_recommendations,
--               lead_activities, lead_tags, lead_reminders, feedback_history, inventory_matches
-- ============================================

CREATE TABLE IF NOT EXISTS public.activities (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    lead_id uuid NOT NULL REFERENCES public.leads(id) ON DELETE CASCADE,
    activity_type text NOT NULL CHECK (activity_type IN ('event', 'task', 'feedback', 'transfer', 'label', 'recommendation')),
    event_type text CHECK (event_type IN ('note', 'stage_change', 'feedback', 'call', 'ai_coach', 'system', 'activity')),
    task_type text CHECK (task_type IN ('follow_up', 'meeting', 'document', 'custom')),
    task_status text CHECK (task_status IN ('pending', 'in_progress', 'completed', 'cancelled', 'overdue')),
    actor_profile_id uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
    assignee_profile_id uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
    from_profile_id uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
    to_profile_id uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
    stage text,
    summary text,
    body text,
    ai_coach text,
    label text,
    label_color text DEFAULT '#3b82f6',
    due_at timestamptz,
    completed_at timestamptz,
    filters jsonb DEFAULT '{}'::jsonb,
    top_units jsonb,
    recommendation text,
    result_count integer DEFAULT 0,
    reason text,
    payload jsonb DEFAULT '{}'::jsonb,
    created_at timestamptz NOT NULL DEFAULT now(),
    updated_at timestamptz NOT NULL DEFAULT now()
);

COMMENT ON TABLE public.activities IS 'Unified activity/event/task system for leads - consolidates all lead workflow tables';

CREATE INDEX IF NOT EXISTS idx_activities_lead_created ON public.activities(lead_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_activities_type ON public.activities(activity_type);
CREATE INDEX IF NOT EXISTS idx_activities_task_assignee_status ON public.activities(assignee_profile_id, task_status) WHERE activity_type = 'task';
CREATE INDEX IF NOT EXISTS idx_activities_task_due ON public.activities(lead_id, due_at) WHERE activity_type = 'task' AND task_status = 'pending';
CREATE INDEX IF NOT EXISTS idx_activities_event_type ON public.activities(event_type) WHERE activity_type = 'event';
CREATE INDEX IF NOT EXISTS idx_activities_label ON public.activities(label) WHERE activity_type = 'label';

-- ============================================
-- 2. COMMERCE TABLE
-- Consolidates: purchase_requests, lead_requests, lead_commerce, orders, 
--               lead_batches, wallet_topup_requests
-- ============================================

CREATE TABLE IF NOT EXISTS public.commerce (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    commerce_type text NOT NULL CHECK (commerce_type IN ('purchase', 'request', 'allocation', 'refund', 'topup')),
    profile_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    project_id uuid REFERENCES public.projects(id) ON DELETE SET NULL,
    lead_id uuid REFERENCES public.leads(id) ON DELETE SET NULL,
    quantity integer CHECK (quantity > 0),
    amount numeric(14,2) CHECK (amount >= 0),
    currency text NOT NULL DEFAULT 'EGP',
    payment_method text CHECK (payment_method IN ('wallet', 'Instapay', 'Card', 'VodafoneCash', 'BankTransfer')),
    status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'fulfilled', 'rejected', 'cancelled', 'completed', 'failed')),
    receipt_url text,
    receipt_file_name text,
    payment_operation_id uuid, -- Will reference payments table after creation
    approved_by uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
    approved_at timestamptz,
    rejected_reason text,
    admin_notes text,
    batch_id uuid, -- For lead batches
    notes text,
    metadata jsonb DEFAULT '{}'::jsonb,
    created_at timestamptz NOT NULL DEFAULT now(),
    updated_at timestamptz NOT NULL DEFAULT now()
);

COMMENT ON TABLE public.commerce IS 'Unified commerce transactions - purchases, requests, allocations, top-ups';

CREATE INDEX IF NOT EXISTS idx_commerce_profile_status ON public.commerce(profile_id, status);
CREATE INDEX IF NOT EXISTS idx_commerce_project ON public.commerce(project_id);
CREATE INDEX IF NOT EXISTS idx_commerce_type_status ON public.commerce(commerce_type, status);
CREATE INDEX IF NOT EXISTS idx_commerce_created ON public.commerce(created_at DESC);

-- ============================================
-- 3. PAYMENTS TABLE
-- Consolidates: profile_wallets, wallet_entries, payment_operations, 
--               payment_transactions, user_wallets, wallet_transactions
-- ============================================

CREATE TABLE IF NOT EXISTS public.payments (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    profile_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    wallet_id uuid, -- Denormalized reference (for compatibility)
    operation_type text NOT NULL CHECK (operation_type IN ('deposit', 'withdrawal', 'payment', 'refund', 'adjustment', 'gateway_charge', 'topup_request', 'payout')),
    entry_type text CHECK (entry_type IN ('deposit', 'withdrawal', 'payment', 'refund', 'adjustment')),
    status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'completed', 'failed', 'cancelled')),
    amount numeric(14,2) NOT NULL,
    currency text NOT NULL DEFAULT 'EGP',
    balance_after numeric(14,2), -- Wallet balance after this operation
    provider text, -- Payment gateway: 'kashier', 'instapay', etc.
    provider_transaction_id text,
    description text,
    reference_type text, -- 'commerce', 'topup', etc.
    reference_id uuid, -- Reference to commerce or other entity
    receipt_url text,
    receipt_file_name text,
    validated_by uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
    validated_at timestamptz,
    admin_notes text,
    rejected_reason text,
    metadata jsonb DEFAULT '{}'::jsonb,
    requested_at timestamptz NOT NULL DEFAULT now(),
    processed_at timestamptz,
    created_at timestamptz NOT NULL DEFAULT now(),
    updated_at timestamptz NOT NULL DEFAULT now()
);

COMMENT ON TABLE public.payments IS 'Unified payment and wallet system - all financial transactions';

CREATE INDEX IF NOT EXISTS idx_payments_profile_created ON public.payments(profile_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_payments_reference ON public.payments(reference_type, reference_id);
CREATE INDEX IF NOT EXISTS idx_payments_provider_txn ON public.payments(provider, provider_transaction_id);
CREATE INDEX IF NOT EXISTS idx_payments_status ON public.payments(status);
CREATE INDEX IF NOT EXISTS idx_payments_operation_type ON public.payments(operation_type);

-- Add foreign key for commerce.payment_operation_id
ALTER TABLE public.commerce 
    ADD CONSTRAINT commerce_payment_operation_id_fkey 
    FOREIGN KEY (payment_operation_id) REFERENCES public.payments(id) ON DELETE SET NULL;

-- ============================================
-- 4. TEAM_MEMBERS (Enhanced)
-- Consolidates: team_members, team_invitations
-- ============================================

-- Add invitation columns to existing team_members table if they don't exist
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'team_members' 
        AND column_name = 'invited_by'
    ) THEN
        ALTER TABLE public.team_members
            ADD COLUMN invited_by uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
            ADD COLUMN invited_email text,
            ADD COLUMN invitation_token text,
            ADD COLUMN invitation_expires_at timestamptz;
        
        CREATE INDEX IF NOT EXISTS idx_team_members_invitation_token 
            ON public.team_members(invitation_token) 
            WHERE status = 'invited';
    END IF;
END $$;

-- ============================================
-- 5. CONTENT TABLE
-- Consolidates: dashboard_banners, marketing_assets, cms_pages, cms_media,
--               templates_email, templates_sms, system_settings, feature_flags
-- ============================================

CREATE TABLE IF NOT EXISTS public.content (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    content_type text NOT NULL CHECK (content_type IN ('banner', 'email_template', 'sms_template', 'page', 'media', 'setting', 'feature_flag')),
    title text,
    body text,
    placement text, -- For banners
    audience jsonb DEFAULT '{}'::jsonb, -- Targeting rules
    status text NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'scheduled', 'live', 'archived', 'active', 'inactive')),
    start_at timestamptz,
    end_at timestamptz,
    cta jsonb DEFAULT '{}'::jsonb, -- Call-to-action data
    media_url text, -- For media items
    media_type text, -- For media items
    setting_key text, -- For settings
    setting_value jsonb, -- For settings
    feature_key text, -- For feature flags
    feature_enabled boolean, -- For feature flags
    created_by_profile_id uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
    created_at timestamptz NOT NULL DEFAULT now(),
    updated_at timestamptz NOT NULL DEFAULT now(),
    metadata jsonb DEFAULT '{}'::jsonb
);

COMMENT ON TABLE public.content IS 'Unified CMS content - banners, templates, pages, media, settings, feature flags';

CREATE INDEX IF NOT EXISTS idx_content_type_status ON public.content(content_type, status);
CREATE INDEX IF NOT EXISTS idx_content_setting_key ON public.content(setting_key) WHERE content_type = 'setting';
CREATE INDEX IF NOT EXISTS idx_content_feature_key ON public.content(feature_key) WHERE content_type = 'feature_flag';
CREATE INDEX IF NOT EXISTS idx_content_placement ON public.content(placement) WHERE content_type = 'banner';

-- ============================================
-- 6. CONTENT_METRICS TABLE
-- Consolidates: marketing_metrics, banner_metrics
-- ============================================

CREATE TABLE IF NOT EXISTS public.content_metrics (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    content_id uuid NOT NULL REFERENCES public.content(id) ON DELETE CASCADE,
    viewer_profile_id uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
    event text NOT NULL CHECK (event IN ('impression', 'click', 'view', 'interaction')),
    created_at timestamptz NOT NULL DEFAULT now()
);

COMMENT ON TABLE public.content_metrics IS 'Metrics and analytics for content';

CREATE INDEX IF NOT EXISTS idx_content_metrics_content_event ON public.content_metrics(content_id, event);
CREATE INDEX IF NOT EXISTS idx_content_metrics_created ON public.content_metrics(created_at DESC);

-- ============================================
-- 7. NOTIFICATIONS TABLE (Enhanced)
-- Consolidates: notifications, notification_events
-- ============================================

-- Check if notifications table exists, if not create it
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'notifications') THEN
        CREATE TABLE public.notifications (
            id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
            target_profile_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
            context text NOT NULL CHECK (context IN ('lead', 'support', 'system', 'commerce', 'team')),
            context_id uuid,
            title text NOT NULL,
            body text,
            url text,
            channels text[] NOT NULL DEFAULT ARRAY['inapp']::text[],
            status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'sent', 'read', 'failed')),
            read_at timestamptz,
            sent_at timestamptz,
            metadata jsonb DEFAULT '{}'::jsonb,
            created_at timestamptz NOT NULL DEFAULT now()
        );
    ELSE
        -- Add missing columns if table exists
        ALTER TABLE public.notifications
            ADD COLUMN IF NOT EXISTS context text CHECK (context IN ('lead', 'support', 'system', 'commerce', 'team')),
            ADD COLUMN IF NOT EXISTS context_id uuid,
            ADD COLUMN IF NOT EXISTS metadata jsonb DEFAULT '{}'::jsonb;
    END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_notifications_target_status ON public.notifications(target_profile_id, status);
CREATE INDEX IF NOT EXISTS idx_notifications_context ON public.notifications(context, context_id);
CREATE INDEX IF NOT EXISTS idx_notifications_created ON public.notifications(created_at DESC);

-- ============================================
-- 8. SYSTEM_LOGS TABLE
-- Consolidates: audit_logs, recent_activity
-- ============================================

CREATE TABLE IF NOT EXISTS public.system_logs (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    log_type text NOT NULL CHECK (log_type IN ('audit', 'activity', 'error', 'integration')),
    actor_profile_id uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
    action text NOT NULL,
    entity_type text,
    entity_id uuid,
    details jsonb DEFAULT '{}'::jsonb,
    ip_address text,
    user_agent text,
    created_at timestamptz NOT NULL DEFAULT now()
);

COMMENT ON TABLE public.system_logs IS 'Unified audit and activity logging';

CREATE INDEX IF NOT EXISTS idx_system_logs_actor_created ON public.system_logs(actor_profile_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_system_logs_entity ON public.system_logs(entity_type, entity_id);
CREATE INDEX IF NOT EXISTS idx_system_logs_type ON public.system_logs(log_type);

-- ============================================
-- Enable RLS on new tables
-- ============================================

ALTER TABLE public.activities ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.commerce ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.content ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.content_metrics ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.system_logs ENABLE ROW LEVEL SECURITY;

-- ============================================
-- Create updated_at triggers
-- ============================================

CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS update_activities_updated_at ON public.activities;
CREATE TRIGGER update_activities_updated_at
    BEFORE UPDATE ON public.activities
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

DROP TRIGGER IF EXISTS update_commerce_updated_at ON public.commerce;
CREATE TRIGGER update_commerce_updated_at
    BEFORE UPDATE ON public.commerce
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

DROP TRIGGER IF EXISTS update_payments_updated_at ON public.payments;
CREATE TRIGGER update_payments_updated_at
    BEFORE UPDATE ON public.payments
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

DROP TRIGGER IF EXISTS update_content_updated_at ON public.content;
CREATE TRIGGER update_content_updated_at
    BEFORE UPDATE ON public.content
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

COMMIT;

-- Log completion
DO $$
BEGIN
  RAISE NOTICE '✅ Consolidated schema tables created successfully!';
END $$;

