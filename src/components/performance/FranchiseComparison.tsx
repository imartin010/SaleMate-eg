import React, { useState, useMemo, useCallback, useEffect } from 'react';
import {
  X,
  Check,
  TrendingUp,
  TrendingDown,
  DollarSign,
  Users,
  Target,
  AlertTriangle,
  BarChart3,
  Award,
  Building2,
  Calendar
} from 'lucide-react';
import type { PerformanceFranchise, PerformanceTransaction, PerformanceExpense } from '../../types/performance';
import { 
  usePerformanceAnalytics,
  usePerformanceTransactions,
  usePerformanceExpenses,
  usePerformanceCommissionCuts
} from '../../hooks/performance/usePerformanceData';

interface FranchiseComparisonProps {
  franchises: PerformanceFranchise[];
  onClose: () => void;
}

type TimeFrame = 'weekly' | 'monthly' | 'quarterly' | 'half-year' | 'yearly' | 'all-time';

interface ComparisonData {
  franchise: PerformanceFranchise;
  analytics: {
    gross_revenue: number;
    net_revenue: number;
    total_expenses: number;
    total_sales_volume: number;
    contracted_deals_count: number;
    cost_per_agent: number;
    headcount: number;
  } | null;
  isLoading: boolean;
}

// Helper function to get date range based on time frame
const getDateRange = (timeFrame: TimeFrame): { startDate: Date; endDate: Date } => {
  const endDate = new Date();
  const startDate = new Date();
  
  switch (timeFrame) {
    case 'weekly':
      startDate.setDate(endDate.getDate() - 7);
      break;
    case 'monthly':
      startDate.setMonth(endDate.getMonth() - 1);
      break;
    case 'quarterly':
      startDate.setMonth(endDate.getMonth() - 3);
      break;
    case 'half-year':
      startDate.setMonth(endDate.getMonth() - 6);
      break;
    case 'yearly':
      startDate.setFullYear(endDate.getFullYear() - 1);
      break;
    case 'all-time':
      startDate.setFullYear(2020, 0, 1); // Set to a very early date
      break;
  }
  
  return { startDate, endDate };
};

// Component to fetch and calculate analytics for a single franchise with time frame
const FranchiseAnalyticsLoader: React.FC<{
  franchise: PerformanceFranchise;
  timeFrame: TimeFrame;
  onDataReady: (data: ComparisonData) => void;
}> = ({ franchise, timeFrame, onDataReady }) => {
  const { data: transactions, isLoading: transactionsLoading } = usePerformanceTransactions(franchise.id);
  const { data: expenses, isLoading: expensesLoading } = usePerformanceExpenses(franchise.id);
  const { data: commissionCuts, isLoading: cutsLoading } = usePerformanceCommissionCuts(franchise.id);
  
  const isLoading = transactionsLoading || expensesLoading || cutsLoading;
  
  const calculatedAnalytics = useMemo(() => {
    if (!transactions || !expenses || !commissionCuts) {
      return null;
    }
    
    const { startDate, endDate } = getDateRange(timeFrame);
    
    // Filter transactions by time frame (based on contracted_at date)
    const filteredTransactions = transactions.filter(t => {
      if (t.stage !== 'contracted' || !t.contracted_at) return false;
      const contractDate = new Date(t.contracted_at);
      return contractDate >= startDate && contractDate <= endDate;
    });
    
    // Filter expenses by time frame
    const filteredExpenses = expenses.filter(e => {
      const expenseDate = new Date(e.date);
      return expenseDate >= startDate && expenseDate <= endDate;
    });
    
    // Calculate gross revenue (commissions from contracted deals in time frame)
    const gross_revenue = filteredTransactions.reduce((sum, t) => sum + (t.commission_amount || 0), 0);
    
    // Calculate total sales volume
    const total_sales_volume = filteredTransactions.reduce((sum, t) => sum + t.transaction_amount, 0);
    
    // Calculate expenses
    const total_expenses_amount = filteredExpenses.reduce((sum, e) => sum + e.amount, 0);
    
    // Calculate commission cuts based on sales volume
    const millions = total_sales_volume / 1_000_000;
    const commission_cuts_total = commissionCuts.reduce((sum, cut) => sum + (cut.cut_per_million * millions), 0);
    
    // Net revenue
    const net_revenue = gross_revenue - total_expenses_amount - commission_cuts_total;
    
    // Cost per agent
    const cost_per_agent = franchise.headcount > 0 ? total_expenses_amount / franchise.headcount : 0;
    
    return {
      gross_revenue,
      net_revenue,
      total_expenses: total_expenses_amount + commission_cuts_total,
      total_sales_volume,
      contracted_deals_count: filteredTransactions.length,
      cost_per_agent,
      headcount: franchise.headcount,
    };
  }, [transactions, expenses, commissionCuts, timeFrame, franchise.headcount]);
  
  useEffect(() => {
    onDataReady({
      franchise,
      analytics: calculatedAnalytics,
      isLoading
    });
  }, [calculatedAnalytics, isLoading, franchise, onDataReady]);
  
  return null;
};

export const FranchiseComparison: React.FC<FranchiseComparisonProps> = ({
  franchises,
  onClose
}) => {
  // Filter to only show franchises with headcount > 0
  const activeFranchises = useMemo(() => {
    return franchises.filter(f => f.headcount > 0);
  }, [franchises]);

  const [selectedFranchiseIds, setSelectedFranchiseIds] = useState<string[]>([]);
  const [comparisonData, setComparisonData] = useState<ComparisonData[]>([]);
  const [timeFrame, setTimeFrame] = useState<TimeFrame>('all-time');

  // Clear comparison data when time frame changes to force recalculation
  useEffect(() => {
    setComparisonData([]);
  }, [timeFrame]);

  // Update comparison data when franchise analytics are loaded
  const handleDataReady = useCallback((data: ComparisonData) => {
    setComparisonData(prev => {
      const existing = prev.find(d => d.franchise.id === data.franchise.id);
      if (existing) {
        return prev.map(d => d.franchise.id === data.franchise.id ? data : d);
      }
      return [...prev, data];
    });
  }, []);

  // Filter to only selected franchises
  const selectedData = useMemo(() => {
    if (selectedFranchiseIds.length === 0) return [];
    return comparisonData.filter(d => selectedFranchiseIds.includes(d.franchise.id));
  }, [comparisonData, selectedFranchiseIds]);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-EG', {
      style: 'currency',
      currency: 'EGP',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const formatNumber = (num: number) => {
    return new Intl.NumberFormat('en-EG').format(num);
  };

  // Find best performers
  const bestPerformers = useMemo(() => {
    const validData = selectedData.filter(d => d.analytics && !d.isLoading);
    if (validData.length === 0) return {};

    return {
      gross_revenue: validData.reduce((best, current) => 
        (current.analytics!.gross_revenue > best.analytics!.gross_revenue) ? current : best
      ),
      net_revenue: validData.reduce((best, current) => 
        (current.analytics!.net_revenue > best.analytics!.net_revenue) ? current : best
      ),
      cost_per_agent: validData.reduce((best, current) => 
        (current.analytics!.cost_per_agent < best.analytics!.cost_per_agent) ? current : best
      ),
      revenue_per_agent: validData.reduce((best, current) => {
        const currentRevPerAgent = current.analytics!.headcount > 0 
          ? current.analytics!.gross_revenue / current.analytics!.headcount 
          : 0;
        const bestRevPerAgent = best.analytics!.headcount > 0 
          ? best.analytics!.gross_revenue / best.analytics!.headcount 
          : 0;
        return currentRevPerAgent > bestRevPerAgent ? current : best;
      }),
    };
  }, [selectedData]);

  const toggleFranchise = (franchiseId: string) => {
    setSelectedFranchiseIds(prev => {
      if (prev.includes(franchiseId)) {
        return prev.filter(id => id !== franchiseId);
      } else {
        return [...prev, franchiseId];
      }
    });
  };

  const selectAll = () => {
    setSelectedFranchiseIds(activeFranchises.map(f => f.id));
  };

  const clearSelection = () => {
    setSelectedFranchiseIds([]);
  };

  const validSelectedData = selectedData.filter(d => d.analytics && !d.isLoading);

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl shadow-2xl max-w-7xl w-full max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 px-8 py-6 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <BarChart3 className="w-8 h-8 text-white" />
            <div>
              <h2 className="text-2xl font-bold text-white">Franchise Comparison</h2>
              <p className="text-sm text-blue-100">Compare performance metrics across franchises</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-white/20 rounded-lg transition-colors"
          >
            <X className="w-6 h-6 text-white" />
          </button>
        </div>

        {/* Franchise Selector */}
        <div className="px-8 py-4 bg-gray-50 border-b border-gray-200">
          <div className="flex items-center justify-between mb-3">
            <p className="text-sm font-semibold text-gray-700">Select Franchises to Compare:</p>
            <div className="flex items-center space-x-2">
              <button
                onClick={selectAll}
                className="px-4 py-2 text-sm font-medium text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
              >
                Select All
              </button>
              <button
                onClick={clearSelection}
                className="px-4 py-2 text-sm font-medium text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
              >
                Clear
              </button>
            </div>
          </div>
          <div className="flex flex-wrap gap-2">
            {activeFranchises.map(franchise => {
              const isSelected = selectedFranchiseIds.includes(franchise.id);
              return (
                <button
                  key={franchise.id}
                  onClick={() => toggleFranchise(franchise.id)}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                    isSelected
                      ? 'bg-blue-600 text-white shadow-md'
                      : 'bg-white text-gray-700 border border-gray-300 hover:border-blue-400'
                  }`}
                >
                  <div className="flex items-center space-x-2">
                    {isSelected && <Check className="w-4 h-4" />}
                    <span>{franchise.name}</span>
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Time Frame Selector */}
        <div className="px-8 py-4 bg-indigo-50 border-b border-indigo-200">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <Calendar className="w-5 h-5 text-indigo-600" />
              <span className="text-sm font-semibold text-indigo-900">Time Frame:</span>
            </div>
            <div className="flex items-center space-x-2">
              {(['weekly', 'monthly', 'quarterly', 'half-year', 'yearly', 'all-time'] as TimeFrame[]).map((tf) => (
                <button
                  key={tf}
                  onClick={() => setTimeFrame(tf)}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                    timeFrame === tf
                      ? 'bg-indigo-600 text-white shadow-md'
                      : 'bg-white text-indigo-700 border border-indigo-300 hover:border-indigo-400'
                  }`}
                >
                  {tf === 'half-year' ? 'Half Year' : tf.charAt(0).toUpperCase() + tf.slice(1).replace('-', ' ')}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Load analytics only for selected franchises */}
        {activeFranchises
          .filter(f => selectedFranchiseIds.includes(f.id))
          .map(franchise => (
            <FranchiseAnalyticsLoader
              key={`${franchise.id}-${timeFrame}`}
              franchise={franchise}
              timeFrame={timeFrame}
              onDataReady={handleDataReady}
            />
          ))}

        {/* Comparison Content */}
        <div className="flex-1 overflow-y-auto p-8">
          {selectedFranchiseIds.length === 0 ? (
            <div className="text-center py-12">
              <Building2 className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-500 font-medium">Select at least one franchise to compare</p>
              <p className="text-sm text-gray-400 mt-2">
                Choose franchises from the list above to see their performance metrics side by side
              </p>
            </div>
          ) : validSelectedData.length === 0 ? (
            <div className="text-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
              <p className="text-gray-500 font-medium">Loading franchise data...</p>
              <p className="text-sm text-gray-400 mt-2">
                Calculating analytics for selected franchises
              </p>
            </div>
          ) : (
            <>
            <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
              <p className="text-sm text-blue-800">
                <span className="font-semibold">Time Frame:</span> {timeFrame === 'half-year' ? 'Half Year' : timeFrame.charAt(0).toUpperCase() + timeFrame.slice(1).replace('-', ' ')} 
                {timeFrame !== 'all-time' && (
                  <span className="ml-2 text-blue-600">
                    ({getDateRange(timeFrame).startDate.toLocaleDateString()} - {getDateRange(timeFrame).endDate.toLocaleDateString()})
                  </span>
                )}
              </p>
            </div>
            <div className="space-y-6">
              {/* Comparison Table */}
              <div className="bg-white rounded-xl border-2 border-gray-200 overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-gradient-to-r from-gray-50 to-slate-50">
                      <tr>
                        <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">Metric</th>
                        {validSelectedData.map((data) => (
                          <th
                            key={data.franchise.id}
                            className="px-6 py-4 text-center text-sm font-semibold text-gray-700 min-w-[200px]"
                          >
                            {data.franchise.name}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                      {/* Gross Revenue */}
                      <tr className="hover:bg-gray-50">
                        <td className="px-6 py-4 text-sm font-medium text-gray-700">
                          <div className="flex items-center space-x-2">
                            <DollarSign className="w-4 h-4 text-green-600" />
                            <span>Gross Revenue</span>
                          </div>
                        </td>
                        {validSelectedData.map((data) => {
                          const isBest = bestPerformers.gross_revenue?.franchise.id === data.franchise.id;
                          return (
                            <td
                              key={data.franchise.id}
                              className={`px-6 py-4 text-center ${
                                isBest ? 'bg-green-50 font-bold' : ''
                              }`}
                            >
                              <div className="flex items-center justify-center space-x-2">
                                <span className="text-sm font-mono text-gray-900">
                                  {formatCurrency(data.analytics!.gross_revenue)}
                                </span>
                                {isBest && <Award className="w-4 h-4 text-green-600" />}
                              </div>
                            </td>
                          );
                        })}
                      </tr>

                      {/* Net Revenue */}
                      <tr className="hover:bg-gray-50">
                        <td className="px-6 py-4 text-sm font-medium text-gray-700">
                          <div className="flex items-center space-x-2">
                            <TrendingUp className="w-4 h-4 text-blue-600" />
                            <span>Net Revenue</span>
                          </div>
                        </td>
                        {validSelectedData.map((data) => {
                          const isBest = bestPerformers.net_revenue?.franchise.id === data.franchise.id;
                          return (
                            <td
                              key={data.franchise.id}
                              className={`px-6 py-4 text-center ${
                                isBest ? 'bg-green-50 font-bold' : ''
                              }`}
                            >
                              <div className="flex items-center justify-center space-x-2">
                                <span className={`text-sm font-mono ${
                                  data.analytics!.net_revenue >= 0 ? 'text-green-700' : 'text-red-700'
                                }`}>
                                  {formatCurrency(data.analytics!.net_revenue)}
                                </span>
                                {isBest && <Award className="w-4 h-4 text-green-600" />}
                              </div>
                            </td>
                          );
                        })}
                      </tr>

                      {/* Total Expenses */}
                      <tr className="hover:bg-gray-50">
                        <td className="px-6 py-4 text-sm font-medium text-gray-700">
                          <div className="flex items-center space-x-2">
                            <TrendingDown className="w-4 h-4 text-red-600" />
                            <span>Total Expenses</span>
                          </div>
                        </td>
                        {validSelectedData.map((data) => (
                          <td key={data.franchise.id} className="px-6 py-4 text-center">
                            <span className="text-sm font-mono text-red-700">
                              {formatCurrency(data.analytics!.total_expenses)}
                            </span>
                          </td>
                        ))}
                      </tr>

                      {/* Sales Volume */}
                      <tr className="hover:bg-gray-50">
                        <td className="px-6 py-4 text-sm font-medium text-gray-700">
                          <div className="flex items-center space-x-2">
                            <Target className="w-4 h-4 text-purple-600" />
                            <span>Total Sales Volume</span>
                          </div>
                        </td>
                        {validSelectedData.map((data) => (
                          <td key={data.franchise.id} className="px-6 py-4 text-center">
                            <span className="text-sm font-mono text-gray-900">
                              {formatCurrency(data.analytics!.total_sales_volume)}
                            </span>
                          </td>
                        ))}
                      </tr>

                      {/* Deals Count */}
                      <tr className="hover:bg-gray-50">
                        <td className="px-6 py-4 text-sm font-medium text-gray-700">
                          <div className="flex items-center space-x-2">
                            <BarChart3 className="w-4 h-4 text-indigo-600" />
                            <span>Contracted Deals</span>
                          </div>
                        </td>
                        {validSelectedData.map((data) => (
                          <td key={data.franchise.id} className="px-6 py-4 text-center">
                            <span className="text-sm font-mono text-gray-900">
                              {formatNumber(data.analytics!.contracted_deals_count)}
                            </span>
                          </td>
                        ))}
                      </tr>

                      {/* Headcount */}
                      <tr className="hover:bg-gray-50">
                        <td className="px-6 py-4 text-sm font-medium text-gray-700">
                          <div className="flex items-center space-x-2">
                            <Users className="w-4 h-4 text-blue-600" />
                            <span>Headcount</span>
                          </div>
                        </td>
                        {validSelectedData.map((data) => (
                          <td key={data.franchise.id} className="px-6 py-4 text-center">
                            <span className="text-sm font-mono text-gray-900">
                              {formatNumber(data.analytics!.headcount)}
                            </span>
                          </td>
                        ))}
                      </tr>

                      {/* Cost Per Agent */}
                      <tr className="hover:bg-gray-50">
                        <td className="px-6 py-4 text-sm font-medium text-gray-700">
                          <div className="flex items-center space-x-2">
                            <AlertTriangle className="w-4 h-4 text-orange-600" />
                            <span>Cost Per Agent</span>
                          </div>
                        </td>
                        {validSelectedData.map((data) => {
                          const isBest = bestPerformers.cost_per_agent?.franchise.id === data.franchise.id;
                          return (
                            <td
                              key={data.franchise.id}
                              className={`px-6 py-4 text-center ${
                                isBest ? 'bg-green-50 font-bold' : ''
                              }`}
                            >
                              <div className="flex items-center justify-center space-x-2">
                                <span className="text-sm font-mono text-gray-900">
                                  {formatCurrency(data.analytics!.cost_per_agent)}
                                </span>
                                {isBest && <Award className="w-4 h-4 text-green-600" />}
                              </div>
                            </td>
                          );
                        })}
                      </tr>

                      {/* Revenue Per Agent */}
                      <tr className="hover:bg-gray-50 bg-gray-50">
                        <td className="px-6 py-4 text-sm font-medium text-gray-700">
                          <div className="flex items-center space-x-2">
                            <TrendingUp className="w-4 h-4 text-emerald-600" />
                            <span>Revenue Per Agent</span>
                          </div>
                        </td>
                        {validSelectedData.map((data) => {
                          const revenuePerAgent = data.analytics!.headcount > 0
                            ? data.analytics!.gross_revenue / data.analytics!.headcount
                            : 0;
                          const isBest = bestPerformers.revenue_per_agent?.franchise.id === data.franchise.id;
                          return (
                            <td
                              key={data.franchise.id}
                              className={`px-6 py-4 text-center ${
                                isBest ? 'bg-green-50 font-bold' : ''
                              }`}
                            >
                              <div className="flex items-center justify-center space-x-2">
                                <span className="text-sm font-mono text-gray-900">
                                  {formatCurrency(revenuePerAgent)}
                                </span>
                                {isBest && <Award className="w-4 h-4 text-green-600" />}
                              </div>
                            </td>
                          );
                        })}
                      </tr>

                      {/* Performance Per Agent */}
                      <tr className="hover:bg-gray-50 bg-purple-50">
                        <td className="px-6 py-4 text-sm font-medium text-gray-700">
                          <div className="flex items-center space-x-2">
                            <Target className="w-4 h-4 text-purple-600" />
                            <span>Performance Per Agent</span>
                          </div>
                        </td>
                        {validSelectedData.map((data) => {
                          const performancePerAgent = data.analytics!.headcount > 0
                            ? data.analytics!.total_sales_volume / data.analytics!.headcount
                            : 0;
                          return (
                            <td key={data.franchise.id} className="px-6 py-4 text-center">
                              <span className="text-sm font-mono text-gray-900">
                                {formatCurrency(performancePerAgent)}
                              </span>
                            </td>
                          );
                        })}
                      </tr>

                      {/* Profit Margin */}
                      <tr className="hover:bg-gray-50 bg-indigo-50">
                        <td className="px-6 py-4 text-sm font-medium text-gray-700">
                          <div className="flex items-center space-x-2">
                            <BarChart3 className="w-4 h-4 text-indigo-600" />
                            <span>Profit Margin</span>
                          </div>
                        </td>
                        {validSelectedData.map((data) => {
                          const margin = data.analytics!.gross_revenue > 0
                            ? (data.analytics!.net_revenue / data.analytics!.gross_revenue) * 100
                            : 0;
                          return (
                            <td key={data.franchise.id} className="px-6 py-4 text-center">
                              <span className={`text-sm font-mono font-semibold ${
                                margin >= 0 ? 'text-green-700' : 'text-red-700'
                              }`}>
                                {margin.toFixed(1)}%
                              </span>
                            </td>
                          );
                        })}
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Visual Comparison Bars */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Gross Revenue Comparison */}
                <div className="bg-white rounded-xl border-2 border-gray-200 p-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Gross Revenue Comparison</h3>
                  <div className="space-y-4">
                    {validSelectedData.map((data) => {
                      const maxRevenue = Math.max(...validSelectedData.map(d => d.analytics!.gross_revenue));
                      const percentage = (data.analytics!.gross_revenue / maxRevenue) * 100;
                      const isBest = bestPerformers.gross_revenue?.franchise.id === data.franchise.id;
                      return (
                        <div key={data.franchise.id}>
                          <div className="flex items-center justify-between mb-2">
                            <span className="text-sm font-medium text-gray-700">{data.franchise.name}</span>
                            <div className="flex items-center space-x-2">
                              <span className="text-sm font-mono text-gray-900">
                                {formatCurrency(data.analytics!.gross_revenue)}
                              </span>
                              {isBest && <Award className="w-4 h-4 text-green-600" />}
                            </div>
                          </div>
                          <div className="w-full bg-gray-200 rounded-full h-6 overflow-hidden">
                            <div
                              className={`h-full rounded-full transition-all ${
                                isBest ? 'bg-gradient-to-r from-green-500 to-emerald-600' : 'bg-gradient-to-r from-blue-500 to-indigo-600'
                              }`}
                              style={{ width: `${percentage}%` }}
                            />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Net Revenue Comparison */}
                <div className="bg-white rounded-xl border-2 border-gray-200 p-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Net Revenue Comparison</h3>
                  <div className="space-y-4">
                    {validSelectedData.map((data) => {
                      const allNetRevenues = validSelectedData.map(d => d.analytics!.net_revenue);
                      const maxNetRevenue = Math.max(...allNetRevenues);
                      const minNetRevenue = Math.min(...allNetRevenues);
                      const range = maxNetRevenue - minNetRevenue;
                      const percentage = range > 0 
                        ? ((data.analytics!.net_revenue - minNetRevenue) / range) * 100 
                        : 50;
                      const isBest = bestPerformers.net_revenue?.franchise.id === data.franchise.id;
                      const isPositive = data.analytics!.net_revenue >= 0;
                      return (
                        <div key={data.franchise.id}>
                          <div className="flex items-center justify-between mb-2">
                            <span className="text-sm font-medium text-gray-700">{data.franchise.name}</span>
                            <div className="flex items-center space-x-2">
                              <span className={`text-sm font-mono ${
                                isPositive ? 'text-green-700' : 'text-red-700'
                              }`}>
                                {formatCurrency(data.analytics!.net_revenue)}
                              </span>
                              {isBest && <Award className="w-4 h-4 text-green-600" />}
                            </div>
                          </div>
                          <div className="w-full bg-gray-200 rounded-full h-6 overflow-hidden">
                            <div
                              className={`h-full rounded-full transition-all ${
                                isBest 
                                  ? 'bg-gradient-to-r from-green-500 to-emerald-600'
                                  : isPositive
                                  ? 'bg-gradient-to-r from-blue-500 to-indigo-600'
                                  : 'bg-gradient-to-r from-red-500 to-rose-600'
                              }`}
                              style={{ width: `${Math.max(5, percentage)}%` }}
                            />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

