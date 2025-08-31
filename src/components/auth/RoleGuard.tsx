import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuthStore } from '../../store/auth';
import { AlertCircle } from 'lucide-react';
import type { UserRole } from '../../types/database';

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
  const { user, profile, role } = useAuthStore();

  // If not authenticated, let AuthGuard handle it
  if (!user || !profile) {
    return <Navigate to="/auth/login" replace />;
  }

  // Check if user's role is allowed
  if (!allowedRoles.includes(role)) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-orange-50 via-red-50 to-pink-50 p-4">
        <div className="text-center max-w-md">
          <AlertCircle className="h-12 w-12 text-orange-500 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-gray-800 mb-2">Access Denied</h2>
          <p className="text-gray-600 mb-6">
            You don't have permission to access this page. 
            {allowedRoles.length === 1 
              ? ` This page requires ${allowedRoles[0]} role.`
              : ` This page requires one of: ${allowedRoles.join(', ')}.`
            }
          </p>
          <div className="space-y-2">
            <p className="text-sm text-gray-500">Your current role: <span className="font-medium">{role}</span></p>
            <a
              href={fallbackPath}
              className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              Go to Dashboard
            </a>
          </div>
        </div>
      </div>
    );
  }

  // User has required role - render children
  return <>{children}</>;
};
