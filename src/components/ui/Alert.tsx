import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { AlertTriangle, CheckCircle, XCircle, X, Info } from 'lucide-react';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export type AlertSeverity = 'critical' | 'warning' | 'success' | 'info';

interface AlertProps {
  severity: AlertSeverity;
  title: string;
  message?: string;
  onClose?: () => void;
  closable?: boolean;
  className?: string;
  icon?: React.ReactNode;
  action?: React.ReactNode;
}

export const Alert: React.FC<AlertProps> = ({
  severity,
  title,
  message,
  onClose,
  closable = true,
  className,
  icon,
  action,
}) => {
  const severityConfig = {
    critical: {
      icon: <XCircle size={20} />,
      bgColor: 'bg-critical/10',
      borderColor: 'border-critical/50',
      textColor: 'text-critical',
      glowClass: 'glow-critical',
    },
    warning: {
      icon: <AlertTriangle size={20} />,
      bgColor: 'bg-warning/10',
      borderColor: 'border-warning/50',
      textColor: 'text-warning',
      glowClass: 'glow-warning',
    },
    success: {
      icon: <CheckCircle size={20} />,
      bgColor: 'bg-success/10',
      borderColor: 'border-success/50',
      textColor: 'text-success',
      glowClass: 'glow-success',
    },
    info: {
      icon: <Info size={20} />,
      bgColor: 'bg-info/10',
      borderColor: 'border-info/50',
      textColor: 'text-info',
      glowClass: 'glow-info',
    },
  };

  const config = severityConfig[severity];

  return (
    <motion.div
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      className={twMerge(
        clsx(
          'relative p-4 rounded-lg border-l-4',
          config.bgColor,
          config.borderColor,
          config.glowClass,
          'backdrop-blur-sm',
          className
        )
      )}
    >
      <div className="flex items-start">
        <div className={clsx('flex-shrink-0', config.textColor)}>
          {icon || config.icon}
        </div>
        
        <div className="ml-3 flex-1">
          <h3 className={clsx('text-sm font-medium', config.textColor)}>
            {title}
          </h3>
          {message && (
            <div className="mt-1 text-sm text-gray-300">
              {message}
            </div>
          )}
          {action && (
            <div className="mt-3">
              {action}
            </div>
          )}
        </div>
        
        {closable && onClose && (
          <button
            onClick={onClose}
            className="ml-auto flex-shrink-0 p-1 rounded hover:bg-white/10 transition-colors"
            aria-label="Close alert"
          >
            <X size={16} className="text-gray-400" />
          </button>
        )}
      </div>
    </motion.div>
  );
};

interface ToastProps extends AlertProps {
  id: string;
  duration?: number;
}

export const Toast: React.FC<ToastProps> = ({
  id,
  duration = 5000,
  onClose,
  ...props
}) => {
  React.useEffect(() => {
    if (duration && onClose) {
      const timer = setTimeout(onClose, duration);
      return () => clearTimeout(timer);
    }
  }, [duration, onClose]);

  return <Alert {...props} onClose={onClose} />;
};

interface ToastContainerProps {
  toasts: ToastProps[];
  position?: 'top-right' | 'top-left' | 'bottom-right' | 'bottom-left';
}

export const ToastContainer: React.FC<ToastContainerProps> = ({
  toasts,
  position = 'top-right',
}) => {
  const positionClasses = {
    'top-right': 'top-4 right-4',
    'top-left': 'top-4 left-4',
    'bottom-right': 'bottom-4 right-4',
    'bottom-left': 'bottom-4 left-4',
  };

  return (
    <div className={clsx('fixed z-50', positionClasses[position])}>
      <AnimatePresence mode="sync">
        {toasts.map((toast) => (
          <motion.div
            key={toast.id}
            layout
            className="mb-3 min-w-[300px] max-w-md"
          >
            <Toast {...toast} />
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
};