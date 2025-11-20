---
title: chat.room-member-join.handler.ts - TypeScript 소스 코드
original_path: firebase/functions/src/handlers/chat.room-member-join.handler.ts
category: cloud-function
file_type: ts
status: current
last_updated: 2025-11-20
---

# chat.room-member-join.handler.ts

## 개요

**원본 경로**: `firebase/functions/src/handlers/chat.room-member-join.handler.ts`

**파일 유형**: TypeScript 소스 코드

## 소스 코드

```typescript
/**
 * 채팅방 멤버 입장 시 비즈니스 로직 처리 핸들러
 *
 * 이 파일은 chat-rooms/{roomId}/members/{uid} 노드에 멤버가 추가될 때 트리거되는 핸들러입니다.
 */

import * as admin from "firebase-admin";
import * as logger from "firebase-functions/logger";

/**
 * 채팅방 멤버 입장 시 비즈니스 로직 처리
 *
 * @param roomId - 채팅방 ID
 * @param uid - 입장한 사용자 UID
 * @returns Promise<void>
 *
 * 주요 처리 로직:
 * 1. chat-rooms/{roomId}/members 아래의 모든 uid 읽기
 * 2. 모든 uid의 개수 세기 (true/false 구분 없이)
 * 3. memberCount 필드를 증가시킨다
 * 4. 채팅방 정보 조회 (roomType, roomName)
 * 5. 해당 채팅방의 마지막 메시지 조회 (chat-messages에서 roomOrder로 정렬)
 * 6. chat-joins/{uid}/{roomId}에 다음 정보 저장:
 *    - roomType, roomName
 *    - lastMessageText, lastMessageAt (메시지가 있는 경우)
 *    - newMessageCount (0으로 초기화)
 *    - 정렬 필드들 (groupChatListOrder, openChatListOrder 등)
 *
 * 데이터 구조:
 * - chat-rooms/{roomId}/members/{uid}: boolean (true: 알림 수신, false: 알림 미수신)
 * - chat-rooms/{roomId}/memberCount: 전체 멤버 수
 * - chat-joins/{uid}/{roomId}: 사용자별 채팅방 참여 정보
 *
 * 트리거 경로:
 * - chat-rooms/{roomId}/members/{uid} (onValueCreated)
 *
 * 클라이언트 호출:
 * - chat.functions.ts: joinChatRoom() (그룹/오픈 채팅 입장)
 *
 * 참고:
 * - members 필드 구조: chat-rooms/{roomId}/members/{uid}: boolean
 * - true: 채팅방 참여 중, 메시지 알림을 받음
 * - onValueCreated 트리거로 멤버 입장 감지
 * - 마지막 메시지는 roomOrder 필드로 효율적으로 조회
 */
export async function handleChatRoomMemberJoin(
  roomId: string,
  uid: string
): Promise<void> {
  logger.info("채팅방 멤버 입장 처리 시작", {
    roomId,
    uid,
  });

  // 단계 1: members 필드 읽기
  const membersRef = admin.database().ref(`chat-rooms/${roomId}/members`);
  const membersSnapshot = await membersRef.once("value");

  if (!membersSnapshot.exists()) {
    logger.warn("members 필드가 없음, memberCount를 0으로 설정", {
      roomId,
    });
    await admin.database().ref(`chat-rooms/${roomId}/memberCount`).set(0);
    return;
  }

  // 단계 2: 모든 uid 개수 세기 (true/false 구분 없이)
  const membersData = membersSnapshot.val() as Record<string, boolean>;
  const totalMemberCount = Object.keys(membersData).length;

  logger.info("멤버 입장 후 참여자 수 계산 완료", {
    roomId,
    uid,
    memberCount: totalMemberCount,
  });

  // 단계 3: memberCount 업데이트
  await admin
    .database()
    .ref(`chat-rooms/${roomId}/memberCount`)
    .set(totalMemberCount);

  logger.info("memberCount 업데이트 완료 (멤버 입장)", {
    roomId,
    uid,
    memberCount: totalMemberCount,
  });

  // 단계 4: 채팅방 정보 조회
  const roomRef = admin.database().ref(`chat-rooms/${roomId}`);
  const roomSnapshot = await roomRef.once("value");

  if (!roomSnapshot.exists()) {
    logger.warn("채팅방 정보가 없음, chat-joins 업데이트를 건너뜀", {
      roomId,
      uid,
    });
    return;
  }

  const roomData = roomSnapshot.val();
  const roomType = roomData.type || "unknown";
  const roomName = roomData.name || roomId;

  logger.info("채팅방 정보 조회 완료", {
    roomId,
    uid,
    roomType,
    roomName,
  });

  // 단계 5: 마지막 채팅 메시지 조회
  const messagesRef = admin.database().ref("chat-messages");
  const lastMessageSnapshot = await messagesRef
    .orderByChild("roomOrder")
    .startAt(`-${roomId}-`)
    .endAt(`-${roomId}-\uf8ff`)
    .limitToLast(1)
    .once("value");

  let lastMessageText = "";
  let lastMessageAt = 0;

  if (lastMessageSnapshot.exists()) {
    const messages = lastMessageSnapshot.val();
    const messageId = Object.keys(messages)[0];
    const lastMessage = messages[messageId];

    lastMessageText = lastMessage.text || "";
    lastMessageAt = lastMessage.createdAt || 0;

    logger.info("마지막 메시지 조회 완료", {
      roomId,
      uid,
      messageId,
      lastMessageText,
      lastMessageAt,
    });
  } else {
    logger.info("채팅방에 메시지가 없음", {
      roomId,
      uid,
    });
  }

  // 단계 6: chat-joins 정보 업데이트
  const chatJoinRef = admin.database().ref(`chat-joins/${uid}/${roomId}`);
  const chatJoinSnapshot = await chatJoinRef.once("value");

  const timestamp = Date.now();
  const updates: Record<string, string | number> = {
    roomType,
    roomName,
    newMessageCount: 0,
  };

  // 마지막 메시지 정보 추가 (메시지가 있는 경우에만)
  if (lastMessageAt > 0) {
    updates.lastMessageText = lastMessageText;
    updates.lastMessageAt = lastMessageAt;
  }

  // roomType에 따라 적절한 정렬 필드 설정
  if (roomType === "group") {
    updates.groupChatListOrder = `${timestamp}`;
  } else if (roomType === "open") {
    updates.openChatListOrder = `${timestamp}`;
  }
  // 그룹/오픈 통합 정렬 필드도 설정
  if (roomType === "group" || roomType === "open") {
    updates.openAndGroupChatListOrder = timestamp;
  }
  // 모든 채팅방 통합 정렬 필드 설정
  updates.allChatListOrder = timestamp;

  // joinedAt은 없는 경우에만 설정
  if (!chatJoinSnapshot.exists() || !chatJoinSnapshot.val()?.joinedAt) {
    updates.joinedAt = timestamp;
  }

  await chatJoinRef.update(updates);

  logger.info("chat-joins 상세 정보 업데이트 완료", {
    roomId,
    uid,
    updates,
  });
}
```
