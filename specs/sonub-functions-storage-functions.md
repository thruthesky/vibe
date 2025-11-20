---
name: sonub-functions-storage
title: Storage Functions 명세
version: 1.0.0
description: Firebase Storage 파일 업로드, 삭제, 유틸리티 함수 목록과 사용 규칙
author: JaeHo Song
email: thruthesky@gmail.com
license: GPL-3.0
created: 2025-01-20
updated: 2025-01-20
step: 30
priority: "*"
dependencies:
  - sonub-functions-overview.md
  - sonub-setup-firebase-storage.md
tags:
  - storage
  - functions
  - file-upload
  - firebase
---

# Storage Functions 명세

본 문서는 `src/lib/functions/storage.functions.ts` 파일에 정의된 Firebase Storage 관련 함수의 역할과 사용 규칙을 설명합니다. 전역 규칙은 반드시 [sonub-functions-overview.md](./sonub-functions-overview.md)를 먼저 읽은 후 적용합니다.

---

## 1. 파일 구조

**소스 코드 위치**: [storage.functions.ts.md](./repository/src/lib/functions/storage.functions.ts.md)

```
src/
└── lib/
    └── functions/
        └── storage.functions.ts   # Firebase Storage 관련 함수
```

### 작성 규칙 요약

1. **Firebase Storage 연동**: `firebase/storage` API를 사용하여 파일 업로드/삭제
2. **진행률 추적**: `uploadBytesResumable`를 사용하여 업로드 진행률 제공
3. **경로 규칙**: `users/{uid}/chat-files/{roomId}/{timestamp}-{filename}` 형식 사용
4. **에러 처리**: Promise reject를 통해 업로드 실패 처리

---

## 2. 제공 함수 목록

### 2.1 파일 업로드 함수

#### 2.1.1 `uploadChatFile()`

**소스 코드 위치**: [storage.functions.ts.md](./repository/src/lib/functions/storage.functions.ts.md)

```typescript
/**
 * 채팅 파일을 Firebase Storage에 업로드합니다.
 *
 * @param file - 업로드할 파일
 * @param uid - 사용자 UID
 * @param roomId - 채팅방 ID
 * @param onProgress - 업로드 진행률 콜백 (0-100)
 * @returns Promise<string> 업로드된 파일의 다운로드 URL
 */
export async function uploadChatFile(
  file: File,
  uid: string,
  roomId: string,
  onProgress?: (progress: number) => void
): Promise<string>
```

**Storage 경로**:
```
users/{uid}/chat-files/{roomId}/{timestamp}-{filename}
```

**파일명 형식**: `{timestamp}-{originalFilename}`
- 예: `1731580123456-photo.jpg`
- 타임스탬프로 중복 방지

**사용 예시**:

```typescript
try {
  const url = await uploadChatFile(
    file,
    'user123',
    'room456',
    (progress) => {
      console.log(`업로드 진행: ${progress}%`);
      // 진행률 표시 UI 업데이트
    }
  );

  console.log('업로드 완료:', url);
  // https://firebasestorage.googleapis.com/v0/b/.../photo.jpg
} catch (error) {
  console.error('업로드 실패:', error);
}
```

---

#### 2.1.2 `uploadMultipleChatFiles()`

**소스 코드 위치**: [storage.functions.ts.md](./repository/src/lib/functions/storage.functions.ts.md)

```typescript
/**
 * 다중 파일 업로드
 *
 * @param files - 업로드할 파일 목록
 * @param uid - 사용자 UID
 * @param roomId - 채팅방 ID
 * @param onProgress - 각 파일의 업로드 진행률 콜백
 * @returns Promise<Record<number, string>> 숫자 인덱스를 키로, URL을 값으로 하는 객체
 */
export async function uploadMultipleChatFiles(
  files: File[],
  uid: string,
  roomId: string,
  onProgress?: (fileIndex: number, progress: number) => void
): Promise<Record<number, string>>
```

**병렬 업로드**:
- `Promise.all()`을 사용하여 모든 파일을 동시에 업로드
- 각 파일의 진행률을 개별적으로 추적

**반환 형식**:
```typescript
{
  0: "https://.../file1.jpg",
  1: "https://.../file2.pdf",
  2: "https://.../file3.mp4"
}
```

**사용 예시**:

```typescript
const files = [file1, file2, file3];

const urls = await uploadMultipleChatFiles(
  files,
  'user123',
  'room456',
  (fileIndex, progress) => {
    console.log(`파일 ${fileIndex}: ${progress}%`);
  }
);

console.log(urls);
// { 0: "https://...", 1: "https://...", 2: "https://..." }
```

---

#### 2.1.3 `uploadCoverPhoto()`

**소스 코드 위치**: [storage.functions.ts.md](./repository/src/lib/functions/storage.functions.ts.md)

```typescript
/**
 * 사용자 커버 사진을 Firebase Storage에 업로드합니다.
 *
 * @param file - 업로드할 이미지 파일
 * @param uid - 사용자 UID
 * @param onProgress - 업로드 진행률 콜백 (0-100)
 * @returns Promise<string> 업로드된 파일의 다운로드 URL
 */
export async function uploadCoverPhoto(
  file: File,
  uid: string,
  onProgress?: (progress: number) => void
): Promise<string>
```

**Storage 경로**:
```
users/{uid}/profile/cover-photo-{timestamp}.{extension}
```

**파일 제한**:
- **타입**: 이미지 파일만 허용 (`file.type.startsWith('image/')`)
- **크기**: 최대 5MB

**사용 예시**:

```typescript
try {
  const url = await uploadCoverPhoto(
    coverImageFile,
    'user123',
    (progress) => console.log(`커버 사진 업로드: ${progress}%`)
  );

  // RTDB에 커버 사진 URL 저장
  await update(ref(rtdb, `users/${uid}`), { coverPhotoUrl: url });
} catch (error) {
  if (error.message.includes('이미지 파일만')) {
    alert('이미지 파일만 업로드 가능합니다.');
  } else if (error.message.includes('5MB')) {
    alert('파일 크기는 5MB 이하여야 합니다.');
  }
}
```

---

#### 2.1.4 `uploadProfilePhoto()`

**소스 코드 위치**: [storage.functions.ts.md](./repository/src/lib/functions/storage.functions.ts.md)

```typescript
/**
 * 사용자 프로필 사진을 Firebase Storage에 업로드합니다.
 *
 * @param file - 업로드할 이미지 파일
 * @param uid - 사용자 UID
 * @param onProgress - 업로드 진행률 콜백 (0-100)
 * @returns Promise<string> 업로드된 파일의 다운로드 URL
 */
export async function uploadProfilePhoto(
  file: File,
  uid: string,
  onProgress?: (progress: number) => void
): Promise<string>
```

**Storage 경로**:
```
users/{uid}/profile/profile-photo-{timestamp}.{extension}
```

**파일 제한**:
- **타입**: 이미지 파일만 허용
- **크기**: 최대 2MB (프로필 사진은 커버 사진보다 작음)

---

### 2.2 파일 삭제 함수

#### 2.2.1 `deleteChatFile()`

**소스 코드 위치**: [storage.functions.ts.md](./repository/src/lib/functions/storage.functions.ts.md)

```typescript
/**
 * Firebase Storage에서 파일을 삭제합니다.
 *
 * @param url - 삭제할 파일의 다운로드 URL
 * @returns Promise<void>
 */
export async function deleteChatFile(url: string): Promise<void>
```

**동작 과정**:
1. `getFilePathFromUrl(url)`로 Storage 경로 추출
2. `ref(storage, filePath)`로 Storage 참조 생성
3. `deleteObject(storageRef)` 호출하여 삭제

**사용 예시**:

```typescript
// 메시지 삭제 시 첨부 파일도 함께 삭제
const message = { urls: { 0: "https://...", 1: "https://..." } };

for (const url of Object.values(message.urls)) {
  try {
    await deleteChatFile(url);
    console.log('파일 삭제 완료:', url);
  } catch (error) {
    console.error('파일 삭제 실패:', error);
  }
}
```

---

### 2.3 파일 유틸리티 함수

#### 2.3.1 `formatFileSize()`

**소스 코드 위치**: [storage.functions.ts.md](./repository/src/lib/functions/storage.functions.ts.md)

```typescript
/**
 * 파일 크기를 읽기 쉬운 형식으로 변환
 *
 * @param bytes - 파일 크기 (바이트)
 * @returns 포맷된 파일 크기 문자열 (예: "1.5 MB")
 */
export function formatFileSize(bytes: number): string
```

**변환 규칙**:
- 0 → `"0 B"`
- 1024 → `"1.0 KB"`
- 1536000 → `"1.5 MB"`
- 1073741824 → `"1.0 GB"`

**사용 예시**:

```svelte
<script lang="ts">
  import { formatFileSize } from '$lib/functions/storage.functions';

  const file: File = ...;
  const sizeText = formatFileSize(file.size);
</script>

<p>파일 크기: {sizeText}</p>
<!-- 파일 크기: 1.5 MB -->
```

---

#### 2.3.2 `getFilenameFromUrl()`

**소스 코드 위치**: [storage.functions.ts.md](./repository/src/lib/functions/storage.functions.ts.md)

```typescript
/**
 * URL에서 파일명을 추출합니다.
 *
 * @param url - Firebase Storage URL
 * @returns 파일명 (timestamp 제거됨)
 */
export function getFilenameFromUrl(url: string): string
```

**변환 예시**:
- 입력: `https://.../1731580123456-photo.jpg?token=...`
- 출력: `photo.jpg`

**사용 예시**:

```typescript
const url = "https://.../1731580123456-document.pdf?token=xyz";
const filename = getFilenameFromUrl(url);
console.log(filename); // "document.pdf"
```

---

#### 2.3.3 `isImageUrl()` / `isVideoUrl()`

**소스 코드 위치**: [storage.functions.ts.md](./repository/src/lib/functions/storage.functions.ts.md)

```typescript
/**
 * URL이 이미지인지 확인합니다.
 */
export function isImageUrl(url: string): boolean

/**
 * URL이 동영상인지 확인합니다.
 */
export function isVideoUrl(url: string): boolean
```

**지원 확장자**:
- **이미지**: `.jpg`, `.jpeg`, `.png`, `.gif`, `.webp`, `.bmp`, `.svg`
- **동영상**: `.mp4`, `.mov`, `.avi`, `.webm`, `.mkv`

**사용 예시**:

```svelte
{#each Object.values(urls) as url}
  {#if isImageUrl(url)}
    <img src={url} alt="이미지" />
  {:else if isVideoUrl(url)}
    <video src={url} controls />
  {:else}
    <a href={url} download>파일 다운로드</a>
  {/if}
{/each}
```

---

#### 2.3.4 `getFileExtension()` / `getExtensionFromFilename()`

**소스 코드 위치**: [storage.functions.ts.md](./repository/src/lib/functions/storage.functions.ts.md)

```typescript
/**
 * URL에서 파일 확장자를 추출합니다.
 */
export function getFileExtension(url: string): string

/**
 * 파일명에서 확장자를 추출합니다.
 */
export function getExtensionFromFilename(filename: string): string
```

**사용 예시**:

```typescript
getFileExtension("https://.../document.pdf") // ".pdf"
getExtensionFromFilename("photo.jpg")        // ".jpg"
getExtensionFromFilename("archive.tar.gz")   // ".gz"
```

---

#### 2.3.5 `getFilePathFromUrl()`

**소스 코드 위치**: [storage.functions.ts.md](./repository/src/lib/functions/storage.functions.ts.md)

```typescript
/**
 * Firebase Storage URL에서 파일 경로를 추출합니다.
 *
 * @param url - Firebase Storage 다운로드 URL
 * @returns 파일 경로 (예: "users/uid/chat-files/roomId/timestamp-filename.jpg")
 */
export function getFilePathFromUrl(url: string): string
```

**URL 형식**:
```
https://firebasestorage.googleapis.com/v0/b/{bucket}/o/{encoded-path}?token=...
```

**추출 결과**:
```
users/uid/chat-files/roomid/1731580123456-photo.jpg
```

**내부 사용**:
- `deleteChatFile()` 함수가 이 함수를 사용하여 삭제할 파일 경로 확인

---

## 3. 적용 지침

### 3.1 파일 업로드 플로우

**MessageEditModal.svelte에서 파일 업로드**:

```typescript
async function processFiles(files: File[]) {
  for (const file of files) {
    // 1. 파일 크기 검증
    const isVideo = file.type === 'video/mp4' || file.name.endsWith('.mp4');
    const maxSize = isVideo ? 24 * 1024 * 1024 : 10 * 1024 * 1024;

    if (file.size > maxSize) {
      alert(`파일 크기 초과: ${formatFileSize(maxSize)} 이하만 가능`);
      continue;
    }

    // 2. 업로드
    const url = await uploadChatFile(file, uid, roomId, (progress) => {
      uploadProgress[file.name] = progress;
    });

    // 3. URL 저장
    urls = { ...urls, [nextIndex]: url };
  }
}
```

### 3.2 Storage 경로 규칙

모든 파일은 사용자 UID 기반 경로에 저장됩니다:

```
users/
  {uid}/
    chat-files/
      {roomId}/
        {timestamp}-{filename}
    profile/
      cover-photo-{timestamp}.{ext}
      profile-photo-{timestamp}.{ext}
```

**보안**:
- Firebase Storage Rules로 사용자는 자신의 `users/{uid}` 폴더에만 업로드 가능
- 다른 사용자의 폴더 접근 금지

### 3.3 파일 크기 제한

| 파일 타입 | 최대 크기 | 함수 |
|----------|---------|-----|
| 일반 파일 | 10MB | `uploadChatFile()` |
| 동영상 | 24MB | `uploadChatFile()` |
| 커버 사진 | 5MB | `uploadCoverPhoto()` |
| 프로필 사진 | 2MB | `uploadProfilePhoto()` |

### 3.4 에러 처리

```typescript
try {
  const url = await uploadChatFile(file, uid, roomId);
} catch (error) {
  if (error instanceof Error) {
    if (error.message.includes('초기화')) {
      alert('Firebase Storage가 초기화되지 않았습니다.');
    } else {
      alert('파일 업로드 실패: ' + error.message);
    }
  }
}
```

---

## 4. 사용 시나리오

### 4.1 채팅 메시지 첨부 파일 업로드

```typescript
// 1. 사용자가 파일 선택
const fileInput = document.querySelector('input[type="file"]');
const files = Array.from(fileInput.files);

// 2. 다중 파일 업로드
const urls = await uploadMultipleChatFiles(
  files,
  authStore.user!.uid,
  roomId,
  (fileIndex, progress) => {
    uploadingFiles[fileIndex].progress = progress;
  }
);

// 3. 메시지와 함께 RTDB에 저장
await push(ref(rtdb, `chat-messages/${roomId}`), {
  text: messageText,
  urls,
  senderUid: authStore.user!.uid,
  createdAt: Date.now()
});
```

### 4.2 프로필 사진 변경

```typescript
async function handleProfilePhotoChange(file: File) {
  try {
    // 1. 업로드
    const url = await uploadProfilePhoto(
      file,
      authStore.user!.uid,
      (progress) => {
        photoUploadProgress = progress;
      }
    );

    // 2. RTDB 업데이트
    await update(ref(rtdb, `users/${authStore.user!.uid}`), {
      photoUrl: url
    });

    console.log('프로필 사진 변경 완료');
  } catch (error) {
    console.error('프로필 사진 변경 실패:', error);
  }
}
```

### 4.3 메시지 삭제 시 첨부 파일도 삭제

```typescript
async function deleteMessage(messageId: string) {
  const message = await get(ref(rtdb, `chat-messages/${roomId}/${messageId}`));
  const urls = message.val()?.urls || {};

  // 1. Storage에서 파일 삭제
  for (const url of Object.values(urls)) {
    try {
      await deleteChatFile(url as string);
    } catch (error) {
      console.error('파일 삭제 실패:', error);
    }
  }

  // 2. RTDB에서 메시지 삭제 (Soft Delete)
  await update(ref(rtdb, `chat-messages/${roomId}/${messageId}`), {
    deleted: true,
    deletedAt: Date.now(),
    text: '',
    urls: null
  });
}
```

---

## 5. 테스트 시나리오

### 5.1 기본 업로드 테스트

- [ ] 단일 파일 업로드가 정상 동작하는지 확인
- [ ] 다중 파일 병렬 업로드가 정상 동작하는지 확인
- [ ] 진행률 콜백이 0%에서 100%까지 호출되는지 확인
- [ ] 업로드 완료 후 다운로드 URL이 유효한지 확인

### 5.2 파일 크기 제한 테스트

- [ ] 10MB 초과 파일 업로드 시 에러 발생하는지 확인
- [ ] 24MB 초과 동영상 업로드 시 에러 발생하는지 확인
- [ ] 커버 사진 5MB 제한이 동작하는지 확인
- [ ] 프로필 사진 2MB 제한이 동작하는지 확인

### 5.3 파일 삭제 테스트

- [ ] Storage에서 파일이 정상적으로 삭제되는지 확인
- [ ] 존재하지 않는 파일 삭제 시도 시 에러 처리되는지 확인

### 5.4 유틸리티 함수 테스트

- [ ] `formatFileSize()` 변환이 정확한지 확인
- [ ] `getFilenameFromUrl()` 추출이 정확한지 확인
- [ ] `isImageUrl()`, `isVideoUrl()` 판별이 정확한지 확인

---

## 6. 관련 파일

### 6.1 연관 컴포넌트

- `src/lib/components/MessageEditModal.svelte` - 파일 업로드 UI
- `src/lib/components/FileAttachments.svelte` - 첨부 파일 표시
- `src/routes/user/profile/+page.svelte` - 프로필/커버 사진 업로드

### 6.2 관련 스펙 문서

- `specs/sonub-component-message-edit-modal.md` - 파일 업로드 UI 스펙
- `specs/sonub-component-file-attachments.md` - 파일 표시 스펙
- `specs/sonub-setup-firebase-storage.md` - Firebase Storage 설정

---

## 7. 작업 이력 (SED Log)

| 날짜 | 작업자 | 변경 내용 |
| ---- | ------ | -------- |
| 2025-01-20 | Claude Code | Storage Functions 명세 최초 작성 |
