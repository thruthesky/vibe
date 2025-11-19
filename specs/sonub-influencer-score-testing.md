---
title: Sonub 인플루언서 점수 시스템 통합 테스트
version: 1.0.0
status: active
author: Claude Code
created: 2025-11-19
updated: 2025-11-19
category: testing
tags: [testing, integration, influencer, scoring, firebase]
related:
  - sonub-reactions-stats.md
  - sonub-firebase-database-structure.md
dependencies:
  - Firebase Realtime Database
  - Firebase Cloud Functions v2
  - influencer-scores.constants.ts
---

# Sonub 인플루언서 점수 시스템 통합 테스트

## 1. 개요

### 1.1. 문서 목적

인플루언서 점수 시스템의 정확성과 신뢰성을 검증하기 위한 통합 테스트 계획을 정의합니다.

### 1.2. 테스트 범위

- ✅ 게시글 작성/삭제 시 점수 변화 검증
- ✅ 댓글 작성/삭제 시 점수 변화 검증
- ✅ 좋아요 생성/취소 시 점수 변화 검증
- ✅ 팔로우/언팔로우 시 점수 변화 검증
- ✅ 페널티 시스템 동작 검증
- ✅ 자기 자신에게 한 액션 제외 로직 검증
- ✅ ServerValue.increment() 원자성 검증

### 1.3. 점수 체계 요약

| 액션 | 점수 변화 | 페널티 |
|------|-----------|--------|
| 게시글 작성 | +50 | - |
| 게시글 삭제 | -55 | -5 |
| 댓글 작성 (작성자) | +5 | - |
| 댓글 삭제 (작성자) | -7 | -2 |
| 댓글 받음 (게시글/댓글 주인) | +5 | - |
| 댓글 삭제됨 (게시글/댓글 주인) | -5 | 0 |
| 좋아요 받음 | +3 | - |
| 좋아요 취소됨 | -3 | 0 |
| 팔로워 받음 | +60 | - |
| 언팔로우 당함 | -60 | 0 |

## 2. 테스트 환경 설정

### 2.1. 필수 사전 조건

1. Firebase Emulator Suite 실행 (권장)
   ```bash
   firebase emulators:start --only database,functions
   ```

2. 테스트용 사용자 계정 생성
   - userA: 게시글/댓글 작성자
   - userB: 리액션 수행자 (좋아요, 댓글, 팔로우)
   - userC: 추가 검증용 사용자

3. Firebase Console에서 실시간 데이터 모니터링
   - `/influencer-scores/{uid}` 경로 관찰
   - `/user-stats/{uid}/total/` 경로 관찰

### 2.2. 테스트 데이터 초기화

```javascript
// 테스트 시작 전 초기 점수 확인
const initialScoreA = await get(ref(database, `influencer-scores/userA`));
const initialScoreB = await get(ref(database, `influencer-scores/userB`));

console.log('Initial Score A:', initialScoreA.val() || 0);
console.log('Initial Score B:', initialScoreB.val() || 0);
```

## 3. 게시글 관련 테스트

### 3.1. 테스트 시나리오: 게시글 작성

**준비 단계:**
1. userA의 현재 점수 확인 (기준점)
2. userA로 로그인

**실행 단계:**
1. userA가 새 게시글 작성
   ```typescript
   const postId = push(ref(database, 'posts')).key;
   await set(ref(database, `posts/${postId}`), {
     authorUid: 'userA',
     title: '테스트 게시글',
     content: '내용',
     createdAt: Date.now()
   });
   ```

**검증 단계:**
1. Cloud Functions 트리거 대기 (약 1-2초)
2. userA의 점수 확인
   ```typescript
   const newScore = await get(ref(database, `influencer-scores/userA`));
   const scoreDelta = newScore.val() - initialScore;
   ```
3. **기대 결과:** `scoreDelta === 50`
4. 통계 확인:
   ```typescript
   const stats = await get(ref(database, `user-stats/userA/total/createdPosts`));
   ```
   - **기대 결과:** `createdPosts` 1 증가

### 3.2. 테스트 시나리오: 게시글 삭제

**준비 단계:**
1. 3.1의 게시글 ID 보관
2. userA의 현재 점수 확인 (기준점)

**실행 단계:**
1. userA가 자신의 게시글 삭제
   ```typescript
   await remove(ref(database, `posts/${postId}`));
   ```

**검증 단계:**
1. Cloud Functions 트리거 대기
2. userA의 점수 확인
3. **기대 결과:** `scoreDelta === -55` (페널티 -5 포함)
4. 통계 확인:
   - **기대 결과:** `createdPosts` 1 감소

### 3.3. 순 점수 검증

**검증:**
- 게시글 작성 후 삭제 시 순 변화: -5점 (페널티)
- 초기 점수가 0이었다면 최종 점수: -5점

## 4. 댓글 관련 테스트

### 4.1. 테스트 시나리오: 게시글에 댓글 작성

**준비 단계:**
1. userA가 게시글 작성 (postId 보관)
2. userA, userB의 현재 점수 확인

**실행 단계:**
1. userB가 userA의 게시글에 댓글 작성
   ```typescript
   const commentId = push(ref(database, `comments/${postId}`)).key;
   await set(ref(database, `comments/${postId}/${commentId}`), {
     authorUid: 'userB',
     content: '좋은 글이네요!',
     createdAt: Date.now(),
     parentId: null  // 게시글 댓글
   });
   ```

**검증 단계:**
1. userB의 점수 확인
   - **기대 결과:** +5점 (댓글 작성자)
2. userA의 점수 확인
   - **기대 결과:** +5점 (댓글 받은 게시글 주인)
3. 통계 확인:
   - userB: `createdComments` 1 증가
   - userA: `receivedPostComments` 1 증가, `receivedComments` 1 증가

### 4.2. 테스트 시나리오: 댓글에 대댓글 작성

**준비 단계:**
1. 4.1의 댓글 ID 보관 (userB의 댓글)
2. userC의 현재 점수 확인

**실행 단계:**
1. userC가 userB의 댓글에 대댓글 작성
   ```typescript
   const replyId = push(ref(database, `comments/${postId}`)).key;
   await set(ref(database, `comments/${postId}/${replyId}`), {
     authorUid: 'userC',
     content: '저도 동감합니다!',
     createdAt: Date.now(),
     parentId: commentId  // 부모 댓글 ID
   });
   ```

**검증 단계:**
1. userC의 점수 확인
   - **기대 결과:** +5점 (대댓글 작성자)
2. userB의 점수 확인
   - **기대 결과:** +5점 (대댓글 받은 댓글 주인)
3. 통계 확인:
   - userC: `createdComments` 1 증가
   - userB: `receivedCommentReplies` 1 증가, `receivedComments` 1 증가

### 4.3. 테스트 시나리오: 댓글 삭제

**준비 단계:**
1. 4.1의 댓글 ID 사용
2. userA, userB의 현재 점수 확인

**실행 단계:**
1. userB가 자신의 댓글 삭제
   ```typescript
   await remove(ref(database, `comments/${postId}/${commentId}`));
   ```

**검증 단계:**
1. userB의 점수 확인
   - **기대 결과:** -7점 (페널티 -2 포함)
2. userA의 점수 확인
   - **기대 결과:** -5점 (페널티 없음)
3. 통계 확인:
   - userB: `createdComments` 1 감소
   - userA: `receivedPostComments` 1 감소, `receivedComments` 1 감소

### 4.4. 테스트 시나리오: 자기 자신에게 댓글 (예외 케이스)

**준비 단계:**
1. userA가 게시글 작성
2. userA의 현재 점수 확인

**실행 단계:**
1. userA가 자신의 게시글에 댓글 작성
   ```typescript
   const commentId = push(ref(database, `comments/${postId}`)).key;
   await set(ref(database, `comments/${postId}/${commentId}`), {
     authorUid: 'userA',
     content: '추가 설명입니다',
     createdAt: Date.now(),
     parentId: null
   });
   ```

**검증 단계:**
1. userA의 점수 확인
   - **기대 결과:** +5점만 증가 (댓글 작성자 점수만)
   - **중요:** 자기 자신에게 한 댓글이므로 receivedComments는 증가하지 않음
2. 통계 확인:
   - userA: `createdComments` 1 증가
   - userA: `receivedPostComments` **증가 없음**
   - userA: `receivedComments` **증가 없음**

## 5. 좋아요 관련 테스트

### 5.1. 테스트 시나리오: 게시글에 좋아요

**준비 단계:**
1. userA가 게시글 작성
2. userA, userB의 현재 점수 확인

**실행 단계:**
1. userB가 userA의 게시글에 좋아요
   ```typescript
   await set(ref(database, `likes/userB/${postId}`), {
     targetType: 'post',
     createdAt: Date.now()
   });
   ```

**검증 단계:**
1. userB의 점수 변화
   - **기대 결과:** 변화 없음 (좋아요 누른 사람은 점수 없음)
2. userA의 점수 확인
   - **기대 결과:** +3점 (좋아요 받음)
3. 통계 확인:
   - userA: `receivedLikes` 1 증가

### 5.2. 테스트 시나리오: 좋아요 취소

**준비 단계:**
1. 5.1의 상태 유지
2. userA의 현재 점수 확인

**실행 단계:**
1. userB가 좋아요 취소
   ```typescript
   await remove(ref(database, `likes/userB/${postId}`));
   ```

**검증 단계:**
1. userA의 점수 확인
   - **기대 결과:** -3점 (페널티 없음)
2. 통계 확인:
   - userA: `receivedLikes` 1 감소

### 5.3. 테스트 시나리오: 자기 자신에게 좋아요 (예외 케이스)

**준비 단계:**
1. userA가 게시글 작성
2. userA의 현재 점수 확인

**실행 단계:**
1. userA가 자신의 게시글에 좋아요
   ```typescript
   await set(ref(database, `likes/userA/${postId}`), {
     targetType: 'post',
     createdAt: Date.now()
   });
   ```

**검증 단계:**
1. userA의 점수 확인
   - **기대 결과:** 변화 없음
2. 통계 확인:
   - userA: `receivedLikes` **증가 없음**

## 6. 팔로우 관련 테스트

### 6.1. 테스트 시나리오: 팔로우

**준비 단계:**
1. userA, userB의 현재 점수 확인

**실행 단계:**
1. userB가 userA를 팔로우
   ```typescript
   await set(ref(database, `user-following/userB/userA`), true);
   ```

**검증 단계:**
1. userB의 점수 변화
   - **기대 결과:** 변화 없음 (팔로우한 사람은 점수 없음)
2. userA의 점수 확인
   - **기대 결과:** +60점 (팔로워 받음)
3. 통계 확인:
   - userA: `receivedFollowers` 1 증가

### 6.2. 테스트 시나리오: 언팔로우

**준비 단계:**
1. 6.1의 상태 유지
2. userA의 현재 점수 확인

**실행 단계:**
1. userB가 userA를 언팔로우
   ```typescript
   await remove(ref(database, `user-following/userB/userA`));
   ```

**검증 단계:**
1. userA의 점수 확인
   - **기대 결과:** -60점 (페널티 없음)
2. 통계 확인:
   - userA: `receivedFollowers` 1 감소

## 7. 페널티 시스템 검증

### 7.1. 게시글 페널티 검증

**시나리오:**
- userA가 게시글 10개 작성: +500점
- userA가 게시글 10개 삭제: -550점
- 순 변화: -50점 (페널티 -5 × 10)

**검증 포인트:**
- 작성과 삭제의 점수 차이가 정확히 -5점인지 확인
- 스팸 방지 효과 검증

### 7.2. 댓글 페널티 검증

**시나리오:**
- userA가 댓글 10개 작성: +50점
- userA가 댓글 10개 삭제: -70점
- 순 변화: -20점 (페널티 -2 × 10)

**검증 포인트:**
- 작성과 삭제의 점수 차이가 정확히 -2점인지 확인

### 7.3. 페널티 없는 액션 검증

**시나리오:**
- userA가 userB로부터 좋아요 10개 받음: +30점
- userB가 좋아요 10개 취소: -30점
- 순 변화: 0점

**검증 포인트:**
- 타인의 행동 변경(좋아요 취소, 언팔로우)에는 페널티가 없음을 확인

## 8. 원자성 및 동시성 테스트

### 8.1. ServerValue.increment() 원자성 검증

**시나리오:**
1. userA에게 동시에 여러 좋아요 발생 (5개)
2. Promise.all()로 병렬 처리
   ```typescript
   await Promise.all([
     set(ref(database, `likes/userB/${postId1}`), { targetType: 'post', createdAt: Date.now() }),
     set(ref(database, `likes/userC/${postId1}`), { targetType: 'post', createdAt: Date.now() }),
     set(ref(database, `likes/userD/${postId1}`), { targetType: 'post', createdAt: Date.now() }),
     set(ref(database, `likes/userE/${postId1}`), { targetType: 'post', createdAt: Date.now() }),
     set(ref(database, `likes/userF/${postId1}`), { targetType: 'post', createdAt: Date.now() }),
   ]);
   ```

**검증:**
- userA의 점수가 정확히 +15점 증가했는지 확인 (3 × 5)
- 동시성 이슈로 인한 점수 누락이 없는지 확인

### 8.2. 복합 액션 동시 발생

**시나리오:**
1. userA가 게시글 작성하는 동시에
2. userB가 이전 게시글에 댓글 작성하는 동시에
3. userC가 userA를 팔로우

**검증:**
- 각 액션의 점수가 독립적으로 정확히 반영되는지 확인
- 점수 합산이 정확한지 확인

## 9. 데이터베이스 상태 검증 쿼리

### 9.1. 특정 사용자의 점수 및 통계 조회

```javascript
// Firebase Console에서 실행
// 또는 테스트 코드에서 사용

const uid = 'userA';

// 1. 인플루언서 점수 조회
const scoreRef = ref(database, `influencer-scores/${uid}`);
const scoreSnapshot = await get(scoreRef);
console.log('Influencer Score:', scoreSnapshot.val() || 0);

// 2. 전체 통계 조회
const totalStatsRef = ref(database, `user-stats/${uid}/total`);
const totalStatsSnapshot = await get(totalStatsRef);
console.log('Total Stats:', totalStatsSnapshot.val());

// 3. 일별 통계 조회 (오늘)
const today = formatDate(new Date(), 'yyyyMMdd');
const dailyStatsRef = ref(database, `user-stats/${uid}/daily/${today}`);
const dailyStatsSnapshot = await get(dailyStatsRef);
console.log(`Daily Stats (${today}):`, dailyStatsSnapshot.val());
```

### 9.2. 인플루언서 랭킹 조회 (상위 10명)

```javascript
// 내림차순 정렬을 위해 negative score 사용
const rankingRef = query(
  ref(database, 'influencer-rankings'),
  orderByChild('negativeScore'),
  limitToFirst(10)
);

const rankingSnapshot = await get(rankingRef);
const rankings = [];
rankingSnapshot.forEach((childSnapshot) => {
  rankings.push({
    uid: childSnapshot.key,
    score: -childSnapshot.val().negativeScore,
    displayName: childSnapshot.val().displayName,
  });
});

console.log('Top 10 Influencers:', rankings);
```

### 9.3. 통계 데이터 일관성 검증

```javascript
// user-stats와 influencer-scores 간의 일관성 검증
const uid = 'userA';

// 1. 통계 기반 예상 점수 계산
const totalStatsSnapshot = await get(ref(database, `user-stats/${uid}/total`));
const stats = totalStatsSnapshot.val() || {};

const expectedScore =
  (stats.createdPosts || 0) * 50 +           // 게시글은 항상 +50 (삭제 시 -55)
  (stats.createdComments || 0) * 5 +         // 댓글은 항상 +5 (삭제 시 -7)
  (stats.receivedLikes || 0) * 3 +           // 좋아요 받음
  (stats.receivedComments || 0) * 5 +        // 댓글 받음
  (stats.receivedFollowers || 0) * 60;       // 팔로워 받음

// 2. 실제 점수 조회
const actualScore = (await get(ref(database, `influencer-scores/${uid}`))).val() || 0;

// 3. 비교 (주의: 삭제 페널티로 인해 정확히 일치하지 않을 수 있음)
console.log('Expected Score (without penalties):', expectedScore);
console.log('Actual Score:', actualScore);
console.log('Difference (penalties):', actualScore - expectedScore);
```

## 10. 수동 테스트 체크리스트

### 10.1. 게시글 테스트

- [ ] 게시글 작성 시 작성자 점수 +50 확인
- [ ] 게시글 삭제 시 작성자 점수 -55 확인 (페널티 -5)
- [ ] createdPosts 통계 정확히 증감 확인
- [ ] Cloud Functions 로그에서 "게시글 생성 통계 처리 완료" 확인

### 10.2. 댓글 테스트

- [ ] 게시글 댓글 작성 시:
  - [ ] 댓글 작성자 +5점
  - [ ] 게시글 주인 +5점
  - [ ] receivedPostComments 통계 증가
- [ ] 댓글 대댓글 작성 시:
  - [ ] 대댓글 작성자 +5점
  - [ ] 부모 댓글 주인 +5점
  - [ ] receivedCommentReplies 통계 증가
- [ ] 댓글 삭제 시:
  - [ ] 댓글 작성자 -7점 (페널티 -2)
  - [ ] 게시글/댓글 주인 -5점 (페널티 없음)
- [ ] 자기 자신에게 댓글 시 receivedComments 증가 없음 확인

### 10.3. 좋아요 테스트

- [ ] 좋아요 누른 사람은 점수 변화 없음
- [ ] 좋아요 받은 사람 +3점
- [ ] 좋아요 취소 시 -3점 (페널티 없음)
- [ ] 자기 자신에게 좋아요 시 점수 변화 없음
- [ ] receivedLikes 통계 정확히 증감

### 10.4. 팔로우 테스트

- [ ] 팔로우한 사람은 점수 변화 없음
- [ ] 팔로우 받은 사람 +60점
- [ ] 언팔로우 시 -60점 (페널티 없음)
- [ ] receivedFollowers 통계 정확히 증감

### 10.5. 페널티 시스템 테스트

- [ ] 게시글 작성 후 바로 삭제: 순 -5점
- [ ] 댓글 작성 후 바로 삭제: 순 -2점
- [ ] 타인의 좋아요 취소: 순 0점 (페널티 없음)
- [ ] 타인의 언팔로우: 순 0점 (페널티 없음)

### 10.6. 동시성 테스트

- [ ] 동시에 여러 좋아요 발생 시 정확한 점수 반영
- [ ] 게시글 작성과 댓글 작성 동시 발생 시 독립적 처리
- [ ] ServerValue.increment() 원자성 확인

### 10.7. Cloud Functions 로그 확인

- [ ] Firebase Console > Functions > 로그에서 각 핸들러 실행 확인
- [ ] "통계 처리 완료" 로그 메시지 확인
- [ ] "통계 처리 실패" 에러 로그 없음 확인
- [ ] "자기 자신에게 한 액션은 통계에서 제외됩니다" 로그 확인 (해당 케이스)

### 10.8. 데이터 일관성 확인

- [ ] `/influencer-scores/{uid}` 값이 음수가 아닌지 확인 (스팸 사용자 예외)
- [ ] `/user-stats/{uid}/total/` 통계가 음수가 아닌지 확인
- [ ] 일별/월별/연도별 통계가 total과 일치하는지 확인
- [ ] `/influencer-rankings/{uid}/negativeScore`가 실제 점수의 음수인지 확인

## 11. 테스트 자동화 스크립트 (선택 사항)

### 11.1. Jest 통합 테스트 예시

```typescript
// tests/integration/influencer-score.test.ts

import { describe, it, expect, beforeEach, afterEach } from '@jest/globals';
import { database } from '../setup/firebase-test-setup';
import { ref, set, get, remove, push } from 'firebase/database';

describe('인플루언서 점수 시스템 통합 테스트', () => {
  let userAId: string;
  let userBId: string;
  let postId: string;

  beforeEach(async () => {
    // 테스트 사용자 생성
    userAId = 'test-user-a';
    userBId = 'test-user-b';

    // 초기 점수 설정
    await set(ref(database, `influencer-scores/${userAId}`), 0);
    await set(ref(database, `influencer-scores/${userBId}`), 0);
  });

  afterEach(async () => {
    // 테스트 데이터 정리
    await remove(ref(database, `influencer-scores/${userAId}`));
    await remove(ref(database, `influencer-scores/${userBId}`));
    if (postId) {
      await remove(ref(database, `posts/${postId}`));
    }
  });

  it('게시글 작성 시 작성자에게 +50점 부여', async () => {
    // Given: 초기 점수 확인
    const initialScore = (await get(ref(database, `influencer-scores/${userAId}`))).val() || 0;

    // When: 게시글 작성
    postId = push(ref(database, 'posts')).key!;
    await set(ref(database, `posts/${postId}`), {
      authorUid: userAId,
      title: '테스트 게시글',
      content: '내용',
      createdAt: Date.now(),
    });

    // Cloud Functions 트리거 대기
    await new Promise(resolve => setTimeout(resolve, 2000));

    // Then: 점수 확인
    const newScore = (await get(ref(database, `influencer-scores/${userAId}`))).val() || 0;
    expect(newScore - initialScore).toBe(50);
  });

  it('댓글 작성 시 작성자와 게시글 주인에게 각각 +5점 부여', async () => {
    // Given: 게시글 생성
    postId = push(ref(database, 'posts')).key!;
    await set(ref(database, `posts/${postId}`), {
      authorUid: userAId,
      title: '테스트 게시글',
      createdAt: Date.now(),
    });
    await new Promise(resolve => setTimeout(resolve, 2000));

    const scoreABefore = (await get(ref(database, `influencer-scores/${userAId}`))).val() || 0;
    const scoreBBefore = (await get(ref(database, `influencer-scores/${userBId}`))).val() || 0;

    // When: userB가 댓글 작성
    const commentId = push(ref(database, `comments/${postId}`)).key!;
    await set(ref(database, `comments/${postId}/${commentId}`), {
      authorUid: userBId,
      content: '좋은 글이네요!',
      createdAt: Date.now(),
      parentId: null,
    });
    await new Promise(resolve => setTimeout(resolve, 2000));

    // Then: 점수 확인
    const scoreAAfter = (await get(ref(database, `influencer-scores/${userAId}`))).val() || 0;
    const scoreBAfter = (await get(ref(database, `influencer-scores/${userBId}`))).val() || 0;

    expect(scoreBAfter - scoreBBefore).toBe(5);  // 댓글 작성자
    expect(scoreAAfter - scoreABefore).toBe(55); // 게시글 주인 (+50 게시글 + +5 댓글 받음)
  });

  it('게시글 삭제 시 -55점 부여 (페널티 -5 포함)', async () => {
    // Given: 게시글 생성 후 점수 확인
    postId = push(ref(database, 'posts')).key!;
    await set(ref(database, `posts/${postId}`), {
      authorUid: userAId,
      title: '테스트 게시글',
      createdAt: Date.now(),
    });
    await new Promise(resolve => setTimeout(resolve, 2000));

    const scoreBefore = (await get(ref(database, `influencer-scores/${userAId}`))).val() || 0;

    // When: 게시글 삭제
    await remove(ref(database, `posts/${postId}`));
    await new Promise(resolve => setTimeout(resolve, 2000));

    // Then: 점수 확인
    const scoreAfter = (await get(ref(database, `influencer-scores/${userAId}`))).val() || 0;
    expect(scoreAfter - scoreBefore).toBe(-55);
  });

  // 추가 테스트 케이스...
});
```

## 12. 알려진 이슈 및 주의사항

### 12.1. Cloud Functions 실행 지연

- **이슈:** Cloud Functions 트리거 후 실제 실행까지 1-2초 지연 발생
- **해결:** 테스트 코드에서 `setTimeout()` 또는 `await new Promise()` 사용

### 12.2. Firebase Emulator 데이터 초기화

- **이슈:** 테스트 간 데이터가 남아있어 점수 계산 오류 발생
- **해결:** `beforeEach()`에서 테스트 데이터 초기화

### 12.3. 자기 자신에게 한 액션 제외

- **중요:** 자기 자신에게 좋아요, 댓글 등을 한 경우 통계에서 제외됨
- **검증:** 로그에서 "자기 자신에게 한 액션은 통계에서 제외됩니다" 메시지 확인

### 12.4. 점수 계산 공식 변경 시

- **주의:** `/shared/influencer-scores.constants.ts` 파일 수정 시 모든 핸들러에 반영 확인
- **검증:** 배포 후 실제 환경에서 점수 변화 확인

## 13. 테스트 보고서 양식

### 13.1. 테스트 실행 정보

- **테스트 일시:** YYYY-MM-DD HH:mm:ss
- **테스트 환경:** Firebase Emulator / Production
- **테스터:** 이름
- **Firebase Functions 버전:** vX.X.X

### 13.2. 테스트 결과 요약

| 카테고리 | 총 테스트 | 성공 | 실패 | 성공률 |
|---------|----------|------|------|--------|
| 게시글 | 3 | 3 | 0 | 100% |
| 댓글 | 4 | 4 | 0 | 100% |
| 좋아요 | 3 | 3 | 0 | 100% |
| 팔로우 | 2 | 2 | 0 | 100% |
| 페널티 | 3 | 3 | 0 | 100% |
| 동시성 | 2 | 2 | 0 | 100% |
| **합계** | **17** | **17** | **0** | **100%** |

### 13.3. 실패한 테스트 상세

- **테스트 이름:** [예: 게시글 작성 시 점수 부여]
- **예상 결과:** +50점
- **실제 결과:** +45점
- **원인 분석:** [분석 내용]
- **해결 방안:** [해결 방안]

### 13.4. 권장 사항

- 모든 테스트 케이스 통과 후 Production 배포 진행
- 주기적인 통합 테스트 실행 (주 1회 권장)
- 새로운 기능 추가 시 해당 테스트 케이스 추가

## 14. 참고 문서

- [Sonub 리액션 통계 시스템 - SED Spec](./sonub-reactions-stats.md)
- [Sonub Firebase Database 구조 - SED Spec](./sonub-firebase-database-structure.md)
- [Firebase Realtime Database 공식 문서](https://firebase.google.com/docs/database)
- [Firebase Cloud Functions 공식 문서](https://firebase.google.com/docs/functions)
- [Jest 공식 문서](https://jestjs.io/)

---

## 15. 테스트 결과 및 문제 해결 (2025-01-19)

### 15.1. 발견된 문제

**문제**: 좋아요 시 인플루언서 점수 및 통계가 집계되지 않음

**증상**:
- 사용자가 게시글/댓글에 좋아요를 해도 작성자의 인플루언서 점수가 증가하지 않음
- `/user-stats/{uid}/total/receivedLikes` 통계가 업데이트되지 않음
- Firebase Functions Logs에서 `targetType이 없어 통계 처리를 건너뜁니다` 에러 로그 발생

---

### 15.2. 원인 분석

**데이터 구조 불일치**:

클라이언트 코드 (`src/lib/functions/like.functions.ts`)는 `/likes/{uid}/{targetId}` 경로에 **문자열 값**을 저장:
```typescript
// 게시글 좋아요: "post"
// 댓글 좋아요: "comment"
// 채팅 메시지 좋아요: "chat-message-{roomId}"
const valueToStore = targetType === 'message' && roomId
  ? `chat-message-${roomId}`
  : targetType;

await set(likeRef, valueToStore);
```

하지만 통계 핸들러 (`firebase/functions/src/index.ts`)는 **객체**로 읽으려고 시도:
```typescript
// ❌ 잘못된 코드
const likeData = (event.data.val() || {}) as Record<string, unknown>;
const targetType = likeData.targetType; // → undefined

if (!targetType) {
  logger.error("targetType이 없어 통계 처리를 건너뜁니다");
  return; // early return으로 통계 처리되지 않음
}
```

**결과**: `targetType`이 항상 `undefined`가 되어 통계 핸들러가 early return하여 통계가 집계되지 않음

---

### 15.3. 해결 방법

**수정 내용** (`firebase/functions/src/index.ts`):

```typescript
// ✅ 수정된 코드
export const onLikeCreatedStats = onValueCreated(
  {
    ref: "/likes/{uid}/{targetId}",
    region: FIREBASE_REGION,
  },
  async (event) => {
    const likerUid = event.params.uid as string;
    const targetId = event.params.targetId as string;
    // 좋아요 데이터는 문자열로 저장됨 (예: "post", "comment", "chat-message-roomId")
    const targetType = event.data.val() as string;

    logger.info("좋아요 생성 통계 트리거", {
      likerUid,
      targetId,
      targetType,
    });

    // 통계 핸들러 호출 (객체 형태로 전달)
    await handleLikeCreateStats(likerUid, targetId, { targetType, createdAt: Date.now() });

    return;
  }
);
```

**수정 사항**:
1. `likeData` 객체 대신 `targetType` 문자열로 직접 읽음
2. 핸들러 호출 시 객체 형태로 전환: `{ targetType, createdAt: Date.now() }`
3. 좋아요 삭제 핸들러 (`onLikeDeletedStats`)도 동일하게 수정

**수정 파일**:
- `firebase/functions/src/index.ts` (라인 1429-1450, 1464-1486)

---

### 15.4. 배포 및 검증

**배포 완료**:
```bash
cd firebase/functions
npm run deploy
```

**배포 결과**:
- ✅ `onLikeCreatedStats` 함수 업데이트 성공
- ✅ `onLikeDeletedStats` 함수 업데이트 성공
- ✅ 전체 41개 함수 배포 성공

**검증 방법**:
1. Firebase Console → Functions Logs 확인
2. 사용자가 좋아요 클릭 → Logs에서 정상 처리 확인
3. Firebase RTDB에서 `/influencer-scores/{uid}`, `/user-stats/{uid}` 업데이트 확인
4. 사용자 프로필 페이지에서 인플루언서 점수 실시간 업데이트 확인

---

### 15.5. 테스트 가이드

**테스트 문서**:
- [통합 테스트 가이드](/tmp/test-influencer-scoring.md)
- [테스트 결과 보고서](/tmp/test-결과-report.md)

**Firebase Console 확인 방법**:
1. **Realtime Database**: https://console.firebase.google.com/project/sonub-firebase/database
   - `/influencer-scores/{uid}` - 인플루언서 점수
   - `/user-stats/{uid}/total` - 전체 통계
   - `/influencer-rankings/total` - 전체 순위

2. **Functions Logs**: https://console.firebase.google.com/project/sonub-firebase/functions/logs
   - 필터: `onLikeCreatedStats`, `onLikeDeletedStats` 등

**실제 앱에서 테스트**:
1. 사용자 A로 로그인 → 게시글 작성
2. 사용자 B로 로그인 → 사용자 A의 게시글에 좋아요 클릭
3. 사용자 A의 프로필 페이지 확인 → 인플루언서 점수 +3점 증가 확인
4. Firebase Console에서 `/influencer-scores/{userA_uid}` 경로 확인

---

### 15.6. 남은 테스트 작업

**필수 테스트** (사용자가 직접 수행):
- [ ] 게시글 좋아요 → 점수 +3점 확인
- [ ] 댓글 작성 → 점수 +10점 확인
- [ ] 팔로우 → 점수 +60점 확인
- [ ] 본인 좋아요 → 점수 변화 없음 확인
- [ ] 좋아요 취소 → 점수 -3점 확인
- [ ] 게시글 삭제 → 점수 -55점 확인 (페널티 포함)

**추가 확인 사항**:
- [ ] Firebase Functions Logs에서 에러 없이 정상 처리 확인
- [ ] 사용자 프로필 페이지에서 점수 실시간 업데이트 확인
- [ ] 인플루언서 순위 페이지에서 순위 반영 확인

---

### 15.7. 요약

| 항목 | 상태 |
|------|------|
| 문제 발견 | ✅ 완료 |
| 원인 분석 | ✅ 완료 |
| 코드 수정 | ✅ 완료 |
| 배포 | ✅ 완료 |
| 통합 테스트 문서 작성 | ✅ 완료 |
| 실제 앱 테스트 | ⏳ 대기 중 (사용자 수행 필요) |
| 프로덕션 검증 | ⏳ 대기 중 |

**다음 단계**: 실제 앱에서 테스트를 수행하고 Firebase Logs와 RTDB를 모니터링하여 정상 동작 확인
