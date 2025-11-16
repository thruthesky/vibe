<script lang="ts">
	/**
	 * 좌측 사이드바 컴포넌트
	 *
	 * 데스크톱에서만 표시되는 좌측 네비게이션/메뉴 영역입니다.
	 * TailwindCSS를 사용하여 스타일링합니다.
	 * Paraglide-JS를 사용하여 다국어 메시지를 자동으로 처리합니다.
	 */

	import * as Card from '$lib/components/ui/card/index.js';
	import { onMount, onDestroy } from 'svelte';
	import { BUILD_VERSION } from '$lib/version';
	import { getLocale, setLocale, locales } from '$lib/paraglide/runtime';
	import { m } from '$lib/paraglide/messages';
	import { page } from '$app/stores';
	import { authStore } from '$lib/stores/auth.svelte';
	import { rtdb } from '$lib/firebase';
	import { formatShortDate } from '$lib/functions/date.functions';
	import { get, limitToLast, onValue, orderByChild, query, ref, type DatabaseReference } from 'firebase/database';

	// 언어 이름 매핑
	const localeNames: Record<string, string> = {
		en: 'English',
		ko: '한국어',
		ja: '日本語',
		zh: '中文'
	};

const devHighlights = [
	{ order: '8', label: () => m.sidebarDevHighlightWrapUp() },
	{ order: '9', label: () => m.sidebarDevHighlightAttachment() },
	{ order: '10', label: () => m.sidebarDevHighlightPassword() }
];

	type UserPreview = {
		uid: string;
		displayName: string;
		photoUrl: string | null;
		sortRecentWithPhoto: number;
	};

	type OpenChatPreview = {
		roomId: string;
		roomName: string;
		lastMessageText: string;
		lastMessageAt: number;
		orderValue: number;
	};

	let recentUsers: UserPreview[] = [];
	let isLoadingRecentUsers = true;
	let recentOpenChats: OpenChatPreview[] = [];
	let isLoadingRecentOpenChats = true;
	let userUid: string | null = null;
	let openChatsUnsubscribe: (() => void) | null = null;

	/**
	 * 현재 경로가 주어진 경로와 일치하는지 확인
	 */
	function isActivePath(href: string): boolean {
		return $page.url.pathname === href;
	}

	/**
	 * 언어 변경 핸들러
	 *
	 * setLocale()이 자동으로 쿠키 저장 및 페이지 새로고침을 처리합니다.
	 */
	function handleLocaleChange(event: Event) {
		const target = event.target as HTMLSelectElement;
		const newLocale = target.value as (typeof locales)[number];

		// Paraglide 런타임 로케일 업데이트
		// - 자동으로 쿠키에 저장
		// - 기본값으로 페이지 새로고침하여 모든 메시지 업데이트
		setLocale(newLocale);
	}

	async function fetchRecentUsers() {
		if (!rtdb) {
			isLoadingRecentUsers = false;
			return;
		}

		try {
			const usersRef: DatabaseReference = ref(rtdb, 'users');
			const recentQuery = query(usersRef, orderByChild('sort_recentWithPhoto'), limitToLast(5));
			const snapshot = await get(recentQuery);
			const users: UserPreview[] = [];

			snapshot.forEach((child) => {
				const value = child.val();
				users.push({
					uid: child.key ?? '',
					displayName: value?.displayName ?? '',
					photoUrl: value?.photoUrl ?? null,
					sortRecentWithPhoto: value?.sort_recentWithPhoto ?? 0
				});
			});

			users.sort((a, b) => (b.sortRecentWithPhoto ?? 0) - (a.sortRecentWithPhoto ?? 0));
			recentUsers = users.filter((user) => Boolean(user.photoUrl));
		} catch (error) {
			console.error('[Sidebar] 최근 사용자 로드 실패:', error);
			recentUsers = [];
		} finally {
			isLoadingRecentUsers = false;
		}
	}

	function resolveOrderValue(value: unknown): number {
		if (typeof value === 'number') {
			return value;
		}

		if (typeof value === 'string') {
			let boost = 0;
			let normalized = value;

			if (value.startsWith('500')) {
				boost = 2;
				normalized = value.slice(3);
			} else if (value.startsWith('200')) {
				boost = 1;
				normalized = value.slice(3);
			}

			const base = Number.parseInt(normalized, 10);
			return boost * 1e15 + (Number.isFinite(base) ? base : 0);
		}

		return 0;
	}

	function teardownOpenChatListener() {
		if (openChatsUnsubscribe) {
			openChatsUnsubscribe();
			openChatsUnsubscribe = null;
		}
	}

	function setupOpenChatListener() {
		teardownOpenChatListener();

		if (!userUid || !rtdb) {
			recentOpenChats = [];
			isLoadingRecentOpenChats = false;
			return;
		}

		isLoadingRecentOpenChats = true;

		const joinsRef = ref(rtdb, `chat-joins/${userUid}`);
		const openQuery = query(joinsRef, orderByChild('openChatListOrder'), limitToLast(5));

		openChatsUnsubscribe = onValue(
			openQuery,
			(snapshot) => {
				const items: OpenChatPreview[] = [];

				snapshot.forEach((child) => {
					const value = child.val() ?? {};

					if (value?.roomType !== 'open') {
						return;
					}

					const orderValue = resolveOrderValue(value?.openChatListOrder);
					const roomId = child.key ?? '';

					items.push({
						roomId,
						roomName: (value?.roomName as string) || roomId || 'Open Chat',
						lastMessageText: (value?.lastMessageText as string) || '',
						lastMessageAt: Number(value?.lastMessageAt) || 0,
						orderValue
					});
				});

				items.sort((a, b) => b.orderValue - a.orderValue);
				recentOpenChats = items.slice(0, 5);
				isLoadingRecentOpenChats = false;
			},
			(error) => {
				console.error('[Sidebar] 최근 오픈 채팅 구독 실패:', error);
				recentOpenChats = [];
				isLoadingRecentOpenChats = false;
			}
		);
	}

	onMount(() => {
		fetchRecentUsers();

		return () => {
			teardownOpenChatListener();
		};
	});

	// authStore.user 변화를 감지하여 오픈 채팅 리스너 재설정
	$effect(() => {
		const nextUid = authStore.user?.uid ?? null;
		if (nextUid === userUid) return;
		userUid = nextUid;
		setupOpenChatListener();
	});

	onDestroy(() => {
		teardownOpenChatListener();
	});
</script>

<aside class="hidden lg:block lg:w-64 xl:w-72">
	<div class="sticky top-20 space-y-4">
		<!-- 네비게이션 메뉴 -->
		<Card.Root class="sidebar-card">
			<Card.Header>
				<Card.Title class="flex items-center gap-2 text-base">
					<svg class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
						<path
							stroke-linecap="round"
							stroke-linejoin="round"
							stroke-width="2"
							d="M4 6h16M4 12h16M4 18h16"
						/>
					</svg>
					{m.sidebarMenu()}
				</Card.Title>
			</Card.Header>
			<Card.Content class="space-y-1">
				<a href="/" class="nav-link" class:active={isActivePath('/')}>
					<svg class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
						<path
							stroke-linecap="round"
							stroke-linejoin="round"
							stroke-width="2"
							d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"
						/>
					</svg>
					{m.navHome()}
				</a>
			</Card.Content>
		</Card.Root>

		<!-- 최근 사용자 카드 -->
		<Card.Root class="sidebar-card">
			<Card.Header>
				<Card.Title class="flex items-center gap-2 text-base">
					<svg class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
						<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0zM4 21v-2a4 4 0 014-4h8a4 4 0 014 4v2" />
					</svg>
					{m.homeSectionRecentUsers()}
				</Card.Title>
			</Card.Header>
			<Card.Content>
				{#if isLoadingRecentUsers}
					<p class="sidebar-placeholder-text">{m.commonLoading()}</p>
				{:else if recentUsers.length === 0}
					<p class="sidebar-placeholder-text">{m.homeSectionRecentUsersDesc()}</p>
				{:else}
					<div class="stacked-wrapper">
						<div class="stacked-avatars" aria-label={m.homeSectionRecentUsers()}>
							{#each recentUsers as user, index (user.uid)}
								<img
									src={user.photoUrl ?? ''}
									alt={user.displayName || 'recent user'}
									class="stacked-avatar"
									style={`z-index: ${recentUsers.length - index};`}
									loading="lazy"
								/>
							{/each}
						</div>
						<p class="stacked-caption">
							{m.homeSectionRecentUsersCount({ count: recentUsers.length })}
						</p>
					</div>
				{/if}
			</Card.Content>
		</Card.Root>

		<!-- 최근 오픈 채팅 -->
		<Card.Root class="sidebar-card">
			<Card.Header>
				<Card.Title class="flex items-center gap-2 text-base">
					<svg class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
						<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 8h10M7 12h4m1 8a9 9 0 100-18 9 9 0 000 18z" />
					</svg>
					{m.homeSectionRecentOpenChat()}
				</Card.Title>
			</Card.Header>
			<Card.Content>
				{#if !userUid}
					<p class="sidebar-placeholder-text">{m.homeSectionRecentOpenChatLogin()}</p>
				{:else if isLoadingRecentOpenChats}
					<p class="sidebar-placeholder-text">{m.commonLoading()}</p>
				{:else if recentOpenChats.length === 0}
					<p class="sidebar-placeholder-text">{m.homeSectionRecentOpenChatEmpty()}</p>
				{:else}
					<ul class="sidebar-open-chat-list">
						{#each recentOpenChats as chat}
							<li class="sidebar-open-chat-item">
								<div class="open-chat-head">
									<span class="open-chat-room">{chat.roomName}</span>
									{#if chat.lastMessageAt}
										<span class="open-chat-time">{formatShortDate(chat.lastMessageAt)}</span>
									{/if}
								</div>
								<p class="open-chat-body">
									{chat.lastMessageText || m.homeOpenChatNoMessage()}
								</p>
							</li>
						{/each}
					</ul>
				{/if}
			</Card.Content>
		</Card.Root>

		<!-- 정보 카드 -->
		<Card.Root class="sidebar-card">
			<Card.Header>
				<Card.Title class="flex items-center gap-2 text-base">
					<svg class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
						<path
							stroke-linecap="round"
							stroke-linejoin="round"
							stroke-width="2"
							d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
						/>
					</svg>
					{m.sidebarRecentActivity()}
				</Card.Title>
			</Card.Header>
			<Card.Content>
				<p class="activity-text">{m.sidebarNoRecentActivity()}</p>
			</Card.Content>
		</Card.Root>

		<!-- 개발일지 & TODO 카드 -->
		<Card.Root class="sidebar-card">
			<Card.Header>
				<Card.Title class="flex items-center gap-2 text-base">
					<svg class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
						<path
							stroke-linecap="round"
							stroke-linejoin="round"
							stroke-width="2"
							d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
						/>
					</svg>
					개발일지
				</Card.Title>
			</Card.Header>
			<Card.Content class="space-y-3">
				<a href="/dev/plan" class="dev-link" class:active={isActivePath('/dev/plan')}>
					<svg class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
						<path
							stroke-linecap="round"
							stroke-linejoin="round"
							stroke-width="2"
							d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01"
						/>
					</svg>
					개발 계획
				</a>

				<!-- 최근 추가된 기능 요약 -->
				<div class="dev-summary">
					<div class="dev-summary-header">
						<svg class="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
							<path
								stroke-linecap="round"
								stroke-linejoin="round"
								stroke-width="2"
								d="M12 4v16m8-8H4"
							/>
						</svg>
						<span>{m.sidebarUpcomingTodos()}</span>
					</div>
					<ul class="dev-feature-list">
						{#each devHighlights as highlight}
							<li>
								<span class="feature-number">{highlight.order}</span>
								<span class="feature-name">{highlight.label()}</span>
							</li>
						{/each}
					</ul>
				</div>
			</Card.Content>
		</Card.Root>

		<!-- 언어 선택 드롭다운 -->
		<Card.Root class="sidebar-card">
			<Card.Header>
				<Card.Title class="flex items-center gap-2 text-base">
					<svg class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
						<path
							stroke-linecap="round"
							stroke-linejoin="round"
							stroke-width="2"
							d="M3 5h12M9 3v2m1.048 9.5A18.022 18.022 0 016.412 9m6.088 9h7M11 21l5-10 5 10M12.751 5C11.783 10.77 8.07 15.61 3 18.129"
						/>
					</svg>
					{m.sidebarSelectLanguage()}
				</Card.Title>
			</Card.Header>
			<Card.Content>
				<select
					value={getLocale()}
					onchange={handleLocaleChange}
					class="language-select"
					aria-label={m.sidebarSelectLanguage()}
				>
					{#each locales as locale}
						<option value={locale}>
							{localeNames[locale] || locale}
						</option>
					{/each}
				</select>
			</Card.Content>
		</Card.Root>

		<!-- 빌드 버전 정보 -->
		<Card.Root class="sidebar-card version-card">
			<Card.Header>
				<Card.Title class="flex items-center gap-2 text-base">
					<svg class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
						<path
							stroke-linecap="round"
							stroke-linejoin="round"
							stroke-width="2"
							d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4"
						/>
					</svg>
					{m.sidebarBuildVersion()}
				</Card.Title>
			</Card.Header>
			<Card.Content>
				<p class="version-text">{BUILD_VERSION}</p>
			</Card.Content>
		</Card.Root>
	</div>
</aside>

<style>
	@import 'tailwindcss' reference;

	/* 사이드바 카드 스타일 */
	.sidebar-card {
		@apply shadow-md transition-shadow duration-300 hover:shadow-lg;
	}

	/* 네비게이션 링크 스타일 */
	.nav-link {
		@apply flex cursor-pointer items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-gray-700 transition-all duration-200 hover:bg-blue-50 hover:text-blue-600;
	}

	.nav-link.active {
		@apply bg-gradient-to-r from-blue-50 to-blue-100 text-blue-700 shadow-sm;
		border-left: 3px solid theme('colors.blue.600');
		padding-left: calc(0.75rem - 3px);
	}

	/* 개발 링크 스타일 */
	.dev-link {
		@apply flex cursor-pointer items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-gray-700 transition-all duration-200 hover:bg-indigo-50 hover:text-indigo-600;
	}

	.dev-link.active {
		@apply bg-gradient-to-r from-indigo-50 to-indigo-100 text-indigo-700 shadow-sm;
		border-left: 3px solid theme('colors.indigo.600');
		padding-left: calc(0.75rem - 3px);
	}

	.sidebar-placeholder-text {
		@apply text-sm text-gray-500;
	}

	.stacked-wrapper {
		@apply flex flex-col gap-3;
	}

	.stacked-avatars {
		@apply flex items-center;
	}

	.stacked-avatar {
		@apply h-10 w-10 rounded-full border-2 border-white object-cover shadow ring-1 ring-gray-200;
		margin-left: -0.5rem;
	}

	.stacked-avatar:first-child {
		margin-left: 0;
	}

	.stacked-caption {
		@apply text-xs font-medium text-gray-700;
	}

	.sidebar-open-chat-list {
		@apply space-y-3;
	}

	.sidebar-open-chat-item {
		@apply rounded-lg border border-blue-100 bg-blue-50/80 p-3 shadow-sm;
	}

	.open-chat-head {
		@apply flex items-center justify-between gap-2;
	}

	.open-chat-room {
		@apply text-sm font-semibold text-blue-900;
	}

	.open-chat-time {
		@apply text-xs text-gray-500;
	}

	.open-chat-body {
		@apply mt-1 text-xs text-gray-700;
	}

	/* 개발 기능 요약 스타일 */
	.dev-summary {
		@apply rounded-lg bg-gradient-to-br from-indigo-50 to-purple-50 p-3 space-y-2;
	}

	.dev-summary-header {
		@apply flex items-center gap-2 text-xs font-semibold text-indigo-700 uppercase tracking-wide;
	}

	.dev-feature-list {
		@apply space-y-1.5;
	}

	.dev-feature-list li {
		@apply flex items-center gap-2 text-sm text-gray-700;
	}

	.feature-number {
		@apply flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-indigo-600 text-xs font-bold text-white;
	}

	.feature-name {
		@apply text-xs font-medium text-gray-800;
	}

	/* TODO 요약 카드 */
	/* 활동 텍스트 스타일 */
	.activity-text {
		@apply text-sm text-gray-500 italic;
	}

	/* 언어 선택 드롭다운 스타일 */
	.language-select {
		@apply w-full cursor-pointer rounded-lg border-2 border-gray-300 bg-white px-3 py-2.5 text-sm font-medium text-gray-900 shadow-sm transition-all duration-200 hover:border-blue-400 hover:shadow focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/50;
	}

	/* 버전 카드 스타일 */
	.version-card {
		@apply bg-gradient-to-br from-gray-50 to-blue-50;
	}

	/* 버전 텍스트 스타일 */
	.version-text {
		@apply rounded-md bg-white px-3 py-2 text-center text-sm font-mono font-semibold text-blue-600 shadow-sm;
	}
</style>
