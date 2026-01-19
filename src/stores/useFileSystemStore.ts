import { create } from 'zustand';
import {
  isFileSystemAccessSupported,
  requestDirectoryAccess,
  verifyPermission,
  readJsonFile,
  writeJsonFile,
  DATA_FILES,
} from '@/utils/fileSystem';
import { useDataStore } from './useDataStore';
import type { Project, Episode, Task, TeamMember, CalendarEvent } from '@/types';

interface FileSystemState {
  directoryHandle: FileSystemDirectoryHandle | null;
  isSupported: boolean;
  isConnected: boolean;
  isSyncing: boolean;
  lastSyncTime: string | null;
  error: string | null;

  // Actions
  checkSupport: () => void;
  connect: () => Promise<boolean>;
  disconnect: () => void;
  syncToFile: () => Promise<void>;
  syncFromFile: () => Promise<void>;
  clearError: () => void;
}

export const useFileSystemStore = create<FileSystemState>((set, get) => ({
  directoryHandle: null,
  isSupported: false,
  isConnected: false,
  isSyncing: false,
  lastSyncTime: null,
  error: null,

  checkSupport: () => {
    set({ isSupported: isFileSystemAccessSupported() });
  },

  connect: async () => {
    set({ error: null });

    try {
      const handle = await requestDirectoryAccess();
      if (!handle) {
        return false;
      }

      const hasPermission = await verifyPermission(handle);
      if (!hasPermission) {
        set({ error: '폴더 접근 권한이 거부되었습니다.' });
        return false;
      }

      set({
        directoryHandle: handle,
        isConnected: true,
      });

      // Try to load existing data from the folder
      await get().syncFromFile();

      return true;
    } catch (error) {
      set({ error: `연결 오류: ${(error as Error).message}` });
      return false;
    }
  },

  disconnect: () => {
    set({
      directoryHandle: null,
      isConnected: false,
      lastSyncTime: null,
    });
  },

  syncToFile: async () => {
    const { directoryHandle, isConnected } = get();

    if (!isConnected || !directoryHandle) {
      set({ error: '폴더에 연결되어 있지 않습니다.' });
      return;
    }

    set({ isSyncing: true, error: null });

    try {
      const hasPermission = await verifyPermission(directoryHandle);
      if (!hasPermission) {
        set({ error: '폴더 접근 권한이 거부되었습니다.', isConnected: false });
        return;
      }

      const dataStore = useDataStore.getState();

      // Write all data files
      await writeJsonFile(directoryHandle, DATA_FILES.projects, dataStore.projects);
      await writeJsonFile(directoryHandle, DATA_FILES.episodes, dataStore.episodes);
      await writeJsonFile(directoryHandle, DATA_FILES.tasks, dataStore.tasks);
      await writeJsonFile(directoryHandle, DATA_FILES.teamMembers, dataStore.teamMembers);
      await writeJsonFile(directoryHandle, DATA_FILES.calendarEvents, dataStore.calendarEvents);

      set({
        lastSyncTime: new Date().toISOString(),
        isSyncing: false,
      });
    } catch (error) {
      set({
        error: `저장 오류: ${(error as Error).message}`,
        isSyncing: false,
      });
    }
  },

  syncFromFile: async () => {
    const { directoryHandle, isConnected } = get();

    if (!isConnected || !directoryHandle) {
      set({ error: '폴더에 연결되어 있지 않습니다.' });
      return;
    }

    set({ isSyncing: true, error: null });

    try {
      const hasPermission = await verifyPermission(directoryHandle);
      if (!hasPermission) {
        set({ error: '폴더 접근 권한이 거부되었습니다.', isConnected: false });
        return;
      }

      // Read all data files
      const projects = await readJsonFile<Project[]>(directoryHandle, DATA_FILES.projects);
      const episodes = await readJsonFile<Episode[]>(directoryHandle, DATA_FILES.episodes);
      const tasks = await readJsonFile<Task[]>(directoryHandle, DATA_FILES.tasks);
      const teamMembers = await readJsonFile<TeamMember[]>(directoryHandle, DATA_FILES.teamMembers);
      const calendarEvents = await readJsonFile<CalendarEvent[]>(directoryHandle, DATA_FILES.calendarEvents);

      // Update data store if files exist
      if (projects) {
        useDataStore.setState({ projects });
      }
      if (episodes) {
        useDataStore.setState({ episodes });
      }
      if (tasks) {
        useDataStore.setState({ tasks });
      }
      if (teamMembers) {
        useDataStore.setState({ teamMembers });
      }
      if (calendarEvents) {
        useDataStore.setState({ calendarEvents });
      }

      set({
        lastSyncTime: new Date().toISOString(),
        isSyncing: false,
      });
    } catch (error) {
      set({
        error: `불러오기 오류: ${(error as Error).message}`,
        isSyncing: false,
      });
    }
  },

  clearError: () => {
    set({ error: null });
  },
}));
