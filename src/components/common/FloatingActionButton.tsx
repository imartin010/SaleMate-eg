import React from 'react';
import { cn } from '../../lib/cn';
import { Plus } from 'lucide-react';

interface FloatingActionButtonProps {
  onClick: () => void;
  icon?: React.ReactNode;
  label?: string;
  className?: string;
  'aria-label'?: string;
}

export const FloatingActionButton: React.FC<FloatingActionButtonProps> = ({
  onClick,
  icon,
  label,
  className,
  'aria-label': ariaLabel,
}) => {
  return (
    <button
      onClick={onClick}
      className={cn(
        'fixed bottom-20 md:bottom-6 right-4 md:right-6',
        'w-14 h-14 md:w-12 md:h-12',
        'min-w-[56px] min-h-[56px] md:min-w-[48px] md:min-h-[48px]',
        'bg-primary text-primary-foreground',
        'rounded-full shadow-lg',
        'flex items-center justify-center',
        'hover:bg-primary/90 transition-colors',
        'z-50',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2',
        className
      )}
      aria-label={ariaLabel || label || 'Add'}
    >
      {icon || <Plus className="w-6 h-6 md:w-5 md:h-5" />}
      {label && (
        <span className="sr-only md:not-sr-only md:ml-2 text-sm font-medium">
          {label}
        </span>
      )}
    </button>
  );
};

