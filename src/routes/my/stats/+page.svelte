<script lang="ts">
	/**
	 * /my/stats
	 *
	 * 일/월/년 별로 팔로워, 좋아요, 댓글수를 시각화할 예정입니다.
	 * 현재는 공사중 안내만 제공합니다.
	 */
	import * as Card from '$lib/components/ui/card/index.js';
	import { m } from '$lib/paraglide/messages';
</script>

<svelte:head>
	<title>Sonub - {m.myStatsTitle()}</title>
</svelte:head>

<section class="page-shell flex flex-col items-center justify-center">
	<Card.Root class="construction-card w-full max-w-2xl">
		<Card.Header>
			<Card.Title>{m.myStatsTitle()}</Card.Title>
			<Card.Description>{m.myStatsDescription()}</Card.Description>
		</Card.Header>
		<Card.Content>
			<p class="construction-text">{m.pageUnderConstruction()}</p>
		</Card.Content>
	</Card.Root>
</section>

<style>
	@import 'tailwindcss' reference;

	.page-shell {
		@apply min-h-[60vh] px-4 py-12;
	}

	.construction-card {
		@apply rounded-2xl border border-gray-100 bg-white shadow-lg;
	}

	.construction-text {
		@apply text-center text-base font-medium text-gray-600;
	}
</style>
