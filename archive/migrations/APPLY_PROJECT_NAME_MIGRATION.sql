-- ============================================
-- ADD PROJECT_NAME COLUMN TO LEADS AND PURCHASE_REQUESTS
-- ============================================
-- Run this in Supabase SQL Editor
-- This denormalizes project name for better performance and simpler queries

-- Add project_name to leads table
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'leads' 
        AND column_name = 'project_name'
    ) THEN
        ALTER TABLE public.leads 
        ADD COLUMN project_name TEXT;
        
        COMMENT ON COLUMN public.leads.project_name IS 'Denormalized project name for performance';
    END IF;
END $$;

-- Backfill leads.project_name in batches to avoid timeout
DO $$
DECLARE
    batch_size INT := 5000;
    updated_count INT;
    total_updated INT := 0;
BEGIN
    LOOP
        -- Update in batches
        UPDATE public.leads l
        SET project_name = p.name
        FROM public.projects p
        WHERE l.project_id = p.id 
        AND l.project_name IS NULL
        AND l.id IN (
            SELECT id FROM public.leads 
            WHERE project_id IS NOT NULL 
            AND project_name IS NULL 
            LIMIT batch_size
        );
        
        GET DIAGNOSTICS updated_count = ROW_COUNT;
        total_updated := total_updated + updated_count;
        
        -- Exit when no more rows to update
        EXIT WHEN updated_count = 0;
        
        -- Small delay to prevent overwhelming the database
        PERFORM pg_sleep(0.1);
    END LOOP;
    
    RAISE NOTICE '✅ Backfilled % leads with project_name', total_updated;
END $$;

-- Add project_name to purchase_requests table
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'purchase_requests' 
        AND column_name = 'project_name'
    ) THEN
        ALTER TABLE public.purchase_requests 
        ADD COLUMN project_name TEXT;
        
        COMMENT ON COLUMN public.purchase_requests.project_name IS 'Denormalized project name for performance';
    END IF;
END $$;

-- Backfill purchase_requests.project_name (should be fast, but using batch for safety)
DO $$
DECLARE
    batch_size INT := 1000;
    updated_count INT;
BEGIN
    LOOP
        UPDATE public.purchase_requests pr
        SET project_name = p.name
        FROM public.projects p
        WHERE pr.project_id = p.id 
        AND pr.project_name IS NULL
        AND pr.id IN (
            SELECT id FROM public.purchase_requests 
            WHERE project_id IS NOT NULL 
            AND project_name IS NULL 
            LIMIT batch_size
        );
        
        GET DIAGNOSTICS updated_count = ROW_COUNT;
        EXIT WHEN updated_count = 0;
        
        PERFORM pg_sleep(0.1);
    END LOOP;
    
    RAISE NOTICE '✅ Backfilled purchase_requests with project_name';
END $$;

-- Create trigger function to auto-update project_name in leads
CREATE OR REPLACE FUNCTION update_lead_project_name()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.project_id IS NOT NULL AND (NEW.project_name IS NULL OR OLD.project_id != NEW.project_id) THEN
        SELECT name INTO NEW.project_name
        FROM public.projects
        WHERE id = NEW.project_id;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for leads
DROP TRIGGER IF EXISTS trigger_update_lead_project_name ON public.leads;
CREATE TRIGGER trigger_update_lead_project_name
    BEFORE INSERT OR UPDATE OF project_id ON public.leads
    FOR EACH ROW
    EXECUTE FUNCTION update_lead_project_name();

-- Create trigger function to auto-update project_name in purchase_requests
CREATE OR REPLACE FUNCTION update_purchase_request_project_name()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.project_id IS NOT NULL AND (NEW.project_name IS NULL OR OLD.project_id != NEW.project_id) THEN
        SELECT name INTO NEW.project_name
        FROM public.projects
        WHERE id = NEW.project_id;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for purchase_requests
DROP TRIGGER IF EXISTS trigger_update_purchase_request_project_name ON public.purchase_requests;
CREATE TRIGGER trigger_update_purchase_request_project_name
    BEFORE INSERT OR UPDATE OF project_id ON public.purchase_requests
    FOR EACH ROW
    EXECUTE FUNCTION update_purchase_request_project_name();

-- Log success
DO $$
BEGIN
  RAISE NOTICE '✅ project_name columns added to leads and purchase_requests with auto-update triggers!';
END $$;

