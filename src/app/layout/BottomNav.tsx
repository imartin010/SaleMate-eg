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
  const [isScrolling, setIsScrolling] = useState(false);

  const navigation = [
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
      name: 'CRM',
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
      icon: Home,
      show: true,
    },
    {
      name: 'Deals',
      href: '/app/deals',
      icon: FileText,
      show: true,
    },
    {
      name: 'Team',
      href: '/app/team',
      icon: UserCheck,
      show: profile?.role === 'manager' || profile?.role === 'admin',
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
  ].filter(item => item.show);

  const isActive = (href: string) => {
    if (href === '/app') {
      return location.pathname === '/app' || location.pathname === '/app/';
    }
    return location.pathname.startsWith(href);
  };

  // Check if navigation is scrollable and show demo scroll
  useEffect(() => {
    const checkScrollable = () => {
      if (navRef.current) {
        const isScrollable = navRef.current.scrollWidth > navRef.current.clientWidth;
        setShowScrollHint(isScrollable);
        
        if (isScrollable && !hasScrolled) {
          startDemoScroll();
        }
      }
    };

    checkScrollable();
    window.addEventListener('resize', checkScrollable);
    return () => window.removeEventListener('resize', checkScrollable);
  }, [navigation.length, hasScrolled]);

  // Demo scroll function - goes right once then back to left
  const startDemoScroll = () => {
    if (!navRef.current || isScrolling) return;
    
    setIsScrolling(true);
    const nav = navRef.current;
    const maxScroll = nav.scrollWidth - nav.clientWidth;
    
    // Scroll to the right
    nav.scrollTo({
      left: maxScroll,
      behavior: 'smooth'
    });
    
    // After a brief pause, scroll back to the left
    setTimeout(() => {
      if (navRef.current) {
        nav.scrollTo({
          left: 0,
          behavior: 'smooth'
        });
        
        // Mark as scrolled and hide hint after animation
        setTimeout(() => {
          setHasScrolled(true);
          setIsScrolling(false);
          setShowScrollHint(false);
        }, 1000);
      }
    }, 1500);
  };

  // Reset scroll when navigation changes
  useEffect(() => {
    setHasScrolled(false);
  }, [navigation.length]);

  return (
    <div className="fixed bottom-4 left-4 right-4 z-50 md:hidden">
      <div className="glass rounded-2xl border border-white/20 relative">
        {/* Scroll hint indicator */}
        {showScrollHint && isScrolling && (
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
