import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface LeadRow {
  client_name: string;
  client_phone: string;
  client_phone2?: string;
  client_phone3?: string;
  client_email?: string;
  client_job_title?: string;
  platform?: string;
  stage?: string;
  feedback?: string;
  source?: string;
}

interface UploadRequest {
  project_id: string;
  cpl_price: number;
  batch_name: string;
  csv_data: string;
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

    // Check if user has permission to upload leads (admin or manager)
    const { data: profile } = await supabaseClient
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single()

    if (!profile || !['admin', 'manager'].includes(profile.role)) {
      return new Response(
        JSON.stringify({ error: 'Insufficient permissions' }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const { project_id, cpl_price, batch_name, csv_data }: UploadRequest = await req.json()

    // Validate input
    if (!project_id || !cpl_price || !batch_name || !csv_data) {
      return new Response(
        JSON.stringify({ error: 'Missing required fields' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Verify project exists
    const { data: project, error: projectError } = await supabaseClient
      .from('projects')
      .select('id')
      .eq('id', project_id)
      .single()

    if (projectError || !project) {
      return new Response(
        JSON.stringify({ error: 'Project not found' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Create batch record
    const { data: batch, error: batchError } = await supabaseClient
      .from('lead_batches')
      .insert({
        project_id,
        upload_user_id: user.id,
        batch_name,
        cpl_price,
        status: 'processing'
      })
      .select()
      .single()

    if (batchError) {
      return new Response(
        JSON.stringify({ error: 'Failed to create batch' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Parse CSV data
    const lines = csv_data.trim().split('\n')
    const headers = lines[0].split(',').map(h => h.trim().toLowerCase())
    
    // Map CSV headers to database columns
    const headerMap: { [key: string]: string } = {
      'name': 'client_name',
      'client_name': 'client_name',
      'phone': 'client_phone',
      'client_phone': 'client_phone',
      'phone1': 'client_phone',
      'phone2': 'client_phone2',
      'phone3': 'client_phone3',
      'email': 'client_email',
      'client_email': 'client_email',
      'job_title': 'client_job_title',
      'client_job_title': 'client_job_title',
      'platform': 'platform',
      'stage': 'stage',
      'feedback': 'feedback',
      'source': 'source'
    }

    const leads: LeadRow[] = []
    const errors: string[] = []
    let successCount = 0
    let failedCount = 0

    // Process each row
    for (let i = 1; i < lines.length; i++) {
      const values = lines[i].split(',').map(v => v.trim())
      const leadData: any = {}
      
      // Map values to lead fields
      headers.forEach((header, index) => {
        const dbColumn = headerMap[header]
        if (dbColumn && values[index]) {
          leadData[dbColumn] = values[index]
        }
      })

      // Validate required fields
      if (!leadData.client_name || !leadData.client_phone) {
        errors.push(`Row ${i + 1}: Missing required fields (name or phone)`)
        failedCount++
        continue
      }

      // Set defaults
      leadData.platform = leadData.platform || 'Other'
      leadData.stage = leadData.stage || 'New Lead'
      leadData.source = leadData.source || 'Bulk Upload'

      leads.push(leadData)
      successCount++
    }

    // Insert leads in batches
    const batchSize = 100
    const insertedLeads: any[] = []

    for (let i = 0; i < leads.length; i += batchSize) {
      const batch_leads = leads.slice(i, i + batchSize).map(lead => ({
        ...lead,
        project_id,
        batch_id: batch.id,
        upload_user_id: user.id,
        cpl_price,
        created_at: new Date().toISOString()
      }))

      const { data: insertedBatch, error: insertError } = await supabaseClient
        .from('leads')
        .insert(batch_leads)
        .select('id')

      if (insertError) {
        console.error('Insert error:', insertError)
        failedCount += batch_leads.length
        errors.push(`Batch ${Math.floor(i/batchSize) + 1}: ${insertError.message}`)
      } else {
        insertedLeads.push(...(insertedBatch || []))
      }
    }

    // Update batch status
    const finalStatus = failedCount === 0 ? 'completed' : (successCount === 0 ? 'failed' : 'completed')
    await supabaseClient
      .from('lead_batches')
      .update({
        total_leads: leads.length + failedCount,
        successful_leads: insertedLeads.length,
        failed_leads: failedCount,
        status: finalStatus,
        error_details: errors.length > 0 ? { errors } : null,
        updated_at: new Date().toISOString()
      })
      .eq('id', batch.id)

    // Update project available leads count
    if (insertedLeads.length > 0) {
      await supabaseClient.rpc('increment', {
        table_name: 'projects',
        row_id: project_id,
        column_name: 'available_leads',
        x: insertedLeads.length
      })
    }

    return new Response(
      JSON.stringify({
        success: true,
        batch_id: batch.id,
        total_processed: leads.length + failedCount,
        successful: insertedLeads.length,
        failed: failedCount,
        errors: errors.length > 0 ? errors : null,
        message: `Successfully uploaded ${insertedLeads.length} leads${failedCount > 0 ? ` (${failedCount} failed)` : ''}`
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
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
