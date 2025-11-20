<script lang="ts">
	/**
	 * 최근 활동 섹션 컴포넌트
	 *
	 * 최근 게시글 5개를 표시합니다.
	 * Firebase Realtime Database의 posts에서 삭제되지 않은 게시글을 조회합니다.
	 */

	import * as Card from '$lib/components/ui/card/index.js';
	import { m } from '$lib/paraglide/messages';
	import { onMount, onDestroy } from 'svelte';
	import { rtdb } from '$lib/firebase';
	import { formatShortDate } from '$lib/functions/date.functions';
	import { limitToLast, onValue, orderByChild, query, ref } from 'firebase/database';
	import { Activity as ActivityIcon, ChevronRight } from 'lucide-svelte';
	import { goto } from '$app/navigation';

	type RecentActivity = {
		messageId: string;
		text: string;
		category: string;
		createdAt: number;
	};

	// Svelte 5 $state rune을 사용하여 반응형 상태 선언
	let recentActivities = $state<RecentActivity[]>([]);
	let isLoadingRecentActivity = $state(true);

	let activityUnsubscribe: (() => void) | null = null;

	/**
	 * 최근 활동 리스너 정리
	 */
	function teardownRecentActivityListener() {
		if (activityUnsubscribe) {
			activityUnsubscribe();
			activityUnsubscribe = null;
		}
	}

	/**
	 * 최근 활동 리스너 설정
	 * 실시간으로 최근 게시글 목록을 업데이트합니다.
	 */
	function setupRecentActivityListener() {
		teardownRecentActivityListener();

		if (!rtdb) {
			recentActivities = [];
			isLoadingRecentActivity = false;
			return;
		}

		isLoadingRecentActivity = true;
		// 게시글은 /posts/{postId}에 저장됨
		// createdAt 기준으로 시간 역순 정렬하여 최근 5개 가져오기
		const postsRef = ref(rtdb, 'posts');
		const activityQuery = query(postsRef, orderByChild('createdAt'), limitToLast(5));

		activityUnsubscribe = onValue(
			activityQuery,
			(snapshot) => {
				const items: RecentActivity[] = [];

				snapshot.forEach((child) => {
					const value = child.val() ?? {};
					// 삭제된 게시글은 제외
					if (value?.deleted) {
						return;
					}

					items.push({
						messageId: child.key ?? '', // postId
						text: (value?.text as string) || '',
						category: (value?.category as string) || '',
						createdAt: Number(value?.createdAt) || 0
					});
				});

				// 시간 역순 정렬 (최근순)
				items.sort((a, b) => b.createdAt - a.createdAt);
				recentActivities = items.slice(0, 5);
				isLoadingRecentActivity = false;
			},
			(error) => {
				console.error('[RecentActivities] 최근 활동 로드 실패:', error);
				recentActivities = [];
				isLoadingRecentActivity = false;
			}
		);
	}

	/**
	 * 게시글 목록 페이지로 이동
	 */
	function goToPostList() {
		void goto('/post/list');
	}

	onMount(() => {
		setupRecentActivityListener();

		return () => {
			teardownRecentActivityListener();
		};
	});

	onDestroy(() => {
		teardownRecentActivityListener();
	});
</script>

<div class="recent-activities-section">
	<!-- 헤더 -->
	<div class="section-header">
		<div class="header-left flex items-center gap-2">
			<ActivityIcon class="section-icon" aria-hidden="true" />
			<h3 class="section-title">{m.homeSidebarActivityTitle()}</h3>
		</div>
		<button
			type="button"
			onclick={goToPostList}
			class="more-button"
			aria-label={`${m.homeSidebarActivityTitle()} ${m.homeSidebarSeeMore()}`}
		>
			<span class="more-text">{m.homeSidebarSeeMore()}</span>
			<ChevronRight class="more-icon" size={16} />
		</button>
	</div>

	<!-- 컨텐츠 -->
	<div class="section-content">
		{#if isLoadingRecentActivity}
			<p class="placeholder-text">{m.commonLoading()}</p>
		{:else if recentActivities.length === 0}
			<p class="placeholder-text">{m.homeSidebarActivityEmpty()}</p>
		{:else}
			<ul class="activity-list">
				{#each recentActivities as activity}
					<li>
						<a
							href={`/post/view?postId=${activity.messageId}`}
							class="activity-item"
						>
							<div class="activity-header">
								<span class="activity-category">{activity.category || m.commonPost()}</span>
							</div>
							<p class="activity-text">
								{activity.text || m.homeSidebarActivityNoText()}
							</p>
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
	.recent-activities-section {
		@apply rounded-xl bg-white/90 p-3 shadow-sm;
	}

	/* 헤더 영역 */
	.section-header {
		@apply mb-2.5 flex items-center justify-between;
	}

	.section-icon {
		@apply h-3.5 w-3.5 text-orange-500;
	}

	.section-title {
		@apply text-sm font-semibold text-gray-900;
	}

	/* 더보기 버튼 */
	.more-button {
		@apply flex items-center gap-0.5 rounded-lg px-1.5 py-0.5 text-xs font-medium text-gray-600 transition-all;
		@apply hover:bg-gray-100 hover:text-orange-600;
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

	/* 활동 리스트 */
	.activity-list {
		@apply space-y-1;
	}

	/* 활동 아이템 - 콤팩트한 디자인 */
	.activity-item {
		@apply block rounded-lg bg-gray-50/50 px-2.5 py-1.5 transition-all duration-200;
		@apply hover:bg-orange-50/80 hover:shadow-sm;
	}

	/* 활동 헤더 */
	.activity-header {
		@apply mb-0.5;
	}

	.activity-category {
		@apply inline-block rounded-md bg-orange-100 px-1.5 py-0.5 text-xs font-semibold text-orange-700;
	}

	/* 활동 텍스트 */
	.activity-text {
		@apply line-clamp-2 text-xs text-gray-600;
	}
</style>
