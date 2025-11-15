# Database Consolidation Plan

## Goal
Consolidate the database schema to a maximum of 12 tables while maintaining all current functionality and workflows.

---

## Current Table Inventory

### Core Entities (Must Keep)
1. `profiles` - User profiles
2. `projects` - Real estate projects
3. `leads` - Lead records
4. `partners` - Partner companies
5. `support_cases` - Support tickets

### Workflow Tables (Can Consolidate)
6. `case_feedback` - Lead feedback
7. `case_actions` - Case actions/reminders
8. `case_faces` - Lead ownership transfers
9. `lead_events` - Unified event stream
10. `lead_tasks` - Actionable tasks
11. `lead_transfers` - Transfer history
12. `lead_labels` - Lead tags/labels
13. `lead_recommendations` - Inventory recommendations
14. `lead_activities` - Legacy activities
15. `lead_tags` - Legacy tags
16. `lead_reminders` - Legacy reminders
17. `feedback_history` - Legacy feedback

### Commerce Tables (Can Consolidate)
18. `purchase_requests` - Lead purchase requests
19. `lead_requests` - Lead requests when unavailable
20. `lead_commerce` - Unified commerce record
21. `orders` - Legacy orders
22. `lead_batches` - Lead upload batches

### Wallet & Payments (Can Consolidate)
23. `profile_wallets` - User wallets
24. `wallet_entries` - Wallet transaction ledger
25. `wallet_topup_requests` - Top-up requests
26. `payment_operations` - Unified payment log
27. `payment_transactions` - Legacy payment transactions
28. `user_wallets` - Legacy wallets
29. `wallet_transactions` - Legacy transactions

### Team & Hierarchy (Can Consolidate)
30. `teams` - Team groups
31. `team_members` - Team membership
32. `team_invitations` - Team invitations

### CMS & Configuration (Can Consolidate)
33. `dashboard_banners` - Dashboard banners
34. `marketing_assets` - Marketing assets
35. `marketing_metrics` - Marketing metrics
36. `cms_pages` - CMS pages
37. `cms_media` - CMS media
38. `templates_email` - Email templates
39. `templates_sms` - SMS templates
40. `system_settings` - System settings
41. `feature_flags` - Feature flags

### Notifications (Can Consolidate)
42. `notifications` - Legacy notifications
43. `notification_events` - Unified notification bus

### Audit & Logs (Can Consolidate)
44. `audit_logs` - Audit trail
45. `recent_activity` - Recent activity log

### Inventory
46. `salemate-inventory` - Property inventory

### Social/Community (Optional)
47. `posts` - Community posts
48. `comments` - Post comments

### OTP & Auth
49. `otp_challenges` - OTP challenges
50. `otp_attempts` - OTP attempt tracking
51. `otp_verifications` - Legacy OTP verifications

### Integrations
52. `ad_integrations` - Ad platform integrations

### Support Threads
53. `support_threads` - Support conversation threads
54. `support_messages` - Support messages

**Total: 54+ tables** → Need to consolidate to **12 tables**

---

## Proposed Final Schema (12 Tables)

### 1. `profiles`
**Purpose:** User profiles and authentication data
**Columns:**
- `id` (uuid, PK)
- `email` (text)
- `name` (text)
- `phone` (text)
- `role` (enum: admin, support, manager, user)
- `is_banned` (boolean)
- `manager_id` (uuid, FK to profiles) - Keep for backward compatibility
- `created_at` (timestamptz)
- `updated_at` (timestamptz)
- `metadata` (jsonb) - Store additional profile data

**Consolidates:** `profiles` (existing)

---

### 2. `projects`
**Purpose:** Real estate projects
**Columns:**
- `id` (uuid, PK)
- `name` (text)
- `developer` (text)
- `region` (text)
- `description` (text)
- `price_per_lead` (numeric)
- `available_leads` (integer)
- `project_code` (text, unique)
- `created_at` (timestamptz)
- `updated_at` (timestamptz)
- `metadata` (jsonb) - Store additional project data

**Consolidates:** `projects` (existing)

---

### 3. `leads`
**Purpose:** Lead records
**Columns:**
- `id` (uuid, PK)
- `project_id` (uuid, FK to projects)
- `client_name` (text)
- `client_phone` (text)
- `client_phone2` (text)
- `client_phone3` (text)
- `client_email` (text)
- `client_job_title` (text)
- `platform` (enum: Facebook, Google, TikTok, Other)
- `source` (text)
- `stage` (enum: New Lead, Potential, Hot Case, Meeting Done, No Answer, Call Back, Whatsapp, Wrong Number, Non Potential)
- `assigned_to_id` (uuid, FK to profiles)
- `buyer_user_id` (uuid, FK to profiles)
- `upload_user_id` (uuid, FK to profiles)
- `batch_id` (uuid) - Reference to batch if uploaded
- `cpl_price` (numeric)
- `is_sold` (boolean)
- `sold_at` (timestamptz)
- `feedback` (text) - Latest feedback (denormalized for quick access)
- `created_at` (timestamptz)
- `updated_at` (timestamptz)
- `metadata` (jsonb) - Store additional lead data

**Consolidates:** `leads` (existing)

---

### 4. `activities`
**Purpose:** Unified activity/event/task system for leads
**Columns:**
- `id` (uuid, PK)
- `lead_id` (uuid, FK to leads)
- `activity_type` (text) - 'event', 'task', 'feedback', 'transfer', 'label', 'recommendation'
- `event_type` (text) - For events: 'note', 'stage_change', 'feedback', 'call', 'ai_coach', 'system'
- `task_type` (text) - For tasks: 'follow_up', 'meeting', 'document', 'custom'
- `task_status` (text) - For tasks: 'pending', 'in_progress', 'completed', 'cancelled', 'overdue'
- `actor_profile_id` (uuid, FK to profiles)
- `assignee_profile_id` (uuid, FK to profiles) - For tasks
- `from_profile_id` (uuid, FK to profiles) - For transfers
- `to_profile_id` (uuid, FK to profiles) - For transfers
- `stage` (text) - Stage at time of event
- `summary` (text) - Summary/description
- `body` (text) - Full content (feedback, notes, etc.)
- `ai_coach` (text) - AI coaching text
- `label` (text) - For labels
- `label_color` (text) - For labels
- `due_at` (timestamptz) - For tasks
- `completed_at` (timestamptz) - For tasks
- `filters` (jsonb) - For recommendations
- `top_units` (jsonb) - For recommendations
- `recommendation` (text) - For recommendations
- `result_count` (integer) - For recommendations
- `reason` (text) - For transfers
- `payload` (jsonb) - Additional data
- `created_at` (timestamptz)
- `updated_at` (timestamptz)

**Consolidates:**
- `case_feedback`
- `case_actions`
- `case_faces`
- `lead_events`
- `lead_tasks`
- `lead_transfers`
- `lead_labels`
- `lead_recommendations`
- `lead_activities`
- `lead_tags`
- `lead_reminders`
- `feedback_history`
- `inventory_matches`

**Indexes:**
- `idx_activities_lead_created` ON (lead_id, created_at DESC)
- `idx_activities_type` ON (activity_type)
- `idx_activities_task_assignee_status` ON (assignee_profile_id, task_status) WHERE activity_type = 'task'
- `idx_activities_task_due` ON (lead_id, due_at) WHERE activity_type = 'task'

---

### 5. `commerce`
**Purpose:** Unified commerce transactions (purchases, requests, allocations)
**Columns:**
- `id` (uuid, PK)
- `commerce_type` (text) - 'purchase', 'request', 'allocation', 'refund', 'topup'
- `profile_id` (uuid, FK to profiles)
- `project_id` (uuid, FK to projects)
- `lead_id` (uuid, FK to leads) - For lead-specific commerce
- `quantity` (integer)
- `amount` (numeric)
- `currency` (text, default 'EGP')
- `payment_method` (text) - 'wallet', 'Instapay', 'Card', 'VodafoneCash', 'BankTransfer'
- `status` (text) - 'pending', 'approved', 'fulfilled', 'rejected', 'cancelled', 'completed', 'failed'
- `receipt_url` (text)
- `receipt_file_name` (text)
- `payment_operation_id` (uuid, FK to payments)
- `approved_by` (uuid, FK to profiles)
- `approved_at` (timestamptz)
- `rejected_reason` (text)
- `admin_notes` (text)
- `batch_id` (uuid) - For lead batches
- `notes` (text)
- `metadata` (jsonb) - Additional data
- `created_at` (timestamptz)
- `updated_at` (timestamptz)

**Consolidates:**
- `purchase_requests`
- `lead_requests`
- `lead_commerce`
- `orders`
- `lead_batches`
- `wallet_topup_requests`

**Indexes:**
- `idx_commerce_profile_status` ON (profile_id, status)
- `idx_commerce_project` ON (project_id)
- `idx_commerce_type_status` ON (commerce_type, status)

---

### 6. `payments`
**Purpose:** Unified payment and wallet system
**Columns:**
- `id` (uuid, PK)
- `profile_id` (uuid, FK to profiles)
- `wallet_id` (uuid) - Reference to wallet (denormalized)
- `operation_type` (text) - 'deposit', 'withdrawal', 'payment', 'refund', 'adjustment', 'gateway_charge', 'topup_request', 'payout'
- `entry_type` (text) - For wallet entries: 'deposit', 'withdrawal', 'payment', 'refund', 'adjustment'
- `status` (text) - 'pending', 'processing', 'completed', 'failed', 'cancelled'
- `amount` (numeric)
- `currency` (text, default 'EGP')
- `balance_after` (numeric) - Wallet balance after this operation
- `provider` (text) - Payment gateway: 'kashier', 'instapay', etc.
- `provider_transaction_id` (text)
- `description` (text)
- `reference_type` (text) - 'commerce', 'topup', etc.
- `reference_id` (uuid) - Reference to commerce or other entity
- `receipt_url` (text)
- `receipt_file_name` (text)
- `validated_by` (uuid, FK to profiles)
- `validated_at` (timestamptz)
- `admin_notes` (text)
- `rejected_reason` (text)
- `metadata` (jsonb) - Additional payment data
- `requested_at` (timestamptz)
- `processed_at` (timestamptz)
- `created_at` (timestamptz)
- `updated_at` (timestamptz)

**Consolidates:**
- `profile_wallets` (wallet balance stored as computed from payments)
- `wallet_entries`
- `payment_operations`
- `payment_transactions`
- `user_wallets`
- `wallet_transactions`

**Note:** Wallet balance is computed via: `SELECT SUM(amount) FROM payments WHERE profile_id = X AND status = 'completed' AND entry_type IN ('deposit', 'refund', 'adjustment') - SUM(amount) WHERE entry_type IN ('withdrawal', 'payment')`

**Indexes:**
- `idx_payments_profile_created` ON (profile_id, created_at DESC)
- `idx_payments_reference` ON (reference_type, reference_id)
- `idx_payments_provider_txn` ON (provider, provider_transaction_id)
- `idx_payments_status` ON (status)

---

### 7. `teams`
**Purpose:** Team management and hierarchy
**Columns:**
- `id` (uuid, PK)
- `name` (text)
- `team_type` (text) - 'sales', 'support', 'partnership', 'admin'
- `owner_profile_id` (uuid, FK to profiles)
- `created_at` (timestamptz)
- `updated_at` (timestamptz)
- `metadata` (jsonb) - Additional team data

**Consolidates:** `teams` (existing)

---

### 8. `team_members`
**Purpose:** Team membership and invitations
**Columns:**
- `id` (uuid, PK)
- `team_id` (uuid, FK to teams)
- `profile_id` (uuid, FK to profiles)
- `role` (text) - 'manager', 'lead', 'agent', 'support'
- `status` (text) - 'active', 'inactive', 'invited', 'pending'
- `invited_by` (uuid, FK to profiles)
- `invited_email` (text) - For pending invitations
- `invitation_token` (text) - For invitations
- `invitation_expires_at` (timestamptz)
- `joined_at` (timestamptz)
- `left_at` (timestamptz)
- `created_at` (timestamptz)
- `updated_at` (timestamptz)

**Consolidates:**
- `team_members` (existing)
- `team_invitations`

**Indexes:**
- `idx_team_members_profile` ON (profile_id)
- `idx_team_members_team` ON (team_id)
- `idx_team_members_invitation_token` ON (invitation_token) WHERE status = 'invited'

---

### 9. `content`
**Purpose:** Unified CMS content (banners, templates, pages, media, settings)
**Columns:**
- `id` (uuid, PK)
- `content_type` (text) - 'banner', 'email_template', 'sms_template', 'page', 'media', 'setting', 'feature_flag'
- `title` (text)
- `body` (text) - Content body
- `placement` (text) - For banners
- `audience` (jsonb) - Targeting rules
- `status` (text) - 'draft', 'scheduled', 'live', 'archived', 'active', 'inactive'
- `start_at` (timestamptz)
- `end_at` (timestamptz)
- `cta` (jsonb) - Call-to-action data
- `media_url` (text) - For media items
- `media_type` (text) - For media items
- `setting_key` (text) - For settings
- `setting_value` (jsonb) - For settings
- `feature_key` (text) - For feature flags
- `feature_enabled` (boolean) - For feature flags
- `created_by_profile_id` (uuid, FK to profiles)
- `created_at` (timestamptz)
- `updated_at` (timestamptz)
- `metadata` (jsonb) - Additional content data

**Consolidates:**
- `dashboard_banners`
- `marketing_assets`
- `cms_pages`
- `cms_media`
- `templates_email`
- `templates_sms`
- `system_settings`
- `feature_flags`

**Indexes:**
- `idx_content_type_status` ON (content_type, status)
- `idx_content_setting_key` ON (setting_key) WHERE content_type = 'setting'
- `idx_content_feature_key` ON (feature_key) WHERE content_type = 'feature_flag'

---

### 10. `content_metrics`
**Purpose:** Metrics and analytics for content
**Columns:**
- `id` (uuid, PK)
- `content_id` (uuid, FK to content)
- `viewer_profile_id` (uuid, FK to profiles)
- `event` (text) - 'impression', 'click', 'view', 'interaction'
- `created_at` (timestamptz)

**Consolidates:**
- `marketing_metrics`
- `banner_metrics`

**Indexes:**
- `idx_content_metrics_content_event` ON (content_id, event)
- `idx_content_metrics_created` ON (created_at DESC)

---

### 11. `notifications`
**Purpose:** Unified notification system
**Columns:**
- `id` (uuid, PK)
- `target_profile_id` (uuid, FK to profiles)
- `context` (text) - 'lead', 'support', 'system', 'commerce', 'team'
- `context_id` (uuid) - Reference to lead, support_case, etc.
- `title` (text)
- `body` (text)
- `url` (text)
- `channels` (text[]) - ['inapp', 'email', 'sms']
- `status` (text) - 'pending', 'sent', 'read', 'failed'
- `read_at` (timestamptz)
- `sent_at` (timestamptz)
- `metadata` (jsonb) - Additional notification data
- `created_at` (timestamptz)

**Consolidates:**
- `notifications`
- `notification_events`

**Indexes:**
- `idx_notifications_target_status` ON (target_profile_id, status)
- `idx_notifications_context` ON (context, context_id)
- `idx_notifications_created` ON (created_at DESC)

---

### 12. `system_logs`
**Purpose:** Unified audit and activity logging
**Columns:**
- `id` (uuid, PK)
- `log_type` (text) - 'audit', 'activity', 'error', 'integration'
- `actor_profile_id` (uuid, FK to profiles)
- `action` (text) - Action performed
- `entity_type` (text) - 'lead', 'profile', 'project', 'commerce', etc.
- `entity_id` (uuid) - ID of affected entity
- `details` (jsonb) - Action details
- `ip_address` (text)
- `user_agent` (text)
- `created_at` (timestamptz)

**Consolidates:**
- `audit_logs`
- `recent_activity`

**Indexes:**
- `idx_system_logs_actor_created` ON (actor_profile_id, created_at DESC)
- `idx_system_logs_entity` ON (entity_type, entity_id)
- `idx_system_logs_type` ON (log_type)

---

## Additional Tables (Keep Separate)

### `partners`
**Purpose:** Partner companies
**Keep as-is** - Small, focused table

### `support_cases`
**Purpose:** Support tickets
**Keep as-is** - Core entity

### `support_threads`
**Purpose:** Support conversation threads
**Keep as-is** - Part of support system

### `support_messages`
**Purpose:** Support messages
**Keep as-is** - Part of support system

### `salemate-inventory`
**Purpose:** Property inventory
**Keep as-is** - External data source

### `posts`
**Purpose:** Community posts (if needed)
**Keep as-is** - Social feature

### `comments`
**Purpose:** Post comments (if needed)
**Keep as-is** - Social feature

### `otp_challenges`
**Purpose:** OTP challenges
**Keep as-is** - Auth system

### `otp_attempts`
**Purpose:** OTP attempt tracking
**Keep as-is** - Auth system

### `ad_integrations`
**Purpose:** Ad platform integrations
**Keep as-is** - Integration config

---

## Migration Mapping

### Old → New Table Mappings

| Old Table | New Table | Column Mapping Notes |
|-----------|-----------|---------------------|
| `case_feedback` | `activities` | activity_type='feedback', body=feedback, ai_coach=ai_coach |
| `case_actions` | `activities` | activity_type='task', task_type=action_type, due_at=due_at, task_status=status |
| `case_faces` | `activities` | activity_type='transfer', from_profile_id=from_agent, to_profile_id=to_agent |
| `lead_events` | `activities` | activity_type='event', event_type=event_type |
| `lead_tasks` | `activities` | activity_type='task', task_type=task_type |
| `lead_transfers` | `activities` | activity_type='transfer' |
| `lead_labels` | `activities` | activity_type='label', label=label, label_color=color |
| `lead_recommendations` | `activities` | activity_type='recommendation' |
| `purchase_requests` | `commerce` | commerce_type='purchase' |
| `lead_requests` | `commerce` | commerce_type='request' |
| `lead_commerce` | `commerce` | Direct mapping |
| `orders` | `commerce` | commerce_type='purchase' |
| `lead_batches` | `commerce` | commerce_type='allocation', batch_id stored in metadata |
| `wallet_topup_requests` | `commerce` | commerce_type='topup' |
| `profile_wallets` | `payments` | Balance computed from payments |
| `wallet_entries` | `payments` | entry_type=entry_type |
| `payment_operations` | `payments` | operation_type=operation_type |
| `payment_transactions` | `payments` | operation_type='gateway_charge' |
| `team_invitations` | `team_members` | status='invited' |
| `dashboard_banners` | `content` | content_type='banner' |
| `marketing_assets` | `content` | content_type='banner' |
| `cms_pages` | `content` | content_type='page' |
| `cms_media` | `content` | content_type='media' |
| `templates_email` | `content` | content_type='email_template' |
| `templates_sms` | `content` | content_type='sms_template' |
| `system_settings` | `content` | content_type='setting' |
| `feature_flags` | `content` | content_type='feature_flag' |
| `marketing_metrics` | `content_metrics` | Direct mapping |
| `banner_metrics` | `content_metrics` | Direct mapping |
| `notifications` | `notifications` | Direct mapping |
| `notification_events` | `notifications` | Direct mapping |
| `audit_logs` | `system_logs` | log_type='audit' |
| `recent_activity` | `system_logs` | log_type='activity' |

---

## Migration Strategy

### Phase 1: Create New Tables
1. Create new consolidated tables with all columns
2. Add indexes and constraints
3. Enable RLS policies

### Phase 2: Data Migration
1. Migrate data from old tables to new tables
2. Transform data according to mapping rules
3. Preserve foreign keys and relationships
4. Verify data integrity

### Phase 3: Update Backend Code
1. Update edge functions to use new tables
2. Update RPC functions
3. Update database triggers
4. Test all backend operations

### Phase 4: Update Frontend Code
1. Update TypeScript types
2. Update API calls to use new table names
3. Update queries and filters
4. Test all frontend flows

### Phase 5: Drop Old Tables
1. Create backup of old tables
2. Drop old tables (or rename to `_legacy_*`)
3. Update any remaining references
4. Verify application still works

---

## Trade-offs & Considerations

### Advantages
1. **Simplified Schema:** Easier to understand and maintain
2. **Reduced Joins:** Fewer tables mean fewer joins in queries
3. **Unified Patterns:** Similar data types use same table structure
4. **Easier Queries:** Single table for related data types

### Disadvantages
1. **Larger Tables:** Some tables will be larger (activities, payments)
2. **Type Filtering:** Need to filter by type column in queries
3. **Migration Complexity:** Large migration effort
4. **Potential Performance:** May need more indexes on type columns

### Mitigation Strategies
1. **Indexes:** Create indexes on type columns and common filters
2. **Partitioning:** Consider table partitioning for large tables (activities, payments)
3. **Views:** Create views for common query patterns
4. **Computed Columns:** Use computed columns for wallet balance

---

## Verification Checklist

- [ ] All 12 core tables created
- [ ] All data migrated from old tables
- [ ] All foreign keys preserved
- [ ] All indexes created
- [ ] All RLS policies updated
- [ ] All edge functions updated
- [ ] All RPC functions updated
- [ ] All frontend types updated
- [ ] All frontend API calls updated
- [ ] All workflows tested end-to-end
- [ ] Performance benchmarks acceptable
- [ ] Old tables backed up
- [ ] Old tables dropped or renamed

---

## Next Steps

1. Create migration scripts for each phase
2. Test migrations on staging environment
3. Execute migrations in production
4. Monitor performance and fix issues
5. Update documentation

