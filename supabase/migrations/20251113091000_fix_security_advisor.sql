-- ============================================================================
-- Address Supabase Security Advisor findings
-- - Set security_invoker = true on compatibility views
-- - Enable RLS and add policies for consolidated domain tables
-- - Ensure functions in the public schema use a fixed search_path
-- ============================================================================

BEGIN;

-- ---------------------------------------------------------------------------
-- Ensure compatibility views run with caller privileges
-- ---------------------------------------------------------------------------
DO $$
DECLARE
  view_name text;
  target_views text[] := ARRAY[
    'payment_transactions',
    'wallet_transactions',
    'support_cases',
    'wallet_transactions_consolidated',
    'feedback_history',
    'purchase_requests',
    'projects_with_lead_counts',
    'lead_tags',
    'support_case_replies',
    'dashboard_banners',
    'user_wallets',
    'team_hierarchy_consolidated',
    'banner_metrics',
    'lead_requests',
    'user_wallets_consolidated',
    'lead_activities',
    'payment_transactions_consolidated',
    'inventory_matches',
    'notifications',
    'case_faces',
    'case_feedback',
    'lead_reminders',
    'wallet_topup_requests',
    'case_actions',
    'lead_availability'
  ];
BEGIN
  FOREACH view_name IN ARRAY target_views LOOP
    IF EXISTS (
      SELECT 1
      FROM pg_views
      WHERE schemaname = 'public'
        AND viewname = view_name
    ) THEN
      EXECUTE format('ALTER VIEW public.%I SET (security_invoker = true)', view_name);
    ELSE
      RAISE NOTICE 'View public.% does not exist, skipping security_invoker update', view_name;
    END IF;
  END LOOP;
END
$$;

-- ---------------------------------------------------------------------------
-- Enable RLS and create policies for consolidated lead workflow tables
-- ---------------------------------------------------------------------------

ALTER TABLE public.lead_events ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "lead_events_access" ON public.lead_events;
CREATE POLICY "lead_events_access"
  ON public.lead_events
  FOR ALL
  USING (auth.role() = 'service_role' OR public.can_access_lead(lead_id))
  WITH CHECK (auth.role() = 'service_role' OR public.can_access_lead(lead_id));

ALTER TABLE public.lead_tasks ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "lead_tasks_access" ON public.lead_tasks;
CREATE POLICY "lead_tasks_access"
  ON public.lead_tasks
  FOR ALL
  USING (auth.role() = 'service_role' OR public.can_access_lead(lead_id))
  WITH CHECK (auth.role() = 'service_role' OR public.can_access_lead(lead_id));

ALTER TABLE public.lead_labels ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "lead_labels_access" ON public.lead_labels;
CREATE POLICY "lead_labels_access"
  ON public.lead_labels
  FOR ALL
  USING (auth.role() = 'service_role' OR public.can_access_lead(lead_id))
  WITH CHECK (auth.role() = 'service_role' OR public.can_access_lead(lead_id));

ALTER TABLE public.lead_label_ids ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "lead_label_ids_access" ON public.lead_label_ids;
CREATE POLICY "lead_label_ids_access"
  ON public.lead_label_ids
  FOR ALL
  USING (auth.role() = 'service_role' OR public.can_access_lead(lead_id))
  WITH CHECK (auth.role() = 'service_role' OR public.can_access_lead(lead_id));

ALTER TABLE public.lead_transfers ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "lead_transfers_access" ON public.lead_transfers;
CREATE POLICY "lead_transfers_access"
  ON public.lead_transfers
  FOR ALL
  USING (auth.role() = 'service_role' OR public.can_access_lead(lead_id))
  WITH CHECK (auth.role() = 'service_role' OR public.can_access_lead(lead_id));

ALTER TABLE public.lead_recommendations ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "lead_recommendations_access" ON public.lead_recommendations;
CREATE POLICY "lead_recommendations_access"
  ON public.lead_recommendations
  FOR ALL
  USING (auth.role() = 'service_role' OR public.can_access_lead(lead_id))
  WITH CHECK (auth.role() = 'service_role' OR public.can_access_lead(lead_id));

ALTER TABLE public.lead_commerce ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "lead_commerce_access" ON public.lead_commerce;
CREATE POLICY "lead_commerce_access"
  ON public.lead_commerce
  FOR ALL
  USING (
    auth.role() = 'service_role'
    OR public.can_access_lead(lead_id)
    OR profile_id = auth.uid()
    OR public.is_user_role(auth.uid(), ARRAY['admin','support','manager'])
  )
  WITH CHECK (
    auth.role() = 'service_role'
    OR public.can_access_lead(lead_id)
    OR profile_id = auth.uid()
    OR public.is_user_role(auth.uid(), ARRAY['admin','support','manager'])
  );

-- ---------------------------------------------------------------------------
-- Marketing assets and metrics
-- ---------------------------------------------------------------------------

ALTER TABLE public.marketing_assets ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "marketing_assets_public_live" ON public.marketing_assets;
CREATE POLICY "marketing_assets_public_live"
  ON public.marketing_assets
  FOR SELECT
  USING (status = 'live');

DROP POLICY IF EXISTS "marketing_assets_admin_all" ON public.marketing_assets;
CREATE POLICY "marketing_assets_admin_all"
  ON public.marketing_assets
  FOR ALL
  USING (public.is_user_role(auth.uid(), ARRAY['admin']))
  WITH CHECK (public.is_user_role(auth.uid(), ARRAY['admin']));

ALTER TABLE public.marketing_metrics ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "marketing_metrics_admin_read" ON public.marketing_metrics;
CREATE POLICY "marketing_metrics_admin_read"
  ON public.marketing_metrics
  FOR SELECT
  USING (public.is_user_role(auth.uid(), ARRAY['admin']));

DROP POLICY IF EXISTS "marketing_metrics_self_insert" ON public.marketing_metrics;
CREATE POLICY "marketing_metrics_self_insert"
  ON public.marketing_metrics
  FOR INSERT
  WITH CHECK (
    auth.role() = 'service_role'
    OR auth.uid() = viewer_profile_id
    OR public.is_user_role(auth.uid(), ARRAY['admin'])
  );

-- ---------------------------------------------------------------------------
-- Notifications and payments
-- ---------------------------------------------------------------------------

ALTER TABLE public.notification_events ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "notification_events_read" ON public.notification_events;
CREATE POLICY "notification_events_read"
  ON public.notification_events
  FOR SELECT
  USING (
    target_profile_id = auth.uid()
    OR public.is_user_role(auth.uid(), ARRAY['admin','support'])
  );

DROP POLICY IF EXISTS "notification_events_update" ON public.notification_events;
CREATE POLICY "notification_events_update"
  ON public.notification_events
  FOR UPDATE
  USING (target_profile_id = auth.uid())
  WITH CHECK (target_profile_id = auth.uid());

ALTER TABLE public.payment_operations ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "payment_operations_read" ON public.payment_operations;
CREATE POLICY "payment_operations_read"
  ON public.payment_operations
  FOR SELECT
  USING (
    profile_id = auth.uid()
    OR auth.role() = 'service_role'
    OR public.is_user_role(auth.uid(), ARRAY['admin','support'])
  );

DROP POLICY IF EXISTS "payment_operations_insert" ON public.payment_operations;
CREATE POLICY "payment_operations_insert"
  ON public.payment_operations
  FOR INSERT
  WITH CHECK (
    auth.role() = 'service_role'
    OR profile_id = auth.uid()
    OR public.is_user_role(auth.uid(), ARRAY['admin','support'])
  );

DROP POLICY IF EXISTS "payment_operations_update" ON public.payment_operations;
CREATE POLICY "payment_operations_update"
  ON public.payment_operations
  FOR UPDATE
  USING (
    auth.role() = 'service_role'
    OR public.is_user_role(auth.uid(), ARRAY['admin','support'])
  )
  WITH CHECK (
    auth.role() = 'service_role'
    OR public.is_user_role(auth.uid(), ARRAY['admin','support'])
  );

-- ---------------------------------------------------------------------------
-- Wallets
-- ---------------------------------------------------------------------------

ALTER TABLE public.profile_wallets ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "profile_wallets_read" ON public.profile_wallets;
CREATE POLICY "profile_wallets_read"
  ON public.profile_wallets
  FOR SELECT
  USING (
    profile_id = auth.uid()
    OR auth.role() = 'service_role'
    OR public.is_user_role(auth.uid(), ARRAY['admin','support'])
  );

DROP POLICY IF EXISTS "profile_wallets_mutate" ON public.profile_wallets;
CREATE POLICY "profile_wallets_mutate"
  ON public.profile_wallets
  FOR ALL
  USING (
    auth.role() = 'service_role'
    OR public.is_user_role(auth.uid(), ARRAY['admin','support'])
    OR profile_id = auth.uid()
  )
  WITH CHECK (
    auth.role() = 'service_role'
    OR public.is_user_role(auth.uid(), ARRAY['admin','support'])
    OR profile_id = auth.uid()
  );

ALTER TABLE public.wallet_entries ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "wallet_entries_read" ON public.wallet_entries;
CREATE POLICY "wallet_entries_read"
  ON public.wallet_entries
  FOR SELECT
  USING (
    profile_id = auth.uid()
    OR auth.role() = 'service_role'
    OR public.is_user_role(auth.uid(), ARRAY['admin','support'])
  );

-- ---------------------------------------------------------------------------
-- Teams & membership
-- ---------------------------------------------------------------------------

ALTER TABLE public.teams ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "teams_read" ON public.teams;
CREATE POLICY "teams_read"
  ON public.teams
  FOR SELECT
  USING (
    public.is_user_role(auth.uid(), ARRAY['admin','support'])
    OR owner_profile_id = auth.uid()
    OR EXISTS (
      SELECT 1
      FROM public.team_members tm
      WHERE tm.team_id = teams.id
        AND tm.profile_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "teams_manage" ON public.teams;
CREATE POLICY "teams_manage"
  ON public.teams
  FOR ALL
  USING (
    public.is_user_role(auth.uid(), ARRAY['admin'])
    OR owner_profile_id = auth.uid()
  )
  WITH CHECK (
    public.is_user_role(auth.uid(), ARRAY['admin'])
    OR owner_profile_id = auth.uid()
  );

ALTER TABLE public.team_members ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "team_members_read" ON public.team_members;
CREATE POLICY "team_members_read"
  ON public.team_members
  FOR SELECT
  USING (
    public.is_user_role(auth.uid(), ARRAY['admin','support'])
    OR profile_id = auth.uid()
    OR EXISTS (
      SELECT 1
      FROM public.teams t
      WHERE t.id = team_members.team_id
        AND (t.owner_profile_id = auth.uid()
             OR public.is_user_role(auth.uid(), ARRAY['admin']))
    )
  );

DROP POLICY IF EXISTS "team_members_manage" ON public.team_members;
CREATE POLICY "team_members_manage"
  ON public.team_members
  FOR ALL
  USING (
    public.is_user_role(auth.uid(), ARRAY['admin'])
    OR EXISTS (
      SELECT 1
      FROM public.teams t
      WHERE t.id = team_members.team_id
        AND t.owner_profile_id = auth.uid()
    )
  )
  WITH CHECK (
    public.is_user_role(auth.uid(), ARRAY['admin'])
    OR EXISTS (
      SELECT 1
      FROM public.teams t
      WHERE t.id = team_members.team_id
        AND t.owner_profile_id = auth.uid()
    )
  );

-- ---------------------------------------------------------------------------
-- Support domain
-- ---------------------------------------------------------------------------

ALTER TABLE public.support_threads ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "support_threads_read" ON public.support_threads;
CREATE POLICY "support_threads_read"
  ON public.support_threads
  FOR SELECT
  USING (
    public.is_user_role(auth.uid(), ARRAY['admin','support'])
    OR created_by_profile_id = auth.uid()
    OR assigned_to_profile_id = auth.uid()
  );

DROP POLICY IF EXISTS "support_threads_insert" ON public.support_threads;
CREATE POLICY "support_threads_insert"
  ON public.support_threads
  FOR INSERT
  WITH CHECK (created_by_profile_id = auth.uid() OR public.is_user_role(auth.uid(), ARRAY['admin','support']));

DROP POLICY IF EXISTS "support_threads_update" ON public.support_threads;
CREATE POLICY "support_threads_update"
  ON public.support_threads
  FOR UPDATE
  USING (
    public.is_user_role(auth.uid(), ARRAY['admin','support'])
    OR assigned_to_profile_id = auth.uid()
    OR created_by_profile_id = auth.uid()
  )
  WITH CHECK (
    public.is_user_role(auth.uid(), ARRAY['admin','support'])
    OR assigned_to_profile_id = auth.uid()
    OR created_by_profile_id = auth.uid()
  );

DROP POLICY IF EXISTS "support_threads_delete" ON public.support_threads;
CREATE POLICY "support_threads_delete"
  ON public.support_threads
  FOR DELETE
  USING (public.is_user_role(auth.uid(), ARRAY['admin']));

ALTER TABLE public.support_messages ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "support_messages_read" ON public.support_messages;
CREATE POLICY "support_messages_read"
  ON public.support_messages
  FOR SELECT
  USING (
    public.is_user_role(auth.uid(), ARRAY['admin','support'])
    OR author_profile_id = auth.uid()
    OR EXISTS (
      SELECT 1
      FROM public.support_threads st
      WHERE st.id = support_messages.thread_id
        AND (
          st.created_by_profile_id = auth.uid()
          OR st.assigned_to_profile_id = auth.uid()
        )
    )
  );

DROP POLICY IF EXISTS "support_messages_insert" ON public.support_messages;
CREATE POLICY "support_messages_insert"
  ON public.support_messages
  FOR INSERT
  WITH CHECK (
    public.is_user_role(auth.uid(), ARRAY['admin','support'])
    OR author_profile_id = auth.uid()
    OR EXISTS (
      SELECT 1
      FROM public.support_threads st
      WHERE st.id = support_messages.thread_id
        AND (
          st.created_by_profile_id = auth.uid()
          OR st.assigned_to_profile_id = auth.uid()
        )
    )
  );

DROP POLICY IF EXISTS "support_messages_update" ON public.support_messages;
CREATE POLICY "support_messages_update"
  ON public.support_messages
  FOR UPDATE
  USING (
    public.is_user_role(auth.uid(), ARRAY['admin','support'])
    OR author_profile_id = auth.uid()
  )
  WITH CHECK (
    public.is_user_role(auth.uid(), ARRAY['admin','support'])
    OR author_profile_id = auth.uid()
  );

DROP POLICY IF EXISTS "support_messages_delete" ON public.support_messages;
CREATE POLICY "support_messages_delete"
  ON public.support_messages
  FOR DELETE
  USING (
    public.is_user_role(auth.uid(), ARRAY['admin','support'])
    OR author_profile_id = auth.uid()
  );

-- ---------------------------------------------------------------------------
-- Harden function search_path for public schema functions
-- ---------------------------------------------------------------------------

DO $$
DECLARE
  fn RECORD;
BEGIN
  FOR fn IN
    SELECT
      n.nspname,
      p.proname,
      pg_get_function_identity_arguments(p.oid) AS identity_arguments,
      p.proconfig
    FROM pg_proc p
    JOIN pg_namespace n ON n.oid = p.pronamespace
    WHERE n.nspname = 'public'
      AND p.prokind IN ('f', 'p')
      AND (
        p.proconfig IS NULL
        OR NOT EXISTS (
          SELECT 1
          FROM unnest(p.proconfig) AS cfg
          WHERE cfg LIKE 'search_path=%'
        )
      )
  LOOP
    BEGIN
      EXECUTE format(
        'ALTER FUNCTION %I.%I(%s) SET search_path = public',
        fn.nspname,
        fn.proname,
        fn.identity_arguments
      );
    EXCEPTION
      WHEN undefined_function THEN
        RAISE NOTICE 'Function %.%(%s) no longer exists, skipping',
          fn.nspname, fn.proname, fn.identity_arguments;
      WHEN insufficient_privilege THEN
        RAISE NOTICE 'Insufficient privilege altering %.%(%s)',
          fn.nspname, fn.proname, fn.identity_arguments;
      WHEN others THEN
        RAISE NOTICE 'Skipping %.%(%s): %',
          fn.nspname, fn.proname, fn.identity_arguments, SQLERRM;
    END;
  END LOOP;
END
$$;

COMMIT;




















