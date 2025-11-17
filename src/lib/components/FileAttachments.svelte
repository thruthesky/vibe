<!--
  첨부 파일 표시 컴포넌트 (재사용 가능)

  기능:
  - 첨부 파일 목록을 받아서 미리보기로 표시
  - 이미지, 비디오, 기타 파일을 구분하여 표시
  - 이미지 클릭 시 모달로 확대 보기
  - 비디오 재생 컨트롤 지원
  - 기타 파일 다운로드 기능
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
		/** 최대 표시 개수 (기본값: 30) */
		maxDisplay?: number;
		/** 썸네일 크기 (Tailwind 클래스: h-32 w-32 등) */
		thumbnailSize?: string;
	}

	let { urls, maxDisplay = 30, thumbnailSize = 'h-32 w-32' }: Props = $props();

	// URLs를 배열로 변환
	const urlArray = $derived(Object.values(urls));
	// 표시할 URLs (최대 개수만큼만)
	const displayUrls = $derived(urlArray.slice(0, maxDisplay));
	// 남은 개수
	const remainingCount = $derived(urlArray.length - maxDisplay);

	// 모달 상태 관리
	let showModal = $state(false);
	let selectedImageUrl = $state('');

	/**
	 * 이미지 클릭 핸들러 - 모달 열기
	 */
	function openImageModal(url: string) {
		selectedImageUrl = url;
		showModal = true;
	}

	/**
	 * 모달 닫기
	 */
	function closeModal() {
		showModal = false;
		selectedImageUrl = '';
	}

	/**
	 * URL에서 파일 확장자 추출
	 */
	function getFileExtension(url: string): string {
		const urlObj = new URL(url);
		const pathname = urlObj.pathname;
		const extension = pathname.split('.').pop()?.toUpperCase() || 'FILE';
		return extension;
	}

	/**
	 * 파일 다운로드
	 */
	function downloadFile(url: string) {
		const link = document.createElement('a');
		link.href = url;
		link.download = '';
		link.target = '_blank';
		document.body.appendChild(link);
		link.click();
		document.body.removeChild(link);
	}
</script>

<!-- 첨부 파일이 있는 경우에만 표시 -->
{#if urlArray.length > 0}
	<div class="mt-2 flex flex-wrap gap-2">
		{#each displayUrls as url}
			{@const urlString = String(url)}
			{#if isImageUrl(urlString)}
				<!-- 이미지 썸네일 - 클릭 시 모달로 확대 -->
				<button
					type="button"
					onclick={() => openImageModal(urlString)}
					class="rounded transition-transform hover:scale-105"
				>
					<img
						src={urlString}
						alt="첨부 이미지"
						class="rounded object-cover {thumbnailSize}"
					/>
				</button>
			{:else if isVideoUrl(urlString)}
				<!-- 비디오 썸네일 - 컨트롤러 포함 -->
				<video
					src={urlString}
					class="rounded object-cover {thumbnailSize}"
					controls
					preload="metadata"
				>
					<track kind="captions" />
				</video>
			{:else}
				<!-- 기타 파일: 확장자 표시 및 다운로드 버튼 -->
				<button
					type="button"
					onclick={() => downloadFile(urlString)}
					class="flex flex-col items-center justify-center gap-1 rounded bg-gray-100 transition-colors hover:bg-gray-200 {thumbnailSize}"
				>
					<!-- 파일 아이콘 -->
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
					<!-- 확장자 표시 -->
					<span class="text-xs font-semibold text-gray-600">
						{getFileExtension(urlString)}
					</span>
				</button>
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

<!-- 이미지 확대 모달 -->
{#if showModal}
	<div
		class="fixed inset-0 z-50 flex items-center justify-center"
		onclick={closeModal}
		role="button"
		tabindex="0"
		onkeydown={(e) => e.key === 'Escape' && closeModal()}
	>
		<!-- Backdrop (투명도 높은 배경) -->
		<div class="absolute inset-0 bg-black/80"></div>

		<!-- 모달 컨텐츠 -->
		<div class="relative z-10 max-h-[90vh] max-w-[90vw]">
			<!-- 상단 버튼 영역 -->
			<div class="absolute left-0 right-0 top-0 flex items-start justify-between p-4">
				<!-- 뒤로가기 버튼 (왼쪽) -->
				<button
					type="button"
					onclick={closeModal}
					class="rounded-full bg-white/90 p-2 shadow-lg transition-colors hover:bg-white"
					aria-label="뒤로가기"
				>
					<svg
						class="h-6 w-6 text-gray-800"
						fill="none"
						stroke="currentColor"
						viewBox="0 0 24 24"
						stroke-width="2"
					>
						<path stroke-linecap="round" stroke-linejoin="round" d="M15 19l-7-7 7-7" />
					</svg>
				</button>

				<!-- 닫기 버튼 (오른쪽) -->
				<button
					type="button"
					onclick={closeModal}
					class="rounded-full bg-white/90 p-2 shadow-lg transition-colors hover:bg-white"
					aria-label="닫기"
				>
					<svg
						class="h-6 w-6 text-gray-800"
						fill="none"
						stroke="currentColor"
						viewBox="0 0 24 24"
						stroke-width="2"
					>
						<path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12" />
					</svg>
				</button>
			</div>

			<!-- 확대된 이미지 -->
			<img
				src={selectedImageUrl}
				alt="확대 이미지"
				class="max-h-[90vh] max-w-[90vw] rounded-lg object-contain shadow-2xl"
				onclick={(e) => e.stopPropagation()}
			/>
		</div>
	</div>
{/if}
