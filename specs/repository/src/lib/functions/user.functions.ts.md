/**
 * 사용자 정보 관련 유틸리티 함수
 *
 * ⚠️ RTDB 비용 최적화: 필요한 필드만 선택적으로 읽기
 * - 전체 사용자 노드를 읽지 않고 특정 필드만 읽어옵니다.
 * - 예: /users/{uid} 전체가 아닌 /users/{uid}/displayName만 읽기
 * - 이를 통해 RTDB 읽기 비용을 크게 절감할 수 있습니다.
 */

import { ref, get, query, orderByValue, limitToFirst } from 'firebase/database';
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

/**
 * 사용자의 특정 action 카운터 하나만 읽어옵니다.
 *
 * ⚠️ 중요: 전체 user-action-counters 노드가 아닌 특정 카운터만 읽어서 RTDB 비용 절감
 *
 * @param uid - 사용자 UID
 * @param counterType - 카운터 타입 ('like' | 'comment' | 'post' | 'chat' | 'follow')
 * @returns 카운터 값 (숫자) 또는 0 (존재하지 않을 경우)
 *
 * @example
 * ```typescript
 * const postCount = await getUserActionCounter('uid123', 'post');
 * const commentCount = await getUserActionCounter('uid123', 'comment');
 * ```
 */
export async function getUserActionCounter(
	uid: string,
	counterType: 'like' | 'comment' | 'post' | 'chat' | 'follow'
): Promise<number> {
	if (!rtdb) {
		console.error('Firebase Realtime Database가 초기화되지 않았습니다.');
		return 0;
	}

	try {
		// ⚠️ /user-action-counters/{uid} 전체가 아닌 /user-action-counters/{uid}/{counterType}만 읽기
		const snapshot = await get(ref(rtdb, `user-action-counters/${uid}/${counterType}`));
		return snapshot.val() ?? 0;
	} catch (error) {
		console.error(`사용자 action 카운터 읽기 실패 (uid: ${uid}, type: ${counterType}):`, error);
		return 0;
	}
}

/**
 * 사용자의 여러 action 카운터를 한 번에 가져옵니다. (범용 함수)
 *
 * ⚠️ 중요: RTDB 비용 최적화를 위해 지정된 카운터만 개별적으로 읽습니다.
 * - /user-action-counters/{uid} 전체를 읽지 않고 요청된 카운터들만 읽습니다.
 * - Promise.all()을 사용하여 모든 카운터를 병렬로 읽어서 성능 최적화
 * - 기존 getUserActionCounter() 함수를 재활용
 *
 * @param uid - 사용자 UID
 * @param counterTypes - 읽어올 카운터 타입 배열 (예: ['post', 'comment'])
 * @returns 카운터 타입을 키로 하고 카운터 값을 값으로 하는 객체
 *
 * @example
 * ```typescript
 * // 게시글 수와 댓글 수만 가져오기
 * const counters = await getUserActionCounters('uid123', ['post', 'comment']);
 * console.log(counters.post);    // 15
 * console.log(counters.comment); // 42
 *
 * // 모든 카운터 가져오기
 * const allCounters = await getUserActionCounters('uid456', ['like', 'comment', 'post', 'chat', 'follow']);
 * ```
 */
export async function getUserActionCounters(
	uid: string,
	counterTypes: Array<'like' | 'comment' | 'post' | 'chat' | 'follow'>
): Promise<Record<string, number>> {
	if (!rtdb) {
		console.error('Firebase Realtime Database가 초기화되지 않았습니다.');
		return {};
	}

	if (!counterTypes || counterTypes.length === 0) {
		console.warn('읽어올 카운터가 지정되지 않았습니다.');
		return {};
	}

	try {
		// ⚠️ Promise.all을 사용하여 기존 getUserActionCounter() 함수로 모든 카운터를 병렬로 가져오기
		const values = await Promise.all(counterTypes.map((type) => getUserActionCounter(uid, type)));

		// 카운터 타입과 값을 매핑한 객체 생성
		const result: Record<string, number> = {};
		counterTypes.forEach((type, index) => {
			result[type] = values[index];
		});

		return result;
	} catch (error) {
		console.error(`사용자 action 카운터들 읽기 실패 (uid: ${uid}, types: ${counterTypes.join(', ')}):`, error);
		return {};
	}
}

/**
 * 인플루언서 순위 데이터 타입
 */
export interface InfluencerRanking {
	uid: string;
	score: number;
}

/**
 * 현재 UTC 날짜를 지정된 형식으로 반환합니다.
 *
 * @param format - 날짜 형식 ('yyyyMMdd' | 'yyyyMM' | 'yyyy')
 * @returns 형식화된 날짜 문자열
 *
 * @example
 * ```typescript
 * getCurrentDate('yyyyMMdd'); // '20250119'
 * getCurrentDate('yyyyMM');   // '202501'
 * getCurrentDate('yyyy');     // '2025'
 * ```
 */
export function getCurrentDate(format: 'yyyyMMdd' | 'yyyyMM' | 'yyyy'): string {
	const now = new Date();
	const year = now.getUTCFullYear();
	const month = String(now.getUTCMonth() + 1).padStart(2, '0');
	const day = String(now.getUTCDate()).padStart(2, '0');

	switch (format) {
		case 'yyyyMMdd':
			return `${year}${month}${day}`;
		case 'yyyyMM':
			return `${year}${month}`;
		case 'yyyy':
			return `${year}`;
		default:
			return `${year}${month}${day}`;
	}
}

/**
 * 특정 기간의 Top N 인플루언서를 가져옵니다.
 *
 * ⚠️ 중요: RTDB 비용 최적화
 * - limitToFirst()를 사용하여 필요한 개수만 가져옵니다.
 * - orderByValue()로 정렬된 데이터를 효율적으로 조회합니다.
 * - 점수는 음수로 저장되어 있어서 오름차순 정렬 = 실제 내림차순 정렬
 *
 * @param period - 조회 기간 ('daily' | 'monthly' | 'yearly' | 'total')
 * @param date - 날짜 (daily: 'yyyyMMdd', monthly: 'yyyyMM', yearly: 'yyyy', total일 때는 불필요)
 * @param limit - 가져올 인플루언서 수 (기본값: 100)
 * @returns 인플루언서 목록 (uid와 score 포함)
 *
 * @example
 * ```typescript
 * // 오늘의 Top 5 인플루언서
 * const dailyTop5 = await getTopInfluencers('daily', getCurrentDate('yyyyMMdd'), 5);
 *
 * // 이번 달의 Top 100 인플루언서
 * const monthlyTop100 = await getTopInfluencers('monthly', getCurrentDate('yyyyMM'), 100);
 *
 * // 전체 기간 Top 5 인플루언서
 * const totalTop5 = await getTopInfluencers('total', undefined, 5);
 * ```
 */
export async function getTopInfluencers(
	period: 'daily' | 'monthly' | 'yearly' | 'total',
	date?: string,
	limit: number = 100
): Promise<InfluencerRanking[]> {
	if (!rtdb) {
		console.error('Firebase Realtime Database가 초기화되지 않았습니다.');
		return [];
	}

	try {
		// ⚠️ RTDB 경로 구성
		let path = 'influencer-rankings';
		if (period === 'total') {
			path += '/total';
		} else {
			if (!date) {
				console.error(`${period} 기간 조회 시 날짜가 필요합니다.`);
				return [];
			}
			path += `/${period}/${date}`;
		}

		// ⚠️ 점수를 기준으로 정렬하여 상위 N명만 가져오기
		// 점수는 음수로 저장되어 있으므로 orderByValue() + limitToFirst()로 상위 N명 조회
		const rankingQuery = query(ref(rtdb, path), orderByValue(), limitToFirst(limit));
		const snapshot = await get(rankingQuery);

		if (!snapshot.exists()) {
			console.warn(`인플루언서 순위 데이터가 없습니다 (기간: ${period}, 날짜: ${date})`);
			return [];
		}

		// ⚠️ 데이터 변환: { uid: -score } → [{ uid, score }]
		const rankings: InfluencerRanking[] = [];
		snapshot.forEach((child) => {
			const uid = child.key as string;
			const negativeScore = child.val() as number;
			// 음수로 저장된 점수를 다시 양수로 변환
			const score = -negativeScore;
			rankings.push({ uid, score });
		});

		return rankings;
	} catch (error) {
		console.error(
			`인플루언서 순위 조회 실패 (기간: ${period}, 날짜: ${date}, limit: ${limit}):`,
			error
		);
		return [];
	}
}

/**
 * 특정 사용자의 인플루언서 점수를 가져옵니다.
 *
 * ⚠️ 중요: 전체 노드가 아닌 특정 사용자의 점수만 읽어서 RTDB 비용 절감
 *
 * @param uid - 사용자 UID
 * @returns 인플루언서 점수 (0 이상, 점수가 없으면 0)
 *
 * @example
 * ```typescript
 * const score = await getInfluencerScore('uid123');
 * console.log(score); // 42
 * ```
 */
export async function getInfluencerScore(uid: string): Promise<number> {
	if (!rtdb) {
		console.error('Firebase Realtime Database가 초기화되지 않았습니다.');
		return 0;
	}

	try {
		// ⚠️ /influencer-scores/{uid}만 읽기
		const snapshot = await get(ref(rtdb, `influencer-scores/${uid}`));
		return snapshot.val() ?? 0;
	} catch (error) {
		console.error(`인플루언서 점수 읽기 실패 (uid: ${uid}):`, error);
		return 0;
	}
}
