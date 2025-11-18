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
 * 사용자의 여러 필드를 한 번에 가져옵니다. (범용 함수)
 *
 * ⚠️ 중요: RTDB 비용 최적화를 위해 지정된 필드만 개별적으로 읽습니다.
 * - /users/{uid} 전체를 읽지 않고 요청된 필드들만 읽습니다.
 * - Promise.all()을 사용하여 모든 필드를 병렬로 읽어서 성능 최적화
 * - 기존 getUserField() 함수를 재활용
 *
 * @param uid - 사용자 UID
 * @param fields - 읽어올 필드명 배열 (예: ['displayName', 'photoUrl'])
 * @returns 필드명을 키로 하고 필드 값을 값으로 하는 객체
 *
 * @example
 * ```typescript
 * // displayName과 photoUrl만 가져오기
 * const data = await getUserFields('uid123', ['displayName', 'photoUrl']);
 * console.log(data.displayName); // "홍길동"
 * console.log(data.photoUrl);    // "https://..."
 *
 * // displayName만 가져오기
 * const data2 = await getUserFields('uid456', ['displayName']);
 * console.log(data2.displayName); // "김철수"
 * ```
 */
export async function getUserFields(
	uid: string,
	fields: Array<'displayName' | 'photoUrl'>
): Promise<Record<string, string | null>> {
	if (!rtdb) {
		console.error('Firebase Realtime Database가 초기화되지 않았습니다.');
		return {};
	}

	if (!fields || fields.length === 0) {
		console.warn('읽어올 필드가 지정되지 않았습니다.');
		return {};
	}

	try {
		// ⚠️ Promise.all을 사용하여 기존 getUserField() 함수로 모든 필드를 병렬로 가져오기
		// 예: Promise.all([getUserField(uid, 'displayName'), getUserField(uid, 'photoUrl')])
		const values = await Promise.all(fields.map((field) => getUserField(uid, field)));

		// 필드명과 값을 매핑한 객체 생성
		const result: Record<string, string | null> = {};
		fields.forEach((field, index) => {
			result[field] = values[index];
		});

		return result;
	} catch (error) {
		console.error(`사용자 필드들 읽기 실패 (uid: ${uid}, fields: ${fields.join(', ')}):`, error);
		return {};
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
