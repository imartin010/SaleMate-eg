-- ============================================
-- COMPLETE SYSTEM TABLES MIGRATION
-- Phase 7: Database Schema Updates
-- ============================================

-- STEP 1: Add project_code to projects table
-- ============================================

-- Add project_code column if it doesn't exist
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'projects' 
        AND column_name = 'project_code'
    ) THEN
        ALTER TABLE public.projects 
        ADD COLUMN project_code text UNIQUE;
        
        -- Create index for fast lookups
        CREATE INDEX IF NOT EXISTS idx_projects_project_code ON public.projects(project_code);
    END IF;
END $$;

-- STEP 2: Ensure leads.project_id is NOT NULL (all leads must have project)
-- ============================================

-- First, handle any existing NULL project_id leads
UPDATE public.leads 
SET project_id = (
    SELECT id FROM public.projects 
    WHERE project_code = 'DEFAULT' 
    LIMIT 1
)
WHERE project_id IS NULL
AND EXISTS (SELECT 1 FROM public.projects WHERE project_code = 'DEFAULT');

-- If no DEFAULT project exists, create one
INSERT INTO public.projects (
    id,
    name,
    developer,
    region,
    project_code,
    available_leads,
    price_per_lead
)
SELECT 
    gen_random_uuid(),
    'Default Project',
    'System',
    'Default',
    'DEFAULT',
    0,
    0
WHERE NOT EXISTS (SELECT 1 FROM public.projects WHERE project_code = 'DEFAULT');

-- Assign remaining NULL leads to DEFAULT project
UPDATE public.leads 
SET project_id = (SELECT id FROM public.projects WHERE project_code = 'DEFAULT' LIMIT 1)
WHERE project_id IS NULL;

-- Now make project_id NOT NULL
DO $$ 
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'leads' 
        AND column_name = 'project_id'
        AND is_nullable = 'YES'
    ) THEN
        ALTER TABLE public.leads 
        ALTER COLUMN project_id SET NOT NULL;
    END IF;
END $$;

-- STEP 3: Add integration_id to leads table (for tracking Ads Manager source)
-- ============================================

DO $$ 
BEGIN
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
END $$;

-- STEP 4: Create ad_integrations table
-- ============================================

CREATE TABLE IF NOT EXISTS public.ad_integrations (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    name text NOT NULL,
    type text NOT NULL CHECK (type IN ('facebook_ads', 'google_ads', 'other')),
    api_key text,
    api_secret text,
    webhook_url text,
    webhook_secret text,
    is_active boolean NOT NULL DEFAULT true,
    last_sync_at timestamptz,
    sync_frequency text DEFAULT 'realtime',
    config jsonb DEFAULT '{}'::jsonb,
    created_at timestamptz NOT NULL DEFAULT now(),
    updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_ad_integrations_type ON public.ad_integrations(type);
CREATE INDEX IF NOT EXISTS idx_ad_integrations_is_active ON public.ad_integrations(is_active);

-- STEP 5: Create lead_requests table (for users requesting leads when project has 0 available)
-- ============================================

CREATE TABLE IF NOT EXISTS public.lead_requests (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    project_id uuid NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
    quantity integer NOT NULL CHECK (quantity > 0),
    status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'fulfilled', 'cancelled', 'rejected')),
    notes text,
    fulfilled_at timestamptz,
    created_at timestamptz NOT NULL DEFAULT now(),
    updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_lead_requests_user_id ON public.lead_requests(user_id);
CREATE INDEX IF NOT EXISTS idx_lead_requests_project_id ON public.lead_requests(project_id);
CREATE INDEX IF NOT EXISTS idx_lead_requests_status ON public.lead_requests(status);

-- STEP 6: Create wallet_topup_requests table
-- ============================================

CREATE TABLE IF NOT EXISTS public.wallet_topup_requests (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    amount numeric(10, 2) NOT NULL CHECK (amount > 0),
    receipt_file_url text NOT NULL,
    receipt_file_name text,
    payment_method text NOT NULL CHECK (payment_method IN ('Instapay', 'VodafoneCash', 'BankTransfer')),
    status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
    validated_by uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
    validated_at timestamptz,
    admin_notes text,
    rejected_reason text,
    created_at timestamptz NOT NULL DEFAULT now(),
    updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_wallet_topup_requests_user_id ON public.wallet_topup_requests(user_id);
CREATE INDEX IF NOT EXISTS idx_wallet_topup_requests_status ON public.wallet_topup_requests(status);
CREATE INDEX IF NOT EXISTS idx_wallet_topup_requests_validated_by ON public.wallet_topup_requests(validated_by);

-- STEP 7: Update lead_purchase_requests table (add validation fields)
-- ============================================

DO $$ 
BEGIN
    -- Add validation_status if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'lead_purchase_requests' 
        AND column_name = 'validation_status'
    ) THEN
        ALTER TABLE public.lead_purchase_requests 
        ADD COLUMN validation_status text DEFAULT 'pending' CHECK (validation_status IN ('pending', 'validated', 'rejected'));
    END IF;
    
    -- Add validated_by if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'lead_purchase_requests' 
        AND column_name = 'validated_by'
    ) THEN
        ALTER TABLE public.lead_purchase_requests 
        ADD COLUMN validated_by uuid REFERENCES public.profiles(id) ON DELETE SET NULL;
    END IF;
    
    -- Add validated_at if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'lead_purchase_requests' 
        AND column_name = 'validated_at'
    ) THEN
        ALTER TABLE public.lead_purchase_requests 
        ADD COLUMN validated_at timestamptz;
    END IF;
    
    -- Add validation_notes if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'lead_purchase_requests' 
        AND column_name = 'validation_notes'
    ) THEN
        ALTER TABLE public.lead_purchase_requests 
        ADD COLUMN validation_notes text;
    END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_lead_purchase_requests_validation_status ON public.lead_purchase_requests(validation_status);

-- STEP 8: Add auto_assign_rules to projects table
-- ============================================

DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'projects' 
        AND column_name = 'auto_assign_rules'
    ) THEN
        ALTER TABLE public.projects 
        ADD COLUMN auto_assign_rules jsonb DEFAULT '{}'::jsonb;
    END IF;
END $$;

-- STEP 9: Enable RLS on new tables
-- ============================================

ALTER TABLE public.ad_integrations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.lead_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.wallet_topup_requests ENABLE ROW LEVEL SECURITY;

-- STEP 10: Create RLS Policies
-- ============================================

-- Ad Integrations: Only admins can view/manage
CREATE POLICY "Admins can manage ad integrations"
    ON public.ad_integrations
    FOR ALL
    USING (
        EXISTS (
            SELECT 1 FROM public.profiles 
            WHERE id = auth.uid() AND role IN ('admin', 'support')
        )
    );

-- Lead Requests: Users can view/create their own
CREATE POLICY "Users can view their own lead requests"
    ON public.lead_requests
    FOR SELECT
    USING (user_id = auth.uid() OR EXISTS (
        SELECT 1 FROM public.profiles 
        WHERE id = auth.uid() AND role IN ('admin', 'support')
    ));

CREATE POLICY "Users can create their own lead requests"
    ON public.lead_requests
    FOR INSERT
    WITH CHECK (user_id = auth.uid());

CREATE POLICY "Admins can update lead requests"
    ON public.lead_requests
    FOR UPDATE
    USING (EXISTS (
        SELECT 1 FROM public.profiles 
        WHERE id = auth.uid() AND role IN ('admin', 'support')
    ));

-- Wallet Topup Requests: Users can view/create their own
CREATE POLICY "Users can view their own wallet topup requests"
    ON public.wallet_topup_requests
    FOR SELECT
    USING (user_id = auth.uid() OR EXISTS (
        SELECT 1 FROM public.profiles 
        WHERE id = auth.uid() AND role IN ('admin', 'support')
    ));

CREATE POLICY "Users can create their own wallet topup requests"
    ON public.wallet_topup_requests
    FOR INSERT
    WITH CHECK (user_id = auth.uid());

CREATE POLICY "Admins can update wallet topup requests"
    ON public.wallet_topup_requests
    FOR UPDATE
    USING (EXISTS (
        SELECT 1 FROM public.profiles 
        WHERE id = auth.uid() AND role IN ('admin', 'support')
    ));

-- STEP 11: Create updated_at triggers
-- ============================================

CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Add triggers for updated_at
DROP TRIGGER IF EXISTS update_ad_integrations_updated_at ON public.ad_integrations;
CREATE TRIGGER update_ad_integrations_updated_at
    BEFORE UPDATE ON public.ad_integrations
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

DROP TRIGGER IF EXISTS update_lead_requests_updated_at ON public.lead_requests;
CREATE TRIGGER update_lead_requests_updated_at
    BEFORE UPDATE ON public.lead_requests
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

DROP TRIGGER IF EXISTS update_wallet_topup_requests_updated_at ON public.wallet_topup_requests;
CREATE TRIGGER update_wallet_topup_requests_updated_at
    BEFORE UPDATE ON public.wallet_topup_requests
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

-- ============================================
-- VERIFICATION
-- ============================================

SELECT '✅ Database schema updated successfully!' as status,
       (SELECT COUNT(*) FROM information_schema.columns WHERE table_name = 'projects' AND column_name = 'project_code') as project_code_added,
       (SELECT COUNT(*) FROM information_schema.columns WHERE table_name = 'leads' AND column_name = 'integration_id') as integration_id_added,
       (SELECT COUNT(*) FROM information_schema.tables WHERE table_name = 'ad_integrations') as ad_integrations_table,
       (SELECT COUNT(*) FROM information_schema.tables WHERE table_name = 'lead_requests') as lead_requests_table,
       (SELECT COUNT(*) FROM information_schema.tables WHERE table_name = 'wallet_topup_requests') as wallet_topup_requests_table;

