<!--
  인플루언서 순위 페이지

  일간/월간/연간 Top 100 인플루언서를 표시합니다.
  - 상단에 일간/월간/연간 탭 메뉴
  - 각 탭 클릭 시 해당 기간의 Top 100 인플루언서 조회
  - 순위, 아바타, 이름, 점수 표시
  - 클릭 시 해당 사용자 프로필로 이동
-->

<script lang="ts">
	import * as m from '$lib/paraglide/messages.js';
	import {
		getTopInfluencers,
		getUserBasicInfo,
		getCurrentDate,
		type InfluencerRanking
	} from '$lib/functions/user.functions';
	import Avatar from '$lib/components/user/avatar.svelte';
	import { goto } from '$app/navigation';
	import { Trophy, Medal, Award } from 'lucide-svelte';

	/**
	 * 인플루언서 사용자 정보 타입
	 */
	interface InfluencerUser extends InfluencerRanking {
		displayName: string | null;
		photoUrl: string | null;
	}

	/**
	 * 기간 타입
	 */
	type PeriodType = 'daily' | 'monthly' | 'yearly';

	/**
	 * 현재 선택된 기간 (일간/월간/연간)
	 */
	let selectedPeriod = $state<PeriodType>('monthly');

	/**
	 * 인플루언서 목록
	 */
	let influencers = $state<InfluencerUser[]>([]);
	let isLoading = $state(false);

	/**
	 * 기간 변경 시 데이터 로드
	 */
	$effect(() => {
		loadInfluencers(selectedPeriod);
	});

	/**
	 * 인플루언서 데이터 로드
	 */
	async function loadInfluencers(period: PeriodType) {
		isLoading = true;
		try {
			// ⚠️ 날짜 계산
			let date: string | undefined;
			if (period === 'daily') {
				date = getCurrentDate('yyyyMMdd');
			} else if (period === 'monthly') {
				date = getCurrentDate('yyyyMM');
			} else if (period === 'yearly') {
				date = getCurrentDate('yyyy');
			}

			// ⚠️ Top 100 인플루언서 조회
			const rankings = await getTopInfluencers(period, date, 100);

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

			influencers = influencersWithInfo;
		} catch (error) {
			console.error('인플루언서 데이터 로드 실패:', error);
			influencers = [];
		} finally {
			isLoading = false;
		}
	}

	/**
	 * 기간 선택
	 */
	function selectPeriod(period: PeriodType) {
		selectedPeriod = period;
	}

	/**
	 * 특정 인플루언서 프로필로 이동
	 */
	function goToUserProfile(uid: string) {
		goto(`/user/profile?uid=${uid}`);
	}

	/**
	 * 순위 메달 아이콘 반환
	 */
	function getRankIcon(rank: number) {
		if (rank === 1) return Trophy;
		if (rank === 2) return Medal;
		if (rank === 3) return Award;
		return null;
	}

	/**
	 * 순위 메달 색상 반환
	 */
	function getRankColor(rank: number) {
		if (rank === 1) return 'text-yellow-500';
		if (rank === 2) return 'text-gray-400';
		if (rank === 3) return 'text-amber-600';
		return 'text-gray-600';
	}
</script>

<svelte:head>
	<title>{m.influencerRankingTitle()} - Sonub</title>
</svelte:head>

<div class="page-container">
	<!-- 페이지 헤더 -->
	<div class="page-header">
		<h1 class="page-title">{m.influencerRankingTitle()}</h1>
		<p class="page-description">{m.influencerRankingDescription()}</p>
	</div>

	<!-- 기간 선택 탭 -->
	<div class="tabs-container">
		<div class="tabs">
			<button
				type="button"
				onclick={() => selectPeriod('daily')}
				class="tab"
				class:tab-active={selectedPeriod === 'daily'}
			>
				{m.influencerTabDaily()}
			</button>
			<button
				type="button"
				onclick={() => selectPeriod('monthly')}
				class="tab"
				class:tab-active={selectedPeriod === 'monthly'}
			>
				{m.influencerTabMonthly()}
			</button>
			<button
				type="button"
				onclick={() => selectPeriod('yearly')}
				class="tab"
				class:tab-active={selectedPeriod === 'yearly'}
			>
				{m.influencerTabYearly()}
			</button>
		</div>
	</div>

	<!-- 인플루언서 목록 -->
	{#if isLoading}
		<div class="loading-container">
			<div class="loading-spinner"></div>
			<span class="loading-text">{m.influencerLoading()}</span>
		</div>
	{:else if influencers.length === 0}
		<div class="empty-container">
			<p class="empty-text">{m.influencerEmpty()}</p>
		</div>
	{:else}
		<div class="influencers-list">
			{#each influencers as influencer, index (influencer.uid)}
				{@const rank = index + 1}
				{@const RankIcon = getRankIcon(rank)}
				{@const rankColor = getRankColor(rank)}
				<button
					type="button"
					onclick={() => goToUserProfile(influencer.uid)}
					class="influencer-item"
				>
					<!-- 순위 -->
					<div class="rank-section">
						{#if RankIcon}
							<svelte:component this={RankIcon} class="rank-icon {rankColor}" size={24} />
						{:else}
							<div class="rank-number">{rank}</div>
						{/if}
					</div>

					<!-- 아바타 -->
					<div class="avatar-section">
						<Avatar uid={influencer.uid} size={56} />
					</div>

					<!-- 사용자 정보 -->
					<div class="info-section">
						<div class="user-name">
							{influencer.displayName || m.influencerUnknownUser()}
						</div>
						<div class="user-score">
							{m.influencerScore()} {influencer.score.toLocaleString()}
						</div>
					</div>

					<!-- 화살표 아이콘 (모바일에서는 숨김) -->
					<div class="arrow-section">
						<svg class="arrow-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
							<path
								stroke-linecap="round"
								stroke-linejoin="round"
								stroke-width="2"
								d="M9 5l7 7-7 7"
							/>
						</svg>
					</div>
				</button>
			{/each}
		</div>
	{/if}
</div>

<style>
	@import 'tailwindcss' reference;

	/* 페이지 컨테이너 */
	.page-container {
		@apply mx-auto max-w-4xl p-4 md:p-6;
	}

	/* 페이지 헤더 */
	.page-header {
		@apply mb-6 text-center;
	}

	.page-title {
		@apply text-2xl font-bold text-gray-900 md:text-3xl;
	}

	.page-description {
		@apply mt-2 text-sm text-gray-600;
	}

	/* 탭 컨테이너 */
	.tabs-container {
		@apply mb-6 flex justify-center;
	}

	.tabs {
		@apply inline-flex rounded-lg bg-gray-100 p-1;
	}

	.tab {
		@apply rounded-md px-6 py-2 text-sm font-medium text-gray-700 transition-all duration-200;
		@apply hover:text-gray-900;
	}

	.tab-active {
		@apply bg-white text-pink-600 shadow-sm;
	}

	/* 로딩 상태 */
	.loading-container {
		@apply flex flex-col items-center justify-center py-12;
	}

	.loading-spinner {
		@apply h-8 w-8 animate-spin rounded-full border-4 border-pink-500 border-t-transparent;
	}

	.loading-text {
		@apply mt-4 text-sm text-gray-600;
	}

	/* 빈 상태 */
	.empty-container {
		@apply flex justify-center py-12;
	}

	.empty-text {
		@apply text-gray-600;
	}

	/* 인플루언서 목록 */
	.influencers-list {
		@apply space-y-2;
	}

	/* 인플루언서 아이템 */
	.influencer-item {
		@apply flex w-full items-center gap-4 rounded-lg bg-white p-4 shadow-sm transition-all duration-200;
		@apply hover:bg-pink-50 hover:shadow-md;
	}

	/* 순위 섹션 */
	.rank-section {
		@apply flex w-12 shrink-0 items-center justify-center;
	}

	.rank-icon {
		@apply h-6 w-6;
	}

	.rank-number {
		@apply text-lg font-bold text-gray-600;
	}

	/* 아바타 섹션 */
	.avatar-section {
		@apply shrink-0;
	}

	/* 정보 섹션 */
	.info-section {
		@apply min-w-0 flex-1;
	}

	.user-name {
		@apply truncate text-base font-semibold text-gray-900;
	}

	.user-score {
		@apply mt-1 text-sm text-gray-600;
	}

	/* 화살표 섹션 */
	.arrow-section {
		@apply hidden shrink-0 md:block;
	}

	.arrow-icon {
		@apply h-5 w-5 text-gray-400 transition-all duration-200;
	}

	.influencer-item:hover .arrow-icon {
		@apply translate-x-1 text-pink-500;
	}
</style>
