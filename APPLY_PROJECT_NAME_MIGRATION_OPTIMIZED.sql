-- ============================================
-- ADD PROJECT_NAME COLUMN TO LEADS AND PURCHASE_REQUESTS
-- OPTIMIZED VERSION - Runs in batches to avoid timeout
-- ============================================
-- Run this in Supabase SQL Editor
-- This denormalizes project name for better performance and simpler queries

-- STEP 1: Add columns (fast)
ALTER TABLE public.leads ADD COLUMN IF NOT EXISTS project_name TEXT;
ALTER TABLE public.purchase_requests ADD COLUMN IF NOT EXISTS project_name TEXT;

-- STEP 2: Create triggers first (so new inserts get project_name automatically)
-- This ensures triggers are ready before backfilling

-- Create trigger function to auto-update project_name in leads
CREATE OR REPLACE FUNCTION update_lead_project_name()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.project_id IS NOT NULL AND (NEW.project_name IS NULL OR (OLD IS NOT NULL AND OLD.project_id != NEW.project_id)) THEN
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
    IF NEW.project_id IS NOT NULL AND (NEW.project_name IS NULL OR (OLD IS NOT NULL AND OLD.project_id != NEW.project_id)) THEN
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

-- STEP 3: Backfill purchase_requests first (smaller table, usually fast)
UPDATE public.purchase_requests pr
SET project_name = p.name
FROM public.projects p
WHERE pr.project_id = p.id 
AND pr.project_name IS NULL;

-- STEP 4: Backfill leads in optimized batches (for 43K+ rows)
DO $$
DECLARE
    batch_size INT := 10000;
    updated_count INT;
    total_updated INT := 0;
    batch_num INT := 0;
BEGIN
    RAISE NOTICE 'Starting leads backfill in batches of %...', batch_size;
    
    LOOP
        batch_num := batch_num + 1;
        
        -- Update one batch
        WITH batch_ids AS (
            SELECT l.id
            FROM public.leads l
            WHERE l.project_id IS NOT NULL 
            AND l.project_name IS NULL
            LIMIT batch_size
        )
        UPDATE public.leads l
        SET project_name = p.name
        FROM public.projects p, batch_ids b
        WHERE l.id = b.id
        AND l.project_id = p.id;
        
        GET DIAGNOSTICS updated_count = ROW_COUNT;
        total_updated := total_updated + updated_count;
        
        RAISE NOTICE 'Batch %: Updated % leads (Total: %)', batch_num, updated_count, total_updated;
        
        -- Exit when no more rows to update
        EXIT WHEN updated_count = 0;
        
        -- Small delay between batches
        IF updated_count > 0 THEN
            PERFORM pg_sleep(0.2);
        END IF;
    END LOOP;
    
    RAISE NOTICE '✅ Completed! Backfilled % leads with project_name', total_updated;
END $$;

-- Add comments
COMMENT ON COLUMN public.leads.project_name IS 'Denormalized project name for performance';
COMMENT ON COLUMN public.purchase_requests.project_name IS 'Denormalized project name for performance';

-- Final success message
DO $$
BEGIN
  RAISE NOTICE '✅ Migration complete! project_name columns added with auto-update triggers!';
END $$;

