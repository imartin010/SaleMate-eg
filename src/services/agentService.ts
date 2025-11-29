/**
 * Agent Service
 * 
 * Service for managing agent hierarchy, manager assignments, and tree operations
 */

import { supabase } from '../lib/supabaseClient';

export interface AgentTreeNode {
  user_id: string;
  user_name: string;
  user_email: string;
  user_phone: string | null;
  user_role: string;
  manager_id: string | null;
  depth: number;
}

export interface ManagerChainNode {
  user_id: string;
  user_name: string;
  user_email: string;
  user_role: string;
  level: number;
}

export interface TeamTreeStats {
  total_users: number;
  direct_reports: number;
  owned_leads: number;
  assigned_leads: number;
  max_depth: number;
}

export interface AssignManagerResult {
  success: boolean;
  message?: string;
  tree_preserved?: boolean;
  direct_reports_count?: number;
  error?: string;
}

export interface BulkOperationResult {
  success: boolean;
  total: number;
  success_count: number;
  fail_count: number;
  errors: string[];
}

/**
 * Get full agent tree for a user (unlimited depth)
 */
export async function getAgentTree(userId: string): Promise<AgentTreeNode[]> {
  try {
    const { data, error } = await supabase.rpc('get_user_tree', {
      root_user_id: userId,
    });

    if (error) {
      console.error('Error getting agent tree:', error);
      throw new Error(error.message);
    }

    return (data || []) as AgentTreeNode[];
  } catch (error) {
    console.error('Error getting agent tree:', error);
    throw error;
  }
}

/**
 * Assign a manager to a user (admin only, moves tree if user is manager)
 */
export async function assignManager(
  userId: string,
  managerId: string,
  assignerId: string
): Promise<AssignManagerResult> {
  try {
    const { data, error } = await supabase.rpc('assign_manager', {
      p_user_id: userId,
      p_manager_id: managerId,
      p_assigner_id: assignerId,
    });

    if (error) {
      console.error('Error assigning manager:', error);
      return {
        success: false,
        error: error.message,
      };
    }

    return {
      success: true,
      message: data?.message || 'Manager assigned successfully',
      tree_preserved: data?.tree_preserved || false,
      direct_reports_count: data?.direct_reports_count || 0,
    };
  } catch (error) {
    console.error('Error assigning manager:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to assign manager',
    };
  }
}

/**
 * Bulk assign manager to multiple users
 */
export async function bulkAssignManager(
  userIds: string[],
  managerId: string,
  assignerId: string
): Promise<BulkOperationResult> {
  try {
    const { data, error } = await supabase.rpc('bulk_assign_manager', {
      p_user_ids: userIds,
      p_manager_id: managerId,
      p_assigner_id: assignerId,
    });

    if (error) {
      console.error('Error bulk assigning manager:', error);
      throw new Error(error.message);
    }

    return {
      success: true,
      total: data?.total || 0,
      success_count: data?.success_count || 0,
      fail_count: data?.fail_count || 0,
      errors: data?.errors || [],
    };
  } catch (error) {
    console.error('Error bulk assigning manager:', error);
    return {
      success: false,
      total: userIds.length,
      success_count: 0,
      fail_count: userIds.length,
      errors: [error instanceof Error ? error.message : 'Bulk assignment failed'],
    };
  }
}

/**
 * Bulk remove manager from multiple users
 */
export async function bulkRemoveManager(
  userIds: string[],
  assignerId: string
): Promise<{ success: boolean; updated_count: number; message?: string; error?: string }> {
  try {
    const { data, error } = await supabase.rpc('bulk_remove_manager', {
      p_user_ids: userIds,
      p_assigner_id: assignerId,
    });

    if (error) {
      console.error('Error bulk removing manager:', error);
      return {
        success: false,
        updated_count: 0,
        error: error.message,
      };
    }

    return {
      success: true,
      updated_count: data?.updated_count || 0,
      message: data?.message,
    };
  } catch (error) {
    console.error('Error bulk removing manager:', error);
    return {
      success: false,
      updated_count: 0,
      error: error instanceof Error ? error.message : 'Failed to remove managers',
    };
  }
}

/**
 * Move entire tree when manager is reassigned
 * This is handled automatically by assign_manager, but can be called explicitly
 */
export async function moveTree(
  managerId: string,
  newManagerId: string,
  assignerId: string
): Promise<AssignManagerResult> {
  // Moving a tree is done by reassigning the manager
  // The assign_manager function automatically handles tree movement
  return assignManager(managerId, newManagerId, assignerId);
}

/**
 * Get manager chain for a user (unlimited depth)
 */
export async function getManagerChain(userId: string): Promise<ManagerChainNode[]> {
  try {
    const { data, error } = await supabase.rpc('get_manager_chain', {
      p_user_id: userId,
    });

    if (error) {
      console.error('Error getting manager chain:', error);
      throw new Error(error.message);
    }

    return (data || []) as ManagerChainNode[];
  } catch (error) {
    console.error('Error getting manager chain:', error);
    throw error;
  }
}

/**
 * Get team tree statistics
 */
export async function getTeamTreeStats(managerId: string): Promise<TeamTreeStats> {
  try {
    const { data, error } = await supabase.rpc('get_team_tree_stats', {
      p_manager_id: managerId,
    });

    if (error) {
      console.error('Error getting team tree stats:', error);
      throw new Error(error.message);
    }

    return {
      total_users: data?.total_users || 0,
      direct_reports: data?.direct_reports || 0,
      owned_leads: data?.owned_leads || 0,
      assigned_leads: data?.assigned_leads || 0,
      max_depth: data?.max_depth || 0,
    };
  } catch (error) {
    console.error('Error getting team tree stats:', error);
    throw error;
  }
}

/**
 * Validate if a manager can be assigned to a user (prevents cycles)
 */
export async function canAssignManager(
  userId: string,
  managerId: string
): Promise<{ canAssign: boolean; reason?: string }> {
  try {
    // Get the user's current tree
    const userTree = await getAgentTree(userId);
    const userTreeIds = userTree.map((node) => node.user_id);

    // Check if manager is in user's tree (would create cycle)
    if (userTreeIds.includes(managerId)) {
      return {
        canAssign: false,
        reason: 'Cannot create circular hierarchy: manager is already in user tree',
      };
    }

    // Check if trying to assign self
    if (userId === managerId) {
      return {
        canAssign: false,
        reason: 'User cannot be their own manager',
      };
    }

    return { canAssign: true };
  } catch (error) {
    console.error('Error validating manager assignment:', error);
    return {
      canAssign: false,
      reason: error instanceof Error ? error.message : 'Validation failed',
    };
  }
}

