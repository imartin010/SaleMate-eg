import React, { useEffect } from 'react';
import { cn } from '../../lib/cn';
import { X } from 'lucide-react';

interface BottomSheetProps {
  open: boolean;
  onClose: () => void;
  title?: string;
  children: React.ReactNode;
  footer?: React.ReactNode;
  maxHeight?: string;
  className?: string;
}

export const BottomSheet: React.FC<BottomSheetProps> = ({
  open,
  onClose,
  title,
  children,
  footer,
  maxHeight = '80vh',
  className,
}) => {
  // Prevent body scroll when open
  useEffect(() => {
    if (open) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [open]);

  if (!open) return null;

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/50 z-40 md:hidden"
        onClick={onClose}
      />

      {/* Bottom Sheet */}
      <div
        className={cn(
          'fixed inset-x-0 bottom-0 bg-background rounded-t-2xl shadow-lg z-50 md:hidden',
          'animate-in slide-in-from-bottom duration-300',
          className
        )}
        style={{ maxHeight }}
      >
        {/* Header */}
        {title && (
          <div className="sticky top-0 bg-background border-b border-border px-4 py-4 flex justify-between items-center z-10">
            <h2 className="text-xl font-semibold text-foreground">{title}</h2>
            <button
              onClick={onClose}
              className="w-11 h-11 min-w-[44px] min-h-[44px] flex items-center justify-center rounded-full hover:bg-accent transition-colors"
              aria-label="Close"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        )}

        {/* Content */}
        <div className="overflow-y-auto" style={{ maxHeight: `calc(${maxHeight} - ${title ? '80px' : '0px'})` }}>
          <div className="p-4">{children}</div>
        </div>

        {/* Footer */}
        {footer && (
          <div className="sticky bottom-0 bg-background border-t border-border p-4 z-10">
            {footer}
          </div>
        )}
      </div>
    </>
  );
};

