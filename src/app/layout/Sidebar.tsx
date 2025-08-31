import React, { useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { cn } from '../../lib/cn';
import { useAuthStore } from '../../store/auth';
import { canAccessSupport, canAccessAdmin } from '../../lib/rbac';
import { Logo } from '../../components/common/Logo';
import { clearAllAuthData } from '../../lib/clearAuthData';
import {
  LayoutDashboard,
  Users,
  ShoppingCart,
  Handshake,
  HeadphonesIcon,
  Shield,
  Settings,
  LogOut,
  FileText,
  UserCheck,
  RefreshCw,
  Trash2,
} from 'lucide-react';

interface SidebarProps {
  className?: string;
}

export const Sidebar: React.FC<SidebarProps> = ({ className }) => {
  const location = useLocation();
  const { user, profile, signOut, refreshProfile } = useAuthStore();
  
  // Debug logging
  console.log('🔍 Sidebar - User:', user?.email);
  console.log('🔍 Sidebar - Profile:', profile);
  console.log('🔍 Sidebar - Profile Role:', profile?.role);

  // Auto-refresh profile when component mounts
  useEffect(() => {
    if (user && (!profile || profile.role === 'user')) {
      console.log('🔄 Auto-refreshing profile in Sidebar...');
      refreshProfile();
    }
  }, [user, profile, refreshProfile]);

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
      icon: FileText,
      show: true,
    },
    {
      name: 'My Team',
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
              {(profile?.name || user?.email || 'U').charAt(0).toUpperCase()}
            </div>
            <div>
              <p className="text-sm font-semibold text-foreground">{profile?.name || user?.email || 'User'}</p>
              <p className="text-xs text-muted-foreground">{user?.email || 'No email'}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <div className="h-2 w-2 rounded-full bg-green-400"></div>
            <span className="text-xs font-medium text-muted-foreground capitalize">{profile?.role || 'user'}</span>
            <button
              onClick={refreshProfile}
              className="ml-auto p-1 rounded hover:bg-white/20 transition-colors"
              title="Refresh profile"
            >
              <RefreshCw className="h-3 w-3 text-muted-foreground" />
            </button>
          </div>
        </div>
        
        <div className="space-y-2">
          <button
            onClick={signOut}
            className="group flex w-full items-center gap-3 rounded-xl px-4 py-3 text-sm font-medium text-muted-foreground transition-all duration-300 hover:neumorphic hover:text-destructive hover:scale-105"
          >
            <LogOut className="h-4 w-4 transition-transform group-hover:translate-x-1" />
            Logout
          </button>
          
          <button
            onClick={clearAllAuthData}
            className="group flex w-full items-center gap-3 rounded-xl px-4 py-3 text-sm font-medium text-muted-foreground transition-all duration-300 hover:neumorphic hover:text-red-500 hover:scale-105"
            title="Clear all authentication data and reload"
          >
            <Trash2 className="h-4 w-4 transition-transform group-hover:scale-110" />
            Clear All Data
          </button>
        </div>
      </div>
    </div>
  );
};
