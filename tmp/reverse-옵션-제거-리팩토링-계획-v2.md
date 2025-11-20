# DatabaseListView reverse 옵션 제거 리팩토링 상세 계획 (v2)

**작성일:** 2025-11-20
**버전:** 2.0 (수정된 개념 반영)
**목표:** DatabaseListView의 reverse 옵션을 완전히 제거하고 모든 정렬을 오름차순으로 통일

---

## 📋 목차
1. [개요 및 핵심 원칙](#개요-및-핵심-원칙)
2. [조사 결과 및 필드 분석](#조사-결과-및-필드-분석)
3. [Phase 1: Shared 유틸리티 함수](#phase-1-shared-유틸리티-함수)
4. [Phase 2: Backend 수정](#phase-2-backend-수정)
5. [Phase 3: Frontend 수정](#phase-3-frontend-수정)
6. [Phase 4: 테스트](#phase-4-테스트)
7. [Phase 5: 배포 및 검증](#phase-5-배포-및-검증)
8. [기존 데이터 마이그레이션](#기존-데이터-마이그레이션)

---

## 개요 및 핵심 원칙

### 🎯 목표

**DatabaseListView에서 `reverse` 옵션을 완전히 제거하고 모든 정렬을 오름차순으로 통일**

### 🔑 핵심 원칙 (v2 - 수정됨!)

#### 1️⃣ **createdAt/updatedAt 필드**
- ✅ **항상 양수로 저장** (실제 타임스탬프 값 유지)
- ✅ **데이터 무결성 보장** (Date 객체와 직접 호환)
- ✅ **클라이언트에서 변환 불필요**

**예시:**
```typescript
createdAt: 1710000000000  // ✅ 양수
updatedAt: 1710005000000  // ✅ 양수
```

#### 2️⃣ **정렬 전용 필드** (order, ___Order, ___ListOrder)
- ✅ **항상 음수로 저장** (최신순 정렬용)
- ✅ **숫자 필드:** 음수 타임스탬프 (`-createdAt`)
- ✅ **문자열 필드:** 역순 문자열 (`"<prefix>-<MAX-timestamp>"`)

**예시:**
```typescript
// 숫자 정렬 필드
order: -1710000000000           // ✅ 음수
allCategoryOrder: -1710000000000 // ✅ 음수

// 문자열 정렬 필드
categoryOrder: "qna-8289999999999"  // ✅ 역순 (MAX_TIMESTAMP - timestamp)
```

#### 3️⃣ **Firebase 쿼리**
- ✅ **항상 오름차순** (orderByChild + limitToFirst)
- ✅ **reverse 옵션 사용 금지**
- ✅ **limitToLast 사용 금지** (채팅방 제외)

#### 4️⃣ **필드 명명 규칙**
- `createdAt` / `updatedAt`: 실제 타임스탬프 (양수)
- `order`: 기본 정렬 필드 (음수)
- `allCategoryOrder`: 전체 카테고리 정렬 (음수)
- `categoryOrder`: 카테고리별 정렬 (역순 문자열)
- `____ListOrder`: 목록 정렬 필드 (음수 또는 Prefix+양수)

---

## 조사 결과 및 필드 분석

### 📊 전체 노드 필드 분석

| 노드 경로 | 타임스탬프 필드 | 정렬 필드 | 현재 상태 | 수정 필요 |
|----------|---------------|----------|----------|----------|
| `/posts/{postId}` | `createdAt` (양수) | `order`, `allCategoryOrder`, `categoryOrder` | ❌ order 없음, categoryOrder 역순 아님 | ✅ 예 |
| `/chat-messages/{roomId}/{msgId}` | `createdAt` (양수) | `order`, `allCategoryOrder`, `categoryOrder` | ❌ order 없음 | ✅ 예 |
| `/chat-rooms/{roomId}` | `createdAt` (양수) | `groupListOrder`, `openListOrder` | ✅ 이미 음수 | ❌ 아니오 |
| `/chat-joins/{uid}/{roomId}` | `updatedAt` (양수) | `singleChatListOrder`, `allChatListOrder`, 기타 | ⚠️ Prefix 방식 | ⚠️ 검토 필요 |
| `/comments/{postId}/{commentId}` | `createdAt` (양수) | `order` | ❌ order 없음 | ✅ 예 |
| `/my-actions/{uid}/{actionId}` | `createdAt` (양수) | - | ✅ createdAt으로 정렬 | ❌ 아니오 |
| `/received-reactions/{uid}/{reactionId}` | `createdAt` (양수) | - | ✅ createdAt으로 정렬 | ❌ 아니오 |

### 🔍 주요 발견사항

#### ✅ 이미 올바른 구조

**1. chat-rooms의 groupListOrder/openListOrder**
```typescript
// firebase/functions/src/handlers/chat.room-create.handler.ts:155
const listOrder = -timestamp;  // ✅ 이미 음수
```

**2. influencer-rankings**
```typescript
// firebase/functions/src/handlers/stats.ranking.handler.ts:81
const negativeScore = -newScore;  // ✅ 이미 음수
```

**3. post-rankings**
```typescript
// firebase/functions/src/handlers/post-ranking.handler.ts:102
updates[`post-rankings/daily/${daily}/${postId}`] = -score;  // ✅ 이미 음수
```

#### ❌ 수정 필요한 구조

**1. posts - categoryOrder (문자열 역순 필요)**
```typescript
// 현재 (❌ 오래된순)
categoryOrder: "qna-1710000000000"

// 수정 후 (✅ 최신순)
categoryOrder: "qna-8289999999999"  // MAX_TIMESTAMP - 1710000000000
```

**2. posts - order 필드 추가 필요**
```typescript
// 현재 (❌ order 필드 없음)
{
  createdAt: 1710000000000,
  allCategoryOrder: -1710000000000,
  categoryOrder: "qna-1710000000000"
}

// 수정 후 (✅ order 필드 추가)
{
  createdAt: 1710000000000,        // 양수 유지
  order: -1710000000000,           // 새로 추가
  allCategoryOrder: -1710000000000,
  categoryOrder: "qna-8289999999999"
}
```

**3. chat-messages - order 필드 추가 필요**
```typescript
// 현재 (❌ order 필드 없음)
{
  createdAt: 1710000000000,
  text: "메시지 내용"
}

// 수정 후 (✅ order 필드 추가)
{
  createdAt: 1710000000000,  // 양수 유지
  order: -1710000000000,     // 새로 추가
  text: "메시지 내용"
}
```

#### ⚠️ 검토 필요

**chat-joins의 ____ListOrder 필드들**

현재는 Prefix 방식 사용 중:
```typescript
// 읽음: "1710000000"
// 읽지않음: "2001710000000" (Prefix 200)
// 핀고정: "5001710000000" (Prefix 500)
```

**문제점:**
- limitToLast 사용 중 (역순 정렬)
- reverse=true 필요

**해결 방법 (3가지 옵션):**

1. **옵션 A: 음수 + Offset 방식** (권장)
```typescript
// 읽음: -1710000000
// 읽지않음: -1710000000 - 200000000000000
// 핀고정: -1710000000 - 500000000000000
```

2. **옵션 B: 역순 문자열 + Prefix 방식**
```typescript
// 읽음: "100-8289999999999"
// 읽지않음: "200-8289999999999"
// 핀고정: "500-8289999999999"
```

3. **옵션 C: 현재 방식 유지 + 예외 처리**
- 채팅 목록만 reverse=true 허용
- DatabaseListView에 `allowReverse` 옵션 추가

**결정:** 옵션 A 채택 (일관성 + 성능)

---

## Phase 1: Shared 유틸리티 함수

### 📁 파일 생성: `shared/order-value.utils.ts`

```typescript
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
```

### 🧪 유닛 테스트: `firebase/functions/tests/unit/order-value.utils.test.ts`

```typescript
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
```

---

## Phase 2: Backend 수정

### 2.1 수정 대상 파일 전체 목록

| 파일 | 수정 내용 | 우선순위 |
|------|----------|----------|
| `shared/categories.ts` | `createCategoryOrder()` 함수 수정 | 🔥 높음 |
| `firebase/functions/src/handlers/post.create.handler.ts` | order, categoryOrder 추가/수정 | 🔥 높음 |
| `firebase/functions/src/handlers/chat.message-category.handler.ts` | categoryOrder 수정 | 🔥 높음 |
| `firebase/functions/src/handlers/chat.message-create.handler.ts` | order, ___ListOrder 수정 | 🔥 높음 |
| `firebase/functions/src/handlers/chat.room-create.handler.ts` | 확인 (이미 음수) | ⚠️ 중간 |
| `firebase/functions/src/handlers/comment.create.handler.ts` | order 추가 | 중간 |
| `firebase/functions/src/handlers/user.create.handler.ts` | 확인 (변경 없음) | 낮음 |

### 2.2 상세 수정 내용

#### 📄 Step 1: `shared/categories.ts` 수정

**현재 코드 (Line 99):**
```typescript
export function createCategoryOrder(category: ForumCategory, timestamp: number): string {
  return `${category}-${Number(timestamp)}`;
}
```

**수정 후:**
```typescript
import { toInvertedCategoryOrder } from './order-value.utils';

/**
 * 카테고리 정렬 필드 생성 (역순 문자열)
 *
 * @param category - 카테고리 이름
 * @param timestamp - 양수 타임스탬프
 * @returns 역순 카테고리 정렬 문자열
 * @example
 * createCategoryOrder('qna', 1710000000000) // "qna-8289999999999"
 */
export function createCategoryOrder(category: ForumCategory, timestamp: number): string {
  return toInvertedCategoryOrder(category, timestamp);
}
```

---

#### 📄 Step 2: `firebase/functions/src/handlers/post.create.handler.ts` 수정

**현재 코드 (Lines 66-80):**
```typescript
const createdAt = snapshot.val().createdAt || Date.now();
const categoryOrder = `${category}-${Number(createdAt)}`;
const allCategoryOrder = -Number(createdAt);

await postRef.update({
  category,
  categoryOrder,
  allCategoryOrder,
});
```

**수정 후:**
```typescript
import { toNegativeTimestamp } from '../../../shared/order-value.utils';
import { createCategoryOrder } from '../../../shared/categories';

// createdAt은 양수로 유지 (새로 생성되는 경우에만 저장)
let createdAt = snapshot.val().createdAt;
if (!createdAt) {
  createdAt = Date.now();
}

// 정렬 전용 필드 생성 (음수 또는 역순 문자열)
const order = toNegativeTimestamp(createdAt);                // -1710000000000
const allCategoryOrder = toNegativeTimestamp(createdAt);     // -1710000000000
const categoryOrder = createCategoryOrder(category, createdAt); // "qna-8289999999999"

await postRef.update({
  createdAt,           // ✅ 양수 유지
  category,
  order,               // ✅ 새로 추가 (음수)
  categoryOrder,       // ✅ 역순 문자열
  allCategoryOrder,    // ✅ 음수
});
```

**주의사항:**
- 기존 게시글의 createdAt은 이미 존재하므로 덮어쓰지 않음
- 신규 게시글만 createdAt을 Date.now()로 설정

---

#### 📄 Step 3: `firebase/functions/src/handlers/chat.message-category.handler.ts` 수정

**현재 코드 (Lines 99, 144, 158-163):**
```typescript
const categoryOrder = createCategoryOrder(category, timestamp);
const allCategoryOrder = -Number(createdAt);

updates[`posts/${postId}/categoryOrder`] = categoryOrder;
updates[`posts/${postId}/allCategoryOrder`] = allCategoryOrder;

updates[`chat-messages/${roomId}/${messageId}/categoryOrder`] = categoryOrder;
updates[`chat-messages/${roomId}/${messageId}/allCategoryOrder`] = allCategoryOrder;
```

**수정 후:**
```typescript
import { toNegativeTimestamp } from '../../../shared/order-value.utils';
import { createCategoryOrder } from '../../../shared/categories';

// createdAt은 양수로 유지
const createdAt = snapshot.val().createdAt || Date.now();

// 정렬 전용 필드 생성
const order = toNegativeTimestamp(createdAt);
const allCategoryOrder = toNegativeTimestamp(createdAt);
const categoryOrder = createCategoryOrder(category, createdAt);

updates[`posts/${postId}/order`] = order;
updates[`posts/${postId}/categoryOrder`] = categoryOrder;
updates[`posts/${postId}/allCategoryOrder`] = allCategoryOrder;

updates[`chat-messages/${roomId}/${messageId}/order`] = order;
updates[`chat-messages/${roomId}/${messageId}/categoryOrder`] = categoryOrder;
updates[`chat-messages/${roomId}/${messageId}/allCategoryOrder`] = allCategoryOrder;
```

---

#### 📄 Step 4: `firebase/functions/src/handlers/chat.message-create.handler.ts` 수정

**현재 코드 (Lines 77, 99-100, 110-114, 122-126, 208-233):**
```typescript
const createdAt = snapshot.val().createdAt || Date.now();
const timestamp = Date.now();

const senderSingleListOrder = `${timestamp}`;        // 읽음
const partnerSingleListOrder = `200${timestamp}`;    // 읽지않음

updates[`chat-joins/${senderUid}/${roomId}/singleChatListOrder`] = senderSingleListOrder;
updates[`chat-joins/${senderUid}/${roomId}/allChatListOrder`] = senderSingleListOrder;
updates[`chat-joins/${senderUid}/${roomId}/updatedAt`] = timestamp;

updates[`chat-joins/${partnerUid}/${roomId}/singleChatListOrder`] = partnerSingleListOrder;
updates[`chat-joins/${partnerUid}/${roomId}/allChatListOrder`] = partnerSingleListOrder;
updates[`chat-joins/${partnerUid}/${roomId}/updatedAt`] = timestamp;
```

**수정 후:**
```typescript
import { toNegativeTimestamp, toChatListOrder } from '../../../shared/order-value.utils';

// createdAt은 양수로 유지
let createdAt = snapshot.val().createdAt;
if (!createdAt) {
  createdAt = Date.now();
}

// updatedAt도 양수로 유지
const timestamp = Date.now();

// 메시지 정렬 필드 추가 (음수)
const messageOrder = toNegativeTimestamp(createdAt);

// 채팅 목록 정렬 필드 (음수 + Offset)
const senderSingleListOrder = toChatListOrder(timestamp, 'read');    // -1710000000000
const partnerSingleListOrder = toChatListOrder(timestamp, 'unread'); // -201710000000000

updates[`chat-messages/${roomId}/${messageId}/order`] = messageOrder;

updates[`chat-joins/${senderUid}/${roomId}/singleChatListOrder`] = senderSingleListOrder;
updates[`chat-joins/${senderUid}/${roomId}/allChatListOrder`] = senderSingleListOrder;
updates[`chat-joins/${senderUid}/${roomId}/updatedAt`] = timestamp;

updates[`chat-joins/${partnerUid}/${roomId}/singleChatListOrder`] = partnerSingleListOrder;
updates[`chat-joins/${partnerUid}/${roomId}/allChatListOrder`] = partnerSingleListOrder;
updates[`chat-joins/${partnerUid}/${roomId}/updatedAt`] = timestamp;

// 기존 필드 확인 및 핀고정 처리 (Lines 208-233)
const basePath = `chat-joins/${memberUid}/${roomId}`;
const existingAllChatListOrder = memberSnapshot.val()?.allChatListOrder;

if (existingAllChatListOrder !== undefined) {
  const status = extractChatStatus(existingAllChatListOrder);
  if (status === 'pinned') {
    // 핀 설정된 채팅방: 핀고정 상태 유지
    updates[`${basePath}/allChatListOrder`] = toChatListOrder(timestamp, 'pinned');
  } else {
    // 일반 채팅방: 읽음/읽지않음 업데이트
    const isSender = memberUid === senderUid;
    updates[`${basePath}/allChatListOrder`] = toChatListOrder(
      timestamp,
      isSender ? 'read' : 'unread'
    );
  }
} else {
  // 새로운 채팅방: 읽음 상태로 생성
  updates[`${basePath}/allChatListOrder`] = toChatListOrder(timestamp, 'read');
}

// groupChatListOrder, openChatListOrder, openAndGroupChatListOrder도 동일하게 처리
```

**주요 변경사항:**
1. createdAt, updatedAt은 양수 유지
2. 메시지에 order 필드 추가 (음수)
3. ___ListOrder 필드를 Prefix 문자열 → 음수 + Offset으로 변경
4. `toChatListOrder()` 함수 사용

---

#### 📄 Step 5: `firebase/functions/src/handlers/comment.create.handler.ts` 수정

**현재 코드:**
```typescript
const createdAt = snapshot.val().createdAt || Date.now();

await commentRef.update({
  createdAt,
  // ... 기타 필드
});
```

**수정 후:**
```typescript
import { toNegativeTimestamp } from '../../../shared/order-value.utils';

// createdAt은 양수로 유지
let createdAt = snapshot.val().createdAt;
if (!createdAt) {
  createdAt = Date.now();
}

// 정렬 전용 필드 추가 (음수)
const order = toNegativeTimestamp(createdAt);

await commentRef.update({
  createdAt,   // ✅ 양수 유지
  order,       // ✅ 새로 추가 (음수)
  // ... 기타 필드
});
```

---

#### 📄 Step 6: `firebase/functions/src/handlers/chat.room-create.handler.ts` 확인

**현재 코드 (Line 155, 164, 177):**
```typescript
const listOrder = -timestamp;  // ✅ 이미 음수

updates[`chat-rooms/${roomId}/groupListOrder`] = listOrder;
updates[`chat-rooms/${roomId}/openListOrder`] = listOrder;
```

**결론:** ✅ 수정 불필요 (이미 음수로 올바르게 구현됨)

---

### 2.3 Backend 수정 체크리스트

- [ ] `shared/order-value.utils.ts` 생성
- [ ] `shared/categories.ts` 수정 (`createCategoryOrder` 함수)
- [ ] `post.create.handler.ts` 수정 (order, categoryOrder, allCategoryOrder)
- [ ] `chat.message-category.handler.ts` 수정 (order, categoryOrder, allCategoryOrder)
- [ ] `chat.message-create.handler.ts` 수정 (order, ___ListOrder)
- [ ] `comment.create.handler.ts` 수정 (order 추가)
- [ ] `chat.room-create.handler.ts` 확인 (수정 불필요)
- [ ] 유닛 테스트 작성 및 실행 (`npm run test:unit`)
- [ ] 통합 테스트 작성 및 실행 (`npm run test:integration`)
- [ ] `npm run deploy` 배포

---

## Phase 3: Frontend 수정

### 3.1 DatabaseListView 컴포넌트 수정

**파일:** `src/lib/components/DatabaseListView.svelte`

#### Step 1: Props에서 reverse 제거

**현재 코드 (Line 125):**
```typescript
interface Props {
  // ... 기타 props
  reverse?: boolean;  // ❌ 제거할 prop
  // ... 기타 props
}

let {
  // ... 기타 props
  reverse = false,
  // ... 기타 props
}: Props = $props();
```

**수정 후:**
```typescript
interface Props {
  // ... 기타 props
  // reverse 제거됨
  // ... 기타 props
}

let {
  // ... 기타 props
  // reverse 제거됨
  // ... 기타 props
}: Props = $props();
```

#### Step 2: 정렬 로직 제거 (항상 오름차순만)

**현재 코드 (Lines 1062-1088):**
```typescript
loadedItems.sort((a, b) => {
  const aValue = a.data[orderBy];
  const bValue = b.data[orderBy];

  // ... null 처리

  if (reverse && scrollTrigger !== 'top') {
    // ❌ 제거: 내림차순 정렬
    return typeof aValue === 'string'
      ? bValue.localeCompare(aValue)
      : Number(bValue) - Number(aValue);
  } else {
    // ✅ 유지: 오름차순 정렬
    return typeof aValue === 'string'
      ? aValue.localeCompare(bValue)
      : Number(aValue) - Number(bValue);
  }
});
```

**수정 후:**
```typescript
loadedItems.sort((a, b) => {
  const aValue = a.data[orderBy];
  const bValue = b.data[orderBy];

  // null/undefined 처리
  if (aValue == null && bValue == null) return 0;
  if (aValue == null) return 1;
  if (bValue == null) return -1;

  // ✅ 항상 오름차순 정렬만 (Firebase RTDB 정렬과 동일)
  if (typeof aValue === 'string' && typeof bValue === 'string') {
    return aValue.localeCompare(bValue);  // 문자열 오름차순
  } else {
    return Number(aValue) - Number(bValue);  // 숫자 오름차순
  }
});
```

#### Step 3: Firebase 쿼리 수정 (항상 limitToFirst)

**현재 코드 (Lines 948-996):**
```typescript
if (reverse || scrollTrigger === 'top') {
  // ❌ 제거: limitToLast 사용
  dataQuery = query(
    baseRef,
    orderByChild(orderBy),
    startAt(false),
    limitToLast(pageSize + 1)
  );
} else {
  // ✅ 유지: limitToFirst 사용
  dataQuery = query(
    baseRef,
    orderByChild(orderBy),
    startAt(false),
    limitToFirst(pageSize + 1)
  );
}
```

**수정 후:**
```typescript
// ✅ 항상 limitToFirst 사용 (오름차순 쿼리)
dataQuery = query(
  baseRef,
  orderByChild(orderBy),
  startAt(false),
  limitToFirst(pageSize + 1)
);
```

**예외: 채팅방 (scrollTrigger='top')**
```typescript
if (scrollTrigger === 'top') {
  // 채팅방은 limitToLast 유지 (오래된 메시지부터 로드)
  dataQuery = query(
    baseRef,
    orderByChild(orderBy),
    startAt(false),
    limitToLast(pageSize + 1)
  );
} else {
  // 일반 목록은 limitToFirst 사용
  dataQuery = query(
    baseRef,
    orderByChild(orderBy),
    startAt(false),
    limitToFirst(pageSize + 1)
  );
}
```

#### Step 4: loadMore() 함수 수정

**현재 코드 (Lines 1294-1348):**
```typescript
if (reverse) {
  // ❌ 제거: endBefore + limitToLast
  dataQuery = query(
    baseRef,
    orderByChild(orderBy),
    endBefore(firstOrderValue, firstItemKey),
    limitToLast(pageSize + 1)
  );
} else {
  // ✅ 유지: startAfter + limitToFirst
  dataQuery = query(
    baseRef,
    orderByChild(orderBy),
    startAfter(lastOrderValue, lastItemKey),
    limitToFirst(pageSize + 1)
  );
}
```

**수정 후:**
```typescript
// ✅ 항상 startAfter + limitToFirst (오름차순 페이지네이션)
if (scrollTrigger === 'top') {
  // 채팅방: endBefore + limitToLast 사용
  dataQuery = query(
    baseRef,
    orderByChild(orderBy),
    endBefore(firstOrderValue, firstItemKey),
    limitToLast(pageSize + 1)
  );
} else {
  // 일반 목록: startAfter + limitToFirst 사용
  dataQuery = query(
    baseRef,
    orderByChild(orderBy),
    startAfter(lastOrderValue, lastItemKey),
    limitToFirst(pageSize + 1)
  );
}
```

---

### 3.2 모든 DatabaseListView 사용처 수정

**수정해야 할 파일 (17개):**

| 파일 | 현재 reverse | 현재 orderBy | 수정 후 orderBy | reverse 제거 |
|------|-------------|-------------|----------------|-------------|
| `src/lib/components/post/PostListView.svelte` | 조건부 | `categoryOrder` / `allCategoryOrder` | 동일 | ✅ |
| `src/routes/post/list/+page.svelte` | `true` | `createdAt` | `order` | ✅ |
| `src/routes/my/reactions/+page.svelte` | `true` | `createdAt` | `createdAt` | ✅ |
| `src/routes/my/activity/+page.svelte` | `true` | `createdAt` | `createdAt` | ✅ |
| `src/routes/chat/room/+page.svelte` | 누락 | `${roomOrderField}` | 확인 필요 | ⚠️ |
| `src/routes/user/list/+page.svelte` | `false` | `displayNameLowerCase` | 동일 | ❌ |
| `src/routes/chat/list/+page.svelte` | `true` | `singleChatListOrder` | 동일 | ✅ |
| `src/routes/chat/open-chat-list/+page.svelte` | `true` | `openListOrder` | 동일 | ✅ |
| `src/routes/chat/group-chat-list/+page.svelte` | `true` | `openAndGroupChatListOrder` | 동일 | ✅ |
| `src/lib/components/chat/ChatInvitationList.svelte` | `true` | `invitationOrder` | 동일 | ✅ |
| `src/routes/dev/test/database-list-view/+page.svelte` | 변수 | 변수 | 테스트용 | ⚠️ |
| `src/routes/chat/room/+layout.svelte` | `true` | `allChatListOrder` | 동일 | ✅ |
| `src/lib/components/user/UserSearchDialog.svelte` | 누락 | `searchField` | 동일 | ⚠️ |

#### 수정 예시 1: `src/lib/components/post/PostListView.svelte`

**현재 코드 (Lines 106-108):**
```svelte
<DatabaseListView
  bind:this={listViewRef}
  path={path}
  pageSize={pageSize}
  orderBy={category ? 'categoryOrder' : 'allCategoryOrder'}
  orderPrefix={category ? `${category}-` : ''}
  reverse={category ? true : false}  <!-- ❌ 제거 -->
  newItemPosition="top"
  threshold={threshold}
>
```

**수정 후:**
```svelte
<DatabaseListView
  bind:this={listViewRef}
  path={path}
  pageSize={pageSize}
  orderBy={category ? 'categoryOrder' : 'allCategoryOrder'}
  orderPrefix={category ? `${category}-` : ''}
  <!-- reverse 제거됨 -->
  newItemPosition="top"
  threshold={threshold}
>
```

#### 수정 예시 2: `src/routes/post/list/+page.svelte`

**현재 코드 (Lines 215-229):**
```svelte
<PostListView
  bind:this={postListViewRef}
  path="posts"
  pageSize={20}
  orderBy="createdAt"  <!-- ❌ 변경 필요 -->
  reverse={true}       <!-- ❌ 제거 -->
  threshold={300}
  category={selectedCategory}
  {userLikes}
  onToggleLike={handleToggleLike}
  onOpenCommentDialog={handleOpenCommentDialog}
  onEdit={handleOpenEditDialog}
  onDelete={handleDeletePost}
  editMode="dialog"
/>
```

**수정 후:**
```svelte
<PostListView
  bind:this={postListViewRef}
  path="posts"
  pageSize={20}
  <!-- orderBy는 PostListView에서 자동으로 설정됨 -->
  <!-- reverse 제거됨 -->
  threshold={300}
  category={selectedCategory}
  {userLikes}
  onToggleLike={handleToggleLike}
  onOpenCommentDialog={handleOpenCommentDialog}
  onEdit={handleOpenEditDialog}
  onDelete={handleDeletePost}
  editMode="dialog"
/>
```

**주의:** PostListView가 내부적으로 orderBy를 설정하므로 제거 가능

#### 수정 예시 3: `src/routes/chat/list/+page.svelte`

**현재 코드 (Line 244):**
```svelte
<DatabaseListView
  path={`chat-joins/${authStore.user.uid}`}
  pageSize={20}
  orderBy="singleChatListOrder"
  reverse={true}  <!-- ❌ 제거 -->
>
```

**수정 후:**
```svelte
<DatabaseListView
  path={`chat-joins/${authStore.user.uid}`}
  pageSize={20}
  orderBy="singleChatListOrder"
  <!-- reverse 제거됨 -->
>
```

**주의:** Backend에서 singleChatListOrder가 이미 음수 + Offset으로 저장되므로 reverse 불필요

---

### 3.3 날짜 표시 부분 확인

**중요:** createdAt/updatedAt은 양수로 저장되므로 **변환 불필요**

**현재 코드 (변환 없음):**
```typescript
formatDistanceToNow(message.createdAt)  // ✅ 그대로 사용 가능
```

**수정 불필요:** createdAt이 양수이므로 기존 코드 그대로 사용

---

### 3.4 Frontend 수정 체크리스트

- [ ] DatabaseListView에서 reverse 옵션 제거
- [ ] limitToFirst/limitToLast 로직 수정 (scrollTrigger='top' 예외 처리)
- [ ] PostListView에서 reverse 제거
- [ ] 17개 사용처에서 reverse prop 제거
- [ ] orderBy 필드 확인 (createdAt → order 변경 필요한 곳)
- [ ] `npm run check` 타입 검사 통과

---

## Phase 4: 테스트

### 4.1 유닛 테스트

**실행 명령:**
```bash
cd firebase/functions
npm run test:unit
```

**테스트 파일:**
- `tests/unit/order-value.utils.test.ts` ✅ 새로 작성

**테스트 커버리지:**
- 음수 타임스탬프 변환
- 역순 문자열 변환
- 채팅 목록 정렬 (음수 + Offset)
- 타입 가드

### 4.2 통합 테스트

**실행 명령:**
```bash
cd firebase/functions
npm run test:integration
```

**테스트 시나리오:**

#### 📝 게시글 정렬 테스트
```typescript
// firebase/functions/tests/integration/post-sorting.test.ts
import { describe, it, expect, beforeEach, afterAll } from 'vitest';
import { initializeApp, cert } from 'firebase-admin/app';
import { getDatabase } from 'firebase-admin/database';
import { toNegativeTimestamp, toInvertedCategoryOrder } from '../../../shared/order-value.utils';

describe('게시글 정렬 필드 통합 테스트', () => {
  let database: ReturnType<typeof getDatabase>;

  beforeEach(async () => {
    // 테스트 데이터 정리
    await database.ref('posts').remove();
  });

  it('order 필드가 음수로 저장되어야 함', async () => {
    const postRef = database.ref('posts').push();
    await postRef.set({
      category: 'qna',
      text: '테스트 게시글',
      uid: 'test-user',
    });

    // Cloud Functions 실행 대기
    await new Promise(resolve => setTimeout(resolve, 5000));

    const snapshot = await postRef.once('value');
    const post = snapshot.val();

    expect(post.order).toBeLessThan(0);  // ✅ 음수 확인
    expect(post.createdAt).toBeGreaterThan(0);  // ✅ 양수 확인
    expect(post.order).toBe(-post.createdAt);  // ✅ createdAt의 음수
  });

  it('categoryOrder가 역순 문자열로 저장되어야 함', async () => {
    const postRef = database.ref('posts').push();
    const createdAt = Date.now();

    await postRef.set({
      category: 'qna',
      text: '테스트 게시글',
      uid: 'test-user',
      createdAt,
    });

    await new Promise(resolve => setTimeout(resolve, 5000));

    const snapshot = await postRef.once('value');
    const post = snapshot.val();

    const expectedCategoryOrder = toInvertedCategoryOrder('qna', createdAt);
    expect(post.categoryOrder).toBe(expectedCategoryOrder);
  });

  it('최신 게시글이 오름차순 정렬 시 위에 표시되어야 함', async () => {
    const olderTimestamp = Date.now() - 10000;
    const newerTimestamp = Date.now();

    const olderPost = database.ref('posts').push();
    const newerPost = database.ref('posts').push();

    await olderPost.set({
      category: 'qna',
      text: '오래된 게시글',
      uid: 'test-user',
      createdAt: olderTimestamp,
    });

    await newerPost.set({
      category: 'qna',
      text: '최신 게시글',
      uid: 'test-user',
      createdAt: newerTimestamp,
    });

    await new Promise(resolve => setTimeout(resolve, 5000));

    const snapshot = await database.ref('posts')
      .orderByChild('order')
      .limitToFirst(2)
      .once('value');

    const posts: any[] = [];
    snapshot.forEach((child) => {
      posts.push({ key: child.key, ...child.val() });
    });

    // ✅ 오름차순 정렬 시 최신 게시글이 먼저 (order가 더 작은 음수)
    expect(posts[0].key).toBe(newerPost.key);
    expect(posts[1].key).toBe(olderPost.key);
    expect(posts[0].order < posts[1].order).toBe(true);
  });

  afterAll(async () => {
    await database.ref('posts').remove();
  });
});
```

#### 📝 채팅 목록 정렬 테스트
```typescript
// firebase/functions/tests/integration/chat-list-sorting.test.ts
import { describe, it, expect, beforeEach, afterAll } from 'vitest';
import { toChatListOrder } from '../../../shared/order-value.utils';

describe('채팅 목록 정렬 통합 테스트', () => {
  it('singleChatListOrder가 음수 + Offset으로 저장되어야 함', async () => {
    // 채팅 메시지 전송
    const messageRef = database.ref('chat-messages/test-room').push();
    await messageRef.set({
      text: '테스트 메시지',
      senderUid: 'user1',
      createdAt: Date.now(),
    });

    await new Promise(resolve => setTimeout(resolve, 5000));

    const senderJoin = await database.ref('chat-joins/user1/test-room').once('value');
    const partnerJoin = await database.ref('chat-joins/user2/test-room').once('value');

    const senderData = senderJoin.val();
    const partnerData = partnerJoin.val();

    // ✅ 발신자: 읽음 (음수만)
    expect(senderData.singleChatListOrder).toBeLessThan(0);

    // ✅ 수신자: 읽지않음 (음수 + UNREAD_OFFSET)
    expect(partnerData.singleChatListOrder).toBeLessThan(senderData.singleChatListOrder);
  });

  it('핀고정 > 읽지않음 > 읽음 순서로 정렬되어야 함', async () => {
    const timestamp = Date.now();

    const readOrder = toChatListOrder(timestamp, 'read');
    const unreadOrder = toChatListOrder(timestamp, 'unread');
    const pinnedOrder = toChatListOrder(timestamp, 'pinned');

    // ✅ 오름차순 정렬 시: pinned < unread < read
    expect(pinnedOrder < unreadOrder).toBe(true);
    expect(unreadOrder < readOrder).toBe(true);
  });
});
```

---

## Phase 5: 배포 및 검증

### 5.1 배포 순서

#### 1️⃣ Backend 배포

```bash
cd firebase/functions
npm run test:unit      # 유닛 테스트 실행
npm run test:integration  # 통합 테스트 실행
npm run deploy         # Cloud Functions 배포
```

#### 2️⃣ Frontend 빌드 및 확인

```bash
npm run check          # 타입 검사
npm run build          # 프로덕션 빌드
npm run dev            # 로컬 테스트
```

### 5.2 수동 검증 체크리스트

#### 📋 게시글 목록
- [ ] `/post/list` 페이지에서 최신 글이 위에 표시되는지 확인
- [ ] 카테고리 필터링 시 정렬이 올바른지 확인
- [ ] 무한 스크롤이 정상 작동하는지 확인
- [ ] 새 글 작성 시 즉시 목록 상단에 표시되는지 확인

#### 📋 채팅 목록
- [ ] `/chat/list` 페이지에서 최신 채팅방이 위에 표시되는지 확인
- [ ] 읽지않은 채팅방이 읽은 채팅방보다 위에 표시되는지 확인
- [ ] 핀고정 채팅방이 최상단에 표시되는지 확인
- [ ] 새 메시지 수신 시 채팅방 순서가 업데이트되는지 확인

#### 📋 채팅 메시지
- [ ] `/chat/room/{roomId}` 페이지에서 오래된 메시지가 위에 표시되는지 확인
- [ ] 위로 스크롤 시 이전 메시지가 로드되는지 확인
- [ ] 새 메시지 전송 시 하단에 추가되는지 확인

#### 📋 나의 발자취 / 받은 반응
- [ ] `/my/activity` 페이지에서 최신 활동이 위에 표시되는지 확인
- [ ] `/my/reactions` 페이지에서 최신 반응이 위에 표시되는지 확인
- [ ] 날짜 표시가 올바른지 확인 (createdAt 양수)

### 5.3 성능 검증

#### Firebase 읽기 횟수 확인

**Firebase Console → Realtime Database → Usage 탭**
- [ ] 초기 로드 시 읽기 횟수가 pageSize + 1인지 확인
- [ ] 무한 스크롤 시 추가 읽기 횟수가 pageSize + 1인지 확인
- [ ] 불필요한 중복 읽기가 없는지 확인

#### 페이지 로딩 속도

**Chrome DevTools → Network 탭**
- [ ] 초기 로드 시간이 1초 이내인지 확인
- [ ] 무한 스크롤 시 응답 시간이 500ms 이내인지 확인

---

## 기존 데이터 마이그레이션

### ⚠️ 중요: 기존 데이터 호환성

**문제점:**
- 기존 데이터에는 order 필드가 없음
- categoryOrder가 역순이 아님 (양수 타임스탬프)
- ___ListOrder가 Prefix 문자열 방식

**해결 방법: Cloud Functions에서 자동 생성**

#### 1️⃣ 게시글 order 필드 자동 생성

**핸들러:** `post.create.handler.ts`

```typescript
// 기존 게시글에 order 필드가 없으면 자동 생성
if (!snapshot.val().order && snapshot.val().createdAt) {
  const order = toNegativeTimestamp(snapshot.val().createdAt);
  await postRef.update({ order });
}
```

#### 2️⃣ categoryOrder 역순 변환

**마이그레이션 스크립트:** `firebase/functions/tmp/migrate-category-order.cjs`

```javascript
const admin = require('firebase-admin');
const serviceAccount = require('../firebase-service-account-key.json');
const { toInvertedCategoryOrder } = require('../../../shared/order-value.utils');

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  databaseURL: 'https://sonub-default-rtdb.firebaseio.com',
});

const database = admin.database();

async function migrateCategoryOrder() {
  console.log('\n🔄 categoryOrder 마이그레이션 시작...\n');

  const postsSnapshot = await database.ref('posts').once('value');
  const updates = {};
  let count = 0;

  postsSnapshot.forEach((child) => {
    const post = child.val();
    const postId = child.key;

    // categoryOrder가 역순이 아닌 경우 (양수 타임스탬프 형식)
    if (post.categoryOrder && post.category && post.createdAt) {
      const currentOrder = post.categoryOrder;
      const expectedOrder = toInvertedCategoryOrder(post.category, post.createdAt);

      if (currentOrder !== expectedOrder) {
        updates[`posts/${postId}/categoryOrder`] = expectedOrder;
        count++;
      }
    }
  });

  if (Object.keys(updates).length > 0) {
    await database.ref().update(updates);
    console.log(`✅ categoryOrder 마이그레이션 완료: ${count}개 항목\n`);
  } else {
    console.log('ℹ️ 마이그레이션 필요한 항목 없음\n');
  }

  await admin.app().delete();
}

migrateCategoryOrder().catch(console.error);
```

**실행:**
```bash
cd firebase/functions
node tmp/migrate-category-order.cjs
```

#### 3️⃣ 채팅 목록 정렬 필드 변환

**마이그레이션 스크립트:** `firebase/functions/tmp/migrate-chat-list-order.cjs`

```javascript
const admin = require('firebase-admin');
const { toChatListOrder, extractChatStatus } = require('../../../shared/order-value.utils');

async function migrateChatListOrder() {
  console.log('\n🔄 채팅 목록 정렬 필드 마이그레이션 시작...\n');

  const joinsSnapshot = await database.ref('chat-joins').once('value');
  const updates = {};
  let count = 0;

  joinsSnapshot.forEach((userSnapshot) => {
    const uid = userSnapshot.key;

    userSnapshot.forEach((roomSnapshot) => {
      const roomId = roomSnapshot.key;
      const join = roomSnapshot.val();

      // singleChatListOrder 변환 (문자열 → 음수 + Offset)
      if (typeof join.singleChatListOrder === 'string') {
        const oldOrder = join.singleChatListOrder;
        const isPinned = oldOrder.startsWith('500');
        const isUnread = oldOrder.startsWith('200');
        const timestamp = Number(oldOrder.replace(/^(500|200)/, ''));

        const status = isPinned ? 'pinned' : isUnread ? 'unread' : 'read';
        const newOrder = toChatListOrder(timestamp, status);

        updates[`chat-joins/${uid}/${roomId}/singleChatListOrder`] = newOrder;
        count++;
      }

      // allChatListOrder, groupChatListOrder, openChatListOrder 등도 동일하게 변환
      ['allChatListOrder', 'groupChatListOrder', 'openChatListOrder', 'openAndGroupChatListOrder'].forEach(field => {
        if (typeof join[field] === 'string') {
          const oldOrder = join[field];
          const isPinned = oldOrder.startsWith('500');
          const isUnread = oldOrder.startsWith('200');
          const timestamp = Number(oldOrder.replace(/^(500|200)/, ''));

          const status = isPinned ? 'pinned' : isUnread ? 'unread' : 'read';
          const newOrder = toChatListOrder(timestamp, status);

          updates[`chat-joins/${uid}/${roomId}/${field}`] = newOrder;
          count++;
        }
      });
    });
  });

  if (Object.keys(updates).length > 0) {
    await database.ref().update(updates);
    console.log(`✅ 채팅 목록 정렬 필드 마이그레이션 완료: ${count}개 항목\n`);
  } else {
    console.log('ℹ️ 마이그레이션 필요한 항목 없음\n');
  }

  await admin.app().delete();
}

migrateChatListOrder().catch(console.error);
```

**실행:**
```bash
cd firebase/functions
node tmp/migrate-chat-list-order.cjs
```

---

## 스펙 문서 업데이트 목록

### 📝 업데이트해야 할 문서

1. **`specs/repository/src/lib/components/DatabaseListView.svelte.md`**
   - reverse 옵션 제거
   - 정렬 로직 업데이트 (항상 오름차순)
   - Firebase 쿼리 변경 사항 명시

2. **`specs/sonub-forum-post.md`**
   - order 필드 추가
   - categoryOrder 역순 문자열 형식 설명
   - allCategoryOrder 음수 유지

3. **`specs/sonub-firebase-database-structure.md`**
   - 타임스탬프 필드 규칙 추가 (createdAt: 양수, order: 음수)
   - 정렬 필드 명명 규칙 명시

4. **`specs/sonub-firebase-functions.md`**
   - order-value.utils.ts 함수 설명 추가
   - 정렬 필드 생성 로직 업데이트

5. **`specs/sonub-design-workflow.md`**
   - DatabaseListView 사용 가이드 업데이트
   - reverse 옵션 제거 안내

---

## 예상 소요 시간

| Phase | 작업 | 예상 시간 |
|-------|------|----------|
| Phase 1 | Shared 유틸리티 함수 + 유닛 테스트 | 2시간 |
| Phase 2 | Backend 수정 (7개 핸들러) | 3시간 |
| Phase 3 | Frontend 수정 (DatabaseListView + 17개 사용처) | 4시간 |
| Phase 4 | 통합 테스트 | 2시간 |
| Phase 5 | 배포 및 검증 | 2시간 |
| 마이그레이션 | 스크립트 작성 및 실행 | 1시간 |
| 문서화 | 스펙 문서 업데이트 | 1시간 |
| **총계** | | **15시간** |

---

## 위험 요소 및 대응 방안

| 위험 요소 | 영향도 | 대응 방안 |
|----------|-------|----------|
| 기존 데이터 호환성 문제 | 높음 | Cloud Functions에서 자동 생성 + 마이그레이션 스크립트 |
| Firebase 쿼리 변경 오류 | 중간 | 충분한 테스트 + 단계별 배포 |
| 채팅 목록 정렬 오류 | 중간 | 음수 + Offset 방식으로 통일 + 통합 테스트 |
| 성능 저하 | 낮음 | Firebase 읽기 횟수 모니터링 |

---

## 전체 체크리스트

### ✅ Phase 1: Shared 유틸리티 (2시간)
- [ ] `shared/order-value.utils.ts` 생성
- [ ] 유닛 테스트 작성 (`tests/unit/order-value.utils.test.ts`)
- [ ] 테스트 실행 및 통과 확인

### ✅ Phase 2: Backend (3시간)
- [ ] `shared/categories.ts` 수정
- [ ] `post.create.handler.ts` 수정
- [ ] `chat.message-category.handler.ts` 수정
- [ ] `chat.message-create.handler.ts` 수정
- [ ] `comment.create.handler.ts` 수정
- [ ] `chat.room-create.handler.ts` 확인
- [ ] 통합 테스트 작성 및 실행
- [ ] `npm run deploy` 배포

### ✅ Phase 3: Frontend (4시간)
- [ ] DatabaseListView에서 reverse 제거
- [ ] limitToFirst/limitToLast 로직 수정
- [ ] PostListView 수정
- [ ] 17개 사용처 수정
- [ ] `npm run check` 타입 검사 통과

### ✅ Phase 4: 테스트 (2시간)
- [ ] 유닛 테스트 실행
- [ ] 통합 테스트 실행
- [ ] 수동 검증 (게시글, 채팅, 발자취)

### ✅ Phase 5: 배포 및 검증 (2시간)
- [ ] Backend 배포
- [ ] Frontend 빌드
- [ ] 로컬 테스트
- [ ] 프로덕션 배포
- [ ] 성능 검증

### ✅ 마이그레이션 (1시간)
- [ ] categoryOrder 마이그레이션 스크립트 작성 및 실행
- [ ] 채팅 목록 정렬 필드 마이그레이션 스크립트 작성 및 실행
- [ ] 데이터 무결성 확인

### ✅ 문서화 (1시간)
- [ ] 5개 스펙 문서 업데이트

---

**계획 작성 완료일:** 2025-11-20
**버전:** 2.0 (수정된 개념 반영)
**다음 단계:** Phase 1부터 순차적으로 작업 시작
