---
title: stats.ranking.handler.ts - TypeScript 소스 코드
original_path: firebase/functions/src/handlers/stats.ranking.handler.ts
category: cloud-function
file_type: ts
status: current
last_updated: 2025-11-20
---

# stats.ranking.handler.ts

## 개요

**원본 경로**: `firebase/functions/src/handlers/stats.ranking.handler.ts`

**파일 유형**: TypeScript 소스 코드

## 소스 코드

```typescript
/**
 * 인플루언서 순위 핸들러
 *
 * 이 파일은 인플루언서 점수가 변경될 때 실행되는 순위 관리 로직을 처리합니다.
 *
 * 주요 기능:
 * - 일별/월별/연간 인플루언서 순위 업데이트
 * - 점수를 역순(negative)으로 저장하여 내림차순 정렬 지원
 *
 * 트리거 경로:
 * - /influencer-scores/{uid} 생성/변경/삭제 시
 *
 * DB 구조:
 * /influencer-scores/{uid} = 점수 (number)
 * /influencer-rankings/daily/{yyyyMMdd}/{uid} = -점수 (역순 저장)
 * /influencer-rankings/monthly/{yyyyMM}/{uid} = -점수 (역순 저장)
 * /influencer-rankings/yearly/{yyyy}/{uid} = -점수 (역순 저장)
 * /influencer-rankings/total/{uid} = -점수 (역순 저장)
 *
 * 참고:
 * - Firebase RTDB는 기본적으로 오름차순 정렬을 지원
 * - 내림차순 정렬을 위해 점수에 음수(-)를 곱하여 저장
 * - 클라이언트에서 읽을 때 다시 음수를 곱하면 원래 점수를 얻을 수 있음
 */

import * as logger from "firebase-functions/logger";
import * as admin from "firebase-admin";
import {formatDate} from "../utils/stats.utils";

/**
 * 인플루언서 순위 업데이트
 *
 * @param uid - 사용자 UID
 * @param newScore - 새로운 점수 (0 이상)
 * @returns Promise<void>
 *
 * 수행 작업:
 * 1. 현재 UTC 날짜 계산
 * 2. 일별 순위 업데이트: /influencer-rankings/daily/{yyyyMMdd}/{uid}
 * 3. 월별 순위 업데이트: /influencer-rankings/monthly/{yyyyMM}/{uid}
 * 4. 연간 순위 업데이트: /influencer-rankings/yearly/{yyyy}/{uid}
 * 5. 전체 순위 업데이트: /influencer-rankings/total/{uid}
 *
 * 모든 순위는 점수에 음수를 곱하여 저장 (내림차순 정렬 지원)
 */
export async function handleInfluencerScoreChange(
  uid: string,
  newScore: number | null
): Promise<void> {
  logger.info("인플루언서 순위 업데이트 시작", {
    uid,
    newScore,
  });

  try {
    const updates: Record<string, unknown> = {};
    const now = new Date();

    // UTC 기준 날짜 계산
    const dateDaily = formatDate(now, "yyyyMMdd");
    const dateMonthly = formatDate(now, "yyyyMM");
    const dateYearly = formatDate(now, "yyyy");

    if (newScore === null || newScore === 0) {
      // 점수가 0이거나 null이면 순위에서 제거
      updates[`influencer-rankings/daily/${dateDaily}/${uid}`] = null;
      updates[`influencer-rankings/monthly/${dateMonthly}/${uid}`] = null;
      updates[`influencer-rankings/yearly/${dateYearly}/${uid}`] = null;
      updates[`influencer-rankings/total/${uid}`] = null;

      logger.info("인플루언서 순위에서 제거", {
        uid,
        dateDaily,
        dateMonthly,
        dateYearly,
      });
    } else {
      // 점수를 역순으로 저장 (내림차순 정렬을 위해)
      const negativeScore = -newScore;

      updates[`influencer-rankings/daily/${dateDaily}/${uid}`] = negativeScore;
      updates[`influencer-rankings/monthly/${dateMonthly}/${uid}`] = negativeScore;
      updates[`influencer-rankings/yearly/${dateYearly}/${uid}`] = negativeScore;
      updates[`influencer-rankings/total/${uid}`] = negativeScore;

      logger.info("인플루언서 순위 업데이트", {
        uid,
        newScore,
        negativeScore,
        dateDaily,
        dateMonthly,
        dateYearly,
      });
    }

    await admin.database().ref().update(updates);

    logger.info("인플루언서 순위 업데이트 완료", {
      uid,
      newScore,
    });
  } catch (error) {
    logger.error("인플루언서 순위 업데이트 실패", {
      uid,
      newScore,
      error: error instanceof Error ? error.message : String(error),
    });
    // 순위 업데이트 실패는 비치명적이므로 에러를 throw하지 않음
  }
}
```
