-- Create performance_commission_schemes table
CREATE TABLE IF NOT EXISTS performance_commission_schemes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  franchise_id UUID NOT NULL REFERENCES performance_franchises(id) ON DELETE CASCADE,
  project_id UUID NOT NULL REFERENCES salemate_inventory(id) ON DELETE CASCADE,
  commission_rate DECIMAL(5,2) NOT NULL CHECK (commission_rate >= 0 AND commission_rate <= 100),
  developer_payout_months INTEGER NOT NULL DEFAULT 3 CHECK (developer_payout_months >= 0),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(franchise_id, project_id)
);

-- Create indexes
CREATE INDEX idx_performance_commission_schemes_franchise ON performance_commission_schemes(franchise_id);
CREATE INDEX idx_performance_commission_schemes_project ON performance_commission_schemes(project_id);

-- Enable RLS
ALTER TABLE performance_commission_schemes ENABLE ROW LEVEL SECURITY;

-- RLS Policies
-- Admins can see all schemes
CREATE POLICY "Admins can view all commission schemes" ON performance_commission_schemes
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.user_id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

-- Franchise owners can see their schemes
CREATE POLICY "Owners can view their commission schemes" ON performance_commission_schemes
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM performance_franchises
      WHERE performance_franchises.id = performance_commission_schemes.franchise_id
      AND performance_franchises.owner_user_id = auth.uid()
    )
  );

-- Admins and owners can manage schemes
CREATE POLICY "Admins and owners can insert commission schemes" ON performance_commission_schemes
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
          WHERE profiles.user_id = auth.uid()
          AND profiles.role = 'admin'
        )
      )
    )
  );

CREATE POLICY "Admins and owners can update commission schemes" ON performance_commission_schemes
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
          WHERE profiles.user_id = auth.uid()
          AND profiles.role = 'admin'
        )
      )
    )
  );

CREATE POLICY "Admins and owners can delete commission schemes" ON performance_commission_schemes
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
          WHERE profiles.user_id = auth.uid()
          AND profiles.role = 'admin'
        )
      )
    )
  );

COMMENT ON TABLE performance_commission_schemes IS 'Commission rates per project for each franchise';

