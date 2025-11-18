import React, { useState } from 'react';
import { useParams } from 'react-router-dom';
import { 
  usePerformanceFranchiseBySlug,
  usePerformanceAnalytics,
} from '../../hooks/performance/usePerformanceData';
import { 
  TrendingUp, 
  DollarSign, 
  Users, 
  Calendar,
  ArrowLeft,
  BarChart3,
  PieChart,
  Wallet
} from 'lucide-react';

/**
 * Franchise Owner Dashboard
 * Detailed view of a single franchise's performance
 */
const PerformanceFranchiseDashboard: React.FC = () => {
  const { franchiseSlug } = useParams<{ franchiseSlug: string }>();
  const [activeTab, setActiveTab] = useState<'overview' | 'transactions' | 'expenses' | 'settings'>('overview');
  
  const { data: franchise, isLoading: franchiseLoading } = usePerformanceFranchiseBySlug(franchiseSlug || '');
  const { data: analytics, isLoading: analyticsLoading } = usePerformanceAnalytics(franchise?.id || '');

  const isLoading = franchiseLoading || analyticsLoading;

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  if (!franchise) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Franchise Not Found</h2>
          <p className="text-gray-600 mb-4">The requested franchise could not be found.</p>
          <a href="/" className="text-blue-600 hover:text-blue-700 font-medium">
            ← Back to Dashboard
          </a>
        </div>
      </div>
    );
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-EG', {
      style: 'currency',
      currency: 'EGP',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <a
                href="/"
                className="text-gray-400 hover:text-gray-600 transition-colors"
              >
                <ArrowLeft className="w-6 h-6" />
              </a>
              <div>
                <h1 className="text-3xl font-bold text-gray-900">
                  {franchise.name}
                </h1>
                <p className="mt-1 text-sm text-gray-500">
                  Coldwell Banker Franchise Performance
                </p>
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-green-100 text-green-800">
                {franchise.is_active ? 'Active' : 'Inactive'}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <nav className="flex space-x-8">
            {[
              { id: 'overview', label: 'Overview', icon: BarChart3 },
              { id: 'transactions', label: 'Transactions', icon: Wallet },
              { id: 'expenses', label: 'Expenses', icon: PieChart },
              { id: 'settings', label: 'Settings', icon: Users },
            ].map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as any)}
                  className={`py-4 px-1 border-b-2 font-medium text-sm flex items-center space-x-2 ${
                    activeTab === tab.id
                      ? 'border-blue-500 text-blue-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  <Icon className="w-5 h-5" />
                  <span>{tab.label}</span>
                </button>
              );
            })}
          </nav>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {activeTab === 'overview' && analytics && (
          <div className="space-y-6">
            {/* Key Metrics */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <div className="bg-white rounded-lg shadow-md p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Gross Revenue</p>
                    <p className="text-2xl font-bold text-green-600 mt-2">
                      {formatCurrency(analytics.gross_revenue)}
                    </p>
                  </div>
                  <DollarSign className="w-12 h-12 text-green-500 opacity-20" />
                </div>
              </div>

              <div className="bg-white rounded-lg shadow-md p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Net Revenue</p>
                    <p className="text-2xl font-bold text-blue-600 mt-2">
                      {formatCurrency(analytics.net_revenue)}
                    </p>
                  </div>
                  <TrendingUp className="w-12 h-12 text-blue-500 opacity-20" />
                </div>
              </div>

              <div className="bg-white rounded-lg shadow-md p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Total Expenses</p>
                    <p className="text-2xl font-bold text-red-600 mt-2">
                      {formatCurrency(analytics.total_expenses)}
                    </p>
                  </div>
                  <Wallet className="w-12 h-12 text-red-500 opacity-20" />
                </div>
              </div>

              <div className="bg-white rounded-lg shadow-md p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Cost Per Agent</p>
                    <p className="text-2xl font-bold text-purple-600 mt-2">
                      {formatCurrency(analytics.cost_per_agent)}
                    </p>
                  </div>
                  <Users className="w-12 h-12 text-purple-500 opacity-20" />
                </div>
              </div>
            </div>

            {/* Detailed Metrics */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Sales Overview */}
              <div className="bg-white rounded-lg shadow-md p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Sales Overview</h3>
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600">Total Sales Volume:</span>
                    <span className="font-semibold text-gray-900">
                      {formatCurrency(analytics.total_sales_volume)}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600">Contracted Deals:</span>
                    <span className="font-semibold text-green-600">
                      {analytics.contracted_deals_count}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600">Pending Deals:</span>
                    <span className="font-semibold text-yellow-600">
                      {analytics.pending_deals_count}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600">Cancelled Deals:</span>
                    <span className="font-semibold text-red-600">
                      {analytics.cancelled_deals_count}
                    </span>
                  </div>
                </div>
              </div>

              {/* Expense Breakdown */}
              <div className="bg-white rounded-lg shadow-md p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Expense Breakdown</h3>
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600">Fixed Expenses:</span>
                    <span className="font-semibold text-gray-900">
                      {formatCurrency(analytics.fixed_expenses)}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600">Variable Expenses:</span>
                    <span className="font-semibold text-gray-900">
                      {formatCurrency(analytics.variable_expenses)}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600">Commission Cuts:</span>
                    <span className="font-semibold text-gray-900">
                      {formatCurrency(analytics.commission_cuts_total)}
                    </span>
                  </div>
                  <div className="pt-3 border-t border-gray-200">
                    <div className="flex justify-between items-center">
                      <span className="font-semibold text-gray-900">Total:</span>
                      <span className="font-bold text-red-600">
                        {formatCurrency(analytics.total_expenses + analytics.commission_cuts_total)}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Expected Payout Timeline */}
            <div className="bg-white rounded-lg shadow-md p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-900">Expected Payout Timeline</h3>
                <Calendar className="w-6 h-6 text-blue-500" />
              </div>
              
              {analytics.expected_payout_timeline.length === 0 ? (
                <p className="text-gray-500 text-center py-8">No upcoming payouts</p>
              ) : (
                <div className="space-y-3">
                  {analytics.expected_payout_timeline.map((item) => (
                    <div
                      key={item.month}
                      className="flex items-center justify-between p-4 bg-blue-50 rounded-lg"
                    >
                      <div>
                        <p className="font-medium text-gray-900">{item.month}</p>
                        <p className="text-sm text-gray-600">{item.count} {item.count === 1 ? 'deal' : 'deals'}</p>
                      </div>
                      <p className="text-lg font-bold text-blue-600">
                        {formatCurrency(item.amount)}
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* AI Insights Placeholder */}
            <div className="bg-gradient-to-r from-purple-50 to-pink-50 rounded-lg shadow-md p-6 border-2 border-purple-200">
              <h3 className="text-lg font-semibold text-purple-900 mb-2">🤖 AI Insights</h3>
              <p className="text-purple-700">
                Coming soon: AI-powered insights and recommendations for your franchise performance
              </p>
            </div>
          </div>
        )}

        {activeTab === 'transactions' && (
          <div className="bg-white rounded-lg shadow-md p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Transactions Management</h3>
            <p className="text-gray-600">Transaction management interface coming soon...</p>
          </div>
        )}

        {activeTab === 'expenses' && (
          <div className="bg-white rounded-lg shadow-md p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Expenses Management</h3>
            <p className="text-gray-600">Expense management interface coming soon...</p>
          </div>
        )}

        {activeTab === 'settings' && (
          <div className="bg-white rounded-lg shadow-md p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Franchise Settings</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">Franchise Name</label>
                <p className="mt-1 text-lg text-gray-900">{franchise.name}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Headcount</label>
                <p className="mt-1 text-lg text-gray-900">{franchise.headcount} agents</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Status</label>
                <p className="mt-1 text-lg text-gray-900">
                  {franchise.is_active ? 'Active' : 'Inactive'}
                </p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default PerformanceFranchiseDashboard;

