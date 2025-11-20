---
name: sonub-functions-user
title: User Functions 명세
version: 1.0.0
description: 사용자 정보 조회, action 카운터, 인플루언서 순위 관련 함수
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
  - sonub-stats-reactions.md
tags:
  - user
  - functions
  - RTDB
  - optimization
  - influencer
---

# User Functions 명세

본 문서는 `src/lib/functions/user.functions.ts` 파일에 정의된 사용자 정보 조회 및 통계 관련 함수의 역할과 사용 규칙을 설명합니다. 전역 규칙은 반드시 [sonub-functions-overview.md](./sonub-functions-overview.md)를 먼저 읽은 후 적용합니다.

---

## 1. 파일 구조

**소스 코드 위치**: [user.functions.ts.md](./repository/src/lib/functions/user.functions.ts.md)

```
src/
└── lib/
    └── functions/
        └── user.functions.ts   # 사용자 정보 유틸리티 함수
```

### 핵심 원칙: RTDB 비용 최적화

⚠️ **중요**: 이 파일의 모든 함수는 **RTDB 읽기 비용 최적화**를 최우선 목표로 설계되었습니다.

**비용 절감 전략**:
1. **전체 노드 읽기 금지**: `/users/{uid}` 전체가 아닌 `/users/{uid}/{field}`만 읽기
2. **병렬 읽기**: `Promise.all()`을 사용하여 여러 필드를 동시에 읽기
3. **필요한 필드만 요청**: 사용하지 않는 필드는 절대 읽지 않음

---

## 2. 제공 함수 목록

### 2.1 사용자 기본 정보 함수

#### 2.1.1 `getUserField()`

**소스 코드 위치**: [user.functions.ts.md](./repository/src/lib/functions/user.functions.ts.md)

```typescript
/**
 * 사용자의 특정 필드 하나만 읽어옵니다.
 *
 * ⚠️ 중요: 전체 사용자 노드가 아닌 특정 필드만 읽어서 RTDB 비용 절감
 *
 * @param uid - 사용자 UID
 * @param field - 읽어올 필드명 ('displayName' | 'photoUrl')
 * @returns 필드 값 또는 null
 */
export async function getUserField(
  uid: string,
  field: 'displayName' | 'photoUrl'
): Promise<string | null>
```

**RTDB 경로**:
```
/users/{uid}/{field}
```

**비용 절감 효과**:

❌ **나쁜 예** (전체 노드 읽기):
```typescript
const userRef = ref(rtdb, `users/${uid}`);  // 전체 사용자 데이터 읽기
const snapshot = await get(userRef);
const displayName = snapshot.val()?.displayName;  // 비효율적!
```

✅ **좋은 예** (필드만 읽기):
```typescript
const displayName = await getUserField(uid, 'displayName');  // displayName만 읽기
// RTDB 비용 90% 이상 절감!
```

**사용 예시**:

```typescript
// 사용자 이름만 필요한 경우
const displayName = await getUserField('uid123', 'displayName');

// 사용자 프로필 사진만 필요한 경우
const photoUrl = await getUserField('uid123', 'photoUrl');
```

---

#### 2.1.2 `getUserFields()`

**소스 코드 위치**: [user.functions.ts.md](./repository/src/lib/functions/user.functions.ts.md)

```typescript
/**
 * 사용자의 여러 필드를 한 번에 가져옵니다. (범용 함수)
 *
 * ⚠️ 중요: RTDB 비용 최적화를 위해 지정된 필드만 개별적으로 읽습니다.
 * - /users/{uid} 전체를 읽지 않고 요청된 필드들만 읽습니다.
 * - Promise.all()을 사용하여 모든 필드를 병렬로 읽어서 성능 최적화
 *
 * @param uid - 사용자 UID
 * @param fields - 읽어올 필드명 배열 (예: ['displayName', 'photoUrl'])
 * @returns 필드명을 키로 하고 필드 값을 값으로 하는 객체
 */
export async function getUserFields(
  uid: string,
  fields: Array<'displayName' | 'photoUrl'>
): Promise<Record<string, string | null>>
```

**병렬 읽기 최적화**:

```typescript
// 내부 구현
const values = await Promise.all(
  fields.map((field) => getUserField(uid, field))
);
```

**사용 예시**:

```typescript
// displayName과 photoUrl만 가져오기
const data = await getUserFields('uid123', ['displayName', 'photoUrl']);
console.log(data.displayName); // "홍길동"
console.log(data.photoUrl);    // "https://..."

// displayName만 가져오기
const data2 = await getUserFields('uid456', ['displayName']);
console.log(data2.displayName); // "김철수"
```

---

#### 2.1.3 `getUserBasicInfo()`

**소스 코드 위치**: [user.functions.ts.md](./repository/src/lib/functions/user.functions.ts.md)

```typescript
/**
 * 사용자의 기본 정보 (이름, 사진)만 가져옵니다.
 *
 * ⚠️ 중요: 각 필드를 개별적으로 읽어서 RTDB 비용 최소화
 * - /users/{uid} 전체를 읽지 않고 displayName, photoUrl 필드만 읽습니다.
 * - 두 필드를 병렬로 읽어서 성능 최적화
 *
 * @param uid - 사용자 UID
 * @returns 사용자 기본 정보 객체 { displayName, photoUrl }
 */
export async function getUserBasicInfo(
  uid: string
): Promise<{ displayName: string | null; photoUrl: string | null }>
```

**사용 예시**:

```typescript
const userInfo = await getUserBasicInfo('uid123');
console.log(userInfo.displayName); // "홍길동"
console.log(userInfo.photoUrl);    // "https://..."
```

**활용 시나리오**:
- 게시글/댓글 작성자 정보 표시
- 좋아요 사용자 아바타 스택
- 채팅 메시지 발신자 정보

---

### 2.2 사용자 Action 카운터 함수

#### 2.2.1 `getUserActionCounter()`

**소스 코드 위치**: [user.functions.ts.md](./repository/src/lib/functions/user.functions.ts.md)

```typescript
/**
 * 사용자의 특정 action 카운터 하나만 읽어옵니다.
 *
 * ⚠️ 중요: 전체 user-action-counters 노드가 아닌 특정 카운터만 읽어서 RTDB 비용 절감
 *
 * @param uid - 사용자 UID
 * @param counterType - 카운터 타입 ('like' | 'comment' | 'post' | 'chat' | 'follow')
 * @returns 카운터 값 (숫자) 또는 0 (존재하지 않을 경우)
 */
export async function getUserActionCounter(
  uid: string,
  counterType: 'like' | 'comment' | 'post' | 'chat' | 'follow'
): Promise<number>
```

**RTDB 경로**:
```
/user-action-counters/{uid}/{counterType}
```

**카운터 타입**:
- `like`: 좋아요 수
- `comment`: 댓글 수
- `post`: 게시글 수
- `chat`: 채팅 메시지 수
- `follow`: 팔로우 수

**사용 예시**:

```typescript
const postCount = await getUserActionCounter('uid123', 'post');
console.log(`게시글 수: ${postCount}`);

const commentCount = await getUserActionCounter('uid123', 'comment');
console.log(`댓글 수: ${commentCount}`);
```

---

#### 2.2.2 `getUserActionCounters()`

**소스 코드 위치**: [user.functions.ts.md](./repository/src/lib/functions/user.functions.ts.md)

```typescript
/**
 * 사용자의 여러 action 카운터를 한 번에 가져옵니다. (범용 함수)
 *
 * ⚠️ 중요: RTDB 비용 최적화를 위해 지정된 카운터만 개별적으로 읽습니다.
 * - /user-action-counters/{uid} 전체를 읽지 않고 요청된 카운터들만 읽습니다.
 * - Promise.all()을 사용하여 모든 카운터를 병렬로 읽어서 성능 최적화
 *
 * @param uid - 사용자 UID
 * @param counterTypes - 읽어올 카운터 타입 배열 (예: ['post', 'comment'])
 * @returns 카운터 타입을 키로 하고 카운터 값을 값으로 하는 객체
 */
export async function getUserActionCounters(
  uid: string,
  counterTypes: Array<'like' | 'comment' | 'post' | 'chat' | 'follow'>
): Promise<Record<string, number>>
```

**사용 예시**:

```typescript
// 게시글 수와 댓글 수만 가져오기
const counters = await getUserActionCounters('uid123', ['post', 'comment']);
console.log(counters.post);    // 15
console.log(counters.comment); // 42

// 모든 카운터 가져오기
const allCounters = await getUserActionCounters('uid456', [
  'like',
  'comment',
  'post',
  'chat',
  'follow'
]);
```

---

### 2.3 인플루언서 순위 함수

#### 2.3.1 `getCurrentDate()`

**소스 코드 위치**: [user.functions.ts.md](./repository/src/lib/functions/user.functions.ts.md)

```typescript
/**
 * 현재 UTC 날짜를 지정된 형식으로 반환합니다.
 *
 * @param format - 날짜 형식 ('yyyyMMdd' | 'yyyyMM' | 'yyyy')
 * @returns 형식화된 날짜 문자열
 */
export function getCurrentDate(
  format: 'yyyyMMdd' | 'yyyyMM' | 'yyyy'
): string
```

**사용 예시**:

```typescript
getCurrentDate('yyyyMMdd'); // '20250119'
getCurrentDate('yyyyMM');   // '202501'
getCurrentDate('yyyy');     // '2025'
```

---

#### 2.3.2 `getTopInfluencers()`

**소스 코드 위치**: [user.functions.ts.md](./repository/src/lib/functions/user.functions.ts.md)

```typescript
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
 */
export async function getTopInfluencers(
  period: 'daily' | 'monthly' | 'yearly' | 'total',
  date?: string,
  limit: number = 100
): Promise<InfluencerRanking[]>
```

**RTDB 경로**:
```
/influencer-rankings/{period}/{date}
/influencer-rankings/total  (전체 기간)
```

**점수 저장 방식**:
- Firebase RTDB는 **음수 값으로 저장**하여 `orderByValue()` + `limitToFirst()`로 내림차순 정렬
- 예: 점수 250 → `-250`으로 저장
- 클라이언트에서 절댓값 변환하여 표시

**사용 예시**:

```typescript
// 오늘의 Top 5 인플루언서
const dailyTop5 = await getTopInfluencers(
  'daily',
  getCurrentDate('yyyyMMdd'),
  5
);

dailyTop5.forEach((influencer, index) => {
  console.log(`${index + 1}. ${influencer.uid} (점수: ${influencer.score})`);
});

// 이번 달의 Top 100 인플루언서
const monthlyTop100 = await getTopInfluencers(
  'monthly',
  getCurrentDate('yyyyMM'),
  100
);

// 전체 기간 Top 5 인플루언서
const totalTop5 = await getTopInfluencers('total', undefined, 5);
```

**반환 데이터 구조**:

```typescript
interface InfluencerRanking {
  uid: string;
  score: number;
}

// 예시
[
  { uid: "uid123", score: 250 },
  { uid: "uid456", score: 180 },
  { uid: "uid789", score: 150 }
]
```

---

#### 2.3.3 `getInfluencerScore()`

**소스 코드 위치**: [user.functions.ts.md](./repository/src/lib/functions/user.functions.ts.md)

```typescript
/**
 * 특정 사용자의 인플루언서 점수를 가져옵니다.
 *
 * ⚠️ 중요: 전체 노드가 아닌 특정 사용자의 점수만 읽어서 RTDB 비용 절감
 *
 * @param uid - 사용자 UID
 * @returns 인플루언서 점수 (0 이상, 점수가 없으면 0)
 */
export async function getInfluencerScore(uid: string): Promise<number>
```

**RTDB 경로**:
```
/influencer-scores/{uid}
```

**사용 예시**:

```typescript
const score = await getInfluencerScore('uid123');
console.log(`인플루언서 점수: ${score}`);

// 사용자 프로필 페이지에서 표시
if (score > 0) {
  console.log(`🏆 인플루언서 (점수: ${score})`);
}
```

---

## 3. 적용 지침

### 3.1 RTDB 비용 최적화 원칙

**❌ 절대 금지**:
```typescript
// 전체 사용자 노드를 읽는 것은 비용 낭비
const userRef = ref(rtdb, `users/${uid}`);
const snapshot = await get(userRef);
const user = snapshot.val();
```

**✅ 권장**:
```typescript
// 필요한 필드만 읽기
const data = await getUserFields(uid, ['displayName', 'photoUrl']);
```

### 3.2 컴포넌트별 필수 필드

**UserAvatar 컴포넌트**:
```typescript
const { photoUrl } = await getUserFields(uid, ['photoUrl']);
```

**UserCard 컴포넌트 (간단)**:
```typescript
const userInfo = await getUserBasicInfo(uid);
```

**UserProfile 페이지 (상세)**:
```typescript
const userInfo = await getUserBasicInfo(uid);
const counters = await getUserActionCounters(uid, ['post', 'comment', 'like']);
const influencerScore = await getInfluencerScore(uid);
```

### 3.3 인플루언서 순위 표시 플로우

```typescript
// 1. Top 5 인플루언서 가져오기
const topInfluencers = await getTopInfluencers(
  'daily',
  getCurrentDate('yyyyMMdd'),
  5
);

// 2. 각 인플루언서의 기본 정보 읽기
const influencerData = await Promise.all(
  topInfluencers.map(({ uid }) => getUserBasicInfo(uid))
);

// 3. UI 표시
topInfluencers.forEach((influencer, index) => {
  const info = influencerData[index];
  console.log(`${index + 1}. ${info.displayName} (점수: ${influencer.score})`);
});
```

---

## 4. 사용 시나리오

### 4.1 게시글 작성자 정보 표시

**PostItem.svelte**:

```typescript
let authorInfo = $state<{ displayName: string | null; photoUrl: string | null } | null>(null);

$effect(() => {
  if (post.authorUid) {
    void loadAuthorInfo();
  }
});

async function loadAuthorInfo() {
  authorInfo = await getUserBasicInfo(post.authorUid);
}
```

### 4.2 사용자 프로필 페이지

**user/profile/+page.svelte**:

```typescript
let userInfo = $state<any>(null);
let actionCounters = $state<Record<string, number>>({});
let influencerScore = $state<number>(0);

$effect(() => {
  if (uid) {
    void loadUserProfile();
  }
});

async function loadUserProfile() {
  // 병렬로 모든 정보 로드
  const [info, counters, score] = await Promise.all([
    getUserBasicInfo(uid),
    getUserActionCounters(uid, ['post', 'comment', 'like', 'follow']),
    getInfluencerScore(uid)
  ]);

  userInfo = info;
  actionCounters = counters;
  influencerScore = score;
}
```

### 4.3 인플루언서 순위 위젯

**InfluencerRankingCard.svelte**:

```typescript
let topInfluencers = $state<InfluencerRanking[]>([]);
let influencerProfiles = $state<Record<string, any>>({});

$effect(() => {
  void loadTopInfluencers();
});

async function loadTopInfluencers() {
  // 1. 일간 Top 10 인플루언서
  topInfluencers = await getTopInfluencers(
    'daily',
    getCurrentDate('yyyyMMdd'),
    10
  );

  // 2. 각 인플루언서의 기본 정보 로드
  const profiles = await Promise.all(
    topInfluencers.map(({ uid }) => getUserBasicInfo(uid))
  );

  // 3. uid를 키로 하는 객체로 변환
  influencerProfiles = Object.fromEntries(
    topInfluencers.map(({ uid }, index) => [uid, profiles[index]])
  );
}
```

---

## 5. 테스트 시나리오

### 5.1 사용자 정보 읽기 테스트

- [ ] `getUserField()` 단일 필드 읽기가 정상 동작하는지 확인
- [ ] `getUserFields()` 다중 필드 병렬 읽기가 정상 동작하는지 확인
- [ ] `getUserBasicInfo()` 기본 정보 읽기가 정상 동작하는지 확인
- [ ] RTDB 비용이 실제로 절감되는지 확인

### 5.2 Action 카운터 테스트

- [ ] `getUserActionCounter()` 단일 카운터 읽기가 정상 동작하는지 확인
- [ ] `getUserActionCounters()` 다중 카운터 병렬 읽기가 정상 동작하는지 확인
- [ ] 존재하지 않는 카운터 조회 시 0을 반환하는지 확인

### 5.3 인플루언서 순위 테스트

- [ ] `getTopInfluencers()` 일간 순위가 정상 로드되는지 확인
- [ ] `getTopInfluencers()` 월간 순위가 정상 로드되는지 확인
- [ ] `getTopInfluencers()` 전체 순위가 정상 로드되는지 확인
- [ ] 점수가 내림차순으로 정렬되는지 확인
- [ ] `getInfluencerScore()` 개별 점수 조회가 정상 동작하는지 확인

---

## 6. 관련 파일

### 6.1 연관 컴포넌트

- `src/lib/components/UserAvatar.svelte` - 사용자 아바타
- `src/lib/components/post/PostItem.svelte` - 게시글 카드 (작성자 정보)
- `src/routes/user/profile/+page.svelte` - 사용자 프로필 페이지
- `src/lib/components/sidebar/StatsCard.svelte` - 통계 위젯

### 6.2 관련 스펙 문서

- `specs/sonub-stats-reactions.md` - 통계 시스템
- `specs/sonub-firebase-database-structure.md` - RTDB 구조
- `specs/sonub-firebase-functions-user-handler.md` - User 관련 Cloud Functions

---

## 7. 작업 이력 (SED Log)

| 날짜 | 작업자 | 변경 내용 |
| ---- | ------ | -------- |
| 2025-01-20 | Claude Code | User Functions 명세 최초 작성 |
