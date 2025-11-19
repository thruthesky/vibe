---
name: sonub-reactions-stats-plan
title: 리액션 집계 및 통계 기능 - 설계 계획서
version: 1.0.0
description: 사용자별 좋아요/댓글 집계, 일/월/년 통계, 인플루언서 랭킹 시스템 설계
author: Claude (SED Agent)
email: noreply@anthropic.com
homepage: https://github.com/thruthesky/
license: GPL-3.0
updated: 2025-11-18
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

### 2.1. 기존 통계 시스템

**전역 통계 (`/stats/counters/`)**:
- `user`: 전체 사용자 수
- `like`: 전체 좋아요 수
- `comment`: 전체 댓글 수
- `follow`: 전체 팔로우 수
- `message`: 전체 채팅 메시지 수

**사용자별 통계 (`/users/{uid}/counters/`)**:
- `user`: 사용자 생성 (항상 1)
- `like`: **사용자가 누른** 좋아요 수
- `comment`: **사용자가 작성한** 댓글 수
- `follow`: **사용자가 팔로우한** 수
- `chat`: **사용자가 보낸** 채팅 메시지 수

### 2.2. 좋아요 시스템

**데이터 구조**:
- `/likes/{uid}/{targetId}` = `targetType` (예: "message", "comment", "post", "chat-message-{roomId}")
- `/likes-by/{targetId}/{uid}` = `true` (타겟별 좋아요한 사용자 목록)
- 각 게시글/댓글/메시지에 `likeCount` 필드 저장

**Cloud Functions**:
- `like.handler.ts` - 좋아요 추가/취소 시 자동으로 `likeCount` 업데이트
- `/stats/counters/like` 전역 통계 자동 증감
- `/users/{uid}/counters/like` 사용자별 통계 자동 증감 (누른 사람 기준)

### 2.3. 댓글 시스템

**데이터 구조**:
- `/posts/{postId}` - 포럼 게시글
  - `totalChildCount`: 게시글의 총 댓글 수 (모든 레벨 포함)
  - `childCount`: 게시글의 첫 번째 레벨 댓글 수
  - `likeCount`: 게시글이 받은 좋아요 수
- `/comments/{postId}/{commentId}` - 댓글
  - `childCount`: 댓글의 직접 자식 댓글 수 (답글 수)
  - `likeCount`: 댓글이 받은 좋아요 수
  - `authorUid`: 댓글 작성자 UID
  - `parentId`: 부모 댓글 ID (없으면 null)
- `/chat-messages/{roomId}/{messageId}` - 채팅 메시지 (게시글 역할도 함)
  - `totalChildCount`: 메시지의 총 댓글 수
  - `likeCount`: 메시지가 받은 좋아요 수
- `/chat-message-comments/{messageId}/{commentId}` - 채팅 메시지 댓글
  - `childCount`: 댓글의 답글 수
  - `likeCount`: 댓글이 받은 좋아요 수
- `/comment-locations/{commentId}` = `postId` (댓글 ID → 부모 게시글 매핑)

**Cloud Functions**:
- `comment.create.handler.ts` - 댓글 생성 시 자동으로 `childCount`, `totalChildCount` 업데이트
- `/stats/counters/comment` 전역 통계 자동 증가

### 2.4. 부족한 점

1. **사용자가 "받은" 리액션 통계 없음**:
   - 현재 `/users/{uid}/counters/like`는 사용자가 **누른** 좋아요 수만 기록
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
- **증분 업데이트**: Cloud Functions가 실시간으로 `ServerValue.increment()` 사용
- **쿼리 최적화**: 날짜별로 노드가 분리되어 특정 기간 조회 용이

### 3.2. 사용자별 월별 통계 (`/user-monthly-stats/{uid}/{yyyymm}`)

일일 통계를 월 단위로 롤업(roll-up)합니다.

**경로**: `/user-monthly-stats/{uid}/{yyyymm}`

**필드**:
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

**핸들러 위치**: `firebase/functions/src/handlers/like.handler.ts` (기존 파일 확장)

**처리 로직**:

1. **targetType 파싱** - "message", "comment", "post", "chat-message-{roomId}"
2. **타겟 작성자 UID 조회**:
   - `targetType === "post"` → `/posts/{targetId}/authorUid`
   - `targetType === "comment"` → `/comment-locations/{targetId}` → `/comments/{postId}/{targetId}/authorUid`
   - `targetType.startsWith("chat-message-")` → `/chat-messages/{roomId}/{targetId}/senderUid`
3. **오늘 날짜 계산** - `yyyymmdd` 형식 (예: "20250118")
4. **Multi-path update**로 다음 경로를 원자적으로 업데이트:
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

**핸들러 위치**: `firebase/functions/src/handlers/comment.create.handler.ts` (기존 파일 확장)

**처리 로직**:

1. **댓글 정보 조회**:
   - `authorUid`: 댓글 작성자
   - `parentId`: 부모 댓글 ID (null이면 게시글에 직접 달린 댓글)
2. **타겟 작성자 UID 조회**:
   - `parentId === null` → 게시글 작성자: `/posts/{postId}/authorUid`
   - `parentId !== null` → 부모 댓글 작성자: `/comments/{postId}/{parentId}/authorUid`
3. **오늘 날짜 계산** - `yyyymmdd` 형식
4. **Multi-path update**:
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

**채팅 메시지 댓글 (`/chat-message-comments/{messageId}/{commentId}`)도 동일**

### 4.3. 게시글/댓글 작성 시 통계 업데이트

**트리거**:
- `/posts/{postId}` (onValueCreated)
- `/comments/{postId}/{commentId}` (onValueCreated)

**처리 로직**:
- 작성자의 일일/월별/연도별 통계에서 `createdPosts` 또는 `createdComments` 증가
- 참고용 데이터로, 인플루언서 점수에는 영향 없음

### 4.4. 팔로우/언팔로우 시 통계 업데이트

**트리거**:
- `/follows/{followerUid}/{followingUid}` (onValueCreated) - 팔로우 시
- `/follows/{followerUid}/{followingUid}` (onValueDeleted) - 언팔로우 시

**핸들러 위치**: `firebase/functions/src/handlers/friend.follow.handler.ts` (신규 생성)

**처리 로직**:

**팔로우 추가 시** (onValueCreated):

1. **팔로잉 대상 UID 확인** - `followingUid` (팔로우를 받는 사용자)
2. **오늘 날짜 계산** - `yyyymmdd` 형식 (예: "20250118")
3. **Multi-path update**로 다음 경로를 원자적으로 업데이트:
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
- 현재 Sonub에는 팔로우 시스템의 정확한 DB 구조가 명시되지 않았습니다
- 위 경로 `/follows/{followerUid}/{followingUid}`는 일반적인 패턴을 가정한 것입니다
- 실제 구현 시 현재 팔로우 시스템의 DB 구조에 맞게 경로를 조정해야 합니다

### 4.5. 인플루언서 랭킹 업데이트 (스케줄드 함수)

**스케줄**: 매일 자정 (00:00 UTC) 실행

**함수 이름**: `updateInfluencerRankings`

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

---

## 5. 인플루언서 랭킹 알고리즘

### 5.1. 점수 계산식

**기본 계산식**:
```typescript
influencerScore = receivedLikes + (receivedComments * 2)
```

**가중치 설명**:
- **좋아요 (x1)**: 간단한 반응, 낮은 참여도
- **댓글 (x2)**: 적극적인 참여, 높은 참여도

**예시**:
- 사용자 A: 좋아요 100개, 댓글 50개 → 점수 = 100 + (50 * 2) = 200
- 사용자 B: 좋아요 150개, 댓글 30개 → 점수 = 150 + (30 * 2) = 210
- 결과: 사용자 B가 더 높은 점수 (댓글이 더 중요)

**팔로워 포함 여부 (선택사항)**:

현재 계획에서는 팔로워를 인플루언서 점수 계산에 포함하지 않습니다. 이유는 다음과 같습니다:
- 팔로워 수는 누적 지표로, 실제 참여도와는 다른 의미
- 좋아요와 댓글은 실제 컨텐츠 품질을 반영하는 실시간 반응

하지만 향후 필요 시 다음과 같이 팔로워를 포함할 수 있습니다:

```typescript
// 옵션: 팔로워를 포함한 계산식
influencerScore = receivedLikes + (receivedComments * 2) + (totalReceivedFollowers * 0.5)
```

**팔로워 가중치 (x0.5)**:
- 팔로워는 누적 지표이므로 낮은 가중치 적용
- 실제 참여도(좋아요, 댓글)보다는 덜 중요
- 하지만 팔로워 기반(fan base)도 인플루언서의 중요한 요소

### 5.2. 시간 기반 감쇠 (Time Decay) - 옵션

향후 확장 가능한 옵션으로, 최근 활동에 더 높은 가중치를 부여:

```typescript
// 예: 30일 전 활동은 50% 가중치
const daysSinceActivity = (Date.now() - activityTimestamp) / (1000 * 60 * 60 * 24);
const decayFactor = Math.max(0.5, 1 - (daysSinceActivity / 60)); // 60일 후 50% 최소 유지
const adjustedScore = influencerScore * decayFactor;
```

**현재 계획**: 시간 감쇠 없이 단순 누적 점수 사용 (향후 확장 가능)

### 5.3. 랭킹 정렬 키

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
1. DB 구조 설계 문서 작성 ✅ (본 문서)
2. TypeScript 타입 정의 추가 (`firebase/functions/src/types/index.ts`)
3. Cloud Functions 핸들러 확장:
   - `like.handler.ts` - 좋아요 통계 업데이트 로직 추가
   - `comment.create.handler.ts` - 댓글 통계 업데이트 로직 추가
   - `post.create.handler.ts` - 게시글 통계 업데이트 로직 추가 (신규)
   - `friend.follow.handler.ts` - 팔로우/언팔로우 통계 업데이트 로직 추가 (신규)
4. Firebase Database Security Rules 업데이트
5. 로컬 테스트 (Firebase Emulator Suite)
6. 프로덕션 배포

**예상 소요 시간**: 2-3일

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

---

## 10. 관련 문서

- [sonub-firebase-database-structure.md](./sonub-firebase-database-structure.md) - Firebase Database 전체 구조
- [sonub-firebase-functions.md](./sonub-firebase-functions.md) - Cloud Functions 아키텍처
- [sonub-like-overview.md](./sonub-like-overview.md) - 좋아요 시스템 개요
- [sonub-forum-overview.md](./sonub-forum-overview.md) - 게시판 시스템 개요
- [repository/firebase/database.rules.json.md](./repository/firebase/database.rules.json.md) - Firebase Database Security Rules

---

## 11. 체크리스트

설계 단계:
- [x] 현재 DB 구조 분석 완료
- [x] 새로운 DB 구조 설계 완료
- [x] Cloud Functions 설계 완료
- [x] 인플루언서 랭킹 알고리즘 정의 완료
- [x] 쿼리 최적화 전략 수립 완료
- [x] 보안 규칙 설계 완료
- [x] 구현 단계별 계획 수립 완료
- [x] 고려 사항 검토 완료

구현 대기:
- [ ] TypeScript 타입 정의 추가
- [ ] Cloud Functions 핸들러 구현
- [ ] Firebase Database Security Rules 업데이트
- [ ] 테스트 작성 및 실행
- [ ] 클라이언트 UI 구현
- [ ] 데이터 마이그레이션 스크립트 작성
- [ ] 프로덕션 배포

---

**문서 버전**: 1.0.0
**작성일**: 2025-01-18
**작성자**: Claude (SED Agent)
**상태**: 설계 완료 (구현 대기)
