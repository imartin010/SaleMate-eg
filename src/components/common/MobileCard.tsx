import React from 'react';
import { cn } from '../../lib/cn';

interface MobileCardProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
  onClick?: () => void;
  tappable?: boolean;
}

export const MobileCard: React.FC<MobileCardProps> = ({
  children,
  onClick,
  tappable = false,
  className,
  ...props
}) => {
  return (
    <div
      className={cn(
        'w-full',
        'bg-card text-card-foreground',
        'rounded-xl border border-border',
        'shadow-sm hover:shadow-md transition-shadow',
        'p-4 md:p-6',
        'min-h-[80px]',
        tappable && onClick && 'cursor-pointer active:scale-[0.98] transition-transform',
        className
      )}
      onClick={onClick}
      role={tappable && onClick ? 'button' : undefined}
      tabIndex={tappable && onClick ? 0 : undefined}
      onKeyDown={(e) => {
        if (tappable && onClick && (e.key === 'Enter' || e.key === ' ')) {
          e.preventDefault();
          onClick();
        }
      }}
      {...props}
    >
      {children}
    </div>
  );
};

