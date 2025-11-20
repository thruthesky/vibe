---
name: sonub-functions-number
title: Number Functions 명세
version: 1.0.0
description: 숫자 포맷 유틸리티 함수 - 천 단위 콤마 적용
author: JaeHo Song
email: thruthesky@gmail.com
license: GPL-3.0
created: 2025-01-20
updated: 2025-01-20
step: 30
priority: "*"
dependencies:
  - sonub-functions-overview.md
tags:
  - number
  - functions
  - utility
  - formatting
---

# Number Functions 명세

본 문서는 `src/lib/functions/number.functions.ts` 파일에 정의된 숫자 포맷 관련 함수의 역할과 사용 규칙을 설명합니다. 전역 규칙은 반드시 [sonub-functions-overview.md](./sonub-functions-overview.md)를 먼저 읽은 후 적용합니다.

---

## 1. 파일 구조

**소스 코드 위치**: [number.functions.ts.md](./repository/src/lib/functions/number.functions.ts.md)

```
src/
└── lib/
    └── functions/
        └── number.functions.ts   # 공통 숫자 포맷 함수
```

### 작성 규칙 요약

1. **순수 함수**: 부수 효과 없이 입력값을 포맷팅하여 반환
2. **국제화 지원**: `Intl.NumberFormat` API 사용
3. **안전한 fallback**: 잘못된 입력값에 대해 기본값 사용

---

## 2. 제공 함수 목록

### 2.1 `formatNumberWithComma()`

**소스 코드 위치**: [number.functions.ts.md](./repository/src/lib/functions/number.functions.ts.md)

```typescript
/**
 * 공통 숫자 포맷 함수
 * - 천 단위 콤마를 적용하여 가독성을 높입니다.
 * - 값이 없거나 숫자가 아니면 fallback 값을 대신 포맷합니다.
 */
export function formatNumberWithComma(
  value: unknown,
  fallback = 0
): string
```

#### 동작 방식

1. **입력 검증**: `value`가 유효한 숫자인지 확인
2. **fallback 적용**: 숫자가 아니거나 `Infinity`, `NaN`인 경우 `fallback` 값 사용
3. **포맷팅**: `Intl.NumberFormat('ko-KR')`을 사용하여 천 단위 콤마 적용

#### 내부 구현

```typescript
const commaFormatter = new Intl.NumberFormat('ko-KR');

export function formatNumberWithComma(value: unknown, fallback = 0): string {
  const numeric = typeof value === 'number' && Number.isFinite(value)
    ? value
    : fallback;
  return commaFormatter.format(numeric);
}
```

**최적화**:
- `commaFormatter`를 모듈 레벨에서 한 번만 생성하여 재사용
- 매번 새로운 `Intl.NumberFormat` 객체를 생성하지 않음

---

## 3. 사용 예시

### 3.1 기본 사용

```typescript
import { formatNumberWithComma } from '$lib/functions/number.functions';

// 숫자 포맷팅
formatNumberWithComma(1234);        // "1,234"
formatNumberWithComma(1234567);     // "1,234,567"
formatNumberWithComma(0);           // "0"
formatNumberWithComma(1000000000);  // "1,000,000,000"
```

### 3.2 fallback 사용

```typescript
// null/undefined 처리
formatNumberWithComma(null);        // "0" (기본 fallback)
formatNumberWithComma(undefined);   // "0"
formatNumberWithComma(null, 100);   // "100" (커스텀 fallback)

// NaN/Infinity 처리
formatNumberWithComma(NaN);         // "0"
formatNumberWithComma(Infinity);    // "0"

// 문자열 처리
formatNumberWithComma("abc");       // "0"
formatNumberWithComma("123", 50);   // "50" (문자열은 숫자로 변환되지 않음)
```

### 3.3 컴포넌트에서 사용

**PostItem.svelte - 좋아요 수 표시**:

```svelte
<script lang="ts">
  import { formatNumberWithComma } from '$lib/functions/number.functions';

  interface Props {
    message: {
      likeCount?: number;
      commentCount?: number;
      viewCount?: number;
    };
  }

  const { message }: Props = $props();
</script>

<div class="stats">
  <span>좋아요 {formatNumberWithComma(message.likeCount)}</span>
  <span>댓글 {formatNumberWithComma(message.commentCount)}</span>
  <span>조회수 {formatNumberWithComma(message.viewCount)}</span>
</div>

<!-- 출력 예시:
  좋아요 1,234
  댓글 56
  조회수 12,345
-->
```

**StatsCard.svelte - 통계 위젯**:

```svelte
<script lang="ts">
  import { formatNumberWithComma } from '$lib/functions/number.functions';

  let stats = $state({
    totalPosts: 15234,
    totalUsers: 4567,
    totalComments: 98765
  });
</script>

<div class="stat-item">
  <h3>총 게시글</h3>
  <p>{formatNumberWithComma(stats.totalPosts)}</p>
  <!-- "15,234" -->
</div>

<div class="stat-item">
  <h3>총 사용자</h3>
  <p>{formatNumberWithComma(stats.totalUsers)}</p>
  <!-- "4,567" -->
</div>

<div class="stat-item">
  <h3>총 댓글</h3>
  <p>{formatNumberWithComma(stats.totalComments)}</p>
  <!-- "98,765" -->
</div>
```

---

## 4. 적용 지침

### 4.1 사용해야 하는 경우

✅ **권장**:
- 좋아요 수 (`likeCount`)
- 댓글 수 (`commentCount`)
- 조회수 (`viewCount`)
- 팔로워 수 (`followerCount`)
- 게시글 수 (`postCount`)
- 모든 통계 숫자 (통계 위젯, 대시보드)

### 4.2 사용하지 않아야 하는 경우

❌ **비권장**:
- 날짜/시간 (별도의 date formatting 함수 사용)
- 통화 (currency formatting 필요 시 별도 함수 사용)
- 소수점 숫자 (예: 4.5점 평점)
- 백분율 (예: 75.5%)

### 4.3 국제화 (i18n) 고려사항

현재 `'ko-KR'` 로케일을 하드코딩하고 있습니다. 다국어 지원이 필요한 경우:

**개선 방안**:

```typescript
import { languageTag } from '$lib/paraglide/runtime';

// 사용자 언어에 따라 포맷터 생성
function getNumberFormatter() {
  const locale = languageTag();
  return new Intl.NumberFormat(locale);
}

export function formatNumberWithComma(value: unknown, fallback = 0): string {
  const numeric = typeof value === 'number' && Number.isFinite(value)
    ? value
    : fallback;
  return getNumberFormatter().format(numeric);
}
```

**결과**:
- 한국어 (`ko`): `1,234,567`
- 영어 (`en`): `1,234,567`
- 일본어 (`ja`): `1,234,567`
- 중국어 (`zh`): `1,234,567`

---

## 5. 테스트 시나리오

### 5.1 기본 포맷팅 테스트

- [ ] 양수가 정상적으로 포맷되는지 확인 (`1234` → `"1,234"`)
- [ ] 음수가 정상적으로 포맷되는지 확인 (`-1234` → `"-1,234"`)
- [ ] 0이 정상적으로 포맷되는지 확인 (`0` → `"0"`)
- [ ] 큰 숫자가 정상적으로 포맷되는지 확인 (`1234567890` → `"1,234,567,890"`)

### 5.2 fallback 테스트

- [ ] `null` 입력 시 `"0"`을 반환하는지 확인
- [ ] `undefined` 입력 시 `"0"`을 반환하는지 확인
- [ ] `NaN` 입력 시 `"0"`을 반환하는지 확인
- [ ] `Infinity` 입력 시 `"0"`을 반환하는지 확인
- [ ] 커스텀 fallback이 정상 동작하는지 확인 (`null, 100` → `"100"`)

### 5.3 엣지 케이스 테스트

- [ ] 문자열 입력 시 fallback을 사용하는지 확인
- [ ] 객체 입력 시 fallback을 사용하는지 확인
- [ ] 배열 입력 시 fallback을 사용하는지 확인

---

## 6. 사용 시나리오

### 6.1 게시글 통계 표시

```svelte
<script lang="ts">
  import { formatNumberWithComma } from '$lib/functions/number.functions';

  interface Message {
    likeCount?: number;
    commentCount?: number;
    viewCount?: number;
  }

  const { message }: { message: Message } = $props();
</script>

<div class="post-stats">
  <span class="stat-item">
    👍 {formatNumberWithComma(message.likeCount)}
  </span>
  <span class="stat-item">
    💬 {formatNumberWithComma(message.commentCount)}
  </span>
  <span class="stat-item">
    👁️ {formatNumberWithComma(message.viewCount)}
  </span>
</div>
```

### 6.2 사용자 프로필 통계

```svelte
<script lang="ts">
  import { formatNumberWithComma } from '$lib/functions/number.functions';
  import { getUserActionCounters } from '$lib/functions/user.functions';

  let counters = $state({ post: 0, comment: 0, like: 0 });

  $effect(() => {
    void loadCounters();
  });

  async function loadCounters() {
    counters = await getUserActionCounters(uid, ['post', 'comment', 'like']);
  }
</script>

<div class="user-stats">
  <div>게시글: {formatNumberWithComma(counters.post)}</div>
  <div>댓글: {formatNumberWithComma(counters.comment)}</div>
  <div>좋아요: {formatNumberWithComma(counters.like)}</div>
</div>
```

### 6.3 대시보드 통계

```svelte
<script lang="ts">
  import { formatNumberWithComma } from '$lib/functions/number.functions';

  let stats = $state({
    totalUsers: 0,
    totalPosts: 0,
    totalComments: 0,
    activeUsers: 0
  });

  // 통계 로드...
</script>

<div class="dashboard">
  <div class="stat-card">
    <h3>총 사용자</h3>
    <p class="big-number">{formatNumberWithComma(stats.totalUsers)}</p>
  </div>
  <div class="stat-card">
    <h3>총 게시글</h3>
    <p class="big-number">{formatNumberWithComma(stats.totalPosts)}</p>
  </div>
  <div class="stat-card">
    <h3>총 댓글</h3>
    <p class="big-number">{formatNumberWithComma(stats.totalComments)}</p>
  </div>
  <div class="stat-card">
    <h3>활성 사용자</h3>
    <p class="big-number">{formatNumberWithComma(stats.activeUsers)}</p>
  </div>
</div>
```

---

## 7. 관련 파일

### 7.1 연관 컴포넌트

- `src/lib/components/post/PostItem.svelte` - 게시글 통계 (좋아요, 댓글 수)
- `src/lib/components/sidebar/StatsCard.svelte` - 통계 위젯
- `src/routes/stats/+page.svelte` - 통계 페이지
- `src/routes/user/profile/+page.svelte` - 사용자 프로필 통계

### 7.2 관련 스펙 문서

- `specs/sonub-functions-overview.md` - Functions 전역 규칙
- `specs/sonub-stats-reactions.md` - 통계 시스템

---

## 8. 확장 가능성

### 8.1 추가 포맷 함수

필요 시 다음과 같은 함수들을 추가할 수 있습니다:

```typescript
/**
 * 통화 포맷 (예: 1234 → "₩1,234" 또는 "$1,234")
 */
export function formatCurrency(
  value: number,
  currency: 'KRW' | 'USD' = 'KRW'
): string {
  return new Intl.NumberFormat('ko-KR', {
    style: 'currency',
    currency
  }).format(value);
}

/**
 * 백분율 포맷 (예: 0.75 → "75%")
 */
export function formatPercent(value: number): string {
  return new Intl.NumberFormat('ko-KR', {
    style: 'percent',
    minimumFractionDigits: 0,
    maximumFractionDigits: 2
  }).format(value);
}

/**
 * 소수점 포맷 (예: 4.567 → "4.57")
 */
export function formatDecimal(
  value: number,
  fractionDigits: number = 2
): string {
  return new Intl.NumberFormat('ko-KR', {
    minimumFractionDigits: fractionDigits,
    maximumFractionDigits: fractionDigits
  }).format(value);
}
```

---

## 9. 작업 이력 (SED Log)

| 날짜 | 작업자 | 변경 내용 |
| ---- | ------ | -------- |
| 2025-01-20 | Claude Code | Number Functions 명세 최초 작성 |
