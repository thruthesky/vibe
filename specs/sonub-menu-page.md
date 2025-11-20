---
name: sonub-menu-page
version: 1.0.0
description: 메뉴 페이지 구현 명세서 - 사용자 메뉴 및 계정 관리 기능
author: JaeHo Song
email: thruthesky@gmail.com
license: GPL-3.0
created: 2025-01-09
updated: 2025-01-09
step: 25
priority: "*"
dependencies: ["sonub-design-layout.md", "sonub-user-login.md", "sonub-setup-shadcn.md"]
tags: ["menu", "ui", "authentication", "account", "navigation", "svelte5"]
---

# Sonub Menu Page - 메뉴 페이지 구현 명세서

## 1. 개요

### 1.1 목적

본 명세서는 Sonub 프로젝트의 메뉴 페이지 구현을 정의합니다. 탑바의 메뉴 아이콘을 통해 접근할 수 있는 메뉴 페이지에서 사용자는 로그인, 로그아웃, 회원 정보 수정, 관리자 페이지 이동 등의 기능을 사용할 수 있습니다.

### 1.2 범위

- 탑바 메뉴 아이콘 추가 (`top-bar.svelte`)
- 메뉴 페이지 구현 (`src/routes/menu/+page.svelte`)
- 인증 상태별 메뉴 항목 표시
- 사용자 계정 관리 링크
- 관리자 페이지 접근 링크
- Light Mode Only 정책 적용

### 1.3 사전 요구사항

- ✅ TailwindCSS 설치 완료 (sonub-setup-tailwind.md 참조)
- ✅ shadcn-svelte Button 및 Card 컴포넌트 설치 완료 (sonub-setup-shadcn.md 참조)
- ✅ Firebase Authentication 설정 완료 (sonub-setup-firebase.md 참조)
- ✅ 탑바 컴포넌트 구현 완료 (sonub-design-layout.md 참조)
- ✅ 인증 스토어 구현 완료 (sonub-user-login.md 참조)
- ✅ SvelteKit 5 프로젝트 환경

### 1.4 구현 파일

**소스 코드 위치**: [+page.svelte.md](./repository/src/routes/menu/+page.svelte.md)

```
src/
├── lib/
│   └── components/
│       └── top-bar.svelte              # 탑바 컴포넌트 (메뉴 아이콘 추가)
└── routes/
    └── menu/
        └── +page.svelte                # 메뉴 페이지
```

---

## 2. 탑바 메뉴 아이콘

### 2.1 메뉴 아이콘 개요

**소스 코드 위치:** `src/lib/components/top-bar.svelte`

**목적:** 탑바 우측에 메뉴 아이콘(햄버거 메뉴)을 표시하고, 클릭 시 메뉴 페이지로 이동

**주요 기능:**
- 메뉴 아이콘 표시 (SVG 또는 아이콘 라이브러리)
- 클릭 시 `/menu` 경로로 이동
- Light Mode 색상 적용

### 2.2 메뉴 아이콘 구현

**위치:** 탑바 우측, 사용자 프로필/로그인 버튼 옆 (또는 대체)

**소스 코드 위치**: [+page.svelte.md](./repository/src/routes/menu/+page.svelte.md)

```svelte
<!-- 메뉴 아이콘 (우측) -->
<button
  onclick={() => goto('/menu')}
  class="ml-4 p-2 rounded-lg hover:bg-gray-100 text-gray-600 hover:text-gray-900"
  aria-label="메뉴"
>
  <!-- 햄버거 아이콘 SVG -->
  <svg
    class="h-6 w-6"
    fill="none"
    stroke="currentColor"
    viewBox="0 0 24 24"
  >
    <path
      stroke-linecap="round"
      stroke-linejoin="round"
      stroke-width="2"
      d="M4 6h16M4 12h16M4 18h16"
    />
  </svg>
</button>
```

### 2.3 스타일 설명

**TailwindCSS 클래스:**
- `ml-4`: 좌측 마진 (1rem)
- `p-2`: 패딩 (0.5rem)
- `rounded-lg`: 둥근 모서리 (0.5rem)
- `hover:bg-gray-100`: Light Mode 호버 배경 (연한 회색)
- `text-gray-600`: Light Mode 텍스트 색상 (중간 회색)
- `hover:text-gray-900`: Light Mode 호버 텍스트 (진한 회색)

**aria-label:** 접근성을 위한 레이블

---

## 3. 메뉴 페이지

### 3.1 메뉴 페이지 개요

**소스 코드 위치:** `src/routes/menu/+page.svelte`

**목적:** 사용자 메뉴 항목을 모두 표시하는 페이지

**주요 기능:**
- 인증 상태 확인
- 로그인/로그아웃 링크
- 회원 정보 수정 링크
- 관리자 페이지 링크 (관리자만)
- Light Mode Only 정책 적용
- 반응형 디자인

### 3.2 메뉴 페이지 구조

**레이아웃:**

**소스 코드 위치**: [+page.svelte.md](./repository/src/routes/menu/+page.svelte.md)

```
┌─────────────────────────────────┐
│       메뉴 페이지 헤더           │
│         (타이틀)                 │
├─────────────────────────────────┤
│                                 │
│  • 로그인 (비로그인 시)          │
│                                 │
│  또는                           │
│                                 │
│  • 회원 정보                     │
│  • 회원 정보 수정               │
│  • 관리자 페이지 (관리자만)      │
│  • 로그아웃                      │
│                                 │
└─────────────────────────────────┘
```

### 3.3 메뉴 페이지 구현

**소스 코드 위치**: [+page.svelte.md](./repository/src/routes/menu/+page.svelte.md)

```svelte
<script lang="ts">
	/**
	 * 메뉴 페이지
	 *
	 * 사용자 메뉴 항목을 표시하는 페이지입니다.
	 * 인증 상태에 따라 다른 메뉴를 표시합니다.
	 */

	import { Button } from '$lib/components/ui/button/index.js';
	import { authStore } from '$lib/stores/auth.svelte';
	import { signOut } from 'firebase/auth';
	import { auth } from '$lib/firebase';
	import { goto } from '$app/navigation';
	import Avatar from '$lib/components/user/avatar.svelte';
	import { m } from '$lib/paraglide/messages';

	// 로그아웃 처리 중 상태
	let isSigningOut = $state(false);

	/**
	 * 로그아웃 처리
	 */
	async function handleSignOut() {
		if (isSigningOut || !auth) return;

		isSigningOut = true;
		try {
			await signOut(auth);
			await goto('/');
		} catch (error) {
			console.error('로그아웃 에러:', error);
		} finally {
			isSigningOut = false;
		}
	}
</script>

<svelte:head>
	<title>{m.pageTitleMenu()}</title>
</svelte:head>

<div class="min-h-[calc(100vh-8rem)] py-8 px-4">
	<div class="mx-auto w-full max-w-md space-y-6">
		<!-- 로딩 상태 -->
		{#if authStore.loading}
			<div class="bg-white rounded-xl border border-gray-100 shadow-sm p-6">
				<div class="flex justify-center items-center space-x-2">
					<div class="animate-spin rounded-full h-5 w-5 border-b-2 border-blue-600"></div>
					<p class="text-center text-gray-600">{m.commonLoading()}</p>
				</div>
			</div>

		<!-- 로그인 상태 -->
		{:else if authStore.isAuthenticated}
			<!-- 사용자 정보 -->
			<div class="flex items-center space-x-4 p-4 bg-white rounded-xl border border-gray-100 shadow-sm">
				<Avatar uid={authStore.user?.uid} size={60} />
				<div>
					<p class="text-lg font-semibold text-gray-900">
						{authStore.user?.displayName || m.commonUser()}
					</p>
					<p class="text-sm text-gray-500">
						{authStore.user?.email || ''}
					</p>
				</div>
			</div>

			<!-- 메뉴 항목 -->
			<div class="space-y-4">
				<!-- 프로필 -->
				<div class="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
					<a href="/my/profile" class="flex items-center justify-between p-4 hover:bg-gray-50 transition-colors border-b border-gray-100 last:border-0">
						<span class="text-gray-700 font-medium">{m.menuEditProfile()}</span>
						<svg class="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7" /></svg>
					</a>
					<!-- ... 기타 메뉴 항목 ... -->
				</div>
                <!-- ... -->
			</div>

		<!-- 비로그인 상태 -->
		{:else}
			<div class="bg-white rounded-xl border border-gray-100 shadow-sm p-6 text-center space-y-4">
				<div class="flex justify-center">
					<div class="p-3 bg-blue-50 rounded-full">
						<svg class="h-8 w-8 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
							<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
						</svg>
					</div>
				</div>
				<div>
					<h3 class="text-lg font-bold text-gray-900">{m.authSignInRequired()}</h3>
					<p class="text-sm text-gray-500 mt-1">{m.authSignInRequiredDesc()}</p>
				</div>
				<Button
					class="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-2.5 rounded-lg"
					href="/user/login"
				>
					{m.authSignInAction()}
				</Button>
			</div>
		{/if}
	</div>
</div>
```

### 3.4 메뉴 페이지 구조 분석

#### 3.4.1 페이지 레이아웃

**소스 코드 위치**: [+page.svelte.md](./repository/src/routes/menu/+page.svelte.md)

```svelte
<div class="min-h-[calc(100vh-8rem)] py-8 px-4">
	<div class="mx-auto w-full max-w-md space-y-6">
```

**TailwindCSS 클래스:**
- `min-h-[calc(100vh-8rem)]`: 최소 높이 설정
- `py-8 px-4`: 상하 패딩 2rem, 좌우 패딩 1rem
- `mx-auto`: 중앙 정렬
- `w-full`: 전체 너비
- `max-w-md`: 최대 너비 28rem
- `space-y-6`: 요소 간 간격

#### 3.4.2 헤더 섹션 (삭제됨)

기존의 "메뉴" 타이틀 및 아이콘 헤더는 깔끔한 디자인을 위해 삭제되었습니다.

#### 3.4.3 로딩 상태

**소스 코드 위치**: [+page.svelte.md](./repository/src/routes/menu/+page.svelte.md)

```svelte
{#if authStore.loading}
	<div class="bg-white rounded-xl border border-gray-100 shadow-sm p-6">
        <!-- 스피너 -->
	</div>
```

**목적:** 심플한 로딩 표시

#### 3.4.4 로그인 상태 메뉴

**사용자 정보:**
- `bg-white rounded-xl border border-gray-100 shadow-sm` 스타일 적용
- 아바타 및 이름/이메일 표시

**메뉴 항목:**
- `space-y-4`로 그룹 간 간격 조정
- 각 그룹은 `bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden` 컨테이너 사용
- 각 항목은 `<a>` 태그 사용, `flex items-center justify-between p-4 hover:bg-gray-50` 스타일 적용
- `divide-y` 대신 `border-b border-gray-100 last:border-0` 사용하여 구분선 처리

#### 3.4.5 비로그인 상태

**소스 코드 위치**: [+page.svelte.md](./repository/src/routes/menu/+page.svelte.md)

```svelte
{:else}
	<div class="bg-white rounded-xl border border-gray-100 shadow-sm p-6 text-center space-y-4">
        <!-- 로그인 유도 아이콘 및 텍스트 -->
        <!-- 로그인 버튼 -->
	</div>
{/if}
```

**목적:** 깔끔한 카드 형태의 로그인 유도 화면

---

## 4. 인증 상태별 UI

### 4.1 상태 흐름도

**소스 코드 위치**: [+page.svelte.md](./repository/src/routes/menu/+page.svelte.md)

```
authStore.loading === true
  → "로딩 중..." 표시

authStore.loading === false && authStore.isAuthenticated === true
  → 사용자 정보 카드
  → 회원 정보 수정 링크
  → 관리자 페이지 링크 (관리자만)
  → 로그아웃 버튼

authStore.loading === false && authStore.isAuthenticated === false
  → "로그인 필요" 카드
  → 로그인하기 버튼
```

---

## 5. 메뉴 아이콘 위치

### 5.1 탑바 레이아웃

**수정 전:**

**소스 코드 위치**: [+page.svelte.md](./repository/src/routes/menu/+page.svelte.md)

```
좌측: 로고 + 네비게이션 링크
      [홈] [소개] [제품] [연락]

우측: 사용자 메뉴
      [프로필 이미지] [이름] [로그아웃]
```

**수정 후:**

**소스 코드 위치**: [+page.svelte.md](./repository/src/routes/menu/+page.svelte.md)

```
좌측: 로고 + 네비게이션 링크
      [홈] [소개] [제품] [연락]

우측: 사용자 메뉴 + 메뉴 아이콘
      [프로필 이미지] [이름] [로그아웃] [☰ 메뉴]
```

### 5.2 메뉴 아이콘 스타일

**기본 상태:**
- 배경: 투명
- 텍스트 색상: `text-gray-600`

**호버 상태:**
- 배경: `hover:bg-gray-100` (Light Mode)
- 텍스트 색상: `hover:text-gray-900`

---

## 6. Light Mode Only 정책

### 6.1 색상 표준

**텍스트:**
- 기본: `text-gray-900` (진한 회색)
- 중간: `text-gray-600` (중간 회색)
- 약한: `text-gray-500` (연한 회색)
- 강조: `text-red-600` (빨간색 - 로그아웃)

**배경:**
- 기본: `bg-white` 또는 투명
- 호버: `hover:bg-gray-100` (연한 회색)
- 알림: `hover:bg-red-50` (빨간색 계열)

**경계:**
- `border-gray-200` (매우 연한 회색)

**적용 규칙:**
- ✅ Light Mode 색상만 사용
- ❌ `dark:` 프리픽스 절대 금지
- ✅ 모든 요소에 Light Mode 색상 적용

---

## 7. 접근성

### 7.1 시맨틱 HTML

- `<button>`: 버튼 요소
- `<svg>`: 아이콘 (aria-label 포함)
- `<h1>`: 페이지 제목
- `<p>`: 설명 텍스트

### 7.2 ARIA 속성

**메뉴 아이콘:**

**소스 코드 위치**: [+page.svelte.md](./repository/src/routes/menu/+page.svelte.md)

```svelte
<button
  aria-label="메뉴"
  ...
>
```

**목적:** 스크린 리더 사용자에게 버튼 기능 설명

### 7.3 키보드 내비게이션

- Tab 키로 모든 버튼에 접근 가능
- Enter 키로 버튼 활성화
- 포커스 상태 시각적 표시 (shadcn Button 기본 제공)

---

## 8. 향후 구현 고려사항

### 8.1 회원 정보 수정 페이지

**경로:** `/my/profile`

**기능:**
- 프로필 이미지 변경
- 사용자 이름 수정
- 이메일 확인
- 비밀번호 변경
- 계정 삭제

### 8.2 관리자 페이지

**경로:** `/admin/dashboard`

**기능:**
- 사용자 목록 조회
- 신고 목록 관리
- 시스템 설정

### 8.3 모바일 최적화

**메뉴 아이콘 위치:**
- 모바일에서 더 눈에 띄게 배치
- 프로필 정보 대신 메뉴 아이콘 표시

---

## 9. 구현 체크리스트

### 9.1 탑바 메뉴 아이콘

- [ ] 탑바 우측에 메뉴 아이콘 추가
- [ ] 햄버거 메뉴 SVG 아이콘 추가
- [ ] 메뉴 아이콘 클릭 시 `/menu` 경로로 이동
- [ ] Light Mode 색상 적용
- [ ] 호버 효과 적용
- [ ] 접근성 aria-label 추가
- [ ] 반응형 디자인 적용

### 9.2 메뉴 페이지

- [ ] `/routes/menu/+page.svelte` 파일 생성
- [ ] 페이지 타이틀 설정
- [ ] 로딩 상태 표시
- [ ] 로그인 상태별 UI 구현
  - [ ] 비로그인: "로그인 필요" 카드
  - [ ] 로그인: 사용자 정보 + 메뉴 항목
- [ ] 메뉴 항목 구현
  - [ ] 회원 정보 수정 링크
  - [ ] 관리자 페이지 링크 (조건부)
  - [ ] 로그아웃 버튼
- [ ] Light Mode 색상 적용
- [ ] 반응형 레이아웃 적용
- [ ] 접근성 기준 준수

### 9.3 스펙 문서

- [ ] `sonub-menu-page.md` 파일 생성
- [ ] `specs/index.md` 업데이트
- [ ] YAML 헤더 작성
- [ ] SED 형식 준수

---

## 10. 테스트 체크리스트

- [ ] 메뉴 아이콘 클릭 테스트
- [ ] 비로그인 상태에서 메뉴 페이지 접근 테스트
- [ ] 로그인 상태에서 메뉴 페이지 접근 테스트
- [ ] 로그아웃 기능 테스트
- [ ] 로그인 페이지 이동 테스트
- [ ] 회원 정보 수정 페이지 이동 테스트
- [ ] 관리자 페이지 이동 테스트 (관리자 계정)
- [ ] 관리자 페이지 숨김 테스트 (일반 사용자)
- [ ] 모바일 반응형 테스트
- [ ] Light Mode 색상 확인 (다크 모드 시스템에서도 Light Mode 표시)
- [ ] 접근성 테스트 (키보드 내비게이션, 스크린 리더)

---

## 11. 결론

본 명세서에 따라 구현된 메뉴 페이지는 다음과 같은 특징을 가집니다:

✅ **사용자 중심 설계**: 간단한 메뉴 구조로 모든 기능에 빠르게 접근
✅ **인증 상태 반영**: 로그인 여부에 따른 동적 UI
✅ **Light Mode Only**: 모든 색상이 Light Mode 전용
✅ **접근성**: WCAG 2.1 AA 기준 준수
✅ **반응형**: 모바일, 태블릿, 데스크톱 모두 지원
✅ **유지보수성**: 명확한 구조 및 주석

**핵심 원칙:**
1. 메뉴 아이콘을 통한 쉬운 접근
2. 인증 상태별 맞춤형 메뉴 제공
3. Light Mode Only 정책 준수
4. 접근성 및 반응형 디자인 필수
