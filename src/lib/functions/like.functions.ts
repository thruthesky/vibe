/**
 * 좋아요 관련 클라이언트 유틸리티
 *
 * - `/likes/{uid}/{targetId}` 경로에 `message` 또는 `comment` 문자열만 저장
 * - Cloud Functions가 해당 값을 기반으로 likeCount를 증감
 */

import { rtdb } from '$lib/firebase';
import { get, ref, remove, set } from 'firebase/database';

/**
 * 좋아요 대상 타입
 */
export type LikeTargetType = 'message' | 'comment';

/**
 * 좋아요 토글 옵션
 */
interface ToggleLikeOptions {
	uid?: string | null;
	targetId: string;
	targetType: LikeTargetType;
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
 */
export async function toggleLikeTarget(options: ToggleLikeOptions): Promise<ToggleLikeResult> {
	const { uid, targetId, targetType } = options;

	if (!uid) {
		return { success: false, error: '로그인이 필요합니다.' };
	}

	if (!targetId || (targetType !== 'message' && targetType !== 'comment')) {
		return { success: false, error: '잘못된 좋아요 요청입니다.' };
	}

	if (!rtdb) {
		return { success: false, error: 'Firebase Realtime Database가 초기화되지 않았습니다.' };
	}

	try {
		const likeRef = ref(rtdb, `likes/${uid}/${targetId}`);
		const snapshot = await get(likeRef);

		if (snapshot.exists()) {
			await remove(likeRef);
			return { success: true, liked: false };
		}

		await set(likeRef, targetType);
		return { success: true, liked: true };
	} catch (error) {
		console.error('좋아요 토글 실패:', error);
		return {
			success: false,
			error: error instanceof Error ? error.message : '좋아요 처리 중 오류가 발생했습니다.'
		};
	}
}

/**
 * 특정 대상(메시지 또는 댓글)에 좋아요한 사용자 UID 목록을 로드합니다.
 *
 * - 메시지: `/chat-message-likes/{messageId}` 경로에서 로드
 * - 댓글: 현재는 메시지와 동일한 방식 (향후 확장 가능)
 * - Fallback: 데이터가 없으면 `/likes` 경로를 역으로 조회 (기존 데이터 호환)
 *
 * @param targetId - 대상 ID (메시지 ID 또는 댓글 ID)
 * @param targetType - 대상 타입 ('message' 또는 'comment')
 * @returns 좋아요한 사용자 UID 배열
 */
export async function fetchLikedByUsers(
	targetId: string,
	targetType: LikeTargetType
): Promise<string[]> {
	if (!rtdb) {
		console.error('Firebase Realtime Database가 초기화되지 않았습니다.');
		return [];
	}

	try {
		// 메시지 좋아요: chat-message-likes 경로에서 로드
		if (targetType === 'message') {
			const likesRef = ref(rtdb, `chat-message-likes/${targetId}`);
			const snapshot = await get(likesRef);
			const data = snapshot.val() || {};
			let uids = Object.keys(data);

			// Fallback: chat-message-likes에 데이터가 없으면 /likes 경로를 역으로 조회
			if (uids.length === 0) {
				const allLikesRef = ref(rtdb, 'likes');
				const allLikesSnapshot = await get(allLikesRef);
				const allLikesData = allLikesSnapshot.val() || {};

				// 각 사용자의 좋아요 목록에서 현재 메시지를 좋아요한 사용자 찾기
				uids = Object.keys(allLikesData).filter((uid) => {
					const userLikes = allLikesData[uid] || {};
					return userLikes[targetId] === 'message';
				});
			}

			return uids;
		}

		// 댓글 좋아요: chat-comment-likes 경로에서 로드
		if (targetType === 'comment') {
			const likesRef = ref(rtdb, `chat-comment-likes/${targetId}`);
			const snapshot = await get(likesRef);
			const data = snapshot.val() || {};
			let uids = Object.keys(data);

			// Fallback: chat-comment-likes에 데이터가 없으면 /likes 경로를 역으로 조회
			if (uids.length === 0) {
				const allLikesRef = ref(rtdb, 'likes');
				const allLikesSnapshot = await get(allLikesRef);
				const allLikesData = allLikesSnapshot.val() || {};

				// 각 사용자의 좋아요 목록에서 현재 댓글을 좋아요한 사용자 찾기
				uids = Object.keys(allLikesData).filter((uid) => {
					const userLikes = allLikesData[uid] || {};
					return userLikes[targetId] === 'comment';
				});
			}

			return uids;
		}

		// 기타 타입: 빈 배열 반환
		return [];
	} catch (error) {
		console.error('좋아요 사용자 로드 실패:', error);
		return [];
	}
}
