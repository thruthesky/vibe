/**
 * 정렬 값 유틸리티 함수 (Pure Functions)
 *
 * Firebase Realtime Database의 모든 정렬 필드는 오름차순 값으로 저장됩니다.
 * 최신순 정렬이 필요한 경우 음수 타임스탬프 또는 역순 문자열을 사용합니다.
 *
 * @module order-value.utils
 */

/**
 * 최대 타임스탬프 값 (밀리초 기준)
 * 9999년 12월 31일 23:59:59.999 = 253402300799999ms
 */
export const MAX_TIMESTAMP = 9_999_999_999_999;

/**
 * Prefix 오프셋 값 (채팅 목록 정렬용)
 * - 읽음: offset 없음
 * - 읽지않음: 200조
 * - 핀고정: 500조
 */
export const UNREAD_OFFSET = 200_000_000_000_000;
export const PINNED_OFFSET = 500_000_000_000_000;

// ==================== 음수 타임스탬프 변환 ====================

/**
 * 양수 타임스탬프를 음수로 변환 (정렬 필드용)
 *
 * @param timestamp - 양수 타임스탬프 (밀리초)
 * @returns 음수 타임스탬프
 * @example
 * toNegativeTimestamp(1710000000000) // -1710000000000
 */
export function toNegativeTimestamp(timestamp: number): number {
  return -Math.abs(timestamp);
}

/**
 * 음수 타임스탬프를 양수로 변환 (날짜 표시용)
 *
 * @param negativeTimestamp - 음수 타임스탬프
 * @returns 양수 타임스탬프
 * @example
 * toPositiveTimestamp(-1710000000000) // 1710000000000
 */
export function toPositiveTimestamp(negativeTimestamp: number): number {
  return Math.abs(negativeTimestamp);
}

// ==================== 역순 문자열 변환 ====================

/**
 * 카테고리 정렬 필드 생성 (역순 문자열)
 *
 * Firebase는 문자열을 사전순(lexicographical)으로 오름차순 정렬합니다.
 * 최신 게시글을 위에 표시하려면 타임스탬프를 역순으로 저장해야 합니다.
 *
 * @param category - 카테고리 이름 (예: "qna", "free")
 * @param timestamp - 양수 타임스탬프
 * @returns 역순 카테고리 정렬 필드 (예: "qna-8289999999999")
 * @example
 * toInvertedCategoryOrder("qna", 1710000000000) // "qna-8289999999999"
 */
export function toInvertedCategoryOrder(category: string, timestamp: number): string {
  const positiveTimestamp = Math.abs(timestamp);
  const invertedTimestamp = MAX_TIMESTAMP - positiveTimestamp;
  return `${category}-${invertedTimestamp}`;
}

/**
 * 역순 카테고리 정렬 필드에서 원본 타임스탬프 추출
 *
 * @param invertedCategoryOrder - 역순 카테고리 정렬 필드 (예: "qna-8289999999999")
 * @returns 양수 타임스탬프
 * @example
 * extractTimestampFromInvertedOrder("qna-8289999999999") // 1710000000000
 */
export function extractTimestampFromInvertedOrder(invertedCategoryOrder: string): number {
  const parts = invertedCategoryOrder.split('-');
  if (parts.length < 2) {
    throw new Error(`Invalid inverted category order format: ${invertedCategoryOrder}`);
  }

  const invertedTimestamp = Number(parts[parts.length - 1]);
  if (isNaN(invertedTimestamp)) {
    throw new Error(`Invalid timestamp in category order: ${invertedCategoryOrder}`);
  }

  return MAX_TIMESTAMP - invertedTimestamp;
}

// ==================== 채팅 목록 정렬 (음수 + Offset) ====================

/**
 * 채팅 목록 정렬 값 생성 (음수 + Offset 방식)
 *
 * @param timestamp - 양수 타임스탬프
 * @param status - 읽음 상태 ('read' | 'unread' | 'pinned')
 * @returns 음수 정렬 값
 * @example
 * toChatListOrder(1710000000000, 'read')   // -1710000000000
 * toChatListOrder(1710000000000, 'unread') // -201710000000000
 * toChatListOrder(1710000000000, 'pinned') // -501710000000000
 */
export function toChatListOrder(
  timestamp: number,
  status: 'read' | 'unread' | 'pinned' = 'read'
): number {
  const negativeTimestamp = toNegativeTimestamp(timestamp);

  switch (status) {
    case 'pinned':
      return negativeTimestamp - PINNED_OFFSET;
    case 'unread':
      return negativeTimestamp - UNREAD_OFFSET;
    case 'read':
    default:
      return negativeTimestamp;
  }
}

/**
 * 채팅 목록 정렬 값에서 상태 추출
 *
 * @param orderValue - 채팅 목록 정렬 값
 * @returns 읽음 상태
 * @example
 * extractChatStatus(-501710000000000) // 'pinned'
 * extractChatStatus(-201710000000000) // 'unread'
 * extractChatStatus(-1710000000000)   // 'read'
 */
export function extractChatStatus(orderValue: number): 'read' | 'unread' | 'pinned' {
  const absValue = Math.abs(orderValue);

  if (absValue > PINNED_OFFSET) {
    return 'pinned';
  } else if (absValue > UNREAD_OFFSET) {
    return 'unread';
  } else {
    return 'read';
  }
}

/**
 * 채팅 목록 정렬 값에서 원본 타임스탬프 추출
 *
 * @param orderValue - 채팅 목록 정렬 값
 * @returns 양수 타임스탬프
 * @example
 * extractTimestampFromChatOrder(-501710000000000) // 1710000000000
 * extractTimestampFromChatOrder(-201710000000000) // 1710000000000
 * extractTimestampFromChatOrder(-1710000000000)   // 1710000000000
 */
export function extractTimestampFromChatOrder(orderValue: number): number {
  const absValue = Math.abs(orderValue);
  const status = extractChatStatus(orderValue);

  switch (status) {
    case 'pinned':
      return absValue - PINNED_OFFSET;
    case 'unread':
      return absValue - UNREAD_OFFSET;
    case 'read':
    default:
      return absValue;
  }
}

// ==================== 타입 가드 ====================

/**
 * 값이 유효한 타임스탬프인지 확인
 *
 * @param value - 확인할 값
 * @returns boolean
 */
export function isValidTimestamp(value: unknown): value is number {
  return typeof value === 'number' && !isNaN(value) && value !== 0;
}

/**
 * 값이 유효한 카테고리 정렬 필드인지 확인
 *
 * @param value - 확인할 값
 * @returns boolean
 */
export function isValidCategoryOrder(value: unknown): value is string {
  if (typeof value !== 'string') return false;
  const parts = value.split('-');
  return parts.length >= 2 && !isNaN(Number(parts[parts.length - 1]));
}
