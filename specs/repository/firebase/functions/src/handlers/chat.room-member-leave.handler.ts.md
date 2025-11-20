---
title: chat.room-member-leave.handler.ts - TypeScript 소스 코드
original_path: firebase/functions/src/handlers/chat.room-member-leave.handler.ts
category: cloud-function
file_type: ts
status: current
last_updated: 2025-11-20
---

# chat.room-member-leave.handler.ts

## 개요

**원본 경로**: `firebase/functions/src/handlers/chat.room-member-leave.handler.ts`

**파일 유형**: TypeScript 소스 코드

## 소스 코드

```typescript
/**
 * 채팅방 멤버 퇴장 시 비즈니스 로직 처리 핸들러
 *
 * 이 파일은 chat-rooms/{roomId}/members/{uid} 노드에서 멤버가 삭제될 때 트리거되는 핸들러입니다.
 */

import * as admin from "firebase-admin";
import * as logger from "firebase-functions/logger";

/**
 * 채팅방 멤버 퇴장 시 비즈니스 로직 처리
 *
 * @param roomId - 채팅방 ID
 * @param uid - 퇴장한 사용자 UID
 * @returns Promise<void>
 *
 * 주요 처리 로직:
 * 1. chat-rooms/{roomId}/members 아래의 모든 uid 읽기
 * 2. 모든 uid의 개수 세기 (true/false 구분 없이)
 * 3. memberCount 필드를 감소시킴
 * 4. chat-joins/{uid}/{roomId} 노드 삭제
 *
 * 데이터 구조:
 * - chat-rooms/{roomId}/members: 채팅방 참여자 목록
 * - chat-rooms/{roomId}/memberCount: 전체 멤버 수
 * - chat-joins/{uid}/{roomId}: 사용자별 채팅방 참여 정보 (삭제됨)
 *
 * 트리거 경로:
 * - chat-rooms/{roomId}/members/{uid} (onValueDeleted)
 *
 * 클라이언트 호출:
 * - chat.functions.ts: leaveChatRoom() (채팅방 퇴장)
 *
 * 참고:
 * - members 필드에서 uid가 삭제되면 퇴장으로 간주
 * - onValueDeleted 트리거로 멤버 퇴장 감지
 */
export async function handleChatRoomMemberLeave(
  roomId: string,
  uid: string
): Promise<void> {
  logger.info("채팅방 멤버 퇴장 처리 시작", {
    roomId,
    uid,
  });

  // 단계 1: members 필드 읽기
  const membersRef = admin.database().ref(`chat-rooms/${roomId}/members`);
  const membersSnapshot = await membersRef.once("value");

  if (!membersSnapshot.exists()) {
    logger.info("members 필드가 없음, memberCount를 0으로 설정", {
      roomId,
    });
    await admin.database().ref(`chat-rooms/${roomId}/memberCount`).set(0);
    return;
  }

  // 단계 2: 모든 uid 개수 세기 (true/false 구분 없이)
  const membersData = membersSnapshot.val() as Record<string, boolean>;
  const totalMemberCount = Object.keys(membersData).length;

  logger.info("멤버 퇴장 후 참여자 수 계산 완료", {
    roomId,
    uid,
    memberCount: totalMemberCount,
  });

  // 단계 3: memberCount 업데이트
  await admin
    .database()
    .ref(`chat-rooms/${roomId}/memberCount`)
    .set(totalMemberCount);

  logger.info("memberCount 업데이트 완료 (멤버 퇴장)", {
    roomId,
    uid,
    memberCount: totalMemberCount,
  });

  // 단계 4: chat-joins 노드 삭제
  const chatJoinRef = admin.database().ref(`chat-joins/${uid}/${roomId}`);
  await chatJoinRef.remove();

  logger.info("chat-joins 노드 삭제 완료", {
    roomId,
    uid,
  });
}
```
