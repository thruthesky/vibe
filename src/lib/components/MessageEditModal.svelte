<!--
  메시지/게시글/댓글 생성 및 수정을 위한 공용 모달 컴포넌트

  이 컴포넌트는 순수하게 UI와 파일 업로드 로직만 담당하며,
  채팅 메시지 수정, 게시글 생성/수정, 댓글 생성/수정에서 재사용됩니다.

  주요 기능:
  - 텍스트 입력 (textarea)
  - 파일 업로드/삭제 (Firebase Storage)
  - 업로드 진행률 표시
  - 기존 파일 관리
  - 저장/취소 버튼

  비즈니스 로직(저장, 유효성 검사 등)은 부모 컴포넌트에서 처리합니다.
-->

<script lang="ts">
	import { Dialog, DialogContent, DialogHeader, DialogTitle } from '$lib/components/ui/dialog';
	import { Button } from '$lib/components/ui/button';
	import {
		uploadChatFile,
		deleteChatFile,
		formatFileSize,
		getFilenameFromUrl,
		isImageUrl,
		isVideoUrl,
		getExtensionFromFilename
	} from '$lib/functions/storage.functions';
	import type { FileUploadStatus } from '$lib/types/chat.types';
	import { authStore } from '$lib/stores/auth.svelte';

	/**
	 * Props 인터페이스
	 */
	interface Props {
		/** 모달 열림 상태 (bindable) */
		open: boolean;
		/** Dialog 제목 */
		title: string;
		/** 텍스트 라벨 */
		textLabel?: string;
		/** 초기 텍스트 */
		initialText?: string;
		/** 초기 첨부파일 URL 목록 */
		initialUrls?: Record<number, string>;
		/** 파일 업로드용 roomId (Firebase Storage 경로에 사용) */
		roomId: string;
		/** 저장 버튼 텍스트 */
		saveButtonText?: string;
		/** 취소 버튼 텍스트 */
		cancelButtonText?: string;
		/** 텍스트 입력 placeholder */
		textPlaceholder?: string;
		/** 저장 콜백 (비즈니스 로직 처리) */
		onSave: (text: string, urls: Record<number, string>) => Promise<{
			success: boolean;
			error?: string;
		}>;
		/** 취소 콜백 */
		onCancel?: () => void;
		/** 추가 필드 slot 사용 여부 */
		hasAdditionalFields?: boolean;
		/** 추가 필드 slot (Svelte 5 snippet) */
		children?: import('svelte').Snippet;
	}

	let {
		open = $bindable(),
		title,
		textLabel = '내용',
		initialText = '',
		initialUrls = {},
		roomId,
		saveButtonText = '저장',
		cancelButtonText = '취소',
		textPlaceholder = '내용을 입력하세요...',
		onSave,
		onCancel,
		hasAdditionalFields = false,
		children
	}: Props = $props();

	// 상태
	let text = $state(initialText);
	let urls = $state<Record<number, string>>({ ...initialUrls });
	let uploadingFiles: FileUploadStatus[] = $state([]);
	let saving = $state(false);
	let error = $state<string | null>(null);

	// 파일 입력 참조
	let fileInputRef: HTMLInputElement | null = $state(null);

	// 드래그 앤 드롭 상태
	let draggedIndex: number | null = $state(null);
	let dragOverIndex: number | null = $state(null);

	// 최대 파일 크기
	const MAX_FILE_SIZE = 10 * 1024 * 1024; // 일반 파일: 10MB
	const MAX_VIDEO_SIZE = 24 * 1024 * 1024; // 동영상 파일 (.mp4): 24MB

	/**
	 * 초기화: 모달이 열릴 때 초기값 복원
	 */
	$effect(() => {
		if (open) {
			text = initialText;
			urls = { ...initialUrls };
			uploadingFiles = [];
			error = null;
		}
	});

	/**
	 * 파일 선택 버튼 클릭
	 */
	function handleFileButtonClick() {
		fileInputRef?.click();
	}

	/**
	 * 파일 선택 핸들러
	 */
	async function handleFileSelect(event: Event) {
		const input = event.target as HTMLInputElement;
		const files = Array.from(input.files || []);

		if (files.length === 0) return;

		if (!authStore.user?.uid) {
			alert('로그인이 필요합니다.');
			return;
		}

		await processFiles(files);

		// input 초기화
		input.value = '';
	}

	/**
	 * 파일 처리 (업로드)
	 * 여러 파일을 동시에 병렬로 업로드합니다.
	 */
	async function processFiles(files: File[]) {
		// 1. 파일 크기 검증 - 유효한 파일만 필터링
		const validFiles: File[] = [];
		for (const file of files) {
			const isVideo = file.type === 'video/mp4' || file.name.toLowerCase().endsWith('.mp4');
			const maxSize = isVideo ? MAX_VIDEO_SIZE : MAX_FILE_SIZE;
			const maxSizeMB = (maxSize / (1024 * 1024)).toFixed(0);

			if (file.size > maxSize) {
				alert(`파일 크기가 ${maxSizeMB}MB를 초과합니다: ${file.name}`);
				continue;
			}
			validFiles.push(file);
		}

		if (validFiles.length === 0) return;

		// 2. 모든 유효한 파일을 uploadingFiles 배열에 한번에 추가
		const newFileStatuses: FileUploadStatus[] = validFiles.map((file) => ({
			file,
			progress: 0,
			completed: false
		}));

		uploadingFiles = [...uploadingFiles, ...newFileStatuses];
		const startIndex = uploadingFiles.length - newFileStatuses.length;

		// 3. 각 파일에 대한 URL 인덱스 미리 할당 (동시 업로드 시 인덱스 충돌 방지)
		const urlIndices: number[] = [];
		for (let i = 0; i < validFiles.length; i++) {
			const nextIndex = Math.max(...Object.keys(urls).map(Number), ...urlIndices, -1) + 1;
			urlIndices.push(nextIndex);
		}

		// 4. 모든 파일을 동시에 병렬 업로드
		const uploadPromises = validFiles.map(async (file, i) => {
			const currentIndex = startIndex + i;
			const fileStatus = uploadingFiles[currentIndex];

			try {
				// Firebase Storage에 업로드
				const downloadUrl = await uploadChatFile(
					file,
					authStore.user!.uid,
					roomId,
					(progress) => {
						// 진행률 업데이트 (각 파일마다 독립적으로)
						uploadingFiles[currentIndex].progress = progress;
					}
				);

				// 업로드 완료
				uploadingFiles[currentIndex].completed = true;
				uploadingFiles[currentIndex].downloadUrl = downloadUrl;

				// urls에 추가 (사전 할당된 인덱스 사용)
				urls = { ...urls, [urlIndices[i]]: downloadUrl };

				// uploadingFiles에서 제거 (객체 참조로 필터링하여 안전하게 제거)
				uploadingFiles = uploadingFiles.filter((fs) => fs !== fileStatus);
			} catch (err) {
				console.error('파일 업로드 실패:', err);
				uploadingFiles[currentIndex].error = '업로드 실패';
			}
		});

		// 모든 업로드가 완료될 때까지 대기하지 않음 (백그라운드 업로드)
		// 사용자는 업로드 진행 중에도 다른 작업 가능
	}

	/**
	 * 기존 파일 삭제
	 */
	async function handleRemoveExistingFile(index: number) {
		const url = urls[index];
		if (!url) return;

		try {
			// Storage에서 삭제
			await deleteChatFile(url);

			// 로컬 상태에서 제거
			const newUrls = { ...urls };
			delete newUrls[index];
			urls = newUrls;
		} catch (err) {
			console.error('파일 삭제 실패:', err);
			// 삭제 실패해도 로컬에서는 제거
			const newUrls = { ...urls };
			delete newUrls[index];
			urls = newUrls;
		}
	}

	/**
	 * 업로드 중인 파일 삭제
	 */
	async function handleRemoveUploadingFile(index: number) {
		const fileStatus = uploadingFiles[index];

		// Storage에서 삭제 (업로드 완료된 경우만)
		// Note: 업로드가 완료되면 uploadingFiles에서 즉시 제거되므로
		// 이 함수가 호출될 때는 대부분 업로드 중이거나 실패한 파일임
		if (fileStatus.downloadUrl) {
			try {
				await deleteChatFile(fileStatus.downloadUrl);
			} catch (err) {
				console.error('파일 삭제 실패:', err);
			}
		}

		// 로컬 목록에서 제거
		uploadingFiles = uploadingFiles.filter((_, i) => i !== index);
	}

	/**
	 * 취소 버튼
	 */
	function handleCancel() {
		// 업로드된 파일 삭제 (초기 파일이 아닌 새로 업로드된 파일만)
		const initialUrlValues = Object.values(initialUrls);
		uploadingFiles.forEach(async (fileStatus) => {
			if (fileStatus.downloadUrl && !initialUrlValues.includes(fileStatus.downloadUrl)) {
				try {
					await deleteChatFile(fileStatus.downloadUrl);
				} catch (err) {
					console.error('파일 삭제 실패:', err);
				}
			}
		});

		// 상태 초기화
		text = initialText;
		urls = { ...initialUrls };
		uploadingFiles = [];
		error = null;

		// 부모 콜백 호출
		if (onCancel) {
			onCancel();
		} else {
			open = false;
		}
	}

	/**
	 * 저장 버튼
	 */
	async function handleSave() {
		if (saving) return;

		// 업로드 중인 파일 확인
		const incompleteFiles = uploadingFiles.filter((fs) => !fs.completed && !fs.error);
		if (incompleteFiles.length > 0) {
			error = `업로드 중인 파일이 ${incompleteFiles.length}개 있습니다. 업로드 완료 후 다시 시도해주세요.`;
			return;
		}

		// 업로드 실패한 파일 확인
		const failedFiles = uploadingFiles.filter((fs) => fs.error);
		if (failedFiles.length > 0) {
			error = `업로드 실패한 파일이 ${failedFiles.length}개 있습니다. 삭제 후 다시 시도해주세요.`;
			return;
		}

		saving = true;
		error = null;

		try {
			// 부모 컴포넌트의 onSave 콜백 호출 (비즈니스 로직 처리)
			const result = await onSave(text.trim(), urls);

			if (!result.success) {
				error = result.error || '저장에 실패했습니다.';
				saving = false;
				return;
			}

			// 저장 성공
			saving = false;
			open = false;
		} catch (err) {
			console.error('저장 실패:', err);
			error = '저장에 실패했습니다. 다시 시도해주세요.';
			saving = false;
		}
	}

	/**
	 * 드래그 앤 드롭: URLs 재정렬
	 * fromIndex 위치의 파일을 toIndex 위치로 이동
	 */
	function reorderUrls(fromIndex: number, toIndex: number) {
		if (fromIndex === toIndex) return;

		// 현재 urls를 배열로 변환 (정렬을 위해)
		const entries = Object.entries(urls).map(([idx, url]) => ({
			index: Number(idx),
			url
		}));

		// fromIndex에 해당하는 항목 찾기
		const fromEntryIdx = entries.findIndex((e) => e.index === fromIndex);
		const toEntryIdx = entries.findIndex((e) => e.index === toIndex);

		if (fromEntryIdx === -1 || toEntryIdx === -1) return;

		// 배열에서 이동
		const [movedItem] = entries.splice(fromEntryIdx, 1);
		entries.splice(toEntryIdx, 0, movedItem);

		// 새로운 인덱스로 Record 재구성
		const newUrls: Record<number, string> = {};
		entries.forEach((entry, idx) => {
			newUrls[idx] = entry.url;
		});

		urls = newUrls;
	}

	/**
	 * 드래그 시작
	 */
	function handleDragStart(index: number) {
		draggedIndex = index;
	}

	/**
	 * 드래그 오버 (드롭 영역 위에 있을 때)
	 */
	function handleDragOver(event: DragEvent, index: number) {
		event.preventDefault(); // 드롭을 허용하기 위해 필수
		dragOverIndex = index;
	}

	/**
	 * 드롭 (파일을 놓았을 때)
	 */
	function handleDrop(event: DragEvent, toIndex: number) {
		event.preventDefault();

		if (draggedIndex !== null && draggedIndex !== toIndex) {
			reorderUrls(draggedIndex, toIndex);
		}

		// 상태 초기화
		draggedIndex = null;
		dragOverIndex = null;
	}

	/**
	 * 드래그 종료
	 */
	function handleDragEnd() {
		draggedIndex = null;
		dragOverIndex = null;
	}
</script>

<Dialog bind:open>
	<DialogContent class="sm:max-w-2xl">
		<DialogHeader>
			<DialogTitle>{title}</DialogTitle>
		</DialogHeader>

		<div class="edit-modal-content">
			<!-- 추가 필드 slot (카테고리 선택 등) -->
			{#if hasAdditionalFields}
				{@render children?.()}
			{/if}

			<!-- 텍스트 편집 -->
			<div class="form-group">
				<label for="message-text" class="form-label">{textLabel}</label>
				<textarea
					id="message-text"
					class="form-textarea"
					rows="4"
					bind:value={text}
					placeholder={textPlaceholder}
					onkeydown={(e) => {
						// 스페이스바 및 Enter 키 이벤트가 Dialog 컴포넌트로 전파되지 않도록 막음
						// 이렇게 하면 textarea 내에서 자유롭게 스페이스와 줄바꿈을 입력할 수 있음
						if (e.key === ' ' || e.key === 'Enter') {
							e.stopPropagation();
						}
					}}
				/>
			</div>

			<!-- 첨부파일 목록 (완료된 파일 + 업로드 중인 파일) -->
			{#if Object.keys(urls).length > 0 || uploadingFiles.length > 0}
				<div class="form-group">
					<label class="form-label">첨부파일</label>
					<div class="file-grid">
						<!-- 완료된 파일 -->
						{#each Object.entries(urls) as [index, url]}
							{@const numIndex = Number(index)}
							<div
								class="file-item"
								class:file-item-dragging={draggedIndex === numIndex}
								class:file-item-drag-over={dragOverIndex === numIndex &&
									draggedIndex !== numIndex}
								draggable="true"
								ondragstart={() => handleDragStart(numIndex)}
								ondragover={(e) => handleDragOver(e, numIndex)}
								ondrop={(e) => handleDrop(e, numIndex)}
								ondragend={handleDragEnd}
							>
								<!-- 파일 미리보기 -->
								{#if isImageUrl(url)}
									<img src={url} alt="첨부 이미지" class="file-preview-image" />
								{:else if isVideoUrl(url)}
									<video src={url} class="file-preview-video" controls />
								{:else}
									<div class="file-icon-box">
										<span class="file-extension-text"
											>{getExtensionFromFilename(getFilenameFromUrl(url))
												.replace('.', '')
												.toUpperCase()}</span
										>
									</div>
								{/if}

								<!-- 드래그 핸들 버튼 (왼쪽 하단) -->
								<button type="button" class="file-drag-handle" aria-label="드래그하여 순서 변경">
									<svg
										class="h-4 w-4"
										fill="none"
										stroke="currentColor"
										viewBox="0 0 24 24"
										stroke-width="2"
									>
										<path
											stroke-linecap="round"
											stroke-linejoin="round"
											d="M4 8h16M4 16h16"
										/>
									</svg>
								</button>

								<!-- 삭제 버튼 -->
								<button
									type="button"
									class="file-remove-button"
									onclick={() => handleRemoveExistingFile(numIndex)}
								>
									✕
								</button>

								<!-- 파일명 -->
								<p class="file-name">{getFilenameFromUrl(url)}</p>
							</div>
						{/each}

						<!-- 업로드 중인 파일 -->
						{#each uploadingFiles as fileStatus, index}
							<div class="file-item">
								<!-- 파일 미리보기 -->
								{#if fileStatus.file.type.startsWith('image/') || fileStatus.file.type.startsWith('video/')}
									<div class="preview-thumbnail">
										{#if fileStatus.downloadUrl}
											{#if fileStatus.file.type.startsWith('image/')}
												<img src={fileStatus.downloadUrl} alt={fileStatus.file.name} />
											{:else if fileStatus.file.type.startsWith('video/')}
												<video src={fileStatus.downloadUrl} controls />
											{/if}
										{:else}
											<div class="preview-placeholder"></div>
										{/if}

										<!-- 프로그레스바 (업로드 중일 때만 표시) -->
										{#if !fileStatus.completed && !fileStatus.error}
											<div class="upload-progress-overlay">
												<svg class="progress-ring" width="80" height="80">
													<circle class="progress-ring-bg" cx="40" cy="40" r="32" stroke-width="6" />
													<circle
														class="progress-ring-circle"
														cx="40"
														cy="40"
														r="32"
														stroke-width="6"
														stroke-dasharray="201.06"
														stroke-dashoffset={201.06 - (201.06 * fileStatus.progress) / 100}
													/>
												</svg>
												<span class="upload-percentage">{fileStatus.progress}%</span>
											</div>
										{/if}
									</div>
								{:else}
									<div class="file-icon-box">
										<span class="file-extension-text"
											>{getExtensionFromFilename(fileStatus.file.name)
												.replace('.', '')
												.toUpperCase()}</span
										>

										<!-- 프로그레스바 (업로드 중일 때만 표시) -->
										{#if !fileStatus.completed && !fileStatus.error}
											<div class="upload-progress-overlay">
												<svg class="progress-ring" width="80" height="80">
													<circle class="progress-ring-bg" cx="40" cy="40" r="32" stroke-width="6" />
													<circle
														class="progress-ring-circle"
														cx="40"
														cy="40"
														r="32"
														stroke-width="6"
														stroke-dasharray="201.06"
														stroke-dashoffset={201.06 - (201.06 * fileStatus.progress) / 100}
													/>
												</svg>
												<span class="upload-percentage">{fileStatus.progress}%</span>
											</div>
										{/if}
									</div>
								{/if}

								<!-- 에러 표시 -->
								{#if fileStatus.error}
									<div class="upload-error-overlay">
										<p class="upload-error">{fileStatus.error}</p>
									</div>
								{/if}

								<!-- 삭제 버튼 -->
								<button
									type="button"
									class="file-remove-button"
									onclick={() => handleRemoveUploadingFile(index)}
								>
									✕
								</button>

								<!-- 파일명 -->
								<p class="file-name">{fileStatus.file.name}</p>
							</div>
						{/each}
					</div>
				</div>
			{/if}

			<!-- 에러 메시지 -->
			{#if error}
				<p class="error-message">{error}</p>
			{/if}

			<!-- 파일 업로드 버튼 + 취소/저장 버튼 (한 줄에 배치) -->
			<div class="action-buttons-row">
				<!-- 파일 업로드 버튼 -->
				<button type="button" class="upload-button" onclick={handleFileButtonClick}>
					<svg class="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="2">
						<path
							stroke-linecap="round"
							stroke-linejoin="round"
							d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z"
						/>
						<path stroke-linecap="round" stroke-linejoin="round" d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
					</svg>
					파일 추가
				</button>

				<input
					bind:this={fileInputRef}
					type="file"
					onchange={handleFileSelect}
					multiple
					accept="image/*,video/*,.pdf,.txt,.doc,.docx,.zip,.rar"
					style="display: none;"
				/>

				<!-- 취소/저장 버튼 그룹 -->
				<div class="button-group">
					<Button variant="ghost" onclick={handleCancel} disabled={saving}>{cancelButtonText}</Button>
					<Button variant="outline" onclick={handleSave} disabled={saving}
						>{saving ? '저장 중...' : saveButtonText}</Button
					>
				</div>
			</div>
		</div>
	</DialogContent>
</Dialog>

<style>
	@import 'tailwindcss' reference;

	.edit-modal-content {
		@apply space-y-4;
	}

	.form-group {
		@apply space-y-2;
	}

	.form-label {
		@apply text-sm font-semibold text-gray-700;
	}

	.form-textarea {
		@apply w-full rounded-lg border border-gray-300 px-3 py-2 text-sm;
		@apply focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20;
	}

	.file-grid {
		@apply grid grid-cols-2 gap-3 md:grid-cols-3;
	}

	.file-item {
		@apply relative rounded-lg border-2 border-gray-200 overflow-hidden;
		@apply transition-all hover:border-gray-300;
		cursor: grab;
	}

	.file-item:active {
		cursor: grabbing;
	}

	.file-preview-image,
	.file-preview-video {
		@apply aspect-square w-full object-cover;
	}

	.file-icon-box {
		@apply relative flex aspect-square w-full items-center justify-center bg-gray-100;
	}

	.file-extension-text {
		@apply text-3xl font-bold uppercase text-gray-600;
	}

	.preview-thumbnail {
		@apply relative aspect-square w-full overflow-hidden bg-gray-100;
	}

	.preview-thumbnail img,
	.preview-thumbnail video {
		@apply h-full w-full object-cover;
	}

	.preview-placeholder {
		@apply h-full w-full bg-gray-200;
	}

	.upload-progress-overlay {
		@apply absolute inset-0 flex items-center justify-center bg-black/50 backdrop-blur-sm;
	}

	.progress-ring {
		@apply absolute;
		transform: rotate(-90deg);
	}

	.progress-ring-bg {
		@apply fill-none stroke-white/30;
	}

	.progress-ring-circle {
		@apply fill-none stroke-blue-400;
		transition: stroke-dashoffset 0.3s ease-in-out;
		stroke-linecap: round;
	}

	.upload-percentage {
		@apply absolute text-2xl font-bold text-white drop-shadow-lg;
		z-index: 10;
	}

	.upload-error-overlay {
		@apply absolute inset-0 flex items-center justify-center bg-red-500/80 backdrop-blur-sm p-2;
	}

	.upload-error {
		@apply text-xs text-center text-white font-semibold;
	}

	.file-remove-button {
		@apply absolute right-1 top-1 z-10;
		@apply flex h-6 w-6 items-center justify-center;
		@apply rounded-full bg-red-500 text-xs font-bold text-white shadow-lg;
		@apply transition-all hover:bg-red-600 hover:scale-110 active:scale-95;
	}

	.file-name {
		@apply truncate px-2 py-1 text-xs text-gray-600;
	}

	/* 드래그 앤 드롭 관련 스타일 */
	.file-drag-handle {
		@apply absolute bottom-1 left-1 z-10;
		@apply flex h-6 w-6 items-center justify-center;
		@apply rounded-md bg-gray-600/80 text-white shadow-md;
		@apply transition-all hover:bg-gray-700 hover:scale-110 active:scale-95;
		cursor: grab;
	}

	.file-drag-handle:active {
		cursor: grabbing;
	}

	.file-item-dragging {
		@apply opacity-50 scale-95 rotate-2;
		@apply border-blue-400;
	}

	.file-item-drag-over {
		@apply border-blue-500 border-dashed bg-blue-50/50;
		@apply scale-105;
	}

	.upload-button {
		@apply flex items-center gap-2 rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm;
		@apply transition-colors hover:bg-gray-50 active:bg-gray-100;
	}

	.error-message {
		@apply text-sm text-red-600;
	}

	.action-buttons-row {
		@apply flex items-center justify-between pt-2;
	}

	.button-group {
		@apply flex gap-2;
	}
</style>
