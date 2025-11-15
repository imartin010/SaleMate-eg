import React from 'react';
import { cn } from '../../lib/cn';
import { Button, ButtonProps } from '../ui/button';

interface StickySubmitButtonProps extends Omit<ButtonProps, 'type'> {
  label: string;
  loading?: boolean;
  disabled?: boolean;
  form?: string; // Form ID to submit
}

export const StickySubmitButton: React.FC<StickySubmitButtonProps> = ({
  label,
  loading,
  disabled,
  form,
  className,
  ...props
}) => {
  return (
    <div className="fixed bottom-0 left-0 right-0 bg-background border-t border-border p-4 z-50 md:relative md:border-t-0 md:p-0 md:bg-transparent md:z-auto">
      <Button
        type="submit"
        form={form}
        size="mobile"
        disabled={disabled || loading}
        className={cn('w-full md:w-auto', className)}
        {...props}
      >
        {loading ? (
          <span className="flex items-center gap-2">
            <span className="animate-spin">⏳</span>
            Processing...
          </span>
        ) : (
          label
        )}
      </Button>
    </div>
  );
};

