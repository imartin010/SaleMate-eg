import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { cn } from '../../lib/cn';
import {
  Home,
  Users,
  ShoppingCart,
  Handshake,
  Settings,
} from 'lucide-react';

export const BottomNav: React.FC = () => {
  const location = useLocation();

  const navigation = [
    {
      name: 'Home',
      href: '/',
      icon: Home,
    },
    {
      name: 'Shop',
      href: '/shop',
      icon: ShoppingCart,
    },
    {
      name: 'CRM',
      href: '/crm',
      icon: Users,
    },
    {
      name: 'Deals',
      href: '/deals',
      icon: Handshake,
    },
    {
      name: 'Settings',
      href: '/settings',
      icon: Settings,
    },
  ];

  const isActive = (href: string) => {
    if (href === '/') {
      return location.pathname === '/';
    }
    return location.pathname.startsWith(href);
  };

  return (
    <div className="fixed bottom-4 left-4 right-4 z-50 md:hidden">
      <div className="glass rounded-2xl border border-white/20">
        <nav className="flex p-2">
          {navigation.map((item) => {
            const Icon = item.icon;
            const active = isActive(item.href);
            
            return (
              <Link
                key={item.name}
                to={item.href}
                className={cn(
                  'group flex-1 flex flex-col items-center justify-center py-3 px-2 text-xs font-medium transition-all duration-300 ease-out rounded-xl',
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
                  'transition-all duration-300',
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
