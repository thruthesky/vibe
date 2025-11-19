<script lang="ts">
	/**
	 * 제안 카드 컴포넌트
	 *
	 * 사용자에게 추천 항목을 표시합니다.
	 * 인기 게시물, 인기 사용자 등을 보여줍니다.
	 */

	import { m } from '$lib/paraglide/messages';
	import { TrendingUp, Sparkles, ChevronRight, Users } from 'lucide-svelte';
	import { goto } from '$app/navigation';
	import {
		getTopInfluencers,
		getUserBasicInfo,
		getCurrentDate,
		type InfluencerRanking
	} from '$lib/functions/user.functions';
	import Avatar from '$lib/components/user/avatar.svelte';

	/**
	 * 인플루언서 사용자 정보 타입
	 */
	interface InfluencerUser extends InfluencerRanking {
		displayName: string | null;
		photoUrl: string | null;
	}

	/**
	 * Top 5 인플루언서 목록 (오늘 기준)
	 */
	let topInfluencers = $state<InfluencerUser[]>([]);
	let isLoadingInfluencers = $state(false);

	/**
	 * Top 5 인플루언서 데이터 로드
	 */
	$effect(() => {
		loadTopInfluencers();
	});

	async function loadTopInfluencers() {
		isLoadingInfluencers = true;
		try {
			// ⚠️ 오늘의 Top 5 인플루언서 조회
			const today = getCurrentDate('yyyyMMdd');
			const rankings = await getTopInfluencers('daily', today, 5);

			// ⚠️ 각 인플루언서의 기본 정보 병렬로 가져오기
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
			isLoadingInfluencers = false;
		}
	}

	/**
	 * 인기 게시물 페이지로 이동
	 */
	function goToPopularPosts() {
		// TODO: 인기 게시물 페이지 경로 구현 필요
		console.log('Navigate to popular posts');
	}

	/**
	 * 인기 사용자 페이지로 이동
	 */
	function goToPopularUsers() {
		goto('/user/influencers');
	}

	/**
	 * 특정 인플루언서 프로필로 이동
	 */
	function goToUserProfile(uid: string) {
		goto(`/user/profile?uid=${uid}`);
	}
</script>

<div class="suggestions-section">
	<!-- 헤더 -->
	<div class="section-header">
		<div class="header-left flex items-center gap-2">
			<Sparkles class="section-icon" aria-hidden="true" />
			<h3 class="section-title">{m.sidebarSuggestions()}</h3>
		</div>
	</div>

	<!-- 컨텐츠 -->
	<div class="section-content">
		<ul class="suggestion-list">
			<li>
				<button type="button" onclick={goToPopularPosts} class="suggestion-item">
					<TrendingUp class="suggestion-icon" size={16} />
					<span class="suggestion-text">{m.sidebarPopularPosts()}</span>
					<ChevronRight class="suggestion-arrow" size={14} />
				</button>
			</li>
			<li>
				<button type="button" onclick={goToPopularUsers} class="suggestion-item">
					<Users class="suggestion-icon" size={16} />
					<span class="suggestion-text">{m.sidebarPopularUsers()}</span>
					<ChevronRight class="suggestion-arrow" size={14} />
				</button>
			</li>
		</ul>

		<!-- Top 5 인플루언서 아바타 표시 -->
		{#if isLoadingInfluencers}
			<div class="influencers-loading">
				<div class="loading-spinner"></div>
				<span class="loading-text">{m.loadingGeneric()}</span>
			</div>
		{:else if topInfluencers.length > 0}
			<div class="influencers-container">
				<div class="influencers-grid">
					{#each topInfluencers as influencer (influencer.uid)}
						<button
							type="button"
							onclick={() => goToUserProfile(influencer.uid)}
							class="influencer-card"
							title={influencer.displayName || m.influencerUnknownUser()}
						>
							<div class="influencer-avatar-wrapper">
								<Avatar uid={influencer.uid} size={48} />
							</div>
							<div class="influencer-info">
								<div class="influencer-name">
									{influencer.displayName || m.influencerUnknown()}
								</div>
								<div class="influencer-score">
									{m.influencerScore()} {influencer.score}
								</div>
							</div>
						</button>
					{/each}
				</div>
			</div>
		{/if}
	</div>
</div>

<style>
	@import 'tailwindcss' reference;

	/* 섹션 컨테이너 - 보더 없이 심플하게 */
	.suggestions-section {
		@apply rounded-xl bg-white/90 p-4 shadow-sm;
	}

	/* 헤더 영역 */
	.section-header {
		@apply mb-3 flex items-center justify-between;
	}

	.section-icon {
		@apply h-4 w-4 text-pink-500;
	}

	.section-title {
		@apply text-sm font-semibold text-gray-900;
	}

	/* 컨텐츠 영역 */
	.section-content {
		@apply space-y-2;
	}

	/* 제안 리스트 */
	.suggestion-list {
		@apply space-y-1.5;
	}

	/* 제안 아이템 - 콤팩트한 디자인 */
	.suggestion-item {
		@apply flex w-full items-center gap-2.5 rounded-lg bg-gray-50/50 px-3 py-2 transition-all duration-200;
		@apply hover:bg-pink-50/80 hover:shadow-sm;
	}

	.suggestion-icon {
		@apply shrink-0 text-pink-500 transition-transform duration-200;
	}

	.suggestion-item:hover .suggestion-icon {
		@apply scale-110;
	}

	.suggestion-text {
		@apply flex-1 text-sm font-medium text-gray-900;
	}

	.suggestion-arrow {
		@apply shrink-0 text-gray-400 transition-all duration-200;
	}

	.suggestion-item:hover .suggestion-arrow {
		@apply translate-x-0.5 text-pink-500;
	}

	/* 인플루언서 로딩 상태 */
	.influencers-loading {
		@apply mt-3 flex items-center justify-center gap-2 rounded-lg bg-gray-50 py-4;
	}

	.loading-spinner {
		@apply h-4 w-4 animate-spin rounded-full border-2 border-pink-500 border-t-transparent;
	}

	.loading-text {
		@apply text-xs text-gray-600;
	}

	/* 인플루언서 컨테이너 */
	.influencers-container {
		@apply mt-3 rounded-lg bg-gray-50/50 p-2;
	}

	.influencers-grid {
		@apply grid grid-cols-1 gap-2;
	}

	/* 인플루언서 카드 */
	.influencer-card {
		@apply flex w-full items-center gap-3 rounded-lg bg-white p-2 transition-all duration-200;
		@apply hover:bg-pink-50 hover:shadow-sm;
	}

	.influencer-avatar-wrapper {
		@apply shrink-0;
	}

	.influencer-info {
		@apply min-w-0 flex-1 text-left;
	}

	.influencer-name {
		@apply truncate text-sm font-medium text-gray-900;
	}

	.influencer-score {
		@apply text-xs text-gray-500;
	}
</style>
