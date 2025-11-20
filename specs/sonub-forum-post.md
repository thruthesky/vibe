---
name: sonub-forum-post
title: 게시판 글 목록 UI 구조
version: 1.5.0
description: 게시판 글 목록 페이지의 HTML layout 구조 및 스타일링 사양 (Facebook 스타일 타일 레이아웃, 모바일 최적화)
author: JaeHo Song
email: thruthesky@gmail.com
homepage: https://github.com/thruthesky/
license: GPL-3.0
updated: 2025-01-18
dependencies:
  - sonub-forum-overview.md
  - sonub-firebase-database-list-view.md
  - sonub-firebase-storage.md
  - sonub-user-avatar.md
tags:
  - forum
  - post
  - layout
  - ui
  - html-structure
  - responsive
  - mobile-optimization
  - facebook-layout
---

## 1. 개요

본 문서는 Sonub 게시판의 글 목록 페이지 UI 구조를 상세히 정의합니다.

**적용 페이지:**
- 홈페이지: `src/routes/+page.svelte` (최근 게시글 목록)
- 게시판 목록: `src/routes/post/list/+page.svelte` (카테고리별 게시글 목록)

**주요 컴포넌트:**
- `DatabaseListView`: 무한 스크롤 게시글 목록
- `UserProfile`: 작성자 프로필 사진 + 이름
- `FileAttachments`: 첨부 파일 미리보기 (v1.5.0: Facebook 스타일 타일 레이아웃)
- `PostCommentList`: 댓글 목록
- `PostCreateDialog`: 글쓰기 모달
- `CommentCreateDialog`: 댓글 작성 모달

**v1.5.0 주요 변경사항:**
- **Facebook 스타일 타일 레이아웃:** 첨부 파일을 1개는 100% 너비, 2개 이상은 그리드로 표시
- **모바일 Edge-to-edge 레이아웃:** 좌/우 여백 제거로 전체 너비 활용
- **모바일 카드 테두리 제거:** 깔끔한 화면 구성
- **반응형 디자인 강화:** 모바일(<768px)과 데스크톱(≥768px) 최적화

## 2. 전체 페이지 구조

### 2.1. HTML Layout 계층 구조

**소스 코드 위치**: [post.functions.ts.md](./repository/src/lib/functions/post.functions.ts.md)

```
.post-list-container (컨테이너)
├── .compose-prompt (가짜 글쓰기 폼 - 최상단)
│   ├── Avatar or .default-avatar (프로필 사진 또는 기본 아이콘)
│   ├── .compose-input-fake (플레이스홀더 텍스트)
│   └── .compose-actions (카메라 아이콘)
│
├── .category-tabs (카테고리 탭 - 가로 스크롤)
│   ├── button.category-chip.cursor-pointer (전체)
│   ├── button.category-chip.cursor-pointer (자유토론)
│   ├── button.category-chip.cursor-pointer (질문)
│   └── ... (기타 카테고리)
│
└── .post-list-content (게시글 목록)
    └── DatabaseListView
        └── .post-card-wrapper (게시글 래퍼)
            ├── .post-card (게시글 카드)
            │   ├── .post-header (상단 메타 영역)
            │   │   ├── UserProfile (작성자 프로필, 왼쪽)
            │   │   └── .post-header-right (오른쪽)
            │   │       ├── span.post-category-badge (카테고리)
            │   │       ├── span.post-room-name (채팅방 이름, 최대 8글자)
            │   │       └── span.post-time (작성 시간)
            │   │
            │   ├── .post-content (게시글 내용)
            │   │   ├── p.post-text (텍스트, 3줄 말줄임)
            │   │   └── FileAttachments (첨부 파일)
            │   │
            │   └── .post-actions (하단 액션 바)
            │       ├── .post-actions-left (왼쪽)
            │       │   ├── button.action-button (좋아요)
            │       │   └── button.action-button (댓글)
            │       └── .post-actions-right (오른쪽, 작성자만)
            │           ├── button.action-icon-button (수정 아이콘)
            │           └── button.action-icon-button-danger (삭제 아이콘)
            │
            └── PostCommentList (댓글 목록)
```

## 3. 게시글 카드 (post-card) 상세 구조

### 3.1. HTML 구조

**소스 코드 위치**: [PostItem.svelte](/Users/thruthesky/apps/sonub/src/lib/components/post/PostItem.svelte)

```html
<div class="post-card-wrapper">
  <!-- 게시글 카드 -->
  <div class="post-card">
    <!-- 1. 상단 메타 영역 -->
    <div class="post-header">
      <!-- 왼쪽: 작성자 프로필 + 팔로우 버튼 -->
      <div class="post-header-left">
        <UserProfile uid={message.authorUid} photoSize="h-8 w-8" textSize="text-sm" />
        {#if !isMyPost}
          <div class="ml-2">
            <FollowButton targetUid={message.authorUid} />
          </div>
        {/if}
      </div>

      <!-- 오른쪽: 카테고리 + 채팅방 이름 + 시간 -->
      <div class="post-header-right">
        {#if message.category}
          <span class="post-category-badge">{getCategoryMessage(message.category)}</span>
        {/if}
        {#if rtdb && message.roomId !== 'post'}
          {#await getChatRoomName(rtdb, message.roomId)}
            <button class="post-room-name" disabled>...</button>
          {:then roomName}
            <button class="post-room-name" onclick={(e) => { e.stopPropagation(); goto(`/chat/room?roomId=${message.roomId}`); }}>
              {roomName}
            </button>
          {:catch}
            <button class="post-room-name" disabled>({m.chatRoomLabel()})</button>
          {/await}
        {/if}
        <span class="post-time">4분 전</span>
      </div>
    </div>

    <!-- 2. 게시글 내용 -->
    <div class="post-content">
      <!-- 2-1. 텍스트 (3줄 말줄임) -->
      <p class="post-text">
        정말 피곤하네요. 별거 아닌 것 가지고...
      </p>

      <!-- 2-2. 첨부 파일 미리보기 -->
      {#if message.urls}
        <FileAttachments urls={message.urls} />
      {/if}
    </div>

    <!-- 3. 하단 액션 바 -->
    <div class="post-actions">
      <!-- 왼쪽: 좋아요, 댓글 -->
      <div class="post-actions-left">
        <!-- 좋아요 버튼 -->
        <button class="action-button" onclick={handleLike}>
          <svg class="h-5 w-5" ...><!-- Heart icon --></svg>
          <span>좋아요</span>
        </button>

        <!-- 댓글 버튼 -->
        <button class="action-button" onclick={handleComment}>
          <svg class="h-5 w-5" ...><!-- Comment icon --></svg>
          <span>댓글 {message.totalChildCount || 0}</span>
        </button>
      </div>

      <!-- 오른쪽: 수정, 삭제 (작성자만 표시) -->
      {#if isMyPost}
        <div class="post-actions-right">
          <!-- 수정 아이콘 버튼 -->
          <button class="action-icon-button" onclick={handleEdit} aria-label="수정">
            <svg class="h-5 w-5" ...><!-- Edit icon --></svg>
          </button>

          <!-- 삭제 아이콘 버튼 -->
          <button class="action-icon-button action-icon-button-danger" onclick={handleDelete} aria-label="삭제">
            <svg class="h-5 w-5" ...><!-- Trash icon --></svg>
          </button>
        </div>
      {/if}
    </div>
  </div>

  <!-- 댓글 목록 컴포넌트 -->
  <PostCommentList
    messageId={messageId}
    totalChildCount={message.totalChildCount || 0}
    onOpenCommentDialog={handleOpenCommentDialog}
  />
</div>
```

### 3.2. 삭제된 게시글 표시

**소스 코드 위치**: [post.functions.ts.md](./repository/src/lib/functions/post.functions.ts.md)

```html
<!-- 삭제된 게시글 -->
{#if message.deleted}
  <div class="post-card post-deleted">
    <p class="post-deleted-text">삭제된 글입니다.</p>
  </div>
{/if}
```

## 4. 컴포넌트별 상세 설명

### 4.1. UserProfile 컴포넌트

**소스 코드 위치:** `src/lib/components/UserProfile.svelte`

**기능:**
- 사용자 UID를 받아서 프로필 사진 + 이름을 표시
- RTDB에서 실시간으로 사용자 정보 로드
- 프로필 사진이 없으면 이름의 첫 글자를 원형 배경에 표시

**Props:**
- `uid: string` - 사용자 UID (필수)
- `photoSize?: string` - 프로필 사진 크기 (기본값: "h-8 w-8")
- `textSize?: string` - 텍스트 크기 (기본값: "text-sm")

**사용 예시:**

**소스 코드 위치**: [PostItem.svelte](/Users/thruthesky/apps/sonub/src/lib/components/post/PostItem.svelte)

```svelte
<UserProfile
  uid={message.authorUid}
  photoSize="h-8 w-8"
  textSize="text-sm"
/>
```

**렌더링 결과:**

**소스 코드 위치**: [post.functions.ts.md](./repository/src/lib/functions/post.functions.ts.md)

```html
<div class="flex items-center gap-2">
  <!-- 프로필 사진 -->
  <img
    src="https://firebasestorage.googleapis.com/.../photo.jpg"
    alt="사용자 이름"
    class="rounded-full object-cover h-8 w-8"
  />
  <!-- 사용자 이름 -->
  <span class="font-medium text-gray-700 text-sm">
    사용자 이름
  </span>
</div>
```

**프로필 사진이 없는 경우:**

**소스 코드 위치**: [post.functions.ts.md](./repository/src/lib/functions/post.functions.ts.md)

```html
<div class="flex items-center gap-2">
  <!-- 첫 글자 표시 -->
  <div class="flex items-center justify-center rounded-full bg-gray-300 text-xs font-semibold text-white h-8 w-8">
    <span>A</span>
  </div>
  <!-- 사용자 이름 -->
  <span class="font-medium text-gray-700 text-sm">
    apple
  </span>
</div>
```

### 4.2. FileAttachments 컴포넌트

**소스 코드 위치:** `src/lib/components/FileAttachments.svelte`

**기능:**
- Firebase Storage URL 목록을 받아서 첨부 파일 미리보기 표시
- 이미지: 썸네일 표시 + 클릭 시 모달 확대
- 비디오: 재생 컨트롤러 포함
- 기타 파일: 확장자 표시 + 클릭 시 다운로드
- **Facebook 스타일 타일 레이아웃** 지원 (v1.4.0+)

**Props:**
- `urls: Record<number, string>` - 첨부 파일 URL 목록 (필수)
- `maxDisplay?: number` - 최대 표시 개수 (기본값: 30)
- `thumbnailSize?: string` - 썸네일 크기 (기본값: "h-32 w-32")

**사용 예시:**

**소스 코드 위치**: [PostItem.svelte](/Users/thruthesky/apps/sonub/src/lib/components/post/PostItem.svelte)

```svelte
{#if message.urls}
  <FileAttachments urls={message.urls} maxDisplay={5} />
{/if}
```

**레이아웃 규칙 (v1.4.0+):**
- **1개 이미지:** 100% 너비 (1열)
- **2개 이미지:** 50% 너비씩 (2열)
- **3개 이상:** 첫 번째 100% 너비, 나머지 50% 너비씩 (2열 그리드)
- **최소 높이:** 200px (모든 아이템)
- **간격:** 1px (gap-1)

**렌더링 결과:**

**소스 코드 위치**: [post.functions.ts.md](./repository/src/lib/functions/post.functions.ts.md)

```html
<!-- Grid 레이아웃 (Facebook 스타일) -->
<div class="attachment-grid mt-3 grid gap-1 grid-cols-2">
  <!-- 첫 번째 이미지: 2칸 차지 (100% 너비) -->
  <button type="button" onclick={openModal} class="attachment-item col-span-2">
    <img src="..." alt="첨부 이미지" class="attachment-image" />
  </button>

  <!-- 두 번째 이미지: 1칸 차지 (50% 너비) -->
  <button type="button" onclick={openModal} class="attachment-item col-span-1">
    <img src="..." alt="첨부 이미지" class="attachment-image" />
  </button>

  <!-- 세 번째 이미지: 1칸 차지 (50% 너비) -->
  <button type="button" onclick={openModal} class="attachment-item col-span-1">
    <img src="..." alt="첨부 이미지" class="attachment-image" />
  </button>

  <!-- 비디오 파일 -->
  <div class="attachment-item col-span-1">
    <video src="..." class="attachment-video" controls preload="metadata">
      <track kind="captions" />
    </video>
  </div>

  <!-- 기타 파일 (PDF, TXT 등) -->
  <button type="button" onclick={downloadFile} class="attachment-item attachment-file col-span-1">
    <svg class="h-8 w-8 text-gray-400"><!-- 파일 아이콘 --></svg>
    <span class="text-xs font-semibold text-gray-600">PDF</span>
  </button>

  <!-- 남은 파일 개수 -->
  <div class="attachment-item attachment-more col-span-1">
    <span class="text-lg font-semibold text-gray-600">+5</span>
  </div>
</div>
```

**CSS 스타일 (v1.4.0+):**

**소스 코드 위치**: [post.functions.ts.md](./repository/src/lib/functions/post.functions.ts.md)

```css
/* 그리드 컨테이너 */
.attachment-grid {
  @apply w-full;
}

/* 각 첨부 파일 아이템 */
.attachment-item {
  @apply relative overflow-hidden rounded-lg;
  @apply min-h-[200px];
  @apply transition-transform hover:scale-[1.02];
  @apply cursor-pointer;
}

/* 이미지 스타일 */
.attachment-image {
  @apply h-full w-full object-cover;
}

/* 비디오 스타일 */
.attachment-video {
  @apply h-full w-full object-cover;
}

/* 파일 아이템 스타일 */
.attachment-file {
  @apply flex flex-col items-center justify-center gap-2;
  @apply bg-gray-100;
  @apply hover:bg-gray-200;
}

/* 남은 파일 개수 표시 (+N) */
.attachment-more {
  @apply flex items-center justify-center;
  @apply bg-gray-200 text-gray-700;
  @apply hover:bg-gray-300;
}
```

**자세한 내용:** [sonub-firebase-storage.md § 5.2](./sonub-firebase-storage.md)

### 4.3. PostCommentList 컴포넌트

**소스 코드 위치:** `src/lib/components/post/PostCommentList.svelte`

**기능:**
- 게시글의 댓글 목록 표시
- 마지막 3개 댓글 자동 미리보기
- 더보기 버튼으로 전체 댓글 로드
- 댓글 계층 구조 표시 (들여쓰기)
- 답글 기능

**Props:**
- `messageId: string` - 게시글(채팅 메시지) ID (필수)
- `totalChildCount?: number` - 총 댓글 개수 (기본값: 0)
- `onOpenCommentDialog: Function` - 댓글 작성 모달 열기 콜백 (필수)

**사용 예시:**

**소스 코드 위치**: [PostItem.svelte](/Users/thruthesky/apps/sonub/src/lib/components/post/PostItem.svelte)

```svelte
<PostCommentList
  bind:this={commentListRef}
  messageId={postId}
  totalChildCount={message.totalChildCount || 0}
  {onOpenCommentDialog}
  {userLikes}
/>
```

**렌더링 결과:**

**소스 코드 위치**: [post.functions.ts.md](./repository/src/lib/functions/post.functions.ts.md)

```html
<!-- 댓글 정보 및 버튼 -->
<div class="post-actions">
  <div class="comment-info">
    <span class="comment-count">💬 5개의 댓글이 있습니다.</span>
    <Button variant="link" size="sm">더보기...</Button>
  </div>
  <Button variant="ghost" size="sm">💬 댓글 쓰기</Button>
</div>

<!-- 댓글 목록 -->
<div class="comments-list">
  <!-- 댓글 항목 -->
  <div class="comment-item" style="margin-left: 0px;">
    <div class="comment-content">
      <!-- 댓글 헤더 (작성자 + 시간) -->
      <div class="comment-header">
        <UserProfile uid="..." photoSize="h-6 w-6" textSize="text-xs" />
        <span class="comment-time">10분 전</span>
      </div>
      <!-- 댓글 텍스트 -->
      <p class="comment-text">댓글 내용입니다.</p>
      <!-- 댓글 첨부 파일 -->
      {#if comment.urls}
        <FileAttachments urls={comment.urls} thumbnailSize="h-32 w-32" />
      {/if}
      <!-- 버튼 그룹 -->
      <div class="comment-actions">
        <Button variant="ghost" size="sm">답글</Button>
        <Button variant="ghost" size="sm">수정</Button>
        <Button variant="ghost" size="sm">삭제</Button>
      </div>
    </div>
  </div>

  <!-- 답글 (들여쓰기) -->
  <div class="comment-item" style="margin-left: 24px;">
    <!-- 답글 내용 -->
  </div>
</div>
```

## 5. Tailwind CSS 스타일링 규칙

### 5.1. 컨테이너 및 레이아웃

**소스 코드 위치**: [post.functions.ts.md](./repository/src/lib/functions/post.functions.ts.md)

```css
/* 페이지 컨테이너 */
.post-list-container {
  @apply mx-auto max-w-4xl p-4;
}

/* 헤더 */
.post-list-header {
  @apply mb-6 flex items-center justify-between;
}

/* 제목 */
.post-list-title {
  @apply text-2xl font-bold text-gray-900;
}

/* 카테고리 탭 */
.category-tabs {
  @apply mb-6 flex flex-wrap gap-2;
}

/* 카테고리 칩 */
.category-chip {
  @apply rounded-full border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700;
  @apply transition-all hover:border-blue-600 hover:bg-blue-600/5;
}

/* 활성 카테고리 칩 */
.category-chip.active {
  @apply border-blue-600 bg-blue-600 text-white;
  @apply hover:bg-blue-600/90;
}

/* 게시글 목록 */
.post-list-content {
  @apply space-y-4;
}
```

### 5.2. 게시글 카드

**소스 코드 위치**: [post.functions.ts.md](./repository/src/lib/functions/post.functions.ts.md)

```css
/* 게시글 카드 래퍼 */
.post-card-wrapper {
  @apply mb-4;
}

/* 게시글 카드 (v1.4.0+: 모바일 반응형 스타일 적용) */
.post-card {
  /* 모바일: 테두리 없음, padding만 */
  @apply bg-white p-4;
  /* 데스크톱: 카드 스타일 (테두리, 그림자, 둥근 모서리) */
  @apply md:rounded-lg md:border md:border-gray-200 md:shadow-sm;
  @apply md:transition-all md:hover:shadow-md;
}

/* 삭제된 게시글 */
.post-deleted {
  @apply cursor-default bg-gray-50;
}

.post-deleted-text {
  @apply py-2 text-center italic text-gray-400;
}

/* 상단 메타 영역 */
.post-header {
  @apply mb-3 flex items-center justify-between;
}

.post-header-right {
  @apply flex items-center gap-2;
}

/* 카테고리 뱃지 */
.post-category-badge {
  @apply inline-block rounded-full bg-blue-100 px-2 py-0.5 text-xs font-semibold text-blue-800;
}

/* 채팅방 이름 (최대 8글자, 초과 시 ellipsis) */
.post-room-name {
  @apply text-xs text-gray-500;
}

/* 작성 시간 */
.post-time {
  @apply text-xs text-gray-400;
}

/* 게시글 내용 */
.post-content {
  @apply mb-3;
}

/* 게시글 텍스트 (3줄 말줄임) */
.post-text {
  @apply mb-2 text-gray-800;
  display: -webkit-box;
  -webkit-line-clamp: 3;
  -webkit-box-orient: vertical;
  overflow: hidden;
  text-overflow: ellipsis;
}

/* 하단 액션 바 */
.post-actions {
  @apply mt-3 flex items-center justify-between border-t border-gray-100 pt-3;
}

.post-actions-left {
  @apply flex items-center gap-2;
}

.post-actions-right {
  @apply flex items-center gap-2;
}

/* 액션 버튼 (텍스트 포함: 좋아요, 댓글) */
.action-button {
  @apply flex items-center gap-1 rounded-lg px-3 py-1.5 text-sm text-gray-600;
  @apply transition-colors hover:bg-gray-100;
}

/* 아이콘 전용 버튼 (수정, 삭제) */
.action-icon-button {
  @apply flex items-center justify-center rounded-lg p-2 text-gray-600;
  @apply transition-colors hover:bg-gray-100;
}

/* 위험한 액션 버튼 (삭제) */
.action-icon-button-danger {
  @apply text-red-600 hover:bg-red-50;
}
```

### 5.3. 댓글 목록

**소스 코드 위치**: [post.functions.ts.md](./repository/src/lib/functions/post.functions.ts.md)

```css
/* 댓글 정보 및 버튼 */
.post-actions {
  @apply mt-2 flex items-center justify-between border-t border-gray-100 pt-2;
}

/* 댓글 정보 */
.comment-info {
  @apply flex items-center gap-2;
}

/* 댓글 개수 */
.comment-count {
  @apply text-sm text-gray-700;
}

.comment-count-empty {
  @apply text-sm text-gray-400;
}

/* 댓글 목록 */
.comments-list {
  @apply mt-3 space-y-2 border-t border-gray-100 pt-3;
}

/* 댓글 항목 */
.comment-item {
  @apply rounded-lg bg-gray-50 p-3;
}

/* 삭제된 댓글 */
.comment-deleted {
  @apply py-2;
}

.comment-deleted-text {
  @apply text-gray-400 italic;
}

/* 댓글 내용 */
.comment-content {
  @apply space-y-2;
}

/* 댓글 헤더 */
.comment-header {
  @apply flex items-center justify-between;
}

/* 댓글 시간 */
.comment-time {
  @apply text-xs text-gray-400;
}

/* 댓글 텍스트 */
.comment-text {
  @apply text-sm text-gray-800;
}

/* 댓글 버튼 */
.comment-actions {
  @apply mt-2 flex gap-1;
}
```

### 5.4. 로딩 상태

**소스 코드 위치**: [post.functions.ts.md](./repository/src/lib/functions/post.functions.ts.md)

```css
/* 로딩 상태 */
.list-status {
  @apply py-8 text-center text-gray-500;
}
```

## 6. 반응형 디자인

### 6.1. 모바일 최적화 (v1.4.0 업데이트)

**모바일 화면 (<768px):**
- **Edge-to-edge 레이아웃:** 좌/우 여백 제거
- **카드 테두리 제거:** 깔끔한 화면 구성
- **컨테이너 padding 제거:** 전체 너비 활용

**데스크톱 화면 (≥768px):**
- **컨테이너 padding 유지:** 좌/우 여백 적용
- **카드 테두리/그림자 표시:** 카드 강조

**소스 코드 위치**: [post.functions.ts.md](./repository/src/lib/functions/post.functions.ts.md)

```css
/* 페이지 컨테이너 (v1.4.0+) */
.post-list-container {
  /* 모바일: padding 없음 (edge-to-edge) */
  @apply mx-auto max-w-4xl;
  /* 데스크톱: padding 적용 */
  @apply md:p-4;
}

/* 게시글 카드 (v1.4.0+) */
.post-card {
  /* 모바일: 테두리 없음, padding만 */
  @apply bg-white p-4;
  /* 데스크톱: 카드 스타일 (테두리, 그림자, 둥근 모서리) */
  @apply md:rounded-lg md:border md:border-gray-200 md:shadow-sm;
  @apply md:transition-all md:hover:shadow-md;
}

/* 게시글 텍스트 */
.post-text {
  @apply mb-2 text-gray-800;
  display: -webkit-box;
  -webkit-line-clamp: 3; /* 데스크톱: 3줄 */
  -webkit-box-orient: vertical;
  overflow: hidden;
  text-overflow: ellipsis;
}

/* 모바일: 텍스트 2줄로 축소 (선택적) */
@media (max-width: 640px) {
  .post-text {
    -webkit-line-clamp: 2; /* 모바일: 2줄 */
  }
}
```

**레이아웃 구조 업데이트 (v1.4.0+):**

**소스 코드 위치**: [post.functions.ts.md](./repository/src/lib/functions/post.functions.ts.md)

```svelte
<!-- src/routes/+layout.svelte -->
<div class="container mx-auto md:px-4 py-8" class:p-0={isChatRoom}>
  <!-- 모바일: px-4 없음 (edge-to-edge) -->
  <!-- 데스크톱: md:px-4 적용 -->
</div>

<!-- src/routes/+page.svelte -->
<div class="post-list-container">
  <!-- 모바일: p-4 없음 -->
  <!-- 데스크톱: md:p-4 적용 -->
</div>
```

## 7. 상호작용 (Interaction)

### 7.1. 채팅방 이름 표시

**중요:** 게시글 카드에서 채팅방으로 직접 이동하는 기능이 제거되었습니다. 대신 상단 오른쪽에 채팅방 이름을 표시하여 어느 채팅방의 게시글인지 알 수 있습니다.

**채팅방 이름 가져오기 함수:**

**소스 코드 위치**: [post.functions.ts.md](./repository/src/lib/functions/post.functions.ts.md)

```typescript
// src/lib/functions/chat.functions.ts
export async function getChatRoomName(
  db: Database,
  roomId: string,
  maxLength: number = 8
): Promise<string> {
  try {
    // /chat-rooms/{roomId}/name 필드만 읽기 (비용 최적화)
    const nameRef = ref(db, `chat-rooms/${roomId}/name`);
    const snapshot = await get(nameRef);

    if (!snapshot.exists()) {
      return '(채팅방)'; // 기본값
    }

    const name = snapshot.val() as string;

    // 최대 길이 초과 시 ellipsis 처리
    if (name.length > maxLength) {
      return name.substring(0, maxLength) + '...';
    }

    return name;
  } catch (error) {
    console.error('채팅방 이름 가져오기 실패:', error);
    return '(채팅방)'; // 에러 시 기본값
  }
}
```

**사용 예시:**

**소스 코드 위치**: [post.functions.ts.md](./repository/src/lib/functions/post.functions.ts.md)

```html
<!-- 오른쪽: 카테고리 + 채팅방 이름 + 시간 -->
<div class="post-header-right">
  {#if message.category}
    <span class="post-category-badge">자유토론</span>
  {/if}
  {#if rtdb}
    {#await getChatRoomName(rtdb, message.roomId)}
      <span class="post-room-name">...</span>
    {:then roomName}
      <span class="post-room-name">{roomName}</span>
    {:catch}
      <span class="post-room-name">(채팅방)</span>
    {/await}
  {/if}
  <span class="post-time">4분 전</span>
</div>
```

**핵심 특징:**

1. **비용 최적화:** 전체 채팅방 객체를 읽지 않고 `/chat-rooms/{roomId}/name` 필드만 읽습니다.
2. **최대 길이 제한:** 채팅방 이름이 8글자를 초과하면 자동으로 ellipsis(`...`)를 추가합니다.
3. **에러 처리:** 채팅방 이름을 가져올 수 없는 경우 `(채팅방)`을 표시합니다.
4. **로딩 상태:** 채팅방 이름을 로딩하는 동안 `...`를 표시합니다.

### 7.2. 액션 버튼 (좋아요, 댓글)

**소스 코드 위치**: [post.functions.ts.md](./repository/src/lib/functions/post.functions.ts.md)

```html
<!-- 좋아요 버튼 -->
<button
  class="action-button"
  onclick={(e: MouseEvent) => {
    e.stopPropagation(); // 게시글 클릭 방지
    // TODO: 좋아요 기능 구현
  }}
>
  <svg class="h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
  </svg>
  <span>좋아요</span>
</button>

<!-- 댓글 버튼 -->
<button
  class="action-button"
  onclick={(e: MouseEvent) => {
    e.stopPropagation(); // 게시글 클릭 방지
    handleOpenCommentDialog(messageId);
  }}
>
  <svg class="h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
  </svg>
  <span>댓글 {message.totalChildCount || 0}</span>
</button>
```

### 7.3. 아이콘 버튼 (수정, 삭제)

작성자에게만 표시되며, 아이콘만 사용합니다.

**소스 코드 위치**: [post.functions.ts.md](./repository/src/lib/functions/post.functions.ts.md)

```html
{@const isMyPost = authStore.user?.uid === message.senderUid}

{#if isMyPost}
  <div class="post-actions-right">
    <!-- 수정 아이콘 버튼 -->
    <button
      class="action-icon-button"
      onclick={(e: MouseEvent) => {
        e.stopPropagation(); // 게시글 클릭 방지
        handleOpenEditDialog(messageId, message.text, message.urls, message.roomId);
      }}
      aria-label="수정"
    >
      <svg class="h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
      </svg>
    </button>

    <!-- 삭제 아이콘 버튼 -->
    <button
      class="action-icon-button action-icon-button-danger"
      onclick={(e: MouseEvent) => {
        e.stopPropagation(); // 게시글 클릭 방지
        handleDeletePost(messageId);
      }}
      aria-label="삭제"
    >
      <svg class="h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
      </svg>
    </button>
  </div>
{/if}
```

### 7.4. 게시글 삭제 함수

**소스 코드 위치**: [+page.svelte](/Users/thruthesky/apps/sonub/src/routes/+page.svelte)

```typescript
async function handleDeletePost(postId: string) {
  if (!confirm(m.postDeleteConfirm())) {
    return;
  }

  if (!rtdb) {
    alert(m.firebaseNotReady());
    return;
  }

  try {
    const postRef = ref(rtdb, `posts/${postId}`);
    await update(postRef, {
      text: null,
      urls: null,
      deleted: true,
      deletedAt: Date.now()
    });
  } catch (error) {
    console.error('게시글 삭제 실패:', error);
    alert(m.postDeleteFailed());
  }
}
```

## 8. 데이터 흐름

### 8.1. 게시글 데이터 구조

상세한 데이터베이스 구조는 다음 문서를 참조하세요:
- [게시글 데이터베이스 구조](./sonub-firebase-database-structure.md#게시글-posts)

**정렬 필드 타입별 처리 방식:**

1. **categoryOrder (문자열)**
   - 양수 타임스탬프 사용: `"qna-1700000000000"`
   - Firebase는 문자열을 사전순(lexicographical)으로 정렬
   - 클라이언트에서 `reverse={true}` 옵션으로 역순 정렬하여 최신순 표시
   - 예: `"qna-1234567890"` < `"qna-9999999999"` → 클라이언트에서 reverse로 뒤집기

2. **allCategoryOrder (숫자)**
   - 음수 타임스탬프 사용: `-1700000000000`
   - Firebase는 숫자를 오름차순으로 정렬
   - 더 작은 음수 = 더 최신 = 오름차순 정렬 시 자연스럽게 최신순
   - 예: `-9999999999` < `-1234567890` (최신 글이 먼저)

**클라이언트 역할:**
- ✅ 사용자 입력 데이터만 저장: `text`, `category`, `createdAt`, `urls`
- ❌ **절대 하지 말아야 할 작업:** `categoryOrder`, `allCategoryOrder` 필드를 직접 작성

### 8.3. DatabaseListView Props 및 정렬 로직

**소스 코드 위치**: [post.functions.ts.md](./repository/src/lib/functions/post.functions.ts.md)

```typescript
<DatabaseListView
  path="posts"                   // Firebase RTDB 경로
  pageSize={20}                  // 페이지당 항목 수
  orderBy={orderByField}         // 정렬 기준 필드
  orderPrefix={orderPrefixValue} // 정렬 접두사
  reverse={true}                 // 역순 정렬 (최신 글 먼저)
  threshold={300}                // 무한 스크롤 트리거 거리 (px)
>
```

**orderBy 필드:**
- `allCategoryOrder`: 전체 카테고리 통합 정렬 (홈페이지)
  - 값 형식: 숫자 타임스탬프 (예: `1700000000000`)
  - 용도: 모든 카테고리의 게시글을 최신순으로 정렬
- `categoryOrder`: 카테고리별 정렬 (게시판 목록)
  - 값 형식: `"{category}-{timestamp}"` (예: `"qna-1700000000000"`)
  - 용도: 특정 카테고리 내의 게시글만 최신순으로 정렬

**orderPrefix 값:**
- 전체 카테고리: `""` (빈 문자열)
- 특정 카테고리: `"qna-"`, `"free-"`, `"discussion-"` 등
- 동작 원리: Firebase 쿼리에서 해당 prefix로 시작하는 항목만 필터링

**클라이언트 측 정렬 로직:**

DatabaseListView는 Firebase에서 데이터를 받은 후 클라이언트 측에서 명시적으로 정렬합니다. 이는 Firebase의 `limitToLast` + `reverse()` 조합이 페이지네이션 커서 로직을 깨뜨리는 문제를 해결합니다.

**소스 코드 위치**: [post.functions.ts.md](./repository/src/lib/functions/post.functions.ts.md)

```typescript
// DatabaseListView 내부 정렬 로직
loadedItems.sort((a, b) => {
  const aValue = a.data[orderBy] ?? 0;
  const bValue = b.data[orderBy] ?? 0;

  if (reverse) {
    return bValue - aValue; // 내림차순 (최신 글 먼저)
  } else {
    return aValue - bValue; // 오름차순
  }
});
```

**정렬 원리:**
1. Firebase 쿼리: `orderByChild(orderBy)` + `limitToLast(pageSize)`로 데이터 가져오기
2. orderPrefix가 있으면 해당 prefix로 시작하는 항목만 필터링
3. 클라이언트에서 `Array.sort()`로 명시적 정렬 (orderBy 필드 값 기준)
4. reverse=true일 경우 내림차순 정렬 (최신 글이 맨 위로)

**장점:**
- 페이지네이션 커서 로직이 정확하게 작동
- Firebase 쿼리 순서와 무관하게 일관된 정렬 보장
- 카테고리 필터링과 시간 정렬을 동시에 수행 가능

## 9. 성능 최적화

### 9.1. Firebase Database 인덱스

게시글 정렬 성능을 최적화하기 위해 다음 필드에 인덱스를 설정합니다.

**설정된 인덱스:**

**소스 코드 위치**: [post.functions.ts.md](./repository/src/lib/functions/post.functions.ts.md)

```json
{
  "posts": {
    ".indexOn": [
      "createdAt",
      "likeCount",
      "commentCount",
      "category",
      "categoryOrder",      // 카테고리별 정렬용
      "allCategoryOrder"    // 전체 게시글 정렬용
    ]
  }
}
```

**인덱스 효과:**
- `categoryOrder`: 특정 카테고리 내 게시글을 빠르게 정렬
- `allCategoryOrder`: 전체 게시글을 빠르게 정렬
- `category`: 카테고리별 필터링 성능 향상
- `likeCount`, `commentCount`: 인기 게시글 정렬 성능 향상

### 9.2. 무한 스크롤 최적화

- `DatabaseListView`의 `pageSize`를 20으로 설정하여 초기 로딩 속도 향상
- `threshold={300}` 설정으로 스크롤이 하단 300px 전에 다음 페이지 로드

### 9.3. 이미지 지연 로딩

- `FileAttachments` 컴포넌트에서 이미지는 브라우저 기본 lazy loading 사용
- 비디오는 `preload="metadata"` 설정으로 메타데이터만 로드

### 9.3. 컴포넌트 재사용

- `UserProfile`, `FileAttachments`, `PostCommentList`를 재사용 가능한 컴포넌트로 분리
- Props를 통한 커스터마이징으로 다양한 상황에서 사용 가능

## 10. 접근성 (Accessibility)

### 10.1. 시맨틱 HTML

**소스 코드 위치**: [post.functions.ts.md](./repository/src/lib/functions/post.functions.ts.md)

```html
<!-- 제목 -->
<h1 class="post-list-title">최근 게시글</h1>

<!-- 버튼 -->
<button type="button" class="category-chip">전체</button>

<!-- 이미지 alt 속성 -->
<img src="..." alt="첨부 이미지" />

<!-- ARIA 레이블 -->
<button type="button" aria-label="뒤로가기">
  <svg><!-- 뒤로가기 아이콘 --></svg>
</button>
```

### 10.2. 키보드 네비게이션

- 모든 버튼은 `<button>` 태그 사용 (탭 네비게이션 지원)
- 모달은 ESC 키로 닫기 가능

### 10.3. 색상 대비

- 텍스트와 배경의 대비비율 4.5:1 이상 유지
- 중요한 정보는 색상뿐만 아니라 아이콘/텍스트로도 표현

## 11. 구현 예시

### 11.1. 홈페이지 (최근 게시글)

**소스 코드 위치:** `/Users/thruthesky/apps/sonub/src/routes/+page.svelte`

```svelte
<script lang="ts">
  import PostCreateDialog from '$lib/components/post/PostCreateDialog.svelte';
  import PostEditDialog from '$lib/components/post/PostEditDialog.svelte';
  import CommentCreateDialog from '$lib/components/comment/CommentCreateDialog.svelte';
  import FeedList from '$lib/components/friend/feed-list.svelte';
  import PostListView from '$lib/components/post/PostListView.svelte';
  import { toggleLikeTarget, type LikeTargetType } from '$lib/functions/like.functions';

  // 글쓰기 모달 상태
  let isCreateDialogOpen = $state(false);

  // 좋아요 상태
  type UserLikesMap = Record<string, LikeTargetType>;
  let userLikes = $state<UserLikesMap>({});
</script>

<div class="post-list-container">
  <!-- 글쓰기 유도 폼 -->
  <div class="compose-wrapper">
    <div class="compose-prompt" onclick={() => (isCreateDialogOpen = true)}>
      <!-- 아바타 + 가짜 입력창 + 카메라 아이콘 -->
    </div>
  </div>

  <!-- 피드 또는 글 목록 표시 -->
  <div class="post-list-content">
    <FeedList
      pageSize={20}
      {userLikes}
      onToggleLike={handleToggleLike}
      onOpenCommentDialog={handleOpenCommentDialog}
      onEdit={handleEdit}
      onDelete={handleDeletePost}
    >
      {#snippet item(itemData, index)}
        {@const message = itemData.data}
        {@const messageId = itemData.key}
        {@const isMyPost = authStore.user?.uid === message.senderUid}

        <div class="post-card-wrapper">
          <div class="post-card">
            <!-- 1. 상단 메타 영역 -->
            <div class="post-header">
              <!-- 왼쪽: 작성자 프로필 -->
              <UserProfile
                uid={message.senderUid}
                photoSize="h-8 w-8"
                textSize="text-sm"
              />

              <!-- 오른쪽: 카테고리 + 채팅방 이름 + 시간 -->
              <div class="post-header-right">
                {#if message.category}
                  <span class="post-category-badge">
                    {getCategoryMessage(message.category)}
                  </span>
                {/if}
                {#if rtdb}
                  {#await getChatRoomName(rtdb, message.roomId)}
                    <span class="post-room-name">...</span>
                  {:then roomName}
                    <span class="post-room-name">{roomName}</span>
                  {:catch}
                    <span class="post-room-name">(채팅방)</span>
                  {/await}
                {/if}
                <span class="post-time">
                  {formatDistanceToNow(new Date(message.createdAt), {
                    addSuffix: true,
                    locale: getDateLocale()
                  })}
                </span>
              </div>
            </div>

            <!-- 2. 게시글 내용 -->
            <div class="post-content">
              <p class="post-text">
                {message.text || '(내용 없음)'}
              </p>

              <!-- 첨부파일 미리보기 -->
              {#if message.urls}
                <FileAttachments urls={message.urls} />
              {/if}
            </div>

            <!-- 3. 하단 액션 바 -->
            <div class="post-actions">
              <!-- 왼쪽: 좋아요, 댓글 -->
              <div class="post-actions-left">
                <button
                  class="action-button"
                  onclick={(e: MouseEvent) => {
                    e.stopPropagation();
                    // TODO: 좋아요 기능 구현
                  }}
                >
                  <svg class="h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                  </svg>
                  <span>좋아요</span>
                </button>

                <button
                  class="action-button"
                  onclick={(e: MouseEvent) => {
                    e.stopPropagation();
                    handleOpenCommentDialog(messageId);
                  }}
                >
                  <svg class="h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                  </svg>
                  <span>댓글 {message.totalChildCount || 0}</span>
                </button>
              </div>

              <!-- 오른쪽: 수정, 삭제 (작성자만 표시) -->
              {#if isMyPost}
                <div class="post-actions-right">
                  <button
                    class="action-icon-button"
                    onclick={(e: MouseEvent) => {
                      e.stopPropagation();
                      handleOpenEditDialog(messageId, message.text, message.urls, message.roomId);
                    }}
                    aria-label="수정"
                  >
                    <svg class="h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                    </svg>
                  </button>

                  <button
                    class="action-icon-button action-icon-button-danger"
                    onclick={(e: MouseEvent) => {
                      e.stopPropagation();
                      handleDeletePost(messageId);
                    }}
                    aria-label="삭제"
                  >
                    <svg class="h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                  </button>
                </div>
              {/if}
            </div>
          </div>

          <!-- 댓글 목록 컴포넌트 -->
          <PostCommentList
            bind:this={commentListRefs[messageId]}
            messageId={messageId}
            totalChildCount={message.totalChildCount || 0}
            onOpenCommentDialog={handleOpenCommentDialog}
          />
        </div>
      {/snippet}

      {#snippet loading()}
        <div class="list-status">
          <p>로딩 중...</p>
        </div>
      {/snippet}

      {#snippet empty()}
        <div class="list-status">
          <p>게시글이 없습니다.</p>
        </div>
      {/snippet}

      {#snippet loadingMore()}
        <div class="list-status">
          <p>더 불러오는 중...</p>
        </div>
      {/snippet}

      {#snippet noMore()}
        <div class="list-status">
          <p>모든 게시글을 불러왔습니다.</p>
        </div>
      {/snippet}
    </DatabaseListView>
  </div>
</div>

<style>
  @import 'tailwindcss' reference;

  .post-list-container {
    @apply mx-auto max-w-4xl p-4;
  }

  .post-list-header {
    @apply mb-6 flex items-center justify-between;
  }

  .post-list-title {
    @apply text-2xl font-bold text-gray-900;
  }

  .category-tabs {
    @apply mb-6 flex flex-wrap gap-2;
  }

  .category-chip {
    @apply rounded-full border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700;
    @apply transition-all hover:border-blue-600 hover:bg-blue-600/5;
  }

  .category-chip.active {
    @apply border-blue-600 bg-blue-600 text-white;
    @apply hover:bg-blue-600/90;
  }

  .post-list-content {
    @apply space-y-4;
  }

  .post-card-wrapper {
    @apply mb-4;
  }

  .post-card {
    @apply rounded-lg border border-gray-200 bg-white p-4 shadow-sm;
    @apply transition-all hover:shadow-md;
  }

  .post-header {
    @apply mb-3 flex items-center justify-between;
  }

  .post-header-right {
    @apply flex items-center gap-2;
  }

  .post-category-badge {
    @apply inline-block rounded-full bg-blue-100 px-2 py-0.5 text-xs font-semibold text-blue-800;
  }

  .post-room-name {
    @apply text-xs text-gray-500;
  }

  .post-time {
    @apply text-xs text-gray-400;
  }

  .post-content {
    @apply mb-3;
  }

  .post-text {
    @apply mb-2 text-gray-800;
    display: -webkit-box;
    -webkit-line-clamp: 3;
    -webkit-box-orient: vertical;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  .post-actions {
    @apply mt-3 flex items-center justify-between border-t border-gray-100 pt-3;
  }

  .post-actions-left {
    @apply flex items-center gap-2;
  }

  .post-actions-right {
    @apply flex items-center gap-2;
  }

  .action-button {
    @apply flex items-center gap-1 rounded-lg px-3 py-1.5 text-sm text-gray-600;
    @apply transition-colors hover:bg-gray-100;
  }

  .action-icon-button {
    @apply flex items-center justify-center rounded-lg p-2 text-gray-600;
    @apply transition-colors hover:bg-gray-100;
  }

  .action-icon-button-danger {
    @apply text-red-600 hover:bg-red-50;
  }

  .list-status {
    @apply py-8 text-center text-gray-500;
  }
</style>
```

### 11.2. 게시판 목록 (카테고리별)

**소스 코드 위치:** `src/routes/post/list/+page.svelte`

게시판 목록 페이지는 홈페이지와 동일한 구조를 사용합니다. 수정/삭제 아이콘 버튼이 하단 액션 바의 오른쪽에 배치됩니다.

**차이점:**
- 홈페이지: 수정/삭제 버튼 없음
- 게시판 목록: 수정/삭제 아이콘 버튼 표시 (작성자만)

**구현 예시:**

**소스 코드 위치**: [post.functions.ts.md](./repository/src/lib/functions/post.functions.ts.md)

```svelte
<!-- 하단 액션 바 -->
<div class="post-actions">
  <!-- 왼쪽: 좋아요, 댓글 -->
  <div class="post-actions-left">
    <button class="action-button">
      <svg class="h-5 w-5"><!-- Heart icon --></svg>
      <span>좋아요</span>
    </button>
    <button class="action-button">
      <svg class="h-5 w-5"><!-- Comment icon --></svg>
      <span>댓글 {message.totalChildCount || 0}</span>
    </button>
  </div>

  <!-- 오른쪽: 수정, 삭제 (작성자만 표시) -->
  {#if isMyPost}
    <div class="post-actions-right">
      <!-- 수정 아이콘 버튼 -->
      <button
        class="action-icon-button"
        onclick={(e: MouseEvent) => {
          e.stopPropagation();
          handleOpenEditDialog(messageId, message.text, message.urls, message.roomId);
        }}
        aria-label="수정"
      >
        <svg class="h-5 w-5"><!-- Edit icon --></svg>
      </button>

      <!-- 삭제 아이콘 버튼 -->
      <button
        class="action-icon-button action-icon-button-danger"
        onclick={(e: MouseEvent) => {
          e.stopPropagation();
          handleDeletePost(messageId);
        }}
        aria-label="삭제"
      >
        <svg class="h-5 w-5"><!-- Trash icon --></svg>
      </button>
    </div>
  {/if}
</div>
```

## 12. 테스트 가이드

### 12.1. UI 테스트 체크리스트

- [ ] 게시글 카드가 정상적으로 표시되는가?
- [ ] 카테고리 뱃지가 올바른 색상으로 표시되는가?
- [ ] 작성자 프로필 사진이 표시되는가?
- [ ] 첨부 파일 미리보기가 작동하는가?
- [ ] 이미지 클릭 시 모달이 열리는가?
- [ ] 비디오 재생 컨트롤이 표시되는가?
- [ ] 기타 파일 클릭 시 다운로드가 되는가?
- [ ] 댓글 목록이 표시되는가?
- [ ] 댓글 쓰기 버튼이 작동하는가?
- [ ] 수정/삭제 버튼이 작성자에게만 표시되는가?
- [ ] 무한 스크롤이 작동하는가?
- [ ] 삭제된 게시글이 올바르게 표시되는가?

### 12.2. 반응형 테스트

- [ ] 모바일 (320px ~ 640px)
- [ ] 태블릿 (641px ~ 1024px)
- [ ] 데스크톱 (1025px ~)

### 12.3. 접근성 테스트

- [ ] 키보드 네비게이션 (Tab, Enter, ESC)
- [ ] 스크린 리더 호환성
- [ ] 색상 대비 확인

## 13. 참고 문서

- [sonub-forum-overview.md](./sonub-forum-overview.md) - 게시판 기능 개요
- [sonub-firebase-database-list-view.md](./sonub-firebase-database-list-view.md) - DatabaseListView 컴포넌트
- [sonub-firebase-storage.md](./sonub-firebase-storage.md) - Firebase Storage 및 FileAttachments 컴포넌트
- [sonub-user-avatar.md](./sonub-user-avatar.md) - 사용자 아바타 컴포넌트
- [sonub-design-tailwindcss.md](./sonub-design-tailwindcss.md) - Tailwind CSS 스타일링 가이드
