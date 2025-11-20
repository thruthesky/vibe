---
name: sonub-chat-invitation
title: 채팅 초대 시스템
version: 1.1.0
description: 그룹/오픈 채팅방 초대 및 수락/거절 시스템 사양
author: JaeHo Song
email: thruthesky@gmail.com
homepage: https://github.com/thruthesky/
license: GPL-3.0
dependencies:
  - sonub-chat-overview.md
  - sonub-firebase-database-structure.md
  - sonub-firebase-cloud-functions.md
tags:
  - chat
  - invitation
  - real-time
  - firebase-rtdb
  - cloud-functions
  - i18n
step: 21
priority: "***"
---

# 채팅 초대 시스템

## 개요

그룹 채팅방과 오픈 채팅방에서 친구를 초대할 수 있는 시스템을 구현합니다.
1:1 채팅방은 초대 기능이 없습니다.

**핵심 원칙:**
- 클라이언트는 최소한의 데이터만 저장
- Cloud Functions가 모든 데이터를 보강(enrich)
- 사용자 언어에 맞는 다국어 메시지 제공
- FCM 푸시 알림을 사용자 언어로 전송

## 데이터베이스 구조

상세한 데이터베이스 구조는 다음 문서를 참조하세요:
- [채팅 초대 데이터베이스 구조](./sonub-firebase-database-structure.md#채팅-초대-chat-invitations)

## Security Rules

```json
"chat-invitations": {
  "$uid": {
    ".read": "$uid === auth.uid",
    "$roomId": {
      ".write": "auth != null && (($uid === auth.uid && newData.val() === null) || (newData.val() !== null && root.child('chat-rooms').child($roomId).child('members').child(auth.uid).exists()))"
    },
    ".indexOn": ["invitationOrder"]
  }
}
```

**규칙 설명:**
- 읽기: 본인만 자신의 초대 목록을 읽을 수 있음
- 쓰기:
  - 본인이 초대를 삭제하는 경우 (수락/거절 시)
  - 채팅방 멤버가 다른 사용자를 초대하는 경우

## 워크플로우

### 1. 초대 생성

**클라이언트 코드:**
```typescript
async function inviteUserToChatRoom(
  db: Database,
  roomId: string,
  inviteeUid: string,
  inviterUid: string
): Promise<void> {
  const invitationRef = ref(db, `chat-invitations/${inviteeUid}/${roomId}`);

  // 클라이언트는 최소한의 데이터만 저장
  // Cloud Functions가 나머지 필드들을 자동으로 추가합니다
  await set(invitationRef, {
    roomId,
    inviterUid
    // Cloud Functions가 자동으로 추가하는 필드들:
    // - createdAt, invitationOrder
    // - roomName, roomType
    // - inviterName, message
  });
}
```

**Cloud Functions 트리거:**
```typescript
export const onChatInvitationCreate = onValueCreated(
  { ref: "/chat-invitations/{uid}/{roomId}" },
  async (event) => {
    const inviteeUid = event.params.uid;
    const roomId = event.params.roomId;
    const invitationData = event.data.val();

    // 1. 1:1 채팅방은 초대 불가
    if (isSingleChat(roomId)) {
      return { success: false };
    }

    // 2. 이미 참여한 멤버는 초대 불가
    const roomSnapshot = await admin.database()
      .ref(`chat-rooms/${roomId}`)
      .once("value");
    const roomData = roomSnapshot.val();

    if (roomData.members && roomData.members[inviteeUid] === true) {
      return { success: false };
    }

    // 3. 채팅방 정보 가져오기
    const roomName = roomData.name || "채팅방";
    const roomType = roomData.type;

    // 4. 초대자 정보 가져오기
    const inviterSnapshot = await admin.database()
      .ref(`users/${invitationData.inviterUid}`)
      .once("value");
    const inviterName = inviterSnapshot.val()?.displayName || "사용자";

    // 5. 초대받는 사람의 언어 코드 가져오기
    const inviteeSnapshot = await admin.database()
      .ref(`users/${inviteeUid}`)
      .once("value");
    const languageCode = inviteeSnapshot.val()?.languageCode || "en";

    // 6. 다국어 메시지 생성
    const message = t(languageCode, "chatInvitation.message", {
      inviterName,
      roomName
    });

    // 7. 초대 정보 보강
    const now = Date.now();
    await admin.database().ref().update({
      [`chat-invitations/${inviteeUid}/${roomId}/createdAt`]: now,
      [`chat-invitations/${inviteeUid}/${roomId}/invitationOrder`]: `-${now}`,
      [`chat-invitations/${inviteeUid}/${roomId}/roomName`]: roomName,
      [`chat-invitations/${inviteeUid}/${roomId}/roomType`]: roomType,
      [`chat-invitations/${inviteeUid}/${roomId}/inviterName`]: inviterName,
      [`chat-invitations/${inviteeUid}/${roomId}/message`]: message
    });

    // 8. FCM 푸시 알림 전송 (사용자 언어로)
    const tokens = await getFcmTokensByUid(inviteeUid);
    if (tokens.length > 0) {
      const title = t(languageCode, "chatInvitation.title");
      const body = t(languageCode, "chatInvitation.body", {
        inviterName,
        roomName
      });
      await sendFcmNotificationBatch(tokens, title, body, {
        type: "chat-invitation",
        roomId,
        inviterUid: invitationData.inviterUid
      });
    }

    return { success: true };
  }
);
```

### 2. 초대 수락

**클라이언트 코드:**
```typescript
async function acceptInvitation(
  db: Database,
  roomId: string,
  uid: string
): Promise<void> {
  // 1. 채팅방에 입장 (기존 함수 재사용)
  await joinChatRoom(db, roomId, uid);

  // 2. 초대 정보 삭제
  const invitationRef = ref(db, `chat-invitations/${uid}/${roomId}`);
  await remove(invitationRef);
}
```

**동작 과정:**
1. `joinChatRoom()`이 `/chat-rooms/{roomId}/members/{uid}: true` 설정
2. Cloud Functions `onChatRoomMemberJoin` 트리거 실행
3. `memberCount` 자동 증가
4. `/chat-joins/{uid}/{roomId}`에 채팅방 정보 자동 생성
5. 초대 정보 삭제

### 3. 초대 거절

**클라이언트 코드:**
```typescript
async function rejectInvitation(
  db: Database,
  roomId: string,
  uid: string
): Promise<void> {
  const invitationRef = ref(db, `chat-invitations/${uid}/${roomId}`);
  await remove(invitationRef);
}
```

**동작 과정:**
- 초대 정보만 삭제
- 채팅방 참여는 하지 않음

## UI 컴포넌트

### ChatInvitationList.svelte

채팅 목록 페이지 상단에 표시되는 초대 목록 컴포넌트입니다.

**위치:**
- `/Users/thruthesky/apps/sonub/src/lib/components/chat/ChatInvitationList.svelte`

**사용된 페이지:**
- `/src/routes/chat/list/+page.svelte` (1:1 채팅 목록)
- `/src/routes/chat/group-chat-list/+page.svelte` (그룹 채팅 목록)
- `/src/routes/chat/open-chat-list/+page.svelte` (오픈 채팅 목록)

**주요 기능:**
- DatabaseListView를 사용한 실시간 초대 목록 표시
- 수락/거절 버튼 제공
- 초대가 없으면 아무것도 표시하지 않음 (empty 상태 숨김)
- 초대 존재 여부를 별도 구독으로 확인하여, 데이터가 없을 때는 컴포넌트 자체를 렌더링하지 않아 상위 카드가 비지 않음
- 반응형 디자인 (모바일에서는 세로 레이아웃)

**코드 예시:**
```svelte
<script lang="ts">
  import DatabaseListView from '$lib/components/DatabaseListView.svelte';
  import { Button } from '$lib/components/ui/button';
  import { authStore } from '$lib/stores/auth.svelte';
  import { acceptInvitation, rejectInvitation } from '$lib/functions/chat.functions';
  import { rtdb } from '$lib/firebase';
  import { m } from '$lib/paraglide/messages';

  const invitationPath = $derived.by(() => {
    const uid = authStore.user?.uid;
    return uid ? `chat-invitations/${uid}` : '';
  });

  async function handleAccept(roomId: string) {
    const uid = authStore.user?.uid;
    if (!uid || !rtdb) return;
    await acceptInvitation(rtdb, roomId, uid);
  }

  async function handleReject(roomId: string) {
    const uid = authStore.user?.uid;
    if (!uid || !rtdb) return;
    await rejectInvitation(rtdb, roomId, uid);
  }
</script>

{#if authStore.isAuthenticated && invitationPath}
  <DatabaseListView
    path={invitationPath}
    pageSize={10}
    orderBy="invitationOrder"
    reverse={true}
  >
    {#snippet item(itemData)}
      <!-- 초대 카드 UI -->
      <div class="invitation-card">
        <p>{invitation.message}</p>
        <Button onclick={() => handleAccept(roomId)}>
          {m.chatAccept()}
        </Button>
        <Button onclick={() => handleReject(roomId)}>
          {m.chatReject()}
        </Button>
      </div>
    {/snippet}
  </DatabaseListView>
{/if}
```

### 채팅방 페이지 친구 초대 메뉴

**위치:**
- `/src/routes/chat/room/+page.svelte`

**추가된 기능:**
- 드롭다운 메뉴에 "친구 초대" 항목 추가
- UserSearchDialog 통합
- 그룹/오픈 채팅방에서만 표시 (1:1 채팅방은 숨김)

**코드 예시:**
```svelte
<script>
  import UserSearchDialog from '$lib/components/user/UserSearchDialog.svelte';
  import { inviteUserToChatRoom } from '$lib/functions/chat.functions';

  let inviteDialogOpen = $state(false);

  function handleInviteFriend() {
    inviteDialogOpen = true;
  }

  async function handleUserSelect(event) {
    const { uid } = event.detail;
    await inviteUserToChatRoom(rtdb, activeRoomId, uid, authStore.user.uid);
    alert(m.chatInvitationSent());
  }
</script>

<!-- 드롭다운 메뉴 -->
{#if !isSingleChat}
  <DropdownMenu.Item onclick={handleInviteFriend}>
    <span class="mr-2">👤</span>
    {m.chatInviteFriend()}
  </DropdownMenu.Item>
{/if}

<!-- 친구 초대 다이얼로그 -->
<UserSearchDialog
  bind:open={inviteDialogOpen}
  title={m.chatInviteFriend()}
  description={m.chatInviteToRoom()}
  showResults={true}
  on:userSelect={handleUserSelect}
/>
```

## i18n 다국어 지원

### Cloud Functions i18n 시스템

**위치:**
- `/Users/thruthesky/apps/sonub/firebase/functions/src/i18n.ts`

**지원 언어:**
- en (English) - 기본값
- ko (한국어)
- ja (日本語)
- zh (中文)

**번역 키:**
```typescript
{
  "chatInvitation.title": "채팅 초대",
  "chatInvitation.body": "{inviterName}님이 {roomName}에 초대하였습니다.",
  "chatInvitation.message": "{inviterName}님이 {roomName} 채팅방에 초대하였습니다."
}
```

**사용 예시:**
```typescript
import { t } from '../i18n';

const message = t("ko", "chatInvitation.message", {
  inviterName: "홍길동",
  roomName: "친구들 모임"
});
// 결과: "홍길동님이 친구들 모임 채팅방에 초대하였습니다."
```

### 클라이언트 i18n 메시지

**추가된 키:**
- `chatAccept`: "수락" / "Accept" / "承認" / "接受"
- `chatReject`: "거절" / "Reject" / "拒否" / "拒绝"
- `chatInviteFriend`: "친구 초대" / "Invite friend" / "友達を招待" / "邀请朋友"
- `chatInviteToRoom`: "이 채팅방에 친구를 초대하세요"
- `chatSearchUserToInvite`: "초대할 친구를 검색하세요"
- `chatInvitationSent`: "초대를 보냈습니다"

**파일 위치:**
- `/Users/thruthesky/apps/sonub/messages/ko.json`
- `/Users/thruthesky/apps/sonub/messages/en.json`
- `/Users/thruthesky/apps/sonub/messages/ja.json`
- `/Users/thruthesky/apps/sonub/messages/zh.json`

## 언어 코드 자동 저장

### 로그인 시 언어 감지

**위치:**
- `/Users/thruthesky/apps/sonub/src/lib/stores/auth.svelte.ts`

**동작 방식:**
1. 사용자가 로그인하면 `onAuthStateChanged` 트리거
2. `syncUserProfile()` 함수 실행
3. RTDB에 `languageCode` 필드가 없으면:
   - 브라우저 언어 감지 (`navigator.language`)
   - 지원 언어(en, ko, ja, zh) 확인
   - `/users/{uid}/languageCode`에 저장

**코드:**
```typescript
private detectBrowserLanguage(): string {
  const SUPPORTED_LANGUAGES = ['en', 'ko', 'ja', 'zh'];
  const DEFAULT_LANGUAGE = 'en';

  const browserLang = navigator.language || DEFAULT_LANGUAGE;
  const langCode = browserLang.substring(0, 2).toLowerCase();

  if (SUPPORTED_LANGUAGES.includes(langCode)) {
    return langCode;
  }
  return DEFAULT_LANGUAGE;
}

private async syncUserProfile(user: User) {
  const userRef = ref(rtdb, `users/${user.uid}`);
  const snapshot = await get(userRef);
  const existingData = snapshot.val() || {};

  const updates: Record<string, any> = {};

  // languageCode: 없을 때만 브라우저 언어로 동기화
  if (!existingData.languageCode) {
    const browserLang = this.detectBrowserLanguage();
    updates.languageCode = browserLang;
  }

  if (Object.keys(updates).length > 0) {
    await update(userRef, updates);
  }
}
```

## 핵심 설계 원칙

### 클라이언트와 백엔드의 역할 분리

**클라이언트 역할 (최소화):**
- 초대 생성 시: `roomId`, `inviterUid`, `createdAt`, `invitationOrder`만 저장
- 초대 수락/거절: 초대 삭제만 수행
- UI 렌더링 및 사용자 인터랙션 처리

**Cloud Functions 역할 (최대화):**
- 데이터 보강: `roomName`, `roomType`, `inviterName`, `message` 자동 추가
- 검증: 1:1 채팅방 초대 차단, 중복 초대 차단
- 언어 감지 및 다국어 메시지 생성
- FCM 푸시 알림 전송 (사용자 언어로)

**장점:**
1. 클라이언트 코드 단순화
2. 서버에서 데이터 일관성 보장
3. 보안 강화 (클라이언트가 조작 불가능)
4. N+1 쿼리 문제 방지

## 파일 구조

### Cloud Functions
```
firebase/functions/src/
├── types/index.ts                  # ChatInvitationData 타입 정의
├── i18n.ts                         # 다국어 시스템
├── handlers/chat.handler.ts        # handleChatInvitationCreate 함수
└── index.ts                        # onChatInvitationCreate 트리거
```

### 클라이언트
```
src/
├── lib/
│   ├── components/
│   │   ├── chat/
│   │   │   └── ChatInvitationList.svelte  # 초대 목록 컴포넌트
│   │   └── user/
│   │       └── UserSearchDialog.svelte    # 사용자 검색 다이얼로그
│   ├── functions/
│   │   └── chat.functions.ts              # 초대 관련 함수
│   └── stores/
│       └── auth.svelte.ts                 # 언어 코드 감지 및 저장
├── routes/
│   └── chat/
│       ├── list/+page.svelte              # 1:1 채팅 목록
│       ├── group-chat-list/+page.svelte   # 그룹 채팅 목록
│       ├── open-chat-list/+page.svelte    # 오픈 채팅 목록
│       └── room/+page.svelte              # 채팅방 (친구 초대 메뉴)
└── messages/                              # 다국어 파일
    ├── ko.json
    ├── en.json
    ├── ja.json
    └── zh.json
```

## 배포 정보

### Firebase Cloud Functions 배포

```bash
cd firebase/functions
npm run deploy
```

**배포 결과 (2024-11-14):**
```
✔ functions[onChatInvitationCreate(asia-southeast1)] Successful create operation.
✔ Deploy complete!
```

**배포된 함수:**
- `onChatInvitationCreate`: `/chat-invitations/{uid}/{roomId}` 생성 시 트리거

### Security Rules 배포

Security Rules는 `firebase/database.rules.json` 파일에 추가되었습니다.

```bash
firebase deploy --only database
```

## 테스트 시나리오

### 1. 초대 생성 테스트

**시나리오:**
1. 사용자 A가 그룹 채팅방 "친구들 모임"에 참여
2. 사용자 A가 사용자 B를 초대
3. 사용자 B의 `/chat-invitations/{B-uid}/room-abc123`에 초대 정보 생성
4. Cloud Functions가 자동으로 데이터 보강
5. 사용자 B에게 FCM 푸시 알림 전송 (B의 언어로)

**검증:**
- [ ] 초대 정보가 올바르게 생성되었는가?
- [ ] `roomName`, `roomType`, `inviterName`, `message` 필드가 추가되었는가?
- [ ] 푸시 알림이 사용자 B의 언어로 전송되었는가?

### 2. 초대 수락 테스트

**시나리오:**
1. 사용자 B가 초대를 수락
2. `/chat-rooms/{roomId}/members/{B-uid}: true` 설정
3. Cloud Functions가 `memberCount` 증가
4. `/chat-joins/{B-uid}/{roomId}`에 채팅방 정보 생성
5. `/chat-invitations/{B-uid}/{roomId}` 삭제

**검증:**
- [ ] 사용자 B가 채팅방 멤버로 추가되었는가?
- [ ] `memberCount`가 증가했는가?
- [ ] 초대 정보가 삭제되었는가?
- [ ] 채팅방 목록에 표시되는가?

### 3. 초대 거절 테스트

**시나리오:**
1. 사용자 B가 초대를 거절
2. `/chat-invitations/{B-uid}/{roomId}` 삭제

**검증:**
- [ ] 초대 정보가 삭제되었는가?
- [ ] 사용자 B는 채팅방 멤버가 아닌가?

### 4. 언어 코드 자동 저장 테스트

**시나리오:**
1. 브라우저 언어가 한국어(ko-KR)인 새 사용자 로그인
2. `/users/{uid}/languageCode: "ko"` 자동 저장
3. 이후 초대 메시지가 한국어로 생성됨

**검증:**
- [ ] `languageCode`가 자동으로 저장되었는가?
- [ ] 지원하는 언어(en, ko, ja, zh) 중 하나인가?
- [ ] 이미 `languageCode`가 있으면 덮어쓰지 않는가?

## 개선 사항 및 향후 과제

### 현재 구현된 기능
- ✅ 채팅방 초대 생성
- ✅ 초대 수락/거절
- ✅ 실시간 초대 목록 표시
- ✅ 다국어 메시지 (4개 언어)
- ✅ FCM 푸시 알림 (사용자 언어로)
- ✅ 브라우저 언어 자동 감지 및 저장
- ✅ Security Rules

### 향후 개선 사항
- [ ] 초대 만료 시간 설정 (예: 7일 후 자동 삭제)
- [ ] 초대 취소 기능 (초대한 사람이 취소)
- [ ] 초대 수락 시 알림 (초대한 사람에게)
- [ ] 초대 거절 사유 입력
- [ ] 초대 기록 보관 (수락/거절 이력)
- [ ] 대량 초대 기능 (여러 명 동시 초대)
- [ ] 초대 링크 생성 (URL로 공유)

## 참고 문서

- [채팅 시스템 개요](./sonub-chat-overview.md)
- [Firebase Cloud Functions](./sonub-firebase-cloud-functions.md)
- [Firebase Database Structure](./sonub-firebase-database-structure.md)
- [Chat Functions](./sonub-functions-chat-functions.md)

