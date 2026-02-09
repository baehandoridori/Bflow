# Bflow 디자인 시스템

---

## 브랜드

| 속성 | 값 |
|------|-----|
| 앱 이름 | Bflow |
| 브랜드 컬러 | `#F0E68C` (Khaki Gold) |
| 폰트 | Pretendard (한글) / Inter (영문) |

---

## 컬러 팔레트

### 브랜드 컬러

```css
--brand: #F0E68C;
--brand-dark: #D4CA6A;
--brand-light: #F5EDA8;
```

### 다크 테마 (기본)

```css
--dark-bg: #111827;           /* gray-900 - 배경 */
--dark-surface: #1F2937;      /* gray-800 - 카드/패널 */
--dark-surface-hover: #374151; /* gray-700 - 호버 */
--dark-border: #374151;        /* gray-700 - 테두리 */
--dark-text: #F9FAFB;          /* gray-50 - 주요 텍스트 */
--dark-text-secondary: #9CA3AF; /* gray-400 - 보조 텍스트 */
--dark-text-muted: #6B7280;    /* gray-500 - 비활성 텍스트 */
```

### 라이트 테마

```css
--light-bg: #F3F4F6;           /* gray-100 */
--light-surface: #FFFFFF;
--light-surface-hover: #F9FAFB;
--light-border: #E5E7EB;        /* gray-200 */
--light-text: #111827;          /* gray-900 */
--light-text-secondary: #6B7280; /* gray-500 */
```

### 상태 컬러

```css
--status-working: #22C55E;    /* green-500 - 작업 중 */
--status-review: #F59E0B;     /* amber-500 - 리뷰 */
--status-done: #6366F1;       /* indigo-500 - 완료 */
--status-waiting: #6B7280;    /* gray-500 - 대기 */
--status-absent: #EF4444;     /* red-500 - 부재 */
```

### 우선순위 컬러

```css
--priority-high: #EF4444;     /* red-500 */
--priority-medium: #F59E0B;   /* amber-500 */
--priority-low: #6B7280;      /* gray-500 */
```

### 이벤트 타입 컬러

```css
--event-deadline: #EF4444;    /* red-500 */
--event-meeting: #3B82F6;     /* blue-500 */
--event-milestone: #F0E68C;   /* brand */
--event-task: #A855F7;        /* purple-500 */
--event-holiday: #EF4444;     /* red-500 */
--event-personal: #22C55E;    /* green-500 */
```

---

## Tailwind 설정

### tailwind.config.js

```javascript
/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
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
      animation: {
        'pulse-slow': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'shimmer': 'shimmer 2s linear infinite',
      },
      keyframes: {
        shimmer: {
          '0%': { transform: 'translateX(-100%)' },
          '100%': { transform: 'translateX(100%)' },
        },
      },
    },
  },
  plugins: [],
};
```

---

## 타이포그래피

### 폰트 패밀리

```css
font-family: 'Pretendard', 'Inter', system-ui, -apple-system, sans-serif;
```

### 폰트 CDN

```css
@import url('https://cdn.jsdelivr.net/gh/orioncactus/pretendard/dist/web/static/pretendard.css');
```

### 크기 스케일

| 용도 | 클래스 | 크기 |
|------|--------|------|
| 대제목 | `text-2xl` | 1.5rem (24px) |
| 제목 | `text-xl` | 1.25rem (20px) |
| 부제목 | `text-lg` | 1.125rem (18px) |
| 본문 | `text-base` | 1rem (16px) |
| 보조 | `text-sm` | 0.875rem (14px) |
| 캡션 | `text-xs` | 0.75rem (12px) |

### 굵기

| 용도 | 클래스 |
|------|--------|
| 헤딩 | `font-bold` (700) |
| 강조 | `font-semibold` (600) |
| 일반 | `font-medium` (500) |
| 본문 | `font-normal` (400) |

---

## 간격 (Spacing)

Tailwind 기본 스케일 사용:

| 값 | 크기 | 용도 |
|-----|------|------|
| 1 | 0.25rem (4px) | 인라인 요소 간격 |
| 2 | 0.5rem (8px) | 밀집 간격 |
| 3 | 0.75rem (12px) | 기본 내부 패딩 |
| 4 | 1rem (16px) | 컴포넌트 간격 |
| 6 | 1.5rem (24px) | 섹션 간격 |
| 8 | 2rem (32px) | 큰 섹션 간격 |

---

## 모서리 반경 (Border Radius)

| 클래스 | 크기 | 용도 |
|--------|------|------|
| `rounded` | 0.25rem | 작은 요소 |
| `rounded-lg` | 0.5rem | 버튼, 입력 필드 |
| `rounded-xl` | 0.75rem | 카드 |
| `rounded-2xl` | 1rem | 모달, 큰 패널 |
| `rounded-full` | 50% | 아바타, 뱃지 |

---

## 그림자 (Shadow)

```css
/* 기본 */
shadow-sm: 0 1px 2px rgba(0, 0, 0, 0.05);
shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
shadow-md: 0 4px 6px rgba(0, 0, 0, 0.1);
shadow-lg: 0 10px 15px rgba(0, 0, 0, 0.1);
shadow-xl: 0 20px 25px rgba(0, 0, 0, 0.1);

/* 다크 테마에서는 그림자 대신 border 사용 권장 */
```

---

## 공통 컴포넌트 스타일

### 버튼

```tsx
// Primary
className="px-4 py-2 bg-brand text-gray-900 rounded-lg font-medium hover:bg-brand-dark transition-colors"

// Secondary
className="px-4 py-2 bg-gray-700 text-white rounded-lg font-medium hover:bg-gray-600 transition-colors"

// Ghost
className="px-4 py-2 text-gray-400 rounded-lg font-medium hover:bg-gray-700 hover:text-white transition-colors"

// Danger
className="px-4 py-2 bg-red-500/10 text-red-400 rounded-lg font-medium hover:bg-red-500/20 transition-colors"

// Icon Button
className="p-2 rounded-lg hover:bg-gray-700 transition-colors"
```

### 입력 필드

```tsx
className="w-full bg-gray-700 rounded-lg px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-brand"
```

### 카드

```tsx
className="bg-gray-800 rounded-xl p-4 border border-gray-700"
```

### 모달 오버레이

```tsx
className="fixed inset-0 bg-black/50 flex items-center justify-center z-50"
```

### 툴팁

```tsx
className="absolute bg-gray-900 rounded-lg p-3 shadow-xl border border-gray-700 text-sm z-50"
```

---

## 애니메이션

### Framer Motion Variants

```typescript
// 페이드 인
export const fadeIn = {
  initial: { opacity: 0 },
  animate: { opacity: 1 },
  exit: { opacity: 0 },
};

// 슬라이드 업
export const slideUp = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: 20 },
};

// 스케일 인
export const scaleIn = {
  initial: { opacity: 0, scale: 0.95 },
  animate: { opacity: 1, scale: 1 },
  exit: { opacity: 0, scale: 0.95 },
};

// 리스트 아이템
export const listItem = {
  initial: { opacity: 0, x: -20 },
  animate: { opacity: 1, x: 0 },
  exit: { opacity: 0, x: -20 },
};
```

### 트랜지션 설정

```typescript
// 빠른 트랜지션
export const fastTransition = { duration: 0.15 };

// 기본 트랜지션
export const defaultTransition = { duration: 0.2 };

// 부드러운 트랜지션
export const smoothTransition = { duration: 0.3, ease: 'easeOut' };

// 스프링
export const springTransition = { type: 'spring', stiffness: 300, damping: 30 };
```

---

## 아이콘

### Lucide React 사용

```bash
npm install lucide-react
```

### 자주 사용하는 아이콘

```tsx
import {
  // 네비게이션
  LayoutDashboard,
  Calendar,
  GanttChart,
  Users,
  Network,
  CheckSquare,
  Settings,

  // 액션
  Plus,
  Edit2,
  Trash2,
  X,
  Check,
  ChevronLeft,
  ChevronRight,

  // 상태
  Eye,
  EyeOff,
  Pin,
  Flag,
  Calendar as CalendarIcon,
  Clock,

  // 기타
  Sun,
  Moon,
  LogOut,
  ZoomIn,
  ZoomOut,
  Maximize2,
  AlertTriangle,
  RefreshCw,
} from 'lucide-react';

// 기본 크기
<Icon className="w-5 h-5" />

// 작은 크기
<Icon className="w-4 h-4" />

// 큰 크기
<Icon className="w-6 h-6" />
```

---

## 반응형 브레이크포인트

```css
/* Tailwind 기본값 사용 */
sm: 640px   /* 모바일 가로 */
md: 768px   /* 태블릿 */
lg: 1024px  /* 작은 데스크톱 */
xl: 1280px  /* 데스크톱 */
2xl: 1536px /* 큰 데스크톱 */
```

**참고**: Bflow는 데스크톱 우선이므로 모바일 최적화는 우선순위가 낮습니다.

---

## 피해야 할 패턴 (Anti-patterns)

| 피할 것 | 대신 사용할 것 |
|---------|---------------|
| 이모지 범벅 UI | 깔끔한 아이콘 + 텍스트 |
| 보라색 그라데이션 | 브랜드 컬러 (Khaki Gold) |
| 무거운 애니메이션 | 가벼운 트랜지션 |
| 과한 그림자 (라이트 모드) | 테두리 또는 미묘한 그림자 |
| 너무 작은 클릭 영역 | 최소 44x44px |
| 저대비 텍스트 | WCAG 4.5:1 이상 |

---

## 디자인 레퍼런스

- **전체 톤**: Slack 앱
- **UX**: Monday.com, Notion
- **노드맵**: Obsidian 그래프 뷰
- **인터랙션**: Raycast 홈페이지
