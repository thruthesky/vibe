---
name: sonub
version: 1.0.0
description: Detailed table of contents for sonub specifications
author: JaeHo Song
email: thruthesky@gmail.com
license: GPL-3.0
step: 20
---

## 🔥 MUST-FOLLOW: SED (Spec-Exact Development) 지침

모든 개발자와 AI는 반드시 다음 SED 지침을 따라야 합니다:
📖 **필독**: https://sedai.dev/instructions 을 읽고 SED instructions 지침을 잘 이해하고 항상 이 지침대로 수행해 주세요.

### SED 핵심 원칙 (반드시 따를 것)

1. **인덱스 기반 개발**: 항상 `specs/index.md`부터 읽어 프로젝트 구조를 파악한 후 관련 사양 문서를 순차적으로 읽습니다.

2. **종속성 해결 (Dependencies First)**: YAML 헤더의 `dependencies` 필드를 분석하여 의존 사양을 먼저 로드하고, `step` 필드로 정의된 순서대로 개발을 진행합니다. (낮은 숫자 먼저 실행)

3. **사양 준수 (Spec is Absolute)**:
   - 사양에 명시된 것만 구현합니다
   - 명시되지 않은 기능은 절대 구현하지 않습니다
   - 모호한 부분은 해석하지 말고 개발자에게 명확히 요청합니다
   - 사양 해석 없음, 가정 없음

4. **기술 스택**:
   - **프레임워크**: 
     - Svelte `^5.41.0`
     - SvelteKit `^2.47.1`
     - Vite `^7.1.10`
   - **언어**: 
     - TypeScript `^5.9.3` (엄격 모드 필수)
   - **스타일링**: 
     - TailwindCSS `^4.1.14`
     - @tailwindcss/forms `^0.5.10`
     - @tailwindcss/typography `^0.5.19`
     - @tailwindcss/vite `^4.1.14`
   - **UI 컴포넌트**: 
     - shadcn-svelte `^1.0.10` (Button, Card, Alert 등)
     - clsx `^2.1.1`
     - tailwind-merge `^3.3.1`
   - **백엔드**: 
     - Firebase `^12.5.0` (Authentication, Realtime Database, Firestore, Storage, Cloud Functions)
   - **다국어**: 
     - @inlang/paraglide-js `^2.4.0` (ko, ja, zh, en 지원)
   - **테스트**: 
     - Vitest `^4.0.5` (유닛 테스트)
     - Playwright `^1.56.1` (E2E 테스트)
   - **코드 품질**:
     - ESLint `^9.38.0`
     - Prettier `^3.6.2`
     - 최소 80% 코드 커버리지
   - **인코딩**: UTF-8 필수 (BOM 제외)
   - **콘텐츠 규칙**: 
     - 모든 HTML 콘텐츠는 영어로 작성 필수
     - 모든 한글 주석/문서는 UTF-8로 작성
   - **디자인 정책**:
     - Light Mode Only (다크 모드 미지원)
     - 모든 클릭 가능한 요소에 `cursor-pointer` 적용
   - **라우팅 규칙**:
     - **로그인한 사용자 자신의 정보**: `/my/xxx` 경로 사용
       - 예: `/my/profile` (내 프로필 수정), `/my/reports` (내 신고 목록)
       - 본인의 데이터를 조회하고 수정하는 모든 페이지에 적용
     - **다른 사용자 정보 조회**: `/user/xxx/${uid}` 경로 사용
       - 예: `/user/profile/${uid}` (다른 사용자 프로필 조회)
       - 읽기 전용 또는 제한된 권한으로 다른 사용자 정보를 조회

### UI/UX 개발 공통 규칙
- 모든 UI/UX 구현은 **Tailwind CSS 유틸리티 + svelte-shadcn** 컴포넌트 조합으로 작성한다. (출처: `CLAUDE.md`)
- 버튼, 다이얼로그, 카드 등 상호작용 요소는 `shadcn-svelte` 컴포넌트를 우선 사용하고, 커스텀 스타일은 Tailwind로 오버레이한다.
- 디자인 시스템 계층을 우회하는 CSS/HTML 구현은 금지되며, 새 컴포넌트가 필요하면 shadcn-svelte 생성기를 통해 추가한 뒤 재사용한다.

---

## ⭐️ Start Here – 필수 선행 문서

- **프로젝트 전반 개요는 반드시 [sonub-project-overview.md](./sonub-project-overview.md)를 먼저 읽습니다.**
  - Sonub의 목적, 핵심 기능 범위, 저작권/문의 채널 안내
  - 클라이언트·서버·shared 모듈 구조와 Pure Functions 공유 전략
  - 개발/배포/운영 지침과 shared 폴더 사용 패턴
- 해당 문서를 읽지 않으면 아래 세부 스펙의 컨텍스트를 이해할 수 없으므로, 모든 작업자는 `specs/index.md → sonub-project-overview.md → 관련 세부 문서` 순으로 학습합니다.

---

# Specifications Index
This document provides a detailed index of all specifications related to the sonub project. Each specification is listed with its title, description, and relevant metadata extracted from its YAML header.

## Foundation

### Sonub Project Overview
- **File**: [sonub-project-overview.md](./sonub-project-overview.md)
- **Title**: Sonub 프로젝트 개요
- **Description**: Sonub의 비전, 기능 범위, 모듈 구조(client/server/shared) 및 shared 순수 함수 사용 지침을 총괄적으로 정리한 문서
- **Version**: 1.0.0
- **Step**: 5
- **Priority**: "***"
- **Tags**: overview, architecture, shared, setup, guidance
- **핵심 내용**:
  - Social Network Hub(Sonub)의 목표와 제공 기능(프로필/친구/채팅/피드/알림)
  - SvelteKit + Firebase 기반 프로젝트 셋업 지침과 디렉터리 구조
  - shared 순수 함수 철학, 사용 예시(`shared/date.pure-functions.ts`, `shared/chat.pure-functions.ts`)
  - 개발·배포·운영·유지보수 가이드 및 피드백 경로(GitHub Issues)

## Product Planning

### Sonub Next Version Plan
- **File**: [sonub-update-next-version.md](./sonub-update-next-version.md)
- **Title**: Sonub 차기 버전 작업 계획
- **Description**: 채팅 기능의 데이터 저장소 전략과 Firestore ↔ Realtime Database 비용 비교를 통해 차기 버전 마이그레이션 기준을 정의한 로드맵 메모
- **Version**: 1.0.0
- **Step**: 90
- **Priority**: *
- **Tags**: roadmap, planning, firebase, rtdb, firestore, 비용
- **핵심 내용**:
  - 채팅 메시지·조인 데이터의 fan-out 특성과 Firestore 초과 비용을 정량 비교하며, 현재 버전은 **RTDB 100% 사용**을 기본 전략으로 명시
  - 저장/다운로드 요율, 읽기·쓰기 건당 과금, 동시 연결 모델 등 Firestore vs RTDB 비용 표를 제공하여 의사결정 근거 확보
  - 차기 버전에서의 조건부 마이그레이션 원칙: fan-out이 없는 노드(`chat-rooms`, `chat-messages`, `users`)는 Firestore 이전 후보, `chat-joins`, `chat-invitations` 등 fan-out 노드는 RTDB에 고정
  - RTDB 비용이 월 \$500 이상이거나 고급 검색/대용량 저장이 필요할 때 하이브리드 이전을 검토하고, Cloud Functions 레이어에서 동기화·보상 처리 시 고려 사항을 나열

## Design and Styling

### Sonub Design Workflow
- **File**: [sonub-design-workflow.md](./sonub-design-workflow.md)
- **Title**: Sonub Design Workflow
- **Description**: TailwindCSS와 shadcn-svelte를 사용한 디자인 워크플로우 가이드라인
- **Version**: 1.0.0
- **Step**: 10
- **Priority**: *
- **Dependencies**:
  - sonub-setup-tailwindcss.md
  - sonub-setup-shadcn.md
- **Tags**: design, tailwindcss, shadcn, ui, styling

### Sonub Design Guideline
- **File**: [sonub-design-guideline.md](./sonub-design-guideline.md)
- **Title**: Sonub Design Guideline
- **Description**: Light Mode 전용 테마와 모든 클릭 요소에 `cursor: pointer`를 강제하는 인터랙션 정책을 정의한 문서
- **Version**: 1.0.0
- **Step**: 15
- **Priority**: *
- **Dependencies**:
  - sonub-design-workflow.md
  - sonub-setup-tailwindcss.md
- **Tags**: design, ui, theme, interaction, cursor
- **핵심 정책**:
  - 시스템 설정과 상관없이 Light Mode만 지원 (`color-scheme: light`)
  - 다크 모드 토글/스타일 미구현, `dark:` 변형 사용 금지
  - 클릭 가능한 모든 요소에 `cursor-pointer` 적용, 비활성 상태 커서 명시
  - QA 체크리스트로 모드/커서 상태를 수동 검증

### Sonub Design Layout
- **File**: [sonub-design-layout.md](./sonub-design-layout.md)
- **Title**: Sonub Design Layout - 레이아웃, 탑바 및 사이드바 구조
- **Description**: Sonub 프로젝트의 레이아웃, 탑바 및 사이드바 구조 구현 명세서
- **Version**: 1.1.0
- **Step**: 20
- **Priority**: **
- **Dependencies**:
  - sonub-design-workflow.md
  - sonub-user-login.md
  - sonub-setup-shadcn.md
- **Tags**: layout, topbar, sidebar, navigation, ui, authentication, svelte5
- **Files**:
  - `src/routes/+layout.svelte` - 전역 레이아웃 (3컬럼 구조)
  - `src/lib/components/top-bar.svelte` - 탑바 컴포넌트
  - `src/lib/components/left-sidebar.svelte` - 좌측 사이드바 컴포넌트 (데스크톱만)
  - `src/lib/components/right-sidebar.svelte` - 우측 사이드바 컴포넌트 (데스크톱만)
  - `src/routes/+page.svelte` - 홈페이지
- **구현된 기능**:
  - 전역 레이아웃 구조 (3컬럼: 좌측/중앙/우측)
  - 반응형 탑바 (모바일/태블릿/데스크톱)
  - 반응형 사이드바 (데스크톱 lg 이상에서만 표시)
  - 사용자 인증 상태 기반 네비게이션
  - 로그인/로그아웃 기능
  - Sticky 포지셔닝 (사이드바 스크롤 고정)
  - Light Mode Only 정책 (다크 모드 미지원)
  - 접근성 고려

### Sonub Design Left Sidebar
- **File**: [sonub-design-leftsidebar.md](./sonub-design-leftsidebar.md)
- **Title**: Sonub 좌측 사이드바 명세서
- **Description**: 좌측 사이드바 컴포넌트 구현 명세서 - 메뉴, 언어 선택, 빌드 버전 표시
- **Version**: 1.0.0
- **Step**: 25
- **Priority**: **
- **Dependencies**:
  - sonub-design-layout.md
  - sonub-i18n-paraglide.md
  - sonub-setup-shadcn.md
- **Tags**: sidebar, navigation, i18n, ui, svelte5
- **Files**:
  - `src/lib/components/left-sidebar.svelte` - 좌측 사이드바 컴포넌트
- **구현된 기능**:
  - 메뉴 네비게이션 (홈, 소개, 제품, 연락)
  - 최근 활동 카드 (향후 확장 예정)
  - 언어 선택 드롭다운 (en, ko, ja, zh)
  - 빌드 버전 표시
  - Sticky 포지셔닝
  - Light Mode Only 스타일링
  - 반응형 디자인 (데스크톱만)

### Sonub Design Right Sidebar
- **File**: [sonub-design-rightsidebar.md](./sonub-design-rightsidebar.md)
- **Status**: ⚠️ 문서 내용이 아직 작성되지 않았습니다. 우측 사이드바 명세가 필요하면 개발자에게 요청하세요.

### Sonub Menu Page
- **File**: [sonub-menu-page.md](./sonub-menu-page.md)
- **Title**: Sonub Menu Page
- **Description**: 메뉴 페이지 구현 명세서 - 사용자 계정 및 설정 관리를 위한 메뉴 페이지 구현
- **Version**: 1.0.0
- **Step**: 23
- **Priority**: *
- **Dependencies**:
  - sonub-design-layout.md
  - sonub-setup-shadcn.md
  - sonub-user-login.md
- **Tags**: menu, ui, authentication, account, navigation, svelte5
- **Files**:
  - `src/routes/menu/+page.svelte` - 메뉴 페이지
  - `src/lib/components/top-bar.svelte` - 탑바 (메뉴 아이콘 추가)
- **구현된 기능**:
  - 탑바 우상단 메뉴 아이콘
  - 인증 상태 기반 메뉴 표시
  - 사용자 프로필 정보 표시 (사진, 이름, 이메일)
  - 회원 정보 수정 링크
  - 로그아웃 기능
  - 관리자 페이지 링크 (관리자만)
  - Light Mode Only 스타일링
  - 접근성 지원 (ARIA 라벨, 의미론적 HTML)

### Sonub Design Components
- **File**: [sonub-design-components.md](./sonub-design-components.md)
- **Title**: Sonub Design Components
- **Description**: Light Mode 전용 UI 컴포넌트(Button, Card, Alert)의 설계 지침과 사용 예시를 정리한 문서
- **Version**: 1.1.0
- **Step**: 35
- **Priority**: '**'
- **Dependencies**:
  - sonub-design-workflow.md
  - sonub-design-guideline.md
  - sonub-setup-shadcn.md
  - sonub-setup-tailwindcss.md
- **Tags**: ui-components, shadcn-svelte, tailwindcss, light-mode, svelte5
- **주요 내용**:
  - `src/lib/components/ui/button`, `card`, `alert` 구조 설명
  - Svelte 5 runes, `cn()` 헬퍼, Light Mode-only 정책을 반영한 구현 패턴
  - 버튼의 variant/size, disabled 링크 접근성, 아이콘 사이즈 자동화 규칙
  - Card/Alert 조합 예시 및 관리자 페이지 적용 사례

### Tailwind CSS Setup
- **File**: [sonub-setup-tailwindcss.md](./sonub-setup-tailwindcss.md)
- **Title**: SvelteKit 프로젝트 Tailwind CSS 설치 및 설정 명세서
- **Description**: Tailwind CSS 4.x를 SvelteKit 5에 설치하고 Light Mode 전용 정책에 맞춰 구성하는 절차
- **Version**: 1.2.0
- **Step**: 15
- **Priority**: **
- **Dependencies**:
  - sonub-setup-svelte.md
- **Tags**: tailwindcss, styling, css, light-mode, installation
- **핵심 내용**:
  - `npx sv create` 단계에서 Tailwind 애드온 선택 및 후속 수동 설치 절차
  - `@tailwindcss/vite` 플러그인, forms/typography 플러그인 설정과 Vite 통합
  - Light Mode 전용 설정( `color-scheme: light`, `dark:` 변형 금지 )과 Prettier 플러그인 구성
  - `npm run check` 기반 검증 및 문제 해결 가이드
- **관련 문서**: `sonub-design-tailwindcss.md` (사용 패턴), `sonub-design-workflow.md`

### Shadcn-Svelte Setup
- **File**: [sonub-setup-shadcn.md](./sonub-setup-shadcn.md)
- **Title**: SvelteKit 프로젝트 shadcn-svelte 설치 명세서
- **Description**: SvelteKit 프로젝트에 shadcn-svelte UI 컴포넌트 라이브러리 설치 및 설정 명세서
- **Version**: 1.1.0
- **Step**: 25
- **Priority**: *
- **Dependencies**:
  - sonub-setup-svelte.md
  - sonub-setup-tailwindcss.md
- **Tags**: shadcn-svelte, ui, components, 라이브러리, 설정, 수동구현
- **구현된 컴포넌트**:
  - Button 컴포넌트 (6 variants, 4 sizes)
  - Card 컴포넌트 (Header, Title, Description, Content, Footer)
  - Alert 컴포넌트 (default, destructive variants)
- **설치된 패키지**:
  - clsx@2.1.0
  - tailwind-merge@2.2.1

## Backend Services

### Firebase Setup
- **File**: [sonub-setup-firebase.md](./sonub-setup-firebase.md)
- **Title**: Firebase JS SDK 설치 및 설정 명세서
- **Description**: SvelteKit 프로젝트에 Firebase JS SDK 설치 및 설정 명세서
- **Version**: 1.1.0
- **Step**: 20
- **Priority**: **
- **Dependencies**:
  - sonub-setup-svelte.md
- **Tags**: firebase, backend, database, authentication, storage, 설정, SSR
- **Files**:
  - `src/lib/firebase.ts` - Firebase 초기화 및 서비스 인스턴스
  - `src/lib/types/firebase.ts` - Firebase 타입 정의
  - `.env` - 환경 변수 설정
- **구현된 서비스**:
  - Firebase Authentication (SSR 대응)
  - Firestore Database
  - Realtime Database
  - Firebase Storage
  - Firebase Analytics
- **주요 구현 사항**:
  - SvelteKit 환경 변수 사용 (`$env/static/public`)
  - SSR 대응 (nullable 타입, 브라우저 환경 체크)
  - 환경 변수 디버깅 로그
- **설치된 패키지**:
  - firebase@11.0.0 이상

### Firebase Authentication Example
- **File**: [sonub-firebase-auth.md](./sonub-firebase-auth.md)
- **Title**: Firebase Authentication Demo Spec
- **Description**: `sonub-setup-firebase.md`에서 분리된 Authentication 샘플 코드 명세. Google 로그인/로그아웃 흐름과 onAuthStateChanged 패턴을 정의
- **Version**: 1.0.0
- **Step**: 40
- **Priority**: *
- **Dependencies**:
  - sonub-setup-firebase.md
  - sonub-user-login.md
- **Tags**: firebase, authentication, login, example
- **Files**:
  - `src/routes/demo/auth-example/+page.svelte` - Firebase Auth 데모 페이지
- **구현된 기능**:
  - GoogleAuthProvider 기반 로그인/로그아웃 버튼
  - onAuthStateChanged 구독 및 상태 메시지 처리
  - 프로필 이미지/UID 표시, 오류 상태 피드백
- **비고**: 실제 로그인 UI/UX 명세는 `sonub-user-login.md`를 따른다.

### Firebase Storage Upload Example
- **File**: [sonub-firebase-storage.md](./sonub-firebase-storage.md)
- **Title**: Firebase Storage 업로드/목록/삭제 예제
- **Description**: Storage 업로드 툴 전체 코드를 정의. 진행률, 취소, 목록, 삭제 플로우를 포함
- **Version**: 1.0.0
- **Step**: 45
- **Priority**: *
- **Dependencies**:
  - sonub-setup-firebase.md
- **Tags**: firebase, storage, upload, example
- **Files**:
  - `src/routes/upload/+page.svelte` - 파일 업로드 페이지
- **구현된 기능**:
  - UID 기반 경로에 파일 업로드 (uploadBytesResumable)
  - 업로드 취소/진행률 UI, 최근 업로드 URL 표시
  - listAll + getMetadata 조합으로 목록 정렬 및 삭제 기능
- **검증**:
  - 로그인 → 파일 업로드 → 목록/삭제 순으로 수동 테스트

### Firebase Realtime Database Structure
- **File**: [sonub-firebase-database-structure.md](./sonub-firebase-database-structure.md)
- **Title**: Firebase Realtime Database 구조 가이드
- **Description**: `/users`, `user-props`, friends/followers/following 등 RTDB 전체 스키마와 역할 분리를 정의한 기준 문서
- **Version**: 1.0.0
- **Step**: (미정)
- **Priority**: (미정)
- **Dependencies**: 없음
- **Tags**: firebase, realtime-database, schema, architecture
- **주요 내용**:
  - Flat 스타일 데이터 구조, 속성 분리, Cloud Functions 활용 원칙
  - `/users/{uid}` 필드 정의, Firebase Auth와 RTDB 필드 차이 주의사항
  - `user-props`, 친구 관계(friends/followers/following) 데이터 모델 및 책임 구분
  - 관련 가이드와 참고 문서 링크, 검증 체크리스트

### Firebase Realtime Database Utilities
- **File**: [sonub-firebase-realtime-database.md](./sonub-firebase-realtime-database.md)
- **Title**: Firebase Realtime Database 유틸리티 라이브러리
- **Description**: Svelte 5 runes 기반 RTDB 읽기/쓰기/구독 헬퍼와 실시간 스토어 구현 명세
- **Version**: 1.0.0
- **Step**: 30
- **Priority**: ***
- **Dependencies**:
  - sonub-setup-firebase.md
  - sonub-firebase-database-structure.md
- **Tags**: firebase, rtdb, svelte, store, utility
- **Files**:
  - `src/lib/stores/database.svelte.ts`
- **제공 기능**:
  - `readData`, `writeData`, `updateData`, `deleteData`, `pushData` 등 공용 API
  - `createRealtimeStore`/`rtdbStore`로 실시간 구독 + 로딩/에러 상태 자동 관리
  - `setupPresence`로 온라인 상태 트래킹, 중복 리스너 방지 구조
  - TypeScript 제네릭 지원 및 Firebase Emulator 테스트 절차

### Database Store Specification
- **File**: [sonub-store-database.md](./sonub-store-database.md)
- **Title**: 데이터베이스 스토어 (Database Store)
- **Description**: Firebase Realtime Database 유틸리티 스토어 - createRealtimeStore, CRUD 함수, 온라인 상태 관리
- **Version**: 1.0.0
- **Step**: 46
- **Priority**: ***
- **Dependencies**:
  - sonub-setup-firebase.md
  - sonub-firebase-database-structure.md
- **Tags**: firebase, rtdb, realtime-database, svelte5, store, crud, utilities
- **Files**:
  - `src/lib/stores/database.svelte.ts`
- **핵심 기능**:
  - `createRealtimeStore<T>()` - 실시간 데이터 구독 스토어 생성 (alias: rtdbStore)
  - CRUD 함수: `writeData`, `updateData`, `deleteData`, `pushData`, `readData`
  - `setupPresence()` - 온라인/오프라인 상태 자동 관리
  - TypeScript 제네릭 타입 지원 및 구조화된 결과 반환
  - 전체 소스 코드 및 사용 예제 포함

### 🔥 DatabaseListView Component (MUST USE for ALL RTDB List Views)
- **File**: [sonub-firebase-database-list-view.md](./sonub-firebase-database-list-view.md)
- **Title**: DatabaseListView 컴포넌트 무한 스크롤 가이드
- **Description**: Firebase Realtime Database의 **모든 데이터 목록 표시**에 사용해야 하는 표준 컴포넌트
- **Version**: 3.0.0
- **Step**: 30
- **Priority**: *** (최우선)
- **Dependencies**:
  - sonub-firebase-database-structure.md
- **Tags**: firebase, rtdb, infinite-scroll, list-view, universal-component, svelte5
- **Files**:
  - `src/lib/components/DatabaseListView.svelte`
- **🔥 핵심 원칙 (반드시 준수)**:
  - **모든 Firebase Realtime Database 데이터 목록 표시에 DatabaseListView를 사용해야 합니다**
  - 사용자 목록, 게시글 목록, 댓글 목록, 채팅 메시지, 채팅방 목록, 알림 목록 등 **모든 경우**에 적용
  - 무한 스크롤, 실시간 동기화, 메모리 관리가 자동으로 처리됩니다
- **주요 기능**:
  - 양방향 무한 스크롤 (`scrollTrigger`: 'top' 또는 'bottom')
  - 실시간 데이터 동기화 (onValue, onChildAdded, onChildRemoved)
  - 자동 메모리 관리 (리스너 자동 해제)
  - orderPrefix 기반 서버 측 필터링 (카테고리, 채팅방 등)
  - reverse 옵션 (최신 데이터부터 표시)
  - 공개 메서드: `refresh()`, `scrollToTop()`, `scrollToBottom()`
  - 고도로 커스터마이징 가능한 snippet 시스템
- **사용 예시**:
  ```svelte
  <DatabaseListView
    path="users"
    orderBy="createdAt"
    reverse={true}
    scrollTrigger="bottom"
    pageSize={20}
  >
    {#snippet item(itemData)}
      <div>{itemData.data.displayName}</div>
    {/snippet}
  </DatabaseListView>
  ```
- **⚠️ 주의사항**:
  - orderBy 필드가 모든 노드에 존재해야 합니다
  - 컨테이너 스크롤 사용 시 명시적인 높이 설정 필요
  - pageSize는 10~30 권장

### Firebase Cloud Functions Guide
- **File**: [sonub-firebase-cloudfunctions.md](./sonub-firebase-cloudfunctions.md)
- **Title**: Firebase Cloud Functions 개발 가이드
- **Description**: Gen 2 Cloud Functions 설정, 트리거, 테스트 전략을 정리한 백엔드 자동화 명세
- **Version**: 1.0.0
- **Step**: (미정)
- **Priority**: (미정)
- **Dependencies**: 없음
- **Tags**: cloud-functions, backend, automation, firebase
- **주요 내용**:
  - 게시글/댓글/좋아요/신고/사용자 트리거 처리
  - `handleUserCreate`, `handleLikeCreate` 등 3레이어(handlers/utils) 구조
  - `setGlobalOptions`로 maxInstances 제한, asia-southeast1 리전 고정
  - firebase-functions-test 기반 단위/통합 테스트 가이드

### Firebase Security Rules
- **File**: [sonub-firebase-security.md](./sonub-firebase-security.md)
- **Title**: Firebase RTDB & Storage 보안 규칙
- **Description**: `/users/{uid}` 데이터와 Storage `users/{userId}/profile` 경로를 보호하는 샘플 규칙 정의
- **Version**: (미정)
- **Step**: (미정)
- **Priority**: (미정)
- **Dependencies**: 없음
- **Tags**: security, firebase, rules
- **주요 규칙**:
  - RTDB: 모든 사용자가 읽기 가능, 본인만 쓰기 가능, 필수 필드 검증
  - Storage: 프로필 폴더 read-all, write/delete는 본인만 허용
  - 규칙 스니펫을 그대로 Firebase 콘솔에 적용하여 최소 권한 원칙 충족

## Internationalization

### Paraglide Minimal Setup
- **File**: [sonub-setup-paraglide.md](./sonub-setup-paraglide.md)
- **Title**: Paraglide 최소 설정 가이드
- **Description**: Paraglide i18n을 필수 요소만으로 연결하기 위한 프로젝트/빌드/런타임 설정 절차
- **Version**: 1.0.0
- **Step**: 15
- **Priority**: **
- **Dependencies**:
  - sonub-setup-svelte.md
- **Tags**: i18n, paraglide, setup, configuration, localization
- **핵심 내용**:
  - `project.inlang/settings.json`에서 message-format 플러그인만 사용하는 최소 구성
  - `vite.config.ts` 내 단일 `paraglideVitePlugin` 호출과 `outputStructure: 'locale-modules'`
  - `src/hooks.server.ts`의 `paraglideMiddleware` 래핑과 `src/app.html`의 `%paraglide.lang%` 치환
  - 자동 생성 산출물 관리 및 수동 타입 파일 제거, 검증 체크리스트 포함
- **사용 가이드**: 번역 키 작성/사용 흐름은 `sonub-i18n-paraglide.md`를 참고

### Sonub i18n Paraglide
- **File**: [sonub-i18n-paraglide.md](./sonub-i18n-paraglide.md)
- **Title**: Paraglide-JS 기반 i18n 다국어 지원 시스템
- **Description**: Paraglide-JS와 Inlang 메시지를 사용해 ko/ja/zh/en 다국어 UI를 제공하는 방법을 정의
- **Version**: 1.0.0
- **Step**: 15
- **Priority**: **
- **Dependencies**:
  - sonub-setup-svelte.md
- **Tags**: i18n, paraglide-js, localization, inlang, sveltekit5
- **구현 요소**:
  - `messages/*.json` 원본과 `src/lib/paraglide` 자동 생성 파일 구조
  - 쿠키/스토어를 통한 로케일 감지 및 SSR 초기화
  - Paraglide 명령 실행, 타입 안전 메시지 사용 예시
  - 지원 언어: en (기본), ko, ja, zh

## Utility Functions

### Sonub Functions Overview
- **File**: [sonub-functions-overview.md](./sonub-functions-overview.md)
- **Title**: Sonub Pure Functions 운영 규칙
- **Description**: 순수 함수만을 `src/lib/functions/*.functions.ts`에 배치하기 위한 공통 규칙과 검증 체크리스트
- **Version**: 1.0.0
- **Step**: 25
- **Priority**: **
- **Dependencies**:
  - sonub-setup-svelte.md
- **Tags**: functions, architecture, guidelines
- **핵심 내용**:
  - 도메인별 `*.functions.ts` 네이밍, Named Export 강제, 외부 상태 의존 금지
  - 추가 함수 작성 시 문서화·테스트 지침과 검증 체크리스트 제공

### Chat Pure Functions
- **File**: [sonub-functions-chat-functions.md](./sonub-functions-chat-functions.md)
- **Title**: Chat Pure Functions 명세
- **Description**: `src/lib/functions/chat.functions.ts`에서 관리하는 1:1 채팅용 순수 함수 목록
- **Version**: 1.0.0
- **Step**: 30
- **Priority**: *
- **Dependencies**:
  - sonub-functions-overview.md
- **Tags**: chat, functions
- **주요 함수**:
  - `buildSingleRoomId(a, b)` → 두 UID를 정렬해 `single-{uidA}-{uidB}` 형식 roomId 생성
  - 사용처와 검증 포인트, 클릭 시 `/chat/room` 진입 전략 명시

### Date Functions
- **File**: [sonub-functions-date-functions.md](./sonub-functions-date-functions.md)
- **Title**: 날짜·시간 순수 함수 명세
- **Description**: `src/lib/functions/date.functions.ts` 기반 날짜/시간 포맷 함수와 Intl 사용 가이드
- **Version**: 1.2.0
- **Step**: 30
- **Priority**: *
- **Dependencies**:
  - sonub-functions-overview.md
- **Tags**: date, time, functions
- **주요 내용**:
  - `formatLongDate(timestamp)`/`formatShortDate(timestamp)` dual 포맷 전략
  - Intl.DateTimeFormat/RelativeTimeFormat 활용법, SSR·타임존 처리 팁

## User Authentication

### Sonub User Login
- **File**: [sonub-user-login.md](./sonub-user-login.md)
- **Title**: Sonub User Login - Google 및 Apple 소셜 로그인
- **Description**: Firebase를 사용한 Google 및 Apple 소셜 로그인 기능 구현 명세서
- **Version**: 1.1.0
- **Step**: 30
- **Priority**: **
- **Dependencies**:
  - sonub-setup-firebase.md
  - sonub-setup-shadcn.md
- **Tags**: firebase, authentication, google-login, apple-login, oauth, svelte5
- **Files**:
  - `src/routes/user/login/+page.svelte` - 로그인 페이지
  - `src/lib/components/user-login.svelte` - 로그인 컴포넌트
  - `src/lib/stores/auth.svelte.ts` - 인증 상태 관리 스토어
  - `src/lib/utils/auth-helpers.ts` - 인증 헬퍼 함수
- **구현된 기능**:
  - Google OAuth 2.0 로그인
  - Apple Sign In 로그인
  - 다국어 지원 (ko, ja, zh, en)
  - 세션 관리 및 에러 핸들링
- **설치된 패키지**:
  - firebase@12.5.0
  - clsx@2.1.0
  - tailwind-merge@2.2.1

### Auth Store Specification
- **File**: [sonub-store-auth.md](./sonub-store-auth.md)
- **Title**: 인증 스토어 (AuthStore)
- **Description**: Firebase Authentication 상태 관리 스토어 - onAuthStateChanged 리스너, 프로필 동기화, 관리자 권한 관리
- **Version**: 1.0.0
- **Step**: 45
- **Priority**: ***
- **Dependencies**:
  - sonub-setup-firebase.md
  - sonub-firebase-auth.md
  - sonub-firebase-realtime-database.md
  - sonub-firebase-database-structure.md
- **Tags**: firebase, authentication, auth, svelte5, store, state-management, rtdb, admin, profile-sync
- **Files**:
  - `src/lib/stores/auth.svelte.ts`
- **핵심 기능**:
  - `onAuthStateChanged` 리스너로 자동 세션 관리
  - `syncUserProfile()` - Firebase Auth → RTDB 프로필 자동 동기화
  - `loadAdminList()` - `/system/settings/admins` 경로에서 관리자 목록 로드
  - `isAdmin` getter - 관리자 권한 확인
  - AuthState 타입 정의 (user, loading, initialized, adminList)
  - 전체 소스 코드 및 사용 예제 포함

## User Management

### Sonub User Overview
- **File**: [sonub-user-overview.md](./sonub-user-overview.md)
- **Title**: 사용자 관리 체계 및 프로필 관리 명세서
- **Description**: Firebase Authentication과 Realtime Database를 활용한 사용자 관리 시스템 설계 및 구현 명세서
- **Version**: 1.0.0
- **Step**: 40
- **Priority**: **
- **Dependencies**:
  - sonub-user-login.md
  - sonub-setup-firebase.md
- **Tags**: user-management, profile, firebase, authentication
- **관련 세부 명세**:
  - 사용자 프로필 정보 구조
  - Firebase Storage 및 Realtime Database 저장소 설계
  - 실시간 프로필 업데이트 기능

### Sonub User Profile Store
- **File**: [sonub-store-user-profile.md](./sonub-store-user-profile.md)
- **Title**: 사용자 프로필 중앙 캐시 스토어
- **Description**: RTDB `/users/{uid}` 데이터를 단일 스토어로 관리해 Avatar·TopBar 등에서 일관된 프로필 정보를 제공하는 명세
- **Version**: 1.0.0
- **Step**: 44
- **Priority**: **
- **Dependencies**:
  - sonub-setup-firebase.md
  - sonub-firebase-database-structure.md
  - sonub-user-avatar.md
- **Tags**: firebase, rtdb, store, cache, svelte5
- **Files**:
  - `src/lib/stores/user-profile.svelte.ts`
- **핵심 기능**:
  - Map 기반 캐시와 단일 `onValue` 리스너로 중복 구독 제거 및 실시간 동기화
  - `getProfile`, `isLoading`, `getError` API와 Svelte 5 runes 반응성 패턴
  - Avatar/TopBar/RightSidebar/프로필 페이지와 연동된 photoUrl·displayName 공유
  - 구독 해제, 오류 처리, QA 체크리스트 및 향후 확장 아이디어

### Sonub User Profile Sync
- **File**: [sonub-user-profile-sync.md](./sonub-user-profile-sync.md)
- **Title**: Sonub User Profile Sync
- **Description**: Firebase Auth 로그인 직후 `/users/{uid}`에 displayName과 photoUrl을 자동 저장하는 동기화 플로우
- **Version**: 1.0.0
- **Step**: 15
- **Priority**: ***
- **Dependencies**:
  - sonub-setup-firebase.md
  - sonub-firebase-database-structure.md
  - sonub-user-login.md
  - sonub-user-props.md
- **Tags**: authentication, database, sync, firebase, rtdb
- **핵심 구현**:
  - `syncAuthProfileToRtdb()` 헬퍼 및 Google/Apple 로그인 연동
  - `photoURL` → `photoUrl` 변환, null-safe 저장
  - `onAuthStateChanged`/Cloud Functions와의 연계로 user-props 자동 갱신
  - 에러 로깅, QA 시나리오, Emulator 검증 절차

### Sonub User Public Profile
- **File**: [sonub-user-public-profile.md](./sonub-user-public-profile.md)
- **Status**: ⚠️ 문서가 비어 있습니다. 공개 프로필 레이아웃/데이터 명세가 필요하면 개발자에게 추가 지침을 요청하세요.

### Sonub My Profile
- **File**: [sonub-my-profile.md](./sonub-my-profile.md)
- **Title**: 사용자 프로필 수정 페이지
- **Description**: `/my/profile`에서 프로필 사진 업로드, 닉네임·성별·생년월일을 수정하는 UI/데이터 명세
- **Version**: 2.0.0
- **Step**: 50
- **Priority**: **
- **Dependencies**:
  - sonub-user-overview.md
  - sonub-setup-firebase.md
  - sonub-setup-shadcn.md
  - sonub-firebase-security.md
  - sonub-design-components.md
- **Tags**: user-profile, firebase-storage, profile-edit, svelte5
- **Files**:
  - `src/routes/my/profile/+page.svelte`
- **주요 기능**:
  - Firebase Storage 업로드/삭제, RTDB `/users/{uid}` 업데이트
  - 닉네임/성별/생년월일 검증 로직
  - Alert/Card/Button 기반 Light Mode UI
  - 로그인 사용자만 접근

### Sonub Friend Overview
- **File**: [sonub-friend-overview.md](./sonub-friend-overview.md)
- **Title**: 친구·팔로잉/팔로워 관계 및 홈 피드 연동 개요
- **Description**: 친구 관계를 `/user-following`·`/user-followers`로 관리하고, 팔로잉한 사용자의 게시물과 채팅 활동을 홈 피드/알림에 반영하는 전체 워크플로 명세
- **Version**: 1.0.0
- **Step**: 55
- **Priority**: **
- **Dependencies**:
  - sonub-user-overview.md
  - sonub-firebase-database-structure.md
  - sonub-store-user-profile.md
- **Tags**: friends, following, follower, feed, social
- **핵심 내용**:
  - `/user-following/{uid}/{targetUid}`·`/user-followers/{uid}/{followerUid}` 구조와 Cloud Functions 동기화
  - 팔로우/언팔로우 버튼 UX, Chat 탭 "친구" 메뉴, 친구 찾기 CTA 명세
  - 팔로잉 사용자의 메시지·포스트를 `/user-feed/{uid}`에 fan-out하고 FCM/알림을 발송하는 절차
  - QA 체크리스트: 관계 데이터 일관성, 피드 노출, 알림 중복 방지

### Sonub Reaction History
- **File**: [sonub-reaction-history.md](./sonub-reaction-history.md)
- **Title**: Sonub 리액션 히스토리 시스템
- **Description**: 사용자가 만든 모든 활동과 다른 사용자가 남긴 반응을 `나의 발자취`·`받은 반응` 경로로 분리 저장하고, Cloud Functions와 UI 흐름을 정의한 기록 시스템 명세
- **Version**: (미정)
- **Step**: (미정)
- **Priority**: (미정)
- **Dependencies**:
  - sonub-firebase-database-structure.md
  - sonub-firebase-functions.md
  - sonub-like-overview.md
  - sonub-forum-post.md
  - sonub-friend-overview.md
- **Tags**: reaction, history, activity, firebase, cloud-functions
- **주요 내용**:
  - `/my-actions/{uid}/{pushKey}`와 `/received-reactions/{uid}/{pushKey}` 구조에 `ReactionRecord(fromUid, type, targetType, targetId, postId?, createdAt)` 필드를 저장하고 `createdAt` 인덱스를 명시해 최신순 조회를 보장
  - 좋아요/게시글/댓글/팔로우 이벤트마다 Functions 유틸이 fan-out 기록을 생성·삭제하며 자기 자신에게는 받은 반응이 쌓이지 않게 validation
  - 댓글 반응을 위한 `postId` 보조 필드, 취소/삭제 시 targetId·fromUid 기반 검색 절차, `.indexOn: ["createdAt"]` 규칙 등 데이터 설계 지침
  - DatabaseListView 기반의 `나의 발자취`, `받은 반응` 페이지에서 타입 필터, 무한 스크롤, 상대 시간, 빈 상태 메시지, 아바타·대상 링크 표시 등 UX 요구사항
  - 확장 아이디어: 읽음 플래그/배지 카운트, 알림 시스템 연동, 최소 사용자 정보(displayName/photoUrl)만 로드하여 비용 절감

### Sonub User Props
- **File**: [sonub-user-props.md](./sonub-user-props.md)
- **Title**: 사용자 속성 분리 및 대량 조회 최적화 명세서
- **Description**: 사용자 데이터 최적화를 위한 속성 분리 전략, user-props 구조 설계, Cloud Functions 자동 동기화
- **Version**: 1.0.0
- **Step**: 50
- **Priority**: *
- **Dependencies**:
  - sonub-user-overview.md
  - sonub-setup-firebase.md
- **Tags**: user-props, database-optimization, firebase-realtime, performance
- **구현된 기능**:
  - user-props 분리 구조 설계
  - 대량 사용자 조회 최적화
  - displayName, photoUrl, createdAt, updatedAt, gender, birthYear 등 속성 분리
  - Cloud Functions를 통한 자동 동기화
  - 선택적 조회를 통한 데이터 전송량 최소화

## Admin Management

### Sonub Admin Dashboard
- **File**: [sonub-admin-dashboard.md](./sonub-admin-dashboard.md)
- **Title**: Sonub Admin Dashboard
- **Description**: 관리자 대시보드에서 사용자/게시글/댓글/신고/통계를 한 화면에서 관리하는 절차
- **Version**: 1.0.0
- **Step**: (미정)
- **Priority**: (미정)
- **Dependencies**: 없음
- **Tags**: admin, dashboard, moderation
- **주요 내용**:
  - `/admin` 경로 전용 관리자 레이아웃과 상단 메뉴 구조
  - 사용자·글·댓글·신고·통계 섹션별 요구사항
  - Firebase Cloud Functions에 관리자 UID를 등록해 접근 제어

### Sonub Admin Report Management
- **File**: [sonub-admin-report-management.md](./sonub-admin-report-management.md)
- **Title**: Sonub Admin Report Management - 신고 관리 기능
- **Description**: 관리자/사용자 신고 목록 페이지, 타입 정의, 서비스 API, i18n을 포함한 전체 신고 처리 명세
- **Version**: 1.0.0
- **Step**: 40
- **Priority**: **
- **Dependencies**:
  - sonub-setup-firebase.md
  - sonub-firebase-database-structure.md
  - sonub-user-login.md
  - sonub-design-workflow.md
  - sonub-setup-svelte.md
- **Tags**: admin, report, moderation, firebase, sveltekit5
- **핵심 요소**:
  - `/admin/reports` 와 `/my/reports` 페이지 구성, DatabaseListView 파라미터 정의
  - `ReportType`, `ReportReason`, `removeReport()` 등 타입/서비스 명세
  - 메뉴/라우팅, 다국어 메시지, 유닛·E2E 테스트 계획

### Sonub Admin Report
- **File**: [sonub-admin-report.md](./sonub-admin-report.md)
- **Title**: 신고 목록 표시 기능 (Admin & User Report List)
- **Description**: 관리자 신고 목록 페이지 및 사용자 신고 목록 페이지 구현 명세서 - 신고된 게시글/댓글을 관리하고 사용자가 자신의 신고를 추적할 수 있는 기능
- **Version**: 1.0.0
- **Step**: 60
- **Priority**: *
- **Dependencies**:
  - sonub-user-overview.md
  - sonub-setup-firebase.md
  - sonub-setup-shadcn.md
- **Tags**: admin, report, firebase, list-view, svelte5
- **구현 페이지**:
  - `/admin/reports` - 관리자 신고 목록 (모든 신고 조회)
  - `/my/reports` - 사용자 신고 목록 (자신의 신고만 조회)
- **핵심 기능**:
  - 신고 목록 조회 및 필터링
  - 신고된 게시글/댓글로 이동
  - 신고 취소 기능
  - 실시간 데이터 동기화
  - 신고 사유 다국어 지원

### Sonub Admin Test User Management
- **File**: [sonub-admin-test-create-user-accounts.md](./sonub-admin-test-create-user-accounts.md)
- **Title**: Sonub Admin Test User Management
- **Description**: `/admin/users`는 테스트 사용자 목록/삭제 전용, `/admin/test/create-test-data`는 테스트 사용자/테스트 데이터 생성 전용으로 분리된 명세
- **Version**: 2.1.0
- **Step**: 65
- **Priority**: **
- **Dependencies**:
  - sonub-user-overview.md
  - sonub-setup-firebase.md
  - sonub-setup-shadcn.md
  - sonub-design-layout.md
- **Tags**: admin, test-user, firebase, rtdb, svelte5
- **주요 기능**:
  - 상단 탭 공유 레이아웃 (`/admin/+layout.svelte`)
  - `/admin/test/create-test-data`에서 테스트 사용자 100명 생성 카드와 테스트 데이터 생성 카드 제공
  - `/admin/users`에서 목록 조회, 개별 및 일괄 삭제 UI 제공 및 빈 상태 링크를 통한 생성 페이지 안내

---


## 개요
[파일의 목적과 주요 기능 설명]

## 소스 코드
```[언어]
[실제 소스 코드 전체 - 100% 원본 그대로]
```

## 주요 기능
(수동으로 업데이트 필요)

## 관련 파일
(수동으로 업데이트 필요)
```

### 💡 스펙 문서 활용 방법

#### 1. **AI 기반 바이브 코딩 (Vibe Coding)**
스펙 문서를 AI에게 제공하여 프로젝트를 자동으로 생성하거나 재현할 수 있습니다.

```bash
# 예: AI에게 전체 프로젝트 스펙 제공
cat specs/repository/src/**/*.md | ai-coder --output ./new-project
```

#### 2. **프로젝트 완전 재현**
스펙 문서의 소스 코드를 그대로 사용하여 프로젝트를 재현할 수 있습니다.

```python
# 스펙 문서에서 소스 코드를 추출하는 스크립트 예시
import re
from pathlib import Path

def extract_source_from_spec(spec_file):
    content = spec_file.read_text(encoding='utf-8')
    # ```언어 블록에서 소스 코드 추출
    matches = re.findall(r'```(\w+)\n(.*?)\n```', content, re.DOTALL)
    return matches[0][1] if matches else None
```

#### 3. **문서화 및 이해**
각 파일의 목적과 기능을 명확히 이해할 수 있습니다.

#### 4. **버전 관리**
스펙 문서를 통해 소스 코드의 변경 이력을 추적할 수 있습니다.

### 🔄 스펙 업데이트

소스 코드가 변경되면 다음 명령어로 스펙을 업데이트할 수 있습니다:

```bash
# 스펙 재생성 스크립트 실행
python3 tmp/generate-specs.py
```

이 스크립트는:
- 기존 `specs/repository/` 폴더를 삭제하지 않음
- 모든 소스 파일을 다시 스캔
- 각 파일의 스펙 문서를 재생성
- UTF-8 인코딩으로 저장

### ⚠️ 주의사항

1. **인코딩**: 모든 스펙 문서는 UTF-8 (BOM 제외) 인코딩을 사용합니다.
2. **언어**: 모든 설명과 주석은 한국어로 작성되어 있습니다.
3. **완전성**: 각 스펙 문서는 원본 소스 코드의 전체 내용을 포함합니다.
4. **자동 생성**: 스펙 문서는 자동으로 생성되므로, 수동으로 편집하지 마세요. 대신 원본 소스 코드를 수정하고 스펙을 재생성하세요.

### 🎯 사용 예시

#### 예시 1: 특정 컴포넌트 스펙 확인
```bash
# Button 컴포넌트 스펙 보기
cat specs/repository/src/lib/components/ui/button/button.svelte.md
```

#### 예시 2: 모든 라우트 페이지 스펙 찾기
```bash
# 모든 라우트 페이지 스펙 목록
find specs/repository/src/routes -name "+page.svelte.md"
```

#### 예시 3: Firebase Functions 스펙 확인
```bash
# 모든 Cloud Functions 스펙 목록
find specs/repository/firebase/functions/src -name "*.ts.md"
```

### 📋 전체 파일 목록

다음은 `./specs/repository/` 폴더에 생성된 **모든 459개 스펙 파일**의 전체 목록입니다.
각 파일은 원본 소스 코드의 전체 내용을 포함하고 있습니다.

#### 1. 루트 설정 파일 (7개)

- [components.json](./repository/components.json.md) - shadcn-svelte 컴포넌트 설정
- [eslint.config.js](./repository/eslint.config.js.md) - ESLint 설정
- [package.json](./repository/package.json.md) - 프로젝트 종속성 및 스크립트
- [playwright.config.ts](./repository/playwright.config.ts.md) - Playwright E2E 테스트 설정
- [svelte.config.js](./repository/svelte.config.js.md) - SvelteKit 설정
- [tsconfig.json](./repository/tsconfig.json.md) - TypeScript 컴파일러 설정
- [vite.config.ts](./repository/vite.config.ts.md) - Vite 빌드 도구 설정

#### 2. E2E 테스트 (1개)

- [e2e/demo.test.ts](./repository/e2e/demo.test.ts.md) - Playwright E2E 데모 테스트

#### 3. Firebase Admin (2개)

- [firebase/admin/package.json](./repository/firebase/admin/package.json.md) - Admin SDK 패키지 설정
- [firebase/admin/send-a-message.ts](./repository/firebase/admin/send-a-message.ts.md) - FCM 푸시 알림 전송 스크립트

#### 4. Firebase 설정 (3개)

- [firebase/cors.json](./repository/firebase/cors.json.md) - Firebase Storage CORS 설정
- [firebase/database.rules.json](./repository/firebase/database.rules.json.md) - Realtime Database 보안 규칙
- [firebase/firebase.json](./repository/firebase/firebase.json.md) - Firebase 프로젝트 설정

#### 5. Firebase Cloud Functions (34개)

**핸들러 (4개)**
- [firebase/functions/src/handlers/chat.handler.ts](./repository/firebase/functions/src/handlers/chat.handler.ts.md) - 채팅 메시지 생성 핸들러
- [firebase/functions/src/handlers/chat.new-message-count.handler.ts](./repository/firebase/functions/src/handlers/chat.new-message-count.handler.ts.md) - 새 메시지 개수 집계 핸들러
- [firebase/functions/src/handlers/chat.password-verification.handler.ts](./repository/firebase/functions/src/handlers/chat.password-verification.handler.ts.md) - 채팅방 비밀번호 검증 핸들러
- [firebase/functions/src/handlers/user.handler.ts](./repository/firebase/functions/src/handlers/user.handler.ts.md) - 사용자 생성/수정 핸들러

**유틸리티 (6개)**
- [firebase/functions/src/utils/comment.utils.ts](./repository/firebase/functions/src/utils/comment.utils.ts.md) - 댓글 유틸리티
- [firebase/functions/src/utils/fcm.utils.ts](./repository/firebase/functions/src/utils/fcm.utils.ts.md) - FCM 푸시 알림 유틸리티
- [firebase/functions/src/utils/like.utils.ts](./repository/firebase/functions/src/utils/like.utils.ts.md) - 좋아요 유틸리티
- [firebase/functions/src/utils/post.utils.ts](./repository/firebase/functions/src/utils/post.utils.ts.md) - 게시글 유틸리티
- [firebase/functions/src/utils/report.utils.ts](./repository/firebase/functions/src/utils/report.utils.ts.md) - 신고 유틸리티

**테스트 (9개)**
- [firebase/functions/test/integration/onLike.test.ts](./repository/firebase/functions/test/integration/onLike.test.ts.md) - 좋아요 통합 테스트
- [firebase/functions/test/integration/onPostCreate.test.ts](./repository/firebase/functions/test/integration/onPostCreate.test.ts.md) - 게시글 생성 통합 테스트
- [firebase/functions/test/integration/test-setup.ts](./repository/firebase/functions/test/integration/test-setup.ts.md) - 테스트 환경 설정
- [firebase/functions/test/unit/comment.handler.test.ts](./repository/firebase/functions/test/unit/comment.handler.test.ts.md) - 댓글 핸들러 단위 테스트
- [firebase/functions/test/unit/like.utils.test.ts](./repository/firebase/functions/test/unit/like.utils.test.ts.md) - 좋아요 유틸리티 단위 테스트
- [firebase/functions/test/unit/user.handler.test.ts](./repository/firebase/functions/test/unit/user.handler.test.ts.md) - 사용자 핸들러 단위 테스트

**설정 및 기타 (6개)**
- [firebase/functions/package.json](./repository/firebase/functions/package.json.md) - Cloud Functions 패키지 설정
- [firebase/functions/scripts/generate-sample-posts.ts](./repository/firebase/functions/scripts/generate-sample-posts.ts.md) - 샘플 게시글 생성 스크립트
- [firebase/functions/src/i18n.ts](./repository/firebase/functions/src/i18n.ts.md) - Cloud Functions i18n 설정
- [firebase/functions/src/index.ts](./repository/firebase/functions/src/index.ts.md) - Cloud Functions 메인 인덱스
- [firebase/functions/src/types/index.ts](./repository/firebase/functions/src/types/index.ts.md) - Cloud Functions 타입 정의
- [firebase/functions/tsconfig.dev.json](./repository/firebase/functions/tsconfig.dev.json.md) - 개발 TypeScript 설정
- [firebase/functions/tsconfig.json](./repository/firebase/functions/tsconfig.json.md) - Cloud Functions TypeScript 설정

#### 6. 다국어 메시지 (4개)

- [messages/en.json](./repository/messages/en.json.md) - 영어 메시지
- [messages/ja.json](./repository/messages/ja.json.md) - 일본어 메시지
- [messages/ko.json](./repository/messages/ko.json.md) - 한국어 메시지
- [messages/zh.json](./repository/messages/zh.json.md) - 중국어 메시지

#### 7. Shared 순수 함수 (2개)

- [shared/chat.pure-functions.ts](./repository/shared/chat.pure-functions.ts.md) - 채팅 순수 함수 (클라이언트/서버 공유)
- [shared/date.pure-functions.ts](./repository/shared/date.pure-functions.ts.md) - 날짜 순수 함수 (클라이언트/서버 공유)

#### 8. Source - App 코어 (6개)

- [src/app.css](./repository/src/app.css.md) - 전역 CSS 스타일
- [src/app.d.ts](./repository/src/app.d.ts.md) - SvelteKit 앱 타입 정의
- [src/app.html](./repository/src/app.html.md) - HTML 템플릿
- [src/demo.spec.ts](./repository/src/demo.spec.ts.md) - 데모 단위 테스트
- [src/hooks.server.ts](./repository/src/hooks.server.ts.md) - 서버 훅 (paraglide 미들웨어)

#### 9. Source - Components (약 110개)

**레이아웃 컴포넌트 (4개)**
- [src/lib/components/DatabaseListView.svelte](./repository/src/lib/components/DatabaseListView.svelte.md) - RTDB 무한 스크롤 리스트뷰 (모든 목록 표시에 사용)
- [src/lib/components/FcmPermissionGate.svelte](./repository/src/lib/components/FcmPermissionGate.svelte.md) - FCM 권한 게이트 컴포넌트
- [src/lib/components/left-sidebar.svelte](./repository/src/lib/components/left-sidebar.svelte.md) - 좌측 사이드바 (메뉴, 언어 선택)
- [src/lib/components/right-sidebar.svelte](./repository/src/lib/components/right-sidebar.svelte.md) - 우측 사이드바
- [src/lib/components/top-bar.svelte](./repository/src/lib/components/top-bar.svelte.md) - 탑바 (로고, 네비게이션, 로그인)

**관리자 컴포넌트 (1개)**
- [src/lib/components/admin-menu.svelte](./repository/src/lib/components/admin-menu.svelte.md) - 관리자 메뉴

**채팅 컴포넌트 (8개)**
- [src/lib/components/chat/ChatCreateDialog.svelte](./repository/src/lib/components/chat/ChatCreateDialog.svelte.md) - 채팅방 생성 다이얼로그
- [src/lib/components/chat/ChatFavoritesDialog.svelte](./repository/src/lib/components/chat/ChatFavoritesDialog.svelte.md) - 즐겨찾기 채팅방 다이얼로그
- [src/lib/components/chat/ChatInvitationList.svelte](./repository/src/lib/components/chat/ChatInvitationList.svelte.md) - 채팅 초대 목록
- [src/lib/components/chat/ChatListItem.svelte](./repository/src/lib/components/chat/ChatListItem.svelte.md) - 채팅 목록 아이템
- [src/lib/components/chat/ChatListMenu.svelte](./repository/src/lib/components/chat/ChatListMenu.svelte.md) - 채팅 목록 메뉴
- [src/lib/components/chat/room-password-prompt.svelte](./repository/src/lib/components/chat/room-password-prompt.svelte.md) - 채팅방 비밀번호 입력 프롬프트
- [src/lib/components/chat/room-password-setting.svelte](./repository/src/lib/components/chat/room-password-setting.svelte.md) - 채팅방 비밀번호 설정

**개발자 컴포넌트 (1개)**
- [src/lib/components/dev/dev-icon.svelte](./repository/src/lib/components/dev/dev-icon.svelte.md) - 개발자 아이콘

**사용자 컴포넌트 (4개)**
- [src/lib/components/under-construction.svelte](./repository/src/lib/components/under-construction.svelte.md) - 공사중 페이지
- [src/lib/components/user-login.svelte](./repository/src/lib/components/user-login.svelte.md) - 로그인 컴포넌트
- [src/lib/components/user/UserSearchDialog.svelte](./repository/src/lib/components/user/UserSearchDialog.svelte.md) - 사용자 검색 다이얼로그
- [src/lib/components/user/avatar.svelte](./repository/src/lib/components/user/avatar.svelte.md) - 사용자 아바타

**UI 컴포넌트 (45개 - shadcn-svelte 기반)**

Alert 컴포넌트 (4개):
- [src/lib/components/ui/alert/alert-description.svelte](./repository/src/lib/components/ui/alert/alert-description.svelte.md)
- [src/lib/components/ui/alert/alert-title.svelte](./repository/src/lib/components/ui/alert/alert-title.svelte.md)
- [src/lib/components/ui/alert/alert.svelte](./repository/src/lib/components/ui/alert/alert.svelte.md)
- [src/lib/components/ui/alert/index.ts](./repository/src/lib/components/ui/alert/index.ts.md)

Button 컴포넌트 (2개):
- [src/lib/components/ui/button/button.svelte](./repository/src/lib/components/ui/button/button.svelte.md)
- [src/lib/components/ui/button/index.ts](./repository/src/lib/components/ui/button/index.ts.md)

Card 컴포넌트 (7개):
- [src/lib/components/ui/card/card-content.svelte](./repository/src/lib/components/ui/card/card-content.svelte.md)
- [src/lib/components/ui/card/card-description.svelte](./repository/src/lib/components/ui/card/card-description.svelte.md)
- [src/lib/components/ui/card/card-footer.svelte](./repository/src/lib/components/ui/card/card-footer.svelte.md)
- [src/lib/components/ui/card/card-header.svelte](./repository/src/lib/components/ui/card/card-header.svelte.md)
- [src/lib/components/ui/card/card-title.svelte](./repository/src/lib/components/ui/card/card-title.svelte.md)
- [src/lib/components/ui/card/card.svelte](./repository/src/lib/components/ui/card/card.svelte.md)
- [src/lib/components/ui/card/index.ts](./repository/src/lib/components/ui/card/index.ts.md)

Dialog 컴포넌트 (8개):
- [src/lib/components/ui/dialog/context.ts](./repository/src/lib/components/ui/dialog/context.ts.md)
- [src/lib/components/ui/dialog/dialog-content.svelte](./repository/src/lib/components/ui/dialog/dialog-content.svelte.md)
- [src/lib/components/ui/dialog/dialog-description.svelte](./repository/src/lib/components/ui/dialog/dialog-description.svelte.md)
- [src/lib/components/ui/dialog/dialog-footer.svelte](./repository/src/lib/components/ui/dialog/dialog-footer.svelte.md)
- [src/lib/components/ui/dialog/dialog-header.svelte](./repository/src/lib/components/ui/dialog/dialog-header.svelte.md)
- [src/lib/components/ui/dialog/dialog-title.svelte](./repository/src/lib/components/ui/dialog/dialog-title.svelte.md)
- [src/lib/components/ui/dialog/dialog.svelte](./repository/src/lib/components/ui/dialog/dialog.svelte.md)
- [src/lib/components/ui/dialog/index.ts](./repository/src/lib/components/ui/dialog/index.ts.md)

Dropdown Menu 컴포넌트 (15개):
- [src/lib/components/ui/dropdown-menu/dropdown-menu-checkbox-group.svelte](./repository/src/lib/components/ui/dropdown-menu/dropdown-menu-checkbox-group.svelte.md)
- [src/lib/components/ui/dropdown-menu/dropdown-menu-checkbox-item.svelte](./repository/src/lib/components/ui/dropdown-menu/dropdown-menu-checkbox-item.svelte.md)
- [src/lib/components/ui/dropdown-menu/dropdown-menu-content.svelte](./repository/src/lib/components/ui/dropdown-menu/dropdown-menu-content.svelte.md)
- [src/lib/components/ui/dropdown-menu/dropdown-menu-group-heading.svelte](./repository/src/lib/components/ui/dropdown-menu/dropdown-menu-group-heading.svelte.md)
- [src/lib/components/ui/dropdown-menu/dropdown-menu-group.svelte](./repository/src/lib/components/ui/dropdown-menu/dropdown-menu-group.svelte.md)
- [src/lib/components/ui/dropdown-menu/dropdown-menu-item.svelte](./repository/src/lib/components/ui/dropdown-menu/dropdown-menu-item.svelte.md)
- [src/lib/components/ui/dropdown-menu/dropdown-menu-label.svelte](./repository/src/lib/components/ui/dropdown-menu/dropdown-menu-label.svelte.md)
- [src/lib/components/ui/dropdown-menu/dropdown-menu-radio-group.svelte](./repository/src/lib/components/ui/dropdown-menu/dropdown-menu-radio-group.svelte.md)
- [src/lib/components/ui/dropdown-menu/dropdown-menu-radio-item.svelte](./repository/src/lib/components/ui/dropdown-menu/dropdown-menu-radio-item.svelte.md)
- [src/lib/components/ui/dropdown-menu/dropdown-menu-separator.svelte](./repository/src/lib/components/ui/dropdown-menu/dropdown-menu-separator.svelte.md)
- [src/lib/components/ui/dropdown-menu/dropdown-menu-shortcut.svelte](./repository/src/lib/components/ui/dropdown-menu/dropdown-menu-shortcut.svelte.md)
- [src/lib/components/ui/dropdown-menu/dropdown-menu-sub-content.svelte](./repository/src/lib/components/ui/dropdown-menu/dropdown-menu-sub-content.svelte.md)
- [src/lib/components/ui/dropdown-menu/dropdown-menu-sub-trigger.svelte](./repository/src/lib/components/ui/dropdown-menu/dropdown-menu-sub-trigger.svelte.md)
- [src/lib/components/ui/dropdown-menu/dropdown-menu-trigger.svelte](./repository/src/lib/components/ui/dropdown-menu/dropdown-menu-trigger.svelte.md)
- [src/lib/components/ui/dropdown-menu/index.ts](./repository/src/lib/components/ui/dropdown-menu/index.ts.md)

Input 컴포넌트 (2개):
- [src/lib/components/ui/input/index.ts](./repository/src/lib/components/ui/input/index.ts.md)
- [src/lib/components/ui/input/input.svelte](./repository/src/lib/components/ui/input/input.svelte.md)

Label 컴포넌트 (2개):
- [src/lib/components/ui/label/index.ts](./repository/src/lib/components/ui/label/index.ts.md)
- [src/lib/components/ui/label/label.svelte](./repository/src/lib/components/ui/label/label.svelte.md)

Switch 컴포넌트 (2개):
- [src/lib/components/ui/switch/index.ts](./repository/src/lib/components/ui/switch/index.ts.md)
- [src/lib/components/ui/switch/switch.svelte](./repository/src/lib/components/ui/switch/switch.svelte.md)

#### 10. Source - Functions (3개)

- [src/lib/fcm.ts](./repository/src/lib/fcm.ts.md) - FCM (Firebase Cloud Messaging) 클라이언트 초기화 및 토큰 관리
- [src/lib/firebase.ts](./repository/src/lib/firebase.ts.md) - Firebase 초기화 및 서비스 인스턴스
- [src/lib/functions/chat.functions.ts](./repository/src/lib/functions/chat.functions.ts.md) - 채팅 순수 함수
- [src/lib/functions/date.functions.ts](./repository/src/lib/functions/date.functions.ts.md) - 날짜 순수 함수
- [src/lib/functions/storage.functions.ts](./repository/src/lib/functions/storage.functions.ts.md) - Firebase Storage 업로드 함수
- [src/lib/index.ts](./repository/src/lib/index.ts.md) - 라이브러리 메인 인덱스
- [src/lib/utils.ts](./repository/src/lib/utils.ts.md) - 공통 유틸리티 (cn 함수 등)

#### 11. Source - Paraglide (자동 생성된 다국어 메시지 파일, 약 250개)

**메인 파일 (6개)**
- [src/lib/paraglide/messages.js](./repository/src/lib/paraglide/messages.js.md) - 메시지 메인 인덱스
- [src/lib/paraglide/messages/_index.js](./repository/src/lib/paraglide/messages/_index.js.md) - 메시지 인덱스
- [src/lib/paraglide/messages/en.js](./repository/src/lib/paraglide/messages/en.js.md) - 영어 메시지
- [src/lib/paraglide/messages/ja.js](./repository/src/lib/paraglide/messages/ja.js.md) - 일본어 메시지
- [src/lib/paraglide/messages/ko.js](./repository/src/lib/paraglide/messages/ko.js.md) - 한국어 메시지
- [src/lib/paraglide/messages/zh.js](./repository/src/lib/paraglide/messages/zh.js.md) - 중국어 메시지
- [src/lib/paraglide/registry.js](./repository/src/lib/paraglide/registry.js.md) - Paraglide 레지스트리
- [src/lib/paraglide/runtime.js](./repository/src/lib/paraglide/runtime.js.md) - Paraglide 런타임
- [src/lib/paraglide/server.js](./repository/src/lib/paraglide/server.js.md) - Paraglide 서버 유틸리티

**개별 메시지 파일 (약 240개 - src/paraglide/messages/)**
- 모든 다국어 메시지 키별 자동 생성 파일 (예: `about.js`, `helloworld1.js`, `authsignin2.js` 등)
- 전체 목록은 `find specs/repository/src/paraglide/messages -name "*.js.md"` 명령으로 확인 가능

#### 12. Source - Routes (31개)

**메인 레이아웃 (2개)**
- [src/routes/+layout.svelte](./repository/src/routes/+layout.svelte.md) - 전역 레이아웃 (3컬럼 구조)
- [src/routes/+page.svelte](./repository/src/routes/+page.svelte.md) - 홈페이지

**관리자 페이지 (6개)**
- [src/routes/admin/+layout.svelte](./repository/src/routes/admin/+layout.svelte.md) - 관리자 레이아웃
- [src/routes/admin/dashboard/+page.svelte](./repository/src/routes/admin/dashboard/+page.svelte.md) - 관리자 대시보드
- [src/routes/admin/reports/+page.svelte](./repository/src/routes/admin/reports/+page.svelte.md) - 신고 관리 페이지
- [src/routes/admin/test/+page.svelte](./repository/src/routes/admin/test/+page.svelte.md) - 테스트 관리 페이지
- [src/routes/admin/test/create-test-data/+page.svelte](./repository/src/routes/admin/test/create-test-data/+page.svelte.md) - 테스트 데이터 생성 페이지
- [src/routes/admin/users/+page.svelte](./repository/src/routes/admin/users/+page.svelte.md) - 사용자 관리 페이지

**채팅 페이지 (5개)**
- [src/routes/chat/group-chat-list/+page.svelte](./repository/src/routes/chat/group-chat-list/+page.svelte.md) - 그룹 채팅 목록
- [src/routes/chat/list/+page.svelte](./repository/src/routes/chat/list/+page.svelte.md) - 전체 채팅 목록
- [src/routes/chat/open-chat-list/+page.svelte](./repository/src/routes/chat/open-chat-list/+page.svelte.md) - 오픈 채팅 목록
- [src/routes/chat/room/+layout.svelte](./repository/src/routes/chat/room/+layout.svelte.md) - 채팅방 레이아웃
- [src/routes/chat/room/+page.svelte](./repository/src/routes/chat/room/+page.svelte.md) - 채팅방 페이지
- [src/routes/chat/room/ChatRoomListItem.svelte](./repository/src/routes/chat/room/ChatRoomListItem.svelte.md) - 채팅방 메시지 아이템

**데모 페이지 (2개)**
- [src/routes/demo/+page.svelte](./repository/src/routes/demo/+page.svelte.md) - 데모 페이지
- [src/routes/demo/paraglide/+page.svelte](./repository/src/routes/demo/paraglide/+page.svelte.md) - Paraglide 데모 페이지

**개발자 페이지 (2개)**
- [src/routes/dev/plan/+page.svelte](./repository/src/routes/dev/plan/+page.svelte.md) - 개발 계획 페이지
- [src/routes/dev/test/database-list-view/+page.svelte](./repository/src/routes/dev/test/database-list-view/+page.svelte.md) - DatabaseListView 테스트 페이지

**FCM 테스트 (1개)**
- [src/routes/fcm-test/+page.svelte](./repository/src/routes/fcm-test/+page.svelte.md) - FCM 푸시 알림 테스트 페이지

**메뉴 페이지 (1개)**
- [src/routes/menu/+page.svelte](./repository/src/routes/menu/+page.svelte.md) - 메뉴 페이지

**마이 페이지 (3개)**
- [src/routes/my/+layout.svelte](./repository/src/routes/my/+layout.svelte.md) - 마이 레이아웃
- [src/routes/my/profile/+page.svelte](./repository/src/routes/my/profile/+page.svelte.md) - 내 프로필 수정 페이지
- [src/routes/my/reports/+page.svelte](./repository/src/routes/my/reports/+page.svelte.md) - 내 신고 목록 페이지

**게시글 페이지 (1개)**
- [src/routes/post/list/+page.svelte](./repository/src/routes/post/list/+page.svelte.md) - 게시글 목록

**설정 페이지 (1개)**
- [src/routes/settings/fcm/permission/+page.svelte](./repository/src/routes/settings/fcm/permission/+page.svelte.md) - FCM 권한 설정 페이지

**통계 페이지 (1개)**
- [src/routes/stats/+page.svelte](./repository/src/routes/stats/+page.svelte.md) - 통계 페이지

**사용자 페이지 (3개)**
- [src/routes/user/list/+page.svelte](./repository/src/routes/user/list/+page.svelte.md) - 사용자 목록
- [src/routes/user/login/+page.svelte](./repository/src/routes/user/login/+page.svelte.md) - 로그인 페이지
- [src/routes/user/profile/+page.svelte](./repository/src/routes/user/profile/+page.svelte.md) - 사용자 프로필 페이지

**테스트 (1개)**
- [src/routes/page.svelte.spec.ts](./repository/src/routes/page.svelte.spec.ts.md) - 페이지 단위 테스트

#### 13. Source - Stores (3개)

- [src/lib/stores/auth.svelte.ts](./repository/src/lib/stores/auth.svelte.ts.md) - 인증 상태 관리 스토어
- [src/lib/stores/database.svelte.ts](./repository/src/lib/stores/database.svelte.ts.md) - Firebase RTDB 유틸리티 스토어
- [src/lib/stores/user-profile.svelte.ts](./repository/src/lib/stores/user-profile.svelte.ts.md) - 사용자 프로필 중앙 캐시 스토어

#### 14. Source - Utils (4개)

- [src/lib/utils/admin-service.ts](./repository/src/lib/utils/admin-service.ts.md) - 관리자 서비스
- [src/lib/utils/auth-helpers.ts](./repository/src/lib/utils/auth-helpers.ts.md) - 인증 헬퍼 함수
- [src/lib/utils/test-user-generator.ts](./repository/src/lib/utils/test-user-generator.ts.md) - 테스트 사용자 생성 유틸리티
- [src/lib/version.ts](./repository/src/lib/version.ts.md) - 빌드 버전 정보

#### 15. Source - Types (1개)

- [src/lib/types/chat.types.ts](./repository/src/lib/types/chat.types.ts.md) - 채팅 타입 정의

#### 16. Static 파일 (1개)

- [static/firebase-messaging-sw.js](./repository/static/firebase-messaging-sw.js.md) - Firebase Cloud Messaging 서비스 워커

#### 17. Storybook (6개)

- [src/stories/Button.stories.svelte](./repository/src/stories/Button.stories.svelte.md) - Button 스토리
- [src/stories/Button.svelte](./repository/src/stories/Button.svelte.md) - Button 컴포넌트
- [src/stories/Header.stories.svelte](./repository/src/stories/Header.stories.svelte.md) - Header 스토리
- [src/stories/Header.svelte](./repository/src/stories/Header.svelte.md) - Header 컴포넌트
- [src/stories/Page.stories.svelte](./repository/src/stories/Page.stories.svelte.md) - Page 스토리
- [src/stories/Page.svelte](./repository/src/stories/Page.svelte.md) - Page 컴포넌트
- [src/stories/button.css](./repository/src/stories/button.css.md) - Button CSS
- [src/stories/header.css](./repository/src/stories/header.css.md) - Header CSS
- [src/stories/page.css](./repository/src/stories/page.css.md) - Page CSS

### 💡 파일 목록 활용 팁

1. **특정 파일 빠르게 찾기**: Ctrl+F 또는 Cmd+F로 파일명 검색
2. **카테고리별 탐색**: 위 목록의 카테고리를 참고하여 관련 파일 그룹 확인
3. **링크 클릭**: 각 파일명을 클릭하면 해당 스펙 문서로 이동
4. **AI 활용**: 전체 목록을 AI에게 제공하여 프로젝트 구조 이해 및 자동 생성 지원

---

## Firebase Functions

### Firebase Cloud Functions Triggers
- **File**: [sonub-firebase-functions-index.md](./sonub-firebase-functions-index.md)
- **Title**: Firebase Cloud Functions Triggers
- **Description**: Gen 2 Functions에서 `/users/{uid}` 및 `/chat-messages/{messageId}` 트리거를 정의하고 전역 옵션을 설정한 인덱스 명세
- **Version**: 1.0.0
- **Step**: (미정)
- **Priority**: *
- **Dependencies**:
  - sonub-firebase-cloudfunctions.md
- **Tags**: firebase, cloud-functions, triggers, backend
- **주요 내용**:
  - `setGlobalOptions({ region: 'asia-southeast1', maxInstances: 10 })` 설정
  - `onUserCreate`, `onUserUpdate`, `onChatMessageCreate` 트리거 정의와 처리 목적

### Firebase Cloud Functions - User Handler
- **File**: [sonub-firebase-functions-user-handler.md](./sonub-firebase-functions-user-handler.md)
- **Title**: Firebase Cloud Functions - User Handler
- **Description**: 사용자 생성/수정 시 호출되는 비즈니스 로직 핸들러 명세 (`handleUserCreate`, `handleUserUpdate`)
- **Version**: 1.0.0
- **Step**: (미정)
- **Priority**: *
- **Dependencies**:
  - sonub-firebase-functions-index.md
- **Tags**: firebase, cloud-functions, user, handler
- **주요 내용**:
  - createdAt 자동 생성, displayNameLowerCase/updatedAt 조건부 갱신
  - before/after 데이터를 이용한 변경 감지 및 로깅 전략

## Chat System

### Sonub Chat Overview
- **File**: [sonub-chat-overview.md](./sonub-chat-overview.md)
- **Title**: 채팅 및 게시판 통합 시스템 개요
- **Description**: 게시판과 실시간 채팅을 동일한 Flat 구조에서 운영하기 위한 데이터 모델과 권한 체계
- **Version**: 1.0.0
- **Step**: 20
- **Priority**: ***
- **Dependencies**:
  - sonub-firebase-database-structure.md
- **Tags**: chat, messaging, board, realtime, firebase-rtdb
- **주요 내용**:
  - 채팅방/서브채팅방 타입, owner/moderator/member 역할
  - `/chat-messages/{messageId}` Flat 구조, Order 필드 기반 정렬 전략
  - 게시판 통합, 메시지 타입, 생명주기 및 Cloud Functions 활용 지침

### Sonub Chat Message
- **File**: [sonub-chat-message.md](./sonub-chat-message.md)
- **Status**: ⚠️ 작성되지 않은 문서입니다. 채팅 메시지 세부 명세가 필요하면 개발자에게 추가 지시를 요청하세요.

### Sonub Chat File Attachment
- **File**: [sonub-chat-file-attachment.md](./sonub-chat-file-attachment.md)
- **Title**: 채팅 파일 첨부 기능 (Chat File Attachment)
- **Description**: 채팅 메시지에 파일 첨부 기능 - 이미지, 동영상, 문서 등 다중 파일 업로드 및 표시
- **Version**: 1.2.0
- **Step**: 55
- **Priority**: **
- **Dependencies**:
  - sonub-chat-room.md
  - sonub-setup-firebase.md
  - sonub-firebase-database-structure.md
  - sonub-design-workflow.md
- **Tags**: chat, file-upload, firebase-storage, attachment, svelte5, realtime, instant-upload, video-controls, file-size-limit, file-extension-display, filename-extension-extraction, circular-progress, drag-drop, animation
- **Files**:
  - `src/lib/types/chat.types.ts` - 채팅 메시지 및 파일 업로드 타입
  - `src/lib/functions/storage.functions.ts` - Firebase Storage 업로드 함수
  - `src/routes/chat/room/+page.svelte` - 채팅방 페이지 (파일 첨부 UI)
  - `firebase/storage.rules` - Firebase Storage 보안 규칙
- **주요 기능**:
  - **파일 선택 즉시 업로드** (v1.1.0) - 사용자가 업로드 성공 즉시 확인 가능
  - **동영상 재생 컨트롤러** (v1.1.1) - 미리보기에서 동영상 재생/일시정지/볼륨 조절 가능
  - **파일 타입별 크기 제한** (v1.1.2) - .mp4 동영상은 24MB, 그 외 파일은 10MB까지 허용
  - **파일 확장자 중앙 표시** (v1.1.3) - PDF, TXT, DOC 등 확장자를 크게 중앙에 표시
  - **파일명 확장자 추출 함수** (v1.1.4) - `getExtensionFromFilename()` 함수로 버그 수정
  - **원형 프로그레스바 진행률** (v1.2.0) - SVG 원형 프로그레스바와 부드러운 애니메이션
  - **드래그 앤 드롭 업로드** (v1.2.0) - 파일을 채팅창에 드래그하여 간편하게 업로드
  - 다중 파일 업로드 (이미지, 동영상, 문서, 압축파일)
  - 파일 미리보기 Grid UI (반응형, 정사각형 비율)
  - 파일 삭제 기능 (Firebase Storage에서 실제 삭제)
  - RTDB에 URL만 저장하여 용량 최소화 (60-70% 절감)
  - 메시지 버블 내 첨부파일 표시 (이미지/동영상/일반파일)
  - Firebase Storage 경로: `/users/{uid}/chat-files/{roomId}/{timestamp}-{filename}`
  - 최대 파일 크기: .mp4 동영상 24MB, 그 외 10MB
- **구현 완료**: ✅ 2025-11-14

### Sonub Chat Notification Sound
- **File**: [sonub-chat-notification-sound.md](./sonub-chat-notification-sound.md)
- **Title**: 채팅 새 메시지 알림음 시스템
- **Description**: 사용자별 읽지 않은 채팅 메시지 개수 집계 및 실시간 알림음 재생 시스템
- **Version**: 1.0.0
- **Step**: 52
- **Priority**: **
- **Dependencies**:
  - sonub-chat-overview.md
  - sonub-setup-firebase.md
  - sonub-firebase-database-structure.md
  - sonub-firebase-realtime-database.md
  - sonub-store-database.md
- **Tags**: chat, notification, sound, realtime, firebase-rtdb, cloud-functions, svelte5, broadcast-channel
- **Files**:
  - `firebase/functions/src/handlers/chat.new-message.handler.ts` - newMessageCount 집계 Cloud Function
  - `src/lib/components/top-bar.svelte` - 새 메시지 배지 UI
  - `src/routes/+layout.svelte` - 전역 알림음 시스템
  - `static/sound/new-message.mp3` - 알림음 파일
- **주요 기능**:
  - `/chat-joins/{uid}/{roomId}/newMessageCount` 자동 집계 → `/users/{uid}/newMessageCount`
  - Cloud Functions로 증가/감소/재계산 처리 (데이터 일관성 보장)
  - TopBar에 빨간색 배지로 읽지 않은 메시지 수 실시간 표시 (99+ 제한)
  - newMessageCount 증가 시 알림음 자동 재생
  - 채팅방 페이지에서는 알림음 재생 안 함
  - BroadcastChannel로 다중 탭 중복 재생 방지
  - 500ms 디바운스로 빠른 연속 재생 방지
  - rtdbStore()를 통한 실시간 구독 및 Svelte 5 runes 기반 반응형 UI
- **구현 완료**: ✅ 2025-11-14

### Sonub Chat Room Password
- **File**: [sonub-chat-room-password.md](./sonub-chat-room-password.md)
- **Title**: 채팅방 비밀번호 보호 기능
- **Description**: 그룹/오픈 채팅방에 비밀번호를 설정하여 입장을 제한하는 기능
- **Version**: 1.0.0
- **Step**: 53
- **Priority**: **
- **Dependencies**:
  - sonub-chat-overview.md
  - sonub-setup-firebase.md
  - sonub-firebase-database-structure.md
  - sonub-firebase-realtime-database.md
- **Tags**: chat, password, security, firebase-rtdb, cloud-functions, svelte5, authentication
- **Files**:
  - `firebase/functions/src/handlers/chat.password-verification.handler.ts` - 비밀번호 검증 Cloud Function
  - `firebase/database.rules.json` - Firebase Security Rules (password 보호 로직)
  - `src/lib/components/chat/room-password-setting.svelte` - 비밀번호 설정 UI (Owner 전용)
  - `src/lib/components/chat/room-password-prompt.svelte` - 비밀번호 입력 모달
  - `src/routes/chat/room/+page.svelte` - 채팅방 입장 로직 수정
  - `messages/*.json` - 다국어 지원 (ko, en, ja, zh)
- **주요 기능**:
  - 채팅방 Owner만 비밀번호 설정/해제 가능
  - Plain text 비밀번호 저장 (최소 4자)
  - `/chat-room-passwords/{roomId}/password` 경로에 비밀번호 저장
  - `/chat-rooms/{roomId}/password: true` 플래그로 비밀번호 활성화
  - Cloud Functions를 통한 서버 측 비밀번호 검증
  - `/chat-room-passwords/{roomId}/try/{uid}`에 비밀번호 입력 시 검증 트리거
  - 검증 성공 시 `/chat-rooms/{roomId}/members/{uid}: true` 자동 추가
  - 10초 폴링으로 검증 결과 실시간 확인
  - Firebase Security Rules로 비밀번호 있는 방 입장 차단 (Owner 제외)
  - shadcn-svelte Dialog, Input, Switch 컴포넌트 활용
  - 다국어 지원 (chatPasswordSettings, chatPasswordVerifying 등)
- **구현 완료**: ✅ 2025-11-14

## Forum System

### Sonub Forum Overview
- **File**: [sonub-forum-overview.md](./sonub-forum-overview.md)
- **Title**: 게시판 기능 개요
- **Description**: 채팅 시스템과 통합된 게시판 기능의 아키텍처 및 구현 사양
- **Version**: 1.0.0
- **Dependencies**:
  - sonub-chat-overview.md
  - sonub-firebase-database-structure.md
  - sonub-firebase-database-list-view.md
- **Tags**: forum, board, post, category, chat-integration, firebase-rtdb
- **주요 내용**:
  - 채팅 메시지를 게시판 글로 활용하는 통합 구조
  - 카테고리별 게시글 정렬 (allCategoryOrder, categoryOrder)
  - DatabaseListView 기반 무한 스크롤 게시판
  - 게시글 작성/수정/삭제 및 댓글 시스템

### Sonub Forum Post
- **File**: [sonub-forum-post.md](./sonub-forum-post.md)
- **Title**: 게시판 글 목록 UI 구조
- **Description**: 게시판 글 목록 페이지의 HTML layout 구조 및 스타일링 사양
- **Version**: 1.0.0
- **Dependencies**:
  - sonub-forum-overview.md
  - sonub-firebase-database-list-view.md
  - sonub-firebase-storage.md
  - sonub-user-avatar.md
- **Tags**: forum, post, layout, ui, html-structure
- **Files**:
  - `src/routes/+page.svelte` - 홈페이지 (최근 게시글 목록)
  - `src/routes/post/list/+page.svelte` - 게시판 목록 (카테고리별)
  - `src/lib/components/UserProfile.svelte` - 작성자 프로필 컴포넌트
  - `src/lib/components/FileAttachments.svelte` - 첨부 파일 미리보기
  - `src/lib/components/post/PostCommentList.svelte` - 댓글 목록
- **주요 내용**:
  - 게시글 카드 HTML 구조 (카테고리 뱃지, 내용, 메타 정보)
  - UserProfile 컴포넌트 (프로필 사진 + 이름)
  - FileAttachments 컴포넌트 (이미지/비디오/기타 파일)
  - PostCommentList 컴포넌트 (댓글 목록 + 답글)
  - Tailwind CSS 스타일링 규칙
  - 반응형 디자인 및 접근성 가이드라인
- **구현 완료**: ✅ 2025-01-17

## Deployment

### Sonub Deploy Workflow
- **File**: [sonub-deploy-workflow.md](./sonub-deploy-workflow.md)
- **Title**: GitHub 푸시 기반 자동 배포 워크플로우 명세서
- **Description**: GitHub repository에 코드를 푸시하면 Dokploy에서 webhook 이벤트를 받아 자동으로 빌드하고 프로덕션 사이트를 업데이트하는 CI/CD 워크플로우
- **Version**: 1.0.0
- **Step**: 100
- **Priority**: **
- **Dependencies**:
  - sonub-setup-svelte.md
- **Tags**: deployment, github, dokploy, ci-cd, production
- **배포 프로세스**:
  - GitHub repository에 코드 푸시
  - GitHub Webhook 이벤트 발생
  - Dokploy Webhook 수신 및 자동 빌드 시작
  - 의존성 설치, SvelteKit 빌드, 테스트 실행
  - 프로덕션 서버 배포
  - 헬스 체크 및 모니터링
- **주요 기능**:
  - 자동 배포 (CI/CD)
  - 빌드 성공/실패 처리
  - 자동 롤백 메커니즘
  - 배포 로그 및 모니터링
  - 헬스 체크 자동화

## Complete Source Code Specs

이 섹션은 Sonub 프로젝트의 모든 소스 코드를 SED 스펙 형식으로 문서화한 것입니다.

**목적**: 스펙만으로 완전히 동일한 (또는 매우 비슷한) 웹/앱을 만들어 낼 수 있도록 모든 소스 코드를 포함합니다.

**총 스펙 파일 수**: 591개

**마지막 업데이트**: 2025-11-20

---

### 설정 파일 (Configuration)

파일 수: 16개

- [`.mcp.json`](specs/repository/.mcp.json.md)
- [`components.json`](specs/repository/components.json.md)
- [`firebase/cors.json`](specs/repository/firebase/cors.json.md)
- [`firebase/database.rules.json`](specs/repository/firebase/database.rules.json.md)
- [`firebase/firebase.json`](specs/repository/firebase/firebase.json.md)
- [`firebase/functions/package-lock.json`](specs/repository/firebase/functions/package-lock.json.md)
- [`firebase/functions/package.json`](specs/repository/firebase/functions/package.json.md)
- [`firebase/functions/tsconfig.dev.json`](specs/repository/firebase/functions/tsconfig.dev.json.md)
- [`firebase/functions/tsconfig.json`](specs/repository/firebase/functions/tsconfig.json.md)
- [`messages/en.json`](specs/repository/messages/en.json.md)
- [`messages/ja.json`](specs/repository/messages/ja.json.md)
- [`messages/ko.json`](specs/repository/messages/ko.json.md)
- [`messages/zh.json`](specs/repository/messages/zh.json.md)
- [`package-lock.json`](specs/repository/package-lock.json.md)
- [`package.json`](specs/repository/package.json.md)
- [`tsconfig.json`](specs/repository/tsconfig.json.md)

### Svelte 페이지 (Routes)

파일 수: 35개

- [`src/routes/+layout.svelte`](specs/repository/src/routes/+layout.svelte.md)
- [`src/routes/+page.svelte`](specs/repository/src/routes/+page.svelte.md)
- [`src/routes/admin/+layout.svelte`](specs/repository/src/routes/admin/+layout.svelte.md)
- [`src/routes/admin/dashboard/+page.svelte`](specs/repository/src/routes/admin/dashboard/+page.svelte.md)
- [`src/routes/admin/reports/+page.svelte`](specs/repository/src/routes/admin/reports/+page.svelte.md)
- [`src/routes/admin/users/+page.svelte`](specs/repository/src/routes/admin/users/+page.svelte.md)
- [`src/routes/chat/group-chat-list/+page.svelte`](specs/repository/src/routes/chat/group-chat-list/+page.svelte.md)
- [`src/routes/chat/list/+page.svelte`](specs/repository/src/routes/chat/list/+page.svelte.md)
- [`src/routes/chat/open-chat-list/+page.svelte`](specs/repository/src/routes/chat/open-chat-list/+page.svelte.md)
- [`src/routes/chat/room/+layout.svelte`](specs/repository/src/routes/chat/room/+layout.svelte.md)
- [`src/routes/chat/room/+page.svelte`](specs/repository/src/routes/chat/room/+page.svelte.md)
- [`src/routes/chat/room/ChatRoomListItem.svelte`](specs/repository/src/routes/chat/room/ChatRoomListItem.svelte.md)
- [`src/routes/demo/+page.svelte`](specs/repository/src/routes/demo/+page.svelte.md)
- [`src/routes/demo/paraglide/+page.svelte`](specs/repository/src/routes/demo/paraglide/+page.svelte.md)
- [`src/routes/dev/create-posts/+page.svelte`](specs/repository/src/routes/dev/create-posts/+page.svelte.md)
- [`src/routes/dev/plan/+page.svelte`](specs/repository/src/routes/dev/plan/+page.svelte.md)
- [`src/routes/fcm-test/+page.svelte`](specs/repository/src/routes/fcm-test/+page.svelte.md)
- [`src/routes/friend/followers/+page.svelte`](specs/repository/src/routes/friend/followers/+page.svelte.md)
- [`src/routes/friend/following/+page.svelte`](specs/repository/src/routes/friend/following/+page.svelte.md)
- [`src/routes/menu/+page.svelte`](specs/repository/src/routes/menu/+page.svelte.md)
- [`src/routes/my/+layout.svelte`](specs/repository/src/routes/my/+layout.svelte.md)
- [`src/routes/my/activity/+page.svelte`](specs/repository/src/routes/my/activity/+page.svelte.md)
- [`src/routes/my/profile/+page.svelte`](specs/repository/src/routes/my/profile/+page.svelte.md)
- [`src/routes/my/reactions/+page.svelte`](specs/repository/src/routes/my/reactions/+page.svelte.md)
- [`src/routes/my/reports/+page.svelte`](specs/repository/src/routes/my/reports/+page.svelte.md)
- [`src/routes/my/stats/+page.svelte`](specs/repository/src/routes/my/stats/+page.svelte.md)
- [`src/routes/page.svelte.spec.ts`](specs/repository/src/routes/page.svelte.spec.ts.md)
- [`src/routes/post/list/+page.svelte`](specs/repository/src/routes/post/list/+page.svelte.md)
- [`src/routes/post/popular/+page.svelte`](specs/repository/src/routes/post/popular/+page.svelte.md)
- [`src/routes/settings/fcm/permission/+page.svelte`](specs/repository/src/routes/settings/fcm/permission/+page.svelte.md)
- [`src/routes/stats/+page.svelte`](specs/repository/src/routes/stats/+page.svelte.md)
- [`src/routes/user/influencers/+page.svelte`](specs/repository/src/routes/user/influencers/+page.svelte.md)
- [`src/routes/user/list/+page.svelte`](specs/repository/src/routes/user/list/+page.svelte.md)
- [`src/routes/user/login/+page.svelte`](specs/repository/src/routes/user/login/+page.svelte.md)
- [`src/routes/user/profile/+page.svelte`](specs/repository/src/routes/user/profile/+page.svelte.md)

### Firebase Cloud Functions - Handlers

파일 수: 25개

- [`firebase/functions/src/handlers/chat.invitation-create.handler.ts`](specs/repository/firebase/functions/src/handlers/chat.invitation-create.handler.ts.md)
- [`firebase/functions/src/handlers/chat.join-create.handler.ts`](specs/repository/firebase/functions/src/handlers/chat.join-create.handler.ts.md)
- [`firebase/functions/src/handlers/chat.message-category.handler.ts`](specs/repository/firebase/functions/src/handlers/chat.message-category.handler.ts.md)
- [`firebase/functions/src/handlers/chat.message-create.handler.ts`](specs/repository/firebase/functions/src/handlers/chat.message-create.handler.ts.md)
- [`firebase/functions/src/handlers/chat.message-sync.handler.ts`](specs/repository/firebase/functions/src/handlers/chat.message-sync.handler.ts.md)
- [`firebase/functions/src/handlers/chat.new-message-count.handler.ts`](specs/repository/firebase/functions/src/handlers/chat.new-message-count.handler.ts.md)
- [`firebase/functions/src/handlers/chat.password-verification.handler.ts`](specs/repository/firebase/functions/src/handlers/chat.password-verification.handler.ts.md)
- [`firebase/functions/src/handlers/chat.room-create.handler.ts`](specs/repository/firebase/functions/src/handlers/chat.room-create.handler.ts.md)
- [`firebase/functions/src/handlers/chat.room-member-join.handler.ts`](specs/repository/firebase/functions/src/handlers/chat.room-member-join.handler.ts.md)
- [`firebase/functions/src/handlers/chat.room-member-leave.handler.ts`](specs/repository/firebase/functions/src/handlers/chat.room-member-leave.handler.ts.md)
- [`firebase/functions/src/handlers/chat.room-pin-create.handler.ts`](specs/repository/firebase/functions/src/handlers/chat.room-pin-create.handler.ts.md)
- [`firebase/functions/src/handlers/chat.room-pin-delete.handler.ts`](specs/repository/firebase/functions/src/handlers/chat.room-pin-delete.handler.ts.md)
- [`firebase/functions/src/handlers/comment.create.handler.ts`](specs/repository/firebase/functions/src/handlers/comment.create.handler.ts.md)
- [`firebase/functions/src/handlers/feed.fanout.handler.ts`](specs/repository/firebase/functions/src/handlers/feed.fanout.handler.ts.md)
- [`firebase/functions/src/handlers/friend.follow.handler.ts`](specs/repository/firebase/functions/src/handlers/friend.follow.handler.ts.md)
- [`firebase/functions/src/handlers/like.handler.ts`](specs/repository/firebase/functions/src/handlers/like.handler.ts.md)
- [`firebase/functions/src/handlers/post-ranking.handler.ts`](specs/repository/firebase/functions/src/handlers/post-ranking.handler.ts.md)
- [`firebase/functions/src/handlers/post.create.handler.ts`](specs/repository/firebase/functions/src/handlers/post.create.handler.ts.md)
- [`firebase/functions/src/handlers/stats.comment.handler.ts`](specs/repository/firebase/functions/src/handlers/stats.comment.handler.ts.md)
- [`firebase/functions/src/handlers/stats.follow.handler.ts`](specs/repository/firebase/functions/src/handlers/stats.follow.handler.ts.md)
- [`firebase/functions/src/handlers/stats.like.handler.ts`](specs/repository/firebase/functions/src/handlers/stats.like.handler.ts.md)
- [`firebase/functions/src/handlers/stats.post.handler.ts`](specs/repository/firebase/functions/src/handlers/stats.post.handler.ts.md)
- [`firebase/functions/src/handlers/stats.ranking.handler.ts`](specs/repository/firebase/functions/src/handlers/stats.ranking.handler.ts.md)
- [`firebase/functions/src/handlers/user-action-counters.handler.ts`](specs/repository/firebase/functions/src/handlers/user-action-counters.handler.ts.md)
- [`firebase/functions/src/handlers/user.handler.ts`](specs/repository/firebase/functions/src/handlers/user.handler.ts.md)

### Firebase Cloud Functions - Utils

파일 수: 6개

- [`firebase/functions/src/utils/comment.utils.ts`](specs/repository/firebase/functions/src/utils/comment.utils.ts.md)
- [`firebase/functions/src/utils/fcm.utils.ts`](specs/repository/firebase/functions/src/utils/fcm.utils.ts.md)
- [`firebase/functions/src/utils/post.utils.ts`](specs/repository/firebase/functions/src/utils/post.utils.ts.md)
- [`firebase/functions/src/utils/reaction-history.utils.ts`](specs/repository/firebase/functions/src/utils/reaction-history.utils.ts.md)
- [`firebase/functions/src/utils/report.utils.ts`](specs/repository/firebase/functions/src/utils/report.utils.ts.md)
- [`firebase/functions/src/utils/stats.utils.ts`](specs/repository/firebase/functions/src/utils/stats.utils.ts.md)

### Firebase Cloud Functions - 기타

파일 수: 4개

- [`firebase/functions/src/i18n.ts`](specs/repository/firebase/functions/src/i18n.ts.md)
- [`firebase/functions/src/index.ts`](specs/repository/firebase/functions/src/index.ts.md)
- [`firebase/functions/src/shared/influencer-scores.constants.ts`](specs/repository/firebase/functions/src/shared/influencer-scores.constants.ts.md)
- [`firebase/functions/src/types/index.ts`](specs/repository/firebase/functions/src/types/index.ts.md)

### 공유 코드 (Shared)

파일 수: 5개

- [`shared/categories.ts`](specs/repository/shared/categories.ts.md)
- [`shared/chat.pure-functions.ts`](specs/repository/shared/chat.pure-functions.ts.md)
- [`shared/date.pure-functions.ts`](specs/repository/shared/date.pure-functions.ts.md)
- [`shared/order-value.utils.ts`](specs/repository/shared/order-value.utils.ts.md)
- [`shared/thread-order.ts`](specs/repository/shared/thread-order.ts.md)

### 스타일 (Styles)

파일 수: 4개

- [`src/app.css`](specs/repository/src/app.css.md)
- [`src/stories/button.css`](specs/repository/src/stories/button.css.md)
- [`src/stories/header.css`](specs/repository/src/stories/header.css.md)
- [`src/stories/page.css`](specs/repository/src/stories/page.css.md)

### 기타 (Others)

파일 수: 496개

- [`e2e/demo.test.ts`](specs/repository/e2e/demo.test.ts.md)
- [`eslint.config.js`](specs/repository/eslint.config.js.md)
- [`firebase/functions/.eslintrc.js`](specs/repository/firebase/functions/.eslintrc.js.md)
- [`firebase/functions/vitest.config.ts`](specs/repository/firebase/functions/vitest.config.ts.md)
- [`playwright.config.ts`](specs/repository/playwright.config.ts.md)
- [`src/app.html`](specs/repository/src/app.html.md)
- [`src/demo.spec.ts`](specs/repository/src/demo.spec.ts.md)
- [`src/hooks.server.ts`](specs/repository/src/hooks.server.ts.md)
- [`src/paraglide/messages.js`](specs/repository/src/paraglide/messages.js.md)
- [`src/paraglide/messages/_delete.js`](specs/repository/src/paraglide/messages/_delete.js.md)
- [`src/paraglide/messages/_index.js`](specs/repository/src/paraglide/messages/_index.js.md)
- [`src/paraglide/messages/about.js`](specs/repository/src/paraglide/messages/about.js.md)
- [`src/paraglide/messages/admindashboard1.js`](specs/repository/src/paraglide/messages/admindashboard1.js.md)
- [`src/paraglide/messages/admindashboardguide2.js`](specs/repository/src/paraglide/messages/admindashboardguide2.js.md)
- [`src/paraglide/messages/admindashboardmenu2.js`](specs/repository/src/paraglide/messages/admindashboardmenu2.js.md)
- [`src/paraglide/messages/admininfodatadelete3.js`](specs/repository/src/paraglide/messages/admininfodatadelete3.js.md)
- [`src/paraglide/messages/admininfopermissionnotimplemented4.js`](specs/repository/src/paraglide/messages/admininfopermissionnotimplemented4.js.md)
- [`src/paraglide/messages/admininfotestflag3.js`](specs/repository/src/paraglide/messages/admininfotestflag3.js.md)
- [`src/paraglide/messages/adminreportlist2.js`](specs/repository/src/paraglide/messages/adminreportlist2.js.md)
- [`src/paraglide/messages/adminreportlistdesc3.js`](specs/repository/src/paraglide/messages/adminreportlistdesc3.js.md)
- [`src/paraglide/messages/adminreportlistguide3.js`](specs/repository/src/paraglide/messages/adminreportlistguide3.js.md)
- [`src/paraglide/messages/admintest1.js`](specs/repository/src/paraglide/messages/admintest1.js.md)
- [`src/paraglide/messages/admintestdesc2.js`](specs/repository/src/paraglide/messages/admintestdesc2.js.md)
- [`src/paraglide/messages/admintestmenu2.js`](specs/repository/src/paraglide/messages/admintestmenu2.js.md)
- [`src/paraglide/messages/admintestusermanagement3.js`](specs/repository/src/paraglide/messages/admintestusermanagement3.js.md)
- [`src/paraglide/messages/admintestusermanagementdesc4.js`](specs/repository/src/paraglide/messages/admintestusermanagementdesc4.js.md)
- [`src/paraglide/messages/adminuserlist2.js`](specs/repository/src/paraglide/messages/adminuserlist2.js.md)
- [`src/paraglide/messages/adminuserlistdesc3.js`](specs/repository/src/paraglide/messages/adminuserlistdesc3.js.md)
- [`src/paraglide/messages/adminuserlistmenu3.js`](specs/repository/src/paraglide/messages/adminuserlistmenu3.js.md)
- [`src/paraglide/messages/apptitle1.js`](specs/repository/src/paraglide/messages/apptitle1.js.md)
- [`src/paraglide/messages/attachmentshowless2.js`](specs/repository/src/paraglide/messages/attachmentshowless2.js.md)
- [`src/paraglide/messages/authdescription1.js`](specs/repository/src/paraglide/messages/authdescription1.js.md)
- [`src/paraglide/messages/authgetstarted2.js`](specs/repository/src/paraglide/messages/authgetstarted2.js.md)
- [`src/paraglide/messages/authintro1.js`](specs/repository/src/paraglide/messages/authintro1.js.md)
- [`src/paraglide/messages/authloginrequired2.js`](specs/repository/src/paraglide/messages/authloginrequired2.js.md)
- [`src/paraglide/messages/authsignin2.js`](specs/repository/src/paraglide/messages/authsignin2.js.md)
- [`src/paraglide/messages/authsigninaction3.js`](specs/repository/src/paraglide/messages/authsigninaction3.js.md)
- [`src/paraglide/messages/authsigninfailed3.js`](specs/repository/src/paraglide/messages/authsigninfailed3.js.md)
- [`src/paraglide/messages/authsigningin2.js`](specs/repository/src/paraglide/messages/authsigningin2.js.md)
- [`src/paraglide/messages/authsigningout2.js`](specs/repository/src/paraglide/messages/authsigningout2.js.md)
- [`src/paraglide/messages/authsigninguide3.js`](specs/repository/src/paraglide/messages/authsigninguide3.js.md)
- [`src/paraglide/messages/authsigninguidestart4.js`](specs/repository/src/paraglide/messages/authsigninguidestart4.js.md)
- [`src/paraglide/messages/authsigninrequired3.js`](specs/repository/src/paraglide/messages/authsigninrequired3.js.md)
- [`src/paraglide/messages/authsigninrequireddesc4.js`](specs/repository/src/paraglide/messages/authsigninrequireddesc4.js.md)
- [`src/paraglide/messages/authsigninwithapple4.js`](specs/repository/src/paraglide/messages/authsigninwithapple4.js.md)
- [`src/paraglide/messages/authsigninwithgoogle4.js`](specs/repository/src/paraglide/messages/authsigninwithgoogle4.js.md)
- [`src/paraglide/messages/authwelcome1.js`](specs/repository/src/paraglide/messages/authwelcome1.js.md)
- [`src/paraglide/messages/authwelcomemessage2.js`](specs/repository/src/paraglide/messages/authwelcomemessage2.js.md)
- [`src/paraglide/messages/authwelcomeuser2.js`](specs/repository/src/paraglide/messages/authwelcomeuser2.js.md)
- [`src/paraglide/messages/board.js`](specs/repository/src/paraglide/messages/board.js.md)
- [`src/paraglide/messages/boardconstruction1.js`](specs/repository/src/paraglide/messages/boardconstruction1.js.md)
- [`src/paraglide/messages/boardtabfree2.js`](specs/repository/src/paraglide/messages/boardtabfree2.js.md)
- [`src/paraglide/messages/boardtabmarket2.js`](specs/repository/src/paraglide/messages/boardtabmarket2.js.md)
- [`src/paraglide/messages/boardtabqna2.js`](specs/repository/src/paraglide/messages/boardtabqna2.js.md)
- [`src/paraglide/messages/boardunderconstruction2.js`](specs/repository/src/paraglide/messages/boardunderconstruction2.js.md)
- [`src/paraglide/messages/boardwritepost2.js`](specs/repository/src/paraglide/messages/boardwritepost2.js.md)
- [`src/paraglide/messages/cancel.js`](specs/repository/src/paraglide/messages/cancel.js.md)
- [`src/paraglide/messages/chat.js`](specs/repository/src/paraglide/messages/chat.js.md)
- [`src/paraglide/messages/chataccept1.js`](specs/repository/src/paraglide/messages/chataccept1.js.md)
- [`src/paraglide/messages/chatadduidorroomid5.js`](specs/repository/src/paraglide/messages/chatadduidorroomid5.js.md)
- [`src/paraglide/messages/chatcategoryfood2.js`](specs/repository/src/paraglide/messages/chatcategoryfood2.js.md)
- [`src/paraglide/messages/chatcategoryforsale3.js`](specs/repository/src/paraglide/messages/chatcategoryforsale3.js.md)
- [`src/paraglide/messages/chatcategoryfreediscussion3.js`](specs/repository/src/paraglide/messages/chatcategoryfreediscussion3.js.md)
- [`src/paraglide/messages/chatcategoryhobby2.js`](specs/repository/src/paraglide/messages/chatcategoryhobby2.js.md)
- [`src/paraglide/messages/chatcategoryinformation2.js`](specs/repository/src/paraglide/messages/chatcategoryinformation2.js.md)
- [`src/paraglide/messages/chatcategoryjobs2.js`](specs/repository/src/paraglide/messages/chatcategoryjobs2.js.md)
- [`src/paraglide/messages/chatcategorylabel2.js`](specs/repository/src/paraglide/messages/chatcategorylabel2.js.md)
- [`src/paraglide/messages/chatcategorynews2.js`](specs/repository/src/paraglide/messages/chatcategorynews2.js.md)
- [`src/paraglide/messages/chatcategoryqna2.js`](specs/repository/src/paraglide/messages/chatcategoryqna2.js.md)
- [`src/paraglide/messages/chatcategoryrealestate3.js`](specs/repository/src/paraglide/messages/chatcategoryrealestate3.js.md)
- [`src/paraglide/messages/chatcategoryselect2.js`](specs/repository/src/paraglide/messages/chatcategoryselect2.js.md)
- [`src/paraglide/messages/chatcategorystory2.js`](specs/repository/src/paraglide/messages/chatcategorystory2.js.md)
- [`src/paraglide/messages/chatcategorytravel2.js`](specs/repository/src/paraglide/messages/chatcategorytravel2.js.md)
- [`src/paraglide/messages/chatchatroom2.js`](specs/repository/src/paraglide/messages/chatchatroom2.js.md)
- [`src/paraglide/messages/chatchattingwith2.js`](specs/repository/src/paraglide/messages/chatchattingwith2.js.md)
- [`src/paraglide/messages/chatconstruction1.js`](specs/repository/src/paraglide/messages/chatconstruction1.js.md)
- [`src/paraglide/messages/chatcreategroupchat3.js`](specs/repository/src/paraglide/messages/chatcreategroupchat3.js.md)
- [`src/paraglide/messages/chatcreateopenchat3.js`](specs/repository/src/paraglide/messages/chatcreateopenchat3.js.md)
- [`src/paraglide/messages/chatcreateroom2.js`](specs/repository/src/paraglide/messages/chatcreateroom2.js.md)
- [`src/paraglide/messages/chatdirectchat2.js`](specs/repository/src/paraglide/messages/chatdirectchat2.js.md)
- [`src/paraglide/messages/chatemptyrooms2.js`](specs/repository/src/paraglide/messages/chatemptyrooms2.js.md)
- [`src/paraglide/messages/chatfindfriends2.js`](specs/repository/src/paraglide/messages/chatfindfriends2.js.md)
- [`src/paraglide/messages/chatinvitationsent2.js`](specs/repository/src/paraglide/messages/chatinvitationsent2.js.md)
- [`src/paraglide/messages/chatinvitefriend2.js`](specs/repository/src/paraglide/messages/chatinvitefriend2.js.md)
- [`src/paraglide/messages/chatinvitetoroom3.js`](specs/repository/src/paraglide/messages/chatinvitetoroom3.js.md)
- [`src/paraglide/messages/chatlastmessagelabel3.js`](specs/repository/src/paraglide/messages/chatlastmessagelabel3.js.md)
- [`src/paraglide/messages/chatloadingmessages2.js`](specs/repository/src/paraglide/messages/chatloadingmessages2.js.md)
- [`src/paraglide/messages/chatloadingmore2.js`](specs/repository/src/paraglide/messages/chatloadingmore2.js.md)
- [`src/paraglide/messages/chatloadingprofile2.js`](specs/repository/src/paraglide/messages/chatloadingprofile2.js.md)
- [`src/paraglide/messages/chatloadingrooms2.js`](specs/repository/src/paraglide/messages/chatloadingrooms2.js.md)
- [`src/paraglide/messages/chatloadmessagesfailed3.js`](specs/repository/src/paraglide/messages/chatloadmessagesfailed3.js.md)
- [`src/paraglide/messages/chatloadprofilefailed3.js`](specs/repository/src/paraglide/messages/chatloadprofilefailed3.js.md)
- [`src/paraglide/messages/chatmyroomsdesc3.js`](specs/repository/src/paraglide/messages/chatmyroomsdesc3.js.md)
- [`src/paraglide/messages/chatmyroomstitle3.js`](specs/repository/src/paraglide/messages/chatmyroomstitle3.js.md)
- [`src/paraglide/messages/chatnomessages2.js`](specs/repository/src/paraglide/messages/chatnomessages2.js.md)
- [`src/paraglide/messages/chatnomoremessages3.js`](specs/repository/src/paraglide/messages/chatnomoremessages3.js.md)
- [`src/paraglide/messages/chatopenroom2.js`](specs/repository/src/paraglide/messages/chatopenroom2.js.md)
- [`src/paraglide/messages/chatoverview1.js`](specs/repository/src/paraglide/messages/chatoverview1.js.md)
- [`src/paraglide/messages/chatpartner1.js`](specs/repository/src/paraglide/messages/chatpartner1.js.md)
- [`src/paraglide/messages/chatpasswordconfirmplaceholder3.js`](specs/repository/src/paraglide/messages/chatpasswordconfirmplaceholder3.js.md)
- [`src/paraglide/messages/chatpassworddelete2.js`](specs/repository/src/paraglide/messages/chatpassworddelete2.js.md)
- [`src/paraglide/messages/chatpassworddeletesuccess3.js`](specs/repository/src/paraglide/messages/chatpassworddeletesuccess3.js.md)
- [`src/paraglide/messages/chatpasswordenabletoggle3.js`](specs/repository/src/paraglide/messages/chatpasswordenabletoggle3.js.md)
- [`src/paraglide/messages/chatpasswordenterprompt3.js`](specs/repository/src/paraglide/messages/chatpasswordenterprompt3.js.md)
- [`src/paraglide/messages/chatpasswordincorrect2.js`](specs/repository/src/paraglide/messages/chatpasswordincorrect2.js.md)
- [`src/paraglide/messages/chatpasswordinputplaceholder3.js`](specs/repository/src/paraglide/messages/chatpasswordinputplaceholder3.js.md)
- [`src/paraglide/messages/chatpasswordminlengtherror4.js`](specs/repository/src/paraglide/messages/chatpasswordminlengtherror4.js.md)
- [`src/paraglide/messages/chatpasswordmismatcherror3.js`](specs/repository/src/paraglide/messages/chatpasswordmismatcherror3.js.md)
- [`src/paraglide/messages/chatpasswordremovesuccess3.js`](specs/repository/src/paraglide/messages/chatpasswordremovesuccess3.js.md)
- [`src/paraglide/messages/chatpasswordrequired2.js`](specs/repository/src/paraglide/messages/chatpasswordrequired2.js.md)
- [`src/paraglide/messages/chatpasswordsavefailure3.js`](specs/repository/src/paraglide/messages/chatpasswordsavefailure3.js.md)
- [`src/paraglide/messages/chatpasswordsaving2.js`](specs/repository/src/paraglide/messages/chatpasswordsaving2.js.md)
- [`src/paraglide/messages/chatpasswordsetsuccess3.js`](specs/repository/src/paraglide/messages/chatpasswordsetsuccess3.js.md)
- [`src/paraglide/messages/chatpasswordsettings2.js`](specs/repository/src/paraglide/messages/chatpasswordsettings2.js.md)
- [`src/paraglide/messages/chatpasswordverifyfailure3.js`](specs/repository/src/paraglide/messages/chatpasswordverifyfailure3.js.md)
- [`src/paraglide/messages/chatpasswordverifying2.js`](specs/repository/src/paraglide/messages/chatpasswordverifying2.js.md)
- [`src/paraglide/messages/chatpasswordverifysuccess3.js`](specs/repository/src/paraglide/messages/chatpasswordverifysuccess3.js.md)
- [`src/paraglide/messages/chatpreparingstream2.js`](specs/repository/src/paraglide/messages/chatpreparingstream2.js.md)
- [`src/paraglide/messages/chatprovideuid2.js`](specs/repository/src/paraglide/messages/chatprovideuid2.js.md)
- [`src/paraglide/messages/chatreject1.js`](specs/repository/src/paraglide/messages/chatreject1.js.md)
- [`src/paraglide/messages/chatroom1.js`](specs/repository/src/paraglide/messages/chatroom1.js.md)
- [`src/paraglide/messages/chatroomlist2.js`](specs/repository/src/paraglide/messages/chatroomlist2.js.md)
- [`src/paraglide/messages/chatroomlistempty3.js`](specs/repository/src/paraglide/messages/chatroomlistempty3.js.md)
- [`src/paraglide/messages/chatroomlistloading3.js`](specs/repository/src/paraglide/messages/chatroomlistloading3.js.md)
- [`src/paraglide/messages/chatroomnotready3.js`](specs/repository/src/paraglide/messages/chatroomnotready3.js.md)
- [`src/paraglide/messages/chatroomready2.js`](specs/repository/src/paraglide/messages/chatroomready2.js.md)
- [`src/paraglide/messages/chatsearchusertoinvite4.js`](specs/repository/src/paraglide/messages/chatsearchusertoinvite4.js.md)
- [`src/paraglide/messages/chatselectconversation2.js`](specs/repository/src/paraglide/messages/chatselectconversation2.js.md)
- [`src/paraglide/messages/chatsend1.js`](specs/repository/src/paraglide/messages/chatsend1.js.md)
- [`src/paraglide/messages/chatsendfailed2.js`](specs/repository/src/paraglide/messages/chatsendfailed2.js.md)
- [`src/paraglide/messages/chatsending1.js`](specs/repository/src/paraglide/messages/chatsending1.js.md)
- [`src/paraglide/messages/chatsigninrequired3.js`](specs/repository/src/paraglide/messages/chatsigninrequired3.js.md)
- [`src/paraglide/messages/chatsignintosend4.js`](specs/repository/src/paraglide/messages/chatsignintosend4.js.md)
- [`src/paraglide/messages/chatsinglechat2.js`](specs/repository/src/paraglide/messages/chatsinglechat2.js.md)
- [`src/paraglide/messages/chattabbookmarks2.js`](specs/repository/src/paraglide/messages/chattabbookmarks2.js.md)
- [`src/paraglide/messages/chattabfriends2.js`](specs/repository/src/paraglide/messages/chattabfriends2.js.md)
- [`src/paraglide/messages/chattabgroupchats3.js`](specs/repository/src/paraglide/messages/chattabgroupchats3.js.md)
- [`src/paraglide/messages/chattabopenchats3.js`](specs/repository/src/paraglide/messages/chattabopenchats3.js.md)
- [`src/paraglide/messages/chattabsearch2.js`](specs/repository/src/paraglide/messages/chattabsearch2.js.md)
- [`src/paraglide/messages/chatunderconstruction2.js`](specs/repository/src/paraglide/messages/chatunderconstruction2.js.md)
- [`src/paraglide/messages/chatunknownerror2.js`](specs/repository/src/paraglide/messages/chatunknownerror2.js.md)
- [`src/paraglide/messages/chatunknownuser2.js`](specs/repository/src/paraglide/messages/chatunknownuser2.js.md)
- [`src/paraglide/messages/chatuptodate3.js`](specs/repository/src/paraglide/messages/chatuptodate3.js.md)
- [`src/paraglide/messages/chatwritemessage2.js`](specs/repository/src/paraglide/messages/chatwritemessage2.js.md)
- [`src/paraglide/messages/chatyou1.js`](specs/repository/src/paraglide/messages/chatyou1.js.md)
- [`src/paraglide/messages/close.js`](specs/repository/src/paraglide/messages/close.js.md)
- [`src/paraglide/messages/commoncancel1.js`](specs/repository/src/paraglide/messages/commoncancel1.js.md)
- [`src/paraglide/messages/commonclose1.js`](specs/repository/src/paraglide/messages/commonclose1.js.md)
- [`src/paraglide/messages/commoncomment1.js`](specs/repository/src/paraglide/messages/commoncomment1.js.md)
- [`src/paraglide/messages/commoncomplete1.js`](specs/repository/src/paraglide/messages/commoncomplete1.js.md)
- [`src/paraglide/messages/commonconfirm1.js`](specs/repository/src/paraglide/messages/commonconfirm1.js.md)
- [`src/paraglide/messages/commondelete1.js`](specs/repository/src/paraglide/messages/commondelete1.js.md)
- [`src/paraglide/messages/commonerror1.js`](specs/repository/src/paraglide/messages/commonerror1.js.md)
- [`src/paraglide/messages/commongo1.js`](specs/repository/src/paraglide/messages/commongo1.js.md)
- [`src/paraglide/messages/commoninfo1.js`](specs/repository/src/paraglide/messages/commoninfo1.js.md)
- [`src/paraglide/messages/commonloading1.js`](specs/repository/src/paraglide/messages/commonloading1.js.md)
- [`src/paraglide/messages/commonpost1.js`](specs/repository/src/paraglide/messages/commonpost1.js.md)
- [`src/paraglide/messages/commonprogress1.js`](specs/repository/src/paraglide/messages/commonprogress1.js.md)
- [`src/paraglide/messages/commonrefresh1.js`](specs/repository/src/paraglide/messages/commonrefresh1.js.md)
- [`src/paraglide/messages/commonretry1.js`](specs/repository/src/paraglide/messages/commonretry1.js.md)
- [`src/paraglide/messages/commonsave1.js`](specs/repository/src/paraglide/messages/commonsave1.js.md)
- [`src/paraglide/messages/commonstatus1.js`](specs/repository/src/paraglide/messages/commonstatus1.js.md)
- [`src/paraglide/messages/commonsuccess1.js`](specs/repository/src/paraglide/messages/commonsuccess1.js.md)
- [`src/paraglide/messages/commonuser1.js`](specs/repository/src/paraglide/messages/commonuser1.js.md)
- [`src/paraglide/messages/complete.js`](specs/repository/src/paraglide/messages/complete.js.md)
- [`src/paraglide/messages/composeall1.js`](specs/repository/src/paraglide/messages/composeall1.js.md)
- [`src/paraglide/messages/composepromptplaceholder2.js`](specs/repository/src/paraglide/messages/composepromptplaceholder2.js.md)
- [`src/paraglide/messages/confirm.js`](specs/repository/src/paraglide/messages/confirm.js.md)
- [`src/paraglide/messages/constructionbacktohome3.js`](specs/repository/src/paraglide/messages/constructionbacktohome3.js.md)
- [`src/paraglide/messages/constructionmessage1.js`](specs/repository/src/paraglide/messages/constructionmessage1.js.md)
- [`src/paraglide/messages/constructiontitle1.js`](specs/repository/src/paraglide/messages/constructiontitle1.js.md)
- [`src/paraglide/messages/constructionunderconstruction2.js`](specs/repository/src/paraglide/messages/constructionunderconstruction2.js.md)
- [`src/paraglide/messages/contact.js`](specs/repository/src/paraglide/messages/contact.js.md)
- [`src/paraglide/messages/error.js`](specs/repository/src/paraglide/messages/error.js.md)
- [`src/paraglide/messages/featurefirebaseauth2.js`](specs/repository/src/paraglide/messages/featurefirebaseauth2.js.md)
- [`src/paraglide/messages/featurefirebaseauthdesc3.js`](specs/repository/src/paraglide/messages/featurefirebaseauthdesc3.js.md)
- [`src/paraglide/messages/featuresveltekit51.js`](specs/repository/src/paraglide/messages/featuresveltekit51.js.md)
- [`src/paraglide/messages/featuresveltekit52.js`](specs/repository/src/paraglide/messages/featuresveltekit52.js.md)
- [`src/paraglide/messages/featuresveltekit5desc2.js`](specs/repository/src/paraglide/messages/featuresveltekit5desc2.js.md)
- [`src/paraglide/messages/featuretailwindcss2.js`](specs/repository/src/paraglide/messages/featuretailwindcss2.js.md)
- [`src/paraglide/messages/featuretailwindcss4.js`](specs/repository/src/paraglide/messages/featuretailwindcss4.js.md)
- [`src/paraglide/messages/featuretailwindcssdesc3.js`](specs/repository/src/paraglide/messages/featuretailwindcssdesc3.js.md)
- [`src/paraglide/messages/feedempty1.js`](specs/repository/src/paraglide/messages/feedempty1.js.md)
- [`src/paraglide/messages/feedloading1.js`](specs/repository/src/paraglide/messages/feedloading1.js.md)
- [`src/paraglide/messages/feedloadingmore2.js`](specs/repository/src/paraglide/messages/feedloadingmore2.js.md)
- [`src/paraglide/messages/feedloadmore2.js`](specs/repository/src/paraglide/messages/feedloadmore2.js.md)
- [`src/paraglide/messages/feedloginrequired2.js`](specs/repository/src/paraglide/messages/feedloginrequired2.js.md)
- [`src/paraglide/messages/feednomore2.js`](specs/repository/src/paraglide/messages/feednomore2.js.md)
- [`src/paraglide/messages/findusers1.js`](specs/repository/src/paraglide/messages/findusers1.js.md)
- [`src/paraglide/messages/followbutton1.js`](specs/repository/src/paraglide/messages/followbutton1.js.md)
- [`src/paraglide/messages/followercount1.js`](specs/repository/src/paraglide/messages/followercount1.js.md)
- [`src/paraglide/messages/followerror1.js`](specs/repository/src/paraglide/messages/followerror1.js.md)
- [`src/paraglide/messages/followerslist1.js`](specs/repository/src/paraglide/messages/followerslist1.js.md)
- [`src/paraglide/messages/followingbutton1.js`](specs/repository/src/paraglide/messages/followingbutton1.js.md)
- [`src/paraglide/messages/followingcount1.js`](specs/repository/src/paraglide/messages/followingcount1.js.md)
- [`src/paraglide/messages/followinglist1.js`](specs/repository/src/paraglide/messages/followinglist1.js.md)
- [`src/paraglide/messages/followloading1.js`](specs/repository/src/paraglide/messages/followloading1.js.md)
- [`src/paraglide/messages/followloginrequired2.js`](specs/repository/src/paraglide/messages/followloginrequired2.js.md)
- [`src/paraglide/messages/followselfnotallowed3.js`](specs/repository/src/paraglide/messages/followselfnotallowed3.js.md)
- [`src/paraglide/messages/followsuccess1.js`](specs/repository/src/paraglide/messages/followsuccess1.js.md)
- [`src/paraglide/messages/go.js`](specs/repository/src/paraglide/messages/go.js.md)
- [`src/paraglide/messages/helloworld1.js`](specs/repository/src/paraglide/messages/helloworld1.js.md)
- [`src/paraglide/messages/home.js`](specs/repository/src/paraglide/messages/home.js.md)
- [`src/paraglide/messages/homeopenchatnomessage4.js`](specs/repository/src/paraglide/messages/homeopenchatnomessage4.js.md)
- [`src/paraglide/messages/homesectionpopularopenroom4.js`](specs/repository/src/paraglide/messages/homesectionpopularopenroom4.js.md)
- [`src/paraglide/messages/homesectionpopularopenroomdesc5.js`](specs/repository/src/paraglide/messages/homesectionpopularopenroomdesc5.js.md)
- [`src/paraglide/messages/homesectionrecentopenchat4.js`](specs/repository/src/paraglide/messages/homesectionrecentopenchat4.js.md)
- [`src/paraglide/messages/homesectionrecentopenchatdesc5.js`](specs/repository/src/paraglide/messages/homesectionrecentopenchatdesc5.js.md)
- [`src/paraglide/messages/homesectionrecentopenchatempty5.js`](specs/repository/src/paraglide/messages/homesectionrecentopenchatempty5.js.md)
- [`src/paraglide/messages/homesectionrecentopenchatlogin5.js`](specs/repository/src/paraglide/messages/homesectionrecentopenchatlogin5.js.md)
- [`src/paraglide/messages/homesectionrecentposts3.js`](specs/repository/src/paraglide/messages/homesectionrecentposts3.js.md)
- [`src/paraglide/messages/homesectionrecentpostsdesc4.js`](specs/repository/src/paraglide/messages/homesectionrecentpostsdesc4.js.md)
- [`src/paraglide/messages/homesectionrecentusers3.js`](specs/repository/src/paraglide/messages/homesectionrecentusers3.js.md)
- [`src/paraglide/messages/homesectionrecentuserscount4.js`](specs/repository/src/paraglide/messages/homesectionrecentuserscount4.js.md)
- [`src/paraglide/messages/homesectionrecentusersdesc4.js`](specs/repository/src/paraglide/messages/homesectionrecentusersdesc4.js.md)
- [`src/paraglide/messages/homesidebaractivityempty3.js`](specs/repository/src/paraglide/messages/homesidebaractivityempty3.js.md)
- [`src/paraglide/messages/homesidebaractivitynotext4.js`](specs/repository/src/paraglide/messages/homesidebaractivitynotext4.js.md)
- [`src/paraglide/messages/homesidebaractivitytitle3.js`](specs/repository/src/paraglide/messages/homesidebaractivitytitle3.js.md)
- [`src/paraglide/messages/homesidebarfollowers2.js`](specs/repository/src/paraglide/messages/homesidebarfollowers2.js.md)
- [`src/paraglide/messages/homesidebarfollowersdesc3.js`](specs/repository/src/paraglide/messages/homesidebarfollowersdesc3.js.md)
- [`src/paraglide/messages/homesidebarfollowing2.js`](specs/repository/src/paraglide/messages/homesidebarfollowing2.js.md)
- [`src/paraglide/messages/homesidebarfollowingdesc3.js`](specs/repository/src/paraglide/messages/homesidebarfollowingdesc3.js.md)
- [`src/paraglide/messages/homesidebarlanguagelabel3.js`](specs/repository/src/paraglide/messages/homesidebarlanguagelabel3.js.md)
- [`src/paraglide/messages/homesidebarmemberscount3.js`](specs/repository/src/paraglide/messages/homesidebarmemberscount3.js.md)
- [`src/paraglide/messages/homesidebaropenchatempty4.js`](specs/repository/src/paraglide/messages/homesidebaropenchatempty4.js.md)
- [`src/paraglide/messages/homesidebaropenchatloading4.js`](specs/repository/src/paraglide/messages/homesidebaropenchatloading4.js.md)
- [`src/paraglide/messages/homesidebaropenchatsubtitle4.js`](specs/repository/src/paraglide/messages/homesidebaropenchatsubtitle4.js.md)
- [`src/paraglide/messages/homesidebarprofilelabel3.js`](specs/repository/src/paraglide/messages/homesidebarprofilelabel3.js.md)
- [`src/paraglide/messages/homesidebarreactions2.js`](specs/repository/src/paraglide/messages/homesidebarreactions2.js.md)
- [`src/paraglide/messages/homesidebarreactionsdesc3.js`](specs/repository/src/paraglide/messages/homesidebarreactionsdesc3.js.md)
- [`src/paraglide/messages/homesidebarrecentusersempty4.js`](specs/repository/src/paraglide/messages/homesidebarrecentusersempty4.js.md)
- [`src/paraglide/messages/homesidebarrecentusersloading4.js`](specs/repository/src/paraglide/messages/homesidebarrecentusersloading4.js.md)
- [`src/paraglide/messages/homesidebarrecentuserssubtitle4.js`](specs/repository/src/paraglide/messages/homesidebarrecentuserssubtitle4.js.md)
- [`src/paraglide/messages/homesidebarseemore3.js`](specs/repository/src/paraglide/messages/homesidebarseemore3.js.md)
- [`src/paraglide/messages/homesidebarstats2.js`](specs/repository/src/paraglide/messages/homesidebarstats2.js.md)
- [`src/paraglide/messages/homesidebarstatsdesc3.js`](specs/repository/src/paraglide/messages/homesidebarstatsdesc3.js.md)
- [`src/paraglide/messages/influencerempty1.js`](specs/repository/src/paraglide/messages/influencerempty1.js.md)
- [`src/paraglide/messages/influencerloading1.js`](specs/repository/src/paraglide/messages/influencerloading1.js.md)
- [`src/paraglide/messages/influencerrankingdescription2.js`](specs/repository/src/paraglide/messages/influencerrankingdescription2.js.md)
- [`src/paraglide/messages/influencerrankingtitle2.js`](specs/repository/src/paraglide/messages/influencerrankingtitle2.js.md)
- [`src/paraglide/messages/influencerscore1.js`](specs/repository/src/paraglide/messages/influencerscore1.js.md)
- [`src/paraglide/messages/influencertabdaily2.js`](specs/repository/src/paraglide/messages/influencertabdaily2.js.md)
- [`src/paraglide/messages/influencertabmonthly2.js`](specs/repository/src/paraglide/messages/influencertabmonthly2.js.md)
- [`src/paraglide/messages/influencertabyearly2.js`](specs/repository/src/paraglide/messages/influencertabyearly2.js.md)
- [`src/paraglide/messages/influencerunknown1.js`](specs/repository/src/paraglide/messages/influencerunknown1.js.md)
- [`src/paraglide/messages/influencerunknownuser2.js`](specs/repository/src/paraglide/messages/influencerunknownuser2.js.md)
- [`src/paraglide/messages/info.js`](specs/repository/src/paraglide/messages/info.js.md)
- [`src/paraglide/messages/likeusersempty2.js`](specs/repository/src/paraglide/messages/likeusersempty2.js.md)
- [`src/paraglide/messages/likeuserslist2.js`](specs/repository/src/paraglide/messages/likeuserslist2.js.md)
- [`src/paraglide/messages/linkfirebasedocs2.js`](specs/repository/src/paraglide/messages/linkfirebasedocs2.js.md)
- [`src/paraglide/messages/linkshadcnsvelte2.js`](specs/repository/src/paraglide/messages/linkshadcnsvelte2.js.md)
- [`src/paraglide/messages/linksveltekitdocs3.js`](specs/repository/src/paraglide/messages/linksveltekitdocs3.js.md)
- [`src/paraglide/messages/loading.js`](specs/repository/src/paraglide/messages/loading.js.md)
- [`src/paraglide/messages/loadinggeneric1.js`](specs/repository/src/paraglide/messages/loadinggeneric1.js.md)
- [`src/paraglide/messages/menu.js`](specs/repository/src/paraglide/messages/menu.js.md)
- [`src/paraglide/messages/menuadminpage2.js`](specs/repository/src/paraglide/messages/menuadminpage2.js.md)
- [`src/paraglide/messages/menudevtest2.js`](specs/repository/src/paraglide/messages/menudevtest2.js.md)
- [`src/paraglide/messages/menueditprofile2.js`](specs/repository/src/paraglide/messages/menueditprofile2.js.md)
- [`src/paraglide/messages/menuguide1.js`](specs/repository/src/paraglide/messages/menuguide1.js.md)
- [`src/paraglide/messages/menumyaccount2.js`](specs/repository/src/paraglide/messages/menumyaccount2.js.md)
- [`src/paraglide/messages/menupublicprofile2.js`](specs/repository/src/paraglide/messages/menupublicprofile2.js.md)
- [`src/paraglide/messages/menutitle1.js`](specs/repository/src/paraglide/messages/menutitle1.js.md)
- [`src/paraglide/messages/myprofile1.js`](specs/repository/src/paraglide/messages/myprofile1.js.md)
- [`src/paraglide/messages/myreactionsdescription2.js`](specs/repository/src/paraglide/messages/myreactionsdescription2.js.md)
- [`src/paraglide/messages/myreactionstitle2.js`](specs/repository/src/paraglide/messages/myreactionstitle2.js.md)
- [`src/paraglide/messages/mystatsdescription2.js`](specs/repository/src/paraglide/messages/mystatsdescription2.js.md)
- [`src/paraglide/messages/mystatstitle2.js`](specs/repository/src/paraglide/messages/mystatstitle2.js.md)
- [`src/paraglide/messages/navabout1.js`](specs/repository/src/paraglide/messages/navabout1.js.md)
- [`src/paraglide/messages/navboard1.js`](specs/repository/src/paraglide/messages/navboard1.js.md)
- [`src/paraglide/messages/navchat1.js`](specs/repository/src/paraglide/messages/navchat1.js.md)
- [`src/paraglide/messages/navcontact1.js`](specs/repository/src/paraglide/messages/navcontact1.js.md)
- [`src/paraglide/messages/navfindusers2.js`](specs/repository/src/paraglide/messages/navfindusers2.js.md)
- [`src/paraglide/messages/navhome1.js`](specs/repository/src/paraglide/messages/navhome1.js.md)
- [`src/paraglide/messages/navlogin1.js`](specs/repository/src/paraglide/messages/navlogin1.js.md)
- [`src/paraglide/messages/navlogout1.js`](specs/repository/src/paraglide/messages/navlogout1.js.md)
- [`src/paraglide/messages/navmenu1.js`](specs/repository/src/paraglide/messages/navmenu1.js.md)
- [`src/paraglide/messages/navmyprofile2.js`](specs/repository/src/paraglide/messages/navmyprofile2.js.md)
- [`src/paraglide/messages/navproducts1.js`](specs/repository/src/paraglide/messages/navproducts1.js.md)
- [`src/paraglide/messages/nofollowers1.js`](specs/repository/src/paraglide/messages/nofollowers1.js.md)
- [`src/paraglide/messages/nofollowing1.js`](specs/repository/src/paraglide/messages/nofollowing1.js.md)
- [`src/paraglide/messages/pagemetalogin2.js`](specs/repository/src/paraglide/messages/pagemetalogin2.js.md)
- [`src/paraglide/messages/pagemetasignin3.js`](specs/repository/src/paraglide/messages/pagemetasignin3.js.md)
- [`src/paraglide/messages/pagereturnhome2.js`](specs/repository/src/paraglide/messages/pagereturnhome2.js.md)
- [`src/paraglide/messages/pagetitleadminreports3.js`](specs/repository/src/paraglide/messages/pagetitleadminreports3.js.md)
- [`src/paraglide/messages/pagetitleboard2.js`](specs/repository/src/paraglide/messages/pagetitleboard2.js.md)
- [`src/paraglide/messages/pagetitlechat2.js`](specs/repository/src/paraglide/messages/pagetitlechat2.js.md)
- [`src/paraglide/messages/pagetitlehome2.js`](specs/repository/src/paraglide/messages/pagetitlehome2.js.md)
- [`src/paraglide/messages/pagetitlelogin2.js`](specs/repository/src/paraglide/messages/pagetitlelogin2.js.md)
- [`src/paraglide/messages/pagetitlemenu2.js`](specs/repository/src/paraglide/messages/pagetitlemenu2.js.md)
- [`src/paraglide/messages/pagetitlemyprofile3.js`](specs/repository/src/paraglide/messages/pagetitlemyprofile3.js.md)
- [`src/paraglide/messages/pagetitlemyreports3.js`](specs/repository/src/paraglide/messages/pagetitlemyreports3.js.md)
- [`src/paraglide/messages/pagetitlesignin3.js`](specs/repository/src/paraglide/messages/pagetitlesignin3.js.md)
- [`src/paraglide/messages/pagetitleuserlist3.js`](specs/repository/src/paraglide/messages/pagetitleuserlist3.js.md)
- [`src/paraglide/messages/pageunderconstruction2.js`](specs/repository/src/paraglide/messages/pageunderconstruction2.js.md)
- [`src/paraglide/messages/popularpostsdaily2.js`](specs/repository/src/paraglide/messages/popularpostsdaily2.js.md)
- [`src/paraglide/messages/popularpostsdescription2.js`](specs/repository/src/paraglide/messages/popularpostsdescription2.js.md)
- [`src/paraglide/messages/popularpostsempty2.js`](specs/repository/src/paraglide/messages/popularpostsempty2.js.md)
- [`src/paraglide/messages/popularpostsmonthly2.js`](specs/repository/src/paraglide/messages/popularpostsmonthly2.js.md)
- [`src/paraglide/messages/popularpoststitle2.js`](specs/repository/src/paraglide/messages/popularpoststitle2.js.md)
- [`src/paraglide/messages/popularpostsweekly2.js`](specs/repository/src/paraglide/messages/popularpostsweekly2.js.md)
- [`src/paraglide/messages/products.js`](specs/repository/src/paraglide/messages/products.js.md)
- [`src/paraglide/messages/profileagerestriction2.js`](specs/repository/src/paraglide/messages/profileagerestriction2.js.md)
- [`src/paraglide/messages/profilebirthdate1.js`](specs/repository/src/paraglide/messages/profilebirthdate1.js.md)
- [`src/paraglide/messages/profilebirthdateagelimit3.js`](specs/repository/src/paraglide/messages/profilebirthdateagelimit3.js.md)
- [`src/paraglide/messages/profilebirthdateday2.js`](specs/repository/src/paraglide/messages/profilebirthdateday2.js.md)
- [`src/paraglide/messages/profilebirthdatefutureerror3.js`](specs/repository/src/paraglide/messages/profilebirthdatefutureerror3.js.md)
- [`src/paraglide/messages/profilebirthdatemonth2.js`](specs/repository/src/paraglide/messages/profilebirthdatemonth2.js.md)
- [`src/paraglide/messages/profilebirthdateyear2.js`](specs/repository/src/paraglide/messages/profilebirthdateyear2.js.md)
- [`src/paraglide/messages/profilecommentcount2.js`](specs/repository/src/paraglide/messages/profilecommentcount2.js.md)
- [`src/paraglide/messages/profiledateofbirth3.js`](specs/repository/src/paraglide/messages/profiledateofbirth3.js.md)
- [`src/paraglide/messages/profiledateofbirthpasterror5.js`](specs/repository/src/paraglide/messages/profiledateofbirthpasterror5.js.md)
- [`src/paraglide/messages/profileday1.js`](specs/repository/src/paraglide/messages/profileday1.js.md)
- [`src/paraglide/messages/profiledayformat2.js`](specs/repository/src/paraglide/messages/profiledayformat2.js.md)
- [`src/paraglide/messages/profiledayvalue2.js`](specs/repository/src/paraglide/messages/profiledayvalue2.js.md)
- [`src/paraglide/messages/profilegender1.js`](specs/repository/src/paraglide/messages/profilegender1.js.md)
- [`src/paraglide/messages/profilegenderfemale2.js`](specs/repository/src/paraglide/messages/profilegenderfemale2.js.md)
- [`src/paraglide/messages/profilegendermale2.js`](specs/repository/src/paraglide/messages/profilegendermale2.js.md)
- [`src/paraglide/messages/profilegendernoanswer3.js`](specs/repository/src/paraglide/messages/profilegendernoanswer3.js.md)
- [`src/paraglide/messages/profilegendernotspecified3.js`](specs/repository/src/paraglide/messages/profilegendernotspecified3.js.md)
- [`src/paraglide/messages/profileinfluencerscore2.js`](specs/repository/src/paraglide/messages/profileinfluencerscore2.js.md)
- [`src/paraglide/messages/profileinfo1.js`](specs/repository/src/paraglide/messages/profileinfo1.js.md)
- [`src/paraglide/messages/profileinfoeditguide3.js`](specs/repository/src/paraglide/messages/profileinfoeditguide3.js.md)
- [`src/paraglide/messages/profileinfoguide2.js`](specs/repository/src/paraglide/messages/profileinfoguide2.js.md)
- [`src/paraglide/messages/profileloadfailed2.js`](specs/repository/src/paraglide/messages/profileloadfailed2.js.md)
- [`src/paraglide/messages/profileloading1.js`](specs/repository/src/paraglide/messages/profileloading1.js.md)
- [`src/paraglide/messages/profilememberinfo2.js`](specs/repository/src/paraglide/messages/profilememberinfo2.js.md)
- [`src/paraglide/messages/profilememberinfoeditguide4.js`](specs/repository/src/paraglide/messages/profilememberinfoeditguide4.js.md)
- [`src/paraglide/messages/profilememberinfoguide3.js`](specs/repository/src/paraglide/messages/profilememberinfoguide3.js.md)
- [`src/paraglide/messages/profilemonth1.js`](specs/repository/src/paraglide/messages/profilemonth1.js.md)
- [`src/paraglide/messages/profilemonthformat2.js`](specs/repository/src/paraglide/messages/profilemonthformat2.js.md)
- [`src/paraglide/messages/profilemonthvalue2.js`](specs/repository/src/paraglide/messages/profilemonthvalue2.js.md)
- [`src/paraglide/messages/profilenickname1.js`](specs/repository/src/paraglide/messages/profilenickname1.js.md)
- [`src/paraglide/messages/profilenicknameinput2.js`](specs/repository/src/paraglide/messages/profilenicknameinput2.js.md)
- [`src/paraglide/messages/profilenicknamelength2.js`](specs/repository/src/paraglide/messages/profilenicknamelength2.js.md)
- [`src/paraglide/messages/profilenicknamelengthlimit3.js`](specs/repository/src/paraglide/messages/profilenicknamelengthlimit3.js.md)
- [`src/paraglide/messages/profilenicknamemaxlength3.js`](specs/repository/src/paraglide/messages/profilenicknamemaxlength3.js.md)
- [`src/paraglide/messages/profilenicknamerequired2.js`](specs/repository/src/paraglide/messages/profilenicknamerequired2.js.md)
- [`src/paraglide/messages/profilephoto1.js`](specs/repository/src/paraglide/messages/profilephoto1.js.md)
- [`src/paraglide/messages/profilephotoremove2.js`](specs/repository/src/paraglide/messages/profilephotoremove2.js.md)
- [`src/paraglide/messages/profilephotoremovefailed3.js`](specs/repository/src/paraglide/messages/profilephotoremovefailed3.js.md)
- [`src/paraglide/messages/profilephotoremovesuccess3.js`](specs/repository/src/paraglide/messages/profilephotoremovesuccess3.js.md)
- [`src/paraglide/messages/profilephotosizeerror3.js`](specs/repository/src/paraglide/messages/profilephotosizeerror3.js.md)
- [`src/paraglide/messages/profilephototypeerror3.js`](specs/repository/src/paraglide/messages/profilephototypeerror3.js.md)
- [`src/paraglide/messages/profilephotouploadfailed3.js`](specs/repository/src/paraglide/messages/profilephotouploadfailed3.js.md)
- [`src/paraglide/messages/profilephotouploadguide3.js`](specs/repository/src/paraglide/messages/profilephotouploadguide3.js.md)
- [`src/paraglide/messages/profilephotouploadpreview3.js`](specs/repository/src/paraglide/messages/profilephotouploadpreview3.js.md)
- [`src/paraglide/messages/profilephotouploadsuccess3.js`](specs/repository/src/paraglide/messages/profilephotouploadsuccess3.js.md)
- [`src/paraglide/messages/profilepicture1.js`](specs/repository/src/paraglide/messages/profilepicture1.js.md)
- [`src/paraglide/messages/profilepicturepreview2.js`](specs/repository/src/paraglide/messages/profilepicturepreview2.js.md)
- [`src/paraglide/messages/profilepictureremove2.js`](specs/repository/src/paraglide/messages/profilepictureremove2.js.md)
- [`src/paraglide/messages/profilepictureremovefailed3.js`](specs/repository/src/paraglide/messages/profilepictureremovefailed3.js.md)
- [`src/paraglide/messages/profilepictureremovesuccess3.js`](specs/repository/src/paraglide/messages/profilepictureremovesuccess3.js.md)
- [`src/paraglide/messages/profilepicturesizeerror3.js`](specs/repository/src/paraglide/messages/profilepicturesizeerror3.js.md)
- [`src/paraglide/messages/profilepicturetypeerror3.js`](specs/repository/src/paraglide/messages/profilepicturetypeerror3.js.md)
- [`src/paraglide/messages/profilepictureuploadfailed3.js`](specs/repository/src/paraglide/messages/profilepictureuploadfailed3.js.md)
- [`src/paraglide/messages/profilepictureuploadguide3.js`](specs/repository/src/paraglide/messages/profilepictureuploadguide3.js.md)
- [`src/paraglide/messages/profilepictureuploadsuccess3.js`](specs/repository/src/paraglide/messages/profilepictureuploadsuccess3.js.md)
- [`src/paraglide/messages/profilepostcount2.js`](specs/repository/src/paraglide/messages/profilepostcount2.js.md)
- [`src/paraglide/messages/profilesave1.js`](specs/repository/src/paraglide/messages/profilesave1.js.md)
- [`src/paraglide/messages/profilesavefailed2.js`](specs/repository/src/paraglide/messages/profilesavefailed2.js.md)
- [`src/paraglide/messages/profilesavesuccess2.js`](specs/repository/src/paraglide/messages/profilesavesuccess2.js.md)
- [`src/paraglide/messages/profilesaving1.js`](specs/repository/src/paraglide/messages/profilesaving1.js.md)
- [`src/paraglide/messages/profileuserinfo2.js`](specs/repository/src/paraglide/messages/profileuserinfo2.js.md)
- [`src/paraglide/messages/profileuserinfoguide3.js`](specs/repository/src/paraglide/messages/profileuserinfoguide3.js.md)
- [`src/paraglide/messages/profileyear1.js`](specs/repository/src/paraglide/messages/profileyear1.js.md)
- [`src/paraglide/messages/profileyearformat2.js`](specs/repository/src/paraglide/messages/profileyearformat2.js.md)
- [`src/paraglide/messages/profileyearvalue2.js`](specs/repository/src/paraglide/messages/profileyearvalue2.js.md)
- [`src/paraglide/messages/progress.js`](specs/repository/src/paraglide/messages/progress.js.md)
- [`src/paraglide/messages/refresh.js`](specs/repository/src/paraglide/messages/refresh.js.md)
- [`src/paraglide/messages/reportcancelconfirm2.js`](specs/repository/src/paraglide/messages/reportcancelconfirm2.js.md)
- [`src/paraglide/messages/reportmylist2.js`](specs/repository/src/paraglide/messages/reportmylist2.js.md)
- [`src/paraglide/messages/reportmylistguide3.js`](specs/repository/src/paraglide/messages/reportmylistguide3.js.md)
- [`src/paraglide/messages/reportreasonabuse2.js`](specs/repository/src/paraglide/messages/reportreasonabuse2.js.md)
- [`src/paraglide/messages/reportreasonfakenews3.js`](specs/repository/src/paraglide/messages/reportreasonfakenews3.js.md)
- [`src/paraglide/messages/reportreasoninappropriate2.js`](specs/repository/src/paraglide/messages/reportreasoninappropriate2.js.md)
- [`src/paraglide/messages/reportreasonother2.js`](specs/repository/src/paraglide/messages/reportreasonother2.js.md)
- [`src/paraglide/messages/reportreasonspam2.js`](specs/repository/src/paraglide/messages/reportreasonspam2.js.md)
- [`src/paraglide/messages/retry.js`](specs/repository/src/paraglide/messages/retry.js.md)
- [`src/paraglide/messages/save.js`](specs/repository/src/paraglide/messages/save.js.md)
- [`src/paraglide/messages/sidebarbuildversion2.js`](specs/repository/src/paraglide/messages/sidebarbuildversion2.js.md)
- [`src/paraglide/messages/sidebardevhighlightattachment3.js`](specs/repository/src/paraglide/messages/sidebardevhighlightattachment3.js.md)
- [`src/paraglide/messages/sidebardevhighlightgendersearch4.js`](specs/repository/src/paraglide/messages/sidebardevhighlightgendersearch4.js.md)
- [`src/paraglide/messages/sidebardevhighlightpassword3.js`](specs/repository/src/paraglide/messages/sidebardevhighlightpassword3.js.md)
- [`src/paraglide/messages/sidebardevhighlightpayment3.js`](specs/repository/src/paraglide/messages/sidebardevhighlightpayment3.js.md)
- [`src/paraglide/messages/sidebardevhighlightposttype4.js`](specs/repository/src/paraglide/messages/sidebardevhighlightposttype4.js.md)
- [`src/paraglide/messages/sidebardevhighlightwrapup4.js`](specs/repository/src/paraglide/messages/sidebardevhighlightwrapup4.js.md)
- [`src/paraglide/messages/sidebarlanguage1.js`](specs/repository/src/paraglide/messages/sidebarlanguage1.js.md)
- [`src/paraglide/messages/sidebarmenu1.js`](specs/repository/src/paraglide/messages/sidebarmenu1.js.md)
- [`src/paraglide/messages/sidebarmyprofile2.js`](specs/repository/src/paraglide/messages/sidebarmyprofile2.js.md)
- [`src/paraglide/messages/sidebarnewfeatures2.js`](specs/repository/src/paraglide/messages/sidebarnewfeatures2.js.md)
- [`src/paraglide/messages/sidebarnonotifications2.js`](specs/repository/src/paraglide/messages/sidebarnonotifications2.js.md)
- [`src/paraglide/messages/sidebarnorecentactivity3.js`](specs/repository/src/paraglide/messages/sidebarnorecentactivity3.js.md)
- [`src/paraglide/messages/sidebarnotifications1.js`](specs/repository/src/paraglide/messages/sidebarnotifications1.js.md)
- [`src/paraglide/messages/sidebarpopularposts2.js`](specs/repository/src/paraglide/messages/sidebarpopularposts2.js.md)
- [`src/paraglide/messages/sidebarpopularusers2.js`](specs/repository/src/paraglide/messages/sidebarpopularusers2.js.md)
- [`src/paraglide/messages/sidebarrecentactivity2.js`](specs/repository/src/paraglide/messages/sidebarrecentactivity2.js.md)
- [`src/paraglide/messages/sidebarselectlanguage2.js`](specs/repository/src/paraglide/messages/sidebarselectlanguage2.js.md)
- [`src/paraglide/messages/sidebarsuggestions1.js`](specs/repository/src/paraglide/messages/sidebarsuggestions1.js.md)
- [`src/paraglide/messages/sidebartodoboardstats3.js`](specs/repository/src/paraglide/messages/sidebartodoboardstats3.js.md)
- [`src/paraglide/messages/sidebartodoboardstatsdesc4.js`](specs/repository/src/paraglide/messages/sidebartodoboardstatsdesc4.js.md)
- [`src/paraglide/messages/sidebartodochatinvites3.js`](specs/repository/src/paraglide/messages/sidebartodochatinvites3.js.md)
- [`src/paraglide/messages/sidebartodochatinvitesdesc4.js`](specs/repository/src/paraglide/messages/sidebartodochatinvitesdesc4.js.md)
- [`src/paraglide/messages/sidebartodoposttype3.js`](specs/repository/src/paraglide/messages/sidebartodoposttype3.js.md)
- [`src/paraglide/messages/sidebartodoposttypedesc4.js`](specs/repository/src/paraglide/messages/sidebartodoposttypedesc4.js.md)
- [`src/paraglide/messages/sidebarupcomingtodos2.js`](specs/repository/src/paraglide/messages/sidebarupcomingtodos2.js.md)
- [`src/paraglide/messages/signin1.js`](specs/repository/src/paraglide/messages/signin1.js.md)
- [`src/paraglide/messages/signout1.js`](specs/repository/src/paraglide/messages/signout1.js.md)
- [`src/paraglide/messages/status.js`](specs/repository/src/paraglide/messages/status.js.md)
- [`src/paraglide/messages/success.js`](specs/repository/src/paraglide/messages/success.js.md)
- [`src/paraglide/messages/testuserbirthyear3.js`](specs/repository/src/paraglide/messages/testuserbirthyear3.js.md)
- [`src/paraglide/messages/testusercount2.js`](specs/repository/src/paraglide/messages/testusercount2.js.md)
- [`src/paraglide/messages/testusercreate2.js`](specs/repository/src/paraglide/messages/testusercreate2.js.md)
- [`src/paraglide/messages/testusercreateatonce4.js`](specs/repository/src/paraglide/messages/testusercreateatonce4.js.md)
- [`src/paraglide/messages/testusercreatebatchcount4.js`](specs/repository/src/paraglide/messages/testusercreatebatchcount4.js.md)
- [`src/paraglide/messages/testusercreatecomplete3.js`](specs/repository/src/paraglide/messages/testusercreatecomplete3.js.md)
- [`src/paraglide/messages/testusercreatecompletemessage4.js`](specs/repository/src/paraglide/messages/testusercreatecompletemessage4.js.md)
- [`src/paraglide/messages/testusercreatecount3.js`](specs/repository/src/paraglide/messages/testusercreatecount3.js.md)
- [`src/paraglide/messages/testusercreated2.js`](specs/repository/src/paraglide/messages/testusercreated2.js.md)
- [`src/paraglide/messages/testusercreatedatonce4.js`](specs/repository/src/paraglide/messages/testusercreatedatonce4.js.md)
- [`src/paraglide/messages/testusercreateddate3.js`](specs/repository/src/paraglide/messages/testusercreateddate3.js.md)
- [`src/paraglide/messages/testusercreateerror3.js`](specs/repository/src/paraglide/messages/testusercreateerror3.js.md)
- [`src/paraglide/messages/testusercreateguide3.js`](specs/repository/src/paraglide/messages/testusercreateguide3.js.md)
- [`src/paraglide/messages/testusercreateicon3.js`](specs/repository/src/paraglide/messages/testusercreateicon3.js.md)
- [`src/paraglide/messages/testusercreateunit3.js`](specs/repository/src/paraglide/messages/testusercreateunit3.js.md)
- [`src/paraglide/messages/testusercreating2.js`](specs/repository/src/paraglide/messages/testusercreating2.js.md)
- [`src/paraglide/messages/testusercurrentcreatecount4.js`](specs/repository/src/paraglide/messages/testusercurrentcreatecount4.js.md)
- [`src/paraglide/messages/testusercurrentcreated3.js`](specs/repository/src/paraglide/messages/testusercurrentcreated3.js.md)
- [`src/paraglide/messages/testuserdeleteall3.js`](specs/repository/src/paraglide/messages/testuserdeleteall3.js.md)
- [`src/paraglide/messages/testuserdeleteallconfirm4.js`](specs/repository/src/paraglide/messages/testuserdeleteallconfirm4.js.md)
- [`src/paraglide/messages/testuserdeleteallconfirmation4.js`](specs/repository/src/paraglide/messages/testuserdeleteallconfirmation4.js.md)
- [`src/paraglide/messages/testuserdeleteallerror4.js`](specs/repository/src/paraglide/messages/testuserdeleteallerror4.js.md)
- [`src/paraglide/messages/testuserdeleteconfirm3.js`](specs/repository/src/paraglide/messages/testuserdeleteconfirm3.js.md)
- [`src/paraglide/messages/testuserdeleteconfirmation3.js`](specs/repository/src/paraglide/messages/testuserdeleteconfirmation3.js.md)
- [`src/paraglide/messages/testuserdeleteerror3.js`](specs/repository/src/paraglide/messages/testuserdeleteerror3.js.md)
- [`src/paraglide/messages/testuserdeleting2.js`](specs/repository/src/paraglide/messages/testuserdeleting2.js.md)
- [`src/paraglide/messages/testuserdeletinginprogress4.js`](specs/repository/src/paraglide/messages/testuserdeletinginprogress4.js.md)
- [`src/paraglide/messages/testuserdeletingprogress3.js`](specs/repository/src/paraglide/messages/testuserdeletingprogress3.js.md)
- [`src/paraglide/messages/testusergender2.js`](specs/repository/src/paraglide/messages/testusergender2.js.md)
- [`src/paraglide/messages/testusergenderfemale3.js`](specs/repository/src/paraglide/messages/testusergenderfemale3.js.md)
- [`src/paraglide/messages/testusergendermale3.js`](specs/repository/src/paraglide/messages/testusergendermale3.js.md)
- [`src/paraglide/messages/testusergenderother3.js`](specs/repository/src/paraglide/messages/testusergenderother3.js.md)
- [`src/paraglide/messages/testuserguide2.js`](specs/repository/src/paraglide/messages/testuserguide2.js.md)
- [`src/paraglide/messages/testuserinfodelete3.js`](specs/repository/src/paraglide/messages/testuserinfodelete3.js.md)
- [`src/paraglide/messages/testuserinfodisplay3.js`](specs/repository/src/paraglide/messages/testuserinfodisplay3.js.md)
- [`src/paraglide/messages/testuserinfonorecover4.js`](specs/repository/src/paraglide/messages/testuserinfonorecover4.js.md)
- [`src/paraglide/messages/testuserinfounrecoverable3.js`](specs/repository/src/paraglide/messages/testuserinfounrecoverable3.js.md)
- [`src/paraglide/messages/testuserlist2.js`](specs/repository/src/paraglide/messages/testuserlist2.js.md)
- [`src/paraglide/messages/testuserlistloaderror4.js`](specs/repository/src/paraglide/messages/testuserlistloaderror4.js.md)
- [`src/paraglide/messages/testusernodelete3.js`](specs/repository/src/paraglide/messages/testusernodelete3.js.md)
- [`src/paraglide/messages/testusernoneguide3.js`](specs/repository/src/paraglide/messages/testusernoneguide3.js.md)
- [`src/paraglide/messages/testusernotcreated3.js`](specs/repository/src/paraglide/messages/testusernotcreated3.js.md)
- [`src/paraglide/messages/testusernotcreatedguide4.js`](specs/repository/src/paraglide/messages/testusernotcreatedguide4.js.md)
- [`src/paraglide/messages/testusernousersguide4.js`](specs/repository/src/paraglide/messages/testusernousersguide4.js.md)
- [`src/paraglide/messages/testusernouserstodelete5.js`](specs/repository/src/paraglide/messages/testusernouserstodelete5.js.md)
- [`src/paraglide/messages/testusernousertodelete5.js`](specs/repository/src/paraglide/messages/testusernousertodelete5.js.md)
- [`src/paraglide/messages/testuserprogressdisplay3.js`](specs/repository/src/paraglide/messages/testuserprogressdisplay3.js.md)
- [`src/paraglide/messages/testuserprogressindicator3.js`](specs/repository/src/paraglide/messages/testuserprogressindicator3.js.md)
- [`src/paraglide/messages/testuserstatus2.js`](specs/repository/src/paraglide/messages/testuserstatus2.js.md)
- [`src/paraglide/messages/testuseryear2.js`](specs/repository/src/paraglide/messages/testuseryear2.js.md)
- [`src/paraglide/messages/testuseryeardisplay3.js`](specs/repository/src/paraglide/messages/testuseryeardisplay3.js.md)
- [`src/paraglide/messages/underconstruction1.js`](specs/repository/src/paraglide/messages/underconstruction1.js.md)
- [`src/paraglide/messages/underconstructionbacktohome4.js`](specs/repository/src/paraglide/messages/underconstructionbacktohome4.js.md)
- [`src/paraglide/messages/underconstructionmessage2.js`](specs/repository/src/paraglide/messages/underconstructionmessage2.js.md)
- [`src/paraglide/messages/unfollowbutton1.js`](specs/repository/src/paraglide/messages/unfollowbutton1.js.md)
- [`src/paraglide/messages/unfollowsuccess1.js`](specs/repository/src/paraglide/messages/unfollowsuccess1.js.md)
- [`src/paraglide/messages/user.js`](specs/repository/src/paraglide/messages/user.js.md)
- [`src/paraglide/messages/userallloaded2.js`](specs/repository/src/paraglide/messages/userallloaded2.js.md)
- [`src/paraglide/messages/userjoindate2.js`](specs/repository/src/paraglide/messages/userjoindate2.js.md)
- [`src/paraglide/messages/userjoineddate2.js`](specs/repository/src/paraglide/messages/userjoineddate2.js.md)
- [`src/paraglide/messages/userlastlogin2.js`](specs/repository/src/paraglide/messages/userlastlogin2.js.md)
- [`src/paraglide/messages/userlist1.js`](specs/repository/src/paraglide/messages/userlist1.js.md)
- [`src/paraglide/messages/userlistguide2.js`](specs/repository/src/paraglide/messages/userlistguide2.js.md)
- [`src/paraglide/messages/userloadfailed2.js`](specs/repository/src/paraglide/messages/userloadfailed2.js.md)
- [`src/paraglide/messages/userloading1.js`](specs/repository/src/paraglide/messages/userloading1.js.md)
- [`src/paraglide/messages/userloadingmore2.js`](specs/repository/src/paraglide/messages/userloadingmore2.js.md)
- [`src/paraglide/messages/usernoname2.js`](specs/repository/src/paraglide/messages/usernoname2.js.md)
- [`src/paraglide/messages/usernoregistration2.js`](specs/repository/src/paraglide/messages/usernoregistration2.js.md)
- [`src/paraglide/messages/usernosignedup3.js`](specs/repository/src/paraglide/messages/usernosignedup3.js.md)
- [`src/paraglide/messages/usernosignup2.js`](specs/repository/src/paraglide/messages/usernosignup2.js.md)
- [`src/paraglide/messages/usernotjoined2.js`](specs/repository/src/paraglide/messages/usernotjoined2.js.md)
- [`src/paraglide/messages/usernotregistered2.js`](specs/repository/src/paraglide/messages/usernotregistered2.js.md)
- [`src/paraglide/messages/usernousersregistered3.js`](specs/repository/src/paraglide/messages/usernousersregistered3.js.md)
- [`src/paraglide/messages/userprofiledetail2.js`](specs/repository/src/paraglide/messages/userprofiledetail2.js.md)
- [`src/paraglide/messages/userunknownerror2.js`](specs/repository/src/paraglide/messages/userunknownerror2.js.md)
- [`src/paraglide/registry.js`](specs/repository/src/paraglide/registry.js.md)
- [`src/paraglide/runtime.js`](specs/repository/src/paraglide/runtime.js.md)
- [`src/paraglide/server.js`](specs/repository/src/paraglide/server.js.md)
- [`src/stories/Button.stories.svelte`](specs/repository/src/stories/Button.stories.svelte.md)
- [`src/stories/Button.svelte`](specs/repository/src/stories/Button.svelte.md)
- [`src/stories/Header.stories.svelte`](specs/repository/src/stories/Header.stories.svelte.md)
- [`src/stories/Header.svelte`](specs/repository/src/stories/Header.svelte.md)
- [`src/stories/Page.stories.svelte`](specs/repository/src/stories/Page.stories.svelte.md)
- [`src/stories/Page.svelte`](specs/repository/src/stories/Page.svelte.md)
- [`static/firebase-messaging-sw.js`](specs/repository/static/firebase-messaging-sw.js.md)
- [`svelte.config.js`](specs/repository/svelte.config.js.md)
- [`vite.config.ts`](specs/repository/vite.config.ts.md)

