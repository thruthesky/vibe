<script lang="ts">
	/**
	 * 통계 카드 컴포넌트
	 *
	 * Firebase Realtime Database의 실시간 통계를 표시합니다.
	 * 사용자 수, 게시글 수, 댓글 수, 채팅 메시지 수, 팔로우 수를 보여줍니다.
	 */

	import * as Card from '$lib/components/ui/card/index.js';
	import { rtdbStore } from '$lib/stores/database.svelte';
	import { formatNumberWithComma } from '$lib/functions/number.functions';
	import { goto } from '$app/navigation';
	import { BarChart3, ChevronRight } from 'lucide-svelte';
	import * as m from '$lib/paraglide/messages.js';

	// 실시간 통계 데이터 스토어
	const userCountStore = rtdbStore<number>('stats/counters/user', 0);
	const postCountStore = rtdbStore<number>('stats/counters/post', 0);
	const commentCountStore = rtdbStore<number>('stats/counters/comment', 0);
	const messageCountStore = rtdbStore<number>('stats/counters/message', 0);
	const followCountStore = rtdbStore<number>('stats/counters/follow', 0);

	/**
	 * 통계 상세 페이지로 이동
	 */
	function goToStats() {
		void goto('/stats');
	}
</script>

<div class="stats-section">
	<!-- 헤더 -->
	<div class="section-header">
		<div class="header-left flex items-center gap-2">
			<BarChart3 class="section-icon" aria-hidden="true" />
			<h3 class="section-title">{m.statsRealtimeTitle()}</h3>
		</div>
		<button
			type="button"
			onclick={goToStats}
			class="more-button"
			aria-label={`${m.statsRealtimeTitle()} ${m.homeSidebarSeeMore()}`}
		>
			<span class="more-text">{m.homeSidebarSeeMore()}</span>
			<ChevronRight class="more-icon" size={16} />
		</button>
	</div>

	<!-- 컨텐츠 -->
	<div class="section-content">
		<div class="stats-grid">
			<div class="stat-item">
				<span class="stat-label">{m.commonUser()}</span>
				<span class="stat-value">
					{#if $userCountStore.loading}
						...
					{:else}
						{formatNumberWithComma($userCountStore.data)}
					{/if}
				</span>
			</div>
			<div class="stat-item">
				<span class="stat-label">{m.commonPost()}</span>
				<span class="stat-value">
					{#if $postCountStore.loading}
						...
					{:else}
						{formatNumberWithComma($postCountStore.data)}
					{/if}
				</span>
			</div>
			<div class="stat-item">
				<span class="stat-label">{m.commonComment()}</span>
				<span class="stat-value">
					{#if $commentCountStore.loading}
						...
					{:else}
						{formatNumberWithComma($commentCountStore.data)}
					{/if}
				</span>
			</div>
			<div class="stat-item">
				<span class="stat-label">{m.statsMessageLabel()}</span>
				<span class="stat-value">
					{#if $messageCountStore.loading}
						...
					{:else}
						{formatNumberWithComma($messageCountStore.data)}
					{/if}
				</span>
			</div>
			<div class="stat-item">
				<span class="stat-label">{m.statsFollowLabel()}</span>
				<span class="stat-value">
					{#if $followCountStore.loading}
						...
					{:else}
						{formatNumberWithComma($followCountStore.data)}
					{/if}
				</span>
			</div>
		</div>
	</div>
</div>

<style>
	@import 'tailwindcss' reference;

	/* 섹션 컨테이너 - 보더 없이 심플하게 */
	.stats-section {
		@apply rounded-xl bg-white/90 p-4 shadow-sm;
	}

	/* 헤더 영역 */
	.section-header {
		@apply mb-3 flex items-center justify-between;
	}

	.section-icon {
		@apply h-4 w-4 text-emerald-500;
	}

	.section-title {
		@apply text-sm font-semibold text-gray-900;
	}

	/* 더보기 버튼 */
	.more-button {
		@apply flex items-center gap-0.5 rounded-lg px-2 py-1 text-xs font-medium text-gray-600 transition-all;
		@apply hover:bg-gray-100 hover:text-emerald-600;
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
		@apply space-y-2;
	}

	/* 통계 그리드 - 2x3 레이아웃 */
	.stats-grid {
		@apply grid grid-cols-2 gap-2;
	}

	/* 통계 아이템 */
	.stat-item {
		@apply flex flex-col gap-1 rounded-lg bg-gradient-to-br from-emerald-50/50 to-white p-2.5 transition-all duration-200;
		@apply hover:from-emerald-50 hover:shadow-sm;
	}

	.stat-label {
		@apply text-[10px] font-medium uppercase tracking-wide text-gray-500;
	}

	.stat-value {
		@apply text-lg font-bold text-emerald-600;
	}
</style>
