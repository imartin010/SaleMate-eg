-- ============================================
-- FIX PURCHASE_REQUESTS TABLE
-- ============================================
-- Run this in Supabase SQL Editor to create/fix the purchase_requests table
-- This ensures the table exists with all required columns including payment_method

-- Drop table if exists (only if you want to recreate it)
-- DROP TABLE IF EXISTS public.purchase_requests CASCADE;

-- Create the table if it doesn't exist
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

-- Add payment_method column if it doesn't exist (for existing tables)
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'purchase_requests' 
        AND column_name = 'payment_method'
    ) THEN
        ALTER TABLE public.purchase_requests 
        ADD COLUMN payment_method text CHECK (payment_method IN ('Instapay', 'Card', 'Wallet'));
    END IF;
END $$;

-- Add other missing columns if needed
DO $$ 
BEGIN
    -- Add receipt_file_name if missing
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'purchase_requests' 
        AND column_name = 'receipt_file_name'
    ) THEN
        ALTER TABLE public.purchase_requests 
        ADD COLUMN receipt_file_name text;
    END IF;

    -- Add approved_by if missing
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'purchase_requests' 
        AND column_name = 'approved_by'
    ) THEN
        ALTER TABLE public.purchase_requests 
        ADD COLUMN approved_by uuid REFERENCES public.profiles(id) ON DELETE SET NULL;
    END IF;

    -- Add approved_at if missing
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'purchase_requests' 
        AND column_name = 'approved_at'
    ) THEN
        ALTER TABLE public.purchase_requests 
        ADD COLUMN approved_at timestamptz;
    END IF;

    -- Add rejected_at if missing
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'purchase_requests' 
        AND column_name = 'rejected_at'
    ) THEN
        ALTER TABLE public.purchase_requests 
        ADD COLUMN rejected_at timestamptz;
    END IF;

    -- Add rejected_reason if missing
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'purchase_requests' 
        AND column_name = 'rejected_reason'
    ) THEN
        ALTER TABLE public.purchase_requests 
        ADD COLUMN rejected_reason text;
    END IF;
END $$;

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

-- Verify table structure
SELECT 
    column_name, 
    data_type, 
    is_nullable,
    column_default
FROM information_schema.columns
WHERE table_schema = 'public' 
AND table_name = 'purchase_requests'
ORDER BY ordinal_position;

-- Success message
SELECT '✅ purchase_requests table created/fixed successfully!' as status;

