---
title: chat.join-create.handler.ts - TypeScript 소스 코드
original_path: firebase/functions/src/handlers/chat.join-create.handler.ts
category: cloud-function
file_type: ts
status: current
last_updated: 2025-11-20
---

# chat.join-create.handler.ts

## 개요

**원본 경로**: `firebase/functions/src/handlers/chat.join-create.handler.ts`

**파일 유형**: TypeScript 소스 코드

## 소스 코드

```typescript
/**
 * 채팅방 참여 정보 생성 시 비즈니스 로직 처리 핸들러
 *
 * 이 파일은 chat-joins/{uid}/{roomId} 노드에 새로운 참여 정보가 생성될 때 트리거되는 핸들러입니다.
 */

import * as admin from "firebase-admin";
import * as logger from "firebase-functions/logger";
import {
  isSingleChat,
  getPartnerUidFromSingleRoomId,
} from "../../../../shared/chat.pure-functions";

/**
 * 채팅방 참여 정보 생성 시 비즈니스 로직 처리
 *
 * @param uid - 사용자 UID
 * @param roomId - 채팅방 ID
 * @returns Promise<void>
 *
 * 주요 처리 로직:
 * 1. 1:1 채팅인 경우:
 *    - singleChatListOrder 설정 (timestamp)
 *    - allChatListOrder 설정 (timestamp)
 *    - partnerUid 설정
 *    - roomType 설정 ("single")
 * 2. 그룹/오픈 채팅인 경우:
 *    - chat-rooms에서 정보 읽기
 *    - roomType에 따라 정렬 필드 설정
 *    - roomName 설정
 * 3. joinedAt 필드가 없으면 현재 타임스탬프로 생성
 *
 * 데이터 구조:
 * - chat-joins/{uid}/{roomId}/joinedAt: 참여 시각 (타임스탬프)
 * - chat-joins/{uid}/{roomId}/roomType: 채팅방 타입 (single, group, open)
 * - chat-joins/{uid}/{roomId}/singleChatListOrder: 1:1 채팅 정렬 순서 (1:1만)
 * - chat-joins/{uid}/{roomId}/groupChatListOrder: 그룹 채팅 정렬 순서 (그룹만)
 * - chat-joins/{uid}/{roomId}/openChatListOrder: 오픈 채팅 정렬 순서 (오픈만)
 * - chat-joins/{uid}/{roomId}/openAndGroupChatListOrder: 그룹+오픈 채팅 정렬 순서
 * - chat-joins/{uid}/{roomId}/allChatListOrder: 전체 채팅 정렬 순서
 *
 * 트리거 경로:
 * - chat-joins/{uid}/{roomId} (onCreate)
 *
 * 클라이언트 호출:
 * - chat.functions.ts: enterSingleChatRoom() (1:1 채팅)
 * - chat.functions.ts: joinChatRoom() (그룹/오픈 채팅)
 *
 * 참고:
 * - 클라이언트가 직접 chat-joins 노드를 생성할 수 있음
 * - 이 함수는 필요한 메타데이터를 자동으로 추가
 */
export async function handleChatJoinCreate(
  uid: string,
  roomId: string
): Promise<void> {
  logger.info("채팅방 참여 정보 생성 처리 시작", {
    uid,
    roomId,
  });

  const timestamp = Date.now();
  const chatJoinRef = admin.database().ref(`chat-joins/${uid}/${roomId}`);
  const chatJoinSnapshot = await chatJoinRef.once("value");

  // 이미 완전히 설정된 경우 건너뛰기
  const existingData = chatJoinSnapshot.val();
  if (existingData?.joinedAt && existingData?.roomType) {
    logger.info("chat-join 정보가 이미 완전히 설정됨, 건너뜀", {
      uid,
      roomId,
      existingFields: Object.keys(existingData),
    });
    return;
  }

  const updates: Record<string, unknown> = {};

  // joinedAt이 없으면 설정
  if (!existingData?.joinedAt) {
    updates.joinedAt = timestamp;
  }

  // 1:1 채팅인지 확인
  if (isSingleChat(roomId)) {
    logger.info("1:1 채팅 참여 정보 처리", {uid, roomId});

    // 1:1 채팅 roomId에서 상대방 UID 추출
    const partnerUid = getPartnerUidFromSingleRoomId(roomId, uid);
    if (!partnerUid) {
      logger.error("잘못된 1:1 채팅 roomId 또는 partnerUid 추출 실패", {
        uid,
        roomId,
      });
      return;
    }

    // 필수 필드 설정
    updates.roomId = roomId;
    updates.roomType = "single";
    updates.partnerUid = partnerUid;
    updates.singleChatListOrder = `${timestamp}`;
    updates.allChatListOrder = timestamp;

    logger.info("1:1 채팅 필드 설정 완료", {
      uid,
      roomId,
      partnerUid,
      fieldsToUpdate: Object.keys(updates),
    });
  } else {
    // 그룹/오픈 채팅 처리
    logger.info("그룹/오픈 채팅 참여 정보 처리", {uid, roomId});

    // 채팅방 정보 조회
    const roomRef = admin.database().ref(`chat-rooms/${roomId}`);
    const roomSnapshot = await roomRef.once("value");

    if (!roomSnapshot.exists()) {
      logger.warn("채팅방 정보를 찾을 수 없음, 기본값으로 설정", {
        uid,
        roomId,
      });
      // 기본값으로 설정
      updates.roomId = roomId;
      updates.roomType = "group";
      updates.allChatListOrder = timestamp;
    } else {
      const roomData = roomSnapshot.val();
      const roomType = roomData.type || "group";
      const roomName = roomData.name || roomId;

      // 필수 필드 설정
      updates.roomId = roomId;
      updates.roomType = roomType;
      updates.roomName = roomName;
      updates.allChatListOrder = timestamp;

      // roomType에 따라 정렬 필드 설정
      if (roomType === "group") {
        updates.groupChatListOrder = `${timestamp}`;
        updates.openAndGroupChatListOrder = timestamp;
      } else if (roomType === "open") {
        updates.openChatListOrder = `${timestamp}`;
        updates.openAndGroupChatListOrder = timestamp;
      }

      logger.info("그룹/오픈 채팅 필드 설정 완료", {
        uid,
        roomId,
        roomType,
        roomName,
        fieldsToUpdate: Object.keys(updates),
      });
    }
  }

  // 업데이트 실행
  await chatJoinRef.update(updates);

  logger.info("chat-join 정보 업데이트 완료", {
    uid,
    roomId,
    updatedFields: Object.keys(updates),
  });
}
```
