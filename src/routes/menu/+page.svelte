<script lang="ts">
	/**
	 * 메뉴 페이지
	 *
	 * 사용자 메뉴 항목을 표시하는 페이지입니다.
	 * 인증 상태에 따라 다른 메뉴를 표시합니다.
	 */

	import { Button } from '$lib/components/ui/button/index.js';
	import * as Card from '$lib/components/ui/card/index.js';
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
		<!-- 메뉴 헤더 -->
		<div class="text-center space-y-3">
			<div class="flex justify-center">
				<div class="p-3 bg-gradient-to-br from-blue-50 to-indigo-50 rounded-2xl shadow-sm">
					<svg
						class="h-8 w-8 text-blue-600"
						fill="none"
						stroke="currentColor"
						viewBox="0 0 24 24"
					>
						<path
							stroke-linecap="round"
							stroke-linejoin="round"
							stroke-width="2"
							d="M4 6h16M4 12h16M4 18h16"
						/>
					</svg>
				</div>
			</div>
			<div>
				<h1 class="text-3xl font-bold text-gray-900">{m.menuTitle()}</h1>
				<p class="mt-2 text-sm text-gray-500">{m.menuGuide()}</p>
			</div>
		</div>

		<!-- 로딩 상태 -->
		{#if authStore.loading}
			<Card.Root class="shadow-md border border-gray-200">
				<Card.Content class="pt-6">
					<div class="flex justify-center items-center space-x-2">
						<div
							class="animate-spin rounded-full h-5 w-5 border-b-2 border-blue-600"
						></div>
						<p class="text-center text-gray-600">{m.commonLoading()}</p>
					</div>
				</Card.Content>
			</Card.Root>

			<!-- 로그인 상태 -->
		{:else if authStore.isAuthenticated}
			<!-- 사용자 정보 카드 -->
			<Card.Root class="shadow-lg border border-gray-200 overflow-hidden transition-all duration-300 hover:shadow-xl">
				<div class="bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 px-6 pt-8 pb-6">
					<!-- 프로필 정보 -->
					<div class="flex flex-col items-center space-y-4">
						<div class="relative">
							<div
								class="absolute inset-0 bg-gradient-to-br from-blue-400 to-purple-400 rounded-full blur-lg opacity-30"
							></div>
							<div class="relative">
								<Avatar uid={authStore.user?.uid} size={80} />
							</div>
						</div>
						<div class="text-center">
							<p class="text-xl font-bold text-gray-900">
								{authStore.user?.displayName || m.commonUser()}
							</p>
							<p class="text-sm text-gray-600 mt-1">
								{authStore.user?.email || ''}
							</p>
						</div>
					</div>
				</div>
			</Card.Root>

			<!-- 메뉴 항목 카드 -->
			<Card.Root class="shadow-lg border border-gray-200">
				<Card.Content class="space-y-1 p-4">
					<!-- 회원 정보 수정 -->
					<Button
						variant="ghost"
						class="w-full justify-start text-left text-gray-700 hover:bg-blue-50 hover:text-blue-700 border border-transparent hover:border-blue-200 rounded-lg py-3 transition-all duration-200"
						href="/my/profile"
					>
						<div
							class="mr-3 p-2 bg-blue-100 rounded-lg group-hover:bg-blue-200 transition-colors"
						>
							<svg
								class="h-5 w-5 text-blue-600"
								fill="none"
								stroke="currentColor"
								viewBox="0 0 24 24"
							>
								<path
									stroke-linecap="round"
									stroke-linejoin="round"
									stroke-width="2"
									d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
								/>
							</svg>
						</div>
						<span class="font-medium">{m.menuEditProfile()}</span>
					</Button>

					<!-- 공개 프로필 -->
					<Button
						variant="ghost"
						class="w-full justify-start text-left text-gray-700 hover:bg-teal-50 hover:text-teal-700 border border-transparent hover:border-teal-200 rounded-lg py-3 transition-all duration-200"
						href="/user/profile?uid={authStore.user?.uid}"
					>
						<div
							class="mr-3 p-2 bg-teal-100 rounded-lg group-hover:bg-teal-200 transition-colors"
						>
							<svg
								class="h-5 w-5 text-teal-600"
								fill="none"
								stroke="currentColor"
								viewBox="0 0 24 24"
							>
								<path
									stroke-linecap="round"
									stroke-linejoin="round"
									stroke-width="2"
									d="M5.121 17.804A13.937 13.937 0 0112 16c2.5 0 4.847.655 6.879 1.804M15 10a3 3 0 11-6 0 3 3 0 016 0zm6 2a9 9 0 11-18 0 9 9 0 0118 0z"
								/>
							</svg>
						</div>
						<span class="font-medium">{m.menuPublicProfile()}</span>
					</Button>

					<!-- 구분선 -->
					<div class="border-t border-gray-200 my-3"></div>

					<!-- 팔로워 -->
					<Button
						variant="ghost"
						class="w-full justify-start text-left text-gray-700 hover:bg-pink-50 hover:text-pink-700 border border-transparent hover:border-pink-200 rounded-lg py-3 transition-all duration-200"
						href="/friend/followers"
					>
						<div
							class="mr-3 p-2 bg-pink-100 rounded-lg group-hover:bg-pink-200 transition-colors"
						>
							<svg
								class="h-5 w-5 text-pink-600"
								fill="none"
								stroke="currentColor"
								viewBox="0 0 24 24"
							>
								<path
									stroke-linecap="round"
									stroke-linejoin="round"
									stroke-width="2"
									d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"
								/>
							</svg>
						</div>
						<span class="font-medium">{m.menuFollowers()}</span>
					</Button>

					<!-- 팔로잉 -->
					<Button
						variant="ghost"
						class="w-full justify-start text-left text-gray-700 hover:bg-indigo-50 hover:text-indigo-700 border border-transparent hover:border-indigo-200 rounded-lg py-3 transition-all duration-200"
						href="/friend/following"
					>
						<div
							class="mr-3 p-2 bg-indigo-100 rounded-lg group-hover:bg-indigo-200 transition-colors"
						>
							<svg
								class="h-5 w-5 text-indigo-600"
								fill="none"
								stroke="currentColor"
								viewBox="0 0 24 24"
							>
								<path
									stroke-linecap="round"
									stroke-linejoin="round"
									stroke-width="2"
									d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z"
								/>
							</svg>
						</div>
						<span class="font-medium">{m.menuFollowing()}</span>
					</Button>

					<!-- 사용자 목록 -->
					<Button
						variant="ghost"
						class="w-full justify-start text-left text-gray-700 hover:bg-cyan-50 hover:text-cyan-700 border border-transparent hover:border-cyan-200 rounded-lg py-3 transition-all duration-200"
						href="/user/list"
					>
						<div
							class="mr-3 p-2 bg-cyan-100 rounded-lg group-hover:bg-cyan-200 transition-colors"
						>
							<svg
								class="h-5 w-5 text-cyan-600"
								fill="none"
								stroke="currentColor"
								viewBox="0 0 24 24"
							>
								<path
									stroke-linecap="round"
									stroke-linejoin="round"
									stroke-width="2"
									d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z"
								/>
							</svg>
						</div>
						<span class="font-medium">{m.menuUserList()}</span>
					</Button>

					<!-- 구분선 -->
					<div class="border-t border-gray-200 my-3"></div>

					<!-- 채팅방 -->
					<Button
						variant="ghost"
						class="w-full justify-start text-left text-gray-700 hover:bg-emerald-50 hover:text-emerald-700 border border-transparent hover:border-emerald-200 rounded-lg py-3 transition-all duration-200"
						href="/chat/list"
					>
						<div
							class="mr-3 p-2 bg-emerald-100 rounded-lg group-hover:bg-emerald-200 transition-colors"
						>
							<svg
								class="h-5 w-5 text-emerald-600"
								fill="none"
								stroke="currentColor"
								viewBox="0 0 24 24"
							>
								<path
									stroke-linecap="round"
									stroke-linejoin="round"
									stroke-width="2"
									d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
								/>
							</svg>
						</div>
						<span class="font-medium">{m.menuChatRooms()}</span>
					</Button>

					<!-- 오픈채팅방 -->
					<Button
						variant="ghost"
						class="w-full justify-start text-left text-gray-700 hover:bg-lime-50 hover:text-lime-700 border border-transparent hover:border-lime-200 rounded-lg py-3 transition-all duration-200"
						href="/chat/open-chat-list"
					>
						<div
							class="mr-3 p-2 bg-lime-100 rounded-lg group-hover:bg-lime-200 transition-colors"
						>
							<svg
								class="h-5 w-5 text-lime-600"
								fill="none"
								stroke="currentColor"
								viewBox="0 0 24 24"
							>
								<path
									stroke-linecap="round"
									stroke-linejoin="round"
									stroke-width="2"
									d="M17 8h2a2 2 0 012 2v6a2 2 0 01-2 2h-2v4l-4-4H9a1.994 1.994 0 01-1.414-.586m0 0L11 14h4a2 2 0 002-2V6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2v4l.586-.586z"
								/>
							</svg>
						</div>
						<span class="font-medium">{m.menuOpenChats()}</span>
					</Button>

					<!-- 구분선 -->
					<div class="border-t border-gray-200 my-3"></div>

					<!-- 인기 게시글 -->
					<Button
						variant="ghost"
						class="w-full justify-start text-left text-gray-700 hover:bg-yellow-50 hover:text-yellow-700 border border-transparent hover:border-yellow-200 rounded-lg py-3 transition-all duration-200"
						href="/post/popular"
					>
						<div
							class="mr-3 p-2 bg-yellow-100 rounded-lg group-hover:bg-yellow-200 transition-colors"
						>
							<svg
								class="h-5 w-5 text-yellow-600"
								fill="none"
								stroke="currentColor"
								viewBox="0 0 24 24"
							>
								<path
									stroke-linecap="round"
									stroke-linejoin="round"
									stroke-width="2"
									d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z"
								/>
							</svg>
						</div>
						<span class="font-medium">{m.menuPopularPosts()}</span>
					</Button>

					<!-- 인플루언서 -->
					<Button
						variant="ghost"
						class="w-full justify-start text-left text-gray-700 hover:bg-violet-50 hover:text-violet-700 border border-transparent hover:border-violet-200 rounded-lg py-3 transition-all duration-200"
						href="/my/stats"
					>
						<div
							class="mr-3 p-2 bg-violet-100 rounded-lg group-hover:bg-violet-200 transition-colors"
						>
							<svg
								class="h-5 w-5 text-violet-600"
								fill="none"
								stroke="currentColor"
								viewBox="0 0 24 24"
							>
								<path
									stroke-linecap="round"
									stroke-linejoin="round"
									stroke-width="2"
									d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
								/>
							</svg>
						</div>
						<span class="font-medium">{m.menuInfluencers()}</span>
					</Button>

					<!-- 구분선 -->
					<div class="border-t border-gray-200 my-3"></div>

					<!-- 개발 계획 -->
					<Button
						variant="ghost"
						class="w-full justify-start text-left text-gray-700 hover:bg-gray-50 hover:text-gray-700 border border-transparent hover:border-gray-200 rounded-lg py-3 transition-all duration-200"
						href="/dev/plan"
					>
						<div
							class="mr-3 p-2 bg-gray-100 rounded-lg group-hover:bg-gray-200 transition-colors"
						>
							<svg
								class="h-5 w-5 text-gray-600"
								fill="none"
								stroke="currentColor"
								viewBox="0 0 24 24"
							>
								<path
									stroke-linecap="round"
									stroke-linejoin="round"
									stroke-width="2"
									d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
								/>
							</svg>
						</div>
						<span class="font-medium">개발 계획</span>
					</Button>

					<!-- 관리자 페이지 (관리자만) -->
					{#if authStore.isAdmin}
						<Button
							variant="ghost"
							class="w-full justify-start text-left text-gray-700 hover:bg-purple-50 hover:text-purple-700 border border-transparent hover:border-purple-200 rounded-lg py-3 transition-all duration-200"
							href="/admin/dashboard"
						>
							<div
								class="mr-3 p-2 bg-purple-100 rounded-lg group-hover:bg-purple-200 transition-colors"
							>
								<svg
									class="h-5 w-5 text-purple-600"
									fill="none"
									stroke="currentColor"
									viewBox="0 0 24 24"
								>
									<path
										stroke-linecap="round"
										stroke-linejoin="round"
										stroke-width="2"
										d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4"
									/>
								</svg>
							</div>
							<span class="font-medium">{m.menuAdminPage()}</span>
						</Button>

						<!-- 개발 테스트 페이지 (관리자만) -->
						<Button
							variant="ghost"
							class="w-full justify-start text-left text-gray-700 hover:bg-green-50 hover:text-green-700 border border-transparent hover:border-green-200 rounded-lg py-3 transition-all duration-200"
							href="/dev/test/database-list-view"
						>
							<div
								class="mr-3 p-2 bg-green-100 rounded-lg group-hover:bg-green-200 transition-colors"
							>
								<svg
									class="h-5 w-5 text-green-600"
									fill="none"
									stroke="currentColor"
									viewBox="0 0 24 24"
								>
									<path
										stroke-linecap="round"
										stroke-linejoin="round"
										stroke-width="2"
										d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01"
									/>
								</svg>
							</div>
							<span class="font-medium">{m.menuDevTest()}</span>
						</Button>

						<!-- 테스트 게시글 생성 (관리자만) -->
						<Button
							variant="ghost"
							class="w-full justify-start text-left text-gray-700 hover:bg-orange-50 hover:text-orange-700 border border-transparent hover:border-orange-200 rounded-lg py-3 transition-all duration-200"
							href="/dev/create-posts"
						>
							<div
								class="mr-3 p-2 bg-orange-100 rounded-lg group-hover:bg-orange-200 transition-colors"
							>
								<svg
									class="h-5 w-5 text-orange-600"
									fill="none"
									stroke="currentColor"
									viewBox="0 0 24 24"
								>
									<path
										stroke-linecap="round"
										stroke-linejoin="round"
										stroke-width="2"
										d="M12 4v16m8-8H4"
									/>
								</svg>
							</div>
							<span class="font-medium">테스트 게시글 생성</span>
						</Button>
					{/if}

					<!-- 구분선 -->
					<div class="border-t border-gray-200 my-3"></div>

					<!-- 로그아웃 -->
					<Button
						variant="ghost"
						class="w-full justify-start text-left text-red-600 hover:bg-red-50 hover:text-red-700 border border-transparent hover:border-red-200 rounded-lg py-3 transition-all duration-200"
						onclick={handleSignOut}
						disabled={isSigningOut}
					>
						<div
							class="mr-3 p-2 bg-red-100 rounded-lg group-hover:bg-red-200 transition-colors"
						>
							<svg class="h-5 w-5 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
								<path
									stroke-linecap="round"
									stroke-linejoin="round"
									stroke-width="2"
									d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"
								/>
							</svg>
						</div>
						<span class="font-medium">{isSigningOut ? m.authSigningOut() : m.navLogout()}</span>
					</Button>
				</Card.Content>
			</Card.Root>

			<!-- 비로그인 상태 -->
		{:else}
			<Card.Root class="shadow-lg border border-gray-200 overflow-hidden">
				<div class="bg-gradient-to-br from-gray-50 to-blue-50 p-6">
					<div class="text-center space-y-2">
						<div class="flex justify-center">
							<div
								class="p-4 bg-blue-100 rounded-full"
							>
								<svg
									class="h-8 w-8 text-blue-600"
									fill="none"
									stroke="currentColor"
									viewBox="0 0 24 24"
								>
									<path
										stroke-linecap="round"
										stroke-linejoin="round"
										stroke-width="2"
										d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
									/>
								</svg>
							</div>
						</div>
						<div>
							<h3 class="text-xl font-bold text-gray-900">{m.authSignInRequired()}</h3>
							<p class="text-sm text-gray-600 mt-2">{m.authSignInRequiredDesc()}</p>
						</div>
					</div>
				</div>
				<Card.Content class="p-6">
					<Button
						class="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-3 rounded-lg shadow-md hover:shadow-lg transition-all duration-200"
						href="/user/login"
					>
						{m.authSignInAction()}
					</Button>
				</Card.Content>
			</Card.Root>
		{/if}
	</div>
</div>
