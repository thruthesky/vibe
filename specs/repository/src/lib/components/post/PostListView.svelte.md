---
title: PostListView.svelte
type: component
path: src/lib/components/post/PostListView.svelte
status: active
version: 1.0.0
last_updated: 2025-11-19
dependencies:
  - DatabaseListView.svelte
  - PostItem.svelte
---

## 개요

이 파일은 `src/lib/components/post/PostListView.svelte`의 소스 코드를 포함하는 SED 스펙 문서입니다.

PostListView는 DatabaseListView와 PostItem을 조합하여 게시글 목록을 표시하는 컴포넌트입니다. 홈페이지와 게시판 목록 페이지에서 공통으로 사용됩니다.

## 주요 기능

- **무한 스크롤 게시글 목록**: DatabaseListView를 활용한 페이지네이션
- **카테고리별 정렬**: 카테고리 선택 시 `categoryOrder` 기준으로 역순 정렬
- **좋아요 기능**: 게시글 좋아요 토글
- **댓글 기능**: 댓글 작성 및 새로고침
- **수정/삭제 기능**: 게시글 수정 및 삭제
- **로딩 상태 표시**: 로딩, 빈 목록, 더보기 상태 표시

## 정렬 로직

### 카테고리별 정렬 전략

PostListView는 카테고리 선택 여부에 따라 다른 정렬 전략을 사용합니다:

| 조건 | orderBy | orderPrefix | reverse | 설명 |
|------|---------|-------------|---------|------|
| 카테고리 선택 시 (`category !== null`) | `'categoryOrder'` | `'{category}-'` | `true` | 최신 글이 먼저 (내림차순) |
| 전체 보기 (`category === null`) | `'allCategoryOrder'` | `''` | `false` | 오래된 글이 먼저 (오름차순) |

**구현 코드 (106-108 라인)**:
```svelte
<DatabaseListView
  orderBy={category ? 'categoryOrder' : 'allCategoryOrder'}
  orderPrefix={category ? `${category}-` : ''}
  reverse={category ? true : false}
>
```

### 예시: "나의 이야기" 카테고리 선택 시

**Props**:
- `category = "story"`
- `orderBy = "categoryOrder"`
- `orderPrefix = "story-"`
- `reverse = true`

**정렬 결과**:
```
story--1763562652353 (최신)
story--1763562648655
story--1763562646262
story--1763562642736 (오래된 글)
```

**Firebase 쿼리**:
```javascript
query(
  ref(db, 'posts'),
  orderByChild('categoryOrder'),
  startAt('story-'),
  endAt('story-\uf8ff'),
  limitToLast(21)
)
```

DatabaseListView의 클라이언트 측 정렬 로직이 자동으로 적용되어 문자열 비교 (`localeCompare`)를 통해 정확한 내림차순 정렬이 보장됩니다.

## Public 메서드

### `refresh(): void`

전체 게시글 목록을 새로고침합니다.

```typescript
postListViewRef.refresh();
```

### `refreshPostComments(postId: string): Promise<void>`

특정 게시글의 댓글만 새로고침합니다.

```typescript
await postListViewRef.refreshPostComments('-OeRWcBnyK9yATNCr5yb');
```

## 소스 코드

```svelte
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

	/** 각 게시글의 PostItem 컴포넌트 참조 저장 (postId -> PostItem) */
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
	export async function refreshPostComments(postId: string) {
		if (postItemRefs[postId]) {
			await postItemRefs[postId].refreshComments();
		}
	}
</script>


<DatabaseListView
	bind:this={listViewRef}
	{path}
	{pageSize}
	orderBy={category ? 'categoryOrder' : 'allCategoryOrder'}
	orderPrefix={category ? `${category}-` : ''}
	reverse={category ? true : false}
	{threshold}
>
	{#snippet item(itemData, index)}
		{@const message = itemData.data}
		{@const postId = itemData.key}
		<PostItem
			bind:this={postItemRefs[postId]}
			{message}
			{postId}
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
```

## 연관 문서

- [DatabaseListView 컴포넌트 스펙](../DatabaseListView.svelte.md)
- [DatabaseListView 사용 가이드](../../../../sonub-firebase-database-list-view.md)
- [PostItem 컴포넌트](./PostItem.svelte.md)
