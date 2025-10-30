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
 * 그룹 채팅방 정보 인터페이스
 * ⚠️ 주의: 1:1 채팅에서는 사용하지 않음 (그룹 채팅 전용)
 */
export interface ChatRoom {
  roomId: string;
  users: string[];
  createdAt: number;
  lastMessage?: string;
  lastMessageTime?: number;
}

/**
 * 채팅방 참여 정보 인터페이스 (chat/joins)
 * 1:1 채팅과 그룹 채팅 모두에서 사용
 */
export interface ChatJoin {
  roomId: string;
  createdAt: number;
  lastMessage?: string;
  lastMessageSentAt?: number;
  order?: number;
  singleOrder?: number;
  groupOrder?: number;
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
 * 1:1 채팅방 ID를 생성하고 반환합니다.
 * ⚠️ 주의: 1:1 채팅은 chat/rooms에 저장하지 않습니다.
 * Firebase Cloud Functions가 첫 메시지 전송 시 chat/joins에 자동으로 생성합니다.
 *
 * @param uid1 - 첫 번째 사용자 ID
 * @param uid2 - 두 번째 사용자 ID
 * @returns 생성된 채팅방 ID
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

    // 1:1 채팅방 ID 생성 (chat/rooms에 저장하지 않음)
    const roomId = generateRoomId(uid1, uid2);

    return {
      success: true,
      roomId,
    };
  } catch (error: any) {
    console.error("채팅방 ID 생성 실패:", error);
    return {
      success: false,
      error: error.message || "채팅방 ID 생성에 실패했습니다.",
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

    // ⚠️ 주의: chat/joins의 lastMessage, order 등은 Firebase Cloud Functions가 자동으로 업데이트합니다.
    // 클라이언트에서 직접 업데이트하지 않습니다.

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
 * 조회 위치: /{ROOT_FOLDER}/chat/joins/<uid>
 * ⚠️ 주의: 1:1 채팅과 그룹 채팅 모두 chat/joins에서 조회합니다.
 *
 * @param uid - 사용자 ID
 * @returns 사용자가 참여 중인 채팅방 배열
 */
export async function getUserChatRooms(uid: string): Promise<ChatJoin[]> {
  try {
    if (!uid) {
      return [];
    }

    const joinsRef = ref(rtdb, `${ROOT_FOLDER}/chat/joins/${uid}`);
    const snapshot = await get(joinsRef);

    if (snapshot.exists()) {
      const joinsObj = snapshot.val();
      const userRooms: ChatJoin[] = [];

      // chat/joins 하위의 모든 채팅방 가져오기
      Object.entries(joinsObj).forEach(([roomId, join]: [string, any]) => {
        userRooms.push({
          roomId,
          ...join,
        });
      });

      // order 필드 기준으로 정렬 (최신순)
      // order가 없으면 createdAt 기준으로 정렬
      userRooms.sort(
        (a, b) => (b.order || b.createdAt || 0) - (a.order || a.createdAt || 0)
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
 * 그룹 채팅방 정보를 조회합니다.
 * 조회 위치: /{ROOT_FOLDER}/chat/rooms/<room-id>
 * ⚠️ 주의: 그룹 채팅 전용 함수입니다. 1:1 채팅에서는 사용하지 않습니다.
 *
 * @param roomId - 채팅방 ID
 * @returns 그룹 채팅방 정보 또는 null
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
    console.error("그룹 채팅방 정보 조회 실패:", error);
    return null;
  }
}
