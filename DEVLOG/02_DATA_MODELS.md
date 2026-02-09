# Bflow 데이터 모델

> 모든 타입 정의와 Firestore 컬렉션 구조

---

## 인증 & 사용자

### User (사용자)

```typescript
// src/types/user.ts
export interface User {
  id: string;                    // Firebase Auth UID
  email: string;
  displayName: string;
  photoURL?: string;
  role: UserRole;
  teamId: string;                // 소속 팀 ID
  status: UserStatus;
  createdAt: Timestamp;
  lastLoginAt: Timestamp;
}

export type UserRole =
  | 'admin'           // 관리자
  | 'member';         // 일반 멤버

export type UserStatus =
  | 'active'          // 활동 중
  | 'away'            // 자리 비움
  | 'offline';        // 오프라인
```

**Firestore 컬렉션**: `users/{userId}`

---

## 팀

### Team (팀)

```typescript
// src/types/team.ts
export interface Team {
  id: string;
  name: string;                  // 'Studio JBBJ'
  description?: string;
  createdAt: Timestamp;
  memberIds: string[];           // 팀원 User ID 목록
}
```

**Firestore 컬렉션**: `teams/{teamId}`

### TeamMember (팀원 상세)

```typescript
export interface TeamMember {
  id: string;                    // User ID
  name: string;
  role: TeamMemberRole;          // 팀 내 역할
  avatar?: string;               // 프로필 이미지 URL
  workStatus: WorkStatus;
  currentTaskId?: string;        // 현재 작업 중인 태스크
}

export type TeamMemberRole =
  | '애니메이터'
  | '배경'
  | '릴'
  | '보정'
  | '사운드'
  | '대본'
  | '녹음'
  | '촬영'
  | '기타';

export type WorkStatus =
  | 'working'         // 작업 중
  | 'review'          // 리뷰 대기
  | 'done'            // 완료
  | 'waiting'         // 대기
  | 'absent';         // 부재
```

---

## 프로젝트 & 에피소드

### Project (프로젝트)

```typescript
// src/types/project.ts
export interface Project {
  id: string;
  teamId: string;
  name: string;                  // '사코팍 시즌1'
  description?: string;
  color: string;                 // 프로젝트 구분 컬러 (hex)
  episodeIds: string[];
  status: ProjectStatus;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

export type ProjectStatus =
  | 'active'          // 진행 중
  | 'completed'       // 완료
  | 'archived';       // 보관
```

**Firestore 컬렉션**: `projects/{projectId}`

### Episode (에피소드)

```typescript
// src/types/episode.ts
export interface Episode {
  id: string;
  projectId: string;
  name: string;                  // 'ep.15 - 대환장 파티'
  number: number;                // 15
  progress: number;              // 0-100 진행률
  currentStage: PipelineStage;
  dueDate: Timestamp;
  milestones: Milestone[];
  taskIds: string[];
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

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

export interface Milestone {
  stage: PipelineStage;
  completedDate?: Timestamp;     // 완료 시 날짜
  note?: string;
  isCurrent: boolean;
}

// 파이프라인 단계 상수
export const PIPELINE_STAGES: PipelineStage[] = [
  '원정', '대본', '가녹음', '피칭', '에셋', '아트보드',
  '릴', '애니메이션', '보정', '가편', '피드백', '업로드'
];

export const STAGE_INDEX: Record<PipelineStage, number> = {
  '원정': 0, '대본': 1, '가녹음': 2, '피칭': 3,
  '에셋': 4, '아트보드': 5, '릴': 6, '애니메이션': 7,
  '보정': 8, '가편': 9, '피드백': 10, '업로드': 11
};
```

**Firestore 컬렉션**: `episodes/{episodeId}`

---

## 태스크 (팀)

### Task (팀 태스크)

```typescript
// src/types/task.ts
export interface Task {
  id: string;
  episodeId: string;
  projectId: string;
  title: string;                 // 'ep.15 SC_001'
  description?: string;
  assigneeId?: string;           // 담당자 User ID
  dueDate?: Timestamp;
  status: TaskStatus;
  priority: TaskPriority;
  stage?: PipelineStage;         // 소속 파이프라인 단계
  linkedTaskIds?: string[];      // 연결된 태스크 (노드맵용)
  memo?: string;
  createdAt: Timestamp;
  updatedAt: Timestamp;
  createdBy: string;             // 생성자 User ID
}

export type TaskStatus =
  | 'waiting'         // 대기
  | 'progress'        // 진행 중
  | 'review'          // 리뷰
  | 'done';           // 완료

export type TaskPriority =
  | 'high'
  | 'medium'
  | 'low';
```

**Firestore 컬렉션**: `tasks/{taskId}`

---

## 캘린더

### CalendarEvent (캘린더 이벤트)

```typescript
// src/types/calendar.ts
export interface CalendarEvent {
  id: string;
  title: string;
  description?: string;
  type: CalendarEventType;
  startDate: Timestamp;
  endDate: Timestamp;            // 멀티데이 지원
  isAllDay: boolean;
  color?: string;                // 커스텀 컬러

  // 소유권 & 공유
  ownerId: string;               // 생성자 User ID
  visibility: EventVisibility;
  sharedWith: string[];          // 공유 대상 User ID 목록

  // 연결
  calendarGroupId: string;       // 소속 캘린더 그룹
  relatedEpisodeId?: string;
  relatedTaskId?: string;

  createdAt: Timestamp;
  updatedAt: Timestamp;
}

export type CalendarEventType =
  | 'deadline'        // 마감일
  | 'meeting'         // 회의
  | 'milestone'       // 마일스톤
  | 'task'            // 태스크
  | 'event'           // 일반 이벤트
  | 'holiday'         // 휴일
  | 'personal';       // 개인 일정

export type EventVisibility =
  | 'team'            // 팀 전체 공개
  | 'private'         // 나만 보기
  | 'shared';         // 선택 공유
```

**Firestore 컬렉션**: `calendarEvents/{eventId}`

### CalendarGroup (캘린더 그룹)

```typescript
export interface CalendarGroup {
  id: string;
  name: string;                  // '팀 마감일', '내 일정', '운동'
  color: string;
  ownerId: string;
  isTeam: boolean;               // 팀 캘린더 여부
  isDefault: boolean;            // 기본 캘린더 여부
  visible: boolean;              // 현재 표시 여부
  order: number;                 // 정렬 순서
  createdAt: Timestamp;
}
```

**Firestore 컬렉션**: `calendarGroups/{groupId}`

---

## 개인 생산성

### PersonalTodo (개인 할 일)

```typescript
// src/types/todo.ts
export interface PersonalTodo {
  id: string;
  userId: string;                // 소유자
  content: string;               // 할 일 내용
  completed: boolean;
  completedAt?: Timestamp;
  dueDate?: Timestamp;           // 마감일 (D-day용)
  priority: TaskPriority;
  order: number;                 // 정렬 순서
  createdAt: Timestamp;
  updatedAt: Timestamp;
}
```

**Firestore 컬렉션**: `personalTodos/{todoId}`

### PersonalMemo (개인 메모)

```typescript
export interface PersonalMemo {
  id: string;
  userId: string;
  title?: string;
  content: string;               // 메모 내용 (plain text)
  isPinned: boolean;             // 상단 고정
  createdAt: Timestamp;
  updatedAt: Timestamp;
}
```

**Firestore 컬렉션**: `personalMemos/{memoId}`

### DDay (D-day 목표)

```typescript
export interface DDay {
  id: string;
  userId: string;
  title: string;                 // '프로젝트 마감', '생일'
  targetDate: Timestamp;
  color?: string;
  isRecurring: boolean;          // 매년 반복
  showOnDashboard: boolean;
  createdAt: Timestamp;
}
```

**Firestore 컬렉션**: `ddays/{ddayId}` (personalTodos 컬렉션에 통합해도 됨)

---

## 노드맵

### NodeMapNode (노드)

```typescript
// src/types/nodemap.ts
export interface NodeMapNode {
  id: string;
  type: NodeType;
  label: string;
  x: number;                     // 캔버스 X 좌표
  y: number;                     // 캔버스 Y 좌표
  status?: NodeStatus;
  avatar?: string;               // person 타입일 때
  parentId?: string;             // 소속 에피소드
  color?: string;
  size?: number;                 // 노드 크기
}

export type NodeType =
  | 'episode'
  | 'task'
  | 'person'
  | 'milestone';

export type NodeStatus =
  | 'active'
  | 'progress'
  | 'waiting'
  | 'done';
```

### NodeMapEdge (연결선)

```typescript
export interface NodeMapEdge {
  id: string;
  from: string;                  // 시작 노드 ID
  to: string;                    // 끝 노드 ID
  type: EdgeType;
  label?: string;
}

export type EdgeType =
  | 'default'
  | 'dependency'      // 의존 관계
  | 'assigned'        // 담당 관계
  | 'sequence';       // 순서 관계
```

### NodeMapConfig (노드맵 설정)

```typescript
export interface NodeMapConfig {
  id: string;
  projectId: string;
  nodes: NodeMapNode[];
  edges: NodeMapEdge[];
  zoom: number;
  panX: number;
  panY: number;
  updatedAt: Timestamp;
}
```

**Firestore 컬렉션**: `nodemaps/{projectId}`

---

## 앱 설정

### AppConfig (앱 설정)

```typescript
// src/types/config.ts
export interface AppConfig {
  theme: 'dark' | 'light';
  accentColor: string;           // hex color
  calendarView: 'weekly' | 'monthly';
  sidebarCollapsed: boolean;
  widgetLayout: WidgetLayout;
}

export interface WidgetLayout {
  [widgetId: string]: {
    x: number;
    y: number;
    w: number;                   // 1-4 (4x4 그리드)
    h: number;
  };
}
```

---

## 노션 연동 (Phase 5)

### NotionBookmark (노션 북마크)

```typescript
// src/types/notion.ts
export interface NotionBookmark {
  id: string;
  userId: string;
  category: string;              // 노션에서 분류한 카테고리
  name: string;
  url: string;
  favicon?: string;
  syncedAt: Timestamp;
  notionPageId: string;          // 원본 Notion 페이지 ID
}
```

**Firestore 컬렉션**: `notionBookmarks/{bookmarkId}`

---

## Firestore 헬퍼 타입

```typescript
// src/types/firestore.ts
import { Timestamp, FieldValue } from 'firebase/firestore';

// Firestore 문서 생성 시 사용
export type CreateData<T> = Omit<T, 'id' | 'createdAt' | 'updatedAt'> & {
  createdAt: FieldValue;
  updatedAt: FieldValue;
};

// Firestore 문서 업데이트 시 사용
export type UpdateData<T> = Partial<Omit<T, 'id' | 'createdAt'>> & {
  updatedAt: FieldValue;
};

// Timestamp ↔ Date 변환
export function toDate(timestamp: Timestamp): Date {
  return timestamp.toDate();
}

export function toTimestamp(date: Date): Timestamp {
  return Timestamp.fromDate(date);
}
```

---

## 인덱스 구조

Firestore 복합 쿼리를 위한 인덱스 (`firestore.indexes.json`):

```json
{
  "indexes": [
    {
      "collectionGroup": "calendarEvents",
      "queryScope": "COLLECTION",
      "fields": [
        { "fieldPath": "visibility", "order": "ASCENDING" },
        { "fieldPath": "startDate", "order": "ASCENDING" }
      ]
    },
    {
      "collectionGroup": "calendarEvents",
      "queryScope": "COLLECTION",
      "fields": [
        { "fieldPath": "ownerId", "order": "ASCENDING" },
        { "fieldPath": "startDate", "order": "ASCENDING" }
      ]
    },
    {
      "collectionGroup": "tasks",
      "queryScope": "COLLECTION",
      "fields": [
        { "fieldPath": "episodeId", "order": "ASCENDING" },
        { "fieldPath": "status", "order": "ASCENDING" }
      ]
    },
    {
      "collectionGroup": "personalTodos",
      "queryScope": "COLLECTION",
      "fields": [
        { "fieldPath": "userId", "order": "ASCENDING" },
        { "fieldPath": "completed", "order": "ASCENDING" },
        { "fieldPath": "order", "order": "ASCENDING" }
      ]
    }
  ]
}
```

---

## 타입 파일 통합 Export

```typescript
// src/types/index.ts
export * from './user';
export * from './team';
export * from './project';
export * from './episode';
export * from './task';
export * from './calendar';
export * from './todo';
export * from './nodemap';
export * from './config';
export * from './firestore';
```
