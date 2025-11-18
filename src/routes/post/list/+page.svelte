<!--
  게시판 목록 페이지

  채팅 메시지 중 카테고리가 있는 메시지를 게시판 글로 표시합니다.
  - 상단에 카테고리 탭 (전체 + 10개 카테고리)
  - DatabaseListView를 사용한 무한 스크롤
  - allCategoryOrder 또는 categoryOrder 기준으로 역순 정렬
-->

<script lang="ts">
	import type { ForumCategory } from '../../../../shared/categories';
	import DatabaseListView from '$lib/components/DatabaseListView.svelte';
	import * as m from '$lib/paraglide/messages.js';
	import { Button } from '$lib/components/ui/button';
	import PostCreateDialog from '$lib/components/post/PostCreateDialog.svelte';
	import PostEditDialog from '$lib/components/post/PostEditDialog.svelte';
	import CategoryNavigation from '$lib/components/post/CategoryNavigation.svelte';
	import CommentCreateDialog from '$lib/components/comment/CommentCreateDialog.svelte';
	import PostItem from '$lib/components/post/PostItem.svelte';
	import { authStore } from '$lib/stores/auth.svelte';
	import { rtdb } from '$lib/firebase';
	import { ref, update } from 'firebase/database';
	import { createRealtimeStore } from '$lib/stores/database.svelte';
	import { toggleLikeTarget, type LikeTargetType } from '$lib/functions/like.functions';

	// 카테고리 선택 상태 (null = 전체)
	let selectedCategory = $state<ForumCategory | null>(null);

	// 글쓰기 모달 상태
	let isCreateDialogOpen = $state(false);

	// 글 수정 모달 상태
	let isEditDialogOpen = $state(false);
	let editingMessageId = $state<string>('');
	let editingMessageText = $state<string>('');
	let editingMessageUrls = $state<Record<number, string>>({});
	let editingMessageRoomId = $state<string>('');

	// 댓글 모달 상태
	let isCommentDialogOpen = $state(false);
	let selectedMessageId = $state<string>('');
	let selectedParentId = $state<string | null>(null);
	let selectedParentText = $state<string | null>(null);

	// 각 게시글의 PostItem 컴포넌트 참조 저장 (messageId -> PostItem)
	let postItemRefs = $state<Record<string, PostItem>>({});

// DatabaseListView 참조 (새로고침용)
let listViewRef = $state<DatabaseListView>();

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
		messageId: string,
		parentId: string | null = null,
		parentText: string | null = null
	) {
		selectedMessageId = messageId;
		selectedParentId = parentId;
		selectedParentText = parentText;
		isCommentDialogOpen = true;
	}

	/**
	 * 댓글 작성 완료 후 콜백
	 * 댓글 목록을 다시 로드하여 화면에 반영
	 */
	async function handleCommentCreated() {
		if (selectedMessageId && postItemRefs[selectedMessageId]) {
			await postItemRefs[selectedMessageId].refreshComments();
		}
	}

	/**
	 * 게시글 수정 모달 열기
	 */
	function handleOpenEditDialog(
		messageId: string,
		text: string,
		urls: Record<number, string> | undefined,
		roomId: string
	) {
		editingMessageId = messageId;
		editingMessageText = text || '';
		editingMessageUrls = urls || {};
		editingMessageRoomId = roomId;
		isEditDialogOpen = true;
	}

	/**
	 * 게시글 수정 완료 후 콜백
	 */
	function handlePostEdited() {
		// DatabaseListView 새로고침
		listViewRef?.refresh();
	}

	/**
	 * 게시글 삭제 함수
	 */
	async function handleDeletePost(messageId: string) {
		if (!confirm('게시글을 삭제하시겠습니까?')) {
			return;
		}

		if (!rtdb) {
			alert('Firebase 연결이 없습니다.');
			return;
		}

		try {
			const messageRef = ref(rtdb, `chat-messages/${messageId}`);
			await update(messageRef, {
				text: null,
				urls: null,
				deleted: true,
				deletedAt: Date.now()
			});

			// DatabaseListView 새로고침
			listViewRef?.refresh();
		} catch (error) {
			console.error('게시글 삭제 실패:', error);
			alert('게시글 삭제에 실패했습니다.');
		}
	}


	// DatabaseListView props 계산
	const orderByField = $derived(selectedCategory ? 'categoryOrder' : 'allCategoryOrder');
	const orderPrefixValue = $derived(selectedCategory ? `${selectedCategory}-` : '');
</script>

<svelte:head>
	<title>{m.chatCategoryLabel()} - Sonub</title>
</svelte:head>

<div class="post-list-container">
	<!-- 헤더 -->
	<div class="post-list-header">
		<h1 class="post-list-title">{m.chatCategoryLabel()}</h1>
		<Button onclick={() => (isCreateDialogOpen = true)}>글쓰기</Button>
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
		<DatabaseListView
			bind:this={listViewRef}
			path="chat-messages"
			pageSize={20}
			orderBy={orderByField}
			orderPrefix={orderPrefixValue}
			reverse={true}
			threshold={300}
		>
			{#snippet item(itemData, index)}
				{@const message = itemData.data}
				{@const messageId = itemData.key}
				<PostItem
					bind:this={postItemRefs[messageId]}
					{message}
					{messageId}
					{userLikes}
					onToggleLike={handleToggleLike}
					onOpenCommentDialog={handleOpenCommentDialog}
					onEdit={handleOpenEditDialog}
					onDelete={handleDeletePost}
					editMode="dialog"
				/>
			{/snippet}

			{#snippet loading()}
				<div class="list-status">
					<p>로딩 중...</p>
				</div>
			{/snippet}

			{#snippet empty()}
				<div class="list-status">
					<p>게시글이 없습니다.</p>
				</div>
			{/snippet}

			{#snippet loadingMore()}
				<div class="list-status">
					<p>더 불러오는 중...</p>
				</div>
			{/snippet}

			{#snippet noMore()}
				<div class="list-status">
					<p>모든 게시글을 불러왔습니다.</p>
				</div>
			{/snippet}
		</DatabaseListView>
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
	messageId={editingMessageId}
	initialText={editingMessageText}
	initialUrls={editingMessageUrls}
	roomId={editingMessageRoomId}
	onClose={() => (isEditDialogOpen = false)}
	onSaved={handlePostEdited}
/>

<!-- 댓글 작성 모달 -->
<CommentCreateDialog
	bind:open={isCommentDialogOpen}
	messageId={selectedMessageId}
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

	.list-status {
		@apply py-8 text-center text-gray-500;
	}
</style>
