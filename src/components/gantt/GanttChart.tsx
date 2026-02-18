import { useState, useRef, useCallback, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { motion } from 'framer-motion';
import { Calendar, ZoomIn, ZoomOut, Maximize2 } from 'lucide-react';
import {
  format,
  differenceInDays,
  addDays,
  startOfWeek,
  eachDayOfInterval,
  isToday,
} from 'date-fns';
import { ko } from 'date-fns/locale';
import { useProjectStore } from '@/stores/useProjectStore';
import { cn } from '@/utils/cn';
import type { Episode } from '@/types';

interface DragState {
  episodeId: string;
  type: 'move' | 'resize-start' | 'resize-end';
  startX: number;
  originalStartDate: string;
  originalDueDate: string;
}

interface TooltipState {
  episodeId: string;
  x: number;
  y: number;
  newStartDate?: string;
  newDueDate?: string;
}

// 날짜 범위 계산
function getDateRange(episodes: Episode[]) {
  if (episodes.length === 0) {
    const today = new Date();
    return {
      start: startOfWeek(today, { weekStartsOn: 1 }),
      end: addDays(today, 60),
    };
  }

  const allDates = episodes.flatMap((ep) => [
    new Date(ep.startDate),
    new Date(ep.dueDate),
  ]);
  const minDate = new Date(Math.min(...allDates.map((d) => d.getTime())));
  const maxDate = new Date(Math.max(...allDates.map((d) => d.getTime())));

  // 앞뒤로 여유 추가
  return {
    start: addDays(startOfWeek(minDate, { weekStartsOn: 1 }), -7),
    end: addDays(maxDate, 14),
  };
}

interface GanttBarProps {
  episode: Episode;
  dateRange: { start: Date; end: Date };
  dayWidth: number;
  projectColor: string;
  onDragStart: (episodeId: string, type: DragState['type'], e: React.MouseEvent) => void;
  isDragging: boolean;
  previewDates?: { startDate: string; dueDate: string };
}

function GanttBar({
  episode,
  dateRange,
  dayWidth,
  projectColor,
  onDragStart,
  isDragging,
  previewDates,
}: GanttBarProps) {
  const startDate = previewDates ? new Date(previewDates.startDate) : new Date(episode.startDate);
  const dueDate = previewDates ? new Date(previewDates.dueDate) : new Date(episode.dueDate);

  const startOffset = differenceInDays(startDate, dateRange.start);
  const duration = differenceInDays(dueDate, startDate) + 1;

  const left = startOffset * dayWidth;
  const width = duration * dayWidth;

  return (
    <div
      className={cn(
        'absolute h-8 rounded-md flex items-center transition-shadow',
        isDragging ? 'shadow-lg z-20' : 'shadow-sm hover:shadow-md'
      )}
      style={{
        left: `${left}px`,
        width: `${width}px`,
        backgroundColor: projectColor,
      }}
    >
      {/* 왼쪽 리사이즈 핸들 */}
      <div
        className="absolute left-0 top-0 bottom-0 w-2 cursor-ew-resize hover:bg-black/20 rounded-l-md flex items-center justify-center"
        onMouseDown={(e) => onDragStart(episode.id, 'resize-start', e)}
      >
        <div className="w-0.5 h-4 bg-white/50 rounded-full" />
      </div>

      {/* 메인 바 (드래그 이동) */}
      <div
        className="flex-1 h-full flex items-center justify-center cursor-grab active:cursor-grabbing px-3 overflow-hidden"
        onMouseDown={(e) => onDragStart(episode.id, 'move', e)}
      >
        <span className="text-xs font-medium text-white truncate drop-shadow-sm">
          {episode.name}
        </span>
      </div>

      {/* 오른쪽 리사이즈 핸들 */}
      <div
        className="absolute right-0 top-0 bottom-0 w-2 cursor-ew-resize hover:bg-black/20 rounded-r-md flex items-center justify-center"
        onMouseDown={(e) => onDragStart(episode.id, 'resize-end', e)}
      >
        <div className="w-0.5 h-4 bg-white/50 rounded-full" />
      </div>

      {/* 진행률 표시 */}
      <div
        className="absolute bottom-0 left-0 h-1 bg-white/30 rounded-b-md"
        style={{ width: `${episode.progress}%` }}
      />
    </div>
  );
}

export function GanttChart() {
  const { episodes, getProjectById, updateEpisode } = useProjectStore();
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const [dragState, setDragState] = useState<DragState | null>(null);
  const [previewDates, setPreviewDates] = useState<Record<string, { startDate: string; dueDate: string }>>({});
  const [tooltip, setTooltip] = useState<TooltipState | null>(null);
  const [dayWidth, setDayWidth] = useState(30); // 하루당 픽셀 너비

  const MIN_DAY_WIDTH = 15;
  const MAX_DAY_WIDTH = 60;
  const DEFAULT_DAY_WIDTH = 30;

  // 줌 핸들러
  const handleZoom = useCallback((delta: number) => {
    setDayWidth((prev) => Math.max(MIN_DAY_WIDTH, Math.min(MAX_DAY_WIDTH, prev + delta)));
  }, []);

  // 줌 리셋
  const handleResetZoom = useCallback(() => {
    setDayWidth(DEFAULT_DAY_WIDTH);
  }, []);

  // 마우스 휠 줌
  useEffect(() => {
    const container = scrollContainerRef.current;
    if (!container) return;

    const handleWheel = (e: WheelEvent) => {
      if (e.ctrlKey || e.metaKey) {
        e.preventDefault();
        handleZoom(e.deltaY > 0 ? -3 : 3);
      }
    };

    container.addEventListener('wheel', handleWheel, { passive: false });
    return () => container.removeEventListener('wheel', handleWheel);
  }, [handleZoom]);

  const DAY_WIDTH = dayWidth;

  const sortedEpisodes = [...episodes].sort(
    (a, b) => new Date(a.startDate).getTime() - new Date(b.startDate).getTime()
  );

  const dateRange = getDateRange(sortedEpisodes);
  const totalDays = differenceInDays(dateRange.end, dateRange.start) + 1;
  const days = eachDayOfInterval({ start: dateRange.start, end: dateRange.end });

  const handleDragStart = useCallback(
    (episodeId: string, type: DragState['type'], e: React.MouseEvent) => {
      e.preventDefault();
      const episode = episodes.find((ep) => ep.id === episodeId);
      if (!episode) return;

      setDragState({
        episodeId,
        type,
        startX: e.clientX,
        originalStartDate: episode.startDate,
        originalDueDate: episode.dueDate,
      });
    },
    [episodes]
  );

  const handleMouseMove = useCallback(
    (e: MouseEvent) => {
      if (!dragState) return;

      const deltaX = e.clientX - dragState.startX;
      const deltaDays = Math.round(deltaX / DAY_WIDTH);

      const originalStart = new Date(dragState.originalStartDate);
      const originalEnd = new Date(dragState.originalDueDate);

      let newStartDate: Date;
      let newDueDate: Date;

      switch (dragState.type) {
        case 'move':
          newStartDate = addDays(originalStart, deltaDays);
          newDueDate = addDays(originalEnd, deltaDays);
          break;
        case 'resize-start':
          newStartDate = addDays(originalStart, deltaDays);
          newDueDate = originalEnd;
          // 시작일이 마감일을 넘지 않도록
          if (newStartDate >= newDueDate) {
            newStartDate = addDays(newDueDate, -1);
          }
          break;
        case 'resize-end':
          newStartDate = originalStart;
          newDueDate = addDays(originalEnd, deltaDays);
          // 마감일이 시작일보다 앞서지 않도록
          if (newDueDate <= newStartDate) {
            newDueDate = addDays(newStartDate, 1);
          }
          break;
      }

      const newStartStr = format(newStartDate, 'yyyy-MM-dd');
      const newDueStr = format(newDueDate, 'yyyy-MM-dd');

      setPreviewDates((prev) => ({
        ...prev,
        [dragState.episodeId]: { startDate: newStartStr, dueDate: newDueStr },
      }));

      // 툴팁 업데이트
      setTooltip({
        episodeId: dragState.episodeId,
        x: e.clientX,
        y: e.clientY,
        newStartDate: newStartStr,
        newDueDate: newDueStr,
      });
    },
    [dragState]
  );

  const handleMouseUp = useCallback(() => {
    if (!dragState) return;

    const preview = previewDates[dragState.episodeId];
    if (preview) {
      updateEpisode(dragState.episodeId, {
        startDate: preview.startDate,
        dueDate: preview.dueDate,
      });
    }

    setDragState(null);
    setPreviewDates({});
    setTooltip(null);
  }, [dragState, previewDates, updateEpisode]);

  useEffect(() => {
    if (dragState) {
      window.addEventListener('mousemove', handleMouseMove);
      window.addEventListener('mouseup', handleMouseUp);
      return () => {
        window.removeEventListener('mousemove', handleMouseMove);
        window.removeEventListener('mouseup', handleMouseUp);
      };
    }
  }, [dragState, handleMouseMove, handleMouseUp]);

  return (
    <div className="h-full flex flex-col bg-light-surface dark:bg-dark-surface rounded-lg border border-light-border dark:border-dark-border overflow-hidden">
      {/* 헤더 */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-light-border dark:border-dark-border">
        <div className="flex items-center gap-2">
          <Calendar size={18} className="text-light-text-secondary dark:text-dark-text-secondary" />
          <h2 className="font-semibold text-light-text dark:text-dark-text">간트 차트</h2>
        </div>
        <div className="flex items-center gap-4">
          <span className="text-xs text-light-text-secondary dark:text-dark-text-secondary">
            Ctrl+휠로 확대/축소
          </span>
          {/* 줌 컨트롤 */}
          <div className="flex items-center gap-1 bg-gray-100 dark:bg-gray-800 rounded-lg p-1">
            <button
              onClick={() => handleZoom(-5)}
              className="p-1.5 hover:bg-gray-200 dark:hover:bg-gray-700 rounded transition-colors"
              title="축소"
            >
              <ZoomOut size={16} />
            </button>
            <span className="text-xs font-medium w-12 text-center">
              {Math.round((dayWidth / DEFAULT_DAY_WIDTH) * 100)}%
            </span>
            <button
              onClick={() => handleZoom(5)}
              className="p-1.5 hover:bg-gray-200 dark:hover:bg-gray-700 rounded transition-colors"
              title="확대"
            >
              <ZoomIn size={16} />
            </button>
            <div className="w-px h-4 bg-gray-300 dark:bg-gray-600 mx-1" />
            <button
              onClick={handleResetZoom}
              className="p-1.5 hover:bg-gray-200 dark:hover:bg-gray-700 rounded transition-colors"
              title="초기화"
            >
              <Maximize2 size={16} />
            </button>
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-auto" ref={scrollContainerRef}>
        <div style={{ minWidth: `${totalDays * DAY_WIDTH + 200}px` }}>
          {/* 날짜 헤더 */}
          <div className="flex border-b border-light-border dark:border-dark-border sticky top-0 bg-light-surface dark:bg-dark-surface z-10">
            {/* 에피소드 이름 열 */}
            <div className="w-[200px] flex-shrink-0 p-2 border-r border-light-border dark:border-dark-border">
              <span className="text-xs font-medium text-light-text-secondary dark:text-dark-text-secondary">
                에피소드
              </span>
            </div>

            {/* 날짜 열 */}
            <div className="flex">
              {days.map((day, index) => {
                const dayOfWeek = day.getDay();
                const isSaturday = dayOfWeek === 6;
                const isSunday = dayOfWeek === 0;
                const isWeekend = isSaturday || isSunday;
                const isTodayDate = isToday(day);
                const isFirstOfMonth = day.getDate() === 1;
                const isMonday = dayOfWeek === 1;

                return (
                  <div
                    key={index}
                    className={cn(
                      'flex flex-col items-center justify-center',
                      isWeekend && 'bg-red-50 dark:bg-red-900/20',
                      isTodayDate && 'bg-brand-primary/20',
                      isMonday && 'border-l-2 border-gray-300 dark:border-gray-600'
                    )}
                    style={{ width: `${DAY_WIDTH}px` }}
                  >
                    {isFirstOfMonth && (
                      <span className="text-[10px] font-semibold text-brand-primary">
                        {format(day, 'M월', { locale: ko })}
                      </span>
                    )}
                    <span
                      className={cn(
                        'text-[10px]',
                        isTodayDate
                          ? 'font-bold text-brand-primary'
                          : isWeekend
                          ? 'font-medium text-red-500 dark:text-red-400'
                          : 'text-light-text-secondary dark:text-dark-text-secondary'
                      )}
                    >
                      {format(day, 'd')}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* 에피소드 행 */}
          {sortedEpisodes.map((episode, rowIndex) => {
            const project = getProjectById(episode.projectId);
            const projectColor = project?.color || '#6B7280';
            const preview = previewDates[episode.id];

            return (
              <motion.div
                key={episode.id}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: rowIndex * 0.05 }}
                className="flex border-b border-light-border/50 dark:border-dark-border/50 hover:bg-gray-50 dark:hover:bg-gray-800/30"
              >
                {/* 에피소드 이름 */}
                <div className="w-[200px] flex-shrink-0 p-2 border-r border-light-border dark:border-dark-border flex items-center gap-2">
                  <div
                    className="w-3 h-3 rounded-full flex-shrink-0"
                    style={{ backgroundColor: projectColor }}
                  />
                  <span className="text-sm text-light-text dark:text-dark-text truncate">
                    {episode.name}
                  </span>
                </div>

                {/* 간트 바 영역 */}
                <div className="relative" style={{ width: `${totalDays * DAY_WIDTH}px`, height: '48px' }}>
                  {/* 배경: 주말 표시 + 주간 구분선 */}
                  {days.map((day, i) => {
                    const dayOfWeek = day.getDay();
                    const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;
                    const isMonday = dayOfWeek === 1;

                    return (
                      <div
                        key={`bg-${i}`}
                        className={cn(
                          'absolute top-0 bottom-0',
                          isWeekend && 'bg-red-50/50 dark:bg-red-900/10',
                          isMonday && 'border-l-2 border-gray-200 dark:border-gray-700'
                        )}
                        style={{ left: `${i * DAY_WIDTH}px`, width: `${DAY_WIDTH}px` }}
                      />
                    );
                  })}

                  {/* 오늘 표시선 */}
                  {days.map((day, i) => {
                    if (isToday(day)) {
                      return (
                        <div
                          key={`today-${i}`}
                          className="absolute top-0 bottom-0 w-1 bg-brand-primary z-20 shadow-lg"
                          style={{ left: `${i * DAY_WIDTH + DAY_WIDTH / 2 - 2}px` }}
                        >
                          <div className="absolute -top-1 left-1/2 -translate-x-1/2 w-3 h-3 bg-brand-primary rounded-full" />
                        </div>
                      );
                    }
                    return null;
                  })}

                  {/* 간트 바 */}
                  <div className="absolute inset-0 flex items-center px-1 z-10">
                    <GanttBar
                      episode={episode}
                      dateRange={dateRange}
                      dayWidth={DAY_WIDTH}
                      projectColor={projectColor}
                      onDragStart={handleDragStart}
                      isDragging={dragState?.episodeId === episode.id}
                      previewDates={preview}
                    />
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>
      </div>

      {/* 드래그 중 툴팁 */}
      {tooltip &&
        createPortal(
          <div
            className="fixed z-[9999] pointer-events-none"
            style={{
              left: tooltip.x + 15,
              top: tooltip.y + 15,
            }}
          >
            <div className="bg-gray-900 text-white text-xs px-3 py-2 rounded-lg shadow-lg">
              <div className="flex items-center gap-2">
                <span className="text-gray-400">시작:</span>
                <span className="font-medium">{tooltip.newStartDate}</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-gray-400">마감:</span>
                <span className="font-medium">{tooltip.newDueDate}</span>
              </div>
            </div>
          </div>,
          document.body
        )}
    </div>
  );
}
