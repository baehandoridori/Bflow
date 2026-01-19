import { GanttChart } from 'lucide-react';
import { motion } from 'framer-motion';
import { Widget } from './Widget';
import { Tooltip, Badge } from '@/components/ui';
import { useProjectStore } from '@/stores/useProjectStore';
import { PIPELINE_STAGES, PIPELINE_STAGE_INFO } from '@/constants/pipeline';
import { formatDDay } from '@/utils/date';
import { cn } from '@/utils/cn';
import type { Episode } from '@/types';

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
      <div className="flex gap-0.5">
        {PIPELINE_STAGES.map((stage, index) => {
          const stageInfo = PIPELINE_STAGE_INFO[stage];
          const milestone = episode.milestones.find((m) => m.stage === stage);
          const isCompleted = index < currentStageIndex;
          const isCurrent = index === currentStageIndex;

          return (
            <Tooltip
              key={stage}
              content={
                <div className="text-left">
                  <div className="font-medium">{stageInfo.label}</div>
                  <div className="text-xs text-gray-400">{stageInfo.description}</div>
                  {milestone?.note && (
                    <div className="text-xs text-gray-300 mt-1">{milestone.note}</div>
                  )}
                  {milestone?.completedDate && (
                    <div className="text-xs text-green-400 mt-1">
                      완료: {milestone.completedDate}
                    </div>
                  )}
                </div>
              }
              position="top"
            >
              <div
                className={cn(
                  'flex-1 h-6 rounded-sm transition-all duration-300 cursor-pointer',
                  'hover:opacity-80'
                )}
                style={{
                  backgroundColor: isCompleted
                    ? stageInfo.color
                    : isCurrent
                    ? stageInfo.color
                    : 'rgba(107, 114, 128, 0.3)',
                  opacity: isCompleted ? 1 : isCurrent ? 0.7 : 0.3,
                }}
              >
                {isCurrent && (
                  <motion.div
                    className="w-full h-full rounded-sm"
                    animate={{ opacity: [0.5, 1, 0.5] }}
                    transition={{ duration: 2, repeat: Infinity }}
                    style={{ backgroundColor: stageInfo.color }}
                  />
                )}
              </div>
            </Tooltip>
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
