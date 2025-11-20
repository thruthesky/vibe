---
title: Sonub 좋아요 시스템 개요
status: active
created: 2025-01-18
updated: 2025-11-19
author: Codex (GPT-5)
tags:
  - like
  - reaction
  - chat
  - forum
  - firebase
dependencies:
  - sonub-firebase-database-structure.md
  - sonub-forum-overview.md
  - sonub-firebase-functions.md
  - sonub-design-guideline.md
---

# 1. 개요

이 문서는 Sonub 전역에서 사용하는 좋아요(리액션) 시스템을 정의한다. 게시글(type: `post`), 댓글까지 동일한 데이터 모델과 Cloud Functions 파이프라인을 공유하며, 프론트엔드는 `like.functions.ts` 를 통해 단일 토글 API만 호출하도록 설계한다.

## 1.1 범위

- `/likes/{uid}/{targetId}` 경로 모델
- `/posts`, `/comments`의 `likeCount` 동기화
- 클라이언트 UI (게시판, 댓글 리스트, 모달) 연동
- Realtime Database 규칙 및 Cloud Functions 핸들러( `like.handler.ts` ) 동작 흐름

## 1.2 용어

| 용어 | 설명 |
| --- | --- |
| `targetId` | 좋아요 대상. 채팅/게시글일 때는 `messageId`, 댓글일 때는 `commentId` |
| `targetType` | `/likes/{uid}/{targetId}` 값에 저장되는 타입 문자열. `"message"`, `"post"`, `"comment"` (단독 사용 시), 또는 `"comment-{postId}"` (댓글의 경우 postId 포함) 형식 |
| `likeCount` | Cloud Functions가 관리하는 카운터 필드. 클라이언트는 직접 수정하지 않는다 |

# 2. 데이터 모델

상세한 데이터베이스 구조는 다음 문서를 참조하세요:
- [좋아요 데이터베이스 구조](./sonub-firebase-database-structure.md#좋아요-likes--likes-by)
- [게시글 데이터베이스 구조 (likeCount 필드 포함)](./sonub-firebase-database-structure.md#게시글-posts)
- [댓글 데이터베이스 구조 (likeCount 필드 포함)](./sonub-firebase-database-structure.md#댓글-comments)

# 3. 아키텍처

```
┌─────────────────────────────┐
│ UI                          │
│  - /routes/chat/room/+page  │
│  - /routes/post/list/+page  │
│  - PostItem.svelte          │
│  - CommentList.svelte       │
└──────────────┬──────────────┘
               │ toggleLikeTarget()
┌──────────────▼──────────────┐
│ /src/lib/functions/like...  │
│  - toggleLikeTarget()       │
│  - LikeTargetType           │
└──────────────┬──────────────┘
               │ RTDB write
┌──────────────▼──────────────┐
│ Firebase Realtime Database  │
│  /likes/{uid}/{targetId}    │
└──────────────┬──────────────┘
               │ onCreate/onDelete
┌──────────────▼──────────────┐
│ Cloud Functions             │
│  like.handler.ts            │
│  - handleLikeCreate         │
│  - handleLikeDelete         │
└─────────────────────────────┘
```

# 4. 흐름

## 4.1 좋아요 추가

1. UI에서 하트 버튼 클릭 → `handleToggleLike(event, targetId, targetType)`
2. `toggleLikeTarget` 가 `/likes/{uid}/{targetId}` 값을 조회
3. 값이 없으면 `{ targetType }` 문자열을 write
4. Cloud Functions `onCreate` 트리거
   - `targetType === "post"` → `/posts/{targetId}/likeCount` 를 `ServerValue.increment(1)`
   - `targetType.startsWith("comment-")` → targetType에서 postId 파싱 (`"comment-{postId}"` 형식) 후 `/comments/{postId}/{targetId}/likeCount` 증가
5. UI는 `/likes/{uid}` 와 게시글/댓글의 데이터 경로를 실시간 구독하여 카운터를 즉시 반영

## 4.2 좋아요 취소

1. 동일한 버튼 클릭 → `toggleLikeTarget` 가 기존 스냅샷을 감지
2. `/likes/{uid}/{targetId}` 삭제
3. Cloud Functions `onDelete` 트리거 → 해당 `likeCount` 를 `ServerValue.increment(-1)`
4. UI 업데이트

# 5. 게시글/댓글별 세부 사항

## 5.1 게시글

- 게시글 데이터는 `/posts/{postId}` 에 저장된다.
- `src/lib/components/post/PostItem.svelte`에서 `PostItem`/`MessageFooter` 패턴을 사용한다.
- 사용자별 좋아요 상태는 `createRealtimeStore<UserLikesMap>(\`likes/${uid}\`)` 로 구독하여 하트 아이콘을 토글한다.
- LikedUsers 모달 (`src/lib/components/LikedUsersModal.svelte`) 은 좋아요한 사용자 목록을 표시한다.

## 5.2 댓글

- 댓글 데이터는 `/comments/{postId}/{commentId}` 에 저장된다.
- 댓글 좋아요 시 `targetType`은 `"comment-{postId}"` 형식으로 저장되어 Cloud Functions가 postId를 파싱할 수 있다.
- `comment-locations` 매핑 구조는 제거되었으며, 모든 postId 정보는 targetType에 인코딩된다.
- UI는 `PostCommentList.svelte`에서 `toggleLikeTarget({ uid, targetId: commentId, targetType: 'comment', postId })` 으로 호출한다.
- **중요**: 댓글 좋아요 시 반드시 `postId` 파라미터를 전달해야 한다. 그렇지 않으면 Cloud Functions에서 postId를 찾을 수 없다.
- 좋아요 사용자 모달 표시 시 `targetType`을 `"comment-{postId}"` 형식으로 전달한다.
- 댓글 좋아요 수는 `comment.likeCount ?? 0` 을 출력한다.

# 6. 클라이언트 구현 지침

1. **함수 사용**: 모든 컴포넌트는 `toggleLikeTarget` 만 사용하며 직접 `/likes`를 수정하지 않는다.
2. **댓글 좋아요 시 postId 필수**: 댓글 좋아요 시 반드시 `postId` 파라미터를 전달해야 한다.
   ```typescript
   await toggleLikeTarget({
     uid: authStore.user.uid,
     targetId: commentId,
     targetType: 'comment',
     postId: postId  // 필수!
   });
   ```
3. **pending set**: `pendingLikeTargets` Set을 사용해 중복 클릭을 방지한다 (참고: `src/routes/chat/room/+page.svelte`).
4. **구독 해제**: `createRealtimeStore` 사용 후 컴포넌트 언마운트 시 `store.unsubscribe()` 를 호출한다.
5. **컴포넌트 예시**
   - `PostItem.svelte`: 게시글 카드에서 좋아요 버튼/툴팁/카운트 UI
   - `FeedList.svelte`: 팔로잉 피드에서도 동일한 `PostItem` 을 재사용
   - `PostCommentList.svelte`: 댓글 좋아요 버튼 (postId 전달 필수)

# 7. 보안 및 백엔드

- **Rules** (`firebase/database.rules.json`)
  - `/likes/{uid}`: read/write 모두 `auth.uid === uid` 인 경우만 허용
  - `likeCount` 필드는 `.write: false` 로 설정되어 있으므로 클라이언트가 수정할 수 없다.
- **Cloud Functions**
  - `like.handler.ts` 에서 onCreate/onDelete 트리거를 캡슐화
  - 오류 발생 시 작업을 롤백하고 로깅
  - 향후 확장: 좋아요 알림, 통계 (`/stats/{uid}/{yyyymmdd}`) 연동

# 8. UI/UX 요구사항

- 버튼 상태: 좋아요 전 회색 아이콘, 좋아요 후 메인 색 (`text-rose-500` 등)
- 카운트는 숫자 포맷터를 사용 (`Intl.NumberFormat`)
- 좋아요 목록 툴팁:
  - `Loved by A, B and 3 more` 형태로 최대 3명 표시
  - hover/long-press 시 `LikedUsersModal` 호출
- 비로그인 상태에서는 토스트나 alert 로 로그인 안내 → `toggleLikeTarget` 호출 전 `authStore.user` 체크

# 9. 테스트 체크리스트

- [x] `npm run check` 통과
- [x] 댓글 좋아요 시 postId 전달 검증 추가
- [x] Cloud Functions 배포 완료
- [ ] 채팅/게시글/댓글 좋아요 추가/취소 시 `/likes` 와 `likeCount` 가 동기화되는지 확인
- [ ] 동시에 여러 사용자가 좋아요할 때 데이터 경합 없이 카운트가 증가하는지 확인
- [ ] 비로그인 상태에서 좋아요 버튼이 로그인 유도 메시지를 노출하는지 확인
