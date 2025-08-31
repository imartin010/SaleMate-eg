-- =====================================================
-- Migration: Add Partner Logos
-- =====================================================

BEGIN;

-- Update all partners with proper logo paths
UPDATE partners 
SET 
    logo_path = 'partners-logos/the-address-investments-logo.png',
    updated_at = NOW()
WHERE name = 'The Address Investments';

UPDATE partners 
SET 
    logo_path = 'partners-logos/bold-routes-logo.png',
    updated_at = NOW()
WHERE name = 'Bold Routes';

UPDATE partners 
SET 
    logo_path = 'partners-logos/nawy-partners.png',
    updated_at = NOW()
WHERE name = 'Nawy';

UPDATE partners 
SET 
    logo_path = 'partners-logos/coldwell-banker-logo.png',
    updated_at = NOW()
WHERE name = 'CB Link by Coldwell Banker';

UPDATE partners 
SET 
    logo_path = 'partners-logos/sale_mate_logo.png',
    updated_at = NOW()
WHERE name = 'SaleMate';

-- Create storage bucket for partner logos if it doesn't exist
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types) 
VALUES (
    'partners-logos', 
    'partners-logos', 
    true, 
    5242880, -- 5MB limit
    ARRAY['image/png', 'image/jpeg', 'image/jpg', 'image/svg+xml']
) ON CONFLICT (id) DO NOTHING;

-- Storage policies for partner logos (if they don't exist)
DO $$
BEGIN
    -- Policy for viewing logos
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'objects' 
        AND policyname = 'Anyone can view partner logos'
    ) THEN
        CREATE POLICY "Anyone can view partner logos" ON storage.objects
            FOR SELECT USING (bucket_id = 'partners-logos');
    END IF;

    -- Policy for uploading logos (admin only)
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'objects' 
        AND policyname = 'Only admins can upload partner logos'
    ) THEN
        CREATE POLICY "Only admins can upload partner logos" ON storage.objects
            FOR INSERT WITH CHECK (
                bucket_id = 'partners-logos' AND
                EXISTS (
                    SELECT 1 FROM profiles 
                    WHERE id = auth.uid() 
                    AND role = 'admin'
                )
            );
    END IF;

    -- Policy for updating logos (admin only)
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'objects' 
        AND policyname = 'Only admins can update partner logos'
    ) THEN
        CREATE POLICY "Only admins can update partner logos" ON storage.objects
            FOR UPDATE USING (
                bucket_id = 'partners-logos' AND
                EXISTS (
                    SELECT 1 FROM profiles 
                    WHERE id = auth.uid() 
                    AND role = 'admin'
                )
            );
    END IF;

    -- Policy for deleting logos (admin only)
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'objects' 
        AND policyname = 'Only admins can delete partner logos'
    ) THEN
        CREATE POLICY "Only admins can delete partner logos" ON storage.objects
            FOR DELETE USING (
                bucket_id = 'partners-logos' AND
                EXISTS (
                    SELECT 1 FROM profiles 
                    WHERE id = auth.uid() 
                    AND role = 'admin'
                )
            );
    END IF;
END $$;

COMMIT;
