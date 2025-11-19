/**
 * 게시글 생성 핸들러
 *
 * 이 파일은 게시글이 생성될 때 실행되는 비즈니스 로직을 처리합니다.
 *
 * 주요 기능:
 * - stats/counters/post 전역 통계 증가
 * - 정렬 필드 자동 생성 (categoryOrder, allCategoryOrder)
 * - 피드 fan-out: 팔로워들에게 피드 전파
 *
 * 트리거 경로:
 * - /posts/{postId} 생성 시
 *
 * DB 구조:
 * /posts/{postId} = { authorUid, createdAt, category, ... }
 */

import * as logger from "firebase-functions/logger";
import * as admin from "firebase-admin";
import {handleMessageCategoryCreateFanout} from "./feed.fanout.handler";

/**
 * 게시글 생성 시 비즈니스 로직 처리
 *
 * @param postId - 게시글 ID
 * @param postData - 게시글 데이터 { authorUid, createdAt, category, ... }
 * @returns Promise<void>
 *
 * 수행 작업:
 * 1. stats/counters/post 전역 통계 증가
 * 2. 정렬 필드 자동 생성 (categoryOrder, allCategoryOrder)
 * 3. 피드 fan-out: 팔로워들에게 피드 전파
 */
export async function handlePostCreate(
  postId: string,
  postData: Record<string, unknown>
): Promise<void> {
  const {authorUid, createdAt, category} = postData;

  logger.info("게시글 생성 비즈니스 로직 처리 시작", {
    postId,
    authorUid,
    createdAt,
    category,
  });

  if (!authorUid) {
    logger.error("게시글에 authorUid가 없습니다", {postId, postData});
    return;
  }

  try {
    // 1. stats/counters/post 증가
    const postCounterRef = admin.database().ref("stats/counters/post");
    await postCounterRef.set(admin.database.ServerValue.increment(1));

    logger.info("stats/counters/post 증가 완료", {
      postId,
      category,
    });

    // 2. 정렬 필드 자동 생성 (categoryOrder, allCategoryOrder)
    // categoryOrder: 문자열이므로 양수 타임스탬프 사용
    // allCategoryOrder: 숫자이므로 음수 타임스탬프 사용 (Firebase 오름차순 정렬로 최신순 표시)
    if (category && createdAt) {
      const categoryOrder = `${category}-${Number(createdAt)}`;
      const allCategoryOrder = -Number(createdAt);

      logger.info("정렬 필드 생성 시작", {
        postId,
        category,
        categoryOrder,
        allCategoryOrder,
      });

      const postRef = admin.database().ref(`posts/${postId}`);
      await postRef.update({
        categoryOrder,
        allCategoryOrder,
      });

      logger.info("정렬 필드 생성 완료", {
        postId,
        categoryOrder,
        allCategoryOrder,
      });
    } else {
      logger.warn("category 또는 createdAt이 없어서 정렬 필드를 생성하지 않습니다", {
        postId,
        category,
        createdAt,
      });
    }

    // 3. 피드 fan-out: 팔로워들에게 피드 전파
    logger.info("피드 fan-out 시작", {
      postId,
      authorUid,
      createdAt,
    });

    await handleMessageCategoryCreateFanout(postId, authorUid as string, createdAt as number);

    logger.info("피드 fan-out 완료", {
      postId,
      authorUid,
    });

    logger.info("게시글 생성 비즈니스 로직 처리 완료", {
      postId,
      authorUid,
    });
  } catch (error) {
    logger.error("게시글 onCreate 처리 실패", {
      postId,
      error: error instanceof Error ? error.message : String(error),
    });
    throw error;
  }
}
