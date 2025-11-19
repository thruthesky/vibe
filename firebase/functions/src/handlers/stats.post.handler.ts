/**
 * 게시글 통계 핸들러
 *
 * 이 파일은 게시글이 생성/삭제될 때 실행되는 통계 집계 로직을 처리합니다.
 *
 * 주요 기능:
 * - 게시글 작성자의 통계 업데이트 (일별/월별/연도별/전체)
 * - createdPosts 통계 관리
 *
 * 트리거 경로:
 * - /posts/{postId} 생성/삭제 시
 *
 * DB 구조:
 * /posts/{postId} = { authorUid, createdAt, ... }
 */

import * as logger from "firebase-functions/logger";
import {updateUserStats, incrementInfluencerScore} from "../utils/stats.utils";
import {INFLUENCER_SCORES, SCORE_DESCRIPTIONS} from "../shared/influencer-scores.constants";

/**
 * 게시글 생성 시 통계 업데이트
 *
 * @param postId - 게시글 ID
 * @param postData - 게시글 데이터 { authorUid, createdAt, ... }
 * @returns Promise<void>
 *
 * 수행 작업:
 * 1. 작성자의 createdPosts 통계 증가 (일별/월별/연도별/전체)
 */
export async function handlePostCreate(
  postId: string,
  postData: Record<string, unknown>
): Promise<void> {
  const authorUid = postData.authorUid as string | undefined;
  const createdAt = postData.createdAt as number | undefined;

  logger.info("게시글 생성 통계 처리 시작", {
    postId,
    authorUid,
    createdAt,
  });

  if (!authorUid) {
    logger.error("authorUid가 없어 통계 처리를 건너뜁니다", {
      postId,
    });
    return;
  }

  try {
    // 1. 작성자의 createdPosts 통계 증가
    await updateUserStats(authorUid, "createdPosts", 1, createdAt);

    // 2. 작성자의 인플루언서 점수 증가 (+50점)
    await incrementInfluencerScore(
      authorUid,
      INFLUENCER_SCORES.POST.CREATE,
      SCORE_DESCRIPTIONS.POST_CREATE
    );

    logger.info("게시글 생성 통계 처리 완료", {
      postId,
      authorUid,
    });
  } catch (error) {
    logger.error("게시글 생성 통계 처리 실패", {
      postId,
      authorUid,
      error: error instanceof Error ? error.message : String(error),
    });
    // 통계 처리 실패는 비치명적이므로 에러를 throw하지 않음
  }
}

/**
 * 게시글 삭제 시 통계 업데이트
 *
 * @param postId - 게시글 ID
 * @param postData - 게시글 데이터 { authorUid, createdAt, ... }
 * @returns Promise<void>
 *
 * 수행 작업:
 * 1. 작성자의 createdPosts 통계 감소 (일별/월별/연도별/전체)
 */
export async function handlePostDelete(
  postId: string,
  postData: Record<string, unknown>
): Promise<void> {
  const authorUid = postData.authorUid as string | undefined;

  logger.info("게시글 삭제 통계 처리 시작", {
    postId,
    authorUid,
  });

  if (!authorUid) {
    logger.error("authorUid가 없어 통계 처리를 건너뜁니다", {
      postId,
    });
    return;
  }

  try {
    // 1. 작성자의 createdPosts 통계 감소
    await updateUserStats(authorUid, "createdPosts", -1);

    // 2. 작성자의 인플루언서 점수 감소 (-55점, 페널티 포함)
    await incrementInfluencerScore(
      authorUid,
      INFLUENCER_SCORES.POST.DELETE,
      SCORE_DESCRIPTIONS.POST_DELETE
    );

    logger.info("게시글 삭제 통계 처리 완료", {
      postId,
      authorUid,
    });
  } catch (error) {
    logger.error("게시글 삭제 통계 처리 실패", {
      postId,
      authorUid,
      error: error instanceof Error ? error.message : String(error),
    });
    // 통계 처리 실패는 비치명적이므로 에러를 throw하지 않음
  }
}
