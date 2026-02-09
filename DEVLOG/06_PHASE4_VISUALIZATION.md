# Phase 4: 시각화

> 간트 차트, 팀 현황 뷰

---

## 목표

Phase 4가 완료되면:
- 에피소드별 12단계 파이프라인 간트 차트
- 진행률 바 + 마일스톤 마커
- 팀 현황 뷰 (누가 뭘 하는지)
- 팀원별 상태 표시

---

## Step 4.1: Project Store

### src/stores/useProjectStore.ts

```typescript
import { create } from 'zustand';
import { Project, Episode, Task } from '../types';

interface ProjectState {
  projects: Project[];
  episodes: Episode[];
  tasks: Task[];
  selectedProjectId: string | null;
  isLoading: boolean;

  setProjects: (projects: Project[]) => void;
  setEpisodes: (episodes: Episode[]) => void;
  setTasks: (tasks: Task[]) => void;
  setSelectedProject: (id: string | null) => void;
  setLoading: (loading: boolean) => void;
}

export const useProjectStore = create<ProjectState>((set) => ({
  projects: [],
  episodes: [],
  tasks: [],
  selectedProjectId: null,
  isLoading: true,

  setProjects: (projects) => set({ projects }),
  setEpisodes: (episodes) => set({ episodes }),
  setTasks: (tasks) => set({ tasks }),
  setSelectedProject: (selectedProjectId) => set({ selectedProjectId }),
  setLoading: (isLoading) => set({ isLoading }),
}));
```

---

## Step 4.2: Project 서비스

### src/services/projects.ts

```typescript
import {
  collection,
  doc,
  getDocs,
  addDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
  orderBy,
  onSnapshot,
  serverTimestamp,
} from 'firebase/firestore';
import { db } from '../config/firebase';
import { Project, Episode, Task } from '../types';

// 프로젝트 구독
export function subscribeToProjects(callback: (projects: Project[]) => void) {
  const q = query(collection(db, 'projects'), orderBy('createdAt', 'desc'));

  return onSnapshot(q, (snapshot) => {
    const projects = snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    })) as Project[];
    callback(projects);
  });
}

// 에피소드 구독
export function subscribeToEpisodes(
  projectId: string | null,
  callback: (episodes: Episode[]) => void
) {
  const q = projectId
    ? query(
        collection(db, 'episodes'),
        where('projectId', '==', projectId),
        orderBy('number', 'asc')
      )
    : query(collection(db, 'episodes'), orderBy('number', 'asc'));

  return onSnapshot(q, (snapshot) => {
    const episodes = snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    })) as Episode[];
    callback(episodes);
  });
}

// 태스크 구독
export function subscribeToTasks(callback: (tasks: Task[]) => void) {
  const q = query(collection(db, 'tasks'), orderBy('createdAt', 'desc'));

  return onSnapshot(q, (snapshot) => {
    const tasks = snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    })) as Task[];
    callback(tasks);
  });
}

// 에피소드 진행률 업데이트
export async function updateEpisodeProgress(
  episodeId: string,
  progress: number,
  currentStage: string
): Promise<void> {
  await updateDoc(doc(db, 'episodes', episodeId), {
    progress,
    currentStage,
    updatedAt: serverTimestamp(),
  });
}

// 마일스톤 완료 처리
export async function completeMilestone(
  episodeId: string,
  stage: string
): Promise<void> {
  // 에피소드 문서에서 milestones 배열 업데이트
  const episodeRef = doc(db, 'episodes', episodeId);
  // 실제 구현에서는 transaction 사용 권장
}
```

---

## Step 4.3: 파이프라인 상수

### src/constants/pipeline.ts

```typescript
export const PIPELINE_STAGES = [
  { id: 'planning', name: '원정', color: '#EF4444' },
  { id: 'script', name: '대본', color: '#F97316' },
  { id: 'voiceover', name: '가녹음', color: '#F59E0B' },
  { id: 'pitching', name: '피칭', color: '#EAB308' },
  { id: 'assets', name: '에셋', color: '#84CC16' },
  { id: 'artboard', name: '아트보드', color: '#22C55E' },
  { id: 'animatics', name: '릴', color: '#14B8A6' },
  { id: 'animation', name: '애니메이션', color: '#06B6D4' },
  { id: 'colorsound', name: '보정', color: '#3B82F6' },
  { id: 'firstedit', name: '가편', color: '#6366F1' },
  { id: 'feedback', name: '피드백', color: '#8B5CF6' },
  { id: 'upload', name: '업로드', color: '#A855F7' },
] as const;

export type PipelineStageId = typeof PIPELINE_STAGES[number]['id'];

export function getStageIndex(stageId: string): number {
  return PIPELINE_STAGES.findIndex((s) => s.id === stageId);
}

export function getStageByIndex(index: number) {
  return PIPELINE_STAGES[index] || PIPELINE_STAGES[0];
}

export function getStageColor(stageId: string): string {
  const stage = PIPELINE_STAGES.find((s) => s.id === stageId);
  return stage?.color || '#6B7280';
}
```

---

## Step 4.4: 간트 차트 뷰

### src/views/GanttView.tsx

```typescript
import { useEffect } from 'react';
import { useProjectStore } from '../stores/useProjectStore';
import { subscribeToProjects, subscribeToEpisodes } from '../services/projects';
import { GanttChart } from '../components/gantt/GanttChart';

export function GanttView() {
  const { setProjects, setEpisodes, selectedProjectId, setLoading } = useProjectStore();

  useEffect(() => {
    const unsubProjects = subscribeToProjects(setProjects);
    const unsubEpisodes = subscribeToEpisodes(selectedProjectId, (episodes) => {
      setEpisodes(episodes);
      setLoading(false);
    });

    return () => {
      unsubProjects();
      unsubEpisodes();
    };
  }, [selectedProjectId, setProjects, setEpisodes, setLoading]);

  return (
    <div className="h-full">
      <GanttChart />
    </div>
  );
}
```

---

## Step 4.5: 간트 차트 컴포넌트

### src/components/gantt/GanttChart.tsx

```typescript
import { useMemo } from 'react';
import { useProjectStore } from '../../stores/useProjectStore';
import { GanttBar } from './GanttBar';
import { GanttTimeline } from './GanttTimeline';
import { PIPELINE_STAGES } from '../../constants/pipeline';

export function GanttChart() {
  const { episodes, isLoading } = useProjectStore();

  if (isLoading) {
    return (
      <div className="h-full flex items-center justify-center bg-gray-800 rounded-xl">
        <div className="w-8 h-8 border-4 border-brand border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="h-full bg-gray-800 rounded-xl overflow-hidden flex flex-col">
      {/* 헤더 */}
      <div className="p-4 border-b border-gray-700">
        <h2 className="text-xl font-semibold">간트 차트</h2>
        <p className="text-sm text-gray-400 mt-1">
          {episodes.length}개 에피소드 진행 중
        </p>
      </div>

      {/* 차트 영역 */}
      <div className="flex-1 overflow-auto">
        <div className="min-w-[1200px]">
          {/* 타임라인 헤더 (파이프라인 단계) */}
          <GanttTimeline />

          {/* 에피소드별 바 */}
          <div className="divide-y divide-gray-700">
            {episodes.map((episode) => (
              <GanttBar key={episode.id} episode={episode} />
            ))}
          </div>

          {/* 빈 상태 */}
          {episodes.length === 0 && (
            <div className="text-center py-12 text-gray-500">
              에피소드가 없습니다
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
```

### src/components/gantt/GanttTimeline.tsx

```typescript
import { PIPELINE_STAGES } from '../../constants/pipeline';

export function GanttTimeline() {
  return (
    <div className="flex border-b border-gray-700 sticky top-0 bg-gray-800 z-10">
      {/* 에피소드 이름 영역 */}
      <div className="w-48 flex-shrink-0 p-3 border-r border-gray-700">
        <span className="text-sm font-medium text-gray-400">에피소드</span>
      </div>

      {/* 파이프라인 단계 */}
      <div className="flex-1 flex">
        {PIPELINE_STAGES.map((stage) => (
          <div
            key={stage.id}
            className="flex-1 p-2 text-center border-r border-gray-700/50 last:border-r-0"
          >
            <span
              className="text-xs font-medium"
              style={{ color: stage.color }}
            >
              {stage.name}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
```

### src/components/gantt/GanttBar.tsx

```typescript
import { motion } from 'framer-motion';
import { Episode } from '../../types';
import { PIPELINE_STAGES, getStageIndex } from '../../constants/pipeline';
import { MilestoneMarker } from './MilestoneMarker';
import { cn } from '../../utils/cn';

interface GanttBarProps {
  episode: Episode;
}

export function GanttBar({ episode }: GanttBarProps) {
  const currentIndex = getStageIndex(episode.currentStage as string);
  const progressPercent = ((currentIndex + 1) / PIPELINE_STAGES.length) * 100;

  return (
    <div className="flex hover:bg-gray-700/30 transition-colors">
      {/* 에피소드 이름 */}
      <div className="w-48 flex-shrink-0 p-3 border-r border-gray-700">
        <p className="text-sm font-medium truncate">{episode.name}</p>
        <p className="text-xs text-gray-500">#{episode.number}</p>
      </div>

      {/* 진행률 바 */}
      <div className="flex-1 flex items-center px-2 relative">
        {/* 배경 그리드 */}
        <div className="absolute inset-0 flex">
          {PIPELINE_STAGES.map((_, i) => (
            <div
              key={i}
              className="flex-1 border-r border-gray-700/30 last:border-r-0"
            />
          ))}
        </div>

        {/* 진행률 바 */}
        <div className="relative w-full h-8">
          <motion.div
            className="absolute top-1 bottom-1 left-0 rounded-full bg-gradient-to-r from-brand/80 to-brand"
            initial={{ width: 0 }}
            animate={{ width: `${progressPercent}%` }}
            transition={{ duration: 0.5, ease: 'easeOut' }}
          >
            {/* Shimmer 효과 */}
            <div className="absolute inset-0 overflow-hidden rounded-full">
              <div className="shimmer" />
            </div>
          </motion.div>

          {/* 마일스톤 마커 */}
          {episode.milestones?.map((milestone, i) => (
            <MilestoneMarker
              key={i}
              milestone={milestone}
              stageIndex={getStageIndex(milestone.stage as string)}
              totalStages={PIPELINE_STAGES.length}
            />
          ))}

          {/* 현재 단계 표시 */}
          <div
            className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 w-4 h-4 rounded-full bg-brand border-2 border-white shadow-lg z-10"
            style={{
              left: `${progressPercent}%`,
            }}
          />
        </div>
      </div>
    </div>
  );
}
```

### src/components/gantt/MilestoneMarker.tsx

```typescript
import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Check, Flag } from 'lucide-react';
import { Milestone } from '../../types';
import { PIPELINE_STAGES } from '../../constants/pipeline';
import { formatDate } from '../../utils/date';
import { Timestamp } from 'firebase/firestore';

interface MilestoneMarkerProps {
  milestone: Milestone;
  stageIndex: number;
  totalStages: number;
}

export function MilestoneMarker({
  milestone,
  stageIndex,
  totalStages,
}: MilestoneMarkerProps) {
  const [showTooltip, setShowTooltip] = useState(false);
  const position = ((stageIndex + 0.5) / totalStages) * 100;
  const stage = PIPELINE_STAGES[stageIndex];

  return (
    <div
      className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 z-20"
      style={{ left: `${position}%` }}
      onMouseEnter={() => setShowTooltip(true)}
      onMouseLeave={() => setShowTooltip(false)}
    >
      {/* 마커 아이콘 */}
      <div
        className={`w-5 h-5 rounded-full flex items-center justify-center cursor-pointer transition-transform hover:scale-125 ${
          milestone.completedDate
            ? 'bg-green-500'
            : milestone.isCurrent
            ? 'bg-brand animate-pulse'
            : 'bg-gray-600'
        }`}
      >
        {milestone.completedDate ? (
          <Check className="w-3 h-3 text-white" />
        ) : (
          <Flag className="w-3 h-3 text-white" />
        )}
      </div>

      {/* 툴팁 */}
      <AnimatePresence>
        {showTooltip && (
          <motion.div
            initial={{ opacity: 0, y: 5 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 5 }}
            className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-48 bg-gray-900 rounded-lg p-3 shadow-xl border border-gray-700 z-50"
          >
            <p className="text-sm font-medium" style={{ color: stage?.color }}>
              {stage?.name}
            </p>
            {milestone.completedDate && (
              <p className="text-xs text-gray-400 mt-1">
                완료: {formatDate(
                  (milestone.completedDate as Timestamp).toDate(),
                  'yyyy.MM.dd'
                )}
              </p>
            )}
            {milestone.note && (
              <p className="text-xs text-gray-300 mt-2">{milestone.note}</p>
            )}
            {milestone.isCurrent && (
              <span className="inline-block mt-2 px-2 py-0.5 text-xs bg-brand/20 text-brand rounded">
                진행 중
              </span>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
```

---

## Step 4.6: 팀 현황 뷰

### src/stores/useTeamStore.ts

```typescript
import { create } from 'zustand';
import { TeamMember } from '../types';

interface TeamState {
  members: TeamMember[];
  isLoading: boolean;
  setMembers: (members: TeamMember[]) => void;
  setLoading: (loading: boolean) => void;
}

export const useTeamStore = create<TeamState>((set) => ({
  members: [],
  isLoading: true,
  setMembers: (members) => set({ members }),
  setLoading: (isLoading) => set({ isLoading }),
}));
```

### src/views/TeamView.tsx

```typescript
import { useEffect } from 'react';
import { useTeamStore } from '../stores/useTeamStore';
import { useProjectStore } from '../stores/useProjectStore';
import { subscribeToTeamMembers } from '../services/team';
import { subscribeToTasks } from '../services/projects';
import { TeamCard } from '../components/team/TeamCard';

export function TeamView() {
  const { setMembers, members, isLoading, setLoading } = useTeamStore();
  const { setTasks, tasks } = useProjectStore();

  useEffect(() => {
    const unsubMembers = subscribeToTeamMembers((members) => {
      setMembers(members);
      setLoading(false);
    });

    const unsubTasks = subscribeToTasks(setTasks);

    return () => {
      unsubMembers();
      unsubTasks();
    };
  }, [setMembers, setTasks, setLoading]);

  if (isLoading) {
    return (
      <div className="h-full flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-brand border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  // 상태별 분류
  const workingMembers = members.filter((m) => m.workStatus === 'working');
  const reviewMembers = members.filter((m) => m.workStatus === 'review');
  const waitingMembers = members.filter((m) => m.workStatus === 'waiting');

  return (
    <div className="space-y-6">
      <h2 className="text-xl font-semibold">팀 현황</h2>

      {/* 작업 중 */}
      <section>
        <h3 className="text-sm font-medium text-green-400 mb-3 flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
          작업 중 ({workingMembers.length})
        </h3>
        <div className="grid grid-cols-4 gap-4">
          {workingMembers.map((member) => (
            <TeamCard
              key={member.id}
              member={member}
              task={tasks.find((t) => t.id === member.currentTaskId)}
            />
          ))}
        </div>
      </section>

      {/* 리뷰 대기 */}
      <section>
        <h3 className="text-sm font-medium text-amber-400 mb-3 flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-amber-400" />
          리뷰 대기 ({reviewMembers.length})
        </h3>
        <div className="grid grid-cols-4 gap-4">
          {reviewMembers.map((member) => (
            <TeamCard
              key={member.id}
              member={member}
              task={tasks.find((t) => t.id === member.currentTaskId)}
            />
          ))}
        </div>
      </section>

      {/* 대기 */}
      <section>
        <h3 className="text-sm font-medium text-gray-400 mb-3 flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-gray-400" />
          대기 ({waitingMembers.length})
        </h3>
        <div className="grid grid-cols-4 gap-4">
          {waitingMembers.map((member) => (
            <TeamCard
              key={member.id}
              member={member}
            />
          ))}
        </div>
      </section>
    </div>
  );
}
```

### src/components/team/TeamCard.tsx

```typescript
import { TeamMember, Task } from '../../types';
import { cn } from '../../utils/cn';

interface TeamCardProps {
  member: TeamMember;
  task?: Task;
}

export function TeamCard({ member, task }: TeamCardProps) {
  const statusColors = {
    working: 'border-green-500',
    review: 'border-amber-500',
    done: 'border-indigo-500',
    waiting: 'border-gray-500',
    absent: 'border-red-500',
  };

  return (
    <div
      className={cn(
        'bg-gray-800 rounded-xl p-4 border-l-4 transition-all hover:bg-gray-700/50',
        statusColors[member.workStatus]
      )}
    >
      {/* 프로필 */}
      <div className="flex items-center gap-3 mb-3">
        {member.avatar ? (
          <img
            src={member.avatar}
            alt={member.name}
            className="w-10 h-10 rounded-full"
          />
        ) : (
          <div className="w-10 h-10 rounded-full bg-gray-700 flex items-center justify-center text-lg">
            {member.name[0]}
          </div>
        )}
        <div>
          <p className="font-medium">{member.name}</p>
          <p className="text-xs text-gray-400">{member.role}</p>
        </div>
      </div>

      {/* 현재 작업 */}
      {task ? (
        <div className="bg-gray-700/50 rounded-lg p-2">
          <p className="text-sm truncate">{task.title}</p>
          <p className="text-xs text-gray-500 mt-1">{task.stage}</p>
        </div>
      ) : (
        <p className="text-sm text-gray-500">할당된 작업 없음</p>
      )}
    </div>
  );
}
```

---

## CSS: Shimmer 효과

### src/index.css에 추가

```css
@keyframes shimmer {
  0% {
    transform: translateX(-100%);
  }
  100% {
    transform: translateX(100%);
  }
}

.shimmer {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: linear-gradient(
    90deg,
    transparent,
    rgba(255, 255, 255, 0.1),
    transparent
  );
  animation: shimmer 2s infinite;
}
```

---

## Phase 4 완료 체크리스트

- [ ] Project Store 구현
- [ ] Project 서비스 구현
- [ ] 파이프라인 상수 정의
- [ ] GanttView 페이지 구현
- [ ] GanttChart 컴포넌트 구현
- [ ] GanttTimeline 컴포넌트 구현
- [ ] GanttBar 컴포넌트 구현
- [ ] MilestoneMarker 컴포넌트 구현
- [ ] Team Store 구현
- [ ] TeamView 페이지 구현
- [ ] TeamCard 컴포넌트 구현
- [ ] Shimmer 애니메이션 추가
- [ ] 마일스톤 툴팁 동작 확인
- [ ] 진행률 바 애니메이션 확인
