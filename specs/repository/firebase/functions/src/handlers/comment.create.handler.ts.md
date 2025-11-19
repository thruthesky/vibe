---
title: comment.create.handler.ts
type: typescript
path: firebase/functions/src/handlers/comment.create.handler.ts
status: active
version: 1.0.0
last_updated: 2025-11-18
---

## 개요

이 파일은 `firebase/functions/src/handlers/comment.create.handler.ts`의 소스 코드를 포함하는 SED 스펙 문서입니다.

## 주요 기능

1. **게시글 및 부모 댓글의 childCount/totalChildCount 자동 증가**: 댓글 생성 시 관련 카운터를 `ServerValue.increment(1)`로 원자적으로 증가시킵니다.
2. **전체 댓글 통계 증가**: `/stats/counters/comment` 경로의 통계 카운터를 증가시킵니다.
3. **푸시 알림 전송**: 댓글 작성 시 관련된 모든 사용자(게시글 작성자, 상위 댓글 작성자들)에게 FCM 푸시 알림을 전송합니다.

**참고**: 댓글 경로가 `/comments/{postId}/{commentId}` 형태이므로, 댓글의 postId는 경로에서 직접 추출할 수 있습니다. 좋아요 시스템에서는 targetType을 `"comment-{postId}"` 형식으로 저장하여 postId 정보를 유지합니다.

## 푸시 알림 로직

### 알림 대상자

댓글 생성 시 다음 사용자들에게 푸시 알림을 전송합니다:

1. **게시글 작성자** (`/posts/{postId}/authorUid`)
2. **부모 댓글 작성자** (대댓글인 경우, `parentId` 참조)
3. **상위 모든 댓글 작성자** (재귀적으로 최상위 댓글까지 탐색)

단, **댓글 작성자 본인은 알림 대상에서 제외**됩니다.

### 재귀적 댓글 트리 탐색

`getAncestorCommentAuthorUids()` 함수는 댓글의 `parentId` 필드를 재귀적으로 따라가며 상위 모든 댓글 작성자의 UID를 수집합니다:

- **무한 루프 방지**: `visited` Set을 사용하여 이미 방문한 댓글 ID를 추적합니다.
- **최상위 도달 조건**: `parentId`가 null이거나 undefined인 경우 재귀 종료합니다.
- **에러 처리**: 댓글을 찾을 수 없거나 조회 실패 시 빈 배열을 반환하며 에러를 로그에 기록합니다.

### 알림 중복 제거

JavaScript `Set`을 사용하여 중복된 UID를 자동으로 제거합니다. 동일한 사용자가 여러 댓글을 작성한 경우에도 한 번만 알림을 받습니다.

### 비차단 알림 전송

푸시 알림 전송은 `sendCommentNotification()` 함수를 `await` 없이 호출하고 `.catch()`로 에러를 처리합니다. 이를 통해:

- 알림 전송 실패가 댓글 생성 프로세스를 차단하지 않습니다.
- 알림 실패는 비치명적(non-critical) 오류로 간주되어 로그만 남깁니다.

## 소스 코드

```typescript
/**
 * 댓글 생성 핸들러
 *
 * 이 파일은 채팅 메시지 댓글이 생성될 때 실행되는 비즈니스 로직을 처리합니다.
 *
 * 주요 기능:
 * - 부모 댓글의 childCount 자동 증가 (Atomic operation)
 * - listOrder 생성을 위한 자식 개수 관리
 * - 관련 사용자들에게 푸시 알림 전송
 */

import * as logger from "firebase-functions/logger";
import * as admin from "firebase-admin";
import {
  getFcmTokensByUids,
  sendFcmNotificationBatch,
} from "../utils/fcm.utils";

/**
 * 전체 댓글 통계 카운터 증가
 *
 * @param postId - 게시글 ID
 * @param commentId - 댓글 ID
 *
 * 수행 작업:
 * - /stats/counters/comment 경로에 ServerValue.increment(1)로 +1 증가
 * - 이 값은 오른쪽 사이드바의 "실시간 통계 - 댓글 수"에 실시간으로 표시됨
 */
async function incrementCommentCounter(
  postId: string,
  commentId: string
): Promise<void> {
  try {
    const commentCounterRef = admin.database().ref("stats/counters/comment");
    await commentCounterRef.set(admin.database.ServerValue.increment(1));

    logger.info("stats/counters/comment 증가 완료 (전체 댓글 통계)", {
      postId,
      commentId,
    });
  } catch (error) {
    logger.error("stats/counters/comment 증가 실패", {
      postId,
      commentId,
      error: error instanceof Error ? error.message : String(error),
    });
    // 통계 증가 실패는 치명적이지 않으므로 에러를 throw하지 않고 로그만 남김
  }
}

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
 * 상위 모든 댓글 작성자 UID 목록 조회 (재귀)
 *
 * @param postId - 게시글 ID
 * @param commentId - 현재 댓글 ID (부모 댓글부터 시작)
 * @param visited - 이미 방문한 댓글 ID 집합 (무한 루프 방지)
 * @returns 상위 모든 댓글 작성자 UID 배열
 *
 * 동작 방식:
 * 1. 현재 댓글의 authorUid와 parentId 조회
 * 2. authorUid를 결과 배열에 추가
 * 3. parentId가 있으면 재귀적으로 부모 댓글 탐색
 * 4. 최상위 댓글까지 도달하면 종료
 */
async function getAncestorCommentAuthorUids(
  postId: string,
  commentId: string | null,
  visited: Set<string> = new Set()
): Promise<string[]> {
  // 종료 조건: commentId가 없거나 이미 방문한 경우
  if (!commentId || visited.has(commentId)) {
    return [];
  }

  // 무한 루프 방지
  visited.add(commentId);

  try {
    const commentRef = admin.database().ref(`comments/${postId}/${commentId}`);
    const snapshot = await commentRef.once("value");

    if (!snapshot.exists()) {
      logger.warn("댓글을 찾을 수 없음", {postId, commentId});
      return [];
    }

    const commentData = snapshot.val() as Record<string, unknown>;
    const authorUid = commentData.authorUid as string | undefined;
    const parentId = commentData.parentId as string | null | undefined;

    const result: string[] = [];

    // 현재 댓글 작성자 추가
    if (authorUid) {
      result.push(authorUid);
    }

    // 부모 댓글이 있으면 재귀적으로 탐색
    if (parentId) {
      const ancestorUids = await getAncestorCommentAuthorUids(
        postId,
        parentId,
        visited
      );
      result.push(...ancestorUids);
    }

    return result;
  } catch (error) {
    logger.error("상위 댓글 작성자 조회 실패", {
      postId,
      commentId,
      error: error instanceof Error ? error.message : String(error),
    });
    return [];
  }
}

/**
 * 댓글 생성 시 관련 사용자들에게 푸시 알림 전송
 *
 * @param postId - 게시글 ID
 * @param commentId - 생성된 댓글 ID
 * @param commentData - 댓글 데이터
 *
 * 알림 대상:
 * 1. 게시글 작성자
 * 2. 부모 댓글 작성자 (대댓글인 경우)
 * 3. 상위 모든 댓글 작성자들
 * 단, 댓글 작성자 본인은 제외
 */
async function sendCommentNotification(
  postId: string,
  commentId: string,
  commentData: Record<string, unknown>
): Promise<void> {
  const authorUid = commentData.authorUid as string | undefined;
  const parentId = commentData.parentId as string | null | undefined;
  const text = commentData.text as string | undefined;

  if (!authorUid) {
    logger.warn("댓글 작성자가 없어 알림을 보낼 수 없음", {
      postId,
      commentId,
    });
    return;
  }

  logger.info("댓글 생성 푸시 알림 전송 시작", {
    postId,
    commentId,
    authorUid,
  });

  try {
    const recipientUids = new Set<string>();

    // 1. 게시글 작성자 추가
    const postAuthorUid = await getPostAuthorUid(postId);
    if (postAuthorUid && postAuthorUid !== authorUid) {
      recipientUids.add(postAuthorUid);
      logger.info("게시글 작성자를 알림 대상에 추가", {
        postAuthorUid,
      });
    }

    // 2. 부모 댓글이 있으면 상위 모든 댓글 작성자 추가
    if (parentId) {
      const ancestorUids = await getAncestorCommentAuthorUids(
        postId,
        parentId
      );

      // 본인 제외하고 추가
      ancestorUids.forEach((uid) => {
        if (uid !== authorUid) {
          recipientUids.add(uid);
        }
      });

      logger.info("상위 댓글 작성자들을 알림 대상에 추가", {
        ancestorCount: ancestorUids.length,
        ancestorUids,
      });
    }

    // 3. 알림 대상이 없으면 종료
    if (recipientUids.size === 0) {
      logger.info("알림을 받을 대상이 없음", {postId, commentId});
      return;
    }

    // 4. FCM 토큰 조회
    const uids = Array.from(recipientUids);
    const tokens = await getFcmTokensByUids(uids);

    if (tokens.length === 0) {
      logger.info("FCM 토큰이 없어 알림 전송을 건너뜀", {
        postId,
        commentId,
        recipientCount: uids.length,
      });
      return;
    }

    // 5. 푸시 알림 전송
    const title = "새 댓글이 달렸습니다";
    const body = text || "(댓글 내용 없음)";
    const data = {
      type: "comment",
      postId,
      commentId,
      authorUid,
    };

    const result = await sendFcmNotificationBatch(tokens, title, body, data);

    logger.info("댓글 생성 푸시 알림 전송 완료", {
      postId,
      commentId,
      recipientCount: uids.length,
      tokenCount: tokens.length,
      successCount: result.successCount,
      failureCount: result.failureCount,
      deletedTokenCount: result.deletedTokenCount,
    });
  } catch (error) {
    logger.error("댓글 생성 푸시 알림 전송 실패", {
      postId,
      commentId,
      error: error instanceof Error ? error.message : String(error),
    });
    // 푸시 알림 실패는 비치명적이므로 에러를 throw하지 않음
  }
}

/**
 * 댓글 생성 시 게시글과 부모 댓글의 childCount/totalChildCount를 증가시킵니다.
 *
 * @param postId - 게시글 ID
 * @param commentId - 생성된 댓글 ID
 * @param commentData - 댓글 데이터
 *
 * 수행 작업:
 * 1. 모든 댓글에 대해:
 *    - 게시글 노드의 totalChildCount를 ServerValue.increment(1)로 +1 증가
 *    - /posts/{postId}/totalChildCount
 *    - 이 값은 게시글의 총 댓글 수를 나타내며, UI에 "(n) 개의 댓글이 있습니다." 형태로 표시됨
 *
 * 2. parentId가 null이면 (최상위 댓글인 경우):
 *    - 게시글의 totalChildCount 증가 (위의 1번 작업)
 *    - **추가로** 게시글의 childCount를 ServerValue.increment(1)로 +1 증가
 *    - /posts/{postId}/childCount
 *    - 클라이언트에서 이 값을 읽어 첫번째 레벨 listOrder 생성에 사용
 *
 * 3. parentId가 존재하면 (대댓글인 경우):
 *    - 게시글의 totalChildCount 증가 (위의 1번 작업)
 *    - **추가로** 부모 댓글의 childCount를 ServerValue.increment(1)로 +1 증가
 *    - /comments/{postId}/{parentId}/childCount
 *    - 클라이언트에서 부모의 childCount를 읽어 listOrder 생성에 사용
 *
 * 참고:
 * - /posts/{postId}/totalChildCount: 게시글의 총 댓글 수 (모든 레벨 포함)
 * - /posts/{postId}/childCount: 첫번째 레벨 댓글 수만 카운트
 * - /comments/{postId}/{parentId}/childCount: 특정 댓글의 직접 자식 댓글 수
 * - ServerValue.increment 사용으로 여러 사용자가 동시에 댓글을 달아도 안전함 (동시성 보장)
 */
export async function handleCommentCreate(
  postId: string,
  commentId: string,
  commentData: Record<string, unknown>
): Promise<void> {
  const parentId = commentData.parentId as string | null;

  logger.info("댓글 생성 감지", {
    postId,
    commentId,
    parentId,
  });

  try {
    // 1. 모든 댓글에 대해 게시글의 totalChildCount 증가 (총 댓글 수)
    const postTotalChildCountRef = admin
      .database()
      .ref(`posts/${postId}/totalChildCount`);

    await postTotalChildCountRef.set(admin.database.ServerValue.increment(1));

    logger.info("게시글의 totalChildCount 증가 완료 (총 댓글 수)", {
      postId,
      commentId,
    });

    // 2. parentId에 따라 추가 작업 수행
    if (!parentId) {
      // 최상위 댓글인 경우: 게시글의 childCount도 증가
      const postChildCountRef = admin
        .database()
        .ref(`posts/${postId}/childCount`);

      await postChildCountRef.set(admin.database.ServerValue.increment(1));

      logger.info("게시글의 childCount 증가 완료 (첫번째 레벨 댓글 수)", {
        postId,
        commentId,
      });
    } else {
      // 대댓글인 경우: 부모 댓글의 childCount 증가
      const parentChildCountRef = admin
        .database()
        .ref(`comments/${postId}/${parentId}/childCount`);

      await parentChildCountRef.set(admin.database.ServerValue.increment(1));

      logger.info("부모 댓글의 childCount 증가 완료", {
        postId,
        commentId,
        parentId,
      });
    }

    // 3. comment-locations 매핑 제거됨
    //    댓글 경로가 comments/{postId}/{commentId} 형태이므로
    //    좋아요 데이터의 targetType을 "comment-{postId}" 형식으로 저장하여 postId 정보 유지

    // 4. 전체 댓글 통계 증가 (최상위 댓글, 대댓글 모두 포함)
    await incrementCommentCounter(postId, commentId);

    // 5. 관련 사용자들에게 푸시 알림 전송 (비차단)
    // 푸시 알림 실패는 비치명적이므로 await하지 않고 백그라운드에서 실행
    sendCommentNotification(postId, commentId, commentData).catch((error) => {
      logger.error("푸시 알림 전송 중 예외 발생 (비치명적)", {
        postId,
        commentId,
        error: error instanceof Error ? error.message : String(error),
      });
    });
  } catch (error) {
    logger.error("childCount/totalChildCount 증가 실패", {
      postId,
      commentId,
      parentId,
      error: error instanceof Error ? error.message : String(error),
    });
    throw error;
  }
}

```

## 관련 문서

- [sonub-data-sync.md](../../../../sonub-data-sync.md) - 채팅 메시지와 게시글 양방향 동기화
- [fcm.utils.ts.md](../utils/fcm.utils.ts.md) - FCM 유틸리티 함수
- [database.rules.json.md](../../../database.rules.json.md) - Firebase Database Security Rules

