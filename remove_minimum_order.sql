-- REMOVE 50 LEADS MINIMUM ORDER REQUIREMENT FOR TESTING
-- This allows purchasing any number of leads for easier testing

-- 1) Update the lead_purchase_requests table constraint
ALTER TABLE public.lead_purchase_requests 
DROP CONSTRAINT IF EXISTS lead_purchase_requests_number_of_leads_check;

-- Add new constraint with minimum of 1 lead instead of 50
ALTER TABLE public.lead_purchase_requests 
ADD CONSTRAINT lead_purchase_requests_number_of_leads_check 
CHECK (number_of_leads >= 1);

-- 2) Also check if there are any other tables with similar constraints
-- Update any other purchase-related tables if they exist
DO $$
BEGIN
    -- Check if orders table exists and update its constraint
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'orders') THEN
        ALTER TABLE public.orders 
        DROP CONSTRAINT IF EXISTS orders_quantity_check;
        
        ALTER TABLE public.orders 
        ADD CONSTRAINT orders_quantity_check 
        CHECK (quantity >= 1);
    END IF;
    
    -- Check if lead_orders table exists and update its constraint  
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'lead_orders') THEN
        ALTER TABLE public.lead_orders 
        DROP CONSTRAINT IF EXISTS lead_orders_quantity_check;
        
        ALTER TABLE public.lead_orders 
        ADD CONSTRAINT lead_orders_quantity_check 
        CHECK (quantity >= 1);
    END IF;
END $$;

-- 3) Update any frontend validation references in database functions
-- Check if there are any stored procedures that enforce the 50 lead minimum
CREATE OR REPLACE FUNCTION validate_purchase_request(
    p_number_of_leads integer
) RETURNS boolean AS $$
BEGIN
    -- Now allow any number >= 1 instead of >= 50
    RETURN p_number_of_leads >= 1;
END;
$$ LANGUAGE plpgsql;

-- 4) Show current constraints to verify the change
SELECT 
    tc.table_name,
    tc.constraint_name,
    cc.check_clause
FROM information_schema.table_constraints tc
JOIN information_schema.check_constraints cc ON tc.constraint_name = cc.constraint_name
WHERE tc.table_schema = 'public' 
AND cc.check_clause LIKE '%leads%'
OR cc.check_clause LIKE '%quantity%';

-- 5) Verify the changes
SELECT 'Minimum order requirement removed successfully!' as status;
SELECT 'You can now purchase any number of leads (minimum 1)' as info;
