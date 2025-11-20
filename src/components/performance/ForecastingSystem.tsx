import React, { useMemo, useState } from 'react';
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
  Wallet,
  Languages
} from 'lucide-react';
import type { FranchiseAnalytics, PerformanceFranchise, PerformanceTransaction, PerformanceExpense } from '../../types/performance';

type Language = 'en' | 'ar';

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
  const [language, setLanguage] = useState<Language>('en'); // English as default

  // Translations object
  const t = {
    en: {
      breakEven: {
        title: 'Break-Even Analysis',
        subtitle: 'Calculate how much you need to sell to cover your expenses',
        monthlyExpenses: 'Monthly Expenses',
        avgCommissionRate: 'Average Commission Rate',
        breakEvenSales: 'Break-Even Sales Volume',
        currentMonthlySales: 'Current Monthly Sales',
        currentlyProfitable: 'Currently Profitable',
        needToSell: (amount: number) => `Need to sell ${amount.toLocaleString('en-US', { style: 'currency', currency: 'EGP', minimumFractionDigits: 0 })} monthly to break even`
      },
      cashflowForecast: {
        title: '12-Month Cashflow Forecast',
        subtitle: 'Projected cashflow based on commission payout dates and monthly expenses',
        inflow: 'Inflow',
        expenses: 'Expenses',
        cumulative: 'Cumulative'
      },
      recommendations: {
        title: 'AI Cashflow Recommendations',
        subtitle: 'Smart recommendations to keep your franchise cashflow positive and profitable',
        negativeCashflow: (month: string, amount: number) => `Cashflow will be negative in ${month}. You need to close deals worth ${amount.toLocaleString()} EGP to reach break-even.`,
        salesBelowBreakEven: (gap: number, current: number, target: number) => `You need to increase monthly sales by ${gap.toLocaleString()} EGP to reach break-even. Current: ${current.toLocaleString()} EGP, Target: ${target.toLocaleString()} EGP`,
        aboveBreakEven: (amount: number) => `Your current sales volume exceeds break-even by ${amount.toLocaleString()} EGP. Keep up the momentum!`,
        strongCashflow: (months: number) => `${months} out of 12 months show positive cashflow. Your franchise is in a good position for growth.`,
        weakCashflow: (months: number) => `Only ${months} months show positive cashflow. Focus on closing more deals and reducing expenses.`,
        accelerateSales: (months: number) => `At current velocity, it will take ${months.toFixed(1)} months to reach break-even. Increase sales activity urgently.`,
        healthyForecast: 'Your cashflow forecast looks healthy! Keep up the great work.'
      }
    },
    ar: {
      breakEven: {
        title: 'تحليل التعادل',
        subtitle: 'احسب كمية المبيعات المطلوبة لتغطية مصروفاتك',
        monthlyExpenses: 'المصروفات الشهرية',
        avgCommissionRate: 'متوسط معدل العمولة',
        breakEvenSales: 'حجم مبيعات التعادل',
        currentMonthlySales: 'المبيعات الشهرية الحالية',
        currentlyProfitable: 'ربح حالياً',
        needToSell: (amount: number) => `محتاج تبيع <span dir="ltr">${amount.toLocaleString()}</span> جنيه شهرياً عشان توصل للتعادل`
      },
      cashflowForecast: {
        title: 'توقعات التدفق النقدي لـ 12 شهر',
        subtitle: 'التدفق النقدي المتوقع بناءً على تواريخ دفع العمولات والمصروفات الشهرية',
        inflow: 'التدفق الداخل',
        expenses: 'المصروفات',
        cumulative: 'التراكمي'
      },
      recommendations: {
        title: 'توصيات التدفق النقدي بالذكاء الاصطناعي',
        subtitle: 'توصيات ذكية عشان تحافظ على التدفق النقدي للفرع إيجابي ومربح',
        negativeCashflow: (month: string, amount: number) => `التدفق النقدي هيكون سلبي في <span dir="ltr">${month}</span>. محتاج تغلق صفقات بقيمة <span dir="ltr">${amount.toLocaleString()}</span> جنيه عشان توصل لتعادل.`,
        salesBelowBreakEven: (gap: number, current: number, target: number) => `محتاج تزود المبيعات الشهرية بمقدار <span dir="ltr">${gap.toLocaleString()}</span> جنيه عشان توصل للتعادل. الحالي: <span dir="ltr">${current.toLocaleString()}</span> جنيه، الهدف: <span dir="ltr">${target.toLocaleString()}</span> جنيه`,
        aboveBreakEven: (amount: number) => `حجم المبيعات الحالي بتاعك أكتر من التعادل بمقدار <span dir="ltr">${amount.toLocaleString()}</span> جنيه. استمر في الزخم ده!`,
        strongCashflow: (months: number) => `<span dir="ltr">${months}</span> من أصل <span dir="ltr">12</span> شهر بتظهر تدفق نقدي إيجابي. الفرع بتاعك في وضع كويس للنمو.`,
        weakCashflow: (months: number) => `فقط <span dir="ltr">${months}</span> شهور بتظهر تدفق نقدي إيجابي. ركز على إغلاق صفقات أكتر وتقليل المصروفات.`,
        accelerateSales: (months: number) => `بالسرعة الحالية، هياخد <span dir="ltr">${months.toFixed(1)}</span> شهر عشان توصل للتعادل. زود نشاط المبيعات بشكل عاجل.`,
        healthyForecast: 'توقعات التدفق النقدي بتاعتك شايفة صحية! استمر في الشغل الممتاز.'
      }
    }
  };

  const translations = t[language];
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
  const generateRecommendations = (lang: Language) => {
    const tRec = t[lang].recommendations;
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
        title: lang === 'ar' ? 'تنبيه تدفق نقدي سلبي' : 'Negative Cashflow Alert',
        description: tRec.negativeCashflow(firstNegativeMonth.monthLabel, breakevenAnalysis.breakevenSalesVolume),
        icon: <AlertTriangle className="w-5 h-5" />
      });
    }

    // Break-even analysis
    if (breakevenAnalysis.breakevenSalesVolume > breakevenAnalysis.currentMonthlySales) {
      const gap = breakevenAnalysis.breakevenSalesVolume - breakevenAnalysis.currentMonthlySales;
      recommendations.push({
        type: 'warning',
        title: lang === 'ar' ? 'مبيعات أقل من التعادل' : 'Sales Below Break-Even',
        description: tRec.salesBelowBreakEven(gap, breakevenAnalysis.currentMonthlySales, breakevenAnalysis.breakevenSalesVolume),
        icon: <Target className="w-5 h-5" />
      });
    } else {
      recommendations.push({
        type: 'success',
        title: lang === 'ar' ? 'فوق التعادل' : 'Above Break-Even',
        description: tRec.aboveBreakEven(breakevenAnalysis.currentMonthlySales - breakevenAnalysis.breakevenSalesVolume),
        icon: <CheckCircle className="w-5 h-5" />
      });
    }

    // Cashflow health
    const positiveMonths = cashflowForecast.filter(m => m.netCashflow > 0).length;
    if (positiveMonths >= 10) {
      recommendations.push({
        type: 'success',
        title: lang === 'ar' ? 'توقعات تدفق نقدي قوية' : 'Strong Cashflow Forecast',
        description: tRec.strongCashflow(positiveMonths),
        icon: <TrendingUp className="w-5 h-5" />
      });
    } else if (positiveMonths < 6) {
      recommendations.push({
        type: 'danger',
        title: lang === 'ar' ? 'توقعات تدفق نقدي ضعيفة' : 'Weak Cashflow Forecast',
        description: tRec.weakCashflow(positiveMonths),
        icon: <TrendingDown className="w-5 h-5" />
      });
    }

    // Sales velocity recommendation
    if (breakevenAnalysis.monthsToBreakeven > 3) {
      recommendations.push({
        type: 'warning',
        title: lang === 'ar' ? 'تسريع المبيعات' : 'Accelerate Sales',
        description: tRec.accelerateSales(breakevenAnalysis.monthsToBreakeven),
        icon: <Lightbulb className="w-5 h-5" />
      });
    }

    return recommendations;
  };

  const recommendations = generateRecommendations(language);

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
      <div className="bg-gradient-to-r from-blue-50 to-cyan-50 rounded-lg shadow-md p-6 border-2 border-blue-200" dir={language === 'ar' ? 'rtl' : 'ltr'}>
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-2">
            <Target className="w-6 h-6 text-blue-600" />
            <h3 className="text-lg font-semibold text-blue-900">{translations.breakEven.title}</h3>
          </div>
          <button
            onClick={() => setLanguage(language === 'en' ? 'ar' : 'en')}
            className="flex items-center space-x-2 px-3 py-1.5 rounded-lg bg-blue-100 hover:bg-blue-200 text-blue-700 transition-colors"
            title={language === 'en' ? 'Switch to Arabic' : 'التبديل إلى الإنجليزية'}
          >
            <Languages className="w-4 h-4" />
            <span className="text-sm font-medium">{language === 'en' ? 'AR' : 'EN'}</span>
          </button>
        </div>
        <p className="text-sm text-blue-700 mb-6">
          {translations.breakEven.subtitle}
        </p>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
          <div className="bg-white/80 rounded-lg p-4 border border-blue-100">
            <p className="text-sm text-gray-600 mb-1">{translations.breakEven.monthlyExpenses}</p>
            <p className="text-2xl font-bold text-blue-600">{formatCurrency(breakevenAnalysis.monthlyExpenses)}</p>
          </div>
          <div className="bg-white/80 rounded-lg p-4 border border-blue-100">
            <p className="text-sm text-gray-600 mb-1">{translations.breakEven.avgCommissionRate}</p>
            <p className="text-2xl font-bold text-blue-600">{breakevenAnalysis.averageCommissionRate.toFixed(2)}%</p>
          </div>
          <div className="bg-white/80 rounded-lg p-4 border border-blue-100">
            <p className="text-sm text-gray-600 mb-1">{translations.breakEven.breakEvenSales}</p>
            <p className="text-2xl font-bold text-blue-600">{formatCurrency(breakevenAnalysis.breakevenSalesVolume)}</p>
          </div>
          <div className="bg-white/80 rounded-lg p-4 border border-blue-100">
            <p className="text-sm text-gray-600 mb-1">{translations.breakEven.currentMonthlySales}</p>
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
                ? translations.breakEven.currentlyProfitable
                : translations.breakEven.needToSell(breakevenAnalysis.breakevenSalesVolume)}
            </p>
          </div>
        </div>
      </div>

      {/* Cashflow Forecast */}
      <div className="bg-gradient-to-r from-purple-50 to-pink-50 rounded-lg shadow-md p-6 border-2 border-purple-200" dir={language === 'ar' ? 'rtl' : 'ltr'}>
        <div className="flex items-center space-x-2 mb-4">
          <LineChart className="w-6 h-6 text-purple-600" />
          <h3 className="text-lg font-semibold text-purple-900">{translations.cashflowForecast.title}</h3>
        </div>
        <p className="text-sm text-purple-700 mb-6">
          {translations.cashflowForecast.subtitle}
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
                  <p className="text-gray-600">{translations.cashflowForecast.inflow}</p>
                  <p className="font-medium text-green-700">{formatCurrency(month.commissionInflow)}</p>
                </div>
                <div>
                  <p className="text-gray-600">{translations.cashflowForecast.expenses}</p>
                  <p className="font-medium text-red-700">{formatCurrency(month.expenses)}</p>
                </div>
                <div>
                  <p className="text-gray-600">{translations.cashflowForecast.cumulative}</p>
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
      <div className="bg-gradient-to-r from-indigo-50 to-purple-50 rounded-lg shadow-md p-6 border-2 border-indigo-200" dir={language === 'ar' ? 'rtl' : 'ltr'}>
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-2">
            <Bot className="w-6 h-6 text-indigo-600" />
            <h3 className="text-lg font-semibold text-indigo-900">{translations.recommendations.title}</h3>
          </div>
          <button
            onClick={() => setLanguage(language === 'en' ? 'ar' : 'en')}
            className="flex items-center space-x-2 px-3 py-1.5 rounded-lg bg-indigo-100 hover:bg-indigo-200 text-indigo-700 transition-colors"
            title={language === 'en' ? 'Switch to Arabic' : 'التبديل إلى الإنجليزية'}
          >
            <Languages className="w-4 h-4" />
            <span className="text-sm font-medium">{language === 'en' ? 'AR' : 'EN'}</span>
          </button>
        </div>
        <p className="text-sm text-indigo-700 mb-6">
          {translations.recommendations.subtitle}
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
                  <p className="text-sm" dangerouslySetInnerHTML={{ __html: rec.description }} />
                </div>
              </div>
            </div>
          ))}

          {recommendations.length === 0 && (
            <div className="text-center py-8 text-indigo-700">
              <CheckCircle className="w-12 h-12 mx-auto mb-3 opacity-50" />
              <p>{translations.recommendations.healthyForecast}</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

