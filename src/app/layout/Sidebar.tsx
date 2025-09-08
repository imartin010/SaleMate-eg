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
  
  // TEMPORARY ADMIN OVERRIDE - Force admin role for debugging
  const isAdminEmail = user?.email === 'themartining@gmail.com' || 
                      user?.email?.includes('martin') || 
                      user?.email?.includes('admin');
  
  const effectiveProfile = profile && isAdminEmail ? 
    { ...profile, role: 'admin' as const } : profile;
  
  console.log('🎯 Effective Role:', effectiveProfile?.role);
  console.log('🔍 Is Admin Email:', isAdminEmail);

  // Auto-refresh profile when component mounts (non-aggressive version)
  useEffect(() => {
    if (user && (!profile || (profile.role === 'user' && !isAdminEmail))) {
      console.log('🔄 Auto-refreshing profile in Sidebar...');
      refreshProfile();
    }
  }, [user, profile, refreshProfile, isAdminEmail]);

  // Force refresh button for debugging (non-destructive)
  const handleForceRefresh = () => {
    console.log('🔄 Force refreshing profile...');
    
    // Only refresh the profile, don't clear auth storage
    refreshProfile();
    
    // Optional: Clear only profile-specific cache (not auth tokens)
    const profileCacheKeys = ['profile-cache', 'user-role-cache'];
    profileCacheKeys.forEach(key => {
      localStorage.removeItem(key);
      sessionStorage.removeItem(key);
    });
    
    console.log('✅ Profile refresh completed');
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
      show: effectiveProfile?.role === 'manager' || effectiveProfile?.role === 'admin',
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
      show: canAccessSupport(effectiveProfile?.role || 'user'),
    },
    {
      name: 'Admin',
      href: '/admin',
      icon: Shield,
      show: canAccessAdmin(effectiveProfile?.role || 'user'),
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
              {(effectiveProfile?.name || user?.email || 'U').charAt(0).toUpperCase()}
            </div>
            {!isCollapsed && (
              <div>
                <p className="text-sm font-semibold text-foreground">{effectiveProfile?.name || user?.email || 'User'}</p>
                <p className="text-xs text-muted-foreground">{user?.email || 'No email'}</p>
              </div>
            )}
          </div>
          {!isCollapsed && (
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="h-2 w-2 rounded-full bg-green-400"></div>
                <span className="text-xs font-medium text-muted-foreground capitalize">{effectiveProfile?.role || 'user'}</span>
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
