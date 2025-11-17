/**
 * 사용자 정보 관련 유틸리티 함수
 *
 * ⚠️ RTDB 비용 최적화: 필요한 필드만 선택적으로 읽기
 * - 전체 사용자 노드를 읽지 않고 특정 필드만 읽어옵니다.
 * - 예: /users/{uid} 전체가 아닌 /users/{uid}/displayName만 읽기
 * - 이를 통해 RTDB 읽기 비용을 크게 절감할 수 있습니다.
 */

import { ref, get } from 'firebase/database';
import { rtdb } from '$lib/firebase';

/**
 * 사용자의 특정 필드 하나만 읽어옵니다.
 *
 * ⚠️ 중요: 전체 사용자 노드가 아닌 특정 필드만 읽어서 RTDB 비용 절감
 *
 * @param uid - 사용자 UID
 * @param field - 읽어올 필드명 ('displayName' | 'photoUrl')
 * @returns 필드 값 또는 null
 *
 * @example
 * ```typescript
 * const displayName = await getUserField('uid123', 'displayName');
 * const photoUrl = await getUserField('uid123', 'photoUrl');
 * ```
 */
export async function getUserField(
	uid: string,
	field: 'displayName' | 'photoUrl'
): Promise<string | null> {
	if (!rtdb) {
		console.error('Firebase Realtime Database가 초기화되지 않았습니다.');
		return null;
	}

	try {
		// ⚠️ /users/{uid} 전체가 아닌 /users/{uid}/{field}만 읽기
		const snapshot = await get(ref(rtdb, `users/${uid}/${field}`));
		return snapshot.val();
	} catch (error) {
		console.error(`사용자 필드 읽기 실패 (uid: ${uid}, field: ${field}):`, error);
		return null;
	}
}

/**
 * 사용자의 기본 정보 (이름, 사진)만 가져옵니다.
 *
 * ⚠️ 중요: 각 필드를 개별적으로 읽어서 RTDB 비용 최소화
 * - /users/{uid} 전체를 읽지 않고 displayName, photoUrl 필드만 읽습니다.
 * - 두 필드를 병렬로 읽어서 성능 최적화
 *
 * @param uid - 사용자 UID
 * @returns 사용자 기본 정보 객체 { displayName, photoUrl }
 *
 * @example
 * ```typescript
 * const userInfo = await getUserBasicInfo('uid123');
 * console.log(userInfo.displayName); // "홍길동"
 * console.log(userInfo.photoUrl);    // "https://..."
 * ```
 */
export async function getUserBasicInfo(
	uid: string
): Promise<{ displayName: string | null; photoUrl: string | null }> {
	if (!rtdb) {
		console.error('Firebase Realtime Database가 초기화되지 않았습니다.');
		return { displayName: null, photoUrl: null };
	}

	try {
		// ⚠️ 두 필드를 병렬로 읽어서 성능 최적화 (전체 노드 읽기 X)
		const [displayName, photoUrl] = await Promise.all([
			get(ref(rtdb, `users/${uid}/displayName`)).then((s) => s.val()),
			get(ref(rtdb, `users/${uid}/photoUrl`)).then((s) => s.val())
		]);

		return { displayName, photoUrl };
	} catch (error) {
		console.error(`사용자 기본 정보 읽기 실패 (uid: ${uid}):`, error);
		return { displayName: null, photoUrl: null };
	}
}
