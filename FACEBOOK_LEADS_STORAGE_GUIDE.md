# 📍 Where Facebook Leads Are Stored in Database

## 🎯 **PRIMARY STORAGE: `public.leads` TABLE**

All leads from Facebook integration are stored in the **`leads`** table.

## 📊 **Exact Storage Location:**

```
Database: Your Supabase Database
Schema: public
Table: leads
```

## 🔍 **Fields Set by Facebook Webhook:**

When a lead comes from Facebook (campaign: "013-HydePark"), the webhook inserts into `leads` table with:

### **Required Fields (Always Set):**
- ✅ `project_id` - UUID from projects table (looked up by code "013")
- ✅ `client_name` - From Facebook form field (full_name or name)
- ✅ `client_phone` - From Facebook form field (phone_number or phone)
- ✅ `source` - Set to `'facebook'`
- ✅ `platform` - Set to `'facebook'`
- ✅ `stage` - Set to `'New Lead'`
- ✅ `is_sold` - Set to `false` (not purchased yet)
- ✅ `created_at` - Current timestamp
- ✅ `updated_at` - Current timestamp

### **Optional Fields (Set if Available):**
- ✅ `client_email` - From Facebook form (if provided)
- ✅ `client_job_title` - From Facebook form (if provided)
- ✅ `company_name` - From Facebook form (if provided)

### **Fields Initially NULL (Set Later):**
- ⏳ `owner_id` - NULL initially (set when user purchases lead)
- ⏳ `assigned_to_id` - NULL initially (set when manager assigns to team member)
- ⏳ `assigned_at` - NULL initially (set when assigned)
- ⏳ `budget` - NULL initially (set by user after contacting client)
- ⏳ `buyer_user_id` - NULL initially (set when user purchases lead)
- ⏳ `client_phone2` - NULL (Facebook doesn't provide multiple phones)
- ⏳ `client_phone3` - NULL (Facebook doesn't provide multiple phones)
- ⏳ `sold_at` - NULL (set when lead is purchased)
- ⏳ `feedback` - NULL (set by user after contact)

## 🔄 **Complete Flow:**

```
Facebook Lead Ad Submission
         ↓
Facebook sends webhook to Supabase
         ↓
Edge Function: facebook-leads-webhook
         ↓
Extracts code "013" from campaign name "013-HydePark"
         ↓
Looks up project: WHERE project_code = '013'
         ↓
Fetches lead details from Facebook Graph API
         ↓
INSERT INTO public.leads (
  project_id,           ← From code lookup
  client_name,          ← From Facebook form
  client_phone,         ← From Facebook form
  client_email,         ← From Facebook form
  client_job_title,     ← From Facebook form
  company_name,         ← From Facebook form
  source,               ← 'facebook'
  platform,             ← 'facebook'
  stage,                ← 'New Lead'
  is_sold,              ← false
  created_at,           ← now()
  updated_at            ← now()
)
         ↓
UPDATE projects SET available_leads = available_leads + 1
         ↓
INSERT INTO audit_logs (action: 'create', entity: 'leads')
         ↓
✅ Lead stored in public.leads table
```

## 📍 **Where to View Leads:**

### **1. In CRM (`/app/crm`):**
- Shows leads where `buyer_user_id = current_user_id` OR `assigned_to_id = current_user_id`
- Initially, Facebook leads have `buyer_user_id = NULL`, so they won't appear in CRM until purchased

### **2. In Admin Panel (`/app/admin/leads`):**
- Shows ALL leads (not filtered by user)
- Facebook leads will appear here immediately with:
  - `source = 'facebook'`
  - `is_sold = false`
  - `buyer_user_id = NULL`

### **3. In Shop (`/app/shop`):**
- Facebook leads increment `projects.available_leads`
- Shows as available leads for purchase
- When purchased, `is_sold = true` and `buyer_user_id` is set

## 🔍 **SQL Queries to View Leads:**

### **View All Facebook Leads:**
```sql
SELECT 
  l.id,
  l.client_name,
  l.client_phone,
  l.client_email,
  l.company_name,
  p.name as project_name,
  p.project_code,
  l.source,
  l.stage,
  l.is_sold,
  l.created_at
FROM leads l
JOIN projects p ON l.project_id = p.id
WHERE l.source = 'facebook'
ORDER BY l.created_at DESC;
```

### **View Unpurchased Facebook Leads (Available in Shop):**
```sql
SELECT 
  l.id,
  l.client_name,
  p.name as project_name,
  l.created_at
FROM leads l
JOIN projects p ON l.project_id = p.id
WHERE l.source = 'facebook'
  AND l.is_sold = false
ORDER BY l.created_at DESC;
```

### **View Project Available Leads Count:**
```sql
SELECT 
  name,
  project_code,
  available_leads,
  price_per_lead
FROM projects
WHERE project_code = '013';
```

## 📋 **Lead Lifecycle:**

### **Stage 1: Facebook Lead Submission** ✅
- **Storage**: `public.leads` table
- **Fields**: Basic info only (name, phone, email, job, company)
- **Status**: `is_sold = false`, `buyer_user_id = NULL`
- **Location**: Visible in Admin Panel, NOT in user CRM yet

### **Stage 2: User Purchases Lead** 💰
- **Action**: User buys from Shop
- **Update**: 
  - `is_sold = true`
  - `buyer_user_id = user_id`
  - `sold_at = now()`
- **Location**: Now visible in user's CRM (`/app/crm`)

### **Stage 3: Manager Assigns to Team** 👥
- **Action**: Manager assigns to team member
- **Update**:
  - `assigned_to_id = team_member_id`
  - `assigned_at = now()`
- **Location**: Visible in team member's CRM

### **Stage 4: User Contacts Client** 📞
- **Action**: User adds budget after contact
- **Update**:
  - `budget = amount`
  - `stage = 'Potential'` or other stage
- **Location**: Still in user's CRM

## 📊 **Database Schema Summary:**

```sql
CREATE TABLE public.leads (
  id UUID PRIMARY KEY,
  project_id UUID REFERENCES projects(id),
  client_name TEXT NOT NULL,
  client_phone TEXT NOT NULL,
  client_email TEXT,
  client_phone2 TEXT,
  client_phone3 TEXT,
  client_job_title TEXT,
  company_name TEXT,                    -- ✅ Added for Facebook
  source TEXT CHECK (...),              -- ✅ 'facebook', 'instagram', etc
  platform platform_type,
  stage lead_stage,
  is_sold BOOLEAN DEFAULT false,
  buyer_user_id UUID,                   -- Set when purchased
  assigned_to_id UUID,                  -- Set when manager assigns
  assigned_at TIMESTAMPTZ,              -- ✅ Added for Facebook
  owner_id UUID,                        -- ✅ Added for Facebook
  budget NUMERIC(12, 2),               -- ✅ Added for Facebook (set later)
  feedback TEXT,
  created_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ,
  sold_at TIMESTAMPTZ,
  ...
);
```

## ✅ **Summary:**

**Table**: `public.leads`  
**Primary Key**: `id` (UUID)  
**Foreign Keys**: 
- `project_id` → `projects.id`
- `buyer_user_id` → `profiles.id` (set when purchased)
- `assigned_to_id` → `profiles.id` (set when assigned)
- `owner_id` → `profiles.id` (set when purchased)

**Initial State**: 
- `is_sold = false`
- `buyer_user_id = NULL`
- `source = 'facebook'`
- `stage = 'New Lead'`

**After Purchase**:
- `is_sold = true`
- `buyer_user_id = user_id`
- Lead appears in user's CRM

---

**Location**: `public.leads` table in your Supabase database  
**Status**: ✅ All leads from "013-HydePark" campaign stored here  
**Next Step**: Purchase leads from Shop to assign to users

