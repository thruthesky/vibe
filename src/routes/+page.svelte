<!--
  홈 페이지

  최근 등록된 게시글(채팅 메시지)을 표시합니다.
  - 게시글 = 채팅 메시지 (/chat-messages/{messageId})
  - 최근 글 = allCategoryOrder를 역순으로 정렬한 것
  - 상단에 카테고리 탭 (전체 + 10개 카테고리)
  - DatabaseListView를 사용한 무한 스크롤
  - 상단에 글쓰기 버튼 표시
-->

<script lang="ts">
	import { FORUM_CATEGORIES, type ForumCategory } from '../../shared/categories';
	import DatabaseListView from '$lib/components/DatabaseListView.svelte';
	import * as m from '$lib/paraglide/messages.js';
	import { formatDistanceToNow } from 'date-fns';
	import { ko, enUS, ja, zhCN } from 'date-fns/locale';
	import { getLocale } from '$lib/paraglide/runtime.js';
	import { goto } from '$app/navigation';
	import { Button } from '$lib/components/ui/button';
	import PostCreateDialog from '$lib/components/post/PostCreateDialog.svelte';
	import CommentCreateDialog from '$lib/components/comment/CommentCreateDialog.svelte';
	import PostCommentList from '$lib/components/post/PostCommentList.svelte';
	import FileAttachments from '$lib/components/FileAttachments.svelte';
	import UserProfile from '$lib/components/UserProfile.svelte';
	import Avatar from '$lib/components/user/avatar.svelte';
	import { Camera, Image as ImageIcon, Video, Smile } from 'lucide-svelte';
	import { authStore } from '$lib/stores/auth.svelte';
	import { rtdb } from '$lib/firebase';
	import { ref, update } from 'firebase/database';
	import { getChatRoomName } from '$lib/functions/chat.functions';

	// 카테고리 선택 상태 (null = 전체)
	let selectedCategory = $state<ForumCategory | null>(null);

	// DatabaseListView 참조 (새로고침용)
	let listViewRef = $state<DatabaseListView>();

	// 글쓰기 모달 상태
	let isCreateDialogOpen = $state(false);

	// 댓글 모달 상태
	let isCommentDialogOpen = $state(false);
	let selectedMessageId = $state<string>('');
	let selectedParentId = $state<string | null>(null);
	let selectedParentText = $state<string | null>(null);

	// 각 게시글의 댓글 컴포넌트 참조 저장 (messageId -> PostCommentList)
	let commentListRefs = $state<Record<string, PostCommentList>>({});

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
	<title>Sonub - 홈</title>
</svelte:head>

<div class="post-list-container">
	<!-- 헤더 -->
	<div class="post-list-header">
		<h1 class="post-list-title">최근 게시글</h1>
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

	<!-- 글쓰기 유도 폼 (가짜 입력 폼) -->
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
				{authStore.user.displayName || '사용자'}님, 무슨 생각을 하고 계신가요?
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
					<div class="post-card">
						<!-- 상단 메타 영역 -->
						<div class="post-header">
							<!-- 왼쪽: 작성자 프로필 -->
							<UserProfile uid={message.senderUid} photoSize="h-8 w-8" textSize="text-sm" />

							<!-- 오른쪽: 카테고리 + 채팅방 이름 + 시간 -->
							<div class="post-header-right">
								{#if message.category}
									<span class="post-category-badge">
										{getCategoryMessage(message.category)}
									</span>
								{/if}
								{#if rtdb}
									{#await getChatRoomName(rtdb, message.roomId)}
										<span class="post-room-name">...</span>
									{:then roomName}
										<span class="post-room-name">{roomName}</span>
									{:catch}
										<span class="post-room-name">(채팅방)</span>
									{/await}
								{/if}
								<span class="post-time">
									{formatDistanceToNow(new Date(message.createdAt), {
										addSuffix: true,
										locale: getDateLocale()
									})}
								</span>
							</div>
						</div>

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

						<!-- 하단 액션 바 -->
						<div class="post-actions">
							<!-- 왼쪽: 좋아요, 댓글 -->
							<div class="post-actions-left">
								<!-- 좋아요 버튼 -->
								<button
									class="action-button"
									onclick={(e) => {
										e.stopPropagation();
										// TODO: 좋아요 기능 구현
									}}
								>
									<svg
										class="h-5 w-5"
										fill="none"
										stroke="currentColor"
										viewBox="0 0 24 24"
										stroke-width="2"
									>
										<path
											stroke-linecap="round"
											stroke-linejoin="round"
											d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"
										/>
									</svg>
									<span>좋아요</span>
								</button>

								<!-- 댓글 버튼 -->
								<button
									class="action-button"
									onclick={(e) => {
										e.stopPropagation();
										handleOpenCommentDialog(messageId);
									}}
								>
									<svg
										class="h-5 w-5"
										fill="none"
										stroke="currentColor"
										viewBox="0 0 24 24"
										stroke-width="2"
									>
										<path
											stroke-linecap="round"
											stroke-linejoin="round"
											d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
										/>
									</svg>
									<span>댓글 {message.totalChildCount || 0}</span>
								</button>
							</div>

							<!-- 오른쪽: 수정, 삭제 (작성자만 표시) -->
							{#if isMyPost}
								<div class="post-actions-right">
									<!-- 수정 아이콘 버튼 -->
									<button
										class="action-icon-button"
										onclick={(e) => {
											e.stopPropagation();
											goto(`/chat/room?roomId=${message.roomId}`);
										}}
										aria-label="수정"
									>
										<svg
											class="h-5 w-5"
											fill="none"
											stroke="currentColor"
											viewBox="0 0 24 24"
											stroke-width="2"
										>
											<path
												stroke-linecap="round"
												stroke-linejoin="round"
												d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
											/>
										</svg>
									</button>

									<!-- 삭제 아이콘 버튼 -->
									<button
										class="action-icon-button action-icon-button-danger"
										onclick={(e) => {
											e.stopPropagation();
											handleDeletePost(messageId);
										}}
										aria-label="삭제"
									>
										<svg
											class="h-5 w-5"
											fill="none"
											stroke="currentColor"
											viewBox="0 0 24 24"
											stroke-width="2"
										>
											<path
												stroke-linecap="round"
												stroke-linejoin="round"
												d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
											/>
										</svg>
									</button>
								</div>
							{/if}
						</div>
					</div>

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
		@apply mb-4 flex flex-wrap gap-2;
	}

	.category-chip {
		@apply rounded-full border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700;
		@apply transition-all hover:border-blue-600 hover:bg-blue-600/5;
	}

	.category-chip.active {
		@apply border-blue-600 bg-blue-600 text-white;
		@apply hover:bg-blue-600/90;
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

	.post-list-content {
		@apply space-y-4;
	}

	.post-card {
		@apply rounded-lg border border-gray-200 bg-white p-4 shadow-sm;
		@apply transition-all hover:shadow-md;
	}

	/* 상단 메타 영역 */
	.post-header {
		@apply mb-3 flex items-center justify-between;
	}

	.post-header-right {
		@apply flex items-center gap-2;
	}

	.post-category-badge {
		@apply inline-block rounded-full bg-blue-100 px-2 py-0.5 text-xs font-semibold text-blue-800;
	}

	.post-room-name {
		@apply text-xs text-gray-500;
	}

	/* 메시지 내용 영역 */
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

	.post-image-more {
		@apply flex h-20 w-20 items-center justify-center rounded bg-gray-100 text-sm font-medium text-gray-600;
	}

	.post-time {
		@apply text-xs text-gray-400;
	}

	/* 하단 액션 바 */
	.post-actions {
		@apply mt-3 flex items-center justify-between border-t border-gray-100 pt-3;
	}

	.post-actions-left {
		@apply flex items-center gap-2;
	}

	.post-actions-right {
		@apply flex items-center gap-2;
	}

	/* 좋아요/댓글 버튼 */
	.action-button {
		@apply flex items-center gap-1 rounded-lg px-3 py-1.5 text-sm text-gray-600;
		@apply transition-colors hover:bg-gray-100;
	}

	/* 수정/삭제 아이콘 버튼 */
	.action-icon-button {
		@apply flex items-center justify-center rounded-lg p-2 text-gray-600;
		@apply transition-colors hover:bg-gray-100;
	}

	.action-icon-button-danger {
		@apply text-red-600 hover:bg-red-50;
	}

	.list-status {
		@apply py-8 text-center text-gray-500;
	}

	/* 댓글 관련 스타일 */
	.post-card-wrapper {
		@apply mb-4;
	}

	.post-actions {
		@apply mt-2 flex items-center gap-2 border-t border-gray-100 pt-2;
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
