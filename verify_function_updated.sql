-- Verify if the approve_purchase_request function was updated
-- Run this to check if you ran the FINAL_fix_purchase_assign_real_leads.sql

-- Check the function source code
SELECT 
  proname as function_name,
  pg_get_functiondef(oid) as function_definition
FROM pg_proc
WHERE proname = 'approve_purchase_request'
  AND pronamespace = (SELECT oid FROM pg_namespace WHERE nspname = 'public');

-- If the result contains "INSERT INTO public.leads" → OLD FUNCTION (WRONG)
-- If the result contains "UPDATE public.leads" → NEW FUNCTION (CORRECT)

