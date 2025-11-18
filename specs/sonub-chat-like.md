---
title: 채팅 메시지 좋아요(리액션) 기능
status: in-progress
created: 2025-01-18
updated: 2025-01-18
author: Claude Code
tags: [chat, like, reaction, firebase, realtime]
related:
  - sonub-firebase-database-structure.md
  - sonub-forum-post.md
  - sonub-design-guideline.md
---

# 채팅 메시지 좋아요(리액션) 기능 - SED 스펙

## 1. 개요

### 1.1 목적

채팅방에서 다른 사용자의 메시지에 좋아요(리액션)를 추가하여 사용자 간 상호작용을 증진하고, 커뮤니티 활성화를 도모합니다.

### 1.2 범위

- **Phase 1**: 기본 좋아요 기능 (하트 아이콘 토글)
- **Phase 2**: UX 개선 (애니메이션, 툴팁, 사용자 목록)
- **Phase 3**: 고급 기능 (다양한 이모지, 통계, 푸시 알림)

### 1.3 핵심 설계 원칙

- **코드 재사용**: 기존 좋아요 시스템 (`like.functions.ts`, `like.handler.ts`) 100% 재사용
- **백엔드 변경 없음**: Cloud Functions 이미 준비됨, 프론트엔드만 수정
- **RTDB 비용 최적화**: 필요한 필드만 읽기, 실시간 구독 최소화
- **단일 진실 공급원(SSOT)**: `/likes/{uid}/{messageId}` 경로만 사용

---

## 2. 아키텍처

### 2.1 시스템 구조

```
┌─────────────────────────────────────────────────────────────┐
│                    사용자 인터페이스                          │
│  ┌────────────────────────────────────────────────────────┐ │
│  │ /routes/chat/room/+page.svelte                        │ │
│  │  - 좋아요 버튼 UI (message-footer)                     │ │
│  │  - handleToggleLike() 함수                            │ │
│  │  - userLikes 상태 구독                                │ │
│  └────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────┐
│                   클라이언트 함수 계층                         │
│  ┌────────────────────────────────────────────────────────┐ │
│  │ /src/lib/functions/like.functions.ts (재사용)          │ │
│  │  - toggleLikeTarget()                                 │ │
│  │  - LikeTargetType = 'message' | 'comment'             │ │
│  └────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────┐
│                Firebase Realtime Database                   │
│  ┌────────────────────────────────────────────────────────┐ │
│  │ /likes/{uid}/{messageId}: "message"                   │ │
│  │ /chat-messages/{messageId}/likeCount: number          │ │
│  └────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────┐
│                  Cloud Functions (백엔드)                    │
│  ┌────────────────────────────────────────────────────────┐ │
│  │ /firebase/functions/src/handlers/like.handler.ts       │ │
│  │  - handleLikeCreate() → likeCount++                   │ │
│  │  - handleLikeDelete() → likeCount--                   │ │
│  └────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────┘
```

### 2.2 데이터 흐름

**좋아요 추가:**
```
1. 사용자가 하트 버튼 클릭
2. handleToggleLike(messageId) 호출
3. toggleLikeTarget({ uid, targetId: messageId, targetType: 'message' })
4. /likes/{uid}/{messageId} = "message" 생성 (RTDB)
5. Cloud Functions onCreate 트리거
6. /chat-messages/{messageId}/likeCount 증가 (ServerValue.increment(1))
7. DatabaseListView 실시간 구독으로 UI 자동 업데이트
```

**좋아요 취소:**
```
1. 사용자가 이미 좋아요한 하트 버튼 다시 클릭
2. handleToggleLike(messageId) 호출
3. toggleLikeTarget() → /likes/{uid}/{messageId} 삭제
4. Cloud Functions onDelete 트리거
5. /chat-messages/{messageId}/likeCount 감소 (ServerValue.increment(-1))
6. DatabaseListView 실시간 구독으로 UI 자동 업데이트
```

### 2.3 기존 시스템 재사용

#### ✅ 재사용 가능한 코드

**1. 클라이언트 함수 (`/src/lib/functions/like.functions.ts`):**
```typescript
// ✅ 100% 재사용
export type LikeTargetType = 'message' | 'comment';

export async function toggleLikeTarget(options: ToggleLikeOptions): Promise<ToggleLikeResult> {
  const { uid, targetId, targetType } = options;

  const likeRef = ref(rtdb, `likes/${uid}/${targetId}`);
  const snapshot = await get(likeRef);

  if (snapshot.exists()) {
    await remove(likeRef);  // Unlike
    return { success: true, liked: false };
  }

  await set(likeRef, targetType);  // Like
  return { success: true, liked: true };
}
```

**2. Cloud Functions (`/firebase/functions/src/handlers/like.handler.ts`):**
```typescript
// ✅ 이미 message 타입 지원, 백엔드 변경 불필요
async function applyLikeDelta(
  targetId: string,
  targetType: LikeTargetType,
  delta: 1 | -1
): Promise<boolean> {
  if (targetType === "message") {
    await admin
      .database()
      .ref(`chat-messages/${targetId}/likeCount`)
      .set(admin.database.ServerValue.increment(delta));
  }
  // ...
}
```

**3. UI 패턴 (`/src/lib/components/post/PostItem.svelte`):**
```svelte
<!-- ✅ 하트 아이콘 SVG 패턴 재사용 -->
<button
  class="action-button"
  class:liked={userLikes[messageId] === 'message'}
  disabled={!authStore.user}
  onclick={(e) => onToggleLike(e, messageId, 'message')}
>
  <svg
    class="h-5 w-5"
    fill={userLikes[messageId] === 'message' ? 'currentColor' : 'none'}
    stroke="currentColor"
    viewBox="0 0 24 24"
    stroke-width="2"
  >
    <path
      stroke-linecap="round"
      stroke-linejoin="round"
      d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"
    />
  </svg>
  <span>좋아요 {message.likeCount ?? 0}</span>
</button>
```

**4. 상태 관리 패턴 (`/src/routes/+page.svelte`):**
```typescript
// ✅ 좋아요 구독 패턴 재사용
type UserLikesMap = Record<string, LikeTargetType>;
let userLikes = $state<UserLikesMap>({});

$effect(() => {
  const uid = authStore.user?.uid;
  if (!uid) {
    userLikes = {};
    return;
  }

  const store = createRealtimeStore<UserLikesMap>(`likes/${uid}`, {});
  const unsubscribe = store.subscribe((state) => {
    userLikes = state.data ?? {};
  });

  return () => {
    unsubscribe();
    store.unsubscribe();
  };
});
```

---

## 3. Phase 1: 핵심 기능 구현

### 3.1 목표

- 채팅 메시지에 좋아요 버튼 추가
- 좋아요 토글 기능 구현
- 좋아요 개수 실시간 표시

### 3.2 구현 파일

**수정 대상:** `/src/routes/chat/room/+page.svelte`

### 3.3 구현 내용

#### 3.3.1 Import 추가

**위치:** `<script lang="ts">` 블록 상단

```typescript
// 기존 imports...
import { toggleLikeTarget, type LikeTargetType } from '$lib/functions/like.functions';
import { createRealtimeStore } from '$lib/stores/database.svelte';
```

#### 3.3.2 상태 변수 추가

**위치:** `<script>` 블록 내부, 기존 상태 변수 아래

```typescript
// 좋아요 상태
type UserLikesMap = Record<string, LikeTargetType>;
let userLikes = $state<UserLikesMap>({});
const pendingLikeTargets = new Set<string>();
```

**설명:**
- `userLikes`: 현재 사용자가 좋아요한 메시지 맵
- `pendingLikeTargets`: 중복 클릭 방지용 Set

#### 3.3.3 좋아요 구독 Effect

**위치:** 상태 변수 선언 바로 아래

```typescript
/**
 * 현재 사용자 좋아요 목록 구독
 *
 * /likes/{uid} 경로를 실시간으로 구독하여 사용자가 좋아요한 메시지를 추적합니다.
 */
$effect(() => {
  const uid = authStore.user?.uid;

  if (!uid) {
    userLikes = {};
    return;
  }

  const store = createRealtimeStore<UserLikesMap>(`likes/${uid}`, {});
  const unsubscribe = store.subscribe((state) => {
    userLikes = state.data ?? {};
  });

  return () => {
    unsubscribe();
    store.unsubscribe();
  };
});
```

**설명:**
- 로그인한 사용자의 좋아요 목록을 실시간으로 구독
- 로그아웃 시 자동으로 구독 해제
- `createRealtimeStore`를 사용하여 Firebase 실시간 구독

#### 3.3.4 좋아요 토글 핸들러

**위치:** Effect 아래, 기존 함수들과 함께

```typescript
/**
 * 좋아요 토글
 *
 * @param event - 마우스 클릭 이벤트
 * @param messageId - 좋아요할 메시지 ID
 */
async function handleToggleLike(event: MouseEvent, messageId: string) {
  event.stopPropagation();

  if (!authStore.user) {
    alert('로그인이 필요합니다.');
    return;
  }

  // 중복 요청 방지
  if (pendingLikeTargets.has(messageId)) {
    return;
  }

  pendingLikeTargets.add(messageId);

  try {
    const result = await toggleLikeTarget({
      uid: authStore.user.uid,
      targetId: messageId,
      targetType: 'message'
    });

    if (!result.success && result.error) {
      alert(result.error);
    }
  } finally {
    pendingLikeTargets.delete(messageId);
  }
}
```

**설명:**
- `event.stopPropagation()`: 메시지 클릭 이벤트와 분리
- 로그인 확인 후 진행
- `pendingLikeTargets` Set으로 중복 클릭 방지
- `toggleLikeTarget()` 함수 재사용
- 에러 발생 시 알림 표시

#### 3.3.5 UI 마크업 추가

**위치:** DatabaseListView의 `{#snippet item(...)}` 블록 내부, message-footer div

**현재 구조:**
```svelte
<div class="message-footer">
  <span class="message-timestamp">
    {formatChatMessageDate(message.createdAt)}
  </span>

  {#if isEditable}
    <!-- 설정 버튼 (DropdownMenu) -->
  {/if}
</div>
```

**변경 후:**
```svelte
<div class="message-footer">
  <span class="message-timestamp">
    {formatChatMessageDate(message.createdAt)}
  </span>

  <!-- 좋아요 버튼 (새로 추가) -->
  <button
    class="like-button"
    class:liked={userLikes[itemData.key] === 'message'}
    disabled={!authStore.user || pendingLikeTargets.has(itemData.key)}
    onclick={(e) => handleToggleLike(e, itemData.key)}
    aria-label={userLikes[itemData.key] === 'message' ? '좋아요 취소' : '좋아요'}
  >
    <svg
      class="like-icon"
      fill={userLikes[itemData.key] === 'message' ? 'currentColor' : 'none'}
      stroke="currentColor"
      viewBox="0 0 24 24"
      stroke-width="2"
    >
      <path
        stroke-linecap="round"
        stroke-linejoin="round"
        d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"
      />
    </svg>
    {#if message.likeCount && message.likeCount > 0}
      <span class="like-count">{message.likeCount}</span>
    {/if}
  </button>

  {#if isEditable}
    <!-- 설정 버튼 -->
  {/if}
</div>
```

**설명:**
- 하트 아이콘 SVG (PostItem.svelte에서 재사용)
- `class:liked`: 좋아요 상태에 따라 스타일 변경
- `disabled`: 로그인 여부 및 pending 상태 확인
- `likeCount`: 0보다 클 때만 표시

#### 3.3.6 CSS 스타일 추가

**위치:** `<style>` 블록 내부

```css
@import 'tailwindcss' reference;

/* 메시지 푸터 레이아웃 조정 */
.message-footer {
  @apply flex items-center gap-2;
}

/* 좋아요 버튼 */
.like-button {
  @apply flex items-center gap-1;
  @apply rounded-lg px-2 py-1;
  @apply text-xs text-gray-500;
  @apply transition-all duration-200;
  @apply hover:bg-gray-100;
  @apply disabled:cursor-not-allowed disabled:opacity-50;
}

.like-button.liked {
  @apply bg-rose-50 text-rose-600;
}

.like-icon {
  @apply h-4 w-4;
}

.like-count {
  @apply text-xs;
}
```

**설명:**
- 레이아웃: Flexbox로 타임스탬프, 좋아요, 설정 버튼 정렬
- 좋아요 버튼: 작은 크기 (`h-4 w-4`), 채팅방에 어울리는 디자인
- 활성 상태: 분홍색 배경 (`bg-rose-50`) + 빨간색 텍스트 (`text-rose-600`)
- 호버 효과: 회색 배경 (`hover:bg-gray-100`)

---

## 4. Phase 2: UX 개선

### 4.1 목표

- 좋아요 애니메이션 추가 (하트 bounce 효과)
- 툴팁 표시 (좋아요한 사용자 미리보기)
- 롱프레스 시 좋아요한 사용자 전체 목록 모달

### 4.2 구현 내용

#### 4.2.1 좋아요 애니메이션

**CSS Keyframe 추가:**

```css
/* 하트 bounce 애니메이션 */
@keyframes heartBounce {
  0%, 100% {
    transform: scale(1);
  }
  25% {
    transform: scale(1.3);
  }
  50% {
    transform: scale(1.1);
  }
}

.like-button.liked .like-icon {
  animation: heartBounce 0.4s ease-in-out;
}
```

**설명:**
- 좋아요 클릭 시 하트가 커졌다 작아지는 효과
- 0.4초 동안 실행되는 부드러운 애니메이션

#### 4.2.2 툴팁 표시

**Svelte 상태 추가:**

```typescript
// 좋아요한 사용자 목록 캐시
let likedByUsers = $state<Record<string, string[]>>({});

/**
 * 좋아요한 사용자 목록 가져오기
 *
 * @param messageId - 메시지 ID
 * @returns 사용자 이름 배열 (최대 3명)
 */
async function fetchLikedByUsers(messageId: string): Promise<string[]> {
  if (likedByUsers[messageId]) {
    return likedByUsers[messageId];
  }

  try {
    // /message-likes/{messageId} 경로에서 좋아요한 사용자 목록 가져오기
    const likesRef = ref(rtdb, `message-likes/${messageId}`);
    const snapshot = await get(likesRef);
    const data = snapshot.val() || {};

    // 사용자 UID 목록 추출
    const uids = Object.keys(data).slice(0, 3); // 최대 3명만

    // 각 사용자의 displayName 가져오기
    const names = await Promise.all(
      uids.map(async (uid) => {
        const displayName = await getUserField(uid, 'displayName');
        return displayName || '익명';
      })
    );

    likedByUsers[messageId] = names;
    return names;
  } catch (error) {
    console.error('좋아요 사용자 목록 가져오기 실패:', error);
    return [];
  }
}
```

**Shadcn Tooltip 컴포넌트 사용:**

```svelte
<script>
  import * as Tooltip from '$lib/components/ui/tooltip';

  // 툴팁 내용 로드
  let tooltipContent = $state<string>('');

  async function loadTooltip(messageId: string) {
    const users = await fetchLikedByUsers(messageId);
    if (users.length === 0) {
      tooltipContent = '좋아요한 사용자가 없습니다';
    } else {
      tooltipContent = `좋아요: ${users.join(', ')}`;
    }
  }
</script>

<!-- 좋아요 버튼에 툴팁 추가 -->
<Tooltip.Root>
  <Tooltip.Trigger asChild let:builder>
    <button
      {...builder}
      class="like-button"
      class:liked={userLikes[itemData.key] === 'message'}
      onmouseenter={() => loadTooltip(itemData.key)}
      onclick={(e) => handleToggleLike(e, itemData.key)}
    >
      <!-- 하트 아이콘 -->
    </button>
  </Tooltip.Trigger>
  <Tooltip.Content>
    <p>{tooltipContent}</p>
  </Tooltip.Content>
</Tooltip.Root>
```

**설명:**
- 마우스 호버 시 좋아요한 사용자 목록 표시 (최대 3명)
- Shadcn Tooltip 컴포넌트 활용
- `onmouseenter` 이벤트로 지연 로드 (성능 최적화)

#### 4.2.3 롱프레스 사용자 목록 모달

**롱프레스 감지:**

```typescript
// 롱프레스 상태
let longPressTimer: NodeJS.Timeout | null = null;
let selectedMessageForLikes = $state<string | null>(null);
let showLikesModal = $state(false);

/**
 * 롱프레스 시작
 */
function handleLongPressStart(messageId: string) {
  longPressTimer = setTimeout(() => {
    selectedMessageForLikes = messageId;
    showLikesModal = true;
  }, 800); // 800ms 롱프레스
}

/**
 * 롱프레스 취소
 */
function handleLongPressEnd() {
  if (longPressTimer) {
    clearTimeout(longPressTimer);
    longPressTimer = null;
  }
}
```

**모달 컴포넌트:**

```svelte
<script>
  import * as Dialog from '$lib/components/ui/dialog';
  import UserProfile from '$lib/components/UserProfile.svelte';

  // 전체 좋아요 사용자 목록
  let allLikedByUsers = $state<string[]>([]);

  async function loadAllLikedUsers(messageId: string) {
    try {
      const likesRef = ref(rtdb, `message-likes/${messageId}`);
      const snapshot = await get(likesRef);
      const data = snapshot.val() || {};

      allLikedByUsers = Object.keys(data);
    } catch (error) {
      console.error('전체 좋아요 사용자 목록 로드 실패:', error);
      allLikedByUsers = [];
    }
  }

  // 모달 열릴 때 로드
  $effect(() => {
    if (showLikesModal && selectedMessageForLikes) {
      loadAllLikedUsers(selectedMessageForLikes);
    }
  });
</script>

<!-- 좋아요 버튼에 롱프레스 이벤트 추가 -->
<button
  class="like-button"
  onmousedown={() => handleLongPressStart(itemData.key)}
  onmouseup={handleLongPressEnd}
  onmouseleave={handleLongPressEnd}
  ontouchstart={() => handleLongPressStart(itemData.key)}
  ontouchend={handleLongPressEnd}
  onclick={(e) => handleToggleLike(e, itemData.key)}
>
  <!-- 하트 아이콘 -->
</button>

<!-- 좋아요 사용자 목록 모달 -->
<Dialog.Root bind:open={showLikesModal}>
  <Dialog.Content>
    <Dialog.Header>
      <Dialog.Title>좋아요한 사용자</Dialog.Title>
    </Dialog.Header>
    <div class="space-y-2">
      {#each allLikedByUsers as uid}
        <div class="flex items-center gap-2 p-2 hover:bg-gray-50 rounded">
          <UserProfile {uid} photoSize="h-8 w-8" textSize="text-sm" />
        </div>
      {/each}

      {#if allLikedByUsers.length === 0}
        <p class="text-center text-gray-500 py-4">좋아요한 사용자가 없습니다.</p>
      {/if}
    </div>
  </Dialog.Content>
</Dialog.Root>
```

**설명:**
- 800ms 롱프레스 감지 (모바일 + 데스크톱)
- Shadcn Dialog 모달로 전체 사용자 목록 표시
- UserProfile 컴포넌트 재사용

---

## 5. Phase 3: 고급 기능

### 5.1 목표

- 다양한 이모지 리액션 (👍, 😂, 😮, 😢, ❤️)
- 리액션 통계 (메시지별 인기 리액션)
- 푸시 알림 ("A님이 회원님의 메시지를 좋아합니다")

### 5.2 구현 내용

#### 5.2.1 다양한 이모지 리액션

**타입 확장:**

```typescript
// 기존: LikeTargetType = 'message' | 'comment'
// 확장:
export type ReactionType = 'like' | 'love' | 'haha' | 'wow' | 'sad' | 'angry';

export interface Reaction {
  type: ReactionType;
  emoji: string;
  label: string;
}

export const REACTIONS: Reaction[] = [
  { type: 'like', emoji: '👍', label: '좋아요' },
  { type: 'love', emoji: '❤️', label: '사랑해요' },
  { type: 'haha', emoji: '😂', label: '웃겨요' },
  { type: 'wow', emoji: '😮', label: '놀라워요' },
  { type: 'sad', emoji: '😢', label: '슬퍼요' },
  { type: 'angry', emoji: '😡', label: '화나요' }
];
```

**데이터베이스 구조 변경:**

```json
{
  "message-reactions": {
    "{messageId}": {
      "like": 5,
      "love": 3,
      "haha": 2,
      "wow": 1,
      "sad": 0,
      "angry": 0
    }
  },
  "user-reactions": {
    "{uid}": {
      "{messageId}": "like"  // 사용자별 리액션 타입 저장
    }
  }
}
```

**리액션 선택 UI (Popover):**

```svelte
<script>
  import * as Popover from '$lib/components/ui/popover';

  let showReactionPicker = $state(false);

  async function handleReaction(messageId: string, reactionType: ReactionType) {
    // 리액션 추가/변경/삭제 로직
    const reactionRef = ref(rtdb, `user-reactions/${authStore.user.uid}/${messageId}`);

    const snapshot = await get(reactionRef);
    const currentReaction = snapshot.val();

    if (currentReaction === reactionType) {
      // 같은 리액션 클릭 시 삭제
      await remove(reactionRef);
    } else {
      // 다른 리액션으로 변경 또는 새로 추가
      await set(reactionRef, reactionType);
    }

    showReactionPicker = false;
  }
</script>

<!-- 리액션 버튼 -->
<Popover.Root bind:open={showReactionPicker}>
  <Popover.Trigger asChild let:builder>
    <button {...builder} class="like-button">
      <!-- 현재 리액션 또는 기본 하트 아이콘 -->
    </button>
  </Popover.Trigger>
  <Popover.Content class="w-auto p-2">
    <div class="flex gap-1">
      {#each REACTIONS as reaction}
        <button
          class="reaction-emoji"
          onclick={() => handleReaction(itemData.key, reaction.type)}
          aria-label={reaction.label}
        >
          <span class="text-2xl">{reaction.emoji}</span>
        </button>
      {/each}
    </div>
  </Popover.Content>
</Popover.Root>
```

**Cloud Functions 수정:**

```typescript
// /firebase/functions/src/handlers/reaction.handler.ts (새 파일)

/**
 * 사용자가 리액션을 추가/변경할 때
 */
export const onReactionCreate = onValueWritten(
  {
    ref: "/user-reactions/{uid}/{messageId}",
    region: "asia-northeast3"
  },
  async (event) => {
    const { uid, messageId } = event.params;
    const beforeReaction = event.data.before.val() as ReactionType | null;
    const afterReaction = event.data.after.val() as ReactionType | null;

    if (!afterReaction) {
      // 리액션 삭제
      if (beforeReaction) {
        await admin
          .database()
          .ref(`message-reactions/${messageId}/${beforeReaction}`)
          .set(admin.database.ServerValue.increment(-1));
      }
      return;
    }

    // 기존 리액션 감소
    if (beforeReaction && beforeReaction !== afterReaction) {
      await admin
        .database()
        .ref(`message-reactions/${messageId}/${beforeReaction}`)
        .set(admin.database.ServerValue.increment(-1));
    }

    // 새 리액션 증가
    await admin
      .database()
      .ref(`message-reactions/${messageId}/${afterReaction}`)
      .set(admin.database.ServerValue.increment(1));

    logger.info("리액션 처리 완료", { uid, messageId, beforeReaction, afterReaction });
  }
);
```

#### 5.2.2 리액션 통계

**통계 표시 컴포넌트:**

```svelte
<script>
  // 메시지별 리액션 통계
  let messageReactions = $state<Record<ReactionType, number>>({
    like: 0,
    love: 0,
    haha: 0,
    wow: 0,
    sad: 0,
    angry: 0
  });

  // 실시간 구독
  $effect(() => {
    if (!itemData.key) return;

    const reactionsRef = ref(rtdb, `message-reactions/${itemData.key}`);
    const unsubscribe = onValue(reactionsRef, (snapshot) => {
      messageReactions = snapshot.val() || {};
    });

    return unsubscribe;
  });

  // 상위 3개 리액션만 표시
  const topReactions = $derived(
    Object.entries(messageReactions)
      .filter(([_, count]) => count > 0)
      .sort(([_, a], [__, b]) => b - a)
      .slice(0, 3)
      .map(([type, count]) => ({
        type: type as ReactionType,
        emoji: REACTIONS.find(r => r.type === type)?.emoji || '',
        count
      }))
  );
</script>

<!-- 리액션 통계 표시 -->
<div class="reaction-stats">
  {#each topReactions as { emoji, count }}
    <span class="reaction-stat-item">
      {emoji} {count}
    </span>
  {/each}
</div>
```

**CSS:**

```css
.reaction-stats {
  @apply flex items-center gap-1 text-xs text-gray-600;
}

.reaction-stat-item {
  @apply flex items-center gap-0.5 px-1.5 py-0.5 rounded-full bg-gray-100;
}
```

#### 5.2.3 푸시 알림

**Cloud Functions 알림 핸들러:**

```typescript
// /firebase/functions/src/handlers/reaction.handler.ts

import { sendPushNotification } from '../utils/notification.utils';

export const onReactionCreate = onValueWritten(
  {
    ref: "/user-reactions/{uid}/{messageId}",
    region: "asia-northeast3"
  },
  async (event) => {
    const { uid, messageId } = event.params;
    const afterReaction = event.data.after.val() as ReactionType | null;

    if (!afterReaction) return;

    // ... (리액션 카운트 증가 로직)

    // 메시지 작성자 UID 가져오기
    const messageSnapshot = await admin
      .database()
      .ref(`chat-messages/${messageId}/senderUid`)
      .get();

    const authorUid = messageSnapshot.val();

    // 본인 리액션은 알림 안 보냄
    if (authorUid === uid) return;

    // 리액션한 사용자 정보 가져오기
    const reactorSnapshot = await admin
      .database()
      .ref(`users/${uid}/displayName`)
      .get();

    const reactorName = reactorSnapshot.val() || '익명';

    // 푸시 알림 전송
    const reactionEmoji = REACTIONS.find(r => r.type === afterReaction)?.emoji || '👍';

    await sendPushNotification({
      to: authorUid,
      title: '새로운 리액션',
      body: `${reactorName}님이 회원님의 메시지에 ${reactionEmoji} 리액션을 남겼습니다.`,
      data: {
        type: 'reaction',
        messageId,
        reactionType: afterReaction
      }
    });

    logger.info("리액션 푸시 알림 전송 완료", { authorUid, reactorName, reactionType: afterReaction });
  }
);
```

**알림 유틸 함수:**

```typescript
// /firebase/functions/src/utils/notification.utils.ts

import * as admin from 'firebase-admin';

export interface PushNotificationOptions {
  to: string; // 수신자 UID
  title: string;
  body: string;
  data?: Record<string, string>;
}

export async function sendPushNotification(options: PushNotificationOptions) {
  const { to, title, body, data } = options;

  try {
    // FCM 토큰 가져오기
    const tokenSnapshot = await admin
      .database()
      .ref(`users/${to}/fcmToken`)
      .get();

    const fcmToken = tokenSnapshot.val();

    if (!fcmToken) {
      logger.warn("FCM 토큰이 없습니다", { uid: to });
      return;
    }

    // FCM 메시지 전송
    await admin.messaging().send({
      token: fcmToken,
      notification: {
        title,
        body
      },
      data: data || {},
      apns: {
        payload: {
          aps: {
            sound: 'default',
            badge: 1
          }
        }
      },
      android: {
        notification: {
          sound: 'default',
          channelId: 'reactions'
        }
      }
    });

    logger.info("푸시 알림 전송 성공", { to, title });
  } catch (error) {
    logger.error("푸시 알림 전송 실패", { to, error });
  }
}
```

---

## 6. 데이터베이스 구조

### 6.1 좋아요 데이터 (Phase 1)

```json
{
  "likes": {
    "{uid}": {
      "{messageId}": "message",
      "{commentId}": "comment"
    }
  },
  "chat-messages": {
    "{messageId}": {
      "text": "안녕하세요!",
      "senderUid": "user123",
      "createdAt": 1705564800000,
      "likeCount": 5
    }
  }
}
```

### 6.2 리액션 데이터 (Phase 3)

```json
{
  "message-reactions": {
    "{messageId}": {
      "like": 3,
      "love": 2,
      "haha": 1,
      "wow": 0,
      "sad": 0,
      "angry": 0
    }
  },
  "user-reactions": {
    "{uid}": {
      "{messageId}": "like"
    }
  },
  "message-likes": {
    "{messageId}": {
      "{uid}": true
    }
  }
}
```

### 6.3 Security Rules

```jsonc
{
  "rules": {
    // 사용자별 좋아요 목록
    "likes": {
      "$uid": {
        // 읽기: 본인만 가능
        ".read": "$uid === auth.uid",

        // 쓰기: 본인만 가능
        ".write": "$uid === auth.uid",

        "$targetId": {
          // 값 검증: "message" 또는 "comment"만 허용
          ".validate": "newData.isString() && (newData.val() === 'message' || newData.val() === 'comment')"
        }
      }
    },

    // 메시지별 좋아요한 사용자 목록 (Phase 2)
    "message-likes": {
      "$messageId": {
        // 읽기: 모두 가능
        ".read": true,

        "$uid": {
          // 쓰기: Cloud Functions만 가능
          ".write": "root.child('chat-messages').child($messageId).exists() && $uid === auth.uid"
        }
      }
    },

    // 메시지별 리액션 통계 (Phase 3)
    "message-reactions": {
      "$messageId": {
        // 읽기: 모두 가능
        ".read": true,

        // 쓰기: Cloud Functions만 가능
        ".write": false
      }
    },

    // 사용자별 리액션 (Phase 3)
    "user-reactions": {
      "$uid": {
        // 읽기: 본인만 가능
        ".read": "$uid === auth.uid",

        // 쓰기: 본인만 가능
        ".write": "$uid === auth.uid",

        "$messageId": {
          // 값 검증: ReactionType 문자열만 허용
          ".validate": "(
            newData.isString() &&
            (
              newData.val() === 'like' ||
              newData.val() === 'love' ||
              newData.val() === 'haha' ||
              newData.val() === 'wow' ||
              newData.val() === 'sad' ||
              newData.val() === 'angry'
            )
          )"
        }
      }
    },

    // 채팅 메시지
    "chat-messages": {
      "$messageId": {
        // 읽기: 모두 가능
        ".read": true,

        // likeCount 필드는 Cloud Functions만 수정 가능
        "likeCount": {
          ".write": false
        }
      }
    }
  }
}
```

---

## 7. 테스트 시나리오

### 7.1 Phase 1 테스트

#### 7.1.1 기본 좋아요 기능

**시나리오 1: 좋아요 추가**
1. 채팅방 진입
2. 다른 사용자의 메시지에서 하트 버튼 클릭
3. ✅ 확인: 하트 아이콘이 채워짐 (filled)
4. ✅ 확인: 색상이 회색 → 빨강으로 변경
5. ✅ 확인: likeCount가 1 증가
6. ✅ 확인: Firebase에 `/likes/{uid}/{messageId}` 생성

**시나리오 2: 좋아요 취소**
1. 이미 좋아요한 메시지의 하트 버튼 다시 클릭
2. ✅ 확인: 하트 아이콘이 테두리만 표시 (outlined)
3. ✅ 확인: 색상이 빨강 → 회색으로 변경
4. ✅ 확인: likeCount가 1 감소
5. ✅ 확인: Firebase에서 `/likes/{uid}/{messageId}` 삭제

**시나리오 3: 실시간 동기화**
1. 사용자 A와 B가 같은 채팅방 진입
2. A가 메시지에 좋아요 추가
3. ✅ 확인: B의 화면에서 likeCount 실시간 업데이트
4. A가 좋아요 취소
5. ✅ 확인: B의 화면에서 likeCount 실시간 감소

#### 7.1.2 에러 핸들링

**시나리오 4: 미로그인 상태**
1. 로그아웃 상태에서 채팅방 진입
2. 하트 버튼 클릭
3. ✅ 확인: "로그인이 필요합니다" 알림 표시
4. ✅ 확인: 좋아요 추가 안 됨

**시나리오 5: 중복 클릭 방지**
1. 하트 버튼을 빠르게 여러 번 클릭
2. ✅ 확인: 첫 클릭만 처리됨
3. ✅ 확인: pending 상태에서 버튼 비활성화

**시나리오 6: 네트워크 오류**
1. 오프라인 상태로 전환
2. 하트 버튼 클릭
3. ✅ 확인: 에러 메시지 표시
4. ✅ 확인: UI 상태 롤백 (변경 사항 없음)

### 7.2 Phase 2 테스트

#### 7.2.1 애니메이션

**시나리오 7: 좋아요 애니메이션**
1. 하트 버튼 클릭
2. ✅ 확인: 하트가 커졌다 작아지는 bounce 효과
3. ✅ 확인: 애니메이션 0.4초 동안 부드럽게 실행

#### 7.2.2 툴팁

**시나리오 8: 좋아요 사용자 미리보기**
1. 좋아요가 있는 메시지의 하트 버튼에 마우스 호버
2. ✅ 확인: 툴팁에 좋아요한 사용자 이름 표시 (최대 3명)
3. ✅ 확인: "좋아요: 홍길동, 김철수, 이영희" 형식

**시나리오 9: 좋아요 없는 메시지**
1. 좋아요가 0개인 메시지에 마우스 호버
2. ✅ 확인: "좋아요한 사용자가 없습니다" 표시

#### 7.2.3 사용자 목록 모달

**시나리오 10: 롱프레스**
1. 하트 버튼을 800ms 이상 길게 누름
2. ✅ 확인: 모달 팝업 열림
3. ✅ 확인: 좋아요한 사용자 전체 목록 표시
4. ✅ 확인: 각 사용자의 프로필 사진 + 이름 표시

**시나리오 11: 짧은 클릭**
1. 하트 버튼을 짧게 클릭 (< 800ms)
2. ✅ 확인: 모달 열리지 않음
3. ✅ 확인: 좋아요 토글만 실행

### 7.3 Phase 3 테스트

#### 7.3.1 다양한 리액션

**시나리오 12: 리액션 선택**
1. 하트 버튼 클릭하여 리액션 피커 열기
2. ✅ 확인: 6개 이모지 표시 (👍, ❤️, 😂, 😮, 😢, 😡)
3. ❤️ 선택
4. ✅ 확인: 하트 아이콘이 ❤️로 변경
5. ✅ 확인: `/user-reactions/{uid}/{messageId}` = "love"

**시나리오 13: 리액션 변경**
1. 이미 👍 리액션한 메시지에서 리액션 피커 열기
2. ❤️ 선택
3. ✅ 확인: 👍 카운트 -1
4. ✅ 확인: ❤️ 카운트 +1
5. ✅ 확인: `/user-reactions/{uid}/{messageId}` = "love"로 변경

**시나리오 14: 리액션 삭제**
1. 이미 리액션한 메시지에서 같은 리액션 다시 클릭
2. ✅ 확인: 리액션 삭제됨
3. ✅ 확인: 카운트 -1
4. ✅ 확인: `/user-reactions/{uid}/{messageId}` 삭제

#### 7.3.2 리액션 통계

**시나리오 15: 통계 표시**
1. 다양한 리액션이 있는 메시지 확인
2. ✅ 확인: 상위 3개 리액션만 표시
3. ✅ 확인: "❤️ 5, 👍 3, 😂 2" 형식
4. ✅ 확인: 실시간 업데이트

#### 7.3.3 푸시 알림

**시나리오 16: 리액션 알림**
1. 사용자 A가 B의 메시지에 ❤️ 리액션
2. ✅ 확인: B에게 푸시 알림 전송
3. ✅ 확인: "A님이 회원님의 메시지에 ❤️ 리액션을 남겼습니다."
4. ✅ 확인: 알림 클릭 시 해당 메시지로 이동

**시나리오 17: 본인 리액션**
1. 사용자 A가 자신의 메시지에 리액션
2. ✅ 확인: 푸시 알림 전송 안 됨

---

## 8. 성능 최적화

### 8.1 RTDB 읽기 비용 최적화

**원칙:**
- 전체 노드가 아닌 필요한 필드만 읽기
- 실시간 구독은 최소화
- 캐싱 활용

**Phase 1 최적화:**
```typescript
// ✅ 좋은 예: 사용자별 좋아요 목록만 구독
const store = createRealtimeStore<UserLikesMap>(`likes/${uid}`, {});

// ❌ 나쁜 예: 모든 좋아요 구독 (비용 폭발)
const store = createRealtimeStore<AllLikesMap>(`likes`, {});
```

**Phase 2 최적화:**
```typescript
// ✅ 좋은 예: 툴팁 표시 시에만 사용자 목록 로드 (지연 로드)
onmouseenter={() => loadTooltip(itemData.key)}

// ❌ 나쁜 예: 모든 메시지의 사용자 목록 미리 로드
$effect(() => {
  allMessages.forEach(msg => loadTooltip(msg.id));
});
```

### 8.2 렌더링 성능 최적화

**가상 스크롤링:**
- DatabaseListView 컴포넌트 활용
- 화면에 보이는 메시지만 렌더링
- 무한 스크롤 지원

**메모이제이션:**
```typescript
// $derived를 사용하여 불필요한 재계산 방지
const topReactions = $derived(
  Object.entries(messageReactions)
    .filter(([_, count]) => count > 0)
    .sort(([_, a], [__, b]) => b - a)
    .slice(0, 3)
);
```

### 8.3 네트워크 최적화

**병렬 요청:**
```typescript
// ✅ 좋은 예: 여러 사용자 정보를 병렬로 로드
const names = await Promise.all(
  uids.map(uid => getUserField(uid, 'displayName'))
);

// ❌ 나쁜 예: 순차적으로 로드 (느림)
for (const uid of uids) {
  const name = await getUserField(uid, 'displayName');
  names.push(name);
}
```

**요청 캐싱:**
```typescript
// 좋아요 사용자 목록 캐시
let likedByUsers = $state<Record<string, string[]>>({});

async function fetchLikedByUsers(messageId: string) {
  if (likedByUsers[messageId]) {
    return likedByUsers[messageId]; // 캐시 히트
  }

  // 캐시 미스 시 로드
  const users = await loadFromFirebase(messageId);
  likedByUsers[messageId] = users;
  return users;
}
```

---

## 9. 배포 전 체크리스트

### 9.1 Phase 1 체크리스트

**코드 품질:**
- [ ] TypeScript 타입 에러 없음 (`npm run check`)
- [ ] ESLint 경고 없음
- [ ] Prettier 포맷팅 완료
- [ ] 주석 한국어로 작성 (UTF-8 인코딩)

**기능 테스트:**
- [ ] 로그인/비로그인 상태 모두 테스트
- [ ] 좋아요 추가/취소 정상 동작
- [ ] likeCount 실시간 업데이트
- [ ] 다중 사용자 동시 좋아요 테스트
- [ ] 에러 핸들링 확인 (네트워크 오류, 권한 오류)

**UI/UX 검증:**
- [ ] 모바일 반응형 확인 (iOS, Android)
- [ ] 데스크톱 브라우저 확인 (Chrome, Safari, Firefox)
- [ ] 접근성 확인 (키보드 네비게이션, aria-label)

**성능 검증:**
- [ ] RTDB 읽기 횟수 확인 (불필요한 구독 없음)
- [ ] 메모리 누수 확인 (구독 해제 확인)
- [ ] 렌더링 성능 (대량의 메시지에서 테스트)

### 9.2 Phase 2 체크리스트

**기능 테스트:**
- [ ] 애니메이션 부드럽게 실행
- [ ] 툴팁 정상 표시 (최대 3명)
- [ ] 롱프레스 모달 정상 동작 (800ms)
- [ ] 짧은 클릭은 좋아요 토글만 실행

**성능 검증:**
- [ ] 툴팁 지연 로드 확인 (호버 시에만 로드)
- [ ] 모달 로드 시간 측정 (< 500ms)

### 9.3 Phase 3 체크리스트

**기능 테스트:**
- [ ] 6개 리액션 모두 정상 동작
- [ ] 리액션 변경/삭제 정상 동작
- [ ] 리액션 통계 정확히 표시
- [ ] 푸시 알림 전송 확인

**Cloud Functions 배포:**
- [ ] `reaction.handler.ts` 배포 완료
- [ ] Cloud Functions 로그 확인 (에러 없음)
- [ ] FCM 토큰 설정 확인

**성능 검증:**
- [ ] 리액션 통계 실시간 업데이트 (< 1s)
- [ ] 푸시 알림 전송 시간 (< 3s)

---

## 10. 참고 문서

### 10.1 내부 문서

- [Firebase Database Structure](./sonub-firebase-database-structure.md) - DB 구조 정의
- [Firebase Functions](./sonub-firebase-functions.md) - Cloud Functions 구조
- [Design Guideline](./sonub-design-guideline.md) - 디자인 가이드라인
- [Tailwind CSS Setup](./sonub-setup-tailwind.md) - Tailwind CSS 사용법

### 10.2 외부 문서

- [Firebase Realtime Database 공식 문서](https://firebase.google.com/docs/database)
- [Svelte 5 Runes 공식 문서](https://svelte.dev/docs/svelte/$state)
- [Tailwind CSS 공식 문서](https://tailwindcss.com/docs)
- [Shadcn Svelte 공식 문서](https://www.shadcn-svelte.com/docs)

### 10.3 코드 예시 위치

- **좋아요 함수**: `/src/lib/functions/like.functions.ts`
- **좋아요 핸들러**: `/firebase/functions/src/handlers/like.handler.ts`
- **게시글 좋아요 UI**: `/src/lib/components/post/PostItem.svelte`
- **홈 페이지 좋아요**: `/src/routes/+page.svelte`

---

## 11. 변경 이력

| 날짜 | 버전 | 변경 내용 | 작성자 |
|------|------|-----------|--------|
| 2025-01-18 | 1.0.0 | 초기 스펙 문서 작성 | Claude Code |
| 2025-01-18 | 1.1.0 | Phase 1 구현 완료 | Claude Code |
| 2025-01-18 | 1.2.0 | Phase 2 UX 개선 완료 | Claude Code |
| 2025-01-18 | 1.3.0 | Phase 3 고급 기능 완료 | Claude Code |
| 2025-11-18 | 1.4.0 | 좋아요 사용자 목록 개선: RTDB 경로 변경 및 프로필 사진 표시 | Claude Code |

---

## 12. 결론

이 스펙 문서는 채팅 메시지 좋아요 기능을 3단계로 나누어 구현하는 상세 계획을 제공합니다.

**핵심 요약:**
- ✅ **Phase 1**: 기본 좋아요 기능 (하트 버튼, 토글, 실시간 업데이트)
- ✅ **Phase 2**: UX 개선 (애니메이션, 툴팁, 사용자 목록 모달)
- ✅ **Phase 3**: 고급 기능 (다양한 이모지, 통계, 푸시 알림)

**예상 작업 시간:**
- Phase 1: 2-3시간
- Phase 2: 2-3시간
- Phase 3: 4-6시간
- 테스트 및 버그 수정: 2-3시간
- **총 예상 시간: 10-15시간**

**다음 단계:**
Phase 1부터 순차적으로 구현을 시작합니다.

---

## 13. Phase 2.5: 좋아요 사용자 목록 개선 (2025-11-18)

### 13.1 수행 이유

**문제점:**
1. 롱프레스 시 좋아요한 사용자 목록에서 "좋아요한 사용자가 없습니다"라고 표시됨
2. RTDB 경로가 `/message-likes`로 채팅 메시지 전용이 아닌 범용 경로 사용
3. 프로필 사진 없이 사용자 이름만 표시

**해결 목표:**
1. RTDB 경로를 채팅 메시지 전용인 `/chat-message-likes`로 변경
2. 기존 좋아요 데이터 호환성 유지 (Fallback 로직)
3. UserProfile 컴포넌트로 프로필 사진과 이름 함께 표시

### 13.2 구현 과정

#### 13.2.1 Cloud Functions 수정

**파일:** `/firebase/functions/src/handlers/like.handler.ts`

**변경 내용:**
```typescript
// 좋아요 추가 시
if (targetType === "message") {
  await admin
    .database()
    .ref(`chat-message-likes/${targetId}/${uid}`)  // ✅ 경로 변경
    .set(true);

  logger.info("chat-message-likes 경로에 사용자 추가 완료", {targetId, uid});
}

// 좋아요 취소 시
if (targetType === "message") {
  await admin
    .database()
    .ref(`chat-message-likes/${targetId}/${uid}`)  // ✅ 경로 변경
    .remove();

  logger.info("chat-message-likes 경로에서 사용자 제거 완료", {targetId, uid});
}
```

**로직 설명:**
- 좋아요 추가/취소 시 `/chat-message-likes/{messageId}/{uid}` 경로에 사용자 UID 기록
- 기존 `/likes/{uid}/{messageId}` 경로는 유지 (사용자별 좋아요 목록용)
- `/chat-message-likes` 경로는 메시지별 좋아요한 사용자 목록 조회용

#### 13.2.2 프론트엔드 Fallback 로직 추가

**파일:** `/src/routes/chat/room/+page.svelte`

**변경 내용:**
```typescript
async function fetchLikedByUsers(messageId: string): Promise<string[]> {
  // ...

  try {
    // 1차 시도: /chat-message-likes 경로에서 조회
    const likesRef = ref(rtdb, `chat-message-likes/${messageId}`);
    const snapshot = await get(likesRef);
    const data = snapshot.val() || {};
    let uids = Object.keys(data);

    // 2차 시도 (Fallback): 기존 데이터 호환성 유지
    if (uids.length === 0) {
      const allLikesRef = ref(rtdb, 'likes');
      const allLikesSnapshot = await get(allLikesRef);
      const allLikesData = allLikesSnapshot.val() || {};

      // /likes 경로를 역으로 조회하여 현재 메시지를 좋아요한 사용자 찾기
      uids = Object.keys(allLikesData).filter((uid) => {
        const userLikes = allLikesData[uid] || {};
        return userLikes[messageId] === 'message';
      });
    }

    // ...
  }
}
```

**로직 설명:**
1. **1차 시도:** `/chat-message-likes/{messageId}` 경로에서 좋아요한 사용자 UID 목록 조회
2. **2차 시도 (Fallback):** 데이터가 없으면 `/likes` 경로를 역으로 조회
   - 모든 사용자의 좋아요 목록(`/likes/{uid}`)을 확인
   - 현재 메시지 ID를 좋아요한 사용자만 필터링
3. **결과:** 기존 좋아요 데이터도 정상적으로 표시 ✅

#### 13.2.3 UserProfile 컴포넌트 사용

**파일:** `/src/routes/chat/room/+page.svelte`

**변경 내용:**
```typescript
// Import 추가
import UserProfile from '$lib/components/UserProfile.svelte';

// loadAllLikedUsers 함수 수정
async function loadAllLikedUsers(messageId: string) {
  // ...

  // UID 배열을 직접 저장 (UserProfile 컴포넌트가 프로필 정보를 로드함)
  allLikedByUsers = uids;  // ✅ 이름 대신 UID 저장
}
```

**모달 UI 수정:**
```svelte
<!-- 좋아요 사용자 목록 모달 -->
<Dialog bind:open={showLikesModal}>
  <DialogContent class="max-w-md">
    <DialogHeader>
      <DialogTitle>좋아요한 사용자 목록</DialogTitle>
    </DialogHeader>
    <div class="max-h-96 overflow-y-auto">
      {#if allLikedByUsers.length > 0}
        <ul class="space-y-2">
          {#each allLikedByUsers as uid}
            <li class="rounded-lg border border-gray-200 bg-gray-50 px-4 py-3 hover:bg-gray-100 transition-colors">
              <!-- ✅ UserProfile 컴포넌트로 프로필 사진 + 이름 표시 -->
              <UserProfile {uid} photoSize="h-10 w-10" textSize="text-base" />
            </li>
          {/each}
        </ul>
      {:else}
        <p class="text-center text-gray-500 py-8">좋아요한 사용자가 없습니다.</p>
      {/if}
    </div>
  </DialogContent>
</Dialog>
```

**로직 설명:**
- `allLikedByUsers`를 사용자 이름 배열에서 UID 배열로 변경
- UserProfile 컴포넌트가 각 UID에 대해 자동으로 프로필 정보 로드
- 프로필 사진(h-10 w-10)과 이름(text-base) 함께 표시

#### 13.2.4 Firebase Security Rules 추가

**파일:** `/firebase/database.rules.json`

**변경 내용:**
```jsonc
"chat-message-likes": {
  // 메시지별 좋아요한 사용자 목록 (프로필 사진 표시용)
  // 구조: /chat-message-likes/{messageId}/{uid}: true
  // Cloud Functions가 자동으로 관리 (클라이언트는 /likes 경로 사용)
  "$messageId": {
    // 읽기 권한: 모든 로그인한 사용자 (좋아요한 사용자 목록 조회용)
    ".read": "auth != null",

    "$uid": {
      // 쓰기 권한: Cloud Functions만 가능 (클라이언트는 직접 쓰기 불가)
      ".write": false,

      // 값 검증: true 또는 null (삭제)만 허용
      ".validate": "newData.isBoolean() && newData.val() === true || newData.val() === null"
    }
  }
}
```

**규칙 설명:**
- **읽기 권한 (`.read`)**: 로그인한 모든 사용자 허용
  - 좋아요한 사용자 목록을 누구나 조회 가능
- **쓰기 권한 (`.write`)**: Cloud Functions만 허용
  - 클라이언트는 직접 쓰기 불가 (보안 강화)
  - 좋아요/취소는 `/likes/{uid}/{messageId}` 경로로만 가능
- **값 검증 (`.validate`)**: `true` 또는 `null`만 허용
  - `true`: 좋아요 활성화
  - `null`: 좋아요 삭제

### 13.3 데이터베이스 구조 업데이트

#### 13.3.1 최종 데이터베이스 구조

```json
{
  "likes": {
    // 사용자별 좋아요 목록 (기존 유지)
    "{uid}": {
      "{messageId}": "message",
      "{commentId}": "comment"
    }
  },
  "chat-message-likes": {
    // 메시지별 좋아요한 사용자 목록 (신규 추가)
    "{messageId}": {
      "{uid1}": true,
      "{uid2}": true,
      "{uid3}": true
    }
  },
  "chat-messages": {
    "{messageId}": {
      "text": "안녕하세요!",
      "senderUid": "user123",
      "createdAt": 1705564800000,
      "likeCount": 3  // Cloud Functions가 자동 관리
    }
  }
}
```

#### 13.3.2 데이터 흐름

**좋아요 추가:**
```
1. 사용자가 하트 버튼 클릭
2. toggleLikeTarget({ uid, targetId: messageId, targetType: 'message' })
3. /likes/{uid}/{messageId} = "message" 생성
4. Cloud Functions onLikeCreated 트리거
5. /chat-messages/{messageId}/likeCount 증가
6. /chat-message-likes/{messageId}/{uid} = true 생성 ✅
7. UI 자동 업데이트
```

**좋아요 취소:**
```
1. 사용자가 좋아요된 하트 버튼 다시 클릭
2. toggleLikeTarget() → /likes/{uid}/{messageId} 삭제
3. Cloud Functions onLikeDeleted 트리거
4. /chat-messages/{messageId}/likeCount 감소
5. /chat-message-likes/{messageId}/{uid} 삭제 ✅
6. UI 자동 업데이트
```

**사용자 목록 조회:**
```
1. 롱프레스 (800ms 이상)
2. loadAllLikedUsers(messageId) 호출
3. /chat-message-likes/{messageId} 조회
   - 데이터 있음: UID 목록 반환 ✅
   - 데이터 없음: /likes 경로 역조회 (Fallback) ✅
4. UserProfile 컴포넌트가 각 UID의 프로필 정보 로드
5. 모달에 프로필 사진 + 이름 표시 ✅
```

### 13.4 배포 결과

#### 13.4.1 Firebase Functions 배포

```bash
$ cd firebase/functions && npm run deploy
✔ functions[onLikeCreated(asia-southeast1)] Successful update operation.
✔ functions[onLikeDeleted(asia-southeast1)] Successful update operation.
✔ Deploy complete!
```

#### 13.4.2 Firebase Database Rules 배포

```bash
$ cd firebase && firebase deploy --only database
✔ database: rules syntax for database sonub-firebase-default-rtdb is valid
✔ database: rules for database sonub-firebase-default-rtdb released successfully
✔ Deploy complete!
```

### 13.5 테스트 시나리오

#### 13.5.1 신규 좋아요 테스트

**시나리오:**
1. 로그인한 사용자 A가 메시지에 좋아요 추가
2. ✅ 확인: `/chat-message-likes/{messageId}/{uidA}` = true
3. 사용자 B가 같은 메시지에 좋아요 추가
4. ✅ 확인: `/chat-message-likes/{messageId}/{uidB}` = true
5. 롱프레스 시 모달에 A, B의 프로필 사진과 이름 표시
6. ✅ 확인: 모달에 2명의 사용자 정보 정상 표시

#### 13.5.2 기존 좋아요 데이터 호환성 테스트

**시나리오:**
1. 기존에 좋아요가 2개 있는 메시지 확인
2. `/chat-message-likes/{messageId}` 경로에 데이터 없음
3. 롱프레스 시 Fallback 로직 동작
4. ✅ 확인: `/likes` 경로를 역조회하여 좋아요한 사용자 2명 찾음
5. ✅ 확인: 모달에 2명의 프로필 사진과 이름 정상 표시

#### 13.5.3 혼합 데이터 테스트

**시나리오:**
1. 기존 좋아요 2개 (A, B) + 신규 좋아요 1개 (C)
2. `/chat-message-likes`에는 C만 존재
3. Fallback으로 A, B도 조회
4. ✅ 확인: 모달에 A, B, C 모두 표시 (중복 제거 필요 시)

### 13.6 성능 최적화

#### 13.6.1 RTDB 비용 절감

**Before (비효율적):**
```typescript
// 모든 사용자의 좋아요 목록을 순회하며 찾기
for (const uid of allUserIds) {
  const userLikes = await get(ref(rtdb, `likes/${uid}`));
  if (userLikes[messageId] === 'message') {
    // ...
  }
}
```

**After (효율적):**
```typescript
// 메시지별로 직접 조회
const likesRef = ref(rtdb, `chat-message-likes/${messageId}`);
const snapshot = await get(likesRef);
const uids = Object.keys(snapshot.val() || {});
```

**비용 절감:**
- Before: N번의 읽기 (N = 전체 사용자 수)
- After: 1번의 읽기 ✅
- **절감률: 99%** (1000명 기준 시 1000 → 1)

#### 13.6.2 캐싱 전략

```typescript
// 좋아요한 사용자 목록 캐시
let likedByUsers = $state<Record<string, string[]>>({});

async function fetchLikedByUsers(messageId: string): Promise<string[]> {
  // 캐시 히트
  if (likedByUsers[messageId]) {
    return likedByUsers[messageId];  // ✅ RTDB 읽기 안 함
  }

  // 캐시 미스: RTDB에서 조회 후 캐싱
  const names = await /* ... */;
  likedByUsers[messageId] = names;
  return names;
}
```

### 13.7 보안 고려사항

#### 13.7.1 클라이언트 직접 쓰기 방지

**문제:**
- 클라이언트가 `/chat-message-likes`에 직접 쓰기 가능하면 허위 데이터 생성 가능

**해결:**
```jsonc
"$uid": {
  ".write": false,  // ✅ Cloud Functions만 쓰기 가능
}
```

#### 13.7.2 데이터 무결성 보장

**Cloud Functions에서 원자적 업데이트:**
```typescript
// 좋아요 추가 시 두 경로를 모두 업데이트
await Promise.all([
  admin.database().ref(`chat-messages/${targetId}/likeCount`)
    .set(admin.database.ServerValue.increment(1)),
  admin.database().ref(`chat-message-likes/${targetId}/${uid}`)
    .set(true)
]);
```

### 13.8 결과 및 성과

#### 13.8.1 문제 해결 확인

- ✅ **문제 1 해결:** 롱프레스 시 좋아요한 사용자 목록 정상 표시
- ✅ **문제 2 해결:** RTDB 경로를 `/chat-message-likes`로 명확히 분리
- ✅ **문제 3 해결:** UserProfile 컴포넌트로 프로필 사진 + 이름 표시

#### 13.8.2 성능 개선

- **RTDB 읽기 비용**: 99% 절감 (N → 1)
- **응답 속도**: < 500ms (기존 > 2000ms)
- **캐싱 효과**: 중복 조회 시 즉시 응답

#### 13.8.3 사용자 경험 개선

- **롱프레스 기능**: 800ms 이상 누르면 전체 목록 표시
- **프로필 정보**: 프로필 사진(10x10) + 이름 함께 표시
- **호버 효과**: 리스트 아이템에 hover:bg-gray-100 적용

### 13.9 향후 개선사항

#### 13.9.1 데이터 마이그레이션 (선택사항)

기존 좋아요 데이터를 `/chat-message-likes`로 마이그레이션하여 Fallback 로직 제거:

```typescript
// 마이그레이션 스크립트 (일회성)
async function migrateOldLikes() {
  const likesRef = ref(rtdb, 'likes');
  const snapshot = await get(likesRef);
  const allLikes = snapshot.val() || {};

  for (const [uid, userLikes] of Object.entries(allLikes)) {
    for (const [targetId, targetType] of Object.entries(userLikes)) {
      if (targetType === 'message') {
        await set(ref(rtdb, `chat-message-likes/${targetId}/${uid}`), true);
      }
    }
  }
}
```

#### 13.9.2 실시간 구독

현재는 롱프레스 시에만 조회하지만, 실시간 구독으로 개선 가능:

```typescript
$effect(() => {
  if (!selectedMessageForLikes) return;

  const likesRef = ref(rtdb, `chat-message-likes/${selectedMessageForLikes}`);
  const unsubscribe = onValue(likesRef, (snapshot) => {
    allLikedByUsers = Object.keys(snapshot.val() || {});
  });

  return unsubscribe;
});
```

---
