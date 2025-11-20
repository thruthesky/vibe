/**
 * 채팅방 생성 시 비즈니스 로직 처리 핸들러
 *
 * 이 파일은 chat-rooms 노드에 새 채팅방이 생성될 때 트리거되는 핸들러입니다.
 */

import * as admin from "firebase-admin";
import * as logger from "firebase-functions/logger";
import {toNegativeTimestamp} from "../../../../shared/order-value.utils";

/**
 * 채팅방 생성 시 비즈니스 로직 처리
 *
 * @param roomId - 채팅방 ID
 * @param roomData - 생성된 채팅방 데이터
 * @param ownerUid - 채팅방 생성자 UID (event.authId에서 가져옴, undefined일 수 있음)
 * @returns Promise<void>
 *
 * 주요 처리 로직:
 * 1. owner 필드 확인 (클라이언트가 이미 저장했는지 확인)
 * 2. owner가 없으면 event.authId에서 설정 (fallback)
 * 3. createdAt 필드 설정 (없는 경우에만)
 * 4. members 객체 확인 (그룹/오픈 채팅만, 클라이언트가 이미 저장했으면 패스)
 * 5. memberCount 필드 설정 (members 객체의 모든 uid 개수)
 * 6. groupListOrder/openListOrder 필드 설정 (type에 따라, Cloud Functions에서만 설정)
 *
 * 데이터 구조:
 * - chat-rooms/{roomId}/owner: 채팅방 소유자 UID (클라이언트가 저장, 보안 규칙으로 제한)
 * - chat-rooms/{roomId}/createdAt: 채팅방 생성 시각 (타임스탬프)
 * - chat-rooms/{roomId}/members: 채팅방 참여자 목록 (클라이언트가 저장, 그룹/오픈 채팅만)
 * - chat-rooms/{roomId}/memberCount: 참여자 수 (그룹/오픈 채팅만)
 * - chat-rooms/{roomId}/groupListOrder: 그룹 채팅방 정렬 순서 (Cloud Functions에서만 설정)
 * - chat-rooms/{roomId}/openListOrder: 오픈 채팅방 정렬 순서 (Cloud Functions에서만 설정)
 *
 * 트리거 경로:
 * - chat-rooms/{roomId} (onCreate)
 *
 * 클라이언트 호출:
 * - ChatCreateDialog.svelte (그룹/오픈 채팅방 생성)
 *
 * 참고:
 * - 클라이언트는 5개 필드 저장:
 *   - name, description, type (필수)
 *   - owner (필수, 보안 규칙으로 자신의 UID만 가능)
 *   - members (선택, 그룹/오픈 채팅만, { uid: true } 형태)
 * - Cloud Functions는 나머지 필드 자동 설정 (createdAt, memberCount, groupListOrder/openListOrder)
 */
export async function handleChatRoomCreate(
  roomId: string,
  roomData: Record<string, unknown>,
  ownerUid: string | undefined
): Promise<void> {
  logger.info("채팅방 생성 처리 시작", {
    roomId,
    ownerUid,
    roomType: roomData.type,
  });

  // 단계 1: owner 필드 확인 (클라이언트가 이미 저장했는지 확인)
  const ownerRef = admin.database().ref(`chat-rooms/${roomId}/owner`);
  const ownerSnapshot = await ownerRef.once("value");

  let finalOwnerUid: string;

  if (ownerSnapshot.exists()) {
    // 클라이언트가 이미 owner를 저장함
    finalOwnerUid = ownerSnapshot.val() as string;
    logger.info("owner 필드가 클라이언트에 의해 이미 설정됨", {
      roomId,
      owner: finalOwnerUid,
    });
  } else if (ownerUid && ownerUid.trim().length > 0) {
    // event.authId가 있으면 사용 (fallback)
    finalOwnerUid = ownerUid;
    logger.info("owner 필드를 event.authId로 설정", {
      roomId,
      owner: finalOwnerUid,
    });
  } else {
    // owner가 없고 event.authId도 없으면 에러
    logger.error("owner를 확인할 수 없음 (클라이언트도, event.authId도 없음)", {
      roomId,
    });
    throw new Error(
      "채팅방 owner를 확인할 수 없습니다 (인증된 사용자만 가능)"
    );
  }

  const timestamp = Date.now();
  const updates: {[key: string]: unknown} = {};

  // owner 필드 설정 (없는 경우에만)
  if (!ownerSnapshot.exists()) {
    updates[`chat-rooms/${roomId}/owner`] = finalOwnerUid;
  }

  // 단계 3: createdAt 필드 확인 및 설정
  const createdAtRef = admin.database().ref(
    `chat-rooms/${roomId}/createdAt`
  );
  const createdAtSnapshot = await createdAtRef.once("value");

  if (!createdAtSnapshot.exists()) {
    updates[`chat-rooms/${roomId}/createdAt`] = timestamp;
    logger.info("createdAt 필드 생성", {roomId, createdAt: timestamp});
  }

  // 단계 4: members 객체 확인 (그룹/오픈 채팅만)
  // 클라이언트가 이미 저장했으면 패스
  const roomType = roomData.type as string;
  if (roomType === "group" || roomType === "open") {
    const membersRef = admin.database().ref(
      `chat-rooms/${roomId}/members`
    );
    const membersSnapshot = await membersRef.once("value");

    if (!membersSnapshot.exists()) {
      // members 객체가 없으면 owner를 true로 추가
      const membersData: Record<string, boolean> = {};
      membersData[finalOwnerUid] = true;
      updates[`chat-rooms/${roomId}/members`] = membersData;
      logger.info("members 필드 생성 (클라이언트가 저장하지 않음)", {
        roomId,
        members: membersData,
      });
    } else {
      // 클라이언트가 이미 members를 저장함
      logger.info("members 필드가 클라이언트에 의해 이미 설정됨", {
        roomId,
        members: membersSnapshot.val(),
      });
    }

    // memberCount는 members 객체의 모든 uid 개수 (true/false 구분 없이)
    const memberCountRef = admin.database().ref(
      `chat-rooms/${roomId}/memberCount`
    );
    const memberCountSnapshot = await memberCountRef.once("value");

    if (!memberCountSnapshot.exists()) {
      // members가 새로 생성되면 1, 기존에 있으면 모든 uid 개수
      let totalCount = 1;
      if (membersSnapshot.exists()) {
        const membersData = membersSnapshot.val() as Record<string, boolean>;
        totalCount = Object.keys(membersData).length;
      }
      updates[`chat-rooms/${roomId}/memberCount`] = totalCount;
      logger.info("memberCount 필드 생성", {
        roomId,
        memberCount: totalCount,
      });
    }

    // 단계 5: groupListOrder/openListOrder 필드 설정 (type에 따라)
    // 최신순 정렬을 위해 음수 타임스탬프 사용
    const listOrder = toNegativeTimestamp(timestamp);

    if (roomType === "group") {
      const groupListOrderRef = admin.database().ref(
        `chat-rooms/${roomId}/groupListOrder`
      );
      const groupListOrderSnapshot = await groupListOrderRef.once("value");

      if (!groupListOrderSnapshot.exists()) {
        updates[`chat-rooms/${roomId}/groupListOrder`] = listOrder;
        logger.info("groupListOrder 필드 생성", {
          roomId,
          groupListOrder: listOrder,
        });
      }
    } else if (roomType === "open") {
      const openListOrderRef = admin.database().ref(
        `chat-rooms/${roomId}/openListOrder`
      );
      const openListOrderSnapshot = await openListOrderRef.once("value");

      if (!openListOrderSnapshot.exists()) {
        updates[`chat-rooms/${roomId}/openListOrder`] = listOrder;
        logger.info("openListOrder 필드 생성", {
          roomId,
          openListOrder: listOrder,
        });
      }
    }
  }

  // 단계 6: 모든 업데이트를 한 번에 실행
  if (Object.keys(updates).length > 0) {
    await admin.database().ref().update(updates);
    logger.info("채팅방 필드 설정 완료", {
      roomId,
      owner: finalOwnerUid,
      createdAt: timestamp,
      roomType: roomData.type,
      updatesCount: Object.keys(updates).length,
    });
  }
}
