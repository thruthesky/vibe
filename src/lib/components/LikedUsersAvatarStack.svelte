<!--
  좋아요 사용자 아바타 스택 컴포넌트

  게시글, 메시지 등에서 좋아요한 사용자를 아바타 스택으로 표시
  - 최대 3명까지 프로필 사진 표시
  - 3명 초과 시 (+N) 표시
  - 클릭 시 좋아요 사용자 목록 모달 열기
-->

<script lang="ts">
	import Avatar from '$lib/components/user/avatar.svelte';

	/**
	 * Props
	 */
	interface Props {
		/** 좋아요한 사용자 UID 배열 */
		likedByUids: string[];
		/** 클릭 핸들러 */
		onClick?: () => void;
	}

	let { likedByUids = [], onClick }: Props = $props();

	/**
	 * State
	 */
	let displayUids = $derived(likedByUids.slice(0, 3)); // 최대 3명까지 표시
	let remainingCount = $derived(Math.max(0, likedByUids.length - 3)); // 남은 사용자 수
</script>

{#if likedByUids.length > 0}
	<button class="avatar-stack" onclick={onClick} type="button">
		<!-- 프로필 사진 스택 (최대 3명) -->
		<div class="avatar-list">
			{#each displayUids as uid, index}
				<div class="avatar-wrapper" style="z-index: {10 - index};">
					<Avatar {uid} size={24} />
				</div>
			{/each}
		</div>

		<!-- 남은 사용자 수 표시 (3명 초과 시) -->
		{#if remainingCount > 0}
			<span class="remaining-count">+{remainingCount}</span>
		{/if}
	</button>
{/if}

<style>
	@import 'tailwindcss' reference;

	.avatar-stack {
		@apply flex items-center gap-1.5;
		@apply transition-opacity hover:opacity-80;
		@apply cursor-pointer;
	}

	.avatar-list {
		@apply flex items-center;
	}

	.avatar-wrapper {
		@apply relative;
		@apply -ml-1.5 first:ml-0;
		@apply rounded-full ring-2 ring-white;
	}

	.remaining-count {
		@apply text-xs text-gray-600 font-medium;
	}
</style>
