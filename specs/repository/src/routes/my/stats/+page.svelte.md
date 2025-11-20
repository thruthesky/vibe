---
title: +page.svelte - Svelte 5 컴포넌트
original_path: src/routes/my/stats/+page.svelte
category: route
file_type: svelte
status: current
last_updated: 2025-11-20
---

# +page.svelte

## 개요

**원본 경로**: `src/routes/my/stats/+page.svelte`

**파일 유형**: Svelte 5 컴포넌트

## 소스 코드

```svelte
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
```
