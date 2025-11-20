---
title: influencer-scores.constants.ts - TypeScript 소스 코드
original_path: firebase/functions/src/shared/influencer-scores.constants.ts
category: cloud-function
file_type: ts
status: current
last_updated: 2025-11-20
---

# influencer-scores.constants.ts

## 개요

**원본 경로**: `firebase/functions/src/shared/influencer-scores.constants.ts`

**파일 유형**: TypeScript 소스 코드

## 소스 코드

```typescript
/**
 * 인플루언서 점수 상수 정의
 *
 * 이 파일은 각 사용자 행동에 대한 인플루언서 점수 가중치를 관리합니다.
 *
 * 점수 체계:
 * - 컨텐츠 생성/삭제: 글과 댓글 작성 시 점수 부여, 삭제 시 동일한 절대값 차감
 * - 리액션 수신: 타인으로부터 받은 좋아요, 댓글에 대한 점수
 * - 팔로워: 타인이 나를 팔로우할 때 점수 부여
 *
 * 페널티 시스템:
 * - 글 삭제: 페널티 없음 (작성 +50, 삭제 -50)
 * - 댓글 삭제: 페널티 없음 (작성 +5, 삭제 -5)
 * - 좋아요/팔로우: 페널티 없음 (생성/취소 시 동일한 절대값)
 */

/**
 * 게시글 관련 점수
 */
export const POST_SCORES = {
  /** 게시글 생성 시 점수 */
  CREATE: 50,

  /** 게시글 삭제 시 점수 (음수, 페널티 없음) */
  DELETE: -50,

  /** 게시글 삭제 페널티 (DELETE - CREATE = 0) */
  DELETE_PENALTY: 0,
} as const;

/**
 * 댓글 관련 점수
 */
export const COMMENT_SCORES = {
  /** 댓글 작성 시 점수 (작성자) */
  CREATE: 5,

  /** 댓글 삭제 시 점수 (작성자, 음수, 페널티 없음) */
  DELETE: -5,

  /** 댓글 삭제 페널티 (DELETE - CREATE = 0) */
  DELETE_PENALTY: 0,

  /** 타인이 내 글/댓글에 댓글을 달았을 때 점수 (수신자) */
  RECEIVED: 5,

  /** 타인이 단 댓글이 삭제되었을 때 점수 (수신자, 음수) */
  RECEIVED_DELETE: -5,

  /** 댓글 수신 삭제 페널티 (RECEIVED_DELETE - RECEIVED = 0, 페널티 없음) */
  RECEIVED_DELETE_PENALTY: 0,
} as const;

/**
 * 좋아요 관련 점수
 */
export const LIKE_SCORES = {
  /** 타인으로부터 좋아요를 받았을 때 점수 */
  RECEIVED: 3,

  /** 좋아요가 취소되었을 때 점수 (음수) */
  RECEIVED_CANCEL: -3,

  /** 좋아요 취소 페널티 (RECEIVED_CANCEL - RECEIVED = 0, 페널티 없음) */
  CANCEL_PENALTY: 0,
} as const;

/**
 * 팔로워 관련 점수
 */
export const FOLLOWER_SCORES = {
  /** 타인이 나를 팔로우했을 때 점수 */
  RECEIVED: 60,

  /** 언팔로우되었을 때 점수 (음수) */
  RECEIVED_UNFOLLOW: -60,

  /** 언팔로우 페널티 (RECEIVED_UNFOLLOW - RECEIVED = 0, 페널티 없음) */
  UNFOLLOW_PENALTY: 0,
} as const;

/**
 * 모든 인플루언서 점수 상수
 */
export const INFLUENCER_SCORES = {
  POST: POST_SCORES,
  COMMENT: COMMENT_SCORES,
  LIKE: LIKE_SCORES,
  FOLLOWER: FOLLOWER_SCORES,
} as const;

/**
 * 점수 설명 (디버깅/로깅용)
 */
export const SCORE_DESCRIPTIONS = {
  POST_CREATE: "게시글 작성",
  POST_DELETE: "게시글 삭제 (페널티 포함)",
  COMMENT_CREATE: "댓글 작성",
  COMMENT_DELETE: "댓글 삭제 (페널티 포함)",
  COMMENT_RECEIVED: "댓글 받음 (타인이 내 글/댓글에 댓글 작성)",
  COMMENT_RECEIVED_DELETE: "받은 댓글 삭제됨",
  LIKE_RECEIVED: "좋아요 받음 (타인이 좋아요)",
  LIKE_RECEIVED_CANCEL: "좋아요 취소됨",
  FOLLOWER_RECEIVED: "팔로워 받음 (타인이 팔로우)",
  FOLLOWER_RECEIVED_UNFOLLOW: "언팔로우됨",
} as const;
```
