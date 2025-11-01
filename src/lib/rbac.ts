import { UserRole } from '../types';
import { supabase } from './supabaseClient';

export const hasRole = (userRole: UserRole, allowedRoles: UserRole[]): boolean => {
  return allowedRoles.includes(userRole);
};

export const canAccessSupport = (userRole: UserRole): boolean => {
  // All authenticated users can access support to create tickets
  return hasRole(userRole, ['user', 'manager', 'support', 'admin']);
};

export const canAccessAdmin = (userRole: UserRole): boolean => {
  return hasRole(userRole, ['admin']);
};

export const canManageUsers = (userRole: UserRole): boolean => {
  return hasRole(userRole, ['admin', 'manager']);
};

export const canViewAllLeads = (userRole: UserRole): boolean => {
  return hasRole(userRole, ['admin', 'support']);
};

export const canEditAllLeads = (userRole: UserRole): boolean => {
  return hasRole(userRole, ['admin', 'support']);
};

/**
 * Check if a user can purchase leads for another user
 * @param purchaserRole The role of the user making the purchase
 * @param purchaserId The ID of the user making the purchase  
 * @param targetUserId The ID of the user receiving the leads
 * @returns Promise<boolean>
 */
export const canPurchaseFor = async (
  purchaserRole: UserRole,
  purchaserId: string,
  targetUserId: string
): Promise<boolean> => {
  // Admins can purchase for anyone
  if (purchaserRole === 'admin') {
    return true;
  }

  // Users can purchase for themselves
  if (purchaserId === targetUserId) {
    return true;
  }

  // Managers can purchase for their team
  if (purchaserRole === 'manager') {
    try {
      const { data } = await supabase.rpc('can_purchase_for', {
        purchaser_id: purchaserId,
        target_id: targetUserId,
      });
      return data === true;
    } catch (error) {
      console.error('Error checking purchase permission:', error);
      return false;
    }
  }

  // Support and regular users cannot purchase for others
  return false;
};

/**
 * Check if a user can view another user's data
 * @param viewerRole The role of the viewing user
 * @param viewerId The ID of the viewing user
 * @param targetUserId The ID of the user being viewed
 * @returns Promise<boolean>
 */
export const canViewUser = async (
  viewerRole: UserRole,
  viewerId: string,
  targetUserId: string
): Promise<boolean> => {
  // Admins and support can view everyone
  if (viewerRole === 'admin' || viewerRole === 'support') {
    return true;
  }

  // Users can view themselves
  if (viewerId === targetUserId) {
    return true;
  }

  // Managers can view their team
  if (viewerRole === 'manager') {
    try {
      const { data } = await supabase.rpc('can_user_view', {
        viewer_id: viewerId,
        target_id: targetUserId,
      });
      return data === true;
    } catch (error) {
      console.error('Error checking view permission:', error);
      return false;
    }
  }

  return false;
};

/**
 * Get all users in a manager's tree
 * @param managerId The manager's user ID
 * @returns Promise with array of user IDs
 */
export const getTeamUserIds = async (managerId: string): Promise<string[]> => {
  try {
    const { data, error } = await supabase.rpc('get_team_user_ids', {
      root_user_id: managerId,
    });

    if (error) {
      console.error('Error getting team user IDs:', error);
      return [];
    }

    return data || [];
  } catch (error) {
    console.error('Error getting team user IDs:', error);
    return [];
  }
};

/**
 * Get detailed user tree for a manager
 */
export const getUserTree = async (managerId: string) => {
  try {
    const { data, error } = await supabase.rpc('get_user_tree', {
      root_user_id: managerId,
    });

    if (error) {
      console.error('Error getting user tree:', error);
      return [];
    }

    return data || [];
  } catch (error) {
    console.error('Error getting user tree:', error);
    return [];
  }
};
