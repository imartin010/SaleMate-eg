-- Create performance_commission_cuts table
CREATE TABLE IF NOT EXISTS performance_commission_cuts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  franchise_id UUID NOT NULL REFERENCES performance_franchises(id) ON DELETE CASCADE,
  role TEXT NOT NULL CHECK (role IN ('sales_agent', 'team_leader', 'sales_director', 'head_of_sales', 'royalty')),
  cut_per_million DECIMAL(15,2) NOT NULL CHECK (cut_per_million >= 0),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(franchise_id, role)
);

-- Create indexes
CREATE INDEX idx_performance_commission_cuts_franchise ON performance_commission_cuts(franchise_id);

-- Enable RLS
ALTER TABLE performance_commission_cuts ENABLE ROW LEVEL SECURITY;

-- RLS Policies
-- Admins can see all commission cuts
CREATE POLICY "Admins can view all commission cuts" ON performance_commission_cuts
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.user_id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

-- Franchise owners can see their commission cuts
CREATE POLICY "Owners can view their commission cuts" ON performance_commission_cuts
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM performance_franchises
      WHERE performance_franchises.id = performance_commission_cuts.franchise_id
      AND performance_franchises.owner_user_id = auth.uid()
    )
  );

-- Admins and owners can manage commission cuts
CREATE POLICY "Admins and owners can insert commission cuts" ON performance_commission_cuts
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
          WHERE profiles.user_id = auth.uid()
          AND profiles.role = 'admin'
        )
      )
    )
  );

CREATE POLICY "Admins and owners can update commission cuts" ON performance_commission_cuts
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
          WHERE profiles.user_id = auth.uid()
          AND profiles.role = 'admin'
        )
      )
    )
  );

CREATE POLICY "Admins and owners can delete commission cuts" ON performance_commission_cuts
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
          WHERE profiles.user_id = auth.uid()
          AND profiles.role = 'admin'
        )
      )
    )
  );

COMMENT ON TABLE performance_commission_cuts IS 'Commission cuts per million in sales for different roles';

