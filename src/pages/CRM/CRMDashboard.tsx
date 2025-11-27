import { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import { 
  BarChart3, RefreshCw, Calendar, Users, TrendingUp, DollarSign,
  ArrowUp, ArrowDown, Loader2
} from 'lucide-react';
import { useAgentPerformance, useSourcePerformance, useTimeBasedAnalytics, DateRange } from '../../hooks/crm/useCRMAnalytics';
import { AgentPerformanceChart } from '../../components/crm/analytics/AgentPerformanceChart';
import { SourcePerformanceChart } from '../../components/crm/analytics/SourcePerformanceChart';
import { TimeSeriesChart } from '../../components/crm/analytics/TimeSeriesChart';
import { ScheduledReportsManager } from '../../components/crm/analytics/ScheduledReportsManager';
import { Button } from '../../components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../components/ui/select';
import { format, subDays, subWeeks, subMonths, startOfDay, endOfDay } from 'date-fns';

type Granularity = 'day' | 'week' | 'month';
type DatePreset = '7d' | '30d' | '90d' | 'custom';

export default function CRMDashboard() {
  const [datePreset, setDatePreset] = useState<DatePreset>('30d');
  const [granularity, setGranularity] = useState<Granularity>('day');
  const [customStartDate, setCustomStartDate] = useState<string>('');
  const [customEndDate, setCustomEndDate] = useState<string>('');

  // Calculate date range based on preset
  const dateRange: DateRange = useMemo(() => {
    const end = endOfDay(new Date());
    let start: Date;

    switch (datePreset) {
      case '7d':
        start = startOfDay(subDays(new Date(), 7));
        break;
      case '30d':
        start = startOfDay(subDays(new Date(), 30));
        break;
      case '90d':
        start = startOfDay(subDays(new Date(), 90));
        break;
      case 'custom':
        if (customStartDate && customEndDate) {
          start = startOfDay(new Date(customStartDate));
          const endDate = endOfDay(new Date(customEndDate));
          return { startDate: start, endDate: endDate };
        }
        start = startOfDay(subDays(new Date(), 30));
        break;
      default:
        start = startOfDay(subDays(new Date(), 30));
    }

    return { startDate: start, endDate: end };
  }, [datePreset, customStartDate, customEndDate]);

  // Fetch analytics data
  const agentPerf = useAgentPerformance(dateRange);
  const sourcePerf = useSourcePerformance(dateRange);
  const timeAnalytics = useTimeBasedAnalytics(dateRange, granularity);

  // Log errors for debugging
  if (agentPerf.error) {
    console.error('Agent Performance Error:', agentPerf.error);
  }
  if (sourcePerf.error) {
    console.error('Source Performance Error:', sourcePerf.error);
  }
  if (timeAnalytics.error) {
    console.error('Time Analytics Error:', timeAnalytics.error);
  }

  // Calculate summary stats
  const summaryStats = useMemo(() => {
    const totalAgents = agentPerf.data.length;
    const totalLeads = agentPerf.data.reduce((sum, agent) => sum + agent.total_leads, 0);
    const totalClosed = agentPerf.data.reduce((sum, agent) => sum + agent.closed_deals, 0);
    const avgConversionRate = totalAgents > 0
      ? agentPerf.data.reduce((sum, agent) => sum + agent.conversion_rate, 0) / totalAgents
      : 0;

    const totalCost = sourcePerf.data.reduce((sum, source) => sum + source.total_cost, 0);
    const totalRevenue = sourcePerf.data.reduce((sum, source) => sum + source.total_revenue, 0);
    const overallROI = totalCost > 0 ? ((totalRevenue - totalCost) / totalCost) * 100 : 0;

    // Time-based trends
    const timeData = timeAnalytics.data;
    let leadsTrend = 0;
    let closedTrend = 0;
    if (timeData.length >= 2) {
      const recent = timeData[timeData.length - 1];
      const previous = timeData[timeData.length - 2];
      leadsTrend = recent.leads_created - previous.leads_created;
      closedTrend = recent.leads_closed - previous.leads_closed;
    }

    return {
      totalAgents,
      totalLeads,
      totalClosed,
      avgConversionRate,
      totalCost,
      totalRevenue,
      overallROI,
      leadsTrend,
      closedTrend,
    };
  }, [agentPerf.data, sourcePerf.data, timeAnalytics.data]);

  const handleRefresh = () => {
    agentPerf.refetch();
    sourcePerf.refetch();
    timeAnalytics.refetch();
  };

  return (
    <div className="min-h-screen bg-gray-50 p-4 md:p-6 lg:p-8">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex flex-col md:flex-row md:items-center md:justify-between gap-4"
        >
          <div>
            <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-2">
              <BarChart3 className="h-8 w-8 text-indigo-600" />
              CRM Dashboard
            </h1>
            <p className="text-gray-600 mt-1">Analytics and performance insights</p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            {/* Date Range Selector */}
            <Select value={datePreset} onValueChange={(value: DatePreset) => setDatePreset(value)}>
              <SelectTrigger className="w-[140px]">
                <Calendar className="h-4 w-4 mr-2" />
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="7d">Last 7 days</SelectItem>
                <SelectItem value="30d">Last 30 days</SelectItem>
                <SelectItem value="90d">Last 90 days</SelectItem>
                <SelectItem value="custom">Custom</SelectItem>
              </SelectContent>
            </Select>

            {datePreset === 'custom' && (
              <div className="flex gap-2">
                <input
                  type="date"
                  value={customStartDate}
                  onChange={(e) => setCustomStartDate(e.target.value)}
                  className="px-3 py-2 border border-gray-300 rounded-md text-sm"
                />
                <input
                  type="date"
                  value={customEndDate}
                  onChange={(e) => setCustomEndDate(e.target.value)}
                  className="px-3 py-2 border border-gray-300 rounded-md text-sm"
                />
              </div>
            )}

            {/* Granularity Selector (for time chart) */}
            <Select value={granularity} onValueChange={(value: Granularity) => setGranularity(value)}>
              <SelectTrigger className="w-[120px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="day">Daily</SelectItem>
                <SelectItem value="week">Weekly</SelectItem>
                <SelectItem value="month">Monthly</SelectItem>
              </SelectContent>
            </Select>

            <Button onClick={handleRefresh} variant="outline" size="sm">
              <RefreshCw className="h-4 w-4 mr-2" />
              Refresh
            </Button>
          </div>
        </motion.div>

        {/* Summary Stats */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="bg-white p-6 rounded-xl shadow-sm border border-gray-200"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Total Agents</p>
                <p className="text-2xl font-bold text-gray-900 mt-1">{summaryStats.totalAgents}</p>
              </div>
              <Users className="h-8 w-8 text-indigo-600" />
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="bg-white p-6 rounded-xl shadow-sm border border-gray-200"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Total Leads</p>
                <p className="text-2xl font-bold text-gray-900 mt-1">{summaryStats.totalLeads}</p>
                {summaryStats.leadsTrend !== 0 && (
                  <div className="flex items-center gap-1 mt-1 text-xs">
                    {summaryStats.leadsTrend > 0 ? (
                      <ArrowUp className="h-3 w-3 text-green-600" />
                    ) : (
                      <ArrowDown className="h-3 w-3 text-red-600" />
                    )}
                    <span className={summaryStats.leadsTrend > 0 ? 'text-green-600' : 'text-red-600'}>
                      {Math.abs(summaryStats.leadsTrend)}
                    </span>
                  </div>
                )}
              </div>
              <TrendingUp className="h-8 w-8 text-blue-600" />
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="bg-white p-6 rounded-xl shadow-sm border border-gray-200"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Avg Conversion Rate</p>
                <p className="text-2xl font-bold text-gray-900 mt-1">
                  {summaryStats.avgConversionRate.toFixed(1)}%
                </p>
              </div>
              <BarChart3 className="h-8 w-8 text-purple-600" />
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="bg-white p-6 rounded-xl shadow-sm border border-gray-200"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Overall ROI</p>
                <p className={`text-2xl font-bold mt-1 ${
                  summaryStats.overallROI >= 0 ? 'text-green-600' : 'text-red-600'
                }`}>
                  {summaryStats.overallROI.toFixed(1)}%
                </p>
              </div>
              <DollarSign className="h-8 w-8 text-green-600" />
            </div>
          </motion.div>
        </div>

        {/* Agent Performance Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="bg-white p-6 rounded-xl shadow-sm border border-gray-200"
        >
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Agent Performance</h2>
          {agentPerf.error && (
            <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg text-red-800 text-sm">
              Error: {agentPerf.error}
            </div>
          )}
          <AgentPerformanceChart
            data={agentPerf.data}
            loading={agentPerf.loading}
          />
        </motion.div>

        {/* Source Performance Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
          className="bg-white p-6 rounded-xl shadow-sm border border-gray-200"
        >
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Source Performance</h2>
          <SourcePerformanceChart
            data={sourcePerf.data}
            loading={sourcePerf.loading}
          />
        </motion.div>

        {/* Time-based Analytics Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.7 }}
          className="bg-white p-6 rounded-xl shadow-sm border border-gray-200"
        >
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Time-Based Analytics</h2>
          <TimeSeriesChart
            data={timeAnalytics.data}
            loading={timeAnalytics.loading}
          />
        </motion.div>

        {/* Scheduled Reports Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.8 }}
          className="bg-white p-6 rounded-xl shadow-sm border border-gray-200"
        >
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Scheduled Reports</h2>
          <ScheduledReportsManager />
        </motion.div>

        {/* Date Range Display */}
        <div className="text-center text-sm text-gray-500">
          Showing data from {format(dateRange.startDate, 'PP')} to {format(dateRange.endDate, 'PP')}
        </div>
      </div>
    </div>
  );
}

