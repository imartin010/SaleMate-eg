import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    // Create Supabase client
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      {
        global: {
          headers: { Authorization: req.headers.get('Authorization')! },
        },
      }
    )

    // Get user from JWT
    const { data: { user }, error: userError } = await supabaseClient.auth.getUser()
    if (userError || !user) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const { method } = req
    const url = new URL(req.url)
    const path = url.pathname.split('/').pop()

    switch (method) {
      case 'GET':
        if (path === 'deals') {
          // Get user's deals
          const { data: deals, error } = await supabaseClient
            .from('deals')
            .select(`
              *,
              attachments:deal_attachments(*)
            `)
            .eq('user_id', user.id)
            .order('created_at', { ascending: false })

          if (error) throw error

          return new Response(
            JSON.stringify({ deals }),
            { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          )
        } else if (path && path !== 'deals') {
          // Get specific deal
          const { data: deal, error } = await supabaseClient
            .from('deals')
            .select(`
              *,
              attachments:deal_attachments(*)
            `)
            .eq('id', path)
            .eq('user_id', user.id)
            .single()

          if (error) throw error

          return new Response(
            JSON.stringify({ deal }),
            { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          )
        }
        break

      case 'POST':
        if (path === 'deals') {
          // Create new deal
          const dealData = await req.json()
          
          const { data: deal, error } = await supabaseClient
            .from('deals')
            .insert([{
              ...dealData,
              user_id: user.id
            }])
            .select()
            .single()

          if (error) throw error

          return new Response(
            JSON.stringify({ deal }),
            { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          )
        }
        break

      case 'PUT':
        if (path && path !== 'deals') {
          // Update deal
          const updateData = await req.json()
          
          const { data: deal, error } = await supabaseClient
            .from('deals')
            .update(updateData)
            .eq('id', path)
            .eq('user_id', user.id)
            .select()
            .single()

          if (error) throw error

          return new Response(
            JSON.stringify({ deal }),
            { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          )
        }
        break

      case 'DELETE':
        if (path && path !== 'deals') {
          // Delete deal
          const { error } = await supabaseClient
            .from('deals')
            .delete()
            .eq('id', path)
            .eq('user_id', user.id)

          if (error) throw error

          return new Response(
            JSON.stringify({ message: 'Deal deleted successfully' }),
            { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          )
        }
        break

      default:
        return new Response(
          JSON.stringify({ error: 'Method not allowed' }),
          { status: 405, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
    }

  } catch (error) {
    console.error('Error:', error)
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})
