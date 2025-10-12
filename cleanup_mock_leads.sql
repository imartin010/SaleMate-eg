-- 🧹 Cleanup Mock Leads
-- This removes the fake leads that were created by the old approval function
-- Run this AFTER updating the approve_purchase_request function

-- Step 1: Identify mock leads
SELECT 
  id,
  client_name,
  client_phone,
  client_email,
  buyer_user_id,
  project_id,
  created_at
FROM public.leads
WHERE 
  client_name LIKE '%Purchased%'
  OR client_phone = '+20 100 XXX XXXX'
  OR client_email LIKE '%@purchased.com'
ORDER BY created_at DESC;

-- ⚠️ Review the results above FIRST!
-- If they look like mock data, uncomment and run the DELETE below:

/*
-- Step 2: Delete mock leads (UNCOMMENT TO RUN)
DELETE FROM public.leads
WHERE 
  client_name LIKE '%Purchased%'
  OR client_phone = '+20 100 XXX XXXX'
  OR client_email LIKE '%@purchased.com';

-- Step 3: Show how many were deleted
SELECT 'Mock leads cleaned up!' as status;
*/

-- Step 4: Verify - Show remaining leads for a user
-- Replace USER_UUID with the actual buyer's UUID
/*
SELECT 
  l.client_name,
  l.client_phone,
  l.client_email,
  p.name as project_name,
  l.stage,
  l.created_at
FROM public.leads l
JOIN public.projects p ON l.project_id = p.id
WHERE l.buyer_user_id = 'USER_UUID'::UUID
ORDER BY l.created_at DESC;
*/

SELECT 'Review the mock leads above. If correct, uncomment DELETE section.' as instruction;

