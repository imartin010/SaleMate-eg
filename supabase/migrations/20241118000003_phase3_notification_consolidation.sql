-- ============================================
-- PHASE 3: NOTIFICATION CONSOLIDATION
-- Merge notifications → activities
-- ============================================
-- This migration consolidates notifications into activities table
-- to create a unified event and notification stream
--
-- ⚠️ WARNING: This is the most complex consolidation
-- Requires dual-write period and careful cutover
-- Test thoroughly before deploying to production

BEGIN;

-- ============================================
-- Step 1: Enhance activities table for notifications
-- ============================================

-- Add notification-specific columns to activities
ALTER TABLE public.activities
  ADD COLUMN IF NOT EXISTS notification_title TEXT,
  ADD COLUMN IF NOT EXISTS notification_url TEXT,
  ADD COLUMN IF NOT EXISTS notification_channels TEXT[] DEFAULT ARRAY['inapp']::TEXT[],
  ADD COLUMN IF NOT EXISTS notification_status TEXT CHECK (notification_status IN ('pending', 'sent', 'read', 'failed', NULL)),
  ADD COLUMN IF NOT EXISTS read_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS sent_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS target_profile_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  ADD COLUMN IF NOT EXISTS context_type TEXT,
  ADD COLUMN IF NOT EXISTS context_id UUID;

-- Update activity_type constraint to include 'notification'
DO $$
BEGIN
  ALTER TABLE public.activities DROP CONSTRAINT IF EXISTS activities_activity_type_check;
  
  ALTER TABLE public.activities 
    ADD CONSTRAINT activities_activity_type_check 
    CHECK (activity_type IN ('event', 'task', 'feedback', 'transfer', 'label', 'recommendation', 'support', 'notification'));
END $$;

COMMENT ON COLUMN public.activities.notification_title IS 'Notification title (for activity_type=notification)';
COMMENT ON COLUMN public.activities.notification_url IS 'URL to navigate when notification clicked';
COMMENT ON COLUMN public.activities.notification_channels IS 'Delivery channels: inapp, email, sms, push';
COMMENT ON COLUMN public.activities.notification_status IS 'Notification delivery status';
COMMENT ON COLUMN public.activities.read_at IS 'When notification was read by user';
COMMENT ON COLUMN public.activities.sent_at IS 'When notification was sent';
COMMENT ON COLUMN public.activities.target_profile_id IS 'User receiving the notification';
COMMENT ON COLUMN public.activities.context_type IS 'Context type: lead, support, system, commerce, team';
COMMENT ON COLUMN public.activities.context_id IS 'ID of contextual entity';

-- ============================================
-- Step 2: Create indexes for notification queries
-- ============================================

CREATE INDEX IF NOT EXISTS idx_activities_notifications 
  ON public.activities(target_profile_id, notification_status, created_at DESC) 
  WHERE activity_type = 'notification';

CREATE INDEX IF NOT EXISTS idx_activities_unread_notifications 
  ON public.activities(target_profile_id, created_at DESC) 
  WHERE activity_type = 'notification' AND notification_status != 'read';

CREATE INDEX IF NOT EXISTS idx_activities_notification_context 
  ON public.activities(context_type, context_id) 
  WHERE activity_type = 'notification';

CREATE INDEX IF NOT EXISTS idx_activities_notification_channels 
  ON public.activities USING GIN(notification_channels) 
  WHERE activity_type = 'notification';

-- ============================================
-- Step 3: Migrate notifications data to activities
-- ============================================

-- Only run if notifications table exists
DO $$
DECLARE
  v_migrated_count INTEGER := 0;
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.tables 
    WHERE table_schema = 'public' 
    AND table_name = 'notifications'
    AND table_type = 'BASE TABLE'
  ) THEN
    
    -- Migrate data
    INSERT INTO public.activities (
      id,
      activity_type,
      target_profile_id,
      notification_title,
      body,
      notification_url,
      notification_channels,
      notification_status,
      read_at,
      sent_at,
      context_type,
      context_id,
      payload,
      created_at,
      updated_at
    )
    SELECT 
      n.id,
      'notification' AS activity_type,
      n.target_profile_id,
      n.title AS notification_title,
      n.body,
      n.url AS notification_url,
      COALESCE(n.channels, ARRAY['inapp']::TEXT[]) AS notification_channels,
      n.status AS notification_status,
      n.read_at,
      n.sent_at,
      n.context AS context_type,
      n.context_id,
      COALESCE(n.metadata, '{}'::jsonb) AS payload,
      n.created_at,
      COALESCE(n.updated_at, n.created_at) AS updated_at
    FROM public.notifications n
    ON CONFLICT (id) DO UPDATE SET
      target_profile_id = EXCLUDED.target_profile_id,
      notification_title = EXCLUDED.notification_title,
      body = EXCLUDED.body,
      notification_url = EXCLUDED.notification_url,
      notification_channels = EXCLUDED.notification_channels,
      notification_status = EXCLUDED.notification_status,
      read_at = EXCLUDED.read_at,
      sent_at = EXCLUDED.sent_at,
      context_type = EXCLUDED.context_type,
      context_id = EXCLUDED.context_id,
      updated_at = now();

    GET DIAGNOSTICS v_migrated_count = ROW_COUNT;
    RAISE NOTICE '✅ Migrated % notifications to activities table', v_migrated_count;
  ELSE
    RAISE NOTICE 'ℹ️ notifications table does not exist, skipping migration';
  END IF;
END $$;

-- ============================================
-- Step 4: Create compatibility view for backward compatibility
-- ============================================

CREATE OR REPLACE VIEW public.notifications AS
SELECT
  a.id,
  a.target_profile_id,
  a.notification_title AS title,
  a.body,
  a.notification_url AS url,
  a.notification_channels AS channels,
  a.notification_status AS status,
  a.read_at,
  a.sent_at,
  a.context_type AS context,
  a.context_id,
  a.payload AS metadata,
  a.created_at,
  a.updated_at
FROM public.activities a
WHERE a.activity_type = 'notification';

COMMENT ON VIEW public.notifications IS 'Compatibility view - backed by activities table';

-- ============================================
-- Step 5: Create trigger for view compatibility
-- ============================================

CREATE OR REPLACE FUNCTION public.sync_notifications_to_activities()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    INSERT INTO public.activities (
      activity_type,
      target_profile_id,
      notification_title,
      body,
      notification_url,
      notification_channels,
      notification_status,
      read_at,
      sent_at,
      context_type,
      context_id,
      payload,
      created_at,
      updated_at
    ) VALUES (
      'notification',
      NEW.target_profile_id,
      NEW.title,
      NEW.body,
      NEW.url,
      COALESCE(NEW.channels, ARRAY['inapp']::TEXT[]),
      COALESCE(NEW.status, 'pending'),
      NEW.read_at,
      NEW.sent_at,
      NEW.context,
      NEW.context_id,
      COALESCE(NEW.metadata, '{}'::jsonb),
      COALESCE(NEW.created_at, now()),
      COALESCE(NEW.updated_at, now())
    )
    RETURNING id INTO NEW.id;
    RETURN NEW;
    
  ELSIF TG_OP = 'UPDATE' THEN
    UPDATE public.activities SET
      target_profile_id = NEW.target_profile_id,
      notification_title = NEW.title,
      body = NEW.body,
      notification_url = NEW.url,
      notification_channels = COALESCE(NEW.channels, ARRAY['inapp']::TEXT[]),
      notification_status = NEW.status,
      read_at = NEW.read_at,
      sent_at = NEW.sent_at,
      context_type = NEW.context,
      context_id = NEW.context_id,
      payload = COALESCE(NEW.metadata, '{}'::jsonb),
      updated_at = now()
    WHERE id = NEW.id AND activity_type = 'notification';
    RETURN NEW;
    
  ELSIF TG_OP = 'DELETE' THEN
    DELETE FROM public.activities 
    WHERE id = OLD.id AND activity_type = 'notification';
    RETURN OLD;
  END IF;
  
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_notifications_sync
INSTEAD OF INSERT OR UPDATE OR DELETE ON public.notifications
FOR EACH ROW EXECUTE FUNCTION public.sync_notifications_to_activities();

-- ============================================
-- Step 6: Drop original notifications table
-- ============================================

DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.tables 
    WHERE table_schema = 'public' 
    AND table_name = 'notifications'
    AND table_type = 'BASE TABLE'
  ) THEN
    DROP TABLE public.notifications CASCADE;
    RAISE NOTICE '✅ Dropped notifications table';
  END IF;
END $$;

-- ============================================
-- Step 7: Create helper functions for notifications
-- ============================================

-- Function to get unread notification count
CREATE OR REPLACE FUNCTION public.get_unread_notification_count(p_profile_id UUID)
RETURNS INTEGER AS $$
BEGIN
  RETURN (
    SELECT COUNT(*)::INTEGER
    FROM public.activities
    WHERE activity_type = 'notification'
      AND target_profile_id = p_profile_id
      AND notification_status != 'read'
      AND (read_at IS NULL OR read_at > now())
  );
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION public.get_unread_notification_count IS 'Get count of unread notifications for a user';

-- Function to mark notification as read
CREATE OR REPLACE FUNCTION public.mark_notification_read(p_notification_id UUID, p_profile_id UUID)
RETURNS BOOLEAN AS $$
DECLARE
  v_updated BOOLEAN := FALSE;
BEGIN
  UPDATE public.activities
  SET 
    notification_status = 'read',
    read_at = now(),
    updated_at = now()
  WHERE id = p_notification_id
    AND activity_type = 'notification'
    AND target_profile_id = p_profile_id
    AND notification_status != 'read';
  
  GET DIAGNOSTICS v_updated = FOUND;
  RETURN v_updated;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION public.mark_notification_read IS 'Mark a notification as read';

-- Function to mark all notifications as read
CREATE OR REPLACE FUNCTION public.mark_all_notifications_read(p_profile_id UUID)
RETURNS INTEGER AS $$
DECLARE
  v_count INTEGER := 0;
BEGIN
  UPDATE public.activities
  SET 
    notification_status = 'read',
    read_at = now(),
    updated_at = now()
  WHERE activity_type = 'notification'
    AND target_profile_id = p_profile_id
    AND notification_status != 'read';
  
  GET DIAGNOSTICS v_count = ROW_COUNT;
  RETURN v_count;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION public.mark_all_notifications_read IS 'Mark all notifications as read for a user';

-- Function to create notification
CREATE OR REPLACE FUNCTION public.create_notification(
  p_profile_id UUID,
  p_title TEXT,
  p_body TEXT DEFAULT NULL,
  p_url TEXT DEFAULT NULL,
  p_channels TEXT[] DEFAULT ARRAY['inapp']::TEXT[],
  p_context_type TEXT DEFAULT NULL,
  p_context_id UUID DEFAULT NULL,
  p_metadata JSONB DEFAULT '{}'::jsonb
)
RETURNS UUID AS $$
DECLARE
  v_notification_id UUID;
BEGIN
  INSERT INTO public.activities (
    activity_type,
    target_profile_id,
    notification_title,
    body,
    notification_url,
    notification_channels,
    notification_status,
    context_type,
    context_id,
    payload,
    created_at,
    updated_at
  ) VALUES (
    'notification',
    p_profile_id,
    p_title,
    p_body,
    p_url,
    p_channels,
    'pending',
    p_context_type,
    p_context_id,
    p_metadata,
    now(),
    now()
  )
  RETURNING id INTO v_notification_id;
  
  RETURN v_notification_id;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION public.create_notification IS 'Create a new notification';

-- Function to get user timeline (activities + notifications)
CREATE OR REPLACE FUNCTION public.get_user_timeline(
  p_profile_id UUID,
  p_limit INTEGER DEFAULT 50,
  p_offset INTEGER DEFAULT 0
)
RETURNS TABLE (
  id UUID,
  activity_type TEXT,
  title TEXT,
  body TEXT,
  url TEXT,
  is_read BOOLEAN,
  created_at TIMESTAMPTZ
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    a.id,
    a.activity_type,
    COALESCE(a.notification_title, a.summary) AS title,
    a.body,
    a.notification_url AS url,
    (a.notification_status = 'read') AS is_read,
    a.created_at
  FROM public.activities a
  WHERE (
    (a.activity_type = 'notification' AND a.target_profile_id = p_profile_id) OR
    (a.activity_type IN ('event', 'task', 'support') AND a.actor_profile_id = p_profile_id)
  )
  ORDER BY a.created_at DESC
  LIMIT p_limit
  OFFSET p_offset;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION public.get_user_timeline IS 'Get unified timeline of activities and notifications for a user';

-- ============================================
-- Step 8: Update RLS policies for notifications in activities
-- ============================================

-- Add RLS policy for notification access
DO $$
BEGIN
  -- Drop existing policy if exists
  DROP POLICY IF EXISTS "Users can view their own notifications" ON public.activities;
  
  -- Create policy for notifications
  CREATE POLICY "Users can view their own notifications"
    ON public.activities
    FOR SELECT
    USING (
      (activity_type = 'notification' AND target_profile_id = auth.uid()) OR
      (activity_type != 'notification')
    );
  
  -- Users can update their own notifications (mark as read)
  DROP POLICY IF EXISTS "Users can update their own notifications" ON public.activities;
  
  CREATE POLICY "Users can update their own notifications"
    ON public.activities
    FOR UPDATE
    USING (activity_type = 'notification' AND target_profile_id = auth.uid())
    WITH CHECK (activity_type = 'notification' AND target_profile_id = auth.uid());
    
  RAISE NOTICE '✅ Created RLS policies for notifications in activities table';
END $$;

COMMIT;

-- ============================================
-- Verification queries (run after migration)
-- ============================================

-- Verify data migration
-- SELECT COUNT(*) as total_activities FROM public.activities;
-- SELECT COUNT(*) as notifications FROM public.activities WHERE activity_type = 'notification';
-- SELECT notification_status, COUNT(*) FROM public.activities 
-- WHERE activity_type = 'notification' GROUP BY notification_status;

-- Test notification functions
-- SELECT * FROM public.get_unread_notification_count('user-id-here');
-- SELECT * FROM public.get_user_timeline('user-id-here', 10, 0);

DO $$
BEGIN
  RAISE NOTICE '========================================';
  RAISE NOTICE '✅ Phase 3: Notification Consolidation COMPLETE';
  RAISE NOTICE '========================================';
  RAISE NOTICE 'Final table count: 12 tables';
  RAISE NOTICE '========================================';
  RAISE NOTICE 'Next steps:';
  RAISE NOTICE '1. Verify notification migration';
  RAISE NOTICE '2. Update application code to use activities table or compatibility view';
  RAISE NOTICE '3. Test notification delivery, reading, and real-time features';
  RAISE NOTICE '4. Monitor notification system for issues';
  RAISE NOTICE '5. Consider implementing dual-write if doing gradual cutover';
  RAISE NOTICE '========================================';
  RAISE NOTICE 'Helper functions available:';
  RAISE NOTICE '- get_unread_notification_count(profile_id)';
  RAISE NOTICE '- mark_notification_read(notification_id, profile_id)';
  RAISE NOTICE '- mark_all_notifications_read(profile_id)';
  RAISE NOTICE '- create_notification(profile_id, title, ...)';
  RAISE NOTICE '- get_user_timeline(profile_id, limit, offset)';
  RAISE NOTICE '========================================';
  RAISE NOTICE '🎉 DATABASE CONSOLIDATION COMPLETE!';
  RAISE NOTICE '📊 Total reduction: 41+ tables → 12 tables (71% reduction)';
  RAISE NOTICE '========================================';
END $$;

