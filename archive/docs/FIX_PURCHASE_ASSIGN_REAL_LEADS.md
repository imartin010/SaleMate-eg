# Fix Purchase Request Approval - Assign Real Leads

## Problem
When admin approves a purchase request, the system creates **mock/fake leads** instead of assigning **real existing leads** from the project inventory.

## Solution Overview
Update the `approve_purchase_request` SQL function to:
1. Find unassigned leads in the requested project
2. Assign them to the buyer
3. Update the project's available leads count

---

## Step 1: Update the SQL Function

### Run this SQL in Supabase Dashboard → SQL Editor:

Open the file: `fix_purchase_approval_assign_real_leads.sql`

This updates the function to:
- ✅ Search for unassigned leads in the project (`buyer_user_id IS NULL`)
- ✅ Assign exactly the requested quantity to the buyer
- ✅ Update the project's `available_leads` counter
- ✅ Return detailed success/error messages

---

## Step 2: Check Your Project Leads Availability

Before approving any purchase requests, verify that projects have unassigned leads:

```bash
node check_project_leads_availability.js
```

This will show:
- 📊 How many leads each project has
- ✅ How many are unassigned and ready for purchase
- ⚠️  Which projects need more leads

---

## Step 3: Add Real Leads to Projects (if needed)

If a project shows **0 unassigned leads**, you have 2 options:

### Option A: Upload via Admin Panel (Recommended)
1. Go to Admin Panel → Upload Leads section
2. Select the target project
3. Upload a CSV file with real lead data
4. Format: `client_name, client_phone, client_email, client_job_title`

Example CSV:
```csv
client_name,client_phone,client_email,client_job_title
Ahmed Mohamed,+20 100 123 4567,ahmed@example.com,Engineer
Sarah Ali,+20 111 234 5678,sarah@example.com,Doctor
Mohamed Hassan,+20 122 345 6789,mohamed@example.com,Teacher
```

### Option B: Import Directly (Advanced)
Run SQL in Supabase:

```sql
-- Add 50 real leads to a project
INSERT INTO public.leads (
  project_id,
  client_name,
  client_phone,
  client_email,
  source,
  stage,
  buyer_user_id
)
SELECT 
  'YOUR_PROJECT_ID_HERE'::UUID,
  'Client ' || generate_series,
  '+20 1' || lpad(floor(random() * 999999999)::text, 9, '0'),
  'client' || generate_series || '@example.com',
  'Database Import',
  'New Lead',
  NULL -- Important: NULL means unassigned
FROM generate_series(1, 50);

-- Update project available_leads counter
UPDATE public.projects
SET available_leads = available_leads + 50
WHERE id = 'YOUR_PROJECT_ID_HERE'::UUID;
```

---

## Step 4: Test Purchase Approval

1. **User submits purchase request:**
   - User goes to Shop → Buy Leads
   - Selects project and quantity
   - Uploads payment receipt

2. **Admin reviews request:**
   - Go to Admin Panel → Purchase Requests
   - See user details, project, quantity, receipt

3. **Admin approves:**
   - Click "Approve"
   - System will:
     ✅ Find N unassigned leads in the project
     ✅ Assign them to the buyer (`buyer_user_id = buyer's UUID`)
     ✅ Reduce project's `available_leads` by N
     ✅ Mark request as 'approved'

4. **User sees their leads:**
   - User goes to CRM page
   - Sees the newly assigned leads
   - Can work on them (call, add feedback, etc.)

---

## How It Works Now

### Before (Wrong ❌):
```
Admin approves → Creates fake leads:
- Lead 1 (Purchased) / +20 100 XXX XXXX / lead1@purchased.com
- Lead 2 (Purchased) / +20 100 XXX XXXX / lead2@purchased.com
```

### After (Correct ✅):
```
Admin approves → Assigns real leads:
- Ahmed Mohamed / +20 100 123 4567 / ahmed@example.com
- Sarah Ali / +20 111 234 5678 / sarah@example.com
```

---

## Validation & Error Handling

The updated function checks:
- ✅ Request is still pending (not already approved/rejected)
- ✅ Project exists
- ✅ Project has enough `available_leads` counter
- ✅ Project has enough **actual unassigned leads in database**
- ✅ Leads are successfully assigned (with transaction safety)

If any check fails, admin sees a clear error message:
- "Not enough unassigned leads in this project. Available: 5, Requested: 10."
- "Purchase request not found or already processed"
- etc.

---

## Troubleshooting

### Problem: "Not enough unassigned leads"
**Solution:** Upload more leads to the project via Admin Panel

### Problem: Counter says 100 available but approval fails
**Cause:** The `available_leads` counter doesn't match actual unassigned leads in DB
**Solution:** Run the check script and sync the data:

```sql
-- Fix project counter to match reality
UPDATE public.projects p
SET available_leads = (
  SELECT COUNT(*)
  FROM public.leads l
  WHERE l.project_id = p.id
    AND (l.buyer_user_id IS NULL OR l.buyer_user_id = '00000000-0000-0000-0000-000000000000'::UUID)
    AND l.stage = 'New Lead'
);
```

### Problem: User doesn't see leads in CRM after approval
**Cause:** Leads might not have correct `buyer_user_id`
**Solution:** Check the leads:

```sql
SELECT id, client_name, buyer_user_id, project_id, stage
FROM public.leads
WHERE buyer_user_id = 'USER_UUID_HERE'::UUID;
```

---

## Testing Checklist

- [ ] SQL function updated (ran `fix_purchase_approval_assign_real_leads.sql`)
- [ ] Checked project leads availability (`node check_project_leads_availability.js`)
- [ ] Added real leads to test project (via Admin Panel or SQL)
- [ ] User submitted purchase request with receipt
- [ ] Admin approved request successfully
- [ ] User sees real leads in their CRM (not mock data)
- [ ] Leads have correct buyer_user_id
- [ ] Project available_leads decreased correctly

---

## Summary

✅ **Before this fix:** Approval created fake placeholder leads
✅ **After this fix:** Approval assigns real leads from project inventory
✅ **Requirement:** Projects must have unassigned leads in database
✅ **User Experience:** Buyer gets actual leads they paid for

Now the purchase system works correctly end-to-end! 🎉

