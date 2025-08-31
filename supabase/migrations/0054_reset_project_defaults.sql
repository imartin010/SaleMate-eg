-- Reset all projects to have 0 available leads and 0 price per lead
-- Projects will be populated with actual data when leads are uploaded

UPDATE projects 
SET 
  available_leads = 0,
  price_per_lead = 0.00,
  updated_at = NOW()
WHERE available_leads > 0 OR price_per_lead > 0;
