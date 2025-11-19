<!--
  게시판 목록 페이지

  /posts 노드의 게시글을 카테고리별로 필터링하여 표시합니다.
  - 상단에 카테고리 탭 (전체 + 11개 카테고리)
  - DatabaseListView를 사용한 무한 스크롤
  - createdAt 기준으로 역순 정렬
-->

<script lang="ts">
	import type { ForumCategory } from '../../../../shared/categories';
	import PostListView from '$lib/components/post/PostListView.svelte';
	import * as m from '$lib/paraglide/messages.js';
	import { Button } from '$lib/components/ui/button';
	import PostCreateDialog from '$lib/components/post/PostCreateDialog.svelte';
	import PostEditDialog from '$lib/components/post/PostEditDialog.svelte';
	import CategoryNavigation from '$lib/components/post/CategoryNavigation.svelte';
	import CommentCreateDialog from '$lib/components/comment/CommentCreateDialog.svelte';
	import { authStore } from '$lib/stores/auth.svelte';
	import { rtdb } from '$lib/firebase';
	import { ref, update } from 'firebase/database';
	import { createRealtimeStore } from '$lib/stores/database.svelte';
	import { toggleLikeTarget, type LikeTargetType } from '$lib/functions/like.functions';
	import { PenSquare } from 'lucide-svelte';

	// 카테고리 선택 상태 (null = 전체)
	let selectedCategory = $state<ForumCategory | null>(null);

	// 글쓰기 모달 상태
	let isCreateDialogOpen = $state(false);

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

	// PostListView 참조 (새로고침용)
	let postListViewRef = $state<PostListView>();

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
 * 좋아요 토글
 */
async function handleToggleLike(event: MouseEvent, targetId: string, targetType: LikeTargetType) {
	event.stopPropagation();

	if (!authStore.user) {
		alert('로그인이 필요합니다.');
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
	 * 게시글 작성 후 콜백
	 * 작성된 게시글의 카테고리를 자동으로 선택
	 */
	function handlePostCreated(category: ForumCategory) {
		selectedCategory = category;
	}

	/**
	 * 댓글 작성 모달 열기
	 */
	function handleOpenCommentDialog(
		postId: string,
		parentId: string | null = null,
		parentText: string | null = null
	) {
		selectedPostId = postId;
		selectedParentId = parentId;
		selectedParentText = parentText;
		isCommentDialogOpen = true;
	}

	/**
	 * 댓글 작성 완료 후 콜백
	 * 댓글 목록을 다시 로드하여 화면에 반영
	 */
	async function handleCommentCreated() {
		if (selectedPostId && postListViewRef) {
			await postListViewRef.refreshPostComments(selectedPostId);
		}
	}

	/**
	 * 게시글 수정 모달 열기
	 */
	function handleOpenEditDialog(
		postId: string,
		text: string,
		urls: Record<number, string> | undefined,
		roomId: string
	) {
		editingPostId = postId;
		editingPostText = text || '';
		editingPostUrls = urls || {};
		editingPostRoomId = roomId;
		isEditDialogOpen = true;
	}

	/**
	 * 게시글 수정 완료 후 콜백
	 */
	function handlePostEdited() {
		// PostListView 새로고침
		postListViewRef?.refresh();
	}

	/**
	 * 게시글 삭제 함수
	 */
	async function handleDeletePost(postId: string) {
		if (!confirm('게시글을 삭제하시겠습니까?')) {
			return;
		}

		if (!rtdb) {
			alert('Firebase 연결이 없습니다.');
			return;
		}

		try {
			const postRef = ref(rtdb, `posts/${postId}`);
			await update(postRef, {
				text: null,
				urls: null,
				deleted: true,
				deletedAt: Date.now()
			});

			// PostListView 새로고침
			postListViewRef?.refresh();
		} catch (error) {
			console.error('게시글 삭제 실패:', error);
			alert('게시글 삭제에 실패했습니다.');
		}
	}
</script>

<svelte:head>
	<title>{m.chatCategoryLabel()} - Sonub</title>
</svelte:head>

<div class="post-list-container">
	<!-- 헤더 -->
	<div class="post-list-header">
		<h1 class="post-list-title">{m.chatCategoryLabel()}</h1>
		<Button onclick={() => (isCreateDialogOpen = true)}>
			<PenSquare class="h-4 w-4" />
			글쓰기
		</Button>
	</div>

	<!-- 카테고리 텍스트 네비게이션 -->
	<div class="mb-6 flex">
		<CategoryNavigation
			{selectedCategory}
			on:change={(event) => (selectedCategory = event.detail.category)}
		/>
	</div>

	<!-- 게시글 목록 -->
	<div class="post-list-content">
		<PostListView
			bind:this={postListViewRef}
			path="posts"
			pageSize={20}
			orderBy="createdAt"
			reverse={true}
			threshold={300}
			category={selectedCategory}
			{userLikes}
			onToggleLike={handleToggleLike}
			onOpenCommentDialog={handleOpenCommentDialog}
			onEdit={handleOpenEditDialog}
			onDelete={handleDeletePost}
			editMode="dialog"
		/>
	</div>
</div>

<!-- 글쓰기 모달 -->
<PostCreateDialog
	bind:open={isCreateDialogOpen}
	onPostCreated={handlePostCreated}
	defaultCategory={selectedCategory}
/>

<!-- 글 수정 모달 -->
<PostEditDialog
	bind:open={isEditDialogOpen}
	postId={editingPostId}
	initialText={editingPostText}
	initialUrls={editingPostUrls}
	roomId={editingPostRoomId}
	onClose={() => (isEditDialogOpen = false)}
	onSaved={handlePostEdited}
/>

<!-- 댓글 작성 모달 -->
<CommentCreateDialog
	bind:open={isCommentDialogOpen}
	messageId={selectedPostId}
	parentId={selectedParentId}
	parentText={selectedParentText}
	onCreated={handleCommentCreated}
/>

<style>
	@import 'tailwindcss' reference;

	.post-list-container {
		@apply mx-auto max-w-4xl p-4;
	}

	.post-list-header {
		@apply mb-6 flex items-center justify-between;
	}

	.post-list-title {
		@apply text-2xl font-bold text-gray-900;
	}

	.post-list-content {
		@apply space-y-4;
	}
</style>
