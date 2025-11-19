# 클라이언트 코드 수정 가이드: comment-locations 제거

## 개요

`comment-locations` 매핑 구조를 제거하고, 댓글 좋아요 시 `targetType`을 `"comment-{postId}"` 형식으로 저장하도록 변경합니다.

## 변경 사항 요약

### 이전 방식
- 댓글 좋아요: `/likes/{uid}/{commentId} = "comment"`
- Cloud Functions가 `/comment-locations/{commentId}`를 조회하여 postId를 찾음

### 새로운 방식
- 댓글 좋아요: `/likes/{uid}/{commentId} = "comment-{postId}"`
- Cloud Functions가 targetType에서 postId를 직접 파싱

## 수정할 파일

### 1. `src/lib/functions/like.functions.ts`

#### 1.1 타입 정의 수정

**변경 전:**
```typescript
export type LikeTargetType = 'message' | 'comment' | 'post';
```

**변경 후:**
```typescript
/**
 * 좋아요 대상 타입
 * - message: 채팅 메시지
 * - comment: 댓글 (사용 시 "comment-{postId}" 형식으로 저장)
 * - post: 게시글
 */
export type LikeTargetType = 'message' | 'comment' | 'post' | `comment-${string}`;
```

#### 1.2 인터페이스에 postId 추가

**변경 전:**
```typescript
interface ToggleLikeOptions {
	uid?: string | null;
	targetId: string;
	targetType: LikeTargetType;
	/** 채팅 메시지의 경우 roomId를 전달하여 "chat-message-{roomId}" 형식으로 저장 */
	roomId?: string;
}
```

**변경 후:**
```typescript
interface ToggleLikeOptions {
	uid?: string | null;
	targetId: string;
	targetType: LikeTargetType;
	/** 채팅 메시지의 경우 roomId를 전달하여 "chat-message-{roomId}" 형식으로 저장 */
	roomId?: string;
	/** 댓글의 경우 postId를 전달하여 "comment-{postId}" 형식으로 저장 */
	postId?: string;
}
```

#### 1.3 toggleLikeTarget 함수 검증 로직 수정

**변경 전:**
```typescript
if (
	!targetId ||
	(targetType !== 'message' && targetType !== 'comment' && targetType !== 'post')
) {
	console.error('❌ [toggleLikeTarget] 잘못된 요청', { targetId, targetType });
	return { success: false, error: '잘못된 좋아요 요청입니다.' };
}
```

**변경 후:**
```typescript
if (!targetId) {
	console.error('❌ [toggleLikeTarget] 잘못된 요청', { targetId, targetType });
	return { success: false, error: '잘못된 좋아요 요청입니다.' };
}

// targetType 검증: message, post, 또는 comment-{postId} 형식
if (
	targetType !== 'message' &&
	targetType !== 'post' &&
	targetType !== 'comment' &&
	!targetType.startsWith('comment-')
) {
	console.error('❌ [toggleLikeTarget] 잘못된 targetType', { targetId, targetType });
	return { success: false, error: '잘못된 좋아요 요청입니다.' };
}
```

#### 1.4 valueToStore 생성 로직 수정

**변경 전:**
```typescript
// 채팅 메시지의 경우 roomId 정보를 포함하여 저장
// 형식: "chat-message-{roomId}"
// 이를 통해 Cloud Functions에서 바로 roomId를 파싱하여 사용 가능
const valueToStore = targetType === 'message' && roomId
	? `chat-message-${roomId}`
	: targetType;
```

**변경 후:**
```typescript
// 채팅 메시지의 경우 roomId 정보를 포함하여 저장
// 형식: "chat-message-{roomId}"
// 댓글의 경우 postId 정보를 포함하여 저장
// 형식: "comment-{postId}"
// 이를 통해 Cloud Functions에서 바로 roomId/postId를 파싱하여 사용 가능
let valueToStore = targetType;

if (targetType === 'message' && roomId) {
	valueToStore = `chat-message-${roomId}`;
} else if (targetType === 'comment' && postId) {
	valueToStore = `comment-${postId}`;
}
```

#### 1.5 JSDoc 주석 업데이트

**변경 전:**
```typescript
/**
 * 현재 사용자의 좋아요 상태를 토글합니다.
 *
 * - 값이 없으면 targetType 문자열을 저장 (좋아요 추가)
 * - 값이 있으면 노드를 삭제 (좋아요 취소)
 * - 채팅 메시지의 경우 roomId를 전달하면 "chat-message-{roomId}" 형식으로 저장
 */
```

**변경 후:**
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
```

### 2. `src/lib/components/post/PostCommentList.svelte`

#### 2.1 toggleLikeTarget 호출 시 postId 전달

**변경 전:**
```svelte
const result = await toggleLikeTarget({
	uid: authStore.user.uid,
	targetId: commentId,
	targetType: 'comment'
});
```

**변경 후:**
```svelte
const result = await toggleLikeTarget({
	uid: authStore.user.uid,
	targetId: commentId,
	targetType: 'comment',
	postId: post.id  // postId 추가 (post 객체에서 가져옴)
});
```

**참고**: `post` 객체는 컴포넌트의 props로 전달되어야 합니다. 현재 코드에서 `post.id`를 사용할 수 있는지 확인하세요.

#### 2.2 LikedUsersModal targetType 수정 (선택 사항)

**변경 전:**
```svelte
<LikedUsersModal bind:open={likesModalOpen} targetId={likesModalTargetId} targetType="comment" />
```

**변경 후:**
```svelte
<LikedUsersModal
	bind:open={likesModalOpen}
	targetId={likesModalTargetId}
	targetType="comment-{post.id}"  <!-- postId 포함 -->
/>
```

**또는 동적으로:**
```svelte
<script lang="ts">
	// ...
	let likesModalTargetType: string = '';

	function showLikesModal(commentId: string) {
		likesModalTargetId = commentId;
		likesModalTargetType = `comment-${post.id}`;  // 동적으로 생성
		likesModalOpen = true;
	}
</script>

<LikedUsersModal
	bind:open={likesModalOpen}
	targetId={likesModalTargetId}
	targetType={likesModalTargetType}
/>
```

## 주의사항

### 1. postId 필수 전달
댓글 좋아요 시 **반드시** `postId`를 전달해야 합니다. 그렇지 않으면 Cloud Functions에서 postId를 파싱할 수 없습니다.

### 2. 기존 데이터 호환성
이미 생성된 기존 좋아요 데이터(`targetType = "comment"`)는 새로운 형식(`"comment-{postId}"`)과 호환되지 않습니다.
- 옵션 1: 기존 데이터를 마이그레이션 (권장)
- 옵션 2: Cloud Functions에서 양쪽 형식 모두 처리하도록 임시 호환성 로직 추가

### 3. 타입 안전성
TypeScript의 타입 시스템을 활용하여 `postId` 누락을 방지하세요:

```typescript
interface ToggleLikeOptions {
	uid?: string | null;
	targetId: string;
	targetType: LikeTargetType;
	roomId?: string;
	postId?: string;
}

// 또는 더 엄격하게:
type ToggleLikeOptions =
	| { targetType: 'message'; roomId: string; targetId: string; uid?: string | null }
	| { targetType: 'comment'; postId: string; targetId: string; uid?: string | null }
	| { targetType: 'post'; targetId: string; uid?: string | null };
```

## 테스트 체크리스트

- [ ] 댓글 좋아요 추가 시 `/likes/{uid}/{commentId}` 경로에 `"comment-{postId}"` 형식으로 저장되는지 확인
- [ ] 댓글 좋아요 취소 시 정상적으로 삭제되는지 확인
- [ ] Cloud Functions가 `likeCount`를 정상적으로 증감하는지 확인
- [ ] 좋아요한 사용자 목록이 정상적으로 표시되는지 확인
- [ ] 게시글 및 채팅 메시지 좋아요는 영향을 받지 않는지 확인

## 롤백 계획

문제가 발생할 경우:
1. 클라이언트 코드를 이전 버전으로 되돌림
2. Cloud Functions를 이전 버전으로 재배포
3. 필요시 `/comment-locations` 매핑 구조 복원

## 완료 후 확인사항

- [ ] Firebase Realtime Database에서 새로운 좋아요 데이터 구조 확인
- [ ] Cloud Functions 로그에서 에러 없는지 확인
- [ ] 프론트엔드에서 댓글 좋아요 기능 정상 동작 확인
- [ ] 통계 시스템 (인플루언서 점수 등)이 정상 동작하는지 확인
