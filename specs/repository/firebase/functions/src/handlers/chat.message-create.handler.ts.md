---
title: chat.message-create.handler.ts - TypeScript 소스 코드
original_path: firebase/functions/src/handlers/chat.message-create.handler.ts
category: cloud-function
file_type: ts
status: current
last_updated: 2025-11-20
---

# chat.message-create.handler.ts

## 개요

**원본 경로**: `firebase/functions/src/handlers/chat.message-create.handler.ts`

**파일 유형**: TypeScript 소스 코드

## 소스 코드

```typescript
/**
 * Firebase Cloud Functions - Chat Message Create Handler
 *
 * 채팅 메시지 생성 시 비즈니스 로직을 처리하는 핸들러 모듈입니다.
 * Firebase Cloud Functions의 트리거 함수(onMessageCreate)에서 호출되어
 * 실제 데이터 처리를 수행합니다.
 */

import * as logger from "firebase-functions/logger";
import * as admin from "firebase-admin";
import {ChatMessage} from "../types";
import {
  isSingleChat,
  getPartnerUidFromSingleRoomId,
} from "../../../../shared/chat.pure-functions";
import {
  sendChatMessageNotification,
  isChatSubscribed,
} from "../utils/fcm.utils";
import {incrementActionCounter} from "./user-action-counters.handler";
import {
  toChatListOrder,
  extractChatStatus,
} from "../../../../shared/order-value.utils";


/**
 * 채팅 메시지 생성 시 비즈니스 로직 처리
 *
 * @param messageId - 생성된 메시지 ID
 * @param messageData - 메시지 데이터
 * @returns Promise<void>
 *
 * 주요 처리 로직:
 * 1. 프로토콜 메시지 필터링 (시스템 메시지 건너뛰기)
 * 2. 필수 필드 유효성 검사 (senderUid, roomId)
 * 3. 1:1 채팅인 경우:
 *    - 발신자와 수신자의 chat-join 노드 업데이트
 *    - singleChatListOrder, allChatListOrder 설정
 *    - 수신자의 newMessageCount 증가
 * 4. 그룹/오픈 채팅인 경우:
 *    - chat-rooms에서 members 정보 읽기
 *    - 각 member의 chat-join 노드 업데이트
 *    - groupChatListOrder 또는 openChatListOrder 설정
 *    - openAndGroupChatListOrder, allChatListOrder 설정
 *    - 발신자를 제외한 모든 member의 newMessageCount 증가
 */
export async function handleChatMessageCreate(
  messageId: string,
  messageData: ChatMessage
): Promise<void> {
  logger.info("채팅 메시지 생성 처리 시작", {
    messageId,
    roomId: messageData.roomId,
    senderUid: messageData.senderUid,
    type: messageData.type,
  });

  // 단계 1: 프로토콜 메시지 건너뛰기 (join/leave와 같은 시스템 메시지)
  if (messageData.protocol) {
    logger.info("프로토콜 메시지 건너뜀", {
      messageId,
      protocol: messageData.protocol,
    });
    return;
  }

  // 단계 2: 필수 필드 유효성 검사
  if (!messageData.senderUid || messageData.senderUid.trim().length === 0) {
    logger.error("senderUid 필드가 비어있음", {messageId});
    throw new Error("senderUid는 필수이지만 정의되지 않았거나 비어있습니다");
  }

  if (!messageData.roomId || messageData.roomId.trim().length === 0) {
    logger.error("roomId 필드가 비어있음", {messageId});
    throw new Error("roomId는 필수이지만 정의되지 않았거나 비어있습니다");
  }

  const roomId = messageData.roomId;
  const senderUid = messageData.senderUid;
  const timestamp = messageData.createdAt || Date.now();
  const messageText = messageData.text || "";

  // 단계 3: 1:1 채팅인지 확인 (공유 함수 사용)
  if (isSingleChat(roomId)) {
    // === 1:1 채팅 처리 ===
    logger.info("1:1 채팅 메시지 처리", {messageId, roomId});

    // 1:1 채팅 roomId에서 상대방 UID 추출
    const partnerUid = getPartnerUidFromSingleRoomId(roomId, senderUid);
    if (!partnerUid) {
      logger.error("잘못된 1:1 채팅 roomId 또는 partnerUid 추출 실패", {
        messageId,
        roomId,
        senderUid,
      });
      return;
    }

    // singleChatListOrder 계산 (음수 + Offset 방식)
    // - 발신자: 읽음 상태 (-timestamp)
    // - 수신자(상대방): 읽지 않은 상태 (-timestamp - UNREAD_OFFSET)
    const senderSingleListOrder = toChatListOrder(timestamp, "read");
    const partnerSingleListOrder = toChatListOrder(timestamp, "unread");

    const updates: {[key: string]: unknown} = {};

    // 발신자의 chat-join 업데이트 (읽음 상태)
    updates[`chat-joins/${senderUid}/${roomId}/roomId`] = roomId;
    updates[`chat-joins/${senderUid}/${roomId}/roomType`] = "single";
    updates[`chat-joins/${senderUid}/${roomId}/partnerUid`] = partnerUid;
    updates[`chat-joins/${senderUid}/${roomId}/lastMessageText`] = messageText;
    updates[`chat-joins/${senderUid}/${roomId}/lastMessageAt`] = timestamp;
    updates[`chat-joins/${senderUid}/${roomId}/updatedAt`] = timestamp;
    updates[`chat-joins/${senderUid}/${roomId}/singleChatListOrder`] =
      senderSingleListOrder;
    updates[`chat-joins/${senderUid}/${roomId}/allChatListOrder`] =
      senderSingleListOrder;

    // 수신자의 chat-join 업데이트 (읽지 않은 상태, 200 prefix 추가)
    updates[`chat-joins/${partnerUid}/${roomId}/roomId`] = roomId;
    updates[`chat-joins/${partnerUid}/${roomId}/roomType`] = "single";
    updates[`chat-joins/${partnerUid}/${roomId}/partnerUid`] = senderUid;
    updates[`chat-joins/${partnerUid}/${roomId}/lastMessageText`] = messageText;
    updates[`chat-joins/${partnerUid}/${roomId}/lastMessageAt`] = timestamp;
    updates[`chat-joins/${partnerUid}/${roomId}/updatedAt`] = timestamp;
    updates[`chat-joins/${partnerUid}/${roomId}/singleChatListOrder`] =
      partnerSingleListOrder;
    updates[`chat-joins/${partnerUid}/${roomId}/allChatListOrder`] =
      partnerSingleListOrder;

    // 수신자의 읽지 않은 메시지 카운터 증가
    updates[`chat-joins/${partnerUid}/${roomId}/newMessageCount`] =
      admin.database.ServerValue.increment(1);

    // 모든 업데이트를 한 번에 실행
    await admin.database().ref().update(updates);

    logger.info("1:1 채팅 chat-joins 업데이트 완료", {
      messageId,
      roomId,
      senderUid,
      partnerUid,
      timestamp,
      updatesCount: Object.keys(updates).length,
    });
  } else {
    // === 그룹/오픈 채팅 처리 ===
    logger.info("그룹/오픈 채팅 메시지 처리", {messageId, roomId});

    // 채팅방 정보 조회
    const roomRef = admin.database().ref(`chat-rooms/${roomId}`);
    const roomSnapshot = await roomRef.once("value");

    if (!roomSnapshot.exists()) {
      logger.error("채팅방 정보를 찾을 수 없음", {messageId, roomId});
      return;
    }

    const roomData = roomSnapshot.val();
    const roomType = roomData.type || "group"; // 기본값: group
    const roomName = roomData.name || roomId;
    const members = roomData.members || {};

    logger.info("채팅방 정보 조회 완료", {
      messageId,
      roomId,
      roomType,
      roomName,
      memberCount: Object.keys(members).length,
    });

    // members가 없으면 처리 종료
    if (Object.keys(members).length === 0) {
      logger.warn("채팅방에 members가 없음", {messageId, roomId});
      return;
    }

    const updates: {[key: string]: unknown} = {};

    // 각 member의 기존 chat-joins 데이터를 먼저 읽기 (병렬 처리)
    const chatJoinReads = Object.keys(members).map(async (memberUid) => {
      const chatJoinRef = admin.database().ref(
        `chat-joins/${memberUid}/${roomId}`
      );
      const snapshot = await chatJoinRef.once("value");
      return {
        memberUid,
        existingData: snapshot.val() as Record<string, unknown> | null,
      };
    });

    const chatJoinResults = await Promise.all(chatJoinReads);

    logger.info("기존 chat-joins 데이터 읽기 완료", {
      messageId,
      roomId,
      memberCount: chatJoinResults.length,
    });

    // 각 member의 chat-joins 업데이트
    for (const {memberUid, existingData} of chatJoinResults) {
      const basePath = `chat-joins/${memberUid}/${roomId}`;
      const isSender = memberUid === senderUid;

      // 공통 필드
      updates[`${basePath}/roomId`] = roomId;
      updates[`${basePath}/roomType`] = roomType;
      updates[`${basePath}/roomName`] = roomName;
      updates[`${basePath}/lastMessageText`] = messageText;
      updates[`${basePath}/lastMessageAt`] = timestamp;
      updates[`${basePath}/updatedAt`] = timestamp;

      // allChatListOrder 계산 (음수 + Offset 방식)
      // - 기존 필드가 있고, pinned 상태면 유지 (핀 설정된 채팅방)
      // - 기존 필드가 있고, 발신자인 경우: -timestamp (읽음)
      // - 기존 필드가 있고, 수신자인 경우: -timestamp - UNREAD_OFFSET (읽지 않음)
      // - 기존 필드가 없는 경우: -timestamp (새로 생성)
      const existingAllChatListOrder = existingData?.allChatListOrder as
        | string
        | number
        | undefined;

      if (
        existingAllChatListOrder !== undefined &&
        extractChatStatus(Number(existingAllChatListOrder)) === "pinned"
      ) {
        // 핀 설정된 채팅방: 기존 값 유지
        updates[`${basePath}/allChatListOrder`] = existingAllChatListOrder;
      } else if (existingAllChatListOrder !== undefined) {
        // 기존 필드가 있는 경우
        updates[`${basePath}/allChatListOrder`] = toChatListOrder(
          timestamp,
          isSender ? "read" : "unread"
        );
      } else {
        // 기존 필드가 없는 경우: 새로 생성 (읽음 상태로 초기화)
        updates[`${basePath}/allChatListOrder`] = toChatListOrder(
          timestamp,
          "read"
        );
      }

      // 채팅방 타입에 따른 정렬 필드
      if (roomType === "group") {
        // 그룹 채팅인 경우
        const existingGroupListOrder = existingData?.groupChatListOrder as
          | string
          | number
          | undefined;

        if (
          existingGroupListOrder !== undefined &&
          extractChatStatus(Number(existingGroupListOrder)) === "pinned"
        ) {
          // 핀 설정된 채팅방: 기존 값 유지
          updates[`${basePath}/groupChatListOrder`] = existingGroupListOrder;
        } else if (existingGroupListOrder !== undefined) {
          // 기존 필드가 있는 경우
          updates[`${basePath}/groupChatListOrder`] = toChatListOrder(
            timestamp,
            isSender ? "read" : "unread"
          );
        } else {
          // 기존 필드가 없는 경우: 새로 생성 (읽음 상태로 초기화)
          updates[`${basePath}/groupChatListOrder`] = toChatListOrder(
            timestamp,
            "read"
          );
        }
      } else if (roomType === "open") {
        // 오픈 채팅인 경우
        const existingOpenListOrder = existingData?.openChatListOrder as
          | string
          | number
          | undefined;

        if (
          existingOpenListOrder !== undefined &&
          extractChatStatus(Number(existingOpenListOrder)) === "pinned"
        ) {
          // 핀 설정된 채팅방: 기존 값 유지
          updates[`${basePath}/openChatListOrder`] = existingOpenListOrder;
        } else if (existingOpenListOrder !== undefined) {
          // 기존 필드가 있는 경우
          updates[`${basePath}/openChatListOrder`] = toChatListOrder(
            timestamp,
            isSender ? "read" : "unread"
          );
        } else {
          // 기존 필드가 없는 경우: 새로 생성 (읽음 상태로 초기화)
          updates[`${basePath}/openChatListOrder`] = toChatListOrder(
            timestamp,
            "read"
          );
        }
      }

      // 그룹/오픈 통합 정렬 필드
      const existingOpenAndGroupListOrder =
        existingData?.openAndGroupChatListOrder as
          | string
          | number
          | undefined;

      if (
        existingOpenAndGroupListOrder !== undefined &&
        extractChatStatus(Number(existingOpenAndGroupListOrder)) === "pinned"
      ) {
        // 핀 설정된 채팅방: 기존 값 유지
        updates[`${basePath}/openAndGroupChatListOrder`] =
          existingOpenAndGroupListOrder;
      } else if (existingOpenAndGroupListOrder !== undefined) {
        // 기존 필드가 있는 경우
        updates[`${basePath}/openAndGroupChatListOrder`] = toChatListOrder(
          timestamp,
          isSender ? "read" : "unread"
        );
      } else {
        // 기존 필드가 없는 경우: 새로 생성 (읽음 상태로 초기화)
        updates[`${basePath}/openAndGroupChatListOrder`] = toChatListOrder(
          timestamp,
          "read"
        );
      }

      // newMessageCount 증가 (발신자 제외)
      if (!isSender) {
        updates[`${basePath}/newMessageCount`] =
          admin.database.ServerValue.increment(1);
      }
    }

    // 모든 업데이트를 한 번에 실행
    await admin.database().ref().update(updates);

    logger.info("그룹/오픈 채팅 chat-joins 업데이트 완료", {
      messageId,
      roomId,
      roomType,
      senderUid,
      memberCount: Object.keys(members).length,
      timestamp,
      updatesCount: Object.keys(updates).length,
    });
  }

  // ========================================
  // 푸시 알림 전송
  // ========================================
  logger.info("푸시 알림 전송 준비", {messageId, roomId, senderUid});

  try {
    // 단계 1: 발신자 이름 조회
    const senderRef = admin.database().ref(`users/${senderUid}/displayName`);
    const senderSnapshot = await senderRef.once("value");
    const senderName = senderSnapshot.exists() ?
      senderSnapshot.val() as string :
      "알 수 없음";

    logger.info("발신자 이름 조회 완료", {
      messageId,
      senderUid,
      senderName,
    });

    // 단계 2: 수신자 목록 생성 (구독 상태 확인 포함)
    let recipientUids: string[] = [];

    if (isSingleChat(roomId)) {
      // 1:1 채팅: 상대방만 수신자
      const partnerUid = getPartnerUidFromSingleRoomId(roomId, senderUid);
      if (partnerUid) {
        // 구독 상태 확인
        const isSubscribed = await isChatSubscribed(roomId, partnerUid, true);
        if (isSubscribed) {
          recipientUids = [partnerUid];
        } else {
          logger.info("수신자가 알림 구독 해제 상태", {
            messageId,
            roomId,
            partnerUid,
          });
        }
      }
    } else {
      // 그룹/오픈 채팅: 발신자를 제외한 모든 멤버 (구독 중인 멤버만)
      const roomRef = admin.database().ref(`chat-rooms/${roomId}`);
      const roomSnapshot = await roomRef.once("value");

      if (roomSnapshot.exists()) {
        const roomData = roomSnapshot.val();
        const members = roomData.members || {};

        // 발신자 제외하고 구독 중인 멤버만 필터링
        for (const uid of Object.keys(members)) {
          if (uid === senderUid) continue; // 발신자 제외

          const isSubscribed = members[uid] === true;
          if (isSubscribed) {
            recipientUids.push(uid);
          }
        }

        logger.info("그룹 채팅 수신자 목록 생성 완료 (구독 중인 멤버만)", {
          messageId,
          roomId,
          totalMembers: Object.keys(members).length,
          subscribedRecipients: recipientUids.length,
        });
      }
    }

    if (isSingleChat(roomId)) {
      logger.info("1:1 채팅 수신자 목록 생성 완료", {
        messageId,
        roomId,
        recipientCount: recipientUids.length,
      });
    }

    // 단계 3: FCM 푸시 알림 전송
    if (recipientUids.length > 0) {
      const result = await sendChatMessageNotification(
        senderName,
        messageText,
        roomId,
        recipientUids
      );

      logger.info("푸시 알림 전송 완료", {
        messageId,
        roomId,
        recipientCount: recipientUids.length,
        successCount: result.successCount,
        failureCount: result.failureCount,
        deletedTokenCount: result.deletedTokenCount,
      });
    } else {
      logger.info("수신자가 없어 푸시 알림 전송을 건너뜀", {
        messageId,
        roomId,
      });
    }
  } catch (error) {
    // 푸시 알림 전송 실패는 치명적이지 않으므로 로그만 남기고 계속 진행
    logger.error("푸시 알림 전송 중 에러 발생", {
      messageId,
      roomId,
      senderUid,
      error,
    });
  }

  // ========================================
  // 전체 채팅 메시지 통계 및 사용자별 통계 증가
  // ========================================
  await incrementActionCounter(senderUid, "chat", 1);
}
```
