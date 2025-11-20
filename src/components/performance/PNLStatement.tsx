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
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-gradient-to-r from-indigo-50 to-purple-50 rounded-lg shadow-md p-6 border-2 border-indigo-200">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-3">
            <FileText className="w-8 h-8 text-indigo-600" />
            <div>
              <h2 className="text-2xl font-bold text-indigo-900">Profit & Loss Statement</h2>
              <p className="text-sm text-indigo-700">{franchise.name}</p>
            </div>
          </div>
          <div className={`px-6 py-3 rounded-lg border-2 ${
            isProfitable 
              ? 'bg-green-50 border-green-200 text-green-900' 
              : 'bg-red-50 border-red-200 text-red-900'
          }`}>
            <p className="text-sm font-medium mb-1">Net {isProfitable ? 'Profit' : 'Loss'}</p>
            <p className={`text-2xl font-bold ${isProfitable ? 'text-green-700' : 'text-red-700'}`}>
              {formatCurrency(Math.abs(netProfit))}
            </p>
          </div>
        </div>
        <p className="text-sm text-indigo-600">
          Comprehensive financial overview showing revenue, expenses, and profitability
        </p>
      </div>

      {/* Main PNL Statement */}
      <div className="bg-white rounded-lg shadow-lg border-2 border-gray-200 overflow-hidden">
        <div className="p-6">
          <div className="space-y-1">
            {pnlRows.map((row, index) => {
              if (row.label === '') {
                return <div key={index} className="h-4" />;
              }

              const isSubtotal = row.type === 'subtotal';
              const isTotal = row.type === 'total';
              const isRevenue = row.type === 'revenue';
              const isExpense = row.type === 'expense';

              return (
                <div
                  key={index}
                  className={`flex items-center justify-between py-3 px-4 rounded-lg ${
                    isTotal
                      ? 'bg-gradient-to-r from-indigo-50 to-purple-50 border-2 border-indigo-200 font-bold'
                      : isSubtotal
                      ? 'bg-gray-50 border-l-4 border-indigo-400 font-semibold'
                      : row.indent
                      ? 'pl-8 text-gray-600'
                      : 'hover:bg-gray-50'
                  }`}
                >
                  <div className="flex items-center space-x-2">
                    {isRevenue && <Plus className="w-4 h-4 text-green-600" />}
                    {isExpense && <Minus className="w-4 h-4 text-red-600" />}
                    <span className={isTotal ? 'text-lg' : isSubtotal ? 'text-base' : 'text-sm'}>
                      {row.label}
                    </span>
                  </div>
                  <span
                    className={`font-mono text-lg ${
                      isTotal
                        ? isProfitable
                          ? 'text-green-700'
                          : 'text-red-700'
                        : isRevenue
                        ? 'text-green-700'
                        : isExpense
                        ? 'text-red-700'
                        : 'text-gray-700'
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
      <div className="bg-white rounded-lg shadow-lg border-2 border-gray-200 overflow-hidden">
        <div className="p-6">
          <div className="flex items-center space-x-2 mb-4">
            <Calendar className="w-6 h-6 text-indigo-600" />
            <h3 className="text-lg font-semibold text-gray-900">Monthly P&L Breakdown (Last 12 Months)</h3>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b-2 border-gray-200">
                  <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">Month</th>
                  <th className="text-right py-3 px-4 text-sm font-semibold text-green-700">Revenue</th>
                  <th className="text-right py-3 px-4 text-sm font-semibold text-red-700">Expenses</th>
                  <th className="text-right py-3 px-4 text-sm font-semibold text-indigo-700">Profit/(Loss)</th>
                </tr>
              </thead>
              <tbody>
                {monthlyPNL.map((month, index) => (
                  <tr
                    key={month.month}
                    className={`border-b border-gray-100 hover:bg-gray-50 ${
                      month.profit < 0 ? 'bg-red-50/30' : month.profit > 0 ? 'bg-green-50/30' : ''
                    }`}
                  >
                    <td className="py-3 px-4 text-sm font-medium text-gray-700">{month.monthLabel}</td>
                    <td className="py-3 px-4 text-sm text-right font-mono text-green-700">
                      {formatCurrency(month.revenue)}
                    </td>
                    <td className="py-3 px-4 text-sm text-right font-mono text-red-700">
                      {formatCurrency(month.expenses)}
                    </td>
                    <td className={`py-3 px-4 text-sm text-right font-mono font-semibold ${
                      month.profit >= 0 ? 'text-green-700' : 'text-red-700'
                    }`}>
                      {formatCurrency(month.profit)}
                    </td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr className="bg-gradient-to-r from-indigo-50 to-purple-50 border-t-2 border-indigo-200 font-bold">
                  <td className="py-3 px-4 text-sm text-gray-900">Total</td>
                  <td className="py-3 px-4 text-sm text-right font-mono text-green-700">
                    {formatCurrency(monthlyPNL.reduce((sum, m) => sum + m.revenue, 0))}
                  </td>
                  <td className="py-3 px-4 text-sm text-right font-mono text-red-700">
                    {formatCurrency(monthlyPNL.reduce((sum, m) => sum + m.expenses, 0))}
                  </td>
                  <td className={`py-3 px-4 text-sm text-right font-mono ${
                    monthlyPNL.reduce((sum, m) => sum + m.profit, 0) >= 0 ? 'text-green-700' : 'text-red-700'
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
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-lg p-6 border-2 border-green-200">
          <div className="flex items-center space-x-2 mb-2">
            <TrendingUp className="w-5 h-5 text-green-600" />
            <p className="text-sm font-medium text-green-700">Gross Revenue</p>
          </div>
          <p className="text-2xl font-bold text-green-900">{formatCurrency(analytics.gross_revenue)}</p>
          <p className="text-xs text-green-600 mt-1">Total commissions earned</p>
        </div>

        <div className="bg-gradient-to-br from-red-50 to-rose-50 rounded-lg p-6 border-2 border-red-200">
          <div className="flex items-center space-x-2 mb-2">
            <TrendingDown className="w-5 h-5 text-red-600" />
            <p className="text-sm font-medium text-red-700">Total Expenses</p>
          </div>
          <p className="text-2xl font-bold text-red-900">
            {formatCurrency(analytics.total_expenses + analytics.commission_cuts_total + totalTaxes)}
          </p>
          <p className="text-xs text-red-600 mt-1">Fixed + Variable + Cuts + Taxes</p>
        </div>

        <div className={`bg-gradient-to-br rounded-lg p-6 border-2 ${
          isProfitable
            ? 'from-green-50 to-emerald-50 border-green-200'
            : 'from-red-50 to-rose-50 border-red-200'
        }`}>
          <div className="flex items-center space-x-2 mb-2">
            {isProfitable ? (
              <TrendingUp className="w-5 h-5 text-green-600" />
            ) : (
              <TrendingDown className="w-5 h-5 text-red-600" />
            )}
            <p className={`text-sm font-medium ${isProfitable ? 'text-green-700' : 'text-red-700'}`}>
              Net {isProfitable ? 'Profit' : 'Loss'}
            </p>
          </div>
          <p className={`text-2xl font-bold ${isProfitable ? 'text-green-900' : 'text-red-900'}`}>
            {formatCurrency(Math.abs(netProfit))}
          </p>
          <p className={`text-xs mt-1 ${isProfitable ? 'text-green-600' : 'text-red-600'}`}>
            {((netProfit / analytics.gross_revenue) * 100).toFixed(1)}% margin
          </p>
        </div>
      </div>
    </div>
  );
};

