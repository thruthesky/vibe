---
title: +page.svelte - Svelte 5 컴포넌트
original_path: src/routes/chat/open-chat-list/+page.svelte
category: route
file_type: svelte
status: current
last_updated: 2025-11-20
---

# +page.svelte

## 개요

**원본 경로**: `src/routes/chat/open-chat-list/+page.svelte`

**파일 유형**: Svelte 5 컴포넌트

## 소스 코드

```svelte
<script lang="ts">
	/**
	 * 오픈 채팅방 목록 페이지
	 *
	 * DatabaseListView를 사용하여 공개된 오픈 채팅방 목록을 무한 스크롤로 표시합니다.
	 */

	import DatabaseListView from '$lib/components/DatabaseListView.svelte';
	import ChatCreateDialog from '$lib/components/chat/ChatCreateDialog.svelte';
	import ChatInvitationList from '$lib/components/chat/ChatInvitationList.svelte';
	import { authStore } from '$lib/stores/auth.svelte';
	import { goto } from '$app/navigation';
	import { m } from '$lib/paraglide/messages';
	import { formatLongDate } from '$lib/functions/date.functions';
	import { resolveRoomTypeLabel } from '$lib/functions/chat.functions';
	import ChatListMenu from '$lib/components/chat/ChatListMenu.svelte';
	import ChatFavoritesDialog from '$lib/components/chat/ChatFavoritesDialog.svelte';
	import { onMount } from 'svelte';

	type ChatRoomData = Record<string, unknown>;

	const PAGE_SIZE = 20;
	const CHAT_ROOMS_PATH = 'chat-rooms';
	const ORDER_FIELD = 'openListOrder';
	const OPEN_CHAT_LIST_PATH = '/chat/open-chat-list';

	// ChatCreateDialog 상태
	let createDialogOpen = $state(false); // 오픈 채팅방 생성
	let groupChatDialogOpen = $state(false); // 그룹 채팅방 생성

	// ChatFavoritesDialog 상태
	let favoritesDialogOpen = $state(false);

	// 마지막으로 방문한 채팅 목록 탭 경로를 세션에 저장
	onMount(() => {
		if (typeof window === 'undefined') return;
		sessionStorage.setItem('chat:lastChatListPath', OPEN_CHAT_LIST_PATH);
	});

	// 채팅방으로 이동하면서 이전 탭 정보를 state 에 포함
	function navigateToRoom(path: string) {
		void goto(path, { state: { from: OPEN_CHAT_LIST_PATH } });
	}

	/**
	 * 방생성 버튼 클릭 핸들러
	 * ChatCreateDialog를 열어서 오픈 채팅방 생성
	 */
	function handleCreateRoom() {
		createDialogOpen = true;
	}

	/**
	 * 채팅방 생성 완료 핸들러
	 * 생성된 채팅방으로 자동 이동
	 */
	function handleRoomCreated(event: CustomEvent<{ roomId: string }>) {
		const { roomId } = event.detail;
		// console.log('✅ 채팅방 생성 완료, 이동:', roomId);
		navigateToRoom(`/chat/room?roomId=${roomId}`);
	}

	/**
	 * 친구 찾기 메뉴 클릭 핸들러
	 */
	function handleFindFriends() {
		// console.log('친구 찾기 메뉴 클릭됨');
		// TODO: 친구 찾기 기능 구현
	}

	/**
	 * 그룹챗 생성 메뉴 클릭 핸들러
	 * 그룹 채팅방 생성 다이얼로그를 엽니다.
	 */
	function handleCreateGroupChat() {
		groupChatDialogOpen = true;
	}

	/**
	 * 오픈챗 생성 메뉴 클릭 핸들러
	 * 오픈 채팅방 생성 다이얼로그를 엽니다.
	 */
	function handleCreateOpenChat() {
		createDialogOpen = true;
	}

	/**
	 * 즐겨찾기 메뉴 클릭 핸들러
	 * 즐겨찾기 다이얼로그를 엽니다.
	 */
	function handleBookmark() {
		favoritesDialogOpen = true;
	}

	/**
	 * 검색 메뉴 클릭 핸들러
	 */
	function handleSearch() {
		// console.log('검색 메뉴 클릭됨');
		// TODO: 검색 기능 구현
	}

	/**
	 * 즐겨찾기에서 채팅방 선택 핸들러
	 * 선택된 채팅방으로 이동합니다.
	 */
	function handleRoomSelected(event: CustomEvent<{ roomId: string }>) {
		const { roomId } = event.detail;
		navigateToRoom(`/chat/room?roomId=${roomId}`);
	}

	/**
	 * 채팅방 제목을 계산
	 */
	function resolveRoomTitle(room: ChatRoomData, fallback: string) {
		if (typeof room.name === 'string' && room.name.trim()) return room.name;
		if (typeof room.title === 'string' && room.title.trim()) return room.title;
		if (typeof room.roomName === 'string' && room.roomName.trim()) return room.roomName;

		return fallback;
	}

	/**
	 * 채팅방 설명을 계산
	 */
	function resolveRoomDescription(room: ChatRoomData): string {
		if (typeof room.description === 'string' && room.description.trim()) return room.description;
		if (typeof room.desc === 'string' && room.desc.trim()) return room.desc;
		return '';
	}

	/**
	 * 멤버 수를 계산
	 */
	function getMemberCount(room: ChatRoomData): number {
		if (typeof room.memberCount === 'number') return room.memberCount;
		if (typeof room.members === 'number') return room.members;
		return 0;
	}

	/**
	 * 채팅방 열기
	 */
	function openConversation(roomId: string) {
		if (roomId) {
			navigateToRoom(`/chat/room?roomId=${roomId}`);
		}
	}
</script>

<svelte:head>
	<title>{m.chatTabOpenChats()}</title>
</svelte:head>

<div class="space-y-4 sm:space-y-6">
	<section class="rounded-none border-none bg-transparent p-0 shadow-none md:rounded-2xl md:border md:border-gray-200 md:bg-white md:p-6 md:shadow-sm">
		<div class="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
			<div>
				<h1 class="text-2xl font-semibold text-gray-900">{m.chatTabOpenChats()}</h1>
				<p class="text-sm text-gray-500">누구나 참여할 수 있는 공개 채팅방 목록입니다</p>
			</div>
			{#if authStore.isAuthenticated && authStore.user?.uid}
				<p class="text-xs uppercase tracking-wide text-gray-400">
					UID: <span class="font-mono text-gray-600">{authStore.user.uid}</span>
				</p>
			{/if}
		</div>

		<!-- 채팅 목록 메뉴 컴포넌트 -->
		<ChatListMenu
			selectedTab="openChats"
			onCreateRoom={handleCreateRoom}
			onFindFriends={handleFindFriends}
			onCreateGroupChat={handleCreateGroupChat}
			onCreateOpenChat={handleCreateOpenChat}
			onBookmark={handleBookmark}
			onSearch={handleSearch}
		/>
	</section>

	{#if authStore.loading}
		<section class="rounded-2xl border border-gray-200 bg-white p-8 text-center text-gray-500 shadow-sm">
			<div class="mx-auto mb-3 h-10 w-10 animate-spin rounded-full border-2 border-gray-200 border-t-blue-500"></div>
			<p>{m.chatLoadingRooms()}</p>
		</section>
	{:else}
		<!-- 채팅 초대 목록 (초대가 있을 때만 자동으로 표시됨) -->
		{#if authStore.isAuthenticated}
			<ChatInvitationList />
		{/if}

		<section class="rounded-2xl border border-gray-200 bg-white p-0 shadow-sm">
			{#key CHAT_ROOMS_PATH}
				{@const dbListViewProps = {
					path: CHAT_ROOMS_PATH,
					pageSize: PAGE_SIZE,
					orderBy: ORDER_FIELD,
					threshold: 320,
					reverse: true
				}}
				<!--
					// console.log('🔍 [Open Chat List Debug] DatabaseListView props:', dbListViewProps)
				-->
				<DatabaseListView
					path={CHAT_ROOMS_PATH}
					pageSize={PAGE_SIZE}
					orderBy={ORDER_FIELD}
					threshold={320}
				>
				{#snippet item(itemData, index)}
					<!--
						// console.log('🔍 [Open Chat List Debug] Item received:', {
						// 	index,
						// 	key: itemData.key,
						// 	hasData: !!itemData.data,
						// 	data: itemData.data
						// })
					-->
					{@const room = (itemData.data ?? {}) as ChatRoomData}
					{@const roomId = (itemData.key ?? '') as string}
					{@const roomType = (room.type ?? 'open').toString()}
					{@const isOpen = roomType === 'open'}
					<!--
						// console.log('🔍 [Open Chat List Debug] Room data:', {
						// 	roomId,
						// 	roomType,
						// 	isOpen,
						// 	openListOrder: room.openListOrder,
						// 	name: room.name,
						// 	allFields: Object.keys(room)
						// })
					-->
					{@const lastMessage =
						typeof room.lastMessageText === 'string' && room.lastMessageText.trim()
							? room.lastMessageText
							: typeof room.lastMessage === 'string' && room.lastMessage.trim()
								? room.lastMessage
								: ''}
					{@const timestamp = Number(room.lastMessageAt ?? room.updatedAt ?? room.createdAt ?? 0) || null}
					{@const memberCount = getMemberCount(room)}
					{@const roomTitle = resolveRoomTitle(room, roomId || m.chatChatRoom())}
					{@const roomDescription = resolveRoomDescription(room)}
					<div class="flex w-full items-start border-b border-gray-100">
						<button
							type="button"
							class="flex flex-1 items-start gap-4 p-4 text-left transition hover:bg-gray-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
							onclick={() => openConversation(roomId)}
						>
							<div class="flex h-12 w-12 items-center justify-center rounded-full bg-gradient-to-br from-green-500 to-teal-500 text-sm font-semibold text-white shadow-sm">
								{roomTitle.slice(0, 2)}
							</div>

							<div class="flex-1 space-y-1">
								<div class="flex flex-wrap items-center gap-x-2 text-sm text-gray-500">
									<span class="rounded-full bg-green-100 px-2 py-0.5 text-xs font-semibold uppercase tracking-wide text-green-600">
										{resolveRoomTypeLabel(roomType)}
									</span>
									<span class="text-xs text-gray-400">#{roomId}</span>
									{#if memberCount > 0}
										<span class="rounded-full bg-gray-100 px-2 py-0.5 text-xs font-semibold text-gray-600">
											👥 {memberCount}명
										</span>
									{/if}
								</div>

								<h2 class="text-lg font-semibold text-gray-900">{roomTitle}</h2>

								{#if roomDescription}
									<p class="text-sm text-gray-500 line-clamp-1">{roomDescription}</p>
								{/if}

								{#if lastMessage}
									<p class="text-sm text-gray-500">
										<span class="font-medium text-gray-600">{m.chatLastMessageLabel()}:</span>
										<span class="ml-1 line-clamp-1">{lastMessage}</span>
									</p>
								{/if}

								{#if timestamp}
									<p class="text-xs text-gray-400">{formatLongDate(timestamp)}</p>
								{/if}
							</div>
						</button>
					</div>
				{/snippet}

				{#snippet loading()}
					<p class="py-6 text-center text-sm text-gray-500">{m.chatLoadingRooms()}</p>
				{/snippet}

				{#snippet empty()}
					<div class="py-12 text-center text-gray-500">
						<p class="text-sm">공개된 오픈 채팅방이 없습니다</p>
					</div>
				{/snippet}

				{#snippet loadingMore()}
					<p class="py-4 text-center text-xs uppercase tracking-wide text-gray-400">{m.chatLoadingMore()}</p>
				{/snippet}

				{#snippet noMore()}
					<p class="py-6 text-center text-xs uppercase tracking-wide text-gray-400">{m.chatUpToDate()}</p>
				{/snippet}
			</DatabaseListView>
			{/key}
		</section>
	{/if}
</div>

<!-- 그룹 채팅방 생성 다이얼로그 -->
<ChatCreateDialog type="group" bind:open={groupChatDialogOpen} on:created={handleRoomCreated} />

<!-- 오픈 채팅방 생성 다이얼로그 -->
<ChatCreateDialog type="open" bind:open={createDialogOpen} on:created={handleRoomCreated} />

<!-- 즐겨찾기 다이얼로그 -->
<ChatFavoritesDialog bind:open={favoritesDialogOpen} on:roomSelected={handleRoomSelected} />
```
