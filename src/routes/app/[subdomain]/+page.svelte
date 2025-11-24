<script lang="ts">
	import type { PageData } from './$types';

	let { data }: { data: PageData } = $props();
</script>

<svelte:head>
	<title>Generated App - Vibers</title>
</svelte:head>

{#if data.htmlContent}
	{@html data.htmlContent}
{:else}
	<div class="error">
		<h1>App Not Found</h1>
		<p>The requested app could not be found.</p>
		<a href="/">Go back to Vibers</a>
	</div>
{/if}

<style>
	.error {
		display: flex;
		flex-direction: column;
		align-items: center;
		justify-content: center;
		min-height: 100vh;
		text-align: center;
		padding: 2rem;
	}

	.error h1 {
		font-size: 2rem;
		margin-bottom: 1rem;
	}

	.error a {
		margin-top: 1rem;
		color: #667eea;
		text-decoration: none;
	}

	.error a:hover {
		text-decoration: underline;
	}
</style>
