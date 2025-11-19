<!--
  나의 발자취 페이지

  사용자가 발생시킨 모든 리액션(좋아요, 게시글, 댓글, 팔로우)을 시간순으로 표시합니다.

  데이터 경로: /my-actions/{uid}
  정렬: createdAt 내림차순 (최신 활동이 위에)
-->

<script lang="ts">
	import { authStore } from '$lib/stores/auth.svelte';
	import DatabaseListView from '$lib/components/DatabaseListView.svelte';
	import * as Card from '$lib/components/ui/card/index.js';
	import { m } from '$lib/paraglide/messages';
	import { Heart, FileText, MessageCircle, UserPlus } from 'lucide-svelte';
	import { formatDistanceToNow } from 'date-fns';
	import { ko, enUS, ja, zhCN } from 'date-fns/locale';
	import { getLocale } from '$lib/paraglide/runtime.js';
	import { getUserFields } from '$lib/functions/user.functions';
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
			case 'post':
				return FileText;
			case 'comment':
				return MessageCircle;
			case 'follow':
				return UserPlus;
			default:
				return Heart;
		}
	}

	/**
	 * 리액션 타입에 따른 텍스트 반환
	 */
	function getReactionText(type: string) {
		switch (type) {
			case 'like':
				return m.reactionTypeLike();
			case 'post':
				return m.reactionTypePost();
			case 'comment':
				return m.reactionTypeComment();
			case 'follow':
				return m.reactionTypeFollow();
			default:
				return type;
		}
	}

	/**
	 * 리액션 아이콘 색상 반환
	 */
	function getReactionColor(type: string) {
		switch (type) {
			case 'like':
				return 'text-red-500';
			case 'post':
				return 'text-blue-500';
			case 'comment':
				return 'text-green-500';
			case 'follow':
				return 'text-purple-500';
			default:
				return 'text-gray-500';
		}
	}

	/**
	 * 대상 정보 조회 (게시글/댓글 제목, 사용자 이름)
	 */
	async function getTargetInfo(reaction: any): Promise<string> {
		if (!rtdb) return '';

		try {
			const { type, targetType, targetId, postId } = reaction;

			// 팔로우인 경우: 사용자 이름 조회
			if (type === 'follow' && targetType === 'user') {
				const userFields = await getUserFields(targetId, ['displayName']);
				return userFields.displayName || '알 수 없는 사용자';
			}

			// 게시글인 경우: 게시글 제목 또는 본문 일부
			if (type === 'post' && targetType === 'post') {
				const postRef = dbRef(rtdb, `posts/${targetId}`);
				const snapshot = await get(postRef);
				if (snapshot.exists()) {
					const postData = snapshot.val();
					return postData.text?.substring(0, 50) || '(내용 없음)';
				}
				return '(삭제된 게시글)';
			}

			// 댓글인 경우: 댓글 내용 일부
			if (type === 'comment' && targetType === 'comment' && postId) {
				const commentRef = dbRef(rtdb, `comments/${postId}/${targetId}`);
				const snapshot = await get(commentRef);
				if (snapshot.exists()) {
					const commentData = snapshot.val();
					return commentData.text?.substring(0, 50) || '(내용 없음)';
				}
				return '(삭제된 댓글)';
			}

			// 좋아요인 경우: targetType에 따라 게시글 또는 댓글 정보 조회
			if (type === 'like') {
				if (targetType === 'post') {
					const postRef = dbRef(rtdb, `posts/${targetId}`);
					const snapshot = await get(postRef);
					if (snapshot.exists()) {
						const postData = snapshot.val();
						return postData.text?.substring(0, 50) || '(내용 없음)';
					}
					return '(삭제된 게시글)';
				}

				if (targetType === 'comment' && postId) {
					const commentRef = dbRef(rtdb, `comments/${postId}/${targetId}`);
					const snapshot = await get(commentRef);
					if (snapshot.exists()) {
						const commentData = snapshot.val();
						return commentData.text?.substring(0, 50) || '(내용 없음)';
					}
					return '(삭제된 댓글)';
				}
			}

			return '';
		} catch (error) {
			console.error('대상 정보 조회 실패:', error);
			return '';
		}
	}

	/**
	 * 리액션 클릭 핸들러 (해당 콘텐츠로 이동)
	 */
	function handleReactionClick(reaction: any) {
		const { type, targetType, targetId, postId } = reaction;

		// 팔로우: 사용자 프로필로 이동
		if (type === 'follow' && targetType === 'user') {
			goto(`/user/profile?uid=${targetId}`);
			return;
		}

		// 게시글: 게시글 상세로 이동
		if (targetType === 'post') {
			goto(`/post/${targetId}`);
			return;
		}

		// 댓글: 게시글 상세로 이동 (댓글이 포함된 게시글)
		if (targetType === 'comment' && postId) {
			goto(`/post/${postId}#comment-${targetId}`);
			return;
		}
	}
</script>

<svelte:head>
	<title>Sonub - {m.myActivityTitle()}</title>
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
				<p class="text-center">{m.myActivityDescription()}</p>
			</Card.Content>
		</Card.Root>
	</section>

<!-- 나의 발자취 목록 -->
{:else}
	<section class="page-container">
		<div class="header-section">
			<h1 class="page-title">{m.myActivityTitle()}</h1>
			<p class="page-description">{m.myActivityDescription()}</p>
		</div>

		<div class="list-container">
			<DatabaseListView
				path={`my-actions/${authStore.user.uid}`}
				pageSize={20}
				orderBy="createdAt"
				reverse={true}
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
						<!-- 아이콘 -->
						<div class="icon-wrapper {getReactionColor(reaction.type)}">
							<Icon size={24} />
						</div>

						<!-- 리액션 내용 -->
						<div class="content-wrapper">
							<div class="reaction-header">
								<span class="reaction-type">{getReactionText(reaction.type)}</span>
								<span class="reaction-time">
									{formatDistanceToNow(reaction.createdAt, {
										addSuffix: true,
										locale: getDateLocale()
									})}
								</span>
							</div>

							<!-- 대상 정보 (비동기 로드) -->
							{#await getTargetInfo(reaction)}
								<p class="target-info loading">...</p>
							{:then targetInfo}
								{#if targetInfo}
									<p class="target-info">{targetInfo}</p>
								{/if}
							{/await}
						</div>
					</button>
				{/snippet}

				{#snippet loading()}
					<div class="status-message">
						<p>{m.myActivityLoading()}</p>
					</div>
				{/snippet}

				{#snippet empty()}
					<div class="status-message">
						<p>{m.myActivityEmpty()}</p>
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

	.icon-wrapper {
		@apply flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-full bg-gray-50;
	}

	.content-wrapper {
		@apply flex flex-1 flex-col gap-2;
	}

	.reaction-header {
		@apply flex items-center justify-between gap-2;
	}

	.reaction-type {
		@apply font-semibold text-gray-900;
	}

	.reaction-time {
		@apply text-sm text-gray-500;
	}

	.target-info {
		@apply text-sm text-gray-700;
	}

	.target-info.loading {
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
