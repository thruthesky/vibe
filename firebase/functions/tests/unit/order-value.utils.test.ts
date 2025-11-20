import { describe, it, expect } from 'vitest';
import {
  MAX_TIMESTAMP,
  UNREAD_OFFSET,
  PINNED_OFFSET,
  toNegativeTimestamp,
  toPositiveTimestamp,
  toInvertedCategoryOrder,
  extractTimestampFromInvertedOrder,
  toChatListOrder,
  extractChatStatus,
  extractTimestampFromChatOrder,
  isValidTimestamp,
  isValidCategoryOrder,
} from '../../../../shared/order-value.utils';

describe('order-value.utils', () => {
  const testTimestamp = 1710000000000;

  describe('음수 타임스탬프 변환', () => {
    it('양수를 음수로 변환', () => {
      expect(toNegativeTimestamp(testTimestamp)).toBe(-testTimestamp);
    });

    it('음수를 양수로 변환', () => {
      expect(toPositiveTimestamp(-testTimestamp)).toBe(testTimestamp);
    });

    it('양수를 음수로 변환 후 다시 양수로 변환', () => {
      const negative = toNegativeTimestamp(testTimestamp);
      const positive = toPositiveTimestamp(negative);
      expect(positive).toBe(testTimestamp);
    });
  });

  describe('역순 문자열 변환', () => {
    it('카테고리 정렬 필드 생성', () => {
      const result = toInvertedCategoryOrder('qna', testTimestamp);
      const expected = `qna-${MAX_TIMESTAMP - testTimestamp}`;
      expect(result).toBe(expected);
    });

    it('최신 타임스탬프가 더 작은 문자열 값 (오름차순 정렬 시 최신이 먼저)', () => {
      const older = toInvertedCategoryOrder('qna', 1700000000000);
      const newer = toInvertedCategoryOrder('qna', 1710000000000);

      // 문자열 비교: 최신 글이 더 작은 값
      expect(newer < older).toBe(true);
    });

    it('역순 문자열에서 원본 타임스탬프 추출', () => {
      const inverted = toInvertedCategoryOrder('qna', testTimestamp);
      const extracted = extractTimestampFromInvertedOrder(inverted);
      expect(extracted).toBe(testTimestamp);
    });

    it('잘못된 형식은 에러 발생', () => {
      expect(() => extractTimestampFromInvertedOrder('invalid')).toThrow();
      expect(() => extractTimestampFromInvertedOrder('qna-abc')).toThrow();
    });
  });

  describe('채팅 목록 정렬 (음수 + Offset)', () => {
    it('읽음 상태: 음수 타임스탬프', () => {
      const result = toChatListOrder(testTimestamp, 'read');
      expect(result).toBe(-testTimestamp);
    });

    it('읽지않음 상태: 음수 + UNREAD_OFFSET', () => {
      const result = toChatListOrder(testTimestamp, 'unread');
      expect(result).toBe(-testTimestamp - UNREAD_OFFSET);
    });

    it('핀고정 상태: 음수 + PINNED_OFFSET', () => {
      const result = toChatListOrder(testTimestamp, 'pinned');
      expect(result).toBe(-testTimestamp - PINNED_OFFSET);
    });

    it('정렬 순서: pinned < unread < read (오름차순)', () => {
      const read = toChatListOrder(testTimestamp, 'read');
      const unread = toChatListOrder(testTimestamp, 'unread');
      const pinned = toChatListOrder(testTimestamp, 'pinned');

      expect(pinned < unread).toBe(true);
      expect(unread < read).toBe(true);
    });

    it('상태 추출', () => {
      expect(extractChatStatus(-testTimestamp)).toBe('read');
      expect(extractChatStatus(-testTimestamp - UNREAD_OFFSET)).toBe('unread');
      expect(extractChatStatus(-testTimestamp - PINNED_OFFSET)).toBe('pinned');
    });

    it('타임스탬프 추출', () => {
      const read = toChatListOrder(testTimestamp, 'read');
      const unread = toChatListOrder(testTimestamp, 'unread');
      const pinned = toChatListOrder(testTimestamp, 'pinned');

      expect(extractTimestampFromChatOrder(read)).toBe(testTimestamp);
      expect(extractTimestampFromChatOrder(unread)).toBe(testTimestamp);
      expect(extractTimestampFromChatOrder(pinned)).toBe(testTimestamp);
    });
  });

  describe('타입 가드', () => {
    it('isValidTimestamp', () => {
      expect(isValidTimestamp(testTimestamp)).toBe(true);
      expect(isValidTimestamp(-testTimestamp)).toBe(true);
      expect(isValidTimestamp(0)).toBe(false);
      expect(isValidTimestamp(NaN)).toBe(false);
      expect(isValidTimestamp('123')).toBe(false);
      expect(isValidTimestamp(null)).toBe(false);
    });

    it('isValidCategoryOrder', () => {
      expect(isValidCategoryOrder('qna-1710000000000')).toBe(true);
      expect(isValidCategoryOrder('free-8289999999999')).toBe(true);
      expect(isValidCategoryOrder('invalid')).toBe(false);
      expect(isValidCategoryOrder('qna-abc')).toBe(false);
      expect(isValidCategoryOrder(123)).toBe(false);
    });
  });
});
