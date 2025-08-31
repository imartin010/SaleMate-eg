import React from 'react';
import { useAuthStore } from '../store/auth';
import { 
  BarChart3, 
  Users, 
  DollarSign, 
  TrendingUp,
  Handshake,
  FileText,
  ShoppingBag,
  Settings
} from 'lucide-react';

const FastDashboard: React.FC = () => {
  const { user } = useAuthStore();

  const quickStats = [
    { label: 'Total Leads', value: '0', icon: Users, color: 'text-blue-600' },
    { label: 'Active Deals', value: '0', icon: Handshake, color: 'text-green-600' },
    { label: 'Revenue', value: '$0', icon: DollarSign, color: 'text-purple-600' },
    { label: 'Growth', value: '0%', icon: TrendingUp, color: 'text-orange-600' },
  ];

  const quickActions = [
    { label: 'View Deals', href: '/deals', icon: Handshake, color: 'bg-blue-600' },
    { label: 'Browse Shop', href: '/shop', icon: ShoppingBag, color: 'bg-green-600' },
    { label: 'My Leads', href: '/crm', icon: FileText, color: 'bg-purple-600' },
    { label: 'Settings', href: '/settings', icon: Settings, color: 'bg-gray-600' },
  ];

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      {/* Welcome Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          Welcome back, {user?.name || 'User'}!
        </h1>
        <p className="text-gray-600">Here's what's happening with your real estate business</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {quickStats.map((stat, index) => {
          const Icon = stat.icon;
          return (
            <div key={index} className="bg-white p-6 rounded-lg shadow-sm border">
              <div className="flex items-center">
                <Icon className={`h-8 w-8 ${stat.color} mr-3`} />
                <div>
                  <p className="text-sm text-gray-600">{stat.label}</p>
                  <p className="text-2xl font-bold text-gray-900">{stat.value}</p>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Quick Actions */}
      <div className="mb-8">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">Quick Actions</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {quickActions.map((action, index) => {
            const Icon = action.icon;
            return (
              <a
                key={index}
                href={action.href}
                className={`${action.color} text-white p-4 rounded-lg hover:opacity-90 transition-opacity flex items-center gap-3`}
              >
                <Icon className="h-5 w-5" />
                <span className="font-medium">{action.label}</span>
              </a>
            );
          })}
        </div>
      </div>

      {/* Recent Activity Placeholder */}
      <div className="bg-white rounded-lg shadow-sm border p-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">Recent Activity</h2>
        <div className="text-center py-8">
          <BarChart3 className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-600">No recent activity to display</p>
          <p className="text-sm text-gray-500 mt-2">
            Start creating deals and leads to see your activity here
          </p>
        </div>
      </div>
    </div>
  );
};

export default FastDashboard;
