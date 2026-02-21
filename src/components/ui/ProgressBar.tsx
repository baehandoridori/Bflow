import { HTMLAttributes, forwardRef } from 'react';
import { cn } from '@/utils/cn';

interface ProgressBarProps extends HTMLAttributes<HTMLDivElement> {
  value: number;
  max?: number;
  size?: 'sm' | 'md' | 'lg';
  showLabel?: boolean;
  color?: string;
  gradient?: boolean;
  shimmer?: boolean;
}

function progressGradient(pct: number): string {
  if (pct >= 100) return 'linear-gradient(90deg, #00B894 0%, #55efc4 100%)';
  if (pct >= 75) return 'linear-gradient(90deg, #FDCB6E 0%, #00B894 100%)';
  if (pct >= 50) return 'linear-gradient(90deg, #E17055 0%, #FDCB6E 100%)';
  if (pct >= 25) return 'linear-gradient(90deg, #FF6B6B 0%, #E17055 60%, #FDCB6E 100%)';
  return 'linear-gradient(90deg, #FF6B6B 0%, #E17055 100%)';
}

export const ProgressBar = forwardRef<HTMLDivElement, ProgressBarProps>(
  (
    {
      className,
      value,
      max = 100,
      size = 'md',
      showLabel = false,
      color,
      gradient = false,
      shimmer = false,
      ...props
    },
    ref
  ) => {
    const percentage = Math.min(Math.max((value / max) * 100, 0), 100);

    return (
      <div ref={ref} className={cn('w-full', className)} {...props}>
        {showLabel && (
          <div className="flex justify-between mb-1">
            <span className="text-xs font-medium text-light-text-secondary dark:text-dark-text-secondary">
              Progress
            </span>
            <span className="text-xs font-medium text-light-text dark:text-dark-text">
              {Math.round(percentage)}%
            </span>
          </div>
        )}
        <div
          className={cn(
            'w-full bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden',
            size === 'sm' && 'h-1.5',
            size === 'md' && 'h-2',
            size === 'lg' && 'h-3'
          )}
        >
          <div
            className={cn(
              'h-full rounded-full transition-all duration-700 ease-out relative',
              !color && !gradient && 'bg-brand-primary'
            )}
            style={{
              width: `${percentage}%`,
              ...(gradient
                ? { background: progressGradient(percentage) }
                : color ? { backgroundColor: color } : {}),
            }}
          >
            {shimmer && (
              <div className="absolute inset-0 shimmer" />
            )}
          </div>
        </div>
      </div>
    );
  }
);

ProgressBar.displayName = 'ProgressBar';
