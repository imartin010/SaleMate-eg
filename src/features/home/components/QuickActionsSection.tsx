import React from 'react';
import { ShoppingCart, Users, Handshake, Settings, ChevronRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

/**
 * Quick Actions Section
 * Compact layout matching "Picked for you" style from reference
 */
const QuickActionsSection: React.FC = React.memo(() => {
  const navigate = useNavigate();

  const actions = [
    { label: 'Leads Shop', icon: ShoppingCart, path: '/app/shop' },
    { label: 'View Leads', icon: Users, path: '/app/crm' },
    { label: 'Close Deal', icon: Handshake, path: '/app/partners' },
    { label: 'Settings', icon: Settings, path: '/app/settings' },
  ];

  return (
    <div className="space-y-3 md:space-y-4 h-full flex flex-col">
      {/* Section Header */}
      <div className="flex items-center justify-between">
        <h2 className="text-base md:text-lg font-bold text-gray-900">Quick Actions</h2>
        <button
          onClick={() => navigate('/app/shop')}
          className="flex items-center gap-1 text-blue-600 font-medium text-xs md:text-sm hover:text-blue-700 transition-colors"
        >
          View All
          <ChevronRight className="h-3 w-3 md:h-4 md:w-4" />
        </button>
      </div>

      {/* Single Card with 4 icons - Responsive Grid */}
      <div className="rounded-xl md:rounded-2xl bg-white shadow-sm md:shadow-md border border-gray-100 p-3 md:p-4 flex-1">
        {/* Mobile: 4 columns, Desktop: 2x2 grid */}
        <div className="grid grid-cols-4 md:grid-cols-2 gap-2 md:gap-3 h-full">
          {actions.map((action) => {
            const Icon = action.icon;
            return (
              <button
                key={action.path}
                onClick={() => navigate(action.path)}
                className="flex flex-col items-center justify-center gap-1.5 md:gap-2 p-2 md:p-3 rounded-lg hover:bg-gray-50 active:scale-95 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
                aria-label={`Navigate to ${action.label}`}
              >
                <div className="w-10 h-10 md:w-12 md:h-12 rounded-lg bg-gradient-to-br from-blue-500 via-blue-600 to-blue-700 flex items-center justify-center shadow-md hover:shadow-lg transition-shadow">
                  <Icon className="h-5 w-5 md:h-6 md:w-6 text-white" strokeWidth={2} />
                </div>
                <span className="text-[10px] md:text-xs font-medium text-gray-700 text-center leading-tight">{action.label}</span>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
});

QuickActionsSection.displayName = 'QuickActionsSection';

export default QuickActionsSection;

