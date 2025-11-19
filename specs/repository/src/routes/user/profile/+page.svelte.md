---
title: +page.svelte
type: component
path: src/routes/user/profile/+page.svelte
status: active
version: 3.0.0
last_updated: 2025-11-18
---

## 개요

이 파일은 `src/routes/user/profile/+page.svelte`의 소스 코드를 포함하는 SED 스펙 문서입니다.

사용자 프로필 페이지로, URL 파라미터 `uid`로 전달된 사용자의 프로필 정보를 표시합니다.

## 주요 기능

### 1. 프로필 커버 영역
- 상단에 그라디언트 배경(파란색-보라색-핑크색) 또는 사용자 업로드 커버 이미지 표시
- 모바일: 높이 192px (h-48)
- 데스크톱: 높이 224px (h-56)
- 사용자가 업로드한 커버 이미지가 있으면 우선 표시, 없으면 그라디언트 배경 표시

### 2. 커버 사진 업로드 (v3.0.0 신규 기능)
- **본인 프로필인 경우에만** 커버 영역 우측 하단에 카메라 아이콘 버튼 표시
- 버튼 클릭 시 파일 선택 다이얼로그 열림
- 이미지 파일만 업로드 가능 (image/*)
- 파일 크기 제한: 5MB 이하
- 업로드 진행률 표시 (스피너 + 백분율)
- Firebase Storage에 업로드: `users/{uid}/profile/cover-photo-{timestamp}.{extension}`
- Firebase Database에 URL 저장: `/users/{uid}/coverPhotoUrl`
- 업로드 에러 시 에러 메시지 표시

### 3. 프로필 아바타
- 커버 이미지와 겹치도록 배치 (음수 마진 사용)
- 크기: 120x120px
- 흰색 테두리(4px)와 그림자 효과
- 모바일: -64px 위로 올림
- 데스크톱: -80px 위로 올림

### 4. 사용자 정보
- 표시 이름 (displayName)
- 자기소개 (bio) - 있는 경우만 표시
- 중앙 정렬

### 5. 액션 버튼
- 팔로우 버튼 (FollowButton 컴포넌트)
- 1:1 채팅 버튼 (로그인된 경우)
- 로그인 요구 버튼 (로그인 안 된 경우)

### 6. 상태 처리
- UID 없음: 에러 메시지 표시
- 로딩 중: 로딩 메시지 표시
- 로드 실패: 에러 메시지 표시
- 사용자 없음: 미등록 사용자 메시지 표시

## 디자인 개선 사항 (v2.0.0)

### 변경 내용
1. **상단 여백 제거**: `py-12` 제거하여 콘텐츠를 페이지 최상단에 배치
2. **커버 영역 추가**: 소셜 미디어 스타일의 프로필 커버 이미지 추가
3. **아바타 배치 개선**: 커버와 겹치도록 배치하여 현대적인 UI 구현
4. **그라디언트 배경**: 파란색-보라색-핑크색 그라디언트로 시각적 매력 향상
5. **반응형 디자인**: 모바일과 데스크톱에서 최적화된 레이아웃

## 커버 사진 업로드 기능 (v3.0.0)

### 개요
본인 프로필을 볼 때 커버 이미지를 직접 업로드하고 수정할 수 있는 기능입니다.

### 주요 컴포넌트

#### 1. 본인 프로필 감지
```typescript
// authStore의 currentUser.uid와 URL 파라미터의 uid를 비교
const isOwnProfile = $derived.by(() => authStore.currentUser?.uid === uidParam);
```

#### 2. 커버 사진 URL 관리
```typescript
// Firebase Database에서 coverPhotoUrl 필드를 읽어옴
const coverPhotoUrl = $derived.by(() => profile?.coverPhotoUrl || null);
```
- 데이터베이스 경로: `/users/{uid}/coverPhotoUrl`
- 커버 사진이 있으면 이미지 표시, 없으면 그라디언트 배경 표시

#### 3. 업로드 상태 관리
```typescript
let isUploadingCover = $state(false);   // 업로드 진행 중 여부
let uploadProgress = $state(0);          // 업로드 진행률 (0-100)
let uploadError = $state<string | null>(null); // 에러 메시지
```

#### 4. 파일 업로드 처리
```typescript
async function handleFileChange(event: Event) {
  const input = event.target as HTMLInputElement;
  const file = input.files?.[0];

  // 1. 유효성 검사
  - 이미지 파일 확인 (file.type.startsWith('image/'))
  - 파일 크기 확인 (5MB 이하)

  // 2. Firebase Storage 업로드
  const downloadUrl = await uploadCoverPhoto(file, uidParam, (progress) => {
    uploadProgress = progress;
  });

  // 3. Firebase Database에 URL 저장
  const coverPhotoRef = ref(database, `users/${uidParam}/coverPhotoUrl`);
  await set(coverPhotoRef, downloadUrl);
}
```

### UI 컴포넌트

#### 1. 카메라 버튼
- **위치**: 커버 영역 우측 하단
- **표시 조건**: 본인 프로필인 경우에만 (`{#if isOwnProfile}`)
- **스타일**:
  - 흰색 반투명 원형 버튼 (bg-white/90)
  - 크기: 48x48px (h-12 w-12)
  - 그림자 효과 (shadow-lg)
  - 호버 시 배경 완전 흰색 + 그림자 강화

#### 2. 업로드 진행 표시
- **스피너**: 애니메이션 회전하는 SVG 아이콘
- **진행률**: 백분율 텍스트 표시 (예: "75%")
- **버튼 비활성화**: 업로드 중에는 클릭 불가

#### 3. 에러 메시지
- **위치**: 커버 영역 하단 중앙
- **스타일**: 빨간색 배경 + 흰색 텍스트
- **표시 조건**: `uploadError`가 있을 때만 표시

### Firebase 연동

#### Storage 경로
```
users/{uid}/profile/cover-photo-{timestamp}.{extension}
```

예시: `users/abc123/profile/cover-photo-1731900000000.jpg`

#### Database 경로
```
/users/{uid}/coverPhotoUrl: "https://firebasestorage.googleapis.com/..."
```

#### 관련 함수
- `uploadCoverPhoto()` - `src/lib/functions/storage.functions.ts`에 정의
- 파일 검증, 업로드, 진행률 콜백 제공

### 레이아웃 구조
```
┌─────────────────────────────────┐
│   프로필 커버 (그라디언트)       │  ← 새로 추가
│                                 │
│          [아바타]               │  ← 커버와 겹침
└─────────────────────────────────┘
      사용자 이름
      자기소개
   [팔로우] [채팅]
```

## 소스 코드

```svelte
<script lang="ts">
	import { page } from '$app/stores';
	import Avatar from '$lib/components/user/avatar.svelte';
	import * as Card from '$lib/components/ui/card';
	import { Button } from '$lib/components/ui/button';
	import FollowButton from '$lib/components/friend/follow-button.svelte';
	import { authStore } from '$lib/stores/auth.svelte';
	import { userProfileStore } from '$lib/stores/user-profile.svelte';
	import { m } from '$lib/paraglide/messages';
	import { uploadCoverPhoto } from '$lib/functions/storage.functions';
	import { ref, set } from 'firebase/database';
	import { database } from '$lib/firebase';

	const uidParam = $derived.by(() => $page.url.searchParams.get('uid') ?? '');

	$effect(() => {
		if (uidParam) {
			userProfileStore.ensureSubscribed(uidParam);
		}
	});

	const profile = $derived(userProfileStore.getCachedProfile(uidParam));
	const isLoading = $derived(userProfileStore.isLoading(uidParam));
	const loadError = $derived(userProfileStore.getError(uidParam));

	const displayName = $derived.by(() => profile?.displayName || m.userNoName());
	const profileBio = $derived.by(() => profile?.bio || '');
	const chatUrl = $derived.by(() => (uidParam ? `/chat/room?uid=${encodeURIComponent(uidParam)}` : '#'));

	// 본인 프로필 여부 확인
	const isOwnProfile = $derived.by(() => authStore.currentUser?.uid === uidParam);

	// 커버 사진 URL (프로필에서 가져오거나 기본값 null)
	const coverPhotoUrl = $derived.by(() => profile?.coverPhotoUrl || null);

	// 커버 사진 업로드 상태
	let isUploadingCover = $state(false);
	let uploadProgress = $state(0);
	let uploadError = $state<string | null>(null);

	// 파일 input 참조
	let fileInput: HTMLInputElement;

	/**
	 * 커버 사진 업로드 버튼 클릭 핸들러
	 */
	function handleCoverUploadClick() {
		if (!isOwnProfile) return;
		fileInput?.click();
	}

	/**
	 * 파일 선택 핸들러
	 */
	async function handleFileChange(event: Event) {
		const input = event.target as HTMLInputElement;
		const file = input.files?.[0];

		if (!file) return;

		// 이미지 파일 검증
		if (!file.type.startsWith('image/')) {
			uploadError = '이미지 파일만 업로드 가능합니다.';
			return;
		}

		// 파일 크기 검증 (5MB)
		const maxSize = 5 * 1024 * 1024;
		if (file.size > maxSize) {
			uploadError = '파일 크기는 5MB 이하여야 합니다.';
			return;
		}

		try {
			isUploadingCover = true;
			uploadError = null;
			uploadProgress = 0;

			// Firebase Storage에 업로드
			const downloadUrl = await uploadCoverPhoto(
				file,
				uidParam,
				(progress) => {
					uploadProgress = progress;
				}
			);

			// Firebase Database에 coverPhotoUrl 저장
			const coverPhotoRef = ref(database, `users/${uidParam}/coverPhotoUrl`);
			await set(coverPhotoRef, downloadUrl);

			// 성공 메시지 (선택사항)
			console.log('✅ 커버 사진 업로드 성공:', downloadUrl);
		} catch (error) {
			console.error('❌ 커버 사진 업로드 실패:', error);
			uploadError = error instanceof Error ? error.message : '업로드 중 오류가 발생했습니다.';
		} finally {
			isUploadingCover = false;
			uploadProgress = 0;
			// input 값 초기화 (같은 파일 다시 선택 가능하도록)
			input.value = '';
		}
	}
</script>

<svelte:head>
	<title>{m.userProfileDetail()}</title>
</svelte:head>

<section class="profile-page">
	{#if !uidParam}
		<div class="profile-alert-container">
			<p class="profile-alert">{m.chatProvideUid()}</p>
		</div>
	{:else if isLoading}
		<div class="profile-status-container">
			<p class="profile-status">{m.profileLoading()}</p>
		</div>
	{:else if loadError}
		<div class="profile-alert-container">
			<p class="profile-alert">{m.profileLoadFailed()}</p>
		</div>
	{:else if !profile}
		<div class="profile-alert-container">
			<p class="profile-alert">{m.userNotRegistered()}</p>
		</div>
	{:else}
		<!-- 숨겨진 파일 input -->
		<input
			type="file"
			accept="image/*"
			bind:this={fileInput}
			onchange={handleFileChange}
			class="hidden"
		/>

		<!-- 프로필 커버 영역 -->
		<div class="profile-cover">
			<!-- 커버 이미지 또는 기본 그라디언트 -->
			{#if coverPhotoUrl}
				<img src={coverPhotoUrl} alt="커버 이미지" class="profile-cover-image" />
			{/if}
			<div class="profile-cover-gradient"></div>

			<!-- 본인 프로필인 경우 업로드 버튼 표시 -->
			{#if isOwnProfile}
				<button
					type="button"
					class="cover-upload-button"
					onclick={handleCoverUploadClick}
					disabled={isUploadingCover}
					aria-label="커버 사진 업로드"
				>
					{#if isUploadingCover}
						<!-- 업로드 중 스피너 -->
						<svg
							class="upload-spinner"
							xmlns="http://www.w3.org/2000/svg"
							fill="none"
							viewBox="0 0 24 24"
						>
							<circle
								class="opacity-25"
								cx="12"
								cy="12"
								r="10"
								stroke="currentColor"
								stroke-width="4"
							></circle>
							<path
								class="opacity-75"
								fill="currentColor"
								d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
							></path>
						</svg>
						<span class="upload-progress-text">{uploadProgress}%</span>
					{:else}
						<!-- 카메라 아이콘 -->
						<svg
							class="camera-icon"
							xmlns="http://www.w3.org/2000/svg"
							fill="none"
							viewBox="0 0 24 24"
							stroke="currentColor"
						>
							<path
								stroke-linecap="round"
								stroke-linejoin="round"
								stroke-width="2"
								d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z"
							/>
							<path
								stroke-linecap="round"
								stroke-linejoin="round"
								stroke-width="2"
								d="M15 13a3 3 0 11-6 0 3 3 0 016 0z"
							/>
						</svg>
					{/if}
				</button>
			{/if}

			<!-- 업로드 에러 메시지 -->
			{#if uploadError}
				<div class="upload-error-message">
					{uploadError}
				</div>
			{/if}
		</div>

		<!-- 프로필 메인 콘텐츠 -->
		<div class="profile-content">
			<!-- 아바타 (커버 영역과 겹치도록 배치) -->
			<div class="profile-avatar-wrapper">
				<Avatar uid={uidParam} size={120} class="profile-avatar" />
			</div>

			<!-- 사용자 정보 -->
			<div class="profile-info-section">
				<h1 class="profile-name">{displayName}</h1>
				{#if profileBio}
					<p class="profile-bio">{profileBio}</p>
				{/if}
			</div>

			<!-- 액션 버튼 -->
			{#if uidParam}
				<div class="profile-actions">
					<FollowButton targetUid={uidParam} />

					{#if authStore.isAuthenticated}
						<Button href={chatUrl} class="profile-chat-button">
							{m.chatSingleChat()}
						</Button>
					{:else}
						<Button href="/auth/sign-in" variant="secondary" class="profile-login-button">
							{m.chatSignInRequired()}
						</Button>
					{/if}
				</div>
			{/if}

			<!-- 추가 정보 섹션 (향후 확장 가능) -->
			<div class="profile-stats">
				<!-- 여기에 게시글 수, 팔로워 수 등 통계 정보 추가 가능 -->
			</div>
		</div>
	{/if}
</section>

<style>
	@import 'tailwindcss' reference;

	/* 메인 컨테이너 - 상단 여백 제거 */
	.profile-page {
		@apply relative w-full;
	}

	/* 에러/로딩 상태 컨테이너 */
	.profile-alert-container,
	.profile-status-container {
		@apply flex min-h-[50vh] items-center justify-center px-4;
	}

	.profile-status {
		@apply text-center text-base text-gray-600;
	}

	.profile-alert {
		@apply text-center text-sm font-medium text-red-600;
	}

	/* 프로필 커버 영역 */
	.profile-cover {
		@apply relative h-48 w-full bg-gradient-to-br from-blue-500 via-purple-500 to-pink-500 sm:h-56;
		@apply overflow-hidden;
	}

	/* 커버 이미지 */
	.profile-cover-image {
		@apply absolute inset-0 h-full w-full object-cover;
	}

	.profile-cover-gradient {
		@apply absolute inset-0 bg-gradient-to-t from-black/20 to-transparent;
	}

	/* 커버 업로드 버튼 */
	.cover-upload-button {
		@apply absolute bottom-4 right-4 z-10;
		@apply flex h-12 w-12 items-center justify-center;
		@apply rounded-full bg-white/90 shadow-lg;
		@apply transition-all hover:bg-white hover:shadow-xl;
		@apply disabled:cursor-not-allowed disabled:opacity-50;
	}

	/* 카메라 아이콘 */
	.camera-icon {
		@apply h-6 w-6 text-gray-700;
	}

	/* 업로드 스피너 */
	.upload-spinner {
		@apply h-6 w-6 animate-spin text-blue-600;
	}

	/* 업로드 진행률 텍스트 */
	.upload-progress-text {
		@apply absolute text-xs font-semibold text-blue-600;
	}

	/* 업로드 에러 메시지 */
	.upload-error-message {
		@apply absolute bottom-20 left-1/2 z-10 -translate-x-1/2;
		@apply rounded-lg bg-red-500 px-4 py-2 text-sm font-medium text-white shadow-lg;
	}

	/* 프로필 메인 콘텐츠 */
	.profile-content {
		@apply relative mx-auto max-w-4xl px-4 pb-8;
	}

	/* 아바타 래퍼 - 커버와 겹치도록 배치 */
	.profile-avatar-wrapper {
		@apply relative -mt-16 flex justify-center sm:-mt-20;
	}

	.profile-avatar {
		@apply rounded-full border-4 border-white shadow-lg;
	}

	/* 사용자 정보 섹션 */
	.profile-info-section {
		@apply mt-4 text-center;
	}

	.profile-name {
		@apply text-2xl font-bold text-gray-900 sm:text-3xl;
	}

	.profile-bio {
		@apply mt-2 text-base text-gray-600;
	}

	/* 액션 버튼 */
	.profile-actions {
		@apply mt-6 flex flex-col gap-3 sm:flex-row sm:justify-center;
	}

	.profile-chat-button {
		@apply w-full bg-blue-600 text-white shadow-md transition-all hover:bg-blue-700 hover:shadow-lg sm:w-auto;
	}

	.profile-login-button {
		@apply w-full transition-all hover:shadow-md sm:w-auto;
	}

	/* 통계 섹션 (향후 확장용) */
	.profile-stats {
		@apply mt-8 flex flex-wrap justify-center gap-6;
	}
</style>
```

## 기술적 세부사항

### 1. Svelte 5 Runes 사용
- `$derived`: 반응형 계산 값
- `$derived.by()`: 복잡한 파생 상태 (본인 프로필 감지, 커버 URL 등)
- `$effect`: 사이드 이펙트 처리 (프로필 데이터 구독)
- `$state`: 컴포넌트 상태 관리 (업로드 진행률, 에러 등)

### 2. URL 파라미터 처리
```typescript
const uidParam = $derived.by(() => $page.url.searchParams.get('uid') ?? '');
```

### 3. 프로필 데이터 구독
```typescript
$effect(() => {
	if (uidParam) {
		userProfileStore.ensureSubscribed(uidParam);
	}
});
```

### 4. 본인 프로필 감지 (v3.0.0)
```typescript
const isOwnProfile = $derived.by(() => authStore.currentUser?.uid === uidParam);
```
- authStore에서 현재 로그인한 사용자의 uid를 가져옴
- URL 파라미터의 uid와 비교하여 본인 프로필 여부 판단
- 본인 프로필인 경우에만 커버 업로드 버튼 표시

### 5. 커버 사진 URL 관리 (v3.0.0)
```typescript
const coverPhotoUrl = $derived.by(() => profile?.coverPhotoUrl || null);
```
- userProfileStore에서 사용자 프로필 데이터 구독
- coverPhotoUrl 필드가 있으면 커버 이미지 표시
- 없으면 그라디언트 배경 표시

### 6. 파일 업로드 상태 관리 (v3.0.0)
```typescript
let isUploadingCover = $state(false);   // 업로드 진행 중
let uploadProgress = $state(0);          // 진행률 (0-100)
let uploadError = $state<string | null>(null); // 에러 메시지
```

### 7. Firebase Storage 업로드 (v3.0.0)
```typescript
const downloadUrl = await uploadCoverPhoto(
	file,
	uidParam,
	(progress) => { uploadProgress = progress; }
);
```
- `uploadCoverPhoto()` 함수: `src/lib/functions/storage.functions.ts`에 정의
- 진행률 콜백을 통해 실시간 업로드 상태 업데이트
- Promise 기반 비동기 처리

### 8. Firebase Database 저장 (v3.0.0)
```typescript
const coverPhotoRef = ref(database, `users/${uidParam}/coverPhotoUrl`);
await set(coverPhotoRef, downloadUrl);
```
- Firebase Realtime Database에 커버 사진 URL 저장
- 경로: `/users/{uid}/coverPhotoUrl`
- userProfileStore가 실시간으로 변경 사항을 감지하여 UI 자동 업데이트

### 9. 반응형 디자인
- 모바일 우선 (Mobile First) 접근
- `sm:` 브레이크포인트를 사용한 데스크톱 최적화
- 버튼: 모바일에서 전체 너비, 데스크톱에서 자동 너비

### 10. Tailwind CSS 스타일링
- `@apply` 디렉티브로 유틸리티 클래스 조합
- 레이아웃: 인라인 클래스
- 스타일링: `<style>` 블록 내 `@apply`

## 향후 확장 가능성

### 1. 통계 정보 추가
```svelte
<div class="profile-stats">
	<div class="stat-item">
		<span class="stat-value">123</span>
		<span class="stat-label">게시글</span>
	</div>
	<div class="stat-item">
		<span class="stat-value">456</span>
		<span class="stat-label">팔로워</span>
	</div>
	<div class="stat-item">
		<span class="stat-value">789</span>
		<span class="stat-label">팔로잉</span>
	</div>
</div>
```

### 2. 커버 이미지 추가 기능
- **커버 삭제 기능**: 업로드한 커버 이미지 제거 후 기본 그라디언트로 복귀
- **이미지 편집**: 크롭, 필터 등 간단한 편집 기능
- **사진 갤러리**: 여러 커버 이미지 중 선택
- **위치 조정**: 드래그하여 커버 이미지 위치 조정

### 3. 프로필 사진 업로드
- 아바타 이미지도 커버 사진처럼 직접 업로드 가능
- `uploadProfilePhoto()` 함수 활용 (이미 구현됨)
- 경로: `users/{uid}/profile/profile-photo-{timestamp}.{extension}`
- 파일 크기 제한: 2MB

### 4. 탭 네비게이션
- 게시글 목록
- 좋아요한 게시글
- 팔로워/팔로잉 목록

## 관련 컴포넌트

- `Avatar.svelte`: 사용자 아바타 표시
- `FollowButton.svelte`: 팔로우/언팔로우 버튼
- `Button`: shadcn-svelte UI 버튼

## 관련 함수 (v3.0.0)

- `uploadCoverPhoto()`: 커버 사진 업로드 함수 (`src/lib/functions/storage.functions.ts`)
- `uploadProfilePhoto()`: 프로필 사진 업로드 함수 (`src/lib/functions/storage.functions.ts`)

## 관련 스토어

- `authStore`: 인증 상태 관리
- `userProfileStore`: 사용자 프로필 캐싱 및 구독

## Firebase 데이터 구조 (v3.0.0)

### Database 경로
```
/users/{uid}/coverPhotoUrl: "https://firebasestorage.googleapis.com/..."
```

### Storage 경로
```
users/{uid}/profile/cover-photo-{timestamp}.{extension}
users/{uid}/profile/profile-photo-{timestamp}.{extension}
```

## 참고 문서

- [Sonub Design Guideline](../../../sonub-design-guideline.md)
- [Sonub Tailwind CSS Setup](../../../sonub-setup-tailwind.md)
- [Storage Functions 스펙](./storage.functions.ts.md) (커버 사진 업로드 함수)
