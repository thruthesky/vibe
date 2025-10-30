/**
 * Generic update interface for Firebase multi-path updates.
 */
export interface UpdateInterface {
  [x: string]: string | number | boolean | object | null;
}

/**
 * Interface representing the last message information in a chat room.
 *
 * This structure is used in both:
 * - /chat/rooms/{roomId}/lastMessage
 * - /chat/joins/{uid}/{roomId}/lastMessage
 */
export interface LastMessage {
  text?: string; // Last text preview
  url: string | null; // Last image URL (first image if multiple)
  senderUid: string; // UID of user who sent the last message
  senderDisplayName?: string; // Nickname of the user who sent the last message (optional for 1:1 chats)
  senderPhotoUrl?: string; // Profile photo URL of the sender (optional for 1:1 chats)
  sentAt: number; // Timestamp of the last message (NOT an ordering field)
}

/**
 * Parameters for creating a new chat room.
 */
export interface CreateChatRoomParams {
  id?: string; // Optional room ID (auto-generated if not provided)
  name: string; // Chat room name
  description?: string; // Chat room description
  imageUrl?: string; // Chat room image URL
  open?: boolean | null; // Whether it's an open chat room
  uid: string; // UID of the user creating the room
  invitedUsers?: string[]; // List of user UIDs to invite
  test?: boolean; // Test room flag
  blockAdvertisements?: boolean; // Advertisement blocking setting
}

/**
 * ChatRoom type represents a chat room entity in the system.
 *
 * This is a data structure that represents chat room data.
 * All operations on ChatRoom are performed through pure functions.
 */
export interface ChatRoom {
  id: string;
  name: string;
  open: boolean | null;
  createdAt: number;
  masterUsers: Record<string, boolean>;
  users: Record<string, boolean>;
  description?: string;
  imageUrl?: string;
  openOrder?: number;
  lastMessage?: LastMessage;
  invitedUsers?: Record<string, boolean>;
  test?: boolean;
  blockAdvertisements?: boolean;
  errors?: Record<string, string>;
}

/**
 * ChatRoomJson is an alias for ChatRoom.
 * Used for database serialization/deserialization.
 */
export type ChatRoomJson = ChatRoom;

/**
 * Interface representing a chat message in RTDB.
 *
 * Database path: /chat/messages/{roomId}/{messageId}
 */
export interface ChatMessage {
  id: string; // Message ID - should match document key
  text?: string; // Message text content
  senderUid: string; // UID of the message sender
  createdAt: number; // Message creation timestamp
  urls?: string[]; // Optional array of image URLs
  protocol?: string; // Optional protocol message type
  moderated?: "M" | "A"; // Optional moderation status
}

/**
 * Interface for chat message parameters used in function calls.
 *
 * This is similar to ChatMessage but makes id optional since it may not be
 * known at creation time.
 */
export interface CreateChatMessageParams {
  id?: string;
  text: string;
  senderUid: string;
  createdAt: number;
  urls?: string[];
  protocol?: string;
}

/**
 * Interface for chat join information (stored per user per room).
 *
 * Database path: /chat/joins/{uid}/{roomId}
 *
 * This interface matches the structure defined in docs/chat/chat-database.md
 */
export interface ChatJoin {
  id: string; // Room ID - should match document key

  // Group/Open chat fields
  roomName?: string; // Name of the chat room (for group/open chat)
  roomImageUrl?: string; // Chat room image URL (for group/open chat)

  // 1:1 chat fields - other user information
  userDisplayName?: string; // Other user display name (for 1:1 chats)
  userDisplayNameLowerCase?: string; // Other user display name in lowercase (for 1:1 chats)
  userPhotoUrl?: string; // Other user profile photo URL (for 1:1 chats)

  // Ordering/Sorting fields (used ONLY in chat/joins for sorting)
  order: number; // General sorting order for all chat types (last activity)
  singleOrder?: number; // Sorting order for 1:1 chats only
  groupOrder?: number; // Sorting order for group chats only
  openOrder?: number; // Sorting order for open/public chats only

  // Last message information
  lastMessage?: LastMessage; // Last message information

  // Unread message count
  unread: number; // Unread message count
}

/**
 * Parameters for joining a chat room.
 */
export interface JoinChatRoomParams {
  roomId: string; // The chat room ID to join
  uid: string; // The user ID who wants to join
  createIfNotExists?: boolean; // If true, creates the room if it doesn't exist (default: false)
  roomParams?: CreateChatRoomParams; // Parameters for creating the room if it doesn't exist
}

/**
 * Result of joining a chat room.
 */
export interface JoinChatRoomResult {
  success: boolean; // Whether the join was successful
  roomCreated: boolean; // Whether the room was created
  alreadyJoined: boolean; // Whether the user was already a member
  room: ChatRoom; // The chat room data
  welcomeMessageSent: boolean; // Whether a welcome message was sent
}

/**
 * Protocol message types for system messages.
 */
export const PROTOCOL = {
  CREATE: "protocol.create",
  JOIN: "protocol.join",
  LEFT: "protocol.left",
} as const;

import { TokenMessage } from "firebase-admin/messaging";

export interface BaseNotification {
  /**
   * The title of the notification.
   */
  title?: string;
  /**
   * The notification body
   */
  body?: string;
  /**
   * URL of an image to be displayed in the notification.
   */
  imageUrl?: string;
  /**
   * The link to open when the user taps on the notification. (Web)
   */
  link?: string;
  /**
   * Optional data field to send with the notification (key-value pairs).
   */
  data?: { [key: string]: string };
  // /**
  //  * The sound to play when the device receives the notification. (iOS, Android) (default: "default")
  //  */
  // sound?: string;
}

/**
 * Inteface for sendNotificationToUids
 *
 * @uids: Array of uids to send the message to
 * @title: Title of the message
 * @body: Body of the message
 * @data: Additional data to be sent
 */
export interface SendMessageToUidsRequest extends BaseNotification {
  uids: Array<string>;
  subscriptionName?: string;
  excludeSubscribers?: boolean;
}

/**
 * Interface for SendEachMessage
 */
export interface SendEachMessage extends TokenMessage {
  success?: boolean;
  code?: string;
}

export interface MessageRequest extends BaseNotification {
  tokens: Array<string>;
}

export interface SendMessageToSubscription extends BaseNotification {
  subscription: string;
  senderUid?: string;
  sender_uid?: string; // for backward compatibility
}

export interface PushMessageCreateRequest {
  messageId: string;
  data: PushMesssageInterface;
}

export interface PushMesssageInterface extends BaseNotification {
  subscription: string;
  tokens: Array<string>;
  uids: Array<string>;
  status: string;
}
