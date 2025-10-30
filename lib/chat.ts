// Firebase Realtime Database (RTDB)를 사용한 채팅 기능 함수들

import { rtdb } from "./firebase";
import { ref, set, get, push, onValue, Unsubscribe } from "firebase/database";
import { ROOT_FOLDER, ROOM_SEPARATOR } from "@/app/app.config";

/**
 * 채팅 메시지 인터페이스
 */
export interface ChatMessage {
  sender: string;
  senderName: string;
  text: string;
  timestamp: number;
  messageId?: string;
}

/**
 * 채팅방 정보 인터페이스
 */
export interface ChatRoom {
  roomId: string;
  users: string[];
  createdAt: number;
  lastMessage?: string;
  lastMessageTime?: number;
}

/**
 * 두 사용자 간 채팅방 ID를 생성합니다.
 * 형식: uid1---uid2 (알파벳 순서로 정렬, --- 구분자 사용)
 *
 * @param uid1 - 첫 번째 사용자 ID
 * @param uid2 - 두 번째 사용자 ID
 * @returns 생성된 채팅방 ID (예: "user123---user456")
 */
export function generateRoomId(uid1: string, uid2: string): string {
  const ids = [uid1, uid2].sort();
  return `${ids[0]}${ROOM_SEPARATOR}${ids[1]}`;
}

/**
 * 채팅방을 생성합니다.
 * 저장 위치: /{ROOT_FOLDER}/chat/rooms/<room-id>
 *
 * @param uid1 - 첫 번째 사용자 ID
 * @param uid2 - 두 번째 사용자 ID
 * @returns 생성된 채팅방 정보 또는 오류
 */
export async function createChatRoom(
  uid1: string,
  uid2: string
): Promise<{ success: boolean; roomId?: string; error?: string }> {
  try {
    if (!uid1 || !uid2) {
      return {
        success: false,
        error: "사용자 ID가 필요합니다.",
      };
    }

    const roomId = generateRoomId(uid1, uid2);
    const roomRef = ref(rtdb, `${ROOT_FOLDER}/chat/rooms/${roomId}`);

    // 기존 채팅방이 있는지 확인
    const snapshot = await get(roomRef);
    if (snapshot.exists()) {
      // 기존 채팅방이 있으면 반환
      return {
        success: true,
        roomId,
      };
    }

    // 새 채팅방 생성
    const newRoom = {
      roomId,
      users: [uid1, uid2].sort(),
      createdAt: Date.now(),
    };

    await set(roomRef, newRoom);

    return {
      success: true,
      roomId,
    };
  } catch (error: any) {
    console.error("채팅방 생성 실패:", error);
    return {
      success: false,
      error: error.message || "채팅방 생성에 실패했습니다.",
    };
  }
}

/**
 * 채팅 메시지를 전송하고 저장합니다.
 * 저장 위치: /{ROOT_FOLDER}/chat/messages/<room-id>/<message-id>
 *
 * @param roomId - 채팅방 ID
 * @param sender - 발신자 UID
 * @param senderName - 발신자 이름
 * @param text - 메시지 내용
 * @returns 전송 성공 여부
 */
export async function sendMessage(
  roomId: string,
  sender: string,
  senderName: string,
  text: string
): Promise<{ success: boolean; messageId?: string; error?: string }> {
  try {
    if (!roomId || !sender || !text.trim()) {
      return {
        success: false,
        error: "필수 정보가 부족합니다.",
      };
    }

    // 메시지 저장
    const messagesRef = ref(rtdb, `${ROOT_FOLDER}/chat/messages/${roomId}`);
    const newMessageRef = push(messagesRef);

    const message: ChatMessage = {
      sender,
      senderName,
      text: text.trim(),
      timestamp: Date.now(),
      messageId: newMessageRef.key || "",
    };

    await set(newMessageRef, message);

    // 채팅방의 마지막 메시지 정보 업데이트
    const roomRef = ref(rtdb, `${ROOT_FOLDER}/chat/rooms/${roomId}`);
    const roomSnapshot = await get(roomRef);
    if (roomSnapshot.exists()) {
      const roomData = roomSnapshot.val();
      await set(roomRef, {
        ...roomData,
        lastMessage: text.trim(),
        lastMessageTime: Date.now(),
      });
    }

    return {
      success: true,
      messageId: newMessageRef.key || "",
    };
  } catch (error: any) {
    console.error("메시지 전송 실패:", error);
    return {
      success: false,
      error: error.message || "메시지 전송에 실패했습니다.",
    };
  }
}

/**
 * 채팅방의 모든 메시지를 조회합니다.
 * 조회 위치: /{ROOT_FOLDER}/chat/messages/<room-id>
 *
 * @param roomId - 채팅방 ID
 * @returns 메시지 배열 또는 null
 */
export async function getMessages(roomId: string): Promise<ChatMessage[]> {
  try {
    if (!roomId) {
      return [];
    }

    const messagesRef = ref(rtdb, `${ROOT_FOLDER}/chat/messages/${roomId}`);
    const snapshot = await get(messagesRef);

    if (snapshot.exists()) {
      const messagesObj = snapshot.val();
      const messages: ChatMessage[] = [];

      // 객체를 배열로 변환하고 타임스탬프 기준으로 정렬
      Object.entries(messagesObj).forEach(([key, value]: [string, any]) => {
        messages.push({
          ...value,
          messageId: key,
        });
      });

      // 타임스탬프 기준으로 오래된 순서대로 정렬
      messages.sort((a, b) => a.timestamp - b.timestamp);

      return messages;
    }

    return [];
  } catch (error: any) {
    console.error("메시지 조회 실패:", error);
    return [];
  }
}

/**
 * 채팅방의 메시지를 실시간으로 구독합니다.
 * 조회 위치: /{ROOT_FOLDER}/chat/messages/<room-id>
 *
 * @param roomId - 채팅방 ID
 * @param callback - 메시지 변경 시 호출할 콜백 함수
 * @returns 구독 해제 함수
 */
export function subscribeToMessages(
  roomId: string,
  callback: (messages: ChatMessage[]) => void
): Unsubscribe | null {
  try {
    if (!roomId) {
      return null;
    }

    const messagesRef = ref(rtdb, `${ROOT_FOLDER}/chat/messages/${roomId}`);

    const unsubscribe = onValue(
      messagesRef,
      (snapshot) => {
        if (snapshot.exists()) {
          const messagesObj = snapshot.val();
          const messages: ChatMessage[] = [];

          Object.entries(messagesObj).forEach(([key, value]: [string, any]) => {
            messages.push({
              ...value,
              messageId: key,
            });
          });

          // 타임스탬프 기준으로 정렬
          messages.sort((a, b) => a.timestamp - b.timestamp);
          callback(messages);
        } else {
          callback([]);
        }
      },
      (error) => {
        console.error("메시지 구독 실패:", error);
      }
    );

    return unsubscribe;
  } catch (error: any) {
    console.error("메시지 구독 설정 실패:", error);
    return null;
  }
}

/**
 * 사용자의 채팅방 목록을 조회합니다.
 * 조회 위치: /{ROOT_FOLDER}/chat/rooms
 *
 * @param uid - 사용자 ID
 * @returns 사용자가 참여 중인 채팅방 배열
 */
export async function getUserChatRooms(uid: string): Promise<ChatRoom[]> {
  try {
    if (!uid) {
      return [];
    }

    const roomsRef = ref(rtdb, `${ROOT_FOLDER}/chat/rooms`);
    const snapshot = await get(roomsRef);

    if (snapshot.exists()) {
      const roomsObj = snapshot.val();
      const userRooms: ChatRoom[] = [];

      // 사용자가 참여 중인 채팅방만 필터링
      Object.entries(roomsObj).forEach(([roomId, room]: [string, any]) => {
        if (room.users && room.users.includes(uid)) {
          userRooms.push({
            roomId,
            ...room,
          });
        }
      });

      // 마지막 메시지 시간 기준으로 정렬 (최신순)
      userRooms.sort(
        (a, b) => (b.lastMessageTime || 0) - (a.lastMessageTime || 0)
      );

      return userRooms;
    }

    return [];
  } catch (error: any) {
    console.error("사용자 채팅방 조회 실패:", error);
    return [];
  }
}

/**
 * 채팅방 정보를 조회합니다.
 * 조회 위치: /{ROOT_FOLDER}/chat/rooms/<room-id>
 *
 * @param roomId - 채팅방 ID
 * @returns 채팅방 정보 또는 null
 */
export async function getChatRoom(
  roomId: string
): Promise<ChatRoom | null> {
  try {
    if (!roomId) {
      return null;
    }

    const roomRef = ref(rtdb, `${ROOT_FOLDER}/chat/rooms/${roomId}`);
    const snapshot = await get(roomRef);

    if (snapshot.exists()) {
      return {
        roomId,
        ...snapshot.val(),
      };
    }

    return null;
  } catch (error: any) {
    console.error("채팅방 정보 조회 실패:", error);
    return null;
  }
}
