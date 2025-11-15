import React, { useState, useEffect } from 'react';
import { X, Loader2, ArrowDownCircle, ArrowUpCircle, Filter, Calendar } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { supabase } from '../../lib/supabaseClient';
import { useAuthStore } from '../../store/auth';
import { cn } from '../../lib/cn';

interface TransactionHistoryProps {
  isOpen: boolean;
  onClose: () => void;
}

interface Transaction {
  id: string;
  amount: number;
  type: 'credit' | 'debit' | 'topup' | 'payment';
  description: string;
  reference_id?: string;
  status: 'pending' | 'completed' | 'failed';
  created_at: string;
}

type FilterType = 'all' | 'credit' | 'debit' | 'topup' | 'payment';
type TimeFilter = 'all' | 'today' | 'week' | 'month';

export const TransactionHistory: React.FC<TransactionHistoryProps> = React.memo(({ isOpen, onClose }) => {
  const { user } = useAuthStore();
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [typeFilter, setTypeFilter] = useState<FilterType>('all');
  const [timeFilter, setTimeFilter] = useState<TimeFilter>('all');

  // Keyboard navigation (ESC to close)
  React.useEffect(() => {
    if (!isOpen) return;

    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };

    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [isOpen, onClose]);

  useEffect(() => {
    if (isOpen && user) {
      loadTransactions();
    }
  }, [isOpen, user, typeFilter, timeFilter]);

  const loadTransactions = async () => {
    if (!user) return;

    setLoading(true);
    setError(null);

    try {
      // Query payments table (wallet entries)
      const { data: transactionsData, error: transactionsError } = await supabase
        .from('payments')
        .select('*')
        .eq('profile_id', user.id)
        .not('entry_type', 'is', null) // Only wallet entries
        .order('created_at', { ascending: false })
        .limit(50);

      // If table doesn't exist or has no data, just log and continue
      if (transactionsError && transactionsError.code !== 'PGRST116') {
        console.warn('Error loading wallet transactions:', transactionsError);
      }

      // Also get top-up requests as transactions
      const { data: topupRequests, error: topupError } = await supabase
        .from('wallet_topup_requests')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(50);

      if (topupError) {
        console.error('Top-up requests error:', topupError);
      }

      // Combine and format transactions
      const allTransactions: Transaction[] = [];

      // Add wallet transactions
      if (transactionsData && Array.isArray(transactionsData)) {
        transactionsData.forEach((tx: any) => {
          const amount = tx.amount || 0;
          const isDebit = amount < 0;
          allTransactions.push({
            id: tx.id,
            amount: Math.abs(amount),
            type: isDebit ? 'debit' : (tx.type === 'topup' ? 'topup' : 'credit'),
            description: tx.description || 'Wallet transaction',
            reference_id: tx.reference_id,
            status: tx.status || 'completed',
            created_at: tx.created_at,
          });
        });
      }

      // Format payment method name for display
      const formatPaymentMethod = (method: string): string => {
        const methodMap: Record<string, string> = {
          'Card': 'Debit/Credit Card',
          'Instapay': 'Instapay',
          'BankTransfer': 'Bank Transfer',
          'VodafoneCash': 'Vodafone Cash',
        };
        return methodMap[method] || method;
      };

      // Add top-up requests as transactions
      if (topupRequests) {
        topupRequests.forEach((req: any) => {
          allTransactions.push({
            id: req.id,
            amount: req.amount,
            type: 'topup',
            description: `Top-up via ${formatPaymentMethod(req.payment_method || 'Unknown')}`,
            reference_id: req.id,
            status: req.status === 'approved' ? 'completed' : req.status === 'rejected' ? 'failed' : 'pending',
            created_at: req.created_at,
          });
        });
      }

      // Sort by date
      allTransactions.sort((a, b) => 
        new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      );

      // Apply filters
      let filtered = allTransactions;

      if (typeFilter !== 'all') {
        filtered = filtered.filter(tx => {
          if (typeFilter === 'credit') return tx.type === 'credit' || tx.type === 'topup';
          if (typeFilter === 'debit') return tx.type === 'debit' || tx.type === 'payment';
          return tx.type === typeFilter;
        });
      }

      if (timeFilter !== 'all') {
        const now = new Date();
        const filterDate = new Date();
        
        if (timeFilter === 'today') {
          filterDate.setHours(0, 0, 0, 0);
        } else if (timeFilter === 'week') {
          filterDate.setDate(now.getDate() - 7);
        } else if (timeFilter === 'month') {
          filterDate.setMonth(now.getMonth() - 1);
        }

        filtered = filtered.filter(tx => new Date(tx.created_at) >= filterDate);
      }

      setTransactions(filtered);
    } catch (err) {
      console.error('Error loading transactions:', err);
      setError(err instanceof Error ? err.message : 'Failed to load transactions');
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffTime = Math.abs(now.getTime() - date.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays === 0) {
      return 'Today';
    } else if (diffDays === 1) {
      return 'Yesterday';
    } else if (diffDays < 7) {
      return `${diffDays} days ago`;
    } else {
      return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
    }
  };

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'text-blue-600 bg-blue-50';
      case 'pending':
        return 'text-amber-600 bg-amber-50';
      case 'failed':
        return 'text-red-600 bg-red-50';
      default:
        return 'text-gray-600 bg-gray-50';
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50"
            onClick={onClose}
          />

          {/* Modal */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            transition={{ duration: 0.2, type: 'spring', stiffness: 300, damping: 25 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 pointer-events-none"
          >
            <div
              className="bg-white rounded-2xl shadow-2xl w-full max-w-md max-h-[90vh] flex flex-col pointer-events-auto border border-gray-100"
              onClick={(e) => e.stopPropagation()}
              role="dialog"
              aria-modal="true"
              aria-labelledby="transaction-history-title"
            >
              {/* Header */}
              <div className="sticky top-0 bg-white border-b border-gray-100 px-6 py-4 flex items-center justify-between z-10">
                <h2 id="transaction-history-title" className="text-xl font-bold text-gray-900">Transaction History</h2>
                <button
                  onClick={onClose}
                  className="p-2 rounded-full hover:bg-gray-100 transition-colors"
                  aria-label="Close"
                >
                  <X className="h-5 w-5 text-gray-500" />
                </button>
              </div>

              {/* Filters */}
              <div className="px-6 py-4 border-b border-gray-100 space-y-3">
                {/* Type Filter */}
                <div className="flex items-center gap-2 overflow-x-auto scrollbar-hide">
                  <Filter className="h-4 w-4 text-gray-400 flex-shrink-0" />
                  {(['all', 'credit', 'debit', 'topup', 'payment'] as FilterType[]).map((filter) => (
                    <button
                      key={filter}
                      onClick={() => setTypeFilter(filter)}
                      className={cn(
                        "px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition-all",
                        typeFilter === filter
                          ? "bg-blue-500 text-white"
                          : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                      )}
                    >
                      {filter.charAt(0).toUpperCase() + filter.slice(1)}
                    </button>
                  ))}
                </div>

                {/* Time Filter */}
                <div className="flex items-center gap-2 overflow-x-auto scrollbar-hide">
                  <Calendar className="h-4 w-4 text-gray-400 flex-shrink-0" />
                  {(['all', 'today', 'week', 'month'] as TimeFilter[]).map((filter) => (
                    <button
                      key={filter}
                      onClick={() => setTimeFilter(filter)}
                      className={cn(
                        "px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition-all",
                        timeFilter === filter
                          ? "bg-blue-500 text-white"
                          : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                      )}
                    >
                      {filter.charAt(0).toUpperCase() + filter.slice(1)}
                    </button>
                  ))}
                </div>
              </div>

              {/* Content */}
              <div className="flex-1 overflow-y-auto px-6 py-4">
                {loading ? (
                  <div className="flex items-center justify-center py-12">
                    <Loader2 className="h-8 w-8 text-blue-500 animate-spin" />
                  </div>
                ) : error ? (
                  <div className="text-center py-12">
                    <p className="text-red-600 text-sm">{error}</p>
                    <button
                      onClick={loadTransactions}
                      className="mt-4 text-blue-600 text-sm font-medium hover:underline"
                    >
                      Try Again
                    </button>
                  </div>
                ) : transactions.length === 0 ? (
                  <div className="text-center py-12">
                    <p className="text-gray-500 text-sm">No transactions found</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {transactions.map((transaction) => {
                      const isCredit = transaction.type === 'credit' || transaction.type === 'topup';
                      return (
                        <motion.div
                          key={transaction.id}
                          initial={{ opacity: 0, x: -20 }}
                          animate={{ opacity: 1, x: 0 }}
                          className="flex items-center gap-4 p-4 rounded-xl bg-gray-50 hover:bg-gray-100 transition-colors"
                        >
                          {/* Icon */}
                          <div className={cn(
                            "w-12 h-12 rounded-full flex items-center justify-center flex-shrink-0",
                            isCredit ? "bg-blue-100" : "bg-red-100"
                          )}>
                            {isCredit ? (
                              <ArrowDownCircle className="h-6 w-6 text-blue-600" />
                            ) : (
                              <ArrowUpCircle className="h-6 w-6 text-red-600" />
                            )}
                          </div>

                          {/* Details */}
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between gap-2 mb-1">
                              <p className="text-sm font-medium text-gray-900 truncate">
                                {transaction.description}
                              </p>
                              <span className={cn(
                                "text-sm font-bold whitespace-nowrap",
                                isCredit ? "text-blue-600" : "text-red-600"
                              )}>
                                {isCredit ? '+' : '-'}{transaction.amount.toLocaleString()} EGP
                              </span>
                            </div>
                            <div className="flex items-center justify-between gap-2">
                              <span className="text-xs text-gray-500">
                                {formatDate(transaction.created_at)} at {formatTime(transaction.created_at)}
                              </span>
                              <span className={cn(
                                "px-2 py-0.5 rounded-full text-xs font-medium",
                                getStatusColor(transaction.status)
                              )}>
                                {transaction.status}
                              </span>
                            </div>
                          </div>
                        </motion.div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
});

TransactionHistory.displayName = 'TransactionHistory';

