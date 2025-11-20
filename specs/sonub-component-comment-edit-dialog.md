---
name: sonub-component-comment-edit-dialog
version: 1.0.0
description: 댓글 수정 다이얼로그 컴포넌트 SED 명세서
author: JaeHo Song
email: thruthesky@gmail.com
license: GPL-3.0
created: 2025-01-20
updated: 2025-01-20
step: 1
priority: "medium"
dependencies: ["sonub-component-message-edit-modal.md", "sonub-functions-comment-functions.md"]
tags: ["component", "dialog", "comment", "edit", "wrapper"]
---

# CommentEditDialog 컴포넌트 상세 스펙

## 1. 개요

### 1.1 목적

CommentEditDialog는 사용자가 자신의 댓글을 수정할 수 있도록 하는 래퍼 컴포넌트입니다. `MessageEditModal.svelte`를 사용하여 UI를 표시하고, `updateComment()` 함수를 통해 Firebase RTDB에 댓글을 업데이트합니다.

### 1.2 역할

본 컴포넌트는 다음의 역할을 담당합니다:

1. **UI 표시** - MessageEditModal을 재사용하여 편집 UI 제공
2. **비즈니스 로직** - updateComment() 함수 호출하여 RTDB 업데이트
3. **에러 처리** - 저장 실패 시 에러 메시지 표시
4. **콜백 전달** - 저장 완료 시 부모 컴포넌트에 알림

## 2. 컴포넌트 위치

```
src/lib/components/comment/CommentEditDialog.svelte
```

Repository 문서:
```
specs/repository/src/lib/components/comment/CommentEditDialog.svelte.md
```

## 3. Props 인터페이스

### 3.1 Props 정의

| 이름 | 타입 | 필수 | 기본값 | 설명 |
|------|------|------|--------|------|
| `open` | `boolean` | ✅ | - | 모달 열림 상태 (bindable) |
| `messageId` | `string` | ✅ | - | 게시글 ID (postId) |
| `commentId` | `string` | ✅ | - | 댓글 ID |
| `initialText` | `string` | ✅ | - | 초기 텍스트 |
| `initialUrls` | `Record<number, string>` | ✅ | - | 초기 첨부파일 URL 목록 |
| `onClose` | `() => void` | ✅ | - | 모달 닫기 콜백 |
| `onSaved` | `() => void` | ❌ | `undefined` | 저장 완료 콜백 |

### 3.2 Props 사용 예시

```svelte
<CommentEditDialog
  bind:open={editDialogOpen}
  messageId={postId}
  commentId={commentId}
  initialText={comment.text}
  initialUrls={comment.urls || {}}
  onClose={() => editDialogOpen = false}
  onSaved={() => {
    console.log('댓글 수정 완료');
    // 댓글 목록 새로고침 등
  }}
/>
```

## 4. 핵심 로직

### 4.1 저장 핸들러

```typescript
async function handleSave(
  text: string,
  urls: Record<number, string>
): Promise<{ success: boolean; error?: string }> {
  try {
    // updateComment() 함수 호출
    const result = await updateComment(postId, commentId, text, urls);

    if (!result.success) {
      return { success: false, error: result.error ?? m.commentSaveFailed() };
    }

    // 저장 완료 콜백 호출
    onSaved?.();

    return { success: true };
  } catch (err) {
    console.error('댓글 수정 실패:', err);
    return {
      success: false,
      error: m.commentSaveFailed()
    };
  }
}
```

### 4.2 MessageEditModal 통합

```svelte
<MessageEditModal
  bind:open
  title={m.commentEditTitle()}
  textLabel=""
  {initialText}
  {initialUrls}
  roomId={postId}
  saveButtonText={m.commonSave()}
  cancelButtonText={m.commonCancel()}
  textPlaceholder={m.commentTextPlaceholder()}
  onSave={handleSave}
  onCancel={onClose}
/>
```

## 5. Firebase RTDB 업데이트

### 5.1 RTDB 경로

```
/post-comments/{postId}/{commentId}
```

### 5.2 업데이트 필드

```typescript
{
  text: string,           // 댓글 텍스트
  urls: Record<number, string>,  // 첨부파일 URL 맵
  editedAt: number        // 수정 시각 (타임스탬프)
}
```

### 5.3 updateComment() 함수

`src/lib/functions/comment.functions.ts`에 정의된 함수를 사용합니다.

```typescript
export async function updateComment(
  postId: string,
  commentId: string,
  text: string,
  urls: Record<number, string>
): Promise<{ success: boolean; error?: string }> {
  if (!rtdb) {
    return { success: false, error: m.firebaseNotReady() };
  }

  try {
    const commentRef = ref(rtdb, `post-comments/${postId}/${commentId}`);
    const updates = {
      text: text.trim(),
      urls,
      editedAt: Date.now()
    };

    await update(commentRef, updates);

    return { success: true };
  } catch (err) {
    console.error('댓글 업데이트 실패:', err);
    return {
      success: false,
      error: m.commentUpdateFailed()
    };
  }
}
```

## 6. 사용 예제

### 6.1 기본 사용

```svelte
<script lang="ts">
  import CommentEditDialog from '$lib/components/comment/CommentEditDialog.svelte';

  // 댓글 수정 모달 상태
  let editDialogOpen = $state(false);
  let currentComment = $state<any>(null);

  function handleEditComment(comment: any) {
    currentComment = comment;
    editDialogOpen = true;
  }

  function handleCommentSaved() {
    console.log('댓글 수정 완료');
    // 댓글 목록 새로고침
    refreshCommentList();
  }
</script>

{#if currentComment}
  <CommentEditDialog
    bind:open={editDialogOpen}
    messageId={postId}
    commentId={currentComment.id}
    initialText={currentComment.text}
    initialUrls={currentComment.urls || {}}
    onClose={() => editDialogOpen = false}
    onSaved={handleCommentSaved}
  />
{/if}
```

## 7. 의존성

### 7.1 컴포넌트 의존성

- `$lib/components/MessageEditModal.svelte` - 편집 UI 제공

### 7.2 함수 의존성

- `$lib/functions/comment.functions.ts` - `updateComment()` 함수

### 7.3 i18n 의존성

- `m.commentEditTitle()` - 댓글 수정 제목
- `m.commonSave()` - 저장 버튼 텍스트
- `m.commonCancel()` - 취소 버튼 텍스트
- `m.commentTextPlaceholder()` - 텍스트 입력 placeholder
- `m.commentSaveFailed()` - 저장 실패 메시지

## 8. 테스트 시나리오

### 8.1 기본 기능 테스트

- [ ] 댓글 수정 모달이 정상적으로 열리는지 확인
- [ ] 초기 텍스트와 첨부파일이 정상적으로 로드되는지 확인
- [ ] 텍스트 수정 후 저장 시 RTDB가 업데이트되는지 확인
- [ ] 첨부파일 추가/삭제 후 저장 시 정상 동작하는지 확인
- [ ] 저장 완료 시 onSaved 콜백이 호출되는지 확인
- [ ] 취소 버튼 클릭 시 모달이 닫히는지 확인

### 8.2 에러 처리 테스트

- [ ] RTDB 연결 실패 시 에러 메시지가 표시되는지 확인
- [ ] updateComment() 함수 실패 시 에러 메시지가 표시되는지 확인
- [ ] 네트워크 오류 시 적절한 에러 처리가 되는지 확인

## 9. 관련 파일

### 9.1 연관 컴포넌트

- `src/lib/components/MessageEditModal.svelte` - UI 제공
- `src/lib/components/post/PostCommentList.svelte` - 댓글 목록 (수정 버튼 포함)

### 9.2 관련 스펙 문서

- `specs/sonub-component-message-edit-modal.md` - MessageEditModal 상세 스펙
- `specs/sonub-functions-comment-functions.md` - 댓글 관련 함수 스펙
- `specs/sonub-firebase-database-structure.md` - RTDB 구조 스펙
