-- ============================================
-- UPDATE PERFORMANCE RLS POLICIES FOR CEO ROLE
-- ============================================
-- This migration updates all performance table RLS policies
-- to allow CEO role to view and manage all franchise data
-- ============================================

-- ============================================
-- 1. PERFORMANCE_FRANCHISES
-- ============================================

DROP POLICY IF EXISTS "Admins can view all franchises" ON performance_franchises;
CREATE POLICY "Admins and CEO can view all franchises" ON performance_franchises
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role IN ('admin', 'ceo')
    )
  );

DROP POLICY IF EXISTS "Admins can insert franchises" ON performance_franchises;
CREATE POLICY "Admins and CEO can insert franchises" ON performance_franchises
  FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role IN ('admin', 'ceo')
    )
  );

DROP POLICY IF EXISTS "Admins and owners can update franchises" ON performance_franchises;
CREATE POLICY "Admins, CEO, and owners can update franchises" ON performance_franchises
  FOR UPDATE
  TO authenticated
  USING (
    owner_user_id = auth.uid() OR
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role IN ('admin', 'ceo')
    )
  );

-- ============================================
-- 2. PERFORMANCE_TRANSACTIONS
-- ============================================

DROP POLICY IF EXISTS "Admins can view all transactions" ON performance_transactions;
CREATE POLICY "Admins and CEO can view all transactions" ON performance_transactions
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role IN ('admin', 'ceo')
    )
  );

DROP POLICY IF EXISTS "Admins and owners can insert transactions" ON performance_transactions;
CREATE POLICY "Admins, CEO, and owners can insert transactions" ON performance_transactions
  FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM performance_franchises
      WHERE performance_franchises.id = performance_transactions.franchise_id
      AND (
        performance_franchises.owner_user_id = auth.uid() OR
        EXISTS (
          SELECT 1 FROM profiles
          WHERE profiles.id = auth.uid()
          AND profiles.role IN ('admin', 'ceo')
        )
      )
    )
  );

DROP POLICY IF EXISTS "Admins and owners can update transactions" ON performance_transactions;
CREATE POLICY "Admins, CEO, and owners can update transactions" ON performance_transactions
  FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM performance_franchises
      WHERE performance_franchises.id = performance_transactions.franchise_id
      AND (
        performance_franchises.owner_user_id = auth.uid() OR
        EXISTS (
          SELECT 1 FROM profiles
          WHERE profiles.id = auth.uid()
          AND profiles.role IN ('admin', 'ceo')
        )
      )
    )
  );

DROP POLICY IF EXISTS "Admins and owners can delete transactions" ON performance_transactions;
CREATE POLICY "Admins, CEO, and owners can delete transactions" ON performance_transactions
  FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM performance_franchises
      WHERE performance_franchises.id = performance_transactions.franchise_id
      AND (
        performance_franchises.owner_user_id = auth.uid() OR
        EXISTS (
          SELECT 1 FROM profiles
          WHERE profiles.id = auth.uid()
          AND profiles.role IN ('admin', 'ceo')
        )
      )
    )
  );

-- ============================================
-- 3. PERFORMANCE_EXPENSES
-- ============================================

DROP POLICY IF EXISTS "Admins can view all expenses" ON performance_expenses;
CREATE POLICY "Admins and CEO can view all expenses" ON performance_expenses
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role IN ('admin', 'ceo')
    )
  );

DROP POLICY IF EXISTS "Admins and owners can insert expenses" ON performance_expenses;
CREATE POLICY "Admins, CEO, and owners can insert expenses" ON performance_expenses
  FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM performance_franchises
      WHERE performance_franchises.id = performance_expenses.franchise_id
      AND (
        performance_franchises.owner_user_id = auth.uid() OR
        EXISTS (
          SELECT 1 FROM profiles
          WHERE profiles.id = auth.uid()
          AND profiles.role IN ('admin', 'ceo')
        )
      )
    )
  );

DROP POLICY IF EXISTS "Admins and owners can update expenses" ON performance_expenses;
CREATE POLICY "Admins, CEO, and owners can update expenses" ON performance_expenses
  FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM performance_franchises
      WHERE performance_franchises.id = performance_expenses.franchise_id
      AND (
        performance_franchises.owner_user_id = auth.uid() OR
        EXISTS (
          SELECT 1 FROM profiles
          WHERE profiles.id = auth.uid()
          AND profiles.role IN ('admin', 'ceo')
        )
      )
    )
  );

DROP POLICY IF EXISTS "Admins and owners can delete expenses" ON performance_expenses;
CREATE POLICY "Admins, CEO, and owners can delete expenses" ON performance_expenses
  FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM performance_franchises
      WHERE performance_franchises.id = performance_expenses.franchise_id
      AND (
        performance_franchises.owner_user_id = auth.uid() OR
        EXISTS (
          SELECT 1 FROM profiles
          WHERE profiles.id = auth.uid()
          AND profiles.role IN ('admin', 'ceo')
        )
      )
    )
  );

-- ============================================
-- 4. PERFORMANCE_COMMISSION_SCHEMES
-- ============================================

DROP POLICY IF EXISTS "Admins can view all commission schemes" ON performance_commission_schemes;
CREATE POLICY "Admins and CEO can view all commission schemes" ON performance_commission_schemes
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role IN ('admin', 'ceo')
    )
  );

DROP POLICY IF EXISTS "Admins and owners can insert commission schemes" ON performance_commission_schemes;
CREATE POLICY "Admins, CEO, and owners can insert commission schemes" ON performance_commission_schemes
  FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM performance_franchises
      WHERE performance_franchises.id = performance_commission_schemes.franchise_id
      AND (
        performance_franchises.owner_user_id = auth.uid() OR
        EXISTS (
          SELECT 1 FROM profiles
          WHERE profiles.id = auth.uid()
          AND profiles.role IN ('admin', 'ceo')
        )
      )
    )
  );

DROP POLICY IF EXISTS "Admins and owners can update commission schemes" ON performance_commission_schemes;
CREATE POLICY "Admins, CEO, and owners can update commission schemes" ON performance_commission_schemes
  FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM performance_franchises
      WHERE performance_franchises.id = performance_commission_schemes.franchise_id
      AND (
        performance_franchises.owner_user_id = auth.uid() OR
        EXISTS (
          SELECT 1 FROM profiles
          WHERE profiles.id = auth.uid()
          AND profiles.role IN ('admin', 'ceo')
        )
      )
    )
  );

DROP POLICY IF EXISTS "Admins and owners can delete commission schemes" ON performance_commission_schemes;
CREATE POLICY "Admins, CEO, and owners can delete commission schemes" ON performance_commission_schemes
  FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM performance_franchises
      WHERE performance_franchises.id = performance_commission_schemes.franchise_id
      AND (
        performance_franchises.owner_user_id = auth.uid() OR
        EXISTS (
          SELECT 1 FROM profiles
          WHERE profiles.id = auth.uid()
          AND profiles.role IN ('admin', 'ceo')
        )
      )
    )
  );

-- ============================================
-- 5. PERFORMANCE_COMMISSION_CUTS
-- ============================================

DROP POLICY IF EXISTS "Admins can view all commission cuts" ON performance_commission_cuts;
CREATE POLICY "Admins and CEO can view all commission cuts" ON performance_commission_cuts
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role IN ('admin', 'ceo')
    )
  );

DROP POLICY IF EXISTS "Admins and owners can insert commission cuts" ON performance_commission_cuts;
CREATE POLICY "Admins, CEO, and owners can insert commission cuts" ON performance_commission_cuts
  FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM performance_franchises
      WHERE performance_franchises.id = performance_commission_cuts.franchise_id
      AND (
        performance_franchises.owner_user_id = auth.uid() OR
        EXISTS (
          SELECT 1 FROM profiles
          WHERE profiles.id = auth.uid()
          AND profiles.role IN ('admin', 'ceo')
        )
      )
    )
  );

DROP POLICY IF EXISTS "Admins and owners can update commission cuts" ON performance_commission_cuts;
CREATE POLICY "Admins, CEO, and owners can update commission cuts" ON performance_commission_cuts
  FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM performance_franchises
      WHERE performance_franchises.id = performance_commission_cuts.franchise_id
      AND (
        performance_franchises.owner_user_id = auth.uid() OR
        EXISTS (
          SELECT 1 FROM profiles
          WHERE profiles.id = auth.uid()
          AND profiles.role IN ('admin', 'ceo')
        )
      )
    )
  );

DROP POLICY IF EXISTS "Admins and owners can delete commission cuts" ON performance_commission_cuts;
CREATE POLICY "Admins, CEO, and owners can delete commission cuts" ON performance_commission_cuts
  FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM performance_franchises
      WHERE performance_franchises.id = performance_commission_cuts.franchise_id
      AND (
        performance_franchises.owner_user_id = auth.uid() OR
        EXISTS (
          SELECT 1 FROM profiles
          WHERE profiles.id = auth.uid()
          AND profiles.role IN ('admin', 'ceo')
        )
      )
    )
  );

-- Success message
DO $$
BEGIN
  RAISE NOTICE '✅ Updated RLS policies for all performance tables to include CEO role';
END $$;

SELECT '✅ Performance RLS policies updated for CEO access!' as status;
