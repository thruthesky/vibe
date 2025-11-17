<!--
  게시글 수정 다이얼로그 컴포넌트

  이 컴포넌트는 사용자가 자신의 게시글을 수정할 수 있도록 합니다.
  MessageEditModal.svelte를 사용하여 UI를 표시하고,
  Firebase RTDB 업데이트 로직을 담당합니다.
-->

<script lang="ts">
	import MessageEditModal from '$lib/components/MessageEditModal.svelte';
	import { rtdb } from '$lib/firebase';
	import { ref, update } from 'firebase/database';

	// Props
	interface Props {
		/** 모달 열림 상태 */
		open: boolean;
		/** 게시글(메시지) ID */
		messageId: string;
		/** 초기 텍스트 */
		initialText: string;
		/** 초기 첨부파일 URL 목록 */
		initialUrls: Record<number, string>;
		/** 채팅방 ID (파일 업로드 경로용) */
		roomId: string;
		/** 모달 닫기 콜백 */
		onClose: () => void;
		/** 저장 완료 콜백 */
		onSaved?: () => void;
	}

	let {
		open = $bindable(),
		messageId,
		initialText,
		initialUrls,
		roomId,
		onClose,
		onSaved
	}: Props = $props();

	/**
	 * 저장 핸들러: Firebase RTDB에 게시글 업데이트
	 */
	async function handleSave(
		text: string,
		urls: Record<number, string>
	): Promise<{ success: boolean; error?: string }> {
		if (!rtdb) {
			return { success: false, error: 'Firebase 연결이 없습니다.' };
		}

		try {
			const messageRef = ref(rtdb, `chat-messages/${messageId}`);
			const updates = {
				text: text.trim(),
				urls,
				editedAt: Date.now()
			};

			await update(messageRef, updates);

			// 저장 완료 콜백 호출
			onSaved?.();

			return { success: true };
		} catch (err) {
			console.error('게시글 수정 실패:', err);
			return {
				success: false,
				error: '게시글 수정에 실패했습니다. 다시 시도해주세요.'
			};
		}
	}
</script>

<MessageEditModal
	bind:open
	title="게시글 수정"
	textLabel=""
	{initialText}
	{initialUrls}
	{roomId}
	saveButtonText="저장"
	cancelButtonText="취소"
	textPlaceholder="내용을 입력하세요..."
	onSave={handleSave}
	onCancel={onClose}
/>
