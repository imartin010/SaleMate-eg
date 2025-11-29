import { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { 
  Users, TrendingUp, DollarSign, Clock, Flame, Plus,
  ArrowRight, BarChart3, RefreshCw, Activity
} from 'lucide-react';
import { useLeadStore } from '../../features/leads/store/leads.store';
import { useAuthStore } from '../../features/auth/store/auth.store';
import { 
  useSourcePerformance, 
  useTimeBasedAnalytics,
  DateRange 
} from '../../hooks/crm/useCRMAnalytics';
import { SourcePerformanceChart } from '../../components/crm/analytics/SourcePerformanceChart';
import { TimeSeriesChart } from '../../components/crm/analytics/TimeSeriesChart';
import { subDays, startOfDay, endOfDay } from 'date-fns';
import { supabase } from '../../lib/supabase';
import { PageTitle } from '../../components/common/PageTitle';

interface Lead {
  id: string;
  client_name: string;
  stage: string;
  project_id: string | null;
  created_at: string;
  last_contacted_at: string | null;
}

interface Project {
  id: string;
  name: string;
}

export default function CRMLaunchDashboard() {
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const { leads, fetchLeads, loading: leadsLoading } = useLeadStore();
  const [recentLeads, setRecentLeads] = useState<Lead[]>([]);
  const [projects, setProjects] = useState<Record<string, Project>>({});
  const [loading, setLoading] = useState(true);

  // Date range for analytics (last 30 days)
  const dateRange: DateRange = useMemo(() => {
    const end = endOfDay(new Date());
    const start = startOfDay(subDays(new Date(), 30));
    return { startDate: start, endDate: end };
  }, []);

  // Fetch analytics data
  const sourcePerf = useSourcePerformance(dateRange);
  const timeAnalytics = useTimeBasedAnalytics(dateRange, 'day');

  // Load leads and projects
  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      try {
        // Fetch leads for current user
        if (user?.id) {
          await fetchLeads(user.id, true);
        }

        // Fetch recent leads with more details
        const { data: leadsData, error: leadsError } = await supabase
          .from('leads')
          .select(`
            id,
            client_name,
            stage,
            project_id,
            created_at,
            last_contacted_at
          `)
          .or(`buyer_user_id.eq.${user?.id},assigned_to_id.eq.${user?.id}`)
          .order('created_at', { ascending: false })
          .limit(10);

        if (leadsError) {
          console.error('Error fetching recent leads:', leadsError);
        } else {
          setRecentLeads(leadsData || []);
        }

        // Fetch projects for display
        const { data: projectsData, error: projectsError } = await supabase
          .from('projects')
          .select('id, name')
          .limit(100);

        if (projectsError) {
          console.error('Error fetching projects:', projectsError);
        } else {
          const projectsMap: Record<string, Project> = {};
          (projectsData || []).forEach((p: Project) => {
            projectsMap[p.id] = p;
          });
          setProjects(projectsMap);
        }
      } catch (error) {
        console.error('Error loading dashboard data:', error);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [user?.id, fetchLeads]);

  // Calculate metrics
  const metrics = useMemo(() => {
    const totalLeads = leads.length;
    
    // Active stages: Contacted, Qualified, Viewing Scheduled, Viewing Done, Negotiating, Hot Case
    const activeStages = ['Contacted', 'Qualified', 'Viewing Scheduled', 'Viewing Done', 'Negotiating', 'Hot Case'];
    const activeLeads = leads.filter(l => activeStages.includes(l.stage)).length;
    
    // Conversion rate: Closed Deal / Total Leads
    const closedDeals = leads.filter(l => l.stage === 'Closed Deal').length;
    const conversionRate = totalLeads > 0 ? (closedDeals / totalLeads) * 100 : 0;
    
    // Pipeline value: simplified calculation (can be enhanced later with budget field)
    // For now, we'll use a count-based estimate
    const pipelineValue = activeLeads * 100000; // Placeholder calculation
    
    // Hot leads: Hot Case + Negotiating
    const hotLeads = leads.filter(l => l.stage === 'Hot Case' || l.stage === 'Negotiating').length;
    
    // Response time: average time from created_at to last_contacted_at (simplified)
    // For now, we'll calculate a basic metric
    const leadsWithContact = recentLeads.filter(l => l.last_contacted_at);
    const avgResponseTime = leadsWithContact.length > 0 
      ? leadsWithContact.length // Simplified metric
      : 0;

    return {
      totalLeads,
      activeLeads,
      conversionRate,
      pipelineValue,
      hotLeads,
      avgResponseTime,
    };
  }, [leads, recentLeads]);

  const handleRefresh = () => {
    if (user?.id) {
      fetchLeads(user.id, true);
    }
    sourcePerf.refetch();
    timeAnalytics.refetch();
  };

  const getProjectName = (projectId: string | null): string => {
    if (!projectId) return 'N/A';
    return projects[projectId]?.name || 'Unknown Project';
  };

  const formatDate = (dateString: string | null): string => {
    if (!dateString) return 'Never';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  };

  const getStageColor = (stage: string): string => {
    const stageColors: Record<string, string> = {
      'New Lead': 'bg-gray-100 text-gray-800',
      'Contacted': 'bg-blue-100 text-blue-800',
      'Qualified': 'bg-green-100 text-green-800',
      'Viewing Scheduled': 'bg-purple-100 text-purple-800',
      'Viewing Done': 'bg-indigo-100 text-indigo-800',
      'Negotiating': 'bg-orange-100 text-orange-800',
      'Hot Case': 'bg-red-100 text-red-800',
      'Closed Deal': 'bg-emerald-100 text-emerald-800',
      'Closed Lost': 'bg-gray-100 text-gray-600',
    };
    return stageColors[stage] || 'bg-gray-100 text-gray-800';
  };

  if (loading || leadsLoading) {
    return (
      <div className="min-h-screen bg-gray-50 p-4 md:p-6 lg:p-8 flex items-center justify-center">
        <div className="text-center">
          <RefreshCw className="h-8 w-8 animate-spin text-blue-600 mx-auto mb-4" />
          <p className="text-gray-600">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-4 md:p-6 lg:p-8">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex flex-col md:flex-row md:items-center md:justify-between gap-4"
        >
          <PageTitle
            title="CRM Dashboard"
            subtitle="Overview of your leads and performance"
            icon={BarChart3}
            color="blue"
          />
          <div className="flex items-center gap-3">
            <button
              onClick={handleRefresh}
              className="px-4 py-2 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors flex items-center gap-2"
            >
              <RefreshCw className="h-4 w-4" />
              Refresh
            </button>
            <button
              onClick={() => navigate('/app/crm')}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2"
            >
              View All Leads
              <ArrowRight className="h-4 w-4" />
            </button>
          </div>
        </motion.div>

        {/* Metrics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="bg-white p-6 rounded-xl shadow-sm border border-gray-200"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Total Leads</p>
                <p className="text-3xl font-bold text-gray-900 mt-1">{metrics.totalLeads}</p>
              </div>
              <div className="p-3 rounded-xl bg-blue-100">
                <Users className="h-6 w-6 text-blue-600" />
              </div>
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
                <p className="text-sm text-gray-600">Active Leads</p>
                <p className="text-3xl font-bold text-gray-900 mt-1">{metrics.activeLeads}</p>
              </div>
              <div className="p-3 rounded-xl bg-green-100">
                <Activity className="h-6 w-6 text-green-600" />
              </div>
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
                <p className="text-sm text-gray-600">Conversion Rate</p>
                <p className="text-3xl font-bold text-gray-900 mt-1">
                  {metrics.conversionRate.toFixed(1)}%
                </p>
              </div>
              <div className="p-3 rounded-xl bg-purple-100">
                <TrendingUp className="h-6 w-6 text-purple-600" />
              </div>
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
                <p className="text-sm text-gray-600">Pipeline Value</p>
                <p className="text-3xl font-bold text-gray-900 mt-1">
                  {metrics.pipelineValue.toLocaleString()} EGP
                </p>
              </div>
              <div className="p-3 rounded-xl bg-emerald-100">
                <DollarSign className="h-6 w-6 text-emerald-600" />
              </div>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
            className="bg-white p-6 rounded-xl shadow-sm border border-gray-200"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Response Time</p>
                <p className="text-3xl font-bold text-gray-900 mt-1">
                  {metrics.avgResponseTime > 0 ? `${metrics.avgResponseTime}h` : 'N/A'}
                </p>
              </div>
              <div className="p-3 rounded-xl bg-orange-100">
                <Clock className="h-6 w-6 text-orange-600" />
              </div>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6 }}
            className="bg-white p-6 rounded-xl shadow-sm border border-gray-200"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Hot Leads</p>
                <p className="text-3xl font-bold text-gray-900 mt-1">{metrics.hotLeads}</p>
              </div>
              <div className="p-3 rounded-xl bg-red-100">
                <Flame className="h-6 w-6 text-red-600" />
              </div>
            </div>
          </motion.div>
        </div>

        {/* Quick Actions */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.7 }}
          className="bg-white p-6 rounded-xl shadow-sm border border-gray-200"
        >
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Quick Actions</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <button
              onClick={() => navigate('/app/crm')}
              className="flex items-center gap-3 p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
            >
              <div className="p-2 rounded-lg bg-blue-100">
                <Users className="h-5 w-5 text-blue-600" />
              </div>
              <div className="text-left">
                <p className="font-medium text-gray-900">View All Leads</p>
                <p className="text-sm text-gray-600">Manage your leads</p>
              </div>
            </button>
            <button
              onClick={() => navigate('/app/crm/analysis')}
              className="flex items-center gap-3 p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
            >
              <div className="p-2 rounded-lg bg-purple-100">
                <BarChart3 className="h-5 w-5 text-purple-600" />
              </div>
              <div className="text-left">
                <p className="font-medium text-gray-900">View Analytics</p>
                <p className="text-sm text-gray-600">Detailed insights</p>
              </div>
            </button>
            <button
              onClick={() => navigate('/app/crm')}
              className="flex items-center gap-3 p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
            >
              <div className="p-2 rounded-lg bg-green-100">
                <Plus className="h-5 w-5 text-green-600" />
              </div>
              <div className="text-left">
                <p className="font-medium text-gray-900">Add New Lead</p>
                <p className="text-sm text-gray-600">Create a new lead</p>
              </div>
            </button>
          </div>
        </motion.div>

        {/* Charts Row */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Source Performance */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.8 }}
            className="bg-white p-6 rounded-xl shadow-sm border border-gray-200"
          >
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Lead Source Performance</h2>
            <SourcePerformanceChart
              data={sourcePerf.data}
              loading={sourcePerf.loading}
            />
          </motion.div>

          {/* Time-based Trends */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.9 }}
            className="bg-white p-6 rounded-xl shadow-sm border border-gray-200"
          >
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Lead Trends (Last 30 Days)</h2>
            <TimeSeriesChart
              data={timeAnalytics.data}
              loading={timeAnalytics.loading}
            />
          </motion.div>
        </div>

        {/* Recent Leads */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 1.0 }}
          className="bg-white p-6 rounded-xl shadow-sm border border-gray-200"
        >
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold text-gray-900">Recent Leads</h2>
            <button
              onClick={() => navigate('/app/crm')}
              className="text-blue-600 hover:text-blue-700 text-sm font-medium flex items-center gap-1"
            >
              View All
              <ArrowRight className="h-4 w-4" />
            </button>
          </div>
          {recentLeads.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <Users className="h-12 w-12 mx-auto mb-3 text-gray-400" />
              <p>No leads yet. Start by adding your first lead!</p>
              <button
                onClick={() => navigate('/app/crm')}
                className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                Add Lead
              </button>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-200">
                    <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">Client</th>
                    <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">Project</th>
                    <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">Stage</th>
                    <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">Last Contact</th>
                    <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {recentLeads.map((lead) => (
                    <tr key={lead.id} className="border-b border-gray-100 hover:bg-gray-50">
                      <td className="py-3 px-4">
                        <p className="font-medium text-gray-900">{lead.client_name || 'N/A'}</p>
                      </td>
                      <td className="py-3 px-4">
                        <p className="text-sm text-gray-600">{getProjectName(lead.project_id)}</p>
                      </td>
                      <td className="py-3 px-4">
                        <span className={`inline-flex px-2 py-1 rounded-full text-xs font-medium ${getStageColor(lead.stage)}`}>
                          {lead.stage}
                        </span>
                      </td>
                      <td className="py-3 px-4">
                        <p className="text-sm text-gray-600">{formatDate(lead.last_contacted_at)}</p>
                      </td>
                      <td className="py-3 px-4">
                        <button
                          onClick={() => navigate(`/app/crm`)}
                          className="text-blue-600 hover:text-blue-700 text-sm font-medium"
                        >
                          View
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </motion.div>
      </div>
    </div>
  );
}

