<script lang="ts">
	import { authStore } from '$lib/stores/auth.svelte';
	import LoginModal from '$lib/components/LoginModal.svelte';

	let { showLoginModal = $bindable(false) } = $props();

	async function handleLogout() {
		await authStore.signOut();
	}
</script>

<header class="header">
	<div class="header-content">
		<div class="logo">
			<span class="logo-icon">🤖</span>
			<span class="logo-text">Vibers</span>
		</div>

		<div class="auth-section">
			{#if authStore.isAuthenticated}
				<button class="logout-button" onclick={handleLogout}> Log out </button>
			{:else}
				<button class="login-button" onclick={() => (showLoginModal = true)}> Log in </button>
			{/if}
		</div>
	</div>
</header>

<LoginModal bind:isOpen={showLoginModal} />

<style>
	.header {
		position: fixed;
		top: 0;
		left: 0;
		right: 0;
		z-index: 100;
		background: rgba(255, 255, 255, 0.8);
		backdrop-filter: blur(10px);
		border-bottom: 1px solid rgba(0, 0, 0, 0.05);
	}

	.header-content {
		max-width: 1400px;
		margin: 0 auto;
		padding: 1rem 2rem;
		display: flex;
		justify-content: space-between;
		align-items: center;
	}

	.logo {
		display: flex;
		align-items: center;
		gap: 0.5rem;
		font-size: 1.25rem;
		font-weight: 700;
		color: #1a1a1a;
	}

	.logo-icon {
		font-size: 1.5rem;
	}

	.login-button,
	.logout-button {
		padding: 0.625rem 1.5rem;
		border: 1px solid #e0e0e0;
		border-radius: 8px;
		background: white;
		font-size: 0.95rem;
		font-weight: 500;
		color: #333;
		cursor: pointer;
		transition: all 0.2s;
	}

	.login-button:hover,
	.logout-button:hover {
		background: #f8f8f8;
		border-color: #ccc;
		transform: translateY(-1px);
		box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
	}
</style>
