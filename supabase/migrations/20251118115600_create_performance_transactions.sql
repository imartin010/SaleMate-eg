-- Create performance_transactions table
CREATE TABLE IF NOT EXISTS performance_transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  franchise_id UUID NOT NULL REFERENCES performance_franchises(id) ON DELETE CASCADE,
  project_id UUID NOT NULL REFERENCES salemate_inventory(id) ON DELETE CASCADE,
  transaction_amount DECIMAL(15,2) NOT NULL CHECK (transaction_amount >= 0),
  stage TEXT NOT NULL CHECK (stage IN ('eoi', 'reservation', 'contracted', 'cancelled')),
  stage_updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  contracted_at TIMESTAMP WITH TIME ZONE,
  expected_payout_date TIMESTAMP WITH TIME ZONE,
  commission_amount DECIMAL(15,2),
  notes TEXT,
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes
CREATE INDEX idx_performance_transactions_franchise ON performance_transactions(franchise_id);
CREATE INDEX idx_performance_transactions_project ON performance_transactions(project_id);
CREATE INDEX idx_performance_transactions_stage ON performance_transactions(stage);
CREATE INDEX idx_performance_transactions_expected_payout ON performance_transactions(expected_payout_date);

-- Enable RLS
ALTER TABLE performance_transactions ENABLE ROW LEVEL SECURITY;

-- RLS Policies
-- Admins can see all transactions
CREATE POLICY "Admins can view all transactions" ON performance_transactions
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.user_id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

-- Franchise owners can see their transactions
CREATE POLICY "Owners can view their transactions" ON performance_transactions
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM performance_franchises
      WHERE performance_franchises.id = performance_transactions.franchise_id
      AND performance_franchises.owner_user_id = auth.uid()
    )
  );

-- Admins and owners can manage transactions
CREATE POLICY "Admins and owners can insert transactions" ON performance_transactions
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
          WHERE profiles.user_id = auth.uid()
          AND profiles.role = 'admin'
        )
      )
    )
  );

CREATE POLICY "Admins and owners can update transactions" ON performance_transactions
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
          WHERE profiles.user_id = auth.uid()
          AND profiles.role = 'admin'
        )
      )
    )
  );

CREATE POLICY "Admins and owners can delete transactions" ON performance_transactions
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
          WHERE profiles.user_id = auth.uid()
          AND profiles.role = 'admin'
        )
      )
    )
  );

-- Function to auto-calculate commission and payout date
CREATE OR REPLACE FUNCTION calculate_transaction_commission()
RETURNS TRIGGER AS $$
DECLARE
  v_commission_rate DECIMAL;
  v_payout_months INTEGER;
BEGIN
  -- Get commission rate and payout months from commission scheme
  SELECT commission_rate, developer_payout_months
  INTO v_commission_rate, v_payout_months
  FROM performance_commission_schemes
  WHERE franchise_id = NEW.franchise_id
  AND project_id = NEW.project_id;

  -- Calculate commission amount
  IF v_commission_rate IS NOT NULL THEN
    NEW.commission_amount := (NEW.transaction_amount * v_commission_rate / 100);
  END IF;

  -- Calculate expected payout date when contracted
  IF NEW.stage = 'contracted' AND NEW.contracted_at IS NOT NULL AND v_payout_months IS NOT NULL THEN
    NEW.expected_payout_date := NEW.contracted_at + (v_payout_months || ' months')::INTERVAL;
  END IF;

  -- Update contracted_at timestamp when stage changes to contracted
  IF NEW.stage = 'contracted' AND (OLD IS NULL OR OLD.stage != 'contracted') THEN
    NEW.contracted_at := NOW();
    NEW.stage_updated_at := NOW();
  END IF;

  -- Update stage_updated_at if stage changed
  IF OLD IS NOT NULL AND NEW.stage != OLD.stage THEN
    NEW.stage_updated_at := NOW();
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger
CREATE TRIGGER trigger_calculate_transaction_commission
BEFORE INSERT OR UPDATE ON performance_transactions
FOR EACH ROW
EXECUTE FUNCTION calculate_transaction_commission();

COMMENT ON TABLE performance_transactions IS 'Sales transactions with deal cycle tracking';

