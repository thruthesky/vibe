---
name: sonub
version: 1.0.0
description: 파이어베이스 클라우드 함수 (Firebase Cloud Functions) 개발 가이드 문서의 SED 사양
author: JaeHo Song
email: thruthesky@gmail.com
homepage: https://github.com/thruthesky/
funding: ""
license: GPL-3.0
dependencies:
  - sonub-firebase-database-structure.md
---

## Overview
- 이 문서는 "파이어베이스 클라우드 함수 (Firebase Cloud Functions) 개발 가이드"에 대한 세부 사양을 정리하며, 기존 내용을 그대로 유지한 채 SED 구조에 맞춰 제공합니다.

## Requirements
- 문서 전반에 걸쳐 소개되는 지침과 참고 사항을 모두 숙지해야 하며, 별도의 추가 선행 조건은 원문 각 절에서 제시되는 내용을 따릅니다.

## Workflow
1. 아래 `## Detail Items` 절에 포함된 원문 목차를 검토합니다.
2. 필요한 경우 원문의 각 절을 순서대로 읽으며 프로젝트 작업 흐름에 반영합니다.
3. 문서에 명시된 모든 지침을 확인한 뒤 실제 개발 단계에 적용합니다.

## Detail Items
- 이하에는 기존 문서의 모든 내용을 원형 그대로 포함하여 참조할 수 있도록 구성했습니다.

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
- [8. 데이터베이스 트리거 구현 예제](#8-데이터베이스-트리거-구현-예제)
  - [8.1 전체 통계 (stats/counters) 관리](#81-전체-통계-statscounters-관리)
  - [8.2 카테고리 통계 (categories) 관리](#82-카테고리-통계-categories-관리)
- [9. Unit Test 가이드](#9-unit-test-가이드)
  - [9.1 테스트 전략 개요](#91-테스트-전략-개요)
  - [9.2 리팩토링된 프로젝트 구조](#92-리팩토링된-프로젝트-구조)
  - [9.3 함수 로직 분리 철학](#93-함수-로직-분리-철학)
  - [9.4 테스트 환경 설정](#94-테스트-환경-설정)
  - [9.5 테스트 실행 방법](#95-테스트-실행-방법)
  - [9.6 Unit Test 예제](#96-unit-test-예제)
  - [9.7 Integration Test 예제](#97-integration-test-예제)
- [10. 관련 문서](#10-관련-문서)

---

## 1. 개요

파이어베이스 클라우드 함수는 서버리스 환경에서 백엔드 코드를 실행할 수 있는 기능을 제공합니다. SNS 프로젝트에서는 게시글, 댓글, 좋아요 등의 이벤트 발생 시 자동으로 실행되는 백그라운드 함수를 구현하여 다음과 같은 작업을 자동화합니다:

- **사용자 프로필 동기화**: `/users/{uid}` 변경 시 `/user-props/` 자동 업데이트
- **좋아요/댓글 개수 동기화**: `/likes/` 변경 시 `/posts/{postId}/likeCount` 또는 `/comments/{commentId}/likeCount` 업데이트 (통합 좋아요 구조)
- **게시글 삭제 시 연관 데이터 정리**: 게시글 삭제 시 좋아요, 댓글 등 연관 데이터 자동 삭제
- **알림 트리거 및 전송**: 좋아요, 댓글, 친구 요청 등의 이벤트 발생 시 알림 전송

**참고**: 이 문서에서 사용하는 모든 경로는 Firebase Realtime Database의 최상위 경로(`/`)에서 시작합니다. 예: `/users/{uid}`, `/posts/{postId}`

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

1. **Firebase Cloud Functions Gen 2 버전 사용**:
   - ⚠️ **모든 Cloud Functions는 반드시 Gen 2 버전으로 작성**
   - Gen 1 API (`functions.https.onRequest`, `functions.database.ref()`) 사용 금지
   - Gen 2 API 사용: `onRequest`, `onValueCreated`, `onValueUpdated` 등
   - 참고: [Firebase Functions Gen 2 문서](https://firebase.google.com/docs/functions/2nd-gen)

2. **SNS 데이터 구조 준수**:
   - Firebase Realtime Database 최상위 경로 사용
   - 게시글: `/posts/{postId}`
   - 사용자: `/users/{uid}`
   - 통합 좋아요 (Flat Style): `/likes/{type}-{nodeId}-{uid}` (값: 1)
     - 게시글 좋아요: `/likes/post-{postId}-{uid}`
     - 댓글 좋아요: `/likes/comment-{commentId}-{uid}`
   - 댓글: `/comments/{commentId}`
   - 채팅: `/chat/messages/{roomId}/{messageId}`
   - 채팅 참여: `/chat/joins/{uid}/{roomId}`

3. **비동기 처리**:
   - 모든 비동기 작업은 `async/await` 구문 사용
   - Promise 체인 방식은 가급적 피하기

4. **에러 처리**:
   - 꼭 필요한 경우에만 에러 핸들링 작성
   - 불필요한 try-catch 블록은 피하기
   - 에러 발생 시 적절한 로그 남기기

5. **코드 주석**:
   - 모든 함수에 JSDoc 형식의 주석 작성
   - 복잡한 로직은 한글 주석으로 설명

6. **타입 안전성**:
   - TypeScript 타입을 명확히 지정
   - `any` 타입 사용 지양

7. **🔥 Database 트리거 분리 규칙 (강력 권장)**:
   - ⚠️ **onValueWritten() 사용 금지**: 생성/수정/삭제를 한 함수에서 처리하지 말 것
   - ✅ **각 이벤트 타입별로 별도 함수 작성**:
     - `onValueCreated()`: 데이터 생성 시에만 트리거
     - `onValueUpdated()`: 데이터 수정 시에만 트리거
     - `onValueDeleted()`: 데이터 삭제 시에만 트리거

   **이유**:
   - 코드 복잡도 감소 (각 함수가 단일 책임만 가짐)
   - 가독성 향상 (함수 이름만으로 어떤 이벤트를 처리하는지 명확함)
   - 디버깅 용이 (로그에서 어느 트리거가 실행되었는지 명확히 구분)
   - 조건문 감소 (before/after 값 비교 불필요)

   **잘못된 예시 (❌ 사용 금지)**:
   ```typescript
   // ❌ 나쁜 예: 생성/수정/삭제를 한 함수에서 처리
   export const onCategoryWrite = onValueWritten(
     { ref: "/chat-messages/{messageId}/category" },
     async (event) => {
       const before = event.data.before.val();
       const after = event.data.after.val();

       if (!before && after) {
         // 생성 로직
       } else if (before && after) {
         // 수정 로직
       } else if (before && !after) {
         // 삭제 로직
       }
     }
   );
   ```

   **올바른 예시 (✅ 권장)**:
   ```typescript
   // ✅ 좋은 예: 각 이벤트 타입별로 별도 함수 작성

   // 생성 전용 트리거
   export const onCategoryCreate = onValueCreated(
     { ref: "/chat-messages/{messageId}/category" },
     async (event) => {
       const category = event.data.val();
       // 생성 로직만 처리
       await handleCategoryCreate(messageId, category);
     }
   );

   // 수정 전용 트리거
   export const onCategoryUpdate = onValueUpdated(
     { ref: "/chat-messages/{messageId}/category" },
     async (event) => {
       const newCategory = event.data.after.val();
       const oldCategory = event.data.before.val();
       // 수정 로직만 처리
       await handleCategoryUpdate(messageId, newCategory, oldCategory);
     }
   );

   // 삭제 전용 트리거
   export const onCategoryDelete = onValueDeleted(
     { ref: "/chat-messages/{messageId}/category" },
     async (event) => {
       // 삭제 로직만 처리
       await handleCategoryDelete(messageId);
     }
   );
   ```

   **적용 사례**:
   - ✅ `onChatMessageCategoryCreate` / `onChatMessageCategoryUpdate` / `onChatMessageCategoryDelete`
   - ✅ `onCommentCreate` (생성만 처리)
   - ✅ `onUserCreate` / `onUserDisplayNameUpdate` / `onUserPhotoUrlUpdate` 등

   **예외 상황**:
   - 극히 단순한 로직(1-2줄)이면서 생성/수정을 동일하게 처리하는 경우에만 `onValueWritten()` 허용
   - 하지만 가능한 한 분리하는 것을 권장

---

## 4. 프로젝트 구조

```
firebase/
├── functions/
│   ├── src/
│   │   ├── index.ts              # 메인 진입점 (이벤트 핸들러만 정의)
│   │   ├── types/
│   │   │   └── index.ts          # TypeScript 타입 정의 (PostData, CommentData 등)
│   │   ├── handlers/             # 비즈니스 로직 핸들러
│   │   │   ├── post.handler.ts   # 게시글 관련 비즈니스 로직
│   │   │   ├── comment.handler.ts # 댓글 관련 비즈니스 로직
│   │   │   ├── like.handler.ts   # 좋아요 관련 비즈니스 로직
│   │   │   └── user.handler.ts   # 사용자 관련 비즈니스 로직
│   │   └── utils/                # 순수 함수 유틸리티
│   │       ├── comment.utils.ts  # 댓글 조회 유틸리티
│   │       └── post.utils.ts     # 게시글 조회 유틸리티
│   ├── test/                     # 테스트 파일
│   │   ├── unit/                 # Unit Tests (순수 함수 테스트)
│   │   │   ├── comment.handler.test.ts
│   │   │   └── like.handler.test.ts
│   │   └── integration/          # Integration Tests (핸들러 테스트)
│   │       ├── test-setup.ts     # firebase-functions-test 설정
│   │       ├── onPostCreate.test.ts
│   │       └── onLike.test.ts
│   ├── package.json              # npm 의존성
│   └── tsconfig.json             # TypeScript 설정
├── firebase.json                 # Firebase 프로젝트 설정
└── .firebaserc                   # Firebase 프로젝트 alias
```

### 파일별 역할

| 파일/폴더 | 역할 | 설명 |
|------|------|------|
| `index.ts` | **이벤트 핸들러** | Gen 2 트리거 함수만 정의 (5-10줄), 비즈니스 로직은 handlers/로 위임 |
| `types/` | **타입 정의** | TypeScript 인터페이스 및 타입 선언 (PostData, CommentData 등) |
| `handlers/` | **비즈니스 로직** | 실제 데이터 처리 및 RTDB 업데이트 로직 구현 (firebase-admin 의존) |
| `utils/` | **순수 함수** | Firebase 의존성 없는 순수 함수 (`comment.utils.ts`, `post.utils.ts` 등) |
| `test/unit/` | **Unit Tests** | 순수 함수 및 비즈니스 로직 테스트 (Emulator 불필요) |
| `test/integration/` | **Integration Tests** | firebase-functions-test로 이벤트 핸들러 테스트 |

---

### 4.1 클라이언트-서버 코드 공유 전략 (@functions Path Alias)

#### 4.1.1 개요

Sonub 프로젝트는 **Svelte 5 클라이언트**와 **Firebase Cloud Functions 백엔드**가 동일한 순수 함수(Pure Functions)를 공유하여 코드 중복을 제거하고 일관성을 유지합니다.

**공유 코드 위치**: `/src/lib/functions/`

#### 4.1.2 왜 코드를 공유하는가?

##### 문제점 (코드 공유 이전)

```
클라이언트 (Svelte)                  서버 (Cloud Functions)
├── isSingleChat()                  ├── isSingleChat()           ❌ 중복
├── buildSingleRoomId()             ├── buildSingleRoomId()      ❌ 중복
├── extractUidsFromSingleRoomId()   ├── extractUidsFromSingleRoomId()  ❌ 중복
└── thread-order 함수                 └── thread-order 함수          ❌ 중복
```

**문제점**:
- ❌ 코드 중복 (DRY 원칙 위반)
- ❌ 수정 시 양쪽 모두 변경 필요
- ❌ 불일치 가능성 (한쪽만 수정하는 경우)
- ❌ 유지보수 비용 증가

##### 해결책 (코드 공유 후)

```
공유 코드 (/src/lib/functions/)
├── chat.functions.ts
│   ├── isSingleChat()                    ✅ 한 곳에만 정의
│   ├── buildSingleRoomId()               ✅ 한 곳에만 정의
│   └── extractUidsFromSingleRoomId()     ✅ 한 곳에만 정의
└── thread-order.ts
    └── generateThreadOrder()             ✅ 한 곳에만 정의

↓ import

클라이언트 (Svelte)              서버 (Cloud Functions)
├── import from "$lib/functions"  ├── import from "@functions"
└── 동일한 코드 사용 ✅           └── 동일한 코드 사용 ✅
```

**장점**:
- ✅ 코드 중복 제거 (Single Source of Truth)
- ✅ 수정 시 한 곳만 변경
- ✅ 클라이언트와 서버 간 로직 일관성 보장
- ✅ 유지보수 용이
- ✅ 테스트 한 번만 작성

#### 4.1.3 공유 가능한 코드 vs 공유 불가능한 코드

| 구분 | 공유 가능 여부 | 예시 | 저장 위치 |
|------|--------------|------|----------|
| **순수 함수** | ✅ 공유 가능 | `isSingleChat()`, `buildSingleRoomId()`, `generateThreadOrder()` | `/src/lib/functions/` |
| **타입 정의** | ✅ 공유 가능 | `ChatMessage`, `UserData`, `PostData` | `/firebase/functions/src/types/` |
| **Firebase Admin 로직** | ❌ 공유 불가 | `admin.database().ref()`, `admin.auth()` | `/firebase/functions/src/handlers/` |
| **Svelte 컴포넌트** | ❌ 공유 불가 | `.svelte` 파일 | `/src/lib/components/` |
| **상수 (Constants)** | ✅ 공유 가능 | `FORUM_CATEGORIES`, `MAX_UPLOAD_SIZE` | `/src/lib/constants/` |

**공유 가능한 코드의 조건**:
1. Firebase 의존성 없음 (Admin SDK, Client SDK 모두 사용하지 않음)
2. Node.js 환경과 브라우저 환경 모두에서 실행 가능
3. 순수 함수 (입력 → 출력 변환만 수행, 부작용 없음)

#### 4.1.4 디렉토리 구조

```
프로젝트 루트/
├── src/
│   └── lib/
│       └── functions/              # 📦 공유 코드 저장소
│           ├── chat.functions.ts   # 채팅 관련 순수 함수
│           ├── like.functions.ts   # 좋아요 관련 순수 함수
│           ├── date.functions.ts   # 날짜 관련 순수 함수
│           └── user.functions.ts   # 사용자 관련 순수 함수
│
└── firebase/
    └── functions/
        ├── src/
        │   ├── handlers/           # 백엔드 비즈니스 로직 (firebase-admin 사용)
        │   │   ├── chat.handler.ts
        │   │   └── user.handler.ts
        │   └── index.ts            # Cloud Functions 진입점
        └── tsconfig.json           # TypeScript 설정 (Path Alias 포함)
```

#### 4.1.5 TypeScript 설정 (tsconfig.json)

**파일 위치**: `/firebase/functions/tsconfig.json`

```json
{
  "compilerOptions": {
    "module": "NodeNext",
    "moduleResolution": "nodenext",
    "outDir": "lib",

    // ✅ Path Alias 설정
    "baseUrl": "../..",
    "paths": {
      "@functions/*": ["src/lib/functions/*"]
    },

    // ✅ 공유 코드 포함
    "rootDirs": [
      "./src",
      "../src/lib/functions"
    ]
  },
  "include": [
    "src",
    "scripts",
    "../src/lib/functions/**/*.ts"  // ✅ 공유 코드 포함
  ]
}
```

**설정 설명**:

| 옵션 | 값 | 설명 |
|------|-----|------|
| `baseUrl` | `"../.."` | 프로젝트 루트를 가리킴 (`/firebase/functions/`에서 두 단계 위) |
| `paths` | `{"@functions/*": ["src/lib/functions/*"]}` | `@functions` alias를 `/src/lib/functions/`로 매핑 |
| `rootDirs` | `["./src", "../src/lib/functions"]` | 여러 폴더를 하나의 루트처럼 취급 |
| `include` | `"../src/lib/functions/**/*.ts"` | 공유 코드를 TypeScript 컴파일 대상에 포함 |

#### 4.1.6 tsc-alias를 사용한 빌드 프로세스

TypeScript의 `paths` 설정은 **컴파일 타임**에만 작동하고, 빌드된 JavaScript 파일에는 반영되지 않습니다. 따라서 `tsc-alias`를 사용하여 빌드 후 path alias를 실제 상대 경로로 변환합니다.

##### 설치

```bash
cd firebase/functions
npm install --save-dev tsc-alias
```

##### package.json 설정

**파일 위치**: `/firebase/functions/package.json`

```json
{
  "scripts": {
    "build": "tsc && tsc-alias",
    "deploy": "npm run lint:fix && firebase deploy --only functions"
  }
}
```

**빌드 과정**:

```
1. tsc 실행
   ├── TypeScript 컴파일
   ├── src/**/*.ts → lib/src/**/*.js
   └── @functions/chat.functions.js (path alias 그대로 유지)

2. tsc-alias 실행
   ├── lib/**/*.js 파일 스캔
   ├── @functions/chat.functions.js 탐지
   └── 실제 상대 경로로 변환: ../lib/functions/chat.functions.js

3. 결과
   ✅ 빌드된 파일에서 런타임에 정상 작동
```

#### 4.1.7 사용 예제

##### 4.1.7.1 공유 함수 정의

**소스 코드 위치**: [repository/src/lib/functions/chat.functions.ts.md](./repository/src/lib/functions/chat.functions.ts.md)

```typescript
/**
 * 채팅 관련 순수 함수 모음
 * ✅ 클라이언트와 서버 모두에서 사용 가능
 * ✅ Firebase 의존성 없음
 */

/**
 * roomId가 1:1 채팅방인지 확인한다.
 *
 * @param roomId - 확인할 채팅방 ID
 * @returns 1:1 채팅방이면 true, 아니면 false
 */
export function isSingleChat(roomId: string): boolean {
  return roomId.startsWith('single-');
}

/**
 * 1:1 채팅방 roomId에서 두 사용자의 UID를 추출한다.
 *
 * @param roomId - 1:1 채팅방 ID (형식: "single-uid1-uid2")
 * @returns 두 UID를 포함하는 배열 [uid1, uid2], 형식이 올바르지 않으면 null
 */
export function extractUidsFromSingleRoomId(roomId: string): [string, string] | null {
  const parts = roomId.split('-');
  if (parts.length !== 3 || parts[0] !== 'single') {
    return null;
  }
  return [parts[1], parts[2]];
}

/**
 * 1:1 채팅방의 roomId를 UID 두 개로부터 고정적으로 생성한다.
 *
 * @param uid1 - 첫 번째 사용자 UID
 * @param uid2 - 두 번째 사용자 UID
 * @returns 알파벳 순으로 정렬된 roomId (예: "single-alice-bob")
 */
export function buildSingleRoomId(uid1: string, uid2: string): string {
  return `single-${[uid1, uid2].sort().join('-')}`;
}
```

##### 4.1.7.2 서버에서 사용 (Cloud Functions)

**소스 코드 위치**: [repository/firebase/functions/src/handlers/chat.handler.ts.md](./repository/firebase/functions/src/handlers/chat.handler.ts.md)

```typescript
import * as logger from "firebase-functions/logger";
import * as admin from "firebase-admin";
import {ChatMessage} from "../types";

// ✅ @functions path alias로 공유 함수 import
// NodeNext 모듈 시스템에서는 .js 확장자 필수
import {
  isSingleChat,
  extractUidsFromSingleRoomId,
} from "@functions/chat.functions.js";

/**
 * 채팅 메시지 생성 시 비즈니스 로직 처리
 */
export async function handleChatMessageCreate(
  messageId: string,
  messageData: ChatMessage
): Promise<void> {
  const roomId = messageData.roomId;

  // ✅ 공유 함수 사용: 1:1 채팅인지 확인
  if (!isSingleChat(roomId)) {
    logger.info("1:1 채팅이 아니므로 건너뜀", { messageId, roomId });
    return;
  }

  // ✅ 공유 함수 사용: roomId에서 UID 추출
  const uids = extractUidsFromSingleRoomId(roomId);
  if (!uids) {
    logger.error("잘못된 roomId 형식", { messageId, roomId });
    return;
  }

  const [uid1, uid2] = uids;
  logger.info("1:1 채팅 메시지 처리", { uid1, uid2 });

  // Firebase Admin SDK를 사용한 데이터 업데이트
  // (이 부분은 서버에서만 실행 가능)
  await admin.database().ref(`/chat-joins/${uid1}/${roomId}`).update({
    lastMessageText: messageData.text,
    lastMessageAt: Date.now(),
  });
}
```

##### 4.1.7.3 클라이언트에서 사용 (Svelte)

**소스 코드 위치**: [repository/src/routes/chat/room/+page.svelte.md](./repository/src/routes/chat/room/+page.svelte.md)

```svelte
<script lang="ts">
  import { ref, push, update } from 'firebase/database';
  import { database } from '$lib/firebase';

  // ✅ $lib alias로 공유 함수 import
  import {
    isSingleChat,
    buildSingleRoomId
  } from '$lib/functions/chat.functions';

  let myUid = 'user-A';
  let partnerUid = 'user-B';

  // ✅ 공유 함수 사용: roomId 생성
  const roomId = buildSingleRoomId(myUid, partnerUid);
  // 결과: "single-user-A-user-B" (알파벳 순 정렬)

  // ✅ 공유 함수 사용: 1:1 채팅 여부 확인
  if (isSingleChat(roomId)) {
    console.log('1:1 채팅방입니다');
  }

  async function sendMessage(text: string) {
    const messageRef = push(ref(database, 'chat-messages'));
    await update(messageRef, {
      roomId,
      text,
      senderUid: myUid,
      createdAt: Date.now(),
    });
  }
</script>
```

#### 4.1.8 빌드 결과 확인

##### 빌드 전 (TypeScript)

**소스 코드 위치**: [repository/firebase/functions/src/handlers/chat.handler.ts.md](./repository/firebase/functions/src/handlers/chat.handler.ts.md)

```typescript
import {
  isSingleChat,
  extractUidsFromSingleRoomId,
} from "@functions/chat.functions.js";
```

##### 빌드 후 (JavaScript)

**소스 코드 위치**: [repository/firebase/functions/lib/src/handlers/chat.handler.js.md](./repository/firebase/functions/lib/src/handlers/chat.handler.js.md)

```javascript
// ✅ tsc-alias가 @functions를 실제 상대 경로로 변환
const chat_functions_1 = require("../lib/functions/chat.functions");

// 사용 예시
if (chat_functions_1.isSingleChat(roomId)) {
  // ...
}
```

**확인 방법**:

```bash
cd firebase/functions
npm run build

# 빌드된 파일 확인
cat lib/src/handlers/chat.handler.js | grep "require.*chat.functions"
# 출력: const chat_functions_1 = require("../lib/functions/chat.functions");
```

#### 4.1.9 주의사항

##### 1. NodeNext 모듈 시스템에서는 .js 확장자 필수

```typescript
// ✅ 올바른 import (NodeNext)
import { isSingleChat } from "@functions/chat.functions.js";

// ❌ 잘못된 import (컴파일 에러)
import { isSingleChat } from "@functions/chat.functions";
```

**이유**: NodeNext 모듈 해상도는 ESM(ES Modules) 규칙을 따르며, import 시 확장자를 명시해야 합니다.

##### 2. 공유 함수는 순수 함수로 작성

```typescript
// ✅ 올바른 공유 함수 (순수 함수)
export function buildSingleRoomId(uid1: string, uid2: string): string {
  return `single-${[uid1, uid2].sort().join('-')}`;
}

// ❌ 잘못된 공유 함수 (Firebase 의존성 포함)
export async function getUserProfile(uid: string) {
  // firebase-admin을 사용하면 클라이언트에서 실행 불가!
  return await admin.database().ref(`/users/${uid}`).once('value');
}
```

##### 3. tsc-alias 없이는 런타임 에러 발생

```bash
# tsc-alias 없이 빌드
cd firebase/functions
tsc  # ❌ path alias가 그대로 남음

# 배포 시도
firebase deploy --only functions
# ❌ 런타임 에러: Cannot find module '@functions/chat.functions.js'

# 해결책: tsc-alias 실행
npm run build  # tsc && tsc-alias ✅
```

##### 4. baseUrl은 프로젝트 루트를 가리켜야 함

```json
// ✅ 올바른 설정 (firebase/functions/tsconfig.json)
{
  "compilerOptions": {
    "baseUrl": "../..",  // 프로젝트 루트 (/firebase/functions에서 두 단계 위)
    "paths": {
      "@functions/*": ["src/lib/functions/*"]  // 프로젝트 루트 기준
    }
  }
}

// ❌ 잘못된 설정
{
  "compilerOptions": {
    "baseUrl": ".",  // firebase/functions 폴더를 가리킴
    "paths": {
      "@functions/*": ["../../src/lib/functions/*"]  // 상대 경로 사용 불가
    }
  }
}
```

#### 4.1.10 요약

| 항목 | 설명 |
|------|------|
| **공유 코드 위치** | `/src/lib/functions/` |
| **공유 가능 조건** | Firebase 의존성 없는 순수 함수 |
| **클라이언트 import** | `import { fn } from '$lib/functions/파일명'` |
| **서버 import** | `import { fn } from '@functions/파일명.js'` |
| **TypeScript 설정** | `baseUrl: "../.."`, `paths: {"@functions/*": ["src/lib/functions/*"]}` |
| **빌드 도구** | `tsc` + `tsc-alias` |
| **빌드 명령어** | `npm run build` (= `tsc && tsc-alias`) |
| **주의사항** | NodeNext에서는 `.js` 확장자 필수 |

**핵심 요약**:
- ✅ **DRY 원칙**: 코드 중복 제거
- ✅ **일관성**: 클라이언트와 서버가 동일한 로직 사용
- ✅ **유지보수성**: 한 곳만 수정하면 양쪽 모두 반영
- ✅ **테스트 용이성**: 순수 함수로 Unit Test 작성 용이
- ✅ **Type Safety**: TypeScript로 타입 안전성 보장

---

## 5. index.ts 파일 상세 가이드

### 5.1 파일 개요

`firebase/functions/src/index.ts`는 Firebase Cloud Functions **Gen 2**의 **메인 진입점**으로, SNS 이벤트(게시글 생성, 좋아요, 댓글 등) 발생 시 자동으로 실행되는 백그라운드 함수를 정의합니다.

**주요 역할**:
- Firebase Admin SDK 초기화
- 환경별 설정 관리
- **Gen 2 API**를 사용한 트리거 함수 정의 및 이벤트 라우팅

**파일 위치**: [firebase/functions/src/index.ts](./repository/firebase/functions/src/index.ts)

**중요**: 모든 함수는 `firebase-functions/v2` 패키지를 사용해야 합니다:
```typescript
// ✅ Gen 2 (올바름)
import { onValueCreated } from "firebase-functions/v2/database";

// ❌ Gen 1 (사용 금지)
import * as functions from "firebase-functions";
```

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
# test5 프로젝트에 배포 (권장)
cd firebase/functions
npm run deploy

# 또는 프로젝트를 명시적으로 지정
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

#### 함수별 개별 설정 가능 (Gen 2)

**Gen 2에서는 전역 설정과 개별 설정 모두 가능합니다:**

```typescript
import { setGlobalOptions } from "firebase-functions/v2";
import { onRequest } from "firebase-functions/v2/https";
import { onValueCreated } from "firebase-functions/v2/database";

// 전역 설정 (모든 함수에 적용)
setGlobalOptions({
  region: "asia-southeast1",
  maxInstances: 10,
});

// 개별 함수 설정 (전역 설정 오버라이드)
export const myFunction = onRequest(
  {
    region: "asia-southeast1",
    maxInstances: 5,  // 이 함수는 최대 5개만
  },
  (req, res) => {
    res.send("Hello");
  }
);

// Database 트리거도 동일
export const onLikeCreated = onValueCreated(
  {
    ref: "/post-props/likes/{postId}/{userId}",
    region: "asia-southeast1",
    maxInstances: 3,  // 좋아요 함수는 최대 3개만
  },
  async (event) => {
    // 처리 로직...
  }
);
```

#### 참고사항

- ⚠️ **Gen 2 전용**: 이 프로젝트는 Gen 2 API만 사용합니다
- **전역 설정**: `setGlobalOptions()`로 모든 함수의 기본값 설정
- **개별 설정**: 함수별로 옵션 객체를 전달하여 전역 설정 오버라이드 가능
- **Region 필수**: Database 트리거는 반드시 Database Region과 일치해야 함

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

### 5.5 핵심 함수 예제: 좋아요 개수 동기화

좋아요는 `/likes/{uid}/{targetId}` 경로에 `"post"` 또는 `"comment-{postId}"` 문자열을 저장합니다.

- **게시글(post)**: `/posts/{postId}/likeCount` 증감
- **댓글(comment-{postId})**: targetType에서 postId를 파싱하여 `/comments/{postId}/{commentId}/likeCount` 증감
- **통계**: `/stats/counters/like`를 `ServerValue.increment(±1)`로 업데이트

#### onLikeCreated (Gen 2)

```typescript
import {onValueCreated} from "firebase-functions/v2/database";
import type {LikeTargetType} from "./types";
import {handleLikeCreate} from "./handlers/like.handler";

export const onLikeCreated = onValueCreated(
  {
    ref: "/likes/{uid}/{targetId}",
    region: "asia-southeast1",
  },
  async (event) => {
    const uid = event.params.uid as string;
    const targetId = event.params.targetId as string;
    const targetType = event.data.val() as LikeTargetType | null;

    if (targetType !== "message" && targetType !== "comment") {
      logger.error("잘못된 좋아요 타입입니다.", {uid, targetId, targetType});
      return;
    }

    await handleLikeCreate(uid, targetId, targetType);
  }
);
```

#### onLikeDeleted (Gen 2)

```typescript
export const onLikeDeleted = onValueDeleted(
  {
    ref: "/likes/{uid}/{targetId}",
    region: "asia-southeast1",
  },
  async (event) => {
    const uid = event.params.uid as string;
    const targetId = event.params.targetId as string;
    const targetType = event.data.val() as LikeTargetType | null;

    if (targetType !== "message" && targetType !== "comment") {
      logger.error("잘못된 좋아요 타입입니다.", {uid, targetId, targetType});
      return;
    }

    await handleLikeDelete(uid, targetId, targetType);
  }
);
```

---

#### 5.5.1 SNS 이벤트 처리 자동화 프로세스

##### 클라이언트와 Cloud Functions의 역할 분담

**클라이언트 (Svelte)**:
- `/likes/{uid}/{targetId}`에 `"message"` 또는 `"comment"`만 기록
- 예시는 다음과 같습니다:
  ```typescript
  const likeRef = ref(rtdb, `likes/${authStore.user.uid}/${messageId}`);
  await set(likeRef, "message");
  ```

**Cloud Functions**:
- 게시글/댓글의 `likeCount` 증감
- `/stats/counters/like` 업데이트
- 댓글의 경우 targetType에서 postId를 파싱하여 처리 (`"comment-{postId}"` 형식)

---

##### Cloud Functions의 2단계 처리 과정

1. **대상 노드 판단**
   - targetType이 `"post"`인 경우 → `/posts/{postId}/likeCount`
   - targetType이 `"comment-{postId}"`인 경우 → targetType에서 postId 파싱 후 `/comments/{postId}/{commentId}/likeCount`

2. **통계 업데이트**
   - `/stats/counters/like`에 `ServerValue.increment(delta)` 적용 (delta = 1 또는 -1)

**결과 예시**:
```
/posts/
  post-abc123/
    text: "안녕하세요"
    likeCount: 5   ← Cloud Functions가 자동으로 관리

/likes/
  user-A-uid/
    post-abc123: "post"
    comment-xyz789: "comment-post-abc123"  ← 댓글 좋아요 (targetType에 postId 포함)
```

##### 사용자 프로필 동기화 Cloud Function

```typescript
/**
 * 사용자 프로필 업데이트 시 user-props 자동 동기화 (Gen 2)
 */
export const onUserUpdated = onValueUpdated(
  "/users/{uid}",
  async (event) => {
    const uid = event.params.uid as string;
    const newData = event.data.after.val();

    // displayName 또는 photoURL이 변경되었는지 확인
    const updates: { [key: string]: any } = {};

    if (newData.displayName) {
      updates[`/user-props/names/${uid}`] = newData.displayName;
    }

    if (newData.photoURL) {
      updates[`/user-props/photos/${uid}`] = newData.photoURL;
    }

    if (Object.keys(updates).length > 0) {
      await admin.database().ref().update(updates);
      console.log(`사용자 프로필 동기화 완료: ${uid}`);
    }
  }
);
```

---

## 6. 설계 철학

### Keep Trigger Functions Simple

주석에서 언급된 것처럼, **트리거 함수는 단순하게 유지**해야 합니다.

#### 트리거 함수가 해야 할 일

✅ **해야 할 일**:
1. 이벤트에서 데이터 추출
2. `postId`, `userId`, `commentId` 등 파라미터 추출
3. 간단한 데이터 검증
4. 적절한 핸들러 함수로 라우팅

❌ **하지 말아야 할 일**:
1. 복잡한 비즈니스 로직 구현
2. 여러 단계의 RTDB 조회 및 업데이트
3. 복잡한 데이터 변환 및 계산

#### 비즈니스 로직 분리

실제 비즈니스 로직 (좋아요/댓글 개수 계산, 사용자 프로필 동기화 등)은 **별도 함수**에서 처리합니다:

```typescript
// index.ts (트리거 함수) - 단순하게! (Gen 2)
import { onValueCreated } from "firebase-functions/v2/database";

export const onLikeCreated = onValueCreated(
  "/post-props/likes/{postId}/{userId}",
  async (event) => {
    const postId = event.params.postId as string;
    const userId = event.params.userId as string;

    // 간단한 검증 후 바로 라우팅
    if (!postId || !userId) return;
    await updateLikeCount(postId);
  }
);

// functions.ts (비즈니스 로직) - 복잡한 로직 구현
export async function updateLikeCount(postId: string) {
  // 좋아요 개수 계산
  // 게시글 카테고리 찾기
  // likeCount 업데이트
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

### 7.1 배포 방법

#### 권장 배포 명령어

**`npm run deploy` 명령을 사용하여 배포하는 것을 권장합니다:**

```bash
# firebase/functions 폴더에서 실행
cd firebase/functions
npm run deploy
```

이 명령은 다음 작업을 자동으로 수행합니다:
1. TypeScript 빌드 (`npm run build`)
2. ESLint 검사 (`npm run lint`)
3. Firebase Functions 배포 (`firebase deploy --only functions`)

#### 프로젝트 설정

배포 시 **올바른 프로젝트 설정**이 필요합니다:

```bash
# 프로젝트 확인
firebase use

# 프로젝트 전환 (필요시)
firebase use test5

# 배포 (권장)
npm run deploy

# 또는 직접 배포
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

SNS Cloud Functions 개발 시 반드시 최상위 경로 구조를 따라야 합니다:

- **게시글**: `/posts/{postId}`
- **사용자**: `/users/{uid}`
   - **좋아요 경로**: `/likes/{uid}/{targetId}`
     - 값: `"message"`, `"post"`, 또는 `"comment-{postId}"` 문자열
     - `targetId`: 게시글 `messageId` 또는 댓글 `commentId`
     - 댓글의 경우 targetType에 postId가 포함됨 (`"comment-{postId}"` 형식)
- **댓글**: `/comments/{commentId}`
- **채팅 메시지**: `/chat/messages/{roomId}/{messageId}`
- **채팅 참여**: `/chat/joins/{uid}/{roomId}`

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
// 게시글 인터페이스
interface Post {
  id: string;
  title: string;
  content: string;
  userId: string;
  category: string;
  createdAt: number;
  likeCount?: number;
  commentCount?: number;
}

// 사용 예시
const postData = event.data.val() as Post;
```

### 7.7 Firebase Cloud Functions Gen 2 필수 사항

⚠️ **매우 중요**: 모든 Cloud Functions는 반드시 Gen 2 버전으로 작성해야 합니다.

#### Gen 2 vs Gen 1 비교

| 구분 | Gen 1 (사용 금지) | Gen 2 (필수) |
|------|------------------|-------------|
| **Import** | `import * as functions from "firebase-functions"` | `import { onValueCreated } from "firebase-functions/v2/database"` |
| **트리거** | `functions.database.ref().onCreate()` | `onValueCreated(path, handler)` |
| **Region 설정** | `functions.region("asia-southeast1")` | `setGlobalOptions({ region: "asia-southeast1" })` |
| **최대 인스턴스** | `runWith({ maxInstances: 10 })` | `setGlobalOptions({ maxInstances: 10 })` |

#### Gen 2 필수 패키지

```json
{
  "dependencies": {
    "firebase-admin": "^12.0.0",
    "firebase-functions": "^5.0.0"  // ← Gen 2는 5.0.0 이상
  }
}
```

#### Gen 2 함수 작성 템플릿

```typescript
// ✅ 올바른 Gen 2 함수
import { onValueCreated } from "firebase-functions/v2/database";
import { setGlobalOptions } from "firebase-functions/v2";
import * as admin from "firebase-admin";

// Global 옵션 설정
setGlobalOptions({
  region: "asia-southeast1",
  maxInstances: 10,
});

export const onLikeCreated = onValueCreated(
  "/post-props/likes/{postId}/{userId}",
  async (event) => {
    const postId = event.params.postId as string;
    // 처리 로직...
  }
);
```

```typescript
// ❌ 잘못된 Gen 1 함수 (사용 금지)
import * as functions from "firebase-functions";

export const onLikeCreated = functions
  .region("asia-southeast1")
  .database
  .ref("/post-props/likes/{postId}/{userId}")
  .onCreate(async (snapshot, context) => {
    // ...
  });
```

---

## 8. 데이터베이스 트리거 구현 예제

본 섹션에서는 Firebase Realtime Database의 데이터 변경 이벤트에 반응하여 자동으로 실행되는 Cloud Functions 구현 예제를 제공합니다.

**중요**: 이 섹션의 모든 예제는 **sns-web-database.md**에 정의된 데이터베이스 구조를 기반으로 합니다. 데이터베이스 구조는 [SNS 데이터베이스 구조 가이드](./sns-web-database.md)를 참고하세요.

### 8.1 전체 통계 (stats/counters) 관리

전체 사용자, 게시글, 댓글, 좋아요의 총 개수를 자동으로 추적하는 Cloud Functions 구현 예제입니다.

**데이터베이스 경로**: `/stats/counters/`
- `user`: 전체 사용자 총 개수
- `post`: 전체 게시글 총 개수
- `comment`: 전체 댓글 총 개수
- `like`: 전체 좋아요 총 개수

**원칙**: 클라이언트는 이 경로를 직접 수정하지 않으며, Cloud Functions만이 업데이트합니다.

#### 8.1.1 사용자 등록 시 user 카운터 증가

새로운 사용자가 등록되면 `/stats/counters/user`를 1 증가시킵니다.

```typescript
// onUserCreate 함수 내 로직
if (userData) {
  // 📊 전체 사용자 통계 업데이트: user +1
  const statsUpdates = {} as Record<string, unknown>;
  statsUpdates[`stats/counters/user`] = admin.database.ServerValue.increment(1);
  await admin.database().ref().update(statsUpdates);
}
```

**트리거 경로**: `/users/{uid}`
**이벤트**: onCreate
**동작**: `/stats/counters/user` +1

#### 8.1.2 게시글 생성 시 post 카운터 증가

새로운 게시글이 생성되면 `/stats/counters/post`를 1 증가시킵니다.

```typescript
// onPostCreate 함수 내 로직
if (postData.category) {
  // 📊 전체 글 통계 업데이트: post +1
  const statsUpdates = {} as Record<string, unknown>;
  statsUpdates[`stats/counters/post`] = admin.database.ServerValue.increment(1);
  await admin.database().ref().update(statsUpdates);
}
```

**트리거 경로**: `/posts/{postId}`
**이벤트**: onCreate
**동작**: `/stats/counters/post` +1

#### 8.1.3 게시글 삭제 시 post 카운터 감소

게시글이 삭제되면 `/stats/counters/post`를 1 감소시킵니다.

```typescript
// onPostDelete 함수 내 로직
if (postData.category) {
  // 📊 전체 글 통계 업데이트: post -1
  const statsUpdates = {} as Record<string, unknown>;
  statsUpdates[`stats/counters/post`] = admin.database.ServerValue.increment(-1);
  await admin.database().ref().update(statsUpdates);
}
```

**트리거 경로**: `/posts/{postId}`
**이벤트**: onDelete
**동작**: `/stats/counters/post` -1

#### 8.1.4 댓글 생성 시 comment 카운터 증가

새로운 댓글이 생성되면 `/stats/counters/comment`를 1 증가시킵니다.

```typescript
// onCommentCreate 함수 내 로직
if (postData?.category) {
  // 📊 전체 댓글 통계 업데이트: comment +1
  const statsUpdates = {} as Record<string, unknown>;
  statsUpdates[`stats/counters/comment`] = admin.database.ServerValue.increment(1);
  await admin.database().ref().update(statsUpdates);
}
```

**트리거 경로**: `/comments/{commentId}`
**이벤트**: onCreate
**동작**: `/stats/counters/comment` +1

#### 8.1.5 댓글 삭제 시 comment 카운터 감소

댓글이 삭제되면 `/stats/counters/comment`를 1 감소시킵니다.

```typescript
// onCommentDelete 함수 내 로직
if (postData?.category) {
  // 📊 전체 댓글 통계 업데이트: comment -1
  const statsUpdates = {} as Record<string, unknown>;
  statsUpdates[`stats/counters/comment`] = admin.database.ServerValue.increment(-1);
  await admin.database().ref().update(statsUpdates);
}
```

**트리거 경로**: `/comments/{commentId}`
**이벤트**: onDelete
**동작**: `/stats/counters/comment` -1

#### 8.1.6 좋아요 추가 시 like 카운터 증가

사용자가 게시글 또는 댓글에 좋아요를 추가하면 `/stats/counters/like`를 1 증가시킵니다.

```typescript
// onLike 함수 내 로직
if (type === "post" || type === "comment") {
  // 📊 전체 좋아요 통계 업데이트: like +1
  const statsUpdates = {} as Record<string, unknown>;
  statsUpdates[`stats/counters/like`] = admin.database.ServerValue.increment(1);
  await admin.database().ref().update(statsUpdates);
}
```

**트리거 경로**: `/likes/{likeId}`
**이벤트**: onCreate
**동작**: `/stats/counters/like` +1

#### 8.1.7 좋아요 취소 시 like 카운터 감소

사용자가 좋아요를 취소하면 `/stats/counters/like`를 1 감소시킵니다.

```typescript
// onCancelLike 함수 내 로직
if (type === "post" || type === "comment") {
  // 📊 전체 좋아요 통계 업데이트: like -1
  const statsUpdates = {} as Record<string, unknown>;
  statsUpdates[`stats/counters/like`] = admin.database.ServerValue.increment(-1);
  await admin.database().ref().update(statsUpdates);
}
```

**트리거 경로**: `/likes/{likeId}`
**이벤트**: onDelete
**동작**: `/stats/counters/like` -1

### 8.2 카테고리 통계 (categories) 관리

게시판 카테고리별 게시글 개수와 댓글 개수를 자동으로 추적하는 Cloud Functions 구현 예제입니다.

**데이터베이스 경로**: `/categories/{categoryId}/`
- `postCount`: 해당 카테고리의 총 게시글 수
- `commentCount`: 해당 카테고리의 총 댓글 수

**원칙**: 클라이언트는 이 경로를 직접 수정하지 않으며, Cloud Functions만이 업데이트합니다.

#### 8.2.1 게시글 작성 시 postCount 증가

새로운 게시글이 생성되면 해당 카테고리의 `postCount`를 자동으로 1 증가시킵니다.

```typescript
/**
 * 게시글 작성 시 카테고리 통계 업데이트
 * /posts/{postId} 경로에 새 게시글이 생성될 때 트리거됨
 */
export const onPostCreate = functions.database.onCreate('/posts/{postId}', async (snapshot, context) => {
  const post = snapshot.val();
  const category = post.category;  // 'community', 'qna', 'news', 'market'

  // 카테고리 postCount 증가
  await admin
    .database()
    .ref(`categories/${category}/postCount`)
    .transaction((currentCount) => {
      return (currentCount || 0) + 1;
    });
});
```

**트리거 경로**: `/posts/{postId}`
**이벤트**: onCreate
**동작**: `/categories/{category}/postCount` +1

#### 8.2.2 댓글 작성 시 commentCount 증가

새로운 댓글이 생성되면 해당 게시글의 카테고리를 확인한 후 `commentCount`를 자동으로 1 증가시킵니다.

```typescript
/**
 * 댓글 작성 시 카테고리 통계 업데이트
 * /comments/{commentId} 경로에 새 댓글이 생성될 때 트리거됨
 */
export const onCommentCreate = functions.database.onCreate('/comments/{commentId}', async (snapshot, context) => {
  const comment = snapshot.val();
  const postId = comment.postId;

  // 게시글 정보 조회 (카테고리 확인용)
  const postSnapshot = await admin.database().ref(`posts/${postId}`).get();
  const post = postSnapshot.val();

  if (post) {
    const category = post.category;

    // 카테고리 commentCount 증가
    await admin
      .database()
      .ref(`categories/${category}/commentCount`)
      .transaction((currentCount) => {
        return (currentCount || 0) + 1;
      });
  }
});
```

**트리거 경로**: `/comments/{commentId}`
**이벤트**: onCreate
**동작**: `/categories/{category}/commentCount` +1

#### 8.2.3 게시글 삭제 시 postCount 감소

게시글이 삭제되면 해당 카테고리의 `postCount`를 1 감소시킵니다.

```typescript
/**
 * 게시글 삭제 시 카테고리 통계 업데이트
 * /posts/{postId} 경로의 게시글이 삭제될 때 트리거됨
 */
export const onPostDelete = functions.database.onDelete('/posts/{postId}', async (snapshot, context) => {
  const post = snapshot.val();
  const category = post.category;

  // 카테고리 postCount 감소
  await admin
    .database()
    .ref(`categories/${category}/postCount`)
    .transaction((currentCount) => {
      return Math.max(0, (currentCount || 0) - 1);
    });
});
```

**트리거 경로**: `/posts/{postId}`
**이벤트**: onDelete
**동작**: `/categories/{category}/postCount` -1 (음수 방지)

#### 8.2.4 댓글 삭제 시 commentCount 감소

댓글이 삭제되면 해당 카테고리의 `commentCount`를 1 감소시킵니다.

```typescript
/**
 * 댓글 삭제 시 카테고리 통계 업데이트
 * /comments/{commentId} 경로의 댓글이 삭제될 때 트리거됨
 */
export const onCommentDelete = functions.database.onDelete('/comments/{commentId}', async (snapshot, context) => {
  const comment = snapshot.val();
  const postId = comment.postId;

  // 게시글 정보 조회 (카테고리 확인용)
  const postSnapshot = await admin.database().ref(`posts/${postId}`).get();
  const post = postSnapshot.val();

  if (post) {
    const category = post.category;

    // 카테고리 commentCount 감소
    await admin
      .database()
      .ref(`categories/${category}/commentCount`)
      .transaction((currentCount) => {
        return Math.max(0, (currentCount || 0) - 1);
      });
  }
});
```

**트리거 경로**: `/comments/{commentId}`
**이벤트**: onDelete
**동작**: `/categories/{category}/commentCount` -1 (음수 방지)

#### 8.2.5 주의사항

- ✅ **transaction() 사용**: 동시성 문제 방지를 위해 `transaction()`을 사용합니다
- ✅ **음수 방지**: 삭제 시 `Math.max(0, ...)`으로 음수 방지
- ⚠️ **클라이언트에서 직접 수정 금지**: `categories` 노드는 Cloud Functions에 의해서만 수정됩니다
- ⚠️ **읽기 권한만 허용**: 모든 사용자가 카테고리 통계를 조회할 수 있도록 보안 규칙 설정

---

## 9. Unit Test 가이드

### 9.1 테스트 전략 개요

Firebase Cloud Functions의 테스트는 **두 가지 접근 방식**을 사용합니다:

#### 접근 방식 1: Unit Tests (단위 테스트)
- **대상**: 순수 함수 (`utils/`) 및 비즈니스 로직 (`handlers/`)
- **특징**: Firebase 의존성 최소화, 빠른 실행
- **도구**: Mocha + Chai
- **Emulator 필요 여부**: ❌ 불필요

#### 접근 방식 2: Integration Tests (통합 테스트)
- **대상**: 이벤트 핸들러 (`index.ts`의 트리거 함수)
- **특징**: firebase-functions-test로 이벤트 래핑
- **도구**: firebase-functions-test + Mocha + Chai
- **Emulator 필요 여부**: ❌ 불필요 (오프라인 모드)

### 9.2 리팩토링된 프로젝트 구조

#### 코드 분리 아키텍처

```
src/
├── index.ts          # 📌 이벤트 핸들러 (Thin Wrapper)
│                     # - Gen 2 트리거 함수만 정의
│                     # - 5-10줄의 간단한 라우팅 로직
│                     # - 복잡한 로직 없음
│
├── handlers/         # 🔧 비즈니스 로직 (Business Logic)
│   ├── post.handler.ts
│   ├── comment.handler.ts
│   ├── like.handler.ts
│   └── user.handler.ts
│                     # - 실제 데이터 처리 로직
│                     # - firebase-admin 의존
│                     # - 테스트 시 모킹 필요 (선택사항)
│
├── utils/            # 🎯 순수 함수 (Pure Functions)
│   ├── like.utils.ts
│   └── post.utils.ts
│                     # - Firebase 의존성 없음
│                     # - 입력 → 출력 변환만 수행
│                     # - 테스트 시 모킹 불필요
│
└── types/            # 📦 타입 정의
    └── index.ts
```

#### index.ts 예제 (리팩토링 후)

```typescript
// ✅ 리팩토링 후: 이벤트 핸들러만 정의 (5-10줄)
import { onValueCreated } from "firebase-functions/v2/database";
import { handleLikeCreate } from "./handlers/like.handler";

/**
 * 좋아요 추가 시 게시글/댓글의 likeCount 자동 업데이트
 */
export const onLike = onValueCreated("/likes/{likeId}", async (event) => {
  const likeId = event.params.likeId as string;

  logger.info("좋아요 추가 감지", { likeId });

  // 비즈니스 로직 핸들러 호출
  return await handleLikeCreate(likeId);
});
```

### 9.3 함수 로직 분리 철학

#### 왜 로직을 분리하는가?

**문제점 (리팩토링 전)**:
- ❌ `index.ts`에 모든 로직이 집중 (500+ 줄)
- ❌ 각 트리거 함수가 50-100줄씩 차지
- ❌ 테스트하기 어려움 (Firebase Event 객체 모킹 필요)
- ❌ 코드 재사용 불가능
- ❌ 유지보수 어려움

**해결책 (리팩토링 후)**:
- ✅ `index.ts`는 이벤트 라우팅만 담당 (5-10줄)
- ✅ `handlers/`에 비즈니스 로직 분리
- ✅ `utils/`에 순수 함수 분리
- ✅ 각 함수를 독립적으로 테스트 가능
- ✅ 코드 재사용 가능
- ✅ 유지보수 용이

#### 분리 패턴

```typescript
// ❌ Before: 모든 로직이 index.ts에 (50+ 줄)
export const onLikeCreated = onValueCreated("/likes/{uid}/{targetId}", async (event) => {
  const uid = event.params.uid as string;
  const targetId = event.params.targetId as string;
  const targetType = event.data.val();

  if (targetType === "message") {
    await admin.database().ref(`chat-messages/${targetId}/likeCount`)
      .set(admin.database.ServerValue.increment(1));
  } else if (targetType.startsWith("comment-")) {
    const postId = targetType.substring("comment-".length);
    await admin.database().ref(`comments/${postId}/${targetId}/likeCount`)
      .set(admin.database.ServerValue.increment(1));
    // ... 이후 로직 계속
  }

  await admin.database().ref("stats/counters/like")
    .set(admin.database.ServerValue.increment(1));
});
```

```typescript
// ✅ After: 로직 분리 (5-10줄)

// 📁 index.ts (이벤트 핸들러)
export const onLikeCreated = onValueCreated("/likes/{uid}/{targetId}", async (event) => {
  const uid = event.params.uid as string;
  const targetId = event.params.targetId as string;
  const targetType = event.data.val() as LikeTargetType | null;
  if (targetType !== "message" && targetType !== "comment") return;
  return await handleLikeCreate(uid, targetId, targetType);
});

// 📁 handlers/like.handler.ts (비즈니스 로직)
export async function handleLikeCreate(
  uid: string,
  targetId: string,
  targetType: LikeTargetType
) {
  // 1) /posts 또는 /comments likeCount 증감
  // 2) /stats/counters/like 업데이트
  // 3) 로깅
  return {success: true, uid, targetId, targetType};
}
```

### 9.4 테스트 환경 설정

#### 9.4.1 의존성 설치

```bash
cd firebase/functions
npm install --save-dev mocha chai @types/mocha @types/chai ts-node
```

**이미 설치된 패키지**:
- `firebase-functions-test@^3.1.0` (Integration Test용)

#### 9.4.2 테스트 스크립트 추가

`package.json`에 다음 스크립트를 추가합니다:

```json
{
  "scripts": {
    "test": "mocha --require ts-node/register 'test/**/*.test.ts' --timeout 10000",
    "test:unit": "mocha --require ts-node/register 'test/unit/**/*.test.ts' --timeout 5000",
    "test:integration": "mocha --require ts-node/register 'test/integration/**/*.test.ts' --timeout 10000",
    "test:watch": "mocha --require ts-node/register 'test/**/*.test.ts' --watch --watch-extensions ts"
  }
}
```

#### 9.4.3 테스트 폴더 구조

```
test/
├── unit/                          # Unit Tests
│   ├── comment.handler.test.ts    # 댓글 통계 로직 테스트
│   └── like.handler.test.ts       # 좋아요 증감 로직 테스트
└── integration/                   # Integration Tests
    ├── test-setup.ts              # firebase-functions-test 설정
    ├── onPostCreate.test.ts       # onPostCreate 핸들러 테스트
    └── onLike.test.ts             # onLikeCreated/onLikeDeleted 테스트
```

### 9.5 테스트 실행 방법

#### 전체 테스트 실행

```bash
npm run test
```

**출력 예시**:
```
  like.handler - 좋아요 처리
    ✓ 게시글 좋아요 추가 시 chat-messages/{id}/likeCount 증가
    ✓ 댓글 좋아요 취소 시 targetType에서 postId를 파싱하여 감소

  onLikeCreated
    ✓ /likes/{uid}/{targetId} → message 타입 처리
    ✓ /likes/{uid}/{targetId} → comment-{postId} 타입 처리

  4 passing (350ms)
```

#### Unit Tests만 실행

```bash
npm run test:unit
```

#### Integration Tests만 실행

```bash
npm run test:integration
```

#### Watch 모드 (파일 변경 시 자동 재실행)

```bash
npm run test:watch
```

### 9.6 Unit Test 예제

#### 9.6.1 순수 함수 테스트 (utils/)

**소스 코드 위치**: [repository/test/unit/like.handler.test.ts.md](./repository/test/unit/like.handler.test.ts.md)

```typescript
import {expect} from "chai";
import * as sinon from "sinon";
import * as admin from "firebase-admin";
import {handleLikeCreate, handleLikeDelete} from "../../src/handlers/like.handler";

describe("like.handler - 좋아요 증감", () => {
  // admin.database() 모킹, comment-locations 조회 등...
  it("게시글 좋아요 추가 시 chat-messages/{id}/likeCount가 증가한다", async () => {
    await handleLikeCreate("user-1", "message-1", "message");
    expect(setStub.firstCall.args[0]).to.deep.equal(
      admin.database.ServerValue.increment(1)
    );
  });

  it("댓글 좋아요 취소 시 targetType에서 postId를 파싱한다", async () => {
    await handleLikeDelete("user-2", "comment-9", "comment-post-555");
    expect(refStub.firstCall.args[0]).to.equal("comments/post-555/comment-9/likeCount");
  });
});
```

**테스트 실행**:
```bash
npm run test:unit
```

**테스트 커버리지**:
- ✅ 정상 케이스 (5 tests)
- ❌ 에러 케이스 (6 tests)
- 🔍 경계값 테스트 (2 tests)
- **총 13개 테스트, 모두 통과**

### 9.7 Integration Test 예제

#### 9.7.1 firebase-functions-test 설정

**소스 코드 위치**: [repository/test/integration/test-setup.ts.md](./repository/test/integration/test-setup.ts.md)

```typescript
import * as functionsTest from "firebase-functions-test";
import * as admin from "firebase-admin";

// firebase-functions-test 초기화 (오프라인 모드)
const testEnv = functionsTest({
  projectId: "test-project-id",
}, "./service-account-key.json");  // 선택사항

// Firebase Admin 초기화 (테스트용)
if (!admin.apps.length) {
  admin.initializeApp({
    projectId: "test-project-id",
    databaseURL: "https://test-project-id-default-rtdb.firebaseio.com",
  });
}

export { testEnv, admin };

// 테스트 종료 시 정리
export function cleanup() {
  testEnv.cleanup();
}
```

#### 9.7.2 이벤트 핸들러 테스트

**소스 코드 위치**: [repository/test/integration/onLike.test.ts.md](./repository/test/integration/onLike.test.ts.md)

```typescript
/**
 * Integration Test: onLike 이벤트 핸들러
 * firebase-functions-test를 사용하여 실제 이벤트 핸들러 테스트
 */

import { expect } from "chai";
import { testEnv, cleanup } from "./test-setup";
import * as myFunctions from "../../src/index";
import { PostData } from "../../src/types";

describe("onLike Integration Test", () => {
  after(() => {
    cleanup();
  });

  it("좋아요 추가 시 handleLikeCreate가 호출된다", async () => {
    // ✅ firebase-functions-test로 핸들러 래핑
    const wrapped = testEnv.wrap(myFunctions.onLike);

    const likeId = "post-abc123-user456";

    // 테스트용 DataSnapshot 생성
    const snap = testEnv.database.makeDataSnapshot(1, `/likes/${likeId}`);

    // 이벤트 핸들러 실행
    const result = await wrapped(snap, { params: { likeId } });

    // 검증
    expect(result).to.not.be.undefined;
    expect(result.success).to.be.true;
    expect(result.type).to.equal("post");
    expect(result.nodeId).to.equal("abc123");
    expect(result.uid).to.equal("user456");
  });

  it("잘못된 likeId는 에러를 반환한다", async () => {
    const wrapped = testEnv.wrap(myFunctions.onLike);

    const likeId = "invalid-format";
    const snap = testEnv.database.makeDataSnapshot(1, `/likes/${likeId}`);

    const result = await wrapped(snap, { params: { likeId } });

    expect(result.success).to.be.false;
    expect(result.error).to.equal("Invalid likeId format");
  });
});
```

**테스트 실행**:
```bash
npm run test:integration
```

#### 9.7.3 Integration Test의 장점

- ✅ **Emulator 불필요**: firebase-functions-test의 오프라인 모드 사용
- ✅ **실제 이벤트 흐름 테스트**: index.ts → handlers/ → utils/ 전체 스택 검증
- ✅ **빠른 실행**: 네트워크 요청 없이 로컬에서 실행
- ✅ **모킹 최소화**: firebase-functions-test가 Event 객체 자동 생성

---

## 10. 관련 문서

### SNS 프로젝트 문서

- **[SNS 웹 개발 가이드 (sns-web.md)](./sns-web.md)**:
  - 웹 개발 워크플로우
  - Svelte 5 Custom Elements 개발
  - Firebase 통합

- **[SNS 코딩 가이드라인 (sns-web-coding-guideline.md)](./sns-web-coding-guideline.md)**:
  - 반응형 상태 관리
  - RTDB 데이터 구조
  - Firebase Server Values 사용법

- **[SNS 보안 규칙 가이드 (sns-web-security.md)](./sns-web-security.md)**:
  - Firebase Security Rules 구현
  - 인증 기반 접근 제어

- **[SNS 사용자 관리 가이드 (sns-web-user.md)](./sns-web-user.md)**:
  - 사용자 프로필 데이터 구조
  - 프로필 사진 업로드

### Firebase 공식 문서

- **[Cloud Functions Gen 2 시작하기](https://firebase.google.com/docs/functions/get-started?gen=2nd)**
- **[Cloud Functions Gen 2로 마이그레이션](https://firebase.google.com/docs/functions/2nd-gen)**
- **[Database Triggers (Gen 2)](https://firebase.google.com/docs/functions/database-events?gen=2nd)**
- **[TypeScript 가이드](https://firebase.google.com/docs/functions/typescript)**
- **[Best Practices](https://firebase.google.com/docs/functions/best-practices)**

---

## 마무리

이 문서는 Firebase Cloud Functions **Gen 2**의 **메인 진입점인 index.ts** 파일과 **Unit Test 가이드**를 중심으로 작성되었습니다.

**핵심 포인트**:
- ✅ **Gen 2 필수 사용**: 모든 함수는 `firebase-functions/v2` 패키지 사용
- ✅ **3-Tier 아키텍처**: `index.ts` (이벤트 핸들러) → `handlers/` (비즈니스 로직) → `utils/` (순수 함수)
- ✅ **트리거 함수는 단순하게**: 이벤트 라우팅과 검증만 수행 (5-10줄)
- ✅ **비즈니스 로직 분리**: `handlers/`에서 실제 데이터 처리 구현
- ✅ **순수 함수 분리**: `utils/`에 Firebase 의존성 없는 유틸리티 함수
- ✅ **테스트 가능한 구조**: Unit Tests (utils/) + Integration Tests (handlers/, index.ts)
- ✅ **Emulator 불필요**: firebase-functions-test의 오프라인 모드 활용
- ✅ **최상위 경로 사용**: `/{ROOT_FOLDER}/` 제거, `/posts/`, `/users/` 등 직접 사용
- ✅ **비용 관리**: `setGlobalOptions({ maxInstances: 10 })`로 비용 통제
- ✅ **Region 일치**: Database trigger는 database region과 일치 필수

이 문서는 SNS 프로젝트의 백그라운드 처리를 담당하는 Cloud Functions 개발 및 테스트 가이드입니다! 🚀
