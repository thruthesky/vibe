---
title: user-action-counters.handler.ts - TypeScript 소스 코드
original_path: firebase/functions/src/handlers/user-action-counters.handler.ts
category: cloud-function
file_type: ts
status: current
last_updated: 2025-11-20
---

# user-action-counters.handler.ts

## 개요

**원본 경로**: `firebase/functions/src/handlers/user-action-counters.handler.ts`

**파일 유형**: TypeScript 소스 코드

## 소스 코드

```typescript
/**
 * User Action Counters Handler
 *
 * 사용자별 action 카운터를 관리하는 공통 핸들러입니다.
 * 모든 사용자 행동(좋아요, 댓글, 채팅, 팔로우 등)의 카운터를 /user-action-counters/{uid}에 저장합니다.
 *
 * 주요 특징:
 * - /users/{uid}는 검색/목록에 사용되므로 최소한의 정보만 포함
 * - 사용자별 상세 통계는 /user-action-counters/{uid}에 별도 저장
 * - 전역 통계는 /stats/counters/에 저장
 */

import * as admin from "firebase-admin";
import * as logger from "firebase-functions/logger";

/**
 * 사용자 action 카운터 타입
 *
 * 각 action의 의미:
 * - like: 사용자가 누른 좋아요 수
 * - comment: 사용자가 작성한 댓글 수
 * - post: 사용자가 작성한 게시글 수
 * - chat: 사용자가 전송한 채팅 메시지 수
 * - follow: 사용자가 팔로우한 수 (팔로잉 수)
 * - user: 사용자 가입 카운터 (특수 케이스)
 */
export type ActionCounterType = "like" | "comment" | "post" | "chat" | "follow" | "user";

/**
 * 사용자별 action 카운터 증감 함수
 *
 * @param uid - 사용자 UID
 * @param counterType - 카운터 타입 (like, comment, post, chat, follow, user)
 * @param delta - 증감량 (1: 증가, -1: 감소)
 * @returns Promise<void>
 *
 * 수행 작업:
 * 1. 전역 통계 업데이트: /stats/counters/{counterType}
 * 2. 사용자별 통계 업데이트: /user-action-counters/{uid}/{counterType}
 *
 * 예시:
 * - 좋아요 추가: incrementActionCounter(uid, "like", 1)
 * - 좋아요 취소: incrementActionCounter(uid, "like", -1)
 * - 댓글 작성: incrementActionCounter(uid, "comment", 1)
 * - 게시글 작성: incrementActionCounter(uid, "post", 1)
 * - 팔로우: incrementActionCounter(uid, "follow", 1)
 */
export async function incrementActionCounter(
  uid: string,
  counterType: ActionCounterType,
  delta: number
): Promise<void> {
  if (delta === 0) {
    logger.warn("delta가 0이므로 카운터 업데이트를 건너뜁니다", {
      uid,
      counterType,
      delta,
    });
    return;
  }

  try {
    const updates: Record<string, unknown> = {};

    // 1. 전역 통계 업데이트
    updates[`stats/counters/${counterType}`] = admin.database.ServerValue.increment(delta);

    // 2. 사용자별 통계 업데이트
    updates[`user-action-counters/${uid}/${counterType}`] = admin.database.ServerValue.increment(delta);

    await admin.database().ref().update(updates);

    logger.info("사용자 action 카운터 업데이트 완료", {
      uid,
      counterType,
      delta,
      globalPath: `stats/counters/${counterType}`,
      userPath: `user-action-counters/${uid}/${counterType}`,
    });
  } catch (error) {
    logger.error("사용자 action 카운터 업데이트 실패", {
      uid,
      counterType,
      delta,
      error: error instanceof Error ? error.message : String(error),
    });
    // 카운터 업데이트 실패는 치명적이지 않으므로 에러를 throw하지 않고 로그만 남김
  }
}
```
