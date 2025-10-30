# CLAUDE.md

이 파일은 Claude Code(claude.ai/code)가 이 저장소에서 작업할 때 참고할 지침을 제공합니다.

---

## 📋 Standard Workflow (표준 작업 프로세스)

**⚠️ 중요: 모든 작업은 다음 워크플로우를 반드시 따라야 합니다.**

**🚨🚨🚨 최우선 규칙: 코드 수정 후 즉시 프로덕션 배포하세요! 🚨🚨🚨**
- ⚡ **목표: 코드 수정 → 즉시 프로덕션 배포 → 실서비스 반영**
- 🚀 **작업 순서**: 코드 수정 완료 → **프로덕션 배포 (완료까지 기다림)** → UTF-8 인코딩 검증 → git commit & push
- ✅ **이유**: 실제 서비스 환경(https://www.vibers.kr/)에 즉시 반영하여 실서비스 검증
- ✅ **배포 모드**:
  - **기본 배포 (프로덕션)**: `npm run deploy` - 항상 기본으로 사용
  - **Preview 배포**: `npm run preview` - 개발자가 명시적으로 "preview" 또는 "프리뷰" 배포 요청 시에만 사용
- **프로덕션 배포 명령어**: `npm run deploy` (빌드 후 프로덕션 배포, 배포 완료까지 기다림)

### 작업 진행 단계

- [ ] **1단계**: **`@docs/` 하위 문서 반드시 참고** ⚠️ **필수**
  - **🔥 중요**: 어떤 작업이든 시작하기 전에 **반드시** `/docs/` 폴더의 관련 문서를 읽고 참고하세요
  - **문서를 먼저 읽는 것이 바뀐 코드와 혼동을 피합니다**

  **📍 요청 유형별 참고 문서:**
  - **페이지 이동/링크 관련** → `@docs/routes.md` 반드시 참고
    - 새로운 링크 추가 시
    - 페이지 라우트 변경 시
    - 네비게이션 추가 시
  - **사용자 관련** → `@docs/user.md` 반드시 참고
    - 회원 정보 수정/관리 요청
    - 사용자 프로필 기능
    - 사용자 데이터 저장/조회
  - **채팅 관련** → `@docs/chat.md` 반드시 참고
    - 1:1 채팅 기능
    - 메시지 동기화
    - 채팅방 관리
  - **기타 기능** → 해당하는 `@docs/` 문서 찾아서 참고

  **✅ 작업 완료 후:**
  - 참고한 모든 문서를 개발자에게 알려주세요
  - 예: "user.md와 routes.md 문서를 참고했습니다"

- [ ] **2단계**: 작업 내용 파악 및 계획 수립
- [ ] **3단계**: 코드 작성/수정 진행
  - **React 19.2 사용 필수** ⚠️
    - 반드시 React 19.2 버전 사용
    - Memoization이 필요한 경우 **React Compiler** 사용
    - ❌ **절대 금지**: `useMemo`, `useCallback`, `React.memo` 사용 금지
    - React Compiler는 자동으로 최적화를 수행합니다
    - 참고 문서:
      - [React Compiler](https://react.dev/learn/react-compiler)
      - [React Compiler Installation](https://react.dev/learn/react-compiler/installation)

### 작업 완료 단계 (🚨 코드 수정 후 즉시 프로덕션 배포! 🚨)

- [ ] **4단계**: 🚨🚨🚨 프로덕션 배포 (완료될 때까지 기다림) 🚨🚨🚨 **🔥 코드 수정 후 가장 먼저 실행! 🔥**

  **⚡ 기본 배포 모드: 프로덕션 (항상 사용)**

  ```bash
  npm run deploy
  ```

  - **프로덕션 배포 특징**:
    - 빌드 (`vercel build`) + 프로덕션 배포 (`vercel deploy --prod --yes`)를 한 번에 실행
    - 실제 서비스 URL로 직접 배포 (https://www.vibers.kr/)
    - **배포가 완료될 때까지 기다린 후 다음 단계 진행**
    - ✅ **배포 완료 확인**: https://www.vibers.kr/ 에서 변경사항 확인

  - **🚀 실서비스에서 검증**
    - 프로덕션 배포가 완료되면 실제 서비스 URL(https://www.vibers.kr/)에서 즉시 검증
    - 실제 사용자가 사용할 환경에서 정확한 동작 검증 가능

  **⚠️ Preview 배포 (명시적 요청 시에만)**

  개발자가 **"preview"** 또는 **"프리뷰"** 배포를 명시적으로 요청한 경우에만:

  ```bash
  npm run preview
  ```

  - **Preview 배포 특징**:
    - 빌드 (`vercel build`) + Preview 배포 (`vercel deploy --prebuilt --yes`)를 한 번에 실행
    - Preview URL 생성 (예: `https://vibe-abc123.vercel.app`)
    - **배포가 완료될 때까지 기다림**
    - Preview URL에서 테스트 (프로덕션 반영 전 사전 검증 목적)

  **⚠️ 주의사항:**
  - Vercel CLI는 이미 설치 및 링크되어 있습니다
  - **기본 배포는 항상 프로덕션**: `npm run deploy` 사용
  - **Preview 배포**: 개발자가 명시적으로 요청한 경우에만 `npm run preview` 사용
  - 배포 실패 시: 직접 해결하지 말고 개발자에게 알려주세요
  - 환경 변수 필요 시: 개발자에게 `vercel env pull .env.local` 실행 요청

- [ ] **5단계**: 배포 이후 작업 (병렬 실행) ⚠️ **배포 완료 후 백그라운드에서 동시 실행**

  **🚀 배포 완료 후 다음 작업들을 백그라운드에서 동시에 실행합니다:**

  #### 5-1. UTF-8 인코딩 검증 (문서/코드 수정/생성 시 필수!)
  - **모든 문서 파일(*.md)과 소스 코드(*.ts, *.tsx, *.js, *.css 등)는 반드시 UTF-8 인코딩**
  - 인코딩 확인 명령어 (macOS/Linux):
    ```bash
    file -I <파일명>
    ```
  - 정상 출력: `charset=utf-8` ✅
  - 잘못된 경우 UTF-8 인코딩 변환 필요 (VSCode에서 우측 하단 "CRLF" → "UTF-8" 선택)

  #### 5-2. 최종 변경사항 커밋 및 푸시
  - 커밋 메시지에 작업 내용 명확히 기재
  - 예: `"feat: AI 명언 섹션 추가"`
  - **git commit 후 즉시 git push 실행**
  - 명령어:
    ```bash
    git add -A && git commit -m "커밋 메시지" && git push
    ```

  #### 5-3. 테스트 실행 (필요시)
  - **테스트, E2E, 디버깅, 검증** 관련 요청 시 → `@.claude/skills/test/SKILL.md` 문서 참고
  - Playwright MCP 또는 Chrome DevTools MCP 사용
  - 🚀 **⚠️ 중요: Preview URL 또는 프로덕션 사이트에서 테스트하세요**
    - ✅ **기본 테스트**: Preview URL (예: `https://vibe-abc123.vercel.app`)에서 테스트
    - ✅ **프로덕션 테스트**: 프로덕션 배포 후 https://www.vibers.kr/ 에서 테스트
    - ❌ **절대로 localhost:3000에서 테스트하면 안 됨**
    - 이유: 실제 배포 환경에서만 정확한 동작 검증 가능

  #### 5-4. 빌드 날짜/버전 업데이트 ⚠️ **개발자가 명시적으로 요청한 경우에만 실행**
  - **🔥 트리거 조건**: 개발자가 **"빌드 날짜 업데이트"** 또는 **"버전 업데이트"**라고 명시적으로 요청할 때만 실행
  - **구현 위치**: 다음 **두 파일 모두** 업데이트 필수
    - [components/left-sidebar.tsx](components/left-sidebar.tsx) - 사이드바 빌드 버전 표시
    - [components/floating-button.tsx](components/floating-button.tsx) - 플로팅 버튼 버전 표시
  - **🚨 중요**: 두 파일 모두 같은 Unix timestamp로 업데이트하여 버전을 동기화해야 합니다
  - **빌드 날짜 형식**: "YY-MM-DD HH:II [오전/오후]"
  - **구현 방법**:
    - 소스 코드에는 `const buildTimestamp = 1234567890;` 형태로 Unix timestamp 저장
    - 웹 브라우저에서는 사용자의 브라우저 언어에 맞게 `Intl` API 사용하여 표시
    - 예시 코드:
      ```tsx
      // 빌드 타임스탬프 (Unix timestamp - 밀리초)
      const buildTimestamp = Date.now();

      // 사용자 브라우저 언어에 맞게 날짜 포맷팅
      const buildDate = new Intl.DateTimeFormat(navigator.language, {
        year: '2-digit',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
        hour12: true
      }).format(new Date(buildTimestamp));
      ```
  - **중요**: 명시적 요청이 없으면 날짜 업데이트를 하지 않음

### ⚠️ 마크다운 링크 작성 시 공백 처리 (Markdown Link Whitespace)

마크다운에서 링크를 작성할 때 **링크 URL의 맨 끝에 공백을 추가**해야 합니다:

**❌ 잘못된 방식** (링크가 깨짐):
```markdown
[한바보 단톡방](https://open.kakao.com/o/gn2qMetf)
```
결과: URL이 `https://open.kakao.com/o/gn2qMetf)%EC%9D%98` 처럼 변환됨

**✅ 올바른 방식** (링크 끝에 공백 추가):
```markdown
[한바보 단톡방](https://open.kakao.com/o/gn2qMetf )
```
끝에 공백 한 개를 추가하면 링크가 올바르게 동작합니다.

**적용 위치**:
- 모든 외부 링크 (예: 카카오 오픈톡, 깃허브 등)
- 특히 한글 텍스트 다음의 마크다운 링크에서 필수

**🔥🔥🔥 작업 완료 후 순서:**
1. **코드 수정 완료**
2. **프로덕션 배포 실행** ← 가장 먼저! (배포 완료까지 기다림)
3. **배포 완료 후 다음 작업들을 백그라운드에서 동시 실행**:
   - UTF-8 인코딩 검증
   - git commit & push
   - 테스트 실행 (필요시)
   - 버전 업데이트 (개발자 명시적 요청 시에만)

**⚠️ Preview 배포는 개발자가 명시적으로 요청한 경우에만!**

### 테스트 및 검증 가이드

개발자가 다음과 같은 표현으로 요청할 때는 **반드시** 테스트를 수행하세요:

- 🧪 **"테스트해줄래?"** → E2E 테스트 수행
- 🔍 **"검증해주세요"** → 기능 동작 검증
- 🐛 **"디버깅해줘"** → Chrome DevTools MCP로 디버깅
- 🚀 **"E2E 테스트"** → Playwright MCP로 자동화 테스트

**참고 문서**: `@.claude/skills/test/SKILL.md`
- Playwright MCP 사용법
- Chrome DevTools MCP 사용법
- 실전 테스트 예제
- 트러블슈팅 가이드

#### 테스트 계정 로그인 방법

테스트를 수행할 때는 다음 방법으로 로그인하세요:

1. **로그인 페이지 접속**: https://www.vibers.kr/auth/login
2. **테스트 계정 정보**:
   - **이메일**: apple@test.com, banana@test.com 등
   - **비밀번호**: 12345a,*
3. **대체 방법 - Floating Button 사용**:
   - 홈페이지 접속: https://www.vibers.kr/
   - 하단 오른쪽의 개발 Floating Button 클릭
   - Floating button에서 제공하는 테스트 계정으로 로그인

**⚠️ 로그인이 필요한 기능 테스트 시**: 위 로그인 페이지에서 테스트 계정으로 로그인하세요.

---

## 📍 홈페이지 주요 경로

프로덕션 사이트의 주요 경로는 다음과 같습니다:

### 인증 및 사용자 관련
- **홈페이지**: https://www.vibers.kr/
- **로그인**: https://www.vibers.kr/auth/login
- **프로필 수정**: https://www.vibers.kr/profile
- **사용자 목록**: https://www.vibers.kr/users

### 채팅 관련
- **채팅방 입장**: https://www.vibers.kr/chat/room?otherId=xxx
  - `otherId`는 대화 상대방의 UID

#### 채팅방 입장 절차

채팅 기능을 테스트하려면 다음 순서를 따르세요:

1. **테스트 계정 로그인**: https://www.vibers.kr/auth/login
   - 이메일: apple@test.com, banana@test.com 등
   - 비밀번호: 12345a,*
2. **사용자 목록 접속**: https://www.vibers.kr/users
3. **채팅 상대 선택**: 사용자 목록에서 원하는 사용자 선택하여 채팅방 입장

---

## 프로젝트 개요

**Vibe**는 바이브 웹/앱 개발 스터디 프로젝트로, 협업을 통해 소셜 웹 애플리케이션을 개발하는 프로젝트입니다.

- **설명**: 사용자 인증, 게시판 CRUD, 채팅, 알림 기능을 포함한 소셜 플랫폼
- **협업 방식**: 세미나 시간 내에서만 개발/스터디 진행
- **기술 스택**: Next.js 16, React 19, TypeScript, Tailwind CSS, Firebase

---

## 개발 환경 설정

### 필수 환경 변수

`.env.local` 파일에 다음 Firebase 설정 정보를 추가하세요:

```env
NEXT_PUBLIC_FIREBASE_API_KEY=
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=
NEXT_PUBLIC_FIREBASE_DATABASE_URL=
NEXT_PUBLIC_FIREBASE_PROJECT_ID=
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=
NEXT_PUBLIC_FIREBASE_APP_ID=
NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID=
```

> **주의**: NEXT_PUBLIC_* 접두사가 붙은 환경 변수는 클라이언트에 노출되므로 민감한 정보(비밀 API 키 등)는 포함하면 안 됩니다.

---

## 자주 사용되는 명령어

### 프로덕션 배포 (기본 배포)
```bash
npm run deploy
```
- **가장 많이 사용하는 명령어**: 코드 수정 후 항상 실행
- Vercel 빌드 + 프로덕션 배포를 한 번에 실행
- 실제 서비스 URL(https://www.vibers.kr/)에 즉시 배포
- 배포가 완료될 때까지 기다린 후 다음 단계 진행

### Preview 배포 (명시적 요청 시에만)
```bash
npm run preview
```
- **주의**: 개발자가 명시적으로 "preview" 또는 "프리뷰" 배포 요청 시에만 사용
- Preview URL이 생성되어 프로덕션 반영 전 사전 검증 가능
- 필요시 Preview에서 테스트 후 확인

---

## 코드 아키텍처

### 디렉토리 구조

전체 프로젝트 구조와 디렉토리 설명은 [@docs/project-overview.md](../docs/project-overview.md)를 참고하세요.

### 핵심 모듈 설명

#### `lib/firebase.ts`
- Firebase 앱 초기화
- 다음 서비스를 제공합니다:
  - **auth**: Firebase Authentication (사용자 인증)
  - **db**: Cloud Firestore (데이터베이스)
  - **rtdb**: Firebase Realtime Database (실시간 데이터)
- 환경 변수에서 Firebase 설정 읽음

#### `lib/auth.ts`
인증 관련 함수들:
- **signUp(email, password, displayName)**: 새 사용자 회원가입
- **signIn(email, password)**: 기존 사용자 로그인
- **logOut()**: 사용자 로그아웃
- **getCurrentUser()**: 현재 로그인한 사용자 정보 조회

모든 함수는 `{ success: boolean, user?: {...}, error?: string }` 형태의 결과를 반환합니다.

### 페이지 라우팅

Next.js App Router를 사용하므로:
- `/app/page.tsx` → `/`
- `/app/auth/login/page.tsx` → `/auth/login`
- `/app/auth/signup/page.tsx` → `/auth/signup`

---

## 기술 스택

### 프론트엔드
- **Next.js 16**: React 기반 풀스택 프레임워크
- **React 19**: UI 라이브러리
- **TypeScript**: 타입 안전성
- **Tailwind CSS 4**: 유틸리티 기반 CSS 프레임워크
- **shadcn/ui**: 접근성 높은 UI 컴포넌트 라이브러리
- **Lucide React**: 아이콘 라이브러리

### 백엔드
- **Next.js App Router**: 라우팅 및 API 엔드포인트
- **Firebase Authentication**: 사용자 인증 관리
- **Cloud Firestore**: NoSQL 데이터베이스
- **Firebase Realtime Database**: 실시간 데이터 동기화

### 개발 도구
- **TypeScript 5.9**: 컴파일러 및 타입 체킹
- **Tailwind CSS 4**: CSS 프레임워크 (PostCSS 통합)
- **Autoprefixer**: CSS 벤더 프리픽스 자동 추가

---

## 주요 특징

프로젝트의 주요 기술적 특징은 [@docs/project-overview.md](../docs/project-overview.md#주요-특징)를 참고하세요.

---

## 코딩 가이드라인

### 프레임워크 버전 관리

**⚠️ 중요: 반드시 최신 버전을 사용하세요**

- **React.js**: 반드시 최신 버전인 **19.2 버전**에 맞추어 코딩합니다
  - React 19의 새로운 기능과 API 사용
  - 최신 Hook 및 패턴 활용

- **Next.js**: 반드시 최신 버전인 **[Next.js 16](https://nextjs.org/blog/next-16)** 에 맞추어 개발합니다
  - Turbopack 기본 사용
  - App Router 우선 사용
  - 최신 기능 및 최적화 적용

### 한글 주석 사용
프로젝트의 모든 코드는 한글로 자세한 주석을 포함합니다:
```typescript
// Firebase 초기화
const app = initializeApp(firebaseConfig);

// 인증 서비스 가져오기
export const auth: Auth = getAuth(app);
```

### 환경 변수 (NEXT_PUBLIC_ 접두사)
클라이언트에서 접근해야 하는 환경 변수는 `NEXT_PUBLIC_` 접두사를 사용합니다:
- Firebase 설정 정보는 모두 `NEXT_PUBLIC_` 사용 (클라이언트 라이브러리이므로)

### TypeScript 타입 안전성
- 엄격한 타입 지정
- Firebase 서비스에서 제공하는 타입 활용 (Auth, Firestore, Database)
- 에러 처리 시 타입 안전성 유지

### Firebase Realtime Database (RTDB) 작업 지침
**모든 정보는 실시간 업데이트를 해야 합니다.**

- **데이터 조회 방식**: RTDB에서 데이터를 가져오는 경우, 모든 데이터를 `listen(observe)` 하여 실시간 업데이트를 구현해야 합니다.
  - Firebase의 `onValue()` 함수를 사용하여 데이터 변화를 감시
  - 일회성 조회(`get()`)는 가능한 한 피하고, 항상 리스너를 등록하기

- **화면 반영**: 회원 정보, 사용자 목록, 채팅 등에서 DB의 데이터가 변경되면, 자동으로 화면에 적용되어야 합니다.
  - 다른 사용자가 정보를 수정하면 즉시 반영
  - 채팅 메시지가 추가되면 즉시 화면에 표시
  - 사용자 프로필 사진이 변경되면 모든 곳에서 즉시 업데이트

- **메모리 관리**: 컴포넌트 언마운트 시 리스너를 반드시 제거하여 메모리 누수 방지
  ```typescript
  const unsubscribe = onValue(ref(db, 'path'), (snapshot) => {
    // 데이터 처리
  });

  // 언마운트 시 리스너 제거
  return () => unsubscribe();
  ```

---

## 🎨 디자인 가이드라인 (Design Guidelines)

모든 페이지와 컴포넌트는 다음 디자인 원칙을 따릅니다:

### 디자인 원칙

**1. Tailwind CSS와 shadcn/ui 적극 활용**
- 모든 스타일링은 **Tailwind CSS 클래스**로 구현
- shadcn/ui 컴포넌트 활용으로 일관된 UI 유지
- 인라인 스타일(`style={}`)은 최소화 (필요시만 사용)

**2. 단조롭고 모던한 스타일**
- **복잡한 구성요소 금지**: 과도한 장식이나 복잡한 UI 요소 제거
- **그라디언트 금지**: 선형 그라디언트 등 화려한 효과 사용 금지
- **신뢰성 있는 색상**: Slate, Gray, White 등 무채색과 기본 색상 중심
- **모던한 느낌**: 미니멀하면서도 세련된 디자인 추구

**3. 색상 팔레트**
- **배경**: `bg-background` (흰색/어두운 배경)
- **텍스트**: `text-foreground`, `text-muted-foreground`
- **강조**: `bg-slate-900`, `bg-slate-800`, `bg-slate-600` 등
- **상태**: `bg-red-50`, `bg-green-50`, `bg-yellow-50` (에러, 성공, 경고)

**4. 가독성 높은 디자인**
- **충분한 여백**: `p-6`, `py-8`, `space-y-4` 등으로 명확한 간격
- **명확한 계층 구조**: 제목 크기로 시각적 중요도 표현
- **적절한 글꼴 크기**: `text-sm`, `text-base`, `text-lg`, `text-3xl` 등
- **높은 명도 대비**: 텍스트와 배경의 충분한 대비

**5. 디자인 일관성**
- **모든 페이지에 동일한 스타일 적용**
- **버튼 스타일 통일**:
  - 주요 버튼: `bg-slate-900 hover:bg-slate-800 text-white font-medium rounded-lg`
  - 보조 버튼: `bg-slate-100 hover:bg-slate-200 text-foreground`
  - 위험 버튼: `bg-red-50 border border-red-200 text-red-700`
- **입력 필드 통일**: `border border-slate-200 rounded-lg focus:ring-2 focus:ring-slate-400`
- **카드/섹션 통일**: `bg-slate-50 border border-slate-200 rounded-lg p-6`

**6. 금지 사항**
- ❌ **그라디언트 배경** (`linear-gradient` 등)
- ❌ **화려한 색상** (원색, 네온 색상)
- ❌ **과도한 애니메이션** (장시간 재생되는 애니메이션)
- ❌ **복잡한 레이아웃** (많은 중첩 구조)
- ❌ **숨겨진 콘텐츠** (사용자가 발견하기 어려운 요소)

### 구현 예시

**카드 섹션:**
```tsx
<div className="bg-slate-50 border border-slate-200 rounded-lg p-6 space-y-4">
  <h2 className="text-lg font-semibold text-foreground">제목</h2>
  <p className="text-muted-foreground">설명 텍스트</p>
</div>
```

**버튼:**
```tsx
<button className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white font-medium rounded-lg transition-colors">
  버튼
</button>
```

**입력 필드:**
```tsx
<input
  className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-400 bg-white text-foreground placeholder-muted-foreground"
  placeholder="입력하세요..."
/>
```

---

## Firebase 설정 가이드

### 1. Firebase 프로젝트 생성
- [Firebase Console](https://console.firebase.google.com)에서 새 프로젝트 생성

### 2. 웹 앱 등록
- 프로젝트 설정 > 앱 추가 > 웹
- 생성된 설정 정보 복사

### 3. Firebase 서비스 활성화
- **Authentication**: 이메일/비밀번호 로그인 활성화
- **Cloud Firestore**: 데이터베이스 생성 (테스트 모드 또는 보안 규칙 설정)
- **Realtime Database**: 필요 시 활성화 (채팅 기능 등)

### 4. .env.local 파일에 설정 추가
```env
NEXT_PUBLIC_FIREBASE_API_KEY=<your-api-key>
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=<your-auth-domain>
...
```

---

## 트러블슈팅

### Firebase 연결 오류
1. `.env.local`에 환경 변수가 올바르게 설정되었는지 확인
2. `NEXT_PUBLIC_` 접두사가 있는지 확인

### 모듈 import 오류
- `tsconfig.json`의 `baseUrl`과 `paths` 설정 확인
- 현재 `@/*`로 프로젝트 루트부터 import 가능

### 스타일 적용 안 됨
- Tailwind CSS 클래스 이름 확인
- PostCSS 설정이 올바른지 확인 (`postcss.config.mjs`)

---

## 📚 라우트 참고 문서

**⚠️ 중요: 페이지 이동, 링크 추가, 라우트 변경 요청을 받은 경우 반드시 아래 문서를 참고하세요**

### 참고 문서: `@docs/routes.md`

모든 페이지 라우트와 설명은 `@docs/routes.md`에 기록되어 있습니다.

**다음과 같은 요청을 받았을 때 참고하세요:**
- 🔗 새로운 페이지 링크 추가
- 🛣️ 페이지 라우트 변경/이동
- 📍 네비게이션 메뉴 추가/수정
- 🚀 페이지 간 네비게이션 흐름 설계

**문서 구성:**
1. **홈 및 기본 라우트** - `/` 등 기본 페이지
2. **인증 라우트** - `/auth/login`, `/auth/signup` 등
3. **사용자 관련 라우트** - `/users`, `/profile` 등
4. **채팅 라우트** - `/chat/room` 등
5. **메뉴 라우트** - `/menu` 등
6. **개발 관련 라우트** - `/dev/history` 등
7. **라우트 네비게이션 맵** - 전체 구조도
8. **라우트 작업 체크리스트** - 새 라우트 추가 시 확인사항

---

## 📚 사용자 관련 기능 참고 문서

**⚠️ 중요: 사용자(회원) 관련 요청을 받은 경우 반드시 아래 문서를 참고하세요**

### 참고 문서: `@docs/user.md`

사용자 관리 시스템에 대한 모든 상세 정보는 `@docs/user.md`에 기록되어 있습니다.

**다음과 같은 요청을 받았을 때 참고하세요:**
- 🧑 회원 정보 수정 관련 요청
- 👥 사용자 프로필 기능 요청
- 💾 사용자 데이터 저장/조회
- 🗄️ Firebase Realtime Database (RTDB) 관련 작업
- 🔍 사용자 검색, 목록 기능

**문서 구성:**
1. **데이터 구조** - 사용자 정보가 어떻게 저장되는지
2. **주요 기능** - 현재 구현된 기능 목록
3. **API 함수** - `lib/user.ts`의 모든 함수 설명
4. **페이지/라우트** - 사용자 관련 모든 페이지
5. **Firebase RTDB 구조** - 데이터베이스 경로 및 데이터 형식
6. **보안 고려사항** - Firebase 보안 규칙 예시

---

## 📚 채팅 기능 참고 문서

**⚠️ 중요: 채팅 관련 요청을 받은 경우 반드시 아래 문서를 참고하세요**

### 참고 문서: `@docs/chat.md`

1:1 채팅 시스템에 대한 모든 상세 정보는 `@docs/chat.md`에 기록되어 있습니다.

**다음과 같은 요청을 받았을 때 참고하세요:**
- 💬 1:1 채팅 기능 관련 요청
- 🛣️ 채팅방 라우트(`/chat/room`) 관련 작업
- 💾 채팅 메시지 저장/조회
- 🔄 실시간 메시지 동기화
- 🔍 채팅방 목록, 사용자 검색 기능

**문서 구성:**
1. **데이터 구조** - 메시지와 채팅방이 어떻게 저장되는지
2. **API 함수** - `lib/chat.ts`의 모든 함수 설명
3. **페이지/라우트** - 채팅 관련 모든 페이지
4. **Firebase RTDB 구조** - 데이터베이스 경로 및 데이터 형식
5. **보안 고려사항** - Firebase 보안 규칙 예시

---

## 협업 팁

### Git 워크플로우
1. 기능별 브랜치 생성
2. 변경사항 커밋
3. PR(Pull Request) 생성
4. 코드 리뷰 후 병합

### 코드 리뷰 시 확인사항
- TypeScript 타입 안전성
- 환경 변수 사용 (민감한 정보 노출 여부)
- Firebase 보안 규칙 (데이터 접근 권한)
- 한글 주석 포함 여부

---

## 향후 구현 예정 기능

- 게시판 CRUD 기능 (SEO, 무한 스크롤, 댓글)
- 채팅 기능 (1:1, 그룹)
- 알림 기능 (푸시, 이메일)
