-- FIX LEADS TABLE STRUCTURE AND COMPLETE WORKFLOW
-- This ensures the full workflow: Upload → Shop Display → Purchase → CRM works correctly

-- 1) First, check current leads table structure
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'leads' 
  AND table_schema = 'public'
ORDER BY ordinal_position;

-- 2) Ensure leads table has all required columns for the workflow
ALTER TABLE public.leads ADD COLUMN IF NOT EXISTS batch_id uuid REFERENCES public.lead_batches(id);
ALTER TABLE public.leads ADD COLUMN IF NOT EXISTS upload_user_id uuid REFERENCES public.profiles(id);
ALTER TABLE public.leads ADD COLUMN IF NOT EXISTS assigned_to_id uuid REFERENCES public.profiles(id);
ALTER TABLE public.leads ADD COLUMN IF NOT EXISTS client_phone2 text;
ALTER TABLE public.leads ADD COLUMN IF NOT EXISTS client_phone3 text;
ALTER TABLE public.leads ADD COLUMN IF NOT EXISTS client_job_title text;
ALTER TABLE public.leads ADD COLUMN IF NOT EXISTS source text;
ALTER TABLE public.leads ADD COLUMN IF NOT EXISTS feedback text;
ALTER TABLE public.leads ADD COLUMN IF NOT EXISTS is_sold boolean DEFAULT false;
ALTER TABLE public.leads ADD COLUMN IF NOT EXISTS sold_at timestamptz;
ALTER TABLE public.leads ADD COLUMN IF NOT EXISTS cpl_price numeric(10,2);

-- 3) Ensure enums exist
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'platform_type') THEN
    CREATE TYPE public.platform_type AS ENUM ('Facebook', 'Google', 'TikTok', 'Other');
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'lead_stage') THEN
    CREATE TYPE public.lead_stage AS ENUM ('New Lead', 'Potential', 'Hot Case', 'Meeting Done', 'No Answer', 'Call Back', 'Whatsapp', 'Wrong Number', 'Non Potential');
  END IF;
END$$;

-- 4) Update leads table to use enums if not already
DO $$
BEGIN
    -- Check if platform column is already using the enum
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'leads' 
        AND column_name = 'platform' 
        AND data_type = 'USER-DEFINED'
    ) THEN
        -- Add platform column with enum type
        ALTER TABLE public.leads ADD COLUMN IF NOT EXISTS platform public.platform_type DEFAULT 'Other';
    END IF;
    
    -- Check if stage column is already using the enum
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'leads' 
        AND column_name = 'stage' 
        AND data_type = 'USER-DEFINED'
    ) THEN
        -- Add stage column with enum type
        ALTER TABLE public.leads ADD COLUMN IF NOT EXISTS stage public.lead_stage DEFAULT 'New Lead';
    END IF;
END$$;

-- 5) Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_leads_project_id ON public.leads(project_id);
CREATE INDEX IF NOT EXISTS idx_leads_buyer_user_id ON public.leads(buyer_user_id);
CREATE INDEX IF NOT EXISTS idx_leads_batch_id ON public.leads(batch_id);
CREATE INDEX IF NOT EXISTS idx_leads_available ON public.leads(project_id) WHERE buyer_user_id IS NULL;
CREATE INDEX IF NOT EXISTS idx_leads_stage ON public.leads(stage);
CREATE INDEX IF NOT EXISTS idx_leads_created_at ON public.leads(created_at);

-- 6) Update projects table to track available leads properly
ALTER TABLE public.projects ADD COLUMN IF NOT EXISTS available_leads integer DEFAULT 0;
ALTER TABLE public.projects ADD COLUMN IF NOT EXISTS price_per_lead numeric(10,2) DEFAULT 25.00;

-- 7) Create function to update project available_leads count
CREATE OR REPLACE FUNCTION update_project_available_leads()
RETURNS TRIGGER AS $$
BEGIN
    -- Update the project's available_leads count
    UPDATE public.projects 
    SET available_leads = (
        SELECT COUNT(*) 
        FROM public.leads 
        WHERE project_id = COALESCE(NEW.project_id, OLD.project_id)
        AND buyer_user_id IS NULL
    )
    WHERE id = COALESCE(NEW.project_id, OLD.project_id);
    
    RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

-- 8) Create triggers to automatically update available_leads
DROP TRIGGER IF EXISTS trigger_update_project_leads_on_insert ON public.leads;
CREATE TRIGGER trigger_update_project_leads_on_insert
    AFTER INSERT ON public.leads
    FOR EACH ROW
    EXECUTE FUNCTION update_project_available_leads();

DROP TRIGGER IF EXISTS trigger_update_project_leads_on_update ON public.leads;
CREATE TRIGGER trigger_update_project_leads_on_update
    AFTER UPDATE ON public.leads
    FOR EACH ROW
    EXECUTE FUNCTION update_project_available_leads();

DROP TRIGGER IF EXISTS trigger_update_project_leads_on_delete ON public.leads;
CREATE TRIGGER trigger_update_project_leads_on_delete
    AFTER DELETE ON public.leads
    FOR EACH ROW
    EXECUTE FUNCTION update_project_available_leads();

-- 9) Test insert a sample lead to verify everything works
INSERT INTO public.leads (
    project_id,
    batch_id,
    client_name,
    client_phone,
    client_email,
    client_job_title,
    platform,
    stage,
    source,
    upload_user_id
) VALUES (
    (SELECT id FROM public.projects LIMIT 1),
    (SELECT id FROM public.lead_batches LIMIT 1),
    'Test Client',
    '+201234567890',
    'test@example.com',
    'Test Manager',
    'Other',
    'New Lead',
    'Bulk Upload Test',
    auth.uid()
);

SELECT 'Test lead inserted successfully!' as test_result;

-- 10) Update project available_leads counts for existing data
UPDATE public.projects 
SET available_leads = (
    SELECT COUNT(*) 
    FROM public.leads 
    WHERE project_id = projects.id
    AND buyer_user_id IS NULL
);

-- 11) Show results
SELECT 'Database structure updated successfully!' as status;

SELECT 
    p.name as project_name,
    p.available_leads,
    COUNT(l.id) as actual_leads_count
FROM public.projects p
LEFT JOIN public.leads l ON l.project_id = p.id AND l.buyer_user_id IS NULL
GROUP BY p.id, p.name, p.available_leads
ORDER BY p.name;

-- Clean up test data
DELETE FROM public.leads WHERE client_name = 'Test Client' AND source = 'Bulk Upload Test';
