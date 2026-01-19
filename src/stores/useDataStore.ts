import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { Task, Episode, TeamMember, Project, CalendarEvent } from '@/types';
import { sampleProjects, sampleEpisodes, sampleTeamMembers, sampleTasks } from '@/data/sampleData';

// Sample calendar events
const sampleCalendarEvents: CalendarEvent[] = [
  {
    id: 'event-1',
    title: '팀 미팅',
    type: 'meeting',
    startDate: '2025-01-20',
    endDate: '2025-01-20',
    color: '#3B82F6',
  },
  {
    id: 'event-2',
    title: 'ep.15 마감',
    type: 'deadline',
    startDate: '2025-02-15',
    endDate: '2025-02-15',
    color: '#EF4444',
    relatedEpisodeId: 'ep-15',
  },
  {
    id: 'event-3',
    title: '설 연휴',
    type: 'holiday',
    startDate: '2025-01-28',
    endDate: '2025-01-30',
    color: '#10B981',
  },
  {
    id: 'event-4',
    title: 'ep.16 마감',
    type: 'deadline',
    startDate: '2025-02-28',
    endDate: '2025-02-28',
    color: '#EF4444',
    relatedEpisodeId: 'ep-16',
  },
];

interface DataState {
  // Data
  projects: Project[];
  episodes: Episode[];
  teamMembers: TeamMember[];
  tasks: Task[];
  calendarEvents: CalendarEvent[];

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

  // Calendar Event CRUD
  addCalendarEvent: (event: Omit<CalendarEvent, 'id'>) => CalendarEvent;
  updateCalendarEvent: (id: string, updates: Partial<Omit<CalendarEvent, 'id'>>) => void;
  deleteCalendarEvent: (id: string) => void;
  getCalendarEventById: (id: string) => CalendarEvent | undefined;
  getCalendarEventsByDateRange: (start: Date, end: Date) => CalendarEvent[];

  // Team Member actions
  updateTeamMember: (id: string, updates: Partial<Omit<TeamMember, 'id'>>) => void;
  getTeamMemberById: (id: string) => TeamMember | undefined;

  // Project helpers
  getProjectById: (id: string) => Project | undefined;

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
      calendarEvents: sampleCalendarEvents,

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

      // Calendar Event CRUD
      addCalendarEvent: (eventData) => {
        const newEvent: CalendarEvent = {
          ...eventData,
          id: generateId('event'),
        };

        set((state) => ({
          calendarEvents: [...state.calendarEvents, newEvent],
        }));

        return newEvent;
      },

      updateCalendarEvent: (id, updates) => {
        set((state) => ({
          calendarEvents: state.calendarEvents.map((event) =>
            event.id === id ? { ...event, ...updates } : event
          ),
        }));
      },

      deleteCalendarEvent: (id) => {
        set((state) => ({
          calendarEvents: state.calendarEvents.filter((event) => event.id !== id),
        }));
      },

      getCalendarEventById: (id) => get().calendarEvents.find((event) => event.id === id),

      getCalendarEventsByDateRange: (start, end) => {
        const startTime = start.getTime();
        const endTime = end.getTime();
        return get().calendarEvents.filter((event) => {
          const eventStart = new Date(event.startDate).getTime();
          const eventEnd = new Date(event.endDate).getTime();
          return eventStart <= endTime && eventEnd >= startTime;
        });
      },

      // Project helpers
      getProjectById: (id) => get().projects.find((proj) => proj.id === id),

      // Reset data
      resetData: () => {
        set({
          projects: sampleProjects,
          episodes: sampleEpisodes,
          teamMembers: sampleTeamMembers,
          tasks: sampleTasks,
          calendarEvents: sampleCalendarEvents,
        });
      },
    }),
    {
      name: 'bflow-data-storage',
    }
  )
);
