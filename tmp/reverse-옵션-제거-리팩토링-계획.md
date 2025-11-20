# DatabaseListView reverse 옵션 제거 리팩토링 상세 계획

**작성일:** 2025-11-20
**목표:** DatabaseListView의 reverse 옵션을 완전히 제거하고 모든 정렬 필드를 오름차순으로 통일

---

## 📋 목차
1. [개요](#개요)
2. [조사 결과 요약](#조사-결과-요약)
3. [Phase 1: Shared 유틸리티 함수](#phase-1-shared-유틸리티-함수)
4. [Phase 2: Backend 수정](#phase-2-backend-수정)
5. [Phase 3: Frontend 수정](#phase-3-frontend-수정)
6. [Phase 4: 테스트](#phase-4-테스트)
7. [Phase 5: 배포 및 검증](#phase-5-배포-및-검증)
8. [기존 데이터 마이그레이션 전략](#기존-데이터-마이그레이션-전략)

---

## 개요

### 🎯 목표
- DatabaseListView에서 `reverse` 옵션을 완전히 제거
- 모든 RTDB 정렬 필드를 **오름차순 값**으로만 저장
- 최신순 표시가 필요한 경우 **음수 값** 또는 **역순 문자열** 사용
- 로직 간소화 및 일관성 향상

### 🔑 핵심 원칙
1. **createdAt/updatedAt**: 모두 **음수**로 저장 (`-1710000000`)
2. **정렬 필드**: 모두 **음수** 또는 **역순 문자열**로 저장
3. **Firebase 쿼리**: 항상 **오름차순** (orderByChild + limitToFirst)
4. **클라이언트 정렬**: DatabaseListView에서 **reverse 옵션 제거**

### 📊 변경 범위
- **Backend:** 11개 Cloud Functions 파일
- **Frontend:** 17개 DatabaseListView 사용처
- **Shared:** 새로운 유틸리티 함수 추가
- **테스트:** 유닛 테스트 + 통합 테스트

---

## 조사 결과 요약

### ✅ 이미 올바르게 구현된 필드

| 필드명 | 현재 형식 | 저장 방식 | 상태 |
|--------|----------|----------|------|
| `allCategoryOrder` | `-1710000000` | 음수 타임스탬프 | ✅ 정상 |
| `singleChatListOrder` | `"2001710000000"` | Prefix + timestamp | ✅ 정상 |
| `allChatListOrder` | `"2001710000000"` | Prefix + timestamp | ✅ 정상 |
| `groupChatListOrder` | `"2001710000000"` | Prefix + timestamp | ✅ 정상 |
| `openChatListOrder` | `"2001710000000"` | Prefix + timestamp | ✅ 정상 |
| `groupListOrder` | `-1710000000` | 음수 타임스탬프 | ✅ 정상 |
| `openListOrder` | `-1710000000` | 음수 타임스탬프 | ✅ 정상 |
| `influencer-rankings` | `-150` | 음수 점수 | ✅ 정상 |
| `post-rankings` | `-150` | 음수 점수 | ✅ 정상 |

### ❌ 수정 필요한 필드

| 필드명 | 현재 형식 | 문제점 | 수정 후 형식 |
|--------|----------|--------|-------------|
| **categoryOrder** | `"qna-1710000000"` | 오래된순 정렬 | `"qna-8289999999999"` |
| **createdAt** | `1710000000` | 양수 저장 | `-1710000000` |
| **updatedAt** | `1710000000` | 양수 저장 | `-1710000000` |

### ⚠️ 확인 필요한 사용처

| 파일 | 문제 |
|------|------|
| `src/routes/chat/room/+page.svelte` | reverse 값 누락 |
| `src/lib/components/user/UserSearchDialog.svelte` | reverse 값 누락 |

---

## Phase 1: Shared 유틸리티 함수

### 📁 파일 생성: `shared/order-value.utils.ts`

**목적:** Backend와 Frontend에서 공통으로 사용할 순수 함수 제공

```typescript
/**
 * 정렬 값 유틸리티 함수 (Pure Functions)
 *
 * Firebase Realtime Database의 모든 정렬 필드는 오름차순 값으로 저장됩니다.
 * 최신순 정렬이 필요한 경우 음수 타임스탬프 또는 역순 문자열을 사용합니다.
 */

/**
 * 최대 타임스탬프 값 (밀리초 기준)
 * 9999년 12월 31일 23:59:59.999 = 253402300799999ms
 */
export const MAX_TIMESTAMP = 9_999_999_999_999;

/**
 * 양수 타임스탬프를 음수로 변환
 *
 * @param timestamp - 양수 타임스탬프 (밀리초)
 * @returns 음수 타임스탬프
 * @example
 * getInvertedTimestamp(1710000000000) // -1710000000000
 */
export function getInvertedTimestamp(timestamp: number): number {
  if (timestamp > 0) {
    return -timestamp;
  }
  // 이미 음수인 경우 그대로 반환
  return timestamp;
}

/**
 * 음수 타임스탬프를 양수로 변환 (날짜 표시용)
 *
 * @param invertedTimestamp - 음수 타임스탬프
 * @returns 양수 타임스탬프
 * @example
 * getPositiveTimestamp(-1710000000000) // 1710000000000
 */
export function getPositiveTimestamp(invertedTimestamp: number): number {
  return Math.abs(invertedTimestamp);
}

/**
 * 카테고리 정렬 필드 생성 (역순 문자열)
 *
 * Firebase는 문자열을 사전순(lexicographical)으로 오름차순 정렬합니다.
 * 최신 게시글을 위에 표시하려면 타임스탬프를 역순으로 저장해야 합니다.
 *
 * @param category - 카테고리 이름 (예: "qna", "free")
 * @param timestamp - 양수 또는 음수 타임스탬프
 * @returns 카테고리 정렬 필드 (예: "qna-8289999999999")
 * @example
 * getInvertedCategoryOrder("qna", 1710000000000) // "qna-8289999999999"
 * getInvertedCategoryOrder("qna", -1710000000000) // "qna-8289999999999"
 */
export function getInvertedCategoryOrder(category: string, timestamp: number): string {
  // 음수인 경우 양수로 변환
  const positiveTimestamp = Math.abs(timestamp);

  // 역순 타임스탬프 계산
  const invertedTimestamp = MAX_TIMESTAMP - positiveTimestamp;

  return `${category}-${invertedTimestamp}`;
}

/**
 * 역순 문자열에서 원본 타임스탬프 추출
 *
 * @param invertedCategoryOrder - 역순 카테고리 정렬 필드 (예: "qna-8289999999999")
 * @returns 양수 타임스탬프
 * @example
 * extractTimestampFromInvertedOrder("qna-8289999999999") // 1710000000000
 */
export function extractTimestampFromInvertedOrder(invertedCategoryOrder: string): number {
  const parts = invertedCategoryOrder.split('-');
  if (parts.length < 2) {
    throw new Error('Invalid inverted category order format');
  }

  // 마지막 부분이 역순 타임스탬프
  const invertedTimestamp = Number(parts[parts.length - 1]);

  // 원본 타임스탬프 복원
  return MAX_TIMESTAMP - invertedTimestamp;
}
```

### 🧪 유닛 테스트: `firebase/functions/tests/unit/order-value.utils.test.ts`

```typescript
import { describe, it, expect } from 'vitest';
import {
  MAX_TIMESTAMP,
  getInvertedTimestamp,
  getPositiveTimestamp,
  getInvertedCategoryOrder,
  extractTimestampFromInvertedOrder,
} from '../../../../shared/order-value.utils';

describe('order-value.utils', () => {
  const testTimestamp = 1710000000000;

  describe('getInvertedTimestamp', () => {
    it('양수 타임스탬프를 음수로 변환', () => {
      expect(getInvertedTimestamp(testTimestamp)).toBe(-testTimestamp);
    });

    it('이미 음수인 경우 그대로 반환', () => {
      expect(getInvertedTimestamp(-testTimestamp)).toBe(-testTimestamp);
    });
  });

  describe('getPositiveTimestamp', () => {
    it('음수 타임스탬프를 양수로 변환', () => {
      expect(getPositiveTimestamp(-testTimestamp)).toBe(testTimestamp);
    });

    it('양수인 경우에도 절대값 반환', () => {
      expect(getPositiveTimestamp(testTimestamp)).toBe(testTimestamp);
    });
  });

  describe('getInvertedCategoryOrder', () => {
    it('양수 타임스탬프로 역순 카테고리 순서 생성', () => {
      const result = getInvertedCategoryOrder('qna', testTimestamp);
      const expected = `qna-${MAX_TIMESTAMP - testTimestamp}`;
      expect(result).toBe(expected);
    });

    it('음수 타임스탬프로 역순 카테고리 순서 생성', () => {
      const result = getInvertedCategoryOrder('qna', -testTimestamp);
      const expected = `qna-${MAX_TIMESTAMP - testTimestamp}`;
      expect(result).toBe(expected);
    });

    it('최신 타임스탬프가 더 큰 문자열 값을 가짐 (오름차순 정렬 시 최신이 나중)', () => {
      const older = getInvertedCategoryOrder('qna', 1700000000000);
      const newer = getInvertedCategoryOrder('qna', 1710000000000);

      // 문자열 비교: 최신 글이 더 작은 값
      expect(newer < older).toBe(true);
    });
  });

  describe('extractTimestampFromInvertedOrder', () => {
    it('역순 카테고리 순서에서 원본 타임스탬프 추출', () => {
      const inverted = getInvertedCategoryOrder('qna', testTimestamp);
      const extracted = extractTimestampFromInvertedOrder(inverted);
      expect(extracted).toBe(testTimestamp);
    });

    it('잘못된 형식은 에러 발생', () => {
      expect(() => extractTimestampFromInvertedOrder('invalid')).toThrow();
    });
  });
});
```

---

## Phase 2: Backend 수정

### 2.1 수정 필요한 파일 목록

| 파일 | 수정 내용 |
|------|----------|
| `shared/categories.ts` | `createCategoryOrder()` 함수 수정 |
| `firebase/functions/src/handlers/post.create.handler.ts` | createdAt 음수 저장, categoryOrder 역순 |
| `firebase/functions/src/handlers/chat.message-category.handler.ts` | createdAt 음수 저장, categoryOrder 역순 |
| `firebase/functions/src/handlers/chat.message-create.handler.ts` | createdAt, updatedAt 음수 저장 |
| `firebase/functions/src/handlers/chat.room-create.handler.ts` | createdAt 음수 저장 |
| `firebase/functions/src/handlers/comment.create.handler.ts` | createdAt 음수 저장 |
| `firebase/functions/src/handlers/user.create.handler.ts` | createdAt 음수 저장 |

### 2.2 상세 수정 내용

#### 📄 `shared/categories.ts` 수정

**현재 코드 (Line 99):**
```typescript
export function createCategoryOrder(category: ForumCategory, timestamp: number): string {
  return `${category}-${Number(timestamp)}`;
}
```

**수정 후:**
```typescript
import { getInvertedCategoryOrder } from './order-value.utils';

export function createCategoryOrder(category: ForumCategory, timestamp: number): string {
  return getInvertedCategoryOrder(category, timestamp);
}
```

---

#### 📄 `firebase/functions/src/handlers/post.create.handler.ts` 수정

**현재 코드 (Lines 66-68):**
```typescript
const createdAt = snapshot.val().createdAt || Date.now();
const categoryOrder = `${category}-${Number(createdAt)}`;
const allCategoryOrder = -Number(createdAt);
```

**수정 후:**
```typescript
import { getInvertedTimestamp, getInvertedCategoryOrder } from '../../../shared/order-value.utils';

// createdAt을 음수로 저장 (새로 생성되는 경우에만)
let createdAt = snapshot.val().createdAt;
if (!createdAt) {
  createdAt = getInvertedTimestamp(Date.now());
}

// categoryOrder를 역순 문자열로 생성
const categoryOrder = getInvertedCategoryOrder(category, createdAt);

// allCategoryOrder는 createdAt과 동일 (이미 음수)
const allCategoryOrder = createdAt;
```

**주의사항:**
- 기존 게시글의 createdAt은 양수일 수 있으므로, **신규 생성 시에만** 음수로 저장
- 기존 게시글 수정 시에는 createdAt을 변경하지 않음

---

#### 📄 `firebase/functions/src/handlers/chat.message-category.handler.ts` 수정

**현재 코드 (Lines 99, 144):**
```typescript
const categoryOrder = createCategoryOrder(category, timestamp);
const allCategoryOrder = -Number(createdAt);
```

**수정 후:**
```typescript
import { getInvertedTimestamp } from '../../../shared/order-value.utils';

// createdAt이 음수인지 확인
const invertedCreatedAt = getInvertedTimestamp(createdAt);

// categoryOrder는 createCategoryOrder 함수 사용 (이미 수정됨)
const categoryOrder = createCategoryOrder(category, invertedCreatedAt);

// allCategoryOrder는 createdAt과 동일
const allCategoryOrder = invertedCreatedAt;
```

---

#### 📄 `firebase/functions/src/handlers/chat.message-create.handler.ts` 수정

**현재 코드 (Line 77):**
```typescript
const createdAt = snapshot.val().createdAt || Date.now();
```

**수정 후:**
```typescript
import { getInvertedTimestamp } from '../../../shared/order-value.utils';

let createdAt = snapshot.val().createdAt;
if (!createdAt) {
  createdAt = getInvertedTimestamp(Date.now());
}
```

**updatedAt 수정 (Lines 110, 122, 208):**
```typescript
// 현재 코드
const timestamp = Date.now();
updates[`${basePath}/updatedAt`] = timestamp;

// 수정 후
const timestamp = getInvertedTimestamp(Date.now());
updates[`${basePath}/updatedAt`] = timestamp;
```

---

#### 📄 `firebase/functions/src/handlers/chat.room-create.handler.ts` 수정

**현재 코드 (Lines 88, 103):**
```typescript
const createdAt = snapshot.val().createdAt || Date.now();
```

**수정 후:**
```typescript
import { getInvertedTimestamp } from '../../../shared/order-value.utils';

let createdAt = snapshot.val().createdAt;
if (!createdAt) {
  createdAt = getInvertedTimestamp(Date.now());
}
```

**listOrder 수정 (Line 155):**
```typescript
// 현재 코드
const listOrder = -timestamp;

// 수정 후 (이미 createdAt이 음수이므로 그대로 사용)
const listOrder = createdAt;
```

---

#### 📄 `firebase/functions/src/handlers/comment.create.handler.ts` 수정

**현재 코드:**
```typescript
const createdAt = snapshot.val().createdAt || Date.now();
```

**수정 후:**
```typescript
import { getInvertedTimestamp } from '../../../shared/order-value.utils';

let createdAt = snapshot.val().createdAt;
if (!createdAt) {
  createdAt = getInvertedTimestamp(Date.now());
}
```

---

#### 📄 `firebase/functions/src/handlers/user.create.handler.ts` 수정

**현재 코드:**
```typescript
const createdAt = snapshot.val().createdAt || Date.now();
```

**수정 후:**
```typescript
import { getInvertedTimestamp } from '../../../shared/order-value.utils';

let createdAt = snapshot.val().createdAt;
if (!createdAt) {
  createdAt = getInvertedTimestamp(Date.now());
}
```

---

### 2.3 Backend 수정 체크리스트

- [ ] `shared/order-value.utils.ts` 생성
- [ ] `shared/categories.ts` 수정
- [ ] `post.create.handler.ts` 수정
- [ ] `chat.message-category.handler.ts` 수정
- [ ] `chat.message-create.handler.ts` 수정
- [ ] `chat.room-create.handler.ts` 수정
- [ ] `comment.create.handler.ts` 수정
- [ ] `user.create.handler.ts` 수정
- [ ] 유닛 테스트 작성 및 실행
- [ ] `npm run deploy` 배포

---

## Phase 3: Frontend 수정

### 3.1 날짜 표시 유틸리티 함수 생성

**파일:** `src/lib/utils/date.utils.ts`

```typescript
import { getPositiveTimestamp } from '../../../shared/order-value.utils';

/**
 * 음수 타임스탬프를 양수로 변환 (날짜 표시용)
 *
 * Firebase RTDB에 저장된 createdAt/updatedAt은 음수 값입니다.
 * 날짜 라이브러리(date-fns, Day.js 등)에서 사용하려면 양수로 변환해야 합니다.
 *
 * @param timestamp - 음수 또는 양수 타임스탬프
 * @returns 양수 타임스탬프
 * @example
 * // 음수 타임스탬프 → 양수
 * toPositiveTimestamp(-1710000000000) // 1710000000000
 *
 * // 이미 양수인 경우 (기존 데이터 호환)
 * toPositiveTimestamp(1710000000000) // 1710000000000
 */
export function toPositiveTimestamp(timestamp: number | undefined | null): number {
  if (timestamp == null) {
    return 0;
  }
  return getPositiveTimestamp(timestamp);
}

/**
 * Date 객체로 변환 (음수 타임스탬프 자동 처리)
 *
 * @param timestamp - 음수 또는 양수 타임스탬프
 * @returns Date 객체
 * @example
 * toDate(-1710000000000) // Date 객체
 */
export function toDate(timestamp: number | undefined | null): Date {
  return new Date(toPositiveTimestamp(timestamp));
}
```

---

### 3.2 DatabaseListView 컴포넌트 수정

**파일:** `src/lib/components/DatabaseListView.svelte`

#### Step 1: Props에서 reverse 제거

**현재 코드 (Line 125):**
```typescript
let {
  // ... 기타 props
  reverse = false,
  // ... 기타 props
}: Props = $props();
```

**수정 후:**
```typescript
let {
  // ... 기타 props
  // reverse 제거됨
  // ... 기타 props
}: Props = $props();
```

#### Step 2: 정렬 로직 제거

**현재 코드 (Lines 1062-1088):**
```typescript
loadedItems.sort((a, b) => {
  const aValue = a.data[orderBy];
  const bValue = b.data[orderBy];

  // ... null 처리

  // reverse 조건부 정렬
  if (reverse && scrollTrigger !== 'top') {
    // 내림차순
    return typeof aValue === 'string'
      ? bValue.localeCompare(aValue)
      : Number(bValue) - Number(aValue);
  } else {
    // 오름차순
    return typeof aValue === 'string'
      ? aValue.localeCompare(bValue)
      : Number(aValue) - Number(bValue);
  }
});
```

**수정 후 (항상 오름차순만):**
```typescript
loadedItems.sort((a, b) => {
  const aValue = a.data[orderBy];
  const bValue = b.data[orderBy];

  // null/undefined 처리
  if (aValue == null && bValue == null) return 0;
  if (aValue == null) return 1;
  if (bValue == null) return -1;

  // 항상 오름차순 정렬 (Firebase RTDB 정렬과 동일)
  if (typeof aValue === 'string' && typeof bValue === 'string') {
    return aValue.localeCompare(bValue);  // 문자열 오름차순
  } else {
    return Number(aValue) - Number(bValue);  // 숫자 오름차순
  }
});
```

#### Step 3: Firebase 쿼리 수정

**현재 코드 (Lines 948-996):**
```typescript
if (reverse || scrollTrigger === 'top') {
  // limitToLast 사용
  dataQuery = query(baseRef, orderByChild(orderBy), startAt(false), limitToLast(pageSize + 1));
} else {
  // limitToFirst 사용
  dataQuery = query(baseRef, orderByChild(orderBy), startAt(false), limitToFirst(pageSize + 1));
}
```

**수정 후 (항상 limitToFirst):**
```typescript
// 항상 오름차순 쿼리 사용
dataQuery = query(
  baseRef,
  orderByChild(orderBy),
  startAt(false),
  limitToFirst(pageSize + 1)
);
```

#### Step 4: loadMore() 함수 수정

**현재 코드 (Lines 1294-1348):**
```typescript
if (reverse) {
  // endBefore + limitToLast 사용
  dataQuery = query(/* ... */);
} else {
  // startAfter + limitToFirst 사용
  dataQuery = query(/* ... */);
}
```

**수정 후 (항상 startAfter + limitToFirst):**
```typescript
// 항상 오름차순 페이지네이션
dataQuery = query(
  baseRef,
  orderByChild(orderBy),
  startAfter(lastOrderValue, lastItemKey),
  limitToFirst(pageSize + 1)
);
```

---

### 3.3 모든 DatabaseListView 사용처 수정

**수정해야 할 파일 (17개):**

| 파일 | 현재 reverse | 수정 필요 |
|------|-------------|----------|
| `src/lib/components/post/PostListView.svelte` | 조건부 | ✅ 제거 |
| `src/routes/post/list/+page.svelte` | `true` | ✅ 제거 |
| `src/routes/my/reactions/+page.svelte` | `true` | ✅ 제거 |
| `src/routes/my/activity/+page.svelte` | `true` | ✅ 제거 |
| `src/routes/chat/room/+page.svelte` | 누락 | ✅ 확인 후 제거 |
| `src/routes/user/list/+page.svelte` | `false` | ❌ 유지 (정순 정렬) |
| `src/routes/chat/list/+page.svelte` | `true` | ✅ 제거 |
| `src/routes/chat/open-chat-list/+page.svelte` | `true` | ✅ 제거 |
| `src/routes/chat/group-chat-list/+page.svelte` | `true` | ✅ 제거 |
| `src/lib/components/chat/ChatInvitationList.svelte` | `true` | ✅ 제거 |
| `src/routes/dev/test/database-list-view/+page.svelte` | 변수 | ⚠️ 테스트용, 별도 처리 |
| `src/routes/chat/room/+layout.svelte` | `true` | ✅ 제거 |
| `src/lib/components/user/UserSearchDialog.svelte` | 누락 | ✅ 확인 후 제거 |

**수정 예시 (`src/lib/components/post/PostListView.svelte`):**

**현재 코드 (Lines 106-108):**
```svelte
<DatabaseListView
  orderBy={category ? 'categoryOrder' : 'allCategoryOrder'}
  orderPrefix={category ? `${category}-` : ''}
  reverse={category ? true : false}
  newItemPosition="top"
>
```

**수정 후:**
```svelte
<DatabaseListView
  orderBy={category ? 'categoryOrder' : 'allCategoryOrder'}
  orderPrefix={category ? `${category}-` : ''}
  newItemPosition="top"
>
```

---

### 3.4 날짜 표시 부분 수정

**수정해야 할 패턴:**
```typescript
// 현재 코드
formatDistanceToNow(message.createdAt)

// 수정 후
import { toDate } from '$lib/utils/date.utils';
formatDistanceToNow(toDate(message.createdAt))
```

**주요 파일:**
- `src/lib/components/post/PostItem.svelte`
- `src/lib/components/chat/ChatMessage.svelte`
- `src/routes/my/activity/+page.svelte`
- `src/routes/my/reactions/+page.svelte`
- 기타 날짜를 표시하는 모든 컴포넌트

---

### 3.5 Frontend 수정 체크리스트

- [ ] `src/lib/utils/date.utils.ts` 생성
- [ ] DatabaseListView에서 reverse 옵션 제거
- [ ] PostListView에서 reverse 제거
- [ ] 17개 사용처에서 reverse prop 제거
- [ ] 모든 날짜 표시 부분에 `toDate()` 적용
- [ ] `npm run check` 타입 검사

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

### 4.2 통합 테스트

**실행 명령:**
```bash
cd firebase/functions
npm run test:integration
```

**테스트 시나리오:**
1. 게시글 생성 → createdAt 음수 확인
2. categoryOrder 역순 확인
3. allCategoryOrder와 createdAt 동일 확인
4. 채팅 메시지 생성 → createdAt 음수 확인
5. 정렬 순서 검증 (최신순)

**테스트 작성 예시:**
```typescript
// firebase/functions/tests/integration/post.test.ts
import { describe, it, expect, beforeEach, afterAll } from 'vitest';
import { initializeApp, cert } from 'firebase-admin/app';
import { getDatabase } from 'firebase-admin/database';
import { getInvertedTimestamp, getInvertedCategoryOrder, MAX_TIMESTAMP } from '../../../shared/order-value.utils';

describe('게시글 정렬 필드 통합 테스트', () => {
  it('createdAt이 음수로 저장되어야 함', async () => {
    const postRef = database.ref('posts').push();
    await postRef.set({
      category: 'qna',
      text: '테스트 게시글',
      uid: 'test-user',
    });

    // Cloud Functions 실행 대기
    await new Promise(resolve => setTimeout(resolve, 3000));

    const snapshot = await postRef.once('value');
    const post = snapshot.val();

    expect(post.createdAt).toBeLessThan(0); // 음수 확인
  });

  it('categoryOrder가 역순 문자열로 저장되어야 함', async () => {
    const postRef = database.ref('posts').push();
    const timestamp = Date.now();

    await postRef.set({
      category: 'qna',
      text: '테스트 게시글',
      uid: 'test-user',
      createdAt: getInvertedTimestamp(timestamp),
    });

    await new Promise(resolve => setTimeout(resolve, 3000));

    const snapshot = await postRef.once('value');
    const post = snapshot.val();

    const expectedCategoryOrder = getInvertedCategoryOrder('qna', timestamp);
    expect(post.categoryOrder).toBe(expectedCategoryOrder);
  });

  it('최신 게시글이 오름차순 정렬 시 위에 표시되어야 함', async () => {
    const olderPost = database.ref('posts').push();
    const newerPost = database.ref('posts').push();

    const olderTimestamp = Date.now() - 10000;
    const newerTimestamp = Date.now();

    await olderPost.set({
      category: 'qna',
      text: '오래된 게시글',
      uid: 'test-user',
      createdAt: getInvertedTimestamp(olderTimestamp),
    });

    await newerPost.set({
      category: 'qna',
      text: '최신 게시글',
      uid: 'test-user',
      createdAt: getInvertedTimestamp(newerTimestamp),
    });

    await new Promise(resolve => setTimeout(resolve, 3000));

    const snapshot = await database.ref('posts')
      .orderByChild('allCategoryOrder')
      .limitToFirst(2)
      .once('value');

    const posts: any[] = [];
    snapshot.forEach((child) => {
      posts.push({ key: child.key, ...child.val() });
    });

    // 오름차순 정렬 시 최신 게시글이 먼저 나와야 함
    expect(posts[0].key).toBe(newerPost.key);
    expect(posts[1].key).toBe(olderPost.key);
  });
});
```

---

## Phase 5: 배포 및 검증

### 5.1 배포 순서

1. **Backend 배포:**
   ```bash
   cd firebase/functions
   npm run deploy
   ```

2. **Frontend 빌드 및 확인:**
   ```bash
   npm run check
   npm run build
   ```

3. **로컬 테스트:**
   ```bash
   npm run dev
   ```

### 5.2 수동 검증 체크리스트

- [ ] 게시글 목록 페이지 (`/post/list`) 정렬 확인
- [ ] 카테고리별 필터링 정렬 확인
- [ ] 채팅방 목록 정렬 확인
- [ ] 채팅 메시지 정렬 확인
- [ ] 나의 발자취 페이지 정렬 확인
- [ ] 받은 반응 페이지 정렬 확인
- [ ] 날짜 표시 정상 여부 확인

### 5.3 성능 검증

- [ ] 무한 스크롤 정상 작동 확인
- [ ] Firebase 쿼리 성능 확인 (Console에서 읽기 횟수 체크)
- [ ] 페이지 로딩 속도 확인

---

## 기존 데이터 마이그레이션 전략

### ⚠️ 중요: 기존 데이터 호환성 문제

**문제:**
- 기존 데이터: `createdAt = 1710000000` (양수)
- 새 데이터: `createdAt = -1710000000` (음수)
- 혼재 시 정렬 오류 발생

### 해결 방법 1: 점진적 마이그레이션 (권장)

**장점:**
- 배포 중단 없음
- 기존 데이터 보존

**구현 방법:**
1. Backend에서 createdAt 확인 후 처리:
   ```typescript
   // 양수인 경우 음수로 변환 후 저장
   if (createdAt > 0) {
     createdAt = -createdAt;
     await ref.update({ createdAt });
   }
   ```

2. Frontend에서 양수/음수 모두 처리:
   ```typescript
   // date.utils.ts에서 이미 Math.abs() 사용하므로 호환됨
   export function toPositiveTimestamp(timestamp: number): number {
     return Math.abs(timestamp); // 양수든 음수든 양수로 변환
   }
   ```

### 해결 방법 2: 일괄 마이그레이션 스크립트

**구현:**
```typescript
// firebase/functions/tmp/migrate-timestamps.cjs
const admin = require('firebase-admin');
const serviceAccount = require('../firebase-service-account-key.json');

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  databaseURL: 'https://sonub-default-rtdb.firebaseio.com',
});

const database = admin.database();

async function migrateTimestamps() {
  const nodes = ['posts', 'chat-messages', 'chat-rooms', 'comments'];

  for (const node of nodes) {
    console.log(`\n마이그레이션 시작: /${node}`);

    const snapshot = await database.ref(node).once('value');
    const updates = {};
    let count = 0;

    snapshot.forEach((child) => {
      const data = child.val();

      // createdAt이 양수인 경우 음수로 변환
      if (data.createdAt && data.createdAt > 0) {
        updates[`${child.key}/createdAt`] = -data.createdAt;
        count++;
      }

      // updatedAt이 양수인 경우 음수로 변환
      if (data.updatedAt && data.updatedAt > 0) {
        updates[`${child.key}/updatedAt`] = -data.updatedAt;
      }
    });

    if (Object.keys(updates).length > 0) {
      await database.ref(node).update(updates);
      console.log(`✅ ${node}: ${count}개 항목 마이그레이션 완료`);
    } else {
      console.log(`ℹ️ ${node}: 마이그레이션 필요 없음`);
    }
  }

  console.log('\n🎉 모든 마이그레이션 완료!');
  await admin.app().delete();
}

migrateTimestamps().catch(console.error);
```

**실행:**
```bash
cd firebase/functions
node tmp/migrate-timestamps.cjs
```

---

## 스펙 문서 업데이트 목록

- [ ] `specs/repository/src/lib/components/DatabaseListView.svelte.md`
  - reverse 옵션 제거
  - 정렬 로직 업데이트

- [ ] `specs/sonub-forum-post.md`
  - categoryOrder 형식 변경
  - createdAt 음수 저장 명시

- [ ] `specs/sonub-firebase-database-structure.md`
  - 타임스탬프 필드 음수 저장 규칙 추가

- [ ] `specs/sonub-firebase-functions.md`
  - order-value.utils.ts 함수 설명 추가

- [ ] `specs/sonub-design-workflow.md`
  - DatabaseListView 사용 가이드 업데이트

---

## 예상 소요 시간

| Phase | 작업 | 예상 시간 |
|-------|------|----------|
| Phase 1 | Shared 유틸리티 함수 | 1시간 |
| Phase 2 | Backend 수정 | 2시간 |
| Phase 3 | Frontend 수정 | 3시간 |
| Phase 4 | 테스트 | 2시간 |
| Phase 5 | 배포 및 검증 | 1시간 |
| **총계** | | **9시간** |

---

## 위험 요소 및 대응 방안

| 위험 요소 | 영향도 | 대응 방안 |
|----------|-------|----------|
| 기존 데이터 호환성 문제 | 높음 | 점진적 마이그레이션 + Math.abs() 처리 |
| Firebase 쿼리 변경 오류 | 중간 | 충분한 테스트 + 롤백 계획 |
| 날짜 표시 오류 | 낮음 | toDate() 함수 철저한 적용 |
| 성능 저하 | 낮음 | Firebase 읽기 횟수 모니터링 |

---

## 체크리스트 요약

### ✅ Phase 1: Shared 유틸리티
- [ ] `shared/order-value.utils.ts` 생성
- [ ] 유닛 테스트 작성 및 통과

### ✅ Phase 2: Backend
- [ ] `shared/categories.ts` 수정
- [ ] 7개 핸들러 파일 수정
- [ ] 통합 테스트 실행
- [ ] `npm run deploy` 배포

### ✅ Phase 3: Frontend
- [ ] `src/lib/utils/date.utils.ts` 생성
- [ ] DatabaseListView 수정
- [ ] 17개 사용처 수정
- [ ] 날짜 표시 부분 수정
- [ ] `npm run check` 통과

### ✅ Phase 4: 테스트
- [ ] 유닛 테스트 실행
- [ ] 통합 테스트 실행
- [ ] 수동 검증

### ✅ Phase 5: 배포
- [ ] Backend 배포
- [ ] Frontend 빌드
- [ ] 로컬 테스트
- [ ] 프로덕션 배포

### ✅ 스펙 문서
- [ ] 5개 스펙 문서 업데이트

---

**계획 작성 완료일:** 2025-11-20
**다음 단계:** Phase 1부터 순차적으로 작업 시작
