<!--
  댓글 작성 모달 다이얼로그 컴포넌트

  MessageEditModal.svelte를 사용하여 게시글에 댓글을 작성하거나
  댓글에 대댓글을 작성할 수 있는 모달 창을 제공합니다.
-->

<script lang="ts">
	import MessageEditModal from '$lib/components/MessageEditModal.svelte';
	import { authStore } from '$lib/stores/auth.svelte';
	import { createComment } from '$lib/functions/comment.functions';

	/**
	 * Props 인터페이스
	 */
	interface Props {
		open: boolean; // 모달 열림 상태 (bindable)
		messageId: string; // 게시글 ID (postId)
		parentId?: string | null; // 부모 댓글 ID (최상위 댓글인 경우 null)
		parentText?: string | null; // 부모 댓글 내용 (대댓글인 경우 표시)
		onClose?: () => void; // 모달 닫기 콜백
		onCreated?: () => void; // 댓글 생성 완료 콜백
	}

	let {
		open = $bindable(),
		messageId: postId,
		parentId = null,
		parentText = null,
		onClose,
		onCreated
	}: Props = $props();

	/**
	 * 저장 핸들러: Firebase RTDB에 댓글 저장
	 */
	async function handleSave(
		text: string,
		urls: Record<number, string>
	): Promise<{ success: boolean; error?: string }> {
		// 유효성 검사
		if (!text.trim() && Object.keys(urls).length === 0) {
			return { success: false, error: '댓글 내용을 입력하거나 파일을 첨부해주세요.' };
		}
		if (!authStore.user?.uid) {
			return { success: false, error: '로그인이 필요합니다.' };
		}

		try {
			// 파일 URL이 없으면 undefined로 처리
			const urlsToSave = Object.keys(urls).length > 0 ? urls : undefined;

			// 댓글 생성
			const result = await createComment(postId, text, authStore.user.uid, urlsToSave, parentId);

			if (!result.success) {
				return { success: false, error: result.error ?? '댓글 작성에 실패했습니다.' };
			}

			// 댓글 생성 완료 콜백 호출
			if (onCreated) {
				onCreated();
			}

			return { success: true };
		} catch (error) {
			console.error('댓글 저장 실패:', error);
			return { success: false, error: '댓글 저장에 실패했습니다.' };
		}
	}

	/**
	 * 취소 핸들러
	 */
	function handleCancel() {
		if (onClose) {
			onClose();
		}
	}
</script>

<MessageEditModal
	bind:open
	title={parentId ? '대댓글 작성' : '댓글 작성'}
	textLabel=""
	roomId={postId}
	saveButtonText="저장"
	cancelButtonText="취소"
	textPlaceholder="댓글을 입력하세요"
	onSave={handleSave}
	onCancel={handleCancel}
	hasAdditionalFields={parentId && parentText ? true : false}
>
	<!-- 추가 필드: 부모 댓글 정보 (대댓글인 경우만 표시) -->
	{#if parentId && parentText}
		<div class="parent-comment-info">
			<div class="parent-comment-label">답글 대상:</div>
			<div class="parent-comment-text">{parentText}</div>
		</div>
	{/if}
</MessageEditModal>

<style>
	@import 'tailwindcss' reference;

	.parent-comment-info {
		@apply rounded-md border border-gray-200 bg-gray-50 p-3;
	}

	.parent-comment-label {
		@apply mb-1 text-xs font-medium text-gray-500;
	}

	.parent-comment-text {
		@apply text-sm text-gray-700;
	}
</style>
