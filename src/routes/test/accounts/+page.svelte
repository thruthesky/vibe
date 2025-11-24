<script lang="ts">
	import { authStore } from '$lib/stores/auth.svelte';
	import { goto } from '$app/navigation';

	let email = '';// $state not needed
	let password = '';// $state not needed
	let error = '';// $state not needed

	const ALLOWED_ACCOUNTS = ['apple@test.com', 'banana@test.com', 'cherry@test.com'];
	const COMMON_PASSWORD = '12345a,*';

	function handleLogin() {
		error = '';// reset error

		if (!ALLOWED_ACCOUNTS.includes(email)) {
			error = 'Invalid email address';
			return;
		}

		if (password !== COMMON_PASSWORD) {
			error = 'Invalid password';
			return;
		}

		// Perform mock login
		authStore.mockLogin(email);
		goto('/');
	}

	function autoLogin(account: string) {
		authStore.mockLogin(account);
		goto('/');
	}
</script>

<div class="container">
	<div class="login-card">
		<h1>Test Login</h1>
		<div class="form-group">
			<label for="email">Email</label>
			<input type="email" id="email" bind:value={email} placeholder="Enter test email" />
		</div>
		<div class="form-group">
			<label for="password">Password</label>
			<input type="password" id="password" bind:value={password} placeholder="Enter password" />
		</div>
		{#if error}
			<p class="error">{error}</p>
		{/if}
		<button onclick={handleLogin}>Sign In</button>
		
		<div class="accounts-hint">
			<h3>Available Accounts:</h3>
			<ul>
				{#each ALLOWED_ACCOUNTS as acc}
					<li>{acc}</li>
				{/each}
			</ul>
			<p>Password: {COMMON_PASSWORD}</p>
			<div class="auto-login-buttons">
				{#each ALLOWED_ACCOUNTS as acc}
					<button onclick={() => autoLogin(acc)}>{acc} (auto login)</button>
				{/each}
			</div>
		</div>
	</div>
</div>

<style>
	.container {
		display: flex;
		justify-content: center;
		align-items: center;
		min-height: 100vh;
		background: #f5f5f5;
	}

	.login-card {
		background: white;
		padding: 2rem;
		border-radius: 8px;
		box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
		width: 100%;
		max-width: 400px;
	}

	h1 {
		text-align: center;
		margin-bottom: 2rem;
		color: #333;
	}

	.form-group {
		margin-bottom: 1rem;
	}

	label {
		display: block;
		margin-bottom: 0.5rem;
		color: #666;
	}

	input {
		width: 100%;
		padding: 0.75rem;
		border: 1px solid #ddd;
		border-radius: 4px;
		font-size: 1rem;
	}

	button {
		width: 100%;
		padding: 0.75rem;
		background: #007bff;
		color: white;
		border: none;
		border-radius: 4px;
		font-size: 1rem;
		cursor: pointer;
		margin-top: 1rem;
	}

	button:hover {
		background: #0056b3;
	}

	.error {
		color: red;
		margin-bottom: 1rem;
		font-size: 0.9rem;
	}

	.accounts-hint {
		margin-top: 2rem;
		padding-top: 1rem;
		border-top: 1px solid #eee;
		font-size: 0.9rem;
		color: #666;
	}

	ul {
		padding-left: 1.5rem;
		margin: 0.5rem 0;
	}
</style>
