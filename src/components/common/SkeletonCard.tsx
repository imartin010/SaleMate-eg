import React from 'react';
import { cn } from '../../lib/cn';

interface SkeletonCardProps {
  className?: string;
  lines?: number;
}

export const SkeletonCard: React.FC<SkeletonCardProps> = ({
  className,
  lines = 3,
}) => {
  return (
    <div
      className={cn(
        'w-full bg-card border border-border rounded-xl p-4 md:p-6',
        'animate-pulse',
        className
      )}
    >
      {/* Title skeleton */}
      <div className="h-5 md:h-6 bg-muted rounded-md w-3/4 mb-3 md:mb-4" />

      {/* Content lines */}
      <div className="space-y-2 md:space-y-3">
        {Array.from({ length: lines }).map((_, i) => (
          <div
            key={i}
            className={cn(
              'h-4 bg-muted rounded-md',
              i === lines - 1 ? 'w-1/2' : 'w-full'
            )}
          />
        ))}
      </div>

      {/* Action buttons skeleton (optional) */}
      <div className="flex gap-2 mt-4 md:mt-6">
        <div className="h-10 md:h-9 bg-muted rounded-md flex-1" />
        <div className="h-10 md:h-9 bg-muted rounded-md flex-1" />
      </div>
    </div>
  );
};

interface SkeletonListProps {
  count?: number;
  className?: string;
}

export const SkeletonList: React.FC<SkeletonListProps> = ({
  count = 3,
  className,
}) => {
  return (
    <div className={cn('space-y-4', className)}>
      {Array.from({ length: count }).map((_, i) => (
        <SkeletonCard key={i} />
      ))}
    </div>
  );
};

