import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { cn } from '../../lib/cn';
import { useAuthStore } from '../../store/auth';
import { canAccessSupport, canAccessAdmin } from '../../lib/rbac';
import { Logo } from '../../components/common/Logo';
import {
  LayoutDashboard,
  Users,
  ShoppingCart,
  Handshake,
  HeadphonesIcon,
  Shield,
  Settings,
  LogOut,
} from 'lucide-react';

interface SidebarProps {
  className?: string;
}

export const Sidebar: React.FC<SidebarProps> = ({ className }) => {
  const location = useLocation();
  const { user, logout } = useAuthStore();

  if (!user) return null;

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
      name: 'My Leads',
      href: '/crm',
      icon: Users,
      show: true,
    },
    {
      name: 'My Deals',
      href: '/deals',
      icon: Handshake,
      show: true,
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
      show: canAccessSupport(user.role),
    },
    {
      name: 'Admin',
      href: '/admin',
      icon: Shield,
      show: canAccessAdmin(user.role),
    },
    {
      name: 'Settings',
      href: '/settings',
      icon: Settings,
      show: true,
    },
  ];

  const isActive = (href: string) => {
    if (href === '/') {
      return location.pathname === '/';
    }
    return location.pathname.startsWith(href);
  };

  return (
    <div className={cn('flex h-full w-64 flex-col sidebar-glass', className)}>
      {/* Brand Header with Gradient */}
      <div className="flex h-32 items-center justify-center border-b border-white/20 px-6">
        <Logo variant="icon" size="xl" className="scale-[2.5]" />
      </div>
      
      {/* Navigation Menu */}
      <nav className="flex-1 space-y-2 p-6">
        {navigation
          .filter(item => item.show)
          .map((item) => {
            const Icon = item.icon;
            return (
              <Link
                key={item.name}
                to={item.href}
                className={cn(
                  'group flex items-center gap-4 rounded-xl px-4 py-3 text-sm font-medium transition-all duration-300 ease-out',
                  isActive(item.href)
                    ? 'neumorphic-inset text-primary shadow-lg'
                    : 'text-muted-foreground hover:neumorphic hover:text-foreground hover:scale-105'
                )}
              >
                <Icon className={cn(
                  'h-5 w-5 transition-all duration-300',
                  isActive(item.href) 
                    ? 'text-primary' 
                    : 'text-muted-foreground group-hover:text-primary'
                )} />
                {item.name}
              </Link>
            );
          })}
      </nav>
      
      {/* User Profile Section */}
      <div className="border-t border-white/20 p-6">
        <div className="mb-4 rounded-xl bg-white/50 p-4 backdrop-blur-sm">
          <div className="mb-3 flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-full gradient-bg text-white font-bold text-lg">
              {user.name.charAt(0)}
            </div>
            <div>
              <p className="text-sm font-semibold text-foreground">{user.name}</p>
              <p className="text-xs text-muted-foreground">{user.email}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <div className="h-2 w-2 rounded-full bg-green-400"></div>
            <span className="text-xs font-medium text-muted-foreground capitalize">{user.role}</span>
          </div>
        </div>
        
        <button
          onClick={logout}
          className="group flex w-full items-center gap-3 rounded-xl px-4 py-3 text-sm font-medium text-muted-foreground transition-all duration-300 hover:neumorphic hover:text-destructive hover:scale-105"
        >
          <LogOut className="h-4 w-4 transition-transform group-hover:translate-x-1" />
          Logout
        </button>
      </div>
    </div>
  );
};
