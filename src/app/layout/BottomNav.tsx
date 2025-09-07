import React, { useRef, useEffect, useState } from 'react';
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
  ChevronRight,
} from 'lucide-react';

export const BottomNav: React.FC = () => {
  const location = useLocation();
  const { profile } = useAuthStore();
  const navRef = useRef<HTMLElement>(null);
  const [showScrollHint, setShowScrollHint] = useState(false);
  const [hasScrolled, setHasScrolled] = useState(false);

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

  // Check if navigation is scrollable
  useEffect(() => {
    const checkScrollable = () => {
      if (navRef.current) {
        const isScrollable = navRef.current.scrollWidth > navRef.current.clientWidth;
        setShowScrollHint(isScrollable && !hasScrolled);
      }
    };

    checkScrollable();
    window.addEventListener('resize', checkScrollable);
    return () => window.removeEventListener('resize', checkScrollable);
  }, [navigation.length, hasScrolled]);

  // Auto-scroll animation to show more options
  useEffect(() => {
    if (showScrollHint && navRef.current) {
      const nav = navRef.current;
      const scrollToRight = () => {
        nav.scrollTo({
          left: nav.scrollWidth - nav.clientWidth,
          behavior: 'smooth'
        });
      };

      const scrollToLeft = () => {
        nav.scrollTo({
          left: 0,
          behavior: 'smooth'
        });
      };

      // Start auto-scroll after a delay
      const timer1 = setTimeout(() => {
        scrollToRight();
      }, 2000);

      // Return to start after showing right side
      const timer2 = setTimeout(() => {
        scrollToLeft();
      }, 4000);

      // Hide hint after animation
      const timer3 = setTimeout(() => {
        setShowScrollHint(false);
        setHasScrolled(true);
      }, 6000);

      return () => {
        clearTimeout(timer1);
        clearTimeout(timer2);
        clearTimeout(timer3);
      };
    }
  }, [showScrollHint]);

  // Reset scroll hint when navigation changes
  useEffect(() => {
    setHasScrolled(false);
  }, [navigation.length]);

  return (
    <div className="fixed bottom-4 left-4 right-4 z-50 md:hidden">
      <div className="glass rounded-2xl border border-white/20 relative">
        {/* Scroll hint indicator */}
        {showScrollHint && (
          <div className="absolute -top-8 right-2 flex items-center gap-1 bg-primary/90 text-white px-2 py-1 rounded-full text-xs font-medium animate-pulse">
            <span>More options</span>
            <ChevronRight className="h-3 w-3" />
          </div>
        )}
        
        <nav 
          ref={navRef}
          className="flex overflow-x-auto scrollbar-hide p-2 gap-1"
          onScroll={() => {
            // Mark as scrolled when user manually scrolls
            if (!hasScrolled) {
              setHasScrolled(true);
              setShowScrollHint(false);
            }
          }}
        >
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
