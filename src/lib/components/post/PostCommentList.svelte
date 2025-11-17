<!--
  게시글 댓글 목록 컴포넌트

  기능:
  - 마지막 3개 댓글 자동 미리보기 로딩
  - 총 댓글 개수 표시
  - 더보기 버튼 (3개 초과 시)
  - 댓글 쓰기 버튼
  - 댓글 계층 구조 표시
  - 답글 버튼
-->

<script lang="ts">
	import { Button } from '$lib/components/ui/button';
	import { loadComments, loadLastComments } from '$lib/functions/comment.functions';
	import type { CommentWithMetadata } from '$lib/types/comment.types';
	import { formatDistanceToNow } from 'date-fns';
	import { ko, enUS, ja, zhCN } from 'date-fns/locale';
	import { getLocale } from '$lib/paraglide/runtime.js';
	import UserProfile from '$lib/components/UserProfile.svelte';
	import FileAttachments from '$lib/components/FileAttachments.svelte';
	import CommentEditDialog from '$lib/components/comment/CommentEditDialog.svelte';
	import { authStore } from '$lib/stores/auth.svelte';
	import { rtdb } from '$lib/firebase';
	import { ref, update } from 'firebase/database';

	/**
	 * Props
	 */
	interface Props {
		messageId: string; // 게시글(채팅 메시지) ID
		totalChildCount?: number; // 총 댓글 개수
		onOpenCommentDialog: (
			messageId: string,
			parentId?: string | null,
			parentText?: string | null
		) => void; // 댓글 작성 모달 열기 콜백
	}

	let { messageId, totalChildCount = 0, onOpenCommentDialog }: Props = $props();

	/**
	 * 상태
	 */
	let comments = $state<CommentWithMetadata[]>([]); // 댓글 목록
	let allCommentsLoaded = $state(false); // 전체 댓글 로드 여부

	// 댓글 수정 모달 상태
	let isEditDialogOpen = $state(false);
	let editingCommentId = $state<string>('');
	let editingCommentText = $state<string>('');
	let editingCommentUrls = $state<Record<number, string>>({});

	/**
	 * 특정 게시글의 마지막 3개 댓글만 로드 (미리보기용)
	 */
	async function loadLastCommentsForMessage() {
		const result = await loadLastComments(messageId, 3);
		if (result.success && result.comments) {
			comments = result.comments;
			allCommentsLoaded = false;
		}
	}

	/**
	 * 특정 게시글의 전체 댓글 로드 (더보기 클릭 시)
	 */
	async function loadAllCommentsForMessage() {
		const result = await loadComments(messageId);
		if (result.success && result.comments) {
			comments = result.comments;
			allCommentsLoaded = true;
		}
	}

	/**
	 * 댓글 목록 새로고침 (외부에서 호출 가능)
	 */
	export async function refresh() {
		if (allCommentsLoaded) {
			await loadAllCommentsForMessage();
		} else {
			await loadLastCommentsForMessage();
		}
	}

	/**
	 * 댓글 수정 모달 열기
	 */
	function handleOpenEditDialog(
		commentId: string,
		text: string,
		urls: Record<number, string> | undefined
	) {
		editingCommentId = commentId;
		editingCommentText = text || '';
		editingCommentUrls = urls || {};
		isEditDialogOpen = true;
	}

	/**
	 * 댓글 수정 완료 후 콜백
	 */
	async function handleCommentEdited() {
		// 댓글 목록 새로고침
		await refresh();
	}

	/**
	 * 댓글 삭제 함수
	 */
	async function handleDeleteComment(commentId: string) {
		if (!confirm('댓글을 삭제하시겠습니까?')) {
			return;
		}

		if (!rtdb) {
			alert('Firebase 연결이 없습니다.');
			return;
		}

		try {
			const commentRef = ref(rtdb, `chat-message-comments/${messageId}/${commentId}`);
			await update(commentRef, {
				text: null,
				urls: null,
				deleted: true,
				deletedAt: Date.now()
			});

			// 댓글 목록 새로고침
			await refresh();
		} catch (error) {
			console.error('댓글 삭제 실패:', error);
			alert('댓글 삭제에 실패했습니다.');
		}
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
	 * 자동 로딩: messageId가 변경되거나 초기 로드 시 자동으로 마지막 3개 댓글 로드
	 * totalChildCount가 0이어도 시도해봄 (기존 게시글의 경우 totalChildCount가 없을 수 있음)
	 */
	$effect(() => {
		// messageId가 변경되면 댓글 목록 초기화 및 재로드
		if (messageId && comments.length === 0 && !allCommentsLoaded) {
			loadLastCommentsForMessage();
		}
	});
</script>

<!-- 댓글 정보 및 버튼 -->
<div class="post-actions">
	<div class="comment-info">
		{#if totalChildCount > 0}
			<span class="comment-count"> 💬 {totalChildCount}개의 댓글이 있습니다. </span>
			{#if !allCommentsLoaded && totalChildCount > 3}
				<Button
					variant="link"
					size="sm"
					onclick={(e: MouseEvent) => {
						e.stopPropagation();
						loadAllCommentsForMessage();
					}}
				>
					더보기...
				</Button>
			{/if}
		{:else}
			<span class="comment-count-empty">댓글이 없습니다.</span>
		{/if}
	</div>
	<Button
		variant="ghost"
		size="sm"
		onclick={(e: MouseEvent) => {
			e.stopPropagation();
			onOpenCommentDialog(messageId);
			if (comments.length === 0) {
				loadLastCommentsForMessage();
			}
		}}
	>
		💬 댓글 쓰기
	</Button>
</div>

<!-- 댓글 목록 -->
{#if comments.length > 0}
	<div class="comments-list">
		{#each comments as comment}
			{@const isMyComment = authStore.user?.uid === comment.authorUid}
			<div class="comment-item" style="margin-left: {comment.depth * 24}px;">
				<!-- 삭제된 댓글 표시 -->
				{#if comment.deleted}
					<div class="comment-deleted">
						<p class="comment-deleted-text">삭제된 댓글입니다</p>
					</div>
				{:else}
					<!-- 댓글 내용 -->
					<div class="comment-content">
						<div class="comment-header">
							<UserProfile uid={comment.authorUid} photoSize="h-6 w-6" textSize="text-xs" />
							<span class="comment-time">
								{formatDistanceToNow(new Date(comment.createdAt), {
									addSuffix: true,
									locale: getDateLocale()
								})}
							</span>
						</div>
						<p class="comment-text">{comment.text}</p>

						<!-- 첨부 파일 미리보기 (FileAttachments 컴포넌트 사용) -->
						{#if comment.urls}
							<FileAttachments urls={comment.urls} maxDisplay={20} thumbnailSize="h-32 w-32" />
						{/if}

						<!-- 버튼 그룹 -->
						<div class="comment-actions">
							<!-- 답글 버튼 -->
							<Button
								variant="ghost"
								size="sm"
								onclick={(e: MouseEvent) => {
									e.stopPropagation();
									onOpenCommentDialog(messageId, comment.commentId, comment.text);
								}}
							>
								답글
							</Button>

							<!-- 수정/삭제 버튼 (작성자만 표시) -->
							{#if isMyComment}
								<Button
									variant="ghost"
									size="sm"
									onclick={(e: MouseEvent) => {
										e.stopPropagation();
										handleOpenEditDialog(comment.commentId, comment.text, comment.urls);
									}}
								>
									수정
								</Button>
								<Button
									variant="ghost"
									size="sm"
									onclick={(e: MouseEvent) => {
										e.stopPropagation();
										handleDeleteComment(comment.commentId);
									}}
								>
									삭제
								</Button>
							{/if}
						</div>
					</div>
				{/if}
			</div>
		{/each}
	</div>
{/if}

<!-- 댓글 수정 모달 -->
<CommentEditDialog
	bind:open={isEditDialogOpen}
	{messageId}
	commentId={editingCommentId}
	initialText={editingCommentText}
	initialUrls={editingCommentUrls}
	onClose={() => (isEditDialogOpen = false)}
	onSaved={handleCommentEdited}
/>

<style>
	@import 'tailwindcss' reference;

	/* 댓글 관련 스타일 */
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
		@apply text-gray-400 italic;
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
		@apply whitespace-pre-line text-sm text-gray-800;
	}

	.comment-actions {
		@apply mt-2 flex gap-1;
	}

	.comment-images {
		@apply mt-2 flex gap-2;
	}

	.comment-image-thumbnail {
		@apply h-16 w-16 rounded object-cover;
	}
</style>
