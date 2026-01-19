import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { ViewType, WidgetSize } from '@/types';

interface AppState {
  // Theme & Settings
  theme: 'dark' | 'light';
  accentColor: string;
  calendarView: 'weekly' | 'monthly';

  // Current View
  currentView: ViewType;

  // Widget Layout
  widgetLayout: Record<string, WidgetSize>;

  // Sidebar
  sidebarCollapsed: boolean;

  // Actions
  setTheme: (theme: 'dark' | 'light') => void;
  toggleTheme: () => void;
  setAccentColor: (color: string) => void;
  setCurrentView: (view: ViewType) => void;
  setCalendarView: (view: 'weekly' | 'monthly') => void;
  setWidgetSize: (widgetId: string, size: WidgetSize) => void;
  toggleSidebar: () => void;
}

export const useAppStore = create<AppState>()(
  persist(
    (set) => ({
      // Initial state
      theme: 'dark',
      accentColor: '#F0E68C',
      calendarView: 'weekly',
      currentView: 'dashboard',
      widgetLayout: {
        summary: { w: 2, h: 1 },
        gantt: { w: 4, h: 2 },
        team: { w: 2, h: 2 },
        tasks: { w: 2, h: 2 },
        calendar: { w: 2, h: 2 },
      },
      sidebarCollapsed: false,

      // Actions
      setTheme: (theme) => set({ theme }),
      toggleTheme: () =>
        set((state) => ({ theme: state.theme === 'dark' ? 'light' : 'dark' })),
      setAccentColor: (accentColor) => set({ accentColor }),
      setCurrentView: (currentView) => set({ currentView }),
      setCalendarView: (calendarView) => set({ calendarView }),
      setWidgetSize: (widgetId, size) =>
        set((state) => ({
          widgetLayout: { ...state.widgetLayout, [widgetId]: size },
        })),
      toggleSidebar: () =>
        set((state) => ({ sidebarCollapsed: !state.sidebarCollapsed })),
    }),
    {
      name: 'bflow-app-storage',
    }
  )
);
