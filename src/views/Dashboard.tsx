import { motion } from 'framer-motion';
import {
  SummaryWidget,
  GanttWidget,
  TeamWidget,
  TasksWidget,
} from '@/components/widgets';

export function Dashboard() {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.3 }}
      className="grid grid-cols-4 gap-4 auto-rows-min"
    >
      <SummaryWidget />
      <GanttWidget />
      <TeamWidget />
      <TasksWidget />
    </motion.div>
  );
}
