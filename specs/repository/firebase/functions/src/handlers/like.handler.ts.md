---
title: like.handler.ts - TypeScript 소스 코드
original_path: firebase/functions/src/handlers/like.handler.ts
category: cloud-function
file_type: ts
status: current
last_updated: 2025-11-20
---

# like.handler.ts

## 개요

**원본 경로**: `firebase/functions/src/handlers/like.handler.ts`

**파일 유형**: TypeScript 소스 코드

## 소스 코드

```typescript
/**
 * 좋아요 관련 핸들러
 */

import * as admin from "firebase-admin";
import * as logger from "firebase-functions/logger";
import type {LikeTargetType} from "../types";
import {incrementActionCounter} from "./user-action-counters.handler";
import {
  recordMyAction,
  recordReceivedReaction,
  deleteMyAction,
  deleteReceivedReaction,
  getTargetTypeFromValue,
  getContentAuthorUid,
} from "../utils/reaction-history.utils";

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

  // 리액션 히스토리 기록
  try {
    // 1. 나의 발자취에 기록
    await recordMyAction({
      uid,
      type: "like",
      targetType: getTargetTypeFromValue(targetType),
      targetId,
    });

    // 2. 대상의 작성자에게 받은 반응 기록
    const recipientUid = await getContentAuthorUid(targetType, targetId);
    if (recipientUid) {
      await recordReceivedReaction({
        recipientUid,
        fromUid: uid,
        type: "like",
        targetType: getTargetTypeFromValue(targetType),
        targetId,
      });
    }

    logger.info("✅ 좋아요 리액션 히스토리 기록 완료", {uid, targetId, targetType});
  } catch (error) {
    logger.error("❌ 좋아요 리액션 히스토리 기록 실패", {
      uid,
      targetId,
      targetType,
      error: error instanceof Error ? error.message : String(error),
    });
    // 리액션 히스토리 실패는 비치명적이므로 throw하지 않음
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

  // 리액션 히스토리 삭제
  try {
    // 1. 나의 발자취에서 삭제
    await deleteMyAction({
      uid,
      type: "like",
      targetId,
    });

    // 2. 대상 작성자의 받은 반응에서 삭제
    const recipientUid = await getContentAuthorUid(targetType, targetId);
    if (recipientUid) {
      await deleteReceivedReaction({
        recipientUid,
        fromUid: uid,
        type: "like",
        targetId,
      });
    }

    logger.info("✅ 좋아요 리액션 히스토리 삭제 완료", {uid, targetId, targetType});
  } catch (error) {
    logger.error("❌ 좋아요 리액션 히스토리 삭제 실패", {
      uid,
      targetId,
      targetType,
      error: error instanceof Error ? error.message : String(error),
    });
    // 리액션 히스토리 실패는 비치명적이므로 throw하지 않음
  }
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

    // 3. 댓글 좋아요 처리 (경로: /comments/{postId}/{commentId})
    //    targetType 형식: "comment-{postId}"
    if (targetType.startsWith("comment-")) {
      logger.info("💬 댓글 좋아요 처리 시작", {targetId, targetType});

      // postId 파싱: "comment-{postId}" -> {postId}
      const postId = targetType.substring("comment-".length);

      if (!postId) {
        logger.error("❌ postId를 파싱할 수 없습니다", {targetId, targetType});
        return false;
      }

      const likeCountPath = `comments/${postId}/${targetId}/likeCount`;
      logger.info("💾 댓글 likeCount 업데이트 시도", {
        path: likeCountPath,
        postId,
        targetId,
        delta,
      });

      await admin
        .database()
        .ref(likeCountPath)
        .set(admin.database.ServerValue.increment(delta));

      logger.info("✅ 댓글 likeCount 업데이트 완료", {
        path: likeCountPath,
        postId,
        targetId,
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
```
