-- ============================================
-- PHASE 1: CREATE EVENTS TABLE
-- Consolidate: activities + notifications + system_logs → events
-- ============================================
-- This creates a unified events table for all system events

BEGIN;

-- ============================================
-- Step 1: Create the unified events table
-- ============================================

CREATE TABLE IF NOT EXISTS public.events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Event classification
  event_type TEXT NOT NULL CHECK (event_type IN (
    'activity',      -- Tasks, feedback, support, transfers
    'notification',  -- User notifications
    'audit',        -- Audit logs
    'system',       -- System events
    'error',        -- Error logs
    'metric'        -- Analytics/metrics
  )),
  
  event_category TEXT, -- Subcategory: 'task', 'feedback', 'support', 'user_action', etc.
  
  -- Core references
  profile_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  target_profile_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  lead_id UUID REFERENCES public.leads(id) ON DELETE CASCADE,
  
  -- Event content
  title TEXT,
  body TEXT,
  summary TEXT,
  
  -- Activity-specific fields
  activity_type TEXT,
  task_type TEXT,
  task_status TEXT CHECK (task_status IN ('pending', 'in_progress', 'completed', 'cancelled', 'overdue')),
  stage TEXT,
  due_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  ai_coach TEXT,
  
  -- Notification-specific fields
  notification_url TEXT,
  notification_channels TEXT[] DEFAULT ARRAY['inapp']::TEXT[],
  notification_status TEXT CHECK (notification_status IN ('pending', 'sent', 'read', 'failed')),
  read_at TIMESTAMPTZ,
  sent_at TIMESTAMPTZ,
  
  -- Audit/system log-specific fields
  action TEXT,
  entity_type TEXT,
  entity_id UUID,
  ip_address TEXT,
  user_agent TEXT,
  log_level TEXT CHECK (log_level IN ('info', 'warning', 'error', 'critical')),
  
  -- Support-specific fields
  support_subject TEXT,
  support_topic TEXT,
  support_status TEXT,
  support_priority TEXT,
  support_issue TEXT,
  thread_id UUID,
  message_type TEXT,
  attachments JSONB,
  
  -- Transfer/assignment fields
  from_profile_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  to_profile_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  reason TEXT,
  
  -- Label fields
  label TEXT,
  label_color TEXT,
  
  -- Recommendation fields
  filters JSONB,
  top_units JSONB,
  recommendation TEXT,
  result_count INTEGER,
  
  -- Actor references
  actor_profile_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  assignee_profile_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  created_by_profile_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  
  -- Context fields
  context_type TEXT,
  context_id UUID,
  
  -- Flexible data storage
  metadata JSONB DEFAULT '{}',
  payload JSONB DEFAULT '{}',
  details JSONB DEFAULT '{}',
  
  -- Timestamps
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

COMMENT ON TABLE public.events IS 'Unified event system - activities, notifications, system logs, and audit trails';

-- ============================================
-- Step 2: Create indexes for performance
-- ============================================

-- Primary access patterns
CREATE INDEX idx_events_type_created ON public.events(event_type, created_at DESC);
CREATE INDEX idx_events_profile_created ON public.events(profile_id, created_at DESC);
CREATE INDEX idx_events_target_created ON public.events(target_profile_id, created_at DESC);
CREATE INDEX idx_events_lead ON public.events(lead_id, created_at DESC);

-- Notifications
CREATE INDEX idx_events_notifications ON public.events(target_profile_id, notification_status, created_at DESC) 
  WHERE event_type = 'notification';
CREATE INDEX idx_events_unread ON public.events(target_profile_id, created_at DESC) 
  WHERE event_type = 'notification' AND notification_status != 'read';

-- Activities
CREATE INDEX idx_events_activities ON public.events(profile_id, event_category, created_at DESC) 
  WHERE event_type = 'activity';
CREATE INDEX idx_events_tasks ON public.events(assignee_profile_id, task_status, due_at) 
  WHERE event_type = 'activity' AND task_status IN ('pending', 'in_progress');

-- Audit logs
CREATE INDEX idx_events_audit ON public.events(actor_profile_id, action, created_at DESC) 
  WHERE event_type = 'audit';
CREATE INDEX idx_events_entity ON public.events(entity_type, entity_id) 
  WHERE event_type = 'audit';

-- System logs
CREATE INDEX idx_events_system ON public.events(log_level, created_at DESC) 
  WHERE event_type IN ('system', 'error');

-- Support
CREATE INDEX idx_events_support ON public.events(thread_id, created_at) 
  WHERE event_type = 'activity' AND event_category = 'support';

-- Context
CREATE INDEX idx_events_context ON public.events(context_type, context_id);

-- JSONB indexes
CREATE INDEX idx_events_metadata ON public.events USING GIN(metadata);
CREATE INDEX idx_events_payload ON public.events USING GIN(payload);

-- ============================================
-- Step 3: Enable RLS
-- ============================================

ALTER TABLE public.events ENABLE ROW LEVEL SECURITY;

-- Policy: Users can view their own events
CREATE POLICY "Users can view their own events"
  ON public.events
  FOR SELECT
  USING (
    profile_id = auth.uid() OR
    target_profile_id = auth.uid() OR
    actor_profile_id = auth.uid() OR
    assignee_profile_id = auth.uid()
  );

-- Policy: Users can create events
CREATE POLICY "Users can create events"
  ON public.events
  FOR INSERT
  WITH CHECK (
    profile_id = auth.uid() OR
    actor_profile_id = auth.uid()
  );

-- Policy: Users can update their own events
CREATE POLICY "Users can update their own events"
  ON public.events
  FOR UPDATE
  USING (
    profile_id = auth.uid() OR
    target_profile_id = auth.uid() OR
    assignee_profile_id = auth.uid()
  );

-- Policy: Admins can do everything
CREATE POLICY "Admins can manage all events"
  ON public.events
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid() AND profiles.role = 'admin'
    )
  );

-- ============================================
-- Step 4: Create updated_at trigger
-- ============================================

DROP TRIGGER IF EXISTS update_events_updated_at ON public.events;
CREATE TRIGGER update_events_updated_at
  BEFORE UPDATE ON public.events
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

COMMIT;

-- ============================================
-- Verification
-- ============================================

DO $$
BEGIN
  RAISE NOTICE '========================================';
  RAISE NOTICE '✅ Phase 1 Step 1: Events table created';
  RAISE NOTICE '========================================';
  RAISE NOTICE 'Table: events';
  RAISE NOTICE 'Indexes: 15 created';
  RAISE NOTICE 'RLS: Enabled with 4 policies';
  RAISE NOTICE '';
  RAISE NOTICE 'Next step: Run migration 20241118100002 to migrate data';
  RAISE NOTICE '========================================';
END $$;

