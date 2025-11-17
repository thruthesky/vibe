---
name: sonub-design-components
version: 1.1.0
description: Light Mode 전용 Sonub UI 컴포넌트(버튼, 카드, 얼럿) 설계 및 시나리오
author: Codex Agent
email: noreply@openai.com
step: 35
priority: '**'
dependencies:
  - sonub-design-workflow.md
  - sonub-design-guideline.md
  - sonub-setup-shadcn.md
  - sonub-setup-tailwind.md
related:
  - sonub-ui-button.md
  - sonub-ui-card.md
  - sonub-ui-alert.md
tags:
  - ui-components
  - light-mode
  - tailwindcss
  - shadcn-svelte
  - svelte5
---

# Sonub Design Components

## 1. 개요

- Sonub 프로젝트는 Light Mode만 지원하며, shadcn-svelte 컴포넌트를 프로젝트 정책에 맞게 커스터마이징하여 `src/lib/components/ui`에 보관한다.
- 모든 컴포넌트는 Svelte 5 Runes 문법($props, $state, $derived)과 `cn()` 헬퍼(clsx + tailwind-merge)를 사용해 타입 안전성과 Tailwind 클래스 병합을 보장한다.

## 2. 구성 요소 구조

```
src/lib/components/ui/
├── button/
│   ├── button.svelte      # 링크/버튼 겸용 CTA
│   └── index.ts
├── card/
│   ├── card.svelte        # Card Root
│   ├── card-header.svelte
│   ├── card-title.svelte
│   ├── card-description.svelte
│   ├── card-content.svelte
│   ├── card-footer.svelte
│   └── index.ts
└── alert/
    ├── alert.svelte       # Alert Root
    ├── alert-title.svelte
    ├── alert-description.svelte
    └── index.ts
```

## 3. Button

### 3.1 목적
- Light Mode 스타일 + 프로젝트 정책(항상 `cursor-pointer`, focus ring, disabled 링크 접근성)을 기본값으로 강제한다.
- `href`를 전달하면 자동으로 `<a>` 태그를 렌더링하여 탭/네비게이션 요소도 동일한 API로 처리한다.

### 3.2 Props 요약
| Prop | 타입 | 기본값 | 설명 |
|------|------|--------|------|
| `variant` | `'default'|'destructive'|'outline'|'secondary'|'ghost'|'link'` | `default` | 색상/배경 스타일 |
| `size` | `'default'|'sm'|'lg'|'icon'|'icon-sm'|'icon-lg'` | `default` | 높이 및 패딩, 아이콘 버튼도 세분화 |
| `href` | `string` | 없음 | 값이 존재하면 `<a>`로 렌더링 |
| `disabled` | `boolean` | `false` | `<button>`뿐 아니라 `<a>`일 때도 `aria-disabled`, `tabindex=-1`, `pointer-events:none` 처리 |
| `children` | `Snippet` | - | 버튼 콘텐츠(텍스트, 아이콘 등) |

### 3.3 구현 핵심
```svelte
{#if href}
  <a
    href={disabled ? undefined : href}
    aria-disabled={disabled ? 'true' : undefined}
    tabindex={disabled ? -1 : undefined}
    class={cn(baseClass, variantStyles[variant], sizeStyles[size], iconStyles[size], disabled && 'opacity-50', className)}
  >
    {@render children?.()}
  </a>
{:else}
  <button disabled={disabled} class={cn(...)}>
    {@render children?.()}
  </button>
{/if}
```
- `iconStyles`는 `[&>svg]` 셀렉터를 이용해 아이콘 크기를 자동으로 맞춘다.
- 관리자 상단 탭, 사용자 목록 페이지, 홈/메뉴 페이지 등 모든 CTA가 이 컴포넌트를 사용하도록 통일했다.

## 4. Card

### 4.1 목적
- 정보 블록(통계, 안내, 리스트)을 일관된 라운딩/보더/배경으로 표시.
- Root + Header/Title/Description/Content/Footer를 조합하여 다양한 레이아웃 구축.

### 4.2 스타일 가이드
- Root: `rounded-lg border bg-card shadow-sm`
- Header: `flex flex-col gap-1 p-6`
- Content: 필요 시 `pt-0` 등 추가 클래스 전달 가능.

### 4.3 사용 예시
```svelte
<Card.Root>
  <Card.Header>
    <Card.Title class="text-lg">테스트 사용자 수</Card.Title>
    <Card.Description class="text-sm text-gray-500">임시 사용자 카운트</Card.Description>
  </Card.Header>
  <Card.Content class="pt-0">
    <p class="text-3xl font-bold">{userCount}</p>
  </Card.Content>
</Card.Root>
```
- `/admin/dashboard`, `/admin/users`, `/admin/test` 등 관리자 화면 대부분이 Card 조합으로 구성되어 있다.

## 5. Alert

### 5.1 목적
- 에러/경고/정보 메시지를 명확하게 표시하고, 아이콘과 텍스트 정렬을 자동으로 맞춘다.

### 5.2 Variant
| Variant | 설명 |
|---------|------|
| `default` | 회색 배경, 일반 정보 |
| `destructive` | 붉은 테두리/텍스트, 위험/오류 메시지 |

### 5.3 사용 예시
```svelte
<Alert variant="destructive">
  <Alert.Title>오류가 발생했습니다</Alert.Title>
  <Alert.Description>Firebase 저장 중 네트워크 오류가 발생했습니다.</Alert.Description>
</Alert>
```

## 6. Svelte 5 Runes / TypeScript / cn()
- 모든 컴포넌트는 `$props()`로 기본값을 추출하고, `cn()` 헬퍼로 Tailwind 클래스를 병합한다.
- Snippet 기반 `{@render children?.()}` 패턴을 사용해 슬롯을 제공한다.
- `HTMLButtonAttributes`, `HTMLAnchorAttributes`, `HTMLDivElement` 등을 확장하여 타입 완결성을 유지했다.

## 7. Light Mode 전용 정책
- `dark:` 프리픽스는 사용하지 않는다.
- Tailwind `darkMode` 설정은 비활성화했고, CSS에서도 Dark Mode 분기를 정의하지 않는다.
- 커서, hover, focus-visible 효과는 항상 Light Mode 대비를 기준으로 설계한다.

## 8. 참고 문서
- [sonub-ui-button.md](./sonub-ui-button.md)
- [sonub-ui-card.md](./sonub-ui-card.md)
- [sonub-ui-alert.md](./sonub-ui-alert.md)
- [shadcn-svelte 문서](https://www.shadcn-svelte.com/)
- [Tailwind CSS](https://tailwindcss.com/docs)
- [WCAG 2.1 Quick Reference](https://www.w3.org/WAI/WCAG21/quickref/)

## 9. 재사용 가능한 비즈니스 컴포넌트

### 9.1 UserProfile

#### 목적
- 사용자 UID를 받아서 프로필 사진(photoUrl)과 이름(displayName)을 표시하는 재사용 가능한 컴포넌트
- **RTDB 비용 최적화**: 전체 사용자 노드가 아닌 필요한 필드(`displayName`, `photoUrl`)만 읽어서 Firebase RTDB 비용 절감
- 글 목록, 댓글 목록 등 여러 곳에서 재사용 가능

#### Props 요약
| Prop | 타입 | 기본값 | 설명 |
|------|------|--------|------|
| `uid` | `string` | 필수 | 표시할 사용자 UID |
| `photoSize` | `string` | `'h-8 w-8'` | 프로필 사진 크기 (Tailwind 클래스) |
| `textSize` | `string` | `'text-sm'` | 이름 텍스트 크기 (Tailwind 클래스) |

#### 구현 핵심
```svelte
{#await getUserBasicInfo(uid)}
  <!-- 로딩 중: UID만 표시 -->
  <div class="user-profile">
    <div class="user-photo-placeholder {photoSize}">
      <span>{uid.charAt(0).toUpperCase()}</span>
    </div>
    <span class="user-name {textSize}">{uid}</span>
  </div>
{:then userInfo}
  <!-- 사용자 정보 표시 -->
  <div class="user-profile">
    {#if userInfo.photoUrl}
      <img src={userInfo.photoUrl} alt={userInfo.displayName || '사용자'} class="user-photo {photoSize}" />
    {:else}
      <div class="user-photo-placeholder {photoSize}">
        <span>{(userInfo.displayName || uid).charAt(0).toUpperCase()}</span>
      </div>
    {/if}
    <span class="user-name {textSize}">{userInfo.displayName || uid}</span>
  </div>
{:catch error}
  <!-- 에러 발생 시: UID만 표시 -->
{/await}
```

#### 사용 예시
```svelte
<!-- 글 목록에서 -->
<UserProfile uid={message.senderUid} />

<!-- 댓글 목록에서 (작은 크기) -->
<UserProfile uid={comment.authorUid} photoSize="h-6 w-6" textSize="text-xs" />
```

#### RTDB 비용 최적화
- ⚠️ **중요**: `/users/{uid}` 전체 노드를 읽지 않고, `/users/{uid}/displayName`과 `/users/{uid}/photoUrl` 필드만 읽습니다
- `getUserBasicInfo()` 함수는 `Promise.all`을 사용하여 두 필드를 병렬로 읽어 성능을 최적화합니다
- 전체 사용자 노드(11개 필드)를 읽는 대신 2개 필드만 읽어서 **약 82% 비용 절감** 효과

### 9.2 FileAttachments

#### 목적
- 첨부 파일 목록을 받아서 이미지/비디오/파일 미리보기를 표시하는 재사용 가능한 컴포넌트
- 이미지, 비디오, 기타 파일을 자동으로 구분하여 적절한 UI로 표시
- 글 목록, 댓글 목록 등 여러 곳에서 재사용 가능

#### Props 요약
| Prop | 타입 | 기본값 | 설명 |
|------|------|--------|------|
| `urls` | `Record<number, string>` | 필수 | 첨부 파일 URL 목록 |
| `maxDisplay` | `number` | `3` | 최대 표시 개수 |
| `thumbnailSize` | `string` | `'h-20 w-20'` | 썸네일 크기 (Tailwind 클래스) |

#### 구현 핵심
```svelte
{#if urlArray.length > 0}
  <div class="file-attachments">
    {#each displayUrls as url}
      {@const urlString = String(url)}
      {#if isImageUrl(urlString)}
        <img src={urlString} alt="첨부 이미지" class="file-thumbnail {thumbnailSize}" />
      {:else if isVideoUrl(urlString)}
        <video src={urlString} class="file-thumbnail {thumbnailSize}" muted preload="metadata">
          <track kind="captions" />
        </video>
      {:else}
        <!-- 기타 파일: 파일 아이콘 -->
        <div class="file-thumbnail-placeholder {thumbnailSize}">
          <svg>...</svg>
        </div>
      {/if}
    {/each}
    {#if remainingCount > 0}
      <div class="file-more {thumbnailSize}">+{remainingCount}</div>
    {/if}
  </div>
{/if}
```

#### 사용 예시
```svelte
<!-- 글 목록에서 -->
{#if message.urls}
  <FileAttachments urls={message.urls} />
{/if}

<!-- 댓글 목록에서 (작은 크기, 최대 2개) -->
{#if comment.urls}
  <FileAttachments urls={comment.urls} maxDisplay={2} thumbnailSize="h-16 w-16" />
{/if}
```

#### 파일 타입 감지
- `isImageUrl()`: URL 확장자로 이미지 여부 확인 (.jpg, .png, .gif, .webp 등)
- `isVideoUrl()`: URL 확장자로 비디오 여부 확인 (.mp4, .webm, .mov 등)
- 기타 파일은 파일 아이콘으로 표시

## 10. 향후 계획
- Input, Select, Checkbox 등 폼 컴포넌트 추가
- Tabs/Badge/Dialog 등 인터랙티브 컴포넌트 확장
- Storybook 시나리오 및 자동 테스트 도입

## 11. 결론
shadcn-svelte를 기반으로 하지만 Light Mode 규칙, 접근성, 커서 정책을 명확히 반영한 자체 UI 레이어를 유지함으로써:
- 디자인 변화 시 한 곳에서 제어 가능
- Dark Mode 미지원 정책을 코드 레벨로 enforcing
- 모든 페이지에서 동일한 경험을 제공한다.
