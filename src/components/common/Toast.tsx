import React, { useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { CheckCircle, XCircle, AlertCircle, Info, X } from 'lucide-react';

export type ToastType = 'success' | 'error' | 'warning' | 'info';

export interface Toast {
  id: string;
  message: string;
  type: ToastType;
  duration?: number;
}

interface ToastProps {
  toast: Toast;
  onClose: () => void;
}

const ToastComponent: React.FC<ToastProps> = ({ toast, onClose }) => {
  const duration = toast.duration || 5000;

  useEffect(() => {
    const timer = setTimeout(onClose, duration);
    return () => clearTimeout(timer);
  }, [duration, onClose]);

  const icons = {
    success: CheckCircle,
    error: XCircle,
    warning: AlertCircle,
    info: Info,
  };

  const colors = {
    success: 'bg-blue-50 border-blue-200 text-blue-900',
    error: 'bg-red-50 border-red-200 text-red-900',
    warning: 'bg-amber-50 border-amber-200 text-amber-900',
    info: 'bg-blue-50 border-blue-200 text-blue-900',
  };

  const iconColors = {
    success: 'text-blue-600',
    error: 'text-red-600',
    warning: 'text-amber-600',
    info: 'text-blue-600',
  };

  const Icon = icons[toast.type];

  return (
    <motion.div
      initial={{ opacity: 0, y: -20, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: -20, scale: 0.95 }}
      transition={{ duration: 0.2 }}
      className={`rounded-xl border shadow-lg p-4 min-w-[300px] max-w-[400px] ${colors[toast.type]}`}
      role="alert"
      aria-live="polite"
    >
      <div className="flex items-start gap-3">
        <Icon className={`h-5 w-5 ${iconColors[toast.type]} flex-shrink-0 mt-0.5`} />
        <p className="flex-1 text-sm font-medium">{toast.message}</p>
        <button
          onClick={onClose}
          className="flex-shrink-0 text-gray-400 hover:text-gray-600 transition-colors"
          aria-label="Close notification"
        >
          <X className="h-4 w-4" />
        </button>
      </div>
    </motion.div>
  );
};

interface ToastContainerProps {
  toasts: Toast[];
  onClose: (id: string) => void;
}

export const ToastContainer: React.FC<ToastContainerProps> = ({ toasts, onClose }) => {
  return (
    <div
      className="fixed top-4 right-4 z-50 flex flex-col gap-2 pointer-events-none"
      aria-live="assertive"
      aria-atomic="true"
    >
      <AnimatePresence>
        {toasts.map((toast) => (
          <div key={toast.id} className="pointer-events-auto">
            <ToastComponent toast={toast} onClose={() => onClose(toast.id)} />
          </div>
        ))}
      </AnimatePresence>
    </div>
  );
};

