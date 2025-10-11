# 🔧 Lead Upload Troubleshooting Guide

## 🚨 **Current Issue**
You're getting a "Something went wrong" error when trying to upload leads, with a 400 error in the console.

## 🎯 **Quick Fixes**

### **Option 1: Run Database Fix (Recommended)**
1. **Go to Supabase Dashboard → SQL Editor**
2. **Copy and paste** the contents of `fix_lead_upload.sql`
3. **Click "Run"**
4. **Try uploading leads again**

### **Option 2: Debug in Browser Console**
1. **Open browser console** (F12)
2. **Copy and paste** the contents of `debug_lead_upload.js`
3. **Press Enter**
4. **Check the output** for specific errors

### **Option 3: Check Database Structure**
Run this in Supabase SQL Editor:
```sql
-- Check if leads table exists
SELECT * FROM information_schema.tables 
WHERE table_name = 'leads' AND table_schema = 'public';

-- Check leads table structure
SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_name = 'leads' AND table_schema = 'public';
```

## 🔍 **Common Causes & Solutions**

### **1. Missing Database Tables**
**Symptoms:** 400 error, "relation does not exist"
**Solution:** Run the database setup migration

### **2. RLS (Row Level Security) Issues**
**Symptoms:** 400 error, permission denied
**Solution:** 
```sql
-- Allow service role to insert leads
CREATE POLICY "Service role can insert leads" ON public.leads
  FOR INSERT WITH CHECK (true);
```

### **3. Missing RPC Functions**
**Symptoms:** RPC function not found
**Solution:** The fix script creates the `rpc_upload_leads` function

### **4. Invalid Project ID**
**Symptoms:** Project not found error
**Solution:** Make sure you're selecting a valid project

### **5. Data Validation Issues**
**Symptoms:** Invalid data format
**Solution:** Ensure CSV has required columns:
- `client_name`
- `client_phone`

## 📋 **Step-by-Step Debugging**

### **Step 1: Check Console Logs**
1. **Open browser console** (F12)
2. **Try uploading leads**
3. **Look for detailed error messages**
4. **Note the specific error code and message**

### **Step 2: Verify Database Connection**
```javascript
// Run in browser console
console.log('Supabase URL:', import.meta.env.VITE_SUPABASE_URL);
console.log('Service key available:', !!import.meta.env.VITE_SUPABASE_SERVICE_ROLE_KEY);
```

### **Step 3: Test Basic Database Access**
```javascript
// Run in browser console
const testDB = async () => {
  const { data, error } = await supabaseAdmin.from('projects').select('id, name').limit(1);
  console.log('Projects test:', { data, error });
};
testDB();
```

### **Step 4: Check User Permissions**
- Make sure you're logged in as an admin user
- Check if your user has the correct role in the database

## 🛠️ **Manual Fix Steps**

### **If Database Tables Are Missing:**
1. **Run the main migration** in Supabase SQL Editor
2. **Create leads table** if it doesn't exist:
```sql
CREATE TABLE IF NOT EXISTS public.leads (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  project_id uuid REFERENCES public.projects(id),
  client_name text NOT NULL,
  client_phone text NOT NULL,
  client_phone2 text,
  client_phone3 text,
  client_email text,
  client_job_title text,
  source text DEFAULT 'Other',
  stage text DEFAULT 'New Lead',
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now()
);
```

### **If RLS Policies Are Missing:**
```sql
-- Enable RLS
ALTER TABLE public.leads ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Service role can insert leads" ON public.leads
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Service role can select leads" ON public.leads
  FOR SELECT USING (true);
```

## 🧪 **Testing the Fix**

### **After applying fixes:**
1. **Refresh the admin page**
2. **Try uploading a small test CSV**:
```csv
client_name,client_phone,client_email,platform
John Doe,+201234567890,john@example.com,Facebook
Jane Smith,+201987654321,jane@example.com,Google
```
3. **Check browser console** for success messages
4. **Verify leads appear** in the CRM

## 📞 **If Still Not Working**

### **Check These:**
1. **Environment variables** are set correctly
2. **Supabase project** is active and accessible
3. **User permissions** in Supabase Dashboard
4. **Network connectivity** to Supabase
5. **Browser console** for specific error messages

### **Get More Help:**
1. **Copy the exact error message** from console
2. **Screenshot the error** if possible
3. **Note which step fails** (file upload, validation, or database insert)

## ✅ **Success Indicators**

You'll know it's working when:
- ✅ File uploads without errors
- ✅ CSV validation passes
- ✅ Console shows "Lead upload successful"
- ✅ Leads appear in the CRM
- ✅ No 400 errors in console

The enhanced error handling will now provide much more detailed information about what's going wrong! 🎯
