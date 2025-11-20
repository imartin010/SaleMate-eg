import React, { useState } from 'react';
import { 
  TrendingUp, 
  TrendingDown, 
  AlertTriangle, 
  CheckCircle, 
  Lightbulb,
  DollarSign,
  Users,
  Target,
  Bot,
  Languages
} from 'lucide-react';
import type { FranchiseAnalytics, PerformanceFranchise } from '../../types/performance';

interface AIInsightsProps {
  analytics: FranchiseAnalytics;
  franchise: PerformanceFranchise;
}

type Language = 'en' | 'ar';

interface Insight {
  type: 'success' | 'warning' | 'danger' | 'info';
  title: string;
  description: string;
  recommendation?: string | string[]; // Can be a single string or array of recommendations
  icon: React.ReactNode;
}

export const AIInsights: React.FC<AIInsightsProps> = ({ analytics, franchise }) => {
  const [language, setLanguage] = useState<Language>('en'); // English as default

  // Translations object
  const t = {
    en: {
      title: 'AI Performance Insights',
      subtitle: 'Smart analysis of your franchise performance with actionable recommendations',
      recommendation: '💡 Recommendation:',
      noData: 'Not enough data to generate insights yet. Add more transactions and expenses!',
      insights: {
        excellentProfitMargin: {
          title: 'Excellent Profit Margin',
          description: (margin: number) => `Your net profit margin is ${margin.toFixed(1)}%, which is excellent! You're retaining more than half of your gross revenue.`,
          recommendation: 'Consider reinvesting profits into marketing to accelerate growth.'
        },
        healthyProfitMargin: {
          title: 'Healthy Profit Margin',
          description: (margin: number) => `Your net profit margin is ${margin.toFixed(1)}%, which is above average in the industry.`,
          growthOpportunities: (pendingDeals: number, expectedRevenue: number, headcount: number, revenuePerAgent: number) => {
            const opportunities: string[] = [];
            if (pendingDeals < 5) {
              opportunities.push(`Add ${5 - pendingDeals} more deals to pipeline - focus on lead generation`);
            }
            if (expectedRevenue < 500000) {
              opportunities.push(`Increase future pipeline - target ${Math.round(500000 - expectedRevenue).toLocaleString()} EGP in expected commissions`);
            }
            if (headcount > 0 && revenuePerAgent < 200000) {
              opportunities.push(`Expand team by 1-2 agents - current revenue per agent is ${Math.round(revenuePerAgent).toLocaleString()} EGP, can support growth`);
            }
            if (opportunities.length === 0) {
              opportunities.push('Invest in marketing campaigns to reach new markets');
              opportunities.push('Consider expanding to new geographic areas or property types');
            }
            return opportunities;
          }
        },
        lowProfitMargin: {
          title: 'Low Profit Margin',
          description: (margin: number) => `Your net profit margin is ${margin.toFixed(1)}%. Consider improving expenses to enhance profitability.`,
          reduceVariable: (amount: number) => `Reduce variable expenses by ${amount.toLocaleString()} EGP`,
          reduceAgents: (count: number) => `Reduce number of agents by ${count} agents or increase revenue`,
          addPending: (count: number) => `Add pending deals - need ${count} more deals in pipeline`,
          reduceCuts: (amount: number) => `Reduce commission cuts - current cuts are ${amount.toLocaleString()} EGP`,
          reduceTotal: (amount: number) => `Reduce total expenses by ${amount.toLocaleString()} EGP`
        },
        operatingAtLoss: {
          title: 'Operating at Loss',
          description: 'Your expenses exceed your revenue. Immediate action needed.',
          recommendation: 'Focus on closing more deals and reducing unnecessary expenses.'
        },
        highCostPerAgent: {
          title: 'High Cost Per Agent',
          description: (cost: number) => `At ${cost.toLocaleString()} EGP per agent, your operational costs are high.`,
          reduceVariable: (amount: number) => `Reduce variable expenses by ${amount.toLocaleString()} EGP`,
          reduceAgents: (count: number) => `Reduce number of agents by ${count} agents`,
          target: (target: number, current: number) => `Target: reach ${target.toLocaleString()} EGP per agent instead of ${current.toLocaleString()} EGP`
        },
        optimizedCostPerAgent: {
          title: 'Optimized Agent Cost',
          description: (cost: number) => `Cost per agent (${cost.toLocaleString()} EGP) is well optimized.`,
          investmentStrategies: (headcount: number, revenuePerAgent: number, grossRevenue: number) => {
            const strategies: string[] = [];
            const availableBudget = Math.round(grossRevenue * 0.1); // 10% of revenue for investment
            
            if (headcount > 0) {
              strategies.push(`Increase performance bonuses by ${Math.round(availableBudget / headcount).toLocaleString()} EGP per agent`);
              strategies.push(`Invest ${Math.round(availableBudget * 0.3).toLocaleString()} EGP in advanced training programs`);
            }
            if (revenuePerAgent > 150000) {
              strategies.push(`Hire 1-2 top-performing agents - current team productivity supports expansion`);
            }
            strategies.push(`Allocate ${Math.round(availableBudget * 0.2).toLocaleString()} EGP for sales tools and CRM upgrades`);
            strategies.push(`Create incentive program: top 3 agents get ${Math.round(availableBudget * 0.15).toLocaleString()} EGP bonus each`);
            
            return strategies;
          }
        },
        excellentConversion: {
          title: 'Excellent Conversion Rate',
          description: (rate: number) => `${rate.toFixed(1)}% of your deals convert to contracts. Your sales team is performing exceptionally!`
        },
        lowConversion: {
          title: 'Low Conversion Rate',
          description: (rate: number) => `Only ${rate.toFixed(1)}% of deals are converting. There may be issues in the sales process.`,
          closePending: (count: number) => `Close ${count} of pending deals`,
          addNew: (count: number) => `Add ${count} new deals to pipeline`,
          improveFollowup: (current: number) => `Improve customer follow-up process - current conversion rate ${current.toFixed(1)}% needs to reach at least 50%`
        },
        highCancellation: {
          title: 'High Cancellation Rate',
          description: (rate: number) => `${rate.toFixed(1)}% of your deals are being cancelled. This significantly impacts revenue.`,
          recommendation: (reduction: number) => `Reduce cancellations by ${reduction} deals - review cancellation reasons and improve post-sale customer follow-up`
        },
        highRevenuePerAgent: {
          title: 'High Revenue Per Agent',
          description: (revenue: number) => `Each agent brings an average of ${revenue.toLocaleString()} EGP in commissions.`,
          recommendation: 'Your agents are very productive. Consider expanding the team.'
        },
        lowRevenuePerAgent: {
          title: 'Low Revenue Per Agent',
          description: (revenue: number) => `Average revenue per agent is ${revenue.toLocaleString()} EGP, which is below target.`,
          recommendation: (total: number, target: number) => `Increase total revenue by ${total.toLocaleString()} EGP or reduce number of agents - each agent needs to bring at least ${target.toLocaleString()} EGP`
        },
        strongPipeline: {
          title: 'Strong Future Pipeline',
          description: (amount: number) => `You have ${amount.toLocaleString()} EGP in future commissions, more than double your current net revenue.`,
          recommendation: 'Plan for this flow - consider strategic investments or team expansion.'
        },
        weakPipeline: {
          title: 'Weak Future Pipeline',
          description: 'Expected future commissions are low compared to current expenses.',
          recommendation: (amount: number, deals: number) => `Increase future commissions by ${amount.toLocaleString()} EGP - need ${deals} more deals in pipeline`
        },
        excessiveExpenses: {
          title: 'Excessive Expenses',
          description: (ratio: number) => `Your expenses represent ${ratio.toFixed(1)}% of gross revenue. This is not sustainable.`,
          reduceVariable: (amount: number) => `Reduce variable expenses by ${amount.toLocaleString()} EGP`,
          reduceFixed: (amount: number) => `Reduce fixed expenses by ${amount.toLocaleString()} EGP`,
          reduceAgents: 'Reduce number of agents or review their salaries',
          reduceTotal: (amount: number) => `Reduce total expenses by ${amount.toLocaleString()} EGP`
        },
        optimizedOperations: {
          title: 'Optimized Operations',
          description: (ratio: number) => `Your expenses are only ${ratio.toFixed(1)}% of gross revenue. Excellent cost management!`
        },
        buildDealVolume: {
          title: 'Build Deal Volume',
          description: 'You have a relatively low number of deals in pipeline. Focus on lead generation.',
          recommendation: (count: number) => `Add ${count} deals to pipeline - increase marketing efforts and lead generation activities for agents`
        }
      }
    },
    ar: {
      title: 'تحليلات الأداء بالذكاء الاصطناعي',
      subtitle: 'تحليل ذكي لأداء الفرع مع توصيات قابلة للتطبيق',
      recommendation: '💡 توصية:',
      noData: 'مفيش بيانات كافية لإنشاء تحليلات دلوقتي. زود معاملات ومصروفات أكتر!',
      insights: {
        excellentProfitMargin: {
          title: 'هامش ربح ممتاز',
          description: (margin: number) => `هامش الربح الصافي بتاعك <span dir="ltr">${margin.toFixed(1)}%</span>، ده رائع جداً! أنت محتفظ بأكتر من نص إجمالي الإيرادات.`,
          recommendation: 'فكر في إعادة استثمار الأرباح في التسويق عشان تسرّع النمو.'
        },
        healthyProfitMargin: {
          title: 'هامش ربح صحي',
          description: (margin: number) => `هامش الربح الصافي بتاعك <span dir="ltr">${margin.toFixed(1)}%</span>، ده أعلى من المتوسط في المجال.`,
          growthOpportunities: (pendingDeals: number, expectedRevenue: number, headcount: number, revenuePerAgent: number) => {
            const opportunities: string[] = [];
            if (pendingDeals < 5) {
              opportunities.push(`زود <span dir="ltr">${5 - pendingDeals}</span> صفقة في الخط - ركز على توليد العملاء المحتملين`);
            }
            if (expectedRevenue < 500000) {
              opportunities.push(`زود خط الأنابيب المستقبلي - الهدف <span dir="ltr">${Math.round(500000 - expectedRevenue).toLocaleString()}</span> جنيه في العمولات المتوقعة`);
            }
            if (headcount > 0 && revenuePerAgent < 200000) {
              opportunities.push(`وسّع الفريق بـ <span dir="ltr">1-2</span> وكلاء - الإيرادات لكل عميل حالياً <span dir="ltr">${Math.round(revenuePerAgent).toLocaleString()}</span> جنيه، ممكن تدعم النمو`);
            }
            if (opportunities.length === 0) {
              opportunities.push('استثمر في حملات تسويقية للوصول لأسواق جديدة');
              opportunities.push('فكر في التوسع لمناطق جغرافية جديدة أو أنواع عقارات جديدة');
            }
            return opportunities;
          }
        },
        lowProfitMargin: {
          title: 'هامش ربح منخفض',
          description: (margin: number) => `هامش الربح الصافي بتاعك <span dir="ltr">${margin.toFixed(1)}%</span>. فكر في تحسين المصروفات عشان تحسّن الربحية.`,
          reduceVariable: (amount: number) => `قلل المصروفات المتغيرة بمقدار <span dir="ltr">${amount.toLocaleString()}</span> جنيه`,
          reduceAgents: (count: number) => `قلل عدد الوكلاء بـ <span dir="ltr">${count}</span> وكلاء أو زود الإيرادات`,
          addPending: (count: number) => `زود الصفقات المعلقة - محتاج <span dir="ltr">${count}</span> صفقات أكتر في الخط`,
          reduceCuts: (amount: number) => `قلل عمولات القطع - القطع الحالية <span dir="ltr">${amount.toLocaleString()}</span> جنيه`,
          reduceTotal: (amount: number) => `قلل إجمالي المصروفات بمقدار <span dir="ltr">${amount.toLocaleString()}</span> جنيه`
        },
        operatingAtLoss: {
          title: 'تشغيل بخسارة',
          description: 'المصروفات بتاعتك أكتر من الإيرادات. محتاج إجراء فوري.',
          recommendation: 'ركز على إغلاق صفقات أكتر وتقليل المصروفات غير الضرورية.'
        },
        highCostPerAgent: {
          title: 'تكلفة عالية لكل عميل',
          description: (cost: number) => `بمبلغ <span dir="ltr">${cost.toLocaleString()}</span> جنيه لكل عميل، التكاليف التشغيلية بتاعتك عالية.`,
          reduceVariable: (amount: number) => `قلل المصروفات المتغيرة بمقدار <span dir="ltr">${amount.toLocaleString()}</span> جنيه`,
          reduceAgents: (count: number) => `قلل عدد الوكلاء بـ <span dir="ltr">${count}</span> وكلاء`,
          target: (target: number, current: number) => `الهدف: وصل تكلفة كل عميل لـ <span dir="ltr">${target.toLocaleString()}</span> جنيه بدل <span dir="ltr">${current.toLocaleString()}</span> جنيه`
        },
        optimizedCostPerAgent: {
          title: 'تكلفة عملاء محسّنة',
          description: (cost: number) => `التكلفة لكل عميل (<span dir="ltr">${cost.toLocaleString()}</span> جنيه) محسّنة كويس.`,
          investmentStrategies: (headcount: number, revenuePerAgent: number, grossRevenue: number) => {
            const strategies: string[] = [];
            const availableBudget = Math.round(grossRevenue * 0.1); // 10% of revenue for investment
            
            if (headcount > 0) {
              strategies.push(`زود مكافآت الأداء بـ <span dir="ltr">${Math.round(availableBudget / headcount).toLocaleString()}</span> جنيه لكل عميل`);
              strategies.push(`استثمر <span dir="ltr">${Math.round(availableBudget * 0.3).toLocaleString()}</span> جنيه في برامج تدريب متقدمة`);
            }
            if (revenuePerAgent > 150000) {
              strategies.push(`وظّف <span dir="ltr">1-2</span> وكلاء عالي الأداء - إنتاجية الفريق الحالي تدعم التوسع`);
            }
            strategies.push(`خصص <span dir="ltr">${Math.round(availableBudget * 0.2).toLocaleString()}</span> جنيه لأدوات المبيعات وترقية نظام CRM`);
            strategies.push(`اعمل برنامج حوافز: أفضل <span dir="ltr">3</span> وكلاء يحصلوا على <span dir="ltr">${Math.round(availableBudget * 0.15).toLocaleString()}</span> جنيه مكافأة لكل واحد`);
            
            return strategies;
          }
        },
        excellentConversion: {
          title: 'معدل تحويل ممتاز',
          description: (rate: number) => `<span dir="ltr">${rate.toFixed(1)}%</span> من الصفقات بتاعتك بتتحول لعقود. فريق المبيعات بتاعك بيعمل أداء استثنائي!`
        },
        lowConversion: {
          title: 'معدل تحويل منخفض',
          description: (rate: number) => `فقط <span dir="ltr">${rate.toFixed(1)}%</span> من الصفقات بتتحول. ممكن يكون في مشاكل في عملية المبيعات.`,
          closePending: (count: number) => `غلق <span dir="ltr">${count}</span> من الصفقات المعلقة`,
          addNew: (count: number) => `زود <span dir="ltr">${count}</span> صفقة جديدة في الخط`,
          improveFollowup: (current: number) => `حسّن عملية المتابعة مع العملاء - معدل التحويل الحالي <span dir="ltr">${current.toFixed(1)}%</span> محتاج يوصل <span dir="ltr">50%</span> على الأقل`
        },
        highCancellation: {
          title: 'معدل إلغاء عالي',
          description: (rate: number) => `<span dir="ltr">${rate.toFixed(1)}%</span> من الصفقات بتاعتك بتتلغى. ده بيأثر بشكل كبير على الإيرادات.`,
          recommendation: (reduction: number) => `قلل الإلغاءات بمقدار <span dir="ltr">${reduction}</span> صفقة - راجع أسباب الإلغاء وحسّن متابعة العملاء بعد البيع`
        },
        highRevenuePerAgent: {
          title: 'إيرادات عالية لكل عميل',
          description: (revenue: number) => `كل عميل بيجيب في المتوسط <span dir="ltr">${revenue.toLocaleString()}</span> جنيه من عمولات.`,
          recommendation: 'الوكلاء بتوعك منتجين جداً. فكر في توسيع الفريق.'
        },
        lowRevenuePerAgent: {
          title: 'إيرادات منخفضة لكل عميل',
          description: (revenue: number) => `متوسط الإيرادات لكل عميل <span dir="ltr">${revenue.toLocaleString()}</span> جنيه، ده أقل من الهدف.`,
          recommendation: (total: number, target: number) => `زود إجمالي الإيرادات بمقدار <span dir="ltr">${total.toLocaleString()}</span> جنيه أو قلل عدد الوكلاء - كل عميل محتاج يجيب <span dir="ltr">${target.toLocaleString()}</span> جنيه على الأقل`
        },
        strongPipeline: {
          title: 'خط أنابيب مستقبلي قوي',
          description: (amount: number) => `عندك <span dir="ltr">${amount.toLocaleString()}</span> جنيه في عمولات مستقبلية، أكتر من ضعف صافي الإيرادات الحالية.`,
          recommendation: 'خطط للتدفق ده - فكر في استثمارات استراتيجية أو توسيع الفريق.'
        },
        weakPipeline: {
          title: 'خط أنابيب مستقبلي ضعيف',
          description: 'العمولات المستقبلية المتوقعة قليلة مقارنة بالمصروفات الحالية.',
          recommendation: (amount: number, deals: number) => `زود العمولات المستقبلية بمقدار <span dir="ltr">${amount.toLocaleString()}</span> جنيه - محتاج <span dir="ltr">${deals}</span> صفقة أكتر في الخط`
        },
        excessiveExpenses: {
          title: 'مصروفات مفرطة',
          description: (ratio: number) => `المصروفات بتاعتك بتمثل <span dir="ltr">${ratio.toFixed(1)}%</span> من إجمالي الإيرادات. ده مش مستدام.`,
          reduceVariable: (amount: number) => `قلل المصروفات المتغيرة بمقدار <span dir="ltr">${amount.toLocaleString()}</span> جنيه`,
          reduceFixed: (amount: number) => `قلل المصروفات الثابتة بمقدار <span dir="ltr">${amount.toLocaleString()}</span> جنيه`,
          reduceAgents: 'قلل عدد الوكلاء أو راجع رواتبهم',
          reduceTotal: (amount: number) => `قلل إجمالي المصروفات بمقدار <span dir="ltr">${amount.toLocaleString()}</span> جنيه`
        },
        optimizedOperations: {
          title: 'عمليات محسّنة',
          description: (ratio: number) => `المصروفات بتاعتك بس <span dir="ltr">${ratio.toFixed(1)}%</span> من إجمالي الإيرادات. إدارة تكاليف ممتازة!`
        },
        buildDealVolume: {
          title: 'بناء حجم الصفقات',
          description: 'عندك عدد قليل نسبياً من الصفقات في الخط. ركز على توليد العملاء المحتملين.',
          recommendation: (count: number) => `زود <span dir="ltr">${count}</span> صفقة في الخط - زود جهود التسويق وأنشطة البحث عن عملاء محتملين للوكلاء`
        }
      }
    }
  };

  const generateInsights = (lang: Language): Insight[] => {
    const translations = t[lang];
    const insights: Insight[] = [];

    // 1. Profitability Analysis
    const profitMargin = analytics.gross_revenue > 0 
      ? (analytics.net_revenue / analytics.gross_revenue) * 100 
      : 0;

    if (profitMargin > 50) {
      insights.push({
        type: 'success',
        title: translations.insights.excellentProfitMargin.title,
        description: translations.insights.excellentProfitMargin.description(profitMargin),
        recommendation: translations.insights.excellentProfitMargin.recommendation,
        icon: <CheckCircle className="w-5 h-5" />,
      });
    } else if (profitMargin > 30) {
      const revenuePerAgent = franchise.headcount > 0 
        ? analytics.gross_revenue / franchise.headcount 
        : 0;
      const growthOpportunities = translations.insights.healthyProfitMargin.growthOpportunities(
        analytics.pending_deals_count,
        analytics.expected_revenue,
        franchise.headcount,
        revenuePerAgent
      );
      
      insights.push({
        type: 'success',
        title: translations.insights.healthyProfitMargin.title,
        description: translations.insights.healthyProfitMargin.description(profitMargin),
        recommendation: growthOpportunities,
        icon: <TrendingUp className="w-5 h-5" />,
      });
    } else if (profitMargin > 0) {
      // Generate specific actionable recommendations based on actual data
      const recommendations: string[] = [];
      
      // Check if variable expenses are high
      if (analytics.variable_expenses > analytics.fixed_expenses * 0.5) {
        const targetReduction = Math.round(analytics.variable_expenses * 0.2);
        recommendations.push(translations.insights.lowProfitMargin.reduceVariable(targetReduction));
      }
      
      // Check if headcount is high relative to revenue
      if (franchise.headcount > 0 && analytics.gross_revenue / franchise.headcount < 150000) {
        recommendations.push(translations.insights.lowProfitMargin.reduceAgents(Math.max(1, Math.floor(franchise.headcount * 0.2))));
      }
      
      // Check if pending deals are low
      if (analytics.pending_deals_count < 3) {
        recommendations.push(translations.insights.lowProfitMargin.addPending(5 - analytics.pending_deals_count));
      }
      
      // Check if commission cuts are high
      if (analytics.commission_cuts_total > analytics.gross_revenue * 0.3) {
        recommendations.push(translations.insights.lowProfitMargin.reduceCuts(analytics.commission_cuts_total));
      }
      
      // Default recommendation if no specific issues found
      if (recommendations.length === 0) {
        const targetExpenseReduction = Math.round(analytics.total_expenses * 0.15);
        recommendations.push(translations.insights.lowProfitMargin.reduceTotal(targetExpenseReduction));
      }
      
      insights.push({
        type: 'warning',
        title: translations.insights.lowProfitMargin.title,
        description: translations.insights.lowProfitMargin.description(profitMargin),
        recommendation: recommendations,
        icon: <AlertTriangle className="w-5 h-5" />,
      });
    } else {
      insights.push({
        type: 'danger',
        title: translations.insights.operatingAtLoss.title,
        description: translations.insights.operatingAtLoss.description,
        recommendation: translations.insights.operatingAtLoss.recommendation,
        icon: <TrendingDown className="w-5 h-5" />,
      });
    }

    // 2. Cost Per Agent Analysis
    if (analytics.cost_per_agent > 50000) {
      const targetCostPerAgent = 40000;
      const costGap = analytics.cost_per_agent - targetCostPerAgent;
      const totalReductionNeeded = costGap * franchise.headcount;
      
      const recommendations: string[] = [];
      
      if (analytics.variable_expenses > totalReductionNeeded * 0.5) {
        recommendations.push(translations.insights.highCostPerAgent.reduceVariable(Math.round(analytics.variable_expenses * 0.2)));
      }
      
      if (franchise.headcount > 1) {
        const agentsToReduce = Math.max(1, Math.floor(franchise.headcount * 0.15));
        recommendations.push(translations.insights.highCostPerAgent.reduceAgents(agentsToReduce));
      }
      
      recommendations.push(translations.insights.highCostPerAgent.target(targetCostPerAgent, analytics.cost_per_agent));
      
      insights.push({
        type: 'warning',
        title: translations.insights.highCostPerAgent.title,
        description: translations.insights.highCostPerAgent.description(analytics.cost_per_agent),
        recommendation: recommendations,
        icon: <Users className="w-5 h-5" />,
      });
    } else if (analytics.cost_per_agent < 30000) {
      const revenuePerAgent = franchise.headcount > 0 
        ? analytics.gross_revenue / franchise.headcount 
        : 0;
      const investmentStrategies = translations.insights.optimizedCostPerAgent.investmentStrategies(
        franchise.headcount,
        revenuePerAgent,
        analytics.gross_revenue
      );
      
      insights.push({
        type: 'success',
        title: translations.insights.optimizedCostPerAgent.title,
        description: translations.insights.optimizedCostPerAgent.description(analytics.cost_per_agent),
        recommendation: investmentStrategies,
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
        title: translations.insights.excellentConversion.title,
        description: translations.insights.excellentConversion.description(conversionRate),
        icon: <Target className="w-5 h-5" />,
      });
    } else if (conversionRate < 40) {
      const pendingDeals = analytics.pending_deals_count;
      const neededContracted = Math.ceil((totalDeals * 0.5) - contractedDeals);
      
      const recommendations: string[] = [];
      
      if (pendingDeals > 0) {
        recommendations.push(translations.insights.lowConversion.closePending(Math.min(neededContracted, pendingDeals)));
      }
      
      if (neededContracted > pendingDeals) {
        recommendations.push(translations.insights.lowConversion.addNew(neededContracted - pendingDeals));
      }
      
      recommendations.push(translations.insights.lowConversion.improveFollowup(conversionRate));
      
      insights.push({
        type: 'warning',
        title: translations.insights.lowConversion.title,
        description: translations.insights.lowConversion.description(conversionRate),
        recommendation: recommendations,
        icon: <AlertTriangle className="w-5 h-5" />,
      });
    }

    if (cancellationRate > 20) {
      const targetCancellationRate = 10; // Target 10% cancellation rate
      const currentCancelled = analytics.cancelled_deals_count;
      const targetCancelled = Math.floor(totalDeals * (targetCancellationRate / 100));
      const reductionNeeded = currentCancelled - targetCancelled;
      
      insights.push({
        type: 'danger',
        title: translations.insights.highCancellation.title,
        description: translations.insights.highCancellation.description(cancellationRate),
        recommendation: translations.insights.highCancellation.recommendation(reductionNeeded),
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
        title: translations.insights.highRevenuePerAgent.title,
        description: translations.insights.highRevenuePerAgent.description(revenuePerAgent),
        recommendation: translations.insights.highRevenuePerAgent.recommendation,
        icon: <DollarSign className="w-5 h-5" />,
      });
    } else if (revenuePerAgent < 100000 && franchise.headcount > 0) {
      const targetRevenuePerAgent = 150000;
      const revenueGap = targetRevenuePerAgent - revenuePerAgent;
      const totalRevenueNeeded = revenueGap * franchise.headcount;
      
      insights.push({
        type: 'warning',
        title: translations.insights.lowRevenuePerAgent.title,
        description: translations.insights.lowRevenuePerAgent.description(revenuePerAgent),
        recommendation: translations.insights.lowRevenuePerAgent.recommendation(Math.round(totalRevenueNeeded), targetRevenuePerAgent),
        icon: <Users className="w-5 h-5" />,
      });
    }

    // 5. Expected Revenue Analysis
    if (analytics.expected_revenue > analytics.net_revenue * 2) {
      insights.push({
        type: 'success',
        title: translations.insights.strongPipeline.title,
        description: translations.insights.strongPipeline.description(analytics.expected_revenue),
        recommendation: translations.insights.strongPipeline.recommendation,
        icon: <Lightbulb className="w-5 h-5" />,
      });
    } else if (analytics.expected_revenue < analytics.total_expenses) {
      const revenueGap = analytics.total_expenses - analytics.expected_revenue;
      const neededDeals = Math.ceil(revenueGap / 50000); // Assuming average deal size
      
      insights.push({
        type: 'warning',
        title: translations.insights.weakPipeline.title,
        description: translations.insights.weakPipeline.description,
        recommendation: translations.insights.weakPipeline.recommendation(Math.round(revenueGap), neededDeals),
        icon: <AlertTriangle className="w-5 h-5" />,
      });
    }

    // 6. Expense Management
    const expenseToRevenueRatio = analytics.gross_revenue > 0 
      ? (analytics.total_expenses / analytics.gross_revenue) * 100 
      : 0;

    if (expenseToRevenueRatio > 70) {
      // Calculate specific reduction needed
      const targetExpenseReduction = Math.round(analytics.total_expenses * 0.25);
      const targetRevenue = analytics.gross_revenue * 0.5; // Target 50% expense ratio
      const neededReduction = analytics.total_expenses - targetRevenue;
      
      const recommendations: string[] = [];
      
      if (analytics.variable_expenses > neededReduction * 0.6) {
        recommendations.push(translations.insights.excessiveExpenses.reduceVariable(Math.round(analytics.variable_expenses * 0.3)));
      }
      
      if (analytics.fixed_expenses > neededReduction * 0.4) {
        recommendations.push(translations.insights.excessiveExpenses.reduceFixed(Math.round(analytics.fixed_expenses * 0.2)));
      }
      
      if (franchise.headcount > 0 && analytics.cost_per_agent > 50000) {
        recommendations.push(translations.insights.excessiveExpenses.reduceAgents);
      }
      
      if (recommendations.length === 0) {
        recommendations.push(translations.insights.excessiveExpenses.reduceTotal(Math.round(neededReduction)));
      }
      
      insights.push({
        type: 'danger',
        title: translations.insights.excessiveExpenses.title,
        description: translations.insights.excessiveExpenses.description(expenseToRevenueRatio),
        recommendation: recommendations,
        icon: <AlertTriangle className="w-5 h-5" />,
      });
    } else if (expenseToRevenueRatio < 40) {
      insights.push({
        type: 'success',
        title: translations.insights.optimizedOperations.title,
        description: translations.insights.optimizedOperations.description(expenseToRevenueRatio),
        icon: <CheckCircle className="w-5 h-5" />,
      });
    }

    // 7. General Recommendations
    if (totalDeals < 5) {
      const neededDeals = 5 - totalDeals;
      insights.push({
        type: 'info',
        title: translations.insights.buildDealVolume.title,
        description: translations.insights.buildDealVolume.description,
        recommendation: translations.insights.buildDealVolume.recommendation(neededDeals),
        icon: <Lightbulb className="w-5 h-5" />,
      });
    }

    return insights;
  };

  const insights = generateInsights(language);
  const translations = t[language];

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
    <div className="bg-gradient-to-r from-purple-50 to-pink-50 rounded-lg shadow-md p-6 border-2 border-purple-200" dir={language === 'ar' ? 'rtl' : 'ltr'}>
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center space-x-2">
          <Bot className="w-6 h-6 text-purple-600" />
          <h3 className="text-lg font-semibold text-purple-900">{translations.title}</h3>
        </div>
        <button
          onClick={() => setLanguage(language === 'en' ? 'ar' : 'en')}
          className="flex items-center space-x-2 px-3 py-1.5 rounded-lg bg-purple-100 hover:bg-purple-200 text-purple-700 transition-colors"
          title={language === 'en' ? 'Switch to Arabic' : 'التبديل إلى الإنجليزية'}
        >
          <Languages className="w-4 h-4" />
          <span className="text-sm font-medium">{language === 'en' ? 'AR' : 'EN'}</span>
        </button>
      </div>
      <p className="text-sm text-purple-700 mb-6">
        {translations.subtitle}
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
                <p className="text-sm mb-2" dangerouslySetInnerHTML={{ __html: insight.description }} />
                {insight.recommendation && (
                  <div className="mt-2 pl-4 border-l-2 border-current opacity-75">
                    <p className="text-sm font-medium mb-2">{translations.recommendation}</p>
                    {Array.isArray(insight.recommendation) ? (
                      <ul className="text-sm space-y-1 list-disc list-inside">
                        {insight.recommendation.map((rec, recIndex) => (
                          <li key={recIndex} dangerouslySetInnerHTML={{ __html: rec }} />
                        ))}
                      </ul>
                    ) : (
                      <p className="text-sm" dangerouslySetInnerHTML={{ __html: insight.recommendation }} />
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>
        ))}

        {insights.length === 0 && (
          <div className="text-center py-8 text-purple-700">
            <Lightbulb className="w-12 h-12 mx-auto mb-3 opacity-50" />
            <p>{translations.noData}</p>
          </div>
        )}
      </div>
    </div>
  );
};

