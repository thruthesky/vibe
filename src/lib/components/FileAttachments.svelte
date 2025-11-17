<!--
  첨부 파일 표시 컴포넌트 (재사용 가능)

  기능:
  - 첨부 파일 목록을 받아서 미리보기로 표시
  - 이미지, 비디오, 기타 파일을 구분하여 표시
  - 최대 표시 개수 제한 가능
  - 글 목록, 댓글 목록 등 어디서든 재사용 가능
-->

<script lang="ts">
	import { isImageUrl, isVideoUrl } from '$lib/functions/storage.functions';

	/**
	 * Props
	 */
	interface Props {
		/** 첨부 파일 URL 목록 */
		urls: Record<number, string>;
		/** 최대 표시 개수 (기본값: 3) */
		maxDisplay?: number;
		/** 썸네일 크기 (Tailwind 클래스: h-20 w-20 등) */
		thumbnailSize?: string;
	}

	let { urls, maxDisplay = 3, thumbnailSize = 'h-20 w-20' }: Props = $props();

	// URLs를 배열로 변환
	const urlArray = $derived(Object.values(urls));
	// 표시할 URLs (최대 개수만큼만)
	const displayUrls = $derived(urlArray.slice(0, maxDisplay));
	// 남은 개수
	const remainingCount = $derived(urlArray.length - maxDisplay);
</script>

<!-- 첨부 파일이 있는 경우에만 표시 -->
{#if urlArray.length > 0}
	<div class="mt-2 flex gap-2">
		{#each displayUrls as url}
			{@const urlString = String(url)}
			{#if isImageUrl(urlString)}
				<!-- 이미지 썸네일 -->
				<img src={urlString} alt="첨부 이미지" class="rounded object-cover {thumbnailSize}" />
			{:else if isVideoUrl(urlString)}
				<!-- 비디오 썸네일 -->
				<video src={urlString} class="rounded object-cover {thumbnailSize}" muted preload="metadata">
					<track kind="captions" />
				</video>
			{:else}
				<!-- 기타 파일: 파일 아이콘 -->
				<div class="flex items-center justify-center rounded bg-gray-100 {thumbnailSize}">
					<svg
						class="h-8 w-8 text-gray-400"
						fill="none"
						stroke="currentColor"
						viewBox="0 0 24 24"
						stroke-width="2"
					>
						<path
							stroke-linecap="round"
							stroke-linejoin="round"
							d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z"
						/>
					</svg>
				</div>
			{/if}
		{/each}
		<!-- 남은 파일 개수 표시 -->
		{#if remainingCount > 0}
			<div
				class="flex items-center justify-center rounded bg-gray-100 text-sm font-medium text-gray-600 {thumbnailSize}"
			>
				+{remainingCount}
			</div>
		{/if}
	</div>
{/if}
