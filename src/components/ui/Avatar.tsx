import { HTMLAttributes, forwardRef } from 'react';
import { cn } from '@/utils/cn';

interface AvatarProps extends HTMLAttributes<HTMLDivElement> {
  name: string;
  src?: string;
  size?: 'sm' | 'md' | 'lg';
  status?: 'working' | 'review' | 'done' | 'waiting' | 'absent';
}

function getInitials(name: string): string {
  return name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);
}

function getColorFromName(name: string): string {
  const colors = [
    'bg-blue-500',
    'bg-green-500',
    'bg-yellow-500',
    'bg-purple-500',
    'bg-pink-500',
    'bg-indigo-500',
    'bg-teal-500',
    'bg-orange-500',
  ];
  const index = name.charCodeAt(0) % colors.length;
  return colors[index];
}

const statusColors = {
  working: 'bg-status-working',
  review: 'bg-status-review',
  done: 'bg-status-done',
  waiting: 'bg-status-waiting',
  absent: 'bg-red-500',
};

export const Avatar = forwardRef<HTMLDivElement, AvatarProps>(
  ({ className, name, src, size = 'md', status, ...props }, ref) => {
    return (
      <div className="relative inline-block">
        <div
          ref={ref}
          className={cn(
            'flex items-center justify-center rounded-full text-white font-medium',
            getColorFromName(name),
            size === 'sm' && 'w-8 h-8 text-xs',
            size === 'md' && 'w-10 h-10 text-sm',
            size === 'lg' && 'w-12 h-12 text-base',
            className
          )}
          {...props}
        >
          {src ? (
            <img src={src} alt={name} className="w-full h-full rounded-full object-cover" />
          ) : (
            getInitials(name)
          )}
        </div>
        {status && (
          <span
            className={cn(
              'absolute bottom-0 right-0 rounded-full border-2 border-light-surface dark:border-dark-surface',
              statusColors[status],
              size === 'sm' && 'w-2.5 h-2.5',
              size === 'md' && 'w-3 h-3',
              size === 'lg' && 'w-3.5 h-3.5'
            )}
          />
        )}
      </div>
    );
  }
);

Avatar.displayName = 'Avatar';
