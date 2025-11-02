import React, { useState, useEffect } from 'react';
import { DollarSign, TrendingUp, Users, BarChart3, Calendar, Download } from 'lucide-react';
import { supabase } from '../../lib/supabaseClient';
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

interface FinancialData {
  date: string;
  revenue: number;
  transactions: number;
}

interface TopUser {
  name: string;
  email: string;
  total_spent: number;
}

interface TopProject {
  name: string;
  revenue: number;
  leads_sold: number;
}

export default function FinancialReports() {
  const [loading, setLoading] = useState(true);
  const [dateRange, setDateRange] = useState<'7d' | '30d' | '90d' | 'all'>('30d');
  const [revenueData, setRevenueData] = useState<FinancialData[]>([]);
  const [topUsers, setTopUsers] = useState<TopUser[]>([]);
  const [topProjects, setTopProjects] = useState<TopProject[]>([]);
  const [summary, setSummary] = useState({
    totalRevenue: 0,
    totalTransactions: 0,
    averageTransaction: 0,
    growthRate: 0,
  });

  useEffect(() => {
    loadFinancialData();
  }, [dateRange]);

  const loadFinancialData = async () => {
    try {
      setLoading(true);
      const days = dateRange === '7d' ? 7 : dateRange === '30d' ? 30 : dateRange === '90d' ? 90 : 365;
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - days);

      // Load revenue data
      const { data: purchases } = await supabase
        .from('purchase_requests')
        .select('total_amount, created_at, status')
        .eq('status', 'approved')
        .gte('created_at', startDate.toISOString());

      // Load wallet topups
      const { data: topups } = await supabase
        .from('wallet_topup_requests')
        .select('amount, created_at, status')
        .eq('status', 'approved')
        .gte('created_at', startDate.toISOString());

      // Process revenue by date
      const revenueMap = new Map<string, number>();
      const transactionMap = new Map<string, number>();

      purchases?.forEach((purchase) => {
        const date = new Date(purchase.created_at).toISOString().split('T')[0];
        revenueMap.set(date, (revenueMap.get(date) || 0) + (purchase.total_amount || 0));
        transactionMap.set(date, (transactionMap.get(date) || 0) + 1);
      });

      const revenueChartData = Array.from(revenueMap.entries())
        .map(([date, revenue]) => ({
          date,
          revenue,
          transactions: transactionMap.get(date) || 0,
        }))
        .sort((a, b) => a.date.localeCompare(b.date));

      setRevenueData(revenueChartData);

      // Calculate summary
      const totalRevenue = purchases?.reduce((sum, p) => sum + (p.total_amount || 0), 0) || 0;
      const totalTransactions = purchases?.length || 0;
      const averageTransaction = totalTransactions > 0 ? totalRevenue / totalTransactions : 0;

      // Calculate growth (compare with previous period)
      const previousStartDate = new Date(startDate);
      previousStartDate.setDate(previousStartDate.getDate() - days);
      const { data: previousPurchases } = await supabase
        .from('purchase_requests')
        .select('total_amount, status')
        .eq('status', 'approved')
        .gte('created_at', previousStartDate.toISOString())
        .lt('created_at', startDate.toISOString());

      const previousRevenue = previousPurchases?.reduce((sum, p) => sum + (p.total_amount || 0), 0) || 0;
      const growthRate = previousRevenue > 0 ? ((totalRevenue - previousRevenue) / previousRevenue) * 100 : 0;

      setSummary({
        totalRevenue,
        totalTransactions,
        averageTransaction,
        growthRate,
      });

      // Load top users
      const { data: userPurchases } = await supabase
        .from('purchase_requests')
        .select('user_id, total_amount, profiles!user_id(name, email)')
        .eq('status', 'approved')
        .gte('created_at', startDate.toISOString());

      const userSpending = new Map<string, { name: string; email: string; total: number }>();
      userPurchases?.forEach((purchase: any) => {
        const userId = purchase.user_id;
        const current = userSpending.get(userId) || {
          name: purchase.profiles?.name || 'Unknown',
          email: purchase.profiles?.email || '',
          total: 0,
        };
        current.total += purchase.total_amount || 0;
        userSpending.set(userId, current);
      });

      const topUsersList = Array.from(userSpending.values())
        .sort((a, b) => b.total - a.total)
        .slice(0, 10);

      setTopUsers(topUsersList);

      // Load top projects
      const { data: projectPurchases } = await supabase
        .from('purchase_requests')
        .select('project_id, total_amount, quantity, projects!project_id(name)')
        .eq('status', 'approved')
        .gte('created_at', startDate.toISOString());

      const projectRevenue = new Map<string, { name: string; revenue: number; leads: number }>();
      projectPurchases?.forEach((purchase: any) => {
        const projectId = purchase.project_id;
        const current = projectRevenue.get(projectId) || {
          name: purchase.projects?.name || 'Unknown',
          revenue: 0,
          leads: 0,
        };
        current.revenue += purchase.total_amount || 0;
        current.leads += purchase.quantity || 0;
        projectRevenue.set(projectId, current);
      });

      const topProjectsList = Array.from(projectRevenue.values())
        .sort((a, b) => b.revenue - a.revenue)
        .slice(0, 10);

      setTopProjects(topProjectsList);
    } catch (error) {
      console.error('Error loading financial data:', error);
    } finally {
      setLoading(false);
    }
  };

  const exportReport = () => {
    const report = {
      dateRange,
      summary,
      revenueData,
      topUsers,
      topProjects,
      generatedAt: new Date().toISOString(),
    };

    const blob = new Blob([JSON.stringify(report, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `financial-report-${dateRange}-${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  if (loading) {
    return (
      <div className="p-8">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-gray-200 rounded w-1/4"></div>
          <div className="h-64 bg-gray-200 rounded"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-8 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Financial Reports</h1>
          <p className="text-gray-600 mt-1">Revenue analytics and transaction insights</p>
        </div>
        <button onClick={exportReport} className="admin-btn admin-btn-secondary flex items-center gap-2">
          <Download className="h-4 w-4" />
          Export Report
        </button>
      </div>

      {/* Date Range Filter */}
      <div className="admin-card p-4 flex items-center gap-4">
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

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="admin-card p-6">
          <div className="flex items-center justify-between mb-2">
            <p className="text-sm text-gray-600">Total Revenue</p>
            <DollarSign className="h-6 w-6 text-green-600" />
          </div>
          <p className="text-2xl font-bold text-gray-900">
            EGP {summary.totalRevenue.toLocaleString()}
          </p>
        </div>
        <div className="admin-card p-6">
          <div className="flex items-center justify-between mb-2">
            <p className="text-sm text-gray-600">Total Transactions</p>
            <BarChart3 className="h-6 w-6 text-blue-600" />
          </div>
          <p className="text-2xl font-bold text-gray-900">{summary.totalTransactions}</p>
        </div>
        <div className="admin-card p-6">
          <div className="flex items-center justify-between mb-2">
            <p className="text-sm text-gray-600">Avg Transaction</p>
            <TrendingUp className="h-6 w-6 text-purple-600" />
          </div>
          <p className="text-2xl font-bold text-gray-900">
            EGP {Math.round(summary.averageTransaction).toLocaleString()}
          </p>
        </div>
        <div className="admin-card p-6">
          <div className="flex items-center justify-between mb-2">
            <p className="text-sm text-gray-600">Growth Rate</p>
            <TrendingUp className={`h-6 w-6 ${summary.growthRate >= 0 ? 'text-green-600' : 'text-red-600'}`} />
          </div>
          <p className={`text-2xl font-bold ${summary.growthRate >= 0 ? 'text-green-600' : 'text-red-600'}`}>
            {summary.growthRate >= 0 ? '+' : ''}{summary.growthRate.toFixed(1)}%
          </p>
        </div>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Revenue Chart */}
        <div className="admin-card p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Revenue Trend</h3>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={revenueData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="date" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Line type="monotone" dataKey="revenue" stroke="#3b82f6" strokeWidth={2} name="Revenue (EGP)" />
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* Transactions Chart */}
        <div className="admin-card p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Transactions</h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={revenueData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="date" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Bar dataKey="transactions" fill="#8b5cf6" name="Transactions" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Top Lists */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Top Users */}
        <div className="admin-card p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Top Users by Spending</h3>
          <div className="space-y-3">
            {topUsers.length === 0 ? (
              <p className="text-gray-600 text-center py-8">No data available</p>
            ) : (
              topUsers.map((user, idx) => (
                <div key={idx} className="flex items-center justify-between p-3 bg-gray-50 rounded-xl">
                  <div>
                    <p className="font-medium text-gray-900">{user.name}</p>
                    <p className="text-sm text-gray-600">{user.email}</p>
                  </div>
                  <p className="font-semibold text-purple-600">
                    EGP {user.total_spent.toLocaleString()}
                  </p>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Top Projects */}
        <div className="admin-card p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Top Projects by Revenue</h3>
          <div className="space-y-3">
            {topProjects.length === 0 ? (
              <p className="text-gray-600 text-center py-8">No data available</p>
            ) : (
              topProjects.map((project, idx) => (
                <div key={idx} className="flex items-center justify-between p-3 bg-gray-50 rounded-xl">
                  <div>
                    <p className="font-medium text-gray-900">{project.name}</p>
                    <p className="text-sm text-gray-600">{project.leads_sold} leads sold</p>
                  </div>
                  <p className="font-semibold text-purple-600">
                    EGP {project.revenue.toLocaleString()}
                  </p>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

