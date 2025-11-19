import React, { useState, useMemo } from 'react';
import { useParams } from 'react-router-dom';
import { 
  usePerformanceFranchiseBySlug,
  usePerformanceAnalytics,
  usePerformanceTransactions,
  usePerformanceExpenses,
  useDeleteExpense,
  useUpdateFranchise,
} from '../../hooks/performance/usePerformanceData';
import { 
  TrendingUp,
  TrendingDown,
  DollarSign, 
  Users, 
  Calendar,
  ArrowLeft,
  BarChart3,
  PieChart,
  Wallet,
  Plus,
  Search,
  Filter,
  X,
  Edit2,
  Trash2,
  Save,
  XCircle,
  FileText
} from 'lucide-react';
import { AddTransactionModal } from '../../components/performance/AddTransactionModal';
import { AddExpenseModal } from '../../components/performance/AddExpenseModal';
import { AIInsights } from '../../components/performance/AIInsights';
import { ForecastingSystem } from '../../components/performance/ForecastingSystem';
import { PNLStatement } from '../../components/performance/PNLStatement';

/**
 * Franchise Owner Dashboard
 * Detailed view of a single franchise's performance
 */
const PerformanceFranchiseDashboard: React.FC = () => {
  const { franchiseSlug } = useParams<{ franchiseSlug: string }>();
  const [activeTab, setActiveTab] = useState<'overview' | 'pnl' | 'transactions' | 'expenses' | 'settings'>('overview');
  const [showAddTransaction, setShowAddTransaction] = useState(false);
  const [showAddExpense, setShowAddExpense] = useState(false);
  
  // Settings form state
  const [isEditingSettings, setIsEditingSettings] = useState(false);
  const [settingsForm, setSettingsForm] = useState({
    name: '',
    headcount: 0,
    is_active: true,
  });
  
  // Transaction filters
  const [transactionSearch, setTransactionSearch] = useState('');
  const [transactionStageFilter, setTransactionStageFilter] = useState<string>('all');
  const [showTransactionFilters, setShowTransactionFilters] = useState(false);
  
  // Expense filters
  const [expenseSearch, setExpenseSearch] = useState('');
  const [expenseTypeFilter, setExpenseTypeFilter] = useState<string>('all');
  const [showExpenseFilters, setShowExpenseFilters] = useState(false);
  
  const { data: franchise, isLoading: franchiseLoading } = usePerformanceFranchiseBySlug(franchiseSlug || '');
  const { data: analytics, isLoading: analyticsLoading } = usePerformanceAnalytics(franchise?.id || '');
  const { data: transactions } = usePerformanceTransactions(franchise?.id);
  const { data: expenses } = usePerformanceExpenses(franchise?.id);
  const deleteExpenseMutation = useDeleteExpense();
  const updateFranchiseMutation = useUpdateFranchise();
  
  // Initialize settings form when franchise data loads
  React.useEffect(() => {
    if (franchise) {
      setSettingsForm({
        name: franchise.name,
        headcount: franchise.headcount,
        is_active: franchise.is_active,
      });
    }
  }, [franchise]);

  // Filtered transactions
  const filteredTransactions = useMemo(() => {
    if (!transactions) return [];
    
    return transactions.filter((transaction) => {
      // Stage filter
      if (transactionStageFilter !== 'all' && transaction.stage !== transactionStageFilter) {
        return false;
      }
      
      // Search filter (amount or project ID)
      if (transactionSearch) {
        const searchLower = transactionSearch.toLowerCase();
        const matchesAmount = transaction.transaction_amount.toString().includes(searchLower);
        const matchesProject = transaction.project_id.toString().includes(searchLower);
        const matchesNotes = transaction.notes?.toLowerCase().includes(searchLower);
        
        if (!matchesAmount && !matchesProject && !matchesNotes) {
          return false;
        }
      }
      
      return true;
    });
  }, [transactions, transactionSearch, transactionStageFilter]);

  // Filtered expenses
  const filteredExpenses = useMemo(() => {
    if (!expenses) return [];
    
    return expenses.filter((expense) => {
      // Type filter
      if (expenseTypeFilter !== 'all' && expense.expense_type !== expenseTypeFilter) {
        return false;
      }
      
      // Search filter (category, description, amount)
      if (expenseSearch) {
        const searchLower = expenseSearch.toLowerCase();
        const matchesCategory = expense.category?.toLowerCase().includes(searchLower);
        const matchesDescription = expense.description?.toLowerCase().includes(searchLower);
        const matchesAmount = expense.amount.toString().includes(searchLower);
        
        if (!matchesCategory && !matchesDescription && !matchesAmount) {
          return false;
        }
      }
      
      return true;
    });
  }, [expenses, expenseSearch, expenseTypeFilter]);

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
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
      {/* Modern Header with Gradient */}
      <div className="bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 shadow-xl">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-6">
              <a
                href="/"
                className="group flex items-center justify-center w-12 h-12 bg-white/10 hover:bg-white/20 backdrop-blur-sm rounded-2xl transition-all duration-300 hover:scale-110"
              >
                <ArrowLeft className="w-6 h-6 text-white" />
              </a>
              <div>
                <h1 className="text-4xl font-bold text-white tracking-tight">
                  {franchise.name}
                </h1>
                <p className="mt-2 text-lg text-blue-100 font-medium">
                  Coldwell Banker Performance Dashboard
                </p>
              </div>
            </div>
            <div className="flex items-center space-x-3">
              <div className="flex items-center space-x-2 px-5 py-2.5 rounded-2xl bg-white/10 backdrop-blur-sm border border-white/20">
                <Users className="w-5 h-5 text-white" />
                <span className="text-white font-semibold">{franchise.headcount} Agents</span>
              </div>
              <span className="inline-flex items-center px-5 py-2.5 rounded-2xl text-sm font-semibold bg-emerald-500 text-white shadow-lg shadow-emerald-500/30">
                {franchise.is_active ? '● Active' : '○ Inactive'}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Modern Tabs */}
      <div className="bg-white/80 backdrop-blur-lg border-b border-gray-200/50 sticky top-0 z-40 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <nav className="flex space-x-2 py-4">
            {[
              { id: 'overview', label: 'Overview', icon: BarChart3 },
              { id: 'pnl', label: 'P&L Statement', icon: FileText },
              { id: 'transactions', label: 'Transactions', icon: Wallet },
              { id: 'expenses', label: 'Expenses', icon: PieChart },
              { id: 'settings', label: 'Settings', icon: Users },
            ].map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as any)}
                  className={`group relative px-6 py-3 rounded-2xl font-semibold text-sm transition-all duration-300 ${
                    activeTab === tab.id
                      ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-lg shadow-blue-500/30 scale-105'
                      : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
                  }`}
                >
                  <span className="flex items-center space-x-2">
                    <Icon className="w-5 h-5" />
                    <span>{tab.label}</span>
                  </span>
                  {activeTab === tab.id && (
                    <div className="absolute -bottom-4 left-1/2 transform -translate-x-1/2 w-2 h-2 bg-blue-600 rounded-full" />
                  )}
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
            {/* Modern Key Metrics Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {/* Gross Revenue Card */}
              <div className="group relative bg-gradient-to-br from-emerald-500 to-green-600 rounded-3xl shadow-xl hover:shadow-2xl transition-all duration-300 hover:scale-105 overflow-hidden">
                <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -mr-16 -mt-16"></div>
                <div className="relative p-6">
                  <div className="flex items-start justify-between mb-4">
                    <div className="p-3 bg-white/20 backdrop-blur-sm rounded-2xl">
                      <DollarSign className="w-6 h-6 text-white" />
                    </div>
                    <TrendingUp className="w-5 h-5 text-white/60" />
                  </div>
                  <p className="text-emerald-100 text-sm font-medium mb-1">Gross Revenue</p>
                  <p className="text-3xl font-bold text-white tracking-tight">
                    {formatCurrency(analytics.gross_revenue)}
                  </p>
                </div>
              </div>

              {/* Net Revenue Card */}
              <div className="group relative bg-gradient-to-br from-blue-500 to-indigo-600 rounded-3xl shadow-xl hover:shadow-2xl transition-all duration-300 hover:scale-105 overflow-hidden">
                <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -mr-16 -mt-16"></div>
                <div className="relative p-6">
                  <div className="flex items-start justify-between mb-4">
                    <div className="p-3 bg-white/20 backdrop-blur-sm rounded-2xl">
                      <TrendingUp className="w-6 h-6 text-white" />
                    </div>
                    <span className="text-xs font-semibold text-white/80 bg-white/20 px-3 py-1 rounded-full">Profit</span>
                  </div>
                  <p className="text-blue-100 text-sm font-medium mb-1">Net Revenue</p>
                  <p className="text-3xl font-bold text-white tracking-tight">
                    {formatCurrency(analytics.net_revenue)}
                  </p>
                </div>
              </div>

              {/* Total Expenses Card */}
              <div className="group relative bg-gradient-to-br from-rose-500 to-red-600 rounded-3xl shadow-xl hover:shadow-2xl transition-all duration-300 hover:scale-105 overflow-hidden">
                <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -mr-16 -mt-16"></div>
                <div className="relative p-6">
                  <div className="flex items-start justify-between mb-4">
                    <div className="p-3 bg-white/20 backdrop-blur-sm rounded-2xl">
                      <Wallet className="w-6 h-6 text-white" />
                    </div>
                    <TrendingDown className="w-5 h-5 text-white/60" />
                  </div>
                  <p className="text-rose-100 text-sm font-medium mb-1">Total Expenses</p>
                  <p className="text-3xl font-bold text-white tracking-tight">
                    {formatCurrency(analytics.total_expenses)}
                  </p>
                </div>
              </div>

              {/* Cost Per Agent Card */}
              <div className="group relative bg-gradient-to-br from-purple-500 to-violet-600 rounded-3xl shadow-xl hover:shadow-2xl transition-all duration-300 hover:scale-105 overflow-hidden">
                <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -mr-16 -mt-16"></div>
                <div className="relative p-6">
                  <div className="flex items-start justify-between mb-4">
                    <div className="p-3 bg-white/20 backdrop-blur-sm rounded-2xl">
                      <Users className="w-6 h-6 text-white" />
                    </div>
                    <span className="text-xs font-semibold text-white/80 bg-white/20 px-3 py-1 rounded-full">{franchise.headcount}</span>
                  </div>
                  <p className="text-purple-100 text-sm font-medium mb-1">Cost Per Agent</p>
                  <p className="text-3xl font-bold text-white tracking-tight">
                    {formatCurrency(analytics.cost_per_agent)}
                  </p>
                </div>
              </div>
            </div>

            {/* Detailed Metrics */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Sales Overview */}
              <div className="bg-white/90 backdrop-blur-sm rounded-3xl shadow-xl border border-gray-100 p-8 hover:shadow-2xl transition-shadow duration-300">
                <div className="flex items-center space-x-3 mb-6">
                  <div className="p-2 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-2xl">
                    <BarChart3 className="w-5 h-5 text-white" />
                  </div>
                  <h3 className="text-xl font-bold text-gray-900">Sales Overview</h3>
                </div>
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
              <div className="bg-white/90 backdrop-blur-sm rounded-3xl shadow-xl border border-gray-100 p-8 hover:shadow-2xl transition-shadow duration-300">
                <div className="flex items-center space-x-3 mb-6">
                  <div className="p-2 bg-gradient-to-br from-rose-500 to-red-600 rounded-2xl">
                    <PieChart className="w-5 h-5 text-white" />
                  </div>
                  <h3 className="text-xl font-bold text-gray-900">Expense Breakdown</h3>
                </div>
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
            <div className="bg-white/90 backdrop-blur-sm rounded-3xl shadow-xl border border-gray-100 p-8 hover:shadow-2xl transition-shadow duration-300">
              <div className="flex items-center space-x-3 mb-6">
                <div className="p-2 bg-gradient-to-br from-amber-500 to-orange-600 rounded-2xl">
                  <Calendar className="w-5 h-5 text-white" />
                </div>
                <h3 className="text-xl font-bold text-gray-900">Expected Payout Timeline</h3>
              </div>
              
              {analytics.expected_payout_timeline.length === 0 ? (
                <p className="text-gray-500 text-center py-8">No upcoming payouts</p>
              ) : (
                <div className="space-y-3">
                  {analytics.expected_payout_timeline.map((item) => (
                    <div
                      key={item.month}
                      className="flex items-center justify-between p-4 bg-gradient-to-br from-blue-50 to-indigo-50 rounded-2xl border border-blue-100"
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

            {/* AI Insights */}
            <AIInsights analytics={analytics} franchise={franchise} />

            {/* Forecasting System */}
            {transactions && expenses && (
              <ForecastingSystem
                analytics={analytics}
                franchise={franchise}
                transactions={transactions}
                expenses={expenses}
              />
            )}
          </div>
        )}

        {activeTab === 'pnl' && (
          <div className="space-y-4">
            {analytics && franchise && transactions && expenses && (
              <PNLStatement
                analytics={analytics}
                franchise={franchise}
                transactions={transactions}
                expenses={expenses}
              />
            )}
          </div>
        )}

        {activeTab === 'transactions' && (
          <div className="space-y-4">
            <div className="bg-white/90 backdrop-blur-sm rounded-3xl shadow-xl border border-gray-100 p-8">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-900">Transactions</h3>
                <div className="flex items-center space-x-2">
                  <button
                    onClick={() => setShowTransactionFilters(!showTransactionFilters)}
                    className="flex items-center space-x-2 px-6 py-3 bg-white text-gray-700 rounded-2xl hover:bg-gray-50 border border-gray-200 shadow-sm hover:shadow-md transition-colors"
                  >
                    <Filter className="w-4 h-4" />
                    <span>Filters</span>
                  </button>
                  <button
                    onClick={() => setShowAddTransaction(true)}
                    className="flex items-center space-x-2 px-6 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-2xl hover:from-blue-700 hover:to-indigo-700 shadow-lg shadow-blue-500/30 hover:shadow-xl hover:scale-105 transition-colors"
                  >
                    <Plus className="w-4 h-4" />
                    <span>Add Transaction</span>
                  </button>
                </div>
              </div>

              {/* Filter Panel */}
              {showTransactionFilters && (
                <div className="mb-6 p-4 bg-gray-50 rounded-2xl border border-gray-200">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* Search */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Search
                      </label>
                      <div className="relative">
                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                        <input
                          type="text"
                          value={transactionSearch}
                          onChange={(e) => setTransactionSearch(e.target.value)}
                          placeholder="Search by amount, project, notes..."
                          className="w-full pl-10 pr-10 py-2 border border-gray-300 rounded-2xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        />
                        {transactionSearch && (
                          <button
                            onClick={() => setTransactionSearch('')}
                            className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    </div>

                    {/* Stage Filter */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Stage
                      </label>
                      <select
                        value={transactionStageFilter}
                        onChange={(e) => setTransactionStageFilter(e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-2xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      >
                        <option value="all">All Stages</option>
                        <option value="eoi">EOI</option>
                        <option value="reservation">Reservation</option>
                        <option value="contracted">Contracted</option>
                        <option value="cancelled">Cancelled</option>
                      </select>
                    </div>
                  </div>

                  {/* Results Count */}
                  <div className="mt-4 flex items-center justify-between text-sm">
                    <span className="text-gray-600">
                      Showing {filteredTransactions.length} of {transactions?.length || 0} transactions
                    </span>
                    {(transactionSearch || transactionStageFilter !== 'all') && (
                      <button
                        onClick={() => {
                          setTransactionSearch('');
                          setTransactionStageFilter('all');
                        }}
                        className="text-blue-600 hover:text-blue-700 font-medium"
                      >
                        Clear filters
                      </button>
                    )}
                  </div>
                </div>
              )}

              {!transactions || transactions.length === 0 ? (
                <div className="text-center py-12">
                  <Wallet className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                  <p className="text-gray-500 mb-4">No transactions yet</p>
                  <button
                    onClick={() => setShowAddTransaction(true)}
                    className="text-blue-600 hover:text-blue-700 font-medium"
                  >
                    Add your first transaction
                  </button>
                </div>
              ) : filteredTransactions.length === 0 ? (
                <div className="text-center py-12">
                  <Search className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                  <p className="text-gray-500 mb-2">No transactions match your filters</p>
                  <button
                    onClick={() => {
                      setTransactionSearch('');
                      setTransactionStageFilter('all');
                    }}
                    className="text-blue-600 hover:text-blue-700 font-medium"
                  >
                    Clear filters
                  </button>
                </div>
              ) : (
                <div className="space-y-3">
                  {filteredTransactions.map((transaction) => (
                    <div
                      key={transaction.id}
                      className="flex items-center justify-between p-4 bg-gray-50 rounded-2xl"
                    >
                      <div>
                        <p className="font-medium text-gray-900">
                          {formatCurrency(transaction.transaction_amount)}
                        </p>
                        <p className="text-sm text-gray-600">
                          {transaction.project?.name || `Project ID: ${transaction.project_id}`}
                        </p>
                        {transaction.project?.developer && (
                          <p className="text-xs text-gray-500">
                            {transaction.project.developer}
                          </p>
                        )}
                        {transaction.notes && (
                          <p className="text-xs text-gray-500 mt-1">{transaction.notes}</p>
                        )}
                      </div>
                      <div className="text-right">
                        <span
                          className={`inline-block px-3 py-1 rounded-2xl text-xs font-medium ${
                            transaction.stage === 'contracted'
                              ? 'bg-green-100 text-green-800'
                              : transaction.stage === 'reservation'
                              ? 'bg-yellow-100 text-yellow-800'
                              : transaction.stage === 'eoi'
                              ? 'bg-blue-100 text-blue-800'
                              : 'bg-red-100 text-red-800'
                          }`}
                        >
                          {transaction.stage.toUpperCase()}
                        </span>
                        {transaction.commission_amount && (
                          <p className="text-sm text-gray-600 mt-1">
                            Commission: {formatCurrency(transaction.commission_amount)}
                          </p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {activeTab === 'expenses' && (
          <div className="space-y-4">
            <div className="bg-white/90 backdrop-blur-sm rounded-3xl shadow-xl border border-gray-100 p-8">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-900">Expenses</h3>
                <div className="flex items-center space-x-2">
                  <button
                    onClick={() => setShowExpenseFilters(!showExpenseFilters)}
                    className="flex items-center space-x-2 px-6 py-3 bg-white text-gray-700 rounded-2xl hover:bg-gray-50 border border-gray-200 shadow-sm hover:shadow-md transition-colors"
                  >
                    <Filter className="w-4 h-4" />
                    <span>Filters</span>
                  </button>
                  <button
                    onClick={() => setShowAddExpense(true)}
                    className="flex items-center space-x-2 px-6 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-2xl hover:from-blue-700 hover:to-indigo-700 shadow-lg shadow-blue-500/30 hover:shadow-xl hover:scale-105 transition-colors"
                  >
                    <Plus className="w-4 h-4" />
                    <span>Add Expense</span>
                  </button>
                </div>
              </div>

              {/* Filter Panel */}
              {showExpenseFilters && (
                <div className="mb-6 p-4 bg-gray-50 rounded-2xl border border-gray-200">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* Search */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Search
                      </label>
                      <div className="relative">
                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                        <input
                          type="text"
                          value={expenseSearch}
                          onChange={(e) => setExpenseSearch(e.target.value)}
                          placeholder="Search by category, description, amount..."
                          className="w-full pl-10 pr-10 py-2 border border-gray-300 rounded-2xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        />
                        {expenseSearch && (
                          <button
                            onClick={() => setExpenseSearch('')}
                            className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    </div>

                    {/* Type Filter */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Type
                      </label>
                      <select
                        value={expenseTypeFilter}
                        onChange={(e) => setExpenseTypeFilter(e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-2xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      >
                        <option value="all">All Types</option>
                        <option value="fixed">Fixed</option>
                        <option value="variable">Variable</option>
                      </select>
                    </div>
                  </div>

                  {/* Results Count */}
                  <div className="mt-4 flex items-center justify-between text-sm">
                    <span className="text-gray-600">
                      Showing {filteredExpenses.length} of {expenses?.length || 0} expenses
                    </span>
                    {(expenseSearch || expenseTypeFilter !== 'all') && (
                      <button
                        onClick={() => {
                          setExpenseSearch('');
                          setExpenseTypeFilter('all');
                        }}
                        className="text-blue-600 hover:text-blue-700 font-medium"
                      >
                        Clear filters
                      </button>
                    )}
                  </div>
                </div>
              )}

              {!expenses || expenses.length === 0 ? (
                <div className="text-center py-12">
                  <PieChart className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                  <p className="text-gray-500 mb-4">No expenses yet</p>
                  <button
                    onClick={() => setShowAddExpense(true)}
                    className="text-blue-600 hover:text-blue-700 font-medium"
                  >
                    Add your first expense
                  </button>
                </div>
              ) : filteredExpenses.length === 0 ? (
                <div className="text-center py-12">
                  <Search className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                  <p className="text-gray-500 mb-2">No expenses match your filters</p>
                  <button
                    onClick={() => {
                      setExpenseSearch('');
                      setExpenseTypeFilter('all');
                    }}
                    className="text-blue-600 hover:text-blue-700 font-medium"
                  >
                    Clear filters
                  </button>
                </div>
              ) : (
                <div className="space-y-3">
                  {filteredExpenses.map((expense) => (
                    <div
                      key={expense.id}
                      className="flex items-center justify-between p-4 bg-gray-50 rounded-2xl hover:bg-gray-100 transition-colors"
                    >
                      <div className="flex-1">
                        <div className="flex items-center space-x-2">
                          <span
                            className={`px-2 py-1 rounded text-xs font-medium ${
                              expense.expense_type === 'fixed'
                                ? 'bg-purple-100 text-purple-800'
                                : 'bg-orange-100 text-orange-800'
                            }`}
                          >
                            {expense.expense_type}
                          </span>
                          <span className="text-sm text-gray-600 capitalize">
                            {expense.category.replace('_', ' ')}
                          </span>
                        </div>
                        {expense.description && (
                          <p className="text-sm text-gray-900 mt-1">{expense.description}</p>
                        )}
                        <p className="text-xs text-gray-500 mt-1">
                          {new Date(expense.date).toLocaleDateString()}
                        </p>
                      </div>
                      <div className="flex items-center space-x-4">
                        <p className="font-semibold text-gray-900">
                          {formatCurrency(expense.amount)}
                        </p>
                        <div className="flex items-center space-x-2">
                          <button
                            onClick={() => {
                              // TODO: Implement edit functionality
                              alert('Edit expense feature coming soon!');
                            }}
                            className="p-2 text-blue-600 hover:bg-gradient-to-br from-blue-50 to-indigo-50 rounded-2xl border border-blue-100 transition-colors"
                            title="Edit expense"
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>
                          <button
                            onClick={async () => {
                              if (window.confirm('Are you sure you want to delete this expense? This action cannot be undone.')) {
                                try {
                                  await deleteExpenseMutation.mutateAsync(expense.id);
                                } catch (error) {
                                  console.error('Failed to delete expense:', error);
                                  alert('Failed to delete expense. Please try again.');
                                }
                              }
                            }}
                            disabled={deleteExpenseMutation.isPending}
                            className="p-2 text-red-600 hover:bg-red-50 rounded-2xl transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
                            title="Delete expense"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {activeTab === 'settings' && (
          <div className="bg-white/90 backdrop-blur-sm rounded-3xl shadow-xl border border-gray-100 p-8">
            {/* Header */}
            <div className="flex items-center justify-between mb-8">
              <div className="flex items-center space-x-3">
                <div className="p-2 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-2xl">
                  <Users className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h3 className="text-2xl font-bold text-gray-900">Franchise Settings</h3>
                  <p className="text-sm text-gray-500 mt-1">Manage franchise information</p>
                </div>
              </div>
              
              {!isEditingSettings ? (
                <button
                  onClick={() => setIsEditingSettings(true)}
                  className="flex items-center space-x-2 px-6 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-2xl hover:from-blue-700 hover:to-indigo-700 shadow-lg shadow-blue-500/30 hover:shadow-xl hover:scale-105 transition-all duration-300"
                >
                  <Edit2 className="w-4 h-4" />
                  <span>Edit Settings</span>
                </button>
              ) : (
                <div className="flex items-center space-x-2">
                  <button
                    onClick={() => {
                      setIsEditingSettings(false);
                      // Reset form to original values
                      if (franchise) {
                        setSettingsForm({
                          name: franchise.name,
                          headcount: franchise.headcount,
                          is_active: franchise.is_active,
                        });
                      }
                    }}
                    className="flex items-center space-x-2 px-4 py-3 bg-white text-gray-700 rounded-2xl hover:bg-gray-50 border border-gray-200 shadow-sm hover:shadow-md transition-all duration-300"
                  >
                    <XCircle className="w-4 h-4" />
                    <span>Cancel</span>
                  </button>
                  <button
                    onClick={async () => {
                      try {
                        await updateFranchiseMutation.mutateAsync({
                          id: franchise.id,
                          ...settingsForm,
                        });
                        setIsEditingSettings(false);
                      } catch (error) {
                        console.error('Failed to update franchise:', error);
                        alert('Failed to update franchise. Please try again.');
                      }
                    }}
                    disabled={updateFranchiseMutation.isPending}
                    className="flex items-center space-x-2 px-6 py-3 bg-gradient-to-r from-emerald-600 to-green-600 text-white rounded-2xl hover:from-emerald-700 hover:to-green-700 shadow-lg shadow-emerald-500/30 hover:shadow-xl hover:scale-105 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
                  >
                    <Save className="w-4 h-4" />
                    <span>{updateFranchiseMutation.isPending ? 'Saving...' : 'Save Changes'}</span>
                  </button>
                </div>
              )}
            </div>

            {/* Form */}
            <div className="space-y-6">
              {/* Franchise Name */}
              <div className="bg-gradient-to-br from-gray-50 to-slate-50 rounded-2xl p-6">
                <label className="block text-sm font-semibold text-gray-700 mb-3">
                  Franchise Name
                </label>
                {isEditingSettings ? (
                  <input
                    type="text"
                    value={settingsForm.name}
                    onChange={(e) => setSettingsForm({ ...settingsForm, name: e.target.value })}
                    className="w-full px-4 py-3 border-2 border-gray-200 rounded-2xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-300 text-lg font-semibold"
                    placeholder="Enter franchise name"
                  />
                ) : (
                  <p className="text-2xl font-bold text-gray-900">{franchise.name}</p>
                )}
              </div>

              {/* Headcount */}
              <div className="bg-gradient-to-br from-gray-50 to-slate-50 rounded-2xl p-6">
                <label className="block text-sm font-semibold text-gray-700 mb-3">
                  Agent Headcount
                </label>
                {isEditingSettings ? (
                  <div className="flex items-center space-x-4">
                    <input
                      type="number"
                      value={settingsForm.headcount}
                      onChange={(e) => setSettingsForm({ ...settingsForm, headcount: parseInt(e.target.value) || 0 })}
                      min="0"
                      className="w-full px-4 py-3 border-2 border-gray-200 rounded-2xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-300 text-lg font-semibold"
                      placeholder="Number of agents"
                    />
                    <div className="flex items-center space-x-2 px-4 py-3 bg-purple-50 rounded-2xl">
                      <Users className="w-5 h-5 text-purple-600" />
                      <span className="text-sm font-semibold text-purple-700">Agents</span>
                    </div>
                  </div>
                ) : (
                  <div className="flex items-center space-x-3">
                    <div className="p-3 bg-purple-100 rounded-2xl">
                      <Users className="w-6 h-6 text-purple-600" />
                    </div>
                    <p className="text-2xl font-bold text-gray-900">{franchise.headcount} Agents</p>
                  </div>
                )}
              </div>

              {/* Status */}
              <div className="bg-gradient-to-br from-gray-50 to-slate-50 rounded-2xl p-6">
                <label className="block text-sm font-semibold text-gray-700 mb-3">
                  Franchise Status
                </label>
                {isEditingSettings ? (
                  <div className="flex items-center space-x-4">
                    <button
                      type="button"
                      onClick={() => setSettingsForm({ ...settingsForm, is_active: true })}
                      className={`flex-1 px-6 py-4 rounded-2xl font-semibold transition-all duration-300 ${
                        settingsForm.is_active
                          ? 'bg-gradient-to-r from-emerald-500 to-green-600 text-white shadow-lg shadow-emerald-500/30 scale-105'
                          : 'bg-white text-gray-600 border-2 border-gray-200 hover:border-emerald-300'
                      }`}
                    >
                      ● Active
                    </button>
                    <button
                      type="button"
                      onClick={() => setSettingsForm({ ...settingsForm, is_active: false })}
                      className={`flex-1 px-6 py-4 rounded-2xl font-semibold transition-all duration-300 ${
                        !settingsForm.is_active
                          ? 'bg-gradient-to-r from-gray-500 to-slate-600 text-white shadow-lg shadow-gray-500/30 scale-105'
                          : 'bg-white text-gray-600 border-2 border-gray-200 hover:border-gray-300'
                      }`}
                    >
                      ○ Inactive
                    </button>
                  </div>
                ) : (
                  <div className="inline-flex items-center space-x-2 px-6 py-3 rounded-2xl font-semibold text-lg" style={{
                    background: franchise.is_active 
                      ? 'linear-gradient(to right, rgb(16, 185, 129), rgb(5, 150, 105))' 
                      : 'linear-gradient(to right, rgb(107, 114, 128), rgb(75, 85, 99))',
                    color: 'white',
                    boxShadow: franchise.is_active 
                      ? '0 10px 15px -3px rgba(16, 185, 129, 0.3)' 
                      : '0 10px 15px -3px rgba(107, 114, 128, 0.3)'
                  }}>
                    {franchise.is_active ? '● Active' : '○ Inactive'}
                  </div>
                )}
              </div>

              {/* Info Cards */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-6">
                <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-2xl p-6 border-2 border-blue-100">
                  <p className="text-sm font-semibold text-blue-700 mb-2">Franchise Slug</p>
                  <p className="text-lg font-mono text-gray-900">{franchise.slug}</p>
                </div>
                <div className="bg-gradient-to-br from-purple-50 to-pink-50 rounded-2xl p-6 border-2 border-purple-100">
                  <p className="text-sm font-semibold text-purple-700 mb-2">Franchise ID</p>
                  <p className="text-sm font-mono text-gray-700 break-all">{franchise.id}</p>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Modals */}
      {franchise && (
        <>
          <AddTransactionModal
            franchiseId={franchise.id}
            isOpen={showAddTransaction}
            onClose={() => setShowAddTransaction(false)}
          />
          <AddExpenseModal
            franchiseId={franchise.id}
            isOpen={showAddExpense}
            onClose={() => setShowAddExpense(false)}
          />
        </>
      )}
    </div>
  );
};

export default PerformanceFranchiseDashboard;

