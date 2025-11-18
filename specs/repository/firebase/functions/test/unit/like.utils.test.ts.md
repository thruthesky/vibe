---
title: like.utils.test.ts
type: typescript
path: firebase/functions/test/unit/like.utils.test.ts
status: active
version: 1.0.0
last_updated: 2025-11-15
---

## 개요

이 파일은 `firebase/functions/test/unit/like.utils.test.ts`의 소스 코드를 포함하는 SED 스펙 문서입니다.

## 소스 코드

```typescript
/**
 * Unit Test: like.utils.ts
 * parseLikeId 함수의 순수 함수 테스트
 *
 * Mocking 불필요: 순수 함수로 외부 의존성이 없음
 */

import {expect} from "chai";
import {parseLikeId} from "../../src/utils/like.utils";

describe("parseLikeId - likeId 파싱 함수", () => {
  describe("✅ 정상 케이스", () => {
    it("게시글 좋아요 ID를 올바르게 파싱한다 (단순한 형식)", () => {
      const likeId = "post-abc123-user456";
      const result = parseLikeId(likeId);

      expect(result).to.not.be.null;
      expect(result?.type).to.equal("post");
      expect(result?.nodeId).to.equal("abc123");
      expect(result?.uid).to.equal("user456");
    });

    it("댓글 좋아요 ID를 올바르게 파싱한다 (단순한 형식)", () => {
      const likeId = "comment-xyz789-user456";
      const result = parseLikeId(likeId);

      expect(result).to.not.be.null;
      expect(result?.type).to.equal("comment");
      expect(result?.nodeId).to.equal("xyz789");
      expect(result?.uid).to.equal("user456");
    });

    it("nodeId에 하이픈(-)이 포함된 경우를 올바르게 처리한다", () => {
      // Firebase push() 키는 하이픈을 포함할 수 있음
      const likeId = "post-OdEWc-SaDELU2Y51FDy-user123";
      const result = parseLikeId(likeId);

      expect(result).to.not.be.null;
      expect(result?.type).to.equal("post");
      expect(result?.nodeId).to.equal("OdEWc-SaDELU2Y51FDy");
      expect(result?.uid).to.equal("user123");
    });

    it("nodeId에 복잡한 하이픈(-)이 포함된 경우를 올바르게 처리한다", () => {
      // 복잡한 실전 케이스 - Firebase push() 키 + 영숫자 uid
      const likeId = "post-OdEWc-SaDELU2Y51FDy-zodDYjqcmfb5WHi1rVYrUJi0d2j2-user123abc456";
      const result = parseLikeId(likeId);

      expect(result).to.not.be.null;
      expect(result?.type).to.equal("post");
      expect(result?.nodeId).to.equal("OdEWc-SaDELU2Y51FDy-zodDYjqcmfb5WHi1rVYrUJi0d2j2");
      expect(result?.uid).to.equal("user123abc456");
    });

    it("댓글 좋아요에서도 복잡한 nodeId 하이픈 처리가 정상 작동한다", () => {
      // uid는 하이픈이 없는 영숫자 (Firebase Auth uid 규칙)
      const likeId = "comment-ABC-123-DEF-456-uid789xyz";
      const result = parseLikeId(likeId);

      expect(result).to.not.be.null;
      expect(result?.type).to.equal("comment");
      expect(result?.nodeId).to.equal("ABC-123-DEF-456");
      expect(result?.uid).to.equal("uid789xyz");
    });
  });

  describe("❌ 에러 케이스", () => {
    it("하이픈이 없는 likeId는 null을 반환한다", () => {
      const likeId = "invalidlikeid";
      const result = parseLikeId(likeId);

      expect(result).to.be.null;
    });

    it("잘못된 type은 null을 반환한다", () => {
      const likeId = "invalid-abc123-user456";
      const result = parseLikeId(likeId);

      expect(result).to.be.null;
    });

    it("type만 있고 nodeId와 uid가 없는 경우 null을 반환한다", () => {
      const likeId = "post-";
      const result = parseLikeId(likeId);

      expect(result).to.be.null;
    });

    it("type과 nodeId만 있고 uid가 없는 경우 null을 반환한다", () => {
      const likeId = "post-abc123-";
      const result = parseLikeId(likeId);

      expect(result).to.be.null;
    });

    it("빈 문자열은 null을 반환한다", () => {
      const likeId = "";
      const result = parseLikeId(likeId);

      expect(result).to.be.null;
    });

    it("type 다음에 하이픈이 하나만 있는 경우 null을 반환한다", () => {
      const likeId = "post-abc123";
      const result = parseLikeId(likeId);

      expect(result).to.be.null;
    });
  });

  describe("🔍 경계값 테스트", () => {
    it("최소한의 유효한 likeId를 파싱한다", () => {
      const likeId = "post-a-b";
      const result = parseLikeId(likeId);

      expect(result).to.not.be.null;
      expect(result?.type).to.equal("post");
      expect(result?.nodeId).to.equal("a");
      expect(result?.uid).to.equal("b");
    });

    it("매우 긴 nodeId와 uid를 처리한다", () => {
      const longNodeId = "a".repeat(100);
      const longUid = "b".repeat(100);
      const likeId = `comment-${longNodeId}-${longUid}`;
      const result = parseLikeId(likeId);

      expect(result).to.not.be.null;
      expect(result?.type).to.equal("comment");
      expect(result?.nodeId).to.equal(longNodeId);
      expect(result?.uid).to.equal(longUid);
    });
  });
});

```

