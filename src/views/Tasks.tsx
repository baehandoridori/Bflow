import { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, Search, Filter, SortAsc, ListFilter } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Modal } from '@/components/ui/Modal';
import { TaskCard } from '@/components/tasks/TaskCard';
import { TaskForm } from '@/components/forms/TaskForm';
import { useDataStore } from '@/stores/useDataStore';
import { cn } from '@/utils/cn';
import type { Task } from '@/types';

type FilterStatus = 'all' | Task['status'];
type SortOption = 'dueDate' | 'priority' | 'status' | 'title';

export default function Tasks() {
  const { tasks, episodes, deleteTask } = useDataStore();

  // Modal states
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [deleteConfirmTask, setDeleteConfirmTask] = useState<Task | null>(null);

  // Filter & Sort states
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState<FilterStatus>('all');
  const [filterEpisode, setFilterEpisode] = useState<string>('all');
  const [sortBy, setSortBy] = useState<SortOption>('dueDate');
  const [showFilters, setShowFilters] = useState(false);

  // Filter and sort tasks
  const filteredTasks = useMemo(() => {
    let result = [...tasks];

    // Search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      result = result.filter(
        (task) =>
          task.title.toLowerCase().includes(query) ||
          task.memo?.toLowerCase().includes(query)
      );
    }

    // Status filter
    if (filterStatus !== 'all') {
      result = result.filter((task) => task.status === filterStatus);
    }

    // Episode filter
    if (filterEpisode !== 'all') {
      result = result.filter((task) => task.episodeId === filterEpisode);
    }

    // Sort
    result.sort((a, b) => {
      switch (sortBy) {
        case 'dueDate':
          if (!a.dueDate && !b.dueDate) return 0;
          if (!a.dueDate) return 1;
          if (!b.dueDate) return -1;
          return new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime();
        case 'priority': {
          const priorityOrder = { high: 0, medium: 1, low: 2 };
          const aPriority = a.priority ? priorityOrder[a.priority] : 3;
          const bPriority = b.priority ? priorityOrder[b.priority] : 3;
          return aPriority - bPriority;
        }
        case 'status': {
          const statusOrder = { progress: 0, review: 1, waiting: 2, done: 3 };
          return statusOrder[a.status] - statusOrder[b.status];
        }
        case 'title':
          return a.title.localeCompare(b.title);
        default:
          return 0;
      }
    });

    return result;
  }, [tasks, searchQuery, filterStatus, filterEpisode, sortBy]);

  const handleEdit = (task: Task) => {
    setEditingTask(task);
    setIsFormOpen(true);
  };

  const handleDelete = (task: Task) => {
    setDeleteConfirmTask(task);
  };

  const confirmDelete = () => {
    if (deleteConfirmTask) {
      deleteTask(deleteConfirmTask.id);
      setDeleteConfirmTask(null);
    }
  };

  const handleFormClose = () => {
    setIsFormOpen(false);
    setEditingTask(null);
  };

  const statusOptions: { value: FilterStatus; label: string }[] = [
    { value: 'all', label: '전체' },
    { value: 'waiting', label: '대기' },
    { value: 'progress', label: '진행 중' },
    { value: 'review', label: '검토' },
    { value: 'done', label: '완료' },
  ];

  const sortOptions: { value: SortOption; label: string }[] = [
    { value: 'dueDate', label: '마감일순' },
    { value: 'priority', label: '우선순위순' },
    { value: 'status', label: '상태순' },
    { value: 'title', label: '이름순' },
  ];

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-light-text dark:text-dark-text">
            태스크 관리
          </h1>
          <p className="text-sm text-light-text-secondary dark:text-dark-text-secondary mt-1">
            총 {filteredTasks.length}개의 태스크
          </p>
        </div>

        <Button onClick={() => setIsFormOpen(true)}>
          <Plus size={18} />
          새 태스크
        </Button>
      </div>

      {/* Search & Filters */}
      <Card className="p-4">
        <div className="flex flex-col gap-4">
          {/* Search Bar */}
          <div className="flex items-center gap-3">
            <div className="relative flex-1">
              <Search
                size={18}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-light-text-secondary dark:text-dark-text-secondary"
              />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="태스크 검색..."
                className={cn(
                  'w-full pl-10 pr-4 py-2.5 rounded-lg text-sm',
                  'bg-light-bg dark:bg-dark-bg',
                  'border border-light-border dark:border-dark-border',
                  'text-light-text dark:text-dark-text',
                  'placeholder:text-light-text-secondary dark:placeholder:text-dark-text-secondary',
                  'focus:outline-none focus:ring-2 focus:ring-brand-primary focus:border-transparent'
                )}
              />
            </div>

            <Button
              variant={showFilters ? 'primary' : 'secondary'}
              onClick={() => setShowFilters(!showFilters)}
            >
              <Filter size={18} />
              필터
            </Button>
          </div>

          {/* Filter Options */}
          <AnimatePresence>
            {showFilters && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                className="overflow-hidden"
              >
                <div className="flex flex-wrap gap-4 pt-4 border-t border-light-border dark:border-dark-border">
                  {/* Status Filter */}
                  <div className="flex items-center gap-2">
                    <ListFilter size={16} className="text-light-text-secondary dark:text-dark-text-secondary" />
                    <span className="text-sm text-light-text-secondary dark:text-dark-text-secondary">
                      상태:
                    </span>
                    <select
                      value={filterStatus}
                      onChange={(e) => setFilterStatus(e.target.value as FilterStatus)}
                      className={cn(
                        'px-3 py-1.5 rounded-lg text-sm',
                        'bg-light-bg dark:bg-dark-bg',
                        'border border-light-border dark:border-dark-border',
                        'text-light-text dark:text-dark-text'
                      )}
                    >
                      {statusOptions.map((option) => (
                        <option key={option.value} value={option.value}>
                          {option.label}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Episode Filter */}
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-light-text-secondary dark:text-dark-text-secondary">
                      에피소드:
                    </span>
                    <select
                      value={filterEpisode}
                      onChange={(e) => setFilterEpisode(e.target.value)}
                      className={cn(
                        'px-3 py-1.5 rounded-lg text-sm',
                        'bg-light-bg dark:bg-dark-bg',
                        'border border-light-border dark:border-dark-border',
                        'text-light-text dark:text-dark-text'
                      )}
                    >
                      <option value="all">전체</option>
                      {episodes.map((ep) => (
                        <option key={ep.id} value={ep.id}>
                          {ep.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Sort */}
                  <div className="flex items-center gap-2">
                    <SortAsc size={16} className="text-light-text-secondary dark:text-dark-text-secondary" />
                    <span className="text-sm text-light-text-secondary dark:text-dark-text-secondary">
                      정렬:
                    </span>
                    <select
                      value={sortBy}
                      onChange={(e) => setSortBy(e.target.value as SortOption)}
                      className={cn(
                        'px-3 py-1.5 rounded-lg text-sm',
                        'bg-light-bg dark:bg-dark-bg',
                        'border border-light-border dark:border-dark-border',
                        'text-light-text dark:text-dark-text'
                      )}
                    >
                      {sortOptions.map((option) => (
                        <option key={option.value} value={option.value}>
                          {option.label}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </Card>

      {/* Task Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        <AnimatePresence mode="popLayout">
          {filteredTasks.map((task) => (
            <TaskCard
              key={task.id}
              task={task}
              onEdit={handleEdit}
              onDelete={handleDelete}
            />
          ))}
        </AnimatePresence>
      </div>

      {/* Empty State */}
      {filteredTasks.length === 0 && (
        <div className="text-center py-12">
          <p className="text-light-text-secondary dark:text-dark-text-secondary">
            {searchQuery || filterStatus !== 'all' || filterEpisode !== 'all'
              ? '검색 결과가 없습니다.'
              : '태스크가 없습니다. 새 태스크를 추가해보세요.'}
          </p>
        </div>
      )}

      {/* Create/Edit Modal */}
      <Modal
        isOpen={isFormOpen}
        onClose={handleFormClose}
        title={editingTask ? '태스크 수정' : '새 태스크'}
        size="lg"
      >
        <TaskForm
          task={editingTask || undefined}
          onSubmit={handleFormClose}
          onCancel={handleFormClose}
        />
      </Modal>

      {/* Delete Confirmation Modal */}
      <Modal
        isOpen={!!deleteConfirmTask}
        onClose={() => setDeleteConfirmTask(null)}
        title="태스크 삭제"
        size="sm"
      >
        <div className="space-y-4">
          <p className="text-sm text-light-text dark:text-dark-text">
            정말로 <span className="font-semibold">"{deleteConfirmTask?.title}"</span> 태스크를 삭제하시겠습니까?
          </p>
          <p className="text-xs text-light-text-secondary dark:text-dark-text-secondary">
            이 작업은 되돌릴 수 없습니다.
          </p>
          <div className="flex justify-end gap-2 pt-2">
            <Button variant="secondary" onClick={() => setDeleteConfirmTask(null)}>
              취소
            </Button>
            <Button variant="danger" onClick={confirmDelete}>
              삭제
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
