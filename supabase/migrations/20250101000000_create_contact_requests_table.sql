-- ============================================
-- CREATE CONTACT_REQUESTS TABLE
-- ============================================
-- This table stores contact requests from the marketing homepage
-- Users submit their information and admin contacts them to set up accounts

CREATE TABLE IF NOT EXISTS public.contact_requests (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    name text NOT NULL,
    company_name text NOT NULL,
    phone_number text NOT NULL,
    email text NOT NULL,
    company_size text NOT NULL,
    status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'contacted', 'converted', 'rejected')),
    source text DEFAULT 'marketing_homepage',
    admin_notes text,
    contacted_at timestamptz,
    converted_at timestamptz,
    created_at timestamptz NOT NULL DEFAULT now(),
    updated_at timestamptz NOT NULL DEFAULT now()
);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_contact_requests_status ON public.contact_requests(status);
CREATE INDEX IF NOT EXISTS idx_contact_requests_created_at ON public.contact_requests(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_contact_requests_email ON public.contact_requests(email);

-- Enable RLS
ALTER TABLE public.contact_requests ENABLE ROW LEVEL SECURITY;

-- RLS Policies for contact_requests
-- ============================================

-- Only admins can view all contact requests
DROP POLICY IF EXISTS "Admins can view all contact requests" ON public.contact_requests;
CREATE POLICY "Admins can view all contact requests"
    ON public.contact_requests
    FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM public.profiles
            WHERE profiles.id = auth.uid()
            AND profiles.role = 'admin'
        )
    );

-- Anyone can create contact requests (public form)
DROP POLICY IF EXISTS "Anyone can create contact requests" ON public.contact_requests;
CREATE POLICY "Anyone can create contact requests"
    ON public.contact_requests
    FOR INSERT
    WITH CHECK (true);

-- Only admins can update contact requests
DROP POLICY IF EXISTS "Admins can update contact requests" ON public.contact_requests;
CREATE POLICY "Admins can update contact requests"
    ON public.contact_requests
    FOR UPDATE
    USING (
        EXISTS (
            SELECT 1 FROM public.profiles
            WHERE profiles.id = auth.uid()
            AND profiles.role = 'admin'
        )
    );

COMMENT ON TABLE public.contact_requests IS 'Stores contact requests from marketing homepage for CRM access';
COMMENT ON COLUMN public.contact_requests.status IS 'pending: not contacted yet, contacted: admin reached out, converted: account created, rejected: not interested';

