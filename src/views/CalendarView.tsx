import { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import { ChevronLeft, ChevronRight, Plus, Calendar as CalendarIcon, LayoutGrid, Eye, EyeOff } from 'lucide-react';
import {
  format,
  startOfMonth,
  endOfMonth,
  startOfWeek,
  endOfWeek,
  addDays,
  addMonths,
  subMonths,
  addWeeks,
  subWeeks,
  isSameMonth,
  isSameDay,
  isToday,
  differenceInDays,
  isBefore,
  parseISO,
} from 'date-fns';
import { ko } from 'date-fns/locale';
import { Card, Button } from '@/components/ui';
import { Modal } from '@/components/ui/Modal';
import { EventForm } from '@/components/forms/EventForm';
import { useDataStore } from '@/stores/useDataStore';
import { useAppStore } from '@/stores/useAppStore';
import { cn } from '@/utils/cn';
import type { CalendarEvent } from '@/types';

interface EventWithSlot extends CalendarEvent {
  slot: number;
}

type ViewMode = 'monthly' | 'weekly';

export function CalendarView() {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [viewMode, setViewMode] = useState<ViewMode>('monthly');
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingEvent, setEditingEvent] = useState<CalendarEvent | null>(null);
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [deleteConfirmEvent, setDeleteConfirmEvent] = useState<CalendarEvent | null>(null);

  const { calendarEvents, episodes, getProjectById, deleteCalendarEvent } = useDataStore();
  const { calendarView, setCalendarView, showEpisodeDeadlines, setShowEpisodeDeadlines } = useAppStore();

  // Use stored view preference
  useState(() => {
    if (calendarView === 'weekly') setViewMode('weekly');
  });

  // Calculate date range based on view mode
  const { weeks } = useMemo(() => {
    let start: Date, end: Date;

    if (viewMode === 'monthly') {
      const monthStart = startOfMonth(currentDate);
      const monthEnd = endOfMonth(currentDate);
      start = startOfWeek(monthStart, { weekStartsOn: 0 });
      end = endOfWeek(monthEnd, { weekStartsOn: 0 });
    } else {
      start = startOfWeek(currentDate, { weekStartsOn: 0 });
      end = endOfWeek(currentDate, { weekStartsOn: 0 });
    }

    const daysArr: Date[] = [];
    let day = start;
    while (day <= end) {
      daysArr.push(day);
      day = addDays(day, 1);
    }

    const weeksArr: Date[][] = [];
    for (let i = 0; i < daysArr.length; i += 7) {
      weeksArr.push(daysArr.slice(i, i + 7));
    }

    return { weeks: weeksArr };
  }, [currentDate, viewMode]);

  // Get all events including episode deadlines
  const allEvents = useMemo(() => {
    const events: CalendarEvent[] = [...calendarEvents];

    // Add episode deadlines as events if enabled
    if (showEpisodeDeadlines) {
      episodes.forEach((ep) => {
        const project = getProjectById(ep.projectId);
        events.push({
          id: `ep-deadline-${ep.id}`,
          title: `${ep.name} 마감`,
          type: 'deadline',
          startDate: ep.dueDate,
          endDate: ep.dueDate,
          color: project?.color || '#EF4444',
          relatedEpisodeId: ep.id,
        });
      });
    }

    return events;
  }, [calendarEvents, episodes, getProjectById, showEpisodeDeadlines]);

  // Calculate event slots for stacking (prevents overlap)
  const calculateEventSlots = useMemo(() => {
    // Sort events by start date, then by duration (longer events first)
    const sortedEvents = [...allEvents].sort((a, b) => {
      const startDiff = parseISO(a.startDate).getTime() - parseISO(b.startDate).getTime();
      if (startDiff !== 0) return startDiff;
      // Longer events come first
      const aDuration = differenceInDays(parseISO(a.endDate), parseISO(a.startDate));
      const bDuration = differenceInDays(parseISO(b.endDate), parseISO(b.startDate));
      return bDuration - aDuration;
    });

    const eventSlots: Map<string, number> = new Map();
    const daySlots: Map<string, Set<number>> = new Map();

    sortedEvents.forEach((event) => {
      const eventStart = parseISO(event.startDate);
      const eventEnd = parseISO(event.endDate);

      // Find which slots are occupied for all days this event spans
      let slot = 0;
      let slotFound = false;

      while (!slotFound) {
        slotFound = true;
        let day = eventStart;

        while (!isBefore(eventEnd, day)) {
          const dayKey = format(day, 'yyyy-MM-dd');
          const occupiedSlots = daySlots.get(dayKey) || new Set();

          if (occupiedSlots.has(slot)) {
            slotFound = false;
            slot++;
            break;
          }
          day = addDays(day, 1);
        }
      }

      // Assign this slot to all days the event spans
      let day = eventStart;
      while (!isBefore(eventEnd, day)) {
        const dayKey = format(day, 'yyyy-MM-dd');
        if (!daySlots.has(dayKey)) {
          daySlots.set(dayKey, new Set());
        }
        daySlots.get(dayKey)!.add(slot);
        day = addDays(day, 1);
      }

      eventSlots.set(event.id, slot);
    });

    return eventSlots;
  }, [allEvents]);



  // Get events for a week with their positions
  const getEventsForWeek = (week: Date[]): { event: EventWithSlot; startDay: number; span: number }[] => {
    const weekStart = week[0];
    const weekEnd = week[week.length - 1];

    const weekEvents: { event: EventWithSlot; startDay: number; span: number }[] = [];

    allEvents.forEach((event) => {
      const eventStart = parseISO(event.startDate);
      const eventEnd = parseISO(event.endDate);

      // Check if event overlaps with this week
      const eventInWeek = !isBefore(eventEnd, weekStart) && !isBefore(weekEnd, eventStart);

      if (eventInWeek) {
        // Calculate start day index (0-6) within the week
        let startDay = 0;
        for (let i = 0; i < week.length; i++) {
          if (isSameDay(week[i], eventStart) || isBefore(eventStart, week[i])) {
            startDay = i;
            break;
          }
        }
        if (isBefore(eventStart, weekStart)) {
          startDay = 0;
        }

        // Calculate span (number of days visible in this week)
        const visibleStart = isBefore(eventStart, weekStart) ? weekStart : eventStart;
        const visibleEnd = isBefore(weekEnd, eventEnd) ? weekEnd : eventEnd;
        const span = Math.min(differenceInDays(visibleEnd, visibleStart) + 1, 7 - startDay);

        weekEvents.push({
          event: {
            ...event,
            slot: calculateEventSlots.get(event.id) || 0,
          },
          startDay,
          span: Math.max(1, span),
        });
      }
    });

    // Sort by slot
    return weekEvents.sort((a, b) => a.event.slot - b.event.slot);
  };


  const handlePrev = () => {
    if (viewMode === 'monthly') {
      setCurrentDate(subMonths(currentDate, 1));
    } else {
      setCurrentDate(subWeeks(currentDate, 1));
    }
  };

  const handleNext = () => {
    if (viewMode === 'monthly') {
      setCurrentDate(addMonths(currentDate, 1));
    } else {
      setCurrentDate(addWeeks(currentDate, 1));
    }
  };

  const handleViewModeChange = (mode: ViewMode) => {
    setViewMode(mode);
    setCalendarView(mode);
  };

  const handleDayClick = (date: Date) => {
    setSelectedDate(format(date, 'yyyy-MM-dd'));
    setEditingEvent(null);
    setIsFormOpen(true);
  };

  const handleEventClick = (event: CalendarEvent, e: React.MouseEvent) => {
    e.stopPropagation();
    // Don't edit auto-generated episode deadline events
    if (event.id.startsWith('ep-deadline-')) return;
    setEditingEvent(event);
    setSelectedDate(null);
    setIsFormOpen(true);
  };

  const handleDeleteClick = (event: CalendarEvent, e: React.MouseEvent) => {
    e.stopPropagation();
    if (event.id.startsWith('ep-deadline-')) return;
    setDeleteConfirmEvent(event);
  };

  const confirmDelete = () => {
    if (deleteConfirmEvent) {
      deleteCalendarEvent(deleteConfirmEvent.id);
      setDeleteConfirmEvent(null);
    }
  };

  const handleFormClose = () => {
    setIsFormOpen(false);
    setEditingEvent(null);
    setSelectedDate(null);
  };

  const getHeaderText = () => {
    if (viewMode === 'monthly') {
      return format(currentDate, 'yyyy년 M월', { locale: ko });
    } else {
      const weekStart = startOfWeek(currentDate, { weekStartsOn: 0 });
      const weekEnd = endOfWeek(currentDate, { weekStartsOn: 0 });
      if (weekStart.getMonth() === weekEnd.getMonth()) {
        return `${format(weekStart, 'yyyy년 M월 d일', { locale: ko })} - ${format(weekEnd, 'd일', { locale: ko })}`;
      }
      return `${format(weekStart, 'M월 d일', { locale: ko })} - ${format(weekEnd, 'M월 d일', { locale: ko })}`;
    }
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
            <Button variant="ghost" size="sm" onClick={handlePrev}>
              <ChevronLeft size={18} />
            </Button>
            <h2 className="text-lg font-bold text-light-text dark:text-dark-text min-w-[200px] text-center">
              {getHeaderText()}
            </h2>
            <Button variant="ghost" size="sm" onClick={handleNext}>
              <ChevronRight size={18} />
            </Button>
          </div>

          <div className="flex items-center gap-2">
            {/* Episode Deadlines Toggle */}
            <button
              onClick={() => setShowEpisodeDeadlines(!showEpisodeDeadlines)}
              className={cn(
                'flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm transition-colors',
                showEpisodeDeadlines
                  ? 'bg-brand-primary/20 text-brand-primary'
                  : 'bg-gray-100 dark:bg-gray-800 text-light-text-secondary dark:text-dark-text-secondary'
              )}
              title={showEpisodeDeadlines ? '에피소드 마감 숨기기' : '에피소드 마감 표시'}
            >
              {showEpisodeDeadlines ? <Eye size={14} /> : <EyeOff size={14} />}
              <span className="hidden sm:inline">마감일</span>
            </button>

            {/* View Mode Toggle */}
            <div className="flex rounded-lg border border-light-border dark:border-dark-border overflow-hidden">
              <button
                onClick={() => handleViewModeChange('monthly')}
                className={cn(
                  'px-3 py-1.5 text-sm transition-colors',
                  viewMode === 'monthly'
                    ? 'bg-brand-primary text-dark-bg'
                    : 'text-light-text-secondary dark:text-dark-text-secondary hover:bg-gray-100 dark:hover:bg-dark-surface-hover'
                )}
              >
                <LayoutGrid size={16} />
              </button>
              <button
                onClick={() => handleViewModeChange('weekly')}
                className={cn(
                  'px-3 py-1.5 text-sm transition-colors',
                  viewMode === 'weekly'
                    ? 'bg-brand-primary text-dark-bg'
                    : 'text-light-text-secondary dark:text-dark-text-secondary hover:bg-gray-100 dark:hover:bg-dark-surface-hover'
                )}
              >
                <CalendarIcon size={16} />
              </button>
            </div>

            <Button variant="secondary" size="sm" onClick={() => setCurrentDate(new Date())}>
              오늘
            </Button>
            <Button size="sm" onClick={() => { setSelectedDate(format(new Date(), 'yyyy-MM-dd')); setIsFormOpen(true); }}>
              <Plus size={16} />
              일정 추가
            </Button>
          </div>
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
          {weeks.map((week, weekIndex) => {
            const weekEvents = getEventsForWeek(week);
            const maxSlots = viewMode === 'monthly' ? 3 : 10;
            const maxSlot = Math.max(...weekEvents.map(e => e.event.slot), -1);
            const visibleSlotCount = Math.min(maxSlot + 1, maxSlots);
            const eventAreaHeight = Math.max(visibleSlotCount * 22, 0);

            return (
              <div key={weekIndex} className="relative">
                {/* Date cells */}
                <div className="grid grid-cols-7 divide-x divide-light-border dark:divide-dark-border">
                  {week.map((date, dayIndex) => {
                    const isCurrentMonth = isSameMonth(date, currentDate);
                    const isCurrentDay = isToday(date);

                    return (
                      <div
                        key={date.toISOString()}
                        onClick={() => handleDayClick(date)}
                        className={cn(
                          'transition-colors cursor-pointer',
                          viewMode === 'monthly' ? 'min-h-[100px]' : 'min-h-[200px]',
                          !isCurrentMonth && viewMode === 'monthly' && 'bg-gray-50 dark:bg-dark-surface-hover/50',
                          'hover:bg-gray-50 dark:hover:bg-dark-surface-hover'
                        )}
                      >
                        <div className="p-2">
                          <div
                            className={cn(
                              'w-7 h-7 flex items-center justify-center rounded-full text-sm',
                              isCurrentDay && 'bg-brand-primary text-dark-bg font-bold',
                              !isCurrentDay && dayIndex === 0 && 'text-red-500',
                              !isCurrentDay && dayIndex === 6 && 'text-blue-500',
                              !isCurrentDay && !isCurrentMonth && viewMode === 'monthly' && 'text-light-text-secondary/50 dark:text-dark-text-secondary/50',
                              !isCurrentDay && (isCurrentMonth || viewMode === 'weekly') && dayIndex !== 0 && dayIndex !== 6 && 'text-light-text dark:text-dark-text'
                            )}
                          >
                            {format(date, 'd')}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* Events layer - positioned over the week */}
                <div
                  className="absolute left-0 right-0 pointer-events-none px-2"
                  style={{ top: 40, height: eventAreaHeight }}
                >
                  <div className="relative h-full">
                    {weekEvents
                      .filter((item) => item.event.slot < maxSlots)
                      .map((item) => {
                        const { event, startDay, span } = item;
                        const isGenerated = event.id.startsWith('ep-deadline-');
                        const leftPercent = (startDay / 7) * 100;
                        const widthPercent = (span / 7) * 100;

                        return (
                          <div
                            key={event.id}
                            onClick={(e) => {
                              e.stopPropagation();
                              handleEventClick(event, e);
                            }}
                            className={cn(
                              'absolute group px-1.5 py-0.5 rounded text-xs truncate transition-opacity pointer-events-auto',
                              !isGenerated && 'cursor-pointer hover:opacity-80'
                            )}
                            style={{
                              top: event.slot * 22,
                              left: `calc(${leftPercent}% + 2px)`,
                              width: `calc(${widthPercent}% - 4px)`,
                              backgroundColor: `${event.color || '#6B7280'}20`,
                              color: event.color || '#6B7280',
                              borderLeft: `2px solid ${event.color || '#6B7280'}`,
                              height: 20,
                              zIndex: 10,
                            }}
                          >
                            <span className="truncate block">{event.title}</span>
                            {!isGenerated && (
                              <button
                                onClick={(e) => handleDeleteClick(event, e)}
                                className="absolute right-1 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 text-red-500 hover:text-red-600"
                              >
                                ×
                              </button>
                            )}
                          </div>
                        );
                      })}
                    {maxSlot >= maxSlots && (
                      <div
                        className="absolute left-0 text-xs text-light-text-secondary dark:text-dark-text-secondary px-1.5"
                        style={{ top: maxSlots * 22 }}
                      >
                        +{maxSlot - maxSlots + 1}개
                      </div>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </Card>

      {/* Create/Edit Event Modal */}
      <Modal
        isOpen={isFormOpen}
        onClose={handleFormClose}
        title={editingEvent ? '일정 수정' : '새 일정'}
        size="lg"
      >
        <EventForm
          event={editingEvent || undefined}
          initialDate={selectedDate || undefined}
          onSubmit={handleFormClose}
          onCancel={handleFormClose}
        />
      </Modal>

      {/* Delete Confirmation Modal */}
      <Modal
        isOpen={!!deleteConfirmEvent}
        onClose={() => setDeleteConfirmEvent(null)}
        title="일정 삭제"
        size="sm"
      >
        <div className="space-y-4">
          <p className="text-sm text-light-text dark:text-dark-text">
            정말로 <span className="font-semibold">"{deleteConfirmEvent?.title}"</span> 일정을 삭제하시겠습니까?
          </p>
          <div className="flex justify-end gap-2 pt-2">
            <Button variant="secondary" onClick={() => setDeleteConfirmEvent(null)}>
              취소
            </Button>
            <Button variant="danger" onClick={confirmDelete}>
              삭제
            </Button>
          </div>
        </div>
      </Modal>
    </motion.div>
  );
}
