import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface PurchaseRequest {
  project_id: string;
  number_of_leads: number;
  receipt_file_url?: string;
  receipt_file_name?: string;
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

    const url = new URL(req.url)
    const path = url.pathname.split('/').pop()

    // GET /marketplace - List available projects with leads
    if (req.method === 'GET' && path === 'marketplace') {
      const { data: projects, error } = await supabaseClient
        .rpc('get_marketplace_projects')

      if (error) {
        return new Response(
          JSON.stringify({ error: 'Failed to fetch marketplace data' }),
          { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }

      return new Response(
        JSON.stringify({ projects }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // POST /purchase-request - Create purchase request
    if (req.method === 'POST' && path === 'purchase-request') {
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

      const { project_id, number_of_leads, receipt_file_url, receipt_file_name }: PurchaseRequest = await req.json()

      // Validate input
      if (!project_id || !number_of_leads || number_of_leads <= 0) {
        return new Response(
          JSON.stringify({ error: 'Invalid request data' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }

      // Get project info and check available leads
      const { data: projectData, error: projectError } = await supabaseClient
        .from('leads')
        .select(`
          cpl_price,
          project_id,
          projects (
            id,
            name,
            available_leads
          )
        `)
        .eq('project_id', project_id)
        .eq('is_sold', false)
        .limit(1)
        .single()

      if (projectError || !projectData) {
        return new Response(
          JSON.stringify({ error: 'Project not found or no leads available' }),
          { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }

      // Count available leads for this project
      const { count: availableCount, error: countError } = await supabaseClient
        .from('leads')
        .select('id', { count: 'exact', head: true })
        .eq('project_id', project_id)
        .eq('is_sold', false)

      if (countError || !availableCount || availableCount < number_of_leads) {
        return new Response(
          JSON.stringify({ 
            error: `Not enough leads available. Requested: ${number_of_leads}, Available: ${availableCount || 0}` 
          }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }

      const cpl_price = projectData.cpl_price
      const total_price = cpl_price * number_of_leads

      // Create purchase request in commerce table
      const { data: purchaseRequest, error: requestError } = await supabaseClient
        .from('commerce')
        .insert({
          commerce_type: 'purchase',
          profile_id: user.id,
          project_id,
          quantity: number_of_leads,
          amount: total_price,
          currency: 'EGP',
          payment_method: 'Manual',
          receipt_url: receipt_file_url,
          receipt_file_name,
          status: 'pending',
          metadata: {
            cpl_price,
            receipt_file_url,
            receipt_file_name,
          }
        })
        .select(`
          id,
          number_of_leads,
          cpl_price,
          total_price,
          status,
          created_at,
          projects (
            name,
            developer
          )
        `)
        .single()

      if (requestError) {
        return new Response(
          JSON.stringify({ error: 'Failed to create purchase request' }),
          { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }

      return new Response(
        JSON.stringify({
          success: true,
          purchase_request: purchaseRequest,
          message: 'Purchase request created successfully. Awaiting admin approval.'
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // GET /purchase-requests - Get user's purchase requests
    if (req.method === 'GET' && path === 'purchase-requests') {
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

      const { data: requests, error } = await supabaseClient
        .from('commerce')
        .select(`
          id,
          quantity,
          amount,
          status,
          admin_notes,
          created_at,
          approved_at,
          rejected_at,
          metadata,
          projects (
            name,
            developer
          )
        `)
        .eq('profile_id', user.id)
        .eq('commerce_type', 'purchase')
        .order('created_at', { ascending: false })

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
