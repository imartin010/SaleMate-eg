BEGIN;

-- -----------------------------------------------------------------------------
-- Leads Domain Consolidation (Phase 1)
-- Adds unified lead workflow tables and backfills data from existing tables
-- without dropping or mutating legacy structures.
-- -----------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS public.lead_events (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    lead_id uuid NOT NULL REFERENCES public.leads(id) ON DELETE CASCADE,
    actor_profile_id uuid REFERENCES public.profiles(id),
    event_type text NOT NULL CHECK (event_type IN ('note','stage_change','feedback','call','ai_coach','system','activity')),
    stage text,
    summary text,
    payload jsonb NOT NULL DEFAULT '{}',
    created_at timestamptz NOT NULL DEFAULT now()
);

COMMENT ON TABLE public.lead_events IS 'Unified event stream for leads (notes, feedback, stage changes, system events).';

CREATE INDEX IF NOT EXISTS idx_lead_events_lead_created_at
    ON public.lead_events (lead_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_lead_events_event_type
    ON public.lead_events (event_type);

CREATE TABLE IF NOT EXISTS public.lead_tasks (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    lead_id uuid NOT NULL REFERENCES public.leads(id) ON DELETE CASCADE,
    created_by_profile_id uuid REFERENCES public.profiles(id),
    assignee_profile_id uuid REFERENCES public.profiles(id),
    task_type text NOT NULL CHECK (task_type IN ('follow_up','meeting','document','custom')),
    status text NOT NULL CHECK (status IN ('pending','in_progress','completed','cancelled','overdue')),
    due_at timestamptz,
    completed_at timestamptz,
    payload jsonb NOT NULL DEFAULT '{}',
    created_at timestamptz NOT NULL DEFAULT now(),
    updated_at timestamptz NOT NULL DEFAULT now()
);

COMMENT ON TABLE public.lead_tasks IS 'Actionable tasks linked to leads (reminders, case actions, documents).';

CREATE INDEX IF NOT EXISTS idx_lead_tasks_assignee_status
    ON public.lead_tasks (assignee_profile_id, status);

CREATE INDEX IF NOT EXISTS idx_lead_tasks_lead_due_at
    ON public.lead_tasks (lead_id, due_at);

CREATE TABLE IF NOT EXISTS public.lead_labels (
    lead_id uuid NOT NULL REFERENCES public.leads(id) ON DELETE CASCADE,
    label text NOT NULL,
    color text NOT NULL DEFAULT '#3b82f6',
    applied_by_profile_id uuid REFERENCES public.profiles(id),
    applied_at timestamptz NOT NULL DEFAULT now(),
    PRIMARY KEY (lead_id, label)
);

COMMENT ON TABLE public.lead_labels IS 'Normalized labeling for leads (replacement for lead_tags).';

CREATE INDEX IF NOT EXISTS idx_lead_labels_label
    ON public.lead_labels (label);

CREATE TABLE IF NOT EXISTS public.lead_transfers (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    lead_id uuid NOT NULL REFERENCES public.leads(id) ON DELETE CASCADE,
    from_profile_id uuid REFERENCES public.profiles(id),
    to_profile_id uuid NOT NULL REFERENCES public.profiles(id),
    reason text,
    created_by_profile_id uuid REFERENCES public.profiles(id),
    created_at timestamptz NOT NULL DEFAULT now()
);

COMMENT ON TABLE public.lead_transfers IS 'History of ownership transfers and faces between agents/managers.';

CREATE INDEX IF NOT EXISTS idx_lead_transfers_lead_created_at
    ON public.lead_transfers (lead_id, created_at DESC);

CREATE TABLE IF NOT EXISTS public.lead_recommendations (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    lead_id uuid NOT NULL REFERENCES public.leads(id) ON DELETE CASCADE,
    generated_by_profile_id uuid REFERENCES public.profiles(id),
    filters jsonb NOT NULL DEFAULT '{}',
    top_units jsonb,
    recommendation text,
    result_count integer NOT NULL DEFAULT 0,
    created_at timestamptz NOT NULL DEFAULT now()
);

COMMENT ON TABLE public.lead_recommendations IS 'AI / rules driven inventory recommendations for a given lead.';

CREATE INDEX IF NOT EXISTS idx_lead_recommendations_lead
    ON public.lead_recommendations (lead_id);

CREATE TABLE IF NOT EXISTS public.lead_commerce (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    lead_id uuid REFERENCES public.leads(id) ON DELETE SET NULL,
    profile_id uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
    project_id uuid REFERENCES public.projects(id) ON DELETE SET NULL,
    commerce_type text NOT NULL CHECK (commerce_type IN ('request','allocation','purchase','refund')),
    status text NOT NULL CHECK (status IN ('pending','approved','fulfilled','rejected','cancelled')),
    quantity integer,
    amount numeric,
    currency text,
    payment_operation_id uuid REFERENCES public.payment_transactions(id),
    notes text,
    metadata jsonb NOT NULL DEFAULT '{}',
    created_at timestamptz NOT NULL DEFAULT now(),
    updated_at timestamptz NOT NULL DEFAULT now()
);

COMMENT ON TABLE public.lead_commerce IS 'Unified record of lead purchase, allocation, and refund workflows.';

CREATE INDEX IF NOT EXISTS idx_lead_commerce_profile_status
    ON public.lead_commerce (profile_id, status);

CREATE INDEX IF NOT EXISTS idx_lead_commerce_payment
    ON public.lead_commerce (payment_operation_id);

CREATE TABLE IF NOT EXISTS public.marketing_assets (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    title text NOT NULL,
    body text,
    cta jsonb,
    placement text NOT NULL,
    audience jsonb,
    status text NOT NULL CHECK (status IN ('draft','scheduled','live','archived')) DEFAULT 'draft',
    start_at timestamptz,
    end_at timestamptz,
    created_by_profile_id uuid REFERENCES public.profiles(id),
    created_at timestamptz NOT NULL DEFAULT now(),
    updated_at timestamptz NOT NULL DEFAULT now()
);

COMMENT ON TABLE public.marketing_assets IS 'CRM marketing banners / messages with targeting metadata.';

CREATE TABLE IF NOT EXISTS public.marketing_metrics (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    asset_id uuid NOT NULL REFERENCES public.marketing_assets(id) ON DELETE CASCADE,
    viewer_profile_id uuid REFERENCES public.profiles(id),
    event text NOT NULL CHECK (event IN ('impression','click')),
    created_at timestamptz NOT NULL DEFAULT now()
);

COMMENT ON TABLE public.marketing_metrics IS 'Per-profile marketing telemetry tied to marketing assets.';

CREATE INDEX IF NOT EXISTS idx_marketing_metrics_asset_event
    ON public.marketing_metrics (asset_id, event);

CREATE TABLE IF NOT EXISTS public.notification_events (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    target_profile_id uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
    context text NOT NULL CHECK (context IN ('lead','support','system')),
    context_id uuid,
    title text NOT NULL,
    body text,
    channels text[] NOT NULL DEFAULT ARRAY['inapp'],
    status text NOT NULL CHECK (status IN ('pending','sent','read')) DEFAULT 'pending',
    read_at timestamptz,
    sent_at timestamptz,
    metadata jsonb NOT NULL DEFAULT '{}',
    created_at timestamptz NOT NULL DEFAULT now()
);

COMMENT ON TABLE public.notification_events IS 'Normalized notification bus for lead/support/system alerts.';

CREATE INDEX IF NOT EXISTS idx_notification_events_target_status
    ON public.notification_events (target_profile_id, status);

CREATE INDEX IF NOT EXISTS idx_notification_events_context
    ON public.notification_events (context, context_id);

-- -----------------------------------------------------------------------------
-- Data Backfill
-- -----------------------------------------------------------------------------

-- Feedback history -> lead_events
INSERT INTO public.lead_events (id, lead_id, actor_profile_id, event_type, stage, summary, payload, created_at)
SELECT fh.id,
       fh.lead_id,
       fh.user_id,
       'feedback' AS event_type,
       NULL AS stage,
       NULL AS summary,
       jsonb_build_object(
           'source', 'feedback_history',
           'legacy_id', fh.id::text,
           'feedback_text', fh.feedback_text,
           'updated_at', fh.updated_at
       ) AS payload,
       fh.created_at
FROM public.feedback_history fh
ON CONFLICT (id) DO NOTHING;

-- Case feedback -> lead_events
INSERT INTO public.lead_events (id, lead_id, actor_profile_id, event_type, stage, summary, payload, created_at)
SELECT cf.id,
       cf.lead_id,
       cf.created_by,
       'feedback' AS event_type,
       cf.stage,
       cf.feedback,
       jsonb_build_object(
           'source', 'case_feedback',
           'legacy_id', cf.id::text,
           'ai_coach', cf.ai_coach
       ),
       cf.created_at
FROM public.case_feedback cf
ON CONFLICT (id) DO NOTHING;

-- Lead activities -> lead_events
INSERT INTO public.lead_events (id, lead_id, actor_profile_id, event_type, stage, summary, payload, created_at)
SELECT la.id,
       la.lead_id,
       la.user_id,
       CASE la.activity_type
           WHEN 'stage_changed' THEN 'stage_change'
           WHEN 'feedback_added' THEN 'feedback'
           WHEN 'note_added' THEN 'note'
           ELSE 'activity'
       END AS event_type,
       COALESCE(la.activity_data->>'new_stage', la.activity_data->>'stage'),
       la.description,
       jsonb_build_object(
           'source', 'lead_activities',
           'legacy_id', la.id::text,
           'activity_type', la.activity_type,
           'activity_data', la.activity_data
       ),
       la.created_at
FROM public.lead_activities la
ON CONFLICT (id) DO NOTHING;

-- Lead reminders -> lead_tasks
INSERT INTO public.lead_tasks (id, lead_id, created_by_profile_id, assignee_profile_id, task_type, status, due_at, completed_at, payload, created_at, updated_at)
SELECT lr.id,
       lr.lead_id,
       lr.user_id,
       lr.user_id,
       'follow_up' AS task_type,
       CASE WHEN lr.is_completed THEN 'completed' ELSE 'pending' END AS status,
       lr.reminder_date,
       CASE WHEN lr.is_completed THEN lr.completed_at END,
       jsonb_build_object(
           'source', 'lead_reminders',
           'legacy_id', lr.id::text,
           'reminder_text', lr.reminder_text
       ),
       lr.created_at,
       lr.updated_at
FROM public.lead_reminders lr
ON CONFLICT (id) DO NOTHING;

-- Case actions -> lead_tasks
INSERT INTO public.lead_tasks (id, lead_id, created_by_profile_id, assignee_profile_id, task_type, status, due_at, completed_at, payload, created_at, updated_at)
SELECT ca.id,
       ca.lead_id,
       ca.created_by,
       ca.created_by,
       CASE
           WHEN lower(ca.action_type) IN ('call','meeting') THEN lower(ca.action_type)
           WHEN lower(ca.action_type) = 'document' THEN 'document'
           ELSE 'custom'
       END,
       CASE
           WHEN upper(ca.status) IN ('COMPLETED','DONE') THEN 'completed'
           WHEN upper(ca.status) IN ('CANCELLED','CANCELED') THEN 'cancelled'
           ELSE 'pending'
       END,
       ca.due_at,
       ca.completed_at,
       jsonb_build_object(
           'source', 'case_actions',
           'legacy_id', ca.id::text,
           'action_type', ca.action_type,
           'payload', ca.payload,
           'notified_at', ca.notified_at
       ),
       ca.created_at,
       ca.created_at
FROM public.case_actions ca
ON CONFLICT (id) DO NOTHING;

-- Lead tags -> lead_labels
INSERT INTO public.lead_labels (lead_id, label, color, applied_by_profile_id, applied_at)
SELECT lt.lead_id,
       lt.tag_name,
       COALESCE(lt.color, '#3b82f6'),
       lt.created_by,
       lt.created_at
FROM public.lead_tags lt
ON CONFLICT (lead_id, label) DO NOTHING;

-- Case faces -> lead_transfers
INSERT INTO public.lead_transfers (id, lead_id, from_profile_id, to_profile_id, reason, created_by_profile_id, created_at)
SELECT cf.id,
       cf.lead_id,
       cf.from_agent,
       cf.to_agent,
       cf.reason,
       cf.created_by,
       cf.created_at
FROM public.case_faces cf
ON CONFLICT (id) DO NOTHING;

-- Inventory matches -> lead_recommendations
INSERT INTO public.lead_recommendations (id, lead_id, generated_by_profile_id, filters, top_units, recommendation, result_count, created_at)
SELECT im.id,
       im.lead_id,
       im.created_by,
       COALESCE(im.filters, '{}'::jsonb),
       im.top_units,
       im.recommendation,
       im.result_count,
       im.created_at
FROM public.inventory_matches im
ON CONFLICT (id) DO NOTHING;

-- Lead requests -> lead_commerce
INSERT INTO public.lead_commerce (id, lead_id, profile_id, project_id, commerce_type, status, quantity, amount, currency, payment_operation_id, notes, metadata, created_at, updated_at)
SELECT lr.id,
       NULL,
       lr.user_id,
       lr.project_id,
       'request' AS commerce_type,
       lr.status,
       lr.quantity,
       lr.budget,
       NULL,
       NULL,
       lr.notes,
       jsonb_build_object(
           'source', 'lead_requests',
           'project_name', lr.project_name
       ),
       lr.created_at,
       lr.updated_at
FROM public.lead_requests lr
ON CONFLICT (id) DO NOTHING;

-- Purchase requests -> lead_commerce
INSERT INTO public.lead_commerce (id, lead_id, profile_id, project_id, commerce_type, status, quantity, amount, currency, payment_operation_id, notes, metadata, created_at, updated_at)
SELECT pr.id,
       NULL,
       pr.user_id,
       pr.project_id,
       'allocation' AS commerce_type,
       pr.status,
       pr.quantity,
       pr.total_amount,
       NULL,
       NULL,
       pr.admin_notes,
       jsonb_build_object(
           'source', 'purchase_requests',
           'receipt_url', pr.receipt_url,
           'payment_method', pr.payment_method,
           'receipt_file_name', pr.receipt_file_name,
           'approved_by', pr.approved_by,
           'approved_at', pr.approved_at,
           'rejected_reason', pr.rejected_reason,
           'project_name', pr.project_name
       ),
       pr.created_at,
       pr.updated_at
FROM public.purchase_requests pr
ON CONFLICT (id) DO NOTHING;

-- Dashboard banners -> marketing_assets
INSERT INTO public.marketing_assets (id, title, body, cta, placement, audience, status, start_at, end_at, created_by_profile_id, created_at, updated_at)
SELECT db.id,
       db.title,
       db.subtitle,
       jsonb_build_object('cta_label', db.cta_label, 'cta_url', db.cta_url, 'image_url', db.image_url),
       db.placement,
       jsonb_build_object('audience', db.audience, 'visibility_rules', db.visibility_rules),
       db.status,
       db.start_at,
       db.end_at,
       db.created_by,
       db.created_at,
       db.updated_at
FROM public.dashboard_banners db
ON CONFLICT (id) DO NOTHING;

-- Banner metrics -> marketing_metrics
INSERT INTO public.marketing_metrics (id, asset_id, viewer_profile_id, event, created_at)
SELECT bm.id,
       bm.banner_id,
       bm.viewer_id,
       bm.event,
       bm.created_at
FROM public.banner_metrics bm
ON CONFLICT (id) DO NOTHING;

-- Notifications -> notification_events
INSERT INTO public.notification_events (id, target_profile_id, context, context_id, title, body, channels, status, read_at, sent_at, metadata, created_at)
SELECT n.id,
       n.user_id,
       'system'::text,
       NULL,
       n.title,
       n.body,
       COALESCE(n.channels, ARRAY['inapp']),
       n.status,
       n.read_at,
       n.sent_at,
       jsonb_build_object('source', 'notifications', 'url', n.url),
       n.created_at
FROM public.notifications n
ON CONFLICT (id) DO NOTHING;

-- -----------------------------------------------------------------------------
-- Compatibility Views (read-only helpers for transition)
-- -----------------------------------------------------------------------------

CREATE OR REPLACE VIEW public.feedback_history_consolidated AS
SELECT
    le.id AS feedback_id,
    le.lead_id,
    le.actor_profile_id AS user_id,
    COALESCE(le.payload->>'feedback_text', le.summary) AS feedback_text,
    le.created_at,
    (le.payload->>'updated_at')::timestamptz AS updated_at,
    le.payload
FROM public.lead_events le
WHERE le.event_type = 'feedback';

CREATE OR REPLACE VIEW public.lead_reminders_consolidated AS
SELECT
    lt.id,
    lt.lead_id,
    lt.created_by_profile_id AS user_id,
    lt.due_at AS reminder_date,
    lt.payload->>'reminder_text' AS reminder_text,
    lt.status,
    (lt.status = 'completed') AS is_completed,
    lt.completed_at,
    lt.created_at,
    lt.updated_at
FROM public.lead_tasks lt
WHERE lt.task_type = 'follow_up';

CREATE OR REPLACE VIEW public.notifications_consolidated AS
SELECT
    ne.id,
    ne.target_profile_id AS user_id,
    ne.title,
    ne.body,
    ne.metadata->>'url' AS url,
    ne.channels,
    ne.status,
    ne.read_at,
    ne.sent_at,
    ne.created_at
FROM public.notification_events ne;

COMMIT;
