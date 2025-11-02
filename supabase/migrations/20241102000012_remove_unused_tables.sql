-- ============================================
-- REMOVE UNUSED TABLES
-- ============================================

-- Drop unused tables that are not part of the current scope
-- These tables are being removed to simplify the schema

-- Drop lead_purchase_requests (replaced by purchase_requests)
DROP TABLE IF EXISTS public.lead_purchase_requests CASCADE;

-- Drop lead_requests (duplicate of purchase_requests)
DROP TABLE IF EXISTS public.lead_requests CASCADE;

-- Drop salemate-inventory (unused real estate inventory table)
DROP TABLE IF EXISTS public."salemate-inventory" CASCADE;

-- Drop project_partner_commissions (not in current scope)
DROP TABLE IF EXISTS public.project_partner_commissions CASCADE;

-- Drop cms_pages (not used)
DROP TABLE IF EXISTS public.cms_pages CASCADE;

-- Drop cms_media (not used)
DROP TABLE IF EXISTS public.cms_media CASCADE;

-- Log cleanup
DO $$
BEGIN
  RAISE NOTICE '✅ Cleaned up unused tables: lead_purchase_requests, lead_requests, salemate-inventory, project_partner_commissions, cms_pages, cms_media';
END $$;

