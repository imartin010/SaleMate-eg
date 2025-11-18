-- ============================================
-- PHASE 1: MIGRATE DATA TO EVENTS TABLE
-- Migrate: activities + notifications + system_logs → events
-- ============================================

BEGIN;

-- ============================================
-- Step 1: Migrate activities table
-- ============================================

INSERT INTO public.events (
  id,
  event_type,
  event_category,
  profile_id,
  lead_id,
  title,
  body,
  summary,
  activity_type,
  task_type,
  task_status,
  stage,
  due_at,
  completed_at,
  ai_coach,
  support_subject,
  support_topic,
  support_status,
  support_priority,
  support_issue,
  thread_id,
  message_type,
  attachments,
  from_profile_id,
  to_profile_id,
  reason,
  label,
  label_color,
  filters,
  top_units,
  recommendation,
  result_count,
  actor_profile_id,
  assignee_profile_id,
  metadata,
  payload,
  created_at,
  updated_at
)
SELECT 
  a.id,
  'activity' AS event_type,
  a.activity_type AS event_category,
  a.actor_profile_id AS profile_id,
  a.lead_id,
  a.support_subject AS title,
  a.body,
  a.summary,
  a.activity_type,
  a.task_type,
  a.task_status,
  a.stage,
  a.due_at,
  a.completed_at,
  a.ai_coach,
  a.support_subject,
  a.support_topic,
  a.support_status,
  a.support_priority,
  a.support_issue,
  a.thread_id,
  a.message_type,
  a.attachments,
  a.from_profile_id,
  a.to_profile_id,
  a.reason,
  a.label,
  a.label_color,
  a.filters,
  a.top_units,
  a.recommendation,
  a.result_count,
  a.actor_profile_id,
  a.assignee_profile_id,
  jsonb_build_object('source', 'activities') AS metadata,
  COALESCE(a.payload, '{}'::jsonb) AS payload,
  a.created_at,
  a.updated_at
FROM public.activities a
ON CONFLICT (id) DO NOTHING;

-- ============================================
-- Step 2: Migrate notifications table
-- ============================================

DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.tables 
    WHERE table_schema = 'public' AND table_name = 'notifications'
    AND table_type = 'BASE TABLE'
  ) THEN
    INSERT INTO public.events (
      id,
      event_type,
      event_category,
      target_profile_id,
      title,
      body,
      notification_url,
      notification_channels,
      notification_status,
      read_at,
      sent_at,
      context_type,
      context_id,
      metadata,
      created_at,
      updated_at
    )
    SELECT 
      n.id,
      'notification' AS event_type,
      'user_notification' AS event_category,
      n.target_profile_id,
      n.title,
      n.body,
      n.url AS notification_url,
      COALESCE(n.channels, ARRAY['inapp']::TEXT[]) AS notification_channels,
      n.status AS notification_status,
      n.read_at,
      n.sent_at,
      n.context AS context_type,
      n.context_id,
      jsonb_build_object('source', 'notifications') || COALESCE(n.metadata, '{}'::jsonb) AS metadata,
      n.created_at,
      COALESCE(n.updated_at, n.created_at) AS updated_at
    FROM public.notifications n
    ON CONFLICT (id) DO NOTHING;
    
    RAISE NOTICE '✅ Migrated notifications table';
  ELSE
    RAISE NOTICE 'ℹ️ notifications table does not exist or is already a view';
  END IF;
END $$;

-- ============================================
-- Step 3: Migrate system_logs table
-- ============================================

INSERT INTO public.events (
  id,
  event_type,
  event_category,
  profile_id,
  actor_profile_id,
  action,
  entity_type,
  entity_id,
  ip_address,
  user_agent,
  log_level,
  summary,
  details,
  metadata,
  created_at,
  updated_at
)
SELECT 
  sl.id,
  CASE 
    WHEN sl.log_type = 'audit' THEN 'audit'
    WHEN sl.log_type = 'error' THEN 'error'
    WHEN sl.log_type = 'content_metric' THEN 'metric'
    ELSE 'system'
  END AS event_type,
  sl.log_type AS event_category,
  sl.actor_profile_id AS profile_id,
  sl.actor_profile_id,
  sl.action,
  sl.entity_type,
  sl.entity_id,
  sl.ip_address,
  sl.user_agent,
  CASE
    WHEN sl.log_type = 'error' THEN 'error'
    WHEN sl.log_type = 'audit' THEN 'info'
    ELSE 'info'
  END AS log_level,
  sl.action AS summary,
  COALESCE(sl.details, '{}'::jsonb) AS details,
  jsonb_build_object('source', 'system_logs') || COALESCE(sl.details, '{}'::jsonb) AS metadata,
  sl.created_at,
  sl.created_at AS updated_at
FROM public.system_logs sl
ON CONFLICT (id) DO NOTHING;

-- ============================================
-- Step 4: Get migration statistics
-- ============================================

DO $$
DECLARE
  v_total_events INTEGER;
  v_activities INTEGER;
  v_notifications INTEGER;
  v_system_logs INTEGER;
BEGIN
  SELECT COUNT(*) INTO v_total_events FROM public.events;
  SELECT COUNT(*) INTO v_activities FROM public.events WHERE metadata->>'source' = 'activities';
  SELECT COUNT(*) INTO v_system_logs FROM public.events WHERE metadata->>'source' = 'system_logs';
  SELECT COUNT(*) INTO v_notifications FROM public.events WHERE metadata->>'source' = 'notifications';
  
  RAISE NOTICE '========================================';
  RAISE NOTICE '✅ Phase 1 Step 2: Data migration complete';
  RAISE NOTICE '========================================';
  RAISE NOTICE 'Total events: %', v_total_events;
  RAISE NOTICE '  - From activities: %', v_activities;
  RAISE NOTICE '  - From notifications: %', v_notifications;
  RAISE NOTICE '  - From system_logs: %', v_system_logs;
  RAISE NOTICE '';
  RAISE NOTICE 'Next step: Run migration 20241118100003 to create views';
  RAISE NOTICE '========================================';
END $$;

COMMIT;

