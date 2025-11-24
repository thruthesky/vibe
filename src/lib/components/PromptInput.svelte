<script lang="ts">
	import { authStore } from '$lib/stores/auth.svelte';

	let { onSubmit, showLoginModal = $bindable(false) } = $props<{
		onSubmit: (prompt: string) => void;
		showLoginModal?: boolean;
	}>();

	let prompt = $state('');

	function handleClick() {
		if (!authStore.isAuthenticated) {
			showLoginModal = true;
		}
	}

	function handleSubmit(e: Event) {
		e.preventDefault();
		if (!authStore.isAuthenticated) {
			showLoginModal = true;
			return;
		}
		if (prompt.trim()) {
			onSubmit(prompt);
			prompt = '';
		}
	}
</script>

<div class="prompt-container">
	<form class="prompt-form" onsubmit={handleSubmit}>
		<input
			type="text"
			bind:value={prompt}
			onclick={handleClick}
			placeholder="Ask Vibers to create a landing page for my..."
			class="prompt-input"
			disabled={!authStore.isAuthenticated}
		/>
		<button
			type="submit"
			class="send-button"
			disabled={!authStore.isAuthenticated || !prompt.trim()}
			aria-label="Send"
		>
			<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor">
				<path
					stroke-linecap="round"
					stroke-linejoin="round"
					stroke-width="2"
					d="M5 12h14m-7-7l7 7-7 7"
				/>
			</svg>
		</button>
	</form>
</div>

<style>
	.prompt-container {
		width: 100%;
		max-width: 700px;
		margin: 0 auto;
	}

	.prompt-form {
		position: relative;
		display: flex;
		align-items: center;
		gap: 0.5rem;
	}

	.prompt-input {
		flex: 1;
		padding: 1.25rem 1.5rem;
		padding-right: 4rem;
		font-size: 1rem;
		border: 1px solid rgba(255, 255, 255, 0.2);
		border-radius: 50px;
		background: rgba(255, 255, 255, 0.95);
		backdrop-filter: blur(10px);
		color: #1a1a1a;
		outline: none;
		transition: all 0.3s ease;
		box-shadow: 0 4px 20px rgba(0, 0, 0, 0.1);
	}

	.prompt-input::placeholder {
		color: #999;
	}

	.prompt-input:focus {
		border-color: rgba(99, 102, 241, 0.5);
		box-shadow: 0 8px 30px rgba(99, 102, 241, 0.2);
		transform: translateY(-2px);
	}

	.prompt-input:disabled {
		cursor: pointer;
		opacity: 0.9;
	}

	.send-button {
		position: absolute;
		right: 0.5rem;
		width: 2.5rem;
		height: 2.5rem;
		border-radius: 50%;
		border: none;
		background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
		color: white;
		cursor: pointer;
		display: flex;
		align-items: center;
		justify-content: center;
		transition: all 0.3s ease;
		box-shadow: 0 4px 12px rgba(102, 126, 234, 0.4);
	}

	.send-button:hover:not(:disabled) {
		transform: scale(1.1);
		box-shadow: 0 6px 20px rgba(102, 126, 234, 0.6);
	}

	.send-button:disabled {
		opacity: 0.5;
		cursor: not-allowed;
	}

	.send-button:active:not(:disabled) {
		transform: scale(0.95);
	}
</style>
