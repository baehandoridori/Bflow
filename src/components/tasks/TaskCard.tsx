import { useState } from 'react';
import { motion } from 'framer-motion';
import { Calendar, User, MoreVertical, Edit2, Trash2, AlertCircle } from 'lucide-react';
import { format, isPast, isToday } from 'date-fns';
import { ko } from 'date-fns/locale';
import { cn } from '@/utils/cn';
import { Badge } from '@/components/ui/Badge';
import { useDataStore } from '@/stores/useDataStore';
import type { Task } from '@/types';

interface TaskCardProps {
  task: Task;
  onEdit: (task: Task) => void;
  onDelete: (task: Task) => void;
  compact?: boolean;
}

export function TaskCard({ task, onEdit, onDelete, compact = false }: TaskCardProps) {
  const [showMenu, setShowMenu] = useState(false);
  const { getTeamMemberById, getEpisodeById } = useDataStore();

  const assignee = task.assigneeId ? getTeamMemberById(task.assigneeId) : null;
  const episode = getEpisodeById(task.episodeId);

  const statusConfig = {
    waiting: { label: '대기', color: 'bg-gray-400', textColor: 'text-gray-600 dark:text-gray-400' },
    progress: { label: '진행 중', color: 'bg-blue-500', textColor: 'text-blue-600 dark:text-blue-400' },
    review: { label: '검토', color: 'bg-amber-500', textColor: 'text-amber-600 dark:text-amber-400' },
    done: { label: '완료', color: 'bg-green-500', textColor: 'text-green-600 dark:text-green-400' },
  };

  const priorityConfig = {
    high: { label: '높음', color: 'bg-red-500' },
    medium: { label: '보통', color: 'bg-amber-500' },
    low: { label: '낮음', color: 'bg-gray-400' },
  };

  const status = statusConfig[task.status];
  const priority = task.priority ? priorityConfig[task.priority] : null;

  const isOverdue = task.dueDate && isPast(new Date(task.dueDate)) && task.status !== 'done';
  const isDueToday = task.dueDate && isToday(new Date(task.dueDate));

  if (compact) {
    return (
      <div className="flex items-center justify-between py-2 px-3 rounded-lg bg-light-surface dark:bg-dark-surface border border-light-border dark:border-dark-border">
        <div className="flex items-center gap-2 min-w-0">
          <span className={cn('w-2 h-2 rounded-full flex-shrink-0', status.color)} />
          <span className="text-sm text-light-text dark:text-dark-text truncate">
            {task.title}
          </span>
        </div>
        {assignee && (
          <span className="text-xs text-light-text-secondary dark:text-dark-text-secondary flex-shrink-0">
            {assignee.name}
          </span>
        )}
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      className={cn(
        'relative p-4 rounded-xl transition-all',
        'bg-light-surface dark:bg-dark-surface',
        'border border-light-border dark:border-dark-border',
        'hover:shadow-md dark:hover:shadow-black/20',
        isOverdue && 'border-red-500/50'
      )}
    >
      {/* Header */}
      <div className="flex items-start justify-between gap-2 mb-2">
        <div className="flex items-center gap-2 flex-wrap">
          <span className={cn('w-2.5 h-2.5 rounded-full', status.color)} />
          <span className={cn('text-xs font-medium', status.textColor)}>
            {status.label}
          </span>
          {priority && (
            <Badge variant={task.priority === 'high' ? 'danger' : task.priority === 'medium' ? 'warning' : 'default'} size="sm">
              {priority.label}
            </Badge>
          )}
        </div>

        {/* Menu */}
        <div className="relative">
          <button
            onClick={() => setShowMenu(!showMenu)}
            className="p-1 rounded-lg text-light-text-secondary dark:text-dark-text-secondary hover:bg-gray-100 dark:hover:bg-dark-surface-hover transition-colors"
          >
            <MoreVertical size={16} />
          </button>

          {showMenu && (
            <>
              <div
                className="fixed inset-0 z-10"
                onClick={() => setShowMenu(false)}
              />
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="absolute right-0 top-full mt-1 z-20 w-32 py-1 rounded-lg bg-light-surface dark:bg-dark-surface border border-light-border dark:border-dark-border shadow-lg"
              >
                <button
                  onClick={() => {
                    setShowMenu(false);
                    onEdit(task);
                  }}
                  className="w-full flex items-center gap-2 px-3 py-2 text-sm text-light-text dark:text-dark-text hover:bg-gray-100 dark:hover:bg-dark-surface-hover transition-colors"
                >
                  <Edit2 size={14} />
                  수정
                </button>
                <button
                  onClick={() => {
                    setShowMenu(false);
                    onDelete(task);
                  }}
                  className="w-full flex items-center gap-2 px-3 py-2 text-sm text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 transition-colors"
                >
                  <Trash2 size={14} />
                  삭제
                </button>
              </motion.div>
            </>
          )}
        </div>
      </div>

      {/* Title */}
      <h3 className="text-sm font-medium text-light-text dark:text-dark-text mb-2">
        {task.title}
      </h3>

      {/* Episode */}
      {episode && (
        <p className="text-xs text-light-text-secondary dark:text-dark-text-secondary mb-3">
          {episode.name}
        </p>
      )}

      {/* Memo */}
      {task.memo && (
        <p className="text-xs text-light-text-secondary dark:text-dark-text-secondary mb-3 line-clamp-2">
          {task.memo}
        </p>
      )}

      {/* Footer */}
      <div className="flex items-center justify-between text-xs">
        {/* Assignee */}
        <div className="flex items-center gap-1.5 text-light-text-secondary dark:text-dark-text-secondary">
          <User size={12} />
          <span>{assignee?.name || '미배정'}</span>
        </div>

        {/* Due Date */}
        {task.dueDate && (
          <div
            className={cn(
              'flex items-center gap-1.5',
              isOverdue
                ? 'text-red-500'
                : isDueToday
                ? 'text-amber-500'
                : 'text-light-text-secondary dark:text-dark-text-secondary'
            )}
          >
            {isOverdue && <AlertCircle size={12} />}
            <Calendar size={12} />
            <span>{format(new Date(task.dueDate), 'M.d (EEE)', { locale: ko })}</span>
          </div>
        )}
      </div>
    </motion.div>
  );
}
