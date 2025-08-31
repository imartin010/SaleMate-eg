-- Add columns needed for bulk upload functionality
-- This is a simplified version that works with existing schema

BEGIN;

-- Add missing columns to leads table
ALTER TABLE leads ADD COLUMN IF NOT EXISTS client_phone2 VARCHAR;
ALTER TABLE leads ADD COLUMN IF NOT EXISTS client_phone3 VARCHAR;
ALTER TABLE leads ADD COLUMN IF NOT EXISTS client_job_title VARCHAR;
ALTER TABLE leads ADD COLUMN IF NOT EXISTS source VARCHAR DEFAULT 'Manual';
ALTER TABLE leads ADD COLUMN IF NOT EXISTS cpl_price DECIMAL(10,2) DEFAULT 100.00;

-- Add indexes for performance
CREATE INDEX IF NOT EXISTS idx_leads_source ON leads(source);
CREATE INDEX IF NOT EXISTS idx_leads_cpl_price ON leads(cpl_price);

-- Update existing leads to have default values
UPDATE leads SET 
  source = 'Manual',
  cpl_price = 100.00
WHERE source IS NULL OR cpl_price IS NULL;

COMMIT;
