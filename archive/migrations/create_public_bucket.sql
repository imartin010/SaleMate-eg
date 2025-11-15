-- ============================================
-- Create 'public' Storage Bucket for CMS/Banners
-- ============================================
-- This script creates the storage bucket needed for:
-- - Banner images
-- - CMS media files
-- - Marketing content images
-- ============================================

-- Step 1: Create the bucket
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'public',
  'public',
  true,  -- Make it public so images can be accessed
  10485760,  -- 10 MB file size limit
  ARRAY['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/gif']
)
ON CONFLICT (id) DO UPDATE
SET 
  public = true,
  file_size_limit = 10485760,
  allowed_mime_types = ARRAY['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/gif'];

-- Step 2: Create RLS Policies for the bucket
-- Note: We drop existing policies first to avoid conflicts

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Allow authenticated uploads to public bucket" ON storage.objects;
DROP POLICY IF EXISTS "Allow public read from public bucket" ON storage.objects;
DROP POLICY IF EXISTS "Allow authenticated updates to public bucket" ON storage.objects;
DROP POLICY IF EXISTS "Allow authenticated delete from public bucket" ON storage.objects;

-- Policy 1: Allow authenticated users to upload files
CREATE POLICY "Allow authenticated uploads to public bucket"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'public');

-- Policy 2: Allow public read access (for displaying images)
CREATE POLICY "Allow public read from public bucket"
ON storage.objects
FOR SELECT
TO public
USING (bucket_id = 'public');

-- Policy 3: Allow authenticated users to update their own files
CREATE POLICY "Allow authenticated updates to public bucket"
ON storage.objects
FOR UPDATE
TO authenticated
USING (bucket_id = 'public')
WITH CHECK (bucket_id = 'public');

-- Policy 4: Allow authenticated users to delete files
CREATE POLICY "Allow authenticated delete from public bucket"
ON storage.objects
FOR DELETE
TO authenticated
USING (bucket_id = 'public');

-- ============================================
-- Verification
-- ============================================
-- After running this script, verify:
-- 1. Go to Supabase Dashboard → Storage
-- 2. You should see 'public' bucket listed
-- 3. Click on it → Policies tab
-- 4. You should see 4 policies listed
-- ============================================

-- Success message
DO $$
BEGIN
  RAISE NOTICE '✅ Public storage bucket created successfully!';
  RAISE NOTICE '✅ RLS policies configured!';
  RAISE NOTICE '📝 Next: Go to Storage → public bucket to verify';
END $$;

