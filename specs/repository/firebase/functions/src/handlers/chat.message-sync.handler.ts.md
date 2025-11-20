---
title: chat.message-sync.handler.ts - TypeScript 소스 코드
original_path: firebase/functions/src/handlers/chat.message-sync.handler.ts
category: cloud-function
file_type: ts
status: current
last_updated: 2025-11-20
---

# chat.message-sync.handler.ts

## 개요

**원본 경로**: `firebase/functions/src/handlers/chat.message-sync.handler.ts`

**파일 유형**: TypeScript 소스 코드

## 소스 코드

```typescript
/**
 * Firebase Cloud Functions - Chat Message & Post Sync Handler
 *
 * 채팅 메시지와 게시글 간의 양방향 동기화 핸들러
 * - 채팅 메시지의 text/urls 변경 시 → 게시글 동기화
 * - 게시글의 text/urls 변경 시 → 채팅 메시지 동기화
 */

import * as logger from "firebase-functions/logger";
import * as admin from "firebase-admin";

/**
 * 채팅 메시지의 text 필드 변경 시 게시글로 동기화
 *
 * @param roomId - 채팅방 ID
 * @param messageId - 메시지 ID
 * @param newText - 새로운 text 값
 * @returns Promise<void>
 *
 * 주요 처리 로직:
 * 1. 채팅 메시지에서 postId 조회
 * 2. postId가 있으면 (게시글로 저장된 메시지인 경우)
 * 3. /posts/{postId}/text를 동일한 값으로 업데이트
 *
 * 참고:
 * - postId가 없으면 (일반 채팅 메시지인 경우) 아무 작업도 하지 않음
 * - 무한 루프 방지: 게시글 업데이트 → 채팅 메시지 업데이트 → 게시글 업데이트 방지
 */
export async function handleChatMessageTextUpdate(
  roomId: string,
  messageId: string,
  newText: string | null
): Promise<void> {
  logger.info("채팅 메시지 text 변경 감지 - 게시글 동기화 시작", {
    roomId,
    messageId,
    newText,
  });

  try {
    // 채팅 메시지에서 postId 조회
    const messageRef = admin.database().ref(`chat-messages/${roomId}/${messageId}/postId`);
    const postIdSnapshot = await messageRef.once("value");
    const postId = postIdSnapshot.val();

    // postId가 없으면 일반 채팅 메시지이므로 동기화 불필요
    if (!postId) {
      logger.info("postId가 없어 동기화 스킵 (일반 채팅 메시지)", {
        roomId,
        messageId,
      });
      return;
    }

    // /posts/{postId}/text 업데이트
    const postTextRef = admin.database().ref(`posts/${postId}/text`);
    await postTextRef.set(newText);

    logger.info("게시글 text 동기화 완료", {
      roomId,
      messageId,
      postId,
      newText,
    });
  } catch (error) {
    logger.error("게시글 text 동기화 실패", {
      roomId,
      messageId,
      error: error instanceof Error ? error.message : String(error),
    });
    // 동기화 실패는 비치명적이므로 에러를 throw하지 않음
  }
}

/**
 * 채팅 메시지의 urls 필드 변경 시 게시글로 동기화
 *
 * @param roomId - 채팅방 ID
 * @param messageId - 메시지 ID
 * @param newUrls - 새로운 urls 값 (배열 또는 null)
 * @returns Promise<void>
 *
 * 주요 처리 로직:
 * 1. 채팅 메시지에서 postId 조회
 * 2. postId가 있으면 (게시글로 저장된 메시지인 경우)
 * 3. /posts/{postId}/urls를 동일한 값으로 업데이트
 */
export async function handleChatMessageUrlsUpdate(
  roomId: string,
  messageId: string,
  newUrls: Record<number, string> | null
): Promise<void> {
  logger.info("채팅 메시지 urls 변경 감지 - 게시글 동기화 시작", {
    roomId,
    messageId,
    newUrls,
  });

  try {
    // 채팅 메시지에서 postId 조회
    const messageRef = admin.database().ref(`chat-messages/${roomId}/${messageId}/postId`);
    const postIdSnapshot = await messageRef.once("value");
    const postId = postIdSnapshot.val();

    // postId가 없으면 일반 채팅 메시지이므로 동기화 불필요
    if (!postId) {
      logger.info("postId가 없어 동기화 스킵 (일반 채팅 메시지)", {
        roomId,
        messageId,
      });
      return;
    }

    // /posts/{postId}/urls 업데이트
    const postUrlsRef = admin.database().ref(`posts/${postId}/urls`);
    await postUrlsRef.set(newUrls);

    logger.info("게시글 urls 동기화 완료", {
      roomId,
      messageId,
      postId,
      newUrls,
    });
  } catch (error) {
    logger.error("게시글 urls 동기화 실패", {
      roomId,
      messageId,
      error: error instanceof Error ? error.message : String(error),
    });
    // 동기화 실패는 비치명적이므로 에러를 throw하지 않음
  }
}

/**
 * 게시글의 text 필드 변경 시 채팅 메시지로 동기화
 *
 * @param postId - 게시글 ID
 * @param newText - 새로운 text 값
 * @returns Promise<void>
 *
 * 주요 처리 로직:
 * 1. 게시글에서 roomId, messageId 조회
 * 2. roomId, messageId가 있으면
 * 3. /chat-messages/{roomId}/{messageId}/text를 동일한 값으로 업데이트
 */
export async function handlePostTextUpdate(
  postId: string,
  newText: string | null
): Promise<void> {
  logger.info("게시글 text 변경 감지 - 채팅 메시지 동기화 시작", {
    postId,
    newText,
  });

  try {
    // 게시글에서 roomId, messageId 조회
    const postRef = admin.database().ref(`posts/${postId}`);
    const postSnapshot = await postRef.once("value");
    const postData = postSnapshot.val();

    if (!postData) {
      logger.error("게시글 데이터를 찾을 수 없습니다", {
        postId,
      });
      return;
    }

    const { roomId, messageId } = postData;

    if (!roomId || !messageId) {
      logger.error("게시글에 roomId 또는 messageId가 없습니다", {
        postId,
        postData,
      });
      return;
    }

    // /chat-messages/{roomId}/{messageId}/text 업데이트
    const messageTextRef = admin.database().ref(`chat-messages/${roomId}/${messageId}/text`);
    await messageTextRef.set(newText);

    logger.info("채팅 메시지 text 동기화 완료", {
      postId,
      roomId,
      messageId,
      newText,
    });
  } catch (error) {
    logger.error("채팅 메시지 text 동기화 실패", {
      postId,
      error: error instanceof Error ? error.message : String(error),
    });
    // 동기화 실패는 비치명적이므로 에러를 throw하지 않음
  }
}

/**
 * 게시글의 urls 필드 변경 시 채팅 메시지로 동기화
 *
 * @param postId - 게시글 ID
 * @param newUrls - 새로운 urls 값 (배열 또는 null)
 * @returns Promise<void>
 *
 * 주요 처리 로직:
 * 1. 게시글에서 roomId, messageId 조회
 * 2. roomId, messageId가 있으면
 * 3. /chat-messages/{roomId}/{messageId}/urls를 동일한 값으로 업데이트
 */
export async function handlePostUrlsUpdate(
  postId: string,
  newUrls: Record<number, string> | null
): Promise<void> {
  logger.info("게시글 urls 변경 감지 - 채팅 메시지 동기화 시작", {
    postId,
    newUrls,
  });

  try {
    // 게시글에서 roomId, messageId 조회
    const postRef = admin.database().ref(`posts/${postId}`);
    const postSnapshot = await postRef.once("value");
    const postData = postSnapshot.val();

    if (!postData) {
      logger.error("게시글 데이터를 찾을 수 없습니다", {
        postId,
      });
      return;
    }

    const { roomId, messageId } = postData;

    if (!roomId || !messageId) {
      logger.error("게시글에 roomId 또는 messageId가 없습니다", {
        postId,
        postData,
      });
      return;
    }

    // /chat-messages/{roomId}/{messageId}/urls 업데이트
    const messageUrlsRef = admin.database().ref(`chat-messages/${roomId}/${messageId}/urls`);
    await messageUrlsRef.set(newUrls);

    logger.info("채팅 메시지 urls 동기화 완료", {
      postId,
      roomId,
      messageId,
      newUrls,
    });
  } catch (error) {
    logger.error("채팅 메시지 urls 동기화 실패", {
      postId,
      error: error instanceof Error ? error.message : String(error),
    });
    // 동기화 실패는 비치명적이므로 에러를 throw하지 않음
  }
}
```
