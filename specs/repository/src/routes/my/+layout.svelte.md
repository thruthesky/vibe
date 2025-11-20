---
title: +layout.svelte - Svelte 5 컴포넌트
original_path: src/routes/my/+layout.svelte
category: route
file_type: svelte
status: current
last_updated: 2025-11-20
---

# +layout.svelte

## 개요

**원본 경로**: `src/routes/my/+layout.svelte`

**파일 유형**: Svelte 5 컴포넌트

## 소스 코드

```svelte
<script lang="ts">
	/**
	 * 사용자 페이지 공통 레이아웃
	 *
	 * 사용자 개인 페이지의 공통 구조를 정의합니다.
	 * 로그인 확인 및 사용자 메뉴를 포함합니다.
	 */
	import { page } from '$app/stores';
	import { goto } from '$app/navigation';
	import { authStore } from '$lib/stores/auth.svelte';

	let { children } = $props();

	// 로그인 확인 (향후 구현)
	// if (!authStore.isAuthenticated) {
	//   goto('/user/login');
	// }
</script>

<div class="user-layout">
	<div class="user-container">
		<!-- 상단 탭바 네비게이션 -->
		<nav class="tab-nav">
			<ul class="tab-list">
				<li>
					<a href="/my/reports" class="tab-link" class:active={$page.url.pathname === '/my/reports'}>
						내 신고 목록
					</a>
				</li>
				<!-- 향후 추가 사용자 메뉴 -->
			</ul>
		</nav>

		<!-- 사용자 메인 컨텐츠 -->
		<main class="user-main">
			{@render children()}
		</main>
	</div>
</div>

<style>
	/* 🔴 Light Mode Only: 모든 색상은 Light Mode 전용입니다 */
	.user-layout {
		min-height: 100vh;
		background-color: #f9fafb; /* Light gray background */
	}

	.user-container {
		max-width: 1400px;
		margin: 0 auto;
		padding: 2rem 1rem;
	}

	/* 상단 탭바 네비게이션 */
	.tab-nav {
		background-color: #ffffff; /* Light white background */
		border-bottom: 2px solid #e5e7eb; /* Light gray border */
		margin-bottom: 2rem;
	}

	.tab-list {
		list-style: none;
		padding: 0;
		margin: 0;
		display: flex;
		gap: 0;
	}

	.tab-link {
		display: block;
		padding: 1rem 1.5rem;
		color: #6b7280; /* Light gray text */
		text-decoration: none;
		border-bottom: 3px solid transparent;
		transition: all 0.2s ease;
		font-weight: 500;
		position: relative;
	}

	.tab-link:hover {
		color: #3b82f6; /* Blue accent on hover */
		background-color: #f9fafb; /* Subtle hover background */
	}

	.tab-link.active {
		color: #3b82f6; /* Blue accent (light friendly) */
		border-bottom-color: #3b82f6; /* Blue bottom border for active tab */
		font-weight: 600;
	}

	/* 사용자 메인 컨텐츠 */
	.user-main {
		width: 100%;
	}

	/* 반응형 */
	@media (max-width: 640px) {
		.user-container {
			padding: 1rem 0.5rem;
		}

		.tab-list {
			flex-wrap: wrap;
		}

		.tab-link {
			padding: 0.75rem 1rem;
			font-size: 0.9rem;
		}
	}
</style>
```
