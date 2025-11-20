---
title: +page.svelte - Svelte 5 컴포넌트
original_path: src/routes/friend/following/+page.svelte
category: route
file_type: svelte
status: current
last_updated: 2025-11-20
---

# +page.svelte

## 개요

**원본 경로**: `src/routes/friend/following/+page.svelte`

**파일 유형**: Svelte 5 컴포넌트

## 소스 코드

```svelte
<script lang="ts">
	/**
	 * 팔로잉 목록 페이지
	 *
	 * 현재 사용자가 팔로우하는 사용자 목록을 표시합니다.
	 * - `/user-following/{myUid}` 경로에서 목록 조회
	 * - 실시간 업데이트 지원
	 * - 각 사용자 프로필과 언팔로우 버튼 표시
	 */

	import { onMount, onDestroy } from 'svelte';
	import { rtdb as database } from '$lib/firebase';
	import { ref, onValue, get, type Unsubscribe } from 'firebase/database';
	import { authStore } from '$lib/stores/auth.svelte';
	import * as m from '$lib/paraglide/messages.js';
	import { goto } from '$app/navigation';

	// 컴포넌트 import
	import UserProfile from '$lib/components/UserProfile.svelte';
	import FollowButton from '$lib/components/friend/follow-button.svelte';

	// 사용자 정보 타입
	interface UserInfo {
		uid: string;
		displayName: string;
		photoUrl?: string;
	}

	// 상태 관리
	let loading = $state(true);
	let followingList = $state<UserInfo[]>([]);

	// Firebase 구독 해제 함수
	let unsubscribe: Unsubscribe | null = null;

	/**
	 * 팔로잉 목록 실시간 구독
	 */
	async function subscribeFollowing() {
		const myUid = authStore.user?.uid;

		// 로그인 체크
		if (!myUid) {
			alert(m.followLoginRequired());
			goto('/');
			return;
		}

		if (!database) {
			loading = false;
			return;
		}

		// 팔로잉 목록 구독
		const followingRef = ref(database, `user-following/${myUid}`);

		unsubscribe = onValue(
			followingRef,
			async (snapshot) => {
				const data = snapshot.val() || {};
				const uids = Object.keys(data);

				// 각 UID에 대한 사용자 정보 조회
				const userPromises = uids.map(async (uid) => {
					if (!database) return null;
					const userRef = ref(database, `users/${uid}`);
					const userSnapshot = await get(userRef);
					const userData = userSnapshot.val();

					if (userData) {
						return {
							uid,
							displayName: userData.displayName || 'Unknown',
							photoUrl: userData.photoUrl
						} as UserInfo;
					}
					return null;
				});

				const users = await Promise.all(userPromises);
				followingList = users.filter((u) => u !== null) as UserInfo[];
				loading = false;
			},
			(error) => {
				console.error('팔로잉 목록 구독 오류:', error);
				loading = false;
			}
		);
	}

	// 컴포넌트 마운트 시 구독 시작
	onMount(() => {
		subscribeFollowing();
	});

	// 컴포넌트 언마운트 시 구독 해제
	onDestroy(() => {
		if (unsubscribe) {
			unsubscribe();
		}
	});
</script>

<div class="following-page">
	<div class="page-header">
		<h1 class="page-title">{m.followingList()}</h1>
	</div>

	{#if loading}
		<div class="loading-container">
			<p>{m.commonLoading()}</p>
		</div>
	{:else if followingList.length === 0}
		<div class="empty-container">
			<p>{m.noFollowing()}</p>
		</div>
	{:else}
		<div class="user-list">
			{#each followingList as user (user.uid)}
				<div class="user-item">
					<div class="user-profile">
						<UserProfile uid={user.uid} />
					</div>
					<div class="user-action">
						<FollowButton targetUid={user.uid} />
					</div>
				</div>
			{/each}
		</div>
	{/if}
</div>

<style>
	@reference "tailwindcss";

	/* 페이지 컨테이너 */
	.following-page {
		@apply max-w-2xl mx-auto p-4;
	}

	/* 페이지 헤더 */
	.page-header {
		@apply mb-6;
	}

	.page-title {
		@apply text-2xl font-bold text-gray-900;
	}

	/* 로딩/빈 상태 */
	.loading-container,
	.empty-container {
		@apply flex items-center justify-center py-12;
	}

	.loading-container p,
	.empty-container p {
		@apply text-gray-500 text-center;
	}

	/* 사용자 목록 */
	.user-list {
		@apply flex flex-col gap-3;
	}

	/* 사용자 아이템 */
	.user-item {
		@apply bg-white rounded-lg shadow-sm border p-4;
		@apply flex items-center justify-between;
		@apply transition-shadow duration-200;
		@apply hover:shadow-md;
	}

	.user-profile {
		@apply flex-1;
	}

	.user-action {
		@apply ml-4;
	}
</style>
```
