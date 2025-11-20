---
name: sonub-component-message-edit-modal
version: 1.0.0
description: 메시지/게시글/댓글 생성 및 수정을 위한 재사용 가능한 모달 컴포넌트 SED 명세서
author: JaeHo Song
email: thruthesky@gmail.com
license: GPL-3.0
created: 2025-01-20
updated: 2025-01-20
step: 1
priority: "high"
dependencies: ["sonub-design-guideline.md", "sonub-firebase-storage.md", "sonub-i18n-paraglide.md"]
tags: ["component", "modal", "edit", "file-upload", "reusable", "ui"]
---

# MessageEditModal 컴포넌트 상세 스펙

## 1. 개요

### 1.1 목적

MessageEditModal은 채팅 메시지, 게시글, 댓글의 생성 및 수정 시 재사용할 수 있는 공용 모달 컴포넌트입니다. 텍스트 입력, 파일 업로드, 드래그 앤 드롭 정렬 등 UI 로직을 담당하며, 비즈니스 로직(저장, 유효성 검사)은 부모 컴포넌트에 위임합니다.

### 1.2 적용 범위

본 컴포넌트는 다음의 상위 컴포넌트에서 재사용됩니다:

- **ChatMessageEditModal** - 채팅 메시지 수정
- **PostCreateDialog** - 게시글 작성
- **PostEditDialog** - 게시글 수정
- **CommentCreateDialog** - 댓글 작성
- **CommentEditDialog** - 댓글 수정

### 1.3 주요 기능

1. **텍스트 편집** - 8줄 textarea로 텍스트 입력
2. **파일 업로드** - Firebase Storage를 통한 이미지/비디오/문서 업로드
3. **업로드 진행률** - 원형 프로그레스 바로 실시간 진행률 표시
4. **드래그 앤 드롭 정렬** - 업로드된 파일 순서 재정렬
5. **파일 미리보기** - 이미지/비디오 썸네일, 기타 파일은 확장자 표시
6. **에러 처리** - 업로드 실패, 크기 초과 등 에러 메시지 표시
7. **추가 필드 슬롯** - 카테고리 선택 등 커스텀 필드 추가 가능

## 2. 컴포넌트 위치

```
src/lib/components/MessageEditModal.svelte
```

Repository 문서:
```
specs/repository/src/lib/components/MessageEditModal.svelte.md
```

## 3. Props 인터페이스

### 3.1 필수 Props

| 이름 | 타입 | 설명 |
|------|------|------|
| `open` | `boolean` | 모달 열림 상태 (bindable) |
| `title` | `string` | Dialog 제목 |
| `roomId` | `string` | Firebase Storage 경로에 사용되는 roomId |
| `onSave` | `(text: string, urls: Record<number, string>) => Promise<{ success: boolean; error?: string }>` | 저장 버튼 클릭 시 호출되는 콜백 함수 |

### 3.2 선택 Props

| 이름 | 타입 | 기본값 | 설명 |
|------|------|--------|------|
| `textLabel` | `string` | `m.messageEditContentLabel()` | 텍스트 입력 필드 라벨 |
| `initialText` | `string` | `''` | 초기 텍스트 값 |
| `initialUrls` | `Record<number, string>` | `{}` | 초기 첨부파일 URL 목록 |
| `saveButtonText` | `string` | `m.messageEditSave()` | 저장 버튼 텍스트 |
| `cancelButtonText` | `string` | `m.messageEditCancel()` | 취소 버튼 텍스트 |
| `textPlaceholder` | `string` | `m.messageEditPlaceholder()` | 텍스트 입력 placeholder |
| `onCancel` | `() => void` | `undefined` | 취소 버튼 클릭 시 호출되는 콜백 함수 |
| `hasAdditionalFields` | `boolean` | `false` | 추가 필드 슬롯 사용 여부 |
| `children` | `Snippet` | `undefined` | 추가 필드 슬롯 (Svelte 5) |

## 4. 상태 관리

### 4.1 내부 상태

```typescript
let text = $state(initialText);                          // 현재 텍스트
let urls = $state<Record<number, string>>({ ...initialUrls }); // 첨부파일 URL 맵
let uploadingFiles: FileUploadStatus[] = $state([]);     // 업로드 중인 파일 목록
let saving = $state(false);                              // 저장 중 플래그
let error = $state<string | null>(null);                 // 에러 메시지
let draggedIndex: number | null = $state(null);          // 드래그 중인 파일 인덱스
let dragOverIndex: number | null = $state(null);         // 드래그 오버 중인 파일 인덱스
```

### 4.2 파일 업로드 상태 타입

```typescript
interface FileUploadStatus {
  file: File;                // 원본 파일 객체
  progress: number;          // 업로드 진행률 (0-100)
  completed: boolean;        // 업로드 완료 여부
  downloadUrl?: string;      // 업로드 완료 후 다운로드 URL
  error?: string;            // 에러 메시지
}
```

## 5. 파일 업로드 로직

### 5.1 파일 크기 제한

- **일반 파일**: 최대 10MB
- **동영상 파일** (.mp4): 최대 24MB

### 5.2 업로드 프로세스

```
1. 파일 크기 검증 → 유효한 파일만 필터링
2. uploadingFiles 배열에 추가
3. URL 인덱스 미리 할당 (동시 업로드 시 충돌 방지)
4. 병렬 업로드 (Promise.allSettled)
5. 진행률 업데이트 (각 파일 독립적)
6. 완료된 파일 urls에 추가
7. uploadingFiles에서 완료 파일 제거
```

### 5.3 핵심 함수

#### processFiles(files: File[])

여러 파일을 동시에 병렬로 업로드합니다.

```typescript
async function processFiles(files: File[]) {
  // 1. 파일 크기 검증
  const validFiles: File[] = [];
  for (const file of files) {
    const isVideo = file.type === 'video/mp4' || file.name.toLowerCase().endsWith('.mp4');
    const maxSize = isVideo ? MAX_VIDEO_SIZE : MAX_FILE_SIZE;
    if (file.size > maxSize) {
      alert(m.fileUploadSizeExceeded({ maxSize, fileName: file.name }));
      continue;
    }
    validFiles.push(file);
  }

  // 2. uploadingFiles 배열에 추가
  const newFileStatuses: FileUploadStatus[] = validFiles.map((file) => ({
    file,
    progress: 0,
    completed: false
  }));
  uploadingFiles = [...uploadingFiles, ...newFileStatuses];

  // 3. URL 인덱스 미리 할당
  const urlIndices: number[] = [];
  for (let i = 0; i < validFiles.length; i++) {
    const nextIndex = Math.max(...Object.keys(urls).map(Number), ...urlIndices, -1) + 1;
    urlIndices.push(nextIndex);
  }

  // 4. 병렬 업로드
  const uploadPromises = validFiles.map(async (file, i) => {
    const downloadUrl = await uploadChatFile(
      file,
      authStore.user!.uid,
      roomId,
      (progress) => {
        // 진행률 업데이트
        uploadingFiles[startIndex + i].progress = progress;
      }
    );
    // urls에 추가
    urls = { ...urls, [urlIndices[i]]: downloadUrl };
  });

  await Promise.allSettled(uploadPromises);

  // 5. 완료된 파일 제거
  uploadingFiles = uploadingFiles.filter((fs) => !fs.completed);
}
```

## 6. 드래그 앤 드롭 정렬

### 6.1 정렬 로직

사용자가 업로드된 파일의 순서를 드래그 앤 드롭으로 변경할 수 있습니다.

```typescript
function reorderUrls(fromIndex: number, toIndex: number) {
  // 1. urls를 배열로 변환
  const entries = Object.entries(urls).map(([idx, url]) => ({
    index: Number(idx),
    url
  }));

  // 2. 배열에서 이동
  const fromEntryIdx = entries.findIndex((e) => e.index === fromIndex);
  const toEntryIdx = entries.findIndex((e) => e.index === toIndex);
  const [movedItem] = entries.splice(fromEntryIdx, 1);
  entries.splice(toEntryIdx, 0, movedItem);

  // 3. 새로운 인덱스로 Record 재구성
  const newUrls: Record<number, string> = {};
  entries.forEach((entry, idx) => {
    newUrls[idx] = entry.url;
  });

  urls = newUrls;
}
```

### 6.2 드래그 이벤트

- `ondragstart` - 드래그 시작 시 draggedIndex 저장
- `ondragover` - 드래그 오버 시 dragOverIndex 업데이트 (드롭 허용)
- `ondrop` - 드롭 시 reorderUrls() 호출하여 순서 변경
- `ondragend` - 드래그 종료 시 상태 초기화

## 7. 저장 및 취소 처리

### 7.1 저장 로직

```typescript
async function handleSave() {
  // 1. 업로드 중인 파일 확인
  const incompleteFiles = uploadingFiles.filter((fs) => !fs.completed && !fs.error);
  if (incompleteFiles.length > 0) {
    error = m.fileUploadIncomplete({ count: incompleteFiles.length });
    return;
  }

  // 2. 부모 컴포넌트의 onSave 콜백 호출
  const result = await onSave(text.trim(), urls);

  // 3. 결과 처리
  if (!result.success) {
    error = result.error || m.messageEditSaveFailed();
    return;
  }

  // 4. 저장 성공 시 모달 닫기
  open = false;
}
```

### 7.2 취소 로직

```typescript
function handleCancel() {
  // 1. 새로 업로드된 파일 삭제 (초기 파일 제외)
  const initialUrlValues = Object.values(initialUrls);
  uploadingFiles.forEach(async (fileStatus) => {
    if (fileStatus.downloadUrl && !initialUrlValues.includes(fileStatus.downloadUrl)) {
      await deleteChatFile(fileStatus.downloadUrl);
    }
  });

  // 2. 상태 초기화
  text = initialText;
  urls = { ...initialUrls };
  uploadingFiles = [];
  error = null;

  // 3. 모달 닫기
  if (onCancel) {
    onCancel();
  } else {
    open = false;
  }
}
```

## 8. 사용 예제

### 8.1 기본 사용 (채팅 메시지 수정)

```svelte
<script lang="ts">
  import MessageEditModal from '$lib/components/MessageEditModal.svelte';
  import { rtdb } from '$lib/firebase';
  import { ref, update } from 'firebase/database';

  let editModalOpen = $state(false);
  let messageId = 'message-123';
  let roomId = 'room-456';
  let initialText = '기존 메시지 내용';
  let initialUrls = { 0: 'https://example.com/image.jpg' };

  async function handleSave(text: string, urls: Record<number, string>) {
    const messageRef = ref(rtdb, `chat-messages/${roomId}/${messageId}`);
    await update(messageRef, {
      text: text.trim(),
      urls,
      editedAt: Date.now()
    });
    return { success: true };
  }
</script>

<MessageEditModal
  bind:open={editModalOpen}
  title="메시지 수정"
  {roomId}
  {initialText}
  {initialUrls}
  onSave={handleSave}
/>
```

### 8.2 추가 필드 슬롯 사용 (게시글 작성 - 카테고리 선택)

```svelte
<script lang="ts">
  import MessageEditModal from '$lib/components/MessageEditModal.svelte';
  import { FORUM_CATEGORIES } from '../../../../shared/categories';

  let createModalOpen = $state(false);
  let selectedCategory = $state('story');

  async function handleSave(text: string, urls: Record<number, string>) {
    // 게시글 저장 로직
    const payload = {
      text: text.trim(),
      urls,
      category: selectedCategory,
      authorUid: authStore.user.uid,
      createdAt: Date.now()
    };
    await pushData('posts', payload);
    return { success: true };
  }
</script>

<MessageEditModal
  bind:open={createModalOpen}
  title="게시글 작성"
  roomId="post"
  hasAdditionalFields={true}
  onSave={handleSave}
>
  <!-- 추가 필드: 카테고리 선택 -->
  <div class="additional-fields">
    <select bind:value={selectedCategory} class="form-select">
      <option value="">카테고리 선택</option>
      {#each FORUM_CATEGORIES as category}
        <option value={category}>{getCategoryMessage(category)}</option>
      {/each}
    </select>
  </div>
</MessageEditModal>
```

## 9. 스타일링

### 9.1 Tailwind CSS 클래스

본 컴포넌트는 Tailwind CSS `@apply` 지시어를 사용하여 스타일을 정의합니다.

주요 클래스:

- `.edit-modal-content` - 모달 내부 컨테이너
- `.form-group` - 폼 그룹 (라벨 + 입력)
- `.form-textarea` - 텍스트 입력 영역
- `.file-grid` - 파일 그리드 (2열 또는 3열)
- `.file-item` - 각 파일 아이템
- `.file-drag-handle` - 드래그 핸들 버튼
- `.upload-progress-overlay` - 업로드 진행률 오버레이
- `.progress-ring-circle` - 원형 프로그레스 바

### 9.2 드래그 앤 드롭 스타일

```css
.file-item {
  cursor: grab;
}

.file-item:active {
  cursor: grabbing;
}

.file-item-dragging {
  @apply opacity-50 scale-95 rotate-2;
  @apply border-blue-400;
}

.file-item-drag-over {
  @apply border-blue-500 border-dashed bg-blue-50/50;
  @apply scale-105;
}
```

## 10. 의존성

### 10.1 컴포넌트 의존성

- `$lib/components/ui/dialog` - shadcn Dialog 컴포넌트
- `$lib/components/ui/button` - shadcn Button 컴포넌트

### 10.2 함수 의존성

- `$lib/functions/storage.functions` - Firebase Storage 업로드/삭제 함수
  - `uploadChatFile()` - 파일 업로드
  - `deleteChatFile()` - 파일 삭제
  - `isImageUrl()` - 이미지 URL 판별
  - `isVideoUrl()` - 비디오 URL 판별
  - `getFilenameFromUrl()` - URL에서 파일명 추출
  - `getExtensionFromFilename()` - 파일 확장자 추출

### 10.3 타입 의존성

- `$lib/types/chat.types` - `FileUploadStatus` 인터페이스

### 10.4 스토어 의존성

- `$lib/stores/auth.svelte` - `authStore` (현재 사용자 정보)

## 11. 테스트 시나리오

### 11.1 기본 기능 테스트

- [ ] 모달 열기/닫기가 정상 동작하는지 확인
- [ ] 텍스트 입력이 정상적으로 동작하는지 확인
- [ ] 파일 선택 버튼 클릭 시 파일 선택 창이 열리는지 확인
- [ ] 여러 파일 동시 업로드 시 모두 병렬로 업로드되는지 확인
- [ ] 업로드 진행률이 실시간으로 표시되는지 확인
- [ ] 드래그 앤 드롭으로 파일 순서 변경이 가능한지 확인
- [ ] 파일 삭제 버튼 클릭 시 파일이 제거되는지 확인
- [ ] 저장 버튼 클릭 시 onSave 콜백이 호출되는지 확인
- [ ] 취소 버튼 클릭 시 새로 업로드된 파일이 삭제되는지 확인

### 11.2 에러 처리 테스트

- [ ] 파일 크기 초과 시 에러 메시지가 표시되는지 확인
- [ ] 업로드 중인 파일이 있을 때 저장 시도 시 에러 메시지가 표시되는지 확인
- [ ] 업로드 실패한 파일이 있을 때 저장 시도 시 에러 메시지가 표시되는지 확인
- [ ] onSave 콜백에서 에러 반환 시 에러 메시지가 표시되는지 확인

### 11.3 엣지 케이스 테스트

- [ ] 동시에 10개 이상의 파일 업로드 시 정상 동작하는지 확인
- [ ] 파일 업로드 중 취소 시 Storage에서도 삭제되는지 확인
- [ ] initialUrls가 비어있는 경우 정상 동작하는지 확인
- [ ] initialText가 매우 긴 경우 textarea가 정상 표시되는지 확인

## 12. 관련 파일

### 12.1 재사용하는 상위 컴포넌트

- `src/lib/components/chat/ChatMessageEditModal.svelte` - 채팅 메시지 수정
- `src/lib/components/post/PostCreateDialog.svelte` - 게시글 작성
- `src/lib/components/post/PostEditDialog.svelte` - 게시글 수정
- `src/lib/components/comment/CommentCreateDialog.svelte` - 댓글 작성
- `src/lib/components/comment/CommentEditDialog.svelte` - 댓글 수정

### 12.2 관련 스펙 문서

- `specs/sonub-component-chat-message-edit-modal.md` - 채팅 메시지 수정 모달
- `specs/sonub-component-post-create-dialog.md` - 게시글 작성 다이얼로그
- `specs/sonub-component-post-edit-dialog.md` - 게시글 수정 다이얼로그
- `specs/sonub-component-comment-edit-dialog.md` - 댓글 수정 다이얼로그
- `specs/sonub-firebase-storage.md` - Firebase Storage 통합 스펙
- `specs/sonub-design-guideline.md` - UI 디자인 가이드라인
