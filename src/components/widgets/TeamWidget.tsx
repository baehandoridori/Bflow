import { Users } from 'lucide-react';
import { Widget } from './Widget';
import { Avatar, Badge } from '@/components/ui';
import { useTeamStore } from '@/stores/useTeamStore';
import { useTaskStore } from '@/stores/useTaskStore';
import { cn } from '@/utils/cn';

const statusLabels: Record<string, string> = {
  working: '작업 중',
  review: '리뷰 중',
  done: '완료',
  waiting: '대기',
  absent: '부재',
};

const statusVariants: Record<string, 'success' | 'warning' | 'info' | 'default' | 'danger'> = {
  working: 'success',
  review: 'warning',
  done: 'info',
  waiting: 'default',
  absent: 'danger',
};

export function TeamWidget() {
  const { members } = useTeamStore();
  const { getTaskById } = useTaskStore();

  const sortedMembers = [...members].sort((a, b) => {
    const order = { working: 0, review: 1, done: 2, waiting: 3, absent: 4 };
    return order[a.status] - order[b.status];
  });

  return (
    <Widget id="team" title="팀 현황" icon={<Users size={18} />}>
      <div className="space-y-2">
        {sortedMembers.slice(0, 8).map((member) => {
          const task = member.currentTaskId
            ? getTaskById(member.currentTaskId)
            : null;

          return (
            <div
              key={member.id}
              className={cn(
                'flex items-center gap-3 p-2 rounded-lg transition-colors',
                'hover:bg-gray-50 dark:hover:bg-dark-surface-hover'
              )}
            >
              <Avatar name={member.name} size="sm" status={member.status} />
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium text-light-text dark:text-dark-text truncate">
                    {member.name}
                  </span>
                  <span className="text-xs text-light-text-secondary dark:text-dark-text-secondary">
                    {member.role}
                  </span>
                </div>
                {task && (
                  <p className="text-xs text-light-text-secondary dark:text-dark-text-secondary truncate">
                    {task.title}
                  </p>
                )}
              </div>
              <Badge variant={statusVariants[member.status]} size="sm">
                {statusLabels[member.status]}
              </Badge>
            </div>
          );
        })}

        {members.length > 8 && (
          <button className="w-full text-center text-sm text-brand-primary hover:underline py-2">
            +{members.length - 8}명 더 보기
          </button>
        )}
      </div>
    </Widget>
  );
}
