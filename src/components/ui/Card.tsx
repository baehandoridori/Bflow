import { HTMLAttributes, forwardRef } from 'react';
import { cn } from '@/utils/cn';

interface CardProps extends HTMLAttributes<HTMLDivElement> {
  variant?: 'default' | 'elevated' | 'outlined';
}

export const Card = forwardRef<HTMLDivElement, CardProps>(
  ({ className, variant = 'default', children, ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={cn(
          'rounded-xl transition-all duration-200',
          variant === 'default' && [
            'bg-light-surface dark:bg-dark-surface',
            'border border-light-border dark:border-dark-border',
            'shadow-sm shadow-black/5 dark:shadow-black/10',
            'hover:shadow-md hover:shadow-black/10 dark:hover:shadow-black/20',
          ],
          variant === 'elevated' && [
            'bg-light-surface dark:bg-dark-surface',
            'shadow-lg dark:shadow-2xl dark:shadow-black/20',
          ],
          variant === 'outlined' && [
            'bg-transparent',
            'border-2 border-light-border dark:border-dark-border',
          ],
          className
        )}
        {...props}
      >
        {children}
      </div>
    );
  }
);

Card.displayName = 'Card';

interface CardHeaderProps extends HTMLAttributes<HTMLDivElement> {}

export const CardHeader = forwardRef<HTMLDivElement, CardHeaderProps>(
  ({ className, children, ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={cn('px-4 py-3 border-b border-light-border dark:border-dark-border', className)}
        {...props}
      >
        {children}
      </div>
    );
  }
);

CardHeader.displayName = 'CardHeader';

interface CardContentProps extends HTMLAttributes<HTMLDivElement> {}

export const CardContent = forwardRef<HTMLDivElement, CardContentProps>(
  ({ className, children, ...props }, ref) => {
    return (
      <div ref={ref} className={cn('p-4', className)} {...props}>
        {children}
      </div>
    );
  }
);

CardContent.displayName = 'CardContent';
