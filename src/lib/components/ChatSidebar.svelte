<script lang="ts">
	interface Message {
		role: 'user' | 'assistant';
		content: string;
		subdomain?: string;
	}

	let { messages = $bindable<Message[]>([]), onSubmit, isGenerating = false } = $props<{
		messages?: Message[];
		onSubmit: (prompt: string) => void;
		isGenerating?: boolean;
	}>();

	let prompt = $state('');
	let messagesContainer: HTMLDivElement;

	function handleSubmit(e: Event) {
		e.preventDefault();
		if (!prompt.trim() || isGenerating) return;

		onSubmit(prompt);
		prompt = '';

		// Scroll to bottom after message is added
		setTimeout(() => {
			if (messagesContainer) {
				messagesContainer.scrollTop = messagesContainer.scrollHeight;
			}
		}, 100);
	}

	// Auto-scroll when new messages arrive
	$effect(() => {
		if (messages.length > 0 && messagesContainer) {
			messagesContainer.scrollTop = messagesContainer.scrollHeight;
		}
	});
</script>

<aside class="chat-sidebar">
	<div class="chat-header">
		<h3>Chat History</h3>
	</div>

	<div class="messages" bind:this={messagesContainer}>
		{#if messages.length === 0}
			<div class="empty-state">
				<p>Start a conversation to create your app</p>
			</div>
		{:else}
			{#each messages as message}
				<div class="message {message.role}">
					<div class="message-content">
						{message.content}
					</div>
					{#if message.subdomain}
						<a
							href="https://{message.subdomain}.vibers.kr"
							target="_blank"
							rel="noopener noreferrer"
							class="subdomain-link"
						>
							🚀 View at {message.subdomain}.vibers.kr
						</a>
					{/if}
				</div>
			{/each}
		{/if}
	</div>

	<div class="chat-input-container">
		<form class="chat-input-form" onsubmit={handleSubmit}>
			<input
				type="text"
				bind:value={prompt}
				placeholder="Describe your app..."
				class="chat-input"
				disabled={isGenerating}
			/>
			<button
				type="submit"
				class="send-button"
				disabled={!prompt.trim() || isGenerating}
				aria-label="Send"
			>
				{#if isGenerating}
					<div class="button-spinner"></div>
				{:else}
					<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor">
						<path
							stroke-linecap="round"
							stroke-linejoin="round"
							stroke-width="2"
							d="M5 12h14m-7-7l7 7-7 7"
						/>
					</svg>
				{/if}
			</button>
		</form>
	</div>
</aside>

<style>
	.chat-sidebar {
		position: fixed;
		left: 0;
		top: 4rem;
		bottom: 0;
		width: 30%;
		background: rgba(255, 255, 255, 0.95);
		backdrop-filter: blur(10px);
		border-right: 1px solid rgba(0, 0, 0, 0.05);
		display: flex;
		flex-direction: column;
		z-index: 50;
	}

	.chat-header {
		padding: 1.5rem;
		border-bottom: 1px solid rgba(0, 0, 0, 0.05);
		flex-shrink: 0;
	}

	.chat-header h3 {
		margin: 0;
		font-size: 1.125rem;
		font-weight: 600;
		color: #1a1a1a;
	}

	.messages {
		flex: 1;
		overflow-y: auto;
		padding: 1rem;
		display: flex;
		flex-direction: column;
		gap: 1rem;
		scroll-behavior: smooth;
	}

	.empty-state {
		display: flex;
		align-items: center;
		justify-content: center;
		height: 100%;
		padding: 2rem;
		text-align: center;
	}

	.empty-state p {
		color: #999;
		font-size: 0.9rem;
	}

	.message {
		padding: 1rem;
		border-radius: 12px;
		animation: slideIn 0.3s ease-out;
	}

	@keyframes slideIn {
		from {
			opacity: 0;
			transform: translateX(-10px);
		}
		to {
			opacity: 1;
			transform: translateX(0);
		}
	}

	.message.user {
		background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
		color: white;
		margin-left: auto;
		max-width: 85%;
	}

	.message.assistant {
		background: #f5f5f5;
		color: #1a1a1a;
		max-width: 85%;
	}

	.message-content {
		font-size: 0.9rem;
		line-height: 1.5;
		word-wrap: break-word;
	}

	.subdomain-link {
		display: inline-block;
		margin-top: 0.75rem;
		padding: 0.5rem 1rem;
		background: rgba(255, 255, 255, 0.2);
		border-radius: 6px;
		color: inherit;
		text-decoration: none;
		font-size: 0.85rem;
		font-weight: 500;
		transition: all 0.2s;
	}

	.message.assistant .subdomain-link {
		background: rgba(102, 126, 234, 0.1);
		color: #667eea;
	}

	.subdomain-link:hover {
		transform: translateY(-2px);
		box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
	}

	.chat-input-container {
		padding: 1rem;
		border-top: 1px solid rgba(0, 0, 0, 0.05);
		background: white;
		flex-shrink: 0;
	}

	.chat-input-form {
		position: relative;
		display: flex;
		align-items: center;
		gap: 0.5rem;
	}

	.chat-input {
		flex: 1;
		padding: 0.875rem 3rem 0.875rem 1rem;
		font-size: 0.95rem;
		border: 1px solid #e0e0e0;
		border-radius: 24px;
		background: #f8f8f8;
		color: #1a1a1a;
		outline: none;
		transition: all 0.2s;
	}

	.chat-input::placeholder {
		color: #999;
	}

	.chat-input:focus {
		border-color: #667eea;
		background: white;
		box-shadow: 0 0 0 3px rgba(102, 126, 234, 0.1);
	}

	.chat-input:disabled {
		opacity: 0.6;
		cursor: not-allowed;
	}

	.send-button {
		position: absolute;
		right: 0.25rem;
		width: 2.25rem;
		height: 2.25rem;
		border-radius: 50%;
		border: none;
		background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
		color: white;
		cursor: pointer;
		display: flex;
		align-items: center;
		justify-content: center;
		transition: all 0.2s;
		box-shadow: 0 2px 8px rgba(102, 126, 234, 0.3);
	}

	.send-button:hover:not(:disabled) {
		transform: scale(1.05);
		box-shadow: 0 4px 12px rgba(102, 126, 234, 0.5);
	}

	.send-button:disabled {
		opacity: 0.5;
		cursor: not-allowed;
	}

	.send-button:active:not(:disabled) {
		transform: scale(0.95);
	}

	.button-spinner {
		width: 16px;
		height: 16px;
		border: 2px solid rgba(255, 255, 255, 0.3);
		border-top-color: white;
		border-radius: 50%;
		animation: spin 0.6s linear infinite;
	}

	@keyframes spin {
		to {
			transform: rotate(360deg);
		}
	}
</style>
