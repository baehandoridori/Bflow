import { ReactNode, useState } from 'react';
import { motion } from 'framer-motion';
import { MoreVertical } from 'lucide-react';
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

const sizeOptions = [
  { label: '작게', w: 1, h: 1 },
  { label: '중간', w: 2, h: 1 },
  { label: '크게', w: 2, h: 2 },
  { label: '넓게', w: 4, h: 1 },
  { label: '최대', w: 4, h: 2 },
];

export function Widget({ id, title, icon, children, className }: WidgetProps) {
  const { widgetLayout, setWidgetSize, accentColor } = useAppStore();
  const [showMenu, setShowMenu] = useState(false);

  const size = widgetLayout[id] || { w: 2, h: 1 };

  const gridSpan = {
    'col-span-1': size.w === 1,
    'col-span-2': size.w === 2,
    'col-span-3': size.w === 3,
    'col-span-4': size.w === 4,
    'row-span-1': size.h === 1,
    'row-span-2': size.h === 2,
  };

  return (
    <motion.div
      layout
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.2 }}
      className={cn(
        'min-h-[180px]',
        Object.entries(gridSpan)
          .filter(([, v]) => v)
          .map(([k]) => k)
          .join(' '),
        className
      )}
    >
      <Card className="h-full flex flex-col overflow-hidden group">
        {/* Header */}
        <div className="px-4 py-3 border-b border-light-border dark:border-dark-border flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span style={{ color: accentColor }}>{icon}</span>
            <h3 className="font-semibold text-light-text dark:text-dark-text">{title}</h3>
          </div>
          <div className="relative">
            <button
              onClick={() => setShowMenu(!showMenu)}
              className={cn(
                'p-1.5 rounded-lg transition-all',
                'text-light-text-secondary dark:text-dark-text-secondary',
                'opacity-0 group-hover:opacity-100',
                'hover:bg-gray-100 dark:hover:bg-dark-surface-hover'
              )}
            >
              <MoreVertical size={16} />
            </button>

            {/* Size Menu */}
            {showMenu && (
              <>
                <div
                  className="fixed inset-0 z-40"
                  onClick={() => setShowMenu(false)}
                />
                <motion.div
                  initial={{ opacity: 0, y: -8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -8 }}
                  className={cn(
                    'absolute right-0 top-full mt-1 z-50',
                    'bg-light-surface dark:bg-dark-surface',
                    'border border-light-border dark:border-dark-border',
                    'rounded-lg shadow-lg py-1 min-w-[120px]'
                  )}
                >
                  <div className="px-3 py-1 text-xs font-medium text-light-text-secondary dark:text-dark-text-secondary uppercase tracking-wider">
                    크기
                  </div>
                  {sizeOptions.map((option) => (
                    <button
                      key={option.label}
                      onClick={() => {
                        setWidgetSize(id, { w: option.w, h: option.h });
                        setShowMenu(false);
                      }}
                      className={cn(
                        'w-full px-3 py-1.5 text-left text-sm',
                        'hover:bg-gray-100 dark:hover:bg-dark-surface-hover',
                        'text-light-text dark:text-dark-text',
                        size.w === option.w && size.h === option.h && 'bg-gray-100 dark:bg-dark-surface-hover'
                      )}
                    >
                      {option.label}
                    </button>
                  ))}
                </motion.div>
              </>
            )}
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-auto p-4">{children}</div>
      </Card>
    </motion.div>
  );
}
