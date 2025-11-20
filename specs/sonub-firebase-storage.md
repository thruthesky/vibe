---
name: sonub-firebase-storage
version: 1.0.0
description: Firebase Storage 업로드/목록/삭제 예제 명세
author: Codex Agent
email: noreply@openai.com
step: 45
priority: '*'
dependencies:
  - sonub-setup-firebase.md
tags:
  - firebase
  - storage
  - upload
  - example
---

## 1. 개요

- Firebase Storage 예제는 `sonub-setup-firebase.md`의 사용 예제 섹션에서 분리되었습니다.
- 본 문서는 `src/routes/upload/+page.svelte`에 구현해야 할 파일 업로드 도구의 전체 코드를 정의합니다.

## 2. Storage 업로드 예제

**파일 경로:** `src/routes/upload/+page.svelte`

**설명:**
- 로그인한 사용자의 UID별 디렉터리에 파일을 업로드합니다.
- 업로드 진행률, 취소, 최근 업로드 URL 표시, 목록 새로고침, 삭제 기능을 포함합니다.

**소스 코드 위치**: [storage.functions.ts.md](./repository/src/lib/functions/storage.functions.ts.md)

```svelte
<script lang="ts">
	import { browser } from '$app/environment';
	import { storage, auth } from '$lib/firebase';
	import {
		ref as sRef,
		uploadBytesResumable,
		getDownloadURL,
		deleteObject,
		listAll,
		type UploadTask
	} from 'firebase/storage';
	import type { StoredFile } from '$lib/types/firebase';

	let file: File | null = null;
	let progress = 0;
	let files: StoredFile[] = [];
	let lastURL = '';
	let uploadTask: UploadTask | null = null;

	/**
	 * 파일 업로드
	 */
	function upload(): void {
		if (!file || !auth.currentUser) {
			alert('파일을 선택하고 로그인하세요.');
			return;
		}

		const userId = auth.currentUser.uid;
		const timestamp = Date.now();
		const path = `uploads/${userId}/${timestamp}_${file.name}`;
		const storageRef = sRef(storage, path);

		uploadTask = uploadBytesResumable(storageRef, file, {
			contentType: file.type
		});

		uploadTask.on(
			'state_changed',
			// 진행률 업데이트
			(snapshot) => {
				progress = Math.round((snapshot.bytesTransferred / snapshot.totalBytes) * 100);
				console.log(`업로드 진행률: ${progress}%`);
			},
			// 에러 처리
			(error) => {
				console.error('업로드 실패:', error);
				alert(`업로드 실패: ${error.message}`);
				progress = 0;
			},
			// 완료 처리
			async () => {
				try {
					lastURL = await getDownloadURL(uploadTask!.snapshot.ref);
					console.log('업로드 완료:', lastURL);
					await refreshList();
					progress = 0;
					file = null;
				} catch (error: any) {
					console.error('다운로드 URL 가져오기 실패:', error);
					alert(`다운로드 URL 가져오기 실패: ${error.message}`);
				}
			}
		);
	}

	/**
	 * 업로드 취소
	 */
	function cancelUpload(): void {
		if (uploadTask) {
			uploadTask.cancel();
			progress = 0;
			alert('업로드가 취소되었습니다.');
		}
	}

	/**
	 * 파일 목록 새로고침
	 */
	async function refreshList(): Promise<void> {
		if (!auth.currentUser) return;

		const userId = auth.currentUser.uid;
		const dirRef = sRef(storage, `uploads/${userId}`);

		try {
			const result = await listAll(dirRef);

			files = await Promise.all(
				result.items.map(async (itemRef) => {
					const url = await getDownloadURL(itemRef);
					const metadata = await itemRef.getMetadata();

					return {
						name: itemRef.name,
						fullPath: itemRef.fullPath,
						url: url,
						size: metadata.size,
						contentType: metadata.contentType || 'unknown',
						uploadedAt: new Date(metadata.timeCreated).getTime()
					};
				})
			);

			// 최신 업로드 순 정렬
			files.sort((a, b) => b.uploadedAt - a.uploadedAt);
		} catch (error: any) {
			console.error('목록 가져오기 실패:', error);
			alert(`목록 가져오기 실패: ${error.message}`);
		}
	}

	/**
	 * 파일 삭제
	 */
	async function remove(fullPath: string): Promise<void> {
		if (!confirm('정말로 삭제하시겠습니까?')) return;

		try {
			await deleteObject(sRef(storage, fullPath));
			console.log('삭제 완료:', fullPath);
			await refreshList();
		} catch (error: any) {
			console.error('삭제 실패:', error);
			alert(`삭제 실패: ${error.message}`);
		}
	}

	/**
	 * 파일 크기 포맷팅
	 */
	function formatBytes(bytes: number): string {
		if (bytes === 0) return '0 Bytes';
		const k = 1024;
		const sizes = ['Bytes', 'KB', 'MB', 'GB'];
		const i = Math.floor(Math.log(bytes) / Math.log(k));
		return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + ' ' + sizes[i];
	}

	// 컴포넌트 마운트 시 목록 로드
	if (browser && auth.currentUser) {
		refreshList();
	}
</script>

<div class="upload-container">
	<h1>파일 업로드 (Firebase Storage)</h1>

	<div class="upload-section">
		<input
			type="file"
			on:change={(e) => {
				const target = e.target as HTMLInputElement;
				file = target.files?.[0] ?? null;
			}}
		/>
		<button on:click={upload} disabled={!file || progress > 0}>업로드</button>

		{#if progress > 0 && progress < 100}
			<div class="progress-container">
				<div class="progress-bar" style="width: {progress}%"></div>
				<span class="progress-text">{progress}%</span>
			</div>
			<button on:click={cancelUpload} class="cancel">취소</button>
		{/if}
	</div>

	{#if lastURL}
		<div class="last-upload">
			<h3>최근 업로드:</h3>
			<a href={lastURL} target="_blank" rel="noreferrer">{lastURL}</a>
		</div>
	{/if}

	<div class="list-section">
		<div class="list-header">
			<h2>업로드된 파일 목록</h2>
			<button on:click={refreshList} class="refresh">새로고침</button>
		</div>

		{#if files.length === 0}
			<p class="empty">업로드된 파일이 없습니다.</p>
		{:else}
			<ul class="file-list">
				{#each files as f (f.fullPath)}
					<li>
						<div class="file-info">
							<a href={f.url} target="_blank" rel="noreferrer">{f.name}</a>
							<span class="file-meta">
								{formatBytes(f.size)} • {new Date(f.uploadedAt).toLocaleString('ko-KR')}
							</span>
						</div>
						<button on:click={() => remove(f.fullPath)} class="delete">삭제</button>
					</li>
				{/each}
			</ul>
		{/if}
	</div>
</div>

<style>
	.upload-container {
		max-width: 800px;
		margin: 2rem auto;
		padding: 2rem;
	}

	.upload-section {
		margin-bottom: 2rem;
		padding: 1.5rem;
		border: 2px dashed #ddd;
		border-radius: 8px;
	}

	input[type='file'] {
		margin-bottom: 1rem;
		display: block;
	}

	button {
		padding: 0.75rem 1.5rem;
		background-color: #4285f4;
		color: white;
		border: none;
		border-radius: 4px;
		cursor: pointer;
		margin-right: 0.5rem;
	}

	button:hover:not(:disabled) {
		background-color: #3367d6;
	}

	button:disabled {
		background-color: #ccc;
		cursor: not-allowed;
	}

	button.cancel {
		background-color: #f44336;
	}

	button.cancel:hover {
		background-color: #d32f2f;
	}

	.progress-container {
		position: relative;
		height: 12px;
		background-color: #eee;
		border-radius: 999px;
		margin: 1rem 0;
		overflow: hidden;
	}

	.progress-bar {
		height: 100%;
		background-color: #4285f4;
		transition: width 0.3s ease;
	}

	.progress-text {
		position: absolute;
		top: 50%;
		left: 50%;
		transform: translate(-50%, -50%);
		font-weight: 600;
		color: #333;
	}

	.last-upload {
		padding: 1rem;
		background-color: #e8f5e9;
		border-radius: 4px;
		margin-bottom: 2rem;
	}

	.last-upload h3 {
		margin: 0 0 0.5rem 0;
	}

	.last-upload a {
		word-break: break-all;
		color: #1976d2;
	}

	.list-section {
		margin-top: 2rem;
	}

	.list-header {
		display: flex;
		justify-content: space-between;
		align-items: center;
		margin-bottom: 1rem;
	}

	button.refresh {
		background-color: #666;
		padding: 0.5rem 1rem;
	}

	button.refresh:hover {
		background-color: #555;
	}

	.file-list {
		list-style: none;
		padding: 0;
	}

	.file-list li {
		display: flex;
		justify-content: space-between;
		align-items: center;
		padding: 1rem;
		border: 1px solid #ddd;
		border-radius: 4px;
		margin-bottom: 0.5rem;
	}

	.file-info {
		flex: 1;
		display: flex;
		flex-direction: column;
		gap: 0.25rem;
	}

	.file-info a {
		color: #1976d2;
		text-decoration: none;
	}

	.file-info a:hover {
		text-decoration: underline;
	}

	.file-meta {
		font-size: 0.875rem;
		color: #666;
	}

	button.delete {
		background-color: #d32f2f;
		padding: 0.5rem 1rem;
	}

	button.delete:hover {
		background-color: #b71c1c;
	}

	.empty {
		text-align: center;
		color: #999;
		padding: 2rem;
	}
</style>
```

## 3. 동작 요약

- 업로드 중에는 진행률 바와 취소 버튼을 함께 표시합니다.
- 업로드 완료 후 `getDownloadURL`을 호출하여 최근 업로드 URL을 화면에 출력합니다.
- `listAll`과 `getMetadata`를 조합해 파일 목록을 최신 업로드 순으로 정렬합니다.
- 삭제 버튼은 `confirm()`으로 재확인을 거친 뒤 `deleteObject`를 호출합니다.

## 4. 검증 절차

1. 로그인 후 `/upload` 페이지에 접속합니다.
2. 10MB 이하의 파일을 업로드하고 진행률 표시 및 취소 버튼을 확인합니다.
3. 업로드 완료 후 다운로드 URL이 표시되고, 목록에 새 항목이 추가되는지 확인합니다.
4. `새로고침` 버튼으로 목록이 다시 로드되는지 테스트합니다.
5. 삭제 버튼을 클릭해 Storage 객체가 즉시 제거되는지 확인합니다.

## 5. 업로드한 파일 미리보기 (Preview)

### 5.1. 개요

Firebase Storage에 업로드된 파일(이미지, 비디오, 기타 파일)을 UI에서 미리보기로 표시하는 방법을 설명합니다.

**⚠️ 중요: Firebase Storage 파일을 화면에 표시할 때는 가능한 한 `FileAttachments` 컴포넌트를 사용하세요.**

`FileAttachments` 컴포넌트는:
- 이미지, 비디오, 기타 파일을 자동으로 구분하여 올바르게 표시
- 재사용 가능한 컴포넌트로 코드 중복 방지
- 일관된 UI/UX 제공
- 파일 타입 오판으로 인한 버그 방지 (예: MP4를 `<img>` 태그로 렌더링하는 실수)

### 5.2. FileAttachments 컴포넌트 사용

**파일 경로:** `src/lib/components/FileAttachments.svelte`

**기능:**
- Firebase Storage URL 목록을 받아서 미리보기로 표시
- 이미지는 `<img>` 태그로 표시 (클릭 시 모달로 확대 보기)
- 비디오는 `<video>` 태그로 표시 (재생 컨트롤러 포함)
- 기타 파일은 파일 아이콘과 확장자 표시 (클릭 시 다운로드)
- 최대 표시 개수 제한 가능
- 남은 파일 개수를 "+N" 형식으로 표시

**주요 기능:**

1. **이미지 확대 모달**
   - 이미지 클릭 시 전체 화면 모달로 확대 보기
   - 투명도 높은 backdrop (bg-black/80)
   - 좌측 상단: 뒤로가기 버튼, 우측 상단: 닫기 버튼
   - ESC 키 또는 backdrop 클릭으로 닫기

2. **비디오 재생 컨트롤**
   - `controls` 속성으로 재생/일시정지/전체화면 컨트롤 제공
   - 사용자가 직접 비디오를 재생하거나 전체화면으로 볼 수 있음

3. **기타 파일 다운로드**
   - 파일 확장자 자동 추출 및 표시 (예: "PDF", "TXT", "ZIP")
   - 클릭 시 즉시 다운로드
   - hover 시 배경색 변경으로 클릭 가능함을 시각적으로 표시

4. **확대된 프리뷰 크기**
   - 기본 썸네일 크기: `h-32 w-32` (이전: `h-20 w-20`)
   - Props로 커스터마이징 가능

**전체 소스 코드:**

**소스 코드 위치**: [storage.functions.ts.md](./repository/src/lib/functions/storage.functions.ts.md)

```svelte
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
```

**사용 예시:**

**소스 코드 위치**: [storage.functions.ts.md](./repository/src/lib/functions/storage.functions.ts.md)

```svelte
<script lang="ts">
	import FileAttachments from '$lib/components/FileAttachments.svelte';

	// Firebase Storage에서 업로드된 파일 URL 목록
	const urls = {
		0: 'https://firebasestorage.googleapis.com/.../photo.jpg?token=...',
		1: 'https://firebasestorage.googleapis.com/.../video.mp4?token=...',
		2: 'https://firebasestorage.googleapis.com/.../document.pdf?token=...'
	};
</script>

<!-- 첨부 파일 미리보기 표시 -->
<FileAttachments
	{urls}
	maxDisplay={3}
	thumbnailSize="h-20 w-20"
/>
```

**Props:**
- `urls`: `Record<number, string>` - 첨부 파일 URL 목록 (숫자 인덱스 키)
- `maxDisplay`: `number` - 최대 표시 개수 (기본값: 30)
- `thumbnailSize`: `string` - 썸네일 크기 Tailwind 클래스 (기본값: "h-32 w-32", 예: "h-20 w-20", "h-16 w-16")

**동작 원리:**

1. **파일 타입 자동 감지**: `isImageUrl()`과 `isVideoUrl()` 함수를 사용하여 URL의 확장자를 분석
2. **조건부 렌더링**:
   - 이미지 파일 → `<img>` 태그로 썸네일 표시 (클릭 가능한 버튼으로 래핑)
   - 비디오 파일 → `<video>` 태그로 미리보기 표시 (controls, preload="metadata")
   - 기타 파일 → 문서 아이콘 + 확장자 표시 (클릭 시 다운로드)
3. **이미지 확대 모달**:
   - 이미지 클릭 시 `showModal` 상태를 true로 설정
   - 전체 화면 모달 표시 (fixed positioning, z-50)
   - backdrop 클릭, ESC 키, 버튼 클릭으로 닫기
4. **파일 다운로드**: `<a>` 태그를 동적으로 생성하여 브라우저 다운로드 트리거
5. **남은 개수 표시**: maxDisplay보다 파일이 많으면 "+N" 형식으로 표시

### 5.3. 파일 타입 판별 함수

**파일 경로:** `src/lib/functions/storage.functions.ts`

Firebase Storage URL에서 파일 타입을 판별하는 유틸리티 함수들:

#### `isImageUrl(url: string): boolean`

URL이 이미지 파일인지 확인합니다.

**지원 확장자:** `.jpg`, `.jpeg`, `.png`, `.gif`, `.webp`, `.bmp`, `.svg`

**소스 코드 위치**: [storage.functions.ts.md](./repository/src/lib/functions/storage.functions.ts.md)

```typescript
import { isImageUrl } from '$lib/functions/storage.functions';

const url = 'https://firebasestorage.googleapis.com/.../photo.jpg?token=...';
if (isImageUrl(url)) {
	console.log('이미지 파일입니다');
}
```

#### `isVideoUrl(url: string): boolean`

URL이 비디오 파일인지 확인합니다.

**지원 확장자:** `.mp4`, `.mov`, `.avi`, `.webm`, `.mkv`

**소스 코드 위치**: [storage.functions.ts.md](./repository/src/lib/functions/storage.functions.ts.md)

```typescript
import { isVideoUrl } from '$lib/functions/storage.functions';

const url = 'https://firebasestorage.googleapis.com/.../video.mp4?token=...';
if (isVideoUrl(url)) {
	console.log('비디오 파일입니다');
}
```

#### `getFilenameFromUrl(url: string): string`

Firebase Storage URL에서 파일명을 추출합니다.

**소스 코드 위치**: [storage.functions.ts.md](./repository/src/lib/functions/storage.functions.ts.md)

```typescript
import { getFilenameFromUrl } from '$lib/functions/storage.functions';

const url = 'https://firebasestorage.googleapis.com/v0/b/bucket/o/users%2Fuid%2Fchat-files%2Froomid%2F1234567890-photo.jpg?token=...';
const filename = getFilenameFromUrl(url);
// 결과: "photo.jpg" (타임스탬프 제거됨)
```

### 5.4. 이미지 미리보기 구현 예시

**소스 코드 위치**: [storage.functions.ts.md](./repository/src/lib/functions/storage.functions.ts.md)

```svelte
<script lang="ts">
	import { isImageUrl, isVideoUrl } from '$lib/functions/storage.functions';

	const urls = {
		0: 'https://firebasestorage.googleapis.com/.../photo.jpg?token=...',
		1: 'https://firebasestorage.googleapis.com/.../video.mp4?token=...'
	};

	const urlArray = Object.values(urls);
</script>

<div class="flex gap-2">
	{#each urlArray as url}
		{#if isImageUrl(url)}
			<!-- 이미지 표시 -->
			<img
				src={url}
				alt="첨부 이미지"
				class="h-20 w-20 rounded object-cover"
			/>
		{:else if isVideoUrl(url)}
			<!-- 비디오 표시 -->
			<video
				src={url}
				class="h-20 w-20 rounded object-cover"
				muted
				preload="metadata"
			>
				<track kind="captions" />
			</video>
		{:else}
			<!-- 기타 파일: 아이콘 표시 -->
			<div class="flex h-20 w-20 items-center justify-center rounded bg-gray-100">
				<svg class="h-8 w-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
					<path
						stroke-linecap="round"
						stroke-linejoin="round"
						stroke-width="2"
						d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z"
					/>
				</svg>
			</div>
		{/if}
	{/each}
</div>
```

### 5.5. 실제 사용 사례

#### 홈페이지에서 첨부 파일 미리보기

**파일:** `src/routes/+page.svelte`

**소스 코드 위치**: [storage.functions.ts.md](./repository/src/lib/functions/storage.functions.ts.md)

```svelte
<script lang="ts">
	import FileAttachments from '$lib/components/FileAttachments.svelte';
	// ... 기타 imports
</script>

<!-- 게시글 카드 내부 -->
<div class="post-card">
	<!-- 게시글 내용 -->
	<div class="post-content">
		<p class="post-text">
			{message.text || '(내용 없음)'}
		</p>

		<!-- 첨부파일 미리보기 (FileAttachments 컴포넌트 사용) -->
		{#if message.urls}
			<FileAttachments urls={message.urls} />
		{/if}
	</div>
	<!-- ... 기타 내용 -->
</div>
```

**변경 전 (잘못된 예시 - 버그):**

**소스 코드 위치**: [storage.functions.ts.md](./repository/src/lib/functions/storage.functions.ts.md)

```svelte
<!-- ❌ 모든 파일을 <img> 태그로 렌더링 (잘못된 방법) -->
{#if message.urls && Object.keys(message.urls).length > 0}
	<div class="post-images">
		{#each Object.values(message.urls).slice(0, 3) as url}
			<img src={String(url)} alt="첨부 이미지" class="post-image-thumbnail" />
		{/each}
		{#if Object.keys(message.urls).length > 3}
			<div class="post-image-more">
				+{Object.keys(message.urls).length - 3}
			</div>
		{/if}
	</div>
{/if}
```

**문제점:**
- MP4 비디오 파일이 `<img>` 태그로 렌더링되어 깨진 이미지로 표시
- PDF, TXT 등 기타 파일도 `<img>` 태그로 렌더링되어 에러 발생
- 파일 타입 구분 로직 없음

**변경 후 (올바른 예시):**

**소스 코드 위치**: [storage.functions.ts.md](./repository/src/lib/functions/storage.functions.ts.md)

```svelte
<!-- ✅ FileAttachments 컴포넌트 사용 (올바른 방법) -->
{#if message.urls}
	<FileAttachments urls={message.urls} />
{/if}
```

**개선 사항:**
- 이미지는 `<img>` 태그로 미리보기
- 비디오는 `<video>` 태그로 미리보기
- 기타 파일은 문서 아이콘으로 표시
- 파일 타입 자동 감지 및 올바른 렌더링

#### 게시판 목록에서 첨부 파일 미리보기

**파일:** `src/routes/post/list/+page.svelte`

**소스 코드 위치**: [storage.functions.ts.md](./repository/src/lib/functions/storage.functions.ts.md)

```svelte
<!-- 첨부파일 미리보기 (FileAttachments 컴포넌트 사용) -->
{#if message.urls}
	<FileAttachments urls={message.urls} />
{/if}
```

#### 댓글 목록에서 첨부 파일 미리보기

**파일:** `src/lib/components/post/PostCommentList.svelte`

**소스 코드 위치**: [storage.functions.ts.md](./repository/src/lib/functions/storage.functions.ts.md)

```svelte
<!-- 첨부 파일 미리보기 (FileAttachments 컴포넌트 사용) -->
{#if comment.urls}
	<FileAttachments urls={comment.urls} maxDisplay={2} thumbnailSize="h-16 w-16" />
{/if}
```

### 5.6. CORS 설정 (중요)

Firebase Storage는 기본적으로 CORS를 허용하지만, 특정 도메인에서만 접근을 허용하려면 CORS 설정이 필요합니다.

**CORS 설정 파일 예시:** `cors.json`

**소스 코드 위치**: [storage.functions.ts.md](./repository/src/lib/functions/storage.functions.ts.md)

```json
[
  {
    "origin": ["*"],
    "method": ["GET"],
    "maxAgeSeconds": 3600
  }
]
```

**CORS 설정 적용:**

**소스 코드 위치**: [storage.functions.ts.md](./repository/src/lib/functions/storage.functions.ts.md)

```bash
# Google Cloud SDK 설치 후
gsutil cors set cors.json gs://your-bucket-name.appspot.com
```

### 5.7. 이미지 로딩 에러 처리

이미지 로딩 실패 시 fallback 이미지를 표시하는 방법:

**소스 코드 위치**: [storage.functions.ts.md](./repository/src/lib/functions/storage.functions.ts.md)

```svelte
<img
	src={url}
	alt="첨부 이미지"
	class="h-20 w-20 rounded object-cover"
	onerror={(e) => {
		// 이미지 로딩 실패 시 기본 이미지로 대체
		e.currentTarget.src = '/images/placeholder.png';
	}}
/>
```

### 5.8. 보안 고려사항

1. **다운로드 URL 토큰**: Firebase Storage URL에는 보안 토큰이 포함되어 있습니다. 이 토큰은 일정 기간 후 만료될 수 있으므로, 장기간 저장이 필요한 경우 `getDownloadURL()`을 다시 호출해야 합니다.

2. **파일 크기 제한**: 대용량 파일은 미리보기로 표시하지 말고, 다운로드 링크만 제공하는 것이 좋습니다.

3. **이미지 최적화**: 썸네일 생성을 위해 Cloud Functions를 사용하여 이미지 리사이징을 고려할 수 있습니다.

### 5.9. 문제 해결

#### 이미지가 표시되지 않는 경우

1. **URL 확인**: 브라우저 콘솔에서 URL이 올바른지 확인
2. **CORS 에러**: 브라우저 콘솔에서 CORS 에러 메시지 확인
3. **파일 확장자**: `isImageUrl()` 함수가 올바르게 확장자를 인식하는지 확인
4. **Firebase Security Rules**: Storage 보안 규칙에서 읽기 권한이 허용되어 있는지 확인

**브라우저 콘솔에서 디버깅:**

**소스 코드 위치**: [storage.functions.ts.md](./repository/src/lib/functions/storage.functions.ts.md)

```javascript
// URL에서 파일명 추출 테스트
import { getFilenameFromUrl, isImageUrl, isVideoUrl } from '$lib/functions/storage.functions';

const url = 'https://firebasestorage.googleapis.com/.../photo.jpg?token=...';
console.log('Filename:', getFilenameFromUrl(url));
console.log('Is Image:', isImageUrl(url));
console.log('Is Video:', isVideoUrl(url));
```

#### 홈페이지에서 첨부 파일이 깨져 보이는 문제 (실제 버그 사례)

**증상:**
- 홈페이지에서 MP4, PDF, TXT 등 이미지가 아닌 파일들이 깨진 이미지 아이콘으로 표시됨
- 브라우저 콘솔에 "Failed to load resource" 에러 발생

**원인:**
- 홈페이지(`src/routes/+page.svelte`)에서 모든 첨부 파일을 `<img>` 태그로 렌더링하는 오래된 코드 사용
- `FileAttachments` 컴포넌트를 사용하지 않고 직접 `<img>` 태그로 구현

**문제 코드:**

**소스 코드 위치**: [storage.functions.ts.md](./repository/src/lib/functions/storage.functions.ts.md)

```svelte
<!-- ❌ 잘못된 코드 - 모든 파일을 <img>로 렌더링 -->
{#if message.urls && Object.keys(message.urls).length > 0}
	<div class="post-images">
		{#each Object.values(message.urls).slice(0, 3) as url}
			<img src={String(url)} alt="첨부 이미지" class="post-image-thumbnail" />
		{/each}
	</div>
{/if}
```

**해결 방법:**

1. `FileAttachments` 컴포넌트를 import:

**소스 코드 위치**: [storage.functions.ts.md](./repository/src/lib/functions/storage.functions.ts.md)

```svelte
<script lang="ts">
	import FileAttachments from '$lib/components/FileAttachments.svelte';
	// ... 기타 imports
</script>
```

2. 기존 코드를 `FileAttachments` 컴포넌트로 교체:

**소스 코드 위치**: [storage.functions.ts.md](./repository/src/lib/functions/storage.functions.ts.md)

```svelte
<!-- ✅ 올바른 코드 - FileAttachments 컴포넌트 사용 -->
{#if message.urls}
	<FileAttachments urls={message.urls} />
{/if}
```

**결과:**
- ✅ 이미지 파일: `<img>` 태그로 썸네일 미리보기
- ✅ 비디오 파일: `<video>` 태그로 미리보기
- ✅ 기타 파일: 문서 아이콘으로 표시
- ✅ 모든 파일 타입이 올바르게 표시됨

**검증 방법:**

Chrome DevTools를 사용하여 확인:

**소스 코드 위치**: [storage.functions.ts.md](./repository/src/lib/functions/storage.functions.ts.md)

```javascript
// DOM에서 FileAttachments 컴포넌트 확인
const fileAttachmentContainers = document.querySelectorAll('.mt-2.flex.gap-2');
const oldImageContainers = document.querySelectorAll('.post-images');

console.log('FileAttachments 컨테이너:', fileAttachmentContainers.length); // 9개 (정상)
console.log('Old 이미지 컨테이너:', oldImageContainers.length); // 0개 (수정됨)

// 각 컨테이너의 내용 확인
fileAttachmentContainers.forEach((container, idx) => {
	const images = container.querySelectorAll('img');
	const videos = container.querySelectorAll('video');
	const fileIcons = container.querySelectorAll('svg');

	console.log(`컨테이너 ${idx}:`, {
		images: images.length,
		videos: videos.length,
		fileIcons: fileIcons.length
	});
});
```

**교훈:**
- Firebase Storage 파일을 표시할 때는 항상 `FileAttachments` 컴포넌트를 사용할 것
- 수동으로 `<img>` 태그를 사용하면 파일 타입 구분 로직을 빠뜨릴 수 있음
- 재사용 가능한 컴포넌트를 사용하면 코드 중복과 버그를 방지할 수 있음
