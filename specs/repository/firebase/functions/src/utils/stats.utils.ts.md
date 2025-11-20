---
title: stats.utils.ts - TypeScript 소스 코드
original_path: firebase/functions/src/utils/stats.utils.ts
category: cloud-function
file_type: ts
status: current
last_updated: 2025-11-20
---

# stats.utils.ts

## 개요

**원본 경로**: `firebase/functions/src/utils/stats.utils.ts`

**파일 유형**: TypeScript 소스 코드

## 소스 코드

```typescript
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
 * @param targetType - 대상 타입 ("post", "comment-{postId}", "message")
 * @returns 작성자 UID (없으면 null)
 *
 * 동작 방식:
 * - post: /posts/{postId}/authorUid 조회
 * - comment-{postId}: targetType에서 postId 추출 → /comments/{postId}/{commentId}/authorUid 조회
 * - message: /chat-messages/{messageId}/uid 조회
 *
 * 예시:
 * - getTargetAuthorUid("post123", "post") → "user_uid_123"
 * - getTargetAuthorUid("comment456", "comment-post789") → "user_uid_456"
 */
export async function getTargetAuthorUid(
  targetId: string,
  targetType: string
): Promise<string | null> {
  try {
    let authorUidRef: admin.database.Reference;

    if (targetType === "post") {
      // 게시글 작성자 조회
      authorUidRef = admin.database().ref(`posts/${targetId}/authorUid`);
    } else if (targetType.startsWith("comment-")) {
      // 댓글 작성자 조회 (targetType 형식: "comment-{postId}")
      // postId 파싱: "comment-{postId}" -> {postId}
      const postId = targetType.substring("comment-".length);

      if (!postId) {
        logger.warn("댓글 targetType에서 postId를 파싱할 수 없음", {
          targetId,
          targetType,
        });
        return null;
      }

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
 * 인플루언서 점수 증감
 *
 * @param uid - 대상 사용자 UID
 * @param delta - 증감량 (양수: 증가, 음수: 감소)
 * @param reason - 점수 변경 이유 (로깅용)
 * @returns Promise<void>
 *
 * 증분 업데이트 방식:
 * - 이벤트가 발생할 때마다 점수를 증감합니다
 * - ServerValue.increment()를 사용하여 원자적으로 업데이트합니다
 * - 점수 상수는 shared/influencer-scores.constants.ts에서 관리합니다
 *
 * 점수 체계:
 * - 게시글 작성: +50점, 삭제: -55점 (페널티 -5)
 * - 댓글 작성: +5점, 삭제: -7점 (페널티 -2)
 * - 타인으로부터 좋아요 받음: +3점, 취소: -3점
 * - 타인이 내 글/댓글에 댓글 작성: +5점, 삭제: -5점
 * - 타인이 나를 팔로우: +60점, 언팔로우: -60점
 *
 * 예시:
 * - incrementInfluencerScore(uid, 50, "게시글 작성")
 * - incrementInfluencerScore(uid, -55, "게시글 삭제")
 * - incrementInfluencerScore(uid, 3, "좋아요 받음")
 */
export async function incrementInfluencerScore(
  uid: string,
  delta: number,
  reason?: string
): Promise<void> {
  if (delta === 0) {
    logger.warn("delta가 0이므로 인플루언서 점수 업데이트를 건너뜁니다", {
      uid,
      delta,
      reason,
    });
    return;
  }

  try {
    // ServerValue.increment()를 사용하여 원자적으로 증감
    await admin
      .database()
      .ref(`influencer-scores/${uid}`)
      .set(admin.database.ServerValue.increment(delta));

    logger.info("인플루언서 점수 증감 완료", {
      uid,
      delta,
      reason,
    });
  } catch (error) {
    logger.error("인플루언서 점수 증감 실패", {
      uid,
      delta,
      reason,
      error: error instanceof Error ? error.message : String(error),
    });
    // 점수 업데이트 실패는 비치명적이므로 에러를 throw하지 않음
  }
}
```
