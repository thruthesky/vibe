<script lang="ts">
	/**
	 * 알림 카드 컴포넌트
	 *
	 * 사용자 알림 목록을 표시합니다.
	 * 현재는 알림이 없는 상태를 표시하며, 향후 확장 가능합니다.
	 */

	import { m } from '$lib/paraglide/messages';
	import { Bell, ChevronRight } from 'lucide-svelte';
	import { goto } from '$app/navigation';

	/**
	 * 알림 페이지로 이동
	 */
	function goToNotifications() {
		// TODO: 알림 페이지 경로 구현 필요
		console.log('Navigate to notifications page');
	}
</script>

<div class="notification-section">
	<!-- 헤더 -->
	<div class="section-header">
		<div class="header-left flex items-center gap-2">
			<Bell class="section-icon" aria-hidden="true" />
			<h3 class="section-title">{m.sidebarNotifications()}</h3>
		</div>
		<button
			type="button"
			onclick={goToNotifications}
			class="more-button"
			aria-label={`${m.sidebarNotifications()} ${m.homeSidebarSeeMore()}`}
		>
			<span class="more-text">{m.homeSidebarSeeMore()}</span>
			<ChevronRight class="more-icon" size={16} />
		</button>
	</div>

	<!-- 컨텐츠 -->
	<div class="section-content">
		<p class="placeholder-text">{m.sidebarNoNotifications()}</p>
	</div>
</div>

<style>
	@import 'tailwindcss' reference;

	/* 섹션 컨테이너 - 보더 없이 심플하게 */
	.notification-section {
		@apply rounded-xl bg-white/90 p-4 shadow-sm;
	}

	/* 헤더 영역 */
	.section-header {
		@apply mb-3 flex items-center justify-between;
	}

	.section-icon {
		@apply h-4 w-4 text-amber-500;
	}

	.section-title {
		@apply text-sm font-semibold text-gray-900;
	}

	/* 더보기 버튼 */
	.more-button {
		@apply flex items-center gap-0.5 rounded-lg px-2 py-1 text-xs font-medium text-gray-600 transition-all;
		@apply hover:bg-gray-100 hover:text-amber-600;
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
		@apply space-y-2;
	}

	.placeholder-text {
		@apply py-4 text-center text-xs text-gray-400;
	}
</style>
