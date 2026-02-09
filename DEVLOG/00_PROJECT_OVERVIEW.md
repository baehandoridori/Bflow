# Bflow 프로젝트 개요

> **최종 수정일**: 2026-01-29
> **버전**: 2.0 (Issue #1 반영)

---

## 프로젝트 정의

**Bflow**는 Studio JBBJ 애니메이션 스튜디오(약 20명)를 위한 **팀 생산성 + 개인 생산성 통합 PWA**입니다.

### 핵심 가치
- "화려하고 명료하게 전체 상황을 확인하고, 누가 뭘 하는지 정확히 아는 것"
- 팀 일정 관리 + 개인 일과 관리를 하나의 도구에서

### 기존 BAEFRAME과의 차이
| 항목 | BAEFRAME | Bflow |
|------|----------|-------|
| 인증 | 단순 비밀번호 | Google OAuth (Firebase Auth) |
| 저장소 | Google Drive JSON | Firebase Firestore |
| 범위 | 팀 관리 | 팀 + 개인 생산성 |
| 보안 | 평문 저장 | Firestore 보안 규칙 |

---

## 기술 스택 (확정)

### Frontend
```
- React 18 + TypeScript
- Vite (빌드 도구)
- Tailwind CSS (스타일링)
- Framer Motion (애니메이션)
- Zustand (상태 관리)
- D3.js (간트차트, 노드맵)
- Lucide React (아이콘)
- date-fns (날짜 유틸)
```

### Backend (Firebase)
```
- Firebase Auth (Google OAuth 로그인)
- Cloud Firestore (데이터베이스)
- Firebase Hosting (PWA 배포)
```

### 선택 이유
- **Firebase**: 무료 티어로 20명 충분, Google 생태계 연동, 실시간 동기화, 보안 규칙 내장
- **Firebase Hosting**: Firebase 프로젝트에 통합, 무료, 유지보수 최소

---

## 대상 사용자

- **인원**: 약 20명
- **역할**: 모두 애니메이터이면서 역할 분담
  - 릴 담당, 녹음 담당, 대본 담당, 애니메이팅 담당
  - 배경 담당, 에셋 준비 담당, 촬영 담당
- **사용 환경**: 데스크톱 PC 중심 (모바일 지원은 부가 기능)
- **기술 수준**: 비개발자, 직관적 UI 필수

---

## 핵심 기능 목록

### 1순위 (첫 번째 릴리스)
1. **Google 로그인** - Firebase Auth
2. **팀 캘린더** - 팀 전체가 보는 일정
3. **개인 캘린더** - 나만 보거나 선택 공유
4. **할 일 관리** - 체크리스트 + 간단한 메모
5. **간트 차트** - 에피소드 진행률, 12단계 파이프라인

### 2순위
6. **노드맵** - 옵시디언 스타일 그래프 뷰
7. **팀 현황** - 누가 뭘 하는지 한눈에
8. **D-day / 리마인더** - 개인 목표 관리

### 3순위 (미래)
9. **노션 연동** - 북마크 수집 페이지 API 연동
10. **Slack 웹훅** - 마감 리마인더, 공유 알림

---

## 프로덕션 파이프라인 (12단계)

애니메이션 제작의 표준 워크플로우:

```
1. 원정(기획) → 2. 대본집필 → 3. 가녹음 → 4. 피칭
→ 5. 배경/에셋 → 6. 아트보드 → 7. 릴 → 8. 애니메이션
→ 9. 보정/사운드 → 10. 가편 → 11. 피드백 → 12. 업로드
```

이 12단계는 간트차트와 노드맵에서 시각화됩니다.

---

## 데이터 저장 구조

### Firestore 컬렉션 구조
```
firestore/
├── users/                    # 사용자 정보
│   └── {userId}/
├── teams/                    # 팀 정보
│   └── {teamId}/
├── projects/                 # 프로젝트 (예: 사코팍 시즌1)
│   └── {projectId}/
├── episodes/                 # 에피소드
│   └── {episodeId}/
├── tasks/                    # 팀 태스크
│   └── {taskId}/
├── calendarEvents/           # 캘린더 이벤트
│   └── {eventId}/
├── personalTodos/            # 개인 할 일
│   └── {todoId}/
├── personalMemos/            # 개인 메모
│   └── {memoId}/
└── calendarGroups/           # 캘린더 그룹
    └── {groupId}/
```

---

## 개발 Phase 요약

| Phase | 이름 | 핵심 내용 | 예상 기간 |
|-------|------|----------|----------|
| 1 | 기반 구축 | 프로젝트 세팅, Firebase 연동, 로그인, 레이아웃 | - |
| 2 | 캘린더 | 팀 캘린더, 개인 캘린더, 캘린더 그룹, 공유 | - |
| 3 | 생산성 | 할 일 관리, 메모, D-day | - |
| 4 | 시각화 | 간트 차트, 팀 현황 뷰 | - |
| 5 | 고급 | 노드맵, 노션 연동, Slack | - |
| 6 | 폴리싱 | 애니메이션, 성능, PWA 완성 | - |

---

## 참조 문서

- `DEVLOG/01_ARCHITECTURE.md` - 아키텍처 상세
- `DEVLOG/02_DATA_MODELS.md` - 타입 정의 전체
- `DEVLOG/03_PHASE1_FOUNDATION.md` ~ `08_PHASE6_POLISH.md` - 단계별 구현 가이드
- `DEVLOG/09_DESIGN_SYSTEM.md` - 디자인 토큰, 컴포넌트
- `DEVLOG/10_IMPLEMENTATION_CHECKLIST.md` - 전체 체크리스트

---

## 디자인 원칙

### 해야 할 것
- 깔끔하고 명료한 UI
- 5초 내에 전체 상황 파악 가능
- 부드러운 애니메이션 (Framer Motion)
- 다크/라이트 테마 지원

### 피해야 할 것
- 이모지 범벅 UI
- 보라색 그라데이션 (AI 슬롭 느낌)
- 버벅거리는 애니메이션
- 복잡한 설정 요구

---

## 브랜드

- **앱 이름**: Bflow
- **브랜드 컬러**: `#F0E68C` (Khaki Gold)
- **폰트**: Pretendard (한글) / Inter (영문)
