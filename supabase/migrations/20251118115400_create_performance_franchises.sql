-- Create performance_franchises table
CREATE TABLE IF NOT EXISTS performance_franchises (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  owner_user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  headcount INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  is_active BOOLEAN DEFAULT true
);

-- Create index for quick lookups
CREATE INDEX idx_performance_franchises_slug ON performance_franchises(slug);
CREATE INDEX idx_performance_franchises_owner ON performance_franchises(owner_user_id);

-- Enable RLS
ALTER TABLE performance_franchises ENABLE ROW LEVEL SECURITY;

-- RLS Policies
-- Admins can see all franchises
CREATE POLICY "Admins can view all franchises" ON performance_franchises
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.user_id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

-- Franchise owners can see their own franchise
CREATE POLICY "Owners can view their franchise" ON performance_franchises
  FOR SELECT
  TO authenticated
  USING (owner_user_id = auth.uid());

-- Admins can insert franchises
CREATE POLICY "Admins can insert franchises" ON performance_franchises
  FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.user_id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

-- Admins and owners can update their franchise
CREATE POLICY "Admins and owners can update franchises" ON performance_franchises
  FOR UPDATE
  TO authenticated
  USING (
    owner_user_id = auth.uid() OR
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.user_id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

COMMENT ON TABLE performance_franchises IS 'Stores Coldwell Banker franchise information for performance tracking';

