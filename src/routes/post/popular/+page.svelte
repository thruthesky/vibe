<!--
  인기 게시글 페이지

  일별/주별/월별 인기 게시글을 상위 100개까지 표시합니다.
  - 상단에 기간 탭 (일간/주간/월간)
  - 인기 점수 기준 (좋아요 1점 + 댓글 2점)
  - createdAt 역순 정렬
-->

<script lang="ts">
	import { getPopularPosts } from '$lib/functions/post.functions';
	import { createRealtimeStore } from '$lib/stores/database.svelte';
	import { authStore } from '$lib/stores/auth.svelte';
	import { toggleLikeTarget, type LikeTargetType } from '$lib/functions/like.functions';
	import * as m from '$lib/paraglide/messages.js';
	import { Button } from '$lib/components/ui/button';
	import PopularPostItem from '$lib/components/post/PopularPostItem.svelte';
	import PostEditDialog from '$lib/components/post/PostEditDialog.svelte';
	import CommentCreateDialog from '$lib/components/comment/CommentCreateDialog.svelte';
	import { TrendingUp, Calendar, CalendarDays } from 'lucide-svelte';
	import { ref, remove } from 'firebase/database';
	import { rtdb } from '$lib/firebase';

	type Period = 'daily' | 'weekly' | 'monthly';

	// 기간 선택 상태
	let activePeriod = $state<Period>('daily');

	// 인기 게시글 데이터
	let popularPosts = $state<Array<{ postId: string; score: number }>>([]);
	let isLoading = $state(false);

	// 글 수정 모달 상태
	let isEditDialogOpen = $state(false);
	let editingPostId = $state<string>('');
	let editingPostText = $state<string>('');
	let editingPostUrls = $state<Record<number, string>>({});
	let editingPostRoomId = $state<string>('');

	// 댓글 모달 상태
	let isCommentDialogOpen = $state(false);
	let selectedPostId = $state<string>('');
	let selectedParentId = $state<string | null>(null);
	let selectedParentText = $state<string | null>(null);

	// 좋아요 상태 (로그인 사용자 기준)
	type UserLikesMap = Record<string, LikeTargetType>;
	let userLikes = $state<UserLikesMap>({});
	const pendingLikeTargets = new Set<string>();

	/**
	 * 현재 로그인한 사용자의 좋아요 목록을 구독합니다.
	 */
	$effect(() => {
		const uid = authStore.user?.uid;

		if (!uid) {
			userLikes = {};
			return;
		}

		const store = createRealtimeStore<UserLikesMap>(`likes/${uid}`, {});

		const unsubscribe = store.subscribe((state) => {
			userLikes = state.data ?? {};
		});

		return () => {
			unsubscribe();
			store.unsubscribe();
		};
	});

	/**
	 * 인기 게시글 데이터 로드
	 */
	async function loadPopularPosts(period: Period) {
		isLoading = true;
		try {
			popularPosts = await getPopularPosts(period, 100);
		} catch (error) {
			console.error('인기 게시글 로드 실패:', error);
		} finally {
			isLoading = false;
		}
	}

	/**
	 * 기간 변경 시 자동으로 데이터 로드
	 */
	$effect(() => {
		// activePeriod가 변경될 때만 실행되도록 명시적으로 의존성 설정
		const period = activePeriod;
		void loadPopularPosts(period);
	});

	/**
	 * 좋아요 토글
	 */
	async function handleToggleLike(event: MouseEvent, targetId: string, targetType: LikeTargetType) {
		event.stopPropagation();

		if (!authStore.user) {
			alert(m.authSignInRequired());
			return;
		}

		if (pendingLikeTargets.has(targetId)) {
			return;
		}

		pendingLikeTargets.add(targetId);
		const result = await toggleLikeTarget({
			uid: authStore.user.uid,
			targetId,
			targetType
		});
		pendingLikeTargets.delete(targetId);

		if (!result.success && result.error) {
			alert(result.error);
		}
	}

	/**
	 * 게시글 수정 핸들러
	 */
	function handleEditPost(postId: string, text: string, urls: Record<number, string>, roomId: string) {
		editingPostId = postId;
		editingPostText = text;
		editingPostUrls = urls;
		editingPostRoomId = roomId;
		isEditDialogOpen = true;
	}

	/**
	 * 댓글 작성 핸들러
	 */
	function handleCreateComment(
		postId: string,
		parentId: string | null | undefined,
		parentText: string | null | undefined
	) {
		selectedPostId = postId;
		selectedParentId = parentId ?? null;
		selectedParentText = parentText ?? null;
		isCommentDialogOpen = true;
	}

	/**
	 * 댓글 작성 완료 핸들러
	 */
	function handleCommentCreated() {
		isCommentDialogOpen = false;
		selectedPostId = '';
		selectedParentId = null;
		selectedParentText = null;
	}

	/**
	 * 게시글 삭제 핸들러
	 */
	async function handleDeletePost(postId: string) {
		if (!authStore.user) {
			alert(m.authSignInRequired());
			return;
		}

		if (!confirm('정말 삭제하시겠습니까?')) {
			return;
		}

		if (!rtdb) {
			alert('데이터베이스 연결이 없습니다.');
			return;
		}

		try {
			const postRef = ref(rtdb, `chat-messages/${postId}`);
			await remove(postRef);
			// 목록에서 제거
			popularPosts = popularPosts.filter((post) => post.postId !== postId);
		} catch (error) {
			console.error('게시글 삭제 실패:', error);
			alert('게시글 삭제에 실패했습니다.');
		}
	}
</script>

<svelte:head>
	<title>{m.popularPostsTitle()} - Sonub</title>
</svelte:head>

<div class="popular-posts-page">
	<!-- 헤더 -->
	<div class="page-header">
		<div class="header-content">
			<TrendingUp class="header-icon" />
			<h1 class="page-title">{m.popularPostsTitle()}</h1>
		</div>
		<p class="page-description">{m.popularPostsDescription()}</p>
	</div>

	<!-- 기간 탭 -->
	<div class="period-tabs">
		<Button
			class="tab-button {activePeriod === 'daily' ? 'tab-active' : ''}"
			variant="ghost"
			onclick={() => (activePeriod = 'daily')}
		>
			<Calendar class="tab-icon" />
			{m.popularPostsDaily()}
		</Button>
		<Button
			class="tab-button {activePeriod === 'weekly' ? 'tab-active' : ''}"
			variant="ghost"
			onclick={() => (activePeriod = 'weekly')}
		>
			<CalendarDays class="tab-icon" />
			{m.popularPostsWeekly()}
		</Button>
		<Button
			class="tab-button {activePeriod === 'monthly' ? 'tab-active' : ''}"
			variant="ghost"
			onclick={() => (activePeriod = 'monthly')}
		>
			<CalendarDays class="tab-icon" />
			{m.popularPostsMonthly()}
		</Button>
	</div>

	<!-- 게시글 목록 -->
	<div class="posts-container">
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
				{#each popularPosts as { postId, score }, index (postId)}
					<PopularPostItem
						{postId}
						{score}
						{index}
						{userLikes}
						onToggleLike={(e, id, type) => handleToggleLike(e, id, type)}
						onOpenCommentDialog={(id, parentId, parentText) =>
							handleCreateComment(id, parentId, parentText)}
						onEdit={(id, text, urls, roomId) => handleEditPost(id, text, urls, roomId)}
						onDelete={(id) => handleDeletePost(id)}
					/>
				{/each}
			</div>
		{/if}
	</div>
</div>

<!-- 게시글 수정 모달 -->
<PostEditDialog
	bind:open={isEditDialogOpen}
	postId={editingPostId}
	initialText={editingPostText}
	initialUrls={editingPostUrls}
	roomId={editingPostRoomId}
	onClose={() => (isEditDialogOpen = false)}
/>

<!-- 댓글 작성 모달 -->
<CommentCreateDialog
	bind:open={isCommentDialogOpen}
	messageId={selectedPostId}
	parentId={selectedParentId}
	parentText={selectedParentText}
	onClose={handleCommentCreated}
	onCreated={handleCommentCreated}
/>

<style>
	@import 'tailwindcss' reference;

	:global(.popular-posts-page) {
		@apply w-full py-6 px-4;
	}

	:global(.page-header) {
		@apply mb-6;
	}

	:global(.header-content) {
		@apply flex items-center gap-3 mb-2;
	}

	:global(.header-icon) {
		@apply w-8 h-8 text-blue-600;
	}

	:global(.page-title) {
		@apply text-3xl font-bold text-gray-900;
	}

	:global(.page-description) {
		@apply text-sm text-gray-600;
	}

	:global(.period-tabs) {
		@apply flex gap-2 mb-6 border-b border-gray-200;
	}

	:global(.tab-button) {
		@apply flex items-center gap-2 px-4 py-2 text-base font-medium text-gray-600;
		@apply transition-colors duration-200 hover:text-gray-900;
		@apply border-b-2 border-transparent;
	}

	:global(.tab-active) {
		@apply text-blue-600 border-b-2 border-blue-600;
	}

	:global(.tab-icon) {
		@apply w-4 h-4;
	}

	:global(.posts-container) {
		@apply w-full;
	}

	:global(.loading-state),
	:global(.empty-state) {
		@apply flex items-center justify-center py-12;
		@apply text-gray-500 text-base;
	}

	:global(.posts-list) {
		@apply flex flex-col gap-4;
	}
</style>
