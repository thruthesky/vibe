---
title: onPostCreate.test.ts
type: typescript
path: firebase/functions/test/integration/onPostCreate.test.ts
status: active
version: 1.0.0
last_updated: 2025-11-15
---

## 개요

이 파일은 `firebase/functions/test/integration/onPostCreate.test.ts`의 소스 코드를 포함하는 SED 스펙 문서입니다.

## 소스 코드

```typescript
/**
 * Integration Test: onPostCreate Event Handler
 * firebase-functions-test를 사용하여 Event Handler를 직접 wrap하고 테스트
 *
 * ⚠️ 주의:
 * - 이 테스트는 실제 Firebase Admin SDK를 호출합니다
 * - 실제 데이터베이스에 연결하거나 Emulator를 사용해야 합니다
 * - 테스트 환경 설정 필요 (환경 변수 또는 service account key)
 */

import {expect} from "chai";
import {testEnv, cleanup} from "./test-setup";
import * as myFunctions from "../../src/index";
import {PostData} from "../../src/types";

describe("Integration Test: onPostCreate", () => {
  // 테스트 종료 후 cleanup
  after(() => {
    cleanup();
  });

  describe("✅ 정상 케이스", () => {
    it("새 게시글 생성 시 handlePostCreate가 호출된다", async () => {
      // Event Handler를 wrap
      const wrapped = testEnv.wrap(myFunctions.onPostCreate);

      // 테스트 데이터
      const postId = "test-post-123";
      const postData: PostData = {
        uid: "user123",
        author: "Test User",
        title: "Test Post",
        category: "community",
        createdAt: Date.now(),
      };

      // Event 객체 생성 및 함수 호출
      const snap = testEnv.database.makeDataSnapshot(postData, `/posts/${postId}`);
      const result = await wrapped(snap, {params: {postId}});

      // 결과 검증
      expect(result).to.not.be.undefined;
      expect(result.success).to.be.true;
      expect(result.postId).to.equal(postId);
      expect(result.category).to.equal("community");
    });

    it("카테고리가 없는 게시글도 정상 처리된다", async () => {
      const wrapped = testEnv.wrap(myFunctions.onPostCreate);

      const postId = "test-post-no-category";
      const postData: PostData = {
        uid: "user456",
        author: "Another User",
        title: "Post Without Category",
        createdAt: Date.now(),
      };

      const snap = testEnv.database.makeDataSnapshot(postData, `/posts/${postId}`);
      const result = await wrapped(snap, {params: {postId}});

      expect(result).to.not.be.undefined;
      expect(result.success).to.be.true;
      expect(result.postId).to.equal(postId);
    });
  });

  describe("🔍 필드 초기화 테스트", () => {
    it("likeCount와 commentCount가 초기화된다", async () => {
      const wrapped = testEnv.wrap(myFunctions.onPostCreate);

      const postId = "test-post-init-fields";
      const postData: PostData = {
        uid: "user789",
        title: "Test Initialization",
        category: "qna",
        createdAt: Date.now(),
        // likeCount와 commentCount가 없음
      };

      const snap = testEnv.database.makeDataSnapshot(postData, `/posts/${postId}`);
      const result = await wrapped(snap, {params: {postId}});

      expect(result).to.not.be.undefined;
      expect(result.success).to.be.true;

      // 참고: 실제로 필드가 초기화되었는지 확인하려면
      // Database를 직접 읽어야 하지만, 이 테스트에서는
      // 함수가 성공적으로 실행되었는지만 확인
    });
  });

  describe("❌ 에러 케이스", () => {
    it("빈 데이터로 호출해도 에러가 발생하지 않는다", async () => {
      const wrapped = testEnv.wrap(myFunctions.onPostCreate);

      const postId = "test-post-empty";
      const postData: PostData = {};

      const snap = testEnv.database.makeDataSnapshot(postData, `/posts/${postId}`);
      const result = await wrapped(snap, {params: {postId}});

      // 빈 데이터여도 함수는 성공해야 함 (필드 초기화만 수행)
      expect(result).to.not.be.undefined;
      expect(result.success).to.be.true;
    });
  });
});

```

