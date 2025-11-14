# SaleMate Database Refactor Plan

This plan documents the current Supabase schema, the desired target model for the five core domains, and the phased migration strategy required to reach the new architecture. It is intended to guide both database and application updates without modifying this plan file directly.

---

## Current Schema Overview (Grouped by Domain)

### Profiles & Finance
- `profiles` & `auth.users` – core identity, roles (`role`, `manager_id`), contact details.
- `user_wallets` – per-user wallet balances (duplicate balance currently stored on `profiles` in some scripts).
- `wallet_transactions` – wallet ledger with multiple column variants (credit/debit, statuses).
- `wallet_topup_requests` – proof-of-payment uploads and manual approvals.
- `payment_transactions` – gateway transactions (cards, Instapay, bank transfer) with reference back to wallet activity.
- `otp_challenges` / `otp_attempts` – unified OTP challenge + audit tables (hashed codes, rate limiting, provider metadata).
- `recent_activity`, `comments`, `posts` – social / audit style data tied to users.
- `partners` – partner organisations (logo, commission, status).

### Leads & CRM
- `leads` – single source of truth for lead records (stage, assignment, ownership).
- `lead_batches` – metadata for bulk uploads.
- `lead_tags`, `lead_reminders`, `lead_activities` – tag/reminder/activity metadata.
- `feedback_history`, `case_feedback`, `case_actions`, `case_faces`, `inventory_matches`, `notifications` – per-lead workflow artefacts (feedback, tasks, handoffs, AI matches, realtime notifications).
- `lead_requests`, `lead_purchase_requests`, `purchase_requests`, `orders` – request/purchase/order tracking across wallet and project flows.
- `ad_integrations`, `banner_metrics`, `dashboard_banners` – acquisition and marketing telemetry.
- Views / materialised views: `lead_analytics_mv`.

### Team & Access
- `profiles.manager_id` – hierarchical relationship baked into profiles.
- `team_invitations` – invite flow for managers/agents.
- (Implicit) team ownership via lead assignments and wallet ownership.

### Inventory & Commerce
- `"salemate-inventory"` – denormalised inventory (projects + developers).
- `projects`, `project_partner_commissions` – legacy/normalised inventory tables.
- `partners` (also listed above) – partner metadata tied to projects.
- `orders` – purchases linked to projects/leads.

### Support & Operations
- `support_cases` – ticket header with status, priority, assignment.
- `support_case_replies` – threaded replies (currently separate table).
- `notifications` (shared) – case notifications mixed with lead notifications.

### System / Content / Settings
- `cms_pages`, `cms_media` – admin CMS content.
- `templates_email`, `templates_sms` – outbound message templates.
- `system_settings`, `feature_flags`, `audit_logs` – platform configuration.
- `banner_metrics`, `dashboard_banners` (also noted above) – marketing placements.


---

## Target Domain Architecture

### 1. Profiles Domain
**Goal:** Single source for user identity, wallet, preferences, and organisational relationships.

Proposed tables / structures:
- `profiles` (existing, augmented):
  - Move wallet balance into a dedicated JSON column (`account_summary`) or keep numeric `wallet_balance` with triggers.
  - Add `status`, `onboarding_state`, `profile_type`.
  - Replace `manager_id` with a relation table (see Team domain).
- `profile_wallets` (new) – one row per profile to replace `user_wallets`. Columns: `profile_id`, `currency`, `balance`, `limits`, `updated_at`.
- `profile_wallet_ledger` (new) – normalized ledger replacing `wallet_transactions` with consistent columns (`ledger_id`, `profile_id`, `wallet_id`, `entry_type`, `amount`, `source`, `status`, `reference_type`, `reference_id`, `metadata`, timestamps).
- `profile_payment_transactions` (new) – upstream payment gateway logs (maps legacy `payment_transactions`).
- `profile_preferences` (optional new) – JSONB settings per user (notifications, locales).

**Mapping:**
- `user_wallets` → `profile_wallets`.
- `wallet_transactions` → `profile_wallet_ledger`.
- `wallet_topup_requests`, `payment_transactions` → stay separate but reference `profile_wallets`.
- `otp_challenges`, `otp_attempts` → keep as core OTP infrastructure (profiles security domain).

**RLS:** 
- Profiles can self-select; admins/support see all.
- Wallet tables enforce row-level ownership; finance/admin roles allowed to view/update.


### 2. Leads Domain
**Goal:** Keep `leads` as the canonical table and collapse fragmented support tables into a smaller set of high-signal tables.

Proposed tables / structures:
- `leads` (existing) – ensure columns align with consolidated schema (integration id, monetisation fields, consistent timestamps).
- `lead_events` (new) – replaces `feedback_history`, `case_feedback`, `lead_activities`. Columns: `event_id`, `lead_id`, `actor_profile_id`, `event_type`, `payload`, `created_at`.
- `lead_tasks` (new) – merges `lead_reminders`, `case_actions`. Columns: `task_id`, `lead_id`, `assignee_id`, `task_type`, `status`, `due_at`, `completed_at`, `notes`.
- `lead_labels` (new) – replaces `lead_tags`. Columns: `lead_id`, `label`, `applied_by`, `applied_at`.
- `lead_transfers` (new) – replaces `case_faces` to record assignment/handover history.
- `lead_recommendations` (new) – replaces `inventory_matches` & AI suggestions.
- `lead_transactions` (new) – merges `lead_requests`, `lead_purchase_requests`, `orders`. Store type (`request`, `purchase`, `refund`), source, status, payment reference.
- `lead_sources` (optional view) – unify `ad_integrations`, `banner_metrics`.

**Mapping:**
- `feedback_history`, `case_feedback`, `lead_activities` → `lead_events`.
- `lead_reminders`, `case_actions` → `lead_tasks`.
- `lead_tags` → `lead_labels`.
- `case_faces` → `lead_transfers`.
- `inventory_matches` → `lead_recommendations`.
- `lead_requests`, `lead_purchase_requests`, `orders`, `purchase_requests` → `lead_transactions`.
- `ad_integrations`, `banner_metrics`, `dashboard_banners` → consolidated marketing/ad configuration (likely keep one `ad_integrations` table plus analytics view).

**RLS & functions:**
- Maintain existing lead ownership policies; ensure events/tasks respect lead policies by using `USING EXISTS` back to `leads`.
- Update realtime subscriptions to point to consolidated tables.


### 3. Team Domain
**Goal:** Explicit modelling of teams, roles, and invitations separate from profiles.

Proposed tables / structures:
- `teams` (new) – metadata for teams (`team_id`, `name`, `type`, `owner_profile_id`).
- `team_memberships` (new) – replaces implicit `manager_id`. Columns: `team_id`, `profile_id`, `role` (`manager`, `team_lead`, `agent`, `support`), `status`.
- `team_invites` (rename/replace `team_invitations`) – store invites referencing `teams` and pending roles.
- `team_relationships_view` – helper view summarizing direct manager/agent relationships for existing UI components.

**Mapping:**
- `profiles.manager_id` → `team_memberships`.
- `team_invitations` → `team_invites`.

**RLS:**
- Members can view their team(s); admins/manage roles can manage team rows.


### 4. Inventory Domain
**Goal:** Single inventory table with derived views; align partner commissions and pricing.

Proposed tables / structures:
- `inventory_items` (rename `"salemate-inventory"`) – canonical listing of projects, developers, units, pricing.
- `inventory_projects` view (optional) – for backwards compatibility with current `projects` schema.
- `inventory_partner_commissions` – normalized from `project_partner_commissions`.
- `inventory_partners` – reuse `partners` table or attach partner-specific fields.
- `inventory_orders` – derived from `lead_transactions` of type `purchase`.

**Mapping:**
- `"salemate-inventory"` → `inventory_items`.
- `projects`, `project_partner_commissions` → replaced by `inventory_items` + `inventory_partner_commissions` (with views if needed).
- `orders` → either view or subset of `lead_transactions`.

**RLS:**
- Inventory read access for authenticated users; write restricted to admin/support.


### 5. Support Domain
**Goal:** Streamline tickets and replies into a single conversational model.

Proposed tables / structures:
- `support_threads` (new) – high-level ticket metadata (subject, status, priority, creator, assigned_to).
- `support_messages` (new) – unify `support_case_replies` with first message. Columns: `message_id`, `thread_id`, `author_id`, `message_type` (`user`, `internal`), `body`, attachments, `created_at`.
- `support_activity` view – timeline aggregator for UI metrics.

**Mapping:**
- `support_cases` → `support_threads`.
- `support_case_replies` → `support_messages`.
- `notifications` entries for support → consider moving to `support_messages` triggers.

**RLS:**
- Thread owner may read/write own messages; support/admin roles can view all threads.


### 6. System / Shared Tables
**Goal:** Reduce duplicates and align naming.

- `communication_templates` (new) – merge `templates_email` & `templates_sms` with `channel` column.
- `system_settings`, `feature_flags`, `audit_logs` – remain but document ownership and usage.
- `cms_content` (new) – unify `cms_pages` & `cms_media` with polymorphic content types.
- `notifications` – split into `lead_notifications` & `support_notifications` or generalised `activity_notifications`.


---

## Migration Strategy (High-Level Phases)

1. **Baseline & Safety**
   - Export schema snapshot & seed data backups.
   - Introduce helper views for legacy tables to reduce immediate code churn.
   - Implement linter/CI gates to prevent old table usage after migration.

2. **Profiles & Wallets**
   - Create `profile_wallets`, `profile_wallet_ledger`, `profile_payment_transactions`.
   - Backfill from `user_wallets` & `wallet_transactions`.
   - Update edge functions (`otp-request`/`otp-verify`, wallet top-ups) and frontend wallet context.
   - Deprecate old wallet tables after verification.

3. **Team Structure**
   - Create `teams`, `team_memberships`, `team_invites`.
   - Migrate existing `manager_id` relationships.
  - Update invitation flows (edge functions, UI) to reference new tables.

4. **Leads Domain Consolidation**
   - Introduce new tables (`lead_events`, `lead_tasks`, `lead_labels`, `lead_transfers`, `lead_recommendations`, `lead_transactions`).
   - Write migration scripts to transform existing supporting tables into unified tables (preserving history via `created_at`/`updated_at` and original IDs).
   - Update Supabase functions (`purchase-leads`, `marketplace`, `reminder-scheduler`, etc.) and React hooks (`useLeads`, `useCase`) to use new structure.
   - Remove or archive legacy tables after verification.

5. **Inventory Alignment**
   - Rename `"salemate-inventory"` → `inventory_items`, create compatibility views.
   - Migrate `projects` & `project_partner_commissions` data into new structure.
   - Update shop UI and inventory hooks to rely on unified inventory.

6. **Support Domain Merge**
   - Create `support_threads` & `support_messages`.
   - Backfill from `support_cases` & `support_case_replies`.
   - Update support store & components to new structure; adjust RLS.

7. **System Cleanup**
   - Merge template tables, rationalize notifications, audit integration.
   - Drop unused tables/views (`purchase_requests`, duplicate CMS tables) once code no longer references them.

Each phase should include:
- Data migration SQL (with safety `BEGIN ... EXCEPTION` blocks).
- RLS/policy updates mirrored from old tables.
- Application updates (frontend hooks, stores, edge functions).
- Regression tests (unit + manual via Chromium).


---

## Application Update Requirements
- **Frontend (React + Zustand):**
  - Update stores/hooks (`src/store/auth.ts`, `src/hooks/crm/*`, support/wallet contexts) to new endpoints.
  - Refresh generated Supabase types after each migration.
  - Adjust routing (e.g., new `/backend-audit` confirmed in diff) to use new data sources.
- **Edge Functions:**
  - `otp-request`, `otp-verify`, `purchase-leads`, `marketplace`, `reminder-scheduler`, `inventory-matcher`, support functions — ensure queries target new tables.
- **Docs / Guides:**
  - Update operational guides (lead consolidation, wallet setup, support system) to reference new schema names.
- **Automation / Seeds:**
  - Rewrite `supabase/seed/seed.sql` to populate new tables, removing deprecated ones.


---

## Verification & Testing Checklist
- Schema diff per phase (using `supabase db diff` or `SELECT` assertions).
- RLS verification for each domain (run `SELECT` as different roles).
- Regression tests for: lead ingestion → shop → purchase → CRM; wallet top-up, team invitation workflows, support ticket creation/resolution.
- Performance checks on consolidated tables (indexes, query plans).
- Update monitor scripts (`supabase/scripts/verify_schema_consistency.sql`) to align with new table names.

---

## Next Steps
1. Draft phase-by-phase migration SQL files in `supabase/migrations`.
2. Stage corresponding application changes with feature flags where possible.
3. Execute phases sequentially in a staging environment, verifying via Chromium and automated tests.
4. Schedule production rollout with data backups and downtime notice if required.


