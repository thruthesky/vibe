<script lang="ts">
	/**
	 * 사용자 피드 목록 컴포넌트
	 *
	 * 팔로우한 사용자들의 게시글을 실시간으로 표시합니다.
	 * Fan-out 패턴으로 구현된 피드 시스템을 사용합니다.
	 *
	 * 핵심 원칙:
	 * - 단일 진실 공급원(SSOT): 실제 데이터는 `/chat-messages/{messageId}`에만 존재
	 * - 최소 정보 원칙: 피드는 타임스탬프만 저장, 실제 내용은 필요시 fetch
	 * - 실시간 구독: `/user-feed/{myUid}` 경로를 실시간으로 구독
	 */

	import { onMount, onDestroy } from 'svelte';
	import { rtdb as database } from '$lib/firebase';
	import {
		ref,
		query,
		orderByValue,
		limitToLast,
		endBefore,
		onValue,
		get,
		type Unsubscribe
	} from 'firebase/database';
	import { authStore } from '$lib/stores/auth.svelte';
	import * as m from '$lib/paraglide/messages.js';

	// 다른 컴포넌트 import (재사용)
	import UserProfile from '$lib/components/UserProfile.svelte';
	import FileAttachments from '$lib/components/FileAttachments.svelte';
	import FollowButton from '$lib/components/friend/follow-button.svelte';

	// 사용자 정보 함수 import (재사용)
	import { getUserFields } from '$lib/functions/user.functions';

	// 메시지 타입 정의 (최소 정보만)
	interface MinimalMessage {
		id: string;
		senderId: string;
		text?: string;
		urls?: string[];
		createdAt: number;
	}

	// 사용자 정보 타입 (최소 정보만)
	interface MinimalUser {
		displayName: string;
		photoUrl?: string;
	}

	// Props
	/** 한 페이지당 로드할 피드 수 */
	let { pageSize = 20 }: { pageSize?: number } = $props();

	// 상태 관리
	/** 피드 메시지 목록 (ID -> timestamp 맵) */
	let feedMap = $state<Record<string, number>>({});

	/** 메시지 데이터 캐시 (ID -> MinimalMessage) */
	let messagesCache = $state<Record<string, MinimalMessage>>({});

	/** 사용자 데이터 캐시 (uid -> MinimalUser) */
	let usersCache = $state<Record<string, MinimalUser>>({});

	/** 초기 로딩 상태 */
	let initialLoading = $state(true);

	/** 추가 로딩 상태 (더보기) */
	let loadingMore = $state(false);

	/** 더 이상 로드할 데이터가 없는지 여부 */
	let hasMore = $state(true);

	/** 마지막으로 로드한 타임스탬프 (페이지네이션용) */
	let lastTimestamp: number | null = null;

	// Firebase 구독 해제 함수
	let unsubscribe: Unsubscribe | null = null;

	/**
	 * 피드 정렬된 목록
	 *
	 * feedMap을 createdAt 기준 내림차순으로 정렬한 메시지 ID 배열
	 */
	let sortedFeedIds = $derived.by(() => {
		return Object.entries(feedMap)
			.sort(([, a], [, b]) => b - a) // timestamp 내림차순
			.map(([id]) => id);
	});

	/**
	 * 피드 실시간 구독
	 *
	 * `/user-feed/{myUid}` 경로를 구독하여 실시간으로 피드를 업데이트합니다.
	 * 초기 로드 시 pageSize만큼만 가져옵니다.
	 */
	async function subscribeFeed() {
		const myUid = authStore.user?.uid;
		if (!myUid || !database) {
			initialLoading = false;
			return;
		}

		// 피드 경로: /user-feed/{myUid}
		const feedRef = ref(database, `user-feed/${myUid}`);

		// 최신 순으로 pageSize개만 쿼리
		const feedQuery = query(feedRef, orderByValue(), limitToLast(pageSize));

		unsubscribe = onValue(
			feedQuery,
			async (snapshot) => {
				const data = snapshot.val() || {};
				feedMap = data;

				// 메시지 ID 목록 추출
				const messageIds = Object.keys(data);

				// 각 메시지의 실제 데이터를 가져옴
				await fetchMessagesData(messageIds);

				initialLoading = false;

				// 페이지네이션용 마지막 타임스탬프 저장
				if (messageIds.length > 0) {
					const timestamps = Object.values(data) as number[];
					lastTimestamp = Math.min(...timestamps);
					hasMore = messageIds.length >= pageSize;
				} else {
					hasMore = false;
				}
			},
			(error) => {
				console.error('피드 구독 오류:', error);
				initialLoading = false;
			}
		);
	}

	/**
	 * 메시지 실제 데이터 가져오기
	 *
	 * `/chat-messages/{messageId}`에서 최소 정보만 가져옵니다.
	 * - senderId, text, urls, createdAt만 fetch
	 *
	 * @param messageIds - 가져올 메시지 ID 목록
	 */
	async function fetchMessagesData(messageIds: string[]) {
		if (!database) return;

		const fetchPromises = messageIds.map(async (messageId) => {
			// 이미 캐시에 있으면 스킵
			if (messagesCache[messageId]) {
				return;
			}

			try {
				if (!database) return;
				const messageRef = ref(database, `chat-messages/${messageId}`);
				const snapshot = await get(messageRef);
				const data = snapshot.val();

				if (data && !data.deleted) {
					// 최소 정보만 저장
					messagesCache[messageId] = {
						id: messageId,
						senderId: data.senderId || data.senderUid,
						text: data.text,
						urls: data.urls,
						createdAt: data.createdAt
					};

					// 사용자 정보도 가져오기
					await fetchUserData(data.senderId || data.senderUid);
				}
			} catch (error) {
				console.error(`메시지 데이터 가져오기 오류 (${messageId}):`, error);
			}
		});

		await Promise.all(fetchPromises);
	}

	/**
	 * 사용자 정보 가져오기
	 *
	 * ⚠️ RTDB 비용 최적화: getUserFields() 함수를 사용하여 필요한 필드만 가져옵니다.
	 * - `/users/{uid}` 전체가 아닌 `/users/{uid}/displayName`, `/users/{uid}/photoUrl`만 읽기
	 * - Promise.all()을 통해 병렬로 읽어서 성능 최적화
	 *
	 * @param uid - 사용자 UID
	 */
	async function fetchUserData(uid: string) {
		// 이미 캐시에 있으면 스킵
		if (!uid || !database || usersCache[uid]) {
			return;
		}

		try {
			// ⚠️ 기존 getUserFields() 함수 재활용하여 필요한 필드만 가져오기
			const userData = await getUserFields(uid, ['displayName', 'photoUrl']);

			// 최소 정보만 저장
			usersCache[uid] = {
				displayName: userData.displayName || 'Unknown',
				photoUrl: userData.photoUrl || undefined
			};
		} catch (error) {
			console.error(`사용자 데이터 가져오기 오류 (${uid}):`, error);
		}
	}

	/**
	 * 더보기 (페이지네이션)
	 *
	 * lastTimestamp보다 오래된 피드를 추가로 로드합니다.
	 */
	async function loadMore() {
		const myUid = authStore.user?.uid;
		if (!myUid || !database || !hasMore || loadingMore || lastTimestamp === null) {
			return;
		}

		loadingMore = true;

		try {
			const feedRef = ref(database, `user-feed/${myUid}`);

			// lastTimestamp보다 이전 데이터를 pageSize개만큼 쿼리
			const feedQuery = query(
				feedRef,
				orderByValue(),
				endBefore(lastTimestamp),
				limitToLast(pageSize)
			);

			const snapshot = await get(feedQuery);
			const data = snapshot.val() || {};

			// 기존 feedMap에 추가
			feedMap = { ...feedMap, ...data };

			// 메시지 ID 목록 추출
			const messageIds = Object.keys(data);

			// 각 메시지의 실제 데이터를 가져옴
			await fetchMessagesData(messageIds);

			// 페이지네이션용 마지막 타임스탬프 업데이트
			if (messageIds.length > 0) {
				const timestamps = Object.values(data) as number[];
				lastTimestamp = Math.min(...timestamps);
				hasMore = messageIds.length >= pageSize;
			} else {
				hasMore = false;
			}
		} catch (error) {
			console.error('더보기 오류:', error);
		} finally {
			loadingMore = false;
		}
	}

	// 컴포넌트 마운트 시 구독 시작
	onMount(() => {
		subscribeFeed();
	});

	// 컴포넌트 언마운트 시 구독 해제
	onDestroy(() => {
		if (unsubscribe) {
			unsubscribe();
		}
	});

	// 로그인 상태 변경 시 재구독
	$effect(() => {
		if (authStore.user) {
			subscribeFeed();
		} else {
			if (unsubscribe) {
				unsubscribe();
				unsubscribe = null;
			}
			feedMap = {};
			messagesCache = {};
			usersCache = {};
			initialLoading = false;
		}
	});
</script>

<!-- 로그인 필요 메시지 -->
{#if !authStore.user}
	<div class="feed-empty">
		<p>{m.feedLoginRequired()}</p>
	</div>
	<!-- 초기 로딩 중 -->
{:else if initialLoading}
	<div class="feed-loading">
		<p>{m.feedLoading()}</p>
	</div>
	<!-- 피드가 비어있음 -->
{:else if sortedFeedIds.length === 0}
	<div class="feed-empty">
		<p>{m.feedEmpty()}</p>
	</div>
	<!-- 피드 목록 표시 -->
{:else}
	<div class="feed-list">
		{#each sortedFeedIds as messageId (messageId)}
			{@const message = messagesCache[messageId]}
			{@const user = message ? usersCache[message.senderId] : null}

			{#if message && user}
				<div class="feed-item">
					<!-- 사용자 프로필 영역 -->
					<div class="feed-item-header">
						<UserProfile uid={message.senderId} />

						<!-- 팔로우 버튼 -->
						<FollowButton targetUid={message.senderId} />
					</div>

					<!-- 메시지 내용 -->
					{#if message.text}
						<div class="feed-item-content">
							<p>{message.text}</p>
						</div>
					{/if}

					<!-- 첨부 파일 -->
					{#if message.urls && message.urls.length > 0}
						<FileAttachments urls={message.urls} />
					{/if}

					<!-- 댓글 수 표시 (PostCommentList는 onOpenCommentDialog가 필수이므로 제거) -->
					<div class="feed-item-comments">
						<span class="text-sm text-gray-500">댓글 보기</span>
					</div>
				</div>
			{/if}
		{/each}

		<!-- 더보기 버튼 -->
		{#if hasMore}
			<div class="feed-load-more">
				<button onclick={loadMore} disabled={loadingMore} class="load-more-button">
					{#if loadingMore}
						{m.feedLoadingMore()}
					{:else}
						{m.feedLoadMore()}
					{/if}
				</button>
			</div>
		{/if}
	</div>
{/if}

<style>
	@reference "tailwindcss";

	/* 피드 컨테이너 */
	.feed-list {
		@apply flex flex-col gap-4;
	}

	/* 피드 아이템 */
	.feed-item {
		@apply bg-white rounded-lg shadow-sm border p-4;
		@apply transition-shadow duration-200;
		@apply hover:shadow-md;
	}

	/* 피드 아이템 헤더 (프로필 + 팔로우 버튼) */
	.feed-item-header {
		@apply flex items-center justify-between mb-3;
	}

	/* 피드 아이템 내용 */
	.feed-item-content {
		@apply mb-3;
	}

	.feed-item-content p {
		@apply text-gray-800 text-base leading-relaxed;
		@apply whitespace-pre-wrap break-words;
	}

	/* 로딩/비어있음 상태 */
	.feed-loading,
	.feed-empty {
		@apply flex items-center justify-center;
		@apply py-12;
	}

	.feed-loading p,
	.feed-empty p {
		@apply text-gray-500 text-center;
	}

	/* 더보기 버튼 영역 */
	.feed-load-more {
		@apply flex justify-center py-4;
	}

	.load-more-button {
		/* Layout */
		@apply inline-flex items-center justify-center;
		@apply px-6 py-2;

		/* Typography */
		@apply text-sm font-medium;

		/* Visual */
		@apply rounded-full;
		@apply border;
		@apply transition-all duration-200;
		@apply cursor-pointer;

		/* Colors */
		@apply bg-gray-100 text-gray-700 border-gray-300;
		@apply hover:bg-gray-200;
		@apply active:scale-95;
	}

	.load-more-button:disabled {
		@apply opacity-50;
		@apply cursor-not-allowed;
	}
</style>
