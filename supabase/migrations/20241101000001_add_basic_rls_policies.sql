-- ============================================
-- BASIC RLS POLICIES
-- Creates essential RLS policies for data security
-- Note: Review and customize these policies based on your specific requirements
-- ============================================

-- STEP 1: Leads Table Policies
-- ============================================

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Users can view their own leads" ON public.leads;
DROP POLICY IF EXISTS "Users can insert their own leads" ON public.leads;
DROP POLICY IF EXISTS "Users can update their own leads" ON public.leads;
DROP POLICY IF EXISTS "Admins can view all leads" ON public.leads;
DROP POLICY IF EXISTS "Admins can manage all leads" ON public.leads;

-- Users can view leads they own
CREATE POLICY "Users can view their own leads"
    ON public.leads
    FOR SELECT
    USING (
        buyer_user_id = auth.uid() 
        OR assigned_to_id = auth.uid()
        OR EXISTS (
            SELECT 1 FROM public.profiles 
            WHERE id = auth.uid() 
            AND role IN ('admin', 'support', 'manager')
        )
    );

-- Users can insert leads (with proper buyer_user_id or assigned_to_id)
CREATE POLICY "Users can insert their own leads"
    ON public.leads
    FOR INSERT
    WITH CHECK (
        buyer_user_id = auth.uid() 
        OR assigned_to_id = auth.uid()
        OR EXISTS (
            SELECT 1 FROM public.profiles 
            WHERE id = auth.uid() 
            AND role IN ('admin', 'support')
        )
    );

-- Users can update leads they own or are assigned to
CREATE POLICY "Users can update their own leads"
    ON public.leads
    FOR UPDATE
    USING (
        buyer_user_id = auth.uid() 
        OR assigned_to_id = auth.uid()
        OR EXISTS (
            SELECT 1 FROM public.profiles 
            WHERE id = auth.uid() 
            AND role IN ('admin', 'support')
        )
    );

-- STEP 2: Lead Purchase Requests Policies
-- ============================================

DROP POLICY IF EXISTS "Users can view their own purchase requests" ON public.lead_purchase_requests;
DROP POLICY IF EXISTS "Users can create purchase requests" ON public.lead_purchase_requests;
DROP POLICY IF EXISTS "Admins can view all purchase requests" ON public.lead_purchase_requests;
DROP POLICY IF EXISTS "Admins can update purchase requests" ON public.lead_purchase_requests;

-- Users can view their own purchase requests
CREATE POLICY "Users can view their own purchase requests"
    ON public.lead_purchase_requests
    FOR SELECT
    USING (
        buyer_user_id = auth.uid()
        OR EXISTS (
            SELECT 1 FROM public.profiles 
            WHERE id = auth.uid() 
            AND role IN ('admin', 'support')
        )
    );

-- Users can create purchase requests for themselves
CREATE POLICY "Users can create purchase requests"
    ON public.lead_purchase_requests
    FOR INSERT
    WITH CHECK (buyer_user_id = auth.uid());

-- Admins can update purchase requests
CREATE POLICY "Admins can update purchase requests"
    ON public.lead_purchase_requests
    FOR UPDATE
    USING (
        EXISTS (
            SELECT 1 FROM public.profiles 
            WHERE id = auth.uid() 
            AND role IN ('admin', 'support')
        )
    );

-- STEP 3: Lead Batches Policies
-- ============================================

DROP POLICY IF EXISTS "Admins can manage lead batches" ON public.lead_batches;
DROP POLICY IF EXISTS "Users can view lead batches" ON public.lead_batches;

-- Only admins can manage batches
CREATE POLICY "Admins can manage lead batches"
    ON public.lead_batches
    FOR ALL
    USING (
        EXISTS (
            SELECT 1 FROM public.profiles 
            WHERE id = auth.uid() 
            AND role IN ('admin', 'support')
        )
    );

-- Users can view batches
CREATE POLICY "Users can view lead batches"
    ON public.lead_batches
    FOR SELECT
    USING (true);

-- STEP 4: Feedback History Policies
-- ============================================

DROP POLICY IF EXISTS "Users can view feedback for their leads" ON public.feedback_history;
DROP POLICY IF EXISTS "Users can create feedback" ON public.feedback_history;
DROP POLICY IF EXISTS "Users can update their own feedback" ON public.feedback_history;

-- Users can view feedback for leads they own or are assigned to
CREATE POLICY "Users can view feedback for their leads"
    ON public.feedback_history
    FOR SELECT
    USING (
        user_id = auth.uid()
        OR EXISTS (
            SELECT 1 FROM public.leads 
            WHERE id = feedback_history.lead_id 
            AND (buyer_user_id = auth.uid() OR assigned_to_id = auth.uid())
        )
        OR EXISTS (
            SELECT 1 FROM public.profiles 
            WHERE id = auth.uid() 
            AND role IN ('admin', 'support', 'manager')
        )
    );

-- Users can create feedback
CREATE POLICY "Users can create feedback"
    ON public.feedback_history
    FOR INSERT
    WITH CHECK (
        user_id = auth.uid()
        AND EXISTS (
            SELECT 1 FROM public.leads 
            WHERE id = feedback_history.lead_id 
            AND (buyer_user_id = auth.uid() OR assigned_to_id = auth.uid())
        )
    );

-- Users can update their own feedback
CREATE POLICY "Users can update their own feedback"
    ON public.feedback_history
    FOR UPDATE
    USING (user_id = auth.uid())
    WITH CHECK (user_id = auth.uid());

-- STEP 5: Support Cases Policies
-- ============================================

DROP POLICY IF EXISTS "Users can view their own support cases" ON public.support_cases;
DROP POLICY IF EXISTS "Users can create support cases" ON public.support_cases;
DROP POLICY IF EXISTS "Support staff can view all cases" ON public.support_cases;
DROP POLICY IF EXISTS "Support staff can update cases" ON public.support_cases;

-- Users can view their own cases
CREATE POLICY "Users can view their own support cases"
    ON public.support_cases
    FOR SELECT
    USING (
        created_by = auth.uid()
        OR assigned_to = auth.uid()
        OR EXISTS (
            SELECT 1 FROM public.profiles 
            WHERE id = auth.uid() 
            AND role IN ('admin', 'support')
        )
    );

-- All authenticated users can create support cases
CREATE POLICY "Users can create support cases"
    ON public.support_cases
    FOR INSERT
    WITH CHECK (created_by = auth.uid());

-- Support staff can update all cases
CREATE POLICY "Support staff can update cases"
    ON public.support_cases
    FOR UPDATE
    USING (
        EXISTS (
            SELECT 1 FROM public.profiles 
            WHERE id = auth.uid() 
            AND role IN ('admin', 'support')
        )
    );

-- STEP 6: User Wallets Policies
-- ============================================

DROP POLICY IF EXISTS "Users can view their own wallet" ON public.user_wallets;
DROP POLICY IF EXISTS "Users can insert their own wallet" ON public.user_wallets;
DROP POLICY IF EXISTS "Admins can view all wallets" ON public.user_wallets;

-- Users can view their own wallet
CREATE POLICY "Users can view their own wallet"
    ON public.user_wallets
    FOR SELECT
    USING (
        user_id = auth.uid()
        OR EXISTS (
            SELECT 1 FROM public.profiles 
            WHERE id = auth.uid() 
            AND role IN ('admin', 'support')
        )
    );

-- Users can insert their own wallet
CREATE POLICY "Users can insert their own wallet"
    ON public.user_wallets
    FOR INSERT
    WITH CHECK (user_id = auth.uid());

-- STEP 7: Wallet Transactions Policies
-- ============================================

DROP POLICY IF EXISTS "Users can view their own transactions" ON public.wallet_transactions;
DROP POLICY IF EXISTS "System can insert transactions" ON public.wallet_transactions;

-- Users can view their own transactions
CREATE POLICY "Users can view their own transactions"
    ON public.wallet_transactions
    FOR SELECT
    USING (
        user_id = auth.uid()
        OR EXISTS (
            SELECT 1 FROM public.profiles 
            WHERE id = auth.uid() 
            AND role IN ('admin', 'support')
        )
    );

-- Transactions are inserted by system (via functions)
-- No direct INSERT policy for users - handled by database functions

-- ============================================
-- Policies Complete
-- ============================================

-- Note: These are basic policies. Review and customize based on:
-- 1. Your specific business requirements
-- 2. Team hierarchy needs (manager access to team member leads)
-- 3. Partner access rules
-- 4. Any other custom access patterns



