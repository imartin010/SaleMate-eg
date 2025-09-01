import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuthStore } from '../../store/auth';
import { hasRole } from '../../lib/rbac';
import type { UserRole } from '../../types';

interface RoleGuardProps {
  allowedRoles: UserRole[];
  children: React.ReactNode;
  fallbackPath?: string;
}

export const RoleGuard: React.FC<RoleGuardProps> = ({ 
  allowedRoles, 
  children, 
  fallbackPath = '/dashboard' 
}) => {
  const { user, profile } = useAuthStore();

  // If no user, redirect to login
  if (!user) {
    return <Navigate to="/auth/login" replace />;
  }

  // Check if user has the required role
  const userRole = profile?.role || 'user';
  if (!hasRole(userRole, allowedRoles)) {
    // Redirect to fallback path or show access denied
    return <Navigate to={fallbackPath} replace />;
  }

  // User has required role, render children
  return <>{children}</>;
};