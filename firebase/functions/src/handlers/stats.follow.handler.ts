/**
 * 팔로우 통계 핸들러
 *
 * 이 파일은 팔로우가 생성/삭제될 때 실행되는 통계 집계 로직을 처리합니다.
 *
 * 주요 기능:
 * - 팔로우를 받은 사용자의 통계 업데이트 (일별/월별/연도별/전체)
 * - receivedFollowers 통계 관리
 * - 인플루언서 점수 재계산
 *
 * 트리거 경로:
 * - /user-following/{followerUid}/{followingUid} 생성/삭제 시
 *
 * DB 구조:
 * /user-following/{followerUid}/{followingUid} = true
 * /user-followers/{followingUid}/{followerUid} = true (역참조, friend.follow.handler.ts에서 관리)
 *
 * 참고:
 * - followerUid: 팔로우를 하는 사용자 (A가 B를 팔로우 → A = followerUid)
 * - followingUid: 팔로우를 받는 사용자 (A가 B를 팔로우 → B = followingUid)
 */

import * as logger from "firebase-functions/logger";
import {
  updateUserStats,
  updateInfluencerScore,
} from "../utils/stats.utils";

/**
 * 팔로우 생성 시 통계 업데이트
 *
 * @param followerUid - 팔로우를 하는 사용자 UID
 * @param followingUid - 팔로우를 받는 사용자 UID
 * @returns Promise<void>
 *
 * 수행 작업:
 * 1. 팔로우를 받은 사용자(followingUid)의 receivedFollowers 통계 증가
 * 2. 인플루언서 점수 재계산
 *
 * 예시:
 * - A가 B를 팔로우 → /user-following/A/B = true
 * - B의 receivedFollowers 통계 증가
 */
export async function handleFollowCreateStats(
  followerUid: string,
  followingUid: string
): Promise<void> {
  logger.info("팔로우 생성 통계 처리 시작", {
    followerUid,
    followingUid,
  });

  try {
    // 1. 팔로우를 받은 사용자의 receivedFollowers 통계 증가
    await updateUserStats(
      followingUid,
      "receivedFollowers",
      1,
      Date.now()
    );

    // 2. 인플루언서 점수 재계산
    await updateInfluencerScore(followingUid);

    logger.info("팔로우 생성 통계 처리 완료", {
      followerUid,
      followingUid,
    });
  } catch (error) {
    logger.error("팔로우 생성 통계 처리 실패", {
      followerUid,
      followingUid,
      error: error instanceof Error ? error.message : String(error),
    });
    // 통계 처리 실패는 비치명적이므로 에러를 throw하지 않음
  }
}

/**
 * 팔로우 삭제 시 통계 업데이트
 *
 * @param followerUid - 언팔로우를 하는 사용자 UID
 * @param followingUid - 언팔로우를 당하는 사용자 UID
 * @returns Promise<void>
 *
 * 수행 작업:
 * 1. 팔로우를 받았던 사용자(followingUid)의 receivedFollowers 통계 감소
 * 2. 인플루언서 점수 재계산
 *
 * 예시:
 * - A가 B를 언팔로우 → /user-following/A/B 삭제
 * - B의 receivedFollowers 통계 감소
 */
export async function handleFollowDeleteStats(
  followerUid: string,
  followingUid: string
): Promise<void> {
  logger.info("팔로우 삭제 통계 처리 시작", {
    followerUid,
    followingUid,
  });

  try {
    // 1. 팔로우를 받았던 사용자의 receivedFollowers 통계 감소
    await updateUserStats(followingUid, "receivedFollowers", -1);

    // 2. 인플루언서 점수 재계산
    await updateInfluencerScore(followingUid);

    logger.info("팔로우 삭제 통계 처리 완료", {
      followerUid,
      followingUid,
    });
  } catch (error) {
    logger.error("팔로우 삭제 통계 처리 실패", {
      followerUid,
      followingUid,
      error: error instanceof Error ? error.message : String(error),
    });
    // 통계 처리 실패는 비치명적이므로 에러를 throw하지 않음
  }
}
