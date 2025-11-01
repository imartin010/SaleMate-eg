-- ============================================
-- SCHEMA CONFLICT FIXES
-- Fixes inconsistencies between schema and code
-- ============================================

-- STEP 1: Add missing columns to leads table
-- ============================================

-- Add assigned_to_id if it doesn't exist
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'leads' 
        AND column_name = 'assigned_to_id'
    ) THEN
        ALTER TABLE public.leads 
        ADD COLUMN assigned_to_id uuid REFERENCES public.profiles(id) ON DELETE SET NULL;
        CREATE INDEX IF NOT EXISTS idx_leads_assigned_to_id ON public.leads(assigned_to_id);
    END IF;
END $$;

-- Add upload_user_id if it doesn't exist
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'leads' 
        AND column_name = 'upload_user_id'
    ) THEN
        ALTER TABLE public.leads 
        ADD COLUMN upload_user_id uuid REFERENCES public.profiles(id) ON DELETE SET NULL;
        CREATE INDEX IF NOT EXISTS idx_leads_upload_user_id ON public.leads(upload_user_id);
    END IF;
END $$;

-- Add is_sold if it doesn't exist
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'leads' 
        AND column_name = 'is_sold'
    ) THEN
        ALTER TABLE public.leads 
        ADD COLUMN is_sold boolean NOT NULL DEFAULT false;
    END IF;
END $$;

-- Add sold_at if it doesn't exist
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'leads' 
        AND column_name = 'sold_at'
    ) THEN
        ALTER TABLE public.leads 
        ADD COLUMN sold_at timestamp with time zone;
    END IF;
END $$;

-- Add cpl_price if it doesn't exist
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'leads' 
        AND column_name = 'cpl_price'
    ) THEN
        ALTER TABLE public.leads 
        ADD COLUMN cpl_price numeric;
    END IF;
END $$;

-- Add platform if it doesn't exist (check if enum exists first)
DO $$ 
BEGIN
    -- Check if platform_type enum exists
    IF EXISTS (
        SELECT 1 FROM pg_type WHERE typname = 'platform_type'
    ) THEN
        -- Use enum type
        IF NOT EXISTS (
            SELECT 1 FROM information_schema.columns 
            WHERE table_schema = 'public' 
            AND table_name = 'leads' 
            AND column_name = 'platform'
        ) THEN
            ALTER TABLE public.leads 
            ADD COLUMN platform platform_type;
        END IF;
    ELSE
        -- Use text type if enum doesn't exist
        IF NOT EXISTS (
            SELECT 1 FROM information_schema.columns 
            WHERE table_schema = 'public' 
            AND table_name = 'leads' 
            AND column_name = 'platform'
        ) THEN
            ALTER TABLE public.leads 
            ADD COLUMN platform text;
        END IF;
    END IF;
END $$;

-- STEP 2: Add missing foreign key constraints
-- ============================================

-- Add FK constraint for leads.buyer_user_id if it doesn't exist
-- First, clean up any invalid references
DO $$ 
BEGIN
    -- Drop existing constraint if it exists (might have invalid data)
    IF EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_schema = 'public' 
        AND constraint_name = 'leads_buyer_user_id_fkey'
        AND table_name = 'leads'
    ) THEN
        ALTER TABLE public.leads 
        DROP CONSTRAINT IF EXISTS leads_buyer_user_id_fkey;
    END IF;
    
    -- Clean up orphaned buyer_user_id references
    UPDATE public.leads 
    SET buyer_user_id = NULL 
    WHERE buyer_user_id IS NOT NULL 
    AND buyer_user_id NOT IN (SELECT id FROM public.profiles);
    
    -- Now add the constraint
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_schema = 'public' 
        AND constraint_name = 'leads_buyer_user_id_fkey'
        AND table_name = 'leads'
    ) THEN
        ALTER TABLE public.leads 
        ADD CONSTRAINT leads_buyer_user_id_fkey 
        FOREIGN KEY (buyer_user_id) 
        REFERENCES public.profiles(id) ON DELETE SET NULL;
    END IF;
END $$;

-- Add FK constraint for feedback_history.user_id if it doesn't exist
DO $$ 
BEGIN
    -- Drop existing constraint if it exists
    IF EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_schema = 'public' 
        AND constraint_name = 'feedback_history_user_id_fkey'
        AND table_name = 'feedback_history'
    ) THEN
        ALTER TABLE public.feedback_history 
        DROP CONSTRAINT IF EXISTS feedback_history_user_id_fkey;
    END IF;
    
    -- Clean up orphaned user_id references
    DELETE FROM public.feedback_history 
    WHERE user_id IS NOT NULL 
    AND user_id NOT IN (SELECT id FROM public.profiles);
    
    -- Now add the constraint
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_schema = 'public' 
        AND constraint_name = 'feedback_history_user_id_fkey'
        AND table_name = 'feedback_history'
    ) THEN
        ALTER TABLE public.feedback_history 
        ADD CONSTRAINT feedback_history_user_id_fkey 
        FOREIGN KEY (user_id) 
        REFERENCES public.profiles(id) ON DELETE CASCADE;
    END IF;
END $$;

-- Add FK constraint for lead_purchase_requests.buyer_user_id if it doesn't exist
DO $$ 
BEGIN
    -- Drop existing constraint if it exists
    IF EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_schema = 'public' 
        AND constraint_name = 'lead_purchase_requests_buyer_user_id_fkey'
        AND table_name = 'lead_purchase_requests'
    ) THEN
        ALTER TABLE public.lead_purchase_requests 
        DROP CONSTRAINT IF EXISTS lead_purchase_requests_buyer_user_id_fkey;
    END IF;
    
    -- Clean up orphaned buyer_user_id references
    UPDATE public.lead_purchase_requests 
    SET buyer_user_id = NULL 
    WHERE buyer_user_id IS NOT NULL 
    AND buyer_user_id NOT IN (SELECT id FROM auth.users);
    
    -- Now add the constraint
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_schema = 'public' 
        AND constraint_name = 'lead_purchase_requests_buyer_user_id_fkey'
        AND table_name = 'lead_purchase_requests'
    ) THEN
        ALTER TABLE public.lead_purchase_requests 
        ADD CONSTRAINT lead_purchase_requests_buyer_user_id_fkey 
        FOREIGN KEY (buyer_user_id) 
        REFERENCES auth.users(id) ON DELETE CASCADE;
    END IF;
END $$;

-- STEP 3: Ensure RLS is enabled on all tables
-- ============================================

ALTER TABLE public.leads ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.lead_purchase_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.lead_batches ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.lead_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.feedback_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.support_cases ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.support_case_replies ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_wallets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.wallet_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.developers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.partners ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.project_partner_commissions ENABLE ROW LEVEL SECURITY;

-- STEP 4: Create indexes for performance
-- ============================================

CREATE INDEX IF NOT EXISTS idx_leads_buyer_user_id ON public.leads(buyer_user_id);
CREATE INDEX IF NOT EXISTS idx_leads_project_id ON public.leads(project_id);
CREATE INDEX IF NOT EXISTS idx_leads_batch_id ON public.leads(batch_id);
CREATE INDEX IF NOT EXISTS idx_lead_purchase_requests_buyer_user_id ON public.lead_purchase_requests(buyer_user_id);
CREATE INDEX IF NOT EXISTS idx_lead_purchase_requests_project_id ON public.lead_purchase_requests(project_id);
CREATE INDEX IF NOT EXISTS idx_lead_purchase_requests_status ON public.lead_purchase_requests(status);
CREATE INDEX IF NOT EXISTS idx_feedback_history_user_id ON public.feedback_history(user_id);
CREATE INDEX IF NOT EXISTS idx_feedback_history_lead_id ON public.feedback_history(lead_id);

-- ============================================
-- Migration Complete
-- ============================================

