-- ============================================
-- UPDATE LEADS SCHEMA FOR COMPLETE LEAD MANAGEMENT
-- ============================================

-- Add new columns to leads table
ALTER TABLE public.leads 
ADD COLUMN IF NOT EXISTS company_name TEXT,
ADD COLUMN IF NOT EXISTS assigned_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS owner_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
ADD COLUMN IF NOT EXISTS budget NUMERIC(12, 2);

-- Update existing source values to lowercase
UPDATE public.leads 
SET source = LOWER(source) 
WHERE source IS NOT NULL 
AND source NOT IN ('facebook', 'instagram', 'google', 'tiktok', 'snapchat', 'whatsapp');

-- Update common variations
UPDATE public.leads SET source = 'facebook' WHERE LOWER(source) LIKE '%facebook%';
UPDATE public.leads SET source = 'instagram' WHERE LOWER(source) LIKE '%instagram%';
UPDATE public.leads SET source = 'google' WHERE LOWER(source) LIKE '%google%';
UPDATE public.leads SET source = 'tiktok' WHERE LOWER(source) LIKE '%tiktok%';
UPDATE public.leads SET source = 'snapchat' WHERE LOWER(source) LIKE '%snapchat%';
UPDATE public.leads SET source = 'whatsapp' WHERE LOWER(source) LIKE '%whatsapp%';

-- Set any remaining invalid sources to NULL
UPDATE public.leads 
SET source = NULL 
WHERE source IS NOT NULL 
AND source NOT IN ('facebook', 'instagram', 'google', 'tiktok', 'snapchat', 'whatsapp');

-- Update source constraint to include all platforms
ALTER TABLE public.leads DROP CONSTRAINT IF EXISTS leads_source_check;
ALTER TABLE public.leads 
ADD CONSTRAINT leads_source_check 
CHECK (source IS NULL OR source IN ('facebook', 'instagram', 'google', 'tiktok', 'snapchat', 'whatsapp'));

-- Ensure client_phone2 and client_phone3 exist
ALTER TABLE public.leads 
ADD COLUMN IF NOT EXISTS client_phone2 TEXT,
ADD COLUMN IF NOT EXISTS client_phone3 TEXT;

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_leads_owner_id ON public.leads(owner_id);
CREATE INDEX IF NOT EXISTS idx_leads_assigned_at ON public.leads(assigned_at);
CREATE INDEX IF NOT EXISTS idx_leads_source ON public.leads(source);
CREATE INDEX IF NOT EXISTS idx_leads_is_sold ON public.leads(is_sold);
CREATE INDEX IF NOT EXISTS idx_leads_buyer_assigned ON public.leads(buyer_user_id, assigned_to_id);

-- Add comment for budget field
COMMENT ON COLUMN public.leads.budget IS 'Client budget in EGP, filled by user after contacting the client';
COMMENT ON COLUMN public.leads.owner_id IS 'Original purchaser of the lead (for manager assignment tracking)';
COMMENT ON COLUMN public.leads.assigned_at IS 'When the lead was assigned to a team member';
COMMENT ON COLUMN public.leads.company_name IS 'Client company/business name';

-- Update existing leads to set owner_id = buyer_user_id if not set
UPDATE public.leads 
SET owner_id = buyer_user_id 
WHERE owner_id IS NULL AND buyer_user_id IS NOT NULL;

