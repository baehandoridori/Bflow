# Phase 1: 기반 구축

> 프로젝트 세팅, Firebase 연동, 로그인, 기본 레이아웃

---

## 목표

Phase 1이 완료되면:
- Vite + React + TypeScript + Tailwind 프로젝트가 동작
- Firebase Auth로 Google 로그인 가능
- 로그인 후 기본 레이아웃(사이드바 + 헤더 + 컨텐츠 영역)이 표시
- 다크/라이트 테마 전환 가능

---

## Step 1.1: 프로젝트 초기화

### 명령어

```bash
cd /home/user/Bflow
npm create vite@latest . -- --template react-ts
npm install
```

### 의존성 설치

```bash
# Core
npm install react-router-dom zustand

# Firebase
npm install firebase

# Styling & Animation
npm install tailwindcss postcss autoprefixer
npm install framer-motion
npm install clsx tailwind-merge

# Icons & Utils
npm install lucide-react
npm install date-fns

# D3 (간트/노드맵용 - Phase 4,5에서 사용)
npm install d3 @types/d3

# PWA
npm install -D vite-plugin-pwa
```

### Tailwind 초기화

```bash
npx tailwindcss init -p
```

### tailwind.config.js

```javascript
/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        brand: {
          DEFAULT: '#F0E68C',
          dark: '#D4CA6A',
          light: '#F5EDA8',
        },
      },
      fontFamily: {
        sans: ['Pretendard', 'Inter', 'system-ui', 'sans-serif'],
      },
    },
  },
  plugins: [],
}
```

### src/index.css

```css
@tailwind base;
@tailwind components;
@tailwind utilities;

@layer base {
  body {
    @apply bg-gray-100 dark:bg-gray-900 text-gray-900 dark:text-gray-100;
    @apply transition-colors duration-200;
  }
}

/* Pretendard 폰트 (CDN) */
@import url('https://cdn.jsdelivr.net/gh/orioncactus/pretendard/dist/web/static/pretendard.css');
```

---

## Step 1.2: Firebase 설정

### src/config/firebase.ts

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

// 한국어 설정
googleProvider.setCustomParameters({
  prompt: 'select_account'
});
```

### .env.local (예시 - 실제 값으로 교체 필요)

```env
VITE_FIREBASE_API_KEY=AIzaSy...
VITE_FIREBASE_AUTH_DOMAIN=bflow-jbbj.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=bflow-jbbj
VITE_FIREBASE_STORAGE_BUCKET=bflow-jbbj.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=123456789
VITE_FIREBASE_APP_ID=1:123456789:web:abcdef
```

### .env.example

```env
VITE_FIREBASE_API_KEY=
VITE_FIREBASE_AUTH_DOMAIN=
VITE_FIREBASE_PROJECT_ID=
VITE_FIREBASE_STORAGE_BUCKET=
VITE_FIREBASE_MESSAGING_SENDER_ID=
VITE_FIREBASE_APP_ID=
```

---

## Step 1.3: 유틸리티 함수

### src/utils/cn.ts

```typescript
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}
```

---

## Step 1.4: Auth Store

### src/stores/useAuthStore.ts

```typescript
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
  setUser: (user) => set({
    user,
    isAuthenticated: !!user,
    isLoading: false,
  }),
  setLoading: (isLoading) => set({ isLoading }),
}));
```

### src/stores/useAppStore.ts

```typescript
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
      toggleTheme: () =>
        set((state) => ({
          theme: state.theme === 'dark' ? 'light' : 'dark',
        })),
      setAccentColor: (accentColor) => set({ accentColor }),
      toggleSidebar: () =>
        set((state) => ({
          sidebarCollapsed: !state.sidebarCollapsed,
        })),
    }),
    {
      name: 'bflow-app-settings',
    }
  )
);
```

---

## Step 1.5: Auth 서비스

### src/services/auth.ts

```typescript
import {
  signInWithPopup,
  signOut as firebaseSignOut,
  onAuthStateChanged,
  User,
} from 'firebase/auth';
import { doc, getDoc, setDoc, serverTimestamp } from 'firebase/firestore';
import { auth, googleProvider, db } from '../config/firebase';

// Google 로그인
export async function signInWithGoogle(): Promise<User> {
  const result = await signInWithPopup(auth, googleProvider);
  const user = result.user;

  // Firestore에 사용자 정보 저장/업데이트
  const userRef = doc(db, 'users', user.uid);
  const userSnap = await getDoc(userRef);

  if (!userSnap.exists()) {
    // 신규 사용자
    await setDoc(userRef, {
      email: user.email,
      displayName: user.displayName,
      photoURL: user.photoURL,
      role: 'member',
      teamId: 'default-team', // 초기 팀 (나중에 설정)
      status: 'active',
      createdAt: serverTimestamp(),
      lastLoginAt: serverTimestamp(),
    });
  } else {
    // 기존 사용자 - 마지막 로그인 시간 업데이트
    await setDoc(userRef, {
      lastLoginAt: serverTimestamp(),
    }, { merge: true });
  }

  return user;
}

// 로그아웃
export async function signOut(): Promise<void> {
  await firebaseSignOut(auth);
}

// 인증 상태 리스너
export function onAuthChange(callback: (user: User | null) => void) {
  return onAuthStateChanged(auth, callback);
}
```

---

## Step 1.6: 로그인 페이지

### src/components/auth/LoginPage.tsx

```typescript
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { signInWithGoogle } from '../../services/auth';

export function LoginPage() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();

  const handleGoogleLogin = async () => {
    setIsLoading(true);
    setError(null);

    try {
      await signInWithGoogle();
      navigate('/');
    } catch (err) {
      console.error('Login error:', err);
      setError('로그인에 실패했습니다. 다시 시도해주세요.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-900">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-gray-800 rounded-2xl p-8 w-full max-w-md shadow-xl"
      >
        {/* 로고 */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-brand">Bflow</h1>
          <p className="text-gray-400 mt-2">
            Studio JBBJ 팀 생산성 도구
          </p>
        </div>

        {/* 에러 메시지 */}
        {error && (
          <div className="bg-red-500/10 border border-red-500/50 text-red-400 rounded-lg p-3 mb-4 text-sm">
            {error}
          </div>
        )}

        {/* Google 로그인 버튼 */}
        <button
          onClick={handleGoogleLogin}
          disabled={isLoading}
          className="w-full flex items-center justify-center gap-3 bg-white text-gray-800 rounded-lg py-3 px-4 font-medium hover:bg-gray-100 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isLoading ? (
            <div className="w-5 h-5 border-2 border-gray-400 border-t-transparent rounded-full animate-spin" />
          ) : (
            <>
              <svg className="w-5 h-5" viewBox="0 0 24 24">
                <path
                  fill="currentColor"
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                />
                <path
                  fill="currentColor"
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                />
                <path
                  fill="currentColor"
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                />
                <path
                  fill="currentColor"
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                />
              </svg>
              Google로 로그인
            </>
          )}
        </button>

        {/* 팀 전용 안내 */}
        <p className="text-center text-gray-500 text-sm mt-6">
          Studio JBBJ 팀원만 접근할 수 있습니다
        </p>
      </motion.div>
    </div>
  );
}
```

### src/components/auth/AuthGuard.tsx

```typescript
import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../../stores/useAuthStore';
import { onAuthChange } from '../../services/auth';

interface AuthGuardProps {
  children: React.ReactNode;
}

export function AuthGuard({ children }: AuthGuardProps) {
  const { isAuthenticated, isLoading, setUser } = useAuthStore();
  const navigate = useNavigate();

  useEffect(() => {
    const unsubscribe = onAuthChange((user) => {
      setUser(user);
      if (!user) {
        navigate('/login');
      }
    });

    return () => unsubscribe();
  }, [setUser, navigate]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-900">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-brand border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-gray-400 mt-4">로딩 중...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return null;
  }

  return <>{children}</>;
}
```

---

## Step 1.7: 레이아웃 컴포넌트

### src/components/layout/MainLayout.tsx

```typescript
import { Outlet } from 'react-router-dom';
import { useEffect } from 'react';
import { Sidebar } from './Sidebar';
import { Header } from './Header';
import { useAppStore } from '../../stores/useAppStore';

export function MainLayout() {
  const { theme, sidebarCollapsed } = useAppStore();

  // 테마 적용
  useEffect(() => {
    document.documentElement.classList.toggle('dark', theme === 'dark');
  }, [theme]);

  return (
    <div className="min-h-screen flex">
      {/* 사이드바 */}
      <Sidebar />

      {/* 메인 컨텐츠 */}
      <div
        className={`flex-1 flex flex-col transition-all duration-300 ${
          sidebarCollapsed ? 'ml-16' : 'ml-64'
        }`}
      >
        <Header />
        <main className="flex-1 p-6 overflow-auto">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
```

### src/components/layout/Sidebar.tsx

```typescript
import { NavLink } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  LayoutDashboard,
  Calendar,
  GanttChart,
  Users,
  Network,
  CheckSquare,
  Settings,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';
import { useAppStore } from '../../stores/useAppStore';
import { cn } from '../../utils/cn';

const navItems = [
  { path: '/', icon: LayoutDashboard, label: '대시보드' },
  { path: '/calendar', icon: Calendar, label: '캘린더' },
  { path: '/gantt', icon: GanttChart, label: '간트 차트' },
  { path: '/team', icon: Users, label: '팀 현황' },
  { path: '/nodemap', icon: Network, label: '노드맵' },
  { path: '/todos', icon: CheckSquare, label: '할 일' },
];

export function Sidebar() {
  const { sidebarCollapsed, toggleSidebar, accentColor } = useAppStore();

  return (
    <motion.aside
      initial={false}
      animate={{ width: sidebarCollapsed ? 64 : 256 }}
      className="fixed left-0 top-0 h-screen bg-gray-800 border-r border-gray-700 flex flex-col z-50"
    >
      {/* 로고 */}
      <div className="h-16 flex items-center justify-between px-4 border-b border-gray-700">
        {!sidebarCollapsed && (
          <motion.span
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-2xl font-bold"
            style={{ color: accentColor }}
          >
            Bflow
          </motion.span>
        )}
        <button
          onClick={toggleSidebar}
          className="p-2 rounded-lg hover:bg-gray-700 transition-colors"
        >
          {sidebarCollapsed ? (
            <ChevronRight className="w-5 h-5" />
          ) : (
            <ChevronLeft className="w-5 h-5" />
          )}
        </button>
      </div>

      {/* 네비게이션 */}
      <nav className="flex-1 py-4">
        {navItems.map((item) => (
          <NavLink
            key={item.path}
            to={item.path}
            className={({ isActive }) =>
              cn(
                'flex items-center gap-3 px-4 py-3 mx-2 rounded-lg transition-colors',
                isActive
                  ? 'bg-brand/20 text-brand'
                  : 'text-gray-400 hover:bg-gray-700 hover:text-white'
              )
            }
          >
            <item.icon className="w-5 h-5 flex-shrink-0" />
            {!sidebarCollapsed && (
              <motion.span
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="truncate"
              >
                {item.label}
              </motion.span>
            )}
          </NavLink>
        ))}
      </nav>

      {/* 설정 */}
      <div className="border-t border-gray-700 py-4">
        <NavLink
          to="/settings"
          className={({ isActive }) =>
            cn(
              'flex items-center gap-3 px-4 py-3 mx-2 rounded-lg transition-colors',
              isActive
                ? 'bg-brand/20 text-brand'
                : 'text-gray-400 hover:bg-gray-700 hover:text-white'
            )
          }
        >
          <Settings className="w-5 h-5 flex-shrink-0" />
          {!sidebarCollapsed && <span>설정</span>}
        </NavLink>
      </div>
    </motion.aside>
  );
}
```

### src/components/layout/Header.tsx

```typescript
import { Moon, Sun, LogOut } from 'lucide-react';
import { useAuthStore } from '../../stores/useAuthStore';
import { useAppStore } from '../../stores/useAppStore';
import { signOut } from '../../services/auth';

export function Header() {
  const { user } = useAuthStore();
  const { theme, toggleTheme } = useAppStore();

  const handleLogout = async () => {
    await signOut();
  };

  return (
    <header className="h-16 bg-gray-800 border-b border-gray-700 flex items-center justify-between px-6">
      {/* 페이지 타이틀 (추후 동적으로) */}
      <div />

      {/* 우측 액션 */}
      <div className="flex items-center gap-4">
        {/* 테마 토글 */}
        <button
          onClick={toggleTheme}
          className="p-2 rounded-lg hover:bg-gray-700 transition-colors"
        >
          {theme === 'dark' ? (
            <Sun className="w-5 h-5 text-yellow-400" />
          ) : (
            <Moon className="w-5 h-5 text-gray-400" />
          )}
        </button>

        {/* 프로필 */}
        <div className="flex items-center gap-3">
          {user?.photoURL ? (
            <img
              src={user.photoURL}
              alt={user.displayName || ''}
              className="w-8 h-8 rounded-full"
            />
          ) : (
            <div className="w-8 h-8 rounded-full bg-gray-600" />
          )}
          <span className="text-sm text-gray-300">
            {user?.displayName}
          </span>
        </div>

        {/* 로그아웃 */}
        <button
          onClick={handleLogout}
          className="p-2 rounded-lg hover:bg-gray-700 transition-colors text-gray-400 hover:text-red-400"
        >
          <LogOut className="w-5 h-5" />
        </button>
      </div>
    </header>
  );
}
```

---

## Step 1.8: 임시 페이지 (Placeholder)

### src/views/Dashboard.tsx

```typescript
export function Dashboard() {
  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">대시보드</h1>
      <p className="text-gray-400">Phase 2에서 구현 예정</p>
    </div>
  );
}
```

다른 뷰 파일들도 같은 패턴으로 생성:
- `src/views/CalendarView.tsx`
- `src/views/GanttView.tsx`
- `src/views/TeamView.tsx`
- `src/views/NodeMapView.tsx`
- `src/views/TodoView.tsx`
- `src/views/SettingsView.tsx`

---

## Step 1.9: App 라우팅

### src/App.tsx

```typescript
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthGuard } from './components/auth/AuthGuard';
import { MainLayout } from './components/layout/MainLayout';
import { LoginPage } from './components/auth/LoginPage';
import { Dashboard } from './views/Dashboard';
import { CalendarView } from './views/CalendarView';
import { GanttView } from './views/GanttView';
import { TeamView } from './views/TeamView';
import { NodeMapView } from './views/NodeMapView';
import { TodoView } from './views/TodoView';
import { SettingsView } from './views/SettingsView';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* 로그인 페이지 */}
        <Route path="/login" element={<LoginPage />} />

        {/* 인증 필요한 라우트 */}
        <Route
          element={
            <AuthGuard>
              <MainLayout />
            </AuthGuard>
          }
        >
          <Route path="/" element={<Dashboard />} />
          <Route path="/calendar" element={<CalendarView />} />
          <Route path="/gantt" element={<GanttView />} />
          <Route path="/team" element={<TeamView />} />
          <Route path="/nodemap" element={<NodeMapView />} />
          <Route path="/todos" element={<TodoView />} />
          <Route path="/settings" element={<SettingsView />} />
        </Route>

        {/* 404 리다이렉트 */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
```

### src/main.tsx

```typescript
import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import './index.css';

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
```

---

## Step 1.10: 테스트 실행

```bash
npm run dev
```

확인 사항:
- [ ] 개발 서버가 정상 실행되는가?
- [ ] `/login`으로 리다이렉트되는가?
- [ ] Google 로그인이 작동하는가?
- [ ] 로그인 후 대시보드가 표시되는가?
- [ ] 사이드바 네비게이션이 작동하는가?
- [ ] 다크/라이트 테마 전환이 작동하는가?
- [ ] 로그아웃이 작동하는가?

---

## Phase 1 완료 체크리스트

- [ ] Vite + React + TypeScript 프로젝트 생성
- [ ] Tailwind CSS 설정
- [ ] Firebase 프로젝트 생성 및 설정
- [ ] Google OAuth 활성화
- [ ] Firestore 데이터베이스 생성
- [ ] 환경 변수 설정 (.env.local)
- [ ] Auth Store 구현
- [ ] App Store 구현 (테마, 사이드바)
- [ ] 로그인 페이지 구현
- [ ] AuthGuard 구현
- [ ] MainLayout 구현
- [ ] Sidebar 구현
- [ ] Header 구현
- [ ] 라우팅 설정
- [ ] 다크/라이트 테마 전환
- [ ] 로그인/로그아웃 동작 확인
