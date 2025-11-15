# Admin Panel Error Fix

## Issue
The admin panel shows "Error Loading Admin Data - Failed to fetch admin data" when first loaded.

## Root Cause
The `useAdminData` hook was trying to fetch from the `lead_purchase_requests` table which may not exist or have permission issues. The error was causing the entire data fetch to fail.

## Fix Applied

### 1. Graceful Error Handling for Optional Tables
Updated `src/hooks/admin/useAdminData.ts` to handle missing or inaccessible tables gracefully:

```typescript
// Before: Would fail entire fetch if any table errors
const [usersResult, projectsResult, leadsResult, requestsResult] = await Promise.all([
  supabase.from('profiles').select(...),
  supabase.from('projects').select(...),
  supabase.from('leads').select(...),
  supabase.from('lead_purchase_requests').select(...) // This would fail
]);

if (requestsResult.error) throw requestsResult.error; // Throws and stops everything

// After: Catches error and continues with empty data
const [usersResult, projectsResult, leadsResult, requestsResult] = await Promise.all([
  supabase.from('profiles').select(...),
  supabase.from('projects').select(...),
  supabase.from('leads').select(...),
  supabase.from('lead_purchase_requests')
    .select(...)
    .then(res => res)
    .catch(() => ({ data: [], error: null })) // Returns empty array on error
]);

// Don't throw for optional requests table
if (requestsResult && 'error' in requestsResult && requestsResult.error) {
  console.warn('Purchase requests table not available:', requestsResult.error);
}
```

### 2. Better Error Messages
Added specific error messages for each table query:

```typescript
if (usersResult.error) {
  console.error('Error fetching users:', usersResult.error);
  throw new Error(`Failed to fetch users: ${usersResult.error.message}`);
}
if (projectsResult.error) {
  console.error('Error fetching projects:', projectsResult.error);
  throw new Error(`Failed to fetch projects: ${projectsResult.error.message}`);
}
// Now you can see exactly which table failed
```

### 3. Safe Data Mapping
Updated the requests mapping to safely handle missing data:

```typescript
// Before: Would fail if requestsResult is undefined
const fetchedRequests = (requestsResult.data || []).map(...)

// After: Checks for data existence first
const fetchedRequests = (requestsResult && 'data' in requestsResult && requestsResult.data)
  ? requestsResult.data.map(...)
  : [];
```

## Testing

### Quick Test in Browser Console
1. Open the admin page: `http://localhost:5173/app/admin`
2. Open browser console (F12)
3. Paste the contents of `test_admin_queries.js`
4. Check which queries succeed/fail

### Expected Behavior After Fix
- ✅ Admin panel loads successfully
- ✅ Shows users, projects, and leads data
- ✅ Purchase requests section shows 0 if table doesn't exist
- ✅ Detailed console logs show which queries worked
- ✅ Graceful degradation - app works even if some tables are missing

## Database Setup (If Needed)

If you want the purchase requests feature to work, create the table in Supabase:

```sql
-- Create lead_purchase_requests table
CREATE TABLE IF NOT EXISTS public.lead_purchase_requests (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id uuid REFERENCES public.profiles(id) ON DELETE CASCADE,
    project_id uuid REFERENCES public.projects(id) ON DELETE CASCADE,
    lead_count integer NOT NULL,
    total_amount numeric(10, 2) NOT NULL,
    status text DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.lead_purchase_requests ENABLE ROW LEVEL SECURITY;

-- Policy for users to view their own requests
CREATE POLICY "Users can view their own requests"
ON public.lead_purchase_requests FOR SELECT
USING (auth.uid() = user_id);

-- Policy for admins to view all requests
CREATE POLICY "Admins can view all requests"
ON public.lead_purchase_requests FOR SELECT
USING (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin'));

-- Policy for admins to update requests
CREATE POLICY "Admins can update requests"
ON public.lead_purchase_requests FOR UPDATE
USING (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin'));
```

## Verification Steps

1. ✅ Refresh the admin page
2. ✅ Check that stats appear at the top
3. ✅ Verify users, projects, and leads counts are correct
4. ✅ Try expanding each collapsible section
5. ✅ Check browser console for any remaining errors
6. ✅ Test lead upload functionality
7. ✅ Test user role management
8. ✅ Test project management

## Summary

The admin panel now:
- ✅ Loads successfully even if some tables are missing
- ✅ Shows clear error messages for debugging
- ✅ Continues working with available data
- ✅ Gracefully handles missing features
- ✅ Provides better console logging for troubleshooting

The fix ensures the admin panel is resilient and works in various database configurations.

