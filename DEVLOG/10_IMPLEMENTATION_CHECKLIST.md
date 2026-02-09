# Bflow 구현 체크리스트

> 이 체크리스트를 순서대로 완료하면 Bflow가 완성됩니다.

---

## 시작 전 준비

- [ ] Firebase 프로젝트 생성 (https://console.firebase.google.com)
- [ ] Firebase Authentication 활성화 (Google 로그인)
- [ ] Cloud Firestore 데이터베이스 생성 (asia-northeast3)
- [ ] Firebase Hosting 활성화
- [ ] Firebase SDK 설정값 복사

---

## Phase 1: 기반 구축

### 1.1 프로젝트 세팅

- [ ] `npm create vite@latest . -- --template react-ts` 실행
- [ ] 의존성 설치:
  ```
  npm install react-router-dom zustand firebase
  npm install tailwindcss postcss autoprefixer
  npm install framer-motion clsx tailwind-merge
  npm install lucide-react date-fns
  npm install d3 @types/d3
  npm install -D vite-plugin-pwa
  ```
- [ ] `npx tailwindcss init -p` 실행
- [ ] tailwind.config.js 설정
- [ ] src/index.css에 Tailwind 임포트 + Pretendard 폰트

### 1.2 Firebase 연결

- [ ] .env.local 파일 생성 (Firebase 설정값)
- [ ] .env.example 파일 생성
- [ ] src/config/firebase.ts 생성

### 1.3 유틸리티

- [ ] src/utils/cn.ts 생성 (classNames 유틸)

### 1.4 Stores

- [ ] src/stores/useAuthStore.ts 생성
- [ ] src/stores/useAppStore.ts 생성

### 1.5 서비스

- [ ] src/services/auth.ts 생성

### 1.6 인증 컴포넌트

- [ ] src/components/auth/LoginPage.tsx 생성
- [ ] src/components/auth/AuthGuard.tsx 생성

### 1.7 레이아웃 컴포넌트

- [ ] src/components/layout/MainLayout.tsx 생성
- [ ] src/components/layout/Sidebar.tsx 생성
- [ ] src/components/layout/Header.tsx 생성

### 1.8 뷰 (Placeholder)

- [ ] src/views/Dashboard.tsx 생성
- [ ] src/views/CalendarView.tsx 생성
- [ ] src/views/GanttView.tsx 생성
- [ ] src/views/TeamView.tsx 생성
- [ ] src/views/NodeMapView.tsx 생성
- [ ] src/views/TodoView.tsx 생성
- [ ] src/views/SettingsView.tsx 생성

### 1.9 라우팅

- [ ] src/App.tsx 라우팅 설정
- [ ] src/main.tsx 수정

### 1.10 테스트

- [ ] `npm run dev` 실행
- [ ] 로그인 페이지 표시 확인
- [ ] Google 로그인 성공 확인
- [ ] 대시보드 이동 확인
- [ ] 사이드바 네비게이션 확인
- [ ] 다크/라이트 테마 전환 확인
- [ ] 로그아웃 확인

---

## Phase 2: 캘린더

### 2.1 타입 정의

- [ ] src/types/calendar.ts 생성 (CalendarEvent, CalendarGroup)

### 2.2 Store

- [ ] src/stores/useCalendarStore.ts 생성

### 2.3 서비스

- [ ] src/services/calendar.ts 생성

### 2.4 유틸리티

- [ ] src/utils/date.ts 생성 (date-fns 래퍼)

### 2.5 컴포넌트

- [ ] src/components/calendar/CalendarSidebar.tsx 생성
- [ ] src/components/calendar/Calendar.tsx 생성
- [ ] src/components/calendar/WeeklyView.tsx 생성
- [ ] src/components/calendar/MonthlyView.tsx 생성
- [ ] src/components/calendar/EventBar.tsx 생성
- [ ] src/components/calendar/EventModal.tsx 생성

### 2.6 뷰 업데이트

- [ ] src/views/CalendarView.tsx 완성

### 2.7 Firestore

- [ ] Firestore에 팀 캘린더 그룹 수동 생성 (테스트용)

### 2.8 테스트

- [ ] 캘린더 페이지 표시 확인
- [ ] 캘린더 그룹 생성/삭제 확인
- [ ] 이벤트 생성 확인
- [ ] 멀티데이 이벤트 표시 확인
- [ ] 주간/월간 뷰 전환 확인

---

## Phase 3: 개인 생산성

### 3.1 타입 정의

- [ ] src/types/todo.ts 생성 (PersonalTodo, PersonalMemo, DDay)

### 3.2 Store

- [ ] src/stores/useTodoStore.ts 생성

### 3.3 서비스

- [ ] src/services/todos.ts 생성

### 3.4 컴포넌트

- [ ] src/components/todo/TodoList.tsx 생성
- [ ] src/components/todo/TodoItem.tsx 생성
- [ ] src/components/todo/MemoList.tsx 생성
- [ ] src/components/todo/DDayList.tsx 생성

### 3.5 위젯 (대시보드용)

- [ ] src/components/widgets/TodayTodosWidget.tsx 생성
- [ ] src/components/widgets/DDayWidget.tsx 생성
- [ ] src/components/widgets/SummaryWidget.tsx 생성

### 3.6 뷰 업데이트

- [ ] src/views/TodoView.tsx 완성
- [ ] src/views/Dashboard.tsx 위젯 추가

### 3.7 테스트

- [ ] 할 일 추가/완료/삭제 확인
- [ ] 메모 추가/수정/삭제/고정 확인
- [ ] D-day 추가/삭제 확인
- [ ] D-day 카운트다운 확인
- [ ] 대시보드 위젯 표시 확인

---

## Phase 4: 시각화

### 4.1 타입 정의

- [ ] src/types/project.ts 생성
- [ ] src/types/episode.ts 생성
- [ ] src/types/task.ts 생성
- [ ] src/types/team.ts 생성

### 4.2 상수

- [ ] src/constants/pipeline.ts 생성 (12단계)

### 4.3 Store

- [ ] src/stores/useProjectStore.ts 생성
- [ ] src/stores/useTeamStore.ts 생성

### 4.4 서비스

- [ ] src/services/projects.ts 생성
- [ ] src/services/team.ts 생성

### 4.5 간트 차트

- [ ] src/components/gantt/GanttChart.tsx 생성
- [ ] src/components/gantt/GanttTimeline.tsx 생성
- [ ] src/components/gantt/GanttBar.tsx 생성
- [ ] src/components/gantt/MilestoneMarker.tsx 생성

### 4.6 팀 뷰

- [ ] src/components/team/TeamCard.tsx 생성

### 4.7 CSS

- [ ] Shimmer 애니메이션 추가 (src/index.css)

### 4.8 뷰 업데이트

- [ ] src/views/GanttView.tsx 완성
- [ ] src/views/TeamView.tsx 완성

### 4.9 Firestore

- [ ] 테스트 데이터 생성 (프로젝트, 에피소드, 팀원)

### 4.10 테스트

- [ ] 간트 차트 표시 확인
- [ ] 진행률 바 애니메이션 확인
- [ ] 마일스톤 툴팁 확인
- [ ] 팀 현황 표시 확인
- [ ] 팀원 상태별 분류 확인

---

## Phase 5: 고급 기능

### 5.1 타입 정의

- [ ] src/types/nodemap.ts 생성

### 5.2 노드맵

- [ ] src/components/nodemap/NodeMap.tsx 생성
- [ ] src/components/nodemap/NodeMapControls.tsx 생성
- [ ] src/components/nodemap/Node.tsx 생성
- [ ] src/components/nodemap/Edge.tsx 생성

### 5.3 Slack

- [ ] src/services/slack.ts 생성

### 5.4 뷰 업데이트

- [ ] src/views/NodeMapView.tsx 완성

### 5.5 테스트

- [ ] 노드맵 표시 확인
- [ ] 노드 드래그 확인
- [ ] 줌/팬 확인
- [ ] 연결선 표시 확인

---

## Phase 6: 폴리싱

### 6.1 효과

- [ ] `npm install canvas-confetti @types/canvas-confetti`
- [ ] src/components/effects/Confetti.tsx 생성

### 6.2 UI 컴포넌트

- [ ] src/hooks/useTilt.ts 생성
- [ ] src/components/ui/TiltCard.tsx 생성
- [ ] src/components/ui/Skeleton.tsx 생성
- [ ] src/components/ui/Toast.tsx 생성

### 6.3 에러 처리

- [ ] src/components/ErrorBoundary.tsx 생성

### 6.4 App 업데이트

- [ ] 레이지 로딩 적용
- [ ] ErrorBoundary 적용
- [ ] ToastContainer 추가

### 6.5 성능 최적화

- [ ] React.memo 적용 (자주 리렌더되는 컴포넌트)
- [ ] useMemo/useCallback 적용

### 6.6 PWA

- [ ] vite.config.ts에 VitePWA 플러그인 설정
- [ ] public/icons/ 폴더에 아이콘 추가 (72, 96, 128, 144, 152, 192, 384, 512)
- [ ] public/robots.txt 생성

### 6.7 Firestore 보안

- [ ] firestore.rules 작성
- [ ] firestore.indexes.json 작성
- [ ] `firebase deploy --only firestore:rules,firestore:indexes`

### 6.8 배포

- [ ] `npm run build`
- [ ] `firebase deploy --only hosting`

### 6.9 최종 테스트

- [ ] PWA 설치 확인
- [ ] 오프라인 동작 확인 (캐시된 페이지)
- [ ] Lighthouse 점수 확인 (90+ 목표)
- [ ] 크롬 DevTools Performance 탭 확인

---

## 최종 확인 사항

### 기능 검증

- [ ] 로그인/로그아웃 정상 동작
- [ ] 팀 캘린더 표시 및 이벤트 생성
- [ ] 개인 캘린더 생성 및 공유
- [ ] 할 일 추가/완료/삭제
- [ ] 메모 추가/수정/삭제
- [ ] D-day 카운트다운
- [ ] 간트 차트 진행률 표시
- [ ] 팀원 상태 표시
- [ ] 노드맵 관계 시각화

### UX 검증

- [ ] 5초 내에 전체 상황 파악 가능?
- [ ] 별도 교육 없이 사용 가능?
- [ ] 부드러운 애니메이션?
- [ ] 버벅거림 없음?
- [ ] 깔끔한 UI? (이모지 범벅 아님?)

### 기술 검증

- [ ] Firestore 데이터 정상 저장?
- [ ] 실시간 동기화 동작?
- [ ] 여러 브라우저에서 동시 사용 가능?
- [ ] PWA로 설치 가능?
- [ ] 다크/라이트 테마 전환?

---

## 문서 참조 가이드

| 작업 | 참조 문서 |
|------|----------|
| 전체 개요 | `00_PROJECT_OVERVIEW.md` |
| Firebase 설정 | `01_ARCHITECTURE.md` |
| 타입 정의 | `02_DATA_MODELS.md` |
| Phase 1 구현 | `03_PHASE1_FOUNDATION.md` |
| Phase 2 구현 | `04_PHASE2_CALENDAR.md` |
| Phase 3 구현 | `05_PHASE3_PRODUCTIVITY.md` |
| Phase 4 구현 | `06_PHASE4_VISUALIZATION.md` |
| Phase 5 구현 | `07_PHASE5_ADVANCED.md` |
| Phase 6 구현 | `08_PHASE6_POLISH.md` |
| 디자인 참조 | `09_DESIGN_SYSTEM.md` |

---

## 의존성 전체 목록

```json
{
  "dependencies": {
    "react": "^18.x",
    "react-dom": "^18.x",
    "react-router-dom": "^6.x",
    "zustand": "^4.x",
    "firebase": "^10.x",
    "framer-motion": "^11.x",
    "clsx": "^2.x",
    "tailwind-merge": "^2.x",
    "lucide-react": "^0.4x",
    "date-fns": "^3.x",
    "d3": "^7.x",
    "canvas-confetti": "^1.x"
  },
  "devDependencies": {
    "@types/react": "^18.x",
    "@types/react-dom": "^18.x",
    "@types/d3": "^7.x",
    "@types/canvas-confetti": "^1.x",
    "@vitejs/plugin-react": "^4.x",
    "autoprefixer": "^10.x",
    "postcss": "^8.x",
    "tailwindcss": "^3.x",
    "typescript": "^5.x",
    "vite": "^5.x",
    "vite-plugin-pwa": "^0.19.x"
  }
}
```

---

## 완료!

모든 체크리스트를 완료하면 Bflow가 완성됩니다. 🎉
