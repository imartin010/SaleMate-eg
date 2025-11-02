// Supabase Edge Function: Purchase Leads
// Handles lead purchases with wallet or payment gateway

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const authHeader = req.headers.get('Authorization')
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: 'Missing authorization header' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    // Get user
    const { data: { user }, error: userError } = await supabaseAdmin.auth.getUser(
      authHeader.replace('Bearer ', '')
    )

    if (userError || !user) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const { project_id, quantity, payment_method } = await req.json()

    // Validate inputs
    if (!project_id || !quantity || quantity < 30) {
      return new Response(
        JSON.stringify({ error: 'Invalid input. Minimum 30 leads required.' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Get project details
    const { data: project, error: projectError } = await supabaseAdmin
      .from('projects')
      .select('id, name, available_leads, price_per_lead')
      .eq('id', project_id)
      .single()

    if (projectError || !project) {
      return new Response(
        JSON.stringify({ error: 'Project not found' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Check available leads
    if (project.available_leads < quantity) {
      return new Response(
        JSON.stringify({ 
          error: `Not enough leads available. Only ${project.available_leads} leads in stock.` 
        }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const totalAmount = project.price_per_lead * quantity

    // Process payment based on method
    if (payment_method === 'wallet') {
      // Deduct from wallet
      const { data: walletResult, error: walletError } = await supabaseAdmin.rpc('deduct_from_wallet', {
        p_user_id: user.id,
        p_amount: totalAmount,
        p_description: `Purchase ${quantity} leads from ${project.name}`
      })

      if (walletError) {
        return new Response(
          JSON.stringify({ error: walletError.message }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }
    } else {
      // For card/instapay - payment would be processed here
      // For now, we'll skip actual payment integration
      // TODO: Integrate with payment gateway
    }

    // Start transaction: Assign leads to user
    const { data: availableLeads, error: fetchError } = await supabaseAdmin
      .from('leads')
      .select('id')
      .eq('project_id', project_id)
      .eq('is_sold', false)
      .is('buyer_user_id', null)
      .limit(quantity)

    if (fetchError || !availableLeads || availableLeads.length < quantity) {
      return new Response(
        JSON.stringify({ error: 'Failed to fetch available leads' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const leadIds = availableLeads.map(l => l.id)

    // Update leads
    const { error: updateError } = await supabaseAdmin
      .from('leads')
      .update({
        buyer_user_id: user.id,
        owner_id: user.id,
        is_sold: true,
        sold_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .in('id', leadIds)

    if (updateError) {
      // Rollback wallet deduction if lead assignment fails
      if (payment_method === 'wallet') {
        await supabaseAdmin.rpc('add_to_wallet', {
          p_user_id: user.id,
          p_amount: totalAmount,
          p_description: 'Refund - lead purchase failed'
        })
      }
      
      return new Response(
        JSON.stringify({ error: 'Failed to assign leads' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Decrement available leads
    await supabaseAdmin
      .from('projects')
      .update({ 
        available_leads: project.available_leads - quantity 
      })
      .eq('id', project_id)

    // Log purchase
    await supabaseAdmin
      .from('audit_logs')
      .insert({
        actor_id: user.id,
        action: 'create',
        entity: 'purchase',
        entity_id: project_id,
        changes: {
          quantity,
          total_amount: totalAmount,
          payment_method,
          project_name: project.name,
        },
      })

    return new Response(
      JSON.stringify({
        success: true,
        lead_ids: leadIds,
        quantity: leadIds.length,
        total_amount: totalAmount,
        new_available: project.available_leads - quantity,
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  } catch (error) {
    console.error('❌ Purchase error:', error)
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})

