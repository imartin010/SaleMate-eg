-- ============================================
-- PHASE 2: ANALYTICS CONSOLIDATION
-- Merge content_metrics → system_logs
-- ============================================
-- This migration consolidates content metrics into system_logs
-- to create a unified analytics and logging system

BEGIN;

-- ============================================
-- Step 1: Enhance system_logs for content metrics
-- ============================================

-- Add 'content_metric' to log_type if not already present
DO $$
BEGIN
  -- Drop and recreate the check constraint to include content_metric
  ALTER TABLE public.system_logs DROP CONSTRAINT IF EXISTS system_logs_log_type_check;
  
  ALTER TABLE public.system_logs 
    ADD CONSTRAINT system_logs_log_type_check 
    CHECK (log_type IN ('audit', 'activity', 'error', 'integration', 'content_metric'));
END $$;

-- Add columns for content metric specific data
ALTER TABLE public.system_logs
  ADD COLUMN IF NOT EXISTS content_id UUID REFERENCES public.content(id) ON DELETE CASCADE,
  ADD COLUMN IF NOT EXISTS viewer_profile_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS event_name TEXT CHECK (event_name IN ('impression', 'click', 'view', 'interaction', NULL));

COMMENT ON COLUMN public.system_logs.content_id IS 'Reference to content item for content_metric logs';
COMMENT ON COLUMN public.system_logs.viewer_profile_id IS 'User who viewed/interacted with content';
COMMENT ON COLUMN public.system_logs.event_name IS 'Type of content event (for content_metric logs)';

-- ============================================
-- Step 2: Create indexes for content metrics queries
-- ============================================

CREATE INDEX IF NOT EXISTS idx_system_logs_content_metrics 
  ON public.system_logs(content_id, event_name) 
  WHERE log_type = 'content_metric';

CREATE INDEX IF NOT EXISTS idx_system_logs_viewer 
  ON public.system_logs(viewer_profile_id, created_at DESC) 
  WHERE log_type = 'content_metric';

CREATE INDEX IF NOT EXISTS idx_system_logs_content_created 
  ON public.system_logs(content_id, created_at DESC) 
  WHERE log_type = 'content_metric';

-- ============================================
-- Step 3: Migrate content_metrics data to system_logs
-- ============================================

-- Only run if content_metrics table exists
DO $$
DECLARE
  v_migrated_count INTEGER := 0;
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.tables 
    WHERE table_schema = 'public' 
    AND table_name = 'content_metrics'
  ) THEN
    
    -- Migrate data
    INSERT INTO public.system_logs (
      id,
      log_type,
      action,
      content_id,
      viewer_profile_id,
      event_name,
      entity_type,
      entity_id,
      details,
      created_at
    )
    SELECT 
      cm.id,
      'content_metric' AS log_type,
      'content_' || cm.event AS action,
      cm.content_id,
      cm.viewer_profile_id,
      cm.event AS event_name,
      'content' AS entity_type,
      cm.content_id AS entity_id,
      jsonb_build_object(
        'event', cm.event,
        'content_id', cm.content_id,
        'viewer_id', cm.viewer_profile_id,
        'source', 'content_metrics_migration'
      ) AS details,
      cm.created_at
    FROM public.content_metrics cm
    ON CONFLICT (id) DO UPDATE SET
      content_id = EXCLUDED.content_id,
      viewer_profile_id = EXCLUDED.viewer_profile_id,
      event_name = EXCLUDED.event_name,
      details = EXCLUDED.details;

    GET DIAGNOSTICS v_migrated_count = ROW_COUNT;
    RAISE NOTICE '✅ Migrated % content_metrics records to system_logs', v_migrated_count;
  ELSE
    RAISE NOTICE 'ℹ️ content_metrics table does not exist, skipping migration';
  END IF;
END $$;

-- ============================================
-- Step 4: Create compatibility view for backward compatibility
-- ============================================

CREATE OR REPLACE VIEW public.content_metrics AS
SELECT
  sl.id,
  sl.content_id,
  sl.viewer_profile_id,
  sl.event_name AS event,
  sl.created_at
FROM public.system_logs sl
WHERE sl.log_type = 'content_metric'
  AND sl.content_id IS NOT NULL;

COMMENT ON VIEW public.content_metrics IS 'Compatibility view - backed by system_logs table';

-- ============================================
-- Step 5: Create trigger for view compatibility
-- ============================================

CREATE OR REPLACE FUNCTION public.sync_content_metrics_to_system_logs()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    INSERT INTO public.system_logs (
      log_type,
      action,
      content_id,
      viewer_profile_id,
      event_name,
      entity_type,
      entity_id,
      details,
      created_at
    ) VALUES (
      'content_metric',
      'content_' || NEW.event,
      NEW.content_id,
      NEW.viewer_profile_id,
      NEW.event,
      'content',
      NEW.content_id,
      jsonb_build_object(
        'event', NEW.event,
        'content_id', NEW.content_id,
        'viewer_id', NEW.viewer_profile_id
      ),
      COALESCE(NEW.created_at, now())
    )
    RETURNING id INTO NEW.id;
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    DELETE FROM public.system_logs 
    WHERE id = OLD.id AND log_type = 'content_metric';
    RETURN OLD;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_content_metrics_sync
INSTEAD OF INSERT OR DELETE ON public.content_metrics
FOR EACH ROW EXECUTE FUNCTION public.sync_content_metrics_to_system_logs();

-- ============================================
-- Step 6: Drop original content_metrics table
-- ============================================

DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.tables 
    WHERE table_schema = 'public' 
    AND table_name = 'content_metrics'
    AND table_type = 'BASE TABLE'
  ) THEN
    DROP TABLE public.content_metrics CASCADE;
    RAISE NOTICE '✅ Dropped content_metrics table';
  END IF;
END $$;

-- ============================================
-- Step 7: Create helper function for content analytics
-- ============================================

CREATE OR REPLACE FUNCTION public.get_content_analytics(
  p_content_id UUID DEFAULT NULL,
  p_start_date TIMESTAMPTZ DEFAULT NULL,
  p_end_date TIMESTAMPTZ DEFAULT NULL
)
RETURNS TABLE (
  content_id UUID,
  event_type TEXT,
  event_count BIGINT,
  unique_viewers BIGINT,
  first_event TIMESTAMPTZ,
  last_event TIMESTAMPTZ
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    sl.content_id,
    sl.event_name AS event_type,
    COUNT(*) AS event_count,
    COUNT(DISTINCT sl.viewer_profile_id) AS unique_viewers,
    MIN(sl.created_at) AS first_event,
    MAX(sl.created_at) AS last_event
  FROM public.system_logs sl
  WHERE sl.log_type = 'content_metric'
    AND sl.content_id IS NOT NULL
    AND (p_content_id IS NULL OR sl.content_id = p_content_id)
    AND (p_start_date IS NULL OR sl.created_at >= p_start_date)
    AND (p_end_date IS NULL OR sl.created_at <= p_end_date)
  GROUP BY sl.content_id, sl.event_name
  ORDER BY sl.content_id, event_count DESC;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION public.get_content_analytics IS 'Get aggregated content analytics from system_logs';

-- ============================================
-- Step 8: Create helper function for content performance
-- ============================================

CREATE OR REPLACE FUNCTION public.get_top_performing_content(
  p_event_type TEXT DEFAULT 'click',
  p_limit INTEGER DEFAULT 10,
  p_start_date TIMESTAMPTZ DEFAULT now() - interval '30 days'
)
RETURNS TABLE (
  content_id UUID,
  content_title TEXT,
  content_type TEXT,
  event_count BIGINT,
  unique_viewers BIGINT,
  click_through_rate NUMERIC(5,2)
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    sl.content_id,
    c.title AS content_title,
    c.content_type,
    COUNT(*) FILTER (WHERE sl.event_name = p_event_type) AS event_count,
    COUNT(DISTINCT sl.viewer_profile_id) AS unique_viewers,
    CASE 
      WHEN COUNT(*) FILTER (WHERE sl.event_name = 'impression') > 0 
      THEN ROUND(
        (COUNT(*) FILTER (WHERE sl.event_name = 'click')::NUMERIC / 
         COUNT(*) FILTER (WHERE sl.event_name = 'impression')::NUMERIC) * 100, 
        2
      )
      ELSE 0
    END AS click_through_rate
  FROM public.system_logs sl
  JOIN public.content c ON c.id = sl.content_id
  WHERE sl.log_type = 'content_metric'
    AND sl.created_at >= p_start_date
  GROUP BY sl.content_id, c.title, c.content_type
  ORDER BY event_count DESC
  LIMIT p_limit;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION public.get_top_performing_content IS 'Get top performing content by event type';

-- ============================================
-- Step 9: Update RLS policies
-- ============================================

-- Ensure system_logs RLS policies allow content metrics access
-- (assuming existing RLS policies already cover system_logs table appropriately)

COMMIT;

-- ============================================
-- Verification queries (run after migration)
-- ============================================

-- Verify data migration
-- SELECT COUNT(*) as total_system_logs FROM public.system_logs;
-- SELECT COUNT(*) as content_metrics FROM public.system_logs WHERE log_type = 'content_metric';
-- SELECT event_name, COUNT(*) as event_count FROM public.system_logs 
-- WHERE log_type = 'content_metric' GROUP BY event_name;

-- Test analytics functions
-- SELECT * FROM public.get_content_analytics();
-- SELECT * FROM public.get_top_performing_content('click', 5);

DO $$
BEGIN
  RAISE NOTICE '========================================';
  RAISE NOTICE '✅ Phase 2: Analytics Consolidation COMPLETE';
  RAISE NOTICE '========================================';
  RAISE NOTICE 'Next steps:';
  RAISE NOTICE '1. Verify content metrics migration';
  RAISE NOTICE '2. Update application code to use system_logs or compatibility view';
  RAISE NOTICE '3. Test analytics queries and dashboard';
  RAISE NOTICE '4. Monitor for 1 week before proceeding to Phase 3';
  RAISE NOTICE '========================================';
  RAISE NOTICE 'Helper functions available:';
  RAISE NOTICE '- get_content_analytics(content_id, start_date, end_date)';
  RAISE NOTICE '- get_top_performing_content(event_type, limit, start_date)';
  RAISE NOTICE '========================================';
END $$;

