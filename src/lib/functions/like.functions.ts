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
