-- ============================================
-- ENHANCE CRM FEATURES
-- Add tables for tags, reminders, and activity log
-- ============================================

-- STEP 1: Create lead_tags table for flexible categorization
-- ============================================
CREATE TABLE IF NOT EXISTS public.lead_tags (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    lead_id uuid NOT NULL REFERENCES public.leads(id) ON DELETE CASCADE,
    tag_name text NOT NULL,
    color text DEFAULT '#3b82f6', -- Default blue color
    created_at timestamptz NOT NULL DEFAULT now(),
    created_by uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
    UNIQUE(lead_id, tag_name)
);

CREATE INDEX IF NOT EXISTS idx_lead_tags_lead_id ON public.lead_tags(lead_id);
CREATE INDEX IF NOT EXISTS idx_lead_tags_tag_name ON public.lead_tags(tag_name);

-- Enable RLS
ALTER TABLE public.lead_tags ENABLE ROW LEVEL SECURITY;

-- RLS Policies for lead_tags
DROP POLICY IF EXISTS "Users can view tags for their leads" ON public.lead_tags;
CREATE POLICY "Users can view tags for their leads"
    ON public.lead_tags
    FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM public.leads
            WHERE leads.id = lead_tags.lead_id
            AND (leads.buyer_user_id = auth.uid() OR leads.assigned_to_id = auth.uid())
        )
        OR EXISTS (
            SELECT 1 FROM public.profiles
            WHERE id = auth.uid() AND role IN ('admin', 'manager')
        )
    );

DROP POLICY IF EXISTS "Users can create tags for their leads" ON public.lead_tags;
CREATE POLICY "Users can create tags for their leads"
    ON public.lead_tags
    FOR INSERT
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.leads
            WHERE leads.id = lead_tags.lead_id
            AND (leads.buyer_user_id = auth.uid() OR leads.assigned_to_id = auth.uid())
        )
        OR EXISTS (
            SELECT 1 FROM public.profiles
            WHERE id = auth.uid() AND role IN ('admin', 'manager')
        )
    );

DROP POLICY IF EXISTS "Users can delete tags for their leads" ON public.lead_tags;
CREATE POLICY "Users can delete tags for their leads"
    ON public.lead_tags
    FOR DELETE
    USING (
        EXISTS (
            SELECT 1 FROM public.leads
            WHERE leads.id = lead_tags.lead_id
            AND (leads.buyer_user_id = auth.uid() OR leads.assigned_to_id = auth.uid())
        )
        OR EXISTS (
            SELECT 1 FROM public.profiles
            WHERE id = auth.uid() AND role IN ('admin', 'manager')
        )
    );

-- STEP 2: Create lead_reminders table for follow-up scheduling
-- ============================================
CREATE TABLE IF NOT EXISTS public.lead_reminders (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    lead_id uuid NOT NULL REFERENCES public.leads(id) ON DELETE CASCADE,
    user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    reminder_date timestamptz NOT NULL,
    reminder_text text,
    is_completed boolean NOT NULL DEFAULT false,
    completed_at timestamptz,
    created_at timestamptz NOT NULL DEFAULT now(),
    updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_lead_reminders_lead_id ON public.lead_reminders(lead_id);
CREATE INDEX IF NOT EXISTS idx_lead_reminders_user_id ON public.lead_reminders(user_id);
CREATE INDEX IF NOT EXISTS idx_lead_reminders_reminder_date ON public.lead_reminders(reminder_date);
CREATE INDEX IF NOT EXISTS idx_lead_reminders_is_completed ON public.lead_reminders(is_completed);

-- Enable RLS
ALTER TABLE public.lead_reminders ENABLE ROW LEVEL SECURITY;

-- RLS Policies for lead_reminders
DROP POLICY IF EXISTS "Users can view their own reminders" ON public.lead_reminders;
CREATE POLICY "Users can view their own reminders"
    ON public.lead_reminders
    FOR SELECT
    USING (user_id = auth.uid());

DROP POLICY IF EXISTS "Users can create their own reminders" ON public.lead_reminders;
CREATE POLICY "Users can create their own reminders"
    ON public.lead_reminders
    FOR INSERT
    WITH CHECK (user_id = auth.uid());

DROP POLICY IF EXISTS "Users can update their own reminders" ON public.lead_reminders;
CREATE POLICY "Users can update their own reminders"
    ON public.lead_reminders
    FOR UPDATE
    USING (user_id = auth.uid());

DROP POLICY IF EXISTS "Users can delete their own reminders" ON public.lead_reminders;
CREATE POLICY "Users can delete their own reminders"
    ON public.lead_reminders
    FOR DELETE
    USING (user_id = auth.uid());

-- STEP 3: Create lead_activities table for activity log/timeline
-- ============================================
CREATE TABLE IF NOT EXISTS public.lead_activities (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    lead_id uuid NOT NULL REFERENCES public.leads(id) ON DELETE CASCADE,
    user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE SET NULL,
    activity_type text NOT NULL CHECK (activity_type IN (
        'created', 'updated', 'stage_changed', 'assigned', 'unassigned',
        'contacted', 'note_added', 'feedback_added', 'tag_added', 'tag_removed',
        'reminder_created', 'reminder_completed', 'sold', 'deleted'
    )),
    activity_data jsonb DEFAULT '{}'::jsonb,
    description text,
    created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_lead_activities_lead_id ON public.lead_activities(lead_id);
CREATE INDEX IF NOT EXISTS idx_lead_activities_user_id ON public.lead_activities(user_id);
CREATE INDEX IF NOT EXISTS idx_lead_activities_activity_type ON public.lead_activities(activity_type);
CREATE INDEX IF NOT EXISTS idx_lead_activities_created_at ON public.lead_activities(created_at DESC);

-- Enable RLS
ALTER TABLE public.lead_activities ENABLE ROW LEVEL SECURITY;

-- RLS Policies for lead_activities
DROP POLICY IF EXISTS "Users can view activities for their leads" ON public.lead_activities;
CREATE POLICY "Users can view activities for their leads"
    ON public.lead_activities
    FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM public.leads
            WHERE leads.id = lead_activities.lead_id
            AND (leads.buyer_user_id = auth.uid() OR leads.assigned_to_id = auth.uid())
        )
        OR EXISTS (
            SELECT 1 FROM public.profiles
            WHERE id = auth.uid() AND role IN ('admin', 'manager')
        )
    );

DROP POLICY IF EXISTS "Users can create activities for their leads" ON public.lead_activities;
CREATE POLICY "Users can create activities for their leads"
    ON public.lead_activities
    FOR INSERT
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.leads
            WHERE leads.id = lead_activities.lead_id
            AND (leads.buyer_user_id = auth.uid() OR leads.assigned_to_id = auth.uid())
        )
        OR EXISTS (
            SELECT 1 FROM public.profiles
            WHERE id = auth.uid() AND role IN ('admin', 'manager')
        )
    );

-- STEP 4: Add priority column to leads table
-- ============================================
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'leads' 
        AND column_name = 'priority'
    ) THEN
        ALTER TABLE public.leads 
        ADD COLUMN priority text DEFAULT 'normal' CHECK (priority IN ('low', 'normal', 'high', 'urgent'));
        
        CREATE INDEX IF NOT EXISTS idx_leads_priority ON public.leads(priority);
        
        COMMENT ON COLUMN public.leads.priority IS 'Lead priority level: low, normal, high, urgent';
    END IF;
END $$;

-- STEP 5: Add last_contacted_at column to leads table
-- ============================================
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'leads' 
        AND column_name = 'last_contacted_at'
    ) THEN
        ALTER TABLE public.leads 
        ADD COLUMN last_contacted_at timestamptz;
        
        CREATE INDEX IF NOT EXISTS idx_leads_last_contacted_at ON public.leads(last_contacted_at);
        
        COMMENT ON COLUMN public.leads.last_contacted_at IS 'Last time the lead was contacted (call, email, WhatsApp, etc.)';
    END IF;
END $$;

-- STEP 6: Add next_followup_at column to leads table
-- ============================================
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'leads' 
        AND column_name = 'next_followup_at'
    ) THEN
        ALTER TABLE public.leads 
        ADD COLUMN next_followup_at timestamptz;
        
        CREATE INDEX IF NOT EXISTS idx_leads_next_followup_at ON public.leads(next_followup_at);
        
        COMMENT ON COLUMN public.leads.next_followup_at IS 'Scheduled next follow-up date/time';
    END IF;
END $$;

-- Grant permissions
GRANT SELECT, INSERT, UPDATE, DELETE ON public.lead_tags TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.lead_reminders TO authenticated;
GRANT SELECT, INSERT ON public.lead_activities TO authenticated;

-- Comments
COMMENT ON TABLE public.lead_tags IS 'Flexible tagging system for leads';
COMMENT ON TABLE public.lead_reminders IS 'Follow-up reminders for leads';
COMMENT ON TABLE public.lead_activities IS 'Activity log/timeline for all lead interactions and changes';

