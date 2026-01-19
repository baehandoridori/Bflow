import { forwardRef, ButtonHTMLAttributes } from 'react';
import { cn } from '@/utils/cn';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger';
  size?: 'sm' | 'md' | 'lg';
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = 'primary', size = 'md', children, ...props }, ref) => {
    return (
      <button
        ref={ref}
        className={cn(
          'inline-flex items-center justify-center font-medium rounded-lg transition-all duration-200',
          'focus:outline-none focus:ring-2 focus:ring-offset-2 dark:focus:ring-offset-dark-bg',
          'disabled:opacity-50 disabled:cursor-not-allowed',
          // Variants
          variant === 'primary' && [
            'bg-brand-primary text-dark-bg hover:bg-brand-primary-dark',
            'focus:ring-brand-primary',
          ],
          variant === 'secondary' && [
            'bg-light-surface dark:bg-dark-surface',
            'text-light-text dark:text-dark-text',
            'border border-light-border dark:border-dark-border',
            'hover:bg-gray-100 dark:hover:bg-dark-surface-hover',
            'focus:ring-gray-400',
          ],
          variant === 'ghost' && [
            'text-light-text-secondary dark:text-dark-text-secondary',
            'hover:bg-gray-100 dark:hover:bg-dark-surface-hover',
            'hover:text-light-text dark:hover:text-dark-text',
          ],
          variant === 'danger' && [
            'bg-red-500 text-white hover:bg-red-600',
            'focus:ring-red-500',
          ],
          // Sizes
          size === 'sm' && 'text-sm px-3 py-1.5 gap-1.5',
          size === 'md' && 'text-sm px-4 py-2 gap-2',
          size === 'lg' && 'text-base px-6 py-3 gap-2',
          className
        )}
        {...props}
      >
        {children}
      </button>
    );
  }
);

Button.displayName = 'Button';
