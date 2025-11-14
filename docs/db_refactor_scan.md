# Database Refactor Scan

_Updated: 2025-11-13 – Post-cleanup inventory_

## Methodology
- Queried the live Supabase database via MCP after the cleanup migration to list *base tables* (canonical storage) and *compatibility views* (legacy names that now front the new schema).
- Grouped each object by the target business domain and noted which components are transitional views vs. primary tables.

## Canonical Tables by Domain

> Current tally after cleanup: 33 base tables and 25 compatibility views in `public`.

### Profiles & Team
| Table | Purpose | Notes |
| --- | --- | --- |
| `profiles` | Core identity/role metadata. | Wallet balance removed; hierarchy handled via `team_members`. |
| `profile_wallets` | One wallet row per profile. | Replaces `user_wallets`; balances synced here. |
| `wallet_entries` | Wallet ledger entries. | Supersedes `wallet_transactions`. |
| `payment_operations` | Gateway charges, top-up requests, payouts. | Supersedes `payment_transactions` & `wallet_topup_requests`. |
| `teams` | Team definitions (sales/support/etc.). | Owner-driven hierarchy. |
| `team_members` | Membership and role assignments. | Replaces `profiles.manager_id`. |
| `team_invitations` | Invitation records (now linked to `teams`). | Columns for `team_id`, `role`, `invited_profile_id` added. |
| `partners` | Partner registry. | Unchanged structure. |

### Leads & Case Management
| Table | Purpose | Notes |
| --- | --- | --- |
| `leads` | Canonical lead record. | FK columns (`assigned_to_profile_id`, etc.) enforce profile links. |
| `lead_events` | Unified event stream (feedback, notes, stage changes). | Replaces `feedback_history`, `case_feedback`, `lead_activities`. |
| `lead_tasks` | Tasks/reminders/actions. | Replaces `lead_reminders`, `case_actions`. |
| `lead_labels` | Lead tagging system. | Backed by `lead_label_ids` for legacy IDs. |
| `lead_transfers` | Ownership handoffs. | Replaces `case_faces`. |
| `lead_recommendations` | AI/recommendation output. | Replaces `inventory_matches`. |
| `lead_commerce` | Requests, allocations, purchases, refunds. | Replaces `lead_requests` & `purchase_requests`. |
| `marketing_assets` | CRM banner content. | Replaces `dashboard_banners`. |
| `marketing_metrics` | Banner impressions/clicks. | Replaces `banner_metrics`. |
| `notification_events` | User notifications (lead/support/system). | Replaces `notifications`. |
| `lead_label_ids` | Mapping legacy tag IDs to new labels. | Supports compatibility view for `lead_tags`. |

### Inventory
| Table | Purpose | Notes |
| --- | --- | --- |
| `salemate_inventory` | Master property inventory dataset. | Renamed from `"salemate-inventory"`; kept intact. |
| `inventory_commissions` | Partner commission policies per project. | Replaces `project_partner_commissions`. |

### Support
| Table | Purpose | Notes |
| --- | --- | --- |
| `support_threads` | Ticket headers. | Replaces `support_cases`. |
| `support_messages` | Thread messages (user/internal/system). | Replaces `support_case_replies`. |

### System / Templates / Security
| Table | Purpose | Notes |
| --- | --- | --- |
| `communication_templates` | Unified templates (`email`/`sms`/`push`). | Replaces `templates_email` & `templates_sms`. |
| `system_settings` | JSONB configuration values. | Index/constraints retained. |
| `feature_flags` | Feature toggles. | Unchanged structure with updated indexes. |
| `audit_logs` | Platform audit trail. | Additional entity/entity_id index recommended. |
| `otp_challenges` | OTP challenge ledger with hashed codes. | Replaces legacy `otp_verifications`; used by new edge functions. |
| `otp_attempts` | Attempt audit log per challenge. | Supports rate limiting & diagnostics for OTP flow. |

## Compatibility Views (Legacy API Surface)
Legacy table names now resolve to views (25 total) that read/write through the consolidated schema via `INSTEAD OF` triggers:

- Lead workflow: `feedback_history`, `case_feedback`, `lead_activities`, `lead_reminders`, `case_actions`, `case_faces`, `inventory_matches`, `lead_tags`, `lead_requests`, `purchase_requests`.
- Marketing & notifications: `dashboard_banners`, `banner_metrics`, `notifications`.
- Wallet & payments: `user_wallets`, `wallet_transactions`, `payment_transactions`, `wallet_topup_requests`.
- Support: `support_cases`, `support_case_replies`.

The triggers commit changes to `lead_events`, `lead_tasks`, `lead_transfers`, `lead_recommendations`, `lead_commerce`, `marketing_assets`, `marketing_metrics`, `notification_events`, `profile_wallets`, `wallet_entries`, `payment_operations`, `support_threads`, and `support_messages`. This allows the application to operate uninterrupted while code is migrated to the new tables.

## Cleanup Status
- ✅ All legacy objects have been dropped as base tables; only compatibility views remain.
- ✅ New domain tables created and populated (Profiles/Team, Leads, Inventory, Support, System).
- ✅ Synchronisation triggers route legacy view writes into the new tables.
- 🔄 Next step: move application/edge-function queries to the new tables (or updated Supabase types) and retire the compatibility views once no longer needed.

Use `supabase/scripts/verify_schema_consistency.sql` (updated) to confirm all constraints/RLS policies remain intact after future changes.
