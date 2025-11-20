<!--
  게시글 작성 다이얼로그 컴포넌트

  MessageEditModal.svelte를 사용하여 게시글 작성 기능을 제공합니다.
  - 글 내용 입력
  - 사진 업로드
  - 카테고리 선택
  - /posts/{postId}에 게시글로 저장 (category는 필드로 저장)
-->

<script lang="ts">
	import MessageEditModal from '$lib/components/MessageEditModal.svelte';
	import { FORUM_CATEGORIES, type ForumCategory } from '../../../../shared/categories';
	import * as m from '$lib/paraglide/messages.js';
	import { authStore } from '$lib/stores/auth.svelte';
	import { pushData } from '$lib/stores/database.svelte';

	// Props
	interface Props {
		open: boolean;
		/**
		 * 게시글 작성 후 선택할 카테고리 콜백
		 * 게시판 페이지에서 사용하여 저장 후 해당 카테고리로 자동 이동
		 */
		onPostCreated?: (category: ForumCategory) => void;
		/**
		 * 기본 선택될 카테고리
		 * - null 또는 undefined인 경우: 'story' 카테고리를 기본 선택
		 * - 특정 카테고리 지정 시: 해당 카테고리를 기본 선택
		 */
		defaultCategory?: ForumCategory | null;
	}

	let { open = $bindable(), onPostCreated, defaultCategory = null }: Props = $props();

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
			hobby: m.chatCategoryHobby,
			story: m.chatCategoryStory
		};
		return categoryMap[category]();
	};

	// 상태
	let selectedCategory = $state<string>('');

	// 다이얼로그가 열릴 때 기본 카테고리 설정
	$effect(() => {
		if (open) {
			// 기본 카테고리 설정
			// defaultCategory가 지정되어 있으면 해당 카테고리 사용, 없으면 'story' 사용
			selectedCategory = defaultCategory ?? 'story';
		}
	});

	/**
	 * 저장 핸들러: Firebase RTDB에 게시글 저장
	 */
	async function handleSave(
		text: string,
	urls: Record<number, string>
): Promise<{ success: boolean; error?: string }> {
	// 유효성 검사
	if (!text.trim() && Object.keys(urls).length === 0) {
		return { success: false, error: m.postContentOrAttachmentRequired() };
	}
	if (!selectedCategory) {
		return { success: false, error: m.postCategoryRequired() };
	}
	if (!authStore.user?.uid) {
		return { success: false, error: m.authLoginRequired() };
	}

		try {
			/**
			 * 게시글 저장 payload
			 *
			 * ⚠️ 중요: 게시글은 /posts/{postId}에 직접 저장됩니다.
			 * 저장 후:
			 * 1. Cloud Functions의 onCreate 트리거가 /posts/{postId} 생성을 감지
			 * 2. handlePostCreateFanout() 호출하여 팔로워 피드에 fan-out
			 * 3. 팔로워들의 /user-feed/{followerUid}/{postId} 업데이트
				 *
			 * 클라이언트에서 제공하는 필드:
			 * - text, urls, authorUid, createdAt, category
			 */
			const timestamp = Date.now();
			const payload: Record<string, any> = {
				text: text.trim(),
				urls,
				authorUid: authStore.user.uid,
				createdAt: timestamp,
				category: selectedCategory
			};

	// /posts/{postId}에 게시글 직접 저장
	// Cloud Functions가 자동으로 피드 fan-out 처리
	const result = await pushData('posts', payload);

	if (!result.success) {
		return { success: false, error: result.error ?? m.postSaveFailed() };
	}

			// 성공 시 상태 초기화
			const createdCategory = selectedCategory as ForumCategory;
			selectedCategory = '';

			// 게시판 페이지에서 카테고리 자동 선택을 위한 콜백 호출
	if (onPostCreated) {
		onPostCreated(createdCategory);
	}

	return { success: true };
} catch (error) {
	console.error('❌ 게시글 저장 실패:', error);
	return { success: false, error: m.postSaveRetry() };
}
	}

	/**
	 * 취소 핸들러
	 */
	function handleCancel() {
		// 상태 초기화
		selectedCategory = '';
		// 모달 닫기
		open = false;
	}
</script>

<MessageEditModal
	bind:open
	title={m.postCreateTitle()}
	textLabel=""
	roomId="post"
	saveButtonText={m.commonSave()}
	cancelButtonText={m.commonCancel()}
	textPlaceholder={m.postTextPlaceholder()}
	onSave={handleSave}
	onCancel={handleCancel}
	hasAdditionalFields={true}
>
	<!-- 추가 필드: 카테고리 선택 -->
	<div class="additional-fields">
		<!-- 카테고리 선택 -->
		<select id="category" bind:value={selectedCategory} class="form-select">
			<option value="">{m.postCategorySelectPlaceholder()}</option>
			{#each FORUM_CATEGORIES as category}
				<option value={category}>{getCategoryMessage(category)}</option>
			{/each}
		</select>
	</div>
</MessageEditModal>

<style>
	@import 'tailwindcss' reference;

	/* 카테고리 선택 필드 */
	.additional-fields {
		@apply flex gap-3;
	}

	/* select 박스 스타일 (border 제거, background 연하게) */
	.form-select {
		@apply flex-1 rounded-lg bg-gray-50 px-3 py-2 text-sm text-gray-700;
		@apply transition-colors hover:bg-gray-100;
		@apply focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20;
		border: none;
	}
</style>
