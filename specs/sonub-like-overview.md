---
title: Sonub 좋아요 시스템 개요
status: active
created: 2025-01-18
updated: 2025-11-18
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

이 문서는 Sonub 전역에서 사용하는 좋아요(리액션) 시스템을 정의한다. 채팅 메시지, 게시글(type: `post`), 댓글까지 동일한 데이터 모델과 Cloud Functions 파이프라인을 공유하며, 프론트엔드는 `like.functions.ts` 를 통해 단일 토글 API만 호출하도록 설계한다.

## 1.1 범위

- `/likes/{uid}/{targetId}` 경로 모델
- `/chat-messages`, `/chat-message-comments` 의 `likeCount` 동기화
- 클라이언트 UI (채팅방, 게시판, 댓글 리스트, 모달) 연동
- Realtime Database 규칙 및 Cloud Functions 핸들러( `like.handler.ts` ) 동작 흐름

## 1.2 용어

| 용어 | 설명 |
| --- | --- |
| `targetId` | 좋아요 대상. 채팅/게시글일 때는 `messageId`, 댓글일 때는 `commentId` |
| `targetType` | `"message"` 또는 `"comment"` 문자열. `/likes/{uid}/{targetId}` 값에 저장 |
| `likeCount` | Cloud Functions가 관리하는 카운터 필드. 클라이언트는 직접 수정하지 않는다 |

# 2. 데이터 모델

| 경로 | 설명 |
| --- | --- |
| `/likes/{uid}/{targetId}` | 로그인 사용자가 좋아요한 항목 기록. 값은 `targetType` |
| `/chat-messages/{messageId}/likeCount` | 게시글/채팅 메시지의 총 좋아요 수 |
| `/chat-message-comments/{messageId}/{commentId}/likeCount` | 특정 댓글의 좋아요 수 |
| `/comment-locations/{commentId}` | 댓글이 속한 부모 `messageId`. Cloud Functions가 댓글의 likeCount를 갱신할 때 사용 |

- `".indexOn": ["likeCount"]` 는 `firebase/database.rules.json` 에 정의되어 있어 정렬 쿼리에서 효율적으로 사용한다.
- `/likes` 루트에 대한 read 권한은 본인만, write 권한은 본인 UID와 일치할 때만 허용한다.

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
   - `targetType === "message"` → `/chat-messages/{targetId}/likeCount` 를 `ServerValue.increment(1)`
   - `targetType === "comment"` → `/comment-locations/{targetId}` 로 부모 `messageId` 획득 후 `/chat-message-comments/{messageId}/{targetId}/likeCount` 증가
5. UI는 `/likes/{uid}` 와 게시글/댓글의 데이터 경로를 실시간 구독하여 카운터를 즉시 반영

## 4.2 좋아요 취소

1. 동일한 버튼 클릭 → `toggleLikeTarget` 가 기존 스냅샷을 감지
2. `/likes/{uid}/{targetId}` 삭제
3. Cloud Functions `onDelete` 트리거 → 해당 `likeCount` 를 `ServerValue.increment(-1)`
4. UI 업데이트

# 5. 채팅/게시글/댓글별 세부 사항

## 5.1 채팅 메시지 (실시간 채팅 + 게시글 공통)

- 모든 게시글은 실질적으로 `/chat-messages/{messageId}` 엔트리이다 (`type` 필드만 다름).
- `src/routes/chat/room/+page.svelte` 와 `src/lib/components/post/PostItem.svelte` 둘 다 동일한 `PostItem`/`MessageFooter` 패턴을 사용한다.
- 사용자별 좋아요 상태는 `createRealtimeStore<UserLikesMap>(\`likes/${uid}\`)` 로 구독하여 하트 아이콘을 토글한다.
- LikedUsers 모달 (`src/lib/components/LikedUsersModal.svelte`) 은 `/chat-message-likes/{messageId}` 캐시를 읽어 좋아요한 사용자 목록을 표시한다.

## 5.2 댓글

- 댓글 데이터는 `/chat-message-comments/{messageId}/{commentId}` 에 저장된다.
- `commentId` 와 부모 메시지 매핑은 `/comment-locations/{commentId}` 에 캐싱되어 Cloud Functions가 참조한다.
- UI는 `CommentItem.svelte` (게시글 상세 페이지)에서 `toggleLikeTarget({ targetType: 'comment' })` 으로 호출하며, 댓글 좋아요 수는 `comment.likeCount ?? 0` 을 출력한다.
- 댓글 좋아요 목록이 필요할 경우 `/chat-message-comment-likes/{commentId}` 경로를 사용할 수 있으며, 구성은 채팅 메시지와 동일하다.

# 6. 클라이언트 구현 지침

1. **함수 사용**: 모든 컴포넌트는 `toggleLikeTarget` 만 사용하며 직접 `/likes`를 수정하지 않는다.
2. **pending set**: `pendingLikeTargets` Set을 사용해 중복 클릭을 방지한다 (참고: `src/routes/chat/room/+page.svelte`).
3. **구독 해제**: `createRealtimeStore` 사용 후 컴포넌트 언마운트 시 `store.unsubscribe()` 를 호출한다.
4. **컴포넌트 예시**
   - `PostItem.svelte`: 게시글 카드에서 좋아요 버튼/툴팁/카운트 UI
   - `FeedList.svelte`: 팔로잉 피드에서도 동일한 `PostItem` 을 재사용
   - `CommentItem.svelte`: 댓글 좋아요 버튼 TODO (UX 기준 동일)

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

- [ ] `npm run check` 통과
- [ ] 채팅/게시글/댓글 좋아요 추가/취소 시 `/likes` 와 `likeCount` 가 동기화되는지 확인
- [ ] 동시에 여러 사용자가 좋아요할 때 데이터 경합 없이 카운트가 증가하는지 확인
- [ ] 비로그인 상태에서 좋아요 버튼이 로그인 유도 메시지를 노출하는지 확인
- [ ] 댓글 삭제 후 `/comment-locations` 항목이 정리되는지 (Cloud Functions 시나리오) 확인

# 10. 변경 이력 (SED Log)

| 날짜 | 작성자 | 설명 |
| --- | --- | --- |
| 2025-11-18 | Codex | `sonub-chat-like.md` 내용을 통합하고 게시글/댓글 좋아요 관리사양을 추가함 |
| 2025-01-18 | Claude Code | 채팅 메시지 좋아요 기능 1차 스펙 작성 |
