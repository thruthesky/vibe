---
title: chat.invitation-create.handler.ts - TypeScript 소스 코드
original_path: firebase/functions/src/handlers/chat.invitation-create.handler.ts
category: cloud-function
file_type: ts
status: current
last_updated: 2025-11-20
---

# chat.invitation-create.handler.ts

## 개요

**원본 경로**: `firebase/functions/src/handlers/chat.invitation-create.handler.ts`

**파일 유형**: TypeScript 소스 코드

## 소스 코드

```typescript
/**
 * 채팅 초대장 생성 시 비즈니스 로직 처리 핸들러
 *
 * 이 파일은 chat-invitations/{inviteeUid}/{roomId} 노드에 초대장이 생성될 때 트리거되는 핸들러입니다.
 */

import * as admin from "firebase-admin";
import * as logger from "firebase-functions/logger";
import {isSingleChat} from "../../../../shared/chat.pure-functions";

/**
 * 채팅 초대장 생성 시 비즈니스 로직 처리
 *
 * @param inviteeUid - 초대받은 사용자 UID
 * @param roomId - 채팅방 ID
 * @param invitationData - 초대장 데이터 (클라이언트가 생성한 최소 정보)
 * @returns Promise<{success: boolean; inviteeUid: string; roomId: string}>
 *
 * 주요 처리 로직:
 * 1. 채팅방 정보 조회 (roomName, roomType)
 * 2. 초대한 사람 정보 조회 (displayName)
 * 3. 초대받은 사람의 언어 코드 조회
 * 4. 초대 메시지 생성 (i18n 사용, 언어별)
 * 5. 초대장 정보 업데이트 (createdAt, invitationOrder, roomName, roomType, inviterName, message)
 * 6. FCM 푸시 알림 전송 (초대받은 사람의 언어로)
 *
 * 데이터 구조:
 * - chat-invitations/{inviteeUid}/{roomId}/roomId: 채팅방 ID (클라이언트 제공)
 * - chat-invitations/{inviteeUid}/{roomId}/inviterUid: 초대한 사람 UID (클라이언트 제공)
 * - chat-invitations/{inviteeUid}/{roomId}/createdAt: 초대 생성 시간 (서버 추가)
 * - chat-invitations/{inviteeUid}/{roomId}/invitationOrder: 정렬 순서 (서버 추가)
 * - chat-invitations/{inviteeUid}/{roomId}/roomName: 채팅방 이름 (서버 추가)
 * - chat-invitations/{inviteeUid}/{roomId}/roomType: 채팅방 타입 (서버 추가)
 * - chat-invitations/{inviteeUid}/{roomId}/inviterName: 초대한 사람 이름 (서버 추가)
 * - chat-invitations/{inviteeUid}/{roomId}/message: 초대 메시지 (서버 추가, i18n)
 *
 * 트리거 경로:
 * - chat-invitations/{inviteeUid}/{roomId} (onCreate)
 *
 * 클라이언트 호출:
 * - chat.functions.ts: inviteUserToChatRoom() (채팅방 초대)
 *
 * 참고:
 * - 클라이언트는 최소한의 정보만 저장 (roomId, inviterUid)
 * - Cloud Functions가 나머지 정보를 자동으로 채움 (createdAt, invitationOrder, roomName, roomType, inviterName, message)
 * - 이미 참여 중인 멤버인지 검증 (그룹/오픈 채팅방만)
 */
export async function handleChatInvitationCreate(
  inviteeUid: string,
  roomId: string,
  invitationData: {inviterUid?: string}
): Promise<{success: boolean; inviteeUid: string; roomId: string}> {
  logger.info("채팅 초대장 생성 처리 시작", {
    inviteeUid,
    roomId,
    inviterUid: invitationData.inviterUid,
  });

  // 필수 필드 검증
  if (!invitationData.inviterUid) {
    logger.error("inviterUid 필드가 없음", {inviteeUid, roomId});
    throw new Error("inviterUid는 필수이지만 정의되지 않았습니다");
  }

  const inviterUid = invitationData.inviterUid;
  const updates: Record<string, unknown> = {};

  // 1. 채팅방 정보 조회
  const roomRef = admin.database().ref(`chat-rooms/${roomId}`);
  const roomSnapshot = await roomRef.once("value");

  if (!roomSnapshot.exists()) {
    logger.error("채팅방을 찾을 수 없음", {roomId});
    throw new Error(`채팅방을 찾을 수 없습니다: ${roomId}`);
  }

  const roomData = roomSnapshot.val() as {
    name?: string;
    type?: string;
    members?: Record<string, boolean>;
  };

  const roomName = roomData.name || "채팅방";
  const roomType = roomData.type as "group" | "open" | undefined;

  logger.info("채팅방 정보 조회 완료", {
    roomId,
    roomName,
    roomType,
  });

  // 1:1 채팅방에 대한 초대는 허용하지 않음
  if (isSingleChat(roomId)) {
    logger.warn("1:1 채팅방에 대한 초대 시도, 무시함", {
      roomId,
      inviterUid,
      inviteeUid,
    });
    return {success: false, inviteeUid, roomId};
  }

  // 이미 참여 중인 멤버인지 확인
  if (roomData.members && roomData.members[inviteeUid] === true) {
    logger.warn("이미 참여 중인 멤버에게 초대 시도, 무시함", {
      roomId,
      inviteeUid,
    });
    return {success: false, inviteeUid, roomId};
  }

  // 2. 초대한 사람 정보 조회
  const inviterRef = admin.database().ref(`users/${inviterUid}`);
  const inviterSnapshot = await inviterRef.once("value");
  const inviterData = inviterSnapshot.val() as {
    displayName?: string;
  } | null;

  const inviterName = inviterData?.displayName || "사용자";

  logger.info("초대한 사람 정보 조회 완료", {
    inviterUid,
    inviterName,
  });

  // 3. 초대받은 사람의 언어 코드 조회
  const inviteeRef = admin.database().ref(`users/${inviteeUid}`);
  const inviteeSnapshot = await inviteeRef.once("value");
  const inviteeData = inviteeSnapshot.val() as {
    languageCode?: string;
  } | null;

  const languageCode = inviteeData?.languageCode || "en";

  logger.info("초대받은 사람 언어 코드 조회 완료", {
    inviteeUid,
    languageCode,
  });

  // 4. 초대 메시지 생성 (i18n 사용)
  // i18n.ts의 t() 함수 임포트 필요
  const {t} = await import("../i18n");

  const message = t(languageCode, "chatInvitation.message", {
    inviterName,
    roomName,
  });

  logger.info("초대 메시지 생성 완료", {
    languageCode,
    message,
  });

  // 5. 초대장 정보 업데이트
  // 서버 타임스탬프 생성
  const now = Date.now();

  // createdAt과 invitationOrder 추가
  updates[`chat-invitations/${inviteeUid}/${roomId}/createdAt`] = now;
  updates[`chat-invitations/${inviteeUid}/${roomId}/invitationOrder`] = `-${now}`;

  // 나머지 필드 추가
  updates[`chat-invitations/${inviteeUid}/${roomId}/roomName`] = roomName;
  updates[`chat-invitations/${inviteeUid}/${roomId}/roomType`] = roomType;
  updates[`chat-invitations/${inviteeUid}/${roomId}/inviterName`] = inviterName;
  updates[`chat-invitations/${inviteeUid}/${roomId}/message`] = message;

  await admin.database().ref().update(updates);

  logger.info("초대장 정보 업데이트 완료", {
    inviteeUid,
    roomId,
    updatesCount: Object.keys(updates).length,
  });

  // 6. FCM 푸시 알림 전송
  try {
    const {getFcmTokensByUid, sendFcmNotificationBatch} = await import(
      "../utils/fcm.utils"
    );

    // 초대받은 사람의 FCM 토큰 조회
    const tokens = await getFcmTokensByUid(inviteeUid);

    if (tokens.length > 0) {
      // 푸시 알림 제목과 본문 (i18n 사용)
      const notificationTitle = t(languageCode, "chatInvitation.title");
      const notificationBody = t(languageCode, "chatInvitation.body", {
        inviterName,
        roomName,
      });

      logger.info("FCM 푸시 알림 전송 시작", {
        inviteeUid,
        tokenCount: tokens.length,
        title: notificationTitle,
        body: notificationBody,
      });

      const fcmResult = await sendFcmNotificationBatch(
        tokens,
        notificationTitle,
        notificationBody,
        {
          type: "chat-invitation",
          roomId,
          inviterUid,
          inviterName,
        }
      );

      logger.info("FCM 푸시 알림 전송 완료", {
        inviteeUid,
        roomId,
        successCount: fcmResult.successCount,
        failureCount: fcmResult.failureCount,
        deletedTokenCount: fcmResult.deletedTokenCount,
      });
    } else {
      logger.info("FCM 토큰이 없어 푸시 알림 전송을 건너뜀", {
        inviteeUid,
      });
    }
  } catch (fcmError) {
    logger.error("FCM 푸시 알림 전송 실패 (계속 진행)", {
      inviteeUid,
      roomId,
      error: fcmError,
    });
    // FCM 실패는 무시하고 계속 진행
  }

  logger.info("채팅 초대장 생성 처리 완료", {
    inviteeUid,
    roomId,
  });

  return {success: true, inviteeUid, roomId};
}
```
