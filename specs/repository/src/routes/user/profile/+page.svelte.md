---
title: +page.svelte - Svelte 5 컴포넌트
original_path: src/routes/user/profile/+page.svelte
category: route
file_type: svelte
status: current
last_updated: 2025-11-20
---

# +page.svelte

## 개요

**원본 경로**: `src/routes/user/profile/+page.svelte`

**파일 유형**: Svelte 5 컴포넌트

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
	import { getUserActionCounters, getInfluencerScore } from '$lib/functions/user.functions';
	import { ref, set } from 'firebase/database';
	import { rtdb as database } from '$lib/firebase';

	const uidParam = $derived.by(() => $page.url.searchParams.get('uid') ?? '');

	// 사용자별 게시글 수와 댓글 수 상태
	let postCount = $state(0);
	let commentCount = $state(0);
	// 인플루언서 점수 상태
	let influencerScore = $state(0);

	$effect(() => {
		if (uidParam) {
			userProfileStore.ensureSubscribed(uidParam);

			// 사용자별 action 카운터 (게시글 수, 댓글 수) 가져오기
			getUserActionCounters(uidParam, ['post', 'comment']).then((counters) => {
				postCount = counters.post ?? 0;
				commentCount = counters.comment ?? 0;
			});

			// 인플루언서 점수 가져오기
			getInfluencerScore(uidParam).then((score) => {
				influencerScore = score;
			});
		}
	});

	const profile = $derived(userProfileStore.getCachedProfile(uidParam));
	const isLoading = $derived(userProfileStore.isLoading(uidParam));
	const loadError = $derived(userProfileStore.getError(uidParam));

	const displayName = $derived.by(() => profile?.displayName || m.userNoName());
	const profileBio = $derived.by(() => profile?.bio || '');
	const chatUrl = $derived.by(() => (uidParam ? `/chat/room?uid=${encodeURIComponent(uidParam)}` : '#'));

	// 본인 프로필 여부 확인
	const isOwnProfile = $derived.by(() => authStore.user?.uid === uidParam);

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
			if (!database) {
				throw new Error('Firebase Database가 초기화되지 않았습니다.');
			}
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

			<!-- 사용자 통계 섹션 -->
			<div class="profile-stats">
				<!-- 인플루언서 점수 -->
				<div class="stat-item stat-influencer">
					<div class="stat-value stat-influencer-value">{influencerScore.toLocaleString()}</div>
					<div class="stat-label">{m.profileInfluencerScore()}</div>
				</div>

				<!-- 게시글 수 -->
				<div class="stat-item">
					<div class="stat-value">{postCount}</div>
					<div class="stat-label">{m.profilePostCount()}</div>
				</div>

				<!-- 댓글 수 -->
				<div class="stat-item">
					<div class="stat-value">{commentCount}</div>
					<div class="stat-label">{m.profileCommentCount()}</div>
				</div>
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

	/* 통계 섹션 */
	.profile-stats {
		@apply mt-8 flex flex-wrap justify-center gap-6;
	}

	/* 통계 항목 */
	.stat-item {
		@apply flex flex-col items-center rounded-lg bg-gray-50 px-6 py-4 shadow-sm;
	}

	.stat-value {
		@apply text-3xl font-bold text-gray-900;
	}

	.stat-label {
		@apply mt-1 text-sm text-gray-600;
	}

	/* 인플루언서 점수 강조 스타일 */
	.stat-influencer {
		@apply bg-gradient-to-br from-blue-50 to-purple-50 border-2 border-blue-200 shadow-md;
	}

	.stat-influencer-value {
		@apply text-4xl bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent;
	}
</style>
```
