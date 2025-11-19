<script lang="ts">
	/**
	 * 우측 사이드바 컴포넌트
	 *
	 * 데스크톱에서만 표시되는 우측 정보/위젯 영역입니다.
	 * TailwindCSS를 사용하여 스타일링합니다.
	 */

	import NotificationCard from './sidebar/NotificationCard.svelte';
	import StatsCard from './sidebar/StatsCard.svelte';
	import SuggestionsCard from './sidebar/SuggestionsCard.svelte';
</script>

<aside class="hidden lg:block lg:w-64 xl:w-72">
	<div class="sticky top-20 space-y-5">

		
		<!-- 알림 카드 -->
		<NotificationCard />

		<!-- 통계 카드 -->
		<StatsCard />

		<!-- 제안 카드 -->
		<SuggestionsCard />
	</div>
</aside>

