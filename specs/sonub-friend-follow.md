---
name: 친구 팔로우 기능
description: 사용자가 다른 사용자를 팔로우하고 팔로잉/팔로워 목록을 관리할 수 있는 기능
version: 1.0.0
step: 70
priority: **
dependencies:
  - sonub-firebase-database-structure.md
  - sonub-design-layout.md
tags:
  - friend
  - follow
  - following
  - follower
  - firebase
  - rtdb
  - social
---

# 친구 팔로우 기능

## 1. 개요 (Overview)

친구 팔로우 기능은 사용자가 다른 사용자를 팔로우하여 소셜 네트워크를 구축할 수 있도록 하는 기능입니다. 사용자는 게시글이나 댓글 작성자를 팔로우할 수 있으며, 팔로잉/팔로워 목록을 통해 자신의 네트워크를 관리할 수 있습니다.

### 1.1 핵심 개념

- **팔로우/언팔로우**: 사용자가 다른 사용자를 팔로우하거나 언팔로우할 수 있습니다
- **팔로잉 목록**: 사용자가 팔로우하고 있는 사용자 목록을 표시합니다
- **팔로워 목록**: 사용자를 팔로우하는 사용자 목록을 표시합니다
- **맞팔로우**: 팔로워 목록에서도 상대방을 팔로우할 수 있습니다
- **실시간 동기화**: Firebase RTDB를 통해 팔로우 상태가 실시간으로 동기화됩니다
- **게시글 통합**: 게시글 목록에서 작성자를 바로 팔로우할 수 있습니다

### 1.2 사용 시나리오

#### 시나리오 1: 게시글에서 팔로우하기
1. 사용자가 홈 화면에서 게시글 목록을 확인합니다
2. 다른 사용자가 작성한 게시글의 작성자 프로필 옆에 "팔로우" 버튼이 표시됩니다
3. "팔로우" 버튼을 클릭하면 해당 작성자를 팔로우합니다
4. 버튼이 "언팔로우"로 변경되며 언제든 다시 클릭하여 언팔로우할 수 있습니다

#### 시나리오 2: 팔로잉 목록 관리
1. 사용자가 좌측 메뉴에서 "팔로잉 목록"을 클릭합니다
2. 자신이 팔로우하고 있는 모든 사용자 목록을 확인합니다
3. 각 사용자 옆의 "언팔로우" 버튼을 클릭하여 팔로우를 취소할 수 있습니다
4. 사용자 프로필을 클릭하면 해당 사용자의 프로필 페이지로 이동합니다

#### 시나리오 3: 팔로워 목록 확인 및 맞팔로우
1. 사용자가 좌측 메뉴에서 "팔로워 목록"을 클릭합니다
2. 자신을 팔로우하는 모든 사용자 목록을 확인합니다
3. 아직 맞팔로우하지 않은 사용자 옆에 "팔로우" 버튼이 표시됩니다
4. "팔로우" 버튼을 클릭하여 맞팔로우할 수 있습니다

## 2. 요구사항 (Requirements)

### 2.1 기능 요구사항

#### 팔로우 관리
- [x] 팔로우: 다른 사용자를 팔로우
- [x] 언팔로우: 팔로우 중인 사용자를 언팔로우
- [x] 팔로우 상태 표시: 현재 팔로우 중인지 여부 표시
- [x] 실시간 업데이트: 팔로우 상태 변경 시 실시간 반영
- [x] 자기 자신 팔로우 방지: 본인은 팔로우할 수 없음

#### 팔로잉 목록 페이지
- [x] 목록 표시: 사용자가 팔로우하는 모든 사용자 표시
- [x] 사용자 프로필: 각 사용자의 프로필 사진과 이름 표시
- [x] 언팔로우 기능: 목록에서 바로 언팔로우 가능
- [x] 빈 상태: 팔로잉이 없을 때 안내 메시지 표시
- [x] 로그인 체크: 로그인하지 않은 경우 홈으로 리다이렉트

#### 팔로워 목록 페이지
- [x] 목록 표시: 사용자를 팔로우하는 모든 사용자 표시
- [x] 사용자 프로필: 각 사용자의 프로필 사진과 이름 표시
- [x] 맞팔로우 기능: 목록에서 바로 팔로우 가능
- [x] 빈 상태: 팔로워가 없을 때 안내 메시지 표시
- [x] 로그인 체크: 로그인하지 않은 경우 홈으로 리다이렉트

#### 네비게이션
- [x] 메뉴 링크: 좌측 사이드바에 팔로잉/팔로워 링크 추가
- [x] 로그인 조건부 표시: 로그인 시에만 메뉴 링크 표시
- [x] 활성 상태 표시: 현재 페이지에 대한 활성 상태 하이라이트

### 2.2 UI/UX 요구사항
- [x] 반응형 디자인: 모바일/데스크톱 환경에서 사용 가능
- [x] 다국어 지원: paraglide-js를 통한 i18n
- [x] 에러 핸들링: 로그인 필요 시 명확한 메시지 표시
- [x] 로딩 상태: 데이터 로딩 중 로딩 인디케이터 표시
- [x] 빈 상태: 팔로잉/팔로워가 없을 때 안내 메시지 표시
- [x] SVG 아이콘: 메뉴 링크에 직관적인 아이콘 표시

### 2.3 기술 요구사항
- [x] Svelte 5 Runes: `$state`, `$derived`, `$effect` 사용
- [x] Firebase RTDB: 실시간 데이터베이스 사용
- [x] TailwindCSS: Light Mode 스타일링
- [x] TypeScript: 타입 안정성 보장
- [x] 실시간 구독: onValue를 통한 실시간 데이터 구독
- [x] 라이프사이클 관리: onMount, onDestroy를 통한 구독 관리

## 3. 데이터베이스 구조 (Database Structure)

상세한 데이터베이스 구조는 다음 문서를 참조하세요:
- [팔로우 관계 데이터베이스 구조](./sonub-firebase-database-structure.md#팔로우-관계-user-following--user-followers)

### 3.1 보안 규칙

**소스 코드 위치**: [+page.svelte.md](./repository/src/routes/friend/followers/+page.svelte.md)

```jsonc
{
  "rules": {
    // 팔로잉 목록: 본인만 쓰기 가능, 모두 읽기 가능
    "user-following": {
      "$uid": {
        ".read": true,
        "$targetUid": {
          ".write": "auth.uid === $uid"
        }
      }
    },

    // 팔로워 목록: 팔로워 본인만 쓰기 가능, 모두 읽기 가능
    "user-followers": {
      "$uid": {
        ".read": true,
        "$followerUid": {
          ".write": "auth.uid === $followerUid"
        }
      }
    }
  }
}
```

## 4. 구현 (Implementation)

### 4.1 컴포넌트 구조

**소스 코드 위치**: [+page.svelte.md](./repository/src/routes/friend/followers/+page.svelte.md)

```
src/
├── lib/
│   ├── components/
│   │   ├── friend/
│   │   │   ├── follow-button.svelte          # 팔로우/언팔로우 버튼
│   │   │   └── use-follow.svelte.ts          # 팔로우 로직 (이미 존재)
│   │   └── UserProfile.svelte                # 사용자 프로필 (기존 재사용)
│   └── stores/
│       └── auth.svelte.ts                    # 인증 스토어 (기존 사용)
└── routes/
    ├── friend/
    │   ├── following/
    │   │   └── +page.svelte                  # 팔로잉 목록 페이지
    │   └── followers/
    │       └── +page.svelte                  # 팔로워 목록 페이지
    └── +page.svelte                          # 홈 페이지 (팔로우 버튼 추가)
```

### 4.2 주요 컴포넌트

#### FollowButton 컴포넌트
- **위치**: `src/lib/components/friend/follow-button.svelte`
- **Props**: `targetUid` (팔로우 대상 UID)
- **기능**:
  - 팔로우/언팔로우 토글
  - 현재 팔로우 상태 표시
  - 로그인 체크
  - 자기 자신 팔로우 방지

**소스 코드 위치**: [+page.svelte.md](./repository/src/routes/friend/followers/+page.svelte.md)

```svelte
<script lang="ts">
  import { useFollow } from './use-follow.svelte';
  import { authStore } from '$lib/stores/auth.svelte';
  import * as m from '$lib/paraglide/messages.js';

  let { targetUid = '' }: { targetUid: string } = $props();

  // 팔로우 훅 사용
  const followData = useFollow(targetUid);
  const myUid = $derived(authStore.user?.uid);
  const isMe = $derived(myUid === targetUid);
</script>

{#if !isMe && myUid}
  <button onclick={followData.toggle} class="follow-button">
    {followData.isFollowing ? m.unfollow() : m.follow()}
  </button>
{/if}
```

#### 팔로잉 목록 페이지
- **위치**: `src/routes/friend/following/+page.svelte`
- **기능**:
  - 현재 사용자가 팔로우하는 사용자 목록 표시
  - 실시간 구독으로 목록 업데이트
  - 각 사용자 프로필과 언팔로우 버튼 표시

**소스 코드 위치**: [+page.svelte.md](./repository/src/routes/friend/followers/+page.svelte.md)

```typescript
async function subscribeFollowing() {
  const myUid = authStore.user?.uid;

  // 로그인 체크
  if (!myUid) {
    alert(m.followLoginRequired());
    goto('/');
    return;
  }

  // 팔로잉 목록 구독
  const followingRef = ref(database, `user-following/${myUid}`);

  unsubscribe = onValue(followingRef, async (snapshot) => {
    const data = snapshot.val() || {};
    const uids = Object.keys(data);

    // 각 UID에 대한 사용자 정보 조회
    const userPromises = uids.map(async (uid) => {
      const userRef = ref(database, `users/${uid}`);
      const userSnapshot = await get(userRef);
      const userData = userSnapshot.val();

      if (userData) {
        return {
          uid,
          displayName: userData.displayName || 'Unknown',
          photoUrl: userData.photoUrl
        };
      }
      return null;
    });

    const users = await Promise.all(userPromises);
    followingList = users.filter((u) => u !== null);
    loading = false;
  });
}
```

#### 팔로워 목록 페이지
- **위치**: `src/routes/friend/followers/+page.svelte`
- **기능**:
  - 현재 사용자를 팔로우하는 사용자 목록 표시
  - 실시간 구독으로 목록 업데이트
  - 각 사용자 프로필과 팔로우 버튼 표시 (맞팔로우 가능)

**소스 코드 위치**: [+page.svelte.md](./repository/src/routes/friend/followers/+page.svelte.md)

```typescript
async function subscribeFollowers() {
  const myUid = authStore.user?.uid;

  // 로그인 체크
  if (!myUid) {
    alert(m.followLoginRequired());
    goto('/');
    return;
  }

  // 팔로워 목록 구독
  const followersRef = ref(database, `user-followers/${myUid}`);

  unsubscribe = onValue(followersRef, async (snapshot) => {
    const data = snapshot.val() || {};
    const uids = Object.keys(data);

    // 각 UID에 대한 사용자 정보 조회
    const userPromises = uids.map(async (uid) => {
      const userRef = ref(database, `users/${uid}`);
      const userSnapshot = await get(userRef);
      const userData = userSnapshot.val();

      if (userData) {
        return {
          uid,
          displayName: userData.displayName || 'Unknown',
          photoUrl: userData.photoUrl
        };
      }
      return null;
    });

    const users = await Promise.all(userPromises);
    followersList = users.filter((u) => u !== null);
    loading = false;
  });
}
```

### 4.3 네비게이션 통합

#### 좌측 사이드바
- **위치**: `src/lib/components/left-sidebar.svelte`
- **변경사항**: 로그인 시 팔로잉/팔로워 링크 추가

**소스 코드 위치**: [+page.svelte.md](./repository/src/routes/friend/followers/+page.svelte.md)

```svelte
<!-- 팔로잉/팔로워 링크 (로그인 시에만 표시) -->
{#if authStore.user}
  <a href="/friend/following" class="nav-link" class:active={isActivePath('/friend/following')}>
    <svg class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
        d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
    </svg>
    {m.followingList()}
  </a>

  <a href="/friend/followers" class="nav-link" class:active={isActivePath('/friend/followers')}>
    <svg class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
        d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
    </svg>
    {m.followersList()}
  </a>
{/if}
```

#### 홈 페이지
- **위치**: `src/routes/+page.svelte`
- **변경사항**: 게시글 작성자 프로필 옆에 팔로우 버튼 추가

**소스 코드 위치**: [+page.svelte.md](./repository/src/routes/friend/followers/+page.svelte.md)

```svelte
<!-- 상단 메타 영역 -->
<div class="post-header">
  <!-- 왼쪽: 작성자 프로필 + 팔로우 버튼 -->
  <div class="post-header-left">
    <UserProfile uid={message.senderUid} photoSize="h-8 w-8" textSize="text-sm" />
    <!-- 팔로우 버튼 (작성자가 본인이 아닐 때만 표시) -->
    {#if !isMyPost}
      <div class="ml-2">
        <FollowButton targetUid={message.senderUid} />
      </div>
    {/if}
  </div>

  <!-- 오른쪽: 카테고리 + 채팅방 이름 + 시간 -->
  <div class="post-header-right">
    <!-- ... -->
  </div>
</div>
```

### 4.4 다국어 메시지

#### 추가된 i18n 키
- **소스 코드 위치**: [repository/messages/ko.json.md](./repository/messages/ko.json.md), `messages/en.json`, `messages/ja.json`, `messages/zh.json`

```json
{
  "followingList": "팔로잉 목록",
  "followersList": "팔로워 목록",
  "noFollowing": "팔로잉한 사용자가 없습니다",
  "noFollowers": "팔로워가 없습니다"
}
```

### 4.5 스타일링

#### Tailwind CSS 스타일
- **@reference 디렉티브**: Tailwind CSS v4 문법 사용
- **Light Mode**: 다크 모드 미지원
- **반응형**: 모바일/데스크톱 대응

**소스 코드 위치**: [+page.svelte.md](./repository/src/routes/friend/followers/+page.svelte.md)

```css
@reference "tailwindcss";

/* 페이지 컨테이너 */
.following-page, .followers-page {
  @apply max-w-2xl mx-auto p-4;
}

/* 페이지 헤더 */
.page-header {
  @apply mb-6;
}

.page-title {
  @apply text-2xl font-bold text-gray-900;
}

/* 로딩/빈 상태 */
.loading-container,
.empty-container {
  @apply flex items-center justify-center py-12;
}

/* 사용자 목록 */
.user-list {
  @apply flex flex-col gap-3;
}

/* 사용자 아이템 */
.user-item {
  @apply bg-white rounded-lg shadow-sm border p-4;
  @apply flex items-center justify-between;
  @apply transition-shadow duration-200;
  @apply hover:shadow-md;
}

.user-profile {
  @apply flex-1;
}

.user-action {
  @apply ml-4;
}
```

## 5. 테스트 (Testing)

### 5.1 수동 테스트

#### 팔로우 기능 테스트
- [x] 게시글에서 팔로우 버튼 클릭 시 정상 팔로우
- [x] 팔로우 후 버튼이 "언팔로우"로 변경
- [x] 언팔로우 버튼 클릭 시 정상 언팔로우
- [x] 본인 게시글에는 팔로우 버튼 미표시
- [x] 로그인하지 않은 경우 버튼 미표시

#### 팔로잉 목록 테스트
- [x] 팔로잉 목록 페이지 정상 표시
- [x] 팔로우한 사용자 목록 정상 조회
- [x] 각 사용자 프로필 정보 정상 표시
- [x] 언팔로우 버튼 정상 동작
- [x] 빈 상태 메시지 정상 표시
- [x] 로그인하지 않은 경우 홈으로 리다이렉트

#### 팔로워 목록 테스트
- [x] 팔로워 목록 페이지 정상 표시
- [x] 나를 팔로우하는 사용자 목록 정상 조회
- [x] 각 사용자 프로필 정보 정상 표시
- [x] 맞팔로우 버튼 정상 동작
- [x] 빈 상태 메시지 정상 표시
- [x] 로그인하지 않은 경우 홈으로 리다이렉트

#### 네비게이션 테스트
- [x] 좌측 메뉴에 팔로잉/팔로워 링크 정상 표시
- [x] 로그인 시에만 링크 표시
- [x] 활성 페이지 하이라이트 정상 동작
- [x] 링크 클릭 시 페이지 이동 정상

### 5.2 타입 체크

**소스 코드 위치**: [+page.svelte.md](./repository/src/routes/friend/followers/+page.svelte.md)

```bash
npm run check
```

**결과**:

**소스 코드 위치**: [+page.svelte.md](./repository/src/routes/friend/followers/+page.svelte.md)

```
Getting Svelte diagnostics...
====================================
0 errors
1766 warnings (CSS 관련 경고, 정상)
```

### 5.3 실시간 동기화 테스트
- [x] A가 B를 팔로우하면 B의 팔로워 목록에 A 즉시 표시
- [x] A가 B를 언팔로우하면 B의 팔로워 목록에서 A 즉시 제거
- [x] 여러 탭에서 동시에 접속 시 실시간 동기화 확인

## 6. 업데이트 이력 (Update History)

### v1.0.0 (2025-11-18)

#### 추가된 기능
- [x] 게시글에 팔로우 버튼 추가
- [x] 팔로잉 목록 페이지 생성 (`/friend/following`)
- [x] 팔로워 목록 페이지 생성 (`/friend/followers`)
- [x] 좌측 사이드바에 팔로잉/팔로워 링크 추가
- [x] 실시간 팔로우 상태 동기화
- [x] 다국어 메시지 추가 (ko, en, ja, zh)

#### 변경된 파일
- **messages/ko.json**: 팔로우 관련 메시지 4개 추가
- **messages/en.json**: 팔로우 관련 메시지 4개 추가
- **messages/ja.json**: 팔로우 관련 메시지 4개 추가
- **messages/zh.json**: 팔로우 관련 메시지 4개 추가
- **src/routes/friend/following/+page.svelte**: 팔로잉 목록 페이지 신규 생성
- **src/routes/friend/followers/+page.svelte**: 팔로워 목록 페이지 신규 생성
- **src/lib/components/left-sidebar.svelte**: 팔로잉/팔로워 네비게이션 링크 추가
- **src/routes/+page.svelte**: FollowButton 컴포넌트 통합

#### 기술 스택
- Svelte 5 Runes (`$state`, `$derived`, `$effect`)
- Firebase Realtime Database
- Tailwind CSS v4 (`@reference` 디렉티브)
- Paraglide-js (i18n)
- TypeScript

#### 참고 사항
- FollowButton 컴포넌트와 useFollow 훅은 이전에 이미 구현되어 있었음
- 본인 게시글에는 팔로우 버튼이 표시되지 않음
- 로그인하지 않은 사용자는 팔로잉/팔로워 페이지에 접근할 수 없음
- 모든 팔로우 관련 데이터는 Firebase RTDB에 실시간으로 동기화됨

## 7. 향후 개선 사항 (Future Improvements)

### 7.1 기능 개선
- [ ] 댓글에도 팔로우 버튼 추가
- [ ] 팔로잉/팔로워 수를 사용자 프로필에 표시
- [ ] 맞팔로우(상호 팔로우) 상태 표시
- [ ] 팔로우 추천 기능 (유사한 관심사 기반)
- [ ] 팔로우 알림 기능
- [ ] 팔로우 활동 피드 (팔로우한 사용자의 최근 활동)

### 7.2 성능 개선
- [ ] 대량 팔로잉/팔로워 목록 페이지네이션
- [ ] 사용자 정보 캐싱
- [ ] 무한 스크롤 구현

### 7.3 UI/UX 개선
- [ ] 팔로우 버튼 애니메이션 추가
- [ ] 로딩 스켈레톤 UI
- [ ] 빈 상태 일러스트레이션
- [ ] 팔로우 성공 토스트 알림
