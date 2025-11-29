import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { cn } from '../../lib/cn';
import { useFeatureFlags } from '../../core/config/features';
import {
  Home,
  ShoppingCart,
  Users,
  Handshake,
  Package,
  BarChart3,
} from 'lucide-react';

export const BottomNav: React.FC = () => {
  const location = useLocation();
  const { leadsShopEnabled, partnerDealsEnabled } = useFeatureFlags();

  // Navigation items with feature flags
  const allNavigationItems = [
    {
      name: 'Home',
      href: '/app',
      icon: Home,
      show: true,
    },
    {
      name: 'Shop',
      href: '/app/shop',
      icon: ShoppingCart,
      show: leadsShopEnabled,
    },
    {
      name: 'Leads',
      href: '/app/crm',
      icon: Users,
      show: true,
    },
    {
      name: 'Deals',
      href: '/app/partners',
      icon: Handshake,
      show: partnerDealsEnabled,
    },
    {
      name: 'Inventory',
      href: '/app/inventory',
      icon: Package,
      show: true,
    },
    {
      name: 'Dashboard',
      href: '/app/crm/dashboard',
      icon: BarChart3,
      show: true,
    },
  ];

  // Filter navigation to only show enabled items, prioritize key items
  const navigation = allNavigationItems
    .filter(item => item.show)
    .slice(0, 5); // Limit to 5 items for bottom nav

  const isActive = (href: string) => {
    if (href === '/app') {
      return location.pathname === '/app' || location.pathname === '/app/home' || location.pathname === '/app/dashboard';
    }
    return location.pathname.startsWith(href);
  };

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 md:hidden bg-white/95 backdrop-blur-md border-t border-gray-200/50 shadow-[0_-2px_10px_rgba(0,0,0,0.05)]">
      <div className="flex items-center justify-around h-16 px-2">
        {navigation.map((item) => {
          const Icon = item.icon;
          const active = isActive(item.href);
          
          return (
            <Link
              key={item.name}
              to={item.href}
              className={cn(
                'flex flex-col items-center justify-center flex-1 py-2 px-1 text-xs font-medium transition-all duration-300 ease-out',
                active
                  ? 'text-blue-600'
                  : 'text-gray-500'
              )}
            >
              <Icon className={cn(
                'h-5 w-5 mb-1 transition-all duration-300',
                active 
                  ? 'text-blue-600' 
                  : 'text-gray-500'
              )} strokeWidth={active ? 2.5 : 2} />
              <span className={cn(
                'transition-all duration-300 whitespace-nowrap',
                active && 'font-semibold'
              )}>
                {item.name}
              </span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
};
