import React, { useState, useMemo, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { usePerformanceFranchises, usePerformanceAnalytics } from '../../hooks/performance/usePerformanceData';
import { Building2, TrendingUp, DollarSign, Users, BarChart3, Settings } from 'lucide-react';
import { FranchiseComparison } from '../../components/performance/FranchiseComparison';

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
      className="group block p-6 bg-white rounded-3xl border-2 border-gray-200 hover:border-blue-400 hover:shadow-2xl transition-all duration-300 hover:scale-105 cursor-pointer"
    >
      <div className="flex items-start justify-between mb-4">
        <div>
          <h3 className="text-xl font-bold text-gray-900 group-hover:text-blue-600 transition-colors">
            {franchise.name}
          </h3>
          <div className="flex items-center space-x-2 mt-2">
            <Users className="w-4 h-4 text-gray-400" />
            <p className="text-sm text-gray-600 font-medium">
              {franchise.headcount} {franchise.headcount === 1 ? 'agent' : 'agents'}
            </p>
          </div>
        </div>
        {franchise.is_active && (
          <span className="inline-flex items-center px-3 py-1.5 rounded-2xl text-xs font-semibold bg-emerald-100 text-emerald-700">
            ● Active
          </span>
        )}
      </div>
      
      <div className="space-y-3 bg-gradient-to-br from-gray-50 to-slate-50 rounded-2xl p-4 mb-4">
        <div className="flex justify-between text-sm">
          <span className="text-gray-600">P&L Amount</span>
          <span className={`font-bold text-base ${
            analytics && analytics.net_revenue >= 0 ? 'text-green-700' : 'text-red-700'
          }`}>
            {analytics ? formatCurrency(analytics.net_revenue) : 'Loading...'}
          </span>
        </div>
        <div className="flex justify-between text-sm">
          <span className="text-gray-600">Performance/Agent</span>
          <span className="font-bold text-gray-900">
            {analytics ? 
              formatCurrency(franchise.headcount > 0 ? analytics.total_sales_volume / franchise.headcount : 0) 
              : 'Loading...'}
          </span>
        </div>
      </div>
      
      <div className="flex items-center justify-between">
        <span className="text-sm text-blue-600 font-semibold group-hover:text-blue-700">
          View Dashboard
        </span>
        <div className="p-2 bg-blue-50 rounded-xl group-hover:bg-blue-100 transition-colors">
          <svg className="w-4 h-4 text-blue-600 transform group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        </div>
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
  const { data: franchises, isLoading } = usePerformanceFranchises();
  const [showComparison, setShowComparison] = useState(false);
  const [franchiseRevenues, setFranchiseRevenues] = useState<Record<string, number>>({});

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
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading franchises...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
      {/* Modern Header with Gradient */}
      <div className="bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 shadow-xl">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
          <div className="flex items-center justify-between">
            <div className="flex flex-col items-start">
              <img 
                src="https://wkxbhvckmgrmdkdkhnqo.supabase.co/storage/v1/object/public/partners-logos/sale_mate_performance_logo_white.png"
                alt="SaleMate Performance Logo"
                className="h-20 object-contain mb-4"
                style={{ width: 'auto', maxWidth: '600px' }}
                onError={(e) => {
                  const target = e.target as HTMLImageElement;
                  target.style.display = 'none';
                }}
              />
              <p className="text-xl text-blue-100 font-medium">
                Coldwell Banker Franchise Management Dashboard
              </p>
            </div>
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-white rounded-3xl border border-white/20 shadow-lg">
                <img 
                  src="https://wkxbhvckmgrmdkdkhnqo.supabase.co/storage/v1/object/public/partners-logos/coldwell-banker-logo.png"
                  alt="Coldwell Banker"
                  className="w-20 h-20 object-contain"
                  onError={(e) => {
                    const target = e.target as HTMLImageElement;
                    target.style.display = 'none';
                    // Fallback to Building icon if logo fails to load
                    const fallback = document.createElement('div');
                    fallback.innerHTML = '<svg class="w-12 h-12 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"></path></svg>';
                    target.parentNode?.appendChild(fallback);
                  }}
                />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Modern Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {/* Total Franchises */}
          <div className="group relative bg-gradient-to-br from-blue-500 to-indigo-600 rounded-3xl shadow-xl hover:shadow-2xl transition-all duration-300 hover:scale-105 overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -mr-16 -mt-16"></div>
            <div className="relative p-6">
              <div className="flex items-start justify-between mb-4">
                <div className="p-3 bg-white/20 backdrop-blur-sm rounded-2xl">
                  <Building2 className="w-6 h-6 text-white" />
                </div>
              </div>
              <p className="text-blue-100 text-sm font-medium mb-1">Total Franchises</p>
              <p className="text-4xl font-bold text-white tracking-tight">
                {animatedTotalFranchises}
              </p>
            </div>
          </div>

          {/* Active Franchises */}
          <div className="group relative bg-gradient-to-br from-emerald-500 to-green-600 rounded-3xl shadow-xl hover:shadow-2xl transition-all duration-300 hover:scale-105 overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -mr-16 -mt-16"></div>
            <div className="relative p-6">
              <div className="flex items-start justify-between mb-4">
                <div className="p-3 bg-white/20 backdrop-blur-sm rounded-2xl">
                  <TrendingUp className="w-6 h-6 text-white" />
                </div>
                <span className="text-xs font-semibold text-white/80 bg-white/20 px-3 py-1 rounded-2xl">Live</span>
              </div>
              <p className="text-emerald-100 text-sm font-medium mb-1">Active Franchises</p>
              <p className="text-4xl font-bold text-white tracking-tight">
                {animatedActiveFranchises}
              </p>
            </div>
          </div>

          {/* Total Headcount */}
          <div className="group relative bg-gradient-to-br from-purple-500 to-violet-600 rounded-3xl shadow-xl hover:shadow-2xl transition-all duration-300 hover:scale-105 overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -mr-16 -mt-16"></div>
            <div className="relative p-6">
              <div className="flex items-start justify-between mb-4">
                <div className="p-3 bg-white/20 backdrop-blur-sm rounded-2xl">
                  <Users className="w-6 h-6 text-white" />
                </div>
              </div>
              <p className="text-purple-100 text-sm font-medium mb-1">Total Agents</p>
              <p className="text-4xl font-bold text-white tracking-tight">
                {animatedTotalAgents}
              </p>
            </div>
          </div>

          {/* Revenue */}
          <div className="group relative bg-gradient-to-br from-amber-500 to-orange-600 rounded-3xl shadow-xl hover:shadow-2xl transition-all duration-300 hover:scale-105 overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -mr-16 -mt-16"></div>
            <div className="relative p-6">
              <div className="flex items-start justify-between mb-4">
                <div className="p-3 bg-white/20 backdrop-blur-sm rounded-2xl">
                  <DollarSign className="w-6 h-6 text-white" />
                </div>
                <span className="text-xs font-semibold text-white/80 bg-white/20 px-3 py-1 rounded-2xl">Live</span>
              </div>
              <p className="text-amber-100 text-sm font-medium mb-1">Total Revenue</p>
              <p className="text-2xl sm:text-3xl font-bold text-white tracking-tight break-words">
                {formatCurrency(totalRevenue)}
              </p>
            </div>
          </div>
        </div>

        {/* Franchises Grid */}
        <div className="bg-white/90 backdrop-blur-sm rounded-3xl shadow-xl border border-gray-100">
          <div className="px-8 py-6 border-b border-gray-100 flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold text-gray-900">All Franchises</h2>
              <p className="text-sm text-gray-500 mt-1">
                Click on a franchise to view detailed performance
              </p>
            </div>
            {franchises && franchises.length > 1 && (
              <button
                onClick={() => setShowComparison(true)}
                className="flex items-center space-x-2 px-6 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-2xl hover:from-blue-700 hover:to-indigo-700 shadow-lg shadow-blue-500/30 hover:shadow-xl hover:scale-105 transition-all"
              >
                <BarChart3 className="w-5 h-5" />
                <span className="font-semibold">Compare Franchises</span>
              </button>
            )}
          </div>
          
          <div className="p-6">
            {!franchises || franchises.length === 0 ? (
              <div className="text-center py-12">
                <Building2 className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                <p className="text-gray-500">No franchises found</p>
                <p className="text-sm text-gray-400 mt-2">
                  Run the seed migration to add Coldwell Banker franchises
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
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
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-8">
        <button
          onClick={() => navigate('/admin')}
          className="w-full flex items-center justify-center space-x-3 px-6 py-4 bg-gradient-to-r from-gray-700 to-gray-900 text-white rounded-2xl hover:from-gray-800 hover:to-gray-950 shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-[1.02]"
        >
          <Settings className="w-5 h-5" />
          <span className="font-semibold text-lg">Admin Panel</span>
        </button>
      </div>

      {/* Franchise Comparison Modal */}
      {showComparison && franchises && (
        <FranchiseComparison
          franchises={franchises}
          onClose={() => setShowComparison(false)}
        />
      )}
    </div>
  );
};

export default PerformanceCEODashboard;

