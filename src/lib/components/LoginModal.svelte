<script lang="ts">
	import { authStore } from '$lib/stores/auth.svelte';

	let { isOpen = $bindable(false) } = $props();

	async function handleGoogleSignIn() {
		try {
			await authStore.signInWithGoogle();
			isOpen = false;
		} catch (error) {
			console.error('Sign-in failed:', error);
		}
	}

	async function handleAppleSignIn() {
		try {
			await authStore.signInWithApple();
			isOpen = false;
		} catch (error) {
			console.error('Sign-in failed:', error);
		}
	}

	function handleClose() {
		isOpen = false;
	}
</script>

{#if isOpen}
	<div class="modal-overlay" onclick={handleClose} role="presentation">
		<div class="modal-content" onclick={(e) => e.stopPropagation()} role="dialog">
			<button class="close-button" onclick={handleClose} aria-label="Close">×</button>

			<div class="modal-header">
				<div class="logo-icon">🤖</div>
				<h2>Start Building.</h2>
				<p>Log in to your account</p>
			</div>

			<div class="auth-buttons">
				<button class="auth-button google" onclick={handleGoogleSignIn}>
					<svg width="18" height="18" viewBox="0 0 18 18">
						<path
							fill="#4285F4"
							d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844c-.209 1.125-.843 2.078-1.796 2.717v2.258h2.908c1.702-1.567 2.684-3.874 2.684-6.615z"
						></path>
						<path
							fill="#34A853"
							d="M9 18c2.43 0 4.467-.806 5.956-2.184l-2.908-2.258c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332C2.438 15.983 5.482 18 9 18z"
						></path>
						<path
							fill="#FBBC05"
							d="M3.964 10.707c-.18-.54-.282-1.117-.282-1.707s.102-1.167.282-1.707V4.961H.957C.347 6.175 0 7.55 0 9s.348 2.825.957 4.039l3.007-2.332z"
						></path>
						<path
							fill="#EA4335"
							d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0 5.482 0 2.438 2.017.957 4.961L3.964 7.29C4.672 5.163 6.656 3.58 9 3.58z"
						></path>
					</svg>
					Continue with Google
				</button>

				<button class="auth-button apple" onclick={handleAppleSignIn}>
					<svg width="18" height="18" viewBox="0 0 18 18" fill="currentColor">
						<path
							d="M14.94 13.52c-.26.58-.39.84-.73 1.36-.47.72-1.13 1.62-1.95 1.63-.73.01-1.02-.48-1.9-.47-.88 0-1.15.48-1.88.48-.82.01-1.43-.84-1.9-1.56-1.33-2.03-1.47-4.41-.65-5.67.58-.9 1.5-1.43 2.37-1.43.88 0 1.44.48 2.17.48.7 0 1.13-.48 2.14-.48.77 0 1.58.42 2.16 1.14-1.9 1.04-1.59 3.75.27 4.52zm-2.93-8.7c.38-.49.67-1.18.56-1.87-.61.03-1.33.42-1.76.93-.38.45-.7 1.16-.58 1.83.66.04 1.34-.37 1.78-.89z"
						></path>
					</svg>
					Login with Apple Account
				</button>
			</div>
		</div>
	</div>
{/if}

<style>
	.modal-overlay {
		position: fixed;
		inset: 0;
		background: rgba(0, 0, 0, 0.5);
		backdrop-filter: blur(4px);
		display: flex;
		align-items: center;
		justify-content: center;
		z-index: 1000;
		animation: fadeIn 0.2s ease-out;
	}

	@keyframes fadeIn {
		from {
			opacity: 0;
		}
		to {
			opacity: 1;
		}
	}

	.modal-content {
		background: white;
		border-radius: 16px;
		padding: 2.5rem;
		max-width: 420px;
		width: 90%;
		position: relative;
		box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
		animation: slideUp 0.3s ease-out;
	}

	@keyframes slideUp {
		from {
			transform: translateY(20px);
			opacity: 0;
		}
		to {
			transform: translateY(0);
			opacity: 1;
		}
	}

	.close-button {
		position: absolute;
		top: 1rem;
		right: 1rem;
		background: none;
		border: none;
		font-size: 2rem;
		color: #666;
		cursor: pointer;
		width: 2rem;
		height: 2rem;
		display: flex;
		align-items: center;
		justify-content: center;
		border-radius: 4px;
		transition: all 0.2s;
	}

	.close-button:hover {
		background: #f0f0f0;
		color: #333;
	}

	.modal-header {
		text-align: center;
		margin-bottom: 2rem;
	}

	.logo-icon {
		font-size: 3rem;
		margin-bottom: 1rem;
	}

	.modal-header h2 {
		font-size: 1.75rem;
		font-weight: 700;
		margin: 0 0 0.5rem 0;
		color: #1a1a1a;
	}

	.modal-header p {
		font-size: 1rem;
		color: #666;
		margin: 0;
	}

	.auth-buttons {
		display: flex;
		flex-direction: column;
		gap: 1rem;
	}

	.auth-button {
		display: flex;
		align-items: center;
		justify-content: center;
		gap: 0.75rem;
		padding: 0.875rem 1.5rem;
		border: 1px solid #e0e0e0;
		border-radius: 8px;
		background: white;
		font-size: 0.95rem;
		font-weight: 500;
		color: #333;
		cursor: pointer;
		transition: all 0.2s;
	}

	.auth-button:hover {
		background: #f8f8f8;
		border-color: #ccc;
		transform: translateY(-1px);
		box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
	}

	.auth-button:active {
		transform: translateY(0);
	}

	.auth-button.apple {
		background: #000;
		color: white;
		border-color: #000;
	}

	.auth-button.apple:hover {
		background: #1a1a1a;
		border-color: #1a1a1a;
	}
</style>
