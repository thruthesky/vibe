/**
 * 좋아요 관련 핸들러
 */

import * as admin from "firebase-admin";
import * as logger from "firebase-functions/logger";
import type {LikeTargetType} from "../types";

/**
 * 좋아요 추가 처리
 */
export async function handleLikeCreate(
  uid: string,
  targetId: string,
  targetType: LikeTargetType
): Promise<void> {
  logger.info("👍 좋아요 추가 감지", {uid, targetId, targetType});

  const success = await applyLikeDelta(targetId, targetType, 1);
  await updateGlobalLikeStats(success ? 1 : 0);

  // 메시지별 좋아요한 사용자 목록에 추가 (프로필 사진 표시용)
  if (targetType === "message") {
    await admin
      .database()
      .ref(`chat-message-likes/${targetId}/${uid}`)
      .set(true);

    logger.info("chat-message-likes 경로에 사용자 추가 완료", {targetId, uid});
  }

  // 댓글별 좋아요한 사용자 목록에 추가 (프로필 사진 표시용)
  if (targetType === "comment") {
    await admin
      .database()
      .ref(`chat-comment-likes/${targetId}/${uid}`)
      .set(true);

    logger.info("chat-comment-likes 경로에 사용자 추가 완료", {targetId, uid});
  }
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
  await updateGlobalLikeStats(success ? -1 : 0);

  // 메시지별 좋아요한 사용자 목록에서 제거
  if (targetType === "message") {
    await admin
      .database()
      .ref(`chat-message-likes/${targetId}/${uid}`)
      .remove();

    logger.info("chat-message-likes 경로에서 사용자 제거 완료", {targetId, uid});
  }

  // 댓글별 좋아요한 사용자 목록에서 제거
  if (targetType === "comment") {
    await admin
      .database()
      .ref(`chat-comment-likes/${targetId}/${uid}`)
      .remove();

    logger.info("chat-comment-likes 경로에서 사용자 제거 완료", {targetId, uid});
  }
}

/**
 * 전체 좋아요 통계 업데이트
 */
async function updateGlobalLikeStats(delta: number): Promise<void> {
  if (delta === 0) {
    return;
  }

  await admin
    .database()
    .ref("stats/counters/like")
    .set(admin.database.ServerValue.increment(delta));
}

/**
 * 게시글 또는 댓글의 likeCount 증감 처리
 */
async function applyLikeDelta(
  targetId: string,
  targetType: LikeTargetType,
  delta: 1 | -1
): Promise<boolean> {
  try {
    if (targetType === "message") {
      await admin
        .database()
        .ref(`chat-messages/${targetId}/likeCount`)
        .set(admin.database.ServerValue.increment(delta));

      logger.info("게시글 likeCount 업데이트 완료", {targetId, delta});
      return true;
    }

    const locationSnapshot = await admin
      .database()
      .ref(`comment-locations/${targetId}`)
      .once("value");

    if (!locationSnapshot.exists()) {
      logger.error("댓글 위치 정보를 찾을 수 없습니다.", {targetId});
      return false;
    }

    const messageId = locationSnapshot.val() as string;

    await admin
      .database()
      .ref(`chat-message-comments/${messageId}/${targetId}/likeCount`)
      .set(admin.database.ServerValue.increment(delta));

    logger.info("댓글 likeCount 업데이트 완료", {
      targetId,
      messageId,
      delta,
    });
    return true;
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
