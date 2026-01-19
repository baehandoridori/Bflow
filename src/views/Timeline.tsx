import { motion } from 'framer-motion';
import { Card, CardHeader, CardContent, ProgressBar, Badge, Tooltip } from '@/components/ui';
import { useProjectStore } from '@/stores/useProjectStore';
import { PIPELINE_STAGES, PIPELINE_STAGE_INFO } from '@/constants/pipeline';
import { formatDate, formatDDay } from '@/utils/date';
import { cn } from '@/utils/cn';

export function Timeline() {
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
                <Tooltip key={stage} content={info.description}>
                  <div className="flex items-center gap-1.5 px-2 py-1 rounded-full bg-gray-50 dark:bg-dark-surface-hover">
                    <span
                      className="w-2 h-2 rounded-full"
                      style={{ backgroundColor: info.color }}
                    />
                    <span className="text-xs font-medium text-light-text dark:text-dark-text">
                      {info.label}
                    </span>
                  </div>
                </Tooltip>
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
                      style={{ backgroundColor: project?.color }}
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
                          <Tooltip
                            key={stage}
                            content={
                              <div>
                                <div className="font-medium">{info.label}</div>
                                {milestone?.note && (
                                  <div className="text-xs text-gray-300 mt-1">
                                    {milestone.note}
                                  </div>
                                )}
                                {milestone?.completedDate && (
                                  <div className="text-xs text-green-400 mt-1">
                                    {formatDate(milestone.completedDate)}
                                  </div>
                                )}
                              </div>
                            }
                          >
                            <div className="flex flex-col items-center">
                              <motion.div
                                className={cn(
                                  'w-8 h-8 rounded-full flex items-center justify-center',
                                  'border-2 transition-all duration-300 z-10',
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
                                {(isCompleted || isCurrent) && (
                                  <span className="text-xs font-bold text-white">
                                    {stageIndex + 1}
                                  </span>
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
                            </div>
                          </Tooltip>
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
    </motion.div>
  );
}
