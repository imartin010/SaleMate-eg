BEGIN;

-- -----------------------------------------------------------------------------
-- Helper functions for deleting mirrored rows
-- -----------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION public.remove_lead_event()
RETURNS trigger AS $$
BEGIN
  DELETE FROM public.lead_events WHERE id = OLD.id;
  RETURN OLD;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION public.remove_lead_task()
RETURNS trigger AS $$
BEGIN
  DELETE FROM public.lead_tasks WHERE id = OLD.id;
  RETURN OLD;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION public.remove_lead_transfer()
RETURNS trigger AS $$
BEGIN
  DELETE FROM public.lead_transfers WHERE id = OLD.id;
  RETURN OLD;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION public.remove_lead_recommendation()
RETURNS trigger AS $$
BEGIN
  DELETE FROM public.lead_recommendations WHERE id = OLD.id;
  RETURN OLD;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION public.remove_lead_commerce()
RETURNS trigger AS $$
BEGIN
  DELETE FROM public.lead_commerce WHERE id = OLD.id;
  RETURN OLD;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION public.remove_marketing_asset()
RETURNS trigger AS $$
BEGIN
  DELETE FROM public.marketing_assets WHERE id = OLD.id;
  RETURN OLD;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION public.remove_marketing_metric()
RETURNS trigger AS $$
BEGIN
  DELETE FROM public.marketing_metrics WHERE id = OLD.id;
  RETURN OLD;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION public.remove_notification_event()
RETURNS trigger AS $$
BEGIN
  DELETE FROM public.notification_events WHERE id = OLD.id;
  RETURN OLD;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION public.remove_support_thread()
RETURNS trigger AS $$
BEGIN
  DELETE FROM public.support_threads WHERE id = OLD.id;
  RETURN OLD;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION public.remove_support_message()
RETURNS trigger AS $$
BEGIN
  DELETE FROM public.support_messages WHERE id = OLD.id;
  RETURN OLD;
END;
$$ LANGUAGE plpgsql;

-- -----------------------------------------------------------------------------
-- Lead events sync (feedback_history, case_feedback, lead_activities)
-- -----------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION public.sync_feedback_history_to_lead_events()
RETURNS trigger AS $$
DECLARE
  v_payload jsonb;
BEGIN
  v_payload := jsonb_build_object(
    'source', 'feedback_history',
    'feedback_text', NEW.feedback_text,
    'updated_at', NEW.updated_at
  );

  INSERT INTO public.lead_events (id, lead_id, actor_profile_id, event_type, stage, summary, payload, created_at)
  VALUES (
    NEW.id,
    NEW.lead_id,
    NEW.user_id,
    'feedback',
    NULL,
    NEW.feedback_text,
    v_payload,
    COALESCE(NEW.created_at, now())
  )
  ON CONFLICT (id) DO UPDATE
    SET lead_id = EXCLUDED.lead_id,
        actor_profile_id = EXCLUDED.actor_profile_id,
        event_type = EXCLUDED.event_type,
        stage = EXCLUDED.stage,
        summary = EXCLUDED.summary,
        payload = EXCLUDED.payload,
        created_at = EXCLUDED.created_at;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_feedback_history_sync
AFTER INSERT OR UPDATE ON public.feedback_history
FOR EACH ROW EXECUTE FUNCTION public.sync_feedback_history_to_lead_events();

CREATE TRIGGER trg_feedback_history_delete
AFTER DELETE ON public.feedback_history
FOR EACH ROW EXECUTE FUNCTION public.remove_lead_event();

CREATE OR REPLACE FUNCTION public.sync_case_feedback_to_lead_events()
RETURNS trigger AS $$
DECLARE
  v_payload jsonb;
BEGIN
  v_payload := jsonb_build_object(
    'source', 'case_feedback',
    'ai_coach', NEW.ai_coach
  );

  INSERT INTO public.lead_events (id, lead_id, actor_profile_id, event_type, stage, summary, payload, created_at)
  VALUES (
    NEW.id,
    NEW.lead_id,
    NEW.created_by,
    'feedback',
    NEW.stage,
    NEW.feedback,
    v_payload,
    COALESCE(NEW.created_at, now())
  )
  ON CONFLICT (id) DO UPDATE
    SET lead_id = EXCLUDED.lead_id,
        actor_profile_id = EXCLUDED.actor_profile_id,
        event_type = EXCLUDED.event_type,
        stage = EXCLUDED.stage,
        summary = EXCLUDED.summary,
        payload = EXCLUDED.payload,
        created_at = EXCLUDED.created_at;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_case_feedback_sync
AFTER INSERT OR UPDATE ON public.case_feedback
FOR EACH ROW EXECUTE FUNCTION public.sync_case_feedback_to_lead_events();

CREATE TRIGGER trg_case_feedback_delete
AFTER DELETE ON public.case_feedback
FOR EACH ROW EXECUTE FUNCTION public.remove_lead_event();

CREATE OR REPLACE FUNCTION public.sync_lead_activities_to_lead_events()
RETURNS trigger AS $$
DECLARE
  v_event_type text;
  v_stage text;
  v_payload jsonb;
BEGIN
  v_event_type := CASE NEW.activity_type
    WHEN 'stage_changed' THEN 'stage_change'
    WHEN 'feedback_added' THEN 'feedback'
    WHEN 'note_added' THEN 'note'
    ELSE 'activity'
  END;

  v_stage := COALESCE(NEW.activity_data->>'new_stage', NEW.activity_data->>'stage');

  v_payload := jsonb_build_object(
    'source', 'lead_activities',
    'activity_type', NEW.activity_type,
    'activity_data', NEW.activity_data
  );

  INSERT INTO public.lead_events (id, lead_id, actor_profile_id, event_type, stage, summary, payload, created_at)
  VALUES (
    NEW.id,
    NEW.lead_id,
    NEW.user_id,
    v_event_type,
    v_stage,
    NEW.description,
    v_payload,
    COALESCE(NEW.created_at, now())
  )
  ON CONFLICT (id) DO UPDATE
    SET lead_id = EXCLUDED.lead_id,
        actor_profile_id = EXCLUDED.actor_profile_id,
        event_type = EXCLUDED.event_type,
        stage = EXCLUDED.stage,
        summary = EXCLUDED.summary,
        payload = EXCLUDED.payload,
        created_at = EXCLUDED.created_at;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_lead_activities_sync
AFTER INSERT OR UPDATE ON public.lead_activities
FOR EACH ROW EXECUTE FUNCTION public.sync_lead_activities_to_lead_events();

CREATE TRIGGER trg_lead_activities_delete
AFTER DELETE ON public.lead_activities
FOR EACH ROW EXECUTE FUNCTION public.remove_lead_event();

-- -----------------------------------------------------------------------------
-- Lead tasks sync (lead_reminders, case_actions)
-- -----------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION public.sync_lead_reminders_to_lead_tasks()
RETURNS trigger AS $$
DECLARE
  v_status text;
  v_payload jsonb;
BEGIN
  v_status := CASE WHEN NEW.is_completed THEN 'completed' ELSE 'pending' END;
  v_payload := jsonb_build_object(
    'source', 'lead_reminders',
    'reminder_text', NEW.reminder_text
  );

  INSERT INTO public.lead_tasks (id, lead_id, created_by_profile_id, assignee_profile_id, task_type, status, due_at, completed_at, payload, created_at, updated_at)
  VALUES (
    NEW.id,
    NEW.lead_id,
    NEW.user_id,
    NEW.user_id,
    'follow_up',
    v_status,
    NEW.reminder_date,
    CASE WHEN NEW.is_completed THEN NEW.completed_at END,
    v_payload,
    COALESCE(NEW.created_at, now()),
    COALESCE(NEW.updated_at, NEW.created_at, now())
  )
  ON CONFLICT (id) DO UPDATE
    SET lead_id = EXCLUDED.lead_id,
        created_by_profile_id = EXCLUDED.created_by_profile_id,
        assignee_profile_id = EXCLUDED.assignee_profile_id,
        task_type = EXCLUDED.task_type,
        status = EXCLUDED.status,
        due_at = EXCLUDED.due_at,
        completed_at = EXCLUDED.completed_at,
        payload = EXCLUDED.payload,
        created_at = EXCLUDED.created_at,
        updated_at = EXCLUDED.updated_at;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_lead_reminders_sync
AFTER INSERT OR UPDATE ON public.lead_reminders
FOR EACH ROW EXECUTE FUNCTION public.sync_lead_reminders_to_lead_tasks();

CREATE TRIGGER trg_lead_reminders_delete
AFTER DELETE ON public.lead_reminders
FOR EACH ROW EXECUTE FUNCTION public.remove_lead_task();

CREATE OR REPLACE FUNCTION public.sync_case_actions_to_lead_tasks()
RETURNS trigger AS $$
DECLARE
  v_task_type text;
  v_status text;
  v_payload jsonb;
BEGIN
  v_task_type := CASE
    WHEN lower(NEW.action_type) IN ('call','call_now') THEN 'call'
    WHEN lower(NEW.action_type) IN ('meeting','push_meeting','remind_meeting') THEN 'meeting'
    WHEN lower(NEW.action_type) = 'document' THEN 'document'
    ELSE 'custom'
  END;

  v_status := CASE
    WHEN upper(NEW.status) IN ('COMPLETED','DONE') THEN 'completed'
    WHEN upper(NEW.status) IN ('CANCELLED','CANCELED','SKIPPED') THEN 'cancelled'
    WHEN upper(NEW.status) = 'IN_PROGRESS' THEN 'in_progress'
    ELSE 'pending'
  END;

  v_payload := jsonb_build_object(
    'source', 'case_actions',
    'action_type', NEW.action_type,
    'payload', NEW.payload,
    'notified_at', NEW.notified_at
  );

  INSERT INTO public.lead_tasks (id, lead_id, created_by_profile_id, assignee_profile_id, task_type, status, due_at, completed_at, payload, created_at, updated_at)
  VALUES (
    NEW.id,
    NEW.lead_id,
    NEW.created_by,
    NEW.created_by,
    v_task_type,
    v_status,
    NEW.due_at,
    NEW.completed_at,
    v_payload,
    COALESCE(NEW.created_at, now()),
    COALESCE(NEW.created_at, now())
  )
  ON CONFLICT (id) DO UPDATE
    SET lead_id = EXCLUDED.lead_id,
        created_by_profile_id = EXCLUDED.created_by_profile_id,
        assignee_profile_id = EXCLUDED.assignee_profile_id,
        task_type = EXCLUDED.task_type,
        status = EXCLUDED.status,
        due_at = EXCLUDED.due_at,
        completed_at = EXCLUDED.completed_at,
        payload = EXCLUDED.payload,
        created_at = EXCLUDED.created_at,
        updated_at = EXCLUDED.updated_at;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_case_actions_sync
AFTER INSERT OR UPDATE ON public.case_actions
FOR EACH ROW EXECUTE FUNCTION public.sync_case_actions_to_lead_tasks();

CREATE TRIGGER trg_case_actions_delete
AFTER DELETE ON public.case_actions
FOR EACH ROW EXECUTE FUNCTION public.remove_lead_task();

-- -----------------------------------------------------------------------------
-- Lead transfers & recommendations
-- -----------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION public.sync_case_faces_to_lead_transfers()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.lead_transfers (id, lead_id, from_profile_id, to_profile_id, reason, created_by_profile_id, created_at)
  VALUES (
    NEW.id,
    NEW.lead_id,
    NEW.from_agent,
    NEW.to_agent,
    NEW.reason,
    NEW.created_by,
    COALESCE(NEW.created_at, now())
  )
  ON CONFLICT (id) DO UPDATE
    SET lead_id = EXCLUDED.lead_id,
        from_profile_id = EXCLUDED.from_profile_id,
        to_profile_id = EXCLUDED.to_profile_id,
        reason = EXCLUDED.reason,
        created_by_profile_id = EXCLUDED.created_by_profile_id,
        created_at = EXCLUDED.created_at;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_case_faces_sync
AFTER INSERT OR UPDATE ON public.case_faces
FOR EACH ROW EXECUTE FUNCTION public.sync_case_faces_to_lead_transfers();

CREATE TRIGGER trg_case_faces_delete
AFTER DELETE ON public.case_faces
FOR EACH ROW EXECUTE FUNCTION public.remove_lead_transfer();

CREATE OR REPLACE FUNCTION public.sync_inventory_matches_to_lead_recommendations()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.lead_recommendations (id, lead_id, generated_by_profile_id, filters, top_units, recommendation, result_count, created_at)
  VALUES (
    NEW.id,
    NEW.lead_id,
    NEW.created_by,
    COALESCE(NEW.filters, '{}'::jsonb),
    NEW.top_units,
    NEW.recommendation,
    COALESCE(NEW.result_count, 0),
    COALESCE(NEW.created_at, now())
  )
  ON CONFLICT (id) DO UPDATE
    SET lead_id = EXCLUDED.lead_id,
        generated_by_profile_id = EXCLUDED.generated_by_profile_id,
        filters = EXCLUDED.filters,
        top_units = EXCLUDED.top_units,
        recommendation = EXCLUDED.recommendation,
        result_count = EXCLUDED.result_count,
        created_at = EXCLUDED.created_at;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_inventory_matches_sync
AFTER INSERT OR UPDATE ON public.inventory_matches
FOR EACH ROW EXECUTE FUNCTION public.sync_inventory_matches_to_lead_recommendations();

CREATE TRIGGER trg_inventory_matches_delete
AFTER DELETE ON public.inventory_matches
FOR EACH ROW EXECUTE FUNCTION public.remove_lead_recommendation();

-- -----------------------------------------------------------------------------
-- Lead commerce (lead_requests, purchase_requests)
-- -----------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION public.sync_lead_requests_to_lead_commerce()
RETURNS trigger AS $$
DECLARE
  v_metadata jsonb;
BEGIN
  v_metadata := jsonb_build_object(
    'source', 'lead_requests',
    'project_name', NEW.project_name
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

CREATE TRIGGER trg_lead_requests_sync
AFTER INSERT OR UPDATE ON public.lead_requests
FOR EACH ROW EXECUTE FUNCTION public.sync_lead_requests_to_lead_commerce();

CREATE TRIGGER trg_lead_requests_delete
AFTER DELETE ON public.lead_requests
FOR EACH ROW EXECUTE FUNCTION public.remove_lead_commerce();

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

CREATE TRIGGER trg_purchase_requests_sync
AFTER INSERT OR UPDATE ON public.purchase_requests
FOR EACH ROW EXECUTE FUNCTION public.sync_purchase_requests_to_lead_commerce();

CREATE TRIGGER trg_purchase_requests_delete
AFTER DELETE ON public.purchase_requests
FOR EACH ROW EXECUTE FUNCTION public.remove_lead_commerce();

-- -----------------------------------------------------------------------------
-- Marketing assets & metrics (dashboard_banners, banner_metrics)
-- -----------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION public.sync_dashboard_banners_to_marketing_assets()
RETURNS trigger AS $$
DECLARE
  v_audience jsonb;
  v_cta jsonb;
BEGIN
  v_cta := jsonb_build_object('cta_label', NEW.cta_label, 'cta_url', NEW.cta_url, 'image_url', NEW.image_url);
  v_audience := jsonb_build_object('audience', NEW.audience, 'visibility_rules', NEW.visibility_rules);

  INSERT INTO public.marketing_assets (id, title, body, cta, placement, audience, status, start_at, end_at, created_by_profile_id, created_at, updated_at)
  VALUES (
    NEW.id,
    NEW.title,
    NEW.subtitle,
    v_cta,
    NEW.placement,
    v_audience,
    NEW.status,
    NEW.start_at,
    NEW.end_at,
    NEW.created_by,
    COALESCE(NEW.created_at, now()),
    COALESCE(NEW.updated_at, now())
  )
  ON CONFLICT (id) DO UPDATE
    SET title = EXCLUDED.title,
        body = EXCLUDED.body,
        cta = EXCLUDED.cta,
        placement = EXCLUDED.placement,
        audience = EXCLUDED.audience,
        status = EXCLUDED.status,
        start_at = EXCLUDED.start_at,
        end_at = EXCLUDED.end_at,
        created_by_profile_id = EXCLUDED.created_by_profile_id,
        created_at = EXCLUDED.created_at,
        updated_at = EXCLUDED.updated_at;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_dashboard_banners_sync
AFTER INSERT OR UPDATE ON public.dashboard_banners
FOR EACH ROW EXECUTE FUNCTION public.sync_dashboard_banners_to_marketing_assets();

CREATE TRIGGER trg_dashboard_banners_delete
AFTER DELETE ON public.dashboard_banners
FOR EACH ROW EXECUTE FUNCTION public.remove_marketing_asset();

CREATE OR REPLACE FUNCTION public.sync_banner_metrics_to_marketing_metrics()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.marketing_metrics (id, asset_id, viewer_profile_id, event, created_at)
  VALUES (
    NEW.id,
    NEW.banner_id,
    NEW.viewer_id,
    NEW.event,
    COALESCE(NEW.created_at, now())
  )
  ON CONFLICT (id) DO UPDATE
    SET asset_id = EXCLUDED.asset_id,
        viewer_profile_id = EXCLUDED.viewer_profile_id,
        event = EXCLUDED.event,
        created_at = EXCLUDED.created_at;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_banner_metrics_sync
AFTER INSERT OR UPDATE ON public.banner_metrics
FOR EACH ROW EXECUTE FUNCTION public.sync_banner_metrics_to_marketing_metrics();

CREATE TRIGGER trg_banner_metrics_delete
AFTER DELETE ON public.banner_metrics
FOR EACH ROW EXECUTE FUNCTION public.remove_marketing_metric();

-- -----------------------------------------------------------------------------
-- Notifications sync
-- -----------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION public.sync_notifications_to_notification_events()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.notification_events (id, target_profile_id, context, context_id, title, body, channels, status, read_at, sent_at, metadata, created_at)
  VALUES (
    NEW.id,
    NEW.user_id,
    'system',
    NULL,
    NEW.title,
    NEW.body,
    COALESCE(NEW.channels, ARRAY['inapp']),
    NEW.status,
    NEW.read_at,
    NEW.sent_at,
    jsonb_build_object('source', 'notifications', 'url', NEW.url),
    COALESCE(NEW.created_at, now())
  )
  ON CONFLICT (id) DO UPDATE
    SET target_profile_id = EXCLUDED.target_profile_id,
        context = EXCLUDED.context,
        title = EXCLUDED.title,
        body = EXCLUDED.body,
        channels = EXCLUDED.channels,
        status = EXCLUDED.status,
        read_at = EXCLUDED.read_at,
        sent_at = EXCLUDED.sent_at,
        metadata = EXCLUDED.metadata,
        created_at = EXCLUDED.created_at;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_notifications_sync
AFTER INSERT OR UPDATE ON public.notifications
FOR EACH ROW EXECUTE FUNCTION public.sync_notifications_to_notification_events();

CREATE TRIGGER trg_notifications_delete
AFTER DELETE ON public.notifications
FOR EACH ROW EXECUTE FUNCTION public.remove_notification_event();

-- -----------------------------------------------------------------------------
-- Wallet & payments sync
-- -----------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION public.sync_user_wallets_to_profile_wallets()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.profile_wallets (id, profile_id, currency, balance, limits, created_at, updated_at)
  VALUES (
    NEW.id,
    NEW.user_id,
    NEW.currency,
    COALESCE(NEW.balance, 0),
    '{}'::jsonb,
    COALESCE(NEW.created_at, now()),
    COALESCE(NEW.updated_at, now())
  )
  ON CONFLICT (id) DO UPDATE
    SET profile_id = EXCLUDED.profile_id,
        currency = EXCLUDED.currency,
        balance = EXCLUDED.balance,
        limits = EXCLUDED.limits,
        created_at = EXCLUDED.created_at,
        updated_at = EXCLUDED.updated_at;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_user_wallets_sync
AFTER INSERT OR UPDATE ON public.user_wallets
FOR EACH ROW EXECUTE FUNCTION public.sync_user_wallets_to_profile_wallets();

CREATE TRIGGER trg_user_wallets_delete
AFTER DELETE ON public.user_wallets
FOR EACH ROW EXECUTE FUNCTION public.remove_lead_commerce();

-- Replace delete trigger for wallet removal with explicit delete from profile_wallets
CREATE OR REPLACE FUNCTION public.remove_profile_wallet()
RETURNS trigger AS $$
BEGIN
  DELETE FROM public.profile_wallets WHERE id = OLD.id;
  RETURN OLD;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_user_wallets_delete ON public.user_wallets;
CREATE TRIGGER trg_user_wallets_delete
AFTER DELETE ON public.user_wallets
FOR EACH ROW EXECUTE FUNCTION public.remove_profile_wallet();

CREATE OR REPLACE FUNCTION public.sync_wallet_transactions_to_wallet_entries()
RETURNS trigger AS $$
DECLARE
  v_metadata jsonb;
BEGIN
  v_metadata := jsonb_build_object(
    'source', 'wallet_transactions',
    'legacy_status', NEW.status
  );

  INSERT INTO public.wallet_entries (id, wallet_id, profile_id, entry_type, status, amount, description, reference_type, reference_id, metadata, created_at, updated_at)
  VALUES (
    NEW.id,
    NEW.wallet_id,
    NEW.user_id,
    LOWER(NEW.type),
    CASE
      WHEN NEW.status ILIKE 'pending' THEN 'pending'
      WHEN NEW.status ILIKE 'failed' THEN 'failed'
      WHEN NEW.status ILIKE 'cancel%' THEN 'cancelled'
      ELSE 'completed'
    END,
    NEW.amount,
    NEW.description,
    'legacy_wallet_transaction',
    NEW.reference_id,
    v_metadata,
    COALESCE(NEW.created_at, now()),
    COALESCE(NEW.updated_at, NEW.created_at, now())
  )
  ON CONFLICT (id) DO UPDATE
    SET wallet_id = EXCLUDED.wallet_id,
        profile_id = EXCLUDED.profile_id,
        entry_type = EXCLUDED.entry_type,
        status = EXCLUDED.status,
        amount = EXCLUDED.amount,
        description = EXCLUDED.description,
        reference_type = EXCLUDED.reference_type,
        reference_id = EXCLUDED.reference_id,
        metadata = EXCLUDED.metadata,
        created_at = EXCLUDED.created_at,
        updated_at = EXCLUDED.updated_at;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_wallet_transactions_sync
AFTER INSERT OR UPDATE ON public.wallet_transactions
FOR EACH ROW EXECUTE FUNCTION public.sync_wallet_transactions_to_wallet_entries();

CREATE OR REPLACE FUNCTION public.remove_wallet_entry()
RETURNS trigger AS $$
BEGIN
  DELETE FROM public.wallet_entries WHERE id = OLD.id;
  RETURN OLD;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_wallet_transactions_delete
AFTER DELETE ON public.wallet_transactions
FOR EACH ROW EXECUTE FUNCTION public.remove_wallet_entry();

CREATE OR REPLACE FUNCTION public.sync_payment_transactions_to_payment_operations()
RETURNS trigger AS $$
DECLARE
  v_metadata jsonb;
BEGIN
  v_metadata := jsonb_build_object(
    'transaction_type', NEW.transaction_type,
    'gateway_payment_intent_id', NEW.gateway_payment_intent_id,
    'reference_id', NEW.reference_id,
    'metadata', NEW.metadata,
    'error_message', NEW.error_message,
    'test_mode', NEW.test_mode
  );

  INSERT INTO public.payment_operations (id, profile_id, wallet_id, operation_type, provider, provider_transaction_id, status, amount, currency, metadata, requested_at, processed_at, created_at, updated_at)
  VALUES (
    NEW.id,
    NEW.user_id,
    NULL,
    'gateway_charge',
    NEW.gateway,
    COALESCE(NEW.gateway_transaction_id, NEW.gateway_payment_intent_id),
    CASE
      WHEN NEW.status ILIKE 'pending' THEN 'pending'
      WHEN NEW.status ILIKE 'processing' THEN 'processing'
      WHEN NEW.status ILIKE 'failed' THEN 'failed'
      WHEN NEW.status ILIKE 'cancel%' THEN 'cancelled'
      ELSE 'completed'
    END,
    NEW.amount,
    NEW.currency,
    v_metadata,
    COALESCE(NEW.created_at, now()),
    NEW.completed_at,
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

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_payment_transactions_sync
AFTER INSERT OR UPDATE ON public.payment_transactions
FOR EACH ROW EXECUTE FUNCTION public.sync_payment_transactions_to_payment_operations();

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

CREATE TRIGGER trg_wallet_topup_requests_sync
AFTER INSERT OR UPDATE ON public.wallet_topup_requests
FOR EACH ROW EXECUTE FUNCTION public.sync_wallet_topup_requests_to_payment_operations();

CREATE OR REPLACE FUNCTION public.remove_payment_operation()
RETURNS trigger AS $$
BEGIN
  DELETE FROM public.payment_operations WHERE id = OLD.id;
  RETURN OLD;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_payment_transactions_delete
AFTER DELETE ON public.payment_transactions
FOR EACH ROW EXECUTE FUNCTION public.remove_payment_operation();

CREATE TRIGGER trg_wallet_topup_requests_delete
AFTER DELETE ON public.wallet_topup_requests
FOR EACH ROW EXECUTE FUNCTION public.remove_payment_operation();

-- -----------------------------------------------------------------------------
-- Support threads/messages sync
-- -----------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION public.sync_support_cases_to_support_threads()
RETURNS trigger AS $$
DECLARE
  v_context jsonb;
BEGIN
  v_context := jsonb_build_object('description', NEW.description, 'legacy_priority', NEW.priority);

  INSERT INTO public.support_threads (id, subject, topic, issue, status, priority, created_by_profile_id, assigned_to_profile_id, context, created_at, updated_at)
  VALUES (
    NEW.id,
    NEW.subject,
    NEW.topic,
    NEW.issue,
    CASE
      WHEN NEW.status ILIKE 'closed' THEN 'closed'
      WHEN NEW.status ILIKE 'resolved' THEN 'solved'
      WHEN NEW.status ILIKE 'in_progress' THEN 'in_progress'
      ELSE 'open'
    END,
    COALESCE(NEW.priority, 'medium'),
    (SELECT id FROM public.profiles WHERE id = NEW.created_by),
    (SELECT id FROM public.profiles WHERE id = NEW.assigned_to),
    v_context,
    COALESCE(NEW.created_at, now()),
    COALESCE(NEW.updated_at, NEW.created_at, now())
  )
  ON CONFLICT (id) DO UPDATE
    SET subject = EXCLUDED.subject,
        topic = EXCLUDED.topic,
        issue = EXCLUDED.issue,
        status = EXCLUDED.status,
        priority = EXCLUDED.priority,
        created_by_profile_id = EXCLUDED.created_by_profile_id,
        assigned_to_profile_id = EXCLUDED.assigned_to_profile_id,
        context = EXCLUDED.context,
        created_at = EXCLUDED.created_at,
        updated_at = EXCLUDED.updated_at;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_support_cases_sync
AFTER INSERT OR UPDATE ON public.support_cases
FOR EACH ROW EXECUTE FUNCTION public.sync_support_cases_to_support_threads();

CREATE TRIGGER trg_support_cases_delete
AFTER DELETE ON public.support_cases
FOR EACH ROW EXECUTE FUNCTION public.remove_support_thread();

CREATE OR REPLACE FUNCTION public.sync_support_case_replies_to_support_messages()
RETURNS trigger AS $$
DECLARE
  v_message_type text;
BEGIN
  v_message_type := CASE WHEN NEW.is_internal_note THEN 'internal' ELSE 'user' END;

  INSERT INTO public.support_messages (id, thread_id, author_profile_id, message_type, body, attachments, created_at, updated_at)
  VALUES (
    NEW.id,
    NEW.case_id,
    (SELECT id FROM public.profiles WHERE id = NEW.user_id),
    v_message_type,
    NEW.message,
    '[]'::jsonb,
    COALESCE(NEW.created_at, now()),
    COALESCE(NEW.updated_at, NEW.created_at, now())
  )
  ON CONFLICT (id) DO UPDATE
    SET thread_id = EXCLUDED.thread_id,
        author_profile_id = EXCLUDED.author_profile_id,
        message_type = EXCLUDED.message_type,
        body = EXCLUDED.body,
        attachments = EXCLUDED.attachments,
        created_at = EXCLUDED.created_at,
        updated_at = EXCLUDED.updated_at;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_support_case_replies_sync
AFTER INSERT OR UPDATE ON public.support_case_replies
FOR EACH ROW EXECUTE FUNCTION public.sync_support_case_replies_to_support_messages();

CREATE TRIGGER trg_support_case_replies_delete
AFTER DELETE ON public.support_case_replies
FOR EACH ROW EXECUTE FUNCTION public.remove_support_message();

COMMIT;
