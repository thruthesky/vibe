<script lang="ts">
	/**
	 * 메뉴 페이지
	 *
	 * 사용자 메뉴 항목을 표시하는 페이지입니다.
	 * 인증 상태에 따라 다른 메뉴를 표시합니다.
	 */

	import { Button } from '$lib/components/ui/button/index.js';
	import { authStore } from '$lib/stores/auth.svelte';
	import { signOut } from 'firebase/auth';
	import { auth } from '$lib/firebase';
	import { goto } from '$app/navigation';
	import Avatar from '$lib/components/user/avatar.svelte';
	import { m } from '$lib/paraglide/messages';

	// 로그아웃 처리 중 상태
	let isSigningOut = $state(false);

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

<svelte:head>
	<title>{m.pageTitleMenu()}</title>
</svelte:head>

<div class="min-h-[calc(100vh-8rem)] py-8 px-4">
	<div class="mx-auto w-full max-w-md space-y-6">
		<!-- 로딩 상태 -->
		{#if authStore.loading}
			<div class="bg-white rounded-xl border border-gray-100 shadow-sm p-6">
				<div class="flex justify-center items-center space-x-2">
					<div class="animate-spin rounded-full h-5 w-5 border-b-2 border-blue-600"></div>
					<p class="text-center text-gray-600">{m.commonLoading()}</p>
				</div>
			</div>

			<!-- 로그인 상태 -->
		{:else if authStore.isAuthenticated}
			<!-- 사용자 정보 -->
			<div class="flex items-center space-x-4 p-4 bg-white rounded-xl border border-gray-100 shadow-sm">
				<Avatar uid={authStore.user?.uid} size={60} />
				<div>
					<p class="text-lg font-semibold text-gray-900">
						{authStore.user?.displayName || m.commonUser()}
					</p>
					<p class="text-sm text-gray-500">
						{authStore.user?.email || ''}
					</p>
				</div>
			</div>

			<!-- 메뉴 항목 -->
			<div class="space-y-4">
				<!-- 프로필 -->
				<div class="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
					<a href="/my/profile" class="flex items-center justify-between p-4 hover:bg-gray-50 transition-colors border-b border-gray-100 last:border-0">
						<span class="text-gray-700 font-medium">{m.menuEditProfile()}</span>
						<svg class="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7" /></svg>
					</a>
					<a href="/user/profile?uid={authStore.user?.uid}" class="flex items-center justify-between p-4 hover:bg-gray-50 transition-colors border-b border-gray-100 last:border-0">
						<span class="text-gray-700 font-medium">{m.menuPublicProfile()}</span>
						<svg class="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7" /></svg>
					</a>
				</div>

				<!-- 소셜 -->
				<div class="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
					<a href="/friend/followers" class="flex items-center justify-between p-4 hover:bg-gray-50 transition-colors border-b border-gray-100 last:border-0">
						<span class="text-gray-700 font-medium">{m.menuFollowers()}</span>
						<svg class="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7" /></svg>
					</a>
					<a href="/friend/following" class="flex items-center justify-between p-4 hover:bg-gray-50 transition-colors border-b border-gray-100 last:border-0">
						<span class="text-gray-700 font-medium">{m.menuFollowing()}</span>
						<svg class="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7" /></svg>
					</a>
					<a href="/user/list" class="flex items-center justify-between p-4 hover:bg-gray-50 transition-colors border-b border-gray-100 last:border-0">
						<span class="text-gray-700 font-medium">{m.menuUserList()}</span>
						<svg class="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7" /></svg>
					</a>
				</div>

				<!-- 채팅 -->
				<div class="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
					<a href="/chat/list" class="flex items-center justify-between p-4 hover:bg-gray-50 transition-colors border-b border-gray-100 last:border-0">
						<span class="text-gray-700 font-medium">{m.menuChatRooms()}</span>
						<svg class="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7" /></svg>
					</a>
					<a href="/chat/open-chat-list" class="flex items-center justify-between p-4 hover:bg-gray-50 transition-colors border-b border-gray-100 last:border-0">
						<span class="text-gray-700 font-medium">{m.menuOpenChats()}</span>
						<svg class="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7" /></svg>
					</a>
				</div>

				<!-- 활동 -->
				<div class="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
					<a href="/my/activity" class="flex items-center justify-between p-4 hover:bg-gray-50 transition-colors border-b border-gray-100 last:border-0">
						<span class="text-gray-700 font-medium">{m.myActivityTitle()}</span>
						<svg class="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7" /></svg>
					</a>
					<a href="/my/reactions" class="flex items-center justify-between p-4 hover:bg-gray-50 transition-colors border-b border-gray-100 last:border-0">
						<span class="text-gray-700 font-medium">{m.receivedReactionsTitle()}</span>
						<svg class="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7" /></svg>
					</a>
				</div>

				<!-- 커뮤니티 -->
				<div class="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
					<a href="/post/popular" class="flex items-center justify-between p-4 hover:bg-gray-50 transition-colors border-b border-gray-100 last:border-0">
						<span class="text-gray-700 font-medium">{m.menuPopularPosts()}</span>
						<svg class="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7" /></svg>
					</a>
					<a href="/user/influencers" class="flex items-center justify-between p-4 hover:bg-gray-50 transition-colors border-b border-gray-100 last:border-0">
						<span class="text-gray-700 font-medium">{m.menuInfluencers()}</span>
						<svg class="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7" /></svg>
					</a>
				</div>



				<!-- 관리자 -->
				{#if authStore.isAdmin}
					<div class="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
						<a href="/admin/dashboard" class="flex items-center justify-between p-4 hover:bg-gray-50 transition-colors border-b border-gray-100 last:border-0">
							<span class="text-gray-700 font-medium">{m.menuAdminPage()}</span>
							<svg class="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7" /></svg>
						</a>
						<a href="/dev/test/database-list-view" class="flex items-center justify-between p-4 hover:bg-gray-50 transition-colors border-b border-gray-100 last:border-0">
							<span class="text-gray-700 font-medium">{m.menuDevTest()}</span>
							<svg class="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7" /></svg>
						</a>
						<a href="/dev/create-posts" class="flex items-center justify-between p-4 hover:bg-gray-50 transition-colors border-b border-gray-100 last:border-0">
							<span class="text-gray-700 font-medium">테스트 게시글 생성</span>
							<svg class="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7" /></svg>
						</a>
					</div>
				{/if}

				<!-- 로그아웃 -->
				<div class="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
					<button
						class="w-full flex items-center justify-between p-4 hover:bg-red-50 transition-colors text-red-600"
						onclick={handleSignOut}
						disabled={isSigningOut}
					>
						<span class="font-medium">{isSigningOut ? m.authSigningOut() : m.navLogout()}</span>
						<svg class="w-5 h-5 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" /></svg>
					</button>
				</div>
			</div>

			<!-- 비로그인 상태 -->
		{:else}
			<div class="bg-white rounded-xl border border-gray-100 shadow-sm p-6 text-center space-y-4">
				<div class="flex justify-center">
					<div class="p-3 bg-blue-50 rounded-full">
						<svg class="h-8 w-8 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
							<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
						</svg>
					</div>
				</div>
				<div>
					<h3 class="text-lg font-bold text-gray-900">{m.authSignInRequired()}</h3>
					<p class="text-sm text-gray-500 mt-1">{m.authSignInRequiredDesc()}</p>
				</div>
				<Button
					class="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-2.5 rounded-lg"
					href="/user/login"
				>
					{m.authSignInAction()}
				</Button>
			</div>
		{/if}
	</div>
</div>
