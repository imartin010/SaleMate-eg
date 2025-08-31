import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { useAuthStore } from '../store/auth';
import { useLeadStore } from '../store/leads';
import { useProjectStore } from '../store/projects';
import { useOrderStore } from '../store/orders';
import { supabase } from '../lib/supabaseClient';
import { Lead, Order, Project } from '../types';
import { formatCurrency } from '../lib/format';
import { calculateTotalAmount } from '../lib/payments';
import {
  Users,
  ShoppingCart,
  TrendingUp,
  Target,
  Clock,
  CheckCircle,
  ArrowRight,
  Activity,
  RefreshCw,
  AlertCircle,
  Sparkles,
  BarChart3,
  DollarSign,
  Calendar
} from 'lucide-react';
import { Button } from '../components/ui/button';

const Dashboard: React.FC = () => {
  const { user, profile } = useAuthStore();
  const { leads, fetchLeads } = useLeadStore();
  const { projects, fetchProjects } = useProjectStore();
  const { orders, fetchOrders } = useOrderStore();
  
  const [stats, setStats] = useState({
    totalLeads: 0,
    hotLeads: 0,
    totalSpent: 0,
    thisMonthOrders: 0,
    availableProjects: 0,
    conversionRate: 0,
  });
  
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (user) {
      loadDashboardData();
    }
  }, [user]);

  const loadDashboardData = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Fetch all data in parallel
      await Promise.all([
        fetchLeads(user?.role === 'user' ? user.id : undefined),
        fetchProjects(),
        fetchOrders(user?.role === 'user' ? user.id : undefined)
      ]);
      
    } catch (err) {
      console.error('Error loading dashboard data:', err);
      setError('Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!user || !leads || !orders || !projects) return;

    // Calculate stats from real data
    let userLeads = leads;
    let userOrders = orders;

    // Filter based on user role
    if (user.role === 'user') {
      userLeads = leads.filter(lead => lead.buyerUserId === user.id);
      userOrders = orders.filter(order => order.userId === user.id);
    } else if (user.role === 'manager') {
      // For managers, we need to fetch team data from Supabase
      // This will be handled by the backend RLS policies
      userLeads = leads;
      userOrders = orders;
    }

    const hotLeads = userLeads.filter(lead => lead.stage === 'Hot Case').length;
    const totalSpent = userOrders
      .filter(order => order.status === 'confirmed')
      .reduce((sum, order) => sum + (order.totalAmount || calculateTotalAmount(order.quantity)), 0);

    const thisMonth = new Date();
    thisMonth.setDate(1);
    thisMonth.setHours(0, 0, 0, 0);
    
    const thisMonthOrders = userOrders.filter(
      order => new Date(order.createdAt) >= thisMonth
    ).length;

    const availableProjects = projects.filter(p => p.availableLeads > 0).length;
    
    const completedLeads = userLeads.filter(lead => lead.stage === 'Meeting Done').length;
    const conversionRate = userLeads.length > 0 ? (completedLeads / userLeads.length) * 100 : 0;

    setStats({
      totalLeads: userLeads.length,
      hotLeads,
      totalSpent,
      thisMonthOrders,
      availableProjects,
      conversionRate,
    });
  }, [user, leads, orders, projects]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <RefreshCw className="h-8 w-8 mx-auto mb-4 animate-spin text-primary" />
          <p className="text-muted-foreground">Loading your dashboard...</p>
        </div>
      </div>
    );
  }

  if (!user) return null;

  const statCards = [
    {
      title: 'Total Leads',
      value: stats.totalLeads.toString(),
      description: 'Leads in your pipeline',
      icon: Users,
      color: 'text-blue-600',
      bgColor: 'bg-gradient-to-br from-blue-50 to-blue-100',
      borderColor: 'border-blue-200',
      gradient: 'from-blue-500 to-blue-600',
    },
    {
      title: 'Hot Leads',
      value: stats.hotLeads.toString(),
      description: 'Ready to close',
      icon: Target,
      color: 'text-red-600',
      bgColor: 'bg-gradient-to-br from-red-50 to-red-100',
      borderColor: 'border-red-200',
      gradient: 'from-red-500 to-red-600',
    },
    {
      title: 'Total Spent',
      value: formatCurrency(stats.totalSpent),
      description: 'On lead purchases',
      icon: DollarSign,
      color: 'text-green-600',
      bgColor: 'bg-gradient-to-br from-green-50 to-green-100',
      borderColor: 'border-green-200',
      gradient: 'from-green-500 to-green-600',
    },
    {
      title: 'This Month',
      value: stats.thisMonthOrders.toString(),
      description: 'New orders',
      icon: Calendar,
      color: 'text-purple-600',
      bgColor: 'bg-gradient-to-br from-purple-50 to-purple-100',
      borderColor: 'border-purple-200',
      gradient: 'from-purple-500 to-purple-600',
    },
    {
      title: 'Available Projects',
      value: stats.availableProjects.toString(),
      description: 'With leads to buy',
      icon: TrendingUp,
      color: 'text-indigo-600',
      bgColor: 'bg-gradient-to-br from-indigo-50 to-indigo-100',
      borderColor: 'border-indigo-200',
      gradient: 'from-indigo-500 to-indigo-600',
    },
    {
      title: 'Conversion Rate',
      value: `${stats.conversionRate.toFixed(1)}%`,
      description: 'Leads to meetings',
      icon: BarChart3,
      color: 'text-emerald-600',
      bgColor: 'bg-gradient-to-br from-emerald-50 to-emerald-100',
      borderColor: 'border-emerald-200',
      gradient: 'from-emerald-500 to-emerald-600',
    },
  ];

  // Get user's display name with debugging
  const displayName = profile?.name || user.user_metadata?.name || user.email?.split('@')[0] || 'User';
  
  // Debug logging
  console.log('Dashboard Debug:', {
    profile: profile,
    userMetadata: user.user_metadata,
    userEmail: user.email,
    displayName: displayName
  });

  return (
    <div className="space-y-8 p-6">
      {/* Welcome Header */}
      <div className="text-center space-y-4">
        <div className="inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-full border border-blue-200">
          <Sparkles className="h-4 w-4 text-blue-600" />
          <span className="text-sm font-medium text-blue-700">Dashboard</span>
        </div>
        <h1 className="text-4xl md:text-5xl font-bold bg-gradient-to-r from-gray-900 via-blue-800 to-indigo-900 bg-clip-text text-transparent">
          Welcome back, {displayName}! 👋
        </h1>
        <p className="text-lg text-gray-600 max-w-2xl mx-auto">
          Here's what's happening with your real estate business today. Track your progress and stay ahead of the competition.
        </p>
        <div className="flex items-center justify-center gap-2 mt-4">
          <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
          <span className="text-sm text-green-600 font-medium">Live data from Supabase</span>
        </div>
      </div>

      {/* Error Display */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-4 flex items-center gap-3 shadow-sm">
          <AlertCircle className="h-5 w-5 text-red-600" />
          <span className="text-red-800">{error}</span>
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={loadDashboardData}
            className="ml-auto text-red-600 hover:text-red-700 hover:bg-red-100"
          >
            <RefreshCw className="h-4 w-4 mr-2" />
            Retry
          </Button>
        </div>
      )}

      {/* Stats Grid */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {statCards.map((stat) => {
          const Icon = stat.icon;
          return (
            <div key={stat.title} className="group">
              <div className={`relative overflow-hidden rounded-2xl border ${stat.borderColor} bg-white shadow-sm hover:shadow-lg transition-all duration-300 p-6 h-full group-hover:scale-[1.02]`}>
                <div className="absolute inset-0 bg-gradient-to-br from-transparent to-white/50 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                <div className="relative">
                  <div className="flex items-center justify-between mb-4">
                    <div className={`p-3 rounded-2xl ${stat.bgColor} group-hover:scale-110 transition-transform duration-300 shadow-sm`}>
                      <Icon className={`h-6 w-6 ${stat.color}`} />
                    </div>
                    <div className="text-right">
                      <div className="text-3xl font-bold text-gray-900">{stat.value}</div>
                      <p className="text-sm text-gray-600 font-medium">
                        {stat.title}
                      </p>
                    </div>
                  </div>
                  <p className="text-sm text-gray-500 leading-relaxed">
                    {stat.description}
                  </p>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Quick Actions & Recent Activity */}
      <div className="grid gap-8 md:grid-cols-2">
        {/* Quick Actions */}
        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm hover:shadow-lg transition-shadow duration-300 p-6">
          <div className="flex items-center gap-3 mb-6">
            <div className="p-3 rounded-xl bg-gradient-to-br from-blue-50 to-indigo-50">
              <Activity className="h-6 w-6 text-blue-600" />
            </div>
            <div>
              <h3 className="text-xl font-semibold text-gray-900">Quick Actions</h3>
              <p className="text-sm text-gray-600">Common tasks to get you started</p>
            </div>
          </div>
          
          <div className="space-y-4">
            <div className="group flex items-center justify-between p-4 rounded-xl bg-gradient-to-r from-blue-50 to-indigo-50 hover:from-blue-100 hover:to-indigo-100 transition-all duration-300 cursor-pointer border border-blue-100 hover:border-blue-200">
              <div>
                <p className="font-semibold text-gray-900">Buy New Leads</p>
                <p className="text-sm text-gray-600">Browse available projects</p>
              </div>
              <div className="p-2 rounded-full bg-white shadow-sm group-hover:scale-110 transition-transform duration-300">
                <ShoppingCart className="h-5 w-5 text-blue-600" />
              </div>
            </div>
            
            <div className="group flex items-center justify-between p-4 rounded-xl bg-gradient-to-r from-green-50 to-emerald-50 hover:from-green-100 hover:to-emerald-100 transition-all duration-300 cursor-pointer border border-green-100 hover:border-green-200">
              <div>
                <p className="font-semibold text-gray-900">Update Lead Status</p>
                <p className="text-sm text-gray-600">Manage your pipeline</p>
              </div>
              <div className="p-2 rounded-full bg-white shadow-sm group-hover:scale-110 transition-transform duration-300">
                <Users className="h-5 w-5 text-green-600" />
              </div>
            </div>
            
            <div className="group flex items-center justify-between p-4 rounded-xl bg-gradient-to-r from-purple-50 to-violet-50 hover:from-purple-100 hover:to-violet-100 transition-all duration-300 cursor-pointer border border-purple-100 hover:border-purple-200">
              <div>
                <p className="font-semibold text-gray-900">Join Community</p>
                <p className="text-sm text-gray-600">Connect with other agents</p>
              </div>
              <div className="p-2 rounded-full bg-white shadow-sm group-hover:scale-110 transition-transform duration-300">
                <TrendingUp className="h-5 w-5 text-purple-600" />
              </div>
            </div>
          </div>
        </div>

        {/* Recent Activity */}
        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm hover:shadow-lg transition-shadow duration-300 p-6">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <div className="p-3 rounded-xl bg-gradient-to-br from-green-50 to-emerald-50">
                <CheckCircle className="h-6 w-6 text-green-600" />
              </div>
              <div>
                <h3 className="text-xl font-semibold text-gray-900">Recent Activity</h3>
                <p className="text-sm text-gray-600">Your latest actions and updates</p>
              </div>
            </div>
            <Button 
              variant="outline" 
              size="sm" 
              onClick={loadDashboardData}
              className="border-gray-200 hover:bg-gray-50"
            >
              <RefreshCw className="h-4 w-4 mr-2" />
              Refresh
            </Button>
          </div>
          
          <div className="space-y-4">
            {orders.length > 0 ? (
              orders.slice(0, 4).map((order, index) => (
                <div key={order.id} className="flex items-center gap-3 p-3 rounded-lg hover:bg-gray-50 transition-colors duration-200 border border-transparent hover:border-gray-100">
                  <div className={`w-2 h-2 rounded-full ${index === 0 ? 'bg-green-500' : index === 1 ? 'bg-blue-500' : index === 2 ? 'bg-purple-500' : 'bg-orange-500'}`}></div>
                  <div className="flex-1">
                    <p className="text-sm font-medium text-gray-900">Order #{order.id.slice(-8)} - {order.quantity} leads</p>
                    <p className="text-xs text-gray-500">
                      {new Date(order.createdAt).toLocaleDateString()} • {order.status}
                    </p>
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center py-8">
                <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-3">
                  <ShoppingCart className="h-6 w-6 text-gray-400" />
                </div>
                <p className="text-sm text-gray-600">No recent orders</p>
                <p className="text-xs text-gray-500">Visit the Shop to buy your first leads</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
