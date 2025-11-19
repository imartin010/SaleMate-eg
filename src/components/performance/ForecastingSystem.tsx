import React, { useMemo } from 'react';
import {
  TrendingUp,
  TrendingDown,
  AlertTriangle,
  CheckCircle,
  Lightbulb,
  DollarSign,
  Calendar,
  Target,
  Bot,
  LineChart,
  Wallet
} from 'lucide-react';
import type { FranchiseAnalytics, PerformanceFranchise, PerformanceTransaction, PerformanceExpense } from '../../types/performance';

interface ForecastingSystemProps {
  analytics: FranchiseAnalytics;
  franchise: PerformanceFranchise;
  transactions: PerformanceTransaction[];
  expenses: PerformanceExpense[];
}

interface CashflowMonth {
  month: string;
  monthLabel: string;
  commissionInflow: number;
  expenses: number;
  netCashflow: number;
  cumulativeCashflow: number;
  isNegative: boolean;
}

interface BreakevenAnalysis {
  monthlyExpenses: number;
  averageCommissionRate: number;
  breakevenSalesVolume: number;
  currentMonthlySales: number;
  monthsToBreakeven: number;
  isProfitable: boolean;
}

export const ForecastingSystem: React.FC<ForecastingSystemProps> = ({
  analytics,
  franchise,
  transactions,
  expenses
}) => {
  // Calculate average monthly expenses (fixed expenses only, commission cuts calculated separately)
  const monthlyExpenses = useMemo(() => {
    // Group expenses by month and calculate average
    const expensesByMonth = expenses.reduce((acc, expense) => {
      const month = expense.date.substring(0, 7); // YYYY-MM
      if (!acc[month]) {
        acc[month] = [];
      }
      acc[month].push(expense.amount);
      return acc;
    }, {} as Record<string, number[]>);

    const monthlyTotals = Object.values(expensesByMonth).map(monthExpenses =>
      monthExpenses.reduce((sum, amount) => sum + amount, 0)
    );

    if (monthlyTotals.length === 0) {
      // If no expenses, use fixed expenses as monthly estimate
      return analytics.fixed_expenses || analytics.total_expenses || 0;
    }

    // Return average monthly expenses (fixed expenses)
    return monthlyTotals.reduce((sum, total) => sum + total, 0) / monthlyTotals.length;
  }, [expenses, analytics.fixed_expenses, analytics.total_expenses]);

  // Average commission rate - standard is 3.5% (fixed rate across all projects)
  const STANDARD_COMMISSION_RATE = 3.5;
  
  // Always use the standard 3.5% commission rate
  const averageCommissionRate = STANDARD_COMMISSION_RATE;

  // Calculate break-even analysis
  const breakevenAnalysis: BreakevenAnalysis = useMemo(() => {
    // Break-even needs to cover: fixed expenses + commission cuts
    // Commission cuts are calculated per million in sales
    // We need to solve: commission_revenue = fixed_expenses + commission_cuts
    // commission_rate * sales_volume = fixed_expenses + (cut_per_million * sales_volume / 1,000,000)
    
    // Estimate commission cuts rate (per million)
    const commissionCutsPerMillion = analytics.commission_cuts_total > 0 && analytics.total_sales_volume > 0
      ? analytics.commission_cuts_total / (analytics.total_sales_volume / 1_000_000)
      : 0;

    // Break-even calculation accounting for commission cuts
    // commission_rate * sales = expenses + (cuts_per_million * sales / 1M)
    // sales * (commission_rate - cuts_per_million/1M) = expenses
    // sales = expenses / (commission_rate - cuts_per_million/1M)
    const effectiveCommissionRate = STANDARD_COMMISSION_RATE - (commissionCutsPerMillion / 10_000); // Convert per million to percentage
    
    const breakevenSalesVolume = effectiveCommissionRate > 0
      ? (monthlyExpenses / effectiveCommissionRate) * 100
      : 0;
    
    const breakevenCommissionNeeded = monthlyExpenses;

    // Calculate current monthly sales (average of last 3 months)
    const now = new Date();
    const last3Months = transactions
      .filter(t => t.stage === 'contracted' && t.contracted_at)
      .filter(t => {
        const contractDate = new Date(t.contracted_at!);
        const monthsDiff = (now.getTime() - contractDate.getTime()) / (1000 * 60 * 60 * 24 * 30);
        return monthsDiff <= 3 && monthsDiff >= 0;
      });

    const currentMonthlySales = last3Months.length > 0
      ? last3Months.reduce((sum, t) => sum + t.transaction_amount, 0) / 3
      : 0;

    const monthsToBreakeven = currentMonthlySales > 0 && breakevenSalesVolume > 0
      ? breakevenSalesVolume / currentMonthlySales
      : 0;

    const isProfitable = analytics.net_revenue > 0;

    return {
      monthlyExpenses,
      averageCommissionRate: STANDARD_COMMISSION_RATE,
      breakevenSalesVolume,
      currentMonthlySales,
      monthsToBreakeven: Math.max(0, monthsToBreakeven),
      isProfitable
    };
  }, [monthlyExpenses, transactions, analytics.net_revenue, analytics.commission_cuts_total, analytics.total_sales_volume]);

  // Calculate cashflow forecast
  const cashflowForecast: CashflowMonth[] = useMemo(() => {
    const now = new Date();
    const forecastMonths: CashflowMonth[] = [];
    let cumulativeCashflow = analytics.net_revenue || 0;

    // Generate 12 months forecast
    for (let i = 0; i < 12; i++) {
      const forecastDate = new Date(now.getFullYear(), now.getMonth() + i, 1);
      const monthKey = forecastDate.toISOString().substring(0, 7);
      const monthLabel = forecastDate.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });

      // Calculate commission inflows for this month
      const commissionInflow = transactions
        .filter(t => {
          if (!t.expected_payout_date || t.stage !== 'contracted') return false;
          const payoutDate = new Date(t.expected_payout_date);
          return payoutDate.toISOString().substring(0, 7) === monthKey;
        })
        .reduce((sum, t) => sum + (t.commission_amount || 0), 0);

      // Expenses for this month (use monthly average)
      const monthExpenses = monthlyExpenses;

      // Net cashflow
      const netCashflow = commissionInflow - monthExpenses;
      cumulativeCashflow += netCashflow;

      forecastMonths.push({
        month: monthKey,
        monthLabel,
        commissionInflow,
        expenses: monthExpenses,
        netCashflow,
        cumulativeCashflow,
        isNegative: cumulativeCashflow < 0
      });
    }

    return forecastMonths;
  }, [transactions, monthlyExpenses, analytics.net_revenue]);

  // Generate AI recommendations
  const generateRecommendations = () => {
    const recommendations: Array<{
      type: 'success' | 'warning' | 'danger' | 'info';
      title: string;
      description: string;
      icon: React.ReactNode;
    }> = [];

    // Check for negative cashflow months
    const negativeMonths = cashflowForecast.filter(m => m.isNegative || m.netCashflow < 0);
    if (negativeMonths.length > 0) {
      const firstNegativeMonth = negativeMonths[0];
      recommendations.push({
        type: 'danger',
        title: 'Negative Cashflow Alert',
        description: `Your cashflow will turn negative in ${firstNegativeMonth.monthLabel}. You need to close deals worth EGP ${breakevenAnalysis.breakevenSalesVolume.toLocaleString()} to break even.`,
        icon: <AlertTriangle className="w-5 h-5" />
      });
    }

    // Break-even analysis
    if (breakevenAnalysis.breakevenSalesVolume > breakevenAnalysis.currentMonthlySales) {
      const gap = breakevenAnalysis.breakevenSalesVolume - breakevenAnalysis.currentMonthlySales;
      recommendations.push({
        type: 'warning',
        title: 'Below Break-Even Sales',
        description: `You need to increase monthly sales by EGP ${gap.toLocaleString()} to reach break-even. Current: EGP ${breakevenAnalysis.currentMonthlySales.toLocaleString()}, Target: EGP ${breakevenAnalysis.breakevenSalesVolume.toLocaleString()}`,
        icon: <Target className="w-5 h-5" />
      });
    } else {
      recommendations.push({
        type: 'success',
        title: 'Above Break-Even',
        description: `Your current sales volume exceeds break-even by EGP ${(breakevenAnalysis.currentMonthlySales - breakevenAnalysis.breakevenSalesVolume).toLocaleString()}. Keep up the momentum!`,
        icon: <CheckCircle className="w-5 h-5" />
      });
    }

    // Cashflow health
    const positiveMonths = cashflowForecast.filter(m => m.netCashflow > 0).length;
    if (positiveMonths >= 10) {
      recommendations.push({
        type: 'success',
        title: 'Strong Cashflow Forecast',
        description: `${positiveMonths} out of 12 months show positive cashflow. Your franchise is well-positioned for growth.`,
        icon: <TrendingUp className="w-5 h-5" />
      });
    } else if (positiveMonths < 6) {
      recommendations.push({
        type: 'danger',
        title: 'Weak Cashflow Forecast',
        description: `Only ${positiveMonths} months show positive cashflow. Focus on closing more deals and reducing expenses.`,
        icon: <TrendingDown className="w-5 h-5" />
      });
    }

    // Sales velocity recommendation
    if (breakevenAnalysis.monthsToBreakeven > 3) {
      recommendations.push({
        type: 'warning',
        title: 'Accelerate Sales',
        description: `At current pace, it will take ${breakevenAnalysis.monthsToBreakeven.toFixed(1)} months to reach break-even. Increase sales activity urgently.`,
        icon: <Lightbulb className="w-5 h-5" />
      });
    }

    return recommendations;
  };

  const recommendations = generateRecommendations();

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-EG', {
      style: 'currency',
      currency: 'EGP',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  return (
    <div className="space-y-6">
      {/* Break-Even Analysis */}
      <div className="bg-gradient-to-r from-blue-50 to-cyan-50 rounded-lg shadow-md p-6 border-2 border-blue-200">
        <div className="flex items-center space-x-2 mb-4">
          <Target className="w-6 h-6 text-blue-600" />
          <h3 className="text-lg font-semibold text-blue-900">Break-Even Analysis</h3>
        </div>
        <p className="text-sm text-blue-700 mb-6">
          Calculate how much you need to sell to cover your expenses
        </p>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
          <div className="bg-white/80 rounded-lg p-4 border border-blue-100">
            <p className="text-sm text-gray-600 mb-1">Monthly Expenses</p>
            <p className="text-2xl font-bold text-blue-600">{formatCurrency(breakevenAnalysis.monthlyExpenses)}</p>
          </div>
          <div className="bg-white/80 rounded-lg p-4 border border-blue-100">
            <p className="text-sm text-gray-600 mb-1">Average Commission Rate</p>
            <p className="text-2xl font-bold text-blue-600">{breakevenAnalysis.averageCommissionRate.toFixed(2)}%</p>
          </div>
          <div className="bg-white/80 rounded-lg p-4 border border-blue-100">
            <p className="text-sm text-gray-600 mb-1">Break-Even Sales Volume</p>
            <p className="text-2xl font-bold text-blue-600">{formatCurrency(breakevenAnalysis.breakevenSalesVolume)}</p>
          </div>
          <div className="bg-white/80 rounded-lg p-4 border border-blue-100">
            <p className="text-sm text-gray-600 mb-1">Current Monthly Sales</p>
            <p className="text-2xl font-bold text-blue-600">{formatCurrency(breakevenAnalysis.currentMonthlySales)}</p>
          </div>
        </div>

        <div className={`rounded-lg p-4 ${breakevenAnalysis.isProfitable ? 'bg-green-50 border-green-200' : 'bg-yellow-50 border-yellow-200'} border-2`}>
          <div className="flex items-center space-x-2">
            {breakevenAnalysis.isProfitable ? (
              <CheckCircle className="w-5 h-5 text-green-600" />
            ) : (
              <AlertTriangle className="w-5 h-5 text-yellow-600" />
            )}
            <p className={`font-semibold ${breakevenAnalysis.isProfitable ? 'text-green-900' : 'text-yellow-900'}`}>
              {breakevenAnalysis.isProfitable 
                ? 'Currently Profitable' 
                : `Need to sell ${formatCurrency(breakevenAnalysis.breakevenSalesVolume)} monthly to break even`}
            </p>
          </div>
        </div>
      </div>

      {/* Cashflow Forecast */}
      <div className="bg-gradient-to-r from-purple-50 to-pink-50 rounded-lg shadow-md p-6 border-2 border-purple-200">
        <div className="flex items-center space-x-2 mb-4">
          <LineChart className="w-6 h-6 text-purple-600" />
          <h3 className="text-lg font-semibold text-purple-900">12-Month Cashflow Forecast</h3>
        </div>
        <p className="text-sm text-purple-700 mb-6">
          Projected cashflow based on commission payout dates and monthly expenses
        </p>

        <div className="space-y-3 max-h-96 overflow-y-auto">
          {cashflowForecast.map((month) => (
            <div
              key={month.month}
              className={`rounded-lg p-4 border-2 ${
                month.isNegative
                  ? 'bg-red-50 border-red-200'
                  : month.netCashflow > 0
                  ? 'bg-green-50 border-green-200'
                  : 'bg-yellow-50 border-yellow-200'
              }`}
            >
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center space-x-2">
                  <Calendar className="w-4 h-4 text-gray-600" />
                  <p className="font-semibold text-gray-900">{month.monthLabel}</p>
                  {month.isNegative && (
                    <AlertTriangle className="w-4 h-4 text-red-600" />
                  )}
                </div>
                <p className={`text-lg font-bold ${
                  month.netCashflow > 0 ? 'text-green-600' : month.netCashflow < 0 ? 'text-red-600' : 'text-yellow-600'
                }`}>
                  {formatCurrency(month.netCashflow)}
                </p>
              </div>
              <div className="grid grid-cols-3 gap-2 text-sm">
                <div>
                  <p className="text-gray-600">Inflow</p>
                  <p className="font-medium text-green-700">{formatCurrency(month.commissionInflow)}</p>
                </div>
                <div>
                  <p className="text-gray-600">Expenses</p>
                  <p className="font-medium text-red-700">{formatCurrency(month.expenses)}</p>
                </div>
                <div>
                  <p className="text-gray-600">Cumulative</p>
                  <p className={`font-medium ${month.cumulativeCashflow >= 0 ? 'text-green-700' : 'text-red-700'}`}>
                    {formatCurrency(month.cumulativeCashflow)}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* AI Recommendations */}
      <div className="bg-gradient-to-r from-indigo-50 to-purple-50 rounded-lg shadow-md p-6 border-2 border-indigo-200">
        <div className="flex items-center space-x-2 mb-4">
          <Bot className="w-6 h-6 text-indigo-600" />
          <h3 className="text-lg font-semibold text-indigo-900">AI Cashflow Recommendations</h3>
        </div>
        <p className="text-sm text-indigo-700 mb-6">
          Smart recommendations to keep your franchise cashflow positive and profitable
        </p>

        <div className="space-y-4">
          {recommendations.map((rec, index) => (
            <div
              key={index}
              className={`border-2 rounded-lg p-4 ${
                rec.type === 'success'
                  ? 'bg-green-50 border-green-200 text-green-900'
                  : rec.type === 'warning'
                  ? 'bg-yellow-50 border-yellow-200 text-yellow-900'
                  : rec.type === 'danger'
                  ? 'bg-red-50 border-red-200 text-red-900'
                  : 'bg-blue-50 border-blue-200 text-blue-900'
              }`}
            >
              <div className="flex items-start space-x-3">
                <div className={`flex-shrink-0 ${
                  rec.type === 'success'
                    ? 'text-green-600'
                    : rec.type === 'warning'
                    ? 'text-yellow-600'
                    : rec.type === 'danger'
                    ? 'text-red-600'
                    : 'text-blue-600'
                }`}>
                  {rec.icon}
                </div>
                <div className="flex-1">
                  <h4 className="font-semibold mb-1">{rec.title}</h4>
                  <p className="text-sm">{rec.description}</p>
                </div>
              </div>
            </div>
          ))}

          {recommendations.length === 0 && (
            <div className="text-center py-8 text-indigo-700">
              <CheckCircle className="w-12 h-12 mx-auto mb-3 opacity-50" />
              <p>Your cashflow forecast looks healthy! Keep up the great work.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

