import { ReactNode } from 'react';
import { motion } from 'framer-motion';
import { GripVertical } from 'lucide-react';
import { cn } from '@/utils/cn';
import { Card } from '@/components/ui';
import { useAppStore } from '@/stores/useAppStore';

interface WidgetProps {
  id: string;
  title: string;
  icon: ReactNode;
  children: ReactNode;
  className?: string;
}

export function Widget({ title, icon, children, className }: WidgetProps) {
  const { accentColor } = useAppStore();

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.2 }}
      className={cn('h-full', className)}
    >
      <Card className="h-full flex flex-col overflow-hidden group">
        {/* Header - serves as drag handle */}
        <div
          className={cn(
            'widget-drag-handle',
            'px-4 py-3 border-b border-light-border dark:border-dark-border',
            'flex items-center justify-between',
            'cursor-grab active:cursor-grabbing',
            'select-none'
          )}
        >
          <div className="flex items-center gap-2">
            <span style={{ color: accentColor }}>{icon}</span>
            <h3 className="font-semibold text-light-text dark:text-dark-text">
              {title}
            </h3>
          </div>
          <div
            className={cn(
              'p-1 rounded transition-opacity',
              'text-gray-400 dark:text-gray-500',
              'opacity-0 group-hover:opacity-100'
            )}
          >
            <GripVertical size={16} />
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-auto p-4">{children}</div>
      </Card>
    </motion.div>
  );
}
