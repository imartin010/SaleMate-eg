import React from 'react';
import { usePerformanceFranchises } from '../../hooks/performance/usePerformanceData';
import { Building2, TrendingUp, DollarSign, Users } from 'lucide-react';

/**
 * CEO Dashboard - Overview of all franchises
 * Main entry point for Coldwell Banker CEO to monitor all franchise performance
 */
const PerformanceCEODashboard: React.FC = () => {
  const { data: franchises, isLoading } = usePerformanceFranchises();

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
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">
                Salemate Performance
              </h1>
              <p className="mt-1 text-sm text-gray-500">
                Coldwell Banker Franchise Management
              </p>
            </div>
            <div className="flex items-center space-x-2">
              <Building2 className="w-8 h-8 text-blue-600" />
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Franchises</p>
                <p className="text-3xl font-bold text-gray-900 mt-2">
                  {franchises?.length || 0}
                </p>
              </div>
              <Building2 className="w-12 h-12 text-blue-500 opacity-20" />
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Active Franchises</p>
                <p className="text-3xl font-bold text-green-600 mt-2">
                  {franchises?.filter(f => f.is_active).length || 0}
                </p>
              </div>
              <TrendingUp className="w-12 h-12 text-green-500 opacity-20" />
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Headcount</p>
                <p className="text-3xl font-bold text-purple-600 mt-2">
                  {franchises?.reduce((sum, f) => sum + f.headcount, 0) || 0}
                </p>
              </div>
              <Users className="w-12 h-12 text-purple-500 opacity-20" />
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Revenue</p>
                <p className="text-3xl font-bold text-blue-600 mt-2">
                  <span className="text-xl">EGP</span> --
                </p>
                <p className="text-xs text-gray-500 mt-1">Coming soon</p>
              </div>
              <DollarSign className="w-12 h-12 text-blue-500 opacity-20" />
            </div>
          </div>
        </div>

        {/* Franchises Grid */}
        <div className="bg-white rounded-lg shadow-md">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-xl font-semibold text-gray-900">All Franchises</h2>
            <p className="text-sm text-gray-500 mt-1">
              Click on a franchise to view detailed performance
            </p>
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
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {franchises.map((franchise) => (
                  <a
                    key={franchise.id}
                    href={`/franchise/${franchise.slug}`}
                    className="block p-6 bg-gradient-to-br from-blue-50 to-indigo-50 rounded-lg border border-blue-200 hover:shadow-lg transition-all hover:scale-105 cursor-pointer"
                  >
                    <div className="flex items-start justify-between mb-4">
                      <div>
                        <h3 className="text-lg font-semibold text-gray-900">
                          {franchise.name}
                        </h3>
                        <p className="text-sm text-gray-500 mt-1">
                          {franchise.headcount} {franchise.headcount === 1 ? 'agent' : 'agents'}
                        </p>
                      </div>
                      {franchise.is_active && (
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                          Active
                        </span>
                      )}
                    </div>
                    
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-600">Gross Revenue:</span>
                        <span className="font-semibold text-gray-900">EGP --</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-600">Net Revenue:</span>
                        <span className="font-semibold text-gray-900">EGP --</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-600">Expenses:</span>
                        <span className="font-semibold text-gray-900">EGP --</span>
                      </div>
                    </div>
                    
                    <div className="mt-4 pt-4 border-t border-blue-200">
                      <p className="text-xs text-blue-600 font-medium">
                        View Details →
                      </p>
                    </div>
                  </a>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default PerformanceCEODashboard;

