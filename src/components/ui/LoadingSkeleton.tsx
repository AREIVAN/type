'use client';

import { cn } from '@/utils/cn';

interface SkeletonProps {
  className?: string;
  variant?: 'text' | 'circular' | 'rectangular';
  width?: string | number;
  height?: string | number;
  lines?: number;
}

export function Skeleton({ 
  className, 
  variant = 'rectangular', 
  width, 
  height,
  lines = 1 
}: SkeletonProps) {
  const baseStyles = cn(
    'animate-pulse bg-zinc-800',
    {
      'rounded-full': variant === 'circular',
      'rounded': variant === 'rectangular' || variant === 'text',
      'h-4': variant === 'text',
    },
    className
  );

  if (lines > 1) {
    return (
      <div className="space-y-2">
        {Array.from({ length: lines }).map((_, i) => (
          <div
            key={i}
            className={cn(
              baseStyles,
              i === lines - 1 && 'w-3/4'
            )}
            style={{
              width: width || (i === lines - 1 ? '75%' : '100%'),
              height: height || (variant === 'text' ? '16px' : undefined),
            }}
          />
        ))}
      </div>
    );
  }

  return (
    <div
      className={baseStyles}
      style={{
        width: width,
        height: height,
      }}
    />
  );
}

// Pre-built skeleton components for common use cases

export function CardSkeleton({ className }: { className?: string }) {
  return (
    <div className={cn('bg-zinc-900 border border-zinc-800 rounded-xl p-4', className)}>
      <div className="flex items-center gap-3 mb-4">
        <Skeleton variant="circular" width={40} height={40} />
        <div className="flex-1">
          <Skeleton variant="text" width="60%" />
          <Skeleton variant="text" width="40%" className="mt-1" />
        </div>
      </div>
      <Skeleton variant="text" lines={3} />
    </div>
  );
}

export function ListItemSkeleton({ className }: { className?: string }) {
  return (
    <div className={cn('flex items-center gap-3 p-3', className)}>
      <Skeleton variant="circular" width={32} height={32} />
      <div className="flex-1">
        <Skeleton variant="text" width="70%" />
        <Skeleton variant="text" width="50%" className="mt-1" />
      </div>
    </div>
  );
}

export function TypingAreaSkeleton() {
  return (
    <div className="space-y-4">
      <div className="flex justify-between text-sm text-zinc-500">
        <Skeleton width={80} />
        <Skeleton width={60} />
      </div>
      <div className="bg-zinc-950 rounded-lg p-6 min-h-[200px]">
        <Skeleton lines={6} />
      </div>
    </div>
  );
}

export function MetricsBarSkeleton() {
  return (
    <div className="flex items-center justify-between bg-zinc-900 border border-zinc-800 rounded-lg px-4 py-3">
      <div className="flex gap-6">
        <Skeleton width={50} height={32} />
        <Skeleton width={50} height={32} />
        <Skeleton width={50} height={32} />
        <Skeleton width={50} height={32} />
      </div>
      <Skeleton width={80} height={24} />
    </div>
  );
}

export function PageLoader({ text = 'Loading...' }: { text?: string }) {
  return (
    <div className="flex flex-col items-center justify-center py-16 gap-4">
      <div className="relative w-8 h-8">
        <div className="absolute inset-0 border-2 border-zinc-800 rounded-full" />
        <div className="absolute inset-0 border-2 border-blue-500 rounded-full border-t-transparent animate-spin" />
      </div>
      <p className="text-sm text-zinc-500">{text}</p>
    </div>
  );
}

// Inline loader for buttons and small spaces
export function InlineLoader({ size = 'sm' }: { size?: 'sm' | 'md' | 'lg' }) {
  const sizes = {
    sm: 'w-4 h-4 border-2',
    md: 'w-5 h-5 border-2',
    lg: 'w-6 h-6 border-[2px]',
  };

  return (
    <div className={cn(
      'rounded-full border-zinc-600 border-t-transparent animate-spin',
      sizes[size]
    )} />
  );
}

// Button with loading state
interface LoadingButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  loading?: boolean;
  loadingText?: string;
}

export function LoadingButton({ 
  loading, 
  loadingText, 
  children, 
  disabled,
  className,
  ...props 
}: LoadingButtonProps) {
  return (
    <button
      className={cn(
        'relative inline-flex items-center justify-center',
        loading && 'cursor-wait',
        className
      )}
      disabled={disabled || loading}
      {...props}
    >
      {loading && (
        <span className="absolute left-1/2 -translate-x-1/2">
          <InlineLoader size="sm" />
        </span>
      )}
      <span className={cn(loading && 'opacity-0')}>
        {loading ? loadingText : children}
      </span>
    </button>
  );
}
