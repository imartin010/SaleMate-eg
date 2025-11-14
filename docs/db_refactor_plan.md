# SaleMate Database Refactor Plan

_Updated: 2025-11-13 (Step 2 – Target Schema Proposal)_

This document captures the target data model for each domain, grounded in the live Supabase schema inspected via MCP. It is the blueprint for the upcoming consolidation work; every change must be implemented through Supabase-style migrations, with compatibility views maintained until cleanup is approved.

---

## Domain Targets Overview

| Domain | Core Goal | Target Tables |
| --- | --- | --- |
| Profiles & Team | Unify identities, wallets, and organisational hierarchy. | `profiles`, `profile_wallets`, `wallet_entries`, `payment_operations`, `partners`, `teams`, `team_members`, `team_invitations`, `otp_challenges`, `otp_attempts` |
| Leads | Keep `leads` canonical while collapsing feedback, tasks, commerce, and marketing artefacts. | `leads`, `lead_events`, `lead_tasks`, `lead_labels`, `lead_transfers`, `lead_recommendations`, `lead_commerce`, `marketing_assets`, `marketing_metrics`, `notification_events`, `ad_integrations` |
| Inventory | Preserve the inventory dataset and deprecate legacy project/developer tables via views. | `salemate_inventory`, `inventory_commissions`, compatibility views (`projects_legacy`, `developers_legacy`) |
| Support | Merge tickets and replies into threaded conversations. | `support_threads`, `support_messages` |
| System | Rationalise templates, settings, and audit utilities. | `communication_templates`, `system_settings`, `feature_flags`, `audit_logs` |

---

## Profiles & Team Domain

### Target Tables
- **`profiles`** (existing; trim columns, add indexes)
  - Columns: `id uuid PK (FK → auth.users.id)`, `name text`, `email text UNIQUE`, `phone text`, `role text CHECK (\'user\',\'manager\',\'support\',\'admin\',\'partner\')`, `status text DEFAULT 'active'`, `created_at timestamptz DEFAULT now()`, `updated_at timestamptz DEFAULT now()`.
  - Remove `wallet_balance` and legacy `manager_id` once team membership is migrated.
  - Indexes: `idx_profiles_role`, `idx_profiles_email`, `idx_profiles_status`.

- **`profile_wallets`** (new; 1:1 with `profiles`)
  - Columns: `id uuid PK DEFAULT gen_random_uuid()`, `profile_id uuid UNIQUE FK → profiles.id`, `currency text DEFAULT 'EGP'`, `balance numeric(14,2) DEFAULT 0`, `limits jsonb DEFAULT '{}'`, `created_at timestamptz DEFAULT now()`, `updated_at timestamptz DEFAULT now()`.
  - Indexes: `idx_profile_wallets_profile_id`.

- **`wallet_entries`** (new; replaces `wallet_transactions`)
  - Columns: `id uuid PK`, `wallet_id uuid FK → profile_wallets.id`, `profile_id uuid FK → profiles.id`, `entry_type text CHECK (\'deposit\',\'withdrawal\',\'payment\',\'refund\',\'adjustment\')`, `status text CHECK (\'pending\',\'completed\',\'failed\',\'cancelled\') DEFAULT 'completed'`, `amount numeric(14,2)`, `description text`, `reference_type text`, `reference_id uuid`, `metadata jsonb DEFAULT '{}'`, `created_at timestamptz DEFAULT now()`, `updated_at timestamptz DEFAULT now()`.
  - Indexes: `idx_wallet_entries_wallet_created_at`, `idx_wallet_entries_reference`.

- **`payment_operations`** (new; unifies `payment_transactions` + `wallet_topup_requests`)
  - Columns: `id uuid PK`, `profile_id uuid FK → profiles.id`, `wallet_id uuid FK → profile_wallets.id`, `operation_type text CHECK (\'gateway_charge\',\'topup_request\',\'payout\')`, `provider text`, `provider_transaction_id text`, `status text CHECK (\'pending\',\'processing\',\'completed\',\'failed\',\'cancelled\')`, `amount numeric(14,2)`, `currency text`, `metadata jsonb`, `requested_at timestamptz DEFAULT now()`, `processed_at timestamptz`.
  - Indexes: `idx_payment_operations_profile_status`, `idx_payment_operations_provider_txn`.

- **`partners`** (existing)
  - Keep as partner registry; consider adding `commission_policy jsonb` rather than separate tables.
  - Indexes: `idx_partners_status`.

- **`teams`** (new)
  - Columns: `id uuid PK`, `name text`, `team_type text CHECK (\'sales\',\'support\',\'partnership\',\'admin\')`, `owner_profile_id uuid FK → profiles.id`, `created_at timestamptz DEFAULT now()`, `updated_at timestamptz DEFAULT now()`.
  - Index: `idx_teams_owner`.

- **`team_members`** (new; replaces `profiles.manager_id`)
  - Columns: `team_id uuid FK → teams.id`, `profile_id uuid FK → profiles.id`, `role text CHECK (\'manager\',\'lead\',\'agent\',\'support\')`, `status text CHECK (\'active\',\'inactive\',\'invited\')`, `joined_at timestamptz`, `left_at timestamptz`.
  - Primary key `(team_id, profile_id)`; indexes on `profile_id`, `role`.

- **`team_invitations`** (existing; reshape)
  - Add `team_id uuid FK → teams.id`, `role text`, `invited_profile_id uuid`. Keep `token`, `expires_at`, `status`.
  - Indexes: `idx_team_invitations_status`, `idx_team_invitations_token`.

- **`otp_challenges` / `otp_attempts`** (new)
  - Continues to back edge functions; optional FK to `profiles` for linked accounts.

### Legacy Mapping
| Existing Table | Plan |
| --- | --- |
| `profiles` | Keep; drop wallet fields and manager pointer after migrations.
| `user_wallets` | Migrate rows into `profile_wallets`; replace table with `_legacy` view.
| `wallet_transactions` | Migrate into `wallet_entries`; maintain compatibility view until code updates.
| `wallet_topup_requests` | Re-express as `payment_operations` with `operation_type = 'topup_request'`.
| `payment_transactions` | Re-express as `payment_operations` with `operation_type = 'gateway_charge'` and richer metadata.
| `partners` | Keep; tie to inventory commissions in later phase.
| `project_partner_commissions` | Handled under Inventory/Leads domain bridging.

---

## Leads Domain

### Target Tables
- **`leads`** (existing)
  - Enforce nullable FKs: `assigned_to_profile_id`, `owner_profile_id`, `buyer_profile_id` → `profiles.id`.
  - Indexes: `idx_leads_stage`, `idx_leads_assigned_to`, `idx_leads_project_stage`.

- **`lead_events`** (new)
  - Columns: `id uuid PK`, `lead_id uuid FK → leads.id`, `actor_profile_id uuid FK → profiles.id`, `event_type text CHECK (\'note\',\'stage_change\',\'feedback\',\'call\',\'ai_coach\',\'system\')`, `stage text`, `summary text`, `payload jsonb`, `created_at timestamptz DEFAULT now()`.
  - Indexes: `idx_lead_events_lead_created_at`, `idx_lead_events_type`.

- **`lead_tasks`** (new)
  - Columns: `id uuid PK`, `lead_id uuid FK → leads.id`, `created_by_profile_id uuid`, `assignee_profile_id uuid`, `task_type text CHECK (\'follow_up\',\'meeting\',\'document\',\'custom\')`, `status text CHECK (\'pending\',\'in_progress\',\'completed\',\'cancelled\',\'overdue\')`, `due_at timestamptz`, `completed_at timestamptz`, `payload jsonb`, `created_at timestamptz DEFAULT now()`, `updated_at timestamptz DEFAULT now()`.
  - Indexes: `idx_lead_tasks_assignee_status`, `idx_lead_tasks_lead_due_at`.

- **`lead_labels`** (new)
  - Columns: `lead_id uuid FK → leads.id`, `label text`, `color text DEFAULT '#3b82f6'`, `applied_by_profile_id uuid`, `applied_at timestamptz DEFAULT now()`.
  - Primary key `(lead_id, label)`; index `idx_lead_labels_label`.

- **`lead_transfers`** (new)
  - Columns: `id uuid PK`, `lead_id uuid FK → leads.id`, `from_profile_id uuid`, `to_profile_id uuid`, `reason text`, `created_by_profile_id uuid`, `created_at timestamptz DEFAULT now()`.
  - Index: `idx_lead_transfers_lead_created_at`.

- **`lead_recommendations`** (new)
  - Columns: `id uuid PK`, `lead_id uuid FK → leads.id`, `generated_by_profile_id uuid`, `filters jsonb`, `top_units jsonb`, `recommendation text`, `result_count integer`, `created_at timestamptz DEFAULT now()`.
  - Index: `idx_lead_recommendations_lead`.

- **`lead_commerce`** (new)
  - Columns: `id uuid PK`, `lead_id uuid FK`, `profile_id uuid FK → profiles.id`, `project_id uuid FK → projects.id`, `commerce_type text CHECK (\'request\',\'allocation\',\'purchase\',\'refund\')`, `status text CHECK (\'pending\',\'approved\',\'fulfilled\',\'rejected\',\'cancelled\')`, `quantity integer`, `amount numeric`, `currency text`, `payment_operation_id uuid FK → payment_operations.id`, `notes text`, `metadata jsonb`, `created_at timestamptz DEFAULT now()`, `updated_at timestamptz DEFAULT now()`.
  - Indexes: `idx_lead_commerce_profile_status`, `idx_lead_commerce_payment`.

- **`marketing_assets`** (new)
  - Columns: `id uuid PK`, `title text`, `body text`, `cta jsonb`, `placement text`, `audience jsonb`, `status text CHECK (\'draft\',\'scheduled\',\'live\',\'archived\')`, `start_at timestamptz`, `end_at timestamptz`, `created_by_profile_id uuid`, `created_at timestamptz`, `updated_at timestamptz`.

- **`marketing_metrics`** (new; replaces `banner_metrics`)
  - Columns: `id uuid PK`, `asset_id uuid FK → marketing_assets.id`, `viewer_profile_id uuid`, `event text CHECK (\'impression\',\'click\')`, `created_at timestamptz DEFAULT now()`.
  - Index: `idx_marketing_metrics_asset_event`.

- **`notification_events`** (new)
  - Columns: `id uuid PK`, `target_profile_id uuid`, `context text CHECK (\'lead\',\'support\',\'system\')`, `context_id uuid`, `title text`, `body text`, `channels text[] DEFAULT ARRAY['inapp']`, `status text CHECK (\'pending\',\'sent\',\'read\')`, `read_at timestamptz`, `sent_at timestamptz`, `created_at timestamptz DEFAULT now()`.
  - Indexes: `idx_notification_events_target_status`, `idx_notification_events_context`.

- **`ad_integrations`** (existing)
  - Keep for platform credentials; add `integration_scope text[]` if multi-channel support required.

### Legacy Mapping
| Existing Table | Plan |
| --- | --- |
| `feedback_history`, `case_feedback`, `lead_activities` | Backfill into `lead_events` with `payload.original_table` for traceability.
| `lead_reminders`, `case_actions` | Backfill into `lead_tasks` (map `action_type`/`status`, convert schedules).
| `lead_tags` | Backfill into `lead_labels` (dedupe on `(lead_id, tag_name)`).
| `case_faces` | Backfill into `lead_transfers` with explicit from/to FKs.
| `inventory_matches` | Backfill into `lead_recommendations`.
| `lead_requests`, `purchase_requests` | Map into `lead_commerce` with `commerce_type` = `request`/`allocation`.
| Lead purchase ledger rows in `wallet_transactions` | Map into `lead_commerce` with `commerce_type` = `purchase` linked to `payment_operations`.
| `dashboard_banners`, `banner_metrics` | Migrate to `marketing_assets` / `marketing_metrics`; expose views for backwards compatibility.
| `notifications` | Migrate to `notification_events` with `context` set according to trigger source.

---

## Inventory Domain

### Target Structure
- **`salemate_inventory`**
  - Rename the existing table (`"salemate-inventory"`) and keep structure intact.
  - Add indexes on `(compound)`, `(property_type)`, `(price_in_egp)` to support search.

- **`inventory_commissions`** (new)
  - Columns: `id uuid PK`, `project_id uuid FK → projects.id`, `partner_id uuid FK → partners.id`, `commission_rate numeric`, `is_active boolean DEFAULT true`, `created_at timestamptz DEFAULT now()`, `updated_at timestamptz DEFAULT now()`.
  - Index: `idx_inventory_commissions_project_partner`.

- **Compatibility Views**
  - `projects_legacy` view sourcing from `salemate_inventory` for interim support.
  - `developers_legacy` view returning distinct developer data.
  - `project_partner_commissions_legacy` view overlaying `inventory_commissions`.

### Legacy Mapping
| Existing Table | Plan |
| --- | --- |
| `"salemate-inventory"` | Rename to `salemate_inventory`; keep data unchanged.
| `projects` | Replace with `projects_legacy` view until code is updated to use inventory directly.
| `developers` | Replace with `developers_legacy` view.
| `project_partner_commissions` | Migrate rows into `inventory_commissions`.

---

## Support Domain

### Target Tables
- **`support_threads`** (new)
  - Columns: `id uuid PK`, `subject text`, `topic text`, `issue text`, `status text CHECK (\'open\',\'in_progress\',\'solved\',\'closed\') DEFAULT 'open'`, `priority text CHECK (\'low\',\'medium\',\'high\',\'urgent\')`, `created_by_profile_id uuid`, `assigned_to_profile_id uuid`, `context jsonb`, `created_at timestamptz DEFAULT now()`, `updated_at timestamptz DEFAULT now()`.
  - Indexes: `idx_support_threads_status`, `idx_support_threads_assigned_to`.

- **`support_messages`** (new)
  - Columns: `id uuid PK`, `thread_id uuid FK → support_threads.id`, `author_profile_id uuid`, `message_type text CHECK (\'user\',\'internal\',\'system\')`, `body text`, `attachments jsonb`, `created_at timestamptz DEFAULT now()`, `updated_at timestamptz DEFAULT now()`.
  - Index: `idx_support_messages_thread_created_at`.

### Legacy Mapping
| Existing Table | Plan |
| --- | --- |
| `support_cases` | Backfill into `support_threads`; expose `_legacy` view.
| `support_case_replies` | Backfill into `support_messages`; set `message_type = 'internal'` when `is_internal_note = true`.
| Support-related rows in `notifications` | Emit rows in `notification_events` with `context = 'support'` via triggers.

---

## System / Templates Domain

### Target Tables
- **`communication_templates`** (new)
  - Columns: `id uuid PK`, `template_key text UNIQUE`, `name text`, `channel text CHECK (\'email\',\'sms\',\'push\')`, `subject text`, `body text`, `variables text[] DEFAULT '{}'`, `status text CHECK (\'active\',\'archived\')`, `created_at timestamptz DEFAULT now()`, `updated_at timestamptz DEFAULT now()`.
  - Index: `idx_communication_templates_channel_status`.

- **`system_settings`** (existing)
  - Ensure unique constraint on `key`; index `idx_system_settings_updated_at`.

- **`feature_flags`** (existing)
  - Index on `(enabled)` and `(updated_by)` for auditing.

- **`audit_logs`** (existing)
  - Add composite index `(entity, entity_id)` for faster lookups.

### Legacy Mapping
| Existing Table | Plan |
| --- | --- |
| `templates_email`, `templates_sms` | Migrate into `communication_templates` with `channel` discriminator; maintain legacy views.
| `system_settings`, `feature_flags`, `audit_logs` | Keep; add indexes as noted.
| `notifications` | Superseded by `notification_events` (see Leads/Support domains).

---

## Compatibility Views & Transitional Artifacts
- Provide `_legacy` views for every table being superseded (e.g. `feedback_history_legacy`, `lead_reminders_legacy`, `dashboard_banners_legacy`). Views should select from new tables and expose the original column names to keep the application running during migration phases.
- Add `COMMENT ON TABLE` statements marking legacy tables and pointing to replacements.
- Update `supabase/scripts/verify_schema_consistency.sql` to validate new tables and legacy views simultaneously.

---

## Migration Sequencing (Draft)
1. **Profiles & Wallets** — create `profile_wallets`, `wallet_entries`, `payment_operations`; backfill from existing wallet tables; create legacy views.
2. **Team Hierarchy** — introduce `teams`, `team_members`; reshape `team_invitations`; migrate `profiles.manager_id` and add compatibility view.
3. **Leads Consolidation** — create new lead tables; backfill data; add `_legacy` views; update RLS referencing `leads`.
4. **Inventory Alignment** — rename `"salemate-inventory"`, create `inventory_commissions`, install compatibility views for `projects`/`developers`.
5. **Support Threads** — deploy `support_threads`/`support_messages`; migrate ticket data; maintain legacy views.
6. **System Templates** — merge template tables; apply new indexes to settings/flags/audit logs.

Cleanup migrations (dropping legacy tables/views) must wait for an explicit **AUTHORIZED TO DROP** instruction.

---

## Application Update Guidance
- Regenerate Supabase types after each phase.
- Update React hooks/stores (`useLeads`, `useCase`, wallet modules, support modules) to consume new tables or compatibility views.
- Adjust edge functions (`otp-request`/`otp-verify`, lead commerce, support flows) to target the new schema before removing legacy tables.
- Refresh documentation/runbooks alongside each migration.

---

This plan completes **STEP 2**. The next stage is to design safe migrations (STEP 3) that implement these tables, backfill data, and expose compatibility views for the application.
