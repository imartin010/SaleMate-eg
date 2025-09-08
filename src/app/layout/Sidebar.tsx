import React, { useEffect, useState } from 'react';
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
  FileText,
  UserCheck,
} from 'lucide-react';

interface SidebarProps {
  className?: string;
}

export const Sidebar: React.FC<SidebarProps> = ({ className }) => {
  const location = useLocation();
  const { user, profile, signOut, refreshProfile } = useAuthStore();
  const [isCollapsed, setIsCollapsed] = useState(false);
  
  // Debug logging
  console.log('🔍 Sidebar - User:', user?.email);
  console.log('🔍 Sidebar - Profile:', profile);
  console.log('🔍 Sidebar - Profile Role:', profile?.role);

  // Auto-refresh profile when component mounts
  useEffect(() => {
    if (user && (!profile || profile.role === 'user')) {
      console.log('🔄 Auto-refreshing profile in Sidebar...');
      refreshProfile();
      
      // If still showing as user after 3 seconds, force a more aggressive refresh
      const timeoutId = setTimeout(() => {
        const currentProfile = useAuthStore.getState().profile;
        if (currentProfile && currentProfile.role === 'user') {
          console.log('🚨 Still showing as user, forcing aggressive refresh...');
          // Clear all possible auth storage
          const keysToRemove = [
            'sb-wkxbhvckmgrmdkdkhnqo-auth-token',
            'sb-wkxbhvckmgrmdkdkhnqo-refresh-token',
            'supabase.auth.token',
            'supabase.auth.refreshToken',
            'salemate-auth',
            'auth-storage'
          ];
          
          keysToRemove.forEach(key => {
            localStorage.removeItem(key);
            sessionStorage.removeItem(key);
          });
          
          window.location.reload();
        }
      }, 3000);
      
      return () => clearTimeout(timeoutId);
    }
  }, [user, profile, refreshProfile]);

  // Force refresh button for debugging
  const handleForceRefresh = () => {
    console.log('🔄 Force refreshing profile...');
    
    // Clear all possible auth storage
    const keysToRemove = [
      'sb-wkxbhvckmgrmdkdkhnqo-auth-token',
      'sb-wkxbhvckmgrmdkdkhnqo-refresh-token',
      'supabase.auth.token',
      'supabase.auth.refreshToken',
      'salemate-auth',
      'auth-storage',
      'supabase.auth.expires_at',
      'supabase.auth.expires_in',
      'supabase.auth.token_type',
      'supabase.auth.user',
      'supabase.auth.session'
    ];
    
    keysToRemove.forEach(key => {
      localStorage.removeItem(key);
      sessionStorage.removeItem(key);
    });
    
    // Force refresh profile first
    refreshProfile();
    
    // Then reload the page after a short delay
    setTimeout(() => {
      console.log('🔄 Reloading page to clear all cache...');
      window.location.href = window.location.href;
    }, 1000);
  };

  if (!user) return null;

  const handleMouseEnter = () => setIsCollapsed(false);
  const handleMouseLeave = () => setIsCollapsed(true);

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
            return (
              <Link
                key={item.name}
                to={item.href}
                className={cn(
                  'group flex items-center gap-4 rounded-xl px-4 py-3 text-sm font-medium transition-all duration-300 ease-out',
                  isActive(item.href)
                    ? 'neumorphic-inset text-primary shadow-lg'
                    : 'text-muted-foreground hover:neumorphic hover:text-foreground hover:scale-105',
                  isCollapsed ? 'justify-center px-2' : 'px-4'
                )}
                title={isCollapsed ? item.name : undefined}
              >
                <Icon className={cn(
                  'h-5 w-5 transition-all duration-300',
                  isActive(item.href) 
                    ? 'text-primary' 
                    : 'text-muted-foreground group-hover:text-primary'
                )} />
                {!isCollapsed && <span>{item.name}</span>}
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
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="h-2 w-2 rounded-full bg-green-400"></div>
                <span className="text-xs font-medium text-muted-foreground capitalize">{profile?.role || 'user'}</span>
              </div>
              <button
                onClick={handleForceRefresh}
                className="p-1 text-xs text-muted-foreground hover:text-foreground rounded hover:bg-white/20 transition-colors"
                title="Refresh Profile"
              >
                🔄
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
