---
title: stats.comment.handler.ts - TypeScript 소스 코드
original_path: firebase/functions/src/handlers/stats.comment.handler.ts
category: cloud-function
file_type: ts
status: current
last_updated: 2025-11-20
---

# stats.comment.handler.ts

## 개요

**원본 경로**: `firebase/functions/src/handlers/stats.comment.handler.ts`

**파일 유형**: TypeScript 소스 코드

## 소스 코드

```typescript
/**
 * 댓글 통계 핸들러
 *
 * 이 파일은 댓글이 생성/삭제될 때 실행되는 통계 집계 로직을 처리합니다.
 *
 * 주요 기능:
 * - 댓글을 받은 사용자의 통계 업데이트 (일별/월별/연도별/전체)
 * - 게시글 댓글과 댓글 대댓글을 구분하여 통계 집계
 * - 자기 자신에게 한 댓글은 통계에서 제외
 * - 댓글 작성자의 createdComments 통계도 업데이트
 * - 인플루언서 점수 재계산
 *
 * 트리거 경로:
 * - /comments/{postId}/{commentId} 생성/삭제 시
 *
 * DB 구조:
 * /comments/{postId}/{commentId} = { authorUid, parentId, createdAt, ... }
 */

import * as logger from "firebase-functions/logger";
import * as admin from "firebase-admin";
import {
  updateUserStats,
  incrementInfluencerScore,
} from "../utils/stats.utils";
import {INFLUENCER_SCORES, SCORE_DESCRIPTIONS} from "../shared/influencer-scores.constants";

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
 * 부모 댓글 작성자 UID 조회
 *
 * @param postId - 게시글 ID
 * @param parentId - 부모 댓글 ID
 * @returns 부모 댓글 작성자 UID (없으면 null)
 */
async function getParentCommentAuthorUid(
  postId: string,
  parentId: string
): Promise<string | null> {
  try {
    const parentAuthorRef = admin
      .database()
      .ref(`comments/${postId}/${parentId}/authorUid`);
    const snapshot = await parentAuthorRef.once("value");

    if (!snapshot.exists()) {
      logger.warn("부모 댓글 작성자를 찾을 수 없음", {postId, parentId});
      return null;
    }

    return snapshot.val() as string;
  } catch (error) {
    logger.error("부모 댓글 작성자 조회 실패", {
      postId,
      parentId,
      error: error instanceof Error ? error.message : String(error),
    });
    return null;
  }
}

/**
 * 댓글 생성 시 통계 업데이트
 *
 * @param postId - 게시글 ID
 * @param commentId - 댓글 ID
 * @param commentData - 댓글 데이터 { authorUid, parentId, createdAt, ... }
 * @returns Promise<void>
 *
 * 수행 작업:
 * 1. 댓글 작성자의 createdComments 통계 증가
 * 2. parentId가 없으면 (게시글 댓글):
 *    - 게시글 작성자의 receivedPostComments 통계 증가
 *    - 게시글 작성자의 receivedComments 통계 증가
 * 3. parentId가 있으면 (댓글 대댓글):
 *    - 부모 댓글 작성자의 receivedCommentReplies 통계 증가
 *    - 부모 댓글 작성자의 receivedComments 통계 증가
 * 4. 자기 자신에게 한 댓글은 통계에서 제외
 * 5. 인플루언서 점수 재계산
 */
export async function handleCommentCreateStats(
  postId: string,
  commentId: string,
  commentData: Record<string, unknown>
): Promise<void> {
  const authorUid = commentData.authorUid as string | undefined;
  const parentId = commentData.parentId as string | null | undefined;
  const createdAt = commentData.createdAt as number | undefined;

  logger.info("댓글 생성 통계 처리 시작", {
    postId,
    commentId,
    authorUid,
    parentId,
    createdAt,
  });

  if (!authorUid) {
    logger.error("authorUid가 없어 통계 처리를 건너뜁니다", {
      postId,
      commentId,
    });
    return;
  }

  try {
    // 1. 댓글 작성자의 createdComments 통계 증가
    await updateUserStats(authorUid, "createdComments", 1, createdAt);

    // 1-1. 댓글 작성자의 인플루언서 점수 증가 (+5점)
    await incrementInfluencerScore(
      authorUid,
      INFLUENCER_SCORES.COMMENT.CREATE,
      SCORE_DESCRIPTIONS.COMMENT_CREATE
    );

    if (!parentId) {
      // 2. 게시글 댓글인 경우
      const postAuthorUid = await getPostAuthorUid(postId);

      if (!postAuthorUid) {
        logger.warn("게시글 작성자를 찾을 수 없어 통계 처리를 건너뜁니다", {
          postId,
          commentId,
        });
        return;
      }

      // 자기 자신에게 한 댓글은 통계에서 제외
      if (authorUid === postAuthorUid) {
        logger.info("자기 자신에게 한 댓글은 통계에서 제외됩니다", {
          postId,
          commentId,
          authorUid,
          postAuthorUid,
        });
        return;
      }

      // 게시글 작성자의 통계 증가
      await updateUserStats(
        postAuthorUid,
        "receivedPostComments",
        1,
        createdAt
      );
      await updateUserStats(
        postAuthorUid,
        "receivedComments",
        1,
        createdAt
      );

      // 게시글 작성자의 인플루언서 점수 증가 (+5점)
      await incrementInfluencerScore(
        postAuthorUid,
        INFLUENCER_SCORES.COMMENT.RECEIVED,
        SCORE_DESCRIPTIONS.COMMENT_RECEIVED
      );

      logger.info("게시글 댓글 통계 처리 완료", {
        postId,
        commentId,
        authorUid,
        postAuthorUid,
      });
    } else {
      // 3. 댓글 대댓글인 경우
      const parentAuthorUid = await getParentCommentAuthorUid(postId, parentId);

      if (!parentAuthorUid) {
        logger.warn("부모 댓글 작성자를 찾을 수 없어 통계 처리를 건너뜁니다", {
          postId,
          commentId,
          parentId,
        });
        return;
      }

      // 자기 자신에게 한 댓글은 통계에서 제외
      if (authorUid === parentAuthorUid) {
        logger.info("자기 자신에게 한 댓글은 통계에서 제외됩니다", {
          postId,
          commentId,
          parentId,
          authorUid,
          parentAuthorUid,
        });
        return;
      }

      // 부모 댓글 작성자의 통계 증가
      await updateUserStats(
        parentAuthorUid,
        "receivedCommentReplies",
        1,
        createdAt
      );
      await updateUserStats(
        parentAuthorUid,
        "receivedComments",
        1,
        createdAt
      );

      // 부모 댓글 작성자의 인플루언서 점수 증가 (+5점)
      await incrementInfluencerScore(
        parentAuthorUid,
        INFLUENCER_SCORES.COMMENT.RECEIVED,
        SCORE_DESCRIPTIONS.COMMENT_RECEIVED
      );

      logger.info("댓글 대댓글 통계 처리 완료", {
        postId,
        commentId,
        parentId,
        authorUid,
        parentAuthorUid,
      });
    }
  } catch (error) {
    logger.error("댓글 생성 통계 처리 실패", {
      postId,
      commentId,
      authorUid,
      parentId,
      error: error instanceof Error ? error.message : String(error),
    });
    // 통계 처리 실패는 비치명적이므로 에러를 throw하지 않음
  }
}

/**
 * 댓글 삭제 시 통계 업데이트
 *
 * @param postId - 게시글 ID
 * @param commentId - 댓글 ID
 * @param commentData - 댓글 데이터 { authorUid, parentId, createdAt, ... }
 * @returns Promise<void>
 *
 * 수행 작업:
 * 1. 댓글 작성자의 createdComments 통계 감소
 * 2. parentId가 없으면 (게시글 댓글):
 *    - 게시글 작성자의 receivedPostComments 통계 감소
 *    - 게시글 작성자의 receivedComments 통계 감소
 * 3. parentId가 있으면 (댓글 대댓글):
 *    - 부모 댓글 작성자의 receivedCommentReplies 통계 감소
 *    - 부모 댓글 작성자의 receivedComments 통계 감소
 * 4. 자기 자신에게 한 댓글은 통계에서 제외
 * 5. 인플루언서 점수 재계산
 */
export async function handleCommentDeleteStats(
  postId: string,
  commentId: string,
  commentData: Record<string, unknown>
): Promise<void> {
  const authorUid = commentData.authorUid as string | undefined;
  const parentId = commentData.parentId as string | null | undefined;

  logger.info("댓글 삭제 통계 처리 시작", {
    postId,
    commentId,
    authorUid,
    parentId,
  });

  if (!authorUid) {
    logger.error("authorUid가 없어 통계 처리를 건너뜁니다", {
      postId,
      commentId,
    });
    return;
  }

  try {
    // 1. 댓글 작성자의 createdComments 통계 감소
    await updateUserStats(authorUid, "createdComments", -1);

    // 1-1. 댓글 작성자의 인플루언서 점수 감소 (-7점, 페널티 포함)
    await incrementInfluencerScore(
      authorUid,
      INFLUENCER_SCORES.COMMENT.DELETE,
      SCORE_DESCRIPTIONS.COMMENT_DELETE
    );

    if (!parentId) {
      // 2. 게시글 댓글인 경우
      const postAuthorUid = await getPostAuthorUid(postId);

      if (!postAuthorUid) {
        logger.warn("게시글 작성자를 찾을 수 없어 통계 처리를 건너뜁니다", {
          postId,
          commentId,
        });
        return;
      }

      // 자기 자신에게 한 댓글은 통계에서 제외
      if (authorUid === postAuthorUid) {
        logger.info("자기 자신에게 한 댓글은 통계에서 제외됩니다", {
          postId,
          commentId,
          authorUid,
          postAuthorUid,
        });
        return;
      }

      // 게시글 작성자의 통계 감소
      await updateUserStats(postAuthorUid, "receivedPostComments", -1);
      await updateUserStats(postAuthorUid, "receivedComments", -1);

      // 게시글 작성자의 인플루언서 점수 감소 (-5점, 페널티 없음)
      await incrementInfluencerScore(
        postAuthorUid,
        INFLUENCER_SCORES.COMMENT.RECEIVED_DELETE,
        SCORE_DESCRIPTIONS.COMMENT_RECEIVED_DELETE
      );

      logger.info("게시글 댓글 삭제 통계 처리 완료", {
        postId,
        commentId,
        authorUid,
        postAuthorUid,
      });
    } else {
      // 3. 댓글 대댓글인 경우
      const parentAuthorUid = await getParentCommentAuthorUid(postId, parentId);

      if (!parentAuthorUid) {
        logger.warn("부모 댓글 작성자를 찾을 수 없어 통계 처리를 건너뜁니다", {
          postId,
          commentId,
          parentId,
        });
        return;
      }

      // 자기 자신에게 한 댓글은 통계에서 제외
      if (authorUid === parentAuthorUid) {
        logger.info("자기 자신에게 한 댓글은 통계에서 제외됩니다", {
          postId,
          commentId,
          parentId,
          authorUid,
          parentAuthorUid,
        });
        return;
      }

      // 부모 댓글 작성자의 통계 감소
      await updateUserStats(parentAuthorUid, "receivedCommentReplies", -1);
      await updateUserStats(parentAuthorUid, "receivedComments", -1);

      // 부모 댓글 작성자의 인플루언서 점수 감소 (-5점, 페널티 없음)
      await incrementInfluencerScore(
        parentAuthorUid,
        INFLUENCER_SCORES.COMMENT.RECEIVED_DELETE,
        SCORE_DESCRIPTIONS.COMMENT_RECEIVED_DELETE
      );

      logger.info("댓글 대댓글 삭제 통계 처리 완료", {
        postId,
        commentId,
        parentId,
        authorUid,
        parentAuthorUid,
      });
    }
  } catch (error) {
    logger.error("댓글 삭제 통계 처리 실패", {
      postId,
      commentId,
      authorUid,
      parentId,
      error: error instanceof Error ? error.message : String(error),
    });
    // 통계 처리 실패는 비치명적이므로 에러를 throw하지 않음
  }
}
```
