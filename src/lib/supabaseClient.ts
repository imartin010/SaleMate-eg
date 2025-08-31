import { createClient } from '@supabase/supabase-js'
import type { Database } from '../types/database'

// Environment variables (configured for your Supabase project)
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://wkxbhvckmgrmdkdkhnqo.supabase.co'
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6IndreGJodmNrbWdybWRrZGtobnFvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTY0OTgzNTQsImV4cCI6MjA3MjA3NDM1NH0.Vg48-ld0anvU4OQJWf5ZlEqTKjXiHBK0A14fz0vGvU8'

// Create Supabase client with TypeScript types - using new database types
export const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey, {
  auth: { 
    persistSession: true, 
    autoRefreshToken: true, 
    detectSessionInUrl: true 
  }
})

// OTP Functions
export async function sendOTP(phone: string): Promise<{ success: boolean; error?: string }> {
  try {
    const response = await fetch(`${supabaseUrl}/functions/v1/auth-otp/auth/request-otp`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${supabaseAnonKey}`,
      },
      body: JSON.stringify({ phone }),
    });

    const result = await response.json();
    return result;
  } catch (error) {
    console.error('Send OTP error:', error);
    return { success: false, error: 'Network error' };
  }
}

export async function verifyOTP(
  phone: string, 
  code: string, 
  email?: string, 
  name?: string
): Promise<{ success: boolean; error?: string; session?: any }> {
  try {
    const response = await fetch(`${supabaseUrl}/functions/v1/auth-otp/auth/verify-otp`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${supabaseAnonKey}`,
      },
      body: JSON.stringify({ phone, code, email, name }),
    });

    const result = await response.json();
    return result;
  } catch (error) {
    console.error('Verify OTP error:', error);
    return { success: false, error: 'Network error' };
  }
}

// Helper functions for common operations

/**
 * Start a new order for leads
 */
export async function startOrder(
  userId: string,
  projectId: string,
  quantity: number,
  paymentMethod: string
) {
  try {
    const { data, error } = await supabase.rpc('rpc_start_order', {
      user_id: userId,
      project_id: projectId,
      quantity,
      payment_method: paymentMethod
    })

    if (error) throw error
    return data
  } catch (error) {
    console.error('Error starting order:', error)
    throw error
  }
}

/**
 * Get lead statistics for a user
 */
export async function getLeadStats(userId: string) {
  try {
    const { data, error } = await supabase.rpc('rpc_leads_stats', {
      for_user: userId
    })

    if (error) throw error
    return data
  } catch (error) {
    console.error('Error getting lead stats:', error)
    throw error
  }
}

/**
 * Get team user IDs for a manager
 */
export async function getTeamUserIds(managerId: string) {
  try {
    const { data, error } = await supabase.rpc('rpc_team_user_ids', {
      manager_id: managerId
    })

    if (error) throw error
    return data
  } catch (error) {
    console.error('Error getting team user IDs:', error)
    throw error
  }
}

/**
 * Get user profile
 */
export async function getUserProfile(userId: string) {
  try {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single()

    if (error) throw error
    return data
  } catch (error) {
    console.error('Error getting user profile:', error)
    throw error
  }
}

/**
 * Get projects with available leads (for shop)
 */
export async function getProjects() {
  try {
    const { data, error } = await supabase.rpc('rpc_get_shop_projects')

    if (error) throw error
    return data || []
  } catch (error) {
    console.error('Error getting projects:', error)
    throw error
  }
}

/**
 * Get all projects (for admin/support - regardless of available leads)
 */
export async function getAllProjects() {
  try {
    const { data, error } = await supabase
      .from('projects')
      .select('*')
      .order('name')

    if (error) throw error
    return data
  } catch (error) {
    console.error('Error getting all projects:', error)
    throw error
  }
}

/**
 * Get user's leads
 */
export async function getUserLeads(userId: string) {
  try {
    const { data, error } = await supabase
      .from('leads')
      .select(`
        *,
        projects (
          id,
          name,
          developer,
          region
        )
      `)
      .eq('buyer_user_id', userId)
      .order('created_at', { ascending: false })

    if (error) throw error
    return data
  } catch (error) {
    console.error('Error getting user leads:', error)
    throw error
  }
}

/**
 * Update lead stage
 */
export async function updateLeadStage(leadId: string, stage: string, feedback?: string) {
  try {
    const updateData: any = { stage }
    if (feedback !== undefined) {
      updateData.feedback = feedback
    }

    const { data, error } = await supabase
      .from('leads')
      .update(updateData)
      .eq('id', leadId)
      .select()

    if (error) throw error
    return data
  } catch (error) {
    console.error('Error updating lead stage:', error)
    throw error
  }
}

/**
 * Get user's orders
 */
export async function getUserOrders(userId: string) {
  try {
    const { data, error } = await supabase
      .from('orders')
      .select(`
        *,
        projects (
          id,
          name,
          developer,
          region
        )
      `)
      .eq('user_id', userId)
      .order('created_at', { ascending: false })

    if (error) throw error
    return data
  } catch (error) {
    console.error('Error getting user orders:', error)
    throw error
  }
}

/**
 * Get support cases for a user
 */
export async function getUserSupportCases(userId: string) {
  try {
    const { data, error } = await supabase
      .from('support_cases')
      .select('*')
      .or(`created_by.eq.${userId},assigned_to.eq.${userId}`)
      .order('created_at', { ascending: false })

    if (error) throw error
    return data
  } catch (error) {
    console.error('Error getting support cases:', error)
    throw error
  }
}

/**
 * Create a support case
 */
export async function createSupportCase(
  createdBy: string,
  subject: string,
  description: string,
  priority: string = 'medium'
) {
  try {
    const { data, error } = await supabase
      .from('support_cases')
      .insert({
        created_by: createdBy,
        subject,
        description,
        priority
      })
      .select()

    if (error) throw error
    return data
  } catch (error) {
    console.error('Error creating support case:', error)
    throw error
  }
}

/**
 * Get partners
 */
export async function getPartners() {
  try {
    const { data, error } = await supabase
      .from('partners')
      .select('*')
      .eq('status', 'active')
      .order('name')

    if (error) throw error
    return data
  } catch (error) {
    console.error('Error getting partners:', error)
    throw error
  }
}

/**
 * Get community posts
 */
export async function getPosts() {
  try {
    const { data, error } = await supabase
      .from('posts')
      .select(`
        *,
        profiles!posts_author_id_fkey (
          id,
          name,
          role
        ),
        comments (
          id,
          content,
          created_at,
          profiles!comments_author_id_fkey (
            id,
            name,
            role
          )
        )
      `)
      .order('created_at', { ascending: false })

    if (error) throw error
    return data
  } catch (error) {
    console.error('Error getting posts:', error)
    throw error
  }
}

/**
 * Create a post
 */
export async function createPost(authorId: string, content: string) {
  try {
    const { data, error } = await supabase
      .from('posts')
      .insert({
        author_id: authorId,
        content
      })
      .select()

    if (error) throw error
    return data
  } catch (error) {
    console.error('Error creating post:', error)
    throw error
  }
}

/**
 * Add a comment to a post
 */
export async function addComment(postId: string, authorId: string, content: string) {
  try {
    const { data, error } = await supabase
      .from('comments')
      .insert({
        post_id: postId,
        author_id: authorId,
        content
      })
      .select()

    if (error) throw error
    return data
  } catch (error) {
    console.error('Error adding comment:', error)
    throw error
  }
}

/**
 * Get recent activity for a user
 */
export async function getUserActivity(userId: string) {
  try {
    const { data, error } = await supabase
      .from('recent_activity')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(20)

    if (error) throw error
    return data
  } catch (error) {
    console.error('Error getting user activity:', error)
    throw error
  }
}

/**
 * Get lead analytics for a user
 */
export async function getLeadAnalytics(userId: string) {
  try {
    const { data, error } = await supabase
      .from('lead_analytics_mv')
      .select('*')
      .eq('user_id', userId)
      .single()

    if (error) throw error
    return data
  } catch (error) {
    console.error('Error getting lead analytics:', error)
    throw error
  }
}

/**
 * Upload leads to a project (admin/support only)
 */
export async function uploadLeads(
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
    const { data, error } = await supabase.rpc('rpc_upload_leads', {
      project_id: projectId,
      leads_data: leadsData
    })

    if (error) throw error
    return data
  } catch (error) {
    console.error('Error uploading leads:', error)
    throw error
  }
}

/**
 * Update project available leads count (admin/support only)
 */
export async function updateProjectLeads(projectId: string, newAvailableLeads: number) {
  try {
    const { data, error } = await supabase.rpc('rpc_update_project_leads', {
      project_id: projectId,
      new_available_leads: newAvailableLeads
    })

    if (error) throw error
    return data
  } catch (error) {
    console.error('Error updating project leads:', error)
    throw error
  }
}

/**
 * Get project statistics
 */
export async function getProjectStats() {
  try {
    const { data, error } = await supabase.rpc('rpc_project_stats')

    if (error) throw error
    return data
  } catch (error) {
    console.error('Error getting project stats:', error)
    throw error
  }
}

/**
 * Update project CPL (Cost Per Lead) - admin/support only
 */
export async function updateProjectCPL(projectId: string, newPricePerLead: number) {
  try {
    const { data, error } = await supabase.rpc('rpc_update_project_cpl', {
      project_id: projectId,
      new_price_per_lead: newPricePerLead
    })

    if (error) throw error
    return data
  } catch (error) {
    console.error('Error updating project CPL:', error)
    throw error
  }
}

/**
 * Calculate order total based on current CPL
 */
export async function calculateOrderTotal(projectId: string, quantity: number) {
  try {
    const { data, error } = await supabase.rpc('rpc_calculate_order_total', {
      project_id: projectId,
      quantity: quantity
    })

    if (error) throw error
    return data
  } catch (error) {
    console.error('Error calculating order total:', error)
    throw error
  }
}

// Example usage in your React components:

/*
// In your Shop component
const handlePurchase = async (projectId: string, quantity: number) => {
  try {
    const user = useAuthStore.getState().user
    if (!user) throw new Error('User not authenticated')

    // Start the order
    const orderResult = await startOrder(user.id, projectId, quantity, 'Instapay')
    
    // Redirect to payment (mock implementation)
    const paymentUrl = `/payment?order_id=${orderResult.order_id}&amount=${orderResult.total_amount}`
    window.location.href = paymentUrl
    
  } catch (error) {
    console.error('Failed to start order:', error)
    // Handle error (show toast, etc.)
  }
}

// In your CRM component
const loadLeads = async () => {
  try {
    const user = useAuthStore.getState().user
    if (!user) return

    const leads = await getUserLeads(user.id)
    // Update your leads state
    setLeads(leads)
    
  } catch (error) {
    console.error('Failed to load leads:', error)
  }
}

// In your Dashboard component
const loadStats = async () => {
  try {
    const user = useAuthStore.getState().user
    if (!user) return

    const stats = await getLeadStats(user.id)
    // Update your stats state
    setStats(stats)
    
  } catch (error) {
    console.error('Failed to load stats:', error)
  }
}
*/

export default supabase
