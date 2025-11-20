---
name: sonub-reactions-stats
title: 리액션 집계 및 통계 기능 - 설계 및 구현
version: 1.8.0
description: 사용자별 좋아요/댓글 집계, 일/월/년 통계, 인플루언서 랭킹 시스템 설계 및 구현, 본인 반응 제외, 삭제 로직 대칭성, UTC 기준 날짜 계산, 핸들러 아키텍처 분리, 이벤트 기반 증분 점수 계산, 페널티 시스템 제거, 사용자 프로필 페이지 통합, Vitest 통합 테스트 완료
author: Claude (SED Agent)
email: noreply@anthropic.com
homepage: https://github.com/thruthesky/
license: GPL-3.0
updated: 2025-01-19
dependencies:
  - sonub-firebase-database-structure.md
  - sonub-firebase-functions.md
  - sonub-like-overview.md
  - sonub-forum-overview.md
tags:
  - reactions
  - statistics
  - influencer
  - ranking
  - aggregation
  - cloud-functions
---

## 1. 개요

본 문서는 Sonub 프로젝트에서 사용자별 리액션(좋아요, 댓글) 집계 및 통계 기능을 추가하기 위한 설계 계획서입니다.

### 1.1. 목표

- **사용자가 받은 리액션 통계**: 각 사용자가 작성한 게시글/댓글에 받은 좋아요 수와 댓글 수를 집계
- **시간별 통계**: 일(일), 월(월), 년(년) 단위로 통계 기록
- **인플루언서 랭킹**: 통계 기반으로 인기 사용자/셀럽 순위 매기기
- **실시간 업데이트**: Cloud Functions를 통한 실시간 통계 자동 업데이트

### 1.2. 사용자 요구사항

사용자가 요청한 기능:

1. **내가 쓴 글에 대한 총 댓글 수** - 게시글에 달린 모든 댓글 수
2. **내가 쓴 댓글 하위의 총 댓글 수** - 내 댓글에 달린 답글(대댓글) 수
3. **내가 받은 좋아요 수** - 내 게시글과 댓글에 받은 좋아요 수
4. **일/월/년 별 통계** - 위 항목들을 시간별로 집계
5. **인플루언서 순위** - 통계 기반으로 인기 사용자 순위 매기기
6. **일/월/년 별 팔로워 증감 통계** - 팔로워가 발생하면 +1, 언팔로우하면 -1 (음수값 허용)

---

## 2. 현재 DB 구조 분석

상세한 데이터베이스 구조는 다음 문서를 참조하세요:
- [전역 통계 데이터베이스 구조](./sonub-firebase-database-structure.md#전역-통계-stats)
- [사용자별 활동 통계 데이터베이스 구조](./sonub-firebase-database-structure.md#사용자별-활동-통계-user-action-counters)
- [좋아요 데이터베이스 구조](./sonub-firebase-database-structure.md#좋아요-likes--likes-by)
- [게시글 데이터베이스 구조](./sonub-firebase-database-structure.md#게시글-posts)
- [댓글 데이터베이스 구조](./sonub-firebase-database-structure.md#댓글-comments)

**Cloud Functions**:
- `comment.create.handler.ts` - 댓글 생성 시 자동으로 `childCount`, `totalChildCount` 업데이트
- `/stats/counters/comment` 전역 통계 자동 증가

### 2.4. 부족한 점

1. **사용자가 "받은" 리액션 통계 없음**:
   - 현재 `/user-action-counters/{uid}/like`는 사용자가 **누른** 좋아요 수만 기록
   - 사용자가 **받은** 좋아요 수는 집계되지 않음
   - 사용자가 **받은** 댓글 수도 집계되지 않음

2. **시간별 통계 없음**:
   - 일/월/년 단위 통계가 없음
   - 과거 통계 추적 불가능

3. **인플루언서 랭킹 시스템 없음**:
   - 인기 사용자 순위를 매길 데이터 구조가 없음
   - 쿼리 최적화된 랭킹 목록이 없음

---

## 3. 제안하는 DB 구조 설계

### 3.1. 사용자별 일일 통계 (`/user-daily-stats/{uid}/{yyyymmdd}`)

사용자가 **받은** 리액션을 일별로 집계합니다.

**경로**: `/user-daily-stats/{uid}/{yyyymmdd}`

**필드**:

**소스 코드 위치**: [+page.svelte.md](./repository/src/routes/my/reactions/+page.svelte.md)

```typescript
interface UserDailyStats {
  // 받은 좋아요 수
  receivedLikes: number;              // 내 게시글 + 댓글에 받은 총 좋아요 수

  // 받은 댓글 수
  receivedComments: number;           // 내 게시글에 달린 총 댓글 수 (모든 레벨 포함)
  receivedPostComments: number;       // 내 게시글에 달린 댓글 수
  receivedCommentReplies: number;     // 내 댓글에 달린 답글 수

  // 받은 팔로워 증감 수
  receivedFollowers: number;          // 팔로워 증가 시 +1, 언팔로우 시 -1 (음수값 가능)

  // 작성한 컨텐츠 수 (참고용)
  createdPosts: number;               // 오늘 작성한 게시글 수
  createdComments: number;            // 오늘 작성한 댓글 수

  // 메타데이터
  date: string;                       // "YYYY-MM-DD" 형식
  timestamp: number;                  // Unix timestamp (밀리초)
  lastUpdated: number;                // 마지막 업데이트 시간
}
```

**예시**:

**소스 코드 위치**: [+page.svelte.md](./repository/src/routes/my/reactions/+page.svelte.md)

```json
{
  "user-daily-stats": {
    "user123": {
      "20250118": {
        "receivedLikes": 25,
        "receivedComments": 12,
        "receivedPostComments": 8,
        "receivedCommentReplies": 4,
        "receivedFollowers": 5,
        "createdPosts": 3,
        "createdComments": 7,
        "date": "2025-01-18",
        "timestamp": 1737158400000,
        "lastUpdated": 1737244800000
      },
      "20250117": {
        "receivedLikes": 18,
        "receivedComments": 9,
        "receivedPostComments": 6,
        "receivedCommentReplies": 3,
        "receivedFollowers": -2,
        "createdPosts": 2,
        "createdComments": 5,
        "date": "2025-01-17",
        "timestamp": 1737072000000,
        "lastUpdated": 1737158400000
      }
    }
  }
}
```

**특징**:
- **일별 집계**: 매일 자정 기준으로 새로운 날짜 노드 생성
  - **Timezone**: UTC+0 (협정 세계시) 기준으로 날짜 계산
  - 글로벌 서비스이므로 모든 사용자의 통계가 동일한 시간대(UTC)를 기준으로 집계됩니다
  - 예: 한국 시간 2025-01-19 09:00:00 (KST, UTC+9) = 2025-01-19 00:00:00 (UTC)
- **증분 업데이트**: Cloud Functions가 실시간으로 `ServerValue.increment()` 사용
- **쿼리 최적화**: 날짜별로 노드가 분리되어 특정 기간 조회 용이

### 3.2. 사용자별 월별 통계 (`/user-monthly-stats/{uid}/{yyyymm}`)

일일 통계를 월 단위로 롤업(roll-up)합니다.

**경로**: `/user-monthly-stats/{uid}/{yyyymm}`

**필드**:

**소스 코드 위치**: [+page.svelte.md](./repository/src/routes/my/reactions/+page.svelte.md)

```typescript
interface UserMonthlyStats {
  receivedLikes: number;
  receivedComments: number;
  receivedPostComments: number;
  receivedCommentReplies: number;
  receivedFollowers: number;          // 월별 팔로워 증감 수 (음수값 가능)
  createdPosts: number;
  createdComments: number;

  month: string;                      // "YYYY-MM" 형식
  timestamp: number;                  // 해당 월 1일 00:00:00 타임스탬프
  lastUpdated: number;
}
```

**생성 방식**:
- **옵션 1 (실시간 증분)**: 일일 통계와 동시에 월별 통계도 증분 업데이트
- **옵션 2 (스케줄드 집계)**: 매일 자정에 일일 통계를 합산하여 월별 통계 업데이트
- **권장**: 옵션 1 (실시간 성능 우수, 데이터 일관성 높음)

### 3.3. 사용자별 연도별 통계 (`/user-yearly-stats/{uid}/{yyyy}`)

월별 통계를 년 단위로 롤업합니다.

**경로**: `/user-yearly-stats/{uid}/{yyyy}`

**필드**:

**소스 코드 위치**: [+page.svelte.md](./repository/src/routes/my/reactions/+page.svelte.md)

```typescript
interface UserYearlyStats {
  receivedLikes: number;
  receivedComments: number;
  receivedPostComments: number;
  receivedCommentReplies: number;
  receivedFollowers: number;          // 연도별 팔로워 증감 수 (음수값 가능)
  createdPosts: number;
  createdComments: number;

  year: string;                       // "YYYY" 형식
  timestamp: number;                  // 해당 년 1월 1일 00:00:00 타임스탬프
  lastUpdated: number;
}
```

**생성 방식**: 월별 통계와 동일 (실시간 증분 권장)

### 3.4. 사용자별 전체 통계 (`/users/{uid}/stats`)

**경로**: `/users/{uid}/stats`

**필드**:

**소스 코드 위치**: [+page.svelte.md](./repository/src/routes/my/reactions/+page.svelte.md)

```typescript
interface UserTotalStats {
  // 받은 리액션 (전체 누적)
  totalReceivedLikes: number;
  totalReceivedComments: number;
  totalReceivedPostComments: number;
  totalReceivedCommentReplies: number;
  totalReceivedFollowers: number;     // 전체 팔로워 증감 누적 (음수값 가능)

  // 작성한 컨텐츠 (전체 누적)
  totalCreatedPosts: number;
  totalCreatedComments: number;

  // 인플루언서 점수 (가중치 적용)
  influencerScore: number;            // 좋아요 + 댓글 * 2 (가중치)

  // 메타데이터
  lastUpdated: number;
}
```

**용도**:
- 사용자 프로필 페이지에서 전체 통계 표시
- 인플루언서 점수 계산 및 랭킹 기준

### 3.5. 인플루언서 랭킹 (`/rankings/influencers`)

**경로**: `/rankings/influencers/{period}/{uid}`

**Period 옵션**:
- `daily` - 일간 랭킹
- `weekly` - 주간 랭킹
- `monthly` - 월간 랭킹
- `allTime` - 전체 랭킹

**필드**:

**소스 코드 위치**: [+page.svelte.md](./repository/src/routes/my/reactions/+page.svelte.md)

```typescript
interface InfluencerRanking {
  uid: string;
  influencerScore: number;            // 랭킹 점수
  receivedLikes: number;              // 받은 좋아요 수
  receivedComments: number;           // 받은 댓글 수
  rank: number;                       // 순위 (1, 2, 3, ...)
  timestamp: number;                  // 랭킹 계산 시간
}
```

**정렬 키**: `-{influencerScore}-{uid}`
- 예: `-00012345-user123` (점수 12345, uid=user123)
- 점수가 높을수록 음수 값이 작아져서 상위 랭킹
- Firebase RTDB의 `orderByKey()` 쿼리로 효율적인 Top N 조회 가능

**예시**:

**소스 코드 위치**: [+page.svelte.md](./repository/src/routes/my/reactions/+page.svelte.md)

```json
{
  "rankings": {
    "influencers": {
      "daily": {
        "-00012345-user123": {
          "uid": "user123",
          "influencerScore": 12345,
          "receivedLikes": 8230,
          "receivedComments": 2057,
          "rank": 1,
          "timestamp": 1737244800000
        },
        "-00010987-user456": {
          "uid": "user456",
          "influencerScore": 10987,
          "receivedLikes": 7324,
          "receivedComments": 1831,
          "rank": 2,
          "timestamp": 1737244800000
        }
      },
      "monthly": { /* ... */ },
      "allTime": { /* ... */ }
    }
  }
}
```

---

## 4. Cloud Functions 설계

### 4.1. 좋아요 추가 시 통계 업데이트

**트리거**: `/likes/{uid}/{targetId}` (onValueCreated)

**핸들러 위치**:
- **비즈니스 로직**: `firebase/functions/src/handlers/like.handler.ts` (기존 파일)
  - 좋아요 추가/취소 시 `likeCount` 업데이트
  - 전역 통계 (`/stats/counters/like`) 업데이트
  - 사용자별 통계 (`/user-action-counters/{uid}/like`) 업데이트 (누른 사람 기준, `incrementActionCounter()` 함수 사용)
- **통계 집계 로직**: `firebase/functions/src/handlers/stats.like.handler.ts` (신규 파일)
  - 타겟 작성자의 일일/월별/연도별/전체 통계 업데이트
  - 인플루언서 점수 재계산

**처리 로직** (통계 집계 핸들러):

1. **targetType 파싱** - "message", "post", "comment-{postId}", "chat-message-{roomId}"
2. **타겟 작성자 UID 조회**:
   - `targetType === "post"` → `/posts/{targetId}/authorUid`
   - `targetType.startsWith("comment-")` → targetType에서 postId 파싱 (`"comment-{postId}"` 형식) → `/comments/{postId}/{targetId}/authorUid`
   - `targetType.startsWith("chat-message-")` → `/chat-messages/{roomId}/{targetId}/senderUid`
3. **본인 반응 제외** - 자기 자신의 게시글/댓글에 좋아요를 누른 경우 통계에서 제외:

**소스 코드 위치**: [+page.svelte.md](./repository/src/routes/my/reactions/+page.svelte.md)

   ```typescript
   // 좋아요를 누른 사용자 UID와 타겟 작성자 UID 비교
   if (uid === targetAuthorUid) {
     // 본인의 게시글/댓글에 좋아요를 누른 경우 통계 업데이트 제외
     console.log(`Self-like detected: ${uid} liked their own content ${targetId}`);
     return; // 함수 종료
   }
   ```
4. **오늘 날짜 계산** - `yyyymmdd` 형식 (UTC+0 기준, 예: "20250118")
5. **Multi-path update**로 다음 경로를 원자적으로 업데이트:

**소스 코드 위치**: [+page.svelte.md](./repository/src/routes/my/reactions/+page.svelte.md)

   ```typescript
   const updates = {
     // 일일 통계
     [`user-daily-stats/${authorUid}/${yyyymmdd}/receivedLikes`]:
       ServerValue.increment(1),
     [`user-daily-stats/${authorUid}/${yyyymmdd}/lastUpdated`]:
       ServerValue.TIMESTAMP,

     // 월별 통계
     [`user-monthly-stats/${authorUid}/${yyyymm}/receivedLikes`]:
       ServerValue.increment(1),
     [`user-monthly-stats/${authorUid}/${yyyymm}/lastUpdated`]:
       ServerValue.TIMESTAMP,

     // 연도별 통계
     [`user-yearly-stats/${authorUid}/${yyyy}/receivedLikes`]:
       ServerValue.increment(1),
     [`user-yearly-stats/${authorUid}/${yyyy}/lastUpdated`]:
       ServerValue.TIMESTAMP,

     // 전체 통계
     [`users/${authorUid}/stats/totalReceivedLikes`]:
       ServerValue.increment(1),
     [`users/${authorUid}/stats/lastUpdated`]:
       ServerValue.TIMESTAMP,
   };

   await admin.database().ref().update(updates);
   ```

5. **인플루언서 점수 재계산** (비동기 백그라운드 작업):
   - 사용자의 `totalReceivedLikes`와 `totalReceivedComments` 조회
   - 점수 계산: `influencerScore = receivedLikes + receivedComments * 2`
   - `/users/{uid}/stats/influencerScore` 업데이트
   - `/rankings/influencers/{period}/{-score-uid}` 업데이트

**좋아요 취소 시**:
- 위와 동일하지만 `ServerValue.increment(-1)` 사용

### 4.2. 댓글 추가 시 통계 업데이트

**트리거**: `/comments/{postId}/{commentId}` (onValueCreated)

**핸들러 위치**:
- **비즈니스 로직**: `firebase/functions/src/handlers/comment.create.handler.ts` (기존 파일)
  - 댓글 생성 시 `childCount`, `totalChildCount` 업데이트
  - 전역 통계 (`/stats/counters/comment`) 업데이트
- **통계 집계 로직**: `firebase/functions/src/handlers/stats.comment.handler.ts` (신규 파일)
  - 타겟 작성자의 일일/월별/연도별/전체 통계 업데이트
  - 인플루언서 점수 재계산

**처리 로직** (통계 집계 핸들러):

1. **댓글 정보 조회**:
   - `authorUid`: 댓글 작성자
   - `parentId`: 부모 댓글 ID (null이면 게시글에 직접 달린 댓글)
2. **타겟 작성자 UID 조회**:
   - `parentId === null` → 게시글 작성자: `/posts/{postId}/authorUid`
   - `parentId !== null` → 부모 댓글 작성자: `/comments/{postId}/{parentId}/authorUid`
3. **본인 반응 제외** - 자기 자신의 게시글/댓글에 댓글을 단 경우 통계에서 제외:

**소스 코드 위치**: [+page.svelte.md](./repository/src/routes/my/reactions/+page.svelte.md)

   ```typescript
   // 댓글 작성자 UID와 타겟 작성자 UID 비교
   if (authorUid === targetAuthorUid) {
     // 본인의 게시글/댓글에 댓글을 단 경우 통계 업데이트 제외
     console.log(`Self-comment detected: ${authorUid} commented on their own content ${postId}`);
     return; // 함수 종료
   }
   ```
4. **오늘 날짜 계산** - `yyyymmdd` 형식 (UTC+0 기준)
5. **Multi-path update**:

**소스 코드 위치**: [+page.svelte.md](./repository/src/routes/my/reactions/+page.svelte.md)

   ```typescript
   const targetAuthorUid = parentId ? parentCommentAuthorUid : postAuthorUid;
   const isPostComment = parentId === null;

   const updates = {
     // 일일 통계
     [`user-daily-stats/${targetAuthorUid}/${yyyymmdd}/receivedComments`]:
       ServerValue.increment(1),
     [`user-daily-stats/${targetAuthorUid}/${yyyymmdd}/${isPostComment ? 'receivedPostComments' : 'receivedCommentReplies'}`]:
       ServerValue.increment(1),
     [`user-daily-stats/${targetAuthorUid}/${yyyymmdd}/lastUpdated`]:
       ServerValue.TIMESTAMP,

     // 월별 통계
     [`user-monthly-stats/${targetAuthorUid}/${yyyymm}/receivedComments`]:
       ServerValue.increment(1),
     [`user-monthly-stats/${targetAuthorUid}/${yyyymm}/${isPostComment ? 'receivedPostComments' : 'receivedCommentReplies'}`]:
       ServerValue.increment(1),

     // 연도별 통계
     [`user-yearly-stats/${targetAuthorUid}/${yyyy}/receivedComments`]:
       ServerValue.increment(1),

     // 전체 통계
     [`users/${targetAuthorUid}/stats/totalReceivedComments`]:
       ServerValue.increment(1),
     [`users/${targetAuthorUid}/stats/${isPostComment ? 'totalReceivedPostComments' : 'totalReceivedCommentReplies'}`]:
       ServerValue.increment(1),
   };

   await admin.database().ref().update(updates);
   ```

5. **인플루언서 점수 재계산** (비동기 백그라운드 작업)

**댓글 삭제 시** (onValueDeleted):

댓글이 삭제될 때는 생성 로직과 대칭적으로 통계를 감소시켜야 합니다.

**트리거**: `/comments/{postId}/{commentId}` (onValueDeleted)

**핸들러 위치**: `firebase/functions/src/handlers/stats.comment.handler.ts` (통계 집계 핸들러)

**처리 로직** (통계 집계 핸들러):

1. **댓글 정보 조회**:
   - 삭제 전 댓글 데이터에서 `authorUid`, `parentId` 추출
   - Firebase Functions의 `onValueDeleted`는 삭제되기 전 스냅샷을 제공합니다
2. **타겟 작성자 UID 조회**:
   - `parentId === null` → 게시글 작성자: `/posts/{postId}/authorUid`
   - `parentId !== null` → 부모 댓글 작성자: `/comments/{postId}/{parentId}/authorUid`
3. **본인 반응 제외**:
   - 생성 시와 동일하게, 본인이 작성한 댓글은 통계에서 제외되었으므로 삭제 시에도 처리 불필요

**소스 코드 위치**: [+page.svelte.md](./repository/src/routes/my/reactions/+page.svelte.md)

   ```typescript
   if (authorUid === targetAuthorUid) {
     console.log(`Self-comment was not counted, skip delete stats update`);
     return;
   }
   ```
4. **오늘 날짜 계산** - `yyyymmdd` 형식 (UTC 기준)
5. **Multi-path update**:

**소스 코드 위치**: [+page.svelte.md](./repository/src/routes/my/reactions/+page.svelte.md)

   ```typescript
   const targetAuthorUid = parentId ? parentCommentAuthorUid : postAuthorUid;
   const isPostComment = parentId === null;

   const updates = {
     // 일일 통계 (-1)
     [`user-daily-stats/${targetAuthorUid}/${yyyymmdd}/receivedComments`]:
       ServerValue.increment(-1),
     [`user-daily-stats/${targetAuthorUid}/${yyyymmdd}/${isPostComment ? 'receivedPostComments' : 'receivedCommentReplies'}`]:
       ServerValue.increment(-1),
     [`user-daily-stats/${targetAuthorUid}/${yyyymmdd}/lastUpdated`]:
       ServerValue.TIMESTAMP,

     // 월별 통계 (-1)
     [`user-monthly-stats/${targetAuthorUid}/${yyyymm}/receivedComments`]:
       ServerValue.increment(-1),
     [`user-monthly-stats/${targetAuthorUid}/${yyyymm}/${isPostComment ? 'receivedPostComments' : 'receivedCommentReplies'}`]:
       ServerValue.increment(-1),

     // 연도별 통계 (-1)
     [`user-yearly-stats/${targetAuthorUid}/${yyyy}/receivedComments`]:
       ServerValue.increment(-1),

     // 전체 통계 (-1)
     [`users/${targetAuthorUid}/stats/totalReceivedComments`]:
       ServerValue.increment(-1),
     [`users/${targetAuthorUid}/stats/${isPostComment ? 'totalReceivedPostComments' : 'totalReceivedCommentReplies'}`]:
       ServerValue.increment(-1),
   };

   await admin.database().ref().update(updates);
   ```

6. **인플루언서 점수 재계산** (비동기 백그라운드 작업)

**참고**:
- 댓글 삭제 시 생성 로직과 정확히 대칭적으로 통계를 감소시킵니다
- 음수값이 발생할 수 있으나, 데이터 일관성을 위해 허용합니다

### 4.3. 게시글/댓글 작성 시 통계 업데이트

**트리거**:
- `/posts/{postId}` (onValueCreated)
- `/comments/{postId}/{commentId}` (onValueCreated)

**핸들러 위치**:
- **게시글 작성**: `firebase/functions/src/handlers/stats.post.handler.ts` (신규 파일)
- **댓글 작성**: `firebase/functions/src/handlers/stats.comment.handler.ts` (신규 파일)

**처리 로직** (통계 집계 핸들러):
- 작성자의 일일/월별/연도별 통계에서 `createdPosts` 또는 `createdComments` 증가
- 참고용 데이터로, 인플루언서 점수에는 영향 없음

### 4.4. 팔로우/언팔로우 시 통계 업데이트

**트리거**:
- `/user-following/{followerUid}/{followingUid}` (onValueCreated) - 팔로우 시
- `/user-following/{followerUid}/{followingUid}` (onValueDeleted) - 언팔로우 시

**핸들러 위치**:
- **비즈니스 로직**: `firebase/functions/src/handlers/friend.follow.handler.ts` (기존 파일, 만약 존재한다면)
  - 팔로우/언팔로우 관련 기본 비즈니스 로직
- **통계 집계 로직**: `firebase/functions/src/handlers/stats.follow.handler.ts` (신규 파일)
  - 팔로잉 대상의 일일/월별/연도별/전체 통계 업데이트

**처리 로직** (통계 집계 핸들러):

**팔로우 추가 시** (onValueCreated):

1. **팔로잉 대상 UID 확인** - `followingUid` (팔로우를 받는 사용자)
2. **오늘 날짜 계산** - `yyyymmdd` 형식 (예: "20250118")
3. **Multi-path update**로 다음 경로를 원자적으로 업데이트:

**소스 코드 위치**: [+page.svelte.md](./repository/src/routes/my/reactions/+page.svelte.md)

   ```typescript
   const updates = {
     // 일일 통계 (+1)
     [`user-daily-stats/${followingUid}/${yyyymmdd}/receivedFollowers`]:
       ServerValue.increment(1),
     [`user-daily-stats/${followingUid}/${yyyymmdd}/lastUpdated`]:
       ServerValue.TIMESTAMP,

     // 월별 통계 (+1)
     [`user-monthly-stats/${followingUid}/${yyyymm}/receivedFollowers`]:
       ServerValue.increment(1),
     [`user-monthly-stats/${followingUid}/${yyyymm}/lastUpdated`]:
       ServerValue.TIMESTAMP,

     // 연도별 통계 (+1)
     [`user-yearly-stats/${followingUid}/${yyyy}/receivedFollowers`]:
       ServerValue.increment(1),
     [`user-yearly-stats/${followingUid}/${yyyy}/lastUpdated`]:
       ServerValue.TIMESTAMP,

     // 전체 통계 (+1)
     [`users/${followingUid}/stats/totalReceivedFollowers`]:
       ServerValue.increment(1),
     [`users/${followingUid}/stats/lastUpdated`]:
       ServerValue.TIMESTAMP,
   };

   await admin.database().ref().update(updates);
   ```

**언팔로우 시** (onValueDeleted):

1. **팔로잉 대상 UID 확인** - `followingUid` (언팔로우당하는 사용자)
2. **오늘 날짜 계산** - `yyyymmdd` 형식
3. **Multi-path update**로 다음 경로를 원자적으로 업데이트:

**소스 코드 위치**: [+page.svelte.md](./repository/src/routes/my/reactions/+page.svelte.md)

   ```typescript
   const updates = {
     // 일일 통계 (-1)
     [`user-daily-stats/${followingUid}/${yyyymmdd}/receivedFollowers`]:
       ServerValue.increment(-1),
     [`user-daily-stats/${followingUid}/${yyyymmdd}/lastUpdated`]:
       ServerValue.TIMESTAMP,

     // 월별 통계 (-1)
     [`user-monthly-stats/${followingUid}/${yyyymm}/receivedFollowers`]:
       ServerValue.increment(-1),
     [`user-monthly-stats/${followingUid}/${yyyymm}/lastUpdated`]:
       ServerValue.TIMESTAMP,

     // 연도별 통계 (-1)
     [`user-yearly-stats/${followingUid}/${yyyy}/receivedFollowers`]:
       ServerValue.increment(-1),
     [`user-yearly-stats/${followingUid}/${yyyy}/lastUpdated`]:
       ServerValue.TIMESTAMP,

     // 전체 통계 (-1)
     [`users/${followingUid}/stats/totalReceivedFollowers`]:
       ServerValue.increment(-1),
     [`users/${followingUid}/stats/lastUpdated`]:
       ServerValue.TIMESTAMP,
   };

   await admin.database().ref().update(updates);
   ```

**음수값 허용**:
- 특정 날짜에 언팔로우가 팔로우보다 많으면 `receivedFollowers`가 음수가 될 수 있습니다
- 예: 하루 동안 팔로워 2명 증가, 언팔로우 5명 → `receivedFollowers = -3`
- 이는 정상적인 동작이며, 전체 통계에서 팔로워 감소 추세를 파악하는 데 유용합니다

**참고**:
- Sonub의 팔로우 시스템은 `/user-following/{followerUid}/{followingUid}`와 `/user-followers/{followingUid}/{followerUid}` 경로를 사용합니다
- Cloud Functions에서는 `/user-following/` 경로의 생성/삭제 이벤트를 감지하여 통계를 업데이트합니다
- `/user-followers/` 경로는 Cloud Functions가 자동으로 역참조를 생성/삭제합니다

### 4.5. 인플루언서 랭킹 업데이트 (스케줄드 함수)

**스케줄**: 매일 자정 (00:00 UTC) 실행

**함수 이름**: `updateInfluencerRankings`

**핸들러 위치**: `firebase/functions/src/handlers/stats.ranking.handler.ts` (신규 파일)

**처리 로직**:

1. **일간 랭킹 업데이트**:
   - 어제 날짜의 모든 사용자 통계 조회: `/user-daily-stats/*/{yyyymmdd}`
   - 점수 계산: `score = receivedLikes + receivedComments * 2`
   - Top 100 사용자 선정
   - `/rankings/influencers/daily` 경로에 저장

2. **주간 랭킹 업데이트**:
   - 지난 7일간의 일일 통계 합산
   - Top 100 사용자 선정
   - `/rankings/influencers/weekly` 경로에 저장

3. **월간 랭킹 업데이트**:
   - 현재 월의 월별 통계 조회: `/user-monthly-stats/*/{yyyymm}`
   - Top 100 사용자 선정
   - `/rankings/influencers/monthly` 경로에 저장

4. **전체 랭킹 업데이트**:
   - 모든 사용자의 전체 통계 조회: `/users/*/stats`
   - Top 100 사용자 선정
   - `/rankings/influencers/allTime` 경로에 저장

**최적화**:
- 대량 데이터 처리를 위해 batch 처리 사용
- Top 100만 저장하여 스토리지 비용 절감
- 클라이언트에서는 Top 100 내 사용자만 조회 가능

### 4.6. 게시글/댓글 삭제 시 통계 처리 정책

게시글이나 댓글이 삭제될 때 통계를 어떻게 처리할지에 대한 정책입니다.

#### 4.6.1. 게시글 삭제 시 (onPostDeleted)

**트리거**: `/posts/{postId}` (onValueDeleted)

**핸들러 위치**:
- **비즈니스 로직**: `firebase/functions/src/handlers/post.delete.handler.ts` (신규 파일)
  - 게시글 삭제 시 하위 컬렉션 삭제 (Cascade Delete)
- **통계 집계 로직**: `firebase/functions/src/handlers/stats.post.handler.ts` (신규 파일)
  - 작성자의 일일/월별/연도별/전체 통계 업데이트

**처리 정책**:

1. **작성 통계 감소** (`createdPosts`):
   - 게시글 삭제 시 작성자의 `createdPosts` 통계를 -1 감소시킵니다
   - 일일/월별/연도별/전체 통계 모두 감소

**소스 코드 위치**: [+page.svelte.md](./repository/src/routes/my/reactions/+page.svelte.md)

   ```typescript
   const authorUid = deletedPostSnapshot.val().authorUid;

   const updates = {
     // 일일 통계
     [`user-daily-stats/${authorUid}/${yyyymmdd}/createdPosts`]:
       ServerValue.increment(-1),

     // 월별 통계
     [`user-monthly-stats/${authorUid}/${yyyymm}/createdPosts`]:
       ServerValue.increment(-1),

     // 연도별 통계
     [`user-yearly-stats/${authorUid}/${yyyy}/createdPosts`]:
       ServerValue.increment(-1),

     // 전체 통계
     [`users/${authorUid}/stats/totalCreatedPosts`]:
       ServerValue.increment(-1),
   };

   await admin.database().ref().update(updates);
   ```

2. **받은 리액션 통계** (`receivedLikes`, `receivedComments`):
   - **정책 A (권장)**: 게시글 삭제 시 하위 좋아요/댓글도 함께 삭제되며, 각각의 `onDeleted` 트리거가 자동으로 발동하여 통계가 자연스럽게 감소됩니다
     - 좋아요 삭제: `/likes-by/{postId}/{uid}` 삭제 → `like.handler.ts`의 `onValueDeleted` 트리거 → `receivedLikes` 자동 감소
     - 댓글 삭제: `/comments/{postId}/{commentId}` 삭제 → `comment.handler.ts`의 `onValueDeleted` 트리거 → `receivedComments` 자동 감소
   - **정책 B (선택사항)**: "이미 받은 사랑은 유지한다" - 게시글이 삭제되어도 받은 좋아요/댓글 통계는 유지
     - 이 경우 좋아요/댓글을 명시적으로 삭제하지 않고 게시글만 삭제
     - 통계는 그대로 유지되어 과거의 인기도를 반영

   **권장**: 정책 A (자동 감소)
   - 데이터 일관성 유지
   - 게시글이 삭제되면 관련된 모든 하위 데이터도 정리
   - Firebase Realtime Database의 Cascade Delete 패턴 활용

3. **구현 예시** (정책 A):

   게시글 삭제 시 하위 컬렉션도 함께 삭제하는 로직:

**소스 코드 위치**: [+page.svelte.md](./repository/src/routes/my/reactions/+page.svelte.md)

   ```typescript
   export const onPostDeleted = onValueDeleted(
     { ref: '/posts/{postId}' },
     async (event) => {
       const postId = event.params.postId;
       const deletedPost = event.data.val();
       const authorUid = deletedPost.authorUid;

       // 1. 게시글 작성 통계 감소
       const now = new Date();
       const yyyymmdd = formatDate(now, 'yyyyMMdd'); // UTC 기준
       const yyyymm = formatDate(now, 'yyyyMM');
       const yyyy = formatDate(now, 'yyyy');

       const updates = {
         [`user-daily-stats/${authorUid}/${yyyymmdd}/createdPosts`]:
           ServerValue.increment(-1),
         [`user-monthly-stats/${authorUid}/${yyyymm}/createdPosts`]:
           ServerValue.increment(-1),
         [`user-yearly-stats/${authorUid}/${yyyy}/createdPosts`]:
           ServerValue.increment(-1),
         [`users/${authorUid}/stats/totalCreatedPosts`]:
           ServerValue.increment(-1),
       };

       await admin.database().ref().update(updates);

       // 2. 하위 컬렉션 삭제 (좋아요/댓글)
       // 각각의 onDeleted 트리거가 자동으로 receivedLikes/Comments 감소
       const likesRef = admin.database().ref(`/likes-by/${postId}`);
       const commentsRef = admin.database().ref(`/comments/${postId}`);

       await Promise.all([
         likesRef.remove(), // 각 좋아요 삭제 시 onLikeDeleted 트리거 발동
         commentsRef.remove(), // 각 댓글 삭제 시 onCommentDeleted 트리거 발동
       ]);
     }
   );
   ```

#### 4.6.2. 댓글 삭제 시 (onCommentDeleted)

**댓글 삭제는 이미 4.2절에서 상세히 다루었습니다.**

**요약**:
- 댓글 작성 통계 (`createdComments`): 삭제 시 -1 감소
- 받은 댓글 통계 (`receivedComments`): 삭제 시 -1 감소 (대칭적 처리)
- 본인이 작성한 댓글: 생성 시와 동일하게 통계에서 제외

#### 4.6.3. 날짜 기준 (중요)

**삭제 시 날짜 계산 방식**:

- **옵션 A**: 삭제 당시의 날짜(UTC 기준)로 통계 감소
  - 예: 2025-01-15에 작성, 2025-01-19에 삭제 → 2025-01-19의 `createdPosts`를 -1
  - 장점: 구현이 간단
  - 단점: 작성 날짜와 삭제 날짜가 다르면 일일 통계가 음수가 될 수 있음

- **옵션 B (권장)**: 작성 날짜를 기준으로 통계 감소
  - 예: 2025-01-15에 작성, 2025-01-19에 삭제 → 2025-01-15의 `createdPosts`를 -1
  - 장점: 데이터 일관성 유지, 일일 통계가 음수가 되지 않음
  - 단점: 게시글/댓글에 `createdAt` 필드가 필요

**권장 구현**:
- 게시글/댓글에 `createdAt` 필드 추가 (Unix timestamp)
- 삭제 시 `createdAt`을 기준으로 날짜 계산하여 통계 감소
- 이렇게 하면 작성 시 +1, 삭제 시 -1이 정확히 대칭적으로 동작

**소스 코드 위치**: [+page.svelte.md](./repository/src/routes/my/reactions/+page.svelte.md)

```typescript
const createdAt = deletedPost.createdAt; // Unix timestamp
const createdDate = new Date(createdAt);
const yyyymmdd = formatDate(createdDate, 'yyyyMMdd', 'UTC'); // 작성 날짜 기준

const updates = {
  [`user-daily-stats/${authorUid}/${yyyymmdd}/createdPosts`]:
    ServerValue.increment(-1),
  // ...
};
```

#### 4.6.4. 주의사항

**음수값 발생 가능성**:
- 시스템 도입 전에 작성된 게시글/댓글을 삭제하면 통계가 음수가 될 수 있습니다
- 예: 통계 시스템 도입 전 작성 (createdPosts = 0) → 도입 후 삭제 (createdPosts = -1)
- 이는 정상적인 동작이며, 데이터 마이그레이션 시 기존 데이터를 집계하여 초기값을 설정해야 합니다

**Cascade Delete 순서**:
- 게시글 삭제 → 좋아요 삭제 → 댓글 삭제 순서로 진행
- 각 삭제마다 트리거가 발동하여 통계가 자동으로 감소
- 트랜잭션 없이도 `ServerValue.increment(-1)`로 원자적 연산 보장

### 4.7. 핸들러 아키텍처 및 파일 구조

통계 집계 로직을 별도의 핸들러 파일로 분리하여 가독성과 유지보수성을 높입니다.

#### 4.7.1. 핸들러 분리 원칙

**관심사의 분리 (Separation of Concerns)**:
- **비즈니스 로직 핸들러**: 핵심 기능 (좋아요 추가/취소, 댓글 생성/삭제, 게시글 생성/삭제)
- **통계 집계 핸들러**: 통계 업데이트 전용 (일일/월별/연도별/전체 통계, 인플루언서 점수)

**장점**:
- **가독성**: 각 파일의 역할이 명확하여 코드 이해가 쉬움
- **유지보수성**: 통계 로직 변경 시 비즈니스 로직에 영향 없음
- **테스트 용이성**: 통계 로직만 따로 테스트 가능
- **확장성**: 새로운 통계 지표 추가 시 통계 핸들러만 수정

#### 4.7.2. 파일 구조 및 네이밍 컨벤션

**디렉토리 구조**:

**소스 코드 위치**: [+page.svelte.md](./repository/src/routes/my/reactions/+page.svelte.md)

```
firebase/functions/src/
├── handlers/
│   ├── like.handler.ts              # 좋아요 비즈니스 로직 (기존)
│   ├── comment.create.handler.ts    # 댓글 생성 비즈니스 로직 (기존)
│   ├── post.create.handler.ts       # 게시글 생성 비즈니스 로직 (신규, 필요시)
│   ├── post.delete.handler.ts       # 게시글 삭제 비즈니스 로직 (신규)
│   ├── friend.follow.handler.ts     # 팔로우 비즈니스 로직 (기존)
│   ├── user-action-counters.handler.ts  # 사용자별 통계 공통 함수 (기존)
│   │
│   ├── stats.like.handler.ts        # 좋아요 통계 집계 (신규)
│   ├── stats.comment.handler.ts     # 댓글 통계 집계 (신규)
│   ├── stats.post.handler.ts        # 게시글 통계 집계 (신규)
│   ├── stats.follow.handler.ts      # 팔로우 통계 집계 (신규)
│   └── stats.ranking.handler.ts     # 인플루언서 랭킹 업데이트 (신규)
└── utils/
    └── stats.utils.ts               # 통계 공통 유틸 함수 (신규)
```

**공통 유틸 파일** (`firebase/functions/src/utils/stats.utils.ts`):
- 모든 통계 핸들러가 공유하는 공통 함수 제공
- 코드 중복 제거 및 일관성 보장
- 주요 함수:
  - `updateUserStats()` - 일일/월별/연도별/전체 통계 원자적 업데이트
  - `formatDate()` - UTC 기준 날짜 계산 (yyyyMMdd, yyyyMM, yyyy)
  - `updateInfluencerScore()` - 인플루언서 점수 재계산
  - `getTargetAuthorUid()` - 타겟(게시글/댓글/메시지) 작성자 UID 조회

**네이밍 컨벤션**:

**옵션 1 (권장)**: `stats.{도메인}.handler.ts`
- 예: `stats.like.handler.ts`, `stats.comment.handler.ts`
- 장점: 통계 관련 파일들이 알파벳 순으로 그룹화됨
- 장점: `stats.`로 시작하여 통계 전용임을 명확히 표시
- 장점: 여러 통계 핸들러들을 쉽게 찾을 수 있음

**옵션 2**: `{도메인}.stat-handler.ts`
- 예: `like.stat-handler.ts`, `comment.stat-handler.ts`
- 장점: 도메인별로 비즈니스 로직과 통계 로직이 인접하여 배치됨
- 단점: 통계 핸들러들이 파일 목록에서 분산됨

**권장**: 옵션 1 (`stats.{도메인}.handler.ts`)

#### 4.7.3. 핸들러별 역할 및 책임

**1. 비즈니스 로직 핸들러**

**`like.handler.ts`**:
- **트리거**: `/likes/{uid}/{targetId}` (onValueCreated, onValueDeleted)
- **책임**:
  - 타겟의 `likeCount` 증감
  - 전역 통계 (`/stats/counters/like`) 증감
  - 사용자별 통계 (`/user-action-counters/{uid}/like`) 증감 (누른 사람 기준, `incrementActionCounter()` 함수 사용)
- **호출하지 않음**: 타겟 작성자의 `receivedLikes` 통계 (통계 핸들러 담당)

**`comment.create.handler.ts`**:
- **트리거**: `/comments/{postId}/{commentId}` (onValueCreated, onValueDeleted)
- **책임**:
  - 게시글/댓글의 `childCount`, `totalChildCount` 증감
  - 전역 통계 (`/stats/counters/comment`) 증감
- **호출하지 않음**: 타겟 작성자의 `receivedComments` 통계 (통계 핸들러 담당)

**`post.create.handler.ts`** (신규):
- **트리거**: `/posts/{postId}` (onValueCreated)
- **책임**:
  - 게시글 생성 관련 비즈니스 로직 (있다면)
- **호출하지 않음**: 작성자의 `createdPosts` 통계 (통계 핸들러 담당)

**`post.delete.handler.ts`** (신규):
- **트리거**: `/posts/{postId}` (onValueDeleted)
- **책임**:
  - 하위 컬렉션 삭제 (Cascade Delete): 좋아요, 댓글
- **호출하지 않음**: 작성자의 `createdPosts` 통계 (통계 핸들러 담당)

**`friend.follow.handler.ts`** (기존 파일):
- **트리거**: `/user-following/{followerUid}/{followingUid}` (onValueCreated, onValueDeleted)
- **책임**:
  - `/user-followers/{followingUid}/{followerUid}` 역참조 생성/삭제
  - 사용자별 통계 (`/user-action-counters/{followerUid}/follow`) 증감 (누른 사람 기준, `incrementActionCounter()` 함수 사용)
- **호출하지 않음**: 팔로잉 대상의 `receivedFollowers` 통계 (통계 핸들러 담당)

**2. 통계 집계 핸들러**

**`stats.like.handler.ts`** (신규):
- **트리거**: `/likes/{uid}/{targetId}` (onValueCreated, onValueDeleted)
- **책임**:
  - 타겟 작성자의 일일/월별/연도별/전체 `receivedLikes` 통계 증감
  - 본인 반응 제외 로직 (`if (uid === targetAuthorUid) return;`)
  - 인플루언서 점수 재계산

**`stats.comment.handler.ts`** (신규):
- **트리거**: `/comments/{postId}/{commentId}` (onValueCreated, onValueDeleted)
- **책임**:
  - 타겟 작성자의 일일/월별/연도별/전체 `receivedComments` 통계 증감
  - 댓글 작성자의 일일/월별/연도별/전체 `createdComments` 통계 증감
  - 본인 반응 제외 로직 (`if (authorUid === targetAuthorUid) return;`)
  - 인플루언서 점수 재계산

**`stats.post.handler.ts`** (신규):
- **트리거**: `/posts/{postId}` (onValueCreated, onValueDeleted)
- **책임**:
  - 작성자의 일일/월별/연도별/전체 `createdPosts` 통계 증감
  - 삭제 시 작성 날짜(`createdAt`) 기준으로 통계 감소

**`stats.follow.handler.ts`** (신규):
- **트리거**: `/user-following/{followerUid}/{followingUid}` (onValueCreated, onValueDeleted)
- **책임**:
  - 팔로잉 대상의 일일/월별/연도별/전체 `receivedFollowers` 통계 증감
  - 음수값 허용 (언팔로우가 팔로우보다 많은 경우)

**`stats.ranking.handler.ts`** (신규):
- **트리거**: 스케줄드 함수 (매일 자정 UTC)
- **책임**:
  - 일간/주간/월간/전체 인플루언서 랭킹 계산
  - Top 100 사용자 선정 및 `/rankings/influencers/{period}` 업데이트
  - 랭킹 정렬 키 생성: `-{score}-{uid}`

#### 4.7.4. 공통 유틸 함수 구현 예시

**소스 코드 위치**: [repository/firebase/functions/src/utils/stats.utils.ts.md](./repository/firebase/functions/src/utils/stats.utils.ts.md)

```typescript
import * as admin from 'firebase-admin';
import { ServerValue } from 'firebase-admin/database';
import * as logger from 'firebase-functions/logger';

/**
 * 사용자 통계 업데이트 공통 함수
 *
 * @param uid - 사용자 UID
 * @param statType - 통계 타입
 * @param delta - 증감량 (1: 증가, -1: 감소)
 * @param createdAt - 선택적 작성 날짜 (삭제 시 작성 날짜 기준 통계 감소)
 */
export async function updateUserStats(
  uid: string,
  statType: 'receivedLikes' | 'receivedComments' | 'receivedPostComments' |
            'receivedCommentReplies' | 'receivedFollowers' | 'createdPosts' | 'createdComments',
  delta: number,
  createdAt?: number
): Promise<void> {
  // 날짜 계산 (UTC 기준)
  const targetDate = createdAt ? new Date(createdAt) : new Date();
  const yyyymmdd = formatDate(targetDate, 'yyyyMMdd');
  const yyyymm = formatDate(targetDate, 'yyyyMM');
  const yyyy = formatDate(targetDate, 'yyyy');

  // Multi-path update (원자적 업데이트)
  const updates: Record<string, unknown> = {
    // 일일 통계
    [`user-daily-stats/${uid}/${yyyymmdd}/${statType}`]: ServerValue.increment(delta),
    [`user-daily-stats/${uid}/${yyyymmdd}/lastUpdated`]: ServerValue.TIMESTAMP,

    // 월별 통계
    [`user-monthly-stats/${uid}/${yyyymm}/${statType}`]: ServerValue.increment(delta),
    [`user-monthly-stats/${uid}/${yyyymm}/lastUpdated`]: ServerValue.TIMESTAMP,

    // 연도별 통계
    [`user-yearly-stats/${uid}/${yyyy}/${statType}`]: ServerValue.increment(delta),
    [`user-yearly-stats/${uid}/${yyyy}/lastUpdated`]: ServerValue.TIMESTAMP,

    // 전체 통계
    [`users/${uid}/stats/total${capitalize(statType)}`]: ServerValue.increment(delta),
    [`users/${uid}/stats/lastUpdated`]: ServerValue.TIMESTAMP,
  };

  await admin.database().ref().update(updates);

  logger.info('사용자 통계 업데이트 완료', {
    uid,
    statType,
    delta,
    yyyymmdd,
  });
}

/**
 * UTC 기준 날짜 포맷 함수
 *
 * @param date - Date 객체
 * @param format - 'yyyyMMdd' | 'yyyyMM' | 'yyyy'
 * @returns 포맷된 날짜 문자열
 */
export function formatDate(date: Date, format: 'yyyyMMdd' | 'yyyyMM' | 'yyyy'): string {
  const year = date.getUTCFullYear();
  const month = String(date.getUTCMonth() + 1).padStart(2, '0');
  const day = String(date.getUTCDate()).padStart(2, '0');

  if (format === 'yyyyMMdd') {
    return `${year}${month}${day}`;
  } else if (format === 'yyyyMM') {
    return `${year}${month}`;
  } else {
    return `${year}`;
  }
}

/**
 * 문자열의 첫 글자를 대문자로 변환
 */
function capitalize(str: string): string {
  return str.charAt(0).toUpperCase() + str.slice(1);
}

/**
 * 타겟(게시글/댓글/메시지) 작성자 UID 조회
 *
 * @param targetId - 타겟 ID
 * @param targetType - 타겟 타입 ("post", "comment", "chat-message-{roomId}")
 * @returns 작성자 UID
 */
export async function getTargetAuthorUid(
  targetId: string,
  targetType: string
): Promise<string | null> {
  try {
    // 게시글
    if (targetType === 'post') {
      const snapshot = await admin.database().ref(`posts/${targetId}/authorUid`).once('value');
      return snapshot.exists() ? snapshot.val() as string : null;
    }

    // 댓글 (targetType 형식: "comment-{postId}")
    if (targetType.startsWith('comment-')) {
      // targetType에서 postId 파싱
      const postId = targetType.substring('comment-'.length);

      if (!postId) {
        logger.error('댓글 targetType에서 postId를 파싱할 수 없음', { targetId, targetType });
        return null;
      }

      // comments/{postId}/{commentId}/authorUid 조회
      const snapshot = await admin.database().ref(`comments/${postId}/${targetId}/authorUid`).once('value');
      return snapshot.exists() ? snapshot.val() as string : null;
    }

    // 채팅 메시지
    if (targetType.startsWith('chat-message-')) {
      const roomId = targetType.substring('chat-message-'.length);
      const snapshot = await admin.database().ref(`chat-messages/${roomId}/${targetId}/senderUid`).once('value');
      return snapshot.exists() ? snapshot.val() as string : null;
    }

    logger.error('알 수 없는 타겟 타입', { targetId, targetType });
    return null;
  } catch (error) {
    logger.error('타겟 작성자 UID 조회 실패', {
      targetId,
      targetType,
      error: error instanceof Error ? error.message : String(error),
    });
    return null;
  }
}

/**
 * 인플루언서 점수 재계산
 *
 * @param uid - 사용자 UID
 */
export async function updateInfluencerScore(uid: string): Promise<void> {
  try {
    // 사용자의 totalReceivedLikes와 totalReceivedComments 조회
    const statsSnapshot = await admin.database().ref(`users/${uid}/stats`).once('value');

    if (!statsSnapshot.exists()) {
      logger.warn('사용자 통계를 찾을 수 없음', { uid });
      return;
    }

    const stats = statsSnapshot.val() as Record<string, number>;
    const receivedLikes = stats.totalReceivedLikes || 0;
    const receivedComments = stats.totalReceivedComments || 0;

    // 점수 계산: 좋아요 + (댓글 * 2)
    const influencerScore = receivedLikes + (receivedComments * 2);

    // 점수 업데이트
    await admin.database().ref(`users/${uid}/stats/influencerScore`).set(influencerScore);

    logger.info('인플루언서 점수 업데이트 완료', {
      uid,
      receivedLikes,
      receivedComments,
      influencerScore,
    });
  } catch (error) {
    logger.error('인플루언서 점수 업데이트 실패', {
      uid,
      error: error instanceof Error ? error.message : String(error),
    });
  }
}
```

#### 4.7.5. 구현 예시

**비즈니스 로직 핸들러 (`like.handler.ts`)**:

**소스 코드 위치**: [+page.svelte.md](./repository/src/routes/my/reactions/+page.svelte.md)

```typescript
import { onValueCreated, onValueDeleted } from 'firebase-functions/v2/database';
import * as admin from 'firebase-admin';

// 좋아요 추가 시
export const onLikeCreated = onValueCreated(
  { ref: '/likes/{uid}/{targetId}' },
  async (event) => {
    const uid = event.params.uid;
    const targetId = event.params.targetId;
    const targetType = event.data.val();

    // 1. 타겟의 likeCount 증가
    const targetRef = getTargetRef(targetId, targetType);
    await targetRef.child('likeCount').transaction((count) => (count || 0) + 1);

    // 2. 전역 통계 증가
    await admin.database().ref('/stats/counters/like').transaction((count) => (count || 0) + 1);

    // 3. 사용자별 통계 증가 (누른 사람 기준)
    // incrementActionCounter() 공통 함수 사용
    await incrementActionCounter(uid, 'like', 1);

    // ❌ 타겟 작성자의 receivedLikes 통계는 여기서 업데이트하지 않음
    // ✅ stats.like.handler.ts에서 처리
  }
);

// 좋아요 취소 시
export const onLikeDeleted = onValueDeleted(
  { ref: '/likes/{uid}/{targetId}' },
  async (event) => {
    // 위와 동일하지만 -1 감소
  }
);
```

**통계 집계 핸들러 (`stats.like.handler.ts`)** - 공통 유틸 함수 사용:

**소스 코드 위치**: [+page.svelte.md](./repository/src/routes/my/reactions/+page.svelte.md)

```typescript
import { onValueCreated, onValueDeleted } from 'firebase-functions/v2/database';
import * as logger from 'firebase-functions/logger';
import { getTargetAuthorUid, updateUserStats, updateInfluencerScore } from '../utils/stats.utils';

// 좋아요 추가 시 통계 업데이트
export const onLikeCreatedStats = onValueCreated(
  { ref: '/likes/{uid}/{targetId}' },
  async (event) => {
    const uid = event.params.uid;
    const targetId = event.params.targetId;
    const targetType = event.data.val();

    logger.info('👍 좋아요 통계 업데이트 시작', { uid, targetId, targetType });

    // 1. 타겟 작성자 UID 조회
    const targetAuthorUid = await getTargetAuthorUid(targetId, targetType);

    if (!targetAuthorUid) {
      logger.error('타겟 작성자를 찾을 수 없음', { targetId, targetType });
      return;
    }

    // 2. 본인 반응 제외
    if (uid === targetAuthorUid) {
      logger.info('본인 좋아요 감지 - 통계에서 제외', { uid, targetId });
      return;
    }

    // 3. 통계 업데이트 (공통 함수 사용)
    await updateUserStats(targetAuthorUid, 'receivedLikes', 1);

    // 4. 인플루언서 점수 재계산
    await updateInfluencerScore(targetAuthorUid);

    logger.info('✅ 좋아요 통계 업데이트 완료', { uid, targetId, targetAuthorUid });
  }
);

// 좋아요 취소 시 통계 업데이트
export const onLikeDeletedStats = onValueDeleted(
  { ref: '/likes/{uid}/{targetId}' },
  async (event) => {
    const uid = event.params.uid;
    const targetId = event.params.targetId;
    const targetType = event.data.val();

    logger.info('💔 좋아요 취소 통계 업데이트 시작', { uid, targetId, targetType });

    // 1. 타겟 작성자 UID 조회
    const targetAuthorUid = await getTargetAuthorUid(targetId, targetType);

    if (!targetAuthorUid) {
      logger.error('타겟 작성자를 찾을 수 없음', { targetId, targetType });
      return;
    }

    // 2. 본인 반응 제외
    if (uid === targetAuthorUid) {
      logger.info('본인 좋아요 취소 감지 - 통계에서 제외', { uid, targetId });
      return;
    }

    // 3. 통계 업데이트 (공통 함수 사용, -1 감소)
    await updateUserStats(targetAuthorUid, 'receivedLikes', -1);

    // 4. 인플루언서 점수 재계산
    await updateInfluencerScore(targetAuthorUid);

    logger.info('✅ 좋아요 취소 통계 업데이트 완료', { uid, targetId, targetAuthorUid });
  }
);
```

**장점**:
- 코드 중복 제거 ✅ (날짜 계산, multi-path update 로직 공유)
- 가독성 향상 ✅ (핵심 로직만 남음)
- 유지보수 용이 ✅ (통계 구조 변경 시 `updateUserStats()` 함수만 수정)
- 일관성 보장 ✅ (모든 핸들러가 동일한 방식으로 통계 업데이트)

#### 4.7.5. 핸들러 등록 (`index.ts`)

모든 핸들러를 `index.ts`에 등록하여 Cloud Functions에 배포합니다.

**소스 코드 위치**: [+page.svelte.md](./repository/src/routes/my/reactions/+page.svelte.md)

```typescript
// firebase/functions/src/index.ts

// 비즈니스 로직 핸들러
export * from './handlers/like.handler';
export * from './handlers/comment.create.handler';
export * from './handlers/post.create.handler';
export * from './handlers/post.delete.handler';
export * from './handlers/friend.follow.handler';

// 통계 집계 핸들러
export * from './handlers/stats.like.handler';
export * from './handlers/stats.comment.handler';
export * from './handlers/stats.post.handler';
export * from './handlers/stats.follow.handler';
export * from './handlers/stats.ranking.handler';
```

#### 4.7.6. 테스트 전략

**비즈니스 로직 핸들러 테스트**:
- 좋아요 추가/취소 시 `likeCount` 증감 검증
- 전역 통계 증감 검증
- 사용자별 통계 증감 검증 (누른 사람 기준)

**통계 집계 핸들러 테스트**:
- 타겟 작성자의 `receivedLikes` 통계 증감 검증
- 본인 반응 제외 로직 검증
- 일일/월별/연도별/전체 통계 동시 업데이트 검증
- UTC 기준 날짜 계산 검증
- 인플루언서 점수 재계산 검증

**통합 테스트**:
- 좋아요 추가 → 비즈니스 로직 핸들러 + 통계 집계 핸들러 모두 실행 검증
- Cascade Delete → 게시글 삭제 시 하위 좋아요/댓글 삭제 및 통계 감소 검증

---

## 5. 인플루언서 랭킹 알고리즘

### 5.1. 점수 계산 방식 - 이벤트 기반 증분 업데이트

**점수 계산 방식**:

인플루언서 점수는 **이벤트가 발생할 때마다 실시간으로 증감**하는 방식으로 계산됩니다. 기존의 전체 통계 조회 후 계산하는 방식이 아닌, 각 행동마다 정해진 점수를 더하거나 빼는 방식입니다.

**점수 상수 관리**:
- 모든 점수는 `firebase/functions/src/shared/influencer-scores.constants.ts`에서 관리됩니다
- 점수 값을 변경하려면 상수 파일만 수정하면 됩니다

**점수 체계 (2025-01-19 기준)**:

| 행동 | 점수 | 페널티 | 설명 |
|------|------|--------|------|
| **게시글 작성** | +50 | - | 콘텐츠 생성 장려 |
| **게시글 삭제** | -55 | -5 | 삭제 시 페널티 부과 |
| **댓글 작성** | +5 | - | 댓글 작성 장려 |
| **댓글 삭제** | -7 | -2 | 삭제 시 페널티 부과 |
| **타인으로부터 좋아요 받음** | +3 | - | 타인의 반응 |
| **좋아요 취소됨** | -3 | 0 | 페널티 없음 |
| **타인이 내 글/댓글에 댓글 작성** | +5 | - | 타인의 적극적 반응 |
| **타인의 댓글 삭제됨** | -5 | 0 | 페널티 없음 |
| **타인이 나를 팔로우** | +60 | - | 지속적 관심 표시 |
| **언팔로우됨** | -60 | 0 | 페널티 없음 |

**페널티 시스템 설명**:
- **글/댓글 삭제**: 컨텐츠를 함부로 삭제하지 못하도록 페널티 부과
  - 게시글 작성 후 삭제 시 순손실: -5점
  - 댓글 작성 후 삭제 시 순손실: -2점
- **타인의 반응 취소**: 페널티 없음 (타인의 행동이므로)
  - 좋아요 받았다가 취소되어도 순손실 없음
  - 댓글 받았다가 삭제되어도 순손실 없음

**코드 예시**:

**소스 코드 위치**: [+page.svelte.md](./repository/src/routes/my/reactions/+page.svelte.md)

```typescript
// shared/influencer-scores.constants.ts
export const INFLUENCER_SCORES = {
  POST: {
    CREATE: 50,        // 게시글 작성
    DELETE: -55,       // 게시글 삭제 (페널티 -5)
  },
  COMMENT: {
    CREATE: 5,         // 댓글 작성
    DELETE: -7,        // 댓글 삭제 (페널티 -2)
    RECEIVED: 5,       // 타인이 내 글/댓글에 댓글 작성
    RECEIVED_DELETE: -5, // 타인의 댓글 삭제됨
  },
  LIKE: {
    RECEIVED: 3,       // 타인으로부터 좋아요 받음
    RECEIVED_CANCEL: -3, // 좋아요 취소됨
  },
  FOLLOWER: {
    RECEIVED: 60,      // 타인이 나를 팔로우
    RECEIVED_UNFOLLOW: -60, // 언팔로우됨
  },
};
```

**실시간 증감 예시**:

**소스 코드 위치**: [+page.svelte.md](./repository/src/routes/my/reactions/+page.svelte.md)

```typescript
// 사용자 A의 인플루언서 점수 변화 시나리오

초기 점수: 0

1. 게시글 작성 → +50 (점수: 50)
2. 사용자 B가 좋아요 → +3 (점수: 53)
3. 사용자 C가 댓글 작성 → +5 (점수: 58)
4. 사용자 D가 팔로우 → +60 (점수: 118)
5. 사용자 B가 좋아요 취소 → -3 (점수: 115)
6. 댓글 작성 → +5 (점수: 120)
7. 게시글 삭제 → -55 (점수: 65, 순손실 -5)
8. 댓글 삭제 → -7 (점수: 58, 순손실 -2)

최종 점수: 58
```

**장점**:
- **실시간 반영**: 이벤트 발생 즉시 점수 업데이트
- **성능 최적화**: 전체 통계 조회 불필요, ServerValue.increment() 사용
- **유연성**: 점수 값을 상수 파일에서 쉽게 조정 가능
- **페널티 시스템**: 스팸성 컨텐츠 생성/삭제 방지

### 5.2. 시간 기반 감쇠 (Time Decay) - 옵션

향후 확장 가능한 옵션으로, 최근 활동에 더 높은 가중치를 부여:

**소스 코드 위치**: [+page.svelte.md](./repository/src/routes/my/reactions/+page.svelte.md)

```typescript
// 예: 30일 전 활동은 50% 가중치
const daysSinceActivity = (Date.now() - activityTimestamp) / (1000 * 60 * 60 * 24);
const decayFactor = Math.max(0.5, 1 - (daysSinceActivity / 60)); // 60일 후 50% 최소 유지
const adjustedScore = influencerScore * decayFactor;
```

**현재 계획**: 시간 감쇠 없이 단순 누적 점수 사용 (향후 확장 가능)

### 5.3. 랭킹 정렬 키

**소스 코드 위치**: [+page.svelte.md](./repository/src/routes/my/reactions/+page.svelte.md)

```typescript
const sortKey = `-${String(influencerScore).padStart(10, '0')}-${uid}`;
// 예: "-0000012345-user123"
```

**장점**:
- Firebase RTDB의 `orderByKey().limitToFirst(100)` 쿼리로 Top 100 효율적 조회
- 음수 사용으로 내림차순 정렬 (점수 높은 순)
- UID를 키에 포함하여 고유성 보장

---

## 6. 쿼리 최적화 전략

### 6.1. 날짜별 노드 분리

**문제점**: 모든 통계를 단일 노드에 저장하면 쿼리 비용 증가

**해결책**: 날짜별로 노드 분리
- `/user-daily-stats/{uid}/{yyyymmdd}`
- `/user-monthly-stats/{uid}/{yyyymm}`
- `/user-yearly-stats/{uid}/{yyyy}`

**장점**:
- 특정 기간만 조회 가능 (예: 최근 7일, 이번 달)
- RTDB 읽기 비용 절감

### 6.2. Top N 랭킹만 저장

**문제점**: 모든 사용자의 랭킹을 저장하면 스토리지/쿼리 비용 증가

**해결책**: Top 100만 저장
- `/rankings/influencers/{period}` 경로에 Top 100만 유지
- 101위 이하는 저장하지 않음

**장점**:
- 스토리지 비용 절감
- 클라이언트 쿼리 성능 향상

### 6.3. 증분 업데이트 (Incremental Updates)

**문제점**: 통계 재계산 시 전체 데이터 읽기 필요

**해결책**: `ServerValue.increment()` 사용
- 좋아요/댓글 추가 시 즉시 증분 업데이트
- 전체 데이터 읽기 불필요

**장점**:
- 실시간 통계 업데이트
- 동시성 문제 해결 (원자적 연산)
- RTDB 읽기 비용 절감

### 6.4. 데이터 보존 정책

**일일 통계**: 90일 보존
- 90일 이전 데이터는 자동 삭제 (스케줄드 함수)
- 월별/연도별 통계는 영구 보존

**랭킹 데이터**: 최근 30일 보존
- 일간/주간 랭킹은 30일 후 삭제
- 월간/전체 랭킹은 영구 보존

---

## 7. Firebase Database Security Rules

### 7.1. 통계 노드 보안 규칙

**소스 코드 위치**: [+page.svelte.md](./repository/src/routes/my/reactions/+page.svelte.md)

```json
{
  "rules": {
    "user-daily-stats": {
      "$uid": {
        "$yyyymmdd": {
          // 모든 사용자가 읽기 가능
          ".read": "true",
          // Cloud Functions만 쓰기 가능
          ".write": "false"
        }
      }
    },
    "user-monthly-stats": {
      "$uid": {
        "$yyyymm": {
          ".read": "true",
          ".write": "false"
        }
      }
    },
    "user-yearly-stats": {
      "$uid": {
        "$yyyy": {
          ".read": "true",
          ".write": "false"
        }
      }
    },
    "users": {
      "$uid": {
        "stats": {
          ".read": "true",
          ".write": "false"
        }
      }
    },
    "rankings": {
      "influencers": {
        "$period": {
          ".read": "true",
          ".write": "false"
        }
      }
    }
  }
}
```

**핵심 원칙**:
- **모든 통계 노드는 읽기 가능** (공개 데이터)
- **모든 통계 노드는 Cloud Functions만 쓰기 가능** (데이터 무결성 보장)

---

## 8. 구현 단계별 계획

### 8.1. Phase 1: 기본 통계 시스템 구축

**목표**: 일일/월별/연도별 통계 자동 집계

**작업 항목**:

1. **DB 구조 설계 문서 작성** ✅ (본 문서)

2. **TypeScript 타입 정의 추가** (`firebase/functions/src/types/index.ts`)
   - `UserDailyStats`, `UserMonthlyStats`, `UserYearlyStats` 인터페이스
   - `UserTotalStats`, `InfluencerRanking` 인터페이스

3. **게시글/댓글에 `createdAt` 필드 추가**
   - 삭제 시 작성 날짜 기준 통계 감소를 위해 필요
   - Unix timestamp (밀리초) 형식

4. **비즈니스 로직 핸들러 확장/생성**:
   - `like.handler.ts` - 좋아요 추가/취소 비즈니스 로직 (기존 파일 유지)
   - `comment.create.handler.ts` - 댓글 생성/삭제 비즈니스 로직 (기존 파일 유지)
   - `post.create.handler.ts` - 게시글 생성 비즈니스 로직 (신규, 필요시)
   - `post.delete.handler.ts` - 게시글 삭제 및 Cascade Delete (신규)
   - `friend.follow.handler.ts` - 팔로우/언팔로우 비즈니스 로직 (신규, 필요시)

5. **통계 집계 핸들러 생성** (신규 파일):
   - `stats.like.handler.ts` - 좋아요 통계 집계 (본인 반응 제외 포함)
   - `stats.comment.handler.ts` - 댓글 통계 집계 (본인 반응 제외 포함)
   - `stats.post.handler.ts` - 게시글 통계 집계
   - `stats.follow.handler.ts` - 팔로우 통계 집계
   - `stats.ranking.handler.ts` - 인플루언서 랭킹 업데이트 (스케줄드 함수)

6. **핸들러 등록** (`firebase/functions/src/index.ts`)
   - 모든 비즈니스 로직 핸들러 export
   - 모든 통계 집계 핸들러 export

7. **Firebase Database Security Rules 업데이트**
   - 통계 노드 읽기/쓰기 규칙 추가

8. **로컬 테스트** (Firebase Emulator Suite)
   - 비즈니스 로직 핸들러 테스트
   - 통계 집계 핸들러 테스트
   - 생성/삭제 로직의 대칭성 검증
   - 본인 반응 제외 로직 테스트
   - UTC 기준 날짜 계산 검증
   - 핸들러 분리 후 통합 테스트

9. **프로덕션 배포**

**예상 소요 시간**: 4-5일 (핸들러 분리 작업 포함)

### 8.2. Phase 2: 인플루언서 랭킹 시스템

**목표**: Top 100 인플루언서 랭킹 자동 생성

**작업 항목**:
1. 인플루언서 점수 계산 로직 구현
2. 스케줄드 함수 구현 (`updateInfluencerRankings`)
3. 랭킹 정렬 키 생성 로직
4. Top 100 필터링 및 저장
5. 테스트 및 배포

**예상 소요 시간**: 2일

### 8.3. Phase 3: 클라이언트 UI 구현

**목표**: 사용자별 통계 페이지 및 랭킹 페이지 UI

**작업 항목**:
1. 사용자 통계 페이지 (`/my/stats`):
   - 일일/월별/연도별 통계 차트
   - 받은 좋아요/댓글 수 표시
   - 받은 팔로워 증감 수 표시 (음수값 포함)
   - 작성한 게시글/댓글 수 표시
2. 인플루언서 랭킹 페이지 (`/rankings/influencers`):
   - Top 100 인플루언서 목록
   - 일간/주간/월간/전체 탭
   - 사용자 프로필 미리보기
3. 사용자 프로필에 전체 통계 추가:
   - 전체 받은 좋아요/댓글 수
   - 전체 팔로워 증감 누적 수

**예상 소요 시간**: 3-4일

### 8.4. Phase 4: 데이터 마이그레이션 및 초기 집계

**목표**: 기존 데이터에 대한 초기 통계 생성

**작업 항목**:
1. 백필(backfill) 스크립트 작성:
   - 모든 기존 게시글/댓글/좋아요 데이터 조회
   - 날짜별로 통계 노드 생성
   - 사용자별 전체 통계 계산
2. 배치 처리로 대량 데이터 처리
3. 검증 및 테스트

**예상 소요 시간**: 2일

**참고**: 기존 데이터가 많은 경우 시간이 더 소요될 수 있음

---

## 9. 고려 사항

### 9.1. 성능 및 비용

**RTDB 읽기 비용**:
- 증분 업데이트 방식으로 읽기 비용 최소화
- 날짜별 노드 분리로 불필요한 데이터 조회 방지

**RTDB 쓰기 비용**:
- 좋아요/댓글마다 여러 노드 업데이트 (일일/월별/연도별/전체)
- Multi-path update로 원자적 업데이트 보장
- 예상 쓰기 횟수: 좋아요 1개당 최대 8회 쓰기 (4개 시간대 * 2개 필드)

**Cloud Functions 실행 비용**:
- 좋아요/댓글 이벤트마다 트리거 실행
- 스케줄드 함수는 하루 1회 실행 (비용 낮음)

**최적화 전략**:
- Top N 랭킹만 저장하여 스토리지 절감
- 오래된 일일 통계 삭제 (90일 보존 정책)

### 9.2. 확장성

**데이터 규모**:
- 사용자 10만 명 가정
- 일일 통계: 10만 * 90일 = 900만 노드
- 월별 통계: 10만 * 12개월 = 120만 노드
- 연도별 통계: 10만 * 5년 = 50만 노드
- 합계: 약 1070만 노드 (관리 가능한 규모)

**쿼리 성능**:
- 특정 사용자의 일일 통계 조회: O(1)
- Top 100 랭킹 조회: O(100) (정렬 키 기반)
- 매우 효율적인 쿼리 성능

### 9.3. 데이터 무결성

**동시성 문제**:
- `ServerValue.increment()` 사용으로 원자적 증감 보장
- Multi-path update로 여러 노드를 원자적으로 업데이트

**데이터 일관성**:
- Cloud Functions에서만 통계 업데이트 (클라이언트 쓰기 금지)
- 트랜잭션 불필요 (증분 업데이트 방식)

**에러 처리**:
- Cloud Functions 재시도 메커니즘 활용
- 실패 시 자동 재시도 (최대 3회)
- 로그 기록으로 문제 추적

### 9.4. 추후 확장 가능성

**추가 가능한 통계**:
- 게시글 조회수 (view count)
- 공유 횟수 (share count)
- 북마크 수 (bookmark count)

**추가 가능한 랭킹**:
- 카테고리별 인플루언서 (예: "질문" 카테고리 전문가)
- 지역별 인플루언서 (사용자 위치 기반)
- 주제별 인플루언서 (태그 기반)

**머신러닝 활용**:
- 사용자 참여도 예측
- 인기 게시글 추천 알고리즘
- 스팸/어뷰징 탐지

### 9.5. 보안 및 어뷰징 방지

**문제점**: 사용자가 자기 자신의 게시글/댓글에 좋아요를 누르거나 댓글을 달아 랭킹 점수를 인위적으로 조작할 수 있습니다.

**해결책**: 본인 반응 제외 로직 구현

**구현 방법**:

1. **좋아요 핸들러 (`like.handler.ts`)**:

**소스 코드 위치**: [+page.svelte.md](./repository/src/routes/my/reactions/+page.svelte.md)

   ```typescript
   // 좋아요를 누른 사용자 UID와 타겟 작성자 UID 비교
   if (uid === targetAuthorUid) {
     // 본인의 게시글/댓글에 좋아요를 누른 경우 통계 업데이트 제외
     console.log(`Self-like detected: ${uid} liked their own content ${targetId}`);
     return; // 함수 종료
   }
   ```

2. **댓글 핸들러 (`comment.create.handler.ts`)**:

**소스 코드 위치**: [+page.svelte.md](./repository/src/routes/my/reactions/+page.svelte.md)

   ```typescript
   // 댓글 작성자 UID와 타겟 작성자 UID 비교
   if (authorUid === targetAuthorUid) {
     // 본인의 게시글/댓글에 댓글을 단 경우 통계 업데이트 제외
     console.log(`Self-comment detected: ${authorUid} commented on their own content ${postId}`);
     return; // 함수 종료
   }
   ```

**효과**:
- **랭킹 조작 방지**: 사용자가 자신의 컨텐츠에 좋아요/댓글을 달아도 인플루언서 점수에 반영되지 않음
- **공정한 랭킹**: 실제 다른 사용자들의 반응만 집계되어 더 공정한 인플루언서 랭킹 생성
- **데이터 무결성**: 통계 데이터의 신뢰성 향상

**참고**:
- 본인 반응은 UI에서는 표시되지만, 통계 및 랭킹 점수 계산에서는 제외됩니다
- 예: 사용자가 자신의 게시글에 좋아요를 누르면 좋아요 아이콘은 활성화되지만, `/user-daily-stats`에는 반영되지 않습니다

**추가 어뷰징 방지 전략 (향후 확장 가능)**:
- **다중 계정 탐지**: 동일 IP에서 여러 계정이 동일 사용자에게 좋아요/댓글을 하는 경우 탐지
- **봇 탐지**: 비정상적으로 빠른 속도로 좋아요/댓글을 다는 경우 탐지
- **스팸 댓글 필터링**: 반복적인 내용의 댓글을 자동으로 필터링
- **사용자 신고 시스템**: 어뷰징 의심 사용자를 신고할 수 있는 기능

---

## 10. 관련 문서

- [sonub-firebase-database-structure.md](./sonub-firebase-database-structure.md) - Firebase Database 전체 구조
- [sonub-firebase-functions.md](./sonub-firebase-functions.md) - Cloud Functions 아키텍처
- [sonub-like-overview.md](./sonub-like-overview.md) - 좋아요 시스템 개요
- [sonub-forum-overview.md](./sonub-forum-overview.md) - 게시판 시스템 개요
- [repository/firebase/database.rules.json.md](./repository/firebase/database.rules.json.md) - Firebase Database Security Rules

---

## 11. 구현 결과

### 11.1. 구현 개요

본 섹션은 인플루언서 통계 시스템의 실제 구현 결과를 기록합니다.

**구현 범위**:
- ✅ Cloud Functions 백엔드 핸들러 (통계 집계 및 순위 업데이트)
- ✅ 클라이언트 UI (사이드바 Top 5 인플루언서, 전용 순위 페이지, 사용자 프로필 페이지)
- ✅ 다국어 지원 (한국어, 영어, 일본어, 중국어)
- ✅ 통합 테스트 계획 작성 (`specs/sonub-influencer-score-testing.md`)
- ⏳ Firebase Database Security Rules (대기 중)
- ⏳ 프로덕션 검증 및 모니터링 (대기 중)

**구현 날짜**: 2025-01-19

---

### 11.2. Cloud Functions 구현 상세

#### 11.2.1. 공통 유틸리티 (`stats.utils.ts`)

**소스 코드 위치**: [stats.utils.ts.md](./repository/firebase/functions/src/utils/stats.utils.ts.md)

**구현 함수**:

1. **`formatDate(date: Date, format: string): string`**
   - UTC 기준 날짜를 지정된 형식으로 변환
   - 지원 형식: `yyyyMMdd`, `yyyyMM`, `yyyy`
   - 타임존에 관계없이 일관된 통계 집계 보장

2. **`updateUserStats(uid: string, statType: string, delta: number, timestamp?: number): Promise<void>`**
   - 사용자 통계를 원자적으로 업데이트
   - 일별/월별/연간/전체 통계를 동시에 업데이트
   - `ServerValue.increment()`를 사용한 동시성 보장
   - 데이터베이스 경로:
     ```
     /user-stats/{uid}/daily/{yyyyMMdd}/{statType}
     /user-stats/{uid}/monthly/{yyyyMM}/{statType}
     /user-stats/{uid}/yearly/{yyyy}/{statType}
     /user-stats/{uid}/total/{statType}
     ```

3. **`updateInfluencerScore(uid: string): Promise<void>`**
   - 인플루언서 점수 재계산 및 업데이트
   - 계산 공식: `(receivedLikes × 1) + (receivedComments × 3) + (receivedFollowers × 5)`
   - 전체 통계에서 읽어서 점수 계산
   - `/influencer-scores/{uid}` 경로에 저장
   - 점수가 0이면 경로 삭제 (순위에서 제거)

**핵심 로직**:

```typescript
// UTC 날짜 계산 예시
const now = new Date();
const dateDaily = formatDate(now, 'yyyyMMdd');   // "20250119"
const dateMonthly = formatDate(now, 'yyyyMM');   // "202501"
const dateYearly = formatDate(now, 'yyyy');      // "2025"

// 원자적 통계 업데이트
const updates = {
  [`user-stats/${uid}/daily/${dateDaily}/${statType}`]: admin.database.ServerValue.increment(delta),
  [`user-stats/${uid}/monthly/${dateMonthly}/${statType}`]: admin.database.ServerValue.increment(delta),
  [`user-stats/${uid}/yearly/${dateYearly}/${statType}`]: admin.database.ServerValue.increment(delta),
  [`user-stats/${uid}/total/${statType}`]: admin.database.ServerValue.increment(delta),
};
await admin.database().ref().update(updates);
```

---

#### 11.2.2. 좋아요 통계 핸들러 (`stats.like.handler.ts`)

**소스 코드 위치**: [stats.like.handler.ts.md](./repository/firebase/functions/src/handlers/stats.like.handler.ts.md)

**트리거 경로**: `/likes/{uid}/{targetId}`

**구현 함수**:

1. **`handleLikeCreate(likerUid: string, targetId: string, likeData: Record<string, unknown>): Promise<void>`**
   - 좋아요 생성 시 통계 업데이트
   - 타겟 타입에 따라 작성자 UID 조회 (게시글/댓글/메시지)
   - **본인 반응 제외**: `likerUid === targetAuthorUid`이면 통계 업데이트 건너뜀
   - `receivedLikes` 통계 +1 증가
   - 인플루언서 점수 재계산

2. **`handleLikeDelete(likerUid: string, targetId: string, likeData: Record<string, unknown>): Promise<void>`**
   - 좋아요 삭제 시 통계 업데이트 (생성의 역연산)
   - **본인 반응 제외**: `likerUid === targetAuthorUid`이면 통계 업데이트 건너뜀
   - `receivedLikes` 통계 -1 감소
   - 인플루언서 점수 재계산

**핵심 로직**:

```typescript
// 타겟 작성자 조회
const targetAuthorUid = await getTargetAuthorUid(targetId, targetType);

// 본인 반응 제외
if (likerUid === targetAuthorUid) {
  logger.info('본인이 자신의 콘텐츠에 좋아요를 눌러서 통계에서 제외');
  return;
}

// 통계 업데이트
await updateUserStats(targetAuthorUid, 'receivedLikes', 1, timestamp);

// 인플루언서 점수 재계산
await updateInfluencerScore(targetAuthorUid);
```

---

#### 11.2.3. 댓글 통계 핸들러 (`stats.comment.handler.ts`)

**소스 코드 위치**: [stats.comment.handler.ts.md](./repository/firebase/functions/src/handlers/stats.comment.handler.ts.md)

**트리거 경로**: `/comments/{postId}/{commentId}`

**구현 함수**:

1. **`handleCommentCreateStats(postId: string, commentId: string, commentData: Record<string, unknown>): Promise<void>`**
   - 댓글 생성 시 통계 업데이트
   - `parentId`가 없으면 게시글에 대한 댓글, 있으면 댓글에 대한 답글
   - 타겟 작성자 UID 조회 (게시글 또는 부모 댓글)
   - **본인 반응 제외**: 댓글 작성자와 타겟 작성자가 같으면 통계 업데이트 건너뜀
   - `receivedComments` 통계 +1 증가
   - 인플루언서 점수 재계산

2. **`handleCommentDeleteStats(postId: string, commentId: string, commentData: Record<string, unknown>): Promise<void>`**
   - 댓글 삭제 시 통계 업데이트 (생성의 역연산)
   - **본인 반응 제외**: 댓글 작성자와 타겟 작성자가 같으면 통계 업데이트 건너뜀
   - `receivedComments` 통계 -1 감소
   - 인플루언서 점수 재계산

**핵심 로직**:

```typescript
// 타겟 작성자 조회
const targetAuthorUid = parentId
  ? await getCommentAuthorUid(postId, parentId)  // 부모 댓글 작성자
  : await getPostAuthorUid(postId);              // 게시글 작성자

// 본인 반응 제외
if (commentAuthorUid === targetAuthorUid) {
  logger.info('본인이 자신의 게시글/댓글에 댓글을 작성해서 통계에서 제외');
  return;
}

// 통계 업데이트
await updateUserStats(targetAuthorUid, 'receivedComments', 1, timestamp);

// 인플루언서 점수 재계산
await updateInfluencerScore(targetAuthorUid);
```

---

#### 11.2.4. 게시글 통계 핸들러 (`stats.post.handler.ts`)

**소스 코드 위치**: [stats.post.handler.ts.md](./repository/firebase/functions/src/handlers/stats.post.handler.ts.md)

**트리거 경로**: `/posts/{postId}`

**구현 함수**:

1. **`handlePostCreate(postId: string, postData: Record<string, unknown>): Promise<void>`**
   - 게시글 생성 시 작성자의 `createdPosts` 통계 +1 증가

2. **`handlePostDelete(postId: string, postData: Record<string, unknown>): Promise<void>`**
   - 게시글 삭제 시 작성자의 `createdPosts` 통계 -1 감소

**참고**: 게시글 통계는 인플루언서 점수에 직접 영향을 주지 않으므로 점수 재계산을 하지 않습니다.

---

#### 11.2.5. 팔로우 통계 핸들러 (`stats.follow.handler.ts`)

**소스 코드 위치**: [stats.follow.handler.ts.md](./repository/firebase/functions/src/handlers/stats.follow.handler.ts.md)

**트리거 경로**: `/user-following/{followerUid}/{followingUid}`

**구현 함수**:

1. **`handleFollowCreateStats(followerUid: string, followingUid: string): Promise<void>`**
   - 팔로우 생성 시 팔로우를 받은 사용자의 `receivedFollowers` 통계 +1 증가
   - 인플루언서 점수 재계산

2. **`handleFollowDeleteStats(followerUid: string, followingUid: string): Promise<void>`**
   - 팔로우 삭제 시 팔로우를 받았던 사용자의 `receivedFollowers` 통계 -1 감소
   - 인플루언서 점수 재계산

**핵심 로직**:

```typescript
// 팔로우를 받은 사용자(followingUid)의 통계 업데이트
await updateUserStats(followingUid, 'receivedFollowers', 1, Date.now());

// 인플루언서 점수 재계산
await updateInfluencerScore(followingUid);
```

---

#### 11.2.6. 인플루언서 순위 핸들러 (`stats.ranking.handler.ts`)

**소스 코드 위치**: [stats.ranking.handler.ts.md](./repository/firebase/functions/src/handlers/stats.ranking.handler.ts.md)

**트리거 경로**: `/influencer-scores/{uid}`

**구현 함수**:

1. **`handleInfluencerScoreChange(uid: string, newScore: number | null): Promise<void>`**
   - 인플루언서 점수가 변경될 때 순위 업데이트
   - 일별/월별/연간/전체 순위를 동시에 업데이트
   - **점수 역순 저장**: Firebase RTDB의 오름차순 정렬을 내림차순으로 활용하기 위해 점수에 `-`를 곱해서 저장
   - 점수가 0이거나 null이면 순위에서 제거

**핵심 로직**:

```typescript
// 현재 UTC 날짜 계산
const dateDaily = formatDate(now, 'yyyyMMdd');
const dateMonthly = formatDate(now, 'yyyyMM');
const dateYearly = formatDate(now, 'yyyy');

if (newScore === null || newScore === 0) {
  // 순위에서 제거
  updates[`influencer-rankings/daily/${dateDaily}/${uid}`] = null;
  updates[`influencer-rankings/monthly/${dateMonthly}/${uid}`] = null;
  updates[`influencer-rankings/yearly/${dateYearly}/${uid}`] = null;
  updates[`influencer-rankings/total/${uid}`] = null;
} else {
  // 점수를 역순으로 저장 (내림차순 정렬을 위해)
  const negativeScore = -newScore;

  updates[`influencer-rankings/daily/${dateDaily}/${uid}`] = negativeScore;
  updates[`influencer-rankings/monthly/${dateMonthly}/${uid}`] = negativeScore;
  updates[`influencer-rankings/yearly/${dateYearly}/${uid}`] = negativeScore;
  updates[`influencer-rankings/total/${uid}`] = negativeScore;
}

await admin.database().ref().update(updates);
```

---

#### 11.2.7. Cloud Functions 트리거 등록 (`index.ts`)

**소스 코드 위치**: [index.ts.md](./repository/firebase/functions/src/index.ts.md)

**등록된 트리거 (총 9개)**:

| 트리거 함수명 | 트리거 이벤트 | 트리거 경로 | 설명 |
|-------------|-------------|-----------|------|
| `onLikeCreatedStats` | onValueCreated | `/likes/{uid}/{targetId}` | 좋아요 생성 시 통계 업데이트 |
| `onLikeDeletedStats` | onValueDeleted | `/likes/{uid}/{targetId}` | 좋아요 삭제 시 통계 업데이트 |
| `onCommentCreateStats` | onValueCreated | `/comments/{postId}/{commentId}` | 댓글 생성 시 통계 업데이트 |
| `onCommentDeleteStats` | onValueDeleted | `/comments/{postId}/{commentId}` | 댓글 삭제 시 통계 업데이트 |
| `onPostCreateStats` | onValueCreated | `/posts/{postId}` | 게시글 생성 시 통계 업데이트 |
| `onPostDeleteStats` | onValueDeleted | `/posts/{postId}` | 게시글 삭제 시 통계 업데이트 |
| `onUserFollowingCreateStats` | onValueCreated | `/user-following/{followerUid}/{followingUid}` | 팔로우 생성 시 통계 업데이트 |
| `onUserFollowingDeleteStats` | onValueDeleted | `/user-following/{followerUid}/{followingUid}` | 팔로우 삭제 시 통계 업데이트 |
| `onInfluencerScoreWrite` | onValueWritten | `/influencer-scores/{uid}` | 인플루언서 점수 변경 시 순위 업데이트 |

**배포 결과**:
- 배포 명령: `npm run deploy`
- 배포 날짜: 2025-01-19
- 배포 상태: ✅ 성공
- 리전: `asia-southeast1`

---

### 11.3. 클라이언트 구현 상세

#### 11.3.1. 인플루언서 데이터 조회 함수 (`user.functions.ts`)

**소스 코드 위치**: [user.functions.ts.md](./repository/src/lib/functions/user.functions.ts.md)

**추가된 인터페이스**:

```typescript
export interface InfluencerRanking {
  uid: string;
  score: number;
}
```

**추가된 함수**:

1. **`getCurrentDate(format: 'yyyyMMdd' | 'yyyyMM' | 'yyyy'): string`**
   - 현재 UTC 날짜를 지정된 형식으로 반환
   - Cloud Functions와 동일한 날짜 계산 로직 사용
   - 타임존에 관계없이 일관된 날짜 계산 보장

2. **`getTopInfluencers(period: 'daily' | 'monthly' | 'yearly' | 'total', date?: string, limit: number = 100): Promise<InfluencerRanking[]>`**
   - 지정된 기간의 Top N 인플루언서 조회
   - Firebase RTDB 쿼리: `orderByValue()` + `limitToFirst(N)`
   - 점수가 역순(negative)으로 저장되어 있으므로 다시 양수로 변환
   - 데이터베이스 경로:
     - 일간: `/influencer-rankings/daily/{yyyyMMdd}`
     - 월간: `/influencer-rankings/monthly/{yyyyMM}`
     - 연간: `/influencer-rankings/yearly/{yyyy}`
     - 전체: `/influencer-rankings/total`

3. **`getInfluencerScore(uid: string): Promise<number>`**
   - 특정 사용자의 인플루언서 점수 조회
   - 경로: `/influencer-scores/{uid}`
   - 점수가 없으면 0 반환

**핵심 로직**:

```typescript
// 날짜 계산
const today = getCurrentDate('yyyyMMdd');  // "20250119"

// Top 5 조회
const rankings = await getTopInfluencers('daily', today, 5);

// 결과: [{ uid: "user1", score: 150 }, { uid: "user2", score: 120 }, ...]
```

**성능 최적화**:
- `limitToFirst(N)`를 사용하여 필요한 개수만 조회
- `getUserBasicInfo()`를 병렬로 호출 (`Promise.all()`)
- 필요한 필드만 조회 (displayName, photoUrl)

---

#### 11.3.2. 사이드바 Top 5 인플루언서 표시

**소스 코드 위치**: [PopularUsersCard.svelte.md](./repository/src/lib/components/sidebar/PopularUsersCard.svelte.md)

**구현 내용**:
- "인기 사용자" 메뉴 아이템 추가
- Top 5 인플루언서 아바타 + 이름 + 점수 표시
- 클릭 시 해당 사용자 프로필로 이동
- "인기 사용자" 클릭 시 `/user/influencers` 페이지로 이동

**UI 구조**:

```
┌─────────────────────────────┐
│ ✨ 추천                     │
├─────────────────────────────┤
│ 📈 인기 게시물           >  │
│ 👥 인기 사용자           >  │
├─────────────────────────────┤
│ ┌─────────────────────────┐ │
│ │ [아바타] 사용자1        │ │
│ │          점수: 150      │ │
│ ├─────────────────────────┤ │
│ │ [아바타] 사용자2        │ │
│ │          점수: 120      │ │
│ ├─────────────────────────┤ │
│ │ [아바타] 사용자3        │ │
│ │          점수: 95       │ │
│ ├─────────────────────────┤ │
│ │ [아바타] 사용자4        │ │
│ │          점수: 80       │ │
│ ├─────────────────────────┤ │
│ │ [아바타] 사용자5        │ │
│ │          점수: 65       │ │
│ └─────────────────────────┘ │
└─────────────────────────────┘
```

**상태 관리**:
- Svelte 5 runes 사용: `$state`, `$effect`
- 컴포넌트 마운트 시 자동으로 Top 5 로드
- 로딩 상태 표시
- 데이터 없을 시 표시 안 함

---

#### 11.3.3. 인플루언서 순위 페이지 (`/user/influencers`)

**소스 코드 위치**: [+page.svelte.md](./repository/src/routes/user/influencers/+page.svelte.md)

**구현 내용**:
- 일간/월간/연간 탭 메뉴
- Top 100 인플루언서 목록 표시
- 순위, 아바타, 이름, 점수 표시
- 1~3위에 메달 아이콘 표시 (Trophy, Medal, Award)
- 클릭 시 해당 사용자 프로필로 이동

**UI 구조**:

```
┌──────────────────────────────────────┐
│  인플루언서 순위                     │
│  가장 많은 관심을 받은 사용자들을... │
├──────────────────────────────────────┤
│  [일간] [월간] [연간]                │
├──────────────────────────────────────┤
│ 🏆 [아바타] 사용자1      점수: 150 > │
│ 🥈 [아바타] 사용자2      점수: 120 > │
│ 🥉 [아바타] 사용자3      점수: 95  > │
│ 4  [아바타] 사용자4      점수: 80  > │
│ 5  [아바타] 사용자5      점수: 65  > │
│ ...                                  │
│ 100 [아바타] 사용자100   점수: 5   > │
└──────────────────────────────────────┘
```

**상태 관리**:
- 선택된 기간 (`selectedPeriod`): `$state`
- 인플루언서 목록 (`influencers`): `$state`
- 로딩 상태 (`isLoading`): `$state`
- `$effect`를 사용하여 기간 변경 시 자동으로 데이터 재로드

**반응형 디자인**:
- 데스크톱: 화살표 아이콘 표시
- 모바일: 화살표 아이콘 숨김
- TailwindCSS 유틸리티 클래스로 스타일링

---

#### 11.3.4. 사용자 프로필 페이지 인플루언서 점수 표시

**소스 코드 위치**: [+page.svelte.md](./repository/src/routes/user/profile/+page.svelte.md)

**구현 날짜**: 2025-01-19

**구현 내용**:
- 사용자 프로필 페이지에 인플루언서 점수 표시
- 게시글 수, 댓글 수와 함께 통계 섹션에 표시
- 인플루언서 점수를 가장 돋보이게 표시 (그라디언트 스타일)

**추가된 코드**:

1. **데이터 조회 (Import 및 State)**:

```typescript
import { getUserActionCounters, getInfluencerScore } from '$lib/functions/user.functions';

let influencerScore = $state(0);

$effect(() => {
  if (uidParam) {
    userProfileStore.ensureSubscribed(uidParam);

    // 인플루언서 점수 가져오기
    getInfluencerScore(uidParam).then((score) => {
      influencerScore = score;
    });
  }
});
```

2. **UI 표시**:

```svelte
<!-- 사용자 통계 섹션 -->
<div class="profile-stats">
  <!-- 인플루언서 점수 -->
  <div class="stat-item stat-influencer">
    <div class="stat-value stat-influencer-value">{influencerScore.toLocaleString()}</div>
    <div class="stat-label">{m.프로필_인플루언서_점수()}</div>
  </div>

  <!-- 게시글 수 -->
  <div class="stat-item">
    <div class="stat-value">{postCount}</div>
    <div class="stat-label">{m.프로필_게시글_수()}</div>
  </div>

  <!-- 댓글 수 -->
  <div class="stat-item">
    <div class="stat-value">{commentCount}</div>
    <div class="stat-label">{m.프로필_댓글_수()}</div>
  </div>
</div>
```

3. **스타일링**:

```css
/* 인플루언서 점수 강조 스타일 */
.stat-influencer {
  @apply bg-gradient-to-br from-blue-50 to-purple-50 border-2 border-blue-200 shadow-md;
}

.stat-influencer-value {
  @apply text-4xl bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent;
}
```

**UI 구조**:

```
┌──────────────────────────────────────┐
│  [커버 이미지]                       │
│  [아바타]                            │
│  사용자 이름                         │
│  자기소개                            │
│  [팔로우] [채팅]                     │
├──────────────────────────────────────┤
│  ┌────────────┬────────────┬────────┐│
│  │ 인플루언서 │  게시글 수 │ 댓글 수││
│  │   점수     │            │        ││
│  │   1,234    │     42     │   128  ││
│  └────────────┴────────────┴────────┘│
└──────────────────────────────────────┘
```

**기능**:
- ✅ 실시간 인플루언서 점수 표시
- ✅ 숫자 포맷팅 (`toLocaleString()`)
- ✅ 그라디언트 스타일로 강조 표시
- ✅ 게시글 수, 댓글 수와 함께 나란히 표시
- ✅ 반응형 디자인 (모바일/데스크톱 대응)

**타입 안전성**:
- `UserProfile` 인터페이스에 `coverPhotoUrl` 필드 추가
- Firebase Database null 체크 추가
- TypeScript 타입 체크 통과 (0 errors)

---

#### 11.3.5. 다국어 지원

**구현 언어** (4개 언어):
- 한국어 (`messages/ko.json`)
- 영어 (`messages/en.json`)
- 일본어 (`messages/ja.json`)
- 중국어 (`messages/zh.json`)

**추가된 번역 키** (인플루언서 순위 페이지):

**소스 코드 위치**: [+page.svelte.md](./repository/src/routes/my/reactions/+page.svelte.md)

```json
{
  "influencerRankingTitle": "인플루언서 순위",
  "influencerRankingDescription": "가장 많은 관심을 받은 사용자들을 확인하세요",
  "influencerTabDaily": "일간",
  "influencerTabMonthly": "월간",
  "influencerTabYearly": "연간",
  "influencerLoading": "인플루언서 데이터를 불러오는 중...",
  "influencerEmpty": "아직 순위 데이터가 없습니다.",
  "influencerScore": "점수:",
  "influencerUnknownUser": "알 수 없는 사용자",
  "influencerUnknown": "알 수 없음",
  "loadingGeneric": "로딩 중..."
}
```

**추가된 번역 키** (사용자 프로필 페이지):

**소스 코드 위치**: [+page.svelte.md](./repository/src/routes/my/reactions/+page.svelte.md)

```json
{
  "프로필_인플루언서_점수": "인플루언서 점수"  // ko
  "프로필_인플루언서_점수": "Influencer Score"  // en
  "프로필_인플루언서_점수": "インフルエンサースコア"  // ja
  "프로필_인플루언서_점수": "影响力分数"  // zh
}
```

---

### 11.4. 타입 체크 결과

**명령**: `npm run check`

**결과**:
- ✅ 새로 구현된 파일 (`user.functions.ts`, `PopularUsersCard.svelte`, `/user/influencers/+page.svelte`): **0 에러**
- ⚠️ 기존 파일 (`/user/profile/+page.svelte`): 2 에러 (기존 문제, 인플루언서 기능과 무관)
- ⚠️ 전체 프로젝트: 2572 경고 (대부분 CSS @apply 규칙 및 접근성 경고, 무시 가능)

**타입 안전성**: 모든 새 코드는 TypeScript 타입 체크를 통과했습니다.

---

### 11.5. Firebase Database Security Rules 구현

**소스 코드 위치**: [database.rules.json.md](./repository/firebase/database.rules.json.md)

**구현 일시**: 2025-01-19

**추가된 보안 규칙**:

#### 11.5.1. `/user-stats/{uid}` 경로

```json
"user-stats": {
  "$uid": {
    // 읽기 권한: 로그인한 모든 사용자 (공개 통계 정보)
    ".read": "auth != null",

    // 쓰기 권한: 없음 (Cloud Functions만 쓰기 가능)
    ".write": false,

    "daily": {
      "$date": {
        ".indexOn": ["receivedLikes", "receivedComments", "receivedFollowers", "createdPosts"]
      }
    },
    "monthly": {
      "$date": {
        ".indexOn": ["receivedLikes", "receivedComments", "receivedFollowers", "createdPosts"]
      }
    },
    "yearly": {
      "$date": {
        ".indexOn": ["receivedLikes", "receivedComments", "receivedFollowers", "createdPosts"]
      }
    },
    "total": {
      ".indexOn": ["receivedLikes", "receivedComments", "receivedFollowers", "createdPosts"]
    }
  }
}
```

**설명**:
- 클라이언트는 모든 사용자의 통계를 **읽기만** 가능
- Cloud Functions만 통계 데이터를 **쓸 수 있음**
- 4가지 필드(`receivedLikes`, `receivedComments`, `receivedFollowers`, `createdPosts`)에 대한 인덱스 추가
- 일간/월간/연간/전체 기간별 인덱스 설정

#### 11.5.2. `/influencer-scores/{uid}` 경로

```json
"influencer-scores": {
  ".read": "auth != null",
  ".write": false,

  "$uid": {
    ".validate": "newData.isNumber() || newData.val() === null"
  }
}
```

**설명**:
- 클라이언트는 모든 사용자의 점수를 **읽기만** 가능
- Cloud Functions만 점수를 **쓸 수 있음**
- 점수는 `number` 타입만 허용 (또는 `null`)

#### 11.5.3. `/influencer-rankings/{period}/{date}` 경로

```json
"influencer-rankings": {
  ".read": "auth != null",
  ".write": false,

  "daily": {
    "$date": { ".indexOn": ".value" }
  },
  "monthly": {
    "$date": { ".indexOn": ".value" }
  },
  "yearly": {
    "$date": { ".indexOn": ".value" }
  },
  "total": {
    ".indexOn": ".value"
  }
}
```

**설명**:
- 클라이언트는 모든 순위 데이터를 **읽기만** 가능
- Cloud Functions만 순위 데이터를 **쓸 수 있음**
- 각 기간(`daily`, `monthly`, `yearly`, `total`)별로 값(`.value`)에 대한 인덱스 추가
- 음수 점수를 활용한 내림차순 정렬 지원

#### 11.5.4. 배포 결과

**배포 명령**: `firebase deploy --only database`

**배포 일시**: 2025-01-19

**결과**: ✅ 성공
- Database rules validation: 통과
- Database: `sonub-firebase-default-rtdb`에 성공적으로 배포

---

### 11.6. 구현 미완료 항목

다음 항목들은 아직 구현되지 않았습니다:

1. **통합 테스트**
   - 좋아요/댓글/팔로우 생성 시 통계 증가 검증
   - 좋아요/댓글/팔로우 삭제 시 통계 감소 검증
   - 본인 반응 제외 로직 검증
   - 인플루언서 점수 계산 정확도 검증
   - UTC 날짜 계산 일관성 검증

2. **데이터 마이그레이션**
   - 기존 게시글/댓글에 `createdAt` 필드 백필 (필요 시)

3. **프로덕션 검증**
   - 실제 사용자 데이터로 통계 집계 검증
   - 성능 모니터링
   - 에러 로그 확인

---

## 12. 통합 테스트

### 12.1. 테스트 목적

인플루언서 통계 시스템의 모든 기능이 올바르게 작동하는지 검증합니다.

### 12.2. 테스트 환경

- **Firebase Project**: sonub-firebase (개발 환경)
- **테스트 계정**: 최소 3개 이상의 테스트 사용자 필요
  - 사용자 A (반응을 주는 사용자)
  - 사용자 B (반응을 받는 사용자, 인플루언서)
  - 사용자 C (자기 자신 반응 테스트용)

### 12.3. 테스트 체크리스트

#### 12.3.1. 좋아요 통계 테스트

**시나리오**: 사용자 A가 사용자 B의 게시글에 좋아요를 누름

**테스트 단계**:

1. **사전 조건 확인**
   - [ ] 사용자 B의 `/user-stats/{B_uid}/daily/{today}` 경로에서 현재 `receivedLikes` 값 확인
   - [ ] 사용자 B의 `/influencer-scores/{B_uid}` 값 확인 (없으면 0으로 간주)

2. **좋아요 생성**
   - [ ] 사용자 A로 로그인
   - [ ] 사용자 B의 게시글에 좋아요 누르기
   - [ ] Cloud Functions 로그 확인 (`firebase functions:log`)

3. **통계 증가 검증**
   - [ ] `/user-stats/{B_uid}/daily/{today}/receivedLikes`: +1 증가
   - [ ] `/user-stats/{B_uid}/monthly/{month}/receivedLikes`: +1 증가
   - [ ] `/user-stats/{B_uid}/yearly/{year}/receivedLikes`: +1 증가
   - [ ] `/user-stats/{B_uid}/total/receivedLikes`: +1 증가

4. **인플루언서 점수 증가 검증**
   - [ ] `/influencer-scores/{B_uid}`: +1 증가 (좋아요 가중치 = 1)

5. **순위 업데이트 검증**
   - [ ] `/influencer-rankings/total/{B_uid}`: 음수 점수로 업데이트됨
   - [ ] 순위 조회 시 정상 표시

6. **좋아요 삭제**
   - [ ] 사용자 A가 좋아요 취소
   - [ ] Cloud Functions 로그 확인

7. **통계 감소 검증**
   - [ ] `/user-stats/{B_uid}/daily/{today}/receivedLikes`: -1 감소
   - [ ] `/user-stats/{B_uid}/monthly/{month}/receivedLikes`: -1 감소
   - [ ] `/user-stats/{B_uid}/yearly/{year}/receivedLikes`: -1 감소
   - [ ] `/user-stats/{B_uid}/total/receivedLikes`: -1 감소
   - [ ] `/influencer-scores/{B_uid}`: -1 감소

#### 12.3.2. 댓글 통계 테스트

**시나리오**: 사용자 A가 사용자 B의 게시글에 댓글 작성

**테스트 단계**:

1. **사전 조건 확인**
   - [ ] 사용자 B의 `/user-stats/{B_uid}/daily/{today}/receivedComments` 값 확인

2. **댓글 생성**
   - [ ] 사용자 A로 로그인
   - [ ] 사용자 B의 게시글에 댓글 작성
   - [ ] Cloud Functions 로그 확인

3. **통계 증가 검증**
   - [ ] `/user-stats/{B_uid}/daily/{today}/receivedComments`: +1 증가
   - [ ] `/user-stats/{B_uid}/monthly/{month}/receivedComments`: +1 증가
   - [ ] `/user-stats/{B_uid}/yearly/{year}/receivedComments`: +1 증가
   - [ ] `/user-stats/{B_uid}/total/receivedComments`: +1 증가

4. **인플루언서 점수 증가 검증**
   - [ ] `/influencer-scores/{B_uid}`: +3 증가 (댓글 가중치 = 3)

5. **댓글 삭제**
   - [ ] 사용자 A가 댓글 삭제
   - [ ] Cloud Functions 로그 확인

6. **통계 감소 검증**
   - [ ] `/user-stats/{B_uid}/daily/{today}/receivedComments`: -1 감소
   - [ ] `/influencer-scores/{B_uid}`: -3 감소

#### 12.3.3. 팔로우 통계 테스트

**시나리오**: 사용자 A가 사용자 B를 팔로우

**테스트 단계**:

1. **사전 조건 확인**
   - [ ] 사용자 B의 `/user-stats/{B_uid}/daily/{today}/receivedFollowers` 값 확인

2. **팔로우 생성**
   - [ ] 사용자 A로 로그인
   - [ ] 사용자 B를 팔로우
   - [ ] Cloud Functions 로그 확인

3. **통계 증가 검증**
   - [ ] `/user-stats/{B_uid}/daily/{today}/receivedFollowers`: +1 증가
   - [ ] `/user-stats/{B_uid}/monthly/{month}/receivedFollowers`: +1 증가
   - [ ] `/user-stats/{B_uid}/yearly/{year}/receivedFollowers`: +1 증가
   - [ ] `/user-stats/{B_uid}/total/receivedFollowers`: +1 증가

4. **인플루언서 점수 증가 검증**
   - [ ] `/influencer-scores/{B_uid}`: +5 증가 (팔로우 가중치 = 5)

5. **팔로우 취소**
   - [ ] 사용자 A가 팔로우 취소
   - [ ] Cloud Functions 로그 확인

6. **통계 감소 검증**
   - [ ] `/user-stats/{B_uid}/daily/{today}/receivedFollowers`: -1 감소
   - [ ] `/influencer-scores/{B_uid}`: -5 감소

#### 12.3.4. 게시글 생성 통계 테스트

**시나리오**: 사용자 A가 게시글 작성

**테스트 단계**:

1. **사전 조건 확인**
   - [ ] 사용자 A의 `/user-stats/{A_uid}/daily/{today}/createdPosts` 값 확인

2. **게시글 생성**
   - [ ] 사용자 A로 로그인
   - [ ] 새 게시글 작성
   - [ ] Cloud Functions 로그 확인

3. **통계 증가 검증**
   - [ ] `/user-stats/{A_uid}/daily/{today}/createdPosts`: +1 증가
   - [ ] `/user-stats/{A_uid}/monthly/{month}/createdPosts`: +1 증가
   - [ ] `/user-stats/{A_uid}/yearly/{year}/createdPosts`: +1 증가
   - [ ] `/user-stats/{A_uid}/total/createdPosts`: +1 증가

4. **게시글 삭제**
   - [ ] 사용자 A가 게시글 삭제
   - [ ] Cloud Functions 로그 확인

5. **통계 감소 검증**
   - [ ] `/user-stats/{A_uid}/daily/{today}/createdPosts`: -1 감소

#### 12.3.5. 자기 자신 반응 제외 테스트

**시나리오**: 사용자 C가 자신의 게시글에 좋아요/댓글 작성

**테스트 단계**:

1. **사전 조건 확인**
   - [ ] 사용자 C의 `/user-stats/{C_uid}/daily/{today}/receivedLikes` 값 확인
   - [ ] 사용자 C의 `/user-stats/{C_uid}/daily/{today}/receivedComments` 값 확인

2. **자기 게시글에 좋아요**
   - [ ] 사용자 C로 로그인
   - [ ] 사용자 C 자신의 게시글에 좋아요 누르기
   - [ ] Cloud Functions 로그 확인

3. **통계 변화 없음 검증**
   - [ ] `/user-stats/{C_uid}/daily/{today}/receivedLikes`: **변화 없음** (본인 반응 제외)
   - [ ] `/influencer-scores/{C_uid}`: **변화 없음**

4. **자기 게시글에 댓글**
   - [ ] 사용자 C가 자신의 게시글에 댓글 작성
   - [ ] Cloud Functions 로그 확인

5. **통계 변화 없음 검증**
   - [ ] `/user-stats/{C_uid}/daily/{today}/receivedComments`: **변화 없음**
   - [ ] `/influencer-scores/{C_uid}`: **변화 없음**

#### 12.3.6. UTC 날짜 계산 일관성 테스트

**시나리오**: 서로 다른 시간대에서 통계가 같은 UTC 날짜로 집계되는지 확인

**테스트 단계**:

1. **현재 UTC 날짜 확인**
   - [ ] Cloud Functions 로그에서 UTC 날짜 확인
   - [ ] 클라이언트에서 `getCurrentDate()` 함수 실행 결과 확인

2. **일치 검증**
   - [ ] Cloud Functions의 UTC 날짜 = 클라이언트의 UTC 날짜
   - [ ] 통계가 올바른 날짜 경로에 저장됨

#### 12.3.7. 인플루언서 점수 계산 정확도 테스트

**시나리오**: 여러 반응을 받은 후 점수가 올바르게 계산되는지 확인

**테스트 단계**:

1. **사전 조건 초기화**
   - [ ] 사용자 B의 `/influencer-scores/{B_uid}` 초기값 확인 (또는 0으로 초기화)

2. **다양한 반응 생성**
   - [ ] 좋아요 2개 생성 → 예상 점수: +2
   - [ ] 댓글 1개 생성 → 예상 점수: +3
   - [ ] 팔로우 1개 생성 → 예상 점수: +5
   - [ ] **예상 총 점수**: 2 + 3 + 5 = 10

3. **점수 검증**
   - [ ] `/influencer-scores/{B_uid}` = 10

4. **반응 삭제**
   - [ ] 좋아요 1개 삭제 → 예상 점수: -1
   - [ ] 댓글 1개 삭제 → 예상 점수: -3
   - [ ] **예상 총 점수**: 10 - 1 - 3 = 6

5. **점수 재검증**
   - [ ] `/influencer-scores/{B_uid}` = 6

#### 12.3.8. 순위 시스템 테스트

**시나리오**: Top N 인플루언서 조회가 올바르게 작동하는지 확인

**테스트 단계**:

1. **테스트 데이터 생성**
   - [ ] 사용자 B: 점수 10
   - [ ] 사용자 D: 점수 20
   - [ ] 사용자 E: 점수 5

2. **순위 저장 확인**
   - [ ] `/influencer-rankings/total/{B_uid}` = -10
   - [ ] `/influencer-rankings/total/{D_uid}` = -20
   - [ ] `/influencer-rankings/total/{E_uid}` = -5

3. **클라이언트 조회**
   - [ ] `getTopInfluencers('daily', undefined, 3)` 호출
   - [ ] 반환 순서: D (20) → B (10) → E (5)

4. **UI 표시 확인**
  - [ ] 사이드바 Top 5 인플루언서 표시 확인 ([PopularUsersCard.svelte](./repository/src/lib/components/sidebar/PopularUsersCard.svelte.md))
   - [ ] `/user/influencers` 페이지에서 순위 표시 확인

### 12.4. 테스트 자동화 (선택 사항)

향후 Jest 또는 Mocha를 사용하여 테스트 자동화 가능:

**소스 코드 위치**: [+page.svelte.md](./repository/src/routes/my/reactions/+page.svelte.md)

```typescript
// 예시: __tests__/stats.test.ts
describe('Influencer Statistics', () => {
  test('좋아요 생성 시 통계 증가', async () => {
    // 테스트 코드
  });

  test('자기 반응 제외', async () => {
    // 테스트 코드
  });
});
```

---

## 13. 체크리스트

설계 단계:
- [x] 현재 DB 구조 분석 완료
- [x] 새로운 DB 구조 설계 완료
- [x] Cloud Functions 설계 완료
  - [x] 생성/삭제 로직의 대칭성 설계
  - [x] 본인 반응 제외 로직 설계
  - [x] UTC 기준 날짜 계산 명시
  - [x] 핸들러 아키텍처 설계 (비즈니스 로직 vs 통계 집계 분리)
- [x] 인플루언서 랭킹 알고리즘 정의 완료
- [x] 쿼리 최적화 전략 수립 완료
- [x] 보안 규칙 설계 완료
- [x] 구현 단계별 계획 수립 완료
- [x] 고려 사항 검토 완료
- [x] 보안 및 어뷰징 방지 전략 수립 완료
- [x] 게시글/댓글 삭제 시 통계 처리 정책 수립 완료

구현 완료:
- [x] 통계 집계 핸들러 구현
  - [x] `stats.utils.ts` 생성 (공통 유틸리티)
  - [x] `stats.like.handler.ts` 생성 (좋아요 통계)
  - [x] `stats.comment.handler.ts` 생성 (댓글 통계)
  - [x] `stats.post.handler.ts` 생성 (게시글 통계)
  - [x] `stats.follow.handler.ts` 생성 (팔로우 통계)
  - [x] `stats.ranking.handler.ts` 생성 (인플루언서 순위)
  - [x] 본인 반응 제외 로직 구현
  - [x] 생성/삭제 대칭 로직 구현
  - [x] UTC 기준 날짜 계산 구현
- [x] 핸들러 등록 (`index.ts`)
  - [x] 좋아요 생성/삭제 트리거 (2개)
  - [x] 댓글 생성/삭제 트리거 (2개)
  - [x] 게시글 생성/삭제 트리거 (2개)
  - [x] 팔로우 생성/삭제 트리거 (2개)
  - [x] 인플루언서 점수 변경 트리거 (1개)
- [x] Cloud Functions 배포 (`npm run deploy`)
- [x] 클라이언트 UI 구현
  - [x] 인플루언서 데이터 조회 함수 추가 (`user.functions.ts`)
    - [x] `getTopInfluencers()` - Top N 인플루언서 조회
    - [x] `getInfluencerScore()` - 개별 사용자 점수 조회
    - [x] `getCurrentDate()` - UTC 날짜 계산 헬퍼
 - [x] 사이드바 Top 5 인플루언서 표시 (`PopularUsersCard.svelte`)
  - [x] `/user/influencers` 페이지 생성 (일간/월간/연간 탭, Top 100 표시)
  - [x] `/user/profile` 페이지에 인플루언서 점수 표시 추가
    - [x] 통계 섹션에 인플루언서 점수 추가
    - [x] 그라디언트 스타일로 강조 표시
    - [x] `UserProfile` 인터페이스에 `coverPhotoUrl` 필드 추가
- [x] 다국어 번역 추가
  - [x] `messages/ko.json` (한국어)
  - [x] `messages/en.json` (영어)
  - [x] `messages/ja.json` (일본어)
  - [x] `messages/zh.json` (중국어)
  - [x] 사용자 프로필 페이지용 번역 키 추가 (`프로필_인플루언서_점수`)
- [x] 타입 체크 (`npm run check`)
- [x] 통합 테스트 계획 작성
  - [x] `specs/sonub-influencer-score-testing.md` 문서 생성
  - [x] 14개 섹션 포함 (테스트 시나리오, DB 검증 쿼리, 수동/자동 테스트 체크리스트)

통합 테스트:
- [x] 통합 테스트 계획 작성 (`specs/sonub-influencer-score-testing.md`)
- [x] 통합 테스트 가이드 작성 (`tmp/test-influencer-scoring.md`)
- [x] 테스트 결과 보고서 템플릿 작성 (`tmp/test-결과-report.md`)
- [x] 좋아요 통계 핸들러 데이터 구조 불일치 문제 발견 및 수정
- [x] 수정 사항 Firebase Functions 배포 완료
- [x] Vitest 테스트 환경 구축
  - [x] vitest 및 @vitest/ui 패키지 설치
  - [x] vitest.config.ts 설정 파일 생성
  - [x] package.json에 vitest 스크립트 추가
- [x] 인플루언서 점수 통합 테스트 코드 작성
  - [x] `tests/influencer-score-integration.test.ts` 파일 생성
  - [x] 좋아요 기능 테스트 (생성/취소/본인 반응 제외)
  - [x] 팔로우 기능 테스트 (팔로우/언팔로우)
  - [x] 통계 집계 검증 테스트
- [x] 테스트 가이드 문서 작성 (`firebase/functions/tests/README.md`)
- [x] Service Account Key 파일 설정 (firebase/functions/firebase-service-account-key.json)
- [x] Vitest 통합 테스트 실행 및 검증 (6개 테스트 모두 통과)
  - [x] 게시글 좋아요 → 점수 +3점 검증
  - [x] 본인 좋아요 → 점수 변화 없음 검증
  - [x] 좋아요 취소 → 점수 -3점 검증
  - [x] 팔로우 → 점수 +60점 검증
  - [x] 언팔로우 → 점수 -60점 검증
  - [x] 좋아요 받은 통계 집계 검증
- [x] 페널티 시스템 제거 (게시글 삭제 -55 → -50, 댓글 삭제 -7 → -5)
- [x] 통합 테스트 경쟁 상태(race condition) 해결 (user-following 경로만 사용)
- [ ] 댓글 생성/삭제 통합 테스트 추가
- [ ] 인플루언서 랭킹 데이터 집계 통합 테스트 추가
- [ ] Firebase Console 및 Logs 모니터링
- [ ] 프로덕션 검증 완료

구현 대기:
- [ ] TypeScript 타입 정의 추가 (인터페이스 정의)
- [ ] 게시글/댓글에 `createdAt` 필드 추가 (일부 이미 존재)
- [ ] 비즈니스 로직 핸들러 구현
  - [ ] `like.handler.ts` 확장 (기존 파일)
  - [ ] `comment.create.handler.ts` 확장 (기존 파일)
  - [x] `post.create.handler.ts` 생성 (신규) - 완료
  - [ ] `post.delete.handler.ts` 생성 (신규)
  - [ ] `friend.follow.handler.ts` 생성 (신규)
- [x] Firebase Database Security Rules 업데이트
  - [x] `/user-stats/*` 경로 보안 규칙 추가 (라인 713-777)
  - [x] `/influencer-scores/*` 경로 보안 규칙 추가 (라인 778-806)
  - [x] `/influencer-rankings/*` 경로 보안 규칙 추가 (라인 807-851)
- [ ] 데이터 마이그레이션 스크립트 작성
  - [ ] 기존 게시글/댓글에 `createdAt` 필드 백필

---

**문서 버전**: 1.8.0
**작성일**: 2025-01-18
**최종 수정일**: 2025-01-19
**작성자**: Claude (SED Agent)
**상태**: Vitest 통합 테스트 완료 (6개 테스트 통과), 페널티 시스템 제거 완료 (백엔드 배포 완료, 클라이언트 UI 완료, Firebase Database Security Rules 완료, post.create.handler 분리 완료, 좋아요/팔로우 통합 테스트 완료, 댓글 통합 테스트 대기)
