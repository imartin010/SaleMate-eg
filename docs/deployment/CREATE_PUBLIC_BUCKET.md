# Create 'public' Storage Bucket for Banner Images

## The Problem
The banner upload is failing with "Bucket not found" because the `public` storage bucket doesn't exist in your Supabase project.

## Solution: Create the Bucket in Supabase

You **cannot** create storage buckets from Chromium/browser. You need to create it in Supabase Dashboard.

---

## Option 1: Supabase Dashboard (Easiest - Recommended)

### Steps:
1. **Go to Supabase Dashboard**
   - Visit: https://supabase.com/dashboard
   - Select your project (wkxbhvckmgrmdkdkhnqo)

2. **Navigate to Storage**
   - Click **"Storage"** in the left sidebar
   - You'll see a list of existing buckets

3. **Create New Bucket**
   - Click **"New bucket"** button (top right)
   - Configure:
     - **Name**: `public` (exactly this name, lowercase)
     - **Public bucket**: ✅ **CHECKED** (make it public)
     - **File size limit**: `10 MB` (or leave default)
     - **Allowed MIME types**: (leave empty for all types, or add):
       - `image/jpeg`
       - `image/jpg`
       - `image/png`
       - `image/webp`
       - `image/gif`
   - Click **"Create bucket"**

4. **Set up RLS Policies** (Important!)
   After creating, click on the `public` bucket, then go to **"Policies"** tab:

   #### Policy 1: Allow Authenticated Users to Upload
   - Click **"New Policy"**
   - **Policy name**: `Allow authenticated uploads`
   - **Allowed operation**: `INSERT`
   - **Target roles**: `authenticated`
   - **Policy definition**:
   ```sql
   bucket_id = 'public' AND auth.role() = 'authenticated'
   ```

   #### Policy 2: Allow Public Read
   - Click **"New Policy"**
   - **Policy name**: `Allow public read`
   - **Allowed operation**: `SELECT`
   - **Target roles**: `anon, authenticated`
   - **Policy definition**:
   ```sql
   bucket_id = 'public'
   ```

   #### Policy 3: Allow Authenticated Users to Delete (Optional)
   - Click **"New Policy"**
   - **Policy name**: `Allow authenticated delete`
   - **Allowed operation**: `DELETE`
   - **Target roles**: `authenticated`
   - **Policy definition**:
   ```sql
   bucket_id = 'public' AND auth.role() = 'authenticated'
   ```

---

## Option 2: SQL Script (If you have database owner permissions)

If you prefer to create it via SQL, run this in Supabase SQL Editor:

```sql
-- Create the public storage bucket
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'public',
  'public',
  true,  -- Make it public
  10485760,  -- 10 MB limit
  ARRAY['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/gif']
)
ON CONFLICT (id) DO NOTHING;

-- Create RLS policies for public bucket

-- Policy 1: Allow authenticated users to upload
CREATE POLICY IF NOT EXISTS "Allow authenticated uploads"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'public');

-- Policy 2: Allow public read
CREATE POLICY IF NOT EXISTS "Allow public read"
ON storage.objects
FOR SELECT
TO public
USING (bucket_id = 'public');

-- Policy 3: Allow authenticated users to delete
CREATE POLICY IF NOT EXISTS "Allow authenticated delete"
ON storage.objects
FOR DELETE
TO authenticated
USING (bucket_id = 'public');
```

**To run this:**
1. Go to Supabase Dashboard → SQL Editor
2. Paste the SQL above
3. Click **"Run"**

---

## Verification

After creating the bucket:

1. **Check Storage**
   - Go to Storage → `public` bucket
   - You should see it listed

2. **Test Upload**
   - Go back to your banner creation page
   - Try uploading an image again
   - It should work now!

3. **Check Console**
   - The "Bucket not found" error should be gone
   - Upload should succeed

---

## Troubleshooting

### Error: "Bucket already exists"
- The bucket is already created, you're good to go!
- Check if it has the correct policies

### Error: "must be owner of table storage.objects"
- You need to create the bucket via Dashboard UI (Option 1)
- Or ask your database admin to run the SQL script

### Error: "Permission denied"
- Make sure the RLS policies are set up correctly
- Check that `public` is set to public (checked)

### Still getting "Bucket not found"
- Clear browser cache and refresh
- Check the bucket name is exactly `public` (lowercase)
- Verify in Supabase Dashboard that the bucket exists

---

## What This Bucket is Used For

The `public` bucket is used for:
- ✅ Banner images (dashboard banners)
- ✅ CMS media (marketing content images)
- ✅ Any other public assets

All files are stored in the `cms/` folder within this bucket.

---

**After creating the bucket, try uploading your banner image again!** 🎉

