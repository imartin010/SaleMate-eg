-- Create performance_expenses table
CREATE TABLE IF NOT EXISTS performance_expenses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  franchise_id UUID NOT NULL REFERENCES performance_franchises(id) ON DELETE CASCADE,
  expense_type TEXT NOT NULL CHECK (expense_type IN ('fixed', 'variable')),
  category TEXT NOT NULL CHECK (category IN ('rent', 'salaries', 'marketing', 'phone_bills', 'other')),
  description TEXT,
  amount DECIMAL(15,2) NOT NULL CHECK (amount >= 0),
  date DATE NOT NULL DEFAULT CURRENT_DATE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes
CREATE INDEX idx_performance_expenses_franchise ON performance_expenses(franchise_id);
CREATE INDEX idx_performance_expenses_type ON performance_expenses(expense_type);
CREATE INDEX idx_performance_expenses_date ON performance_expenses(date);

-- Enable RLS
ALTER TABLE performance_expenses ENABLE ROW LEVEL SECURITY;

-- RLS Policies
-- Admins can see all expenses
CREATE POLICY "Admins can view all expenses" ON performance_expenses
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.user_id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

-- Franchise owners can see their expenses
CREATE POLICY "Owners can view their expenses" ON performance_expenses
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM performance_franchises
      WHERE performance_franchises.id = performance_expenses.franchise_id
      AND performance_franchises.owner_user_id = auth.uid()
    )
  );

-- Admins and owners can manage expenses
CREATE POLICY "Admins and owners can insert expenses" ON performance_expenses
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
          WHERE profiles.user_id = auth.uid()
          AND profiles.role = 'admin'
        )
      )
    )
  );

CREATE POLICY "Admins and owners can update expenses" ON performance_expenses
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
          WHERE profiles.user_id = auth.uid()
          AND profiles.role = 'admin'
        )
      )
    )
  );

CREATE POLICY "Admins and owners can delete expenses" ON performance_expenses
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
          WHERE profiles.user_id = auth.uid()
          AND profiles.role = 'admin'
        )
      )
    )
  );

COMMENT ON TABLE performance_expenses IS 'Fixed and variable expenses per franchise';

