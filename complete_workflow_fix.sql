-- COMPLETE WORKFLOW FIX: UPLOAD → SHOP → PURCHASE → CRM
-- This ensures the entire process works correctly

-- 1) Fix leads table structure first
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

-- 2) Ensure enums exist
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'platform_type') THEN
    CREATE TYPE public.platform_type AS ENUM ('Facebook', 'Google', 'TikTok', 'Other');
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'lead_stage') THEN
    CREATE TYPE public.lead_stage AS ENUM ('New Lead', 'Potential', 'Hot Case', 'Meeting Done', 'No Answer', 'Call Back', 'Whatsapp', 'Wrong Number', 'Non Potential');
  END IF;
END$$;

-- 3) Add enum columns if they don't exist
ALTER TABLE public.leads ADD COLUMN IF NOT EXISTS platform public.platform_type DEFAULT 'Other';
ALTER TABLE public.leads ADD COLUMN IF NOT EXISTS stage public.lead_stage DEFAULT 'New Lead';

-- 4) Update projects table for shop display
ALTER TABLE public.projects ADD COLUMN IF NOT EXISTS available_leads integer DEFAULT 0;
ALTER TABLE public.projects ADD COLUMN IF NOT EXISTS price_per_lead numeric(10,2) DEFAULT 25.00;

-- 5) Create function to update project available_leads count
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

-- 6) Create triggers to automatically update available_leads
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

-- 7) Create a view for shop display (projects with available leads)
CREATE OR REPLACE VIEW public.shop_projects AS
SELECT 
    p.id,
    p.name,
    p.developer,
    p.region,
    p.description,
    COUNT(l.id) FILTER (WHERE l.buyer_user_id IS NULL) as available_leads,
    COALESCE(p.price_per_lead, 25.00) as price_per_lead,
    MIN(lb.cpl_price) as min_cpl,
    MAX(lb.cpl_price) as max_cpl,
    p.created_at,
    p.updated_at
FROM public.projects p
LEFT JOIN public.leads l ON l.project_id = p.id
LEFT JOIN public.lead_batches lb ON lb.project_id = p.id
GROUP BY p.id, p.name, p.developer, p.region, p.description, p.price_per_lead, p.created_at, p.updated_at
HAVING COUNT(l.id) FILTER (WHERE l.buyer_user_id IS NULL) > 0;

-- 8) Grant permissions on the view
GRANT SELECT ON public.shop_projects TO authenticated;
GRANT SELECT ON public.shop_projects TO anon;

-- 9) Create purchase request table if it doesn't exist
CREATE TABLE IF NOT EXISTS public.lead_purchase_requests (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    buyer_user_id uuid NOT NULL REFERENCES public.profiles(id),
    project_id uuid NOT NULL REFERENCES public.projects(id),
    number_of_leads integer NOT NULL CHECK (number_of_leads >= 1),
    cpl_price numeric(10,2) NOT NULL,
    total_price numeric(12,2) NOT NULL,
    payment_method text NOT NULL DEFAULT 'Instapay',
    receipt_file_url text NOT NULL,
    receipt_file_name text,
    status text NOT NULL DEFAULT 'pending',
    admin_notes text,
    approved_at timestamptz,
    rejected_at timestamptz,
    created_at timestamptz NOT NULL DEFAULT now(),
    updated_at timestamptz NOT NULL DEFAULT now()
);

-- 10) Enable RLS on purchase requests
ALTER TABLE public.lead_purchase_requests ENABLE ROW LEVEL SECURITY;

-- Create policies for purchase requests
DROP POLICY IF EXISTS "purchase_requests_select" ON public.lead_purchase_requests;
CREATE POLICY "purchase_requests_select" ON public.lead_purchase_requests
FOR SELECT TO authenticated USING (
    buyer_user_id = auth.uid() OR 
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role IN ('admin', 'support'))
);

DROP POLICY IF EXISTS "purchase_requests_insert" ON public.lead_purchase_requests;
CREATE POLICY "purchase_requests_insert" ON public.lead_purchase_requests
FOR INSERT TO authenticated WITH CHECK (buyer_user_id = auth.uid());

DROP POLICY IF EXISTS "purchase_requests_update" ON public.lead_purchase_requests;
CREATE POLICY "purchase_requests_update" ON public.lead_purchase_requests
FOR UPDATE TO authenticated USING (
    buyer_user_id = auth.uid() OR 
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role IN ('admin', 'support'))
);

-- 11) Create function to assign leads to buyer after approval
CREATE OR REPLACE FUNCTION assign_leads_to_buyer(
    request_id uuid
) RETURNS json AS $$
DECLARE
    request_record record;
    assigned_leads uuid[];
    lead_record record;
BEGIN
    -- Get the purchase request
    SELECT * INTO request_record
    FROM public.lead_purchase_requests
    WHERE id = request_id AND status = 'approved';
    
    IF NOT FOUND THEN
        RETURN json_build_object('success', false, 'error', 'Request not found or not approved');
    END IF;
    
    -- Get available leads for the project
    SELECT ARRAY(
        SELECT l.id
        FROM public.leads l
        WHERE l.project_id = request_record.project_id
        AND l.buyer_user_id IS NULL
        ORDER BY l.created_at ASC
        LIMIT request_record.number_of_leads
        FOR UPDATE SKIP LOCKED
    ) INTO assigned_leads;
    
    -- Check if we have enough leads
    IF array_length(assigned_leads, 1) < request_record.number_of_leads THEN
        RETURN json_build_object(
            'success', false, 
            'error', 'Not enough available leads',
            'available', array_length(assigned_leads, 1),
            'requested', request_record.number_of_leads
        );
    END IF;
    
    -- Assign leads to buyer
    UPDATE public.leads
    SET 
        buyer_user_id = request_record.buyer_user_id,
        is_sold = true,
        sold_at = NOW(),
        cpl_price = request_record.cpl_price
    WHERE id = ANY(assigned_leads);
    
    -- Update the purchase request
    UPDATE public.lead_purchase_requests
    SET 
        status = 'completed',
        updated_at = NOW()
    WHERE id = request_id;
    
    RETURN json_build_object(
        'success', true,
        'assigned_leads', array_length(assigned_leads, 1),
        'lead_ids', assigned_leads
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 12) Grant execute permission on the function
GRANT EXECUTE ON FUNCTION assign_leads_to_buyer(uuid) TO authenticated;

-- 13) Update existing project counts
UPDATE public.projects 
SET available_leads = (
    SELECT COUNT(*) 
    FROM public.leads 
    WHERE project_id = projects.id
    AND buyer_user_id IS NULL
);

-- 14) Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_leads_project_available ON public.leads(project_id) WHERE buyer_user_id IS NULL;
CREATE INDEX IF NOT EXISTS idx_leads_buyer ON public.leads(buyer_user_id) WHERE buyer_user_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_purchase_requests_status ON public.lead_purchase_requests(status);
CREATE INDEX IF NOT EXISTS idx_purchase_requests_buyer ON public.lead_purchase_requests(buyer_user_id);

-- 15) Show workflow status
SELECT 'Complete workflow setup finished!' as status;

-- Show current state
SELECT 
    'Projects with available leads:' as info,
    COUNT(*) as count
FROM public.shop_projects;

SELECT 
    p.name as project,
    p.available_leads,
    COUNT(l.id) as actual_leads
FROM public.projects p
LEFT JOIN public.leads l ON l.project_id = p.id AND l.buyer_user_id IS NULL
GROUP BY p.id, p.name, p.available_leads
ORDER BY p.available_leads DESC;
