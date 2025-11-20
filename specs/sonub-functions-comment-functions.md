---
name: sonub-functions-comment
title: Comment Functions 명세
version: 1.0.0
description: 댓글 생성, 수정, 삭제, 조회 관련 함수 목록과 사용 규칙
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
tags:
  - comment
  - functions
  - architecture
  - RTDB
---

# Comment Functions 명세

본 문서는 `src/lib/functions/comment.functions.ts` 파일에 정의된 댓글 관련 함수의 역할과 사용 규칙을 설명합니다. 전역 규칙은 반드시 [sonub-functions-overview.md](./sonub-functions-overview.md)를 먼저 읽은 후 적용합니다.

---

## 1. 파일 구조

**소스 코드 위치**: [comment.functions.ts.md](./repository/src/lib/functions/comment.functions.ts.md)

```
src/
└── lib/
    └── functions/
        └── comment.functions.ts   # 댓글 관련 클라이언트 함수
```

### 작성 규칙 요약

1. **Firebase RTDB 연동**: Firebase Realtime Database와 상호작용하여 댓글 CRUD 수행
2. **Thread Order 시스템**: `generateThreadOrder()`와 `getDepthFromListOrder()`를 사용하여 계층형 댓글 구조 지원
3. **Soft Delete**: 댓글 삭제 시 `deleted` 플래그를 true로 설정하고 내용을 초기화
4. **에러 처리**: 모든 함수는 `{ success: boolean; error?: string }` 형태의 결과 반환

---

## 2. 제공 함수 목록

### 2.1 `createComment()`

**소스 코드 위치**: [comment.functions.ts.md](./repository/src/lib/functions/comment.functions.ts.md)

```typescript
/**
 * 새로운 댓글을 생성합니다.
 *
 * @param postId - 게시글 ID
 * @param text - 댓글 내용
 * @param authorUid - 댓글 작성자 UID
 * @param urls - 첨부 파일 URL 목록 (선택적)
 * @param parentId - 부모 댓글 ID (최상위 댓글인 경우 null)
 * @returns 생성 결과 (성공 여부, 댓글 ID, 에러 메시지)
 */
export async function createComment(
  postId: string,
  text: string,
  authorUid: string,
  urls?: Record<number, string>,
  parentId?: string | null
): Promise<{ success: boolean; commentId?: string; error?: string }>
```

#### 동작 과정

1. **부모 정보 조회**: parentId가 있으면 부모 댓글의 `listOrder`와 `childCount`를 읽음
2. **Thread Order 생성**: `generateThreadOrder(parentListOrder, childCount)`로 새로운 `listOrder` 생성
3. **댓글 데이터 생성**: `CreateCommentPayload` 형태로 데이터 구성
4. **Firebase RTDB 저장**: `/comments/{postId}` 경로에 push()로 저장

#### RTDB 경로

```
/comments/{postId}/{commentId}
```

#### 저장 데이터 구조

```typescript
{
  text: string,
  authorUid: string,
  parentId: string | null,
  createdAt: number,
  listOrder: string,
  urls?: Record<number, string>  // 선택적
}
```

#### 사용 예시

```typescript
// 최상위 댓글 생성
const result = await createComment(
  'post123',
  '좋은 글 감사합니다!',
  'uid123'
);

// 대댓글 생성 (parentId 지정)
const reply = await createComment(
  'post123',
  '동감합니다!',
  'uid456',
  undefined,
  'comment789'  // 부모 댓글 ID
);

// 첨부 파일 포함 댓글
const withFiles = await createComment(
  'post123',
  '사진 첨부합니다.',
  'uid789',
  { 0: 'https://example.com/photo.jpg' }
);
```

#### Thread Order 시스템

`listOrder`는 계층형 댓글 구조를 유지하기 위한 정렬 키입니다:

- **최상위 댓글**: `"0000"`, `"0001"`, `"0002"` (4자리 패딩)
- **1단계 대댓글**: `"0000.0000"`, `"0000.0001"`
- **2단계 대댓글**: `"0000.0000.0000"`

**장점**:
- 단일 쿼리로 계층형 댓글 목록 로드 가능
- 정렬 순서가 자동으로 유지됨
- 깊이(depth) 계산이 간단함 (점의 개수 세기)

---

### 2.2 `loadComments()`

**소스 코드 위치**: [comment.functions.ts.md](./repository/src/lib/functions/comment.functions.ts.md)

```typescript
/**
 * 특정 게시글의 모든 댓글을 listOrder 순서로 로드합니다.
 *
 * @param postId - 게시글 ID
 * @returns 댓글 목록 (메타데이터 포함)
 */
export async function loadComments(
  postId: string
): Promise<{ success: boolean; comments?: CommentWithMetadata[]; error?: string }>
```

#### 반환 데이터 구조

```typescript
interface CommentWithMetadata {
  commentId: string;      // 댓글 ID
  text: string;
  authorUid: string;
  parentId: string | null;
  createdAt: number;
  listOrder: string;
  depth: number;          // 댓글 깊이 (0 = 최상위, 1 = 대댓글, ...)
  urls?: Record<number, string>;
  editedAt?: number;      // 수정 시각 (수정된 경우만)
  deleted?: boolean;      // 삭제 여부
  deletedAt?: number;     // 삭제 시각
}
```

#### 사용 예시

```typescript
const result = await loadComments('post123');

if (result.success && result.comments) {
  result.comments.forEach(comment => {
    // depth를 사용하여 들여쓰기 적용
    const indent = '  '.repeat(comment.depth);
    console.log(`${indent}${comment.text}`);
  });
}
```

---

### 2.3 `loadLastComments()`

**소스 코드 위치**: [comment.functions.ts.md](./repository/src/lib/functions/comment.functions.ts.md)

```typescript
/**
 * 특정 게시글의 마지막 N개 댓글을 listOrder 순서로 로드합니다.
 * 글 목록 페이지에서 댓글 미리보기용으로 사용합니다.
 *
 * @param postId - 게시글 ID
 * @param limit - 가져올 댓글 개수 (기본값: 3)
 * @returns 댓글 목록 (메타데이터 포함)
 */
export async function loadLastComments(
  postId: string,
  limit: number = 3
): Promise<{ success: boolean; comments?: CommentWithMetadata[]; error?: string }>
```

#### 사용 시나리오

**PostItem 컴포넌트에서 최근 댓글 3개 미리보기**:

```typescript
const result = await loadLastComments(postId, 3);
if (result.success && result.comments) {
  // 최근 댓글 3개만 표시
  // 사용자가 댓글 더보기 클릭 시 전체 댓글 페이지로 이동
}
```

**장점**:
- RTDB 읽기 비용 절감 (limitToLast 사용)
- 빠른 로딩 속도
- 게시글 목록 페이지 성능 향상

---

### 2.4 `updateComment()`

**소스 코드 위치**: [comment.functions.ts.md](./repository/src/lib/functions/comment.functions.ts.md)

```typescript
/**
 * 댓글을 수정합니다.
 *
 * @param postId - 게시글 ID
 * @param commentId - 댓글 ID
 * @param text - 수정할 댓글 내용
 * @param urls - 수정할 첨부 파일 URL 목록 (선택적)
 * @returns 수정 결과
 */
export async function updateComment(
  postId: string,
  commentId: string,
  text: string,
  urls?: Record<number, string>
): Promise<{ success: boolean; error?: string }>
```

#### 업데이트 필드

```typescript
{
  text: string,           // 수정된 댓글 내용
  editedAt: number,       // 수정 시각
  urls?: Record<number, string>  // 첨부 파일 (지정된 경우만)
}
```

**⚠️ 주의**: 기존 필드는 유지됩니다.
- `authorUid` - 변경 안 됨
- `createdAt` - 변경 안 됨
- `listOrder` - 변경 안 됨
- `parentId` - 변경 안 됨

#### 사용 예시

```typescript
// CommentEditDialog에서 호출
const result = await updateComment(
  'post123',
  'comment456',
  '수정된 댓글 내용',
  { 0: 'https://example.com/new-photo.jpg' }
);

if (result.success) {
  console.log('댓글 수정 완료');
}
```

---

### 2.5 `deleteComment()`

**소스 코드 위치**: [comment.functions.ts.md](./repository/src/lib/functions/comment.functions.ts.md)

```typescript
/**
 * 댓글을 삭제합니다 (Soft Delete).
 *
 * @param postId - 게시글 ID
 * @param commentId - 댓글 ID
 * @returns 삭제 결과
 */
export async function deleteComment(
  postId: string,
  commentId: string
): Promise<{ success: boolean; error?: string }>
```

#### Soft Delete 동작

댓글을 완전히 삭제하지 않고 다음과 같이 표시만 변경합니다:

```typescript
{
  deleted: true,
  deletedAt: Date.now(),
  text: '',              // 내용 초기화
  urls: undefined        // 첨부 파일 제거
}
```

**이유**:
1. **Thread Order 유지**: 대댓글이 있는 경우 구조가 깨지지 않음
2. **복구 가능성**: 필요 시 복구 기능 추가 가능
3. **통계 유지**: 댓글 수 통계가 정확하게 유지됨

#### 사용 예시

```typescript
const result = await deleteComment('post123', 'comment456');

if (result.success) {
  console.log('댓글 삭제 완료');
  // UI에서는 "삭제된 댓글입니다." 표시
}
```

#### UI 표시 로직

```svelte
{#if comment.deleted}
  <div class="deleted-comment">
    삭제된 댓글입니다.
  </div>
{:else}
  <div class="comment-content">
    {comment.text}
  </div>
{/if}
```

---

## 3. 적용 지침

### 3.1 Thread Order 시스템 활용

- **정렬 쿼리**: `orderByChild('listOrder')`를 사용하여 계층형 구조 유지
- **깊이 계산**: `getDepthFromListOrder(listOrder)`로 들여쓰기 적용
- **새 댓글 추가**: `generateThreadOrder(parentListOrder, childCount)` 사용

### 3.2 RTDB 비용 최적화

- **미리보기**: `loadLastComments(postId, 3)` 사용하여 필요한 개수만 로드
- **전체 로드**: 댓글 상세 페이지에서만 `loadComments()` 사용
- **Pagination**: 필요 시 `limitToFirst()`, `limitToLast()` 활용

### 3.3 보안 규칙

댓글 수정/삭제는 Security Rules로 보호됩니다:

```json
{
  "comments": {
    "$postId": {
      "$commentId": {
        ".write": "auth != null && data.child('authorUid').val() === auth.uid"
      }
    }
  }
}
```

**규칙**: 댓글 작성자만 수정/삭제 가능

### 3.4 에러 처리

모든 함수는 일관된 에러 처리 패턴을 따릅니다:

```typescript
const result = await createComment(...);

if (!result.success) {
  // 사용자에게 에러 메시지 표시
  alert(result.error);
  return;
}

// 성공 시 처리
console.log('댓글 ID:', result.commentId);
```

---

## 4. 사용 시나리오

### 4.1 댓글 생성 플로우

**CommentCreateDialog.svelte**:

```typescript
async function handleSave(text: string, urls: Record<number, string>) {
  const result = await createComment(
    postId,
    text,
    authStore.user!.uid,
    urls,
    parentCommentId  // 대댓글이면 부모 ID 전달
  );

  if (!result.success) {
    return { success: false, error: result.error };
  }

  // 성공 시 댓글 목록 새로고침
  onSaved?.();
  return { success: true };
}
```

### 4.2 댓글 목록 표시

**PostCommentList.svelte**:

```typescript
$effect(() => {
  if (postId) {
    void loadAndDisplayComments();
  }
});

async function loadAndDisplayComments() {
  const result = await loadComments(postId);

  if (result.success && result.comments) {
    commentList = result.comments;
  }
}
```

### 4.3 댓글 미리보기 (게시글 목록)

**PostItem.svelte**:

```typescript
const { comments = [] } = await loadLastComments(postId, 3);

// 최근 댓글 3개 표시
```

---

## 5. 테스트 시나리오

### 5.1 기본 기능 테스트

- [ ] 최상위 댓글 생성이 정상 동작하는지 확인
- [ ] 대댓글 생성 시 `listOrder`가 올바르게 생성되는지 확인
- [ ] 댓글 목록 로드 시 계층형 구조가 유지되는지 확인
- [ ] 댓글 수정 후 `editedAt` 필드가 업데이트되는지 확인
- [ ] 댓글 삭제 시 Soft Delete가 동작하는지 확인

### 5.2 Thread Order 테스트

- [ ] 최상위 댓글 → 대댓글 → 대댓글의 대댓글 구조가 정상 표시되는지 확인
- [ ] `depth` 계산이 정확한지 확인 (0, 1, 2, ...)
- [ ] `listOrder` 기준 정렬이 올바른지 확인

### 5.3 에러 처리 테스트

- [ ] RTDB 연결 실패 시 에러 메시지가 반환되는지 확인
- [ ] 부모 댓글이 없는데 대댓글 생성 시도 시 에러 처리되는지 확인
- [ ] 권한 없는 댓글 수정/삭제 시 Security Rules가 차단하는지 확인

---

## 6. 관련 파일

### 6.1 연관 컴포넌트

- `src/lib/components/comment/CommentCreateDialog.svelte` - 댓글 생성 UI
- `src/lib/components/comment/CommentEditDialog.svelte` - 댓글 수정 UI
- `src/lib/components/post/PostCommentList.svelte` - 댓글 목록 표시

### 6.2 관련 스펙 문서

- `specs/sonub-component-comment-create-dialog.md` - 댓글 생성 컴포넌트
- `specs/sonub-component-comment-edit-dialog.md` - 댓글 수정 컴포넌트
- `specs/sonub-firebase-database-structure.md` - RTDB 구조
- `specs/sonub-firebase-security-rules.md` - Security Rules

---

## 7. 작업 이력 (SED Log)

| 날짜 | 작업자 | 변경 내용 |
| ---- | ------ | -------- |
| 2025-01-20 | Claude Code | Comment Functions 명세 최초 작성 |
