-- ============================================
-- CREATE PURCHASE_REQUESTS TABLE
-- ============================================
-- This table stores lead purchase requests from users
-- Used for InstaPay and Card payments that require admin approval

CREATE TABLE IF NOT EXISTS public.purchase_requests (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    project_id uuid NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
    quantity integer NOT NULL CHECK (quantity > 0),
    total_amount numeric(10, 2) NOT NULL CHECK (total_amount > 0),
    payment_method text NOT NULL CHECK (payment_method IN ('Instapay', 'Card', 'Wallet')),
    receipt_url text,
    receipt_file_name text,
    status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected', 'completed')),
    admin_notes text,
    approved_by uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
    approved_at timestamptz,
    rejected_at timestamptz,
    rejected_reason text,
    created_at timestamptz NOT NULL DEFAULT now(),
    updated_at timestamptz NOT NULL DEFAULT now()
);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_purchase_requests_user_id ON public.purchase_requests(user_id);
CREATE INDEX IF NOT EXISTS idx_purchase_requests_project_id ON public.purchase_requests(project_id);
CREATE INDEX IF NOT EXISTS idx_purchase_requests_status ON public.purchase_requests(status);
CREATE INDEX IF NOT EXISTS idx_purchase_requests_created_at ON public.purchase_requests(created_at DESC);

-- Enable RLS
ALTER TABLE public.purchase_requests ENABLE ROW LEVEL SECURITY;

-- RLS Policies for purchase_requests
-- ============================================

-- Users can view their own purchase requests
DROP POLICY IF EXISTS "Users can view their own purchase requests" ON public.purchase_requests;
CREATE POLICY "Users can view their own purchase requests"
    ON public.purchase_requests
    FOR SELECT
    USING (
        user_id = auth.uid()
        OR EXISTS (
            SELECT 1 FROM public.profiles 
            WHERE id = auth.uid() 
            AND role IN ('admin', 'support')
        )
    );

-- Users can create purchase requests for themselves
DROP POLICY IF EXISTS "Users can create purchase requests" ON public.purchase_requests;
CREATE POLICY "Users can create purchase requests"
    ON public.purchase_requests
    FOR INSERT
    WITH CHECK (user_id = auth.uid());

-- Admins can update purchase requests
DROP POLICY IF EXISTS "Admins can update purchase requests" ON public.purchase_requests;
CREATE POLICY "Admins can update purchase requests"
    ON public.purchase_requests
    FOR UPDATE
    USING (
        EXISTS (
            SELECT 1 FROM public.profiles 
            WHERE id = auth.uid() 
            AND role IN ('admin', 'support')
        )
    );

-- Create trigger to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_purchase_requests_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_update_purchase_requests_updated_at ON public.purchase_requests;
CREATE TRIGGER trigger_update_purchase_requests_updated_at
    BEFORE UPDATE ON public.purchase_requests
    FOR EACH ROW
    EXECUTE FUNCTION update_purchase_requests_updated_at();

-- Log success
DO $$
BEGIN
  RAISE NOTICE '✅ purchase_requests table created successfully with RLS policies!';
END $$;

