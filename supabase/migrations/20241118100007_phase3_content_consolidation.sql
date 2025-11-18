-- ============================================
-- PHASE 3: CONTENT CONSOLIDATION
-- Consolidate: content + content_metrics → content (with metrics)
-- ============================================
-- This migration enhances the content table to include metrics

BEGIN;

-- ============================================
-- Step 1: Add metrics columns to content table
-- ============================================

ALTER TABLE public.content
  ADD COLUMN IF NOT EXISTS total_impressions BIGINT DEFAULT 0,
  ADD COLUMN IF NOT EXISTS total_clicks BIGINT DEFAULT 0,
  ADD COLUMN IF NOT EXISTS total_views BIGINT DEFAULT 0,
  ADD COLUMN IF NOT EXISTS total_interactions BIGINT DEFAULT 0,
  ADD COLUMN IF NOT EXISTS unique_viewers BIGINT DEFAULT 0,
  ADD COLUMN IF NOT EXISTS metrics_summary JSONB DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS last_metrics_update TIMESTAMPTZ;

COMMENT ON COLUMN public.content.total_impressions IS 'Total number of impressions';
COMMENT ON COLUMN public.content.total_clicks IS 'Total number of clicks';
COMMENT ON COLUMN public.content.total_views IS 'Total number of views';
COMMENT ON COLUMN public.content.total_interactions IS 'Total number of interactions';
COMMENT ON COLUMN public.content.unique_viewers IS 'Number of unique viewers';
COMMENT ON COLUMN public.content.metrics_summary IS 'Aggregated metrics data';
COMMENT ON COLUMN public.content.last_metrics_update IS 'When metrics were last updated';

-- ============================================
-- Step 2: Migrate metrics from events table (if they exist)
-- ============================================

-- Calculate and update metrics from events table
UPDATE public.content c
SET 
  total_impressions = COALESCE((
    SELECT COUNT(*) 
    FROM public.events e 
    WHERE e.event_type = 'metric' 
      AND e.metadata->>'content_id' = c.id::text 
      AND e.metadata->>'event' = 'impression'
  ), 0),
  total_clicks = COALESCE((
    SELECT COUNT(*) 
    FROM public.events e 
    WHERE e.event_type = 'metric' 
      AND e.metadata->>'content_id' = c.id::text 
      AND e.metadata->>'event' = 'click'
  ), 0),
  total_views = COALESCE((
    SELECT COUNT(*) 
    FROM public.events e 
    WHERE e.event_type = 'metric' 
      AND e.metadata->>'content_id' = c.id::text 
      AND e.metadata->>'event' = 'view'
  ), 0),
  total_interactions = COALESCE((
    SELECT COUNT(*) 
    FROM public.events e 
    WHERE e.event_type = 'metric' 
      AND e.metadata->>'content_id' = c.id::text 
      AND e.metadata->>'event' = 'interaction'
  ), 0),
  unique_viewers = COALESCE((
    SELECT COUNT(DISTINCT e.profile_id) 
    FROM public.events e 
    WHERE e.event_type = 'metric' 
      AND e.metadata->>'content_id' = c.id::text
  ), 0),
  metrics_summary = jsonb_build_object(
    'impressions', COALESCE((SELECT COUNT(*) FROM public.events e WHERE e.event_type = 'metric' AND e.metadata->>'content_id' = c.id::text AND e.metadata->>'event' = 'impression'), 0),
    'clicks', COALESCE((SELECT COUNT(*) FROM public.events e WHERE e.event_type = 'metric' AND e.metadata->>'content_id' = c.id::text AND e.metadata->>'event' = 'click'), 0),
    'views', COALESCE((SELECT COUNT(*) FROM public.events e WHERE e.event_type = 'metric' AND e.metadata->>'content_id' = c.id::text AND e.metadata->>'event' = 'view'), 0),
    'unique_viewers', COALESCE((SELECT COUNT(DISTINCT e.profile_id) FROM public.events e WHERE e.event_type = 'metric' AND e.metadata->>'content_id' = c.id::text), 0)
  ),
  last_metrics_update = now();

-- ============================================
-- Step 3: Create function to update content metrics
-- ============================================

CREATE OR REPLACE FUNCTION public.update_content_metrics(p_content_id UUID)
RETURNS VOID AS $$
BEGIN
  UPDATE public.content c
  SET 
    total_impressions = COALESCE((
      SELECT COUNT(*) 
      FROM public.events e 
      WHERE e.event_type = 'metric' 
        AND e.metadata->>'content_id' = p_content_id::text 
        AND e.metadata->>'event' = 'impression'
    ), 0),
    total_clicks = COALESCE((
      SELECT COUNT(*) 
      FROM public.events e 
      WHERE e.event_type = 'metric' 
        AND e.metadata->>'content_id' = p_content_id::text 
        AND e.metadata->>'event' = 'click'
    ), 0),
    total_views = COALESCE((
      SELECT COUNT(*) 
      FROM public.events e 
      WHERE e.event_type = 'metric' 
        AND e.metadata->>'content_id' = p_content_id::text 
        AND e.metadata->>'event' = 'view'
    ), 0),
    total_interactions = COALESCE((
      SELECT COUNT(*) 
      FROM public.events e 
      WHERE e.event_type = 'metric' 
        AND e.metadata->>'content_id' = p_content_id::text 
        AND e.metadata->>'event' = 'interaction'
    ), 0),
    unique_viewers = COALESCE((
      SELECT COUNT(DISTINCT e.profile_id) 
      FROM public.events e 
      WHERE e.event_type = 'metric' 
        AND e.metadata->>'content_id' = p_content_id::text
    ), 0),
    last_metrics_update = now()
  WHERE c.id = p_content_id;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION public.update_content_metrics IS 'Update aggregated metrics for a content item from events table';

-- ============================================
-- Step 4: Create function to track content metric
-- ============================================

CREATE OR REPLACE FUNCTION public.track_content_metric(
  p_content_id UUID,
  p_profile_id UUID,
  p_event TEXT
)
RETURNS UUID AS $$
DECLARE
  v_event_id UUID;
BEGIN
  -- Insert metric event
  INSERT INTO public.events (
    event_type,
    event_category,
    profile_id,
    metadata,
    created_at
  ) VALUES (
    'metric',
    'content_metric',
    p_profile_id,
    jsonb_build_object(
      'content_id', p_content_id,
      'event', p_event
    ),
    now()
  ) RETURNING id INTO v_event_id;
  
  -- Update content metrics
  PERFORM public.update_content_metrics(p_content_id);
  
  RETURN v_event_id;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION public.track_content_metric IS 'Track a content metric event and update aggregated metrics';

-- ============================================
-- Step 5: Create content_metrics compatibility view
-- ============================================

CREATE OR REPLACE VIEW public.content_metrics AS
SELECT
  e.id,
  (e.metadata->>'content_id')::uuid AS content_id,
  e.profile_id AS viewer_profile_id,
  e.metadata->>'event' AS event,
  e.created_at
FROM public.events e
WHERE e.event_type = 'metric'
  AND e.metadata->>'content_id' IS NOT NULL;

COMMENT ON VIEW public.content_metrics IS 'Compatibility view - backed by events table';

-- ============================================
-- Step 6: Create trigger for content_metrics view
-- ============================================

CREATE OR REPLACE FUNCTION public.sync_content_metrics_to_events()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    PERFORM public.track_content_metric(
      NEW.content_id,
      NEW.viewer_profile_id,
      NEW.event
    );
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    DELETE FROM public.events 
    WHERE id = OLD.id AND event_type = 'metric';
    RETURN OLD;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_content_metrics_sync
INSTEAD OF INSERT OR DELETE ON public.content_metrics
FOR EACH ROW EXECUTE FUNCTION public.sync_content_metrics_to_events();

-- ============================================
-- Step 7: Drop old content_metrics table if exists
-- ============================================

DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.tables 
    WHERE table_schema = 'public' AND table_name = 'content_metrics'
    AND table_type = 'BASE TABLE'
  ) THEN
    DROP TABLE public.content_metrics CASCADE;
    RAISE NOTICE '✅ Dropped content_metrics table';
  END IF;
END $$;

-- ============================================
-- Step 8: Create function to get content analytics
-- ============================================

CREATE OR REPLACE FUNCTION public.get_content_analytics(
  p_content_id UUID DEFAULT NULL,
  p_start_date TIMESTAMPTZ DEFAULT NULL,
  p_end_date TIMESTAMPTZ DEFAULT NULL
)
RETURNS TABLE (
  content_id UUID,
  content_title TEXT,
  content_type TEXT,
  impressions BIGINT,
  clicks BIGINT,
  views BIGINT,
  unique_viewers BIGINT,
  ctr NUMERIC(5,2)
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    c.id AS content_id,
    c.title AS content_title,
    c.content_type,
    c.total_impressions AS impressions,
    c.total_clicks AS clicks,
    c.total_views AS views,
    c.unique_viewers,
    CASE 
      WHEN c.total_impressions > 0 
      THEN ROUND((c.total_clicks::NUMERIC / c.total_impressions::NUMERIC) * 100, 2)
      ELSE 0
    END AS ctr
  FROM public.content c
  WHERE (p_content_id IS NULL OR c.id = p_content_id)
  ORDER BY c.total_impressions DESC;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION public.get_content_analytics IS 'Get aggregated content analytics';

COMMIT;

-- ============================================
-- Verification
-- ============================================

DO $$
DECLARE
  v_table_count INTEGER;
  v_content_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO v_table_count 
  FROM information_schema.tables 
  WHERE table_schema = 'public' AND table_type = 'BASE TABLE';
  
  SELECT COUNT(*) INTO v_content_count
  FROM public.content;
  
  RAISE NOTICE '========================================';
  RAISE NOTICE '✅ Phase 3 COMPLETE: Content consolidation';
  RAISE NOTICE '========================================';
  RAISE NOTICE 'Enhanced: content table with metrics columns';
  RAISE NOTICE 'Content items: %', v_content_count;
  RAISE NOTICE 'Metrics migrated from events table';
  RAISE NOTICE 'View created: content_metrics (compatibility)';
  RAISE NOTICE 'Functions: 3 created';
  RAISE NOTICE 'Current table count: %', v_table_count;
  RAISE NOTICE '';
  RAISE NOTICE 'Next: Run Phase 4 migrations for system_data consolidation';
  RAISE NOTICE '========================================';
END $$;

