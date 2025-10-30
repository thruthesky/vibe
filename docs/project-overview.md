# Vibe 프로젝트 개요

> AI 기반 바이브 코딩으로 만드는 실전 소셜 웹 애플리케이션
> 100% AI와 협업으로 개발되는 오픈소스 스터디 프로젝트

---

## 📋 목차

1. [프로젝트 소개](#프로젝트-소개)
2. [기술 스택](#기술-스택)
3. [프로젝트 구조](#프로젝트-구조)
4. [레이아웃 구조](#레이아웃-구조)
5. [주요 기능](#주요-기능)
6. [Firebase 데이터 구조](#firebase-데이터-구조)
7. [현재 진행 중인 TODO](#현재-진행-중인-todo)
8. [프로젝트 철학](#프로젝트-철학)
9. [개발 환경 설정](#개발-환경-설정)

---

## 프로젝트 소개

**Vibe**는 **AI 기반 바이브 코딩(노코딩)**으로 만들어진 실전 소셜 웹 애플리케이션입니다. 

### 핵심 개념

**한바보**(한국 바이브 보스)는 AI 기반 바이브 코딩으로 실전 소셜 웹 애플리케이션을 만드는 오픈소스 스터디 커뮤니티입니다. 개발자가 직접 코드를 타이핑하는 대신, AI와 대화하며 개발하는 새로운 방식을 실험합니다.

### 주요 목표

- **AI 컨트롤**: AI가 만들고 싶어하는 것이 아닌, 내가 만들고 싶은 것을 AI가 만들도록 컨트롤하는 능력 향상
- **완전한 통제**: 지속 가능한 개발을 위한 프로젝트 전체에 대한 통제력 확보
- **실전 협업**: Git PR을 통한 협업, 코드 리뷰 경험
- **실제 배포**: 실제 서비스 수준의 애플리케이션 배포 경험

### 프로젝트 특징

- **💬 소스 코딩 금지**: 코드는 AI에게 맡기고, 설계와 기획에 집중
- **🛠️ 지속 가능한 개발**: 프롬프트 몇 번으로 끝나는 것이 아닌, 지속적인 유지보수가 가능한 프로젝트
- **🤝 실전 협업 경험**: Git PR을 통한 협업, 코드 리뷰 경험
- **🌐 모든 AI 환영**: Claude, ChatGPT, Copilot 등 어떤 AI든 사용 가능
- **🎯 실용적인 기능**: 인증, 게시판, 채팅, 알림 등 실제 서비스에 필요한 기능들
- **📚 함께 성장**: 모르는 것을 서로 물어보고 배우는 학습 문화

---

## 기술 스택

### 프론트엔드

#### 핵심 프레임워크
- **Next.js 16.0.0**: React 기반 풀스택 프레임워크
  - App Router 사용
  - Server-Side Rendering (SSR)
  - Static Site Generation (SSG)
  - API Routes
- **React 19.2.0**: 최신 React 기능
  - React Server Components
  - 향상된 Hooks
- **TypeScript 5**: 타입 안전성 및 개발 생산성 향상

#### 스타일링
- **Tailwind CSS 4.1.16**: 유틸리티 우선 CSS 프레임워크
  - PostCSS 통합
  - 반응형 디자인
  - 다크 모드 지원

#### UI 컴포넌트 라이브러리
- **Radix UI**: 접근성이 우수한 헤드리스 UI 컴포넌트
  - `@radix-ui/react-avatar` - 사용자 아바타
  - `@radix-ui/react-dialog` - 모달/다이얼로그
  - `@radix-ui/react-dropdown-menu` - 드롭다운 메뉴
  - `@radix-ui/react-icons` - 아이콘 세트
  - `@radix-ui/react-slot` - 컴포넌트 합성
- **Lucide React 0.548.0**: 아이콘 라이브러리
- **Class Variance Authority (CVA)**: 조건부 스타일링
- **clsx & tailwind-merge**: 클래스명 유틸리티

### 백엔드 & 데이터베이스

#### Firebase (주요 백엔드)
- **Firebase 12.4.0**: Google의 통합 백엔드 플랫폼
  - **Firebase Authentication**: 사용자 인증
    - 이메일/비밀번호 인증
    - 소셜 로그인 (향후 추가 예정)
  - **Firebase Realtime Database (RTDB)**: 실시간 데이터 동기화
    - 채팅 메시지
    - 사용자 정보
    - 실시간 업데이트
  - **Firebase Firestore**: 구조화된 NoSQL 데이터베이스
    - 복잡한 쿼리
    - 오프라인 지원
  - **Firebase Storage**: 파일 저장소 (향후 사용 예정)

#### Supabase (선택적)
- **PostgreSQL 기반 백엔드**: SEO 및 서버 렌더링용
- **게시판 데이터 캐싱**: RTDB → Supabase 동기화

#### API
- **Next.js API Routes**: RESTful API 엔드포인트 (향후 구현)
  - `/api/users`
  - `/api/chat`
  - `/api/posts`

### 모바일 앱 (향후 개발)

- **Flutter**: 크로스플랫폼 모바일 앱
  - iOS/Android 동시 지원
  - Next.js API 엔드포인트 통합
  - 웹과 동일한 Firebase 인증 사용
  - 웹과 동일한 수준의 UI/UX

### 개발 도구

- **ESLint 9**: 코드 품질 및 일관성 유지
- **PostCSS**: CSS 변환 및 최적화
- **Git & GitHub**: 버전 관리 및 협업
- **Vercel**: 배포 플랫폼 (권장)

---

## 주요 특징

### 1. 사용자 인증 (Firebase Authentication)
- 이메일/비밀번호 기반 인증
- 사용자 프로필 정보(displayName) 저장
- `lib/auth.ts`의 함수 사용으로 쉬운 구현

### 2. Next.js App Router
- 모던한 라우팅 시스템
- 파일 기반 라우팅 (`/app` 디렉토리)
- 레이아웃 및 페이지 분리

### 3. Tailwind CSS와 shadcn/ui
- 빠른 UI 개발
- 일관된 디자인 시스템
- 접근성(a11y) 고려된 컴포넌트

### 4. Firebase 통합
- 실시간 데이터베이스 (채팅, 알림)
- Firestore (게시판, 댓글)
- 동적 인증 상태 관리 가능

---

## 프로젝트 구조

```
vibe/
├── app/                          # Next.js App Router
│   ├── page.tsx                 # 홈페이지 (TODO 목록, 프로젝트 소개)
│   ├── layout.tsx               # 루트 레이아웃 (Topbar, Sidebar 구조)
│   ├── globals.css              # 전역 스타일 (Tailwind 설정)
│   │
│   ├── auth/                    # 인증 관련 페이지
│   │   ├── login/
│   │   │   └── page.tsx        # 로그인 페이지
│   │   └── signup/
│   │       └── page.tsx        # 회원가입 페이지
│   │
│   ├── chat/                    # 채팅 기능
│   │   └── room/
│   │       └── page.tsx        # 1:1 채팅방 (쿼리: ?otherId=<uid>)
│   │
│   ├── profile/
│   │   └── page.tsx            # 프로필 수정 페이지
│   │
│   ├── users/
│   │   └── page.tsx            # 전체 사용자 목록
│   │
│   ├── menu/
│   │   └── page.tsx            # 통합 메뉴 페이지
│   │
│   └── dev/                     # 개발 관련 페이지
│       ├── design/
│       │   └── page.tsx        # UI 디자인 테스트
│       └── history/
│           └── page.tsx        # 개발 일지
│
├── components/                   # React 컴포넌트
│   ├── topbar.tsx               # 상단 네비게이션 바 (고정)
│   ├── left-sidebar.tsx         # 왼쪽 사이드바 (Desktop)
│   ├── right-sidebar.tsx        # 오른쪽 사이드바 (Desktop)
│   ├── test-fab.tsx             # 테스트용 Floating Action Button
│   │
│   └── ui/                      # Radix UI 기반 재사용 컴포넌트
│       ├── avatar.tsx           # 사용자 아바타
│       ├── button.tsx           # 버튼
│       ├── dropdown-menu.tsx    # 드롭다운 메뉴
│       └── sheet.tsx            # 시트 (모바일 메뉴)
│
├── lib/                          # 유틸리티 및 API 함수
│   ├── firebase.ts              # Firebase 초기화 및 설정
│   ├── auth.ts                  # 인증 함수 (회원가입, 로그인, 로그아웃)
│   ├── user.ts                  # 사용자 정보 관리 (RTDB CRUD)
│   ├── chat.ts                  # 채팅 기능 (메시지 송수신, 채팅방 관리)
│   └── utils.ts                 # 공통 유틸리티 함수
│
├── docs/                         # 프로젝트 문서
│   ├── project-overview.md      # 프로젝트 개요 (이 문서)
│   ├── routes.md                # 라우트 가이드
│   ├── chat.md                  # 채팅 기능 상세 문서
│   └── user.md                  # 사용자 관리 문서
│
├── public/                       # 정적 파일 (이미지, 아이콘 등)
│
├── package.json                  # npm 의존성 및 스크립트
├── tsconfig.json                 # TypeScript 설정
├── next.config.ts                # Next.js 설정
├── eslint.config.mjs             # ESLint 설정
├── postcss.config.mjs            # PostCSS 설정
├── components.json               # Shadcn UI 설정
├── global.d.ts                   # 전역 타입 선언
├── next-env.d.ts                 # Next.js 타입 정의
├── README.md                     # 프로젝트 README
└── CLAUDE.md                     # Claude AI 협업 가이드
```

### 디렉토리별 설명

#### `/app` - Next.js App Router
- Next.js 16의 최신 App Router 사용
- 파일 기반 라우팅 시스템
- `layout.tsx`: 모든 페이지가 공유하는 레이아웃
- `page.tsx`: 각 라우트의 실제 페이지 컴포넌트

#### `/components` - 재사용 가능한 컴포넌트
- `topbar.tsx`, `*-sidebar.tsx`: 레이아웃 컴포넌트
- `/ui`: Radix UI 기반 디자인 시스템 컴포넌트

#### `/lib` - 비즈니스 로직 및 유틸리티
- Firebase 관련 모든 로직
- 인증, 사용자 관리, 채팅 등 핵심 기능
- 재사용 가능한 함수들

#### `/docs` - 프로젝트 문서
- 개발자 가이드
- API 문서
- 기능별 상세 문서

---

## 레이아웃 구조

### 3단 레이아웃 시스템

```
┌─────────────────────────────────────────────────────────┐
│                    Topbar (고정, 64px)                   │
│  로고 | 네비게이션 | 검색 | 프로필                        │
├────────────┬──────────────────────┬─────────────────────┤
│            │                      │                     │
│   Left     │                      │      Right          │
│  Sidebar   │    Main Content      │     Sidebar         │
│ (Desktop)  │   (모든 디바이스)      │    (Desktop)        │
│            │                      │                     │
│  250px     │      flex-1          │      250px          │
│            │                      │                     │
└────────────┴──────────────────────┴─────────────────────┘
```

### 반응형 동작

#### Desktop (lg 이상, ≥1024px)
- **Topbar**: 고정 (sticky top)
- **Left Sidebar**: 표시 (250px 고정 너비)
- **Main Content**: 유동적 (flex-1)
- **Right Sidebar**: 표시 (250px 고정 너비)
- **최대 너비**: 1200px (중앙 정렬)

#### Tablet/Mobile (< 1024px)
- **Topbar**: 고정
- **Left Sidebar**: 숨김 (햄버거 메뉴로 전환 가능)
- **Main Content**: 전체 너비
- **Right Sidebar**: 숨김

### 레이아웃 구현 (`app/layout.tsx`)

```typescript
export default function RootLayout({ children }) {
  return (
    <html lang="ko">
      <body>
        <Topbar />
        <div className="pt-16"> {/* Topbar 높이만큼 여백 */}
          <div className="mx-auto max-w-[1200px] flex">
            <div className="hidden lg:block">
              <LeftSidebar />
            </div>
            <main className="flex-1 min-w-0">
              {children}
            </main>
            <div className="hidden lg:block">
              <RightSidebar />
            </div>
          </div>
        </div>
        <TestFab /> {/* 개발용 */}
      </body>
    </html>
  );
}
```

---

## 주요 기능

### 1️⃣ 인증 시스템

**위치**: `/lib/auth.ts`, `/app/auth/`

#### 기능 목록
- ✅ 이메일/비밀번호 회원가입
- ✅ 이메일/비밀번호 로그인
- ✅ 로그아웃
- ✅ 사용자 프로필 관리 (displayName)
- ⏳ 소셜 로그인 (Google, GitHub 등) - 예정

#### 주요 함수

```typescript
// 회원가입
signUp(email: string, password: string, displayName: string)
  → { success: boolean, user?: UserInfo, error?: string }

// 로그인
signIn(email: string, password: string)
  → { success: boolean, user?: UserInfo, error?: string }

// 로그아웃
logOut()
  → { success: boolean, error?: string }

// 현재 사용자 조회
getCurrentUser(): User | null
```

#### 사용 예제

```typescript
// 회원가입
const result = await signUp("user@example.com", "password123", "홍길동");
if (result.success) {
  console.log("회원가입 성공:", result.user);
}

// 로그인
const loginResult = await signIn("user@example.com", "password123");
if (loginResult.success) {
  console.log("로그인 성공:", loginResult.user);
}
```

---

### 2️⃣ 사용자 관리

**위치**: `/lib/user.ts`, `/app/users/`, `/app/profile/`

#### 기능 목록
- ✅ RTDB에 사용자 정보 저장
- ✅ 사용자 정보 조회 (displayName 등)
- ✅ 전체 사용자 목록 표시
- ✅ 프로필 수정

#### 데이터 저장 경로
```
/vibe/users/<uid>/
  ├── displayName: "사용자 이름"
  ├── email: "user@example.com"
  ├── photoURL: "https://..."
  ├── createdAt: 1234567890
  └── ... (기타 사용자 정보)
```

#### 주요 함수

```typescript
// displayName 저장
saveUserDisplayName(uid: string, displayName: string)
  → { success: boolean, error?: string }

// displayName 조회
getUserDisplayName(uid: string)
  → string | null

// 사용자 전체 정보 조회
getUserData(uid: string)
  → { [key: string]: any } | null

// 사용자 전체 정보 저장
saveUserData(uid: string, userData: object)
  → { success: boolean, error?: string }
```

---

### 3️⃣ 1:1 채팅

**위치**: `/lib/chat.ts`, `/app/chat/room/page.tsx`

#### 기능 목록
- ✅ Firebase Realtime Database 실시간 채팅
- ✅ 채팅방 ID 자동 생성 (uid1---uid2 형식, 세 개의 대시)
- ✅ 메시지 송수신
- ✅ 실시간 메시지 수신 (onValue 리스너)
- ⏳ 채팅방 목록 (/vibe/chat/joins)
- ⏳ 그룹 채팅
- ⏳ 읽음 표시
- ⏳ 타이핑 인디케이터

#### 채팅방 ID 생성 규칙

```typescript
// 두 사용자의 UID를 알파벳 순으로 정렬하여 생성 (세 개의 대시 --- 사용)
generateRoomId("user-B-uid", "user-A-uid")
  → "user-A-uid---user-B-uid"
```

이렇게 하면 항상 동일한 채팅방 ID가 생성됩니다.

#### 데이터 구조

**메시지 (`ChatMessage`)**
```typescript
interface ChatMessage {
  sender: string;          // 발신자 UID
  senderName: string;      // 발신자 표시 이름
  text: string;            // 메시지 내용
  timestamp: number;       // 전송 시간 (밀리초)
  messageId?: string;      // Firebase 생성 메시지 ID
}
```

**채팅방 (`ChatRoom`)**
```typescript
interface ChatRoom {
  roomId: string;              // 채팅방 ID
  users: string[];             // 참여자 UID 배열
  createdAt: number;           // 생성 시간
  lastMessage?: string;        // 마지막 메시지
  lastMessageTime?: number;    // 마지막 메시지 시간
}
```

#### 주요 함수

```typescript
// 채팅방 ID 생성
generateRoomId(uid1: string, uid2: string): string

// 채팅방 생성 또는 가져오기
createOrGetChatRoom(currentUserId: string, otherUserId: string)
  → Promise<ChatRoom>

// 메시지 전송
sendMessage(roomId: string, senderId: string, senderName: string, text: string)
  → Promise<{ success: boolean, error?: string }>

// 메시지 실시간 수신
listenToMessages(
  roomId: string,
  callback: (messages: ChatMessage[]) => void
): () => void  // Unsubscribe 함수 반환
```

#### 사용 예제

```typescript
// 1. 채팅방 생성/가져오기
const room = await createOrGetChatRoom(myUid, otherUserUid);

// 2. 메시지 수신 리스너 설정
const unsubscribe = listenToMessages(room.roomId, (messages) => {
  console.log("새 메시지:", messages);
  setMessages(messages);
});

// 3. 메시지 전송
await sendMessage(room.roomId, myUid, myName, "안녕하세요!");

// 4. 컴포넌트 언마운트 시 리스너 해제
useEffect(() => {
  return () => unsubscribe();
}, []);
```

---

### 4️⃣ 페이지 라우트

| 경로 | 파일 | 설명 | 접근 권한 |
|------|------|------|-----------|
| `/` | `app/page.tsx` | 홈페이지 (TODO, 프로젝트 소개) | 모두 |
| `/auth/login` | `app/auth/login/page.tsx` | 로그인 | 모두 |
| `/auth/signup` | `app/auth/signup/page.tsx` | 회원가입 | 모두 |
| `/users` | `app/users/page.tsx` | 사용자 목록 | 모두 |
| `/profile` | `app/profile/page.tsx` | 프로필 수정 | 로그인 필요 |
| `/chat/room?otherId=<uid>` | `app/chat/room/page.tsx` | 1:1 채팅 | 로그인 필요 |
| `/menu` | `app/menu/page.tsx` | 통합 메뉴 | 모두 |
| `/dev/history` | `app/dev/history/page.tsx` | 개발 일지 | 모두 |
| `/dev/design` | `app/dev/design/page.tsx` | 디자인 테스트 | 모두 |

자세한 라우트 정보는 [`/docs/routes.md`](./routes.md)를 참조하세요.

---

## Firebase 데이터 구조

### Realtime Database (RTDB) 구조

```
/vibe/
│
├── users/                          # 사용자 정보
│   └── <uid>/                      # 사용자 UID
│       ├── displayName: "홍길동"
│       ├── email: "user@example.com"
│       ├── photoURL: "https://..."
│       ├── createdAt: 1698473000000
│       └── updatedAt: 1698473000000
│
├── chat/                           # 채팅 시스템
│   │
│   ├── messages/                   # 모든 채팅 메시지 (1:1 및 그룹)
│   │   └── <room-id>/             # 채팅방 ID (1:1: uid1---uid2, 그룹: group-xxx)
│   │       └── <message-id>/      # 메시지 ID (Firebase 자동 생성)
│   │           ├── sender: "user-uid-1"
│   │           ├── senderName: "홍길동"
│   │           ├── text: "안녕하세요!"
│   │           └── sentAt: 1698473000000
│   │
│   ├── joins/                      # 사용자별 채팅방 참여 목록 (모든 채팅방)
│   │   └── <login-uid>/            # 로그인한 사용자 UID
│   │       └── <room-id>/          # 참여한 채팅방 ID
│   │           ├── roomId: "user-uid-1---user-uid-2"
│   │           ├── createdAt: 1698473000000
│   │           ├── lastMessage: "안녕하세요!"
│   │           ├── lastMessageSentAt: 1698473000000
│   │           ├── order: 1698473000000
│   │           ├── singleOrder: 1698473000000  # 1:1 채팅방인 경우에만
│   │           └── groupOrder: 1698473000000   # 그룹 채팅방인 경우에만
│   │
│   └── rooms/                      # 그룹 채팅방 정보 (그룹 채팅 전용)
│       └── <room-id>/              # 그룹 채팅방 ID
│           ├── roomId: "group-abc123"
│           ├── users: ["user-uid-1", "user-uid-2", "user-uid-3"]
│           ├── createdAt: 1698473000000
│           ├── lastMessage: "안녕하세요!"
│           ├── lastMessageSentAt: 1698473000000
│           ├── open: true          # 오픈 채팅방 (선택)
│           └── password: "secret"  # 비밀번호 보호 (선택)
│
└── posts/                          # 게시판 (향후 구현)
    └── <post-id>/
        ├── title: "제목"
        ├── content: "내용"
        ├── author: "user-uid"
        ├── createdAt: 1698473000000
        └── comments/
            └── <comment-id>/
                ├── text: "댓글"
                ├── author: "user-uid"
                └── createdAt: 1698473000000
```

### Firestore 구조 (향후 사용 예정)

```
users/                              # 사용자 컬렉션
  └── {uid}/                        # 문서 ID = UID
      └── (사용자 정보)

posts/                              # 게시글 컬렉션
  └── {postId}/                     # 문서 ID
      ├── title: string
      ├── content: string
      ├── author: string (UID)
      ├── createdAt: Timestamp
      └── comments/                 # 서브컬렉션
          └── {commentId}/
              └── (댓글 정보)
```

### 데이터 동기화 전략

#### RTDB (실시간 데이터)
- 채팅 메시지
- 실시간 알림
- 온라인 상태
- 타이핑 인디케이터

#### Firestore (구조화된 데이터)
- 게시글
- 댓글
- 사용자 프로필 (상세)
- 파일 메타데이터

#### Supabase (SEO & SSR 캐싱)
- RTDB 게시글을 Supabase로 복사
- 서버 렌더링 시 Supabase에서 조회
- 클라이언트 Hydration 후 RTDB로 전환

---

## 현재 진행 중인 TODO

### 🎨 1. 디자인 개선
- [ ] **탑바에 로그인 사용자 정보 표시**
  - 현재 로그인한 사용자의 아바타, 이름 표시
  - 드롭다운 메뉴 (프로필, 설정, 로그아웃)

### 💬 2. 채팅 기능 확장
- [ ] **채팅방 목록 표시**
  - `/vibe/chat/joins/<user-uid>` 경로에 참여 채팅방 저장
  - 채팅방 목록 페이지 생성
  - 마지막 메시지, 시간, 읽지 않은 메시지 수 표시
  
- [ ] **그룹 채팅**
  - 그룹 채팅방 생성
  - 멤버 초대/삭제
  - 채팅방 이름 설정/수정
  - 관리자 권한

### 🔌 3. API화
- [ ] **모든 함수를 API 엔드포인트로 변환**
  - `/api/auth/*` - 인증 API
  - `/api/users/*` - 사용자 관리 API
  - `/api/chat/*` - 채팅 API
  - `/api/posts/*` - 게시판 API (향후)

### 📝 4. 게시판 시스템
- [ ] **RTDB 게시판 구현**
  - 글 작성, 수정, 삭제
  - 댓글 작성, 수정, 삭제
  - 좋아요/싫어요
  - 이미지 업로드 (Firebase Storage)

- [ ] **Supabase 캐싱**
  - RTDB → Supabase 자동 동기화
  - SSR 시 Supabase에서 데이터 조회
  - 클라이언트에서 RTDB로 Reboot

- [ ] **SEO 최적화**
  - 메타 태그 설정
  - Open Graph 태그
  - 구조화된 데이터 (JSON-LD)

### 🔔 5. 푸시 알림
- [ ] **Firebase Cloud Messaging (FCM) 통합**
  - 브라우저 푸시 알림 권한 요청
  - 디바이스 토큰 저장

- [ ] **알림 유형**
  - 새 채팅 메시지
  - 댓글 알림
  - 좋아요 알림
  - 멘션 알림

- [ ] **알림 구독 관리**
  - 채팅방별 알림 on/off
  - 게시글별 알림 구독

### 📱 6. Flutter 모바일 앱
- [ ] **iOS/Android 앱 개발**
  - Flutter 프로젝트 생성
  - Next.js API 통합
  - Firebase 인증 연동
  - 웹과 동일한 UI/UX 구현

### 🔐 7. 보안 강화
- [ ] **Firebase Security Rules 설정**
  - RTDB 보안 규칙
  - Firestore 보안 규칙
  - Storage 보안 규칙

- [ ] **입력 유효성 검사**
  - 클라이언트 & 서버 이중 검증
  - XSS 방지
  - SQL Injection 방지 (Supabase)

### 🚀 8. 성능 최적화
- [ ] **코드 스플리팅**
  - 동적 import
  - Lazy loading

- [ ] **이미지 최적화**
  - Next.js Image 컴포넌트 사용
  - WebP 포맷 사용

- [ ] **캐싱 전략**
  - React Query / SWR 도입
  - 서비스 워커

### 📊 9. 분석 및 모니터링
- [ ] **Google Analytics 연동**
- [ ] **Firebase Analytics**
- [ ] **에러 트래킹** (Sentry 등)

---

## 프로젝트 철학

### 1. 💬 소스 코딩 금지

코드는 AI에게 맡기고, 개발자는 다음에 집중합니다:
- **요구사항 정의**: 무엇을 만들지 명확히 정의
- **아키텍처 설계**: 시스템 구조와 데이터 흐름 설계
- **품질 관리**: 코드 리뷰, 테스트, 문서화
- **사용자 경험**: UI/UX 개선

### 2. 🛠️ 지속 가능한 개발

프롬프트 몇 번으로 끝나는 것이 아닌, 실제 서비스처럼:
- **유지보수 가능한 코드**: 명확한 구조, 주석, 문서
- **확장 가능한 설계**: 새 기능 추가가 쉬운 구조
- **버전 관리**: Git을 통한 체계적인 관리
- **지속적 개선**: 사용자 피드백 반영

### 3. 🤝 실전 협업 경험

- **Pull Request (PR) 기반 개발**
  - 브랜치 전략 (feature, develop, main)
  - 코드 리뷰 문화
  - 커밋 메시지 컨벤션
  
- **이슈 트래킹**
  - GitHub Issues 활용
  - 명확한 이슈 설명
  - 진행 상황 공유

- **문서화**
  - README, 개발 가이드
  - API 문서
  - 코드 주석

### 4. 🌐 모든 AI 환영

특정 AI에 종속되지 않고, 다양한 AI 도구 활용:
- **Claude** (Anthropic)
- **ChatGPT** (OpenAI)
- **GitHub Copilot**
- **Cursor**
- 기타 AI 코딩 어시스턴트

### 5. 🎯 실용적 기능 구현

학습용이 아닌 실제 서비스 수준의 기능:
- **인증**: 보안을 고려한 사용자 인증
- **게시판**: CRUD + 검색, 필터링, 페이지네이션
- **채팅**: 실시간 메시징, 읽음 표시, 알림
- **알림**: 푸시 알림, 이메일 알림
- **SEO**: 검색 엔진 최적화
- **성능**: 로딩 속도, 최적화

### 6. 📚 함께 성장

- **질문하는 문화**: 모르는 것을 부끄러워하지 않기
- **지식 공유**: 배운 것을 문서화하여 공유
- **상호 코드 리뷰**: 서로의 코드를 리뷰하며 학습
- **정기 회고**: 프로젝트 진행 상황 공유 및 개선점 논의

---

## 개발 환경 설정

### 1. 사전 요구사항

#### 필수 소프트웨어
- **Node.js** 20.x 이상
- **npm** 또는 **yarn**
- **Git**

#### 계정
- **GitHub** 계정
- **Firebase** 프로젝트
- **(선택) Supabase** 프로젝트

### 2. 저장소 클론 및 설치

```bash
# 1. 저장소 Fork 또는 Clone
git clone https://github.com/thruthesky/vibe.git
cd vibe

# 2. 의존성 설치
npm install
# 또는
yarn install
```

### 3. Firebase 프로젝트 설정

#### 3.1 Firebase 콘솔에서 프로젝트 생성
1. [Firebase Console](https://console.firebase.google.com/) 접속
2. "프로젝트 추가" 클릭
3. 프로젝트 이름 입력 (예: vibe-study)
4. Google Analytics 설정 (선택)

#### 3.2 웹 앱 추가
1. Firebase 프로젝트 → 프로젝트 설정
2. "앱 추가" → "웹" 선택
3. 앱 닉네임 입력
4. Firebase SDK 구성 정보 복사

#### 3.3 Firebase 서비스 활성화

**Authentication**
1. Firebase Console → Authentication
2. "시작하기" 클릭
3. 로그인 방법 → "이메일/비밀번호" 활성화

**Realtime Database**
1. Firebase Console → Realtime Database
2. "데이터베이스 만들기" 클릭
3. 위치 선택 (예: asia-southeast1)
4. 보안 규칙: "테스트 모드로 시작" (개발 단계)

**Firestore Database**
1. Firebase Console → Firestore Database
2. "데이터베이스 만들기" 클릭
3. 프로덕션 모드로 시작
4. 위치 선택 (RTDB와 동일)

#### 3.4 보안 규칙 설정 (중요!)

**Realtime Database 규칙** (개발용, 배포 전 수정 필요)
```json
{
  "rules": {
    "vibe": {
      "users": {
        "$uid": {
          ".read": true,
          ".write": "$uid === auth.uid"
        }
      },
      "chat": {
        ".read": "auth != null",
        ".write": "auth != null"
      }
    }
  }
}
```

**Firestore 규칙** (개발용)
```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /{document=**} {
      allow read, write: if request.auth != null;
    }
  }
}
```

### 4. 환경 변수 설정

#### 4.1 `.env.local` 파일 생성

프로젝트 루트에 `.env.local` 파일을 생성합니다:

```bash
# Firebase 설정
NEXT_PUBLIC_FIREBASE_API_KEY=your-api-key
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
NEXT_PUBLIC_FIREBASE_DATABASE_URL=https://your-project.firebaseio.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your-project-id
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your-project.appspot.com
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your-sender-id
NEXT_PUBLIC_FIREBASE_APP_ID=your-app-id
NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID=your-measurement-id
```

#### 4.2 환경 변수 채우기

Firebase Console의 프로젝트 설정에서 복사한 값을 붙여넣습니다.

**예시:**
```bash
NEXT_PUBLIC_FIREBASE_API_KEY=AIzaSyAbc123Def456Ghi789
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=vibe-study.firebaseapp.com
NEXT_PUBLIC_FIREBASE_DATABASE_URL=https://vibe-study-default-rtdb.asia-southeast1.firebasedatabase.app
NEXT_PUBLIC_FIREBASE_PROJECT_ID=vibe-study
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=vibe-study.appspot.com
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=123456789012
NEXT_PUBLIC_FIREBASE_APP_ID=1:123456789012:web:abc123def456
NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID=G-ABCD123456
```

### 5. 개발 서버 실행

```bash
npm run dev
# 또는
yarn dev
```

브라우저에서 http://localhost:3000 접속

### 6. 빌드 및 배포

#### 로컬 프로덕션 빌드
```bash
npm run build
npm run start
```

#### Vercel 배포 (권장)

**6.1 Vercel CLI 설치**
```bash
npm install -g vercel
```

**6.2 Vercel 로그인**
```bash
vercel login
```

**6.3 프로젝트 배포**
```bash
vercel
```

**6.4 환경 변수 설정**
- Vercel Dashboard → 프로젝트 → Settings → Environment Variables
- `.env.local`의 모든 변수를 추가

**6.5 프로덕션 배포**
```bash
vercel --prod
```

#### GitHub Actions CI/CD (선택)

`.github/workflows/deploy.yml` 생성:

```yaml
name: Deploy to Vercel

on:
  push:
    branches: [main]
  pull_request:
    branches: [main]

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '20'
      - run: npm ci
      - run: npm run build
      - uses: amondnet/vercel-action@v20
        with:
          vercel-token: ${{ secrets.VERCEL_TOKEN }}
          vercel-org-id: ${{ secrets.ORG_ID }}
          vercel-project-id: ${{ secrets.PROJECT_ID }}
```

### 7. Git 워크플로우

#### 7.1 브랜치 전략

```
main           ← 프로덕션 (배포)
  ↑
develop        ← 개발 통합
  ↑
feature/xxx    ← 기능 개발
```

#### 7.2 기능 개발 프로세스

```bash
# 1. develop 브랜치에서 시작
git checkout develop
git pull origin develop

# 2. 기능 브랜치 생성
git checkout -b feature/chat-group

# 3. 개발 및 커밋
git add .
git commit -m "feat: 그룹 채팅 기능 추가"

# 4. 원격 저장소에 푸시
git push origin feature/chat-group

# 5. GitHub에서 Pull Request 생성
# develop ← feature/chat-group

# 6. 코드 리뷰 후 머지
# 7. 로컬 브랜치 정리
git checkout develop
git pull origin develop
git branch -d feature/chat-group
```

#### 7.3 커밋 메시지 컨벤션

```
feat: 새로운 기능 추가
fix: 버그 수정
docs: 문서 수정
style: 코드 포맷팅 (기능 변경 없음)
refactor: 코드 리팩토링
test: 테스트 추가/수정
chore: 빌드, 설정 파일 수정
```

**예시:**
```bash
git commit -m "feat: 채팅방 목록 페이지 추가"
git commit -m "fix: 로그인 시 리다이렉트 오류 수정"
git commit -m "docs: README에 설치 가이드 추가"
```

### 8. 개발 도구 (추천)

#### VS Code 확장
- **ESLint**: 코드 품질 검사
- **Prettier**: 코드 포맷팅
- **Tailwind CSS IntelliSense**: Tailwind 자동완성
- **TypeScript**: 타입 체크
- **Firebase**: Firebase 관리
- **GitLens**: Git 히스토리

#### Chrome 확장
- **React Developer Tools**: React 디버깅
- **Redux DevTools**: 상태 관리 디버깅 (향후 사용 시)
- **Lighthouse**: 성능, SEO 분석

---

## 참고 문서

- [Next.js 공식 문서](https://nextjs.org/docs)
- [React 공식 문서](https://react.dev)
- [Firebase 공식 문서](https://firebase.google.com/docs)
- [Tailwind CSS 공식 문서](https://tailwindcss.com/docs)
- [TypeScript 공식 문서](https://www.typescriptlang.org/docs)

### 프로젝트 내부 문서

- [라우트 가이드](./routes.md)
- [채팅 기능 문서](./chat.md)
- [사용자 관리 문서](./user.md)

---

## 라이선스

MIT License

---

## 커뮤니티

- **카카오톡**: [한바보 바이브 코딩](https://open.kakao.com/o/gn2qMetf)
- **GitHub**: [thruthesky/vibe](https://github.com/thruthesky/vibe)
- **배포 사이트**: [vibers.kr](https://vibers.kr)

---

**Last Updated**: 2025-10-29

**Version**: 0.1.0

**Maintained by**: 한바보 (한국 바이브 보스) 커뮤니티
