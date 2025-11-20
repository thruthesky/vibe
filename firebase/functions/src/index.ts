/**
 * Firebase Cloud Functions (Gen 2)
 * SNS 프로젝트의 백그라운드 이벤트 처리 함수들
 *
 * ⚠️ 중요: 모든 함수는 반드시 Gen 2 버전으로 작성해야 합니다.
 * - Gen 2 API: firebase-functions/v2
 * - Gen 1 API 사용 금지
 *
 * 참고: https://firebase.google.com/docs/functions/2nd-gen
 */

// Gen 2 API imports
import {setGlobalOptions} from "firebase-functions/v2";
import {
  onValueCreated,
  onValueDeleted,
  onValueUpdated,
  onValueWritten,
  DatabaseEvent,
} from "firebase-functions/v2/database";
import type {DataSnapshot} from "firebase-admin/database";
import * as logger from "firebase-functions/logger";
import * as admin from "firebase-admin";

// 타입 임포트
import {UserData, ChatMessage, LikeTargetType} from "./types";

// Firebase Database Event에 인증 정보를 포함하는 확장 타입
// Firebase Functions v2에서는 authType과 authId가 있지만 타입 정의에 누락됨
interface DatabaseEventWithAuth<T = DataSnapshot, Params = Record<string, string>>
  extends DatabaseEvent<T, Params> {
  authType?: string;
  authId?: string;
}

// 비즈니스 로직 핸들러 임포트
import {
  handleUserCreate,
  handleUserDisplayNameUpdate,
  handleUserPhotoUrlUpdate,
  handleUserBirthYearMonthDayUpdate,
  handleUserGenderUpdate,
} from "./handlers/user.handler";
import {handleChatMessageCreate} from "./handlers/chat.message-create.handler";
import {
  handleChatMessageCategoryCreate,
  handleChatMessageCategoryUpdate,
  handleChatMessageCategoryDelete,
} from "./handlers/chat.message-category.handler";
import {
  handleChatMessageTextUpdate,
  handleChatMessageUrlsUpdate,
  handlePostTextUpdate,
  handlePostUrlsUpdate,
} from "./handlers/chat.message-sync.handler";
import {handleChatRoomCreate} from "./handlers/chat.room-create.handler";
import {handleChatJoinCreate} from "./handlers/chat.join-create.handler";
import {handleChatRoomMemberJoin} from "./handlers/chat.room-member-join.handler";
import {handleChatRoomMemberLeave} from "./handlers/chat.room-member-leave.handler";
import {handleChatRoomPinCreate} from "./handlers/chat.room-pin-create.handler";
import {handleChatRoomPinDelete} from "./handlers/chat.room-pin-delete.handler";
import {handleChatInvitationCreate} from "./handlers/chat.invitation-create.handler";
import {handleNewMessageCountWritten} from "./handlers/chat.new-message-count.handler";
import {handleCommentCreate} from "./handlers/comment.create.handler";
import {
  handleFollowingCreate,
  handleFollowingDelete,
} from "./handlers/friend.follow.handler";
import {
  handleMessageDeletedFanout,
} from "./handlers/feed.fanout.handler";
import {
  handleLikeCreate,
  handleLikeDelete,
} from "./handlers/like.handler";
import {
  handleLikeCreate as handleLikeCreateStats,
  handleLikeDelete as handleLikeDeleteStats,
} from "./handlers/stats.like.handler";
import {
  handleCommentCreateStats,
  handleCommentDeleteStats,
} from "./handlers/stats.comment.handler";
import {
  handlePostCreate as handlePostCreateStats,
  handlePostDelete as handlePostDeleteStats,
} from "./handlers/stats.post.handler";
import {handlePostCreate as handlePostCreateLogic} from "./handlers/post.create.handler";
import {
  handleFollowCreateStats,
  handleFollowDeleteStats,
} from "./handlers/stats.follow.handler";
import {handleInfluencerScoreChange} from "./handlers/stats.ranking.handler";
import {handlePostRankingUpdate} from "./handlers/post-ranking.handler";

// 상수 정의
const FIREBASE_REGION = "asia-southeast1";


// Firebase Admin 초기화
if (!admin.apps.length) {
  admin.initializeApp();
  logger.info("Firebase Admin initialized");
}

// 비용 관리를 위한 전역 옵션 설정
// 최대 10개의 컨테이너만 동시 실행하여 예상치 못한 비용 급증 방지
setGlobalOptions({
  maxInstances: 10,
  region: FIREBASE_REGION, // RTDB region과 일치 필수
});

/**
 * 사용자 등록 시 user-props 노드에 주요 필드를 분리 저장하고 createdAt을 설정합니다.
 *
 * 트리거 경로: /users/{uid}
 *
 * 수행 작업:
 * 1. createdAt 필드 자동 생성 및 /users/{uid}/createdAt 직접 저장
 * 2. handleUserCreate() 함수를 통해 모든 사용자 데이터 정규화 및 동기화 수행
 *    - updatedAt 필드 자동 생성
 *    - displayNameLowerCase 자동 생성
 *    - photoUrl 처리
 *    - /users/{uid} 노드 업데이트
 *    - /user-props/ 노드 동기화
 *    - /stats/counters/user +1 (전체 사용자 통계 업데이트)
 */
export const onUserCreate = onValueCreated(
  {
    ref: "/users/{uid}",
    region: FIREBASE_REGION,
  },
  async (event) => {
    const uid = event.params.uid as string;
    const userData = (event.data.val() || {}) as UserData;

    logger.info("새 사용자 등록 감지", {
      uid,
      displayName: userData.displayName ?? null,
    });

    // 비즈니스 로직 핸들러 호출
    return await handleUserCreate(uid, userData);
  }
);



/**
 * 사용자 displayName 필드 생성/수정/삭제 시 트리거
 *
 * 트리거 경로: /users/{uid}/displayName
 * 트리거 이벤트: onValueWritten (생성, 수정, 삭제 모두 감지)
 *
 * 수행 작업:
 * - 생성/수정 시:
 *   1. createdAt 필드가 없으면 자동 생성
 *   2. displayNameLowerCase 자동 생성 (대소문자 구분 없는 검색용)
 *   3. updatedAt 업데이트
 * - 삭제 시:
 *   1. displayNameLowerCase 삭제 (동기화)
 *   2. updatedAt 업데이트
 *
 * 무한 루프 방지:
 * - displayName 필드만 감지하므로 displayNameLowerCase 업데이트 시 재트리거 안 됨
 */
export const onUserDisplayNameWrite = onValueWritten(
  {
    ref: "/users/{uid}/displayName",
    region: FIREBASE_REGION,
  },
  async (event) => {
    const uid = event.params.uid as string;
    const beforeValue = event.data.before.val() as string | null;
    const afterValue = event.data.after.val() as string | null;

    logger.info("displayName 필드 변경 감지 (생성/수정/삭제)", {
      uid,
      beforeValue,
      afterValue,
      action: afterValue === null ? "삭제" : beforeValue === null ? "생성" : "수정",
    });

    // 비즈니스 로직 핸들러 호출
    return await handleUserDisplayNameUpdate(uid, beforeValue, afterValue);
  }
);

/**
 * 사용자 photoUrl 필드 생성/수정/삭제 시 트리거
 *
 * 트리거 경로: /users/{uid}/photoUrl
 * 트리거 이벤트: onValueWritten (생성, 수정, 삭제 모두 감지)
 *
 * 수행 작업:
 * - 생성/수정 시:
 *   1. createdAt 필드가 없으면 자동 생성
 *   2. updatedAt 업데이트
 * - 삭제 시:
 *   1. updatedAt 업데이트
 *
 * 무한 루프 방지:
 * - photoUrl 필드만 감지하므로 다른 필드 업데이트 시 재트리거 안 됨
 */
export const onUserPhotoUrlWrite = onValueWritten(
  {
    ref: "/users/{uid}/photoUrl",
    region: FIREBASE_REGION,
  },
  async (event) => {
    const uid = event.params.uid as string;
    const beforeValue = event.data.before.val() as string | null;
    const afterValue = event.data.after.val() as string | null;

    logger.info("photoUrl 필드 변경 감지 (생성/수정/삭제)", {
      uid,
      beforeValue,
      afterValue,
      action: afterValue === null ? "삭제" : beforeValue === null ? "생성" : "수정",
    });

    // 비즈니스 로직 핸들러 호출
    return await handleUserPhotoUrlUpdate(uid, beforeValue, afterValue);
  }
);

/**
 * 사용자 birthYearMonthDay 필드 생성/수정/삭제 시 트리거
 *
 * 트리거 경로: /users/{uid}/birthYearMonthDay
 * 트리거 이벤트: onValueWritten (생성, 수정, 삭제 모두 감지)
 *
 * 수행 작업:
 * - 생성/수정 시:
 *   1. createdAt 필드가 없으면 자동 생성
 *   2. YYYY-MM-DD 형식 파싱 및 유효성 검증
 *   3. 파생 필드 자동 생성:
 *      - birthYear (number): 생년
 *      - birthMonth (number): 생월
 *      - birthDay (number): 생일
 *      - birthMonthDay (string): 생월일 (MM-DD 형식)
 * - 삭제 시:
 *   1. 모든 파생 필드 삭제 (동기화)
 *
 * 무한 루프 방지:
 * - birthYearMonthDay 필드만 감지하므로 파생 필드 업데이트 시 재트리거 안 됨
 *
 * 참고:
 * - updatedAt은 업데이트하지 않음 (내부 속성 변경으로 간주)
 */
export const onUserBirthYearMonthDayWrite = onValueWritten(
  {
    ref: "/users/{uid}/birthYearMonthDay",
    region: FIREBASE_REGION,
  },
  async (event) => {
    const uid = event.params.uid as string;
    const beforeValue = event.data.before.val() as string | null;
    const afterValue = event.data.after.val() as string | null;

    logger.info("birthYearMonthDay 필드 변경 감지 (생성/수정/삭제)", {
      uid,
      beforeValue,
      afterValue,
      action: afterValue === null ? "삭제" : beforeValue === null ? "생성" : "수정",
    });

    // 비즈니스 로직 핸들러 호출
    return await handleUserBirthYearMonthDayUpdate(uid, beforeValue, afterValue);
  }
);

/**
 * 사용자 gender 필드 생성/수정/삭제 시 트리거
 *
 * 트리거 경로: /users/{uid}/gender
 * 트리거 이벤트: onValueWritten (생성, 수정, 삭제 모두 감지)
 *
 * 수행 작업:
 * - 생성/수정 시:
 *   1. photoUrl 존재 여부 확인
 *   2. photoUrl이 있는 경우:
 *      - gender=F: sort_recentFemaleWithPhoto에 createdAt 설정, sort_recentMaleWithPhoto는 null
 *      - gender=M: sort_recentMaleWithPhoto에 createdAt 설정, sort_recentFemaleWithPhoto는 null
 *   3. photoUrl이 없는 경우: 두 정렬 필드 모두 null
 *   4. updatedAt 업데이트
 * - 삭제 시:
 *   1. sort_recentFemaleWithPhoto와 sort_recentMaleWithPhoto 삭제
 *   2. updatedAt 업데이트
 *
 * 무한 루프 방지:
 * - gender 필드만 감지하므로 다른 필드 업데이트 시 재트리거 안 됨
 */
export const onUserGenderWrite = onValueWritten(
  {
    ref: "/users/{uid}/gender",
    region: FIREBASE_REGION,
  },
  async (event) => {
    const uid = event.params.uid as string;
    const beforeValue = event.data.before.val() as string | null;
    const afterValue = event.data.after.val() as string | null;

    logger.info("gender 필드 변경 감지 (생성/수정/삭제)", {
      uid,
      beforeValue,
      afterValue,
      action: afterValue === null ? "삭제" : beforeValue === null ? "생성" : "수정",
    });

    // 비즈니스 로직 핸들러 호출
    return await handleUserGenderUpdate(uid, beforeValue, afterValue);
  }
);



/**
 * 채팅 메시지 생성 시 트리거되는 Cloud Function
 *
 * 트리거 경로: /chat-messages/{messageId}
 *
 * 수행 작업:
 * 1. 프로토콜 메시지 건너뛰기 (시스템 메시지)
 * 2. 필수 필드 유효성 검사 (senderUid, roomId)
 * 3. 1:1 채팅인 경우:
 *    - 양쪽 사용자의 chat-joins 자동 생성/업데이트 (/chat-joins/{uid1}/{roomId}, /chat-joins/{uid2}/{roomId})
 *    - roomId, roomType, partnerUid 설정
 *    - lastMessageText, lastMessageAt 업데이트
 *    - 정렬 필드: singleChatListOrder (발신자: timestamp, 수신자: 200+timestamp)
 *    - allChatListOrder (통합 정렬용)
 *    - newMessageCount (수신자만 increment(1))
 * 4. 그룹/오픈 채팅인 경우:
 *    - chat-rooms에서 members 목록 조회
 *    - 모든 멤버의 chat-joins 자동 업데이트
 *    - roomName, lastMessageText, lastMessageAt 설정
 *    - 정렬 필드: groupChatListOrder 또는 openChatListOrder (발신자: timestamp, 타 멤버: 200+timestamp)
 *    - openAndGroupChatListOrder, allChatListOrder (통합 정렬용)
 *    - newMessageCount (발신자 제외한 모든 멤버 increment(1))
 *
 * 참고:
 * - 1:1 채팅 roomId 형식: "single-{uid1}-{uid2}" (알파벳 순 정렬)
 * - 그룹/오픈 채팅 roomId: 자동 생성된 Firebase push key
 *
 * 비즈니스 로직은 handlers/chat.handler.ts의 handleChatMessageCreate() 참조
 */
export const onChatMessageCreate = onValueCreated(
  {
    ref: "/chat-messages/{roomId}/{messageId}",
    region: FIREBASE_REGION,
  },
  async (event) => {
    // roomId는 2단계 구조를 위한 경로 파라미터
    // handleChatMessageCreate에서는 messageData 내부의 정보로 처리하므로 직접 사용하지 않음
    const messageId = event.params.messageId as string;
    const messageData = (event.data.val() || {}) as ChatMessage;

    // 비즈니스 로직 핸들러 호출
    return await handleChatMessageCreate(messageId, messageData);
  }
);



/**
 * 채팅방 생성 시 트리거되는 Cloud Function
 *
 * 트리거 경로: /chat-rooms/{roomId}
 *
 * 수행 작업:
 * 1. owner 필드를 통해 채팅방 생성자 확인 (보안 규칙으로 검증됨)
 * 2. createdAt 필드 자동 생성
 * 3. memberCount 필드를 1로 초기화 (생성자 포함)
 *
 * 보안:
 * - owner 필드는 보안 규칙에 의해 auth.uid와 동일하게 검증됨
 * - createdAt과 memberCount는 Cloud Functions에서만 설정 가능
 *
 * 참고:
 * - 그룹 채팅방: type='group'
 * - 오픈 채팅방: type='open'
 * - 1:1 채팅방: type='single' (memberCount 관리 불필요)
 *
 * 비즈니스 로직은 handlers/chat.handler.ts의 handleChatRoomCreate() 참조
 */
export const onChatRoomCreate = onValueCreated(
  {
    ref: "/chat-rooms/{roomId}",
    region: FIREBASE_REGION,
  },
  async (event) => {
    const roomId = event.params.roomId as string;
    const roomData = (event.data.val() || {}) as Record<string, unknown>;
    // event.authId로 채팅방 생성자 UID 확인 (Firebase Auth로 인증된 사용자)
    // TypeScript 타입 정의에 없지만 런타임에는 존재함
    const eventWithAuth = event as DatabaseEventWithAuth<DataSnapshot, {roomId: string}>;
    const ownerUid = eventWithAuth.authId;

    logger.info("채팅방 생성 감지", {
      roomId,
      owner: ownerUid,
      authType: eventWithAuth.authType,
      roomType: roomData.type,
    });

    // 비즈니스 로직 핸들러 호출
    return await handleChatRoomCreate(roomId, roomData, ownerUid);
  }
);



/**
 * 채팅 참여 정보 생성 시 트리거되는 Cloud Function
 *
 * 트리거 경로: /chat-joins/{uid}/{roomId}
 *
 * 수행 작업:
 * 1. joinedAt 필드가 없으면 현재 타임스탬프로 자동 생성
 * 2. 1:1 채팅인 경우 (roomId 형식: "single-{uid1}-{uid2}"):
 *    - partnerUid 추출 및 설정
 *    - roomType = "single" 설정
 *    - singleChatListOrder = timestamp (문자열) 설정
 *    - allChatListOrder = timestamp (숫자) 설정
 * 3. 그룹/오픈 채팅인 경우:
 *    - chat-rooms에서 채팅방 정보 조회
 *    - roomType, roomName 설정
 *    - roomType이 "group"인 경우:
 *      - groupChatListOrder = timestamp (문자열) 설정
 *      - openAndGroupChatListOrder = timestamp (숫자) 설정
 *    - roomType이 "open"인 경우:
 *      - openChatListOrder = timestamp (문자열) 설정
 *      - openAndGroupChatListOrder = timestamp (숫자) 설정
 *    - allChatListOrder = timestamp (숫자) 설정
 *
 * 참고:
 * - chat-joins 노드는 클라이언트가 직접 생성하거나 onChatMessageCreate에서 자동 생성됨
 * - 이 함수는 채팅방 타입별로 적절한 정렬 필드를 자동 설정
 * - 이미 완전히 설정된 경우 (joinedAt + roomType 존재) 건너뛰기
 *
 * 비즈니스 로직은 handlers/chat.handler.ts의 handleChatJoinCreate() 참조
 */
export const onChatJoinCreate = onValueCreated(
  {
    ref: "/chat-joins/{uid}/{roomId}",
    region: FIREBASE_REGION,
  },
  async (event) => {
    const uid = event.params.uid as string;
    const roomId = event.params.roomId as string;

    logger.info("채팅방 참여 정보 생성 감지", {
      uid,
      roomId,
    });

    // 비즈니스 로직 핸들러 호출
    return await handleChatJoinCreate(uid, roomId);
  }
);



/**
 * 채팅방 멤버 입장 시 트리거되는 Cloud Function
 *
 * 트리거 경로: /chat-rooms/{roomId}/members/{uid}
 *
 * 수행 작업:
 * 1. chat-rooms/{roomId}/members 아래의 모든 uid 읽기
 * 2. 모든 uid의 개수 세기 (true/false 구분 없이)
 * 3. memberCount 필드를 자동으로 증가
 *
 * 참고:
 * - members 필드 구조: chat-rooms/{roomId}/members/{uid}: boolean
 * - true: 사용자가 채팅방에 참여 중, 메시지 알림을 받음
 * - onValueCreated 트리거로 멤버 입장 감지
 * - memberCount는 members 객체의 모든 uid 개수 (true/false 모두 포함)
 *
 * 비즈니스 로직은 handlers/chat.handler.ts의 handleChatRoomMemberJoin() 참조
 */
export const onChatRoomMemberJoin = onValueCreated(
  {
    ref: "/chat-rooms/{roomId}/members/{uid}",
    region: FIREBASE_REGION,
  },
  async (event) => {
    const roomId = event.params.roomId as string;
    const uid = event.params.uid as string;

    logger.info("채팅방 멤버 입장 감지", {
      roomId,
      uid,
    });

    // 비즈니스 로직 핸들러 호출
    return await handleChatRoomMemberJoin(roomId, uid);
  }
);



/**
 * 채팅방 멤버 퇴장 시 트리거되는 Cloud Function
 *
 * 트리거 경로: /chat-rooms/{roomId}/members/{uid}
 *
 * 수행 작업:
 * 1. chat-rooms/{roomId}/members 아래의 모든 uid 읽기
 * 2. 모든 uid의 개수 세기 (true/false 구분 없이)
 * 3. memberCount 필드를 자동으로 감소
 *
 * 참고:
 * - members 필드에서 uid가 삭제되면 퇴장으로 간주
 * - onValueDeleted 트리거로 멤버 퇴장 감지
 * - memberCount는 members 객체의 모든 uid 개수 (true/false 모두 포함)
 *
 * 비즈니스 로직은 handlers/chat.handler.ts의 handleChatRoomMemberLeave() 참조
 */
export const onChatRoomMemberLeave = onValueDeleted(
  {
    ref: "/chat-rooms/{roomId}/members/{uid}",
    region: FIREBASE_REGION,
  },
  async (event) => {
    const roomId = event.params.roomId as string;
    const uid = event.params.uid as string;

    logger.info("채팅방 멤버 퇴장 감지", {
      roomId,
      uid,
    });

    // 비즈니스 로직 핸들러 호출
    return await handleChatRoomMemberLeave(roomId, uid);
  }
);



/**
 * 채팅방 핀 생성 시 트리거되는 Cloud Function
 *
 * 트리거 경로: /chat-joins/{uid}/{roomId}/pin
 * 트리거 조건: pin 필드가 생성될 때 (set(true))
 *
 * 수행 작업:
 * 1. chat-joins/{uid}/{roomId}의 모든 데이터 읽기
 * 2. xxxListOrder 또는 xxxChatListOrder로 끝나는 모든 필드 찾기
 * 3. 각 order 필드에 "500" prefix 추가
 *
 * 참고:
 * - Prefix 규칙: "500" (핀됨) > "200" (읽지 않음) > "" (읽음)
 * - 클라이언트는 pin: true로 설정
 * - Cloud Functions가 모든 order 필드를 자동으로 업데이트
 *
 * 비즈니스 로직은 handlers/chat.handler.ts의 handleChatRoomPinCreate() 참조
 */
export const onChatRoomPinCreate = onValueCreated(
  {
    ref: "/chat-joins/{uid}/{roomId}/pin",
    region: FIREBASE_REGION,
  },
  async (event) => {
    const uid = event.params.uid as string;
    const roomId = event.params.roomId as string;
    const pinValue = event.data.val() as boolean | null | undefined;

    logger.info("채팅방 핀 생성 감지", {
      uid,
      roomId,
      pinValue,
    });

    // pin 값이 true인 경우에만 처리
    if (pinValue !== true) {
      logger.warn("핀 값이 true가 아님, 처리 건너뜀", {
        uid,
        roomId,
        pinValue,
      });
      return;
    }

    // 비즈니스 로직 핸들러 호출
    return await handleChatRoomPinCreate(uid, roomId);
  }
);

/**
 * 채팅방 핀 삭제 시 트리거되는 Cloud Function
 *
 * 트리거 경로: /chat-joins/{uid}/{roomId}/pin
 * 트리거 조건: pin 필드가 삭제될 때 (set(null))
 *
 * 수행 작업:
 * 1. chat-joins/{uid}/{roomId}의 모든 데이터 읽기
 * 2. xxxListOrder 또는 xxxChatListOrder로 끝나는 모든 필드 찾기
 * 3. newMessageCount > 0이면 "200" prefix 추가
 * 4. newMessageCount === 0이면 prefix 제거 (순수 timestamp)
 *
 * 참고:
 * - Prefix 규칙: "500" (핀됨) > "200" (읽지 않음) > "" (읽음)
 * - 클라이언트는 pin 필드를 삭제 (set(null))
 * - Cloud Functions가 모든 order 필드를 자동으로 업데이트
 *
 * 비즈니스 로직은 handlers/chat.handler.ts의 handleChatRoomPinDelete() 참조
 */
export const onChatRoomPinDelete = onValueDeleted(
  {
    ref: "/chat-joins/{uid}/{roomId}/pin",
    region: FIREBASE_REGION,
  },
  async (event) => {
    const uid = event.params.uid as string;
    const roomId = event.params.roomId as string;
    const oldPinValue = event.data.val() as boolean | null | undefined;

    logger.info("채팅방 핀 삭제 감지", {
      uid,
      roomId,
      oldPinValue,
    });

    // 비즈니스 로직 핸들러 호출
    return await handleChatRoomPinDelete(uid, roomId);
  }
);

/**
 * 채팅 초대장 생성 시 트리거되는 Cloud Function
 *
 * 트리거 경로: /chat-invitations/{uid}/{roomId}
 * 트리거 조건: 초대장이 생성될 때
 *
 * 수행 작업:
 * 1. 채팅방 정보 조회 (roomName, roomType)
 * 2. 초대한 사람 정보 조회 (displayName)
 * 3. 초대받은 사람의 언어 코드 조회
 * 4. 초대 메시지 생성 (i18n 사용, 언어별)
 * 5. 초대장 정보 업데이트 (roomName, inviterName, message)
 * 6. FCM 푸시 알림 전송 (초대받은 사람의 언어로)
 *
 * 참고:
 * - 클라이언트는 최소한의 정보만 저장 (roomId, inviterUid, createdAt, invitationOrder)
 * - Cloud Functions가 나머지 정보를 자동으로 채움 (많은 작업을 백엔드에서 수행)
 * - 1:1 채팅방에 대한 초대는 자동으로 무시됨
 * - 이미 참여 중인 멤버에 대한 초대도 자동으로 무시됨
 *
 * 비즈니스 로직은 handlers/chat.handler.ts의 handleChatInvitationCreate() 참조
 */
export const onChatInvitationCreate = onValueCreated(
  {
    ref: "/chat-invitations/{uid}/{roomId}",
    region: FIREBASE_REGION,
  },
  async (event) => {
    const inviteeUid = event.params.uid as string;
    const roomId = event.params.roomId as string;
    const invitationData = (event.data.val() || {}) as {
      inviterUid?: string;
      createdAt?: number;
    };

    logger.info("채팅 초대장 생성 감지", {
      inviteeUid,
      roomId,
      inviterUid: invitationData.inviterUid,
    });

    // 비즈니스 로직 핸들러 호출
    return await handleChatInvitationCreate(inviteeUid, roomId, invitationData);
  }
);

/**
 * newMessageCount 필드 변경 시 트리거되는 Cloud Function
 *
 * 트리거 경로: /chat-joins/{uid}/{roomId}/newMessageCount
 * 트리거 이벤트: onValueWritten (생성, 수정, 삭제 모두 감지)
 *
 * 수행 작업:
 * 1. newMessageCount가 0으로 변경되었는지 확인
 * 2. 0이면 모든 xxxListOrder 필드에서 "200" prefix 제거
 * 3. "500" prefix는 유지 (핀 설정된 채팅방)
 * 4. 존재하지 않는 필드는 무시
 *
 * 참고:
 * - 사용자가 채팅방에 입장하여 메시지를 읽으면 newMessageCount가 0이 됨
 * - 이때 모든 order 필드를 "읽음" 상태로 전환
 * - Prefix 규칙: "500" (핀됨) > "200" (읽지 않음) > "" (읽음)
 *
 * 비즈니스 로직은 handlers/chat.handler.ts의 handleNewMessageCountWritten() 참조
 */
export const onNewMessageCountWrite = onValueWritten(
  {
    ref: "/chat-joins/{uid}/{roomId}/newMessageCount",
    region: FIREBASE_REGION,
  },
  async (event) => {
    const uid = event.params.uid as string;
    const roomId = event.params.roomId as string;
    const beforeValue = event.data.before.val() as number | null;
    const afterValue = event.data.after.val() as number | null;

    logger.info("newMessageCount 필드 변경 감지", {
      uid,
      roomId,
      beforeValue,
      afterValue,
    });

    // 비즈니스 로직 핸들러 호출
    return await handleNewMessageCountWritten(uid, roomId, beforeValue, afterValue);
  }
);

/**
 * 채팅 메시지 카테고리 필드 생성 시 트리거
 *
 * 트리거 경로: /chat-messages/{messageId}/category
 * 트리거 이벤트: onValueCreated (카테고리가 처음 생성될 때만 트리거)
 *
 * 수행 작업:
 * 1. 카테고리 유효성 검사
 * 2. categoryOrder 필드 자동 생성: "{category}-{timestamp}"
 * 3. allCategoryOrder 필드 자동 생성: timestamp (모든 카테고리 글 목록용)
 * 4. type 필드 자동 생성: "post" (게시글 타입 표시)
 * 5. 메시지 노드에 categoryOrder, allCategoryOrder, type 필드 업데이트
 * 6. stats/counters/post 증가 (+1) - 새 게시글 생성
 *
 * 참고:
 * - 클라이언트는 category 필드만 저장
 * - Cloud Functions가 categoryOrder, allCategoryOrder, type을 자동 생성
 * - categoryOrder 형식: "qna-1234567890"
 * - 이를 통해 카테고리별 메시지 목록을 효율적으로 쿼리 가능
 *
 * 비즈니스 로직은 handlers/chat.message-category.handler.ts의 handleChatMessageCategoryCreate() 참조
 */
export const onChatMessageCategoryCreate = onValueCreated(
  {
    ref: "/chat-messages/{roomId}/{messageId}/category",
    region: FIREBASE_REGION,
  },
  async (event) => {
    const roomId = event.params.roomId as string;
    const messageId = event.params.messageId as string;
    const category = event.data.val() as string;

    // 메시지의 createdAt 필드를 읽어오기
    const messageRef = admin.database().ref(`chat-messages/${roomId}/${messageId}`);
    const messageSnapshot = await messageRef.once("value");
    const messageData = messageSnapshot.val() as ChatMessage | null;
    const createdAt = messageData?.createdAt;

    logger.info("채팅 메시지 카테고리 필드 생성 감지", {
      roomId,
      messageId,
      category,
      createdAt,
    });

    // 비즈니스 로직 핸들러 호출
    // - categoryOrder, allCategoryOrder, type 필드 자동 생성
    // - stats/counters/post 자동 증가 (새 게시글 생성)
    await handleChatMessageCategoryCreate(roomId, messageId, category, createdAt);

    return;
  }
);

/**
 * 채팅 메시지 카테고리 필드 수정 시 트리거
 *
 * 트리거 경로: /chat-messages/{messageId}/category
 * 트리거 이벤트: onValueUpdated (카테고리가 다른 값으로 변경될 때만 트리거)
 *
 * 수행 작업:
 * - 카테고리 수정 이벤트 로그만 남김
 * - categoryOrder, allCategoryOrder, type 필드는 업데이트하지 않음
 * - 클라이언트가 Firebase Security Rules를 통해 category 필드만 직접 수정
 *
 * 참고:
 * - 카테고리 변경 시 categoryOrder는 업데이트하지 않음 (기존 작성 시간과 정렬 순서 유지)
 * - Firebase Security Rules에서 category 필드만 업데이트 허용
 * - stats/counters/post 증가 없음 (기존 게시글 수정)
 *
 * 비즈니스 로직은 handlers/chat.message-category.handler.ts의 handleChatMessageCategoryUpdate() 참조
 */
export const onChatMessageCategoryUpdate = onValueUpdated(
  {
    ref: "/chat-messages/{roomId}/{messageId}/category",
    region: FIREBASE_REGION,
  },
  async (event) => {
    const roomId = event.params.roomId as string;
    const messageId = event.params.messageId as string;
    const category = event.data.after.val() as string;
    const previousCategory = event.data.before.val() as string;

    logger.info("채팅 메시지 카테고리 필드 수정 감지", {
      roomId,
      messageId,
      category,
      previousCategory,
    });

    // 비즈니스 로직 핸들러 호출
    // - categoryOrder는 업데이트하지 않음 (기존 작성 시간 유지)
    // - 클라이언트가 Firebase Security Rules를 통해 category 필드만 직접 수정
    // - 핸들러는 로그만 남김 (업데이트 작업 없음)
    await handleChatMessageCategoryUpdate(roomId, messageId, category);

    return;
  }
);

/**
 * 채팅 메시지 카테고리 필드 삭제 시 트리거
 *
 * 트리거 경로: /chat-messages/{messageId}/category
 * 트리거 이벤트: onValueDeleted (카테고리가 삭제될 때만 트리거)
 *
 * 수행 작업:
 * 1. categoryOrder, allCategoryOrder, type 필드 모두 삭제
 * 2. 게시글에서 일반 채팅 메시지로 변환
 *
 * 참고:
 * - 카테고리 삭제 시 게시글 관련 모든 필드 삭제
 * - 일반 채팅 메시지로 전환됨
 *
 * 비즈니스 로직은 handlers/chat.message-category.handler.ts의 handleChatMessageCategoryDelete() 참조
 */
export const onChatMessageCategoryDelete = onValueDeleted(
  {
    ref: "/chat-messages/{roomId}/{messageId}/category",
    region: FIREBASE_REGION,
  },
  async (event) => {
    const roomId = event.params.roomId as string;
    const messageId = event.params.messageId as string;

    logger.info("채팅 메시지 카테고리 필드 삭제 감지", {
      roomId,
      messageId,
    });

    // 비즈니스 로직 핸들러 호출
    // - categoryOrder, allCategoryOrder, type 필드 모두 삭제
    await handleChatMessageCategoryDelete(roomId, messageId);

    return;
  }
);

/**
 * 채팅 메시지 text 필드 수정 시 게시글로 동기화하는 트리거
 *
 * 트리거 경로: /chat-messages/{roomId}/{messageId}/text
 * 트리거 이벤트: onValueUpdated (text가 다른 값으로 변경될 때만 트리거)
 *
 * 수행 작업:
 * 1. 채팅 메시지에서 postId 조회
 * 2. postId가 있으면 (게시글로 저장된 메시지인 경우)
 * 3. /posts/{postId}/text를 동일한 값으로 업데이트
 *
 * 참고:
 * - postId가 없으면 일반 채팅 메시지이므로 동기화하지 않음
 * - 게시글 → 채팅 메시지 방향 동기화는 onPostTextUpdate 트리거 참조
 *
 * 비즈니스 로직은 handlers/chat.message-sync.handler.ts의 handleChatMessageTextUpdate() 참조
 */
export const onChatMessageTextUpdate = onValueUpdated(
  {
    ref: "/chat-messages/{roomId}/{messageId}/text",
    region: FIREBASE_REGION,
  },
  async (event) => {
    const roomId = event.params.roomId as string;
    const messageId = event.params.messageId as string;
    const newText = event.data.after.val() as string | null;

    logger.info("채팅 메시지 text 필드 수정 감지", {
      roomId,
      messageId,
      newText,
    });

    // 비즈니스 로직 핸들러 호출
    // - postId가 있으면 게시글로 동기화
    await handleChatMessageTextUpdate(roomId, messageId, newText);

    return;
  }
);

/**
 * 채팅 메시지 urls 필드 수정 시 게시글로 동기화하는 트리거
 *
 * 트리거 경로: /chat-messages/{roomId}/{messageId}/urls
 * 트리거 이벤트: onValueUpdated (urls가 다른 값으로 변경될 때만 트리거)
 *
 * 수행 작업:
 * 1. 채팅 메시지에서 postId 조회
 * 2. postId가 있으면 (게시글로 저장된 메시지인 경우)
 * 3. /posts/{postId}/urls를 동일한 값으로 업데이트
 *
 * 참고:
 * - postId가 없으면 일반 채팅 메시지이므로 동기화하지 않음
 * - 게시글 → 채팅 메시지 방향 동기화는 onPostUrlsUpdate 트리거 참조
 *
 * 비즈니스 로직은 handlers/chat.message-sync.handler.ts의 handleChatMessageUrlsUpdate() 참조
 */
export const onChatMessageUrlsUpdate = onValueUpdated(
  {
    ref: "/chat-messages/{roomId}/{messageId}/urls",
    region: FIREBASE_REGION,
  },
  async (event) => {
    const roomId = event.params.roomId as string;
    const messageId = event.params.messageId as string;
    const newUrls = event.data.after.val() as Record<number, string> | null;

    logger.info("채팅 메시지 urls 필드 수정 감지", {
      roomId,
      messageId,
      newUrls,
    });

    // 비즈니스 로직 핸들러 호출
    // - postId가 있으면 게시글로 동기화
    await handleChatMessageUrlsUpdate(roomId, messageId, newUrls);

    return;
  }
);

/**
 * 게시글 text 필드 수정 시 채팅 메시지로 동기화하는 트리거
 *
 * 트리거 경로: /posts/{postId}/text
 * 트리거 이벤트: onValueUpdated (text가 다른 값으로 변경될 때만 트리거)
 *
 * 수행 작업:
 * 1. 게시글에서 roomId, messageId 조회
 * 2. roomId, messageId가 있으면
 * 3. /chat-messages/{roomId}/{messageId}/text를 동일한 값으로 업데이트
 *
 * 참고:
 * - roomId, messageId가 없으면 채팅 메시지와 연결되지 않은 독립 게시글
 * - 채팅 메시지 → 게시글 방향 동기화는 onChatMessageTextUpdate 트리거 참조
 *
 * 비즈니스 로직은 handlers/chat.message-sync.handler.ts의 handlePostTextUpdate() 참조
 */
export const onPostTextUpdate = onValueUpdated(
  {
    ref: "/posts/{postId}/text",
    region: FIREBASE_REGION,
  },
  async (event) => {
    const postId = event.params.postId as string;
    const newText = event.data.after.val() as string | null;

    logger.info("게시글 text 필드 수정 감지", {
      postId,
      newText,
    });

    // 비즈니스 로직 핸들러 호출
    // - roomId, messageId가 있으면 채팅 메시지로 동기화
    await handlePostTextUpdate(postId, newText);

    return;
  }
);

/**
 * 게시글 urls 필드 수정 시 채팅 메시지로 동기화하는 트리거
 *
 * 트리거 경로: /posts/{postId}/urls
 * 트리거 이벤트: onValueUpdated (urls가 다른 값으로 변경될 때만 트리거)
 *
 * 수행 작업:
 * 1. 게시글에서 roomId, messageId 조회
 * 2. roomId, messageId가 있으면
 * 3. /chat-messages/{roomId}/{messageId}/urls를 동일한 값으로 업데이트
 *
 * 참고:
 * - roomId, messageId가 없으면 채팅 메시지와 연결되지 않은 독립 게시글
 * - 채팅 메시지 → 게시글 방향 동기화는 onChatMessageUrlsUpdate 트리거 참조
 *
 * 비즈니스 로직은 handlers/chat.message-sync.handler.ts의 handlePostUrlsUpdate() 참조
 */
export const onPostUrlsUpdate = onValueUpdated(
  {
    ref: "/posts/{postId}/urls",
    region: FIREBASE_REGION,
  },
  async (event) => {
    const postId = event.params.postId as string;
    const newUrls = event.data.after.val() as Record<number, string> | null;

    logger.info("게시글 urls 필드 수정 감지", {
      postId,
      newUrls,
    });

    // 비즈니스 로직 핸들러 호출
    // - roomId, messageId가 있으면 채팅 메시지로 동기화
    await handlePostUrlsUpdate(postId, newUrls);

    return;
  }
);

/**
 * 채팅방 비밀번호 검증 트리거
 *
 * 트리거 경로: /chat-room-passwords/{roomId}/try/{uid}
 * 트리거 이벤트: onValueWritten
 *
 * 수행 작업:
 * 1. try 경로에 기록된 비밀번호 읽기
 * 2. 실제 비밀번호와 비교 (Plain Text)
 * 3. 일치 시 members에 추가, 불일치 시 에러 로그
 * 4. try 경로 즉시 삭제 (보안)
 */
export { onPasswordTry } from "./handlers/chat.password-verification.handler";

/**
 * 댓글 생성 시 트리거되는 Cloud Function
 *
 * 트리거 경로: /comments/{postId}/{commentId}
 * 트리거 이벤트: onValueCreated (댓글 생성 시)
 *
 * 수행 작업:
 * 1. 게시글의 totalChildCount를 ServerValue.increment(1)로 +1 증가 (모든 댓글)
 * 2. parentId가 null이면 (최상위 댓글):
 *    - 게시글의 childCount도 ServerValue.increment(1)로 +1 증가
 * 3. parentId가 존재하면 (대댓글):
 *    - 부모 댓글의 childCount를 ServerValue.increment(1)로 +1 증가
 * 4. stats/counters/comment를 ServerValue.increment(1)로 +1 증가 (전체 댓글 통계)
 *
 * 참고:
 * - totalChildCount: 게시글의 총 댓글 수 (모든 레벨 포함)
 * - childCount: 첫번째 레벨 댓글 수 또는 특정 댓글의 직접 자식 댓글 수
 * - ServerValue.increment 사용으로 동시성 문제 해결 (여러 사용자가 동시에 댓글 작성 가능)
 * - stats/counters/comment는 오른쪽 사이드바의 "실시간 통계 - 댓글 수"에 실시간으로 표시됨
 *
 * 비즈니스 로직은 handlers/comment.create.handler.ts의 handleCommentCreate() 참조
 */
export const onCommentCreate = onValueCreated(
  {
    ref: "/comments/{postId}/{commentId}",
    region: FIREBASE_REGION,
  },
  async (event) => {
    const postId = event.params.postId as string;
    const commentId = event.params.commentId as string;
    const commentData = (event.data.val() || {}) as Record<string, unknown>;

    logger.info("댓글 생성 감지", {
      postId,
      commentId,
      parentId: commentData.parentId ?? null,
    });

    // 비즈니스 로직 핸들러 호출
    // - 게시글의 totalChildCount 증가 (모든 댓글)
    // - 최상위 댓글이면 게시글의 childCount도 증가
    // - 대댓글이면 부모 댓글의 childCount 증가
    // - stats/counters/comment 증가 (전체 댓글 통계)
    await handleCommentCreate(postId, commentId, commentData);

    return;
  }
);

/**
 * 좋아요 추가 시 likeCount를 자동 관리합니다.
 *
 * 트리거 경로: /likes/{uid}/{targetId}
 */
export const onLikeCreated = onValueCreated(
  {
    ref: "/likes/{uid}/{targetId}",
    region: FIREBASE_REGION,
  },
  async (event) => {
    const uid = event.params.uid as string;
    const targetId = event.params.targetId as string;
    const targetType = event.data.val() as LikeTargetType | null;

    // targetType 검증:
    // - 'message', 'comment', 'post' 허용
    // - 'chat-message-{roomId}' 형식 허용 (예: 'chat-message-post')
    // - 'comment-{postId}' 형식 허용 (예: 'comment--OeWL2LIT-keSpjunojV')
    if (
      targetType !== "message" &&
      targetType !== "comment" &&
      targetType !== "post" &&
      !(typeof targetType === "string" && targetType.startsWith("chat-message-")) &&
      !(typeof targetType === "string" && targetType.startsWith("comment-"))
    ) {
      logger.error("잘못된 좋아요 타입입니다.", {
        uid,
        targetId,
        targetType,
      });
      return;
    }

    await handleLikeCreate(uid, targetId, targetType);
  }
);

/**
 * 좋아요 취소 시 likeCount를 감소시킵니다.
 *
 * 트리거 경로: /likes/{uid}/{targetId}
 */
export const onLikeDeleted = onValueDeleted(
  {
    ref: "/likes/{uid}/{targetId}",
    region: FIREBASE_REGION,
  },
  async (event) => {
    const uid = event.params.uid as string;
    const targetId = event.params.targetId as string;
    const targetType = event.data.val() as LikeTargetType | null;

    // targetType 검증:
    // - 'message', 'comment', 'post' 허용
    // - 'chat-message-{roomId}' 형식 허용 (예: 'chat-message-post')
    // - 'comment-{postId}' 형식 허용 (예: 'comment--OeWL2LIT-keSpjunojV')
    if (
      targetType !== "message" &&
      targetType !== "comment" &&
      targetType !== "post" &&
      !(typeof targetType === "string" && targetType.startsWith("chat-message-")) &&
      !(typeof targetType === "string" && targetType.startsWith("comment-"))
    ) {
      logger.error("잘못된 좋아요 타입입니다.", {
        uid,
        targetId,
        targetType,
      });
      return;
    }

    await handleLikeDelete(uid, targetId, targetType);
  }
);

/**
 * 팔로잉 관계 생성 시 트리거되는 Cloud Function
 *
 * 트리거 경로: /user-following/{followerUid}/{followingUid}
 * 트리거 이벤트: onValueCreated (팔로우 시)
 *
 * 수행 작업:
 * 1. 자기 자신을 팔로우하는지 검증 (자기 자신 팔로우 불가)
 * 2. /user-followers/{followingUid}/{followerUid} = true 설정 (역참조)
 * 3. 향후: followingUid에게 알림 전송 (현재는 구현하지 않음)
 *
 * 참고:
 * - A가 B를 팔로우 → /user-following/A/B = true
 * - Cloud Functions 트리거 → /user-followers/B/A = true 자동 생성
 *
 * 비즈니스 로직은 handlers/friend.follow.handler.ts의 handleFollowingCreate() 참조
 */
export const onUserFollowingCreate = onValueCreated(
  {
    ref: "/user-following/{followerUid}/{followingUid}",
    region: FIREBASE_REGION,
  },
  async (event) => {
    const followerUid = event.params.followerUid as string;
    const followingUid = event.params.followingUid as string;

    logger.info("팔로잉 관계 생성 감지", {
      followerUid,
      followingUid,
    });

    // 비즈니스 로직 핸들러 호출
    // - /user-followers/{followingUid}/{followerUid} = true 설정
    await handleFollowingCreate(followerUid, followingUid);

    return;
  }
);

/**
 * 팔로잉 관계 삭제 시 트리거되는 Cloud Function
 *
 * 트리거 경로: /user-following/{followerUid}/{followingUid}
 * 트리거 이벤트: onValueDeleted (언팔로우 시)
 *
 * 수행 작업:
 * 1. /user-followers/{followingUid}/{followerUid} 삭제 (역참조 제거)
 *
 * 참고:
 * - A가 B를 언팔로우 → /user-following/A/B 삭제
 * - Cloud Functions 트리거 → /user-followers/B/A 자동 삭제
 *
 * 비즈니스 로직은 handlers/friend.follow.handler.ts의 handleFollowingDelete() 참조
 */
export const onUserFollowingDelete = onValueDeleted(
  {
    ref: "/user-following/{followerUid}/{followingUid}",
    region: FIREBASE_REGION,
  },
  async (event) => {
    const followerUid = event.params.followerUid as string;
    const followingUid = event.params.followingUid as string;

    logger.info("팔로잉 관계 삭제 감지", {
      followerUid,
      followingUid,
    });

    // 비즈니스 로직 핸들러 호출
    // - /user-followers/{followingUid}/{followerUid} 삭제
    await handleFollowingDelete(followerUid, followingUid);

    return;
  }
);

/**
 * 채팅 메시지 삭제 시 트리거되는 Cloud Function
 *
 * 트리거 경로: /chat-messages/{messageId}/deleted
 * 트리거 이벤트: onValueWritten (deleted 필드 생성 시)
 *
 * 수행 작업:
 * 1. deleted 값이 true인지 확인
 * 2. 작성자의 /user-followers 목록 조회
 * 3. 각 팔로워의 /user-feed/{followerUid}/{messageId} 삭제
 * 4. 작성자 본인의 피드에서도 제거 (/user-feed/{authorUid}/{messageId} 삭제)
 * 5. Multi-path update로 한 번에 모든 피드 삭제 (null 설정)
 *
 * 참고:
 * - B가 글 삭제 → /chat-messages/{messageId}/deleted = true
 * - Cloud Functions 트리거 → 모든 팔로워의 피드에서 해당 messageId 제거
 * - Fan-out된 피드 데이터 일괄 정리
 *
 * 비즈니스 로직은 handlers/feed.fanout.handler.ts의 handleMessageDeletedFanout() 참조
 */
export const onChatMessageDeleted = onValueWritten(
  {
    ref: "/chat-messages/{roomId}/{messageId}/deleted",
    region: FIREBASE_REGION,
  },
  async (event) => {
    const roomId = event.params.roomId as string;
    const messageId = event.params.messageId as string;
    const beforeValue = event.data.before.val() as boolean | null;
    const afterValue = event.data.after.val() as boolean | null;

    logger.info("채팅 메시지 deleted 필드 변경 감지", {
      roomId,
      messageId,
      beforeValue,
      afterValue,
    });

    // deleted가 true로 설정된 경우에만 처리
    if (afterValue !== true) {
      logger.info("deleted 값이 true가 아님, 처리 건너뜀", {
        messageId,
        afterValue,
      });
      return;
    }

    // 메시지 데이터에서 senderUid(작성자 UID) 조회
    const messageRef = admin.database().ref(`chat-messages/${roomId}/${messageId}`);
    const messageSnapshot = await messageRef.once("value");
    const messageData = messageSnapshot.val();

    if (messageData && messageData.senderUid) {
      const authorUid = messageData.senderUid;

      logger.info("피드 fan-out 제거 시작", {
        messageId,
        authorUid,
      });

      // 비즈니스 로직 핸들러 호출
      // - 모든 팔로워의 피드에서 해당 messageId 제거
      await handleMessageDeletedFanout(messageId, authorUid);

      logger.info("피드 fan-out 제거 완료", {
        messageId,
        authorUid,
      });
    } else {
      logger.warn("메시지 데이터에 senderUid가 없어 fan-out 제거를 건너뜁니다", {
        messageId,
        messageData,
      });
    }

    return;
  }
);

/**
 * /posts/{postId} onCreate 트리거
 *
 * 게시글이 /posts/에 직접 생성될 때 실행됩니다.
 *
 * 처리 내용:
 * 1. stats/counters/post 증가 (전체 게시글 통계)
 * 2. 팔로워 피드에 fan-out (/user-feed/{followerUid}/{postId})
 *
 * 참고:
 * - PostCreateDialog.svelte에서 /posts/에 직접 저장
 * - fan-out은 기존 handleMessageCategoryCreateFanout 재사용
 * - postId를 messageId 파라미터로 전달하여 fan-out 수행
 */
export const onPostCreate = onValueCreated(
  {
    ref: "/posts/{postId}",
    region: FIREBASE_REGION,
  },
  async (event) => {
    const postId = event.params.postId as string;
    const postData = event.data.val();

    logger.info("게시글 생성 감지", {
      postId,
      postData,
    });

    if (!postData) {
      logger.warn("게시글 데이터가 없습니다", {postId});
      return;
    }

    // 비즈니스 로직 핸들러 호출
    await handlePostCreateLogic(postId, postData);

    return;
  }
);

/**
 * ============================================================================
 * 통계 및 인플루언서 순위 관련 트리거
 * ============================================================================
 */

/**
 * 좋아요 생성 시 통계 업데이트 트리거
 *
 * 트리거 경로: /likes/{uid}/{targetId}
 * 트리거 이벤트: onValueCreated
 *
 * 수행 작업:
 * 1. 대상 작성자의 receivedLikes 통계 증가 (일별/월별/연도별/전체)
 * 2. 자기 자신에게 한 좋아요는 통계에서 제외
 * 3. 인플루언서 점수 재계산
 */
export const onLikeCreatedStats = onValueCreated(
  {
    ref: "/likes/{uid}/{targetId}",
    region: FIREBASE_REGION,
  },
  async (event) => {
    const likerUid = event.params.uid as string;
    const targetId = event.params.targetId as string;
    // 좋아요 데이터는 문자열로 저장됨 (예: "post", "comment", "chat-message-roomId")
    const targetType = event.data.val() as string;

    logger.info("좋아요 생성 통계 트리거", {
      likerUid,
      targetId,
      targetType,
    });

    // 통계 핸들러 호출 (객체 형태로 전달)
    await handleLikeCreateStats(likerUid, targetId, { targetType, createdAt: Date.now() });

    return;
  }
);

/**
 * 좋아요 삭제 시 통계 업데이트 트리거
 *
 * 트리거 경로: /likes/{uid}/{targetId}
 * 트리거 이벤트: onValueDeleted
 *
 * 수행 작업:
 * 1. 대상 작성자의 receivedLikes 통계 감소 (일별/월별/연도별/전체)
 * 2. 자기 자신에게 한 좋아요는 통계에서 제외
 * 3. 인플루언서 점수 재계산
 */
export const onLikeDeletedStats = onValueDeleted(
  {
    ref: "/likes/{uid}/{targetId}",
    region: FIREBASE_REGION,
  },
  async (event) => {
    const likerUid = event.params.uid as string;
    const targetId = event.params.targetId as string;
    // 좋아요 데이터는 문자열로 저장됨 (예: "post", "comment", "chat-message-roomId")
    const targetType = event.data.val() as string;

    logger.info("좋아요 삭제 통계 트리거", {
      likerUid,
      targetId,
      targetType,
    });

    // 통계 핸들러 호출 (객체 형태로 전달)
    await handleLikeDeleteStats(likerUid, targetId, { targetType });

    return;
  }
);

/**
 * 댓글 생성 시 통계 업데이트 트리거
 *
 * 트리거 경로: /comments/{postId}/{commentId}
 * 트리거 이벤트: onValueCreated
 *
 * 수행 작업:
 * 1. 댓글 작성자의 createdComments 통계 증가
 * 2. 게시글/댓글 작성자의 receivedComments 통계 증가 (일별/월별/연도별/전체)
 * 3. 자기 자신에게 한 댓글은 통계에서 제외
 * 4. 인플루언서 점수 재계산
 */
export const onCommentCreateStats = onValueCreated(
  {
    ref: "/comments/{postId}/{commentId}",
    region: FIREBASE_REGION,
  },
  async (event) => {
    const postId = event.params.postId as string;
    const commentId = event.params.commentId as string;
    const commentData = (event.data.val() || {}) as Record<string, unknown>;

    logger.info("댓글 생성 통계 트리거", {
      postId,
      commentId,
      authorUid: commentData.authorUid,
      parentId: commentData.parentId,
    });

    // 통계 핸들러 호출
    await handleCommentCreateStats(postId, commentId, commentData);

    return;
  }
);

/**
 * 댓글 삭제 시 통계 업데이트 트리거
 *
 * 트리거 경로: /comments/{postId}/{commentId}
 * 트리거 이벤트: onValueDeleted
 *
 * 수행 작업:
 * 1. 댓글 작성자의 createdComments 통계 감소
 * 2. 게시글/댓글 작성자의 receivedComments 통계 감소 (일별/월별/연도별/전체)
 * 3. 자기 자신에게 한 댓글은 통계에서 제외
 * 4. 인플루언서 점수 재계산
 */
export const onCommentDeleteStats = onValueDeleted(
  {
    ref: "/comments/{postId}/{commentId}",
    region: FIREBASE_REGION,
  },
  async (event) => {
    const postId = event.params.postId as string;
    const commentId = event.params.commentId as string;
    const commentData = (event.data.val() || {}) as Record<string, unknown>;

    logger.info("댓글 삭제 통계 트리거", {
      postId,
      commentId,
      authorUid: commentData.authorUid,
      parentId: commentData.parentId,
    });

    // 통계 핸들러 호출
    await handleCommentDeleteStats(postId, commentId, commentData);

    return;
  }
);

/**
 * 게시글 생성 시 통계 업데이트 트리거
 *
 * 트리거 경로: /posts/{postId}
 * 트리거 이벤트: onValueCreated
 *
 * 수행 작업:
 * 1. 작성자의 createdPosts 통계 증가 (일별/월별/연도별/전체)
 */
export const onPostCreateStats = onValueCreated(
  {
    ref: "/posts/{postId}",
    region: FIREBASE_REGION,
  },
  async (event) => {
    const postId = event.params.postId as string;
    const postData = (event.data.val() || {}) as Record<string, unknown>;

    logger.info("게시글 생성 통계 트리거", {
      postId,
      authorUid: postData.authorUid,
    });

    // 통계 핸들러 호출
    await handlePostCreateStats(postId, postData);

    return;
  }
);

/**
 * 게시글 삭제 시 통계 업데이트 트리거
 *
 * 트리거 경로: /posts/{postId}
 * 트리거 이벤트: onValueDeleted
 *
 * 수행 작업:
 * 1. 작성자의 createdPosts 통계 감소 (일별/월별/연도별/전체)
 */
export const onPostDeleteStats = onValueDeleted(
  {
    ref: "/posts/{postId}",
    region: FIREBASE_REGION,
  },
  async (event) => {
    const postId = event.params.postId as string;
    const postData = (event.data.val() || {}) as Record<string, unknown>;

    logger.info("게시글 삭제 통계 트리거", {
      postId,
      authorUid: postData.authorUid,
    });

    // 통계 핸들러 호출
    await handlePostDeleteStats(postId, postData);

    return;
  }
);

/**
 * 게시글 좋아요 수 변경 시 인기 순위 업데이트 트리거
 *
 * 트리거 경로: /posts/{postId}/likeCount
 * 트리거 이벤트: onValueWritten
 *
 * 수행 작업:
 * 1. 게시글의 좋아요 수와 댓글 수를 기반으로 점수 계산
 * 2. 일별/주별/월별 인기 순위 업데이트
 */
export const onPostLikeCountWritten = onValueWritten(
  {
    ref: "/posts/{postId}/likeCount",
    region: FIREBASE_REGION,
  },
  async (event) => {
    const postId = event.params.postId as string;

    logger.info("게시글 좋아요 수 변경 트리거", {postId});

    // 인기 순위 업데이트 핸들러 호출
    await handlePostRankingUpdate(postId);

    return;
  }
);

/**
 * 게시글 댓글 수 변경 시 인기 순위 업데이트 트리거
 *
 * 트리거 경로: /posts/{postId}/commentCount
 * 트리거 이벤트: onValueWritten
 *
 * 수행 작업:
 * 1. 게시글의 좋아요 수와 댓글 수를 기반으로 점수 계산
 * 2. 일별/주별/월별 인기 순위 업데이트
 */
export const onPostCommentCountWritten = onValueWritten(
  {
    ref: "/posts/{postId}/commentCount",
    region: FIREBASE_REGION,
  },
  async (event) => {
    const postId = event.params.postId as string;

    logger.info("게시글 댓글 수 변경 트리거", {postId});

    // 인기 순위 업데이트 핸들러 호출
    await handlePostRankingUpdate(postId);

    return;
  }
);

/**
 * 게시글 전체 댓글 수 변경 시 인기 순위 업데이트 트리거
 *
 * 트리거 경로: /posts/{postId}/totalChildCount
 * 트리거 이벤트: onValueWritten
 *
 * 수행 작업:
 * 1. 게시글의 좋아요 수와 댓글 수를 기반으로 점수 계산
 * 2. 일별/주별/월별 인기 순위 업데이트
 */
export const onPostTotalChildCountWritten = onValueWritten(
  {
    ref: "/posts/{postId}/totalChildCount",
    region: FIREBASE_REGION,
  },
  async (event) => {
    const postId = event.params.postId as string;

    logger.info("게시글 전체 댓글 수 변경 트리거", {postId});

    // 인기 순위 업데이트 핸들러 호출
    await handlePostRankingUpdate(postId);

    return;
  }
);

/**
 * 팔로우 생성 시 통계 업데이트 트리거
 *
 * 트리거 경로: /user-following/{followerUid}/{followingUid}
 * 트리거 이벤트: onValueCreated
 *
 * 수행 작업:
 * 1. 팔로우를 받은 사용자의 receivedFollowers 통계 증가 (일별/월별/연도별/전체)
 * 2. 인플루언서 점수 재계산
 */
export const onUserFollowingCreateStats = onValueCreated(
  {
    ref: "/user-following/{followerUid}/{followingUid}",
    region: FIREBASE_REGION,
  },
  async (event) => {
    const followerUid = event.params.followerUid as string;
    const followingUid = event.params.followingUid as string;

    logger.info("팔로우 생성 통계 트리거", {
      followerUid,
      followingUid,
    });

    // 통계 핸들러 호출
    await handleFollowCreateStats(followerUid, followingUid);

    return;
  }
);

/**
 * 팔로우 삭제 시 통계 업데이트 트리거
 *
 * 트리거 경로: /user-following/{followerUid}/{followingUid}
 * 트리거 이벤트: onValueDeleted
 *
 * 수행 작업:
 * 1. 팔로우를 받았던 사용자의 receivedFollowers 통계 감소 (일별/월별/연도별/전체)
 * 2. 인플루언서 점수 재계산
 */
export const onUserFollowingDeleteStats = onValueDeleted(
  {
    ref: "/user-following/{followerUid}/{followingUid}",
    region: FIREBASE_REGION,
  },
  async (event) => {
    const followerUid = event.params.followerUid as string;
    const followingUid = event.params.followingUid as string;

    logger.info("팔로우 삭제 통계 트리거", {
      followerUid,
      followingUid,
    });

    // 통계 핸들러 호출
    await handleFollowDeleteStats(followerUid, followingUid);

    return;
  }
);

/**
 * 인플루언서 점수 변경 시 순위 업데이트 트리거
 *
 * 트리거 경로: /influencer-scores/{uid}
 * 트리거 이벤트: onValueWritten (생성, 수정, 삭제 모두 감지)
 *
 * 수행 작업:
 * 1. 일별/월별/연간/전체 인플루언서 순위 업데이트
 * 2. 점수를 역순(negative)으로 저장하여 내림차순 정렬 지원
 */
export const onInfluencerScoreWrite = onValueWritten(
  {
    ref: "/influencer-scores/{uid}",
    region: FIREBASE_REGION,
  },
  async (event) => {
    const uid = event.params.uid as string;
    const newScore = event.data.after.val() as number | null;

    logger.info("인플루언서 점수 변경 감지", {
      uid,
      newScore,
    });

    // 순위 핸들러 호출
    await handleInfluencerScoreChange(uid, newScore);

    return;
  }
);
