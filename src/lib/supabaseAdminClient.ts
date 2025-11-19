/**
 * @deprecated
 * This file is deprecated. Please import from '@/core/api/admin-client' instead.
 * This re-export will be removed in a future version.
 */

import { supabaseAdmin } from '../core/api/admin-client';

if (import.meta.env.DEV) {
  console.warn(
    '⚠️ DEPRECATED: Importing from src/lib/supabaseAdminClient.ts is deprecated.\n' +
    'Please update your imports to use:\n' +
    "import { supabaseAdmin } from '@/core/api/admin-client';"
  );
}

// Re-export admin client
export { supabaseAdmin };

/**
 * Get all projects (admin function - bypasses RLS)
 */
export const getAllProjectsAdmin = async () => {
  try {
    console.log('🔍 Loading projects from database...');
    
    // First try with the complex query
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
          developer:entities!projects_developer_id_fkey ( name )
        `)
        .order('name')

      if (error) {
        console.log('⚠️ Complex query failed, trying simple query:', error);
        throw error;
      }

      // Map developer relation to flat string expected by UI
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const mapped = (data || []).map((p: any) => {
        // Handle case where name might be an object like {'id': 948, 'name': 'Jazebeya'}
        let projectName = p.name;
        if (typeof p.name === 'object' && p.name !== null && p.name.name) {
          projectName = p.name.name;
          console.log('🔄 Extracted name from object:', p.name, '→', projectName);
        }
        
        return {
          id: p.id,
          name: projectName,
          region: p.region,
          available_leads: p.available_leads ?? 0,
          price_per_lead: p.price_per_lead ?? null,
          description: p.description ?? null,
          created_at: p.created_at,
          developer: p?.developer?.name ?? 'Unknown'
        };
      })

      console.log('✅ Projects loaded successfully:', mapped.length);
      return mapped;
      
    } catch (complexError) {
      console.log('🔄 Falling back to simple query...');
      
      // Fallback: simple query without relations
      const { data, error } = await supabaseAdmin
        .from('projects')
        .select('id, name, region, available_leads, price_per_lead, description, created_at')
        .order('name')

      if (error) {
        console.error('❌ Simple query also failed:', error);
        throw error;
      }

      // Map to expected format without developer relation
      const mapped = (data || []).map((p: any) => {
        // Handle case where name might be an object like {'id': 948, 'name': 'Jazebeya'}
        let projectName = p.name;
        if (typeof p.name === 'object' && p.name !== null && p.name.name) {
          projectName = p.name.name;
          console.log('🔄 Extracted name from object (fallback):', p.name, '→', projectName);
        }
        
        return {
          id: p.id,
          name: projectName,
          region: p.region,
          available_leads: p.available_leads ?? 0,
          price_per_lead: p.price_per_lead ?? null,
          description: p.description ?? null,
          created_at: p.created_at,
          developer: 'Unknown' // Default value when developer relation fails
        };
      })

      console.log('✅ Projects loaded with fallback:', mapped.length);
      return mapped;
    }
    
  } catch (error) {
    console.error('💥 Error getting all projects (admin):', error);
    
    // Return empty array instead of throwing to prevent app crash
    console.log('🔄 Returning empty projects array to prevent crash');
    return [];
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
    console.log('🔍 Starting lead upload...', { projectId, leadCount: leadsData.length });
    
    // Validate project exists first
    const { data: projectCheck, error: projectError } = await supabaseAdmin
      .from('projects')
      .select('id, name')
      .eq('id', projectId)
      .single();
    
    if (projectError || !projectCheck) {
      throw new Error(`Project not found: ${projectId}`);
    }
    
    console.log('✅ Project found:', projectCheck.name);

    // Try RPC first if it exists
    try {
      console.log('🔄 Trying RPC function...');
      // Transform platform to source for RPC call
      const transformedLeadsData = leadsData.map(ld => ({
        ...ld,
        source: ld.platform || 'Other'
      }));
      
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data, error } = await (supabaseAdmin as any).rpc('rpc_upload_leads', {
        project_id: projectId,
        leads_data: transformedLeadsData
      });
      
      if (!error) {
        console.log('✅ RPC upload successful:', data);
        return data;
      } else {
        console.log('⚠️ RPC failed, falling back to direct insert:', error);
      }
    } catch (rpcError) {
      console.log('⚠️ RPC function not available, using direct insert:', rpcError);
    }

    // Fallback: direct insert into leads table
    console.log('🔄 Using direct insert method...');
    
    // Generate a unique batch_id for this upload
    const batchId = `batch_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    const rows = leadsData.map(ld => ({
      project_id: projectId,
      client_name: ld.client_name?.trim() || 'Unknown',
      client_phone: ld.client_phone?.trim() || '',
      client_phone2: ld.client_phone2?.trim() || null,
      client_phone3: ld.client_phone3?.trim() || null,
      client_email: ld.client_email?.trim() || null,
      client_job_title: ld.client_job_title?.trim() || null,
      source: ld.platform || 'Other', // Changed from 'platform' to 'source'
      stage: ld.stage || 'New Lead',
      batch_id: batchId,
    }));

    console.log('📝 Prepared rows for insert:', rows.length);

    const { data, error } = await supabaseAdmin
      .from('leads')
      .insert(rows as any) // eslint-disable-line @typescript-eslint/no-explicit-any
      .select('id');

    if (error) {
      console.error('❌ Direct insert failed:', error);
      throw new Error(`Database insert failed: ${error.message}`);
    }

    console.log('✅ Direct insert successful:', data?.length, 'leads inserted');
    return { success: true, inserted: data?.length || 0, message: 'Leads uploaded successfully' };
    
  } catch (error) {
    console.error('💥 Error uploading leads (admin):', error);
    
    // Return more detailed error information
    if (error instanceof Error) {
      throw new Error(`Lead upload failed: ${error.message}`);
    } else {
      throw new Error('Lead upload failed: Unknown error occurred');
    }
  }
}

/**
 * Get project statistics (admin function)
 */
export async function getProjectStatsAdmin() {
  try {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data, error } = await (supabaseAdmin as any).rpc('rpc_project_stats')

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
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data, error } = await (supabaseAdmin as any).rpc('rpc_update_project_cpl', {
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
