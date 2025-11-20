<!--
  홈 페이지

  최근 등록된 게시글을 표시합니다.
  - 게시글 경로: /posts/{postId}
  - 최근 글 = createdAt을 역순으로 정렬한 것
  - 상단에 카테고리 탭 (전체 + 11개 카테고리)
  - PostListView를 사용한 무한 스크롤
  - 상단에 글쓰기 유도 폼 표시
-->

<script lang="ts">
	import * as m from '$lib/paraglide/messages.js';
	import PostCreateDialog from '$lib/components/post/PostCreateDialog.svelte';
	import PostEditDialog from '$lib/components/post/PostEditDialog.svelte';
	import CommentCreateDialog from '$lib/components/comment/CommentCreateDialog.svelte';
	import Avatar from '$lib/components/user/avatar.svelte';
	import { Camera } from 'lucide-svelte';
	import { authStore } from '$lib/stores/auth.svelte';
	import { rtdb } from '$lib/firebase';
	import { ref, update } from 'firebase/database';
	import FeedList from '$lib/components/friend/feed-list.svelte';
	import PostListView from '$lib/components/post/PostListView.svelte';
	import { createRealtimeStore } from '$lib/stores/database.svelte';
	import { toggleLikeTarget, type LikeTargetType } from '$lib/functions/like.functions';

	// 글쓰기 모달 상태
	let isCreateDialogOpen = $state(false);

	// 수정 모달 상태
	let isEditDialogOpen = $state(false);
	let editPostId = $state<string>('');
	let editPostText = $state<string>('');
	let editPostUrls = $state<Record<number, string>>({});
	let editRoomId = $state<string>('');

	// 댓글 모달 상태
	let isCommentDialogOpen = $state(false);
	let selectedPostId = $state<string>('');
	let selectedParentId = $state<string | null>(null);
	let selectedParentText = $state<string | null>(null);

	// 좋아요 상태
	type UserLikesMap = Record<string, LikeTargetType>;
	let userLikes = $state<UserLikesMap>({});
	const pendingLikeTargets = new Set<string>();

	/**
	 * 현재 사용자 좋아요 목록 구독
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

	const isAuthenticated = $derived(Boolean(authStore.user));
	let composePlaceholder = $state('');
	$effect(() => {
		const baseName =
			authStore.user && authStore.user.displayName
				? authStore.user.displayName
				: m.commonUser();
		composePlaceholder = m.composePromptPlaceholder({ name: baseName });
	});

/**
 * 좋아요 토글
 */
async function handleToggleLike(event: MouseEvent, targetId: string, targetType: LikeTargetType) {
	event.stopPropagation();

	if (!authStore.user) {
		alert(m.authLoginRequired());
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
	 * 게시글 수정 함수
	 */
	function handleEdit(
		postId: string,
		text: string,
		urls: Record<number, string>,
		roomId: string
	) {
		editPostId = postId;
		editPostText = text;
		editPostUrls = urls;
		editRoomId = roomId;
		isEditDialogOpen = true;
	}

	/**
	 * 게시글 삭제 함수
	 */
async function handleDeletePost(postId: string) {
	if (!confirm(m.postDeleteConfirm())) {
		return;
	}

	if (!rtdb) {
		alert(m.firebaseNotReady());
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
	} catch (error) {
		console.error('게시글 삭제 실패:', error);
		alert(m.postDeleteFailed());
	}
}
</script>

<svelte:head>
	<title>Sonub - {m.navHome()}</title>
</svelte:head>

	<div class="post-list-container">
		<!-- 글쓰기 유도 폼 (가짜 입력 폼) - 최상단으로 이동 -->
		<div class="compose-wrapper">
			<div
				class="compose-prompt"
				onclick={() => (isCreateDialogOpen = true)}
				role="button"
				tabindex="0"
				onkeydown={(e) => {
					if (e.key === 'Enter' || e.key === ' ') {
						isCreateDialogOpen = true;
					}
				}}
			>
				<div class="compose-avatar-wrapper" aria-hidden="true">
					{#if isAuthenticated && authStore.user?.uid}
						<Avatar uid={authStore.user.uid} size={42} />
					{:else}
						<div class="default-avatar">
							<svg class="h-10 w-10 text-gray-400" fill="currentColor" viewBox="0 0 24 24">
								<path
									d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z"
								/>
							</svg>
						</div>
					{/if}
				</div>

				<div class="compose-input-area">
					<div class="compose-input-fake">
						{composePlaceholder}
					</div>
				</div>

				<button class="compose-icon-circle" type="button" aria-label={m.commonAddPhoto()}>
					<Camera class="compose-icon" />
				</button>
			</div>

		</div>

	<!-- 피드 또는 글 목록 표시 -->
	<div class="post-list-content">
		<FeedList
			pageSize={20}
			{userLikes}
			onToggleLike={handleToggleLike}
			onOpenCommentDialog={handleOpenCommentDialog}
			onEdit={handleEdit}
			onDelete={handleDeletePost}
		>
			{#snippet fallback()}
				<!-- 로그인하지 않았거나 피드가 없을 때 글 목록 표시 -->
				<PostListView
					path="posts"
					pageSize={20}
					{userLikes}
					onToggleLike={handleToggleLike}
					onOpenCommentDialog={handleOpenCommentDialog}
					onEdit={handleEdit}
					onDelete={handleDeletePost}
					editMode="dialog"
				/>
			{/snippet}
		</FeedList>
	</div>
</div>

<!-- 글쓰기 모달 -->
<PostCreateDialog
	bind:open={isCreateDialogOpen}
/>

<!-- 게시글 수정 모달 -->
<PostEditDialog
	bind:open={isEditDialogOpen}
	postId={editPostId}
	initialText={editPostText}
	initialUrls={editPostUrls}
	roomId={editRoomId}
	onClose={() => (isEditDialogOpen = false)}
/>

<!-- 댓글 작성 모달 -->
<CommentCreateDialog
	bind:open={isCommentDialogOpen}
	messageId={selectedPostId}
	parentId={selectedParentId}
	parentText={selectedParentText}
/>

<style>
	@import 'tailwindcss' reference;

	.post-list-container {
		@apply mx-auto max-w-4xl md:p-4;
	}

	.compose-wrapper {
		@apply mb-6;
	}

	/* 글쓰기 유도 폼 (가짜 입력 폼) */
	.compose-prompt {
		@apply flex w-full items-center gap-3 rounded-full bg-transparent px-2 py-1;
		@apply cursor-pointer transition-all hover:bg-gray-50;
	}

	.compose-avatar-wrapper {
		@apply shrink-0;
	}

	.compose-input-area {
		@apply flex-1;
	}

	.compose-input-fake {
		@apply rounded-full bg-gray-100 px-4 py-2 text-sm text-gray-600;
		@apply transition-colors hover:bg-gray-200;
	}

	.compose-icon-circle {
		@apply flex h-10 w-10 items-center justify-center rounded-full bg-white text-gray-500 shadow;
		@apply transition-all hover:bg-gray-100 focus:outline-none;
	}

	.compose-icon {
		@apply h-5 w-5 text-gray-600;
	}

	/* 기본 아바타 (비로그인 사용자용) */
	.default-avatar {
		@apply flex h-10 w-10 items-center justify-center rounded-full bg-gray-200;
	}

	.post-list-content {
		@apply space-y-4;
	}
</style>
