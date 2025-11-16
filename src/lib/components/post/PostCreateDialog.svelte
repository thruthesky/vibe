<!--
  게시글 작성 다이얼로그 컴포넌트

  채팅 메시지와 통합된 게시글 작성 기능을 제공합니다.
  - 글 내용 입력
  - 사진 업로드
  - 카테고리 선택
  - 그룹/오픈 채팅방 선택
  - /chat-messages에 메시지로 저장
-->

<script lang="ts">
	import { Dialog, DialogContent, DialogHeader, DialogTitle } from '$lib/components/ui/dialog';
	import { Button } from '$lib/components/ui/button';
	import { FORUM_CATEGORIES, type ForumCategory } from '../../../../shared/categories';
	import * as m from '$lib/paraglide/messages.js';
	import { authStore } from '$lib/stores/auth.svelte';
	import { pushData } from '$lib/stores/database.svelte';
	import { uploadChatFile, deleteChatFile, formatFileSize } from '$lib/functions/storage.functions';
	import type { FileUploadStatus } from '$lib/types/chat.types';
	import { rtdb } from '$lib/firebase';
	import { ref, query, orderByChild, get } from 'firebase/database';

	// Props
	interface Props {
		open: boolean;
		/**
		 * 게시글 작성 후 선택할 카테고리 콜백
		 * 게시판 페이지에서 사용하여 저장 후 해당 카테고리로 자동 이동
		 */
		onPostCreated?: (category: ForumCategory) => void;
	}

	let { open = $bindable(), onPostCreated }: Props = $props();

	// 카테고리 이름을 i18n 메시지 함수로 변환
	const getCategoryMessage = (category: ForumCategory) => {
		const categoryMap: Record<ForumCategory, () => string> = {
			discussion: m.chatCategoryFreeDiscussion,
			qna: m.chatCategoryQna,
			news: m.chatCategoryNews,
			info: m.chatCategoryInformation,
			selling: m.chatCategoryForSale,
			hiring: m.chatCategoryJobs,
			travel: m.chatCategoryTravel,
			mukbang: m.chatCategoryFood,
			realestate: m.chatCategoryRealEstate,
			hobby: m.chatCategoryHobby
		};
		return categoryMap[category]();
	};

	// 상태
	let postText = $state('');
	let selectedCategory = $state<string>('');
	let selectedRoomId = $state<string>('post'); // 기본값: "post"
	let uploadingFiles: FileUploadStatus[] = $state([]);
	let isSaving = $state(false);
	let saveError = $state<string | null>(null);
	let fileInputRef: HTMLInputElement | null = $state(null);

	// 그룹/오픈 채팅방 목록
	let chatRooms: Array<{ roomId: string; roomName: string }> = $state([]);
	let loadingRooms = $state(false);

	/**
	 * 그룹/오픈 채팅방 목록 로드
	 * /chat-joins/{uid}에서 참여한 모든 채팅방을 가져와
	 * /chat-rooms/{roomId}의 타입이 "group" 또는 "open"인 채팅방만 필터링
	 */
	async function loadChatRooms() {
		if (!authStore.user?.uid || !rtdb) {
			chatRooms = [];
			return;
		}

		loadingRooms = true;

		try {
			const joinsRef = ref(rtdb, `chat-joins/${authStore.user.uid}`);
			const snapshot = await get(joinsRef);

			const rooms: Array<{ roomId: string; roomName: string }> = [];

			// 각 참여 채팅방에 대해 처리
			const promises = [];
			snapshot.forEach((child) => {
				const roomId = child.key;
				if (!roomId) return;

				// /chat-rooms/{roomId} 정보 조회
				const roomRef = ref(rtdb, `chat-rooms/${roomId}`);
				promises.push(
					get(roomRef).then((roomSnapshot) => {
						const roomData = roomSnapshot.val();
						// 타입이 "group" 또는 "open"인 채팅방만 추가
						if (roomData && (roomData.type === 'group' || roomData.type === 'open')) {
							rooms.push({
								roomId: roomId,
								roomName: roomData.name || '이름 없는 채팅방'
							});
						}
					})
				);
			});

			await Promise.all(promises);

			chatRooms = rooms;
		} catch (error) {
			console.error('채팅방 목록 로드 실패:', error);
			chatRooms = [];
		} finally {
			loadingRooms = false;
		}
	}

	// 다이얼로그가 열릴 때 채팅방 목록 로드
	$effect(() => {
		if (open) {
			loadChatRooms();
		}
	});

	/**
	 * 파일 선택 핸들러
	 */
	function handleFileSelect(event: Event) {
		const input = event.target as HTMLInputElement;
		const files = input.files;
		if (!files || files.length === 0) return;

		handleFiles(Array.from(files));

		// input 값 초기화 (같은 파일 다시 선택 가능하도록)
		input.value = '';
	}

	/**
	 * 파일 업로드 처리
	 */
	async function handleFiles(files: File[]) {
		if (!authStore.user?.uid) {
			saveError = '로그인이 필요합니다.';
			return;
		}

		for (const file of files) {
			// 파일 상태 객체 생성
			const fileStatus: FileUploadStatus = {
				file,
				progress: 0,
				downloadUrl: undefined,
				error: undefined,
				completed: false
			};

			uploadingFiles = [...uploadingFiles, fileStatus];
			const currentIndex = uploadingFiles.length - 1;

			// Firebase Storage에 즉시 업로드 시작
			try {
				const downloadUrl = await uploadChatFile(
					file,
					authStore.user.uid,
					'post', // roomId로 "post" 사용
					(progress) => {
						// 진행률 업데이트
						uploadingFiles[currentIndex].progress = progress;
					}
				);

				// 업로드 완료
				uploadingFiles[currentIndex].completed = true;
				uploadingFiles[currentIndex].downloadUrl = downloadUrl;
			} catch (error) {
				console.error('❌ 파일 업로드 실패:', error);
				uploadingFiles[currentIndex].error = '업로드 실패';
			}
		}
	}

	/**
	 * 파일 삭제 핸들러
	 */
	async function handleRemoveFile(index: number) {
		const fileStatus = uploadingFiles[index];

		// Firebase Storage에서 파일 삭제 (업로드 완료된 경우만)
		if (fileStatus.downloadUrl) {
			try {
				await deleteChatFile(fileStatus.downloadUrl);
			} catch (error) {
				console.error('파일 삭제 실패:', error);
			}
		}

		// 로컬 목록에서 제거
		uploadingFiles = uploadingFiles.filter((_, i) => i !== index);
	}

	/**
	 * 게시글 저장 핸들러
	 */
	async function handleSave() {
		if (isSaving) return;
		if (!postText.trim() && uploadingFiles.length === 0) {
			saveError = '내용을 입력하거나 사진을 첨부해주세요.';
			return;
		}
		if (!selectedCategory) {
			saveError = '카테고리를 선택해주세요.';
			return;
		}
		if (!authStore.user?.uid) {
			saveError = '로그인이 필요합니다.';
			return;
		}

		isSaving = true;
		saveError = null;

		try {
			// 업로드 완료되지 않은 파일 확인
			const incompleteFiles = uploadingFiles.filter((fs) => !fs.completed && !fs.error);
			if (incompleteFiles.length > 0) {
				saveError = `업로드 중인 파일이 ${incompleteFiles.length}개 있습니다. 업로드 완료 후 다시 시도해주세요.`;
				isSaving = false;
				return;
			}

			// 업로드 실패한 파일 확인
			const failedFiles = uploadingFiles.filter((fs) => fs.error);
			if (failedFiles.length > 0) {
				saveError = `업로드 실패한 파일이 ${failedFiles.length}개 있습니다. 삭제 후 다시 시도해주세요.`;
				isSaving = false;
				return;
			}

			// 파일 URL 수집
			let urls: Record<number, string> = {};
			uploadingFiles.forEach((fs, index) => {
				if (fs.downloadUrl) {
					urls[index] = fs.downloadUrl;
				}
			});

			// 메시지 payload 생성
			const timestamp = Date.now();
			const payload: Record<string, any> = {
				roomId: selectedRoomId,
				type: 'message',
				text: postText.trim(),
				urls,
				senderUid: authStore.user.uid,
				createdAt: timestamp,
				editedAt: null,
				deletedAt: null,
				category: selectedCategory,
				roomOrder: `-${selectedRoomId}-${timestamp}`,
				rootOrder: `-${selectedRoomId}-${timestamp}`
			};

			// /chat-messages에 메시지 저장
			const result = await pushData('chat-messages', payload);

			if (!result.success) {
				saveError = result.error ?? '저장에 실패했습니다.';
				isSaving = false;
				return;
			}

			// 성공 시 초기화 및 모달 닫기
			postText = '';
			uploadingFiles = [];
			selectedRoomId = 'post';
			isSaving = false;

			// 게시판 페이지에서 카테고리 자동 선택을 위한 콜백 호출
			// Cloud Functions가 categoryOrder, allCategoryOrder, type 필드를 생성할 시간을 주기 위해
			// 약간의 지연 후 카테고리 변경
			const createdCategory = selectedCategory as ForumCategory;

			// 카테고리 초기화 및 모달 닫기
			selectedCategory = '';
			open = false;

			// 500ms 지연 후 카테고리 자동 선택
			// 이렇게 하면 Cloud Functions가 파생 필드를 생성할 충분한 시간을 얻습니다
			if (onPostCreated) {
				setTimeout(() => {
					onPostCreated(createdCategory);
				}, 500);
			}
		} catch (error) {
			console.error('❌ 게시글 저장 실패:', error);
			saveError = '게시글 저장에 실패했습니다. 다시 시도해주세요.';
			isSaving = false;
		}
	}

	/**
	 * 취소 핸들러
	 */
	function handleCancel() {
		// 업로드된 파일 삭제
		uploadingFiles.forEach(async (fileStatus) => {
			if (fileStatus.downloadUrl) {
				try {
					await deleteChatFile(fileStatus.downloadUrl);
				} catch (error) {
					console.error('파일 삭제 실패:', error);
				}
			}
		});

		// 상태 초기화
		postText = '';
		selectedCategory = '';
		selectedRoomId = 'post';
		uploadingFiles = [];
		saveError = null;

		open = false;
	}
</script>

<Dialog bind:open>
	<DialogContent class="max-w-2xl">
		<DialogHeader>
			<DialogTitle>게시글 작성</DialogTitle>
		</DialogHeader>

		<div class="post-create-form">
			<!-- 카테고리 선택 -->
			<div class="form-group">
				<label for="category" class="form-label">카테고리 *</label>
				<select
					id="category"
					bind:value={selectedCategory}
					class="form-select"
				>
					<option value="">{m.chatCategorySelect()}</option>
					{#each FORUM_CATEGORIES as category}
						<option value={category}>{getCategoryMessage(category)}</option>
					{/each}
				</select>
			</div>

			<!-- 채팅방 선택 -->
			<div class="form-group">
				<label for="roomId" class="form-label">채팅방</label>
				<select
					id="roomId"
					bind:value={selectedRoomId}
					class="form-select"
				>
					<option value="post">기본</option>
					{#if loadingRooms}
						<option value="" disabled>로딩 중...</option>
					{:else}
						{#each chatRooms as room}
							<option value={room.roomId}>{room.roomName}</option>
						{/each}
					{/if}
				</select>
			</div>

			<!-- 글 내용 -->
			<div class="form-group">
				<label for="postText" class="form-label">내용</label>
				<textarea
					id="postText"
					bind:value={postText}
					placeholder="내용을 입력하세요"
					class="post-textarea"
					rows="6"
					onkeydown={(e) => e.stopPropagation()}
				></textarea>
			</div>

			<!-- 사진 업로드 -->
			<div class="form-group">
				<label class="form-label">사진</label>
				<input
					type="file"
					bind:this={fileInputRef}
					onchange={handleFileSelect}
					accept="image/*"
					multiple
					class="hidden"
				/>
				<Button type="button" variant="outline" onclick={() => fileInputRef?.click()}>
					사진 선택
				</Button>

				<!-- 업로드된 파일 목록 -->
				{#if uploadingFiles.length > 0}
					<div class="uploaded-files">
						{#each uploadingFiles as fileStatus, index}
							<div class="file-item">
								<div class="file-info">
									<div class="file-name">{fileStatus.file.name}</div>
									<div class="file-size">{formatFileSize(fileStatus.file.size)}</div>
									{#if !fileStatus.completed && !fileStatus.error}
										<div class="file-progress">
											<div class="progress-bar">
												<div class="progress-fill" style="width: {fileStatus.progress}%"></div>
											</div>
											<span class="progress-text">{Math.round(fileStatus.progress)}%</span>
										</div>
									{/if}
									{#if fileStatus.error}
										<div class="file-error">{fileStatus.error}</div>
									{/if}
								</div>
								<Button
									type="button"
									variant="ghost"
									size="sm"
									onclick={() => handleRemoveFile(index)}
								>
									삭제
								</Button>
							</div>
						{/each}
					</div>
				{/if}
			</div>

			<!-- 에러 메시지 -->
			{#if saveError}
				<div class="error-message">{saveError}</div>
			{/if}

			<!-- 액션 버튼 -->
			<div class="form-actions">
				<Button type="button" variant="outline" onclick={handleCancel} disabled={isSaving}>
					취소
				</Button>
				<Button type="button" onclick={handleSave} disabled={isSaving}>
					{isSaving ? '저장 중...' : '저장'}
				</Button>
			</div>
		</div>
	</DialogContent>
</Dialog>

<style>
	@import 'tailwindcss' reference;

	.post-create-form {
		@apply flex flex-col gap-4;
	}

	.form-group {
		@apply flex flex-col gap-2;
	}

	.form-label {
		@apply text-sm font-medium text-gray-700;
	}

	.form-select {
		@apply w-full rounded-md border border-gray-300 px-3 py-2 text-sm;
		@apply focus:border-blue-600 focus:outline-none focus:ring-1 focus:ring-blue-600;
	}

	.post-textarea {
		@apply w-full rounded-md border border-gray-300 px-3 py-2 text-sm;
		@apply focus:border-blue-600 focus:outline-none focus:ring-1 focus:ring-blue-600;
	}

	.uploaded-files {
		@apply mt-2 flex flex-col gap-2;
	}

	.file-item {
		@apply flex items-center justify-between rounded-md border border-gray-200 bg-gray-50 p-2;
	}

	.file-info {
		@apply flex flex-col gap-1;
	}

	.file-name {
		@apply text-sm font-medium text-gray-900;
	}

	.file-size {
		@apply text-xs text-gray-500;
	}

	.file-progress {
		@apply flex items-center gap-2;
	}

	.progress-bar {
		@apply h-2 w-32 overflow-hidden rounded-full bg-gray-200;
	}

	.progress-fill {
		@apply h-full bg-blue-600 transition-all;
	}

	.progress-text {
		@apply text-xs text-gray-600;
	}

	.file-error {
		@apply text-xs text-red-600;
	}

	.error-message {
		@apply rounded-md bg-red-50 p-3 text-sm text-red-600;
	}

	.form-actions {
		@apply flex justify-end gap-2;
	}
</style>
