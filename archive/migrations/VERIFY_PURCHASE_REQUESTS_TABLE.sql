-- Verify lead_purchase_requests table exists and has correct structure
-- Run this in your Supabase SQL editor

-- Check if lead_purchase_requests table exists
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'lead_purchase_requests'
    ) THEN
        RAISE EXCEPTION 'Table lead_purchase_requests does not exist. Please run the migration first.';
    END IF;
END $$;

-- Ensure RLS is enabled
ALTER TABLE public.lead_purchase_requests ENABLE ROW LEVEL SECURITY;

-- Verify RLS policies exist for admins
DO $$
BEGIN
    -- Check if admin can view all purchase requests policy exists
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE schemaname = 'public' 
        AND tablename = 'lead_purchase_requests'
        AND policyname = 'Users can view their own purchase requests'
    ) THEN
        -- Create policy if it doesn't exist
        CREATE POLICY "Users can view their own purchase requests"
            ON public.lead_purchase_requests
            FOR SELECT
            USING (
                buyer_user_id = auth.uid()
                OR EXISTS (
                    SELECT 1 FROM public.profiles 
                    WHERE id = auth.uid() 
                    AND role IN ('admin', 'support')
                )
            );
    END IF;
END $$;

SELECT '✅ lead_purchase_requests table verified!' as status;

