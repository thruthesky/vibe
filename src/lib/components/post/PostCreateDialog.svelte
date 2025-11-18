<!--
  게시글 작성 다이얼로그 컴포넌트

  MessageEditModal.svelte를 사용하여 채팅 메시지와 통합된 게시글 작성 기능을 제공합니다.
  - 글 내용 입력
  - 사진 업로드
  - 카테고리 선택
  - 그룹/오픈 채팅방 선택
  - /chat-messages에 메시지로 저장
-->

<script lang="ts">
	import MessageEditModal from '$lib/components/MessageEditModal.svelte';
	import { FORUM_CATEGORIES, type ForumCategory } from '../../../../shared/categories';
	import * as m from '$lib/paraglide/messages.js';
	import { authStore } from '$lib/stores/auth.svelte';
	import { pushData } from '$lib/stores/database.svelte';
	import { rtdb } from '$lib/firebase';
	import { ref, get } from 'firebase/database';

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
	let selectedRoomId = $state<string>('post'); // 기본값: "post"

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
			const promises: Promise<void>[] = [];
			snapshot.forEach((child) => {
				const roomId = child.key;
				if (!roomId) return;

				// /chat-rooms/{roomId} 정보 조회
				// rtdb는 이미 64번 라인에서 null 체크 완료
				const roomRef = ref(rtdb!, `chat-rooms/${roomId}`);
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

	// 다이얼로그가 열릴 때 채팅방 목록 로드 및 기본 카테고리 설정
	$effect(() => {
		if (open) {
			loadChatRooms();

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
			return { success: false, error: '내용을 입력하거나 사진을 첨부해주세요.' };
		}
		if (!selectedCategory) {
			return { success: false, error: '카테고리를 선택해주세요.' };
		}
		if (!authStore.user?.uid) {
			return { success: false, error: '로그인이 필요합니다.' };
		}

		try {
			/**
			 * 게시글 저장 payload (최소 필드만 포함)
			 *
			 * 클라이언트에서 제공하는 필드:
			 * - roomId, text, urls, senderUid, createdAt, category
			 * - roomOrder, rootOrder (클라이언트에서 생성)
			 *
			 * Cloud Functions에서 자동 생성되는 필드 (category가 있을 때):
			 * - categoryOrder: "{category}-{timestamp}"
			 * - allCategoryOrder: timestamp
			 * - type: "post"
			 *
			 * 생략된 선택적 필드:
			 * - type: Cloud Functions가 자동으로 "post"로 설정
			 * - editedAt, deletedAt: 선택적 필드로 생략 가능
			 */
			const timestamp = Date.now();
			const payload: Record<string, any> = {
				roomId: selectedRoomId,
				text: text.trim(),
				urls,
				senderUid: authStore.user.uid,
				createdAt: timestamp,
				category: selectedCategory,
				roomOrder: `-${selectedRoomId}-${timestamp}`,
				rootOrder: `-${selectedRoomId}-${timestamp}`
			};

			// /chat-messages에 메시지 저장
			const result = await pushData('chat-messages', payload);

			if (!result.success) {
				return { success: false, error: result.error ?? '저장에 실패했습니다.' };
			}

			// 성공 시 상태 초기화
			const createdCategory = selectedCategory as ForumCategory;
			selectedCategory = '';
			selectedRoomId = 'post';

			// 게시판 페이지에서 카테고리 자동 선택을 위한 콜백 호출
			// Cloud Functions가 categoryOrder, allCategoryOrder, type 필드를 생성할 시간을 주기 위해
			// 약간의 지연 후 카테고리 변경
			if (onPostCreated) {
				setTimeout(() => {
					onPostCreated(createdCategory);
				}, 500);
			}

			return { success: true };
		} catch (error) {
			console.error('❌ 게시글 저장 실패:', error);
			return { success: false, error: '게시글 저장에 실패했습니다. 다시 시도해주세요.' };
		}
	}

	/**
	 * 취소 핸들러
	 */
	function handleCancel() {
		// 상태 초기화
		selectedCategory = '';
		selectedRoomId = 'post';
		// 모달 닫기
		open = false;
	}
</script>

<MessageEditModal
	bind:open
	title="게시글 작성"
	textLabel=""
	roomId={selectedRoomId}
	saveButtonText="저장"
	cancelButtonText="취소"
	textPlaceholder="내용을 입력하세요"
	onSave={handleSave}
	onCancel={handleCancel}
	hasAdditionalFields={true}
>
	<!-- 추가 필드: 카테고리 및 채팅방 선택 -->
	<div class="additional-fields">
		<!-- 카테고리 선택 -->
		<select id="category" bind:value={selectedCategory} class="form-select">
			<option value="">카테고리 선택</option>
			{#each FORUM_CATEGORIES as category}
				<option value={category}>{getCategoryMessage(category)}</option>
			{/each}
		</select>

		<!-- 채팅방 선택 -->
		<select id="roomId" bind:value={selectedRoomId} class="form-select">
			<option value="post">채팅방 선택</option>
			{#if loadingRooms}
				<option value="" disabled>로딩 중...</option>
			{:else}
				{#each chatRooms as room}
					<option value={room.roomId}>{room.roomName}</option>
				{/each}
			{/if}
		</select>
	</div>
</MessageEditModal>

<style>
	@import 'tailwindcss' reference;

	/* 카테고리 + 채팅방 선택을 가로로 나란히 배치 */
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
