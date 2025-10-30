# 파이어베이스 클라우드 함수 (Firebase Cloud Functions) 개발 가이드

파이어베이스 클라우드 함수 개발을 할 때 꼭 지켜야하는 지침들을 모아놓은 문서입니다.

---

## 📋 목차

- [1. 개요](#1-개요)
- [2. 개발 환경 설정](#2-개발-환경-설정)
- [3. 코드 작성 지침](#3-코드-작성-지침)
- [4. 프로젝트 구조](#4-프로젝트-구조)
- [5. index.ts 파일 상세 가이드](#5-indexts-파일-상세-가이드)
  - [5.1 파일 개요](#51-파일-개요)
  - [5.2 Configuration 관리 (getConfig)](#52-configuration-관리-getconfig)
  - [5.3 Global Options 설정](#53-global-options-설정)
  - [5.4 Firebase Admin 초기화](#54-firebase-admin-초기화)
  - [5.5 핵심 함수: onChatMessageCreated](#55-핵심-함수-onchatmessagecreated)
- [6. 설계 철학](#6-설계-철학)
- [7. 주의사항](#7-주의사항)
- [8. 관련 문서](#8-관련-문서)

---

## 1. 개요

파이어베이스 클라우드 함수는 서버리스 환경에서 백엔드 코드를 실행할 수 있는 기능을 제공합니다. Vibe 프로젝트에서는 채팅 메시지 생성 시 자동으로 실행되는 백그라운드 함수를 구현하여 다음과 같은 작업을 자동화합니다:

- **채팅방 정보 업데이트**: 마지막 메시지, 시간 등
- **사용자 참여 정보 업데이트**: 채팅방 목록 (`/{ROOT_FOLDER}/chat/joins`)의 정렬 필드 (`order`, `singleOrder`, `groupOrder`) 자동 업데이트
- **읽지 않은 메시지 수 관리**: 사용자별 unread count 자동 계산
- **프로토콜 메시지 필터링**: 시스템 메시지 제외

**참고**: 이 문서에서 사용하는 경로는 모두 `/{ROOT_FOLDER}/` 접두사를 사용합니다. `ROOT_FOLDER`는 `firebase/functions/src/firebase.config.ts`에 정의된 상수로, 현재 기본값은 `"vibe"`입니다. 따라서 실제 경로는 `/{ROOT_FOLDER}/chat/joins` 형태가 됩니다.

이 문서에서는 파이어베이스 클라우드 함수를 개발할 때 따라야 할 지침들을 안내합니다.

---

## 2. 개발 환경 설정

### 설치 현황

- ✅ **Firebase CLI 및 Firebase Cloud Functions SDK**: 이미 설치 완료
- ✅ **Node.js 및 필요한 모든 npm 패키지**: 설치 완료

### 디렉토리 구조

- **Firebase 프로젝트 루트**: `./firebase/` 폴더
  - Firebase 관련 설정, 파일, 코드 등이 위치
- **Cloud Functions 코드**: `./firebase/functions/` 폴더
  - 클라우드 함수 소스 코드 위치
  - `package.json` 파일 존재
- **진입점 파일**: `./firebase/functions/src/index.ts`
  - 모든 Cloud Functions의 시작점

### 참고 문서

- **Firebase 공식 문서**: [Get Started with Cloud Functions](https://firebase.google.com/docs/functions/get-started)
- **TypeScript 가이드**: [Cloud Functions with TypeScript](https://firebase.google.com/docs/functions/typescript)

---

## 3. 코드 작성 지침

### 필수 규칙

1. **채팅 관련 로직 및 RTDB 구조**:
   - 반드시 [채팅 개발 문서](./chat.md)를 참고하여 작성
   - RTDB 구조는 문서에 명시된 대로 **엄격히 준수**
   - 특히 1:1 채팅방 roomId는 `uid1---uid2` 형식 (세 개의 대시 `---`)으로 생성

2. **비동기 처리**:
   - 모든 비동기 작업은 `async/await` 구문 사용
   - Promise 체인 방식은 가급적 피하기

3. **에러 처리**:
   - 꼭 필요한 경우에만 에러 핸들링 작성
   - 불필요한 try-catch 블록은 피하기
   - 에러 발생 시 적절한 로그 남기기

4. **코드 주석**:
   - 모든 함수에 JSDoc 형식의 주석 작성
   - 복잡한 로직은 한글 주석으로 설명

5. **타입 안전성**:
   - TypeScript 타입을 명확히 지정
   - `any` 타입 사용 지양

---

## 4. 프로젝트 구조

```
firebase/
├── functions/
│   ├── src/
│   │   ├── index.ts              # 메인 진입점 (트리거 함수 정의)
│   │   ├── functions.ts          # 비즈니스 로직 함수들
│   │   ├── interfaces.ts         # TypeScript 인터페이스 정의
│   │   └── ... (기타 모듈)
│   ├── package.json              # npm 의존성
│   └── tsconfig.json             # TypeScript 설정
├── firebase.json                 # Firebase 프로젝트 설정
└── .firebaserc                   # Firebase 프로젝트 alias
```

### 파일별 역할

| 파일 | 역할 | 설명 |
|------|------|------|
| `index.ts` | **트리거 정의** | 어떤 경로에서 어떤 이벤트가 발생하면 함수를 실행할지 정의 |
| `functions.ts` | **비즈니스 로직** | 실제 데이터 처리 및 RTDB 업데이트 로직 구현 |
| `interfaces.ts` | **타입 정의** | TypeScript 인터페이스 및 타입 선언 |

---

## 5. index.ts 파일 상세 가이드

### 5.1 파일 개요

`firebase/functions/src/index.ts`는 Firebase Cloud Functions의 **메인 진입점**으로, 채팅 메시지 생성 시 자동으로 실행되는 백그라운드 함수를 정의합니다.

**주요 역할**:
- Firebase Admin SDK 초기화
- 환경별 설정 관리
- 트리거 함수 정의 및 이벤트 라우팅

**파일 위치**: [firebase/functions/src/index.ts](../firebase/functions/src/index.ts)

---

### 5.2 Configuration 관리 (getConfig)

#### 목적

환경 변수(`GCLOUD_PROJECT` 또는 `FIREBASE_PROJECT`)에 따라 적절한 Firebase 프로젝트 설정을 반환합니다.

#### 지원하는 프로젝트

| 프로젝트 | 환경 변수 값 | Database URL | Region |
|---------|-------------|--------------|--------|
| **test5** | `test5` 또는 `withcenter-test-5` 포함 | `https://withcenter-test-5-default-rtdb.asia-southeast1.firebasedatabase.app/` | `asia-southeast1` |

#### 코드 예시

```typescript
const getConfig = () => {
  const projectValue =
    process.env.GCLOUD_PROJECT || process.env.FIREBASE_PROJECT || "";

  if (projectValue === "test5" || projectValue.includes("withcenter-test-5")) {
    return {
      databaseURL:
        "https://withcenter-test-5-default-rtdb.asia-southeast1.firebasedatabase.app/",
      region: "asia-southeast1",
    };
  } else {
    throw new Error(`Unknown FIREBASE_PROJECT value: ${projectValue}`);
  }
};
```

#### 배포 시 프로젝트 선택

```bash
# test5 프로젝트에 배포
firebase deploy --only functions --project=test5
```

#### 주의사항

- `GCLOUD_PROJECT`는 Firebase 배포 시 자동으로 설정됨
- `FIREBASE_PROJECT`는 로컬 테스트/에뮬레이터용
- **Region은 반드시 Database Region과 일치해야 함** (Database 트리거 사용 시)

---

### 5.3 Global Options 설정

#### 목적

**비용 관리**를 위해 동시에 실행 가능한 컨테이너 수를 제한합니다.

#### 설정 내용

```typescript
setGlobalOptions({ maxInstances: 10 });
```

- **maxInstances: 10**: 최대 10개의 컨테이너만 동시 실행
- 예상치 못한 트래픽 급증 시 **비용 폭탄 방지**
- 성능 저하를 감수하고 비용 통제 우선

#### 함수별 개별 설정 가능

```typescript
export const myFunction = onRequest(
  { maxInstances: 5 },  // 이 함수는 최대 5개만
  (req, res) => { ... }
);
```

#### 참고사항

- `setGlobalOptions`는 **v2 API 함수에만 적용**됨
- v1 API 함수는 `functions.runWith({ maxInstances: 10 })`를 개별적으로 사용해야 함
- v1 API에서는 컨테이너당 하나의 요청만 처리하므로 `maxInstances = 최대 동시 요청 수`

---

### 5.4 Firebase Admin 초기화

#### 목적

Firebase Admin SDK를 초기화하여 Realtime Database, Firestore 등에 접근할 수 있도록 설정합니다.

#### 코드 예시

```typescript
if (!admin.apps.length) {
  admin.initializeApp({
    databaseURL: config.databaseURL,
  });

  console.log(
    `Firebase Admin initialized with database URL: ${config.databaseURL}`
  );
}
```

#### 동작 방식

1. **중복 초기화 방지**: `admin.apps.length`로 이미 초기화되었는지 확인
2. **Database URL 설정**: `getConfig()`에서 받은 URL 사용
3. **로그 출력**: 초기화 성공 시 Database URL 로그

#### 주의사항

- Firebase Admin은 **한 번만 초기화**되어야 함
- 여러 번 초기화 시도 시 에러 발생 가능

---

### 5.5 핵심 함수: onChatMessageCreated

#### 함수 정의

```typescript
export const onChatMessageCreated = onValueCreated(
  `/${ROOT_FOLDER}/chat/messages/{roomId}/{messageId}`,
  async (event: DatabaseEvent<DataSnapshot>) => {
    // 함수 본문
  }
);
```

#### 트리거 경로

`/{ROOT_FOLDER}/chat/messages/{roomId}/{messageId}`

- 이 경로에 **새로운 데이터가 생성**되면 자동으로 함수 실행
- `{roomId}`, `{messageId}`는 와일드카드 파라미터

#### 함수 실행 흐름

```typescript
// Step 1: 파라미터 추출
const roomId = event.params.roomId as string;
const messageId = event.params.messageId as string;
const messageData = event.data.val() as CreateChatMessageParams;

// Step 2: 프로토콜 메시지 필터링
if (messageData.protocol) {
  console.log(`Skipping protocol message ${messageId} in room ${roomId}`);
  return;
}

// Step 3: 필수 필드 검증
if (
  messageData.senderUid === undefined ||
  messageData.senderUid.trim().length === 0
) {
  throw new Error("senderUid is required but was undefined or empty");
}

// Step 4: 실제 처리 함수 호출
await updateOnMessageCreatedForSingleChat(roomId, messageId, messageData);
```

#### 각 단계 설명

| 단계 | 설명 | 코드 |
|------|------|------|
| **Step 1: 파라미터 추출** | 트리거 경로에서 roomId, messageId 추출<br/>메시지 데이터 가져오기 | `event.params.roomId`<br/>`event.data.val()` |
| **Step 2: 프로토콜 메시지 필터링** | 시스템 메시지(입장/퇴장 등)는 처리 제외 | `if (messageData.protocol) return;` |
| **Step 3: 필수 필드 검증** | `senderUid`가 없거나 빈 문자열이면 에러 | `if (!senderUid) throw Error` |
| **Step 4: 실제 처리 함수 호출** | 1:1 채팅 메시지 생성 시 필요한 업데이트 작업 수행 | `updateOnMessageCreatedForSingleChat()` |

#### 함수의 역할

이 Cloud Function은 다음과 같은 작업을 **자동으로** 처리합니다:

1. **메시지 생성 감지**: 새로운 채팅 메시지가 생성되면 자동으로 트리거
2. **프로토콜 메시지 필터링**: 시스템 메시지는 제외
3. **데이터 검증**: 필수 필드 확인
4. **라우팅**: 채팅 타입에 따라 적절한 핸들러 함수로 라우팅
   - 현재는 `updateOnMessageCreatedForSingleChat()` 함수만 호출
   - 추후 그룹/오픈 채팅용 핸들러 추가 가능

#### 실제 처리 함수: updateOnMessageCreatedForSingleChat

**위치**: [firebase/functions/src/functions.ts](../firebase/functions/src/functions.ts)

**처리 내역**:
- 채팅방 lastMessage, lastMessageSentAt 업데이트
- 사용자별 `/{ROOT_FOLDER}/chat/joins/<uid>/<roomId>` 업데이트:
  - `order`: 모든 채팅방 정렬용
  - `singleOrder`: 1:1 채팅방 정렬용
  - `lastMessage`, `lastMessageSentAt`: 최신 메시지 정보
- 읽지 않은 메시지 수 (`unreadCount`) 관리
- 에러 발생 시 `/{ROOT_FOLDER}/chat/joins/<uid>/<roomId>/error` 경로에 에러 저장 (Error Saving 패턴)

---

#### 5.5.1 1:1 채팅 메시지 전송 시 자동화 프로세스

##### 클라이언트와 Cloud Functions의 역할 분담

**클라이언트 (React.js)가 하는 일**:
- 최소한의 데이터만 전송 → 네트워크 비용 절감
- 전송 데이터:
  ```typescript
  {
    text: "메시지 내용",      // 메시지 본문
    senderUid: "user-uid-1"   // 발신자 UID만
  }
  ```

**Cloud Functions가 자동으로 처리하는 일**:
- 메시지 메타데이터 추가
- 양측 사용자의 채팅방 정보 업데이트
- 읽지 않은 메시지 수 관리

---

##### Cloud Functions의 3단계 처리 과정

**Step 1: 메시지에 sentAt 추가**

```typescript
// /{ROOT_FOLDER}/chat/messages/{roomId}/{messageId}/sentAt 경로에 타임스탬프 추가
const now = Date.now();
messageUpdates[messagePath(roomId, messageId, "sentAt")] = now;
await admin.database().ref().update(messageUpdates);
```

**결과**:
```
/{ROOT_FOLDER}/chat/messages/
  user-A-uid---user-B-uid/
    messageId123/
      text: "안녕하세요"
      senderUid: "user-A-uid"
      sentAt: 1698473000000  ← Cloud Functions가 추가
```

**Step 2: 양측 사용자의 chat/joins 업데이트**

```typescript
// /users/<uid>에서 displayName 조회
const [senderUserData, receiverUserData] = await Promise.all([
  getUser(senderUid),
  getUser(receiverUid),
]);

const senderDisplayName = senderUserData?.displayName || "사용자";
const receiverDisplayName = receiverUserData?.displayName || "사용자";

// order timestamp에 "10" 접두사 추가
const orderTimestamp = parseInt("10" + now);

// 양측 사용자의 chat/joins 업데이트
const joinUpdates: UpdateInterface = {};

// 수신자 (receiverUid)의 chat/joins 업데이트
joinUpdates[joinPath(receiverUid, roomId, "id")] = roomId;
joinUpdates[joinPath(receiverUid, roomId, "text")] = messageData.text || "";
joinUpdates[joinPath(receiverUid, roomId, "sentAt")] = now;
joinUpdates[joinPath(receiverUid, roomId, "senderUid")] = senderUid;
joinUpdates[joinPath(receiverUid, roomId, "otherName")] = senderDisplayName;
joinUpdates[joinPath(receiverUid, roomId, "otherNameLowerCase")] = senderDisplayName.toLowerCase();
joinUpdates[joinPath(receiverUid, roomId, "order")] = orderTimestamp;
joinUpdates[joinPath(receiverUid, roomId, "singleOrder")] = orderTimestamp;
joinUpdates[joinPath(receiverUid, roomId, "unread")] = admin.database.ServerValue.increment(1);

// 발신자 (senderUid)의 chat/joins 업데이트
joinUpdates[joinPath(senderUid, roomId, "id")] = roomId;
joinUpdates[joinPath(senderUid, roomId, "text")] = messageData.text || "";
joinUpdates[joinPath(senderUid, roomId, "sentAt")] = now;
joinUpdates[joinPath(senderUid, roomId, "senderUid")] = senderUid;
joinUpdates[joinPath(senderUid, roomId, "otherName")] = receiverDisplayName;
joinUpdates[joinPath(senderUid, roomId, "otherNameLowerCase")] = receiverDisplayName.toLowerCase();
joinUpdates[joinPath(senderUid, roomId, "order")] = orderTimestamp;
joinUpdates[joinPath(senderUid, roomId, "singleOrder")] = orderTimestamp;
joinUpdates[joinPath(senderUid, roomId, "unread")] = 0;

await admin.database().ref().update(joinUpdates);
```

**결과**:
```
/{ROOT_FOLDER}/chat/joins/
  user-A-uid/                     ← 발신자
    user-A-uid---user-B-uid/
      id: "user-A-uid---user-B-uid"
      text: "안녕하세요"
      sentAt: 1698473000000
      senderUid: "user-A-uid"
      otherName: "User B"          ← 상대방 이름
      otherNameLowerCase: "user b"
      order: 101698473000000       ← "10" 접두사
      singleOrder: 101698473000000
      unread: 0                    ← 발신자는 0

  user-B-uid/                     ← 수신자
    user-A-uid---user-B-uid/
      id: "user-A-uid---user-B-uid"
      text: "안녕하세요"
      sentAt: 1698473000000
      senderUid: "user-A-uid"
      otherName: "User A"          ← 상대방 이름
      otherNameLowerCase: "user a"
      order: 101698473000000       ← "10" 접두사
      singleOrder: 101698473000000
      unread: 1                    ← 수신자는 +1
```

**Step 3: 읽지 않은 메시지 수 관리 (3곳에 저장)**

```typescript
// 1. chat/joins/{uid}/{roomId}/unread (이미 Step 2에서 처리됨)

// 2. chat/join-props/{uid}/unread/{roomId} (독립적인 카운트)
joinUpdates[joinPropsPath(receiverUid, "unread", roomId)] =
  admin.database.ServerValue.increment(1);
joinUpdates[joinPropsPath(senderUid, "unread", roomId)] = 0;

// 3. users/{uid}/unreadCount (전체 안읽은 메시지 수)
await updateUsersUnreadCount([senderUid, receiverUid]);
```

**결과**:
```
/{ROOT_FOLDER}/chat/join-props/
  user-B-uid/
    unread/
      user-A-uid---user-B-uid: 1  ← 이 채팅방의 안읽은 메시지 수

/{ROOT_FOLDER}/users/
  user-B-uid/
    unreadCount: 5                ← 모든 채팅방의 안읽은 메시지 총합
```

---

##### order 필드의 "10" 접두사 설명

**일반 타임스탬프**:
```typescript
const timestamp = 1698473000000;  // 13자리
```

**"10" 접두사를 추가한 order**:
```typescript
const orderTimestamp = parseInt("10" + timestamp);
// 결과: 101698473000000 (15자리)
```

**이유**:
- 채팅방 목록을 `order` 필드로 내림차순 정렬하면 최신 메시지가 위로 올라옴
- "10" 접두사를 추가하면 새 메시지는 항상 과거 메시지보다 큰 값을 가짐
- 미래의 타임스탬프와도 충돌하지 않음 (10 접두사는 매우 큰 숫자)

---

##### otherName 필드 설계

**각 사용자의 chat/joins에 상대방 이름을 저장하는 이유**:

1. **성능 최적화**:
   - 채팅방 목록 조회 시 `chat/joins` 정보에서 상대방 이름을 바로 표시 가능
   - 채팅방 목록 페이지에서 추가 조회 불필요 → 페이지 로딩 속도 향상
   - Cloud Functions에서 자동으로 저장되므로 클라이언트가 별도로 처리할 필요 없음

2. **데이터 구조**:
   ```typescript
   // User A의 chat/joins
   chat/joins/user-A-uid/user-A-uid---user-B-uid/
     otherName: "User B"  ← User B의 이름 저장

   // User B의 chat/joins
   chat/joins/user-B-uid/user-A-uid---user-B-uid/
     otherName: "User A"  ← User A의 이름 저장
   ```

3. **검색 최적화**:
   - `otherNameLowerCase` 필드로 대소문자 무관 검색 지원
   - 채팅방 목록에서 상대방 이름으로 필터링 가능

---

##### joinPropsPath 함수 - category에서 field로 변경

**이전 (잘못된 이름)**:
```typescript
export function joinPropsPath(
  uid: string,
  category: string,  // ← 부적절한 이름
  key?: string
): string {
  const basePath = `${ROOT_FOLDER}/chat/join-props/${uid}/${category}`;
  return key ? `${basePath}/${key}` : basePath;
}
```

**현재 (올바른 이름)**:
```typescript
export function joinPropsPath(
  uid: string,
  field: string,  // ← field로 변경
  key?: string
): string {
  const basePath = `${ROOT_FOLDER}/chat/join-props/${uid}/${field}`;
  return key ? `${basePath}/${key}` : basePath;
}
```

**사용 예시**:
```typescript
// unread 카운트 조회/업데이트
const unreadPath = joinPropsPath(uid, "unread", roomId);
// 결과: /{ROOT_FOLDER}/chat/join-props/{uid}/unread/{roomId}

// 알림 구독 여부 조회
const subscribePath = joinPropsPath(uid, "subscriptions", roomId);
// 결과: /{ROOT_FOLDER}/chat/join-props/{uid}/subscriptions/{roomId}
```

**변경 이유**:
- `category`는 의미가 모호함
- `field`가 더 명확한 의미 전달 (데이터베이스 필드명)
- 다른 함수들과 네이밍 일관성 향상

---

## 6. 설계 철학

### Keep Trigger Functions Simple

주석에서 언급된 것처럼, **트리거 함수는 단순하게 유지**해야 합니다.

#### 트리거 함수가 해야 할 일

✅ **해야 할 일**:
1. 이벤트에서 데이터 추출
2. `roomId`, `messageId` 등 파라미터 추출
3. 채팅 타입 결정 (1:1 vs 그룹)
4. 적절한 핸들러 함수로 라우팅

❌ **하지 말아야 할 일**:
1. 복잡한 비즈니스 로직 구현
2. RTDB 업데이트 직접 수행
3. 여러 경로에 대한 복잡한 데이터 처리

#### 비즈니스 로직 분리

실제 비즈니스 로직 (lastMessage 업데이트, 읽지 않은 메시지 수 관리 등)은 **별도 함수**에서 처리합니다:

```typescript
// index.ts (트리거 함수) - 단순하게!
export const onChatMessageCreated = onValueCreated(
  `/${ROOT_FOLDER}/chat/messages/{roomId}/{messageId}`,
  async (event) => {
    const roomId = event.params.roomId;
    const messageData = event.data.val();

    // 간단한 검증 후 바로 라우팅
    if (messageData.protocol) return;
    await updateOnMessageCreatedForSingleChat(roomId, messageData);
  }
);

// functions.ts (비즈니스 로직) - 복잡한 로직 구현
export async function updateOnMessageCreatedForSingleChat(
  roomId: string,
  messageData: any
) {
  // 실제 RTDB 업데이트 로직
  // 채팅방 정보 업데이트
  // 사용자 참여 정보 업데이트
  // 읽지 않은 메시지 수 계산
  // ...
}
```

#### 장점

- **가독성 향상**: 트리거 함수만 보면 어떤 이벤트에서 어떤 처리를 하는지 한눈에 파악
- **유지보수 용이**: 비즈니스 로직 변경 시 `functions.ts`만 수정
- **테스트 용이**: 비즈니스 로직 함수를 독립적으로 단위 테스트 가능
- **재사용성**: 같은 비즈니스 로직을 다른 트리거에서도 사용 가능

---

## 7. 주의사항

### 7.1 환경 변수 설정 필수

배포 시 **올바른 프로젝트 설정**이 필요합니다:

```bash
# 프로젝트 확인
firebase use

# 프로젝트 전환
firebase use test5

# 배포
firebase deploy --only functions
```

### 7.2 비용 관리

- `maxInstances: 10`으로 동시 실행 제한
- 예상치 못한 트래픽 급증 시 성능 저하 가능 (비용 vs 성능 trade-off)
- 필요 시 `maxInstances` 값 조정

### 7.3 Region 일치

**Database trigger는 반드시 database region과 일치해야 합니다**:

- test5 프로젝트: `asia-southeast1`

Region이 일치하지 않으면 함수가 트리거되지 않습니다!

### 7.4 RTDB 구조 준수

채팅 관련 Cloud Functions 개발 시 반드시 [chat.md](./chat.md)의 RTDB 구조를 따라야 합니다:

- **1:1 채팅방 roomId**: `uid1---uid2` (세 개의 대시 `---`)
- **그룹 채팅방 roomId**: `group-xxx` (예: `group-abc123`)
- **메시지 경로**: `/{ROOT_FOLDER}/chat/messages/<room-id>/<message-id>`
- **참여 정보 경로**: `/{ROOT_FOLDER}/chat/joins/<login-uid>/<room-id>`

### 7.5 Firebase Admin 모듈

프로젝트에서 Firebase Admin SDK를 사용하려면:

```bash
# firebase/functions 폴더에서 실행
cd firebase/functions
npm install firebase-admin
```

이미 설치되어 있어야 하지만, 누락 시 위 명령어로 설치하세요.

### 7.6 TypeScript 타입 정의

`interfaces.ts`에 정의된 타입을 반드시 사용하세요:

```typescript
import { CreateChatMessageParams } from "./interfaces";

const messageData = event.data.val() as CreateChatMessageParams;
```

---

## 8. 관련 문서

### Vibe 프로젝트 문서

- **[채팅 개발 문서 (chat.md)](./chat.md)**:
  - RTDB 구조
  - 채팅 메시지 인터페이스
  - 1:1 vs 그룹 채팅 구분
  - 실시간 업데이트 요구사항
  - 무한 스크롤 구현 가이드라인

- **[프로젝트 개요 (project-overview.md)](./project-overview.md)**:
  - 전체 프로젝트 구조
  - 기술 스택
  - Firebase 설정

### Firebase 공식 문서

- **[Cloud Functions 시작하기](https://firebase.google.com/docs/functions/get-started)**
- **[Database Triggers](https://firebase.google.com/docs/functions/database-events)**
- **[TypeScript 가이드](https://firebase.google.com/docs/functions/typescript)**
- **[Best Practices](https://firebase.google.com/docs/functions/best-practices)**

### 코드 주석 내 참조 문서

Cloud Functions 코드 주석에서 참조하는 문서:

- `docs/chat/cloud-functions.md#keep-trigger-functions-simple`
- `docs/chat/chat-logic.md#message-creation-flow`

**참고**: 이 문서들은 향후 추가될 예정입니다.

---

## 마무리

이 문서는 Firebase Cloud Functions의 **메인 진입점인 index.ts** 파일을 중심으로 작성되었습니다.

**핵심 포인트**:
- ✅ **트리거 함수는 단순하게**: 라우팅과 검증만 수행
- ✅ **비즈니스 로직은 별도 분리**: `functions.ts`에서 구현
- ✅ **RTDB 구조 준수**: `chat.md` 문서 참조
- ✅ **비용 관리**: `maxInstances` 설정으로 비용 통제
- ✅ **Region 일치**: Database trigger는 database region과 일치 필수

이 파일이 채팅 시스템의 핵심 백그라운드 처리를 담당하는 진입점입니다! 🚀

---

**Last Updated**: 2025-10-30
**Version**: 1.0.0
**Author**: Vibe 개발팀