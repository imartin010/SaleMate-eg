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
  AlertCircle
} from 'lucide-react';
import { Button } from '../components/ui/button';

const Dashboard: React.FC = () => {
  const { user } = useAuthStore();
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
      bgColor: 'bg-blue-100',
      gradient: 'from-blue-500 to-blue-600',
    },
    {
      title: 'Hot Leads',
      value: stats.hotLeads.toString(),
      description: 'Ready to close',
      icon: Target,
      color: 'text-red-600',
      bgColor: 'bg-red-100',
      gradient: 'from-red-500 to-red-600',
    },
    {
      title: 'Total Spent',
      value: formatCurrency(stats.totalSpent),
      description: 'On lead purchases',
      icon: ShoppingCart,
      color: 'text-green-600',
      bgColor: 'bg-green-100',
      gradient: 'from-green-500 to-green-600',
    },
    {
      title: 'This Month',
      value: stats.thisMonthOrders.toString(),
      description: 'New orders',
      icon: Clock,
      color: 'text-purple-600',
      bgColor: 'bg-purple-100',
      gradient: 'from-purple-500 to-purple-600',
    },
    {
      title: 'Available Projects',
      value: stats.availableProjects.toString(),
      description: 'With leads to buy',
      icon: TrendingUp,
      color: 'text-indigo-600',
      bgColor: 'bg-indigo-100',
      gradient: 'from-indigo-500 to-indigo-600',
    },
    {
      title: 'Conversion Rate',
      value: `${stats.conversionRate.toFixed(1)}%`,
      description: 'Leads to meetings',
      icon: CheckCircle,
      color: 'text-emerald-600',
      bgColor: 'bg-emerald-100',
      gradient: 'from-emerald-500 to-emerald-600',
    },
  ];

  return (
    <div className="space-y-8">
      {/* Welcome Header */}
      <div className="text-center space-y-2">
        <h1 className="text-4xl font-bold text-gradient">
          Welcome back, {user.name}!
        </h1>
        <p className="text-lg text-muted-foreground">
          Here's what's happening with your real estate business today.
        </p>
        <div className="flex items-center justify-center gap-2 mt-2">
          <div className="w-2 h-2 bg-green-500 rounded-full"></div>
          <span className="text-xs text-green-600 font-medium">Connected to Supabase Backend</span>
        </div>
      </div>

      {/* Error Display */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-center gap-3">
          <AlertCircle className="h-5 w-5 text-red-600" />
          <span className="text-red-800">{error}</span>
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={loadDashboardData}
            className="ml-auto text-red-600 hover:text-red-700"
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
              <div className="card-modern card-hover p-6 h-full">
                <div className="flex items-center justify-between mb-4">
                  <div className={`p-3 rounded-2xl ${stat.bgColor} group-hover:scale-110 transition-transform duration-300`}>
                    <Icon className={`h-6 w-6 ${stat.color}`} />
                  </div>
                  <div className="text-right">
                    <div className="text-3xl font-bold text-foreground">{stat.value}</div>
                    <p className="text-sm text-muted-foreground font-medium">
                      {stat.title}
                    </p>
                  </div>
                </div>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  {stat.description}
                </p>
              </div>
            </div>
          );
        })}
      </div>

      {/* Quick Actions & Recent Activity */}
      <div className="grid gap-6 md:grid-cols-2">
        {/* Quick Actions */}
        <div className="card-modern card-hover p-6">
          <div className="flex items-center gap-3 mb-6">
            <div className="p-2 rounded-xl bg-primary/10">
              <Activity className="h-5 w-5 text-primary" />
            </div>
            <div>
              <h3 className="text-xl font-semibold">Quick Actions</h3>
              <p className="text-sm text-muted-foreground">Common tasks to get you started</p>
            </div>
          </div>
          
          <div className="space-y-4">
            <div className="group flex items-center justify-between p-4 rounded-xl bg-gradient-to-r from-blue-50 to-indigo-50 hover:from-blue-100 hover:to-indigo-100 transition-all duration-300 cursor-pointer">
              <div>
                <p className="font-semibold text-foreground">Buy New Leads</p>
                <p className="text-sm text-muted-foreground">Browse available projects</p>
              </div>
              <div className="p-2 rounded-full bg-white shadow-sm group-hover:scale-110 transition-transform duration-300">
                <ShoppingCart className="h-5 w-5 text-blue-600" />
              </div>
            </div>
            
            <div className="group flex items-center justify-between p-4 rounded-xl bg-gradient-to-r from-green-50 to-emerald-50 hover:from-green-100 hover:to-emerald-100 transition-all duration-300 cursor-pointer">
              <div>
                <p className="font-semibold text-foreground">Update Lead Status</p>
                <p className="text-sm text-muted-foreground">Manage your pipeline</p>
              </div>
              <div className="p-2 rounded-full bg-white shadow-sm group-hover:scale-110 transition-transform duration-300">
                <Users className="h-5 w-5 text-green-600" />
              </div>
            </div>
            
            <div className="group flex items-center justify-between p-4 rounded-xl bg-gradient-to-r from-purple-50 to-violet-50 hover:from-purple-100 hover:to-violet-100 transition-all duration-300 cursor-pointer">
              <div>
                <p className="font-semibold text-foreground">Join Community</p>
                <p className="text-sm text-muted-foreground">Connect with other agents</p>
              </div>
              <div className="p-2 rounded-full bg-white shadow-sm group-hover:scale-110 transition-transform duration-300">
                <TrendingUp className="h-5 w-5 text-purple-600" />
              </div>
            </div>
          </div>
        </div>

        {/* Recent Activity */}
        <div className="card-modern card-hover p-6">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-xl bg-green-100">
                <CheckCircle className="h-5 w-5 text-green-600" />
              </div>
              <div>
                <h3 className="text-xl font-semibold">Recent Activity</h3>
                <p className="text-sm text-muted-foreground">Your latest actions and updates</p>
              </div>
            </div>
            <Button 
              variant="outline" 
              size="sm" 
              onClick={loadDashboardData}
            >
              <RefreshCw className="h-4 w-4 mr-2" />
              Refresh
            </Button>
          </div>
          
          <div className="space-y-4">
            {orders.length > 0 ? (
              orders.slice(0, 4).map((order, index) => (
                <div key={order.id} className="flex items-center gap-3 p-3 rounded-lg hover:bg-accent/50 transition-colors duration-200">
                  <div className={`w-2 h-2 rounded-full ${index === 0 ? 'bg-green-500' : index === 1 ? 'bg-blue-500' : index === 2 ? 'bg-purple-500' : 'bg-orange-500'}`}></div>
                  <div className="flex-1">
                    <p className="text-sm font-medium">Order #{order.id.slice(-8)} - {order.quantity} leads</p>
                    <p className="text-xs text-muted-foreground">
                      {new Date(order.createdAt).toLocaleDateString()} • {order.status}
                    </p>
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center py-8">
                <div className="w-12 h-12 bg-muted rounded-full flex items-center justify-center mx-auto mb-3">
                  <ShoppingCart className="h-6 w-6 text-muted-foreground" />
                </div>
                <p className="text-sm text-muted-foreground">No recent orders</p>
                <p className="text-xs text-muted-foreground">Visit the Shop to buy your first leads</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
