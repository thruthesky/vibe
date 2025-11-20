<script lang="ts">
	/**
	 * 관리자 페이지 - 테스트 계정 관리
	 *
	 * 비밀번호 인증 후 테스트 계정으로 빠르게 로그인할 수 있는 페이지입니다.
	 */

	import { onMount } from 'svelte';
	import { auth } from '$lib/firebase';
	import { signInWithEmailAndPassword, onAuthStateChanged, type User } from 'firebase/auth';
	import { ADMIN_MANAGE_PASSWORD, TEST_ACCOUNT_PASSWORD } from '../../../app.config';
	import * as m from '$lib/paraglide/messages.js';

	/**
	 * 테스트 계정 타입 정의
	 */
	type TestAccount = {
		label: string;
		name: string;
		email: string;
	};

	/**
	 * 테스트 계정 데이터
	 */
	const TEST_ACCOUNTS: TestAccount[] = [
		// 브라우저 계정 (I-W)
		{ label: 'I', name: 'chrome', email: 'chrome@test.com' },
		{ label: 'J', name: 'canary', email: 'canary@test.com' },
		{ label: 'K', name: 'opera', email: 'opera@test.com' },
		{ label: 'L', name: 'safari', email: 'safari@test.com' },
		{ label: 'M', name: 'chatgptatlas', email: 'chatgptatlas@test.com' },
		{ label: 'N', name: 'edge', email: 'edge@test.com' },
		{ label: 'O', name: 'firefox', email: 'firefox@test.com' },
		{ label: 'P', name: 'arc', email: 'arc@test.com' },
		{ label: 'Q', name: 'whale', email: 'whale@test.com' },
		{ label: 'R', name: 'genspark', email: 'genspark@test.com' },
		{ label: 'S', name: 'dia', email: 'dia@test.com' },
		{ label: 'T', name: 'vivaldi', email: 'vivaldi@test.com' },
		{ label: 'U', name: 'min', email: 'min@test.com' },
		{ label: 'V', name: 'comet', email: 'comet@test.com' },
		{ label: 'W', name: 'zen', email: 'zen@test.com' },

		// 과일 계정 (A-H)
		{ label: 'A', name: 'apple', email: 'apple@test.com' },
		{ label: 'B', name: 'banana', email: 'banana@test.com' },
		{ label: 'C', name: 'cherry', email: 'cherry@test.com' },
		{ label: 'D', name: 'durian', email: 'durian@test.com' },
		{ label: 'E', name: 'elderberry', email: 'elderberry@test.com' },
		{ label: 'F', name: 'fig', email: 'fig@test.com' },
		{ label: 'G', name: 'grape', email: 'grape@test.com' },
		{ label: 'H', name: 'honeydew', email: 'honeydew@test.com' }
	];

	/**
	 * 상태 관리
	 */
	let isAuthenticated = $state<boolean>(false);
	let passwordInput = $state<string>('');
	let passwordError = $state<string>('');
	let isLoading = $state<boolean>(false);
	let loginError = $state<string>('');
	let currentUser = $state<User | null>(null);

	/**
	 * 컴포넌트 마운트 시 초기화
	 */
	onMount(() => {
		if (!auth) {
			console.error('[Admin] Firebase Auth가 초기화되지 않았습니다.');
			return;
		}

		// Firebase Auth 상태 변경 리스너 등록
		const unsubscribe = onAuthStateChanged(auth, (user) => {
			currentUser = user;
		});

		return () => {
			unsubscribe();
		};
	});

	/**
	 * 비밀번호 확인 핸들러
	 */
	function handlePasswordSubmit(event: Event): void {
		event.preventDefault();

		if (passwordInput === ADMIN_MANAGE_PASSWORD) {
			isAuthenticated = true;
			passwordError = '';
		} else {
			passwordError = '비밀번호가 올바르지 않습니다.';
		}
	}

	/**
	 * 테스트 계정 로그인 핸들러
	 */
	async function handleTestLogin(account: TestAccount): Promise<void> {
		if (isLoading || !auth) return;

		isLoading = true;
		loginError = '';

		try {
			await signInWithEmailAndPassword(auth, account.email, TEST_ACCOUNT_PASSWORD);

			// 로그인 성공 - 페이지 리다이렉트
			window.location.href = '/';
		} catch (error: any) {
			console.error('[Admin] 로그인 오류:', error);

			// 오류 메시지 설정
			let errorMessage: string = '로그인에 실패했습니다.';
			if (error.code === 'auth/user-not-found' || error.code === 'auth/invalid-credential') {
				errorMessage = '계정을 찾을 수 없습니다. 계정이 생성되어 있는지 확인하세요.';
			} else if (error.code === 'auth/wrong-password') {
				errorMessage = '비밀번호가 일치하지 않습니다.';
			} else if (error.code === 'auth/too-many-requests') {
				errorMessage = '너무 많은 요청이 발생했습니다. 잠시 후 다시 시도해주세요.';
			}

			loginError = errorMessage;
		} finally {
			isLoading = false;
		}
	}
</script>

<svelte:head>
	<title>관리자 페이지 - 테스트 계정 관리</title>
</svelte:head>

<div class="container">
	{#if !isAuthenticated}
		<!-- 비밀번호 입력 화면 -->
		<div class="password-box">
			<form onsubmit={handlePasswordSubmit}>
				<input
					type="password"
					bind:value={passwordInput}
					placeholder="관리자 비밀번호 입력"
					class="input"
					class:error={passwordError}
				/>
				{#if passwordError}
					<p class="error-text">{passwordError}</p>
				{/if}
			</form>
		</div>
	{:else}
		<!-- 테스트 계정 목록 화면 -->
		<div class="accounts-container">
			<h1>테스트 계정 관리</h1>
			<p class="subtitle">계정을 클릭하여 로그인하세요</p>

			<!-- 현재 로그인한 사용자 UID -->
			{#if currentUser}
				<div class="current-user">
					<strong>현재 로그인:</strong>
					<code>{currentUser.uid}</code>
				</div>
			{/if}

			{#if loginError}
				<div class="error-banner">
					{loginError}
				</div>
			{/if}

			<div class="accounts-list">
				{#each TEST_ACCOUNTS as account}
					<button class="account-btn" onclick={() => handleTestLogin(account)} disabled={isLoading}>
						<span class="label">{account.label}</span>
						<span class="name">{account.name}</span>
						<span class="email">{account.email}</span>
					</button>
				{/each}
			</div>

			{#if isLoading}
				<div class="loading">로그인 중...</div>
			{/if}
		</div>
	{/if}
</div>

<style>
	/* 컨테이너 */
	.container {
		min-height: 100vh;
		padding: 2rem;
		background-color: #f9fafb;
	}

	/* 비밀번호 입력 박스 */
	.password-box {
		max-width: 500px;
		margin: 0 auto 2rem auto;
		background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
		border: none;
		border-radius: 12px;
		padding: 2rem;
		box-shadow: 0 10px 25px rgba(102, 126, 234, 0.3);
	}

	h1 {
		font-size: 1.5rem;
		font-weight: 700;
		color: #111827;
		margin: 0 0 0.5rem 0;
	}

	.subtitle {
		font-size: 0.875rem;
		color: #6b7280;
		margin: 0 0 1.5rem 0;
	}

	.input {
		width: 100%;
		padding: 1rem;
		border: 2px solid rgba(255, 255, 255, 0.3);
		border-radius: 8px;
		font-size: 1.125rem;
		margin-bottom: 0.5rem;
		background: rgba(255, 255, 255, 0.95);
		color: #1f2937;
		font-weight: 500;
		transition: all 0.3s ease;
	}

	.input:focus {
		outline: none;
		border-color: #ffffff;
		background: #ffffff;
		box-shadow: 0 0 0 4px rgba(255, 255, 255, 0.2);
		transform: translateY(-2px);
	}

	.input::placeholder {
		color: #9ca3af;
	}

	.input.error {
		border-color: #fca5a5;
		background: #fee2e2;
		animation: shake 0.5s;
	}

	@keyframes shake {
		0%,
		100% {
			transform: translateX(0);
		}
		25% {
			transform: translateX(-10px);
		}
		75% {
			transform: translateX(10px);
		}
	}

	.error-text {
		color: #fef2f2;
		background: rgba(239, 68, 68, 0.9);
		font-size: 0.875rem;
		margin: 0;
		padding: 0.5rem 0.75rem;
		border-radius: 6px;
		font-weight: 500;
	}

	/* 계정 목록 컨테이너 */
	.accounts-container {
		width: 100%;
		max-width: 1000px;
	}

	.current-user {
		background-color: #f0fdf4;
		border: 1px solid #86efac;
		border-radius: 6px;
		padding: 1rem;
		margin-bottom: 1rem;
		font-size: 0.875rem;
	}

	.current-user code {
		display: block;
		margin-top: 0.5rem;
		font-family: monospace;
		font-size: 0.8rem;
		color: #047857;
		background-color: #dcfce7;
		padding: 0.5rem;
		border-radius: 4px;
		word-break: break-all;
	}

	.error-banner {
		background-color: #fee2e2;
		border: 1px solid #fca5a5;
		color: #991b1b;
		padding: 1rem;
		border-radius: 6px;
		margin-bottom: 1rem;
	}

	.accounts-list {
		display: grid;
		grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
		gap: 1rem;
	}

	.account-btn {
		background: white;
		border: 1px solid #e5e7eb;
		border-radius: 6px;
		padding: 1rem;
		display: flex;
		flex-direction: column;
		align-items: flex-start;
		gap: 0.25rem;
		cursor: pointer;
		transition: all 0.2s;
		text-align: left;
	}

	.account-btn:hover:not(:disabled) {
		border-color: #3b82f6;
		box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
	}

	.account-btn:disabled {
		opacity: 0.5;
		cursor: not-allowed;
	}

	.label {
		font-family: monospace;
		font-size: 0.875rem;
		font-weight: 700;
		color: #3b82f6;
	}

	.name {
		font-size: 1rem;
		font-weight: 600;
		color: #111827;
		text-transform: capitalize;
	}

	.email {
		font-size: 0.8rem;
		color: #6b7280;
	}

	.loading {
		margin-top: 1rem;
		text-align: center;
		color: #6b7280;
		font-size: 0.875rem;
	}

	/* 반응형 */
	@media (max-width: 768px) {
		.accounts-list {
			grid-template-columns: 1fr;
		}
	}
</style>
