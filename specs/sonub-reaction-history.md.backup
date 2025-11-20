---
title: Sonub 리액션 히스토리 시스템
status: active
created: 2025-11-20
updated: 2025-11-20
author: Claude (Sonnet 4.5)
tags:
  - reaction
  - history
  - activity
  - firebase
  - cloud-functions
dependencies:
  - sonub-firebase-database-structure.md
  - sonub-firebase-functions.md
  - sonub-like-overview.md
  - sonub-forum-post.md
  - sonub-friend-overview.md
---

# 1. 개요

이 문서는 Sonub의 리액션 히스토리 시스템을 정의합니다. 사용자의 모든 활동(좋아요, 게시글 작성, 댓글 작성, 팔로우 등)을 기록하고, 다른 사용자로부터 받은 반응을 시간순으로 추적할 수 있도록 합니다.

## 1.1 범위

- 두 가지 형태의 리액션 기록 시스템
  - **나의 발자취 (My Actions)**: 내가 발생시킨 모든 리액션 기록
  - **받은 반응 (Received Reactions)**: 다른 사용자가 나에게 또는 내 콘텐츠에 발생시킨 리액션 기록
- Firebase Cloud Functions를 통한 자동 기록
- 클라이언트 UI (나의 발자취, 받은 반응 페이지)
- Realtime Database 규칙 및 Cloud Functions 핸들러 동작 흐름

## 1.2 용어

| 용어 | 설명 |
| --- | --- |
| `my-actions` | 내가 발생시킨 리액션 기록 경로 (`/my-actions/{uid}`) |
| `received-reactions` | 다른 사용자로부터 받은 리액션 기록 경로 (`/received-reactions/{uid}`) |
| `fromUid` | 리액션을 발생시킨 사용자의 UID |
| `type` | 리액션 유형: `like`, `post`, `comment`, `follow` |
| `targetType` | 리액션 대상 타입: `post`, `comment`, `user` |
| `targetId` | 리액션 대상 ID (postId, commentId, userUid) |
| `createdAt` | 리액션 발생 타임스탬프 (Unix timestamp, milliseconds) |

# 2. 데이터 모델

## 2.1 RTDB 구조

### 2.1.1 나의 발자취 (My Actions)

```
/my-actions/{uid}/{pushKey}
  fromUid: string         # 본인의 UID
  type: string            # 'like' | 'post' | 'comment' | 'follow'
  targetType: string      # 'post' | 'comment' | 'user'
  targetId: string        # postId | commentId | userUid
  createdAt: number       # Unix timestamp (ms)
```

**예시:**
```json
{
  "my-actions": {
    "user123": {
      "-N1234567890abc": {
        "fromUid": "user123",
        "type": "like",
        "targetType": "post",
        "targetId": "post-abc123",
        "createdAt": 1700000000000
      },
      "-N1234567890def": {
        "fromUid": "user123",
        "type": "comment",
        "targetType": "post",
        "targetId": "comment-xyz789",
        "createdAt": 1700000001000
      }
    }
  }
}
```

### 2.1.2 받은 반응 (Received Reactions)

```
/received-reactions/{uid}/{pushKey}
  fromUid: string         # 리액션을 발생시킨 사용자의 UID
  type: string            # 'like' | 'post' | 'comment' | 'follow'
  targetType: string      # 'post' | 'comment' | 'user'
  targetId: string        # postId | commentId | userUid
  createdAt: number       # Unix timestamp (ms)
```

**예시:**
```json
{
  "received-reactions": {
    "user456": {
      "-N1234567890ghi": {
        "fromUid": "user123",
        "type": "like",
        "targetType": "post",
        "targetId": "post-def456",
        "createdAt": 1700000002000
      },
      "-N1234567890jkl": {
        "fromUid": "user789",
        "type": "follow",
        "targetType": "user",
        "targetId": "user456",
        "createdAt": 1700000003000
      }
    }
  }
}
```

## 2.2 인덱싱

- `createdAt` 필드를 기준으로 정렬하므로 `.indexOn: ["createdAt"]` 인덱스 필요
- pushKey는 기본적으로 시간순 정렬을 보장하지만, DatabaseListView 사용을 위해 `createdAt` 필드 사용

# 3. 아키텍처

```
┌─────────────────────────────┐
│ User Action                 │
│  - 좋아요 클릭              │
│  - 게시글 작성              │
│  - 댓글 작성                │
│  - 팔로우                   │
└──────────────┬──────────────┘
               │
┌──────────────▼──────────────┐
│ Firebase Realtime Database  │
│  - /likes/{uid}/{targetId}  │
│  - /posts/{postId}          │
│  - /comments/{postId}/{id}  │
│  - /user-following/{uid}/{followingUid}│
└──────────────┬──────────────┘
               │ onCreate/onDelete
┌──────────────▼──────────────┐
│ Cloud Functions             │
│  - onLikeCreate             │
│  - onLikeDelete             │
│  - onPostCreate             │
│  - onCommentCreate          │
│  - onUserFollowingCreate    │
│  - onUserFollowingDelete    │
└──────────────┬──────────────┘
               │ write
┌──────────────▼──────────────┐
│ Reaction History            │
│  - /my-actions/{uid}        │
│  - /received-reactions/{uid}│
└──────────────┬──────────────┘
               │ read
┌──────────────▼──────────────┐
│ Client UI                   │
│  - 나의 발자취              │
│  - 받은 반응                │
└─────────────────────────────┘
```

# 4. 흐름

## 4.1 좋아요 생성 시

1. 사용자가 게시글/댓글에 좋아요 클릭
2. `/likes/{uid}/{targetId}` 경로에 데이터 생성
3. Cloud Functions `onLikeCreate` 트리거 발생
4. 함수에서 다음 작업 수행:
   - `/my-actions/{fromUid}` 에 좋아요 기록 추가
   - 대상 게시글/댓글의 작성자 UID 조회
   - 작성자 ≠ 본인이면 `/received-reactions/{작성자Uid}` 에 좋아요 기록 추가

## 4.2 게시글 작성 시

1. 사용자가 게시글 작성
2. `/posts/{postId}` 경로에 데이터 생성
3. Cloud Functions `onPostCreate` 트리거 발생
4. 함수에서 `/my-actions/{authorUid}` 에 게시글 작성 기록 추가

## 4.3 댓글 작성 시

1. 사용자가 댓글 작성
2. `/comments/{postId}/{commentId}` 경로에 데이터 생성
3. Cloud Functions `onCommentCreate` 트리거 발생
4. 함수에서 다음 작업 수행:
   - `/my-actions/{authorUid}` 에 댓글 작성 기록 추가
   - 대상 게시글의 작성자 UID 조회
   - 작성자 ≠ 본인이면 `/received-reactions/{게시글작성자Uid}` 에 댓글 기록 추가

## 4.4 팔로우 생성 시

1. 사용자가 다른 사용자 팔로우
2. `/user-following/{uid}/{followingUid}` 경로에 데이터 생성
3. Cloud Functions `onUserFollowingCreate` 트리거 발생
4. 함수에서 다음 작업 수행:
   - `/my-actions/{followerUid}` 에 팔로우 기록 추가
   - `/received-reactions/{followingUid}` 에 팔로우 기록 추가 (본인은 자동 제외)
   - `/user-followers/{followingUid}/{followerUid}` 역참조 생성

## 4.5 좋아요/팔로우 취소 시

1. 사용자가 좋아요/팔로우 취소
2. Cloud Functions `onLikeDelete` / `onFollowDelete` 트리거 발생
3. 함수에서 해당 기록을 `my-actions` 및 `received-reactions` 에서 삭제
   - 삭제 시 targetId와 fromUid로 해당 pushKey를 찾아서 삭제

# 5. Firebase Cloud Functions 핸들러 설계

## 5.1 핸들러 목록

| 핸들러 | 트리거 경로 | 이벤트 | 설명 |
| --- | --- | --- | --- |
| `handleLikeCreate` | `/likes/{uid}/{targetId}` | onCreate | 좋아요 생성 시 리액션 기록 |
| `handleLikeDelete` | `/likes/{uid}/{targetId}` | onDelete | 좋아요 취소 시 리액션 삭제 |
| `handlePostCreate` | `/posts/{postId}` | onCreate | 게시글 작성 시 리액션 기록 |
| `handleCommentCreate` | `/comments/{postId}/{commentId}` | onCreate | 댓글 작성 시 리액션 기록 |
| `handleFollowingCreate` | `/user-following/{uid}/{followingUid}` | onCreate | 팔로우 시 리액션 기록 |
| `handleFollowingDelete` | `/user-following/{uid}/{followingUid}` | onDelete | 언팔로우 시 리액션 삭제 |

## 5.2 공통 유틸리티 함수

### 5.2.1 `recordMyAction()`

```typescript
/**
 * 나의 발자취에 리액션 기록
 */
async function recordMyAction(params: {
  uid: string;
  type: 'like' | 'post' | 'comment' | 'follow';
  targetType: 'post' | 'comment' | 'user';
  targetId: string;
}): Promise<void>
```

### 5.2.2 `recordReceivedReaction()`

```typescript
/**
 * 받은 반응에 리액션 기록
 * 자기 자신의 리액션은 기록하지 않음
 */
async function recordReceivedReaction(params: {
  recipientUid: string;
  fromUid: string;
  type: 'like' | 'post' | 'comment' | 'follow';
  targetType: 'post' | 'comment' | 'user';
  targetId: string;
}): Promise<void>
```

### 5.2.3 `deleteMyAction()`

```typescript
/**
 * 나의 발자취에서 리액션 삭제
 */
async function deleteMyAction(params: {
  uid: string;
  type: 'like' | 'follow';
  targetId: string;
}): Promise<void>
```

### 5.2.4 `deleteReceivedReaction()`

```typescript
/**
 * 받은 반응에서 리액션 삭제
 */
async function deleteReceivedReaction(params: {
  recipientUid: string;
  fromUid: string;
  type: 'like' | 'follow';
  targetId: string;
}): Promise<void>
```

## 5.3 핸들러 구현 예시

### 5.3.1 `handleReactionLikeCreate`

```typescript
export const onReactionLikeCreate = onValueCreated(
  '/likes/{uid}/{targetId}',
  async (event) => {
    const uid = event.params.uid;
    const targetId = event.params.targetId;
    const targetType = event.data.val(); // 'post', 'comment', 'comment-{postId}'

    // 1. 나의 발자취에 기록
    await recordMyAction({
      uid,
      type: 'like',
      targetType: getTargetTypeFromValue(targetType),
      targetId
    });

    // 2. 대상의 작성자에게 받은 반응 기록
    const recipientUid = await getContentAuthorUid(targetType, targetId);
    if (recipientUid) {
      await recordReceivedReaction({
        recipientUid,
        fromUid: uid,
        type: 'like',
        targetType: getTargetTypeFromValue(targetType),
        targetId
      });
    }
  }
);
```

# 6. Database Security Rules

```json
{
  "rules": {
    "my-actions": {
      "$uid": {
        ".read": "auth != null && auth.uid == $uid",
        ".write": false,
        ".indexOn": ["createdAt"]
      }
    },
    "received-reactions": {
      "$uid": {
        ".read": "auth != null && auth.uid == $uid",
        ".write": false,
        ".indexOn": ["createdAt"]
      }
    }
  }
}
```

**규칙 설명:**
- 각 사용자는 자신의 `my-actions` 및 `received-reactions` 경로만 읽기 가능
- 클라이언트는 직접 쓰기 불가 (`.write: false`) - Cloud Functions에서만 쓰기 가능
- `createdAt` 필드로 인덱싱하여 정렬 쿼리 최적화

# 7. 클라이언트 구현 지침

## 7.1 페이지 구조

### 7.1.1 나의 발자취 페이지

- 경로: `/routes/my/activity/+page.svelte`
- 기능:
  - 내가 발생시킨 모든 리액션을 시간 역순으로 표시
  - DatabaseListView 사용 (`reverse=true`, `orderBy="createdAt"`, `newItemPosition="top"`)
  - 각 항목마다 리액션 타입 아이콘 + 대상 정보 표시

### 7.1.2 받은 반응 페이지

- 경로: `/routes/my/reactions/+page.svelte`
- 기능:
  - 다른 사용자로부터 받은 리액션을 시간 역순으로 표시
  - DatabaseListView 사용 (`reverse=true`, `orderBy="createdAt"`, `newItemPosition="top"`)
  - 각 항목마다 리액션 타입 아이콘 + 사용자 정보 + 대상 정보 표시

## 7.2 데이터 조회 최적화

### 7.2.1 사용자 정보 조회

```typescript
import { getUserFields } from '$lib/functions/user.functions';

// ✅ 필요한 필드만 조회 (RTDB 비용 절감)
const userData = await getUserFields(fromUid, ['displayName', 'photoUrl']);
```

### 7.2.2 대상 정보 조회

```typescript
// 게시글 정보 조회
if (targetType === 'post') {
  const postRef = ref(rtdb, `posts/${targetId}`);
  const snapshot = await get(postRef);
  const post = snapshot.val();
}

// 댓글 정보 조회 (댓글은 postId를 알아야 조회 가능)
if (targetType === 'comment') {
  // targetId가 commentId인 경우, postId를 어떻게 얻을 것인가?
  // 옵션 1: received-reactions에 postId도 함께 저장
  // 옵션 2: comments-index 경로 활용
}
```

**중요:** 댓글 리액션의 경우 `postId`가 필요하므로, `received-reactions` 및 `my-actions`에 `postId` 필드를 추가로 저장하는 것을 고려해야 합니다.

## 7.3 UI 컴포넌트

### 7.3.1 리액션 아이템 컴포넌트

```svelte
<!-- ReactionItem.svelte -->
<script lang="ts">
  interface Props {
    reaction: {
      fromUid: string;
      type: 'like' | 'post' | 'comment' | 'follow';
      targetType: 'post' | 'comment' | 'user';
      targetId: string;
      createdAt: number;
    };
    showFromUser?: boolean; // 받은 반응일 때만 true
  }

  let { reaction, showFromUser = false }: Props = $props();

  // 리액션 타입별 아이콘
  const reactionIcons = {
    like: '❤️',
    post: '📝',
    comment: '💬',
    follow: '👤'
  };
</script>

<div class="reaction-item">
  <div class="reaction-icon">{reactionIcons[reaction.type]}</div>

  {#if showFromUser}
    <!-- fromUid로 사용자 정보 표시 -->
    <UserAvatar uid={reaction.fromUid} />
  {/if}

  <!-- 리액션 내용 표시 -->
  <div class="reaction-content">
    <!-- targetType과 targetId로 대상 정보 표시 -->
  </div>

  <div class="reaction-time">
    {formatRelativeTime(reaction.createdAt)}
  </div>
</div>
```

### 7.3.2 리액션 타입별 텍스트

| type | targetType | 텍스트 (나의 발자취) | 텍스트 (받은 반응) |
| --- | --- | --- | --- |
| `like` | `post` | "게시글에 좋아요를 눌렀습니다" | "{사용자}님이 게시글에 좋아요를 눌렀습니다" |
| `like` | `comment` | "댓글에 좋아요를 눌렀습니다" | "{사용자}님이 댓글에 좋아요를 눌렀습니다" |
| `post` | `post` | "게시글을 작성했습니다" | - |
| `comment` | `post` | "댓글을 작성했습니다" | "{사용자}님이 댓글을 작성했습니다" |
| `follow` | `user` | "{사용자}를 팔로우했습니다" | "{사용자}님이 나를 팔로우했습니다" |

# 8. 데이터 모델 개선 사항

## 8.1 댓글 리액션 처리

댓글의 경우 `targetId`만으로는 댓글을 조회할 수 없습니다 (`/comments/{postId}/{commentId}` 구조이므로). 따라서 다음 필드를 추가합니다:

```
/my-actions/{uid}/{pushKey}
  fromUid: string
  type: string
  targetType: string
  targetId: string
  postId?: string          # targetType이 'comment'일 때만 존재
  createdAt: number

/received-reactions/{uid}/{pushKey}
  fromUid: string
  type: string
  targetType: string
  targetId: string
  postId?: string          # targetType이 'comment'일 때만 존재
  createdAt: number
```

## 8.2 최종 데이터 구조

```typescript
interface ReactionRecord {
  fromUid: string;                              // 리액션 발생자 UID
  type: 'like' | 'post' | 'comment' | 'follow'; // 리액션 유형
  targetType: 'post' | 'comment' | 'user';      // 대상 타입
  targetId: string;                             // 대상 ID
  postId?: string;                              // 댓글인 경우 게시글 ID
  createdAt: number;                            // 타임스탬프
}
```

# 9. UI/UX 요구사항

## 9.1 나의 발자취 페이지

- 제목: "나의 발자취" 또는 "My Activity"
- 리액션 타입 필터링 옵션:
  - 전체 / 좋아요 / 게시글 / 댓글 / 팔로우
- 무한 스크롤 지원 (DatabaseListView)
- 각 항목 클릭 시 해당 게시글/댓글/사용자 페이지로 이동
- 빈 상태: "아직 활동 내역이 없습니다"

## 9.2 받은 반응 페이지

- 제목: "받은 반응" 또는 "Reactions"
- 리액션 타입 필터링 옵션:
  - 전체 / 좋아요 / 댓글 / 팔로우
- 무한 스크롤 지원 (DatabaseListView)
- 각 항목에 사용자 아바타 + 이름 표시
- 각 항목 클릭 시 해당 게시글/댓글/사용자 페이지로 이동
- 빈 상태: "아직 받은 반응이 없습니다"

## 9.3 읽음 표시 (선택 사항)

향후 확장으로 다음 기능 추가 가능:
- `/received-reactions/{uid}/{pushKey}/read: boolean`
- 읽지 않은 반응 개수 배지 표시
- 페이지 방문 시 자동으로 읽음 처리

# 10. 테스트 체크리스트

- [x] Firebase Functions 배포 완료
- [x] Database Rules 업데이트 완료
- [ ] 좋아요 생성 시 `my-actions` 및 `received-reactions`에 기록되는지 확인
- [ ] 좋아요 취소 시 기록이 삭제되는지 확인
- [ ] 게시글 작성 시 `my-actions`에 기록되는지 확인
- [ ] 댓글 작성 시 `my-actions` 및 `received-reactions`에 기록되는지 확인
- [ ] 팔로우 시 `my-actions` 및 `received-reactions`에 기록되는지 확인
- [ ] 언팔로우 시 기록이 삭제되는지 확인
- [ ] 자기 자신의 리액션은 `received-reactions`에 기록되지 않는지 확인
- [ ] 클라이언트에서 DatabaseListView로 역순 정렬이 잘 되는지 확인
- [ ] 사용자 정보가 최소 필드만 조회되는지 확인
- [ ] 리액션 아이콘 및 텍스트가 올바르게 표시되는지 확인

# 11. 구현 우선순위

## Phase 1: 핵심 기능 ✅
1. ✅ RTDB 구조 설계
2. ✅ Database Rules 작성
3. ✅ Firebase Functions 유틸리티 함수 구현
4. ✅ Firebase Functions 핸들러 구현
5. ✅ Functions 배포 및 테스트

## Phase 2: 클라이언트 UI ✅
1. ✅ 나의 발자취 페이지 구현
2. ✅ 받은 반응 페이지 구현
3. ✅ 리액션 아이템 인라인 구현 (별도 컴포넌트 없이 각 페이지에 구현)
4. ✅ 사용자 아바타 컴포넌트 재사용
5. ✅ 메뉴 페이지에 두 항목 추가

## Phase 3: 최적화 및 확장
1. 필터링 기능 추가
2. 읽음 표시 기능 추가 (선택 사항)
3. 알림 시스템 연동 (선택 사항)

# 12. 참고 사항

- **RTDB 비용 최적화**: 사용자 정보는 `displayName`과 `photoUrl`만 조회
- **pushKey 활용**: pushKey는 자동으로 시간순 정렬을 보장하지만, DatabaseListView 호환성을 위해 `createdAt` 필드 사용
- **자기 자신 제외**: `received-reactions`에는 본인이 발생시킨 리액션은 기록하지 않음
- **삭제 로직**: 좋아요/팔로우 취소 시 해당 기록을 찾아서 삭제 (targetId와 fromUid로 검색)

# 13. 구현 내역 (2025-11-20)

## 13.1 구현된 파일 목록

### Frontend (클라이언트)

1. **나의 발자취 페이지**: [src/routes/my/activity/+page.svelte](src/routes/my/activity/+page.svelte:1-348)
   - DatabaseListView를 사용한 무한 스크롤 구현
   - 리액션 타입별 아이콘 표시 (Heart, FileText, MessageCircle, UserPlus)
   - 비동기 대상 정보 조회 (`getTargetInfo()`)
   - 리액션 클릭 시 해당 콘텐츠/프로필로 네비게이션
   - 다국어 지원 (ko, en, ja, zh)

2. **받은 반응 페이지**: [src/routes/my/reactions/+page.svelte](src/routes/my/reactions/+page.svelte:1-363)
   - DatabaseListView를 사용한 무한 스크롤 구현
   - 사용자 아바타 및 이름 표시
   - 리액션 타입별 설명 텍스트 표시
   - 비동기 대상 콘텐츠 프리뷰 (`getTargetContent()`)
   - 리액션 클릭 시 해당 콘텐츠/프로필로 네비게이션
   - 다국어 지원

3. **메뉴 페이지 업데이트**: [src/routes/menu/+page.svelte](src/routes/menu/+page.svelte:305-355)
   - "나의 발자취" 메뉴 항목 추가 (amber 색상, 시계 아이콘)
   - "받은 반응" 메뉴 항목 추가 (rose 색상, 벨 아이콘)

4. **다국어 메시지**: [messages/*.json](messages/)
   - 한국어 (ko.json): 22개 메시지 키 추가
   - 영어 (en.json): 22개 메시지 키 추가
   - 일본어 (ja.json): 22개 메시지 키 추가
   - 중국어 (zh.json): 22개 메시지 키 추가
   - 메시지 키 목록:
     - `myActivityTitle`, `myActivityDescription`, `myActivityEmpty`, `myActivityLoading`
     - `receivedReactionsTitle`, `receivedReactionsDescription`, `receivedReactionsEmpty`, `receivedReactionsLoading`
     - `reactionTypeLike`, `reactionTypePost`, `reactionTypeComment`, `reactionTypeFollow`
     - `reactionLikedPost`, `reactionLikedComment`, `reactionCommentedPost`, `reactionFollowedUser`
     - `reactionCreatedPost`, `reactionCreatedComment`, `reactionFilterAll`

### Backend (Firebase Functions)

1. **유틸리티 함수**: [firebase/functions/src/utils/reaction-history.utils.ts](firebase/functions/src/utils/reaction-history.utils.ts:1-342)
   - `recordMyAction()` - 나의 발자취 기록
   - `recordReceivedReaction()` - 받은 반응 기록 (자기 자신 제외)
   - `deleteMyAction()` - 나의 발자취 삭제
   - `deleteReceivedReaction()` - 받은 반응 삭제
   - `getTargetTypeFromValue()` - 타겟 타입 추출
   - `getContentAuthorUid()` - 콘텐츠 작성자 UID 조회

2. **핸들러 수정**:
   - [like.handler.ts](firebase/functions/src/handlers/like.handler.ts:52-83) - 좋아요 생성 시 리액션 기록
   - [like.handler.ts](firebase/functions/src/handlers/like.handler.ts:79-108) - 좋아요 삭제 시 리액션 삭제
   - [post.create.handler.ts](firebase/functions/src/handlers/post.create.handler.ts:110-130) - 게시글 작성 시 리액션 기록
   - [comment.create.handler.ts](firebase/functions/src/handlers/comment.create.handler.ts:338-384) - 댓글 작성 시 리액션 기록
   - [friend.follow.handler.ts](firebase/functions/src/handlers/friend.follow.handler.ts:63-99) - 팔로우 시 리액션 기록
   - [friend.follow.handler.ts](firebase/functions/src/handlers/friend.follow.handler.ts:108-136) - 언팔로우 시 리액션 삭제

3. **Database Rules**: [firebase/database.rules.json](firebase/database.rules.json:897-952)
   - `/my-actions/{uid}` - 본인만 읽기 가능, Cloud Functions만 쓰기
   - `/received-reactions/{uid}` - 본인만 읽기 가능, Cloud Functions만 쓰기
   - 두 경로 모두 `createdAt` 인덱싱

## 13.2 구현 로직

### 좋아요 리액션 기록
1. 사용자가 좋아요 클릭 → `/likes/{uid}/{targetId}` 생성
2. Cloud Functions `onLikeCreated` 트리거
3. `handleLikeCreate()` 실행:
   - `recordMyAction()` 호출하여 `/my-actions/{uid}` 에 기록
   - `getContentAuthorUid()` 호출하여 작성자 UID 조회
   - 작성자가 본인이 아니면 `recordReceivedReaction()` 호출하여 `/received-reactions/{작성자Uid}` 에 기록
4. 좋아요 취소 시 `handleLikeDelete()` 실행:
   - `deleteMyAction()` 호출하여 나의 발자취에서 삭제
   - `deleteReceivedReaction()` 호출하여 받은 반응에서 삭제

### 게시글/댓글 작성 리액션 기록
1. 게시글 작성 → `/posts/{postId}` 생성
2. Cloud Functions `onPostCreate` 트리거
3. `handlePostCreate()` 실행:
   - `recordMyAction()` 호출하여 `/my-actions/{authorUid}` 에 기록
4. 댓글 작성 시:
   - `recordMyAction()` 호출하여 나의 발자취에 기록
   - `getPostAuthorUid()` 호출하여 게시글 작성자 조회
   - 게시글 작성자가 본인이 아니면 `recordReceivedReaction()` 호출

### 팔로우 리액션 기록
1. 팔로우 → `/user-following/{uid}/{followingUid}` 생성
2. Cloud Functions `onUserFollowingCreate` 트리거
3. `handleFollowingCreate()` 실행:
   - `recordMyAction()` 호출하여 나의 발자취에 기록
   - `recordReceivedReaction()` 호출하여 팔로우 대상자의 받은 반응에 기록
   - `/user-followers/{followingUid}/{followerUid}` 역참조 생성
4. 언팔로우 시 `handleFollowingDelete()` 실행:
   - `deleteMyAction()` 호출하여 나의 발자취에서 삭제
   - `deleteReceivedReaction()` 호출하여 받은 반응에서 삭제

## 13.3 주요 설계 결정사항

1. **자기 자신 제외**: `recordReceivedReaction()`에서 `recipientUid === fromUid` 체크로 자기 자신의 리액션은 받은 반응에 기록하지 않음
2. **에러 처리**: 리액션 히스토리 기록 실패는 비치명적이므로 try-catch로 감싸고 에러를 throw하지 않음
3. **postId 포함**: 댓글 리액션의 경우 `postId` 필드를 추가하여 `/comments/{postId}/{commentId}` 조회 가능하도록 함
4. **삭제 로직**: orderByChild와 equalTo 쿼리로 해당 기록을 찾아 삭제
5. **타입 안정성**: TypeScript 인터페이스로 ReactionRecord, ReactionType, TargetType 정의

## 13.4 배포 결과
- 2025-11-20: Firebase Functions 41개 함수 배포 완료
- ESLint 검사 통과
- TypeScript 빌드 성공
- 2025-11-20: 클라이언트 페이지 구현 완료
- svelte-check 타입 체크 통과 (새 파일 에러 없음)
- 2025-11-20: Firebase Database Rules 배포 완료 (`my-actions`, `received-reactions` 읽기 권한 활성화)

## 13.5 Frontend 구현 상세

### 나의 발자취 페이지 구현 특징

1. **DatabaseListView 설정**:
   ```svelte
   <DatabaseListView
     path={`my-actions/${authStore.user.uid}`}
     pageSize={20}
     orderBy="createdAt"
     reverse={true}
     newItemPosition="top"
   >
   ```

2. **리액션 타입별 아이콘 매핑**:
   - `like` → Heart (red)
   - `post` → FileText (blue)
   - `comment` → MessageCircle (green)
   - `follow` → UserPlus (purple)

3. **비동기 대상 정보 조회**:
   - 팔로우: `getUserFields()`로 사용자 이름 조회
   - 게시글: `/posts/{targetId}` 조회하여 텍스트 일부 표시
   - 댓글: `/comments/{postId}/{targetId}` 조회하여 텍스트 일부 표시

4. **네비게이션 로직**:
   - 팔로우 → `/user/profile?uid={targetId}`
   - 게시글 → `/post/{targetId}`
   - 댓글 → `/post/{postId}#comment-{targetId}`

### 받은 반응 페이지 구현 특징

1. **사용자 정보 표시**:
   ```svelte
   {#await getUserFields(reaction.fromUid, ['displayName', 'photoUrl'])}
     <div class="avatar-placeholder"></div>
   {:then userFields}
     <Avatar photoUrl={userFields.photoUrl} displayName={userFields.displayName} size="md" />
   {/await}
   ```

2. **리액션 설명 텍스트**:
   - 게시글 좋아요: "게시글을 좋아합니다"
   - 댓글 좋아요: "댓글을 좋아합니다"
   - 댓글 작성: "게시글에 댓글을 달았습니다"
   - 팔로우: "님을 팔로우했습니다"

3. **대상 콘텐츠 프리뷰**:
   - 게시글/댓글 좋아요: 원본 텍스트 최대 100자 표시
   - 삭제된 콘텐츠: "(삭제된 게시글)" / "(삭제된 댓글)" 표시
   - 팔로우: 대상 콘텐츠 없음

4. **RTDB 비용 최적화**:
   - `getUserFields()` 함수로 필요한 필드만 조회
   - 전체 노드 읽기 대신 `displayName`, `photoUrl` 만 개별 조회

### 공통 구현 패턴

1. **로그인 체크**:
   ```svelte
   {#if !authStore.user}
     <!-- 로그인 필요 메시지 -->
   {:else}
     <!-- 리액션 목록 표시 -->
   {/if}
   ```

2. **로딩/빈 상태/에러 처리**:
   - DatabaseListView의 snippet 시스템 활용
   - `loading()`, `empty()`, `error()` snippet 제공

3. **날짜 포맷팅**:
   - date-fns의 `formatDistanceToNow()` 사용
   - 로케일별 언어 지원 (ko, en, ja, zh)

4. **TailwindCSS 스타일링**:
   - Inline class와 `@apply` 혼용
   - Layout은 inline class, 스타일은 `@apply` 사용
