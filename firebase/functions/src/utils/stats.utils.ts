/**
 * 통계 관련 공통 유틸리티 함수
 *
 * 이 파일은 사용자별 일일/월별/연간 통계를 관리하는 공통 함수들을 제공합니다.
 *
 * 주요 기능:
 * - 사용자별 통계 업데이트 (일별/월별/연도별/전체)
 * - UTC 기반 날짜 포맷팅
 * - 대상 작성자 UID 조회 (게시글/댓글/채팅)
 * - 인플루언서 점수 계산 및 업데이트
 */

import * as admin from "firebase-admin";
import * as logger from "firebase-functions/logger";

/**
 * 통계 타입 정의
 *
 * - receivedLikes: 받은 좋아요 수
 * - receivedComments: 받은 댓글 수 (게시글 + 댓글 댓글)
 * - receivedPostComments: 게시글에 받은 댓글 수
 * - receivedCommentReplies: 댓글에 받은 대댓글 수
 * - receivedFollowers: 받은 팔로워 수
 * - createdPosts: 작성한 게시글 수
 * - createdComments: 작성한 댓글 수
 */
export type StatType =
  | "receivedLikes"
  | "receivedComments"
  | "receivedPostComments"
  | "receivedCommentReplies"
  | "receivedFollowers"
  | "createdPosts"
  | "createdComments";

/**
 * 사용자 통계 업데이트
 *
 * @param uid - 대상 사용자 UID
 * @param statType - 통계 타입
 * @param delta - 증감량 (1: 증가, -1: 감소)
 * @param createdAt - 생성 시각 (밀리초 타임스탬프, 옵션)
 * @returns Promise<void>
 *
 * 수행 작업:
 * 1. 전체 통계 업데이트: /user-stats/{uid}/total/{statType}
 * 2. 일별 통계 업데이트: /user-stats/{uid}/daily/{yyyyMMdd}/{statType}
 * 3. 월별 통계 업데이트: /user-stats/{uid}/monthly/{yyyyMM}/{statType}
 * 4. 연도별 통계 업데이트: /user-stats/{uid}/yearly/{yyyy}/{statType}
 *
 * 모든 업데이트는 ServerValue.increment()를 사용하여 원자적으로 수행됩니다.
 *
 * 예시:
 * - 좋아요 받음: updateUserStats(authorUid, "receivedLikes", 1, Date.now())
 * - 좋아요 취소: updateUserStats(authorUid, "receivedLikes", -1)
 */
export async function updateUserStats(
  uid: string,
  statType: StatType,
  delta: number,
  createdAt?: number
): Promise<void> {
  if (delta === 0) {
    logger.warn("delta가 0이므로 통계 업데이트를 건너뜁니다", {
      uid,
      statType,
      delta,
    });
    return;
  }

  try {
    const updates: Record<string, unknown> = {};
    const now = createdAt ? new Date(createdAt) : new Date();

    // UTC 기준 날짜 계산
    const dateDaily = formatDate(now, "yyyyMMdd");
    const dateMonthly = formatDate(now, "yyyyMM");
    const dateYearly = formatDate(now, "yyyy");

    // 1. 전체 통계 업데이트
    updates[`user-stats/${uid}/total/${statType}`] =
      admin.database.ServerValue.increment(delta);

    // 2. 일별 통계 업데이트
    updates[`user-stats/${uid}/daily/${dateDaily}/${statType}`] =
      admin.database.ServerValue.increment(delta);

    // 3. 월별 통계 업데이트
    updates[`user-stats/${uid}/monthly/${dateMonthly}/${statType}`] =
      admin.database.ServerValue.increment(delta);

    // 4. 연도별 통계 업데이트
    updates[`user-stats/${uid}/yearly/${dateYearly}/${statType}`] =
      admin.database.ServerValue.increment(delta);

    await admin.database().ref().update(updates);

    logger.info("사용자 통계 업데이트 완료", {
      uid,
      statType,
      delta,
      dateDaily,
      dateMonthly,
      dateYearly,
    });
  } catch (error) {
    logger.error("사용자 통계 업데이트 실패", {
      uid,
      statType,
      delta,
      error: error instanceof Error ? error.message : String(error),
    });
    // 통계 업데이트 실패는 비치명적이므로 에러를 throw하지 않음
  }
}

/**
 * UTC 기반 날짜 포맷팅
 *
 * @param date - 포맷할 Date 객체
 * @param format - 날짜 형식 ("yyyyMMdd", "yyyyMM", "yyyy")
 * @returns 포맷된 날짜 문자열
 *
 * 예시:
 * - formatDate(new Date(), "yyyyMMdd") → "20250119"
 * - formatDate(new Date(), "yyyyMM") → "202501"
 * - formatDate(new Date(), "yyyy") → "2025"
 */
export function formatDate(
  date: Date,
  format: "yyyyMMdd" | "yyyyMM" | "yyyy"
): string {
  const year = date.getUTCFullYear();
  const month = String(date.getUTCMonth() + 1).padStart(2, "0");
  const day = String(date.getUTCDate()).padStart(2, "0");

  switch (format) {
    case "yyyyMMdd":
      return `${year}${month}${day}`;
    case "yyyyMM":
      return `${year}${month}`;
    case "yyyy":
      return `${year}`;
    default:
      throw new Error(`지원하지 않는 날짜 형식: ${format}`);
  }
}

/**
 * 대상 작성자 UID 조회
 *
 * @param targetId - 대상 ID (게시글 ID, 댓글 ID, 메시지 ID)
 * @param targetType - 대상 타입 ("post", "comment", "message")
 * @returns 작성자 UID (없으면 null)
 *
 * 동작 방식:
 * - post: /posts/{postId}/authorUid 조회
 * - comment: /comment-locations/{commentId}로 postId 찾고 → /comments/{postId}/{commentId}/authorUid 조회
 * - message: /chat-messages/{messageId}/uid 조회
 *
 * 예시:
 * - getTargetAuthorUid("post123", "post") → "user_uid_123"
 * - getTargetAuthorUid("comment456", "comment") → "user_uid_456"
 */
export async function getTargetAuthorUid(
  targetId: string,
  targetType: "post" | "comment" | "message"
): Promise<string | null> {
  try {
    let authorUidRef: admin.database.Reference;

    if (targetType === "post") {
      // 게시글 작성자 조회
      authorUidRef = admin.database().ref(`posts/${targetId}/authorUid`);
    } else if (targetType === "comment") {
      // 댓글 위치 조회 → 댓글 작성자 조회
      const locationRef = admin.database().ref(`comment-locations/${targetId}`);
      const locationSnapshot = await locationRef.once("value");

      if (!locationSnapshot.exists()) {
        logger.warn("댓글 위치를 찾을 수 없음", {targetId, targetType});
        return null;
      }

      const postId = locationSnapshot.val() as string;
      authorUidRef = admin
        .database()
        .ref(`comments/${postId}/${targetId}/authorUid`);
    } else if (targetType === "message") {
      // 채팅 메시지 작성자 조회
      authorUidRef = admin.database().ref(`chat-messages/${targetId}/uid`);
    } else {
      logger.error("지원하지 않는 대상 타입", {targetId, targetType});
      return null;
    }

    const snapshot = await authorUidRef.once("value");

    if (!snapshot.exists()) {
      logger.warn("작성자를 찾을 수 없음", {targetId, targetType});
      return null;
    }

    return snapshot.val() as string;
  } catch (error) {
    logger.error("대상 작성자 조회 실패", {
      targetId,
      targetType,
      error: error instanceof Error ? error.message : String(error),
    });
    return null;
  }
}

/**
 * 인플루언서 점수 계산 및 업데이트
 *
 * @param uid - 대상 사용자 UID
 * @returns Promise<void>
 *
 * 인플루언서 점수 계산 공식:
 * score = (receivedLikes × 1) + (receivedComments × 3) + (receivedFollowers × 5)
 *
 * 가중치:
 * - 좋아요: 1점 (가장 낮은 가중치)
 * - 댓글: 3점 (중간 가중치, 댓글은 좋아요보다 더 의미 있는 반응)
 * - 팔로워: 5점 (가장 높은 가중치, 지속적인 관심을 의미)
 *
 * 수행 작업:
 * 1. /user-stats/{uid}/total 에서 각 통계 조회
 * 2. 점수 계산
 * 3. /influencer-scores/{uid} 업데이트
 *
 * 예시:
 * - 받은 좋아요 100개, 댓글 30개, 팔로워 20개
 * - 점수 = (100 × 1) + (30 × 3) + (20 × 5) = 100 + 90 + 100 = 290점
 */
export async function updateInfluencerScore(uid: string): Promise<void> {
  try {
    // 1. 전체 통계 조회
    const totalStatsRef = admin.database().ref(`user-stats/${uid}/total`);
    const snapshot = await totalStatsRef.once("value");

    if (!snapshot.exists()) {
      logger.info("통계가 없어 인플루언서 점수를 0으로 설정", {uid});
      await admin.database().ref(`influencer-scores/${uid}`).set(0);
      return;
    }

    const stats = snapshot.val() as Record<string, number>;

    // 2. 점수 계산
    const receivedLikes = stats.receivedLikes || 0;
    const receivedComments = stats.receivedComments || 0;
    const receivedFollowers = stats.receivedFollowers || 0;

    const score = receivedLikes * 1 + receivedComments * 3 + receivedFollowers * 5;

    // 3. 점수 업데이트
    await admin.database().ref(`influencer-scores/${uid}`).set(score);

    logger.info("인플루언서 점수 업데이트 완료", {
      uid,
      receivedLikes,
      receivedComments,
      receivedFollowers,
      score,
    });
  } catch (error) {
    logger.error("인플루언서 점수 업데이트 실패", {
      uid,
      error: error instanceof Error ? error.message : String(error),
    });
    // 점수 업데이트 실패는 비치명적이므로 에러를 throw하지 않음
  }
}
