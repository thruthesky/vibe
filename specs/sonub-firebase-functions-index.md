---
title: Firebase Cloud Functions Triggers
version: 1.0.0
status: implemented
tags: [firebase, cloud-functions, triggers, backend]
author: Claude SED Agent
date: 2025-11-11
dependencies:
  - sonub-firebase-database-structure.md
---

# Firebase Cloud Functions Triggers

## 개요

Firebase Cloud Functions Gen 2를 사용하여 Firebase Realtime Database의 이벤트를 감지하고 처리하는 트리거 함수들입니다.

## 목적

- Firebase Realtime Database의 데이터 변경 시 자동으로 비즈니스 로직 실행
- 사용자 등록, 업데이트 등의 이벤트 처리
- 데이터 정규화 및 동기화 자동화

## 기술 스택

- **Firebase Functions**: Gen 2 (firebase-functions/v2)
- **Firebase Admin SDK**: 데이터베이스 작업
- **TypeScript**: 타입 안전성
- **Region**: asia-southeast1 (RTDB와 동일한 리전 필수)

## 전역 설정

### setGlobalOptions

비용 관리를 위한 전역 옵션 설정:

**소스 코드 위치**: [index.ts.md](./repository/firebase/functions/src/index.ts.md)

```typescript
setGlobalOptions({
  maxInstances: 10,              // 최대 10개의 컨테이너만 동시 실행
  region: "asia-southeast1",     // RTDB region과 일치 필수
});
```

**설명:**
- `maxInstances: 10`: 예상치 못한 비용 급증 방지
- `region: "asia-southeast1"`: Firebase Realtime Database와 동일한 리전 사용 (성능 최적화)

## 트리거 함수들

### 1. onUserCreate

**트리거 경로:** `/users/{uid}`

**트리거 유형:** `onValueCreated` (새 데이터 생성 시 실행)

**목적:** 새로운 사용자 등록 시 자동으로 필수 필드 생성 및 데이터 정규화

**수행 작업:**
1. `createdAt` 필드 자동 생성 및 `/users/{uid}/createdAt` 직접 저장
2. `handleUserCreate()` 함수를 통해 모든 사용자 데이터 정규화 및 동기화 수행:
   - `updatedAt` 필드 자동 생성
   - `displayNameLowerCase` 자동 생성 (대소문자 구분 없는 검색용)
   - `photoUrl` 처리
   - `/users/{uid}` 노드 업데이트
   - `/user-props/` 노드 동기화
   - `/stats/counters/user +1` (전체 사용자 통계 업데이트)

**소스 코드:**

**소스 코드 위치**: [index.ts.md](./repository/firebase/functions/src/index.ts.md)

```typescript
export const onUserCreate = onValueCreated("/users/{uid}", async (event) => {
  const uid = event.params.uid as string;
  const userData = (event.data.val() || {}) as UserData;

  logger.info("새 사용자 등록 감지", {
    uid,
    displayName: userData.displayName ?? null,
  });

  // 비즈니스 로직 핸들러 호출
  return await handleUserCreate(uid, userData);
});
```

**파라미터:**
- `event.params.uid`: 사용자 UID (URL 경로에서 추출)
- `event.data.val()`: 새로 생성된 사용자 데이터 (UserData 타입)

**반환값:**
- `handleUserCreate()` 함수의 반환값: `{success: boolean; uid: string}`

**로깅:**
- 새 사용자 등록 감지 시 uid와 displayName 로깅

---

### 2. onUserUpdate

**트리거 경로:** `/users/{uid}`

**트리거 유형:** `onValueUpdated` (데이터 업데이트 시 실행)

**목적:** 사용자 정보 수정 시 특정 필드 변경에 따라 자동으로 관련 필드 업데이트

**수행 작업:**
1. `createdAt` 필드가 없으면 자동 생성
2. **중요:** `updatedAt`은 모든 업데이트에서 수정하는 것이 아니라, `displayName` 또는 `photoUrl`이 변경된 경우에만 새로운 timestamp로 업데이트
3. `displayNameLowerCase` 자동 생성 및 저장 (displayName 변경 시)

**소스 코드:**

**소스 코드 위치**: [index.ts.md](./repository/firebase/functions/src/index.ts.md)

```typescript
export const onUserUpdate = onValueUpdated("/users/{uid}", async (event) => {
  const uid = event.params.uid as string;

  // onValueUpdated는 before와 after 데이터를 모두 제공
  const beforeData = (event.data.before.val() || {}) as UserData;
  const afterData = (event.data.after.val() || {}) as UserData;

  logger.info("사용자 정보 수정 감지", {
    uid,
    beforeDisplayName: beforeData.displayName ?? null,
    afterDisplayName: afterData.displayName ?? null,
  });

  // 비즈니스 로직 핸들러 호출 (before/after 데이터 전달)
  return await handleUserUpdate(uid, beforeData, afterData);
});
```

**파라미터:**
- `event.params.uid`: 사용자 UID (URL 경로에서 추출)
- `event.data.before.val()`: 변경 전 사용자 데이터 (UserData 타입)
- `event.data.after.val()`: 변경 후 사용자 데이터 (UserData 타입)

**반환값:**
- `handleUserUpdate()` 함수의 반환값: `{success: boolean; uid: string; updated: boolean}`

**로깅:**
- 사용자 정보 수정 감지 시 uid와 before/after displayName 로깅

**특징:**
- `onValueUpdated`는 `before`와 `after` 데이터를 모두 제공하여 변경 감지 가능
- 변경 감지를 통해 불필요한 업데이트 방지 (성능 최적화)

---

### 3. onChatMessageCreate

**트리거 경로:** `/chat-messages/{messageId}`

**트리거 유형:** `onValueCreated` (새 데이터 생성 시 실행)

**목적:** 채팅 메시지 생성 시 처리 (게시글 + 댓글 역할 통합)

**현재 상태:** 후속 구현을 위한 빈 함수로 남겨둠

**소스 코드:**

**소스 코드 위치**: [index.ts.md](./repository/firebase/functions/src/index.ts.md)

```typescript
export const onChatMessageCreate = onValueCreated(
  "/chat-messages/{messageId}",
  async () => {
    // TODO: 채팅 메시지 생성 시 처리 로직을 추가하세요.
    return;
  }
);
```

---

## 전체 소스 코드

**소스 코드 위치:** [firebase/functions/src/index.ts.md](./repository/firebase/functions/src/index.ts.md)

```typescript
/**
 * Firebase Cloud Functions (Gen 2)
 * SNS 프로젝트의 백그라운드 이벤트 처리 함수들
 *
 * ⚠️ 중요: 모든 함수는 반드시 Gen 2 버전으로 작성해야 합니다.
 * - Gen 2 API: firebase-functions/v2
 * - Gen 1 API 사용 금지
 *
 * 참고: https://firebase.google.com/docs/functions/2nd-gen
 */

// Gen 2 API imports
import {setGlobalOptions} from "firebase-functions/v2";
import {
  onValueCreated,
  onValueDeleted,
  onValueUpdated,
  onValueWritten,
  DatabaseEvent,
} from "firebase-functions/v2/database";
import type {DataSnapshot} from "firebase-admin/database";
import * as logger from "firebase-functions/logger";
import * as admin from "firebase-admin";

// 타입 임포트
import {UserData, ChatMessage, LikeTargetType} from "./types";

// Firebase Database Event에 인증 정보를 포함하는 확장 타입
// Firebase Functions v2에서는 authType과 authId가 있지만 타입 정의에 누락됨
interface DatabaseEventWithAuth<T = DataSnapshot, Params = Record<string, string>>
  extends DatabaseEvent<T, Params> {
  authType?: string;
  authId?: string;
}

// 비즈니스 로직 핸들러 임포트
import {
  handleUserCreate,
  handleUserDisplayNameUpdate,
  handleUserPhotoUrlUpdate,
  handleUserBirthYearMonthDayUpdate,
  handleUserGenderUpdate,
} from "./handlers/user.handler";

// 상수 정의
const FIREBASE_REGION = "asia-southeast1";


// Firebase Admin 초기화
if (!admin.apps.length) {
  admin.initializeApp();
  logger.info("Firebase Admin initialized");
}

// 비용 관리를 위한 전역 옵션 설정
// 최대 10개의 컨테이너만 동시 실행하여 예상치 못한 비용 급증 방지
setGlobalOptions({
  maxInstances: 10,
  region: FIREBASE_REGION, // RTDB region과 일치 필수
});

/**
 * 채팅 메시지 생성 시 트리거되는 Cloud Function
 *
 * 트리거 경로: /chat-messages/{roomId}/{messageId}
 *
 * 수행 작업:
 * 1. 프로토콜 메시지 건너뛰기 (시스템 메시지)
 * 2. 필수 필드 유효성 검사 (senderUid, roomId)
 * 3. 1:1 채팅인 경우:
 *    - 양쪽 사용자의 chat-joins 자동 생성/업데이트
 *    - lastMessageText, lastMessageAt, newMessageCount 업데이트
 * 4. 그룹/오픈 채팅인 경우:
 *    - 모든 멤버의 chat-joins 업데이트
 *
 * 비즈니스 로직은 handlers/chat.message-create.handler.ts의 handleChatMessageCreate() 참조
 */
export const onChatMessageCreate = onValueCreated(
  {
    ref: "/chat-messages/{roomId}/{messageId}",
    region: FIREBASE_REGION,
  },
  async (event) => {
    // roomId는 2단계 구조를 위한 경로 파라미터
    const messageId = event.params.messageId as string;
    const messageData = (event.data.val() || {}) as ChatMessage;

    // 비즈니스 로직 핸들러 호출
    return await handleChatMessageCreate(messageId, messageData);
  }
);

/**
 * 사용자 등록 시 user-props 노드에 주요 필드를 분리 저장하고 createdAt을 설정합니다.
 *
 * 트리거 경로: /users/{uid}
 *
 * 수행 작업:
 * 1. createdAt 필드 자동 생성 및 /users/{uid}/createdAt 직접 저장
 * 2. handleUserCreate() 함수를 통해 모든 사용자 데이터 정규화 및 동기화 수행
 *    - updatedAt 필드 자동 생성
 *    - displayNameLowerCase 자동 생성
 *    - photoUrl 처리
 *    - /users/{uid} 노드 업데이트
 *    - /user-props/ 노드 동기화
 *    - /stats/counters/user +1 (전체 사용자 통계 업데이트)
 */
export const onUserCreate = onValueCreated(
  {
    ref: "/users/{uid}",
    region: FIREBASE_REGION,
  },
  async (event) => {
    const uid = event.params.uid as string;
    const userData = (event.data.val() || {}) as UserData;

    logger.info("새 사용자 등록 감지", {
      uid,
      displayName: userData.displayName ?? null,
    });

    // 비즈니스 로직 핸들러 호출
    return await handleUserCreate(uid, userData);
  }
);



/**
 * 사용자 displayName 필드 생성/수정/삭제 시 트리거
 *
 * 트리거 경로: /users/{uid}/displayName
 * 트리거 이벤트: onValueWritten (생성, 수정, 삭제 모두 감지)
 *
 * 수행 작업:
 * - 생성/수정 시:
 *   1. createdAt 필드가 없으면 자동 생성
 *   2. displayNameLowerCase 자동 생성 (대소문자 구분 없는 검색용)
 *   3. updatedAt 업데이트
 * - 삭제 시:
 *   1. displayNameLowerCase 삭제 (동기화)
 *   2. updatedAt 업데이트
 *
 * 무한 루프 방지:
 * - displayName 필드만 감지하므로 displayNameLowerCase 업데이트 시 재트리거 안 됨
 */
export const onUserDisplayNameWrite = onValueWritten(
  {
    ref: "/users/{uid}/displayName",
    region: FIREBASE_REGION,
  },
  async (event) => {
    const uid = event.params.uid as string;
    const beforeValue = event.data.before.val() as string | null;
    const afterValue = event.data.after.val() as string | null;

    logger.info("displayName 필드 변경 감지 (생성/수정/삭제)", {
      uid,
      beforeValue,
      afterValue,
      action: afterValue === null ? "삭제" : beforeValue === null ? "생성" : "수정",
    });

    // 비즈니스 로직 핸들러 호출
    return await handleUserDisplayNameUpdate(uid, beforeValue, afterValue);
  }
);

/**
 * 사용자 photoUrl 필드 생성/수정/삭제 시 트리거
 *
 * 트리거 경로: /users/{uid}/photoUrl
 * 트리거 이벤트: onValueWritten (생성, 수정, 삭제 모두 감지)
 *
 * 수행 작업:
 * - 생성/수정 시:
 *   1. createdAt 필드가 없으면 자동 생성
 *   2. updatedAt 업데이트
 * - 삭제 시:
 *   1. updatedAt 업데이트
 *
 * 무한 루프 방지:
 * - photoUrl 필드만 감지하므로 다른 필드 업데이트 시 재트리거 안 됨
 */
export const onUserPhotoUrlWrite = onValueWritten(
  {
    ref: "/users/{uid}/photoUrl",
    region: FIREBASE_REGION,
  },
  async (event) => {
    const uid = event.params.uid as string;
    const beforeValue = event.data.before.val() as string | null;
    const afterValue = event.data.after.val() as string | null;

    logger.info("photoUrl 필드 변경 감지 (생성/수정/삭제)", {
      uid,
      beforeValue,
      afterValue,
      action: afterValue === null ? "삭제" : beforeValue === null ? "생성" : "수정",
    });

    // 비즈니스 로직 핸들러 호출
    return await handleUserPhotoUrlUpdate(uid, beforeValue, afterValue);
  }
);

/**
 * 사용자 birthYearMonthDay 필드 생성/수정/삭제 시 트리거
 *
 * 트리거 경로: /users/{uid}/birthYearMonthDay
 * 트리거 이벤트: onValueWritten (생성, 수정, 삭제 모두 감지)
 *
 * 수행 작업:
 * - 생성/수정 시:
 *   1. createdAt 필드가 없으면 자동 생성
 *   2. YYYY-MM-DD 형식 파싱 및 유효성 검증
 *   3. 파생 필드 자동 생성:
 *      - birthYear (number): 생년
 *      - birthMonth (number): 생월
 *      - birthDay (number): 생일
 *      - birthMonthDay (string): 생월일 (MM-DD 형식)
 * - 삭제 시:
 *   1. 모든 파생 필드 삭제 (동기화)
 *
 * 무한 루프 방지:
 * - birthYearMonthDay 필드만 감지하므로 파생 필드 업데이트 시 재트리거 안 됨
 *
 * 참고:
 * - updatedAt은 업데이트하지 않음 (내부 속성 변경으로 간주)
 */
export const onUserBirthYearMonthDayWrite = onValueWritten(
  {
    ref: "/users/{uid}/birthYearMonthDay",
    region: FIREBASE_REGION,
  },
  async (event) => {
    const uid = event.params.uid as string;
    const beforeValue = event.data.before.val() as string | null;
    const afterValue = event.data.after.val() as string | null;

    logger.info("birthYearMonthDay 필드 변경 감지 (생성/수정/삭제)", {
      uid,
      beforeValue,
      afterValue,
      action: afterValue === null ? "삭제" : beforeValue === null ? "생성" : "수정",
    });

    // 비즈니스 로직 핸들러 호출
    return await handleUserBirthYearMonthDayUpdate(uid, beforeValue, afterValue);
  }
);

/**
 * 사용자 gender 필드 생성/수정/삭제 시 트리거
 *
 * 트리거 경로: /users/{uid}/gender
 * 트리거 이벤트: onValueWritten (생성, 수정, 삭제 모두 감지)
 *
 * 수행 작업:
 * - 생성/수정 시:
 *   1. photoUrl 존재 여부 확인
 *   2. photoUrl이 있는 경우:
 *      - gender=F: sort_recentFemaleWithPhoto에 createdAt 설정, sort_recentMaleWithPhoto는 null
 *      - gender=M: sort_recentMaleWithPhoto에 createdAt 설정, sort_recentFemaleWithPhoto는 null
 *   3. photoUrl이 없는 경우: 두 정렬 필드 모두 null
 *   4. updatedAt 업데이트
 * - 삭제 시:
 *   1. sort_recentFemaleWithPhoto와 sort_recentMaleWithPhoto 삭제
 *   2. updatedAt 업데이트
 *
 * 무한 루프 방지:
 * - gender 필드만 감지하므로 다른 필드 업데이트 시 재트리거 안 됨
 */
export const onUserGenderWrite = onValueWritten(
  {
    ref: "/users/{uid}/gender",
    region: FIREBASE_REGION,
  },
  async (event) => {
    const uid = event.params.uid as string;
    const beforeValue = event.data.before.val() as string | null;
    const afterValue = event.data.after.val() as string | null;

    logger.info("gender 필드 변경 감지 (생성/수정/삭제)", {
      uid,
      beforeValue,
      afterValue,
      action: afterValue === null ? "삭제" : beforeValue === null ? "생성" : "수정",
    });

    // 비즈니스 로직 핸들러 호출
    return await handleUserGenderUpdate(uid, beforeValue, afterValue);
  }
);
```

## 의존성

### 필수 패키지

- `firebase-admin`: Firebase Admin SDK
- `firebase-functions`: Firebase Cloud Functions SDK

### 내부 모듈

- `./types`: TypeScript 타입 정의 (UserData 등)
- `./handlers/user.handler`: 사용자 관련 비즈니스 로직 핸들러

## 배포

**소스 코드 위치**: [index.ts.md](./repository/firebase/functions/src/index.ts.md)

```bash
# 배포 전 빌드 및 린트
npm run deploy

# 또는 직접 배포
firebase deploy --only functions
```

## 주의사항

1. **Gen 2 필수**: 모든 함수는 반드시 Gen 2 API를 사용해야 합니다
   - Gen 1 API 사용 금지
   - `firebase-functions/v2`에서 임포트

2. **리전 일치**: Cloud Functions의 리전은 RTDB와 동일해야 합니다
   - `region: "asia-southeast1"`

3. **비용 관리**: `maxInstances` 설정으로 비용 급증 방지
   - 현재 최대 10개 인스턴스로 제한

4. **로깅**: 모든 주요 이벤트는 `firebase-functions/logger`를 사용하여 로깅
   - Cloud Logging에서 확인 가능

5. **에러 처리**: 핸들러 함수에서 에러 발생 시 자동으로 재시도
   - 최대 재시도 횟수: Firebase 기본값 사용

## 테스트

단위 테스트는 `firebase/functions/test/unit/` 폴더에 위치:

- `user.handler.test.ts`: handleUserUpdate 함수 테스트

테스트 실행:

**소스 코드 위치**: [index.ts.md](./repository/firebase/functions/src/index.ts.md)

```bash
npm run test:unit
```

## 참고 문서

- [Firebase Cloud Functions Gen 2](https://firebase.google.com/docs/functions/2nd-gen)
- [Firebase Realtime Database Triggers](https://firebase.google.com/docs/functions/database-events)
- [Firebase Admin SDK](https://firebase.google.com/docs/admin/setup)
