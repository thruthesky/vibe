---
title: 채팅방 비밀번호 설정 기능
version: 1.4.0
step: 53
priority: **
dependencies:
  - sonub-chat-overview.md
  - sonub-firebase-database-structure.md
  - sonub-firebase-security-rules.md
  - sonub-firebase-cloud-functions.md
tags: [chat, password, security, firebase-rtdb, cloud-functions, svelte5, race-condition, flickering]
author: Claude Code
created: 2025-11-14
updated: 2025-11-16
status: completed
---

# 채팅방 비밀번호 설정 기능

## 1. 개요

### 1.1 목적
- 그룹/오픈 채팅방 관리자(owner)가 비밀번호를 설정하여 허가된 사용자만 채팅방에 입장할 수 있도록 제어합니다.
- Firebase Security Rules와 Cloud Functions를 결합하여 안전하고 확장 가능한 비밀번호 검증 시스템을 구축합니다.

### 1.2 핵심 기능
- ✅ Owner만 비밀번호 설정/변경/삭제 가능
- ✅ 비밀번호 설정 시 신규 사용자 입장 차단 (Security Rules)
- ✅ Cloud Functions 기반 비밀번호 검증
- ✅ 검증 완료 시 자동으로 members에 추가
- ✅ 이미 members인 사용자는 비밀번호 불필요
- ✅ 10초 타임아웃 기반 실시간 검증 UI

---

## 2. Database 구조

상세한 데이터베이스 구조는 다음 문서를 참조하세요:
- [채팅방 데이터베이스 구조](./sonub-firebase-database-structure.md#채팅방-chat-rooms)
- [채팅방 비밀번호 데이터베이스 구조](./sonub-firebase-database-structure.md#채팅방-비밀번호-chat-room-passwords)

**🔥 매우 중요: `members/{uid}` 필드의 의미 🔥**

`members/{uid}` 필드는 **세 가지 상태**를 가질 수 있으며, 각각의 의미를 정확히 이해해야 합니다:

1. **필드가 존재하지 않음**: 사용자가 채팅방의 멤버가 **아닙니다**
2. **`true`**: 사용자가 멤버이며 **알림을 구독**합니다
3. **`false`**: 사용자가 멤버이지만 **알림을 구독하지 않습니다**

**⚠️ 흔한 실수**: `snapshot.val() === true`로 체크하면 `false`일 때 멤버가 아닌 것으로 잘못 판단합니다!

**✅ 올바른 방법**: 멤버 여부를 확인할 때는 `snapshot.exists()`를 사용해야 합니다.

**예시 코드**:
```typescript
// ❌ 잘못된 코드 - false일 때 멤버가 아닌 것으로 잘못 판단
const isMember = snapshot.val() === true;

// ✅ 올바른 코드 - 필드 존재 여부만 확인 (true/false 모두 멤버임)
const isMember = snapshot.exists();
```

---

## 3. 입장 제어 플로우

### 3.1 전체 플로우
```
1. 사용자 채팅방 입장 시도
   ↓
2. /chat-rooms/{roomId}/members/{uid} 확인
   ├─ 존재함 → 바로 입장 (비밀번호 불필요)
   └─ 없음 → 3번으로
   ↓
3. /chat-rooms/{roomId}/password 확인
   ├─ 필드 없음 → 바로 입장
   └─ true → 4번으로
   ↓
4. 비밀번호 입력 모달 표시
   ↓
5. 사용자 비밀번호 입력
   ↓
6. /chat-room-passwords/{roomId}/try/{uid} 에 입력값 저장
   ↓
7. Cloud Functions 자동 트리거 (onValueWritten)
   ├─ 비밀번호 일치 → /chat-rooms/{roomId}/members/{uid}: true 저장
   └─ 비밀번호 불일치 → try/{uid} 삭제 (에러 로그)
   ↓
8. 클라이언트: 10초 동안 매초 /chat-rooms/{roomId}/members/{uid} 확인
   ├─ 존재하면 → 채팅방 revalidate/refresh → 입장 성공
   └─ 10초 경과 → "비밀번호가 올바르지 않습니다" 에러 표시
```

### 3.2 상세 단계별 설명

#### 3.2.1 입장 시도 (Step 1-3)
- 채팅방 페이지 로드 시 `/chat-rooms/{roomId}` 데이터 읽기 시도
- Security Rules에 의해:
  - members인 경우: 읽기 허용
  - members가 아닌 경우: 읽기 차단 → 비밀번호 검증 필요

#### 3.2.2 비밀번호 입력 (Step 4-6)
- Dialog/Modal 형태로 비밀번호 입력 UI 표시
- 입력값을 `/chat-room-passwords/{roomId}/try/{uid}` 경로에 저장
- 저장 즉시 10초 타이머 시작

#### 3.2.3 Cloud Functions 검증 (Step 7)
- `onValueWritten` 트리거로 자동 실행
- 저장된 비밀번호와 입력값 비교
- 일치: `/chat-rooms/{roomId}/members/{uid}: true` 저장
- 불일치: `try/{uid}` 삭제만 수행

#### 3.2.4 클라이언트 폴링 (Step 8)
- 1초마다 `/chat-rooms/{roomId}/members/{uid}` 존재 확인
- 존재하면: `invalidate('chat:room')` → 페이지 데이터 재로드
- 10초 경과: 에러 메시지 + 모달 다시 표시

---

## 4. Firebase Security Rules

### 4.1 `/chat-rooms/{roomId}` Rules
```json
{
  "rules": {
    "chat-rooms": {
      "$roomId": {
        ".read": "
          // Owner는 항상 읽기 가능
          data.child('owner').val() === auth.uid ||
          // Members는 항상 읽기 가능
          data.child('members').child(auth.uid).exists()
        ",
        "password": {
          ".write": "
            // Owner만 password 플래그 수정 가능
            data.child('owner').val() === auth.uid ||
            root.child('chat-rooms').child($roomId).child('owner').val() === auth.uid
          "
        },
        "members": {
          "$uid": {
            ".write": "
              (
                // 신규 추가 조건:
                !data.exists() && (
                  // 1) password 필드가 없는 경우 (비밀번호 미설정)
                  !root.child('chat-rooms').child($roomId).child('password').exists() ||
                  // 2) 본인이 owner인 경우 (owner는 항상 입장 가능)
                  root.child('chat-rooms').child($roomId).child('owner').val() === auth.uid
                )
              ) ||
              // 기존 member는 수정/삭제 가능 (본인만)
              (data.exists() && auth.uid === $uid)
            "
          }
        }
      }
    }
  }
}
```

**핵심 로직**:
1. **신규 추가 차단**: `password` 필드가 존재하고 owner가 아니면 members 추가 불가
2. **기존 member**: 본인 데이터는 수정/삭제 가능 (나가기 기능)
3. **Owner 특권**: Owner는 비밀번호 설정 여부와 관계없이 항상 자신을 members에 추가 가능
4. **비밀번호 미설정**: `password` 필드가 없으면 누구나 자신을 members에 추가 가능

### 4.2 `/chat-room-passwords/{roomId}` Rules
```json
{
  "rules": {
    "chat-room-passwords": {
      "$roomId": {
        "password": {
          ".read": "
            // Owner만 비밀번호 읽기 가능
            root.child('chat-rooms').child($roomId).child('owner').val() === auth.uid
          ",
          ".write": "
            // Owner만 비밀번호 쓰기 가능
            root.child('chat-rooms').child($roomId).child('owner').val() === auth.uid
          "
        },
        "try": {
          "$uid": {
            ".write": "
              // 본인만 try 경로에 쓰기 가능
              auth.uid === $uid
            "
          }
        }
      }
    }
  }
}
```

**핵심 로직**:
1. `password`: Owner만 읽기/쓰기 가능
2. `try/{uid}`: 본인만 쓰기 가능 (비밀번호 시도 기록)
3. `try` 읽기 권한 없음 (Cloud Functions만 읽기)

---

## 5. Cloud Functions 구현

### 5.1 함수 개요
**파일**: `firebase/functions/src/handlers/chat.password-verification.handler.ts`

**트리거**: `onValueWritten('/chat-room-passwords/{roomId}/try/{uid}')`

**로직**:
1. `try/{uid}`에 기록된 입력 비밀번호 읽기
2. `/chat-room-passwords/{roomId}/password` 실제 비밀번호 읽기
3. 문자열 비교 (Plain Text 비교)
4. 일치하면:
   - `/chat-rooms/{roomId}/members/{uid}: true` 저장
   - `/chat-room-passwords/{roomId}/try/{uid}` 삭제
5. 불일치하면:
   - `/chat-room-passwords/{roomId}/try/{uid}` 삭제
   - 에러 로그 기록

### 5.2 코드 예시
```typescript
import * as logger from "firebase-functions/logger";
import * as admin from "firebase-admin";
import { onValueWritten } from "firebase-functions/v2/database";

/**
 * 채팅방 비밀번호 검증 핸들러
 *
 * /chat-room-passwords/{roomId}/try/{uid} 경로에 값이 기록되면 자동 실행됩니다.
 *
 * @param roomId - 채팅방 ID
 * @param uid - 사용자 UID
 * @param tryPassword - 입력된 비밀번호
 */
export async function handlePasswordVerification(
  roomId: string,
  uid: string,
  tryPassword: string
): Promise<void> {
  logger.info("비밀번호 검증 시작", { roomId, uid });

  try {
    // 1. 실제 비밀번호 읽기
    const passwordSnapshot = await admin.database()
      .ref(`chat-room-passwords/${roomId}/password`)
      .once("value");

    if (!passwordSnapshot.exists()) {
      logger.error("비밀번호가 설정되지 않음", { roomId });
      return;
    }

    const actualPassword = passwordSnapshot.val() as string;

    // 2. 비밀번호 비교 (Plain Text)
    if (tryPassword === actualPassword) {
      logger.info("✅ 비밀번호 일치 - members에 추가", { roomId, uid });

      // 3. members에 추가
      await admin.database()
        .ref(`chat-rooms/${roomId}/members/${uid}`)
        .set(true);

      logger.info("✅ members 추가 완료", { roomId, uid });
    } else {
      logger.warn("❌ 비밀번호 불일치", { roomId, uid });
    }

    // 4. try 경로 삭제 (보안상 즉시 삭제)
    await admin.database()
      .ref(`chat-room-passwords/${roomId}/try/${uid}`)
      .remove();

  } catch (error) {
    logger.error("비밀번호 검증 에러", { roomId, uid, error });
  }
}

/**
 * Cloud Functions 트리거 등록
 */
export const onPasswordTry = onValueWritten(
  {
    ref: "/chat-room-passwords/{roomId}/try/{uid}",
    region: "asia-southeast1"
  },
  async (event) => {
    const roomId = event.params.roomId as string;
    const uid = event.params.uid as string;
    const tryPassword = event.data.after.val() as string;

    // 삭제된 경우 무시
    if (!tryPassword) {
      return;
    }

    await handlePasswordVerification(roomId, uid, tryPassword);
  }
);
```

---

## 6. Svelte UI 구현

### 6.1 비밀번호 설정 UI (Owner용)

**파일**: `src/lib/components/chat/room-password-setting.svelte`

**기능**:
- 비밀번호 입력 필드 (type="text"로 화면에 표시)
- 저장/취소/삭제 버튼
- Owner만 접근 가능

**UI/UX 특징**:
- ✅ 모달 창을 열면 바로 비밀번호 입력 필드 표시 (토글 없음)
- ✅ `type="text"`로 비밀번호를 화면에 표시
- ✅ 비밀번호 확인란 없음 (즉시 저장)
- ✅ 3개 버튼: "취소", "저장", "비밀번호 삭제"
- ✅ "비밀번호 삭제" 버튼은 기존 비밀번호가 있을 때만 표시

**UI 구조**:
```svelte
<script lang="ts">
  import { Button } from '$lib/components/ui/button';
  import { Input } from '$lib/components/ui/input';
  import { toast } from 'svelte-sonner';
  import { rtdb } from '$lib/firebase';
  import { ref, update, remove } from 'firebase/database';
  import { m } from '$lib/paraglide/messages';

  interface Props {
    roomId: string;
    currentPassword?: string;
    onCancel?: () => void;
  }

  let { roomId, currentPassword = '', onCancel }: Props = $props();

  let password = $state(currentPassword);
  let isSaving = $state(false);

  // 비밀번호 저장
  async function handleSave() {
    if (!rtdb) {
      toast.error(m.chatPasswordSaveFailure());
      return;
    }

    // 유효성 검사 (최소 4자)
    if (password.length < 4) {
      toast.error(m.chatPasswordMinLengthError());
      return;
    }

    isSaving = true;

    try {
      // 비밀번호 저장
      await update(ref(rtdb, `chat-room-passwords/${roomId}`), {
        password: password
      });

      // 활성화 플래그 저장
      await update(ref(rtdb, `chat-rooms/${roomId}`), {
        password: true
      });

      toast.success(m.chatPasswordSetSuccess());
    } catch (error) {
      console.error('❌ 비밀번호 저장 실패:', error);
      toast.error(m.chatPasswordSaveFailure());
    } finally {
      isSaving = false;
    }
  }

  // 비밀번호 삭제
  async function handleDelete() {
    if (!rtdb) {
      toast.error(m.chatPasswordSaveFailure());
      return;
    }

    isSaving = true;

    try {
      // 비밀번호 삭제
      await remove(ref(rtdb, `chat-room-passwords/${roomId}/password`));

      // 활성화 플래그 삭제
      await remove(ref(rtdb, `chat-rooms/${roomId}/password`));

      toast.success(m.chatPasswordDeleteSuccess());

      // 입력창 초기화
      password = '';
    } catch (error) {
      console.error('❌ 비밀번호 삭제 실패:', error);
      toast.error(m.chatPasswordSaveFailure());
    } finally {
      isSaving = false;
    }
  }
</script>

<div class="password-setting-container">
  <!-- 비밀번호 입력 필드 (바로 표시) -->
  <Input
    type="text"
    placeholder={m.chatPasswordInputPlaceholder()}
    bind:value={password}
    disabled={isSaving}
  />

  <!-- 버튼 그룹 -->
  <div class="button-group">
    <!-- 취소 버튼 -->
    {#if onCancel}
      <Button variant="outline" onclick={onCancel} disabled={isSaving}>
        {m.commonCancel()}
      </Button>
    {/if}

    <!-- 저장 버튼 -->
    <Button onclick={handleSave} disabled={isSaving}>
      {isSaving ? m.chatPasswordSaving() : m.commonSave()}
    </Button>

    <!-- 비밀번호 삭제 버튼 (기존 비밀번호가 있을 때만) -->
    {#if currentPassword}
      <Button variant="destructive" onclick={handleDelete} disabled={isSaving}>
        {m.chatPasswordDelete()}
      </Button>
    {/if}
  </div>
</div>
```

**Props**:
- `roomId`: 채팅방 ID
- `currentPassword`: 현재 설정된 비밀번호 (optional)
- `onCancel`: 취소 버튼 클릭 시 호출될 콜백 함수 (optional)

**주요 변경사항**:
- 비밀번호 활성화/비활성화 토글 제거 → 바로 입력 필드 표시
- `type="password"` → `type="text"` 변경 (비밀번호를 화면에 보이게)
- 비밀번호 확인란 제거 (유효성 검사 단순화)
- "취소", "저장", "비밀번호 삭제" 3개 버튼 제공
- `isPasswordEnabled` prop 제거

### 6.2 비밀번호 입력 모달 (입장자용)

**파일**: `src/lib/components/chat/room-password-prompt.svelte`

**기능**:
- Dialog 형태 모달
- 비밀번호 입력 필드
- 10초 타임아웃
- 매초 members 확인
- 확인/취소 버튼

**UI/UX 세부 규칙**:
- 입력 필드에 공백(Space) 또는 Enter 키 입력 시 Dialog 전체가 닫히지 않도록 `keydown` 이벤트 전파를 차단하여 사용자가 안전하게 비밀번호를 입력/제출할 수 있어야 합니다.
- 버튼 배치는 왼쪽에 텍스트 스타일의 `Cancel`, 오른쪽에 기본 버튼 형태의 `Confirm`을 두고, Confirm 버튼만 강조합니다.

**UI 구조**:
```svelte
<script lang="ts">
  import { Dialog, DialogContent } from '$lib/components/ui/dialog';
  import { Input } from '$lib/components/ui/input';
  import { Button } from '$lib/components/ui/button';
  import { toast } from 'svelte-sonner';
  import { rtdb } from '$lib/firebase';
  import { ref, set, onValue, off } from 'firebase/database';
  import { authStore } from '$lib/stores/auth.svelte';
  import { invalidate } from '$app/navigation';

  interface Props {
    roomId: string;
    open: boolean;
    onSuccess: () => void;
    onCancel: () => void;
  }

  let { roomId, open, onSuccess, onCancel }: Props = $props();

  let password = $state('');
  let isVerifying = $state(false);
  let countdown = $state(5);

  async function handleSubmit() {
    if (!password || !authStore.user?.uid) return;

    isVerifying = true;
    countdown = 5;

    try {
      // 1. try 경로에 비밀번호 저장
      await set(
        ref(rtdb, `chat-room-passwords/${roomId}/try/${authStore.user.uid}`),
        password
      );

      // 2. 5초 동안 매초 members 확인
      const verified = await waitForVerification(roomId, authStore.user.uid);

      if (verified) {
        toast.success('비밀번호가 확인되었습니다');
        await invalidate('chat:room'); // SvelteKit 데이터 재로드
        onSuccess();
      } else {
        toast.error('비밀번호가 올바르지 않습니다');
        password = '';
      }
    } catch (error) {
      console.error('비밀번호 검증 에러:', error);
      toast.error('비밀번호 검증에 실패했습니다');
    } finally {
      isVerifying = false;
    }
  }

  async function waitForVerification(roomId: string, uid: string): Promise<boolean> {
    return new Promise((resolve) => {
      const memberRef = ref(rtdb, `chat-rooms/${roomId}/members/${uid}`);
      let intervalId: any;
      let timeoutId: any;

      // 매초 카운트다운
      intervalId = setInterval(() => {
        countdown--;
      }, 1000);

      // 5초 타임아웃
      timeoutId = setTimeout(() => {
        clearInterval(intervalId);
        off(memberRef);
        resolve(false);
      }, 5000);

      // members 경로 실시간 확인
      // 중요: snapshot.val() === true가 아닌 snapshot.exists()를 사용해야 함
      // members/{uid}는 true/false 값을 가질 수 있으며, 둘 다 멤버를 의미함
      // - true: 멤버이며 알림 구독
      // - false: 멤버이지만 알림 미구독
      // - 필드 없음: 멤버가 아님
      onValue(memberRef, (snapshot) => {
        if (snapshot.exists()) {
          // 검증 성공: members에 추가됨 (true 또는 false 값 모두 멤버임)
          clearInterval(intervalId);
          clearTimeout(timeoutId);
          off(memberRef);
          resolve(true);
        }
      });
    });
  }
</script>

<Dialog {open}>
  <DialogContent>
    <h2>비밀번호 입력</h2>
    <p>이 채팅방은 비밀번호가 필요합니다.</p>

    <form onsubmit|preventDefault={handleSubmit}>
      <Input
        type="password"
        placeholder="비밀번호를 입력하세요"
        bind:value={password}
        disabled={isVerifying}
      />

      {#if isVerifying}
        <p>검증 중... ({countdown}초 남음)</p>
      {/if}

      <div class="flex gap-2">
        <Button type="submit" disabled={isVerifying || !password}>
          확인
        </Button>
        <Button variant="outline" onclick={onCancel} disabled={isVerifying}>
          취소
        </Button>
      </div>
    </form>
  </DialogContent>
</Dialog>
```

### 6.3 채팅방 헤더 메뉴 수정

**파일**: `src/routes/chat/room/[roomId]/+page.svelte` (또는 헤더 컴포넌트)

**수정 내용**:
```svelte
<script lang="ts">
  import RoomPasswordSetting from '$lib/components/chat/room-password-setting.svelte';

  let showPasswordSetting = $state(false);

  // 채팅방 데이터 (기존)
  let room = $state<ChatRoom | null>(null);
  let isOwner = $derived(room?.owner === authStore.user?.uid);
</script>

<!-- 드롭다운 메뉴 -->
<DropdownMenu>
  <DropdownMenuContent>
    {#if isOwner}
      <DropdownMenuItem onclick={() => showPasswordSetting = true}>
        <Lock class="w-4 h-4 mr-2" />
        비밀번호 설정
      </DropdownMenuItem>
    {/if}
    <!-- 기타 메뉴 항목... -->
  </DropdownMenuContent>
</DropdownMenu>

<!-- 비밀번호 설정 Dialog -->
{#if showPasswordSetting}
  <Dialog open={showPasswordSetting} onOpenChange={(open) => showPasswordSetting = open}>
    <DialogContent>
      <DialogHeader>
        <DialogTitle>비밀번호 설정</DialogTitle>
      </DialogHeader>
      <RoomPasswordSetting
        roomId={room.id}
        currentPassword={room.password}
        isPasswordEnabled={room.passwordEnabled}
      />
    </DialogContent>
  </Dialog>
{/if}
```

### 6.4 채팅방 입장 로직 수정

**파일**: `src/routes/chat/room/[roomId]/+page.ts` (또는 `+page.svelte`)

**수정 내용**:
```typescript
import type { PageLoad } from './$types';
import { get, ref } from 'firebase/database';
import { rtdb } from '$lib/firebase';
import { authStore } from '$lib/stores/auth.svelte';

export const load: PageLoad = async ({ params }) => {
  const roomId = params.roomId;
  const uid = authStore.user?.uid;

  if (!uid) {
    throw new Error('로그인이 필요합니다');
  }

  // 1. 채팅방 정보 읽기 시도
  const roomRef = ref(rtdb, `chat-rooms/${roomId}`);

  try {
    const roomSnapshot = await get(roomRef);

    if (!roomSnapshot.exists()) {
      throw new Error('채팅방을 찾을 수 없습니다');
    }

    const room = roomSnapshot.val();

    // 2. 이미 members인지 확인
    const isMember = room.members?.[uid] === true;

    // 3. 비밀번호 필요 여부 확인
    const needsPassword = room.password === true && !isMember;

    return {
      room,
      needsPassword
    };

  } catch (error) {
    // Security Rules에 의해 읽기 차단된 경우
    if (error.code === 'PERMISSION_DENIED') {
      // 비밀번호 필요
      return {
        room: null,
        needsPassword: true
      };
    }

    throw error;
  }
};
```

**+page.svelte 수정**:
```svelte
<script lang="ts">
  import RoomPasswordPrompt from '$lib/components/chat/room-password-prompt.svelte';
  import type { PageData } from './$types';

  let { data }: { data: PageData } = $props();

  let showPasswordPrompt = $state(data.needsPassword);

  function handlePasswordSuccess() {
    showPasswordPrompt = false;
    // invalidate는 room-password-prompt.svelte에서 이미 호출됨
  }

  function handlePasswordCancel() {
    goto('/chat/list');
  }
</script>

{#if showPasswordPrompt}
  <RoomPasswordPrompt
    roomId={data.room?.id || ''}
    open={showPasswordPrompt}
    onSuccess={handlePasswordSuccess}
    onCancel={handlePasswordCancel}
  />
{:else}
  <!-- 채팅방 UI -->
{/if}
```

---

## 7. 다국어 처리

### 7.1 메시지 키 추가

**파일**: `messages/ko.json`, `messages/en.json`, etc.

```json
{
  "채팅방_비밀번호_설정": "채팅방 비밀번호 설정",
  "비밀번호_활성화": "비밀번호 활성화",
  "비밀번호_입력": "비밀번호를 입력하세요",
  "비밀번호_확인": "비밀번호 확인",
  "비밀번호_최소_길이": "비밀번호는 최소 {min}자 이상이어야 합니다",
  "비밀번호_불일치": "비밀번호가 일치하지 않습니다",
  "비밀번호_저장_성공": "비밀번호가 설정되었습니다",
  "비밀번호_해제_성공": "비밀번호가 해제되었습니다",
  "비밀번호_검증_성공": "비밀번호가 확인되었습니다",
  "비밀번호_검증_실패": "비밀번호가 올바르지 않습니다",
  "비밀번호_입력_필요": "이 채팅방은 비밀번호가 필요합니다",
  "비밀번호_검증_중": "검증 중... ({countdown}초 남음)",
  "저장": "저장",
  "저장_중": "저장 중...",
  "확인": "확인",
  "취소": "취소"
}
```

---

## 8. 테스트 시나리오

### 8.1 Owner 테스트
- [ ] ✅ 비밀번호 설정 (4자 이상)
- [ ] ✅ 비밀번호 확인 불일치 시 에러
- [ ] ✅ 비밀번호 저장 성공
- [ ] ✅ `/chat-rooms/{roomId}/password: true` 확인
- [ ] ✅ `/chat-room-passwords/{roomId}/password` 확인
- [ ] ✅ 비밀번호 변경
- [ ] ✅ 비밀번호 비활성화
- [ ] ✅ Owner 본인은 비밀번호 없이 입장 가능

### 8.2 입장자 테스트
- [ ] ✅ 비밀번호 없는 채팅방 입장 (정상)
- [ ] ✅ 비밀번호 있는 채팅방 입장 → 모달 표시
- [ ] ✅ 올바른 비밀번호 입력 → 입장 성공
- [ ] ✅ 잘못된 비밀번호 입력 → 에러 메시지
- [ ] ✅ 입장 후 나갔다가 재입장 → 비밀번호 불필요
- [ ] ✅ 비밀번호 변경 후 기존 members 재입장 → 비밀번호 불필요

### 8.3 Security Rules 테스트
- [ ] ✅ 비밀번호 설정 후 직접 members 추가 시도 → 차단 확인
- [ ] ✅ Owner가 아닌 사용자가 password 플래그 변경 시도 → 차단 확인
- [ ] ✅ 본인이 아닌 try 경로 쓰기 시도 → 차단 확인
- [ ] ✅ members 삭제 (나가기) → 정상 동작

### 8.4 Cloud Functions 테스트
- [ ] ✅ 올바른 비밀번호 → members 추가 확인
- [ ] ✅ 잘못된 비밀번호 → members 추가 안 됨
- [ ] ✅ try 경로 자동 삭제 확인
- [ ] ✅ Cloud Functions 로그 확인

### 8.5 UI/UX 테스트
- [ ] ✅ 10초 카운트다운 동작 확인
- [ ] ✅ 검증 중 UI 로딩 표시
- [ ] ✅ 성공 시 Toast 메시지
- [ ] ✅ 실패 시 Toast 메시지 + 재시도
- [ ] ✅ 취소 버튼 → 채팅방 목록으로 이동

---

## 9. 보안 고려사항

### 9.1 Plain Text 비밀번호
- **현재**: Plain Text로 저장
- **이유**: 간단한 구현, 비밀번호 변경 시 기존 members 재검증 불필요
- **위험**: Firebase Console 접근 시 비밀번호 노출
- **완화**:
  - `/chat-room-passwords` 경로는 Owner만 읽기 가능 (Security Rules)
  - 프로덕션 환경에서 Firebase Console 접근 제한

### 9.2 Brute Force 방지
- **현재**: 제한 없음
- **향후**: Rate Limiting 추가 (5분 내 5회 실패 시 10분 차단)

### 9.3 Try 경로 보안
- **현재**: 본인만 쓰기 가능
- **보안**: Cloud Functions에서 즉시 삭제 (검증 후)

---

## 10. 향후 개선사항

### 10.1 비밀번호 암호화
- bcrypt 해싱 도입
- 비밀번호 변경 시 기존 members 재검증 필요

### 10.2 Rate Limiting
- 연속 실패 횟수 추적
- IP 기반 차단 (옵션)

### 10.3 비밀번호 힌트
- 비밀번호 힌트 설정 기능
- 모달에 힌트 표시

### 10.4 QR 코드 공유
- 비밀번호 포함 QR 코드 생성
- 초대 링크 생성

---

## 11. 트러블슈팅

### 11.1 알림 비활성화 멤버 비밀번호 문제 (해결됨)

**문제**: 이미 멤버인 사용자(`/chat-rooms/{roomId}/members/{uid}` 존재)가 채팅방 입장 시 계속 비밀번호를 요구받음

**원인**: `room-password-prompt.svelte` 컴포넌트의 `waitForVerification()` 함수에서 멤버 확인 로직이 잘못 구현됨

```typescript
// ❌ 잘못된 코드 (라인 150)
onValue(memberRef, (snapshot) => {
  if (snapshot.val() === true) {  // false일 때 실패!
    // ...
  }
});
```

**설명**:
- `members/{uid}` 필드는 세 가지 상태를 가짐:
  1. `true`: 멤버이며 알림 구독
  2. `false`: 멤버이지만 알림 미구독
  3. 필드 없음: 멤버가 아님
- `snapshot.val() === true`는 `false` 값을 가진 멤버를 비멤버로 잘못 판단

**해결 방법**: `snapshot.exists()`를 사용하여 필드 존재 여부만 확인

```typescript
// ✅ 올바른 코드 (라인 154-162)
// members 경로 실시간 확인
// 중요: snapshot.val() === true가 아닌 snapshot.exists()를 사용해야 함
// members/{uid}는 true/false 값을 가질 수 있으며, 둘 다 멤버를 의미함
// - true: 멤버이며 알림 구독
// - false: 멤버이지만 알림 미구독
// - 필드 없음: 멤버가 아님
onValue(memberRef, (snapshot) => {
  if (snapshot.exists()) {  // ✅ 필드 존재 여부로 확인
    // 검증 성공: members에 추가됨 (true 또는 false 값 모두 멤버임)
    clearInterval(intervalId);
    clearTimeout(timeoutId);
    off(memberRef);
    resolve(true);
  }
});
```

**참고**: 동일한 패턴이 `+page.svelte` (라인 232)에서 올바르게 구현되어 있었음
```typescript
const memberRef = ref(rtdb, `chat-rooms/${activeRoomId}/members/${authStore.user.uid}`);
const unsubscribeMember = onValue(memberRef, (snapshot) => {
  isRoomMember = snapshot.exists(); // ✅ 올바른 구현
});
```

**수정 파일**:
- [room-password-prompt.svelte](../src/lib/components/chat/room-password-prompt.svelte) 라인 154-162

**해결 날짜**: 2025-11-16

---

### 11.2 상태 업데이트 타이밍 문제 (해결됨)

**문제**: 이미 멤버인 사용자가 채팅방 재입장 시 짧은 순간 비밀번호 프롬프트가 나타남

**증상**:
- 콘솔 로그에서 `isRoomMember`가 `true` → `false` → `true`로 변경
- 비밀번호 프롬프트가 잠깐 열렸다가 자동으로 닫힘

**원인**:
`activeRoomId` 변경 시 두 개의 `$effect`가 동시에 실행되면서 발생하는 레이스 컨디션:

1. **첫 번째 effect** (라인 94-124): 비밀번호 체크 및 입장 로직
2. **두 번째 effect** (라인 205-249): Firebase 구독 설정

Firebase 구독이 설정되는 동안 실제 데이터를 받아오기 전에는 `isRoomMember`가 `false`입니다. 그 짧은 순간에 비밀번호 체크 로직이 실행되어 프롬프트가 열립니다.

```typescript
// ❌ 문제가 있는 코드 (라인 109)
if (needsPassword) {
  passwordPromptOpen = true;  // isRoomMember가 일시적으로 false일 때 열림
}
```

**해결 방법**:
1. 프롬프트가 이미 열려있으면 다시 열지 않기
2. 멤버가 되면 프롬프트 자동으로 닫기

```typescript
// ✅ 수정된 코드 (라인 109-121)
if (needsPassword && !passwordPromptOpen) {
  // 비밀번호 필요하고 프롬프트가 아직 열리지 않았을 때만 모달 표시
  // 이미 열려있으면 다시 열지 않음 (isRoomMember 일시적 false 방지)
  passwordPromptOpen = true;
} else if (isRoomMember || isRoomOwner) {
  // 이미 members이거나 owner인 경우
  // 프롬프트가 열려있으면 닫고 입장 (chat-joins 업데이트)
  passwordPromptOpen = false;
  joinChatRoom(rtdb, activeRoomId, authStore.user.uid);
} else if (!roomPasswordEnabled) {
  // 비밀번호가 설정되지 않은 경우: 자동으로 members에 추가
  joinChatRoom(rtdb, activeRoomId, authStore.user.uid);
}
```

**시나리오별 동작**:

1. **이미 멤버인 사용자**:
   - Firebase 구독 설정 중 잠시 `isRoomMember = false`
   - `needsPassword = true`이지만 프롬프트 열림
   - Firebase에서 데이터 수신: `isRoomMember = true`
   - 프롬프트 자동 닫힘 + 입장

2. **새로운 사용자**:
   - 프롬프트 열림 → 비밀번호 입력
   - Cloud Functions가 members에 추가
   - `isRoomMember = true`로 업데이트
   - 프롬프트 자동 닫힘 + 입장

**수정 파일**:
- [+page.svelte](../src/routes/chat/room/+page.svelte) 라인 109-121

**해결 날짜**: 2025-11-16

---

### 11.3 화면 깜빡임 현상 (해결됨)

**문제**: 이미 멤버인 사용자가 채팅방 재입장 시 비밀번호 입력 창이 잠깐 열렸다가 자동으로 닫히면서 화면이 깜빡이는 현상

**증상**:
- 사용자가 이미 채팅방에 입장해 있는데도 비밀번호 창이 열림
- 조금 있다가 자동으로 닫힘
- 이 과정에서 화면 깜빡임 발생

**원인**:
11.2에서 해결한 레이스 컨디션 문제의 근본적인 원인 - Firebase 데이터가 로드되기 전에 비밀번호 체크가 실행됨

**상세 분석**:
```typescript
// 문제가 있는 흐름:
// 1. activeRoomId 변경
// 2. roomOwner !== null 조건 충족 (이전 방의 데이터)
// 3. isRoomMember는 아직 false (Firebase 구독이 데이터를 받지 못함)
// 4. needsPassword = true → 비밀번호 프롬프트 열림
// 5. Firebase onValue 콜백 실행: isRoomMember = true
// 6. 프롬프트 자동 닫힘
```

**핵심 문제점**:
- `roomOwner !== null` 조건만으로는 Firebase 데이터 로딩 완료를 보장할 수 없음
- `isRoomMember`가 실제 값을 가지기 전에 비밀번호 체크가 실행됨

**해결 방법**: `roomDataLoaded` 플래그 도입

1. **상태 변수 추가** (라인 202):
```typescript
let roomDataLoaded = $state(false); // Firebase 구독이 데이터를 한 번 이상 받아왔는지 여부 (깜빡임 방지용)
```

2. **멤버 구독 콜백에서 플래그 설정** (라인 251):
```typescript
const memberRef = ref(rtdb, `chat-rooms/${activeRoomId}/members/${authStore.user.uid}`);
const unsubscribeMember = onValue(memberRef, (snapshot) => {
  isRoomMember = snapshot.exists(); // 필드 존재 여부만 확인 (true/false 모두 멤버임)
  roomDataLoaded = true; // 멤버 데이터 로딩 완료 (깜빡임 방지: Firebase에서 최소한 한 번은 데이터를 받아옴)
});
```

3. **비밀번호 체크 조건 강화** (라인 106-107):
```typescript
// 중요: roomDataLoaded가 true일 때만 비밀번호 체크 실행 (깜빡임 방지)
// Firebase 구독이 데이터를 한 번 이상 받아온 후에만 실행됩니다.
if (roomOwner !== null && roomDataLoaded) {
  // 비밀번호 체크 로직...
}
```

4. **방 변경 시 플래그 초기화** (라인 220):
```typescript
roomDataLoaded = false; // 데이터 로딩 상태 초기화
```

**해결 로직 요약**:
- **이전**: `roomOwner !== null`일 때 즉시 비밀번호 체크 → 데이터 로딩 전에 실행
- **현재**: `roomOwner !== null && roomDataLoaded`일 때만 체크 → 데이터 로딩 후 실행
- **결과**: `isRoomMember`가 실제 값을 가진 상태에서 체크하므로 불필요한 프롬프트 표시 방지

**시나리오별 동작**:

1. **이미 멤버인 사용자 재입장**:
   - `activeRoomId` 변경
   - `roomDataLoaded = false` 초기화
   - Firebase 구독 설정 중... (비밀번호 체크 실행 안 됨)
   - Firebase에서 데이터 수신: `isRoomMember = true`, `roomDataLoaded = true`
   - 비밀번호 체크 실행: `needsPassword = false` → 프롬프트 표시 안 함 ✅
   - 입장 완료

2. **비밀번호가 필요한 새 사용자**:
   - `activeRoomId` 변경
   - `roomDataLoaded = false` 초기화
   - Firebase 구독 설정 중... (비밀번호 체크 실행 안 됨)
   - Firebase에서 데이터 수신: `isRoomMember = false`, `roomDataLoaded = true`
   - 비밀번호 체크 실행: `needsPassword = true` → 프롬프트 표시 ✅
   - 비밀번호 입력 후 입장

**수정 파일**:
- [+page.svelte:202](../src/routes/chat/room/+page.svelte#L202) - `roomDataLoaded` 상태 변수 추가
- [+page.svelte:106-107](../src/routes/chat/room/+page.svelte#L106-L107) - 비밀번호 체크 조건 강화
- [+page.svelte:251](../src/routes/chat/room/+page.svelte#L251) - 멤버 구독 콜백에서 플래그 설정
- [+page.svelte:220](../src/routes/chat/room/+page.svelte#L220) - 방 변경 시 플래그 초기화

**해결 날짜**: 2025-11-16

---

## 12. 참조

- [Firebase Security Rules 공식 문서](https://firebase.google.com/docs/database/security)
- [Firebase Cloud Functions 공식 문서](https://firebase.google.com/docs/functions)
- [Svelte 5 Runes 공식 문서](https://svelte-5-preview.vercel.app/docs/runes)

---

