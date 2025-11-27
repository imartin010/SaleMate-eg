import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { getAuthenticatedUser } from '../_core/auth.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface AnalyticsRequest {
  type: 'agent_performance' | 'source_performance' | 'time_analytics' | 'project_performance' | 'area_performance' | 'developer_performance' | 'agent_revenue';
  startDate?: string;
  endDate?: string;
  granularity?: 'day' | 'week' | 'month';
  agentId?: string;
}

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Authenticate user
    const { user, supabase } = await getAuthenticatedUser(req);

    // Parse request body
    const body: AnalyticsRequest = await req.json();
    const { type, startDate, endDate, granularity = 'day', agentId } = body;

    if (!type) {
      return new Response(
        JSON.stringify({ error: 'Missing required field: type' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    let result;

    switch (type) {
      case 'agent_performance': {
        // Fetch agent performance data
        let query = supabase
          .from('crm_agent_performance')
          .select('*')
          .order('total_leads', { ascending: false });

        // Filter by specific agent if provided
        if (agentId) {
          query = query.eq('agent_id', agentId);
        }

        // Apply date range filter if provided (filter leads, not the view)
        // Note: The view aggregates all leads, so we'll filter in a subquery if needed
        // For now, we return all agent performance data
        // In production, you might want to create a parameterized view

        const { data, error } = await query;

        if (error) {
          console.error('Error fetching agent performance:', error);
          return new Response(
            JSON.stringify({ error: error.message }),
            { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }

        result = data;
        break;
      }

      case 'source_performance': {
        // Fetch source performance data
        const { data, error } = await supabase
          .from('crm_source_performance')
          .select('*')
          .order('total_leads', { ascending: false });

        if (error) {
          console.error('Error fetching source performance:', error);
          return new Response(
            JSON.stringify({ error: error.message }),
            { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }

        result = data;
        break;
      }

      case 'time_analytics': {
        // Fetch time-based analytics using the function
        const start = startDate ? new Date(startDate) : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
        const end = endDate ? new Date(endDate) : new Date();

        const { data, error } = await supabase.rpc('get_crm_time_analytics', {
          start_date: start.toISOString(),
          end_date: end.toISOString(),
          granularity: granularity,
        });

        if (error) {
          console.error('Error fetching time analytics:', error);
          return new Response(
            JSON.stringify({ error: error.message }),
            { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }

        result = data;
        break;
      }

      case 'project_performance': {
        const { data, error } = await supabase
          .from('crm_project_performance')
          .select('*')
          .order('total_leads', { ascending: false });

        if (error) {
          console.error('Error fetching project performance:', error);
          return new Response(
            JSON.stringify({ error: error.message }),
            { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }

        result = data;
        break;
      }

      case 'area_performance': {
        const { data, error } = await supabase
          .from('crm_area_performance')
          .select('*')
          .order('total_leads', { ascending: false });

        if (error) {
          console.error('Error fetching area performance:', error);
          return new Response(
            JSON.stringify({ error: error.message }),
            { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }

        result = data;
        break;
      }

      case 'developer_performance': {
        const { data, error } = await supabase
          .from('crm_developer_performance')
          .select('*')
          .order('total_leads', { ascending: false });

        if (error) {
          console.error('Error fetching developer performance:', error);
          return new Response(
            JSON.stringify({ error: error.message }),
            { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }

        result = data;
        break;
      }

      case 'agent_revenue': {
        const { data, error } = await supabase
          .from('crm_agent_revenue')
          .select('*')
          .order('total_revenue', { ascending: false });

        if (error) {
          console.error('Error fetching agent revenue:', error);
          return new Response(
            JSON.stringify({ error: error.message }),
            { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }

        result = data;
        break;
      }

      default:
        return new Response(
          JSON.stringify({ error: 'Invalid type. Must be: agent_performance, source_performance, time_analytics, project_performance, area_performance, developer_performance, or agent_revenue' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
    }

    return new Response(
      JSON.stringify({ success: true, data: result }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Unexpected error:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Internal server error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});

