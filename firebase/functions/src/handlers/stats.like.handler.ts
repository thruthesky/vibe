/**
 * 좋아요 통계 핸들러
 *
 * 이 파일은 좋아요가 생성/삭제될 때 실행되는 통계 집계 로직을 처리합니다.
 *
 * 주요 기능:
 * - 좋아요를 받은 사용자의 통계 업데이트 (일별/월별/연도별/전체)
 * - 자기 자신에게 한 좋아요는 통계에서 제외
 * - 인플루언서 점수 재계산
 *
 * 트리거 경로:
 * - /likes/{uid}/{targetId} 생성/삭제 시
 *
 * DB 구조:
 * /likes/{uid}/{targetId} = { targetType: "post" | "comment" | "message", createdAt: timestamp }
 */

import * as logger from "firebase-functions/logger";
import {
  updateUserStats,
  getTargetAuthorUid,
  incrementInfluencerScore,
} from "../utils/stats.utils";
import {INFLUENCER_SCORES, SCORE_DESCRIPTIONS} from "../shared/influencer-scores.constants";

/**
 * 좋아요 생성 시 통계 업데이트
 *
 * @param likerUid - 좋아요를 누른 사용자 UID
 * @param targetId - 대상 ID (게시글/댓글/메시지 ID)
 * @param likeData - 좋아요 데이터 { targetType, createdAt }
 * @returns Promise<void>
 *
 * 수행 작업:
 * 1. 대상 작성자 UID 조회
 * 2. 자기 자신에게 한 좋아요인지 검증 (자기 좋아요는 통계에서 제외)
 * 3. 작성자의 receivedLikes 통계 증가 (일별/월별/연도별/전체)
 * 4. 작성자의 인플루언서 점수 재계산
 */
export async function handleLikeCreate(
  likerUid: string,
  targetId: string,
  likeData: Record<string, unknown>
): Promise<void> {
  const targetType = likeData.targetType as "post" | "comment" | "message" | undefined;
  const createdAt = likeData.createdAt as number | undefined;

  logger.info("좋아요 생성 통계 처리 시작", {
    likerUid,
    targetId,
    targetType,
    createdAt,
  });

  if (!targetType) {
    logger.error("targetType이 없어 통계 처리를 건너뜁니다", {
      likerUid,
      targetId,
    });
    return;
  }

  try {
    // 1. 대상 작성자 UID 조회
    const targetAuthorUid = await getTargetAuthorUid(targetId, targetType);

    if (!targetAuthorUid) {
      logger.warn("대상 작성자를 찾을 수 없어 통계 처리를 건너뜁니다", {
        likerUid,
        targetId,
        targetType,
      });
      return;
    }

    // 2. 자기 자신에게 한 좋아요는 통계에서 제외
    if (likerUid === targetAuthorUid) {
      logger.info("자기 자신에게 한 좋아요는 통계에서 제외됩니다", {
        likerUid,
        targetId,
        targetType,
      });
      return;
    }

    // 3. 작성자의 receivedLikes 통계 증가
    await updateUserStats(
      targetAuthorUid,
      "receivedLikes",
      1,
      createdAt
    );

    // 4. 인플루언서 점수 증가 (+3점)
    await incrementInfluencerScore(
      targetAuthorUid,
      INFLUENCER_SCORES.LIKE.RECEIVED,
      SCORE_DESCRIPTIONS.LIKE_RECEIVED
    );

    logger.info("좋아요 생성 통계 처리 완료", {
      likerUid,
      targetId,
      targetType,
      targetAuthorUid,
    });
  } catch (error) {
    logger.error("좋아요 생성 통계 처리 실패", {
      likerUid,
      targetId,
      targetType,
      error: error instanceof Error ? error.message : String(error),
    });
    // 통계 처리 실패는 비치명적이므로 에러를 throw하지 않음
  }
}

/**
 * 좋아요 삭제 시 통계 업데이트
 *
 * @param likerUid - 좋아요를 취소한 사용자 UID
 * @param targetId - 대상 ID (게시글/댓글/메시지 ID)
 * @param likeData - 좋아요 데이터 { targetType, createdAt }
 * @returns Promise<void>
 *
 * 수행 작업:
 * 1. 대상 작성자 UID 조회
 * 2. 자기 자신에게 한 좋아요인지 검증 (자기 좋아요는 통계에서 제외)
 * 3. 작성자의 receivedLikes 통계 감소 (일별/월별/연도별/전체)
 * 4. 작성자의 인플루언서 점수 재계산
 */
export async function handleLikeDelete(
  likerUid: string,
  targetId: string,
  likeData: Record<string, unknown>
): Promise<void> {
  const targetType = likeData.targetType as "post" | "comment" | "message" | undefined;

  logger.info("좋아요 삭제 통계 처리 시작", {
    likerUid,
    targetId,
    targetType,
  });

  if (!targetType) {
    logger.error("targetType이 없어 통계 처리를 건너뜁니다", {
      likerUid,
      targetId,
    });
    return;
  }

  try {
    // 1. 대상 작성자 UID 조회
    const targetAuthorUid = await getTargetAuthorUid(targetId, targetType);

    if (!targetAuthorUid) {
      logger.warn("대상 작성자를 찾을 수 없어 통계 처리를 건너뜁니다", {
        likerUid,
        targetId,
        targetType,
      });
      return;
    }

    // 2. 자기 자신에게 한 좋아요는 통계에서 제외
    if (likerUid === targetAuthorUid) {
      logger.info("자기 자신에게 한 좋아요는 통계에서 제외됩니다", {
        likerUid,
        targetId,
        targetType,
      });
      return;
    }

    // 3. 작성자의 receivedLikes 통계 감소
    await updateUserStats(
      targetAuthorUid,
      "receivedLikes",
      -1
    );

    // 4. 인플루언서 점수 감소 (-3점)
    await incrementInfluencerScore(
      targetAuthorUid,
      INFLUENCER_SCORES.LIKE.RECEIVED_CANCEL,
      SCORE_DESCRIPTIONS.LIKE_RECEIVED_CANCEL
    );

    logger.info("좋아요 삭제 통계 처리 완료", {
      likerUid,
      targetId,
      targetType,
      targetAuthorUid,
    });
  } catch (error) {
    logger.error("좋아요 삭제 통계 처리 실패", {
      likerUid,
      targetId,
      targetType,
      error: error instanceof Error ? error.message : String(error),
    });
    // 통계 처리 실패는 비치명적이므로 에러를 throw하지 않음
  }
}
