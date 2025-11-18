<script lang="ts">
	/**
	 * 홈 화면 좌측 사이드바
	 *
	 * 로그인 사용자의 상태, 팔로우 정보, 최근 사용자/오픈챗/활동, 언어 설정을 보여줍니다.
	 * 데이터는 Firebase Realtime Database 에서 읽어옵니다.
	 */

	import * as Card from '$lib/components/ui/card/index.js';
	import Avatar from '$lib/components/user/avatar.svelte';
	import { authStore } from '$lib/stores/auth.svelte';
	import { getLocale, setLocale, locales } from '$lib/paraglide/runtime';
	import { m } from '$lib/paraglide/messages';
	import { onMount, onDestroy } from 'svelte';
	import { rtdb } from '$lib/firebase';
	import { formatShortDate } from '$lib/functions/date.functions';
	import { createRealtimeStore } from '$lib/stores/database.svelte';
	import {
		get,
		limitToLast,
		onValue,
		orderByChild,
		query,
		ref,
		type DatabaseReference
	} from 'firebase/database';
import {
	UsersRound,
	UserRound,
	UserCheck,
	Heart,
	BarChart3,
	MessageSquare,
	Activity as ActivityIcon,
	Globe
} from 'lucide-svelte';

	const localeNames: Record<string, string> = {
		en: 'English',
		ko: '한국어',
		ja: '日本語',
		zh: '中文'
	};

	const localeFlags: Record<string, string> = {
		en: '🇺🇸',
		ko: '🇰🇷',
		ja: '🇯🇵',
		zh: '🇨🇳'
	};

	type UserPreview = {
		uid: string;
		displayName: string;
		photoUrl: string | null;
		sortRecentWithPhoto: number;
	};

	type OpenChatPreview = {
		roomId: string;
		roomName: string;
		description: string;
		memberCount: number;
		createdAt: number;
	};

	type RecentActivity = {
		messageId: string;
		text: string;
		category: string;
		createdAt: number;
	};

	let recentUsers: UserPreview[] = [];
	let isLoadingRecentUsers = true;
	let recentOpenChats: OpenChatPreview[] = [];
	let isLoadingRecentOpenChats = true;
	let recentActivities: RecentActivity[] = [];
	let isLoadingRecentActivity = true;

	let followerCount = 0;
	let followingCount = 0;
	let followersLoading = false;
	let followingLoading = false;

	let openChatsUnsubscribe: (() => void) | null = null;
	let activityUnsubscribe: (() => void) | null = null;
	let followerStoreCleanup: (() => void) | null = null;
	let followingStoreCleanup: (() => void) | null = null;

	function handleLocaleChange(event: Event) {
		const target = event.target as HTMLSelectElement;
		const newLocale = target.value as (typeof locales)[number];
		setLocale(newLocale);
	}

	function formatCount(value: number): string {
		return new Intl.NumberFormat().format(value);
	}

	async function fetchRecentUsers() {
		if (!rtdb) {
			isLoadingRecentUsers = false;
			recentUsers = [];
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
					sortRecentWithPhoto: Number(value?.sort_recentWithPhoto) || 0
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

	function teardownOpenChatListener() {
		if (openChatsUnsubscribe) {
			openChatsUnsubscribe();
			openChatsUnsubscribe = null;
		}
	}

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
				console.error('[Sidebar] 최근 오픈채팅 로드 실패:', error);
				recentOpenChats = [];
				isLoadingRecentOpenChats = false;
			}
		);
	}

	function teardownRecentActivityListener() {
		if (activityUnsubscribe) {
			activityUnsubscribe();
			activityUnsubscribe = null;
		}
	}

	function setupRecentActivityListener() {
		teardownRecentActivityListener();

		if (!rtdb) {
			recentActivities = [];
			isLoadingRecentActivity = false;
			return;
		}

		isLoadingRecentActivity = true;
		const messagesRef = ref(rtdb, 'chat-messages');
		const activityQuery = query(messagesRef, orderByChild('categoryOrder'), limitToLast(40));

		activityUnsubscribe = onValue(
			activityQuery,
			(snapshot) => {
				const items: RecentActivity[] = [];

				snapshot.forEach((child) => {
					const value = child.val() ?? {};
					if (value?.type !== 'post' || value?.deleted) {
						return;
					}

					const createdAtValue =
						Number(value?.createdAt) || resolveOrderValue(value?.categoryOrder);
					items.push({
						messageId: child.key ?? '',
						text: (value?.text as string) || '',
						category: (value?.category as string) || '',
						createdAt: Math.abs(createdAtValue)
					});
				});

				items.sort((a, b) => b.createdAt - a.createdAt);
				recentActivities = items.slice(0, 5);
				isLoadingRecentActivity = false;
			},
			(error) => {
				console.error('[Sidebar] 최근 활동 로드 실패:', error);
				recentActivities = [];
				isLoadingRecentActivity = false;
			}
		);
	}

	$effect(() => {
		const uid = authStore.user?.uid;

		if (!uid) {
			followerStoreCleanup?.();
			followingStoreCleanup?.();
			followerStoreCleanup = null;
			followingStoreCleanup = null;
			followerCount = 0;
			followingCount = 0;
			followersLoading = false;
			followingLoading = false;
			return;
		}

		followerStoreCleanup?.();
		const followerStore = createRealtimeStore<Record<string, unknown>>(`user-followers/${uid}`, {});
		followersLoading = true;
		const followerUnsubscribe = followerStore.subscribe((state) => {
			followersLoading = state.loading;
			followerCount = state.data ? Object.keys(state.data).length : 0;
		});
		followerStoreCleanup = () => {
			followerUnsubscribe();
			followerStore.unsubscribe();
		};

		followingStoreCleanup?.();
		const followingStore = createRealtimeStore<Record<string, unknown>>(`user-following/${uid}`, {});
		followingLoading = true;
		const followingUnsubscribe = followingStore.subscribe((state) => {
			followingLoading = state.loading;
			followingCount = state.data ? Object.keys(state.data).length : 0;
		});
		followingStoreCleanup = () => {
			followingUnsubscribe();
			followingStore.unsubscribe();
		};
	});

	onMount(() => {
		fetchRecentUsers();
		setupOpenChatListener();
		setupRecentActivityListener();

		return () => {
			teardownOpenChatListener();
			teardownRecentActivityListener();
		};
	});

	onDestroy(() => {
		followerStoreCleanup?.();
		followingStoreCleanup?.();
	});
</script>

<aside class="left-sidebar hidden lg:block">
		<div class="sidebar-inner flex flex-col gap-3">
			{#if authStore.user}
				<a href="/my/profile" class="profile-card flex items-center gap-3" aria-label={m.navMyProfile()}>
					<Avatar uid={authStore.user.uid} size={48} />
					<div class="profile-copy flex flex-col">
						<span class="profile-label">{m.homeSidebarProfileLabel()}</span>
						<span class="profile-name">{authStore.user.displayName || m.commonUser()}</span>
					</div>
				</a>
			{:else}
				<a href="/auth/sign-in" class="profile-card flex items-center gap-3" aria-label={m.navLogin()}>
					<div class="guest-avatar flex items-center justify-center">
						<UserRound class="guest-icon" aria-hidden="true" />
				</div>
					<div class="profile-copy flex flex-col">
						<span class="profile-label">{m.homeSidebarProfileLabel()}</span>
						<span class="profile-name">{m.navLogin()}</span>
					</div>
				</a>
			{/if}

			<div class="quick-link-stack rounded-xl bg-white/80 shadow-sm">
				<a href={authStore.user ? '/friend/followers' : '/auth/sign-in'} class="quick-link flex items-center gap-3" aria-label={m.homeSidebarFollowers()}>
					<span class="quick-link-icon flex items-center justify-center">
						<UserRound class="quick-link-icon-inner" aria-hidden="true" />
					</span>
					<div class="quick-link-main flex flex-col">
						<span class="quick-link-title">{m.homeSidebarFollowers()}</span>
					<span class="quick-link-desc">{m.homeSidebarFollowersDesc()}</span>
				</div>
					<span class="quick-link-count">
						{#if !authStore.user}
							-
						{:else if followersLoading}
							...
						{:else}
							{formatCount(followerCount)}
						{/if}
					</span>
				</a>

				<a href={authStore.user ? '/friend/following' : '/auth/sign-in'} class="quick-link flex items-center gap-3" aria-label={m.homeSidebarFollowing()}>
					<span class="quick-link-icon flex items-center justify-center">
						<UserCheck class="quick-link-icon-inner" aria-hidden="true" />
				</span>
				<div class="quick-link-main flex flex-col">
					<span class="quick-link-title">{m.homeSidebarFollowing()}</span>
					<span class="quick-link-desc">{m.homeSidebarFollowingDesc()}</span>
				</div>
					<span class="quick-link-count">
						{#if !authStore.user}
							-
						{:else if followingLoading}
							...
						{:else}
							{formatCount(followingCount)}
						{/if}
					</span>
				</a>

				<a href="/my/reactions" class="quick-link flex items-center gap-3" aria-label={m.homeSidebarReactions()}>
					<span class="quick-link-icon flex items-center justify-center">
						<Heart class="quick-link-icon-inner" aria-hidden="true" />
				</span>
				<div class="quick-link-main flex flex-col">
					<span class="quick-link-title">{m.homeSidebarReactions()}</span>
					<span class="quick-link-desc">{m.homeSidebarReactionsDesc()}</span>
				</div>
			</a>

			<a href="/my/stats" class="quick-link flex items-center gap-3" aria-label={m.homeSidebarStats()}>
				<span class="quick-link-icon flex items-center justify-center">
					<BarChart3 class="quick-link-icon-inner" aria-hidden="true" />
				</span>
				<div class="quick-link-main flex flex-col">
					<span class="quick-link-title">{m.homeSidebarStats()}</span>
					<span class="quick-link-desc">{m.homeSidebarStatsDesc()}</span>
				</div>
			</a>
		</div>

		<Card.Root class="sidebar-card">
			<Card.Header class="card-header flex items-center gap-2">
				<UsersRound class="section-icon" aria-hidden="true" />
				<Card.Title>{m.homeSectionRecentUsers()}</Card.Title>
			</Card.Header>
			<Card.Content class="space-y-3">
				<p class="card-subtitle">{m.homeSidebarRecentUsersSubtitle()}</p>

				{#if isLoadingRecentUsers}
					<p class="sidebar-placeholder-text">{m.homeSidebarRecentUsersLoading()}</p>
				{:else if recentUsers.length === 0}
					<p class="sidebar-placeholder-text">{m.homeSidebarRecentUsersEmpty()}</p>
				{:else}
					<ul class="space-y-2">
						{#each recentUsers as user (user.uid)}
							{@const joinedAt = Math.abs(user.sortRecentWithPhoto || 0)}
							<li class="recent-user-item flex items-center gap-3">
								<img src={user.photoUrl ?? ''} alt={user.displayName || 'recent user'} class="recent-user-avatar" loading="lazy" />
								<div class="recent-user-info flex flex-col">
									<span class="recent-user-name">{user.displayName || m.commonUser()}</span>
									{#if joinedAt}
										<span class="recent-user-joined">{formatShortDate(joinedAt)}</span>
									{/if}
								</div>
							</li>
						{/each}
					</ul>
				{/if}

				<a href="/user/list" class="see-more-button flex items-center justify-center">
					<span>{m.homeSidebarSeeMore()}</span>
				</a>
			</Card.Content>
		</Card.Root>

		<Card.Root class="sidebar-card">
			<Card.Header class="card-header flex items-center gap-2">
				<MessageSquare class="section-icon" aria-hidden="true" />
				<Card.Title>{m.homeSectionRecentOpenChat()}</Card.Title>
			</Card.Header>
			<Card.Content class="space-y-3">
				<p class="card-subtitle">{m.homeSidebarOpenChatSubtitle()}</p>
				{#if isLoadingRecentOpenChats}
					<p class="sidebar-placeholder-text">{m.homeSidebarOpenChatLoading()}</p>
				{:else if recentOpenChats.length === 0}
					<p class="sidebar-placeholder-text">{m.homeSidebarOpenChatEmpty()}</p>
				{:else}
					<ul class="space-y-2">
						{#each recentOpenChats as chat}
							<li>
								<a href={`/chat/room?roomId=${chat.roomId}`} class="open-chat-item flex flex-col gap-1" aria-label={chat.roomName}>
									<div class="open-chat-head flex items-center justify-between gap-2">
										<span class="open-chat-room">{chat.roomName}</span>
										{#if chat.createdAt}
											<span class="open-chat-time">{formatShortDate(chat.createdAt)}</span>
										{/if}
									</div>
									<p class="open-chat-body">
										{chat.description || m.homeSectionRecentOpenChatDesc()}
									</p>
									<p class="open-chat-meta">
										{m.homeSidebarMembersCount({ count: formatCount(chat.memberCount) })}
									</p>
								</a>
							</li>
						{/each}
					</ul>
				{/if}
			</Card.Content>
		</Card.Root>

		<Card.Root class="sidebar-card">
			<Card.Header class="card-header flex items-center gap-2">
				<ActivityIcon class="section-icon" aria-hidden="true" />
				<Card.Title>{m.homeSidebarActivityTitle()}</Card.Title>
			</Card.Header>
			<Card.Content class="space-y-3">
				{#if isLoadingRecentActivity}
					<p class="sidebar-placeholder-text">{m.commonLoading()}</p>
				{:else if recentActivities.length === 0}
					<p class="sidebar-placeholder-text">{m.homeSidebarActivityEmpty()}</p>
				{:else}
					<ul class="space-y-2">
						{#each recentActivities as activity}
							<li class="activity-item flex flex-col gap-1">
								<div class="activity-meta flex items-center justify-between gap-2">
									<span class="activity-category">{activity.category || 'post'}</span>
									{#if activity.createdAt}
										<span class="activity-time">{formatShortDate(activity.createdAt)}</span>
									{/if}
								</div>
								<p class="activity-text">
									{activity.text || m.homeSidebarActivityNoText()}
								</p>
							</li>
						{/each}
					</ul>
				{/if}
			</Card.Content>
		</Card.Root>

		<div class="language-row flex items-center gap-3">
			<div class="language-label flex items-center gap-2">
				<Globe class="language-icon" aria-hidden="true" />
				<span>{m.homeSidebarLanguageLabel()}</span>
			</div>
			<select
				value={getLocale()}
				onchange={handleLocaleChange}
				class="language-select flex-1"
				aria-label={m.homeSidebarLanguageLabel()}
			>
				{#each locales as locale}
					<option value={locale}>
						{localeFlags[locale] || ''} {localeNames[locale] || locale}
					</option>
				{/each}
			</select>
		</div>
	</div>
</aside>

<style>
	@import 'tailwindcss' reference;

	.left-sidebar {
		@apply lg:w-64 xl:w-72;
	}

	.sidebar-inner {
		@apply sticky top-20;
	}

	.profile-card {
		@apply rounded-xl bg-white/90 px-3 py-2 shadow-sm transition-all duration-200;
		@apply hover:bg-white cursor-pointer;
	}

	.profile-label {
		@apply text-xs font-medium text-gray-500;
	}

	.profile-name {
		@apply text-base font-semibold text-gray-900;
	}

	.guest-avatar {
		@apply h-12 w-12 rounded-full bg-gray-100;
	}

	.guest-icon {
		@apply h-5 w-5 text-gray-500;
	}

	.quick-link-stack {
		@apply flex flex-col gap-1 p-2;
	}

	.quick-link {
		@apply rounded-lg px-3 py-2 transition-colors duration-200;
		@apply hover:bg-gray-50 cursor-pointer;
	}

	.quick-link-icon {
		@apply h-10 w-10 rounded-full bg-gray-100;
	}

	.quick-link-icon-inner {
		@apply h-5 w-5 text-gray-600;
	}

	.quick-link-title {
		@apply text-sm font-semibold text-gray-900;
	}

	.quick-link-desc {
		@apply text-xs text-gray-500;
	}

	.quick-link-count {
		@apply text-sm font-semibold text-gray-600;
	}

	.sidebar-card {
		@apply rounded-xl bg-white/90 shadow-sm transition-shadow duration-200 hover:shadow;
	}

	.card-header {
		@apply items-center;
	}

	.section-icon {
		@apply h-4 w-4 text-gray-500;
	}

	.card-subtitle {
		@apply text-xs font-medium text-gray-500;
	}

	.sidebar-placeholder-text {
		@apply text-sm text-gray-500;
	}

	.recent-user-item {
		@apply rounded-xl border border-transparent px-2 py-1.5 transition-colors duration-200;
		@apply hover:border-gray-200;
	}

	.recent-user-avatar {
		@apply h-9 w-9 rounded-full object-cover;
	}

	.recent-user-name {
		@apply text-sm font-semibold text-gray-800;
	}

	.recent-user-joined {
		@apply text-xs text-gray-500;
	}

	.see-more-button {
		@apply rounded-lg px-3 py-2 text-sm font-semibold text-gray-700 transition-colors duration-200;
		@apply hover:bg-gray-50 cursor-pointer;
	}

	.open-chat-item {
		@apply rounded-xl border border-gray-100 px-3 py-2 transition-colors duration-200;
		@apply hover:border-blue-200 hover:bg-blue-50;
	}

	.open-chat-room {
		@apply text-sm font-semibold text-gray-900;
	}

	.open-chat-time {
		@apply text-xs text-gray-500;
	}

	.open-chat-body {
		@apply text-xs text-gray-600;
	}

	.open-chat-meta {
		@apply text-xs font-medium text-blue-600;
	}

	.activity-item {
		@apply rounded-xl border border-gray-100 px-3 py-2;
	}

	.activity-category {
		@apply text-xs font-semibold uppercase tracking-wide text-gray-500;
	}

	.activity-time {
		@apply text-xs text-gray-500;
	}

	.activity-text {
		@apply text-sm text-gray-800;
	}

	.language-row {
		@apply rounded-xl bg-white/90 px-4 py-3 shadow-sm;
	}

	.language-label {
		@apply text-sm font-semibold text-gray-900;
	}

	.language-icon {
		@apply h-4 w-4 text-gray-500;
	}

	.language-select {
		@apply rounded-xl border border-transparent bg-white px-3 py-2 text-sm font-medium text-gray-900 shadow-sm transition duration-200;
		@apply hover:bg-blue-50 focus:outline-none focus:ring-2 focus:ring-blue-200 cursor-pointer;
	}
</style>
