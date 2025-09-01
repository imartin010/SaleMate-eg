import React from 'react';
import { cn } from '../../lib/cn';

interface LogoProps {
  variant?: 'full' | 'icon' | 'text';
  size?: 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
  showTagline?: boolean;
}

export const Logo: React.FC<LogoProps> = ({ 
  variant = 'full', 
  size = 'md', 
  className,
  showTagline = false 
}) => {
  const sizeClasses = {
    sm: 'text-lg',
    md: 'text-2xl',
    lg: 'text-3xl',
    xl: 'text-4xl'
  };

  const iconSizes = {
    sm: 'w-8 h-8',
    md: 'w-12 h-12',
    lg: 'w-16 h-16',
    xl: 'w-20 h-20'
  };

  if (variant === 'icon') {
    return (
      <div className={cn('flex items-center justify-center', className)}>
        <img 
          src="https://wkxbhvckmgrmdkdkhnqo.supabase.co/storage/v1/object/public/partners-logos/sale_mate_logo.png"
          alt="SaleMate Logo"
          className={cn('object-contain', iconSizes[size])}
          onError={(e) => {
            const target = e.target as HTMLImageElement;
            target.style.display = 'none';
            const fallback = document.createElement('div');
            fallback.className = cn(
              'relative rounded-xl bg-gradient-to-br from-blue-600 via-purple-600 to-indigo-700',
              'flex items-center justify-center text-white font-bold',
              iconSizes[size]
            );
            fallback.innerHTML = '<span class="text-xs">SM</span>';
            target.parentNode?.appendChild(fallback);
          }}
        />
      </div>
    );
  }

  if (variant === 'text') {
    return (
      <div className={cn('flex flex-col', className)}>
        <h1 className={cn(
          'font-bold text-gradient leading-tight',
          sizeClasses[size]
        )}>
          SaleMate
        </h1>
        {showTagline && (
          <p className="text-xs text-muted-foreground font-medium leading-tight">
            Real Estate Excellence
          </p>
        )}
      </div>
    );
  }

  // Full variant (default) - now shows only the icon, larger size
  return (
    <div className={cn('flex items-center justify-center', className)}>
      <img 
        src="https://wkxbhvckmgrmdkdkhnqo.supabase.co/storage/v1/object/public/partners-logos/sale_mate_logo.png"
        alt="SaleMate Logo"
        className={cn('object-contain', iconSizes[size])}
        onError={(e) => {
          const target = e.target as HTMLImageElement;
          target.style.display = 'none';
          const fallback = document.createElement('div');
          fallback.className = cn(
            'relative rounded-xl bg-gradient-to-br from-blue-600 via-purple-600 to-indigo-700',
            'flex items-center justify-center text-white font-bold',
            iconSizes[size]
          );
          fallback.innerHTML = '<span class="text-xs">SM</span>';
          target.parentNode?.appendChild(fallback);
        }}
      />
    </div>
  );
};
