import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../../lib/supabaseClient';

export interface AgentPerformance {
  agent_id: string;
  agent_name: string;
  agent_email: string;
  total_leads: number;
  closed_deals: number;
  conversion_rate: number;
  avg_response_time_hours: number | null;
  avg_time_to_close_days: number | null;
  total_budget: number;
  closed_deals_budget: number;
}

export interface SourcePerformance {
  source: string;
  total_leads: number;
  closed_deals: number;
  conversion_rate: number;
  total_cost: number;
  total_revenue: number;
  closed_deals_revenue: number;
  roi_percentage: number;
}

export interface TimeAnalytics {
  period_start: string;
  period_end: string;
  period_label: string;
  leads_created: number;
  leads_closed: number;
  conversion_rate: number;
}

export interface DateRange {
  startDate: Date;
  endDate: Date;
}

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL || 'https://wkxbhvckmgrmdkdkhnqo.supabase.co';

async function fetchAnalytics(type: string, params: Record<string, unknown> = {}) {
  const { data: { session } } = await supabase.auth.getSession();
  
  if (!session) {
    throw new Error('Not authenticated');
  }

  try {
    // Try Edge Function first
    const response = await fetch(`${SUPABASE_URL}/functions/v1/crm-analytics`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${session.access_token}`,
      },
      body: JSON.stringify({ type, ...params }),
    });

    if (response.ok) {
      const result = await response.json();
      return result.data;
    }

    // If Edge Function fails, fallback to direct database queries
    console.warn('Edge Function failed, falling back to direct database queries');
    return await fetchAnalyticsDirect(type, params);
  } catch (error) {
    console.warn('Edge Function error, falling back to direct database queries:', error);
    return await fetchAnalyticsDirect(type, params);
  }
}

async function fetchAnalyticsDirect(type: string, params: Record<string, unknown> = {}) {
  const { startDate, endDate, granularity = 'day', agentId } = params;

  switch (type) {
    case 'agent_performance': {
      let query = supabase
        .from('crm_agent_performance')
        .select('*')
        .order('total_leads', { ascending: false });

      if (agentId) {
        query = query.eq('agent_id', agentId);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data || [];
    }

    case 'source_performance': {
      const { data, error } = await supabase
        .from('crm_source_performance')
        .select('*')
        .order('total_leads', { ascending: false });

      if (error) throw error;
      return data || [];
    }

    case 'time_analytics': {
      const start = startDate ? new Date(startDate as string) : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
      const end = endDate ? new Date(endDate as string) : new Date();

      const { data, error } = await supabase.rpc('get_crm_time_analytics', {
        start_date: start.toISOString(),
        end_date: end.toISOString(),
        granularity: granularity as string,
      });

      if (error) throw error;
      return data || [];
    }

    default:
      throw new Error(`Unknown analytics type: ${type}`);
  }
}

export function useAgentPerformance(dateRange?: DateRange, agentId?: string) {
  const [data, setData] = useState<AgentPerformance[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      
      const params: Record<string, unknown> = {};
      if (dateRange) {
        params.startDate = dateRange.startDate.toISOString();
        params.endDate = dateRange.endDate.toISOString();
      }
      if (agentId) {
        params.agentId = agentId;
      }

      const result = await fetchAnalytics('agent_performance', params);
      setData(result || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch agent performance');
      setData([]);
    } finally {
      setLoading(false);
    }
  }, [dateRange, agentId]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  return { data, loading, error, refetch: fetchData };
}

export function useSourcePerformance(dateRange?: DateRange) {
  const [data, setData] = useState<SourcePerformance[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      
      const params: Record<string, unknown> = {};
      if (dateRange) {
        params.startDate = dateRange.startDate.toISOString();
        params.endDate = dateRange.endDate.toISOString();
      }

      const result = await fetchAnalytics('source_performance', params);
      setData(result || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch source performance');
      setData([]);
    } finally {
      setLoading(false);
    }
  }, [dateRange]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  return { data, loading, error, refetch: fetchData };
}

export function useTimeBasedAnalytics(
  dateRange: DateRange,
  granularity: 'day' | 'week' | 'month' = 'day'
) {
  const [data, setData] = useState<TimeAnalytics[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      
      const params = {
        startDate: dateRange.startDate.toISOString(),
        endDate: dateRange.endDate.toISOString(),
        granularity,
      };

      const result = await fetchAnalytics('time_analytics', params);
      setData(result || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch time analytics');
      setData([]);
    } finally {
      setLoading(false);
    }
  }, [dateRange, granularity]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  return { data, loading, error, refetch: fetchData };
}

