---
name: sonub-component-chat-message-edit-modal
version: 1.0.0
description: 채팅 메시지 수정 모달 컴포넌트 SED 명세서
author: JaeHo Song
email: thruthesky@gmail.com
license: GPL-3.0
created: 2025-01-20
updated: 2025-01-20
step: 1
priority: "medium"
dependencies: ["sonub-component-message-edit-modal.md", "sonub-chat-message.md"]
tags: ["component", "modal", "chat", "message", "edit", "wrapper"]
---

# ChatMessageEditModal 컴포넌트 상세 스펙

## 1. 개요

### 1.1 목적

ChatMessageEditModal은 사용자가 자신의 채팅 메시지를 수정할 수 있도록 하는 래퍼 컴포넌트입니다. `MessageEditModal.svelte`를 사용하여 UI를 표시하고, Firebase RTDB `chat-messages/{roomId}/{messageId}` 경로에 메시지를 업데이트합니다.

### 1.2 역할

본 컴포넌트는 다음의 역할을 담당합니다:

1. **UI 표시** - MessageEditModal을 재사용하여 편집 UI 제공
2. **RTDB 업데이트** - Firebase RTDB에 직접 메시지 업데이트
3. **에러 처리** - 저장 실패 시 에러 메시지 표시
4. **콜백 전달** - 저장 완료 시 부모 컴포넌트에 알림

## 2. 컴포넌트 위치

```
src/lib/components/chat/ChatMessageEditModal.svelte
```

Repository 문서:
```
specs/repository/src/lib/components/chat/ChatMessageEditModal.svelte.md
```

## 3. Props 인터페이스

### 3.1 Props 정의

| 이름 | 타입 | 필수 | 기본값 | 설명 |
|------|------|------|--------|------|
| `open` | `boolean` | ✅ | - | 모달 열림 상태 (bindable) |
| `messageId` | `string` | ✅ | - | 메시지 ID |
| `initialText` | `string` | ✅ | - | 초기 텍스트 |
| `initialUrls` | `Record<number, string>` | ✅ | - | 초기 첨부파일 URL 목록 |
| `roomId` | `string` | ✅ | - | 채팅방 ID |
| `onClose` | `() => void` | ✅ | - | 모달 닫기 콜백 |
| `onSaved` | `() => void` | ❌ | `undefined` | 저장 완료 콜백 |

### 3.2 Props 사용 예시

```svelte
<ChatMessageEditModal
  bind:open={editModalOpen}
  messageId={message.id}
  initialText={message.text}
  initialUrls={message.urls || {}}
  roomId={currentRoomId}
  onClose={() => editModalOpen = false}
  onSaved={() => {
    console.log('메시지 수정 완료');
    // 필요시 메시지 목록 새로고침
  }}
/>
```

## 4. 핵심 로직

### 4.1 저장 핸들러

```typescript
async function handleSave(
  text: string,
  urls: Record<number, string>
): Promise<{ success: boolean; error?: string }> {
  if (!rtdb) {
    return { success: false, error: m.firebaseNotReady() };
  }

  try {
    // 2단계 구조: chat-messages/{roomId}/{messageId}
    const messageRef = ref(rtdb, `chat-messages/${roomId}/${messageId}`);
    const updates = {
      text: text.trim(),
      urls,
      editedAt: Date.now()
    };

    await update(messageRef, updates);

    // 저장 완료 콜백 호출
    onSaved?.();

    return { success: true };
  } catch (err) {
    console.error('메시지 저장 실패:', err);
    return {
      success: false,
      error: m.chatMessageSaveFailed()
    };
  }
}
```

### 4.2 MessageEditModal 통합

```svelte
<MessageEditModal
  bind:open
  title={m.chatMessageEditTitle()}
  textLabel={m.commonMessage()}
  {initialText}
  {initialUrls}
  {roomId}
  saveButtonText={m.commonSave()}
  cancelButtonText={m.commonCancel()}
  textPlaceholder={m.chatWriteMessage()}
  onSave={handleSave}
  onCancel={onClose}
/>
```

## 5. Firebase RTDB 업데이트

### 5.1 RTDB 경로

```
/chat-messages/{roomId}/{messageId}
```

**⚠️ 중요**: 채팅 메시지는 2단계 구조를 사용합니다. 이는 각 채팅방의 메시지를 독립적으로 관리하기 위함입니다.

### 5.2 업데이트 필드

```typescript
{
  text: string,           // 메시지 텍스트
  urls: Record<number, string>,  // 첨부파일 URL 맵
  editedAt: number        // 수정 시각 (타임스탬프)
}
```

**⚠️ 주의**: 기존 필드는 유지되며, 위 3개 필드만 업데이트됩니다.

- `senderUid` - 변경 안 됨
- `createdAt` - 변경 안 됨
- `deleted` - 변경 안 됨
- `text`, `urls`, `editedAt` - 업데이트됨

## 6. 사용 예제

### 6.1 기본 사용 (채팅방 페이지)

```svelte
<script lang="ts">
  import ChatMessageEditModal from '$lib/components/chat/ChatMessageEditModal.svelte';
  import { page } from '$app/stores';

  const roomId = $derived($page.url.searchParams.get('roomId') || '');

  // 메시지 수정 모달 상태
  let editModalOpen = $state(false);
  let currentMessage = $state<any>(null);

  function handleEditMessage(message: any) {
    currentMessage = message;
    editModalOpen = true;
  }

  function handleMessageSaved() {
    console.log('메시지 수정 완료');
    // DatabaseListView가 onValue로 자동 업데이트되므로 별도 새로고침 불필요
  }
</script>

{#if currentMessage}
  <ChatMessageEditModal
    bind:open={editModalOpen}
    messageId={currentMessage.id}
    initialText={currentMessage.text}
    initialUrls={currentMessage.urls || {}}
    {roomId}
    onClose={() => editModalOpen = false}
    onSaved={handleMessageSaved}
  />
{/if}
```

### 6.2 DatabaseListView와 통합

```svelte
<script lang="ts">
  import DatabaseListView from '$lib/components/DatabaseListView.svelte';
  import ChatMessageEditModal from '$lib/components/chat/ChatMessageEditModal.svelte';

  let editModalOpen = $state(false);
  let selectedMessage = $state<any>(null);
</script>

<!-- 채팅 메시지 목록 -->
<DatabaseListView
  path="chat-messages/{roomId}"
  orderByField="createdAt"
  limit={50}
>
  {#snippet children(messages)}
    {#each messages as message}
      <div class="message-item">
        <p>{message.text}</p>

        <!-- 수정 버튼 (본인 메시지만) -->
        {#if message.senderUid === authStore.user?.uid}
          <button onclick={() => {
            selectedMessage = message;
            editModalOpen = true;
          }}>
            수정
          </button>
        {/if}
      </div>
    {/each}
  {/snippet}
</DatabaseListView>

<!-- 메시지 수정 모달 -->
{#if selectedMessage}
  <ChatMessageEditModal
    bind:open={editModalOpen}
    messageId={selectedMessage.id}
    initialText={selectedMessage.text}
    initialUrls={selectedMessage.urls || {}}
    roomId={currentRoomId}
    onClose={() => editModalOpen = false}
  />
{/if}
```

## 7. 의존성

### 7.1 컴포넌트 의존성

- `$lib/components/MessageEditModal.svelte` - 편집 UI 제공

### 7.2 Firebase 의존성

- `$lib/firebase` - `rtdb` 인스턴스
- `firebase/database` - `ref()`, `update()` 함수

### 7.3 i18n 의존성

- `m.chatMessageEditTitle()` - 메시지 수정 제목
- `m.commonMessage()` - 메시지 라벨
- `m.commonSave()` - 저장 버튼 텍스트
- `m.commonCancel()` - 취소 버튼 텍스트
- `m.chatWriteMessage()` - 텍스트 입력 placeholder
- `m.chatMessageSaveFailed()` - 저장 실패 메시지
- `m.firebaseNotReady()` - Firebase 미준비 메시지

## 8. 실시간 업데이트

### 8.1 DatabaseListView 자동 업데이트

채팅 메시지 목록이 `DatabaseListView` 컴포넌트로 표시되는 경우, 메시지 수정 시 자동으로 UI가 업데이트됩니다.

**작동 원리**:
1. 사용자가 메시지 수정 후 저장
2. Firebase RTDB에 `update()` 호출
3. `DatabaseListView`의 `onValue` 리스너가 변경 감지
4. UI에 수정된 메시지 자동 반영

**따라서 별도의 새로고침 로직이 필요하지 않습니다.**

### 8.2 editedAt 표시

메시지가 수정된 경우 `editedAt` 필드가 존재합니다. 이를 활용하여 "수정됨" 표시를 할 수 있습니다.

```svelte
{#if message.editedAt}
  <span class="edited-badge">수정됨</span>
{/if}
```

## 9. 테스트 시나리오

### 9.1 기본 기능 테스트

- [ ] 메시지 수정 모달이 정상적으로 열리는지 확인
- [ ] 초기 텍스트와 첨부파일이 정상적으로 로드되는지 확인
- [ ] 텍스트 수정 후 저장 시 RTDB가 업데이트되는지 확인
- [ ] 첨부파일 추가/삭제 후 저장 시 정상 동작하는지 확인
- [ ] 저장 완료 시 onSaved 콜백이 호출되는지 확인
- [ ] 취소 버튼 클릭 시 모달이 닫히는지 확인
- [ ] `editedAt` 필드가 정상적으로 업데이트되는지 확인

### 9.2 실시간 업데이트 테스트

- [ ] 메시지 수정 후 DatabaseListView가 자동으로 업데이트되는지 확인
- [ ] 다른 사용자가 보는 화면에서도 수정된 메시지가 실시간으로 반영되는지 확인

### 9.3 에러 처리 테스트

- [ ] RTDB 연결 실패 시 에러 메시지가 표시되는지 확인
- [ ] 네트워크 오류 시 적절한 에러 처리가 되는지 확인
- [ ] 권한 없는 메시지 수정 시 Security Rules가 차단하는지 확인

## 10. 보안

### 10.1 Security Rules

채팅 메시지 수정은 다음의 Security Rules로 보호됩니다:

```json
{
  "chat-messages": {
    "$roomId": {
      "$messageId": {
        ".write": "auth != null && data.child('senderUid').val() === auth.uid"
      }
    }
  }
}
```

**규칙**: 메시지 작성자만 수정 가능

### 10.2 클라이언트 검증

컴포넌트를 사용하는 부모 컴포넌트에서 수정 버튼을 조건부로 표시해야 합니다:

```svelte
{#if message.senderUid === authStore.user?.uid}
  <button onclick={() => handleEditMessage(message)}>수정</button>
{/if}
```

## 11. 관련 파일

### 11.1 연관 컴포넌트

- `src/lib/components/MessageEditModal.svelte` - UI 제공
- `src/lib/components/DatabaseListView.svelte` - 채팅 메시지 목록

### 11.2 관련 스펙 문서

- `specs/sonub-component-message-edit-modal.md` - MessageEditModal 상세 스펙
- `specs/sonub-chat-message.md` - 채팅 메시지 스펙
- `specs/sonub-firebase-database-structure.md` - RTDB 구조 스펙
- `specs/sonub-firebase-security-rules.md` - Security Rules 스펙
