# Purchase Requests System Setup Guide

## ⚠️ IMPORTANT: Run This First!

The admin panel is showing an error because the `purchase_requests` table doesn't exist yet in your database.

---

## 🚀 Quick Setup (2 Steps)

### **Step 1: Create Payment Receipts Storage Bucket**

1. Go to **Supabase Dashboard** → **Storage**
2. Click **"New bucket"**
3. Configure:
   - Name: `payment-receipts`
   - Public: **OFF** (unchecked)
   - File size limit: `5 MB`
4. Click **"Create bucket"**
5. Click on the bucket → **"Policies"** tab → Add these policies:
   
   **Policy 1 - Upload:**
   - Operation: INSERT
   - Target: authenticated
   - Definition: `bucket_id = 'payment-receipts'`
   
   **Policy 2 - View:**
   - Operation: SELECT
   - Target: authenticated
   - Definition: `bucket_id = 'payment-receipts'`

---

### **Step 2: Create Purchase Requests Table**

1. Go to **Supabase Dashboard** → **SQL Editor**
2. Click **"New query"**
3. Copy **ALL** contents from: `create_purchase_requests_system_fixed.sql`
4. Paste into SQL Editor
5. Click **"Run"** (green button)
6. Wait for "Purchase requests system created successfully!" message

---

## ✅ Verification

After running the SQL script:

1. **Refresh your admin panel page** (`localhost:5173/app/admin`)
2. The error should be gone
3. You should see "Purchase Requests" section with "0 Pending"
4. Test by making a purchase with receipt upload

---

## 📝 What Gets Created

### **Database Table:**
- `purchase_requests` - stores all lead purchase requests

### **Columns:**
- `id` - unique ID
- `user_id` - who's buying
- `project_id` - which project
- `quantity` - how many leads
- `total_price` - total amount
- `status` - pending/approved/rejected
- `receipt_url` - path to uploaded receipt
- `created_at` - when requested
- `approved_by` - admin who approved
- `approved_at` - when approved

### **Security (RLS Policies):**
- Users can view their own requests
- Users can create new requests
- Admins can view ALL requests
- Admins can update requests

### **Function:**
- `approve_purchase_request(request_id, quantity)` - Approves and assigns leads

---

## 🔍 Troubleshooting

### Error: "Table already exists"
- Table is already created! Just refresh your admin page.

### Error: "Foreign key constraint"
- Make sure your `projects` table exists first
- The script has fallbacks but works best with existing projects

### Error: "Permission denied"
- You might not have admin permissions
- Contact your database admin

### Admin panel still shows error
1. Hard refresh the page (Cmd+Shift+R on Mac / Ctrl+Shift+F5 on Windows)
2. Check browser console for specific errors
3. Verify SQL script ran successfully

---

## 🎯 Expected Flow After Setup

1. **User** buys leads from shop → uploads InstaPay receipt → submits
2. **System** creates purchase request with "pending" status
3. **Admin** opens admin panel → sees request in "Purchase Requests" section
4. **Admin** reviews buyer info, project, payment, and receipt image
5. **Admin** clicks "Approve & Assign Leads"
6. **System** creates leads and assigns to buyer
7. **Buyer** sees leads in their CRM instantly!

---

## 📞 Need Help?

If you encounter any issues:
1. Check browser console (F12 → Console tab)
2. Check Supabase logs (Dashboard → Logs)
3. Verify all SQL ran without errors
4. Ensure storage bucket is created and has policies

