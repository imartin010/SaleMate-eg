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
  fallbackPath = '/app/dashboard' 
}) => {
  const { user, profile } = useAuthStore();

  // If no user, redirect to login
  if (!user) {
    return <Navigate to="/auth/login" replace />;
  }

  // Wait for profile to load
  if (!profile) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="text-gray-600 mt-4">Loading...</p>
        </div>
      </div>
    );
  }

  // Check if user has the required role
  const userRole = profile.role as UserRole;
  
  // Debug logging (remove in production)
  console.log('RoleGuard Check:', {
    userRole,
    allowedRoles,
    hasAccess: hasRole(userRole, allowedRoles)
  });

  if (!hasRole(userRole, allowedRoles)) {
    // Redirect to fallback path or show access denied
    console.warn(`Access denied: User role "${userRole}" not in allowed roles:`, allowedRoles);
    return <Navigate to={fallbackPath} replace />;
  }

  // User has required role, render children
  return <>{children}</>;
};