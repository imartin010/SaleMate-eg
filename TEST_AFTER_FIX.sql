-- ═══════════════════════════════════════════════════════════════════
-- 🧪 TEST AFTER FIX - Verify the function works correctly
-- ═══════════════════════════════════════════════════════════════════
-- Run these queries AFTER running SIMPLE_CORRECT_FIX.sql
-- ═══════════════════════════════════════════════════════════════════

-- TEST 1: Check how many unassigned leads exist per project
SELECT 
  p.name as project_name,
  COUNT(l.id) as unassigned_leads
FROM public.projects p
LEFT JOIN public.leads l ON (
  l.project_id = p.id 
  AND l.buyer_user_id IS NULL
)
GROUP BY p.id, p.name
ORDER BY COUNT(l.id) DESC;

-- TEST 2: Check if there are any pending purchase requests
SELECT 
  pr.id,
  pr.quantity,
  u.name as buyer_name,
  p.name as project_name,
  pr.status
FROM public.purchase_requests pr
JOIN public.profiles u ON pr.user_id = u.id
JOIN public.projects p ON pr.project_id = p.id
WHERE pr.status = 'pending'
ORDER BY pr.created_at DESC;

-- TEST 3: After admin approves a request, check assigned leads
-- Replace USER_EMAIL with the actual buyer's email
SELECT 
  l.client_name,
  l.client_phone,
  l.client_email,
  p.name as project_name,
  l.stage,
  l.created_at
FROM public.leads l
JOIN public.profiles u ON l.buyer_user_id = u.id
JOIN public.projects p ON l.project_id = p.id
WHERE u.email = 'USER_EMAIL_HERE'  -- Change this!
ORDER BY l.created_at DESC
LIMIT 10;

-- TEST 4: Verify no mock leads were created
SELECT 
  COUNT(*) as mock_leads_count
FROM public.leads
WHERE 
  client_name LIKE '%Purchased%'
  OR client_phone = '+20 100 XXX XXXX'
  OR client_email LIKE '%@purchased.com';

-- Expected result: 0 (after cleanup)

