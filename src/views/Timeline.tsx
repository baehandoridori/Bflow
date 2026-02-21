import { useState } from 'react';
import { motion } from 'framer-motion';
import { Check, Clock, AlertCircle, LayoutGrid, Calendar } from 'lucide-react';
import { Card, CardHeader, CardContent, ProgressBar, Badge } from '@/components/ui';
import { GanttChart } from '@/components/gantt';
import { useProjectStore } from '@/stores/useProjectStore';
import { PIPELINE_STAGES, PIPELINE_STAGE_INFO } from '@/constants/pipeline';
import { formatDate, formatDDay } from '@/utils/date';
import { cn } from '@/utils/cn';
import type { Milestone, PipelineStage } from '@/types';

interface MilestoneTooltipProps {
  stage: PipelineStage;
  milestone?: Milestone;
  isCompleted: boolean;
  isCurrent: boolean;
}

function MilestoneTooltip({
  stage,
  milestone,
  isCompleted,
  isCurrent,
}: MilestoneTooltipProps) {
  const stageInfo = PIPELINE_STAGE_INFO[stage];

  return (
    <div className="w-56 p-3 text-left bg-gray-900 rounded-lg shadow-xl border border-gray-700">
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
      <p className="text-xs text-gray-400 mb-2">{stageInfo.description}</p>

      {/* Milestone Details */}
      {milestone && (milestone.completedDate || milestone.note) && (
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

type ViewMode = 'gantt' | 'pipeline';

export function Timeline() {
  const [viewMode, setViewMode] = useState<ViewMode>('gantt');
  const { episodes, getProjectById } = useProjectStore();

  const sortedEpisodes = [...episodes].sort((a, b) => {
    return new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime();
  });

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.3 }}
      className="space-y-6"
    >
      {/* 뷰 전환 탭 */}
      <div className="flex items-center gap-2">
        <button
          onClick={() => setViewMode('gantt')}
          className={cn(
            'flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors',
            viewMode === 'gantt'
              ? 'bg-brand-primary text-dark-bg'
              : 'bg-light-surface dark:bg-dark-surface text-light-text-secondary dark:text-dark-text-secondary hover:bg-gray-100 dark:hover:bg-gray-800'
          )}
        >
          <Calendar size={16} />
          간트 차트
        </button>
        <button
          onClick={() => setViewMode('pipeline')}
          className={cn(
            'flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors',
            viewMode === 'pipeline'
              ? 'bg-brand-primary text-dark-bg'
              : 'bg-light-surface dark:bg-dark-surface text-light-text-secondary dark:text-dark-text-secondary hover:bg-gray-100 dark:hover:bg-gray-800'
          )}
        >
          <LayoutGrid size={16} />
          파이프라인
        </button>
      </div>

      {/* 간트 차트 뷰 */}
      {viewMode === 'gantt' && (
        <div className="h-[calc(100vh-220px)]">
          <GanttChart />
        </div>
      )}

      {/* 파이프라인 뷰 */}
      {viewMode === 'pipeline' && (
        <>
          {/* Pipeline Legend */}
          <Card>
        <CardContent className="p-4">
          <h3 className="text-sm font-medium text-light-text-secondary dark:text-dark-text-secondary mb-3">
            파이프라인 단계
          </h3>
          <div className="flex flex-wrap gap-2">
            {PIPELINE_STAGES.map((stage) => {
              const info = PIPELINE_STAGE_INFO[stage];
              return (
                <div
                  key={stage}
                  className="group relative flex items-center gap-1.5 px-2 py-1 rounded-full bg-gray-50 dark:bg-dark-surface-hover cursor-pointer"
                >
                  <span
                    className="w-2 h-2 rounded-full"
                    style={{ backgroundColor: info.color }}
                  />
                  <span className="text-xs font-medium text-light-text dark:text-dark-text">
                    {info.label}
                  </span>

                  {/* Tooltip */}
                  <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-50">
                    <div className="bg-gray-900 text-white text-xs px-3 py-2 rounded-lg shadow-lg whitespace-nowrap">
                      {info.description}
                    </div>
                    <div className="absolute top-full left-1/2 -translate-x-1/2 -mt-1">
                      <div className="border-4 border-transparent border-t-gray-900" />
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Episodes */}
      <div className="space-y-4">
        {sortedEpisodes.map((episode, index) => {
          const project = getProjectById(episode.projectId);
          const currentStageIndex = PIPELINE_STAGES.indexOf(episode.currentStage);

          return (
            <motion.div
              key={episode.id}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.3, delay: index * 0.1 }}
            >
              <Card className="overflow-hidden">
                <CardHeader className="flex flex-row items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div
                      className="w-3 h-3 rounded-full"
                      style={{ backgroundColor: project?.color || '#6B7280' }}
                    />
                    <div>
                      <h3 className="font-semibold text-light-text dark:text-dark-text">
                        {episode.name}
                      </h3>
                      <p className="text-sm text-light-text-secondary dark:text-dark-text-secondary">
                        {project?.name}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <Badge
                      variant={
                        episode.progress >= 80
                          ? 'success'
                          : episode.progress >= 50
                          ? 'warning'
                          : 'default'
                      }
                    >
                      {formatDDay(episode.dueDate)}
                    </Badge>
                    <span className="text-sm text-light-text-secondary dark:text-dark-text-secondary">
                      마감: {formatDate(episode.dueDate)}
                    </span>
                  </div>
                </CardHeader>
                <CardContent>
                  {/* Progress */}
                  <div className="mb-4">
                    <ProgressBar
                      value={episode.progress}
                      size="md"
                      showLabel
                      color={project?.color}
                      shimmer={episode.progress < 100}
                    />
                  </div>

                  {/* Pipeline Timeline */}
                  <div className="relative">
                    {/* Connection Line */}
                    <div className="absolute top-4 left-4 right-4 h-0.5 bg-gray-200 dark:bg-gray-700" />

                    {/* Stages */}
                    <div className="relative flex justify-between">
                      {PIPELINE_STAGES.map((stage, stageIndex) => {
                        const info = PIPELINE_STAGE_INFO[stage];
                        const milestone = episode.milestones.find((m) => m.stage === stage);
                        const isCompleted = stageIndex < currentStageIndex;
                        const isCurrent = stageIndex === currentStageIndex;

                        return (
                          <div key={stage} className="flex flex-col items-center group relative">
                            <motion.div
                              className={cn(
                                'w-8 h-8 rounded-full flex items-center justify-center',
                                'border-2 transition-all duration-300 z-10 cursor-pointer',
                                isCompleted
                                  ? 'border-transparent'
                                  : isCurrent
                                  ? 'border-transparent'
                                  : 'border-gray-300 dark:border-gray-600 bg-light-surface dark:bg-dark-surface'
                              )}
                              style={{
                                backgroundColor: isCompleted || isCurrent ? info.color : undefined,
                              }}
                              animate={
                                isCurrent
                                  ? { scale: [1, 1.1, 1] }
                                  : {}
                              }
                              transition={
                                isCurrent
                                  ? { duration: 2, repeat: Infinity }
                                  : {}
                              }
                            >
                              {isCompleted && (
                                <Check size={14} className="text-white" />
                              )}
                              {isCurrent && (
                                <Clock size={14} className="text-white" />
                              )}
                            </motion.div>
                            <span
                              className={cn(
                                'mt-2 text-xs font-medium text-center',
                                isCurrent
                                  ? 'text-brand-primary'
                                  : isCompleted
                                  ? 'text-light-text dark:text-dark-text'
                                  : 'text-light-text-secondary dark:text-dark-text-secondary'
                              )}
                            >
                              {info.label}
                            </span>

                            {/* Tooltip on Hover */}
                            <div className={cn(
                              'absolute bottom-full left-1/2 -translate-x-1/2 mb-10 z-50',
                              'opacity-0 invisible group-hover:opacity-100 group-hover:visible',
                              'transition-all duration-200 pointer-events-none'
                            )}>
                              <MilestoneTooltip
                                stage={stage}
                                milestone={milestone}
                                isCompleted={isCompleted}
                                isCurrent={isCurrent}
                              />
                              <div className="absolute top-full left-1/2 -translate-x-1/2 -mt-1">
                                <div className="border-8 border-transparent border-t-gray-900" />
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          );
        })}
      </div>
        </>
      )}
    </motion.div>
  );
}
