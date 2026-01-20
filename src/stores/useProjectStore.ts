import { create } from 'zustand';
import type { Project, Episode } from '@/types';
import { sampleProjects, sampleEpisodes } from '@/data/sampleData';

interface ProjectState {
  projects: Project[];
  episodes: Episode[];
  selectedProjectId: string | null;
  selectedEpisodeId: string | null;

  // Actions
  setProjects: (projects: Project[]) => void;
  setEpisodes: (episodes: Episode[]) => void;
  selectProject: (id: string | null) => void;
  selectEpisode: (id: string | null) => void;
  getProjectById: (id: string) => Project | undefined;
  getEpisodeById: (id: string) => Episode | undefined;
  getEpisodesByProjectId: (projectId: string) => Episode[];
  updateEpisode: (id: string, updates: Partial<Episode>) => void;
}

export const useProjectStore = create<ProjectState>((set, get) => ({
  projects: sampleProjects,
  episodes: sampleEpisodes,
  selectedProjectId: null,
  selectedEpisodeId: null,

  setProjects: (projects) => set({ projects }),
  setEpisodes: (episodes) => set({ episodes }),
  selectProject: (id) => set({ selectedProjectId: id }),
  selectEpisode: (id) => set({ selectedEpisodeId: id }),

  getProjectById: (id) => get().projects.find((p) => p.id === id),
  getEpisodeById: (id) => get().episodes.find((e) => e.id === id),
  getEpisodesByProjectId: (projectId) =>
    get().episodes.filter((e) => e.projectId === projectId),
  updateEpisode: (id, updates) =>
    set((state) => ({
      episodes: state.episodes.map((ep) =>
        ep.id === id ? { ...ep, ...updates } : ep
      ),
    })),
}));
