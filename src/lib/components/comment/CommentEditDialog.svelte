<!--
  댓글 수정 다이얼로그 컴포넌트

  이 컴포넌트는 사용자가 자신의 댓글을 수정할 수 있도록 합니다.
  MessageEditModal.svelte를 사용하여 UI를 표시하고,
  Firebase RTDB 업데이트 로직을 담당합니다.
-->

<script lang="ts">
	import MessageEditModal from '$lib/components/MessageEditModal.svelte';
	import { updateComment } from '$lib/functions/comment.functions';
	import * as m from '$lib/paraglide/messages.js';

	// Props
	interface Props {
		/** 모달 열림 상태 */
		open: boolean;
		/** 게시글 ID (postId) */
		messageId: string;
		/** 댓글 ID */
		commentId: string;
		/** 초기 텍스트 */
		initialText: string;
		/** 초기 첨부파일 URL 목록 */
		initialUrls: Record<number, string>;
		/** 모달 닫기 콜백 */
		onClose: () => void;
		/** 저장 완료 콜백 */
		onSaved?: () => void;
	}

	let {
		open = $bindable(false),
		messageId: postId,
		commentId,
		initialText,
		initialUrls,
		onClose,
		onSaved
	}: Props = $props();

	/**
	 * 저장 핸들러: Firebase RTDB에 댓글 업데이트
	 */
	async function handleSave(
		text: string,
		urls: Record<number, string>
	): Promise<{ success: boolean; error?: string }> {
		try {
			const result = await updateComment(postId, commentId, text, urls);

			if (!result.success) {
				return { success: false, error: result.error ?? m.commentSaveFailed() };
			}

			// 저장 완료 콜백 호출
			onSaved?.();

			return { success: true };
		} catch (err) {
			console.error('댓글 수정 실패:', err);
			return {
				success: false,
				error: m.commentSaveFailed()
			};
		}
	}
</script>

<MessageEditModal
	bind:open
	title={m.commentEditTitle()}
	textLabel=""
	{initialText}
	{initialUrls}
	roomId={postId}
	saveButtonText={m.commonSave()}
	cancelButtonText={m.commonCancel()}
	textPlaceholder={m.commentTextPlaceholder()}
	onSave={handleSave}
	onCancel={onClose}
/>
