import { ListTodo, Circle, CheckCircle2 } from 'lucide-react';
import { Widget } from './Widget';
import { Avatar } from '@/components/ui';
import { useTaskStore } from '@/stores/useTaskStore';
import { useTeamStore } from '@/stores/useTeamStore';
import { formatRelativeDate } from '@/utils/date';
import { cn } from '@/utils/cn';
import { PRIORITY_COLORS } from '@/constants/pipeline';

const statusIcons = {
  waiting: <Circle size={14} className="text-gray-400" />,
  progress: <Circle size={14} className="text-blue-500 fill-blue-500/20" />,
  review: <Circle size={14} className="text-amber-500 fill-amber-500/20" />,
  done: <CheckCircle2 size={14} className="text-green-500" />,
};

export function TasksWidget() {
  const { tasks } = useTaskStore();
  const { getMemberById } = useTeamStore();

  const activeTasks = tasks
    .filter((t) => t.status !== 'done')
    .sort((a, b) => {
      // Sort by priority, then by due date
      const priorityOrder = { high: 0, medium: 1, low: 2 };
      const aPriority = priorityOrder[a.priority || 'low'];
      const bPriority = priorityOrder[b.priority || 'low'];
      if (aPriority !== bPriority) return aPriority - bPriority;

      if (a.dueDate && b.dueDate) {
        return new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime();
      }
      return 0;
    })
    .slice(0, 6);

  return (
    <Widget id="tasks" title="진행 중인 태스크" icon={<ListTodo size={18} />}>
      <div className="space-y-2">
        {activeTasks.map((task) => {
          const assignee = task.assigneeId ? getMemberById(task.assigneeId) : null;
          const priorityColor = task.priority ? PRIORITY_COLORS[task.priority] : undefined;

          return (
            <div
              key={task.id}
              className={cn(
                'flex items-start gap-3 p-2 rounded-lg transition-colors',
                'hover:bg-gray-50 dark:hover:bg-dark-surface-hover',
                'cursor-pointer'
              )}
            >
              <div className="mt-0.5">{statusIcons[task.status]}</div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium text-light-text dark:text-dark-text truncate">
                    {task.title}
                  </span>
                  {priorityColor && (
                    <span
                      className="w-1.5 h-1.5 rounded-full flex-shrink-0"
                      style={{ backgroundColor: priorityColor }}
                    />
                  )}
                </div>
                <div className="flex items-center gap-2 mt-1">
                  {task.dueDate && (
                    <span className="text-xs text-light-text-secondary dark:text-dark-text-secondary">
                      {formatRelativeDate(task.dueDate)}
                    </span>
                  )}
                </div>
              </div>
              {assignee && (
                <Avatar name={assignee.name} size="sm" />
              )}
            </div>
          );
        })}

        {activeTasks.length === 0 && (
          <div className="text-center py-8 text-light-text-secondary dark:text-dark-text-secondary">
            진행 중인 태스크가 없습니다
          </div>
        )}

        {tasks.filter((t) => t.status !== 'done').length > 6 && (
          <button className="w-full text-center text-sm text-brand-primary hover:underline py-2">
            +{tasks.filter((t) => t.status !== 'done').length - 6}개 더 보기
          </button>
        )}
      </div>
    </Widget>
  );
}
