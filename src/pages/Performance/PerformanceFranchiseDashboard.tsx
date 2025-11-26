import React, { useState, useMemo, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  usePerformanceFranchiseBySlug,
  usePerformanceAnalytics,
  usePerformanceTransactions,
  usePerformanceExpenses,
  useDeleteExpense,
  useUpdateFranchise,
} from '../../hooks/performance/usePerformanceData';
import { useFranchise } from '../../contexts/FranchiseContext';
import { useAuthStore } from '../../features/auth';
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
  FileText,
  LogOut
} from 'lucide-react';
import { AddTransactionModal } from '../../components/performance/AddTransactionModal';
import { AddExpenseModal } from '../../components/performance/AddExpenseModal';
import { AIInsights } from '../../components/performance/AIInsights';
import { ForecastingSystem } from '../../components/performance/ForecastingSystem';
import { PNLStatement } from '../../components/performance/PNLStatement';
import type { PerformanceTransaction } from '../../types/performance';

/**
 * Franchise Owner Dashboard
 * Detailed view of a single franchise's performance
 */
const PerformanceFranchiseDashboard: React.FC = () => {
  const { franchiseSlug } = useParams<{ franchiseSlug: string }>();
  const navigate = useNavigate();
  const user = useAuthStore((state) => state.user);
  const signOut = useAuthStore((state) => state.signOut);
  const { isCEO, isAdmin, isFranchiseEmployee, canEditFranchise, franchiseSlug: userFranchiseSlug } = useFranchise();
  const [activeTab, setActiveTab] = useState<'overview' | 'pnl' | 'transactions' | 'expenses' | 'settings'>('overview');
  const [showAddTransaction, setShowAddTransaction] = useState(false);
  const [showAddExpense, setShowAddExpense] = useState(false);
  const [transactionToEdit, setTransactionToEdit] = useState<PerformanceTransaction | null>(null);
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  
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

  // Verify access when franchise data loads
  useEffect(() => {
    if (!franchise || !user) return;

    // CEO and admin can view any franchise
    if (isCEO || isAdmin) return;

    // Franchise employees can only view their own franchise
    if (isFranchiseEmployee) {
      if (franchise.slug !== userFranchiseSlug) {
        console.warn('Franchise employee attempting to access another franchise');
        navigate(`/franchise/${userFranchiseSlug}`);
      }
    }
  }, [franchise, user, isCEO, isAdmin, isFranchiseEmployee, userFranchiseSlug, navigate]);
  
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

  // Check if current user can edit this franchise
  const canEdit = franchise ? canEditFranchise(franchise.id) : false;

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

  // Helper function to extract clean name from potentially JSON-formatted strings
  const extractName = (value: unknown): string => {
    if (!value) return '';
    if (typeof value === 'string') {
      // Try to extract name from JSON or pseudo-JSON strings
      const jsonMatch = value.match(/"name"\s*:\s*"([^"]+)"/);
      if (jsonMatch && jsonMatch[1]) return jsonMatch[1].trim();
      const pseudoJsonMatch = value.match(/'name'\s*:\s*'([^']+)'/);
      if (pseudoJsonMatch && pseudoJsonMatch[1]) return pseudoJsonMatch[1].trim();
      // If it's a plain string, return it
      return value.trim();
    }
    if (typeof value === 'object' && value !== null) {
      // If it's an object, try to get the name property
      const obj = value as { name?: string; compound?: string };
      return obj.name || obj.compound || '';
    }
    return String(value).trim();
  };

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
        
        // Also search in project name and developer
        const projectName = transaction.project?.name || '';
        const developer = transaction.project?.developer || '';
        const matchesProjectName = extractName(projectName).toLowerCase().includes(searchLower);
        const matchesDeveloper = extractName(developer).toLowerCase().includes(searchLower);
        
        if (!matchesAmount && !matchesProject && !matchesNotes && !matchesProjectName && !matchesDeveloper) {
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
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-2 border-gray-300 border-t-gray-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  if (!franchise) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-semibold text-gray-900 mb-2">Franchise Not Found</h2>
          <p className="text-gray-600 mb-4">The requested franchise could not be found.</p>
          <a href="/dashboard" className="text-gray-700 hover:text-gray-900 font-medium">
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
    <div className="min-h-screen bg-gray-50">
      {/* Professional Header */}
      <div className="bg-white border-b border-gray-200 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <a
                href="/dashboard"
                className="flex items-center justify-center w-10 h-10 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
              >
                <ArrowLeft className="w-5 h-5 text-gray-700" />
              </a>
              <div className="h-8 w-px bg-gray-300"></div>
              <div>
                <h1 className="text-2xl font-semibold text-gray-900">
                  {franchise.name}
                </h1>
                <p className="mt-0.5 text-sm text-gray-600">
                  Performance Dashboard
                </p>
              </div>
            </div>
              <div className="flex items-center space-x-3">
              {isFranchiseEmployee && !isCEO && !isAdmin && (
                <div className="flex items-center space-x-2 px-3 py-2 bg-blue-50 rounded-lg border border-blue-200">
                  <Users className="w-4 h-4 text-blue-700" />
                  <span className="text-sm font-medium text-blue-700">Franchise Manager</span>
                </div>
              )}
              <div className="flex items-center space-x-2 px-3 py-2 bg-gray-50 rounded-lg border border-gray-200">
                <Users className="w-4 h-4 text-gray-600" />
                <span className="text-sm font-medium text-gray-700">{franchise.headcount} Agents</span>
              </div>
              <span className={`inline-flex items-center px-3 py-1.5 rounded text-xs font-medium ${
                franchise.is_active 
                  ? 'bg-blue-50 text-blue-700 border border-blue-200' 
                  : 'bg-gray-200 text-gray-600 border border-gray-300'
              }`}>
                {franchise.is_active ? 'Active' : 'Inactive'}
              </span>
              <button
                onClick={handleLogout}
                disabled={isLoggingOut}
                className="flex items-center space-x-2 px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors text-sm font-medium shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
                title="Logout"
              >
                <LogOut className="w-4 h-4" />
                <span>{isLoggingOut ? 'Logging out...' : 'Logout'}</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Professional Tabs */}
      <div className="bg-white border-b border-gray-200 sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <nav className="flex space-x-1 py-3">
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
                  className={`group relative px-4 py-2 rounded-lg font-medium text-sm transition-colors ${
                    activeTab === tab.id
                      ? 'bg-blue-700 text-white'
                      : 'text-gray-600 hover:text-blue-700 hover:bg-blue-50'
                  }`}
                >
                  <span className="flex items-center space-x-2">
                    <Icon className="w-4 h-4" />
                    <span>{tab.label}</span>
                  </span>
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
            {/* Professional Key Metrics Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {/* Gross Revenue Card */}
              <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-lg border-2 border-blue-200 shadow-sm hover:shadow-md hover:border-blue-400 transition-all duration-200 p-6">
                <div className="flex items-center justify-between mb-4">
                  <div className="p-2 bg-white rounded-lg shadow-sm">
                    <DollarSign className="w-5 h-5 text-blue-600" />
                  </div>
                  <TrendingUp className="w-4 h-4 text-blue-600" />
                </div>
                <p className="text-gray-700 text-sm font-medium mb-1">Gross Revenue</p>
                <p className="text-2xl font-bold text-blue-700">
                  {formatCurrency(analytics.gross_revenue)}
                </p>
              </div>

              {/* Net Revenue Card - Dynamic Color */}
              <div className={`rounded-lg border-2 shadow-sm hover:shadow-md transition-all duration-200 p-6 ${
                analytics.net_revenue >= 0 
                  ? 'bg-gradient-to-br from-green-50 to-emerald-50 border-green-300 hover:border-green-400' 
                  : 'bg-gradient-to-br from-red-50 to-rose-50 border-red-300 hover:border-red-400'
              }`}>
                <div className="flex items-center justify-between mb-4">
                  <div className={`p-2 bg-white rounded-lg shadow-sm ${
                    analytics.net_revenue >= 0 ? 'text-green-600' : 'text-red-600'
                  }`}>
                    {analytics.net_revenue >= 0 ? (
                      <TrendingUp className="w-5 h-5" />
                    ) : (
                      <TrendingDown className="w-5 h-5" />
                    )}
                  </div>
                  <span className={`text-xs font-bold px-2.5 py-1 rounded-full ${
                    analytics.net_revenue >= 0 
                      ? 'text-green-700 bg-green-100 border border-green-300' 
                      : 'text-red-700 bg-red-100 border border-red-300'
                  }`}>
                    {analytics.net_revenue >= 0 ? 'Profit' : 'Loss'}
                  </span>
                </div>
                <p className="text-gray-700 text-sm font-medium mb-1">Net P&L</p>
                <p className={`text-2xl font-bold ${
                  analytics.net_revenue >= 0 ? 'text-green-700' : 'text-red-700'
                }`}>
                  {formatCurrency(analytics.net_revenue)}
                </p>
              </div>

              {/* Total Expenses Card */}
              <div className="bg-gradient-to-br from-orange-50 to-amber-50 rounded-lg border-2 border-orange-200 shadow-sm hover:shadow-md hover:border-orange-300 transition-all duration-200 p-6">
                <div className="flex items-center justify-between mb-4">
                  <div className="p-2 bg-white rounded-lg shadow-sm">
                    <Wallet className="w-5 h-5 text-orange-600" />
                  </div>
                  <TrendingDown className="w-4 h-4 text-orange-500" />
                </div>
                <p className="text-gray-700 text-sm font-medium mb-1">Total Expenses</p>
                <p className="text-2xl font-bold text-orange-700">
                  {formatCurrency(analytics.total_expenses)}
                </p>
              </div>

              {/* Cost Per Agent Card */}
              <div className="bg-gradient-to-br from-purple-50 to-violet-50 rounded-lg border-2 border-purple-200 shadow-sm hover:shadow-md hover:border-purple-300 transition-all duration-200 p-6">
                <div className="flex items-center justify-between mb-4">
                  <div className="p-2 bg-white rounded-lg shadow-sm">
                    <Users className="w-5 h-5 text-purple-600" />
                  </div>
                  <span className="text-xs font-bold text-purple-700 bg-purple-100 px-2.5 py-1 rounded-full border border-purple-300">{franchise.headcount}</span>
                </div>
                <p className="text-gray-700 text-sm font-medium mb-1">Cost Per Agent</p>
                <p className="text-2xl font-bold text-purple-700">
                  {formatCurrency(analytics.cost_per_agent)}
                </p>
              </div>
            </div>

            {/* Detailed Metrics */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              {/* Sales Overview */}
              <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl shadow-md border-2 border-blue-300 p-6">
                <div className="flex items-center space-x-3 mb-4">
                  <div className="p-2 bg-white rounded-lg shadow-sm">
                    <BarChart3 className="w-5 h-5 text-blue-600" />
                  </div>
                  <h3 className="text-lg font-bold text-gray-900">Sales Overview</h3>
                </div>
                <div className="space-y-4">
                  <div className="flex justify-between items-center p-3 bg-white/60 rounded-lg">
                    <span className="text-gray-700 font-medium">Total Sales Volume:</span>
                    <span className="font-bold text-blue-700">
                      {formatCurrency(analytics.total_sales_volume)}
                    </span>
                  </div>
                  <div className="flex justify-between items-center p-3 bg-green-50/80 rounded-lg border border-green-200">
                    <span className="text-gray-700 font-medium">Contracted Deals:</span>
                    <span className="font-bold text-green-700 text-lg">
                      {analytics.contracted_deals_count}
                    </span>
                  </div>
                  <div className="flex justify-between items-center p-3 bg-amber-50/80 rounded-lg border border-amber-200">
                    <span className="text-gray-700 font-medium">Pending Deals:</span>
                    <span className="font-bold text-amber-700 text-lg">
                      {analytics.pending_deals_count}
                    </span>
                  </div>
                  <div className="flex justify-between items-center p-3 bg-red-50/80 rounded-lg border border-red-200">
                    <span className="text-gray-700 font-medium">Cancelled Deals:</span>
                    <span className="font-bold text-red-700 text-lg">
                      {analytics.cancelled_deals_count}
                    </span>
                  </div>
                </div>
              </div>

              {/* Expense Breakdown */}
              <div className="bg-gradient-to-br from-orange-50 to-amber-50 rounded-xl shadow-md border-2 border-orange-300 p-6">
                <div className="flex items-center space-x-3 mb-4">
                  <div className="p-2 bg-white rounded-lg shadow-sm">
                    <PieChart className="w-5 h-5 text-orange-600" />
                  </div>
                  <h3 className="text-lg font-bold text-gray-900">Expense Breakdown</h3>
                </div>
                <div className="space-y-4">
                  <div className="flex justify-between items-center p-3 bg-white/60 rounded-lg">
                    <span className="text-gray-700 font-medium">Fixed Expenses:</span>
                    <span className="font-bold text-gray-900">
                      {formatCurrency(analytics.fixed_expenses)}
                    </span>
                  </div>
                  <div className="flex justify-between items-center p-3 bg-white/60 rounded-lg">
                    <span className="text-gray-700 font-medium">Variable Expenses:</span>
                    <span className="font-bold text-gray-900">
                      {formatCurrency(analytics.variable_expenses)}
                    </span>
                  </div>
                  <div className="flex justify-between items-center p-3 bg-white/60 rounded-lg">
                    <span className="text-gray-700 font-medium">Commission Cuts:</span>
                    <span className="font-bold text-gray-900">
                      {formatCurrency(analytics.commission_cuts_total)}
                    </span>
                  </div>
                  <div className="pt-2 border-t-2 border-orange-300">
                    <div className="flex justify-between items-center p-3 bg-red-50 rounded-lg border-2 border-red-300">
                      <span className="font-bold text-gray-900">Total:</span>
                      <span className="font-bold text-red-700 text-lg">
                        {formatCurrency(analytics.total_expenses + analytics.commission_cuts_total)}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Expected Payout Timeline */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <div className="flex items-center space-x-3 mb-4">
                <div className="p-2 bg-blue-50 rounded-lg">
                  <Calendar className="w-5 h-5 text-blue-700" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900">Expected Payout Timeline</h3>
              </div>
              
              {analytics.expected_payout_timeline.length === 0 ? (
                <p className="text-gray-500 text-center py-8">No upcoming payouts</p>
              ) : (
                <div className="space-y-2">
                  {analytics.expected_payout_timeline.map((item) => (
                    <div
                      key={item.month}
                      className="flex items-center justify-between p-4 bg-blue-50 rounded-lg border border-blue-200"
                    >
                      <div>
                        <p className="font-medium text-gray-900">{item.month}</p>
                        <p className="text-sm text-gray-600">{item.count} {item.count === 1 ? 'deal' : 'deals'}</p>
                      </div>
                      <p className="text-lg font-semibold text-blue-700">
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
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-900">Transactions</h3>
                <div className="flex items-center space-x-2">
                  <button
                    onClick={() => setShowTransactionFilters(!showTransactionFilters)}
                    className="flex items-center space-x-2 px-4 py-2 bg-white text-gray-700 rounded-lg hover:bg-gray-50 border border-gray-200 transition-colors text-sm font-medium"
                  >
                    <Filter className="w-4 h-4" />
                    <span>Filters</span>
                  </button>
                  <button
                    onClick={() => {
                      setTransactionToEdit(null);
                      setShowAddTransaction(true);
                    }}
                    className="flex items-center space-x-2 px-4 py-2 bg-blue-700 text-white rounded-lg hover:bg-blue-800 transition-colors text-sm font-medium"
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
                      className="flex items-center justify-between p-4 bg-gray-50 rounded-2xl hover:bg-gray-100 transition-colors"
                    >
                      <div className="flex-1">
                        <p className="font-medium text-gray-900">
                          {formatCurrency(transaction.transaction_amount)}
                        </p>
                        <p className="text-sm text-gray-600">
                          {transaction.project?.name 
                            ? extractName(transaction.project.name) 
                            : `Project ID: ${transaction.project_id}`}
                        </p>
                        {transaction.project?.developer && extractName(transaction.project.developer) && (
                          <p className="text-xs text-gray-500">
                            {extractName(transaction.project.developer)}
                          </p>
                        )}
                        {transaction.notes && (
                          <p className="text-xs text-gray-500 mt-1">{transaction.notes}</p>
                        )}
                      </div>
                      <div className="flex items-center gap-3">
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
                        <button
                          onClick={() => {
                            setTransactionToEdit(transaction);
                            setShowAddTransaction(true);
                          }}
                          className="p-2 text-blue-600 hover:text-blue-700 hover:bg-blue-50 rounded-lg transition-colors"
                          title="Edit transaction"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
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
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-900">Expenses</h3>
                <div className="flex items-center space-x-2">
                  <button
                    onClick={() => setShowExpenseFilters(!showExpenseFilters)}
                    className="flex items-center space-x-2 px-4 py-2 bg-white text-gray-700 rounded-lg hover:bg-gray-50 border border-gray-200 transition-colors text-sm font-medium"
                  >
                    <Filter className="w-4 h-4" />
                    <span>Filters</span>
                  </button>
                  <button
                    onClick={() => setShowAddExpense(true)}
                    className="flex items-center space-x-2 px-4 py-2 bg-blue-700 text-white rounded-lg hover:bg-blue-800 transition-colors text-sm font-medium"
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
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            {/* Header */}
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center space-x-3">
                <div className="p-2 bg-gray-100 rounded-lg">
                  <Users className="w-5 h-5 text-gray-700" />
                </div>
                <div>
                  <h3 className="text-xl font-semibold text-gray-900">Franchise Settings</h3>
                  <p className="text-sm text-gray-600 mt-0.5">Manage franchise information</p>
                </div>
              </div>
              
              {!isEditingSettings ? (
                canEdit && (
                  <button
                    onClick={() => setIsEditingSettings(true)}
                    className="flex items-center space-x-2 px-4 py-2 bg-blue-700 text-white rounded-lg hover:bg-blue-800 transition-colors text-sm font-medium"
                  >
                    <Edit2 className="w-4 h-4" />
                    <span>Edit Settings</span>
                  </button>
                )
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
                    className="flex items-center space-x-2 px-4 py-2 bg-white text-gray-700 rounded-lg hover:bg-gray-50 border border-gray-200 transition-colors text-sm font-medium"
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
                    className="flex items-center space-x-2 px-4 py-2 bg-blue-700 text-white rounded-lg hover:bg-blue-800 transition-colors text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <Save className="w-4 h-4" />
                    <span>{updateFranchiseMutation.isPending ? 'Saving...' : 'Save Changes'}</span>
                  </button>
                </div>
              )}
            </div>

            {/* Form */}
            <div className="space-y-4">
              {/* Franchise Name */}
              <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Franchise Name
                </label>
                {isEditingSettings ? (
                  <input
                    type="text"
                    value={settingsForm.name}
                    onChange={(e) => setSettingsForm({ ...settingsForm, name: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-900 focus:border-transparent text-base"
                    placeholder="Enter franchise name"
                  />
                ) : (
                  <p className="text-lg font-semibold text-gray-900">{franchise.name}</p>
                )}
              </div>

              {/* Headcount */}
              <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Agent Headcount
                </label>
                {isEditingSettings ? (
                  <div className="flex items-center space-x-3">
                    <input
                      type="number"
                      value={settingsForm.headcount}
                      onChange={(e) => setSettingsForm({ ...settingsForm, headcount: parseInt(e.target.value) || 0 })}
                      min="0"
                      className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-900 focus:border-transparent text-base"
                      placeholder="Number of agents"
                    />
                    <div className="flex items-center space-x-2 px-3 py-2 bg-gray-100 rounded-lg border border-gray-200">
                      <Users className="w-4 h-4 text-gray-600" />
                      <span className="text-sm font-medium text-gray-700">Agents</span>
                    </div>
                  </div>
                ) : (
                  <div className="flex items-center space-x-2">
                    <Users className="w-5 h-5 text-gray-600" />
                    <p className="text-lg font-semibold text-gray-900">{franchise.headcount} Agents</p>
                  </div>
                )}
              </div>

              {/* Status */}
              <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Franchise Status
                </label>
                {isEditingSettings ? (
                  <div className="flex items-center space-x-3">
                    <button
                      type="button"
                      onClick={() => setSettingsForm({ ...settingsForm, is_active: true })}
                      className={`flex-1 px-4 py-2 rounded-lg font-medium transition-colors ${
                        settingsForm.is_active
                          ? 'bg-blue-700 text-white'
                          : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50'
                      }`}
                    >
                      Active
                    </button>
                    <button
                      type="button"
                      onClick={() => setSettingsForm({ ...settingsForm, is_active: false })}
                      className={`flex-1 px-4 py-2 rounded-lg font-medium transition-colors ${
                        !settingsForm.is_active
                          ? 'bg-blue-700 text-white'
                          : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50'
                      }`}
                    >
                      Inactive
                    </button>
                  </div>
                ) : (
                  <div className={`inline-flex items-center px-3 py-1.5 rounded text-sm font-medium ${
                    franchise.is_active 
                      ? 'bg-blue-50 text-blue-700 border border-blue-200' 
                      : 'bg-gray-200 text-gray-600 border border-gray-300'
                  }`}>
                    {franchise.is_active ? 'Active' : 'Inactive'}
                  </div>
                )}
              </div>

              {/* Info Cards */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4">
                <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                  <p className="text-sm font-medium text-gray-700 mb-1">Franchise Slug</p>
                  <p className="text-base font-mono text-gray-900">{franchise.slug}</p>
                </div>
                <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                  <p className="text-sm font-medium text-gray-700 mb-1">Franchise ID</p>
                  <p className="text-xs font-mono text-gray-600 break-all">{franchise.id}</p>
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
            onClose={() => {
              setShowAddTransaction(false);
              setTransactionToEdit(null);
            }}
            transactionToEdit={transactionToEdit}
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

