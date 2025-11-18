-- ============================================
-- PHASE 1: CREATE COMPATIBILITY VIEWS AND CLEANUP
-- Create views for backward compatibility and drop old tables
-- ============================================

BEGIN;

-- ============================================
-- Step 1: Create compatibility views
-- ============================================

-- Activities view
CREATE OR REPLACE VIEW public.activities AS
SELECT
  e.id,
  e.event_category AS activity_type,
  e.actor_profile_id,
  e.assignee_profile_id,
  e.ai_coach,
  e.body,
  e.completed_at,
  e.created_at,
  e.due_at,
  e.activity_type AS event_type,
  e.filters,
  e.from_profile_id,
  e.label,
  e.label_color,
  e.lead_id,
  e.message_type,
  e.payload,
  e.reason,
  e.recommendation,
  e.result_count,
  e.stage,
  e.summary,
  e.support_issue,
  e.support_priority,
  e.support_status,
  e.support_subject,
  e.support_topic,
  e.task_status,
  e.task_type,
  e.thread_id,
  e.to_profile_id,
  e.top_units,
  e.updated_at,
  e.attachments
FROM public.events e
WHERE e.event_type = 'activity';

COMMENT ON VIEW public.activities IS 'Compatibility view - backed by events table';

-- Notifications view
CREATE OR REPLACE VIEW public.notifications AS
SELECT
  e.id,
  e.target_profile_id,
  e.title,
  e.body,
  e.notification_url AS url,
  e.notification_channels AS channels,
  e.notification_status AS status,
  e.read_at,
  e.sent_at,
  e.context_type AS context,
  e.context_id,
  e.metadata,
  e.created_at,
  e.updated_at
FROM public.events e
WHERE e.event_type = 'notification';

COMMENT ON VIEW public.notifications IS 'Compatibility view - backed by events table';

-- System logs view
CREATE OR REPLACE VIEW public.system_logs AS
SELECT
  e.id,
  CASE 
    WHEN e.event_type = 'audit' THEN 'audit'
    WHEN e.event_type = 'error' THEN 'error'
    WHEN e.event_type = 'metric' THEN 'content_metric'
    ELSE 'system'
  END AS log_type,
  e.actor_profile_id,
  e.action,
  e.entity_type,
  e.entity_id,
  e.details,
  e.ip_address,
  e.user_agent,
  e.created_at
FROM public.events e
WHERE e.event_type IN ('audit', 'system', 'error', 'metric');

COMMENT ON VIEW public.system_logs IS 'Compatibility view - backed by events table';

-- ============================================
-- Step 2: Create triggers for view compatibility
-- ============================================

-- Activities view trigger function
CREATE OR REPLACE FUNCTION public.sync_activities_to_events()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    INSERT INTO public.events (
      event_type,
      event_category,
      actor_profile_id,
      assignee_profile_id,
      lead_id,
      summary,
      body,
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
      payload,
      created_at,
      updated_at
    ) VALUES (
      'activity',
      NEW.activity_type,
      NEW.actor_profile_id,
      NEW.assignee_profile_id,
      NEW.lead_id,
      NEW.summary,
      NEW.body,
      NEW.activity_type,
      NEW.task_type,
      NEW.task_status,
      NEW.stage,
      NEW.due_at,
      NEW.completed_at,
      NEW.ai_coach,
      NEW.support_subject,
      NEW.support_topic,
      NEW.support_status,
      NEW.support_priority,
      NEW.support_issue,
      NEW.thread_id,
      NEW.message_type,
      NEW.attachments,
      NEW.from_profile_id,
      NEW.to_profile_id,
      NEW.reason,
      NEW.label,
      NEW.label_color,
      NEW.filters,
      NEW.top_units,
      NEW.recommendation,
      NEW.result_count,
      COALESCE(NEW.payload, '{}'::jsonb),
      COALESCE(NEW.created_at, now()),
      COALESCE(NEW.updated_at, now())
    ) RETURNING id INTO NEW.id;
    RETURN NEW;
  ELSIF TG_OP = 'UPDATE' THEN
    UPDATE public.events SET
      actor_profile_id = NEW.actor_profile_id,
      assignee_profile_id = NEW.assignee_profile_id,
      lead_id = NEW.lead_id,
      summary = NEW.summary,
      body = NEW.body,
      task_type = NEW.task_type,
      task_status = NEW.task_status,
      stage = NEW.stage,
      due_at = NEW.due_at,
      completed_at = NEW.completed_at,
      updated_at = now()
    WHERE id = NEW.id AND event_type = 'activity';
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    DELETE FROM public.events WHERE id = OLD.id AND event_type = 'activity';
    RETURN OLD;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_activities_sync
INSTEAD OF INSERT OR UPDATE OR DELETE ON public.activities
FOR EACH ROW EXECUTE FUNCTION public.sync_activities_to_events();

-- Notifications view trigger function
CREATE OR REPLACE FUNCTION public.sync_notifications_to_events()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    INSERT INTO public.events (
      event_type,
      event_category,
      target_profile_id,
      title,
      body,
      notification_url,
      notification_channels,
      notification_status,
      context_type,
      context_id,
      metadata,
      created_at,
      updated_at
    ) VALUES (
      'notification',
      'user_notification',
      NEW.target_profile_id,
      NEW.title,
      NEW.body,
      NEW.url,
      COALESCE(NEW.channels, ARRAY['inapp']::TEXT[]),
      COALESCE(NEW.status, 'pending'),
      NEW.context,
      NEW.context_id,
      COALESCE(NEW.metadata, '{}'::jsonb),
      COALESCE(NEW.created_at, now()),
      COALESCE(NEW.updated_at, now())
    ) RETURNING id INTO NEW.id;
    RETURN NEW;
  ELSIF TG_OP = 'UPDATE' THEN
    UPDATE public.events SET
      title = NEW.title,
      body = NEW.body,
      notification_url = NEW.url,
      notification_channels = NEW.channels,
      notification_status = NEW.status,
      read_at = NEW.read_at,
      sent_at = NEW.sent_at,
      updated_at = now()
    WHERE id = NEW.id AND event_type = 'notification';
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    DELETE FROM public.events WHERE id = OLD.id AND event_type = 'notification';
    RETURN OLD;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_notifications_sync
INSTEAD OF INSERT OR UPDATE OR DELETE ON public.notifications
FOR EACH ROW EXECUTE FUNCTION public.sync_notifications_to_events();

-- System logs view trigger function
CREATE OR REPLACE FUNCTION public.sync_system_logs_to_events()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    INSERT INTO public.events (
      event_type,
      event_category,
      actor_profile_id,
      action,
      entity_type,
      entity_id,
      details,
      ip_address,
      user_agent,
      created_at
    ) VALUES (
      CASE 
        WHEN NEW.log_type = 'audit' THEN 'audit'
        WHEN NEW.log_type = 'error' THEN 'error'
        WHEN NEW.log_type = 'content_metric' THEN 'metric'
        ELSE 'system'
      END,
      NEW.log_type,
      NEW.actor_profile_id,
      NEW.action,
      NEW.entity_type,
      NEW.entity_id,
      COALESCE(NEW.details, '{}'::jsonb),
      NEW.ip_address,
      NEW.user_agent,
      COALESCE(NEW.created_at, now())
    ) RETURNING id INTO NEW.id;
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    DELETE FROM public.events WHERE id = OLD.id AND event_type IN ('audit', 'system', 'error', 'metric');
    RETURN OLD;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_system_logs_sync
INSTEAD OF INSERT OR DELETE ON public.system_logs
FOR EACH ROW EXECUTE FUNCTION public.sync_system_logs_to_events();

-- ============================================
-- Step 3: Create helper functions
-- ============================================

-- Get unread notification count
CREATE OR REPLACE FUNCTION public.get_unread_notification_count(p_profile_id UUID)
RETURNS INTEGER AS $$
BEGIN
  RETURN (
    SELECT COUNT(*)::INTEGER
    FROM public.events
    WHERE event_type = 'notification'
      AND target_profile_id = p_profile_id
      AND notification_status != 'read'
  );
END;
$$ LANGUAGE plpgsql;

-- Mark notification as read
CREATE OR REPLACE FUNCTION public.mark_notification_read(p_notification_id UUID, p_profile_id UUID)
RETURNS BOOLEAN AS $$
DECLARE
  v_updated BOOLEAN := FALSE;
BEGIN
  UPDATE public.events
  SET 
    notification_status = 'read',
    read_at = now(),
    updated_at = now()
  WHERE id = p_notification_id
    AND event_type = 'notification'
    AND target_profile_id = p_profile_id
    AND notification_status != 'read';
  
  GET DIAGNOSTICS v_updated = FOUND;
  RETURN v_updated;
END;
$$ LANGUAGE plpgsql;

-- Get user timeline
CREATE OR REPLACE FUNCTION public.get_user_timeline(
  p_profile_id UUID,
  p_limit INTEGER DEFAULT 50,
  p_offset INTEGER DEFAULT 0
)
RETURNS TABLE (
  id UUID,
  event_type TEXT,
  title TEXT,
  body TEXT,
  url TEXT,
  is_read BOOLEAN,
  created_at TIMESTAMPTZ
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    e.id,
    e.event_type,
    COALESCE(e.title, e.summary) AS title,
    e.body,
    e.notification_url AS url,
    (e.notification_status = 'read') AS is_read,
    e.created_at
  FROM public.events e
  WHERE 
    e.target_profile_id = p_profile_id OR
    e.profile_id = p_profile_id OR
    e.actor_profile_id = p_profile_id
  ORDER BY e.created_at DESC
  LIMIT p_limit
  OFFSET p_offset;
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- Step 4: Drop old tables
-- ============================================

DO $$
BEGIN
  -- Drop activities table if it's a BASE TABLE
  IF EXISTS (
    SELECT 1 FROM information_schema.tables 
    WHERE table_schema = 'public' AND table_name = 'activities'
    AND table_type = 'BASE TABLE'
  ) THEN
    DROP TABLE public.activities CASCADE;
    RAISE NOTICE '✅ Dropped activities table';
  END IF;
  
  -- Drop notifications table if it's a BASE TABLE
  IF EXISTS (
    SELECT 1 FROM information_schema.tables 
    WHERE table_schema = 'public' AND table_name = 'notifications'
    AND table_type = 'BASE TABLE'
  ) THEN
    DROP TABLE public.notifications CASCADE;
    RAISE NOTICE '✅ Dropped notifications table';
  END IF;
  
  -- Drop system_logs table if it's a BASE TABLE
  IF EXISTS (
    SELECT 1 FROM information_schema.tables 
    WHERE table_schema = 'public' AND table_name = 'system_logs'
    AND table_type = 'BASE TABLE'
  ) THEN
    DROP TABLE public.system_logs CASCADE;
    RAISE NOTICE '✅ Dropped system_logs table';
  END IF;
END $$;

COMMIT;

-- ============================================
-- Verification
-- ============================================

DO $$
DECLARE
  v_table_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO v_table_count 
  FROM information_schema.tables 
  WHERE table_schema = 'public' AND table_type = 'BASE TABLE';
  
  RAISE NOTICE '========================================';
  RAISE NOTICE '✅ Phase 1 COMPLETE: Events consolidation';
  RAISE NOTICE '========================================';
  RAISE NOTICE 'Consolidated: activities + notifications + system_logs → events';
  RAISE NOTICE 'Views created: 3 (activities, notifications, system_logs)';
  RAISE NOTICE 'Helper functions: 3 created';
  RAISE NOTICE 'Current table count: %', v_table_count;
  RAISE NOTICE '';
  RAISE NOTICE 'Next: Run Phase 2 migrations for transactions consolidation';
  RAISE NOTICE '========================================';
END $$;

