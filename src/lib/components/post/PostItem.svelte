<!--
  게시글 아이템 컴포넌트

  게시판과 홈 화면에서 재사용되는 게시글 카드 UI
  - 작성자 정보 (프로필 + 팔로우 버튼)
  - 게시글 내용 (텍스트 + 첨부파일)
  - 좋아요, 댓글 버튼
  - 수정, 삭제 버튼 (본인 글일 때)
  - 댓글 목록
-->

<script lang="ts">
	import { formatDistanceToNow } from 'date-fns';
	import { ko, enUS, ja, zhCN } from 'date-fns/locale';
	import { getLocale } from '$lib/paraglide/runtime.js';
	import { goto } from '$app/navigation';
	import type { ForumCategory } from '../../../../shared/categories';
	import * as m from '$lib/paraglide/messages.js';
	import UserProfile from '$lib/components/UserProfile.svelte';
	import FollowButton from '$lib/components/friend/follow-button.svelte';
	import FileAttachments from '$lib/components/FileAttachments.svelte';
	import PostCommentList from '$lib/components/post/PostCommentList.svelte';
	import { authStore } from '$lib/stores/auth.svelte';
	import { rtdb } from '$lib/firebase';
	import { getChatRoomName } from '$lib/functions/chat.functions';
	import type { LikeTargetType } from '$lib/functions/like.functions';
	import { fetchLikedByUsers } from '$lib/functions/like.functions';
	import LikedUsersAvatarStack from '$lib/components/LikedUsersAvatarStack.svelte';
	import LikedUsersModal from '$lib/components/LikedUsersModal.svelte';

	/**
	 * Props
	 */
	interface Props {
		/** 게시글 데이터 */
		message: any;
		/** 게시글 ID */
		messageId: string;
		/** 좋아요 상태 맵 */
		userLikes?: Record<string, LikeTargetType>;
		/** 좋아요 토글 핸들러 */
		onToggleLike: (event: MouseEvent, messageId: string, type: LikeTargetType) => void;
		/** 댓글 작성 모달 열기 핸들러 */
		onOpenCommentDialog: (
			messageId: string,
			parentId?: string | null,
			parentText?: string | null
		) => void;
		/** 수정 핸들러 (게시판 페이지에서 사용) */
		onEdit?: (
			messageId: string,
			text: string,
			urls: Record<number, string>,
			roomId: string
		) => void;
		/** 삭제 핸들러 */
		onDelete: (messageId: string) => void;
		/** 수정 버튼 동작 모드: 'dialog' = 수정 모달 열기, 'navigate' = 채팅방으로 이동 */
		editMode?: 'dialog' | 'navigate';
	}

	let {
		message,
		messageId,
		userLikes = {},
		onToggleLike,
		onOpenCommentDialog,
		onEdit,
		onDelete,
		editMode = 'dialog'
	}: Props = $props();

	// 본인 게시글 여부
	const isMyPost = $derived(authStore.user?.uid === message.senderUid);

	// 댓글 컴포넌트 참조
	let commentListRef = $state<PostCommentList>();

	// 좋아요 사용자 목록 상태
	let likedByUids = $state<string[]>([]);
	let likesModalOpen = $state(false);

	/**
	 * 좋아요 사용자 목록 로드
	 */
	$effect(() => {
		if (message.likeCount && message.likeCount > 0) {
			loadLikedUsers();
		} else {
			likedByUids = [];
		}
	});

	async function loadLikedUsers() {
		try {
			const uids = await fetchLikedByUsers(messageId, 'message');
			likedByUids = uids;
		} catch (error) {
			console.error('좋아요 사용자 로드 실패:', error);
			likedByUids = [];
		}
	}

	/**
	 * 좋아요 사용자 목록 모달 열기
	 */
	function handleOpenLikesModal() {
		likesModalOpen = true;
	}

	/**
	 * 수정 버튼 클릭 핸들러
	 */
	function handleEditClick(e: MouseEvent) {
		e.stopPropagation();

		if (editMode === 'navigate') {
			// 채팅방으로 이동 (홈 화면에서 사용)
			goto(`/chat/room?roomId=${message.roomId}`);
		} else {
			// 수정 모달 열기 (게시판에서 사용)
			if (onEdit) {
				onEdit(messageId, message.text, message.urls, message.roomId);
			}
		}
	}

	/**
	 * 삭제 버튼 클릭 핸들러
	 */
	function handleDeleteClick(e: MouseEvent) {
		e.stopPropagation();
		onDelete(messageId);
	}

	/**
	 * 댓글 작성 완료 후 댓글 목록 새로고침
	 */
	export async function refreshComments() {
		await commentListRef?.refresh();
	}

	/**
	 * date-fns 로케일 매핑
	 */
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

	/**
	 * 카테고리 이름을 i18n 메시지 함수로 변환
	 */
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
			hobby: m.chatCategoryHobby,
			story: m.chatCategoryStory
		};
		return categoryMap[category]();
	};
</script>

<div class="post-card-wrapper">
	<!-- 삭제된 게시글 표시 -->
	{#if message.deleted}
		<div class="post-card post-deleted">
			<p class="post-deleted-text">삭제된 글입니다.</p>
		</div>
	{:else}
		<div class="post-card">
			<!-- 상단 메타 영역 -->
			<div class="post-header">
				<!-- 왼쪽: 작성자 프로필 + 팔로우 버튼 -->
				<div class="post-header-left">
					<UserProfile uid={message.senderUid} photoSize="h-8 w-8" textSize="text-sm" />
					<!-- 팔로우 버튼 (작성자가 본인이 아닐 때만 표시) -->
					{#if !isMyPost}
						<div class="ml-2">
							<FollowButton targetUid={message.senderUid} />
						</div>
					{/if}
				</div>
				

				<!-- 오른쪽: 카테고리 + 채팅방 이름 + 시간 -->
				<div class="post-header-right">
					{#if message.category}
						<span class="post-category-badge">
							{getCategoryMessage(message.category)}
						</span>
					{/if}
					{#if rtdb}
						{#if message.roomId == 'post'}
							<!-- 채팅방 ID 가 post 이면, 채팅방 이름 표시 생략. 자세한 내용은 readme 참고 -->
						{:else}
							{#await getChatRoomName(rtdb, message.roomId)}
								<button class="post-room-name" disabled>...</button>
							{:then roomName}
								<button
									class="post-room-name"
									onclick={(e) => {
										e.stopPropagation();
										goto(`/chat/room?roomId=${message.roomId}`);
									}}
								>
									{roomName}
								</button>
							{:catch}
								<button class="post-room-name" disabled>(채팅방)</button>
							{/await}
						{/if}
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
						class:liked={userLikes[messageId] === 'message'}
						disabled={!authStore.user}
						onclick={(e) => onToggleLike(e, messageId, 'message')}
					>
						<svg
							class="h-5 w-5"
							fill={userLikes[messageId] === 'message' ? 'currentColor' : 'none'}
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
						<!-- 데스크톱: "좋아요" 텍스트 표시, 모바일: 숨김 -->
						<span class="hidden md:inline">좋아요</span>
						<!-- 좋아요 숫자가 0보다 클 때만 표시 -->
						{#if message.likeCount && message.likeCount > 0}
							<span>{message.likeCount}</span>
						{/if}
					</button>

					<!-- 좋아요 사용자 아바타 스택 (3명까지 표시) -->
					{#if likedByUids.length > 0}
						<LikedUsersAvatarStack likedByUids={likedByUids} onClick={handleOpenLikesModal} />
					{/if}

					<!-- 댓글 버튼 -->
					<button
						class="action-button"
						onclick={(e) => {
							e.stopPropagation();
							onOpenCommentDialog(messageId);
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
						<button class="action-icon-button" onclick={handleEditClick} aria-label="수정">
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
							onclick={handleDeleteClick}
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
	{/if}

	<!-- 댓글 목록 컴포넌트 -->
	<PostCommentList
		bind:this={commentListRef}
		{messageId}
		totalChildCount={message.totalChildCount || 0}
		{onOpenCommentDialog}
		{userLikes}
	/>

	<!-- 좋아요 사용자 목록 모달 -->
	<LikedUsersModal bind:open={likesModalOpen} targetId={messageId} targetType="message" />
</div>

<style>
	@import 'tailwindcss' reference;

	.post-card-wrapper {
		@apply mb-4;
	}

	.post-card {
		@apply rounded-lg border border-gray-200 bg-white p-4 shadow-sm;
		@apply transition-all hover:shadow-md;
	}

	.post-deleted {
		@apply cursor-default bg-gray-50;
	}

	.post-deleted-text {
		@apply py-2 text-center text-gray-400 italic;
	}

	/* 상단 메타 영역 */
	.post-header {
		@apply mb-3 flex items-center justify-between;
	}

	.post-header-left {
		@apply flex items-center;
	}

	.post-header-right {
		@apply flex items-center gap-2;
	}

	.post-category-badge {
		@apply inline-block rounded-full bg-blue-100 px-2 py-0.5 text-xs font-semibold text-blue-800;
	}

	.post-room-name {
		@apply hidden text-xs text-gray-500 md:inline-block;
		@apply cursor-pointer transition-colors hover:text-blue-600 hover:underline;
		@apply disabled:cursor-default disabled:hover:text-gray-500 disabled:hover:no-underline;
	}

	/* 메시지 내용 영역 */
	.post-content {
		@apply mb-3;
	}

	.post-text {
		@apply mb-2 whitespace-pre-line text-gray-800;
		display: -webkit-box;
		-webkit-line-clamp: 3;
		-webkit-box-orient: vertical;
		overflow: hidden;
		text-overflow: ellipsis;
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
		@apply transition-colors hover:bg-gray-100 disabled:cursor-not-allowed disabled:opacity-60;
	}

	.action-button.liked {
		@apply bg-rose-50 text-rose-600;
	}

	/* 수정/삭제 아이콘 버튼 */
	.action-icon-button {
		@apply flex items-center justify-center rounded-lg p-2 text-gray-600;
		@apply transition-colors hover:bg-gray-100;
	}

	.action-icon-button-danger {
		@apply text-red-600 hover:bg-red-50;
	}
</style>
