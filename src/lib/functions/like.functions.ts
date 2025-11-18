/**
 * 좋아요 관련 클라이언트 유틸리티
 *
 * - `/likes/{uid}/{targetId}` 경로에 `message`, `comment`, 또는 `post` 문자열만 저장
 * - Cloud Functions가 해당 값을 기반으로 likeCount를 증감
 */

import { rtdb } from '$lib/firebase';
import { get, ref, remove, set } from 'firebase/database';

/**
 * 좋아요 대상 타입
 * - message: 채팅 메시지
 * - comment: 댓글
 * - post: 게시글
 */
export type LikeTargetType = 'message' | 'comment' | 'post';

/**
 * 좋아요 토글 옵션
 */
interface ToggleLikeOptions {
	uid?: string | null;
	targetId: string;
	targetType: LikeTargetType;
	/** 채팅 메시지의 경우 roomId를 전달하여 "chat-message-{roomId}" 형식으로 저장 */
	roomId?: string;
}

/**
 * 좋아요 토글 결과
 */
export interface ToggleLikeResult {
	success: boolean;
	liked?: boolean;
	error?: string;
}

/**
 * 현재 사용자의 좋아요 상태를 토글합니다.
 *
 * - 값이 없으면 targetType 문자열을 저장 (좋아요 추가)
 * - 값이 있으면 노드를 삭제 (좋아요 취소)
 * - 채팅 메시지의 경우 roomId를 전달하면 "chat-message-{roomId}" 형식으로 저장
 */
export async function toggleLikeTarget(options: ToggleLikeOptions): Promise<ToggleLikeResult> {
	const { uid, targetId, targetType, roomId } = options;

	console.log('👍 [toggleLikeTarget] 시작', {
		uid,
		targetId,
		targetType,
		roomId,
		path: `likes/${uid}/${targetId}`
	});

	if (!uid) {
		console.error('❌ [toggleLikeTarget] 로그인 필요');
		return { success: false, error: '로그인이 필요합니다.' };
	}

	if (
		!targetId ||
		(targetType !== 'message' && targetType !== 'comment' && targetType !== 'post')
	) {
		console.error('❌ [toggleLikeTarget] 잘못된 요청', { targetId, targetType });
		return { success: false, error: '잘못된 좋아요 요청입니다.' };
	}

	if (!rtdb) {
		console.error('❌ [toggleLikeTarget] RTDB 초기화 안됨');
		return { success: false, error: 'Firebase Realtime Database가 초기화되지 않았습니다.' };
	}

	try {
		const likeRef = ref(rtdb, `likes/${uid}/${targetId}`);
		const snapshot = await get(likeRef);

		if (snapshot.exists()) {
			console.log('🗑️ [toggleLikeTarget] 좋아요 취소 (기존 값 존재):', {
				path: `likes/${uid}/${targetId}`,
				existingValue: snapshot.val()
			});
			await remove(likeRef);
			console.log('✅ [toggleLikeTarget] 좋아요 취소 완료');
			return { success: true, liked: false };
		}

		// 채팅 메시지의 경우 roomId 정보를 포함하여 저장
		// 형식: "chat-message-{roomId}"
		// 이를 통해 Cloud Functions에서 바로 roomId를 파싱하여 사용 가능
		const valueToStore = targetType === 'message' && roomId
			? `chat-message-${roomId}`
			: targetType;

		console.log('💾 [toggleLikeTarget] 좋아요 추가 (새로운 값 저장):', {
			path: `likes/${uid}/${targetId}`,
			valueToStore,
			targetType,
			roomId
		});

		await set(likeRef, valueToStore);
		console.log('✅ [toggleLikeTarget] 좋아요 추가 완료');
		return { success: true, liked: true };
	} catch (error) {
		console.error('❌ [toggleLikeTarget] 좋아요 토글 실패:', {
			uid,
			targetId,
			targetType,
			roomId,
			error: error instanceof Error ? error.message : error,
			errorStack: error instanceof Error ? error.stack : undefined
		});
		return {
			success: false,
			error: error instanceof Error ? error.message : '좋아요 처리 중 오류가 발생했습니다.'
		};
	}
}

/**
 * 특정 대상(메시지, 댓글, 게시글)에 좋아요한 사용자 UID 목록을 로드합니다.
 *
 * - 통합 경로: `/likes-by/{targetId}` 경로에서 로드
 * - 메시지, 댓글, 게시글 모두 동일한 구조 사용
 * - Cloud Functions가 자동으로 `/likes-by` 경로를 관리
 *
 * @param targetId - 대상 ID (메시지 ID, 댓글 ID, 또는 게시글 ID)
 * @param targetType - 대상 타입 ('message', 'comment', 또는 'post')
 * @returns 좋아요한 사용자 UID 배열
 */
export async function fetchLikedByUsers(
	targetId: string,
	targetType: LikeTargetType
): Promise<string[]> {
	console.log('🔍 [fetchLikedByUsers] 시작', {
		targetId,
		targetType,
		path: `likes-by/${targetId}`
	});

	if (!rtdb) {
		console.error('❌ Firebase Realtime Database가 초기화되지 않았습니다.');
		return [];
	}

	try {
		// 통합 경로: /likes-by/{targetId}에서 로드
		const likesRef = ref(rtdb, `likes-by/${targetId}`);
		console.log('📖 [fetchLikedByUsers] RTDB 읽기 시도:', `likes-by/${targetId}`);

		const snapshot = await get(likesRef);
		console.log('✅ [fetchLikedByUsers] RTDB 읽기 성공:', {
			exists: snapshot.exists(),
			value: snapshot.val()
		});

		const data = snapshot.val() || {};
		const uids = Object.keys(data);

		console.log('✅ [fetchLikedByUsers] 완료:', {
			targetId,
			uidsCount: uids.length,
			uids
		});

		return uids;
	} catch (error) {
		console.error('❌ [fetchLikedByUsers] 좋아요 사용자 목록 가져오기 실패:', {
			targetId,
			targetType,
			path: `likes-by/${targetId}`,
			error: error instanceof Error ? error.message : error,
			errorStack: error instanceof Error ? error.stack : undefined
		});
		return [];
	}
}
