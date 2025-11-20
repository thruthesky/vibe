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
	import * as m from '$lib/paraglide/messages.js';

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
		open = $bindable(false),
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
			return { success: false, error: m.firebaseNotReady() };
		}

		try {
			// 2단계 구조: chat-messages/{roomId}/{messageId}
			const messageRef = ref(rtdb, `chat-messages/${roomId}/${messageId}`);
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
			error: m.chatMessageSaveFailed()
		};
	}
}
</script>

<MessageEditModal
	bind:open
	title={m.chatMessageEditTitle()}
	textLabel={m.commonMessage()}
	{initialText}
	{initialUrls}
	{roomId}
	saveButtonText={m.commonSave()}
	cancelButtonText={m.commonCancel()}
	textPlaceholder={m.chatWriteMessage()}
	onSave={handleSave}
	onCancel={onClose}
/>
