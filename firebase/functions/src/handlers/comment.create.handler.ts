/**
 * 댓글 생성 핸들러
 *
 * 이 파일은 채팅 메시지 댓글이 생성될 때 실행되는 비즈니스 로직을 처리합니다.
 *
 * 주요 기능:
 * - 부모 댓글의 childCount 자동 증가 (Atomic operation)
 * - listOrder 생성을 위한 자식 개수 관리
 * - 관련 사용자들에게 푸시 알림 전송
 */

import * as logger from "firebase-functions/logger";
import * as admin from "firebase-admin";
import {
  getFcmTokensByUids,
  sendFcmNotificationBatch,
} from "../utils/fcm.utils";
import {incrementActionCounter} from "./user-action-counters.handler";
import {
  recordMyAction,
  recordReceivedReaction,
} from "../utils/reaction-history.utils";
import {toNegativeTimestamp} from "../../../../shared/order-value.utils";


/**
 * 게시글 작성자 UID 조회
 *
 * @param postId - 게시글 ID
 * @returns 게시글 작성자 UID (없으면 null)
 */
async function getPostAuthorUid(postId: string): Promise<string | null> {
  try {
    const postAuthorRef = admin.database().ref(`posts/${postId}/authorUid`);
    const snapshot = await postAuthorRef.once("value");

    if (!snapshot.exists()) {
      logger.warn("게시글 작성자를 찾을 수 없음", {postId});
      return null;
    }

    return snapshot.val() as string;
  } catch (error) {
    logger.error("게시글 작성자 조회 실패", {
      postId,
      error: error instanceof Error ? error.message : String(error),
    });
    return null;
  }
}

/**
 * 상위 모든 댓글 작성자 UID 목록 조회 (재귀)
 *
 * @param postId - 게시글 ID
 * @param commentId - 현재 댓글 ID (부모 댓글부터 시작)
 * @param visited - 이미 방문한 댓글 ID 집합 (무한 루프 방지)
 * @returns 상위 모든 댓글 작성자 UID 배열
 *
 * 동작 방식:
 * 1. 현재 댓글의 authorUid와 parentId 조회
 * 2. authorUid를 결과 배열에 추가
 * 3. parentId가 있으면 재귀적으로 부모 댓글 탐색
 * 4. 최상위 댓글까지 도달하면 종료
 */
async function getAncestorCommentAuthorUids(
  postId: string,
  commentId: string | null,
  visited: Set<string> = new Set()
): Promise<string[]> {
  // 종료 조건: commentId가 없거나 이미 방문한 경우
  if (!commentId || visited.has(commentId)) {
    return [];
  }

  // 무한 루프 방지
  visited.add(commentId);

  try {
    const commentRef = admin.database().ref(`comments/${postId}/${commentId}`);
    const snapshot = await commentRef.once("value");

    if (!snapshot.exists()) {
      logger.warn("댓글을 찾을 수 없음", {postId, commentId});
      return [];
    }

    const commentData = snapshot.val() as Record<string, unknown>;
    const authorUid = commentData.authorUid as string | undefined;
    const parentId = commentData.parentId as string | null | undefined;

    const result: string[] = [];

    // 현재 댓글 작성자 추가
    if (authorUid) {
      result.push(authorUid);
    }

    // 부모 댓글이 있으면 재귀적으로 탐색
    if (parentId) {
      const ancestorUids = await getAncestorCommentAuthorUids(
        postId,
        parentId,
        visited
      );
      result.push(...ancestorUids);
    }

    return result;
  } catch (error) {
    logger.error("상위 댓글 작성자 조회 실패", {
      postId,
      commentId,
      error: error instanceof Error ? error.message : String(error),
    });
    return [];
  }
}

/**
 * 댓글 생성 시 관련 사용자들에게 푸시 알림 전송
 *
 * @param postId - 게시글 ID
 * @param commentId - 생성된 댓글 ID
 * @param commentData - 댓글 데이터
 *
 * 알림 대상:
 * 1. 게시글 작성자
 * 2. 부모 댓글 작성자 (대댓글인 경우)
 * 3. 상위 모든 댓글 작성자들
 * 단, 댓글 작성자 본인은 제외
 */
async function sendCommentNotification(
  postId: string,
  commentId: string,
  commentData: Record<string, unknown>
): Promise<void> {
  const authorUid = commentData.authorUid as string | undefined;
  const parentId = commentData.parentId as string | null | undefined;
  const text = commentData.text as string | undefined;

  if (!authorUid) {
    logger.warn("댓글 작성자가 없어 알림을 보낼 수 없음", {
      postId,
      commentId,
    });
    return;
  }

  logger.info("댓글 생성 푸시 알림 전송 시작", {
    postId,
    commentId,
    authorUid,
  });

  try {
    const recipientUids = new Set<string>();

    // 1. 게시글 작성자 추가
    const postAuthorUid = await getPostAuthorUid(postId);
    if (postAuthorUid && postAuthorUid !== authorUid) {
      recipientUids.add(postAuthorUid);
      logger.info("게시글 작성자를 알림 대상에 추가", {
        postAuthorUid,
      });
    }

    // 2. 부모 댓글이 있으면 상위 모든 댓글 작성자 추가
    if (parentId) {
      const ancestorUids = await getAncestorCommentAuthorUids(
        postId,
        parentId
      );

      // 본인 제외하고 추가
      ancestorUids.forEach((uid) => {
        if (uid !== authorUid) {
          recipientUids.add(uid);
        }
      });

      logger.info("상위 댓글 작성자들을 알림 대상에 추가", {
        ancestorCount: ancestorUids.length,
        ancestorUids,
      });
    }

    // 3. 알림 대상이 없으면 종료
    if (recipientUids.size === 0) {
      logger.info("알림을 받을 대상이 없음", {postId, commentId});
      return;
    }

    // 4. FCM 토큰 조회
    const uids = Array.from(recipientUids);
    const tokens = await getFcmTokensByUids(uids);

    if (tokens.length === 0) {
      logger.info("FCM 토큰이 없어 알림 전송을 건너뜀", {
        postId,
        commentId,
        recipientCount: uids.length,
      });
      return;
    }

    // 5. 푸시 알림 전송
    const title = "새 댓글이 달렸습니다";
    const body = text || "(댓글 내용 없음)";
    const data = {
      type: "comment",
      postId,
      commentId,
      authorUid,
    };

    const result = await sendFcmNotificationBatch(tokens, title, body, data);

    logger.info("댓글 생성 푸시 알림 전송 완료", {
      postId,
      commentId,
      recipientCount: uids.length,
      tokenCount: tokens.length,
      successCount: result.successCount,
      failureCount: result.failureCount,
      deletedTokenCount: result.deletedTokenCount,
    });
  } catch (error) {
    logger.error("댓글 생성 푸시 알림 전송 실패", {
      postId,
      commentId,
      error: error instanceof Error ? error.message : String(error),
    });
    // 푸시 알림 실패는 비치명적이므로 에러를 throw하지 않음
  }
}

/**
 * 댓글 생성 시 게시글과 부모 댓글의 childCount/totalChildCount를 증가시킵니다.
 *
 * @param postId - 게시글 ID
 * @param commentId - 생성된 댓글 ID
 * @param commentData - 댓글 데이터
 *
 * 수행 작업:
 * 1. 모든 댓글에 대해:
 *    - 게시글 노드의 totalChildCount를 ServerValue.increment(1)로 +1 증가
 *    - /posts/{postId}/totalChildCount
 *    - 이 값은 게시글의 총 댓글 수를 나타내며, UI에 "(n) 개의 댓글이 있습니다." 형태로 표시됨
 *
 * 2. parentId가 null이면 (최상위 댓글인 경우):
 *    - 게시글의 totalChildCount 증가 (위의 1번 작업)
 *    - **추가로** 게시글의 childCount를 ServerValue.increment(1)로 +1 증가
 *    - /posts/{postId}/childCount
 *    - 클라이언트에서 이 값을 읽어 첫번째 레벨 listOrder 생성에 사용
 *
 * 3. parentId가 존재하면 (대댓글인 경우):
 *    - 게시글의 totalChildCount 증가 (위의 1번 작업)
 *    - **추가로** 부모 댓글의 childCount를 ServerValue.increment(1)로 +1 증가
 *    - /comments/{postId}/{parentId}/childCount
 *    - 클라이언트에서 부모의 childCount를 읽어 listOrder 생성에 사용
 *
 * 참고:
 * - /posts/{postId}/totalChildCount: 게시글의 총 댓글 수 (모든 레벨 포함)
 * - /posts/{postId}/childCount: 첫번째 레벨 댓글 수만 카운트
 * - /comments/{postId}/{parentId}/childCount: 특정 댓글의 직접 자식 댓글 수
 * - ServerValue.increment 사용으로 여러 사용자가 동시에 댓글을 달아도 안전함 (동시성 보장)
 */
export async function handleCommentCreate(
  postId: string,
  commentId: string,
  commentData: Record<string, unknown>
): Promise<void> {
  const parentId = commentData.parentId as string | null;
  const createdAt = commentData.createdAt as number | undefined;

  logger.info("댓글 생성 감지", {
    postId,
    commentId,
    parentId,
    createdAt,
  });

  try {
    // 0. order 필드 추가 (정렬용)
    let timestamp = createdAt;
    if (!timestamp) {
      timestamp = Date.now();
    }

    const order = toNegativeTimestamp(timestamp);
    const commentRef = admin.database().ref(`comments/${postId}/${commentId}`);

    await commentRef.update({
      createdAt: timestamp,  // 양수 유지
      order,                 // 새로 추가 (음수)
    });

    logger.info("댓글 order 필드 생성 완료", {
      postId,
      commentId,
      order,
    });

    // 1. 모든 댓글에 대해 게시글의 totalChildCount 증가 (총 댓글 수)
    const postTotalChildCountRef = admin
      .database()
      .ref(`posts/${postId}/totalChildCount`);

    await postTotalChildCountRef.set(admin.database.ServerValue.increment(1));

    logger.info("게시글의 totalChildCount 증가 완료 (총 댓글 수)", {
      postId,
      commentId,
    });

    // 2. parentId에 따라 추가 작업 수행
    if (!parentId) {
      // 최상위 댓글인 경우: 게시글의 childCount도 증가
      const postChildCountRef = admin
        .database()
        .ref(`posts/${postId}/childCount`);

      await postChildCountRef.set(admin.database.ServerValue.increment(1));

      logger.info("게시글의 childCount 증가 완료 (첫번째 레벨 댓글 수)", {
        postId,
        commentId,
      });
    } else {
      // 대댓글인 경우: 부모 댓글의 childCount 증가
      const parentChildCountRef = admin
        .database()
        .ref(`comments/${postId}/${parentId}/childCount`);

      await parentChildCountRef.set(admin.database.ServerValue.increment(1));

      logger.info("부모 댓글의 childCount 증가 완료", {
        postId,
        commentId,
        parentId,
      });
    }

    // 3. comment-locations 매핑 제거됨
    //    댓글 경로가 comments/{postId}/{commentId} 형태이므로
    //    좋아요 데이터의 targetType을 "comment-{postId}" 형식으로 저장하여 postId 정보 유지

    // 4. 전체 댓글 통계 증가 (최상위 댓글, 대댓글 모두 포함)
    const authorUid = commentData.authorUid as string | undefined;
    if (authorUid) {
      await incrementActionCounter(authorUid, "comment", 1);
    }

    // 5. 관련 사용자들에게 푸시 알림 전송 (비차단)
    // 푸시 알림 실패는 비치명적이므로 await하지 않고 백그라운드에서 실행
    sendCommentNotification(postId, commentId, commentData).catch((error) => {
      logger.error("푸시 알림 전송 중 예외 발생 (비치명적)", {
        postId,
        commentId,
        error: error instanceof Error ? error.message : String(error),
      });
    });

    // 6. 리액션 히스토리 기록
    try {
      const authorUid = commentData.authorUid as string | undefined;
      if (authorUid) {
        // 6-1. 나의 발자취에 댓글 작성 기록
        await recordMyAction({
          uid: authorUid,
          type: "comment",
          targetType: "comment",
          targetId: commentId,
          postId, // 댓글의 경우 postId 추가
        });

        logger.info("✅ 댓글 작성 리액션 히스토리 기록 완료 (나의 발자취)", {
          postId,
          commentId,
          authorUid,
        });

        // 6-2. 게시글 작성자에게 받은 반응 기록
        const postAuthorUid = await getPostAuthorUid(postId);
        if (postAuthorUid) {
          await recordReceivedReaction({
            recipientUid: postAuthorUid,
            fromUid: authorUid,
            type: "comment",
            targetType: "comment",
            targetId: commentId,
            postId,
          });

          logger.info("✅ 댓글 작성 리액션 히스토리 기록 완료 (받은 반응)", {
            postId,
            commentId,
            authorUid,
            postAuthorUid,
          });
        }
      }
    } catch (error) {
      logger.error("❌ 댓글 작성 리액션 히스토리 기록 실패", {
        postId,
        commentId,
        error: error instanceof Error ? error.message : String(error),
      });
      // 리액션 히스토리 실패는 비치명적이므로 throw하지 않음
    }
  } catch (error) {
    logger.error("childCount/totalChildCount 증가 실패", {
      postId,
      commentId,
      parentId,
      error: error instanceof Error ? error.message : String(error),
    });
    throw error;
  }
}
