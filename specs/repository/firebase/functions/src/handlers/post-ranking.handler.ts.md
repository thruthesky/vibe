---
title: post-ranking.handler.ts - TypeScript 소스 코드
original_path: firebase/functions/src/handlers/post-ranking.handler.ts
category: cloud-function
file_type: ts
status: current
last_updated: 2025-11-20
---

# post-ranking.handler.ts

## 개요

**원본 경로**: `firebase/functions/src/handlers/post-ranking.handler.ts`

**파일 유형**: TypeScript 소스 코드

## 소스 코드

```typescript
/**
 * 게시글 인기 순위 핸들러
 *
 * 이 파일은 게시글의 좋아요/댓글 수 변경 시 인기 순위를 업데이트하는 로직을 처리합니다.
 *
 * 주요 기능:
 * - 게시글의 likeCount 또는 commentCount 변경 시 트리거
 * - 점수 계산: (likeCount × 1) + (commentCount × 2)
 * - 일별/주별/월별 순위 업데이트
 * - 음수로 저장하여 내림차순 정렬 지원
 *
 * 트리거 경로:
 * - /posts/{postId}/likeCount 변경 시
 * - /posts/{postId}/commentCount 또는 totalChildCount 변경 시
 *
 * DB 구조:
 * /post-rankings/{period}/{date}/{postId} = -score
 * - period: daily, weekly, monthly
 * - date: yyyyMMdd (일간), yyyyWww (주간), yyyyMM (월간)
 * - score: 음수로 저장 (예: -150)
 */

import * as logger from "firebase-functions/logger";
import {getDatabase} from "firebase-admin/database";

/**
 * 게시글 순위 업데이트
 *
 * @param postId - 게시글 ID
 * @returns Promise<void>
 *
 * 수행 작업:
 * 1. 게시글 데이터 조회 (likeCount, commentCount)
 * 2. 점수 계산
 * 3. 현재 날짜/주/월 계산
 * 4. 일별/주별/월별 순위 업데이트
 */
export async function handlePostRankingUpdate(
  postId: string
): Promise<void> {
  logger.info("게시글 순위 업데이트 시작", {postId});

  try {
    const db = getDatabase();

    // 1. 게시글 데이터 조회
    const postRef = db.ref(`posts/${postId}`);
    const postSnapshot = await postRef.once("value");

    if (!postSnapshot.exists()) {
      logger.warn("게시글을 찾을 수 없어 순위 업데이트를 건너뜁니다", {postId});
      return;
    }

    const postData = postSnapshot.val();
    const likeCount = postData.likeCount || 0;
    const commentCount = postData.commentCount || postData.totalChildCount || 0;
    const deleted = postData.deleted || false;

    // 삭제된 게시글은 순위에서 제외
    if (deleted) {
      logger.info("삭제된 게시글은 순위에서 제거합니다", {postId});
      await removePostFromRankings(postId);
      return;
    }

    // 2. 점수 계산
    // 좋아요 1점, 댓글 2점
    const score = (likeCount * 1) + (commentCount * 2);

    // 점수가 0 이하면 순위에서 제외
    if (score <= 0) {
      logger.info("점수가 0 이하여서 순위에서 제거합니다", {
        postId,
        likeCount,
        commentCount,
        score,
      });
      await removePostFromRankings(postId);
      return;
    }

    // 3. 현재 날짜/주/월 계산
    const now = new Date();
    const daily = formatDate(now, "daily");
    const weekly = formatDate(now, "weekly");
    const monthly = formatDate(now, "monthly");

    logger.info("게시글 순위 업데이트 데이터", {
      postId,
      likeCount,
      commentCount,
      score,
      daily,
      weekly,
      monthly,
    });

    // 4. 일별/주별/월별 순위 업데이트
    // 음수로 저장하여 orderByValue().limitToFirst()로 내림차순 정렬
    const updates: Record<string, number> = {};
    updates[`post-rankings/daily/${daily}/${postId}`] = -score;
    updates[`post-rankings/weekly/${weekly}/${postId}`] = -score;
    updates[`post-rankings/monthly/${monthly}/${postId}`] = -score;

    await db.ref().update(updates);

    logger.info("게시글 순위 업데이트 완료", {
      postId,
      score,
      daily,
      weekly,
      monthly,
    });
  } catch (error) {
    logger.error("게시글 순위 업데이트 실패", {
      postId,
      error: error instanceof Error ? error.message : String(error),
    });
    // 순위 업데이트 실패는 비치명적이므로 에러를 throw하지 않음
  }
}

/**
 * 순위에서 게시글 제거
 *
 * @param postId - 게시글 ID
 * @returns Promise<void>
 */
async function removePostFromRankings(postId: string): Promise<void> {
  try {
    const db = getDatabase();

    // 현재 날짜/주/월 계산
    const now = new Date();
    const daily = formatDate(now, "daily");
    const weekly = formatDate(now, "weekly");
    const monthly = formatDate(now, "monthly");

    // 모든 기간에서 제거
    const updates: Record<string, null> = {};
    updates[`post-rankings/daily/${daily}/${postId}`] = null;
    updates[`post-rankings/weekly/${weekly}/${postId}`] = null;
    updates[`post-rankings/monthly/${monthly}/${postId}`] = null;

    await db.ref().update(updates);

    logger.info("게시글 순위에서 제거 완료", {postId});
  } catch (error) {
    logger.error("게시글 순위 제거 실패", {
      postId,
      error: error instanceof Error ? error.message : String(error),
    });
  }
}

/**
 * 날짜 형식 변환
 *
 * @param date - Date 객체
 * @param period - 기간 타입 (daily, weekly, monthly)
 * @returns 형식화된 날짜 문자열
 *
 * 형식:
 * - daily: yyyyMMdd (예: 20251119)
 * - weekly: yyyyWww (예: 2025W47) - ISO week 기준
 * - monthly: yyyyMM (예: 202511)
 */
function formatDate(date: Date, period: "daily" | "weekly" | "monthly"): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");

  if (period === "daily") {
    return `${year}${month}${day}`;
  } else if (period === "weekly") {
    // ISO week 계산
    const week = getISOWeek(date);
    return `${year}W${String(week).padStart(2, "0")}`;
  } else {
    // monthly
    return `${year}${month}`;
  }
}

/**
 * ISO week 번호 계산
 *
 * @param date - Date 객체
 * @returns ISO week 번호 (1-53)
 *
 * ISO 8601 기준:
 * - 주의 시작은 월요일
 * - 1월 4일이 포함된 주가 1주차
 */
function getISOWeek(date: Date): number {
  const target = new Date(date.valueOf());
  const dayNr = (date.getDay() + 6) % 7; // 월요일 = 0
  target.setDate(target.getDate() - dayNr + 3);
  const firstThursday = target.valueOf();
  target.setMonth(0, 1);
  if (target.getDay() !== 4) {
    target.setMonth(0, 1 + ((4 - target.getDay()) + 7) % 7);
  }
  return 1 + Math.ceil((firstThursday - target.valueOf()) / 604800000);
}
```
