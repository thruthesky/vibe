---
name: sonub-firebase-database-list-view
version: 1.1.0
description: DatabaseListView 컴포넌트 무한 스크롤 가이드
last_updated: 2025-11-19
dependencies:
  - sonub-firebase-database-structure.md
  - repository/src/lib/components/DatabaseListView.svelte.md
---


## DatabaseListView 컴포넌트

- **무한 스크롤 리스트 구현 시 `DatabaseListView` 컴포넌트를 활용합니다**
  - Firebase Realtime Database의 데이터를 무한 스크롤로 표시하는 재사용 가능한 Svelte 5 컴포넌트입니다
  - 두 가지 스크롤 방식 지원:
    - **Body 스크롤**: DatabaseListView를 body에 직접 마운트하여 전체 페이지 스크롤 사용
    - **Container 스크롤**: 래퍼 컨테이너로 감싸고 높이를 지정하여 특정 영역만 스크롤
  - **마이그레이션**: 기존 Custom Elements 방식에서 Svelte 5 컴포넌트 방식으로 전환
  - **핵심 변경사항**: `orderPrefix` prop이 `orderPrefix`로 변경됨



# DatabaseListView 컴포넌트 코딩 가이드라인

`DatabaseListView`는 Firebase Realtime Database의 데이터를 무한 스크롤 방식으로 표시하는 재사용 가능한 Svelte 5 컴포넌트입니다.

## 0. Custom Elements에서 Svelte 5로 마이그레이션

이전 버전의 Sonub에서는 Custom Elements 방식의 DatabaseListView를 사용했습니다. 현재 버전에서는 Svelte 5 컴포넌트 방식으로 전환되었습니다.

### 주요 변경사항

#### 1. Prop 이름 변경

**이전 (Custom Elements)**:
```javascript
// orderPrefix prop 사용
<database-list-view orderPrefix="community-"></database-list-view>
```

**현재 (Svelte 5)**:
```svelte
<!-- orderPrefix prop 사용 -->
<DatabaseListView orderPrefix="community-" />
```

#### 2. 컴포넌트 구조 변경

| 항목 | Custom Elements | Svelte 5 |
|------|----------------|----------|
| 파일 확장자 | `.js` | `.svelte` |
| Props 정의 | `this.getAttribute()` | `$props()` |
| 상태 관리 | `this.state` | `$state()` |
| 라이프사이클 | `connectedCallback()`, `disconnectedCallback()` | `$effect()` cleanup |
| 반응성 | 수동 DOM 업데이트 | Svelte의 자동 반응형 시스템 |
| Slot/Snippet | `<slot>` 또는 템플릿 함수 | `{#snippet}` |

#### 3. 사용 예시 비교

**이전 (Custom Elements)**:
```html
<database-list-view
  path="posts"
  page-size="20"
  order-by="createdAt"
  sort-prefix="community-"
>
  <template data-slot="item">
    <div class="post-card">${data.title}</div>
  </template>
</database-list-view>
```

**현재 (Svelte 5)**:
```svelte
<script>
  import DatabaseListView from '$lib/components/DatabaseListView.svelte';
</script>

<DatabaseListView
  path="posts"
  pageSize={20}
  orderBy="createdAt"
  orderPrefix="community-"
>
  {#snippet item(itemData)}
    <div class="post-card">
      <h3>{itemData.data.title}</h3>
    </div>
  {/snippet}
</DatabaseListView>
```

#### 4. 마이그레이션 체크리스트

- [ ] `sortPrefix` prop을 `orderPrefix`로 변경
- [ ] 케밥 케이스 props (`page-size`)를 카멜 케이스 (`pageSize`)로 변경
- [ ] `<template>` 슬롯을 `{#snippet}`으로 변경
- [ ] 문자열 prop 값에 `{}`를 사용하여 JavaScript 표현식으로 전달 (예: `pageSize={20}`)
- [ ] Custom Elements 이벤트 리스너를 Svelte 이벤트 핸들러로 변경
- [ ] DOM API (`querySelector` 등) 사용을 Svelte 바인딩 (`bind:this`)으로 변경

## 1. 개요

- **목적**: Firebase RTDB 데이터를 페이지네이션과 무한 스크롤로 표시
- **특징**:
  - 자동 스크롤 감지 (컨테이너 스크롤 + window 스크롤)
  - 실시간 데이터 동기화 (`onValue` 기반)
  - 실시간 노드 삭제 감지 (`onChildRemoved` 기반)
  - Svelte 5 Runes 기반 반응형 상태 관리
  - 커스터마이징 가능한 snippet 지원

## 2. 기본 사용법

```svelte
<script>
  import DatabaseListView from '$lib/components/DatabaseListView.svelte';
</script>

<DatabaseListView
  path="users"
  pageSize={10}
  orderBy="createdAt"
  threshold={300}
  reverse={false}
>
  {#snippet item(itemData)}
    <div class="item-card">
      <h3>{itemData.data.displayName}</h3>
      <p>{itemData.data.email}</p>
    </div>
  {/snippet}
</DatabaseListView>
```

## 3. Props 설명

| Prop | 타입 | 기본값 | 설명 |
|------|------|--------|------|
| `path` | `string` | (필수) | Firebase RTDB 경로 (예: `"users"`, `"posts/community"`) |
| `pageSize` | `number` | `10` | 한 번에 가져올 아이템 개수 |
| `orderBy` | `string` | `"createdAt"` | 정렬 기준 필드 |
| `orderPrefix` | `string` | `""` | 정렬 필드의 prefix 값으로 필터링 (예: `"community-"`) - 선택 사항 |
| `threshold` | `number` | `300` | 스크롤 threshold (px) - 바닥에서 이 거리만큼 떨어지면 다음 페이지 로드 |
| `reverse` | `boolean` | `false` | 역순 정렬 여부 |

## 4. Snippets

DatabaseListView는 다양한 상태에 대한 커스터마이징 가능한 snippet을 제공합니다:

- `item(itemData, index)` - 각 아이템 렌더링
- `loading()` - 초기 로딩 상태
- `empty()` - 데이터 없음 상태
- `error(errorMessage)` - 에러 상태
- `loadingMore()` - 더 로드 중 상태
- `noMore()` - 더 이상 데이터 없음 상태

## 4.5. 클라이언트 측 정렬 로직

DatabaseListView는 Firebase에서 받은 데이터를 **클라이언트 측에서 명시적으로 정렬**합니다. 이는 Firebase 쿼리 순서와 관계없이 정확한 정렬을 보장합니다.

### 📌 정렬 방식

#### 1. 문자열 vs 숫자 비교

`orderBy` 필드의 타입에 따라 다른 비교 방식을 사용합니다:

- **문자열**: `localeCompare()` 메서드 사용 (사전순 정렬)
- **숫자**: 숫자 빼기 연산 사용 (수치 정렬)

```typescript
// 문자열 비교 (예: "story--1763562652353")
aValue.localeCompare(bValue); // 오름차순
bValue.localeCompare(aValue); // 내림차순

// 숫자 비교 (예: 1699999999999)
Number(aValue) - Number(bValue); // 오름차순
Number(bValue) - Number(aValue); // 내림차순
```

#### 2. null/undefined 처리

정렬 시 null 또는 undefined 값은 항상 맨 뒤로 배치됩니다:

```typescript
if (aValue == null && bValue == null) return 0;  // 둘 다 null이면 동일
if (aValue == null) return 1;  // a가 null이면 뒤로
if (bValue == null) return -1; // b가 null이면 뒤로
```

#### 3. reverse 파라미터 동작

`reverse` prop에 따라 정렬 방향이 결정됩니다:

| reverse | scrollTrigger | 정렬 방향 | 설명 |
|---------|---------------|----------|------|
| `true` | `'bottom'` (기본) | **내림차순** | 최신 항목이 먼저 (큰 값 → 작은 값) |
| `false` | `'bottom'` (기본) | **오름차순** | 오래된 항목이 먼저 (작은 값 → 큰 값) |
| `true` | `'top'` (채팅) | **오름차순** | 채팅방 스타일: 오래된 메시지가 위에 |

**예시: categoryOrder 필드 정렬**

```svelte
<!-- 게시글 목록: 최신 글이 먼저 -->
<DatabaseListView
  path="posts"
  orderBy="categoryOrder"
  orderPrefix="story-"
  reverse={true}
/>
```

**정렬 결과 (내림차순)**:
```
story--1763562652353 (최신)
story--1763562648655
story--1763562646262
story--1763562642736
story--1763562639525 (오래된 글)
```

### 🔧 버그 수정 내역 (v1.1.0)

**문제**: 문자열 타입의 `orderBy` 필드 (예: `categoryOrder: "story--1763562652353"`)를 숫자 빼기 연산으로 비교하여 `NaN` 발생

**해결**:
1. 타입 검사 추가 (`typeof aValue === 'string'`)
2. 문자열일 경우 `localeCompare()` 사용
3. null/undefined 명시적 처리

**영향받은 컴포넌트**:
- `DatabaseListView.svelte` (초기 로드 및 loadMore 함수)
- `PostListView.svelte` (게시글 목록 표시)

## 5. orderPrefix와 startAt(false) 필터링

DatabaseListView는 Firebase 쿼리에서 **자동으로 null/undefined 값을 필터링**합니다.

### 📌 기본 동작 (orderPrefix가 없는 경우)

`orderPrefix`를 제공하지 않으면 `startAt(false)`가 자동으로 추가되어 **orderBy 필드가 null 또는 undefined인 항목을 제외**합니다.

```svelte
<DatabaseListView
  path="users"
  orderBy="createdAt"
  pageSize={10}
/>
```

**Firebase 쿼리 결과**:
- ✅ `createdAt` 필드가 있는 항목만 조회됨
- ❌ `createdAt` 필드가 `null` 또는 `undefined`인 항목은 제외됨
- ✅ 숫자 타입인 경우 **가장 작은 값부터 정렬**됨

**내부 쿼리**:
```javascript
query(
  baseRef,
  orderByChild('createdAt'),
  startAt(false),  // ← null/undefined 필터링
  limitToFirst(10)
)
```

### 📌 orderPrefix를 사용하는 경우

`orderPrefix`를 제공하면 해당 prefix로 시작하는 값만 필터링합니다:

```svelte
<DatabaseListView
  path="posts"
  orderBy="categoryKey"
  orderPrefix="community-"
  pageSize={20}
/>
```

**Firebase 쿼리 결과**:
- ✅ `categoryKey`가 `"community-"`로 시작하는 항목만 조회됨
- ❌ `categoryKey`가 `"qna-"`, `"news-"` 등인 항목은 제외됨
- ❌ `categoryKey`가 `null` 또는 `undefined`인 항목도 제외됨

**내부 쿼리**:
```javascript
query(
  baseRef,
  orderByChild('categoryKey'),
  startAt('community-'),
  endAt('community-\uf8ff'),  // ← prefix 범위 필터링
  limitToFirst(20)
)
```

### 📌 startAt(false)가 필요한 이유

Firebase Realtime Database의 `orderByChild()` 쿼리는 기본적으로 **null 값을 포함**합니다. 이로 인해:

1. **페이지네이션 오류 발생**
   - `orderBy` 필드가 없는 항목이 커서 값으로 사용됨
   - 다음 페이지 로드 시 타입 불일치 에러 발생

2. **불완전한 데이터 표시**
   - 정렬 필드가 없는 항목이 리스트에 포함됨
   - UI에서 의미 없는 데이터가 표시됨

3. **성능 저하**
   - 불필요한 데이터를 네트워크로 전송
   - 클라이언트에서 추가 필터링 필요

**`startAt(false)` 사용 시**:
- ✅ Firebase 쿼리 단계에서 null/undefined 항목 제외
- ✅ 네트워크 비용 절감 (불필요한 데이터 전송 방지)
- ✅ 정확한 페이지네이션 동작 보장
- ✅ 타입 안전성 확보 (커서 값이 항상 유효함)

### 📌 중요한 제약사항: startAt()과 커서의 충돌

⚠️ **Firebase 쿼리에서는 `startAt()`, `startAfter()`, `endBefore()`, `equalTo()` 중 하나만 사용할 수 있습니다.**

DatabaseListView는 이 제약을 자동으로 처리합니다:

1. **초기 로드 (`loadInitialData`)**:
   - `startAt(false)` 사용 ✅
   - null/undefined 값을 필터링합니다

2. **페이지네이션 (`loadMore`)**:
   - `startAfter(lastLoadedValue)` 또는 `endBefore(lastLoadedValue)` 사용 ✅
   - ❌ `startAt(false)`는 **사용하지 않음** (충돌 방지)
   - 초기 로드에서 이미 null/undefined 값을 제외했으므로, 커서 이후/이전의 값들도 유효함

**잘못된 쿼리 예시 (에러 발생)**:
```javascript
// ❌ 이렇게 하면 에러 발생!
query(
  baseRef,
  orderByChild('createdAt'),
  startAt(false),        // ← 시작점 설정
  startAfter(1234567890) // ← 또 다른 시작점 설정! (충돌)
)
// Error: startAfter: Starting point was already set
// (by another call to startAt, startAfter, or equalTo).
```

**올바른 쿼리 예시**:
```javascript
// ✅ 초기 로드: startAt(false)만 사용
query(
  baseRef,
  orderByChild('createdAt'),
  startAt(false),
  limitToFirst(10)
)

// ✅ 페이지네이션: startAfter()만 사용
query(
  baseRef,
  orderByChild('createdAt'),
  startAfter(1234567890),
  limitToFirst(10)
)
```

### 📌 사용 예시

#### 예시 1: 사용자 목록 (createdAt 기준 정렬)

```svelte
<DatabaseListView
  path="users"
  orderBy="createdAt"
  pageSize={15}
>
  {#snippet item(itemData)}
    <div class="user-card">
      <h3>{itemData.data.displayName}</h3>
      <p>가입일: {new Date(itemData.data.createdAt).toLocaleDateString()}</p>
    </div>
  {/snippet}
</DatabaseListView>
```

**결과**:
- ✅ `createdAt` 필드가 있는 사용자만 표시
- ✅ 가장 오래된 사용자부터 정렬 (작은 timestamp → 큰 timestamp)
- ❌ `createdAt`가 없는 사용자는 리스트에서 제외

#### 예시 2: 게시글 목록 (카테고리별 필터링)

```svelte
<DatabaseListView
  path="posts"
  orderBy="categoryKey"
  orderPrefix="community-"
  reverse={true}
  pageSize={20}
>
  {#snippet item(itemData)}
    <div class="post-card">
      <h3>{itemData.data.title}</h3>
      <p>{itemData.data.content}</p>
    </div>
  {/snippet}
</DatabaseListView>
```

**결과**:
- ✅ `categoryKey`가 `"community-"`로 시작하는 게시글만 표시
- ✅ 카테고리 prefix가 다른 게시글은 제외
- ✅ `reverse={true}`로 최신 글부터 표시

### 📌 주의사항

#### ⚠️ orderBy 필드는 반드시 존재해야 함

DatabaseListView를 사용하려면 **모든 아이템이 orderBy 필드를 가지고 있어야** 합니다:

```javascript
// ❌ 잘못된 데이터 구조 - createdAt 필드 누락
{
  "users": {
    "user1": {
      "displayName": "홍길동",
      // createdAt 없음!
    }
  }
}

// ✅ 올바른 데이터 구조 - createdAt 필드 포함
{
  "users": {
    "user1": {
      "displayName": "홍길동",
      "createdAt": 1234567890123
    }
  }
}
```

#### ⚠️ 자동 필드 생성 권장

사용자 생성 시 `createdAt`, `updatedAt` 같은 필드를 자동으로 생성하는 것이 좋습니다:

- **클라이언트 측**: `firebase-login-user.svelte.js`에서 자동 생성
- **서버 측**: Firebase Cloud Functions의 `onUserRegister`에서 자동 생성

참고: [firebase-login-user.svelte.js](./repository/src/lib/utils/firebase-login-user.svelte.js) (lines 168-188)

## 6. 스크롤 방식 선택

DatabaseListView는 두 가지 스크롤 방식을 지원합니다:

### 방식 1: Body 스크롤 (전체 페이지 무한 스크롤)

**사용 시기**:
- 전체 페이지를 스크롤하며 무한 스크롤을 구현하고 싶을 때
- 페이지 전체가 리스트로 구성될 때
- 자연스러운 네이티브 스크롤 경험을 제공하고 싶을 때

**구현 방법**:

```svelte
<script>
  import DatabaseListView from '$lib/components/DatabaseListView.svelte';
</script>

<!-- 래퍼 없이 직접 마운트 -->
<DatabaseListView
  path="users"
  pageSize={15}
  orderBy="createdAt"
>
  {#snippet item(itemData)}
    <div class="user-card">
      <!-- 아이템 내용 -->
    </div>
  {/snippet}
</DatabaseListView>

<style>
  /* 아이템 스타일만 정의 */
  .user-card {
    padding: 1rem;
    border-bottom: 1px solid #e5e7eb;
  }
</style>
```

**장점**:
- ✅ 자연스러운 스크롤 경험
- ✅ 높이 제한 없음
- ✅ 코드가 간단함

**단점**:
- ❌ 페이지 레이아웃 제어가 어려움
- ❌ 다른 컨텐츠와 함께 배치하기 어려움

### 방식 2: 컨테이너 스크롤 (제한된 영역에서 무한 스크롤)

**사용 시기**:
- 특정 영역에만 리스트를 표시하고 싶을 때
- 페이지 내 다른 컨텐츠와 함께 배치할 때
- 고정된 높이의 리스트 영역이 필요할 때

**구현 방법**:

```svelte
<script>
  import DatabaseListView from '$lib/components/DatabaseListView.svelte';
</script>

<!-- 래퍼 컨테이너로 감싸기 -->
<div class="user-list-container">
  <DatabaseListView
    path="users"
    pageSize={10}
    orderBy="createdAt"
  >
    {#snippet item(itemData)}
      <div class="user-card">
        <!-- 아이템 내용 -->
      </div>
    {/snippet}
  </DatabaseListView>
</div>

<style>
  /* 래퍼 컨테이너에 높이와 스크롤 설정 */
  .user-list-container {
    /* 고정 높이 설정 */
    height: 600px;

    /* 또는 뷰포트 기준 높이 (topbar 높이 4rem 제외) */
    /* height: calc(100vh - 4rem); */

    /* 스크롤 활성화 */
    overflow-y: auto;
    overflow-x: hidden;

    /* 스타일링 (선택사항) */
    border: 1px solid #e5e7eb;
    border-radius: 0.5rem;
    background-color: #ffffff;
  }

  /* 아이템 스타일 */
  .user-card {
    padding: 1rem;
    border-bottom: 1px solid #e5e7eb;
  }
</style>
```

**장점**:
- ✅ 페이지 레이아웃 제어 가능
- ✅ 다른 컨텐츠와 함께 배치 가능
- ✅ 고정된 영역에 리스트 표시

**단점**:
- ❌ 컨테이너 높이를 명시적으로 설정해야 함
- ❌ 스크롤이 두 개 생길 수 있음 (페이지 스크롤 + 컨테이너 스크롤)

## 7. 컨테이너 높이 설정 방법

### 고정 높이

```css
.list-container {
  height: 500px;  /* 픽셀 단위 */
  overflow-y: auto;
}
```

### 뷰포트 기준 높이

```css
.list-container {
  /* 전체 뷰포트 높이 */
  height: 100vh;

  /* topbar(4rem) 제외 */
  height: calc(100vh - 4rem);

  /* topbar(4rem) + 여백 제외 */
  height: calc(100vh - 6rem);

  overflow-y: auto;
}
```

### Flexbox를 사용한 자동 높이

```css
.page-container {
  display: flex;
  flex-direction: column;
  height: 100vh;
}

.header {
  flex-shrink: 0;  /* 헤더는 고정 */
}

.list-container {
  flex: 1;  /* 남은 공간을 모두 차지 */
  overflow-y: auto;
}
```

## 8. 실전 예제

### 예제 1: Body 스크롤 (사용자 목록 페이지)

```svelte
<script>
  import DatabaseListView from '../lib/components/DatabaseListView.svelte';
  import { login } from '../lib/utils/firebase-login-user.svelte.js';

  function goToProfile(uid) {
    window.history.pushState({}, '', `/user/profile/${uid}`);
    window.dispatchEvent(new PopStateEvent('popstate'));
  }
</script>

<!-- 래퍼 없이 직접 마운트 -->
<DatabaseListView
  path="users"
  pageSize={15}
  orderBy="createdAt"
  threshold={300}
>
  {#snippet item(itemData)}
    <div
      class="user-card"
      onclick={() => goToProfile(itemData.key)}
    >
      <img src={itemData.data?.photoUrl} alt="프로필" />
      <div>
        <h3>{itemData.data?.displayName}</h3>
        <p>{itemData.data?.email}</p>
      </div>
    </div>
  {/snippet}

  {#snippet loading()}
    <div class="loading">로딩 중...</div>
  {/snippet}

  {#snippet empty()}
    <div class="empty">사용자가 없습니다.</div>
  {/snippet}
</DatabaseListView>

<style>
  .user-card {
    display: flex;
    gap: 1rem;
    padding: 1rem;
    border-bottom: 1px solid #e5e7eb;
    cursor: pointer;
  }

  .user-card:hover {
    background-color: #f9fafb;
  }
</style>
```

### 예제 2: 컨테이너 스크롤 (채팅 목록)

```svelte
<script>
  import DatabaseListView from '../lib/components/DatabaseListView.svelte';
</script>

<div class="page-layout">
  <!-- 헤더 -->
  <div class="header">
    <h1>채팅 목록</h1>
    <button>새 채팅</button>
  </div>

  <!-- 채팅 리스트 (스크롤 영역) -->
  <div class="chat-list-container">
    <DatabaseListView
      path="chats"
      pageSize={20}
      orderBy="lastMessageAt"
      reverse={true}
    >
      {#snippet item(itemData)}
        <div class="chat-item">
          <img src={itemData.data?.avatar} alt="프로필" />
          <div>
            <h3>{itemData.data?.title}</h3>
            <p>{itemData.data?.lastMessage}</p>
          </div>
        </div>
      {/snippet}
    </DatabaseListView>
  </div>
</div>

<style>
  .page-layout {
    display: flex;
    flex-direction: column;
    height: calc(100vh - 4rem);  /* topbar 제외 */
  }

  .header {
    flex-shrink: 0;
    padding: 1rem;
    border-bottom: 1px solid #e5e7eb;
  }

  .chat-list-container {
    flex: 1;
    overflow-y: auto;
    overflow-x: hidden;
  }

  .chat-item {
    display: flex;
    gap: 1rem;
    padding: 1rem;
    border-bottom: 1px solid #e5e7eb;
  }
</style>
```

## 9. 주의사항

### ⚠️ 컨테이너 높이 설정 필수

컨테이너 스크롤 방식을 사용할 때는 **반드시** 래퍼 컨테이너에 명시적인 높이를 설정해야 합니다:

```css
/* ❌ 잘못된 예 - 높이 없음 */
.list-container {
  overflow-y: auto;  /* 높이가 없으면 스크롤 안 됨! */
}

/* ✅ 올바른 예 */
.list-container {
  height: 600px;  /* 또는 calc(100vh - 4rem) */
  overflow-y: auto;
}
```

### ⚠️ box-sizing 고려

패딩이나 보더를 포함한 높이 계산이 필요하면 `box-sizing`을 설정하세요:

```css
.list-container {
  height: calc(100vh - 4rem);
  padding: 1rem;
  box-sizing: border-box;  /* 패딩을 높이에 포함 */
  overflow-y: auto;
}
```

### ⚠️ 스크롤 감지 방식

DatabaseListView는 두 가지 스크롤을 **모두** 감지합니다:
- **컨테이너 스크롤**: 래퍼 div의 내부 스크롤
- **Window 스크롤**: body의 네이티브 스크롤

따라서 두 방식 중 어떤 것을 사용해도 무한 스크롤이 정상 작동합니다.

## 10. 선택 가이드

| 요구사항 | 추천 방식 |
|---------|----------|
| 전체 페이지가 리스트인 경우 | Body 스크롤 |
| 다른 컨텐츠와 함께 배치 | 컨테이너 스크롤 |
| 고정 헤더/푸터 필요 | 컨테이너 스크롤 |
| 심플한 구현 원함 | Body 스크롤 |
| 복잡한 레이아웃 | 컨테이너 스크롤 |
| 모바일 네이티브 느낌 | Body 스크롤 |

## 11. 실시간 노드 삭제 감지

DatabaseListView는 Firebase Realtime Database에서 **노드가 삭제될 때 자동으로 화면에서 제거**하는 기능을 제공합니다.

### 11.1. 개요

- **이벤트**: `onChildRemoved` 리스너 사용
- **자동 처리**: 삭제된 노드가 감지되면 items 배열에서 자동 제거
- **메모리 관리**: 삭제된 노드의 `onValue` 리스너도 자동 해제
- **실시간 동기화**: 다른 사용자가 노드를 삭제해도 즉시 반영

### 11.2. 작동 방식

1. **리스너 설정**:
   - 초기 데이터 로드 완료 후 `onChildRemoved` 리스너 자동 등록
   - 초기 `onChildAdded` 리스너와 동일한 쿼리 범위 사용
   - orderPrefix가 있으면 해당 범위에서만 삭제 감지

2. **삭제 감지**:
   - Firebase에서 노드가 삭제되면 `onChildRemoved` 이벤트 발생
   - 삭제된 노드의 key를 기준으로 items 배열에서 해당 아이템 찾기
   - 해당 아이템을 배열에서 필터링하여 제거

3. **메모리 정리**:
   - 삭제된 노드의 `onValue` 리스너 해제 (메모리 누수 방지)
   - 리스너 맵(unsubscribers)에서 해당 항목 제거

4. **UI 업데이트**:
   - items 배열이 Svelte 5 `$state`로 관리되므로 자동 반응형 업데이트
   - 화면에서 삭제된 아이템이 즉시 사라짐

### 11.3. 사용 예시

#### 예시 1: 게시글 삭제 시 자동 제거

```svelte
<script>
  import DatabaseListView from '$lib/components/DatabaseListView.svelte';
  import { deletePost } from '$lib/services/forum.js';

  async function handleDelete(postId) {
    // 게시글 삭제 API 호출
    const result = await deletePost(postId);

    if (result.success) {
      // ✅ DatabaseListView가 자동으로 삭제를 감지하여 화면에서 제거
      // 따로 items 배열을 수동으로 업데이트할 필요 없음!
      console.log('게시글이 삭제되었습니다. 자동으로 화면에서 제거됩니다.');
    }
  }
</script>

<DatabaseListView
  path="posts"
  orderBy="order"
  orderPrefix="community-"
  pageSize={20}
>
  {#snippet item(itemData)}
    <div class="post-card">
      <h3>{itemData.data.title}</h3>
      <p>{itemData.data.content}</p>
      <button onclick={() => handleDelete(itemData.key)}>
        삭제
      </button>
    </div>
  {/snippet}
</DatabaseListView>
```

**결과**:
- ✅ 사용자가 "삭제" 버튼 클릭 → Firebase에서 노드 삭제
- ✅ `onChildRemoved` 리스너가 삭제 감지
- ✅ items 배열에서 해당 게시글 자동 제거
- ✅ 화면에서 즉시 사라짐 (새로고침 불필요)

#### 예시 2: 다른 사용자의 삭제도 실시간 반영

```svelte
<script>
  import DatabaseListView from '$lib/components/DatabaseListView.svelte';
</script>

<!-- 채팅 메시지 목록 -->
<DatabaseListView
  path="chat-messages"
  orderBy="createdAt"
  pageSize={50}
>
  {#snippet item(itemData)}
    <div class="message">
      <p>{itemData.data.text}</p>
      <span>{itemData.data.author}</span>
    </div>
  {/snippet}
</DatabaseListView>
```

**결과**:
- ✅ 사용자 A가 메시지 삭제 → 사용자 B의 화면에서도 즉시 사라짐
- ✅ 실시간 협업 환경에서 자동 동기화
- ✅ 수동으로 폴링하거나 새로고침할 필요 없음

### 11.4. 내부 구현 상세

DatabaseListView는 다음과 같이 삭제를 처리합니다:

```typescript
// 1. onChildRemoved 리스너 등록 (초기 로드 완료 후)
function setupChildRemovedListener() {
  const baseRef = dbRef(database, path);

  // orderPrefix가 있으면 범위 쿼리 사용
  let dataQuery;
  if (orderPrefix) {
    dataQuery = query(
      baseRef,
      orderByChild(orderBy),
      startAt(orderPrefix),
      endAt(orderPrefix + '\uf8ff')
    );
  } else {
    // orderPrefix가 없으면 startAt(false) 사용
    dataQuery = query(
      baseRef,
      orderByChild(orderBy),
      startAt(false)
    );
  }

  // 2. 삭제 이벤트 감지
  childRemovedUnsubscribe = onChildRemoved(dataQuery, (snapshot) => {
    const removedKey = snapshot.key;

    // 3. items 배열에서 제거
    items = items.filter(item => item.key !== removedKey);

    // 4. 해당 아이템의 onValue 리스너 해제 (메모리 관리)
    const unsubscribe = unsubscribers.get(removedKey);
    if (unsubscribe) {
      unsubscribe();
      unsubscribers.delete(removedKey);
    }
  });
}

// 5. 컴포넌트 언마운트 시 리스너 정리
$effect(() => {
  return () => {
    if (childRemovedUnsubscribe) {
      childRemovedUnsubscribe();
      childRemovedUnsubscribe = null;
    }
  };
});
```

### 11.5. 메모리 관리의 중요성

**왜 onValue 리스너도 해제해야 하나요?**

1. **메모리 누수 방지**:
   - 삭제된 노드의 `onValue` 리스너가 계속 실행되면 메모리 낭비
   - 장시간 사용 시 메모리 사용량이 계속 증가

2. **네트워크 비용 절감**:
   - Firebase는 각 리스너마다 실시간 연결 유지
   - 불필요한 리스너는 즉시 해제하여 비용 절감

3. **성능 최적화**:
   - 리스너가 많을수록 이벤트 처리 오버헤드 증가
   - 사용하지 않는 리스너는 제거하여 성능 향상

**DatabaseListView는 자동으로 처리합니다:**
- ✅ 삭제된 노드의 리스너 자동 해제
- ✅ unsubscribers 맵에서 자동 제거
- ✅ 메모리 누수 걱정 없음

### 11.6. 주의사항

#### ⚠️ onChildRemoved는 쿼리 범위 내에서만 작동

orderPrefix를 사용하는 경우, **해당 범위 내에서 삭제된 노드만 감지**합니다:

```svelte
<!-- community 카테고리의 게시글만 표시 -->
<DatabaseListView
  path="posts"
  orderBy="order"
  orderPrefix="community-"
  pageSize={20}
/>
```

**결과**:
- ✅ `order`가 `"community-"`로 시작하는 게시글 삭제 → 감지됨
- ❌ `order`가 `"qna-"`로 시작하는 게시글 삭제 → 감지 안 됨 (범위 밖)

#### ⚠️ 초기 로드 완료 후에만 작동

`onChildRemoved` 리스너는 **초기 데이터 로드가 완료된 후에만 등록**됩니다:

1. **초기 로드 단계**: `onChildAdded` 리스너로 초기 데이터 수집
2. **로드 완료 후**: `setupChildRemovedListener()` 호출
3. **실시간 감지**: 이후 삭제된 노드 자동 감지

**이유**: 초기 로드 중에는 아직 화면에 없는 데이터이므로 삭제 감지가 불필요

### 11.7. 장점

- ✅ **자동 동기화**: 수동으로 배열을 관리할 필요 없음
- ✅ **실시간 반영**: 다른 사용자의 삭제도 즉시 반영
- ✅ **메모리 안전**: 자동 리스너 해제로 메모리 누수 방지
- ✅ **코드 간결화**: 삭제 후 UI 업데이트 로직 불필요
- ✅ **일관성 보장**: Firebase 데이터와 화면이 항상 동기화

### 11.8. 실제 사용 사례

- **게시판**: 게시글 삭제 시 목록에서 자동 제거
- **채팅**: 메시지 삭제 시 채팅창에서 자동 제거
- **댓글**: 댓글 삭제 시 댓글 목록에서 자동 제거
- **사용자 목록**: 사용자 탈퇴 시 목록에서 자동 제거
- **알림**: 알림 삭제 시 알림 목록에서 자동 제거

---

### 11.9. orderBy 필드 변경 감지 및 자동 재정렬

#### 11.9.1. 개요

`DatabaseListView`는 **orderBy 필드 값이 실시간으로 변경되면 자동으로 아이템을 재정렬**합니다. 이를 통해 Firebase RTDB에서 정렬 기준 필드가 업데이트되어도 항상 올바른 순서로 목록이 표시됩니다.

**주요 기능**:
- 각 아이템의 orderBy 필드 값을 실시간 추적
- 값 변경 감지 시 Firebase 정렬 규칙에 따라 자동 재배치
- reverse, scrollTrigger 옵션 자동 적용
- 효율적인 메모리 관리 (변경된 아이템만 처리)

#### 11.9.2. 작동 방식

**1. 초기화 단계**:
```typescript
// previousOrderByValues Map에 각 아이템의 초기 orderBy 값 저장
let previousOrderByValues = new Map<string, any>();

// setupItemListener() 호출 시 현재 orderBy 값 저장
previousOrderByValues.set(itemKey, currentOrderByValue);
```

**2. 변경 감지**:
```typescript
// onValue 콜백에서 orderBy 필드 변경 감지
const newOrderByValue = updatedData[orderBy];
const previousOrderByValue = previousOrderByValues.get(itemKey);

if (previousOrderByValue !== undefined && previousOrderByValue !== newOrderByValue) {
  // orderBy 값이 변경됨!
  repositionItem(itemKey, updatedData, newOrderByValue);
}
```

**3. 자동 재배치**:
```typescript
// repositionItem() 함수가 다음을 수행:
// 1. items 배열에서 해당 아이템 제거
// 2. Firebase 정렬 규칙에 따라 올바른 위치 계산
// 3. 해당 위치에 아이템 삽입
// 4. 모든 리스너 재설정
```

#### 11.9.3. Firebase 정렬 규칙

DatabaseListView는 Firebase Realtime Database의 정렬 순서를 정확히 따릅니다:

**정렬 우선순위**:
1. `null` / `undefined`
2. `false`
3. `true`
4. 숫자 (오름차순)
5. 문자열 (사전순, 대소문자 구분)

**비교 함수**:
```typescript
function compareOrderByValues(a: any, b: any, reverseOrder: boolean): number {
  // Firebase 정렬 규칙을 엄격히 따름
  // null/undefined < boolean < number < string
  // reverseOrder가 true면 부호 반전
}
```

#### 11.9.4. 사용 예시

##### 예시 1: 게시글 순서 변경 (order 필드)

**초기 상태**:
```javascript
// Firebase RTDB
{
  "posts": {
    "-ABC": { "title": "Post A", "order": 20 },
    "-DEF": { "title": "Post B", "order": 30 },
    "-GHI": { "title": "Post C", "order": 40 }
  }
}
```

**화면 표시** (order 오름차순):
```
Post A (order: 20)
Post B (order: 30)
Post C (order: 40)
```

**Post B의 order를 10으로 변경**:
```javascript
// Firebase에서 order 값 업데이트
await update(ref(rtdb, 'posts/-DEF'), { order: 10 });
```

**자동 재정렬 결과**:
```
Post B (order: 10)  ← 자동으로 맨 앞으로 이동
Post A (order: 20)
Post C (order: 40)
```

##### 예시 2: 우선순위 변경 (priority 필드)

```svelte
<DatabaseListView
  path="tasks"
  orderBy="priority"
  reverse={true}
>
  {#snippet item(itemData)}
    <div class="task-card">
      <h3>{itemData.data.title}</h3>
      <p>우선순위: {itemData.data.priority}</p>
      <button onclick={() => updatePriority(itemData.key, 100)}>
        우선순위 높이기
      </button>
    </div>
  {/snippet}
</DatabaseListView>

<script>
  async function updatePriority(taskKey: string, newPriority: number) {
    // Firebase에서 priority 값 업데이트
    await update(ref(rtdb, `tasks/${taskKey}`), {
      priority: newPriority
    });

    // DatabaseListView가 자동으로 재정렬!
    // 별도의 리로드 불필요
  }
</script>
```

#### 11.9.5. 내부 구현 상세

**previousOrderByValues 초기화 시점**:
```typescript
// 1. loadInitialData() 호출 시 clear
previousOrderByValues.clear();

// 2. 컴포넌트 언마운트 시 clear
$effect(() => {
  return () => {
    previousOrderByValues.clear();
  };
});
```

**리스너 재설정 최적화**:
```typescript
// repositionItem()에서 모든 리스너를 재설정하지만
// 이는 인덱스 변경에 따른 필수 작업
// setupItemListener()는 key 기반으로 items를 찾아서
// 재배치 후에도 정확한 아이템을 업데이트
```

**효율성**:
- 변경된 아이템만 재배치 (전체 리로드 불필요)
- 네트워크 요청 없음 (클라이언트 측 정렬)
- Firebase 정렬 규칙과 100% 일치

#### 11.9.6. 주의사항

##### ⚠️ reverse와 scrollTrigger 옵션 자동 적용

```typescript
// repositionItem()은 reverse와 scrollTrigger를 자동으로 고려
const reverseOrder = reverse && scrollTrigger !== 'top';

// 채팅 스타일(scrollTrigger='top')에서는 reverse 무시
// 왜냐하면 채팅은 항상 오래된 메시지가 위에 있어야 하므로
```

##### ⚠️ 대량 업데이트 시 성능

```javascript
// ❌ 나쁜 예: 여러 아이템을 동시에 업데이트
for (const item of items) {
  await update(ref(rtdb, `posts/${item.key}`), { order: newOrder++ });
  // 각 업데이트마다 onValue 발생 → 여러 번 재정렬
}

// ✅ 좋은 예: 배치 업데이트 사용
const updates = {};
items.forEach((item, index) => {
  updates[`posts/${item.key}/order`] = index * 10;
});
await update(ref(rtdb), updates);
// 한 번에 업데이트 → 각 아이템의 onValue는 개별 발생하지만
// 짧은 시간 내에 모두 처리됨
```

##### ⚠️ orderBy 필드 타입 일관성

```javascript
// ❌ 타입 혼합 (숫자 → 문자열)
await update(ref(rtdb, 'posts/-ABC'), { order: "30" }); // 문자열
await update(ref(rtdb, 'posts/-DEF'), { order: 20 });   // 숫자

// Firebase 정렬: 숫자(20) < 문자열("30")
// 예상치 못한 순서가 될 수 있음

// ✅ 타입 일관성 유지
await update(ref(rtdb, 'posts/-ABC'), { order: 30 }); // 숫자
await update(ref(rtdb, 'posts/-DEF'), { order: 20 }); // 숫자
```

#### 11.9.7. 장점

✅ **자동 동기화**: orderBy 필드 변경 시 수동 리로드 불필요

✅ **사용자 경험**: 부드러운 재정렬 애니메이션 (CSS transition 활용 가능)

✅ **일관성**: Firebase 정렬 규칙과 100% 일치

✅ **효율성**: 변경된 아이템만 처리, 네트워크 요청 없음

✅ **범용성**: reverse, scrollTrigger 등 모든 옵션과 호환

#### 11.9.8. 실제 사용 사례

- **게시판**: 관리자가 공지사항 순서 변경 (order 필드 수정)
- **할일 목록**: 사용자가 작업 우선순위 변경 (priority 필드 수정)
- **카테고리 정렬**: 카테고리 순서 재배치 (displayOrder 필드 수정)
- **핀 고정**: 특정 아이템을 맨 위로 고정 (pinnedAt 필드 추가/삭제)
- **인기순 정렬**: 좋아요/조회수 증가 시 자동 순서 변경 (likeCount 필드 자동 업데이트)

#### 11.9.9. 구현 세부사항

**소스 코드 위치:** [src/lib/components/DatabaseListView.svelte.md](./repository/src/lib/components/DatabaseListView.svelte.md)

**주요 함수**:
- `compareOrderByValues()`: Firebase 정렬 규칙 구현
- `repositionItem()`: 아이템 재배치 로직
- `setupItemListener()`: orderBy 필드 변경 감지

**추가된 상태**:
```typescript
let previousOrderByValues = new Map<string, any>();
```

**수정된 함수**:
```typescript
// setupItemListener() - orderBy 필드 변경 감지 로직 추가
// loadInitialData() - previousOrderByValues.clear() 추가
// $effect cleanup - previousOrderByValues.clear() 추가
```

---

## 12. 요약

- ✅ **자동 null/undefined 필터링**: orderPrefix가 없으면 startAt(false) 자동 적용
- ✅ **orderPrefix 지원**: prefix 기반 범위 쿼리 지원
- ✅ **두 가지 스크롤 방식**: Body 스크롤 (전체 페이지) vs 컨테이너 스크롤 (제한된 영역)
- ✅ **자동 감지**: 두 방식 모두 자동으로 감지하여 무한 스크롤 작동
- ✅ **실시간 노드 삭제**: onChildRemoved로 삭제된 노드 자동 제거 및 리스너 정리
- ✅ **orderBy 필드 자동 재정렬**: orderBy 필드 값 변경 시 Firebase 정렬 규칙에 따라 자동 재배치 (v4.0.0+)
- ✅ **높이 설정 필수**: 컨테이너 스크롤 사용 시 명시적인 높이 설정 필요
- ✅ **Flexbox 활용**: flex를 사용하면 동적 높이 계산 가능
- ✅ **용도별 선택**: 페이지 구조와 요구사항에 맞는 방식 선택

---

## 13. 핵심 구현 원리

### 13.1. Firebase 정렬 순서 보존의 중요성

#### 문제: Object.entries()는 정렬 순서를 보장하지 않음

Firebase Realtime Database는 쿼리 결과를 **정렬된 순서로 반환**하지만, JavaScript에서 이를 잘못 처리하면 순서가 깨집니다.

**❌ 잘못된 방식 (순서가 깨짐)**:
```typescript
const snapshot = await get(dataQuery);
if (snapshot.exists()) {
  const data = snapshot.val(); // 객체로 변환
  const items: ItemData[] = [];

  // ❌ Object.entries()는 프로퍼티 순서를 보장하지 않음!
  Object.entries(data).forEach(([key, value]) => {
    items.push({ key, data: value });
  });

  // 결과: Firebase의 정렬 순서와 다르게 배열이 구성됨
}
```

**문제점**:
- JavaScript 객체의 프로퍼티 순서는 삽입 순서 또는 키 타입에 따라 결정됨
- 특히 문자열 키의 경우 예측 불가능한 순서로 정렬될 수 있음
- `order` 필드처럼 문자열 정렬이 중요한 경우 심각한 문제 발생

**✅ 올바른 방식 (순서 유지)**:
```typescript
const snapshot = await get(dataQuery);
if (snapshot.exists()) {
  const items: ItemData[] = [];

  // ✅ snapshot.forEach()를 사용하여 Firebase의 정렬 순서 유지
  snapshot.forEach((childSnapshot) => {
    const key = childSnapshot.key;
    const data = childSnapshot.val();
    if (key) {
      items.push({ key, data });
    }
  });

  // 결과: Firebase가 반환한 정렬 순서 그대로 배열 구성
}
```

#### 실제 영향

**테스트 데이터**:
```javascript
{
  "test/data": {
    "-ABC123": { "order": "cherry-1699520445266", "title": "[3] 57. [Cherry] [News]" },
    "-ABC124": { "order": "cherry-1699520446266", "title": "[3] 58. [Cherry] [News]" },
    "-ABC125": { "order": "cherry-1699520447266", "title": "[2] 22. [Cherry] [News]" }
  }
}
```

**Firebase 쿼리**:
```typescript
query(
  ref(db, 'test/data'),
  orderByChild('order'),
  startAt('cherry-'),
  endAt('cherry-\uf8ff'),
  limitToFirst(20)
)
```

**Object.entries() 사용 시**:
```
[2] 22. [Cherry] [News]  (order: cherry-1699520447266)
[3] 57. [Cherry] [News]  (order: cherry-1699520445266)  ← 순서가 뒤바뀜!
[3] 58. [Cherry] [News]  (order: cherry-1699520446266)
```

**snapshot.forEach() 사용 시**:
```
[3] 57. [Cherry] [News]  (order: cherry-1699520445266)  ← 올바른 순서
[3] 58. [Cherry] [News]  (order: cherry-1699520446266)
[2] 22. [Cherry] [News]  (order: cherry-1699520447266)
```

#### DatabaseListView 구현

```typescript
// loadInitialData() 함수 내부
async function loadInitialData() {
  // ... Firebase 쿼리 생성 ...

  const snapshot = await get(dataQuery);

  if (snapshot.exists()) {
    let loadedItems: ItemData[] = [];

    // 🔥 중요: snapshot.forEach()를 사용하여 Firebase의 정렬 순서를 유지
    snapshot.forEach((childSnapshot) => {
      const key = childSnapshot.key;
      const data = childSnapshot.val();
      if (key) {
        loadedItems.push({ key, data });
      }
    });

    console.log(
      `%c[DatabaseListView] Initial Load - Items in Firebase order:`,
      'color: #6366f1;',
      loadedItems.map((item, idx) => ({
        index: idx,
        key: item.key,
        [orderBy]: item.data[orderBy],
        title: item.data.title
      }))
    );

    // ... 필터링 및 정렬 처리 ...
  }
}

// loadMore() 함수도 동일한 방식 적용
async function loadMore() {
  // ... Firebase 쿼리 생성 ...

  const snapshot = await get(dataQuery);

  if (snapshot.exists()) {
    const newItems: ItemData[] = [];

    // 🔥 snapshot.forEach() 사용
    snapshot.forEach((childSnapshot) => {
      const key = childSnapshot.key;
      const data = childSnapshot.val();
      if (key) {
        newItems.push({ key, data });
      }
    });

    // ... 이후 처리 ...
  }
}
```

#### 교훈

1. **항상 snapshot.forEach() 사용**
   - Firebase의 정렬 순서를 보존하는 유일한 방법
   - Object.entries()는 절대 사용하지 말 것

2. **디버깅 로그 필수**
   - Firebase 반환 순서를 콘솔에 출력하여 확인
   - 순서 문제를 조기에 발견할 수 있음

3. **문자열 정렬에 특히 주의**
   - `order`, `categoryKey` 같은 문자열 필드로 정렬할 때 더욱 중요
   - 숫자 타입은 상대적으로 덜 민감하지만 여전히 snapshot.forEach() 사용 권장

### 13.2. 디버깅 로그 시스템

DatabaseListView는 모든 주요 작업에 대해 상세한 디버깅 로그를 제공합니다.

#### 로그 색상 체계

```typescript
// 초록색: 성공 및 완료
console.log('%c[DatabaseListView] ✅ Initial Load Complete',
  'color: #10b981; font-weight: bold; font-size: 14px;', data);

// 파란색: 일반 정보
console.log('%c[DatabaseListView] Load More - Page 1',
  'color: #3b82f6; font-weight: bold;', data);

// 보라색: 필터링 결과
console.log('%c[DatabaseListView] After duplicate filtering: 21 → 20 items',
  'color: #8b5cf6;');

// 핑크색: reverse 전 상태
console.log('%c[DatabaseListView] Before reverse:',
  'color: #ec4899;', items);

// 주황색: 경고
console.warn('%c[DatabaseListView] Filtering out item without orderBy field:',
  'color: #f59e0b;', item);
```

#### 초기 로드 로그

```typescript
console.log(
  `%c[DatabaseListView] Initial Load - Query Settings`,
  'color: #10b981; font-weight: bold;',
  { path, orderBy, orderPrefix, reverse, pageSize }
);
console.log(
  `%c[DatabaseListView] Initial Load - Firebase returned ${loadedItems.length} items`,
  'color: #3b82f6; font-weight: bold;'
);
console.log(
  `%c[DatabaseListView] Initial Load - Items in Firebase order:`,
  'color: #6366f1;',
  loadedItems.map((item, idx) => ({
    index: idx,
    key: item.key,
    [orderBy]: item.data[orderBy],
    title: item.data.title
  }))
);
```

#### 필터링 로그

```typescript
const beforeFilterCount = loadedItems.length;
loadedItems = loadedItems.filter((item) => {
  const hasOrderByField = item.data[orderBy] != null && item.data[orderBy] !== '';
  if (!hasOrderByField) {
    console.warn(
      `%c[DatabaseListView] Filtering out item without '${orderBy}' field:`,
      'color: #f59e0b;',
      { key: item.key, data: item.data }
    );
  }
  return hasOrderByField;
});

if (beforeFilterCount !== loadedItems.length) {
  console.log(
    `%c[DatabaseListView] After filtering: ${beforeFilterCount} → ${loadedItems.length} items`,
    'color: #8b5cf6;'
  );
}
```

#### reverse 로그

```typescript
if (reverse) {
  console.log(
    `%c[DatabaseListView] Before reverse:`,
    'color: #ec4899;',
    loadedItems.map((item, idx) => ({
      index: idx,
      [orderBy]: item.data[orderBy],
      title: item.data.title
    }))
  );
  loadedItems.reverse();
  console.log(
    `%c[DatabaseListView] After reverse (newest first):`,
    'color: #10b981;',
    loadedItems.map((item, idx) => ({
      index: idx,
      [orderBy]: item.data[orderBy],
      title: item.data.title
    }))
  );
}
```

#### 완료 로그

```typescript
console.log(
  `%c[DatabaseListView] ✅ Initial Load Complete`,
  'color: #10b981; font-weight: bold; font-size: 14px;',
  {
    page: currentPage,
    loaded: items.length,
    hasMore,
    finalOrder: items.map((item, idx) => ({
      index: idx,
      [orderBy]: item.data[orderBy],
      title: item.data.title
    }))
  }
);
```

#### 로그 출력 예시

콘솔에서 다음과 같이 표시됩니다:

```
[DatabaseListView] Initial Load - Query Settings
  { path: "test/data", orderBy: "order", orderPrefix: "cherry-", reverse: true, pageSize: 20 }

[DatabaseListView] Initial Load - Firebase returned 21 items

[DatabaseListView] Initial Load - Items in Firebase order:
  [
    { index: 0, key: "-ABC123", order: "cherry-1699520445266", title: "[3] 57..." },
    { index: 1, key: "-ABC124", order: "cherry-1699520446266", title: "[3] 58..." },
    ...
  ]

[DatabaseListView] Before reverse:
  [
    { index: 0, order: "cherry-1699520445266", title: "[3] 57..." },
    { index: 1, order: "cherry-1699520446266", title: "[3] 58..." },
    ...
  ]

[DatabaseListView] After reverse (newest first):
  [
    { index: 0, order: "cherry-1699520467266", title: "[2] 22..." },
    { index: 1, order: "cherry-1699520466266", title: "[3] 58..." },
    ...
  ]

[DatabaseListView] ✅ Initial Load Complete
  {
    page: 0,
    loaded: 20,
    hasMore: true,
    finalOrder: [...]
  }
```

### 13.3. orderBy 필드 필터링

#### 문제: 페이지네이션 시 orderBy 필드가 없는 항목도 반환됨

Firebase는 `startAt()`과 `endBefore()` 또는 `startAfter()`와 `endBefore()`를 **동시에 사용할 수 없습니다**.

**초기 로드**:
```typescript
// ✅ startAt(false)로 null/undefined 필터링 가능
query(
  baseRef,
  orderByChild('qnaCreatedAt'),
  startAt(false),  // null/undefined 제외
  limitToLast(20)
)
```

**페이지네이션**:
```typescript
// ❌ startAt(false)와 endBefore()를 동시에 사용할 수 없음!
query(
  baseRef,
  orderByChild('qnaCreatedAt'),
  startAt(false),           // ← 불가능!
  endBefore(lastLoadedValue),  // ← 충돌
  limitToLast(20)
)

// ✅ endBefore()만 사용
query(
  baseRef,
  orderByChild('qnaCreatedAt'),
  endBefore(lastLoadedValue),
  limitToLast(20)
)
// 문제: qnaCreatedAt이 없는 항목도 반환될 수 있음
```

#### 해결: 클라이언트 측 필터링

```typescript
async function loadMore() {
  // ... Firebase 쿼리 실행 ...

  snapshot.forEach((childSnapshot) => {
    newItems.push({ key: childSnapshot.key, data: childSnapshot.val() });
  });

  // 중복 제거
  let uniqueItems = newItems.filter((item) => !existingKeys.has(item.key));

  // 🔥 orderBy 필드가 있는 항목만 필터링
  const validItems = uniqueItems.filter((item) => {
    const hasOrderByField = item.data[orderBy] != null && item.data[orderBy] !== '';
    if (!hasOrderByField) {
      console.warn(
        `%c[DatabaseListView] Filtering out item without '${orderBy}' field:`,
        'color: #f59e0b;',
        { key: item.key, data: item.data }
      );
    }
    return hasOrderByField;
  });

  uniqueItems = validItems;

  // ... 이후 처리 ...
}
```

#### 왜 초기 로드에서도 필터링하나?

초기 로드에서는 `startAt(false)`를 사용하여 서버 측에서 필터링하지만, **추가 안전성**을 위해 클라이언트에서도 필터링합니다:

```typescript
async function loadInitialData() {
  // ... Firebase 쿼리 (startAt(false) 포함) ...

  snapshot.forEach((childSnapshot) => {
    loadedItems.push({ key: childSnapshot.key, data: childSnapshot.val() });
  });

  // 🔥 추가 안전성을 위한 클라이언트 필터링
  const beforeFilterCount = loadedItems.length;
  loadedItems = loadedItems.filter((item) => {
    return item.data[orderBy] != null && item.data[orderBy] !== '';
  });

  if (beforeFilterCount !== loadedItems.length) {
    console.log(`Filtered out ${beforeFilterCount - loadedItems.length} items`);
  }
}
```

**이유**:
- Firebase 쿼리 동작이 버전에 따라 달라질 수 있음
- 데이터 무결성 보장
- 예외 상황 대비

### 13.4. 실제 인덱스 전달

#### snippet에 index 전달

DatabaseListView는 각 아이템의 **실제 배열 인덱스**를 snippet으로 전달합니다:

```typescript
// Props 타입 정의
type ItemSnippet = Snippet<[itemData: ItemData, index: number]>;

interface Props {
  item: ItemSnippet;
  // ... 다른 props ...
}

// 템플릿에서 index 전달
{#each items as itemData, index (itemData.key)}
  <div class="item-wrapper" data-key={itemData.key}>
    {#if item}
      {@render item(itemData, index)}  {/* ← index 전달 */}
    {/if}
  </div>
{/each}
```

#### 상위 컴포넌트에서 활용

```svelte
<DatabaseListView path="test/data" pageSize={20} orderBy="order" orderPrefix="cherry-">
  {#snippet item(itemData: { key: string; data: any }, index: number)}
    {@const actualPageNumber = Math.floor(index / 20) + 1}
    {@const actualOrderNumber = index + 1}

    <div class="item-card">
      <p>페이지: {actualPageNumber}</p>
      <p>순서: {actualOrderNumber}</p>
      <p>인덱스: {index}</p>
      <h3>{itemData.data.title}</h3>
    </div>
  {/snippet}
</DatabaseListView>
```

**결과**:
```
페이지: 1, 순서: 1, 인덱스: 0
페이지: 1, 순서: 2, 인덱스: 1
페이지: 1, 순서: 3, 인덱스: 2
...
페이지: 1, 순서: 20, 인덱스: 19
페이지: 2, 순서: 21, 인덱스: 20
페이지: 2, 순서: 22, 인덱스: 21
```

#### 필터링된 데이터에서도 정확한 순서

orderBy 필드로 필터링하면 실제 표시되는 항목만 카운트됩니다:

```svelte
<!-- qnaCreatedAt으로 필터링 -->
<DatabaseListView orderBy="qnaCreatedAt">
  {#snippet item(itemData, index)}
    <div>
      {index + 1}. {itemData.data.title}
      <!-- Q&A 항목만 1, 2, 3... 순서로 표시 -->
    </div>
  {/snippet}
</DatabaseListView>
```

## 14. 구현 및 테스트 사례

### 14.1. 컴포넌트 파일 위치

- **컴포넌트**: [src/lib/components/DatabaseListView.svelte](./repository/src/lib/components/DatabaseListView.svelte)
- **타입**: Svelte 5 컴포넌트 (`.svelte`)
- **크기**: ~1350 라인 (주석 포함)

### 14.2. 구현된 페이지

#### 1. 사용자 목록 페이지

**경로**: `/user/list`
**소스 코드 위치**: [src/routes/user/list/+page.svelte](./repository/src/routes/user/list/+page.svelte)

**구현 내용**:
```svelte
<DatabaseListView
  path="users"
  pageSize={15}
  orderBy="createdAt"
  threshold={300}
  reverse={false}
>
  {#snippet item(itemData)}
    <!-- 사용자 카드 UI -->
  {/snippet}
</DatabaseListView>
```

**주요 기능**:
- Firebase RTDB의 `users` 경로에서 사용자 데이터 로드
- createdAt 필드로 정렬 (오래된 사용자부터)
- 무한 스크롤로 15개씩 로드
- 사용자 프로필 카드 UI 제공
- 클릭 시 사용자 프로필 페이지로 이동

**UI 특징**:
- 사용자 아바타 이미지 (또는 placeholder)
- 이름, 이메일, 가입일, 마지막 로그인 시간 표시
- 호버 효과 및 클릭 가능한 카드
- 반응형 디자인 지원

#### 2. DatabaseListView 테스트 페이지

**경로**: `/dev/test/database-list-view`
**소스 코드 위치**: [src/routes/dev/test/database-list-view/+page.svelte](./repository/src/routes/dev/test/database-list-view/+page.svelte)

**테스트 케이스**:

1. **기본 사용 (정순 정렬)**
   - path: "users"
   - orderBy: "createdAt"
   - reverse: false
   - 오래된 사용자부터 표시

2. **역순 정렬**
   - reverse: true
   - 최신 사용자부터 표시
   - limitToLast 사용

3. **orderPrefix 필터링**
   - path: "posts"
   - orderBy: "categoryKey"
   - orderPrefix: "community-"
   - 특정 카테고리만 필터링

4. **컨테이너 스크롤**
   - 고정 높이 컨테이너 (600px)
   - 컨테이너 내부 스크롤 감지
   - overflow-y: auto

**테스트 UI 특징**:
- 탭 방식으로 테스트 케이스 선택
- 각 케이스별 코드 예시 제공
- 테스트 설명 및 주의사항 표시
- 실시간 동작 확인 가능

> ℹ️ 2025-11-09 기준으로 `/admin/test/database-list-view` 페이지는 `/dev/test/database-list-view`와 기능이 완전히 중복되어 제거되었습니다. 이제 모든 DatabaseListView QA는 개발용 경로(`/dev/test/...`)에서만 수행합니다.

### 14.3. 구현 과정

#### Phase 1: Custom Elements → Svelte 5 변환 (2025-01-09)

**작업 내용**:
1. Custom Elements 방식의 DatabaseListView 분석
2. Svelte 5 문법으로 변환:
   - `this.getAttribute()` → `$props()`
   - `this.state` → `$state()`
   - `connectedCallback()` → `$effect()`
   - `<template>` → `{#snippet}`
3. prop 이름 변경: `sortPrefix` → `orderPrefix`
4. 타입 안전성 향상 (TypeScript 적용)

**주요 개선사항**:
- Svelte의 자동 반응형 시스템 활용
- 코드 가독성 향상
- 타입 안전성 확보
- 더 간결한 템플릿 문법

#### Phase 2: 페이지 구현 (2025-01-09)

**작업 내용**:
1. `/user/list` 페이지 생성
   - DatabaseListView 활용
   - 사용자 목록 UI 디자인
   - 프로필 페이지 연동

2. `/dev/test/database-list-view` 테스트 페이지 생성
   - 4가지 테스트 케이스 구현
   - 코드 예시 제공
   - 인터랙티브 테스트 환경

#### Phase 3: 문서화 (2025-01-09)

**작업 내용**:
1. 스펙 문서 업데이트
   - Custom Elements → Svelte 5 마이그레이션 가이드 추가
   - `sortPrefix` → `orderPrefix` 전체 변경
   - 마이그레이션 체크리스트 제공
2. 구현 사례 문서화
3. 테스트 방법 문서화

### 14.4. 검증 방법

#### 1. 수동 테스트

**테스트 페이지 접속**:
```
http://localhost:5173/dev/test/database-list-view
```

**확인 항목**:
- [ ] 초기 데이터 로드 정상 작동
- [ ] 스크롤 시 다음 페이지 자동 로드
- [ ] reverse 모드 정상 작동
- [ ] orderPrefix 필터링 정상 작동
- [ ] 컨테이너 스크롤 감지 정상 작동
- [ ] 실시간 데이터 업데이트 반영
- [ ] 노드 삭제 시 자동 제거

#### 2. 콘솔 로그 확인

DatabaseListView는 상세한 디버깅 로그를 제공합니다:

```javascript
// 초기 로드
DatabaseListView: Loading initial data from users (reverse: false)
DatabaseListView: Using limitToFirst with startAt(false) to filter null/undefined
DatabaseListView: Initial query returned 11 items from Firebase
DatabaseListView: Page 0 - Loaded 10 items, hasMore: true

// 페이지네이션
DatabaseListView: Near bottom (window scroll), loading more...
DatabaseListView: Loading more data (server-side pagination) - Page 1
DatabaseListView: Using startAfter + limitToFirst for normal pagination

// 실시간 업데이트
DatabaseListView: Setting up child_added listener for users
DatabaseListView: New child added: userId123
DatabaseListView: Setting up child_removed listener for users
DatabaseListView: Child removed: userId456
```

#### 3. Firebase Console 확인

**데이터 구조 확인**:
```
users/
  userId1/
    displayName: "홍길동"
    email: "hong@example.com"
    photoUrl: "https://..."
    createdAt: 1704844800000
    lastLoginAt: 1704931200000
```

**필수 필드**:
- `createdAt`: 정렬 기준 필드 (timestamp)
- `displayName`: 사용자 이름
- `email`: 이메일 주소

### 14.5. 성능 최적화

#### 1. 메모리 관리

- onValue 리스너 자동 해제
- 컴포넌트 언마운트 시 모든 리스너 정리
- unsubscribers Map으로 리스너 추적

#### 2. 네트워크 최적화

- pageSize + 1 쿼리로 hasMore 판단
- startAt(false)로 null/undefined 필터링
- Firebase 쿼리 레벨에서 필터링

#### 3. 렌더링 최적화

- Svelte의 자동 최적화 활용
- key 기반 리스트 렌더링
- 중복 제거 로직

### 14.6. 알려진 제약사항

1. **Firebase 쿼리 제약**:
   - startAt()과 startAfter()를 동시에 사용할 수 없음
   - orderPrefix 필터링 시 클라이언트 측 필터링 필요 (페이지네이션 시)

2. **orderBy 필드 필수**:
   - 모든 아이템이 orderBy 필드를 가지고 있어야 함
   - 필드가 없으면 페이지네이션 오류 발생

3. **컨테이너 스크롤**:
   - 명시적인 높이 설정 필요
   - overflow-y: auto 필수

### 14.7. 향후 개선 계획

1. **검색 기능 추가**
   - 텍스트 검색
   - 필터링 옵션

2. **정렬 옵션**
   - 다중 필드 정렬
   - 정렬 방향 변경

3. **UI 개선**
   - 로딩 스켈레톤
   - 페이지네이션 상태 표시
   - 스크롤 위치 복원

4. **성능 개선**
   - 가상 스크롤링
   - 지연 로딩
   - 캐싱 전략

---

## 15. 아키텍처 및 구조

DatabaseListView 컴포넌트는 **Svelte 5 Runes 기반**으로 설계되어 강력한 반응성과 타입 안전성을 제공합니다.

### 15.1. 상태 관리 ($state)

컴포넌트의 모든 상태는 `$state` rune을 사용하여 관리되며, 자동 반응성을 제공합니다.

```typescript
// 아이템 목록
let items = $state<ItemData[]>([]);

// 로딩 상태
let loading = $state<boolean>(false);
let initialLoading = $state<boolean>(true);

// 페이지네이션 상태
let hasMore = $state<boolean>(true);
let lastLoadedValue = $state<any>(null);
let lastLoadedKey = $state<string | null>(null);
let currentPage = $state<number>(0);

// 에러 상태
let error = $state<string | null>(null);

// 스크롤 컨테이너
let scrollContainer = $state<HTMLDivElement | null>(null);

// 실시간 리스너 관리
let childAddedListenerReady = $state<boolean>(false);
```

**주요 상태 변수 설명**:

| 변수 | 타입 | 설명 |
|------|------|------|
| `items` | `ItemData[]` | 현재 화면에 표시 중인 아이템 목록 |
| `loading` | `boolean` | 추가 페이지 로드 중 여부 |
| `initialLoading` | `boolean` | 초기 데이터 로드 중 여부 |
| `hasMore` | `boolean` | 더 가져올 데이터가 있는지 여부 |
| `lastLoadedValue` | `any` | 마지막 로드한 아이템의 orderBy 필드 값 (커서) |
| `lastLoadedKey` | `string \| null` | 마지막 로드한 아이템의 key |
| `currentPage` | `number` | 현재 로드된 페이지 번호 (0부터 시작) |
| `error` | `string \| null` | 에러 메시지 |
| `scrollContainer` | `HTMLDivElement \| null` | 스크롤 컨테이너 DOM 참조 |
| `childAddedListenerReady` | `boolean` | onChildAdded 리스너 준비 여부 |

### 15.2. Props 및 타입 정의

#### Props 인터페이스

```typescript
interface Props {
  path?: string;           // RTDB 경로 (예: "users")
  pageSize?: number;       // 한 번에 가져올 아이템 개수 (기본: 10)
  orderBy?: string;        // 정렬 기준 필드 (기본: "createdAt")
  orderPrefix?: string;    // 정렬 필드 prefix 필터 (선택사항)
  equalToValue?: string | number | boolean | null; // orderBy 필드가 특정 값과 정확히 일치해야 할 때
  threshold?: number;      // 스크롤 threshold (px, 기본: 300)
  reverse?: boolean;       // 역순 정렬 여부 (기본: false)
  item: ItemSnippet;       // 아이템 렌더링 snippet (필수)
  loading?: StatusSnippet; // 로딩 상태 snippet
  empty?: StatusSnippet;   // 빈 상태 snippet
  error?: ErrorSnippet;    // 에러 상태 snippet
  loadingMore?: StatusSnippet; // 더 로드 중 snippet
  noMore?: StatusSnippet;  // 더 이상 데이터 없음 snippet
}
```

#### 타입 정의

```typescript
// 아이템 데이터 타입
type ItemData = {
  key: string;  // Firebase 노드 key
  data: any;    // 노드 데이터
};

// Snippet 타입들
type ItemSnippet = Snippet<[itemData: ItemData, index: number]>;
type StatusSnippet = Snippet<[]>;
type ErrorSnippet = Snippet<[errorMessage: string | null]>;
```

**Snippet 파라미터**:
- `ItemSnippet`: `(itemData, index)` - 아이템 데이터와 배열 인덱스를 전달
- `StatusSnippet`: 파라미터 없음
- `ErrorSnippet`: `(errorMessage)` - 에러 메시지를 전달

### 15.3. 라이프사이클 ($effect)

DatabaseListView는 두 개의 `$effect`를 사용하여 라이프사이클을 관리합니다.

#### Effect 1: 데이터 로드 및 cleanup

```typescript
$effect(() => {
  if (path && database) {
    loadInitialData(); // 초기 데이터 로드
  }

  // cleanup: 컴포넌트 언마운트 시 모든 리스너 해제
  return () => {
    console.log('DatabaseListView: Cleaning up listeners');

    // child_added 리스너 해제
    if (childAddedUnsubscribe) {
      childAddedUnsubscribe();
      childAddedUnsubscribe = null;
    }

    // child_removed 리스너 해제
    if (childRemovedUnsubscribe) {
      childRemovedUnsubscribe();
      childRemovedUnsubscribe = null;
    }

    // 모든 onValue 리스너 해제
    unsubscribers.forEach((unsubscribe) => {
      unsubscribe();
    });
    unsubscribers.clear();

    console.log('DatabaseListView: All listeners cleaned up');
  };
});
```

**역할**:
- 컴포넌트 마운트 시 `loadInitialData()` 호출
- 컴포넌트 언마운트 시 모든 Firebase 리스너 해제
- 메모리 누수 방지

#### Effect 2: 스크롤 이벤트 리스너

```typescript
$effect(() => {
  if (scrollContainer) {
    // 컨테이너 자체 스크롤 감지
    scrollContainer.addEventListener('scroll', handleScroll);
    // window 스크롤 감지 (body 스크롤)
    window.addEventListener('scroll', handleWindowScroll);

    return () => {
      scrollContainer?.removeEventListener('scroll', handleScroll);
      window.removeEventListener('scroll', handleWindowScroll);
    };
  }
});
```

**역할**:
- 컨테이너 스크롤과 window 스크롤을 모두 감지
- 무한 스크롤 구현
- cleanup에서 이벤트 리스너 제거

### 15.4. 리스너 관리 시스템

DatabaseListView는 여러 종류의 Firebase 리스너를 관리합니다.

```typescript
// 1. onValue 리스너 맵 (아이템별 실시간 업데이트)
let unsubscribers = new Map<string, () => void>();

// 2. onChildAdded 리스너 (신규 노드 감지)
let childAddedUnsubscribe: (() => void) | null = null;

// 3. onChildRemoved 리스너 (삭제 노드 감지)
let childRemovedUnsubscribe: (() => void) | null = null;
```

**리스너 종류**:

| 리스너 | 목적 | 개수 |
|--------|------|------|
| `onValue` | 각 아이템의 데이터 변경 감지 | 아이템 개수만큼 |
| `onChildAdded` | 새로운 노드 생성 감지 | 1개 (path 전체) |
| `onChildRemoved` | 노드 삭제 감지 | 1개 (path 전체) |

---

## 16. 주요 함수 상세

### 16.1. loadInitialData()

**목적**: 첫 페이지 데이터를 로드하고 초기 상태를 설정합니다.

**동작 순서**:

1. **초기화**
   ```typescript
   initialLoading = true;
   error = null;
   items = [];
   pageItems.clear();

   // 기존 리스너들 정리
   unsubscribers.forEach((unsubscribe) => unsubscribe());
   unsubscribers.clear();

   // child_added, child_removed 리스너 해제
   if (childAddedUnsubscribe) {
     childAddedUnsubscribe();
     childAddedUnsubscribe = null;
   }
   if (childRemovedUnsubscribe) {
     childRemovedUnsubscribe();
     childRemovedUnsubscribe = null;
   }
   ```

2. **Firebase 쿼리 생성**
   ```typescript
   const baseRef = dbRef(database, path);
   let dataQuery;

   if (reverse) {
     // 역순: limitToLast 사용
     if (orderPrefix) {
       dataQuery = query(
         baseRef,
         orderByChild(orderBy),
         startAt(orderPrefix),
         endAt(orderPrefix + '\uf8ff'),
         limitToLast(pageSize + 1)
       );
     } else {
       dataQuery = query(
         baseRef,
         orderByChild(orderBy),
         startAt(false), // null/undefined 제외
         limitToLast(pageSize + 1)
       );
     }
   } else {
     // 정순: limitToFirst 사용
     if (orderPrefix) {
       dataQuery = query(
         baseRef,
         orderByChild(orderBy),
         startAt(orderPrefix),
         endAt(orderPrefix + '\uf8ff'),
         limitToFirst(pageSize + 1)
       );
     } else {
       dataQuery = query(
         baseRef,
         orderByChild(orderBy),
         startAt(false), // null/undefined 제외
         limitToFirst(pageSize + 1)
       );
     }
   }
   ```

3. **데이터 로드 및 처리**
   ```typescript
   const snapshot = await get(dataQuery);

   if (snapshot.exists()) {
     let loadedItems: ItemData[] = [];

     // 🔥 중요: snapshot.forEach()로 정렬 순서 유지
     snapshot.forEach((childSnapshot) => {
       const key = childSnapshot.key;
       const data = childSnapshot.val();
       if (key) {
         loadedItems.push({ key, data });
       }
     });
   }
   ```

4. **orderBy 필드 필터링**
   ```typescript
   loadedItems = loadedItems.filter((item) => {
     return item.data[orderBy] != null && item.data[orderBy] !== '';
   });
   ```

5. **reverse 처리**
   ```typescript
   if (reverse) {
     loadedItems.reverse(); // 최신 글이 먼저 오도록
   }
   ```

6. **hasMore 판단 및 커서 설정**
   ```typescript
   if (loadedItems.length > pageSize) {
     hasMore = true;
     items = loadedItems.slice(0, pageSize);

     const cursor = getLastItemCursor(items, orderBy);
     if (cursor) {
       lastLoadedValue = cursor.value;
       lastLoadedKey = cursor.key;
     }
   } else {
     hasMore = false;
     items = loadedItems;
   }
   ```

7. **실시간 리스너 설정**
   ```typescript
   // 각 아이템에 onValue 리스너 설정
   items.forEach((item, index) => {
     setupItemListener(item.key, index);
   });

   // child_added 리스너 설정 (신규 노드 감지)
   setupChildAddedListener();

   // child_removed 리스너 설정 (삭제 노드 감지)
   setupChildRemovedListener();
   ```

**중요 포인트**:
- `pageSize + 1`개를 로드하여 hasMore 판단
- `snapshot.forEach()` 사용으로 정렬 순서 보존
- `startAt(false)`로 null/undefined 값 제외
- reverse 모드에서는 `limitToLast` + `reverse()` 사용

### 16.2. loadMore()

**목적**: 다음 페이지 데이터를 로드합니다.

**동작 순서**:

1. **사전 검증**
   ```typescript
   if (loading || !hasMore) {
     return; // 이미 로딩 중이거나 더 이상 데이터 없음
   }

   if (lastLoadedValue == null) {
     hasMore = false;
     return; // 커서 값이 없으면 중단
   }
   ```

2. **Firebase 쿼리 생성**
   ```typescript
   let dataQuery;

   if (reverse) {
     // 역순: endBefore + limitToLast
     if (orderPrefix) {
       dataQuery = query(
         baseRef,
         orderByChild(orderBy),
         startAt(orderPrefix),
         endBefore(lastLoadedValue),
         limitToLast(pageSize + 1)
       );
     } else {
       dataQuery = query(
         baseRef,
         orderByChild(orderBy),
         endBefore(lastLoadedValue),
         limitToLast(pageSize + 1)
       );
     }
   } else {
     // 정순: startAfter + limitToFirst
     if (orderPrefix) {
       dataQuery = query(
         baseRef,
         orderByChild(orderBy),
         startAfter(lastLoadedValue),
         endAt(orderPrefix + '\uf8ff'),
         limitToFirst(pageSize + 1)
       );
     } else {
       dataQuery = query(
         baseRef,
         orderByChild(orderBy),
         startAfter(lastLoadedValue),
         limitToFirst(pageSize + 1)
       );
     }
   }
   ```

3. **데이터 로드 및 처리**
   ```typescript
   const snapshot = await get(dataQuery);
   const newItems: ItemData[] = [];

   snapshot.forEach((childSnapshot) => {
     const key = childSnapshot.key;
     const data = childSnapshot.val();
     if (key) {
       newItems.push({ key, data });
     }
   });

   // reverse 처리
   if (reverse) {
     newItems.reverse();
   }
   ```

4. **중복 제거 및 필터링**
   ```typescript
   // 중복 제거
   const existingKeys = new Set(items.map(item => item.key));
   let uniqueItems = newItems.filter((item) => !existingKeys.has(item.key));

   // orderBy 필드 필터링
   uniqueItems = uniqueItems.filter((item) => {
     return item.data[orderBy] != null && item.data[orderBy] !== '';
   });
   ```

5. **items 배열 업데이트**
   ```typescript
   if (newItems.length > pageSize) {
     hasMore = true;
     const itemsToAdd = uniqueItems.slice(0, pageSize);
     items = [...items, ...itemsToAdd];

     const cursor = getLastItemCursor(itemsToAdd, orderBy);
     if (cursor) {
       lastLoadedValue = cursor.value;
       lastLoadedKey = cursor.key;
     }
   } else {
     hasMore = false;
     items = [...items, ...uniqueItems];
   }
   ```

6. **새 아이템에 리스너 설정**
   ```typescript
   const startIndex = items.length - uniqueItems.length;
   items.slice(startIndex).forEach((item, relativeIndex) => {
     setupItemListener(item.key, startIndex + relativeIndex);
   });
   ```

**중요 포인트**:
- reverse에 따라 `startAfter` vs `endBefore` 사용
- 중복 제거로 같은 아이템이 두 번 나오지 않도록 방지
- orderBy 필드 필터링으로 유효하지 않은 아이템 제외
- 새 아이템에만 리스너 설정 (기존 아이템은 이미 리스너 있음)

### 16.3. setupItemListener()

**목적**: 각 아이템에 `onValue` 리스너를 설정하여 실시간 업데이트를 감지합니다.

```typescript
function setupItemListener(itemKey: string, index: number): void {
  if (!database) return;

  // 이미 리스닝 중이면 스킵
  const listenerKey = `${itemKey}`;
  if (unsubscribers.has(listenerKey)) {
    return;
  }

  const itemRef = dbRef(database, `${path}/${itemKey}`);
  const unsubscribe = onValue(
    itemRef,
    (snapshot) => {
      if (snapshot.exists()) {
        const updatedData = snapshot.val();
        // items 배열 업데이트
        items[index] = {
          key: itemKey,
          data: updatedData
        };
        items = [...items]; // 반응성을 위해 배열 재할당
        console.log(`DatabaseListView: Item updated ${itemKey}`, updatedData);
      }
    },
    (error) => {
      console.error(`DatabaseListView: Error listening to item ${itemKey}`, error);
    }
  );

  // 리스너 해제 함수 저장
  unsubscribers.set(listenerKey, unsubscribe);
}
```

**동작 방식**:
1. `itemKey`로 중복 체크 (이미 리스닝 중이면 스킵)
2. `onValue` 리스너 등록
3. 데이터 변경 시 `items[index]` 업데이트
4. `items = [...items]`로 반응성 트리거
5. 해제 함수를 `unsubscribers` Map에 저장

**중요 포인트**:
- 각 아이템마다 별도의 `onValue` 리스너
- 중복 방지로 같은 아이템에 여러 리스너 설정 안 함
- 배열 재할당으로 Svelte 반응성 보장

### 16.4. setupChildAddedListener()

**목적**: 새로운 노드가 생성되면 실시간으로 화면에 추가합니다.

```typescript
function setupChildAddedListener() {
  if (!database) return;

  if (childAddedUnsubscribe) {
    childAddedUnsubscribe();
    childAddedUnsubscribe = null;
  }

  console.log('DatabaseListView: Setting up child_added listener for', path);
  childAddedListenerReady = false;

  const baseRef = dbRef(database, path);

  // 쿼리 생성
  let dataQuery;
  if (orderPrefix) {
    dataQuery = query(
      baseRef,
      orderByChild(orderBy),
      startAt(orderPrefix),
      endAt(orderPrefix + '\uf8ff')
    );
  } else {
    dataQuery = query(
      baseRef,
      orderByChild(orderBy),
      startAt(false)
    );
  }

  childAddedUnsubscribe = onChildAdded(dataQuery, (snapshot) => {
    // 초기 로드 완료 전에는 무시
    if (!childAddedListenerReady) {
      return;
    }

    const newItemKey = snapshot.key;
    const newItemData = snapshot.val();

    if (!newItemKey) return;

    // 중복 체크
    const exists = items.some(item => item.key === newItemKey);
    if (exists) {
      console.log('DatabaseListView: Child already exists, skipping:', newItemKey);
      return;
    }

    console.log('DatabaseListView: New child added:', newItemKey, newItemData);

    const newItem: ItemData = {
      key: newItemKey,
      data: newItemData
    };

    // reverse 여부에 따라 위치 결정
    if (reverse) {
      // 최신 글이 위에 → 배열 맨 앞에 추가
      items = [newItem, ...items];
      setupItemListener(newItemKey, 0);
    } else {
      // 오래된 글이 위에 → 배열 맨 뒤에 추가
      const newIndex = items.length;
      items = [...items, newItem];
      setupItemListener(newItemKey, newIndex);
    }
  }, (error) => {
    console.error('DatabaseListView: Error in child_added listener', error);
  });

  // 1초 후 리스너 활성화 (기존 아이템 이벤트 건너뛰기)
  setTimeout(() => {
    childAddedListenerReady = true;
    console.log('DatabaseListView: child_added listener is now ready');
  }, 1000);
}
```

**동작 방식**:
1. orderPrefix 여부에 따라 쿼리 생성
2. `onChildAdded` 리스너 등록
3. `childAddedListenerReady` 플래그로 초기 이벤트 무시
4. 새 노드 감지 시 중복 체크 후 items에 추가
5. reverse에 따라 배열 앞 또는 뒤에 추가
6. 새 아이템에 `onValue` 리스너 설정

**중요 포인트**:
- 초기 로드 시 기존 아이템에 대한 child_added 이벤트가 발생하므로 1초 지연
- 중복 체크로 같은 아이템 두 번 추가 방지
- reverse 모드에 따라 추가 위치 결정

### 16.5. setupChildRemovedListener()

**목적**: 노드가 삭제되면 실시간으로 화면에서 제거합니다.

```typescript
function setupChildRemovedListener() {
  if (!database) return;

  if (childRemovedUnsubscribe) {
    childRemovedUnsubscribe();
    childRemovedUnsubscribe = null;
  }

  console.log('DatabaseListView: Setting up child_removed listener for', path);

  const baseRef = dbRef(database, path);

  // child_added와 동일한 쿼리 사용
  let dataQuery;
  if (orderPrefix) {
    dataQuery = query(
      baseRef,
      orderByChild(orderBy),
      startAt(orderPrefix),
      endAt(orderPrefix + '\uf8ff')
    );
  } else {
    dataQuery = query(
      baseRef,
      orderByChild(orderBy),
      startAt(false)
    );
  }

  childRemovedUnsubscribe = onChildRemoved(dataQuery, (snapshot) => {
    const removedKey = snapshot.key;

    if (!removedKey) return;

    console.log('DatabaseListView: Child removed:', removedKey);

    // items 배열에서 제거
    const removedIndex = items.findIndex(item => item.key === removedKey);

    if (removedIndex !== -1) {
      items = items.filter(item => item.key !== removedKey);
      console.log('DatabaseListView: Removed item from list:', removedKey);

      // 해당 아이템의 onValue 리스너 해제
      const listenerKey = `${removedKey}`;
      const unsubscribe = unsubscribers.get(listenerKey);
      if (unsubscribe) {
        unsubscribe();
        unsubscribers.delete(listenerKey);
        console.log('DatabaseListView: Unsubscribed from removed item:', removedKey);
      }
    }
  }, (error) => {
    console.error('DatabaseListView: Error in child_removed listener', error);
  });
}
```

**동작 방식**:
1. child_added와 동일한 쿼리 사용 (범위 일치)
2. `onChildRemoved` 리스너 등록
3. 삭제 감지 시 items에서 필터링
4. 해당 아이템의 `onValue` 리스너 해제
5. unsubscribers Map에서 제거

**중요 포인트**:
- child_added와 동일한 쿼리로 범위 일치 보장
- 메모리 누수 방지를 위해 onValue 리스너도 해제
- filter로 배열에서 제거하여 반응성 트리거

### 16.6. getLastItemCursor()

**목적**: 페이지네이션 커서 값을 추출합니다.

```typescript
function getLastItemCursor(
  itemList: ItemData[],
  primaryField: string
): {value: any, key: string} | null {
  if (itemList.length === 0) return null;

  const lastItem = itemList[itemList.length - 1];
  if (!lastItem) return null;

  const value = lastItem.data[primaryField];

  // 주 필드 값이 있으면 사용
  if (value != null && value !== '') {
    console.log(`DatabaseListView: Using cursor from '${primaryField}':`, {
      value: value,
      key: lastItem.key
    });
    return {
      value: value,
      key: lastItem.key
    };
  }

  // 주 필드가 없으면 null 반환 (무한 스크롤 중단)
  console.warn(
    `DatabaseListView: Field '${primaryField}' not found in last item (key: ${lastItem.key}).`,
    `Pagination will stop here.`
  );
  return null;
}
```

**동작 방식**:
1. 배열의 마지막 아이템 가져오기
2. primaryField (orderBy) 값 추출
3. 값이 유효하면 `{value, key}` 반환
4. 값이 없으면 null 반환 (페이지네이션 중단)

**중요 포인트**:
- null/undefined/빈 문자열 체크
- 값이 없으면 경고 출력하고 null 반환
- 커서가 없으면 hasMore가 false로 설정됨

---

## 17. 실시간 동기화 시스템

DatabaseListView는 세 가지 Firebase 실시간 리스너를 조합하여 완전한 동기화를 구현합니다.

### 17.1. onValue - 아이템별 실시간 업데이트

**목적**: 각 아이템의 데이터가 변경되면 자동으로 화면에 반영합니다.

**설정 시점**:
- `loadInitialData()` 완료 후 각 아이템에 설정
- `loadMore()` 완료 후 새 아이템에 설정

**동작 예시**:
```typescript
// 사용자 1이 게시글 제목 수정
await update(ref(db, 'posts/post1'), {
  title: '수정된 제목'
});

// → onValue 리스너가 감지
// → items[index] 자동 업데이트
// → 화면에 새 제목 표시
```

**특징**:
- 아이템 개수만큼 리스너 생성 (N개)
- 각 리스너는 독립적으로 동작
- 메모리 효율을 위해 언마운트 시 모두 해제

### 17.2. onChildAdded - 신규 노드 감지

**목적**: 새로운 노드가 생성되면 실시간으로 리스트에 추가합니다.

**설정 시점**: `loadInitialData()` 완료 후

**동작 예시**:
```typescript
// 사용자 2가 새 게시글 작성
await push(ref(db, 'posts'), {
  title: '새 게시글',
  createdAt: Date.now()
});

// → onChildAdded 리스너가 감지
// → reverse=true면 배열 맨 앞에 추가
// → reverse=false면 배열 맨 뒤에 추가
// → 화면에 새 게시글 즉시 표시
```

**초기화 지연**:
```typescript
// onChildAdded는 리스너 등록 시 기존 아이템들에 대해서도 이벤트 발생
// 따라서 1초 지연 후 리스너 활성화
setTimeout(() => {
  childAddedListenerReady = true;
}, 1000);
```

**특징**:
- path 전체에 대해 1개의 리스너만 생성
- orderPrefix 범위 내의 신규 노드만 감지
- 중복 방지 로직으로 같은 아이템 두 번 추가 방지

### 17.3. onChildRemoved - 삭제 노드 감지

**목적**: 노드가 삭제되면 실시간으로 리스트에서 제거합니다.

**설정 시점**: `loadInitialData()` 완료 후

**동작 예시**:
```typescript
// 사용자 1이 게시글 삭제
await remove(ref(db, 'posts/post1'));

// → onChildRemoved 리스너가 감지
// → items에서 필터링하여 제거
// → 해당 아이템의 onValue 리스너 해제
// → 화면에서 게시글 즉시 사라짐
```

**메모리 정리**:
```typescript
// 삭제된 아이템의 onValue 리스너도 해제
const unsubscribe = unsubscribers.get(removedKey);
if (unsubscribe) {
  unsubscribe();
  unsubscribers.delete(removedKey);
}
```

**특징**:
- path 전체에 대해 1개의 리스너만 생성
- child_added와 동일한 쿼리 범위 사용
- 메모리 누수 방지를 위해 onValue 리스너도 함께 해제

### 17.4. 실시간 동기화 흐름도

```
┌─────────────────────────────────────────────────────┐
│ DatabaseListView 컴포넌트 마운트                      │
└─────────────────┬───────────────────────────────────┘
                  │
                  ▼
┌─────────────────────────────────────────────────────┐
│ loadInitialData() 실행                              │
│ - Firebase 쿼리로 첫 페이지 로드                     │
│ - items 배열 초기화                                  │
└─────────────────┬───────────────────────────────────┘
                  │
                  ▼
┌─────────────────────────────────────────────────────┐
│ 각 아이템에 onValue 리스너 설정                      │
│ - items.forEach(item => setupItemListener(item))    │
│ - 개별 아이템 변경 감지 시작                         │
└─────────────────┬───────────────────────────────────┘
                  │
                  ▼
┌─────────────────────────────────────────────────────┐
│ setupChildAddedListener() 실행                      │
│ - 신규 노드 생성 감지 시작                           │
│ - 1초 후 리스너 활성화                               │
└─────────────────┬───────────────────────────────────┘
                  │
                  ▼
┌─────────────────────────────────────────────────────┐
│ setupChildRemovedListener() 실행                    │
│ - 노드 삭제 감지 시작                                │
└─────────────────┬───────────────────────────────────┘
                  │
                  ▼
┌─────────────────────────────────────────────────────┐
│ 실시간 동기화 활성화 완료                            │
│                                                      │
│ ┌───────────────────┐  ┌───────────────────┐        │
│ │ 데이터 변경       │  │ 신규 노드 생성    │        │
│ │ → onValue 감지   │  │ → onChildAdded   │        │
│ │ → items 업데이트 │  │ → items에 추가   │        │
│ └───────────────────┘  └───────────────────┘        │
│                                                      │
│         ┌──────────────────────┐                    │
│         │ 노드 삭제             │                    │
│         │ → onChildRemoved     │                    │
│         │ → items에서 제거     │                    │
│         │ → onValue 리스너 해제│                    │
│         └──────────────────────┘                    │
└─────────────────────────────────────────────────────┘
                  │
                  ▼
┌─────────────────────────────────────────────────────┐
│ 컴포넌트 언마운트                                    │
│ - $effect cleanup 실행                              │
│ - 모든 리스너 해제                                   │
│   - childAddedUnsubscribe()                         │
│   - childRemovedUnsubscribe()                       │
│   - unsubscribers.forEach(unsubscribe)              │
└─────────────────────────────────────────────────────┘
```

---

## 18. 메모리 관리 및 정리

메모리 누수는 SPA(Single Page Application)에서 치명적인 문제입니다. DatabaseListView는 철저한 cleanup으로 메모리 누수를 방지합니다.

### 18.1. Cleanup 함수와 $effect

모든 리스너는 `$effect` cleanup 함수에서 해제됩니다.

```typescript
$effect(() => {
  if (path && database) {
    loadInitialData();
  }

  // 🔥 cleanup: 컴포넌트 언마운트 시 실행
  return () => {
    console.log('DatabaseListView: Cleaning up listeners');

    // 1. child_added 리스너 해제
    if (childAddedUnsubscribe) {
      childAddedUnsubscribe();
      childAddedUnsubscribe = null;
    }

    // 2. child_removed 리스너 해제
    if (childRemovedUnsubscribe) {
      childRemovedUnsubscribe();
      childRemovedUnsubscribe = null;
    }

    // 3. 모든 onValue 리스너 해제
    unsubscribers.forEach((unsubscribe) => {
      unsubscribe();
    });
    unsubscribers.clear();

    console.log('DatabaseListView: All listeners cleaned up');
  };
});
```

**cleanup 실행 시점**:
- 컴포넌트 언마운트 (페이지 이동, 컴포넌트 제거)
- `path` prop 변경 (새로운 경로로 변경 시)

### 18.2. unsubscribers Map 관리

`unsubscribers` Map은 모든 `onValue` 리스너의 해제 함수를 추적합니다.

```typescript
// Map 구조
let unsubscribers = new Map<string, () => void>();

// 리스너 추가
unsubscribers.set(itemKey, unsubscribe);

// 리스너 해제
const unsubscribe = unsubscribers.get(itemKey);
if (unsubscribe) {
  unsubscribe();
  unsubscribers.delete(itemKey);
}

// 모든 리스너 해제
unsubscribers.forEach((unsubscribe) => {
  unsubscribe();
});
unsubscribers.clear();
```

**Map 사용 이유**:
- 빠른 조회 (O(1))
- 키 기반 관리로 중복 방지
- 개별 해제 및 전체 해제 모두 지원

### 18.3. 리스너 해제 타이밍

| 시나리오 | 해제 대상 | 해제 시점 |
|---------|----------|----------|
| 컴포넌트 언마운트 | 모든 리스너 | `$effect` cleanup |
| `loadInitialData()` 재실행 | 기존 모든 리스너 | 새 데이터 로드 전 |
| 노드 삭제 감지 | 삭제된 노드의 onValue | onChildRemoved 콜백 |
| path prop 변경 | 모든 리스너 | `$effect` cleanup → 재초기화 |

### 18.4. 메모리 누수 방지 체크리스트

✅ **리스너 등록 시**:
- [ ] 중복 체크 (이미 리스닝 중인지 확인)
- [ ] 해제 함수를 `unsubscribers` Map에 저장
- [ ] 리스너 개수 제한 고려 (페이지 크기 조절)

✅ **컴포넌트 언마운트 시**:
- [ ] childAddedUnsubscribe 호출
- [ ] childRemovedUnsubscribe 호출
- [ ] unsubscribers.forEach(unsubscribe) 호출
- [ ] unsubscribers.clear() 호출

✅ **노드 삭제 시**:
- [ ] items에서 제거
- [ ] 해당 onValue 리스너 해제
- [ ] unsubscribers에서 제거

✅ **초기화 재실행 시**:
- [ ] 기존 리스너 모두 해제
- [ ] unsubscribers.clear() 호출
- [ ] 새 리스너 등록

### 18.5. 메모리 사용량 추정

```
리스너 개수 = (페이지 개수 × pageSize) + 2

예시:
- pageSize = 20
- 3 페이지 로드됨
- items.length = 60

리스너 개수:
- onValue: 60개 (각 아이템마다)
- onChildAdded: 1개
- onChildRemoved: 1개
→ 총 62개
```

**최적화 권장사항**:
- pageSize를 너무 크게 설정하지 마세요 (권장: 10~30)
- 무한 스크롤로 너무 많은 아이템을 로드하지 마세요
- 필요시 "맨 위로" 버튼과 함께 새로고침 제공

---

## 19. 문제 해결 가이드

### 19.1. 정렬이 제대로 안 되는 경우

**증상**:
- 아이템들이 무작위 순서로 표시됨
- orderBy 필드 순서와 화면 순서가 다름
- 특히 문자열 정렬 시 문제 발생

**원인**:
- `Object.entries()` 사용으로 정렬 순서 깨짐
- Firebase 쿼리는 정렬된 순서로 반환하지만, JavaScript 객체로 변환 시 순서 유실

**해결책**:
```typescript
// ❌ 잘못된 코드
const data = snapshot.val();
Object.entries(data).forEach(([key, value]) => {
  items.push({ key, data: value });
});

// ✅ 올바른 코드
snapshot.forEach((childSnapshot) => {
  const key = childSnapshot.key;
  const data = childSnapshot.val();
  if (key) {
    items.push({ key, data });
  }
});
```

**확인 방법**:
- 콘솔 로그 확인: `Items in Firebase order`
- orderBy 필드 값이 순서대로 나오는지 확인

### 19.2. 무한 스크롤이 작동하지 않는 경우

**증상**:
- 스크롤해도 다음 페이지가 로드되지 않음
- hasMore가 true인데도 loadMore가 실행 안 됨

**원인 및 해결책**:

#### 원인 1: 컨테이너 높이 미설정

```css
/* ❌ 잘못된 코드 */
.list-container {
  overflow-y: auto; /* 높이가 없으면 스크롤 안 됨! */
}

/* ✅ 올바른 코드 */
.list-container {
  height: 600px; /* 또는 calc(100vh - 4rem) */
  overflow-y: auto;
}
```

#### 원인 2: scrollContainer 바인딩 누락

```svelte
<!-- ❌ 잘못된 코드 -->
<div class="list-container">
  <DatabaseListView ... />
</div>

<!-- ✅ 올바른 코드 (body 스크롤 사용) -->
<DatabaseListView ... />

<!-- ✅ 올바른 코드 (컨테이너 스크롤 사용) -->
<div class="list-container" style="height: 600px; overflow-y: auto;">
  <DatabaseListView ... />
</div>
```

#### 원인 3: threshold 값이 너무 작음

```svelte
<!-- threshold 값 늘리기 -->
<DatabaseListView threshold={500} ... />
```

**확인 방법**:
- 콘솔 로그 확인: `Near bottom (container scroll)` 또는 `Near bottom (window scroll)`
- hasMore, loading 상태 확인
- scrollHeight, clientHeight 값 확인

### 19.3. 실시간 업데이트가 안 되는 경우

**증상**:
- 다른 사용자가 데이터를 변경해도 화면에 반영 안 됨
- 새 게시글이 작성되어도 리스트에 나타나지 않음
- 삭제된 게시글이 계속 화면에 남아있음

**원인 및 해결책**:

#### 원인 1: Firebase RTDB 대신 Firestore 사용

DatabaseListView는 **Firebase Realtime Database 전용**입니다.

```typescript
// ❌ Firestore는 지원 안 됨
import { getFirestore } from 'firebase/firestore';

// ✅ RTDB 사용
import { getDatabase } from 'firebase/database';
```

#### 원인 2: 리스너 미설정

```typescript
// 초기 로드 완료 후 리스너가 설정되는지 확인
console.log('childAddedUnsubscribe:', childAddedUnsubscribe);
console.log('childRemovedUnsubscribe:', childRemovedUnsubscribe);
console.log('unsubscribers size:', unsubscribers.size);
```

#### 원인 3: orderPrefix 범위 밖

```svelte
<!-- qna- 게시글만 표시 -->
<DatabaseListView orderPrefix="qna-" ... />

<!-- community- 게시글을 추가해도 화면에 안 나타남 (범위 밖) -->
```

**확인 방법**:
- 콘솔 로그 확인:
  - `Setting up child_added listener`
  - `Setting up child_removed listener`
  - `New child added`
  - `Child removed`
- Firebase Console에서 직접 데이터 변경해보기

### 19.4. 메모리 누수 확인 방법

**증상**:
- 페이지를 여러 번 이동한 후 메모리 사용량이 계속 증가
- 브라우저가 느려짐
- 콘솔에서 "detached DOM tree" 경고

**확인 방법**:

#### 1. Chrome DevTools Memory Profiler

1. Chrome DevTools → Performance → Memory
2. "Take heap snapshot" 클릭
3. DatabaseListView 페이지로 이동
4. 다시 "Take heap snapshot" 클릭
5. Comparison 뷰에서 "Detached" 필터

**정상 상태**:
- DatabaseListView 컴포넌트가 detached로 표시되지 않음
- Firebase 리스너가 모두 해제됨

#### 2. 콘솔 로그 확인

```
DatabaseListView: Cleaning up listeners
DatabaseListView: All listeners cleaned up
```

**비정상 상태**:
- cleanup 로그가 출력되지 않음
- 리스너 개수가 계속 증가

#### 3. 수동 테스트

```typescript
// 테스트 코드 (브라우저 콘솔)
let count = 0;
const interval = setInterval(() => {
  console.log('Current listeners:', {
    onValue: unsubscribers.size,
    childAdded: childAddedUnsubscribe ? 'active' : 'inactive',
    childRemoved: childRemovedUnsubscribe ? 'active' : 'inactive'
  });
  count++;
  if (count > 10) clearInterval(interval);
}, 1000);
```

**해결책**:
- `$effect` cleanup 함수 확인
- 모든 리스너가 제대로 해제되는지 확인
- unsubscribers.clear() 호출 확인

### 19.5. orderBy 필드가 없는 아이템이 표시되는 경우

**증상**:
- orderBy로 지정한 필드가 없는 아이템이 리스트에 나타남
- 콘솔에서 "Filtering out item without field" 경고

**원인**:
- 데이터베이스에 orderBy 필드가 없는 노드 존재
- 페이지네이션 시 클라이언트 필터링만으로는 부족

**해결책**:

#### 1. 데이터 정합성 확보

```javascript
// 모든 노드에 orderBy 필드 추가
await update(ref(db, 'posts/post1'), {
  createdAt: Date.now() // orderBy 필드 추가
});
```

#### 2. Firebase Security Rules

```json
{
  "rules": {
    "posts": {
      "$postId": {
        ".validate": "newData.hasChildren(['createdAt', 'title'])"
      }
    }
  }
}
```

#### 3. 클라이언트 검증

```typescript
// 노드 생성 시 필수 필드 확인
async function createPost(data: any) {
  if (!data.createdAt) {
    data.createdAt = Date.now();
  }
  await push(ref(db, 'posts'), data);
}
```

**확인 방법**:
- Firebase Console에서 데이터 구조 확인
- 모든 노드에 orderBy 필드가 있는지 확인
- 콘솔 경고 메시지 확인

---

## 20. 요약 및 베스트 프랙티스

### 20.1. 핵심 개념 요약

| 개념 | 설명 |
|------|------|
| **snapshot.forEach()** | Firebase 정렬 순서를 보존하는 유일한 방법 (Object.entries() 사용 금지) |
| **startAt(false)** | null/undefined 값을 자동으로 필터링 (네트워크 비용 절감) |
| **pageSize + 1** | hasMore 판단을 위해 1개 더 로드 |
| **reverse + limitToLast** | 최신 데이터부터 표시할 때 사용 |
| **orderPrefix** | 특정 prefix로 시작하는 데이터만 필터링 |
| **onValue** | 각 아이템의 실시간 업데이트 감지 (N개) |
| **onChildAdded** | 신규 노드 생성 감지 (1개) |
| **onChildRemoved** | 노드 삭제 감지 (1개) |
| **$effect cleanup** | 모든 리스너를 해제하여 메모리 누수 방지 |
| **unsubscribers Map** | onValue 리스너들을 추적 및 관리 |

### 20.2. 베스트 프랙티스

#### ✅ DO (권장)

1. **항상 snapshot.forEach() 사용**
   ```typescript
   snapshot.forEach((child) => {
     items.push({ key: child.key, data: child.val() });
   });
   ```

2. **orderBy 필드는 모든 노드에 존재해야 함**
   ```javascript
   // 노드 생성 시 자동으로 createdAt 추가
   const newPost = {
     ...data,
     createdAt: data.createdAt || Date.now()
   };
   ```

3. **pageSize는 10~30 사이로 설정**
   ```svelte
   <DatabaseListView pageSize={20} />
   ```

4. **컨테이너 스크롤 사용 시 명시적 높이 설정**
   ```css
   .list-container {
     height: calc(100vh - 4rem);
     overflow-y: auto;
   }
   ```

5. **디버깅 로그 활용**
   - 콘솔에서 색상별 로그 확인
   - 정렬 순서, 필터링 결과 추적

#### ❌ DON'T (비권장)

1. **Object.entries() 절대 사용 금지**
   ```typescript
   // ❌ 정렬이 깨짐!
   Object.entries(snapshot.val()).forEach(...)
   ```

2. **orderBy 필드 없는 노드 생성 금지**
   ```javascript
   // ❌ createdAt 없음
   await push(ref(db, 'posts'), {
     title: 'Test'
   });
   ```

3. **pageSize를 너무 크게 설정 금지**
   ```svelte
   <!-- ❌ 성능 저하 및 메모리 낭비 -->
   <DatabaseListView pageSize={1000} />
   ```

4. **리스너 수동 해제 금지**
   ```typescript
   // ❌ $effect cleanup에서 자동 처리됨
   // unsubscribe();
   ```

5. **reverse 모드에서 limitToFirst 사용 금지**
   ```typescript
   // ❌ 역순일 때는 limitToLast 사용
   if (reverse) {
     query(..., limitToFirst(pageSize)); // 틀림!
   }
   ```

### 20.3. 성능 최적화 팁

1. **index 추가 (Firebase Console)**
   ```json
   {
     "rules": {
       "posts": {
         ".indexOn": ["createdAt", "categoryKey", "order"]
       }
     }
   }
   ```

2. **threshold 값 조절**
   ```svelte
   <!-- 스크롤 반응성 향상 -->
   <DatabaseListView threshold={500} />
   ```

3. **pageSize 최적화**
   - 모바일: 10~15
   - 데스크톱: 20~30

4. **orderPrefix 활용**
   ```svelte
   <!-- 서버 측 필터링으로 네트워크 비용 절감 -->
   <DatabaseListView orderPrefix="community-" />
   ```

### 20.4. 다른 프로젝트에 적용하기

DatabaseListView 컴포넌트를 다른 프로젝트에 재사용하려면:

1. **파일 복사**
   ```
   src/lib/components/DatabaseListView.svelte → 복사
   ```

2. **Firebase 설정 확인**
   ```typescript
   // src/lib/firebase.ts
   export const rtdb = getDatabase(app);
   ```

3. **Props 설정**
   ```svelte
   <DatabaseListView
     path="your-path"
     pageSize={20}
     orderBy="createdAt"
     threshold={300}
   >
     {#snippet item(itemData, index)}
       <!-- 커스텀 UI -->
     {/snippet}
   </DatabaseListView>
   ```

4. **스타일 커스터마이징**
   - 기본 스타일은 컴포넌트 내부에 정의됨
   - item snippet에서 커스텀 스타일 적용

5. **테스트**
   - 초기 로드 확인
   - 무한 스크롤 확인
   - 실시간 업데이트 확인
   - 메모리 누수 확인

---

## 21. DatabaseListView 완전 가이드: Props 및 옵션

### 21.1. 개요

**DatabaseListView는 Firebase Realtime Database의 모든 데이터 목록 표시에 사용할 수 있는 만능 ListView 컴포넌트입니다.**

✅ **핵심 특징**:
- 🔥 **범용성**: 모든 RTDB 노드 목록 표시에 사용 가능
- 🚀 **무한 스크롤**: 자동 페이지네이션으로 대용량 데이터 처리
- ⚡ **실시간 동기화**: onValue, onChildAdded, onChildRemoved 리스너로 실시간 업데이트
- 🎯 **양방향 스크롤**: 위로/아래로 스크롤 모두 지원 (채팅, 일반 목록)
- 🔧 **고도로 커스터마이징 가능**: 다양한 옵션과 snippet으로 모든 UI 커스터마이징
- 📱 **반응형**: Body 스크롤 + Container 스크롤 모두 지원

### 21.2. 전체 Props 레퍼런스

#### 필수 Props

| Prop | 타입 | 기본값 | 설명 |
|------|------|--------|------|
| `path` | `string` | **(필수)** | Firebase RTDB 경로 (예: `"users"`, `"posts"`, `"chat-messages"`) |
| `item` | `Snippet` | **(필수)** | 각 아이템을 렌더링하는 snippet 함수 |

#### 선택적 Props - 데이터 제어

| Prop | 타입 | 기본값 | 설명 |
|------|------|--------|------|
| `pageSize` | `number` | `10` | 한 번에 가져올 아이템 개수 (권장: 10~30) |
| `orderBy` | `string` | `"createdAt"` | 정렬 기준 필드명 |
| `orderPrefix` | `string` | `""` | orderBy 필드 값의 prefix로 필터링 (예: `"community-"`) |
| `equalToValue` | `string \| number \| boolean \| null` | `undefined` | orderBy 필드가 특정 값과 정확히 일치하는 데이터만 조회 (검색 UI에 사용) |
| `reverse` | `boolean` | `false` | 역순 정렬 여부 (`true`면 최신 데이터부터 표시) |

#### 선택적 Props - 스크롤 동작

| Prop | 타입 | 기본값 | 설명 |
|------|------|--------|------|
| `scrollTrigger` | `'top' \| 'bottom'` | `'bottom'` | 스크롤 트리거 방향<br>- `'bottom'`: 아래로 스크롤하여 다음 페이지 로드 (일반 목록)<br>- `'top'`: 위로 스크롤하여 이전 페이지 로드 (채팅 메시지) |
| `autoScrollToEnd` | `boolean` | `false` | 초기 로드 완료 후 자동으로 끝으로 스크롤<br>- `scrollTrigger='bottom'`일 때: 맨 아래로<br>- `scrollTrigger='top'`일 때: 맨 위로 |
| `autoScrollOnNewData` | `boolean` | `false` | **⭐ 채팅 메시지 필수 기능**<br>새 데이터 추가 시 자동 스크롤 여부<br>- 새 노드가 추가될 때 스크롤 위치가 `threshold` 이내면 자동으로 맨 아래로 스크롤<br>- 사용자가 `threshold`보다 많이 스크롤업 한 경우 자동 스크롤하지 않음<br>- **채팅 메시지 목록**과 같은 실시간 피드에 최적화 |
| `threshold` | `number` | `300` | 스크롤 임계값 (픽셀)<br>끝에서 이 거리만큼 떨어지면 다음 페이지 로드<br>- `autoScrollOnNewData`와 함께 사용하여 자동 스크롤 범위 제어 가능 |

#### 선택적 Props - UI Snippets

| Prop | 타입 | 기본값 | 설명 |
|------|------|--------|------|
| `loading` | `Snippet` | 기본 UI | 초기 로딩 상태 UI |
| `empty` | `Snippet` | 기본 UI | 데이터 없음 상태 UI |
| `error` | `Snippet<[string \| null]>` | 기본 UI | 에러 상태 UI (에러 메시지 전달) |
| `loadingMore` | `Snippet` | 기본 UI | 추가 로딩 중 UI (무한 스크롤 로딩) |
| `noMore` | `Snippet` | 기본 UI | 더 이상 데이터 없음 UI |

### 21.3. Props 상세 설명

#### 21.3.1. reverse (역순 정렬)

**사용 사례**: 최신 데이터를 먼저 표시하고 싶을 때

```svelte
<!-- ❌ reverse=false (기본값): 오래된 데이터부터 표시 -->
<DatabaseListView
  path="posts"
  orderBy="createdAt"
  reverse={false}
  pageSize={20}
>
  {#snippet item(itemData)}
    <div>{itemData.data.title}</div>
  {/snippet}
</DatabaseListView>

<!-- 결과: 가장 오래된 게시글 → 최신 게시글 순서 -->
```

```svelte
<!-- ✅ reverse=true: 최신 데이터부터 표시 -->
<DatabaseListView
  path="posts"
  orderBy="createdAt"
  reverse={true}
  pageSize={20}
>
  {#snippet item(itemData)}
    <div>{itemData.data.title}</div>
  {/snippet}
</DatabaseListView>

<!-- 결과: 최신 게시글 → 오래된 게시글 순서 -->
```

**내부 동작**:
- `reverse=false`: `limitToFirst(pageSize)` 사용
- `reverse=true`: `limitToLast(pageSize)` + 배열 reverse 사용

**주의사항**:
- ⚠️ reverse 모드에서는 Firebase가 내부적으로 역순 정렬하므로 추가 처리 필요
- ⚠️ 페이지네이션 커서도 역방향으로 동작

#### 21.3.2. equalToValue (정확 일치 필터)

`equalToValue`는 `orderBy` 필드가 특정 값과 **정확히 일치**하는 레코드만 가져올 때 사용합니다. `orderPrefix`보다 우선하며, 서버 쿼리에서 `equalTo()`를 사용하므로 불필요한 데이터를 내려받지 않습니다.

**특징**
- 검색어가 변경되면 컴포넌트가 즉시 재구독해 해당 값만 실시간으로 추적합니다.
- 정확 일치 조건에서는 한 번의 쿼리로 모든 결과를 가져오며 `loadMore()`가 자동으로 비활성화됩니다.
- 채팅/사용자 검색처럼 결과 건수가 작지만 정확성이 필요한 화면에 최적화되어 있습니다.

**예시: `displayNameLowerCase` 기반 사용자 검색**

```svelte
<DatabaseListView
  path="users"
  pageSize={50}
  orderBy="displayNameLowerCase"
  equalToValue={searchKeyword}   // 이미 소문자로 정규화된 값
>
  {#snippet item(itemData)}
    <UserRow data={itemData.data} />
  {/snippet}
</DatabaseListView>
```

> 📌 이 옵션은 `/user/list` 페이지의 검색 모달에서 사용됩니다. 사용자가 입력한 닉네임을 소문자로 변환해 `equalToValue`로 전달하면 RTDB에서 해당 이름과 완전히 일치하는 사용자만 즉시 표시할 수 있습니다.
> 실제 UI는 `src/lib/components/user/UserSearchDialog.svelte`를 재사용하여 `orderBy="displayNameLowerCase"` + `equalToValue` 조합을 일관되게 캡슐화합니다.

#### 21.3.3. scrollTrigger (스크롤 방향)

**사용 사례별 선택 가이드**:

| UI 타입 | `scrollTrigger` | `autoScrollToEnd` | 설명 |
|---------|-----------------|-------------------|------|
| 일반 목록 (블로그, 게시판) | `'bottom'` | `false` | 아래로 스크롤하여 다음 페이지 로드 |
| 채팅 메시지 (역순) | `'top'` | `true` | 위로 스크롤하여 이전 메시지 로드<br>초기 로드 시 맨 아래로 |
| 타임라인 (역순) | `'bottom'` | `false` | 최신 데이터부터 표시, 아래로 스크롤하여 이전 데이터 로드 |
| 알림 목록 | `'bottom'` | `true` | 최신 알림부터 표시, 로드 완료 시 맨 아래로 |

**예시 1: 일반 게시판 (아래로 스크롤)**

```svelte
<DatabaseListView
  path="posts"
  orderBy="createdAt"
  reverse={false}
  scrollTrigger="bottom"
  autoScrollToEnd={false}
  pageSize={20}
>
  {#snippet item(itemData)}
    <div class="post-card">{itemData.data.title}</div>
  {/snippet}
</DatabaseListView>
```

**동작**:
1. 오래된 게시글부터 표시 (createdAt 오름차순)
2. 사용자가 아래로 스크롤
3. 바닥에서 300px 이내 → 다음 페이지 로드
4. 새로운 게시글이 하단에 추가

**예시 2: 채팅 메시지 (위로 스크롤)**

```svelte
<DatabaseListView
  path="chat-messages"
  orderBy="roomOrder"
  orderPrefix={`-${roomId}-`}
  reverse={false}
  scrollTrigger="top"
  autoScrollToEnd={true}
  pageSize={15}
>
  {#snippet item(itemData)}
    <div class="message-bubble">{itemData.data.text}</div>
  {/snippet}
</DatabaseListView>
```

**동작**:
1. 최신 메시지가 하단에 표시
2. 초기 로드 완료 후 자동으로 맨 아래로 스크롤 (`autoScrollToEnd=true`)
3. 사용자가 위로 스크롤
4. 천장에서 300px 이내 → 이전 페이지 로드
5. 오래된 메시지가 상단에 추가 (스크롤 위치 자동 보존)

#### 21.3.4. autoScrollToEnd (자동 스크롤)

**사용 사례**: 초기 로드 완료 후 특정 위치로 자동 스크롤

```svelte
<!-- 채팅 메시지: 항상 최신 메시지가 보이도록 -->
<DatabaseListView
  path="chat-messages"
  scrollTrigger="top"
  autoScrollToEnd={true}
>
  <!-- 초기 로드 완료 → 자동으로 맨 아래로 스크롤 -->
</DatabaseListView>
```

```svelte
<!-- 알림 목록: 최신 알림을 먼저 보여주기 -->
<DatabaseListView
  path="notifications"
  orderBy="createdAt"
  reverse={true}
  scrollTrigger="bottom"
  autoScrollToEnd={true}
>
  <!-- 초기 로드 완료 → 자동으로 맨 아래로 스크롤 (최신 알림) -->
</DatabaseListView>
```

**동작 시점**:
- 초기 데이터 로드 완료 후 **1회만** 실행
- 이후 페이지네이션 로드 시에는 실행 안 됨

**내부 구현**:
```typescript
if (autoScrollToEnd && initialLoadCompleted && scrollContainerRef) {
  await tick();
  if (scrollTrigger === 'top') {
    scrollContainerRef.scrollTop = 0; // 맨 위로
  } else {
    scrollContainerRef.scrollTop = scrollContainerRef.scrollHeight; // 맨 아래로
  }
}
```

#### 21.3.5. autoScrollOnNewData (새 데이터 추가 시 자동 스크롤) ⭐

**⭐ 채팅 메시지 필수 기능**

**사용 사례**: 실시간으로 새 데이터가 추가될 때 사용자 위치에 따라 자동 스크롤

```svelte
<!-- 채팅 메시지: 새 메시지가 추가될 때 스마트 자동 스크롤 -->
<DatabaseListView
  path={`chat-messages`}
  orderBy="createdAt"
  scrollTrigger="top"
  autoScrollToEnd={true}
  autoScrollOnNewData={true}
  threshold={300}
>
  {#snippet item(itemData)}
    <div class="message-bubble">{itemData.data.text}</div>
  {/snippet}
</DatabaseListView>
```

**동작 원리**:

1. **새 노드가 Firebase에 추가됨** (`onChildAdded` 이벤트 발생)
2. **현재 스크롤 위치 확인**:
   ```typescript
   const distanceFromBottom = scrollHeight - (scrollTop + clientHeight);
   ```
3. **자동 스크롤 여부 판단**:
   - `distanceFromBottom <= threshold` → ✅ 자동으로 맨 아래로 스크롤
   - `distanceFromBottom > threshold` → ❌ 자동 스크롤하지 않음 (사용자가 이전 메시지를 읽는 중)

**사용 시나리오**:

| 시나리오 | 스크롤 위치 | distanceFromBottom | 동작 |
|---------|------------|-------------------|------|
| 사용자가 최신 메시지를 보는 중 | 맨 아래 근처 | 50px | ✅ 자동 스크롤 (새 메시지 즉시 표시) |
| 사용자가 조금 스크롤업 | 맨 아래에서 200px | 200px | ✅ 자동 스크롤 (threshold=300 이내) |
| 사용자가 이전 메시지 읽는 중 | 맨 아래에서 500px | 500px | ❌ 스크롤하지 않음 (읽기 방해 안 함) |

**주요 특징**:

1. **비침해적**: 사용자가 이전 메시지를 읽는 중이면 방해하지 않음
2. **실시간**: 새 메시지가 도착하는 즉시 반응
3. **스마트**: `threshold` 값으로 민감도 조절 가능
4. **채팅 최적화**: 채팅방, 댓글, 알림 등 실시간 피드에 필수

**내부 구현**:
```typescript
// setupChildAddedListener 함수 내부
if (autoScrollOnNewData && scrollContainerRef) {
  const { scrollTop, scrollHeight, clientHeight } = scrollContainerRef;
  const distanceFromBottom = scrollHeight - (scrollTop + clientHeight);

  if (distanceFromBottom <= threshold) {
    // 사용자가 맨 아래 근처에 있으면 자동 스크롤
    tick().then(() => {
      if (scrollContainerRef) {
        scrollContainerRef.scrollTop = scrollContainerRef.scrollHeight;
      }
    });
  }
}
```

**`autoScrollToEnd`와의 차이점**:

| Feature | `autoScrollToEnd` | `autoScrollOnNewData` |
|---------|-------------------|----------------------|
| 실행 시점 | 초기 로드 완료 후 **1회만** | **새 데이터가 추가될 때마다** |
| 조건부 실행 | 없음 (항상 스크롤) | 있음 (threshold 이내일 때만) |
| 사용 목적 | 초기 화면 위치 설정 | 실시간 업데이트 대응 |
| 채팅 사용 예시 | 채팅방 진입 시 최신 메시지 표시 | 대화 중 새 메시지 도착 시 |

**권장 조합**:

```svelte
<!-- 채팅 메시지 완벽한 설정 -->
<DatabaseListView
  path={`chat-messages`}
  orderBy="createdAt"
  scrollTrigger="top"           <!-- 위로 스크롤하여 이전 메시지 로드 -->
  autoScrollToEnd={true}        <!-- 처음 진입 시 최신 메시지로 -->
  autoScrollOnNewData={true}    <!-- 새 메시지 도착 시 스마트 스크롤 -->
  threshold={300}               <!-- 300px 이내면 자동 스크롤 -->
  pageSize={20}
>
  {#snippet item(itemData)}
    <div class="message">{itemData.data.text}</div>
  {/snippet}
</DatabaseListView>
```

#### 21.3.6. threshold (스크롤 임계값)

**최적화 가이드**:

| 디바이스 | 권장 threshold | 이유 |
|----------|----------------|------|
| 모바일 | 200~300px | 작은 화면, 빠른 스크롤 |
| 태블릿 | 300~400px | 중간 화면 크기 |
| 데스크톱 | 400~600px | 큰 화면, 마우스 휠 스크롤 |

```svelte
<!-- 모바일 우선 설정 -->
<DatabaseListView threshold={250} ... />

<!-- 데스크톱 설정 -->
<DatabaseListView threshold={500} ... />
```

**주의사항**:
- ⚠️ threshold가 너무 작으면: 사용자가 바닥에 완전히 닿아야 로드 (사용자 경험 저하)
- ⚠️ threshold가 너무 크면: 너무 일찍 로드되어 불필요한 데이터 전송

#### 21.3.7. orderPrefix (범위 필터링)

**사용 사례**: 특정 카테고리나 룸의 데이터만 표시

```svelte
<!-- 커뮤니티 카테고리의 게시글만 표시 -->
<DatabaseListView
  path="posts"
  orderBy="categoryOrder"
  orderPrefix="community-"
  pageSize={20}
>
  {#snippet item(itemData)}
    <div>{itemData.data.title}</div>
  {/snippet}
</DatabaseListView>
```

**Firebase 쿼리**:
```javascript
query(
  ref(db, 'posts'),
  orderByChild('categoryOrder'),
  startAt('community-'),
  endAt('community-\uf8ff'),
  limitToFirst(20)
)
```

**결과**:
- ✅ `categoryOrder`가 `"community-1234567890"`인 게시글 → 표시됨
- ✅ `categoryOrder`가 `"community-9999999999"`인 게시글 → 표시됨
- ❌ `categoryOrder`가 `"qna-1234567890"`인 게시글 → 표시 안 됨
- ❌ `categoryOrder`가 `"news-1234567890"`인 게시글 → 표시 안 됨

**채팅방 메시지 예시**:
```svelte
<DatabaseListView
  path="chat-messages"
  orderBy="roomOrder"
  orderPrefix={`-${roomId}-`}
  scrollTrigger="top"
  autoScrollToEnd={true}
  pageSize={15}
>
  {#snippet item(itemData)}
    <div>{itemData.data.text}</div>
  {/snippet}
</DatabaseListView>
```

**동작**:
- roomId가 `"single-abc-xyz"`일 때
- `roomOrder` 필드가 `"-single-abc-xyz-1234567890"`인 메시지만 로드
- 다른 채팅방 메시지는 완전히 필터링됨 (서버 측 필터링)

### 21.4. Snippets 상세 가이드

#### 21.4.1. item snippet (필수)

**시그니처**:
```typescript
item: (itemData: { key: string; data: any }, index: number) => any
```

**매개변수**:
- `itemData.key`: Firebase 노드 키 (예: `"-ABC123"`)
- `itemData.data`: Firebase 노드 데이터 객체
- `index`: 배열 내 실제 인덱스 (0부터 시작)

**예시**:
```svelte
<DatabaseListView path="users" pageSize={10}>
  {#snippet item(itemData, index)}
    <div class="user-card">
      <span class="index">#{index + 1}</span>
      <h3>{itemData.data.displayName}</h3>
      <p>UID: {itemData.key}</p>
      <p>Email: {itemData.data.email}</p>
    </div>
  {/snippet}
</DatabaseListView>
```

#### 21.4.2. loading snippet (선택)

**사용 시기**: 초기 데이터 로드 중

```svelte
<DatabaseListView path="users" pageSize={10}>
  {#snippet loading()}
    <div class="loading-spinner">
      <div class="spinner"></div>
      <p>사용자 목록을 불러오는 중...</p>
    </div>
  {/snippet}

  {#snippet item(itemData)}
    <!-- 아이템 UI -->
  {/snippet}
</DatabaseListView>
```

#### 21.4.3. empty snippet (선택)

**사용 시기**: 데이터가 하나도 없을 때

```svelte
<DatabaseListView path="users" pageSize={10}>
  {#snippet empty()}
    <div class="empty-state">
      <img src="/icons/empty-box.svg" alt="Empty" />
      <h3>사용자가 없습니다</h3>
      <p>첫 번째 사용자를 등록해보세요!</p>
      <button>사용자 추가</button>
    </div>
  {/snippet}

  {#snippet item(itemData)}
    <!-- 아이템 UI -->
  {/snippet}
</DatabaseListView>
```

#### 21.4.4. error snippet (선택)

**시그니처**:
```typescript
error: (errorMessage: string | null) => any
```

**사용 시기**: 데이터 로드 중 에러 발생

```svelte
<DatabaseListView path="users" pageSize={10}>
  {#snippet error(errorMessage)}
    <div class="error-state">
      <img src="/icons/error.svg" alt="Error" />
      <h3>데이터 로드 실패</h3>
      <p class="error-message">{errorMessage ?? '알 수 없는 오류'}</p>
      <button onclick={() => location.reload()}>
        다시 시도
      </button>
    </div>
  {/snippet}

  {#snippet item(itemData)}
    <!-- 아이템 UI -->
  {/snippet}
</DatabaseListView>
```

#### 21.4.5. loadingMore snippet (선택)

**사용 시기**: 무한 스크롤로 추가 페이지 로드 중

```svelte
<DatabaseListView path="users" pageSize={10}>
  {#snippet loadingMore()}
    <div class="loading-more">
      <div class="spinner-small"></div>
      <span>더 불러오는 중...</span>
    </div>
  {/snippet}

  {#snippet item(itemData)}
    <!-- 아이템 UI -->
  {/snippet}
</DatabaseListView>
```

**표시 위치**:
- `scrollTrigger='bottom'`: 리스트 하단에 표시
- `scrollTrigger='top'`: 리스트 상단에 표시

#### 21.4.6. noMore snippet (선택)

**사용 시기**: 모든 데이터를 다 로드했을 때 (`hasMore = false`)

```svelte
<DatabaseListView path="users" pageSize={10}>
  {#snippet noMore()}
    <div class="no-more">
      <p>✓ 모든 사용자를 불러왔습니다</p>
    </div>
  {/snippet}

  {#snippet item(itemData)}
    <!-- 아이템 UI -->
  {/snippet}
</DatabaseListView>
```

### 21.5. 사용 사례별 구성 예시

#### 사례 1: 일반 블로그 게시글 목록

```svelte
<DatabaseListView
  path="posts"
  orderBy="createdAt"
  reverse={true}           <!-- 최신 글부터 -->
  scrollTrigger="bottom"   <!-- 아래로 스크롤 -->
  autoScrollToEnd={false}  <!-- 맨 위에서 시작 -->
  pageSize={20}
  threshold={400}
>
  {#snippet item(itemData)}
    <article class="post">
      <h2>{itemData.data.title}</h2>
      <p>{itemData.data.excerpt}</p>
      <time>{new Date(itemData.data.createdAt).toLocaleDateString()}</time>
    </article>
  {/snippet}
</DatabaseListView>
```

#### 사례 2: 채팅 메시지

```svelte
<DatabaseListView
  path="chat-messages"
  orderBy="roomOrder"
  orderPrefix={`-${roomId}-`}  <!-- 특정 룸만 -->
  reverse={false}              <!-- 오래된 메시지부터 로드 -->
  scrollTrigger="top"          <!-- 위로 스크롤하여 이전 메시지 로드 -->
  autoScrollToEnd={true}       <!-- 초기 로드 시 맨 아래로 -->
  pageSize={15}
  threshold={280}
>
  {#snippet item(itemData)}
    <div class="message">
      <span class="sender">{itemData.data.senderName}</span>
      <p>{itemData.data.text}</p>
    </div>
  {/snippet}

  {#snippet loadingMore()}
    <div class="loading-older">이전 메시지 불러오는 중...</div>
  {/snippet}

  {#snippet noMore()}
    <div class="conversation-start">대화의 시작입니다</div>
  {/snippet}
</DatabaseListView>
```

#### 사례 3: 사용자 목록 (검색 가능)

```svelte
<script>
  let searchQuery = $state('');
  const searchPath = $derived(searchQuery ? `users-search/${searchQuery}` : 'users');
</script>

<input type="text" bind:value={searchQuery} placeholder="사용자 검색..." />

{#key searchPath}
  <DatabaseListView
    path={searchPath}
    orderBy="displayNameLowerCase"
    reverse={false}
    scrollTrigger="bottom"
    autoScrollToEnd={false}
    pageSize={15}
    threshold={300}
  >
    {#snippet item(itemData)}
      <div class="user-item">
        <img src={itemData.data.photoUrl} alt="Avatar" />
        <div>
          <h3>{itemData.data.displayName}</h3>
          <p>{itemData.data.email}</p>
        </div>
      </div>
    {/snippet}

    {#snippet empty()}
      <div class="no-results">
        <p>"{searchQuery}" 검색 결과가 없습니다</p>
      </div>
    {/snippet}
  </DatabaseListView>
{/key}
```

#### 사례 4: 알림 목록

```svelte
<DatabaseListView
  path="notifications"
  orderBy="createdAt"
  reverse={true}           <!-- 최신 알림부터 -->
  scrollTrigger="bottom"
  autoScrollToEnd={false}
  pageSize={20}
  threshold={300}
>
  {#snippet item(itemData)}
    {@const isRead = itemData.data.readAt !== null}
    <div class="notification" class:unread={!isRead}>
      <div class="icon">{itemData.data.icon}</div>
      <div class="content">
        <p>{itemData.data.message}</p>
        <time>{formatRelativeTime(itemData.data.createdAt)}</time>
      </div>
      {#if !isRead}
        <span class="badge">New</span>
      {/if}
    </div>
  {/snippet}
</DatabaseListView>
```

---

## 22. Controller API 및 공개 메서드

### 22.1. 개요

DatabaseListView는 부모 컴포넌트에서 제어할 수 있는 **3개의 공개 메서드**를 제공합니다.

```svelte
<script>
  let listView;

  function handleRefresh() {
    listView?.refresh();
  }

  function handleScrollToTop() {
    listView?.scrollToTop();
  }

  function handleScrollToBottom() {
    listView?.scrollToBottom();
  }
</script>

<DatabaseListView
  bind:this={listView}
  path="posts"
  pageSize={20}
>
  <!-- ... -->
</DatabaseListView>

<div class="controls">
  <button onclick={handleRefresh}>새로고침</button>
  <button onclick={handleScrollToTop}>맨 위로</button>
  <button onclick={handleScrollToBottom}>맨 아래로</button>
</div>
```

### 22.2. refresh()

**설명**: 데이터를 처음부터 다시 로드합니다.

**동작**:
1. 기존 모든 리스너 해제 (onValue, onChildAdded, onChildRemoved)
2. items 배열 초기화
3. currentPage를 1로 리셋
4. lastLoadedValue 초기화
5. loadInitialData() 재실행

**사용 사례**:
- 사용자가 "새로고침" 버튼 클릭
- 필터나 정렬 옵션 변경 후 리스트 갱신
- 데이터 생성/수정 후 최신 상태 반영

**예시 1: 새로고침 버튼**

```svelte
<script>
  import DatabaseListView from '$lib/components/DatabaseListView.svelte';

  let listView;

  function handleRefresh() {
    listView?.refresh();
  }
</script>

<div class="page-header">
  <h1>게시글 목록</h1>
  <button onclick={handleRefresh}>
    <icon>🔄</icon> 새로고침
  </button>
</div>

<DatabaseListView
  bind:this={listView}
  path="posts"
  pageSize={20}
>
  {#snippet item(itemData)}
    <div>{itemData.data.title}</div>
  {/snippet}
</DatabaseListView>
```

**예시 2: 게시글 작성 후 자동 새로고침**

```svelte
<script>
  let listView;

  async function handleCreatePost(data) {
    const result = await createPost(data);

    if (result.success) {
      // 새 게시글이 추가되었으므로 리스트 새로고침
      listView?.refresh();

      alert('게시글이 작성되었습니다!');
    }
  }
</script>

<CreatePostForm onsubmit={handleCreatePost} />

<DatabaseListView
  bind:this={listView}
  path="posts"
  pageSize={20}
>
  <!-- ... -->
</DatabaseListView>
```

**주의사항**:
- ⚠️ refresh()는 **모든 데이터를 처음부터 다시 로드**합니다
- ⚠️ 스크롤 위치도 맨 위/맨 아래로 리셋됩니다
- ⚠️ 사용자가 많은 페이지를 로드한 상태에서 refresh()를 호출하면 모든 진행 상황이 사라집니다

### 22.3. scrollToTop()

**설명**: 스크롤을 즉시 맨 위로 이동합니다.

**동작**:
```typescript
scrollContainerRef.scrollTop = 0;
```

**사용 사례**:
- "맨 위로" 버튼 클릭
- 검색 쿼리 변경 후 리스트 상단으로 이동
- 새로운 필터 적용 후 첫 번째 항목 보여주기

**예시 1: 맨 위로 버튼 (Floating Action Button)**

```svelte
<script>
  import { onMount } from 'svelte';

  let listView;
  let showScrollToTop = $state(false);

  // 스크롤 위치에 따라 버튼 표시/숨김
  onMount(() => {
    const container = document.querySelector('.list-container');
    container?.addEventListener('scroll', (e) => {
      showScrollToTop = e.target.scrollTop > 500;
    });
  });

  function handleScrollToTop() {
    listView?.scrollToTop();
  }
</script>

<div class="list-container">
  <DatabaseListView
    bind:this={listView}
    path="posts"
    pageSize={20}
  >
    <!-- ... -->
  </DatabaseListView>
</div>

{#if showScrollToTop}
  <button class="floating-button" onclick={handleScrollToTop}>
    ↑ 맨 위로
  </button>
{/if}

<style>
  .floating-button {
    position: fixed;
    bottom: 2rem;
    right: 2rem;
    padding: 1rem;
    border-radius: 50%;
    background: #1f2937;
    color: white;
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
  }
</style>
```

**예시 2: 검색 후 상단으로 이동**

```svelte
<script>
  let listView;
  let searchQuery = $state('');

  async function handleSearch() {
    listView?.refresh(); // 검색 결과 로드
    await tick();
    listView?.scrollToTop(); // 검색 결과 맨 위로
  }
</script>

<form onsubmit={handleSearch}>
  <input type="text" bind:value={searchQuery} placeholder="검색..." />
  <button type="submit">검색</button>
</form>

<DatabaseListView
  bind:this={listView}
  path="posts"
  pageSize={20}
>
  <!-- ... -->
</DatabaseListView>
```

### 22.4. scrollToBottom()

**설명**: 스크롤을 즉시 맨 아래로 이동합니다.

**동작**:
```typescript
scrollContainerRef.scrollTop = scrollContainerRef.scrollHeight;
```

**사용 사례**:
- "맨 아래로" 버튼 클릭
- 채팅 메시지 전송 후 최신 메시지로 이동
- 새로운 알림 도착 후 최신 알림 표시

**예시 1: 채팅 메시지 전송 후 맨 아래로**

```svelte
<script>
  let listView;
  let messageText = $state('');

  async function handleSendMessage() {
    const result = await sendMessage({
      roomId,
      text: messageText,
      senderUid: authStore.user.uid
    });

    if (result.success) {
      messageText = '';

      // 새 메시지가 추가되었으므로 맨 아래로 스크롤
      await tick();
      listView?.scrollToBottom();
    }
  }
</script>

<DatabaseListView
  bind:this={listView}
  path="chat-messages"
  orderBy="roomOrder"
  orderPrefix={`-${roomId}-`}
  scrollTrigger="top"
  autoScrollToEnd={true}
  pageSize={15}
>
  {#snippet item(itemData)}
    <div class="message">{itemData.data.text}</div>
  {/snippet}
</DatabaseListView>

<form onsubmit={handleSendMessage}>
  <input type="text" bind:value={messageText} placeholder="메시지 입력..." />
  <button type="submit">전송</button>
</form>
```

**예시 2: 스크롤 컨트롤 버튼**

```svelte
<script>
  let listView;
</script>

<div class="list-wrapper">
  <DatabaseListView
    bind:this={listView}
    path="posts"
    pageSize={20}
  >
    <!-- ... -->
  </DatabaseListView>

  <!-- 스크롤 컨트롤 버튼 -->
  <div class="scroll-controls">
    <button onclick={() => listView?.scrollToTop()}>↑</button>
    <button onclick={() => listView?.scrollToBottom()}>↓</button>
  </div>
</div>

<style>
  .list-wrapper {
    position: relative;
  }

  .scroll-controls {
    position: absolute;
    bottom: 1rem;
    right: 1rem;
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
  }

  .scroll-controls button {
    width: 2.5rem;
    height: 2.5rem;
    border-radius: 50%;
    background: #1f2937;
    color: white;
    border: none;
    font-size: 1.2rem;
    cursor: pointer;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.2);
  }

  .scroll-controls button:hover {
    background: #374151;
  }
</style>
```

### 22.5. 공개 메서드 사용 시 주의사항

#### ⚠️ 컴포넌트 마운트 확인

```svelte
<script>
  let listView;

  function handleAction() {
    // ❌ 잘못된 코드: bind:this가 null일 수 있음
    listView.refresh();

    // ✅ 올바른 코드: 옵셔널 체이닝 사용
    listView?.refresh();
  }
</script>
```

#### ⚠️ 비동기 처리

```svelte
<script>
  let listView;

  async function handleAction() {
    // refresh() 후 DOM 업데이트 대기
    listView?.refresh();
    await tick();

    // 이제 스크롤 가능
    listView?.scrollToBottom();
  }
</script>
```

#### ⚠️ Container 스크롤 vs Body 스크롤

```svelte
<!-- Container 스크롤 (정상 작동) -->
<div class="list-container" style="height: 600px; overflow-y: auto;">
  <DatabaseListView bind:this={listView} ... />
</div>

<!-- Body 스크롤 (scrollToTop/Bottom이 작동 안 함!) -->
<DatabaseListView bind:this={listView} ... />
```

**이유**:
- `scrollToTop()`과 `scrollToBottom()`은 `scrollContainerRef`를 제어합니다
- Body 스크롤 모드에서는 `scrollContainerRef`가 `null`입니다
- 따라서 Container 스크롤 모드에서만 이 메서드들이 작동합니다

**해결책**:
```svelte
<script>
  function handleScrollToTop() {
    // Body 스크롤 모드에서는 window를 제어
    if (listView?.scrollToTop) {
      listView.scrollToTop(); // Container 스크롤
    } else {
      window.scrollTo({ top: 0, behavior: 'smooth' }); // Body 스크롤
    }
  }
</script>
```

---

## 23. DatabaseListView 활용: 모든 RTDB 목록 표시의 표준

### 23.1. 핵심 원칙

**🔥 DatabaseListView는 Sonub 프로젝트의 모든 Firebase Realtime Database 데이터 목록 표시에 사용해야 하는 표준 컴포넌트입니다.**

#### ✅ DatabaseListView를 사용해야 하는 모든 경우

| 데이터 타입 | 경로 예시 | 사용 이유 |
|-------------|-----------|-----------|
| 사용자 목록 | `/users` | 무한 스크롤, 실시간 업데이트, 정렬 |
| 게시글 목록 | `/posts` | 카테고리별 필터링, 페이지네이션 |
| 댓글 목록 | `/comments` | 실시간 댓글 추가/삭제 감지 |
| 채팅 메시지 | `/chat-messages` | 양방향 스크롤, 실시간 메시지 동기화 |
| 채팅방 목록 | `/chat-joins/{uid}` | 최근 대화 정렬, 읽지 않은 메시지 표시 |
| 알림 목록 | `/notifications/{uid}` | 최신 알림부터 표시, 실시간 알림 |
| 좋아요 목록 | `/likes/{postId}` | 누가 좋아요 눌렀는지 목록 |
| 팔로워 목록 | `/followers/{uid}` | 팔로워 실시간 추가/제거 |
| 검색 결과 | `/search-results/{query}` | 검색 결과 무한 스크롤 |
| 활동 로그 | `/activity-logs/{uid}` | 사용자 활동 히스토리 |

#### ❌ DatabaseListView를 사용하지 말아야 하는 경우

| 상황 | 이유 | 대안 |
|------|------|------|
| 단일 노드 조회 | 목록이 아닌 하나의 데이터 | `onValue(ref(db, path))` 직접 사용 |
| 고정된 적은 데이터 (< 10개) | 무한 스크롤 불필요 | `onValue()` + `$state` 배열 |
| Firestore 데이터 | RTDB 전용 컴포넌트 | Firestore 전용 ListView 필요 |
| 서버 API 데이터 | Firebase가 아님 | 일반 fetch + 페이지네이션 |

### 23.2. 프로젝트 전반의 일관성 확보

**목적**: 모든 개발자가 동일한 패턴으로 목록 UI를 구현하여 코드 일관성과 유지보수성을 확보합니다.

#### 일관된 패턴의 장점

1. **코드 재사용성**
   ```svelte
   <!-- 사용자 목록 -->
   <DatabaseListView path="users" ... />

   <!-- 게시글 목록 -->
   <DatabaseListView path="posts" ... />

   <!-- 댓글 목록 -->
   <DatabaseListView path="comments" ... />
   ```
   → 동일한 컴포넌트로 모든 목록 구현

2. **실시간 동기화 자동 처리**
   - onValue, onChildAdded, onChildRemoved 리스너 자동 관리
   - 메모리 누수 방지 (자동 cleanup)
   - 다른 사용자의 변경사항 즉시 반영

3. **성능 최적화**
   - 자동 페이지네이션
   - 서버 측 필터링 (orderPrefix)
   - 효율적인 쿼리 (startAt, limitToFirst/Last)

4. **개발 속도 향상**
   - 무한 스크롤 구현 불필요
   - 리스너 관리 불필요
   - UI 상태 관리 자동화

### 23.3. 프로젝트별 구현 예시

#### 예시 1: 사용자 목록 페이지

**소스 코드 위치**: [repository/src/routes/user/list/+page.svelte.md](./repository/src/routes/user/list/+page.svelte.md)

```svelte
<script>
  import DatabaseListView from '$lib/components/DatabaseListView.svelte';
  import Avatar from '$lib/components/user/avatar.svelte';
  import { goto } from '$app/navigation';

  function goToProfile(uid) {
    goto(`/user/profile/${uid}`);
  }

  function goToChat(uid) {
    goto(`/chat/room?uid=${uid}`);
  }
</script>

<svelte:head>
  <title>사용자 목록</title>
</svelte:head>

<div class="page-container">
  <h1>전체 사용자</h1>

  <DatabaseListView
    path="users"
    orderBy="createdAt"
    reverse={true}
    scrollTrigger="bottom"
    pageSize={15}
    threshold={300}
  >
    {#snippet item(itemData)}
      {@const user = itemData.data}
      <div class="user-card">
        <Avatar uid={itemData.key} size={64} />
        <div class="user-info">
          <h3>{user.displayName || '익명'}</h3>
          <p>{user.email || 'No email'}</p>
        </div>
        <div class="actions">
          <button onclick={() => goToProfile(itemData.key)}>
            프로필
          </button>
          <button onclick={() => goToChat(itemData.key)}>
            채팅
          </button>
        </div>
      </div>
    {/snippet}

    {#snippet loading()}
      <div class="loading">사용자 목록을 불러오는 중...</div>
    {/snippet}

    {#snippet empty()}
      <div class="empty">아직 등록된 사용자가 없습니다.</div>
    {/snippet}

    {#snippet error(errorMessage)}
      <div class="error">
        <p>오류 발생: {errorMessage}</p>
        <button onclick={() => location.reload()}>다시 시도</button>
      </div>
    {/snippet}
  </DatabaseListView>
</div>
```

#### 예시 2: 채팅방 목록 (chat-joins)

**소스 코드 위치**: [repository/src/routes/chat/list/+page.svelte.md](./repository/src/routes/chat/list/+page.svelte.md)

```svelte
<script>
  import { authStore } from '$lib/stores/auth.svelte';
  import DatabaseListView from '$lib/components/DatabaseListView.svelte';
  import Avatar from '$lib/components/user/avatar.svelte';
  import { goto } from '$app/navigation';
  import { formatLongDate } from '$lib/functions/date.functions';

  const myUid = $derived(authStore.user?.uid ?? '');

  function openChatRoom(roomId) {
    goto(`/chat/room?roomId=${roomId}`);
  }
</script>

<svelte:head>
  <title>채팅 목록</title>
</svelte:head>

<div class="page-container">
  <h1>내 채팅방</h1>

  <DatabaseListView
    path={`chat-joins/${myUid}`}
    orderBy="listOrder"
    reverse={false}
    scrollTrigger="bottom"
    pageSize={20}
    threshold={300}
  >
    {#snippet item(itemData)}
      {@const room = itemData.data}
      {@const isUnread = room.listOrder?.startsWith('200')}
      <div
        class="chat-room-card"
        class:unread={isUnread}
        onclick={() => openChatRoom(room.roomId)}
      >
        <Avatar uid={room.partnerUid} size={56} />
        <div class="room-info">
          <div class="room-header">
            <h3>{room.partnerUid || '알 수 없음'}</h3>
            {#if isUnread}
              <span class="badge">{room.newMessageCount || 0}</span>
            {/if}
          </div>
          <p class="last-message">{room.lastMessageText || ''}</p>
          <time>{formatLongDate(room.lastMessageAt)}</time>
        </div>
      </div>
    {/snippet}

    {#snippet loading()}
      <div class="loading">채팅방 목록을 불러오는 중...</div>
    {/snippet}

    {#snippet empty()}
      <div class="empty">
        <p>아직 채팅방이 없습니다.</p>
        <a href="/user/list">사용자 목록에서 대화를 시작하세요</a>
      </div>
    {/snippet}
  </DatabaseListView>
</div>
```

#### 예시 3: 게시글 목록 (카테고리별 필터링)

**소스 코드 위치**: [repository/src/routes/forum/[category]/+page.svelte.md](./repository/src/routes/forum/[category]/+page.svelte.md)

```svelte
<script>
  import { page } from '$app/stores';
  import DatabaseListView from '$lib/components/DatabaseListView.svelte';
  import { goto } from '$app/navigation';

  const category = $derived($page.params.category ?? 'all');
  const categoryPrefix = $derived(category === 'all' ? '' : `${category}-`);

  function goToPost(postId) {
    goto(`/forum/post/${postId}`);
  }
</script>

<svelte:head>
  <title>{category} 게시판</title>
</svelte:head>

<div class="page-container">
  <h1>{category} 게시판</h1>

  {#key categoryPrefix}
    <DatabaseListView
      path="posts"
      orderBy="categoryOrder"
      orderPrefix={categoryPrefix}
      reverse={true}
      scrollTrigger="bottom"
      pageSize={20}
      threshold={400}
    >
      {#snippet item(itemData)}
        {@const post = itemData.data}
        <article
          class="post-card"
          onclick={() => goToPost(itemData.key)}
        >
          <h2>{post.title}</h2>
          <p class="excerpt">{post.excerpt || ''}</p>
          <div class="meta">
            <span class="author">{post.authorName}</span>
            <span class="date">
              {new Date(post.createdAt).toLocaleDateString()}
            </span>
            <span class="views">조회 {post.views || 0}</span>
          </div>
        </article>
      {/snippet}

      {#snippet loading()}
        <div class="loading">게시글을 불러오는 중...</div>
      {/snippet}

      {#snippet empty()}
        <div class="empty">
          <p>아직 게시글이 없습니다.</p>
          <button onclick={() => goto('/forum/new')}>
            첫 게시글 작성하기
          </button>
        </div>
      {/snippet}

      {#snippet loadingMore()}
        <div class="loading-more">더 불러오는 중...</div>
      {/snippet}

      {#snippet noMore()}
        <div class="no-more">모든 게시글을 불러왔습니다</div>
      {/snippet}
    </DatabaseListView>
  {/key}
</div>
```

### 23.4. 개발 가이드라인

#### 체크리스트: DatabaseListView 사용 전 확인사항

- [ ] **Firebase RTDB 데이터인가?** (Firestore가 아닌지 확인)
- [ ] **목록 형태의 데이터인가?** (단일 노드가 아닌지 확인)
- [ ] **10개 이상의 아이템이 예상되는가?** (무한 스크롤이 필요한지 확인)
- [ ] **orderBy 필드가 모든 노드에 존재하는가?** (정렬 기준 필드 확인)
- [ ] **실시간 동기화가 필요한가?** (다른 사용자의 변경사항 반영 필요 여부)

#### 구현 단계

1. **데이터 구조 확인**
   ```
   /users
     /-ABC123
       displayName: "홍길동"
       email: "hong@example.com"
       createdAt: 1234567890 ← orderBy 필드 필수!
     /-ABC124
       ...
   ```

2. **컴포넌트 임포트**
   ```svelte
   <script>
     import DatabaseListView from '$lib/components/DatabaseListView.svelte';
   </script>
   ```

3. **Props 설정**
   - path: Firebase RTDB 경로
   - orderBy: 정렬 기준 필드
   - reverse: 최신 데이터부터 표시할지 여부
   - scrollTrigger: 'top' (채팅) vs 'bottom' (일반 목록)
   - orderPrefix: 카테고리 필터링 필요 시
   - pageSize: 10~30 권장

4. **item snippet 작성**
   ```svelte
   {#snippet item(itemData, index)}
     <div class="item">
       <!-- UI 구현 -->
     </div>
   {/snippet}
   ```

5. **선택적 snippets 추가**
   - loading: 로딩 UI
   - empty: 빈 상태 UI
   - error: 에러 UI

### 23.5. 일반적인 실수와 해결책

#### 실수 1: orderBy 필드가 없는 노드

```javascript
// ❌ 잘못된 데이터 구조
{
  "users": {
    "-ABC123": {
      "displayName": "홍길동"
      // createdAt 없음!
    }
  }
}

// ✅ 올바른 데이터 구조
{
  "users": {
    "-ABC123": {
      "displayName": "홍길동",
      "createdAt": 1234567890
    }
  }
}
```

**해결책**: Firebase Cloud Functions로 자동 생성
```typescript
// firebase/functions/src/handlers/user.handler.ts
export async function handleUserCreate(uid: string, userData: UserData) {
  if (!userData.createdAt) {
    await update(ref(db, `users/${uid}`), {
      createdAt: Date.now()
    });
  }
}
```

#### 실수 2: reverse 모드 오해

```svelte
<!-- ❌ 잘못된 이해: reverse=true면 limitToFirst 사용? -->
<DatabaseListView
  orderBy="createdAt"
  reverse={true}
  <!-- 내부적으로 limitToLast + 배열 reverse 사용함! -->
/>
```

**올바른 이해**: reverse는 내부적으로 Firebase 쿼리 방향을 자동 전환합니다.

#### 실수 3: Container 높이 미설정

```svelte
<!-- ❌ 스크롤 안 됨 -->
<div class="list-container">
  <DatabaseListView path="users" ... />
</div>

<style>
  .list-container {
    overflow-y: auto; /* 높이가 없어서 스크롤 안 됨! */
  }
</style>

<!-- ✅ 올바른 코드 -->
<div class="list-container">
  <DatabaseListView path="users" ... />
</div>

<style>
  .list-container {
    height: calc(100vh - 4rem); /* 높이 필수! */
    overflow-y: auto;
  }
</style>
```

#### 실수 4: orderPrefix 타입 불일치

```javascript
// orderBy 필드 예시
{
  "posts": {
    "-ABC123": {
      "order": "community-1234567890" // 문자열 타입
    }
  }
}
```

```svelte
<!-- ❌ orderPrefix에 숫자 전달 -->
<DatabaseListView
  orderBy="order"
  orderPrefix={1234567890}
/>

<!-- ✅ 문자열로 전달 -->
<DatabaseListView
  orderBy="order"
  orderPrefix="community-"
/>
```

### 23.6. 요약

**DatabaseListView는 Sonub 프로젝트의 모든 Firebase Realtime Database 목록 표시의 표준입니다.**

✅ **사용해야 하는 모든 경우**:
- 사용자 목록, 게시글 목록, 댓글 목록
- 채팅 메시지, 채팅방 목록, 알림 목록
- 좋아요 목록, 팔로워 목록, 검색 결과
- 활동 로그, 히스토리 등 모든 RTDB 목록

✅ **장점**:
- 무한 스크롤 자동 처리
- 실시간 동기화 자동 처리 (onValue, onChildAdded, onChildRemoved)
- 메모리 누수 방지 (자동 cleanup)
- 코드 일관성 및 재사용성 극대화
- 개발 속도 향상

✅ **필수 확인사항**:
- orderBy 필드가 모든 노드에 존재
- 컨테이너 스크롤 사용 시 명시적 높이 설정
- pageSize는 10~30 권장

---

## 24. 참고 자료

### 24.1. 관련 파일

- **컴포넌트**: [src/lib/components/DatabaseListView.svelte](./repository/src/lib/components/DatabaseListView.svelte)
- **사용자 목록**: [src/routes/user/list/+page.svelte](./repository/src/routes/user/list/+page.svelte)
- **테스트 페이지**: [src/routes/dev/test/database-list-view/+page.svelte](./repository/src/routes/dev/test/database-list-view/+page.svelte)
- **테스트 사양**: [sonub-test-database-list-view.md](./sonub-test-database-list-view.md)

### 24.2. Firebase 공식 문서

- [Firebase Realtime Database - Query Data](https://firebase.google.com/docs/database/web/lists-of-data)
- [Firebase Realtime Database - Sorting and Filtering](https://firebase.google.com/docs/database/web/lists-of-data#sorting_and_filtering_data)
- [Firebase Realtime Database - Pagination](https://firebase.google.com/docs/database/web/lists-of-data#filtering_data)

### 24.3. Svelte 공식 문서

- [Svelte 5 - Runes](https://svelte.dev/docs/svelte/$state)
- [Svelte 5 - $effect](https://svelte.dev/docs/svelte/$effect)
- [Svelte 5 - Snippets](https://svelte.dev/docs/svelte/snippet)

### 24.4. 버전 히스토리

| 날짜 | 버전 | 변경사항 |
|------|------|----------|
| 2025-11-09 | 1.0.0 | Custom Elements → Svelte 5 마이그레이션 |
| 2025-11-09 | 1.1.0 | orderBy 필드 필터링 추가 |
| 2025-11-09 | 1.2.0 | snapshot.forEach() 적용으로 정렬 문제 해결 |
| 2025-11-09 | 1.3.0 | 색상별 디버깅 로그 시스템 추가 |
| 2025-11-09 | 1.4.0 | 실제 인덱스 전달 기능 추가 (snippet에 index 파라미터) |
| 2025-11-09 | 2.0.0 | 종합 문서화 완료 (SED 형식) |
| 2025-11-11 | 3.0.0 | 전체 Props, Controller API, 범용 사용 가이드 추가 |
| 2025-11-11 | 3.1.0 | `equalToValue` 기반 정확 일치 필터와 사용자 검색 예시 추가 |
| 2025-11-12 | 3.2.0 | `UserSearchDialog` 공용 컴포넌트 도입을 명시하고 `/user/list` 검색 UX 재사용 지침을 추가 |
| 2025-11-13 | 4.0.0 | **orderBy 필드 변경 감지 및 자동 재정렬 기능 추가** |
