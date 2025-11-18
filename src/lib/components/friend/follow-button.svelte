<script lang="ts">
	/**
	 * 팔로우/언팔로우 버튼 컴포넌트
	 *
	 * 사용자를 팔로우하거나 언팔로우할 수 있는 버튼입니다.
	 * 실시간으로 팔로우 상태를 확인하고 업데이트합니다.
	 */

	import { onMount, onDestroy } from 'svelte';
	import { rtdb as database } from '$lib/firebase';
	import { ref, set, remove, onValue, type Unsubscribe } from 'firebase/database';
	import { authStore } from '$lib/stores/auth.svelte';
	import * as m from '$lib/paraglide/messages.js';
	import { UserPlus, UserCheck } from 'lucide-svelte';

	// Props
	/** 팔로우할 대상 사용자의 UID */
	let { targetUid }: { targetUid: string } = $props();

	// 상태 관리
	/** 현재 팔로우 중인지 여부 */
	let isFollowing = $state(false);
	/** 로딩 상태 */
	let loading = $state(false);
	/** 데이터 로딩 중 (초기 상태 확인) */
	let initialLoading = $state(true);

	// Firebase 구독 해제 함수
	let unsubscribe: Unsubscribe | null = null;

	/**
	 * 팔로우 상태 실시간 구독
	 *
	 * /user-following/{myUid}/{targetUid} 경로를 구독하여
	 * 실시간으로 팔로우 상태를 업데이트합니다.
	 */
	function subscribeFollowStatus() {
		const myUid = authStore.user?.uid;
		if (!myUid || !database) {
			initialLoading = false;
			return;
		}

		// 자기 자신인 경우 구독하지 않음
		if (myUid === targetUid) {
			initialLoading = false;
			return;
		}

		const followingRef = ref(database, `user-following/${myUid}/${targetUid}`);

		unsubscribe = onValue(
			followingRef,
			(snapshot) => {
				isFollowing = snapshot.val() === true;
				initialLoading = false;
			},
			(error) => {
				console.error('팔로우 상태 구독 오류:', error);
				initialLoading = false;
			}
		);
	}

	/**
	 * 팔로우 버튼 클릭 핸들러
	 *
	 * 팔로우 중이면 언팔로우, 아니면 팔로우합니다.
	 */
	async function handleFollowClick() {
		const myUid = authStore.user?.uid;

		// 로그인 체크
		if (!myUid) {
			alert(m.followLoginRequired());
			return;
		}

		// Database 체크
		if (!database) {
			alert('Firebase 연결이 없습니다.');
			return;
		}

		// 자기 자신 팔로우 방지
		if (myUid === targetUid) {
			alert(m.followSelfNotAllowed());
			return;
		}

		loading = true;

		try {
			const followingRef = ref(database, `user-following/${myUid}/${targetUid}`);

			if (isFollowing) {
				// 언팔로우
				await remove(followingRef);
				// alert(m.unfollowSuccess()); // 알림 제거 (UX 개선)
			} else {
				// 팔로우
				await set(followingRef, true);
				// alert(m.followSuccess()); // 알림 제거 (UX 개선)
			}
		} catch (error) {
			console.error('팔로우 처리 오류:', error);
			alert(m.followError());
		} finally {
			loading = false;
		}
	}

	// 컴포넌트 마운트 시 구독 시작
	onMount(() => {
		subscribeFollowStatus();
	});

	// 컴포넌트 언마운트 시 구독 해제
	onDestroy(() => {
		if (unsubscribe) {
			unsubscribe();
		}
	});

	// 로그인 상태 변경 시 재구독
	$effect(() => {
		if (authStore.user) {
			subscribeFollowStatus();
		} else {
			if (unsubscribe) {
				unsubscribe();
				unsubscribe = null;
			}
			isFollowing = false;
			initialLoading = false;
		}
	});
</script>

<!-- 자기 자신인 경우 버튼 표시하지 않음 -->
{#if authStore.user?.uid === targetUid}
	<!-- 아무것도 표시하지 않음 -->
{:else if initialLoading}
	<!-- 초기 로딩 중 -->
	<button class="follow-button loading" disabled>
		<span class="loading-text">{m.commonLoading()}</span>
	</button>
{:else}
	<!-- 팔로우/언팔로우 버튼 -->
	<button
		class="follow-button"
		class:following={isFollowing}
		class:loading
		onclick={handleFollowClick}
		disabled={loading || !authStore.user}
	>
		{#if loading}
			<span class="loading-text">{m.followLoading()}</span>
		{:else if isFollowing}
			<UserCheck class="h-4 w-4" />
			<span class="button-text hidden md:inline-block ml-1">{m.followingButton()}</span>
		{:else}
			<UserPlus class="h-4 w-4" />
			<span class="button-text hidden md:inline-block ml-1">{m.followButton()}</span>
		{/if}
	</button>
{/if}

<style>
	@reference "tailwindcss";

	/* 팔로우 버튼 기본 스타일 */
	.follow-button {
		/* Layout */
		@apply inline-flex items-center justify-center gap-1;
		@apply px-3 py-2;
		/* 모바일: 아이콘만 표시되므로 최소 너비 없음, 데스크톱: 텍스트 포함으로 최소 너비 적용 */
		@apply md:min-w-24;

		/* Typography */
		@apply text-sm font-medium;

		/* Visual */
		@apply rounded-full;
		@apply border;
		@apply transition-all duration-200;
		@apply cursor-pointer;

		/* Default state: 팔로우 버튼 (파란색) */
		@apply bg-blue-600 text-white border-blue-600;
		@apply hover:bg-blue-700;
		@apply active:scale-95;
	}

	/* 팔로잉 상태 (회색) */
	.follow-button.following {
		@apply bg-gray-200 text-gray-800 border-gray-300;
		@apply hover:bg-gray-300;
	}

	/* 로딩 상태 */
	.follow-button.loading {
		@apply opacity-70;
		@apply cursor-not-allowed;
	}

	/* 비활성화 상태 */
	.follow-button:disabled {
		@apply opacity-50;
		@apply cursor-not-allowed;
	}

	/* 버튼 텍스트 */
	.button-text,
	.loading-text {
		@apply whitespace-nowrap;
	}

	/* 로딩 애니메이션 */
	.loading-text::after {
		content: '...';
		animation: dots 1.5s steps(4, end) infinite;
	}

	@keyframes dots {
		0%,
		20% {
			content: '';
		}
		40% {
			content: '.';
		}
		60% {
			content: '..';
		}
		80%,
		100% {
			content: '...';
		}
	}
</style>
