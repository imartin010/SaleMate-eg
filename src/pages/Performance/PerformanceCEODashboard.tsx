import React, { useState, useMemo, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { usePerformanceFranchises, usePerformanceAnalytics } from '../../hooks/performance/usePerformanceData';
import { Building2, TrendingUp, DollarSign, Users, BarChart3, Settings, Crown, LogOut } from 'lucide-react';
import { FranchiseComparison } from '../../components/performance/FranchiseComparison';
import { FranchiseAIAssistant } from '../../components/performance/FranchiseAIAssistant';
import { useFranchise } from '../../contexts/FranchiseContext';
import { useAuthStore } from '../../features/auth';

// Hook for animated counter effect
const useCounter = (target: number, duration: number = 2000) => {
  const [count, setCount] = useState(0);

  useEffect(() => {
    if (target === 0) {
      setCount(0);
      return;
    }

    let startTime: number | null = null;
    const startValue = 0;

    const animate = (currentTime: number) => {
      if (startTime === null) startTime = currentTime;
      const progress = Math.min((currentTime - startTime) / duration, 1);
      
      // Easing function for smooth animation
      const easeOutQuart = 1 - Math.pow(1 - progress, 4);
      const currentCount = Math.floor(startValue + (target - startValue) * easeOutQuart);
      
      setCount(currentCount);

      if (progress < 1) {
        requestAnimationFrame(animate);
      } else {
        setCount(target);
      }
    };

    requestAnimationFrame(animate);
  }, [target, duration]);

  return count;
};

// Component to display franchise card with analytics
const FranchiseCard: React.FC<{ franchise: any; onRevenueUpdate?: (franchiseId: string, revenue: number) => void }> = ({ franchise, onRevenueUpdate }) => {
  const { data: analytics } = usePerformanceAnalytics(franchise.id);
  
  React.useEffect(() => {
    if (analytics && onRevenueUpdate) {
      onRevenueUpdate(franchise.id, analytics.gross_revenue);
    }
  }, [analytics, franchise.id, onRevenueUpdate]);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-EG', {
      style: 'currency',
      currency: 'EGP',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  return (
    <a
      href={`/franchise/${franchise.slug}`}
      className="group block p-4 sm:p-6 bg-white rounded-lg border border-gray-200 hover:border-blue-500 hover:shadow-md transition-all duration-200 cursor-pointer"
    >
      <div className="flex items-start justify-between mb-3 sm:mb-4">
        <div className="flex-1 min-w-0">
          <h3 className="text-base sm:text-lg font-semibold text-gray-900 group-hover:text-blue-700 transition-colors truncate">
            {franchise.name}
          </h3>
          <div className="flex items-center space-x-2 mt-1 sm:mt-2">
            <Users className="w-3 h-3 sm:w-4 sm:h-4 text-blue-600 flex-shrink-0" />
            <p className="text-xs sm:text-sm text-gray-600">
              {franchise.headcount} {franchise.headcount === 1 ? 'agent' : 'agents'}
            </p>
          </div>
        </div>
        {franchise.is_active && (
          <span className="inline-flex items-center px-2 sm:px-2.5 py-0.5 sm:py-1 rounded text-xs font-medium bg-blue-50 text-blue-700 border border-blue-200 flex-shrink-0 ml-2">
            Active
          </span>
        )}
      </div>
      
      <div className={`space-y-2 sm:space-y-3 rounded-lg p-3 sm:p-4 mb-3 sm:mb-4 border-2 ${
        analytics && analytics.net_revenue >= 0 
          ? 'bg-gradient-to-br from-green-50 to-emerald-50 border-green-200' 
          : 'bg-gradient-to-br from-red-50 to-rose-50 border-red-200'
      }`}>
        <div className="flex justify-between items-center text-xs sm:text-sm">
          <span className="text-gray-700 font-medium">P&L Amount</span>
          <span className={`font-bold text-sm sm:text-base ${
            analytics && analytics.net_revenue >= 0 ? 'text-green-700' : 'text-red-600'
          }`}>
            {analytics ? formatCurrency(analytics.net_revenue) : 'Loading...'}
          </span>
        </div>
        <div className="flex justify-between items-center text-xs sm:text-sm">
          <span className="text-gray-700 font-medium">Performance/Agent</span>
          <span className="font-semibold text-gray-900 text-xs sm:text-sm">
            {analytics ? 
              formatCurrency(franchise.headcount > 0 ? analytics.total_sales_volume / franchise.headcount : 0) 
              : 'Loading...'}
          </span>
        </div>
      </div>
      
      <div className="flex items-center justify-between pt-2 border-t border-gray-100">
        <span className="text-xs sm:text-sm text-blue-700 font-medium">
          View Dashboard
        </span>
        <svg className="w-3 h-3 sm:w-4 sm:h-4 text-blue-600 group-hover:text-blue-700 transition-colors flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
      </div>
    </a>
  );
};

/**
 * CEO Dashboard - Overview of all franchises
 * Main entry point for Coldwell Banker CEO to monitor all franchise performance
 */
const PerformanceCEODashboard: React.FC = () => {
  const navigate = useNavigate();
  const user = useAuthStore((state) => state.user);
  const signOut = useAuthStore((state) => state.signOut);
  const { isCEO, isAdmin } = useFranchise();
  const { data: franchises, isLoading } = usePerformanceFranchises();
  const [showComparison, setShowComparison] = useState(false);
  const [franchiseRevenues, setFranchiseRevenues] = useState<Record<string, number>>({});
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  const handleLogout = async () => {
    try {
      setIsLoggingOut(true);
      await signOut();
      // signOut already handles redirect to '/'
    } catch (error) {
      console.error('Logout error:', error);
      setIsLoggingOut(false);
    }
  };

  // Calculate total revenue across all franchises
  const totalRevenue = useMemo(() => {
    return Object.values(franchiseRevenues).reduce((sum, revenue) => sum + revenue, 0);
  }, [franchiseRevenues]);

  // Memoize the callback to prevent infinite re-renders
  const handleRevenueUpdate = React.useCallback((franchiseId: string, revenue: number) => {
    setFranchiseRevenues(prev => ({
      ...prev,
      [franchiseId]: revenue
    }));
  }, []);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-EG', {
      style: 'currency',
      currency: 'EGP',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  // Calculate values for counter animation
  const totalFranchises = franchises?.length || 0;
  const activeFranchises = franchises?.filter(f => f.is_active).length || 0;
  const totalAgents = franchises?.reduce((sum, f) => sum + f.headcount, 0) || 0;

  // Animated counters
  const animatedTotalFranchises = useCounter(totalFranchises);
  const animatedActiveFranchises = useCounter(activeFranchises);
  const animatedTotalAgents = useCounter(totalAgents);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-2 border-gray-300 border-t-gray-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading franchises...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Professional Header - Mobile Responsive */}
      <div className="bg-white border-b border-gray-200 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-6">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="flex flex-col sm:flex-row items-start sm:items-center space-y-2 sm:space-y-0 sm:space-x-4 w-full sm:w-auto">
              <img 
                src="https://wkxbhvckmgrmdkdkhnqo.supabase.co/storage/v1/object/public/partners-logos/sale_mate_performance_logo.png"
                alt="SaleMate Performance Logo"
                className="h-8 sm:h-12 object-contain"
                style={{ width: 'auto', maxWidth: '100%', maxWidth: '300px' }}
                onError={(e) => {
                  const target = e.target as HTMLImageElement;
                  target.style.display = 'none';
                }}
              />
              <div className="hidden sm:block h-8 w-px bg-gray-300"></div>
              <div>
                <h1 className="text-lg sm:text-2xl font-semibold text-gray-900">
                  Franchise Management Dashboard
                </h1>
                <p className="text-xs sm:text-sm text-gray-600 mt-0.5">
                  Coldwell Banker Performance Analytics
              </p>
              </div>
            </div>
            <div className="flex items-center space-x-2 sm:space-x-3 w-full sm:w-auto justify-end">
              {isCEO && (
                <div className="flex items-center space-x-1 sm:space-x-2 px-2 sm:px-3 py-1.5 sm:py-2 bg-blue-50 rounded-lg border border-blue-200">
                  <Crown className="w-3 h-3 sm:w-4 sm:h-4 text-blue-700" />
                  <span className="text-xs sm:text-sm font-medium text-blue-700 hidden sm:inline">CEO View</span>
                </div>
              )}
              <button
                onClick={handleLogout}
                disabled={isLoggingOut}
                className="flex items-center space-x-1 sm:space-x-2 px-3 sm:px-4 py-1.5 sm:py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors text-xs sm:text-sm font-medium shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
                title="Logout"
              >
                <LogOut className="w-3 h-3 sm:w-4 sm:h-4" />
                <span className="hidden sm:inline">{isLoggingOut ? 'Logging out...' : 'Logout'}</span>
              </button>
              <div className="p-1.5 sm:p-2 bg-gray-50 rounded border border-gray-200">
                <img 
                  src="https://wkxbhvckmgrmdkdkhnqo.supabase.co/storage/v1/object/public/partners-logos/coldwell-banker-logo.png"
                  alt="Coldwell Banker"
                  className="w-8 h-8 sm:w-12 sm:h-12 object-contain"
                  onError={(e) => {
                    const target = e.target as HTMLImageElement;
                    target.style.display = 'none';
                  }}
                />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-8">
        {/* Professional Summary Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 mb-6 sm:mb-8">
          {/* Total Franchises */}
          <div className="bg-white rounded-lg border border-gray-200 shadow-sm hover:shadow-md hover:border-blue-300 transition-all duration-200 p-4 sm:p-6">
            <div className="flex items-center justify-between mb-3 sm:mb-4">
              <div className="p-2 bg-blue-50 rounded-lg">
                <Building2 className="w-4 h-4 sm:w-5 sm:h-5 text-blue-700" />
              </div>
            </div>
            <p className="text-gray-600 text-xs sm:text-sm font-medium mb-1">Total Franchises</p>
            <p className="text-2xl sm:text-3xl font-semibold text-blue-700">
              {animatedTotalFranchises}
            </p>
          </div>

          {/* Active Franchises */}
          <div className="bg-white rounded-lg border border-gray-200 shadow-sm hover:shadow-md hover:border-blue-300 transition-all duration-200 p-4 sm:p-6">
            <div className="flex items-center justify-between mb-3 sm:mb-4">
              <div className="p-2 bg-blue-50 rounded-lg">
                <TrendingUp className="w-4 h-4 sm:w-5 sm:h-5 text-blue-700" />
              </div>
              <span className="text-xs font-medium text-blue-700 bg-blue-50 px-2 py-1 rounded border border-blue-200">Active</span>
            </div>
            <p className="text-gray-600 text-xs sm:text-sm font-medium mb-1">Active Franchises</p>
            <p className="text-2xl sm:text-3xl font-semibold text-blue-700">
              {animatedActiveFranchises}
            </p>
          </div>

          {/* Total Headcount */}
          <div className="bg-white rounded-lg border border-gray-200 shadow-sm hover:shadow-md hover:border-blue-300 transition-all duration-200 p-4 sm:p-6">
            <div className="flex items-center justify-between mb-3 sm:mb-4">
              <div className="p-2 bg-blue-50 rounded-lg">
                <Users className="w-4 h-4 sm:w-5 sm:h-5 text-blue-700" />
              </div>
            </div>
            <p className="text-gray-600 text-xs sm:text-sm font-medium mb-1">Total Agents</p>
            <p className="text-2xl sm:text-3xl font-semibold text-blue-700">
              {animatedTotalAgents}
            </p>
          </div>

          {/* Revenue */}
          <div className="bg-white rounded-lg border border-gray-200 shadow-sm hover:shadow-md hover:border-blue-300 transition-all duration-200 p-4 sm:p-6">
            <div className="flex items-center justify-between mb-3 sm:mb-4">
              <div className="p-2 bg-blue-50 rounded-lg">
                <DollarSign className="w-4 h-4 sm:w-5 sm:h-5 text-blue-700" />
              </div>
              <span className="text-xs font-medium text-blue-700 bg-blue-50 px-2 py-1 rounded border border-blue-200">Live</span>
            </div>
            <p className="text-gray-600 text-xs sm:text-sm font-medium mb-1">Total Revenue</p>
            <p className="text-lg sm:text-xl font-semibold text-blue-700 break-words">
              {formatCurrency(totalRevenue)}
            </p>
          </div>
        </div>

        {/* Franchises Grid */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200">
          <div className="px-4 sm:px-6 py-3 sm:py-4 border-b border-gray-200 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
            <div>
              <h2 className="text-lg sm:text-xl font-semibold text-gray-900">All Franchises</h2>
              <p className="text-xs sm:text-sm text-gray-600 mt-0.5">
                Click on a franchise to view detailed performance
              </p>
            </div>
            {franchises && franchises.length > 1 && (
              <button
                onClick={() => setShowComparison(true)}
                className="flex items-center space-x-2 px-3 sm:px-4 py-1.5 sm:py-2 bg-blue-700 text-white rounded-lg hover:bg-blue-800 transition-colors text-xs sm:text-sm font-medium w-full sm:w-auto justify-center"
              >
                <BarChart3 className="w-3 h-3 sm:w-4 sm:h-4" />
                <span>Compare Franchises</span>
              </button>
            )}
          </div>
          
          <div className="p-4 sm:p-6">
            {!franchises || franchises.length === 0 ? (
              <div className="text-center py-8 sm:py-12">
                <Building2 className="w-12 h-12 sm:w-16 sm:h-16 text-gray-300 mx-auto mb-3 sm:mb-4" />
                <p className="text-sm sm:text-base text-gray-500">No franchises found</p>
                <p className="text-xs sm:text-sm text-gray-400 mt-2">
                  Run the seed migration to add Coldwell Banker franchises
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
                {franchises.map((franchise) => (
                  <FranchiseCard 
                    key={franchise.id} 
                    franchise={franchise}
                    onRevenueUpdate={handleRevenueUpdate}
                  />
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Admin Panel Button */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-4 sm:pb-8">
        <button
          onClick={() => navigate('/admin')}
          className="w-full flex items-center justify-center space-x-2 px-4 sm:px-6 py-2.5 sm:py-3 bg-blue-700 text-white rounded-lg hover:bg-blue-800 transition-colors text-sm sm:text-base font-medium"
        >
          <Settings className="w-4 h-4" />
          <span>Admin Panel</span>
        </button>
      </div>

      {/* Franchise Comparison Modal */}
      {showComparison && franchises && (
        <FranchiseComparison
          franchises={franchises}
          onClose={() => setShowComparison(false)}
        />
      )}

      {/* AI Assistant - Floating Chatbot */}
      <FranchiseAIAssistant />
    </div>
  );
};

export default PerformanceCEODashboard;

