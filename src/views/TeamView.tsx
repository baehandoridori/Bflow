import { useState } from 'react';
import { motion } from 'framer-motion';
import { Edit2 } from 'lucide-react';
import { Card, CardContent, Avatar, Badge } from '@/components/ui';
import { Modal } from '@/components/ui/Modal';
import { TaskForm } from '@/components/forms/TaskForm';
import { useDataStore } from '@/stores/useDataStore';
import { cn } from '@/utils/cn';
import type { Task } from '@/types';

const statusLabels: Record<string, string> = {
  working: '작업 중',
  review: '리뷰 중',
  done: '완료',
  waiting: '대기',
  absent: '부재',
};

const statusColors: Record<string, string> = {
  working: 'border-l-green-500',
  review: 'border-l-amber-500',
  done: 'border-l-indigo-500',
  waiting: 'border-l-gray-400',
  absent: 'border-l-red-500',
};

const statusBgColors: Record<string, string> = {
  working: 'bg-green-500/10',
  review: 'bg-amber-500/10',
  done: 'bg-indigo-500/10',
  waiting: 'bg-gray-500/10',
  absent: 'bg-red-500/10',
};

export function TeamView() {
  const { teamMembers, getTaskById } = useDataStore();
  const [editingTask, setEditingTask] = useState<Task | null>(null);

  // Group members by status
  const groupedMembers = teamMembers.reduce((acc, member) => {
    if (!acc[member.status]) acc[member.status] = [];
    acc[member.status].push(member);
    return acc;
  }, {} as Record<string, typeof teamMembers>);

  const statusOrder = ['working', 'review', 'done', 'waiting', 'absent'];

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.3 }}
      className="space-y-6"
    >
      {/* Status Summary */}
      <div className="grid grid-cols-5 gap-4">
        {statusOrder.map((status) => {
          const count = groupedMembers[status]?.length || 0;
          return (
            <Card
              key={status}
              className={cn('p-4', statusBgColors[status], 'border-l-4', statusColors[status])}
            >
              <div className="text-2xl font-bold text-light-text dark:text-dark-text">
                {count}
              </div>
              <div className="text-sm text-light-text-secondary dark:text-dark-text-secondary">
                {statusLabels[status]}
              </div>
            </Card>
          );
        })}
      </div>

      {/* Team Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {teamMembers
          .sort((a, b) => {
            const order = { working: 0, review: 1, done: 2, waiting: 3, absent: 4 };
            return order[a.status] - order[b.status];
          })
          .map((member, index) => {
            const task = member.currentTaskId
              ? getTaskById(member.currentTaskId)
              : null;

            return (
              <motion.div
                key={member.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, delay: index * 0.05 }}
              >
                <Card
                  className={cn(
                    'overflow-hidden border-l-4 transition-all duration-200',
                    'hover:shadow-lg dark:hover:shadow-black/20',
                    statusColors[member.status]
                  )}
                >
                  <CardContent className="p-4">
                    <div className="flex items-start gap-3">
                      <Avatar
                        name={member.name}
                        size="lg"
                        status={member.status}
                      />
                      <div className="flex-1 min-w-0">
                        <h3 className="font-semibold text-light-text dark:text-dark-text truncate">
                          {member.name}
                        </h3>
                        <p className="text-sm text-light-text-secondary dark:text-dark-text-secondary">
                          {member.role}
                        </p>
                        <Badge
                          variant={
                            member.status === 'working'
                              ? 'success'
                              : member.status === 'review'
                              ? 'warning'
                              : member.status === 'done'
                              ? 'info'
                              : member.status === 'absent'
                              ? 'danger'
                              : 'default'
                          }
                          size="sm"
                          className="mt-2"
                        >
                          {statusLabels[member.status]}
                        </Badge>
                      </div>
                    </div>

                    {task && (
                      <div
                        className="mt-3 p-2 rounded-lg bg-gray-50 dark:bg-dark-surface-hover cursor-pointer group transition-colors hover:bg-gray-100 dark:hover:bg-dark-bg"
                        onClick={() => setEditingTask(task)}
                      >
                        <div className="flex items-center justify-between">
                          <p className="text-xs text-light-text-secondary dark:text-dark-text-secondary">
                            현재 작업
                          </p>
                          <Edit2
                            size={12}
                            className="text-light-text-secondary dark:text-dark-text-secondary opacity-0 group-hover:opacity-100 transition-opacity"
                          />
                        </div>
                        <p className="text-sm font-medium text-light-text dark:text-dark-text truncate">
                          {task.title}
                        </p>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </motion.div>
            );
          })}
      </div>

      {/* Edit Task Modal */}
      <Modal
        isOpen={!!editingTask}
        onClose={() => setEditingTask(null)}
        title="태스크 수정"
        size="lg"
      >
        {editingTask && (
          <TaskForm
            task={editingTask}
            onSubmit={() => setEditingTask(null)}
            onCancel={() => setEditingTask(null)}
          />
        )}
      </Modal>
    </motion.div>
  );
}
