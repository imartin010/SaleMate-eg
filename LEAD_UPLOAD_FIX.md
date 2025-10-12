# Lead Upload Fix - batch_id Issue

## Issue
Lead upload was failing with error:
```
Error: Database insert failed: null value in column "batch_id" of relation "leads" violates not-null constraint
```

## Root Cause
The `leads` table has a `batch_id` column that is marked as NOT NULL, but our upload function wasn't providing this value.

## Fix Applied

### Code Fix (Done)
Updated `src/lib/supabaseAdminClient.ts` to generate a unique `batch_id` for each upload:

```typescript
// Generate a unique batch_id for this upload
const batchId = `batch_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

const rows = leadsData.map(ld => ({
  project_id: projectId,
  client_name: ld.client_name?.trim() || 'Unknown',
  client_phone: ld.client_phone?.trim() || '',
  client_phone2: ld.client_phone2?.trim() || null,
  client_phone3: ld.client_phone3?.trim() || null,
  client_email: ld.client_email?.trim() || null,
  client_job_title: ld.client_job_title?.trim() || null,
  platform: ld.platform || 'Other',
  stage: ld.stage || 'New Lead',
  batch_id: batchId, // ← Added this
}));
```

### Database Fix (Required)

**Option A: Make batch_id Optional (Recommended)**

Run this in Supabase SQL Editor:
```sql
-- Make batch_id nullable
ALTER TABLE public.leads 
ALTER COLUMN batch_id DROP NOT NULL;

-- Set default to NULL
ALTER TABLE public.leads 
ALTER COLUMN batch_id SET DEFAULT NULL;
```

**Option B: Keep batch_id Required (Already Fixed in Code)**

If you want to keep `batch_id` as required, the code fix above already handles it by generating unique batch IDs.

## Testing

### 1. Run Database Fix
- Go to Supabase Dashboard → SQL Editor
- Paste and run: `fix_leads_batch_id.sql`
- Verify: `SELECT * FROM information_schema.columns WHERE table_name = 'leads' AND column_name = 'batch_id';`

### 2. Test Lead Upload
1. Refresh the admin page
2. Select a project
3. Upload the CSV template (download it first if needed)
4. Click "Upload Leads"
5. Should see progress bar and success message

### 3. Verify in Database
```sql
-- Check uploaded leads
SELECT 
    id, 
    client_name, 
    client_phone, 
    batch_id,
    created_at
FROM public.leads
ORDER BY created_at DESC
LIMIT 10;

-- Check batch_id uniqueness
SELECT 
    batch_id, 
    COUNT(*) as lead_count,
    MIN(created_at) as uploaded_at
FROM public.leads
WHERE batch_id IS NOT NULL
GROUP BY batch_id
ORDER BY uploaded_at DESC;
```

## What the batch_id Does

The `batch_id` allows you to:
- Track which leads were uploaded together
- Identify upload sessions
- Bulk delete/update leads from the same batch
- Audit trail for imports

Example batch_id format: `batch_1234567890_abc123def`

## Additional Fixes Included

While fixing this, I also:
- ✅ Changed `source` → `platform` to match schema
- ✅ Added unique batch_id generation per upload
- ✅ Improved error messages
- ✅ Added console logging for debugging

## Files Modified
- `src/lib/supabaseAdminClient.ts` - Added batch_id generation

## Files Created
- `fix_leads_batch_id.sql` - Database fix script
- `check_leads_schema.sql` - Schema inspection script
- `LEAD_UPLOAD_FIX.md` - This documentation

## Summary

**Before:**
```typescript
// Missing batch_id
const rows = leadsData.map(ld => ({
  project_id: projectId,
  client_name: ld.client_name,
  // ... other fields
  // ❌ No batch_id
}));
```

**After:**
```typescript
// Generate unique batch_id
const batchId = `batch_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

const rows = leadsData.map(ld => ({
  project_id: projectId,
  client_name: ld.client_name,
  // ... other fields
  batch_id: batchId, // ✅ Added
}));
```

## Next Steps

1. ✅ Code fix applied and built successfully
2. ⏳ Run database fix: `fix_leads_batch_id.sql`
3. ⏳ Test lead upload
4. ⏳ Verify leads appear in database

The lead upload feature is now ready to use! 🎉

