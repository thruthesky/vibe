---
name: sonub
version: 1.0.0
description: 친구/팔로잉/팔로워 관계 및 홈 피드 연동 개요
author: JaeHo Song
email: thruthesky@gmail.com
license: GPL-3.0
step: 55
priority: "**"
dependencies:
  - sonub-user-overview.md
  - sonub-firebase-database-structure.md
  - sonub-store-user-profile.md
tags:
  - friends
  - following
  - follower
  - feed
  - social
---

## 개요
- 본 문서는 Sonub에서 **친구(Following/Follower)** 관계를 정의하고, 친구의 활동을 사용자의 홈 피드에 노출시키기 위한 데이터 구조와 워크플로를 설명합니다.
- Chat 탭과 게시판에서 모두 동일한 친구 관계 정보를 공유하며, 채팅 초대/추천/탐색 기능과 홈 피드를 하나의 스펙으로 관리합니다.

## 친구 관계의 정의 및 용어

본 섹션에서는 Sonub의 친구 관계를 구성하는 핵심 용어와 개념을 명확히 정의합니다. 이를 통해 개발 과정에서의 혼동을 방지하고 일관된 명칭을 사용합니다.

### 1. 팔로우 (Follow)

**정의**: 내가 그 사람을 따르겠다, 내가 그 사람의 글(또는 메시지)을 구독하겠다는 의미입니다.

**동작 방식**:
- A가 B를 팔로우하면, B가 작성한 글이 A에게 전달됩니다.
- 이렇게 전달되는 형상(동작 방식)을 **피드(Feed)**라고 합니다.

**예시**:
- 사용자 A가 사용자 B를 팔로우
- B가 새 게시글을 작성
- A의 홈 피드에 B의 게시글이 표시됨

### 2. 팔로잉 (Following)

**정의**: 내가 이 사람을 팔로우하고 있다(Follow+ing)라는 의미입니다.

**관계 표현**:
- A가 B를 팔로우한 상태이면, "A가 B를 팔로잉한다"고 표현합니다.
- 팔로우와 팔로잉은 같은 의미로 사용됩니다.
- 차이점: 팔로우는 **동작(행위)**을, 팔로잉은 **상태(진행 중)**를 강조합니다.

**데이터 저장**:
- Firebase 경로: `/user-following/{uid}/{targetUid}: true`
- A의 팔로잉 목록에 B가 포함됨

### 3. 팔로워 (Follower)

**정의**: 따르는 사람, 팬을 의미합니다.

**관계 표현**:
- A가 B를 팔로잉하면, **A는 B의 팔로워**가 됩니다.
- 즉, 나의 팔로워가 많다는 의미는 나를 팔로우한 사람이 많다는 의미입니다.

**관점의 차이**:
- **A 입장**: B를 "팔로잉"하는 것
- **B 입장**: A가 "팔로워"가 됨 (A가 B의 팬)

**데이터 저장**:
- Firebase 경로: `/user-followers/{uid}/{followerUid}: true`
- B의 팔로워 목록에 A가 포함됨

### 4. 친구 (Friend) 관계 또는 맞팔로우

**정의**: 맞팔로우는 서로 팔로우한 상태를 의미합니다.

**조건**:
- A가 B를 팔로우하고
- B도 A를 팔로우하는 경우

**명칭**:
- 이러한 상호 팔로우 관계를 **"친구(Friend)" 관계**라고 부릅니다.
- 또는 **"맞팔로우(Mutual Follow)"**라고도 표현합니다.

**UI 표시**:
- 프로필 화면에서 "친구" 또는 "상호 팔로우" 상태로 표시
- 일반 팔로우/팔로잉과 구분하여 사용자에게 관계를 명확히 전달

### 용어 정리 표

| 용어 | 영문 | 정의 | 데이터 경로 |
|------|------|------|------------|
| 팔로우 | Follow | 내가 그 사람의 글을 구독하는 행위 | `/user-following/{me}/{target}` |
| 팔로잉 | Following | 내가 팔로우하고 있는 상태 | `/user-following/{me}/{target}` |
| 팔로워 | Follower | 나를 팔로우하는 사람 (나의 팬) | `/user-followers/{me}/{follower}` |
| 친구/맞팔로우 | Friend/Mutual Follow | 서로 팔로우한 상태 | 양쪽 경로 모두 존재 |

## 핵심 목표
1. `팔로우 → 팔로잉 목록 업데이트 → 홈 피드 반영`까지 일관된 UX 제공
2. `/user-following`, `/user-followers` 두 경로만으로 관계 파생 데이터를 구성하여 유지보수 최소화
3. Cloud Functions가 게시글/메시지 생성 시 팔로워에게 알림·피드 반영을 수행
4. Privacy 컨트롤(차단, 공개 범위) 확장을 고려한 구조 유지

## 데이터 구조

### 팔로우/팔로워 관계
- `/user-following/{uid}/{targetUid}: true`
  - 사용자가 팔로우한 대상 UID 목록
  - 클라이언트에서 직접 읽기/쓰기 가능
  - 팔로우 버튼 클릭 시 생성, 언팔로우 시 삭제

- `/user-followers/{uid}/{followerUid}: true`
  - 사용자를 팔로우하는 UID 목록 (역참조)
  - **읽기 전용** (Cloud Functions만 쓰기 가능)
  - Fan-out 시 이 목록을 순회하여 피드 생성

### 글 원본 저장소
- `/chat-messages/{messageId}`
  - 모든 채팅 메시지 및 게시글의 원본 데이터
  - 필드: `senderId`, `text`, `urls`, `createdAt`, `category`, `categoryOrder`, `type` 등
  - **단일 진실 공급원 (Single Source of Truth)**: 모든 내용은 여기서만 저장 및 수정

### 유저별 피드 (최소 정보만 저장)
- `/user-feed/{uid}/{messageId}: createdAt (timestamp)`
  - **value**: 글 작성 시간 (정렬/페이징용)
  - **key**: messageId (원본 참조용)
  - **최소 정보 원칙**: 피드는 인덱스 역할만 하며, 실제 내용은 `/chat-messages/{messageId}`에서 조회
  - Fan-out 시 자동 생성, 글 삭제 시 자동 제거

### Cloud Functions 파생 데이터
- `onUserFollowingCreate`: `/user-following` 생성 시
  - `/user-followers` 동기화
  - target에게 알림 전송

- `onChatMessageCategoryCreate`: 글 작성 시 (category 필드 생성)
  - 작성자의 `/user-followers` 목록 조회
  - 각 follower의 `/user-feed/{followerUid}/{messageId}`에 fan-out
  - 본인 피드에도 추가 (`/user-feed/{authorUid}/{messageId}`)

- `onChatMessageDeleted`: 글 삭제 시 (deleted: true 설정)
  - 해당 messageId로 fan-out된 모든 피드 제거
  - Multi-path update로 일괄 삭제

## Fan-out 피드 시스템 핵심 개념

### 단일 진실 공급원 (Single Source of Truth)
- **원본 데이터**: `/chat-messages/{messageId}`에만 모든 내용 저장
- **피드 데이터**: `/user-feed/{uid}/{messageId}`는 정렬용 타임스탬프만 저장
- **중요 원칙**: 피드는 "인덱스 + 참조 키" 역할만 수행

### 최소 정보 원칙
피드를 읽을 때 항상 최소한의 데이터만 RTDB에서 가져옵니다:

1. **피드 목록**: `/user-feed/{myUid}`에서 messageId 목록 조회
2. **글 정보**: `/chat-messages/{messageId}`에서 4개 필드만 읽기
   - `senderId`: 작성자 UID
   - `text`: 글 내용
   - `urls`: 첨부 파일 URL
   - `createdAt`: 작성 시간
3. **사용자 정보**: `/users/{senderId}`에서 2개 필드만 읽기
   - `displayName`: 표시 이름
   - `photoUrl`: 프로필 사진

### Fan-out 최적화
- **Multi-path update 사용**: 한 번의 RTDB 호출로 모든 팔로워 피드 업데이트
- **본인 피드 포함**: 작성자 본인의 피드에도 자동 추가
- **삭제 시 정리**: 글 삭제 시 fan-out된 모든 피드 데이터 일괄 제거

### 예시
사용자 B가 글을 작성하면:
```
/chat-messages/msg123 = { senderId: "B", text: "Hello", createdAt: 1710000000 }
/user-feed/B/msg123 = 1710000000
/user-feed/A/msg123 = 1710000000  (A는 B의 팔로워)
/user-feed/C/msg123 = 1710000000  (C는 B의 팔로워)
```

클라이언트가 A의 피드를 읽을 때:
1. `/user-feed/A` 조회 → `[msg123, msg456, ...]` 목록 획득
2. `/chat-messages/msg123` → `{ senderId, text, urls, createdAt }` 만 읽기
3. `/users/B` → `{ displayName, photoUrl }` 만 읽기
4. UI 렌더링

## 클라이언트 읽기 패턴

### 홈 피드 구독 (실시간)
```typescript
// 1. 내 피드 목록 실시간 구독
const feedRef = database.ref(`user-feed/${myUid}`)
  .orderByValue()  // createdAt 기준 정렬
  .limitToLast(20);  // 최신 20개

feedRef.on('value', (snapshot) => {
  const messageIds = Object.keys(snapshot.val() || {});

  // 2. 각 messageId로 원본 조회
  messageIds.forEach(messageId => {
    database.ref(`chat-messages/${messageId}`)
      .once('value', (msgSnapshot) => {
        const { senderId, text, urls, createdAt } = msgSnapshot.val();

        // 3. 사용자 정보 조회
        database.ref(`users/${senderId}`)
          .once('value', (userSnapshot) => {
            const { displayName, photoUrl } = userSnapshot.val();

            // 4. UI 렌더링
            renderFeedItem({ senderId, text, urls, createdAt, displayName, photoUrl });
          });
      });
  });
});
```

### 페이지네이션
```typescript
// startAt을 사용하여 이전 데이터 로드
const feedRef = database.ref(`user-feed/${myUid}`)
  .orderByValue()
  .endAt(lastCreatedAt)  // 이전에 로드한 마지막 timestamp
  .limitToLast(20);
```

## UI/UX 요구사항
1. **프로필/친구 버튼**
   - `/user/{uid}` 또는 `/my/profile`에서 `팔로우/언팔로우` 버튼 제공
   - 상태(팔로잉/상호팔로우/미팔로우)를 실시간 표시
2. **친구 찾기**
   - `ChatListMenu`의 "친구" 탭에서 `친구 찾기` CTA와 추천 목록 제공
   - 추천 목록: 최근 가입자, 공통 친구 수, 관심사 태그 기준
3. **홈 피드**
   - `/` 또는 `/feed`에서 `user-feed` 데이터로 카드 렌더링
   - 카드 병합 규칙: 동일 사용자의 연속 포스트는 그룹화, 읽음 처리 필드 포함
   - **글 목록 아이템**: 각 글에 `FollowButton` 컴포넌트 표시
4. **알림**
   - 새 팔로워 발생 시 `/notifications/{uid}`에 추가하고 TopBar 벨 아이콘 배지 증가

## 동작 플로우

### 1. 팔로우 관계 생성
1. 사용자가 `팔로우` 버튼 클릭
   - 클라이언트: `/user-following/{me}/{target} = true` 설정
2. Cloud Functions `onUserFollowingCreate` 트리거
   - `/user-followers/{target}/{me} = true` 설정 (역참조)
   - target에게 알림 기록 + FCM 전송

### 2. 글 작성 및 Fan-out
1. 사용자 B가 새 글 작성
   - 클라이언트: `/chat-messages/{messageId}` 생성
   - 클라이언트: `/chat-messages/{messageId}/category = "qna"` 설정
2. Cloud Functions `onChatMessageCategoryCreate` 트리거
   - `/user-followers/{B}` 목록 조회 → [A, C, D, ...]
   - Multi-path update로 fan-out:
     ```javascript
     const updates = {
       [`/user-feed/${B}/${messageId}`]: createdAt,           // 본인 피드
       [`/user-feed/${A}/${messageId}`]: createdAt,           // 팔로워 A
       [`/user-feed/${C}/${messageId}`]: createdAt,           // 팔로워 C
       [`/user-feed/${D}/${messageId}`]: createdAt,           // 팔로워 D
       // ...
     };
     await admin.database().ref().update(updates);
     ```
3. 팔로워들의 피드에 실시간 반영

### 3. 글 삭제 및 Fan-out 제거
1. 사용자 B가 글 삭제
   - 클라이언트: `/chat-messages/{messageId}/deleted = true` 설정
2. Cloud Functions `onChatMessageDeleted` 트리거
   - `/user-followers/{B}` 목록 조회 → [A, C, D, ...]
   - Multi-path update로 fan-out 제거:
     ```javascript
     const updates = {
       [`/user-feed/${B}/${messageId}`]: null,
       [`/user-feed/${A}/${messageId}`]: null,
       [`/user-feed/${C}/${messageId}`]: null,
       [`/user-feed/${D}/${messageId}`]: null,
       // ...
     };
     await admin.database().ref().update(updates);
     ```

### 4. 홈 피드 읽기
1. 사용자가 홈 화면 진입
2. 클라이언트: `/user-feed/{myUid}` 실시간 구독 (createdAt 기준 정렬)
3. 가져온 messageId 목록으로 원본 조회
   - `/chat-messages/{messageId1}`: senderId, text, urls, createdAt만 읽기
   - `/chat-messages/{messageId2}`: senderId, text, urls, createdAt만 읽기
   - ...
4. 사용자 정보 최소한으로 조회
   - `/users/{senderId}`: displayName, photoUrl만 읽기
5. UI 렌더링: 글 + 사진 + 사용자 프로필 표시

## QA 체크리스트
- [ ] 팔로우/언팔로우 시 `/user-following`, `/user-followers`가 정확히 동기화되는지 확인
- [ ] 팔로잉 사용자만 홈 피드 카드가 나타나는지 수동 테스트
- [ ] Cloud Functions 오류 시 재시도 로직(Dead letter) 로그 확인
- [ ] FCM 토픽/단건 전송이 중복되지 않는지 BroadcastChannel 로그 검토

## 구현 상태

### ✅ 완료된 작업

#### 1. Firebase Cloud Functions
- **파일 위치**: `firebase/functions/src/handlers/`
- **구현된 함수**:
  - `onUserFollowingCreate`: 팔로우 관계 생성 시 `/user-followers` 동기화
  - `onUserFollowingDelete`: 언팔로우 시 `/user-followers` 정리
  - `onChatMessageCategoryCreate`: 글 작성 시 팔로워들에게 fan-out
  - `onChatMessageDeleted`: 글 삭제 시 fan-out 피드 일괄 제거
- **배포 상태**: 2025-11-18 배포 완료 (asia-southeast1 리전, 22개 함수)
- **버그 수정 (2025-11-18)**:
  - `messageData.senderId` → `messageData.senderUid` 수정
  - 영향받은 파일: `index.ts`, `chat.message-category.handler.ts`
  - 이유: Firebase Realtime Database의 실제 필드명과 일치시키기 위함

#### 2. Firebase Security Rules
- **파일 위치**: `firebase/database.rules.json`
- **구현된 규칙**:
  - `/user-following`: 본인만 읽기/쓰기 가능
  - `/user-followers`: 누구나 읽기 가능, Cloud Functions만 쓰기 가능
  - `/user-feed`: 본인만 읽기 가능, Cloud Functions만 쓰기 가능

#### 3. 다국어 (i18n) 메시지
- **파일 위치**: `messages/ko.json`, `en.json`, `ja.json`, `zh.json`
- **추가된 키**:
  - `followButton`, `followingButton`, `followLoading`
  - `followLoginRequired`, `followSelfNotAllowed`, `followError`
  - `feedLoginRequired`, `feedLoading`, `feedEmpty`, `feedLoadMore`, `feedLoadingMore`

#### 4. UI 컴포넌트
- **FollowButton 컴포넌트** ([src/lib/components/friend/follow-button.svelte](src/lib/components/friend/follow-button.svelte))
  - 실시간 팔로우 상태 구독
  - 팔로우/언팔로우 토글 기능
  - 로딩 상태 및 에러 처리
  - 자기 자신 팔로우 방지 로직
  - **Lucide 아이콘 통합 (2025-11-18)**:
    - `UserPlus` 아이콘: 팔로우 상태 (파란색 배경)
    - `UserCheck` 아이콘: 팔로잉 상태 (회색 배경)
    - 반응형 디자인:
      - 모바일: 아이콘만 표시 (컴팩트한 버튼)
      - 데스크톱: 아이콘 + 텍스트 표시 (`hidden md:inline-block`)
  - **게시판/댓글 통합 (2025-11-18)**:
    - [src/routes/post/list/+page.svelte](src/routes/post/list/+page.svelte): 게시글 작성자 옆 팔로우 버튼 표시
    - [src/lib/components/post/PostCommentList.svelte](src/lib/components/post/PostCommentList.svelte): 댓글 작성자 옆 팔로우 버튼 표시
    - 본인이 작성한 글/댓글에는 버튼 미표시 (`isMyPost`, `isMyComment` 조건)
    - "팔로우" / "팔로잉" 상태에 따른 버튼 텍스트 자동 변경

- **FeedList 컴포넌트** ([src/lib/components/friend/feed-list.svelte](src/lib/components/friend/feed-list.svelte))
  - `/user-feed/{myUid}` 실시간 구독
  - 최소 정보 원칙: 필요한 필드만 조회
  - 무한 스크롤 (페이지네이션)
  - 사용자/메시지 데이터 캐싱

#### 5. 홈페이지 통합
- **파일 위치**: [src/routes/+page.svelte](src/routes/+page.svelte)
- **구현 내용**:
  - "팔로잉 피드" / "전체" 탭 네비게이션
  - 탭 전환 시 FeedList 또는 기존 게시판 표시
  - Tailwind CSS 스타일링 (tab-button, tab-active)

#### 6. 개발자 도구 개선
- **dev-icon.svelte 개선 (2025-11-18)**:
  - 테스트 계정 로그인 시 alert 박스 제거
  - 로그인 후 즉시 홈페이지로 리다이렉트
  - 개발 환경에서 더 빠른 테스트 가능

#### 7. 품질 검증
- **타입 체크**: `npm run check` 통과 (0 errors, 1766 warnings)
- **빌드**: 성공
- **배포**: Firebase Functions 22개 함수 배포 완료 (2025-11-18)
- **Chrome DevTools MCP 테스트**: 팔로우 버튼 정상 표시 확인
  - 게시글 목록에서 다른 사용자 글 옆에 "팔로우" 버튼 표시
  - 댓글 작성자 옆에 "팔로우" 버튼 표시
  - 이미 팔로우한 사용자는 "팔로잉" 버튼 표시
  - 본인 글/댓글에는 버튼 미표시 (정상)

### ⚠️ 알려진 제한사항
- 없음 (모든 기능 정상 동작 확인)

### 📝 사용 방법

#### 팔로우하기
```svelte
<FollowButton targetUid={사용자UID} />
```

#### 피드 목록 표시
```svelte
<FeedList pageSize={20} />
```

#### 홈페이지 통합
- `/` 경로 접속
- "팔로잉 피드" 탭 클릭
- 팔로우한 사용자들의 게시글 확인

## 향후 작업
- 친구 추천 알고리즘 강화 (공통 관심사, 위치 기반)
- 차단/숨기기 기능 추가
- `/user-feed` 데이터 정리 배치 (30일 지난 항목 삭제)
- 팔로우/팔로잉 통계 대시보드 추가
- 실시간 알림 기능 통합 (팔로우 시 알림 전송)

---

## 작업 이력 (SED Log)

| 날짜 | 작업자 | 변경 내용 |
| ---- | ------ | -------- |
| 2025-11-15 | Claude Code | "친구 관계의 정의 및 용어" 섹션 추가: 팔로우/팔로잉/팔로워/친구 관계의 명확한 정의 및 용어 정리 표 추가 |
| 2025-11-17 | Claude Code | Fan-out 피드 시스템 상세 스펙 추가: 데이터 구조, 동작 플로우, 클라이언트 읽기 패턴, 최소 정보 원칙 등 구현에 필요한 모든 세부 사항 추가 |
| 2025-11-17 | Claude Code | 전체 기능 구현 완료: Cloud Functions (팔로우 관계, fan-out), Security Rules, i18n, FollowButton/FeedList 컴포넌트, 홈페이지 통합, 타입 체크, Firebase 배포 완료 |
| 2025-11-18 | Claude Code | 게시판/댓글 팔로우 버튼 통합 완료: `/post/list` 페이지 및 `PostCommentList` 컴포넌트에 FollowButton 추가, 본인 글/댓글 제외 로직 구현, Chrome DevTools MCP 테스트 통과 |
| 2025-11-18 | Claude Code | 버그 수정: Firebase Functions에서 `senderId`를 올바른 필드명 `senderUid`로 수정, 22개 함수 재배포 완료 |
| 2025-11-18 | Claude Code | 개발자 도구 개선: dev-icon.svelte에서 테스트 계정 로그인 시 alert 제거, UX 향상 |
| 2025-11-18 | Claude Code | Lucide 아이콘 통합: FollowButton 컴포넌트에 UserPlus/UserCheck 아이콘 추가, 반응형 디자인 구현 (모바일: 아이콘만, 데스크톱: 아이콘+텍스트) |
