import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { cn } from '../../lib/cn';
import { useAuthStore } from '../../store/auth';
import { canAccessAdmin, canAccessSupport } from '../../lib/rbac';
import {
  LayoutDashboard,
  Home,
  Users,
  ShoppingCart,
  Handshake,
  Settings,
  FileText,
  UserCheck,
  HeadphonesIcon,
  Shield,
} from 'lucide-react';

export const BottomNav: React.FC = () => {
  const location = useLocation();
  const { profile } = useAuthStore();

  const navigation = [
    {
      name: 'Dashboard',
      href: '/',
      icon: LayoutDashboard,
      show: true,
    },
    {
      name: 'Shop',
      href: '/shop',
      icon: ShoppingCart,
      show: true,
    },
    {
      name: 'Inventory',
      href: '/inventory',
      icon: Home,
      show: true,
    },
    {
      name: 'CRM',
      href: '/crm',
      icon: Users,
      show: true,
    },
    {
      name: 'Deals',
      href: '/deals',
      icon: FileText,
      show: true,
    },
    {
      name: 'Team',
      href: '/team',
      icon: UserCheck,
      show: profile?.role === 'manager' || profile?.role === 'admin',
    },
    {
      name: 'Partners',
      href: '/partners',
      icon: Handshake,
      show: true,
    },
    {
      name: 'Support',
      href: '/support',
      icon: HeadphonesIcon,
      show: canAccessSupport(profile?.role || 'user'),
    },
    {
      name: 'Admin',
      href: '/admin',
      icon: Shield,
      show: canAccessAdmin(profile?.role || 'user'),
    },
    {
      name: 'Settings',
      href: '/settings',
      icon: Settings,
      show: true,
    },
  ].filter(item => item.show);

  const isActive = (href: string) => {
    if (href === '/') {
      return location.pathname === '/';
    }
    return location.pathname.startsWith(href);
  };

  return (
    <div className="fixed bottom-4 left-4 right-4 z-50 md:hidden">
      <div className="glass rounded-2xl border border-white/20">
        <nav className="flex overflow-x-auto scrollbar-hide p-2 gap-1">
          {navigation.map((item) => {
            const Icon = item.icon;
            const active = isActive(item.href);
            
            return (
              <Link
                key={item.name}
                to={item.href}
                className={cn(
                  'group flex-shrink-0 flex flex-col items-center justify-center py-3 px-3 text-xs font-medium transition-all duration-300 ease-out rounded-xl min-w-[72px]',
                  active
                    ? 'neumorphic-inset text-primary scale-105'
                    : 'text-muted-foreground hover:text-foreground hover:scale-105'
                )}
              >
                <Icon className={cn(
                  'h-5 w-5 mb-1 transition-all duration-300',
                  active 
                    ? 'text-primary' 
                    : 'text-muted-foreground group-hover:text-primary'
                )} />
                <span className={cn(
                  'transition-all duration-300 whitespace-nowrap',
                  active && 'text-primary font-semibold'
                )}>
                  {item.name}
                </span>
              </Link>
            );
          })}
        </nav>
      </div>
    </div>
  );
};
