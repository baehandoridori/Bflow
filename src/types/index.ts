// 팀원
export interface TeamMember {
  id: string;
  name: string;
  role: string;
  avatar?: string;
  status: 'working' | 'review' | 'done' | 'waiting' | 'absent';
  currentTaskId?: string;
}

// 프로젝트
export interface Project {
  id: string;
  name: string;
  color: string;
  episodeIds: string[];
}

// 파이프라인 단계
export type PipelineStage =
  | '원정'
  | '대본'
  | '가녹음'
  | '피칭'
  | '에셋'
  | '아트보드'
  | '릴'
  | '애니메이션'
  | '보정'
  | '가편'
  | '피드백'
  | '업로드';

// 마일스톤
export interface Milestone {
  stage: PipelineStage;
  completedDate?: string;
  note: string;
  isCurrent: boolean;
}

// 에피소드
export interface Episode {
  id: string;
  projectId: string;
  name: string;
  number: number;
  progress: number;
  currentStage: PipelineStage;
  dueDate: string;
  milestones: Milestone[];
  taskIds: string[];
}

// 태스크
export interface Task {
  id: string;
  episodeId: string;
  title: string;
  assigneeId?: string;
  dueDate?: string;
  status: 'waiting' | 'progress' | 'review' | 'done';
  priority?: 'high' | 'medium' | 'low';
  memo?: string;
  linkedTaskIds?: string[];
  createdAt: string;
  updatedAt: string;
}

// 캘린더 이벤트
export interface CalendarEvent {
  id: string;
  title: string;
  type: 'deadline' | 'meeting' | 'milestone' | 'task' | 'event' | 'holiday';
  startDate: string;
  endDate: string;
  color?: string;
  relatedEpisodeId?: string;
  relatedTaskId?: string;
}

// 노드맵 노드
export interface NodeMapNode {
  id: string;
  type: 'episode' | 'task' | 'person';
  label: string;
  x: number;
  y: number;
  status?: 'active' | 'progress' | 'waiting' | 'done';
  avatar?: string;
  parentId?: string;
}

// 노드맵 엣지
export interface NodeMapEdge {
  from: string;
  to: string;
  type: 'default' | 'dependency' | 'assigned' | 'sequence';
}

// 위젯 사이즈
export interface WidgetSize {
  w: number;
  h: number;
  x?: number;
  y?: number;
}

// 앱 설정
export interface AppConfig {
  theme: 'dark' | 'light';
  accentColor: string;
  widgetLayout: {
    [widgetId: string]: WidgetSize;
  };
  calendarView: 'weekly' | 'monthly';
  slackWebhookUrl?: string;
  notifications: {
    deadlineReminder: boolean;
    reminderDays: number[];
    commentNotify: boolean;
  };
}

// 뷰 타입
export type ViewType = 'dashboard' | 'timeline' | 'calendar' | 'team' | 'nodemap';
