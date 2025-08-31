import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface AnalyticsResponse {
  success: boolean
  message: string
  refresh_time?: string
  records_processed?: number
  execution_time_ms?: number
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    // Only allow POST requests
    if (req.method !== 'POST') {
      return new Response(
        JSON.stringify({ 
          success: false, 
          message: 'Method not allowed. Only POST requests are accepted.' 
        }),
        { 
          status: 405, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    // Get environment variables
    const supabaseUrl = Deno.env.get('SUPABASE_URL')
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')

    if (!supabaseUrl || !supabaseServiceKey) {
      console.error('Missing required environment variables')
      return new Response(
        JSON.stringify({ 
          success: false, 
          message: 'Server configuration error' 
        }),
        { 
          status: 500, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    // Create Supabase client with service role key
    const supabase = createClient(supabaseUrl, supabaseServiceKey)

    const startTime = Date.now()

    // Refresh the materialized view
    const { error: refreshError } = await supabase
      .rpc('refresh_materialized_view', { view_name: 'lead_analytics_mv' })

    if (refreshError) {
      console.error('Failed to refresh materialized view:', refreshError)
      
      // Try alternative approach - direct SQL execution
      const { error: sqlError } = await supabase
        .rpc('exec_sql', { 
          sql: 'REFRESH MATERIALIZED VIEW lead_analytics_mv' 
        })

      if (sqlError) {
        console.error('Failed to refresh materialized view with SQL:', sqlError)
        return new Response(
          JSON.stringify({ 
            success: false, 
            message: 'Failed to refresh analytics: ' + sqlError.message 
          }),
          { 
            status: 500, 
            headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
          }
        )
      }
    }

    // Get count of records in the materialized view
    const { data: analyticsData, error: countError } = await supabase
      .from('lead_analytics_mv')
      .select('*', { count: 'exact' })

    if (countError) {
      console.warn('Failed to get analytics record count:', countError)
    }

    const executionTime = Date.now() - startTime
    const refreshTime = new Date().toISOString()
    const recordsProcessed = analyticsData?.length || 0

    // Log successful refresh
    console.log('Analytics refresh completed successfully:', {
      refresh_time: refreshTime,
      records_processed: recordsProcessed,
      execution_time_ms: executionTime
    })

    // Return success response
    const response: AnalyticsResponse = {
      success: true,
      message: 'Analytics refreshed successfully',
      refresh_time: refreshTime,
      records_processed: recordsProcessed,
      execution_time_ms: executionTime
    }

    return new Response(
      JSON.stringify(response),
      { 
        status: 200, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )

  } catch (error) {
    console.error('Unexpected error in analytics refresh function:', error)
    
    return new Response(
      JSON.stringify({ 
        success: false, 
        message: 'Internal server error: ' + error.message 
      }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )
  }
})

// Example usage:
// curl -X POST "http://localhost:5433/functions/v1/recalc_analytics" \
//   -H "Content-Type: application/json" \
//   -d '{}'

// For cron job setup:
// This function can be called via cron to refresh analytics nightly
// Example cron schedule: "0 2 * * *" (daily at 2 AM)
// 
// To set up as a cron job in Supabase:
// 1. Deploy the function: supabase functions deploy recalc_analytics --no-verify-jwt
// 2. Set up cron job in Supabase dashboard or via SQL:
//    SELECT cron.schedule(
//      'refresh-analytics',
//      '0 2 * * *',
//      'SELECT net.http_post(
//        url := ''https://your-project.supabase.co/functions/v1/recalc_analytics'',
//        headers := ''{"Authorization": "Bearer YOUR_SERVICE_ROLE_KEY"}''::jsonb
//      );'
//    );
