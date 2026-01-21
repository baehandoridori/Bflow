import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { ViewType } from '@/types';
import type { Layouts } from 'react-grid-layout';

interface AppState {
  // Theme & Settings
  theme: 'dark' | 'light';
  accentColor: string;
  calendarView: 'weekly' | 'monthly';
  showEpisodeDeadlines: boolean;

  // Current View
  currentView: ViewType;

  // Widget Layout (react-grid-layout)
  widgetLayout: Layouts | null;

  // Sidebar
  sidebarCollapsed: boolean;

  // Actions
  setTheme: (theme: 'dark' | 'light') => void;
  toggleTheme: () => void;
  setAccentColor: (color: string) => void;
  setCurrentView: (view: ViewType) => void;
  setCalendarView: (view: 'weekly' | 'monthly') => void;
  setShowEpisodeDeadlines: (show: boolean) => void;
  setWidgetLayout: (layout: Layouts) => void;
  toggleSidebar: () => void;
}

export const useAppStore = create<AppState>()(
  persist(
    (set) => ({
      // Initial state
      theme: 'dark',
      accentColor: '#F0E68C',
      calendarView: 'weekly',
      showEpisodeDeadlines: true,
      currentView: 'dashboard',
      widgetLayout: null, // Will use default from Dashboard component
      sidebarCollapsed: false,

      // Actions
      setTheme: (theme) => set({ theme }),
      toggleTheme: () =>
        set((state) => ({ theme: state.theme === 'dark' ? 'light' : 'dark' })),
      setAccentColor: (accentColor) => set({ accentColor }),
      setCurrentView: (currentView) => set({ currentView }),
      setCalendarView: (calendarView) => set({ calendarView }),
      setShowEpisodeDeadlines: (showEpisodeDeadlines) => set({ showEpisodeDeadlines }),
      setWidgetLayout: (widgetLayout) => set({ widgetLayout }),
      toggleSidebar: () =>
        set((state) => ({ sidebarCollapsed: !state.sidebarCollapsed })),
    }),
    {
      name: 'bflow-app-storage',
    }
  )
);
