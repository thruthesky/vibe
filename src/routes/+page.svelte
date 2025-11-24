<script lang="ts">
	import Header from '$lib/components/Header.svelte';
	import ChatSidebar from '$lib/components/ChatSidebar.svelte';
	import type { PageData } from './$types';

	let { data }: { data: PageData } = $props();

	interface Message {
		role: 'user' | 'assistant';
		content: string;
		subdomain?: string;
	}

	let messages = $state<Message[]>([]);
	let isGenerating = $state(false);
	let currentSubdomain = $state<string | null>(null);

	async function handlePromptSubmit(prompt: string) {
		if (isGenerating) return;

		// Add user message
		messages = [...messages, { role: 'user', content: prompt }];
		isGenerating = true;

		try {
			// Call backend API to generate code
			const response = await fetch('/api/generate', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ prompt })
			});

			if (!response.ok) {
				const errData = await response.json().catch(() => ({}));
				throw new Error(errData.error || 'Failed to generate app');
			}

			const responseData = await response.json();

			// Add assistant message with subdomain
			messages = [
				...messages,
				{
					role: 'assistant',
					content: `I've created your app! It's now live at ${responseData.subdomain}.vibers.kr`,
					subdomain: responseData.subdomain
				}
			];
			currentSubdomain = responseData.subdomain;
		} catch (error) {
			console.error('Generation error:', error);
			messages = [
				...messages,
				{
					role: 'assistant',
					content: 'Sorry, there was an error generating your app. Please try again.'
				}
			];
		} finally {
			isGenerating = false;
		}
	}
</script>

<svelte:head>
	<title>Vibers - Build something amazing</title>
</svelte:head>

{#if data.htmlContent}
	<!-- Direct subdomain access - render HTML directly -->
	{@html data.htmlContent}
{:else}
	<!-- Main app layout with sidebar and canvas -->
	<div class="app-container">
		<Header />

		<!-- Always show ChatSidebar (no auth required) -->
		<ChatSidebar bind:messages onSubmit={handlePromptSubmit} {isGenerating} />

		<main class="main-content with-sidebar">
			{#if currentSubdomain}
				<!-- Canvas area showing generated app in iframe -->
				<div class="canvas-area">
					<div class="canvas-header">
						<h2>Generated App Preview</h2>
						<button class="close-canvas" onclick={() => (currentSubdomain = null)}>
							Close Preview
						</button>
					</div>
					<iframe src="/app/{currentSubdomain}" title="Generated App" class="canvas-iframe"
					></iframe>
				</div>
			{:else}
				<!-- Hero section when no app is generated -->
				<div class="gradient-bg hero-section">
					<div class="hero-content">
						<h1 class="hero-title">
							Build something <span class="gradient-text">Vibers</span>
						</h1>
						<p class="hero-subtitle">Create apps and websites by chatting with AI</p>

						{#if isGenerating}
							<div class="generating-indicator">
								<div class="spinner"></div>
								<p>Generating your app...</p>
							</div>
						{:else}
							<div class="cta-section">
								<p class="cta-hint">Start chatting in the sidebar to build your app!</p>
							</div>
						{/if}
					</div>
				</div>
			{/if}
		</main>
	</div>
{/if}

<style>
	.canvas-area {
		width: 100%;
		height: calc(100vh - 4rem);
		display: flex;
		flex-direction: column;
		background: #f5f5f5;
	}

	.canvas-header {
		padding: 1rem 2rem;
		background: white;
		border-bottom: 1px solid #e0e0e0;
		display: flex;
		justify-content: space-between;
		align-items: center;
	}

	.canvas-header h2 {
		margin: 0;
		font-size: 1.25rem;
		font-weight: 600;
		color: #333;
	}

	.close-canvas {
		padding: 0.5rem 1rem;
		background: #f0f0f0;
		color: #333;
		border: none;
		border-radius: 4px;
		cursor: pointer;
		font-size: 0.9rem;
		transition: background 0.2s;
	}

	.close-canvas:hover {
		background: #e0e0e0;
	}

	.canvas-iframe {
		flex: 1;
		width: 100%;
		border: none;
		background: white;
	}

	.app-container {
		min-height: 100vh;
		display: flex;
		flex-direction: column;
	}

	.main-content {
		flex: 1;
		padding-top: 4rem;
		transition: margin-left 0.3s ease;
	}

	.main-content.with-sidebar {
		margin-left: 320px;
	}

	.hero-section {
		min-height: calc(100vh - 4rem);
		display: flex;
		align-items: center;
		justify-content: center;
		padding: 2rem;
		position: relative;
		overflow: hidden;
	}

	.hero-content {
		max-width: 900px;
		width: 100%;
		text-align: center;
		z-index: 1;
	}

	.hero-title {
		font-size: clamp(2.5rem, 6vw, 4rem);
		font-weight: 800;
		color: white;
		margin-bottom: 1rem;
		line-height: 1.2;
		text-shadow: 0 4px 20px rgba(0, 0, 0, 0.2);
	}

	.gradient-text {
		background: linear-gradient(135deg, #fff 0%, #f0f0f0 100%);
		-webkit-background-clip: text;
		-webkit-text-fill-color: transparent;
		background-clip: text;
	}

	.hero-subtitle {
		font-size: clamp(1.125rem, 2vw, 1.5rem);
		color: rgba(255, 255, 255, 0.9);
		margin-bottom: 3rem;
		font-weight: 400;
	}

	.cta-section {
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: 1rem;
	}

	.cta-button {
		padding: 1.25rem 3rem;
		font-size: 1.125rem;
		font-weight: 600;
		color: white;
		background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
		border: none;
		border-radius: 50px;
		cursor: pointer;
		transition: all 0.3s ease;
		box-shadow: 0 8px 24px rgba(102, 126, 234, 0.4);
	}

	.cta-button:hover {
		transform: translateY(-2px);
		box-shadow: 0 12px 32px rgba(102, 126, 234, 0.6);
	}

	.cta-button:active {
		transform: translateY(0);
	}

	.cta-hint {
		color: rgba(255, 255, 255, 0.8);
		font-size: 0.95rem;
	}

	.generating-indicator {
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: 1rem;
		margin-top: 2rem;
		color: white;
	}

	.spinner {
		width: 40px;
		height: 40px;
		border: 3px solid rgba(255, 255, 255, 0.3);
		border-top-color: white;
		border-radius: 50%;
		animation: spin 0.8s linear infinite;
	}

	@keyframes spin {
		to {
			transform: rotate(360deg);
		}
	}

	.generating-indicator p {
		font-size: 1rem;
		font-weight: 500;
	}

	@media (max-width: 768px) {
		.main-content.with-sidebar {
			margin-left: 0;
		}
	}
</style>
