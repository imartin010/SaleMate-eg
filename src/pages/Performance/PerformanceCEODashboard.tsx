import React, { useState } from 'react';
import { usePerformanceFranchises } from '../../hooks/performance/usePerformanceData';
import { Building2, TrendingUp, DollarSign, Users, BarChart3 } from 'lucide-react';
import { FranchiseComparison } from '../../components/performance/FranchiseComparison';

/**
 * CEO Dashboard - Overview of all franchises
 * Main entry point for Coldwell Banker CEO to monitor all franchise performance
 */
const PerformanceCEODashboard: React.FC = () => {
  const { data: franchises, isLoading } = usePerformanceFranchises();
  const [showComparison, setShowComparison] = useState(false);

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
            <div>
              <h1 className="text-5xl font-bold text-white tracking-tight mb-2">
                Salemate Performance
              </h1>
              <p className="text-xl text-blue-100 font-medium">
                Coldwell Banker Franchise Management Dashboard
              </p>
            </div>
            <div className="flex items-center space-x-3">
              <div className="p-4 bg-white/10 backdrop-blur-sm rounded-3xl border border-white/20">
                <Building2 className="w-12 h-12 text-white" />
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
                {franchises?.length || 0}
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
                {franchises?.filter(f => f.is_active).length || 0}
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
                {franchises?.reduce((sum, f) => sum + f.headcount, 0) || 0}
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
                <span className="text-xs font-semibold text-white/60 bg-white/10 px-3 py-1 rounded-2xl">Soon</span>
              </div>
              <p className="text-amber-100 text-sm font-medium mb-1">Total Revenue</p>
              <p className="text-4xl font-bold text-white tracking-tight">
                --
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
                  <a
                    key={franchise.id}
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
                        <span className="text-gray-600">Gross Revenue</span>
                        <span className="font-bold text-gray-900">EGP --</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-600">Net Revenue</span>
                        <span className="font-bold text-gray-900">EGP --</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-600">Expenses</span>
                        <span className="font-bold text-gray-900">EGP --</span>
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
                ))}
              </div>
            )}
          </div>
        </div>
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

