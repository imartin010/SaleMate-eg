import React from 'react';
import { cn } from '../../lib/cn';

interface EmptyStateProps {
  title: string;
  description?: string;
  illustration?: React.ReactNode;
  illustrationSrc?: string;
  ctaText?: string;
  onCtaClick?: () => void;
  className?: string;
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  title,
  description,
  illustration,
  illustrationSrc,
  ctaText,
  onCtaClick,
  className,
}) => {
  return (
    <div
      className={cn(
        'flex flex-col items-center justify-center p-8 md:p-12 min-h-[400px] md:min-h-[500px] text-center',
        className
      )}
    >
      {/* Illustration */}
      {(illustration || illustrationSrc) && (
        <div className="mb-6 md:mb-8 max-w-[200px] md:max-w-[300px]">
          {illustrationSrc ? (
            <img
              src={illustrationSrc}
              alt={title}
              className="w-full h-auto max-h-[200px] md:max-h-[300px] object-contain"
            />
          ) : (
            illustration
          )}
        </div>
      )}

      {/* Title */}
      <h3 className="text-xl md:text-2xl font-semibold mb-2 md:mb-3 text-foreground">
        {title}
      </h3>

      {/* Description */}
      {description && (
        <p className="text-base md:text-sm text-muted-foreground mb-6 md:mb-8 max-w-sm md:max-w-md">
          {description}
        </p>
      )}

      {/* CTA Button */}
      {ctaText && onCtaClick && (
        <button
          onClick={onCtaClick}
          className="w-full md:w-auto max-w-xs md:max-w-none h-12 md:h-10 px-6 md:px-4 bg-primary text-primary-foreground rounded-lg font-semibold text-base md:text-sm hover:bg-primary/90 transition-colors min-h-[48px] md:min-h-[40px]"
        >
          {ctaText}
        </button>
      )}
    </div>
  );
};

