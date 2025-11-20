<script lang="ts">
	/**
	 * 채팅방 목록 페이지
	 *
	 * DatabaseListView를 사용하여 내가 참여한 채팅방 목록을 무한 스크롤로 표시합니다.
	 */

	import DatabaseListView from '$lib/components/DatabaseListView.svelte';
	import UserSearchDialog from '$lib/components/user/UserSearchDialog.svelte';
	import ChatCreateDialog from '$lib/components/chat/ChatCreateDialog.svelte';
	import ChatInvitationList from '$lib/components/chat/ChatInvitationList.svelte';
	import ChatListItem from '$lib/components/chat/ChatListItem.svelte';
	import { authStore } from '$lib/stores/auth.svelte';
	import { goto } from '$app/navigation';
	import { m } from '$lib/paraglide/messages';
	import { togglePinChatRoom } from '$lib/functions/chat.functions';
	import ChatListMenu from '$lib/components/chat/ChatListMenu.svelte';
	import ChatFavoritesDialog from '$lib/components/chat/ChatFavoritesDialog.svelte';
	import { rtdb } from '$lib/firebase';
	import { onMount } from 'svelte';

	type ChatJoinData = Record<string, unknown>;
	type UserData = Record<string, unknown>;

	const PAGE_SIZE = 20;
	const JOIN_ORDER_FIELD = 'singleChatListOrder';
	const CHAT_LIST_PATH = '/chat/list';

	// UserSearchDialog 상태
	let userSearchOpen = $state(false);
	let searchKeyword = $state('');

	// ChatFavoritesDialog 상태
	let favoritesDialogOpen = $state(false);

	// ChatCreateDialog 상태
	let groupChatDialogOpen = $state(false);
	let openChatDialogOpen = $state(false);

	// 마지막으로 방문한 채팅 목록 탭 경로를 세션에 저장
	onMount(() => {
		if (typeof window === 'undefined') return;
		sessionStorage.setItem('chat:lastChatListPath', CHAT_LIST_PATH);
	});

	// 채팅방으로 이동하면서 이전 탭 정보를 state 에 포함
	function navigateToRoom(path: string) {
		void goto(path, { state: { from: CHAT_LIST_PATH } });
	}

	/**
	 * 방생성 버튼 클릭 핸들러
	 */
	function handleCreateRoom() {
		// console.log('방생성 버튼 클릭됨');
		// TODO: 방생성 기능 구현
	}

	/**
	 * 친구 찾기 메뉴 클릭 핸들러
	 * UserSearchDialog를 열어서 사용자 검색
	 */
	function handleFindFriends() {
		userSearchOpen = true;
	}

	/**
	 * 사용자 선택 핸들러
	 * 선택된 사용자와 1:1 채팅방으로 이동
	 */
	function handleUserSelect(event: CustomEvent<{ user: UserData; uid: string }>) {
		const { uid } = event.detail;
		// console.log('선택된 사용자:', event.detail);
		// 1:1 채팅방으로 이동
		navigateToRoom(`/chat/room?uid=${uid}`);
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
		openChatDialogOpen = true;
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
	 * 채팅방 생성 완료 핸들러
	 * 생성된 채팅방으로 자동 이동
	 */
	function handleRoomCreated(event: CustomEvent<{ roomId: string }>) {
		const { roomId } = event.detail;
		// console.log('✅ 채팅방 생성 완료, 이동:', roomId);
		navigateToRoom(`/chat/room?roomId=${roomId}`);
	}

	/**
	 * 채팅방 핀 토글 핸들러
	 * 클릭 시 채팅방을 핀하거나 핀 해제합니다
	 */
	async function handleTogglePin(
		event: MouseEvent,
		roomId: string,
		roomType: string
	): Promise<void> {
		event.stopPropagation(); // 버튼 클릭 이벤트 전파 방지

		const uid = authStore.user?.uid;
		if (!uid) {
			console.error('사용자 인증 정보가 없습니다');
			return;
		}

		if (!rtdb) {
			console.error('Database가 초기화되지 않았습니다');
			return;
		}

		try {
			const isPinned = await togglePinChatRoom(rtdb, roomId, uid, roomType);
			// console.log(`✅ 채팅방 핀 ${isPinned ? '설정' : '해제'} 완료:`, roomId);
		} catch (error) {
			console.error('채팅방 핀 토글 실패:', error);
		}
	}

	// 현재 로그인 사용자의 chat-joins 경로
	const chatJoinPath = $derived.by(() => {
		const uid = authStore.user?.uid;
		const path = uid ? `chat-joins/${uid}` : '';
		// console.log('🔍 [Chat List Debug] User UID:', uid);
		// console.log('🔍 [Chat List Debug] Chat join path:', path);
		return path;
	});

	/**
	 * 채팅방 열기
	 */
	function openConversation(join: ChatJoinData, roomId: string) {
		const normalizedType = (join.roomType ?? join.type ?? 'single')
			.toString()
			.toLowerCase();

		const partnerUid: string | undefined =
			typeof join.partnerUid === 'string' ? join.partnerUid
			: typeof join.targetUid === 'string' ? join.targetUid
			: undefined;

		if (normalizedType.includes('single') && partnerUid) {
			navigateToRoom(`/chat/room?uid=${partnerUid}`);
			return;
		}

		if (roomId) {
			navigateToRoom(`/chat/room?roomId=${roomId}`);
		}
	}
</script>

<svelte:head>
	<title>{m.pageTitleChat()}</title>
</svelte:head>

<div class="space-y-4 sm:space-y-6">
	<section class="rounded-none border-none bg-transparent p-0 shadow-none md:rounded-2xl md:border md:border-gray-200 md:bg-white md:p-6 md:shadow-sm">
		<div class="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
			<div>
				<h1 class="text-2xl font-semibold text-gray-900">{m.chatMyRoomsTitle()}</h1>
				<p class="text-sm text-gray-500">{m.chatMyRoomsDesc()}</p>
			</div>
			{#if authStore.isAuthenticated && authStore.user?.uid}
				<p class="text-xs uppercase tracking-wide text-gray-400">
					UID: <span class="font-mono text-gray-600">{authStore.user.uid}</span>
				</p>
			{/if}
		</div>

		<!-- 채팅 목록 메뉴 컴포넌트 -->
		<ChatListMenu
			selectedTab="friends"
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
	{:else if !authStore.isAuthenticated}
		<section class="rounded-2xl border border-gray-200 bg-white p-8 text-center shadow-sm">
			<p class="text-lg font-semibold text-gray-800">{m.chatSignInRequired()}</p>
			<p class="mt-2 text-sm text-gray-500">{m.chatSignInToSend()}</p>
		</section>
	{:else if !chatJoinPath}
		<section class="rounded-2xl border border-gray-200 bg-white p-8 text-center shadow-sm">
			<p class="text-sm text-gray-500">{m.chatSelectConversation()}</p>
		</section>
	{:else}
		<!-- 채팅 초대 목록 (초대가 있을 때만 자동으로 표시됨) -->
		<ChatInvitationList />

		<section class="rounded-2xl border border-gray-200 bg-white p-0 shadow-sm">
			{#key chatJoinPath}
				{@const dbListViewProps = {
					path: chatJoinPath,
					pageSize: PAGE_SIZE,
					orderBy: JOIN_ORDER_FIELD,
					threshold: 320,
					reverse: true
				}}
				{#if chatJoinPath}
					<!--
						// console.log('🔍 [Chat List Debug] DatabaseListView props:', dbListViewProps)
					-->
				{/if}
				<DatabaseListView
					path={chatJoinPath}
					pageSize={PAGE_SIZE}
					orderBy={JOIN_ORDER_FIELD}
					threshold={320}
				>
					{#snippet item(itemData, index)}
						{@const join = (itemData.data ?? {}) as ChatJoinData}
						{@const roomId = (join.roomId ?? itemData.key ?? '') as string}
						{@const roomType = (join.roomType ?? join.type ?? 'single').toString()}
						<ChatListItem
							{join}
							{roomId}
							onclick={() => openConversation(join, roomId)}
							onTogglePin={(e) => handleTogglePin(e, roomId, roomType)}
						/>
					{/snippet}

					{#snippet loading()}
						<p class="py-6 text-center text-sm text-gray-500">{m.chatLoadingRooms()}</p>
					{/snippet}

					{#snippet empty()}
						<div class="py-12 text-center text-gray-500">
							<p class="text-sm">{m.chatEmptyRooms()}</p>
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

<!-- 사용자 검색 다이얼로그 -->
<UserSearchDialog
	bind:open={userSearchOpen}
	bind:keyword={searchKeyword}
	showResults={true}
	title="친구 찾기"
	description="사용자를 검색하여 1:1 채팅을 시작하세요."
	label="사용자 이름"
	placeholder="검색할 사용자 이름을 입력하세요"
	on:userSelect={handleUserSelect}
/>

<!-- 그룹 채팅방 생성 다이얼로그 -->
<ChatCreateDialog type="group" bind:open={groupChatDialogOpen} on:created={handleRoomCreated} />

<!-- 오픈 채팅방 생성 다이얼로그 -->
<ChatCreateDialog type="open" bind:open={openChatDialogOpen} on:created={handleRoomCreated} />

<!-- 즐겨찾기 다이얼로그 -->
<ChatFavoritesDialog bind:open={favoritesDialogOpen} on:roomSelected={handleRoomSelected} />
