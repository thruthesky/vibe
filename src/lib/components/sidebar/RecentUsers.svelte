<script lang="ts">
	/**
	 * 최근 사용자 섹션 컴포넌트
	 *
	 * 프로필 사진이 있는 최근 가입 사용자 5명을 표시합니다.
	 * Firebase Realtime Database의 sort_recentWithPhoto 필드를 기준으로 정렬합니다.
	 */

	import * as Card from '$lib/components/ui/card/index.js';
	import { m } from '$lib/paraglide/messages';
	import { onMount } from 'svelte';
	import { rtdb } from '$lib/firebase';
	import { formatShortDate } from '$lib/functions/date.functions';
	import { get, limitToLast, orderByChild, query, ref, type DatabaseReference } from 'firebase/database';
	import { UsersRound, ChevronRight } from 'lucide-svelte';
	import { goto } from '$app/navigation';

	type UserPreview = {
		uid: string;
		displayName: string;
		photoUrl: string | null;
		sortRecentWithPhotos: number;
	};

	// Svelte 5 $state rune을 사용하여 반응형 상태 선언
	let recentUsers = $state<UserPreview[]>([]);
	let isLoadingRecentUsers = $state(true);

	/**
	 * 최근 사용자 5명 로드
	 * sort_recentWithPhoto 필드를 역순으로 정렬하여 최근 사용자 표시
	 */
	async function fetchRecentUsers() {
		if (!rtdb) {
			isLoadingRecentUsers = false;
			recentUsers = [];
			return;
		}

		try {
			const usersRef: DatabaseReference = ref(rtdb, 'users');
			// sort_recentWithPhoto 필드 기준으로 마지막 5명 조회
			const recentQuery = query(usersRef, orderByChild('sort_recentWithPhoto'), limitToLast(5));
			const snapshot = await get(recentQuery);
			const users: UserPreview[] = [];

			snapshot.forEach((child) => {
				const value = child.val();

				users.push({
					uid: child.key ?? '',
					displayName: value?.displayName ?? '',
					photoUrl: value?.photoUrl ?? null,
					sortRecentWithPhotos: Number(value?.sort_recentWithPhoto) || 0
				});
			});

			// 역순 정렬 (최근순)
			users.sort((a, b) => (b.sortRecentWithPhotos ?? 0) - (a.sortRecentWithPhotos ?? 0));

			// 프로필 사진이 있는 사용자만 필터링하여 최대 5명
			const filteredUsers = users.filter((user) => Boolean(user.photoUrl)).slice(0, 5);

			recentUsers = filteredUsers;
		} catch (error) {
			console.error('[RecentUsers] 최근 사용자 로드 실패:', error);
			recentUsers = [];
		} finally {
			isLoadingRecentUsers = false;
		}
	}

	/**
	 * 사용자 목록 페이지로 이동
	 */
	function goToUserList() {
		void goto('/user/list');
	}

	onMount(() => {
		fetchRecentUsers();
	});
</script>

<div class="recent-users-section">
	<!-- 헤더 -->
	<div class="section-header">
		<div class="header-left flex items-center gap-2">
			<UsersRound class="section-icon" aria-hidden="true" />
			<h3 class="section-title">{m.homeSectionRecentUsers()}</h3>
		</div>
		<button
			type="button"
			onclick={goToUserList}
			class="more-button"
			aria-label="사용자 목록 더보기"
		>
			<span class="more-text">더보기</span>
			<ChevronRight class="more-icon" size={16} />
		</button>
	</div>

	<!-- 컨텐츠 -->
	<div class="section-content">
		{#if isLoadingRecentUsers}
			<p class="placeholder-text">로딩 중...</p>
		{:else if recentUsers.length === 0}
			<p class="placeholder-text">{m.homeSidebarRecentUsersEmpty()}</p>
		{:else}
			<ul class="user-list">
				{#each recentUsers as user (user.uid)}
					<li>
						<a
							href={`/user/profile?uid=${encodeURIComponent(user.uid)}`}
							class="user-item"
							aria-label={user.displayName || m.commonUser()}
						>
							<div class="user-avatar-wrapper">
								<img
									src={user.photoUrl ?? ''}
									alt={user.displayName || 'recent user'}
									class="user-avatar"
									loading="lazy"
								/>
								<div class="user-status"></div>
							</div>
							<div class="user-info">
								<span class="user-name">{user.displayName || m.commonUser()}</span>
							</div>
						</a>
					</li>
				{/each}
			</ul>
		{/if}
	</div>
</div>

<style>
	@import 'tailwindcss' reference;

	/* 섹션 컨테이너 - 보더 없이 심플하게 */
	.recent-users-section {
		@apply rounded-xl bg-white/90 p-3 shadow-sm;
	}

	/* 헤더 영역 */
	.section-header {
		@apply mb-2.5 flex items-center justify-between;
	}

	.section-icon {
		@apply h-3.5 w-3.5 text-purple-500;
	}

	.section-title {
		@apply text-sm font-semibold text-gray-900;
	}

	/* 더보기 버튼 */
	.more-button {
		@apply flex items-center gap-0.5 rounded-lg px-1.5 py-0.5 text-xs font-medium text-gray-600 transition-all;
		@apply hover:bg-gray-100 hover:text-purple-600;
	}

	.more-text {
		@apply text-xs;
	}

	.more-icon {
		@apply transition-transform;
	}

	.more-button:hover .more-icon {
		@apply translate-x-0.5;
	}

	/* 컨텐츠 영역 */
	.section-content {
		@apply space-y-1.5;
	}

	.placeholder-text {
		@apply py-3 text-center text-xs text-gray-400;
	}

	/* 사용자 리스트 */
	.user-list {
		@apply space-y-1;
	}

	/* 사용자 아이템 - 콤팩트한 디자인 */
	.user-item {
		@apply flex items-center gap-2 rounded-lg bg-gray-50/50 px-2.5 py-1.5 transition-all duration-200;
		@apply hover:bg-purple-50/80 hover:shadow-sm;
	}

	/* 아바타 래퍼 */
	.user-avatar-wrapper {
		@apply relative shrink-0;
	}

	/* 아바타 */
	.user-avatar {
		@apply h-7 w-7 rounded-full border-2 border-white object-cover shadow-sm;
		@apply transition-transform duration-200;
	}

	.user-item:hover .user-avatar {
		@apply scale-105;
	}

	/* 온라인 상태 인디케이터 */
	.user-status {
		@apply absolute bottom-0 right-0 h-2 w-2 rounded-full border-2 border-white bg-green-500;
	}

	/* 사용자 정보 */
	.user-info {
		@apply flex flex-1 items-center;
	}

	/* 사용자 이름 */
	.user-name {
		@apply truncate text-sm font-medium text-gray-900;
		@apply transition-colors duration-200;
	}

	.user-item:hover .user-name {
		@apply text-purple-600;
	}
</style>
