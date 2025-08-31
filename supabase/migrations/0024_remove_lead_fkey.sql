-- Remove foreign key constraint on leads buyer_user_id for testing

-- Drop the foreign key constraint on leads buyer_user_id
ALTER TABLE leads DROP CONSTRAINT IF EXISTS leads_buyer_user_id_fkey;
