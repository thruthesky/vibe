---
name: sonub-component-post-item
version: 1.0.0
description: 게시글 카드 컴포넌트 SED 명세서
author: JaeHo Song
email: thruthesky@gmail.com
license: GPL-3.0
created: 2025-01-20
updated: 2025-01-20
step: 1
priority: "high"
dependencies: ["sonub-component-file-attachments.md", "sonub-functions-like-functions.md", "sonub-design-guideline.md"]
tags: ["component", "post", "card", "forum", "home", "reusable"]
---

# PostItem 컴포넌트 상세 스펙

## 1. 개요

### 1.1 목적

PostItem은 게시판과 홈 화면에서 재사용되는 게시글 카드 UI 컴포넌트입니다. 작성자 정보, 게시글 내용, 좋아요/댓글 버튼, 수정/삭제 버튼, 댓글 목록을 포함합니다.

### 1.2 적용 범위

본 컴포넌트는 다음의 페이지에서 재사용됩니다:

- **홈 화면** (`src/routes/+page.svelte`) - 팔로우한 사용자의 게시글 피드
- **게시판 페이지** (`src/routes/forum/+page.svelte`) - 카테고리별 게시글 목록
- **사용자 프로필** (`src/routes/user/profile/+page.svelte`) - 사용자가 작성한 게시글

### 1.3 주요 기능

1. **작성자 정보** - UserProfile 컴포넌트로 프로필 표시
2. **팔로우 버튼** - 작성자 옆에 팔로우 버튼 (본인 제외)
3. **카테고리 뱃지** - 게시글 카테고리 표시
4. **채팅방 링크** - 채팅방에서 작성된 경우 채팅방 이름 링크
5. **게시글 내용** - 텍스트 + 첨부파일 (FileAttachments 사용)
6. **좋아요 버튼** - 좋아요 토글 + 아바타 스택
7. **댓글 버튼** - 댓글 작성 모달 열기
8. **수정/삭제 버튼** - 본인 게시글만 표시
9. **댓글 목록** - PostCommentList 컴포넌트

## 2. 컴포넌트 위치

```
src/lib/components/post/PostItem.svelte
```

Repository 문서:
```
specs/repository/src/lib/components/post/PostItem.svelte.md
```

## 3. Props 인터페이스

### 3.1 Props 정의

| 이름 | 타입 | 필수 | 기본값 | 설명 |
|------|------|------|--------|------|
| `message` | `any` | ✅ | - | 게시글 데이터 객체 |
| `postId` | `string` | ✅ | - | 게시글 ID |
| `userLikes` | `Record<string, LikeTargetType>` | ❌ | `{}` | 좋아요 상태 맵 |
| `onToggleLike` | `(event, postId, type) => void` | ✅ | - | 좋아요 토글 핸들러 |
| `onOpenCommentDialog` | `(postId, parentId?, parentText?) => void` | ✅ | - | 댓글 작성 모달 열기 핸들러 |
| `onEdit` | `(postId, text, urls, roomId) => void` | ❌ | `undefined` | 수정 핸들러 (게시판용) |
| `onDelete` | `(postId) => void` | ✅ | - | 삭제 핸들러 |
| `editMode` | `'dialog' \| 'navigate'` | ❌ | `'dialog'` | 수정 버튼 동작 모드 |

### 3.2 message 객체 구조

```typescript
interface Message {
  authorUid: string;          // 작성자 UID
  text: string;               // 게시글 텍스트
  urls?: Record<number, string>; // 첨부파일 URL 맵
  category?: ForumCategory;   // 카테고리
  roomId?: string;            // 채팅방 ID
  messageId?: string;         // 채팅 메시지 ID
  createdAt: number;          // 생성 시각
  likeCount?: number;         // 좋아요 수
  totalChildCount?: number;   // 댓글 수
  deleted?: boolean;          // 삭제 여부
}
```

## 4. 레이아웃 구조

### 4.1 카드 구조

```
┌─────────────────────────────────────┐
│ [프로필] [이름] [팔로우]  [카테고리][시간] │ <- 상단 헤더
├─────────────────────────────────────┤
│ 게시글 텍스트 내용...                   │ <- 내용 영역
│                                     │
│ [첨부파일 미리보기]                     │
├─────────────────────────────────────┤
│ ❤️ 좋아요 10 [아바타] 💬 댓글 5 [수정][삭제] │ <- 액션 바
└─────────────────────────────────────┘
    └─ 댓글 목록 (PostCommentList)
```

### 4.2 반응형 디자인

**모바일**:
- 테두리 없음
- padding만 적용
- 카드 간 구분선으로 분리

**데스크톱**:
- 둥근 모서리 (`rounded-lg`)
- 테두리 (`border`)
- 그림자 (`shadow-sm`)
- 호버 시 그림자 증가 (`hover:shadow-md`)

## 5. 상단 헤더

### 5.1 왼쪽 영역

```svelte
<div class="post-header-left">
  <UserProfile uid={message.authorUid} photoSize="h-8 w-8" textSize="text-sm" />

  <!-- 팔로우 버튼 (본인 제외) -->
  {#if !isMyPost}
    <div class="ml-2">
      <FollowButton targetUid={message.authorUid} />
    </div>
  {/if}
</div>
```

### 5.2 오른쪽 영역

```svelte
<div class="post-header-right">
  <!-- 카테고리 뱃지 -->
  {#if message.category}
    <span class="post-category-badge">
      {getCategoryMessage(message.category)}
    </span>
  {/if}

  <!-- 채팅방 링크 -->
  {#if message.roomId && message.roomId !== 'post'}
    {#await getChatRoomName(rtdb, message.roomId)}
      <button disabled>...</button>
    {:then roomName}
      <button onclick={() => goto(`/chat/room?roomId=${message.roomId}`)}>
        {roomName}
      </button>
    {/await}
  {/if}

  <!-- 시간 -->
  <span class="post-time">
    {formatDistanceToNow(new Date(message.createdAt), { addSuffix: true, locale })}
  </span>
</div>
```

### 5.3 카테고리 매핑

```typescript
const getCategoryMessage = (category: ForumCategory) => {
  const categoryMap: Record<ForumCategory, () => string> = {
    discussion: m.chatCategoryFreeDiscussion,
    qna: m.chatCategoryQna,
    news: m.chatCategoryNews,
    // ... 기타 카테고리
  };
  return categoryMap[category]();
};
```

## 6. 내용 영역

### 6.1 텍스트 표시

```svelte
<div class="post-content">
  <p class="post-text">
    {message.text || m.postNoContent()}
  </p>

  <!-- 첨부파일 (FileAttachments 컴포넌트) -->
  {#if message.urls}
    <FileAttachments urls={message.urls} maxDisplay={5} />
  {/if}
</div>
```

### 6.2 텍스트 3줄 제한

```css
.post-text {
  @apply mb-2 whitespace-pre-line text-gray-800;
  display: -webkit-box;
  -webkit-line-clamp: 3;
  -webkit-box-orient: vertical;
  overflow: hidden;
  text-overflow: ellipsis;
}
```

## 7. 좋아요 기능

### 7.1 좋아요 버튼

```svelte
<button
  class="action-button"
  class:liked={userLikes[postId] === 'post'}
  disabled={!authStore.user}
  onclick={(e) => onToggleLike(e, postId, 'post')}
>
  <!-- 하트 아이콘 -->
  <svg
    fill={userLikes[postId] === 'post' ? 'currentColor' : 'none'}
    stroke="currentColor"
  >
    <path d="M4.318 6.318a4.5..." />
  </svg>

  <!-- "좋아요" 텍스트 (데스크톱만) -->
  <span class="hidden md:inline">{m.reactionTypeLike()}</span>

  <!-- 좋아요 수 -->
  {#if message.likeCount && message.likeCount > 0}
    <span>{message.likeCount}</span>
  {/if}
</button>
```

### 7.2 좋아요 아바타 스택

```svelte
{#if likedByUids.length > 0}
  <LikedUsersAvatarStack likedByUids={likedByUids} onClick={handleOpenLikesModal} />
{/if}
```

### 7.3 좋아요 사용자 로드

```typescript
$effect(() => {
  const likeCount = message.likeCount;
  if (likeCount && likeCount > 0) {
    void loadLikedUsers();
  } else {
    likedByUids = [];
  }
});

async function loadLikedUsers() {
  try {
    const uids = await fetchLikedByUsers(postId, 'post');
    likedByUids = uids;
  } catch (error) {
    console.error('좋아요 사용자 로드 실패:', error);
    likedByUids = [];
  }
}
```

## 8. 댓글 기능

### 8.1 댓글 버튼

```svelte
<button
  class="action-button"
  onclick={(e) => {
    e.stopPropagation();
    onOpenCommentDialog(postId);
  }}
>
  <!-- 말풍선 아이콘 -->
  <svg>
    <path d="M8 12h.01M12 12h.01..." />
  </svg>

  <span>{m.commonComment()} {message.totalChildCount || 0}</span>
</button>
```

### 8.2 댓글 목록

```svelte
<PostCommentList
  bind:this={commentListRef}
  messageId={postId}
  totalChildCount={message.totalChildCount || 0}
  {onOpenCommentDialog}
  {userLikes}
/>
```

### 8.3 댓글 새로고침

```typescript
export async function refreshComments() {
  await commentListRef?.refresh();
}
```

## 9. 수정/삭제 기능

### 9.1 본인 게시글 확인

```typescript
const isMyPost = $derived(authStore.user?.uid === message.authorUid);
```

### 9.2 수정 버튼 (2가지 모드)

**dialog 모드** (게시판):
```typescript
function handleEditClick(e: MouseEvent) {
  e.stopPropagation();

  if (editMode === 'navigate') {
    // 채팅방으로 이동
    goto(`/chat/room?roomId=${message.roomId}`);
  } else {
    // 수정 모달 열기
    if (onEdit) {
      onEdit(postId, message.text, message.urls, message.roomId);
    }
  }
}
```

### 9.3 삭제 버튼

```typescript
function handleDeleteClick(e: MouseEvent) {
  e.stopPropagation();
  onDelete(postId);
}
```

### 9.4 액션 버튼 UI

```svelte
{#if isMyPost}
  <div class="post-actions-right">
    <!-- 수정 아이콘 버튼 -->
    <button class="action-icon-button" onclick={handleEditClick}>
      <PencilIcon />
    </button>

    <!-- 삭제 아이콘 버튼 -->
    <button class="action-icon-button action-icon-button-danger" onclick={handleDeleteClick}>
      <TrashIcon />
    </button>
  </div>
{/if}
```

## 10. 삭제된 게시글 표시

### 10.1 삭제 상태 확인

```svelte
{#if message.deleted}
  <div class="post-card post-deleted">
    <p class="post-deleted-text">{m.postDeletedMessage()}</p>
  </div>
{:else}
  <!-- 정상 게시글 표시 -->
{/if}
```

### 10.2 삭제 스타일

```css
.post-deleted {
  @apply cursor-default bg-gray-50;
}

.post-deleted-text {
  @apply py-2 text-center text-gray-400 italic;
}
```

## 11. 날짜 및 i18n

### 11.1 date-fns 로케일

```typescript
import { ko, enUS, ja, zhCN } from 'date-fns/locale';
import { getLocale } from '$lib/paraglide/runtime.js';

const getDateLocale = () => {
  switch (getLocale()) {
    case 'ko': return ko;
    case 'ja': return ja;
    case 'zh': return zhCN;
    default: return enUS;
  }
};
```

### 11.2 상대 시간 표시

```svelte
{formatDistanceToNow(new Date(message.createdAt), {
  addSuffix: true,
  locale: getDateLocale()
})}
```

## 12. 스타일링

### 12.1 카드 스타일

```css
.post-card {
  /* 모바일: 테두리 없음, padding만 */
  @apply bg-white p-4;
  /* 데스크톱: 카드 스타일 */
  @apply md:rounded-lg md:border md:border-gray-200 md:shadow-sm;
  @apply md:transition-all md:hover:shadow-md;
}
```

### 12.2 액션 버튼 스타일

```css
.action-button {
  @apply flex items-center gap-1 rounded-lg px-3 py-1.5 text-sm text-gray-600;
  @apply transition-colors hover:bg-gray-100 disabled:cursor-not-allowed disabled:opacity-60;
}

.action-button.liked {
  @apply bg-rose-50 text-rose-600;
}
```

## 13. 사용 예제

### 13.1 게시판 페이지에서 사용

```svelte
<script lang="ts">
  import PostItem from '$lib/components/post/PostItem.svelte';

  let posts = $state<any[]>([]);
  let userLikes = $state<Record<string, LikeTargetType>>({});

  function handleToggleLike(event: MouseEvent, postId: string, type: LikeTargetType) {
    // 좋아요 토글 로직
  }

  function handleOpenCommentDialog(postId: string) {
    // 댓글 작성 모달 열기
  }

  function handleEditPost(postId: string, text: string, urls: Record<number, string>, roomId: string) {
    // 수정 모달 열기
  }

  function handleDeletePost(postId: string) {
    // 삭제 확인 모달 열기
  }
</script>

{#each posts as post}
  <PostItem
    message={post}
    postId={post.id}
    {userLikes}
    onToggleLike={handleToggleLike}
    onOpenCommentDialog={handleOpenCommentDialog}
    onEdit={handleEditPost}
    onDelete={handleDeletePost}
    editMode="dialog"
  />
{/each}
```

### 13.2 홈 화면에서 사용

```svelte
<script lang="ts">
  import PostItem from '$lib/components/post/PostItem.svelte';

  // editMode="navigate" 사용 (채팅방으로 이동)
</script>

{#each feedPosts as post}
  <PostItem
    message={post}
    postId={post.id}
    {userLikes}
    onToggleLike={handleToggleLike}
    onOpenCommentDialog={handleOpenCommentDialog}
    onDelete={handleDeletePost}
    editMode="navigate"
  />
{/each}
```

## 14. 의존성

### 14.1 컴포넌트 의존성

- `$lib/components/UserProfile.svelte` - 작성자 프로필
- `$lib/components/friend/follow-button.svelte` - 팔로우 버튼
- `$lib/components/FileAttachments.svelte` - 첨부파일 표시
- `$lib/components/post/PostCommentList.svelte` - 댓글 목록
- `$lib/components/LikedUsersAvatarStack.svelte` - 좋아요 아바타 스택
- `$lib/components/LikedUsersModal.svelte` - 좋아요 사용자 모달

### 14.2 함수 의존성

- `$lib/functions/chat.functions` - `getChatRoomName()` 채팅방 이름 가져오기
- `$lib/functions/like.functions` - `fetchLikedByUsers()` 좋아요 사용자 목록

### 14.3 외부 라이브러리

- `date-fns` - 날짜 포맷팅
- `date-fns/locale` - 다국어 로케일

## 15. 테스트 시나리오

### 15.1 기본 기능 테스트

- [ ] 게시글이 정상적으로 표시되는지 확인
- [ ] 작성자 프로필이 정상 표시되는지 확인
- [ ] 팔로우 버튼이 본인 게시글에서 숨겨지는지 확인
- [ ] 카테고리 뱃지가 정상 표시되는지 확인
- [ ] 채팅방 링크가 정상 동작하는지 확인
- [ ] 첨부파일이 정상 표시되는지 확인
- [ ] 좋아요 버튼 클릭 시 토글되는지 확인
- [ ] 댓글 버튼 클릭 시 모달이 열리는지 확인
- [ ] 수정 버튼 클릭 시 정상 동작하는지 확인 (dialog/navigate 모드)
- [ ] 삭제 버튼 클릭 시 삭제 핸들러가 호출되는지 확인

### 15.2 삭제 상태 테스트

- [ ] 삭제된 게시글이 "삭제된 게시글입니다" 메시지로 표시되는지 확인
- [ ] 삭제된 게시글에서 수정/삭제 버튼이 숨겨지는지 확인

### 15.3 반응형 테스트

- [ ] 모바일에서 카드가 테두리 없이 표시되는지 확인
- [ ] 데스크톱에서 카드가 둥근 모서리와 그림자로 표시되는지 확인
- [ ] 호버 시 그림자가 증가하는지 확인

## 16. 관련 파일

### 16.1 연관 컴포넌트

- `src/lib/components/FileAttachments.svelte` - 첨부파일 표시
- `src/lib/components/post/PostCommentList.svelte` - 댓글 목록
- `src/lib/components/UserProfile.svelte` - 작성자 프로필
- `src/lib/components/friend/follow-button.svelte` - 팔로우 버튼

### 16.2 관련 스펙 문서

- `specs/sonub-component-file-attachments.md` - FileAttachments 상세 스펙
- `specs/sonub-functions-like-functions.md` - 좋아요 함수 스펙
- `specs/sonub-design-guideline.md` - 디자인 가이드라인
- `specs/sonub-forum-overview.md` - 게시판 개요 스펙
