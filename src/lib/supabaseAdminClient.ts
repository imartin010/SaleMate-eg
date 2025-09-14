import { createClient } from '@supabase/supabase-js'
import type { Database } from '../../supabase/types/database.types'

// Admin client with service role key for admin operations
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://wkxbhvckmgrmdkdkhnqo.supabase.co'
const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6IndreGJodmNrbWdybWRrZGtobnFvIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NjQ5ODM1NCwiZXhwIjoyMDcyMDc0MzU0fQ.8GPIkvdBEyuYAjqi_GpByGcDfmESXOBCn4M-XAaaNUg'

// Create admin client that bypasses RLS for admin operations
export const supabaseAdmin = createClient<Database>(supabaseUrl, supabaseServiceKey)

/**
 * Get all projects (admin function - bypasses RLS)
 */
export async function getAllProjectsAdmin() {
  try {
    const { data, error } = await supabaseAdmin
      .from('projects')
      .select(`
        id,
        name,
        region,
        available_leads,
        price_per_lead,
        description,
        created_at,
        developers:developers ( name )
      `)
      .order('name')

    if (error) throw error

    // Map developer relation to flat string expected by UI
    const mapped = (data || []).map((p: any) => ({
      id: p.id,
      name: p.name,
      region: p.region,
      available_leads: p.available_leads ?? 0,
      price_per_lead: p.price_per_lead ?? null,
      description: p.description ?? null,
      created_at: p.created_at,
      developer: p?.developers?.name ?? 'Unknown'
    }))

    return mapped
  } catch (error) {
    console.error('Error getting all projects (admin):', error)
    throw error
  }
}

/**
 * Upload leads (admin function)
 */
export async function uploadLeadsAdmin(
  projectId: string,
  leadsData: Array<{
    client_name: string
    client_phone: string
    client_phone2?: string
    client_phone3?: string
    client_email?: string
    client_job_title?: string
    platform: string
    stage?: string
  }>
) {
  try {
    // Try RPC first if it exists
    try {
      const { data, error } = await supabaseAdmin.rpc('rpc_upload_leads', {
        project_id: projectId,
        leads_data: leadsData
      })
      if (!error) return data
    } catch (_rpcErr) {
      // fall through to direct insert
    }

    // Fallback: direct insert into leads table using backend column names
    const rows = leadsData.map(ld => ({
      project_id: projectId,
      client_name: ld.client_name,
      client_phone: ld.client_phone,
      client_phone2: ld.client_phone2 ?? null,
      client_phone3: ld.client_phone3 ?? null,
      client_email: ld.client_email ?? null,
      client_job_title: ld.client_job_title ?? null,
      source: ld.platform ?? 'Other',
      stage: ld.stage ?? 'New Lead',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    }))

    const { data, error } = await supabaseAdmin
      .from('leads')
      .insert(rows)
      .select('id')

    if (error) throw error
    return { success: true, inserted: data?.length || 0 }
  } catch (error) {
    console.error('Error uploading leads (admin):', error)
    throw error
  }
}

/**
 * Get project statistics (admin function)
 */
export async function getProjectStatsAdmin() {
  try {
    const { data, error } = await supabaseAdmin.rpc('rpc_project_stats')

    if (error) throw error
    return data
  } catch (error) {
    console.error('Error getting project stats (admin):', error)
    throw error
  }
}

/**
 * Update project CPL (admin function)
 */
export async function updateProjectCPLAdmin(projectId: string, newPricePerLead: number) {
  try {
    const { data, error } = await supabaseAdmin.rpc('rpc_update_project_cpl', {
      project_id: projectId,
      new_price_per_lead: newPricePerLead
    })

    if (error) throw error
    return data
  } catch (error) {
    console.error('Error updating project CPL (admin):', error)
    throw error
  }
}
