-- ═══════════════════════════════════════════════════════════════════
-- 🧹 CLEANUP MOCK LEADS
-- ═══════════════════════════════════════════════════════════════════
-- Run this AFTER running WORKING_FIX.sql
-- This removes the fake leads that were created
-- ═══════════════════════════════════════════════════════════════════

-- STEP 1: See the mock leads first
SELECT 
  id,
  client_name,
  client_phone,
  client_email,
  buyer_user_id,
  created_at
FROM public.leads
WHERE 
  client_name LIKE '%Purchased%'
  OR client_phone = '+20 100 XXX XXXX'
  OR client_email LIKE '%@purchased.com'
ORDER BY created_at DESC;

-- STEP 2: If the above looks like mock data, run this DELETE:
-- (Uncomment the lines below by removing the -- at the start)

/*
DELETE FROM public.leads
WHERE 
  client_name LIKE '%Purchased%'
  OR client_phone = '+20 100 XXX XXXX'
  OR client_email LIKE '%@purchased.com';

SELECT 'Mock leads deleted successfully!' as status;
*/
