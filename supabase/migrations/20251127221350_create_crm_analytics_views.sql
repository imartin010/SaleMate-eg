-- ============================================
-- CRM ANALYTICS VIEWS AND FUNCTIONS
-- ============================================
-- Creates views and functions for CRM analytics:
-- - Agent Performance metrics
-- - Source Performance ROI
-- - Time-based Analytics
-- ============================================

-- ============================================
-- 1. AGENT PERFORMANCE VIEW
-- ============================================
-- Aggregates leads handled, conversion rates, response times per agent

CREATE OR REPLACE VIEW public.crm_agent_performance AS
SELECT 
  COALESCE(l.assigned_to_id, l.buyer_user_id) as agent_id,
  p.name as agent_name,
  p.email as agent_email,
  COUNT(DISTINCT l.id) as total_leads,
  COUNT(DISTINCT CASE WHEN l.stage = 'Closed Deal' THEN l.id END) as closed_deals,
  CASE 
    WHEN COUNT(DISTINCT l.id) > 0 
    THEN ROUND((COUNT(DISTINCT CASE WHEN l.stage = 'Closed Deal' THEN l.id END)::numeric / COUNT(DISTINCT l.id)::numeric) * 100, 2)
    ELSE 0
  END as conversion_rate,
  AVG(
    CASE 
      WHEN l.last_contacted_at IS NOT NULL AND COALESCE(l.assigned_at, l.created_at) IS NOT NULL
      THEN EXTRACT(EPOCH FROM (l.last_contacted_at - COALESCE(l.assigned_at, l.created_at))) / 3600
      ELSE NULL
    END
  ) as avg_response_time_hours,
  AVG(
    CASE 
      WHEN l.sold_at IS NOT NULL AND l.created_at IS NOT NULL
      THEN EXTRACT(EPOCH FROM (l.sold_at - l.created_at)) / 86400
      ELSE NULL
    END
  ) as avg_time_to_close_days,
  SUM(COALESCE(l.budget, 0)) as total_budget,
  SUM(CASE WHEN l.stage = 'Closed Deal' THEN COALESCE(l.budget, 0) ELSE 0 END) as closed_deals_budget
FROM public.leads l
LEFT JOIN public.profiles p ON p.id = COALESCE(l.assigned_to_id, l.buyer_user_id)
WHERE COALESCE(l.assigned_to_id, l.buyer_user_id) IS NOT NULL
GROUP BY COALESCE(l.assigned_to_id, l.buyer_user_id), p.name, p.email;

COMMENT ON VIEW public.crm_agent_performance IS 'Agent performance metrics: leads handled, conversion rates, response times';

-- ============================================
-- 2. SOURCE PERFORMANCE VIEW
-- ============================================
-- Calculates ROI per source (Facebook, Instagram, etc.)

CREATE OR REPLACE VIEW public.crm_source_performance AS
SELECT 
  COALESCE(l.source, 'unknown') as source,
  COUNT(DISTINCT l.id) as total_leads,
  COUNT(DISTINCT CASE WHEN l.stage = 'Closed Deal' THEN l.id END) as closed_deals,
  CASE 
    WHEN COUNT(DISTINCT l.id) > 0 
    THEN ROUND((COUNT(DISTINCT CASE WHEN l.stage = 'Closed Deal' THEN l.id END)::numeric / COUNT(DISTINCT l.id)::numeric) * 100, 2)
    ELSE 0
  END as conversion_rate,
  -- Cost calculation: use cpl_price if available, otherwise use project price_per_lead
  SUM(COALESCE(l.cpl_price, pr.price_per_lead, 0)) as total_cost,
  -- Revenue calculation: sum of budgets for leads with budget
  SUM(COALESCE(l.budget, 0)) as total_revenue,
  SUM(CASE WHEN l.stage = 'Closed Deal' THEN COALESCE(l.budget, 0) ELSE 0 END) as closed_deals_revenue,
  -- ROI calculation: ((Revenue - Cost) / Cost) * 100
  CASE 
    WHEN SUM(COALESCE(l.cpl_price, pr.price_per_lead, 0)) > 0
    THEN ROUND(((SUM(COALESCE(l.budget, 0)) - SUM(COALESCE(l.cpl_price, pr.price_per_lead, 0))) / SUM(COALESCE(l.cpl_price, pr.price_per_lead, 0))) * 100, 2)
    ELSE 0
  END as roi_percentage
FROM public.leads l
LEFT JOIN public.projects pr ON pr.id = l.project_id
GROUP BY COALESCE(l.source, 'unknown');

COMMENT ON VIEW public.crm_source_performance IS 'Source performance metrics: ROI, conversion rates, cost and revenue per source';

-- ============================================
-- 3. TIME-BASED ANALYTICS FUNCTION
-- ============================================
-- Returns time series data for leads created/closed by day/week/month

CREATE OR REPLACE FUNCTION public.get_crm_time_analytics(
  start_date timestamptz DEFAULT (now() - interval '30 days'),
  end_date timestamptz DEFAULT now(),
  granularity text DEFAULT 'day'
)
RETURNS TABLE (
  period_start timestamptz,
  period_end timestamptz,
  period_label text,
  leads_created bigint,
  leads_closed bigint,
  conversion_rate numeric
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  date_trunc_format text;
BEGIN
  -- Set date trunc format based on granularity
  CASE granularity
    WHEN 'day' THEN date_trunc_format := 'day';
    WHEN 'week' THEN date_trunc_format := 'week';
    WHEN 'month' THEN date_trunc_format := 'month';
    ELSE date_trunc_format := 'day';
  END CASE;

  RETURN QUERY
  WITH date_series AS (
    SELECT generate_series(
      date_trunc(date_trunc_format, start_date),
      date_trunc(date_trunc_format, end_date),
      CASE granularity
        WHEN 'day' THEN interval '1 day'
        WHEN 'week' THEN interval '1 week'
        WHEN 'month' THEN interval '1 month'
        ELSE interval '1 day'
      END
    )::timestamptz as period_start
  ),
  created_leads AS (
    SELECT 
      date_trunc(date_trunc_format, l.created_at)::timestamptz as period,
      COUNT(*) as count
    FROM public.leads l
    WHERE l.created_at >= start_date AND l.created_at <= end_date
    GROUP BY date_trunc(date_trunc_format, l.created_at)
  ),
  closed_leads AS (
    SELECT 
      date_trunc(date_trunc_format, l.sold_at)::timestamptz as period,
      COUNT(*) as count
    FROM public.leads l
    WHERE l.stage = 'Closed Deal'
      AND l.sold_at >= start_date AND l.sold_at <= end_date
    GROUP BY date_trunc(date_trunc_format, l.sold_at)
  )
  SELECT 
    ds.period_start,
    CASE granularity
      WHEN 'day' THEN ds.period_start + interval '1 day' - interval '1 second'
      WHEN 'week' THEN ds.period_start + interval '1 week' - interval '1 second'
      WHEN 'month' THEN ds.period_start + interval '1 month' - interval '1 second'
      ELSE ds.period_start + interval '1 day' - interval '1 second'
    END as period_end,
    CASE granularity
      WHEN 'day' THEN TO_CHAR(ds.period_start, 'YYYY-MM-DD')
      WHEN 'week' THEN TO_CHAR(ds.period_start, 'YYYY-MM-DD') || ' (Week)'
      WHEN 'month' THEN TO_CHAR(ds.period_start, 'YYYY-MM')
      ELSE TO_CHAR(ds.period_start, 'YYYY-MM-DD')
    END as period_label,
    COALESCE(cl.count, 0)::bigint as leads_created,
    COALESCE(cd.count, 0)::bigint as leads_closed,
    CASE 
      WHEN COALESCE(cl.count, 0) > 0 
      THEN ROUND((COALESCE(cd.count, 0)::numeric / cl.count::numeric) * 100, 2)
      ELSE 0
    END as conversion_rate
  FROM date_series ds
  LEFT JOIN created_leads cl ON cl.period = ds.period_start
  LEFT JOIN closed_leads cd ON cd.period = ds.period_start
  ORDER BY ds.period_start;
END;
$$;

COMMENT ON FUNCTION public.get_crm_time_analytics IS 'Returns time series analytics for leads created and closed by day/week/month';

-- ============================================
-- 4. GRANT PERMISSIONS
-- ============================================

GRANT SELECT ON public.crm_agent_performance TO authenticated;
GRANT SELECT ON public.crm_source_performance TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_crm_time_analytics TO authenticated;

