import { HTMLAttributes, forwardRef } from 'react';
import { cn } from '@/utils/cn';

interface BadgeProps extends HTMLAttributes<HTMLSpanElement> {
  variant?: 'default' | 'success' | 'warning' | 'danger' | 'info';
  size?: 'sm' | 'md';
}

export const Badge = forwardRef<HTMLSpanElement, BadgeProps>(
  ({ className, variant = 'default', size = 'md', children, ...props }, ref) => {
    return (
      <span
        ref={ref}
        className={cn(
          'inline-flex items-center font-medium rounded-full',
          // Variants
          variant === 'default' && 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300',
          variant === 'success' && 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400',
          variant === 'warning' && 'bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400',
          variant === 'danger' && 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400',
          variant === 'info' && 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400',
          // Sizes
          size === 'sm' && 'text-xs px-2 py-0.5',
          size === 'md' && 'text-xs px-2.5 py-1',
          className
        )}
        {...props}
      >
        {children}
      </span>
    );
  }
);

Badge.displayName = 'Badge';
