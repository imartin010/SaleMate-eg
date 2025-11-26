import React, { useMemo } from 'react';
import {
  TrendingUp,
  TrendingDown,
  DollarSign,
  Minus,
  Plus,
  FileText,
  Calendar,
  Download
} from 'lucide-react';
import type { FranchiseAnalytics, PerformanceFranchise, PerformanceExpense, PerformanceTransaction } from '../../types/performance';

interface PNLStatementProps {
  analytics: FranchiseAnalytics;
  franchise: PerformanceFranchise;
  expenses: PerformanceExpense[];
  transactions: PerformanceTransaction[];
}

interface PNLRow {
  label: string;
  amount: number;
  type: 'revenue' | 'expense' | 'total' | 'subtotal';
  indent?: boolean;
}

export const PNLStatement: React.FC<PNLStatementProps> = ({
  analytics,
  franchise,
  expenses,
  transactions
}) => {
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-EG', {
      style: 'currency',
      currency: 'EGP',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  // Calculate monthly PNL breakdown
  const monthlyPNL = useMemo(() => {
    const now = new Date();
    const months: Array<{
      month: string;
      monthLabel: string;
      revenue: number;
      expenses: number;
      profit: number;
    }> = [];

    // Get last 12 months
    for (let i = 11; i >= 0; i--) {
      const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const monthKey = date.toISOString().substring(0, 7);
      const monthLabel = date.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });

      // Revenue from commissions paid out in this month
      const revenue = transactions
        .filter(t => {
          if (!t.expected_payout_date || t.stage !== 'contracted') return false;
          const payoutDate = new Date(t.expected_payout_date);
          return payoutDate.toISOString().substring(0, 7) === monthKey;
        })
        .reduce((sum, t) => sum + (t.commission_amount || 0), 0);

      // Expenses in this month
      const monthExpenses = expenses
        .filter(e => e.date.substring(0, 7) === monthKey)
        .reduce((sum, e) => sum + e.amount, 0);

      // Commission cuts (estimated based on sales volume)
      const monthSales = transactions
        .filter(t => {
          if (t.stage !== 'contracted' || !t.contracted_at) return false;
          const contractDate = new Date(t.contracted_at);
          return contractDate.toISOString().substring(0, 7) === monthKey;
        })
        .reduce((sum, t) => sum + t.transaction_amount, 0);

      const commissionCuts = analytics.commission_cuts_total > 0 && analytics.total_sales_volume > 0
        ? (analytics.commission_cuts_total / analytics.total_sales_volume) * monthSales
        : 0;

      // Taxes for transactions in this month
      const monthTaxes = transactions
        .filter(t => {
          if (t.stage !== 'contracted' || !t.contracted_at) return false;
          const contractDate = new Date(t.contracted_at);
          return contractDate.toISOString().substring(0, 7) === monthKey;
        })
        .reduce((sum, t) => {
          const tax = (t.tax_amount || 0) + (t.withholding_tax || 0) + (t.income_tax || 0);
          return sum + tax;
        }, 0);

      const totalExpenses = monthExpenses + commissionCuts + monthTaxes;
      const profit = revenue - totalExpenses;

      months.push({
        month: monthKey,
        monthLabel,
        revenue,
        expenses: totalExpenses,
        profit
      });
    }

    return months;
  }, [transactions, expenses, analytics]);

  // Calculate total taxes from all transactions
  const totalTaxes = useMemo(() => {
    return transactions
      .filter(t => t.stage === 'contracted')
      .reduce((sum, t) => {
        const tax = (t.tax_amount || 0) + (t.withholding_tax || 0) + (t.income_tax || 0);
        return sum + tax;
      }, 0);
  }, [transactions]);

  // Build PNL statement rows
  const pnlRows: PNLRow[] = useMemo(() => {
    const rows: PNLRow[] = [];

    // REVENUE SECTION
    rows.push({ label: 'REVENUE', amount: 0, type: 'subtotal' });
    rows.push({ label: 'Gross Commission Revenue', amount: analytics.gross_revenue, type: 'revenue' });
    rows.push({ label: 'Expected Future Revenue', amount: analytics.expected_revenue, type: 'revenue', indent: true });
    rows.push({ label: 'Total Revenue', amount: analytics.gross_revenue + analytics.expected_revenue, type: 'subtotal' });

    rows.push({ label: '', amount: 0, type: 'total' }); // Spacer

    // EXPENSES SECTION
    rows.push({ label: 'EXPENSES', amount: 0, type: 'subtotal' });
    rows.push({ label: 'Fixed Expenses', amount: analytics.fixed_expenses, type: 'expense' });
    rows.push({ label: 'Variable Expenses', amount: analytics.variable_expenses, type: 'expense' });
    rows.push({ label: 'Commission Cuts (Agent/Team)', amount: analytics.commission_cuts_total, type: 'expense' });
    rows.push({ label: 'Taxes (14% + 5% + 4%)', amount: totalTaxes, type: 'expense' });
    rows.push({ label: 'Total Expenses', amount: analytics.total_expenses + analytics.commission_cuts_total + totalTaxes, type: 'subtotal' });

    rows.push({ label: '', amount: 0, type: 'total' }); // Spacer

    // PROFIT/LOSS
    const totalRevenue = analytics.gross_revenue;
    const totalExpenses = analytics.total_expenses + analytics.commission_cuts_total + totalTaxes;
    const netProfit = totalRevenue - totalExpenses;

    rows.push({ label: 'NET PROFIT / (LOSS)', amount: netProfit, type: 'total' });

    return rows;
  }, [analytics, totalTaxes]);

  const netProfit = analytics.gross_revenue - (analytics.total_expenses + analytics.commission_cuts_total + totalTaxes);
  const isProfitable = netProfit > 0;

  return (
    <div className="space-y-3 sm:space-y-4">
      {/* Header */}
      <div className="bg-gradient-to-br from-slate-50 to-gray-50 rounded-xl shadow-md border-2 border-gray-300 p-4 sm:p-6">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-3 sm:mb-4">
          <div className="flex items-center space-x-2 sm:space-x-3">
            <div className="p-1.5 sm:p-2 bg-white rounded-lg shadow-sm">
              <FileText className="w-5 h-5 sm:w-6 sm:h-6 text-gray-700" />
            </div>
            <div>
              <h2 className="text-lg sm:text-2xl font-bold text-gray-900">Profit & Loss Statement</h2>
              <p className="text-xs sm:text-sm text-gray-600 mt-0.5 sm:mt-1 font-medium">{franchise.name}</p>
            </div>
          </div>
          <div className={`px-3 sm:px-5 py-2 sm:py-3 rounded-xl border-2 shadow-lg w-full sm:w-auto ${
            isProfitable 
              ? 'bg-gradient-to-br from-green-50 to-emerald-50 border-green-400' 
              : 'bg-gradient-to-br from-red-50 to-rose-50 border-red-400'
          }`}>
            <p className={`text-[10px] sm:text-xs font-bold mb-0.5 sm:mb-1 uppercase tracking-wide ${
              isProfitable ? 'text-green-600' : 'text-red-600'
            }`}>
              Net {isProfitable ? 'Profit' : 'Loss'}
            </p>
            <p className={`text-lg sm:text-2xl font-bold ${isProfitable ? 'text-green-700' : 'text-red-700'}`}>
              {formatCurrency(Math.abs(netProfit))}
            </p>
          </div>
        </div>
        <p className="text-xs sm:text-sm text-gray-700 font-medium">
          Comprehensive financial overview showing revenue, expenses, and profitability
        </p>
      </div>

      {/* Main PNL Statement */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
        <div className="p-3 sm:p-6">
          <div className="space-y-1">
            {pnlRows.map((row, index) => {
              if (row.label === '') {
                return <div key={index} className="h-3 sm:h-4" />;
              }

              const isSubtotal = row.type === 'subtotal';
              const isTotal = row.type === 'total';
              const isRevenue = row.type === 'revenue';
              const isExpense = row.type === 'expense';

              return (
                <div
                  key={index}
                  className={`flex items-center justify-between py-2 sm:py-3 px-2 sm:px-4 rounded-lg ${
                    isTotal
                      ? row.amount >= 0
                        ? 'bg-gradient-to-r from-green-600 to-emerald-600 text-white font-bold shadow-md'
                        : 'bg-gradient-to-r from-red-600 to-rose-600 text-white font-bold shadow-md'
                      : isSubtotal
                      ? 'bg-gradient-to-r from-blue-50 to-indigo-50 border-l-4 border-blue-500 font-bold shadow-sm'
                      : row.indent
                      ? 'pl-4 sm:pl-8 text-gray-600 hover:bg-gray-50'
                      : 'hover:bg-gray-50 transition-colors'
                  }`}
                >
                  <div className="flex items-center space-x-1 sm:space-x-2 min-w-0 flex-1">
                    {isRevenue && <Plus className="w-3 h-3 sm:w-4 sm:h-4 text-green-600 flex-shrink-0" />}
                    {isExpense && <Minus className="w-3 h-3 sm:w-4 sm:h-4 text-red-600 flex-shrink-0" />}
                    <span className={`truncate ${isTotal ? 'text-sm sm:text-base font-bold' : isSubtotal ? 'text-xs sm:text-sm font-bold' : 'text-xs sm:text-sm'}`}>
                      {row.label}
                    </span>
                  </div>
                  <span
                    className={`font-mono flex-shrink-0 ml-2 ${
                      isTotal
                        ? 'text-sm sm:text-lg text-white font-bold'
                        : isRevenue
                        ? 'text-xs sm:text-sm text-green-700 font-semibold'
                        : isExpense
                        ? 'text-xs sm:text-sm text-red-700 font-semibold'
                        : 'text-xs sm:text-sm text-gray-700 font-semibold'
                    }`}
                  >
                    {row.amount !== 0 && (
                      <>
                        {isExpense && '-'}
                        {formatCurrency(Math.abs(row.amount))}
                      </>
                    )}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Monthly Breakdown */}
      <div className="bg-gradient-to-br from-slate-50 to-gray-50 rounded-xl shadow-md border-2 border-gray-300 overflow-hidden">
        <div className="p-4 sm:p-6">
          <div className="flex items-center space-x-2 sm:space-x-3 mb-3 sm:mb-4">
            <div className="p-1.5 sm:p-2 bg-white rounded-lg shadow-sm">
              <Calendar className="w-4 h-4 sm:w-5 sm:h-5 text-gray-700" />
            </div>
            <h3 className="text-base sm:text-xl font-bold text-gray-900">Monthly P&L Breakdown (Last 12 Months)</h3>
          </div>

          <div className="overflow-x-auto scrollbar-hide">
            <table className="w-full min-w-[500px]">
              <thead>
                <tr className="bg-gradient-to-r from-gray-100 to-slate-100 border-b-2 border-gray-300">
                  <th className="text-left py-2 sm:py-4 px-2 sm:px-4 text-xs sm:text-sm font-bold text-gray-800 uppercase tracking-wide">Month</th>
                  <th className="text-right py-2 sm:py-4 px-2 sm:px-4 text-xs sm:text-sm font-bold text-green-700 uppercase tracking-wide">Revenue</th>
                  <th className="text-right py-2 sm:py-4 px-2 sm:px-4 text-xs sm:text-sm font-bold text-orange-700 uppercase tracking-wide">Expenses</th>
                  <th className="text-right py-2 sm:py-4 px-2 sm:px-4 text-xs sm:text-sm font-bold text-indigo-700 uppercase tracking-wide">Profit/(Loss)</th>
                </tr>
              </thead>
              <tbody>
                {monthlyPNL.map((month, index) => (
                  <tr
                    key={month.month}
                    className={`border-b border-gray-200 hover:shadow-sm transition-shadow ${
                      month.profit < 0 
                        ? 'bg-gradient-to-r from-red-50/50 to-rose-50/50 hover:from-red-50 hover:to-rose-50' 
                        : month.profit > 0 
                        ? 'bg-gradient-to-r from-green-50/50 to-emerald-50/50 hover:from-green-50 hover:to-emerald-50' 
                        : 'bg-white hover:bg-gray-50'
                    }`}
                  >
                    <td className="py-2 sm:py-3 px-2 sm:px-4 text-xs sm:text-sm font-bold text-gray-800">{month.monthLabel}</td>
                    <td className="py-2 sm:py-3 px-2 sm:px-4 text-xs sm:text-sm text-right font-mono font-bold text-green-600">
                      {formatCurrency(month.revenue)}
                    </td>
                    <td className="py-2 sm:py-3 px-2 sm:px-4 text-xs sm:text-sm text-right font-mono font-bold text-orange-600">
                      {formatCurrency(month.expenses)}
                    </td>
                    <td className={`py-2 sm:py-3 px-2 sm:px-4 text-xs sm:text-sm text-right font-mono font-bold ${
                      month.profit >= 0 ? 'text-green-700' : 'text-red-700'
                    }`}>
                      {formatCurrency(month.profit)}
                    </td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr className={`border-t-2 font-bold shadow-md ${
                  monthlyPNL.reduce((sum, m) => sum + m.profit, 0) >= 0
                    ? 'bg-gradient-to-r from-emerald-100 to-teal-100 border-emerald-400'
                    : 'bg-gradient-to-r from-red-100 to-rose-100 border-red-400'
                }`}>
                  <td className="py-3 sm:py-4 px-2 sm:px-4 text-xs sm:text-sm text-gray-900 font-bold uppercase">Total</td>
                  <td className="py-3 sm:py-4 px-2 sm:px-4 text-xs sm:text-sm text-right font-mono text-green-700 font-bold">
                    {formatCurrency(monthlyPNL.reduce((sum, m) => sum + m.revenue, 0))}
                  </td>
                  <td className="py-3 sm:py-4 px-2 sm:px-4 text-xs sm:text-sm text-right font-mono text-orange-700 font-bold">
                    {formatCurrency(monthlyPNL.reduce((sum, m) => sum + m.expenses, 0))}
                  </td>
                  <td className={`py-3 sm:py-4 px-2 sm:px-4 text-sm sm:text-base text-right font-mono font-bold ${
                    monthlyPNL.reduce((sum, m) => sum + m.profit, 0) >= 0 ? 'text-emerald-700' : 'text-red-700'
                  }`}>
                    {formatCurrency(monthlyPNL.reduce((sum, m) => sum + m.profit, 0))}
                  </td>
                </tr>
              </tfoot>
            </table>
          </div>
        </div>
      </div>

      {/* Key Metrics Summary */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
        <div className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-xl p-4 sm:p-6 border-2 border-green-300 shadow-md hover:shadow-lg transition-shadow">
          <div className="flex items-center space-x-2 mb-2 sm:mb-3">
            <div className="p-1.5 sm:p-2 bg-white rounded-lg shadow-sm">
              <TrendingUp className="w-4 h-4 sm:w-5 sm:h-5 text-green-600" />
            </div>
            <p className="text-xs sm:text-sm font-bold text-gray-700">Gross Revenue</p>
          </div>
          <p className="text-xl sm:text-3xl font-bold text-green-700">{formatCurrency(analytics.gross_revenue)}</p>
          <p className="text-[10px] sm:text-xs text-green-600 mt-1 sm:mt-2 font-semibold">Total commissions earned</p>
        </div>

        <div className="bg-gradient-to-br from-orange-50 to-amber-50 rounded-xl p-4 sm:p-6 border-2 border-orange-300 shadow-md hover:shadow-lg transition-shadow">
          <div className="flex items-center space-x-2 mb-2 sm:mb-3">
            <div className="p-1.5 sm:p-2 bg-white rounded-lg shadow-sm">
              <TrendingDown className="w-4 h-4 sm:w-5 sm:h-5 text-orange-600" />
            </div>
            <p className="text-xs sm:text-sm font-bold text-gray-700">Total Expenses</p>
          </div>
          <p className="text-xl sm:text-3xl font-bold text-orange-700">
            {formatCurrency(analytics.total_expenses + analytics.commission_cuts_total + totalTaxes)}
          </p>
          <p className="text-[10px] sm:text-xs text-orange-600 mt-1 sm:mt-2 font-semibold">Fixed + Variable + Cuts + Taxes</p>
        </div>

        <div className={`rounded-xl p-4 sm:p-6 border-2 shadow-md hover:shadow-lg transition-shadow ${
          isProfitable
            ? 'bg-gradient-to-br from-emerald-50 to-teal-50 border-emerald-400'
            : 'bg-gradient-to-br from-red-50 to-rose-50 border-red-400'
        }`}>
          <div className="flex items-center space-x-2 mb-2 sm:mb-3">
            <div className="p-1.5 sm:p-2 bg-white rounded-lg shadow-sm">
              {isProfitable ? (
                <TrendingUp className="w-4 h-4 sm:w-5 sm:h-5 text-emerald-600" />
              ) : (
                <TrendingDown className="w-4 h-4 sm:w-5 sm:h-5 text-red-600" />
              )}
            </div>
            <p className={`text-xs sm:text-sm font-bold ${isProfitable ? 'text-emerald-700' : 'text-red-700'}`}>
              Net {isProfitable ? 'Profit' : 'Loss'}
            </p>
          </div>
          <p className={`text-xl sm:text-3xl font-bold ${isProfitable ? 'text-emerald-700' : 'text-red-700'}`}>
            {formatCurrency(Math.abs(netProfit))}
          </p>
          <p className={`text-[10px] sm:text-xs mt-1 sm:mt-2 font-semibold ${isProfitable ? 'text-emerald-600' : 'text-red-600'}`}>
            {((netProfit / analytics.gross_revenue) * 100).toFixed(1)}% margin
          </p>
        </div>
      </div>
    </div>
  );
};

