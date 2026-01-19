import { create } from 'zustand';
import type { Task } from '@/types';
import { sampleTasks } from '@/data/sampleData';

interface TaskState {
  tasks: Task[];

  // Actions
  setTasks: (tasks: Task[]) => void;
  getTaskById: (id: string) => Task | undefined;
  getTasksByEpisodeId: (episodeId: string) => Task[];
  getTasksByAssigneeId: (assigneeId: string) => Task[];
  getTasksByStatus: (status: Task['status']) => Task[];
  updateTaskStatus: (id: string, status: Task['status']) => void;
  addTask: (task: Task) => void;
  updateTask: (id: string, updates: Partial<Task>) => void;
  deleteTask: (id: string) => void;
}

export const useTaskStore = create<TaskState>((set, get) => ({
  tasks: sampleTasks,

  setTasks: (tasks) => set({ tasks }),

  getTaskById: (id) => get().tasks.find((t) => t.id === id),

  getTasksByEpisodeId: (episodeId) =>
    get().tasks.filter((t) => t.episodeId === episodeId),

  getTasksByAssigneeId: (assigneeId) =>
    get().tasks.filter((t) => t.assigneeId === assigneeId),

  getTasksByStatus: (status) => get().tasks.filter((t) => t.status === status),

  updateTaskStatus: (id, status) =>
    set((state) => ({
      tasks: state.tasks.map((t) =>
        t.id === id ? { ...t, status, updatedAt: new Date().toISOString() } : t
      ),
    })),

  addTask: (task) =>
    set((state) => ({
      tasks: [...state.tasks, task],
    })),

  updateTask: (id, updates) =>
    set((state) => ({
      tasks: state.tasks.map((t) =>
        t.id === id ? { ...t, ...updates, updatedAt: new Date().toISOString() } : t
      ),
    })),

  deleteTask: (id) =>
    set((state) => ({
      tasks: state.tasks.filter((t) => t.id !== id),
    })),
}));
