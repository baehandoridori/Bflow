import { GanttChart, Check, Clock, AlertCircle } from 'lucide-react';
import { motion } from 'framer-motion';
import { Widget } from './Widget';
import { Badge } from '@/components/ui';
import { useProjectStore } from '@/stores/useProjectStore';
import { PIPELINE_STAGES, PIPELINE_STAGE_INFO } from '@/constants/pipeline';
import { formatDDay, formatDate } from '@/utils/date';
import { cn } from '@/utils/cn';
import type { Episode, Milestone, PipelineStage } from '@/types';

interface MilestoneTooltipProps {
  stage: PipelineStage;
  milestone?: Milestone;
  isCompleted: boolean;
  isCurrent: boolean;
  episodeName: string;
}

function MilestoneTooltip({
  stage,
  milestone,
  isCompleted,
  isCurrent,
  episodeName,
}: MilestoneTooltipProps) {
  const stageInfo = PIPELINE_STAGE_INFO[stage];

  return (
    <div className="w-64 p-3 text-left">
      {/* Header */}
      <div className="flex items-center gap-2 mb-2">
        <div
          className="w-3 h-3 rounded-full"
          style={{ backgroundColor: stageInfo.color }}
        />
        <span className="font-semibold text-white">{stageInfo.label}</span>
        {isCompleted && (
          <span className="ml-auto flex items-center gap-1 text-xs text-green-400">
            <Check size={12} />
            완료
          </span>
        )}
        {isCurrent && (
          <span className="ml-auto flex items-center gap-1 text-xs text-yellow-400">
            <Clock size={12} />
            진행 중
          </span>
        )}
        {!isCompleted && !isCurrent && (
          <span className="ml-auto flex items-center gap-1 text-xs text-gray-500">
            <AlertCircle size={12} />
            대기
          </span>
        )}
      </div>

      {/* Description */}
      <p className="text-xs text-gray-400 mb-3">{stageInfo.description}</p>

      {/* Episode */}
      <div className="text-xs text-gray-500 mb-2">
        {episodeName}
      </div>

      {/* Milestone Details */}
      {milestone && (
        <div className="border-t border-gray-700 pt-2 mt-2 space-y-1">
          {milestone.completedDate && (
            <div className="flex items-center justify-between text-xs">
              <span className="text-gray-500">완료일</span>
              <span className="text-green-400">
                {formatDate(milestone.completedDate, 'yyyy.MM.dd')}
              </span>
            </div>
          )}
          {milestone.note && (
            <div className="text-xs">
              <span className="text-gray-500 block mb-1">메모</span>
              <span className="text-gray-300 bg-gray-800 px-2 py-1 rounded block">
                {milestone.note}
              </span>
            </div>
          )}
        </div>
      )}

      {/* Progress indicator for current stage */}
      {isCurrent && (
        <div className="mt-3 pt-2 border-t border-gray-700">
          <div className="flex items-center gap-2">
            <div className="flex-1 h-1.5 bg-gray-700 rounded-full overflow-hidden">
              <motion.div
                className="h-full rounded-full"
                style={{ backgroundColor: stageInfo.color }}
                initial={{ width: '0%' }}
                animate={{ width: '60%' }}
                transition={{ duration: 1, ease: 'easeOut' }}
              />
            </div>
            <span className="text-xs text-gray-400">작업 중</span>
          </div>
        </div>
      )}
    </div>
  );
}

interface EpisodeRowProps {
  episode: Episode;
  projectColor: string;
}

function EpisodeRow({ episode, projectColor }: EpisodeRowProps) {
  const currentStageIndex = PIPELINE_STAGES.indexOf(episode.currentStage);

  return (
    <div className="py-3 border-b border-light-border dark:border-dark-border last:border-b-0">
      {/* Episode Info */}
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <div
            className="w-2 h-2 rounded-full"
            style={{ backgroundColor: projectColor }}
          />
          <span className="text-sm font-medium text-light-text dark:text-dark-text">
            {episode.name}
          </span>
        </div>
        <div className="flex items-center gap-2">
          <Badge
            variant={
              episode.progress >= 80
                ? 'success'
                : episode.progress >= 50
                ? 'warning'
                : 'default'
            }
            size="sm"
          >
            {formatDDay(episode.dueDate)}
          </Badge>
          <span className="text-xs font-medium text-light-text-secondary dark:text-dark-text-secondary">
            {episode.progress}%
          </span>
        </div>
      </div>

      {/* Pipeline Progress */}
      <div className="flex gap-0.5 relative">
        {PIPELINE_STAGES.map((stage, index) => {
          const stageInfo = PIPELINE_STAGE_INFO[stage];
          const milestone = episode.milestones.find((m) => m.stage === stage);
          const isCompleted = index < currentStageIndex;
          const isCurrent = index === currentStageIndex;

          return (
            <div key={stage} className="flex-1 group relative">
              {/* Stage Bar */}
              <div
                className={cn(
                  'h-6 rounded-sm transition-all duration-300 cursor-pointer',
                  'hover:ring-2 hover:ring-white/30 hover:z-10'
                )}
                style={{
                  backgroundColor: isCompleted
                    ? stageInfo.color
                    : isCurrent
                    ? stageInfo.color
                    : 'rgba(107, 114, 128, 0.3)',
                  opacity: isCompleted ? 1 : isCurrent ? 0.8 : 0.3,
                }}
              >
                {isCurrent && (
                  <motion.div
                    className="w-full h-full rounded-sm shimmer"
                    style={{ backgroundColor: stageInfo.color }}
                  />
                )}

                {/* Milestone Diamond Marker */}
                {milestone?.completedDate && (
                  <div className="absolute -top-1 left-1/2 -translate-x-1/2 z-10">
                    <div
                      className="w-2 h-2 rotate-45 border border-white/50"
                      style={{ backgroundColor: stageInfo.color }}
                    />
                  </div>
                )}
              </div>

              {/* Tooltip on Hover */}
              <div className={cn(
                'absolute bottom-full left-1/2 -translate-x-1/2 mb-2 z-50',
                'opacity-0 invisible group-hover:opacity-100 group-hover:visible',
                'transition-all duration-200 pointer-events-none'
              )}>
                <div className="bg-gray-900 rounded-lg shadow-xl border border-gray-700">
                  <MilestoneTooltip
                    stage={stage}
                    milestone={milestone}
                    isCompleted={isCompleted}
                    isCurrent={isCurrent}
                    episodeName={episode.name}
                  />
                </div>
                {/* Arrow */}
                <div className="absolute top-full left-1/2 -translate-x-1/2 -mt-1">
                  <div className="border-8 border-transparent border-t-gray-900" />
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Stage Labels */}
      <div className="flex mt-1">
        {PIPELINE_STAGES.map((stage, index) => {
          const isCurrent = index === currentStageIndex;
          return (
            <div
              key={stage}
              className={cn(
                'flex-1 text-center text-[9px] truncate',
                isCurrent
                  ? 'text-brand-primary font-medium'
                  : 'text-light-text-secondary dark:text-dark-text-secondary'
              )}
            >
              {isCurrent ? PIPELINE_STAGE_INFO[stage].label : ''}
            </div>
          );
        })}
      </div>
    </div>
  );
}

export function GanttWidget() {
  const { episodes, getProjectById } = useProjectStore();

  const sortedEpisodes = [...episodes].sort((a, b) => {
    // Sort by progress descending
    return b.progress - a.progress;
  });

  return (
    <Widget id="gantt" title="프로젝트 타임라인" icon={<GanttChart size={18} />}>
      <div className="space-y-0">
        {sortedEpisodes.map((episode) => {
          const project = getProjectById(episode.projectId);
          return (
            <EpisodeRow
              key={episode.id}
              episode={episode}
              projectColor={project?.color || '#6B7280'}
            />
          );
        })}
      </div>
    </Widget>
  );
}
