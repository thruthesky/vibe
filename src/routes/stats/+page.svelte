<script lang="ts">
	import { browser } from '$app/environment';
	import { rtdb } from '$lib/firebase';
	import { onMount } from 'svelte';
	import { onValue, ref } from 'firebase/database';
	import * as m from '$lib/paraglide/messages.js';

	let userCount: number | null = null;
	let loading = true;

	onMount(() => {
		if (!browser || !rtdb) {
			loading = false;
			return;
		}

		const userCounterRef = ref(rtdb, 'stats/counters/user');
		const unsubscribe = onValue(
			userCounterRef,
			(snapshot) => {
				const value = snapshot.val();
				userCount = typeof value === 'number' ? value : 0;
				loading = false;
			},
			() => {
				loading = false;
			}
		);

		return () => unsubscribe();
	});
</script>

<svelte:head>
	<title>{m.statsPageTitle()}</title>
</svelte:head>

<section class="stats-page">
	<div class="stats-card">
		<h1>{m.statsPageTitle()}</h1>
		<p class="stats-section-title">{m.statsUserCountTitle()}</p>
		<p class="stats-value">
			{#if loading}
				{m.commonLoading()}
			{:else}
				{m.statsUserCountValue({ count: userCount ?? 0 })}
			{/if}
		</p>
		<p class="stats-description">{m.statsUserCountDesc()}</p>
	</div>
</section>

<style>
	@import 'tailwindcss' reference;

	.stats-page {
		@apply mx-auto flex min-h-[60vh] w-full max-w-3xl items-center justify-center px-4 py-16;
	}

	.stats-card {
		@apply w-full rounded-3xl border border-emerald-100 bg-white p-10 text-center shadow-xl;
	}

	.stats-card h1 {
		@apply mb-6 text-3xl font-bold text-gray-900;
	}

	.stats-section-title {
		@apply text-sm uppercase tracking-wide text-gray-500;
	}

	.stats-value {
		@apply text-5xl font-extrabold text-emerald-600;
	}

	.stats-description {
		@apply mt-4 text-sm text-gray-500;
	}
</style>
