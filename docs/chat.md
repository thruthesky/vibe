# 채팅 기능 문서

1:1 채팅 기능에 대한 상세 문서입니다.

---

## 📋 목차

1. [개요](#개요)
2. [데이터 구조](#데이터-구조)
3. [API 함수](#api-함수)
4. [페이지/라우트](#페이지라우트)
5. [Firebase Realtime Database 구조](#firebase-realtime-database-구조)
6. [사용 예제](#사용-예제)
7. [무한 스크롤 (Infinite Scroll) 구현 가이드라인](#무한-스크롤-infinite-scroll-구현-가이드라인)
8. [보안 고려사항](#보안-고려사항)

---

## 개요

Vibe 프로젝트의 **채팅 시스템**은 다음 기술 스택을 활용합니다:

- **Firebase Authentication**: 사용자 인증
- **Firebase Realtime Database (RTDB)**: 채팅 메시지 및 채팅방 정보 저장

**⚠️ 중요**: 모든 채팅 관련 데이터는 Firebase Realtime Database의 **`/{ROOT_FOLDER}/chat/`** 경로 아래에 저장됩니다. `ROOT_FOLDER`는 프로젝트 설정 상수로, 현재 기본값은 `"vibe"`입니다 (실제 경로: `/{ROOT_FOLDER}/chat/`).

### 핵심 개념

- **채팅방 ID (roomId)**: 1:1 채팅에서는 `uid1---uid2` 형식 (알파벳 순서로 정렬된 두 UID를 `---`로 연결)
- **메시지**: 발신자, 메시지 내용, 전송 시간 포함
- **실시간 동기화**: Firebase의 `onValue` 함수를 사용한 실시간 메시지 수신

### 실시간 업데이트 요구사항

**⚠️ 중요: 모든 채팅 관련 데이터는 실시간으로 업데이트되어야 합니다.**

1. **채팅 메시지 실시간 반영**
   - 다른 사용자가 메시지를 보내면 즉시 화면에 표시
   - Firebase RTDB의 `onValue()` 리스너 사용

2. **채팅방 목록 실시간 업데이트**
   - 사용자가 채팅방 목록을 보고 있을 때, 다른 사용자가 메시지를 보내면 마지막 메시지가 즉시 업데이트
   - 새로운 채팅방이 생성되면 목록에 즉시 추가
   - `/{ROOT_FOLDER}/chat/joins/<myUid>` 경로를 실시간으로 구독

3. **채팅방 입장/나가기 실시간 반영**
   - 그룹 채팅에서 사용자가 입장하거나 나가면 즉시 반영
   - 참여자 목록 실시간 업데이트

4. **메모리 관리**
   - 컴포넌트 언마운트 시 리스너를 반드시 제거하여 메모리 누수 방지
   - `useEffect` cleanup 함수에서 `off()` 또는 리스너 해제 함수 호출

### 1:1 채팅 vs 그룹 채팅

채팅 시스템에는 **1:1 채팅방**과 **그룹 채팅방** 두 가지 유형이 있습니다.

**1:1 채팅방 (현재 구현)**:
- `/{ROOT_FOLDER}/chat/joins/<login-uid>/<room-id>`에서 채팅방 참여 정보 관리
- `roomId`에 사용자 정보가 포함되어 있어 `users` 필드 불필요
- `/{ROOT_FOLDER}/chat/rooms`를 참조하지 않음
- 채팅방 목록은 `/{ROOT_FOLDER}/chat/joins/<myUid>` 하위 경로에서 `singleOrder` 필드로 정렬하여 조회

**그룹 채팅방 (향후 구현)**:
- `/{ROOT_FOLDER}/chat/rooms/<room-id>`에 채팅방 정보 저장
- `users` 필드로 참여 사용자 관리
- 3명 이상 참여 가능
- `/{ROOT_FOLDER}/chat/joins`와 `/{ROOT_FOLDER}/chat/rooms` 모두 사용
- 채팅방 목록은 `/{ROOT_FOLDER}/chat/joins/<myUid>` 하위 경로에서 `groupOrder` 필드로 정렬하여 조회

**오픈 채팅방 (그룹 채팅의 특수 유형)**:
- `open: true` 속성을 가진 그룹 채팅방
- 오픈 채팅방 목록에 공개적으로 표시됨
- 누구나 입장 가능 (비밀번호 미설정 시)
- `/{ROOT_FOLDER}/chat/rooms`에서 `open: true` 필터링으로 조회

**비밀번호 보호 채팅방**:
- `password` 속성이 설정된 채팅방
- 사용자가 입장 시 비밀번호 입력 필요
- 비밀번호가 일치해야만 채팅방 입장 가능
- 1:1 채팅방과 그룹 채팅방 모두에 적용 가능

---

## 데이터 구조

### 채팅 메시지 인터페이스

```typescript
interface ChatMessage {
  sender: string;              // 발신자 UID
  senderName: string;          // 발신자 표시 이름
  text: string;                // 메시지 내용
  sentAt: number;              // 전송 시간 (Unix timestamp, 밀리초)
  messageId?: string;          // Firebase가 생성한 메시지 ID
}
```

### 채팅방 참여 정보 인터페이스 (모든 채팅방)

**경로**: `/{ROOT_FOLDER}/chat/joins/<login-uid>/<room-id>`

```typescript
interface ChatJoin {
  roomId: string;                  // 채팅방 ID (1:1 채팅: uid1---uid2, 그룹 채팅: group-xxx)
  createdAt: number;               // 채팅방 생성 시간
  lastMessage?: string;            // 마지막 메시지 내용
  lastMessageSentAt?: number;      // 마지막 메시지 전송 시간
  order?: number;                  // 전체 채팅방 정렬용 (Firebase Cloud Functions 자동 업데이트)
  singleOrder?: number;            // 1:1 채팅방만 정렬용 (Firebase Cloud Functions 자동 업데이트)
  groupOrder?: number;             // 그룹 채팅방만 정렬용 (Firebase Cloud Functions 자동 업데이트)
}
```

**설명**:
- `/{ROOT_FOLDER}/chat/joins`는 **1:1 채팅뿐만 아니라 모든 채팅방 입장 정보를 담음**
- 사용자가 입장한 모든 채팅방의 relation 정보 저장
- `users` 필드는 없음 (1:1 채팅의 경우 roomId에 `<myUid---otherUid>` 형식으로 사용자 정보가 포함됨)
- 로그인한 사용자의 채팅방 목록을 `/{ROOT_FOLDER}/chat/joins/<myUid>` 경로에서 조회

**정렬 필드 (Firebase Cloud Functions 자동 관리)**:
- `order`: 모든 채팅방을 함께 정렬할 때 사용
- `singleOrder`: 1:1 채팅방만 따로 목록할 때 사용 (1:1 채팅방인 경우에만 `order`와 동일한 값 저장)
- `groupOrder`: 그룹 채팅방만 따로 목록할 때 사용 (그룹 채팅방인 경우에만 `order`와 동일한 값 저장)
- ⚠️ **중요**: 이 정렬 필드들은 Firebase Cloud Functions에서 자동으로 업데이트되므로 React.js 클라이언트에서 직접 업데이트할 필요 없음

### 그룹 채팅방 정보 인터페이스

**경로**: `/{ROOT_FOLDER}/chat/rooms/<room-id>` (그룹 채팅 전용)

```typescript
interface ChatRoom {
  roomId: string;                  // 채팅방 ID
  users: string[];                 // 참여 사용자 UID 배열 (그룹 채팅에서만 사용)
  createdAt: number;               // 채팅방 생성 시간
  lastMessage?: string;            // 마지막 메시지 내용
  lastMessageSentAt?: number;      // 마지막 메시지 전송 시간
  open?: boolean;                  // 오픈 채팅방 여부 (true면 오픈 채팅방 목록에 표시)
  password?: string;               // 채팅방 비밀번호 (설정 시 입장에 비밀번호 필요)
}
```

**설명**:
- `/{ROOT_FOLDER}/chat/rooms`는 **그룹 채팅 전용**
- `users` 필드로 어떤 사용자가 채팅방에 입장해 있는지 관리
- `open` 속성이 `true`면 **오픈 채팅방** 목록에 표시됨
- `password` 속성이 설정되면 입장 시 비밀번호 입력 필요

### RTDB 구조

```
/{ROOT_FOLDER}/chat/
├── messages/                     # 모든 채팅 메시지 (1:1 및 그룹)
│   └── <room-id>/                # 예: "abc123xyz---def456uvw" (1:1) 또는 "group-abc123" (그룹)
│       └── <message-id>/         # Firebase가 자동 생성
│           ├── sender: "abc123xyz"
│           ├── senderName: "홍길동"
│           ├── text: "안녕하세요!"
│           └── sentAt: 1698473000000
│
├── joins/                        # 사용자별 채팅방 참여 목록 (모든 채팅방)
│   └── <login-uid>/              # 로그인한 사용자 UID
│       └── <room-id>/            # 참여한 채팅방 ID
│           ├── roomId: "abc123xyz---def456uvw"
│           ├── createdAt: 1698473000000
│           ├── lastMessage: "안녕하세요!"
│           ├── lastMessageSentAt: 1698473000000
│           ├── order: 1698473000000
│           ├── singleOrder: 1698473000000  # 1:1 채팅방인 경우에만
│           └── groupOrder: 1698473000000   # 그룹 채팅방인 경우에만
│
└── rooms/                        # 그룹 채팅방 정보 (그룹 채팅 전용)
    └── <room-id>/                # 그룹 채팅방 ID
        ├── roomId: "group-abc123"
        ├── users: ["abc123xyz", "def456uvw", "ghi789rst"]
        ├── createdAt: 1698473000000
        ├── lastMessage: "안녕하세요!"
        ├── lastMessageSentAt: 1698473000000
        ├── open: true            # 오픈 채팅방 (선택)
        └── password: "secret123" # 비밀번호 보호 (선택)
```

**구조 설명**:

1. **`/{ROOT_FOLDER}/chat/messages/<room-id>`**
   - 모든 채팅 메시지 저장 (1:1 및 그룹 공통)
   - 필드: `sender`, `senderName`, `text`, `sentAt`

2. **`/{ROOT_FOLDER}/chat/joins/<login-uid>/<room-id>`** (모든 채팅방)
   - 사용자가 입장한 모든 채팅방의 참여 정보 (relation)
   - 1:1 채팅뿐만 아니라 그룹 채팅 입장 정보도 포함
   - 필드: `roomId`, `createdAt`, `lastMessage`, `lastMessageSentAt`, `order`, `singleOrder`, `groupOrder`
   - **`users` 필드 없음** (1:1 채팅의 경우 roomId에 `<myUid---otherUid>` 형식으로 포함)
   - **정렬 필드**:
     - `order`: 모든 채팅방 함께 정렬
     - `singleOrder`: 1:1 채팅방만 정렬 (1:1 채팅방인 경우 `order`와 동일한 값)
     - `groupOrder`: 그룹 채팅방만 정렬 (그룹 채팅방인 경우 `order`와 동일한 값)
   - ⚠️ 정렬 필드는 **Firebase Cloud Functions에서 자동 업데이트**

3. **`/{ROOT_FOLDER}/chat/rooms/<room-id>`** (그룹 채팅 전용)
   - 그룹 채팅방 정보만 저장
   - 필드: `roomId`, `users`, `createdAt`, `lastMessage`, `lastMessageSentAt`, `open`, `password`
   - `users` 필드로 어떤 사용자가 채팅방에 입장해 있는지 관리
   - `open: true`이면 오픈 채팅방 목록에 표시
   - `password`가 설정되면 입장 시 비밀번호 필요

### Firebase Cloud Functions 자동 업데이트

**⚠️ 중요: 다음 필드들은 Firebase Cloud Functions에서 자동으로 관리되므로 React.js 클라이언트에서 직접 업데이트하지 마세요.**

**자동 업데이트되는 필드**:

1. **`/{ROOT_FOLDER}/chat/joins/<uid>/<roomId>/order`**
   - 모든 채팅방을 함께 정렬할 때 사용하는 시간 값
   - 메시지가 전송될 때마다 자동 업데이트

2. **`/{ROOT_FOLDER}/chat/joins/<uid>/<roomId>/singleOrder`**
   - 1:1 채팅방만 따로 목록할 때 사용하는 시간 값
   - 1:1 채팅방인 경우에만 `order`와 동일한 값으로 자동 저장
   - 그룹 채팅방인 경우 이 필드는 존재하지 않음

3. **`/{ROOT_FOLDER}/chat/joins/<uid>/<roomId>/groupOrder`**
   - 그룹 채팅방만 따로 목록할 때 사용하는 시간 값
   - 그룹 채팅방인 경우에만 `order`와 동일한 값으로 자동 저장
   - 1:1 채팅방인 경우 이 필드는 존재하지 않음

**사용 예시**:

```typescript
// ✅ 올바른 방법: Firebase Cloud Functions가 자동 업데이트
// 클라이언트는 메시지만 전송
await sendMessage(roomId, senderId, senderName, text);
// → Cloud Functions가 order, singleOrder, groupOrder 자동 업데이트

// ❌ 잘못된 방법: 클라이언트에서 직접 업데이트하지 마세요
// set(ref(rtdb, `/{ROOT_FOLDER}/chat/joins/${uid}/${roomId}/order`), Date.now());
```

### 메시지 전송 시 클라이언트와 Cloud Functions 역할 분담

**⚠️ 중요: 클라이언트는 최소한의 데이터만 전송하고, Firebase Cloud Functions가 나머지를 자동으로 처리합니다.**

#### 1. 클라이언트 (React.js) 역할

사용자가 메시지를 전송하면, **오직 2개의 필드만 저장**합니다:

```typescript
// A가 B에게 메시지 전송
await sendMessage(roomId, senderUid, text);

// 저장되는 데이터 (/{ROOT_FOLDER}/chat/messages/A---B/{messageId}):
{
  text: "안녕하세요",
  senderUid: "userA"
}
```

#### 2. Firebase Cloud Functions 역할

메시지가 저장되면 Cloud Functions가 자동으로 다음 작업을 수행합니다:

**Step 1: 메시지에 `sentAt` 추가**
```
/{ROOT_FOLDER}/chat/messages/A---B/{messageId}:
  text: "안녕하세요"
  senderUid: "userA"
  sentAt: 1234567890  ← Cloud Functions가 자동 추가
```

**Step 2: 양쪽 사용자의 `chat/joins` 업데이트**

```
/{ROOT_FOLDER}/chat/joins/userA/A---B:
  id: "A---B"
  text: "안녕하세요"
  sentAt: 1234567890
  senderUid: "userA"
  otherName: "B의이름"           ← 상대방 이름 (채팅방 목록에 표시)
  otherName_LowerCase: "b의이름"  ← 대소문자 구분 없이 검색용
  order: 101234567890            ← "10" + timestamp (정렬용)
  singleOrder: 101234567890      ← 1:1 채팅 정렬용
  unread: 0                      ← 발신자는 0

/{ROOT_FOLDER}/chat/joins/userB/A---B:
  id: "A---B"
  text: "안녕하세요"
  sentAt: 1234567890
  senderUid: "userA"
  otherName: "A의이름"           ← 상대방 이름
  otherName_LowerCase: "a의이름"
  order: 101234567890            ← 동일한 timestamp
  singleOrder: 101234567890
  unread: 1                      ← 수신자는 +1
```

**`order` 필드에 "10" prefix를 사용하는 이유**:
- 일반 timestamp: `1234567890` (현재 시간)
- "10" prefix: `101234567890` (미래 시간)
- 채팅방 목록을 `order` 내림차순 정렬하면 새 메시지가 있는 채팅방이 맨 위에 표시됨

**`otherName` 필드가 중요한 이유**:
- A가 메시지를 보내든 B가 보내든, **각 사용자는 항상 상대방 이름을 봐야 함**
- `chat/joins/A/A---B`에는 B의 이름 저장
- `chat/joins/B/A---B`에는 A의 이름 저장
- 채팅방 목록에서 "누구와 대화 중"인지 바로 표시 가능

**Step 3: unread 카운트 관리**

성능 향상을 위해 **3곳에 중복 저장**합니다:

```
1. /{ROOT_FOLDER}/chat/joins/{uid}/{roomId}/unread
   - 채팅방별 읽지 않은 메시지 수

2. /{ROOT_FOLDER}/chat/join-props/{uid}/unread/{roomId}
   - 성능 최적화용 (빠른 조회)

3. /{ROOT_FOLDER}/users/{uid}/chatUnreadCount
   - 사용자 전체 읽지 않은 메시지 총합
   - chat/join-props/{uid}/unread/ 하위 모든 값의 합계
```

**예시**:
```
사용자 B가 3개 채팅방에서 읽지 않은 메시지가 있는 경우:

/{ROOT_FOLDER}/chat/join-props/userB/unread:
  A---B: 5      ← A와의 채팅방: 5개 안 읽음
  C---B: 2      ← C와의 채팅방: 2개 안 읽음
  D---B: 3      ← D와의 채팅방: 3개 안 읽음

/{ROOT_FOLDER}/users/userB:
  chatUnreadCount: 10  ← 총 10개 (5 + 2 + 3)
```

---

## API 함수

모든 채팅 관련 함수는 `/lib/chat.ts`에 정의되어 있습니다.

### generateRoomId()

**두 사용자 간 채팅방 ID를 생성합니다.**

```typescript
function generateRoomId(uid1: string, uid2: string): string
```

**매개변수**:
- `uid1` (string): 첫 번째 사용자 UID
- `uid2` (string): 두 번째 사용자 UID

**반환값**:
- `string`: 생성된 채팅방 ID (알파벳 순서로 정렬된 형식)

**예시**:
```typescript
const roomId = generateRoomId("user123", "user456");
// 결과: "user123---user456" 또는 "user456---user123" (알파벳 순서)
```

---

### joinChatRoom()

**1:1 채팅방에 입장합니다.**

⚠️ **주의**: 본인(`myUid`)의 `chat/joins`에만 저장하고, 상대방에게는 아무것도 생성하지 않습니다. 상대방의 `chat/joins`는 Firebase Cloud Functions가 메시지 전송 시 자동으로 생성합니다.

```typescript
async function joinChatRoom(
  myUid: string,
  otherUid: string,
  otherDisplayName: string
): Promise<{ success: boolean; roomId?: string; error?: string }>
```

**매개변수**:
- `myUid` (string): 현재 사용자 UID
- `otherUid` (string): 상대방 사용자 UID
- `otherDisplayName` (string): 상대방 표시 이름

**반환값**:
- `success` (boolean): 성공 여부
- `roomId` (string): 생성된 채팅방 ID
- `error` (string): 오류 메시지 (선택)

**저장 위치**: `/{ROOT_FOLDER}/chat/joins/<myUid>/<roomId>`

**저장되는 데이터**:
```typescript
{
  roomId: "myUid---otherUid",
  createdAt: timestamp,
  order: timestamp,
  displayName: otherDisplayName  // 상대방 이름
}
```

**사용 예제**:
```typescript
// A가 B와 채팅 시작
const result = await joinChatRoom("userA", "userB", "B의이름");
if (result.success) {
  console.log("채팅방 ID:", result.roomId); // "userA---userB"
  // → /chat/joins/userA/userA---userB 생성됨 ✅
  // → /chat/joins/userB/userA---userB 생성 안 됨 ❌ (메시지 전송 시 자동 생성)
}
```

---

### sendMessage()

**채팅 메시지를 전송하고 RTDB에 저장합니다.**

```typescript
async function sendMessage(
  roomId: string,
  sender: string,
  senderName: string,
  text: string
): Promise<{ success: boolean; messageId?: string; error?: string }>
```

**매개변수**:
- `roomId` (string): 채팅방 ID
- `sender` (string): 발신자 UID
- `senderName` (string): 발신자 표시 이름
- `text` (string): 메시지 내용

**반환값**:
- `success` (boolean): 전송 성공 여부
- `messageId` (string): Firebase가 생성한 메시지 ID
- `error` (string): 오류 메시지 (선택)

**저장 위치**: `/{ROOT_FOLDER}/chat/messages/<room-id>/<message-id>`

**사용 예제**:
```typescript
const result = await sendMessage(
  "abc123xyz---def456uvw",
  "user123",
  "홍길동",
  "안녕하세요!"
);
if (result.success) {
  console.log("메시지 ID:", result.messageId);
}
```

---

### getMessages()

**채팅방의 모든 메시지를 조회합니다.**

```typescript
async function getMessages(roomId: string): Promise<ChatMessage[]>
```

**매개변수**:
- `roomId` (string): 채팅방 ID

**반환값**:
- `ChatMessage[]`: 타임스탬프 기준으로 정렬된 메시지 배열

**조회 위치**: `/{ROOT_FOLDER}/chat/messages/<room-id>`

**사용 예제**:
```typescript
const messages = await getMessages("abc123xyz---def456uvw");
messages.forEach((msg) => {
  console.log(`${msg.senderName}: ${msg.text}`);
});
```

---

### subscribeToMessages()

**채팅방의 메시지를 실시간으로 구독합니다.**

```typescript
function subscribeToMessages(
  roomId: string,
  callback: (messages: ChatMessage[]) => void
): Unsubscribe | null
```

**매개변수**:
- `roomId` (string): 채팅방 ID
- `callback` (function): 메시지 변경 시 호출할 콜백 함수

**반환값**:
- `Unsubscribe`: 구독 해제 함수

**사용 예제**:
```typescript
const unsubscribe = subscribeToMessages(
  "abc123xyz---def456uvw",
  (messages) => {
    console.log("업데이트된 메시지:", messages);
  }
);

// 나중에 구독 해제
if (unsubscribe) {
  unsubscribe();
}
```

---

### getUserChatRooms()

**사용자의 채팅방 목록을 조회합니다.**

```typescript
async function getUserChatRooms(uid: string): Promise<ChatRoom[]>
```

**매개변수**:
- `uid` (string): 사용자 UID

**반환값**:
- `ChatRoom[]`: 사용자가 참여 중인 채팅방 배열 (최신순 정렬)

**조회 위치**: `/{ROOT_FOLDER}/chat/rooms`

**사용 예제**:
```typescript
const rooms = await getUserChatRooms("user123");
rooms.forEach((room) => {
  console.log(`마지막 메시지: ${room.lastMessage}`);
});
```

---

### getChatRoom()

**채팅방 정보를 조회합니다.**

```typescript
async function getChatRoom(roomId: string): Promise<ChatRoom | null>
```

**매개변수**:
- `roomId` (string): 채팅방 ID

**반환값**:
- `ChatRoom | null`: 채팅방 정보 또는 null

**조회 위치**: `/{ROOT_FOLDER}/chat/rooms/<room-id>`

**사용 예제**:
```typescript
const room = await getChatRoom("abc123xyz---def456uvw");
if (room) {
  console.log("채팅방 생성 시간:", new Date(room.createdAt));
}
```

---

## 페이지/라우트

### `/chat/room` - 1:1 채팅방

- **파일**: `/app/chat/room/page.tsx`
- **기능**: 두 사용자 간의 실시간 채팅
- **입력**: 쿼리 파라미터 `otherId` (상대방 UID)
- **접근 제한**: 로그인한 사용자만 가능
- **UI 구성**:
  - **상단**: 상대방 이름, 돌아가기 버튼
  - **중앙**: 메시지 목록 (실시간 업데이트)
  - **하단**: 메시지 입력 박스 + 전송 버튼

**라우트 예시**:
```
/chat/room?otherId=def456uvw
```

---

## Firebase Realtime Database 구조

### `/{ROOT_FOLDER}/chat/messages/<room-id>`

**용도**: 특정 채팅방의 모든 메시지 저장 (1:1 및 그룹 공통)

**데이터 타입**: Object (메시지 ID를 키로 하는 객체)

**예시**:
```json
{
  "-MZo1234567": {
    "sender": "abc123xyz",
    "senderName": "홍길동",
    "text": "안녕하세요!",
    "sentAt": 1698473000000
  },
  "-MZo1234568": {
    "sender": "def456uvw",
    "senderName": "김유신",
    "text": "안녕하세요! 잘 지내세요?",
    "sentAt": 1698473010000
  }
}
```

### `/{ROOT_FOLDER}/chat/joins/<login-uid>/<room-id>`

**용도**: 로그인한 사용자의 채팅방 참여 목록 (모든 채팅방)

**데이터 타입**: Object

**예시 (1:1 채팅방)**:
```json
{
  "abc123xyz---def456uvw": {
    "roomId": "abc123xyz---def456uvw",
    "createdAt": 1698473000000,
    "lastMessage": "안녕하세요! 잘 지내세요?",
    "lastMessageSentAt": 1698473010000,
    "order": 1698473010000,
    "singleOrder": 1698473010000
  }
}
```

**예시 (그룹 채팅방)**:
```json
{
  "group-abc123": {
    "roomId": "group-abc123",
    "createdAt": 1698473000000,
    "lastMessage": "그룹 채팅 메시지",
    "lastMessageSentAt": 1698473020000,
    "order": 1698473020000,
    "groupOrder": 1698473020000
  }
}
```

**설명**:
- 1:1 채팅뿐만 아니라 모든 채팅방 입장 정보 포함
- `users` 필드 없음 (1:1 채팅의 경우 roomId에 사용자 정보 포함)
- `order`, `singleOrder`, `groupOrder`는 Firebase Cloud Functions에서 자동 업데이트
- 1:1 채팅방은 `singleOrder`만, 그룹 채팅방은 `groupOrder`만 존재

### `/{ROOT_FOLDER}/chat/rooms/<room-id>`

**용도**: 그룹 채팅방 정보 저장 (그룹 채팅 전용)

**데이터 타입**: Object

**예시 (일반 그룹 채팅방)**:
```json
{
  "roomId": "group-abc123",
  "users": ["abc123xyz", "def456uvw", "ghi789rst"],
  "createdAt": 1698473000000,
  "lastMessage": "안녕하세요! 잘 지내세요?",
  "lastMessageSentAt": 1698473010000
}
```

**예시 (오픈 채팅방)**:
```json
{
  "roomId": "group-open-xyz789",
  "users": ["abc123xyz", "def456uvw", "ghi789rst", "jkl012mno"],
  "createdAt": 1698473000000,
  "lastMessage": "오픈 채팅방입니다!",
  "lastMessageSentAt": 1698473020000,
  "open": true
}
```

**예시 (비밀번호 보호 채팅방)**:
```json
{
  "roomId": "group-private-pqr345",
  "users": ["abc123xyz", "def456uvw"],
  "createdAt": 1698473000000,
  "lastMessage": "비밀 채팅방",
  "lastMessageSentAt": 1698473030000,
  "password": "mySecret123"
}
```

**설명**:
- 그룹 채팅에서만 사용
- `users` 필드로 참여 사용자 관리
- `open: true`이면 오픈 채팅방 목록에 표시됨
- `password`가 설정되면 입장 시 비밀번호 입력 필요

---

## 사용 예제

### 예제 1: 회원 목록에서 사용자 클릭 → 채팅방 이동

**흐름**:
```
1. 회원 목록 페이지 (`/users`) 방문
2. 특정 사용자 행 클릭
3. `/chat/room?otherId=<uid>` 로 이동
4. 채팅방 페이지에서 자동으로 채팅방 생성 (기존 있으면 사용)
5. 기존 메시지 로드 후 실시간 구독 시작
6. 메시지 입력 및 전송 가능
7. 돌아가기 버튼 클릭 시 회원 목록으로 돌아감
```

### 예제 2: 메시지 전송 (개발자용)

```typescript
import { sendMessage } from "@/lib/chat";

// 메시지 전송
const result = await sendMessage(
  "abc123xyz---def456uvw",
  "user123",
  "홍길동",
  "안녕하세요!"
);

if (result.success) {
  console.log("메시지 전송 완료! 메시지 ID:", result.messageId);
} else {
  console.error("전송 실패:", result.error);
}
```

### 예제 3: 메시지 실시간 구독 (개발자용)

```typescript
import { subscribeToMessages } from "@/lib/chat";

// 메시지 실시간 구독
const unsubscribe = subscribeToMessages(
  "abc123xyz---def456uvw",
  (messages) => {
    console.log("최신 메시지 목록:");
    messages.forEach((msg) => {
      console.log(`[${msg.senderName}] ${msg.text}`);
    });
  }
);

// 나중에 구독 해제
if (unsubscribe) {
  unsubscribe();
}
```

---

## 무한 스크롤 (Infinite Scroll) 구현 가이드라인

**⚠️ 중요: 모든 채팅 관련 페이지는 무한 스크롤 방식으로 구현되어야 합니다.**

### 왜 무한 스크롤인가?

- **성능 최적화**: 수천 개의 메시지/채팅방을 한 번에 로드하면 앱이 느려짐
- **네트워크 효율성**: 필요한 데이터만 가져와서 데이터 사용량 절감
- **사용자 경험**: 빠른 초기 로딩 속도

### 구현 대상

1. **채팅방 목록 페이지**
   - `/{ROOT_FOLDER}/chat/joins/<myUid>` 경로의 채팅방 목록
   - 한 번에 10~20개씩 로드
   - 스크롤 시 다음 페이지 로드

2. **채팅 메시지 페이지**
   - `/{ROOT_FOLDER}/chat/messages/<room-id>` 경로의 메시지 목록
   - 한 번에 20~50개씩 로드
   - 스크롤 시 이전 메시지 로드 (역순 스크롤)

### Firebase RTDB 페이지네이션 방법

#### 1. 채팅방 목록 페이지네이션

```typescript
import { ref, query, orderByChild, limitToLast, endBefore } from "firebase/database";
import { rtdb } from "@/lib/firebase";

// 첫 페이지 로드 (최신 20개)
const firstPageQuery = query(
  ref(rtdb, `/{ROOT_FOLDER}/chat/joins/${myUid}`),
  orderByChild('lastMessageSentAt'),
  limitToLast(20)
);

// 다음 페이지 로드 (이전 20개)
const nextPageQuery = query(
  ref(rtdb, `/{ROOT_FOLDER}/chat/joins/${myUid}`),
  orderByChild('lastMessageSentAt'),
  endBefore(oldestTimestamp),
  limitToLast(20)
);
```

#### 2. 채팅 메시지 페이지네이션

```typescript
import { ref, query, orderByChild, limitToLast, endBefore } from "firebase/database";
import { rtdb } from "@/lib/firebase";

// 첫 페이지 로드 (최신 50개 메시지)
const firstPageQuery = query(
  ref(rtdb, `/{ROOT_FOLDER}/chat/messages/${roomId}`),
  orderByChild('sentAt'),
  limitToLast(50)
);

// 다음 페이지 로드 (이전 50개 메시지)
const nextPageQuery = query(
  ref(rtdb, `/{ROOT_FOLDER}/chat/messages/${roomId}`),
  orderByChild('sentAt'),
  endBefore(oldestMessageTimestamp),
  limitToLast(50)
);
```

### React 컴포넌트 구현 예시

```typescript
"use client";

import { useEffect, useState, useRef } from "react";
import { ref, query, orderByChild, limitToLast, endBefore, onValue } from "firebase/database";
import { rtdb } from "@/lib/firebase";

export default function ChatRoomList({ myUid }: { myUid: string }) {
  const [chatRooms, setChatRooms] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const scrollRef = useRef<HTMLDivElement>(null);

  // 첫 페이지 로드
  useEffect(() => {
    const firstPageQuery = query(
      ref(rtdb, `/{ROOT_FOLDER}/chat/joins/${myUid}`),
      orderByChild('lastMessageSentAt'),
      limitToLast(20)
    );

    const unsubscribe = onValue(firstPageQuery, (snapshot) => {
      const rooms: any[] = [];
      snapshot.forEach((child) => {
        rooms.push({ id: child.key, ...child.val() });
      });
      setChatRooms(rooms.reverse()); // 최신순 정렬
    });

    return () => unsubscribe();
  }, [myUid]);

  // 스크롤 이벤트 처리
  const handleScroll = () => {
    if (!scrollRef.current || isLoading || !hasMore) return;

    const { scrollTop, scrollHeight, clientHeight } = scrollRef.current;

    // 스크롤이 하단에 도달하면 다음 페이지 로드
    if (scrollTop + clientHeight >= scrollHeight - 100) {
      loadNextPage();
    }
  };

  // 다음 페이지 로드
  const loadNextPage = async () => {
    if (chatRooms.length === 0) return;

    setIsLoading(true);
    const oldestTimestamp = chatRooms[chatRooms.length - 1].lastMessageSentAt;

    const nextPageQuery = query(
      ref(rtdb, `/{ROOT_FOLDER}/chat/joins/${myUid}`),
      orderByChild('lastMessageSentAt'),
      endBefore(oldestTimestamp),
      limitToLast(20)
    );

    onValue(nextPageQuery, (snapshot) => {
      const rooms: any[] = [];
      snapshot.forEach((child) => {
        rooms.push({ id: child.key, ...child.val() });
      });

      if (rooms.length === 0) {
        setHasMore(false);
      } else {
        setChatRooms((prev) => [...prev, ...rooms.reverse()]);
      }
      setIsLoading(false);
    }, { onlyOnce: true });
  };

  return (
    <div ref={scrollRef} onScroll={handleScroll} className="overflow-auto h-screen">
      {chatRooms.map((room) => (
        <div key={room.id}>{room.lastMessage}</div>
      ))}
      {isLoading && <div>로딩 중...</div>}
      {!hasMore && <div>더 이상 채팅방이 없습니다.</div>}
    </div>
  );
}
```

### 주의사항

1. **실시간 업데이트와 페이지네이션 병행**
   - 첫 페이지는 실시간 리스너로 구독
   - 다음 페이지는 `onlyOnce: true` 옵션으로 일회성 조회

2. **정렬 기준**
   - 채팅방 목록: `lastMessageSentAt` 기준 내림차순
   - 메시지 목록: `sentAt` 기준 내림차순 (최신 메시지가 하단)

3. **로딩 상태 관리**
   - `isLoading` 상태로 중복 요청 방지
   - `hasMore` 상태로 더 이상 데이터가 없을 때 요청 중단

4. **스크롤 위치 유지**
   - 새 메시지 로드 후 스크롤 위치가 변경되지 않도록 처리
   - 채팅 메시지는 역순 스크롤 (상단으로 스크롤 시 이전 메시지 로드)

---

## 보안 고려사항

### Firebase Realtime Database 보안 규칙 (권장)

```json
{
  "rules": {
    "vibe": {
      "chat": {
        "messages": {
          "$roomId": {
            ".read": "root.child('chat').child('rooms').child($roomId).child('users').val().contains(auth.uid)",
            ".write": "root.child('chat').child('rooms').child($roomId).child('users').val().contains(auth.uid)",
            "$messageId": {
              ".validate": "newData.hasChildren(['sender', 'senderName', 'text', 'timestamp'])"
            }
          }
        },
        "rooms": {
          "$roomId": {
            ".read": "root.child('chat').child('rooms').child($roomId).child('users').val().contains(auth.uid)",
            ".write": "root.child('chat').child('rooms').child($roomId).child('users').val().contains(auth.uid)",
            ".validate": "newData.hasChildren(['roomId', 'users', 'createdAt'])"
          }
        }
      }
    }
  }
}
```

**설명**:
- 사용자는 자신이 참여 중인 채팅방의 메시지만 읽고 쓸 수 있음
- 메시지에는 필수 필드가 모두 포함되어야 함
- 채팅방 정보도 참여 중인 사용자만 접근 가능

### 추가 보안 권장사항

1. **메시지 검증**: 클라이언트에서 메시지 길이 제한
2. **스팸 방지**: 과도한 메시지 전송 제한 (Rate Limiting)
3. **메시지 암호화**: 민감한 정보는 클라이언트에서 암호화 후 저장
4. **접근 제한**: 채팅방은 초대된 사용자만 접근 가능하도록 설계

---

## 향후 추가될 기능

- [ ] 그룹 채팅 (3명 이상)
- [ ] 채팅방 목록 페이지
- [ ] 메시지 삭제 기능
- [ ] 메시지 수정 기능
- [ ] 파일 공유 기능
- [ ] 이모지 지원
- [ ] 읽음 표시 (Read Receipt)
- [ ] 사용자 입력 중 표시
- [ ] 채팅방 검색
- [ ] 메시지 검색

---

## 참고 링크

- [Firebase Realtime Database 문서](https://firebase.google.com/docs/database)
- [Firebase Authentication 문서](https://firebase.google.com/docs/auth)
- Vibe 프로젝트 사용자 관리: [docs/user.md](./user.md)
- CLAUDE.md: 개발 워크플로우 및 표준 가이드

---

**마지막 업데이트**: 2025년 10월 27일
**버전**: 1.0.0
**상태**: 활성
**인코딩**: UTF-8
