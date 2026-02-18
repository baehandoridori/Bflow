import { useState, useCallback } from 'react';
import { Responsive, WidthProvider, Layout, Layouts } from 'react-grid-layout';
import { motion, AnimatePresence } from 'framer-motion';
import { Lock, Unlock, RotateCcw } from 'lucide-react';
import {
  SummaryWidget,
  GanttWidget,
  TeamWidget,
  TasksWidget,
  CalendarWidget,
} from '@/components/widgets';
import { useAppStore } from '@/stores/useAppStore';
import { cn } from '@/utils/cn';
import 'react-grid-layout/css/styles.css';
import 'react-resizable/css/styles.css';

const ResponsiveGridLayout = WidthProvider(Responsive);

// Default layout configuration
const DEFAULT_LAYOUTS: Layouts = {
  lg: [
    { i: 'summary', x: 0, y: 0, w: 2, h: 2, minW: 1, minH: 2 },
    { i: 'gantt', x: 2, y: 0, w: 2, h: 4, minW: 2, minH: 3 },
    { i: 'team', x: 0, y: 2, w: 2, h: 4, minW: 1, minH: 2 },
    { i: 'tasks', x: 0, y: 6, w: 2, h: 4, minW: 1, minH: 2 },
    { i: 'calendar', x: 2, y: 4, w: 2, h: 4, minW: 1, minH: 3 },
  ],
};

const WIDGET_COMPONENTS: Record<string, React.FC> = {
  summary: SummaryWidget,
  gantt: GanttWidget,
  team: TeamWidget,
  tasks: TasksWidget,
  calendar: CalendarWidget,
};

const WIDGET_LABELS: Record<string, string> = {
  summary: '요약',
  gantt: '간트 차트',
  team: '팀 현황',
  tasks: '태스크',
  calendar: '캘린더',
};

export function Dashboard() {
  const { widgetLayout, setWidgetLayout } = useAppStore();
  const [isEditMode, setIsEditMode] = useState(false);
  const [isDragging, setIsDragging] = useState(false);

  // Use saved layout or default
  const layouts = (widgetLayout?.lg ? widgetLayout : DEFAULT_LAYOUTS) as Layouts;

  const handleLayoutChange = useCallback(
    (_layout: Layout[], allLayouts: Layouts) => {
      if (isEditMode) {
        setWidgetLayout(allLayouts as Layouts);
      }
    },
    [isEditMode, setWidgetLayout]
  );

  const handleDragStart = () => setIsDragging(true);
  const handleDragStop = () => setIsDragging(false);

  const resetLayout = () => {
    setWidgetLayout(DEFAULT_LAYOUTS);
  };

  return (
    <div className="relative">
      {/* Edit Mode Controls */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-center justify-end gap-2 mb-4"
      >
        {isEditMode && (
          <motion.button
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            onClick={resetLayout}
            className={cn(
              'flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm',
              'bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700',
              'transition-colors'
            )}
          >
            <RotateCcw size={14} />
            초기화
          </motion.button>
        )}
        <button
          onClick={() => setIsEditMode(!isEditMode)}
          className={cn(
            'flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-medium',
            'transition-all duration-200',
            isEditMode
              ? 'bg-brand-primary text-gray-900'
              : 'bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700'
          )}
        >
          {isEditMode ? (
            <>
              <Unlock size={14} />
              편집 완료
            </>
          ) : (
            <>
              <Lock size={14} />
              레이아웃 편집
            </>
          )}
        </button>
      </motion.div>

      {/* Edit Mode Overlay Hint */}
      <AnimatePresence>
        {isEditMode && !isDragging && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 pointer-events-none z-10 flex items-center justify-center"
          >
            <div className="bg-black/50 text-white px-4 py-2 rounded-lg text-sm backdrop-blur-sm">
              위젯을 드래그하여 이동하거나, 모서리를 잡아 크기를 조절하세요
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Grid Layout */}
      <ResponsiveGridLayout
        className="layout"
        layouts={layouts}
        breakpoints={{ lg: 1200, md: 996, sm: 768, xs: 480, xxs: 0 }}
        cols={{ lg: 4, md: 4, sm: 2, xs: 2, xxs: 1 }}
        rowHeight={80}
        margin={[16, 16]}
        containerPadding={[0, 0]}
        onLayoutChange={handleLayoutChange}
        onDragStart={handleDragStart}
        onDragStop={handleDragStop}
        onResizeStart={handleDragStart}
        onResizeStop={handleDragStop}
        isDraggable={isEditMode}
        isResizable={isEditMode}
        draggableHandle=".widget-drag-handle"
        resizeHandles={['se', 'sw', 'ne', 'nw']}
        useCSSTransforms={true}
      >
        {Object.entries(WIDGET_COMPONENTS).map(([key, WidgetComponent]) => (
          <div
            key={key}
            className={cn(
              'transition-all duration-200',
              isEditMode && 'ring-2 ring-brand-primary/30 ring-offset-2 ring-offset-light-bg dark:ring-offset-dark-bg rounded-xl',
              isDragging && 'cursor-grabbing'
            )}
          >
            <div className="h-full relative group">
              {/* Edit mode overlay on widget */}
              {isEditMode && (
                <div className="absolute inset-0 bg-brand-primary/5 rounded-xl pointer-events-none z-0" />
              )}

              {/* Drag handle indicator */}
              {isEditMode && (
                <div className="absolute top-2 left-1/2 -translate-x-1/2 z-20 opacity-0 group-hover:opacity-100 transition-opacity">
                  <div className="flex gap-1">
                    <div className="w-1 h-1 rounded-full bg-gray-400" />
                    <div className="w-1 h-1 rounded-full bg-gray-400" />
                    <div className="w-1 h-1 rounded-full bg-gray-400" />
                  </div>
                </div>
              )}

              {/* Widget Label in Edit Mode */}
              {isEditMode && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="absolute -top-3 left-3 z-20 px-2 py-0.5 bg-brand-primary text-gray-900 text-xs font-medium rounded"
                >
                  {WIDGET_LABELS[key]}
                </motion.div>
              )}

              <WidgetComponent />
            </div>
          </div>
        ))}
      </ResponsiveGridLayout>
    </div>
  );
}
