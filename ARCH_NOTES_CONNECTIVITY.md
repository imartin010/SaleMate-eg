# SaleMate Platform - Architecture & Connectivity Notes

## Executive Summary

SaleMate is a B2B SaaS platform for Egyptian real estate lead management. The platform connects brokers with verified property leads through a marketplace, provides CRM tools, team management, and performance tracking.

**Tech Stack:**
- **Frontend:** React 19 + TypeScript, Vite, React Router, Zustand, TanStack Query
- **Backend:** Supabase (PostgreSQL + Edge Functions in Deno)
- **Database:** PostgreSQL with Row Level Security (RLS)
- **Storage:** Supabase Storage for receipts, media, etc.

---

## Main Workflows

### 1. Authentication & User Management
- **Signup:** Phone OTP verification → Create auth user → Auto-create profile
- **Login:** Phone OTP or email/password → Load profile → Set role-based permissions
- **Profile Management:** Update name, email, phone, role (admin only)

**Key Tables:** `profiles`, `otp_challenges`, `otp_attempts`

### 2. Lead Marketplace (Shop)
- **Browse Projects:** List available projects with lead counts and pricing
- **Purchase Leads:** 
  - Wallet payment → Immediate assignment via `purchase-leads` edge function
  - Card/Instapay → Create `purchase_requests` → Admin approval → Assignment
- **Lead Requests:** Request leads when project has 0 available

**Key Tables:** `projects`, `leads`, `purchase_requests`, `lead_requests`, `profile_wallets`, `wallet_entries`

### 3. CRM / Lead Management
- **View Leads:** Filter by project, stage, platform, search
- **Update Lead Stage:** Change stage → Trigger case manager workflows
- **Add Feedback:** Notes and feedback with AI coaching
- **Assign Leads:** Transfer ownership between agents/managers
- **Case Manager:** Advanced workflow with playbooks, AI coaching, inventory matching

**Key Tables:** `leads`, `case_feedback`, `case_actions`, `case_faces`, `lead_events`, `lead_tasks`, `lead_transfers`

### 4. Team Management
- **Invite Members:** Email invitation → Accept → Join team
- **View Team:** List members, performance, hierarchy
- **Manager Hierarchy:** Managers can view and manage their team's leads

**Key Tables:** `profiles`, `teams`, `team_members`, `team_invitations`

### 5. Wallet & Payments
- **Top Up Wallet:** Upload receipt → Create `wallet_topup_requests` → Admin approval → Credit wallet
- **View Balance:** Real-time wallet balance from `profile_wallets`
- **Transaction History:** View `wallet_entries` for deposits, withdrawals, payments

**Key Tables:** `profile_wallets`, `wallet_entries`, `wallet_topup_requests`, `payment_operations`, `payment_transactions`

### 6. Support System
- **Create Case:** User creates support ticket
- **Assign Case:** Support/admin assigns to agent
- **Update Status:** Track case progress (open → in_progress → resolved → closed)
- **Threads & Messages:** Support conversation threads

**Key Tables:** `support_cases`, `support_threads`, `support_messages`

### 7. Admin Panel
- **User Management:** Create, update, ban users, change roles
- **Project Management:** CRUD operations on projects
- **Lead Upload:** Bulk CSV upload → Create `lead_batches` → Process leads
- **Purchase Approvals:** Approve/reject `purchase_requests` and `wallet_topup_requests`
- **Analytics:** View system metrics, lead analytics, financial reports
- **CMS:** Manage banners, email/SMS templates, system settings

**Key Tables:** All tables, plus `lead_batches`, `dashboard_banners`, `cms_pages`, `templates_email`, `templates_sms`, `system_settings`, `feature_flags`, `audit_logs`

### 8. Deals Management
- **Create Deal:** Link lead to property unit → Track deal progress
- **Upload Documents:** Store deal-related files
- **Track Status:** Monitor deal pipeline

**Key Tables:** `deals` (if exists), `leads` (is_sold flag)

---

## Key Frontend Pages / Components

### Public Pages
- `/marketing` - Marketing homepage
- `/ar` - Arabic marketing homepage
- `/auth/login` - Login page
- `/auth/signup` - Signup page
- `/auth/reset-password` - Password reset
- `/public/*` - Legal/compliance pages

### App Pages (Protected)
- `/app` or `/app/home` - Dashboard/home
- `/app/crm` - Lead management (ModernCRM)
- `/app/crm/case/:leadId` - Case manager for specific lead
- `/app/shop` - Lead marketplace
- `/app/inventory` - Property inventory browser
- `/app/deals` - Deals management
- `/app/team` - Team management
- `/app/team/accept-invitation` - Accept team invitation
- `/app/partners` - Partners listing
- `/app/support` - Support panel
- `/app/settings` - User settings

### Admin Pages (Admin role required)
- `/app/admin/dashboard` - Admin dashboard
- `/app/admin/users` - User management
- `/app/admin/projects` - Project management
- `/app/admin/leads` - Lead management
- `/app/admin/leads/upload` - Bulk lead upload
- `/app/admin/purchases` - Purchase request approvals
- `/app/admin/lead-requests` - Lead request management
- `/app/admin/wallets` - Wallet management
- `/app/admin/financial` - Financial reports
- `/app/admin/analytics` - Analytics dashboard
- `/app/admin/cms/*` - CMS management (banners, templates, settings)
- `/app/admin/system/*` - System management (audit logs, feature flags)

---

## Key Backend Routes / Services

### Supabase Edge Functions (Deno)
Located in `supabase/functions/`

1. **Authentication:**
   - `otp-request` - Send OTP via SMS/email
   - `otp-verify` - Verify OTP code
   - `auth-otp` - Combined OTP handler

2. **Lead Management:**
   - `purchase-leads` - Purchase leads with wallet payment
   - `bulk-lead-upload` - Upload CSV and process leads
   - `assign_leads` - Assign leads to users
   - `case-stage-change` - Change lead stage with workflow triggers
   - `case-face-change` - Transfer lead ownership
   - `case-actions` - Manage case actions/reminders
   - `case-coach` - AI coaching recommendations
   - `inventory-matcher` - Match leads to inventory

3. **Marketplace:**
   - `marketplace` - Get marketplace data (projects, availability)
   - `marketplace/purchase-requests` - Get user's purchase requests

4. **Admin:**
   - `admin-create-user` - Create user from admin panel
   - `admin-marketplace` - Admin marketplace operations

5. **Payments:**
   - `create-payment-intent` - Create payment intent
   - `create-kashier-payment` - Create Kashier payment
   - `payment-webhook` / `payment_webhook` - Payment gateway webhooks

6. **Notifications:**
   - `notify-user` - Send notification to user
   - `reminder-scheduler` - Process due reminders (cron)

7. **Support:**
   - `send-team-invitation` - Send team invitation email
   - `send-custom-email` - Send custom email

8. **CMS:**
   - `banners-resolve` - Resolve active banners
   - `cms-preview` - Preview CMS content

9. **Analytics:**
   - `recalc_analytics` - Recalculate analytics

10. **Config:**
    - `config-update` - Update system configuration

### Database RPC Functions
Located in migrations, called via `supabase.rpc()`

- `assign_leads_to_user(project_id, quantity, user_id)` - Assign leads
- `rpc_team_user_ids(root_user_id)` - Get team user IDs
- `update_project_lead_counts()` - Update project lead counts
- `backfill_profiles()` - Backfill profiles from auth users

### Direct Table Access
Frontend uses Supabase client to directly query tables with RLS:
- `supabase.from('table_name').select()`
- `supabase.from('table_name').insert()`
- `supabase.from('table_name').update()`
- `supabase.from('table_name').delete()`

---

## Database Tables Overview

### Core Entities (Keep)
- `profiles` - User profiles (linked to auth.users)
- `projects` - Real estate projects
- `leads` - Lead records
- `partners` - Partner companies
- `support_cases` - Support tickets

### Workflow Tables (Keep/Consolidate)
- `case_feedback` - Lead feedback entries
- `case_actions` - Case actions/reminders
- `case_faces` - Lead ownership transfers
- `lead_events` - Unified event stream
- `lead_tasks` - Actionable tasks
- `lead_transfers` - Transfer history
- `lead_labels` - Lead tags/labels
- `lead_recommendations` - Inventory recommendations

### Commerce Tables (Keep/Consolidate)
- `purchase_requests` - Lead purchase requests
- `lead_requests` - Lead requests when unavailable
- `lead_commerce` - Unified commerce record
- `orders` - Legacy orders table
- `lead_batches` - Lead upload batches

### Wallet & Payments (Keep/Consolidate)
- `profile_wallets` - User wallets
- `wallet_entries` - Wallet transaction ledger
- `wallet_topup_requests` - Top-up requests
- `payment_operations` - Unified payment log
- `payment_transactions` - Legacy payment transactions

### Team & Hierarchy (Keep/Consolidate)
- `teams` - Team groups
- `team_members` - Team membership
- `team_invitations` - Team invitations

### CMS & Configuration (Consolidate)
- `dashboard_banners` - Dashboard banners
- `marketing_assets` - Marketing assets
- `marketing_metrics` - Marketing metrics
- `cms_pages` - CMS pages
- `cms_media` - CMS media
- `templates_email` - Email templates
- `templates_sms` - SMS templates
- `system_settings` - System settings
- `feature_flags` - Feature flags

### Notifications (Consolidate)
- `notifications` - Legacy notifications
- `notification_events` - Unified notification bus

### Audit & Logs (Consolidate)
- `audit_logs` - Audit trail
- `recent_activity` - Recent activity log

### Inventory
- `salemate-inventory` - Property inventory

### Social/Community (Legacy?)
- `posts` - Community posts
- `comments` - Post comments

### OTP & Auth
- `otp_challenges` - OTP challenges
- `otp_attempts` - OTP attempt tracking
- `otp_verifications` - Legacy OTP verifications

### Integrations
- `ad_integrations` - Ad platform integrations

---

## Which Tables Each Flow Touches

### Authentication Flow
- `profiles` (read/write)
- `otp_challenges` (read/write)
- `otp_attempts` (write)

### Lead Purchase Flow
- `projects` (read)
- `purchase_requests` (write) OR direct via `purchase-leads` function
- `profile_wallets` (read/update)
- `wallet_entries` (write)
- `leads` (update - assign buyer_user_id)
- `lead_batches` (read)

### CRM / Lead Management Flow
- `leads` (read/update)
- `case_feedback` (read/write)
- `case_actions` (read/write)
- `case_faces` (read/write)
- `lead_events` (read/write)
- `lead_tasks` (read/write)
- `lead_transfers` (read/write)
- `lead_labels` (read/write)
- `inventory_matches` / `lead_recommendations` (read/write)
- `notifications` / `notification_events` (read/write)

### Team Management Flow
- `profiles` (read/update)
- `teams` (read/write)
- `team_members` (read/write)
- `team_invitations` (read/write)

### Wallet Top-up Flow
- `wallet_topup_requests` (write)
- `profile_wallets` (read/update after approval)
- `wallet_entries` (write after approval)
- `payment_operations` (write)

### Support Flow
- `support_cases` (read/write)
- `support_threads` (read/write)
- `support_messages` (read/write)
- `profiles` (read - for assignment)

### Admin Operations
- All tables (read/write based on operation)
- `audit_logs` (write - for audit trail)

---

## Frontend-Backend Communication Patterns

### 1. Direct Supabase Client Queries
```typescript
const { data, error } = await supabase
  .from('table_name')
  .select('*')
  .eq('column', 'value');
```

### 2. Edge Function Invocations
```typescript
const { data, error } = await supabase.functions.invoke('function-name', {
  body: { ...payload }
});
```

### 3. RPC Function Calls
```typescript
const { data, error } = await supabase.rpc('function_name', {
  param1: value1,
  param2: value2
});
```

### 4. Storage Operations
```typescript
// Upload
const { error } = await supabase.storage
  .from('bucket_name')
  .upload('path/file.jpg', file);

// Download
const { data } = await supabase.storage
  .from('bucket_name')
  .getPublicUrl('path/file.jpg');
```

### 5. Realtime Subscriptions
```typescript
const subscription = supabase
  .channel('table_changes')
  .on('postgres_changes', {
    event: '*',
    schema: 'public',
    table: 'table_name'
  }, (payload) => {
    // Handle change
  })
  .subscribe();
```

---

## Known Architecture Patterns

1. **RLS (Row Level Security):** All tables have RLS policies for data access control
2. **Auto-profile Creation:** Trigger creates profile when auth user is created
3. **Wallet System:** One wallet per profile, ledger-based transactions
4. **Case Manager:** Advanced workflow system with playbooks and AI coaching
5. **Unified Event Stream:** `lead_events` consolidates feedback, activities, stage changes
6. **Commerce Consolidation:** `lead_commerce` unifies purchase requests and lead requests
7. **Team Hierarchy:** Explicit teams with members, replacing manager_id hierarchy
8. **Notification Bus:** `notification_events` for unified notifications

---

## Next Steps

1. Map all frontend actions to backend endpoints (see FRONTEND_BACKEND_MAP.md)
2. Identify broken connections and fix them
3. Consolidate database to max 12 tables (see DB_CONSOLIDATION_PLAN.md)
4. Update all code to use consolidated schema
5. Verify end-to-end connectivity

