<!--
  게시글 목록 뷰 컴포넌트

  DatabaseListView와 PostItem을 조합하여 게시글 목록을 표시합니다.
  홈페이지와 게시판 목록 페이지에서 공통으로 사용됩니다.

  주요 기능:
  - 무한 스크롤 게시글 목록
  - 좋아요 기능
  - 댓글 기능
  - 수정/삭제 기능
  - 로딩 상태 표시
-->

<script lang="ts">
	import DatabaseListView from '$lib/components/DatabaseListView.svelte';
	import PostItem from '$lib/components/post/PostItem.svelte';
	import type { LikeTargetType } from '$lib/functions/like.functions';

	/**
	 * Props 인터페이스
	 */
	interface Props {
		/** Firebase RTDB 경로 (예: "posts") */
		path: string;
		/** 페이지당 항목 수 (기본값: 20) */
		pageSize?: number;
		/** 정렬 기준 필드 (기본값: "createdAt") */
		orderBy?: string;
		/** 정렬 접두사 (기본값: "") */
		orderPrefix?: string;
		/** 역순 정렬 여부 (기본값: true) */
		reverse?: boolean;
		/** 무한 스크롤 트리거 거리 (기본값: 300px) */
		threshold?: number;
		/** 카테고리 필터 (선택 사항) */
		category?: string | null;
		/** 수정 모드 ('dialog' | 'navigate', 기본값: 'navigate') */
		editMode?: 'dialog' | 'navigate';
		/** 사용자 좋아요 목록 */
		userLikes?: Record<string, LikeTargetType>;
		/** 좋아요 토글 핸들러 */
		onToggleLike: (
			event: MouseEvent,
			targetId: string,
			targetType: LikeTargetType
		) => void | Promise<void>;
		/** 댓글 모달 열기 핸들러 */
		onOpenCommentDialog: (
			messageId: string,
			parentId?: string | null,
			parentText?: string | null
		) => void;
		/** 수정 핸들러 (editMode='dialog'일 때만 사용) */
		onEdit?: (postId: string, text: string, urls: Record<number, string>, roomId: string) => void;
		/** 삭제 핸들러 */
		onDelete: (messageId: string) => void | Promise<void>;
	}

	let {
		path,
		pageSize = 20,
		orderBy = 'createdAt',
		orderPrefix = '',
		reverse = true,
		threshold = 300,
		category = null,
		editMode = 'navigate',
		userLikes = {},
		onToggleLike,
		onOpenCommentDialog,
		onEdit,
		onDelete
	}: Props = $props();

	/** DatabaseListView 참조 (새로고침용) */
	let listViewRef = $state<DatabaseListView>();

	/** 각 게시글의 PostItem 컴포넌트 참조 저장 (messageId -> PostItem) */
	let postItemRefs = $state<Record<string, PostItem>>({});

	/**
	 * 목록 새로고침
	 * 외부에서 호출 가능한 public 메서드
	 */
	export function refresh() {
		listViewRef?.refresh();
	}

	/**
	 * 특정 게시글의 댓글 새로고침
	 * 외부에서 호출 가능한 public 메서드
	 */
	export async function refreshPostComments(messageId: string) {
		if (postItemRefs[messageId]) {
			await postItemRefs[messageId].refreshComments();
		}
	}
</script>

<DatabaseListView
	bind:this={listViewRef}
	{path}
	{pageSize}
	orderBy={category ? 'category' : orderBy}
	{orderPrefix}
	equalToValue={category}
	{reverse}
	{threshold}
>
	{#snippet item(itemData, index)}
		{@const message = itemData.data}
		{@const messageId = itemData.key}
		<PostItem
			bind:this={postItemRefs[messageId]}
			{message}
			{messageId}
			{userLikes}
			{onToggleLike}
			{onOpenCommentDialog}
			{onEdit}
			{onDelete}
			{editMode}
		/>
	{/snippet}

	{#snippet loading()}
		<div class="list-status">
			<p>로딩 중...</p>
		</div>
	{/snippet}

	{#snippet empty()}
		<div class="list-status">
			<p>게시글이 없습니다.</p>
		</div>
	{/snippet}

	{#snippet loadingMore()}
		<div class="list-status">
			<p>더 불러오는 중...</p>
		</div>
	{/snippet}

	{#snippet noMore()}
		<div class="list-status">
			<p>모든 게시글을 불러왔습니다.</p>
		</div>
	{/snippet}
</DatabaseListView>

<style>
	@import 'tailwindcss' reference;

	.list-status {
		@apply py-8 text-center text-gray-500;
	}
</style>
