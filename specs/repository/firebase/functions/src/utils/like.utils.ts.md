---
title: like.utils.ts
type: typescript
path: firebase/functions/src/utils/like.utils.ts
status: active
version: 1.0.0
last_updated: 2025-11-15
---

## 개요

이 파일은 `firebase/functions/src/utils/like.utils.ts`의 소스 코드를 포함하는 SED 스펙 문서입니다.

## 소스 코드

```typescript
/**
 * 좋아요 관련 유틸리티 함수
 */

import * as logger from "firebase-functions/logger";
import {ParsedLikeId} from "../types";

/**
 * likeId를 파싱하여 type, nodeId, uid를 추출합니다.
 *
 * likeId 형식: "{type}-{nodeId}-{uid}"
 * - 문제: nodeId와 uid에 하이픈(-)이 포함될 수 있음
 * - 해결: 마지막 하이픈을 기준으로 uid를 분리하고, 나머지를 nodeId로 간주
 *
 * 예시:
 * - "post-OdEWc-SaDELU2Y51FDy-zodDYjqcmfb5WHi1rVYrUJi0d2j2-user123"
 * - type: "post"
 * - nodeId: "OdEWc-SaDELU2Y51FDy-zodDYjqcmfb5WHi1rVYrUJi0d2j2"
 * - uid: "user123"
 *
 * @param {string} likeId - 파싱할 likeId
 * @returns {ParsedLikeId | null} 파싱 결과 또는 null (파싱 실패 시)
 */
export function parseLikeId(likeId: string): ParsedLikeId | null {
  logger.debug("🔍 parseLikeId 시작", {likeId, likeIdLength: likeId.length});

  // 1단계: type 추출 (첫 번째 하이픈 이전)
  const firstDashIndex = likeId.indexOf("-");
  if (firstDashIndex === -1) {
    logger.error("❌ likeId에 하이픈이 없음", {likeId});
    return null;
  }

  const type = likeId.substring(0, firstDashIndex);
  logger.debug("1단계: type 추출 완료", {type, firstDashIndex});

  if (type !== "post" && type !== "comment") {
    logger.error("❌ 잘못된 type", {type, likeId});
    return null;
  }

  // 2단계: nodeId와 uid 분리
  // type 이후의 문자열을 추출: "post-ABC-DEF-user123" -> "ABC-DEF-user123"
  const remainder = likeId.substring(firstDashIndex + 1);
  logger.debug("2단계: remainder 추출 완료", {
    remainder,
    remainderLength: remainder.length,
  });

  // 마지막 하이픈을 기준으로 uid 분리
  // "ABC-DEF-user123" -> nodeId: "ABC-DEF", uid: "user123"
  const lastDashIndex = remainder.lastIndexOf("-");
  if (lastDashIndex === -1) {
    logger.error("❌ remainder에 하이픈이 없음", {remainder, likeId});
    return null;
  }

  const nodeId = remainder.substring(0, lastDashIndex);
  const uid = remainder.substring(lastDashIndex + 1);

  logger.debug("3단계: nodeId와 uid 분리 완료", {
    nodeId,
    uid,
    lastDashIndex,
  });

  if (!nodeId || !uid) {
    logger.error("❌ nodeId 또는 uid가 비어있음", {nodeId, uid, likeId});
    return null;
  }

  logger.info("✅ parseLikeId 성공", {type, nodeId, uid, likeId});

  return {
    type: type as "post" | "comment",
    nodeId,
    uid,
  };
}

```

