# Payment Receipts Storage Bucket Setup

## Option 1: Create via Supabase Dashboard (Recommended)

### Steps:
1. Go to Supabase Dashboard: https://supabase.com/dashboard
2. Select your project
3. Go to **Storage** in the left sidebar
4. Click **"New bucket"**
5. Configure the bucket:
   - **Name**: `payment-receipts`
   - **Public**: `OFF` (unchecked)
   - **File size limit**: `5 MB`
   - **Allowed MIME types**: `image/jpeg, image/jpg, image/png, image/webp`
6. Click **"Create bucket"**

### Set up RLS Policies:
After creating the bucket, click on it and go to **"Policies"** tab:

#### Policy 1: Allow Upload
- **Policy name**: Users can upload payment receipts
- **Allowed operation**: INSERT
- **Target roles**: authenticated
- **Policy definition**:
```sql
bucket_id = 'payment-receipts'
```

#### Policy 2: Allow View
- **Policy name**: Users can view payment receipts
- **Allowed operation**: SELECT
- **Target roles**: authenticated
- **Policy definition**:
```sql
bucket_id = 'payment-receipts'
```

#### Policy 3: Allow Delete (Optional)
- **Policy name**: Users can delete payment receipts
- **Allowed operation**: DELETE
- **Target roles**: authenticated
- **Policy definition**:
```sql
bucket_id = 'payment-receipts'
```

---

## Option 2: Create via SQL (If you have permissions)

If you have owner permissions on the database, you can run the SQL script:

```bash
# Run the simple SQL script
psql -f create_payment_receipts_bucket_simple.sql
```

Or manually in SQL Editor:
- Copy contents of `create_payment_receipts_bucket_simple.sql`
- Paste into Supabase SQL Editor
- Click "Run"

---

## Verification

After setup, verify by:
1. Go to **Storage** → **payment-receipts**
2. Check that the bucket exists
3. Check that policies are listed
4. Test upload from the checkout page

---

## Troubleshooting

### Error: "must be owner of table objects"
- This means you need to create the bucket via Dashboard UI
- Or ask your database admin to run the script

### Error: "Bucket already exists"
- The bucket is already created, you're good to go!
- Just verify the policies are set up

### Uploads failing with "Policy violation"
- Check that RLS policies are correctly set up
- Verify user is authenticated
- Check bucket name matches exactly: `payment-receipts`

---

## What This Does

When a user uploads an InstaPay receipt:
1. File is validated (type and size)
2. Uploaded to `payment-receipts` bucket
3. Named: `receipt_{userId}_{timestamp}_{filename}`
4. Stored securely with RLS
5. Admin can access all receipts for validation
6. Users can only access their own receipts

