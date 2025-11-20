<script lang="ts">
	/**
	 * 인기 사용자 카드 컴포넌트
	 *
	 * 오늘 기준 상위 인플루언서를 간단히 보여줍니다.
	 */

	import { m } from '$lib/paraglide/messages';
	import { Users, ChevronRight } from 'lucide-svelte';
	import { goto } from '$app/navigation';
	import {
		getTopInfluencers,
		getUserBasicInfo,
		getCurrentDate,
		type InfluencerRanking
	} from '$lib/functions/user.functions';
	import Avatar from '$lib/components/user/avatar.svelte';

	interface InfluencerUser extends InfluencerRanking {
		displayName: string | null;
		photoUrl: string | null;
	}

	let topInfluencers = $state<InfluencerUser[]>([]);
	let isLoading = $state(false);

	$effect(() => {
		loadTopInfluencers();
	});

	async function loadTopInfluencers() {
		isLoading = true;
		try {
			const today = getCurrentDate('yyyyMMdd');
			const rankings = await getTopInfluencers('daily', today, 5);

			const influencersWithInfo = await Promise.all(
				rankings.map(async (ranking) => {
					const { displayName, photoUrl } = await getUserBasicInfo(ranking.uid);
					return {
						...ranking,
						displayName,
						photoUrl
					};
				})
			);

			topInfluencers = influencersWithInfo;
		} catch (error) {
			console.error('인플루언서 데이터 로드 실패:', error);
			topInfluencers = [];
		} finally {
			isLoading = false;
		}
	}

	function goToPopularUsers() {
		goto('/user/influencers');
	}

	function goToUserProfile(uid: string) {
		goto(`/user/profile?uid=${uid}`);
	}
</script>

<div class="popular-users-section">
	<div class="section-header">
		<div class="header-left">
			<Users class="section-icon" aria-hidden="true" />
			<h3 class="section-title">{m.sidebarPopularUsers()}</h3>
		</div>
		<button type="button" class="see-all" onclick={goToPopularUsers} aria-label={m.sidebarPopularUsers()}>
			{m.homeSidebarSeeMore()}
			<ChevronRight size={14} />
		</button>
	</div>

	<div class="section-content">
		{#if isLoading}
			<div class="status-row">
				<div class="spinner"></div>
				<span class="status-text">{m.loadingGeneric()}</span>
			</div>
		{:else if topInfluencers.length === 0}
			<div class="status-row">
				<span class="status-text">{m.receivedReactionsEmpty()}</span>
			</div>
		{:else}
			<div class="user-list">
				{#each topInfluencers as influencer (influencer.uid)}
					<button
						type="button"
						class="user-item"
						onclick={() => goToUserProfile(influencer.uid)}
						title={influencer.displayName || m.influencerUnknownUser()}
					>
						<Avatar uid={influencer.uid} size={40} />
						<div class="user-meta">
							<p class="user-name">{influencer.displayName || m.influencerUnknown()}</p>
							<p class="user-score">
								{m.influencerScore()} {influencer.score}
							</p>
						</div>
						<ChevronRight class="row-arrow" size={14} />
					</button>
				{/each}
			</div>
		{/if}
	</div>
</div>

<style>
	@import 'tailwindcss' reference;

	.popular-users-section {
		@apply rounded-xl bg-white p-4;
	}

	.section-header {
		@apply mb-3 flex items-center justify-between gap-2;
	}

	.header-left {
		@apply flex items-center gap-2;
	}

	.section-icon {
		@apply h-4 w-4 text-indigo-500;
	}

	.section-title {
		@apply text-sm font-semibold text-gray-900;
	}

	.see-all {
		@apply inline-flex items-center gap-1.5 rounded-full bg-gray-50 px-2.5 py-1 text-xs font-semibold text-gray-600 transition-colors hover:bg-indigo-50 hover:text-indigo-600;
	}

	.section-content {
		@apply space-y-2;
	}

	.status-row {
		@apply flex items-center justify-center gap-2 rounded-lg bg-gray-50 py-3 text-sm text-gray-600;
	}

	.spinner {
		@apply h-4 w-4 animate-spin rounded-full border-2 border-indigo-500 border-t-transparent;
	}

	.status-text {
		@apply text-xs text-gray-600;
	}

	.user-list {
		@apply space-y-2;
	}

	.user-item {
		@apply flex w-full items-center gap-3 rounded-lg bg-white px-3 py-2.5 text-left transition-all hover:bg-indigo-50/60;
		@apply cursor-pointer;
	}

	.user-meta {
		@apply min-w-0 flex-1;
	}

	.user-name {
		@apply truncate text-sm font-semibold text-gray-900;
	}

	.user-score {
		@apply text-xs text-gray-500;
	}

	.row-arrow {
		@apply h-4 w-4 text-gray-400;
	}
</style>
