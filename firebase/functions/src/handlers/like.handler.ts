/**
 * 좋아요 관련 핸들러
 */

import * as admin from "firebase-admin";
import * as logger from "firebase-functions/logger";
import type {LikeTargetType} from "../types";
import {incrementActionCounter} from "./user-action-counters.handler";

/**
 * 좋아요 추가 처리
 */
export async function handleLikeCreate(
  uid: string,
  targetId: string,
  targetType: LikeTargetType
): Promise<void> {
  logger.info("👍 좋아요 추가 감지", {uid, targetId, targetType});

  logger.info("📤 applyLikeDelta 호출", {targetId, targetType, delta: 1});
  const success = await applyLikeDelta(targetId, targetType, 1);
  logger.info("📥 applyLikeDelta 결과", {success, targetId, targetType});

  // 사용자별 좋아요 통계 업데이트
  if (success) {
    await incrementActionCounter(uid, "like", 1);
  }

  // 좋아요한 사용자 목록에 추가 (프로필 사진 표시용)
  // 메시지, 게시글, 댓글 모두 통합된 /likes-by 경로 사용
  const likesByPath = `likes-by/${targetId}/${uid}`;
  logger.info("💾 likes-by 경로에 사용자 추가 시도", {
    path: likesByPath,
    targetId,
    uid,
    targetType,
    value: true,
  });

  await admin
    .database()
    .ref(likesByPath)
    .set(true);

  logger.info("✅ likes-by 경로에 사용자 추가 완료", {
    path: likesByPath,
    targetId,
    uid,
    targetType,
  });
}

/**
 * 좋아요 취소 처리
 */
export async function handleLikeDelete(
  uid: string,
  targetId: string,
  targetType: LikeTargetType
): Promise<void> {
  logger.info("💔 좋아요 취소 감지", {uid, targetId, targetType});

  const success = await applyLikeDelta(targetId, targetType, -1);

  // 사용자별 좋아요 통계 업데이트
  if (success) {
    await incrementActionCounter(uid, "like", -1);
  }

  // 좋아요한 사용자 목록에서 제거
  // 메시지, 게시글, 댓글 모두 통합된 /likes-by 경로 사용
  await admin
    .database()
    .ref(`likes-by/${targetId}/${uid}`)
    .remove();

  logger.info("likes-by 경로에서 사용자 제거 완료", {targetId, uid, targetType});
}

/**
 * 게시글, 댓글, 또는 메시지의 likeCount 증감 처리
 */
async function applyLikeDelta(
  targetId: string,
  targetType: LikeTargetType,
  delta: 1 | -1
): Promise<boolean> {
  try {
    logger.info("🔄 applyLikeDelta 시작", {targetId, targetType, delta});

    // 1. 채팅 메시지 좋아요 처리 (2단계 구조: /chat-messages/{roomId}/{messageId})
    if (targetType === "message") {
      logger.error("❌ 잘못된 targetType입니다. 채팅 메시지는 'chat-message-{roomId}' 형식을 사용해야 합니다.", {targetId, targetType});
      return false;
    }

    // 1-1. 채팅 메시지 좋아요 처리 (값 형식: "chat-message-{roomId}")
    if (targetType.startsWith("chat-message-")) {
      logger.info("💬 채팅 메시지 좋아요 처리 시작", {targetId, targetType});

      // roomId 파싱: "chat-message-{roomId}" -> {roomId}
      const roomId = targetType.substring("chat-message-".length);

      if (!roomId) {
        logger.error("❌ roomId를 파싱할 수 없습니다", {targetId, targetType});
        return false;
      }

      const likeCountPath = `chat-messages/${roomId}/${targetId}/likeCount`;
      logger.info("💾 채팅 메시지 likeCount 업데이트 시도", {
        path: likeCountPath,
        roomId,
        targetId,
        delta,
      });

      await admin
        .database()
        .ref(likeCountPath)
        .set(admin.database.ServerValue.increment(delta));

      logger.info("✅ 채팅 메시지 likeCount 업데이트 완료", {
        path: likeCountPath,
        roomId,
        targetId,
        delta,
      });
      return true;
    }

    // 2. 게시글 좋아요 처리 (경로: /posts/{postId})
    if (targetType === "post") {
      await admin
        .database()
        .ref(`posts/${targetId}/likeCount`)
        .set(admin.database.ServerValue.increment(delta));

      logger.info("게시글 likeCount 업데이트 완료", {
        targetId,
        delta,
      });
      return true;
    }

    // 3. 댓글 좋아요 처리 (새 경로: /comments/{postId}/{commentId})
    if (targetType === "comment") {
      // comment-locations에서 postId 정보 조회
      const locationSnapshot = await admin
        .database()
        .ref(`comment-locations/${targetId}`)
        .once("value");

      if (!locationSnapshot.exists()) {
        logger.error("댓글 위치 정보를 찾을 수 없습니다.", {targetId});
        return false;
      }

      const postId = locationSnapshot.val() as string;

      await admin
        .database()
        .ref(`comments/${postId}/${targetId}/likeCount`)
        .set(admin.database.ServerValue.increment(delta));

      logger.info("댓글 likeCount 업데이트 완료", {
        targetId,
        postId,
        delta,
      });
      return true;
    }

    // 알 수 없는 타입
    logger.error("알 수 없는 좋아요 타입입니다.", {targetId, targetType});
    return false;
  } catch (error) {
    logger.error("likeCount 업데이트 실패", {
      targetId,
      targetType,
      delta,
      error: error instanceof Error ? error.message : String(error),
    });
    return false;
  }
}
