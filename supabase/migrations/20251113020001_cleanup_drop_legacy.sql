BEGIN;

-- -----------------------------------------------------------------------------
-- Preserve lead tag legacy IDs before dropping the original table
-- -----------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS public.lead_label_ids (
    lead_id uuid NOT NULL,
    label text NOT NULL,
    legacy_id uuid NOT NULL,
    PRIMARY KEY (legacy_id),
    UNIQUE (lead_id, label)
);

INSERT INTO public.lead_label_ids (lead_id, label, legacy_id)
SELECT lt.lead_id, lt.tag_name, lt.id
FROM public.lead_tags lt
ON CONFLICT (legacy_id) DO NOTHING;

-- -----------------------------------------------------------------------------
-- Drop consolidated helper views (will be recreated under canonical names)
-- -----------------------------------------------------------------------------

DROP VIEW IF EXISTS public.feedback_history_consolidated;
DROP VIEW IF EXISTS public.lead_reminders_consolidated;
DROP VIEW IF EXISTS public.notifications_consolidated;
DROP VIEW IF EXISTS public.support_cases_consolidated;
DROP VIEW IF EXISTS public.support_case_replies_consolidated;

-- -----------------------------------------------------------------------------
-- Remove sync triggers from legacy tables prior to drop
-- -----------------------------------------------------------------------------

DROP TRIGGER IF EXISTS trg_feedback_history_sync ON public.feedback_history;
DROP TRIGGER IF EXISTS trg_feedback_history_delete ON public.feedback_history;
DROP TRIGGER IF EXISTS trg_case_feedback_sync ON public.case_feedback;
DROP TRIGGER IF EXISTS trg_case_feedback_delete ON public.case_feedback;
DROP TRIGGER IF EXISTS trg_lead_activities_sync ON public.lead_activities;
DROP TRIGGER IF EXISTS trg_lead_activities_delete ON public.lead_activities;
DROP TRIGGER IF EXISTS trg_lead_reminders_sync ON public.lead_reminders;
DROP TRIGGER IF EXISTS trg_lead_reminders_delete ON public.lead_reminders;
DROP TRIGGER IF EXISTS trg_case_actions_sync ON public.case_actions;
DROP TRIGGER IF EXISTS trg_case_actions_delete ON public.case_actions;
DROP TRIGGER IF EXISTS trg_case_faces_sync ON public.case_faces;
DROP TRIGGER IF EXISTS trg_case_faces_delete ON public.case_faces;
DROP TRIGGER IF EXISTS trg_inventory_matches_sync ON public.inventory_matches;
DROP TRIGGER IF EXISTS trg_inventory_matches_delete ON public.inventory_matches;
DROP TRIGGER IF EXISTS trg_lead_requests_sync ON public.lead_requests;
DROP TRIGGER IF EXISTS trg_lead_requests_delete ON public.lead_requests;
DROP TRIGGER IF EXISTS trg_purchase_requests_sync ON public.purchase_requests;
DROP TRIGGER IF EXISTS trg_purchase_requests_delete ON public.purchase_requests;
DROP TRIGGER IF EXISTS trg_dashboard_banners_sync ON public.dashboard_banners;
DROP TRIGGER IF EXISTS trg_dashboard_banners_delete ON public.dashboard_banners;
DROP TRIGGER IF EXISTS trg_banner_metrics_sync ON public.banner_metrics;
DROP TRIGGER IF EXISTS trg_banner_metrics_delete ON public.banner_metrics;
DROP TRIGGER IF EXISTS trg_notifications_sync ON public.notifications;
DROP TRIGGER IF EXISTS trg_notifications_delete ON public.notifications;
DROP TRIGGER IF EXISTS trg_user_wallets_sync ON public.user_wallets;
DROP TRIGGER IF EXISTS trg_user_wallets_delete ON public.user_wallets;
DROP TRIGGER IF EXISTS trg_wallet_transactions_sync ON public.wallet_transactions;
DROP TRIGGER IF EXISTS trg_wallet_transactions_delete ON public.wallet_transactions;
DROP TRIGGER IF EXISTS trg_payment_transactions_sync ON public.payment_transactions;
DROP TRIGGER IF EXISTS trg_payment_transactions_delete ON public.payment_transactions;
DROP TRIGGER IF EXISTS trg_wallet_topup_requests_sync ON public.wallet_topup_requests;
DROP TRIGGER IF EXISTS trg_wallet_topup_requests_delete ON public.wallet_topup_requests;
DROP TRIGGER IF EXISTS trg_support_cases_sync ON public.support_cases;
DROP TRIGGER IF EXISTS trg_support_cases_delete ON public.support_cases;
DROP TRIGGER IF EXISTS trg_support_case_replies_sync ON public.support_case_replies;
DROP TRIGGER IF EXISTS trg_support_case_replies_delete ON public.support_case_replies;

-- -----------------------------------------------------------------------------
-- Drop the legacy tables now that data is consolidated into the new domain
-- -----------------------------------------------------------------------------

DROP TABLE IF EXISTS public.feedback_history CASCADE;
DROP TABLE IF EXISTS public.case_feedback CASCADE;
DROP TABLE IF EXISTS public.lead_activities CASCADE;
DROP TABLE IF EXISTS public.lead_reminders CASCADE;
DROP TABLE IF EXISTS public.case_actions CASCADE;
DROP TABLE IF EXISTS public.case_faces CASCADE;
DROP TABLE IF EXISTS public.inventory_matches CASCADE;
DROP TABLE IF EXISTS public.lead_tags CASCADE;
DROP TABLE IF EXISTS public.lead_requests CASCADE;
DROP TABLE IF EXISTS public.purchase_requests CASCADE;
DROP TABLE IF EXISTS public.dashboard_banners CASCADE;
DROP TABLE IF EXISTS public.banner_metrics CASCADE;
DROP TABLE IF EXISTS public.notifications CASCADE;
DROP TABLE IF EXISTS public.user_wallets CASCADE;
DROP TABLE IF EXISTS public.wallet_transactions CASCADE;
DROP TABLE IF EXISTS public.payment_transactions CASCADE;
DROP TABLE IF EXISTS public.wallet_topup_requests CASCADE;
DROP TABLE IF EXISTS public.support_case_replies CASCADE;
DROP TABLE IF EXISTS public.support_cases CASCADE;

-- -----------------------------------------------------------------------------
-- Additional helper functions for view compatibility
-- -----------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION public.sync_lead_tags_to_lead_labels()
RETURNS trigger AS $$
BEGIN
  IF NEW.id IS NULL THEN
    NEW.id := gen_random_uuid();
  END IF;

  INSERT INTO public.lead_label_ids (lead_id, label, legacy_id)
  VALUES (NEW.lead_id, NEW.tag_name, NEW.id)
  ON CONFLICT (legacy_id) DO UPDATE
    SET lead_id = EXCLUDED.lead_id,
        label = EXCLUDED.label;

  INSERT INTO public.lead_labels (lead_id, label, color, applied_by_profile_id, applied_at)
  VALUES (
    NEW.lead_id,
    NEW.tag_name,
    COALESCE(NEW.color, '#3b82f6'),
    NEW.created_by,
    COALESCE(NEW.created_at, now())
  )
  ON CONFLICT (lead_id, label) DO UPDATE
    SET color = EXCLUDED.color,
        applied_by_profile_id = EXCLUDED.applied_by_profile_id,
        applied_at = EXCLUDED.applied_at;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION public.remove_lead_label()
RETURNS trigger AS $$
BEGIN
  DELETE FROM public.lead_labels
  WHERE lead_id = OLD.lead_id AND label = OLD.tag_name;

  DELETE FROM public.lead_label_ids
  WHERE legacy_id = OLD.id;

  RETURN OLD;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION public.ensure_lead_label_id()
RETURNS trigger AS $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM public.lead_label_ids
    WHERE lead_id = NEW.lead_id AND label = NEW.label
  ) THEN
    INSERT INTO public.lead_label_ids (lead_id, label, legacy_id)
    VALUES (NEW.lead_id, NEW.label, gen_random_uuid())
    ON CONFLICT DO NOTHING;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION public.cleanup_lead_label_id()
RETURNS trigger AS $$
BEGIN
  DELETE FROM public.lead_label_ids
  WHERE lead_id = OLD.lead_id AND label = OLD.label;
  RETURN OLD;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_lead_labels_assign_id ON public.lead_labels;
DROP TRIGGER IF EXISTS trg_lead_labels_cleanup_id ON public.lead_labels;

CREATE TRIGGER trg_lead_labels_assign_id
AFTER INSERT ON public.lead_labels
FOR EACH ROW EXECUTE FUNCTION public.ensure_lead_label_id();

CREATE TRIGGER trg_lead_labels_cleanup_id
AFTER DELETE ON public.lead_labels
FOR EACH ROW EXECUTE FUNCTION public.cleanup_lead_label_id();

CREATE OR REPLACE FUNCTION public.sync_lead_requests_to_lead_commerce()
RETURNS trigger AS $$
DECLARE
  v_metadata jsonb;
BEGIN
  v_metadata := jsonb_build_object(
    'source', 'lead_requests',
    'project_name', NEW.project_name,
    'fulfilled_at', NEW.fulfilled_at
  );

  INSERT INTO public.lead_commerce (id, lead_id, profile_id, project_id, commerce_type, status, quantity, amount, currency, payment_operation_id, notes, metadata, created_at, updated_at)
  VALUES (
    NEW.id,
    NULL,
    NEW.user_id,
    NEW.project_id,
    'request',
    NEW.status,
    NEW.quantity,
    NEW.budget,
    NULL,
    NULL,
    NEW.notes,
    v_metadata,
    COALESCE(NEW.created_at, now()),
    COALESCE(NEW.updated_at, now())
  )
  ON CONFLICT (id) DO UPDATE
    SET profile_id = EXCLUDED.profile_id,
        project_id = EXCLUDED.project_id,
        commerce_type = EXCLUDED.commerce_type,
        status = EXCLUDED.status,
        quantity = EXCLUDED.quantity,
        amount = EXCLUDED.amount,
        metadata = EXCLUDED.metadata,
        created_at = EXCLUDED.created_at,
        updated_at = EXCLUDED.updated_at;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION public.sync_purchase_requests_to_lead_commerce()
RETURNS trigger AS $$
DECLARE
  v_metadata jsonb;
BEGIN
  v_metadata := jsonb_build_object(
    'source', 'purchase_requests',
    'receipt_url', NEW.receipt_url,
    'payment_method', NEW.payment_method,
    'receipt_file_name', NEW.receipt_file_name,
    'approved_by', NEW.approved_by,
    'approved_at', NEW.approved_at,
    'rejected_reason', NEW.rejected_reason,
    'rejected_at', NEW.rejected_at,
    'project_name', NEW.project_name
  );

  INSERT INTO public.lead_commerce (id, lead_id, profile_id, project_id, commerce_type, status, quantity, amount, currency, payment_operation_id, notes, metadata, created_at, updated_at)
  VALUES (
    NEW.id,
    NULL,
    NEW.user_id,
    NEW.project_id,
    'allocation',
    NEW.status,
    NEW.quantity,
    NEW.total_amount,
    NULL,
    NEW.payment_transaction_id,
    NEW.admin_notes,
    v_metadata,
    COALESCE(NEW.created_at, now()),
    COALESCE(NEW.updated_at, now())
  )
  ON CONFLICT (id) DO UPDATE
    SET profile_id = EXCLUDED.profile_id,
        project_id = EXCLUDED.project_id,
        commerce_type = EXCLUDED.commerce_type,
        status = EXCLUDED.status,
        quantity = EXCLUDED.quantity,
        amount = EXCLUDED.amount,
        payment_operation_id = EXCLUDED.payment_operation_id,
        notes = EXCLUDED.notes,
        metadata = EXCLUDED.metadata,
        created_at = EXCLUDED.created_at,
        updated_at = EXCLUDED.updated_at;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- -----------------------------------------------------------------------------
-- Recreate legacy table names as views backed by the consolidated schema
-- -----------------------------------------------------------------------------

CREATE OR REPLACE VIEW public.feedback_history AS
SELECT
  le.id,
  le.lead_id,
  le.actor_profile_id AS user_id,
  COALESCE(le.payload->>'feedback_text', le.summary) AS feedback_text,
  le.created_at,
  COALESCE((le.payload->>'updated_at')::timestamptz, le.created_at) AS updated_at
FROM public.lead_events le
WHERE le.event_type = 'feedback' AND le.payload->>'source' = 'feedback_history';

CREATE VIEW public.case_feedback AS
SELECT
  le.id,
  le.lead_id,
  le.stage,
  le.summary AS feedback,
  le.payload->>'ai_coach' AS ai_coach,
  le.actor_profile_id AS created_by,
  le.created_at
FROM public.lead_events le
WHERE le.payload->>'source' = 'case_feedback';

CREATE VIEW public.lead_activities AS
SELECT
  le.id,
  le.lead_id,
  le.actor_profile_id AS user_id,
  COALESCE(le.payload->>'activity_type', 'activity') AS activity_type,
  COALESCE(le.payload->'activity_data', '{}'::jsonb) AS activity_data,
  le.summary AS description,
  le.created_at
FROM public.lead_events le
WHERE le.payload->>'source' = 'lead_activities';

CREATE VIEW public.lead_reminders AS
SELECT
  lt.id,
  lt.lead_id,
  lt.created_by_profile_id AS user_id,
  lt.due_at AS reminder_date,
  lt.payload->>'reminder_text' AS reminder_text,
  (lt.status = 'completed') AS is_completed,
  lt.completed_at,
  lt.created_at,
  lt.updated_at
FROM public.lead_tasks lt
WHERE lt.task_type = 'follow_up' AND lt.payload->>'source' = 'lead_reminders';

CREATE VIEW public.case_actions AS
SELECT
  lt.id,
  lt.lead_id,
  COALESCE(lt.payload->>'action_type', lt.task_type) AS action_type,
  COALESCE(lt.payload->'payload', '{}'::jsonb) AS payload,
  lt.due_at,
  CASE
    WHEN lt.status = 'completed' THEN 'DONE'
    WHEN lt.status = 'cancelled' THEN 'CANCELLED'
    WHEN lt.status = 'in_progress' THEN 'IN_PROGRESS'
    ELSE 'PENDING'
  END AS status,
  lt.created_by_profile_id AS created_by,
  lt.created_at,
  lt.completed_at,
  (lt.payload->>'notified_at')::timestamptz AS notified_at
FROM public.lead_tasks lt
WHERE lt.payload->>'source' = 'case_actions';

CREATE VIEW public.case_faces AS
SELECT
  lt.id,
  lt.lead_id,
  lt.from_profile_id AS from_agent,
  lt.to_profile_id AS to_agent,
  lt.reason,
  lt.created_by_profile_id AS created_by,
  lt.created_at
FROM public.lead_transfers lt;

CREATE VIEW public.inventory_matches AS
SELECT
  lr.id,
  lr.lead_id,
  lr.filters,
  lr.result_count,
  lr.top_units,
  lr.recommendation,
  lr.generated_by_profile_id AS created_by,
  lr.created_at
FROM public.lead_recommendations lr;

CREATE VIEW public.lead_tags AS
SELECT
  lli.legacy_id AS id,
  ll.lead_id,
  ll.label AS tag_name,
  ll.color,
  ll.applied_at AS created_at,
  ll.applied_by_profile_id AS created_by
FROM public.lead_labels ll
LEFT JOIN public.lead_label_ids lli
  ON lli.lead_id = ll.lead_id AND lli.label = ll.label;

CREATE VIEW public.lead_requests AS
SELECT
  lc.id,
  lc.profile_id AS user_id,
  lc.project_id,
  lc.quantity,
  lc.amount AS budget,
  lc.status,
  lc.notes,
  (lc.metadata->>'project_name') AS project_name,
  (lc.metadata->>'fulfilled_at')::timestamptz AS fulfilled_at,
  lc.created_at,
  lc.updated_at
FROM public.lead_commerce lc
WHERE lc.commerce_type = 'request';

CREATE VIEW public.purchase_requests AS
SELECT
  lc.id,
  lc.profile_id AS user_id,
  lc.project_id,
  lc.quantity,
  lc.status,
  lc.notes AS admin_notes,
  lc.amount AS total_amount,
  lc.metadata->>'receipt_url' AS receipt_url,
  lc.metadata->>'payment_method' AS payment_method,
  lc.metadata->>'receipt_file_name' AS receipt_file_name,
  lc.metadata->>'project_name' AS project_name,
  (lc.metadata->>'approved_by')::uuid AS approved_by,
  (lc.metadata->>'approved_at')::timestamptz AS approved_at,
  (lc.metadata->>'rejected_reason') AS rejected_reason,
  (lc.metadata->>'rejected_at')::timestamptz AS rejected_at,
  lc.payment_operation_id AS payment_transaction_id,
  lc.created_at,
  lc.updated_at
FROM public.lead_commerce lc
WHERE lc.commerce_type = 'allocation';

CREATE VIEW public.dashboard_banners AS
SELECT
  ma.id,
  ma.title,
  ma.body AS subtitle,
  (ma.cta->>'cta_label') AS cta_label,
  (ma.cta->>'cta_url') AS cta_url,
  (ma.cta->>'image_url') AS image_url,
  ma.placement,
  COALESCE(
    (
      SELECT array_agg(value)
      FROM jsonb_array_elements_text(ma.audience->'audience') AS value
    ),
    ARRAY[]::text[]
  ) AS audience,
  ma.audience->'visibility_rules' AS visibility_rules,
  ma.status,
  ma.start_at,
  ma.end_at,
  ma.created_by_profile_id AS created_by,
  ma.created_at,
  ma.updated_at
FROM public.marketing_assets ma;

CREATE VIEW public.banner_metrics AS
SELECT
  mm.id,
  mm.asset_id AS banner_id,
  mm.viewer_profile_id AS viewer_id,
  mm.event,
  mm.created_at
FROM public.marketing_metrics mm;

CREATE VIEW public.notifications AS
SELECT
  ne.id,
  ne.target_profile_id AS user_id,
  ne.title,
  ne.body,
  ne.metadata->>'url' AS url,
  ne.channels,
  ne.status,
  ne.read_at,
  ne.sent_at,
  ne.created_at
FROM public.notification_events ne;

CREATE VIEW public.user_wallets AS
SELECT
  pw.id,
  pw.profile_id AS user_id,
  pw.balance,
  pw.currency,
  pw.created_at,
  pw.updated_at
FROM public.profile_wallets pw;

CREATE VIEW public.wallet_transactions AS
SELECT
  we.id,
  we.wallet_id,
  we.profile_id AS user_id,
  UPPER(we.entry_type) AS type,
  we.amount,
  we.description,
  we.reference_id,
  UPPER(we.status) AS status,
  we.created_at,
  we.updated_at
FROM public.wallet_entries we;

CREATE VIEW public.payment_transactions AS
SELECT
  po.id,
  po.profile_id AS user_id,
  po.amount,
  po.currency,
  po.metadata->>'payment_method' AS payment_method,
  po.provider AS gateway,
  po.provider_transaction_id AS gateway_transaction_id,
  po.metadata->>'gateway_payment_intent_id' AS gateway_payment_intent_id,
  po.status,
  po.metadata->>'transaction_type' AS transaction_type,
  NULLIF(po.metadata->>'reference_id','')::uuid AS reference_id,
  po.metadata AS metadata,
  po.metadata->>'error_message' AS error_message,
  COALESCE((po.metadata->>'test_mode')::boolean, false) AS test_mode,
  po.requested_at AS created_at,
  po.updated_at,
  po.processed_at AS completed_at
FROM public.payment_operations po
WHERE po.operation_type = 'gateway_charge';

CREATE VIEW public.wallet_topup_requests AS
SELECT
  po.id,
  po.profile_id AS user_id,
  po.amount,
  po.currency,
  po.metadata->>'payment_method' AS payment_method,
  po.provider AS gateway,
  po.provider_transaction_id AS gateway_transaction_id,
  po.status,
  (po.metadata->>'validated_by')::uuid AS validated_by,
  (po.metadata->>'validated_at')::timestamptz AS validated_at,
  po.metadata->>'admin_notes' AS admin_notes,
  po.metadata->>'rejected_reason' AS rejected_reason,
  po.metadata->>'receipt_file_url' AS receipt_file_url,
  po.metadata->>'receipt_file_name' AS receipt_file_name,
  (po.metadata->>'payment_transaction_id')::uuid AS payment_transaction_id,
  po.created_at,
  po.updated_at
FROM public.payment_operations po
WHERE po.operation_type = 'topup_request';

CREATE VIEW public.support_cases AS
SELECT
  st.id,
  st.subject,
  st.topic,
  st.issue,
  st.status,
  st.priority,
  st.created_by_profile_id AS created_by,
  st.assigned_to_profile_id AS assigned_to,
  st.context->>'description' AS description,
  st.created_at,
  st.updated_at
FROM public.support_threads st;

CREATE VIEW public.support_case_replies AS
SELECT
  sm.id,
  sm.thread_id AS case_id,
  sm.author_profile_id AS user_id,
  sm.body AS message,
  (sm.message_type = 'internal') AS is_internal_note,
  sm.created_at,
  sm.updated_at
FROM public.support_messages sm;

-- -----------------------------------------------------------------------------
-- Attach INSTEAD OF triggers to the compatibility views
-- -----------------------------------------------------------------------------

CREATE TRIGGER trg_feedback_history_view_upsert
INSTEAD OF INSERT OR UPDATE ON public.feedback_history
FOR EACH ROW EXECUTE FUNCTION public.sync_feedback_history_to_lead_events();

CREATE TRIGGER trg_feedback_history_view_delete
INSTEAD OF DELETE ON public.feedback_history
FOR EACH ROW EXECUTE FUNCTION public.remove_lead_event();

CREATE TRIGGER trg_case_feedback_view_upsert
INSTEAD OF INSERT OR UPDATE ON public.case_feedback
FOR EACH ROW EXECUTE FUNCTION public.sync_case_feedback_to_lead_events();

CREATE TRIGGER trg_case_feedback_view_delete
INSTEAD OF DELETE ON public.case_feedback
FOR EACH ROW EXECUTE FUNCTION public.remove_lead_event();

CREATE TRIGGER trg_lead_activities_view_upsert
INSTEAD OF INSERT OR UPDATE ON public.lead_activities
FOR EACH ROW EXECUTE FUNCTION public.sync_lead_activities_to_lead_events();

CREATE TRIGGER trg_lead_activities_view_delete
INSTEAD OF DELETE ON public.lead_activities
FOR EACH ROW EXECUTE FUNCTION public.remove_lead_event();

CREATE TRIGGER trg_lead_reminders_view_upsert
INSTEAD OF INSERT OR UPDATE ON public.lead_reminders
FOR EACH ROW EXECUTE FUNCTION public.sync_lead_reminders_to_lead_tasks();

CREATE TRIGGER trg_lead_reminders_view_delete
INSTEAD OF DELETE ON public.lead_reminders
FOR EACH ROW EXECUTE FUNCTION public.remove_lead_task();

CREATE TRIGGER trg_case_actions_view_upsert
INSTEAD OF INSERT OR UPDATE ON public.case_actions
FOR EACH ROW EXECUTE FUNCTION public.sync_case_actions_to_lead_tasks();

CREATE TRIGGER trg_case_actions_view_delete
INSTEAD OF DELETE ON public.case_actions
FOR EACH ROW EXECUTE FUNCTION public.remove_lead_task();

CREATE TRIGGER trg_case_faces_view_upsert
INSTEAD OF INSERT OR UPDATE ON public.case_faces
FOR EACH ROW EXECUTE FUNCTION public.sync_case_faces_to_lead_transfers();

CREATE TRIGGER trg_case_faces_view_delete
INSTEAD OF DELETE ON public.case_faces
FOR EACH ROW EXECUTE FUNCTION public.remove_lead_transfer();

CREATE TRIGGER trg_inventory_matches_view_upsert
INSTEAD OF INSERT OR UPDATE ON public.inventory_matches
FOR EACH ROW EXECUTE FUNCTION public.sync_inventory_matches_to_lead_recommendations();

CREATE TRIGGER trg_inventory_matches_view_delete
INSTEAD OF DELETE ON public.inventory_matches
FOR EACH ROW EXECUTE FUNCTION public.remove_lead_recommendation();

CREATE TRIGGER trg_lead_tags_view_upsert
INSTEAD OF INSERT OR UPDATE ON public.lead_tags
FOR EACH ROW EXECUTE FUNCTION public.sync_lead_tags_to_lead_labels();

CREATE TRIGGER trg_lead_tags_view_delete
INSTEAD OF DELETE ON public.lead_tags
FOR EACH ROW EXECUTE FUNCTION public.remove_lead_label();

CREATE TRIGGER trg_lead_requests_view_upsert
INSTEAD OF INSERT OR UPDATE ON public.lead_requests
FOR EACH ROW EXECUTE FUNCTION public.sync_lead_requests_to_lead_commerce();

CREATE TRIGGER trg_lead_requests_view_delete
INSTEAD OF DELETE ON public.lead_requests
FOR EACH ROW EXECUTE FUNCTION public.remove_lead_commerce();

CREATE TRIGGER trg_purchase_requests_view_upsert
INSTEAD OF INSERT OR UPDATE ON public.purchase_requests
FOR EACH ROW EXECUTE FUNCTION public.sync_purchase_requests_to_lead_commerce();

CREATE TRIGGER trg_purchase_requests_view_delete
INSTEAD OF DELETE ON public.purchase_requests
FOR EACH ROW EXECUTE FUNCTION public.remove_lead_commerce();

CREATE TRIGGER trg_dashboard_banners_view_upsert
INSTEAD OF INSERT OR UPDATE ON public.dashboard_banners
FOR EACH ROW EXECUTE FUNCTION public.sync_dashboard_banners_to_marketing_assets();

CREATE TRIGGER trg_dashboard_banners_view_delete
INSTEAD OF DELETE ON public.dashboard_banners
FOR EACH ROW EXECUTE FUNCTION public.remove_marketing_asset();

CREATE TRIGGER trg_banner_metrics_view_upsert
INSTEAD OF INSERT OR UPDATE ON public.banner_metrics
FOR EACH ROW EXECUTE FUNCTION public.sync_banner_metrics_to_marketing_metrics();

CREATE TRIGGER trg_banner_metrics_view_delete
INSTEAD OF DELETE ON public.banner_metrics
FOR EACH ROW EXECUTE FUNCTION public.remove_marketing_metric();

CREATE TRIGGER trg_notifications_view_upsert
INSTEAD OF INSERT OR UPDATE ON public.notifications
FOR EACH ROW EXECUTE FUNCTION public.sync_notifications_to_notification_events();

CREATE TRIGGER trg_notifications_view_delete
INSTEAD OF DELETE ON public.notifications
FOR EACH ROW EXECUTE FUNCTION public.remove_notification_event();

CREATE TRIGGER trg_user_wallets_view_upsert
INSTEAD OF INSERT OR UPDATE ON public.user_wallets
FOR EACH ROW EXECUTE FUNCTION public.sync_user_wallets_to_profile_wallets();

CREATE TRIGGER trg_user_wallets_view_delete
INSTEAD OF DELETE ON public.user_wallets
FOR EACH ROW EXECUTE FUNCTION public.remove_profile_wallet();

CREATE TRIGGER trg_wallet_transactions_view_upsert
INSTEAD OF INSERT OR UPDATE ON public.wallet_transactions
FOR EACH ROW EXECUTE FUNCTION public.sync_wallet_transactions_to_wallet_entries();

CREATE TRIGGER trg_wallet_transactions_view_delete
INSTEAD OF DELETE ON public.wallet_transactions
FOR EACH ROW EXECUTE FUNCTION public.remove_wallet_entry();

CREATE TRIGGER trg_payment_transactions_view_upsert
INSTEAD OF INSERT OR UPDATE ON public.payment_transactions
FOR EACH ROW EXECUTE FUNCTION public.sync_payment_transactions_to_payment_operations();

CREATE TRIGGER trg_payment_transactions_view_delete
INSTEAD OF DELETE ON public.payment_transactions
FOR EACH ROW EXECUTE FUNCTION public.remove_payment_operation();

CREATE TRIGGER trg_wallet_topup_requests_view_upsert
INSTEAD OF INSERT OR UPDATE ON public.wallet_topup_requests
FOR EACH ROW EXECUTE FUNCTION public.sync_wallet_topup_requests_to_payment_operations();

CREATE TRIGGER trg_wallet_topup_requests_view_delete
INSTEAD OF DELETE ON public.wallet_topup_requests
FOR EACH ROW EXECUTE FUNCTION public.remove_payment_operation();

CREATE TRIGGER trg_support_cases_view_upsert
INSTEAD OF INSERT OR UPDATE ON public.support_cases
FOR EACH ROW EXECUTE FUNCTION public.sync_support_cases_to_support_threads();

CREATE TRIGGER trg_support_cases_view_delete
INSTEAD OF DELETE ON public.support_cases
FOR EACH ROW EXECUTE FUNCTION public.remove_support_thread();

CREATE TRIGGER trg_support_case_replies_view_upsert
INSTEAD OF INSERT OR UPDATE ON public.support_case_replies
FOR EACH ROW EXECUTE FUNCTION public.sync_support_case_replies_to_support_messages();

CREATE TRIGGER trg_support_case_replies_view_delete
INSTEAD OF DELETE ON public.support_case_replies
FOR EACH ROW EXECUTE FUNCTION public.remove_support_message();

COMMIT;
