import { UserRole } from '../types';

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
