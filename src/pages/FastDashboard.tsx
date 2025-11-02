import React from 'react';
import { useAuthStore } from '../store/auth';
import { PageTitle } from '../components/common/PageTitle';
import { BannerDisplay } from '../components/dashboard/BannerDisplay';
import { 
  BarChart3, 
  Users, 
  DollarSign, 
  TrendingUp,
  Handshake,
  FileText,
  ShoppingBag,
  Settings,
  Sparkles,
  Activity,
  CheckCircle
} from 'lucide-react';

const FastDashboard: React.FC = () => {
  const { user, profile } = useAuthStore();

  // Get user's display name
  const displayName = profile?.name || user?.user_metadata?.name || user?.email?.split('@')[0] || 'User';

  const quickStats = [
    { 
      label: 'Total Leads', 
      value: '0', 
      icon: Users, 
      color: 'text-blue-600',
      bgColor: 'bg-gradient-to-br from-blue-50 to-blue-100',
      borderColor: 'border-blue-200'
    },
    { 
      label: 'Active Deals', 
      value: '0', 
      icon: Handshake, 
      color: 'text-green-600',
      bgColor: 'bg-gradient-to-br from-green-50 to-green-100',
      borderColor: 'border-green-200'
    },
    { 
      label: 'Revenue', 
      value: '$0', 
      icon: DollarSign, 
      color: 'text-purple-600',
      bgColor: 'bg-gradient-to-br from-purple-50 to-purple-100',
      borderColor: 'border-purple-200'
    },
    { 
      label: 'Growth', 
      value: '0%', 
      icon: TrendingUp, 
      color: 'text-orange-600',
      bgColor: 'bg-gradient-to-br from-orange-50 to-orange-100',
      borderColor: 'border-orange-200'
    },
  ];

  const quickActions = [
    { 
      label: 'View Deals', 
      href: '/app/deals', 
      icon: Handshake, 
      color: 'bg-gradient-to-r from-blue-600 to-blue-700',
      hoverColor: 'hover:from-blue-700 hover:to-blue-800'
    },
    { 
      label: 'Browse Shop', 
      href: '/app/shop', 
      icon: ShoppingBag, 
      color: 'bg-gradient-to-r from-green-600 to-green-700',
      hoverColor: 'hover:from-green-700 hover:to-green-800'
    },
    { 
      label: 'My Leads', 
      href: '/app/crm', 
      icon: FileText, 
      color: 'bg-gradient-to-r from-purple-600 to-purple-700',
      hoverColor: 'hover:from-purple-700 hover:to-purple-800'
    },
    { 
      label: 'Settings', 
      href: '/app/settings', 
      icon: Settings, 
      color: 'bg-gradient-to-r from-gray-600 to-gray-700',
      hoverColor: 'hover:from-gray-700 hover:to-gray-800'
    },
  ];

  return (
    <div className="space-y-8">
      {/* Welcome Header */}
      <div className="text-center space-y-4">
        <PageTitle
          title={`Dashboard`}
          subtitle={` Hello ${displayName}! 👋`}
          icon={Sparkles}
          color="blue"
        />
      </div>

      {/* Top Banner Placement */}
      <BannerDisplay placement="dashboard_top" />

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {quickStats.map((stat, index) => {
          const Icon = stat.icon;
          return (
            <div key={index} className="group">
              <div className={`relative overflow-hidden rounded-2xl border ${stat.borderColor} bg-white shadow-sm hover:shadow-lg transition-all duration-300 p-6 h-full group-hover:scale-[1.02]`}>
                <div className="absolute inset-0 bg-gradient-to-br from-transparent to-white/50 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                <div className="relative">
                  <div className="flex items-center justify-between mb-4">
                    <div className={`p-3 rounded-2xl ${stat.bgColor} group-hover:scale-110 transition-transform duration-300 shadow-sm`}>
                      <Icon className={`h-6 w-6 ${stat.color}`} />
                    </div>
                    <div className="text-right">
                      <div className="text-3xl font-bold text-gray-900">{stat.value}</div>
                      <p className="text-sm text-gray-600 font-medium">{stat.label}</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Grid Banner Placement */}
      <BannerDisplay placement="dashboard_grid" />

      {/* Quick Actions */}
      <div>
        <div className="flex items-center gap-3 mb-6">
          <div className="p-3 rounded-xl bg-gradient-to-br from-blue-50 to-indigo-50">
            <Activity className="h-6 w-6 text-blue-600" />
          </div>
          <div>
            <h2 className="text-xl font-semibold text-gray-900">Quick Actions</h2>
            <p className="text-sm text-gray-600">Common tasks to get you started</p>
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {quickActions.map((action, index) => {
            const Icon = action.icon;
            return (
              <a
                key={index}
                href={action.href}
                className={`${action.color} ${action.hoverColor} text-white p-4 rounded-xl hover:shadow-lg transition-all duration-300 flex items-center gap-3 group`}
              >
                <div className="p-2 rounded-lg bg-white/20 group-hover:scale-110 transition-transform duration-300">
                  <Icon className="h-5 w-5" />
                </div>
                <span className="font-medium">{action.label}</span>
              </a>
            );
          })}
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
              <h2 className="text-xl font-semibold text-gray-900">Recent Activity</h2>
              <p className="text-sm text-gray-600">Your latest actions and updates</p>
            </div>
          </div>
        </div>
        <div className="text-center py-8">
          <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-3">
            <BarChart3 className="h-6 w-6 text-gray-400" />
          </div>
          <p className="text-sm text-gray-600">No recent activity to display</p>
          <p className="text-xs text-gray-500 mt-2">
            Start creating deals and leads to see your activity here
          </p>
        </div>
      </div>
    </div>
  );
};

export default FastDashboard;
