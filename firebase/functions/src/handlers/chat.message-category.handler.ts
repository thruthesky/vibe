/**
 * Firebase Cloud Functions - Chat Message Category Handler
 *
 * 채팅 메시지의 카테고리 필드 생성/수정 시 categoryOrder, allCategoryOrder, type 필드를 자동으로 생성합니다.
 */

import * as logger from "firebase-functions/logger";
import * as admin from "firebase-admin";
import {
  createCategoryOrder,
  isValidCategory,
} from "../../../../shared/categories";

/**
 * 전체 게시글 통계 카운터 증가
 *
 * @param messageId - 메시지 ID
 * @param category - 카테고리 값
 *
 * 수행 작업:
 * - /stats/counters/post 경로에 ServerValue.increment(1)로 +1 증가
 * - 이 값은 오른쪽 사이드바의 "실시간 통계 - 게시글 수"에 실시간으로 표시됨
 */
async function incrementPostCounter(
  messageId: string,
  category: string
): Promise<void> {
  try {
    const postCounterRef = admin.database().ref("stats/counters/post");
    await postCounterRef.set(admin.database.ServerValue.increment(1));

    logger.info("stats/counters/post 증가 완료 (전체 게시글 통계)", {
      messageId,
      category,
    });
  } catch (error) {
    logger.error("stats/counters/post 증가 실패", {
      messageId,
      category,
      error: error instanceof Error ? error.message : String(error),
    });
    // 통계 증가 실패는 치명적이지 않으므로 에러를 throw하지 않고 로그만 남김
  }
}

/**
 * 채팅 메시지 카테고리 필드 생성/수정 시 비즈니스 로직 처리
 *
 * @param messageId - 메시지 ID
 * @param category - 카테고리 값
 * @param createdAt - 메시지 생성 시각 (timestamp)
 * @param previousCategory - 이전 카테고리 값 (없으면 null)
 * @returns Promise<void>
 *
 * 주요 처리 로직:
 * 1. 카테고리 유효성 검사
 * 2. categoryOrder 필드 자동 생성: "{category}-{timestamp}"
 * 3. allCategoryOrder 필드 자동 생성: timestamp (모든 카테고리 글 목록용)
 * 4. type 필드 자동 생성: "post" (게시글 타입 표시)
 * 5. 메시지 노드에 categoryOrder, allCategoryOrder, type 필드 업데이트
 * 6. 새 게시글 생성 시 (previousCategory가 null이고 category가 존재하면) 전체 통계 증가
 *
 * 예시:
 * - category: "qna"
 * - timestamp: 1234567890
 * - categoryOrder: "qna-1234567890"
 * - allCategoryOrder: 1234567890
 * - type: "post"
 */
export async function handleChatMessageCategoryWrite(
  messageId: string,
  category: string | null,
  createdAt: number | undefined,
  previousCategory: string | null = null
): Promise<void> {
  logger.info("채팅 메시지 카테고리 처리 시작", {
    messageId,
    category,
    createdAt,
  });

  // 카테고리가 삭제된 경우 (null)
  if (category === null) {
    logger.info("카테고리가 삭제됨, categoryOrder, allCategoryOrder, type 삭제", {
      messageId,
    });

    // categoryOrder, allCategoryOrder, type 필드 삭제
    const updates: {[key: string]: null} = {
      [`chat-messages/${messageId}/categoryOrder`]: null,
      [`chat-messages/${messageId}/allCategoryOrder`]: null,
      [`chat-messages/${messageId}/type`]: null,
    };

    await admin.database().ref().update(updates);

    logger.info("categoryOrder, allCategoryOrder, type 필드 삭제 완료", {
      messageId,
    });
    return;
  }

  // 카테고리 유효성 검사
  if (!isValidCategory(category)) {
    logger.error("유효하지 않은 카테고리", {
      messageId,
      category,
    });
    throw new Error(`유효하지 않은 카테고리: ${category}`);
  }

  // createdAt이 없으면 현재 시간 사용
  const timestamp = createdAt || Date.now();

  // categoryOrder 생성: "{category}-{timestamp}"
  const categoryOrder = createCategoryOrder(category, timestamp);

  logger.info("categoryOrder, allCategoryOrder, type 생성", {
    messageId,
    category,
    timestamp,
    categoryOrder,
    allCategoryOrder: timestamp,
    type: "post",
  });

  // categoryOrder, allCategoryOrder, type 필드 업데이트
  const updates: {[key: string]: string | number} = {
    [`chat-messages/${messageId}/categoryOrder`]: categoryOrder,
    [`chat-messages/${messageId}/allCategoryOrder`]: timestamp,
    [`chat-messages/${messageId}/type`]: "post",
  };

  await admin.database().ref().update(updates);

  logger.info("categoryOrder, allCategoryOrder, type 필드 업데이트 완료", {
    messageId,
    categoryOrder,
    allCategoryOrder: timestamp,
    type: "post",
  });

  // 6. 새 게시글 생성 시 (이전에 카테고리가 없었고 지금 카테고리가 생성됨) 전체 통계 증가
  if (!previousCategory && category) {
    await incrementPostCounter(messageId, category);
  }
}
