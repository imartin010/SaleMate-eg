import React, { useEffect, useState, useRef } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { cn } from '../../lib/cn';
import { useAuthStore } from '../../store/auth';
import { canAccessSupport, canAccessAdmin } from '../../lib/rbac';
import { Logo } from '../../components/common/Logo';
import { supabase } from '../../lib/supabaseClient';
import { useFeatureFlags } from '../../core/config/features';

import {
  LayoutDashboard,
  Users,
  ShoppingCart,
  Handshake,
  HeadphonesIcon,
  Shield,
  Settings,
  LogOut,
  LogIn,
  FileText,
  UserCheck,
  RefreshCw,
  Package,
  Mail,
  BarChart3,
} from 'lucide-react';

interface SidebarProps {
  className?: string;
}

export const Sidebar: React.FC<SidebarProps> = ({ className }) => {
  const location = useLocation();
  const { user, profile, signOut, refreshProfile } = useAuthStore();
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [pendingInvitationsCount, setPendingInvitationsCount] = useState(0);
  const sidebarRef = useRef<HTMLDivElement>(null);
  
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
          .from('team_members')
          .select('*', { count: 'exact', head: true })
          .eq('invited_email', profile.email)
          .eq('status', 'invited')
          .gt('invitation_expires_at', new Date().toISOString());

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

  const handleMouseEnter = () => setIsCollapsed(false);
  const handleMouseLeave = () => setIsCollapsed(true);

  // Handle click outside to collapse sidebar
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (sidebarRef.current && !sidebarRef.current.contains(event.target as Node)) {
        // Only collapse if sidebar is expanded
        if (!isCollapsed) {
          setIsCollapsed(true);
        }
      }
    };

    // Add event listener when sidebar is expanded
    if (!isCollapsed) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isCollapsed]);

  // Public navigation items (visible when logged out)
  const publicNavigation: Array<{
    name: string;
    href: string;
    icon: typeof LayoutDashboard;
    show: boolean;
  }> = [
    {
      name: 'Dashboard',
      href: '/app',
      icon: LayoutDashboard,
      show: false, // Hidden for now, will use later
    },
    {
      name: 'Shop',
      href: '/app/shop',
      icon: ShoppingCart,
      show: false, // Hidden for now, will use later
    },
    {
      name: 'Partners',
      href: '/app/partners',
      icon: Handshake,
      show: false, // Hidden for now, will use later
    },
    {
      name: 'Inventory',
      href: '/app/inventory',
      icon: Package,
      show: true,
    },
  ];

  // Get feature flags
  const { leadsShopEnabled, partnerDealsEnabled } = useFeatureFlags();

  // Authenticated navigation items (visible when logged in)
  const authenticatedNavigation: Array<{
    name: string;
    href: string;
    icon: typeof LayoutDashboard;
    show: boolean;
    badge?: number;
  }> = [
    {
      name: 'Dashboard',
      href: '/app/crm/dashboard',
      icon: LayoutDashboard,
      show: true, // Make visible for CRM launch
    },
    {
      name: 'Shop',
      href: '/app/shop',
      icon: ShoppingCart,
      show: leadsShopEnabled, // Use feature flag
    },
    {
      name: 'My Leads',
      href: '/app/crm',
      icon: Users,
      show: true,
    },
    {
      name: 'Analysis',
      href: '/app/crm/analysis',
      icon: BarChart3,
      show: true,
    },
    {
      name: 'Partners',
      href: '/app/partners',
      icon: Handshake,
      show: partnerDealsEnabled, // Use feature flag
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
      show: partnerDealsEnabled, // Use feature flag
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

  // Use appropriate navigation based on auth status
  const navigation = user ? authenticatedNavigation : publicNavigation;

  const isActive = (href: string) => {
    if (href === '/app') {
      return location.pathname === '/app' || location.pathname === '/app/';
    }
    return location.pathname.startsWith(href);
  };

  return (
    <div 
      ref={sidebarRef}
      className={cn(
        'flex h-screen flex-col sidebar-glass transition-all duration-300 ease-in-out',
        isCollapsed ? 'w-16' : 'w-64',
        className
      )}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      {/* Brand Header with Gradient */}
      <div className={cn(
        'flex h-32 flex-shrink-0 items-center justify-center border-b border-white/20 px-6 transition-all duration-300',
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
        'flex-1 space-y-2 overflow-y-auto transition-all duration-300',
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
      
      {/* User Profile Section or Login Section */}
      <div className={cn(
        'flex-shrink-0 border-t border-white/20 transition-all duration-300',
        isCollapsed ? 'p-2' : 'p-4'
      )}>
        {user ? (
          <>
            <div className={cn(
              'mb-3 rounded-xl bg-white/50 backdrop-blur-sm transition-all duration-300',
              isCollapsed ? 'p-2' : 'p-3'
            )}>
              <div className={cn(
                'mb-2 flex items-center gap-3',
                isCollapsed ? 'justify-center' : ''
              )}>
                <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full gradient-bg text-white font-bold text-lg">
                  {(profile?.name || user?.email || 'U').charAt(0).toUpperCase()}
                </div>
                {!isCollapsed && (
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-semibold text-foreground truncate">{profile?.name || user?.email || 'User'}</p>
                    <p className="text-xs text-muted-foreground truncate">{user?.email || 'No email'}</p>
                  </div>
                )}
              </div>
              {!isCollapsed && (
                <div className="flex items-center gap-2">
                  <div className="h-2 w-2 flex-shrink-0 rounded-full bg-green-400"></div>
                  <span className="text-xs font-medium text-muted-foreground capitalize">{profile?.role || 'user'}</span>
                  <button
                    onClick={refreshProfile}
                    className="ml-auto p-1 rounded hover:bg-white/20 transition-colors flex-shrink-0"
                    title="Refresh profile"
                  >
                    <RefreshCw className="h-3 w-3 text-muted-foreground" />
                  </button>
                </div>
              )}
            </div>
            
            <button
              onClick={signOut}
              className={cn(
                'group flex w-full items-center gap-3 rounded-xl py-2.5 text-sm font-medium text-muted-foreground transition-all duration-300 hover:neumorphic hover:text-destructive hover:scale-105',
                isCollapsed ? 'justify-center px-2' : 'px-4'
              )}
              title={isCollapsed ? 'Logout' : undefined}
            >
              <LogOut className="h-4 w-4 transition-transform group-hover:translate-x-1" />
              {!isCollapsed && <span>Logout</span>}
            </button>
          </>
        ) : (
          <div className="space-y-2">
            <Link
              to="/auth/login"
              className={cn(
                'group flex w-full items-center gap-3 rounded-xl py-2.5 text-sm font-medium text-muted-foreground transition-all duration-300 hover:neumorphic hover:text-primary hover:scale-105',
                isCollapsed ? 'justify-center px-2' : 'px-4'
              )}
              title={isCollapsed ? 'Login' : undefined}
            >
              <LogIn className="h-4 w-4 transition-transform group-hover:translate-x-1" />
              {!isCollapsed && <span>Login</span>}
            </Link>
            <Link
              to="/auth/signup"
              className={cn(
                'group flex w-full items-center gap-3 rounded-xl py-2.5 text-sm font-medium text-white bg-gradient-to-r from-blue-600 to-indigo-600 transition-all duration-300 hover:from-blue-700 hover:to-indigo-700 hover:scale-105',
                isCollapsed ? 'justify-center px-2' : 'px-4'
              )}
              title={isCollapsed ? 'Sign Up' : undefined}
            >
              {!isCollapsed && <span>Sign Up</span>}
            </Link>
          </div>
        )}
      </div>
    </div>
  );
};
