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
	import type { ForumCategory } from '../../shared/categories';
	import PostListView from '$lib/components/post/PostListView.svelte';
	import * as m from '$lib/paraglide/messages.js';
	import PostCreateDialog from '$lib/components/post/PostCreateDialog.svelte';
	import CategoryNavigation from '$lib/components/post/CategoryNavigation.svelte';
	import CommentCreateDialog from '$lib/components/comment/CommentCreateDialog.svelte';
	import Avatar from '$lib/components/user/avatar.svelte';
	import { Camera, Image as ImageIcon, Video, Smile } from 'lucide-svelte';
	import { authStore } from '$lib/stores/auth.svelte';
	import { rtdb } from '$lib/firebase';
	import { ref, update } from 'firebase/database';
	import FeedList from '$lib/components/friend/feed-list.svelte';
	import { createRealtimeStore } from '$lib/stores/database.svelte';
	import { toggleLikeTarget, type LikeTargetType } from '$lib/functions/like.functions';

	// 탭 선택 상태 ('feed' | 'all')
	type TabType = 'feed' | 'all';
	let selectedTab = $state<TabType>('feed');

	// 카테고리 선택 상태 (null = 전체)
	let selectedCategory = $state<ForumCategory | null>(null);

	// PostListView 참조 (새로고침용)
	let postListViewRef = $state<PostListView>();

	// 글쓰기 모달 상태
	let isCreateDialogOpen = $state(false);

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
	<title>Sonub - 홈</title>
</svelte:head>

<div class="post-list-container">
	<!-- 글쓰기 유도 폼 (가짜 입력 폼) - 최상단으로 이동 -->
	{#if authStore.user}
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
			<!-- 왼쪽: 사용자 프로필 사진 -->
			<Avatar uid={authStore.user.uid} size={48} />

			<!-- 중간: 가짜 입력창 -->
			<div class="compose-input-fake">
				{m.composePromptPlaceholder({ name: authStore.user.displayName || m.commonUser() })}
			</div>

			<!-- 오른쪽: 아이콘 버튼들 -->
			<div class="compose-actions">
				<div class="hidden items-center gap-2 sm:flex">
					<span class="compose-icon-button" aria-hidden="true">
						<Video class="compose-icon" />
					</span>
					<span class="compose-icon-button" aria-hidden="true">
						<ImageIcon class="compose-icon" />
					</span>
					<span class="compose-icon-button" aria-hidden="true">
						<Smile class="compose-icon" />
					</span>
				</div>
				<div class="flex items-center sm:hidden">
					<span class="compose-icon-button" aria-hidden="true">
						<Camera class="compose-icon" />
					</span>
				</div>
			</div>
		</div>
	{:else}
		<!-- 비로그인 상태일 때도 가짜 글쓰기 폼 표시 -->
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
			<!-- 왼쪽: 기본 프로필 아이콘 -->
			<div class="default-avatar">
				<svg class="h-12 w-12 text-gray-400" fill="currentColor" viewBox="0 0 24 24">
					<path
						d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z"
					/>
				</svg>
			</div>

			<!-- 중간: 가짜 입력창 -->
			<div class="compose-input-fake">
				{m.composePromptPlaceholder({ name: m.commonUser() })}
			</div>

			<!-- 오른쪽: 아이콘 버튼들 -->
			<div class="compose-actions">
				<div class="hidden items-center gap-2 sm:flex">
					<span class="compose-icon-button" aria-hidden="true">
						<Video class="compose-icon" />
					</span>
					<span class="compose-icon-button" aria-hidden="true">
						<ImageIcon class="compose-icon" />
					</span>
					<span class="compose-icon-button" aria-hidden="true">
						<Smile class="compose-icon" />
					</span>
				</div>
				<div class="flex items-center sm:hidden">
					<span class="compose-icon-button" aria-hidden="true">
						<Camera class="compose-icon" />
					</span>
				</div>
			</div>
		</div>
	{/if}

	<!-- 피드 / 전체 탭 -->
	<div class="tab-navigation">
		<button
			class="tab-button"
			class:tab-active={selectedTab === 'feed'}
			onclick={() => {
				selectedTab = 'feed';
			}}
		>
			팔로잉 피드
		</button>
		<button
			class="tab-button"
			class:tab-active={selectedTab === 'all'}
			onclick={() => {
				selectedTab = 'all';
			}}
		>
			{m.composeAll()}
		</button>
	</div>

	<!-- 피드 탭 선택 시 FeedList 표시 -->
	{#if selectedTab === 'feed'}
		<div class="post-list-content">
			<FeedList
				pageSize={20}
				{userLikes}
				onToggleLike={handleToggleLike}
				onOpenCommentDialog={handleOpenCommentDialog}
				onDelete={handleDeletePost}
			/>
		</div>
	{:else}
		<!-- 전체 탭 선택 시 카테고리 네비게이션 + DatabaseListView 표시 -->
		<!-- 카테고리 텍스트 네비게이션 -->
		<div class="mb-4 flex">
			<CategoryNavigation
				{selectedCategory}
				showCreateButton={true}
				on:change={(event) => (selectedCategory = event.detail.category)}
				on:create={(event) => {
					selectedCategory = event.detail.category;
					isCreateDialogOpen = true;
				}}
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
				onDelete={handleDeletePost}
				editMode="navigate"
			/>
		</div>
	{/if}
</div>

<!-- 글쓰기 모달 -->
<PostCreateDialog
	bind:open={isCreateDialogOpen}
	defaultCategory={selectedCategory}
	onPostCreated={handlePostCreated}
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

	/* 피드 / 전체 탭 네비게이션 */
	.tab-navigation {
		@apply mb-6 flex border-b border-gray-200;
	}

	.tab-button {
		@apply flex-1 border-b-2 border-transparent px-4 py-3 text-center text-sm font-medium text-gray-600;
		@apply transition-all duration-200;
		@apply hover:text-blue-600;
	}

	.tab-active {
		@apply border-blue-600 text-blue-600;
	}

	/* 글쓰기 유도 폼 (가짜 입력 폼) */
	.compose-prompt {
		@apply mb-6 -mx-4 flex w-full items-center gap-3 rounded-none border-0 bg-transparent p-4 shadow-none;
		@apply cursor-pointer transition-all;
		@apply sm:mx-0 sm:rounded-lg sm:border sm:border-gray-200 sm:bg-white sm:p-4 sm:shadow-sm sm:hover:border-blue-300 sm:hover:shadow-md;
	}

	.compose-input-fake {
		@apply flex-1 rounded-full bg-gray-100 px-4 py-3 text-gray-500;
		@apply transition-colors hover:bg-gray-200;
	}

	.compose-actions {
		@apply flex items-center gap-2;
	}

	.compose-icon-button {
		@apply flex h-10 w-10 cursor-pointer items-center justify-center rounded-full text-2xl;
		@apply transition-all hover:bg-gray-100;
	}

	.compose-icon {
		@apply h-5 w-5 text-gray-600;
	}

	/* 기본 아바타 (비로그인 사용자용) */
	.default-avatar {
		@apply flex h-12 w-12 items-center justify-center rounded-full bg-gray-200;
	}

	.post-list-content {
		@apply space-y-4;
	}
</style>
