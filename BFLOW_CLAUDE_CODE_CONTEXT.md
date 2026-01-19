# Bflow - Claude Code 구현 가이드

> **JBBJ 애니메이션 스튜디오를 위한 일정 관리 & 워크플로우 시각화 PWA**
> 
> 이 문서는 Claude Code에서 Bflow를 구현할 때 참조할 컨텍스트 문서입니다.

---

## 📌 프로젝트 개요

| 항목 | 내용 |
|------|------|
| **앱 이름** | Bflow |
| **타입** | PWA (Progressive Web App) |
| **대상 사용자** | Studio JBBJ 팀 (약 20명) |
| **핵심 가치** | "화려하고 명료하게 전체 상황을 확인하고, 누가 뭘 하는지 정확히 아는 것" |
| **브랜드 컬러** | `#F0E68C` (Khaki Gold) |
| **데이터 저장 경로** | `G:\공유 드라이브\JBBJ 자료실\한솔이의 두근두근 실험실\Bflow_data\` |

---

## 👥 팀 구조 & 워크플로우

### 팀 구성
- **인원**: 약 20명
- **역할**: 모두 애니메이터이면서 역할 분담
  - 릴 담당
  - 녹음 담당
  - 대본 담당
  - 애니메이팅 담당
  - 배경 담당
  - 에셋 준비 담당
  - 촬영 담당

### 작업 단위
- **대단위**: 에피소드 (예: "사코팍 ep.15")
- **소단위**: 씬(SC), 배경, 보정 등

### 프로덕션 파이프라인 (12단계)

```
원정(기획) → 대본집필 → 가녹음 → 피칭 → 배경/에셋 사전제작 → 아트보드 → 릴(애니메틱스) → 애니메이션 → 보정/사운드 → 가편 → 피드백 → 업로드
```

| 단계 | 설명 | 예상 기간 |
|------|------|----------|
| 원정 (기획) | 작가팀 타지 원정, 기획 회의 | 2-3일 |
| 대본 집필 | 원고 작성 | 유동적 |
| 가녹음 | 대본 기반 임시 녹음 | 유동적 |
| 피칭 | 가녹음+릴로 전체 영상 피칭 & 연기 지도 | 유동적 |
| 배경/에셋 사전제작 | 필요 에셋 미리 제작 | 유동적 |
| 아트보드 | 룩뎁, 분위기, 비주얼 디렉션 확정 | 유동적 |
| 릴 (애니메틱스) | 타이밍/구성 확인용 러프 영상 | 유동적 |
| 애니메이션 | 본 애니메이션 작업 | 유동적 |
| 보정/사운드 | 컬러, 효과, 오디오 | 유동적 |
| 가편 | 초안 편집본 | 유동적 |
| 피드백 | 리뷰 및 수정 | 유동적 |
| 업로드 | 최종 퍼블리시 | - |

---

## 🎯 핵심 기능 요구사항

### 필수 기능 (Must Have)
1. **위젯 기반 대시보드** - 4x4 그리드, 사용자가 크기 조절 가능
2. **간트 차트 타임라인** - 에피소드별 진행률, 파이프라인 단계 표시
3. **마일스톤 툴팁** - 호버 시 상세 정보 표시
4. **캘린더 (주간/월간)** - 멀티데이 이벤트 연속 바 표시
5. **팀 현황 뷰** - 누가 뭘 하는지 한눈에
6. **노드맵 뷰** - 옵시디언 그래프 스타일, 작업 의존성 시각화
7. **다크/라이트 테마** - 전환 가능
8. **커스텀 액센트 컬러** - 5가지 이상 선택

### 부가 기능 (Should Have)
1. **Slack 웹훅 연동** - 마감 리마인더, 코멘트 알림
2. **데스크톱 알림** - PWA Push Notification
3. **드래그 앤 드롭** - 일정 조절, 노드 이동
4. **검색 기능** - 태스크, 팀원 검색

### 미래 기능 (Could Have)
1. Google Calendar 동기화
2. 외부 협업자 접근

---

## 📋 데이터 구조

### 저장 위치
```
G:\공유 드라이브\JBBJ 자료실\한솔이의 두근두근 실험실\Bflow_data\
├── config.json          # 앱 설정 (테마, 액센트 컬러 등)
├── projects.json        # 프로젝트 목록
├── episodes/
│   ├── ep15.json        # 에피소드별 데이터
│   ├── ep16.json
│   └── ...
├── tasks.json           # 전체 태스크
├── team.json            # 팀원 정보
├── calendar.json        # 캘린더 이벤트
└── nodes.json           # 노드맵 연결 정보
```

### 타입 정의 (TypeScript)

```typescript
// 팀원
interface TeamMember {
  id: string;
  name: string;
  role: string;           // '애니메이터' | '배경' | '릴' | '보정' | '사운드' 등
  avatar?: string;        // 이미지 URL 또는 이모지
  status: 'working' | 'review' | 'done' | 'waiting' | 'absent';
  currentTaskId?: string;
}

// 프로젝트
interface Project {
  id: string;
  name: string;           // '사코팍 시즌1'
  color: string;          // 프로젝트 구분 컬러
  episodeIds: string[];
}

// 에피소드
interface Episode {
  id: string;
  projectId: string;
  name: string;           // 'ep.15 - 대환장 파티'
  number: number;         // 15
  progress: number;       // 0-100
  currentStage: PipelineStage;
  dueDate: string;        // ISO date
  milestones: Milestone[];
  taskIds: string[];
}

// 파이프라인 단계
type PipelineStage = 
  | '원정' | '대본' | '가녹음' | '피칭' | '에셋' 
  | '아트보드' | '릴' | '애니메이션' | '보정' | '가편' | '피드백' | '업로드';

// 마일스톤
interface Milestone {
  stage: PipelineStage;
  completedDate?: string; // ISO date, null if not completed
  note: string;
  isCurrent: boolean;
}

// 태스크
interface Task {
  id: string;
  episodeId: string;
  title: string;          // 'ep.15 SC_001'
  assigneeId?: string;    // TeamMember id
  dueDate?: string;
  status: 'waiting' | 'progress' | 'review' | 'done';
  priority?: 'high' | 'medium' | 'low';
  memo?: string;
  linkedTaskIds?: string[]; // 연결된 태스크 (노드맵용)
  createdAt: string;
  updatedAt: string;
}

// 캘린더 이벤트
interface CalendarEvent {
  id: string;
  title: string;
  type: 'deadline' | 'meeting' | 'milestone' | 'task' | 'event' | 'holiday';
  startDate: string;      // ISO date
  endDate: string;        // ISO date (멀티데이 지원)
  color?: string;         // 커스텀 컬러
  relatedEpisodeId?: string;
  relatedTaskId?: string;
}

// 노드맵 노드
interface NodeMapNode {
  id: string;
  type: 'episode' | 'task' | 'person';
  label: string;
  x: number;
  y: number;
  status?: 'active' | 'progress' | 'waiting' | 'done';
  avatar?: string;        // person 타입일 때
  parentId?: string;      // 소속 에피소드
}

// 노드맵 엣지
interface NodeMapEdge {
  from: string;           // node id
  to: string;             // node id
  type: 'default' | 'dependency' | 'assigned' | 'sequence';
}

// 앱 설정
interface AppConfig {
  theme: 'dark' | 'light';
  accentColor: string;    // hex color
  widgetLayout: {
    [widgetId: string]: { w: number; h: number; x?: number; y?: number };
  };
  calendarView: 'weekly' | 'monthly';
  slackWebhookUrl?: string;
  notifications: {
    deadlineReminder: boolean;
    reminderDays: number[]; // [3, 1, 0] = D-3, D-1, D-day
    commentNotify: boolean;
  };
}
```

---

## 🎨 디자인 시스템

### 컬러 팔레트

```css
/* 브랜드 */
--brand-primary: #F0E68C;
--brand-primary-dark: #D4CA6A;
--brand-primary-light: #F5EDA8;

/* 다크 테마 */
--dark-bg: #111827;           /* gray-900 */
--dark-surface: #1F2937;      /* gray-800 */
--dark-surface-hover: #374151; /* gray-700 */
--dark-border: #374151;
--dark-text: #F9FAFB;
--dark-text-secondary: #9CA3AF;

/* 라이트 테마 */
--light-bg: #F3F4F6;
--light-surface: #FFFFFF;
--light-border: #E5E7EB;
--light-text: #111827;
--light-text-secondary: #6B7280;

/* 상태 컬러 */
--status-working: #22C55E;    /* green */
--status-review: #F59E0B;     /* amber */
--status-done: #6366F1;       /* indigo */
--status-waiting: #6B7280;    /* gray */

/* 우선순위 */
--priority-high: #EF4444;     /* red */
--priority-medium: #F59E0B;   /* amber */
--priority-low: #6B7280;      /* gray */

/* 이벤트 타입 */
--event-deadline: #EF4444;
--event-meeting: #3B82F6;
--event-milestone: #F0E68C;
--event-task: #A855F7;
--event-holiday: #EF4444;
```

### 타이포그래피
- **폰트**: Pretendard 또는 Inter (한글 지원)
- **헤딩**: font-weight 700
- **바디**: font-weight 400-500
- **캡션/라벨**: font-weight 500, uppercase, letter-spacing wider

### 인터랙션 & 애니메이션

| 요소 | 효과 | 구현 방법 |
|------|------|----------|
| 페이지 전환 | 슬라이드/페이드 | Framer Motion |
| 카드 호버 | 3D 틸트 + 글레어 | CSS transform + perspective |
| 드래그 앤 드롭 | 물리 바운스 | Framer Motion spring |
| 마일스톤 달성 | 컨페티 파티클 | Canvas 또는 CSS |
| 진행률 바 | Shimmer 효과 | CSS animation |
| 로딩 | 스켈레톤 UI | CSS placeholder |
| 노드맵 | 물리 시뮬레이션 | D3.js force simulation |

### 반드시 피해야 할 것 (Anti-patterns)
- ❌ 이모지 범벅 UI (바이브코딩 느낌)
- ❌ 복잡하고 뭐가 뭔지 모르는 UI
- ❌ 버벅거리거나 끊기는 애니메이션
- ❌ 보라색 그라데이션 (AI 슬롭 느낌)
- ❌ Inter, Roboto 같은 흔한 폰트만 사용

---

## 🛠️ 기술 스택

### Frontend
```json
{
  "framework": "React 18 + TypeScript",
  "styling": "Tailwind CSS",
  "animation": "Framer Motion",
  "state": "Zustand",
  "charts": "D3.js (간트, 노드맵)",
  "icons": "Lucide React (SVG)",
  "date": "date-fns"
}
```

### PWA
- Service Worker (Workbox)
- Web Push Notifications
- manifest.json
- Installable

### Data Layer
- Google Drive 파일 기반 (JSON)
- File System Access API 또는 Google Drive API
- 변경 감지 + 충돌 처리 (타임스탬프 기반)

### Integrations
- Slack Incoming Webhooks

---

## 📁 프로젝트 구조

```
bflow/
├── public/
│   ├── manifest.json
│   ├── sw.js
│   └── icons/
├── src/
│   ├── components/
│   │   ├── ui/                    # 공통 UI 컴포넌트
│   │   │   ├── Button.tsx
│   │   │   ├── Card.tsx
│   │   │   ├── Tooltip.tsx
│   │   │   ├── TiltCard.tsx
│   │   │   └── ...
│   │   ├── widgets/               # 대시보드 위젯
│   │   │   ├── Widget.tsx         # 위젯 컨테이너 (리사이즈)
│   │   │   ├── SummaryWidget.tsx
│   │   │   ├── GanttWidget.tsx
│   │   │   ├── CalendarWidget.tsx
│   │   │   ├── TeamWidget.tsx
│   │   │   └── TasksWidget.tsx
│   │   ├── calendar/
│   │   │   ├── Calendar.tsx
│   │   │   ├── WeeklyView.tsx
│   │   │   ├── MonthlyView.tsx
│   │   │   └── EventBar.tsx       # 멀티데이 이벤트 바
│   │   ├── gantt/
│   │   │   ├── GanttChart.tsx
│   │   │   ├── GanttBar.tsx
│   │   │   └── MilestoneMarker.tsx
│   │   ├── nodemap/
│   │   │   ├── NodeMap.tsx
│   │   │   ├── Node.tsx
│   │   │   ├── Edge.tsx
│   │   │   └── usePhysicsSimulation.ts
│   │   ├── layout/
│   │   │   ├── Sidebar.tsx
│   │   │   ├── Header.tsx
│   │   │   └── MainLayout.tsx
│   │   └── effects/
│   │       ├── Confetti.tsx
│   │       └── Shimmer.tsx
│   ├── views/                     # 페이지 뷰
│   │   ├── Dashboard.tsx
│   │   ├── Timeline.tsx
│   │   ├── CalendarView.tsx
│   │   ├── TeamView.tsx
│   │   └── NodeMapView.tsx
│   ├── stores/                    # Zustand 스토어
│   │   ├── useAppStore.ts         # 앱 설정 (테마, 레이아웃)
│   │   ├── useProjectStore.ts     # 프로젝트, 에피소드
│   │   ├── useTaskStore.ts        # 태스크
│   │   ├── useTeamStore.ts        # 팀원
│   │   └── useCalendarStore.ts    # 캘린더 이벤트
│   ├── hooks/
│   │   ├── useGoogleDrive.ts      # Google Drive 연동
│   │   ├── useSlackNotify.ts      # Slack 웹훅
│   │   ├── useTilt.ts             # 3D 틸트 효과
│   │   └── useKeyboard.ts         # 키보드 단축키
│   ├── services/
│   │   ├── storage.ts             # 파일 읽기/쓰기
│   │   ├── sync.ts                # 동기화 로직
│   │   └── slack.ts               # Slack 연동
│   ├── utils/
│   │   ├── date.ts
│   │   ├── color.ts
│   │   └── cn.ts                  # classNames 유틸
│   ├── types/
│   │   └── index.ts               # 모든 타입 정의
│   ├── constants/
│   │   └── pipeline.ts            # 파이프라인 단계 상수
│   ├── App.tsx
│   ├── main.tsx
│   └── index.css
├── package.json
├── tsconfig.json
├── tailwind.config.js
├── vite.config.ts
└── README.md
```

---

## 🔧 핵심 컴포넌트 구현 가이드

### 1. Widget (리사이즈 가능한 위젯 컨테이너)

```typescript
interface WidgetProps {
  title: string;
  icon: React.ReactNode;
  size: { w: number; h: number };
  onResize: (size: { w: number; h: number }) => void;
  minSize?: { w: number; h: number };
  maxSize?: { w: number; h: number };
  children: React.ReactNode;
}

// 4x4 그리드 기반
// 호버 시 리사이즈 버튼 표시
// 사이즈 선택 드롭다운 메뉴
```

### 2. Calendar (멀티데이 이벤트)

```typescript
// 핵심 로직: 여러 날에 걸친 이벤트를 연속된 바로 표시
// 1. 주/월 단위로 이벤트 필터링
// 2. 이벤트 시작/끝 날짜 계산
// 3. 겹치는 이벤트는 여러 행에 배치
// 4. 주가 바뀌면 이벤트 바를 끊어서 표시
```

### 3. NodeMap (옵시디언 스타일)

```typescript
// 구현 요소:
// 1. SVG 기반 캔버스
// 2. 노드 드래그 이동
// 3. 마우스 휠 줌
// 4. 빈 공간 드래그로 팬
// 5. 연결선 (직선 또는 베지어 곡선)
// 6. 호버 시 연결된 노드/선 강조
// 7. 물리 시뮬레이션 (선택적, D3 force)
```

### 4. GanttChart (마일스톤 툴팁)

```typescript
// 구현 요소:
// 1. 파이프라인 12단계 그리드
// 2. 진행률 바 (shimmer 애니메이션)
// 3. 마일스톤 마커 (호버 시 툴팁)
// 4. 현재 진행 중인 단계 펄스 애니메이션
```

### 5. TiltCard (3D 호버 효과)

```typescript
// 마우스 위치에 따른 3D 기울기
// perspective + rotateX/Y
// 글레어(반사광) 효과
// scale 확대 효과
```

---

## 📡 Google Drive 연동

### 옵션 1: File System Access API (권장)
```typescript
// 장점: 간단, 로컬 파일 직접 접근
// 단점: 브라우저 지원 제한 (Chrome/Edge)

async function openDirectory() {
  const dirHandle = await window.showDirectoryPicker();
  // G:\공유 드라이브\... 경로 선택
}

async function readFile(dirHandle, filename) {
  const fileHandle = await dirHandle.getFileHandle(filename);
  const file = await fileHandle.getFile();
  return JSON.parse(await file.text());
}

async function writeFile(dirHandle, filename, data) {
  const fileHandle = await dirHandle.getFileHandle(filename, { create: true });
  const writable = await fileHandle.createWritable();
  await writable.write(JSON.stringify(data, null, 2));
  await writable.close();
}
```

### 옵션 2: Google Drive API
```typescript
// 장점: 모든 브라우저 지원, 실시간 동기화 가능
// 단점: OAuth 설정 필요, 복잡도 증가
```

### 충돌 처리
```typescript
interface FileMetadata {
  lastModified: string;  // ISO timestamp
  modifiedBy: string;    // 수정자 ID
}

// 저장 전 타임스탬프 비교
// 충돌 시 사용자에게 선택권 제공 (내 것 유지 / 서버 것 가져오기 / 병합)
```

---

## 🔔 Slack 연동

### 웹훅 설정
```typescript
const SLACK_WEBHOOK_URL = 'https://hooks.slack.com/services/...';

async function sendSlackNotification(message: {
  channel?: string;
  text: string;
  blocks?: any[];
}) {
  await fetch(SLACK_WEBHOOK_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(message),
  });
}
```

### 알림 트리거
1. **마감 리마인더**: D-3, D-1, D-day 자동 발송
2. **코멘트 알림**: 태스크에 코멘트 추가 시 담당자에게 DM

---

## 🚀 구현 우선순위

### Phase 1: MVP (1주)
- [ ] 프로젝트 세팅 (Vite + React + TypeScript + Tailwind)
- [ ] 기본 레이아웃 (사이드바, 헤더)
- [ ] 위젯 그리드 시스템
- [ ] 간트 차트 (기본)
- [ ] 팀 뷰 (기본)
- [ ] 다크/라이트 테마

### Phase 2: 핵심 기능 (1주)
- [ ] Google Drive 연동 (파일 읽기/쓰기)
- [ ] 캘린더 (주간/월간, 멀티데이 이벤트)
- [ ] 마일스톤 툴팁
- [ ] 태스크 CRUD

### Phase 3: 고급 기능 (1주)
- [ ] 노드맵 뷰
- [ ] 드래그 앤 드롭 일정 조절
- [ ] Slack 웹훅 연동
- [ ] PWA 설정

### Phase 4: 폴리싱 (3-4일)
- [ ] 애니메이션 고도화 (컨페티, 틸트, shimmer)
- [ ] 성능 최적화
- [ ] 에러 핸들링
- [ ] 반응형 디자인

---

## 📝 참고 사항

### 프로토타입 파일
- `Bflow_Prototype_v3_Final.jsx` - 최종 UI/UX 프로토타입
- 모든 컴포넌트 구조와 인터랙션 참고 가능

### 디자인 레퍼런스
- **전체 톤**: Slack 앱
- **UX**: Monday.com, Notion
- **노드맵**: Obsidian 그래프 뷰
- **인터랙션**: Raycast 홈페이지

### 사용자 특성
- 전문 소프트웨어 개발자가 아닌 애니메이터들
- 복잡한 설정 없이 바로 사용할 수 있어야 함
- 시각적으로 명확하고 직관적인 UI 필요

---

## ✅ 체크리스트

구현 완료 시 확인할 항목:

- [ ] 5초 내에 전체 프로젝트 상황 파악 가능?
- [ ] 별도 교육 없이 팀원들이 바로 사용 가능?
- [ ] "우와!" 하는 인터랙션이 있는가?
- [ ] 버벅거림 없이 부드럽게 동작하는가?
- [ ] 이모지 범벅이 아닌 깔끔한 UI인가?
- [ ] Google Drive 동기화가 안정적인가?
- [ ] 여러 명이 동시에 사용해도 문제 없는가?

---

*문서 버전: 1.0*
*작성일: 2025-01-19*
*작성자: Claude & 한솔*
