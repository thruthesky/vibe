<!--
  ChatInvitationList - 채팅 초대 목록 컴포넌트

  현재 사용자가 받은 채팅방 초대 목록을 실시간으로 표시하는 컴팩트한 컴포넌트입니다.
  채팅 목록 페이지 상단에 표시되며, 사용자는 초대를 수락하거나 거절할 수 있습니다.

  사용 예시:
  ```svelte
  <ChatInvitationList />
  ```
-->

<script lang="ts">
import DatabaseListView from '$lib/components/DatabaseListView.svelte';
import { Button } from '$lib/components/ui/button';
import { authStore } from '$lib/stores/auth.svelte';
import { acceptInvitation, rejectInvitation } from '$lib/functions/chat.functions';
import { rtdb } from '$lib/firebase';
import { m } from '$lib/paraglide/messages';
import { goto } from '$app/navigation';
import { onValue, ref } from 'firebase/database';

type InvitationData = Record<string, unknown>;

const PAGE_SIZE = 10;
const ORDER_FIELD = 'invitationOrder';

	// 현재 로그인 사용자의 chat-invitations 경로
const invitationPath = $derived.by(() => {
	const uid = authStore.user?.uid;
	const path = uid ? `chat-invitations/${uid}` : '';
	return path;
});

let hasInvitations = $state(false);

$effect(() => {
	const uid = authStore.user?.uid;
	if (!uid || !rtdb) {
		hasInvitations = false;
		return;
	}

	const invitationsRef = ref(rtdb, `chat-invitations/${uid}`);
	const unsubscribe = onValue(
		invitationsRef,
		(snapshot) => {
			hasInvitations = snapshot.exists() && snapshot.hasChildren();
		},
		(error) => {
			console.error('채팅 초대 목록 구독 중 오류가 발생했습니다:', error);
			hasInvitations = false;
		}
	);

	return () => {
		unsubscribe();
	};
});

	/**
	 * 초대 수락 핸들러
	 * 초대를 수락한 후 해당 채팅방으로 자동 이동합니다.
	 */
	async function handleAccept(roomId: string) {
		const uid = authStore.user?.uid;
		if (!uid || !rtdb) {
			console.error('사용자 인증 정보 또는 Database가 초기화되지 않았습니다');
			return;
		}

		try {
			await acceptInvitation(rtdb, roomId, uid);
			// console.log('✅ 초대 수락 완료:', roomId);

			// 채팅방으로 자동 이동
			await goto(`/chat/room?roomId=${roomId}`);
		} catch (error) {
			console.error('초대 수락 실패:', error);
		}
	}

	/**
	 * 초대 거절 핸들러
	 */
	async function handleReject(roomId: string) {
		const uid = authStore.user?.uid;
		if (!uid || !rtdb) {
			console.error('사용자 인증 정보 또는 Database가 초기화되지 않았습니다');
			return;
		}

		try {
			await rejectInvitation(rtdb, roomId, uid);
			// console.log('✅ 초대 거절 완료:', roomId);
		} catch (error) {
			console.error('초대 거절 실패:', error);
		}
	}
</script>

{#if authStore.isAuthenticated && invitationPath && hasInvitations}
	<!-- 초대 목록 래퍼 - 초대가 있을 때만 표시됨 -->
	<section class="invitation-list-wrapper">
		<DatabaseListView
			path={invitationPath}
			pageSize={PAGE_SIZE}
			orderBy={ORDER_FIELD}
			threshold={320}
		>
			{#snippet item(itemData)}
				{@const invitation = (itemData.data ?? {}) as InvitationData}
				{@const roomId = (invitation.roomId ?? itemData.key ?? '') as string}
				{@const roomName = (invitation.roomName ?? m.chatRoomDefaultName()) as string}
				{@const inviterName = (invitation.inviterName ?? m.userDefaultName()) as string}
				{@const message = (invitation.message ?? '') as string}

				<!-- 초대 카드 -->
				<div class="invitation-card">
					<div class="invitation-content">
						<!-- 아이콘 -->
						<div class="invitation-icon">
							<span>💌</span>
						</div>

						<!-- 메시지 -->
						<div class="invitation-message">
							<p class="invitation-text">
								{m.chatInvitationMessage({ userName: inviterName, roomName })}
							</p>
							{#if message}
								<p class="invitation-detail">{message}</p>
							{/if}
						</div>

						<!-- 버튼 -->
						<div class="invitation-actions">
							<Button variant="default" size="sm" onclick={() => handleAccept(roomId)}>
								{m.chatAccept()}
							</Button>
							<Button variant="outline" size="sm" onclick={() => handleReject(roomId)}>
								{m.chatReject()}
							</Button>
						</div>
					</div>
				</div>
			{/snippet}

			{#snippet empty()}
				<!-- 초대가 없을 때는 아무것도 표시하지 않음 -->
				<div style="display: none;"></div>
			{/snippet}

			{#snippet loading()}
				<!-- 로딩 중에도 아무것도 표시하지 않음 -->
				<div style="display: none;"></div>
			{/snippet}
		</DatabaseListView>
	</section>
{/if}

<style>
	@import 'tailwindcss' reference;

	.invitation-list-wrapper {
		@apply rounded-2xl border border-blue-200 bg-white shadow-sm;
	}

	.invitation-card {
		@apply border-b border-blue-100 bg-blue-50;
	}

	.invitation-content {
		@apply flex items-center gap-4 p-4;
	}

	.invitation-icon {
		@apply flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full bg-blue-100 text-xl;
	}

	.invitation-message {
		@apply flex-1 space-y-1;
	}

	.invitation-text {
		@apply text-sm text-gray-800;
	}

	.invitation-text strong {
		@apply font-semibold text-blue-700;
	}

	.invitation-detail {
		@apply text-xs text-gray-600;
	}

	.invitation-actions {
		@apply flex flex-shrink-0 gap-2;
	}

	/* 반응형 디자인 */
	@media (max-width: 640px) {
		.invitation-content {
			@apply flex-col items-start gap-3;
		}

		.invitation-actions {
			@apply w-full;
		}

		.invitation-actions :global(button) {
			@apply flex-1;
		}
	}
</style>
