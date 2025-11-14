BEGIN;

-- -----------------------------------------------------------------------------
-- Support Domain Merge (Phase 3)
-- Creates threaded support model and backfills existing ticket data
-- while retaining legacy tables for compatibility.
-- -----------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS public.support_threads (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    subject text NOT NULL,
    topic text,
    issue text,
    status text NOT NULL CHECK (status IN ('open','in_progress','solved','closed')) DEFAULT 'open',
    priority text NOT NULL CHECK (priority IN ('low','medium','high','urgent')) DEFAULT 'medium',
    created_by_profile_id uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
    assigned_to_profile_id uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
    context jsonb NOT NULL DEFAULT '{}',
    created_at timestamptz NOT NULL DEFAULT now(),
    updated_at timestamptz NOT NULL DEFAULT now()
);

COMMENT ON TABLE public.support_threads IS 'Ticket header for support conversations (merges support_cases metadata).';

CREATE INDEX IF NOT EXISTS idx_support_threads_status
    ON public.support_threads (status);

CREATE INDEX IF NOT EXISTS idx_support_threads_assigned_to
    ON public.support_threads (assigned_to_profile_id);

CREATE TABLE IF NOT EXISTS public.support_messages (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    thread_id uuid NOT NULL REFERENCES public.support_threads(id) ON DELETE CASCADE,
    author_profile_id uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
    message_type text NOT NULL CHECK (message_type IN ('user','internal','system')) DEFAULT 'user',
    body text NOT NULL,
    attachments jsonb NOT NULL DEFAULT '[]',
    created_at timestamptz NOT NULL DEFAULT now(),
    updated_at timestamptz NOT NULL DEFAULT now()
);

COMMENT ON TABLE public.support_messages IS 'Messages within a support thread; initial case description plus replies/notes.';

CREATE INDEX IF NOT EXISTS idx_support_messages_thread_created_at
    ON public.support_messages (thread_id, created_at);

-- -----------------------------------------------------------------------------
-- Data Backfill
-- -----------------------------------------------------------------------------

-- Support cases -> support_threads
INSERT INTO public.support_threads (id, subject, topic, issue, status, priority, created_by_profile_id, assigned_to_profile_id, context, created_at, updated_at)
SELECT sc.id,
       sc.subject,
       sc.topic,
       sc.issue,
       CASE
           WHEN sc.status ILIKE 'closed' THEN 'closed'
           WHEN sc.status ILIKE 'resolved' THEN 'solved'
           WHEN sc.status ILIKE 'in_progress' THEN 'in_progress'
           ELSE 'open'
       END,
       COALESCE(sc.priority, 'medium'),
       CASE WHEN creator.id IS NULL THEN NULL ELSE sc.created_by END,
       CASE WHEN assignee.id IS NULL THEN NULL ELSE sc.assigned_to END,
       jsonb_build_object(
           'description', sc.description,
           'legacy_priority', sc.priority
       ),
       sc.created_at,
       sc.updated_at
FROM public.support_cases sc
LEFT JOIN public.profiles creator ON creator.id = sc.created_by
LEFT JOIN public.profiles assignee ON assignee.id = sc.assigned_to
ON CONFLICT (id) DO NOTHING;

-- Initial case description -> support_messages
INSERT INTO public.support_messages (id, thread_id, author_profile_id, message_type, body, attachments, created_at, updated_at)
SELECT sc.id,
       sc.id,
       CASE WHEN creator.id IS NULL THEN NULL ELSE sc.created_by END,
       'user' AS message_type,
       sc.description,
       '[]'::jsonb,
       sc.created_at,
       sc.updated_at
FROM public.support_cases sc
LEFT JOIN public.profiles creator ON creator.id = sc.created_by
WHERE sc.description IS NOT NULL
ON CONFLICT (id) DO NOTHING;

-- Support case replies -> support_messages
INSERT INTO public.support_messages (id, thread_id, author_profile_id, message_type, body, attachments, created_at, updated_at)
SELECT scr.id,
       scr.case_id,
       CASE WHEN reply_author.id IS NULL THEN NULL ELSE scr.user_id END,
       CASE WHEN scr.is_internal_note THEN 'internal' ELSE 'user' END,
       scr.message,
       '[]'::jsonb,
       COALESCE(scr.created_at, now()),
       COALESCE(scr.updated_at, scr.created_at, now())
FROM public.support_case_replies scr
LEFT JOIN public.profiles reply_author ON reply_author.id = scr.user_id
ON CONFLICT (id) DO NOTHING;

-- -----------------------------------------------------------------------------
-- Compatibility Views
-- -----------------------------------------------------------------------------

CREATE OR REPLACE VIEW public.support_cases_consolidated AS
SELECT st.id,
       st.subject,
       st.topic,
       st.issue,
       st.status,
       st.priority,
       st.created_by_profile_id AS created_by,
       st.assigned_to_profile_id AS assigned_to,
       st.context->>'description' AS description,
       st.created_at,
       st.updated_at
FROM public.support_threads st;

CREATE OR REPLACE VIEW public.support_case_replies_consolidated AS
SELECT sm.id,
       sm.thread_id AS case_id,
       sm.author_profile_id AS user_id,
       sm.body AS message,
       (sm.message_type = 'internal') AS is_internal_note,
       sm.created_at,
       sm.updated_at
FROM public.support_messages sm
WHERE sm.message_type IN ('user','internal');

COMMIT;
