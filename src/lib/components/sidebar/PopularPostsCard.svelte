<script lang="ts">
	/**
	 * 인기 게시글 카드 컴포넌트
	 *
	 * 오늘 일별 기준 상위 5개 인기 게시글을 표시합니다.
	 * 클릭 시 전체 인기 게시글 페이지로 이동합니다.
	 */

	import { getPopularPosts, getPostFields } from '$lib/functions/post.functions';
	import { getUserFields } from '$lib/functions/user.functions';
	import * as m from '$lib/paraglide/messages.js';
	import { goto } from '$app/navigation';
	import { TrendingUp, ChevronRight, Heart, MessageCircle } from 'lucide-svelte';

	// 인기 게시글 데이터
	type PopularPostData = {
		postId: string;
		score: number;
		title: string;
		text: string;
		authorUid: string;
		authorName: string;
		likeCount: number;
		commentCount: number;
	};

	let popularPosts = $state<PopularPostData[]>([]);
	let isLoading = $state(true);

	/**
	 * 컴포넌트 마운트 시 인기 게시글 로드
	 */
	$effect(() => {
		loadPopularPosts();
	});

	/**
	 * 인기 게시글 데이터 로드 (상위 5개)
	 */
	async function loadPopularPosts() {
		isLoading = true;
		try {
			const rankings = await getPopularPosts('daily', 5);

			// 각 게시글의 세부 정보 가져오기
			const postsPromises = rankings.map(async ({ postId, score }) => {
				const postData = await getPostFields(postId, [
					'title',
					'text',
					'authorUid',
					'likeCount',
					'commentCount'
				]);

				const authorUid = postData.authorUid as string;
				const userData = await getUserFields(authorUid, ['displayName']);

				// title이 없으면 text의 첫 50자를 제목으로 사용
				const text = (postData.text as string) || '';
				const title = (postData.title as string) || text.substring(0, 50);

				return {
					postId,
					score,
					title,
					text,
					authorUid,
					authorName: (userData.displayName as string) || '알 수 없는 사용자',
					likeCount: (postData.likeCount as number) || 0,
					commentCount: (postData.commentCount as number) || 0
				};
			});

			popularPosts = await Promise.all(postsPromises);
		} catch (error) {
			console.error('인기 게시글 로드 실패:', error);
		} finally {
			isLoading = false;
		}
	}

	/**
	 * 전체 인기 게시글 페이지로 이동
	 */
	function goToPopularPosts() {
		void goto('/post/popular');
	}

	/**
	 * 특정 게시글 상세 페이지로 이동
	 */
	function goToPost(postId: string) {
		void goto(`/post/view/${postId}`);
	}
</script>

<div class="popular-posts-section">
	<!-- 헤더 -->
	<div class="section-header">
		<div class="header-left flex items-center gap-2">
			<TrendingUp class="section-icon" aria-hidden="true" />
			<h3 class="section-title">{m.sidebarPopularPosts()}</h3>
		</div>
		<button
			type="button"
			onclick={goToPopularPosts}
			class="more-button"
			aria-label="인기 게시글 더보기"
		>
			<span class="more-text">더보기</span>
			<ChevronRight class="more-icon" size={16} />
		</button>
	</div>

	<!-- 컨텐츠 -->
	<div class="section-content">
		{#if isLoading}
			<div class="loading-state">
				<p>{m.loadingGeneric()}</p>
			</div>
		{:else if popularPosts.length === 0}
			<div class="empty-state">
				<p>{m.popularPostsEmpty()}</p>
			</div>
		{:else}
			<div class="posts-list">
				{#each popularPosts as post, index}
					<button type="button" class="post-item" onclick={() => goToPost(post.postId)}>
						<!-- 순위 배지 -->
						<div class="rank-badge {index < 3 ? 'rank-top' : ''}">
							{index + 1}
						</div>

						<!-- 게시글 정보 -->
						<div class="post-info">
							<div class="post-title">{post.title}</div>
							<div class="post-meta">
								<span class="author-name">{post.authorName}</span>
								<div class="post-stats">
									<div class="stat">
										<Heart size={12} />
										<span>{post.likeCount}</span>
									</div>
									<div class="stat">
										<MessageCircle size={12} />
										<span>{post.commentCount}</span>
									</div>
								</div>
							</div>
						</div>

						<!-- 점수 배지 -->
						<div class="score-badge">
							{post.score}
						</div>
					</button>
				{/each}
			</div>
		{/if}
	</div>
</div>

<style>
	@import 'tailwindcss' reference;

	/* 섹션 컨테이너 */
	.popular-posts-section {
		@apply rounded-xl bg-white/90 p-4 shadow-sm;
	}

	/* 헤더 영역 */
	.section-header {
		@apply mb-3 flex items-center justify-between;
	}

	.section-icon {
		@apply h-4 w-4 text-blue-500;
	}

	.section-title {
		@apply text-sm font-semibold text-gray-900;
	}

	/* 더보기 버튼 */
	.more-button {
		@apply flex items-center gap-0.5 rounded-lg px-2 py-1 text-xs font-medium text-gray-600 transition-all;
		@apply hover:bg-gray-100 hover:text-blue-600;
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

	.loading-state,
	.empty-state {
		@apply flex items-center justify-center py-8;
		@apply text-xs text-gray-500;
	}

	/* 게시글 목록 */
	.posts-list {
		@apply flex flex-col gap-2;
	}

	/* 게시글 아이템 */
	.post-item {
		@apply flex items-start gap-2 rounded-lg p-2.5 transition-all duration-200;
		@apply bg-gradient-to-br from-blue-50/30 to-white;
		@apply hover:from-blue-50 hover:shadow-sm;
		@apply cursor-pointer text-left w-full;
	}

	/* 순위 배지 */
	.rank-badge {
		@apply flex-shrink-0 flex items-center justify-center;
		@apply w-6 h-6 rounded-full;
		@apply bg-gray-100 text-gray-700 font-bold text-xs;
	}

	.rank-top {
		@apply bg-gradient-to-br from-yellow-400 to-orange-500;
		@apply text-white;
	}

	/* 게시글 정보 */
	.post-info {
		@apply flex-1 min-w-0;
	}

	.post-title {
		@apply text-xs font-medium text-gray-900 line-clamp-2 mb-1;
	}

	.post-meta {
		@apply flex items-center gap-2 text-[10px] text-gray-500;
	}

	.author-name {
		@apply truncate font-medium;
	}

	.post-stats {
		@apply flex items-center gap-1.5;
	}

	.stat {
		@apply flex items-center gap-0.5;
	}

	/* 점수 배지 */
	.score-badge {
		@apply flex-shrink-0 px-2 py-1 rounded-full;
		@apply bg-blue-100 text-blue-700 text-xs font-bold;
	}
</style>
