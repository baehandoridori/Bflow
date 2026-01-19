import { MainLayout } from '@/components/layout';
import { useAppStore } from '@/stores/useAppStore';
import {
  Dashboard,
  TeamView,
  Timeline,
  CalendarView,
  NodeMapView,
  TasksView,
  Settings,
} from '@/views';

function App() {
  const { currentView } = useAppStore();

  const renderView = () => {
    switch (currentView) {
      case 'dashboard':
        return <Dashboard />;
      case 'timeline':
        return <Timeline />;
      case 'tasks':
        return <TasksView />;
      case 'calendar':
        return <CalendarView />;
      case 'team':
        return <TeamView />;
      case 'nodemap':
        return <NodeMapView />;
      case 'settings':
        return <Settings />;
      default:
        return <Dashboard />;
    }
  };

  return <MainLayout>{renderView()}</MainLayout>;
}

export default App;
