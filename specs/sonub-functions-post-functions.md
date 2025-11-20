---
name: sonub-functions-post
title: Post Functions 명세
version: 1.0.0
description: 게시글 관련 함수 - 인기 게시글, 필드 읽기, RTDB 비용 최적화
author: JaeHo Song
email: thruthesky@gmail.com
license: GPL-3.0
created: 2025-01-20
updated: 2025-01-20
step: 30
priority: "*"
dependencies:
  - sonub-functions-overview.md
  - sonub-firebase-database-structure.md
  - sonub-popular-posts.md
tags:
  - post
  - functions
  - RTDB
  - optimization
---

# Post Functions 명세

본 문서는 `src/lib/functions/post.functions.ts` 파일에 정의된 게시글 관련 함수의 역할과 사용 규칙을 설명합니다. 전역 규칙은 반드시 [sonub-functions-overview.md](./sonub-functions-overview.md)를 먼저 읽은 후 적용합니다.

---

## 1. 파일 구조

**소스 코드 위치**: [post.functions.ts.md](./repository/src/lib/functions/post.functions.ts.md)

```
src/
└── lib/
    └── functions/
        └── post.functions.ts   # 게시글 관련 유틸리티 함수
```

### 핵심 원칙: RTDB 비용 최적화

⚠️ **중요**: 이 파일의 모든 함수는 **RTDB 읽기 비용 최적화**를 최우선 목표로 설계되었습니다.

**비용 절감 전략**:
1. **전체 노드 읽기 금지**: `/posts/{postId}` 전체가 아닌 `/posts/{postId}/{field}`만 읽기
2. **병렬 읽기**: `Promise.all()`을 사용하여 여러 필드를 동시에 읽기
3. **필요한 필드만 요청**: 사용하지 않는 필드는 절대 읽지 않음

---

## 2. 제공 함수 목록

### 2.1 인기 게시글 함수

#### 2.1.1 `formatDate()`

**소스 코드 위치**: [post.functions.ts.md](./repository/src/lib/functions/post.functions.ts.md)

```typescript
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
export function formatDate(
  date: Date,
  period: 'daily' | 'weekly' | 'monthly'
): string
```

**ISO Week 계산**:
- ISO 8601 기준 사용
- 주의 시작은 월요일
- 1월 4일이 포함된 주가 1주차

**사용 예시**:

```typescript
const today = new Date('2025-01-20');

formatDate(today, 'daily');    // "20250120"
formatDate(today, 'weekly');   // "2025W03"
formatDate(today, 'monthly');  // "202501"
```

---

#### 2.1.2 `getPopularPosts()`

**소스 코드 위치**: [post.functions.ts.md](./repository/src/lib/functions/post.functions.ts.md)

```typescript
/**
 * 인기 게시글 순위 데이터 가져오기
 *
 * @param period - 기간 타입 ('daily' | 'weekly' | 'monthly')
 * @param limit - 가져올 게시글 수 (기본값: 100)
 * @returns 게시글 ID와 점수 배열
 */
export async function getPopularPosts(
  period: 'daily' | 'weekly' | 'monthly',
  limit: number = 100
): Promise<Array<{ postId: string; score: number }>>
```

**RTDB 경로**:
```
/post-rankings/{period}/{dateKey}
```

**점수 저장 방식**:
- Firebase RTDB는 **음수 값으로 저장**하여 `orderByValue()` + `limitToFirst()`로 내림차순 정렬
- 예: 점수 150 → `-150`으로 저장
- 클라이언트에서 절댓값 변환하여 표시

**사용 예시**:

```typescript
// 오늘의 인기 게시글 Top 10
const dailyTop10 = await getPopularPosts('daily', 10);

dailyTop10.forEach((post, index) => {
  console.log(`${index + 1}. ${post.postId} (점수: ${post.score})`);
});

// 이번 주 인기 게시글 Top 100
const weeklyTop100 = await getPopularPosts('weekly', 100);

// 이번 달 인기 게시글 Top 20
const monthlyTop20 = await getPopularPosts('monthly', 20);
```

**반환 데이터 구조**:

```typescript
[
  { postId: "post123", score: 150 },
  { postId: "post456", score: 120 },
  { postId: "post789", score: 95 }
]
```

**Cloud Functions 연동**:
- Cloud Functions가 `/post-rankings` 경로를 자동 업데이트
- 좋아요, 댓글, 조회수 등을 종합하여 점수 계산
- 매일 자정(UTC)에 일간/주간/월간 순위 갱신

---

### 2.2 게시글 필드 읽기 함수

#### 2.2.1 `getPostField()`

**소스 코드 위치**: [post.functions.ts.md](./repository/src/lib/functions/post.functions.ts.md)

```typescript
/**
 * 게시글의 특정 필드 하나만 읽어옵니다.
 *
 * ⚠️ 중요: 전체 게시글 노드가 아닌 특정 필드만 읽어서 RTDB 비용 절감
 *
 * @param postId - 게시글 ID
 * @param field - 읽어올 필드명
 * @returns 필드 값 또는 null
 */
export async function getPostField(
  postId: string,
  field: string
): Promise<string | number | null>
```

**비용 절감 효과**:

❌ **나쁜 예** (전체 노드 읽기):
```typescript
const postRef = ref(rtdb, `posts/${postId}`);  // 전체 게시글 데이터 읽기
const snapshot = await get(postRef);
const title = snapshot.val()?.title;  // 비효율적!
```

✅ **좋은 예** (필드만 읽기):
```typescript
const title = await getPostField(postId, 'title');  // title만 읽기
// RTDB 비용 90% 이상 절감!
```

**사용 예시**:

```typescript
// 게시글 제목만 필요한 경우
const title = await getPostField('post123', 'title');

// 게시글 텍스트만 필요한 경우
const text = await getPostField('post123', 'text');

// 작성자 UID만 필요한 경우
const authorUid = await getPostField('post123', 'authorUid');
```

---

#### 2.2.2 `getPostFields()`

**소스 코드 위치**: [post.functions.ts.md](./repository/src/lib/functions/post.functions.ts.md)

```typescript
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
 */
export async function getPostFields(
  postId: string,
  fields: string[]
): Promise<Record<string, string | number | null>>
```

**병렬 읽기 최적화**:

```typescript
// 내부 구현
const promises = fields.map((field) => getPostField(postId, field));
const values = await Promise.all(promises);  // 모든 필드를 동시에 읽음
```

**사용 예시**:

```typescript
// 게시글 카드 표시에 필요한 필드만 읽기
const data = await getPostFields('post123', [
  'title',
  'text',
  'authorUid',
  'createdAt',
  'likeCount',
  'commentCount'
]);

console.log(data.title);       // "게시글 제목"
console.log(data.likeCount);   // 42
console.log(data.authorUid);   // "uid123"
```

**반환 데이터 구조**:

```typescript
{
  title: "게시글 제목",
  text: "게시글 내용...",
  authorUid: "uid123",
  createdAt: 1737369600000,
  likeCount: 42,
  commentCount: 15
}
```

---

## 3. 적용 지침

### 3.1 RTDB 비용 최적화 원칙

**❌ 절대 금지**:
```typescript
// 전체 게시글 노드를 읽는 것은 비용 낭비
const postRef = ref(rtdb, `posts/${postId}`);
const snapshot = await get(postRef);
const post = snapshot.val();
```

**✅ 권장**:
```typescript
// 필요한 필드만 읽기
const data = await getPostFields(postId, ['title', 'text', 'authorUid']);
```

### 3.2 컴포넌트별 필수 필드

**PostItem 컴포넌트 (게시글 카드)**:
```typescript
const fields = [
  'title',
  'text',
  'authorUid',
  'createdAt',
  'likeCount',
  'commentCount',
  'viewCount',
  'category',
  'urls'
];
```

**게시글 상세 페이지**:
```typescript
const fields = [
  'title',
  'text',
  'authorUid',
  'createdAt',
  'editedAt',
  'likeCount',
  'commentCount',
  'viewCount',
  'category',
  'urls',
  'tags'
];
```

**게시글 목록 (간단한 리스트)**:
```typescript
const fields = [
  'title',
  'authorUid',
  'createdAt',
  'likeCount',
  'commentCount'
];
```

### 3.3 인기 게시글 표시 플로우

```typescript
// 1. 인기 게시글 ID 가져오기
const popularPosts = await getPopularPosts('daily', 10);

// 2. 각 게시글의 필요한 필드만 읽기
const postData = await Promise.all(
  popularPosts.map(({ postId }) =>
    getPostFields(postId, ['title', 'authorUid', 'likeCount'])
  )
);

// 3. UI 표시
postData.forEach((data, index) => {
  console.log(`${index + 1}. ${data.title} (좋아요 ${data.likeCount})`);
});
```

---

## 4. 사용 시나리오

### 4.1 인기 게시글 위젯

**PopularPostsCard.svelte**:

```typescript
let popularPosts = $state<Array<{ postId: string; score: number }>>([]);
let postDetails = $state<Record<string, any>>({});

$effect(() => {
  void loadPopularPosts();
});

async function loadPopularPosts() {
  // 1. 일간 인기 게시글 Top 5 가져오기
  popularPosts = await getPopularPosts('daily', 5);

  // 2. 각 게시글의 제목과 좋아요 수 읽기
  const details = await Promise.all(
    popularPosts.map(({ postId }) =>
      getPostFields(postId, ['title', 'likeCount'])
    )
  );

  // 3. postId를 키로 하는 객체로 변환
  postDetails = Object.fromEntries(
    popularPosts.map(({ postId }, index) => [postId, details[index]])
  );
}
```

### 4.2 게시글 미리보기 (홈 피드)

```typescript
// DatabaseListView로 게시글 ID 목록만 가져옴
const postIds = ['post1', 'post2', 'post3'];

// 각 게시글의 미리보기에 필요한 필드만 읽기
const previews = await Promise.all(
  postIds.map((postId) =>
    getPostFields(postId, [
      'title',
      'text',
      'authorUid',
      'createdAt',
      'likeCount'
    ])
  )
);
```

---

## 5. 테스트 시나리오

### 5.1 날짜 포맷 테스트

- [ ] `formatDate()` 일간 형식이 정확한지 확인 (yyyyMMdd)
- [ ] `formatDate()` 주간 형식이 정확한지 확인 (yyyyWww)
- [ ] `formatDate()` 월간 형식이 정확한지 확인 (yyyyMM)
- [ ] ISO Week 계산이 정확한지 확인

### 5.2 인기 게시글 테스트

- [ ] `getPopularPosts()` 일간 순위가 정상 로드되는지 확인
- [ ] `getPopularPosts()` 주간 순위가 정상 로드되는지 확인
- [ ] `getPopularPosts()` 월간 순위가 정상 로드되는지 확인
- [ ] 점수가 내림차순으로 정렬되는지 확인
- [ ] `limit` 파라미터가 정상 동작하는지 확인

### 5.3 필드 읽기 테스트

- [ ] `getPostField()` 단일 필드 읽기가 정상 동작하는지 확인
- [ ] `getPostFields()` 다중 필드 병렬 읽기가 정상 동작하는지 확인
- [ ] RTDB 비용이 실제로 절감되는지 확인 (Firebase Console에서 확인)

---

## 6. 관련 파일

### 6.1 연관 컴포넌트

- `src/lib/components/sidebar/PopularPostsCard.svelte` - 인기 게시글 위젯
- `src/lib/components/post/PostItem.svelte` - 게시글 카드
- `src/routes/+page.svelte` - 홈 피드

### 6.2 관련 스펙 문서

- `specs/sonub-popular-posts.md` - 인기 게시글 시스템
- `specs/sonub-firebase-database-structure.md` - RTDB 구조
- `specs/sonub-firebase-functions-index.md` - Cloud Functions (점수 계산)

---

## 7. 작업 이력 (SED Log)

| 날짜 | 작업자 | 변경 내용 |
| ---- | ------ | -------- |
| 2025-01-20 | Claude Code | Post Functions 명세 최초 작성 |
