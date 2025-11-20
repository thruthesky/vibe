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
	import { m } from '$lib/paraglide/messages';

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

	// 전체 보기 상태
	let showAll = $state(false);

	// 남은 개수
	const remainingCount = $derived(urlArray.length - maxDisplay);

	// 표시할 URLs
	// - 전체 보기: 모든 URL 표시
	// - 제한 보기: maxDisplay개 표시 (마지막 아이템에 overlay로 +N 표시)
	const displayUrls = $derived(
		showAll ? urlArray : urlArray.slice(0, maxDisplay)
	);

	/**
	 * 전체 보기 토글
	 */
	function toggleShowAll() {
		showAll = !showAll;
	}

	/**
	 * 첨부 파일 개수에 따른 그리드 레이아웃 클래스
	 * - 1개: 1열 (100%)
	 * - 2개: 2열 (50% 50%)
	 * - 3개 이상: 2열 (첫 번째는 100%, 나머지는 50%씩)
	 */
	const getGridClass = (count: number) => {
		if (count === 1) return 'grid-cols-1';
		return 'grid-cols-2';
	};

	/**
	 * 각 아이템의 span 클래스
	 * - 1개일 때: 모두 col-span-1
	 * - 2개일 때: 모두 col-span-1
	 * - 3개 이상일 때: 첫 번째만 col-span-2, 나머지는 col-span-1
	 */
	const getItemSpanClass = (index: number, totalCount: number) => {
		if (totalCount === 1 || totalCount === 2) {
			return 'col-span-1';
		}
		// 3개 이상: 첫 번째만 2칸, 나머지는 1칸
		return index === 0 ? 'col-span-2' : 'col-span-1';
	};

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
	<div class="attachment-grid mt-3 grid gap-1 {getGridClass(displayUrls.length)}">
		{#each displayUrls as url, index}
			{@const urlString = String(url)}
			{@const spanClass = getItemSpanClass(index, displayUrls.length)}
			{@const isLastItem = !showAll && remainingCount > 0 && index === maxDisplay - 1}
			{#if isImageUrl(urlString)}
				<!-- 이미지 썸네일 - 클릭 시 모달로 확대 또는 전체 보기 -->
				<button
					type="button"
					onclick={() => isLastItem ? toggleShowAll() : openImageModal(urlString)}
					class="attachment-item {spanClass}"
				>
					<img src={urlString} alt={m.fileAttachmentImage()} class="attachment-image" />
					{#if isLastItem}
						<!-- Overlay: 어두운 배경 + +N 텍스트 -->
						<div class="attachment-overlay">
							<span class="text-4xl font-bold text-white">+{remainingCount}</span>
						</div>
					{/if}
				</button>
			{:else if isVideoUrl(urlString)}
				<!-- 비디오 썸네일 - 컨트롤러 포함 또는 전체 보기 -->
				<div
					class="attachment-item {spanClass}"
					onclick={(e) => {
						if (isLastItem) {
							e.preventDefault();
							toggleShowAll();
						}
					}}
					role={isLastItem ? "button" : undefined}
					tabindex={isLastItem ? 0 : undefined}
				>
					<video src={urlString} class="attachment-video" controls preload="metadata">
						<track kind="captions" />
					</video>
					{#if isLastItem}
						<!-- Overlay: 어두운 배경 + +N 텍스트 -->
						<div class="attachment-overlay">
							<span class="text-4xl font-bold text-white">+{remainingCount}</span>
						</div>
					{/if}
				</div>
			{:else}
				<!-- 기타 파일: 확장자 표시 및 다운로드 버튼 또는 전체 보기 -->
				<button
					type="button"
					onclick={() => isLastItem ? toggleShowAll() : downloadFile(urlString)}
					class="attachment-item attachment-file {spanClass}"
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
					{#if isLastItem}
						<!-- Overlay: 어두운 배경 + +N 텍스트 -->
						<div class="attachment-overlay">
							<span class="text-4xl font-bold text-white">+{remainingCount}</span>
						</div>
					{/if}
				</button>
			{/if}
		{/each}
		<!-- 접기 버튼 -->
		{#if showAll && urlArray.length > maxDisplay}
			<!-- 접기 버튼 -->
			<button
				type="button"
				onclick={toggleShowAll}
				class="attachment-item attachment-more {getItemSpanClass(displayUrls.length, displayUrls.length + 1)}"
			>
				<svg
					class="h-6 w-6 text-gray-600"
					fill="none"
					stroke="currentColor"
					viewBox="0 0 24 24"
					stroke-width="2"
				>
					<path
						stroke-linecap="round"
						stroke-linejoin="round"
						d="M5 15l7-7 7 7"
					/>
				</svg>
				<span class="text-sm font-semibold text-gray-600">{m.attachmentShowLess()}</span>
			</button>
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
					aria-label={m.commonBack()}
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
					aria-label={m.commonClose()}
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
				alt={m.fileAttachmentZoomed()}
				class="max-h-[90vh] max-w-[90vw] rounded-lg object-contain shadow-2xl"
				onclick={(e) => e.stopPropagation()}
			/>
		</div>
	</div>
{/if}

<style>
	@import 'tailwindcss' reference;

	/**
	 * 첨부 파일 그리드 컨테이너
	 */
	.attachment-grid {
		@apply w-full;
	}

	/**
	 * 각 첨부 파일 아이템
	 * - 상대 위치 지정으로 내부 요소 절대 위치 가능
	 * - overflow-hidden으로 이미지/비디오가 영역을 벗어나지 않도록
	 * - rounded로 모서리 둥글게
	 * - 최소 높이 지정
	 */
	.attachment-item {
		@apply relative overflow-hidden rounded-lg;
		@apply min-h-[200px];
		@apply transition-transform hover:scale-[1.02];
		@apply cursor-pointer;
	}

	/**
	 * 이미지 스타일
	 * - 부모 요소 전체 크기 채우기
	 * - object-cover로 비율 유지하면서 영역 채우기
	 */
	.attachment-image {
		@apply h-full w-full object-cover;
	}

	/**
	 * 비디오 스타일
	 * - 부모 요소 전체 크기 채우기
	 * - object-cover로 비율 유지하면서 영역 채우기
	 */
	.attachment-video {
		@apply h-full w-full object-cover;
	}

	/**
	 * 파일 아이템 스타일
	 * - flex로 중앙 정렬
	 * - 배경색 지정
	 */
	.attachment-file {
		@apply flex flex-col items-center justify-center gap-2;
		@apply bg-gray-100;
		@apply hover:bg-gray-200;
	}

	/**
	 * 남은 파일 개수 표시 (+N)
	 * - flex로 중앙 정렬
	 * - 배경색 및 텍스트 색상 지정
	 */
	.attachment-more {
		@apply flex items-center justify-center;
		@apply bg-gray-200 text-gray-700;
		@apply hover:bg-gray-300;
	}

	/**
	 * 첨부 파일 Overlay (마지막 아이템에 +N 표시)
	 * - 절대 위치로 부모 요소 전체를 덮음
	 * - 어두운 반투명 배경
	 * - 텍스트 중앙 정렬
	 */
	.attachment-overlay {
		@apply absolute inset-0;
		@apply flex items-center justify-center;
		@apply bg-black/60;
		@apply cursor-pointer;
	}
</style>
