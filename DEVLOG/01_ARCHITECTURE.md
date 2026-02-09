# Bflow 아키텍처 설계

---

## 시스템 아키텍처

```
┌─────────────────────────────────────────────────────────────┐
│                        Client (PWA)                         │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────────────┐  │
│  │   React +   │  │   Zustand   │  │   Framer Motion     │  │
│  │  TypeScript │  │   (State)   │  │   (Animations)      │  │
│  └──────┬──────┘  └──────┬──────┘  └─────────────────────┘  │
│         │                │                                   │
│  ┌──────┴────────────────┴──────────────────────────────┐   │
│  │              Firebase SDK (v9 modular)                │   │
│  └──────────────────────┬───────────────────────────────┘   │
└─────────────────────────┼───────────────────────────────────┘
                          │
                          ▼
┌─────────────────────────────────────────────────────────────┐
│                     Firebase Backend                         │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────────────┐  │
│  │  Firebase   │  │   Cloud     │  │   Firebase          │  │
│  │    Auth     │  │  Firestore  │  │   Hosting           │  │
│  │  (OAuth)    │  │   (DB)      │  │   (PWA Deploy)      │  │
│  └─────────────┘  └─────────────┘  └─────────────────────┘  │
└─────────────────────────────────────────────────────────────┘
```

---

## 프로젝트 디렉토리 구조

```
bflow/
├── public/
│   ├── manifest.json           # PWA manifest
│   ├── sw.js                   # Service Worker
│   ├── favicon.ico
│   └── icons/                  # PWA 아이콘들
│       ├── icon-192.png
│       └── icon-512.png
│
├── src/
│   ├── main.tsx                # 앱 진입점
│   ├── App.tsx                 # 라우팅 + 레이아웃
│   ├── index.css               # Tailwind 임포트
│   │
│   ├── config/
│   │   └── firebase.ts         # Firebase 초기화
│   │
│   ├── types/
│   │   ├── index.ts            # 모든 타입 re-export
│   │   ├── user.ts
│   │   ├── team.ts
│   │   ├── project.ts
│   │   ├── episode.ts
│   │   ├── task.ts
│   │   ├── calendar.ts
│   │   ├── todo.ts
│   │   └── nodemap.ts
│   │
│   ├── stores/
│   │   ├── useAuthStore.ts     # 인증 상태
│   │   ├── useAppStore.ts      # 앱 설정 (테마 등)
│   │   ├── useProjectStore.ts  # 프로젝트/에피소드
│   │   ├── useTaskStore.ts     # 팀 태스크
│   │   ├── useCalendarStore.ts # 캘린더 이벤트
│   │   ├── useTodoStore.ts     # 개인 할 일
│   │   └── useTeamStore.ts     # 팀원 정보
│   │
│   ├── services/
│   │   ├── auth.ts             # Firebase Auth 래퍼
│   │   ├── firestore.ts        # Firestore CRUD 헬퍼
│   │   ├── users.ts            # 사용자 관련
│   │   ├── projects.ts         # 프로젝트/에피소드
│   │   ├── tasks.ts            # 태스크
│   │   ├── calendar.ts         # 캘린더
│   │   ├── todos.ts            # 개인 할 일
│   │   └── slack.ts            # Slack 웹훅
│   │
│   ├── hooks/
│   │   ├── useAuth.ts          # 인증 상태 훅
│   │   ├── useFirestore.ts     # 실시간 구독 훅
│   │   ├── useTilt.ts          # 3D 틸트 효과
│   │   └── useKeyboard.ts      # 키보드 단축키
│   │
│   ├── components/
│   │   ├── ui/                 # 공통 UI 컴포넌트
│   │   │   ├── Button.tsx
│   │   │   ├── Card.tsx
│   │   │   ├── Input.tsx
│   │   │   ├── Modal.tsx
│   │   │   ├── Tooltip.tsx
│   │   │   ├── TiltCard.tsx
│   │   │   ├── Skeleton.tsx
│   │   │   └── Avatar.tsx
│   │   │
│   │   ├── layout/
│   │   │   ├── MainLayout.tsx  # 전체 레이아웃
│   │   │   ├── Sidebar.tsx     # 좌측 네비게이션
│   │   │   └── Header.tsx      # 상단 헤더
│   │   │
│   │   ├── auth/
│   │   │   ├── LoginPage.tsx
│   │   │   └── AuthGuard.tsx   # 인증 라우트 가드
│   │   │
│   │   ├── calendar/
│   │   │   ├── Calendar.tsx
│   │   │   ├── WeeklyView.tsx
│   │   │   ├── MonthlyView.tsx
│   │   │   ├── EventBar.tsx
│   │   │   ├── EventModal.tsx
│   │   │   └── CalendarSidebar.tsx
│   │   │
│   │   ├── gantt/
│   │   │   ├── GanttChart.tsx
│   │   │   ├── GanttBar.tsx
│   │   │   ├── GanttTimeline.tsx
│   │   │   └── MilestoneMarker.tsx
│   │   │
│   │   ├── nodemap/
│   │   │   ├── NodeMap.tsx
│   │   │   ├── Node.tsx
│   │   │   ├── Edge.tsx
│   │   │   └── useForceSimulation.ts
│   │   │
│   │   ├── todo/
│   │   │   ├── TodoList.tsx
│   │   │   ├── TodoItem.tsx
│   │   │   └── TodoInput.tsx
│   │   │
│   │   ├── widgets/
│   │   │   ├── Widget.tsx      # 위젯 컨테이너
│   │   │   ├── SummaryWidget.tsx
│   │   │   ├── CalendarWidget.tsx
│   │   │   ├── TeamWidget.tsx
│   │   │   └── TasksWidget.tsx
│   │   │
│   │   └── effects/
│   │       ├── Confetti.tsx
│   │       └── Shimmer.tsx
│   │
│   ├── views/                  # 페이지 뷰
│   │   ├── Dashboard.tsx
│   │   ├── CalendarView.tsx
│   │   ├── GanttView.tsx
│   │   ├── TeamView.tsx
│   │   ├── NodeMapView.tsx
│   │   ├── TodoView.tsx
│   │   └── SettingsView.tsx
│   │
│   ├── utils/
│   │   ├── cn.ts               # classNames 유틸
│   │   ├── date.ts             # date-fns 래퍼
│   │   └── color.ts            # 컬러 유틸
│   │
│   └── constants/
│       ├── pipeline.ts         # 12단계 파이프라인
│       └── theme.ts            # 테마 상수
│
├── .env.local                  # Firebase 설정 (gitignore)
├── .env.example                # 환경변수 예시
├── package.json
├── tsconfig.json
├── tailwind.config.js
├── vite.config.ts
├── postcss.config.js
└── README.md
```

---

## Firebase 설정

### 1. Firebase 프로젝트 생성

1. [Firebase Console](https://console.firebase.google.com) 접속
2. "프로젝트 추가" → 프로젝트 이름: `bflow-jbbj`
3. Google Analytics는 선택 사항 (비활성화 가능)
4. 프로젝트 생성 완료

### 2. 앱 등록

1. 프로젝트 설정 → "앱 추가" → 웹 (`</>`)
2. 앱 닉네임: `bflow-web`
3. Firebase Hosting 체크
4. SDK 설정 복사 (아래 형식)

### 3. 환경 변수 설정

`.env.local` 파일:
```env
VITE_FIREBASE_API_KEY=your-api-key
VITE_FIREBASE_AUTH_DOMAIN=bflow-jbbj.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=bflow-jbbj
VITE_FIREBASE_STORAGE_BUCKET=bflow-jbbj.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=123456789
VITE_FIREBASE_APP_ID=1:123456789:web:abcdef
```

### 4. Firebase 초기화 코드

`src/config/firebase.ts`:
```typescript
import { initializeApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
};

export const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);
export const googleProvider = new GoogleAuthProvider();
```

### 5. Authentication 설정

Firebase Console에서:
1. Authentication → Sign-in method
2. Google 활성화
3. 프로젝트 지원 이메일 설정 (본인 이메일)
4. 저장

### 6. Firestore 설정

Firebase Console에서:
1. Firestore Database → 데이터베이스 만들기
2. 위치: `asia-northeast3` (서울)
3. 보안 규칙: 테스트 모드로 시작 (나중에 수정)

---

## Firestore 보안 규칙

`firestore.rules`:
```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {

    // 인증된 사용자만 접근
    function isAuthenticated() {
      return request.auth != null;
    }

    // 본인 데이터만 접근
    function isOwner(userId) {
      return request.auth.uid == userId;
    }

    // 같은 팀 멤버인지 확인
    function isTeamMember(teamId) {
      return exists(/databases/$(database)/documents/teams/$(teamId)/members/$(request.auth.uid));
    }

    // 사용자 정보
    match /users/{userId} {
      allow read: if isAuthenticated();
      allow write: if isOwner(userId);
    }

    // 팀 정보
    match /teams/{teamId} {
      allow read: if isAuthenticated() && isTeamMember(teamId);
      allow write: if isAuthenticated() && isTeamMember(teamId);

      match /members/{memberId} {
        allow read, write: if isAuthenticated() && isTeamMember(teamId);
      }
    }

    // 프로젝트 (팀 멤버만)
    match /projects/{projectId} {
      allow read, write: if isAuthenticated();
    }

    // 에피소드 (팀 멤버만)
    match /episodes/{episodeId} {
      allow read, write: if isAuthenticated();
    }

    // 팀 태스크 (팀 멤버만)
    match /tasks/{taskId} {
      allow read, write: if isAuthenticated();
    }

    // 캘린더 이벤트
    match /calendarEvents/{eventId} {
      // 팀 이벤트: 모든 인증 사용자
      // 개인 이벤트: 본인 또는 공유 대상만
      allow read: if isAuthenticated() && (
        resource.data.visibility == 'team' ||
        resource.data.ownerId == request.auth.uid ||
        request.auth.uid in resource.data.sharedWith
      );
      allow create: if isAuthenticated();
      allow update, delete: if isAuthenticated() && resource.data.ownerId == request.auth.uid;
    }

    // 개인 할 일 (본인만)
    match /personalTodos/{todoId} {
      allow read, write: if isAuthenticated() && resource.data.userId == request.auth.uid;
      allow create: if isAuthenticated() && request.resource.data.userId == request.auth.uid;
    }

    // 개인 메모 (본인만)
    match /personalMemos/{memoId} {
      allow read, write: if isAuthenticated() && resource.data.userId == request.auth.uid;
      allow create: if isAuthenticated() && request.resource.data.userId == request.auth.uid;
    }

    // 캘린더 그룹
    match /calendarGroups/{groupId} {
      allow read: if isAuthenticated() && (
        resource.data.isTeam == true ||
        resource.data.ownerId == request.auth.uid
      );
      allow write: if isAuthenticated() && resource.data.ownerId == request.auth.uid;
      allow create: if isAuthenticated();
    }
  }
}
```

---

## 상태 관리 (Zustand)

### Auth Store 예시

```typescript
// src/stores/useAuthStore.ts
import { create } from 'zustand';
import { User } from 'firebase/auth';

interface AuthState {
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  setUser: (user: User | null) => void;
  setLoading: (loading: boolean) => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  isLoading: true,
  isAuthenticated: false,
  setUser: (user) => set({ user, isAuthenticated: !!user }),
  setLoading: (isLoading) => set({ isLoading }),
}));
```

### App Store 예시

```typescript
// src/stores/useAppStore.ts
import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface AppState {
  theme: 'dark' | 'light';
  accentColor: string;
  sidebarCollapsed: boolean;
  toggleTheme: () => void;
  setAccentColor: (color: string) => void;
  toggleSidebar: () => void;
}

export const useAppStore = create<AppState>()(
  persist(
    (set) => ({
      theme: 'dark',
      accentColor: '#F0E68C',
      sidebarCollapsed: false,
      toggleTheme: () => set((s) => ({ theme: s.theme === 'dark' ? 'light' : 'dark' })),
      setAccentColor: (accentColor) => set({ accentColor }),
      toggleSidebar: () => set((s) => ({ sidebarCollapsed: !s.sidebarCollapsed })),
    }),
    { name: 'bflow-app-settings' }
  )
);
```

---

## 라우팅 구조

React Router v6 사용:

```typescript
// src/App.tsx
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthGuard } from './components/auth/AuthGuard';
import { MainLayout } from './components/layout/MainLayout';
import { LoginPage } from './components/auth/LoginPage';
// ... views

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route element={<AuthGuard><MainLayout /></AuthGuard>}>
          <Route path="/" element={<Dashboard />} />
          <Route path="/calendar" element={<CalendarView />} />
          <Route path="/gantt" element={<GanttView />} />
          <Route path="/team" element={<TeamView />} />
          <Route path="/nodemap" element={<NodeMapView />} />
          <Route path="/todos" element={<TodoView />} />
          <Route path="/settings" element={<SettingsView />} />
        </Route>
        <Route path="*" element={<Navigate to="/" />} />
      </Routes>
    </BrowserRouter>
  );
}
```

---

## 배포 (Firebase Hosting)

### 설치 및 초기화

```bash
npm install -g firebase-tools
firebase login
firebase init hosting
```

### firebase.json 설정

```json
{
  "hosting": {
    "public": "dist",
    "ignore": ["firebase.json", "**/.*", "**/node_modules/**"],
    "rewrites": [
      {
        "source": "**",
        "destination": "/index.html"
      }
    ],
    "headers": [
      {
        "source": "/**",
        "headers": [
          {
            "key": "Cache-Control",
            "value": "no-cache"
          }
        ]
      },
      {
        "source": "**/*.@(js|css|jpg|png|gif|svg|woff2)",
        "headers": [
          {
            "key": "Cache-Control",
            "value": "max-age=31536000"
          }
        ]
      }
    ]
  }
}
```

### 배포 명령어

```bash
npm run build
firebase deploy --only hosting
```

---

## PWA 설정

### manifest.json

```json
{
  "name": "Bflow",
  "short_name": "Bflow",
  "description": "Team & Personal Productivity for JBBJ Studio",
  "start_url": "/",
  "display": "standalone",
  "background_color": "#111827",
  "theme_color": "#F0E68C",
  "icons": [
    {
      "src": "/icons/icon-192.png",
      "sizes": "192x192",
      "type": "image/png"
    },
    {
      "src": "/icons/icon-512.png",
      "sizes": "512x512",
      "type": "image/png"
    }
  ]
}
```

### Vite PWA 플러그인 (vite.config.ts)

```typescript
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['favicon.ico', 'icons/*.png'],
      manifest: {
        name: 'Bflow',
        short_name: 'Bflow',
        theme_color: '#F0E68C',
        background_color: '#111827',
        display: 'standalone',
        icons: [
          { src: '/icons/icon-192.png', sizes: '192x192', type: 'image/png' },
          { src: '/icons/icon-512.png', sizes: '512x512', type: 'image/png' },
        ],
      },
    }),
  ],
});
```
