import React from 'react';
import { UserRole } from '../../types';
import { useAuthStore } from '../../store/auth';
import { hasRole } from '../../lib/rbac';

interface RoleGuardProps {
  roles: UserRole[];
  children: React.ReactNode;
  fallback?: React.ReactNode;
}

export const RoleGuard: React.FC<RoleGuardProps> = ({ 
  roles, 
  children, 
  fallback = <div className="p-4 text-center text-muted-foreground">Access denied</div>
}) => {
  const { user } = useAuthStore();

  if (!user || !hasRole(user.role, roles)) {
    return <>{fallback}</>;
  }

  return <>{children}</>;
};
