/**
 * Import function triggers from their respective submodules:
 *
 * import {onCall} from "firebase-functions/v2/https";
 * import {onDocumentWritten} from "firebase-functions/v2/firestore";
 *
 * See a full list of supported triggers at https://firebase.google.com/docs/functions
 */
import * as admin from "firebase-admin";
import { setGlobalOptions } from "firebase-functions";
import { onValueCreated } from "firebase-functions/v2/database";
import { DataSnapshot } from "firebase-admin/database";
import type { DatabaseEvent } from "firebase-functions/v2/database";
import { CreateChatMessageParams } from "./interfaces";
import { updateOnMessageCreatedForSingleChat } from "./functions";

// Configuration based on environment
// Note: This uses hardcoded values based on the default Firebase project
// To change the project, set FIREBASE_PROJECT environment variable during deployment:
// firebase deploy --only functions --project=test5
// or
// firebase deploy --only functions --project=philgo
const getConfig = () => {
  // GCLOUD_PROJECT is automatically set by Firebase during deployment
  // FIREBASE_PROJECT is used for local testing/emulator
  const projectValue =
    process.env.GCLOUD_PROJECT || process.env.FIREBASE_PROJECT || "";

  if (projectValue === "test5" || projectValue.includes("withcenter-test-5")) {
    return {
      databaseURL:
        "https://withcenter-test-5-default-rtdb.asia-southeast1.firebasedatabase.app/",
      region: "asia-southeast1", // Must match database region for database triggers
    };
  } else if (
    projectValue === "philgo" ||
    projectValue.includes("philgo-64b1a")
  ) {
    return {
      databaseURL: "https://philgo-64b1a.firebaseio.com/",
      region: "us-central1",
    };
  } else {
    throw new Error(`Unknown FIREBASE_PROJECT value: ${projectValue}`);
  }
};

const config = getConfig();

// Start writing functions
// https://firebase.google.com/docs/functions/typescript

// For cost control, you can set the maximum number of containers that can be
// running at the same time. This helps mitigate the impact of unexpected
// traffic spikes by instead downgrading performance. This limit is a
// per-function limit. You can override the limit for each function using the
// `maxInstances` option in the function's options, e.g.
// `onRequest({ maxInstances: 5 }, (req, res) => { ... })`.
// NOTE: setGlobalOptions does not apply to functions using the v1 API. V1
// functions should each use functions.runWith({ maxInstances: 10 }) instead.
// In the v1 API, each function can only serve one request per container, so
// this will be the maximum concurrent request count.
setGlobalOptions({ maxInstances: 10 });

if (!admin.apps.length) {
  admin.initializeApp({
    databaseURL: config.databaseURL,
  });

  console.log(
    `Firebase Admin initialized with database URL: ${config.databaseURL}`
  );
}

/**
 * Background function that triggers when a new chat message is created.
 *
 * This function routes to appropriate handlers based on chat type:
 * - Single chats (roomId contains "---"): Routes to updateOnMessageCreatedForSingleChat()
 * - Group/Open chats: Routes to updateOnMessageCreatedForGroupChat()
 *
 * Each handler manages:
 * - Protocol message filtering
 * - Room/user validation
 * - Room lastMessage updates
 * - User join information updates
 * - Order field management (order, singleOrder, groupOrder, openOrder)
 * - Unread count management
 * - Error saving (Error Saving pattern)
 * - Logging
 *
 * The trigger function remains simple, only responsible for:
 * - Extracting data from the event
 * - Extracting roomId and messageId from params
 * - Determining chat type and routing to appropriate handler
 *
 * @param event - Database event containing the chat message data
 * @returns Promise<void>
 *
 * @see docs/chat/cloud-functions.md#keep-trigger-functions-simple
 * @see docs/chat/chat-logic.md#message-creation-flow
 */
export const onChatMessageCreated = onValueCreated(
  "/chat/messages/{roomId}/{messageId}",
  async (event: DatabaseEvent<DataSnapshot>) => {
    const roomId = event.params.roomId as string;
    const messageId = event.params.messageId as string;
    const messageData = event.data.val() as CreateChatMessageParams;

    // Step 1: Skip protocol messages (system messages like join/leave)
    if (messageData.protocol) {
      console.log(`Skipping protocol message ${messageId} in room ${roomId}`);
      return;
    }

    // Step 1.5: Validate required fields
    if (
      messageData.senderUid === undefined ||
      messageData.senderUid.trim().length === 0
    ) {
      throw new Error("senderUid is required but was undefined or empty");
    }

    await updateOnMessageCreatedForSingleChat(roomId, messageId, messageData);
  }
);
