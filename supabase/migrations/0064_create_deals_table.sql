-- Create deals table for tracking user deals
CREATE TABLE IF NOT EXISTS deals (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  deal_type TEXT CHECK (deal_type IN ('EOI', 'Reservation', 'Contract')) NOT NULL,
  project_name TEXT NOT NULL,
  developer_name TEXT NOT NULL,
  client_name TEXT NOT NULL,
  unit_code TEXT NOT NULL,
  developer_sales_name TEXT NOT NULL,
  developer_sales_phone TEXT NOT NULL,
  deal_value DECIMAL(15,2) NOT NULL,
  downpayment_percentage DECIMAL(5,2) NOT NULL,
  payment_plan_years INTEGER NOT NULL,
  deal_stage TEXT CHECK (deal_stage IN ('Reservation', 'Contracted', 'Collected', 'Ready to payout')) DEFAULT 'Reservation',
  status TEXT CHECK (status IN ('pending', 'approved', 'rejected')) DEFAULT 'pending',
  admin_notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create deal attachments table
CREATE TABLE IF NOT EXISTS deal_attachments (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  deal_id UUID REFERENCES deals(id) ON DELETE CASCADE NOT NULL,
  file_name TEXT NOT NULL,
  file_path TEXT NOT NULL,
  file_size INTEGER NOT NULL,
  mime_type TEXT NOT NULL,
  uploaded_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_deals_user_id ON deals(user_id);
CREATE INDEX IF NOT EXISTS idx_deals_status ON deals(status);
CREATE INDEX IF NOT EXISTS idx_deals_deal_stage ON deals(deal_stage);
CREATE INDEX IF NOT EXISTS idx_deal_attachments_deal_id ON deal_attachments(deal_id);

-- Enable Row Level Security
ALTER TABLE deals ENABLE ROW LEVEL SECURITY;
ALTER TABLE deal_attachments ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
CREATE POLICY "Users can view their own deals" ON deals
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own deals" ON deals
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own deals" ON deals
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all deals" ON deals
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM auth.users 
      WHERE auth.users.id = auth.uid() 
      AND auth.users.role = 'admin'
    )
  );

CREATE POLICY "Admins can update all deals" ON deals
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM auth.users 
      WHERE auth.users.id = auth.uid() 
      AND auth.users.role = 'admin'
    )
  );

-- Deal attachments policies
CREATE POLICY "Users can view attachments for their own deals" ON deal_attachments
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM deals 
      WHERE deals.id = deal_attachments.deal_id 
      AND deals.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert attachments for their own deals" ON deal_attachments
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM deals 
      WHERE deals.id = deal_attachments.deal_id 
      AND deals.user_id = auth.uid()
    )
  );

CREATE POLICY "Admins can view all attachments" ON deal_attachments
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM auth.users 
      WHERE auth.users.id = auth.uid() 
      AND auth.users.role = 'admin'
    )
  );

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_deals_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for updated_at
CREATE TRIGGER update_deals_updated_at
  BEFORE UPDATE ON deals
  FOR EACH ROW
  EXECUTE FUNCTION update_deals_updated_at();

-- Insert sample data for testing (optional)
-- INSERT INTO deals (
--   user_id, deal_type, project_name, developer_name, client_name, 
--   unit_code, developer_sales_name, developer_sales_phone, 
--   deal_value, downpayment_percentage, payment_plan_years
-- ) VALUES (
--   '00000000-0000-0000-0000-000000000000', -- Replace with actual user ID
--   'Reservation', 'Sample Project', 'Sample Developer', 'Sample Client',
--   'A101', 'John Sales', '+201234567890', 500000.00, 20.00, 5
-- );
