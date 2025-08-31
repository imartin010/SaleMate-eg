import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface ApprovalRequest {
  request_id: string;
  action: 'approve' | 'reject';
  admin_notes?: string;
}

serve(async (req) => {
  // Handle CORS
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    // Create Supabase client
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    // Get user from JWT
    const authHeader = req.headers.get('Authorization')!
    const token = authHeader.replace('Bearer ', '')
    const { data: { user }, error: authError } = await supabaseClient.auth.getUser(token)
    
    if (authError || !user) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Check if user is admin or support
    const { data: profile } = await supabaseClient
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single()

    if (!profile || !['admin', 'support'].includes(profile.role)) {
      return new Response(
        JSON.stringify({ error: 'Insufficient permissions' }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const url = new URL(req.url)
    const path = url.pathname.split('/').pop()

    // GET /pending-requests - Get all pending purchase requests
    if (req.method === 'GET' && path === 'pending-requests') {
      const { data: requests, error } = await supabaseClient
        .from('lead_purchase_requests')
        .select(`
          id,
          number_of_leads,
          cpl_price,
          total_price,
          status,
          receipt_file_url,
          receipt_file_name,
          created_at,
          profiles!buyer_user_id (
            id,
            name,
            email
          ),
          projects (
            id,
            name,
            developer,
            region
          )
        `)
        .eq('status', 'pending')
        .order('created_at', { ascending: true })

      if (error) {
        return new Response(
          JSON.stringify({ error: 'Failed to fetch purchase requests' }),
          { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }

      return new Response(
        JSON.stringify({ requests }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // GET /all-requests - Get all purchase requests with filters
    if (req.method === 'GET' && path === 'all-requests') {
      const status = url.searchParams.get('status')
      const limit = parseInt(url.searchParams.get('limit') || '50')
      const offset = parseInt(url.searchParams.get('offset') || '0')

      let query = supabaseClient
        .from('lead_purchase_requests')
        .select(`
          id,
          number_of_leads,
          cpl_price,
          total_price,
          status,
          admin_notes,
          created_at,
          approved_at,
          rejected_at,
          profiles!buyer_user_id (
            id,
            name,
            email
          ),
          profiles!admin_user_id (
            id,
            name,
            email
          ),
          projects (
            id,
            name,
            developer,
            region
          )
        `)

      if (status) {
        query = query.eq('status', status)
      }

      const { data: requests, error, count } = await query
        .order('created_at', { ascending: false })
        .range(offset, offset + limit - 1)

      if (error) {
        return new Response(
          JSON.stringify({ error: 'Failed to fetch purchase requests' }),
          { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }

      return new Response(
        JSON.stringify({ 
          requests,
          total: count,
          limit,
          offset
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // POST /process-request - Approve or reject purchase request
    if (req.method === 'POST' && path === 'process-request') {
      const { request_id, action, admin_notes }: ApprovalRequest = await req.json()

      if (!request_id || !action || !['approve', 'reject'].includes(action)) {
        return new Response(
          JSON.stringify({ error: 'Invalid request data' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }

      let result
      if (action === 'approve') {
        const { data, error } = await supabaseClient
          .rpc('approve_purchase_request', {
            request_id,
            admin_id: user.id,
            admin_notes
          })
        result = { data, error }
      } else {
        const { data, error } = await supabaseClient
          .rpc('reject_purchase_request', {
            request_id,
            admin_id: user.id,
            admin_notes
          })
        result = { data, error }
      }

      if (result.error) {
        return new Response(
          JSON.stringify({ 
            error: 'Failed to process request',
            details: result.error.message 
          }),
          { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }

      return new Response(
        JSON.stringify({
          success: true,
          result: result.data,
          message: `Purchase request ${action}d successfully`
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // GET /batch-history - Get lead batch upload history
    if (req.method === 'GET' && path === 'batch-history') {
      const { data: batches, error } = await supabaseClient
        .from('lead_batches')
        .select(`
          id,
          batch_name,
          total_leads,
          successful_leads,
          failed_leads,
          cpl_price,
          status,
          error_details,
          created_at,
          projects (
            name,
            developer
          ),
          profiles!upload_user_id (
            name,
            email
          )
        `)
        .order('created_at', { ascending: false })
        .limit(50)

      if (error) {
        return new Response(
          JSON.stringify({ error: 'Failed to fetch batch history' }),
          { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }

      return new Response(
        JSON.stringify({ batches }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    return new Response(
      JSON.stringify({ error: 'Not found' }),
      { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    console.error('Function error:', error)
    return new Response(
      JSON.stringify({ 
        error: 'Internal server error',
        details: error.message 
      }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )
  }
})
