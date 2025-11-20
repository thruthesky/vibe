<script lang="ts">
	/**
	 * 최근 오픈 채팅 섹션 컴포넌트
	 *
	 * 최근 생성된 오픈 채팅방 3개를 표시합니다.
	 * Firebase Realtime Database의 chat-rooms에서 type이 'open'인 채팅방을 조회합니다.
	 */

	import * as Card from '$lib/components/ui/card/index.js';
	import { m } from '$lib/paraglide/messages';
	import { onMount, onDestroy } from 'svelte';
	import { rtdb } from '$lib/firebase';
	import { formatShortDate } from '$lib/functions/date.functions';
	import { limitToLast, onValue, orderByChild, query, ref } from 'firebase/database';
	import { MessageSquare, ChevronRight } from 'lucide-svelte';
	import { goto } from '$app/navigation';

	type OpenChatPreview = {
		roomId: string;
		roomName: string;
		description: string;
		memberCount: number;
		createdAt: number;
	};

	// Svelte 5 $state rune을 사용하여 반응형 상태 선언
	let recentOpenChats = $state<OpenChatPreview[]>([]);
	let isLoadingRecentOpenChats = $state(true);

	let openChatsUnsubscribe: (() => void) | null = null;

	/**
	 * order 값을 숫자로 변환하는 헬퍼 함수
	 */
	function resolveOrderValue(order: unknown): number {
		if (typeof order === 'number') {
			return order;
		}

		if (typeof order === 'string') {
			const parsed = Number(order.replace(/[^0-9-]/g, ''));
			return Number.isFinite(parsed) ? parsed : 0;
		}

		return 0;
	}

	/**
	 * 오픈 채팅 리스너 정리
	 */
	function teardownOpenChatListener() {
		if (openChatsUnsubscribe) {
			openChatsUnsubscribe();
			openChatsUnsubscribe = null;
		}
	}

	/**
	 * 오픈 채팅 리스너 설정
	 * 실시간으로 오픈 채팅방 목록을 업데이트합니다.
	 */
	function setupOpenChatListener() {
		teardownOpenChatListener();

		if (!rtdb) {
			recentOpenChats = [];
			isLoadingRecentOpenChats = false;
			return;
		}

		isLoadingRecentOpenChats = true;
		const roomsRef = ref(rtdb, 'chat-rooms');
		const roomsQuery = query(roomsRef, orderByChild('createdAt'), limitToLast(20));

		openChatsUnsubscribe = onValue(
			roomsQuery,
			(snapshot) => {
				const items: OpenChatPreview[] = [];

				snapshot.forEach((child) => {
					const value = child.val() ?? {};
					if (value?.type !== 'open') {
						return;
					}

					const createdAtValue =
						Number(value?.createdAt) || resolveOrderValue(value?.openListOrder);
					items.push({
						roomId: child.key ?? '',
						roomName: (value?.name as string) || 'Open Chat',
						description: (value?.description as string) || '',
						memberCount: Number(value?.memberCount) || 0,
						createdAt: Math.abs(createdAtValue)
					});
				});

				items.sort((a, b) => b.createdAt - a.createdAt);
				recentOpenChats = items.slice(0, 3);
				isLoadingRecentOpenChats = false;
			},
			(error) => {
				console.error('[RecentOpenChats] 최근 오픈채팅 로드 실패:', error);
				recentOpenChats = [];
				isLoadingRecentOpenChats = false;
			}
		);
	}

	/**
	 * 카운트 포맷팅 헬퍼 함수
	 */
	function formatCount(value: number): string {
		return new Intl.NumberFormat().format(value);
	}

	/**
	 * 더보기 페이지로 이동
	 */
	function goToOpenChatList() {
		void goto('/chat/open-chat-list');
	}

	onMount(() => {
		setupOpenChatListener();

		return () => {
			teardownOpenChatListener();
		};
	});

	onDestroy(() => {
		teardownOpenChatListener();
	});
</script>

<div class="open-chat-section">
	<!-- 헤더 -->
	<div class="section-header">
		<div class="header-left flex items-center gap-2">
			<MessageSquare class="section-icon" aria-hidden="true" />
			<h3 class="section-title">{m.homeSectionRecentOpenChat()}</h3>
		</div>
		<button
			type="button"
			onclick={goToOpenChatList}
			class="more-button"
			aria-label={`${m.homeSectionRecentOpenChat()} ${m.homeSidebarSeeMore()}`}
		>
			<span class="more-text">{m.homeSidebarSeeMore()}</span>
			<ChevronRight class="more-icon" size={16} />
		</button>
	</div>

	<!-- 컨텐츠 -->
	<div class="section-content">
		{#if isLoadingRecentOpenChats}
			<p class="placeholder-text">{m.homeSidebarOpenChatLoading()}</p>
		{:else if recentOpenChats.length === 0}
			<p class="placeholder-text">{m.homeSidebarOpenChatEmpty()}</p>
		{:else}
			<ul class="chat-list">
				{#each recentOpenChats as chat}
					<li>
						<a
							href={`/chat/room?roomId=${chat.roomId}`}
							class="chat-item"
							aria-label={chat.roomName}
						>
							<div class="chat-header">
								<span class="chat-name">{chat.roomName}</span>
								<span class="chat-members">{formatCount(chat.memberCount)}</span>
							</div>
							{#if chat.description}
								<p class="chat-desc">{chat.description}</p>
							{/if}
						</a>
					</li>
				{/each}
			</ul>
		{/if}
	</div>
</div>

<style>
	@import 'tailwindcss' reference;

	/* 섹션 컨테이너 - 보더 없이 심플하게 */
	.open-chat-section {
		@apply rounded-xl bg-white p-3;
	}

	/* 헤더 영역 */
	.section-header {
		@apply mb-2.5 flex items-center justify-between;
	}

	.section-icon {
		@apply h-3.5 w-3.5 text-blue-500;
	}

	.section-title {
		@apply text-sm font-semibold text-gray-900;
	}

	/* 더보기 버튼 */
	.more-button {
		@apply flex items-center gap-0.5 rounded-lg px-1.5 py-0.5 text-xs font-medium text-gray-600 transition-all;
		@apply hover:bg-gray-100 hover:text-blue-600;
	}

	.more-text {
		@apply text-xs;
	}

	.more-icon {
		@apply transition-transform;
	}

	.more-button:hover .more-icon {
		@apply translate-x-0.5;
	}

	/* 컨텐츠 영역 */
	.section-content {
		@apply space-y-1.5;
	}

	.placeholder-text {
		@apply py-3 text-center text-xs text-gray-400;
	}

	/* 채팅 리스트 */
	.chat-list {
		@apply space-y-1;
	}

	/* 채팅 아이템 - 콤팩트한 디자인 */
	.chat-item {
		@apply block rounded-lg bg-gray-50/50 px-2.5 py-1.5 transition-all duration-200;
		@apply hover:bg-blue-50/80;
	}

	/* 채팅 헤더 */
	.chat-header {
		@apply flex items-center justify-between gap-2;
	}

	.chat-name {
		@apply truncate text-sm font-medium text-gray-900;
	}

	.chat-members {
		@apply shrink-0 text-xs font-medium text-blue-600;
	}

	/* 채팅 설명 */
	.chat-desc {
		@apply mt-0.5 line-clamp-1 text-xs text-gray-500;
	}
</style>
