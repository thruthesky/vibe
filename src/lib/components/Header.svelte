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
			<span class="logo-icon">
				<svg
					width="1em"
					height="1em"
					viewBox="0 0 24 24"
					fill="none"
					xmlns="http://www.w3.org/2000/svg"
				>
					<rect x="4" y="4" width="16" height="14" rx="2" stroke="currentColor" stroke-width="2" />
					<rect x="7" y="9" width="2" height="2" fill="currentColor" />
					<rect x="15" y="9" width="2" height="2" fill="currentColor" />
					<path d="M9 14H15" stroke="currentColor" stroke-width="2" stroke-linecap="round" />
					<path d="M12 4V2" stroke="currentColor" stroke-width="2" stroke-linecap="round" />
					<circle cx="12" cy="2" r="1" fill="currentColor" />
					<path d="M2 11H4" stroke="currentColor" stroke-width="2" stroke-linecap="round" />
					<path d="M20 11H22" stroke="currentColor" stroke-width="2" stroke-linecap="round" />
				</svg>
			</span>
			<span class="logo-text">한바보</span>
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
