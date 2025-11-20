<script lang="ts">
	/**
	 * 리액션 카드 컴포넌트
	 *
	 * 사용자가 받은 최근 리액션 5개를 표시합니다.
	 * 좋아요, 댓글, 팔로우 등의 반응을 보여줍니다.
	 */

	import { m } from '$lib/paraglide/messages';
	import { Heart, MessageCircle, UserPlus, ChevronRight } from 'lucide-svelte';
	import { goto } from '$app/navigation';
	import { authStore } from '$lib/stores/auth.svelte';
	import Avatar from '$lib/components/user/avatar.svelte';
	import { getUserFields } from '$lib/functions/user.functions';
	import { rtdb } from '$lib/firebase';
	import { ref, query, orderByChild, limitToLast, onValue, off } from 'firebase/database';

	/**
	 * 최근 5개의 reactions 데이터
	 */
	type Reaction = {
		key: string;
		fromUid: string;
		type: 'like' | 'comment' | 'follow';
		targetType: 'post' | 'comment' | 'user';
		targetId: string;
		postId?: string;
		createdAt: number;
	};

	let reactions = $state<Reaction[]>([]);
	let isLoading = $state(false);

	/**
	 * Firebase에서 최근 5개의 reactions 실시간 구독
	 */
	$effect(() => {
		const uid = authStore.user?.uid;
		if (!uid || !rtdb) {
			reactions = [];
			return;
		}

		isLoading = true;
		const reactionsRef = ref(rtdb, `received-reactions/${uid}`);
		const reactionsQuery = query(reactionsRef, orderByChild('createdAt'), limitToLast(5));

		const unsubscribe = onValue(
			reactionsQuery,
			(snapshot) => {
				const data: Reaction[] = [];
				snapshot.forEach((childSnapshot) => {
					data.push({
						key: childSnapshot.key!,
						...childSnapshot.val()
					});
				});
				// createdAt 내림차순으로 정렬 (최신이 위로)
				reactions = data.reverse();
				isLoading = false;
			},
			(error) => {
				console.error('Reactions 로드 실패:', error);
				reactions = [];
				isLoading = false;
			}
		);

		return () => {
			off(reactionsQuery);
		};
	});

	/**
	 * 리액션 타입에 따른 아이콘 반환
	 */
	function getReactionIcon(type: string) {
		switch (type) {
			case 'like':
				return Heart;
			case 'comment':
				return MessageCircle;
			case 'follow':
				return UserPlus;
			default:
				return Heart;
		}
	}

	/**
	 * 리액션 아이콘 색상 반환
	 */
	function getReactionColor(type: string) {
		switch (type) {
			case 'like':
				return 'text-red-500';
			case 'comment':
				return 'text-green-500';
			case 'follow':
				return 'text-purple-500';
			default:
				return 'text-gray-500';
		}
	}

	/**
	 * 리액션 상세 페이지로 이동
	 */
	function goToReactions() {
		goto('/my/reactions');
	}

	/**
	 * 리액션 클릭 핸들러 (해당 콘텐츠 또는 사용자 프로필로 이동)
	 */
	function handleReactionClick(reaction: any) {
		const { type, targetType, targetId, postId, fromUid } = reaction;

		// 팔로우: 사용자 프로필로 이동
		if (type === 'follow') {
			goto(`/user/profile?uid=${fromUid}`);
			return;
		}

		// 게시글 관련: 게시글 상세로 이동
		if (targetType === 'post') {
			goto(`/post/${targetId}`);
			return;
		}

		// 댓글 관련: 게시글 상세로 이동 (댓글이 포함된 게시글)
		if (targetType === 'comment' && postId) {
			goto(`/post/${postId}#comment-${targetId}`);
			return;
		}
	}
</script>

<div class="reactions-section">
	<!-- 헤더 -->
	<div class="section-header">
		<div class="header-left flex items-center gap-2">
			<Heart class="section-icon" aria-hidden="true" />
			<h3 class="section-title">{m.sidebarReactions()}</h3>
		</div>
		<button
			type="button"
			onclick={goToReactions}
			class="more-button"
			aria-label={`${m.sidebarReactions()} ${m.homeSidebarSeeMore()}`}
		>
			<span class="more-text">{m.homeSidebarSeeMore()}</span>
			<ChevronRight class="more-icon" size={16} />
		</button>
	</div>

	<!-- 컨텐츠 -->
	<div class="section-content">
		{#if !authStore.user}
			<p class="placeholder-text">{m.authSignInRequired()}</p>
		{:else if isLoading}
			<div class="status-message">
				<p class="text-xs text-gray-400">{m.loadingGeneric()}</p>
			</div>
		{:else if reactions.length === 0}
			<div class="status-message">
				<p class="text-xs text-gray-400">{m.receivedReactionsEmpty()}</p>
			</div>
		{:else}
			{#each reactions as reaction (reaction.key)}
				{@const Icon = getReactionIcon(reaction.type)}

				<button
					class="reaction-item"
					onclick={() => handleReactionClick(reaction)}
					type="button"
				>
					<!-- 사용자 아바타 -->
					<Avatar uid={reaction.fromUid} size={28} />

					<!-- 리액션 내용 -->
					<div class="content-wrapper">
						<!-- 사용자 이름 + 리액션 아이콘 -->
						<div class="reaction-header">
							{#await getUserFields(reaction.fromUid, ['displayName'])}
								<span class="user-name loading">...</span>
							{:then userFields}
								<span class="user-name">{userFields.displayName || '알 수 없는 사용자'}</span>
							{/await}

							<!-- 리액션 아이콘 -->
							<span class="icon-badge {getReactionColor(reaction.type)}">
								<Icon size={12} />
							</span>
						</div>
					</div>
				</button>
			{/each}
		{/if}
	</div>
</div>

<style>
	@import 'tailwindcss' reference;

	/* 섹션 컨테이너 - 보더 없이 심플하게 */
	.reactions-section {
		@apply rounded-xl bg-white p-4;
	}

	/* 헤더 영역 */
	.section-header {
		@apply mb-3 flex items-center justify-between;
	}

	.section-icon {
		@apply h-4 w-4 text-red-500;
	}

	.section-title {
		@apply text-sm font-semibold text-gray-900;
	}

	/* 더보기 버튼 */
	.more-button {
		@apply flex cursor-pointer items-center gap-0.5 rounded-lg px-2 py-1 text-xs font-medium text-gray-600 transition-all;
		@apply hover:bg-gray-100 hover:text-red-600;
	}

	.more-text {
		@apply text-xs;
	}

	.more-icon {
		@apply transition-transform;
	}

	.more-button:hover .more-icon {
		@apply translate-x-0.5;
	}

	/* 컨텐츠 영역 */
	.section-content {
		@apply space-y-1.5;
	}

	.placeholder-text {
		@apply py-4 text-center text-xs text-gray-400;
	}

	/* 리액션 아이템 */
	.reaction-item {
		@apply flex w-full cursor-pointer items-center gap-2 rounded-lg bg-gray-50/50 px-2 py-1.5 transition-all duration-200;
		@apply hover:bg-red-50/80;
	}

	.content-wrapper {
		@apply flex min-w-0 flex-1 items-center;
	}

	.reaction-header {
		@apply flex items-center gap-1;
	}

	.user-name {
		@apply truncate text-xs font-medium text-gray-900;
	}

	.user-name.loading {
		@apply animate-pulse text-gray-400;
	}

	.icon-badge {
		@apply flex shrink-0 items-center;
	}

	.status-message {
		@apply flex min-h-[60px] items-center justify-center p-4 text-center;
	}
</style>
