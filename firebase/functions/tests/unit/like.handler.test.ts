/**
 * Unit Test: like.handler.ts
 */

import {expect} from "chai";
import * as sinon from "sinon";
import * as admin from "firebase-admin";
import * as logger from "firebase-functions/logger";
import {handleLikeCreate, handleLikeDelete} from "../../src/handlers/like.handler";

if (!admin.apps.length) {
  admin.initializeApp({
    projectId: "test-project",
    databaseURL: "https://test-project.firebaseio.com",
  });
}

describe("like.handler - 좋아요 처리", () => {
  let sandbox: sinon.SinonSandbox;
  let refStub: sinon.SinonStub;
  let setStub: sinon.SinonStub;
  let onceStub: sinon.SinonStub;

  beforeEach(() => {
    sandbox = sinon.createSandbox();
    sandbox.stub(logger, "info");
    sandbox.stub(logger, "error");

    setStub = sandbox.stub().resolves();
    onceStub = sandbox.stub().resolves({
      exists: () => true,
      val: () => "message-123",
    });
    refStub = sandbox.stub().returns({
      set: setStub,
      once: onceStub,
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

  it("게시글 좋아요 추가 시 chat-messages likeCount를 증가시킨다", async () => {
    await handleLikeCreate("user-1", "message-1", "message");

    expect(refStub.firstCall.args[0]).to.equal("chat-messages/message-1/likeCount");
    expect(setStub.firstCall.args[0]).to.deep.equal(
      admin.database.ServerValue.increment(1)
    );

    const statsUpdatePath = refStub.getCall(1).args[0];
    expect(statsUpdatePath).to.equal("stats/counters/like");
    expect(setStub.getCall(1).args[0]).to.deep.equal(
      admin.database.ServerValue.increment(1)
    );
  });

  it("댓글 좋아요 취소 시 targetType에서 postId를 파싱하여 likeCount를 감소시킨다", async () => {
    // targetType 형식: "comment-{postId}"
    await handleLikeDelete("user-1", "comment-9", "comment-post-555");

    // 첫 번째 ref 호출: comments/{postId}/{commentId}/likeCount
    expect(refStub.firstCall.args[0]).to.equal(
      "comments/post-555/comment-9/likeCount"
    );
    expect(setStub.firstCall.args[0]).to.deep.equal(
      admin.database.ServerValue.increment(-1)
    );

    // 두 번째 ref 호출: likes-by/{targetId}/{uid} 삭제
    expect(refStub.getCall(1).args[0]).to.equal("likes-by/comment-9/user-1");

    // 세 번째 ref 호출: stats/counters/like
    expect(refStub.getCall(2).args[0]).to.equal("stats/counters/like");
    expect(setStub.getCall(1).args[0]).to.deep.equal(
      admin.database.ServerValue.increment(-1)
    );
  });
});
