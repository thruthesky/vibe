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
import { handleMessageCategoryCreateFanout } from "./feed.fanout.handler";

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
 * 채팅 메시지 카테고리 필드 생성 시 비즈니스 로직 처리
 *
 * @param messageId - 메시지 ID
 * @param category - 카테고리 값
 * @param createdAt - 메시지 생성 시각 (timestamp)
 * @returns Promise<void>
 *
 * 주요 처리 로직:
 * 1. 카테고리 유효성 검사
 * 2. categoryOrder 필드 자동 생성: "{category}-{timestamp}"
 * 3. allCategoryOrder 필드 자동 생성: timestamp (모든 카테고리 글 목록용)
 * 4. type 필드 자동 생성: "post" (게시글 타입 표시)
 * 5. 메시지 노드에 categoryOrder, allCategoryOrder, type 필드 업데이트
 * 6. stats/counters/post 증가 (새 게시글 생성 통계)
 *
 * 예시:
 * - category: "qna"
 * - timestamp: 1234567890
 * - categoryOrder: "qna-1234567890"
 * - allCategoryOrder: 1234567890
 * - type: "post"
 */
export async function handleChatMessageCategoryCreate(
  messageId: string,
  category: string,
  createdAt: number | undefined
): Promise<void> {
  logger.info("채팅 메시지 카테고리 생성 처리 시작", {
    messageId,
    category,
    createdAt,
  });

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

  // 새 게시글 생성 통계 증가
  await incrementPostCounter(messageId, category);

  // 피드 fan-out: 팔로워들에게 피드 전파
  try {
    // 메시지 데이터에서 senderUid(작성자 UID) 조회
    const messageRef = admin.database().ref(`chat-messages/${messageId}`);
    const messageSnapshot = await messageRef.once("value");
    const messageData = messageSnapshot.val();

    if (messageData && messageData.senderUid) {
      const authorUid = messageData.senderUid;

      logger.info("피드 fan-out 시작", {
        messageId,
        authorUid,
        createdAt: timestamp,
      });

      await handleMessageCategoryCreateFanout(messageId, authorUid, timestamp);

      logger.info("피드 fan-out 완료", {
        messageId,
        authorUid,
      });
    } else {
      logger.warn("메시지 데이터에 senderUid가 없어 fan-out을 건너뜁니다", {
        messageId,
        messageData,
      });
    }
  } catch (error) {
    logger.error("피드 fan-out 실패 (비치명적 오류)", {
      messageId,
      category,
      error: error instanceof Error ? error.message : String(error),
    });
    // fan-out 실패는 비치명적이므로 에러를 throw하지 않음
  }
}

/**
 * 채팅 메시지 카테고리 필드 수정 시 비즈니스 로직 처리
 *
 * @param messageId - 메시지 ID
 * @param category - 새 카테고리 값
 * @returns Promise<void>
 *
 * 참고:
 * - 카테고리 수정 시 categoryOrder는 변경하지 않음
 * - 기존 작성 시간과 정렬 순서를 유지하기 위함
 * - Firebase Security Rules에서 category 필드만 업데이트 허용
 */
export async function handleChatMessageCategoryUpdate(
  messageId: string,
  category: string
): Promise<void> {
  logger.info("채팅 메시지 카테고리 수정 감지 (업데이트 작업 없음)", {
    messageId,
    category,
  });

  // 카테고리 수정 시 categoryOrder는 업데이트하지 않음
  // 클라이언트가 Firebase Security Rules를 통해 category 필드만 직접 수정
}

/**
 * 채팅 메시지 카테고리 필드 삭제 시 비즈니스 로직 처리
 *
 * @param messageId - 메시지 ID
 * @returns Promise<void>
 *
 * 주요 처리 로직:
 * 1. categoryOrder, allCategoryOrder, type 필드 모두 삭제
 * 2. 게시글에서 일반 채팅 메시지로 변환
 */
export async function handleChatMessageCategoryDelete(
  messageId: string
): Promise<void> {
  logger.info("채팅 메시지 카테고리 삭제 처리 시작", {
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
}
