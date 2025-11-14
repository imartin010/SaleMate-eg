-- ============================================
-- UNIFY LEADS INTO SINGLE TABLE
-- ============================================
-- This migration ensures all leads are stored in the unified 'leads' table
-- and removes any duplicate or unnecessary lead storage tables
-- ============================================

-- STEP 1: Ensure leads table has all necessary columns
-- ============================================

-- Add any missing columns to leads table
DO $$ 
BEGIN
    -- Add priority if missing (from CRM enhancements)
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'leads' 
        AND column_name = 'priority'
    ) THEN
        ALTER TABLE public.leads 
        ADD COLUMN priority text DEFAULT 'normal' CHECK (priority IN ('low', 'normal', 'high', 'urgent'));
        
        CREATE INDEX IF NOT EXISTS idx_leads_priority ON public.leads(priority);
    END IF;

    -- Add last_contacted_at if missing
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'leads' 
        AND column_name = 'last_contacted_at'
    ) THEN
        ALTER TABLE public.leads 
        ADD COLUMN last_contacted_at timestamptz;
        
        CREATE INDEX IF NOT EXISTS idx_leads_last_contacted_at ON public.leads(last_contacted_at);
    END IF;

    -- Add next_followup_at if missing
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'leads' 
        AND column_name = 'next_followup_at'
    ) THEN
        ALTER TABLE public.leads 
        ADD COLUMN next_followup_at timestamptz;
        
        CREATE INDEX IF NOT EXISTS idx_leads_next_followup_at ON public.leads(next_followup_at);
    END IF;

    -- Add integration_id if missing (for Ads Manager tracking)
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'leads' 
        AND column_name = 'integration_id'
    ) THEN
        ALTER TABLE public.leads 
        ADD COLUMN integration_id uuid;
        
        CREATE INDEX IF NOT EXISTS idx_leads_integration_id ON public.leads(integration_id);
    END IF;

    -- Ensure company_name exists
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'leads' 
        AND column_name = 'company_name'
    ) THEN
        ALTER TABLE public.leads 
        ADD COLUMN company_name text;
    END IF;

    -- Ensure owner_id exists
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'leads' 
        AND column_name = 'owner_id'
    ) THEN
        ALTER TABLE public.leads 
        ADD COLUMN owner_id uuid REFERENCES public.profiles(id) ON DELETE SET NULL;
        
        CREATE INDEX IF NOT EXISTS idx_leads_owner_id ON public.leads(owner_id);
    END IF;

    -- Ensure assigned_at exists
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'leads' 
        AND column_name = 'assigned_at'
    ) THEN
        ALTER TABLE public.leads 
        ADD COLUMN assigned_at timestamptz;
        
        CREATE INDEX IF NOT EXISTS idx_leads_assigned_at ON public.leads(assigned_at);
    END IF;

    -- Ensure budget exists
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'leads' 
        AND column_name = 'budget'
    ) THEN
        ALTER TABLE public.leads 
        ADD COLUMN budget numeric(12, 2);
    END IF;
END $$;

-- STEP 2: Update existing leads to set owner_id = buyer_user_id if not set
-- ============================================

UPDATE public.leads 
SET owner_id = buyer_user_id 
WHERE owner_id IS NULL AND buyer_user_id IS NOT NULL;

-- STEP 3: Ensure all necessary indexes exist
-- ============================================

CREATE INDEX IF NOT EXISTS idx_leads_buyer_user_id ON public.leads(buyer_user_id);
CREATE INDEX IF NOT EXISTS idx_leads_assigned_to_id ON public.leads(assigned_to_id);
CREATE INDEX IF NOT EXISTS idx_leads_project_id ON public.leads(project_id);
CREATE INDEX IF NOT EXISTS idx_leads_stage ON public.leads(stage);
CREATE INDEX IF NOT EXISTS idx_leads_is_sold ON public.leads(is_sold);
CREATE INDEX IF NOT EXISTS idx_leads_source ON public.leads(source);
CREATE INDEX IF NOT EXISTS idx_leads_platform ON public.leads(platform);
CREATE INDEX IF NOT EXISTS idx_leads_created_at ON public.leads(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_leads_buyer_assigned ON public.leads(buyer_user_id, assigned_to_id);
CREATE INDEX IF NOT EXISTS idx_leads_upload_user_id ON public.leads(upload_user_id);
CREATE INDEX IF NOT EXISTS idx_leads_batch_id ON public.leads(batch_id);

-- STEP 4: Ensure updated_at trigger exists
-- ============================================

CREATE OR REPLACE FUNCTION update_leads_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS update_leads_updated_at ON public.leads;
CREATE TRIGGER update_leads_updated_at
    BEFORE UPDATE ON public.leads
    FOR EACH ROW
    EXECUTE FUNCTION update_leads_updated_at();

-- STEP 5: Verify leads table structure
-- ============================================

DO $$
DECLARE
    column_count integer;
    required_columns text[] := ARRAY[
        'id', 'client_name', 'client_phone', 'client_email', 'client_phone2', 'client_phone3',
        'client_job_title', 'company_name', 'project_id', 'buyer_user_id', 'assigned_to_id',
        'owner_id', 'upload_user_id', 'stage', 'is_sold', 'sold_at', 'assigned_at',
        'source', 'platform', 'budget', 'feedback', 'cpl_price', 'batch_id',
        'priority', 'last_contacted_at', 'next_followup_at', 'integration_id',
        'created_at', 'updated_at'
    ];
    missing_columns text[];
    col text;
BEGIN
    -- Count columns
    SELECT COUNT(*) INTO column_count
    FROM information_schema.columns
    WHERE table_schema = 'public'
    AND table_name = 'leads';
    
    -- Check for missing columns
    FOREACH col IN ARRAY required_columns
    LOOP
        IF NOT EXISTS (
            SELECT 1 FROM information_schema.columns
            WHERE table_schema = 'public'
            AND table_name = 'leads'
            AND column_name = col
        ) THEN
            missing_columns := array_append(missing_columns, col);
        END IF;
    END LOOP;
    
    IF array_length(missing_columns, 1) > 0 THEN
        RAISE WARNING 'Missing columns in leads table: %', array_to_string(missing_columns, ', ');
    ELSE
        RAISE NOTICE '✅ Leads table has all required columns (% total)', column_count;
    END IF;
END $$;

-- STEP 6: Ensure RLS policies are correct
-- ============================================

-- Enable RLS
ALTER TABLE public.leads ENABLE ROW LEVEL SECURITY;

-- Drop old policies to avoid conflicts
DROP POLICY IF EXISTS "Users can view their own leads" ON public.leads;
DROP POLICY IF EXISTS "Users can view assigned leads" ON public.leads;
DROP POLICY IF EXISTS "Users can view purchased leads" ON public.leads;
DROP POLICY IF EXISTS "Admins can view all leads" ON public.leads;
DROP POLICY IF EXISTS "Managers can view team leads" ON public.leads;
DROP POLICY IF EXISTS "Users can update their own leads" ON public.leads;
DROP POLICY IF EXISTS "Admins can update all leads" ON public.leads;
DROP POLICY IF EXISTS "Users can create leads" ON public.leads;
DROP POLICY IF EXISTS "Admins can create leads" ON public.leads;

-- Users can view their own purchased leads
CREATE POLICY "Users can view their own purchased leads"
    ON public.leads
    FOR SELECT
    USING (
        buyer_user_id = auth.uid() 
        OR assigned_to_id = auth.uid()
        OR owner_id = auth.uid()
    );

-- Admins, managers, and support can view all leads
CREATE POLICY "Admins can view all leads"
    ON public.leads
    FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM public.profiles
            WHERE id = auth.uid() 
            AND role IN ('admin', 'manager', 'support')
        )
    );

-- Users can update their own leads
CREATE POLICY "Users can update their own leads"
    ON public.leads
    FOR UPDATE
    USING (
        buyer_user_id = auth.uid() 
        OR assigned_to_id = auth.uid()
        OR owner_id = auth.uid()
    );

-- Admins, managers, and support can update all leads
CREATE POLICY "Admins can update all leads"
    ON public.leads
    FOR UPDATE
    USING (
        EXISTS (
            SELECT 1 FROM public.profiles
            WHERE id = auth.uid() 
            AND role IN ('admin', 'manager', 'support')
        )
    );

-- Anyone authenticated can create leads (for integrations and uploads)
CREATE POLICY "Users can create leads"
    ON public.leads
    FOR INSERT
    WITH CHECK (auth.role() = 'authenticated');

-- STEP 7: Ensure related tables reference leads correctly
-- ============================================

-- Verify lead_tags references leads
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints
        WHERE constraint_name = 'lead_tags_lead_id_fkey'
        AND table_name = 'lead_tags'
    ) THEN
        ALTER TABLE public.lead_tags
        ADD CONSTRAINT lead_tags_lead_id_fkey
        FOREIGN KEY (lead_id) REFERENCES public.leads(id) ON DELETE CASCADE;
    END IF;
END $$;

-- Verify lead_reminders references leads
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints
        WHERE constraint_name = 'lead_reminders_lead_id_fkey'
        AND table_name = 'lead_reminders'
    ) THEN
        ALTER TABLE public.lead_reminders
        ADD CONSTRAINT lead_reminders_lead_id_fkey
        FOREIGN KEY (lead_id) REFERENCES public.leads(id) ON DELETE CASCADE;
    END IF;
END $$;

-- Verify lead_activities references leads
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints
        WHERE constraint_name = 'lead_activities_lead_id_fkey'
        AND table_name = 'lead_activities'
    ) THEN
        ALTER TABLE public.lead_activities
        ADD CONSTRAINT lead_activities_lead_id_fkey
        FOREIGN KEY (lead_id) REFERENCES public.leads(id) ON DELETE CASCADE;
    END IF;
END $$;

-- STEP 8: Success message
-- ============================================

SELECT 
    '✅ Leads table unified successfully!' as status,
    (SELECT COUNT(*) FROM public.leads) as total_leads,
    (SELECT COUNT(*) FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'leads') as column_count;

