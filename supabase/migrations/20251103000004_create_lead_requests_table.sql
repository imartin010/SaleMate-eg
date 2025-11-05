-- ============================================
-- CREATE LEAD_REQUESTS TABLE FOR MANUAL REQUESTS
-- ============================================
-- This table stores lead requests from users for specific projects
-- Users can manually enter project names, leads amount, and budget

CREATE TABLE IF NOT EXISTS public.lead_requests (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    project_name text NOT NULL, -- User manually enters project name
    project_id uuid REFERENCES public.projects(id) ON DELETE SET NULL, -- Optional: can be linked later if project exists
    quantity integer NOT NULL CHECK (quantity > 0),
    budget numeric(10, 2) NOT NULL CHECK (budget > 0),
    status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'fulfilled', 'cancelled', 'rejected')),
    notes text,
    fulfilled_at timestamptz,
    created_at timestamptz NOT NULL DEFAULT now(),
    updated_at timestamptz NOT NULL DEFAULT now()
);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_lead_requests_user_id ON public.lead_requests(user_id);
CREATE INDEX IF NOT EXISTS idx_lead_requests_project_id ON public.lead_requests(project_id);
CREATE INDEX IF NOT EXISTS idx_lead_requests_status ON public.lead_requests(status);
CREATE INDEX IF NOT EXISTS idx_lead_requests_created_at ON public.lead_requests(created_at DESC);

-- Enable RLS
ALTER TABLE public.lead_requests ENABLE ROW LEVEL SECURITY;

-- RLS Policies for lead_requests
-- ============================================

-- Users can view their own lead requests
DROP POLICY IF EXISTS "Users can view their own lead requests" ON public.lead_requests;
CREATE POLICY "Users can view their own lead requests"
    ON public.lead_requests
    FOR SELECT
    USING (auth.uid() = user_id);

-- Users can create their own lead requests
DROP POLICY IF EXISTS "Users can create their own lead requests" ON public.lead_requests;
CREATE POLICY "Users can create their own lead requests"
    ON public.lead_requests
    FOR INSERT
    WITH CHECK (auth.uid() = user_id);

-- Admins can view all lead requests
DROP POLICY IF EXISTS "Admins can view all lead requests" ON public.lead_requests;
CREATE POLICY "Admins can view all lead requests"
    ON public.lead_requests
    FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM public.profiles
            WHERE id = auth.uid() AND role = 'admin'
        )
    );

-- Admins can update lead requests
DROP POLICY IF EXISTS "Admins can update lead requests" ON public.lead_requests;
CREATE POLICY "Admins can update lead requests"
    ON public.lead_requests
    FOR UPDATE
    USING (
        EXISTS (
            SELECT 1 FROM public.profiles
            WHERE id = auth.uid() AND role = 'admin'
        )
    );

-- Create trigger to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_lead_requests_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS update_lead_requests_updated_at ON public.lead_requests;
CREATE TRIGGER update_lead_requests_updated_at
    BEFORE UPDATE ON public.lead_requests
    FOR EACH ROW
    EXECUTE FUNCTION update_lead_requests_updated_at();

-- Grant permissions
GRANT SELECT, INSERT, UPDATE ON public.lead_requests TO authenticated;

-- Comment on table
COMMENT ON TABLE public.lead_requests IS 'Stores lead requests from users for specific projects. Users can manually enter project names, leads amount, and budget.';

