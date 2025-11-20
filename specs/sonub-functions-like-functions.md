---
name: sonub-functions-like
title: Like Functions 명세
version: 1.0.0
description: 좋아요 토글, 좋아요 사용자 목록 조회 관련 함수
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
  - sonub-firebase-functions-index.md
tags:
  - like
  - functions
  - RTDB
  - reactions
---

# Like Functions 명세

본 문서는 `src/lib/functions/like.functions.ts` 파일에 정의된 좋아요 관련 함수의 역할과 사용 규칙을 설명합니다. 전역 규칙은 반드시 [sonub-functions-overview.md](./sonub-functions-overview.md)를 먼저 읽은 후 적용합니다.

---

## 1. 파일 구조

**소스 코드 위치**: [like.functions.ts.md](./repository/src/lib/functions/like.functions.ts.md)

```
src/
└── lib/
    └── functions/
        └── like.functions.ts   # 좋아요 관련 클라이언트 유틸리티
```

### 좋아요 시스템 아키텍처

**클라이언트 역할**:
1. `/likes/{uid}/{targetId}` 경로에 문자열 값 저장/삭제
2. 저장 값: `"message"`, `"comment"`, `"post"`, `"chat-message-{roomId}"`, `"comment-{postId}"`

**Cloud Functions 역할** (자동):
1. `/likes/{uid}/{targetId}` 변경 감지
2. `likeCount` 증감 처리
3. `/likes-by/{targetId}` 역방향 인덱스 관리

---

## 2. 제공 함수 목록

### 2.1 타입 정의

#### 2.1.1 `LikeTargetType`

**소스 코드 위치**: [like.functions.ts.md](./repository/src/lib/functions/like.functions.ts.md)

```typescript
/**
 * 좋아요 대상 타입
 * - message: 채팅 메시지
 * - comment: 댓글 (사용 시 postId를 전달하여 "comment-{postId}" 형식으로 저장)
 * - post: 게시글
 */
export type LikeTargetType = 'message' | 'comment' | 'post' | `comment-${string}`;
```

---

#### 2.1.2 `ToggleLikeOptions`

**소스 코드 위치**: [like.functions.ts.md](./repository/src/lib/functions/like.functions.ts.md)

```typescript
/**
 * 좋아요 토글 옵션
 */
interface ToggleLikeOptions {
  uid?: string | null;
  targetId: string;
  targetType: LikeTargetType;
  /** 채팅 메시지의 경우 roomId를 전달하여 "chat-message-{roomId}" 형식으로 저장 */
  roomId?: string;
  /** 댓글의 경우 postId를 전달하여 "comment-{postId}" 형식으로 저장 (필수) */
  postId?: string;
}
```

---

#### 2.1.3 `ToggleLikeResult`

**소스 코드 위치**: [like.functions.ts.md](./repository/src/lib/functions/like.functions.ts.md)

```typescript
/**
 * 좋아요 토글 결과
 */
export interface ToggleLikeResult {
  success: boolean;
  liked?: boolean;   // true: 좋아요 추가됨, false: 좋아요 취소됨
  error?: string;
}
```

---

### 2.2 `toggleLikeTarget()`

**소스 코드 위치**: [like.functions.ts.md](./repository/src/lib/functions/like.functions.ts.md)

```typescript
/**
 * 현재 사용자의 좋아요 상태를 토글합니다.
 *
 * - 값이 없으면 targetType 문자열을 저장 (좋아요 추가)
 * - 값이 있으면 노드를 삭제 (좋아요 취소)
 * - 채팅 메시지의 경우 roomId를 전달하면 "chat-message-{roomId}" 형식으로 저장
 * - 댓글의 경우 postId를 전달하면 "comment-{postId}" 형식으로 저장
 *
 * @param options.uid - 사용자 UID
 * @param options.targetId - 대상 ID (메시지 ID, 댓글 ID, 또는 게시글 ID)
 * @param options.targetType - 대상 타입 ('message', 'comment', 또는 'post')
 * @param options.roomId - (선택) 채팅 메시지의 경우 roomId
 * @param options.postId - (선택) 댓글의 경우 postId (필수)
 * @returns 좋아요 토글 결과
 */
export async function toggleLikeTarget(
  options: ToggleLikeOptions
): Promise<ToggleLikeResult>
```

#### RTDB 경로

```
/likes/{uid}/{targetId}
```

#### 저장 값 형식

| targetType | roomId | postId | 저장 값 |
|-----------|--------|--------|--------|
| `post` | - | - | `"post"` |
| `message` | ✅ | - | `"chat-message-{roomId}"` |
| `message` | ❌ | - | `"message"` |
| `comment` | - | ✅ | `"comment-{postId}"` |

**roomId/postId 전달 이유**:
- Cloud Functions가 `likeCount` 업데이트 시 어느 채팅방/게시글의 메시지/댓글인지 알아야 함
- 예: `"chat-message-room123"` → Cloud Functions가 `/chat-messages/room123/{messageId}/likeCount` 업데이트

#### 사용 예시

**게시글 좋아요**:
```typescript
const result = await toggleLikeTarget({
  uid: authStore.user!.uid,
  targetId: 'post123',
  targetType: 'post'
});

if (result.success) {
  console.log(result.liked ? '좋아요 추가됨' : '좋아요 취소됨');
}
```

**채팅 메시지 좋아요** (roomId 포함):
```typescript
const result = await toggleLikeTarget({
  uid: authStore.user!.uid,
  targetId: 'message456',
  targetType: 'message',
  roomId: 'room789'  // ⚠️ 필수: Cloud Functions가 어느 채팅방인지 알아야 함
});
```

**댓글 좋아요** (postId 포함):
```typescript
const result = await toggleLikeTarget({
  uid: authStore.user!.uid,
  targetId: 'comment789',
  targetType: 'comment',
  postId: 'post123'  // ⚠️ 필수: Cloud Functions가 어느 게시글인지 알아야 함
});
```

#### 에러 처리

```typescript
const result = await toggleLikeTarget({
  uid: authStore.user?.uid,
  targetId: 'post123',
  targetType: 'post'
});

if (!result.success) {
  if (result.error === '로그인이 필요합니다.') {
    // 로그인 페이지로 이동
  } else {
    alert(result.error);
  }
}
```

#### Cloud Functions 연동 플로우

1. **클라이언트**: `/likes/{uid}/{targetId}`에 값 저장
2. **Cloud Functions**: 변경 감지 (onWrite 트리거)
3. **Cloud Functions**: 값 파싱하여 targetType, roomId, postId 추출
4. **Cloud Functions**:
   - `likeCount` 증감 (`/posts/{postId}/likeCount` 또는 `/chat-messages/{roomId}/{messageId}/likeCount` 등)
   - `/likes-by/{targetId}/{uid}` 역방향 인덱스 업데이트

---

### 2.3 `fetchLikedByUsers()`

**소스 코드 위치**: [like.functions.ts.md](./repository/src/lib/functions/like.functions.ts.md)

```typescript
/**
 * 특정 대상(메시지, 댓글, 게시글)에 좋아요한 사용자 UID 목록을 로드합니다.
 *
 * - 통합 경로: `/likes-by/{targetId}` 경로에서 로드
 * - 메시지, 댓글, 게시글 모두 동일한 구조 사용
 * - Cloud Functions가 자동으로 `/likes-by` 경로를 관리
 *
 * @param targetId - 대상 ID (메시지 ID, 댓글 ID, 또는 게시글 ID)
 * @param targetType - 대상 타입 ('message', 'comment', 또는 'post')
 * @returns 좋아요한 사용자 UID 배열
 */
export async function fetchLikedByUsers(
  targetId: string,
  targetType: LikeTargetType
): Promise<string[]>
```

#### RTDB 경로 (Cloud Functions가 관리)

```
/likes-by/{targetId}/{uid}
```

**구조**:
```json
{
  "likes-by": {
    "post123": {
      "uid001": true,
      "uid002": true,
      "uid003": true
    },
    "comment456": {
      "uid002": true,
      "uid004": true
    }
  }
}
```

#### 사용 예시

**게시글 좋아요 사용자 목록**:
```typescript
const uids = await fetchLikedByUsers('post123', 'post');
console.log(`좋아요 사용자 수: ${uids.length}`);
// ["uid001", "uid002", "uid003"]
```

**좋아요 사용자 아바타 스택 표시**:
```typescript
const uids = await fetchLikedByUsers(postId, 'post');

// 최대 3명까지 아바타 표시
const displayUids = uids.slice(0, 3);

// 각 UID의 프로필 사진 가져오기
const avatars = await Promise.all(
  displayUids.map((uid) => getUserField(uid, 'photoUrl'))
);
```

---

## 3. 적용 지침

### 3.1 좋아요 버튼 구현

**PostItem.svelte - 좋아요 버튼**:

```typescript
let isLiked = $state(false);
let likeCount = $derived(message.likeCount || 0);

$effect(() => {
  void checkLikeStatus();
});

async function checkLikeStatus() {
  if (!authStore.user?.uid) return;

  const snapshot = await get(
    ref(rtdb, `likes/${authStore.user.uid}/${postId}`)
  );
  isLiked = snapshot.exists();
}

async function handleLikeClick() {
  const result = await toggleLikeTarget({
    uid: authStore.user?.uid,
    targetId: postId,
    targetType: 'post'
  });

  if (result.success) {
    isLiked = result.liked!;
  }
}
```

### 3.2 좋아요 사용자 목록 표시

**좋아요 아바타 스택**:

```svelte
<script lang="ts">
  import { fetchLikedByUsers } from '$lib/functions/like.functions';
  import { getUserField } from '$lib/functions/user.functions';

  let likedByUids = $state<string[]>([]);
  let displayAvatars = $state<string[]>([]);

  $effect(() => {
    if (likeCount > 0) {
      void loadLikedUsers();
    }
  });

  async function loadLikedUsers() {
    likedByUids = await fetchLikedByUsers(postId, 'post');

    // 최대 3명까지 표시
    const uids = likedByUids.slice(0, 3);

    // 프로필 사진 가져오기
    const photoUrls = await Promise.all(
      uids.map((uid) => getUserField(uid, 'photoUrl'))
    );

    displayAvatars = photoUrls.filter((url) => url !== null) as string[];
  }
</script>

<div class="avatar-stack">
  {#each displayAvatars as photoUrl}
    <img src={photoUrl} alt="Avatar" class="avatar" />
  {/each}

  {#if likedByUids.length > 3}
    <span class="more">+{likedByUids.length - 3}</span>
  {/if}
</div>
```

### 3.3 채팅 메시지 좋아요 (roomId 필수)

**ChatRoomPage - 메시지 좋아요**:

```typescript
async function handleMessageLike(messageId: string) {
  const result = await toggleLikeTarget({
    uid: authStore.user?.uid,
    targetId: messageId,
    targetType: 'message',
    roomId: currentRoomId  // ⚠️ 필수: Cloud Functions가 어느 채팅방인지 알아야 함
  });

  if (!result.success) {
    alert(result.error);
  }
}
```

### 3.4 댓글 좋아요 (postId 필수)

**CommentItem - 댓글 좋아요**:

```typescript
async function handleCommentLike(commentId: string) {
  const result = await toggleLikeTarget({
    uid: authStore.user?.uid,
    targetId: commentId,
    targetType: 'comment',
    postId: currentPostId  // ⚠️ 필수: Cloud Functions가 어느 게시글인지 알아야 함
  });

  if (!result.success) {
    alert(result.error);
  }
}
```

---

## 4. Cloud Functions 연동

### 4.1 Cloud Functions 트리거

**firebase/functions/src/index.ts**:

```typescript
/**
 * /likes/{uid}/{targetId} 변경 시 likeCount 업데이트
 */
export const onLikeChange = database
  .ref('/likes/{uid}/{targetId}')
  .onWrite(async (change, context) => {
    const { uid, targetId } = context.params;
    const valueBefore = change.before.val();
    const valueAfter = change.after.val();

    // 좋아요 추가
    if (!valueBefore && valueAfter) {
      await incrementLikeCount(targetId, valueAfter);
      await updateLikesBy(targetId, uid, true);
    }

    // 좋아요 취소
    if (valueBefore && !valueAfter) {
      await decrementLikeCount(targetId, valueBefore);
      await updateLikesBy(targetId, uid, false);
    }
  });
```

### 4.2 likeCount 업데이트 로직

```typescript
async function incrementLikeCount(targetId: string, targetType: string) {
  // targetType 파싱: "chat-message-room123" → { type: "chat-message", roomId: "room123" }
  const parsed = parseTargetType(targetType);

  if (parsed.type === 'post') {
    // /posts/{targetId}/likeCount 증가
    await admin.database().ref(`posts/${targetId}/likeCount`).transaction(
      (count) => (count || 0) + 1
    );
  } else if (parsed.type === 'chat-message') {
    // /chat-messages/{roomId}/{targetId}/likeCount 증가
    await admin.database()
      .ref(`chat-messages/${parsed.roomId}/${targetId}/likeCount`)
      .transaction((count) => (count || 0) + 1);
  } else if (parsed.type === 'comment') {
    // /comments/{postId}/{targetId}/likeCount 증가
    await admin.database()
      .ref(`comments/${parsed.postId}/${targetId}/likeCount`)
      .transaction((count) => (count || 0) + 1);
  }
}
```

---

## 5. 사용 시나리오

### 5.1 게시글 좋아요 (가장 기본)

```typescript
// 좋아요 버튼 클릭
async function handleLikeClick() {
  const result = await toggleLikeTarget({
    uid: authStore.user?.uid,
    targetId: postId,
    targetType: 'post'
  });

  if (result.success) {
    console.log(result.liked ? '좋아요!' : '좋아요 취소');
  }
}
```

### 5.2 채팅 메시지 좋아요 (roomId 포함)

```typescript
async function handleMessageLike(messageId: string, roomId: string) {
  const result = await toggleLikeTarget({
    uid: authStore.user?.uid,
    targetId: messageId,
    targetType: 'message',
    roomId  // ⚠️ 필수
  });
}
```

### 5.3 댓글 좋아요 (postId 포함)

```typescript
async function handleCommentLike(commentId: string, postId: string) {
  const result = await toggleLikeTarget({
    uid: authStore.user?.uid,
    targetId: commentId,
    targetType: 'comment',
    postId  // ⚠️ 필수
  });
}
```

### 5.4 좋아요 사용자 아바타 스택

```typescript
// 좋아요한 사용자 목록 가져오기
const uids = await fetchLikedByUsers(postId, 'post');

// 최대 3명까지 프로필 사진 표시
const displayUids = uids.slice(0, 3);
const photoUrls = await Promise.all(
  displayUids.map((uid) => getUserField(uid, 'photoUrl'))
);

// UI에 아바타 스택 표시
// [avatar1] [avatar2] [avatar3] +5
```

---

## 6. 테스트 시나리오

### 6.1 기본 좋아요 테스트

- [ ] 게시글 좋아요 추가 시 `likeCount`가 증가하는지 확인
- [ ] 게시글 좋아요 취소 시 `likeCount`가 감소하는지 확인
- [ ] `/likes/{uid}/{targetId}` 경로에 값이 정상 저장되는지 확인
- [ ] `/likes-by/{targetId}` 역방향 인덱스가 자동 생성되는지 확인

### 6.2 채팅 메시지 좋아요 테스트

- [ ] roomId 포함 시 `"chat-message-{roomId}"` 형식으로 저장되는지 확인
- [ ] Cloud Functions가 올바른 경로에 `likeCount`를 업데이트하는지 확인

### 6.3 댓글 좋아요 테스트

- [ ] postId 포함 시 `"comment-{postId}"` 형식으로 저장되는지 확인
- [ ] Cloud Functions가 올바른 경로에 `likeCount`를 업데이트하는지 확인

### 6.4 좋아요 사용자 목록 테스트

- [ ] `fetchLikedByUsers()` 호출 시 올바른 UID 배열을 반환하는지 확인
- [ ] 좋아요 추가 후 목록에 UID가 추가되는지 확인
- [ ] 좋아요 취소 후 목록에서 UID가 제거되는지 확인

---

## 7. 관련 파일

### 7.1 연관 컴포넌트

- `src/lib/components/post/PostItem.svelte` - 게시글 좋아요 버튼
- `src/lib/components/comment/CommentItem.svelte` - 댓글 좋아요 버튼
- `src/routes/chat/room/+page.svelte` - 채팅 메시지 좋아요

### 7.2 관련 스펙 문서

- `specs/sonub-firebase-database-structure.md` - RTDB 구조 (`/likes`, `/likes-by`)
- `specs/sonub-firebase-functions-index.md` - Cloud Functions (좋아요 트리거)
- `specs/sonub-reactions-stats.md` - 리액션 통계 시스템

---

## 8. 작업 이력 (SED Log)

| 날짜 | 작업자 | 변경 내용 |
| ---- | ------ | -------- |
| 2025-01-20 | Claude Code | Like Functions 명세 최초 작성 |
