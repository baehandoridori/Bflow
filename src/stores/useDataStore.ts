import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { Task, Episode, TeamMember, Project } from '@/types';
import { sampleProjects, sampleEpisodes, sampleTeamMembers, sampleTasks } from '@/data/sampleData';

interface DataState {
  // Data
  projects: Project[];
  episodes: Episode[];
  teamMembers: TeamMember[];
  tasks: Task[];

  // Task CRUD
  addTask: (task: Omit<Task, 'id' | 'createdAt' | 'updatedAt'>) => Task;
  updateTask: (id: string, updates: Partial<Omit<Task, 'id' | 'createdAt'>>) => void;
  deleteTask: (id: string) => void;
  getTaskById: (id: string) => Task | undefined;
  getTasksByEpisode: (episodeId: string) => Task[];
  getTasksByAssignee: (assigneeId: string) => Task[];

  // Episode CRUD
  addEpisode: (episode: Omit<Episode, 'id' | 'taskIds'>) => Episode;
  updateEpisode: (id: string, updates: Partial<Omit<Episode, 'id'>>) => void;
  deleteEpisode: (id: string) => void;
  getEpisodeById: (id: string) => Episode | undefined;

  // Team Member actions
  updateTeamMember: (id: string, updates: Partial<Omit<TeamMember, 'id'>>) => void;
  getTeamMemberById: (id: string) => TeamMember | undefined;

  // Reset to sample data
  resetData: () => void;
}

const generateId = (prefix: string) => `${prefix}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

export const useDataStore = create<DataState>()(
  persist(
    (set, get) => ({
      // Initial data from samples
      projects: sampleProjects,
      episodes: sampleEpisodes,
      teamMembers: sampleTeamMembers,
      tasks: sampleTasks,

      // Task CRUD
      addTask: (taskData) => {
        const now = new Date().toISOString();
        const newTask: Task = {
          ...taskData,
          id: generateId('task'),
          createdAt: now,
          updatedAt: now,
        };

        set((state) => {
          // Also update episode's taskIds
          const updatedEpisodes = state.episodes.map((ep) =>
            ep.id === taskData.episodeId
              ? { ...ep, taskIds: [...ep.taskIds, newTask.id] }
              : ep
          );

          return {
            tasks: [...state.tasks, newTask],
            episodes: updatedEpisodes,
          };
        });

        return newTask;
      },

      updateTask: (id, updates) => {
        set((state) => ({
          tasks: state.tasks.map((task) =>
            task.id === id
              ? { ...task, ...updates, updatedAt: new Date().toISOString() }
              : task
          ),
        }));
      },

      deleteTask: (id) => {
        set((state) => {
          const task = state.tasks.find((t) => t.id === id);
          if (!task) return state;

          // Remove from episode's taskIds
          const updatedEpisodes = state.episodes.map((ep) =>
            ep.id === task.episodeId
              ? { ...ep, taskIds: ep.taskIds.filter((tid) => tid !== id) }
              : ep
          );

          // Clear team member's currentTaskId if assigned
          const updatedTeamMembers = state.teamMembers.map((tm) =>
            tm.currentTaskId === id ? { ...tm, currentTaskId: undefined } : tm
          );

          return {
            tasks: state.tasks.filter((t) => t.id !== id),
            episodes: updatedEpisodes,
            teamMembers: updatedTeamMembers,
          };
        });
      },

      getTaskById: (id) => get().tasks.find((t) => t.id === id),

      getTasksByEpisode: (episodeId) =>
        get().tasks.filter((t) => t.episodeId === episodeId),

      getTasksByAssignee: (assigneeId) =>
        get().tasks.filter((t) => t.assigneeId === assigneeId),

      // Episode CRUD
      addEpisode: (episodeData) => {
        const newEpisode: Episode = {
          ...episodeData,
          id: generateId('ep'),
          taskIds: [],
        };

        set((state) => {
          // Also update project's episodeIds
          const updatedProjects = state.projects.map((proj) =>
            proj.id === episodeData.projectId
              ? { ...proj, episodeIds: [...proj.episodeIds, newEpisode.id] }
              : proj
          );

          return {
            episodes: [...state.episodes, newEpisode],
            projects: updatedProjects,
          };
        });

        return newEpisode;
      },

      updateEpisode: (id, updates) => {
        set((state) => ({
          episodes: state.episodes.map((ep) =>
            ep.id === id ? { ...ep, ...updates } : ep
          ),
        }));
      },

      deleteEpisode: (id) => {
        set((state) => {
          const episode = state.episodes.find((ep) => ep.id === id);
          if (!episode) return state;

          // Remove episode's tasks
          const taskIdsToDelete = episode.taskIds;
          const updatedTasks = state.tasks.filter(
            (t) => !taskIdsToDelete.includes(t.id)
          );

          // Clear team member's currentTaskId if any tasks are deleted
          const updatedTeamMembers = state.teamMembers.map((tm) =>
            tm.currentTaskId && taskIdsToDelete.includes(tm.currentTaskId)
              ? { ...tm, currentTaskId: undefined }
              : tm
          );

          // Remove from project's episodeIds
          const updatedProjects = state.projects.map((proj) =>
            proj.id === episode.projectId
              ? { ...proj, episodeIds: proj.episodeIds.filter((eid) => eid !== id) }
              : proj
          );

          return {
            episodes: state.episodes.filter((ep) => ep.id !== id),
            tasks: updatedTasks,
            teamMembers: updatedTeamMembers,
            projects: updatedProjects,
          };
        });
      },

      getEpisodeById: (id) => get().episodes.find((ep) => ep.id === id),

      // Team Member actions
      updateTeamMember: (id, updates) => {
        set((state) => ({
          teamMembers: state.teamMembers.map((tm) =>
            tm.id === id ? { ...tm, ...updates } : tm
          ),
        }));
      },

      getTeamMemberById: (id) => get().teamMembers.find((tm) => tm.id === id),

      // Reset data
      resetData: () => {
        set({
          projects: sampleProjects,
          episodes: sampleEpisodes,
          teamMembers: sampleTeamMembers,
          tasks: sampleTasks,
        });
      },
    }),
    {
      name: 'bflow-data-storage',
    }
  )
);
