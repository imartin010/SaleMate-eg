-- Fix infinite recursion in storage policies
-- Drop existing storage policies that reference profiles table
DROP POLICY IF EXISTS "Users can upload deal attachments" ON storage.objects;
DROP POLICY IF EXISTS "Users can view their own deal attachments" ON storage.objects;
DROP POLICY IF EXISTS "Users can update their own deal attachments" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete their own deal attachments" ON storage.objects;

-- Create new storage policies without profiles table dependency
CREATE POLICY "Users can upload deal attachments" ON storage.objects
    FOR INSERT WITH CHECK (
        bucket_id = 'deal-attachments' AND 
        auth.uid() IS NOT NULL
    );

CREATE POLICY "Users can view their own deal attachments" ON storage.objects
    FOR SELECT USING (
        bucket_id = 'deal-attachments' AND 
        auth.uid() IS NOT NULL
    );

CREATE POLICY "Users can update their own deal attachments" ON storage.objects
    FOR UPDATE USING (
        bucket_id = 'deal-attachments' AND 
        auth.uid() IS NOT NULL
    );

CREATE POLICY "Users can delete their own deal attachments" ON storage.objects
    FOR DELETE USING (
        bucket_id = 'deal-attachments' AND 
        auth.uid() IS NOT NULL
    );

-- Also fix any other storage policies that might cause recursion
DROP POLICY IF EXISTS "Users can upload partner logos" ON storage.objects;
DROP POLICY IF EXISTS "Users can view partner logos" ON storage.objects;
DROP POLICY IF EXISTS "Users can update partner logos" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete partner logos" ON storage.objects;

CREATE POLICY "Users can upload partner logos" ON storage.objects
    FOR INSERT WITH CHECK (
        bucket_id = 'partners-logos' AND 
        auth.uid() IS NOT NULL
    );

CREATE POLICY "Users can view partner logos" ON storage.objects
    FOR SELECT USING (
        bucket_id = 'partners-logos'
    );

CREATE POLICY "Users can update partner logos" ON storage.objects
    FOR UPDATE USING (
        bucket_id = 'partners-logos' AND 
        auth.uid() IS NOT NULL
    );

CREATE POLICY "Users can delete partner logos" ON storage.objects
    FOR DELETE USING (
        bucket_id = 'partners-logos' AND 
        auth.uid() IS NOT NULL
    );
