import { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import { 
  BarChart3, RefreshCw, Calendar, Users, TrendingUp,
  ArrowUp, ArrowDown, Download
} from 'lucide-react';
import { 
  useAgentPerformance, 
  useSourcePerformance, 
  useTimeBasedAnalytics,
  useProjectPerformance,
  useAreaPerformance,
  useDeveloperPerformance,
  useAgentRevenue,
  DateRange 
} from '../../hooks/crm/useCRMAnalytics';
import { AgentPerformanceChart } from '../../components/crm/analytics/AgentPerformanceChart';
import { SourcePerformanceChart } from '../../components/crm/analytics/SourcePerformanceChart';
import { TimeSeriesChart } from '../../components/crm/analytics/TimeSeriesChart';
import { ProjectPerformanceChart } from '../../components/crm/analytics/ProjectPerformanceChart';
import { AreaPerformanceChart } from '../../components/crm/analytics/AreaPerformanceChart';
import { DeveloperPerformanceChart } from '../../components/crm/analytics/DeveloperPerformanceChart';
import { AgentRevenueChart } from '../../components/crm/analytics/AgentRevenueChart';
import { ScheduledReportsManager } from '../../components/crm/analytics/ScheduledReportsManager';
import { Button } from '../../components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../components/ui/select';
import { format, subDays, startOfDay, endOfDay } from 'date-fns';

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
  const projectPerf = useProjectPerformance(dateRange);
  const areaPerf = useAreaPerformance(dateRange);
  const developerPerf = useDeveloperPerformance(dateRange);
  const agentRevenue = useAgentRevenue(dateRange);

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
      leadsTrend,
      closedTrend,
    };
  }, [agentPerf.data, sourcePerf.data, timeAnalytics.data]);

  const handleRefresh = () => {
    agentPerf.refetch();
    sourcePerf.refetch();
    timeAnalytics.refetch();
    projectPerf.refetch();
    areaPerf.refetch();
    developerPerf.refetch();
    agentRevenue.refetch();
  };

  const handleExportReport = () => {
    const sections: string[] = [];
    const dateRangeStr = `${format(dateRange.startDate, 'yyyy-MM-dd')}_to_${format(dateRange.endDate, 'yyyy-MM-dd')}`;

    // Helper function to escape CSV values
    const escapeCSV = (value: any): string => {
      if (value === null || value === undefined) return '';
      const str = String(value);
      if (str.includes(',') || str.includes('"') || str.includes('\n')) {
        return `"${str.replace(/"/g, '""')}"`;
      }
      return str;
    };

    // Helper function to create CSV section
    const createSection = (title: string, headers: string[], rows: any[][]): string => {
      const section = [
        `\n=== ${title} ===`,
        headers.map(escapeCSV).join(','),
        ...rows.map(row => row.map(escapeCSV).join(','))
      ].join('\n');
      return section;
    };

    // 1. Summary Statistics
    sections.push(createSection(
      'Summary Statistics',
      ['Metric', 'Value'],
      [
        ['Total Agents', summaryStats.totalAgents],
        ['Total Leads', summaryStats.totalLeads],
        ['Total Closed Deals', summaryStats.totalClosed],
        ['Average Conversion Rate', `${summaryStats.avgConversionRate.toFixed(2)}%`],
        ['Date Range', `${format(dateRange.startDate, 'PP')} to ${format(dateRange.endDate, 'PP')}`],
      ]
    ));

    // 2. Agent Performance
    if (agentPerf.data.length > 0) {
      sections.push(createSection(
        'Agent Performance',
        ['Agent Name', 'Total Leads', 'Closed Deals', 'Conversion Rate %', 'Avg Response Time (hours)', 'Avg Time to Close (days)'],
        agentPerf.data.map(agent => [
          agent.agent_name || 'Unknown',
          agent.total_leads,
          agent.closed_deals,
          agent.conversion_rate.toFixed(2),
          agent.avg_response_time ? agent.avg_response_time.toFixed(2) : 'N/A',
          agent.avg_time_to_close ? agent.avg_time_to_close.toFixed(2) : 'N/A',
        ])
      ));
    }

    // 3. Source Performance
    if (sourcePerf.data.length > 0) {
      sections.push(createSection(
        'Source Performance',
        ['Source', 'Total Leads', 'Closed Deals', 'Conversion Rate %', 'Total Cost', 'Total Revenue', 'Closed Deals Revenue', 'ROI %'],
        sourcePerf.data.map(source => [
          source.source ? source.source.charAt(0).toUpperCase() + source.source.slice(1) : 'Unknown',
          source.total_leads,
          source.closed_deals,
          typeof source.conversion_rate === 'string' ? parseFloat(source.conversion_rate).toFixed(2) : source.conversion_rate.toFixed(2),
          source.total_cost,
          source.total_revenue,
          source.closed_deals_revenue,
          typeof source.roi_percentage === 'string' ? parseFloat(source.roi_percentage).toFixed(2) : source.roi_percentage.toFixed(2),
        ])
      ));
    }

    // 4. Time-Based Analytics
    if (timeAnalytics.data.length > 0) {
      sections.push(createSection(
        'Time-Based Analytics',
        ['Period', 'Leads Created', 'Leads Closed', 'Conversion Rate %'],
        timeAnalytics.data.map(period => [
          period.period_start,
          period.leads_created,
          period.leads_closed,
          period.conversion_rate ? period.conversion_rate.toFixed(2) : '0.00',
        ])
      ));
    }

    // 5. Project Performance
    if (projectPerf.data.length > 0) {
      sections.push(createSection(
        'Project Performance',
        ['Project Name', 'Total Leads', 'Closed Deals', 'Conversion Rate %'],
        projectPerf.data.map(project => [
          project.project_name || 'Unknown',
          project.total_leads,
          project.closed_deals,
          project.conversion_rate.toFixed(2),
        ])
      ));
    }

    // 6. Area Performance
    if (areaPerf.data.length > 0) {
      sections.push(createSection(
        'Area Performance',
        ['Area', 'Total Leads', 'Closed Deals', 'Conversion Rate %'],
        areaPerf.data.map(area => [
          area.area || 'Unknown',
          area.total_leads,
          area.closed_deals,
          area.conversion_rate.toFixed(2),
        ])
      ));
    }

    // 7. Developer Performance
    if (developerPerf.data.length > 0) {
      sections.push(createSection(
        'Developer Performance',
        ['Developer', 'Total Leads', 'Closed Deals', 'Conversion Rate %'],
        developerPerf.data.map(dev => [
          dev.developer || 'Unknown',
          dev.total_leads,
          dev.closed_deals,
          dev.conversion_rate.toFixed(2),
        ])
      ));
    }

    // 8. Agent Revenue
    if (agentRevenue.data.length > 0) {
      sections.push(createSection(
        'Agent Revenue',
        ['Agent Name', 'Total Revenue', 'Closed Deals Revenue', 'Avg Revenue per Lead', 'Avg Revenue per Closed Deal'],
        agentRevenue.data.map(agent => [
          agent.agent_name || 'Unknown',
          agent.total_revenue,
          agent.closed_deals_revenue,
          agent.avg_revenue_per_lead ? agent.avg_revenue_per_lead.toFixed(2) : '0.00',
          agent.avg_revenue_per_closed_deal ? agent.avg_revenue_per_closed_deal.toFixed(2) : '0.00',
        ])
      ));
    }

    // Combine all sections
    const csvContent = [
      `Analysis Report - ${dateRangeStr}`,
      `Generated on ${format(new Date(), 'PPpp')}`,
      ...sections
    ].join('\n');

    // Create and download file
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `analysis-report-${dateRangeStr}-${format(new Date(), 'yyyy-MM-dd')}.csv`;
    link.click();
    window.URL.revokeObjectURL(url);
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
              Analysis
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
            <Button onClick={handleExportReport} variant="default" size="sm" className="bg-indigo-600 hover:bg-indigo-700">
              <Download className="h-4 w-4 mr-2" />
              Export Report
            </Button>
          </div>
        </motion.div>

        {/* Summary Stats */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
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
          {sourcePerf.error && (
            <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg text-red-800 text-sm">
              Error: {sourcePerf.error}
            </div>
          )}
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
          {timeAnalytics.error && (
            <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg text-red-800 text-sm">
              Error: {timeAnalytics.error}
            </div>
          )}
          <TimeSeriesChart
            data={timeAnalytics.data}
            loading={timeAnalytics.loading}
          />
        </motion.div>

        {/* Project Performance Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.8 }}
          className="bg-white p-6 rounded-xl shadow-sm border border-gray-200"
        >
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Project Performance</h2>
          {projectPerf.error && (
            <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg text-red-800 text-sm">
              Error: {projectPerf.error}
            </div>
          )}
          <ProjectPerformanceChart
            data={projectPerf.data}
            loading={projectPerf.loading}
          />
        </motion.div>

        {/* Area Performance Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.9 }}
          className="bg-white p-6 rounded-xl shadow-sm border border-gray-200"
        >
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Area Performance</h2>
          {areaPerf.error && (
            <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg text-red-800 text-sm">
              Error: {areaPerf.error}
            </div>
          )}
          <AreaPerformanceChart
            data={areaPerf.data}
            loading={areaPerf.loading}
          />
        </motion.div>

        {/* Developer Performance Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 1.0 }}
          className="bg-white p-6 rounded-xl shadow-sm border border-gray-200"
        >
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Developer Performance</h2>
          {developerPerf.error && (
            <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg text-red-800 text-sm">
              Error: {developerPerf.error}
            </div>
          )}
          <DeveloperPerformanceChart
            data={developerPerf.data}
            loading={developerPerf.loading}
          />
        </motion.div>

        {/* Agent Revenue Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 1.1 }}
          className="bg-white p-6 rounded-xl shadow-sm border border-gray-200"
        >
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Revenue per Agent</h2>
          {agentRevenue.error && (
            <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg text-red-800 text-sm">
              Error: {agentRevenue.error}
            </div>
          )}
          <AgentRevenueChart
            data={agentRevenue.data}
            loading={agentRevenue.loading}
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

