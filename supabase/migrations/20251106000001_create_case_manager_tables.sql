-- ============================================
-- CASE MANAGER SYSTEM
-- Creates tables for case feedback, actions, faces, inventory matches, and notifications
-- ============================================

-- Case feedback tracking
CREATE TABLE IF NOT EXISTS public.case_feedback (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  lead_id uuid NOT NULL REFERENCES public.leads(id) ON DELETE CASCADE,
  stage text NOT NULL,
  feedback text NOT NULL,
  ai_coach text,
  created_by uuid NOT NULL REFERENCES public.profiles(id),
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Case actions/reminders/tasks
CREATE TABLE IF NOT EXISTS public.case_actions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  lead_id uuid NOT NULL REFERENCES public.leads(id) ON DELETE CASCADE,
  action_type text NOT NULL,
  payload jsonb,
  due_at timestamptz,
  status text NOT NULL DEFAULT 'PENDING',
  created_by uuid NOT NULL REFERENCES public.profiles(id),
  created_at timestamptz NOT NULL DEFAULT now(),
  completed_at timestamptz,
  notified_at timestamptz
);

-- Face changes tracking
CREATE TABLE IF NOT EXISTS public.case_faces (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  lead_id uuid NOT NULL REFERENCES public.leads(id) ON DELETE CASCADE,
  from_agent uuid REFERENCES public.profiles(id),
  to_agent uuid NOT NULL REFERENCES public.profiles(id),
  reason text,
  created_by uuid NOT NULL REFERENCES public.profiles(id),
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Inventory matches cache
CREATE TABLE IF NOT EXISTS public.inventory_matches (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  lead_id uuid NOT NULL REFERENCES public.leads(id) ON DELETE CASCADE,
  filters jsonb NOT NULL,
  result_count int NOT NULL DEFAULT 0,
  top_units jsonb,
  recommendation text,
  created_by uuid NOT NULL REFERENCES public.profiles(id),
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Notifications system
CREATE TABLE IF NOT EXISTS public.notifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  title text NOT NULL,
  body text NOT NULL,
  url text,
  channels text[] DEFAULT ARRAY['inapp']::text[],
  status text NOT NULL DEFAULT 'pending',
  read_at timestamptz,
  sent_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_case_actions_lead_due ON public.case_actions(lead_id, due_at);
CREATE INDEX IF NOT EXISTS idx_case_actions_status_due ON public.case_actions(status, due_at) WHERE status = 'PENDING';
CREATE INDEX IF NOT EXISTS idx_case_faces_lead ON public.case_faces(lead_id);
CREATE INDEX IF NOT EXISTS idx_case_feedback_lead ON public.case_feedback(lead_id);
CREATE INDEX IF NOT EXISTS idx_inventory_matches_lead ON public.inventory_matches(lead_id);
CREATE INDEX IF NOT EXISTS idx_notifications_user_status ON public.notifications(user_id, status);
CREATE INDEX IF NOT EXISTS idx_notifications_created ON public.notifications(created_at DESC);

-- RLS helper function (reusable across all case tables)
CREATE OR REPLACE FUNCTION public.can_access_lead(l_id uuid)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.leads l
    WHERE l.id = l_id
      AND (
        l.buyer_user_id = auth.uid() 
        OR l.assigned_to_id = auth.uid() 
        OR l.owner_id = auth.uid()
        OR EXISTS (
          SELECT 1 FROM public.profiles 
          WHERE id = auth.uid() 
          AND role IN ('admin', 'support')
        )
      )
  );
$$;

-- Enable RLS on all case tables
ALTER TABLE public.case_feedback ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.case_actions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.case_faces ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.inventory_matches ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

-- RLS Policies for case_feedback
DROP POLICY IF EXISTS "read case_feedback" ON public.case_feedback;
CREATE POLICY "read case_feedback" ON public.case_feedback 
  FOR SELECT 
  USING (public.can_access_lead(lead_id));

DROP POLICY IF EXISTS "insert case_feedback" ON public.case_feedback;
CREATE POLICY "insert case_feedback" ON public.case_feedback 
  FOR INSERT 
  WITH CHECK (public.can_access_lead(lead_id) AND created_by = auth.uid());

-- RLS Policies for case_actions
DROP POLICY IF EXISTS "read case_actions" ON public.case_actions;
CREATE POLICY "read case_actions" ON public.case_actions 
  FOR SELECT 
  USING (public.can_access_lead(lead_id));

DROP POLICY IF EXISTS "mutate case_actions" ON public.case_actions;
CREATE POLICY "mutate case_actions" ON public.case_actions 
  FOR ALL 
  USING (public.can_access_lead(lead_id)) 
  WITH CHECK (public.can_access_lead(lead_id));

-- RLS Policies for case_faces
DROP POLICY IF EXISTS "read case_faces" ON public.case_faces;
CREATE POLICY "read case_faces" ON public.case_faces 
  FOR SELECT 
  USING (public.can_access_lead(lead_id));

DROP POLICY IF EXISTS "mutate case_faces" ON public.case_faces;
CREATE POLICY "mutate case_faces" ON public.case_faces 
  FOR ALL 
  USING (public.can_access_lead(lead_id)) 
  WITH CHECK (public.can_access_lead(lead_id));

-- RLS Policies for inventory_matches
DROP POLICY IF EXISTS "read inventory_matches" ON public.inventory_matches;
CREATE POLICY "read inventory_matches" ON public.inventory_matches 
  FOR SELECT 
  USING (public.can_access_lead(lead_id));

DROP POLICY IF EXISTS "insert inventory_matches" ON public.inventory_matches;
CREATE POLICY "insert inventory_matches" ON public.inventory_matches 
  FOR INSERT 
  WITH CHECK (public.can_access_lead(lead_id) AND created_by = auth.uid());

-- RLS Policies for notifications
DROP POLICY IF EXISTS "read own notifications" ON public.notifications;
CREATE POLICY "read own notifications" ON public.notifications 
  FOR SELECT 
  USING (user_id = auth.uid());

DROP POLICY IF EXISTS "update own notifications" ON public.notifications;
CREATE POLICY "update own notifications" ON public.notifications 
  FOR UPDATE 
  USING (user_id = auth.uid());

-- Grant permissions
GRANT ALL ON public.case_feedback TO authenticated;
GRANT ALL ON public.case_actions TO authenticated;
GRANT ALL ON public.case_faces TO authenticated;
GRANT ALL ON public.inventory_matches TO authenticated;
GRANT ALL ON public.notifications TO authenticated;

-- Log completion
DO $$
BEGIN
  RAISE NOTICE '✅ Case Manager tables created successfully';
END $$;

