-- Create wallet_topup_requests table if it doesn't exist
-- Run this in your Supabase SQL editor

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

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_wallet_topup_requests_user_id ON public.wallet_topup_requests(user_id);
CREATE INDEX IF NOT EXISTS idx_wallet_topup_requests_status ON public.wallet_topup_requests(status);
CREATE INDEX IF NOT EXISTS idx_wallet_topup_requests_validated_by ON public.wallet_topup_requests(validated_by);

-- Enable RLS
ALTER TABLE public.wallet_topup_requests ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Users can view their own wallet topup requests" ON public.wallet_topup_requests;
DROP POLICY IF EXISTS "Users can create their own wallet topup requests" ON public.wallet_topup_requests;
DROP POLICY IF EXISTS "Admins can update wallet topup requests" ON public.wallet_topup_requests;

-- Create RLS policies
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

-- Create updated_at trigger
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS update_wallet_topup_requests_updated_at ON public.wallet_topup_requests;
CREATE TRIGGER update_wallet_topup_requests_updated_at
    BEFORE UPDATE ON public.wallet_topup_requests
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

-- Verify table was created
SELECT '✅ wallet_topup_requests table created successfully!' as status;

