/**
 * 게시글 관련 유틸리티 함수
 *
 * ⚠️ RTDB 비용 최적화: 필요한 필드만 선택적으로 읽기
 * - 전체 게시글 노드를 읽지 않고 특정 필드만 읽어옵니다.
 */

import { ref, get, query, orderByValue, limitToFirst } from 'firebase/database';
import { rtdb } from '$lib/firebase';

/**
 * 날짜 형식 변환 함수
 *
 * @param date - Date 객체
 * @param period - 기간 타입 (daily, weekly, monthly)
 * @returns 형식화된 날짜 문자열
 *
 * 형식:
 * - daily: yyyyMMdd (예: 20251119)
 * - weekly: yyyyWww (예: 2025W47) - ISO week 기준
 * - monthly: yyyyMM (예: 202511)
 */
export function formatDate(date: Date, period: 'daily' | 'weekly' | 'monthly'): string {
	const year = date.getFullYear();
	const month = String(date.getMonth() + 1).padStart(2, '0');
	const day = String(date.getDate()).padStart(2, '0');

	if (period === 'daily') {
		return `${year}${month}${day}`;
	} else if (period === 'weekly') {
		// ISO week 계산
		const week = getISOWeek(date);
		return `${year}W${String(week).padStart(2, '0')}`;
	} else {
		// monthly
		return `${year}${month}`;
	}
}

/**
 * ISO week 번호 계산
 *
 * @param date - Date 객체
 * @returns ISO week 번호 (1-53)
 *
 * ISO 8601 기준:
 * - 주의 시작은 월요일
 * - 1월 4일이 포함된 주가 1주차
 */
function getISOWeek(date: Date): number {
	const target = new Date(date.valueOf());
	const dayNr = (date.getDay() + 6) % 7; // 월요일 = 0
	target.setDate(target.getDate() - dayNr + 3);
	const firstThursday = target.valueOf();
	target.setMonth(0, 1);
	if (target.getDay() !== 4) {
		target.setMonth(0, 1 + ((4 - target.getDay() + 7) % 7));
	}
	return 1 + Math.ceil((firstThursday - target.valueOf()) / 604800000);
}

/**
 * 인기 게시글 순위 데이터 가져오기
 *
 * @param period - 기간 타입 ('daily' | 'weekly' | 'monthly')
 * @param limit - 가져올 게시글 수 (기본값: 100)
 * @returns 게시글 ID와 점수 배열
 *
 * @example
 * ```typescript
 * // 일별 상위 100개 인기 게시글
 * const dailyPosts = await getPopularPosts('daily');
 * // [{ postId: 'post123', score: 150 }, ...]
 *
 * // 주별 상위 20개 인기 게시글
 * const weeklyPosts = await getPopularPosts('weekly', 20);
 * ```
 */
export async function getPopularPosts(
	period: 'daily' | 'weekly' | 'monthly',
	limit: number = 100
): Promise<Array<{ postId: string; score: number }>> {
	if (!rtdb) {
		console.error('Firebase Realtime Database가 초기화되지 않았습니다.');
		return [];
	}

	try {
		const now = new Date();
		const dateKey = formatDate(now, period);

		// post-rankings/{period}/{date} 경로에서 상위 N개 가져오기
		// 점수가 음수로 저장되어 있으므로 limitToFirst()로 내림차순 정렬
		const rankingsRef = ref(rtdb, `post-rankings/${period}/${dateKey}`);
		const rankingsQuery = query(rankingsRef, orderByValue(), limitToFirst(limit));

		const snapshot = await get(rankingsQuery);

		if (!snapshot.exists()) {
			return [];
		}

		const data = snapshot.val();
		const results: Array<{ postId: string; score: number }> = [];

		// 데이터를 배열로 변환 (점수는 절댓값으로 변환)
		for (const postId in data) {
			results.push({
				postId,
				score: Math.abs(data[postId]) // 음수로 저장된 값을 양수로 변환
			});
		}

		return results;
	} catch (error) {
		console.error(`인기 게시글 가져오기 실패 (period: ${period}):`, error);
		return [];
	}
}

/**
 * 게시글의 특정 필드 하나만 읽어옵니다.
 *
 * ⚠️ 중요: 전체 게시글 노드가 아닌 특정 필드만 읽어서 RTDB 비용 절감
 *
 * @param postId - 게시글 ID
 * @param field - 읽어올 필드명
 * @returns 필드 값 또는 null
 *
 * @example
 * ```typescript
 * const title = await getPostField('post123', 'title');
 * const text = await getPostField('post123', 'text');
 * ```
 */
export async function getPostField(
	postId: string,
	field: string
): Promise<string | number | null> {
	if (!rtdb) {
		console.error('Firebase Realtime Database가 초기화되지 않았습니다.');
		return null;
	}

	try {
		// ⚠️ /posts/{postId} 전체가 아닌 /posts/{postId}/{field}만 읽기
		const snapshot = await get(ref(rtdb, `posts/${postId}/${field}`));
		return snapshot.val();
	} catch (error) {
		console.error(`게시글 필드 읽기 실패 (postId: ${postId}, field: ${field}):`, error);
		return null;
	}
}

/**
 * 게시글의 여러 필드를 한 번에 가져옵니다.
 *
 * ⚠️ 중요: RTDB 비용 최적화를 위해 지정된 필드만 개별적으로 읽습니다.
 * - /posts/{postId} 전체를 읽지 않고 요청된 필드들만 읽습니다.
 * - Promise.all()을 사용하여 모든 필드를 병렬로 읽어서 성능 최적화
 *
 * @param postId - 게시글 ID
 * @param fields - 읽어올 필드명 배열
 * @returns 필드명을 키로 하고 필드 값을 값으로 하는 객체
 *
 * @example
 * ```typescript
 * const data = await getPostFields('post123', ['title', 'text', 'authorUid']);
 * console.log(data.title);     // "게시글 제목"
 * console.log(data.authorUid); // "uid123"
 * ```
 */
export async function getPostFields(
	postId: string,
	fields: string[]
): Promise<Record<string, string | number | null>> {
	if (!rtdb) {
		console.error('Firebase Realtime Database가 초기화되지 않았습니다.');
		return {};
	}

	if (!fields || fields.length === 0) {
		return {};
	}

	try {
		// ⚠️ 모든 필드를 병렬로 읽어서 성능 최적화
		const promises = fields.map((field) => getPostField(postId, field));
		const values = await Promise.all(promises);

		// 결과를 객체로 변환
		const result: Record<string, string | number | null> = {};
		fields.forEach((field, index) => {
			result[field] = values[index];
		});

		return result;
	} catch (error) {
		console.error(`게시글 필드들 읽기 실패 (postId: ${postId}):`, error);
		return {};
	}
}
