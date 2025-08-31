import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface CommissionRequest {
  project_id: string;
  partner_id: string;
  commission_rate: number;
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

    // GET /commissions - Get all project commissions (public)
    if (req.method === 'GET' && path === 'commissions') {
      const { data: commissions, error } = await supabaseClient
        .rpc('get_project_commissions')

      if (error) {
        return new Response(
          JSON.stringify({ error: 'Failed to fetch commissions' }),
          { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }

      // Group by project
      const projectCommissions: { [key: string]: any } = {}
      
      commissions?.forEach((comm: any) => {
        if (!projectCommissions[comm.project_id]) {
          projectCommissions[comm.project_id] = {
            project_id: comm.project_id,
            project_name: comm.project_name,
            developer_name: comm.developer_name,
            partners: []
          }
        }
        
        projectCommissions[comm.project_id].partners.push({
          partner_id: comm.partner_id,
          partner_name: comm.partner_name,
          commission_rate: comm.commission_rate
        })
      })

      return new Response(
        JSON.stringify({ 
          projects: Object.values(projectCommissions)
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // GET /partners - Get all partners (public)
    if (req.method === 'GET' && path === 'partners') {
      const { data: partners, error } = await supabaseClient
        .from('partners')
        .select('*')
        .eq('is_active', true)
        .order('name')

      if (error) {
        return new Response(
          JSON.stringify({ error: 'Failed to fetch partners' }),
          { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }

      return new Response(
        JSON.stringify({ partners }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Admin-only endpoints
    const authHeader = req.headers.get('Authorization')
    if (authHeader) {
      const token = authHeader.replace('Bearer ', '')
      const { data: { user }, error: authError } = await supabaseClient.auth.getUser(token)
      
      if (!authError && user) {
        // Check if user is admin
        const { data: profile } = await supabaseClient
          .from('profiles')
          .select('role')
          .eq('id', user.id)
          .single()

        const isAdmin = profile?.role === 'admin'

        if (isAdmin) {
          // POST /commission - Create/update commission
          if (req.method === 'POST' && path === 'commission') {
            const { project_id, partner_id, commission_rate }: CommissionRequest = await req.json()

            if (!project_id || !partner_id || commission_rate === undefined || commission_rate < 0 || commission_rate > 100) {
              return new Response(
                JSON.stringify({ error: 'Invalid commission data' }),
                { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
              )
            }

            const { data: commission, error } = await supabaseClient
              .from('project_partner_commissions')
              .upsert({
                project_id,
                partner_id,
                commission_rate,
                is_active: true,
                updated_at: new Date().toISOString()
              })
              .select(`
                id,
                commission_rate,
                projects (name),
                partners (name)
              `)
              .single()

            if (error) {
              return new Response(
                JSON.stringify({ error: 'Failed to save commission' }),
                { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
              )
            }

            return new Response(
              JSON.stringify({
                success: true,
                commission,
                message: 'Commission saved successfully'
              }),
              { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
            )
          }

          // DELETE /commission/:id - Delete commission
          if (req.method === 'DELETE' && path?.startsWith('commission/')) {
            const commissionId = path.split('/')[1]

            const { error } = await supabaseClient
              .from('project_partner_commissions')
              .update({ is_active: false })
              .eq('id', commissionId)

            if (error) {
              return new Response(
                JSON.stringify({ error: 'Failed to delete commission' }),
                { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
              )
            }

            return new Response(
              JSON.stringify({
                success: true,
                message: 'Commission deleted successfully'
              }),
              { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
            )
          }

          // POST /partner - Create partner
          if (req.method === 'POST' && path === 'partner') {
            const partnerData = await req.json()

            const { data: partner, error } = await supabaseClient
              .from('partners')
              .insert({
                name: partnerData.name,
                description: partnerData.description,
                logo_url: partnerData.logo_url,
                contact_email: partnerData.contact_email,
                contact_phone: partnerData.contact_phone,
                website: partnerData.website,
                is_active: true
              })
              .select()
              .single()

            if (error) {
              return new Response(
                JSON.stringify({ error: 'Failed to create partner' }),
                { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
              )
            }

            return new Response(
              JSON.stringify({
                success: true,
                partner,
                message: 'Partner created successfully'
              }),
              { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
            )
          }

          // GET /admin-commissions - Get all commissions for admin
          if (req.method === 'GET' && path === 'admin-commissions') {
            const { data: commissions, error } = await supabaseClient
              .from('project_partner_commissions')
              .select(`
                id,
                commission_rate,
                is_active,
                created_at,
                updated_at,
                projects (
                  id,
                  name,
                  developer
                ),
                partners (
                  id,
                  name
                )
              `)
              .eq('is_active', true)
              .order('created_at', { ascending: false })

            if (error) {
              return new Response(
                JSON.stringify({ error: 'Failed to fetch commissions' }),
                { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
              )
            }

            return new Response(
              JSON.stringify({ commissions }),
              { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
            )
          }
        }
      }
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
