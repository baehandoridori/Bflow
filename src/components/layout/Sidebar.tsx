import { motion } from 'framer-motion';
import {
  LayoutDashboard,
  Calendar,
  Users,
  GitBranch,
  GanttChart,
  Settings,
  ChevronLeft,
  ChevronRight,
  CheckSquare,
} from 'lucide-react';
import { cn } from '@/utils/cn';
import { useAppStore } from '@/stores/useAppStore';
import type { ViewType } from '@/types';

interface NavItem {
  id: ViewType;
  label: string;
  icon: React.ReactNode;
}

const navItems: NavItem[] = [
  { id: 'dashboard', label: '대시보드', icon: <LayoutDashboard size={20} /> },
  { id: 'timeline', label: '타임라인', icon: <GanttChart size={20} /> },
  { id: 'tasks', label: '태스크', icon: <CheckSquare size={20} /> },
  { id: 'calendar', label: '캘린더', icon: <Calendar size={20} /> },
  { id: 'team', label: '팀 현황', icon: <Users size={20} /> },
  { id: 'nodemap', label: '노드맵', icon: <GitBranch size={20} /> },
];

export function Sidebar() {
  const { currentView, setCurrentView, sidebarCollapsed, toggleSidebar, accentColor } = useAppStore();

  return (
    <motion.aside
      initial={false}
      animate={{ width: sidebarCollapsed ? 64 : 240 }}
      transition={{ duration: 0.2, ease: 'easeInOut' }}
      className={cn(
        'fixed left-0 top-0 h-screen z-40',
        'bg-light-surface dark:bg-dark-surface',
        'border-r border-light-border dark:border-dark-border',
        'flex flex-col'
      )}
    >
      {/* Logo */}
      <div className="h-16 flex items-center justify-between px-4 border-b border-light-border dark:border-dark-border">
        <motion.div
          initial={false}
          animate={{ opacity: sidebarCollapsed ? 0 : 1 }}
          className="flex items-center gap-2"
        >
          <div
            className="w-8 h-8 rounded-lg flex items-center justify-center text-dark-bg font-bold"
            style={{ backgroundColor: accentColor }}
          >
            B
          </div>
          {!sidebarCollapsed && (
            <span className="text-lg font-bold text-light-text dark:text-dark-text">Bflow</span>
          )}
        </motion.div>
        <button
          onClick={toggleSidebar}
          className={cn(
            'p-1.5 rounded-lg transition-colors',
            'text-light-text-secondary dark:text-dark-text-secondary',
            'hover:bg-gray-100 dark:hover:bg-dark-surface-hover',
            sidebarCollapsed && 'mx-auto'
          )}
        >
          {sidebarCollapsed ? <ChevronRight size={18} /> : <ChevronLeft size={18} />}
        </button>
      </div>

      {/* Navigation */}
      <nav className="flex-1 py-4 px-2 space-y-1">
        {navItems.map((item) => (
          <button
            key={item.id}
            onClick={() => setCurrentView(item.id)}
            className={cn(
              'w-full flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-200',
              'text-light-text-secondary dark:text-dark-text-secondary',
              currentView === item.id
                ? 'bg-brand-primary/10 text-brand-primary dark:text-brand-primary'
                : 'hover:bg-gray-100 dark:hover:bg-dark-surface-hover hover:text-light-text dark:hover:text-dark-text'
            )}
          >
            <span
              className={cn(
                'flex-shrink-0',
                currentView === item.id && 'text-brand-primary'
              )}
            >
              {item.icon}
            </span>
            {!sidebarCollapsed && (
              <span className="text-sm font-medium truncate">{item.label}</span>
            )}
            {currentView === item.id && (
              <motion.div
                layoutId="activeIndicator"
                className="absolute left-0 w-1 h-8 rounded-r-full"
                style={{ backgroundColor: accentColor }}
              />
            )}
          </button>
        ))}
      </nav>

      {/* Settings */}
      <div className="p-2 border-t border-light-border dark:border-dark-border">
        <button
          className={cn(
            'w-full flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors',
            'text-light-text-secondary dark:text-dark-text-secondary',
            'hover:bg-gray-100 dark:hover:bg-dark-surface-hover'
          )}
        >
          <Settings size={20} />
          {!sidebarCollapsed && <span className="text-sm font-medium">설정</span>}
        </button>
      </div>
    </motion.aside>
  );
}
