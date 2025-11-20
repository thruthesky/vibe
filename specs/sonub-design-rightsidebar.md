---
name: sonub-design-rightsidebar
version: 2.0.0
description: 오른쪽 사이드바 UI/UX와 데이터 흐름에 대한 SED 명세서
author: JaeHo Song
email: thruthesky@gmail.com
license: GPL-3.0
created: 2025-01-09
updated: 2025-11-18
step: 25
priority: "*"
dependencies:
  - sonub-design-layout.md
  - sonub-design-workflow.md
  - sonub-setup-shadcn.md
  - sonub-setup-tailwindcss.md
tags:
  - design
  - ui
  - sidebar
  - right-sidebar
  - tailwindcss
  - lucide-icons
  - svelte5
---

# Sonub 오른쪽 사이드바 설계

## 1. 개요

### 1.1 목적
이 문서는 홈 화면 우측 사이드바(`src/lib/components/right-sidebar.svelte`)의 구조, 데이터 흐름, 스타일 규칙을 정의합니다. 사이드바는 데스크톱 레이아웃에서만 표시되며, 로그인한 사용자의 상태 요약과 알림, 추천 CTA 등을 모듈형 카드로 제공합니다.

### 1.2 범위
- UI 컴포넌트: shadcn-svelte `Card`, `Button`, `Separator`
- 아이콘: `lucide-svelte`
- 스타일: Tailwind CSS + `@apply`
- 반응형: `hidden lg:block`
- Light Mode Only 정책을 따른다.

### 1.3 선행 조건
- Tailwind, shadcn, lucide 설치 완료
- Paraglide 메시지 파일에 필요한 문자열이 존재해야 함
- Firebase RTDB/Functions 가동 중 (실시간 카드에 데이터 공급)

### 1.4 파일 위치

**소스 코드 위치**: [right-sidebar.svelte.md](./repository/src/lib/components/right-sidebar.svelte.md)

```
src/
└── lib/
    └── components/
        └── right-sidebar.svelte
```

## 2. 레이아웃 구조

### 2.1 전체 배치

**소스 코드 위치**: [right-sidebar.svelte.md](./repository/src/lib/components/right-sidebar.svelte.md)

```
<aside class="right-sidebar hidden lg:block">
  <Card.Root class="profile-card">…</Card.Root>
  <Card.Root class="notification-card">…</Card.Root>
  <Card.Root class="popular-posts-card">…</Card.Root>
  <Card.Root class="popular-users-card">…</Card.Root>
  <Card.Root class="stats-card">…</Card.Root>
  <Card.Root class="cta-card">…</Card.Root>
</aside>
```
- 가로 폭: `lg:w-64`, `xl:w-72`
- 세로 위치: `sticky top-20`
- 카드 간격: `gap-4`
- 각 카드 내부 패딩: 기본 `px-4 py-4` (상황에 따라 조정)
- 실시간 통계 카드는 다른 정보/추천 카드보다 아래쪽에 배치하여 사용자가 메인 정보와 CTA를 먼저 확인한 뒤 참고하도록 한다.

### 2.2 브레이크포인트
- `hidden md:block`: 지원하지 않음 (콘텐츠 밀집도 문제)
- `hidden lg:block`: 데스크톱 전용
- `xl:` 변형으로 아이콘 크기/글꼴만 세밀하게 조정 가능

## 3. 데이터 및 컴포넌트

### 3.1 프로필 카드
- 로그인 사용자의 아바타, 이름, 이메일을 표시
- 아바타: `Avatar` 컴포넌트 + `size={56}`
- 비로그인 시 로그인 유도 버튼으로 대체 (`href="/auth/sign-in"`)

### 3.2 알림 카드
- 최근 알림 3건 표시 (RTDB `/notifications/{uid}`)
- 항목 구조: 아이콘 + 제목 + 설명 + 시각
- 데이터 없음: `m.homeRightSidebarNotificationEmpty()` 메시지

### 3.3 실시간 통계 카드
- Cloud Functions가 수집한 통계(`/stats/summary`) 표시
- 항목 예: 전체 사용자, 게시글 수, 댓글 수, 오늘 생성된 방 수
- 숫자는 `Intl.NumberFormat`으로 포맷

### 3.4 인기 사용자 카드
- 오늘 기준 상위 인플루언서(일간 랭킹 Top 5)를 보여준다.
- 아바타, 이름, 점수를 단일 리스트로 노출하고 `/user/influencers` 링크를 통해 전체 보기 제공.

### 3.5 추천/작업 카드 (옵션)
- 다음 행동을 촉구하는 CTA (예: “새 글 쓰기”, “친구 찾기”)
- `Button` 컴포넌트 사용, variant=`secondary` 또는 `outline`

### 3.6 시스템 메시지 카드 (옵션)
- 공지사항 또는 릴리즈 노트를 강조하는 라벨
- `Sparkles` 아이콘과 gradient 배경 사용

## 4. 스타일 가이드

### 4.1 색상 팔레트
| 구분 | 배경 | 포인트 | 아이콘 |
| --- | --- | --- | --- |
| 프로필 | `from-blue-50 to-white` | `blue-600` | `User`, `Mail` |
| 알림 | `from-amber-50 to-white` | `amber-600` | `Bell` |
| 통계 | `from-emerald-50 to-white` | `emerald-600` | `TrendingUp` |
| 추천 | `from-purple-50 to-white` | `purple-600` | `Sparkles` |

### 4.2 타이포그래피
- 제목: `text-lg font-semibold`
- 부제: `text-xs text-gray-500`
- 목록 본문: `text-sm text-gray-700`
- 숫자 강조: `text-xl font-bold`

### 4.3 인터랙션
- 카드: `transition-shadow hover:shadow-xl`
- 버튼: `transition-colors hover:translate-y-0.5`
- 링크 항목: `cursor-pointer` + `hover:bg-{color}-100`

### 4.4 아이콘 가이드
- `lucide-svelte`를 직접 import
- 크기: 기본 `h-4 w-4`, 상황별로 `h-5 w-5`
- 아이콘 주변에 `bg-{color}-100 rounded-full p-1.5`

## 5. i18n 및 접근성
- 모든 텍스트는 `m.homeRightSidebar*` 메시지 사용
- CTA 버튼 `aria-label` 필수
- 리스트 항목은 `<button>` 또는 `<a>`로 구현하여 키보드 포커스 가능하게 처리
- 빈 상태 문구도 각 언어로 번역

## 6. 상태 처리
| 상태 | 처리 방식 |
| --- | --- |
| 로딩 | 스켈레톤 대신 `m.commonLoading()` 텍스트 사용, 카드 높이를 유지 |
| 데이터 없음 | `empty-state` 텍스트와 중립 아이콘 표시 |
| 오류 | 콘솔 로그 + placeholder 텍스트 |

## 7. 테스트 체크리스트
- [ ] 로그인/비로그인 상태에서 프로필 카드가 올바르게 분기되는가?
- [ ] 알림/통계 API 응답이 없을 때 empty 상태가 노출되는가?
- [ ] CTA 버튼 클릭 시 의도한 경로로 이동하는가?
- [ ] 사이드바가 1024px 이하에서 완전히 숨겨지는가?
- [ ] `npm run check` 실행 시 타입 오류가 없는가?
