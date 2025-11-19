<script lang="ts">
	/**
	 * 사용자 피드 목록 컴포넌트
	 *
	 * 팔로우한 사용자들의 게시글을 실시간으로 표시합니다.
	 * Fan-out 패턴으로 구현된 피드 시스템을 사용합니다.
	 *
	 * 핵심 원칙:
	 * - 단일 진실 공급원(SSOT): 실제 데이터는 `/posts/{postId}`에만 존재
	 * - 최소 정보 원칙: 피드는 타임스탬프만 저장, 실제 내용은 필요시 fetch
	 * - 실시간 구독: `/user-feed/{myUid}` 경로를 실시간으로 구독
	 * - PostItem 컴포넌트 재사용: 게시글 UI 일관성 유지
	 * - 무한 스크롤: DatabaseListView의 패턴을 참고하여 스크롤 기반 자동 로드
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
	import type { Snippet } from 'svelte';

	// Props
	/** 한 페이지당 로드할 피드 수 */
	let {
		pageSize = 20,
		/** 스크롤 threshold (px) - 바닥에서 이 값만큼 떨어지면 다음 페이지 로드 */
		threshold = 300,
		/** 좋아요 상태 맵 */
		userLikes = {},
		/** 좋아요 토글 핸들러 */
		onToggleLike,
		/** 댓글 작성 모달 열기 핸들러 */
		onOpenCommentDialog,
		/** 수정 핸들러 */
		onEdit,
		/** 삭제 핸들러 */
		onDelete,
		/** 피드가 비어있거나 로그인하지 않은 경우 표시할 fallback 콘텐츠 */
		fallback
	}: {
		pageSize?: number;
		threshold?: number;
		userLikes?: Record<string, LikeTargetType>;
		onToggleLike: (event: MouseEvent, targetId: string, targetType: LikeTargetType) => void;
		onOpenCommentDialog: (postId: string, parentId?: string | null, parentText?: string | null) => void;
		onEdit?: (postId: string, text: string, urls: Record<number, string>, roomId: string) => void;
		onDelete: (postId: string) => void;
		fallback?: Snippet;
	} = $props();

	// 상태 관리
	/** 피드 게시글 목록 (ID -> timestamp 맵) */
	let feedMap = $state<Record<string, number>>({});

	/** 게시글 데이터 캐시 (ID -> 게시글 전체 데이터) */
	let postsCache = $state<Record<string, any>>({});

	/** 초기 로딩 상태 */
	let initialLoading = $state(true);

	/** 추가 로딩 상태 (무한 스크롤) */
	let loadingMore = $state(false);

	/** 더 이상 로드할 데이터가 없는지 여부 */
	let hasMore = $state(true);

	/** 마지막으로 로드한 타임스탬프 (페이지네이션용) */
	let lastTimestamp: number | null = null;

	/** 스크롤 컨테이너 DOM 요소 참조 (무한 스크롤용) */
	let scrollContainerRef: HTMLElement | null = null;

	// Firebase 구독 해제 함수
	let unsubscribe: Unsubscribe | null = null;

	/** 각 게시글의 구독 해제 함수를 관리하는 맵 */
	let postUnsubscribers = new Map<string, Unsubscribe>();

	/**
	 * 피드 정렬된 목록
	 *
	 * feedMap을 createdAt 기준 내림차순으로 정렬한 게시글 ID 배열
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

				// 게시글 ID 목록 추출
				const postIds = Object.keys(data);

				// 각 게시글을 실시간으로 구독
				subscribePostsData(postIds);

				initialLoading = false;

				// 페이지네이션용 마지막 타임스탬프 저장
				if (postIds.length > 0) {
					const timestamps = Object.values(data) as number[];
					lastTimestamp = Math.min(...timestamps);
					hasMore = postIds.length >= pageSize;
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
	 * @param postIds - 구독할 게시글 ID 목록
	 */
	function subscribePostsData(postIds: string[]) {
		if (!database) return;

		postIds.forEach((postId) => {
			// 이미 구독 중이면 스킵
			if (postUnsubscribers.has(postId)) {
				return;
			}

			try {
				if (!database) return;

				// 게시글은 /posts/{postId}에 저장됨
				const postRef = ref(database, `posts/${postId}`);

				// 실시간 구독 설정
				const unsubscribePost = onValue(
					postRef,
					(snapshot) => {
						const data = snapshot.val();

						if (data && !data.deleted) {
							// PostItem에 필요한 모든 데이터 저장
							postsCache[postId] = data;
						} else {
							// 삭제된 게시글은 캐시에서 제거
							delete postsCache[postId];
						}
					},
					(error) => {
						console.error(`게시글 데이터 구독 오류 (${postId}):`, error);
					}
				);

				// 구독 해제 함수 저장
				postUnsubscribers.set(postId, unsubscribePost);
			} catch (error) {
				console.error(`게시글 데이터 구독 설정 오류 (${postId}):`, error);
			}
		});
	}

	/**
	 * 모든 게시글 구독 해제
	 */
	function unsubscribeAllPosts() {
		postUnsubscribers.forEach((unsubscribe) => {
			unsubscribe();
		});
		postUnsubscribers.clear();
	}

	/**
	 * 더 많은 피드 로드 (무한 스크롤)
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

			// 게시글 ID 목록 추출
			const postIds = Object.keys(data);

			// 각 게시글을 실시간으로 구독
			subscribePostsData(postIds);

			// 페이지네이션용 마지막 타임스탬프 업데이트
			if (postIds.length > 0) {
				const timestamps = Object.values(data) as number[];
				lastTimestamp = Math.min(...timestamps);
				hasMore = postIds.length >= pageSize;
			} else {
				hasMore = false;
			}
		} catch (error) {
			console.error('피드 추가 로드 오류:', error);
		} finally {
			loadingMore = false;
		}
	}

	/**
	 * 스크롤 리스너 설정 action
	 * DOM 요소가 마운트될 때 스크롤 이벤트 리스너를 등록합니다.
	 * DatabaseListView의 setupScrollListener 패턴을 참고하여 구현
	 */
	function setupScrollListener(node: HTMLDivElement) {
		// 스크롤 컨테이너 찾기
		// 부모 요소 중 overflow-auto 또는 overflow-scroll을 가진 요소를 찾습니다
		let actualScrollContainer: HTMLElement = node;
		let parent = node.parentElement;

		while (parent) {
			const overflowY = window.getComputedStyle(parent).overflowY;
			if (overflowY === 'auto' || overflowY === 'scroll') {
				actualScrollContainer = parent;
				break;
			}
			parent = parent.parentElement;
		}

		// 스크롤 컨테이너 참조 저장
		scrollContainerRef = actualScrollContainer;

		// 실제 스크롤 컨테이너에 리스너 등록
		actualScrollContainer.addEventListener('scroll', handleScroll);
		// window 스크롤 감지 (body 스크롤)
		window.addEventListener('scroll', handleWindowScroll);

		return {
			destroy() {
				actualScrollContainer.removeEventListener('scroll', handleScroll);
				window.removeEventListener('scroll', handleWindowScroll);
				scrollContainerRef = null;
			}
		};
	}

	/**
	 * 컨테이너 스크롤 이벤트 핸들러
	 * 아래로 스크롤하여 바닥에 가까워지면 다음 페이지 로드
	 */
	function handleScroll(event: Event) {
		if (loadingMore || !hasMore) return;

		const target = event.currentTarget as HTMLDivElement;
		if (!target) return;

		const { scrollTop, scrollHeight, clientHeight } = target;
		const distanceFromBottom = scrollHeight - (scrollTop + clientHeight);

		if (distanceFromBottom < threshold) {
			loadMore();
		}
	}

	/**
	 * Window 스크롤 이벤트 핸들러
	 * 아래로 스크롤하여 바닥에 가까워지면 다음 페이지 로드
	 */
	function handleWindowScroll() {
		if (loadingMore || !hasMore) {
			return;
		}

		// document의 전체 높이와 현재 스크롤 위치를 확인
		const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
		const scrollHeight = document.documentElement.scrollHeight;
		const clientHeight = window.innerHeight;
		const distanceFromBottom = scrollHeight - (scrollTop + clientHeight);

		if (distanceFromBottom < threshold) {
			loadMore();
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
		unsubscribeAllPosts();
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
			unsubscribeAllPosts();
			feedMap = {};
			postsCache = {};
			initialLoading = false;
		}
	});
</script>

<!-- 로그인하지 않았거나 피드가 비어있는 경우 -->
{#if !authStore.user || (!initialLoading && sortedFeedIds.length === 0)}
	<!-- fallback snippet이 제공된 경우 렌더링 -->
	{#if fallback}
		{@render fallback()}
	{:else}
		<!-- fallback이 없으면 기본 메시지 표시 -->
		<div class="feed-empty">
			{#if !authStore.user}
				<p>{m.feedLoginRequired()}</p>
			{:else}
				<p>{m.feedEmpty()}</p>
			{/if}
		</div>
	{/if}
	<!-- 초기 로딩 중 -->
{:else if initialLoading}
	<div class="feed-loading">
		<p>{m.feedLoading()}</p>
	</div>
	<!-- 피드 목록 표시 - PostItem 컴포넌트 재사용 -->
{:else}
	<div class="feed-list" use:setupScrollListener>
		{#each sortedFeedIds as postId (postId)}
			{@const message = postsCache[postId]}

			{#if message}
				<PostItem
					{message}
					postId={postId}
					{userLikes}
					{onToggleLike}
					{onOpenCommentDialog}
					{onEdit}
					onDelete={onDelete}
				/>
			{:else}
				<!-- 게시글 데이터 로딩 중: skeleton 표시 -->
				<div class="feed-item-skeleton">
					<div class="skeleton-header">
						<div class="skeleton-avatar"></div>
						<div class="skeleton-info">
							<div class="skeleton-name"></div>
							<div class="skeleton-date"></div>
						</div>
					</div>
					<div class="skeleton-content">
						<div class="skeleton-line"></div>
						<div class="skeleton-line"></div>
						<div class="skeleton-line short"></div>
					</div>
				</div>
			{/if}
		{/each}

		<!-- 더 로드 중 표시 (무한 스크롤) -->
		{#if loadingMore}
			<div class="feed-loading-more">
				<div class="loading-spinner">
					<div class="spinner"></div>
					<p>{m.feedLoadingMore()}</p>
				</div>
			</div>
		{/if}

		<!-- 더 이상 데이터 없음 표시 -->
		{#if !hasMore && !loadingMore && sortedFeedIds.length > 0}
			<div class="feed-no-more">
				<p>{m.feedNoMore()}</p>
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

	/* Skeleton 로딩 상태 (각 피드 항목) */
	.feed-item-skeleton {
		@apply p-4 border-b border-gray-200 bg-white;
	}

	.skeleton-header {
		@apply flex items-start gap-3 mb-3;
	}

	.skeleton-avatar {
		@apply w-10 h-10 rounded-full bg-gray-200 animate-pulse;
	}

	.skeleton-info {
		@apply flex-1 flex flex-col gap-2;
	}

	.skeleton-name {
		@apply h-4 w-24 bg-gray-200 rounded animate-pulse;
	}

	.skeleton-date {
		@apply h-3 w-16 bg-gray-200 rounded animate-pulse;
	}

	.skeleton-content {
		@apply flex flex-col gap-2;
	}

	.skeleton-line {
		@apply h-4 bg-gray-200 rounded animate-pulse;
	}

	.skeleton-line.short {
		@apply w-2/3;
	}

	/* 더 로드 중 표시 (무한 스크롤) */
	.feed-loading-more {
		@apply flex justify-center py-6;
	}

	.loading-spinner {
		@apply flex flex-col items-center gap-3;
	}

	.spinner {
		@apply w-8 h-8 border-4 border-gray-200 border-t-blue-500 rounded-full animate-spin;
	}

	.loading-spinner p {
		@apply text-sm text-gray-500;
	}

	/* 더 이상 데이터 없음 */
	.feed-no-more {
		@apply flex justify-center py-8;
	}

	.feed-no-more p {
		@apply text-sm text-gray-400;
	}
</style>
