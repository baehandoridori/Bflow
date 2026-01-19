# CLAUDE.md - Bflow 개발 지침

## 프로젝트 개요

**Bflow**는 JBBJ 애니메이션 스튜디오를 위한 일정 관리 & 워크플로우 시각화 PWA입니다.

- **브랜드 컬러**: `#F0E68C` (Khaki Gold)
- **대상 사용자**: Studio JBBJ 팀 (약 20명, 애니메이터)
- **핵심 가치**: "화려하고 명료하게 전체 상황을 확인하고, 누가 뭘 하는지 정확히 아는 것"

---

## 경로 정보

| 환경 | 경로 |
|------|------|
| **테스트/개발** | `C:\Bflow` |
| **실제 배포** | `G:\공유 드라이브\JBBJ 자료실\한솔이의 두근두근 실험실\Bflow` |
| **데이터 저장** | `G:\공유 드라이브\JBBJ 자료실\한솔이의 두근두근 실험실\Bflow_data\` |

---

## 개발 환경 설정

### 필수 요구사항
- Node.js 18+
- npm 또는 pnpm

### 설치 및 실행

```bash
# 의존성 설치
npm install

# 개발 서버 실행 (테스트용)
npm run dev

# 프로덕션 빌드
npm run build

# 빌드 미리보기
npm run preview
```

### 테스트 방법

매 버전마다 테스트하려면:

1. **개발 서버로 테스트**: `npm run dev` 실행 후 브라우저에서 `http://localhost:5173` 접속
2. **빌드 테스트**: `npm run build && npm run preview`로 프로덕션 빌드 확인
3. **로컬 배포 테스트**: 빌드 후 `dist` 폴더를 `C:\Bflow`에 복사하여 로컬 웹서버로 테스트

---

## 기술 스택

```
React 18 + TypeScript + Vite
Tailwind CSS (스타일링)
Framer Motion (애니메이션)
Zustand (상태 관리)
Lucide React (아이콘)
date-fns (날짜 처리)
```

---

## 프로젝트 구조

```
src/
├── components/
│   ├── ui/           # 공통 UI 컴포넌트 (Button, Card, Tooltip 등)
│   ├── widgets/      # 대시보드 위젯
│   ├── gantt/        # 간트 차트 컴포넌트
│   ├── layout/       # 레이아웃 (Sidebar, Header, MainLayout)
│   └── effects/      # 시각 효과 (Shimmer 등)
├── views/            # 페이지 뷰 (Dashboard, Timeline, TeamView 등)
├── stores/           # Zustand 스토어
├── hooks/            # 커스텀 훅
├── types/            # TypeScript 타입 정의
├── constants/        # 상수 정의 (파이프라인 단계 등)
├── utils/            # 유틸리티 함수
└── data/             # 샘플 데이터 (테스트용)
```

---

## 개발 원칙

### 디자인 원칙
1. **깔끔하고 명료한 UI** - 이모지 범벅 금지
2. **부드러운 애니메이션** - 버벅거림 없이
3. **직관적인 사용** - 별도 교육 없이 사용 가능
4. **5초 원칙** - 5초 내에 전체 상황 파악 가능

### Anti-patterns (절대 하지 말 것)
- 이모지 범벅 UI
- 복잡하고 뭐가 뭔지 모르는 UI
- 버벅거리거나 끊기는 애니메이션
- 보라색 그라데이션 (AI 슬롭 느낌)

### 코드 스타일
- TypeScript strict 모드 사용
- 함수형 컴포넌트 + 훅 사용
- Tailwind CSS 유틸리티 클래스 우선
- 컴포넌트는 단일 책임 원칙 준수

---

## 파이프라인 단계 (12단계)

```
원정 → 대본 → 가녹음 → 피칭 → 에셋 → 아트보드 → 릴 → 애니메이션 → 보정 → 가편 → 피드백 → 업로드
```

---

## 컬러 시스템

### 브랜드 컬러
- Primary: `#F0E68C`
- Primary Dark: `#D4CA6A`
- Primary Light: `#F5EDA8`

### 상태 컬러
- Working: `#22C55E` (green)
- Review: `#F59E0B` (amber)
- Done: `#6366F1` (indigo)
- Waiting: `#6B7280` (gray)

### 우선순위 컬러
- High: `#EF4444` (red)
- Medium: `#F59E0B` (amber)
- Low: `#6B7280` (gray)

---

## 구현 단계 (Phase)

### Phase 1: MVP (현재)
- [x] 프로젝트 세팅 (Vite + React + TypeScript + Tailwind)
- [x] 기본 레이아웃 (사이드바, 헤더)
- [x] 위젯 그리드 시스템
- [x] 간트 차트 (기본)
- [x] 팀 뷰 (기본)
- [x] 다크/라이트 테마

### Phase 2: 핵심 기능
- [ ] Google Drive 연동 (File System Access API)
- [ ] 캘린더 (주간/월간, 멀티데이 이벤트)
- [ ] 마일스톤 툴팁
- [ ] 태스크 CRUD

### Phase 3: 고급 기능
- [ ] 노드맵 뷰
- [ ] 드래그 앤 드롭 일정 조절
- [ ] Slack 웹훅 연동
- [ ] PWA 설정

### Phase 4: 폴리싱
- [ ] 애니메이션 고도화
- [ ] 성능 최적화
- [ ] 에러 핸들링
- [ ] 반응형 디자인

---

## 참고 문서

- `BFLOW_CLAUDE_CODE_CONTEXT.md` - 전체 컨텍스트 문서
- `Bflow_PRD.md` - 제품 요구사항 문서
- `Bflow_Prototype_v3_Final.jsx` - UI/UX 프로토타입 참조

---

## 배포 가이드

### 테스트 배포 (C:\Bflow)
```bash
npm run build
# dist 폴더 내용을 C:\Bflow로 복사
```

### 실제 배포
```bash
npm run build
# dist 폴더 내용을 G:\공유 드라이브\JBBJ 자료실\한솔이의 두근두근 실험실\Bflow로 복사
```

---

*최종 수정: Phase 1 구현*
