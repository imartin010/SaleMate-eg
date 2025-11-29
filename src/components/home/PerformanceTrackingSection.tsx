import React from 'react';
import { useNavigate } from 'react-router-dom';
import { BarChart3, TrendingUp, DollarSign, Target, ArrowRight } from 'lucide-react';

/**
 * Performance Tracking Section
 * Highlights financial and performance tracking features
 */
const PerformanceTrackingSection: React.FC = React.memo(() => {
  const navigate = useNavigate();

  const features = [
    {
      icon: BarChart3,
      title: 'Analytics Dashboard',
      description: 'Real-time insights and performance metrics',
      color: 'from-blue-500 to-blue-600',
      path: '/app/crm/dashboard',
    },
    {
      icon: TrendingUp,
      title: 'Agent Performance',
      description: 'Track conversion rates and response times',
      color: 'from-green-500 to-green-600',
      path: '/app/crm/analysis',
    },
    {
      icon: DollarSign,
      title: 'Financial Tracking',
      description: 'Revenue, ROI, and budget tracking',
      color: 'from-purple-500 to-purple-600',
      path: '/app/crm/dashboard',
    },
    {
      icon: Target,
      title: 'Source Performance',
      description: 'Analyze lead sources and ROI',
      color: 'from-orange-500 to-orange-600',
      path: '/app/crm/analysis',
    },
  ];

  return (
    <div className="rounded-2xl md:rounded-3xl bg-white shadow-sm md:shadow-[0_4px_20px_rgba(0,0,0,0.08)] p-6 md:p-8 border border-gray-100">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-xl md:text-2xl font-bold text-gray-900">Performance & Financial Tracking</h2>
          <p className="text-sm text-gray-600 mt-1">Monitor your business metrics in real-time</p>
        </div>
        <button
          onClick={() => navigate('/app/crm/dashboard')}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium"
        >
          View Analytics
          <ArrowRight className="h-4 w-4" />
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {features.map((feature, index) => {
          const Icon = feature.icon;
          return (
            <button
              key={index}
              onClick={() => navigate(feature.path)}
              className="flex items-start gap-4 p-4 rounded-xl border border-gray-200 hover:border-blue-300 hover:bg-blue-50 transition-all duration-200 text-left group"
            >
              <div className={`p-3 rounded-lg bg-gradient-to-br ${feature.color} group-hover:scale-110 transition-transform`}>
                <Icon className="h-5 w-5 text-white" />
              </div>
              <div className="flex-1">
                <h3 className="font-semibold text-gray-900 mb-1 group-hover:text-blue-600 transition-colors">
                  {feature.title}
                </h3>
                <p className="text-sm text-gray-600">{feature.description}</p>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
});

PerformanceTrackingSection.displayName = 'PerformanceTrackingSection';

export default PerformanceTrackingSection;

