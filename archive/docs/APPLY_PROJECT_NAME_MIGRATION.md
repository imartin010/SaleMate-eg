# Apply Project Name Migration

## Quick Steps

1. **Open Supabase Dashboard**
   - Go to: https://supabase.com/dashboard
   - Select your project
   - Click **SQL Editor** in the left sidebar

2. **Run the Migration**
   - Click **New Query**
   - Copy **ALL** contents from: `APPLY_PROJECT_NAME_MIGRATION.sql`
   - Paste into the SQL Editor
   - Click **Run** (green button)
   - Wait for success message: "✅ project_name columns added..."

## What This Migration Does

✅ Adds `project_name TEXT` column to `leads` table  
✅ Adds `project_name TEXT` column to `purchase_requests` table  
✅ Backfills existing data with project names  
✅ Creates triggers to auto-update `project_name` when `project_id` changes  
✅ Ensures new leads/requests always have project name  

## Verification

After running, verify with:

```sql
-- Check columns exist
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name IN ('leads', 'purchase_requests') 
AND column_name = 'project_name';

-- Check triggers exist
SELECT trigger_name, event_manipulation, event_object_table
FROM information_schema.triggers
WHERE trigger_name LIKE '%project_name%';

-- Check backfilled data
SELECT COUNT(*) as leads_with_project_name 
FROM leads 
WHERE project_name IS NOT NULL;

SELECT COUNT(*) as requests_with_project_name 
FROM purchase_requests 
WHERE project_name IS NOT NULL;
```

## After Migration

✅ Project names will display correctly in Admin Purchases page  
✅ No more "Unknown" project issues  
✅ Faster queries (no joins needed)  
✅ Automatic population for new entries  

