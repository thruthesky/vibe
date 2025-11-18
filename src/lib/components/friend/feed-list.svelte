<script lang="ts">
	/**
	 * 사용자 피드 목록 컴포넌트
	 *
	 * 팔로우한 사용자들의 게시글을 실시간으로 표시합니다.
	 * Fan-out 패턴으로 구현된 피드 시스템을 사용합니다.
	 *
	 * 핵심 원칙:
	 * - 단일 진실 공급원(SSOT): 실제 데이터는 `/chat-messages/post/{messageId}`에만 존재
	 * - 최소 정보 원칙: 피드는 타임스탬프만 저장, 실제 내용은 필요시 fetch
	 * - 실시간 구독: `/user-feed/{myUid}` 경로를 실시간으로 구독
	 * - PostItem 컴포넌트 재사용: 게시글 UI 일관성 유지
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

	// PostItem 컴포넌트 재사용
	import PostItem from '$lib/components/post/PostItem.svelte';
	import type { LikeTargetType } from '$lib/functions/like.functions';

	// Props
	/** 한 페이지당 로드할 피드 수 */
	let {
		pageSize = 20,
		/** 좋아요 상태 맵 */
		userLikes = {},
		/** 좋아요 토글 핸들러 */
		onToggleLike,
		/** 댓글 작성 모달 열기 핸들러 */
		onOpenCommentDialog,
		/** 삭제 핸들러 */
		onDelete
	}: {
		pageSize?: number;
		userLikes?: Record<string, LikeTargetType>;
		onToggleLike: (event: MouseEvent, targetId: string, targetType: LikeTargetType) => void;
		onOpenCommentDialog: (postId: string, parentId?: string | null, parentText?: string | null) => void;
		onDelete: (postId: string) => void;
	} = $props();

	// 상태 관리
	/** 피드 메시지 목록 (ID -> timestamp 맵) */
	let feedMap = $state<Record<string, number>>({});

	/** 메시지 데이터 캐시 (ID -> 게시글 전체 데이터) */
	let messagesCache = $state<Record<string, any>>({});

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

	/** 각 메시지의 구독 해제 함수를 관리하는 맵 */
	let messageUnsubscribers = new Map<string, Unsubscribe>();

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
			(snapshot) => {
				const data = snapshot.val() || {};
				feedMap = data;

				// 메시지 ID 목록 추출
				const messageIds = Object.keys(data);

				// 각 메시지를 실시간으로 구독
				subscribeMessagesData(messageIds);

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
	 * 게시글 실시간 구독
	 *
	 * `/posts/{postId}`에서 전체 게시글 데이터를 실시간으로 구독합니다.
	 * - feed에 포함되는 항목은 모두 게시글입니다
	 * - PostItem에 필요한 모든 필드를 실시간으로 업데이트
	 * - likeCount가 변경되면 자동으로 UI에 반영됨
	 *
	 * @param messageIds - 구독할 게시글 ID 목록
	 */
	function subscribeMessagesData(messageIds: string[]) {
		if (!database) return;

		messageIds.forEach((messageId) => {
			// 이미 구독 중이면 스킵
			if (messageUnsubscribers.has(messageId)) {
				return;
			}

			try {
				if (!database) return;

				// 게시글은 /posts/{postId}에 저장됨
				const messageRef = ref(database, `posts/${messageId}`);

				// 실시간 구독 설정
				const unsubscribeMessage = onValue(
					messageRef,
					(snapshot) => {
						const data = snapshot.val();

						if (data && !data.deleted) {
							// PostItem에 필요한 모든 데이터 저장
							messagesCache[messageId] = data;
						} else {
							// 삭제된 게시글은 캐시에서 제거
							delete messagesCache[messageId];
						}
					},
					(error) => {
						console.error(`게시글 데이터 구독 오류 (${messageId}):`, error);
					}
				);

				// 구독 해제 함수 저장
				messageUnsubscribers.set(messageId, unsubscribeMessage);
			} catch (error) {
				console.error(`게시글 데이터 구독 설정 오류 (${messageId}):`, error);
			}
		});
	}

	/**
	 * 모든 메시지 구독 해제
	 */
	function unsubscribeAllMessages() {
		messageUnsubscribers.forEach((unsubscribe) => {
			unsubscribe();
		});
		messageUnsubscribers.clear();
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

			// 각 메시지를 실시간으로 구독
			subscribeMessagesData(messageIds);

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
		unsubscribeAllMessages();
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
			unsubscribeAllMessages();
			feedMap = {};
			messagesCache = {};
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
	<!-- 피드 목록 표시 - PostItem 컴포넌트 재사용 -->
{:else}
	<div class="feed-list">
		{#each sortedFeedIds as messageId (messageId)}
			{@const message = messagesCache[messageId]}

			{#if message}
				<PostItem
					{message}
					messageId={messageId}
					{userLikes}
					{onToggleLike}
					{onOpenCommentDialog}
					onDelete={onDelete}
					editMode="navigate"
				/>
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
		@apply flex flex-col;
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
