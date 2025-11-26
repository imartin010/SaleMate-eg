import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useFranchise } from '../../contexts/FranchiseContext';
import { Shield, AlertTriangle } from 'lucide-react';

interface PerformanceRoleGuardProps {
  children: React.ReactNode;
  allowedRoles?: Array<'user' | 'manager' | 'support' | 'admin' | 'ceo' | 'franchise_employee'>;
  requiresCEO?: boolean;
  requiresFranchiseOwner?: boolean;
  redirectTo?: string;
}

export const PerformanceRoleGuard: React.FC<PerformanceRoleGuardProps> = ({
  children,
  allowedRoles,
  requiresCEO = false,
  requiresFranchiseOwner = false,
  redirectTo = '/auth/login',
}) => {
  const navigate = useNavigate();
  const { userRole, isCEO, isAdmin, isFranchiseEmployee, franchiseSlug, isLoading } = useFranchise();

  useEffect(() => {
    if (isLoading) return;

    // Check if user has permission
    let hasPermission = true;

    if (requiresCEO && !isCEO && !isAdmin) {
      hasPermission = false;
    }

    if (requiresFranchiseOwner && !isFranchiseEmployee && !isCEO && !isAdmin) {
      hasPermission = false;
    }

    if (allowedRoles && userRole && !allowedRoles.includes(userRole)) {
      hasPermission = false;
    }

    if (!hasPermission) {
      console.warn('Access denied: User does not have required permissions');
      navigate(redirectTo);
    }
  }, [isLoading, userRole, isCEO, isAdmin, isFranchiseEmployee, requiresCEO, requiresFranchiseOwner, allowedRoles, navigate, redirectTo]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-2 border-gray-300 border-t-blue-700 mx-auto"></div>
          <p className="mt-4 text-gray-600">Verifying permissions...</p>
        </div>
      </div>
    );
  }

  // Check permissions before rendering
  let hasPermission = true;

  if (requiresCEO && !isCEO && !isAdmin) {
    hasPermission = false;
  }

  if (requiresFranchiseOwner && !isFranchiseEmployee && !isCEO && !isAdmin) {
    hasPermission = false;
  }

  if (allowedRoles && userRole && !allowedRoles.includes(userRole)) {
    hasPermission = false;
  }

  if (!hasPermission) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="max-w-md mx-auto text-center p-8">
          <div className="mb-6">
            <AlertTriangle className="w-16 h-16 text-red-500 mx-auto mb-4" />
            <h2 className="text-2xl font-semibold text-gray-900 mb-2">Access Denied</h2>
            <p className="text-gray-600">
              You don't have permission to access this page.
            </p>
          </div>
          <button
            onClick={() => navigate('/dashboard')}
            className="px-6 py-3 bg-blue-700 text-white rounded-lg hover:bg-blue-800 transition-colors font-medium"
          >
            Go to Dashboard
          </button>
        </div>
      </div>
    );
  }

  return <>{children}</>;
};

/**
 * Guard for franchise owner pages
 * Redirects franchise employees to their franchise if they try to access another
 */
interface FranchiseOwnerGuardProps {
  children: React.ReactNode;
}

export const FranchiseOwnerGuard: React.FC<FranchiseOwnerGuardProps> = ({
  children,
}) => {
  const navigate = useNavigate();
  const { isCEO, isAdmin, isFranchiseEmployee, franchiseSlug, isLoading } = useFranchise();

  useEffect(() => {
    if (isLoading) return;

    // CEO and admin can view any franchise
    if (isCEO || isAdmin) return;

    // Franchise employees must be viewing their own franchise
    if (isFranchiseEmployee && !franchiseSlug) {
      // Employee not linked to a franchise
      console.warn('Franchise employee not linked to any franchise');
      navigate('/auth/login');
      return;
    }

    // If not CEO/admin/franchise_employee, deny access
    if (!isCEO && !isAdmin && !isFranchiseEmployee) {
      navigate('/auth/login');
    }
  }, [isLoading, isCEO, isAdmin, isFranchiseEmployee, franchiseSlug, navigate]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-2 border-gray-300 border-t-blue-700 mx-auto"></div>
          <p className="mt-4 text-gray-600">Verifying access...</p>
        </div>
      </div>
    );
  }

  return <>{children}</>;
};
