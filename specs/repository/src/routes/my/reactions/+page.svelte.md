---
title: +page.svelte - Svelte 5 컴포넌트
original_path: src/routes/my/reactions/+page.svelte
category: route
file_type: svelte
status: current
last_updated: 2025-11-20
---

# +page.svelte

## 개요

**원본 경로**: `src/routes/my/reactions/+page.svelte`

**파일 유형**: Svelte 5 컴포넌트

## 소스 코드

```svelte
<!--
  받은 반응 페이지

  다른 사용자들이 내 게시글/댓글/프로필에 보낸 리액션(좋아요, 댓글, 팔로우)을 시간순으로 표시합니다.

  데이터 경로: /received-reactions/{uid}
  정렬: createdAt 내림차순 (최신 반응이 위에)
-->

<script lang="ts">
	import { authStore } from '$lib/stores/auth.svelte';
	import DatabaseListView from '$lib/components/DatabaseListView.svelte';
	import * as Card from '$lib/components/ui/card/index.js';
	import { m } from '$lib/paraglide/messages';
	import { Heart, MessageCircle, UserPlus } from 'lucide-svelte';
	import { formatDistanceToNow } from 'date-fns';
	import { ko, enUS, ja, zhCN } from 'date-fns/locale';
	import { getLocale } from '$lib/paraglide/runtime.js';
	import { getUserFields } from '$lib/functions/user.functions';
	import Avatar from '$lib/components/user/avatar.svelte';
	import { rtdb } from '$lib/firebase';
	import { ref as dbRef, get } from 'firebase/database';
	import { goto } from '$app/navigation';

	/**
	 * date-fns 로케일 매핑
	 */
	const getDateLocale = () => {
		switch (getLocale()) {
			case 'ko':
				return ko;
			case 'ja':
				return ja;
			case 'zh':
				return zhCN;
			default:
				return enUS;
		}
	};

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
	 * 리액션 타입에 따른 설명 텍스트 반환
	 */
	function getReactionDescription(reaction: any) {
		const { type, targetType } = reaction;

		if (type === 'like') {
			if (targetType === 'post') {
				return m.reactionLikedPost();
			}
			if (targetType === 'comment') {
				return m.reactionLikedComment();
			}
		}

		if (type === 'comment') {
			return m.reactionCommentedPost();
		}

		if (type === 'follow') {
			return m.reactionFollowedUser();
		}

		return '';
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
	 * 대상 콘텐츠 정보 조회 (게시글/댓글 제목)
	 */
	async function getTargetContent(reaction: any): Promise<string> {
		if (!rtdb) return '';

		try {
			const { type, targetType, targetId, postId } = reaction;

			// 팔로우는 대상 콘텐츠 없음
			if (type === 'follow') {
				return '';
			}

			// 게시글 좋아요 또는 댓글
			if (targetType === 'post') {
				const postRef = dbRef(rtdb, `posts/${targetId}`);
				const snapshot = await get(postRef);
				if (snapshot.exists()) {
					const postData = snapshot.val();
					return postData.text?.substring(0, 100) || '(내용 없음)';
				}
				return '(삭제된 게시글)';
			}

			// 댓글 좋아요
			if (targetType === 'comment' && postId) {
				const commentRef = dbRef(rtdb, `comments/${postId}/${targetId}`);
				const snapshot = await get(commentRef);
				if (snapshot.exists()) {
					const commentData = snapshot.val();
					return commentData.text?.substring(0, 100) || '(내용 없음)';
				}
				return '(삭제된 댓글)';
			}

			return '';
		} catch (error) {
			console.error('대상 콘텐츠 조회 실패:', error);
			return '';
		}
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

<svelte:head>
	<title>Sonub - {m.receivedReactionsTitle()}</title>
</svelte:head>

<!-- 로그인 체크 -->
{#if !authStore.user}
	<section class="page-container">
		<Card.Root class="auth-card">
			<Card.Header>
				<Card.Title>{m.authSignInRequired()}</Card.Title>
				<Card.Description>{m.authSignInRequiredDesc()}</Card.Description>
			</Card.Header>
			<Card.Content>
				<p class="text-center">{m.receivedReactionsDescription()}</p>
			</Card.Content>
		</Card.Root>
	</section>

<!-- 받은 반응 목록 -->
{:else}
	<section class="page-container">
		<div class="header-section">
			<h1 class="page-title">{m.receivedReactionsTitle()}</h1>
			<p class="page-description">{m.receivedReactionsDescription()}</p>
		</div>

		<div class="list-container">
			<DatabaseListView
				path={`received-reactions/${authStore.user.uid}`}
				pageSize={20}
				orderBy="createdAt"
				newItemPosition="top"
			>
				{#snippet item(itemData)}
					{@const reaction = itemData.data}
					{@const Icon = getReactionIcon(reaction.type)}

					<button
						class="reaction-item"
						onclick={() => handleReactionClick(reaction)}
						type="button"
					>
						<!-- 사용자 아바타 -->
						{#await getUserFields(reaction.fromUid, ['displayName', 'photoUrl'])}
							<div class="avatar-placeholder"></div>
						{:then userFields}
							<Avatar
								photoUrl={userFields.photoUrl}
								displayName={userFields.displayName || ''}
								size="md"
							/>
						{/await}

						<!-- 리액션 내용 -->
						<div class="content-wrapper">
							<!-- 사용자 이름 + 리액션 설명 -->
							<div class="reaction-header">
								{#await getUserFields(reaction.fromUid, ['displayName'])}
									<span class="user-name loading">...</span>
								{:then userFields}
									<span class="user-name">{userFields.displayName || '알 수 없는 사용자'}</span>
								{/await}

								<span class="reaction-desc">{getReactionDescription(reaction)}</span>

								<!-- 리액션 아이콘 -->
								<span class="icon-badge {getReactionColor(reaction.type)}">
									<Icon size={16} />
								</span>
							</div>

							<!-- 시간 -->
							<p class="reaction-time">
								{formatDistanceToNow(reaction.createdAt, {
									addSuffix: true,
									locale: getDateLocale()
								})}
							</p>

							<!-- 대상 콘텐츠 (게시글/댓글 내용) -->
							{#if reaction.type !== 'follow'}
								{#await getTargetContent(reaction)}
									<p class="target-content loading">...</p>
								{:then content}
									{#if content}
										<p class="target-content">{content}</p>
									{/if}
								{/await}
							{/if}
						</div>
					</button>
				{/snippet}

				{#snippet loading()}
					<div class="status-message">
						<p>{m.receivedReactionsLoading()}</p>
					</div>
				{/snippet}

				{#snippet empty()}
					<div class="status-message">
						<p>{m.receivedReactionsEmpty()}</p>
					</div>
				{/snippet}

				{#snippet error(errorMessage)}
					<div class="status-message error">
						<p>{errorMessage}</p>
					</div>
				{/snippet}
			</DatabaseListView>
		</div>
	</section>
{/if}

<style>
	@import 'tailwindcss' reference;

	.page-container {
		@apply mx-auto max-w-3xl px-4 py-8;
	}

	.header-section {
		@apply mb-6;
	}

	.page-title {
		@apply mb-2 text-3xl font-bold text-gray-900;
	}

	.page-description {
		@apply text-base text-gray-600;
	}

	.list-container {
		@apply w-full;
	}

	.reaction-item {
		@apply flex w-full cursor-pointer items-start gap-4 rounded-lg border border-gray-200 bg-white p-4 transition-all hover:border-gray-300 hover:shadow-md;
	}

	.avatar-placeholder {
		@apply h-12 w-12 flex-shrink-0 animate-pulse rounded-full bg-gray-200;
	}

	.content-wrapper {
		@apply flex flex-1 flex-col gap-2;
	}

	.reaction-header {
		@apply flex flex-wrap items-center gap-2;
	}

	.user-name {
		@apply font-semibold text-gray-900;
	}

	.user-name.loading {
		@apply animate-pulse text-gray-400;
	}

	.reaction-desc {
		@apply text-sm text-gray-600;
	}

	.icon-badge {
		@apply flex items-center;
	}

	.reaction-time {
		@apply text-sm text-gray-500;
	}

	.target-content {
		@apply mt-1 rounded-md bg-gray-50 p-3 text-sm text-gray-700;
	}

	.target-content.loading {
		@apply animate-pulse text-gray-400;
	}

	.status-message {
		@apply flex min-h-[200px] items-center justify-center p-8 text-center text-gray-600;
	}

	.status-message.error {
		@apply text-red-600;
	}

	.auth-card {
		@apply mx-auto max-w-md rounded-2xl border border-gray-100 bg-white shadow-lg;
	}
</style>
```
