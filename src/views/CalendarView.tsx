import { motion } from 'framer-motion';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { useState } from 'react';
import {
  format,
  startOfMonth,
  endOfMonth,
  startOfWeek,
  endOfWeek,
  addDays,
  addMonths,
  subMonths,
  isSameMonth,
  isSameDay,
  isToday,
} from 'date-fns';
import { ko } from 'date-fns/locale';
import { Card, Button } from '@/components/ui';
import { useProjectStore } from '@/stores/useProjectStore';
import { cn } from '@/utils/cn';

export function CalendarView() {
  const [currentDate, setCurrentDate] = useState(new Date());
  const { episodes, getProjectById } = useProjectStore();

  const monthStart = startOfMonth(currentDate);
  const monthEnd = endOfMonth(currentDate);
  const startDate = startOfWeek(monthStart, { weekStartsOn: 0 });
  const endDate = endOfWeek(monthEnd, { weekStartsOn: 0 });

  const days: Date[] = [];
  let day = startDate;
  while (day <= endDate) {
    days.push(day);
    day = addDays(day, 1);
  }

  const weeks: Date[][] = [];
  for (let i = 0; i < days.length; i += 7) {
    weeks.push(days.slice(i, i + 7));
  }

  const getEventsForDay = (date: Date) => {
    return episodes.filter((ep) => isSameDay(new Date(ep.dueDate), date));
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.3 }}
    >
      <Card>
        {/* Header */}
        <div className="p-4 border-b border-light-border dark:border-dark-border flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="sm" onClick={() => setCurrentDate(subMonths(currentDate, 1))}>
              <ChevronLeft size={18} />
            </Button>
            <h2 className="text-lg font-bold text-light-text dark:text-dark-text min-w-[140px] text-center">
              {format(currentDate, 'yyyy년 M월', { locale: ko })}
            </h2>
            <Button variant="ghost" size="sm" onClick={() => setCurrentDate(addMonths(currentDate, 1))}>
              <ChevronRight size={18} />
            </Button>
          </div>
          <Button variant="secondary" size="sm" onClick={() => setCurrentDate(new Date())}>
            오늘
          </Button>
        </div>

        {/* Days of Week */}
        <div className="grid grid-cols-7 border-b border-light-border dark:border-dark-border">
          {['일', '월', '화', '수', '목', '금', '토'].map((d, i) => (
            <div
              key={d}
              className={cn(
                'p-2 text-center text-sm font-medium',
                i === 0 && 'text-red-500',
                i === 6 && 'text-blue-500',
                i !== 0 && i !== 6 && 'text-light-text-secondary dark:text-dark-text-secondary'
              )}
            >
              {d}
            </div>
          ))}
        </div>

        {/* Calendar Grid */}
        <div className="divide-y divide-light-border dark:divide-dark-border">
          {weeks.map((week, weekIndex) => (
            <div key={weekIndex} className="grid grid-cols-7 divide-x divide-light-border dark:divide-dark-border">
              {week.map((date, dayIndex) => {
                const events = getEventsForDay(date);
                const isCurrentMonth = isSameMonth(date, currentDate);
                const isCurrentDay = isToday(date);

                return (
                  <div
                    key={date.toISOString()}
                    className={cn(
                      'min-h-[100px] p-2 transition-colors',
                      !isCurrentMonth && 'bg-gray-50 dark:bg-dark-surface-hover/50',
                      'hover:bg-gray-50 dark:hover:bg-dark-surface-hover'
                    )}
                  >
                    <div
                      className={cn(
                        'w-7 h-7 flex items-center justify-center rounded-full text-sm mb-1',
                        isCurrentDay && 'bg-brand-primary text-dark-bg font-bold',
                        !isCurrentDay && dayIndex === 0 && 'text-red-500',
                        !isCurrentDay && dayIndex === 6 && 'text-blue-500',
                        !isCurrentDay && !isCurrentMonth && 'text-light-text-secondary/50 dark:text-dark-text-secondary/50',
                        !isCurrentDay && isCurrentMonth && dayIndex !== 0 && dayIndex !== 6 && 'text-light-text dark:text-dark-text'
                      )}
                    >
                      {format(date, 'd')}
                    </div>

                    {/* Events */}
                    <div className="space-y-1">
                      {events.slice(0, 3).map((event) => {
                        const project = getProjectById(event.projectId);
                        return (
                          <div
                            key={event.id}
                            className={cn(
                              'px-1.5 py-0.5 rounded text-xs truncate cursor-pointer',
                              'hover:opacity-80 transition-opacity'
                            )}
                            style={{
                              backgroundColor: `${project?.color || '#6B7280'}20`,
                              color: project?.color || '#6B7280',
                              borderLeft: `2px solid ${project?.color || '#6B7280'}`,
                            }}
                          >
                            {event.name}
                          </div>
                        );
                      })}
                      {events.length > 3 && (
                        <div className="text-xs text-light-text-secondary dark:text-dark-text-secondary px-1.5">
                          +{events.length - 3}개
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          ))}
        </div>
      </Card>
    </motion.div>
  );
}
