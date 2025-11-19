<script lang="ts">
	/**
	 * 빠른 메뉴 카드 컴포넌트
	 *
	 * 팔로워, 팔로잉, 반응, 통계 등 주요 메뉴로 빠르게 이동할 수 있는 링크를 제공합니다.
	 * Firebase Realtime Database에서 팔로워/팔로잉 수를 실시간으로 가져옵니다.
	 */

	import { authStore } from '$lib/stores/auth.svelte';
	import { m } from '$lib/paraglide/messages';
	import { onDestroy } from 'svelte';
	import { createRealtimeStore } from '$lib/stores/database.svelte';
	import { UserRound, UserCheck, Heart, BarChart3 } from 'lucide-svelte';

	// 팔로워/팔로잉 상태 관리
	let followerCount = $state(0);
	let followingCount = $state(0);
	let followersLoading = $state(false);
	let followingLoading = $state(false);
	let followerStoreCleanup: (() => void) | null = null;
	let followingStoreCleanup: (() => void) | null = null;

	/**
	 * 숫자를 천 단위 콤마로 포맷팅
	 */
	function formatCount(value: number): string {
		return new Intl.NumberFormat().format(value);
	}

	/**
	 * 사용자 UID 변경 시 팔로워/팔로잉 데이터를 실시간으로 구독
	 */
	$effect(() => {
		const uid = authStore.user?.uid;

		if (!uid) {
			// 비로그인 시 모든 구독 정리
			followerStoreCleanup?.();
			followingStoreCleanup?.();
			followerStoreCleanup = null;
			followingStoreCleanup = null;
			followerCount = 0;
			followingCount = 0;
			followersLoading = false;
			followingLoading = false;
			return;
		}

		// 팔로워 데이터 구독
		followerStoreCleanup?.();
		const followerStore = createRealtimeStore<Record<string, unknown>>(
			`user-followers/${uid}`,
			{}
		);
		followersLoading = true;
		const followerUnsubscribe = followerStore.subscribe((state) => {
			followersLoading = state.loading;
			followerCount = state.data ? Object.keys(state.data).length : 0;
		});
		followerStoreCleanup = () => {
			followerUnsubscribe();
			followerStore.unsubscribe();
		};

		// 팔로잉 데이터 구독
		followingStoreCleanup?.();
		const followingStore = createRealtimeStore<Record<string, unknown>>(
			`user-following/${uid}`,
			{}
		);
		followingLoading = true;
		const followingUnsubscribe = followingStore.subscribe((state) => {
			followingLoading = state.loading;
			followingCount = state.data ? Object.keys(state.data).length : 0;
		});
		followingStoreCleanup = () => {
			followingUnsubscribe();
			followingStore.unsubscribe();
		};
	});

	/**
	 * 컴포넌트 언마운트 시 모든 구독 정리
	 */
	onDestroy(() => {
		followerStoreCleanup?.();
		followingStoreCleanup?.();
	});
</script>

<div class="quick-menu-section">
	<!-- 팔로워 -->
	<a
		href={authStore.user ? '/friend/followers' : '/auth/sign-in'}
		class="quick-link"
		aria-label={m.homeSidebarFollowers()}
	>
		<span class="quick-link-icon">
			<UserRound class="quick-link-icon-inner" aria-hidden="true" />
		</span>
		<div class="quick-link-main">
			<span class="quick-link-title">{m.homeSidebarFollowers()}</span>
			<span class="quick-link-desc">{m.homeSidebarFollowersDesc()}</span>
		</div>
		<span class="quick-link-count">
			{#if !authStore.user}
				-
			{:else if followersLoading}
				...
			{:else}
				{formatCount(followerCount)}
			{/if}
		</span>
	</a>

	<!-- 팔로잉 -->
	<a
		href={authStore.user ? '/friend/following' : '/auth/sign-in'}
		class="quick-link"
		aria-label={m.homeSidebarFollowing()}
	>
		<span class="quick-link-icon">
			<UserCheck class="quick-link-icon-inner" aria-hidden="true" />
		</span>
		<div class="quick-link-main">
			<span class="quick-link-title">{m.homeSidebarFollowing()}</span>
			<span class="quick-link-desc">{m.homeSidebarFollowingDesc()}</span>
		</div>
		<span class="quick-link-count">
			{#if !authStore.user}
				-
			{:else if followingLoading}
				...
			{:else}
				{formatCount(followingCount)}
			{/if}
		</span>
	</a>

	<!-- 반응 -->
	<a href="/my/reactions" class="quick-link" aria-label={m.homeSidebarReactions()}>
		<span class="quick-link-icon">
			<Heart class="quick-link-icon-inner" aria-hidden="true" />
		</span>
		<div class="quick-link-main">
			<span class="quick-link-title">{m.homeSidebarReactions()}</span>
			<span class="quick-link-desc">{m.homeSidebarReactionsDesc()}</span>
		</div>
	</a>

	<!-- 통계 -->
	<a href="/my/stats" class="quick-link" aria-label={m.homeSidebarStats()}>
		<span class="quick-link-icon">
			<BarChart3 class="quick-link-icon-inner" aria-hidden="true" />
		</span>
		<div class="quick-link-main">
			<span class="quick-link-title">{m.homeSidebarStats()}</span>
			<span class="quick-link-desc">{m.homeSidebarStatsDesc()}</span>
		</div>
	</a>
</div>

<style>
	@import 'tailwindcss' reference;

	/* 섹션 컨테이너 */
	.quick-menu-section {
		@apply flex flex-col gap-1.5 rounded-2xl bg-white/80 p-3 shadow-sm;
	}

	/* 빠른 링크 */
	.quick-link {
		@apply flex items-center gap-2.5 rounded-xl px-2.5 py-1.5 transition-all duration-200;
		@apply hover:bg-gray-50;
	}

	/* 빠른 링크 아이콘 */
	.quick-link-icon {
		@apply flex h-8 w-8 items-center justify-center rounded-full bg-gray-100 shadow-inner;
	}

	.quick-link-icon-inner {
		@apply h-4 w-4 text-gray-600;
	}

	/* 빠른 링크 메인 영역 */
	.quick-link-main {
		@apply flex flex-1 flex-col;
	}

	.quick-link-title {
		@apply text-sm font-semibold text-gray-900;
	}

	.quick-link-desc {
		@apply text-xs text-gray-500;
	}

	/* 빠른 링크 카운트 */
	.quick-link-count {
		@apply text-sm font-semibold text-gray-600;
	}
</style>
