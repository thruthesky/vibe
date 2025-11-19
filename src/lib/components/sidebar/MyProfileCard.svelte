<script lang="ts">
	/**
	 * 내 프로필 카드 컴포넌트
	 *
	 * 로그인한 사용자의 프로필 정보를 표시합니다.
	 * 비로그인 시 로그인 안내를 표시합니다.
	 */

	import Avatar from '$lib/components/user/avatar.svelte';
	import { authStore } from '$lib/stores/auth.svelte';
	import { m } from '$lib/paraglide/messages';
	import { UserRound } from 'lucide-svelte';
</script>

<div class="profile-section">
	{#if authStore.user}
		<!-- 로그인 사용자 프로필 -->
		<a href="/my/profile" class="profile-card" aria-label={m.navMyProfile()}>
			<Avatar uid={authStore.user.uid} size={40} />
			<div class="profile-info">
				<span class="profile-label">{m.homeSidebarProfileLabel()}</span>
				<span class="profile-name">{authStore.user.displayName || m.commonUser()}</span>
			</div>
		</a>
	{:else}
		<!-- 비로그인 사용자 -->
		<a href="/auth/sign-in" class="profile-card" aria-label={m.navLogin()}>
			<div class="guest-avatar">
				<UserRound class="guest-icon" aria-hidden="true" />
			</div>
			<div class="profile-info">
				<span class="profile-label">{m.homeSidebarProfileLabel()}</span>
				<span class="profile-name">{m.navLogin()}</span>
			</div>
		</a>
	{/if}
</div>

<style>
	@import 'tailwindcss' reference;

	/* 섹션 컨테이너 */
	.profile-section {
		@apply w-full;
	}

	/* 프로필 카드 */
	.profile-card {
		@apply flex items-center gap-2.5;
	}

	/* 프로필 정보 */
	.profile-info {
		@apply flex flex-col;
	}

	.profile-label {
		@apply text-[10px] font-medium text-gray-500;
	}

	.profile-name {
		@apply text-sm font-semibold text-gray-900;
	}

	/* 게스트 아바타 */
	.guest-avatar {
		@apply flex h-10 w-10 items-center justify-center rounded-full bg-gray-100;
	}

	.guest-icon {
		@apply h-4 w-4 text-gray-500;
	}
</style>
