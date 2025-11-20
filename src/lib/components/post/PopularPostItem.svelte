<!--
  인기 게시글 개별 아이템 컴포넌트

  각 게시글의 Firebase 실시간 구독을 독립적으로 관리합니다.
  - 게시글 데이터 실시간 구독
  - 순위 배지 표시
  - 점수 배지 표시
-->

<script lang="ts">
	import { createRealtimeStore } from '$lib/stores/database.svelte';
	import { authStore } from '$lib/stores/auth.svelte';
	import { toggleLikeTarget, type LikeTargetType } from '$lib/functions/like.functions';
	import * as m from '$lib/paraglide/messages.js';
	import PostItem from '$lib/components/post/PostItem.svelte';
	import { TrendingUp } from 'lucide-svelte';
	import type { ChatMessage } from '$lib/types/chat.types';
	import { ref, remove } from 'firebase/database';
	import { rtdb } from '$lib/firebase';

	/**
	 * Props
	 */
	interface Props {
		/** 게시글 ID */
		postId: string;
		/** 인기 점수 */
		score: number;
		/** 순위 (0부터 시작) */
		index: number;
		/** 사용자 좋아요 맵 */
		userLikes: Record<string, LikeTargetType>;
		/** 좋아요 토글 핸들러 */
		onToggleLike: (event: MouseEvent, targetId: string, targetType: LikeTargetType) => void;
		/** 댓글 작성 핸들러 */
		onOpenCommentDialog: (
			postId: string,
			parentId?: string | null,
			parentText?: string | null
		) => void;
		/** 게시글 수정 핸들러 */
		onEdit: (postId: string, text: string, urls: Record<number, string>, roomId: string) => void;
		/** 게시글 삭제 핸들러 */
		onDelete: (postId: string) => void;
	}

	let {
		postId,
		score,
		index,
		userLikes,
		onToggleLike,
		onOpenCommentDialog,
		onEdit,
		onDelete
	}: Props = $props();

	// 게시글 데이터 실시간 구독 (각 컴포넌트가 독립적으로 구독)
	const messageStore = createRealtimeStore<ChatMessage>(`posts/${postId}`, {} as ChatMessage);

	// 구독 데이터 추출
	const message = $derived($messageStore.data);
	const loading = $derived($messageStore.loading);

	/**
	 * 컴포넌트 언마운트 시 구독 해제
	 */
	$effect(() => {
		return () => {
			messageStore.unsubscribe();
		};
	});
</script>

{#if loading}
	<div class="post-item">
		<div class="loading-skeleton">
			<p class="text-sm text-gray-500">{m.loadingGeneric()}</p>
		</div>
	</div>
{:else if message && !message.deletedAt}
	<div class="post-item">
		<!-- 순위 배지 -->
		<div class="rank-badge {index < 3 ? 'rank-top' : ''}">
			#{index + 1}
		</div>

		<!-- 게시글 카드 -->
		<div class="post-card-wrapper">
			<PostItem
				{message}
				{postId}
				{userLikes}
				{onToggleLike}
				{onOpenCommentDialog}
				onEdit={(id, text, urls, roomId) => onEdit(id, text, urls, roomId)}
				onDelete={(id) => onDelete(id)}
				editMode="dialog"
			/>
		</div>

		<!-- 점수 표시 -->
		<div class="score-badge">
			<TrendingUp class="score-icon" />
			<span>{score}</span>
		</div>
	</div>
{/if}

<style>
	@import 'tailwindcss' reference;

	.post-item {
		@apply relative flex items-start gap-4 p-4;
		@apply bg-white rounded-lg border border-gray-200;
		@apply hover:shadow-md transition-shadow duration-200;
	}

	.loading-skeleton {
		@apply flex-1 flex items-center justify-center py-8;
	}

	.rank-badge {
		@apply flex-shrink-0 flex items-center justify-center;
		@apply w-10 h-10 rounded-full;
		@apply bg-gray-100 text-gray-700 font-bold text-sm;
	}

	.rank-top {
		@apply bg-gradient-to-br from-yellow-400 to-orange-500;
		@apply text-white;
	}

	.post-card-wrapper {
		@apply flex-1;
	}

	.score-badge {
		@apply flex-shrink-0 flex items-center gap-1;
		@apply px-3 py-1 rounded-full;
		@apply bg-blue-50 text-blue-700 text-sm font-medium;
	}

	.score-icon {
		@apply w-3 h-3;
	}
</style>
