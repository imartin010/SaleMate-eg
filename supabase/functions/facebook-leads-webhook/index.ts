// Supabase Edge Function: Facebook Leads Webhook
// Receives leads from Facebook Lead Ads and stores them in the database

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { crypto } from 'https://deno.land/std@0.168.0/crypto/mod.ts'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-hub-signature-256',
}

// Verify Facebook webhook signature
async function verifySignature(payload: string, signature: string, appSecret: string): Promise<boolean> {
  if (!signature || !signature.startsWith('sha256=')) {
    return false
  }

  const signatureHash = signature.replace('sha256=', '')
  const key = await crypto.subtle.importKey(
    'raw',
    new TextEncoder().encode(appSecret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign']
  )
  
  const expectedHash = await crypto.subtle.sign(
    'HMAC',
    key,
    new TextEncoder().encode(payload)
  )
  
  const expectedHashHex = Array.from(new Uint8Array(expectedHash))
    .map(b => b.toString(16).padStart(2, '0'))
    .join('')
  
  return signatureHash === expectedHashHex
}

// Extract project code from campaign name (format: "001-aliva Campaign Name")
function extractProjectCode(campaignName: string): string | null {
  const match = campaignName.match(/^(\d{3})-/)
  return match ? match[1] : null
}

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  // Handle Facebook verification (GET request)
  if (req.method === 'GET') {
    const url = new URL(req.url)
    const mode = url.searchParams.get('hub.mode')
    const token = url.searchParams.get('hub.verify_token')
    const challenge = url.searchParams.get('hub.challenge')

    // Get verify token from environment (must match Facebook webhook setting)
    const verifyToken = Deno.env.get('FACEBOOK_VERIFY_TOKEN')
    
    console.log('🔍 Verification attempt:', {
      mode,
      receivedToken: token ? token.substring(0, 10) + '...' : 'null',
      expectedToken: verifyToken ? verifyToken.substring(0, 10) + '...' : 'null',
      challenge: challenge ? 'present' : 'null'
    })

    if (!verifyToken) {
      console.error('❌ FACEBOOK_VERIFY_TOKEN not set in environment')
      return new Response('Verify token not configured', { status: 500 })
    }

    if (mode === 'subscribe' && token === verifyToken) {
      console.log('✅ Facebook webhook verified successfully')
      // Return challenge as plain text (no JSON headers)
      return new Response(challenge, { 
        status: 200,
        headers: { 'Content-Type': 'text/plain' }
      })
    }

    console.error('❌ Verification failed:', { mode, tokensMatch: token === verifyToken })
    return new Response('Forbidden', { status: 403 })
  }

  // Handle lead data (POST request)
  if (req.method === 'POST') {
    try {
      console.log('📨 Received POST request from Facebook webhook')
      const payload = await req.text()
      const signature = req.headers.get('x-hub-signature-256') || ''
      const appSecret = Deno.env.get('FACEBOOK_APP_SECRET') || ''

      // Verify signature (skip in development)
      if (appSecret && !await verifySignature(payload, signature, appSecret)) {
        console.error('❌ Invalid webhook signature')
        return new Response(
          JSON.stringify({ error: 'Invalid signature' }),
          { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }

      const data = JSON.parse(payload)
      console.log('📦 Webhook payload structure:', {
        hasEntries: !!(data.entry && data.entry.length > 0),
        entryCount: data.entry?.length || 0
      })

      // Create Supabase client with service role
      const supabaseAdmin = createClient(
        Deno.env.get('SUPABASE_URL') ?? '',
        Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
      )

      // Process each entry
      for (const entry of data.entry || []) {
        for (const change of entry.changes || []) {
          if (change.field === 'leadgen') {
            const leadgenId = change.value.leadgen_id
            const adId = change.value.ad_id
            const adName = change.value.ad_name || ''
            const formId = change.value.form_id

            // Extract project code from ad name
            const projectCode = extractProjectCode(adName)
            if (!projectCode) {
              console.error('❌ No project code found in ad name:', adName)
              continue
            }

            // Get project by code
            const { data: project, error: projectError } = await supabaseAdmin
              .from('projects')
              .select('id, name, price_per_lead')
              .eq('project_code', projectCode)
              .single()

            if (projectError || !project) {
              console.error('❌ Project not found for code:', projectCode, 'Error:', projectError)
              continue
            }

            console.log('📋 Processing lead:', {
              leadgenId,
              adName,
              projectCode,
              projectName: project.name
            })

            // Fetch lead data from Facebook Graph API
            const fbToken = Deno.env.get('FACEBOOK_ACCESS_TOKEN')
            
            if (!fbToken) {
              console.error('❌ FACEBOOK_ACCESS_TOKEN not set! Cannot fetch lead details.')
              // Continue with minimal data from webhook
            } else {
              try {
                const leadResponse = await fetch(
                  `https://graph.facebook.com/v18.0/${leadgenId}?access_token=${fbToken}`
                )
                
                if (!leadResponse.ok) {
                  const errorText = await leadResponse.text()
                  console.error('❌ Facebook Graph API error:', {
                    status: leadResponse.status,
                    statusText: leadResponse.statusText,
                    body: errorText
                  })
                } else {
                  const leadData = await leadResponse.json()
                  
                  if (leadData.error) {
                    console.error('❌ Facebook Graph API returned error:', leadData.error)
                  } else {
                    // Extract field data
                    const fieldData: Record<string, string> = {}
                    for (const field of leadData.field_data || []) {
                      fieldData[field.name] = field.values[0]
                    }

                    // Map fields to our schema
                    const clientName = fieldData.full_name || fieldData.name || 'Unknown'
                    const clientPhone = fieldData.phone_number || fieldData.phone || ''
                    const clientEmail = fieldData.email || ''
                    const jobTitle = fieldData.job_title || ''
                    const companyName = fieldData.company_name || fieldData.company || ''

                    console.log('📝 Extracted lead data:', {
                      clientName,
                      hasPhone: !!clientPhone,
                      hasEmail: !!clientEmail
                    })

                    // Insert lead
                    const { data: newLead, error: insertError } = await supabaseAdmin
                      .from('leads')
                      .insert({
                        project_id: project.id,
                        project_name: project.name, // Denormalized for performance
                        client_name: clientName,
                        client_phone: clientPhone,
                        client_email: clientEmail,
                        client_job_title: jobTitle,
                        company_name: companyName,
                        source: 'facebook',
                        platform: 'facebook',
                        stage: 'New Lead',
                        is_sold: false,
                        created_at: new Date().toISOString(),
                        updated_at: new Date().toISOString(),
                      })
                      .select()
                      .single()

                    if (insertError) {
                      console.error('❌ Failed to insert lead:', insertError)
                      continue
                    }

                    // Increment available leads count using RPC
                    const { error: updateError } = await supabaseAdmin.rpc('increment_available_leads', {
                      project_id: project.id,
                      increment_by: 1
                    })

                    if (updateError) {
                      // Fallback to direct update if RPC doesn't exist
                      console.warn('⚠️ RPC increment failed, using direct update:', updateError)
                      const { error: directUpdateError } = await supabaseAdmin
                        .from('projects')
                        .update({ 
                          available_leads: (project.available_leads || 0) + 1
                        })
                        .eq('id', project.id)
                      
                      if (directUpdateError) {
                        console.error('❌ Failed to increment available_leads:', directUpdateError)
                      }
                    }

                    // Log to audit
                    await supabaseAdmin
                      .from('audit_logs')
                      .insert({
                        actor_id: null, // System action
                        action: 'create',
                        entity: 'leads',
                        entity_id: newLead.id,
                        changes: {
                          source: 'facebook_webhook',
                          project: project.name,
                          ad_name: adName,
                        },
                      })

                    console.log('✅ Lead created:', newLead.id, 'for project:', project.name)
                  }
                }
              } catch (fetchError) {
                console.error('❌ Error fetching lead from Facebook Graph API:', fetchError)
                // Don't continue - we need lead data to create the record
                continue
              }
            }
          }
        }
      }

      return new Response(
        JSON.stringify({ success: true }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    } catch (error) {
      console.error('❌ Webhook error:', error)
      return new Response(
        JSON.stringify({ error: error.message }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }
  }

  return new Response('Method not allowed', { status: 405, headers: corsHeaders })
})

