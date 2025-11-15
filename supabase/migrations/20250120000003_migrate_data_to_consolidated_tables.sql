-- ============================================
-- DATABASE CONSOLIDATION MIGRATION
-- Phase 3: Migrate Data from Old Tables to New Consolidated Tables
-- ============================================
-- This migration copies data from old tables to new consolidated tables
-- Old tables are kept for now (will be dropped in a later migration)

BEGIN;

-- ============================================
-- MIGRATE ACTIVITIES DATA
-- ============================================

-- From case_feedback
INSERT INTO public.activities (
    id, lead_id, activity_type, event_type, actor_profile_id, stage, body, ai_coach, created_at, updated_at
)
SELECT 
    id, lead_id, 'feedback'::text, 'feedback'::text, created_by, stage, feedback, ai_coach, created_at, created_at
FROM public.case_feedback
ON CONFLICT (id) DO NOTHING;

-- From case_actions
INSERT INTO public.activities (
    id, lead_id, activity_type, task_type, actor_profile_id, assignee_profile_id, 
    task_status, due_at, completed_at, payload, created_at, updated_at
)
SELECT 
    id, lead_id, 'task'::text, 
    CASE 
        WHEN lower(action_type) IN ('call', 'meeting') THEN lower(action_type)
        WHEN lower(action_type) = 'document' THEN 'document'
        ELSE 'custom'
    END,
    created_by, created_by,
    CASE 
        WHEN upper(status) IN ('COMPLETED', 'DONE') THEN 'completed'
        WHEN upper(status) IN ('CANCELLED', 'CANCELED') THEN 'cancelled'
        ELSE 'pending'
    END,
    due_at, completed_at, 
    jsonb_build_object('action_type', action_type, 'payload', COALESCE(payload, '{}'::jsonb), 'notified_at', notified_at),
    created_at, created_at
FROM public.case_actions
ON CONFLICT (id) DO NOTHING;

-- From case_faces
INSERT INTO public.activities (
    id, lead_id, activity_type, from_profile_id, to_profile_id, reason, actor_profile_id, created_at, updated_at
)
SELECT 
    id, lead_id, 'transfer'::text, from_agent, to_agent, reason, created_by, created_at, created_at
FROM public.case_faces
ON CONFLICT (id) DO NOTHING;

-- From lead_events (if exists)
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'lead_events') THEN
        INSERT INTO public.activities (
            id, lead_id, activity_type, event_type, actor_profile_id, stage, summary, payload, created_at, updated_at
        )
        SELECT 
            id, lead_id, 'event'::text, event_type, actor_profile_id, stage, summary, payload, created_at, created_at
        FROM public.lead_events
        ON CONFLICT (id) DO NOTHING;
    END IF;
END $$;

-- From lead_tasks (if exists)
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'lead_tasks') THEN
        INSERT INTO public.activities (
            id, lead_id, activity_type, task_type, actor_profile_id, assignee_profile_id,
            task_status, due_at, completed_at, payload, created_at, updated_at
        )
        SELECT 
            id, lead_id, 'task'::text, task_type, created_by_profile_id, assignee_profile_id,
            status, due_at, completed_at, payload, created_at, updated_at
        FROM public.lead_tasks
        ON CONFLICT (id) DO NOTHING;
    END IF;
END $$;

-- From lead_transfers (if exists)
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'lead_transfers') THEN
        INSERT INTO public.activities (
            id, lead_id, activity_type, from_profile_id, to_profile_id, reason, actor_profile_id, created_at, updated_at
        )
        SELECT 
            id, lead_id, 'transfer'::text, from_profile_id, to_profile_id, reason, created_by_profile_id, created_at, created_at
        FROM public.lead_transfers
        ON CONFLICT (id) DO NOTHING;
    END IF;
END $$;

-- From lead_labels (if exists)
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'lead_labels') THEN
        INSERT INTO public.activities (
            lead_id, activity_type, label, label_color, actor_profile_id, created_at, updated_at
        )
        SELECT 
            lead_id, 'label'::text, label, color, applied_by_profile_id, applied_at, applied_at
        FROM public.lead_labels
        ON CONFLICT DO NOTHING;
    END IF;
END $$;

-- From lead_recommendations / inventory_matches
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'lead_recommendations') THEN
        INSERT INTO public.activities (
            id, lead_id, activity_type, actor_profile_id, filters, top_units, recommendation, result_count, created_at, updated_at
        )
        SELECT 
            id, lead_id, 'recommendation'::text, generated_by_profile_id, filters, top_units, recommendation, result_count, created_at, created_at
        FROM public.lead_recommendations
        ON CONFLICT (id) DO NOTHING;
    ELSIF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'inventory_matches') THEN
        INSERT INTO public.activities (
            id, lead_id, activity_type, actor_profile_id, filters, top_units, recommendation, result_count, created_at, updated_at
        )
        SELECT 
            id, lead_id, 'recommendation'::text, created_by, filters, top_units, recommendation, result_count, created_at, created_at
        FROM public.inventory_matches
        ON CONFLICT (id) DO NOTHING;
    END IF;
END $$;

-- ============================================
-- MIGRATE COMMERCE DATA
-- ============================================

-- From purchase_requests
INSERT INTO public.commerce (
    id, commerce_type, profile_id, project_id, quantity, amount, currency, payment_method,
    status, receipt_url, receipt_file_name, approved_by, approved_at, rejected_reason,
    admin_notes, metadata, created_at, updated_at
)
SELECT 
    id, 'purchase'::text, user_id, project_id, quantity, total_amount, 'EGP'::text, payment_method,
    status, receipt_url, receipt_file_name, approved_by, approved_at, rejected_reason,
    admin_notes, 
    jsonb_build_object('source', 'purchase_requests', 'project_name', project_name),
    created_at, updated_at
FROM public.purchase_requests
ON CONFLICT (id) DO NOTHING;

-- From lead_requests (if exists)
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'lead_requests') THEN
        INSERT INTO public.commerce (
            id, commerce_type, profile_id, project_id, quantity, status, notes, metadata, created_at, updated_at
        )
        SELECT 
            id, 'request'::text, user_id, project_id, quantity, status, notes,
            jsonb_build_object('source', 'lead_requests', 'project_name', project_name),
            created_at, updated_at
        FROM public.lead_requests
        ON CONFLICT (id) DO NOTHING;
    END IF;
END $$;

-- From lead_commerce (if exists)
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'lead_commerce') THEN
        INSERT INTO public.commerce (
            id, commerce_type, profile_id, project_id, lead_id, quantity, amount, currency,
            payment_operation_id, status, notes, metadata, created_at, updated_at
        )
        SELECT 
            id, commerce_type, profile_id, project_id, lead_id, quantity, amount, currency,
            payment_operation_id, status, notes, metadata, created_at, updated_at
        FROM public.lead_commerce
        ON CONFLICT (id) DO NOTHING;
    END IF;
END $$;

-- From orders (if exists)
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'orders') THEN
        INSERT INTO public.commerce (
            id, commerce_type, profile_id, project_id, quantity, amount, currency, payment_method,
            status, metadata, created_at, updated_at
        )
        SELECT 
            id, 'purchase'::text, user_id, project_id, quantity, total_amount, 'EGP'::text, payment_method,
            COALESCE(status, 'completed'), 
            jsonb_build_object('source', 'orders', 'payment_reference', payment_reference),
            created_at, updated_at
        FROM public.orders
        ON CONFLICT (id) DO NOTHING;
    END IF;
END $$;

-- From wallet_topup_requests
INSERT INTO public.commerce (
    id, commerce_type, profile_id, amount, currency, payment_method, status,
    receipt_url, receipt_file_name, approved_by, approved_at, rejected_reason,
    admin_notes, metadata, created_at, updated_at
)
SELECT 
    id, 'topup'::text, user_id, amount, 'EGP'::text, payment_method, 
    CASE 
        WHEN status = 'approved' THEN 'approved'
        WHEN status = 'rejected' THEN 'rejected'
        ELSE 'pending'
    END,
    receipt_file_url, receipt_file_name, validated_by, validated_at, rejected_reason,
    admin_notes,
    jsonb_build_object('source', 'wallet_topup_requests'),
    created_at, updated_at
FROM public.wallet_topup_requests
ON CONFLICT (id) DO NOTHING;

-- From lead_batches (if exists)
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'lead_batches') THEN
        INSERT INTO public.commerce (
            id, commerce_type, profile_id, project_id, quantity, amount, currency,
            status, batch_id, metadata, created_at, updated_at
        )
        SELECT 
            id, 'allocation'::text, upload_user_id, project_id, total_leads, 
            COALESCE(cpl_price * total_leads, 0), 'EGP'::text,
            COALESCE(status, 'completed'),
            id, -- batch_id references itself
            jsonb_build_object('source', 'lead_batches', 'batch_name', batch_name, 'successful_leads', successful_leads, 'failed_leads', failed_leads),
            created_at, updated_at
        FROM public.lead_batches
        ON CONFLICT (id) DO NOTHING;
    END IF;
END $$;

-- ============================================
-- MIGRATE PAYMENTS DATA
-- ============================================

-- First, create wallet entries from profile_wallets (initial balance)
INSERT INTO public.payments (
    id, profile_id, wallet_id, operation_type, entry_type, status, amount, currency,
    balance_after, description, metadata, created_at, updated_at
)
SELECT 
    gen_random_uuid(),
    profile_id,
    id,
    'adjustment'::text,
    'deposit'::text,
    'completed'::text,
    COALESCE(balance, 0),
    currency,
    COALESCE(balance, 0),
    'Initial wallet balance migration',
    jsonb_build_object('source', 'profile_wallets', 'wallet_id', id),
    created_at,
    updated_at
FROM public.profile_wallets
WHERE COALESCE(balance, 0) > 0
ON CONFLICT DO NOTHING;

-- From wallet_entries (if exists)
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'wallet_entries') THEN
        INSERT INTO public.payments (
            id, profile_id, wallet_id, operation_type, entry_type, status, amount, currency,
            description, reference_type, reference_id, metadata, created_at, updated_at
        )
        SELECT 
            id, profile_id, wallet_id, entry_type, entry_type, status, amount, currency,
            description, reference_type, reference_id, metadata, created_at, updated_at
        FROM public.wallet_entries
        ON CONFLICT (id) DO NOTHING;
    END IF;
END $$;

-- From payment_operations (if exists)
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'payment_operations') THEN
        INSERT INTO public.payments (
            id, profile_id, wallet_id, operation_type, status, amount, currency,
            provider, provider_transaction_id, metadata, requested_at, processed_at, created_at, updated_at
        )
        SELECT 
            id, profile_id, wallet_id, operation_type, status, amount, currency,
            provider, provider_transaction_id, metadata, requested_at, processed_at, created_at, updated_at
        FROM public.payment_operations
        ON CONFLICT (id) DO NOTHING;
    END IF;
END $$;

-- From payment_transactions (if exists)
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'payment_transactions') THEN
        INSERT INTO public.payments (
            id, profile_id, operation_type, status, amount, currency,
            provider, provider_transaction_id, metadata, requested_at, processed_at, created_at, updated_at
        )
        SELECT 
            id, user_id, 'gateway_charge'::text, 
            CASE 
                WHEN status ILIKE 'pending' THEN 'pending'
                WHEN status ILIKE 'processing' THEN 'processing'
                WHEN status ILIKE 'failed' THEN 'failed'
                WHEN status ILIKE 'cancel%' THEN 'cancelled'
                ELSE 'completed'
            END,
            amount, currency,
            gateway, COALESCE(gateway_transaction_id, gateway_payment_intent_id),
            jsonb_build_object(
                'transaction_type', transaction_type,
                'gateway_payment_intent_id', gateway_payment_intent_id,
                'reference_id', reference_id,
                'error_message', error_message,
                'test_mode', test_mode
            ),
            created_at, completed_at, created_at, updated_at
        FROM public.payment_transactions
        ON CONFLICT (id) DO NOTHING;
    END IF;
END $$;

-- ============================================
-- MIGRATE CONTENT DATA
-- ============================================

-- From dashboard_banners
INSERT INTO public.content (
    id, content_type, title, body, placement, audience, status, start_at, end_at,
    cta, created_by_profile_id, created_at, updated_at, metadata
)
SELECT 
    id, 'banner'::text, title, subtitle, placement,
    jsonb_build_object('audience', audience, 'visibility_rules', visibility_rules),
    status, start_at, end_at,
    jsonb_build_object('cta_label', cta_label, 'cta_url', cta_url, 'image_url', image_url),
    created_by, created_at, updated_at,
    jsonb_build_object('source', 'dashboard_banners')
FROM public.dashboard_banners
ON CONFLICT (id) DO NOTHING;

-- From marketing_assets (if exists and different from dashboard_banners)
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'marketing_assets') THEN
        INSERT INTO public.content (
            id, content_type, title, body, placement, audience, status, start_at, end_at,
            cta, created_by_profile_id, created_at, updated_at, metadata
        )
        SELECT 
            id, 'banner'::text, title, body, placement, audience, status, start_at, end_at,
            cta, created_by_profile_id, created_at, updated_at,
            jsonb_build_object('source', 'marketing_assets')
        FROM public.marketing_assets
        WHERE id NOT IN (SELECT id FROM public.dashboard_banners)
        ON CONFLICT (id) DO NOTHING;
    END IF;
END $$;

-- From templates_email (if exists)
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'templates_email') THEN
        INSERT INTO public.content (
            id, content_type, title, body, created_by_profile_id, created_at, updated_at, metadata
        )
        SELECT 
            id, 'email_template'::text, template_name, template_body, created_by, created_at, updated_at,
            jsonb_build_object('subject', subject, 'source', 'templates_email')
        FROM public.templates_email
        ON CONFLICT (id) DO NOTHING;
    END IF;
END $$;

-- From templates_sms (if exists)
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'templates_sms') THEN
        INSERT INTO public.content (
            id, content_type, title, body, created_by_profile_id, created_at, updated_at, metadata
        )
        SELECT 
            id, 'sms_template'::text, template_name, template_body, created_by, created_at, updated_at,
            jsonb_build_object('source', 'templates_sms')
        FROM public.templates_sms
        ON CONFLICT (id) DO NOTHING;
    END IF;
END $$;

-- From system_settings (if exists)
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'system_settings') THEN
        INSERT INTO public.content (
            id, content_type, setting_key, setting_value, created_at, updated_at, metadata
        )
        SELECT 
            id, 'setting'::text, setting_key, setting_value, created_at, updated_at,
            jsonb_build_object('source', 'system_settings', 'description', description)
        FROM public.system_settings
        ON CONFLICT (id) DO NOTHING;
    END IF;
END $$;

-- From feature_flags (if exists)
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'feature_flags') THEN
        INSERT INTO public.content (
            id, content_type, feature_key, feature_enabled, created_at, updated_at, metadata
        )
        SELECT 
            id, 'feature_flag'::text, feature_key, is_enabled, created_at, updated_at,
            jsonb_build_object('source', 'feature_flags', 'description', description)
        FROM public.feature_flags
        ON CONFLICT (id) DO NOTHING;
    END IF;
END $$;

-- ============================================
-- MIGRATE CONTENT_METRICS DATA
-- ============================================

-- From marketing_metrics (if exists)
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'marketing_metrics') THEN
        INSERT INTO public.content_metrics (
            id, content_id, viewer_profile_id, event, created_at
        )
        SELECT 
            id, asset_id, viewer_profile_id, event, created_at
        FROM public.marketing_metrics
        ON CONFLICT (id) DO NOTHING;
    END IF;
END $$;

-- From banner_metrics (if exists)
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'banner_metrics') THEN
        INSERT INTO public.content_metrics (
            id, content_id, viewer_profile_id, event, created_at
        )
        SELECT 
            id, banner_id, viewer_id, event, created_at
        FROM public.banner_metrics
        ON CONFLICT (id) DO NOTHING;
    END IF;
END $$;

-- ============================================
-- MIGRATE NOTIFICATIONS DATA
-- ============================================

-- From notifications (if exists)
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'notifications') THEN
        INSERT INTO public.notifications (
            id, target_profile_id, context, context_id, title, body, url, channels,
            status, read_at, sent_at, metadata, created_at
        )
        SELECT 
            id, user_id, 'system'::text, NULL, title, body, url, COALESCE(channels, ARRAY['inapp']),
            status, read_at, sent_at,
            jsonb_build_object('source', 'notifications'),
            created_at
        FROM public.notifications
        WHERE id NOT IN (SELECT id FROM public.notifications WHERE context IS NOT NULL)
        ON CONFLICT (id) DO NOTHING;
    END IF;
END $$;

-- From notification_events (if exists)
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'notification_events') THEN
        INSERT INTO public.notifications (
            id, target_profile_id, context, context_id, title, body, channels,
            status, read_at, sent_at, metadata, created_at
        )
        SELECT 
            id, target_profile_id, context, context_id, title, body, channels,
            status, read_at, sent_at, metadata, created_at
        FROM public.notification_events
        ON CONFLICT (id) DO NOTHING;
    END IF;
END $$;

-- ============================================
-- MIGRATE SYSTEM_LOGS DATA
-- ============================================

-- From audit_logs (if exists)
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'audit_logs') THEN
        INSERT INTO public.system_logs (
            id, log_type, actor_profile_id, action, entity_type, entity_id, details, created_at
        )
        SELECT 
            id, 'audit'::text, user_id, action, entity_type, entity_id, 
            jsonb_build_object('old_values', old_values, 'new_values', new_values, 'ip_address', ip_address),
            created_at
        FROM public.audit_logs
        ON CONFLICT (id) DO NOTHING;
    END IF;
END $$;

-- From recent_activity (if exists)
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'recent_activity') THEN
        INSERT INTO public.system_logs (
            id, log_type, actor_profile_id, action, details, created_at
        )
        SELECT 
            id, 'activity'::text, user_id, action, details, created_at
        FROM public.recent_activity
        ON CONFLICT (id) DO NOTHING;
    END IF;
END $$;

COMMIT;

-- Log completion
DO $$
BEGIN
  RAISE NOTICE '✅ Data migration to consolidated tables completed!';
  RAISE NOTICE '⚠️  Old tables are still present. They will be dropped in a later migration.';
END $$;

