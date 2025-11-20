---
name: sonub-forum-overview
title: 게시판 기능 개요
version: 1.0.0
description: 채팅 시스템과 통합된 게시판 기능의 아키텍처 및 구현 사양
author: JaeHo Song
email: thruthesky@gmail.com
homepage: https://github.com/thruthesky/
license: GPL-3.0
dependencies:
  - sonub-chat-overview.md
  - sonub-firebase-database-structure.md
  - sonub-firebase-database-list-view.md
tags:
  - forum
  - board
  - post
  - category
  - chat-integration
  - firebase-rtdb
step: 21
priority: "***"
---

- [워크플로우](#워크플로우)
  - [📋 문서의 범위](#-문서의-범위)
  - [🎯 핵심 설계 개념](#-핵심-설계-개념)
  - [게시판과 채팅의 관계](#게시판과-채팅의-관계)
- [개요](#개요)
- [게시판 아키텍처](#게시판-아키텍처)
  - [통합 설계 원칙](#통합-설계-원칙)
  - [메시지 타입 기반 구분](#메시지-타입-기반-구분)
- [게시판 카테고리](#게시판-카테고리)
  - [카테고리 정의](#카테고리-정의)
  - [카테고리 확장](#카테고리-확장)
- [게시글 작성](#게시글-작성)
  - [작성 흐름](#작성-흐름)
  - [필수 필드](#필수-필드)
  - [Cloud Functions 자동 처리](#cloud-functions-자동-처리)
- [게시글 조회](#게시글-조회)
  - [카테고리별 조회](#카테고리별-조회)
  - [전체 게시글 조회](#전체-게시글-조회)
  - [특정 채팅방 게시글 조회](#특정-채팅방-게시글-조회)
- [게시글 데이터 구조](#게시글-데이터-구조)
  - [기본 필드](#기본-필드)
  - [Order 필드](#order-필드)
  - [자동 생성 필드](#자동-생성-필드)
- [게시판 UI 구조](#게시판-ui-구조)
  - [게시판 메인 페이지](#게시판-메인-페이지)
  - [카테고리 페이지](#카테고리-페이지)
  - [게시글 작성 페이지](#게시글-작성-페이지)
  - [게시글 상세 페이지](#게시글-상세-페이지)
- [게시판과 채팅의 차이점](#게시판과-채팅의-차이점)
  - [UI 표시 방식](#ui-표시-방식)
  - [조회 쿼리](#조회-쿼리)
  - [작성 방식](#작성-방식)
- [댓글 시스템](#댓글-시스템)
  - [댓글 구조](#댓글-구조)
  - [대댓글 (답글)](#대댓글-답글)
  - [댓글 정렬](#댓글-정렬)
- [좋아요 시스템](#좋아요-시스템)
  - [좋아요 데이터 구조](#좋아요-데이터-구조)
  - [좋아요 개수 관리](#좋아요-개수-관리)
- [신고 시스템](#신고-시스템)
  - [신고 사유](#신고-사유)
  - [신고 처리](#신고-처리)
- [게시판 통계](#게시판-통계)
  - [카테고리별 통계](#카테고리별-통계)
  - [전체 통계](#전체-통계)
- [구현 예시](#구현-예시)
  - [게시글 목록 컴포넌트](#게시글-목록-컴포넌트)
  - [게시글 작성 컴포넌트](#게시글-작성-컴포넌트)
- [향후 개발 항목](#향후-개발-항목)
- [관련 문서](#관련-문서)
- [작업 이력 (SED Log)](#작업-이력-sed-log)

---

## 워크플로우

### 📋 문서의 범위

본 문서는 **채팅 시스템과 통합된 게시판 기능의 아키텍처와 구현 방법**을 제공합니다.

- ✅ **포함되는 내용**:
  - 게시판과 채팅의 통합 구조
  - 게시판 카테고리 정의 및 확장 방법
  - 게시글 작성, 조회, 정렬 메커니즘
  - categoryOrder 필드 활용 전략
  - 게시판 UI 구조 및 컴포넌트
  - 댓글, 좋아요, 신고 시스템

- ❌ **포함되지 않는 내용**:
  - 채팅 메시지 시스템 상세 (별도 문서 참고)
  - Firebase 데이터베이스 보안 규칙 상세
  - Cloud Functions 구현 코드

**관련 문서:**
- [채팅 및 게시판 통합 시스템 개요](sonub-chat-overview.md) - 전체 아키텍처 이해
- [Firebase 데이터베이스 구조](sonub-firebase-database-structure.md) - 데이터 필드 상세
- [DatabaseListView 컴포넌트](sonub-firebase-database-list-view.md) - 목록 조회 구현

### 🎯 핵심 설계 개념

1. **게시판 = 채팅**: 게시판 기능이 채팅 시스템에 완전히 통합되어 있음
2. **메시지 타입 구분**: `type: "post"` 메시지가 게시글, `type: "message"`가 일반 채팅
3. **카테고리 기반 정렬**: `categoryOrder` 필드로 카테고리별 효율적 조회
4. **단일 데이터 소스**: 모든 메시지(채팅+게시글)가 `/chat-messages/{messageId}`에 저장
5. **조회 방식 차별화**: 동일한 데이터를 채팅 목록 또는 게시판 목록으로 다르게 표시

### 📝 중요 용어 정의

> **🔥 반드시 기억해야 할 핵심 개념 🔥**

- **게시글** = **Posts 노드에 저장** (`/posts/{postId}`)
  - 게시판의 게시글은 `/posts/{postId}` 경로에 독립적으로 저장됩니다.
  - 게시글은 `category` 필드를 포함하며, 카테고리별로 조회 가능합니다.
  - 즉, "게시글을 조회한다" = "/posts 노드에서 카테고리가 있는 게시글을 조회한다"

- **최근 글** = **allCategoryOrder를 역순으로 정렬한 것**
  - 최근 등록된 게시글 = `orderBy('allCategoryOrder')` + `reverse={true}` 쿼리
  - `allCategoryOrder`는 Cloud Functions에서 자동 생성되는 타임스탬프 값
  - 역순 정렬(`reverse={true}`)로 최신 게시글이 먼저 표시됨

- **카테고리별 게시글** = **categoryOrder를 역순으로 정렬한 것**
  - 특정 카테고리 게시글 = `orderBy('categoryOrder')` + `orderPrefix='{category}-'` + `reverse={true}` 쿼리
  - `categoryOrder` 형식: `"{category}-{timestamp}"` (예: `"discussion-1698473000000"`)
  - 역순 정렬로 해당 카테고리의 최신 게시글이 먼저 표시됨

### 게시판과 채팅의 관계

```mermaid
flowchart LR
    User([사용자]) --> Write{메시지 작성}

    Write -->|간단한 대화| Chat["일반 채팅 메시지<br/>type: message<br/>제목 없음"]
    Write -->|구조화된 글| Forum["게시글 형식 메시지<br/>type: post<br/>제목, 카테고리 포함"]

    Chat --> DB[("/chat-messages<br/>단일 데이터 소스")]
    Forum --> DB

    DB --> View1["채팅 목록<br/>roomOrder 정렬<br/>모든 메시지 표시"]
    DB --> View2["게시판 목록<br/>categoryOrder 정렬<br/>type: post만 표시"]

    style Chat fill:#e3f2fd
    style Forum fill:#fff3e0
    style DB fill:#f3e5f5
    style View1 fill:#e8f5e9
    style View2 fill:#fff9c4
```

---

## 개요

Sonub의 게시판 기능은 **채팅 시스템과 완전히 통합**되어 있습니다. 별도의 게시판 데이터베이스나 테이블이 존재하지 않으며, 모든 게시글은 채팅 메시지의 특수한 형태(`type: "post"`)로 저장됩니다.

**핵심 특징:**
- 📝 **채팅방 = 게시판**: 모든 채팅방에서 게시글 작성 가능
- 🏷️ **카테고리 기반 분류**: community, qna, news, market 등 카테고리로 게시글 구분
- 🔄 **실시간 동기화**: Firebase RTDB를 통한 실시간 게시글 업데이트
- 📊 **효율적 조회**: categoryOrder 필드로 카테고리별 빠른 정렬 및 페이지네이션
- 💬 **통합 댓글**: 게시글에 댓글 작성 시 채팅 메시지로 저장되어 실시간 반영

---

## 게시판 아키텍처

### 통합 설계 원칙

게시판은 채팅 시스템의 확장으로 설계되었으며, 다음 원칙을 따릅니다:

1. **독립적인 게시글 저장소**
   - 게시글은 `/posts/{postId}` 경로에 저장
   - 채팅 메시지는 `/chat-messages/{messageId}` 경로에 저장
   - 각각 독립적인 데이터 구조를 가지며, 필요 시 상호 참조

2. **독립된 경로로 구분**
   - `/chat-messages/{messageId}` → 일반 채팅 메시지
   - `/posts/{postId}` → 게시글
   - 각각 다른 경로와 구조를 가짐

3. **Order 필드 기반 정렬**
   - `roomOrder`: 채팅방별 메시지 정렬
   - `categoryOrder`: 게시판 카테고리별 정렬
   - Cloud Functions에서 자동 생성

4. **최소 정보 저장**
   - 클라이언트: 기본 정보만 저장 (title, category, text, senderUid)
   - Cloud Functions: 추가 메타데이터 자동 생성

### 메시지 타입 기반 구분

| 필드 | type: "message" | type: "post" |
|------|----------------|--------------|
| **text** | ✅ 필수 (메시지 내용) | ✅ 필수 (게시글 본문) |
| **title** | ❌ 없음 | ✅ 필수 (게시글 제목) |
| **category** | ❌ 없음 | ✅ 필수 (게시판 카테고리) |
| **categoryOrder** | ❌ 없음 | ✅ 자동 생성 |
| **roomOrder** | ✅ 자동 생성 | ✅ 자동 생성 |
| **표시 위치** | 채팅 목록 | 채팅 목록 + 게시판 목록 |

---

## 게시판 카테고리

### 카테고리 정의

게시판 카테고리는 `shared/categories.ts`에 상수로 정의되어 있으며, 클라이언트와 서버에서 공유됩니다:

```typescript
export const FORUM_CATEGORIES = [
  "discussion",
  "qna",
  "news",
  "info",
  "selling",
  "hiring",
  "travel",
  "mukbang",
  "realestate",
  "hobby",
  "story",
] as const;
export type ForumCategory = (typeof FORUM_CATEGORIES)[number];
```

**카테고리 설명:**

| 카테고리 ID | 한글 이름 | 영문 이름 | 일본어 | 중국어 | 설명 |
|------------|---------|----------|-------|-------|------|
| `discussion` | 자유토론 | Free Discussion | 自由討論 | 自由讨论 | 자유로운 주제의 토론 게시판 |
| `qna` | 질문 | Q&A | 質問 | 提问 | 질문과 답변 게시판 |
| `news` | 뉴스 | News | ニュース | 新闻 | 뉴스 및 소식 |
| `info` | 정보 | Information | 情報 | 信息 | 유용한 정보 공유 |
| `selling` | 판매 | For Sale | 販売 | 销售 | 물품 판매 게시판 |
| `hiring` | 구인구직 | Jobs | 求人 | 招聘 | 구인/구직 정보 |
| `travel` | 여행 | Travel | 旅行 | 旅游 | 여행 정보 및 후기 |
| `mukbang` | 먹방 | Food & Dining | グルメ | 美食 | 음식 및 맛집 정보 |
| `realestate` | 부동산 | Real Estate | 不動産 | 房地产 | 부동산 정보 |
| `hobby` | 취미 | Hobbies | 趣味 | 兴趣爱好 | 취미 활동 공유 |
| `story` | 나의 이야기 | My Story | 私の物語 | 我的故事 | 개인 경험과 에피소드를 공유하는 공간 |

### 카테고리 확장

새로운 카테고리를 추가하려면:

1. **`shared/categories.ts` 파일 수정**:
   ```typescript
   export const FORUM_CATEGORIES = [
     "discussion",
     "qna",
     "news",
     "info",
     "selling",
     "hiring",
     "travel",
     "mukbang",
     "realestate",
     "hobby",
     "photo"  // 새 카테고리 추가
   ] as const;
   ```

2. **다국어 메시지 추가** (`messages/*.json`):
   ```json
   // messages/ko.json
   {
     "카테고리_photo": "사진"
   }

   // messages/en.json
   {
     "카테고리_photo": "Photo"
   }

   // messages/ja.json, zh.json도 동일하게 추가
   ```

3. **Cloud Functions 재배포**:
   ```bash
   cd firebase/functions
   npm run deploy
   ```

4. **UI에 카테고리 추가**:
   - 카테고리 드롭다운은 `FORUM_CATEGORIES` 배열을 자동으로 읽어 표시
   - 추가 UI 변경 불필요 (자동 반영됨)

---

## 게시글 작성

### 작성 흐름

```mermaid
sequenceDiagram
    actor User as 사용자
    participant UI as 게시글 작성 UI
    participant Client as 클라이언트
    participant RTDB as Firebase RTDB
    participant CF as Cloud Functions

    User->>UI: 게시글 작성 버튼 클릭
    UI->>UI: 모달 다이얼로그 열기
    User->>UI: 카테고리 선택
    User->>UI: 제목 입력
    User->>UI: 본문 작성
    User->>UI: 첨부 파일 업로드 (선택)
    User->>UI: 저장 버튼 클릭

    UI->>Client: 게시글 데이터 생성
    Client->>RTDB: /posts/{postId} 저장<br/>(category, text, authorUid, roomId, createdAt)

    RTDB-->>CF: onValueCreated 트리거
    CF->>CF: categoryOrder 생성<br/>"{category}-{-timestamp}"
    CF->>CF: allCategoryOrder 생성
    CF->>RTDB: 자동 생성 필드 저장

    RTDB-->>Client: 저장 완료
    Client->>UI: 게시글 상세 페이지로 이동
    UI->>User: 게시글 표시
```

### 필수 필드

클라이언트가 `/posts/{postId}`에 저장해야 하는 필수 필드:

```typescript
{
  category: "discussion",          // 카테고리 (필수)
  text: "게시글 본문 내용",        // 본문 (필수)
  authorUid: "작성자UID",          // 작성자 UID (필수)
  roomId: "post",                  // 게시글 전용 roomId (기본값: "post")
  urls: {0: "https://..."},        // 첨부 파일 URL 객체 (선택)
  createdAt: Date.now(),           // 생성 시간 (필수)
}
```

**❌ 클라이언트가 저장하지 말아야 할 필드:**
- `categoryOrder` - Cloud Functions에서 자동 생성
- `allCategoryOrder` - Cloud Functions에서 자동 생성
- `likeCount`, `commentCount`, `totalChildCount` - Cloud Functions에서 자동 관리

### Cloud Functions 자동 처리

게시글 생성 시 Cloud Functions는 다음을 자동으로 처리합니다:

1. **categoryOrder 필드 생성**:
   ```typescript
   categoryOrder = `${category}-${timestamp}`;
   // 예: "discussion-1698473000000"
   ```

2. **allCategoryOrder 필드 생성**:
   ```typescript
   allCategoryOrder = timestamp;
   // 예: 1698473000000
   // 모든 카테고리의 게시글을 통합 조회할 때 사용
   ```

3. **type 필드 생성**:
   ```typescript
   type = "post";
   // 게시글 타입 표시 (일반 채팅 메시지와 구분)
   ```

4. **roomOrder 필드 생성**:
   ```typescript
   roomOrder = `-${roomId}-${timestamp}`;
   // 예: "-roomId123-1698473000000"
   ```

5. **타임스탬프 추가**:
   ```typescript
   createdAt = Date.now();
   ```

5. **카테고리 통계 업데이트** (향후 구현):
   ```typescript
   /forum-stats/{category}/postCount++
   ```

---

## 게시글 조회

### 카테고리별 조회

특정 카테고리의 게시글만 조회하려면 `categoryOrder` 필드를 사용합니다.

**DatabaseListView 컴포넌트 사용 예시:**

```svelte
<script lang="ts">
  import DatabaseListView from '$lib/components/DatabaseListView.svelte';

  const category = 'community';  // 조회할 카테고리
  const categoryPrefix = `${category}-`;  // "community-"
</script>

<DatabaseListView
  path="posts"
  orderBy="categoryOrder"
  orderPrefix={categoryPrefix}
  pageSize={20}
>
  {#snippet item(itemData)}
    {@const post = itemData.data}
    <article>
      <p>{post.text}</p>
    </article>
  {/snippet}
</DatabaseListView>
```

**쿼리 동작:**
1. `categoryOrder` 필드로 정렬
2. `orderPrefix`로 시작하는 항목만 필터링 (`"community-"`)
3. `reverse: true`로 최신 게시글 먼저 표시
4. 페이지네이션 자동 처리 (무한 스크롤)

### 전체 게시글 조회

모든 카테고리의 게시글을 조회하려면 `allCategoryOrder` 필드를 사용합니다:

```svelte
<DatabaseListView
  path="posts"
  orderBy="allCategoryOrder"
  pageSize={20}
>
  <!-- ... -->
</DatabaseListView>
```

**참고:**
- `allCategoryOrder` 필드는 음수 timestamp 값으로 모든 카테고리 게시글을 최신순으로 정렬합니다
- 모든 게시글이 `allCategoryOrder` 필드를 가집니다
- `categoryOrder`와 달리 prefix 없이 모든 카테고리를 포함합니다

### 특정 채팅방과 연결된 게시글 조회

특정 채팅방에서 작성된 게시글은 `roomId` 필드로 필터링할 수 있습니다. 하지만 대부분의 게시글은 `roomId: "post"`를 기본값으로 사용하여 채팅방과 독립적으로 작성됩니다.

```svelte
<script lang="ts">
  // 실제로는 대부분의 게시글이 roomId: "post"를 사용
  // 특정 채팅방에서 작성된 게시글만 조회하려면 클라이언트 측 필터링 필요
</script>

<DatabaseListView
  path="posts"
  orderBy="allCategoryOrder"
  pageSize={20}
>
  {#snippet item(itemData)}
    {@const post = itemData.data}
    <!-- 게시글 표시 -->
    <article>
      <p>{post.text}</p>
    </article>
  {/snippet}
</DatabaseListView>
```

---

## 게시글 데이터 구조

### 기본 필드

게시글은 채팅 메시지와 동일한 구조를 공유하며, 추가 필드를 포함합니다:

```typescript
interface Post {
  // 기본 필드
  postId: string;                 // 고유 게시글 ID (자동 생성)
  authorUid: string;              // 작성자 UID
  text: string;                   // 게시글 본문
  urls?: Record<number, string>;  // 첨부 파일 URL 객체
  createdAt: number;              // 작성 시간 (Unix timestamp)
  editedAt?: number;              // 수정 시간 (수정된 경우만)
  deleted?: boolean;              // 삭제 여부
  deletedAt?: number;             // 삭제 시간 (삭제된 경우만)

  // 게시글 전용 필드
  category: ForumCategory;        // 카테고리 (discussion, qna, news, etc.)
  roomId: string;                 // 기본값: "post"

  // Order 필드 (Cloud Functions에서 자동 생성)
  categoryOrder: string;          // "{category}-{-timestamp}"
  allCategoryOrder: number;       // -{timestamp}

  // 통계 필드 (Cloud Functions에서 자동 관리)
  likeCount?: number;             // 좋아요 수
  totalChildCount?: number;       // 댓글 수 (childCount + 대댓글 수)
  childCount?: number;            // 직접 댓글 수
}
```

### Order 필드

게시판 조회를 위한 핵심 필드는 `categoryOrder`입니다:

**형식:**
```typescript
categoryOrder = `${category}-${timestamp}`;
```

**예시:**
```typescript
{
  category: "community",
  createdAt: 1698473000000,
  categoryOrder: "community-1698473000000"
}
```

**장점:**
1. **카테고리별 필터링**: prefix 쿼리로 특정 카테고리만 조회
2. **시간 순 정렬**: timestamp 부분으로 최신순/오래된순 정렬
3. **효율적 페이지네이션**: Firebase RTDB의 범위 쿼리 활용

### 자동 생성 필드

Cloud Functions가 자동으로 생성/관리하는 필드:

| 필드 | 생성 시점 | 업데이트 시점 | 설명 |
|------|----------|-------------|------|
| `categoryOrder` | 게시글 생성 | - | 카테고리별 정렬 키 (`{category}-{timestamp}`) |
| `allCategoryOrder` | 게시글 생성 | - | 모든 카테고리 통합 정렬 키 (timestamp) |
| `type` | 게시글 생성 | - | 게시글 타입 ("post") |
| `roomOrder` | 게시글 생성 | - | 채팅방별 정렬 키 |
| `createdAt` | 게시글 생성 | - | 작성 시간 |
| `likeCount` | 첫 좋아요 시 | 좋아요 추가/제거 | 좋아요 개수 |
| `commentCount` | 첫 댓글 작성 시 | 댓글 추가/삭제 | 댓글 개수 |
| `reportCount` | 첫 신고 시 | 신고 추가 | 신고 개수 |

---

## 게시판 UI 구조

### 홈 페이지

**경로:** `/` ✅ **구현 완료**

**목적:**
- 앱의 메인 화면으로, 최근 등록된 모든 게시글을 한눈에 볼 수 있는 페이지
- 게시판 목록 페이지(`/post/list`)와 동일한 UI를 제공하여 사용자 경험 일관성 유지

**구성 요소:**
- 헤더 (제목: "최근 게시글" + "글쓰기" 버튼)
- 카테고리 탭 (Chip 형태) - 전체 + 10개 카테고리
- 게시글 목록 (무한 스크롤, DatabaseListView 사용)
- 댓글 기능 통합 (댓글 버튼, 댓글 목록, 답글 기능)

**핵심 기능:**

1. **최근 게시글 표시 (무한 스크롤)**
   - `path="chat-messages"`
   - `orderBy="allCategoryOrder"` (전체 카테고리 통합 정렬)
   - `reverse={true}` (최신 게시글 먼저 표시)
   - `pageSize={20}` (한 번에 20개씩 로드)
   - `threshold={300}` (스크롤 하단 300px 전에 다음 페이지 로드)

2. **카테고리 필터링**
   - 기본값: `selectedCategory = null` (전체 보기)
   - 카테고리 선택 시: `orderBy="categoryOrder"`, `orderPrefix="{category}-"`
   - 예: "질문" 카테고리 선택 → `orderPrefix="qna-"` → "qna" 카테고리 게시글만 표시

3. **글쓰기 기능**
   - `PostCreateDialog.svelte` 컴포넌트 사용
   - 작성 완료 후 선택한 카테고리로 자동 이동 (`handlePostCreated` 콜백)

4. **댓글 기능**
   - `CommentCreateDialog.svelte` 컴포넌트 사용
   - 댓글 목록 표시 (계층 구조, depth 기반 들여쓰기)
   - 답글 기능 (parentId, parentText 전달)
   - 삭제된 댓글 표시 ("삭제된 댓글입니다")

**실제 구현 코드:**

```svelte
<!-- 파일: src/routes/+page.svelte -->
<script lang="ts">
  import { FORUM_CATEGORIES, type ForumCategory } from '../../shared/categories';
  import DatabaseListView from '$lib/components/DatabaseListView.svelte';
  import PostCreateDialog from '$lib/components/post/PostCreateDialog.svelte';
  import CommentCreateDialog from '$lib/components/comment/CommentCreateDialog.svelte';
  import { loadComments } from '$lib/functions/comment.functions';
  import type { CommentWithMetadata } from '$lib/types/comment.types';

  let selectedCategory = $state<ForumCategory | null>(null);
  let isCreateDialogOpen = $state(false);
  let isCommentDialogOpen = $state(false);
  let selectedMessageId = $state<string>('');
  let commentsMap = $state<Record<string, CommentWithMetadata[]>>({});

  // DatabaseListView props 계산
  const orderByField = $derived(selectedCategory ? 'categoryOrder' : 'allCategoryOrder');
  const orderPrefixValue = $derived(selectedCategory ? `${selectedCategory}-` : '');

  async function loadCommentsForMessage(messageId: string) {
    const result = await loadComments(messageId);
    if (result.success && result.comments) {
      commentsMap[messageId] = result.comments;
    }
  }
</script>

<div class="post-list-container">
  <!-- 헤더 -->
  <div class="post-list-header">
    <h1 class="post-list-title">최근 게시글</h1>
    <Button onclick={() => (isCreateDialogOpen = true)}>글쓰기</Button>
  </div>

  <!-- 카테고리 탭 -->
  <div class="category-tabs">
    <button class:active={selectedCategory === null} onclick={() => selectedCategory = null}>
      전체
    </button>
    {#each FORUM_CATEGORIES as category}
      <button class:active={selectedCategory === category} onclick={() => selectedCategory = category}>
        {getCategoryMessage(category)}
      </button>
    {/each}
  </div>

  <!-- 게시글 목록 -->
  <DatabaseListView
    path="chat-messages"
    pageSize={20}
    orderBy={orderByField}
    orderPrefix={orderPrefixValue}
    reverse={true}
    threshold={300}
  >
    {#snippet item(itemData, index)}
      <!-- 게시글 카드, 댓글 버튼, 댓글 목록 -->
    {/snippet}
  </DatabaseListView>
</div>
```

**개발 과정:**
1. ✅ 기존 `/post/list` 페이지의 UI를 홈 페이지로 복사
2. ✅ 헤더 제목을 "최근 게시글"로 변경
3. ✅ 동일한 상태 관리 로직 적용 (`selectedCategory`, `commentsMap`)
4. ✅ 동일한 컴포넌트 재사용 (`PostCreateDialog`, `CommentCreateDialog`)
5. ✅ 동일한 스타일 적용 (Tailwind CSS chip, card, hover 효과)

**주요 차이점 (vs. `/post/list`):**
- 페이지 제목: "최근 게시글" vs. "카테고리"
- 경로: `/` vs. `/post/list`
- 기타 기능은 완전히 동일

**결과:**
- ✅ 홈 페이지에서 최근 게시글 목록 표시
- ✅ 무한 스크롤 기능 정상 작동
- ✅ 전체/카테고리별 필터링 정상 작동
- ✅ 글쓰기 기능 통합
- ✅ 댓글 기능 통합 (작성, 답글, 계층 구조 표시)
- ✅ Tailwind CSS 스타일링 적용

---

### 게시판 메인 페이지

**경로:** `/forum` (향후 구현)

**구성 요소:**
- 카테고리 탭 메뉴
- 최신 게시글 목록
- 카테고리별 통계 (게시글 수, 댓글 수)

**UI 레이아웃:**
```
┌─────────────────────────────────────────┐
│ 게시판                                   │
├─────────────────────────────────────────┤
│ [커뮤니티] [질문답변] [뉴스] [회원장터]  │
├─────────────────────────────────────────┤
│ 📝 최신 게시글 제목 1                    │
│    작성자 · 2시간 전 · 댓글 5 · 좋아요 12 │
├─────────────────────────────────────────┤
│ 📝 최신 게시글 제목 2                    │
│    작성자 · 5시간 전 · 댓글 3 · 좋아요 7  │
└─────────────────────────────────────────┘
```

### 카테고리 페이지

**경로:** `/post/list` ✅ **구현 완료**

**구성 요소:**
- 카테고리 탭 (Chip 형태) - 전체 + 10개 카테고리
- 게시글 목록 (무한 스크롤, DatabaseListView 사용)
- 카테고리 선택 시 동적 필터링

**구현 세부사항:**
- **전체 목록**: `orderBy="allCategoryOrder"`, `orderPrefix=""`, `reverse={true}`
- **카테고리별 목록**: `orderBy="categoryOrder"`, `orderPrefix="{category}-"`, `reverse={true}`
- **상태 관리**: `let selectedCategory = $state<ForumCategory | null>(null)`
- **UI**: Tailwind CSS chip 컴포넌트 (active 상태 표시)
- **라우팅**: 게시글 클릭 시 `/chat/room?roomId={roomId}`로 이동

**실제 구현 코드:**
```svelte
<!-- 파일: src/routes/post/list/+page.svelte -->
<script lang="ts">
  import { FORUM_CATEGORIES, type ForumCategory } from '../../../../shared/categories';
  import DatabaseListView from '$lib/components/DatabaseListView.svelte';
  import * as m from '$lib/paraglide/messages.js';

  let selectedCategory = $state<ForumCategory | null>(null);

  const orderByField = $derived(selectedCategory ? 'categoryOrder' : 'allCategoryOrder');
  const orderPrefixValue = $derived(selectedCategory ? `${selectedCategory}-` : '');
</script>

<!-- 카테고리 탭 -->
<div class="category-tabs">
  <button class:active={selectedCategory === null} onclick={() => selectedCategory = null}>
    전체
  </button>
  {#each FORUM_CATEGORIES as category}
    <button class:active={selectedCategory === category} onclick={() => selectedCategory = category}>
      {getCategoryMessage(category)}
    </button>
  {/each}
</div>

<!-- 게시글 목록 -->
<DatabaseListView
  path="chat-messages"
  orderBy={orderByField}
  orderPrefix={orderPrefixValue}
  reverse={true}
  pageSize={20}
>
  {#snippet item(itemData)}
    {@const message = itemData.data}
    <div class="post-card" onclick={() => handleMessageClick(message.roomId)}>
      <!-- 카테고리 뱃지, 메시지 내용, 메타 정보 -->
    </div>
  {/snippet}
</DatabaseListView>
```

**개발 과정:**
1. **카테고리 상수 사용**: `shared/categories.ts`의 `FORUM_CATEGORIES` 배열 활용
2. **동적 쿼리**: 선택된 카테고리에 따라 `orderBy`와 `orderPrefix` 자동 변경
3. **DatabaseListView**: `orderPrefix` prop을 통해 `startAt(prefix)`, `endAt(prefix + '\uf8ff')` 자동 처리
4. **역순 정렬**: `reverse={true}`로 최신 게시글 먼저 표시

**로직:**
- **전체 보기**: 사용자가 "전체" 탭 클릭 → `selectedCategory = null` → `allCategoryOrder` 기준 정렬 → 모든 카테고리 게시글 표시
- **카테고리 필터링**: 사용자가 특정 카테고리 탭 클릭 (예: "질문") → `selectedCategory = "qna"` → `categoryOrder` 필드에서 `orderPrefix="qna-"`로 필터링 → "qna" 카테고리 게시글만 표시

**결과:**
- ✅ 카테고리별 게시글 목록 페이지 구현 완료
- ✅ 무한 스크롤 기능 정상 작동
- ✅ 전체/카테고리별 필터링 정상 작동
- ✅ Tailwind CSS 스타일링 적용 (chip, card, hover 효과)

### 게시글 작성 페이지

**방식:** 모달 다이얼로그 (별도 페이지 아님)

**컴포넌트:** `PostCreateDialog.svelte` ✅ **구현 완료**

**구성 요소:**
- **카테고리 선택** (드롭다운) - `FORUM_CATEGORIES` 배열 기반
- **채팅방 선택** (드롭다운) - `/chat-joins/{uid}`의 `openAndGroupListOrder` 필드가 있는 그룹/오픈 채팅방만 표시, 기본값: "post"
- **글 내용** (텍스트 에리어) - 본문 작성
- **사진 업로드** (다중 파일) - Firebase Storage 업로드, 진행률 표시
- **저장/취소** 버튼

**구현 세부사항:**

1. **채팅방 선택 로직:**
   - `loadChatRooms()` 함수: `/chat-joins/{uid}` 경로에서 `orderByChild('openAndGroupListOrder')` 쿼리
   - `openAndGroupListOrder` 필드가 있는 노드만 필터링
   - `roomName` 표시, `roomId` 값 저장
   - 선택하지 않으면 기본값 "post" 사용

2. **파일 업로드:**
   - `handleFiles()` 함수: 파일 선택 즉시 Firebase Storage에 업로드 시작
   - `uploadChatFile()` 사용 - roomId는 "post" 고정
   - 업로드 진행률 실시간 표시 (`FileUploadStatus` 인터페이스)
   - 업로드 완료된 파일만 메시지 payload의 `urls` 객체에 포함
   - 취소 시 `deleteChatFile()`로 Storage에서 파일 삭제

3. **메시지 저장:**
   - `pushData('chat-messages', payload)` 호출
   - **클라이언트 Payload 구조 (최소 필드만 포함):**
     ```typescript
     {
       roomId: selectedRoomId,        // 선택한 채팅방 ID 또는 "post"
       text: postText.trim(),         // 게시글 내용
       urls: { 0: "url1", 1: "url2" }, // 업로드된 파일 URL 목록
       senderUid: authStore.user.uid, // 작성자 UID
       createdAt: timestamp,          // 생성 시각 (밀리초)
       category: selectedCategory,    // 카테고리 (예: "discussion", "qna")
       roomOrder: `-${selectedRoomId}-${timestamp}`, // 클라이언트에서 생성
       rootOrder: `-${selectedRoomId}-${timestamp}`  // 클라이언트에서 생성
     }
     ```

   - **클라이언트/서버 필드 분리:**
     - **클라이언트가 제공하는 필드:**
       - `roomId`, `text`, `urls`, `senderUid`, `createdAt`, `category`
       - `roomOrder`, `rootOrder` - 클라이언트에서 직접 생성

     - **Cloud Functions가 자동 생성하는 필드 (category 있을 때):**
       - `categoryOrder`: `"{category}-{timestamp}"` 형식으로 생성
       - `allCategoryOrder`: `timestamp` 값으로 생성
       - `type`: `"post"` 값으로 자동 설정

     - **생략된 선택적 필드:**
       - `type` - Cloud Functions가 자동으로 "post"로 설정하므로 클라이언트에서 불필요
       - `editedAt`, `deletedAt` - 선택적 필드로 생략 가능 (undefined 처리)

   - **주의사항:**
     - 클라이언트는 Cloud Functions에서 자동 생성하는 필드를 중복으로 지정하지 않음
     - 이를 통해 데이터 일관성 유지 및 불필요한 필드 전송 방지

4. **카테고리 자동 선택:**
   - `onPostCreated` 콜백으로 부모 컴포넌트에 선택된 카테고리 전달
   - 게시판 페이지에서 `handlePostCreated(category)` 실행 → `selectedCategory` 업데이트
   - 사용자가 글 작성 후 해당 카테고리 게시글 목록에서 자동으로 확인 가능

**사용 예시:**
```svelte
<!-- 파일: src/routes/post/list/+page.svelte -->
<script lang="ts">
  import { Button } from '$lib/components/ui/button';
  import PostCreateDialog from '$lib/components/post/PostCreateDialog.svelte';

  let isCreateDialogOpen = $state(false);
  let selectedCategory = $state<ForumCategory | null>(null);

  function handlePostCreated(category: ForumCategory) {
    selectedCategory = category;  // 작성한 게시글의 카테고리로 자동 이동
  }
</script>

<div class="post-list-header">
  <h1 class="post-list-title">{m.chatCategoryLabel()}</h1>
  <Button onclick={() => (isCreateDialogOpen = true)}>글쓰기</Button>
</div>

<PostCreateDialog
  bind:open={isCreateDialogOpen}
  onPostCreated={handlePostCreated}
/>
```

**개발 과정:**
1. ✅ 기존 채팅 메시지 전송 로직 분석 (`/routes/chat/room/+page.svelte`)
2. ✅ 파일 업로드 함수 재사용 (`uploadChatFile`, `deleteChatFile`)
3. ✅ `PostCreateDialog.svelte` 컴포넌트 생성 (Svelte 5 runes, shadcn-ui Dialog)
4. ✅ `/post/list` 페이지에 "글쓰기" 버튼 통합
5. ✅ TypeScript 타입 에러 수정 (native HTML select 사용)
6. ✅ 코드 검사 및 테스트 완료 (0 errors)

**결과:**
- ✅ 게시판 페이지에서 "글쓰기" 버튼 클릭 시 모달 다이얼로그 표시
- ✅ 카테고리, 채팅방, 내용, 사진 입력 후 저장 가능
- ✅ 저장된 게시글은 `/chat-messages`에 메시지로 저장
- ✅ Cloud Functions가 자동으로 `categoryOrder`, `type` 필드 생성
- ✅ 작성 후 해당 카테고리로 자동 이동

### 게시글 상세 페이지

**경로:** `/forum/post/[messageId]` (향후 구현)

**구성 요소:**
- 게시글 제목, 본문, 작성자 정보
- 좋아요 버튼
- 댓글 목록
- 댓글 작성 폼
- 신고 버튼

**UI 레이아웃:**
```
┌─────────────────────────────────────────┐
│ 게시글 제목                              │
│ 작성자 · 2시간 전 · [좋아요 12] [신고]   │
├─────────────────────────────────────────┤
│ 게시글 본문 내용...                      │
│                                         │
│ [첨부 이미지]                            │
├─────────────────────────────────────────┤
│ 💬 댓글 5개                              │
├─────────────────────────────────────────┤
│ 👤 사용자1 · 1시간 전                    │
│    댓글 내용...                          │
│    [좋아요 3] [답글]                     │
├─────────────────────────────────────────┤
│ [댓글 작성 폼]                           │
└─────────────────────────────────────────┘
```

---

## 게시판과 채팅의 차이점

### UI 표시 방식

| 요소 | 채팅 목록 | 게시판 목록 |
|------|----------|-----------|
| **표시 메시지** | 모든 메시지 (`type: "message"` + `type: "post"`) | `type: "post"`만 |
| **정렬 필드** | `roomOrder` | `categoryOrder` |
| **제목 표시** | 없음 (메시지 본문만) | 있음 (`title` 필드) |
| **카테고리** | 표시 안 함 | 카테고리 뱃지 표시 |
| **작성 방식** | 간단한 입력창 | 모달 다이얼로그 (제목, 카테고리 선택) |

### 조회 쿼리

**채팅 목록 조회:**
```typescript
// roomOrder 필드로 정렬
const query = rtdbQuery(
  rtdbRef(rtdb, 'chat-messages'),
  rtdbOrderByChild('roomOrder'),
  rtdbStartAt(`-${roomId}-`),
  rtdbEndAt(`-${roomId}-\uf8ff`)
);
```

**게시판 목록 조회:**
```typescript
// categoryOrder 필드로 정렬
const query = rtdbQuery(
  rtdbRef(rtdb, 'chat-messages'),
  rtdbOrderByChild('categoryOrder'),
  rtdbStartAt(`${category}-`),
  rtdbEndAt(`${category}-\uf8ff`)
);
```

### 작성 방식

**일반 채팅 메시지:**
- 간단한 텍스트 입력창
- Enter 키로 즉시 전송
- 제목 없음
- 카테고리 선택 없음

**게시글:**
- 모달 다이얼로그 열기
- 카테고리 선택 필수
- 제목 입력 필수
- 본문 작성
- 저장 버튼 클릭

---

## 댓글 시스템

### 댓글 구조

댓글도 채팅 메시지와 동일한 구조를 사용합니다:

```typescript
{
  type: "message",              // 댓글은 일반 메시지 타입
  text: "댓글 내용",
  senderUid: "작성자UID",
  parentId: "게시글messageId",  // 부모 게시글 ID
  roomId: "채팅방ID",
  depth: 1,                     // 댓글 깊이 (1: 댓글, 2: 대댓글, ...)
  createdAt: 1698473000000
}
```

### 대댓글 (답글)

대댓글은 `parentId`와 `depth` 필드로 계층 구조를 표현합니다:

```typescript
{
  type: "message",
  text: "대댓글 내용",
  senderUid: "작성자UID",
  parentId: "댓글messageId",    // 부모 댓글 ID
  depth: 2,                     // 대댓글 깊이
  createdAt: 1698473100000
}
```

**최대 깊이:** 12단계 (설정 가능)

### 댓글 정렬

댓글은 `createdAt` 필드로 시간순 정렬됩니다:

```typescript
// 특정 게시글의 댓글 조회
const query = rtdbQuery(
  rtdbRef(rtdb, 'chat-messages'),
  rtdbOrderByChild('parentId'),
  rtdbEqualTo(postMessageId)
);
```

---

## 좋아요 시스템

### 좋아요 데이터 구조

좋아요는 `/likes/{uid}/{targetId}` 경로에 저장됩니다:

```typescript
// 예시: 게시글 좋아요
likes/user-abc/post-xyz = "message"

// 예시: 댓글 좋아요
likes/user-abc/-Nv123abc = "comment"
```

### 좋아요 개수 관리

Cloud Functions가 좋아요 개수를 자동으로 관리합니다:

1. **좋아요 추가 시:**
   ```typescript
   /likes/{uid}/{messageId} = "message"
   // → Cloud Functions: /chat-messages/{messageId}/likeCount++
   ```

2. **좋아요 취소 시:**
   ```typescript
   /likes/{uid}/{messageId} 삭제
   // → Cloud Functions: /chat-messages/{messageId}/likeCount--
   ```

3. **댓글 좋아요 처리**
   - `/likes/{uid}/{commentId} = "comment-{postId}"` (targetType에 postId 포함)
   - targetType에서 postId 파싱하여 `/comments/{postId}/{commentId}/likeCount` 증감

---

## 신고 시스템

### 신고 사유

신고 사유는 다음과 같이 정의되어 있습니다:

```typescript
export type ReportReason =
  | "abuse"         // 욕설, 시비, 모욕, 명예훼손
  | "fake-news"     // 가짜 뉴스, 잘못된 정보
  | "spam"          // 스팸, 악용
  | "inappropriate" // 카테고리에 맞지 않는 글
  | "other";        // 기타
```

### 신고 처리

신고는 `/reports/{reportId}` 경로에 저장됩니다:

```typescript
{
  reportId: "post-{messageId}-{uid}",  // 고유 신고 ID
  type: "post",                        // 신고 대상 타입
  nodeId: "messageId",                 // 게시글 ID
  uid: "신고자UID",                    // 신고한 사용자
  reason: "spam",                      // 신고 사유
  message: "상세 설명",                // 신고 내용 (선택)
  createdAt: 1698473000000            // 신고 시간
}
```

Cloud Functions가 신고 개수를 자동으로 업데이트:

```typescript
/reports/post-{messageId}-{uid} 생성
// Cloud Functions 트리거
/chat-messages/{messageId}/reportCount++
```

---

## 게시판 통계

### 카테고리별 통계

각 카테고리의 통계는 `/forum-stats/{category}` 경로에 저장됩니다 (향후 구현):

```typescript
{
  postCount: 150,       // 총 게시글 수
  commentCount: 450,    // 총 댓글 수
  todayPostCount: 12,   // 오늘 작성된 게시글 수
  weekPostCount: 78,    // 이번 주 작성된 게시글 수
}
```

### 전체 통계

전체 게시판 통계는 `/forum-stats/all` 경로에 저장됩니다 (향후 구현):

```typescript
{
  totalPosts: 500,
  totalComments: 1500,
  totalUsers: 200,
  categories: {
    community: 150,
    qna: 180,
    news: 90,
    market: 80
  }
}
```

---

## 구현 예시

### 게시글 목록 컴포넌트

```svelte
<!-- 파일: src/lib/components/forum/ForumPostList.svelte -->
<script lang="ts">
  import DatabaseListView from '$lib/components/DatabaseListView.svelte';
  import { goto } from '$app/navigation';
  import { formatLongDate } from '$lib/functions/date.functions';

  interface Props {
    category: string;  // 조회할 카테고리
  }

  let { category }: Props = $props();

  const categoryPrefix = $derived(`${category}-`);

  function openPost(messageId: string) {
    goto(`/forum/post/${messageId}`);
  }
</script>

<DatabaseListView
  path="chat-messages"
  orderBy="categoryOrder"
  orderPrefix={categoryPrefix}
  reverse={true}
  pageSize={20}
>
  {#snippet item(itemData)}
    {@const post = itemData.data}
    {@const messageId = itemData.key}

    <article class="post-item" onclick={() => openPost(messageId)}>
      <div class="post-header">
        <h2 class="post-title">{post.title}</h2>
        <span class="post-category">{post.category}</span>
      </div>

      <p class="post-preview">
        {post.text.substring(0, 150)}...
      </p>

      <div class="post-meta">
        <span class="author">{post.senderName ?? '익명'}</span>
        <span class="date">{formatLongDate(post.createdAt)}</span>
        <span class="stats">
          💬 {post.commentCount ?? 0}
          · ❤️ {post.likeCount ?? 0}
        </span>
      </div>
    </article>
  {/snippet}

  {#snippet loading()}
    <p class="loading">게시글을 불러오는 중...</p>
  {/snippet}

  {#snippet empty()}
    <p class="empty">아직 게시글이 없습니다.</p>
  {/snippet}
</DatabaseListView>

<style>
  .post-item {
    @apply cursor-pointer rounded-lg border border-gray-200 bg-white p-4 shadow-sm transition hover:shadow-md;
  }

  .post-header {
    @apply mb-2 flex items-center justify-between;
  }

  .post-title {
    @apply text-lg font-semibold text-gray-900;
  }

  .post-category {
    @apply rounded-full bg-blue-100 px-3 py-1 text-xs font-semibold uppercase text-blue-600;
  }

  .post-preview {
    @apply mb-3 text-sm text-gray-600 line-clamp-2;
  }

  .post-meta {
    @apply flex items-center gap-2 text-xs text-gray-500;
  }
</style>
```

### 게시글 작성 컴포넌트

**✅ 실제 구현된 코드** (2025-11-16)

```svelte
<!-- 파일: src/lib/components/post/PostCreateDialog.svelte -->
<script lang="ts">
  import { Dialog, DialogContent, DialogHeader, DialogTitle } from '$lib/components/ui/dialog';
  import { Button } from '$lib/components/ui/button';
  import { FORUM_CATEGORIES, type ForumCategory } from '../../../../shared/categories';
  import * as m from '$lib/paraglide/messages.js';
  import { authStore } from '$lib/stores/auth.svelte';
  import { pushData } from '$lib/stores/database.svelte';
  import { uploadChatFile, deleteChatFile, formatFileSize } from '$lib/functions/storage.functions';
  import type { FileUploadStatus } from '$lib/types/chat.types';
  import { rtdb } from '$lib/firebase';
  import { ref, query, orderByChild, get } from 'firebase/database';

  // Props 인터페이스
  interface Props {
    open: boolean;
    onPostCreated?: (category: ForumCategory) => void;
  }

  let { open = $bindable(), onPostCreated }: Props = $props();

  // 카테고리 i18n 매핑
  const getCategoryMessage = (category: ForumCategory) => {
    const categoryMap: Record<ForumCategory, () => string> = {
      discussion: m.chatCategoryFreeDiscussion,
      qna: m.chatCategoryQna,
      news: m.chatCategoryNews,
      info: m.chatCategoryInformation,
      selling: m.chatCategoryForSale,
      hiring: m.chatCategoryJobs,
      travel: m.chatCategoryTravel,
      mukbang: m.chatCategoryFood,
      realestate: m.chatCategoryRealEstate,
      hobby: m.chatCategoryHobby,
      story: m.chatCategoryStory
    };
    return categoryMap[category]();
  };

  // 상태 관리
  let postText = $state('');
  let selectedCategory = $state<string>('');
  let selectedRoomId = $state<string>('post');
  let uploadingFiles: FileUploadStatus[] = $state([]);
  let isSaving = $state(false);
  let saveError = $state<string | null>(null);
  let fileInputRef: HTMLInputElement | null = $state(null);

  // 그룹/오픈 채팅방 목록
  let chatRooms: Array<{ roomId: string; roomName: string }> = $state([]);
  let loadingRooms = $state(false);

  /**
   * 그룹/오픈 채팅방 목록 로드
   * /chat-joins/{uid}에서 openAndGroupListOrder가 있는 노드만 가져오기
   */
  async function loadChatRooms() {
    if (!authStore.user?.uid || !rtdb) {
      chatRooms = [];
      return;
    }

    loadingRooms = true;

    try {
      const joinsRef = ref(rtdb, `chat-joins/${authStore.user.uid}`);
      const joinsQuery = query(joinsRef, orderByChild('openAndGroupListOrder'));
      const snapshot = await get(joinsQuery);

      const rooms: Array<{ roomId: string; roomName: string }> = [];

      snapshot.forEach((child) => {
        const value = child.val();
        if (value?.openAndGroupListOrder) {
          rooms.push({
            roomId: child.key ?? '',
            roomName: (value.roomName as string) || child.key || '이름 없는 채팅방'
          });
        }
      });

      chatRooms = rooms;
    } catch (error) {
      console.error('채팅방 목록 로드 실패:', error);
      chatRooms = [];
    } finally {
      loadingRooms = false;
    }
  }

  // 다이얼로그 열릴 때 채팅방 목록 로드
  $effect(() => {
    if (open) {
      loadChatRooms();
    }
  });

  /**
   * 파일 선택 핸들러
   */
  function handleFileSelect(event: Event) {
    const input = event.target as HTMLInputElement;
    const files = input.files;
    if (!files || files.length === 0) return;

    handleFiles(Array.from(files));
    input.value = '';  // input 값 초기화
  }

  /**
   * 파일 업로드 처리
   */
  async function handleFiles(files: File[]) {
    if (!authStore.user?.uid) {
      saveError = '로그인이 필요합니다.';
      return;
    }

    for (const file of files) {
      const fileStatus: FileUploadStatus = {
        file,
        progress: 0,
        downloadUrl: undefined,
        error: undefined,
        completed: false
      };

      uploadingFiles = [...uploadingFiles, fileStatus];
      const currentIndex = uploadingFiles.length - 1;

      try {
        const downloadUrl = await uploadChatFile(
          file,
          authStore.user.uid,
          'post',  // roomId로 "post" 사용
          (progress) => {
            uploadingFiles[currentIndex].progress = progress;
          }
        );

        uploadingFiles[currentIndex].completed = true;
        uploadingFiles[currentIndex].downloadUrl = downloadUrl;
      } catch (error) {
        console.error('파일 업로드 실패:', error);
        uploadingFiles[currentIndex].error = '업로드 실패';
      }
    }
  }

  /**
   * 파일 삭제 핸들러
   */
  async function handleRemoveFile(index: number) {
    const fileStatus = uploadingFiles[index];

    if (fileStatus.downloadUrl) {
      try {
        await deleteChatFile(fileStatus.downloadUrl);
      } catch (error) {
        console.error('파일 삭제 실패:', error);
      }
    }

    uploadingFiles = uploadingFiles.filter((_, i) => i !== index);
  }

  /**
   * 게시글 저장 핸들러
   */
  async function handleSave() {
    if (isSaving) return;
    if (!postText.trim() && uploadingFiles.length === 0) {
      saveError = '내용을 입력하거나 사진을 첨부해주세요.';
      return;
    }
    if (!selectedCategory) {
      saveError = '카테고리를 선택해주세요.';
      return;
    }
    if (!authStore.user?.uid) {
      saveError = '로그인이 필요합니다.';
      return;
    }

    isSaving = true;
    saveError = null;

    try {
      // 업로드 완료되지 않은 파일 확인
      const incompleteFiles = uploadingFiles.filter((fs) => !fs.completed && !fs.error);
      if (incompleteFiles.length > 0) {
        saveError = `업로드 중인 파일이 ${incompleteFiles.length}개 있습니다.`;
        isSaving = false;
        return;
      }

      // 파일 URL 수집
      let urls: Record<number, string> = {};
      uploadingFiles.forEach((fs, index) => {
        if (fs.downloadUrl) {
          urls[index] = fs.downloadUrl;
        }
      });

      /**
       * 게시글 저장 payload (최소 필드만 포함)
       *
       * 클라이언트에서 제공하는 필드:
       * - roomId, text, urls, senderUid, createdAt, category
       * - roomOrder, rootOrder (클라이언트에서 생성)
       *
       * Cloud Functions에서 자동 생성되는 필드 (category가 있을 때):
       * - categoryOrder: "{category}-{timestamp}"
       * - allCategoryOrder: timestamp
       * - type: "post"
       *
       * 생략된 선택적 필드:
       * - type: Cloud Functions가 자동으로 "post"로 설정
       * - editedAt, deletedAt: 선택적 필드로 생략 가능
       */
      const timestamp = Date.now();
      const payload: Record<string, any> = {
        roomId: selectedRoomId,
        text: postText.trim(),
        urls,
        senderUid: authStore.user.uid,
        createdAt: timestamp,
        category: selectedCategory,
        roomOrder: `-${selectedRoomId}-${timestamp}`,
        rootOrder: `-${selectedRoomId}-${timestamp}`
      };

      // /chat-messages에 메시지 저장
      const result = await pushData('chat-messages', payload);

      if (!result.success) {
        saveError = result.error ?? '저장에 실패했습니다.';
        isSaving = false;
        return;
      }

      // 성공 시 초기화 및 모달 닫기
      postText = '';
      uploadingFiles = [];
      selectedRoomId = 'post';
      isSaving = false;

      // 게시판 페이지에서 카테고리 자동 선택을 위한 콜백 호출
      const createdCategory = selectedCategory as ForumCategory;
      if (onPostCreated) {
        onPostCreated(createdCategory);
      }

      selectedCategory = '';
      open = false;
    } catch (error) {
      console.error('게시글 저장 실패:', error);
      saveError = '게시글 저장에 실패했습니다.';
      isSaving = false;
    }
  }

  /**
   * 취소 핸들러
   */
  function handleCancel() {
    // 업로드된 파일 삭제
    uploadingFiles.forEach(async (fileStatus) => {
      if (fileStatus.downloadUrl) {
        try {
          await deleteChatFile(fileStatus.downloadUrl);
        } catch (error) {
          console.error('파일 삭제 실패:', error);
        }
      }
    });

    // 상태 초기화
    postText = '';
    selectedCategory = '';
    selectedRoomId = 'post';
    uploadingFiles = [];
    saveError = null;

    open = false;
  }
</script>

<Dialog bind:open>
  <DialogContent class="max-w-2xl">
    <DialogHeader>
      <DialogTitle>게시글 작성</DialogTitle>
    </DialogHeader>

    <div class="post-create-form">
      <!-- 카테고리 선택 -->
      <div class="form-group">
        <label for="category" class="form-label">카테고리 *</label>
        <select id="category" bind:value={selectedCategory} class="form-select">
          <option value="">{m.chatCategorySelect()}</option>
          {#each FORUM_CATEGORIES as category}
            <option value={category}>{getCategoryMessage(category)}</option>
          {/each}
        </select>
      </div>

      <!-- 채팅방 선택 -->
      <div class="form-group">
        <label for="roomId" class="form-label">채팅방</label>
        <select id="roomId" bind:value={selectedRoomId} class="form-select">
          <option value="post">기본</option>
          {#if loadingRooms}
            <option value="" disabled>로딩 중...</option>
          {:else}
            {#each chatRooms as room}
              <option value={room.roomId}>{room.roomName}</option>
            {/each}
          {/if}
        </select>
      </div>

      <!-- 글 내용 -->
      <div class="form-group">
        <label for="postText" class="form-label">내용</label>
        <textarea
          id="postText"
          bind:value={postText}
          placeholder="내용을 입력하세요"
          class="post-textarea"
          rows="6"
        ></textarea>
      </div>

      <!-- 사진 업로드 -->
      <div class="form-group">
        <label class="form-label">사진</label>
        <input
          type="file"
          bind:this={fileInputRef}
          onchange={handleFileSelect}
          accept="image/*"
          multiple
          class="hidden"
        />
        <Button type="button" variant="outline" onclick={() => fileInputRef?.click()}>
          사진 선택
        </Button>

        <!-- 업로드된 파일 목록 -->
        {#if uploadingFiles.length > 0}
          <div class="uploaded-files">
            {#each uploadingFiles as fileStatus, index}
              <div class="file-item">
                <div class="file-info">
                  <div class="file-name">{fileStatus.file.name}</div>
                  <div class="file-size">{formatFileSize(fileStatus.file.size)}</div>
                  {#if !fileStatus.completed && !fileStatus.error}
                    <div class="file-progress">
                      <div class="progress-bar">
                        <div class="progress-fill" style="width: {fileStatus.progress}%"></div>
                      </div>
                      <span class="progress-text">{Math.round(fileStatus.progress)}%</span>
                    </div>
                  {/if}
                  {#if fileStatus.error}
                    <div class="file-error">{fileStatus.error}</div>
                  {/if}
                </div>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onclick={() => handleRemoveFile(index)}
                >
                  삭제
                </Button>
              </div>
            {/each}
          </div>
        {/if}
      </div>

      <!-- 에러 메시지 -->
      {#if saveError}
        <div class="error-message">{saveError}</div>
      {/if}

      <!-- 액션 버튼 -->
      <div class="form-actions">
        <Button type="button" variant="outline" onclick={handleCancel} disabled={isSaving}>
          취소
        </Button>
        <Button type="button" onclick={handleSave} disabled={isSaving}>
          {isSaving ? '저장 중...' : '저장'}
        </Button>
      </div>
    </div>
  </DialogContent>
</Dialog>

<style>
  @import 'tailwindcss' reference;

  .post-create-form {
    @apply flex flex-col gap-4;
  }

  .form-group {
    @apply flex flex-col gap-2;
  }

  .form-label {
    @apply text-sm font-medium text-gray-700;
  }

  .form-select {
    @apply w-full rounded-md border border-gray-300 px-3 py-2 text-sm;
    @apply focus:border-blue-600 focus:outline-none focus:ring-1 focus:ring-blue-600;
  }

  .post-textarea {
    @apply w-full rounded-md border border-gray-300 px-3 py-2 text-sm;
    @apply focus:border-blue-600 focus:outline-none focus:ring-1 focus:ring-blue-600;
  }

  .uploaded-files {
    @apply mt-2 flex flex-col gap-2;
  }

  .file-item {
    @apply flex items-center justify-between rounded-md border border-gray-200 bg-gray-50 p-2;
  }

  .file-info {
    @apply flex flex-col gap-1;
  }

  .file-name {
    @apply text-sm font-medium text-gray-900;
  }

  .file-size {
    @apply text-xs text-gray-500;
  }

  .file-progress {
    @apply flex items-center gap-2;
  }

  .progress-bar {
    @apply h-2 w-32 overflow-hidden rounded-full bg-gray-200;
  }

  .progress-fill {
    @apply h-full bg-blue-600 transition-all;
  }

  .progress-text {
    @apply text-xs text-gray-600;
  }

  .file-error {
    @apply text-xs text-red-600;
  }

  .error-message {
    @apply rounded-md bg-red-50 p-3 text-sm text-red-600;
  }

  .form-actions {
    @apply flex justify-end gap-2;
  }
</style>
```

**핵심 기능:**
1. **채팅 통합**: 채팅 메시지 구조 재사용, 파일 업로드 함수 공유
2. **그룹/오픈 채팅방 선택**: `openAndGroupListOrder` 필드 기반 필터링
3. **실시간 파일 업로드**: 진행률 표시, 즉시 Storage 업로드
4. **카테고리 콜백**: 게시글 저장 후 부모 컴포넌트에 카테고리 전달
5. **Svelte 5 runes**: `$state`, `$derived`, `$effect`, `$bindable` 사용

---

## 댓글 시스템

게시글에 댓글을 작성하고 계층적으로 표시하는 기능입니다. 댓글은 트리 구조를 지원하며, listOrder 필드를 통해 정렬됩니다.

### 데이터베이스 구조

상세한 데이터베이스 구조는 다음 문서를 참조하세요:
- [댓글 데이터베이스 구조](./sonub-firebase-database-structure.md#댓글-comments)

### 댓글 작성 함수

**소스 코드 위치**: [repository/src/lib/functions/comment.functions.ts.md](./repository/src/lib/functions/comment.functions.ts.md)

**주요 함수**:

1. **createComment**: 새로운 댓글 생성 (childCount 기반)
   - 대댓글인 경우: 부모 댓글의 listOrder와 childCount 가져오기
   - 최상위 댓글인 경우: 메시지의 childCount 가져오기
   - `generateThreadOrder(parentListOrder, parentChildCount)`를 사용하여 새 listOrder 생성
   - Firebase RTDB에 댓글 저장
   - **동시성 보장**: childCount 기반으로 중복 없이 순차적 listOrder 생성

2. **loadComments**: 특정 게시글의 모든 댓글 로드
   - listOrder 순서로 정렬
   - 댓글 ID와 depth 메타데이터 추가
   - 전체 댓글을 모두 가져와야 할 때 사용 (예: 댓글 전체보기, 더보기 클릭 시)

3. **loadLastComments**: 특정 게시글의 마지막 N개 댓글만 로드
   - `limitToLast(limit)` 사용하여 listOrder 기준 마지막 N개만 조회
   - 기본값: 3개
   - 글 목록 페이지에서 댓글 미리보기용으로 사용
   - 성능 최적화: 전체 댓글을 가져오지 않고 최근 댓글만 로드

4. **updateComment**: 댓글 수정
   - 텍스트 및 첨부 파일 수정
   - `editedAt` 필드 업데이트

5. **deleteComment**: 댓글 삭제 (Soft Delete)
   - `deleted: true`, `deletedAt: timestamp` 설정
   - 텍스트 및 첨부 파일 초기화

### Cloud Functions - 댓글 개수 자동 관리

**소스 코드 위치**: [repository/firebase/functions/src/handlers/comment.create.handler.ts.md](./repository/firebase/functions/src/handlers/comment.create.handler.ts.md)

**트리거**: `/comments/{postId}/{commentId}` onCreate

**기능**:
- 댓글 생성 시 자동으로 게시글의 childCount/totalChildCount와 부모 댓글의 childCount를 증가시킵니다.

**작동 방식**:

1. **모든 댓글 생성 시** (최상위 댓글 및 대댓글 모두):
   - `/posts/{postId}/totalChildCount`를 `ServerValue.increment(1)`로 +1 증가
   - 게시글 노드에 총 댓글 개수를 기록 (모든 레벨 포함)
   - 이 값은 UI에서 "(n) 개의 댓글이 있습니다." 형태로 표시됨

2. **최상위 댓글 생성 시** (parentId가 null인 경우):
   - 게시글의 totalChildCount 증가 (1번 작업)
   - **추가로** `/posts/{postId}/childCount`를 `ServerValue.increment(1)`로 +1 증가
   - 클라이언트에서 이 값을 읽어 첫번째 레벨 listOrder 생성에 사용

3. **대댓글 생성 시** (parentId가 존재하는 경우):
   - 게시글의 totalChildCount 증가 (1번 작업)
   - **추가로** `/comments/{postId}/{parentId}/childCount`를 `ServerValue.increment(1)`로 +1 증가
   - 부모 댓글 노드에 직접 자식 댓글 개수를 기록
   - 클라이언트에서 부모의 childCount를 읽어 listOrder 생성에 사용

4. **동시성 보장**:
   - `ServerValue.increment()` 사용으로 여러 사용자가 동시에 댓글을 작성해도 안전함
   - Atomic operation으로 childCount가 정확히 증가하여 중복 listOrder 방지
   - transaction 대비 간단하고 효율적인 카운터 관리

**예시**:

```typescript
// 사용자 A가 "003-02" 댓글에 답글을 달 때:
// 1. 부모 "003-02"의 childCount 읽기 → 1
// 2. 새 listOrder 생성 → "003-02-02"
// 3. 댓글 저장
// 4. Cloud Functions가:
//    - /posts/{postId}/totalChildCount를 증가 (총 댓글 수)
//    - /comments/{postId}/003-02/childCount를 2로 증가

// 동시에 사용자 B도 "003-02" 댓글에 답글을 달 때:
// 1. 부모 "003-02"의 childCount 읽기 → 2 (또는 1, 타이밍에 따라)
// 2. 새 listOrder 생성 → "003-02-03" (또는 "003-02-02")
// 3. 댓글 저장
// 4. Cloud Functions가:
//    - /posts/{postId}/totalChildCount를 증가 (총 댓글 수)
//    - /comments/{postId}/003-02/childCount를 3으로 증가 (또는 2로)

// 결과: "003-02-02", "003-02-03"으로 중복 없이 순차적으로 생성됨
```

**주의사항**:
- childCount와 totalChildCount는 클라이언트에서 직접 수정하지 않고, Cloud Functions에서만 관리
- 클라이언트는 읽기 전용으로만 사용 (listOrder 생성 및 UI 표시)
- `/posts/{postId}/totalChildCount`: 총 댓글 수 (모든 레벨 포함)
- `/posts/{postId}/childCount`: 첫번째 레벨 댓글 수만 카운트
- `/comments/{postId}/{commentId}/childCount`: 특정 댓글의 직접 자식 댓글 수

### 댓글 작성 모달 컴포넌트

**소스 코드 위치**: [repository/src/lib/components/comment/CommentCreateDialog.svelte.md](./repository/src/lib/components/comment/CommentCreateDialog.svelte.md)

**Props**:
```typescript
interface Props {
  open: boolean;                      // 모달 열림 상태 (bindable)
  messageId: string;                  // 게시글(채팅 메시지) ID
  parentId?: string | null;           // 부모 댓글 ID (최상위 댓글인 경우 null)
  parentText?: string | null;         // 부모 댓글 내용 (대댓글인 경우 표시)
  onClose?: () => void;               // 모달 닫기 콜백
  onCreated?: () => void;             // 댓글 생성 완료 콜백
}
```

**주요 기능**:
1. **텍스트 입력**: textarea로 댓글 내용 입력
   - 스페이스바 및 Enter 키 입력 지원
   - Dialog 컴포넌트의 키보드 이벤트 전파 차단: `onkeydown={(e) => e.stopPropagation()}`
2. **파일 업로드**: 이미지 및 동영상 첨부 지원
   - 실시간 업로드 진행률 표시
   - 파일 삭제 기능
3. **부모 댓글 표시**: 대댓글인 경우 답글 대상 표시
4. **저장/취소**: 댓글 생성 또는 취소

### PostCommentList 재사용 컴포넌트

**소스 코드 위치**: [repository/src/lib/components/post/PostCommentList.svelte.md](./repository/src/lib/components/post/PostCommentList.svelte.md)

**목적**: 댓글 목록 표시 로직을 재사용 가능한 컴포넌트로 분리하여 코드 중복 제거 및 유지보수성 향상

**Props**:
```typescript
interface Props {
  messageId: string;                   // 게시글(채팅 메시지) ID
  totalChildCount?: number;            // 총 댓글 개수
  onOpenCommentDialog: (              // 댓글 작성 모달 열기 콜백
    messageId: string,
    parentId?: string | null,
    parentText?: string | null
  ) => void;
}
```

**상태 관리**:
- `comments`: 댓글 목록 (`CommentWithMetadata[]`)
- `allCommentsLoaded`: 전체 댓글 로드 여부 (`boolean`)

**주요 기능**:

1. **자동 댓글 미리보기 로딩**:
   - `$effect()` 훅을 사용하여 `totalChildCount > 0`일 때 자동으로 마지막 3개 댓글 로드
   - `loadLastComments()` 함수 사용하여 성능 최적화
   ```typescript
   $effect(() => {
     if (totalChildCount > 0 && comments.length === 0 && !allCommentsLoaded) {
       loadLastCommentsForMessage();
     }
   });
   ```

2. **댓글 개수 표시**:
   - `totalChildCount` 값을 사용하여 총 댓글 개수 표시
   - "💬 (n)개의 댓글이 있습니다." 형태로 표시
   - 댓글이 없는 경우: "댓글이 없습니다." 표시

3. **더보기 버튼**:
   - `totalChildCount > 3`이고 전체 댓글이 로드되지 않은 경우에만 "더보기..." 버튼 표시
   - 클릭 시 `loadAllCommentsForMessage()` 호출하여 전체 댓글 로드

4. **댓글 쓰기 버튼**:
   - "💬 댓글 쓰기" 버튼으로 댓글 작성 모달 열기
   - 클릭 시 댓글이 로드되지 않았다면 마지막 3개 댓글 로드

5. **댓글 목록 표시**:
   - listOrder 순서로 정렬된 댓글 표시
   - depth에 따라 들여쓰기 적용 (`margin-left: {comment.depth * 24}px`)
   - 삭제된 댓글은 "삭제된 댓글입니다" 표시
   - 각 댓글에 "답글" 버튼 추가

6. **외부에서 호출 가능한 메서드**:
   ```typescript
   export async function refresh() {
     if (allCommentsLoaded) {
       await loadAllCommentsForMessage();
     } else {
       await loadLastCommentsForMessage();
     }
   }
   ```
   - 부모 컴포넌트에서 `bind:this`로 참조를 저장하고 `refresh()` 메서드 호출 가능
   - 댓글 작성 후 자동으로 댓글 목록 갱신 시 사용

**성능 최적화**:
- 초기 로드 시 마지막 3개 댓글만 가져와 성능 최적화
- 사용자가 "더보기" 클릭 시에만 전체 댓글 로드
- Firebase의 `limitToLast(3)` 쿼리 사용으로 불필요한 데이터 전송 방지

### 게시판 목록 페이지 통합

**소스 코드 위치**: [repository/src/routes/post/list/+page.svelte.md](./repository/src/routes/post/list/+page.svelte.md)

**PostCommentList 컴포넌트 사용**:

1. **컴포넌트 참조 저장**:
   ```typescript
   let commentListRefs = $state<Record<string, PostCommentList>>({});
   ```

2. **컴포넌트 통합**:
   ```svelte
   <PostCommentList
     bind:this={commentListRefs[messageId]}
     messageId={messageId}
     totalChildCount={message.totalChildCount || 0}
     onOpenCommentDialog={handleOpenCommentDialog}
   />
   ```

3. **댓글 작성 후 갱신**:
   ```typescript
   async function handleCommentCreated() {
     if (selectedMessageId && commentListRefs[selectedMessageId]) {
       await commentListRefs[selectedMessageId].refresh();
     }
   }
   ```

**기존 방식과의 차이점**:
- ❌ **기존**: 각 페이지에서 `commentsMap`, `allCommentsLoadedMap` 상태 관리 및 댓글 로딩 로직 중복
- ✅ **개선**: PostCommentList 컴포넌트로 모든 로직 캡슐화, 페이지는 단순히 컴포넌트 사용

**댓글 표시 예시**:
```
게시글 내용...
---
💬 3개의 댓글이 있습니다. [더보기...]  💬 댓글 쓰기

  댓글A (depth=0)
  댓글B (depth=0)
    댓글D (depth=1) <- 24px 들여쓰기
```

### 홈 페이지 통합

**소스 코드 위치**: [repository/src/routes/+page.svelte.md](./repository/src/routes/+page.svelte.md)

**PostCommentList 컴포넌트 사용**:

홈 페이지에서도 게시판 목록 페이지와 동일한 방식으로 PostCommentList 컴포넌트를 통합하여 일관된 댓글 표시 기능 제공:

1. **컴포넌트 참조 저장**:
   ```typescript
   let commentListRefs = $state<Record<string, PostCommentList>>({});
   ```

2. **컴포넌트 통합**:
   ```svelte
   <PostCommentList
     bind:this={commentListRefs[messageId]}
     messageId={messageId}
     totalChildCount={message.totalChildCount || 0}
     onOpenCommentDialog={handleOpenCommentDialog}
   />
   ```

3. **댓글 작성 후 갱신**:
   ```typescript
   async function handleCommentCreated() {
     if (selectedMessageId && commentListRefs[selectedMessageId]) {
       await commentListRefs[selectedMessageId].refresh();
     }
   }
   ```

**재사용 컴포넌트 사용의 이점**:
- 홈 페이지와 게시판 목록 페이지 모두 동일한 댓글 표시 UI/UX 제공
- 코드 중복 제거 (~200 라인 감소)
- 단일 소스 관리로 유지보수성 향상
- 버그 수정 시 한 곳만 수정하면 모든 페이지에 자동 반영

### 사용 예시

**1. 댓글 작성**:
1. 사용자가 게시글 아래 "💬 댓글" 버튼 클릭
2. `CommentCreateDialog` 모달 열림
3. 댓글 내용 및 첨부 파일 입력
4. "저장" 클릭
5. `createComment()` 함수 호출
   - 동일 레벨의 기존 댓글 목록 가져오기
   - `generateThreadOrder(null, existingOrders)` 호출하여 새 listOrder 생성
   - Firebase RTDB에 댓글 저장
6. 댓글 목록 다시 로드하여 화면에 반영

**2. 답글 작성**:
1. 사용자가 특정 댓글의 "답글" 버튼 클릭
2. `CommentCreateDialog` 모달 열림 (부모 댓글 정보 표시)
3. 답글 내용 입력
4. "저장" 클릭
5. `createComment()` 함수 호출
   - 부모 댓글의 listOrder 가져오기
   - 동일 레벨의 기존 답글 목록 가져오기
   - `generateThreadOrder(parentListOrder, existingOrders)` 호출하여 새 listOrder 생성
   - Firebase RTDB에 답글 저장
6. 댓글 목록 다시 로드하여 화면에 반영

### 주의사항

1. **listOrder 생성**: 반드시 `generateThreadOrder()` 함수 사용
2. **최대값 제한**: 999개/99개 제한을 초과하면 자동으로 최대값으로 고정
3. **계층 깊이**: 제한 없음 (하지만 UI에서 너무 깊은 계층은 가독성이 떨어질 수 있음)
4. **Soft Delete**: 댓글 삭제 시 물리적 삭제가 아닌 `deleted: true` 설정
5. **스페이스바 입력**: textarea에서 `onkeydown={(e) => e.stopPropagation()}` 필수

---

## 향후 개발 항목

1. **게시판 메인 페이지** (`/forum`)
   - 카테고리 탭 메뉴
   - 최신 게시글 목록
   - 카테고리별 통계

2. **카테고리 페이지** (`/forum/[category]`)
   - 카테고리별 게시글 목록
   - 게시글 작성 기능
   - 무한 스크롤

3. **게시글 상세 페이지** (`/forum/post/[messageId]`)
   - 게시글 내용 표시
   - 댓글 목록 및 작성
   - 좋아요 기능
   - 신고 기능

4. **게시판 검색 기능**
   - 제목 검색
   - 본문 검색
   - 작성자 검색
   - 카테고리 필터

5. **게시판 통계 대시보드**
   - 카테고리별 통계
   - 인기 게시글
   - 활동적인 사용자

6. **게시글 편집/삭제 기능**
   - 작성자만 수정 가능
   - 삭제 시 `deletedAt` 필드 설정
   - 편집 이력 관리

7. **관리자 기능**
   - 게시글/댓글 관리
   - 신고 처리
   - 사용자 제재

---

## 관련 문서

**필수 참고 문서:**
- [채팅 및 게시판 통합 시스템 개요](sonub-chat-overview.md) - 전체 아키텍처 이해
- [Firebase 데이터베이스 구조](sonub-firebase-database-structure.md) - 데이터 필드 상세
- [DatabaseListView 컴포넌트](sonub-firebase-database-list-view.md) - 목록 조회 구현

**관련 문서:**
- [Firebase Cloud Functions](sonub-firebase-functions.md) - Cloud Functions 구현
- [Firebase 보안 규칙](sonub-firebase-security-rules.md) - 데이터베이스 보안

