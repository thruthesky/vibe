---
title: post.create.handler.ts - TypeScript 소스 코드
original_path: firebase/functions/src/handlers/post.create.handler.ts
category: cloud-function
file_type: ts
status: current
last_updated: 2025-11-20
---

# post.create.handler.ts

## 개요

**원본 경로**: `firebase/functions/src/handlers/post.create.handler.ts`

**파일 유형**: TypeScript 소스 코드

## 소스 코드

```typescript
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
import {recordMyAction} from "../utils/reaction-history.utils";
import {toNegativeTimestamp} from "../../../../shared/order-value.utils";
import {createCategoryOrder, type ForumCategory} from "../../../../shared/categories";

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

    // 2. 정렬 필드 자동 생성 (order, categoryOrder, allCategoryOrder)
    // order: 기본 정렬 필드 (음수 타임스탬프)
    // categoryOrder: 카테고리별 정렬 (역순 문자열)
    // allCategoryOrder: 전체 카테고리 정렬 (음수 타임스탬프)
    let timestamp = createdAt as number;
    if (!timestamp) {
      timestamp = Date.now();
    }

    if (category) {
      const order = toNegativeTimestamp(timestamp);
      const allCategoryOrder = toNegativeTimestamp(timestamp);
      const categoryOrder = createCategoryOrder(category as ForumCategory, timestamp);

      logger.info("정렬 필드 생성 시작", {
        postId,
        category,
        order,
        categoryOrder,
        allCategoryOrder,
      });

      const postRef = admin.database().ref(`posts/${postId}`);
      await postRef.update({
        createdAt: timestamp,    // 양수 유지
        order,                   // 새로 추가 (음수)
        categoryOrder,           // 역순 문자열
        allCategoryOrder,        // 음수
      });

      logger.info("정렬 필드 생성 완료", {
        postId,
        order,
        categoryOrder,
        allCategoryOrder,
      });
    } else {
      logger.warn("category가 없어서 정렬 필드를 생성하지 않습니다", {
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

    // 4. 리액션 히스토리 기록: 나의 발자취에 게시글 작성 기록
    try {
      await recordMyAction({
        uid: authorUid as string,
        type: "post",
        targetType: "post",
        targetId: postId,
      });

      logger.info("✅ 게시글 작성 리액션 히스토리 기록 완료", {
        postId,
        authorUid,
      });
    } catch (error) {
      logger.error("❌ 게시글 작성 리액션 히스토리 기록 실패", {
        postId,
        authorUid,
        error: error instanceof Error ? error.message : String(error),
      });
      // 리액션 히스토리 실패는 비치명적이므로 throw하지 않음
    }

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
```
