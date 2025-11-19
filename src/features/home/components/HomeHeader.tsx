import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Bell, FileText, Users, HelpCircle, Settings, X } from 'lucide-react';
import { Logo } from '../common/Logo';
import { useAuthStore } from '../../store/auth';
import { cn } from '../../lib/cn';
import { supabase } from '../../lib/supabaseClient';
import { NotificationBell } from '../notifications/NotificationBell';

export const HomeHeader: React.FC = () => {
  const { profile, user } = useAuthStore();
  const navigate = useNavigate();
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const scrollCheckIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // Get user initials for avatar
  const userInitials = profile?.name 
    ? profile.name.charAt(0).toUpperCase()
    : user?.email?.charAt(0).toUpperCase() || 'U';

  // Scroll detection - blend header with wallet section at top, white background when scrolled
  useEffect(() => {
    const checkScroll = () => {
      // Check multiple scroll sources for mobile compatibility
      let scrollPosition = 0;
      
      // Primary: Check the main element (AppLayout has overflow-y-auto on main)
      const mainContent = document.querySelector('main.overflow-y-auto') as HTMLElement;
      if (mainContent) {
        scrollPosition = mainContent.scrollTop;
      }
      
      // Fallback to window scroll
      if (scrollPosition === 0) {
        scrollPosition = 
          window.scrollY || 
          window.pageYOffset || 
          document.documentElement.scrollTop || 
          document.body.scrollTop || 
          0;
      }
      
      const shouldBeScrolled = scrollPosition > 50;
      setIsScrolled(prev => {
        if (prev !== shouldBeScrolled) {
          return shouldBeScrolled;
        }
        return prev;
      });
    };

    const handleScroll = () => {
      checkScroll();
    };

    // Listen to window scroll (fallback)
    window.addEventListener('scroll', handleScroll, { passive: true });
    
    // Listen to the main content container scroll (primary for AppLayout)
    let mainContent: HTMLElement | null = null;
    const attachMainListener = () => {
      mainContent = document.querySelector('main.overflow-y-auto') as HTMLElement;
      if (mainContent) {
        mainContent.addEventListener('scroll', handleScroll, { passive: true });
      }
    };
    
    // Try to attach immediately and also after a delay
    attachMainListener();
    const timeoutId = setTimeout(attachMainListener, 200);
    
    // Also use an interval as a fallback to check scroll position
    scrollCheckIntervalRef.current = setInterval(checkScroll, 100);
    
    checkScroll(); // Check initial position

    return () => {
      clearTimeout(timeoutId);
      if (scrollCheckIntervalRef.current) {
        clearInterval(scrollCheckIntervalRef.current);
      }
      window.removeEventListener('scroll', handleScroll);
      if (mainContent) {
        mainContent.removeEventListener('scroll', handleScroll);
      }
    };
  }, []);

  // Close menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as HTMLElement;
      if (showProfileMenu && !target.closest('[data-profile-menu]')) {
        setShowProfileMenu(false);
      }
    };

    if (showProfileMenu) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [showProfileMenu]);

  const menuItems = [
    { label: 'My Deals', icon: FileText, path: '/app/deals' },
    { label: 'My Team', icon: Users, path: '/app/team' },
    { label: 'Help', icon: HelpCircle, path: '/app/support' },
    { label: 'Settings', icon: Settings, path: '/app/settings' },
  ];

  const handleMenuClick = (path: string) => {
    navigate(path);
    setShowProfileMenu(false);
  };

  // Determine if we should show transparent background (only on home page at top)
  const location = useLocation();
  const isHomePage = location.pathname === '/app' || location.pathname === '/app/home' || location.pathname === '/app/dashboard';
  const shouldBeTransparent = isHomePage && !isScrolled;

  return (
    <>
      {/* Mobile Header - Full Header */}
      <header 
        className={cn(
          "sticky top-0 z-40 transition-all duration-300 w-full",
          "md:hidden", // Hide completely on desktop
          isScrolled 
            ? "bg-white border-b border-gray-200 shadow-md"
            : shouldBeTransparent
              ? "bg-transparent backdrop-blur-none border-b border-transparent"
              : "bg-white border-b border-gray-200 shadow-sm"
        )}
        style={{
          backgroundColor: isScrolled || !shouldBeTransparent ? '#ffffff' : 'transparent',
        }}
      >
        <div className={cn(
          "w-full container mx-auto px-4 py-4 relative z-10",
          "transition-colors duration-300"
        )}>
          <div className="flex items-center justify-between">
            {/* Profile Photo - Left (Mobile Only) */}
            <div className="relative" data-profile-menu>
              <button
                onClick={() => setShowProfileMenu(!showProfileMenu)}
                className={cn(
                  "relative w-10 h-10 rounded-full flex items-center justify-center",
                  "bg-gradient-to-br from-blue-500 via-blue-600 to-blue-700",
                  "text-white font-semibold text-sm transition-all duration-300",
                  "hover:scale-110",
                  "focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2",
                  isScrolled || !shouldBeTransparent
                    ? "shadow-lg" 
                    : "shadow-xl shadow-blue-900/20"
                )}
                aria-label="Open profile menu"
              >
                {userInitials}
              </button>

              {/* Profile Menu with Animation */}
              <AnimatePresence>
                {showProfileMenu && (
                  <>
                    {/* Backdrop Blur */}
                    <motion.div
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      transition={{ duration: 0.2 }}
                      className="fixed inset-0 bg-black/20 backdrop-blur-sm z-40"
                      onClick={() => setShowProfileMenu(false)}
                    />

                    {/* Menu Items - Animate from circle */}
                    <motion.div
                      initial={{ scale: 0, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      exit={{ scale: 0, opacity: 0 }}
                      transition={{ 
                        type: "spring",
                        stiffness: 300,
                        damping: 25,
                        duration: 0.3
                      }}
                      className="absolute left-0 top-14 z-50 min-w-[200px]"
                    >
                      <div className="bg-white rounded-2xl shadow-2xl border border-gray-100 overflow-hidden">
                        {menuItems.map((item, index) => {
                          const Icon = item.icon;
                          return (
                            <motion.button
                              key={item.path}
                              initial={{ x: -20, opacity: 0 }}
                              animate={{ x: 0, opacity: 1 }}
                              transition={{ 
                                delay: index * 0.05,
                                duration: 0.2
                              }}
                              onClick={() => handleMenuClick(item.path)}
                              className={cn(
                                "w-full flex items-center gap-3 px-4 py-3",
                                "text-left text-gray-700 hover:bg-gradient-to-r hover:from-blue-50 hover:to-blue-50",
                                "transition-colors duration-200",
                                "focus:outline-none focus:bg-blue-50"
                              )}
                            >
                              <Icon className="h-5 w-5 text-blue-600" />
                              <span className="font-medium">{item.label}</span>
                            </motion.button>
                          );
                        })}
                      </div>
                    </motion.div>
                  </>
                )}
              </AnimatePresence>
            </div>

            {/* Logo - Center (Mobile Only) */}
            <div className="flex-1 flex justify-center">
              <div className={cn(
                "transition-opacity duration-300",
                shouldBeTransparent && "drop-shadow-lg"
              )}>
                <Logo variant="icon" size="md" />
              </div>
            </div>

            {/* Notifications - Right (Mobile Only) */}
            <NotificationBell />
          </div>
        </div>
      </header>

      {/* Desktop Notification Bell - Fixed Position */}
      <div className="hidden md:block fixed top-4 right-4 z-50">
        <div className="bg-white shadow-lg border border-gray-200 rounded-full">
          <NotificationBell />
        </div>
      </div>
    </>
  );
};

