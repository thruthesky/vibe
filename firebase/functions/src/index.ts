/**
 * 각 서브모듈에서 함수 트리거를 import합니다:
 *
 * import {onCall} from "firebase-functions/v2/https";
 * import {onDocumentWritten} from "firebase-functions/v2/firestore";
 *
 * Firebase Functions에서 지원하는 모든 트리거 목록:
 * https://firebase.google.com/docs/functions
 */
import * as admin from "firebase-admin";
import { setGlobalOptions } from "firebase-functions";
import { onValueCreated } from "firebase-functions/v2/database";
import { DataSnapshot } from "firebase-admin/database";
import type { DatabaseEvent } from "firebase-functions/v2/database";
import { CreateChatMessageParams } from "./interfaces";
import { updateOnMessageCreatedForSingleChat } from "./functions";
import { ROOT_FOLDER } from "./firebase.config";

// 환경에 따른 설정
// 참고: 기본 Firebase 프로젝트를 기반으로 하드코딩된 값을 사용합니다
// 프로젝트를 변경하려면 배포 시 FIREBASE_PROJECT 환경 변수를 설정하세요:
// firebase deploy --only functions --project=test5
// 또는
// firebase deploy --only functions --project=philgo
const getConfig = () => {
  // GCLOUD_PROJECT는 Firebase 배포 중에 자동으로 설정됩니다
  // FIREBASE_PROJECT는 로컬 테스트/에뮬레이터에 사용됩니다
  const projectValue =
    process.env.GCLOUD_PROJECT || process.env.FIREBASE_PROJECT || "";

  if (projectValue === "test5" || projectValue.includes("withcenter-test-5")) {
    return {
      databaseURL:
        "https://withcenter-test-5-default-rtdb.asia-southeast1.firebasedatabase.app/",
      region: "asia-southeast1", // 데이터베이스 트리거를 위해 데이터베이스 영역과 일치해야 함
    };
  } else {
    throw new Error(`알 수 없는 FIREBASE_PROJECT 값: ${projectValue}`);
  }
};

const config = getConfig();

// Cloud Functions 작성 시작
// https://firebase.google.com/docs/functions/typescript

// 비용 제어를 위해 동시에 실행할 수 있는 최대 컨테이너 수를 설정할 수 있습니다.
// 이는 예상치 못한 트래픽 스파이크의 영향을 완화하는 데 도움이 됩니다 (성능 저하로 대응).
// 이 제한은 함수당 제한입니다. 함수의 options에서 `maxInstances` 옵션을 사용하여
// 각 함수마다 제한을 재정의할 수 있습니다. 예:
// `onRequest({ maxInstances: 5 }, (req, res) => { ... })`.
// 참고: setGlobalOptions는 v1 API를 사용하는 함수에 적용되지 않습니다.
// V1 함수는 대신 functions.runWith({ maxInstances: 10 })를 각각 사용해야 합니다.
// V1 API에서 각 함수는 컨테이너당 하나의 요청만 처리할 수 있으므로,
// 이것이 최대 동시 요청 수가 됩니다.
setGlobalOptions({ maxInstances: 10, region: config.region });

if (!admin.apps.length) {
  admin.initializeApp({
    databaseURL: config.databaseURL,
  });

  console.log(
    `Firebase Admin이 데이터베이스 URL로 초기화되었습니다: ${config.databaseURL}`
  );
}

/**
 * 새로운 채팅 메시지가 생성될 때 트리거되는 백그라운드 함수입니다.
 *
 * 이 함수는 채팅 유형에 따라 적절한 핸들러로 라우팅합니다:
 * - 1:1 채팅 (roomId에 "---" 포함): updateOnMessageCreatedForSingleChat()로 라우팅
 * - 그룹/오픈 채팅: updateOnMessageCreatedForGroupChat()로 라우팅
 *
 * 각 핸들러는 다음을 관리합니다:
 * - 프로토콜 메시지 필터링
 * - 채팅방/사용자 유효성 검사
 * - 채팅방 lastMessage 업데이트
 * - 사용자 참여 정보 업데이트
 * - Order 필드 관리 (order, singleOrder, groupOrder, openOrder)
 * - 읽지 않은 메시지 수 관리
 * - 에러 저장 (에러 저장 패턴)
 * - 로깅
 *
 * 트리거 함수는 간단하게 유지되며, 다음만 담당합니다:
 * - 이벤트에서 데이터 추출
 * - 매개변수에서 roomId와 messageId 추출
 * - 채팅 유형 결정 및 적절한 핸들러로 라우팅
 *
 * @param event - 채팅 메시지 데이터를 포함하는 데이터베이스 이벤트
 * @returns Promise<void>
 *
 * @see docs/chat/cloud-functions.md#keep-trigger-functions-simple
 * @see docs/chat/chat-logic.md#message-creation-flow
 */
export const onVibeChatMessageCreated = onValueCreated(
  `/${ROOT_FOLDER}/chat/messages/{roomId}/{messageId}`,
  async (event: DatabaseEvent<DataSnapshot>) => {
    const roomId = event.params.roomId as string;
    const messageId = event.params.messageId as string;
    const messageData = event.data.val() as CreateChatMessageParams;

    // 단계 1: 프로토콜 메시지 건너뛰기 (join/leave와 같은 시스템 메시지)
    if (messageData.protocol) {
      console.log(`채팅방 ${roomId}의 프로토콜 메시지 ${messageId}를 건너뜁니다`);
      return;
    }

    // 단계 1.5: 필수 필드 유효성 검사
    if (
      messageData.senderUid === undefined ||
      messageData.senderUid.trim().length === 0
    ) {
      throw new Error("senderUid는 필수이지만 정의되지 않았거나 비어있습니다");
    }

    await updateOnMessageCreatedForSingleChat(roomId, messageId, messageData);
  }
);
