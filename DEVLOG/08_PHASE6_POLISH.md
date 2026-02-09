# Phase 6: 폴리싱

> 애니메이션, 성능 최적화, PWA, 에러 핸들링

---

## 목표

Phase 6이 완료되면:
- 모든 인터랙션에 부드러운 애니메이션
- 컨페티, 3D 틸트 등 마이크로 인터랙션
- PWA 설치 가능
- 에러 바운더리 및 로딩 상태 처리
- 성능 최적화 (메모이제이션, 레이지 로딩)

---

## Step 6.1: 컨페티 효과

### src/components/effects/Confetti.tsx

```typescript
import { useEffect, useRef } from 'react';
import confetti from 'canvas-confetti';

interface ConfettiProps {
  trigger: boolean;
  onComplete?: () => void;
}

export function Confetti({ trigger, onComplete }: ConfettiProps) {
  const hasFired = useRef(false);

  useEffect(() => {
    if (trigger && !hasFired.current) {
      hasFired.current = true;

      // 골드 테마 컨페티
      const colors = ['#F0E68C', '#D4CA6A', '#FFD700', '#FFA500'];

      confetti({
        particleCount: 100,
        spread: 70,
        origin: { y: 0.6 },
        colors,
      });

      // 두 번째 발사 (약간의 딜레이)
      setTimeout(() => {
        confetti({
          particleCount: 50,
          angle: 60,
          spread: 55,
          origin: { x: 0 },
          colors,
        });
        confetti({
          particleCount: 50,
          angle: 120,
          spread: 55,
          origin: { x: 1 },
          colors,
        });
      }, 150);

      setTimeout(() => {
        hasFired.current = false;
        onComplete?.();
      }, 2000);
    }
  }, [trigger, onComplete]);

  return null;
}
```

**설치**: `npm install canvas-confetti @types/canvas-confetti`

---

## Step 6.2: 3D 틸트 카드

### src/hooks/useTilt.ts

```typescript
import { useRef, useCallback } from 'react';

interface TiltOptions {
  max?: number;       // 최대 기울기 (도)
  perspective?: number;
  scale?: number;
  speed?: number;
  glare?: boolean;
  maxGlare?: number;
}

export function useTilt(options: TiltOptions = {}) {
  const {
    max = 15,
    perspective = 1000,
    scale = 1.05,
    speed = 400,
    glare = true,
    maxGlare = 0.3,
  } = options;

  const ref = useRef<HTMLDivElement>(null);
  const glareRef = useRef<HTMLDivElement>(null);

  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    if (!ref.current) return;

    const rect = ref.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    const centerX = rect.width / 2;
    const centerY = rect.height / 2;

    const rotateX = ((y - centerY) / centerY) * -max;
    const rotateY = ((x - centerX) / centerX) * max;

    ref.current.style.transform = `
      perspective(${perspective}px)
      rotateX(${rotateX}deg)
      rotateY(${rotateY}deg)
      scale3d(${scale}, ${scale}, ${scale})
    `;
    ref.current.style.transition = `transform ${speed}ms ease-out`;

    // 글레어 효과
    if (glare && glareRef.current) {
      const angle = Math.atan2(y - centerY, x - centerX) * (180 / Math.PI);
      const distance = Math.sqrt((x - centerX) ** 2 + (y - centerY) ** 2);
      const maxDistance = Math.sqrt(centerX ** 2 + centerY ** 2);
      const opacity = (distance / maxDistance) * maxGlare;

      glareRef.current.style.background = `
        linear-gradient(
          ${angle + 90}deg,
          rgba(255,255,255,${opacity}) 0%,
          rgba(255,255,255,0) 80%
        )
      `;
    }
  }, [max, perspective, scale, speed, glare, maxGlare]);

  const handleMouseLeave = useCallback(() => {
    if (!ref.current) return;

    ref.current.style.transform = `
      perspective(${perspective}px)
      rotateX(0deg)
      rotateY(0deg)
      scale3d(1, 1, 1)
    `;

    if (glareRef.current) {
      glareRef.current.style.background = 'transparent';
    }
  }, [perspective]);

  return { ref, glareRef, handleMouseMove, handleMouseLeave };
}
```

### src/components/ui/TiltCard.tsx

```typescript
import { ReactNode } from 'react';
import { useTilt } from '../../hooks/useTilt';
import { cn } from '../../utils/cn';

interface TiltCardProps {
  children: ReactNode;
  className?: string;
}

export function TiltCard({ children, className }: TiltCardProps) {
  const { ref, glareRef, handleMouseMove, handleMouseLeave } = useTilt({
    max: 10,
    scale: 1.02,
    glare: true,
  });

  return (
    <div
      ref={ref}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      className={cn('relative overflow-hidden', className)}
    >
      {children}
      <div
        ref={glareRef}
        className="absolute inset-0 pointer-events-none"
      />
    </div>
  );
}
```

---

## Step 6.3: 스켈레톤 UI

### src/components/ui/Skeleton.tsx

```typescript
import { cn } from '../../utils/cn';

interface SkeletonProps {
  className?: string;
  variant?: 'text' | 'circular' | 'rectangular';
  width?: number | string;
  height?: number | string;
}

export function Skeleton({
  className,
  variant = 'text',
  width,
  height,
}: SkeletonProps) {
  const variantClasses = {
    text: 'rounded',
    circular: 'rounded-full',
    rectangular: 'rounded-lg',
  };

  return (
    <div
      className={cn(
        'animate-pulse bg-gray-700',
        variantClasses[variant],
        className
      )}
      style={{ width, height }}
    />
  );
}

// 카드 스켈레톤
export function CardSkeleton() {
  return (
    <div className="bg-gray-800 rounded-xl p-4 space-y-3">
      <Skeleton variant="rectangular" height={120} />
      <Skeleton variant="text" width="60%" height={20} />
      <Skeleton variant="text" width="40%" height={16} />
    </div>
  );
}

// 리스트 스켈레톤
export function ListSkeleton({ count = 5 }: { count?: number }) {
  return (
    <div className="space-y-3">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="flex items-center gap-3 p-3 bg-gray-800 rounded-lg">
          <Skeleton variant="circular" width={40} height={40} />
          <div className="flex-1 space-y-2">
            <Skeleton variant="text" width="70%" height={16} />
            <Skeleton variant="text" width="40%" height={12} />
          </div>
        </div>
      ))}
    </div>
  );
}
```

---

## Step 6.4: 에러 바운더리

### src/components/ErrorBoundary.tsx

```typescript
import { Component, ErrorInfo, ReactNode } from 'react';
import { AlertTriangle, RefreshCw } from 'lucide-react';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error?: Error;
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('ErrorBoundary caught an error:', error, errorInfo);
    // 여기서 에러 로깅 서비스에 전송 가능 (Sentry 등)
  }

  handleRetry = () => {
    this.setState({ hasError: false, error: undefined });
  };

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <div className="min-h-[200px] flex flex-col items-center justify-center text-center p-6">
          <AlertTriangle className="w-12 h-12 text-red-400 mb-4" />
          <h3 className="text-lg font-semibold mb-2">오류가 발생했습니다</h3>
          <p className="text-gray-400 text-sm mb-4">
            {this.state.error?.message || '알 수 없는 오류'}
          </p>
          <button
            onClick={this.handleRetry}
            className="flex items-center gap-2 px-4 py-2 bg-gray-700 hover:bg-gray-600 rounded-lg transition-colors"
          >
            <RefreshCw className="w-4 h-4" />
            다시 시도
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}
```

---

## Step 6.5: 토스트 알림

### src/components/ui/Toast.tsx

```typescript
import { create } from 'zustand';
import { motion, AnimatePresence } from 'framer-motion';
import { CheckCircle, XCircle, AlertCircle, X } from 'lucide-react';
import { cn } from '../../utils/cn';

type ToastType = 'success' | 'error' | 'warning' | 'info';

interface Toast {
  id: string;
  type: ToastType;
  message: string;
  duration?: number;
}

interface ToastState {
  toasts: Toast[];
  addToast: (toast: Omit<Toast, 'id'>) => void;
  removeToast: (id: string) => void;
}

export const useToast = create<ToastState>((set) => ({
  toasts: [],
  addToast: (toast) => {
    const id = Date.now().toString();
    set((state) => ({ toasts: [...state.toasts, { ...toast, id }] }));

    // 자동 제거
    setTimeout(() => {
      set((state) => ({ toasts: state.toasts.filter((t) => t.id !== id) }));
    }, toast.duration || 3000);
  },
  removeToast: (id) =>
    set((state) => ({ toasts: state.toasts.filter((t) => t.id !== id) })),
}));

// 편의 함수
export const toast = {
  success: (message: string) => useToast.getState().addToast({ type: 'success', message }),
  error: (message: string) => useToast.getState().addToast({ type: 'error', message }),
  warning: (message: string) => useToast.getState().addToast({ type: 'warning', message }),
  info: (message: string) => useToast.getState().addToast({ type: 'info', message }),
};

// 토스트 컨테이너 (App에 추가)
export function ToastContainer() {
  const { toasts, removeToast } = useToast();

  const icons = {
    success: CheckCircle,
    error: XCircle,
    warning: AlertCircle,
    info: AlertCircle,
  };

  const colors = {
    success: 'bg-green-500/20 border-green-500 text-green-400',
    error: 'bg-red-500/20 border-red-500 text-red-400',
    warning: 'bg-amber-500/20 border-amber-500 text-amber-400',
    info: 'bg-blue-500/20 border-blue-500 text-blue-400',
  };

  return (
    <div className="fixed bottom-4 right-4 z-50 space-y-2">
      <AnimatePresence>
        {toasts.map((t) => {
          const Icon = icons[t.type];
          return (
            <motion.div
              key={t.id}
              initial={{ opacity: 0, y: 20, x: 20 }}
              animate={{ opacity: 1, y: 0, x: 0 }}
              exit={{ opacity: 0, x: 100 }}
              className={cn(
                'flex items-center gap-3 px-4 py-3 rounded-lg border shadow-lg',
                colors[t.type]
              )}
            >
              <Icon className="w-5 h-5" />
              <span className="text-sm">{t.message}</span>
              <button
                onClick={() => removeToast(t.id)}
                className="p-1 hover:bg-white/10 rounded"
              >
                <X className="w-4 h-4" />
              </button>
            </motion.div>
          );
        })}
      </AnimatePresence>
    </div>
  );
}
```

---

## Step 6.6: 레이지 로딩

### src/App.tsx 수정

```typescript
import { Suspense, lazy } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthGuard } from './components/auth/AuthGuard';
import { MainLayout } from './components/layout/MainLayout';
import { LoginPage } from './components/auth/LoginPage';
import { ErrorBoundary } from './components/ErrorBoundary';
import { ToastContainer } from './components/ui/Toast';
import { ListSkeleton } from './components/ui/Skeleton';

// 레이지 로딩
const Dashboard = lazy(() => import('./views/Dashboard'));
const CalendarView = lazy(() => import('./views/CalendarView'));
const GanttView = lazy(() => import('./views/GanttView'));
const TeamView = lazy(() => import('./views/TeamView'));
const NodeMapView = lazy(() => import('./views/NodeMapView'));
const TodoView = lazy(() => import('./views/TodoView'));
const SettingsView = lazy(() => import('./views/SettingsView'));

function PageLoader() {
  return (
    <div className="p-6">
      <ListSkeleton count={5} />
    </div>
  );
}

function App() {
  return (
    <ErrorBoundary>
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route
            element={
              <AuthGuard>
                <MainLayout />
              </AuthGuard>
            }
          >
            <Route
              path="/"
              element={
                <Suspense fallback={<PageLoader />}>
                  <Dashboard />
                </Suspense>
              }
            />
            <Route
              path="/calendar"
              element={
                <Suspense fallback={<PageLoader />}>
                  <CalendarView />
                </Suspense>
              }
            />
            {/* ... 나머지 라우트도 동일하게 */}
          </Route>
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
        <ToastContainer />
      </BrowserRouter>
    </ErrorBoundary>
  );
}

export default App;
```

---

## Step 6.7: 성능 최적화

### 메모이제이션 적용

```typescript
// 컴포넌트 메모이제이션
import { memo } from 'react';

export const TodoItem = memo(function TodoItem({ todo, onToggle, onDelete }: TodoItemProps) {
  // ...
});

// 콜백 메모이제이션
import { useCallback, useMemo } from 'react';

function TodoList() {
  const handleToggle = useCallback((id: string) => {
    // ...
  }, []);

  const filteredTodos = useMemo(() => {
    return todos.filter((t) => /* ... */);
  }, [todos, filter]);
}
```

### 가상 스크롤 (대규모 목록용)

```bash
npm install @tanstack/react-virtual
```

```typescript
import { useVirtualizer } from '@tanstack/react-virtual';

function VirtualizedList({ items }: { items: any[] }) {
  const parentRef = useRef<HTMLDivElement>(null);

  const virtualizer = useVirtualizer({
    count: items.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => 60,
  });

  return (
    <div ref={parentRef} className="h-[500px] overflow-auto">
      <div
        style={{
          height: `${virtualizer.getTotalSize()}px`,
          position: 'relative',
        }}
      >
        {virtualizer.getVirtualItems().map((virtualItem) => (
          <div
            key={virtualItem.key}
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              width: '100%',
              height: `${virtualItem.size}px`,
              transform: `translateY(${virtualItem.start}px)`,
            }}
          >
            {/* 아이템 렌더링 */}
          </div>
        ))}
      </div>
    </div>
  );
}
```

---

## Step 6.8: PWA 완성

### vite.config.ts

```typescript
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['favicon.ico', 'robots.txt', 'icons/*.png'],
      manifest: {
        name: 'Bflow - Team Productivity',
        short_name: 'Bflow',
        description: 'Team & Personal Productivity for JBBJ Studio',
        theme_color: '#F0E68C',
        background_color: '#111827',
        display: 'standalone',
        orientation: 'portrait',
        start_url: '/',
        icons: [
          {
            src: '/icons/icon-72.png',
            sizes: '72x72',
            type: 'image/png',
          },
          {
            src: '/icons/icon-96.png',
            sizes: '96x96',
            type: 'image/png',
          },
          {
            src: '/icons/icon-128.png',
            sizes: '128x128',
            type: 'image/png',
          },
          {
            src: '/icons/icon-144.png',
            sizes: '144x144',
            type: 'image/png',
          },
          {
            src: '/icons/icon-152.png',
            sizes: '152x152',
            type: 'image/png',
          },
          {
            src: '/icons/icon-192.png',
            sizes: '192x192',
            type: 'image/png',
          },
          {
            src: '/icons/icon-384.png',
            sizes: '384x384',
            type: 'image/png',
          },
          {
            src: '/icons/icon-512.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'any maskable',
          },
        ],
      },
      workbox: {
        runtimeCaching: [
          {
            urlPattern: /^https:\/\/fonts\.googleapis\.com\/.*/i,
            handler: 'CacheFirst',
            options: {
              cacheName: 'google-fonts-cache',
              expiration: {
                maxEntries: 10,
                maxAgeSeconds: 60 * 60 * 24 * 365,
              },
            },
          },
          {
            urlPattern: /\.(?:png|jpg|jpeg|svg|gif)$/,
            handler: 'CacheFirst',
            options: {
              cacheName: 'images-cache',
              expiration: {
                maxEntries: 50,
                maxAgeSeconds: 60 * 60 * 24 * 30,
              },
            },
          },
        ],
      },
    }),
  ],
});
```

---

## Phase 6 완료 체크리스트

- [ ] 컨페티 효과 구현 (마일스톤 완료 시)
- [ ] 3D 틸트 카드 구현
- [ ] 스켈레톤 UI 구현
- [ ] 에러 바운더리 구현
- [ ] 토스트 알림 시스템 구현
- [ ] 레이지 로딩 적용
- [ ] React.memo 적용
- [ ] useMemo/useCallback 최적화
- [ ] PWA manifest 설정
- [ ] Service Worker 설정
- [ ] 오프라인 지원 확인
- [ ] Lighthouse 점수 확인 (90+ 목표)
