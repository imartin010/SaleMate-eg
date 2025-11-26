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
    if (isLoading) {
      console.log('[DashboardRouter] Loading...');
      return;
    }

    console.log('[DashboardRouter] Role check:', { isCEO, isAdmin, isFranchiseEmployee, franchiseSlug });

    // Redirect CEO and admin to CEO dashboard
    if (isCEO || isAdmin) {
      console.log('[DashboardRouter] Redirecting CEO/Admin to /dashboard');
      navigate('/dashboard', { replace: true });
      return;
    }

    // Redirect franchise employee to their franchise dashboard
    if (isFranchiseEmployee && franchiseSlug) {
      console.log('[DashboardRouter] Redirecting franchise employee to:', `/franchise/${franchiseSlug}`);
      navigate(`/franchise/${franchiseSlug}`, { replace: true });
      return;
    }

    // If franchise employee but no slug found, show error
    if (isFranchiseEmployee && !franchiseSlug) {
      console.error('[DashboardRouter] Franchise employee has no franchise assigned');
      alert('Your account is not linked to a franchise. Please contact support.');
      navigate('/auth/login', { replace: true });
      return;
    }

    // If no role matched, redirect to login
    console.log('[DashboardRouter] No role matched, redirecting to login');
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
