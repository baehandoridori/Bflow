import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/Button';
import { useDataStore } from '@/stores/useDataStore';
import type { Task } from '@/types';
import { cn } from '@/utils/cn';

interface TaskFormProps {
  task?: Task;
  episodeId?: string;
  onSubmit: () => void;
  onCancel: () => void;
}

type TaskStatus = Task['status'];
type TaskPriority = NonNullable<Task['priority']>;

export function TaskForm({ task, episodeId, onSubmit, onCancel }: TaskFormProps) {
  const { episodes, teamMembers, addTask, updateTask } = useDataStore();

  const [formData, setFormData] = useState({
    title: '',
    episodeId: episodeId || '',
    assigneeId: '',
    dueDate: '',
    status: 'waiting' as TaskStatus,
    priority: 'medium' as TaskPriority,
    memo: '',
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (task) {
      setFormData({
        title: task.title,
        episodeId: task.episodeId,
        assigneeId: task.assigneeId || '',
        dueDate: task.dueDate || '',
        status: task.status,
        priority: task.priority || 'medium',
        memo: task.memo || '',
      });
    }
  }, [task]);

  const validate = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.title.trim()) {
      newErrors.title = '태스크 제목을 입력해주세요';
    }

    if (!formData.episodeId) {
      newErrors.episodeId = '에피소드를 선택해주세요';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!validate()) return;

    if (task) {
      // Update existing task
      updateTask(task.id, {
        title: formData.title,
        episodeId: formData.episodeId,
        assigneeId: formData.assigneeId || undefined,
        dueDate: formData.dueDate || undefined,
        status: formData.status,
        priority: formData.priority,
        memo: formData.memo || undefined,
      });
    } else {
      // Create new task
      addTask({
        title: formData.title,
        episodeId: formData.episodeId,
        assigneeId: formData.assigneeId || undefined,
        dueDate: formData.dueDate || undefined,
        status: formData.status,
        priority: formData.priority,
        memo: formData.memo || undefined,
      });
    }

    onSubmit();
  };

  const inputClassName = cn(
    'w-full px-3 py-2 rounded-lg text-sm',
    'bg-light-bg dark:bg-dark-bg',
    'border border-light-border dark:border-dark-border',
    'text-light-text dark:text-dark-text',
    'placeholder:text-light-text-secondary dark:placeholder:text-dark-text-secondary',
    'focus:outline-none focus:ring-2 focus:ring-brand-primary focus:border-transparent',
    'transition-colors'
  );

  const labelClassName = 'block text-sm font-medium text-light-text dark:text-dark-text mb-1.5';

  const statusOptions: { value: TaskStatus; label: string; color: string }[] = [
    { value: 'waiting', label: '대기', color: 'bg-gray-400' },
    { value: 'progress', label: '진행 중', color: 'bg-blue-500' },
    { value: 'review', label: '검토', color: 'bg-amber-500' },
    { value: 'done', label: '완료', color: 'bg-green-500' },
  ];

  const priorityOptions: { value: TaskPriority; label: string; color: string }[] = [
    { value: 'high', label: '높음', color: 'bg-red-500' },
    { value: 'medium', label: '보통', color: 'bg-amber-500' },
    { value: 'low', label: '낮음', color: 'bg-gray-400' },
  ];

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {/* Title */}
      <div>
        <label className={labelClassName}>
          태스크 제목 <span className="text-red-500">*</span>
        </label>
        <input
          type="text"
          value={formData.title}
          onChange={(e) => setFormData({ ...formData, title: e.target.value })}
          placeholder="예: ep.15 SC_001 애니메이션"
          className={cn(inputClassName, errors.title && 'border-red-500')}
        />
        {errors.title && (
          <p className="mt-1 text-xs text-red-500">{errors.title}</p>
        )}
      </div>

      {/* Episode */}
      <div>
        <label className={labelClassName}>
          에피소드 <span className="text-red-500">*</span>
        </label>
        <select
          value={formData.episodeId}
          onChange={(e) => setFormData({ ...formData, episodeId: e.target.value })}
          className={cn(inputClassName, errors.episodeId && 'border-red-500')}
        >
          <option value="">에피소드 선택</option>
          {episodes.map((ep) => (
            <option key={ep.id} value={ep.id}>
              {ep.name}
            </option>
          ))}
        </select>
        {errors.episodeId && (
          <p className="mt-1 text-xs text-red-500">{errors.episodeId}</p>
        )}
      </div>

      {/* Assignee */}
      <div>
        <label className={labelClassName}>담당자</label>
        <select
          value={formData.assigneeId}
          onChange={(e) => setFormData({ ...formData, assigneeId: e.target.value })}
          className={inputClassName}
        >
          <option value="">담당자 선택 (선택사항)</option>
          {teamMembers.map((member) => (
            <option key={member.id} value={member.id}>
              {member.name} ({member.role})
            </option>
          ))}
        </select>
      </div>

      {/* Due Date */}
      <div>
        <label className={labelClassName}>마감일</label>
        <input
          type="date"
          value={formData.dueDate}
          onChange={(e) => setFormData({ ...formData, dueDate: e.target.value })}
          className={inputClassName}
        />
      </div>

      {/* Status */}
      <div>
        <label className={labelClassName}>상태</label>
        <div className="flex gap-2">
          {statusOptions.map((option) => (
            <button
              key={option.value}
              type="button"
              onClick={() => setFormData({ ...formData, status: option.value })}
              className={cn(
                'flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm transition-all',
                formData.status === option.value
                  ? 'bg-brand-primary/20 text-brand-primary border border-brand-primary'
                  : 'bg-light-bg dark:bg-dark-bg border border-light-border dark:border-dark-border text-light-text-secondary dark:text-dark-text-secondary hover:border-light-text/30 dark:hover:border-dark-text/30'
              )}
            >
              <span className={cn('w-2 h-2 rounded-full', option.color)} />
              {option.label}
            </button>
          ))}
        </div>
      </div>

      {/* Priority */}
      <div>
        <label className={labelClassName}>우선순위</label>
        <div className="flex gap-2">
          {priorityOptions.map((option) => (
            <button
              key={option.value}
              type="button"
              onClick={() => setFormData({ ...formData, priority: option.value })}
              className={cn(
                'flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm transition-all',
                formData.priority === option.value
                  ? 'bg-brand-primary/20 text-brand-primary border border-brand-primary'
                  : 'bg-light-bg dark:bg-dark-bg border border-light-border dark:border-dark-border text-light-text-secondary dark:text-dark-text-secondary hover:border-light-text/30 dark:hover:border-dark-text/30'
              )}
            >
              <span className={cn('w-2 h-2 rounded-full', option.color)} />
              {option.label}
            </button>
          ))}
        </div>
      </div>

      {/* Memo */}
      <div>
        <label className={labelClassName}>메모</label>
        <textarea
          value={formData.memo}
          onChange={(e) => setFormData({ ...formData, memo: e.target.value })}
          placeholder="태스크에 대한 메모를 입력하세요..."
          rows={3}
          className={cn(inputClassName, 'resize-none')}
        />
      </div>

      {/* Buttons */}
      <div className="flex justify-end gap-2 pt-2">
        <Button type="button" variant="secondary" onClick={onCancel}>
          취소
        </Button>
        <Button type="submit" variant="primary">
          {task ? '수정' : '생성'}
        </Button>
      </div>
    </form>
  );
}
