import React from 'react';
import { 
  TrendingUp, 
  TrendingDown, 
  AlertTriangle, 
  CheckCircle, 
  Lightbulb,
  DollarSign,
  Users,
  Target,
  Bot
} from 'lucide-react';
import type { FranchiseAnalytics, PerformanceFranchise } from '../../types/performance';

interface AIInsightsProps {
  analytics: FranchiseAnalytics;
  franchise: PerformanceFranchise;
}

interface Insight {
  type: 'success' | 'warning' | 'danger' | 'info';
  title: string;
  description: string;
  recommendation?: string;
  icon: React.ReactNode;
}

export const AIInsights: React.FC<AIInsightsProps> = ({ analytics, franchise }) => {
  const generateInsights = (): Insight[] => {
    const insights: Insight[] = [];

    // 1. Profitability Analysis
    const profitMargin = analytics.gross_revenue > 0 
      ? (analytics.net_revenue / analytics.gross_revenue) * 100 
      : 0;

    if (profitMargin > 50) {
      insights.push({
        type: 'success',
        title: 'Excellent Profit Margin',
        description: `Your net profit margin is ${profitMargin.toFixed(1)}%, which is outstanding! You are keeping more than half of your gross revenue.`,
        recommendation: 'Consider reinvesting profits into marketing to accelerate growth.',
        icon: <CheckCircle className="w-5 h-5" />,
      });
    } else if (profitMargin > 30) {
      insights.push({
        type: 'success',
        title: 'Healthy Profit Margin',
        description: `Your net profit margin is ${profitMargin.toFixed(1)}%, which is above average for the industry.`,
        recommendation: 'Maintain current efficiency while exploring growth opportunities.',
        icon: <TrendingUp className="w-5 h-5" />,
      });
    } else if (profitMargin > 0) {
      insights.push({
        type: 'warning',
        title: 'Low Profit Margin',
        description: `Your net profit margin is ${profitMargin.toFixed(1)}%. Consider optimizing expenses to improve profitability.`,
        recommendation: 'Review variable expenses and look for cost-saving opportunities.',
        icon: <AlertTriangle className="w-5 h-5" />,
      });
    } else {
      insights.push({
        type: 'danger',
        title: 'Operating at a Loss',
        description: 'Your expenses exceed your revenue. Immediate action is required.',
        recommendation: 'Focus on closing more deals and reducing non-essential expenses.',
        icon: <TrendingDown className="w-5 h-5" />,
      });
    }

    // 2. Cost Per Agent Analysis
    if (analytics.cost_per_agent > 50000) {
      insights.push({
        type: 'warning',
        title: 'High Cost Per Agent',
        description: `At EGP ${analytics.cost_per_agent.toLocaleString()} per agent, your operational costs are high.`,
        recommendation: 'Review if all agents are meeting their sales targets. Consider performance-based compensation adjustments.',
        icon: <Users className="w-5 h-5" />,
      });
    } else if (analytics.cost_per_agent < 30000) {
      insights.push({
        type: 'success',
        title: 'Efficient Agent Costs',
        description: `Your cost per agent (EGP ${analytics.cost_per_agent.toLocaleString()}) is well-optimized.`,
        recommendation: 'This efficiency gives you room to invest in top-performing agents.',
        icon: <CheckCircle className="w-5 h-5" />,
      });
    }

    // 3. Deal Conversion Analysis
    const totalDeals = analytics.contracted_deals_count + analytics.pending_deals_count + analytics.cancelled_deals_count;
    const contractedDeals = analytics.contracted_deals_count;
    const cancelledDeals = analytics.cancelled_deals_count;
    const conversionRate = totalDeals > 0 ? (contractedDeals / totalDeals) * 100 : 0;
    const cancellationRate = totalDeals > 0 ? (cancelledDeals / totalDeals) * 100 : 0;

    if (conversionRate > 70) {
      insights.push({
        type: 'success',
        title: 'Excellent Conversion Rate',
        description: `${conversionRate.toFixed(1)}% of your deals are converting to contracts. Your sales team is performing exceptionally well!`,
        icon: <Target className="w-5 h-5" />,
      });
    } else if (conversionRate < 40) {
      insights.push({
        type: 'warning',
        title: 'Low Conversion Rate',
        description: `Only ${conversionRate.toFixed(1)}% of deals are converting. There may be issues in your sales process.`,
        recommendation: "Analyze why deals aren't closing. Consider additional training or adjusting pricing strategies.",
        icon: <AlertTriangle className="w-5 h-5" />,
      });
    }

    if (cancellationRate > 20) {
      insights.push({
        type: 'danger',
        title: 'High Cancellation Rate',
        description: `${cancellationRate.toFixed(1)}% of your deals are being cancelled. This is significantly impacting revenue.`,
        recommendation: 'Investigate cancellation reasons and improve post-sale client management.',
        icon: <TrendingDown className="w-5 h-5" />,
      });
    }

    // 4. Revenue Per Agent
    const revenuePerAgent = franchise.headcount > 0 
      ? analytics.gross_revenue / franchise.headcount 
      : 0;

    if (revenuePerAgent > 200000) {
      insights.push({
        type: 'success',
        title: 'High Revenue Per Agent',
        description: `Each agent generates an average of EGP ${revenuePerAgent.toLocaleString()} in commission revenue.`,
        recommendation: 'Your agents are highly productive. Consider expanding your team.',
        icon: <DollarSign className="w-5 h-5" />,
      });
    } else if (revenuePerAgent < 100000 && franchise.headcount > 0) {
      insights.push({
        type: 'warning',
        title: 'Low Revenue Per Agent',
        description: `Average revenue per agent is EGP ${revenuePerAgent.toLocaleString()}, which is below target.`,
        recommendation: 'Focus on agent training and lead quality improvement.',
        icon: <Users className="w-5 h-5" />,
      });
    }

    // 5. Expected Revenue Analysis
    if (analytics.expected_revenue > analytics.net_revenue * 2) {
      insights.push({
        type: 'success',
        title: 'Strong Future Pipeline',
        description: `You have EGP ${analytics.expected_revenue.toLocaleString()} in future commissions, more than double your current net revenue.`,
        recommendation: 'Plan for this influx - consider strategic investments or team expansion.',
        icon: <Lightbulb className="w-5 h-5" />,
      });
    } else if (analytics.expected_revenue < analytics.total_expenses) {
      insights.push({
        type: 'warning',
        title: 'Weak Future Pipeline',
        description: 'Your expected future commissions are low relative to your current expenses.',
        recommendation: 'Increase sales activity urgently. Focus on moving deals through the pipeline faster.',
        icon: <AlertTriangle className="w-5 h-5" />,
      });
    }

    // 6. Expense Management
    const expenseToRevenueRatio = analytics.gross_revenue > 0 
      ? (analytics.total_expenses / analytics.gross_revenue) * 100 
      : 0;

    if (expenseToRevenueRatio > 70) {
      insights.push({
        type: 'danger',
        title: 'Excessive Expenses',
        description: `Your expenses represent ${expenseToRevenueRatio.toFixed(1)}% of gross revenue. This is unsustainable.`,
        recommendation: 'Conduct an immediate expense audit. Cut non-essential costs.',
        icon: <AlertTriangle className="w-5 h-5" />,
      });
    } else if (expenseToRevenueRatio < 40) {
      insights.push({
        type: 'success',
        title: 'Lean Operations',
        description: `Your expenses are only ${expenseToRevenueRatio.toFixed(1)}% of gross revenue. Excellent cost management!`,
        icon: <CheckCircle className="w-5 h-5" />,
      });
    }

    // 7. General Recommendations
    if (totalDeals < 5) {
      insights.push({
        type: 'info',
        title: 'Build Deal Volume',
        description: 'You have relatively few deals in the pipeline. Focus on lead generation.',
        recommendation: 'Increase marketing efforts and agent prospecting activities.',
        icon: <Lightbulb className="w-5 h-5" />,
      });
    }

    return insights;
  };

  const insights = generateInsights();

  const getInsightStyle = (type: Insight['type']) => {
    switch (type) {
      case 'success':
        return 'bg-green-50 border-green-200 text-green-900';
      case 'warning':
        return 'bg-yellow-50 border-yellow-200 text-yellow-900';
      case 'danger':
        return 'bg-red-50 border-red-200 text-red-900';
      case 'info':
        return 'bg-blue-50 border-blue-200 text-blue-900';
    }
  };

  const getIconColor = (type: Insight['type']) => {
    switch (type) {
      case 'success':
        return 'text-green-600';
      case 'warning':
        return 'text-yellow-600';
      case 'danger':
        return 'text-red-600';
      case 'info':
        return 'text-blue-600';
    }
  };

  return (
    <div className="bg-gradient-to-r from-purple-50 to-pink-50 rounded-lg shadow-md p-6 border-2 border-purple-200">
      <div className="flex items-center space-x-2 mb-4">
        <Bot className="w-6 h-6 text-purple-600" />
        <h3 className="text-lg font-semibold text-purple-900">AI Performance Insights</h3>
      </div>
      <p className="text-sm text-purple-700 mb-6">
        Smart analysis of your franchise performance with actionable recommendations
      </p>

      <div className="space-y-4">
        {insights.map((insight, index) => (
          <div
            key={index}
            className={`border-2 rounded-lg p-4 ${getInsightStyle(insight.type)}`}
          >
            <div className="flex items-start space-x-3">
              <div className={`flex-shrink-0 ${getIconColor(insight.type)}`}>
                {insight.icon}
              </div>
              <div className="flex-1">
                <h4 className="font-semibold mb-1">{insight.title}</h4>
                <p className="text-sm mb-2">{insight.description}</p>
                {insight.recommendation && (
                  <div className="mt-2 pl-4 border-l-2 border-current opacity-75">
                    <p className="text-sm font-medium">💡 Recommendation:</p>
                    <p className="text-sm">{insight.recommendation}</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        ))}

        {insights.length === 0 && (
          <div className="text-center py-8 text-purple-700">
            <Lightbulb className="w-12 h-12 mx-auto mb-3 opacity-50" />
            <p>Not enough data to generate insights yet. Add more transactions and expenses!</p>
          </div>
        )}
      </div>
    </div>
  );
};

