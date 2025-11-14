-- ============================================
-- RUN ALL FIXES - COMBINED SQL SCRIPT
-- ============================================
-- This script combines all the fixes:
-- 1. Sync auth users to profiles (with phone verification fix)
-- 2. Unify leads table (with manager RLS fix)
-- ============================================
-- Run this in Supabase SQL Editor
-- ============================================

-- ============================================
-- PART 1: SYNC AUTH USERS TO PROFILES
-- ============================================

-- STEP 1: Sync existing auth users to profiles
INSERT INTO public.profiles (
    id,
    name,
    email,
    phone,
    role,
    wallet_balance,
    phone_verified_at,
    created_at,
    updated_at
)
SELECT
    au.id,
    COALESCE(au.raw_user_meta_data->>'name', split_part(au.email, '@', 1)) as name,
    au.email,
    COALESCE(au.raw_user_meta_data->>'phone', au.phone, '') as phone,
    COALESCE(au.raw_user_meta_data->>'role', 'user') as role,
    0 as wallet_balance,
    CASE
        WHEN au.raw_user_meta_data->>'phone_verified' = 'true' THEN now()
        ELSE NULL
    END as phone_verified_at,
    au.created_at,
    now() as updated_at
FROM auth.users au
WHERE NOT EXISTS (
    SELECT 1 FROM public.profiles p WHERE p.id = au.id
)
ON CONFLICT (id) DO NOTHING;

-- STEP 2: Update existing profiles with latest auth data (FIXED: preserves phone_verified_at)
UPDATE public.profiles
SET
    name = COALESCE(au.raw_user_meta_data->>'name', split_part(au.email, '@', 1)),
    email = au.email,
    phone = COALESCE(au.raw_user_meta_data->>'phone', au.phone, ''),
    phone_verified_at = CASE
        WHEN au.raw_user_meta_data->>'phone_verified' = 'true' THEN
            CASE WHEN public.profiles.phone_verified_at IS NULL THEN now() ELSE public.profiles.phone_verified_at END
        ELSE public.profiles.phone_verified_at  -- FIX: Preserve existing value instead of NULL
    END,
    updated_at = now()
FROM auth.users au
WHERE public.profiles.id = au.id;

-- STEP 3: Ensure admin user has correct role
UPDATE public.profiles
SET
    role = 'admin',
    updated_at = now()
WHERE email = 'themartining@gmail.com' AND role != 'admin';

-- ============================================
-- PART 2: UNIFY LEADS TABLE
-- ============================================

-- STEP 1: Ensure leads table has all necessary columns
DO $$ 
BEGIN
    -- Add priority if missing
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

    -- Add integration_id if missing
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
UPDATE public.leads 
SET owner_id = buyer_user_id 
WHERE owner_id IS NULL AND buyer_user_id IS NOT NULL;

-- STEP 3: Ensure all necessary indexes exist
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

-- STEP 5: Update RLS policies (FIXED: includes manager role in UPDATE policy)
ALTER TABLE public.leads ENABLE ROW LEVEL SECURITY;

-- Drop old policies
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

-- Admins, managers, and support can update all leads (FIXED: includes manager)
CREATE POLICY "Admins can update all leads"
    ON public.leads
    FOR UPDATE
    USING (
        EXISTS (
            SELECT 1 FROM public.profiles
            WHERE id = auth.uid() 
            AND role IN ('admin', 'manager', 'support')  -- FIX: Added 'manager'
        )
    );

-- Anyone authenticated can create leads (for integrations and uploads)
CREATE POLICY "Users can create leads"
    ON public.leads
    FOR INSERT
    WITH CHECK (auth.role() = 'authenticated');

-- STEP 6: Ensure related tables reference leads correctly
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

-- ============================================
-- VERIFICATION
-- ============================================

SELECT 
    '✅ All fixes applied successfully!' as status,
    (SELECT COUNT(*) FROM public.profiles) as total_profiles,
    (SELECT COUNT(*) FROM public.leads) as total_leads,
    (SELECT COUNT(*) FROM auth.users WHERE id NOT IN (SELECT id FROM public.profiles)) as missing_profiles;

