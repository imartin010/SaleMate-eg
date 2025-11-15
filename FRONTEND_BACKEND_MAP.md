# Frontend-Backend Connectivity Map

This document maps every frontend UI action to its corresponding backend endpoint and database tables.

## Legend
- **Page/Component:** Frontend page or component
- **UI Action:** User action (button click, form submit, etc.)
- **Frontend Handler:** Function that handles the action
- **Backend Endpoint:** API endpoint or database operation
- **Database Tables:** Tables read/written by the operation
- **Status:** ✅ Working | ⚠️ Needs Verification | ❌ Broken

---

## Authentication Flow

| Page/Component | UI Action | Frontend Handler | Backend Endpoint | Database Tables | Status |
|----------------|-----------|-----------------|------------------|-----------------|--------|
| `/auth/signup` | Submit phone number | `sendOTP()` | `POST /functions/v1/otp-request` | `otp_challenges` (write) | ✅ |
| `/auth/signup` | Submit OTP code | `verifyOTP()` | `POST /functions/v1/otp-verify` | `otp_challenges`, `otp_attempts` (read/write) | ✅ |
| `/auth/signup` | Create account after OTP | `signup()` | `supabase.auth.signUp()` + auto profile trigger | `profiles` (write via trigger) | ✅ |
| `/auth/login` | Submit phone/email | `sendOTP()` or `login()` | `POST /functions/v1/otp-request` or `supabase.auth.signInWithPassword()` | `otp_challenges`, `profiles` (read/write) | ✅ |
| `/auth/login` | Submit OTP | `verifyOTP()` | `POST /functions/v1/otp-verify` | `otp_challenges`, `otp_attempts` (read/write) | ✅ |
| `/auth/reset-password` | Request password reset | `resetPassword()` | `supabase.auth.resetPasswordForEmail()` | N/A (email sent) | ✅ |

---

## Home / Dashboard

| Page/Component | UI Action | Frontend Handler | Backend Endpoint | Database Tables | Status |
|----------------|-----------|-----------------|------------------|-----------------|--------|
| `/app/home` | Load dashboard data | `useEffect` / `useQuery` | `supabase.from('projects').select()` | `projects` (read) | ✅ |
| `/app/home` | Load wallet balance | `refreshBalance()` | `supabase.from('profile_wallets').select()` | `profile_wallets` (read) | ✅ |
| `/app/home` | Load banners | `useBanners()` | `supabase.functions.invoke('banners-resolve')` | `dashboard_banners` / `marketing_assets` (read) | ✅ |
| `/app/home` | Top up wallet button | `openTopUpModal()` | Opens modal → `/app/home` top-up flow | N/A | ✅ |
| `/app/home` | View transaction history | `loadTransactions()` | `supabase.from('wallet_entries').select()` | `wallet_entries` (read) | ✅ |

---

## Shop / Marketplace

| Page/Component | UI Action | Frontend Handler | Backend Endpoint | Database Tables | Status |
|----------------|-----------|-----------------|------------------|-----------------|--------|
| `/app/shop` | Load projects | `fetchMarketplaceData()` | `supabase.functions.invoke('marketplace')` | `projects`, `leads` (read via function) | ✅ |
| `/app/shop` | Click "Buy Leads" | `handlePurchase()` | Opens purchase dialog | N/A | ✅ |
| `/app/shop` | Submit purchase (wallet) | `handlePurchase()` | `POST /functions/v1/purchase-leads` | `profile_wallets`, `wallet_entries`, `leads` (read/write) | ✅ |
| `/app/shop` | Submit purchase (card/instapay) | `handlePurchase()` | `supabase.from('purchase_requests').insert()` + upload receipt | `purchase_requests`, `storage.receipts` (write) | ✅ |
| `/app/shop` | Request leads (0 available) | `createLeadRequest()` | `supabase.from('lead_requests').insert()` | `lead_requests` (write) | ✅ |
| `/app/shop` | View my purchase requests | `fetchMyPurchaseRequests()` | `supabase.functions.invoke('marketplace/purchase-requests')` | `purchase_requests` (read) | ✅ |

---

## CRM / Lead Management

| Page/Component | UI Action | Frontend Handler | Backend Endpoint | Database Tables | Status |
|----------------|-----------|-----------------|------------------|-----------------|--------|
| `/app/crm` | Load leads | `useLeads()` hook | `supabase.from('leads').select()` | `leads`, `projects` (read) | ✅ |
| `/app/crm` | Filter leads | `setFilters()` | Client-side filtering | `leads` (read) | ✅ |
| `/app/crm` | Search leads | `handleSearch()` | `supabase.from('leads').select().ilike()` | `leads` (read) | ✅ |
| `/app/crm` | Update lead stage | `updateLeadStage()` | `supabase.from('leads').update()` OR `case-stage-change` function | `leads`, `case_actions`, `lead_events` (write) | ✅ |
| `/app/crm` | Add feedback | `addFeedback()` | `supabase.from('case_feedback').insert()` | `case_feedback`, `lead_events` (write) | ✅ |
| `/app/crm` | Edit lead | `updateLead()` | `supabase.from('leads').update()` | `leads` (write) | ✅ |
| `/app/crm` | Assign lead | `assignLead()` | `supabase.from('leads').update()` OR `case-face-change` function | `leads`, `case_faces`, `lead_transfers` (write) | ✅ |
| `/app/crm` | Delete lead | `deleteLead()` | `supabase.from('leads').delete()` | `leads` (delete) | ⚠️ |
| `/app/crm` | Add new lead | `addLead()` | `supabase.from('leads').insert()` | `leads` (write) | ✅ |
| `/app/crm/case/:leadId` | Load case data | `useCase()` hook | `supabase.from('leads').select()` + related tables | `leads`, `case_feedback`, `case_actions`, `case_faces` (read) | ✅ |
| `/app/crm/case/:leadId` | Change stage | `changeStage()` | `supabase.functions.invoke('case-stage-change')` | `leads`, `case_actions`, `lead_events`, `notifications` (write) | ✅ |
| `/app/crm/case/:leadId` | Change face (assign) | `changeFace()` | `supabase.functions.invoke('case-face-change')` | `leads`, `case_faces`, `lead_transfers` (write) | ✅ |
| `/app/crm/case/:leadId` | Get AI coaching | `getAICoaching()` | `supabase.functions.invoke('case-coach')` | `leads`, `case_feedback` (read) | ✅ |
| `/app/crm/case/:leadId` | Match inventory | `matchInventory()` | `supabase.functions.invoke('inventory-matcher')` | `leads`, `inventory_matches` / `lead_recommendations` (read/write) | ✅ |
| `/app/crm/case/:leadId` | Create action/reminder | `createAction()` | `supabase.functions.invoke('case-actions')` | `case_actions`, `lead_tasks`, `notifications` (write) | ✅ |

---

## Team Management

| Page/Component | UI Action | Frontend Handler | Backend Endpoint | Database Tables | Status |
|----------------|-----------|-----------------|------------------|-----------------|--------|
| `/app/team` | Load team members | `loadTeamMembers()` | `supabase.from('team_members').select()` | `team_members`, `teams`, `profiles` (read) | ✅ |
| `/app/team` | Invite team member | `sendInvitation()` | `supabase.functions.invoke('send-team-invitation')` | `team_invitations` (write) | ✅ |
| `/app/team` | Remove team member | `removeMember()` | `supabase.from('team_members').delete()` | `team_members` (delete) | ⚠️ |
| `/app/team/accept-invitation` | Accept invitation | `acceptInvitation()` | `supabase.from('team_invitations').update()` + `team_members.insert()` | `team_invitations`, `team_members` (write) | ✅ |

---

## Wallet & Payments

| Page/Component | UI Action | Frontend Handler | Backend Endpoint | Database Tables | Status |
|----------------|-----------|-----------------|------------------|-----------------|--------|
| `/app/home` (TopUpModal) | Upload receipt | `handleFileUpload()` | `supabase.storage.from('receipts').upload()` | `storage.receipts` (write) | ✅ |
| `/app/home` (TopUpModal) | Submit top-up request | `submitTopUp()` | `supabase.from('wallet_topup_requests').insert()` | `wallet_topup_requests` (write) | ✅ |
| `/app/home` | View transaction history | `loadTransactions()` | `supabase.from('wallet_entries').select()` | `wallet_entries` (read) | ✅ |
| `/checkout` | Process payment | `processPayment()` | `supabase.functions.invoke('create-kashier-payment')` | `payment_operations`, `payment_transactions` (write) | ✅ |
| `/payment/kashier/callback` | Handle callback | `handleCallback()` | `supabase.functions.invoke('payment-webhook')` | `payment_operations`, `profile_wallets` (read/write) | ✅ |

---

## Support System

| Page/Component | UI Action | Frontend Handler | Backend Endpoint | Database Tables | Status |
|----------------|-----------|-----------------|------------------|-----------------|--------|
| `/app/support` | Load support cases | `loadCases()` | `supabase.from('support_cases').select()` | `support_cases` (read) | ✅ |
| `/app/support` | Create support case | `createCase()` | `supabase.from('support_cases').insert()` | `support_cases` (write) | ✅ |
| `/app/support` | Update case status | `updateCaseStatus()` | `supabase.from('support_cases').update()` | `support_cases` (write) | ✅ |
| `/app/support` | Assign case | `assignCase()` | `supabase.from('support_cases').update()` | `support_cases` (write) | ✅ |
| `/app/support` | Load case threads | `loadThreads()` | `supabase.from('support_threads').select()` | `support_threads`, `support_messages` (read) | ✅ |
| `/app/support` | Send message | `sendMessage()` | `supabase.from('support_messages').insert()` | `support_messages` (write) | ✅ |
| `/contact-support` | Submit contact form | `submitForm()` | `supabase.from('support_cases').insert()` | `support_cases` (write) | ✅ |

---

## Admin Panel

### User Management

| Page/Component | UI Action | Frontend Handler | Backend Endpoint | Database Tables | Status |
|----------------|-----------|-----------------|------------------|-----------------|--------|
| `/app/admin/users` | Load users | `loadUsers()` | `supabase.from('profiles').select()` | `profiles` (read) | ✅ |
| `/app/admin/users` | Create user | `createUser()` | `supabase.functions.invoke('admin-create-user')` | `profiles` (write via function) | ✅ |
| `/app/admin/users` | Update user role | `updateUserRole()` | `supabase.from('profiles').update()` | `profiles` (write) | ✅ |
| `/app/admin/users` | Ban/unban user | `toggleBan()` | `supabase.from('profiles').update()` | `profiles` (write) | ✅ |
| `/app/admin/users` | Delete user | `deleteUser()` | `supabase.from('profiles').delete()` | `profiles` (delete) | ⚠️ |

### Project Management

| Page/Component | UI Action | Frontend Handler | Backend Endpoint | Database Tables | Status |
|----------------|-----------|-----------------|------------------|-----------------|--------|
| `/app/admin/projects` | Load projects | `loadProjects()` | `supabase.from('projects').select()` | `projects` (read) | ✅ |
| `/app/admin/projects` | Create project | `createProject()` | `supabase.from('projects').insert()` | `projects` (write) | ✅ |
| `/app/admin/projects` | Update project | `updateProject()` | `supabase.from('projects').update()` | `projects` (write) | ✅ |
| `/app/admin/projects` | Delete project | `deleteProject()` | `supabase.from('projects').delete()` | `projects` (delete) | ⚠️ |

### Lead Management

| Page/Component | UI Action | Frontend Handler | Backend Endpoint | Database Tables | Status |
|----------------|-----------|-----------------|------------------|-----------------|--------|
| `/app/admin/leads` | Load leads | `loadLeads()` | `supabase.from('leads').select()` | `leads`, `projects` (read) | ✅ |
| `/app/admin/leads` | Filter/search leads | `filterLeads()` | `supabase.from('leads').select().filter()` | `leads` (read) | ✅ |
| `/app/admin/leads/upload` | Upload CSV | `uploadCSV()` | `supabase.functions.invoke('bulk-lead-upload')` | `lead_batches`, `leads` (write) | ✅ |
| `/app/admin/leads/upload` | Check upload status | `checkStatus()` | `supabase.from('lead_batches').select()` | `lead_batches` (read) | ✅ |

### Purchase Requests

| Page/Component | UI Action | Frontend Handler | Backend Endpoint | Database Tables | Status |
|----------------|-----------|-----------------|------------------|-----------------|--------|
| `/app/admin/purchases` | Load purchase requests | `loadRequests()` | `supabase.from('purchase_requests').select()` | `purchase_requests`, `profiles`, `projects` (read) | ✅ |
| `/app/admin/purchases` | Approve request | `approveRequest()` | `supabase.rpc('approve_purchase_request')` OR direct update | `purchase_requests`, `profile_wallets`, `wallet_entries`, `leads` (write) | ✅ |
| `/app/admin/purchases` | Reject request | `rejectRequest()` | `supabase.from('purchase_requests').update()` | `purchase_requests` (write) | ✅ |
| `/app/admin/purchases` | Add admin notes | `addNotes()` | `supabase.from('purchase_requests').update()` | `purchase_requests` (write) | ✅ |

### Wallet Management

| Page/Component | UI Action | Frontend Handler | Backend Endpoint | Database Tables | Status |
|----------------|-----------|-----------------|------------------|-----------------|--------|
| `/app/admin/wallets` | Load top-up requests | `loadTopUpRequests()` | `supabase.from('wallet_topup_requests').select()` | `wallet_topup_requests` (read) | ✅ |
| `/app/admin/wallets` | Approve top-up | `approveTopUp()` | `supabase.from('wallet_topup_requests').update()` + update wallet | `wallet_topup_requests`, `profile_wallets`, `wallet_entries` (write) | ✅ |
| `/app/admin/wallets` | Reject top-up | `rejectTopUp()` | `supabase.from('wallet_topup_requests').update()` | `wallet_topup_requests` (write) | ✅ |
| `/app/admin/wallets` | View wallet balances | `loadWallets()` | `supabase.from('profile_wallets').select()` | `profile_wallets` (read) | ✅ |

### CMS Management

| Page/Component | UI Action | Frontend Handler | Backend Endpoint | Database Tables | Status |
|----------------|-----------|-----------------|------------------|-----------------|--------|
| `/app/admin/cms/banners` | Load banners | `loadBanners()` | `supabase.from('dashboard_banners').select()` OR `marketing_assets` | `dashboard_banners` / `marketing_assets` (read) | ⚠️ |
| `/app/admin/cms/banners` | Create banner | `createBanner()` | `supabase.from('dashboard_banners').insert()` OR `marketing_assets` | `dashboard_banners` / `marketing_assets` (write) | ⚠️ |
| `/app/admin/cms/emails` | Load templates | `loadTemplates()` | `supabase.from('templates_email').select()` | `templates_email` (read) | ✅ |
| `/app/admin/cms/emails` | Update template | `updateTemplate()` | `supabase.from('templates_email').update()` | `templates_email` (write) | ✅ |
| `/app/admin/cms/sms` | Load templates | `loadTemplates()` | `supabase.from('templates_sms').select()` | `templates_sms` (read) | ✅ |
| `/app/admin/cms/sms` | Update template | `updateTemplate()` | `supabase.from('templates_sms').update()` | `templates_sms` (write) | ✅ |
| `/app/admin/cms/settings` | Load settings | `loadSettings()` | `supabase.from('system_settings').select()` | `system_settings` (read) | ✅ |
| `/app/admin/cms/settings` | Update setting | `updateSetting()` | `supabase.functions.invoke('config-update')` | `system_settings` (write) | ✅ |

### Analytics & Reports

| Page/Component | UI Action | Frontend Handler | Backend Endpoint | Database Tables | Status |
|----------------|-----------|-----------------|------------------|-----------------|--------|
| `/app/admin/analytics` | Load analytics | `loadAnalytics()` | `supabase.from('lead_analytics_mv').select()` | `lead_analytics_mv` (read) | ✅ |
| `/app/admin/financial` | Load financial data | `loadFinancial()` | Multiple queries | `purchase_requests`, `wallet_entries`, `payment_operations` (read) | ✅ |

---

## Inventory

| Page/Component | UI Action | Frontend Handler | Backend Endpoint | Database Tables | Status |
|----------------|-----------|-----------------|------------------|-----------------|--------|
| `/app/inventory` | Load inventory | `loadInventory()` | `supabase.from('salemate-inventory').select()` | `salemate-inventory` (read) | ✅ |
| `/app/inventory` | Filter inventory | `filterInventory()` | `supabase.from('salemate-inventory').select().filter()` | `salemate-inventory` (read) | ✅ |
| `/app/inventory` | View property details | `viewDetails()` | `supabase.from('salemate-inventory').select().eq()` | `salemate-inventory` (read) | ✅ |

---

## Partners

| Page/Component | UI Action | Frontend Handler | Backend Endpoint | Database Tables | Status |
|----------------|-----------|-----------------|------------------|-----------------|--------|
| `/app/partners` | Load partners | `loadPartners()` | `supabase.from('partners').select()` | `partners` (read) | ✅ |

---

## Settings

| Page/Component | UI Action | Frontend Handler | Backend Endpoint | Database Tables | Status |
|----------------|-----------|-----------------|------------------|-----------------|--------|
| `/app/settings` | Load profile | `loadProfile()` | `supabase.from('profiles').select()` | `profiles` (read) | ✅ |
| `/app/settings` | Update profile | `updateProfile()` | `supabase.from('profiles').update()` | `profiles` (write) | ✅ |
| `/app/settings` | Update password | `updatePassword()` | `supabase.auth.updateUser()` | N/A (auth) | ✅ |

---

## Known Connectivity Issues

### ⚠️ Needs Verification
1. **Banner System:** Frontend may be using `dashboard_banners` but backend has `marketing_assets` - needs consolidation
2. **Delete Operations:** Some delete operations may not have proper cascade or RLS policies
3. **Team Member Removal:** May need to handle team membership cleanup
4. **Case Manager Integration:** Some case manager features may not be fully connected to the new unified tables (`lead_events`, `lead_tasks`)

### ❌ Potential Broken Connections
1. **Legacy Table References:** Some code may still reference old tables that were consolidated:
   - `user_wallets` → should use `profile_wallets`
   - `wallet_transactions` → should use `wallet_entries`
   - `feedback_history` → should use `lead_events`
   - `lead_reminders` → should use `lead_tasks`
   - `lead_tags` → should use `lead_labels`
   - `case_faces` → should use `lead_transfers`
   - `inventory_matches` → should use `lead_recommendations`
   - `notifications` → should use `notification_events`

2. **Missing Edge Functions:** Some frontend code may call edge functions that don't exist or have wrong names

3. **RLS Policy Issues:** Some operations may fail due to RLS policies not allowing the operation

---

## Recommendations

1. **Audit All API Calls:** Run a comprehensive search for all `supabase.from()`, `supabase.rpc()`, and `supabase.functions.invoke()` calls
2. **Update Legacy References:** Replace all references to consolidated tables with new table names
3. **Test All Flows:** Manually test each workflow end-to-end
4. **Add Error Handling:** Ensure all API calls have proper error handling and user feedback
5. **Consolidate Banner System:** Decide on single banner table (`dashboard_banners` vs `marketing_assets`)
6. **Verify RLS Policies:** Ensure all RLS policies allow necessary operations for each role

---

## Next Steps

1. Fix broken connections identified above
2. Update legacy table references
3. Consolidate database schema (see DB_CONSOLIDATION_PLAN.md)
4. Re-test all flows after consolidation
5. Update this document with verified status

