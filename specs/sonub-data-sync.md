# 채팅 메시지와 게시글 양방향 동기화

## 개요

Sonub 프로젝트에서는 채팅 메시지를 게시판 글로 저장하고, 두 데이터 간의 양방향 동기화를 제공합니다.

### 핵심 개념

- **채팅 메시지 → 게시글 변환**: 채팅방에서 메시지 작성 시 카테고리를 지정하면 자동으로 게시글 노드가 생성됩니다
- **양방향 링크**: 채팅 메시지는 `postId`를 가지며, 게시글은 `roomId`와 `messageId`를 가집니다
- **양방향 동기화**: 채팅 메시지 또는 게시글의 `text`, `urls` 필드를 수정하면 상대편 노드도 자동으로 동기화됩니다
- **Cloud Functions 자동화**: 모든 동기화 로직은 Firebase Cloud Functions에서 처리되며, 클라이언트는 최소한의 데이터만 저장합니다

### 작동 원리

**소스 코드 위치**: [chat.message-sync.handler.ts.md](./repository/firebase/functions/src/handlers/chat.message-sync.handler.ts.md)

```
1. 클라이언트: 채팅 메시지 작성 시 category 필드만 저장
   ↓
2. Cloud Functions: category 필드 생성 감지
   ↓
3. Cloud Functions: /posts/{postId} 노드 생성
   ↓
4. Cloud Functions: 채팅 메시지에 postId, categoryOrder, allCategoryOrder, type 필드 추가
   ↓
5. 이후 text/urls 수정 시 양방향 자동 동기화
```

## 데이터 구조

### 채팅 메시지 노드

경로: `/chat-messages/{roomId}/{messageId}`

**소스 코드 위치**: [chat.message-sync.handler.ts.md](./repository/firebase/functions/src/handlers/chat.message-sync.handler.ts.md)

```json
{
  "senderUid": "user123",
  "text": "메시지 내용",
  "urls": ["url1", "url2"],
  "createdAt": 1234567890,

  // 카테고리 관련 필드 (클라이언트가 저장)
  "category": "qna",

  // Cloud Functions가 자동 생성하는 필드들
  "postId": "post-abc123",
  "categoryOrder": "qna-1234567890",
  "allCategoryOrder": 1234567890,
  "type": "post"
}
```

### 게시글 노드

경로: `/posts/{postId}`

**소스 코드 위치**: [chat.message-sync.handler.ts.md](./repository/firebase/functions/src/handlers/chat.message-sync.handler.ts.md)

```json
{
  "authorUid": "user123",
  "category": "qna",
  "text": "메시지 내용",
  "urls": ["url1", "url2"],
  "createdAt": 1234567890,

  // 채팅 메시지 링크 (Cloud Functions가 자동 생성)
  "roomId": "room-xyz",
  "messageId": "message-abc"
}
```

## Cloud Functions 트리거

### 1. 카테고리 필드 생성 시 게시글 노드 생성

**소스 코드 위치**: [repository/firebase/functions/src/handlers/chat.message-category.handler.ts.md](./repository/firebase/functions/src/handlers/chat.message-category.handler.ts.md)

**트리거**: `/chat-messages/{roomId}/{messageId}/category` (onValueCreated)

**처리 로직**:
1. 카테고리 유효성 검사
2. Firebase push key로 고유한 postId 생성
3. 채팅 메시지에서 text, urls, senderUid 조회
4. `/posts/{postId}` 노드 생성 (category, roomId, messageId, text, urls, createdAt, authorUid)
5. 채팅 메시지에 postId, categoryOrder, allCategoryOrder, type 필드 추가
6. Multi-path update로 원자적 업데이트
7. 전체 게시글 통계 카운터 증가 (`/stats/counters/post`)
8. 팔로워들에게 피드 fan-out

**코드 예시**:

**소스 코드 위치**: [chat.message-sync.handler.ts.md](./repository/firebase/functions/src/handlers/chat.message-sync.handler.ts.md)

```typescript
// /posts/{postId} 노드 생성을 위한 postId 생성
const postsRef = admin.database().ref("posts");
const postId = postsRef.push().key;

// Multi-path update로 한 번에 모든 데이터 업데이트
const updates = {
  [`posts/${postId}/category`]: category,
  [`posts/${postId}/roomId`]: roomId,
  [`posts/${postId}/messageId`]: messageId,
  [`posts/${postId}/text`]: text || null,
  [`posts/${postId}/urls`]: urls || null,
  [`posts/${postId}/createdAt`]: timestamp,
  [`posts/${postId}/authorUid`]: senderUid,

  [`chat-messages/${roomId}/${messageId}/categoryOrder`]: categoryOrder,
  [`chat-messages/${roomId}/${messageId}/allCategoryOrder`]: timestamp,
  [`chat-messages/${roomId}/${messageId}/type`]: "post",
  [`chat-messages/${roomId}/${messageId}/postId`]: postId,
};

await admin.database().ref().update(updates);
```

### 2. 채팅 메시지 text 수정 시 게시글 동기화

**소스 코드 위치**: [repository/firebase/functions/src/handlers/chat.message-sync.handler.ts.md](./repository/firebase/functions/src/handlers/chat.message-sync.handler.ts.md)

**트리거**: `/chat-messages/{roomId}/{messageId}/text` (onValueUpdated)

**처리 로직**:
1. 채팅 메시지에서 postId 조회
2. postId가 있으면 (게시글로 저장된 메시지인 경우)
3. `/posts/{postId}/text`를 동일한 값으로 업데이트
4. postId가 없으면 일반 채팅 메시지이므로 동기화 스킵

**코드 예시**:

**소스 코드 위치**: [chat.message-sync.handler.ts.md](./repository/firebase/functions/src/handlers/chat.message-sync.handler.ts.md)

```typescript
export async function handleChatMessageTextUpdate(
  roomId: string,
  messageId: string,
  newText: string | null
): Promise<void> {
  // postId 조회
  const messageRef = admin.database().ref(`chat-messages/${roomId}/${messageId}/postId`);
  const postIdSnapshot = await messageRef.once("value");
  const postId = postIdSnapshot.val();

  if (!postId) {
    return; // 일반 채팅 메시지 - 동기화 불필요
  }

  // 게시글 text 업데이트
  const postTextRef = admin.database().ref(`posts/${postId}/text`);
  await postTextRef.set(newText);
}
```

### 3. 채팅 메시지 urls 수정 시 게시글 동기화

**소스 코드 위치**: [repository/firebase/functions/src/handlers/chat.message-sync.handler.ts.md](./repository/firebase/functions/src/handlers/chat.message-sync.handler.ts.md)

**트리거**: `/chat-messages/{roomId}/{messageId}/urls` (onValueUpdated)

**처리 로직**: text 동기화와 동일, urls 필드 대상

### 4. 게시글 text 수정 시 채팅 메시지 동기화

**소스 코드 위치**: [repository/firebase/functions/src/handlers/chat.message-sync.handler.ts.md](./repository/firebase/functions/src/handlers/chat.message-sync.handler.ts.md)

**트리거**: `/posts/{postId}/text` (onValueUpdated)

**처리 로직**:
1. 게시글에서 roomId, messageId 조회
2. roomId, messageId가 있으면
3. `/chat-messages/{roomId}/{messageId}/text`를 동일한 값으로 업데이트
4. roomId, messageId가 없으면 채팅 메시지와 연결되지 않은 독립 게시글

**코드 예시**:

**소스 코드 위치**: [chat.message-sync.handler.ts.md](./repository/firebase/functions/src/handlers/chat.message-sync.handler.ts.md)

```typescript
export async function handlePostTextUpdate(
  postId: string,
  newText: string | null
): Promise<void> {
  // roomId, messageId 조회
  const postRef = admin.database().ref(`posts/${postId}`);
  const postSnapshot = await postRef.once("value");
  const postData = postSnapshot.val();

  const { roomId, messageId } = postData;

  if (!roomId || !messageId) {
    return; // 독립 게시글 - 동기화 불필요
  }

  // 채팅 메시지 text 업데이트
  const messageTextRef = admin.database().ref(`chat-messages/${roomId}/${messageId}/text`);
  await messageTextRef.set(newText);
}
```

### 5. 게시글 urls 수정 시 채팅 메시지 동기화

**소스 코드 위치**: [repository/firebase/functions/src/handlers/chat.message-sync.handler.ts.md](./repository/firebase/functions/src/handlers/chat.message-sync.handler.ts.md)

**트리거**: `/posts/{postId}/urls` (onValueUpdated)

**처리 로직**: text 동기화와 동일, urls 필드 대상

## Firebase Database Security Rules

### 채팅 메시지 필드 권한

**소스 코드 위치**: [chat.message-sync.handler.ts.md](./repository/firebase/functions/src/handlers/chat.message-sync.handler.ts.md)

```json
"chat-messages": {
  "$roomId": {
    "$messageId": {
      // 🔒 Cloud Functions 전용 필드 (클라이언트 수정 불가)
      "postId": {
        ".validate": "!newData.exists() || (data.exists() && newData.val() == data.val())"
      },
      "categoryOrder": {
        ".validate": "!newData.exists() || (data.exists() && newData.val() == data.val())"
      },
      "allCategoryOrder": {
        ".validate": "!newData.exists() || (data.exists() && newData.val() == data.val())"
      },
      "type": {
        ".validate": "!newData.exists() || (data.exists() && newData.val() == data.val())"
      },

      // ✅ 클라이언트가 생성/수정 가능한 필드
      "category": {
        ".validate": "!newData.exists() || (newData.isString() && [valid categories...])"
      }
    }
  }
}
```

### 게시글 권한

**소스 코드 위치**: [chat.message-sync.handler.ts.md](./repository/firebase/functions/src/handlers/chat.message-sync.handler.ts.md)

```json
"posts": {
  "$postId": {
    ".read": "true",
    ".write": "[본인 작성자이며, 90분 이내 수정 가능 등의 규칙]"
  }
}
```

## 클라이언트 사용법

### 1. 채팅 메시지를 게시글로 저장

**소스 코드 위치**: [chat.message-sync.handler.ts.md](./repository/firebase/functions/src/handlers/chat.message-sync.handler.ts.md)

```typescript
import { ref, set } from 'firebase/database';
import { database } from '$lib/firebase';

// 채팅 메시지 작성
const messageRef = ref(database, `chat-messages/${roomId}/${messageId}`);
await set(messageRef, {
  senderUid: currentUser.uid,
  text: "메시지 내용",
  urls: ["url1", "url2"],
  createdAt: Date.now(),

  // ✅ 카테고리만 지정 - Cloud Functions가 나머지 처리
  category: "qna"
});

// Cloud Functions가 자동으로:
// 1. /posts/{postId} 노드 생성
// 2. postId, categoryOrder, allCategoryOrder, type 필드 추가
// 3. stats/counters/post 증가
// 4. 팔로워들에게 피드 전파
```

### 2. 채팅 메시지 수정 시 자동 동기화

**소스 코드 위치**: [chat.message-sync.handler.ts.md](./repository/firebase/functions/src/handlers/chat.message-sync.handler.ts.md)

```typescript
import { ref, update } from 'firebase/database';
import { database } from '$lib/firebase';

// 채팅 메시지 text 수정
const messageTextRef = ref(database, `chat-messages/${roomId}/${messageId}/text`);
await update(messageTextRef, "수정된 내용");

// Cloud Functions가 자동으로 /posts/{postId}/text도 동기화
```

### 3. 게시글 수정 시 자동 동기화

**소스 코드 위치**: [chat.message-sync.handler.ts.md](./repository/firebase/functions/src/handlers/chat.message-sync.handler.ts.md)

```typescript
import { ref, update } from 'firebase/database';
import { database } from '$lib/firebase';

// 게시글 text 수정
const postTextRef = ref(database, `posts/${postId}/text`);
await update(postTextRef, "수정된 내용");

// Cloud Functions가 자동으로 /chat-messages/{roomId}/{messageId}/text도 동기화
```

## 무한 루프 방지

양방향 동기화에서 무한 루프가 발생하지 않도록 다음과 같이 설계되었습니다:

1. **채팅 메시지 text 수정** → Cloud Functions가 게시글 text 업데이트 → 게시글 text 트리거 발동
2. **게시글 text 트리거 핸들러** → roomId/messageId 조회 → 채팅 메시지 text 업데이트 시도
3. **Firebase가 자동 처리**: 동일한 값으로 업데이트하는 경우 onValueUpdated 트리거가 발동하지 않음
4. **루프 종료**: 값이 동일하므로 트리거가 더 이상 발동하지 않음

## 카테고리 목록

유효한 카테고리 값 (공유 파일: `shared/categories.ts`):

- `discussion` - 자유 토론
- `qna` - 질문과 답변
- `news` - 뉴스
- `info` - 정보 공유
- `selling` - 판매
- `hiring` - 구인구직
- `travel` - 여행
- `mukbang` - 먹방
- `realestate` - 부동산
- `hobby` - 취미
- `story` - 사연

## 파일 구조

**소스 코드 위치**: [chat.message-sync.handler.ts.md](./repository/firebase/functions/src/handlers/chat.message-sync.handler.ts.md)

```
firebase/
  functions/
    src/
      handlers/
        chat.message-category.handler.ts  # 카테고리 생성/수정/삭제 핸들러
        chat.message-sync.handler.ts      # 양방향 동기화 핸들러 (신규)
      index.ts                             # Cloud Functions 트리거 등록
      types/
        index.ts                           # TypeScript 타입 정의
  database.rules.json                      # Firebase Database Security Rules

shared/
  categories.ts                            # 카테고리 정의 및 유틸 함수

src/
  lib/
    components/
      chat/
        [카테고리 선택 UI 컴포넌트]       # TODO: 구현 예정
```

## 제약사항 및 참고사항

1. **카테고리 수정**:
   - 카테고리를 수정해도 `categoryOrder`는 변경되지 않습니다
   - 작성 시간과 정렬 순서를 유지하기 위함

2. **카테고리 삭제**:
   - 카테고리를 삭제하면 `categoryOrder`, `allCategoryOrder`, `type` 필드도 모두 삭제됩니다
   - 게시글에서 일반 채팅 메시지로 전환됩니다

3. **수정 제한**:
   - 게시글/채팅 메시지는 작성 후 90분 이내에만 수정 가능합니다 (Firebase Security Rules)
   - 본인이 작성한 글만 수정 가능합니다

4. **동기화 범위**:
   - `text`와 `urls` 필드만 양방향 동기화됩니다
   - 다른 필드 (category, createdAt 등)는 동기화되지 않습니다

## 테스트 시나리오

### 시나리오 1: 채팅 메시지를 게시글로 저장

1. 채팅방에서 메시지 작성 시 카테고리 "qna" 선택
2. 클라이언트가 `/chat-messages/{roomId}/{messageId}` 노드에 category 필드 저장
3. Cloud Functions가 `/posts/{postId}` 노드 생성
4. Cloud Functions가 채팅 메시지에 postId, categoryOrder, allCategoryOrder, type 필드 추가
5. 게시판 목록에서 해당 게시글 확인 가능

### 시나리오 2: 채팅 메시지 수정 시 게시글 동기화

1. 채팅방에서 메시지 text 수정
2. Cloud Functions가 자동으로 게시글 text도 동일하게 수정
3. 게시판에서 수정된 내용 확인 가능

### 시나리오 3: 게시글 수정 시 채팅 메시지 동기화

1. 게시판에서 게시글 text 수정
2. Cloud Functions가 자동으로 채팅 메시지 text도 동일하게 수정
3. 채팅방에서 수정된 내용 확인 가능

### 시나리오 4: 무한 루프 방지 확인

1. 채팅 메시지 text 수정 → 게시글 text 업데이트 트리거
2. 게시글 text 업데이트 → 채팅 메시지 text 업데이트 트리거 시도
3. Firebase가 동일한 값이므로 트리거 발동 안 함
4. 루프 종료 확인

## 관련 문서

- [Sonub Forum Post 스펙](./sonub-forum-post.md) - 게시글 데이터 구조 및 로직
- [Sonub Chat Room 스펙](./sonub-chat-room.md) - 채팅방 데이터 구조 및 로직
- [Firebase Database Rules 스펙](./repository/firebase/database.rules.json.md) - 보안 규칙 상세

## 버전 정보

- 작성일: 2025-11-18
- 최종 수정일: 2025-11-18
- 작성자: Claude (SED Agent)
