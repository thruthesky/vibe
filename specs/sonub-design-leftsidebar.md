---
name: sonub-design-leftsidebar
title: Sonub 좌측 사이드바 설계
version: 2.0.0
description: 홈 화면 좌측 사이드바 UI/UX와 데이터 흐름에 대한 최신 설계 문서
author: JaeHo Song
email: thruthesky@gmail.com
license: GPL-3.0
created: 2025-11-10
updated: 2025-11-18
step: 25
priority: "**"
dependencies:
  - sonub-design-layout.md
  - sonub-setup-tailwind.md
  - sonub-i18n-paraglide.md
tags:
  - sidebar
  - navigation
  - realtime
  - ui
  - i18n
---

# 1. 개요

홈 화면 좌측 사이드바(`src/lib/components/left-sidebar.svelte`)는 데스크톱 해상도에서만 표시되는 고정형 정보 패널이다. 로그인 유저의 상태 요약, 친구 관계 링크, 최근 활동 카드, 언어 선택, 카피라이트 등의 요소를 단일 컴팩트 레이아웃으로 묶어 제공한다. 본 문서는 2025년 11월 18일 기준 최신 UI/UX 구조와 데이터 흐름을 정의한다.

## 1.1 주요 특징

- **컴팩트 카드형 레이아웃**: 불필요한 border를 제거하고 간결한 여백과 배경색만을 사용해 공간 효율을 극대화한다.
- **실시간 데이터 연동**: Firebase Realtime Database와 `createRealtimeStore`를 결합하여 팔로워/팔로잉 카운트, 최근 오픈채팅, 최근 활동을 즉시 반영한다.
- **Paraglide i18n**: 모든 텍스트는 `m.*` 메시지를 사용하고 언어 선택 UX와 연결된다.
- **Light Mode Only**: TailwindCSS 유틸리티와 shadcn-svelte Card 컴포넌트를 조합하여 밝은 톤을 유지한다.
- **카피라이트 분기**: 로케일이 한국어일 때와 그 외일 때 서로 다른 문자열을 노출한다.

# 2. 구조 개요

| 순서 | 섹션 | 설명 |
| --- | --- | --- |
| 1 | 프로필 카드 | 로그인 유저의 아바타와 이름, 또는 로그인 유도 카드 |
| 2 | 빠른 링크 스택 | 팔로워, 팔로잉, Reactions, Stats 링크 (카운트/설명 포함) |
| 3 | 최근 사용자 카드 | 프로필 사진을 가진 최근 가입자 5명 + “더보기” 버튼 |
| 4 | 최근 오픈채팅 카드 | 최신 오픈채팅 3건, 방 설명/생성일/멤버 수 표시 |
| 5 | 최근 활동 카드 | 게시글 기반 활동 5건, 카테고리·작성 시각·본문 요약 |
| 6 | 언어 선택 행 | 언어 아이콘 + select 박스 (국기 이모지 + 언어 이름) |
| 7 | 카피라이트 | 로케일별 문자열 출력 |

`<aside>` 요소는 `lg:w-64`, `xl:w-72` 너비를 사용하며 `sticky top-20` 클래스로 메인 스크롤과 독립된다.

# 3. 데이터 및 상태 관리

## 3.1 Firebase 경로

- **팔로워/팔로잉**: `/user-followers/{uid}`, `/user-following/{uid}`
  - `createRealtimeStore<Record<string, unknown>>`로 구독
  - 카운트 = 객체 key 수
- **최근 사용자**: `/users` 노드의 `sort_recentWithPhoto` 필드를 `orderByChild` + `limitToLast(5)` 로 조회
  - 프로필 사진이 없는 사용자는 필터링
  - `formatShortDate()` 로 가입 시각 표시
- **최근 오픈채팅**: `/chat-rooms` 노드, `type === 'open'`
  - `orderByChild('createdAt')` 후 limitToLast(20) → 필터링 → 최근 3건
  - `memberCount`, `description`, `createdAt` 노출
- **최근 활동**: `/chat-messages` 노드의 `type === 'post'`
  - `orderByChild('categoryOrder')` 기반 limitToLast(40)
  - Soft delete 메시지는 제외(`deleted` 플래그 확인)

## 3.2 상태 변수

Svelte 5 `$state` 룬을 이용해 다음 상태를 선언한다.

```ts
let recentUsers = $state<UserPreview[]>([]);
let isLoadingRecentUsers = $state(true);
let recentOpenChats = $state<OpenChatPreview[]>([]);
let isLoadingRecentOpenChats = $state(true);
let recentActivities = $state<RecentActivity[]>([]);
let isLoadingRecentActivity = $state(true);
let followerCount = $state(0);
let followingCount = $state(0);
```

`onMount` 시 `fetchRecentUsers()`, `setupOpenChatListener()`, `setupRecentActivityListener()` 를 호출하고 `onDestroy`/`teardown*` 함수에서 리스너를 해제하여 메모리 누수를 방지한다.

# 4. UI 구성 상세

## 4.1 프로필 카드

- 로그인 시 `/my/profile` 링크, 사용자 아바타(`Avatar`)와 이름 노출
- 비로그인 시 `/auth/sign-in` 링크 및 기본 아이콘
- `rounded-xl bg-white/90` + hover 시 배경만 강조, 별도 border 없음

## 4.2 빠른 링크 스택

- 팔로워/팔로잉/리액션/통계 4개의 링크를 `flex flex-col gap-1` 스택으로 배치
- 각 링크는 아이콘 원형 배경, 타이틀, 설명, 카운트(필요 시)로 구성
- 팔로워/팔로잉은 인증 상태에 따라 `- / ... / formatted number` 3단계 상태 표시
- Reactions/Stats 링크는 설명만 제공하고 `/my/reactions`, `/my/stats` 로 이동

## 4.3 최근 사용자 카드

- shadcn Card (`Card.Root`) 사용, 헤더에 `UsersRound` 아이콘과 제목
- 본문:
  - 상태 메시지(로딩/비어있음/데이터) 분기
  - 유저 항목: 프로필 이미지, 이름, 가입일(`formatShortDate`)
  - “더보기” 버튼 → `/user/list`
- 최대 5명만 노출하며 `limitToLast` 결과를 역순 정렬하여 최신순 보장

## 4.4 최근 오픈채팅 카드

- 최신 3개의 오픈채팅 방 노출
- 각 항목은 방 이름 + 생성일 + 설명 + 멤버 수 요약(`homeSidebarMembersCount` 메시지)
- 카드 전체 클릭 시 `/chat/room?roomId={roomId}` 이동

## 4.5 최근 활동 카드

- `type === 'post'` 메시지 5건, 카테고리 라벨·작성 시간·본문 일부를 표시
- 콘텐츠가 없을 경우 `homeSidebarActivityEmpty()` 메시지
- 기본적으로 텍스트만 노출하며 추후 클릭 이벤트 확장을 고려

## 4.6 언어 선택 및 카피라이트

- 언어 행: `Globe` 아이콘 + 레이블 + `<select>` (국기 이모지 + 언어 명)
- `handleLocaleChange()`에서 `setLocale()` 호출 → Paraglide가 쿠키 저장/새로고침 수행
- 카피라이트:
  - 로케일 `ko`: `(C) 2012 ~ 2025. 위세너`
  - 기타: `(C) 2012 ~ 2025. Withcenter, inc.`
  - `copyrightLabel` 파생 값으로 관리

# 5. 스타일 가이드

- **배경**: card와 언어 행은 `bg-white/90`, hover 시 subtle shadow
- **간격**: 기본 gap `0.25 ~ 0.5rem`, 카드 간격 `gap-3`
- **아이콘**: lucide-svelte, 크기 `h-4~h-10` 범위
- **폰트**: Tailwind `text-xs ~ text-base` 레벨, 서로 대비되는 `font-medium` 사용
- **Light Mode Only**: 다크 모드 변형 금지

# 6. i18n 규칙

- 모든 문자열은 `src/lib/paraglide/messages.js` 의 메시지를 사용한다.
- 새로운 텍스트를 추가할 경우 `messages/{locale}.json`에 동일 키를 작성하고 `ko/en/ja/zh` 모두 번역한다.
- 언어 선택 `<select>` 는 `aria-label` 을 `homeSidebarLanguageLabel()` 로 설정하여 접근성을 확보한다.

# 7. 접근성 및 인터랙션

- 링크/버튼은 `cursor-pointer` 클래스와 `hover:` 변화를 제공한다.
- `<select>` 요소에 `aria-label` 제공, `<a>` 요소는 명확한 텍스트와 함께 아이콘만 있을 경우 `aria-label`로 보강한다.
- 리스트 항목은 키보드 탭 이동이 가능하도록 기본 링크 구조를 유지한다.

# 8. 테스트 체크리스트

- [ ] 로그인/비로그인 상태에서 프로필 카드와 팔로우 카운트가 올바르게 렌더링되는지 확인
- [ ] `/users` 노드에 사진이 없는 사용자가 섞여 있어도 최근 사용자 카드가 5명 이하만 노출되는지 확인
- [ ] 오픈채팅/활동 카드가 데이터가 없을 때 올바른 empty 메시지를 보여주는지 확인
- [ ] 언어 선택 시 페이지가 해당 언어로 전환되고 카피라이트 문구가 분기되는지 확인
- [ ] `npm run check` 및 lint 결과에서 TS 오류가 없고 기존 경고만 유지되는지 확인

