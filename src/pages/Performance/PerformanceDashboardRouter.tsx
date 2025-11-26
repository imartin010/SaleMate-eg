import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useFranchise } from '../../contexts/FranchiseContext';

/**
 * Router component that redirects users to the appropriate dashboard
 * based on their role:
 * - CEO/Admin: CEO Dashboard (view all franchises)
 * - Franchise Employee: Their specific franchise dashboard
 */
const PerformanceDashboardRouter: React.FC = () => {
  const navigate = useNavigate();
  const { isCEO, isAdmin, isFranchiseEmployee, franchiseSlug, isLoading } = useFranchise();

  useEffect(() => {
    if (isLoading) return;

    // Redirect CEO and admin to CEO dashboard
    if (isCEO || isAdmin) {
      navigate('/dashboard', { replace: true });
      return;
    }

    // Redirect franchise employee to their franchise dashboard
    if (isFranchiseEmployee && franchiseSlug) {
      navigate(`/franchise/${franchiseSlug}`, { replace: true });
      return;
    }

    // If no role matched, redirect to login
    navigate('/auth/login', { replace: true });
  }, [isLoading, isCEO, isAdmin, isFranchiseEmployee, franchiseSlug, navigate]);

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-2 border-gray-300 border-t-blue-700 mx-auto"></div>
        <p className="mt-4 text-gray-600">Redirecting to your dashboard...</p>
      </div>
    </div>
  );
};

export default PerformanceDashboardRouter;
