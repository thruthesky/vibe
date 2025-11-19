<!--
  좋아요 사용자 목록 모달 컴포넌트

  채팅 메시지, 게시글, 댓글 등에서 재사용 가능한 컴포넌트
  - 좋아요한 사용자 목록을 모달로 표시
  - UserProfile 컴포넌트를 사용하여 사용자 정보 표시
  - 자동으로 좋아요 사용자 데이터를 로드
-->

<script lang="ts">
	import { Dialog, DialogContent, DialogHeader, DialogTitle } from '$lib/components/ui/dialog';
	import UserProfile from '$lib/components/UserProfile.svelte';
	import { fetchLikedByUsers, type LikeTargetType } from '$lib/functions/like.functions';
	import * as m from '$lib/paraglide/messages.js';

	/**
	 * Props
	 */
	interface Props {
		/** 모달 열림 상태 (양방향 바인딩) */
		open: boolean;
		/** 대상 ID (메시지 ID 또는 댓글 ID) */
		targetId?: string;
		/** 대상 타입 ('message' 또는 'comment') */
		targetType?: LikeTargetType;
	}

	let { open = $bindable(false), targetId = '', targetType = 'message' }: Props = $props();

	/**
	 * State
	 */
	let likedByUsers = $state<string[]>([]);
	let loading = $state(false);

	/**
	 * 모달이 열릴 때 좋아요 사용자 로드
	 */
	$effect(() => {
		if (open && targetId) {
			loadLikedUsers();
		}
	});

	/**
	 * 좋아요 사용자 로드
	 */
	async function loadLikedUsers() {
		if (!targetId) {
			likedByUsers = [];
			return;
		}

		loading = true;
		try {
			const uids = await fetchLikedByUsers(targetId, targetType);
			likedByUsers = uids;
		} catch (error) {
			console.error('좋아요 사용자 로드 실패:', error);
			likedByUsers = [];
		} finally {
			loading = false;
		}
	}
</script>

<Dialog bind:open>
	<DialogContent class="max-w-md">
		<DialogHeader>
			<DialogTitle>{m.likeUsersList()}</DialogTitle>
		</DialogHeader>

		<div class="max-h-96 overflow-y-auto">
			{#if loading}
				<div class="flex items-center justify-center py-8">
					<div class="loading-spinner"></div>
					<span class="ml-2 text-gray-500">{m.commonLoading()}</span>
				</div>
			{:else if likedByUsers.length > 0}
				<ul class="space-y-2">
					{#each likedByUsers as uid}
						<li class="user-item">
							<UserProfile {uid} photoSize="h-10 w-10" textSize="text-base" />
						</li>
					{/each}
				</ul>
			{:else}
				<p class="empty-message">{m.likeUsersEmpty()}</p>
			{/if}
		</div>
	</DialogContent>
</Dialog>

<style>
	@import 'tailwindcss' reference;

	.user-item {
		@apply rounded-lg border border-gray-200 bg-gray-50 px-4 py-3;
		@apply transition-colors hover:bg-gray-100;
	}

	.empty-message {
		@apply py-8 text-center text-gray-500;
	}

	.loading-spinner {
		@apply h-5 w-5 animate-spin rounded-full border-2 border-gray-300 border-t-blue-600;
	}
</style>
