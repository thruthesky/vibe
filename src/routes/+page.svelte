<script lang="ts">
	import Header from '$lib/components/Header.svelte';
	import LoginModal from '$lib/components/LoginModal.svelte';
	import ChatSidebar from '$lib/components/ChatSidebar.svelte';
	import { authStore } from '$lib/stores/auth.svelte';
	import type { PageData } from './$types';

	let { data }: { data: PageData } = $props();

	interface Message {
		role: 'user' | 'assistant';
		content: string;
		subdomain?: string;
	}

	let showLoginModal = $state(false);
	let messages = $state<Message[]>([]);
	let isGenerating = $state(false);
	let currentSubdomain = $state<string | null>(null);

	async function handlePromptSubmit(prompt: string) {
		if (!authStore.isAuthenticated || isGenerating) return;

		// Add user message
		messages = [...messages, { role: 'user', content: prompt }];
		isGenerating = true;

		try {
			const response = await fetch('/api/generate', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ prompt })
			});

			if (!response.ok) {
				throw new Error('Failed to generate app');
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

{#if currentSubdomain}
	<!-- Render generated HTML via iframe -->
	<div class="generated-app-container">
		<iframe
			src="https://{currentSubdomain}.vibers.kr"
			title="Generated App"
			class="generated-app-iframe"
		></iframe>
		<button class="close-preview" onclick={() => (currentSubdomain = null)}>
			Close Preview
		</button>
	</div>
{:else}
	<!-- Normal landing page -->
	<div class="app-container">
		<Header bind:showLoginModal />
		<LoginModal bind:isOpen={showLoginModal} />

		{#if authStore.isAuthenticated}
			<ChatSidebar bind:messages onSubmit={handlePromptSubmit} {isGenerating} />
		{/if}

		<main class="main-content" class:with-sidebar={authStore.isAuthenticated}>
			<div class="gradient-bg hero-section">
				<div class="hero-content">
					<h1 class="hero-title">
						Build something <span class="gradient-text">Vibers</span>
					</h1>
					<p class="hero-subtitle">Create apps and websites by chatting with AI</p>

					{#if !authStore.isAuthenticated}
						<div class="cta-section">
							<button class="cta-button" onclick={() => (showLoginModal = true)}>
								Get Started - It's Free
							</button>
							<p class="cta-hint">Sign in to start building with AI</p>
						</div>
					{:else if isGenerating}
						<div class="generating-indicator">
							<div class="spinner"></div>
							<p>Generating your app...</p>
						</div>
					{/if}
				</div>
			</div>
		</main>
	</div>
{/if}

<style>
	.generated-app-container {
		position: fixed;
		top: 0;
		left: 0;
		width: 100%;
		height: 100%;
		z-index: 100;
		background: white;
	}

	.generated-app-iframe {
		width: 100%;
		height: 100%;
		border: none;
	}

	.close-preview {
		position: fixed;
		bottom: 20px;
		right: 20px;
		padding: 10px 20px;
		background: #333;
		color: white;
		border: none;
		border-radius: 5px;
		cursor: pointer;
		z-index: 101;
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

	.prompt-wrapper {
		margin-bottom: 2rem;
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

