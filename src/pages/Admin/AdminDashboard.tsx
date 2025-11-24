import React, { useEffect, useState } from 'react';
import { Users, DollarSign, Database, ShoppingCart, Wallet, Ticket } from 'lucide-react';
import { supabase } from '../../lib/supabaseClient';
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { SkeletonList } from '../../components/common/SkeletonCard';

interface KPIData {
  totalUsers: number;
  userGrowth: number;
  monthlyRevenue: number;
  revenueGrowth: number;
  activeLeads: number;
  pendingPurchases: number;
  pendingTopups: number;
  openTickets: number;
}

interface Activity {
  id: string;
  type: string;
  description: string;
  timestamp: string;
  user_name?: string;
}

export default function AdminDashboard() {
  const [kpis, setKpis] = useState<KPIData>({
    totalUsers: 0,
    userGrowth: 0,
    monthlyRevenue: 0,
    revenueGrowth: 0,
    activeLeads: 0,
    pendingPurchases: 0,
    pendingTopups: 0,
    openTickets: 0,
  });
  const [revenueData, setRevenueData] = useState<any[]>([]);
  const [signupData, setSignupData] = useState<any[]>([]);
  const [topProjects, setTopProjects] = useState<any[]>([]);
  const [recentActivity, setRecentActivity] = useState<Activity[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadDashboardData();
    
    // Subscribe to real-time updates
    const purchaseChannel = supabase
      .channel('purchase_requests_changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'transactions', filter: 'transaction_type=eq.payment' }, () => {
        loadKPIs();
      })
      .subscribe();

    const topupChannel = supabase
      .channel('wallet_topup_changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'wallet_topup_requests' }, () => {
        loadKPIs();
      })
      .subscribe();

    return () => {
      purchaseChannel.unsubscribe();
      topupChannel.unsubscribe();
    };
  }, []);

  const loadDashboardData = async () => {
    setLoading(true);
    await Promise.all([
      loadKPIs(),
      loadRevenueData(),
      loadSignupData(),
      loadTopProjects(),
      loadRecentActivity(),
    ]);
    setLoading(false);
  };

  const loadKPIs = async () => {
    try {
      // Total users
      const { count: totalUsers } = await supabase
        .from('profiles')
        .select('*', { count: 'exact', head: true });

      // Users from last month
      const lastMonth = new Date();
      lastMonth.setMonth(lastMonth.getMonth() - 1);
      const { count: lastMonthUsers } = await supabase
        .from('profiles')
        .select('*', { count: 'exact', head: true })
        .lte('created_at', lastMonth.toISOString());

      const userGrowth = lastMonthUsers ? 
        ((totalUsers! - lastMonthUsers) / lastMonthUsers) * 100 : 0;

      // Active leads
      const { count: activeLeads } = await supabase
        .from('leads')
        .select('*', { count: 'exact', head: true })
        .neq('stage', 'closed_won')
        .neq('stage', 'closed_lost');

      // Pending purchases
      const { count: pendingPurchases } = await supabase
        .from('purchase_requests')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'pending');

      // Pending topups
      const { count: pendingTopups } = await supabase
        .from('wallet_topup_requests')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'pending');

      // Open tickets
      const { count: openTickets } = await supabase
        .from('support_cases')
        .select('*', { count: 'exact', head: true })
        .neq('status', 'resolved')
        .neq('status', 'closed');

      // Monthly revenue (would need orders/transactions table)
      const monthlyRevenue = 0; // TODO: Calculate from transactions
      const revenueGrowth = 0; // TODO: Calculate growth

      setKpis({
        totalUsers: totalUsers || 0,
        userGrowth,
        monthlyRevenue,
        revenueGrowth,
        activeLeads: activeLeads || 0,
        pendingPurchases: pendingPurchases || 0,
        pendingTopups: pendingTopups || 0,
        openTickets: openTickets || 0,
      });
    } catch (error) {
      console.error('Load KPIs error:', error);
    }
  };

  const loadRevenueData = async () => {
    // TODO: Implement when transaction history is available
    const mockData = Array.from({ length: 30 }, (_, i) => ({
      date: new Date(Date.now() - (29 - i) * 24 * 60 * 60 * 1000).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
      revenue: Math.floor(Math.random() * 5000) + 2000,
    }));
    setRevenueData(mockData);
  };

  const loadSignupData = async () => {
    try {
      const { data } = await supabase
        .from('profiles')
        .select('created_at')
        .gte('created_at', new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString())
        .order('created_at');

      if (data) {
        const signupsByDate = data.reduce((acc: Record<string, number>, profile) => {
          const date = new Date(profile.created_at!).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
          acc[date] = (acc[date] || 0) + 1;
          return acc;
        }, {});

        setSignupData(Object.entries(signupsByDate).map(([date, count]) => ({ date, signups: count })));
      }
    } catch (error) {
      console.error('Load signup data error:', error);
    }
  };

  const loadTopProjects = async () => {
    try {
      // TODO: Join with orders/purchases to get actual revenue
      const { data } = await supabase
        .from('projects')
        .select('id, name, available_leads, price_per_lead')
        .order('available_leads', { ascending: false })
        .limit(5);

      setTopProjects(data || []);
    } catch (error) {
      console.error('Load top projects error:', error);
    }
  };

  const loadRecentActivity = async () => {
    try {
      // Get recent audit logs
      const { data } = await supabase
        .from('audit_logs')
        .select(`
          *,
          actor:profiles!audit_logs_actor_id_fkey(name)
        `)
        .order('created_at', { ascending: false })
        .limit(10);

      if (data) {
        const activities: Activity[] = data.map(log => ({
          id: log.id,
          type: log.action,
          description: `${log.action} ${log.entity} ${log.entity_id.substring(0, 8)}...`,
          timestamp: log.created_at,
          user_name: (log as any).actor?.name,
        }));

        setRecentActivity(activities);
      }
    } catch (error) {
      console.error('Load recent activity error:', error);
    }
  };

  if (loading) {
    return (
      <div className="p-4 md:p-8">
        <SkeletonList count={8} />
      </div>
    );
  }

  return (
    <div className="p-8 space-y-8 min-h-screen" style={{ backgroundColor: '#f8fafc' }}>
      {/* Header */}
      <div className="admin-page-header" style={{ marginBottom: '2rem' }}>
        <h1 className="admin-page-title" style={{ fontSize: '1.875rem', fontWeight: 700, color: '#111827', marginBottom: '0.5rem' }}>Dashboard</h1>
        <p className="admin-page-subtitle" style={{ color: '#6b7280' }}>Welcome back! Here's what's happening with your platform.</p>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <KPICard
          title="Total Users"
          value={kpis.totalUsers}
          change={kpis.userGrowth}
          icon={Users}
          color="purple"
        />
        <KPICard
          title="Monthly Revenue"
          value={`EGP ${kpis.monthlyRevenue.toLocaleString()}`}
          change={kpis.revenueGrowth}
          icon={DollarSign}
          color="blue"
        />
        <KPICard
          title="Active Leads"
          value={kpis.activeLeads}
          icon={Database}
          color="blue"
        />
        <KPICard
          title="Pending Actions"
          value={kpis.pendingPurchases + kpis.pendingTopups}
          icon={ShoppingCart}
          color="orange"
          clickable
          onClick={() => window.location.href = '/app/admin/purchases'}
        />
      </div>

      {/* Action Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <ActionCard
          title="Purchase Requests"
          count={kpis.pendingPurchases}
          description="Awaiting approval"
          link="/app/admin/purchases"
          icon={ShoppingCart}
        />
        <ActionCard
          title="Wallet Top-Ups"
          count={kpis.pendingTopups}
          description="Awaiting validation"
          link="/app/admin/wallets"
          icon={Wallet}
        />
        <ActionCard
          title="Support Tickets"
          count={kpis.openTickets}
          description="Open tickets"
          link="/app/admin/support"
          icon={Ticket}
        />
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Revenue Chart */}
        <div className="admin-chart-card" style={{ backgroundColor: '#ffffff', borderRadius: '1rem', padding: '1.5rem', boxShadow: '0 1px 2px 0 rgba(0, 0, 0, 0.05)', border: '1px solid #e5e7eb' }}>
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-semibold" style={{ color: '#111827' }}>Revenue (Last 30 Days)</h3>
            <select className="text-xs px-3 py-1.5 rounded-lg border" style={{ color: '#4b5563', backgroundColor: '#f9fafb', borderColor: '#e5e7eb' }}>
              <option>in Aug</option>
            </select>
          </div>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={revenueData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
              <XAxis dataKey="date" stroke="#94a3b8" fontSize={11} />
              <YAxis stroke="#94a3b8" fontSize={11} />
              <Tooltip 
                contentStyle={{ 
                  borderRadius: '12px', 
                  border: 'none',
                  boxShadow: '0 4px 12px rgba(0, 0, 0, 0.1)',
                  background: 'white'
                }} 
              />
              <Line 
                type="monotone" 
                dataKey="revenue" 
                stroke="#3b82f6" 
                strokeWidth={3}
                dot={{ fill: '#3b82f6', r: 4 }}
                activeDot={{ r: 6, fill: '#3b82f6' }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* Signups Chart */}
        <div className="admin-chart-card" style={{ backgroundColor: '#ffffff', borderRadius: '1rem', padding: '1.5rem', boxShadow: '0 1px 2px 0 rgba(0, 0, 0, 0.05)', border: '1px solid #e5e7eb' }}>
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-semibold" style={{ color: '#111827' }}>User Signups (Last 30 Days)</h3>
            <select className="text-xs px-3 py-1.5 rounded-lg border" style={{ color: '#4b5563', backgroundColor: '#f9fafb', borderColor: '#e5e7eb' }}>
              <option>Month</option>
            </select>
          </div>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={signupData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
              <XAxis dataKey="date" stroke="#94a3b8" fontSize={11} />
              <YAxis stroke="#94a3b8" fontSize={11} />
              <Tooltip 
                contentStyle={{ 
                  borderRadius: '12px', 
                  border: 'none',
                  boxShadow: '0 4px 12px rgba(0, 0, 0, 0.1)',
                  background: 'white'
                }} 
              />
              <Bar 
                dataKey="signups" 
                fill="#8b5cf6"
                radius={[12, 12, 0, 0]}
              />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Recent Activity */}
      <div className="admin-card" style={{ backgroundColor: '#ffffff', borderRadius: '1rem', padding: '1.5rem', boxShadow: '0 1px 2px 0 rgba(0, 0, 0, 0.05)', border: '1px solid #e5e7eb' }}>
        <h3 className="text-lg font-semibold mb-4" style={{ color: '#111827' }}>Recent Activity</h3>
        <div className="space-y-3">
          {recentActivity.map((activity) => (
            <div key={activity.id} className="flex items-center justify-between py-3 px-2 rounded-xl transition-colors" style={{ backgroundColor: 'transparent' }} onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#f9fafb'} onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}>
              <div className="flex-1">
                <p className="text-sm font-medium" style={{ color: '#111827' }}>{activity.description}</p>
                <p className="text-xs mt-1" style={{ color: '#6b7280' }}>
                  {activity.user_name} • {new Date(activity.timestamp).toLocaleString()}
                </p>
              </div>
              <span className={`admin-badge ${
                activity.type === 'create' ? 'admin-badge-success' :
                activity.type === 'update' ? 'admin-badge-info' :
                activity.type === 'delete' ? 'admin-badge-error' :
                'bg-gray-100 text-gray-800'
              }`} style={{
                padding: '0.25rem 0.75rem',
                borderRadius: '9999px',
                fontSize: '0.75rem',
                fontWeight: 600,
                ...(activity.type === 'create' ? { backgroundColor: '#dcfce7', color: '#166534' } :
                    activity.type === 'update' ? { backgroundColor: '#dbeafe', color: '#1e40af' } :
                    activity.type === 'delete' ? { backgroundColor: '#fee2e2', color: '#991b1b' } :
                    { backgroundColor: '#f3f4f6', color: '#1f2937' })
              }}>
                {activity.type}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// KPI Card Component
interface KPICardProps {
  title: string;
  value: number | string;
  change?: number;
  icon: React.ComponentType<{ className?: string }>;
  color: 'blue' | 'green' | 'purple' | 'orange';
  clickable?: boolean;
  onClick?: () => void;
}

const KPICard: React.FC<KPICardProps> = ({ title, value, change, icon: Icon, color, clickable, onClick }) => {
  const colorConfig = {
    blue: {
      bg: 'bg-gradient-to-br from-blue-500 to-blue-600',
      iconBg: 'bg-blue-100',
      iconColor: 'text-blue-600',
      textColor: 'text-blue-600',
    },
    green: {
      bg: 'bg-gradient-to-br from-blue-400 to-blue-500',
      iconBg: 'bg-blue-100',
      iconColor: 'text-blue-600',
      textColor: 'text-blue-600',
    },
    purple: {
      bg: 'bg-gradient-to-br from-purple-400 to-purple-600',
      iconBg: 'bg-purple-100',
      iconColor: 'text-purple-600',
      textColor: 'text-purple-600',
    },
    orange: {
      bg: 'bg-gradient-to-br from-orange-400 to-orange-600',
      iconBg: 'bg-orange-100',
      iconColor: 'text-orange-600',
      textColor: 'text-orange-600',
    },
  };

  const config = colorConfig[color];

  return (
    <div 
      className={`admin-kpi-card ${clickable ? 'cursor-pointer' : ''}`}
      onClick={clickable ? onClick : undefined}
      style={{ backgroundColor: '#ffffff', borderRadius: '1rem', padding: '1.5rem', boxShadow: '0 1px 2px 0 rgba(0, 0, 0, 0.05)', border: '1px solid #e5e7eb' }}
    >
      <div className="flex items-center justify-between">
        <div className="flex-1">
          <p className="admin-kpi-label" style={{ fontSize: '0.875rem', fontWeight: 500, color: '#6b7280', marginBottom: '0.25rem' }}>{title}</p>
          <p className="admin-kpi-value" style={{ fontSize: '1.875rem', fontWeight: 700, color: '#111827', marginBottom: '0.25rem' }}>{value}</p>
          {change !== undefined && (
            <p className={`text-sm mt-1 font-medium ${change >= 0 ? 'text-green-600' : 'text-red-600'}`} style={{ fontSize: '0.875rem', marginTop: '0.25rem', fontWeight: 500 }}>
              {change >= 0 ? '+' : ''}{change.toFixed(1)}% from last month
            </p>
          )}
        </div>
        <div className={`${config.bg} admin-kpi-icon text-white shadow-lg`} style={{ width: '3.5rem', height: '3.5rem', borderRadius: '1rem', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)' }}>
          <Icon className="h-6 w-6" style={{ color: 'white' }} />
        </div>
      </div>
    </div>
  );
};

// Action Card Component
interface ActionCardProps {
  title: string;
  count: number;
  description: string;
  link: string;
  icon: React.ComponentType<{ className?: string }>;
}

const ActionCard: React.FC<ActionCardProps> = ({ title, count, description, link, icon: Icon }) => {
  return (
    <a
      href={link}
      className="admin-action-card"
      style={{ backgroundColor: '#ffffff', borderRadius: '1rem', padding: '1.5rem', boxShadow: '0 1px 2px 0 rgba(0, 0, 0, 0.05)', border: '1px solid #e5e7eb', cursor: 'pointer', transition: 'all 0.2s ease', textDecoration: 'none', display: 'block' }}
      onMouseEnter={(e) => {
        e.currentTarget.style.boxShadow = '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)';
        e.currentTarget.style.transform = 'translateY(-4px) scale(1.02)';
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.boxShadow = '0 1px 2px 0 rgba(0, 0, 0, 0.05)';
        e.currentTarget.style.transform = 'translateY(0) scale(1)';
      }}
    >
      <div className="flex items-center gap-4">
        <div className="h-14 w-14 rounded-xl flex items-center justify-center text-white shadow-lg" style={{ background: 'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)', boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)' }}>
          <Icon className="h-7 w-7" style={{ color: 'white' }} />
        </div>
        <div className="flex-1">
          <h3 className="text-lg font-semibold" style={{ color: '#111827' }}>{title}</h3>
          <p className="text-sm" style={{ color: '#4b5563' }}>{description}</p>
        </div>
        {count > 0 && (
          <div className="h-10 w-10 rounded-xl flex items-center justify-center text-white font-bold text-sm shadow-lg" style={{ background: 'linear-gradient(135deg, #ec4899 0%, #db2777 100%)', boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)' }}>
            {count}
          </div>
        )}
      </div>
    </a>
  );
};

