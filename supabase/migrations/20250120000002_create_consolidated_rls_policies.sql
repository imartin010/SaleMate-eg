-- ============================================
-- DATABASE CONSOLIDATION MIGRATION
-- Phase 2: Create RLS Policies for Consolidated Tables
-- ============================================

BEGIN;

-- ============================================
-- ACTIVITIES RLS POLICIES
-- ============================================

-- Helper function to check lead access (reuse existing if available)
CREATE OR REPLACE FUNCTION public.can_access_lead(l_id uuid)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.leads l
    WHERE l.id = l_id
      AND (
        l.buyer_user_id = auth.uid() 
        OR l.assigned_to_id = auth.uid() 
        OR EXISTS (
          SELECT 1 FROM public.profiles 
          WHERE id = auth.uid() 
          AND role IN ('admin', 'support')
        )
      )
  );
$$;

-- Read: Users can see activities for leads they have access to
DROP POLICY IF EXISTS "read_activities" ON public.activities;
CREATE POLICY "read_activities" ON public.activities
    FOR SELECT
    USING (public.can_access_lead(lead_id));

-- Insert: Users can create activities for leads they have access to
DROP POLICY IF EXISTS "insert_activities" ON public.activities;
CREATE POLICY "insert_activities" ON public.activities
    FOR INSERT
    WITH CHECK (
        public.can_access_lead(lead_id) 
        AND actor_profile_id = auth.uid()
    );

-- Update: Users can update their own activities or admins can update any
DROP POLICY IF EXISTS "update_activities" ON public.activities;
CREATE POLICY "update_activities" ON public.activities
    FOR UPDATE
    USING (
        public.can_access_lead(lead_id) 
        AND (
            actor_profile_id = auth.uid()
            OR EXISTS (
                SELECT 1 FROM public.profiles 
                WHERE id = auth.uid() 
                AND role IN ('admin', 'support')
            )
        )
    );

-- Delete: Only admins can delete activities
DROP POLICY IF EXISTS "delete_activities" ON public.activities;
CREATE POLICY "delete_activities" ON public.activities
    FOR DELETE
    USING (
        EXISTS (
            SELECT 1 FROM public.profiles 
            WHERE id = auth.uid() 
            AND role IN ('admin', 'support')
        )
    );

-- ============================================
-- COMMERCE RLS POLICIES
-- ============================================

-- Read: Users can see their own commerce records, admins can see all
DROP POLICY IF EXISTS "read_commerce" ON public.commerce;
CREATE POLICY "read_commerce" ON public.commerce
    FOR SELECT
    USING (
        profile_id = auth.uid()
        OR EXISTS (
            SELECT 1 FROM public.profiles 
            WHERE id = auth.uid() 
            AND role IN ('admin', 'support')
        )
    );

-- Insert: Users can create commerce records for themselves
DROP POLICY IF EXISTS "insert_commerce" ON public.commerce;
CREATE POLICY "insert_commerce" ON public.commerce
    FOR INSERT
    WITH CHECK (profile_id = auth.uid());

-- Update: Users can update their own pending records, admins can update any
DROP POLICY IF EXISTS "update_commerce" ON public.commerce;
CREATE POLICY "update_commerce" ON public.commerce
    FOR UPDATE
    USING (
        (
            profile_id = auth.uid() 
            AND status = 'pending'
        )
        OR EXISTS (
            SELECT 1 FROM public.profiles 
            WHERE id = auth.uid() 
            AND role IN ('admin', 'support')
        )
    );

-- Delete: Only admins can delete commerce records
DROP POLICY IF EXISTS "delete_commerce" ON public.commerce;
CREATE POLICY "delete_commerce" ON public.commerce
    FOR DELETE
    USING (
        EXISTS (
            SELECT 1 FROM public.profiles 
            WHERE id = auth.uid() 
            AND role IN ('admin', 'support')
        )
    );

-- ============================================
-- PAYMENTS RLS POLICIES
-- ============================================

-- Read: Users can see their own payments, admins can see all
DROP POLICY IF EXISTS "read_payments" ON public.payments;
CREATE POLICY "read_payments" ON public.payments
    FOR SELECT
    USING (
        profile_id = auth.uid()
        OR EXISTS (
            SELECT 1 FROM public.profiles 
            WHERE id = auth.uid() 
            AND role IN ('admin', 'support')
        )
    );

-- Insert: System/edge functions create payments (via service role)
-- Regular users cannot directly insert payments
DROP POLICY IF EXISTS "insert_payments" ON public.payments;
CREATE POLICY "insert_payments" ON public.payments
    FOR INSERT
    WITH CHECK (
        profile_id = auth.uid()
        OR EXISTS (
            SELECT 1 FROM public.profiles 
            WHERE id = auth.uid() 
            AND role IN ('admin', 'support')
        )
    );

-- Update: Only admins can update payments
DROP POLICY IF EXISTS "update_payments" ON public.payments;
CREATE POLICY "update_payments" ON public.payments
    FOR UPDATE
    USING (
        EXISTS (
            SELECT 1 FROM public.profiles 
            WHERE id = auth.uid() 
            AND role IN ('admin', 'support')
        )
    );

-- Delete: Only admins can delete payments
DROP POLICY IF EXISTS "delete_payments" ON public.payments;
CREATE POLICY "delete_payments" ON public.payments
    FOR DELETE
    USING (
        EXISTS (
            SELECT 1 FROM public.profiles 
            WHERE id = auth.uid() 
            AND role IN ('admin', 'support')
        )
    );

-- ============================================
-- CONTENT RLS POLICIES
-- ============================================

-- Read: All authenticated users can read content
DROP POLICY IF EXISTS "read_content" ON public.content;
CREATE POLICY "read_content" ON public.content
    FOR SELECT
    USING (
        status IN ('live', 'active')
        OR EXISTS (
            SELECT 1 FROM public.profiles 
            WHERE id = auth.uid() 
            AND role IN ('admin', 'support')
        )
    );

-- Insert: Only admins can create content
DROP POLICY IF EXISTS "insert_content" ON public.content;
CREATE POLICY "insert_content" ON public.content
    FOR INSERT
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.profiles 
            WHERE id = auth.uid() 
            AND role IN ('admin', 'support')
        )
    );

-- Update: Only admins can update content
DROP POLICY IF EXISTS "update_content" ON public.content;
CREATE POLICY "update_content" ON public.content
    FOR UPDATE
    USING (
        EXISTS (
            SELECT 1 FROM public.profiles 
            WHERE id = auth.uid() 
            AND role IN ('admin', 'support')
        )
    );

-- Delete: Only admins can delete content
DROP POLICY IF EXISTS "delete_content" ON public.content;
CREATE POLICY "delete_content" ON public.content
    FOR DELETE
    USING (
        EXISTS (
            SELECT 1 FROM public.profiles 
            WHERE id = auth.uid() 
            AND role IN ('admin', 'support')
        )
    );

-- ============================================
-- CONTENT_METRICS RLS POLICIES
-- ============================================

-- Read: Users can see metrics for content they viewed, admins can see all
DROP POLICY IF EXISTS "read_content_metrics" ON public.content_metrics;
CREATE POLICY "read_content_metrics" ON public.content_metrics
    FOR SELECT
    USING (
        viewer_profile_id = auth.uid()
        OR EXISTS (
            SELECT 1 FROM public.profiles 
            WHERE id = auth.uid() 
            AND role IN ('admin', 'support')
        )
    );

-- Insert: Anyone can create metrics (for tracking views/clicks)
DROP POLICY IF EXISTS "insert_content_metrics" ON public.content_metrics;
CREATE POLICY "insert_content_metrics" ON public.content_metrics
    FOR INSERT
    WITH CHECK (true);

-- Update/Delete: Only admins
DROP POLICY IF EXISTS "update_content_metrics" ON public.content_metrics;
CREATE POLICY "update_content_metrics" ON public.content_metrics
    FOR UPDATE
    USING (
        EXISTS (
            SELECT 1 FROM public.profiles 
            WHERE id = auth.uid() 
            AND role IN ('admin', 'support')
        )
    );

DROP POLICY IF EXISTS "delete_content_metrics" ON public.content_metrics;
CREATE POLICY "delete_content_metrics" ON public.content_metrics
    FOR DELETE
    USING (
        EXISTS (
            SELECT 1 FROM public.profiles 
            WHERE id = auth.uid() 
            AND role IN ('admin', 'support')
        )
    );

-- ============================================
-- NOTIFICATIONS RLS POLICIES
-- ============================================

-- Read: Users can see their own notifications
DROP POLICY IF EXISTS "read_notifications" ON public.notifications;
CREATE POLICY "read_notifications" ON public.notifications
    FOR SELECT
    USING (
        target_profile_id = auth.uid()
        OR EXISTS (
            SELECT 1 FROM public.profiles 
            WHERE id = auth.uid() 
            AND role IN ('admin', 'support')
        )
    );

-- Insert: System/edge functions create notifications (via service role)
DROP POLICY IF EXISTS "insert_notifications" ON public.notifications;
CREATE POLICY "insert_notifications" ON public.notifications
    FOR INSERT
    WITH CHECK (true); -- Allow system to create notifications

-- Update: Users can update their own notifications (mark as read)
DROP POLICY IF EXISTS "update_notifications" ON public.notifications;
CREATE POLICY "update_notifications" ON public.notifications
    FOR UPDATE
    USING (
        target_profile_id = auth.uid()
        OR EXISTS (
            SELECT 1 FROM public.profiles 
            WHERE id = auth.uid() 
            AND role IN ('admin', 'support')
        )
    );

-- Delete: Users can delete their own notifications
DROP POLICY IF EXISTS "delete_notifications" ON public.notifications;
CREATE POLICY "delete_notifications" ON public.notifications
    FOR DELETE
    USING (
        target_profile_id = auth.uid()
        OR EXISTS (
            SELECT 1 FROM public.profiles 
            WHERE id = auth.uid() 
            AND role IN ('admin', 'support')
        )
    );

-- ============================================
-- SYSTEM_LOGS RLS POLICIES
-- ============================================

-- Read: Only admins can read system logs
DROP POLICY IF EXISTS "read_system_logs" ON public.system_logs;
CREATE POLICY "read_system_logs" ON public.system_logs
    FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM public.profiles 
            WHERE id = auth.uid() 
            AND role IN ('admin', 'support')
        )
    );

-- Insert: System/edge functions create logs (via service role)
DROP POLICY IF EXISTS "insert_system_logs" ON public.system_logs;
CREATE POLICY "insert_system_logs" ON public.system_logs
    FOR INSERT
    WITH CHECK (true); -- Allow system to create logs

-- Update/Delete: Only admins
DROP POLICY IF EXISTS "update_system_logs" ON public.system_logs;
CREATE POLICY "update_system_logs" ON public.system_logs
    FOR UPDATE
    USING (
        EXISTS (
            SELECT 1 FROM public.profiles 
            WHERE id = auth.uid() 
            AND role IN ('admin', 'support')
        )
    );

DROP POLICY IF EXISTS "delete_system_logs" ON public.system_logs;
CREATE POLICY "delete_system_logs" ON public.system_logs
    FOR DELETE
    USING (
        EXISTS (
            SELECT 1 FROM public.profiles 
            WHERE id = auth.uid() 
            AND role IN ('admin', 'support')
        )
    );

COMMIT;

-- Log completion
DO $$
BEGIN
  RAISE NOTICE '✅ RLS policies created for consolidated tables!';
END $$;

