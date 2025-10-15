import React, { useEffect, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { cn } from '../../lib/cn';
import { useAuthStore } from '../../store/auth';
import { canAccessSupport, canAccessAdmin } from '../../lib/rbac';
import { Logo } from '../../components/common/Logo';
import { supabase } from '../../lib/supabaseClient';

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
  Package,
  Mail,
} from 'lucide-react';

interface SidebarProps {
  className?: string;
}

export const Sidebar: React.FC<SidebarProps> = ({ className }) => {
  const location = useLocation();
  const { user, profile, signOut, refreshProfile } = useAuthStore();
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [pendingInvitationsCount, setPendingInvitationsCount] = useState(0);
  
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

  // Fetch pending invitations count
  useEffect(() => {
    const fetchInvitationsCount = async () => {
      if (!user || !profile) return;

      try {
        const { count } = await supabase
          .from('team_invitations')
          .select('*', { count: 'exact', head: true })
          .eq('invitee_email', profile.email)
          .eq('status', 'pending')
          .gt('expires_at', new Date().toISOString());

        setPendingInvitationsCount(count || 0);
      } catch (error) {
        console.error('Error fetching invitations count:', error);
      }
    };

    fetchInvitationsCount();
    
    // Refresh count every 30 seconds
    const interval = setInterval(fetchInvitationsCount, 30000);
    return () => clearInterval(interval);
  }, [user, profile]);

  if (!user) return null;

  const handleMouseEnter = () => setIsCollapsed(false);
  const handleMouseLeave = () => setIsCollapsed(true);

  const navigation: Array<{
    name: string;
    href: string;
    icon: typeof LayoutDashboard;
    show: boolean;
    badge?: number;
  }> = [
    {
      name: 'Dashboard',
      href: '/app',
      icon: LayoutDashboard,
      show: true,
    },
    {
      name: 'Shop',
      href: '/app/shop',
      icon: ShoppingCart,
      show: true,
    },
    {
      name: 'My Leads',
      href: '/app/crm',
      icon: Users,
      show: true,
    },
    {
      name: 'Partners',
      href: '/app/partners',
      icon: Handshake,
      show: true,
    },
    {
      name: 'Inventory',
      href: '/app/inventory',
      icon: Package,
      show: true,
    },
    {
      name: 'My Deals',
      href: '/app/deals',
      icon: FileText,
      show: true,
    },
    {
      name: 'My Team',
      href: '/app/team',
      icon: UserCheck,
      show: true,
      badge: pendingInvitationsCount > 0 ? pendingInvitationsCount : undefined,
    },
    {
      name: 'Support',
      href: '/app/support',
      icon: HeadphonesIcon,
      show: canAccessSupport(profile?.role || 'user'),
    },
    {
      name: 'Admin',
      href: '/app/admin',
      icon: Shield,
      show: canAccessAdmin(profile?.role || 'user'),
    },
    {
      name: 'Settings',
      href: '/app/settings',
      icon: Settings,
      show: true,
    },
  ];

  const isActive = (href: string) => {
    if (href === '/app') {
      return location.pathname === '/app' || location.pathname === '/app/';
    }
    return location.pathname.startsWith(href);
  };

  return (
    <div 
      className={cn(
        'flex h-full flex-col sidebar-glass transition-all duration-300 ease-in-out',
        isCollapsed ? 'w-16' : 'w-64',
        className
      )}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      {/* Brand Header with Gradient */}
      <div className={cn(
        'flex h-32 items-center justify-center border-b border-white/20 px-6 transition-all duration-300',
        isCollapsed ? 'px-2' : 'px-6'
      )}>
        {isCollapsed ? (
          <Logo variant="icon" size="sm" className="scale-[1.2]" />
        ) : (
          <Logo variant="icon" size="md" className="scale-[1.5]" />
        )}
      </div>
      
      {/* Navigation Menu */}
      <nav className={cn(
        'flex-1 space-y-2 transition-all duration-300',
        isCollapsed ? 'p-2' : 'p-6'
      )}>
        {navigation
          .filter(item => item.show)
          .map((item) => {
            const Icon = item.icon;
            const hasBadge = item.badge && item.badge > 0;
            return (
              <Link
                key={item.name}
                to={item.href}
                className={cn(
                  'group flex items-center gap-4 rounded-xl px-4 py-3 text-sm font-medium transition-all duration-300 ease-out relative',
                  isActive(item.href)
                    ? 'neumorphic-inset text-primary shadow-lg'
                    : 'text-muted-foreground hover:neumorphic hover:text-foreground hover:scale-105',
                  isCollapsed ? 'justify-center px-2' : 'px-4'
                )}
                title={isCollapsed ? item.name : undefined}
              >
                <div className="relative">
                  <Icon className={cn(
                    'h-5 w-5 transition-all duration-300',
                    isActive(item.href) 
                      ? 'text-primary' 
                      : 'text-muted-foreground group-hover:text-primary'
                  )} />
                  {hasBadge && (
                    <div className="absolute -top-2 -right-2 h-5 w-5 bg-red-500 text-white text-xs font-bold rounded-full flex items-center justify-center animate-pulse">
                      {item.badge}
                    </div>
                  )}
                </div>
                {!isCollapsed && (
                  <div className="flex items-center justify-between flex-1">
                    <span>{item.name}</span>
                    {hasBadge && (
                      <div className="h-6 w-6 bg-red-500 text-white text-xs font-bold rounded-full flex items-center justify-center">
                        {item.badge}
                      </div>
                    )}
                  </div>
                )}
              </Link>
            );
          })}
      </nav>
      
      {/* User Profile Section */}
      <div className={cn(
        'border-t border-white/20 transition-all duration-300',
        isCollapsed ? 'p-2' : 'p-6'
      )}>
        <div className={cn(
          'mb-4 rounded-xl bg-white/50 backdrop-blur-sm transition-all duration-300',
          isCollapsed ? 'p-2' : 'p-4'
        )}>
          <div className={cn(
            'mb-3 flex items-center gap-3',
            isCollapsed ? 'justify-center' : ''
          )}>
            <div className="flex h-10 w-10 items-center justify-center rounded-full gradient-bg text-white font-bold text-lg">
              {(profile?.name || user?.email || 'U').charAt(0).toUpperCase()}
            </div>
            {!isCollapsed && (
              <div>
                <p className="text-sm font-semibold text-foreground">{profile?.name || user?.email || 'User'}</p>
                <p className="text-xs text-muted-foreground">{user?.email || 'No email'}</p>
              </div>
            )}
          </div>
          {!isCollapsed && (
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
          )}
        </div>
        
                <div className="space-y-2">
          <button
            onClick={signOut}
            className={cn(
              'group flex w-full items-center gap-3 rounded-xl py-3 text-sm font-medium text-muted-foreground transition-all duration-300 hover:neumorphic hover:text-destructive hover:scale-105',
              isCollapsed ? 'justify-center px-2' : 'px-4'
            )}
            title={isCollapsed ? 'Logout' : undefined}
          >
            <LogOut className="h-4 w-4 transition-transform group-hover:translate-x-1" />
            {!isCollapsed && <span>Logout</span>}
          </button>
        </div>
      </div>
    </div>
  );
};
