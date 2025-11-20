<script lang="ts">
	/**
	 * 홈 화면 좌측 사이드바
	 *
	 * 로그인 사용자의 상태, 팔로우 정보, 최근 사용자/오픈챗/활동, 언어 설정을 보여줍니다.
	 * 데이터는 Firebase Realtime Database 에서 읽어옵니다.
	 */

	import MyProfileCard from './sidebar/MyProfileCard.svelte';
	import QuickMenuCard from './sidebar/QuickMenuCard.svelte';
	import RecentUsers from './sidebar/RecentUsers.svelte';
	import RecentOpenChats from './sidebar/RecentOpenChats.svelte';
	import RecentActivities from './sidebar/RecentActivities.svelte';
	import { getLocale, setLocale, locales } from '$lib/paraglide/runtime';
	import { m } from '$lib/paraglide/messages';
	import { Globe } from 'lucide-svelte';

	const localeNames: Record<string, () => string> = {
		en: () => m.localeNameEnglish(),
		ko: () => m.localeNameKorean(),
		ja: () => m.localeNameJapanese(),
		zh: () => m.localeNameChinese()
	};

	const localeFlags: Record<string, string> = {
		en: '🇺🇸',
		ko: '🇰🇷',
		ja: '🇯🇵',
		zh: '🇨🇳'
	};

	const copyrightLabel = $derived.by(() =>
		getLocale() === 'ko' ? m.copyrightKorean() : m.copyrightEnglish()
	);

	/**
	 * 언어 선택 변경 핸들러
	 */
	function handleLocaleChange(event: Event) {
		const target = event.target as HTMLSelectElement;
		const newLocale = target.value as (typeof locales)[number];
		setLocale(newLocale);
	}
</script>

<aside class="left-sidebar hidden lg:block">
	<div class="sidebar-inner flex flex-col gap-4">
		<!-- 내 프로필 카드 -->
		<MyProfileCard />

		<!-- 빠른 메뉴 카드 -->
		<QuickMenuCard />

		<!-- 최근 사용자 섹션 -->
		<RecentUsers />

		<!-- 최근 오픈 채팅 섹션 -->
		<RecentOpenChats />

		<!-- 최근 활동 섹션 -->
		<RecentActivities />

		<!-- 언어 선택 -->
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
						{localeFlags[locale] || ''} {localeNames[locale]?.() || locale}
					</option>
				{/each}
			</select>
		</div>

		<!-- 저작권 표시 -->
		<p class="copyright-text mt-1">
			{copyrightLabel}
		</p>
	</div>
</aside>

<style>
	@import 'tailwindcss' reference;

	.left-sidebar {
		@apply lg:w-64 xl:w-72;
	}

	.sidebar-inner {
		@apply sticky top-20 flex flex-col gap-3;
	}

	.language-row {
		@apply rounded-2xl bg-white/90 px-3 py-2.5 shadow-sm;
	}

	.language-label {
		@apply text-xs font-semibold text-gray-900;
	}

	.language-icon {
		@apply h-3.5 w-3.5 text-gray-500;
	}

	.language-select {
		@apply rounded-xl border border-transparent bg-white px-2.5 py-1.5 text-xs font-medium text-gray-900 shadow-sm transition duration-200;
		@apply hover:bg-blue-50 focus:outline-none focus:ring-2 focus:ring-blue-200;
	}

	.copyright-text {
		@apply text-center text-[10px] font-medium text-gray-400;
	}
</style>
