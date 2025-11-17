<script lang="ts">
	/**
	 * 채팅 메시지 수정 모달
	 *
	 * 이 컴포넌트는 사용자가 자신의 채팅 메시지를 수정할 수 있도록 합니다.
	 * MessageEditModal.svelte를 사용하여 UI를 표시하고,
	 * Firebase RTDB 업데이트 로직을 담당합니다.
	 */

	import MessageEditModal from '$lib/components/MessageEditModal.svelte';
	import { rtdb } from '$lib/firebase';
	import { ref, update } from 'firebase/database';

	// Props
	interface Props {
		/** 모달 열림 상태 */
		open: boolean;
		/** 메시지 ID */
		messageId: string;
		/** 초기 텍스트 */
		initialText: string;
		/** 초기 첨부파일 URL 목록 */
		initialUrls: Record<number, string>;
		/** 채팅방 ID */
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
	 * 저장 핸들러: Firebase RTDB에 메시지 업데이트
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
			console.error('메시지 저장 실패:', err);
			return {
				success: false,
				error: '메시지 저장에 실패했습니다. 다시 시도해주세요.'
			};
		}
	}
</script>

<MessageEditModal
	bind:open
	title="메시지 수정"
	textLabel="메시지 텍스트"
	{initialText}
	{initialUrls}
	{roomId}
	saveButtonText="저장"
	cancelButtonText="취소"
	textPlaceholder="메시지를 입력하세요..."
	onSave={handleSave}
	onCancel={onClose}
/>
