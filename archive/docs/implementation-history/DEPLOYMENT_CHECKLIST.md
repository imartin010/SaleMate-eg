# SaleMate Backend Deployment Checklist

## 🚀 Pre-Deployment Steps

### 1. Apply Main Migration
```sql
-- Copy and paste the contents of complete_salemate_backend.sql
-- into Supabase SQL Editor: https://supabase.com/dashboard/project/wkxbhvckmgrmdkdkhnqo/sql
```

### 2. Apply Seed Data (Optional)
```sql
-- Copy and paste the contents of seed_data.sql
-- into Supabase SQL Editor after main migration
```

### 3. Regenerate TypeScript Types
```bash
# Run this command in your project root
./regenerate_types.sh
```

## ✅ Validation Checklist

### 1. Auth System Validation
- [ ] **Create a new user** → Check if row appears in `public.profiles`
  ```sql
  SELECT * FROM public.profiles ORDER BY created_at DESC LIMIT 5;
  ```
- [ ] **If profiles not created automatically**, run:
  ```sql
  SELECT public.backfill_profiles();
  ```

### 2. Admin Setup Validation
- [ ] **Create Developer** → Should appear in `public.developers`
  ```sql
  INSERT INTO public.developers (name) VALUES ('Test Developer');
  ```
- [ ] **Create Project** → Should appear in `public.projects`
  ```sql
  INSERT INTO public.projects (developer_id, name, region, description)
  SELECT id, 'Test Project', 'Test Region', 'Test Description'
  FROM public.developers WHERE name='Test Developer';
  ```
- [ ] **Create Lead Batch** → Should appear in `public.lead_batches`
  ```sql
  INSERT INTO public.lead_batches (project_id, batch_name, cpl, created_by)
  SELECT p.id, 'Test Batch', 25.00, (SELECT id FROM public.profiles WHERE role='admin' LIMIT 1)
  FROM public.projects WHERE name='Test Project';
  ```
- [ ] **Upload CSV leads** → Should appear in `public.leads`
- [ ] **Check availability** → `lead_availability` should show positive `available_leads`
  ```sql
  SELECT * FROM public.lead_availability;
  ```

### 3. Purchase Flow Validation
- [ ] **Place order** (>=50 leads) with receipt upload
  ```sql
  -- This should be done via frontend RPC call
  SELECT public.rpc_start_order(
    'project-uuid-here',
    50,
    'Instapay'::payment_method,
    'https://example.com/receipt.jpg',
    'receipt.jpg'
  );
  ```
- [ ] **Check purchase request** → Should appear in `public.lead_purchase_requests` with status 'pending'
  ```sql
  SELECT * FROM public.lead_purchase_requests ORDER BY created_at DESC LIMIT 5;
  ```

### 4. Admin Approval Validation
- [ ] **Approve request** → Should assign leads to buyer
  ```sql
  SELECT public.rpc_approve_request('request-uuid-here', 'Approved for testing');
  ```
- [ ] **Check lead assignment** → Exact number of leads should have `buyer_user_id` set
  ```sql
  SELECT COUNT(*) as assigned_leads 
  FROM public.leads 
  WHERE buyer_user_id IS NOT NULL;
  ```
- [ ] **Check CRM access** → Buyer should see their leads
  ```sql
  SELECT * FROM public.leads 
  WHERE buyer_user_id = 'buyer-uuid-here' 
  ORDER BY created_at DESC;
  ```

### 5. RLS Security Validation
- [ ] **Test user isolation** → Another user cannot query assigned leads
  ```sql
  -- This should return empty for non-admin users
  SELECT * FROM public.leads WHERE buyer_user_id != auth.uid();
  ```

### 6. Storage Validation
- [ ] **Test receipt upload** → Should work with proper folder structure
  ```javascript
  // Frontend test
  const { data, error } = await supabase.storage
    .from('receipts')
    .upload(`receipts/${user.id}/${Date.now()}_test.jpg`, file);
  ```
- [ ] **Test receipt access** → User should only see their own receipts

## 🔧 Frontend Integration Points

### 1. Shop Availability
```typescript
const { data } = await supabase
  .from('lead_availability')
  .select('*');
```

### 2. Upload Receipt
```typescript
const { data, error } = await supabase.storage
  .from('receipts')
  .upload(`receipts/${user.id}/${timestamp}_${file.name}`, file);
```

### 3. Start Order
```typescript
const { data, error } = await supabase.rpc('rpc_start_order', {
  p_project: projectId,
  p_qty: quantity,
  p_payment: paymentMethod,
  p_receipt_url: receiptUrl,
  p_receipt_name: fileName
});
```

### 4. Admin Approve/Reject
```typescript
// Approve
const { data } = await supabase.rpc('rpc_approve_request', {
  p_request: requestId,
  p_admin_notes: 'Approved'
});

// Reject
const { data } = await supabase.rpc('rpc_reject_request', {
  p_request: requestId,
  p_admin_notes: 'Rejected - invalid receipt'
});
```

### 5. CRM (My Leads)
```typescript
const { data } = await supabase
  .from('leads')
  .select('*')
  .eq('buyer_user_id', user.id)
  .order('created_at', { ascending: false });
```

## 🚨 Troubleshooting

### Common Issues
1. **Profiles not created automatically**
   - Run: `SELECT public.backfill_profiles();`

2. **RLS blocking queries**
   - Check user role in profiles table
   - Verify RLS policies are correctly applied

3. **RPC functions not working**
   - Ensure user has proper permissions
   - Check function parameters match expected types

4. **Storage uploads failing**
   - Verify bucket exists and policies are set
   - Check folder structure matches policy requirements

### Debug Queries
```sql
-- Check user profile
SELECT * FROM public.profiles WHERE id = auth.uid();

-- Check RLS policies
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual 
FROM pg_policies 
WHERE schemaname = 'public';

-- Check function permissions
SELECT routine_name, grantee, privilege_type 
FROM information_schema.routine_privileges 
WHERE routine_schema = 'public';
```

## ✅ Success Criteria

- [ ] All validation steps pass
- [ ] Users can register and get profiles automatically
- [ ] Admins can create projects and upload leads
- [ ] Buyers can purchase leads with receipt upload
- [ ] Admins can approve/reject orders
- [ ] Leads are properly assigned to buyers
- [ ] RLS prevents unauthorized access
- [ ] Frontend can integrate with all RPC functions
- [ ] Storage works for receipt uploads

## 📝 Commit Message
```
chore(db): rebuild SaleMate backend (schema+RLS+RPC+storage)

- Complete idempotent migration with all tables
- Strict RLS policies for security
- Typed RPC functions for all operations
- Storage setup for receipt uploads
- Team hierarchy support
- Partner commission system
- Support case management
```

