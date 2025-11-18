/**
 * Firebase Cloud Functions - Feed Fanout Handler
 *
 * 게시글 생성/삭제 시 팔로워들에게 피드를 fan-out하는 핸들러
 * 최소 정보만 피드에 저장하고, 실제 내용은 /chat-messages에서 조회하는 방식
 */

import * as logger from "firebase-functions/logger";
import * as admin from "firebase-admin";

/**
 * 글 작성 시 팔로워들에게 피드 fan-out
 *
 * @param messageId - 메시지 ID
 * @param authorUid - 작성자 UID
 * @param createdAt - 작성 시간 (timestamp)
 * @returns Promise<void>
 *
 * 주요 처리 로직:
 * 1. /user-followers/{authorUid} 목록 조회
 * 2. 각 팔로워의 /user-feed/{followerUid}/{messageId} = createdAt 설정
 * 3. 작성자 본인의 피드에도 추가 (/user-feed/{authorUid}/{messageId} = createdAt)
 * 4. Multi-path update로 한 번에 모든 피드 업데이트
 *
 * 예시:
 * - B가 새 글 작성 (messageId: msg123, createdAt: 1710000000)
 * - B의 팔로워: [A, C, D]
 * - 업데이트:
 *   - /user-feed/B/msg123 = 1710000000 (본인 피드)
 *   - /user-feed/A/msg123 = 1710000000 (팔로워 A)
 *   - /user-feed/C/msg123 = 1710000000 (팔로워 C)
 *   - /user-feed/D/msg123 = 1710000000 (팔로워 D)
 */
export async function handleMessageCategoryCreateFanout(
  messageId: string,
  authorUid: string,
  createdAt: number
): Promise<void> {
  logger.info("피드 fan-out 처리 시작", {
    messageId,
    authorUid,
    createdAt,
  });

  try {
    // 1. 작성자의 팔로워 목록 조회
    const followersRef = admin.database().ref(`user-followers/${authorUid}`);
    const followersSnapshot = await followersRef.once("value");
    const followers = followersSnapshot.val() || {};
    const followerUids = Object.keys(followers);

    logger.info("팔로워 목록 조회 완료", {
      messageId,
      authorUid,
      followerCount: followerUids.length,
      followerUids,
    });

    // 팔로워가 없고 본인만 있을 경우에도 본인 피드는 추가
    const updates: { [key: string]: number } = {};

    // 2. 본인 피드에 추가
    updates[`user-feed/${authorUid}/${messageId}`] = createdAt;

    // 3. 각 팔로워의 피드에 추가
    followerUids.forEach((followerUid) => {
      updates[`user-feed/${followerUid}/${messageId}`] = createdAt;
    });

    logger.info("피드 fan-out 업데이트 준비 완료", {
      messageId,
      authorUid,
      totalFeeds: Object.keys(updates).length,
      updates,
    });

    // 4. Multi-path update로 한 번에 모든 피드 업데이트
    if (Object.keys(updates).length > 0) {
      await admin.database().ref().update(updates);

      logger.info("피드 fan-out 완료", {
        messageId,
        authorUid,
        totalFeeds: Object.keys(updates).length,
      });
    } else {
      logger.warn("fan-out할 피드가 없습니다", {
        messageId,
        authorUid,
      });
    }
  } catch (error) {
    logger.error("피드 fan-out 실패", {
      messageId,
      authorUid,
      error: error instanceof Error ? error.message : String(error),
    });
    throw error;
  }
}

/**
 * 글 삭제 시 fan-out된 피드 제거
 *
 * @param messageId - 메시지 ID
 * @param authorUid - 작성자 UID
 * @returns Promise<void>
 *
 * 주요 처리 로직:
 * 1. /user-followers/{authorUid} 목록 조회
 * 2. 각 팔로워의 /user-feed/{followerUid}/{messageId} 삭제
 * 3. 작성자 본인의 피드에서도 제거 (/user-feed/{authorUid}/{messageId} 삭제)
 * 4. Multi-path update로 한 번에 모든 피드 삭제 (null 설정)
 *
 * 예시:
 * - B가 글 삭제 (messageId: msg123)
 * - B의 팔로워: [A, C, D]
 * - 업데이트:
 *   - /user-feed/B/msg123 = null (본인 피드 삭제)
 *   - /user-feed/A/msg123 = null (팔로워 A 피드 삭제)
 *   - /user-feed/C/msg123 = null (팔로워 C 피드 삭제)
 *   - /user-feed/D/msg123 = null (팔로워 D 피드 삭제)
 */
export async function handleMessageDeletedFanout(
  messageId: string,
  authorUid: string
): Promise<void> {
  logger.info("피드 fan-out 제거 처리 시작", {
    messageId,
    authorUid,
  });

  try {
    // 1. 작성자의 팔로워 목록 조회
    const followersRef = admin.database().ref(`user-followers/${authorUid}`);
    const followersSnapshot = await followersRef.once("value");
    const followers = followersSnapshot.val() || {};
    const followerUids = Object.keys(followers);

    logger.info("팔로워 목록 조회 완료 (삭제용)", {
      messageId,
      authorUid,
      followerCount: followerUids.length,
      followerUids,
    });

    const updates: { [key: string]: null } = {};

    // 2. 본인 피드에서 제거
    updates[`user-feed/${authorUid}/${messageId}`] = null;

    // 3. 각 팔로워의 피드에서 제거
    followerUids.forEach((followerUid) => {
      updates[`user-feed/${followerUid}/${messageId}`] = null;
    });

    logger.info("피드 fan-out 제거 업데이트 준비 완료", {
      messageId,
      authorUid,
      totalFeeds: Object.keys(updates).length,
      updates,
    });

    // 4. Multi-path update로 한 번에 모든 피드 삭제
    if (Object.keys(updates).length > 0) {
      await admin.database().ref().update(updates);

      logger.info("피드 fan-out 제거 완료", {
        messageId,
        authorUid,
        totalFeeds: Object.keys(updates).length,
      });
    } else {
      logger.warn("제거할 피드가 없습니다", {
        messageId,
        authorUid,
      });
    }
  } catch (error) {
    logger.error("피드 fan-out 제거 실패", {
      messageId,
      authorUid,
      error: error instanceof Error ? error.message : String(error),
    });
    throw error;
  }
}
