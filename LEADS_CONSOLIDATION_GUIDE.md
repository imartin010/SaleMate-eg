# Leads Table Consolidation Guide

## Overview

This guide documents the unified leads table structure and ensures all workflows use the single `leads` table for lead storage.

## Lead Storage Architecture

### Primary Table: `public.leads`

**This is the ONLY table that stores actual lead data (client information, status, etc.)**

All leads from:
- Facebook/Instagram integrations
- Google Ads
- Manual uploads
- Bulk imports
- Other sources

Are stored in the **`leads`** table.

### Supporting Tables (Metadata, Not Lead Storage)

These tables support lead management but do NOT store actual lead data:

1. **`lead_requests`** - User requests for leads when project has 0 available
2. **`lead_purchase_requests`** - Purchase request tracking (payment processing)
3. **`lead_batches`** - Batch information for bulk uploads
4. **`lead_tags`** - Tags for categorizing leads (references `leads.id`)
5. **`lead_reminders`** - Follow-up reminders (references `leads.id`)
6. **`lead_activities`** - Activity log/timeline (references `leads.id`)

## Unified Leads Table Schema

```sql
CREATE TABLE public.leads (
  -- Primary Key
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Client Information
  client_name TEXT NOT NULL,
  client_phone TEXT NOT NULL,
  client_email TEXT,
  client_phone2 TEXT,
  client_phone3 TEXT,
  client_job_title TEXT,
  company_name TEXT,
  
  -- Lead Management
  project_id UUID REFERENCES projects(id) NOT NULL,
  buyer_user_id UUID REFERENCES profiles(id),      -- User who purchased
  assigned_to_id UUID REFERENCES profiles(id),     -- User assigned to work on
  owner_id UUID REFERENCES profiles(id),           -- Original purchaser (for manager assignment)
  upload_user_id UUID REFERENCES profiles(id),     -- User who uploaded (if manual)
  
  -- Lead Status
  stage lead_stage DEFAULT 'New Lead',
  is_sold BOOLEAN DEFAULT false,
  sold_at TIMESTAMPTZ,
  assigned_at TIMESTAMPTZ,
  
  -- Lead Details
  source TEXT CHECK (source IN ('facebook', 'instagram', 'google', 'tiktok', 'snapchat', 'whatsapp')),
  platform platform_type NOT NULL,
  budget NUMERIC(12, 2),
  feedback TEXT,
  cpl_price NUMERIC(10, 2),
  batch_id UUID,
  
  -- CRM Enhancements
  priority TEXT DEFAULT 'normal' CHECK (priority IN ('low', 'normal', 'high', 'urgent')),
  last_contacted_at TIMESTAMPTZ,
  next_followup_at TIMESTAMPTZ,
  
  -- Integration Tracking
  integration_id UUID,  -- For Ads Manager tracking
  
  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);
```

## Workflow Verification

### ✅ 1. Leads Integration (Facebook/Instagram/Google)

**Location**: `supabase/functions/facebook-leads-webhook/index.ts`

**Flow**:
```
Webhook → Edge Function → Insert into `leads` table
```

**Verification**:
- ✅ All integrations insert directly into `leads` table
- ✅ `is_sold = false` initially
- ✅ `buyer_user_id = NULL` until purchased

### ✅ 2. Leads Showing in Shop

**Location**: `supabase/functions/marketplace/index.ts`, `src/pages/Shop/ImprovedShop.tsx`

**Flow**:
```
Query `leads` table WHERE is_sold = false
Group by project_id
Show available leads count
```

**Verification**:
- ✅ Shop queries `leads` table for available leads
- ✅ Filters: `is_sold = false AND buyer_user_id IS NULL`
- ✅ Groups by `project_id` to show counts

### ✅ 3. Leads Purchase

**Location**: `supabase/functions/purchase-leads/index.ts`

**Flow**:
```
1. User selects leads to purchase
2. Payment processed (wallet/card)
3. Update `leads` table:
   - Set `buyer_user_id = user.id`
   - Set `owner_id = user.id`
   - Set `is_sold = true`
   - Set `sold_at = now()`
4. Decrement `projects.available_leads`
```

**Verification**:
- ✅ Purchase function updates `leads` table directly
- ✅ Sets ownership fields correctly
- ✅ Updates project availability

### ✅ 4. Leads at CRM

**Location**: `src/hooks/crm/useLeads.ts`, `src/pages/Admin/Leads.tsx`

**Flow**:
```
Query `leads` table WHERE:
- buyer_user_id = current_user_id OR
- assigned_to_id = current_user_id OR
- owner_id = current_user_id
```

**Verification**:
- ✅ CRM queries `leads` table for user's leads
- ✅ Shows purchased and assigned leads
- ✅ Supports filtering by stage, project, etc.

### ✅ 5. Leads Management at CRM

**Location**: `src/hooks/crm/useLeads.ts`, `src/pages/Admin/Leads.tsx`

**Operations**:
- Update lead stage
- Add feedback
- Assign to team member
- Update client information
- Add tags (via `lead_tags` table)
- Set reminders (via `lead_reminders` table)
- View activity log (via `lead_activities` table)

**Verification**:
- ✅ All updates go to `leads` table
- ✅ Related data in supporting tables
- ✅ RLS policies ensure proper access control

## Migration Steps

1. **Run Migration**: `supabase/migrations/20251113000003_unify_leads_table.sql`
   - Ensures all columns exist
   - Creates necessary indexes
   - Sets up RLS policies
   - Verifies foreign key relationships

2. **Verify Data**: Check that all leads are in `leads` table
   ```sql
   SELECT COUNT(*) FROM public.leads;
   ```

3. **Test Workflows**:
   - ✅ Test Facebook webhook integration
   - ✅ Test shop display
   - ✅ Test lead purchase
   - ✅ Test CRM display
   - ✅ Test CRM management

## Key Points

1. **Single Source of Truth**: `leads` table is the ONLY table storing actual lead data
2. **Supporting Tables**: Tags, reminders, activities are separate for flexibility
3. **Request Tables**: `lead_requests` and `lead_purchase_requests` are for workflow tracking, not lead storage
4. **Batch Tracking**: `lead_batches` tracks bulk uploads, but actual leads go to `leads` table

## RLS Policies

- Users can view their own purchased/assigned leads
- Admins/Managers/Support can view all leads
- Users can update their own leads
- Admins/Support can update all leads
- Authenticated users can create leads (for integrations)

## Indexes

All necessary indexes are created for optimal query performance:
- `idx_leads_buyer_user_id`
- `idx_leads_assigned_to_id`
- `idx_leads_project_id`
- `idx_leads_stage`
- `idx_leads_is_sold`
- `idx_leads_source`
- `idx_leads_platform`
- `idx_leads_created_at`
- And more...

## Success Criteria

✅ All leads stored in single `leads` table  
✅ All workflows use `leads` table  
✅ No duplicate lead storage tables  
✅ All integrations work correctly  
✅ Shop displays available leads  
✅ Purchase workflow functions  
✅ CRM displays and manages leads correctly  

---

**Status**: ✅ Unified and verified  
**Last Updated**: 2025-11-13

