<script lang="ts">
	/**
	 * 탑바 (상단 네비게이션 바) 컴포넌트
	 *
	 * 사용자 로그인 상태에 따라 다른 메뉴를 표시하는 반응형 네비게이션 바입니다.
	 * TailwindCSS와 shadcn-svelte Button 컴포넌트를 사용합니다.
	 *
	 * v1.0.0:
	 * - 새 메시지 알림 배지 추가: /users/{uid}/newMessageCount 실시간 구독
	 * - 사용자 프로필 사진에 빨간 배지로 읽지 않은 메시지 수 표시
	 */

	import { Button } from '$lib/components/ui/button/index.js';
	import { authStore } from '$lib/stores/auth.svelte';
	import { signOut } from 'firebase/auth';
	import { auth, rtdb } from '$lib/firebase';
	import { goto } from '$app/navigation';
	import Avatar from '$lib/components/user/avatar.svelte';
	import { m } from '$lib/paraglide/messages';
	import { rtdbStore } from '$lib/stores/database.svelte';

	// 로그아웃 처리 중 상태
	let isSigningOut = $state(false);
	let searchKeyword = $state('');

	// v1.0.0: 새 메시지 카운트 실시간 구독
	let newMessageCountStore = $state<ReturnType<typeof rtdbStore<number>> | null>(null);
	let newMessageCount = $state(0);

	/**
	 * v1.0.0: 로그인 상태에 따라 newMessageCount 구독
	 */
	$effect(() => {
		if (authStore.isAuthenticated && authStore.user?.uid) {
			const path = `users/${authStore.user.uid}/newMessageCount`;
			newMessageCountStore = rtdbStore<number>(path);
			// console.log(`📊 새 메시지 카운트 구독 시작: ${path}`);
		} else {
			newMessageCountStore = null;
			newMessageCount = 0;
			// console.log('📊 새 메시지 카운트 구독 해제 (로그아웃)');
		}
	});

	/**
	 * v1.0.0: 새 메시지 개수 추출
	 * Svelte store를 구독하여 reactive 변수에 값 저장
	 */
	$effect(() => {
		if (!newMessageCountStore) {
			newMessageCount = 0;
			return;
		}

		// Svelte store를 구독 ($로 시작하는 변수 사용 불가 → untrack 사용)
		const unsubscribe = newMessageCountStore.subscribe((state) => {
			const count = state.data ?? 0;
			newMessageCount = typeof count === 'number' ? count : 0;
		});

		return () => unsubscribe();
	});

	/**
	 * 로그아웃 처리
	 */
	async function handleSignOut() {
		if (isSigningOut || !auth) return;

		isSigningOut = true;
		try {
			await signOut(auth);
			// console.log('로그아웃 성공');
			await goto('/');
		} catch (error) {
			console.error('로그아웃 에러:', error);
		} finally {
			isSigningOut = false;
		}
	}
</script>

<nav class="fixed inset-x-0 top-0 z-50 border-b border-gray-200 bg-white/95 backdrop-blur supports-[backdrop-filter]:bg-white/60 shadow-sm">
	<div class="container mx-auto px-4">
		<div class="flex h-16 items-center justify-between">
			<!-- 좌측: 로고 및 네비게이션 링크 -->
			<div class="flex items-center gap-4">
				<a href="/" class="flex items-center gap-3 text-gray-900 hover:text-gray-700">
					<img src="/favicon-128.png" alt="Sonub Logo" class="h-10 w-10" />
				</a>
				<form
					class="hidden items-center gap-2 rounded-full bg-gray-100 pl-4 pr-1 shadow-inner sm:flex"
					on:submit|preventDefault={() => {
						const keyword = searchKeyword.trim();
						if (!keyword) {
							void goto('/user/list');
							return;
						}
						void goto(`/user/list?keyword=${encodeURIComponent(keyword)}`);
					}}
				>
					<input
						type="text"
						placeholder="친구를 검색하세요"
						class="h-10 w-40 bg-transparent text-sm text-gray-700 border-none outline-none focus:outline-none focus:ring-0 appearance-none"
						style="box-shadow: none;"
						bind:value={searchKeyword}
					/>
					<button
						type="submit"
						class="flex h-8 w-8 items-center justify-center rounded-full bg-white text-gray-700 shadow-sm disabled:opacity-40"
						disabled={!searchKeyword.trim()}
						aria-label="친구 검색"
					>
						<span class="text-lg">➜</span>
					</button>
				</form>
			</div>

			<!-- 우측: 사용자 메뉴 -->
			<div class="flex items-center gap-2">
				<!-- 게시판 버튼 -->
				<Button
					href="/post/list"
					variant="ghost"
					aria-label={m.navBoard()}
					title={m.navBoard()}
					class="cursor-pointer text-gray-600 hover:text-gray-900 px-2 lg:px-3 gap-2"
				>
					<svg
						class="h-6 w-6 flex-shrink-0"
						fill="none"
						stroke="currentColor"
						viewBox="0 0 24 24"
						stroke-width="2"
					>
						<path
							stroke-linecap="round"
							stroke-linejoin="round"
							d="M3 7h18M3 12h18M3 17h18"
						/>
						<path
							stroke-linecap="round"
							stroke-linejoin="round"
							d="M7 3v18M17 3v18"
						/>
					</svg>
					<span class="hidden lg:inline text-sm">{m.navBoard()}</span>
				</Button>

				<!-- 채팅 버튼 -->
				<Button
					href="/chat/list"
					variant="ghost"
					aria-label={m.navChat()}
					title={m.navChat()}
					class="cursor-pointer text-gray-600 hover:text-gray-900 px-2 lg:px-3 gap-2"
				>
					<svg
						class="h-6 w-6 flex-shrink-0"
						fill="none"
						stroke="currentColor"
						viewBox="0 0 24 24"
						stroke-width="2"
					>
						<path
							stroke-linecap="round"
							stroke-linejoin="round"
							d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
						/>
					</svg>
					<span class="hidden lg:inline text-sm">{m.navChat()}</span>
				</Button>

				<!-- 친구찾기 버튼 -->
				<Button
					href="/user/list"
					variant="ghost"
					aria-label={m.navFindUsers()}
					title={m.navFindUsers()}
					class="cursor-pointer text-gray-600 hover:text-gray-900 px-2 lg:px-3 gap-2"
				>
					<svg
						class="h-6 w-6 flex-shrink-0"
						fill="none"
						stroke="currentColor"
						viewBox="0 0 24 24"
						stroke-width="2"
					>
						<path
							stroke-linecap="round"
							stroke-linejoin="round"
							d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
						/>
					</svg>
					<span class="hidden lg:inline text-sm">{m.navFindUsers()}</span>
				</Button>

				{#if authStore.loading}
					<!-- 로딩 중 -->
					<div class="h-10 w-10 animate-pulse rounded-full bg-gray-200"></div>
				{:else if authStore.isAuthenticated && authStore.user}
					<!-- v1.0.0: 로그인 상태: 사용자 아바타 + 새 메시지 배지 -->
					<div class="relative">
						<a
							href="/my/profile"
							class="cursor-pointer hover:opacity-80 transition-opacity"
							aria-label={m.navMyProfile()}
							title={authStore.user.displayName || authStore.user.email || m.navMyProfile()}
						>
							<Avatar uid={authStore.user?.uid} size={40} />
						</a>

						<!-- v1.0.0: 새 메시지 배지 -->
						{#if newMessageCount > 0}
							<div class="absolute -top-1 -right-1 flex items-center justify-center min-w-5 h-5 px-1.5 bg-red-500 rounded-full border-2 border-white shadow-md new-message-badge">
								<span class="text-xs font-bold text-white leading-none">{newMessageCount > 99 ? '99+' : newMessageCount}</span>
							</div>
						{/if}
					</div>
				{:else}
					<!-- 비로그인 상태: 로그인 버튼 -->
					<Button variant="ghost" size="sm" href="/user/login" class="cursor-pointer">
						{m.navLogin()}
					</Button>
				{/if}

				<!-- 햄버거 메뉴 아이콘 -->
				<Button
					href="/menu"
					variant="ghost"
					size="icon"
					aria-label={m.navMenu()}
					title={m.navMenu()}
					class="cursor-pointer text-gray-600 hover:text-gray-900"
				>
					<svg
						class="h-6 w-6"
						fill="none"
						stroke="currentColor"
						viewBox="0 0 24 24"
						stroke-width="2"
					>
						<path
							stroke-linecap="round"
							stroke-linejoin="round"
							d="M4 6h16M4 12h16M4 18h16"
						/>
					</svg>
				</Button>
			</div>
		</div>
	</div>
</nav>

<style lang="postcss">
	/**
	 * v1.0.0: 새 메시지 알림 배지 스타일
	 */

	/* 배지 컨테이너 - 펄스 애니메이션만 적용 */
	.new-message-badge {
		animation: badge-pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite;
	}

	/* 펄스 애니메이션 (은은한 효과) */
	@keyframes badge-pulse {
		0%,
		100% {
			opacity: 1;
			transform: scale(1);
		}
		50% {
			opacity: 0.9;
			transform: scale(1.05);
		}
	}
</style>
