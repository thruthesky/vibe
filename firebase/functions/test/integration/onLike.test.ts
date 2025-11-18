/**
 * Integration Test: onLikeCreated & onLikeDeleted
 */

import {testEnv, cleanup} from "./test-setup";
import * as myFunctions from "../../src/index";

describe("Integration Test: 좋아요 트리거", () => {
  after(() => {
    cleanup();
  });

  describe("✅ onLikeCreated", () => {
    it("게시글 좋아요를 정상적으로 처리한다", async () => {
      const wrapped = testEnv.wrap(myFunctions.onLikeCreated);

      const uid = "user-like-1";
      const targetId = "message-like-1";
      const snap = testEnv.database.makeDataSnapshot("message", `/likes/${uid}/${targetId}`);

      await wrapped(snap, {params: {uid, targetId}});
    });

    it("댓글 좋아요를 정상적으로 처리한다", async () => {
      const wrapped = testEnv.wrap(myFunctions.onLikeCreated);

      const uid = "user-like-2";
      const targetId = "comment-like-1";
      const snap = testEnv.database.makeDataSnapshot("comment", `/likes/${uid}/${targetId}`);

      await wrapped(snap, {params: {uid, targetId}});
    });
  });

  describe("✅ onLikeDeleted", () => {
    it("게시글 좋아요 취소를 정상적으로 처리한다", async () => {
      const wrapped = testEnv.wrap(myFunctions.onLikeDeleted);

      const uid = "user-like-3";
      const targetId = "message-like-2";
      const snap = testEnv.database.makeDataSnapshot("message", `/likes/${uid}/${targetId}`);

      await wrapped(snap, {params: {uid, targetId}});
    });

    it("댓글 좋아요 취소를 정상적으로 처리한다", async () => {
      const wrapped = testEnv.wrap(myFunctions.onLikeDeleted);

      const uid = "user-like-4";
      const targetId = "comment-like-2";
      const snap = testEnv.database.makeDataSnapshot("comment", `/likes/${uid}/${targetId}`);

      await wrapped(snap, {params: {uid, targetId}});
    });
  });

  describe("❌ 잘못된 값", () => {
    it("정의되지 않은 타입이면 조용히 종료된다", async () => {
      const wrapped = testEnv.wrap(myFunctions.onLikeCreated);
      const uid = "user-like-5";
      const targetId = "unknown-target";
      const snap = testEnv.database.makeDataSnapshot("invalid-type", `/likes/${uid}/${targetId}`);

      await wrapped(snap, {params: {uid, targetId}});
    });
  });
});
