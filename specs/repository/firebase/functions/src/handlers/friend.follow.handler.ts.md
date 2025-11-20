---
title: friend.follow.handler.ts - TypeScript 소스 코드
original_path: firebase/functions/src/handlers/friend.follow.handler.ts
category: cloud-function
file_type: ts
status: current
last_updated: 2025-11-20
---

# friend.follow.handler.ts

## 개요

**원본 경로**: `firebase/functions/src/handlers/friend.follow.handler.ts`

**파일 유형**: TypeScript 소스 코드

## 소스 코드

```typescript
/**
 * Firebase Cloud Functions - Friend Follow Handler
 *
 * 사용자 간 팔로우/언팔로우 관계 처리 핸들러
 * /user-following 생성/삭제 시 /user-followers를 자동으로 동기화합니다.
 */

import * as logger from "firebase-functions/logger";
import * as admin from "firebase-admin";
import {incrementActionCounter} from "./user-action-counters.handler";
import {
  recordMyAction,
  recordReceivedReaction,
  deleteMyAction,
  deleteReceivedReaction,
} from "../utils/reaction-history.utils";


/**
 * 팔로잉 관계 생성 시 비즈니스 로직 처리
 *
 * @param followerUid - 팔로우하는 사용자 UID (팔로워)
 * @param followingUid - 팔로우 대상 사용자 UID
 * @returns Promise<void>
 *
 * 주요 처리 로직:
 * 1. 자기 자신을 팔로우하는지 검증 (자기 자신 팔로우 불가)
 * 2. /user-followers/{followingUid}/{followerUid} = true 설정 (역참조)
 * 3. 향후: followingUid에게 알림 전송 (현재는 구현하지 않음)
 *
 * 예시:
 * - A가 B를 팔로우 → /user-following/A/B = true
 * - Cloud Functions 트리거 → /user-followers/B/A = true 자동 생성
 */
export async function handleFollowingCreate(
  followerUid: string,
  followingUid: string
): Promise<void> {
  logger.info("팔로잉 관계 생성 처리 시작", {
    followerUid,
    followingUid,
  });

  // 자기 자신을 팔로우하는 경우 검증
  if (followerUid === followingUid) {
    logger.error("자기 자신을 팔로우할 수 없습니다", {
      followerUid,
      followingUid,
    });
    throw new Error("자기 자신을 팔로우할 수 없습니다");
  }

  // /user-followers/{followingUid}/{followerUid} = true 설정
  const followerRef = admin
    .database()
    .ref(`user-followers/${followingUid}/${followerUid}`);

  await followerRef.set(true);

  logger.info("팔로워 역참조 생성 완료", {
    followerUid,
    followingUid,
    path: `user-followers/${followingUid}/${followerUid}`,
  });

  // 사용자별 팔로우 통계 증가
  await incrementActionCounter(followerUid, "follow", 1);

  // 리액션 히스토리 기록
  try {
    // 1. 나의 발자취에 팔로우 기록
    await recordMyAction({
      uid: followerUid,
      type: "follow",
      targetType: "user",
      targetId: followingUid,
    });

    // 2. 팔로우 대상자의 받은 반응에 기록
    await recordReceivedReaction({
      recipientUid: followingUid,
      fromUid: followerUid,
      type: "follow",
      targetType: "user",
      targetId: followingUid,
    });

    logger.info("✅ 팔로우 리액션 히스토리 기록 완료", {
      followerUid,
      followingUid,
    });
  } catch (error) {
    logger.error("❌ 팔로우 리액션 히스토리 기록 실패", {
      followerUid,
      followingUid,
      error: error instanceof Error ? error.message : String(error),
    });
    // 리액션 히스토리 실패는 비치명적이므로 throw하지 않음
  }

  // TODO: 향후 알림 전송 기능 추가
  // - followingUid에게 "followerUid가 당신을 팔로우했습니다" 알림
  // - /notifications/{followingUid}/{notificationId} 생성
  // - FCM 푸시 알림 전송
}

/**
 * 팔로잉 관계 삭제 시 비즈니스 로직 처리
 *
 * @param followerUid - 언팔로우하는 사용자 UID (팔로워)
 * @param followingUid - 언팔로우 대상 사용자 UID
 * @returns Promise<void>
 *
 * 주요 처리 로직:
 * 1. /user-followers/{followingUid}/{followerUid} 삭제 (역참조 제거)
 *
 * 예시:
 * - A가 B를 언팔로우 → /user-following/A/B 삭제
 * - Cloud Functions 트리거 → /user-followers/B/A 자동 삭제
 */
export async function handleFollowingDelete(
  followerUid: string,
  followingUid: string
): Promise<void> {
  logger.info("팔로잉 관계 삭제 처리 시작", {
    followerUid,
    followingUid,
  });

  // /user-followers/{followingUid}/{followerUid} 삭제
  const followerRef = admin
    .database()
    .ref(`user-followers/${followingUid}/${followerUid}`);

  await followerRef.remove();

  logger.info("팔로워 역참조 삭제 완료", {
    followerUid,
    followingUid,
    path: `user-followers/${followingUid}/${followerUid}`,
  });

  // 사용자별 팔로우 통계 감소
  await incrementActionCounter(followerUid, "follow", -1);

  // 리액션 히스토리 삭제
  try {
    // 1. 나의 발자취에서 팔로우 기록 삭제
    await deleteMyAction({
      uid: followerUid,
      type: "follow",
      targetId: followingUid,
    });

    // 2. 팔로우 대상자의 받은 반응에서 기록 삭제
    await deleteReceivedReaction({
      recipientUid: followingUid,
      fromUid: followerUid,
      type: "follow",
      targetId: followingUid,
    });

    logger.info("✅ 언팔로우 리액션 히스토리 삭제 완료", {
      followerUid,
      followingUid,
    });
  } catch (error) {
    logger.error("❌ 언팔로우 리액션 히스토리 삭제 실패", {
      followerUid,
      followingUid,
      error: error instanceof Error ? error.message : String(error),
    });
    // 리액션 히스토리 실패는 비치명적이므로 throw하지 않음
  }
}
```
