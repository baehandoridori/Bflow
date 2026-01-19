import { MainLayout } from '@/components/layout';
import { useAppStore } from '@/stores/useAppStore';
import {
  Dashboard,
  TeamView,
  Timeline,
  CalendarView,
  NodeMapView,
} from '@/views';

function App() {
  const { currentView } = useAppStore();

  const renderView = () => {
    switch (currentView) {
      case 'dashboard':
        return <Dashboard />;
      case 'timeline':
        return <Timeline />;
      case 'calendar':
        return <CalendarView />;
      case 'team':
        return <TeamView />;
      case 'nodemap':
        return <NodeMapView />;
      default:
        return <Dashboard />;
    }
  };

  return <MainLayout>{renderView()}</MainLayout>;
}

export default App;
