---
title: chat.room-pin-create.handler.ts - TypeScript 소스 코드
original_path: firebase/functions/src/handlers/chat.room-pin-create.handler.ts
category: cloud-function
file_type: ts
status: current
last_updated: 2025-11-20
---

# chat.room-pin-create.handler.ts

## 개요

**원본 경로**: `firebase/functions/src/handlers/chat.room-pin-create.handler.ts`

**파일 유형**: TypeScript 소스 코드

## 소스 코드

```typescript
/**
 * 채팅방 핀 생성 시 비즈니스 로직 처리 핸들러
 *
 * 이 파일은 chat-joins/{uid}/{roomId}/pin 필드가 생성될 때 트리거되는 핸들러입니다.
 */

import * as admin from "firebase-admin";
import * as logger from "firebase-functions/logger";
import {
  toChatListOrder,
  extractTimestampFromChatOrder,
  extractChatStatus,
} from "../../../../shared/order-value.utils";

/**
 * 채팅방 핀 생성 시 비즈니스 로직 처리
 *
 * @param uid - 사용자 UID
 * @param roomId - 채팅방 ID
 * @returns Promise<void>
 *
 * 주요 처리 로직:
 * 1. chat-joins/{uid}/{roomId}의 모든 데이터 읽기
 * 2. xxxListOrder 또는 xxxChatListOrder로 끝나는 모든 필드 찾기
 * 3. 각 order 필드에 "500" prefix 추가
 *
 * 데이터 구조:
 * - chat-joins/{uid}/{roomId}/pin: true (핀 설정됨)
 * - chat-joins/{uid}/{roomId}/xxxListOrder: 정렬 순서 필드
 *
 * Prefix 규칙:
 * - "500" prefix: 핀된 채팅방 (최상위)
 * - "200" prefix: 읽지 않은 메시지가 있는 채팅방 (상위)
 * - prefix 없음: 읽은 메시지만 있는 채팅방 (일반)
 *
 * 트리거 경로:
 * - chat-joins/{uid}/{roomId}/pin (onValueCreated)
 *
 * 클라이언트 호출:
 * - chat.functions.ts: togglePinChatRoom() (핀 토글)
 *
 * 참고:
 * - Prefix 규칙: "500" (핀됨) > "200" (읽지 않음) > "" (읽음)
 * - 모든 order 필드에 일관되게 prefix 적용
 * - Base timestamp는 유지하되 prefix만 변경
 */
export async function handleChatRoomPinCreate(
  uid: string,
  roomId: string
): Promise<void> {
  logger.info("채팅방 핀 생성 처리 시작", {
    uid,
    roomId,
  });

  // chat-joins 데이터 읽기
  const chatJoinRef = admin.database().ref(`chat-joins/${uid}/${roomId}`);
  const snapshot = await chatJoinRef.once("value");

  if (!snapshot.exists()) {
    logger.error("chat-joins 노드가 존재하지 않음", {uid, roomId});
    return;
  }

  const data = snapshot.val();

  // xxxListOrder 또는 xxxChatListOrder 필드 찾기
  const updates: Record<string, number> = {};

  for (const key of Object.keys(data)) {
    // order 필드만 처리 (ListOrder 또는 ChatListOrder로 끝나는 필드)
    if (
      !key.endsWith("ListOrder") &&
      !key.endsWith("ChatListOrder")
    ) {
      continue;
    }

    const currentValue = Number(data[key]);

    // 이미 핀 상태인지 확인
    const currentStatus = extractChatStatus(currentValue);
    if (currentStatus === "pinned") {
      // 이미 핀 설정되어 있으면 건너뜀
      continue;
    }

    // 원본 타임스탬프 추출
    const timestamp = extractTimestampFromChatOrder(currentValue);

    // 핀 설정: PINNED_OFFSET 적용
    const newValue = toChatListOrder(timestamp, "pinned");

    // 값이 실제로 변경된 경우에만 업데이트
    if (newValue !== currentValue) {
      updates[key] = newValue;
      logger.info("Order 필드 업데이트 예정 (핀 설정)", {
        uid,
        roomId,
        field: key,
        from: currentValue,
        to: newValue,
        timestamp,
      });
    }
  }

  // 업데이트할 필드가 있는 경우에만 실행
  if (Object.keys(updates).length > 0) {
    await chatJoinRef.update(updates);

    logger.info("채팅방 핀 생성 완료", {
      uid,
      roomId,
      updatedFields: Object.keys(updates),
      updatesCount: Object.keys(updates).length,
    });
  } else {
    logger.info("업데이트할 order 필드가 없음 (핀 설정)", {
      uid,
      roomId,
    });
  }
}
```
