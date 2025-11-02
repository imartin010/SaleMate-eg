import React, { useState, useEffect } from 'react';
import { BarChart3, Users, TrendingUp, Calendar, Download } from 'lucide-react';
import { supabase } from '../../lib/supabaseClient';
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';

interface AnalyticsData {
  userGrowth: Array<{ date: string; count: number }>;
  revenueData: Array<{ date: string; revenue: number }>;
  projectStats: Array<{ name: string; leads: number; revenue: number }>;
  roleDistribution: Array<{ role: string; count: number }>;
}

export default function Analytics() {
  const [loading, setLoading] = useState(true);
  const [dateRange, setDateRange] = useState<'7d' | '30d' | '90d' | 'all'>('30d');
  const [analytics, setAnalytics] = useState<AnalyticsData>({
    userGrowth: [],
    revenueData: [],
    projectStats: [],
    roleDistribution: [],
  });

  useEffect(() => {
    loadAnalytics();
  }, [dateRange]);

  const loadAnalytics = async () => {
    try {
      setLoading(true);
      const days = dateRange === '7d' ? 7 : dateRange === '30d' ? 30 : dateRange === '90d' ? 90 : 365;
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - days);

      // User growth
      const { data: users } = await supabase
        .from('profiles')
        .select('created_at, role')
        .gte('created_at', startDate.toISOString());

      const userGrowthMap = new Map<string, number>();
      users?.forEach((user) => {
        const date = new Date(user.created_at).toISOString().split('T')[0];
        userGrowthMap.set(date, (userGrowthMap.get(date) || 0) + 1);
      });

      const userGrowth = Array.from(userGrowthMap.entries())
        .map(([date, count]) => ({ date, count }))
        .sort((a, b) => a.date.localeCompare(b.date));

      // Revenue data
      const { data: purchases } = await supabase
        .from('purchase_requests')
        .select('total_amount, created_at, status')
        .eq('status', 'approved')
        .gte('created_at', startDate.toISOString());

      const revenueMap = new Map<string, number>();
      purchases?.forEach((purchase) => {
        const date = new Date(purchase.created_at).toISOString().split('T')[0];
        revenueMap.set(date, (revenueMap.get(date) || 0) + (purchase.total_amount || 0));
      });

      const revenueData = Array.from(revenueMap.entries())
        .map(([date, revenue]) => ({ date, revenue }))
        .sort((a, b) => a.date.localeCompare(b.date));

      // Role distribution
      const roleMap = new Map<string, number>();
      users?.forEach((user) => {
        const role = user.role || 'user';
        roleMap.set(role, (roleMap.get(role) || 0) + 1);
      });

      const roleDistribution = Array.from(roleMap.entries()).map(([role, count]) => ({
        role: role.charAt(0).toUpperCase() + role.slice(1),
        count,
      }));

      // Project stats
      const { data: projectPurchases } = await supabase
        .from('purchase_requests')
        .select('project_id, total_amount, quantity, projects!project_id(name)')
        .eq('status', 'approved')
        .gte('created_at', startDate.toISOString());

      const projectMap = new Map<string, { name: string; leads: number; revenue: number }>();
      projectPurchases?.forEach((purchase: any) => {
        const projectId = purchase.project_id;
        const current = projectMap.get(projectId) || {
          name: purchase.projects?.name || 'Unknown',
          leads: 0,
          revenue: 0,
        };
        current.leads += purchase.quantity || 0;
        current.revenue += purchase.total_amount || 0;
        projectMap.set(projectId, current);
      });

      const projectStats = Array.from(projectMap.values())
        .sort((a, b) => b.revenue - a.revenue)
        .slice(0, 10);

      setAnalytics({
        userGrowth,
        revenueData,
        projectStats,
        roleDistribution,
      });
    } catch (error) {
      console.error('Error loading analytics:', error);
    } finally {
      setLoading(false);
    }
  };

  const COLORS = ['#3b82f6', '#8b5cf6', '#6366f1', '#10b981', '#f59e0b'];

  if (loading) {
    return (
      <div className="p-8 bg-gray-50 min-h-screen">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-gray-200 rounded w-1/4"></div>
          <div className="h-64 bg-gray-200 rounded"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-8 bg-gray-50 min-h-screen space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Analytics</h1>
          <p className="text-gray-600 mt-1">Platform insights and metrics</p>
        </div>
        <div className="flex items-center gap-2">
          <Calendar className="h-5 w-5 text-gray-600" />
          <select
            value={dateRange}
            onChange={(e) => setDateRange(e.target.value as any)}
            className="admin-input"
          >
            <option value="7d">Last 7 days</option>
            <option value="30d">Last 30 days</option>
            <option value="90d">Last 90 days</option>
            <option value="all">All time</option>
          </select>
        </div>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* User Growth */}
        <div className="admin-card p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">User Growth</h3>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={analytics.userGrowth}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="date" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Line type="monotone" dataKey="count" stroke="#3b82f6" strokeWidth={2} name="New Users" />
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* Role Distribution */}
        <div className="admin-card p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">User Roles</h3>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={analytics.roleDistribution}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ role, percent }) => `${role}: ${(percent * 100).toFixed(0)}%`}
                outerRadius={80}
                fill="#8884d8"
                dataKey="count"
              >
                {analytics.roleDistribution.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </div>

        {/* Revenue Trend */}
        <div className="admin-card p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Revenue Trend</h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={analytics.revenueData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="date" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Bar dataKey="revenue" fill="#8b5cf6" name="Revenue (EGP)" />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Top Projects */}
        <div className="admin-card p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Top Projects</h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={analytics.projectStats}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" angle={-45} textAnchor="end" height={100} />
              <YAxis />
              <Tooltip />
              <Legend />
              <Bar dataKey="revenue" fill="#6366f1" name="Revenue (EGP)" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Stats Summary */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="admin-card p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Total Users</p>
              <p className="text-2xl font-bold text-gray-900">
                {analytics.roleDistribution.reduce((sum, r) => sum + r.count, 0)}
              </p>
            </div>
            <Users className="h-8 w-8 text-purple-600" />
          </div>
        </div>
        <div className="admin-card p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Total Revenue</p>
              <p className="text-2xl font-bold text-green-600">
                EGP {analytics.revenueData.reduce((sum, r) => sum + r.revenue, 0).toLocaleString()}
              </p>
            </div>
            <TrendingUp className="h-8 w-8 text-green-600" />
          </div>
        </div>
        <div className="admin-card p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Active Projects</p>
              <p className="text-2xl font-bold text-purple-600">
                {analytics.projectStats.length}
              </p>
            </div>
            <BarChart3 className="h-8 w-8 text-purple-600" />
          </div>
        </div>
        <div className="admin-card p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Avg Revenue/Day</p>
              <p className="text-2xl font-bold text-purple-600">
                EGP {Math.round(
                  analytics.revenueData.reduce((sum, r) => sum + r.revenue, 0) /
                    Math.max(analytics.revenueData.length, 1)
                ).toLocaleString()}
              </p>
            </div>
            <TrendingUp className="h-8 w-8 text-purple-600" />
          </div>
        </div>
      </div>
    </div>
  );
}

