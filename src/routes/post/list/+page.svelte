<!--
  게시판 목록 페이지

  채팅 메시지 중 카테고리가 있는 메시지를 게시판 글로 표시합니다.
  - 상단에 카테고리 탭 (전체 + 10개 카테고리)
  - DatabaseListView를 사용한 무한 스크롤
  - allCategoryOrder 또는 categoryOrder 기준으로 역순 정렬
-->

<script lang="ts">
	import { FORUM_CATEGORIES, type ForumCategory } from '../../../../shared/categories';
	import DatabaseListView from '$lib/components/DatabaseListView.svelte';
	import * as m from '$lib/paraglide/messages.js';
	import { formatDistanceToNow } from 'date-fns';
	import { ko, enUS, ja, zhCN } from 'date-fns/locale';
	import { getLocale } from '$lib/paraglide/runtime.js';
	import { goto } from '$app/navigation';
	import { Button } from '$lib/components/ui/button';
	import PostCreateDialog from '$lib/components/post/PostCreateDialog.svelte';
	import PostEditDialog from '$lib/components/post/PostEditDialog.svelte';
	import CommentCreateDialog from '$lib/components/comment/CommentCreateDialog.svelte';
	import PostCommentList from '$lib/components/post/PostCommentList.svelte';
	import UserProfile from '$lib/components/UserProfile.svelte';
	import FileAttachments from '$lib/components/FileAttachments.svelte';
	import { authStore } from '$lib/stores/auth.svelte';
	import { rtdb } from '$lib/firebase';
	import { ref, update } from 'firebase/database';

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

	// 각 게시글의 댓글 컴포넌트 참조 저장 (messageId -> PostCommentList)
	let commentListRefs = $state<Record<string, PostCommentList>>({});

	// DatabaseListView 참조 (새로고침용)
	let listViewRef = $state<DatabaseListView>();

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
		if (selectedMessageId && commentListRefs[selectedMessageId]) {
			await commentListRefs[selectedMessageId].refresh();
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

	// date-fns 로케일 매핑
	const getDateLocale = () => {
		switch (getLocale()) {
			case 'ko':
				return ko;
			case 'ja':
				return ja;
			case 'zh':
				return zhCN;
			default:
				return enUS;
		}
	};

	// 카테고리 이름을 i18n 메시지 함수로 변환
	const getCategoryMessage = (category: ForumCategory) => {
		const categoryMap: Record<ForumCategory, () => string> = {
			discussion: m.chatCategoryFreeDiscussion,
			qna: m.chatCategoryQna,
			news: m.chatCategoryNews,
			info: m.chatCategoryInformation,
			selling: m.chatCategoryForSale,
			hiring: m.chatCategoryJobs,
			travel: m.chatCategoryTravel,
			mukbang: m.chatCategoryFood,
			realestate: m.chatCategoryRealEstate,
			hobby: m.chatCategoryHobby
		};
		return categoryMap[category]();
	};

	// 메시지 클릭 시 채팅방으로 이동
	const handleMessageClick = (roomId: string) => {
		goto(`/chat/room?roomId=${roomId}`);
	};

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

	<!-- 카테고리 탭 (Chip 형태) -->
	<div class="category-tabs">
		<button
			class="category-chip"
			class:active={selectedCategory === null}
			onclick={() => (selectedCategory = null)}
		>
			전체
		</button>
		{#each FORUM_CATEGORIES as category}
			<button
				class="category-chip"
				class:active={selectedCategory === category}
				onclick={() => (selectedCategory = category)}
			>
				{getCategoryMessage(category)}
			</button>
		{/each}
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
				{@const isMyPost = authStore.user?.uid === message.senderUid}
				<div class="post-card-wrapper">
					<!-- 삭제된 게시글 표시 -->
					{#if message.deleted}
						<div class="post-card post-deleted">
							<p class="post-deleted-text">삭제된 글입니다.</p>
						</div>
					{:else}
						<div class="post-card" onclick={() => handleMessageClick(message.roomId)}>
							<!-- 카테고리 뱃지 -->
							{#if message.category}
								<div class="post-category-badge">
									{getCategoryMessage(message.category)}
								</div>
							{/if}

							<!-- 메시지 내용 -->
							<div class="post-content">
								<p class="post-text">
									{message.text || '(내용 없음)'}
								</p>

								<!-- 첨부파일 미리보기 (FileAttachments 컴포넌트 사용) -->
								{#if message.urls}
									<FileAttachments urls={message.urls} />
								{/if}
							</div>

							<!-- 메타 정보 -->
							<div class="post-meta">
								<!-- 작성자 정보 (UserProfile 컴포넌트 사용) -->
								<UserProfile uid={message.senderUid} />

								<span class="post-time">
									{formatDistanceToNow(new Date(message.createdAt), {
										addSuffix: true,
										locale: getDateLocale()
									})}
								</span>
							</div>

							<!-- 수정/삭제 버튼 (작성자만 표시) -->
							{#if isMyPost}
								<div class="post-actions-buttons">
									<Button
										variant="ghost"
										size="sm"
										onclick={(e: MouseEvent) => {
											e.stopPropagation();
											handleOpenEditDialog(messageId, message.text, message.urls, message.roomId);
										}}
									>
										수정
									</Button>
									<Button
										variant="ghost"
										size="sm"
										onclick={(e: MouseEvent) => {
											e.stopPropagation();
											handleDeletePost(messageId);
										}}
									>
										삭제
									</Button>
								</div>
							{/if}
						</div>
					{/if}

					<!-- 댓글 목록 컴포넌트 -->
					<PostCommentList
						bind:this={commentListRefs[messageId]}
						messageId={messageId}
						totalChildCount={message.totalChildCount || 0}
						onOpenCommentDialog={handleOpenCommentDialog}
					/>
				</div>
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

	.category-tabs {
		@apply mb-6 flex flex-wrap gap-2;
	}

	.category-chip {
		@apply rounded-full border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700;
		@apply transition-all hover:border-blue-600 hover:bg-blue-600/5;
	}

	.category-chip.active {
		@apply border-blue-600 bg-blue-600 text-white;
		@apply hover:bg-blue-600/90;
	}

	.post-list-content {
		@apply space-y-4;
	}

	.post-card {
		@apply cursor-pointer rounded-lg border border-gray-200 bg-white p-4 shadow-sm;
		@apply transition-all hover:shadow-md;
	}

	.post-deleted {
		@apply cursor-default bg-gray-50;
	}

	.post-deleted-text {
		@apply py-2 text-center italic text-gray-400;
	}

	.post-actions-buttons {
		@apply mt-2 flex gap-2 border-t border-gray-100 pt-2;
	}

	.post-category-badge {
		@apply mb-2 inline-block rounded-full bg-blue-100 px-3 py-1 text-xs font-semibold text-blue-800;
	}

	.post-content {
		@apply mb-3;
	}

	.post-text {
		@apply mb-2 text-gray-800;
		display: -webkit-box;
		-webkit-line-clamp: 3;
		-webkit-box-orient: vertical;
		overflow: hidden;
		text-overflow: ellipsis;
	}

	.post-images {
		@apply mt-2 flex gap-2;
	}

	.post-image-thumbnail {
		@apply h-20 w-20 rounded object-cover;
	}

	.post-video-thumbnail {
		@apply h-20 w-20 rounded object-cover;
	}

	.post-file-thumbnail {
		@apply flex h-20 w-20 items-center justify-center rounded bg-gray-100;
	}

	.post-image-more {
		@apply flex h-20 w-20 items-center justify-center rounded bg-gray-100 text-sm font-medium text-gray-600;
	}

	.post-meta {
		@apply flex items-center justify-between text-sm text-gray-500;
	}

	.post-author {
		@apply flex items-center gap-2;
	}

	.author-photo {
		@apply h-8 w-8 rounded-full object-cover;
	}

	.author-photo-placeholder {
		@apply flex h-8 w-8 items-center justify-center rounded-full bg-gray-300 text-xs font-semibold text-white;
	}

	.author-name {
		@apply font-medium text-gray-700;
	}

	.post-time {
		@apply text-gray-400;
	}

	.list-status {
		@apply py-8 text-center text-gray-500;
	}

	/* 댓글 관련 스타일 */
	.post-card-wrapper {
		@apply mb-4;
	}

	.post-actions {
		@apply mt-2 flex items-center justify-between border-t border-gray-100 pt-2;
	}

	.comment-info {
		@apply flex items-center gap-2;
	}

	.comment-count {
		@apply text-sm text-gray-700;
	}

	.comment-count-empty {
		@apply text-sm text-gray-400;
	}

	.comments-list {
		@apply mt-3 space-y-2 border-t border-gray-100 pt-3;
	}

	.comment-item {
		@apply rounded-lg bg-gray-50 p-3;
	}

	.comment-deleted {
		@apply py-2;
	}

	.comment-deleted-text {
		@apply italic text-gray-400;
	}

	.comment-content {
		@apply space-y-2;
	}

	.comment-header {
		@apply flex items-center justify-between;
	}

	.comment-author {
		@apply text-sm font-medium text-gray-900;
	}

	.comment-time {
		@apply text-xs text-gray-400;
	}

	.comment-text {
		@apply text-sm text-gray-800;
	}

	.comment-images {
		@apply mt-2 flex gap-2;
	}

	.comment-image-thumbnail {
		@apply h-16 w-16 rounded object-cover;
	}
</style>
