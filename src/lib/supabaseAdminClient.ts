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
      .select('id, name, developer, region, available_leads, price_per_lead, description, created_at')
      .order('name')

    if (error) throw error
    return data
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
    const { data, error } = await supabaseAdmin.rpc('rpc_upload_leads', {
      project_id: projectId,
      leads_data: leadsData
    })

    if (error) throw error
    return data
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
