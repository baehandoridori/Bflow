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
      <div className="h-full flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between mb-2">
          <button
            onClick={prevMonth}
            className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded"
          >
            <ChevronLeft size={14} />
          </button>
          <span className="font-medium text-xs">
            {format(currentDate, 'yyyy년 M월', { locale: ko })}
          </span>
          <button
            onClick={nextMonth}
            className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded"
          >
            <ChevronRight size={14} />
          </button>
        </div>

        {/* Weekday headers */}
        <div className="grid grid-cols-7 mb-1">
          {WEEKDAYS.map((day, i) => (
            <div
              key={day}
              className={cn(
                "text-center text-[10px] py-0.5",
                i === 0 && "text-red-400",
                i === 6 && "text-blue-400",
                i !== 0 && i !== 6 && "text-light-text-secondary dark:text-dark-text-secondary"
              )}
            >
              {day}
            </div>
          ))}
        </div>

        {/* Calendar grid - fills remaining space */}
        <div className="flex-1 grid grid-cols-7 auto-rows-fr gap-px">
          {days.map((day, index) => {
            const dueDates = getDueDatesForDay(day);
            const isCurrentMonth = isSameMonth(day, currentDate);
            const isCurrentDay = isToday(day);
            const dayOfWeek = index % 7;

            return (
              <div
                key={day.toISOString()}
                className={cn(
                  'flex items-center justify-center relative text-[10px] rounded-sm',
                  !isCurrentMonth && 'text-gray-400 dark:text-gray-600',
                  isCurrentMonth && dayOfWeek === 0 && 'text-red-400',
                  isCurrentMonth && dayOfWeek === 6 && 'text-blue-400',
                  isCurrentDay && 'bg-brand-primary text-dark-bg font-bold',
                  dueDates.length > 0 && !isCurrentDay && 'cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700'
                )}
              >
                {format(day, 'd')}
                {dueDates.length > 0 && (
                  <div className="absolute bottom-0 left-1/2 -translate-x-1/2">
                    <div className="w-1 h-1 rounded-full bg-red-500" />
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
