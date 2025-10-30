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
7. [보안 고려사항](#보안-고려사항)

---

## 개요

Vibe 프로젝트의 **채팅 시스템**은 다음 기술 스택을 활용합니다:

- **Firebase Authentication**: 사용자 인증
- **Firebase Realtime Database (RTDB)**: 채팅 메시지 및 채팅방 정보 저장

**⚠️ 중요**: 모든 채팅 관련 데이터는 Firebase Realtime Database의 **`/vibe/chat/`** 경로 아래에 저장됩니다.

### 핵심 개념

- **채팅방 ID (roomId)**: `uid1-uid2` 형식 (알파벳 순서로 정렬된 두 UID)
- **메시지**: 발신자, 메시지 내용, 전송 시간 포함
- **실시간 동기화**: Firebase의 `onValue` 함수를 사용한 실시간 메시지 수신

### 1:1 채팅 vs 그룹 채팅

**1:1 채팅 (현재 구현)**:
- `/vibe/chat/joins/<login-uid>/<room-id>`에서 채팅방 정보 관리
- `roomId`에 사용자 정보가 포함되어 있어 `users` 필드 불필요
- `/vibe/chat/rooms`를 참조하지 않음
- 채팅방 목록은 `/vibe/chat/joins/<myUid>` 하위 경로에서만 조회

**그룹 채팅 (향후 구현)**:
- `/vibe/chat/rooms/<room-id>`에 채팅방 정보 저장
- `users` 필드로 참여 사용자 관리
- 3명 이상 참여 가능
- `/vibe/chat/joins`와 `/vibe/chat/rooms` 모두 사용

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

### 채팅방 참여 정보 인터페이스 (1:1 채팅)

**경로**: `/vibe/chat/joins/<login-uid>/<room-id>`

```typescript
interface ChatJoin {
  roomId: string;                  // 채팅방 ID (uid1-uid2)
  createdAt: number;               // 채팅방 생성 시간
  lastMessage?: string;            // 마지막 메시지 내용
  lastMessageSentAt?: number;      // 마지막 메시지 전송 시간
}
```

**설명**:
- `users` 필드는 없음 (roomId에 `<myUid-otherUid>` 형식으로 사용자 정보가 포함됨)
- 로그인한 사용자의 채팅방 목록을 `/vibe/chat/joins/<myUid>` 경로에서 조회
- 1:1 채팅에서는 `/vibe/chat/rooms`를 참조할 필요 없이 `joins`에서만 정보 조회

### 그룹 채팅방 정보 인터페이스

**경로**: `/vibe/chat/rooms/<room-id>` (그룹 채팅 전용)

```typescript
interface ChatRoom {
  roomId: string;                  // 채팅방 ID
  users: string[];                 // 참여 사용자 UID 배열 (그룹 채팅에서만 사용)
  createdAt: number;               // 채팅방 생성 시간
  lastMessage?: string;            // 마지막 메시지 내용
  lastMessageSentAt?: number;      // 마지막 메시지 전송 시간
}
```

**설명**:
- `/vibe/chat/rooms`는 **그룹 채팅 전용**
- `users` 필드로 어떤 사용자가 채팅방에 입장해 있는지 관리

### RTDB 구조

```
/vibe/chat/
├── messages/                     # 모든 채팅 메시지 (1:1 및 그룹)
│   └── <room-id>/                # 예: "abc123xyz-def456uvw"
│       └── <message-id>/         # Firebase가 자동 생성
│           ├── sender: "abc123xyz"
│           ├── senderName: "홍길동"
│           ├── text: "안녕하세요!"
│           └── sentAt: 1698473000000
│
├── joins/                        # 사용자별 채팅방 참여 목록 (1:1 채팅)
│   └── <login-uid>/              # 로그인한 사용자 UID
│       └── <room-id>/            # 참여한 채팅방 ID
│           ├── roomId: "abc123xyz-def456uvw"
│           ├── createdAt: 1698473000000
│           ├── lastMessage: "안녕하세요!"
│           └── lastMessageSentAt: 1698473000000
│
└── rooms/                        # 그룹 채팅방 정보 (그룹 채팅 전용)
    └── <room-id>/                # 그룹 채팅방 ID
        ├── roomId: "group-abc123"
        ├── users: ["abc123xyz", "def456uvw", "ghi789rst"]
        ├── createdAt: 1698473000000
        ├── lastMessage: "안녕하세요!"
        └── lastMessageSentAt: 1698473000000
```

**구조 설명**:

1. **`/vibe/chat/messages/<room-id>`**
   - 모든 채팅 메시지 저장 (1:1 및 그룹 공통)
   - 필드: `sender`, `senderName`, `text`, `sentAt`

2. **`/vibe/chat/joins/<login-uid>/<room-id>`** (1:1 채팅)
   - 로그인한 사용자의 채팅방 목록
   - 필드: `roomId`, `createdAt`, `lastMessage`, `lastMessageSentAt`
   - **`users` 필드 없음** (roomId에 `<myUid-otherUid>` 형식으로 포함)
   - 1:1 채팅에서는 `/vibe/chat/rooms`를 참조하지 않고 `joins`만 사용

3. **`/vibe/chat/rooms/<room-id>`** (그룹 채팅 전용)
   - 그룹 채팅방 정보만 저장
   - 필드: `roomId`, `users`, `createdAt`, `lastMessage`, `lastMessageSentAt`
   - `users` 필드로 어떤 사용자가 채팅방에 입장해 있는지 관리

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
// 결과: "user123-user456" 또는 "user456-user123" (알파벳 순서)
```

---

### createChatRoom()

**채팅방을 생성하거나 기존 채팅방을 반환합니다.**

```typescript
async function createChatRoom(
  uid1: string,
  uid2: string
): Promise<{ success: boolean; roomId?: string; error?: string }>
```

**매개변수**:
- `uid1` (string): 첫 번째 사용자 UID
- `uid2` (string): 두 번째 사용자 UID

**반환값**:
- `success` (boolean): 성공 여부
- `roomId` (string): 생성되거나 기존 채팅방 ID
- `error` (string): 오류 메시지 (선택)

**저장 위치**: `/vibe/chat/rooms/<room-id>`

**사용 예제**:
```typescript
const result = await createChatRoom("user123", "user456");
if (result.success) {
  console.log("채팅방 ID:", result.roomId);
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

**저장 위치**: `/vibe/chat/messages/<room-id>/<message-id>`

**사용 예제**:
```typescript
const result = await sendMessage(
  "abc123xyz-def456uvw",
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

**조회 위치**: `/vibe/chat/messages/<room-id>`

**사용 예제**:
```typescript
const messages = await getMessages("abc123xyz-def456uvw");
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
  "abc123xyz-def456uvw",
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

**조회 위치**: `/vibe/chat/rooms`

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

**조회 위치**: `/vibe/chat/rooms/<room-id>`

**사용 예제**:
```typescript
const room = await getChatRoom("abc123xyz-def456uvw");
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

### `/vibe/chat/messages/<room-id>`

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

### `/vibe/chat/joins/<login-uid>/<room-id>`

**용도**: 로그인한 사용자의 채팅방 참여 목록 (1:1 채팅)

**데이터 타입**: Object

**예시**:
```json
{
  "abc123xyz-def456uvw": {
    "roomId": "abc123xyz-def456uvw",
    "createdAt": 1698473000000,
    "lastMessage": "안녕하세요! 잘 지내세요?",
    "lastMessageSentAt": 1698473010000
  }
}
```

**설명**:
- `users` 필드 없음 (roomId에 사용자 정보 포함)
- 1:1 채팅에서는 이 경로만 참조하여 채팅방 목록 표시
- `/vibe/chat/rooms`를 참조하지 않음

### `/vibe/chat/rooms/<room-id>`

**용도**: 그룹 채팅방 정보 저장 (그룹 채팅 전용)

**데이터 타입**: Object

**예시**:
```json
{
  "roomId": "group-abc123",
  "users": ["abc123xyz", "def456uvw", "ghi789rst"],
  "createdAt": 1698473000000,
  "lastMessage": "안녕하세요! 잘 지내세요?",
  "lastMessageSentAt": 1698473010000
}
```

**설명**:
- 그룹 채팅에서만 사용
- `users` 필드로 참여 사용자 관리

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
  "abc123xyz-def456uvw",
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
  "abc123xyz-def456uvw",
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
