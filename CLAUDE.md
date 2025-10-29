# CLAUDE.md

이 파일은 Claude Code(claude.ai/code)가 이 저장소에서 작업할 때 참고할 지침을 제공합니다.

---

## 📋 Standard Workflow (표준 작업 프로세스)

**⚠️ 중요: 모든 작업은 다음 워크플로우를 반드시 따라야 합니다.**

**🚨🚨🚨 최우선 규칙: 작업 완료 후 반드시 Vercel CLI로 배포하세요! 🚨🚨🚨**
- ⚡ **목표: 8초 이내 빠른 배포** - `vercel build` → `vercel deploy --prebuilt --prod --yes`
- 🚀 **실제 프로덕션(https://www.vibers.kr/)에서 즉시 테스트**
- ❌ **git push는 하지 않습니다!** git commit까지만 실행
- Vercel CLI 배포가 모든 작업의 최종 단계입니다

### 작업 시작 전 필수 단계

- [ ] **개발 웹 서버 상태 확인** ⚠️ **중요**
  - **로컬 개발 웹 서버는 항상 실행되고 있습니다**
  - **🚫 절대로 직접 `npm run dev`를 실행하지 마세요 🚫**
  - **허용되는 npm 명령어**:
    - ✅ `npm install` 또는 `npm i` - 새로운 패키지/모듈 설치 가능
    - ✅ `npm run build` - 프로덕션 빌드 가능
    - ✅ `npm run lint` - 린트 검사 가능
    - ❌ `npm run dev` - **절대 실행 금지**
  - 만약 개발 웹 서버가 동작하고 있지 않다면:
    - 개발자에게 알려주세요
    - 개발자가 직접 `npm run dev`를 실행/재시작하도록 안내하세요
  - 서버 상태 확인: `lsof -i :3000` (포트 3000에 node 프로세스가 있는지 확인)

- [ ] **1단계**: 현재 작업 상태 확인 (`git status`)
- [ ] **2단계**: 변경사항 스테이징 및 커밋 (`git commit -a -m "..."`)
  - 모든 작업을 진행하기 전에 **반드시** 기존 변경사항을 커밋하세요
  - 커밋 메시지 예: `"회원가입 페이지 스타일 수정"`

### 작업 진행 단계

- [ ] **3단계**: **`@docs/` 하위 문서 반드시 참고** ⚠️ **필수**
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

- [ ] **4단계**: 작업 내용 파악 및 계획 수립
- [ ] **5단계**: 코드 작성/수정 진행
  - **React 19.2 사용 필수** ⚠️
    - 반드시 React 19.2 버전 사용
    - Memoization이 필요한 경우 **React Compiler** 사용
    - ❌ **절대 금지**: `useMemo`, `useCallback`, `React.memo` 사용 금지
    - React Compiler는 자동으로 최적화를 수행합니다
    - 참고 문서:
      - [React Compiler](https://react.dev/learn/react-compiler)
      - [React Compiler Installation](https://react.dev/learn/react-compiler/installation)
- [ ] **6단계**: 테스트 실행 (필요시)
  - **테스트, E2E, 디버깅, 검증** 관련 요청 시 → `@.claude/skills/test/SKILL.md` 문서 참고
  - Playwright MCP 또는 Chrome DevTools MCP 사용
  - 테스트 결과 검증

### 작업 완료 단계 (🚨 마지막은 반드시 Vercel CLI 배포! 🚨)

- [ ] **7단계**: UTF-8 인코딩 검증 (문서/코드 수정/생성 시 필수!)
  - **모든 문서 파일(*.md)과 소스 코드(*.ts, *.tsx, *.js, *.css 등)는 반드시 UTF-8 인코딩**
  - 인코딩 확인 명령어 (macOS/Linux):
    ```bash
    file -I <파일명>
    ```
  - 정상 출력: `charset=utf-8` ✅
  - 잘못된 경우 UTF-8 인코딩 변환 필요 (VSCode에서 우측 하단 "CRLF" → "UTF-8" 선택)

- [ ] **8단계**: 최종 변경사항 커밋
  - 커밋 메시지에 작업 내용 명확히 기재
  - 예: `"로그인 기능 검증 완료 및 오류 수정 (UTF-8 인코딩 확인완료)"`

- [ ] **9단계**: 🚨🚨🚨 Vercel CLI로 빠른 배포 🚨🚨🚨 **🔥 최우선 배포 방법 🔥**
  - **⚡ 목표: 8초 이내에 빌드 및 배포 완료**
  - **🚀 실제 프로덕션 환경(https://www.vibers.kr/)에서 즉시 테스트**
  - **❌ 중요: git push는 하지 않습니다! git commit까지만 실행하세요**

  **배포 프로세스 (2단계):**

  1. **로컬 빌드 실행** (Build Output API 산출물 생성)
     ```bash
     vercel build
     ```
     - `.vercel/output/` 폴더에 Vercel 규격 산출물 생성
     - 원격 설치/빌드 과정 전부 생략 가능 ⚡

  2. **결과물만 업로드하여 즉시 프로덕션 배포** (⚡ 가장 빠른 방법)
     ```bash
     vercel deploy --prebuilt --prod --yes
     ```
     - `--prebuilt`: .vercel/output만 업로드 (소스코드 미전송)
     - `--prod`: 프로덕션 URL로 바로 배포
     - `--yes`: 비대화형 (질문 없이 진행)

  **⚡ 왜 이 방식이 가장 빠른가?**
  - ✅ **원격 설치/빌드 생략** — 원격에서 npm install, next build 등을 모두 생략
  - ✅ **소스코드 미전송** — .vercel/output만 업로드하므로 속도 ↑, 보안 ↑
  - ✅ **즉시 프로덕션 배포** — --yes --prod로 승인 절차 없이 바로 배포
  - ✅ **Git Integration보다 압도적으로 빠름** — 체감 속도 최대 10배 이상

  **⚠️ 주의사항:**
  - Vercel CLI는 이미 설치 및 링크되어 있습니다 (`vercel link --yes`)
  - 배포 실패 시: 직접 해결하지 말고 개발자에게 알려주세요
  - 환경 변수 필요 시: 개발자에게 `vercel env pull .env.local` 실행 요청

  **✅ 배포 성공 확인:**
  - 터미널에서 배포 URL 확인 (https://www.vibers.kr/)
  - Playwright MCP 또는 Chrome DevTools MCP로 실제 프로덕션 환경 테스트

  **🔥🔥🔥 Vercel CLI 배포가 완료되면 작업이 완료됩니다! 🔥🔥🔥**

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

### 개발 서버 시작
```bash
npm run dev
```
- **포트**: http://localhost:3000
- **핫 리로드**: 파일 변경 시 자동으로 브라우저 새로고침됨
- **Turbopack**: 빠른 번들링을 위해 Turbopack 사용

### 프로덕션 빌드
```bash
npm run build
```
- TypeScript 컴파일 및 최적화된 번들 생성
- `.next` 디렉토리에 빌드 결과물 생성

### 프로덕션 서버 시작
```bash
npm run start
```
- `npm run build` 후에 실행해야 함
- 프로덕션 환경에서의 성능을 테스트할 때 사용

---

## 코드 아키텍처

### 디렉토리 구조

```
vibe/
├── app/                    # Next.js App Router 기반 페이지
│   ├── auth/               # 인증 관련 페이지
│   │   ├── signup/         # 회원가입 페이지
│   │   └── login/          # 로그인 페이지
│   ├── login/              # 로그인 페이지 (호환성)
│   ├── layout.tsx          # 루트 레이아웃
│   └── page.tsx            # 홈페이지
├── lib/                    # 유틸리티 함수 및 설정
│   ├── firebase.ts         # Firebase 초기화 및 서비스 export
│   ├── auth.ts             # 인증 관련 함수 (회원가입, 로그인, 로그아웃)
│   └── utils.ts            # 기타 유틸리티 함수
├── node_modules/           # 의존성 패키지
├── package.json            # 프로젝트 메타데이터 및 의존성
└── tsconfig.json           # TypeScript 설정
```

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
3. 개발 서버 재시작 (`npm run dev`)

### 모듈 import 오류
- `tsconfig.json`의 `baseUrl`과 `paths` 설정 확인
- 현재 `@/*`로 프로젝트 루트부터 import 가능

### 스타일 적용 안 됨
- Tailwind CSS 클래스 이름 확인
- PostCSS 설정이 올바른지 확인 (`postcss.config.mjs`)
- 개발 서버 재시작

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
