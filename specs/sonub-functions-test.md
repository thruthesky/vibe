---
title: Firebase Cloud Functions 테스트 가이드
type: testing-guide
status: active
version: 2.0.0
last_updated: 2025-11-19
dependencies:
  - vitest
  - firebase-admin
  - sinon
  - chai
---

# Firebase Cloud Functions 테스트 가이드

이 문서는 Sonub 프로젝트의 Firebase Cloud Functions 테스트 작성 및 실행에 대한 가이드를 제공합니다.

## 📋 목차

1. [테스트 환경 설정](#테스트-환경-설정)
2. [테스트 종류](#테스트-종류)
3. [통계 시스템 테스트](#통계-시스템-테스트)
4. [인플루언서 점수 시스템 테스트](#인플루언서-점수-시스템-테스트)
5. [테스트 작성 규칙](#테스트-작성-규칙)
6. [임시 스크립트 관리](#임시-스크립트-관리)

---

## 테스트 환경 설정

### 기본 규칙

- **테스트 프레임워크**: `vitest` 사용 (필수)
- **테스트 위치**: `./firebase/functions/tests` 폴더에 작성 (필수)
- **인증 방식**: Firebase Admin Service Account Key 사용
- **Service Account Key 위치**: `./firebase/functions/firebase-service-account-key.json`

### 테스트 파일 구조

```
firebase/functions/
├── tests/
│   ├── unit/                          # 유닛 테스트
│   │   ├── like.handler.test.ts       # 좋아요 핸들러 유닛 테스트
│   │   ├── comment.handler.test.ts    # 댓글 핸들러 유닛 테스트
│   │   └── user.handler.test.ts       # 사용자 핸들러 유닛 테스트
│   ├── integration/                   # 통합 테스트
│   │   ├── onLike.test.ts             # 좋아요 통합 테스트
│   │   └── onPostCreate.test.ts       # 게시글 생성 통합 테스트
│   └── influencer-score-integration.test.ts  # 인플루언서 점수 통합 테스트
├── tmp/                               # 임시 스크립트 및 검증 파일
└── firebase-service-account-key.json  # Firebase Service Account Key
```

---

## 테스트 종류

### 1. 유닛 테스트 (Unit Test)

**목적**: 개별 함수의 로직을 격리하여 테스트

**특징**:
- Firebase Admin SDK 모킹 (Sinon 사용)
- 실제 데이터베이스에 접근하지 않음
- 빠른 실행 속도
- 외부 의존성 제거

**예시**: [like.handler.test.ts](../firebase/functions/tests/unit/like.handler.test.ts)

```typescript
import {expect} from "chai";
import * as sinon from "sinon";
import * as admin from "firebase-admin";
import {handleLikeCreate} from "../../src/handlers/like.handler";

describe("like.handler - 좋아요 처리", () => {
  let sandbox: sinon.SinonSandbox;
  let refStub: sinon.SinonStub;
  let setStub: sinon.SinonStub;

  beforeEach(() => {
    sandbox = sinon.createSandbox();

    // Firebase Admin SDK 모킹
    setStub = sandbox.stub().resolves();
    refStub = sandbox.stub().returns({
      set: setStub,
    });

    const databaseStub = sandbox.stub(admin, "database") as any;
    databaseStub.returns({
      ref: refStub,
      ServerValue: admin.database.ServerValue,
    });
  });

  afterEach(() => {
    sandbox.restore();
  });

  it("게시글 좋아요 추가 시 likeCount를 증가시킨다", async () => {
    await handleLikeCreate("user-1", "message-1", "message");

    expect(refStub.firstCall.args[0]).to.equal("chat-messages/message-1/likeCount");
    expect(setStub.firstCall.args[0]).to.deep.equal(
      admin.database.ServerValue.increment(1)
    );
  });
});
```

### 2. 통합 테스트 (Integration Test)

**목적**: 실제 Firebase 데이터베이스와 Cloud Functions를 연동하여 전체 플로우 테스트

**특징**:
- 실제 Firebase Realtime Database 사용
- Service Account Key로 인증
- Cloud Functions 트리거 대기 시간 필요
- 테스트 데이터 생성 및 정리 필수

**예시**: [influencer-score-integration.test.ts](../firebase/functions/tests/influencer-score-integration.test.ts)

```typescript
import {describe, it, expect, beforeAll, afterAll} from "vitest";
import * as admin from "firebase-admin";
import * as path from "path";

// Service Account Key 경로
const serviceAccountPath = path.join(__dirname, "..", "firebase-service-account-key.json");

let app: admin.app.App;
let database: admin.database.Database;

beforeAll(async () => {
  // Firebase Admin 초기화
  app = admin.initializeApp({
    credential: admin.credential.cert(serviceAccountPath),
    databaseURL: "https://sonub-firebase-default-rtdb.asia-southeast1.firebasedatabase.app",
  });

  database = admin.database();
});

afterAll(async () => {
  // 테스트 데이터 정리
  await database.ref("test-data").remove();
  await app.delete();
});

it("게시글 생성 시 인플루언서 점수가 증가한다", async () => {
  const testUid = "test-user-" + Date.now();

  // 게시글 생성
  await database.ref(`posts/${testUid}`).set({
    authorUid: testUid,
    text: "Test Post",
    createdAt: Date.now(),
  });

  // Cloud Functions 실행 대기 (3초)
  await new Promise((resolve) => setTimeout(resolve, 3000));

  // 점수 확인
  const score = (await database.ref(`influencer-scores/${testUid}`).get()).val();
  expect(score).toBe(50); // 게시글 작성 = +50점
}, 10000); // 타임아웃 10초
```

---

## 통계 시스템 테스트

### 통계 데이터 구조

Sonub는 사용자 행동에 대한 일별/월별/연도별/전체 통계를 수집합니다.

**데이터베이스 경로**:
```
user-stats/
└── {uid}/
    ├── total/                    # 전체 누적 통계
    │   ├── receivedLikes: 123
    │   ├── receivedComments: 45
    │   └── createdPosts: 67
    ├── daily/                    # 일별 통계
    │   └── {yyyyMMdd}/
    │       ├── receivedLikes: 10
    │       └── createdPosts: 3
    ├── monthly/                  # 월별 통계
    │   └── {yyyyMM}/
    │       ├── receivedLikes: 50
    │       └── createdPosts: 15
    └── yearly/                   # 연도별 통계
        └── {yyyy}/
            ├── receivedLikes: 100
            └── createdPosts: 30
```

### 통계 타입

[stats.utils.ts](../firebase/functions/src/utils/stats.utils.ts)에 정의된 통계 타입:

```typescript
export type StatType =
  | "receivedLikes"           // 받은 좋아요 수
  | "receivedComments"        // 받은 댓글 수 (게시글 + 댓글 댓글)
  | "receivedPostComments"    // 게시글에 받은 댓글 수
  | "receivedCommentReplies"  // 댓글에 받은 대댓글 수
  | "receivedFollowers"       // 받은 팔로워 수
  | "createdPosts"            // 작성한 게시글 수
  | "createdComments";        // 작성한 댓글 수
```

### 통계 테스트 예시

```typescript
it("좋아요 받은 통계가 올바르게 집계된다", async () => {
  const testUserA = "test-user-a-" + Date.now();
  const testUserB = "test-user-b-" + Date.now();
  const testPostId = "test-post-" + Date.now();

  // 게시글 생성
  await database.ref(`posts/${testPostId}`).set({
    authorUid: testUserA,
    text: "Test Post",
    createdAt: Date.now(),
  });

  await new Promise((resolve) => setTimeout(resolve, 3000));

  // 좋아요
  await database.ref(`likes/${testUserB}/${testPostId}`).set("post");

  await new Promise((resolve) => setTimeout(resolve, 3000));

  // 통계 확인
  const receivedLikes = (await database.ref(`user-stats/${testUserA}/total/receivedLikes`).get()).val();

  // 검증
  expect(receivedLikes).toBe(1);
}, 15000);
```

---

## 인플루언서 점수 시스템 테스트

### 인플루언서 점수 구조

**데이터베이스 경로**:
```
influencer-scores/
└── {uid}: 153                # 사용자별 총 점수

influencer-rankings/
├── daily/
│   └── {yyyyMMdd}/
│       └── {uid}: -153       # 음수로 저장 (내림차순 정렬용)
├── monthly/
│   └── {yyyyMM}/
│       └── {uid}: -153
├── yearly/
│   └── {yyyy}/
│       └── {uid}: -153
└── total/
    └── {uid}: -153
```

### 점수 체계

[influencer-scores.constants.ts](../firebase/functions/src/shared/influencer-scores.constants.ts)에 정의된 점수:

| 행동 | 작성자 점수 | 수신자 점수 | 설명 |
|------|------------|------------|------|
| 게시글 작성 | +50 | - | 게시글을 작성한 사용자 |
| 게시글 삭제 | -50 | - | 게시글을 삭제한 사용자 |
| 댓글 작성 | +5 | +5 | 댓글 작성자 +5, 게시글 작성자 +5 |
| 댓글 삭제 | -5 | -5 | 댓글 작성자 -5, 게시글 작성자 -5 |
| 좋아요 받음 | - | +3 | 게시글/댓글 작성자가 좋아요를 받음 |
| 좋아요 취소 | - | -3 | 좋아요가 취소됨 |
| 팔로워 받음 | - | +60 | 타인이 나를 팔로우 |
| 언팔로우 | - | -60 | 팔로우가 취소됨 |

**중요**: 자기 자신에게 한 좋아요, 댓글 등은 점수 계산에서 제외됩니다.

### 인플루언서 점수 테스트 예시

```typescript
describe("인플루언서 점수 시스템", () => {
  it("게시글에 좋아요를 하면 작성자의 점수가 +3점 증가한다", async () => {
    const testUserA = "test-user-a-" + Date.now();
    const testUserB = "test-user-b-" + Date.now();
    const testPostId = "test-post-" + Date.now();

    // 1. 게시글 생성 (User A가 작성)
    await database.ref(`posts/${testPostId}`).set({
      authorUid: testUserA,
      text: "Test Post",
      createdAt: Date.now(),
    });

    await new Promise((resolve) => setTimeout(resolve, 3000));

    // 초기 점수 확인
    const initialScore = (await database.ref(`influencer-scores/${testUserA}`).get()).val() || 0;

    // 2. User B가 User A의 게시글에 좋아요
    await database.ref(`likes/${testUserB}/${testPostId}`).set("post");

    await new Promise((resolve) => setTimeout(resolve, 3000));

    // 3. User A의 점수 확인
    const finalScore = (await database.ref(`influencer-scores/${testUserA}`).get()).val() || 0;

    // 4. 검증: 점수가 +3점 증가했는지 확인
    expect(finalScore).toBe(initialScore + 3);
  }, 15000);

  it("자기 자신의 게시글에 좋아요를 해도 점수가 증가하지 않는다", async () => {
    const testUserA = "test-user-a-" + Date.now();
    const testPostId = "test-post-" + Date.now();

    // 게시글 생성
    await database.ref(`posts/${testPostId}`).set({
      authorUid: testUserA,
      text: "Test Post",
      createdAt: Date.now(),
    });

    await new Promise((resolve) => setTimeout(resolve, 3000));

    const initialScore = (await database.ref(`influencer-scores/${testUserA}`).get()).val() || 0;

    // 자기 자신에게 좋아요 (본인 반응)
    await database.ref(`likes/${testUserA}/${testPostId}`).set("post");

    await new Promise((resolve) => setTimeout(resolve, 3000));

    const finalScore = (await database.ref(`influencer-scores/${testUserA}`).get()).val() || 0;

    // 검증: 점수가 변하지 않았는지 확인
    expect(finalScore).toBe(initialScore);
  }, 15000);
});
```

### 랭킹 테스트 예시

```typescript
it("인플루언서 점수가 변경되면 일간/월간/연간 랭킹에 자동으로 반영된다", async () => {
  const testUserA = "test-user-a-" + Date.now();
  const testPostId = "test-post-" + Date.now();

  // 게시글 생성 (50점)
  await database.ref(`posts/${testPostId}`).set({
    authorUid: testUserA,
    text: "Test Post",
    createdAt: Date.now(),
  });

  await new Promise((resolve) => setTimeout(resolve, 3000));

  // 점수 확인
  const score = (await database.ref(`influencer-scores/${testUserA}`).get()).val() || 0;
  expect(score).toBe(50);

  // UTC 날짜 계산
  const now = new Date();
  const year = now.getUTCFullYear();
  const month = String(now.getUTCMonth() + 1).padStart(2, "0");
  const day = String(now.getUTCDate()).padStart(2, "0");

  const dateKey = `${year}${month}${day}`;   // yyyyMMdd
  const monthKey = `${year}${month}`;        // yyyyMM
  const yearKey = `${year}`;                 // yyyy

  // 랭킹 데이터 확인 (음수로 저장됨)
  const dailyRanking = (await database.ref(`influencer-rankings/daily/${dateKey}/${testUserA}`).get()).val();
  const monthlyRanking = (await database.ref(`influencer-rankings/monthly/${monthKey}/${testUserA}`).get()).val();
  const yearlyRanking = (await database.ref(`influencer-rankings/yearly/${yearKey}/${testUserA}`).get()).val();
  const totalRanking = (await database.ref(`influencer-rankings/total/${testUserA}`).get()).val();

  // 검증: 모든 랭킹에 음수 점수가 기록되어야 함 (내림차순 정렬용)
  expect(dailyRanking).toBe(-50);
  expect(monthlyRanking).toBe(-50);
  expect(yearlyRanking).toBe(-50);
  expect(totalRanking).toBe(-50);
}, 15000);
```

---

## 테스트 작성 규칙

### 1. Cloud Functions 트리거 대기 시간

**필수**: Cloud Functions가 실행되고 데이터베이스를 업데이트할 시간을 확보해야 합니다.

```typescript
// 게시글 생성 후 대기
await database.ref(`posts/${postId}`).set(postData);
await new Promise((resolve) => setTimeout(resolve, 3000)); // 3초 대기

// 좋아요 후 대기
await database.ref(`likes/${uid}/${postId}`).set("post");
await new Promise((resolve) => setTimeout(resolve, 3000)); // 3초 대기
```

**권장 대기 시간**:
- 단순 업데이트: 1-3초
- 통계 집계: 3-5초
- 복잡한 트리거: 5-10초

### 2. 테스트 타임아웃 설정

**중요**: 통합 테스트는 Cloud Functions 실행 시간을 고려하여 충분한 타임아웃을 설정해야 합니다.

```typescript
it("테스트 설명", async () => {
  // 테스트 코드
}, 15000); // 타임아웃 15초
```

**권장 타임아웃**:
- 유닛 테스트: 기본값 (5초)
- 통합 테스트 (단순): 10-15초
- 통합 테스트 (복잡): 20-35초

### 3. 테스트 데이터 정리

**필수**: 각 테스트 전후로 데이터를 정리하여 격리된 환경을 유지해야 합니다.

```typescript
beforeEach(async () => {
  // 테스트 전 데이터 정리
  await database.ref(`posts/${testPostId}`).remove();
  await database.ref(`influencer-scores/${testUid}`).remove();
  await database.ref(`user-stats/${testUid}`).remove();
});

afterAll(async () => {
  // 모든 테스트 종료 후 정리
  await database.ref("test-data").remove();
  await app.delete();
});
```

**정리 전략**:
1. **beforeEach**: 각 테스트 시작 전 데이터 초기화
2. **afterEach**: 각 테스트 종료 후 데이터 삭제
3. **afterAll**: 모든 테스트 종료 후 Firebase Admin 종료

### 4. 테스트 UID 생성

**권장**: 테스트 UID는 `test-` 접두사와 타임스탬프를 사용하여 고유하게 생성합니다.

```typescript
const testUserA = "test-user-a-" + Date.now();
const testUserB = "test-user-b-" + Date.now();
const testPostId = "test-post-" + Date.now();
```

이렇게 하면:
- 각 테스트마다 고유한 ID 생성
- 테스트 데이터 추적 용이
- 정리 작업 시 `test-` 접두사로 필터링 가능

### 5. UTC 날짜 계산

**중요**: 통계 및 랭킹 데이터는 UTC 기준으로 관리됩니다.

```typescript
// UTC 날짜 계산 (핸들러와 동일한 형식)
const now = new Date();
const year = now.getUTCFullYear();
const month = String(now.getUTCMonth() + 1).padStart(2, "0");
const day = String(now.getUTCDate()).padStart(2, "0");

const dateKey = `${year}${month}${day}`;   // yyyyMMdd (일간)
const monthKey = `${year}${month}`;        // yyyyMM (월간)
const yearKey = `${year}`;                 // yyyy (연간)
```

---

## 임시 스크립트 관리

### 임시 스크립트 위치

**필수**: 모든 임시 스크립트, 검증 스크립트, 실행 스크립트는 `./firebase/functions/tmp` 폴더에 생성합니다.

```
firebase/functions/
└── tmp/
    ├── check-influencer-score.cjs    # 인플루언서 점수 확인 스크립트
    ├── cleanup-test-data.cjs         # 테스트 데이터 정리 스크립트
    └── verify-stats.cjs              # 통계 검증 스크립트
```

### 임시 스크립트 예시

**인플루언서 점수 확인 스크립트**:
```javascript
// firebase/functions/tmp/check-influencer-score.cjs
const admin = require("firebase-admin");
const serviceAccount = require("../firebase-service-account-key.json");

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  databaseURL: "https://sonub-firebase-default-rtdb.asia-southeast1.firebasedatabase.app",
});

const db = admin.database();

async function checkScore(uid) {
  const score = (await db.ref(`influencer-scores/${uid}`).get()).val();
  console.log(`User ${uid} score: ${score}`);
}

// 실행
const uid = process.argv[2];
checkScore(uid).then(() => process.exit(0));
```

**실행 방법**:
```bash
cd firebase/functions/tmp
node check-influencer-score.cjs test-user-123
```

---

## 테스트 실행

### 모든 테스트 실행
```bash
cd firebase/functions
npm test
```

### 특정 테스트 파일 실행
```bash
cd firebase/functions
npm test tests/unit/like.handler.test.ts
```

### 통합 테스트만 실행
```bash
cd firebase/functions
npm test tests/integration/
```

### 인플루언서 점수 테스트 실행
```bash
cd firebase/functions
npm test tests/influencer-score-integration.test.ts
```

---

## 참고 문서

- [통계 유틸리티](../firebase/functions/src/utils/stats.utils.ts)
- [인플루언서 점수 상수](../firebase/functions/src/shared/influencer-scores.constants.ts)
- [좋아요 통계 핸들러](../firebase/functions/src/handlers/stats.like.handler.ts)
- [좋아요 핸들러 유닛 테스트](../firebase/functions/tests/unit/like.handler.test.ts)
- [인플루언서 점수 통합 테스트](../firebase/functions/tests/influencer-score-integration.test.ts)
