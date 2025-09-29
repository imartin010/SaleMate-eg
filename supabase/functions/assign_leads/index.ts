import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface AssignLeadsPayload {
  action: 'assign' | 'revoke' | 'bulk_assign' | 'bulk_revoke'
  lead_ids?: string[]
  project_id?: string
  to_user_id?: string
  from_user_id?: string
  quantity?: number
  filters?: {
    project_id?: string
    platform?: string
    stage?: string
    created_after?: string
    created_before?: string
  }
}

interface AssignLeadsResponse {
  success: boolean
  message: string
  leads_processed?: number
  details?: Record<string, unknown>
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

    // Parse request body
    let payload: AssignLeadsPayload
    try {
      payload = await req.json()
    } catch (error) {
      console.error('Failed to parse request body:', error)
      return new Response(
        JSON.stringify({ 
          success: false, 
          message: 'Invalid JSON payload' 
        }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    // Validate required fields
    if (!payload.action) {
      return new Response(
        JSON.stringify({ 
          success: false, 
          message: 'Missing required field: action' 
        }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    let leadsProcessed = 0
    let responseMessage = ''

    switch (payload.action) {
      case 'assign': {
        // Assign specific leads to a user
        if (!payload.lead_ids || !payload.to_user_id) {
          return new Response(
            JSON.stringify({ 
              success: false, 
              message: 'For assign action: lead_ids and to_user_id are required' 
            }),
            { 
              status: 400, 
              headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
            }
          )
        }

        // Validate that target user exists
        const { data: targetUser, error: userError } = await supabase
          .from('profiles')
          .select('id, name')
          .eq('id', payload.to_user_id)
          .single()

        if (userError || !targetUser) {
          return new Response(
            JSON.stringify({ 
              success: false, 
              message: 'Target user not found' 
            }),
            { 
              status: 404, 
              headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
            }
          )
        }

        // Assign leads one by one using the RPC function
        for (const leadId of payload.lead_ids) {
          try {
            const { error: assignError } = await supabase
              .rpc('rpc_reassign_lead', {
                lead_id: leadId,
                to_user_id: payload.to_user_id
              })

            if (!assignError) {
              leadsProcessed++
            } else {
              console.warn(`Failed to assign lead ${leadId}:`, assignError)
            }
          } catch (error) {
            console.warn(`Error assigning lead ${leadId}:`, error)
          }
        }

        responseMessage = `Successfully assigned ${leadsProcessed} leads to ${targetUser.name}`
        break
      }

      case 'revoke': {
        // Revoke leads (set buyer_user_id to NULL)
        if (!payload.lead_ids) {
          return new Response(
            JSON.stringify({ 
              success: false, 
              message: 'For revoke action: lead_ids are required' 
            }),
            { 
              status: 400, 
              headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
            }
          )
        }

        const { data: revokedLeads, error: revokeError } = await supabase
          .from('leads')
          .update({ 
            buyer_user_id: null, 
            updated_at: new Date().toISOString() 
          })
          .in('id', payload.lead_ids)
          .select('id')

        if (revokeError) {
          console.error('Failed to revoke leads:', revokeError)
          return new Response(
            JSON.stringify({ 
              success: false, 
              message: 'Failed to revoke leads: ' + revokeError.message 
            }),
            { 
              status: 500, 
              headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
            }
          )
        }

        leadsProcessed = revokedLeads?.length || 0
        responseMessage = `Successfully revoked ${leadsProcessed} leads`
        break
      }

      case 'bulk_assign': {
        // Bulk assign leads based on filters
        if (!payload.to_user_id || !payload.quantity || payload.quantity <= 0) {
          return new Response(
            JSON.stringify({ 
              success: false, 
              message: 'For bulk_assign action: to_user_id and quantity > 0 are required' 
            }),
            { 
              status: 400, 
              headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
            }
          )
        }

        // Build query based on filters
        let bulkQuery = supabase
          .from('leads')
          .select('id')
          .is('buyer_user_id', null)
          .limit(payload.quantity)

        if (payload.filters?.project_id) {
          bulkQuery = bulkQuery.eq('project_id', payload.filters.project_id)
        }
        if (payload.filters?.platform) {
          bulkQuery = bulkQuery.eq('platform', payload.filters.platform)
        }
        if (payload.filters?.stage) {
          bulkQuery = bulkQuery.eq('stage', payload.filters.stage)
        }
        if (payload.filters?.created_after) {
          bulkQuery = bulkQuery.gte('created_at', payload.filters.created_after)
        }
        if (payload.filters?.created_before) {
          bulkQuery = bulkQuery.lte('created_at', payload.filters.created_before)
        }

        const { data: bulkLeads, error: bulkError } = await bulkQuery

        if (bulkError) {
          console.error('Failed to fetch leads for bulk assignment:', bulkError)
          return new Response(
            JSON.stringify({ 
              success: false, 
              message: 'Failed to fetch leads: ' + bulkError.message 
            }),
            { 
              status: 500, 
              headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
            }
          )
        }

        // Assign leads in batches
        if (bulkLeads && bulkLeads.length > 0) {
          const leadIds = bulkLeads.map(lead => lead.id)
          
          for (const leadId of leadIds) {
            try {
              const { error: assignError } = await supabase
                .rpc('rpc_reassign_lead', {
                  lead_id: leadId,
                  to_user_id: payload.to_user_id
                })

              if (!assignError) {
                leadsProcessed++
              } else {
                console.warn(`Failed to assign lead ${leadId}:`, assignError)
              }
            } catch (error) {
              console.warn(`Error assigning lead ${leadId}:`, error)
            }
          }
        }

        responseMessage = `Successfully assigned ${leadsProcessed} leads in bulk operation`
        break
      }

      case 'bulk_revoke': {
        // Bulk revoke leads based on filters
        if (!payload.from_user_id) {
          return new Response(
            JSON.stringify({ 
              success: false, 
              message: 'For bulk_revoke action: from_user_id is required' 
            }),
            { 
              status: 400, 
              headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
            }
          )
        }

        // Build query for bulk revoke
        let revokeQuery = supabase
          .from('leads')
          .update({ 
            buyer_user_id: null, 
            updated_at: new Date().toISOString() 
          })
          .eq('buyer_user_id', payload.from_user_id)

        if (payload.filters?.project_id) {
          revokeQuery = revokeQuery.eq('project_id', payload.filters.project_id)
        }
        if (payload.filters?.platform) {
          revokeQuery = revokeQuery.eq('platform', payload.filters.platform)
        }
        if (payload.filters?.stage) {
          revokeQuery = revokeQuery.eq('stage', payload.filters.stage)
        }

        const { data: revokedBulkLeads, error: bulkRevokeError } = await revokeQuery
          .select('id')

        if (bulkRevokeError) {
          console.error('Failed to bulk revoke leads:', bulkRevokeError)
          return new Response(
            JSON.stringify({ 
              success: false, 
              message: 'Failed to bulk revoke leads: ' + bulkRevokeError.message 
            }),
            { 
              status: 500, 
              headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
            }
          )
        }

        leadsProcessed = revokedBulkLeads?.length || 0
        responseMessage = `Successfully revoked ${leadsProcessed} leads from user`
        break
      }

      default:
        return new Response(
          JSON.stringify({ 
            success: false, 
            message: 'Invalid action. Must be one of: assign, revoke, bulk_assign, bulk_revoke' 
          }),
          { 
            status: 400, 
            headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
          }
        )
    }

    // Log the operation
    console.log('Lead assignment operation completed:', {
      action: payload.action,
      leads_processed: leadsProcessed,
      target_user: payload.to_user_id,
      source_user: payload.from_user_id
    })

    // Return success response
    const response: AssignLeadsResponse = {
      success: true,
      message: responseMessage,
      leads_processed: leadsProcessed,
      details: {
        action: payload.action,
        filters: payload.filters
      }
    }

    return new Response(
      JSON.stringify(response),
      { 
        status: 200, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )

  } catch (error) {
    console.error('Unexpected error in assign leads function:', error)
    
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
// curl -X POST "http://localhost:5433/functions/v1/assign_leads" \
//   -H "Content-Type: application/json" \
//   -d '{
//     "action": "bulk_assign",
//     "to_user_id": "user-uuid-here",
//     "quantity": 25,
//     "filters": {
//       "project_id": "project-uuid-here",
//       "platform": "Facebook"
//     }
//   }'
