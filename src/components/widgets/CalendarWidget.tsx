import { Calendar, ChevronLeft, ChevronRight } from 'lucide-react';
import { useState } from 'react';
import {
  format,
  startOfMonth,
  endOfMonth,
  eachDayOfInterval,
  isSameMonth,
  isSameDay,
  addMonths,
  subMonths,
  startOfWeek,
  endOfWeek,
  isToday,
} from 'date-fns';
import { ko } from 'date-fns/locale';
import { Widget } from './Widget';
import { useProjectStore } from '@/stores/useProjectStore';
import { cn } from '@/utils/cn';

const WEEKDAYS = ['일', '월', '화', '수', '목', '금', '토'];

export function CalendarWidget() {
  const [currentDate, setCurrentDate] = useState(new Date());
  const { episodes } = useProjectStore();

  const monthStart = startOfMonth(currentDate);
  const monthEnd = endOfMonth(currentDate);
  const calendarStart = startOfWeek(monthStart);
  const calendarEnd = endOfWeek(monthEnd);

  const days = eachDayOfInterval({ start: calendarStart, end: calendarEnd });

  const getDueDatesForDay = (day: Date) => {
    return episodes.filter((ep) => isSameDay(new Date(ep.dueDate), day));
  };

  const prevMonth = () => setCurrentDate(subMonths(currentDate, 1));
  const nextMonth = () => setCurrentDate(addMonths(currentDate, 1));

  return (
    <Widget id="calendar" title="캘린더" icon={<Calendar size={18} />}>
      <div className="space-y-3 overflow-auto">
        {/* Header */}
        <div className="flex items-center justify-between flex-shrink-0">
          <button
            onClick={prevMonth}
            className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded"
          >
            <ChevronLeft size={16} />
          </button>
          <span className="font-medium text-sm">
            {format(currentDate, 'yyyy년 M월', { locale: ko })}
          </span>
          <button
            onClick={nextMonth}
            className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded"
          >
            <ChevronRight size={16} />
          </button>
        </div>

        {/* Weekday headers */}
        <div className="grid grid-cols-7 gap-1 text-center text-xs text-light-text-secondary dark:text-dark-text-secondary flex-shrink-0">
          {WEEKDAYS.map((day) => (
            <div key={day} className="py-0.5">
              {day}
            </div>
          ))}
        </div>

        {/* Calendar grid */}
        <div className="grid grid-cols-7 gap-0.5 flex-shrink-0">
          {days.map((day) => {
            const dueDates = getDueDatesForDay(day);
            const isCurrentMonth = isSameMonth(day, currentDate);
            const isCurrentDay = isToday(day);

            return (
              <div
                key={day.toISOString()}
                className={cn(
                  'aspect-square p-0.5 text-xs rounded relative',
                  'flex flex-col items-center justify-center',
                  !isCurrentMonth && 'text-gray-300 dark:text-gray-600',
                  isCurrentDay &&
                    'bg-brand-primary/20 text-brand-primary font-bold',
                  dueDates.length > 0 && 'cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700'
                )}
              >
                <span className="text-[10px]">{format(day, 'd')}</span>
                {dueDates.length > 0 && (
                  <div className="absolute bottom-0 flex gap-0.5">
                    {dueDates.slice(0, 2).map((ep) => (
                      <div
                        key={ep.id}
                        className="w-1 h-1 rounded-full bg-red-500"
                        title={ep.name}
                      />
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </Widget>
  );
}
