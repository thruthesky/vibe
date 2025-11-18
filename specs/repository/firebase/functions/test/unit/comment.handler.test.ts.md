---
title: comment.handler.test.ts
type: typescript
path: firebase/functions/test/unit/comment.handler.test.ts
status: active
version: 1.0.0
last_updated: 2025-11-15
---

## 개요

이 파일은 `firebase/functions/test/unit/comment.handler.test.ts`의 소스 코드를 포함하는 SED 스펙 문서입니다.

## 소스 코드

```typescript
/**
 * Unit Test: comment.handler.ts
 * handleCommentCreate, handleCommentDelete 함수 테스트
 *
 * Mocking: Firebase Admin SDK (database, logger)
 */

import {expect} from "chai";
import * as sinon from "sinon";
import * as admin from "firebase-admin";
import * as logger from "firebase-functions/logger";
import {handleCommentCreate, handleCommentDelete} from "../../src/handlers/comment.handler";
import {CommentData, PostData} from "../../src/types";

// Firebase Admin 초기화 (테스트 파일 로드 시 한 번만 실행)
if (!admin.apps.length) {
  admin.initializeApp({
    projectId: "test-project",
    databaseURL: "https://test-project.firebaseio.com",
  });
}

describe("comment.handler - 댓글 생성/삭제 처리", () => {
  let sandbox: sinon.SinonSandbox;
  let refStub: sinon.SinonStub;
  let updateStub: sinon.SinonStub;
  let onceStub: sinon.SinonStub;
  let loggerErrorStub: sinon.SinonStub;

  beforeEach(() => {
    sandbox = sinon.createSandbox();

    // Logger 스텁
    sandbox.stub(logger, "info");
    loggerErrorStub = sandbox.stub(logger, "error");

    // Database 스텁 설정
    updateStub = sandbox.stub().resolves();
    onceStub = sandbox.stub().resolves({
      val: () => null,
    });
    refStub = sandbox.stub().returns({
      update: updateStub,
      once: onceStub,
    });

    // admin.database()를 모킹
    const databaseStub = sandbox.stub(admin, "database") as any;
    databaseStub.returns({
      ref: refStub,
      ServerValue: admin.database.ServerValue,
    });
  });

  afterEach(() => {
    sandbox.restore();
  });

  describe("handleCommentCreate - 댓글 생성 처리", () => {
    describe("✅ 정상 케이스", () => {
      it("일반 댓글 생성 시 게시글 commentCount를 증가시킨다", async () => {
        // Given: 일반 댓글 데이터 (parentId 없음)
        const commentId = "comment-123";
        const commentData: CommentData = {
          postId: "post-abc",
          uid: "user-456",
          parentId: null,
          depth: 0,
          order: "0",
        };

        // Mock: 게시글 데이터 조회
        onceStub.resolves({
          val: () => ({category: "free"} as PostData),
        });

        // When: 댓글 생성 처리
        const result = await handleCommentCreate(commentId, commentData);

        // Then: 성공 응답
        expect(result.success).to.be.true;
        expect(result.postId).to.equal("post-abc");
        expect(result.commentId).to.equal("comment-123");

        // Then: 게시글 commentCount 증가 확인
        expect(updateStub.callCount).to.equal(3); // 게시글, 카테고리, 전체 통계
        const firstUpdate = updateStub.getCall(0).args[0];
        expect(firstUpdate["posts/post-abc/commentCount"]).to.deep.equal(
          admin.database.ServerValue.increment(1)
        );

        // Then: 카테고리 통계 업데이트 확인
        const secondUpdate = updateStub.getCall(1).args[0];
        expect(secondUpdate["categories/free/commentCount"]).to.deep.equal(
          admin.database.ServerValue.increment(1)
        );

        // Then: 전체 댓글 통계 업데이트 확인
        const thirdUpdate = updateStub.getCall(2).args[0];
        expect(thirdUpdate["stats/counters/comment"]).to.deep.equal(
          admin.database.ServerValue.increment(1)
        );
      });

      it("대댓글 생성 시 부모 댓글 commentCount를 증가시킨다", async () => {
        // Given: 대댓글 데이터 (parentId 있음)
        const commentId = "comment-789";
        const commentData: CommentData = {
          postId: "post-xyz",
          uid: "user-456",
          parentId: "comment-parent",
          depth: 1,
          order: "1",
        };

        // Mock: 게시글 데이터 조회
        onceStub.resolves({
          val: () => ({category: "notice"} as PostData),
        });

        // When: 대댓글 생성 처리
        const result = await handleCommentCreate(commentId, commentData);

        // Then: 성공 응답
        expect(result.success).to.be.true;
        expect(result.postId).to.equal("post-xyz");

        // Then: 부모 댓글 commentCount 증가 확인
        expect(updateStub.callCount).to.equal(4); // 게시글, 부모 댓글, 카테고리, 전체 통계
        const secondUpdate = updateStub.getCall(1).args[0];
        expect(secondUpdate["comments/comment-parent/commentCount"]).to.deep.equal(
          admin.database.ServerValue.increment(1)
        );
      });

      it("카테고리가 있는 게시글의 댓글 생성 시 카테고리 통계를 업데이트한다", async () => {
        // Given: 댓글 데이터
        const commentId = "comment-category";
        const commentData: CommentData = {
          postId: "post-with-category",
          uid: "user-123",
          parentId: null,
          depth: 0,
          order: "0",
        };

        // Mock: 카테고리가 있는 게시글
        onceStub.resolves({
          val: () => ({category: "tech"} as PostData),
        });

        // When: 댓글 생성 처리
        const result = await handleCommentCreate(commentId, commentData);

        // Then: 성공
        expect(result.success).to.be.true;

        // Then: 카테고리 통계 업데이트 확인
        const categoryUpdate = updateStub.getCall(1).args[0];
        expect(categoryUpdate["categories/tech/commentCount"]).to.deep.equal(
          admin.database.ServerValue.increment(1)
        );
      });

      it("전체 댓글 통계를 항상 업데이트한다", async () => {
        // Given: 댓글 데이터
        const commentId = "comment-stats";
        const commentData: CommentData = {
          postId: "post-stats",
          uid: "user-stats",
          parentId: null,
          depth: 0,
          order: "0",
        };

        // Mock: 게시글 데이터
        onceStub.resolves({
          val: () => ({category: "general"} as PostData),
        });

        // When: 댓글 생성 처리
        await handleCommentCreate(commentId, commentData);

        // Then: 전체 댓글 통계 업데이트 확인
        const statsUpdate = updateStub.getCall(2).args[0];
        expect(statsUpdate["stats/counters/comment"]).to.deep.equal(
          admin.database.ServerValue.increment(1)
        );
      });
    });

    describe("❌ 에러 케이스", () => {
      it("postId가 없는 경우 에러를 반환한다", async () => {
        // Given: postId가 없는 댓글 데이터
        const commentId = "comment-no-postid";
        const commentData: CommentData = {
          uid: "user-123",
          parentId: null,
          depth: 0,
          order: "0",
          // postId 없음
        };

        // When: 댓글 생성 시도
        const result = await handleCommentCreate(commentId, commentData);

        // Then: 에러 응답
        expect(result.success).to.be.false;
        expect(result.error).to.equal("Missing postId in comment data");
        expect(result.commentId).to.equal("comment-no-postid");

        // Then: 데이터베이스 업데이트가 호출되지 않음
        expect(updateStub.called).to.be.false;

        // Then: 에러 로그 확인
        expect(loggerErrorStub.calledOnce).to.be.true;
      });
    });

    describe("🔍 경계값 테스트", () => {
      it("parentId가 null인 경우 부모 댓글 업데이트를 스킵한다", async () => {
        // Given: parentId가 명시적으로 null
        const commentId = "comment-no-parent";
        const commentData: CommentData = {
          postId: "post-123",
          uid: "user-456",
          parentId: null,
          depth: 0,
          order: "0",
        };

        // Mock: 게시글 데이터
        onceStub.resolves({
          val: () => ({category: "test"} as PostData),
        });

        // When: 댓글 생성 처리
        await handleCommentCreate(commentId, commentData);

        // Then: 부모 댓글 업데이트 없이 3번만 호출 (게시글, 카테고리, 전체 통계)
        expect(updateStub.callCount).to.equal(3);

        // Then: comments/ 경로로의 업데이트가 없음
        updateStub.getCalls().forEach((call: sinon.SinonSpyCall) => {
          const updates = call.args[0];
          const keys = Object.keys(updates);
          keys.forEach((key) => {
            expect(key.startsWith("comments/")).to.be.false;
          });
        });
      });

      it("게시글에 카테고리가 없는 경우 카테고리 통계 업데이트를 스킵한다", async () => {
        // Given: 댓글 데이터
        const commentId = "comment-no-category";
        const commentData: CommentData = {
          postId: "post-no-cat",
          uid: "user-123",
          parentId: null,
          depth: 0,
          order: "0",
        };

        // Mock: 카테고리가 없는 게시글
        onceStub.resolves({
          val: () => ({} as PostData), // category 없음
        });

        // When: 댓글 생성 처리
        await handleCommentCreate(commentId, commentData);

        // Then: 카테고리 업데이트 없이 2번만 호출 (게시글, 전체 통계)
        expect(updateStub.callCount).to.equal(2);

        // Then: categories/ 경로로의 업데이트가 없음
        updateStub.getCalls().forEach((call: sinon.SinonSpyCall) => {
          const updates = call.args[0];
          const keys = Object.keys(updates);
          keys.forEach((key) => {
            expect(key.startsWith("categories/")).to.be.false;
          });
        });
      });

      it("ServerValue.increment(1)를 사용하여 원자적으로 증가시킨다", async () => {
        // Given: 댓글 데이터
        const commentId = "comment-increment";
        const commentData: CommentData = {
          postId: "post-increment",
          uid: "user-inc",
          parentId: "parent-inc",
          depth: 1,
          order: "1",
        };

        // Mock: 게시글 데이터
        onceStub.resolves({
          val: () => ({category: "test"} as PostData),
        });

        // When: 댓글 생성 처리
        await handleCommentCreate(commentId, commentData);

        // Then: 모든 업데이트가 ServerValue.increment(1) 사용
        updateStub.getCalls().forEach((call: sinon.SinonSpyCall) => {
          const updates = call.args[0];
          Object.values(updates).forEach((value) => {
            // ServerValue.increment(1)는 객체 형태
            expect(value).to.deep.equal(admin.database.ServerValue.increment(1));
          });
        });
      });
    });
  });

  describe("handleCommentDelete - 댓글 삭제 처리", () => {
    describe("✅ 정상 케이스", () => {
      it("일반 댓글 삭제 시 게시글 commentCount를 감소시킨다", async () => {
        // Given: 일반 댓글 데이터 (parentId 없음)
        const commentData: CommentData = {
          postId: "post-abc",
          uid: "user-456",
          parentId: null,
          depth: 0,
          order: "0",
        };

        // Mock: 게시글 데이터 조회
        onceStub.resolves({
          val: () => ({category: "free"} as PostData),
        });

        // When: 댓글 삭제 처리
        const result = await handleCommentDelete(commentData);

        // Then: 성공 응답
        expect(result.success).to.be.true;

        // Then: 게시글 commentCount 감소 확인
        expect(updateStub.callCount).to.equal(3); // 게시글, 카테고리, 전체 통계
        const firstUpdate = updateStub.getCall(0).args[0];
        expect(firstUpdate["posts/post-abc/commentCount"]).to.deep.equal(
          admin.database.ServerValue.increment(-1)
        );

        // Then: 카테고리 통계 업데이트 확인
        const secondUpdate = updateStub.getCall(1).args[0];
        expect(secondUpdate["categories/free/commentCount"]).to.deep.equal(
          admin.database.ServerValue.increment(-1)
        );

        // Then: 전체 댓글 통계 업데이트 확인
        const thirdUpdate = updateStub.getCall(2).args[0];
        expect(thirdUpdate["stats/counters/comment"]).to.deep.equal(
          admin.database.ServerValue.increment(-1)
        );
      });

      it("대댓글 삭제 시 부모 댓글 commentCount를 감소시킨다", async () => {
        // Given: 대댓글 데이터 (parentId 있음)
        const commentData: CommentData = {
          postId: "post-xyz",
          uid: "user-456",
          parentId: "comment-parent",
          depth: 1,
          order: "1",
        };

        // Mock: 게시글 데이터 조회
        onceStub.resolves({
          val: () => ({category: "notice"} as PostData),
        });

        // When: 대댓글 삭제 처리
        const result = await handleCommentDelete(commentData);

        // Then: 성공 응답
        expect(result.success).to.be.true;

        // Then: 부모 댓글 commentCount 감소 확인
        expect(updateStub.callCount).to.equal(4); // 게시글, 부모 댓글, 카테고리, 전체 통계
        const secondUpdate = updateStub.getCall(1).args[0];
        expect(secondUpdate["comments/comment-parent/commentCount"]).to.deep.equal(
          admin.database.ServerValue.increment(-1)
        );
      });

      it("카테고리가 있는 게시글의 댓글 삭제 시 카테고리 통계를 업데이트한다", async () => {
        // Given: 댓글 데이터
        const commentData: CommentData = {
          postId: "post-with-category",
          uid: "user-123",
          parentId: null,
          depth: 0,
          order: "0",
        };

        // Mock: 카테고리가 있는 게시글
        onceStub.resolves({
          val: () => ({category: "tech"} as PostData),
        });

        // When: 댓글 삭제 처리
        const result = await handleCommentDelete(commentData);

        // Then: 성공
        expect(result.success).to.be.true;

        // Then: 카테고리 통계 업데이트 확인
        const categoryUpdate = updateStub.getCall(1).args[0];
        expect(categoryUpdate["categories/tech/commentCount"]).to.deep.equal(
          admin.database.ServerValue.increment(-1)
        );
      });

      it("전체 댓글 통계를 항상 업데이트한다", async () => {
        // Given: 댓글 데이터
        const commentData: CommentData = {
          postId: "post-stats",
          uid: "user-stats",
          parentId: null,
          depth: 0,
          order: "0",
        };

        // Mock: 게시글 데이터
        onceStub.resolves({
          val: () => ({category: "general"} as PostData),
        });

        // When: 댓글 삭제 처리
        await handleCommentDelete(commentData);

        // Then: 전체 댓글 통계 업데이트 확인
        const statsUpdate = updateStub.getCall(2).args[0];
        expect(statsUpdate["stats/counters/comment"]).to.deep.equal(
          admin.database.ServerValue.increment(-1)
        );
      });
    });

    describe("❌ 에러 케이스", () => {
      it("postId가 없어도 에러 없이 처리된다 (부분적 업데이트)", async () => {
        // Given: postId가 없는 댓글 데이터
        const commentData: CommentData = {
          uid: "user-123",
          parentId: null,
          depth: 0,
          order: "0",
          // postId 없음
        };

        // When: 댓글 삭제 시도
        const result = await handleCommentDelete(commentData);

        // Then: 성공 응답 (일부 업데이트만 스킵)
        expect(result.success).to.be.true;

        // Then: 전체 통계만 업데이트 (게시글, 카테고리 스킵)
        expect(updateStub.callCount).to.equal(1); // 전체 통계만
        const statsUpdate = updateStub.getCall(0).args[0];
        expect(statsUpdate["stats/counters/comment"]).to.deep.equal(
          admin.database.ServerValue.increment(-1)
        );
      });
    });

    describe("🔍 경계값 테스트", () => {
      it("parentId가 null인 경우 부모 댓글 업데이트를 스킵한다", async () => {
        // Given: parentId가 명시적으로 null
        const commentData: CommentData = {
          postId: "post-123",
          uid: "user-456",
          parentId: null,
          depth: 0,
          order: "0",
        };

        // Mock: 게시글 데이터
        onceStub.resolves({
          val: () => ({category: "test"} as PostData),
        });

        // When: 댓글 삭제 처리
        await handleCommentDelete(commentData);

        // Then: 부모 댓글 업데이트 없이 3번만 호출 (게시글, 카테고리, 전체 통계)
        expect(updateStub.callCount).to.equal(3);

        // Then: comments/ 경로로의 업데이트가 없음
        updateStub.getCalls().forEach((call: sinon.SinonSpyCall) => {
          const updates = call.args[0];
          const keys = Object.keys(updates);
          keys.forEach((key) => {
            expect(key.startsWith("comments/")).to.be.false;
          });
        });
      });

      it("게시글에 카테고리가 없는 경우 카테고리 통계 업데이트를 스킵한다", async () => {
        // Given: 댓글 데이터
        const commentData: CommentData = {
          postId: "post-no-cat",
          uid: "user-123",
          parentId: null,
          depth: 0,
          order: "0",
        };

        // Mock: 카테고리가 없는 게시글
        onceStub.resolves({
          val: () => ({} as PostData), // category 없음
        });

        // When: 댓글 삭제 처리
        await handleCommentDelete(commentData);

        // Then: 카테고리 업데이트 없이 2번만 호출 (게시글, 전체 통계)
        expect(updateStub.callCount).to.equal(2);

        // Then: categories/ 경로로의 업데이트가 없음
        updateStub.getCalls().forEach((call: sinon.SinonSpyCall) => {
          const updates = call.args[0];
          const keys = Object.keys(updates);
          keys.forEach((key) => {
            expect(key.startsWith("categories/")).to.be.false;
          });
        });
      });

      it("ServerValue.increment(-1)를 사용하여 원자적으로 감소시킨다", async () => {
        // Given: 댓글 데이터
        const commentData: CommentData = {
          postId: "post-decrement",
          uid: "user-dec",
          parentId: "parent-dec",
          depth: 1,
          order: "1",
        };

        // Mock: 게시글 데이터
        onceStub.resolves({
          val: () => ({category: "test"} as PostData),
        });

        // When: 댓글 삭제 처리
        await handleCommentDelete(commentData);

        // Then: 모든 업데이트가 ServerValue.increment(-1) 사용
        updateStub.getCalls().forEach((call: sinon.SinonSpyCall) => {
          const updates = call.args[0];
          Object.values(updates).forEach((value) => {
            // ServerValue.increment(-1)는 객체 형태
            expect(value).to.deep.equal(admin.database.ServerValue.increment(-1));
          });
        });
      });
    });
  });
});

```

