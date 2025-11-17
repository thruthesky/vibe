/**
 * 댓글 생성 핸들러
 *
 * 이 파일은 채팅 메시지 댓글이 생성될 때 실행되는 비즈니스 로직을 처리합니다.
 *
 * 주요 기능:
 * - 부모 댓글의 childCount 자동 증가 (Atomic operation)
 * - listOrder 생성을 위한 자식 개수 관리
 */

import * as logger from "firebase-functions/logger";
import * as admin from "firebase-admin";

/**
 * 댓글 생성 시 메시지와 부모 댓글의 childCount/totalChildCount를 증가시킵니다.
 *
 * @param messageId - 게시글(채팅 메시지) ID
 * @param commentId - 생성된 댓글 ID
 * @param commentData - 댓글 데이터
 *
 * 수행 작업:
 * 1. 모든 댓글에 대해:
 *    - 메시지 노드의 totalChildCount를 ServerValue.increment(1)로 +1 증가
 *    - /chat-messages/{messageId}/totalChildCount
 *    - 이 값은 게시글의 총 댓글 수를 나타내며, UI에 "(n) 개의 댓글이 있습니다." 형태로 표시됨
 *
 * 2. parentId가 null이면 (최상위 댓글인 경우):
 *    - 메시지의 totalChildCount 증가 (위의 1번 작업)
 *    - **추가로** 메시지의 childCount를 ServerValue.increment(1)로 +1 증가
 *    - /chat-messages/{messageId}/childCount
 *    - 클라이언트에서 이 값을 읽어 첫번째 레벨 listOrder 생성에 사용
 *
 * 3. parentId가 존재하면 (대댓글인 경우):
 *    - 메시지의 totalChildCount 증가 (위의 1번 작업)
 *    - **추가로** 부모 댓글의 childCount를 ServerValue.increment(1)로 +1 증가
 *    - /chat-message-comments/{messageId}/{parentId}/childCount
 *    - 클라이언트에서 부모의 childCount를 읽어 listOrder 생성에 사용
 *
 * 참고:
 * - /chat-messages/{messageId}/totalChildCount: 게시글의 총 댓글 수 (모든 레벨 포함)
 * - /chat-messages/{messageId}/childCount: 첫번째 레벨 댓글 수만 카운트
 * - /chat-message-comments/{messageId}/{parentId}/childCount: 특정 댓글의 직접 자식 댓글 수
 * - ServerValue.increment 사용으로 여러 사용자가 동시에 댓글을 달아도 안전함 (동시성 보장)
 */
export async function handleCommentCreate(
  messageId: string,
  commentId: string,
  commentData: Record<string, unknown>
): Promise<void> {
  const parentId = commentData.parentId as string | null;

  logger.info("댓글 생성 감지", {
    messageId,
    commentId,
    parentId,
  });

  try {
    // 1. 모든 댓글에 대해 메시지의 totalChildCount 증가 (총 댓글 수)
    const messageTotalChildCountRef = admin
      .database()
      .ref(`chat-messages/${messageId}/totalChildCount`);

    await messageTotalChildCountRef.set(admin.database.ServerValue.increment(1));

    logger.info("메시지의 totalChildCount 증가 완료 (총 댓글 수)", {
      messageId,
      commentId,
    });

    // 2. parentId에 따라 추가 작업 수행
    if (!parentId) {
      // 최상위 댓글인 경우: 메시지의 childCount도 증가
      const messageChildCountRef = admin
        .database()
        .ref(`chat-messages/${messageId}/childCount`);

      await messageChildCountRef.set(admin.database.ServerValue.increment(1));

      logger.info("메시지의 childCount 증가 완료 (첫번째 레벨 댓글 수)", {
        messageId,
        commentId,
      });
    } else {
      // 대댓글인 경우: 부모 댓글의 childCount 증가
      const parentChildCountRef = admin
        .database()
        .ref(`chat-message-comments/${messageId}/${parentId}/childCount`);

      await parentChildCountRef.set(admin.database.ServerValue.increment(1));

      logger.info("부모 댓글의 childCount 증가 완료", {
        messageId,
        commentId,
        parentId,
      });
    }
  } catch (error) {
    logger.error("childCount/totalChildCount 증가 실패", {
      messageId,
      commentId,
      parentId,
      error: error instanceof Error ? error.message : String(error),
    });
    throw error;
  }
}
