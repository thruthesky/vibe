import * as admin from "firebase-admin";
import type {
  CreateChatMessageParams,
  UpdateInterface,
} from "./chat.interfaces";
import { getUser } from "./user.functions";

import {
  FCM_SUBSCRIPTIONS_PATH,
  MESSAGE_CHUNK_SIZE,
  MESSAGE_DRY_RUN,
  ROOM_SEPARATOR,
  ROOT_FOLDER,
  UID,
} from "./firebase.config";

import { FCM_TOKENS_PATH } from "./firebase.config";
import {
  getMessaging,
  Notification,
  SendResponse,
} from "firebase-admin/messaging";

import {
  SendEachMessage,
  MessageRequest,
  SendMessageToSubscription,
  SendMessageToUidsRequest,
} from "./chat.interfaces";

/**
 * Handles chat message creation logic for single (1:1) chats.
 *
 * **For Single (1:1) Chats:**
 * - No room data required (room doesn't exist in /chat/rooms)
 * - Directly updates chat joins for both users at /chat/joins/{uid}/{roomId}
 * - Updates user display information (nickname, photoUrl)
 * - Updates ordering fields (order, singleOrder)
 * - Manages unread counts (0 for sender, increment for receiver)
 * - Uses special timestamp prefix (20-prefix) for recipient ordering
 *
 * **Common Features:**
 * - Protocol message filtering (skips system messages like join/leave)
 * - Error saving pattern (saves errors to database before throwing)
 * - Batch updates for efficiency
 * - Last message information with text and first image URL
 *
 * @param {string} roomId - The chat room ID (format: "uid1---uid2" for single chat)
 * @param {string} messageId - The message ID
 * @param {CreateChatMessageParams} messageData - The message data
 * @return {Promise<void>}
 * @throws Error if validation fails or database operation fails
 *
 * @example
 * ```typescript
 * // Single chat example
 * await updateOnMessageCreatedForSingleChat("user1---user2", "msg-456", {
 *   id: "msg-456",
 *   text: "Hello",
 *   senderUid: "user1",
 *   createdAt: Date.now()
 * });
 * ```
 *
 * @see docs/chat/chat-logic.md#message-creation-flow
 */
export async function updateOnMessageCreatedForSingleChat(
  roomId: string,
  messageId: string,
  messageData: CreateChatMessageParams
): Promise<void> {
  try {
    // For single chat: No room data required, just update chat joins directly
    console.log(`Processing single chat message in room ${roomId}`);

    // Extract both user UIDs from the room ID (format: "uid1---uid2")
    const senderUid = messageData.senderUid;
    const receiverUid = getOtherUserUidFromRoomId(roomId, senderUid);
    if (receiverUid === null) {
      throw new Error(
        `Invalid single chat roomId ${roomId} for senderUid ${senderUid}`
      );
    }

    const now = Date.now();

    // Step 1: Add sentAt to the message (client only sends text and senderUid)
    const messageUpdates: UpdateInterface = {};
    messageUpdates[messagePath(roomId, messageId, "sentAt")] = now;
    await admin.database().ref().update(messageUpdates);
    console.log(
      `[updateOnMessageCreatedForSingleChat] ✓ sentAt added to message ${messageId}`
    );

    // Step 2: /users/<uid>에서 두 사용자의 displayName을 조회합니다
    const [senderUserData, receiverUserData] = await Promise.all([
      getUser(senderUid),
      getUser(receiverUid),
    ]);

    const senderDisplayName = senderUserData?.displayName || "사용자";
    const receiverDisplayName = receiverUserData?.displayName || "사용자";

    // Step 3: 정렬을 위해 "10" 접두사가 있는 타임스탐프를 준비합니다
    // "10" 접두사를 붙이면 새 메시지가 채팅 목록의 맨 위에 표시됩니다
    const orderTimestamp = parseInt("10" + now);

    // Step 4: 두 사용자의 chat joins를 업데이트합니다
    const joinUpdates: UpdateInterface = {};

    // 수신자(메시지를 받는 사람)를 위한 업데이트
    joinUpdates[joinPath(receiverUid, roomId, "id")] = roomId;
    joinUpdates[joinPath(receiverUid, roomId, "text")] = messageData.text || "";
    joinUpdates[joinPath(receiverUid, roomId, "sentAt")] = now;
    joinUpdates[joinPath(receiverUid, roomId, "senderUid")] = senderUid;
    joinUpdates[joinPath(receiverUid, roomId, "otherName")] = senderDisplayName;
    joinUpdates[joinPath(receiverUid, roomId, "otherNameLowerCase")] = senderDisplayName.toLowerCase();
    joinUpdates[joinPath(receiverUid, roomId, "order")] = orderTimestamp;
    joinUpdates[joinPath(receiverUid, roomId, "singleOrder")] = orderTimestamp;

    // 발신자(메시지를 보낸 사람)를 위한 업데이트
    joinUpdates[joinPath(senderUid, roomId, "id")] = roomId;
    joinUpdates[joinPath(senderUid, roomId, "text")] = messageData.text || "";
    joinUpdates[joinPath(senderUid, roomId, "sentAt")] = now;
    joinUpdates[joinPath(senderUid, roomId, "senderUid")] = senderUid;
    joinUpdates[joinPath(senderUid, roomId, "otherName")] = receiverDisplayName;
    joinUpdates[joinPath(senderUid, roomId, "otherNameLowerCase")] = receiverDisplayName.toLowerCase();
    joinUpdates[joinPath(senderUid, roomId, "order")] = orderTimestamp;
    joinUpdates[joinPath(senderUid, roomId, "singleOrder")] = orderTimestamp;

    // Step 5: 읽지 않은 메시지 수 관리
    // 수신자: 읽지 않은 메시지 수 증가
    // 발신자: 0으로 초기화
    joinUpdates[joinPath(receiverUid, roomId, "unread")] =
      admin.database.ServerValue.increment(1);
    joinUpdates[joinPath(senderUid, roomId, "unread")] = 0;

    // 성능 최적화를 위해 join-props에 읽지 않은 메시지 수를 저장합니다
    // 중요: roomId를 키로 사용합니다 (otherUid가 아닌)
    joinUpdates[joinPropsPath(receiverUid, "unread", roomId)] =
      admin.database.ServerValue.increment(1);
    joinUpdates[joinPropsPath(senderUid, "unread", roomId)] = 0;

    // 일괄 업데이트 실행
    console.log(
      `[updateOnMessageCreatedForSingleChat] 채팅방 ${roomId}에 대한 일괄 업데이트 실행 중`
    );
    console.log(
      "[updateOnMessageCreatedForSingleChat] 업데이트 경로:",
      Object.keys(joinUpdates)
    );
    await admin.database().ref().update(joinUpdates);
    console.log(
      "[updateOnMessageCreatedForSingleChat] ✓ 1:1 채팅 joins가 성공적으로 업데이트되었습니다"
    );

    // 사용자의 전체 읽지 않은 메시지 수 업데이트
    console.log(
      `[updateOnMessageCreatedForSingleChat] 발신자:${senderUid}, 수신자:${receiverUid}에 대해 updateUsersUnreadCount 호출 중`
    );
    await updateUsersUnreadCount([senderUid, receiverUid]);
    console.log(
      "[updateOnMessageCreatedForSingleChat] ✓ 사용자 읽지 않은 메시지 수가 성공적으로 업데이트되었습니다"
    );

    // Step 6: 수신자에게 알림 전송
    console.log(`사용자 ${receiverUid}에게 알림 전송 중`);
    if (receiverUid && receiverUid !== senderUid) {
      await sendNotificationToUids({
        uids: [receiverUid],
        title: senderDisplayName || "챗 메시지",
        body: messageData.text || "",
        data: {
          roomId: roomId,
          messageId: messageId,
          senderUid: messageData.senderUid,
        },
        link: "/chat/room?otherId=" + messageData.senderUid,
        excludeSubscribers: true,
        subscriptionName: roomId,
      });
    }
  } catch (error) {
    const timestamp = Date.now();
    const errorMessage =
      error instanceof Error ? error.message : "알 수 없는 오류가 발생했습니다";

    // 에러 저장 패턴: 데이터베이스에 오류 정보를 저장합니다
    await admin
      .database()
      .ref(messagePath(roomId, messageId, `errors/${timestamp}`))
      .set(errorMessage);

    console.error(
      `1:1 채팅 메시지 ${messageId} 처리 중 오류 발생:`,
      errorMessage
    );
    throw error;
  }
}

/**
 * 주어진 roomId가 1:1 채팅방 ID인지 확인합니다.
 * @param {string} roomId - 확인할 채팅방 ID
 * @return {boolean} roomId가 1:1 채팅방 ID인 경우 true, 그렇지 않으면 false
 */
export function isSingleChatRoomId(roomId: string): boolean {
  return roomId.includes(ROOM_SEPARATOR);
}

/**
 * 1:1 채팅방 ID에서 다른 사용자의 uid를 반환합니다.
 * 그룹 채팅방 ID인 경우 null을 반환합니다.
 * 사용자가 로그인하지 않은 경우 null을 반환합니다.
 * 사용자가 자신과 채팅하는 경우 자신의 ID를 반환합니다.
 *
 * @param {string} roomId - 채팅방 ID
 * @param {string} myUid - 사용자의 Firebase Auth UID
 * @return {string|null} 다른 사용자의 UID 또는 null
 */
export function getOtherUserUidFromRoomId(
  roomId: string,
  myUid: string
): string | null {
  const splits = roomId.split(ROOM_SEPARATOR);
  if (splits.length != 2) {
    return null;
  }
  for (const uid of splits) {
    if (uid != myUid) {
      return uid;
    }
  }
  if (splits[0] == myUid && splits[1] == myUid) {
    return myUid;
  }
  return null;
}

/**
 * 두 사용자 ID에서 1:1 채팅방 ID를 생성합니다
 *
 * UID를 정렬하여 1:1 채팅에 대한 결정론적 채팅방 ID를 생성합니다.
 * 이를 통해 UID가 제공되는 순서와 관계없이 동일한 채팅방 ID가 생성됩니다.
 *
 * @param {string} uid1 - 첫 번째 사용자 ID
 * @param {string} uid2 - 두 번째 사용자 ID
 * @return {string} "uid1---uid2" 형식의 채팅방 ID (정렬됨)
 *
 * @example
 * makeSingleChatRoomId("user123", "user456") // "user123---user456" 반환
 * makeSingleChatRoomId("user456", "user123") // "user123---user456" 반환 (동일)
 */
export function makeSingleChatRoomId(uid1: string, uid2: string): string {
  if (uid1 === uid2) {
    return `${uid1}${ROOM_SEPARATOR}${uid2}`;
  }
  const [first, second] = [uid1, uid2].sort();
  return `${first}${ROOM_SEPARATOR}${second}`;
}

/**
 * 채팅 joins 경로를 생성합니다
 *
 * 사용자의 채팅 joins 엔트리에 대한 데이터베이스 경로를 반환합니다.
 * 선택적으로 join 내의 특정 필드를 포함할 수 있습니다.
 *
 * @param {string} uid - 사용자 ID
 * @param {string} roomId - 채팅방 ID
 * @param {string} [field] - join 내의 선택적 필드명
 * @return {string} 채팅 joins의 데이터베이스 경로
 *
 * @example
 * joinPath("user123", "room-abc") // "{ROOT_FOLDER}/chat/joins/user123/room-abc" 반환
 * joinPath("user123", "room-abc", "order") // "{ROOT_FOLDER}/chat/joins/user123/room-abc/order" 반환
 */
export function joinPath(uid: string, roomId: string, field?: string): string {
  const basePath = `${ROOT_FOLDER}/chat/joins/${uid}/${roomId}`;
  return field ? `${basePath}/${field}` : basePath;
}

/**
 * 채팅 join 속성 경로를 생성합니다
 *
 * 채팅 join 속성에 대한 데이터베이스 경로를 반환합니다.
 * 이러한 속성들은 효율적인 쿼리를 위해 joins와 별도로 저장됩니다.
 *
 * @param {string} uid - 사용자 ID
 * @param {string} field - 속성 필드명 (예: "unread", "singleOrder")
 * @param {string} [key] - 필드 내의 선택적 키
 * @return {string} 채팅 join 속성의 데이터베이스 경로
 *
 * @example
 * joinPropsPath("user123", "unread") // "{ROOT_FOLDER}/chat/join-props/user123/unread" 반환
 * joinPropsPath("user123", "unread", "user456") // "{ROOT_FOLDER}/chat/join-props/user123/unread/user456" 반환
 */
export function joinPropsPath(
  uid: string,
  field: string,
  key?: string
): string {
  const basePath = `${ROOT_FOLDER}/chat/join-props/${uid}/${field}`;
  return key ? `${basePath}/${key}` : basePath;
}

/**
 * 사용자 데이터 경로를 생성합니다
 *
 * 사용자 데이터에 대한 데이터베이스 경로를 반환합니다.
 * 선택적으로 사용자 데이터 내의 특정 필드를 포함할 수 있습니다.
 *
 * @param {string} uid - 사용자 ID
 * @param {string} [field] - 사용자 데이터 내의 선택적 필드명
 * @return {string} 사용자 데이터의 데이터베이스 경로
 *
 * @example
 * userPath("user123") // "{ROOT_FOLDER}/users/user123" 반환
 * userPath("user123", "chatUnreadCount") // "{ROOT_FOLDER}/users/user123/chatUnreadCount" 반환
 */
export function userPath(uid: string, field?: string): string {
  const basePath = `${ROOT_FOLDER}/users/${uid}`;
  return field ? `${basePath}/${field}` : basePath;
}

/**
 * 채팅 메시지 경로를 생성합니다
 *
 * 채팅 메시지에 대한 데이터베이스 경로를 반환합니다.
 * 선택적으로 메시지 내의 특정 필드를 포함할 수 있습니다.
 *
 * @param {string} roomId - 채팅방 ID
 * @param {string} messageId - 메시지 ID
 * @param {string} [field] - 메시지 내의 선택적 필드명
 * @return {string} 채팅 메시지의 데이터베이스 경로
 *
 * @example
 * messagePath("room-abc", "msg-123") // "{ROOT_FOLDER}/chat/messages/room-abc/msg-123" 반환
 * messagePath("room-abc", "msg-123", "errors/1234567890") // "{ROOT_FOLDER}/chat/messages/room-abc/msg-123/errors/1234567890" 반환
 */
export function messagePath(
  roomId: string,
  messageId: string,
  field?: string
): string {
  const basePath = `${ROOT_FOLDER}/chat/messages/${roomId}/${messageId}`;
  return field ? `${basePath}/${field}` : basePath;
}

/**
 * 메시지 데이터에서 첫 번째 이미지 URL을 추출합니다.
 * 이미지 URL이 없으면 null을 반환합니다.
 *
 *
 * @example
 * ```typescript
 * const messageDataWithImages: CreateChatMessageParams = {
 *   id: "msg-123",
 *   text: "이 이미지들을 확인하세요",
 *   senderUid: "user-456",
 *   createdAt: Date.now(),
 *   urls: ["https://example.com/image1.jpg", "https://example.com/image2.jpg"]
 * };
 * const firstImageUrl = getFirstImageUrlFromMessageData(messageDataWithImages);
 * // firstImageUrl은 "https://example.com/image1.jpg"
 *
 * const messageDataWithoutImages: CreateChatMessageParams = {
 *   id: "msg-124",
 *   text: "여기에 이미지가 없습니다",
 *   senderUid: "user-789",
 *   createdAt: Date.now()
 * };
 * const noImageUrl = getFirstImageUrlFromMessageData(messageDataWithoutImages);
 * // noImageUrl은 null
 * ```
 * @param {CreateChatMessageParams} messageData - 메시지 데이터
 * @return {string | null} 첫 번째 이미지 URL 또는 없으면 null
 */
export function getFirstImageUrlFromMessageData(
  messageData: CreateChatMessageParams
): string | null {
  return messageData.urls && messageData.urls.length > 0
    ? messageData.urls[0]
    : null;
}

/**
 * Sends push notifications to a list of user UIDs by resolving their FCM tokens.
 *
 * This is the recommended high-level function for sending notifications to users.
 * It automatically:
 * - Validates the request (checks title and body/imageUrl)
 * - Resolves user UIDs to FCM tokens
 * - Optionally excludes users who are subscribed to a specific topic
 * - Sends notifications to all valid tokens
 * - Returns tokens that encountered errors
 *
 * @param {SendMessageToUidsRequest} req - The notification request parameters
 * @param {string[]} req.uids - Array of user UIDs to send notifications to
 * @param {string} req.title - Notification title (required)
 * @param {string} [req.body] - Notification body text
 * @param {string} [req.imageUrl] - URL of image to display in notification
 * @param {string} [req.link] - Deep link to open when notification is clicked
 * @param {Object} [req.data] - Custom key-value data to send with notification
 * @param {string} [req.subscriptionName] - Subscription topic name (used with excludeSubscribers)
 * @param {boolean} [req.excludeSubscribers] - If true, excludes users subscribed to subscriptionName
 * @return {Promise<string[]>} Array of tokens that encountered errors during sending
 */
export async function sendNotificationToUids(
  req: SendMessageToUidsRequest
): Promise<string[]> {
  let listOfUids = getListOfUidsFromRequest(req);
  // console.log("sendNotificationToUids:listOfUids", listOfUids);
  console.log("sendNotificationToUids:req", req);
  checkTitleBodyAndImage(req);

  // If excludeSubscribers is true and subscription is provided, remove subscribers from the recipient list
  if (req.excludeSubscribers == true && req.subscriptionName) {
    // Get the list of user UIDs subscribed to the specified topic
    const ref = admin
      .database()
      .ref(FCM_SUBSCRIPTIONS_PATH)
      .child(req.subscriptionName);
    const snapshot = await ref.get();
    if (snapshot.exists()) {
      // Get subscriber UIDs
      const uids: string[] = Object.keys(snapshot.val());
      if (uids.length > 0) {
        // Remove subscriber UIDs from the recipient list
        listOfUids = listOfUids.filter((x) => !uids.includes(x));
      }
    }
  }

  console.log("sendNotificationToUids:listOfUids", listOfUids);
  const tokens = await getTokensOfUsers(listOfUids);
  console.log("sendNotificationToUids:tokens", tokens);
  if (tokens.length == 0) {
    console.log("No tokens found for the given uids");
    return [];
  }
  return await sendMessageToTokens({
    tokens,
    title: req.title,
    body: req.body ?? "",
    imageUrl: req.imageUrl,
    data: req.data,
    link: req.link,
  });
}

/**
 * Sends push notifications to a list of FCM tokens with automatic error handling and token cleanup.
 *
 * This is a low-level function that sends messages directly to FCM tokens.
 * For most use cases, use higher-level functions:
 * - `sendNotificationToUids()` - Send to user UIDs (recommended)
 * - `sendMessageToSubscription()` - Send to subscription topic
 *
 * Features:
 * - Automatically splits tokens into chunks (500 tokens per batch)
 * - Removes invalid/expired tokens from database
 * - Handles platform-specific settings (Android, iOS, Web)
 * - Truncates title (64 chars) and body (255 chars) to meet FCM limits
 *
 * @param {MessageRequest} req - The message request containing tokens and notification content
 * @param {string[]} req.tokens - Array of FCM tokens to send notifications to
 * @param {string} req.title - Notification title (max 64 characters, will be truncated)
 * @param {string} req.body - Notification body (max 255 characters, will be truncated)
 * @param {string} [req.imageUrl] - Optional image URL to display in notification
 * @param {Object} [req.data] - Optional custom data to send with notification
 * @param {string} [req.link] - Optional link to open when notification is clicked (Web only)
 * @return {Promise<string[]>} Array of tokens that encountered errors during sending
 */
export async function sendMessageToTokens(
  req: MessageRequest
): Promise<string[]> {
  // Split tokens into chunks for batch processing
  const { tokens, title, body, imageUrl, data, link } = req;

  let updatedBody = body && body.length > 255 ? body.substring(0, 255) : body;
  if (!updatedBody) {
    updatedBody = "... ... ..";
  }

  const chunkTokens = chunk(tokens, MESSAGE_CHUNK_SIZE);
  // console.log("chunkTokens", chunkTokens);

  const notification: Notification = {
    title: title && title.length > 64 ? title.substring(0, 64) : title,
    body: updatedBody,
  };
  if (imageUrl) {
    notification.imageUrl = imageUrl;
  }

  const messaging = getMessaging();
  let tokensWithError: string[] = [];

  // Process each chunk: create messages and send
  for (const tokenChunk of chunkTokens) {
    // console.log("tokenChunk:", tokenChunk);
    const messages: Array<SendEachMessage> = [];
    for (const token of tokenChunk) {
      messages.push({
        token,
        notification,
        data: prepareData(data),
        // android: ANDROID_DEFAULT,
        // apns: APNS_DEFAULT,
        android: {
          notification: {
            sound: "custom_sound",
            channelId: "main_notification",
          },
        },
        apns: {
          payload: {
            aps: {
              sound: "custom_sound",
            },
          },
        },
        webpush: {
          fcmOptions: {
            link: link || "/",
          },
          headers: {
            Urgency: "high",
          },
        },
      });
    }

    console.log(
      "-----> sendNotificationToUids -> sendEach() messages[0]:",
      messages[0]
    );
    const res = await messaging.sendEach(messages, MESSAGE_DRY_RUN);
    console.log(
      "-----> sendNotificationToUids -> sendEach() result:",
      res,
      "successCount",
      res.successCount,
      "failureCount",
      res.failureCount
    );

    // Process send results and identify tokens with errors
    for (let i = 0; i < messages.length; i++) {
      const response = res.responses[i] as SendResponse;
      if (response.success == false) {
        // Mark tokens with errors
        messages[i].success = false;
        messages[i].code = response.error?.code;
        console.log("error code:", response.error?.code);
        console.log("error message:", response.error?.message);
      }
    }

    // Extract tokens that need to be removed from the database
    // Invalid tokens are identified by specific FCM error codes
    const tokensToRemove: string[] = messages
      .filter((message) => {
        // console.log("message:", message);
        if (message.success !== false) return false;

        // Only remove tokens with these specific error codes:
        // - invalid-registration-token: Token is malformed or invalid
        // - registration-token-not-registered: Token is no longer registered
        // Do NOT remove tokens with invalid-argument errors (could be temporary)
        if (message.code === "messaging/invalid-argument") return false;
        else if (message.code === "messaging/invalid-registration-token") {
          // Official documentation: https://firebase.google.com/docs/cloud-messaging/send-message#admin-error
          return true;
        } else if (
          message.code === "messaging/registration-token-not-registered"
        ) {
          // Official documentation: https://firebase.google.com/docs/cloud-messaging/manage-tokens#detect-invalid-token-responses-from-the-fcm-backend
          return true;
        }

        return false;
      })
      .map((message) => message.token);

    // console.log("Tokens to be removed from database:", tokensToRemove);
    // Compile the list of tokens with errors for the final return value
    tokensWithError = tokensWithError.concat(tokensToRemove);

    // Remove invalid tokens from the database
    const promisesToRemove = [];
    for (let i = 0; i < tokensToRemove.length; i++) {
      promisesToRemove.push(
        admin.database().ref(`${FCM_TOKENS_PATH}/${tokensToRemove[i]}`).remove()
      );
    }
    await Promise.allSettled(promisesToRemove);
  }
  return tokensWithError;
}

/**
 * 1. Title is required
 * 2. Either body or imageUrl should have value
 *
 * @param {SendMessageToUidsRequest|SendMessageToSubscription} req message request
 * @return {void}
 */
export function checkTitleBodyAndImage(
  req: MessageRequest | SendMessageToUidsRequest | SendMessageToSubscription
): void {
  if (!req.title) {
    throw new Error("title-must-not-be-empty");
  }
  if (!req.body && !req.imageUrl) {
    throw new Error("body-and-imageUrl-cant-be-both-empty");
  }
}

/**
 * Returns the list of uids or throw error if the uids params is invalid
 * @param {SendMessageToUidsRequest} req -request
 * @return {string[]} - The list of uids
 */
export function getListOfUidsFromRequest(
  req: SendMessageToUidsRequest
): Array<string> {
  if (!req.uids) {
    throw new Error("uids-must-not-be-empty");
  }

  if (typeof req.uids != "object") {
    throw new Error("uids-must-be-an-array-of-string");
  }
  if (req.uids.length == 0) {
    throw new Error("uids-must-not-be-empty");
  }
  return req.uids;
}

/**
 * Returns the list of tokens of the users
 * @param {string[]} uids - uids of users
 * @return {Promise<Array<string>>} - list of tokens
 */
export async function getTokensOfUsers(
  uids: Array<string>
): Promise<Array<string>> {
  const promises = [];

  if (uids.length == 0) return [];

  // Get all tokens for each uid.
  for (const uid of uids) {
    promises.push(
      admin.database().ref(FCM_TOKENS_PATH).orderByChild(UID).equalTo(uid).get()
    );
  }
  const settled = await Promise.allSettled(promises);
  // console.log("getTokensOfUsers::settled:", settled);
  // Collect tokens into an array.

  const tokens: Array<string> = [];
  for (const res of settled) {
    if (res.status == "fulfilled") {
      res.value.forEach((token) => {
        tokens.push(token.key);
      });
    }
  }

  return tokens;
}

/**
 * Return chunched array
 * @param {string[]} arr - array to chunk
 * @param {number} size - size of chunk
 * @return {Array<Array<string>>} The chunched array
 */
export const chunk = (arr: string[], size: number): Array<Array<string>> =>
  Array.from(
    { length: Math.ceil(arr.length / size) },
    (_: unknown, i: number) => arr.slice(i * size, i * size + size)
  );

/**
 * Prepare the data if set
 * If the data is undefined, return undefined
 * Convert all values to string
 *
 * @param {object} data - The data to prepare
 * @return {object} - The prepared data
 */
export function prepareData(
  data: { [key: string]: string } | undefined
): { [key: string]: string } | undefined {
  if (!data) {
    return undefined;
  }
  data = Object.fromEntries(
    Object.entries(data).map(([key, value]) => [
      key,
      typeof value === "object" ? JSON.stringify(value) : String(value),
    ])
  );

  return data;
}

/**
 * Updates the total unread message count for one or more users.
 *
 * This unified function works for both single (1:1) chats and group/open chats.
 *
 * This function:
 * 1. Accepts an array of user UIDs who need their unread counts updated
 * 2. Fetches all unread counts from /chat/join-props/{uid}/unread for each user
 * 3. Calculates the total unread count for each user (sum of all their chat unread counts)
 * 4. Updates /users/{uid}/chatUnreadCount with the total for each user
 *
 * @param {string[]} userUids - Array of user UIDs to update unread counts for
 * @return {Promise<void>} Promise that resolves when all updates are complete
 *
 * @example
 * ```typescript
 * // Single chat - update sender and receiver
 * await updateUsersUnreadCount([senderUid, receiverUid]);
 *
 * // Group chat - update all members
 * await updateUsersUnreadCount(["user1", "user2", "user3"]);
 *
 * // Single user
 * await updateUsersUnreadCount(["user1"]);
 * ```
 */
export async function updateUsersUnreadCount(
  userUids: string[]
): Promise<void> {
  if (!userUids || userUids.length === 0) {
    console.log("[updateUsersUnreadCount] No users to update, skipping");
    return;
  }

  console.log(
    `[updateUsersUnreadCount] Starting for ${userUids.length} users:`,
    userUids
  );

  // Fetch unread data for all users in parallel
  console.log(
    `[updateUsersUnreadCount] Fetching unread data from /${ROOT_FOLDER}/chat/join-props/{uid}/unread`
  );
  const unreadSnapshots = await Promise.all(
    userUids.map((uid) =>
      admin.database().ref(joinPropsPath(uid, "unread")).once("value")
    )
  );

  const userUpdates: UpdateInterface = {};

  // Process each user's unread data
  for (let i = 0; i < userUids.length; i++) {
    const uid = userUids[i];
    const unreadData = unreadSnapshots[i].val() || {};

    console.log(
      `[updateUsersUnreadCount] User ${uid} unread data:`,
      JSON.stringify(unreadData)
    );

    // Calculate total unread count by summing all values
    const totalUnread = Object.values(unreadData).reduce(
      (sum: number, count) => {
        const num = typeof count === "number" ? count : 0;
        return sum + num;
      },
      0
    );

    console.log(
      `[updateUsersUnreadCount] User ${uid} total unread: ${totalUnread}`
    );

    // Add to batch update
    userUpdates[userPath(uid, "chatUnreadCount")] = totalUnread;
  }

  // Execute batch update
  console.log(
    "[updateUsersUnreadCount] Updating database paths:",
    Object.keys(userUpdates)
  );
  await admin.database().ref().update(userUpdates);

  console.log(
    `[updateUsersUnreadCount] ✓ Success - Updated chatUnreadCount for ${userUids.length} users`
  );
}
