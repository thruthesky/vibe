---
name: sonub
version: 1.1.0
description: Firebase Realtime Database 구조 가이드 문서의 SED 사양 (소스 코드 기반 업데이트)
author: JaeHo Song
email: thruthesky@gmail.com
homepage: https://github.com/thruthesky/
funding: ""
license: GPL-3.0
dependencies: []
updated: 2025-11-20
---

# Firebase Realtime Database 구조 가이드

본 문서는 SNS 웹 애플리케이션의 Firebase Realtime Database 스키마 정의를 제공합니다.
**이 문서는 실제 소스 코드를 기반으로 작성되었으며, 모든 데이터베이스 구조의 중앙 참조 문서입니다.**

## 📋 문서의 범위

본 문서는 **데이터베이스 구조(스키마)와 구조에 대한 설명만** 포함합니다.

- ✅ **포함되는 내용**:
  - Firebase Realtime Database 경로 및 구조 정의
  - 각 필드의 타입 및 설명
  - 데이터 구조 예시
  - 클라이언트/백엔드 역할 구분 (어떤 필드를 누가 저장하는지)

- ❌ **포함되지 않는 내용**:
  - 구체적인 구현 코드 예제 (TypeScript, JavaScript)
  - 케이스별 상세 설명 및 사용 예시
  - API 함수 사용법

**구현 예제와 상세 설명**은 개별 기능 가이드 문서를 참고하세요.

---

## 🔥 RTDB 비용 최적화: 최소 데이터 읽기 원칙 (매우 중요)

**⚠️ Firebase Realtime Database는 읽기/쓰기 비용이 발생합니다. 따라서 클라이언트에서 RTDB 데이터를 읽을 때 반드시 최소한의 데이터만 읽어야 합니다.**

### 절대 원칙

1. **❌ 전체 노드 읽기 금지**
   ```typescript
   // ❌ 비효율적: 전체 사용자 노드 읽기
   const userRef = ref(database, `users/${uid}`);
   const snapshot = await get(userRef);  // 모든 필드 읽음 - 비용 낭비!
   ```

2. **✅ 필요한 필드만 읽기 (필수)**
   ```typescript
   // ✅ 효율적: 필요한 필드만 개별 읽기
   import { getUserFields } from '$lib/functions/user.functions';

   const userData = await getUserFields(uid, ['displayName', 'photoUrl']);
   // 또는 직접 읽기
   const displayNameRef = ref(database, `users/${uid}/displayName`);
   const snapshot = await get(displayNameRef);
   ```

3. **✅ 여러 필드를 병렬로 읽기**
   ```typescript
   // ✅ 여러 필드를 효율적으로 읽기
   const results = await Promise.all([
     get(ref(database, `users/${uid}/displayName`)),
     get(ref(database, `users/${uid}/photoUrl`))
   ]);
   ```

---

## 🔀 클라이언트와 백엔드의 데이터 책임 구분

Firebase Realtime Database에서는 클라이언트와 백엔드(Cloud Functions)가 각각 다른 필드를 관리합니다.

### 클라이언트 책임
- 사용자가 직접 입력하는 데이터 (displayName, photoUrl, gender 등)
- 즉시 반영되어야 하는 데이터

### Cloud Functions 책임
- 자동 계산되는 필드 (createdAt, updatedAt, registerOrder 등)
- 검색/정렬을 위한 인덱스 필드 (displayNameLowerCase, sort_* 등)
- 통계 데이터 (likeCount, commentCount 등)
- 역참조 관계 (likes-by, user-followers 등)

---

## 데이터베이스 전체 구조

```
/
├── users/                          # 사용자 프로필
├── user-action-counters/           # 사용자별 활동 통계 (좋아요, 댓글, 팔로우 등)
├── user-following/                 # 내가 팔로우한 사용자
├── user-followers/                 # 나를 팔로우한 사용자
├── user-feed/                      # 사용자 피드 (팔로우한 사람들의 메시지)
├── posts/                          # 게시글
├── comments/                       # 댓글
├── post-rankings/                  # 게시글 순위 (인기글)
├── likes/                          # 사용자별 좋아요 목록
├── likes-by/                       # 좋아요한 사용자 목록 (역참조)
├── chat-rooms/                     # 채팅방 정보
├── chat-messages/                  # 채팅 메시지
├── chat-joins/                     # 사용자별 채팅방 참여 정보
├── chat-invitations/               # 채팅 초대
├── chat-favorites/                 # 채팅 북마크
├── fcm-tokens/                     # FCM 푸시 알림 토큰
└── stats/                          # 전역 통계
    └── counters/                   # 전체 통계 카운터
```

---

## 통계 (stats/counters)

전역 통계 정보를 저장합니다.

### 데이터 구조

```
/stats/
└── counters/
    ├── user: 1234         # 전체 사용자 수
    ├── post: 567          # 전체 게시글 수
    ├── comment: 890       # 전체 댓글 수
    ├── like: 2345         # 전체 좋아요 수
    ├── chat: 4567         # 전체 채팅 메시지 수
    └── follow: 123        # 전체 팔로우 수
```

### 클라이언트/서버 역할 분리
- ✅ **Cloud Functions만 업데이트**: ServerValue.increment 사용
- ❌ 클라이언트는 읽기 전용

---

## 사용자 정보 (users)

사용자 프로필 정보는 `/users/<uid>/` 경로에 저장됩니다.

### 데이터 구조

```
/users/
└── <uid>/
    ├── displayName: "홍길동"                    # 닉네임 (클라이언트)
    ├── displayNameLowerCase: "홍길동"            # 검색용 (Cloud Functions)
    ├── photoUrl: "https://..."                   # 프로필 사진 URL (클라이언트)
    ├── gender: "M"                               # 성별: M(남자) | F(여자) (클라이언트)
    ├── birthYearMonthDay: "1990-01-15"           # 생년월일 YYYY-MM-DD (클라이언트)
    ├── birthYear: 1990                           # 생년 (Cloud Functions)
    ├── birthMonth: 1                             # 생월 (Cloud Functions)
    ├── birthDay: 15                              # 생일 (Cloud Functions)
    ├── birthMonthDay: "01-15"                    # 생월일 MM-DD (Cloud Functions)
    ├── createdAt: 1698473000000                  # 가입 시간 (Cloud Functions)
    ├── updatedAt: 1698474000000                  # 수정 시간 (Cloud Functions)
    ├── registerOrder: 9007199254740991           # 등록 순서 (최신순 정렬용, Cloud Functions)
    ├── sort_recentWithPhoto: -1698473000000      # 사진 있는 회원 정렬 (Cloud Functions)
    ├── sort_recentFemaleWithPhoto: -1698473000000 # 여성 회원 정렬 (Cloud Functions)
    └── sort_recentMaleWithPhoto: -1698473000000   # 남성 회원 정렬 (Cloud Functions)
```

### 필드 설명

| 필드 | 타입 | 필수 | 저장 주체 | 설명 |
|------|------|------|----------|------|
| `displayName` | string | ✅ | 클라이언트 | 사용자 닉네임 |
| `displayNameLowerCase` | string | ✅ | Cloud Functions | 검색용 (소문자 변환) |
| `photoUrl` | string | ❌ | 클라이언트 | 프로필 사진 URL |
| `gender` | "M" \| "F" | ❌ | 클라이언트 | 성별 (M: 남자, F: 여자) |
| `birthYearMonthDay` | string | ❌ | 클라이언트 | 생년월일 (YYYY-MM-DD) |
| `birthYear` | number | ❌ | Cloud Functions | 생년 (birthYearMonthDay에서 파싱) |
| `birthMonth` | number | ❌ | Cloud Functions | 생월 (birthYearMonthDay에서 파싱) |
| `birthDay` | number | ❌ | Cloud Functions | 생일 (birthYearMonthDay에서 파싱) |
| `birthMonthDay` | string | ❌ | Cloud Functions | 생월일 (MM-DD) |
| `createdAt` | number | ✅ | Cloud Functions | 계정 생성 시간 (타임스탬프) |
| `updatedAt` | number | ✅ | Cloud Functions | 프로필 수정 시간 (타임스탬프) |
| `registerOrder` | number | ✅ | Cloud Functions | 등록 순서 (Number.MAX_SAFE_INTEGER - createdAt) |
| `sort_recentWithPhoto` | number | ❌ | Cloud Functions | 사진 있는 회원 정렬 (-createdAt, photoUrl 있을 때만) |
| `sort_recentFemaleWithPhoto` | number | ❌ | Cloud Functions | 여성 회원 정렬 (-createdAt, gender="F" && photoUrl 있을 때) |
| `sort_recentMaleWithPhoto` | number | ❌ | Cloud Functions | 남성 회원 정렬 (-createdAt, gender="M" && photoUrl 있을 때) |

### registerOrder 필드 상세 설명

`registerOrder`는 최신 사용자를 오름차순으로 정렬하기 위한 필드입니다.

**계산 공식:**
```typescript
registerOrder = Number.MAX_SAFE_INTEGER - createdAt
```

**특징:**
- 최신 사용자일수록 **작은 값**을 가집니다
- 오름차순 정렬 시 최신 사용자가 먼저 표시됩니다
- 내림차순으로 정렬할 필요 없이 `orderByChild('registerOrder')`만으로 최신순 정렬 가능

**사용 예시:**
```typescript
// 최근 가입한 사용자 15명 조회
const query = ref(database, 'users');
const sorted = query(
  ref(database, 'users'),
  orderByChild('registerOrder'),
  limitToFirst(15)
);
```

### 정렬 필드 (`sort_*`) 상세 설명

정렬 필드는 조건부로 생성되며, 특정 조건을 만족하는 사용자만 해당 필드를 가집니다.

| 필드 | 생성 조건 | 값 | 용도 |
|------|-----------|-----|------|
| `sort_recentWithPhoto` | photoUrl이 있을 때 | `-createdAt` | 사진 있는 전체 회원 정렬 |
| `sort_recentFemaleWithPhoto` | gender="F" && photoUrl 있을 때 | `-createdAt` | 사진 있는 여성 회원 정렬 |
| `sort_recentMaleWithPhoto` | gender="M" && photoUrl 있을 때 | `-createdAt` | 사진 있는 남성 회원 정렬 |

**음수 타임스탬프를 사용하는 이유:**
- Firebase RTDB는 오름차순 정렬이 기본
- 음수 값으로 저장하면 오름차순 정렬 시 최신 데이터가 먼저 표시됨

### 클라이언트/서버 역할 분리

**클라이언트 저장:**
- `displayName`
- `photoUrl`
- `gender`
- `birthYearMonthDay`

**Cloud Functions 자동 저장/업데이트:**
- `createdAt` (사용자 생성 시)
- `registerOrder` (사용자 생성 시)
- `displayNameLowerCase` (displayName 변경 시)
- `birthYear`, `birthMonth`, `birthDay`, `birthMonthDay` (birthYearMonthDay 변경 시)
- `sort_recentWithPhoto` (photoUrl 변경 시)
- `sort_recentFemaleWithPhoto` (gender 또는 photoUrl 변경 시)
- `sort_recentMaleWithPhoto` (gender 또는 photoUrl 변경 시)
- `updatedAt` (displayName, photoUrl, birthYearMonthDay 중 하나라도 변경 시)

### ⚠️ 중요: Firebase Auth vs RTDB 필드

**/users/<uid> 노드에는 Firebase Auth 정보를 저장하지 않습니다:**

Firebase Authentication의 다음 필드들은 `/users/<uid>` 노드에 **저장하지 않습니다**:
- ❌ `phoneNumber` - Firebase Auth에서만 관리
- ❌ `email` - Firebase Auth에서만 관리
- ❌ `photoURL` (대문자 URL) - Firebase Auth에서만 관리

**단, `photoUrl`(camelCase)은 예외입니다:**
- ✅ **`photoUrl`** (camelCase) - 사용자가 직접 업로드한 프로필 사진 URL을 RTDB에 저장

### 관련 가이드

다른 spec 파일에서 사용자 데이터베이스 구조가 필요한 경우, 이 문서를 참조하세요:
- **참조 방법**: `[데이터베이스 구조](./sonub-firebase-database-structure.md#사용자-정보-users)`

---

## 사용자별 활동 통계 (user-action-counters)

사용자별 활동 통계를 저장합니다.

### 데이터 구조

```
/user-action-counters/
└── <uid>/
    ├── user: 1         # 사용자 생성 (항상 1)
    ├── like: 10        # 사용자가 누른 좋아요 수
    ├── comment: 5      # 사용자가 작성한 댓글 수
    ├── post: 3         # 사용자가 작성한 게시글 수
    ├── chat: 20        # 사용자가 보낸 채팅 메시지 수
    └── follow: 2       # 사용자가 팔로우한 수
```

### 클라이언트/서버 역할 분리
- ✅ **Cloud Functions만 관리**: ServerValue.increment 사용
- ❌ 클라이언트는 읽기 전용

### 관련 가이드
다른 spec 파일에서 이 구조가 필요한 경우, 이 문서를 참조하세요:
- **참조 방법**: `[데이터베이스 구조](./sonub-firebase-database-structure.md#사용자별-활동-통계-user-action-counters)`

---

## 게시글 (posts)

게시글 정보는 `/posts/<postId>/` 경로에 저장됩니다.

### 데이터 구조

```
/posts/
└── <postId>/
    ├── uid: "author-uid"                      # 작성자 UID (클라이언트)
    ├── author: "홍길동"                       # 작성자 닉네임 (클라이언트)
    ├── title: "게시글 제목"                   # 제목 (클라이언트)
    ├── content: "게시글 내용"                 # 내용 (클라이언트)
    ├── category: "discussion"                 # 카테고리 (클라이언트)
    ├── createdAt: 1698473000000               # 작성 시간 (클라이언트)
    ├── updatedAt: 1698474000000               # 수정 시간 (클라이언트)
    ├── order: -1698473000000                  # 기본 정렬 (Cloud Functions)
    ├── categoryOrder: "discussion--1698473000000"  # 카테고리별 정렬 (Cloud Functions)
    ├── allCategoryOrder: -1698473000000       # 전체 카테고리 정렬 (Cloud Functions)
    ├── likeCount: 10                          # 좋아요 개수 (Cloud Functions)
    ├── commentCount: 5                        # 첫 레벨 댓글 수 (Cloud Functions)
    └── totalChildCount: 15                    # 모든 댓글 수 (Cloud Functions)
```

### 필드 설명

| 필드 | 타입 | 필수 | 저장 주체 | 설명 |
|------|------|------|----------|------|
| `uid` | string | ✅ | 클라이언트 | 작성자 UID |
| `author` | string | ✅ | 클라이언트 | 작성자 닉네임 |
| `title` | string | ✅ | 클라이언트 | 게시글 제목 |
| `content` | string | ❌ | 클라이언트 | 게시글 내용 |
| `category` | string | ✅ | 클라이언트 | 카테고리 |
| `createdAt` | number | ✅ | 클라이언트 | 작성 시간 |
| `updatedAt` | number | ❌ | 클라이언트 | 수정 시간 |
| `order` | number | ✅ | Cloud Functions | 기본 정렬 (-createdAt) |
| `categoryOrder` | string | ✅ | Cloud Functions | 카테고리별 정렬 ("{category}--{-createdAt}") |
| `allCategoryOrder` | number | ✅ | Cloud Functions | 전체 카테고리 정렬 (-createdAt) |
| `likeCount` | number | ✅ | Cloud Functions | 좋아요 개수 (기본값: 0) |
| `commentCount` | number | ✅ | Cloud Functions | 첫 레벨 댓글 수 |
| `totalChildCount` | number | ✅ | Cloud Functions | 모든 댓글 수 (대댓글 포함) |

### 정렬 필드 상세 설명

| 필드 | 값 | 용도 |
|------|-----|------|
| `order` | `-createdAt` | 기본 정렬 (최신순) |
| `categoryOrder` | `"{category}--{-createdAt}"` | 카테고리별 정렬 |
| `allCategoryOrder` | `-createdAt` | 전체 카테고리 통합 정렬 |

### 관련 가이드
다른 spec 파일에서 이 구조가 필요한 경우, 이 문서를 참조하세요:
- **참조 방법**: `[데이터베이스 구조](./sonub-firebase-database-structure.md#게시글-posts)`

---

## 댓글 (comments)

댓글 정보는 `/comments/<postId>/<commentId>/` 경로에 저장됩니다.

### 데이터 구조

```
/comments/
└── <postId>/
    └── <commentId>/
        ├── postId: "post-123"                 # 소속 게시글 ID (클라이언트)
        ├── uid: "author-uid"                  # 작성자 UID (클라이언트)
        ├── content: "댓글 내용"               # 내용 (클라이언트)
        ├── parentId: null                     # 부모 댓글 ID (클라이언트, 최상위는 null)
        ├── depth: 1                           # 댓글 깊이 (클라이언트, 1~12)
        ├── createdAt: 1698473000000           # 작성 시간 (클라이언트)
        ├── updatedAt: 1698474000000           # 수정 시간 (클라이언트)
        ├── order: "post-123--1698473000000"   # 정렬 필드 (Cloud Functions)
        ├── likeCount: 5                       # 좋아요 개수 (Cloud Functions)
        ├── commentCount: 2                    # 대댓글 수 (Cloud Functions)
        ├── totalChildCount: 5                 # 모든 대댓글 수 (Cloud Functions)
        └── childCount: 2                      # 직접 자식 댓글 수 (Cloud Functions)
```

### 필드 설명

| 필드 | 타입 | 필수 | 저장 주체 | 설명 |
|------|------|------|----------|------|
| `postId` | string | ✅ | 클라이언트 | 소속 게시글 ID |
| `uid` | string | ✅ | 클라이언트 | 작성자 UID |
| `content` | string | ✅ | 클라이언트 | 댓글 내용 |
| `parentId` | string \| null | ✅ | 클라이언트 | 부모 댓글 ID (최상위는 null) |
| `depth` | number | ✅ | 클라이언트 | 댓글 깊이 (1~12) |
| `createdAt` | number | ✅ | 클라이언트 | 작성 시간 |
| `updatedAt` | number | ❌ | 클라이언트 | 수정 시간 |
| `order` | string | ✅ | Cloud Functions | 정렬 필드 ("{postId}--{-createdAt}") |
| `likeCount` | number | ✅ | Cloud Functions | 좋아요 개수 |
| `commentCount` | number | ✅ | Cloud Functions | 대댓글 수 (totalChildCount와 동일) |
| `totalChildCount` | number | ✅ | Cloud Functions | 모든 대댓글 수 |
| `childCount` | number | ✅ | Cloud Functions | 직접 자식 댓글 수 (첫 레벨만) |

### 관련 가이드
다른 spec 파일에서 이 구조가 필요한 경우, 이 문서를 참조하세요:
- **참조 방법**: `[데이터베이스 구조](./sonub-firebase-database-structure.md#댓글-comments)`

---

## 채팅 메시지 (chat-messages)

채팅 메시지는 `/chat-messages/<roomId>/<messageId>/` 경로에 저장됩니다.

### 데이터 구조

```
/chat-messages/
└── <roomId>/
    └── <messageId>/
        ├── roomId: "single-uid1-uid2"         # 채팅방 ID (클라이언트)
        ├── type: "message"                    # 타입: "message" | "post" (클라이언트)
        ├── text: "안녕하세요"                  # 메시지 내용 (클라이언트)
        ├── urls: ["https://..."]              # 첨부 URL 배열 (클라이언트)
        ├── senderUid: "sender-uid"            # 발신자 UID (클라이언트)
        ├── createdAt: 1698473000000           # 생성 시간 (클라이언트)
        ├── editedAt: null                     # 수정 시간 (클라이언트)
        ├── deletedAt: null                    # 삭제 시간 (클라이언트)
        ├── protocol: null                     # 프로토콜 메시지 (클라이언트, join/leave 등)
        ├── roomOrder: "-single-uid1-uid2-1698473000000"  # 채팅방별 정렬 (Cloud Functions)
        ├── rootOrder: null                    # 루트 정렬 (Cloud Functions, 서브 채팅방용)
        ├── openOrder: -1698473000000          # 오픈 채팅 전역 정렬 (Cloud Functions)
        ├── categoryOrder: null                # 카테고리별 정렬 (Cloud Functions, type="post"만)
        └── likeCount: 3                       # 좋아요 개수 (Cloud Functions)
```

### type: "post"인 경우 추가 필드

```
├── category: "discussion"                     # 게시판 카테고리 (클라이언트)
├── title: "게시글 제목"                       # 제목 (클라이언트)
└── categoryOrder: "discussion--1698473000000" # 카테고리별 정렬 (Cloud Functions)
```

### 관련 가이드
다른 spec 파일에서 이 구조가 필요한 경우, 이 문서를 참조하세요:
- **참조 방법**: `[데이터베이스 구조](./sonub-firebase-database-structure.md#채팅-메시지-chat-messages)`

---

## 채팅방 (chat-rooms)

채팅방 정보는 `/chat-rooms/<roomId>/` 경로에 저장됩니다.

### 데이터 구조

```
/chat-rooms/
└── <roomId>/
    ├── type: "single"                         # 타입: "single" | "group" | "open" (클라이언트)
    ├── name: "채팅방 이름"                     # 이름 (클라이언트)
    ├── description: "설명"                    # 설명 (클라이언트)
    ├── owner: "owner-uid"                     # 소유자 UID (클라이언트, 보안 규칙 제한)
    ├── members: {                             # 참여자 목록 (클라이언트)
    │   "uid1": true,                          # true: 알림 수신, false: 알림 미수신
    │   "uid2": false
    │ }
    ├── createdAt: 1698473000000               # 생성 시간 (Cloud Functions)
    ├── memberCount: 2                         # 참여자 수 (Cloud Functions)
    ├── groupListOrder: "-1698473000000"       # 그룹 채팅방 정렬 (Cloud Functions)
    └── openListOrder: "-1698473000000"        # 오픈 채팅방 정렬 (Cloud Functions)
```

### 클라이언트/서버 역할 분리

**채팅방 생성 시:**
- 클라이언트: `type`, `name`, `description`, `owner`, `members`
- Cloud Functions: `createdAt`, `memberCount`, `groupListOrder`, `openListOrder`

### 관련 가이드
다른 spec 파일에서 이 구조가 필요한 경우, 이 문서를 참조하세요:
- **참조 방법**: `[데이터베이스 구조](./sonub-firebase-database-structure.md#채팅방-chat-rooms)`

---

## 채팅방 참여 (chat-joins)

사용자별 채팅방 참여 정보는 `/chat-joins/<uid>/<roomId>/` 경로에 저장됩니다.

### 데이터 구조

```
/chat-joins/
└── <uid>/
    └── <roomId>/
        ├── roomId: "single-uid1-uid2"         # 채팅방 ID (클라이언트)
        ├── roomType: "single"                 # 채팅방 타입 (클라이언트)
        ├── roomName: "채팅방 이름"            # 채팅방 이름 (클라이언트)
        ├── partnerUid: "uid2"                 # 1:1 채팅의 상대방 UID (클라이언트)
        ├── joinedAt: 1698473000000            # 참여 시간 (클라이언트)
        ├── lastMessageText: "안녕하세요"       # 마지막 메시지 (Cloud Functions)
        ├── lastMessageAt: 1698474000000       # 마지막 메시지 시간 (Cloud Functions)
        ├── updatedAt: 1698474000000           # 업데이트 시간 (Cloud Functions)
        ├── newMessageCount: 5                 # 읽지 않은 메시지 수 (Cloud Functions)
        ├── singleChatListOrder: "-1698474000000"                # 1:1 채팅 정렬 (Cloud Functions)
        ├── groupChatListOrder: "-1698474000000"                 # 그룹 채팅 정렬 (Cloud Functions)
        ├── openChatListOrder: -1698474000000                    # 오픈 채팅 정렬 (Cloud Functions)
        ├── openAndGroupChatListOrder: -1698474000000            # 그룹+오픈 통합 정렬 (Cloud Functions)
        └── allChatListOrder: -1698474000000                     # 모든 채팅방 통합 정렬 (Cloud Functions)
```

### 정렬 필드 상세 설명

**읽음/읽지 않음 상태 구분:**
- 읽음 상태: `-timestamp`
- 읽지 않음 상태: `-timestamp - UNREAD_OFFSET` (UNREAD_OFFSET = 200)

**정렬 필드 종류:**
| 필드 | 타입 | 용도 |
|------|------|------|
| `singleChatListOrder` | string | 1:1 채팅 목록 정렬 |
| `groupChatListOrder` | string \| number | 그룹 채팅 목록 정렬 |
| `openChatListOrder` | string \| number | 오픈 채팅 목록 정렬 |
| `openAndGroupChatListOrder` | number | 그룹+오픈 통합 목록 정렬 |
| `allChatListOrder` | number | 모든 채팅방 통합 목록 정렬 |

### 관련 가이드
다른 spec 파일에서 이 구조가 필요한 경우, 이 문서를 참조하세요:
- **참조 방법**: `[데이터베이스 구조](./sonub-firebase-database-structure.md#채팅방-참여-chat-joins)`

---

## 좋아요 (likes / likes-by)

좋아요 정보는 두 경로에 저장됩니다.

### 데이터 구조

```
/likes/
└── <uid>/                                    # 사용자별 좋아요 목록
    └── <targetId>: "post"                    # 좋아요 대상 타입

/likes-by/
└── <targetId>/                               # 좋아요 대상별 사용자 목록 (역참조)
    └── <uid>: true                           # Cloud Functions만 관리
```

### targetType 값

- `"post"`: 게시글
- `"comment"`: 댓글
- `"chat-message-{roomId}"`: 채팅 메시지 (예: "chat-message-single-uid1-uid2")

### 클라이언트/서버 역할 분리

**`/likes/{uid}/{targetId}`:**
- 클라이언트: 생성/삭제
- Cloud Functions: targetType 값 저장

**`/likes-by/{targetId}/{uid}`:**
- Cloud Functions만 관리 (역참조)

### 관련 가이드
다른 spec 파일에서 이 구조가 필요한 경우, 이 문서를 참조하세요:
- **참조 방법**: `[데이터베이스 구조](./sonub-firebase-database-structure.md#좋아요-likes--likes-by)`

---

## 팔로우 관계 (user-following / user-followers)

팔로우 관계는 두 경로에 저장됩니다.

### 데이터 구조

```
/user-following/
└── <uid>/                                    # 내가 팔로우한 사람
    └── <targetUid>: true                     # 클라이언트가 생성/삭제

/user-followers/
└── <uid>/                                    # 나를 팔로우한 사람 (역참조)
    └── <followerUid>: true                   # Cloud Functions만 관리
```

### 클라이언트/서버 역할 분리

**`/user-following/{uid}/{targetUid}`:**
- 클라이언트: 생성/삭제

**`/user-followers/{uid}/{followerUid}`:**
- Cloud Functions만 관리 (역참조)

### 관련 가이드
다른 spec 파일에서 이 구조가 필요한 경우, 이 문서를 참조하세요:
- **참조 방법**: `[데이터베이스 구조](./sonub-firebase-database-structure.md#팔로우-관계-user-following--user-followers)`

---

## 사용자 피드 (user-feed)

팔로우한 사용자들의 메시지 피드를 저장합니다 (fan-out 방식).

### 데이터 구조

```
/user-feed/
└── <uid>/
    └── <messageId>: 1698473000000            # 메시지 생성 시간
```

### 클라이언트/서버 역할 분리
- ✅ **Cloud Functions만 관리**: 메시지 생성 시 팔로워들에게 자동 전파

### 관련 가이드
다른 spec 파일에서 이 구조가 필요한 경우, 이 문서를 참조하세요:
- **참조 방법**: `[데이터베이스 구조](./sonub-firebase-database-structure.md#사용자-피드-user-feed)`

---

## 게시글 순위 (post-rankings)

인기 게시글 순위를 저장합니다.

### 데이터 구조

```
/post-rankings/
├── daily/
│   └── <yyyyMMdd>/
│       └── <postId>: -score                  # 점수 (음수)
├── weekly/
│   └── <yyyyWww>/
│       └── <postId>: -score
└── monthly/
    └── <yyyyMM>/
        └── <postId>: -score
```

### 점수 계산

```typescript
score = (likeCount × 1) + (commentCount × 2)
저장값 = -score  // 음수로 저장하여 내림차순 정렬
```

### 클라이언트/서버 역할 분리
- ✅ **Cloud Functions만 관리**: 좋아요/댓글 변경 시 자동 업데이트

### 관련 가이드
다른 spec 파일에서 이 구조가 필요한 경우, 이 문서를 참조하세요:
- **참조 방법**: `[데이터베이스 구조](./sonub-firebase-database-structure.md#게시글-순위-post-rankings)`

---

## 채팅 초대 (chat-invitations)

채팅방 초대 정보는 `/chat-invitations/<uid>/<roomId>/` 경로에 저장됩니다.

### 데이터 구조

```
/chat-invitations/
└── <uid>/                                    # 초대받은 사용자
    └── <roomId>/
        ├── roomId: "group-abc123"            # 채팅방 ID (클라이언트)
        ├── roomType: "group"                 # 타입: "group" | "open" (클라이언트)
        ├── inviterUid: "inviter-uid"         # 초대한 사람 UID (클라이언트)
        ├── createdAt: 1698473000000          # 생성 시간 (클라이언트)
        ├── roomName: "채팅방 이름"           # 채팅방 이름 (Cloud Functions)
        ├── inviterName: "홍길동"             # 초대한 사람 이름 (Cloud Functions)
        ├── message: "초대 메시지"            # 초대 메시지 (Cloud Functions)
        └── invitationOrder: "-1698473000000" # 정렬 필드 (Cloud Functions)
```

### 관련 가이드
다른 spec 파일에서 이 구조가 필요한 경우, 이 문서를 참조하세요:
- **참조 방법**: `[데이터베이스 구조](./sonub-firebase-database-structure.md#채팅-초대-chat-invitations)`

---

## 채팅 북마크 (chat-favorites)

채팅방 북마크는 `/chat-favorites/<uid>/<roomId>/` 경로에 저장됩니다.

### 데이터 구조

```
/chat-favorites/
└── <uid>/
    └── <roomId>: true                        # 클라이언트가 생성/삭제
```

### 관련 가이드
다른 spec 파일에서 이 구조가 필요한 경우, 이 문서를 참조하세요:
- **참조 방법**: `[데이터베이스 구조](./sonub-firebase-database-structure.md#채팅-북마크-chat-favorites)`

---

## FCM 토큰 (fcm-tokens)

FCM 푸시 알림 토큰은 `/fcm-tokens/<uid>/<token>/` 경로에 저장됩니다.

### 데이터 구조

```
/fcm-tokens/
└── <uid>/
    └── <token>: {
        platform: "web",                       # 플랫폼: "web" | "ios" | "android"
        createdAt: 1698473000000,              # 생성 시간
        updatedAt: 1698474000000               # 업데이트 시간
    }
```

### 클라이언트/서버 역할 분리
- 클라이언트: 토큰 등록/삭제
- Cloud Functions: 푸시 알림 발송 시 사용

### 관련 가이드
다른 spec 파일에서 이 구조가 필요한 경우, 이 문서를 참조하세요:
- **참조 방법**: `[데이터베이스 구조](./sonub-firebase-database-structure.md#fcm-토큰-fcm-tokens)`

---

## 주요 설계 원칙

### 1. Flat Style 구조
- 깊은 중첩 구조를 피하고 플랫하게 구성
- 각 데이터는 독립적인 경로에 저장

### 2. 역정규화 (Denormalization)
- 조회 성능 향상을 위해 데이터 중복 저장
- 예: chat-joins에 lastMessageText 중복 저장

### 3. Cloud Functions 활용
- 자동 계산 필드는 Cloud Functions에서 관리
- ServerValue.increment로 동시성 안전성 확보

### 4. 보안 규칙
- 클라이언트는 자신의 데이터만 수정 가능
- Cloud Functions는 모든 데이터 수정 가능

---

## 참고 자료

- [Firebase Realtime Database 공식 문서](https://firebase.google.com/docs/database)
- [Firebase Admin SDK 문서](https://firebase.google.com/docs/admin/setup)
- [Sonub Cloud Functions 핸들러 코드](./repository/firebase/functions/src/handlers/)
- [Sonub 타입 정의](./repository/firebase/functions/src/types/index.ts)

---

**이 문서는 실제 소스 코드를 기반으로 작성되었으며, 모든 기능별 spec 문서에서 참조하는 중앙 데이터베이스 구조 문서입니다.**
