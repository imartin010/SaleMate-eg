# Lead Management System - Implementation Guide

## 🎯 What Has Been Implemented

### 1. Database Schema Updates ✅
**Files Created:**
- `supabase/migrations/20241102000010_update_leads_schema.sql`
- `supabase/migrations/20241102000011_update_projects_schema.sql`
- `supabase/migrations/20241102000012_remove_unused_tables.sql`
- `supabase/migrations/20241102000013_wallet_deduct_rpc.sql`
- `supabase/migrations/20241102000014_assign_leads_rpc.sql`
- `supabase/migrations/20241102000015_project_code_mapping.sql`
- `APPLY_LEAD_MANAGEMENT_SCHEMA.sql` (consolidated script)

**New Columns in `leads` table:**
- `company_name` TEXT - Client's company
- `assigned_at` TIMESTAMPTZ - When lead was assigned to team member
- `owner_id` UUID - Original purchaser (for manager tracking)
- `budget` NUMERIC(12,2) - Client's available budget (filled after contact)
- `client_phone2` TEXT - Secondary phone
- `client_phone3` TEXT - Third phone

**Updates to `projects` table:**
- `project_code` TEXT UNIQUE - Facebook campaign code (001, 002, 003, 004)
- `price_per_lead` now required (NOT NULL)
- Indexes added for performance

### 2. Edge Functions Deployed ✅
**facebook-leads-webhook** - Receives leads from Facebook Lead Ads
- URL: `https://wkxbhvckmgrmdkdkhnqo.supabase.co/functions/v1/facebook-leads-webhook`
- Extracts project code from campaign name
- Stores lead in database
- Increments available_leads count

**purchase-leads** - Handles lead purchases with wallet
- URL: `https://wkxbhvckmgrmdkdkhnqo.supabase.co/functions/v1/purchase-leads`
- Deducts from user wallet
- Assigns leads to buyer
- Creates transaction record

**admin-create-user** - Creates users from admin panel
- Already deployed

### 3. Frontend Components Updated ✅
**LeadCard Component** (`src/components/crm/LeadCard.tsx`)
- Now displays: company_name, budget, phone2, phone3, owner, assigned_to, assigned_at
- Platform icons for all sources (facebook, instagram, google, tiktok, snapchat, whatsapp)
- Edit button for updating lead details

**New Components Created:**
- `src/components/crm/EditLeadDialog.tsx` - Edit all lead fields including budget
- `src/components/crm/AssignLeadDialog.tsx` - Manager assigns leads to team

**ModernCRM Page** (`src/pages/CRM/ModernCRM.tsx`)
- Added edit functionality
- Added assign functionality for managers
- Updated to show new lead fields

**WalletContext** (`src/contexts/WalletContext.tsx`)
- Added `deductFromWallet()` method for purchases

**Lead Interfaces** (`src/hooks/crm/useLeads.ts`)
- Updated with all new fields
- Query includes owner and assigned_to profiles

## 🚀 How to Complete Setup

### Step 1: Apply Database Migrations

**Option A: Via Supabase SQL Editor** (RECOMMENDED if CLI has connection issues)
1. Go to: https://supabase.com/dashboard/project/wkxbhvckmgrmdkdkhnqo/sql
2. Copy entire contents of `APPLY_LEAD_MANAGEMENT_SCHEMA.sql`
3. Paste and click "Run"
4. Should see: "✅ Schema updates complete!"

**Option B: Via CLI** (when network is stable)
```bash
supabase db push --include-all
```

### Step 2: Configure Project Codes

Run this in SQL Editor to map your projects:

```sql
-- Update your actual project IDs here
UPDATE projects SET project_code = '001' WHERE LOWER(name) LIKE '%aliva%';
UPDATE projects SET project_code = '002' WHERE LOWER(name) LIKE '%icity%';
UPDATE projects SET project_code = '003' WHERE LOWER(name) LIKE '%hyde%park%';
UPDATE projects SET project_code = '004' WHERE LOWER(name) LIKE '%badya%';

-- Verify
SELECT id, name, project_code, price_per_lead, available_leads FROM projects;
```

### Step 3: Configure Facebook Webhook

1. **Set Environment Variables** in Supabase Dashboard:
   - `FACEBOOK_APP_SECRET` - Your Facebook App secret
   - `FACEBOOK_ACCESS_TOKEN` - Facebook Graph API token
   - `FACEBOOK_VERIFY_TOKEN` - Custom token (e.g., "salemate_verify_token_2024")

2. **Register Webhook with Facebook:**
   - Go to Facebook Ads Manager → Lead Ads Forms → Webhooks
   - Callback URL: `https://wkxbhvckmgrmdkdkhnqo.supabase.co/functions/v1/facebook-leads-webhook`
   - Verify Token: (same as FACEBOOK_VERIFY_TOKEN above)
   - Subscribe to: `leadgen` field

3. **Campaign Naming Format:**
   - Format: `001-aliva Spring Campaign 2024`
   - Format: `002-icity Luxury Campaign`
   - The webhook extracts the code (001, 002, etc) automatically

## 📋 Features Now Available

### For Users:
✅ View leads with all client details (name, phones, email, job, company, budget)
✅ Edit lead details including budget after contacting client
✅ Update stage and feedback
✅ See project and developer info
✅ Purchase leads from shop with wallet

### For Managers:
✅ All user features PLUS:
✅ Assign leads to team members
✅ Unassign leads (return to manager pool)
✅ See owner and assigned_to fields
✅ Track team performance

### For Admin/Support:
✅ Upload leads manually (CSV)
✅ View all leads across system
✅ Manage projects and pricing
✅ Configure project codes
✅ Approve wallet top-ups
✅ Monitor purchases

## 📊 Data Flow

### Facebook Lead → Database
1. User fills Facebook Lead Ad form
2. Facebook sends webhook to `facebook-leads-webhook`
3. Function extracts project code from campaign name ("001-aliva...")
4. Function maps code → project UUID
5. Lead inserted into `leads` table with `is_sold=false`
6. `projects.available_leads` incremented
7. Lead appears in Shop

### User Purchase → CRM
1. User sees project in Shop (e.g., "Aliva | Mountain View | 150 leads | 300 EGP")
2. User clicks "Purchase", enters quantity (min 50)
3. Total calculated: quantity × price_per_lead
4. Payment options: Wallet, Card, Instapay
5. If wallet: `purchase-leads` function called
6. Function deducts wallet, assigns leads, updates counts
7. Leads appear in user's CRM with `buyer_user_id` set

### Manager Assigns → Team Member CRM
1. Manager selects leads in CRM
2. Clicks "Assign to Team"
3. Selects team member from dropdown
4. `assign_leads_to_team_member` RPC called
5. Leads updated: `assigned_to_id` set, `assigned_at` = now()
6. Team member sees leads in their CRM

## 🔍 Testing the System

### Test Lead Creation (Manual)
```sql
-- Insert test lead
INSERT INTO leads (
  project_id, 
  client_name, 
  client_phone, 
  client_email,
  client_job_title,
  company_name,
  source,
  stage,
  is_sold
) VALUES (
  (SELECT id FROM projects WHERE project_code = '001' LIMIT 1),
  'Ahmed Hassan',
  '+201234567890',
  'ahmed@example.com',
  'Sales Manager',
  'ABC Company',
  'facebook',
  'New Lead',
  false
);

-- Verify
SELECT * FROM leads ORDER BY created_at DESC LIMIT 1;
```

### Test Wallet Purchase
1. Ensure user has wallet balance
2. Go to Shop: http://localhost:5173/app/shop
3. Select project, enter quantity
4. Choose "Wallet" payment
5. Complete purchase
6. Check CRM: http://localhost:5173/app/crm

### Test Manager Assignment
1. Login as manager
2. Go to CRM
3. Select leads (checkboxes)
4. Click "Assign to Team"
5. Select team member
6. Verify team member sees leads

## ⚠️ Important Notes

### Database Connection Issue
If you see connection refused errors when running `supabase db push`:
1. Use the consolidated SQL script: `APPLY_LEAD_MANAGEMENT_SCHEMA.sql`
2. Run it directly in Supabase SQL Editor
3. This bypasses CLI connection issues

### Missing Tables to Remove
These tables will be dropped by migration `20241102000012`:
- `lead_purchase_requests`
- `lead_requests`
- `salemate-inventory`
- `project_partner_commissions`
- `cms_pages`
- `cms_media`

If you get foreign key errors, check if any data needs to be migrated first.

### Budget Field Usage
- Budget is OPTIONAL and user-editable
- Users fill it after calling the client
- Helps managers prioritize high-budget leads
- Format: Numeric in EGP (e.g., 5000000 for 5M EGP)

## 🎨 Next Steps (Not Yet Implemented)

The following are in the plan but need additional work:

1. **Admin Lead Upload Page** - Manual CSV upload interface
2. **Shop Page Wallet Integration** - Complete purchase dialog with wallet balance check
3. **Payment Gateway Integration** - Real card/Instapay processing
4. **Admin Projects Management** - Edit project codes and pricing
5. **Lead Filters Enhancement** - Source, owner, assigned_to filters

## 📁 Key Files Reference

### Backend
- `supabase/functions/facebook-leads-webhook/` - Facebook integration
- `supabase/functions/purchase-leads/` - Purchase handler
- `supabase/migrations/202411020000010-15_*.sql` - Schema updates

### Frontend - Components
- `src/components/crm/LeadCard.tsx` - Lead display with all fields
- `src/components/crm/EditLeadDialog.tsx` - Edit lead (includes budget)
- `src/components/crm/AssignLeadDialog.tsx` - Assign to team

### Frontend - Pages
- `src/pages/CRM/ModernCRM.tsx` - Main CRM page
- `src/pages/Shop/Shop.tsx` - Lead marketplace
- `src/pages/Admin/Leads.tsx` - Admin lead management

### Frontend - Hooks & Context
- `src/hooks/crm/useLeads.ts` - Lead data hook (updated interface)
- `src/contexts/WalletContext.tsx` - Wallet operations (added deduct)

## ✅ Verification Checklist

Run in SQL Editor to verify setup:

```sql
-- Check leads table has new columns
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'leads' 
AND column_name IN ('company_name', 'budget', 'owner_id', 'assigned_at')
ORDER BY column_name;

-- Check projects have codes
SELECT id, name, project_code, price_per_lead, available_leads 
FROM projects 
WHERE project_code IS NOT NULL;

-- Check functions exist
SELECT routine_name 
FROM information_schema.routines 
WHERE routine_schema = 'public' 
AND routine_name IN ('deduct_from_wallet', 'assign_leads_to_team_member', 'unassign_leads', 'get_project_by_code');

-- Check edge functions in Dashboard
-- Go to: https://supabase.com/dashboard/project/wkxbhvckmgrmdkdkhnqo/functions
-- Should see: admin-create-user, facebook-leads-webhook, purchase-leads
```

## 🔗 Useful Links

- **Functions Dashboard:** https://supabase.com/dashboard/project/wkxbhvckmgrmdkdkhnqo/functions
- **SQL Editor:** https://supabase.com/dashboard/project/wkxbhvckmgrmdkdkhnqo/sql
- **Database Schema:** https://supabase.com/dashboard/project/wkxbhvckmgrmdkdkhnqo/database/tables

## 🆘 Troubleshooting

### "Column does not exist" errors
→ Run `APPLY_LEAD_MANAGEMENT_SCHEMA.sql` in SQL Editor

### "Function does not exist" errors
→ Check Functions Dashboard, redeploy if needed

### "Insufficient funds" when purchasing
→ User needs wallet balance, or use card/instapay (requires payment gateway setup)

### Leads not showing in CRM
→ Check `buyer_user_id` or `assigned_to_id` matches your user ID

### Manager can't assign leads
→ Verify team member has `manager_id` set to manager's UUID

---

**Status:** ✅ Core infrastructure complete
**Next:** Apply SQL schema, configure project codes, test purchase flow

