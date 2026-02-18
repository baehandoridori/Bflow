import { Moon, Sun, Bell, Search } from 'lucide-react';
import { useAppStore } from '@/stores/useAppStore';
import { cn } from '@/utils/cn';
import { Button } from '@/components/ui';

const viewTitles: Record<string, string> = {
  dashboard: '대시보드',
  timeline: '타임라인',
  calendar: '캘린더',
  team: '팀 현황',
  nodemap: '노드맵',
};

export function Header() {
  const { currentView, theme, toggleTheme, sidebarCollapsed } = useAppStore();

  return (
    <header
      className={cn(
        'fixed top-0 right-0 h-16 z-30',
        'bg-light-surface/80 dark:bg-dark-surface/80 backdrop-blur-md',
        'border-b border-light-border dark:border-dark-border',
        'flex items-center justify-between px-6',
        'transition-all duration-200',
        sidebarCollapsed ? 'left-16' : 'left-60'
      )}
    >
      {/* Title */}
      <div className="flex items-center gap-4">
        <h1 className="text-xl font-bold text-light-text dark:text-dark-text">
          {viewTitles[currentView]}
        </h1>
      </div>

      {/* Actions */}
      <div className="flex items-center gap-2">
        {/* Search */}
        <Button variant="ghost" size="sm" className="gap-2">
          <Search size={18} />
          <span className="hidden sm:inline text-sm text-light-text-secondary dark:text-dark-text-secondary">
            검색
          </span>
          <kbd className="hidden sm:inline-flex items-center gap-1 px-1.5 py-0.5 text-xs font-medium bg-gray-100 dark:bg-gray-800 rounded">
            <span>⌘</span>K
          </kbd>
        </Button>

        {/* Notifications */}
        <Button variant="ghost" size="sm" className="relative">
          <Bell size={18} />
          <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full" />
        </Button>

        {/* Theme Toggle */}
        <Button variant="ghost" size="sm" onClick={toggleTheme}>
          {theme === 'dark' ? <Sun size={18} /> : <Moon size={18} />}
        </Button>
      </div>
    </header>
  );
}
