import React from 'react';
import type { UserRole } from '../../types/database';

interface RoleGuardProps {
  allowedRoles: UserRole[];
  children: React.ReactNode;
  fallbackPath?: string;
}

export const RoleGuard: React.FC<RoleGuardProps> = ({ children }) => {
  // For now, allow all access - role system will be fully implemented later
  return <>{children}</>;
};