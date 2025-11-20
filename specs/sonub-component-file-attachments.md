---
name: sonub-component-file-attachments
version: 1.0.0
description: 첨부 파일 표시 재사용 컴포넌트 SED 명세서
author: JaeHo Song
email: thruthesky@gmail.com
license: GPL-3.0
created: 2025-01-20
updated: 2025-01-20
step: 1
priority: "high"
dependencies: ["sonub-design-guideline.md", "sonub-firebase-storage.md"]
tags: ["component", "attachment", "file", "image", "video", "display", "reusable"]
---

# FileAttachments 컴포넌트 상세 스펙

## 1. 개요

### 1.1 목적

FileAttachments는 첨부 파일 목록을 받아서 미리보기로 표시하는 재사용 가능한 컴포넌트입니다. 이미지, 비디오, 기타 파일을 구분하여 표시하며, 이미지 확대 보기, 비디오 재생, 파일 다운로드 기능을 제공합니다.

### 1.2 적용 범위

본 컴포넌트는 다음의 위치에서 재사용됩니다:

- **PostItem** - 게시글 카드
- **PostCommentList** - 댓글 목록
- **ChatMessageItem** - 채팅 메시지 (예정)
- **UserProfilePage** - 사용자 프로필 (예정)

### 1.3 주요 기능

1. **이미지 미리보기** - 그리드 레이아웃으로 썸네일 표시
2. **비디오 재생** - 인라인 비디오 플레이어 with controls
3. **파일 다운로드** - 기타 파일 클릭 시 다운로드
4. **이미지 확대** - 모달로 이미지 전체 보기
5. **전체 보기/접기** - 많은 파일 시 +N 오버레이로 전체 보기
6. **반응형 그리드** - 1개/2개/3개 이상에 따라 레이아웃 변경

## 2. 컴포넌트 위치

```
src/lib/components/FileAttachments.svelte
```

Repository 문서:
```
specs/repository/src/lib/components/FileAttachments.svelte.md
```

## 3. Props 인터페이스

### 3.1 Props 정의

| 이름 | 타입 | 필수 | 기본값 | 설명 |
|------|------|------|--------|------|
| `urls` | `Record<number, string>` | ✅ | - | 첨부 파일 URL 목록 (인덱스 → URL 맵) |
| `maxDisplay` | `number` | ❌ | `30` | 최대 표시 개수 |
| `thumbnailSize` | `string` | ❌ | `'h-32 w-32'` | 썸네일 크기 (Tailwind 클래스) |

### 3.2 Props 사용 예시

```svelte
<!-- 기본 사용 -->
<FileAttachments urls={post.urls} />

<!-- 최대 5개까지만 표시 -->
<FileAttachments urls={post.urls} maxDisplay={5} />

<!-- 커스텀 썸네일 크기 -->
<FileAttachments urls={comment.urls} thumbnailSize="h-24 w-24" />
```

## 4. 그리드 레이아웃

### 4.1 레이아웃 규칙

첨부 파일 개수에 따라 다른 그리드 레이아웃을 사용합니다:

| 개수 | 그리드 | 첫 번째 아이템 | 나머지 아이템 | 시각적 효과 |
|------|--------|----------------|---------------|------------|
| 1개 | 1열 | `col-span-1` | - | 전체 너비 |
| 2개 | 2열 | `col-span-1` | `col-span-1` | 50% / 50% |
| 3개 이상 | 2열 | `col-span-2` | `col-span-1` | 첫 번째 강조 |

### 4.2 그리드 클래스 함수

```typescript
const getGridClass = (count: number) => {
  if (count === 1) return 'grid-cols-1';
  return 'grid-cols-2';
};

const getItemSpanClass = (index: number, totalCount: number) => {
  if (totalCount === 1 || totalCount === 2) {
    return 'col-span-1';
  }
  // 3개 이상: 첫 번째만 2칸, 나머지는 1칸
  return index === 0 ? 'col-span-2' : 'col-span-1';
};
```

### 4.3 레이아웃 예시

**1개**:
```
┌─────────────┐
│   Image 1   │
└─────────────┘
```

**2개**:
```
┌──────┬──────┐
│Img 1 │Img 2 │
└──────┴──────┘
```

**3개 이상**:
```
┌─────────────┐
│   Image 1   │
├──────┬──────┤
│Img 2 │Img 3 │
└──────┴──────┘
```

## 5. 파일 타입 처리

### 5.1 타입 구분

첨부 파일은 다음의 3가지 타입으로 구분됩니다:

1. **이미지** - `.jpg`, `.jpeg`, `.png`, `.gif`, `.webp`, `.svg`
2. **비디오** - `.mp4`, `.webm`, `.ogg`
3. **기타 파일** - `.pdf`, `.txt`, `.doc`, `.docx`, `.zip`, `.rar` 등

### 5.2 타입 판별 함수

```typescript
import { isImageUrl, isVideoUrl } from '$lib/functions/storage.functions';

// 이미지 판별
if (isImageUrl(url)) {
  // 이미지 미리보기
}

// 비디오 판별
if (isVideoUrl(url)) {
  // 비디오 플레이어
}

// 기타 파일
else {
  // 파일 아이콘 + 확장자
}
```

## 6. 이미지 확대 모달

### 6.1 모달 상태

```typescript
let showModal = $state(false);
let selectedImageUrl = $state('');
```

### 6.2 모달 열기/닫기

```typescript
function openImageModal(url: string) {
  selectedImageUrl = url;
  showModal = true;
}

function closeModal() {
  showModal = false;
  selectedImageUrl = '';
}
```

### 6.3 모달 UI

```svelte
{#if showModal}
  <div class="fixed inset-0 z-50 flex items-center justify-center" onclick={closeModal}>
    <!-- 어두운 배경 -->
    <div class="absolute inset-0 bg-black/80"></div>

    <!-- 이미지 컨테이너 -->
    <div class="relative z-10 max-h-[90vh] max-w-[90vw]">
      <!-- 뒤로가기 버튼 (왼쪽 상단) -->
      <button onclick={closeModal} class="...">
        <BackIcon />
      </button>

      <!-- 닫기 버튼 (오른쪽 상단) -->
      <button onclick={closeModal} class="...">
        <CloseIcon />
      </button>

      <!-- 확대된 이미지 -->
      <img
        src={selectedImageUrl}
        alt="확대 이미지"
        class="max-h-[90vh] max-w-[90vw] rounded-lg object-contain shadow-2xl"
        onclick={(e) => e.stopPropagation()}
      />
    </div>
  </div>
{/if}
```

### 6.4 ESC 키로 닫기

```svelte
<div
  class="..."
  onkeydown={(e) => e.key === 'Escape' && closeModal()}
>
```

## 7. 전체 보기/접기 기능

### 7.1 상태 관리

```typescript
let showAll = $state(false);

const remainingCount = $derived(urlArray.length - maxDisplay);

const displayUrls = $derived(
  showAll ? urlArray : urlArray.slice(0, maxDisplay)
);
```

### 7.2 +N 오버레이

마지막 아이템에 오버레이를 표시하여 남은 파일 개수를 보여줍니다.

```svelte
{@const isLastItem = !showAll && remainingCount > 0 && index === maxDisplay - 1}

{#if isLastItem}
  <div class="attachment-overlay">
    <span class="text-4xl font-bold text-white">+{remainingCount}</span>
  </div>
{/if}
```

### 7.3 전체 보기 토글

```typescript
function toggleShowAll() {
  showAll = !showAll;
}
```

### 7.4 접기 버튼

전체 보기 상태에서 접기 버튼을 표시합니다.

```svelte
{#if showAll && urlArray.length > maxDisplay}
  <button onclick={toggleShowAll} class="attachment-item attachment-more">
    <UpArrowIcon />
    <span>접기</span>
  </button>
{/if}
```

## 8. 파일 다운로드

### 8.1 다운로드 함수

```typescript
function downloadFile(url: string) {
  const link = document.createElement('a');
  link.href = url;
  link.download = '';
  link.target = '_blank';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}
```

### 8.2 사용

```svelte
<button onclick={() => downloadFile(url)}>
  <FileIcon />
  <span>{getFileExtension(url)}</span>
</button>
```

## 9. 비디오 재생

### 9.1 비디오 플레이어

```svelte
{:else if isVideoUrl(urlString)}
  <div class="attachment-item {spanClass}">
    <video src={urlString} class="attachment-video" controls preload="metadata">
      <track kind="captions" />
    </video>
  </div>
{/if}
```

### 9.2 비디오 속성

- `controls` - 재생/일시정지/볼륨 컨트롤 표시
- `preload="metadata"` - 메타데이터만 미리 로드 (썸네일 생성)
- `<track kind="captions" />` - 접근성 지원

## 10. 스타일링

### 10.1 Tailwind CSS 클래스

주요 클래스:

- `.attachment-grid` - 그리드 컨테이너
- `.attachment-item` - 각 첨부 파일 아이템
- `.attachment-image` - 이미지 스타일
- `.attachment-video` - 비디오 스타일
- `.attachment-file` - 파일 아이콘 스타일
- `.attachment-overlay` - +N 오버레이
- `.attachment-more` - 접기 버튼

### 10.2 반응형 그리드

```css
.attachment-grid {
  @apply w-full;
}

.attachment-item {
  @apply relative overflow-hidden rounded-lg;
  @apply min-h-[200px];
  @apply transition-transform hover:scale-[1.02];
  @apply cursor-pointer;
}
```

### 10.3 호버 효과

```css
.attachment-item {
  @apply transition-transform hover:scale-[1.02];
}

.attachment-file {
  @apply hover:bg-gray-200;
}

.attachment-more {
  @apply hover:bg-gray-300;
}
```

## 11. 사용 예제

### 11.1 게시글 카드에서 사용

```svelte
<script lang="ts">
  import FileAttachments from '$lib/components/FileAttachments.svelte';

  let post = {
    text: '여행 사진 공유',
    urls: {
      0: 'https://example.com/image1.jpg',
      1: 'https://example.com/image2.jpg',
      2: 'https://example.com/video.mp4'
    }
  };
</script>

<div class="post-card">
  <p>{post.text}</p>
  <FileAttachments urls={post.urls} maxDisplay={5} />
</div>
```

### 11.2 댓글에서 사용

```svelte
<script lang="ts">
  import FileAttachments from '$lib/components/FileAttachments.svelte';

  let comment = {
    text: '첨부 파일 확인 부탁드립니다',
    urls: {
      0: 'https://example.com/document.pdf'
    }
  };
</script>

<div class="comment-item">
  <p>{comment.text}</p>
  {#if comment.urls && Object.keys(comment.urls).length > 0}
    <FileAttachments urls={comment.urls} />
  {/if}
</div>
```

## 12. 의존성

### 12.1 함수 의존성

- `$lib/functions/storage.functions` - 파일 타입 판별
  - `isImageUrl()` - 이미지 URL 판별
  - `isVideoUrl()` - 비디오 URL 판별

### 12.2 i18n 의존성

- `m.fileAttachmentImage()` - 이미지 alt 텍스트
- `m.fileAttachmentZoomed()` - 확대 이미지 alt 텍스트
- `m.commonBack()` - 뒤로가기 버튼 aria-label
- `m.commonClose()` - 닫기 버튼 aria-label
- `m.attachmentShowLess()` - 접기 버튼 텍스트

## 13. 성능 최적화

### 13.1 이미지 지연 로딩

```svelte
<img src={url} loading="lazy" alt="첨부 이미지" />
```

### 13.2 비디오 메타데이터만 로드

```svelte
<video preload="metadata" src={url}>
```

### 13.3 Derived 값 사용

```typescript
const urlArray = $derived(Object.values(urls));
const remainingCount = $derived(urlArray.length - maxDisplay);
const displayUrls = $derived(showAll ? urlArray : urlArray.slice(0, maxDisplay));
```

## 14. 접근성 (a11y)

### 14.1 버튼 aria-label

```svelte
<button aria-label={m.commonBack()}>
  <BackIcon />
</button>

<button aria-label={m.commonClose()}>
  <CloseIcon />
</button>
```

### 14.2 이미지 alt 텍스트

```svelte
<img src={url} alt={m.fileAttachmentImage()} />
```

### 14.3 키보드 네비게이션

```svelte
<div
  role="button"
  tabindex="0"
  onkeydown={(e) => e.key === 'Escape' && closeModal()}
>
```

## 15. 테스트 시나리오

### 15.1 기본 기능 테스트

- [ ] 이미지 파일이 정상적으로 썸네일로 표시되는지 확인
- [ ] 비디오 파일이 플레이어로 표시되는지 확인
- [ ] 기타 파일이 아이콘과 확장자로 표시되는지 확인
- [ ] 이미지 클릭 시 모달로 확대되는지 확인
- [ ] 파일 클릭 시 다운로드되는지 확인
- [ ] 비디오 재생/일시정지가 정상 동작하는지 확인

### 15.2 레이아웃 테스트

- [ ] 1개 첨부 시 전체 너비로 표시되는지 확인
- [ ] 2개 첨부 시 50%/50% 레이아웃으로 표시되는지 확인
- [ ] 3개 이상 첨부 시 첫 번째가 강조되는지 확인
- [ ] maxDisplay 이상일 때 +N 오버레이가 표시되는지 확인
- [ ] +N 클릭 시 전체 보기가 활성화되는지 확인
- [ ] 접기 버튼 클릭 시 다시 축소되는지 확인

### 15.3 모달 테스트

- [ ] 이미지 모달이 정상적으로 열리는지 확인
- [ ] ESC 키로 모달이 닫히는지 확인
- [ ] 뒤로가기/닫기 버튼으로 모달이 닫히는지 확인
- [ ] 배경 클릭 시 모달이 닫히는지 확인
- [ ] 이미지 클릭 시 모달이 닫히지 않는지 확인

## 16. 관련 파일

### 16.1 사용하는 컴포넌트

- `src/lib/components/post/PostItem.svelte` - 게시글 카드
- `src/lib/components/post/PostCommentList.svelte` - 댓글 목록

### 16.2 관련 스펙 문서

- `specs/sonub-component-post-item.md` - PostItem 상세 스펙
- `specs/sonub-firebase-storage.md` - Firebase Storage 스펙
- `specs/sonub-design-guideline.md` - 디자인 가이드라인
