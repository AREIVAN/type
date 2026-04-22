'use client';

import { forwardRef, ButtonHTMLAttributes } from 'react';
import { cn } from '@/utils/cn';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger';
  size?: 'sm' | 'md' | 'lg';
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = 'primary', size = 'md', children, disabled, ...props }, ref) => {
    const variants = {
      primary: 'bg-blue-500 text-white hover:bg-blue-600 focus:ring-blue-500',
      secondary: 'bg-zinc-900 text-zinc-100 border border-zinc-700 hover:bg-zinc-800 hover:border-zinc-600 focus:ring-zinc-600',
      ghost: 'bg-transparent text-zinc-400 hover:bg-zinc-900 hover:text-zinc-100 focus:ring-zinc-700',
      danger: 'bg-red-500 text-white hover:bg-red-600 focus:ring-red-500',
    };
    
    const sizes = {
      sm: 'px-3 py-1.5 text-sm gap-1.5',
      md: 'px-4 py-2 text-base gap-2',
      lg: 'px-6 py-3 text-lg gap-2.5',
    };
    
    return (
      <button
        ref={ref}
        className={cn(
          'inline-flex items-center justify-center font-medium rounded-md',
          'transition-all duration-200 ease-out',
          'focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-zinc-950',
          'disabled:opacity-50 disabled:cursor-not-allowed',
          variants[variant],
          sizes[size],
          className
        )}
        disabled={disabled}
        {...props}
      >
        {children}
      </button>
    );
  }
);

Button.displayName = 'Button';