'use client';

import { useState, useEffect } from 'react';
import { cn } from '@/utils/cn';
import { Button } from './Button';
import { AlertTriangle, X, Info, CheckCircle, XCircle } from 'lucide-react';

type ErrorType = 'error' | 'warning' | 'info' | 'success';

interface ErrorBannerProps {
  type?: ErrorType;
  title?: string;
  message: string;
  action?: {
    label: string;
    onClick: () => void;
  };
  dismissible?: boolean;
  onDismiss?: () => void;
  className?: string;
}

export function ErrorBanner({
  type = 'error',
  title,
  message,
  action,
  dismissible = true,
  onDismiss,
  className
}: ErrorBannerProps) {
  const [isVisible, setIsVisible] = useState(true);
  const [isExiting, setIsExiting] = useState(false);

  useEffect(() => {
    if (isExiting) {
      const timer = setTimeout(() => setIsVisible(false), 200);
      return () => clearTimeout(timer);
    }
  }, [isExiting]);

  if (!isVisible) return null;

  const handleDismiss = () => {
    setIsExiting(true);
    onDismiss?.();
  };

  const styles = {
    error: {
      bg: 'bg-red-500/10 border-red-500/30',
      icon: XCircle,
      iconColor: 'text-red-400',
      titleColor: 'text-red-200',
    },
    warning: {
      bg: 'bg-amber-500/10 border-amber-500/30',
      icon: AlertTriangle,
      iconColor: 'text-amber-400',
      titleColor: 'text-amber-200',
    },
    info: {
      bg: 'bg-blue-500/10 border-blue-500/30',
      icon: Info,
      iconColor: 'text-blue-400',
      titleColor: 'text-blue-200',
    },
    success: {
      bg: 'bg-green-500/10 border-green-500/30',
      icon: CheckCircle,
      iconColor: 'text-green-400',
      titleColor: 'text-green-200',
    },
  };

  const style = styles[type];
  const Icon = style.icon;

  return (
    <div className={cn(
      'rounded-lg border p-4 transition-all duration-200',
      style.bg,
      isExiting ? 'opacity-0 translate-y-[-4px]' : 'opacity-100 translate-y-0',
      className
    )}>
      <div className="flex items-start gap-3">
        <Icon className={cn('w-5 h-5 mt-0.5 flex-shrink-0', style.iconColor)} />
        
        <div className="flex-1 min-w-0">
          {title && (
            <p className={cn('font-medium mb-1', style.titleColor)}>
              {title}
            </p>
          )}
          <p className="text-sm text-zinc-300 leading-relaxed">
            {message}
          </p>
          
          {action && (
            <div className="mt-3">
              <Button 
                size="sm" 
                variant={type === 'error' ? 'danger' : 'secondary'}
                onClick={action.onClick}
              >
                {action.label}
              </Button>
            </div>
          )}
        </div>
        
        {dismissible && (
          <button
            onClick={handleDismiss}
            className="p-1 rounded hover:bg-zinc-800/50 transition-colors"
            aria-label="Dismiss"
          >
            <X className="w-4 h-4 text-zinc-500" />
          </button>
        )}
      </div>
    </div>
  );
}

// Toast component for transient notifications
interface ToastProps {
  id: string;
  type?: ErrorType;
  message: string;
  duration?: number;
  onDismiss: (id: string) => void;
}

export function Toast({ id, type = 'info', message, duration = 4000, onDismiss }: ToastProps) {
  const [isExiting, setIsExiting] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsExiting(true);
      setTimeout(() => onDismiss(id), 200);
    }, duration);

    return () => clearTimeout(timer);
  }, [id, duration, onDismiss]);

  const styles = {
    error: 'bg-red-500/90 border-red-400',
    warning: 'bg-amber-500/90 border-amber-400',
    info: 'bg-zinc-800/95 border-zinc-700',
    success: 'bg-green-500/90 border-green-400',
  };

  return (
    <div className={cn(
      'flex items-center gap-3 px-4 py-3 rounded-lg border shadow-lg',
      'animate-in slide-in-from-bottom-4 duration-200',
      styles[type],
      isExiting ? 'opacity-0 translate-y-2' : 'opacity-100 translate-y-0'
    )}>
      <p className="text-sm text-white font-medium">{message}</p>
      <button
        onClick={() => {
          setIsExiting(true);
          setTimeout(() => onDismiss(id), 200);
        }}
        className="p-1 hover:bg-white/10 rounded transition-colors"
      >
        <X className="w-3 h-3 text-white/70" />
      </button>
    </div>
  );
}

// Toast container for managing multiple toasts
interface ToastContainerProps {
  toasts: Array<{ id: string; type?: ErrorType; message: string }>;
  onDismiss: (id: string) => void;
}

export function ToastContainer({ toasts, onDismiss }: ToastContainerProps) {
  if (toasts.length === 0) return null;

  return (
    <div className="fixed bottom-4 right-4 z-50 flex flex-col gap-2 max-w-sm">
      {toasts.map((toast) => (
        <Toast
          key={toast.id}
          id={toast.id}
          type={toast.type}
          message={toast.message}
          onDismiss={onDismiss}
        />
      ))}
    </div>
  );
}
