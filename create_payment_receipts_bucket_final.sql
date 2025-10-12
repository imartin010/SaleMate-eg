-- Create payment-receipts storage bucket
-- Run this in Supabase SQL Editor

-- Step 1: Create the bucket (if it doesn't exist)
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'payment-receipts', 
  'payment-receipts', 
  false,
  5242880, -- 5MB limit
  ARRAY['image/jpeg', 'image/jpg', 'image/png', 'image/webp']
)
ON CONFLICT (id) DO NOTHING;

-- Step 2: Drop existing policies if they exist (to avoid conflicts)
DROP POLICY IF EXISTS "Users can upload payment receipts" ON storage.objects;
DROP POLICY IF EXISTS "Users can view their payment receipts" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete their payment receipts" ON storage.objects;

-- Step 3: Create RLS Policies

-- Policy 1: Users can upload their own receipts
CREATE POLICY "Users can upload payment receipts"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'payment-receipts'
);

-- Policy 2: Users can view their own receipts
CREATE POLICY "Users can view their payment receipts"
ON storage.objects
FOR SELECT
TO authenticated
USING (
  bucket_id = 'payment-receipts'
);

-- Policy 3: Users can delete their own receipts
CREATE POLICY "Users can delete their payment receipts"
ON storage.objects
FOR DELETE
TO authenticated
USING (
  bucket_id = 'payment-receipts'
);

SELECT 'Payment receipts bucket created successfully!' as status;

