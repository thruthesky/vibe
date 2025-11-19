<script lang="ts">
	/**
	 * 제안 카드 컴포넌트
	 *
	 * 사용자에게 추천 항목을 표시합니다.
	 * 인기 게시물, 인기 사용자 등을 보여줍니다.
	 */

	import { m } from '$lib/paraglide/messages';
	import { TrendingUp, Sparkles, ChevronRight, Users } from 'lucide-svelte';
	import { goto } from '$app/navigation';

	/**
	 * 인기 게시물 페이지로 이동
	 */
	function goToPopularPosts() {
		// TODO: 인기 게시물 페이지 경로 구현 필요
		console.log('Navigate to popular posts');
	}

	/**
	 * 인기 사용자 페이지로 이동
	 */
	function goToPopularUsers() {
		// TODO: 인기 사용자 페이지 경로 구현 필요
		console.log('Navigate to popular users');
	}
</script>

<div class="suggestions-section">
	<!-- 헤더 -->
	<div class="section-header">
		<div class="header-left flex items-center gap-2">
			<Sparkles class="section-icon" aria-hidden="true" />
			<h3 class="section-title">{m.sidebarSuggestions()}</h3>
		</div>
	</div>

	<!-- 컨텐츠 -->
	<div class="section-content">
		<ul class="suggestion-list">
			<li>
				<button type="button" onclick={goToPopularPosts} class="suggestion-item">
					<TrendingUp class="suggestion-icon" size={16} />
					<span class="suggestion-text">{m.sidebarPopularPosts()}</span>
					<ChevronRight class="suggestion-arrow" size={14} />
				</button>
			</li>
			<li>
				<button type="button" onclick={goToPopularUsers} class="suggestion-item">
					<Users class="suggestion-icon" size={16} />
					<span class="suggestion-text">{m.sidebarPopularUsers()}</span>
					<ChevronRight class="suggestion-arrow" size={14} />
				</button>
			</li>
		</ul>
	</div>
</div>

<style>
	@import 'tailwindcss' reference;

	/* 섹션 컨테이너 - 보더 없이 심플하게 */
	.suggestions-section {
		@apply rounded-xl bg-white/90 p-4 shadow-sm;
	}

	/* 헤더 영역 */
	.section-header {
		@apply mb-3 flex items-center justify-between;
	}

	.section-icon {
		@apply h-4 w-4 text-pink-500;
	}

	.section-title {
		@apply text-sm font-semibold text-gray-900;
	}

	/* 컨텐츠 영역 */
	.section-content {
		@apply space-y-2;
	}

	/* 제안 리스트 */
	.suggestion-list {
		@apply space-y-1.5;
	}

	/* 제안 아이템 - 콤팩트한 디자인 */
	.suggestion-item {
		@apply flex w-full items-center gap-2.5 rounded-lg bg-gray-50/50 px-3 py-2 transition-all duration-200;
		@apply hover:bg-pink-50/80 hover:shadow-sm;
	}

	.suggestion-icon {
		@apply shrink-0 text-pink-500 transition-transform duration-200;
	}

	.suggestion-item:hover .suggestion-icon {
		@apply scale-110;
	}

	.suggestion-text {
		@apply flex-1 text-sm font-medium text-gray-900;
	}

	.suggestion-arrow {
		@apply shrink-0 text-gray-400 transition-all duration-200;
	}

	.suggestion-item:hover .suggestion-arrow {
		@apply translate-x-0.5 text-pink-500;
	}
</style>
