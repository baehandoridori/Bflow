import { TrendingUp, CheckCircle, Clock, AlertTriangle } from 'lucide-react';
import { Widget } from './Widget';
import { useProjectStore } from '@/stores/useProjectStore';
import { useTaskStore } from '@/stores/useTaskStore';
import { useTeamStore } from '@/stores/useTeamStore';
import { cn } from '@/utils/cn';

interface StatCardProps {
  label: string;
  value: string | number;
  icon: React.ReactNode;
  color: string;
  trend?: string;
}

function StatCard({ label, value, icon, color, trend }: StatCardProps) {
  return (
    <div className="flex items-center gap-3 p-3 rounded-lg bg-gray-50 dark:bg-dark-surface-hover">
      <div
        className={cn('p-2 rounded-lg')}
        style={{ backgroundColor: `${color}20`, color }}
      >
        {icon}
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-xs text-light-text-secondary dark:text-dark-text-secondary truncate">
          {label}
        </p>
        <p className="text-lg font-bold text-light-text dark:text-dark-text">{value}</p>
      </div>
      {trend && (
        <span className="text-xs text-green-500 font-medium">{trend}</span>
      )}
    </div>
  );
}

export function SummaryWidget() {
  const { episodes } = useProjectStore();
  const { tasks } = useTaskStore();
  const { members } = useTeamStore();

  const activeEpisodes = episodes.filter((ep) => ep.progress < 100).length;
  const completedTasks = tasks.filter((t) => t.status === 'done').length;
  const workingMembers = members.filter((m) => m.status === 'working').length;
  const urgentTasks = tasks.filter((t) => t.priority === 'high' && t.status !== 'done').length;

  const avgProgress = Math.round(
    episodes.reduce((acc, ep) => acc + ep.progress, 0) / episodes.length
  );

  return (
    <Widget id="summary" title="요약" icon={<TrendingUp size={18} />}>
      <div className="grid grid-cols-2 gap-3">
        <StatCard
          label="진행 중인 에피소드"
          value={activeEpisodes}
          icon={<Clock size={18} />}
          color="#3B82F6"
        />
        <StatCard
          label="완료된 태스크"
          value={`${completedTasks}/${tasks.length}`}
          icon={<CheckCircle size={18} />}
          color="#22C55E"
        />
        <StatCard
          label="작업 중인 팀원"
          value={workingMembers}
          icon={<TrendingUp size={18} />}
          color="#8B5CF6"
        />
        <StatCard
          label="긴급 태스크"
          value={urgentTasks}
          icon={<AlertTriangle size={18} />}
          color="#EF4444"
        />
      </div>
      <div className="mt-4 p-3 rounded-lg bg-brand-primary/10">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-medium text-light-text dark:text-dark-text">
            전체 진행률
          </span>
          <span className="text-sm font-bold text-brand-primary">{avgProgress}%</span>
        </div>
        <div className="h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
          <div
            className="h-full bg-brand-primary rounded-full transition-all duration-500"
            style={{ width: `${avgProgress}%` }}
          />
        </div>
      </div>
    </Widget>
  );
}
